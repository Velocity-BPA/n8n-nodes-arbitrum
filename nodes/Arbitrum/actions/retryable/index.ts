import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createProvider, getPrecompileContract } from '../../transport/provider';
import { RETRYABLE_STATUS } from '../../constants/bridges';

// Retryable resource operations
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['retryable'],
			},
		},
		options: [
			{
				name: 'Get Ticket Status',
				value: 'getTicketStatus',
				description: 'Get status of a retryable ticket',
				action: 'Get retryable ticket status',
			},
			{
				name: 'Get Ticket Info',
				value: 'getTicketInfo',
				description: 'Get detailed information about a retryable ticket',
				action: 'Get retryable ticket info',
			},
			{
				name: 'Redeem Ticket',
				value: 'redeemTicket',
				description: 'Manually redeem a retryable ticket',
				action: 'Redeem retryable ticket',
			},
			{
				name: 'Cancel Ticket',
				value: 'cancelTicket',
				description: 'Cancel a retryable ticket and get refund',
				action: 'Cancel retryable ticket',
			},
			{
				name: 'Get Ticket Creation Params',
				value: 'getTicketCreationParams',
				description: 'Get parameters for creating a retryable ticket',
				action: 'Get ticket creation params',
			},
			{
				name: 'Estimate Submission Cost',
				value: 'estimateSubmissionCost',
				description: 'Estimate cost to submit a retryable ticket',
				action: 'Estimate submission cost',
			},
			{
				name: 'Get Auto-Redeem Status',
				value: 'getAutoRedeemStatus',
				description: 'Check if auto-redeem was successful',
				action: 'Get auto-redeem status',
			},
		],
		default: 'getTicketStatus',
	},
];

// Retryable resource fields
export const fields: INodeProperties[] = [
	// Ticket ID field
	{
		displayName: 'Ticket ID',
		name: 'ticketId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketStatus', 'getTicketInfo', 'redeemTicket', 'cancelTicket', 'getAutoRedeemStatus'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The retryable ticket ID (32-byte hex)',
	},
	// Creation Params fields
	{
		displayName: 'Destination Address',
		name: 'destAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams', 'estimateSubmissionCost'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The destination address on L2',
	},
	{
		displayName: 'L2 Call Value',
		name: 'l2CallValue',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams', 'estimateSubmissionCost'],
			},
		},
		default: '0',
		description: 'ETH value to send with L2 call (in ETH)',
	},
	{
		displayName: 'Call Data',
		name: 'callData',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams', 'estimateSubmissionCost'],
			},
		},
		default: '0x',
		placeholder: '0x...',
		description: 'The calldata for the L2 transaction',
	},
	{
		displayName: 'Max Submission Cost',
		name: 'maxSubmissionCost',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams'],
			},
		},
		default: '',
		placeholder: '0.001',
		description: 'Maximum cost for ticket submission (in ETH). Leave empty for auto-estimate.',
	},
	{
		displayName: 'Excess Fee Refund Address',
		name: 'excessFeeRefundAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to receive excess fee refund. Leave empty to use sender.',
	},
	{
		displayName: 'Call Value Refund Address',
		name: 'callValueRefundAddress',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'Address to receive call value refund on failure. Leave empty to use sender.',
	},
	// Gas fields
	{
		displayName: 'Gas Limit',
		name: 'gasLimit',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams'],
			},
		},
		default: '',
		placeholder: '100000',
		description: 'L2 gas limit. Leave empty for auto-estimate.',
	},
	{
		displayName: 'Max Fee Per Gas',
		name: 'maxFeePerGas',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['getTicketCreationParams'],
			},
		},
		default: '',
		placeholder: '0.1',
		description: 'Max fee per gas in gwei. Leave empty for auto-estimate.',
	},
	// Data size for estimation
	{
		displayName: 'Data Size (Bytes)',
		name: 'dataSize',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['estimateSubmissionCost'],
			},
		},
		default: 0,
		description: 'Size of calldata in bytes (used if callData is empty)',
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['retryable'],
				operation: ['redeemTicket', 'cancelTicket'],
			},
		},
		options: [
			{
				displayName: 'Wait for Confirmation',
				name: 'waitForConfirmation',
				type: 'boolean',
				default: true,
				description: 'Whether to wait for transaction confirmation',
			},
			{
				displayName: 'Confirmations',
				name: 'confirmations',
				type: 'number',
				default: 1,
				description: 'Number of confirmations to wait for',
			},
			{
				displayName: 'Gas Limit Override',
				name: 'gasLimit',
				type: 'number',
				default: 0,
				description: 'Override gas limit for the transaction',
			},
		],
	},
];

// Execute function
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');
	const { provider } = await createProvider(credentials);

	let result: IDataObject = {};

	if (operation === 'getTicketStatus') {
		const ticketId = this.getNodeParameter('ticketId', index) as string;

		try {
			const arbRetryableTx = getPrecompileContract(provider, 'ArbRetryableTx');

			const timeout = await arbRetryableTx.getTimeout(ticketId);
			const currentTimestamp = Math.floor(Date.now() / 1000);
			const timeoutNumber = Number(timeout);

			let status: string;
			let statusCode: string;

			if (timeoutNumber === 0) {
				// Timeout of 0 means either redeemed or never existed
				status = 'REDEEMED_OR_NOT_FOUND';
				statusCode = RETRYABLE_STATUS.REDEEMED;
			} else if (currentTimestamp > timeoutNumber) {
				status = 'EXPIRED';
				statusCode = RETRYABLE_STATUS.EXPIRED;
			} else {
				status = 'PENDING';
				statusCode = RETRYABLE_STATUS.PENDING;
			}

			result = {
				ticketId,
				status,
				statusCode,
				timeout: timeoutNumber,
				timeoutDate: timeoutNumber > 0 ? new Date(timeoutNumber * 1000).toISOString() : null,
				currentTimestamp,
				timeRemaining: timeoutNumber > 0 ? Math.max(0, timeoutNumber - currentTimestamp) : 0,
				isRedeemable: status === 'PENDING',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get ticket status: ${error}`);
		}
	}

	if (operation === 'getTicketInfo') {
		const ticketId = this.getNodeParameter('ticketId', index) as string;

		try {
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				[
					'function getLifetime() view returns (uint256)',
					'function getTimeout(bytes32 ticketId) view returns (uint256)',
					'function getBeneficiary(bytes32 ticketId) view returns (address)',
					'function getSubmissionPrice(uint256 calldataSize) view returns (uint256)',
				],
				provider,
			);

			const [lifetime, timeout, beneficiary] = await Promise.all([
				arbRetryableTx.getLifetime(),
				arbRetryableTx.getTimeout(ticketId),
				arbRetryableTx.getBeneficiary(ticketId),
			]);

			const currentTimestamp = Math.floor(Date.now() / 1000);
			const timeoutNumber = Number(timeout);
			const lifetimeNumber = Number(lifetime);

			// Calculate creation time (approximate)
			const creationTime = timeoutNumber > 0 ? timeoutNumber - lifetimeNumber : null;

			let status: string;
			if (timeoutNumber === 0) {
				status = 'REDEEMED_OR_NOT_FOUND';
			} else if (currentTimestamp > timeoutNumber) {
				status = 'EXPIRED';
			} else {
				status = 'PENDING';
			}

			result = {
				ticketId,
				status,
				lifetime: lifetimeNumber,
				lifetimeDays: Math.floor(lifetimeNumber / 86400),
				timeout: timeoutNumber,
				timeoutDate: timeoutNumber > 0 ? new Date(timeoutNumber * 1000).toISOString() : null,
				beneficiary,
				creationTime,
				creationDate: creationTime ? new Date(creationTime * 1000).toISOString() : null,
				currentTimestamp,
				timeRemaining: timeoutNumber > 0 ? Math.max(0, timeoutNumber - currentTimestamp) : 0,
				timeRemainingHours: timeoutNumber > 0 ? Math.floor(Math.max(0, timeoutNumber - currentTimestamp) / 3600) : 0,
				canRedeem: status === 'PENDING',
				canCancel: status === 'PENDING',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get ticket info: ${error}`);
		}
	}

	if (operation === 'redeemTicket') {
		const ticketId = this.getNodeParameter('ticketId', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!credentials.privateKey) {
			throw new NodeOperationError(this.getNode(), 'Private key required for redeeming tickets');
		}

		try {
			const wallet = new ethers.Wallet(credentials.privateKey as string, provider);
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				['function redeem(bytes32 ticketId) returns (bytes32)'],
				wallet,
			);

			const txOptions: IDataObject = {};
			if (options.gasLimit && (options.gasLimit as number) > 0) {
				txOptions.gasLimit = options.gasLimit;
			}

			const tx = await arbRetryableTx.redeem(ticketId, txOptions);

			if (options.waitForConfirmation !== false) {
				const confirmations = (options.confirmations as number) || 1;
				const receipt = await tx.wait(confirmations);

				result = {
					ticketId,
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					effectiveGasPrice: receipt.gasPrice?.toString(),
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					redeemed: receipt.status === 1,
				};
			} else {
				result = {
					ticketId,
					transactionHash: tx.hash,
					status: 'PENDING',
					message: 'Transaction submitted, not waiting for confirmation',
				};
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to redeem ticket: ${error}`);
		}
	}

	if (operation === 'cancelTicket') {
		const ticketId = this.getNodeParameter('ticketId', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!credentials.privateKey) {
			throw new NodeOperationError(this.getNode(), 'Private key required for canceling tickets');
		}

		try {
			const wallet = new ethers.Wallet(credentials.privateKey as string, provider);
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				['function cancel(bytes32 ticketId)'],
				wallet,
			);

			// Get beneficiary to check authorization
			const beneficiary = await arbRetryableTx.getBeneficiary(ticketId);
			if (beneficiary.toLowerCase() !== wallet.address.toLowerCase()) {
				throw new NodeOperationError(
					this.getNode(),
					`Only the beneficiary (${beneficiary}) can cancel this ticket`,
				);
			}

			const txOptions: IDataObject = {};
			if (options.gasLimit && (options.gasLimit as number) > 0) {
				txOptions.gasLimit = options.gasLimit;
			}

			const tx = await arbRetryableTx.cancel(ticketId, txOptions);

			if (options.waitForConfirmation !== false) {
				const confirmations = (options.confirmations as number) || 1;
				const receipt = await tx.wait(confirmations);

				result = {
					ticketId,
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					cancelled: receipt.status === 1,
					refundSentTo: beneficiary,
				};
			} else {
				result = {
					ticketId,
					transactionHash: tx.hash,
					status: 'PENDING',
					message: 'Transaction submitted, not waiting for confirmation',
				};
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to cancel ticket: ${error}`);
		}
	}

	if (operation === 'getTicketCreationParams') {
		const destAddress = this.getNodeParameter('destAddress', index) as string;
		const l2CallValue = this.getNodeParameter('l2CallValue', index, '0') as string;
		const callData = this.getNodeParameter('callData', index, '0x') as string;
		const maxSubmissionCostInput = this.getNodeParameter('maxSubmissionCost', index, '') as string;
		const excessFeeRefundAddress = this.getNodeParameter('excessFeeRefundAddress', index, '') as string;
		const callValueRefundAddress = this.getNodeParameter('callValueRefundAddress', index, '') as string;
		const gasLimitInput = this.getNodeParameter('gasLimit', index, '') as string;
		const maxFeePerGasInput = this.getNodeParameter('maxFeePerGas', index, '') as string;

		try {
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				[
					'function getSubmissionPrice(uint256 calldataSize) view returns (uint256)',
				],
				provider,
			);

			// Calculate calldata size
			const calldataBytes = ethers.getBytes(callData);
			const calldataSize = calldataBytes.length;

			// Get submission price
			const submissionPrice = await arbRetryableTx.getSubmissionPrice(calldataSize);

			// Get gas price
			const feeData = await provider.getFeeData();
			const maxFeePerGas = maxFeePerGasInput 
				? ethers.parseUnits(maxFeePerGasInput, 'gwei')
				: feeData.maxFeePerGas || feeData.gasPrice || 0n;

			// Estimate gas limit if not provided
			let gasLimit: bigint;
			if (gasLimitInput) {
				gasLimit = BigInt(gasLimitInput);
			} else {
				// Default estimate based on calldata size
				gasLimit = BigInt(100000 + calldataSize * 16);
			}

			// Calculate max submission cost with buffer
			const maxSubmissionCost = maxSubmissionCostInput
				? ethers.parseEther(maxSubmissionCostInput)
				: submissionPrice * 2n; // 2x buffer

			// Calculate total value needed
			const l2CallValueWei = ethers.parseEther(l2CallValue);
			const maxGasCost = gasLimit * maxFeePerGas;
			const totalValue = l2CallValueWei + maxSubmissionCost + maxGasCost;

			// Determine refund addresses
			const sender = credentials.privateKey
				? new ethers.Wallet(credentials.privateKey as string).address
				: ethers.ZeroAddress;

			result = {
				destAddress,
				l2CallValue,
				l2CallValueWei: l2CallValueWei.toString(),
				callData,
				calldataSize,
				maxSubmissionCost: ethers.formatEther(maxSubmissionCost),
				maxSubmissionCostWei: maxSubmissionCost.toString(),
				excessFeeRefundAddress: excessFeeRefundAddress || sender,
				callValueRefundAddress: callValueRefundAddress || sender,
				gasLimit: gasLimit.toString(),
				maxFeePerGas: ethers.formatUnits(maxFeePerGas, 'gwei'),
				maxFeePerGasWei: maxFeePerGas.toString(),
				maxGasCost: ethers.formatEther(maxGasCost),
				maxGasCostWei: maxGasCost.toString(),
				totalValue: ethers.formatEther(totalValue),
				totalValueWei: totalValue.toString(),
				estimatedSubmissionPrice: ethers.formatEther(submissionPrice),
				estimatedSubmissionPriceWei: submissionPrice.toString(),
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get creation params: ${error}`);
		}
	}

	if (operation === 'estimateSubmissionCost') {
		const destAddress = this.getNodeParameter('destAddress', index) as string;
		const callData = this.getNodeParameter('callData', index, '0x') as string;
		const dataSize = this.getNodeParameter('dataSize', index, 0) as number;

		try {
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				[
					'function getSubmissionPrice(uint256 calldataSize) view returns (uint256)',
				],
				provider,
			);

			// Calculate calldata size
			let calldataSize: number;
			if (callData && callData !== '0x') {
				calldataSize = ethers.getBytes(callData).length;
			} else {
				calldataSize = dataSize;
			}

			const submissionPrice = await arbRetryableTx.getSubmissionPrice(calldataSize);

			// Get current gas prices for context
			const feeData = await provider.getFeeData();

			result = {
				calldataSize,
				submissionPrice: ethers.formatEther(submissionPrice),
				submissionPriceWei: submissionPrice.toString(),
				recommendedMaxSubmission: ethers.formatEther(submissionPrice * 2n),
				recommendedMaxSubmissionWei: (submissionPrice * 2n).toString(),
				currentGasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
				currentMaxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
				note: 'Recommended max is 2x the current price for safety margin',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to estimate submission cost: ${error}`);
		}
	}

	if (operation === 'getAutoRedeemStatus') {
		const ticketId = this.getNodeParameter('ticketId', index) as string;

		try {
			// Check if ticket was auto-redeemed by looking at its status
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				[
					'function getTimeout(bytes32 ticketId) view returns (uint256)',
					'function getBeneficiary(bytes32 ticketId) view returns (address)',
				],
				provider,
			);

			const timeout = await arbRetryableTx.getTimeout(ticketId);
			const timeoutNumber = Number(timeout);

			// If timeout is 0, the ticket was redeemed (either auto or manual)
			const wasRedeemed = timeoutNumber === 0;

			// To determine if it was auto-redeemed, we need to check the transaction logs
			// This is a simplified check - in production, you'd parse the creation transaction
			let autoRedeemStatus = 'UNKNOWN';
			let autoRedeemSuccess = false;

			if (wasRedeemed) {
				// Ticket was redeemed - could be auto or manual
				autoRedeemStatus = 'REDEEMED';
				autoRedeemSuccess = true;
			} else if (timeoutNumber > Math.floor(Date.now() / 1000)) {
				// Ticket still pending
				autoRedeemStatus = 'PENDING';
				autoRedeemSuccess = false;
			} else {
				// Ticket expired
				autoRedeemStatus = 'EXPIRED';
				autoRedeemSuccess = false;
			}

			result = {
				ticketId,
				autoRedeemStatus,
				autoRedeemSuccess,
				wasRedeemed,
				timeout: timeoutNumber,
				timeoutDate: timeoutNumber > 0 ? new Date(timeoutNumber * 1000).toISOString() : null,
				note: wasRedeemed
					? 'Ticket was redeemed (auto-redeem likely succeeded if no manual redemption)'
					: 'Check if auto-redeem had sufficient gas by examining creation transaction',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get auto-redeem status: ${error}`);
		}
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}

export const retryable = { operations, fields, execute };
