/**
 * Retryable Ticket Utilities for Arbitrum
 * Helper functions for managing L1 to L2 retryable tickets
 */

import { ethers, JsonRpcProvider, Contract, Signer } from 'ethers';
import { ABIS } from '../constants/abis';
import { getBridgeContracts, RETRYABLE_STATUS, BRIDGE_DEFAULTS } from '../constants/bridges';
import { PRECOMPILES, type ArbitrumNetworkId } from '../constants/networks';

/**
 * Retryable ticket information
 */
export interface RetryableTicketInfo {
	/** Unique ticket ID */
	ticketId: string;
	/** Current status */
	status: keyof typeof RETRYABLE_STATUS;
	/** Destination address on L2 */
	to: string;
	/** Value to send with L2 call */
	l2CallValue: bigint;
	/** Beneficiary for excess funds */
	beneficiary: string;
	/** Max submission cost paid */
	maxSubmissionCost: bigint;
	/** Excess fee refund address */
	excessFeeRefundAddress: string;
	/** Call value refund address */
	callValueRefundAddress: string;
	/** Gas limit for L2 execution */
	gasLimit: bigint;
	/** Max fee per gas on L2 */
	maxFeePerGas: bigint;
	/** Calldata for L2 execution */
	data: string;
	/** Timeout timestamp (when ticket expires) */
	timeout: number;
	/** Creation timestamp */
	createdAt?: number;
	/** L1 transaction hash that created the ticket */
	l1TxHash?: string;
	/** L2 redemption transaction hash */
	l2RedeemTxHash?: string;
}

/**
 * Retryable ticket creation parameters
 */
export interface CreateRetryableParams {
	/** Destination address on L2 */
	to: string;
	/** Value to send with L2 call */
	l2CallValue: bigint;
	/** Max submission cost (L1 calldata fee) */
	maxSubmissionCost: bigint;
	/** Address to receive excess submission fee refund */
	excessFeeRefundAddress: string;
	/** Address to receive call value refund if L2 call fails */
	callValueRefundAddress: string;
	/** Gas limit for L2 execution */
	gasLimit: bigint;
	/** Max fee per gas on L2 */
	maxFeePerGas: bigint;
	/** Calldata for L2 execution */
	data: string;
}

/**
 * Get retryable ticket status
 */
export async function getRetryableStatus(
	ticketId: string,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
): Promise<keyof typeof RETRYABLE_STATUS> {
	const bridges = getBridgeContracts(network);
	const arbRetryable = new Contract(
		bridges.l2.arbRetryableTx,
		ABIS.ArbRetryableTx,
		l2Provider,
	);
	
	try {
		const timeout = await arbRetryable.getTimeout(ticketId);
		
		if (timeout === 0n) {
			// Ticket has been redeemed or doesn't exist
			// We need to check if it was redeemed or never existed
			// This requires checking the creation event
			return 'REDEEMED';
		}
		
		const now = Math.floor(Date.now() / 1000);
		if (BigInt(now) > timeout) {
			return 'EXPIRED';
		}
		
		return 'FUNDS_DEPOSITED';
	} catch (error: any) {
		if (error.message?.includes('revert')) {
			return 'NOT_FOUND';
		}
		throw error;
	}
}

/**
 * Get retryable ticket information
 */
export async function getRetryableInfo(
	ticketId: string,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
): Promise<RetryableTicketInfo | null> {
	const bridges = getBridgeContracts(network);
	const arbRetryable = new Contract(
		bridges.l2.arbRetryableTx,
		ABIS.ArbRetryableTx,
		l2Provider,
	);
	
	try {
		const timeout = await arbRetryable.getTimeout(ticketId);
		const status = await getRetryableStatus(ticketId, network, l2Provider);
		
		return {
			ticketId,
			status,
			to: '', // Would need to parse from creation event
			l2CallValue: 0n,
			beneficiary: '',
			maxSubmissionCost: 0n,
			excessFeeRefundAddress: '',
			callValueRefundAddress: '',
			gasLimit: 0n,
			maxFeePerGas: 0n,
			data: '',
			timeout: Number(timeout),
		};
	} catch {
		return null;
	}
}

/**
 * Get retryable ticket timeout
 */
export async function getRetryableTimeout(
	ticketId: string,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
): Promise<{ timestamp: number; isExpired: boolean; remainingSeconds: number }> {
	const bridges = getBridgeContracts(network);
	const arbRetryable = new Contract(
		bridges.l2.arbRetryableTx,
		ABIS.ArbRetryableTx,
		l2Provider,
	);
	
	const timeout = await arbRetryable.getTimeout(ticketId);
	const now = Math.floor(Date.now() / 1000);
	const timeoutNumber = Number(timeout);
	
	return {
		timestamp: timeoutNumber,
		isExpired: now > timeoutNumber || timeoutNumber === 0,
		remainingSeconds: Math.max(0, timeoutNumber - now),
	};
}

/**
 * Redeem a retryable ticket
 */
export async function redeemRetryable(
	ticketId: string,
	network: ArbitrumNetworkId,
	signer: Signer,
): Promise<{ txHash: string; success: boolean }> {
	const bridges = getBridgeContracts(network);
	const arbRetryable = new Contract(
		bridges.l2.arbRetryableTx,
		ABIS.ArbRetryableTx,
		signer,
	);
	
	const tx = await arbRetryable.redeem(ticketId);
	const receipt = await tx.wait();
	
	return {
		txHash: receipt.hash,
		success: receipt.status === 1,
	};
}

/**
 * Cancel a retryable ticket and get refund
 */
export async function cancelRetryable(
	ticketId: string,
	network: ArbitrumNetworkId,
	signer: Signer,
): Promise<{ txHash: string; success: boolean }> {
	const bridges = getBridgeContracts(network);
	const arbRetryable = new Contract(
		bridges.l2.arbRetryableTx,
		ABIS.ArbRetryableTx,
		signer,
	);
	
	const tx = await arbRetryable.cancel(ticketId);
	const receipt = await tx.wait();
	
	return {
		txHash: receipt.hash,
		success: receipt.status === 1,
	};
}

/**
 * Keepalive a retryable ticket (extend timeout)
 */
export async function keepaliveRetryable(
	ticketId: string,
	network: ArbitrumNetworkId,
	signer: Signer,
): Promise<{ txHash: string; newTimeout: number }> {
	const bridges = getBridgeContracts(network);
	const arbRetryable = new Contract(
		bridges.l2.arbRetryableTx,
		ABIS.ArbRetryableTx,
		signer,
	);
	
	const tx = await arbRetryable.keepalive(ticketId);
	const receipt = await tx.wait();
	
	// Get new timeout
	const newTimeout = await arbRetryable.getTimeout(ticketId);
	
	return {
		txHash: receipt.hash,
		newTimeout: Number(newTimeout),
	};
}

/**
 * Estimate submission cost for retryable ticket
 */
export async function estimateSubmissionCost(
	dataLength: number,
	l1BaseFee: bigint,
): Promise<bigint> {
	// Submission cost = (base + dataLength * perByte) * l1BaseFee
	const base = 1400n; // Base gas for submission
	const perByte = 6n; // Gas per byte of calldata
	
	const totalGas = base + BigInt(dataLength) * perByte;
	return totalGas * l1BaseFee;
}

/**
 * Calculate required deposit for retryable ticket
 */
export function calculateRetryableDeposit(params: {
	l2CallValue: bigint;
	maxSubmissionCost: bigint;
	gasLimit: bigint;
	maxFeePerGas: bigint;
}): bigint {
	return (
		params.l2CallValue +
		params.maxSubmissionCost +
		params.gasLimit * params.maxFeePerGas
	);
}

/**
 * Encode retryable ticket creation calldata
 */
export function encodeCreateRetryableTicket(params: CreateRetryableParams): string {
	const inboxInterface = new ethers.Interface(ABIS.L1Inbox);
	
	return inboxInterface.encodeFunctionData('createRetryableTicket', [
		params.to,
		params.l2CallValue,
		params.maxSubmissionCost,
		params.excessFeeRefundAddress,
		params.callValueRefundAddress,
		params.gasLimit,
		params.maxFeePerGas,
		params.data,
	]);
}

/**
 * Parse retryable ticket creation from L1 transaction receipt
 */
export function parseRetryableCreation(
	receipt: ethers.TransactionReceipt,
): { ticketId: string; messageNum: bigint } | null {
	const inboxInterface = new ethers.Interface(ABIS.L1Inbox);
	
	for (const log of receipt.logs) {
		try {
			const parsed = inboxInterface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			if (parsed?.name === 'InboxMessageDelivered') {
				return {
					ticketId: parsed.args.messageNum.toString(),
					messageNum: parsed.args.messageNum,
				};
			}
		} catch {
			continue;
		}
	}
	
	return null;
}

/**
 * Parse retryable ticket redemption from L2 transaction receipt
 */
export function parseRetryableRedemption(
	receipt: ethers.TransactionReceipt,
): { ticketId: string; success: boolean } | null {
	const retryableInterface = new ethers.Interface(ABIS.ArbRetryableTx);
	
	for (const log of receipt.logs) {
		try {
			const parsed = retryableInterface.parseLog({
				topics: log.topics as string[],
				data: log.data,
			});
			
			if (parsed?.name === 'RedeemScheduled') {
				return {
					ticketId: parsed.args.ticketId.toString(),
					success: true,
				};
			}
			
			if (parsed?.name === 'Canceled') {
				return {
					ticketId: parsed.args.ticketId.toString(),
					success: false,
				};
			}
		} catch {
			continue;
		}
	}
	
	return null;
}

/**
 * Get recommended gas parameters for retryable ticket
 */
export async function getRecommendedRetryableGas(
	l1Provider: JsonRpcProvider,
	l2Provider: JsonRpcProvider,
	params: {
		to: string;
		data: string;
		l2CallValue: bigint;
	},
): Promise<{
	gasLimit: bigint;
	maxFeePerGas: bigint;
	maxSubmissionCost: bigint;
	deposit: bigint;
}> {
	// Get L1 and L2 fee data
	const [l1FeeData, l2FeeData] = await Promise.all([
		l1Provider.getFeeData(),
		l2Provider.getFeeData(),
	]);
	
	const l1BaseFee = l1FeeData.gasPrice ?? ethers.parseUnits('30', 'gwei');
	const l2MaxFee = l2FeeData.maxFeePerGas ?? ethers.parseUnits('0.1', 'gwei');
	
	// Estimate L2 gas
	let gasLimit: bigint;
	try {
		gasLimit = await l2Provider.estimateGas({
			to: params.to,
			data: params.data,
			value: params.l2CallValue,
		});
		// Add 50% buffer
		gasLimit = (gasLimit * 150n) / 100n;
	} catch {
		// Default gas limit
		gasLimit = BigInt(BRIDGE_DEFAULTS.gasLimit);
	}
	
	// Calculate submission cost
	const dataLength = params.data ? (params.data.length - 2) / 2 : 0;
	const submissionCost = await estimateSubmissionCost(dataLength, l1BaseFee);
	
	// Add safety margin to submission cost
	const maxSubmissionCost = (submissionCost * 150n) / 100n;
	
	// Calculate total deposit
	const deposit = calculateRetryableDeposit({
		l2CallValue: params.l2CallValue,
		maxSubmissionCost,
		gasLimit,
		maxFeePerGas: l2MaxFee,
	});
	
	return {
		gasLimit,
		maxFeePerGas: l2MaxFee,
		maxSubmissionCost,
		deposit,
	};
}

/**
 * Format retryable ticket info for display
 */
export function formatRetryableInfo(info: RetryableTicketInfo): Record<string, string> {
	const timeout = info.timeout > 0
		? new Date(info.timeout * 1000).toISOString()
		: 'N/A';
	
	return {
		'Ticket ID': info.ticketId,
		'Status': info.status,
		'Destination': info.to || 'Unknown',
		'L2 Call Value': ethers.formatEther(info.l2CallValue) + ' ETH',
		'Gas Limit': info.gasLimit.toString(),
		'Max Fee Per Gas': ethers.formatUnits(info.maxFeePerGas, 'gwei') + ' Gwei',
		'Timeout': timeout,
	};
}

/**
 * Check if auto-redeem is likely to succeed
 */
export async function checkAutoRedeemLikelihood(
	ticketId: string,
	network: ArbitrumNetworkId,
	l2Provider: JsonRpcProvider,
): Promise<{
	likely: boolean;
	reason: string;
}> {
	const status = await getRetryableStatus(ticketId, network, l2Provider);
	
	if (status === 'REDEEMED') {
		return {
			likely: false,
			reason: 'Ticket has already been redeemed',
		};
	}
	
	if (status === 'EXPIRED') {
		return {
			likely: false,
			reason: 'Ticket has expired',
		};
	}
	
	if (status === 'NOT_FOUND') {
		return {
			likely: false,
			reason: 'Ticket not found',
		};
	}
	
	// Ticket is in FUNDS_DEPOSITED state
	// Auto-redeem happens automatically if gas was provided
	return {
		likely: true,
		reason: 'Ticket is pending and will be auto-redeemed if sufficient gas was provided',
	};
}
