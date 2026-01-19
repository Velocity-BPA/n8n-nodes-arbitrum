import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import { createProvider, createL1Provider, validateAddress } from '../../transport/provider';
import { getL2ToL1MessageStatus } from '../../transport/arbitrumSdk';
import { BRIDGE_CONTRACTS, L2_TO_L1_MESSAGE_STATUS } from '../../constants/bridges';
import { NETWORK_CONFIGS } from '../../constants/networks';

// L2 to L1 resource operations
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['l2tol1'],
			},
		},
		options: [
			{
				name: 'Send L2 to L1 Transaction',
				value: 'sendL2ToL1Tx',
				description: 'Send a transaction from L2 to L1',
				action: 'Send L2 to L1 transaction',
			},
			{
				name: 'Get Outbox Proof',
				value: 'getOutboxProof',
				description: 'Get proof for executing L2 to L1 message',
				action: 'Get outbox proof',
			},
			{
				name: 'Execute Outbox Message',
				value: 'executeOutboxMessage',
				description: 'Execute an L2 to L1 message on L1',
				action: 'Execute outbox message',
			},
			{
				name: 'Get Message Status',
				value: 'getMessageStatus',
				description: 'Get status of L2 to L1 message',
				action: 'Get L2 to L1 message status',
			},
			{
				name: 'Get Challenge Period End',
				value: 'getChallengePeriodEnd',
				description: 'Get when challenge period ends for a withdrawal',
				action: 'Get challenge period end',
			},
			{
				name: 'Get Batch Number',
				value: 'getBatchNumber',
				description: 'Get the batch number for a transaction',
				action: 'Get batch number',
			},
			{
				name: 'Get L1 Confirmation Status',
				value: 'getL1ConfirmationStatus',
				description: 'Check if message is confirmed on L1',
				action: 'Get L1 confirmation status',
			},
		],
		default: 'getMessageStatus',
	},
];

// L2 to L1 resource fields
export const fields: INodeProperties[] = [
	// Send L2 to L1 Transaction fields
	{
		displayName: 'Destination Address',
		name: 'destAddress',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['l2tol1'],
				operation: ['sendL2ToL1Tx'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The destination address on L1',
	},
	{
		displayName: 'Call Data',
		name: 'callData',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['l2tol1'],
				operation: ['sendL2ToL1Tx'],
			},
		},
		default: '0x',
		placeholder: '0x...',
		description: 'The calldata for the L1 transaction',
	},
	{
		displayName: 'ETH Value',
		name: 'value',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['l2tol1'],
				operation: ['sendL2ToL1Tx'],
			},
		},
		default: '0',
		description: 'ETH value to send (in ETH)',
	},
	// Transaction hash field
	{
		displayName: 'L2 Transaction Hash',
		name: 'l2TxHash',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['l2tol1'],
				operation: ['getOutboxProof', 'getMessageStatus', 'getChallengePeriodEnd', 'getBatchNumber', 'getL1ConfirmationStatus'],
			},
		},
		default: '',
		placeholder: '0x...',
		description: 'The L2 transaction hash that initiated the withdrawal',
	},
	// Execute Outbox Message fields
	{
		displayName: 'Message Index',
		name: 'messageIndex',
		type: 'number',
		required: true,
		displayOptions: {
			show: {
				resource: ['l2tol1'],
				operation: ['executeOutboxMessage'],
			},
		},
		default: 0,
		description: 'The index of the message in the outbox',
	},
	{
		displayName: 'Proof Data',
		name: 'proofData',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['l2tol1'],
				operation: ['executeOutboxMessage'],
			},
		},
		default: '',
		placeholder: '{"proof": [...], "leaf": ..., "index": ...}',
		description: 'The proof data from getOutboxProof (JSON format)',
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
				resource: ['l2tol1'],
				operation: ['sendL2ToL1Tx', 'executeOutboxMessage'],
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
				displayName: 'Gas Limit',
				name: 'gasLimit',
				type: 'number',
				default: 0,
				description: 'Gas limit override (0 for auto)',
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

	if (operation === 'sendL2ToL1Tx') {
		const destAddress = this.getNodeParameter('destAddress', index) as string;
		const callData = this.getNodeParameter('callData', index, '0x') as string;
		const value = this.getNodeParameter('value', index, '0') as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!validateAddress(destAddress)) {
			throw new NodeOperationError(this.getNode(), 'Invalid destination address');
		}

		if (!credentials.privateKey) {
			throw new NodeOperationError(this.getNode(), 'Private key required for sending transactions');
		}

		try {
			const wallet = new ethers.Wallet(credentials.privateKey as string, provider);
			
			// Use ArbSys precompile for L2 to L1 messaging
			const arbSys = new ethers.Contract(
				'0x0000000000000000000000000000000000000064',
				[
					'function sendTxToL1(address destination, bytes calldata data) payable returns (uint256)',
				],
				wallet,
			);

			const valueWei = ethers.parseEther(value);
			const txOptions: Record<string, any> = { value: valueWei };
			
			if (options.gasLimit && (options.gasLimit as number) > 0) {
				txOptions.gasLimit = options.gasLimit;
			}

			const tx = await arbSys.sendTxToL1(destAddress, callData, txOptions);

			if (options.waitForConfirmation !== false) {
				const confirmations = (options.confirmations as number) || 1;
				const receipt = await tx.wait(confirmations);

				// Parse the L2ToL1Tx event
				const arbSysInterface = new ethers.Interface([
					'event L2ToL1Tx(address caller, address indexed destination, uint256 indexed hash, uint256 indexed position, uint256 arbBlockNum, uint256 ethBlockNum, uint256 timestamp, uint256 callvalue, bytes data)',
				]);

				let l2ToL1Event = null;
				for (const log of receipt.logs) {
					try {
						const parsed = arbSysInterface.parseLog({ topics: log.topics as string[], data: log.data });
						if (parsed?.name === 'L2ToL1Tx') {
							l2ToL1Event = parsed;
							break;
						}
					} catch {
						continue;
					}
				}

				const networkConfig = NETWORK_CONFIGS[network] || NETWORK_CONFIGS.arbitrumOne;
				const challengePeriod = networkConfig.challengePeriod || 604800;
				const challengeEndTime = Math.floor(Date.now() / 1000) + challengePeriod;

				result = {
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					destination: destAddress,
					value,
					valueWei: valueWei.toString(),
					messagePosition: l2ToL1Event?.args?.position?.toString(),
					messageHash: l2ToL1Event?.args?.hash?.toString(),
					challengePeriodSeconds: challengePeriod,
					challengePeriodDays: Math.floor(challengePeriod / 86400),
					estimatedExecutableTime: new Date(challengeEndTime * 1000).toISOString(),
					note: `Wait ${Math.floor(challengePeriod / 86400)} days before executing on L1`,
				};
			} else {
				result = {
					transactionHash: tx.hash,
					status: 'PENDING',
					destination: destAddress,
					value,
				};
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to send L2 to L1 transaction: ${error}`);
		}
	}

	if (operation === 'getOutboxProof') {
		const l2TxHash = this.getNodeParameter('l2TxHash', index) as string;

		try {
			// Get the L2 transaction receipt
			const receipt = await provider.getTransactionReceipt(l2TxHash);
			if (!receipt) {
				throw new NodeOperationError(this.getNode(), 'Transaction not found');
			}

			// Parse L2ToL1Tx event
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

			// Get the NodeInterface to retrieve proof
			const nodeInterface = new ethers.Contract(
				'0x00000000000000000000000000000000000000C8',
				[
					'function constructOutboxProof(uint64 size, uint64 leaf) view returns (bytes32 send, bytes32 root, bytes32[] memory proof)',
				],
				provider,
			);

			const position = l2ToL1Event.args.position;

			// Note: Getting the actual proof requires knowing the send count
			// This is a simplified version - in production, you'd use the Arbitrum SDK

			result = {
				l2TxHash,
				l2BlockNumber: receipt.blockNumber,
				caller: l2ToL1Event.args.caller,
				destination: l2ToL1Event.args.destination,
				hash: l2ToL1Event.args.hash.toString(),
				position: position.toString(),
				arbBlockNum: l2ToL1Event.args.arbBlockNum.toString(),
				ethBlockNum: l2ToL1Event.args.ethBlockNum.toString(),
				timestamp: l2ToL1Event.args.timestamp.toString(),
				timestampDate: new Date(Number(l2ToL1Event.args.timestamp) * 1000).toISOString(),
				value: l2ToL1Event.args.callvalue.toString(),
				valueEther: ethers.formatEther(l2ToL1Event.args.callvalue),
				data: l2ToL1Event.args.data,
				note: 'Use Arbitrum SDK getOutboxProof() for complete proof generation',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get outbox proof: ${error}`);
		}
	}

	if (operation === 'executeOutboxMessage') {
		const messageIndex = this.getNodeParameter('messageIndex', index) as number;
		const proofDataStr = this.getNodeParameter('proofData', index) as string;
		const options = this.getNodeParameter('options', index, {}) as IDataObject;

		if (!credentials.privateKey) {
			throw new NodeOperationError(this.getNode(), 'Private key required for executing outbox messages');
		}

		let proofData: IDataObject;
		try {
			proofData = JSON.parse(proofDataStr);
		} catch {
			throw new NodeOperationError(this.getNode(), 'Invalid proof data JSON');
		}

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const wallet = new ethers.Wallet(credentials.privateKey as string, l1Provider);
			const contracts = BRIDGE_CONTRACTS[network] || BRIDGE_CONTRACTS.arbitrumOne;

			const outbox = new ethers.Contract(
				contracts.l1.outbox,
				[
					'function executeTransaction(bytes32[] calldata proof, uint256 index, address l2Sender, address to, uint256 l2Block, uint256 l1Block, uint256 l2Timestamp, uint256 value, bytes calldata data) external',
				],
				wallet,
			);

			const txOptions: IDataObject = {};
			if (options.gasLimit && (options.gasLimit as number) > 0) {
				txOptions.gasLimit = options.gasLimit;
			}

			const tx = await outbox.executeTransaction(
				proofData.proof,
				proofData.index || messageIndex,
				proofData.l2Sender,
				proofData.to,
				proofData.l2Block,
				proofData.l1Block,
				proofData.l2Timestamp,
				proofData.value,
				proofData.data,
				txOptions,
			);

			if (options.waitForConfirmation !== false) {
				const confirmations = (options.confirmations as number) || 1;
				const receipt = await tx.wait(confirmations);

				result = {
					transactionHash: receipt.hash,
					blockNumber: receipt.blockNumber,
					gasUsed: receipt.gasUsed.toString(),
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					executed: receipt.status === 1,
					messageIndex,
					l1Network: 'Ethereum',
				};
			} else {
				result = {
					transactionHash: tx.hash,
					status: 'PENDING',
					messageIndex,
				};
			}
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to execute outbox message: ${error}`);
		}
	}

	if (operation === 'getMessageStatus') {
		const l2TxHash = this.getNodeParameter('l2TxHash', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const statusResults = await getL2ToL1MessageStatus(l2TxHash, provider, l1Provider);
			const firstResult = statusResults[0];
			const status = firstResult?.statusName || 'UNKNOWN';

			result = {
				l2TxHash,
				status,
				statusName: status,
				withdrawals: statusResults,
				isUnconfirmed: status === 'UNCONFIRMED',
				isConfirmed: status === 'CONFIRMED',
				isExecuted: status === 'EXECUTED',
				canExecute: status === 'CONFIRMED',
				description: status === 'EXECUTED' ? 'Withdrawal executed on L1' :
					status === 'CONFIRMED' ? 'Ready to execute on L1' :
					status === 'UNCONFIRMED' ? 'Waiting for challenge period' : 'Unknown status',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get message status: ${error}`);
		}
	}

	if (operation === 'getChallengePeriodEnd') {
		const l2TxHash = this.getNodeParameter('l2TxHash', index) as string;

		try {
			const receipt = await provider.getTransactionReceipt(l2TxHash);
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
				l2TxHash,
				l2BlockNumber: receipt.blockNumber,
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
				canExecuteOnL1: isComplete,
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get challenge period end: ${error}`);
		}
	}

	if (operation === 'getBatchNumber') {
		const l2TxHash = this.getNodeParameter('l2TxHash', index) as string;

		try {
			const receipt = await provider.getTransactionReceipt(l2TxHash);
			if (!receipt) {
				throw new NodeOperationError(this.getNode(), 'Transaction not found');
			}

			// Get the NodeInterface to query batch info
			const nodeInterface = new ethers.Contract(
				'0x00000000000000000000000000000000000000C8',
				[
					'function findBatchContainingBlock(uint64 blockNum) view returns (uint64 batch)',
				],
				provider,
			);

			let batchNumber: string;
			try {
				const batch = await nodeInterface.findBatchContainingBlock(receipt.blockNumber);
				batchNumber = batch.toString();
			} catch {
				batchNumber = 'Not yet batched';
			}

			result = {
				l2TxHash,
				l2BlockNumber: receipt.blockNumber,
				batchNumber,
				isBatched: batchNumber !== 'Not yet batched',
				note: batchNumber === 'Not yet batched' 
					? 'Transaction not yet included in a batch - batches are created periodically'
					: 'Transaction has been included in a sequencer batch',
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get batch number: ${error}`);
		}
	}

	if (operation === 'getL1ConfirmationStatus') {
		const l2TxHash = this.getNodeParameter('l2TxHash', index) as string;

		try {
			const { provider: l1Provider } = await createL1Provider(credentials);
			const receipt = await provider.getTransactionReceipt(l2TxHash);
			
			if (!receipt) {
				throw new NodeOperationError(this.getNode(), 'Transaction not found');
			}

			// Check message status
			const statusResults = await getL2ToL1MessageStatus(l2TxHash, provider, l1Provider);
			const firstResult = statusResults[0];
			const status = firstResult?.statusName || 'UNKNOWN';

			// Get L1 block info for context
			const l1BlockNumber = await l1Provider.getBlockNumber();
			const l1Block = await l1Provider.getBlock(l1BlockNumber);

			const isConfirmed = status === 'CONFIRMED' || status === 'EXECUTED';

			result = {
				l2TxHash,
				l2BlockNumber: receipt.blockNumber,
				isConfirmedOnL1: isConfirmed,
				isExecutedOnL1: status === 'EXECUTED',
				status,
				statusName: status,
				withdrawals: statusResults,
				currentL1BlockNumber: l1BlockNumber,
				currentL1BlockTimestamp: l1Block?.timestamp,
				currentL1BlockDate: l1Block ? new Date(Number(l1Block.timestamp) * 1000).toISOString() : null,
			};
		} catch (error) {
			throw new NodeOperationError(this.getNode(), `Failed to get L1 confirmation status: ${error}`);
		}
	}

	return [
		{
			json: result,
			pairedItem: { item: index },
		},
	];
}

// Helper function
function getMessageStatusDescription(status: string): string {
	switch (status) {
		case 'UNCONFIRMED':
			return 'Message initiated on L2, waiting for challenge period to complete';
		case 'CONFIRMED':
			return 'Challenge period complete, message ready to be executed on L1';
		case 'EXECUTED':
			return 'Message has been successfully executed on L1';
		default:
			return 'Unknown status';
	}
}

export const l2tol1 = { operations, fields, execute };
