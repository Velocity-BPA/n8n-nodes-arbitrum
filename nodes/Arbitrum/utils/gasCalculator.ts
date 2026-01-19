/**
 * Gas Calculator Utility for Arbitrum
 * Handles L2 execution gas + L1 data fee calculations
 */

import { ethers, JsonRpcProvider } from 'ethers';
import { ABIS } from '../constants/abis';
import { PRECOMPILES } from '../constants/networks';

/**
 * Gas estimation result for Arbitrum transactions
 */
export interface ArbitrumGasEstimation {
	/** L2 execution gas limit */
	gasLimit: bigint;
	/** Max fee per gas (L2) */
	maxFeePerGas: bigint;
	/** Max priority fee per gas (L2) */
	maxPriorityFeePerGas: bigint;
	/** L1 data fee (calldata cost on Ethereum) */
	l1DataFee: bigint;
	/** L2 execution cost */
	l2ExecutionFee: bigint;
	/** Total estimated cost (L1 + L2) */
	totalFee: bigint;
	/** L1 gas used estimate */
	l1GasUsed: bigint;
	/** L1 base fee estimate */
	l1BaseFee: bigint;
	/** Breakdown for display */
	breakdown: {
		l1DataFeeEth: string;
		l2ExecutionFeeEth: string;
		totalFeeEth: string;
		l1Percentage: string;
		l2Percentage: string;
	};
}

/**
 * Gas prices on Arbitrum
 */
export interface ArbitrumGasPrices {
	/** Current gas price */
	gasPrice: bigint;
	/** Max fee per gas (EIP-1559) */
	maxFeePerGas: bigint;
	/** Max priority fee per gas (EIP-1559) */
	maxPriorityFeePerGas: bigint;
	/** L1 base fee */
	l1BaseFee: bigint;
	/** L2 base fee */
	l2BaseFee: bigint;
	/** Prices in gwei for display */
	display: {
		gasPriceGwei: string;
		maxFeePerGasGwei: string;
		maxPriorityFeeGwei: string;
		l1BaseFeeGwei: string;
		l2BaseFeeGwei: string;
	};
}

/**
 * Retryable ticket gas estimation
 */
export interface RetryableTicketGasEstimation {
	/** Gas limit for L2 execution */
	gasLimit: bigint;
	/** Max fee per gas on L2 */
	maxFeePerGas: bigint;
	/** Submission fee (L1 calldata cost) */
	submissionFee: bigint;
	/** Total value to send (submission + L2 gas) */
	deposit: bigint;
	/** Max submission cost with safety margin */
	maxSubmissionCost: bigint;
}

/**
 * Get current gas prices on Arbitrum
 */
export async function getArbitrumGasPrices(provider: JsonRpcProvider): Promise<ArbitrumGasPrices> {
	// Get fee data
	const feeData = await provider.getFeeData();
	
	// Get L1 base fee from ArbGasInfo precompile
	const arbGasInfo = new ethers.Contract(
		PRECOMPILES.ArbGasInfo,
		ABIS.ArbGasInfo,
		provider,
	);
	
	let l1BaseFee: bigint;
	try {
		l1BaseFee = await arbGasInfo.getL1BaseFeeEstimate();
	} catch {
		// Fallback if precompile call fails
		l1BaseFee = feeData.gasPrice ?? 0n;
	}
	
	const gasPrice = feeData.gasPrice ?? 0n;
	const maxFeePerGas = feeData.maxFeePerGas ?? gasPrice;
	const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? 0n;
	
	// L2 base fee is typically maxFeePerGas - maxPriorityFeePerGas
	const l2BaseFee = maxFeePerGas - maxPriorityFeePerGas;
	
	return {
		gasPrice,
		maxFeePerGas,
		maxPriorityFeePerGas,
		l1BaseFee,
		l2BaseFee,
		display: {
			gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
			maxFeePerGasGwei: ethers.formatUnits(maxFeePerGas, 'gwei'),
			maxPriorityFeeGwei: ethers.formatUnits(maxPriorityFeePerGas, 'gwei'),
			l1BaseFeeGwei: ethers.formatUnits(l1BaseFee, 'gwei'),
			l2BaseFeeGwei: ethers.formatUnits(l2BaseFee, 'gwei'),
		},
	};
}

/**
 * Estimate total gas cost for an Arbitrum transaction
 * Includes both L2 execution cost and L1 data fee
 */
export async function estimateArbitrumGas(
	provider: JsonRpcProvider,
	tx: {
		from: string;
		to: string;
		data?: string;
		value?: bigint;
	},
): Promise<ArbitrumGasEstimation> {
	// Get L2 gas estimate
	const gasLimit = await provider.estimateGas(tx);
	
	// Get gas prices
	const gasPrices = await getArbitrumGasPrices(provider);
	
	// Calculate L2 execution fee
	const l2ExecutionFee = gasLimit * gasPrices.maxFeePerGas;
	
	// Estimate L1 data fee using NodeInterface precompile
	let l1DataFee = 0n;
	let l1GasUsed = 0n;
	
	try {
		const nodeInterface = new ethers.Contract(
			PRECOMPILES.NodeInterface,
			ABIS.NodeInterface,
			provider,
		);
		
		// gasEstimateL1Component returns L1 gas estimate
		const result = await nodeInterface.gasEstimateL1Component.staticCall(
			tx.to,
			false, // isContractCreation
			tx.data ?? '0x',
		);
		
		l1GasUsed = result.gasEstimateForL1;
		l1DataFee = l1GasUsed * gasPrices.l1BaseFee;
	} catch {
		// Fallback: estimate based on calldata size
		const dataSize = tx.data ? (tx.data.length - 2) / 2 : 0;
		// Approximate: 16 gas per non-zero byte, 4 per zero byte
		// Assume average of 12 gas per byte
		l1GasUsed = BigInt(dataSize * 12);
		l1DataFee = l1GasUsed * gasPrices.l1BaseFee;
	}
	
	const totalFee = l2ExecutionFee + l1DataFee;
	
	// Calculate percentages
	const l1Percentage = totalFee > 0n
		? ((l1DataFee * 10000n) / totalFee).toString()
		: '0';
	const l2Percentage = totalFee > 0n
		? ((l2ExecutionFee * 10000n) / totalFee).toString()
		: '0';
	
	return {
		gasLimit,
		maxFeePerGas: gasPrices.maxFeePerGas,
		maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
		l1DataFee,
		l2ExecutionFee,
		totalFee,
		l1GasUsed,
		l1BaseFee: gasPrices.l1BaseFee,
		breakdown: {
			l1DataFeeEth: ethers.formatEther(l1DataFee),
			l2ExecutionFeeEth: ethers.formatEther(l2ExecutionFee),
			totalFeeEth: ethers.formatEther(totalFee),
			l1Percentage: (parseFloat(l1Percentage) / 100).toFixed(2),
			l2Percentage: (parseFloat(l2Percentage) / 100).toFixed(2),
		},
	};
}

/**
 * Estimate gas for a retryable ticket (L1 to L2 message)
 */
export async function estimateRetryableTicketGas(
	l1Provider: JsonRpcProvider,
	l2Provider: JsonRpcProvider,
	params: {
		from: string;
		to: string;
		l2CallValue: bigint;
		data: string;
		excessFeeRefundAddress: string;
		callValueRefundAddress: string;
	},
): Promise<RetryableTicketGasEstimation> {
	// Get L2 gas prices
	const l2GasPrices = await getArbitrumGasPrices(l2Provider);
	
	// Estimate L2 gas for the call
	let gasLimit: bigint;
	try {
		gasLimit = await l2Provider.estimateGas({
			from: params.from,
			to: params.to,
			data: params.data,
			value: params.l2CallValue,
		});
		// Add safety margin (20%)
		gasLimit = (gasLimit * 120n) / 100n;
	} catch {
		// Default gas limit for failed estimates
		gasLimit = 300000n;
	}
	
	// Calculate submission fee based on L1 calldata
	// This is the cost of posting the retryable ticket to L1
	const dataSize = params.data ? (params.data.length - 2) / 2 : 0;
	
	// Get L1 gas price
	const l1FeeData = await l1Provider.getFeeData();
	const l1GasPrice = l1FeeData.gasPrice ?? 0n;
	
	// Submission cost formula: base + (bytes * perByte)
	// Base is typically around 1400 gas, perByte is 6
	const submissionGas = BigInt(1400 + dataSize * 6);
	const submissionFee = submissionGas * l1GasPrice;
	
	// Add 50% safety margin for submission cost
	const maxSubmissionCost = (submissionFee * 150n) / 100n;
	
	// Calculate total deposit required
	// deposit = l2CallValue + (gasLimit * maxFeePerGas) + maxSubmissionCost
	const l2GasCost = gasLimit * l2GasPrices.maxFeePerGas;
	const deposit = params.l2CallValue + l2GasCost + maxSubmissionCost;
	
	return {
		gasLimit,
		maxFeePerGas: l2GasPrices.maxFeePerGas,
		submissionFee,
		deposit,
		maxSubmissionCost,
	};
}

/**
 * Calculate L1 data fee for given calldata
 */
export async function calculateL1DataFee(
	provider: JsonRpcProvider,
	data: string,
): Promise<bigint> {
	const gasPrices = await getArbitrumGasPrices(provider);
	
	// Count zero and non-zero bytes
	const bytes = ethers.getBytes(data);
	let zeroBytes = 0;
	let nonZeroBytes = 0;
	
	for (const byte of bytes) {
		if (byte === 0) {
			zeroBytes++;
		} else {
			nonZeroBytes++;
		}
	}
	
	// L1 gas: 4 per zero byte, 16 per non-zero byte
	const l1Gas = BigInt(zeroBytes * 4 + nonZeroBytes * 16);
	
	return l1Gas * gasPrices.l1BaseFee;
}

/**
 * Get gas price recommendations (slow, standard, fast)
 */
export async function getGasPriceRecommendations(
	provider: JsonRpcProvider,
): Promise<{
	slow: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
	standard: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
	fast: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };
}> {
	const gasPrices = await getArbitrumGasPrices(provider);
	const baseFee = gasPrices.l2BaseFee;
	
	// Arbitrum has very low fees, so multipliers are smaller
	return {
		slow: {
			maxFeePerGas: baseFee + (baseFee / 20n), // +5%
			maxPriorityFeePerGas: ethers.parseUnits('0.001', 'gwei'),
		},
		standard: {
			maxFeePerGas: baseFee + (baseFee / 10n), // +10%
			maxPriorityFeePerGas: ethers.parseUnits('0.01', 'gwei'),
		},
		fast: {
			maxFeePerGas: baseFee + (baseFee / 5n), // +20%
			maxPriorityFeePerGas: ethers.parseUnits('0.1', 'gwei'),
		},
	};
}

/**
 * Compare gas costs between Arbitrum One and Nova
 */
export async function compareNetworkGasCosts(
	oneProvider: JsonRpcProvider,
	novaProvider: JsonRpcProvider,
	tx: {
		to: string;
		data?: string;
		value?: bigint;
	},
	from: string,
): Promise<{
	arbitrumOne: ArbitrumGasEstimation;
	arbitrumNova: ArbitrumGasEstimation;
	savings: {
		absolute: string;
		percentage: string;
		cheaperNetwork: 'one' | 'nova';
	};
}> {
	const [oneEstimate, novaEstimate] = await Promise.all([
		estimateArbitrumGas(oneProvider, { from, ...tx }),
		estimateArbitrumGas(novaProvider, { from, ...tx }),
	]);
	
	const oneFee = oneEstimate.totalFee;
	const novaFee = novaEstimate.totalFee;
	
	const cheaperNetwork = novaFee < oneFee ? 'nova' : 'one';
	const savings = novaFee < oneFee ? oneFee - novaFee : novaFee - oneFee;
	const higherFee = novaFee < oneFee ? oneFee : novaFee;
	
	const savingsPercentage = higherFee > 0n
		? ((savings * 10000n) / higherFee).toString()
		: '0';
	
	return {
		arbitrumOne: oneEstimate,
		arbitrumNova: novaEstimate,
		savings: {
			absolute: ethers.formatEther(savings),
			percentage: (parseFloat(savingsPercentage) / 100).toFixed(2),
			cheaperNetwork,
		},
	};
}

/**
 * Format gas estimation for display
 */
export function formatGasEstimation(estimation: ArbitrumGasEstimation): Record<string, string> {
	return {
		'Gas Limit': estimation.gasLimit.toString(),
		'Max Fee Per Gas': `${ethers.formatUnits(estimation.maxFeePerGas, 'gwei')} Gwei`,
		'Max Priority Fee': `${ethers.formatUnits(estimation.maxPriorityFeePerGas, 'gwei')} Gwei`,
		'L1 Data Fee': `${estimation.breakdown.l1DataFeeEth} ETH (${estimation.breakdown.l1Percentage}%)`,
		'L2 Execution Fee': `${estimation.breakdown.l2ExecutionFeeEth} ETH (${estimation.breakdown.l2Percentage}%)`,
		'Total Fee': `${estimation.breakdown.totalFeeEth} ETH`,
	};
}
