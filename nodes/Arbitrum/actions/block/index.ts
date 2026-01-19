import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getProvider, getPrecompileContract } from '../../transport/provider';

// Block resource operations
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['block'],
			},
		},
		options: [
			{
				name: 'Get Block',
				value: 'getBlock',
				description: 'Get block by number or hash',
				action: 'Get block by number or hash',
			},
			{
				name: 'Get Latest Block',
				value: 'getLatestBlock',
				description: 'Get the latest block',
				action: 'Get the latest block',
			},
			{
				name: 'Get Block Transactions',
				value: 'getBlockTransactions',
				description: 'Get all transactions in a block',
				action: 'Get all transactions in a block',
			},
			{
				name: 'Get Block Number',
				value: 'getBlockNumber',
				description: 'Get the current block number',
				action: 'Get the current block number',
			},
			{
				name: 'Get Block Timestamp',
				value: 'getBlockTimestamp',
				description: 'Get timestamp for a specific block',
				action: 'Get timestamp for a specific block',
			},
			{
				name: 'Get L1 Block Number',
				value: 'getL1BlockNumber',
				description: 'Get the corresponding L1 block number',
				action: 'Get the corresponding L1 block number',
			},
		],
		default: 'getBlock',
	},
];

// Block resource fields
export const fields: INodeProperties[] = [
	// Get Block fields
	{
		displayName: 'Block Identifier Type',
		name: 'blockIdentifierType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getBlockTransactions', 'getBlockTimestamp'],
			},
		},
		options: [
			{
				name: 'Block Number',
				value: 'number',
			},
			{
				name: 'Block Hash',
				value: 'hash',
			},
			{
				name: 'Block Tag',
				value: 'tag',
			},
		],
		default: 'number',
		description: 'How to identify the block',
	},
	{
		displayName: 'Block Number',
		name: 'blockNumber',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getBlockTransactions', 'getBlockTimestamp'],
				blockIdentifierType: ['number'],
			},
		},
		default: 0,
		description: 'The block number to query',
	},
	{
		displayName: 'Block Hash',
		name: 'blockHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getBlockTransactions', 'getBlockTimestamp'],
				blockIdentifierType: ['hash'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The block hash to query',
	},
	{
		displayName: 'Block Tag',
		name: 'blockTag',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getBlockTransactions', 'getBlockTimestamp'],
				blockIdentifierType: ['tag'],
			},
		},
		options: [
			{
				name: 'Latest',
				value: 'latest',
			},
			{
				name: 'Pending',
				value: 'pending',
			},
			{
				name: 'Earliest',
				value: 'earliest',
			},
			{
				name: 'Safe',
				value: 'safe',
			},
			{
				name: 'Finalized',
				value: 'finalized',
			},
		],
		default: 'latest',
		description: 'The block tag to query',
	},
	{
		displayName: 'Include Transactions',
		name: 'includeTransactions',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlock', 'getLatestBlock'],
			},
		},
		default: false,
		description: 'Whether to include full transaction objects in the response',
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getBlockTransactions'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Maximum number of transactions to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				description: 'Number of transactions to skip',
			},
		],
	},
];

// Execute function
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');
	const provider = await getProvider(credentials);

	let result: IDataObject = {};

	if (operation === 'getBlock') {
		const blockIdentifierType = this.getNodeParameter('blockIdentifierType', index) as string;
		const includeTransactions = this.getNodeParameter('includeTransactions', index, false) as boolean;

		let blockTag: string | number;
		if (blockIdentifierType === 'number') {
			blockTag = this.getNodeParameter('blockNumber', index) as number;
		} else if (blockIdentifierType === 'hash') {
			blockTag = this.getNodeParameter('blockHash', index) as string;
		} else {
			blockTag = this.getNodeParameter('blockTag', index) as string;
		}

		const block = await provider.getBlock(blockTag, includeTransactions);
		if (!block) {
			throw new NodeOperationError(this.getNode(), 'Block not found');
		}

		result = {
			number: block.number,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: block.timestamp,
			timestampDate: new Date(block.timestamp * 1000).toISOString(),
			nonce: block.nonce,
			difficulty: block.difficulty?.toString(),
			gasLimit: block.gasLimit.toString(),
			gasUsed: block.gasUsed.toString(),
			miner: block.miner,
			extraData: block.extraData,
			baseFeePerGas: block.baseFeePerGas?.toString(),
			transactionCount: block.transactions?.length || 0,
			transactions: includeTransactions ? block.transactions : block.transactions?.map((tx: any) => typeof tx === 'string' ? tx : tx.hash),
		};
	}

	if (operation === 'getLatestBlock') {
		const includeTransactions = this.getNodeParameter('includeTransactions', index, false) as boolean;

		const block = await provider.getBlock('latest', includeTransactions);
		if (!block) {
			throw new NodeOperationError(this.getNode(), 'Failed to get latest block');
		}

		result = {
			number: block.number,
			hash: block.hash,
			parentHash: block.parentHash,
			timestamp: block.timestamp,
			timestampDate: new Date(block.timestamp * 1000).toISOString(),
			nonce: block.nonce,
			difficulty: block.difficulty?.toString(),
			gasLimit: block.gasLimit.toString(),
			gasUsed: block.gasUsed.toString(),
			miner: block.miner,
			extraData: block.extraData,
			baseFeePerGas: block.baseFeePerGas?.toString(),
			transactionCount: block.transactions?.length || 0,
			transactions: includeTransactions ? block.transactions : block.transactions?.map((tx: any) => typeof tx === 'string' ? tx : tx.hash),
		};
	}

	if (operation === 'getBlockTransactions') {
		const blockIdentifierType = this.getNodeParameter('blockIdentifierType', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;
		const limit = (options.limit as number) || 100;
		const offset = (options.offset as number) || 0;

		let blockTag: string | number;
		if (blockIdentifierType === 'number') {
			blockTag = this.getNodeParameter('blockNumber', index) as number;
		} else if (blockIdentifierType === 'hash') {
			blockTag = this.getNodeParameter('blockHash', index) as string;
		} else {
			blockTag = this.getNodeParameter('blockTag', index) as string;
		}

		const block = await provider.getBlock(blockTag, true);
		if (!block) {
			throw new NodeOperationError(this.getNode(), 'Block not found');
		}

		const transactions = block.transactions || [];
		const paginatedTxs = transactions.slice(offset, offset + limit);

		const formattedTxs = paginatedTxs.map((tx: any) => {
			if (typeof tx === 'string') {
				return { hash: tx };
			}
			return {
				hash: tx.hash,
				from: tx.from,
				to: tx.to,
				value: tx.value?.toString(),
				gasLimit: tx.gasLimit?.toString(),
				gasPrice: tx.gasPrice?.toString(),
				maxFeePerGas: tx.maxFeePerGas?.toString(),
				maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
				nonce: tx.nonce,
				data: tx.data,
				type: tx.type,
				chainId: tx.chainId?.toString(),
			};
		});

		result = {
			blockNumber: block.number,
			blockHash: block.hash,
			totalTransactions: transactions.length,
			returnedTransactions: formattedTxs.length,
			offset,
			limit,
			transactions: formattedTxs,
		};
	}

	if (operation === 'getBlockNumber') {
		const blockNumber = await provider.getBlockNumber();

		result = {
			blockNumber,
			network: credentials.network,
			timestamp: new Date().toISOString(),
		};
	}

	if (operation === 'getBlockTimestamp') {
		const blockIdentifierType = this.getNodeParameter('blockIdentifierType', index) as string;

		let blockTag: string | number;
		if (blockIdentifierType === 'number') {
			blockTag = this.getNodeParameter('blockNumber', index) as number;
		} else if (blockIdentifierType === 'hash') {
			blockTag = this.getNodeParameter('blockHash', index) as string;
		} else {
			blockTag = this.getNodeParameter('blockTag', index) as string;
		}

		const block = await provider.getBlock(blockTag);
		if (!block) {
			throw new NodeOperationError(this.getNode(), 'Block not found');
		}

		result = {
			blockNumber: block.number,
			blockHash: block.hash,
			timestamp: block.timestamp,
			timestampDate: new Date(block.timestamp * 1000).toISOString(),
			unixTime: block.timestamp,
		};
	}

	if (operation === 'getL1BlockNumber') {
		// Use ArbSys precompile to get the corresponding L1 block number
		const arbSys = getPrecompileContract(provider, 'ArbSys');
		
		const l2BlockNumber = await provider.getBlockNumber();
		const l1BlockNumber = await arbSys.arbBlockNumber();

		result = {
			l2BlockNumber,
			l1BlockNumber: l1BlockNumber.toString(),
			network: credentials.network,
			timestamp: new Date().toISOString(),
			description: 'L1 block number corresponding to the current L2 state',
		};
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}

export const block = { operations, fields, execute };
