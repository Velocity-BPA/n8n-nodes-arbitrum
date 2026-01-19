/**
 * Transaction Resource Actions
 * Operations for Arbitrum transaction interactions
 */

import type {
	IDataObject,
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
	formatTransactionReceipt,
	estimateArbitrumGas,
	waitForTransaction,
} from '../../transport/provider';
import {
	getL1ToL2MessageStatus,
	getL2ToL1MessageStatus,
	formatL1ToL2Status,
	formatL2ToL1Status,
} from '../../transport/arbitrumSdk';
import type { ArbitrumNetworkId } from '../../constants/networks';

export const transactionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{
				name: 'Send ETH',
				value: 'sendEth',
				description: 'Send native ETH to an address',
				action: 'Send ETH',
			},
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by hash',
				action: 'Get transaction',
			},
			{
				name: 'Get Transaction Receipt',
				value: 'getReceipt',
				description: 'Get transaction receipt by hash',
				action: 'Get transaction receipt',
			},
			{
				name: 'Get Transaction Status',
				value: 'getStatus',
				description: 'Check if a transaction succeeded or failed',
				action: 'Get transaction status',
			},
			{
				name: 'Estimate Gas',
				value: 'estimateGas',
				description: 'Estimate gas for a transaction (includes L1 data fee)',
				action: 'Estimate gas',
			},
			{
				name: 'Get Gas Price',
				value: 'getGasPrice',
				description: 'Get current gas price',
				action: 'Get gas price',
			},
			{
				name: 'Get Base Fee',
				value: 'getBaseFee',
				description: 'Get current base fee from latest block',
				action: 'Get base fee',
			},
			{
				name: 'Get Max Priority Fee',
				value: 'getMaxPriorityFee',
				description: 'Get suggested max priority fee',
				action: 'Get max priority fee',
			},
			{
				name: 'Speed Up Transaction',
				value: 'speedUp',
				description: 'Replace a pending transaction with higher gas',
				action: 'Speed up transaction',
			},
			{
				name: 'Cancel Transaction',
				value: 'cancel',
				description: 'Cancel a pending transaction',
				action: 'Cancel transaction',
			},
			{
				name: 'Wait for Confirmation',
				value: 'waitForConfirmation',
				description: 'Wait for a transaction to be confirmed',
				action: 'Wait for confirmation',
			},
			{
				name: 'Decode Transaction Input',
				value: 'decodeInput',
				description: 'Decode transaction input data using ABI',
				action: 'Decode transaction input',
			},
			{
				name: 'Get L1 to L2 Message Status',
				value: 'getL1ToL2Status',
				description: 'Get status of a deposit from Ethereum to Arbitrum',
				action: 'Get L1 to L2 message status',
			},
			{
				name: 'Get L2 to L1 Message Status',
				value: 'getL2ToL1Status',
				description: 'Get status of a withdrawal from Arbitrum to Ethereum',
				action: 'Get L2 to L1 message status',
			},
		],
		default: 'getTransaction',
	},
];

export const transactionFields: INodeProperties[] = [
	// Transaction hash - for read operations
	{
		displayName: 'Transaction Hash',
		name: 'txHash',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The transaction hash',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: [
					'getTransaction',
					'getReceipt',
					'getStatus',
					'speedUp',
					'cancel',
					'waitForConfirmation',
					'decodeInput',
					'getL1ToL2Status',
					'getL2ToL1Status',
				],
			},
		},
	},
	// Send ETH fields
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
				resource: ['transaction'],
				operation: ['sendEth', 'estimateGas'],
			},
		},
	},
	{
		displayName: 'Amount (ETH)',
		name: 'amount',
		type: 'string',
		required: true,
		default: '0',
		placeholder: '0.1',
		description: 'Amount of ETH to send',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth', 'estimateGas'],
			},
		},
	},
	// Gas settings for send operations
	{
		displayName: 'Gas Settings',
		name: 'gasSettings',
		type: 'options',
		default: 'auto',
		description: 'How to set gas price',
		options: [
			{ name: 'Automatic', value: 'auto' },
			{ name: 'Custom', value: 'custom' },
		],
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth'],
			},
		},
	},
	{
		displayName: 'Max Fee Per Gas (Gwei)',
		name: 'maxFeePerGas',
		type: 'string',
		default: '',
		placeholder: '0.5',
		description: 'Maximum fee per gas in Gwei',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth'],
				gasSettings: ['custom'],
			},
		},
	},
	{
		displayName: 'Max Priority Fee Per Gas (Gwei)',
		name: 'maxPriorityFeePerGas',
		type: 'string',
		default: '',
		placeholder: '0.01',
		description: 'Maximum priority fee per gas in Gwei',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth'],
				gasSettings: ['custom'],
			},
		},
	},
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'number',
		default: 21000,
		description: 'Gas limit for the transaction',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth'],
				gasSettings: ['custom'],
			},
		},
	},
	// Nonce override
	{
		displayName: 'Custom Nonce',
		name: 'useCustomNonce',
		type: 'boolean',
		default: false,
		description: 'Whether to use a custom nonce',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth', 'speedUp', 'cancel'],
			},
		},
	},
	{
		displayName: 'Nonce',
		name: 'nonce',
		type: 'number',
		default: 0,
		description: 'The transaction nonce',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['sendEth', 'speedUp', 'cancel'],
				useCustomNonce: [true],
			},
		},
	},
	// Wait for confirmation options
	{
		displayName: 'Confirmations',
		name: 'confirmations',
		type: 'number',
		default: 1,
		description: 'Number of confirmations to wait for',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForConfirmation', 'sendEth'],
			},
		},
	},
	{
		displayName: 'Timeout (Seconds)',
		name: 'timeout',
		type: 'number',
		default: 120,
		description: 'Timeout in seconds',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['waitForConfirmation', 'sendEth'],
			},
		},
	},
	// Speed up options
	{
		displayName: 'Gas Multiplier',
		name: 'gasMultiplier',
		type: 'number',
		default: 1.5,
		description: 'Multiplier for gas price (e.g., 1.5 = 50% higher)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['speedUp'],
			},
		},
	},
	// ABI for decoding
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'json',
		default: '[]',
		description: 'Contract ABI for decoding (JSON array)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['decodeInput'],
			},
		},
	},
	// Data field for estimate gas
	{
		displayName: 'Include Data',
		name: 'includeData',
		type: 'boolean',
		default: false,
		description: 'Whether to include custom data in the transaction',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['estimateGas'],
			},
		},
	},
	{
		displayName: 'Data (Hex)',
		name: 'data',
		type: 'string',
		default: '0x',
		placeholder: '0x...',
		description: 'Transaction data in hex format',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['estimateGas'],
				includeData: [true],
			},
		},
	},
	// L1 RPC for cross-chain status
	{
		displayName: 'L1 RPC URL',
		name: 'l1RpcUrl',
		type: 'string',
		default: '',
		placeholder: 'https://eth-mainnet.g.alchemy.com/v2/...',
		description: 'Ethereum L1 RPC URL (uses credential L1 RPC if empty)',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getL1ToL2Status', 'getL2ToL1Status'],
			},
		},
	},
];

/**
 * Execute transaction operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');

	let result: INodeExecutionData[] = [];

	try {
		switch (operation) {
			case 'sendEth':
				result = await sendEth.call(this, index, credentials);
				break;
			case 'getTransaction':
				result = await getTransaction.call(this, index, credentials);
				break;
			case 'getReceipt':
				result = await getReceipt.call(this, index, credentials);
				break;
			case 'getStatus':
				result = await getStatus.call(this, index, credentials);
				break;
			case 'estimateGas':
				result = await estimateGas.call(this, index, credentials);
				break;
			case 'getGasPrice':
				result = await getGasPrice.call(this, index, credentials);
				break;
			case 'getBaseFee':
				result = await getBaseFee.call(this, index, credentials);
				break;
			case 'getMaxPriorityFee':
				result = await getMaxPriorityFee.call(this, index, credentials);
				break;
			case 'speedUp':
				result = await speedUpTransaction.call(this, index, credentials);
				break;
			case 'cancel':
				result = await cancelTransaction.call(this, index, credentials);
				break;
			case 'waitForConfirmation':
				result = await waitForConfirmationOp.call(this, index, credentials);
				break;
			case 'decodeInput':
				result = await decodeInput.call(this, index, credentials);
				break;
			case 'getL1ToL2Status':
				result = await getL1ToL2StatusOp.call(this, index, credentials);
				break;
			case 'getL2ToL1Status':
				result = await getL2ToL1StatusOp.call(this, index, credentials);
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
			`Transaction operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}

	return result;
}

// Operation implementations

async function sendEth(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const toAddress = this.getNodeParameter('toAddress', index) as string;
	const amount = this.getNodeParameter('amount', index) as string;
	const gasSettings = this.getNodeParameter('gasSettings', index) as string;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;
	const timeout = this.getNodeParameter('timeout', index, 120) as number;

	if (!validateAddress(toAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`, {
			itemIndex: index,
		});
	}

	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to send transactions',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const tx: ethers.TransactionRequest = {
		to: toAddress,
		value: ethers.parseEther(amount),
	};

	// Set gas parameters
	if (gasSettings === 'custom') {
		const maxFeePerGas = this.getNodeParameter('maxFeePerGas', index) as string;
		const maxPriorityFeePerGas = this.getNodeParameter('maxPriorityFeePerGas', index) as string;
		const gasLimit = this.getNodeParameter('gasLimit', index) as number;

		if (maxFeePerGas) tx.maxFeePerGas = ethers.parseUnits(maxFeePerGas, 'gwei');
		if (maxPriorityFeePerGas) tx.maxPriorityFeePerGas = ethers.parseUnits(maxPriorityFeePerGas, 'gwei');
		if (gasLimit) tx.gasLimit = BigInt(gasLimit);
	}

	// Custom nonce
	const useCustomNonce = this.getNodeParameter('useCustomNonce', index, false) as boolean;
	if (useCustomNonce) {
		tx.nonce = this.getNodeParameter('nonce', index) as number;
	}

	// Send transaction
	const txResponse = await signer.sendTransaction(tx);

	// Wait for confirmation if requested
	let receipt = null;
	if (confirmations > 0) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations, timeout * 1000);
	}

	return [
		{
			json: {
				success: true,
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt ? formatTransactionReceipt(receipt) : null,
				network: credentials.network,
			},
		},
	];
}

async function getTransaction(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;

	const { provider } = await createProvider(credentials);
	const tx = await provider.getTransaction(txHash);

	if (!tx) {
		throw new NodeOperationError(this.getNode(), `Transaction not found: ${txHash}`, {
			itemIndex: index,
		});
	}

	return [
		{
			json: {
				...formatTransactionResponse(tx),
				network: credentials.network,
			},
		},
	];
}

async function getReceipt(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;

	const { provider } = await createProvider(credentials);
	const receipt = await provider.getTransactionReceipt(txHash);

	if (!receipt) {
		throw new NodeOperationError(
			this.getNode(),
			`Transaction receipt not found: ${txHash}. Transaction may be pending.`,
			{ itemIndex: index },
		);
	}

	return [
		{
			json: {
				...formatTransactionReceipt(receipt),
				network: credentials.network,
			},
		},
	];
}

async function getStatus(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;

	const { provider } = await createProvider(credentials);
	const receipt = await provider.getTransactionReceipt(txHash);

	if (!receipt) {
		return [
			{
				json: {
					txHash,
					status: 'pending',
					message: 'Transaction is pending or not found',
					network: credentials.network,
				},
			},
		];
	}

	const status = receipt.status === 1 ? 'success' : 'failed';

	return [
		{
			json: {
				txHash,
				status,
				success: receipt.status === 1,
				blockNumber: receipt.blockNumber,
				gasUsed: receipt.gasUsed.toString(),
				effectiveGasPrice: receipt.gasPrice?.toString(),
				network: credentials.network,
			},
		},
	];
}

async function estimateGas(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const toAddress = this.getNodeParameter('toAddress', index) as string;
	const amount = this.getNodeParameter('amount', index) as string;
	const includeData = this.getNodeParameter('includeData', index, false) as boolean;
	const data = includeData ? (this.getNodeParameter('data', index) as string) : '0x';

	if (!validateAddress(toAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);

	// Get Arbitrum-specific gas estimation (includes L1 data fee)
	const gasEstimate = await estimateArbitrumGas(provider, {
		to: toAddress,
		value: ethers.parseEther(amount),
		data,
	});

	return [
		{
			json: {
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
			} as IDataObject,
		},
	];
}

async function getGasPrice(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const { provider } = await createProvider(credentials);
	const feeData = await provider.getFeeData();

	return [
		{
			json: {
				gasPrice: feeData.gasPrice?.toString(),
				gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
				maxFeePerGas: feeData.maxFeePerGas?.toString(),
				maxFeePerGasGwei: feeData.maxFeePerGas
					? ethers.formatUnits(feeData.maxFeePerGas, 'gwei')
					: null,
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
					? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
					: null,
				network: credentials.network,
			},
		},
	];
}

async function getBaseFee(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const { provider } = await createProvider(credentials);
	const block = await provider.getBlock('latest');

	if (!block || !block.baseFeePerGas) {
		throw new NodeOperationError(this.getNode(), 'Failed to get base fee', {
			itemIndex: index,
		});
	}

	return [
		{
			json: {
				baseFeePerGas: block.baseFeePerGas.toString(),
				baseFeePerGasGwei: ethers.formatUnits(block.baseFeePerGas, 'gwei'),
				blockNumber: block.number,
				network: credentials.network,
			},
		},
	];
}

async function getMaxPriorityFee(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const { provider } = await createProvider(credentials);
	const feeData = await provider.getFeeData();

	return [
		{
			json: {
				maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
				maxPriorityFeePerGasGwei: feeData.maxPriorityFeePerGas
					? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
					: null,
				network: credentials.network,
			},
		},
	];
}

async function speedUpTransaction(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;
	const gasMultiplier = this.getNodeParameter('gasMultiplier', index, 1.5) as number;

	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to speed up transactions',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	// Get original transaction
	const originalTx = await provider.getTransaction(txHash);
	if (!originalTx) {
		throw new NodeOperationError(this.getNode(), `Transaction not found: ${txHash}`, {
			itemIndex: index,
		});
	}

	// Create replacement transaction with higher gas
	const feeData = await provider.getFeeData();
	const newMaxFeePerGas = BigInt(
		Math.ceil(Number(originalTx.maxFeePerGas || feeData.maxFeePerGas || 0n) * gasMultiplier),
	);
	const newMaxPriorityFeePerGas = BigInt(
		Math.ceil(
			Number(originalTx.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas || 0n) *
				gasMultiplier,
		),
	);

	const replacementTx: ethers.TransactionRequest = {
		to: originalTx.to,
		value: originalTx.value,
		data: originalTx.data,
		nonce: originalTx.nonce,
		gasLimit: originalTx.gasLimit,
		maxFeePerGas: newMaxFeePerGas,
		maxPriorityFeePerGas: newMaxPriorityFeePerGas,
	};

	const txResponse = await signer.sendTransaction(replacementTx);

	return [
		{
			json: {
				success: true,
				originalTxHash: txHash,
				newTxHash: txResponse.hash,
				transaction: formatTransactionResponse(txResponse),
				gasMultiplier,
				network: credentials.network,
			},
		},
	];
}

async function cancelTransaction(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;

	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to cancel transactions',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	// Get original transaction to get nonce
	const originalTx = await provider.getTransaction(txHash);
	if (!originalTx) {
		throw new NodeOperationError(this.getNode(), `Transaction not found: ${txHash}`, {
			itemIndex: index,
		});
	}

	// Create 0-value transaction to self with same nonce but higher gas
	const signerAddress = await signer.getAddress();
	const feeData = await provider.getFeeData();
	
	const cancelTx: ethers.TransactionRequest = {
		to: signerAddress,
		value: 0n,
		nonce: originalTx.nonce,
		maxFeePerGas: BigInt(
			Math.ceil(Number(originalTx.maxFeePerGas || feeData.maxFeePerGas || 0n) * 1.5),
		),
		maxPriorityFeePerGas: BigInt(
			Math.ceil(
				Number(originalTx.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas || 0n) * 1.5,
			),
		),
	};

	const txResponse = await signer.sendTransaction(cancelTx);

	return [
		{
			json: {
				success: true,
				originalTxHash: txHash,
				cancelTxHash: txResponse.hash,
				transaction: formatTransactionResponse(txResponse),
				network: credentials.network,
			},
		},
	];
}

async function waitForConfirmationOp(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;
	const timeout = this.getNodeParameter('timeout', index, 120) as number;

	const { provider } = await createProvider(credentials);

	const receipt = await waitForTransaction(provider, txHash, confirmations, timeout * 1000);

	if (!receipt) {
		throw new NodeOperationError(
			this.getNode(),
			`Transaction confirmation timed out after ${timeout} seconds`,
			{ itemIndex: index },
		);
	}

	return [
		{
			json: {
				confirmed: true,
				...formatTransactionReceipt(receipt),
				network: credentials.network,
			},
		},
	];
}

async function decodeInput(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;
	const abi = this.getNodeParameter('abi', index) as string;

	const { provider } = await createProvider(credentials);
	const tx = await provider.getTransaction(txHash);

	if (!tx) {
		throw new NodeOperationError(this.getNode(), `Transaction not found: ${txHash}`, {
			itemIndex: index,
		});
	}

	if (!tx.data || tx.data === '0x') {
		return [
			{
				json: {
					txHash,
					decoded: null,
					message: 'Transaction has no input data',
					network: credentials.network,
				},
			},
		];
	}

	try {
		const abiArray = typeof abi === 'string' ? JSON.parse(abi) : abi;
		const iface = new ethers.Interface(abiArray);
		const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });

		if (!decoded) {
			return [
				{
					json: {
						txHash,
						decoded: null,
						message: 'Could not decode transaction with provided ABI',
						network: credentials.network,
					},
				},
			];
		}

		return [
			{
				json: {
					txHash,
					decoded: {
						name: decoded.name,
						signature: decoded.signature,
						selector: decoded.selector,
						args: decoded.args.map((arg) =>
							typeof arg === 'bigint' ? arg.toString() : arg,
						),
					},
					network: credentials.network,
				},
			},
		];
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to decode transaction: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}
}

async function getL1ToL2StatusOp(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;
	const l1RpcUrl = this.getNodeParameter('l1RpcUrl', index, '') as string;

	const l1Provider = new ethers.JsonRpcProvider(l1RpcUrl || credentials.l1RpcUrl);
	const { provider: l2Provider } = await createProvider(credentials);

	const statusResults = await getL1ToL2MessageStatus(txHash, l1Provider, l2Provider);
	const firstResult = statusResults[0];

	return [
		{
			json: {
				txHash,
				status: firstResult?.statusName || 'UNKNOWN',
				tickets: statusResults,
				network: credentials.network,
			} as IDataObject,
		},
	];
}

async function getL2ToL1StatusOp(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const txHash = this.getNodeParameter('txHash', index) as string;
	const l1RpcUrl = this.getNodeParameter('l1RpcUrl', index, '') as string;

	const l1Provider = new ethers.JsonRpcProvider(l1RpcUrl || credentials.l1RpcUrl);
	const { provider: l2Provider } = await createProvider(credentials);

	const statusResults = await getL2ToL1MessageStatus(txHash, l2Provider, l1Provider);
	const firstResult = statusResults[0];

	return [
		{
			json: {
				txHash,
				status: firstResult?.statusName || 'UNKNOWN',
				withdrawals: statusResults,
				network: credentials.network,
			} as IDataObject,
		},
	];
}

export const transaction = {
	operations: transactionOperations,
	fields: transactionFields,
	execute,
};
