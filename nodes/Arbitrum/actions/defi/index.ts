import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getProvider, validateAddress, getSigner } from '../../transport/provider';
import { ARBITRUM_NETWORKS, ARBITRUM_ONE_TOKENS, DEX_ROUTERS, CHAINLINK_FEEDS, ABIS } from '../../constants';
import { ethers } from 'ethers';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['defi'],
			},
		},
		options: [
			{
				name: 'Get Token Price',
				value: 'getTokenPrice',
				description: 'Get token price from Chainlink oracles or DEX',
				action: 'Get token price',
			},
			{
				name: 'Get Swap Quote',
				value: 'getSwapQuote',
				description: 'Get a quote for swapping tokens',
				action: 'Get swap quote',
			},
			{
				name: 'Execute Swap',
				value: 'executeSwap',
				description: 'Execute a token swap on a DEX',
				action: 'Execute swap',
			},
			{
				name: 'Get Liquidity Pools',
				value: 'getLiquidityPools',
				description: 'Get liquidity pool information',
				action: 'Get liquidity pools',
			},
			{
				name: 'Get Pool Info',
				value: 'getPoolInfo',
				description: 'Get detailed information about a liquidity pool',
				action: 'Get pool info',
			},
			{
				name: 'Get TVL',
				value: 'getTvl',
				description: 'Get Total Value Locked for a protocol or pool',
				action: 'Get tvl',
			},
			{
				name: 'Get Yield Farms',
				value: 'getYieldFarms',
				description: 'Get yield farming opportunities',
				action: 'Get yield farms',
			},
			{
				name: 'Approve and Swap',
				value: 'approveAndSwap',
				description: 'Approve token spending and execute swap in one flow',
				action: 'Approve and swap',
			},
		],
		default: 'getTokenPrice',
	},
];

export const fields: INodeProperties[] = [
	// Token Selection for Price
	{
		displayName: 'Token',
		name: 'token',
		type: 'options',
		required: true,
		default: 'ETH',
		options: [
			{ name: 'ETH', value: 'ETH' },
			{ name: 'BTC', value: 'BTC' },
			{ name: 'ARB', value: 'ARB' },
			{ name: 'USDC', value: 'USDC' },
			{ name: 'USDT', value: 'USDT' },
			{ name: 'DAI', value: 'DAI' },
			{ name: 'LINK', value: 'LINK' },
			{ name: 'UNI', value: 'UNI' },
			{ name: 'GMX', value: 'GMX' },
			{ name: 'WBTC', value: 'WBTC' },
			{ name: 'Custom', value: 'custom' },
		],
		description: 'The token to get price for',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getTokenPrice'],
			},
		},
	},
	{
		displayName: 'Custom Feed Address',
		name: 'customFeedAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Chainlink price feed address for custom token',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getTokenPrice'],
				token: ['custom'],
			},
		},
	},
	// DEX Selection
	{
		displayName: 'DEX',
		name: 'dex',
		type: 'options',
		required: true,
		default: 'uniswapV3',
		options: [
			{ name: 'Uniswap V3', value: 'uniswapV3' },
			{ name: 'SushiSwap', value: 'sushiswap' },
			{ name: 'Camelot', value: 'camelot' },
			{ name: '1inch', value: 'oneInch' },
			{ name: 'GMX', value: 'gmx' },
		],
		description: 'The decentralized exchange to use',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getSwapQuote', 'executeSwap', 'approveAndSwap', 'getLiquidityPools', 'getPoolInfo'],
			},
		},
	},
	// Token In
	{
		displayName: 'Token In Address',
		name: 'tokenIn',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x... (use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH)',
		description: 'Address of the token to swap from',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getSwapQuote', 'executeSwap', 'approveAndSwap'],
			},
		},
	},
	// Token Out
	{
		displayName: 'Token Out Address',
		name: 'tokenOut',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Address of the token to swap to',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getSwapQuote', 'executeSwap', 'approveAndSwap'],
			},
		},
	},
	// Amount In
	{
		displayName: 'Amount In',
		name: 'amountIn',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1.0',
		description: 'Amount of tokenIn to swap (in token units, not wei)',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getSwapQuote', 'executeSwap', 'approveAndSwap'],
			},
		},
	},
	// Slippage
	{
		displayName: 'Slippage (%)',
		name: 'slippage',
		type: 'number',
		default: 0.5,
		description: 'Maximum acceptable slippage percentage',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['executeSwap', 'approveAndSwap'],
			},
		},
	},
	// Pool Address
	{
		displayName: 'Pool Address',
		name: 'poolAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Address of the liquidity pool',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getPoolInfo', 'getTvl'],
			},
		},
	},
	// Protocol for TVL
	{
		displayName: 'Protocol',
		name: 'protocol',
		type: 'options',
		default: 'gmx',
		options: [
			{ name: 'GMX', value: 'gmx' },
			{ name: 'Uniswap', value: 'uniswap' },
			{ name: 'SushiSwap', value: 'sushiswap' },
			{ name: 'Camelot', value: 'camelot' },
			{ name: 'Radiant', value: 'radiant' },
			{ name: 'Pendle', value: 'pendle' },
			{ name: 'Custom Pool', value: 'custom' },
		],
		description: 'The DeFi protocol to get TVL for',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getTvl'],
			},
		},
	},
	// Fee Tier
	{
		displayName: 'Fee Tier',
		name: 'feeTier',
		type: 'options',
		default: '3000',
		options: [
			{ name: '0.01%', value: '100' },
			{ name: '0.05%', value: '500' },
			{ name: '0.3%', value: '3000' },
			{ name: '1%', value: '10000' },
		],
		description: 'Uniswap V3 pool fee tier',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['getSwapQuote', 'executeSwap', 'approveAndSwap'],
				dex: ['uniswapV3'],
			},
		},
	},
	// Wait for Confirmation
	{
		displayName: 'Wait for Confirmation',
		name: 'waitForConfirmation',
		type: 'boolean',
		default: true,
		description: 'Whether to wait for the swap transaction to be confirmed',
		displayOptions: {
			show: {
				resource: ['defi'],
				operation: ['executeSwap', 'approveAndSwap'],
			},
		},
	},
];

// Chainlink Feed ABI
const CHAINLINK_FEED_ABI = [
	'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
	'function decimals() external view returns (uint8)',
	'function description() external view returns (string)',
];

// Uniswap V3 Quoter ABI
const UNISWAP_V3_QUOTER_ABI = [
	'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
];

// Uniswap V3 Router ABI
const UNISWAP_V3_ROUTER_ABI = [
	'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

// Uniswap V3 Pool ABI
const UNISWAP_V3_POOL_ABI = [
	'function token0() external view returns (address)',
	'function token1() external view returns (address)',
	'function fee() external view returns (uint24)',
	'function liquidity() external view returns (uint128)',
	'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

// Uniswap V3 Factory ABI
const UNISWAP_V3_FACTORY_ABI = [
	'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	let result: Record<string, unknown>;

	switch (operation) {
		case 'getTokenPrice': {
			const token = this.getNodeParameter('token', index) as string;
			const customFeedAddress = token === 'custom'
				? this.getNodeParameter('customFeedAddress', index) as string
				: undefined;
			result = await getTokenPrice.call(this, token, customFeedAddress);
			break;
		}

		case 'getSwapQuote': {
			const dex = this.getNodeParameter('dex', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;
			const amountIn = this.getNodeParameter('amountIn', index) as string;
			const feeTier = dex === 'uniswapV3'
				? this.getNodeParameter('feeTier', index) as string
				: '3000';
			result = await getSwapQuote.call(this, dex, tokenIn, tokenOut, amountIn, feeTier);
			break;
		}

		case 'executeSwap': {
			const dex = this.getNodeParameter('dex', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;
			const amountIn = this.getNodeParameter('amountIn', index) as string;
			const slippage = this.getNodeParameter('slippage', index) as number;
			const feeTier = dex === 'uniswapV3'
				? this.getNodeParameter('feeTier', index) as string
				: '3000';
			const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index) as boolean;
			result = await executeSwap.call(this, dex, tokenIn, tokenOut, amountIn, slippage, feeTier, waitForConfirmation);
			break;
		}

		case 'getLiquidityPools': {
			const dex = this.getNodeParameter('dex', index) as string;
			result = await getLiquidityPools.call(this, dex);
			break;
		}

		case 'getPoolInfo': {
			const dex = this.getNodeParameter('dex', index) as string;
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;
			if (!validateAddress(poolAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid pool address');
			}
			result = await getPoolInfo.call(this, dex, poolAddress);
			break;
		}

		case 'getTvl': {
			const protocol = this.getNodeParameter('protocol', index) as string;
			const poolAddress = protocol === 'custom'
				? this.getNodeParameter('poolAddress', index) as string
				: undefined;
			result = await getTvl.call(this, protocol, poolAddress);
			break;
		}

		case 'getYieldFarms': {
			result = await getYieldFarms.call(this);
			break;
		}

		case 'approveAndSwap': {
			const dex = this.getNodeParameter('dex', index) as string;
			const tokenIn = this.getNodeParameter('tokenIn', index) as string;
			const tokenOut = this.getNodeParameter('tokenOut', index) as string;
			const amountIn = this.getNodeParameter('amountIn', index) as string;
			const slippage = this.getNodeParameter('slippage', index) as number;
			const feeTier = dex === 'uniswapV3'
				? this.getNodeParameter('feeTier', index) as string
				: '3000';
			const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index) as boolean;
			result = await approveAndSwap.call(this, dex, tokenIn, tokenOut, amountIn, slippage, feeTier, waitForConfirmation);
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result as IDataObject }];
}

async function getTokenPrice(
	this: IExecuteFunctions,
	token: string,
	customFeedAddress?: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Get feed address
	let feedAddress: string;
	if (token === 'custom' && customFeedAddress) {
		if (!validateAddress(customFeedAddress)) {
			throw new NodeOperationError(this.getNode(), 'Invalid custom feed address');
		}
		feedAddress = customFeedAddress;
	} else {
		const feeds = CHAINLINK_FEEDS[network] || CHAINLINK_FEEDS.arbitrumOne;
		feedAddress = feeds[token as keyof typeof feeds];
		if (!feedAddress) {
			throw new NodeOperationError(this.getNode(), `No Chainlink feed available for ${token} on ${networkConfig.name}`);
		}
	}

	const feed = new ethers.Contract(feedAddress, CHAINLINK_FEED_ABI, provider);

	const [roundData, decimals, description] = await Promise.all([
		feed.latestRoundData(),
		feed.decimals(),
		feed.description(),
	]);

	const price = Number(roundData.answer) / Math.pow(10, decimals);
	const updatedAt = new Date(Number(roundData.updatedAt) * 1000);

	return {
		token,
		network: networkConfig.name,
		feedAddress,
		description,
		price: price.toFixed(decimals > 8 ? 18 : 8),
		priceRaw: roundData.answer.toString(),
		decimals: Number(decimals),
		roundId: roundData.roundId.toString(),
		updatedAt: updatedAt.toISOString(),
		timestamp: Number(roundData.updatedAt),
		source: 'Chainlink Oracle',
	};
}

async function getSwapQuote(
	this: IExecuteFunctions,
	dex: string,
	tokenIn: string,
	tokenOut: string,
	amountIn: string,
	feeTier: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Handle ETH address
	const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
	const WETH_ADDRESS = ARBITRUM_ONE_TOKENS.WETH.address;
	
	const actualTokenIn = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase() ? WETH_ADDRESS : tokenIn;
	const actualTokenOut = tokenOut.toLowerCase() === ETH_ADDRESS.toLowerCase() ? WETH_ADDRESS : tokenOut;

	// Get token decimals
	const erc20Abi = ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'];
	const tokenInContract = new ethers.Contract(actualTokenIn, erc20Abi, provider);
	const tokenOutContract = new ethers.Contract(actualTokenOut, erc20Abi, provider);

	let tokenInDecimals = 18;
	let tokenOutDecimals = 18;
	let tokenInSymbol = 'Unknown';
	let tokenOutSymbol = 'Unknown';

	try {
		[tokenInDecimals, tokenOutDecimals, tokenInSymbol, tokenOutSymbol] = await Promise.all([
			tokenInContract.decimals(),
			tokenOutContract.decimals(),
			tokenInContract.symbol(),
			tokenOutContract.symbol(),
		]);
	} catch (error) {
		// Use defaults
	}

	const amountInWei = ethers.parseUnits(amountIn, tokenInDecimals);

	let quote: Record<string, unknown>;

	if (dex === 'uniswapV3') {
		const quoterAddress = DEX_ROUTERS.arbitrumOne?.uniswapV3Quoter;
		if (!quoterAddress) {
			throw new NodeOperationError(this.getNode(), 'Uniswap V3 Quoter not available on this network');
		}

		const quoter = new ethers.Contract(quoterAddress, UNISWAP_V3_QUOTER_ABI, provider);

		try {
			const amountOut = await quoter.quoteExactInputSingle.staticCall(
				actualTokenIn,
				actualTokenOut,
				parseInt(feeTier),
				amountInWei,
				0
			);

			const amountOutFormatted = ethers.formatUnits(amountOut, tokenOutDecimals);
			const rate = parseFloat(amountOutFormatted) / parseFloat(amountIn);

			quote = {
				dex: 'Uniswap V3',
				amountOut: amountOutFormatted,
				amountOutWei: amountOut.toString(),
				rate: rate.toFixed(8),
				feeTier: `${parseInt(feeTier) / 10000}%`,
				priceImpact: 'Calculated at execution',
			};
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Quote failed: ${error instanceof Error ? error.message : 'Unknown error'}. Pool may not exist for this pair and fee tier.`
			);
		}
	} else {
		// For other DEXes, provide a placeholder
		quote = {
			dex,
			note: `Direct ${dex} integration requires additional implementation. Consider using Uniswap V3 or the 1inch aggregator API.`,
			tokenIn: actualTokenIn,
			tokenOut: actualTokenOut,
			amountIn: amountIn,
		};
	}

	return {
		network: networkConfig.name,
		tokenIn: {
			address: tokenIn,
			symbol: tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase() ? 'ETH' : tokenInSymbol,
			decimals: tokenInDecimals,
			amount: amountIn,
			amountWei: amountInWei.toString(),
		},
		tokenOut: {
			address: tokenOut,
			symbol: tokenOut.toLowerCase() === ETH_ADDRESS.toLowerCase() ? 'ETH' : tokenOutSymbol,
			decimals: tokenOutDecimals,
		},
		...quote,
	};
}

async function executeSwap(
	this: IExecuteFunctions,
	dex: string,
	tokenIn: string,
	tokenOut: string,
	amountIn: string,
	slippage: number,
	feeTier: string,
	waitForConfirmation: boolean,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	const privateKey = credentials.privateKey as string;
	if (!privateKey) {
		throw new NodeOperationError(this.getNode(), 'Private key required for swap execution');
	}

	const signer = new ethers.Wallet(privateKey, provider);
	const signerAddress = await signer.getAddress();

	// Handle ETH address
	const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
	const WETH_ADDRESS = ARBITRUM_ONE_TOKENS.WETH.address;
	const isETHIn = tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase();
	
	const actualTokenIn = isETHIn ? WETH_ADDRESS : tokenIn;
	const actualTokenOut = tokenOut.toLowerCase() === ETH_ADDRESS.toLowerCase() ? WETH_ADDRESS : tokenOut;

	// Get token decimals
	const erc20Abi = ['function decimals() view returns (uint8)'];
	const tokenInContract = new ethers.Contract(actualTokenIn, erc20Abi, provider);
	const tokenOutContract = new ethers.Contract(actualTokenOut, erc20Abi, provider);

	let tokenInDecimals = 18;
	let tokenOutDecimals = 18;
	try {
		[tokenInDecimals, tokenOutDecimals] = await Promise.all([
			tokenInContract.decimals(),
			tokenOutContract.decimals(),
		]);
	} catch (error) {
		// Use defaults
	}

	const amountInWei = ethers.parseUnits(amountIn, tokenInDecimals);

	if (dex === 'uniswapV3') {
		// Get quote first
		const quoterAddress = DEX_ROUTERS.arbitrumOne?.uniswapV3Quoter;
		const routerAddress = DEX_ROUTERS.arbitrumOne?.uniswapV3Router;
		
		if (!quoterAddress || !routerAddress) {
			throw new NodeOperationError(this.getNode(), 'Uniswap V3 not available on this network');
		}

		const quoter = new ethers.Contract(quoterAddress, UNISWAP_V3_QUOTER_ABI, provider);
		const router = new ethers.Contract(routerAddress, UNISWAP_V3_ROUTER_ABI, signer);

		// Get quote
		let expectedAmountOut: bigint;
		try {
			expectedAmountOut = await quoter.quoteExactInputSingle.staticCall(
				actualTokenIn,
				actualTokenOut,
				parseInt(feeTier),
				amountInWei,
				0
			);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), 'Failed to get quote for swap');
		}

		// Calculate minimum amount out with slippage
		const slippageFactor = BigInt(Math.floor((100 - slippage) * 100));
		const amountOutMinimum = (expectedAmountOut * slippageFactor) / BigInt(10000);

		// Prepare swap params
		const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
		const params = {
			tokenIn: actualTokenIn,
			tokenOut: actualTokenOut,
			fee: parseInt(feeTier),
			recipient: signerAddress,
			deadline,
			amountIn: amountInWei,
			amountOutMinimum,
			sqrtPriceLimitX96: 0,
		};

		try {
			const tx = await router.exactInputSingle(params, {
				value: isETHIn ? amountInWei : 0,
			});

			const result: Record<string, unknown> = {
				dex: 'Uniswap V3',
				network: networkConfig.name,
				transactionHash: tx.hash,
				tokenIn,
				tokenOut,
				amountIn,
				expectedAmountOut: ethers.formatUnits(expectedAmountOut, tokenOutDecimals),
				amountOutMinimum: ethers.formatUnits(amountOutMinimum, tokenOutDecimals),
				slippage: `${slippage}%`,
				feeTier: `${parseInt(feeTier) / 10000}%`,
				deadline: new Date(deadline * 1000).toISOString(),
				status: 'Submitted',
			};

			if (waitForConfirmation) {
				const receipt = await tx.wait();
				result.status = receipt?.status === 1 ? 'Success' : 'Failed';
				result.blockNumber = receipt?.blockNumber;
				result.gasUsed = receipt?.gasUsed.toString();
				result.effectiveGasPrice = receipt?.gasPrice?.toString();
			}

			return result;
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	} else {
		throw new NodeOperationError(this.getNode(), `${dex} execution not yet implemented. Use Uniswap V3.`);
	}
}

async function getLiquidityPools(
	this: IExecuteFunctions,
	dex: string,
): Promise<Record<string, unknown>> {
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Common pool pairs on Arbitrum
	const commonPairs = [
		{ token0: 'WETH', token1: 'USDC', description: 'ETH/USDC' },
		{ token0: 'WETH', token1: 'USDT', description: 'ETH/USDT' },
		{ token0: 'WETH', token1: 'ARB', description: 'ETH/ARB' },
		{ token0: 'USDC', token1: 'USDT', description: 'USDC/USDT' },
		{ token0: 'WETH', token1: 'WBTC', description: 'ETH/BTC' },
		{ token0: 'ARB', token1: 'USDC', description: 'ARB/USDC' },
		{ token0: 'WETH', token1: 'GMX', description: 'ETH/GMX' },
		{ token0: 'WETH', token1: 'MAGIC', description: 'ETH/MAGIC' },
	];

	return {
		network: networkConfig.name,
		dex,
		commonPools: commonPairs,
		routers: DEX_ROUTERS[network] || DEX_ROUTERS.arbitrumOne,
		note: 'Use Get Pool Info operation with specific pool address for detailed information',
		resources: {
			uniswapV3: 'https://info.uniswap.org/#/arbitrum/pools',
			sushiswap: 'https://www.sushi.com/pool?chainId=42161',
			camelot: 'https://info.camelot.exchange/',
		},
	};
}

async function getPoolInfo(
	this: IExecuteFunctions,
	dex: string,
	poolAddress: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	if (dex === 'uniswapV3') {
		const pool = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, provider);

		try {
			const [token0, token1, fee, liquidity, slot0] = await Promise.all([
				pool.token0(),
				pool.token1(),
				pool.fee(),
				pool.liquidity(),
				pool.slot0(),
			]);

			// Get token info
			const erc20Abi = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)'];
			const token0Contract = new ethers.Contract(token0, erc20Abi, provider);
			const token1Contract = new ethers.Contract(token1, erc20Abi, provider);

			const [token0Symbol, token1Symbol, token0Decimals, token1Decimals] = await Promise.all([
				token0Contract.symbol(),
				token1Contract.symbol(),
				token0Contract.decimals(),
				token1Contract.decimals(),
			]);

			// Calculate price from sqrtPriceX96
			const sqrtPriceX96 = slot0[0];
			const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2;
			const adjustedPrice = price * Math.pow(10, token0Decimals - token1Decimals);

			return {
				network: networkConfig.name,
				dex: 'Uniswap V3',
				poolAddress,
				token0: {
					address: token0,
					symbol: token0Symbol,
					decimals: Number(token0Decimals),
				},
				token1: {
					address: token1,
					symbol: token1Symbol,
					decimals: Number(token1Decimals),
				},
				fee: `${Number(fee) / 10000}%`,
				feeRaw: Number(fee),
				liquidity: liquidity.toString(),
				sqrtPriceX96: sqrtPriceX96.toString(),
				tick: Number(slot0[1]),
				price: {
					token0PerToken1: adjustedPrice.toFixed(8),
					token1PerToken0: (1 / adjustedPrice).toFixed(8),
				},
				unlocked: slot0[6],
			};
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Failed to get pool info: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	} else {
		return {
			network: networkConfig.name,
			dex,
			poolAddress,
			note: `Detailed pool info for ${dex} requires specific ABI implementation`,
		};
	}
}

async function getTvl(
	this: IExecuteFunctions,
	protocol: string,
	poolAddress?: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// For accurate TVL, typically need to query DeFiLlama API or similar
	// Here we provide structure and note about data sources

	return {
		network: networkConfig.name,
		protocol,
		poolAddress: poolAddress || 'N/A',
		note: 'For accurate TVL data, consider integrating with DeFiLlama API (https://defillama.com/docs/api)',
		tvlSources: {
			defillama: `https://api.llama.fi/protocol/${protocol.toLowerCase()}`,
			debank: 'https://openapi.debank.com/',
		},
		topProtocols: [
			{ name: 'GMX', category: 'Derivatives', website: 'https://gmx.io' },
			{ name: 'Uniswap', category: 'DEX', website: 'https://app.uniswap.org' },
			{ name: 'Aave', category: 'Lending', website: 'https://aave.com' },
			{ name: 'Radiant', category: 'Lending', website: 'https://radiant.capital' },
			{ name: 'Pendle', category: 'Yield', website: 'https://pendle.finance' },
			{ name: 'Camelot', category: 'DEX', website: 'https://camelot.exchange' },
		],
	};
}

async function getYieldFarms(
	this: IExecuteFunctions,
): Promise<Record<string, unknown>> {
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	return {
		network: networkConfig.name,
		note: 'Yield farm data requires real-time APY calculations. Consider integrating with yield aggregator APIs.',
		popularFarms: [
			{
				protocol: 'GMX',
				type: 'Perpetual Trading',
				tokens: ['GLP', 'GMX'],
				description: 'Earn fees from leveraged trading',
			},
			{
				protocol: 'Camelot',
				type: 'DEX LP',
				tokens: ['Various LP tokens'],
				description: 'Liquidity provider rewards with xGRAIL',
			},
			{
				protocol: 'Radiant',
				type: 'Lending',
				tokens: ['Various'],
				description: 'Lending and borrowing rewards',
			},
			{
				protocol: 'Pendle',
				type: 'Yield Trading',
				tokens: ['PT/YT tokens'],
				description: 'Fixed and variable yield strategies',
			},
			{
				protocol: 'Silo',
				type: 'Isolated Lending',
				tokens: ['Various'],
				description: 'Isolated lending markets',
			},
		],
		resources: {
			defillama: 'https://defillama.com/chain/Arbitrum',
			defiLlamaYields: 'https://defillama.com/yields?chain=Arbitrum',
		},
	};
}

async function approveAndSwap(
	this: IExecuteFunctions,
	dex: string,
	tokenIn: string,
	tokenOut: string,
	amountIn: string,
	slippage: number,
	feeTier: string,
	waitForConfirmation: boolean,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;

	const privateKey = credentials.privateKey as string;
	if (!privateKey) {
		throw new NodeOperationError(this.getNode(), 'Private key required');
	}

	const signer = new ethers.Wallet(privateKey, provider);

	// Handle ETH - no approval needed for ETH
	const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
	if (tokenIn.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
		// ETH doesn't need approval, just execute swap
		return executeSwap.call(this, dex, tokenIn, tokenOut, amountIn, slippage, feeTier, waitForConfirmation);
	}

	// Get router address for approval
	const routerAddress = DEX_ROUTERS[network]?.uniswapV3Router || DEX_ROUTERS.arbitrumOne?.uniswapV3Router;
	if (!routerAddress) {
		throw new NodeOperationError(this.getNode(), 'Router address not found');
	}

	// Get token decimals and check current allowance
	const erc20Abi = [
		'function decimals() view returns (uint8)',
		'function allowance(address owner, address spender) view returns (uint256)',
		'function approve(address spender, uint256 amount) returns (bool)',
	];
	const tokenContract = new ethers.Contract(tokenIn, erc20Abi, signer);

	const decimals = await tokenContract.decimals();
	const amountInWei = ethers.parseUnits(amountIn, decimals);
	const currentAllowance = await tokenContract.allowance(await signer.getAddress(), routerAddress);

	const results: Record<string, unknown> = {
		steps: [],
	};

	// Check if approval needed
	if (currentAllowance < amountInWei) {
		// Approve max uint256 for convenience
		const maxApproval = ethers.MaxUint256;
		
		try {
			const approveTx = await tokenContract.approve(routerAddress, maxApproval);
			
			const approvalResult: Record<string, unknown> = {
				step: 'Approval',
				transactionHash: approveTx.hash,
				spender: routerAddress,
				amount: 'Unlimited',
				status: 'Submitted',
			};

			if (waitForConfirmation) {
				const receipt = await approveTx.wait();
				approvalResult.status = receipt?.status === 1 ? 'Success' : 'Failed';
				approvalResult.blockNumber = receipt?.blockNumber;
				approvalResult.gasUsed = receipt?.gasUsed.toString();
			}

			(results.steps as unknown[]).push(approvalResult);
		} catch (error) {
			throw new NodeOperationError(
				this.getNode(),
				`Approval failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	} else {
		(results.steps as unknown[]).push({
			step: 'Approval',
			status: 'Skipped - Sufficient allowance exists',
			currentAllowance: ethers.formatUnits(currentAllowance, decimals),
		});
	}

	// Execute swap
	const swapResult = await executeSwap.call(this, dex, tokenIn, tokenOut, amountIn, slippage, feeTier, waitForConfirmation);
	(results.steps as unknown[]).push({
		step: 'Swap',
		...swapResult,
	});

	return results;
}

export const defi = { operations, fields, execute };
