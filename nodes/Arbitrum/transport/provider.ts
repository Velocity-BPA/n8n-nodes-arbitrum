/**
 * Arbitrum Provider Transport
 *
 * Handles ethers.js provider initialization and management for Arbitrum networks.
 * Supports multiple RPC providers, WebSocket connections, and proper L2 configuration.
 */

import {
	JsonRpcProvider,
	WebSocketProvider,
	Wallet,
	Contract,
	Interface,
	formatUnits,
	parseUnits,
	isAddress,
	getAddress,
	type Provider,
	type Signer,
	type TransactionRequest,
	type TransactionResponse,
	type TransactionReceipt,
	type Block,
	type Log,
	type EventLog,
} from 'ethers';
import { IExecuteFunctions, ILoadOptionsFunctions, ICredentialDataDecryptedObject } from 'n8n-workflow';
import {
	NETWORKS,
	ArbitrumNetworkId,
	NetworkConfig,
	buildProviderRpcUrl,
	getNetwork,
	PRECOMPILES,
} from '../constants/networks';
import { ARB_SYS_ABI, ARB_GAS_INFO_ABI, NODE_INTERFACE_ABI, ABIS } from '../constants/abis';

/**
 * Provider configuration options
 */
export interface ProviderConfig {
	network: ArbitrumNetworkId;
	rpcUrl?: string;
	wsUrl?: string;
	privateKey?: string;
	l1RpcUrl?: string;
	l1PrivateKey?: string;
}

/**
 * Resolved provider URLs and configuration
 */
export interface ResolvedConfig {
	rpcUrl: string;
	wsUrl?: string;
	chainId: number;
	networkConfig: NetworkConfig | null;
	l1RpcUrl?: string;
}

/**
 * Provider connection result
 */
export interface ProviderConnection {
	provider: JsonRpcProvider;
	signer: Wallet | null;
	wsProvider?: WebSocketProvider;
	networkConfig: NetworkConfig | null;
	chainId: number;
}

/**
 * L1 Provider connection result
 */
export interface L1ProviderConnection {
	provider: JsonRpcProvider;
	signer: Wallet | null;
	chainId: number;
}

/**
 * Gas estimation result for Arbitrum
 */
export interface ArbitrumGasEstimate {
	gasLimit: bigint;
	maxFeePerGas: bigint;
	maxPriorityFeePerGas: bigint;
	l1DataFee: bigint;
	l2ExecutionFee: bigint;
	totalFee: bigint;
}

/**
 * Resolve RPC URL from credentials
 */
export function resolveRpcUrl(credentials: ICredentialDataDecryptedObject): ResolvedConfig {
	const network = credentials.network as ArbitrumNetworkId;
	const rpcProvider = credentials.rpcProvider as string;

	// Custom network
	if (network === 'custom') {
		return {
			rpcUrl: credentials.rpcUrl as string,
			wsUrl: credentials.wsUrl as string | undefined,
			chainId: credentials.chainId as number,
			networkConfig: null,
			l1RpcUrl: credentials.l1RpcUrl as string | undefined,
		};
	}

	const networkConfig = getNetwork(network);
	if (!networkConfig) {
		throw new Error(`Unknown network: ${network}`);
	}

	let rpcUrl: string;
	let wsUrl: string | undefined;

	// Determine RPC URL based on provider selection
	if (rpcProvider === 'public') {
		rpcUrl = networkConfig.rpcUrl;
		wsUrl = networkConfig.wsUrl;
	} else if (rpcProvider === 'customUrl') {
		rpcUrl = credentials.customRpcUrl as string;
	} else {
		// Enhanced provider (Alchemy, Infura, QuickNode, Ankr)
		const apiKey = credentials.apiKey as string;
		if (!apiKey) {
			throw new Error(`API key required for ${rpcProvider} provider`);
		}

		const quicknodeEndpoint = rpcProvider === 'quicknode'
			? credentials.quicknodeEndpoint as string
			: undefined;

		const providerUrl = buildProviderRpcUrl(
			network,
			rpcProvider as keyof typeof import('../constants/networks').RPC_PROVIDERS,
			apiKey,
			quicknodeEndpoint,
		);

		if (!providerUrl) {
			throw new Error(`${rpcProvider} does not support ${network}`);
		}

		rpcUrl = providerUrl;
	}

	return {
		rpcUrl,
		wsUrl: credentials.enableWebSocket ? wsUrl : undefined,
		chainId: networkConfig.chainId,
		networkConfig,
		l1RpcUrl: credentials.l1RpcUrl as string | undefined,
	};
}

/**
 * Create an ethers.js provider for Arbitrum
 */
export async function createProvider(
	credentials: ICredentialDataDecryptedObject,
): Promise<ProviderConnection> {
	const config = resolveRpcUrl(credentials);

	// Create JSON-RPC provider
	const provider = new JsonRpcProvider(config.rpcUrl, {
		chainId: config.chainId,
		name: config.networkConfig?.name || 'custom',
	});

	// Verify connection
	try {
		const chainId = await provider.getNetwork();
		if (Number(chainId.chainId) !== config.chainId) {
			throw new Error(
				`Chain ID mismatch: expected ${config.chainId}, got ${chainId.chainId}`,
			);
		}
	} catch (error) {
		throw new Error(`Failed to connect to RPC: ${(error as Error).message}`);
	}

	// Create signer if private key provided
	let signer: Wallet | null = null;
	const privateKey = credentials.privateKey as string;
	if (privateKey) {
		try {
			signer = new Wallet(privateKey, provider);
		} catch (error) {
			throw new Error(`Invalid private key: ${(error as Error).message}`);
		}
	}

	// Create WebSocket provider if enabled
	let wsProvider: WebSocketProvider | undefined;
	if (config.wsUrl) {
		try {
			wsProvider = new WebSocketProvider(config.wsUrl);
		} catch (error) {
			console.warn(`WebSocket connection failed: ${(error as Error).message}`);
		}
	}

	return {
		provider,
		signer,
		wsProvider,
		networkConfig: config.networkConfig,
		chainId: config.chainId,
	};
}

/**
 * Create L1 Ethereum provider
 */
export async function createL1Provider(
	credentials: ICredentialDataDecryptedObject,
): Promise<L1ProviderConnection | null> {
	const l1RpcUrl = credentials.l1RpcUrl as string;
	if (!l1RpcUrl) {
		return null;
	}

	const network = credentials.network as ArbitrumNetworkId;
	const networkConfig = getNetwork(network);
	const l1ChainId = networkConfig?.l1ChainId || 1;

	const provider = new JsonRpcProvider(l1RpcUrl, {
		chainId: l1ChainId,
		name: networkConfig?.l1Name || 'ethereum',
	});

	// Verify connection
	try {
		const chainId = await provider.getNetwork();
		if (Number(chainId.chainId) !== l1ChainId) {
			throw new Error(
				`L1 Chain ID mismatch: expected ${l1ChainId}, got ${chainId.chainId}`,
			);
		}
	} catch (error) {
		throw new Error(`Failed to connect to L1 RPC: ${(error as Error).message}`);
	}

	// Create signer if private key provided
	let signer: Wallet | null = null;
	const l1PrivateKey = credentials.l1PrivateKey as string;
	if (l1PrivateKey) {
		try {
			signer = new Wallet(l1PrivateKey, provider);
		} catch (error) {
			throw new Error(`Invalid L1 private key: ${(error as Error).message}`);
		}
	}

	return {
		provider,
		signer,
		chainId: l1ChainId,
	};
}

/**
 * Get provider from execution context
 */
export async function getProviderFromContext(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	credentialName = 'arbitrumRpc',
): Promise<ProviderConnection> {
	const credentials = await context.getCredentials(credentialName);
	return createProvider(credentials);
}

/**
 * Get L1 provider from execution context
 */
export async function getL1ProviderFromContext(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	credentialName = 'arbitrumRpc',
): Promise<L1ProviderConnection | null> {
	const credentials = await context.getCredentials(credentialName);
	return createL1Provider(credentials);
}

/**
 * Get ArbSys precompile contract
 */
export function getArbSysContract(provider: Provider): Contract {
	return new Contract(PRECOMPILES.ArbSys, ARB_SYS_ABI, provider);
}

/**
 * Get ArbGasInfo precompile contract
 */
export function getArbGasInfoContract(provider: Provider): Contract {
	return new Contract(PRECOMPILES.ArbGasInfo, ARB_GAS_INFO_ABI, provider);
}

/**
 * Get NodeInterface precompile contract
 */
export function getNodeInterfaceContract(provider: Provider): Contract {
	return new Contract(PRECOMPILES.NodeInterface, NODE_INTERFACE_ABI, provider);
}

/**
 * Estimate gas for an Arbitrum transaction including L1 data fee
 */
export async function estimateArbitrumGas(
	provider: JsonRpcProvider,
	tx: TransactionRequest,
): Promise<ArbitrumGasEstimate> {
	const nodeInterface = getNodeInterfaceContract(provider);
	const arbGasInfo = getArbGasInfoContract(provider);

	// Get current gas prices
	const feeData = await provider.getFeeData();
	const maxFeePerGas = feeData.maxFeePerGas || parseUnits('0.1', 'gwei');
	const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || parseUnits('0.01', 'gwei');

	// Estimate L2 gas limit
	const gasLimit = await provider.estimateGas(tx);

	// Calculate L1 data fee using NodeInterface
	const to = tx.to || '0x0000000000000000000000000000000000000000';
	const data = tx.data || '0x';
	const isContractCreation = !tx.to;

	let l1DataFee: bigint;
	try {
		const [gasEstimateForL1, , l1BaseFee] = await nodeInterface.gasEstimateL1Component(
			to,
			isContractCreation,
			data,
		);
		l1DataFee = BigInt(gasEstimateForL1) * BigInt(l1BaseFee);
	} catch {
		// Fallback: estimate based on calldata size
		const calldataSize = BigInt((data.length - 2) / 2);
		const l1BaseFee = await arbGasInfo.getL1BaseFeeEstimate();
		// Approximate: 16 gas per non-zero byte, 4 gas per zero byte
		l1DataFee = calldataSize * BigInt(16) * BigInt(l1BaseFee);
	}

	// Calculate L2 execution fee
	const l2ExecutionFee = gasLimit * maxFeePerGas;

	// Total fee
	const totalFee = l1DataFee + l2ExecutionFee;

	return {
		gasLimit,
		maxFeePerGas,
		maxPriorityFeePerGas,
		l1DataFee,
		l2ExecutionFee,
		totalFee,
	};
}

/**
 * Get the current L1 block number corresponding to this L2 state
 */
export async function getL1BlockNumber(provider: Provider): Promise<bigint> {
	const arbSys = getArbSysContract(provider);
	return BigInt(await arbSys.arbBlockNumber());
}

/**
 * Get L1 gas price estimate
 */
export async function getL1GasPrice(provider: Provider): Promise<bigint> {
	const arbGasInfo = getArbGasInfoContract(provider);
	return BigInt(await arbGasInfo.getL1GasPriceEstimate());
}

/**
 * Wait for transaction with enhanced receipt parsing
 */
export async function waitForTransaction(
	provider: JsonRpcProvider,
	txHash: string,
	confirmations = 1,
	timeout = 120000,
): Promise<TransactionReceipt> {
	const receipt = await provider.waitForTransaction(txHash, confirmations, timeout);
	if (!receipt) {
		throw new Error(`Transaction ${txHash} not found`);
	}
	return receipt;
}

/**
 * Format transaction response for n8n output
 */
export function formatTransactionResponse(tx: TransactionResponse): Record<string, unknown> {
	return {
		hash: tx.hash,
		from: tx.from,
		to: tx.to,
		value: formatUnits(tx.value, 18),
		nonce: tx.nonce,
		gasLimit: tx.gasLimit.toString(),
		gasPrice: tx.gasPrice ? formatUnits(tx.gasPrice, 'gwei') : null,
		maxFeePerGas: tx.maxFeePerGas ? formatUnits(tx.maxFeePerGas, 'gwei') : null,
		maxPriorityFeePerGas: tx.maxPriorityFeePerGas
			? formatUnits(tx.maxPriorityFeePerGas, 'gwei')
			: null,
		data: tx.data,
		chainId: tx.chainId?.toString(),
		blockNumber: tx.blockNumber,
		blockHash: tx.blockHash,
		index: tx.index,
	};
}

/**
 * Format transaction receipt for n8n output
 */
export function formatTransactionReceipt(receipt: TransactionReceipt): Record<string, unknown> {
	return {
		transactionHash: receipt.hash,
		blockNumber: receipt.blockNumber,
		blockHash: receipt.blockHash,
		index: receipt.index,
		from: receipt.from,
		to: receipt.to,
		contractAddress: receipt.contractAddress,
		gasUsed: receipt.gasUsed.toString(),
		cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
		gasPrice: receipt.gasPrice ? formatUnits(receipt.gasPrice, 'gwei') : null,
		effectiveGasPrice: receipt.gasPrice ? formatUnits(receipt.gasPrice, 'gwei') : null,
		status: receipt.status,
		logsBloom: receipt.logsBloom,
		logs: receipt.logs.map((log) => ({
			address: log.address,
			topics: log.topics,
			data: log.data,
			blockNumber: log.blockNumber,
			transactionHash: log.transactionHash,
			logIndex: log.index,
		})),
	};
}

/**
 * Format block for n8n output
 */
export function formatBlock(block: Block): Record<string, unknown> {
	return {
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
		baseFeePerGas: block.baseFeePerGas ? formatUnits(block.baseFeePerGas, 'gwei') : null,
		transactions: block.transactions,
	};
}

/**
 * Validate and normalize Ethereum address
 */
export function validateAddress(address: string): string {
	if (!isAddress(address)) {
		throw new Error(`Invalid address: ${address}`);
	}
	return getAddress(address);
}

/**
 * Parse amount with decimals
 */
export function parseAmount(amount: string, decimals: number): bigint {
	return parseUnits(amount, decimals);
}

/**
 * Format amount with decimals
 */
export function formatAmount(amount: bigint, decimals: number): string {
	return formatUnits(amount, decimals);
}

/**
 * Get a simple provider from credentials - convenience wrapper
 * Returns the raw JsonRpcProvider for direct use
 */
export async function getProvider(credentials: ICredentialDataDecryptedObject): Promise<JsonRpcProvider> {
	const connection = await createProvider(credentials);
	return connection.provider;
}

/**
 * Get a signer from credentials - convenience wrapper
 * Returns the Wallet signer or null if no private key
 */
export async function getSigner(credentials: ICredentialDataDecryptedObject): Promise<Wallet | null> {
	const connection = await createProvider(credentials);
	return connection.signer;
}

/**
 * Get a precompile contract instance
 */
export function getPrecompileContract(
	provider: JsonRpcProvider | Wallet,
	precompileName: keyof typeof PRECOMPILES
): Contract {
	const address = PRECOMPILES[precompileName];
	
	// Map precompile names to their ABIs (cast to any to handle readonly)
	const abiMap: Record<string, readonly string[]> = {
		ArbSys: ABIS.ArbSys,
		ArbGasInfo: ABIS.ArbGasInfo,
		ArbRetryableTx: ABIS.ArbRetryableTx,
		NodeInterface: ABIS.NodeInterface,
	};
	
	const abi = abiMap[precompileName] || ABIS.ArbSys;
	return new Contract(address, abi as string[], provider);
}

/**
 * Export utility functions and types
 */
export {
	JsonRpcProvider,
	WebSocketProvider,
	Wallet,
	Contract,
	Interface,
	formatUnits,
	parseUnits,
	isAddress,
	getAddress,
	type Provider,
	type Signer,
	type TransactionRequest,
	type TransactionResponse,
	type TransactionReceipt,
	type Block,
	type Log,
	type EventLog,
};
