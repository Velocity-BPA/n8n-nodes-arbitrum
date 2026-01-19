/**
 * Unit Converter Utility for Arbitrum
 * Handles conversions between wei, gwei, and ether
 */

import { ethers } from 'ethers';

/**
 * Supported Ethereum units
 */
export type EthUnit = 'wei' | 'kwei' | 'mwei' | 'gwei' | 'szabo' | 'finney' | 'ether';

/**
 * Unit decimals mapping
 */
export const UNIT_DECIMALS: Record<EthUnit, number> = {
	wei: 0,
	kwei: 3,
	mwei: 6,
	gwei: 9,
	szabo: 12,
	finney: 15,
	ether: 18,
};

/**
 * Convert value from one unit to another
 */
export function convertUnits(
	value: string | number | bigint,
	fromUnit: EthUnit,
	toUnit: EthUnit,
): string {
	const valueStr = typeof value === 'bigint' ? value.toString() : String(value);
	
	// First convert to wei
	const weiValue = ethers.parseUnits(valueStr, UNIT_DECIMALS[fromUnit]);
	
	// Then convert to target unit
	return ethers.formatUnits(weiValue, UNIT_DECIMALS[toUnit]);
}

/**
 * Convert to wei from any unit
 */
export function toWei(value: string | number, unit: EthUnit = 'ether'): bigint {
	return ethers.parseUnits(String(value), UNIT_DECIMALS[unit]);
}

/**
 * Convert from wei to any unit
 */
export function fromWei(value: string | bigint, unit: EthUnit = 'ether'): string {
	const weiValue = typeof value === 'string' ? BigInt(value) : value;
	return ethers.formatUnits(weiValue, UNIT_DECIMALS[unit]);
}

/**
 * Convert to gwei from wei
 */
export function toGwei(weiValue: string | bigint): string {
	return fromWei(weiValue, 'gwei');
}

/**
 * Convert from gwei to wei
 */
export function fromGwei(gweiValue: string | number): bigint {
	return toWei(gweiValue, 'gwei');
}

/**
 * Convert to ether from wei
 */
export function toEther(weiValue: string | bigint): string {
	return fromWei(weiValue, 'ether');
}

/**
 * Convert from ether to wei
 */
export function fromEther(etherValue: string | number): bigint {
	return toWei(etherValue, 'ether');
}

/**
 * Parse a value with unknown unit to wei
 * Supports formats like "1.5 ether", "1000000 gwei", "1000000000000000000"
 */
export function parseValueToWei(value: string): bigint {
	const trimmed = value.trim().toLowerCase();
	
	// Check for unit suffix
	for (const unit of Object.keys(UNIT_DECIMALS) as EthUnit[]) {
		if (trimmed.endsWith(unit)) {
			const numValue = trimmed.slice(0, -unit.length).trim();
			return toWei(numValue, unit);
		}
	}
	
	// Assume wei if no unit specified and looks like an integer
	if (/^\d+$/.test(trimmed)) {
		return BigInt(trimmed);
	}
	
	// Assume ether if decimal
	return toWei(trimmed, 'ether');
}

/**
 * Format wei value with appropriate unit suffix
 */
export function formatWithUnit(weiValue: string | bigint, maxDecimals: number = 6): string {
	const value = typeof weiValue === 'string' ? BigInt(weiValue) : weiValue;
	
	if (value === 0n) {
		return '0 ETH';
	}
	
	const absValue = value < 0n ? -value : value;
	
	// Determine appropriate unit
	if (absValue >= ethers.parseEther('0.001')) {
		const ethValue = parseFloat(ethers.formatEther(value));
		return `${formatNumber(ethValue, maxDecimals)} ETH`;
	} else if (absValue >= ethers.parseUnits('0.001', 'gwei')) {
		const gweiValue = parseFloat(ethers.formatUnits(value, 'gwei'));
		return `${formatNumber(gweiValue, maxDecimals)} Gwei`;
	} else {
		return `${value.toString()} Wei`;
	}
}

/**
 * Format a number with max decimals, removing trailing zeros
 */
function formatNumber(value: number, maxDecimals: number): string {
	const formatted = value.toFixed(maxDecimals);
	return parseFloat(formatted).toString();
}

/**
 * Parse token amount with decimals
 */
export function parseTokenAmount(amount: string | number, decimals: number): bigint {
	return ethers.parseUnits(String(amount), decimals);
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
	amount: string | bigint,
	decimals: number,
	maxDisplay: number = 6,
): string {
	const value = typeof amount === 'string' ? BigInt(amount) : amount;
	const formatted = ethers.formatUnits(value, decimals);
	
	// Limit display decimals
	const parts = formatted.split('.');
	if (parts.length === 2 && parts[1].length > maxDisplay) {
		return `${parts[0]}.${parts[1].slice(0, maxDisplay)}`;
	}
	
	return formatted;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(
	value: bigint,
	total: bigint,
	decimals: number = 2,
): string {
	if (total === 0n) {
		return '0';
	}
	
	const scaleFactor = 10n ** BigInt(decimals + 2);
	const percentage = (value * scaleFactor) / total;
	const result = Number(percentage) / (10 ** decimals);
	
	return result.toFixed(decimals);
}

/**
 * Add percentage to value (e.g., for slippage)
 */
export function addPercentage(value: bigint, percentage: number): bigint {
	const scaleFactor = 10000n;
	const percentageBps = BigInt(Math.round(percentage * 100));
	return value + (value * percentageBps) / scaleFactor;
}

/**
 * Subtract percentage from value (e.g., for slippage)
 */
export function subtractPercentage(value: bigint, percentage: number): bigint {
	const scaleFactor = 10000n;
	const percentageBps = BigInt(Math.round(percentage * 100));
	return value - (value * percentageBps) / scaleFactor;
}

/**
 * Format gas price for display
 */
export function formatGasPrice(weiValue: string | bigint): string {
	const value = typeof weiValue === 'string' ? BigInt(weiValue) : weiValue;
	const gweiValue = parseFloat(ethers.formatUnits(value, 'gwei'));
	
	if (gweiValue >= 1) {
		return `${gweiValue.toFixed(2)} Gwei`;
	} else {
		return `${(gweiValue * 1000).toFixed(2)} Mwei`;
	}
}

/**
 * Format large numbers with commas
 */
export function formatWithCommas(value: string | number | bigint): string {
	const str = value.toString();
	const parts = str.split('.');
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	return parts.join('.');
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

/**
 * Calculate ETH value in USD
 */
export function calculateUSDValue(
	weiValue: string | bigint,
	ethPriceUsd: number,
): number {
	const ethValue = parseFloat(toEther(weiValue));
	return ethValue * ethPriceUsd;
}
