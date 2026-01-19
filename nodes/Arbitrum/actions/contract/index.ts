/**
 * Smart Contract Resource Actions
 * Operations for Arbitrum smart contract interactions
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
	estimateArbitrumGas,
} from '../../transport/provider';
import { createArbiscanClient } from '../../transport/explorerApi';
import { ABIS } from '../../constants/abis';
import type { ArbitrumNetworkId } from '../../constants/networks';

export const contractOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contract'],
			},
		},
		options: [
			{
				name: 'Read Contract',
				value: 'read',
				description: 'Call a read-only contract function',
				action: 'Read contract',
			},
			{
				name: 'Write Contract',
				value: 'write',
				description: 'Execute a contract function that modifies state',
				action: 'Write contract',
			},
			{
				name: 'Get Contract ABI',
				value: 'getAbi',
				description: 'Get verified contract ABI from Arbiscan',
				action: 'Get contract ABI',
			},
			{
				name: 'Encode Function Call',
				value: 'encode',
				description: 'Encode function call data',
				action: 'Encode function call',
			},
			{
				name: 'Decode Function Result',
				value: 'decode',
				description: 'Decode function call result',
				action: 'Decode function result',
			},
			{
				name: 'Get Contract Events',
				value: 'getEvents',
				description: 'Get events emitted by a contract',
				action: 'Get contract events',
			},
			{
				name: 'Deploy Contract',
				value: 'deploy',
				description: 'Deploy a new smart contract',
				action: 'Deploy contract',
			},
			{
				name: 'Estimate Contract Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a contract call',
				action: 'Estimate contract gas',
			},
			{
				name: 'Verify Contract',
				value: 'verify',
				description: 'Verify contract source code on Arbiscan',
				action: 'Verify contract',
			},
			{
				name: 'Get Contract Source',
				value: 'getSource',
				description: 'Get verified contract source code',
				action: 'Get contract source',
			},
			{
				name: 'Multicall',
				value: 'multicall',
				description: 'Batch multiple read calls into one',
				action: 'Multicall',
			},
		],
		default: 'read',
	},
];

export const contractFields: INodeProperties[] = [
	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The smart contract address',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: [
					'read',
					'write',
					'getAbi',
					'getEvents',
					'estimateGas',
					'verify',
					'getSource',
				],
			},
		},
	},
	// ABI input
	{
		displayName: 'ABI Source',
		name: 'abiSource',
		type: 'options',
		default: 'manual',
		description: 'Where to get the contract ABI',
		options: [
			{ name: 'Enter Manually', value: 'manual' },
			{ name: 'Fetch from Arbiscan', value: 'arbiscan' },
		],
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['read', 'write', 'encode', 'decode', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Contract ABI (JSON array)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['read', 'write', 'encode', 'decode', 'estimateGas', 'deploy'],
				abiSource: ['manual'],
			},
		},
	},
	// Function name and args
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'balanceOf',
		description: 'The function name to call',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['read', 'write', 'encode', 'decode', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Function Arguments',
		name: 'functionArgs',
		type: 'json',
		default: '[]',
		placeholder: '["0x...", 100]',
		description: 'Function arguments as JSON array',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['read', 'write', 'encode', 'estimateGas'],
			},
		},
	},
	// Encoded data for decode
	{
		displayName: 'Encoded Data',
		name: 'encodedData',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The encoded data to decode',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['decode'],
			},
		},
	},
	// Value for write operations
	{
		displayName: 'ETH Value',
		name: 'value',
		type: 'string',
		default: '0',
		placeholder: '0.1',
		description: 'ETH value to send with the transaction',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['write', 'estimateGas'],
			},
		},
	},
	// Deploy fields
	{
		displayName: 'Bytecode',
		name: 'bytecode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x608060405234801...',
		description: 'Contract bytecode (hex string)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deploy'],
			},
		},
	},
	{
		displayName: 'Constructor Arguments',
		name: 'constructorArgs',
		type: 'json',
		default: '[]',
		placeholder: '["arg1", 100]',
		description: 'Constructor arguments as JSON array',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['deploy'],
			},
		},
	},
	// Events filter
	{
		displayName: 'Event Name',
		name: 'eventName',
		type: 'string',
		default: '',
		placeholder: 'Transfer',
		description: 'Event name to filter (leave empty for all events)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getEvents'],
			},
		},
	},
	{
		displayName: 'From Block',
		name: 'fromBlock',
		type: 'number',
		default: 0,
		description: 'Starting block number (0 for latest - 1000)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getEvents'],
			},
		},
	},
	{
		displayName: 'To Block',
		name: 'toBlock',
		type: 'string',
		default: 'latest',
		description: 'Ending block number or "latest"',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['getEvents'],
			},
		},
	},
	// Verify fields
	{
		displayName: 'Source Code',
		name: 'sourceCode',
		type: 'string',
		typeOptions: {
			rows: 10,
		},
		required: true,
		default: '',
		description: 'Contract source code (Solidity)',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verify'],
			},
		},
	},
	{
		displayName: 'Contract Name',
		name: 'contractName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'MyContract',
		description: 'Contract name',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verify'],
			},
		},
	},
	{
		displayName: 'Compiler Version',
		name: 'compilerVersion',
		type: 'string',
		required: true,
		default: 'v0.8.19+commit.7dd6d404',
		description: 'Solidity compiler version',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verify'],
			},
		},
	},
	{
		displayName: 'Optimization',
		name: 'optimization',
		type: 'boolean',
		default: true,
		description: 'Whether optimization was enabled',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verify'],
			},
		},
	},
	{
		displayName: 'Optimization Runs',
		name: 'optimizationRuns',
		type: 'number',
		default: 200,
		description: 'Number of optimization runs',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['verify'],
				optimization: [true],
			},
		},
	},
	// Multicall fields
	{
		displayName: 'Calls',
		name: 'calls',
		type: 'json',
		required: true,
		default: '[]',
		placeholder: '[{"target": "0x...", "callData": "0x..."}]',
		description: 'Array of calls: [{target, callData}]',
		displayOptions: {
			show: {
				resource: ['contract'],
				operation: ['multicall'],
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
				resource: ['contract'],
				operation: ['write', 'deploy'],
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
				resource: ['contract'],
				operation: ['write', 'deploy'],
				waitForConfirmation: [true],
			},
		},
	},
];

/**
 * Execute contract operations
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
			case 'read':
				result = await readContract.call(this, index, credentials, network);
				break;
			case 'write':
				result = await writeContract.call(this, index, credentials, network);
				break;
			case 'getAbi':
				result = await getContractAbi.call(this, index, network);
				break;
			case 'encode':
				result = await encodeFunctionCall.call(this, index);
				break;
			case 'decode':
				result = await decodeFunctionResult.call(this, index);
				break;
			case 'getEvents':
				result = await getContractEvents.call(this, index, credentials, network);
				break;
			case 'deploy':
				result = await deployContract.call(this, index, credentials);
				break;
			case 'estimateGas':
				result = await estimateContractGas.call(this, index, credentials, network);
				break;
			case 'verify':
				result = await verifyContract.call(this, index, network);
				break;
			case 'getSource':
				result = await getContractSource.call(this, index, network);
				break;
			case 'multicall':
				result = await multicall.call(this, index, credentials);
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
			`Contract operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}

	return result;
}

// Helper to get ABI
async function getAbi(
	executeFunctions: IExecuteFunctions,
	index: number,
	contractAddress: string,
	network: ArbitrumNetworkId,
): Promise<any[]> {
	const abiSource = executeFunctions.getNodeParameter('abiSource', index, 'manual') as string;

	if (abiSource === 'manual') {
		const abiStr = executeFunctions.getNodeParameter('abi', index) as string;
		return typeof abiStr === 'string' ? JSON.parse(abiStr) : abiStr;
	}

	// Fetch from Arbiscan
	const arbiscanCredentials = await executeFunctions.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const abiStr = await client.getContractABI(contractAddress);
	if (!abiStr) {
		throw new NodeOperationError(
			executeFunctions.getNode(),
			'Contract ABI not found on Arbiscan. The contract may not be verified.',
			{ itemIndex: index },
		);
	}

	return typeof abiStr === 'string' ? JSON.parse(abiStr) : abiStr;
}

// Operation implementations

async function readContract(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const functionName = this.getNodeParameter('functionName', index) as string;
	const functionArgsStr = this.getNodeParameter('functionArgs', index, '[]') as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const abi = await getAbi(this, index, contractAddress, network);
	const functionArgs = typeof functionArgsStr === 'string' ? JSON.parse(functionArgsStr) : functionArgsStr;

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(contractAddress, abi, provider);

	if (!contract[functionName]) {
		throw new NodeOperationError(
			this.getNode(),
			`Function "${functionName}" not found in contract`,
			{ itemIndex: index },
		);
	}

	const result = await contract[functionName](...functionArgs);

	// Format result
	const formattedResult = formatContractResult(result);

	return [
		{
			json: {
				contractAddress,
				functionName,
				functionArgs,
				result: formattedResult,
				network: credentials.network,
			},
		},
	];
}

async function writeContract(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const functionName = this.getNodeParameter('functionName', index) as string;
	const functionArgsStr = this.getNodeParameter('functionArgs', index, '[]') as string;
	const value = this.getNodeParameter('value', index, '0') as string;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to write to contracts',
			{ itemIndex: index },
		);
	}

	const abi = await getAbi(this, index, contractAddress, network);
	const functionArgs = typeof functionArgsStr === 'string' ? JSON.parse(functionArgsStr) : functionArgsStr;

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const contract = new ethers.Contract(contractAddress, abi, signer);

	if (!contract[functionName]) {
		throw new NodeOperationError(
			this.getNode(),
			`Function "${functionName}" not found in contract`,
			{ itemIndex: index },
		);
	}

	const txOptions: any = {};
	if (parseFloat(value) > 0) {
		txOptions.value = ethers.parseEther(value);
	}

	const txResponse = await contract[functionName](...functionArgs, txOptions);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				contractAddress,
				functionName,
				functionArgs,
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
							logs: receipt.logs.length,
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function getContractAbi(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const abi = await client.getContractABI(contractAddress);

	return [
		{
			json: {
				contractAddress,
				abi,
				verified: !!abi,
				network,
			},
		},
	];
}

async function encodeFunctionCall(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const abiStr = this.getNodeParameter('abi', index) as string;
	const functionName = this.getNodeParameter('functionName', index) as string;
	const functionArgsStr = this.getNodeParameter('functionArgs', index, '[]') as string;

	const abi = typeof abiStr === 'string' ? JSON.parse(abiStr) : abiStr;
	const functionArgs = typeof functionArgsStr === 'string' ? JSON.parse(functionArgsStr) : functionArgsStr;

	const iface = new ethers.Interface(abi);
	const encodedData = iface.encodeFunctionData(functionName, functionArgs);

	return [
		{
			json: {
				functionName,
				functionArgs,
				encodedData,
				selector: encodedData.slice(0, 10),
			},
		},
	];
}

async function decodeFunctionResult(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const abiStr = this.getNodeParameter('abi', index) as string;
	const functionName = this.getNodeParameter('functionName', index) as string;
	const encodedData = this.getNodeParameter('encodedData', index) as string;

	const abi = typeof abiStr === 'string' ? JSON.parse(abiStr) : abiStr;

	const iface = new ethers.Interface(abi);
	const decoded = iface.decodeFunctionResult(functionName, encodedData);

	return [
		{
			json: {
				functionName,
				encodedData,
				decoded: formatContractResult(decoded),
			},
		},
	];
}

async function getContractEvents(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const eventName = this.getNodeParameter('eventName', index, '') as string;
	const fromBlock = this.getNodeParameter('fromBlock', index, 0) as number;
	const toBlockStr = this.getNodeParameter('toBlock', index, 'latest') as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);

	// Calculate blocks if needed
	let startBlock = fromBlock;
	if (startBlock === 0) {
		const latestBlock = await provider.getBlockNumber();
		startBlock = Math.max(0, latestBlock - 1000);
	}

	const toBlock = toBlockStr === 'latest' ? 'latest' : parseInt(toBlockStr, 10);

	// Get ABI from Arbiscan for event parsing
	let abi: any[] | null = null;
	try {
		const arbiscanCredentials = await this.getCredentials('arbiscan');
		const client = createArbiscanClient(arbiscanCredentials);
		const abiStr = await client.getContractABI(contractAddress);
		abi = abiStr ? JSON.parse(abiStr) : null;
	} catch {
		// Continue without ABI
	}

	// Build filter
	let filter: ethers.EventLog[] = [];
	
	if (abi && eventName) {
		const contract = new ethers.Contract(contractAddress, abi, provider);
		const eventFilter = contract.filters[eventName]?.();
		if (eventFilter) {
			filter = (await contract.queryFilter(eventFilter, startBlock, toBlock)) as ethers.EventLog[];
		}
	} else {
		// Get all logs for the contract
		const logs = await provider.getLogs({
			address: contractAddress,
			fromBlock: startBlock,
			toBlock,
		});
		filter = logs as any;
	}

	// Format events
	const events = filter.map((log: any) => ({
		blockNumber: log.blockNumber,
		transactionHash: log.transactionHash,
		logIndex: log.index ?? log.logIndex,
		address: log.address,
		topics: log.topics,
		data: log.data,
		eventName: log.eventName,
		args: log.args ? formatContractResult(log.args) : null,
	}));

	return [
		{
			json: {
				contractAddress,
				eventName: eventName || 'all',
				fromBlock: startBlock,
				toBlock,
				eventCount: events.length,
				events,
				network: credentials.network,
			},
		},
	];
}

async function deployContract(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const abiStr = this.getNodeParameter('abi', index) as string;
	const bytecode = this.getNodeParameter('bytecode', index) as string;
	const constructorArgsStr = this.getNodeParameter('constructorArgs', index, '[]') as string;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to deploy contracts',
			{ itemIndex: index },
		);
	}

	const abi = typeof abiStr === 'string' ? JSON.parse(abiStr) : abiStr;
	const constructorArgs = typeof constructorArgsStr === 'string' 
		? JSON.parse(constructorArgsStr) 
		: constructorArgsStr;

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const factory = new ethers.ContractFactory(abi, bytecode, signer);
	const contract = await factory.deploy(...constructorArgs);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await contract.deploymentTransaction()?.wait(confirmations);
	}

	const contractAddress = await contract.getAddress();

	return [
		{
			json: {
				success: true,
				contractAddress,
				deploymentHash: contract.deploymentTransaction()?.hash,
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

async function estimateContractGas(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const functionName = this.getNodeParameter('functionName', index) as string;
	const functionArgsStr = this.getNodeParameter('functionArgs', index, '[]') as string;
	const value = this.getNodeParameter('value', index, '0') as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const abi = await getAbi(this, index, contractAddress, network);
	const functionArgs = typeof functionArgsStr === 'string' ? JSON.parse(functionArgsStr) : functionArgsStr;

	const { provider } = await createProvider(credentials);
	const iface = new ethers.Interface(abi);
	const data = iface.encodeFunctionData(functionName, functionArgs);

	const gasEstimate = await estimateArbitrumGas(provider, {
		to: contractAddress,
		data,
		value: parseFloat(value) > 0 ? ethers.parseEther(value) : 0n,
	});

	return [
		{
			json: {
				contractAddress,
				functionName,
				gasLimit: gasEstimate.gasLimit.toString(),
				maxFeePerGas: gasEstimate.maxFeePerGas.toString(),
				maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas.toString(),
				l1DataFee: gasEstimate.l1DataFee.toString(),
				l2ExecutionFee: gasEstimate.l2ExecutionFee.toString(),
				totalFee: gasEstimate.totalFee.toString(),
				gasLimitFormatted: gasEstimate.gasLimit.toString(),
				l1DataFeeEth: ethers.formatEther(gasEstimate.l1DataFee),
				l2ExecutionFeeEth: ethers.formatEther(gasEstimate.l2ExecutionFee),
				totalFeeEth: ethers.formatEther(gasEstimate.totalFee),
				network: credentials.network,
			},
		},
	];
}

async function verifyContract(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const sourceCode = this.getNodeParameter('sourceCode', index) as string;
	const contractName = this.getNodeParameter('contractName', index) as string;
	const compilerVersion = this.getNodeParameter('compilerVersion', index) as string;
	const optimization = this.getNodeParameter('optimization', index, true) as boolean;
	const optimizationRuns = this.getNodeParameter('optimizationRuns', index, 200) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const guid = await client.verifyContract({
		address: contractAddress,
		sourceCode,
		contractName,
		compilerVersion,
		optimizationUsed: optimization,
		runs: optimizationRuns,
	});

	return [
		{
			json: {
				contractAddress,
				guid,
				message: 'Verification submitted. Use GUID to check status.',
				network,
			},
		},
	];
}

async function getContractSource(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const sourceInfo = await client.getContractSource(contractAddress);

	return [
		{
			json: {
				contractAddress,
				...sourceInfo,
				network,
			},
		},
	];
}

async function multicall(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const callsStr = this.getNodeParameter('calls', index) as string;
	const calls = typeof callsStr === 'string' ? JSON.parse(callsStr) : callsStr;

	const { provider } = await createProvider(credentials);

	// Use Multicall3 contract
	const multicallAddress = '0xcA11bde05977b3631167028862bE2a173976CA11';
	const multicallContract = new ethers.Contract(multicallAddress, ABIS.Multicall3, provider);

	const results = await multicallContract.aggregate.staticCall(
		calls.map((c: any) => ({
			target: c.target,
			callData: c.callData,
		})),
	);

	return [
		{
			json: {
				blockNumber: results.blockNumber?.toString(),
				results: results.returnData,
				callCount: calls.length,
				network: credentials.network,
			},
		},
	];
}

// Helper to format contract results
function formatContractResult(result: any): any {
	if (result === null || result === undefined) return result;
	if (typeof result === 'bigint') return result.toString();
	if (Array.isArray(result)) {
		// Check if it's a Result object (has named properties)
		const formatted: any = result.map(formatContractResult);
		// Also include named properties
		for (const key of Object.keys(result)) {
			if (isNaN(parseInt(key, 10))) {
				formatted[key] = formatContractResult((result as any)[key]);
			}
		}
		return formatted;
	}
	if (typeof result === 'object') {
		const formatted: any = {};
		for (const [key, value] of Object.entries(result)) {
			formatted[key] = formatContractResult(value);
		}
		return formatted;
	}
	return result;
}

export const contract = {
	operations: contractOperations,
	fields: contractFields,
	execute,
};
