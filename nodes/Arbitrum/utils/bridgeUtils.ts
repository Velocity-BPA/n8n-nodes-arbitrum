/**
 * Bridge Utilities for Arbitrum
 * Helper functions for L1 <-> L2 bridging operations
 */

import { ethers, JsonRpcProvider, Signer, Contract } from 'ethers';
import { ABIS } from '../constants/abis';
import { getBridgeContracts, MESSAGE_STATUS, BRIDGE_DEFAULTS } from '../constants/bridges';
import type { ArbitrumNetworkId } from '../constants/networks';

/**
 * Deposit status information
 */
export interface DepositStatus {
	status: 'pending' | 'l1_confirmed' | 'l2_deposited' | 'failed';
	l1TxHash: string;
	l2TxHash?: string;
	retryableTicketId?: string;
	amount: string;
	from: string;
	to: string;
	timestamp?: number;
	l1BlockNumber?: number;
	l2BlockNumber?: number;
	errorMessage?: string;
}

/**
 * Withdrawal status information
 */
export interface WithdrawalStatus {
	status: 'initiated' | 'confirmed' | 'ready_to_execute' | 'executed' | 'failed';
	l2TxHash: string;
	l1TxHash?: string;
	amount: string;
	from: string;
	to: string;
	timestamp?: number;
	challengePeriodEnd?: number;
	outboxEntry?: string;
	batchNumber?: bigint;
	indexInBatch?: bigint;
	proof?: string[];
}

/**
 * Bridge transaction tracking info
 */
export interface BridgeTransaction {
	type: 'deposit' | 'withdrawal';
	network: ArbitrumNetworkId;
	txHash: string;
	status: string;
	amount: string;
	token?: string;
	from: string;
	to: string;
	createdAt: number;
	updatedAt: number;
	metadata?: Record<string, unknown>;
}

/**
 * Challenge period status
 */
export interface ChallengePeriodStatus {
	/** Whether challenge period has passed */
	isReady: boolean;
	/** End timestamp of challenge period */
	endTimestamp: number;
	/** Remaining time in seconds */
	remainingSeconds: number;
	/** Remaining time formatted */
	remainingFormatted: string;
	/** Estimated date/time when ready */
	readyAt: Date;
}

/**
 * Calculate deposit value including L1 submission cost
 */
export function calculateDepositValue(
	amount: bigint,
	maxSubmissionCost: bigint,
	gasLimit: bigint,
	maxFeePerGas: bigint,
): bigint {
	// Total value = amount + maxSubmissionCost + (gasLimit * maxFeePerGas)
	return amount + maxSubmissionCost + (gasLimit * maxFeePerGas);
}

/**
 * Calculate retryable ticket submission cost
 */
export async function calculateSubmissionCost(
	l1Provider: JsonRpcProvider,
	dataLength: number,
): Promise<bigint> {
	// Get L1 base fee
	const feeData = await l1Provider.getFeeData();
	const l1BaseFee = feeData.gasPrice ?? 0n;
	
	// Submission cost formula
	// Base: 1400 gas + 6 gas per byte
	const submissionGas = BigInt(1400 + dataLength * 6);
	
	// Add safety margin using multiplier
	const submissionCost = submissionGas * l1BaseFee;
	return (submissionCost * BigInt(Math.floor(BRIDGE_DEFAULTS.submissionCostMultiplier * 100))) / 100n;
}

/**
 * Get the L2 token address for a given L1 token
 */
export async function getL2TokenAddress(
	l1TokenAddress: string,
	network: ArbitrumNetworkId,
	l1Provider: JsonRpcProvider,
): Promise<string> {
	const bridges = getBridgeContracts(network);
	
	const gatewayRouter = new Contract(
		bridges.l1.gatewayRouter,
		ABIS.L1GatewayRouter,
		l1Provider,
	);
	
	const l2TokenAddress = await gatewayRouter.calculateL2TokenAddress(l1TokenAddress);
	return l2TokenAddress;
}

/**
 * Get the L1 token address for a given L2 token
 */
export async function getL1TokenAddress(
	l2TokenAddress: string,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
): Promise<string> {
	const bridges = getBridgeContracts(network);
	
	const gatewayRouter = new Contract(
		bridges.l2.gatewayRouter,
		ABIS.L2GatewayRouter,
		l2Provider,
	);
	
	// Check if token has a counterpart
	const gateway = await gatewayRouter.getGateway(l2TokenAddress);
	
	if (gateway === ethers.ZeroAddress) {
		throw new Error(`No gateway found for L2 token ${l2TokenAddress}`);
	}
	
	// For standard tokens, L1 address is stored in token contract
	const tokenContract = new Contract(
		l2TokenAddress,
		['function l1Address() view returns (address)'],
		l2Provider,
	);
	
	try {
		return await tokenContract.l1Address();
	} catch {
		throw new Error(`Cannot determine L1 address for token ${l2TokenAddress}`);
	}
}

/**
 * Get the gateway address for a token
 */
export async function getTokenGateway(
	tokenAddress: string,
	isL1: boolean,
	network: ArbitrumNetworkId,
	provider: JsonRpcProvider,
): Promise<string> {
	const bridges = getBridgeContracts(network);
	const routerAddress = isL1 ? bridges.l1.gatewayRouter : bridges.l2.gatewayRouter;
	const routerAbi = isL1 ? ABIS.L1GatewayRouter : ABIS.L2GatewayRouter;
	
	const router = new Contract(routerAddress, routerAbi, provider);
	return await router.getGateway(tokenAddress);
}

/**
 * Check if a deposit has been executed on L2
 */
export async function checkDepositStatus(
	l1TxHash: string,
	network: ArbitrumNetworkId,
	l1Provider: JsonRpcProvider,
	l2Provider: JsonRpcProvider,
): Promise<DepositStatus> {
	// Get L1 transaction
	const l1Tx = await l1Provider.getTransaction(l1TxHash);
	const l1Receipt = await l1Provider.getTransactionReceipt(l1TxHash);
	
	if (!l1Tx || !l1Receipt) {
		return {
			status: 'pending',
			l1TxHash,
			amount: '0',
			from: '',
			to: '',
		};
	}
	
	if (l1Receipt.status === 0) {
		return {
			status: 'failed',
			l1TxHash,
			amount: l1Tx.value.toString(),
			from: l1Tx.from,
			to: l1Tx.to ?? '',
			errorMessage: 'L1 transaction failed',
		};
	}
	
	// Parse retryable ticket creation from logs
	const bridges = getBridgeContracts(network);
	const inboxInterface = new ethers.Interface(ABIS.L1Inbox);
	
	let retryableTicketId: string | undefined;
	
	for (const log of l1Receipt.logs) {
		try {
			const parsed = inboxInterface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			if (parsed?.name === 'InboxMessageDelivered') {
				retryableTicketId = parsed.args.messageNum.toString();
				break;
			}
		} catch {
			// Not an inbox log
		}
	}
	
	// Check L2 for the deposit
	// The retryable ticket creates a unique ID that can be used to find the L2 tx
	if (retryableTicketId) {
		// Check if ticket has been redeemed
		try {
			const arbRetryable = new Contract(
				bridges.l2.arbRetryableTx,
				ABIS.ArbRetryableTx,
				l2Provider,
			);
			
			const timeout = await arbRetryable.getTimeout(retryableTicketId);
			
			if (timeout === 0n) {
				// Ticket has been redeemed or expired
				return {
					status: 'l2_deposited',
					l1TxHash,
					retryableTicketId,
					amount: l1Tx.value.toString(),
					from: l1Tx.from,
					to: l1Tx.to ?? '',
					l1BlockNumber: l1Receipt.blockNumber,
				};
			} else {
				// Ticket still pending
				return {
					status: 'l1_confirmed',
					l1TxHash,
					retryableTicketId,
					amount: l1Tx.value.toString(),
					from: l1Tx.from,
					to: l1Tx.to ?? '',
					l1BlockNumber: l1Receipt.blockNumber,
				};
			}
		} catch {
			// Error checking ticket status
			return {
				status: 'l1_confirmed',
				l1TxHash,
				retryableTicketId,
				amount: l1Tx.value.toString(),
				from: l1Tx.from,
				to: l1Tx.to ?? '',
				l1BlockNumber: l1Receipt.blockNumber,
			};
		}
	}
	
	return {
		status: 'l1_confirmed',
		l1TxHash,
		amount: l1Tx.value.toString(),
		from: l1Tx.from,
		to: l1Tx.to ?? '',
		l1BlockNumber: l1Receipt.blockNumber,
	};
}

/**
 * Check withdrawal status
 */
export async function checkWithdrawalStatus(
	l2TxHash: string,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
	l1Provider: JsonRpcProvider,
): Promise<WithdrawalStatus> {
	const l2Receipt = await l2Provider.getTransactionReceipt(l2TxHash);
	
	if (!l2Receipt) {
		return {
			status: 'initiated',
			l2TxHash,
			amount: '0',
			from: '',
			to: '',
		};
	}
	
	if (l2Receipt.status === 0) {
		return {
			status: 'failed',
			l2TxHash,
			amount: '0',
			from: l2Receipt.from,
			to: '',
		};
	}
	
	// Parse L2ToL1Tx event
	const arbSysInterface = new ethers.Interface(ABIS.ArbSys);
	let l2ToL1Info: {
		to: string;
		amount: bigint;
		batchNumber: bigint;
		indexInBatch: bigint;
	} | null = null;
	
	for (const log of l2Receipt.logs) {
		try {
			const parsed = arbSysInterface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			if (parsed?.name === 'L2ToL1Tx' || parsed?.name === 'L2ToL1Transaction') {
				l2ToL1Info = {
					to: parsed.args.destination ?? parsed.args.to,
					amount: parsed.args.callvalue ?? parsed.args.value ?? 0n,
					batchNumber: parsed.args.batchNumber ?? 0n,
					indexInBatch: parsed.args.indexInBatch ?? 0n,
				};
				break;
			}
		} catch {
			// Not an ArbSys log
		}
	}
	
	if (!l2ToL1Info) {
		return {
			status: 'initiated',
			l2TxHash,
			amount: '0',
			from: l2Receipt.from,
			to: '',
			timestamp: l2Receipt.blockNumber,
		};
	}
	
	// Check challenge period
	const challengeStatus = await getChallengePeriodStatus(
		l2Receipt.blockNumber,
		network,
		l2Provider,
	);
	
	// Check if already executed on L1
	const bridges = getBridgeContracts(network);
	const outbox = new Contract(bridges.l1.outbox, ABIS.L1Outbox, l1Provider);
	
	try {
		const isSpent = await outbox.isSpent(l2ToL1Info.indexInBatch);
		
		if (isSpent) {
			return {
				status: 'executed',
				l2TxHash,
				amount: l2ToL1Info.amount.toString(),
				from: l2Receipt.from,
				to: l2ToL1Info.to,
				batchNumber: l2ToL1Info.batchNumber,
				indexInBatch: l2ToL1Info.indexInBatch,
			};
		}
	} catch {
		// Outbox call failed, continue with status check
	}
	
	if (challengeStatus.isReady) {
		return {
			status: 'ready_to_execute',
			l2TxHash,
			amount: l2ToL1Info.amount.toString(),
			from: l2Receipt.from,
			to: l2ToL1Info.to,
			challengePeriodEnd: challengeStatus.endTimestamp,
			batchNumber: l2ToL1Info.batchNumber,
			indexInBatch: l2ToL1Info.indexInBatch,
		};
	}
	
	return {
		status: 'confirmed',
		l2TxHash,
		amount: l2ToL1Info.amount.toString(),
		from: l2Receipt.from,
		to: l2ToL1Info.to,
		challengePeriodEnd: challengeStatus.endTimestamp,
		batchNumber: l2ToL1Info.batchNumber,
		indexInBatch: l2ToL1Info.indexInBatch,
	};
}

/**
 * Get challenge period status for a withdrawal
 */
export async function getChallengePeriodStatus(
	l2BlockNumber: number,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
): Promise<ChallengePeriodStatus> {
	// Get block timestamp
	const block = await l2Provider.getBlock(l2BlockNumber);
	if (!block) {
		throw new Error(`Block ${l2BlockNumber} not found`);
	}
	
	// Challenge period is 7 days for mainnet, 1 hour for testnet
	const isTestnet = network === 'arbitrumSepolia' || network === 'arbitrumGoerli';
	const challengePeriodSeconds = isTestnet ? 3600 : 7 * 24 * 60 * 60;
	
	const endTimestamp = block.timestamp + challengePeriodSeconds;
	const now = Math.floor(Date.now() / 1000);
	const remainingSeconds = Math.max(0, endTimestamp - now);
	
	return {
		isReady: remainingSeconds === 0,
		endTimestamp,
		remainingSeconds,
		remainingFormatted: formatDuration(remainingSeconds),
		readyAt: new Date(endTimestamp * 1000),
	};
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds: number): string {
	if (seconds <= 0) return 'Ready';
	
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	
	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
	
	return parts.join(' ');
}

/**
 * Encode deposit calldata for ETH deposit
 */
export function encodeEthDepositCalldata(
	to: string,
	maxSubmissionCost: bigint,
	excessFeeRefundAddress: string,
	callValueRefundAddress: string,
	gasLimit: bigint,
	maxFeePerGas: bigint,
	data: string = '0x',
): string {
	const inboxInterface = new ethers.Interface(ABIS.L1Inbox);
	
	return inboxInterface.encodeFunctionData('createRetryableTicket', [
		to,
		0n, // l2CallValue (for ETH deposit, this is the amount - set via msg.value)
		maxSubmissionCost,
		excessFeeRefundAddress,
		callValueRefundAddress,
		gasLimit,
		maxFeePerGas,
		data,
	]);
}

/**
 * Encode withdrawal calldata
 */
export function encodeWithdrawCalldata(to: string, amount: bigint): string {
	const arbSysInterface = new ethers.Interface(ABIS.ArbSys);
	return arbSysInterface.encodeFunctionData('withdrawEth', [to]);
}

/**
 * Validate bridge parameters
 */
export function validateBridgeParams(params: {
	from: string;
	to: string;
	amount: string;
	network: string;
}): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	
	if (!ethers.isAddress(params.from)) {
		errors.push('Invalid from address');
	}
	
	if (!ethers.isAddress(params.to)) {
		errors.push('Invalid to address');
	}
	
	try {
		const amount = ethers.parseEther(params.amount);
		if (amount <= 0n) {
			errors.push('Amount must be greater than 0');
		}
	} catch {
		errors.push('Invalid amount format');
	}
	
	const validNetworks = ['arbitrumOne', 'arbitrumNova', 'arbitrumSepolia', 'arbitrumGoerli'];
	if (!validNetworks.includes(params.network)) {
		errors.push(`Invalid network. Must be one of: ${validNetworks.join(', ')}`);
	}
	
	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Get supported tokens for bridging
 */
export function getSupportedBridgeTokens(network: ArbitrumNetworkId): string[] {
	// Return list of commonly bridged tokens
	const tokens = [
		'ETH', // Native
		'USDC',
		'USDT',
		'DAI',
		'WBTC',
		'WETH',
		'ARB',
	];
	
	if (network === 'arbitrumNova') {
		// Nova has fewer tokens
		return ['ETH', 'USDC', 'DAI', 'ARB'];
	}
	
	return tokens;
}
