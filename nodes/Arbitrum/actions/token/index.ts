/**
 * Token Resource Actions (ERC-20)
 * Operations for Arbitrum ERC-20 token interactions
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import {
	createProvider,
	validateAddress,
	formatTransactionResponse,
	waitForTransaction,
} from '../../transport/provider';
import { createArbiscanClient } from '../../transport/explorerApi';
import { ABIS } from '../../constants/abis';
import { getTokenByAddress, getTokenBySymbol } from '../../constants/tokens';
import type { ArbitrumNetworkId } from '../../constants/networks';

export const tokenOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Get Token Info',
				value: 'getInfo',
				description: 'Get ERC-20 token information',
				action: 'Get token info',
			},
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get token balance for an address',
				action: 'Get token balance',
			},
			{
				name: 'Transfer',
				value: 'transfer',
				description: 'Transfer tokens to an address',
				action: 'Transfer tokens',
			},
			{
				name: 'Approve',
				value: 'approve',
				description: 'Approve spender to use tokens',
				action: 'Approve token spending',
			},
			{
				name: 'Get Allowance',
				value: 'getAllowance',
				description: 'Get approved spending allowance',
				action: 'Get token allowance',
			},
			{
				name: 'Transfer From',
				value: 'transferFrom',
				description: 'Transfer tokens on behalf of owner',
				action: 'Transfer tokens from',
			},
			{
				name: 'Get Token Holders',
				value: 'getHolders',
				description: 'Get token holder information',
				action: 'Get token holders',
			},
			{
				name: 'Get Token Price',
				value: 'getPrice',
				description: 'Get token price from Chainlink oracles',
				action: 'Get token price',
			},
			{
				name: 'Get Total Supply',
				value: 'getTotalSupply',
				description: 'Get token total supply',
				action: 'Get total supply',
			},
		],
		default: 'getInfo',
	},
];

export const tokenFields: INodeProperties[] = [
	// Token address - used by most operations
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The ERC-20 token contract address',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: [
					'getInfo',
					'getBalance',
					'transfer',
					'approve',
					'getAllowance',
					'transferFrom',
					'getHolders',
					'getTotalSupply',
				],
			},
		},
	},
	// Address for balance queries
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The address to query',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getBalance'],
			},
		},
	},
	// Transfer fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The recipient address',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transfer', 'transferFrom'],
			},
		},
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		default: '0',
		placeholder: '100',
		description: 'Amount of tokens to transfer (in token units, e.g., 100 for 100 USDC)',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transfer', 'approve', 'transferFrom'],
			},
		},
	},
	// Approval fields
	{
		displayName: 'Spender Address',
		name: 'spenderAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The address to approve for spending',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['approve', 'getAllowance'],
			},
		},
	},
	{
		displayName: 'Unlimited Approval',
		name: 'unlimitedApproval',
		type: 'boolean',
		default: false,
		description: 'Whether to approve unlimited spending (max uint256)',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['approve'],
			},
		},
	},
	// Transfer From fields
	{
		displayName: 'From Address',
		name: 'fromAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The address to transfer from',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transferFrom'],
			},
		},
	},
	// Owner address for allowance
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The token owner address',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getAllowance'],
			},
		},
	},
	// Price feed selection
	{
		displayName: 'Token Symbol',
		name: 'tokenSymbol',
		type: 'options',
		default: 'ETH',
		description: 'Select token for price feed',
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
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getPrice'],
			},
		},
	},
	{
		displayName: 'Chainlink Feed Address',
		name: 'feedAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Custom Chainlink price feed address',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getPrice'],
				tokenSymbol: ['custom'],
			},
		},
	},
	// Pagination for holders
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number for paginated results',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getHolders'],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 100,
		description: 'Number of results per page',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getHolders'],
			},
		},
	},
	// Transaction options
	{
		displayName: 'Wait for Confirmation',
		name: 'waitForConfirmation',
		type: 'boolean',
		default: true,
		description: 'Whether to wait for the transaction to be confirmed',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transfer', 'approve', 'transferFrom'],
			},
		},
	},
	{
		displayName: 'Confirmations',
		name: 'confirmations',
		type: 'number',
		default: 1,
		description: 'Number of confirmations to wait for',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['transfer', 'approve', 'transferFrom'],
				waitForConfirmation: [true],
			},
		},
	},
];

// Chainlink feed addresses for common tokens on Arbitrum One
const CHAINLINK_FEEDS: Record<string, string> = {
	ETH: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
	BTC: '0x6ce185860a4963106506C203335A2910BC6B3A43',
	ARB: '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6',
	USDC: '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3',
	USDT: '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7',
	DAI: '0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB',
	LINK: '0x86E53CF1B870786351Da77A57575e79CB55812CB',
	UNI: '0x9C917083fDb403ab5ADbEC26Ee294f6EcAda2720',
	GMX: '0xDB98056FecFff59D032aB628337A4887110df3dB',
	WBTC: '0xd0C7101eACbB49F3deCcCc166d238410D6D46d57',
};

/**
 * Execute token operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as ArbitrumNetworkId;

	let result: INodeExecutionData[] = [];

	try {
		switch (operation) {
			case 'getInfo':
				result = await getTokenInfo.call(this, index, credentials);
				break;
			case 'getBalance':
				result = await getTokenBalance.call(this, index, credentials);
				break;
			case 'transfer':
				result = await transferToken.call(this, index, credentials);
				break;
			case 'approve':
				result = await approveToken.call(this, index, credentials);
				break;
			case 'getAllowance':
				result = await getAllowance.call(this, index, credentials);
				break;
			case 'transferFrom':
				result = await transferFrom.call(this, index, credentials);
				break;
			case 'getHolders':
				result = await getTokenHolders.call(this, index, network);
				break;
			case 'getPrice':
				result = await getTokenPrice.call(this, index, credentials);
				break;
			case 'getTotalSupply':
				result = await getTotalSupply.call(this, index, credentials);
				break;
			default:
				throw new NodeOperationError(
					this.getNode(),
					`Unknown operation: ${operation}`,
				);
		}
	} catch (error) {
		if (error instanceof NodeOperationError) throw error;
		throw new NodeOperationError(
			this.getNode(),
			`Token operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}

	return result;
}

// Operation implementations

async function getTokenInfo(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

	const [name, symbol, decimals, totalSupply] = await Promise.all([
		contract.name().catch(() => 'Unknown'),
		contract.symbol().catch(() => 'UNKNOWN'),
		contract.decimals().catch(() => 18),
		contract.totalSupply().catch(() => 0n),
	]);

	// Check if it's a known token
	const knownToken = getTokenByAddress(credentials.network as ArbitrumNetworkId, tokenAddress);

	return [
		{
			json: {
				address: tokenAddress,
				name,
				symbol,
				decimals: Number(decimals),
				totalSupply: totalSupply.toString(),
				totalSupplyFormatted: ethers.formatUnits(totalSupply, decimals),
				isKnownToken: !!knownToken,
				logoURI: knownToken?.logoURI,
				coingeckoId: knownToken?.coingeckoId,
				network: credentials.network,
			},
		},
	];
}

async function getTokenBalance(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const address = this.getNodeParameter('address', index) as string;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

	const [balance, symbol, decimals] = await Promise.all([
		contract.balanceOf(address),
		contract.symbol().catch(() => 'UNKNOWN'),
		contract.decimals().catch(() => 18),
	]);

	return [
		{
			json: {
				tokenAddress,
				address,
				symbol,
				decimals: Number(decimals),
				balance: balance.toString(),
				balanceFormatted: ethers.formatUnits(balance, decimals),
				network: credentials.network,
			},
		},
	];
}

async function transferToken(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const toAddress = this.getNodeParameter('toAddress', index) as string;
	const amount = this.getNodeParameter('amount', index) as string;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(toAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to transfer tokens',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);
	const decimals = await contract.decimals().catch(() => 18);
	const amountWei = ethers.parseUnits(amount, decimals);

	const txResponse = await contract.transfer(toAddress, amountWei);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				tokenAddress,
				toAddress,
				amount,
				amountWei: amountWei.toString(),
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function approveToken(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;
	const amount = this.getNodeParameter('amount', index) as string;
	const unlimitedApproval = this.getNodeParameter('unlimitedApproval', index, false) as boolean;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(spenderAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid spender address: ${spenderAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to approve tokens',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);
	const decimals = await contract.decimals().catch(() => 18);
	
	// Use max uint256 for unlimited approval
	const amountWei = unlimitedApproval
		? ethers.MaxUint256
		: ethers.parseUnits(amount, decimals);

	const txResponse = await contract.approve(spenderAddress, amountWei);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				tokenAddress,
				spenderAddress,
				amount: unlimitedApproval ? 'unlimited' : amount,
				amountWei: amountWei.toString(),
				unlimited: unlimitedApproval,
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function getAllowance(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
	const spenderAddress = this.getNodeParameter('spenderAddress', index) as string;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(ownerAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(spenderAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid spender address: ${spenderAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

	const [allowance, symbol, decimals] = await Promise.all([
		contract.allowance(ownerAddress, spenderAddress),
		contract.symbol().catch(() => 'UNKNOWN'),
		contract.decimals().catch(() => 18),
	]);

	const isUnlimited = allowance >= ethers.MaxUint256 / 2n;

	return [
		{
			json: {
				tokenAddress,
				ownerAddress,
				spenderAddress,
				symbol,
				decimals: Number(decimals),
				allowance: allowance.toString(),
				allowanceFormatted: isUnlimited ? 'unlimited' : ethers.formatUnits(allowance, decimals),
				isUnlimited,
				network: credentials.network,
			},
		},
	];
}

async function transferFrom(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const fromAddress = this.getNodeParameter('fromAddress', index) as string;
	const toAddress = this.getNodeParameter('toAddress', index) as string;
	const amount = this.getNodeParameter('amount', index) as string;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(fromAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid from address: ${fromAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(toAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to transfer tokens',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, signer);
	const decimals = await contract.decimals().catch(() => 18);
	const amountWei = ethers.parseUnits(amount, decimals);

	const txResponse = await contract.transferFrom(fromAddress, toAddress, amountWei);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				tokenAddress,
				fromAddress,
				toAddress,
				amount,
				amountWei: amountWei.toString(),
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function getTokenHolders(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const holders = await client.getTokenHolders(tokenAddress, page, pageSize);

	return [
		{
			json: {
				tokenAddress,
				network,
				page,
				pageSize,
				holderCount: holders.length,
				holders,
			},
		},
	];
}

async function getTokenPrice(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenSymbol = this.getNodeParameter('tokenSymbol', index) as string;
	let feedAddress: string;

	if (tokenSymbol === 'custom') {
		feedAddress = this.getNodeParameter('feedAddress', index) as string;
		if (!validateAddress(feedAddress)) {
			throw new NodeOperationError(this.getNode(), `Invalid feed address: ${feedAddress}`, {
				itemIndex: index,
			});
		}
	} else {
		feedAddress = CHAINLINK_FEEDS[tokenSymbol];
		if (!feedAddress) {
			throw new NodeOperationError(
				this.getNode(),
				`No Chainlink feed available for ${tokenSymbol}`,
				{ itemIndex: index },
			);
		}
	}

	const { provider } = await createProvider(credentials);
	const feedContract = new ethers.Contract(feedAddress, ABIS.ChainlinkFeed, provider);

	const [latestRound, description, decimals] = await Promise.all([
		feedContract.latestRoundData(),
		feedContract.description().catch(() => `${tokenSymbol}/USD`),
		feedContract.decimals().catch(() => 8),
	]);

	const price = Number(latestRound.answer) / Math.pow(10, Number(decimals));
	const updatedAt = new Date(Number(latestRound.updatedAt) * 1000);

	return [
		{
			json: {
				symbol: tokenSymbol,
				feedAddress,
				description,
				price,
				priceRaw: latestRound.answer.toString(),
				decimals: Number(decimals),
				roundId: latestRound.roundId.toString(),
				updatedAt: updatedAt.toISOString(),
				updatedAtTimestamp: Number(latestRound.updatedAt),
				network: credentials.network,
			},
		},
	];
}

async function getTotalSupply(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

	const [totalSupply, symbol, decimals] = await Promise.all([
		contract.totalSupply(),
		contract.symbol().catch(() => 'UNKNOWN'),
		contract.decimals().catch(() => 18),
	]);

	return [
		{
			json: {
				tokenAddress,
				symbol,
				decimals: Number(decimals),
				totalSupply: totalSupply.toString(),
				totalSupplyFormatted: ethers.formatUnits(totalSupply, decimals),
				network: credentials.network,
			},
		},
	];
}

export const token = {
	operations: tokenOperations,
	fields: tokenFields,
	execute,
};
