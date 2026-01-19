import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createProvider, validateAddress } from '../../transport/provider';
import { ArbiscanClient } from '../../transport/explorerApi';

// Events resource operations
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['events'],
			},
		},
		options: [
			{
				name: 'Get Logs',
				value: 'getLogs',
				description: 'Get filtered logs',
				action: 'Get filtered logs',
			},
			{
				name: 'Decode Log',
				value: 'decodeLog',
				description: 'Decode a log entry using ABI',
				action: 'Decode a log entry using ABI',
			},
			{
				name: 'Get Events by Contract',
				value: 'getEventsByContract',
				description: 'Get all events emitted by a contract',
				action: 'Get all events emitted by a contract',
			},
			{
				name: 'Get Events by Topic',
				value: 'getEventsByTopic',
				description: 'Get events matching a specific topic',
				action: 'Get events matching a specific topic',
			},
			{
				name: 'Get Transfer Events',
				value: 'getTransferEvents',
				description: 'Get ERC-20 Transfer events',
				action: 'Get ERC-20 Transfer events',
			},
			{
				name: 'Build Log Filter',
				value: 'buildLogFilter',
				description: 'Build a log filter for event queries',
				action: 'Build a log filter for event queries',
			},
		],
		default: 'getLogs',
	},
];

// Events resource fields
export const fields: INodeProperties[] = [
	// Get Logs fields
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getLogs', 'getEventsByContract', 'getTransferEvents'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The contract address to query events from',
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getLogs', 'getEventsByContract', 'getEventsByTopic', 'getTransferEvents'],
			},
		},
		default: 'latest',
		description: 'Start block number or tag (latest, earliest, pending)',
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getLogs', 'getEventsByContract', 'getEventsByTopic', 'getTransferEvents'],
			},
		},
		default: 'latest',
		description: 'End block number or tag (latest, earliest, pending)',
	},
	// Topics
	{
		displayName: 'Topics',
		name: 'topics',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getLogs'],
			},
		},
		default: {},
		options: [
			{
				name: 'topicValues',
				displayName: 'Topic',
				values: [
					{
						displayName: 'Topic Index',
						name: 'index',
						type: 'options',
						options: [
							{ name: 'Topic 0 (Event Signature)', value: 0 },
							{ name: 'Topic 1 (First Indexed Param)', value: 1 },
							{ name: 'Topic 2 (Second Indexed Param)', value: 2 },
							{ name: 'Topic 3 (Third Indexed Param)', value: 3 },
						],
						default: 0,
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: '0x...',
						description: 'Topic value (32-byte hex)',
					},
				],
			},
		],
		description: 'Filter by topics (topic0 is event signature)',
	},
	// Get Events by Topic
	{
		displayName: 'Topic',
		name: 'topic',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getEventsByTopic'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The topic to filter by (keccak256 hash of event signature)',
	},
	{
		displayName: 'Contract Addresses',
		name: 'contractAddresses',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getEventsByTopic'],
			},
		},
		default: '',
		placeholder: '0x..., 0x...',
		description: 'Comma-separated contract addresses to filter (optional)',
	},
	// Decode Log fields
	{
		displayName: 'Log Data',
		name: 'logData',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['decodeLog'],
			},
		},
		default: '',
		description: 'The log data to decode (hex string)',
	},
	{
		displayName: 'Log Topics',
		name: 'logTopics',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['decodeLog'],
			},
		},
		default: '',
		placeholder: '["0x...", "0x..."]',
		description: 'Log topics as JSON array',
	},
	{
		displayName: 'Event ABI',
		name: 'eventAbi',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['decodeLog'],
			},
		},
		default: '',
		placeholder: 'event Transfer(address indexed from, address indexed to, uint256 value)',
		description: 'The event ABI signature',
	},
	// Transfer Events fields
	{
		displayName: 'Filter By',
		name: 'transferFilter',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getTransferEvents'],
			},
		},
		options: [
			{
				name: 'All Transfers',
				value: 'all',
			},
			{
				name: 'From Address',
				value: 'from',
			},
			{
				name: 'To Address',
				value: 'to',
			},
		],
		default: 'all',
		description: 'Filter transfers by sender or recipient',
	},
	{
		displayName: 'Filter Address',
		name: 'filterAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['getTransferEvents'],
				transferFilter: ['from', 'to'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to filter by',
	},
	// Build Log Filter fields
	{
		displayName: 'Event Signature',
		name: 'eventSignature',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['buildLogFilter'],
			},
		},
		default: '',
		placeholder: 'Transfer(address,address,uint256)',
		description: 'Event signature to generate topic hash',
	},
	{
		displayName: 'Indexed Parameters',
		name: 'indexedParams',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['events'],
				operation: ['buildLogFilter'],
			},
		},
		default: {},
		options: [
			{
				name: 'paramValues',
				displayName: 'Parameter',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Address', value: 'address' },
							{ name: 'Uint256', value: 'uint256' },
							{ name: 'Bytes32', value: 'bytes32' },
							{ name: 'Bool', value: 'bool' },
						],
						default: 'address',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Parameter value (leave empty for null/any)',
					},
				],
			},
		],
		description: 'Values for indexed parameters',
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
				resource: ['events'],
				operation: ['getLogs', 'getEventsByContract', 'getEventsByTopic', 'getTransferEvents'],
			},
		},
		options: [
			{
				displayName: 'Use Explorer API',
				name: 'useExplorerApi',
				type: 'boolean',
				default: false,
				description: 'Whether to use Arbiscan API for larger block ranges',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				description: 'Page number (when using explorer API)',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 100,
				description: 'Number of results per page (max 1000)',
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
	const { provider } = await createProvider(credentials);

	let result: IDataObject = {};

	if (operation === 'getLogs') {
		const contractAddress = this.getNodeParameter('contractAddress', index) as string;
		const fromBlock = this.getNodeParameter('fromBlock', index) as string;
		const toBlock = this.getNodeParameter('toBlock', index) as string;
		const topicsInput = this.getNodeParameter('topics', index, {}) as IDataObject;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!validateAddress(contractAddress)) {
			throw new NodeOperationError(this.getNode(), 'Invalid contract address');
		}

		// Build topics array
		const topics: (string | null)[] = [null, null, null, null];
		const topicValues = (topicsInput.topicValues as IDataObject[]) || [];
		for (const topic of topicValues) {
			const idx = topic.index as number;
			const value = topic.value as string;
			if (value) {
				topics[idx] = value;
			}
		}

		// Remove trailing nulls
		while (topics.length > 0 && topics[topics.length - 1] === null) {
			topics.pop();
		}

		const filter = {
			address: contractAddress,
			fromBlock: isNaN(Number(fromBlock)) ? fromBlock : Number(fromBlock),
			toBlock: isNaN(Number(toBlock)) ? toBlock : Number(toBlock),
			topics: topics.length > 0 ? topics : undefined,
		};

		if (options.useExplorerApi) {
			try {
				const arbiscanCredentials = await this.getCredentials('arbiscan');
				const arbiscan = new ArbiscanClient(arbiscanCredentials);

				const logs = await arbiscan.getLogs({
					address: contractAddress,
					fromBlock: typeof filter.fromBlock === 'number' ? filter.fromBlock : undefined,
					toBlock: typeof filter.toBlock === 'number' ? filter.toBlock : undefined,
					topic0: topics[0] || undefined,
					topic1: topics[1] || undefined,
					topic2: topics[2] || undefined,
					topic3: topics[3] || undefined,
					page: options.page as number,
					offset: options.offset as number,
				});

				result = {
					logs,
					count: logs.length,
					filter,
				};
			} catch (error) {
				throw new NodeOperationError(this.getNode(), `Arbiscan API error: ${error}`);
			}
		} else {
			const logs = await provider.getLogs(filter);

			result = {
				logs: logs.map(log => ({
					address: log.address,
					topics: log.topics,
					data: log.data,
					blockNumber: log.blockNumber,
					blockHash: log.blockHash,
					transactionHash: log.transactionHash,
					transactionIndex: log.transactionIndex,
					logIndex: log.index,
					removed: log.removed,
				})),
				count: logs.length,
				filter,
			};
		}
	}

	if (operation === 'decodeLog') {
		const logData = this.getNodeParameter('logData', index) as string;
		const logTopicsStr = this.getNodeParameter('logTopics', index) as string;
		const eventAbi = this.getNodeParameter('eventAbi', index) as string;

		let logTopics: string[];
		try {
			logTopics = JSON.parse(logTopicsStr);
		} catch {
			throw new NodeOperationError(this.getNode(), 'Invalid log topics JSON');
		}

		try {
			const iface = new ethers.Interface([eventAbi]);
			const fragment = iface.fragments[0];
			
			if (!fragment || fragment.type !== 'event') {
				throw new NodeOperationError(this.getNode(), 'Invalid event ABI');
			}

			const eventFragment = fragment as ethers.EventFragment;
			const decoded = iface.decodeEventLog(eventFragment, logData, logTopics);

			// Format decoded values
			const formattedArgs: IDataObject = {};
			const inputs = eventFragment.inputs;
			
			for (let i = 0; i < inputs.length; i++) {
				const input = inputs[i];
				const value = decoded[i];
				formattedArgs[input.name || `arg${i}`] = typeof value === 'bigint' ? value.toString() : value;
			}

			result = {
				eventName: eventFragment.name,
				signature: eventFragment.format(),
				args: formattedArgs,
				topic: ethers.id(eventFragment.format()),
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to decode log: ${error}`);
		}
	}

	if (operation === 'getEventsByContract') {
		const contractAddress = this.getNodeParameter('contractAddress', index) as string;
		const fromBlock = this.getNodeParameter('fromBlock', index) as string;
		const toBlock = this.getNodeParameter('toBlock', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!validateAddress(contractAddress)) {
			throw new NodeOperationError(this.getNode(), 'Invalid contract address');
		}

		const filter = {
			address: contractAddress,
			fromBlock: isNaN(Number(fromBlock)) ? fromBlock : Number(fromBlock),
			toBlock: isNaN(Number(toBlock)) ? toBlock : Number(toBlock),
		};

		const logs = await provider.getLogs(filter);

		// Group logs by topic0 (event signature)
		const eventGroups: IDataObject = {};
		for (const log of logs) {
			const topic0 = log.topics[0] || 'unknown';
			if (!eventGroups[topic0]) {
				eventGroups[topic0] = [];
			}
			(eventGroups[topic0] as IDataObject[]).push({
				address: log.address,
				topics: log.topics,
				data: log.data,
				blockNumber: log.blockNumber,
				transactionHash: log.transactionHash,
				logIndex: log.index,
			});
		}

		result = {
			contractAddress,
			totalLogs: logs.length,
			uniqueEvents: Object.keys(eventGroups).length,
			eventGroups,
			blockRange: {
				from: filter.fromBlock,
				to: filter.toBlock,
			},
		};
	}

	if (operation === 'getEventsByTopic') {
		const topic = this.getNodeParameter('topic', index) as string;
		const fromBlock = this.getNodeParameter('fromBlock', index) as string;
		const toBlock = this.getNodeParameter('toBlock', index) as string;
		const contractAddressesStr = this.getNodeParameter('contractAddresses', index, '') as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		const contractAddresses = contractAddressesStr
			? contractAddressesStr.split(',').map(a => a.trim()).filter(Boolean)
			: undefined;

		if (contractAddresses) {
			for (const addr of contractAddresses) {
				if (!validateAddress(addr)) {
					throw new NodeOperationError(this.getNode(), `Invalid contract address: ${addr}`);
				}
			}
		}

		const filter = {
			address: contractAddresses && contractAddresses.length === 1 ? contractAddresses[0] : undefined,
			fromBlock: isNaN(Number(fromBlock)) ? fromBlock : Number(fromBlock),
			toBlock: isNaN(Number(toBlock)) ? toBlock : Number(toBlock),
			topics: [topic],
		};

		let logs = await provider.getLogs(filter);

		// Filter by multiple addresses if needed
		if (contractAddresses && contractAddresses.length > 1) {
			const addressSet = new Set(contractAddresses.map(a => a.toLowerCase()));
			logs = logs.filter(log => addressSet.has(log.address.toLowerCase()));
		}

		result = {
			topic,
			logs: logs.map(log => ({
				address: log.address,
				topics: log.topics,
				data: log.data,
				blockNumber: log.blockNumber,
				transactionHash: log.transactionHash,
				logIndex: log.index,
			})),
			count: logs.length,
			blockRange: {
				from: filter.fromBlock,
				to: filter.toBlock,
			},
		};
	}

	if (operation === 'getTransferEvents') {
		const contractAddress = this.getNodeParameter('contractAddress', index) as string;
		const fromBlock = this.getNodeParameter('fromBlock', index) as string;
		const toBlock = this.getNodeParameter('toBlock', index) as string;
		const transferFilter = this.getNodeParameter('transferFilter', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!validateAddress(contractAddress)) {
			throw new NodeOperationError(this.getNode(), 'Invalid contract address');
		}

		// ERC-20 Transfer event signature
		const transferTopic = ethers.id('Transfer(address,address,uint256)');

		const topics: (string | null)[] = [transferTopic];

		if (transferFilter === 'from') {
			const filterAddress = this.getNodeParameter('filterAddress', index) as string;
			if (!validateAddress(filterAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid filter address');
			}
			topics.push(ethers.zeroPadValue(filterAddress, 32));
		} else if (transferFilter === 'to') {
			const filterAddress = this.getNodeParameter('filterAddress', index) as string;
			if (!validateAddress(filterAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid filter address');
			}
			topics.push(null);
			topics.push(ethers.zeroPadValue(filterAddress, 32));
		}

		const filter = {
			address: contractAddress,
			fromBlock: isNaN(Number(fromBlock)) ? fromBlock : Number(fromBlock),
			toBlock: isNaN(Number(toBlock)) ? toBlock : Number(toBlock),
			topics,
		};

		const logs = await provider.getLogs(filter);

		// Decode Transfer events
		const transfers = logs.map(log => {
			const from = '0x' + log.topics[1].slice(26);
			const to = '0x' + log.topics[2].slice(26);
			const value = BigInt(log.data);

			return {
				from: ethers.getAddress(from),
				to: ethers.getAddress(to),
				value: value.toString(),
				blockNumber: log.blockNumber,
				transactionHash: log.transactionHash,
				logIndex: log.index,
			};
		});

		result = {
			contractAddress,
			transfers,
			count: transfers.length,
			blockRange: {
				from: filter.fromBlock,
				to: filter.toBlock,
			},
		};
	}

	if (operation === 'buildLogFilter') {
		const eventSignature = this.getNodeParameter('eventSignature', index) as string;
		const indexedParams = this.getNodeParameter('indexedParams', index, {}) as IDataObject;

		// Generate topic0 from event signature
		const topic0 = ethers.id(eventSignature);

		// Build additional topics from indexed parameters
		const topics: (string | null)[] = [topic0];
		const paramValues = (indexedParams.paramValues as IDataObject[]) || [];

		for (const param of paramValues) {
			const type = param.type as string;
			const value = param.value as string;

			if (!value) {
				topics.push(null);
			} else {
				try {
					let encodedValue: string;
					if (type === 'address') {
						encodedValue = ethers.zeroPadValue(value, 32);
					} else if (type === 'uint256') {
						encodedValue = ethers.zeroPadValue(ethers.toBeHex(BigInt(value)), 32);
					} else if (type === 'bytes32') {
						encodedValue = value;
					} else if (type === 'bool') {
						encodedValue = ethers.zeroPadValue(value.toLowerCase() === 'true' ? '0x01' : '0x00', 32);
					} else {
						encodedValue = value;
					}
					topics.push(encodedValue);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to encode parameter: ${error}`);
				}
			}
		}

		result = {
			eventSignature,
			topic0,
			topics,
			filter: {
				topics,
			},
			usage: 'Use this filter object with getLogs or provider.getLogs()',
		};
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}

export const events = { operations, fields, execute };
