/**
 * Arbitrum SDK Transport
 *
 * Pure ethers.js v6 implementation for Arbitrum cross-chain operations.
 * Does not depend on @arbitrum/sdk to avoid ethers v5/v6 compatibility issues.
 */

import {
	JsonRpcProvider,
	Wallet,
	Contract,
	parseUnits,
	type TransactionReceipt,
	ethers,
} from 'ethers';
import { ABIS } from '../constants/abis';
import { getBridgeContracts } from '../constants/bridges';
import type { ArbitrumNetworkId } from '../constants/networks';

export type BridgeDirection = 'deposit' | 'withdrawal';

export const L1ToL2MessageStatus = {
	NOT_YET_CREATED: 1,
	CREATION_FAILED: 2,
	FUNDS_DEPOSITED_ON_L2: 3,
	REDEEMED: 4,
	EXPIRED: 5,
} as const;

export const L2ToL1MessageStatus = {
	UNCONFIRMED: 1,
	CONFIRMED: 2,
	EXECUTED: 3,
} as const;

export interface RetryableTicketInfo {
	ticketId: string;
	status: number;
	statusName: string;
	l2TxHash?: string;
	timeout?: number;
	beneficiary?: string;
	calldata?: string;
}

export interface WithdrawalInfo {
	l2TxHash: string;
	status: number;
	statusName: string;
	l1TxHash?: string;
	confirmationBlock?: number;
	challengePeriodEnd?: Date;
	canExecute: boolean;
	batchNumber?: bigint;
	indexInBatch?: bigint;
}

export interface DepositParams {
	amount: string;
	tokenAddress?: string;
	destinationAddress?: string;
	l2Provider: JsonRpcProvider;
	l1Signer: Wallet;
	maxSubmissionCost?: string;
	gasLimit?: number;
	maxFeePerGas?: string;
}

export interface WithdrawalParams {
	amount: string;
	tokenAddress?: string;
	destinationAddress?: string;
	l2Signer: Wallet;
}

export interface RetryableGasEstimate {
	maxSubmissionCost: bigint;
	gasLimit: bigint;
	maxFeePerGas: bigint;
	deposit: bigint;
	totalCost: bigint;
}

const ARBSYS_ADDRESS = '0x0000000000000000000000000000000000000064';
const ARBRETRYABLETX_ADDRESS = '0x000000000000000000000000000000000000006E';
const NODEINTERFACE_ADDRESS = '0x00000000000000000000000000000000000000C8';

function getNetworkIdFromChain(chainId: bigint): ArbitrumNetworkId {
	switch (Number(chainId)) {
		case 42161: return 'arbitrumOne';
		case 42170: return 'arbitrumNova';
		case 421614: return 'arbitrumSepolia';
		default: return 'arbitrumOne';
	}
}

export async function createEthBridger(l2Provider: JsonRpcProvider) {
	const network = await l2Provider.getNetwork();
	const networkId = getNetworkIdFromChain(network.chainId);
	const bridges = getBridgeContracts(networkId);

	return {
		async deposit(params: { amount: bigint; l1Signer: Wallet; l2Provider: JsonRpcProvider }): Promise<TransactionReceipt> {
			const inbox = new Contract(bridges.l1.inbox, ABIS.L1Inbox, params.l1Signer);
			const tx = await inbox.depositEth({ value: params.amount });
			return await tx.wait();
		},
		async withdraw(params: { amount: bigint; l2Signer: Wallet; destinationAddress: string }): Promise<TransactionReceipt> {
			const arbSys = new Contract(ARBSYS_ADDRESS, ABIS.ArbSys, params.l2Signer);
			const tx = await arbSys.withdrawEth(params.destinationAddress, { value: params.amount });
			return await tx.wait();
		},
	};
}

export async function createErc20Bridger(l2Provider: JsonRpcProvider) {
	const network = await l2Provider.getNetwork();
	const networkId = getNetworkIdFromChain(network.chainId);
	const bridges = getBridgeContracts(networkId);

	return {
		async deposit(params: { amount: bigint; l1Signer: Wallet; l2Provider: JsonRpcProvider; erc20L1Address: string; destinationAddress?: string }): Promise<TransactionReceipt> {
			const token = new Contract(params.erc20L1Address, ABIS.ERC20, params.l1Signer);
			const signerAddress = await params.l1Signer.getAddress();
			const allowance = await token.allowance(signerAddress, bridges.l1.gateway);
			if (allowance < params.amount) {
				const approveTx = await token.approve(bridges.l1.gateway, params.amount);
				await approveTx.wait();
			}
			const router = new Contract(bridges.l1.gatewayRouter, ABIS.L1GatewayRouter, params.l1Signer);
			const gasLimit = 300000n;
			const maxFeePerGas = 100000000n;
			const maxSubmissionCost = 10000000000000n;
			const tx = await router.outboundTransfer(
				params.erc20L1Address, params.destinationAddress || signerAddress, params.amount,
				gasLimit, maxFeePerGas,
				ethers.AbiCoder.defaultAbiCoder().encode(['uint256', 'bytes'], [maxSubmissionCost, '0x']),
				{ value: maxSubmissionCost + gasLimit * maxFeePerGas }
			);
			return await tx.wait();
		},
		async withdraw(params: { amount: bigint; l2Signer: Wallet; erc20L1Address: string; destinationAddress?: string }): Promise<TransactionReceipt> {
			const signerAddress = await params.l2Signer.getAddress();
			const router = new Contract(bridges.l2.gatewayRouter, ABIS.L2GatewayRouter, params.l2Signer);
			const tx = await router.outboundTransfer(params.erc20L1Address, params.destinationAddress || signerAddress, params.amount, '0x');
			return await tx.wait();
		},
		async getL2ERC20Address(params: { erc20L1Address: string; l1Provider: JsonRpcProvider }): Promise<string> {
			const router = new Contract(bridges.l1.gatewayRouter, ABIS.L1GatewayRouter, params.l1Provider);
			try { return await router.calculateL2TokenAddress(params.erc20L1Address); } catch { return ethers.ZeroAddress; }
		},
		async getL1ERC20Address(params: { erc20L2Address: string; l2Provider: JsonRpcProvider }): Promise<string> {
			try {
				const token = new Contract(params.erc20L2Address, ['function l1Address() view returns (address)'], params.l2Provider);
				return await token.l1Address();
			} catch { return ethers.ZeroAddress; }
		},
	};
}

export async function estimateRetryableGas(l1Provider: JsonRpcProvider, l2Provider: JsonRpcProvider, to: string, calldata: string, l2CallValue: bigint = 0n): Promise<RetryableGasEstimate> {
	const block = await l1Provider.getBlock('latest');
	const baseFee = block?.baseFeePerGas || parseUnits('30', 'gwei');
	const calldataBytes = calldata.startsWith('0x') ? (calldata.length - 2) / 2 : calldata.length / 2;
	const maxSubmissionCost = BigInt(1400 + calldataBytes * 6) * baseFee;
	const nodeInterface = new Contract(NODEINTERFACE_ADDRESS, ABIS.NodeInterface, l2Provider);
	let gasLimit: bigint;
	try {
		const gasEstimate = await nodeInterface.estimateRetryableTicket('0x0000000000000000000000000000000000000001', 0n, to, l2CallValue, '0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000001', calldata);
		gasLimit = BigInt(gasEstimate.toString()) * 150n / 100n;
	} catch { gasLimit = 300000n; }
	const l2FeeData = await l2Provider.getFeeData();
	const maxFeePerGas = l2FeeData.maxFeePerGas || parseUnits('0.1', 'gwei');
	const deposit = maxSubmissionCost + gasLimit * maxFeePerGas + l2CallValue;
	return { maxSubmissionCost, gasLimit, maxFeePerGas, deposit, totalCost: deposit };
}

export async function depositEth(params: DepositParams): Promise<{ l1TxHash: string; l1TxReceipt: TransactionReceipt; retryableTicketId?: string }> {
	const amount = parseUnits(params.amount, 18);
	const bridger = await createEthBridger(params.l2Provider);
	const receipt = await bridger.deposit({ amount, l1Signer: params.l1Signer, l2Provider: params.l2Provider });
	let retryableTicketId: string | undefined;
	const inboxInterface = new ethers.Interface(ABIS.L1Inbox);
	for (const log of receipt.logs) {
		try {
			const parsed = inboxInterface.parseLog({ topics: log.topics as string[], data: log.data });
			if (parsed && parsed.name === 'InboxMessageDelivered') { retryableTicketId = parsed.args[0]?.toString(); break; }
		} catch { /* ignored */ }
	}
	return { l1TxHash: receipt.hash, l1TxReceipt: receipt, retryableTicketId };
}

export async function depositErc20(params: DepositParams, tokenAddress: string): Promise<{ l1TxHash: string; l1TxReceipt: TransactionReceipt; retryableTicketId?: string }> {
	const amount = parseUnits(params.amount, 18);
	const bridger = await createErc20Bridger(params.l2Provider);
	const receipt = await bridger.deposit({ amount, l1Signer: params.l1Signer, l2Provider: params.l2Provider, erc20L1Address: tokenAddress, destinationAddress: params.destinationAddress });
	return { l1TxHash: receipt.hash, l1TxReceipt: receipt };
}

export async function withdrawEth(params: WithdrawalParams): Promise<{ l2TxHash: string; l2TxReceipt: TransactionReceipt }> {
	const amount = parseUnits(params.amount, 18);
	const l2Provider = params.l2Signer.provider as JsonRpcProvider;
	const bridger = await createEthBridger(l2Provider);
	const receipt = await bridger.withdraw({ amount, l2Signer: params.l2Signer, destinationAddress: params.destinationAddress || (await params.l2Signer.getAddress()) });
	return { l2TxHash: receipt.hash, l2TxReceipt: receipt };
}

export async function getL1ToL2MessageStatus(l1TxHash: string, l1Provider: JsonRpcProvider, l2Provider: JsonRpcProvider): Promise<RetryableTicketInfo[]> {
	const l1Receipt = await l1Provider.getTransactionReceipt(l1TxHash);
	if (!l1Receipt) return [{ ticketId: '', status: L1ToL2MessageStatus.NOT_YET_CREATED, statusName: 'NOT_YET_CREATED' }];
	const inboxInterface = new ethers.Interface(ABIS.L1Inbox);
	const ticketIds: string[] = [];
	for (const log of l1Receipt.logs) {
		try {
			const parsed = inboxInterface.parseLog({ topics: log.topics as string[], data: log.data });
			if (parsed && parsed.name === 'InboxMessageDelivered') ticketIds.push(parsed.args[0].toString());
		} catch { /* ignored */ }
	}
	if (ticketIds.length === 0) return [{ ticketId: '', status: L1ToL2MessageStatus.CREATION_FAILED, statusName: 'CREATION_FAILED' }];
	const results: RetryableTicketInfo[] = [];
	const arbRetryableTx = new Contract(ARBRETRYABLETX_ADDRESS, ABIS.ArbRetryableTx, l2Provider);
	for (const ticketId of ticketIds) {
		try {
			const timeout = await arbRetryableTx.getTimeout(ticketId);
			const currentTime = Math.floor(Date.now() / 1000);
			let status: number, statusName: string;
			if (Number(timeout) === 0) { status = L1ToL2MessageStatus.REDEEMED; statusName = 'REDEEMED'; }
			else if (currentTime > Number(timeout)) { status = L1ToL2MessageStatus.EXPIRED; statusName = 'EXPIRED'; }
			else { status = L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2; statusName = 'FUNDS_DEPOSITED_ON_L2'; }
			results.push({ ticketId, status, statusName, timeout: Number(timeout) });
		} catch { results.push({ ticketId, status: L1ToL2MessageStatus.NOT_YET_CREATED, statusName: 'NOT_YET_CREATED' }); }
	}
	return results;
}

export async function getL2ToL1MessageStatus(l2TxHash: string, l2Provider: JsonRpcProvider, l1Provider: JsonRpcProvider): Promise<WithdrawalInfo[]> {
	const l2Receipt = await l2Provider.getTransactionReceipt(l2TxHash);
	if (!l2Receipt) return [{ l2TxHash, status: L2ToL1MessageStatus.UNCONFIRMED, statusName: 'UNCONFIRMED', canExecute: false }];
	const arbSysInterface = new ethers.Interface(ABIS.ArbSys);
	const withdrawalIds: bigint[] = [];
	for (const log of l2Receipt.logs) {
		try {
			if (log.address.toLowerCase() === ARBSYS_ADDRESS.toLowerCase()) {
				const parsed = arbSysInterface.parseLog({ topics: log.topics as string[], data: log.data });
				if (parsed && parsed.name === 'L2ToL1Tx') withdrawalIds.push(parsed.args.position || parsed.args[0]);
			}
		} catch { /* ignored */ }
	}
	if (withdrawalIds.length === 0) return [{ l2TxHash, status: L2ToL1MessageStatus.UNCONFIRMED, statusName: 'UNCONFIRMED', canExecute: false }];
	const results: WithdrawalInfo[] = [];
	const network = await l2Provider.getNetwork();
	const networkId = getNetworkIdFromChain(network.chainId);
	const bridges = getBridgeContracts(networkId);
	const outbox = new Contract(bridges.l1.outbox, ABIS.L1Outbox, l1Provider);
	for (const withdrawalId of withdrawalIds) {
		try {
			const isSpent = await outbox.isSpent(withdrawalId);
			if (isSpent) results.push({ l2TxHash, status: L2ToL1MessageStatus.EXECUTED, statusName: 'EXECUTED', canExecute: false, indexInBatch: withdrawalId });
			else results.push({ l2TxHash, status: L2ToL1MessageStatus.CONFIRMED, statusName: 'CONFIRMED', canExecute: true, indexInBatch: withdrawalId });
		} catch { results.push({ l2TxHash, status: L2ToL1MessageStatus.UNCONFIRMED, statusName: 'UNCONFIRMED', canExecute: false, indexInBatch: withdrawalId }); }
	}
	return results;
}

export async function redeemRetryableTicket(ticketId: string, l2Signer: Wallet): Promise<{ txHash: string; receipt: TransactionReceipt }> {
	const arbRetryableTx = new Contract(ARBRETRYABLETX_ADDRESS, ['function redeem(bytes32 ticketId) returns (bytes32)'], l2Signer);
	const tx = await arbRetryableTx.redeem(ticketId);
	const receipt = await tx.wait();
	return { txHash: receipt.hash, receipt };
}

export async function cancelRetryableTicket(ticketId: string, l2Signer: Wallet): Promise<{ txHash: string; receipt: TransactionReceipt }> {
	const arbRetryableTx = new Contract(ARBRETRYABLETX_ADDRESS, ['function cancel(bytes32 ticketId)'], l2Signer);
	const tx = await arbRetryableTx.cancel(ticketId);
	const receipt = await tx.wait();
	return { txHash: receipt.hash, receipt };
}

export async function getRetryableTimeout(ticketId: string, l2Provider: JsonRpcProvider): Promise<number> {
	const arbRetryableTx = new Contract(ARBRETRYABLETX_ADDRESS, ['function getTimeout(bytes32 ticketId) view returns (uint256)'], l2Provider);
	return Number(await arbRetryableTx.getTimeout(ticketId));
}

export async function getL2TokenAddress(l1TokenAddress: string, l1Provider: JsonRpcProvider, networkId: ArbitrumNetworkId = 'arbitrumOne'): Promise<string | null> {
	const bridges = getBridgeContracts(networkId);
	const router = new Contract(bridges.l1.gatewayRouter, ABIS.L1GatewayRouter, l1Provider);
	try { return await router.calculateL2TokenAddress(l1TokenAddress); } catch { return null; }
}

export async function getL1TokenAddress(l2TokenAddress: string, l2Provider: JsonRpcProvider): Promise<string | null> {
	try {
		const token = new Contract(l2TokenAddress, ['function l1Address() view returns (address)'], l2Provider);
		return await token.l1Address();
	} catch { return null; }
}

export function formatL1ToL2Status(status: number): string {
	const statusMap: Record<number, string> = {
		[L1ToL2MessageStatus.NOT_YET_CREATED]: 'Not Yet Created',
		[L1ToL2MessageStatus.CREATION_FAILED]: 'Creation Failed',
		[L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2]: 'Funds Deposited on L2',
		[L1ToL2MessageStatus.REDEEMED]: 'Redeemed',
		[L1ToL2MessageStatus.EXPIRED]: 'Expired',
	};
	return statusMap[status] || 'Unknown';
}

export function formatL2ToL1Status(status: number): string {
	const statusMap: Record<number, string> = {
		[L2ToL1MessageStatus.UNCONFIRMED]: 'Unconfirmed (In Challenge Period)',
		[L2ToL1MessageStatus.CONFIRMED]: 'Confirmed (Ready to Execute)',
		[L2ToL1MessageStatus.EXECUTED]: 'Executed',
	};
	return statusMap[status] || 'Unknown';
}
