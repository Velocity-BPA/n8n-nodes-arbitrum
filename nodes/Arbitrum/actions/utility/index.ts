import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getProvider, validateAddress } from '../../transport/provider';
import { ARBITRUM_NETWORKS } from '../../constants';
import { ethers } from 'ethers';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Convert Units',
				value: 'convertUnits',
				description: 'Convert between wei, gwei, and ether units',
				action: 'Convert units',
			},
			{
				name: 'Encode ABI',
				value: 'encodeAbi',
				description: 'Encode function call data using ABI',
				action: 'Encode abi',
			},
			{
				name: 'Decode ABI',
				value: 'decodeAbi',
				description: 'Decode function call data or return value using ABI',
				action: 'Decode abi',
			},
			{
				name: 'Keccak256 Hash',
				value: 'keccak256',
				description: 'Calculate Keccak256 hash of data',
				action: 'Keccak256 hash',
			},
			{
				name: 'Sign Message',
				value: 'signMessage',
				description: 'Sign a message with private key',
				action: 'Sign message',
			},
			{
				name: 'Verify Signature',
				value: 'verifySignature',
				description: 'Verify a signed message',
				action: 'Verify signature',
			},
			{
				name: 'Get Chain ID',
				value: 'getChainId',
				description: 'Get the current chain ID',
				action: 'Get chain id',
			},
			{
				name: 'Get Network Status',
				value: 'getNetworkStatus',
				description: 'Get detailed network status information',
				action: 'Get network status',
			},
			{
				name: 'Estimate L1 Data Fee',
				value: 'estimateL1DataFee',
				description: 'Estimate the L1 data posting fee for transaction data',
				action: 'Estimate l1 data fee',
			},
			{
				name: 'Calculate Total Gas',
				value: 'calculateTotalGas',
				description: 'Calculate total gas cost (L2 execution + L1 data fee)',
				action: 'Calculate total gas',
			},
			{
				name: 'Format Address',
				value: 'formatAddress',
				description: 'Validate and format Ethereum address with checksum',
				action: 'Format address',
			},
		],
		default: 'convertUnits',
	},
];

export const fields: INodeProperties[] = [
	// Convert Units
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1.0',
		description: 'The value to convert',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	{
		displayName: 'From Unit',
		name: 'fromUnit',
		type: 'options',
		required: true,
		default: 'ether',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Kwei (1e3)', value: 'kwei' },
			{ name: 'Mwei (1e6)', value: 'mwei' },
			{ name: 'Gwei (1e9)', value: 'gwei' },
			{ name: 'Szabo (1e12)', value: 'szabo' },
			{ name: 'Finney (1e15)', value: 'finney' },
			{ name: 'Ether (1e18)', value: 'ether' },
		],
		description: 'The unit to convert from',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	{
		displayName: 'To Unit',
		name: 'toUnit',
		type: 'options',
		required: true,
		default: 'wei',
		options: [
			{ name: 'Wei', value: 'wei' },
			{ name: 'Kwei (1e3)', value: 'kwei' },
			{ name: 'Mwei (1e6)', value: 'mwei' },
			{ name: 'Gwei (1e9)', value: 'gwei' },
			{ name: 'Szabo (1e12)', value: 'szabo' },
			{ name: 'Finney (1e15)', value: 'finney' },
			{ name: 'Ether (1e18)', value: 'ether' },
		],
		description: 'The unit to convert to',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['convertUnits'],
			},
		},
	},
	// Encode ABI
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		required: true,
		default: '',
		placeholder: '[{"name": "transfer", "type": "function", "inputs": [...]}]',
		description: 'Contract ABI (JSON format)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeAbi', 'decodeAbi'],
			},
		},
	},
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'transfer',
		description: 'Name of the function to encode',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeAbi'],
			},
		},
	},
	{
		displayName: 'Function Arguments',
		name: 'functionArgs',
		type: 'string',
		default: '[]',
		placeholder: '["0x...", "1000000000000000000"]',
		description: 'JSON array of function arguments',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['encodeAbi'],
			},
		},
	},
	// Decode ABI
	{
		displayName: 'Data to Decode',
		name: 'dataToDecode',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Encoded function call data or return value',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeAbi'],
			},
		},
	},
	{
		displayName: 'Decode Type',
		name: 'decodeType',
		type: 'options',
		required: true,
		default: 'functionData',
		options: [
			{ name: 'Function Call Data', value: 'functionData' },
			{ name: 'Function Return Value', value: 'returnValue' },
			{ name: 'Event Log', value: 'eventLog' },
		],
		description: 'Type of data to decode',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeAbi'],
			},
		},
	},
	{
		displayName: 'Function/Event Name',
		name: 'decodeElementName',
		type: 'string',
		default: '',
		placeholder: 'transfer or Transfer',
		description: 'Name of the function or event (required for return value and event log)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeAbi'],
				decodeType: ['returnValue', 'eventLog'],
			},
		},
	},
	{
		displayName: 'Event Topics',
		name: 'eventTopics',
		type: 'string',
		default: '[]',
		placeholder: '["0x...", "0x..."]',
		description: 'JSON array of event topics (for event log decoding)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['decodeAbi'],
				decodeType: ['eventLog'],
			},
		},
	},
	// Keccak256
	{
		displayName: 'Data',
		name: 'hashData',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Hello World or 0x48656c6c6f',
		description: 'Data to hash (text or hex string)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['keccak256'],
			},
		},
	},
	{
		displayName: 'Input Type',
		name: 'hashInputType',
		type: 'options',
		default: 'text',
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'Hex', value: 'hex' },
		],
		description: 'Type of input data',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['keccak256'],
			},
		},
	},
	// Sign Message
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Hello, Arbitrum!',
		description: 'Message to sign',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['signMessage'],
			},
		},
	},
	{
		displayName: 'Message Type',
		name: 'messageType',
		type: 'options',
		default: 'personal',
		options: [
			{ name: 'Personal Message (EIP-191)', value: 'personal' },
			{ name: 'Raw Hash', value: 'hash' },
			{ name: 'Typed Data (EIP-712)', value: 'typed' },
		],
		description: 'Type of message signing',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['signMessage'],
			},
		},
	},
	{
		displayName: 'Typed Data',
		name: 'typedData',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		default: '',
		placeholder: '{"domain": {...}, "types": {...}, "value": {...}}',
		description: 'EIP-712 typed data as JSON',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['signMessage'],
				messageType: ['typed'],
			},
		},
	},
	// Verify Signature
	{
		displayName: 'Message',
		name: 'verifyMessage',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Hello, Arbitrum!',
		description: 'The original message that was signed',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['verifySignature'],
			},
		},
	},
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The signature to verify',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['verifySignature'],
			},
		},
	},
	{
		displayName: 'Expected Signer',
		name: 'expectedSigner',
		type: 'string',
		default: '',
		placeholder: '0x...',
		description: 'Expected signer address (optional - will recover address if not provided)',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['verifySignature'],
			},
		},
	},
	// Estimate L1 Data Fee
	{
		displayName: 'Transaction Data',
		name: 'txData',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Transaction calldata to estimate L1 fee for',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['estimateL1DataFee'],
			},
		},
	},
	// Calculate Total Gas
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Destination address',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateTotalGas'],
			},
		},
	},
	{
		displayName: 'Transaction Data',
		name: 'calcTxData',
		type: 'string',
		default: '0x',
		placeholder: '0x...',
		description: 'Transaction calldata',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateTotalGas'],
			},
		},
	},
	{
		displayName: 'Value (ETH)',
		name: 'calcValue',
		type: 'string',
		default: '0',
		placeholder: '0.1',
		description: 'ETH value to send',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['calculateTotalGas'],
			},
		},
	},
	// Format Address
	{
		displayName: 'Address',
		name: 'addressToFormat',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'Ethereum address to validate and format',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['formatAddress'],
			},
		},
	},
];

// Unit decimals mapping
const UNIT_DECIMALS: Record<string, number> = {
	wei: 0,
	kwei: 3,
	mwei: 6,
	gwei: 9,
	szabo: 12,
	finney: 15,
	ether: 18,
};

// ArbGasInfo precompile ABI
const ARB_GAS_INFO_ABI = [
	'function getL1BaseFeeEstimate() external view returns (uint256)',
	'function getPricesInWei() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
	'function getGasBacklog() external view returns (uint64)',
	'function getMinimumGasPrice() external view returns (uint256)',
];

// NodeInterface precompile ABI (for L1 gas estimation)
const NODE_INTERFACE_ABI = [
	'function gasEstimateL1Component(address to, bool contractCreation, bytes calldata data) external payable returns (uint64 gasEstimateForL1, uint256 baseFee, uint256 l1BaseFeeEstimate)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	let result: Record<string, unknown>;

	switch (operation) {
		case 'convertUnits': {
			const value = this.getNodeParameter('value', index) as string;
			const fromUnit = this.getNodeParameter('fromUnit', index) as string;
			const toUnit = this.getNodeParameter('toUnit', index) as string;
			result = convertUnits(value, fromUnit, toUnit);
			break;
		}

		case 'encodeAbi': {
			const abi = this.getNodeParameter('abi', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsStr = this.getNodeParameter('functionArgs', index) as string;
			result = encodeAbi(abi, functionName, functionArgsStr);
			break;
		}

		case 'decodeAbi': {
			const abi = this.getNodeParameter('abi', index) as string;
			const dataToDecode = this.getNodeParameter('dataToDecode', index) as string;
			const decodeType = this.getNodeParameter('decodeType', index) as string;
			const decodeElementName = decodeType !== 'functionData'
				? this.getNodeParameter('decodeElementName', index) as string
				: '';
			const eventTopicsStr = decodeType === 'eventLog'
				? this.getNodeParameter('eventTopics', index) as string
				: '[]';
			result = decodeAbi(abi, dataToDecode, decodeType, decodeElementName, eventTopicsStr);
			break;
		}

		case 'keccak256': {
			const hashData = this.getNodeParameter('hashData', index) as string;
			const hashInputType = this.getNodeParameter('hashInputType', index) as string;
			result = keccak256Hash(hashData, hashInputType);
			break;
		}

		case 'signMessage': {
			const message = this.getNodeParameter('message', index) as string;
			const messageType = this.getNodeParameter('messageType', index) as string;
			const typedData = messageType === 'typed'
				? this.getNodeParameter('typedData', index) as string
				: '';
			result = await signMessage.call(this, message, messageType, typedData);
			break;
		}

		case 'verifySignature': {
			const verifyMessage = this.getNodeParameter('verifyMessage', index) as string;
			const signature = this.getNodeParameter('signature', index) as string;
			const expectedSigner = this.getNodeParameter('expectedSigner', index) as string;
			result = verifySignature(verifyMessage, signature, expectedSigner);
			break;
		}

		case 'getChainId': {
			result = await getChainId.call(this);
			break;
		}

		case 'getNetworkStatus': {
			result = await getNetworkStatus.call(this);
			break;
		}

		case 'estimateL1DataFee': {
			const txData = this.getNodeParameter('txData', index) as string;
			result = await estimateL1DataFee.call(this, txData);
			break;
		}

		case 'calculateTotalGas': {
			const toAddress = this.getNodeParameter('toAddress', index) as string;
			const calcTxData = this.getNodeParameter('calcTxData', index) as string;
			const calcValue = this.getNodeParameter('calcValue', index) as string;
			
			if (!validateAddress(toAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid destination address');
			}
			
			result = await calculateTotalGas.call(this, toAddress, calcTxData, calcValue);
			break;
		}

		case 'formatAddress': {
			const addressToFormat = this.getNodeParameter('addressToFormat', index) as string;
			result = formatAddress(addressToFormat);
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result as IDataObject }];
}

function convertUnits(value: string, fromUnit: string, toUnit: string): Record<string, unknown> {
	const fromDecimals = UNIT_DECIMALS[fromUnit];
	const toDecimals = UNIT_DECIMALS[toUnit];

	if (fromDecimals === undefined || toDecimals === undefined) {
		throw new Error(`Invalid unit: ${fromUnit} or ${toUnit}`);
	}

	// Convert to wei first
	let weiValue: bigint;
	if (fromDecimals === 0) {
		weiValue = BigInt(value);
	} else {
		weiValue = ethers.parseUnits(value, fromDecimals);
	}

	// Convert from wei to target unit
	let result: string;
	if (toDecimals === 0) {
		result = weiValue.toString();
	} else {
		result = ethers.formatUnits(weiValue, toDecimals);
	}

	// Get all conversions
	const allConversions: Record<string, string> = {};
	for (const [unit, decimals] of Object.entries(UNIT_DECIMALS)) {
		if (decimals === 0) {
			allConversions[unit] = weiValue.toString();
		} else {
			allConversions[unit] = ethers.formatUnits(weiValue, decimals);
		}
	}

	return {
		input: {
			value,
			unit: fromUnit,
		},
		output: {
			value: result,
			unit: toUnit,
		},
		weiValue: weiValue.toString(),
		allConversions,
	};
}

function encodeAbi(
	abiStr: string,
	functionName: string,
	functionArgsStr: string,
): Record<string, unknown> {
	let abi: ethers.InterfaceAbi;
	let functionArgs: unknown[];

	try {
		abi = JSON.parse(abiStr);
	} catch (error) {
		throw new Error('Invalid ABI JSON');
	}

	try {
		functionArgs = JSON.parse(functionArgsStr);
	} catch (error) {
		throw new Error('Invalid function arguments JSON');
	}

	const iface = new ethers.Interface(abi);
	const encodedData = iface.encodeFunctionData(functionName, functionArgs);
	const functionFragment = iface.getFunction(functionName);

	return {
		functionName,
		functionArgs,
		encodedData,
		selector: encodedData.slice(0, 10),
		encodedArgs: '0x' + encodedData.slice(10),
		signature: functionFragment?.format() || functionName,
	};
}

function decodeAbi(
	abiStr: string,
	dataToDecode: string,
	decodeType: string,
	decodeElementName: string,
	eventTopicsStr: string,
): Record<string, unknown> {
	let abi: ethers.InterfaceAbi;
	
	try {
		abi = JSON.parse(abiStr);
	} catch (error) {
		throw new Error('Invalid ABI JSON');
	}

	const iface = new ethers.Interface(abi);

	if (decodeType === 'functionData') {
		const decoded = iface.parseTransaction({ data: dataToDecode });
		if (!decoded) {
			throw new Error('Could not decode function data');
		}

		const args: Record<string, unknown> = {};
		decoded.fragment.inputs.forEach((input, i) => {
			const value = decoded.args[i];
			args[input.name || `arg${i}`] = typeof value === 'bigint' ? value.toString() : value;
		});

		return {
			functionName: decoded.name,
			selector: decoded.selector,
			signature: decoded.signature,
			arguments: args,
			rawArgs: decoded.args.map(a => typeof a === 'bigint' ? a.toString() : a),
		};
	} else if (decodeType === 'returnValue') {
		const decoded = iface.decodeFunctionResult(decodeElementName, dataToDecode);
		const functionFragment = iface.getFunction(decodeElementName);

		const results: Record<string, unknown> = {};
		if (functionFragment?.outputs) {
			functionFragment.outputs.forEach((output, i) => {
				const value = decoded[i];
				results[output.name || `result${i}`] = typeof value === 'bigint' ? value.toString() : value;
			});
		}

		return {
			functionName: decodeElementName,
			decodedResults: results,
			rawResults: Array.from(decoded).map(v => typeof v === 'bigint' ? v.toString() : v),
		};
	} else if (decodeType === 'eventLog') {
		let topics: string[];
		try {
			topics = JSON.parse(eventTopicsStr);
		} catch (error) {
			throw new Error('Invalid event topics JSON');
		}

		const decoded = iface.parseLog({ data: dataToDecode, topics });
		if (!decoded) {
			throw new Error('Could not decode event log');
		}

		const args: Record<string, unknown> = {};
		decoded.fragment.inputs.forEach((input, i) => {
			const value = decoded.args[i];
			args[input.name || `arg${i}`] = typeof value === 'bigint' ? value.toString() : value;
		});

		return {
			eventName: decoded.name,
			signature: decoded.signature,
			topic: decoded.topic,
			arguments: args,
			rawArgs: decoded.args.map(a => typeof a === 'bigint' ? a.toString() : a),
		};
	}

	throw new Error(`Unknown decode type: ${decodeType}`);
}

function keccak256Hash(data: string, inputType: string): Record<string, unknown> {
	let bytesData: Uint8Array;

	if (inputType === 'hex') {
		bytesData = ethers.getBytes(data.startsWith('0x') ? data : '0x' + data);
	} else {
		bytesData = ethers.toUtf8Bytes(data);
	}

	const hash = ethers.keccak256(bytesData);

	return {
		input: data,
		inputType,
		hash,
		// Common derived values
		selector: hash.slice(0, 10), // First 4 bytes (function selector)
		topic: hash, // Full hash (event topic)
	};
}

async function signMessage(
	this: IExecuteFunctions,
	message: string,
	messageType: string,
	typedDataStr: string,
): Promise<Record<string, unknown>> {
	const credentials = await this.getCredentials('arbitrumRpc');
	const privateKey = credentials.privateKey as string;

	if (!privateKey) {
		throw new NodeOperationError(this.getNode(), 'Private key required for signing');
	}

	const wallet = new ethers.Wallet(privateKey);
	const signerAddress = await wallet.getAddress();

	let signature: string;
	let messageHash: string;

	if (messageType === 'personal') {
		// EIP-191 personal sign
		signature = await wallet.signMessage(message);
		messageHash = ethers.hashMessage(message);
	} else if (messageType === 'hash') {
		// Sign raw hash
		const messageBytes = ethers.getBytes(message);
		signature = wallet.signingKey.sign(messageBytes).serialized;
		messageHash = message;
	} else if (messageType === 'typed') {
		// EIP-712 typed data
		let typedData: {
			domain: ethers.TypedDataDomain;
			types: Record<string, ethers.TypedDataField[]>;
			value: Record<string, unknown>;
		};
		
		try {
			typedData = JSON.parse(typedDataStr);
		} catch (error) {
			throw new NodeOperationError(this.getNode(), 'Invalid typed data JSON');
		}

		signature = await wallet.signTypedData(
			typedData.domain,
			typedData.types,
			typedData.value
		);
		messageHash = ethers.TypedDataEncoder.hash(
			typedData.domain,
			typedData.types,
			typedData.value
		);
	} else {
		throw new NodeOperationError(this.getNode(), `Unknown message type: ${messageType}`);
	}

	// Parse signature components
	const sig = ethers.Signature.from(signature);

	return {
		signer: signerAddress,
		message: messageType === 'typed' ? '(typed data)' : message,
		messageType,
		messageHash,
		signature,
		components: {
			r: sig.r,
			s: sig.s,
			v: sig.v,
			yParity: sig.yParity,
		},
	};
}

function verifySignature(
	message: string,
	signature: string,
	expectedSigner: string,
): Record<string, unknown> {
	// Recover signer address
	const recoveredAddress = ethers.verifyMessage(message, signature);
	const messageHash = ethers.hashMessage(message);

	// Parse signature
	const sig = ethers.Signature.from(signature);

	const result: Record<string, unknown> = {
		message,
		messageHash,
		signature,
		recoveredAddress,
		components: {
			r: sig.r,
			s: sig.s,
			v: sig.v,
		},
	};

	if (expectedSigner) {
		const isValid = recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
		result.expectedSigner = expectedSigner;
		result.isValid = isValid;
		result.status = isValid ? 'Valid - Signer matches' : 'Invalid - Signer does not match';
	} else {
		result.status = 'Signer recovered - provide expected address to verify';
	}

	return result;
}

async function getChainId(
	this: IExecuteFunctions,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	const chainId = (await provider.getNetwork()).chainId;

	return {
		chainId: Number(chainId),
		chainIdHex: '0x' + chainId.toString(16),
		network: networkConfig.name,
		expectedChainId: networkConfig.chainId,
		matches: Number(chainId) === networkConfig.chainId,
	};
}

async function getNetworkStatus(
	this: IExecuteFunctions,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Get basic network info
	const [blockNumber, feeData, network_] = await Promise.all([
		provider.getBlockNumber(),
		provider.getFeeData(),
		provider.getNetwork(),
	]);

	// Get latest block
	const block = await provider.getBlock(blockNumber);

	// Get gas info from precompile
	const arbGasInfo = new ethers.Contract(
		'0x000000000000000000000000000000000000006C',
		ARB_GAS_INFO_ABI,
		provider
	);

	let l1BaseFee = BigInt(0);
	let minimumGasPrice = BigInt(0);
	let gasBacklog = BigInt(0);

	try {
		[l1BaseFee, minimumGasPrice, gasBacklog] = await Promise.all([
			arbGasInfo.getL1BaseFeeEstimate(),
			arbGasInfo.getMinimumGasPrice(),
			arbGasInfo.getGasBacklog(),
		]);
	} catch (error) {
		// Precompile calls failed
	}

	return {
		network: networkConfig.name,
		chainId: Number(network_.chainId),
		currentBlock: {
			number: blockNumber,
			timestamp: block?.timestamp,
			timestampDate: block ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
			gasLimit: block?.gasLimit.toString(),
			gasUsed: block?.gasUsed.toString(),
			baseFeePerGas: block?.baseFeePerGas?.toString(),
		},
		feeData: {
			gasPrice: feeData.gasPrice?.toString(),
			gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
			maxFeePerGas: feeData.maxFeePerGas?.toString(),
			maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
		},
		arbitrumSpecific: {
			l1BaseFeeEstimate: l1BaseFee.toString(),
			l1BaseFeeGwei: ethers.formatUnits(l1BaseFee, 'gwei'),
			minimumGasPrice: minimumGasPrice.toString(),
			gasBacklog: gasBacklog.toString(),
		},
		rpcUrl: networkConfig.rpcUrls.default,
		explorerUrl: networkConfig.explorerUrl,
		isTestnet: network === 'sepolia' || network === 'goerli',
	};
}

async function estimateL1DataFee(
	this: IExecuteFunctions,
	txData: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Ensure data is hex
	const data = txData.startsWith('0x') ? txData : '0x' + txData;
	const dataBytes = (data.length - 2) / 2;

	// Get L1 base fee from ArbGasInfo
	const arbGasInfo = new ethers.Contract(
		'0x000000000000000000000000000000000000006C',
		ARB_GAS_INFO_ABI,
		provider
	);

	let l1BaseFee: bigint;
	try {
		l1BaseFee = await arbGasInfo.getL1BaseFeeEstimate();
	} catch (error) {
		l1BaseFee = BigInt(30000000000); // 30 gwei fallback
	}

	// Calculate L1 data gas
	// Non-zero bytes cost 16 gas, zero bytes cost 4 gas
	let zeroBytes = 0;
	let nonZeroBytes = 0;
	for (let i = 2; i < data.length; i += 2) {
		if (data.slice(i, i + 2) === '00') {
			zeroBytes++;
		} else {
			nonZeroBytes++;
		}
	}

	const l1DataGas = BigInt(zeroBytes * 4 + nonZeroBytes * 16);
	const l1DataFee = l1DataGas * l1BaseFee;

	return {
		network: networkConfig.name,
		inputData: {
			dataHex: data.length > 100 ? data.slice(0, 100) + '...' : data,
			totalBytes: dataBytes,
			zeroBytes,
			nonZeroBytes,
		},
		l1BaseFee: {
			wei: l1BaseFee.toString(),
			gwei: ethers.formatUnits(l1BaseFee, 'gwei'),
		},
		l1DataGas: l1DataGas.toString(),
		l1DataFee: {
			wei: l1DataFee.toString(),
			eth: ethers.formatEther(l1DataFee),
		},
		note: 'L1 data fee is paid on top of L2 execution gas',
	};
}

async function calculateTotalGas(
	this: IExecuteFunctions,
	toAddress: string,
	txData: string,
	value: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	const data = txData.startsWith('0x') ? txData : '0x' + txData;
	const valueWei = ethers.parseEther(value);

	// Estimate L2 execution gas
	let l2Gas: bigint;
	try {
		l2Gas = await provider.estimateGas({
			to: toAddress,
			data,
			value: valueWei,
		});
	} catch (error) {
		l2Gas = BigInt(21000); // Minimum gas
	}

	// Get L1 gas component from NodeInterface
	const nodeInterface = new ethers.Contract(
		'0x00000000000000000000000000000000000000C8',
		NODE_INTERFACE_ABI,
		provider
	);

	let l1GasEstimate = BigInt(0);
	let l1BaseFee = BigInt(0);

	try {
		const result = await nodeInterface.gasEstimateL1Component.staticCall(
			toAddress,
			false, // not contract creation
			data,
			{ value: valueWei }
		);
		l1GasEstimate = result.gasEstimateForL1;
		l1BaseFee = result.l1BaseFeeEstimate;
	} catch (error) {
		// Fallback calculation
		const dataBytes = (data.length - 2) / 2;
		l1GasEstimate = BigInt(dataBytes * 16);
		l1BaseFee = BigInt(30000000000);
	}

	// Get current gas price
	const feeData = await provider.getFeeData();
	const gasPrice = feeData.gasPrice || BigInt(100000000);

	// Calculate costs
	const l2Cost = l2Gas * gasPrice;
	const l1Cost = l1GasEstimate * l1BaseFee;
	const totalCost = l2Cost + l1Cost;

	return {
		network: networkConfig.name,
		transaction: {
			to: toAddress,
			value: value + ' ETH',
			dataLength: (data.length - 2) / 2 + ' bytes',
		},
		l2Execution: {
			gasUnits: l2Gas.toString(),
			gasPrice: gasPrice.toString(),
			gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
			cost: l2Cost.toString(),
			costEth: ethers.formatEther(l2Cost),
		},
		l1Data: {
			gasUnits: l1GasEstimate.toString(),
			l1BaseFee: l1BaseFee.toString(),
			l1BaseFeeGwei: ethers.formatUnits(l1BaseFee, 'gwei'),
			cost: l1Cost.toString(),
			costEth: ethers.formatEther(l1Cost),
		},
		total: {
			gasUnits: (l2Gas + l1GasEstimate).toString(),
			totalCost: totalCost.toString(),
			totalCostEth: ethers.formatEther(totalCost),
		},
		breakdown: {
			l2Percentage: ((Number(l2Cost) / Number(totalCost)) * 100).toFixed(2) + '%',
			l1Percentage: ((Number(l1Cost) / Number(totalCost)) * 100).toFixed(2) + '%',
		},
	};
}

function formatAddress(address: string): Record<string, unknown> {
	const isValid = ethers.isAddress(address);

	if (!isValid) {
		return {
			input: address,
			isValid: false,
			error: 'Invalid Ethereum address format',
		};
	}

	const checksumAddress = ethers.getAddress(address);
	const lowercaseAddress = address.toLowerCase();
	const hasCorrectChecksum = address === checksumAddress;

	return {
		input: address,
		isValid: true,
		checksumAddress,
		lowercaseAddress,
		hasCorrectChecksum,
		isZeroAddress: checksumAddress === ethers.ZeroAddress,
		bytes: ethers.getBytes(checksumAddress).length,
	};
}

export const utility = { operations, fields, execute };
