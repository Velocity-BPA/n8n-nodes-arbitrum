import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createProvider, validateAddress, createL1Provider } from '../../transport/provider';
import {
	createEthBridger,
	createErc20Bridger,
	getL1ToL2MessageStatus,
	getL2ToL1MessageStatus,
	getL2TokenAddress,
	getL1TokenAddress,
} from '../../transport/arbitrumSdk';
import {
	BRIDGE_CONTRACTS,
	L1_TO_L2_MESSAGE_STATUS,
	L2_TO_L1_MESSAGE_STATUS,
} from '../../constants/bridges';
import { NETWORK_CONFIGS } from '../../constants/networks';

// Bridge resource operations
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
			},
		},
		options: [
			{
				name: 'Get Deposit Status',
				value: 'getDepositStatus',
				description: 'Get L1 to L2 deposit status',
				action: 'Get L1 to L2 deposit status',
			},
			{
				name: 'Get Withdrawal Status',
				value: 'getWithdrawalStatus',
				description: 'Get L2 to L1 withdrawal status',
				action: 'Get L2 to L1 withdrawal status',
			},
			{
				name: 'Get Pending Deposits',
				value: 'getPendingDeposits',
				description: 'Get pending L1 to L2 deposits for an address',
				action: 'Get pending L1 to L2 deposits',
			},
			{
				name: 'Get Pending Withdrawals',
				value: 'getPendingWithdrawals',
				description: 'Get pending L2 to L1 withdrawals for an address',
				action: 'Get pending L2 to L1 withdrawals',
			},
			{
				name: 'Estimate Deposit Gas',
				value: 'estimateDepositGas',
				description: 'Estimate gas for depositing to L2',
				action: 'Estimate deposit gas',
			},
			{
				name: 'Estimate Withdrawal Gas',
				value: 'estimateWithdrawalGas',
				description: 'Estimate gas for withdrawing to L1',
				action: 'Estimate withdrawal gas',
			},
			{
				name: 'Get Retryable Ticket Status',
				value: 'getRetryableTicketStatus',
				description: 'Get status of a retryable ticket',
				action: 'Get retryable ticket status',
			},
			{
				name: 'Redeem Retryable Ticket',
				value: 'redeemRetryableTicket',
				description: 'Manually redeem a retryable ticket',
				action: 'Redeem retryable ticket',
			},
			{
				name: 'Get Bridge Token Mapping',
				value: 'getBridgeTokenMapping',
				description: 'Get L1/L2 token address mapping',
				action: 'Get bridge token mapping',
			},
			{
				name: 'Get L1 Gateway Address',
				value: 'getL1GatewayAddress',
				description: 'Get L1 gateway address for a token',
				action: 'Get L1 gateway address',
			},
			{
				name: 'Get L2 Gateway Address',
				value: 'getL2GatewayAddress',
				description: 'Get L2 gateway address for a token',
				action: 'Get L2 gateway address',
			},
			{
				name: 'Track Bridge Transaction',
				value: 'trackBridgeTransaction',
				description: 'Track a bridge transaction across L1 and L2',
				action: 'Track bridge transaction',
			},
			{
				name: 'Get Challenge Period Status',
				value: 'getChallengePeriodStatus',
				description: 'Get withdrawal challenge period status',
				action: 'Get challenge period status',
			},
			{
				name: 'Get Outbox Entry',
				value: 'getOutboxEntry',
				description: 'Get outbox entry for L2 to L1 message',
				action: 'Get outbox entry',
			},
		],
		default: 'getDepositStatus',
	},
];

// Bridge resource fields
export const fields: INodeProperties[] = [
	// Transaction Hash field (for status operations)
	{
		displayName: 'Transaction Hash',
		name: 'transactionHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['getDepositStatus', 'getWithdrawalStatus', 'trackBridgeTransaction'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The transaction hash to check status for',
	},
	{
		displayName: 'Transaction Type',
		name: 'transactionType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['trackBridgeTransaction'],
			},
		},
		options: [
			{
				name: 'L1 to L2 (Deposit)',
				value: 'deposit',
			},
			{
				name: 'L2 to L1 (Withdrawal)',
				value: 'withdrawal',
			},
		],
		default: 'deposit',
		description: 'Type of bridge transaction',
	},
	// Address field (for pending operations)
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['getPendingDeposits', 'getPendingWithdrawals'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The address to check pending transactions for',
	},
	// Token fields
	{
		displayName: 'Token Type',
		name: 'tokenType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['estimateDepositGas', 'estimateWithdrawalGas', 'getBridgeTokenMapping', 'getL1GatewayAddress', 'getL2GatewayAddress'],
			},
		},
		options: [
			{
				name: 'ETH',
				value: 'eth',
			},
			{
				name: 'ERC-20 Token',
				value: 'erc20',
			},
		],
		default: 'eth',
		description: 'Type of token to bridge',
	},
	{
		displayName: 'Token Address',
		name: 'tokenAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['estimateDepositGas', 'estimateWithdrawalGas', 'getBridgeTokenMapping', 'getL1GatewayAddress', 'getL2GatewayAddress'],
				tokenType: ['erc20'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The token contract address',
	},
	{
		displayName: 'Token Address Layer',
		name: 'tokenAddressLayer',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['getBridgeTokenMapping'],
				tokenType: ['erc20'],
			},
		},
		options: [
			{
				name: 'L1 Token Address',
				value: 'l1',
			},
			{
				name: 'L2 Token Address',
				value: 'l2',
			},
		],
		default: 'l1',
		description: 'Which layer the provided token address is on',
	},
	// Amount field
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['estimateDepositGas', 'estimateWithdrawalGas'],
			},
		},
		default: '',
		placeholder: '0.1',
		description: 'Amount to bridge (in token units)',
	},
	// Retryable Ticket fields
	{
		displayName: 'Ticket ID',
		name: 'ticketId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['getRetryableTicketStatus', 'redeemRetryableTicket'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The retryable ticket ID',
	},
	// Challenge Period fields
	{
		displayName: 'Withdrawal Transaction Hash',
		name: 'withdrawalTxHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['bridge'],
				operation: ['getChallengePeriodStatus', 'getOutboxEntry'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The L2 withdrawal transaction hash',
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
				resource: ['bridge'],
				operation: ['redeemRetryableTicket'],
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
	const network = credentials.network as string;

	let result: IDataObject = {};

	if (operation === 'getDepositStatus') {
		const transactionHash = this.getNodeParameter('transactionHash', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const statusResults = await getL1ToL2MessageStatus(transactionHash, l1Provider, provider);
			const firstResult = statusResults[0];
			const status = firstResult?.statusName || 'UNKNOWN';

			result = {
				transactionHash,
				status,
				statusName: status,
				tickets: statusResults,
				isComplete: status === 'REDEEMED',
				isPending: status === 'FUNDS_DEPOSITED_ON_L2',
				description: status === 'REDEEMED' ? 'Message successfully redeemed on L2' :
					status === 'FUNDS_DEPOSITED_ON_L2' ? 'Funds deposited, awaiting redemption' :
					status === 'EXPIRED' ? 'Retryable ticket expired' : 'Unknown status',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get deposit status: ${error}`);
		}
	}

	if (operation === 'getWithdrawalStatus') {
		const transactionHash = this.getNodeParameter('transactionHash', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const statusResults = await getL2ToL1MessageStatus(transactionHash, provider, l1Provider);
			const firstResult = statusResults[0];
			const status = firstResult?.statusName || 'UNKNOWN';

			result = {
				transactionHash,
				status,
				statusName: status,
				withdrawals: statusResults,
				isComplete: status === 'EXECUTED',
				isReadyToExecute: status === 'CONFIRMED',
				isPending: status === 'UNCONFIRMED',
				description: status === 'EXECUTED' ? 'Withdrawal executed on L1' :
					status === 'CONFIRMED' ? 'Ready to execute on L1' :
					status === 'UNCONFIRMED' ? 'Waiting for challenge period' : 'Unknown status',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get withdrawal status: ${error}`);
		}
	}

	if (operation === 'getPendingDeposits') {
		const address = this.getNodeParameter('address', index) as string;

		if (!validateAddress(address)) {
			throw new NodeOperationError(this.getNode(), 'Invalid address');
		}

		// Query L1 inbox for pending deposits
		const contracts = BRIDGE_CONTRACTS[network] || BRIDGE_CONTRACTS.arbitrumOne;
		const inboxAbi = ['event InboxMessageDelivered(uint256 indexed messageNum, bytes data)'];
		const inbox = new ethers.Contract(contracts.l1.inbox, inboxAbi, provider);

		// Get recent deposit events (last 1000 blocks)
		const currentBlock = await provider.getBlockNumber();
		const fromBlock = Math.max(0, currentBlock - 1000);

		const filter = inbox.filters.InboxMessageDelivered();
		const events = await inbox.queryFilter(filter, fromBlock, currentBlock);

		// Filter events for the address (simplified - in production would need more sophisticated parsing)
		const pendingDeposits = events.map(event => ({
			messageNum: (event as any).args?.[0]?.toString(),
			blockNumber: event.blockNumber,
			transactionHash: event.transactionHash,
		}));

		result = {
			address,
			pendingDeposits,
			count: pendingDeposits.length,
			blockRange: {
				from: fromBlock,
				to: currentBlock,
			},
			network,
		};
	}

	if (operation === 'getPendingWithdrawals') {
		const address = this.getNodeParameter('address', index) as string;

		if (!validateAddress(address)) {
			throw new NodeOperationError(this.getNode(), 'Invalid address');
		}

		// Query L2 for withdrawals to this address
		const arbSysAbi = ['event L2ToL1Tx(address caller, address indexed destination, uint256 indexed hash, uint256 indexed position, uint256 arbBlockNum, uint256 ethBlockNum, uint256 timestamp, uint256 callvalue, bytes data)'];
		const arbSys = new ethers.Contract('0x0000000000000000000000000000000000000064', arbSysAbi, provider);

		const currentBlock = await provider.getBlockNumber();
		const fromBlock = Math.max(0, currentBlock - 10000);

		const filter = arbSys.filters.L2ToL1Tx(null, address);
		const events = await arbSys.queryFilter(filter, fromBlock, currentBlock);

		const pendingWithdrawals = events.map(event => {
			const args = (event as any).args || {};
			return {
				caller: args.caller,
				destination: args.destination,
				hash: args.hash?.toString(),
				position: args.position?.toString(),
				arbBlockNum: args.arbBlockNum?.toString(),
				ethBlockNum: args.ethBlockNum?.toString(),
				timestamp: args.timestamp?.toString(),
				value: args.callvalue?.toString(),
				blockNumber: event.blockNumber,
				transactionHash: event.transactionHash,
			};
		});

		result = {
			address,
			pendingWithdrawals,
			count: pendingWithdrawals.length,
			blockRange: {
				from: fromBlock,
				to: currentBlock,
			},
			network,
		};
	}

	if (operation === 'estimateDepositGas') {
		const tokenType = this.getNodeParameter('tokenType', index) as string;
		const amount = this.getNodeParameter('amount', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const networkConfig = NETWORK_CONFIGS[network] || NETWORK_CONFIGS.arbitrumOne;

			if (tokenType === 'eth') {
				const ethBridger = await createEthBridger(provider);
				const amountWei = ethers.parseEther(amount);

				// Estimate gas for ETH deposit
				const l1GasLimit = 100000n; // Typical L1 gas for ETH deposit
				const l1GasPrice = (await l1Provider.getFeeData()).gasPrice || 0n;
				const l2GasLimit = 300000n; // Typical L2 gas for ETH deposit
				const l2GasPrice = (await provider.getFeeData()).gasPrice || 0n;

				const l1Cost = l1GasLimit * l1GasPrice;
				const l2Cost = l2GasLimit * l2GasPrice;
				const totalCost = l1Cost + l2Cost;

				result = {
					tokenType: 'ETH',
					amount,
					amountWei: amountWei.toString(),
					l1GasLimit: l1GasLimit.toString(),
					l1GasPrice: l1GasPrice.toString(),
					l1Cost: ethers.formatEther(l1Cost),
					l2GasLimit: l2GasLimit.toString(),
					l2GasPrice: l2GasPrice.toString(),
					l2Cost: ethers.formatEther(l2Cost),
					totalCost: ethers.formatEther(totalCost),
					totalCostWei: totalCost.toString(),
				};
			} else {
				const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
				if (!validateAddress(tokenAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid token address');
				}

				const erc20Bridger = await createErc20Bridger(provider);

				// Get token decimals
				const tokenContract = new ethers.Contract(
					tokenAddress,
					['function decimals() view returns (uint8)'],
					l1Provider,
				);
				const decimals = await tokenContract.decimals();
				const amountWei = ethers.parseUnits(amount, decimals);

				// Estimate gas for ERC20 deposit (approval + deposit)
				const approvalGas = 50000n;
				const depositGas = 150000n;
				const l1GasLimit = approvalGas + depositGas;
				const l1GasPrice = (await l1Provider.getFeeData()).gasPrice || 0n;
				const l2GasLimit = 500000n; // ERC20 deposits need more L2 gas
				const l2GasPrice = (await provider.getFeeData()).gasPrice || 0n;

				const l1Cost = l1GasLimit * l1GasPrice;
				const l2Cost = l2GasLimit * l2GasPrice;
				const totalCost = l1Cost + l2Cost;

				result = {
					tokenType: 'ERC20',
					tokenAddress,
					amount,
					amountWei: amountWei.toString(),
					l1GasLimit: l1GasLimit.toString(),
					l1GasPrice: l1GasPrice.toString(),
					l1Cost: ethers.formatEther(l1Cost),
					l2GasLimit: l2GasLimit.toString(),
					l2GasPrice: l2GasPrice.toString(),
					l2Cost: ethers.formatEther(l2Cost),
					totalCost: ethers.formatEther(totalCost),
					totalCostWei: totalCost.toString(),
					note: 'Includes gas for approval transaction',
				};
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to estimate deposit gas: ${error}`);
		}
	}

	if (operation === 'estimateWithdrawalGas') {
		const tokenType = this.getNodeParameter('tokenType', index) as string;
		const amount = this.getNodeParameter('amount', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const networkConfig = NETWORK_CONFIGS[network] || NETWORK_CONFIGS.arbitrumOne;

			// L2 withdrawal initiation gas
			const l2GasLimit = tokenType === 'eth' ? 100000n : 200000n;
			const l2GasPrice = (await provider.getFeeData()).gasPrice || 0n;
			const l2Cost = l2GasLimit * l2GasPrice;

			// L1 execution gas (after challenge period)
			const l1GasLimit = 200000n;
			const l1GasPrice = (await l1Provider.getFeeData()).gasPrice || 0n;
			const l1Cost = l1GasLimit * l1GasPrice;

			const totalCost = l1Cost + l2Cost;

			const challengePeriod = networkConfig.challengePeriod || 604800; // 7 days in seconds

			result = {
				tokenType: tokenType === 'eth' ? 'ETH' : 'ERC20',
				amount,
				l2InitiationGas: l2GasLimit.toString(),
				l2GasPrice: l2GasPrice.toString(),
				l2Cost: ethers.formatEther(l2Cost),
				l1ExecutionGas: l1GasLimit.toString(),
				l1GasPrice: l1GasPrice.toString(),
				l1Cost: ethers.formatEther(l1Cost),
				totalCost: ethers.formatEther(totalCost),
				challengePeriodSeconds: challengePeriod,
				challengePeriodDays: Math.floor(challengePeriod / 86400),
				note: 'L1 execution happens after challenge period',
			};

			if (tokenType === 'erc20') {
				const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
				result.tokenAddress = tokenAddress;
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to estimate withdrawal gas: ${error}`);
		}
	}

	if (operation === 'getRetryableTicketStatus') {
		const ticketId = this.getNodeParameter('ticketId', index) as string;

		try {
			const arbRetryableTx = new ethers.Contract(
				'0x000000000000000000000000000000000000006E',
				[
					'function getLifetime() view returns (uint256)',
					'function getTimeout(bytes32 ticketId) view returns (uint256)',
					'function getBeneficiary(bytes32 ticketId) view returns (address)',
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
			const isExpired = timeoutNumber > 0 && currentTimestamp > timeoutNumber;
			const isRedeemed = timeoutNumber === 0;

			result = {
				ticketId,
				lifetime: lifetime.toString(),
				timeout: timeout.toString(),
				timeoutDate: timeoutNumber > 0 ? new Date(timeoutNumber * 1000).toISOString() : null,
				beneficiary,
				isExpired,
				isRedeemed,
				status: isRedeemed ? 'REDEEMED' : isExpired ? 'EXPIRED' : 'PENDING',
				timeRemaining: !isExpired && !isRedeemed ? timeoutNumber - currentTimestamp : 0,
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get ticket status: ${error}`);
		}
	}

	if (operation === 'redeemRetryableTicket') {
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

			const tx = await arbRetryableTx.redeem(ticketId);

			if (options.waitForConfirmation !== false) {
				const confirmations = (options.confirmations as number) || 1;
				const receipt = await tx.wait(confirmations);

				result = {
					ticketId,
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					redeemed: true,
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

	if (operation === 'getBridgeTokenMapping') {
		const tokenType = this.getNodeParameter('tokenType', index) as string;

		if (tokenType === 'eth') {
			result = {
				tokenType: 'ETH',
				l1Address: 'native',
				l2Address: 'native',
				note: 'ETH is native on both L1 and L2',
			};
		} else {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;
			const tokenAddressLayer = this.getNodeParameter('tokenAddressLayer', index) as string;

			if (!validateAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid token address');
			}

			try {
				const { provider: l1Provider } = await createL1Provider(credentials);

				if (tokenAddressLayer === 'l1') {
					const l2Address = await getL2TokenAddress(tokenAddress, provider);
					result = {
						l1Address: tokenAddress,
						l2Address,
						note: l2Address === ethers.ZeroAddress ? 'Token not bridged to L2 yet' : 'Token mapping found',
					};
				} else {
					const l1Address = await getL1TokenAddress(tokenAddress, provider);
					result = {
						l1Address,
						l2Address: tokenAddress,
						note: l1Address === ethers.ZeroAddress ? 'Could not find L1 token address' : 'Token mapping found',
					};
				}
			} catch (error) {
				throw new NodeOperationError(this.getNode(), `Failed to get token mapping: ${error}`);
			}
		}
	}

	if (operation === 'getL1GatewayAddress') {
		const tokenType = this.getNodeParameter('tokenType', index) as string;
		const contracts = BRIDGE_CONTRACTS[network] || BRIDGE_CONTRACTS.arbitrumOne;

		if (tokenType === 'eth') {
			result = {
				tokenType: 'ETH',
				l1Gateway: contracts.l1.inbox,
				note: 'ETH uses the Inbox contract for deposits',
			};
		} else {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			if (!validateAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid token address');
			}

			try {
				const { provider: l1Provider } = await createL1Provider(credentials);
				const gatewayRouter = new ethers.Contract(
					contracts.l1.gatewayRouter,
					['function getGateway(address token) view returns (address)'],
					l1Provider,
				);

				const gateway = await gatewayRouter.getGateway(tokenAddress);

				result = {
					tokenType: 'ERC20',
					tokenAddress,
					l1Gateway: gateway,
					l1GatewayRouter: contracts.l1.gatewayRouter,
					isCustomGateway: gateway !== contracts.l1.erc20Gateway,
				};
			} catch (error) {
				throw new NodeOperationError(this.getNode(), `Failed to get L1 gateway: ${error}`);
			}
		}
	}

	if (operation === 'getL2GatewayAddress') {
		const tokenType = this.getNodeParameter('tokenType', index) as string;
		const contracts = BRIDGE_CONTRACTS[network] || BRIDGE_CONTRACTS.arbitrumOne;

		if (tokenType === 'eth') {
			result = {
				tokenType: 'ETH',
				l2Gateway: '0x0000000000000000000000000000000000000064', // ArbSys
				note: 'ETH uses ArbSys for withdrawals',
			};
		} else {
			const tokenAddress = this.getNodeParameter('tokenAddress', index) as string;

			if (!validateAddress(tokenAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid token address');
			}

			try {
				const gatewayRouter = new ethers.Contract(
					contracts.l2.gatewayRouter,
					['function getGateway(address token) view returns (address)'],
					provider,
				);

				const gateway = await gatewayRouter.getGateway(tokenAddress);

				result = {
					tokenType: 'ERC20',
					tokenAddress,
					l2Gateway: gateway,
					l2GatewayRouter: contracts.l2.gatewayRouter,
					isCustomGateway: gateway !== contracts.l2.erc20Gateway,
				};
			} catch (error) {
				throw new NodeOperationError(this.getNode(), `Failed to get L2 gateway: ${error}`);
			}
		}
	}

	if (operation === 'trackBridgeTransaction') {
		const transactionHash = this.getNodeParameter('transactionHash', index) as string;
		const transactionType = this.getNodeParameter('transactionType', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);

			if (transactionType === 'deposit') {
				// Track L1 to L2 deposit
				const l1Tx = await l1Provider.getTransaction(transactionHash);
				const l1Receipt = l1Tx ? await l1Provider.getTransactionReceipt(transactionHash) : null;

				const statusResults = await getL1ToL2MessageStatus(transactionHash, l1Provider, provider);
				const firstResult = statusResults[0];
				const status = firstResult?.statusName || 'UNKNOWN';

				result = {
					type: 'deposit',
					transactionHash,
					l1TransactionHash: transactionHash,
					l1Confirmed: !!l1Receipt,
					l1BlockNumber: l1Receipt?.blockNumber,
					status,
					statusName: status,
					tickets: statusResults,
					isComplete: status === 'REDEEMED',
					description: getDepositStatusDescription(status),
				};
			} else {
				// Track L2 to L1 withdrawal
				const l2Tx = await provider.getTransaction(transactionHash);
				const l2Receipt = l2Tx ? await provider.getTransactionReceipt(transactionHash) : null;

				const statusResults = await getL2ToL1MessageStatus(transactionHash, provider, l1Provider);
				const firstResult = statusResults[0];
				const status = firstResult?.statusName || 'UNKNOWN';

				const networkConfig = NETWORK_CONFIGS[network] || NETWORK_CONFIGS.arbitrumOne;
				const challengePeriod = (networkConfig as any).challengePeriod || 604800;

				result = {
					type: 'withdrawal',
					transactionHash,
					l2TransactionHash: transactionHash,
					l2Confirmed: !!l2Receipt,
					l2BlockNumber: l2Receipt?.blockNumber,
					status,
					statusName: status,
					withdrawals: statusResults,
					isComplete: status === 'EXECUTED',
					isReadyToExecute: status === 'CONFIRMED',
					challengePeriodSeconds: challengePeriod,
					description: getWithdrawalStatusDescription(status),
				};
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to track transaction: ${error}`);
		}
	}

	if (operation === 'getChallengePeriodStatus') {
		const withdrawalTxHash = this.getNodeParameter('withdrawalTxHash', index) as string;

		try {
			const receipt = await provider.getTransactionReceipt(withdrawalTxHash);
			if (!receipt) {
				throw new NodeOperationError(this.getNode(), 'Transaction not found');
			}

			const block = await provider.getBlock(receipt.blockNumber);
			if (!block) {
				throw new NodeOperationError(this.getNode(), 'Block not found');
			}

			const networkConfig = NETWORK_CONFIGS[network] || NETWORK_CONFIGS.arbitrumOne;
			const challengePeriod = networkConfig.challengePeriod || 604800;

			const withdrawalTimestamp = block.timestamp;
			const challengeEndTimestamp = withdrawalTimestamp + challengePeriod;
			const currentTimestamp = Math.floor(Date.now() / 1000);
			const timeRemaining = Math.max(0, challengeEndTimestamp - currentTimestamp);
			const isComplete = currentTimestamp >= challengeEndTimestamp;

			result = {
				withdrawalTxHash,
				withdrawalBlock: receipt.blockNumber,
				withdrawalTimestamp,
				withdrawalDate: new Date(withdrawalTimestamp * 1000).toISOString(),
				challengePeriodSeconds: challengePeriod,
				challengePeriodDays: Math.floor(challengePeriod / 86400),
				challengeEndTimestamp,
				challengeEndDate: new Date(challengeEndTimestamp * 1000).toISOString(),
				currentTimestamp,
				timeRemainingSeconds: timeRemaining,
				timeRemainingHours: Math.floor(timeRemaining / 3600),
				timeRemainingDays: Math.floor(timeRemaining / 86400),
				isChallengePeriodComplete: isComplete,
				canExecute: isComplete,
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get challenge period status: ${error}`);
		}
	}

	if (operation === 'getOutboxEntry') {
		const withdrawalTxHash = this.getNodeParameter('withdrawalTxHash', index) as string;

		try {
			const receipt = await provider.getTransactionReceipt(withdrawalTxHash);
			if (!receipt) {
				throw new NodeOperationError(this.getNode(), 'Transaction not found');
			}

			// Parse L2ToL1Tx event from ArbSys
			const arbSysInterface = new ethers.Interface([
				'event L2ToL1Tx(address caller, address indexed destination, uint256 indexed hash, uint256 indexed position, uint256 arbBlockNum, uint256 ethBlockNum, uint256 timestamp, uint256 callvalue, bytes data)',
			]);

			let l2ToL1Event = null;
			for (const log of receipt.logs) {
				try {
					if (log.address.toLowerCase() === '0x0000000000000000000000000000000000000064') {
						const parsed = arbSysInterface.parseLog({ topics: log.topics as string[], data: log.data });
						if (parsed?.name === 'L2ToL1Tx') {
							l2ToL1Event = parsed;
							break;
						}
					}
				} catch {
					continue;
				}
			}

			if (!l2ToL1Event) {
				throw new NodeOperationError(this.getNode(), 'No L2ToL1Tx event found in transaction');
			}

			result = {
				withdrawalTxHash,
				caller: l2ToL1Event.args.caller,
				destination: l2ToL1Event.args.destination,
				hash: l2ToL1Event.args.hash.toString(),
				position: l2ToL1Event.args.position.toString(),
				arbBlockNum: l2ToL1Event.args.arbBlockNum.toString(),
				ethBlockNum: l2ToL1Event.args.ethBlockNum.toString(),
				timestamp: l2ToL1Event.args.timestamp.toString(),
				timestampDate: new Date(Number(l2ToL1Event.args.timestamp) * 1000).toISOString(),
				value: l2ToL1Event.args.callvalue.toString(),
				valueEther: ethers.formatEther(l2ToL1Event.args.callvalue),
				data: l2ToL1Event.args.data,
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get outbox entry: ${error}`);
		}
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}

// Helper functions
function getDepositStatusDescription(status: string): string {
	switch (status) {
		case 'NOT_YET_CREATED':
			return 'Deposit transaction not yet confirmed on L1';
		case 'CREATION_FAILED':
			return 'Deposit creation failed';
		case 'FUNDS_DEPOSITED_ON_L2':
			return 'Funds deposited on L2, waiting for retryable ticket redemption';
		case 'REDEEMED':
			return 'Deposit complete - retryable ticket redeemed successfully';
		case 'EXPIRED':
			return 'Retryable ticket expired without redemption';
		default:
			return 'Unknown status';
	}
}

function getWithdrawalStatusDescription(status: string): string {
	switch (status) {
		case 'UNCONFIRMED':
			return 'Withdrawal initiated on L2, waiting for challenge period';
		case 'CONFIRMED':
			return 'Challenge period complete, ready to execute on L1';
		case 'EXECUTED':
			return 'Withdrawal complete - executed on L1';
		default:
			return 'Unknown status';
	}
}

export const bridge = { operations, fields, execute };
