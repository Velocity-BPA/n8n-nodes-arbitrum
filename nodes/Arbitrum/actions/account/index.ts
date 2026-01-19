/**
 * Account Resource Actions
 * Operations for Arbitrum account/wallet interactions
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createProvider, validateAddress } from '../../transport/provider';
import { createArbiscanClient } from '../../transport/explorerApi';
import { ABIS } from '../../constants/abis';
import { getTokenList } from '../../constants/tokens';
import type { ArbitrumNetworkId } from '../../constants/networks';

// Resource description for n8n UI
export const accountOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['account'],
			},
		},
		options: [
			{
				name: 'Get ETH Balance',
				value: 'getBalance',
				description: 'Get the native ETH balance of an address',
				action: 'Get ETH balance',
			},
			{
				name: 'Get Token Balance',
				value: 'getTokenBalance',
				description: 'Get the ERC-20 token balance of an address',
				action: 'Get token balance',
			},
			{
				name: 'Get All Token Balances',
				value: 'getAllTokenBalances',
				description: 'Get all ERC-20 token balances for an address',
				action: 'Get all token balances',
			},
			{
				name: 'Get Transaction History',
				value: 'getTransactionHistory',
				description: 'Get transaction history for an address',
				action: 'Get transaction history',
			},
			{
				name: 'Get Token Transfers',
				value: 'getTokenTransfers',
				description: 'Get ERC-20 token transfer history',
				action: 'Get token transfers',
			},
			{
				name: 'Get NFT Holdings',
				value: 'getNftHoldings',
				description: 'Get NFT holdings for an address',
				action: 'Get NFT holdings',
			},
			{
				name: 'Get Internal Transactions',
				value: 'getInternalTransactions',
				description: 'Get internal transactions for an address',
				action: 'Get internal transactions',
			},
			{
				name: 'Get Transaction Count',
				value: 'getTransactionCount',
				description: 'Get the nonce/transaction count for an address',
				action: 'Get transaction count',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Check if an address is valid',
				action: 'Validate address',
			},
		],
		default: 'getBalance',
	},
];

export const accountFields: INodeProperties[] = [
	// Address field - used by most operations
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The Arbitrum address to query',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: [
					'getBalance',
					'getTokenBalance',
					'getAllTokenBalances',
					'getTransactionHistory',
					'getTokenTransfers',
					'getNftHoldings',
					'getInternalTransactions',
					'getTransactionCount',
					'validateAddress',
				],
			},
		},
	},
	// Token address for token balance
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
				resource: ['account'],
				operation: ['getTokenBalance'],
			},
		},
	},
	// Block parameter for balance queries
	{
		displayName: 'Block',
		name: 'block',
		type: 'options',
		default: 'latest',
		description: 'The block to query the balance at',
		options: [
			{ name: 'Latest', value: 'latest' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Earliest', value: 'earliest' },
			{ name: 'Specific Block Number', value: 'specific' },
		],
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getBalance', 'getTokenBalance', 'getTransactionCount'],
			},
		},
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		default: 0,
		description: 'The specific block number to query',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getBalance', 'getTokenBalance', 'getTransactionCount'],
				block: ['specific'],
			},
		},
	},
	// Pagination for history queries
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number for paginated results',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: [
					'getTransactionHistory',
					'getTokenTransfers',
					'getNftHoldings',
					'getInternalTransactions',
				],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 100,
		description: 'Number of results per page (max 10000)',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: [
					'getTransactionHistory',
					'getTokenTransfers',
					'getNftHoldings',
					'getInternalTransactions',
				],
			},
		},
	},
	// Sorting options
	{
		displayName: 'Sort Order',
		name: 'sort',
		type: 'options',
		default: 'desc',
		description: 'Sort order for results',
		options: [
			{ name: 'Descending (Newest First)', value: 'desc' },
			{ name: 'Ascending (Oldest First)', value: 'asc' },
		],
		displayOptions: {
			show: {
				resource: ['account'],
				operation: [
					'getTransactionHistory',
					'getTokenTransfers',
					'getNftHoldings',
					'getInternalTransactions',
				],
			},
		},
	},
	// Token filter for transfers
	{
		displayName: 'Filter by Token',
		name: 'filterByToken',
		type: 'boolean',
		default: false,
		description: 'Whether to filter transfers by a specific token',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getTokenTransfers'],
			},
		},
	},
	{
		displayName: 'Token Contract Address',
		name: 'tokenContractAddress',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'The token contract address to filter by',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getTokenTransfers'],
				filterByToken: [true],
			},
		},
	},
	// Include common tokens option
	{
		displayName: 'Include Known Tokens Only',
		name: 'includeKnownTokensOnly',
		type: 'boolean',
		default: false,
		description: 'Whether to only include well-known tokens in the results',
		displayOptions: {
			show: {
				resource: ['account'],
				operation: ['getAllTokenBalances'],
			},
		},
	},
];

/**
 * Execute account operations
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
			case 'getBalance':
				result = await getBalance.call(this, index, credentials);
				break;
			case 'getTokenBalance':
				result = await getTokenBalance.call(this, index, credentials);
				break;
			case 'getAllTokenBalances':
				result = await getAllTokenBalances.call(this, index, credentials, network);
				break;
			case 'getTransactionHistory':
				result = await getTransactionHistory.call(this, index, network);
				break;
			case 'getTokenTransfers':
				result = await getTokenTransfers.call(this, index, network);
				break;
			case 'getNftHoldings':
				result = await getNftHoldings.call(this, index, network);
				break;
			case 'getInternalTransactions':
				result = await getInternalTransactions.call(this, index, network);
				break;
			case 'getTransactionCount':
				result = await getTransactionCount.call(this, index, credentials);
				break;
			case 'validateAddress':
				result = await validateAddressOperation.call(this, index);
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
			`Account operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}

	return result;
}

// Operation implementations

async function getBalance(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const block = this.getNodeParameter('block', index) as string;
	const blockNumber = block === 'specific'
		? this.getNodeParameter('blockNumber', index) as number
		: undefined;

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const blockTag = blockNumber !== undefined ? blockNumber : block;
	const balance = await provider.getBalance(address, blockTag);

	return [
		{
			json: {
				address,
				balance: balance.toString(),
				balanceEth: ethers.formatEther(balance),
				block: blockTag,
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
	const address = this.getNodeParameter('address', index) as string;
	const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
	const block = this.getNodeParameter('block', index) as string;
	const blockNumber = block === 'specific'
		? this.getNodeParameter('blockNumber', index) as number
		: undefined;

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(tokenAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid token address: ${tokenAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(tokenAddress, ABIS.ERC20, provider);

	// Get token info and balance
	const [balance, symbol, name, decimals] = await Promise.all([
		contract.balanceOf(address, { blockTag: blockNumber !== undefined ? blockNumber : block }),
		contract.symbol().catch(() => 'UNKNOWN'),
		contract.name().catch(() => 'Unknown Token'),
		contract.decimals().catch(() => 18),
	]);

	return [
		{
			json: {
				address,
				tokenAddress,
				tokenName: name,
				tokenSymbol: symbol,
				tokenDecimals: Number(decimals),
				balance: balance.toString(),
				balanceFormatted: ethers.formatUnits(balance, decimals),
				block: blockNumber !== undefined ? blockNumber : block,
				network: credentials.network,
			},
		},
	];
}

async function getAllTokenBalances(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const includeKnownTokensOnly = this.getNodeParameter('includeKnownTokensOnly', index, false) as boolean;

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const tokens = getTokenList(network);

	const balances: any[] = [];

	// Check ETH balance first
	const ethBalance = await provider.getBalance(address);
	balances.push({
		tokenAddress: '0x0000000000000000000000000000000000000000',
		tokenName: 'Ethereum',
		tokenSymbol: 'ETH',
		tokenDecimals: 18,
		balance: ethBalance.toString(),
		balanceFormatted: ethers.formatEther(ethBalance),
	});

	// Check known token balances
	for (const token of Object.values(tokens)) {
		if (token.symbol === 'ETH') continue;
		
		try {
			const contract = new ethers.Contract(token.address, ABIS.ERC20, provider);
			const balance = await contract.balanceOf(address);
			
			if (balance > 0n || !includeKnownTokensOnly) {
				balances.push({
					tokenAddress: token.address,
					tokenName: token.name,
					tokenSymbol: token.symbol,
					tokenDecimals: token.decimals,
					balance: balance.toString(),
					balanceFormatted: ethers.formatUnits(balance, token.decimals),
					logoURI: token.logoURI,
				});
			}
		} catch (error) {
			// Skip tokens that fail
			continue;
		}
	}

	return [
		{
			json: {
				address,
				network,
				tokenCount: balances.length,
				balances,
			},
		},
	];
}

async function getTransactionHistory(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;
	const sort = this.getNodeParameter('sort', index, 'desc') as 'asc' | 'desc';

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const transactions = await client.getTransactions(address, { page, offset: pageSize, sort });

	return [
		{
			json: {
				address,
				network,
				page,
				pageSize,
				transactionCount: transactions.length,
				transactions,
			},
		},
	];
}

async function getTokenTransfers(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;
	const sort = this.getNodeParameter('sort', index, 'desc') as 'asc' | 'desc';
	const filterByToken = this.getNodeParameter('filterByToken', index, false) as boolean;
	const tokenContractAddress = filterByToken
		? this.getNodeParameter('tokenContractAddress', index) as string
		: undefined;

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const transfers = await client.getTokenTransfers(
		address,
		{ page, offset: pageSize, sort, contractAddress: tokenContractAddress },
	);

	return [
		{
			json: {
				address,
				network,
				page,
				pageSize,
				filterToken: tokenContractAddress,
				transferCount: transfers.length,
				transfers,
			},
		},
	];
}

async function getNftHoldings(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;
	const sort = this.getNodeParameter('sort', index, 'desc') as 'asc' | 'desc';

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	// Get both ERC-721 and ERC-1155 transfers
	const [erc721Transfers, erc1155Transfers] = await Promise.all([
		client.getNFTTransfers(address, { page, offset: pageSize, sort }),
		client.getERC1155Transfers(address, { page, offset: pageSize, sort }),
	]);

	return [
		{
			json: {
				address,
				network,
				page,
				pageSize,
				erc721Count: erc721Transfers.length,
				erc1155Count: erc1155Transfers.length,
				erc721Transfers,
				erc1155Transfers,
			},
		},
	];
}

async function getInternalTransactions(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;
	const sort = this.getNodeParameter('sort', index, 'desc') as 'asc' | 'desc';

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const internalTxs = await client.getInternalTransactions(address, { page, offset: pageSize, sort });

	return [
		{
			json: {
				address,
				network,
				page,
				pageSize,
				transactionCount: internalTxs.length,
				transactions: internalTxs,
			},
		},
	];
}

async function getTransactionCount(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;
	const block = this.getNodeParameter('block', index) as string;
	const blockNumber = block === 'specific'
		? this.getNodeParameter('blockNumber', index) as number
		: undefined;

	if (!validateAddress(address)) {
		throw new NodeOperationError(this.getNode(), `Invalid address: ${address}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const blockTag = blockNumber !== undefined ? blockNumber : block;
	const nonce = await provider.getTransactionCount(address, blockTag);

	return [
		{
			json: {
				address,
				transactionCount: nonce,
				nonce,
				block: blockTag,
				network: credentials.network,
			},
		},
	];
}

async function validateAddressOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const address = this.getNodeParameter('address', index) as string;

	const isValid = validateAddress(address);
	let checksumAddress: string | null = null;

	if (isValid) {
		try {
			checksumAddress = ethers.getAddress(address);
		} catch {
			checksumAddress = null;
		}
	}

	return [
		{
			json: {
				address,
				isValid,
				checksumAddress,
				isChecksum: address === checksumAddress,
			},
		},
	];
}

export const account = {
	operations: accountOperations,
	fields: accountFields,
	execute,
};
