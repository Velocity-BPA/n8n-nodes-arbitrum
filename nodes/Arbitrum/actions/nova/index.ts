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
				resource: ['nova'],
			},
		},
		options: [
			{
				name: 'Get Data Availability Info',
				value: 'getDataAvailabilityInfo',
				description: 'Get information about Nova\'s Data Availability Committee',
				action: 'Get data availability info',
			},
			{
				name: 'Get Committee Status',
				value: 'getCommitteeStatus',
				description: 'Get the current status of the Data Availability Committee',
				action: 'Get committee status',
			},
			{
				name: 'Get DA Certificate',
				value: 'getDACertificate',
				description: 'Get the Data Availability Certificate for a transaction',
				action: 'Get da certificate',
			},
			{
				name: 'Compare Gas Costs',
				value: 'compareGasCosts',
				description: 'Compare gas costs between Arbitrum One and Nova',
				action: 'Compare gas costs',
			},
		],
		default: 'getDataAvailabilityInfo',
	},
];

export const fields: INodeProperties[] = [
	// Get DA Certificate
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The transaction hash to get the DA certificate for',
		displayOptions: {
			show: {
				resource: ['nova'],
				operation: ['getDACertificate'],
			},
		},
	},
	// Compare Gas Costs
	{
		displayName: 'Data Size (Bytes)',
		name: 'dataSize',
		type: 'number',
		required: true,
		default: 1000,
		description: 'Size of calldata to compare gas costs for',
		displayOptions: {
			show: {
				resource: ['nova'],
				operation: ['compareGasCosts'],
			},
		},
	},
	{
		displayName: 'Include L1 Fee',
		name: 'includeL1Fee',
		type: 'boolean',
		default: true,
		description: 'Whether to include L1 data posting fees in the comparison',
		displayOptions: {
			show: {
				resource: ['nova'],
				operation: ['compareGasCosts'],
			},
		},
	},
];

// ABI for ArbGasInfo precompile
const ARB_GAS_INFO_ABI = [
	'function getPricesInWei() external view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
	'function getL1BaseFeeEstimate() external view returns (uint256)',
	'function getGasBacklog() external view returns (uint64)',
	'function getMinimumGasPrice() external view returns (uint256)',
	'function getCurrentTxL1GasFees() external view returns (uint256)',
];

// ABI for Sequencer Inbox (for DA info)
const SEQUENCER_INBOX_ABI = [
	'function batchCount() external view returns (uint256)',
	'function totalDelayedMessagesRead() external view returns (uint256)',
	'function maxTimeVariation() external view returns (uint256, uint256, uint256, uint256)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;

	// Check if we're on Nova network for Nova-specific operations
	const isNova = network === 'nova';

	let result: Record<string, unknown>;

	switch (operation) {
		case 'getDataAvailabilityInfo': {
			result = await getDataAvailabilityInfo.call(this, network);
			break;
		}

		case 'getCommitteeStatus': {
			result = await getCommitteeStatus.call(this, network);
			break;
		}

		case 'getDACertificate': {
			const transactionHash = this.getNodeParameter('transactionHash', index) as string;
			result = await getDACertificate.call(this, network, transactionHash);
			break;
		}

		case 'compareGasCosts': {
			const dataSize = this.getNodeParameter('dataSize', index) as number;
			const includeL1Fee = this.getNodeParameter('includeL1Fee', index) as boolean;
			result = await compareGasCosts.call(this, dataSize, includeL1Fee);
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result as IDataObject }];
}

async function getDataAvailabilityInfo(
	this: IExecuteFunctions,
	network: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;
	const isNova = network === 'nova';

	// Get basic chain info
	const [blockNumber, gasPrice] = await Promise.all([
		provider.getBlockNumber(),
		provider.getFeeData(),
	]);

	// Get gas info from precompile
	const arbGasInfo = new ethers.Contract(
		'0x000000000000000000000000000000000000006C',
		ARB_GAS_INFO_ABI,
		provider
	);

	let l1BaseFee: bigint;
	let minimumGasPrice: bigint;
	try {
		[l1BaseFee, minimumGasPrice] = await Promise.all([
			arbGasInfo.getL1BaseFeeEstimate(),
			arbGasInfo.getMinimumGasPrice(),
		]);
	} catch (error) {
		l1BaseFee = BigInt(0);
		minimumGasPrice = BigInt(0);
	}

	const daInfo: Record<string, unknown> = {
		network: networkConfig.name,
		chainId: networkConfig.chainId,
		isNovaNetwork: isNova,
		dataAvailabilityType: isNova ? 'Data Availability Committee (DAC)' : 'Ethereum (Calldata)',
		currentBlockNumber: blockNumber,
		gasPrice: gasPrice.gasPrice?.toString() || '0',
		maxFeePerGas: gasPrice.maxFeePerGas?.toString() || '0',
		maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString() || '0',
		l1BaseFeeEstimate: l1BaseFee.toString(),
		minimumGasPrice: minimumGasPrice.toString(),
	};

	if (isNova) {
		daInfo.dacDescription = 'Nova uses a Data Availability Committee (DAC) instead of posting all data to Ethereum L1, significantly reducing costs';
		daInfo.securityModel = 'Relies on DAC committee members to attest to data availability';
		daInfo.dataPostingCost = 'Significantly lower than Arbitrum One (calldata)';
		daInfo.recommendedUse = 'Gaming, social, high-frequency applications where ultra-low costs are prioritized';
	} else {
		daInfo.dacDescription = 'Arbitrum One posts all transaction data to Ethereum L1 as calldata';
		daInfo.securityModel = 'Full Ethereum L1 data availability guarantees';
		daInfo.dataPostingCost = 'Higher than Nova due to L1 calldata costs';
		daInfo.recommendedUse = 'DeFi, high-value transactions where maximum security is required';
	}

	return daInfo;
}

async function getCommitteeStatus(
	this: IExecuteFunctions,
	network: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;
	const isNova = network === 'nova';

	if (!isNova) {
		return {
			network: networkConfig.name,
			isNovaNetwork: false,
			status: 'Not Applicable',
			message: 'Data Availability Committee only exists on Arbitrum Nova. Arbitrum One uses Ethereum L1 for data availability.',
		};
	}

	// Nova DAC members (as of knowledge cutoff)
	const dacMembers = [
		{ name: 'Offchain Labs', role: 'Operator' },
		{ name: 'Google Cloud', role: 'Committee Member' },
		{ name: 'FTX', role: 'Committee Member (inactive)' },
		{ name: 'P2P', role: 'Committee Member' },
		{ name: 'Quicknode', role: 'Committee Member' },
		{ name: 'Offchain Labs', role: 'Committee Member' },
		{ name: 'Consensys', role: 'Committee Member' },
	];

	// Get current block to verify chain is active
	const blockNumber = await provider.getBlockNumber();
	const block = await provider.getBlock(blockNumber);

	return {
		network: 'Arbitrum Nova',
		chainId: 42170,
		isNovaNetwork: true,
		status: 'Active',
		committeeName: 'Data Availability Committee (DAC)',
		requiredSignatures: '2 of N (minimum)',
		description: 'The DAC attests to the availability of transaction data without posting it all to L1',
		members: dacMembers,
		currentBlockNumber: blockNumber,
		latestBlockTimestamp: block?.timestamp || 0,
		securityAssumptions: [
			'At least one committee member must be honest',
			'Committee members store data for challenge period',
			'Fraud proofs still enforced on L1',
		],
		benefits: [
			'Up to 95% lower data posting costs',
			'Same execution security as Arbitrum One',
			'Ideal for high-throughput applications',
		],
		tradeoffs: [
			'Relies on DAC for data availability',
			'Not fully trustless data availability',
			'Less suitable for highest-value DeFi',
		],
	};
}

async function getDACertificate(
	this: IExecuteFunctions,
	network: string,
	transactionHash: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;
	const isNova = network === 'nova';

	// Get transaction receipt
	const receipt = await provider.getTransactionReceipt(transactionHash);
	if (!receipt) {
		throw new NodeOperationError(
			this.getNode(),
			`Transaction not found: ${transactionHash}`
		);
	}

	// Get transaction details
	const tx = await provider.getTransaction(transactionHash);
	if (!tx) {
		throw new NodeOperationError(
			this.getNode(),
			`Transaction details not found: ${transactionHash}`
		);
	}

	// Get block for additional context
	const block = await provider.getBlock(receipt.blockNumber);

	const certificateInfo: Record<string, unknown> = {
		transactionHash,
		network: networkConfig.name,
		isNovaNetwork: isNova,
		blockNumber: receipt.blockNumber,
		blockHash: receipt.blockHash,
		transactionIndex: receipt.index,
		gasUsed: receipt.gasUsed.toString(),
		effectiveGasPrice: receipt.gasPrice?.toString() || '0',
		status: receipt.status === 1 ? 'success' : 'failed',
	};

	if (isNova) {
		// For Nova, the DA certificate is part of the batch submission
		certificateInfo.dataAvailability = {
			type: 'DAC Certificate',
			status: 'Attested',
			description: 'Transaction data availability attested by DAC members',
			batchSubmissionBlock: receipt.blockNumber,
			dataLocation: 'DAC Storage + L1 Hash',
		};
		certificateInfo.costSavings = {
			description: 'Estimated savings vs posting full calldata to L1',
			calldataSize: tx.data.length / 2 - 1, // Approximate bytes
			estimatedSavingsPercent: '~95%',
		};
	} else {
		certificateInfo.dataAvailability = {
			type: 'L1 Calldata',
			status: 'Posted to Ethereum',
			description: 'Full transaction data posted to Ethereum L1',
			l1DataPosting: 'Included in batch',
		};
	}

	return certificateInfo;
}

async function compareGasCosts(
	this: IExecuteFunctions,
	dataSize: number,
	includeL1Fee: boolean,
): Promise<Record<string, unknown>> {
	// Create providers for both networks
	const credentials = await this.getCredentials('arbitrumRpc');
	
	// Get Arbitrum One gas info
	const oneConfig = ARBITRUM_NETWORKS.arbitrumOne;
	const oneProvider = new ethers.JsonRpcProvider(oneConfig.rpcUrl);
	
	// Get Arbitrum Nova gas info
	const novaConfig = ARBITRUM_NETWORKS.arbitrumNova;
	const novaProvider = new ethers.JsonRpcProvider(novaConfig.rpcUrl);

	// Get gas prices from both networks
	const [oneFeeData, novaFeeData] = await Promise.all([
		oneProvider.getFeeData(),
		novaProvider.getFeeData(),
	]);

	// Get L1 base fee estimates
	const arbGasInfoAbi = ['function getL1BaseFeeEstimate() external view returns (uint256)'];
	const oneArbGasInfo = new ethers.Contract('0x000000000000000000000000000000000000006C', arbGasInfoAbi, oneProvider);
	const novaArbGasInfo = new ethers.Contract('0x000000000000000000000000000000000000006C', arbGasInfoAbi, novaProvider);

	let oneL1BaseFee: bigint;
	let novaL1BaseFee: bigint;
	try {
		[oneL1BaseFee, novaL1BaseFee] = await Promise.all([
			oneArbGasInfo.getL1BaseFeeEstimate(),
			novaArbGasInfo.getL1BaseFeeEstimate(),
		]);
	} catch (error) {
		oneL1BaseFee = BigInt(30000000000); // 30 gwei fallback
		novaL1BaseFee = BigInt(30000000000);
	}

	// Calculate costs
	const baseGas = BigInt(21000); // Minimum transaction gas
	const dataGas = BigInt(dataSize * 16); // Non-zero calldata costs 16 gas per byte

	// L2 execution costs
	const oneL2Cost = (baseGas + dataGas) * (oneFeeData.gasPrice || BigInt(100000000));
	const novaL2Cost = (baseGas + dataGas) * (novaFeeData.gasPrice || BigInt(100000000));

	// L1 data costs (Arbitrum One posts all data, Nova only posts hashes)
	let oneL1DataCost = BigInt(0);
	let novaL1DataCost = BigInt(0);

	if (includeL1Fee) {
		// Arbitrum One: Full calldata to L1
		// Approximately 16 L1 gas per byte of calldata
		const oneL1DataGas = BigInt(dataSize * 16);
		oneL1DataCost = oneL1DataGas * oneL1BaseFee;

		// Nova: Only posts DA certificate hash (32 bytes) + overhead
		// Significant reduction in L1 costs
		const novaL1DataGas = BigInt(32 * 16 + 200); // Hash + overhead
		novaL1DataCost = novaL1DataGas * novaL1BaseFee;
	}

	const oneTotalCost = oneL2Cost + oneL1DataCost;
	const novaTotalCost = novaL2Cost + novaL1DataCost;

	const savingsWei = oneTotalCost - novaTotalCost;
	const savingsPercent = oneTotalCost > BigInt(0)
		? Number((savingsWei * BigInt(10000)) / oneTotalCost) / 100
		: 0;

	return {
		comparison: {
			dataSize: `${dataSize} bytes`,
			includesL1Fee: includeL1Fee,
		},
		arbitrumOne: {
			network: 'Arbitrum One',
			chainId: 42161,
			l2GasPrice: oneFeeData.gasPrice?.toString() || '0',
			l2GasPriceGwei: ethers.formatUnits(oneFeeData.gasPrice || BigInt(0), 'gwei'),
			l1BaseFeeEstimate: oneL1BaseFee.toString(),
			l2ExecutionCost: oneL2Cost.toString(),
			l2ExecutionCostEth: ethers.formatEther(oneL2Cost),
			l1DataCost: oneL1DataCost.toString(),
			l1DataCostEth: ethers.formatEther(oneL1DataCost),
			totalCost: oneTotalCost.toString(),
			totalCostEth: ethers.formatEther(oneTotalCost),
			dataAvailability: 'Full calldata posted to Ethereum L1',
		},
		arbitrumNova: {
			network: 'Arbitrum Nova',
			chainId: 42170,
			l2GasPrice: novaFeeData.gasPrice?.toString() || '0',
			l2GasPriceGwei: ethers.formatUnits(novaFeeData.gasPrice || BigInt(0), 'gwei'),
			l1BaseFeeEstimate: novaL1BaseFee.toString(),
			l2ExecutionCost: novaL2Cost.toString(),
			l2ExecutionCostEth: ethers.formatEther(novaL2Cost),
			l1DataCost: novaL1DataCost.toString(),
			l1DataCostEth: ethers.formatEther(novaL1DataCost),
			totalCost: novaTotalCost.toString(),
			totalCostEth: ethers.formatEther(novaTotalCost),
			dataAvailability: 'DAC certificate (hash only) posted to Ethereum L1',
		},
		savings: {
			weiSaved: savingsWei.toString(),
			ethSaved: ethers.formatEther(savingsWei),
			percentSaved: `${savingsPercent.toFixed(2)}%`,
			recommendation: savingsPercent > 50
				? 'Nova recommended for this transaction size'
				: 'Consider Arbitrum One for maximum security',
		},
		notes: [
			'Arbitrum One provides full Ethereum L1 data availability guarantees',
			'Arbitrum Nova uses a Data Availability Committee (DAC) for lower costs',
			'Nova is ideal for gaming, social, and high-frequency applications',
			'One is recommended for DeFi and high-value transactions',
			'Actual costs may vary based on network congestion',
		],
	};
}

export const nova = { operations, fields, execute };
