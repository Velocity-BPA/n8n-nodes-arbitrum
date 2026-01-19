import type {
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { ethers } from 'ethers';

import { NETWORK_CONFIGS, ABIS } from './constants';

export class ArbitrumTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Arbitrum Trigger',
		name: 'arbitrumTrigger',
		icon: 'file:arbitrum.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger workflows on Arbitrum blockchain events',
		defaults: {
			name: 'Arbitrum Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'arbitrumRpc',
				required: true,
			},
			{
				name: 'arbiscan',
				required: false,
			},
		],
		polling: true,
		properties: [
			// Event Type Selection
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Block',
						value: 'newBlock',
						description: 'Trigger on new blocks',
					},
					{
						name: 'Address Activity',
						value: 'addressActivity',
						description: 'Trigger on any activity for an address',
					},
					{
						name: 'Token Transfer (ERC-20)',
						value: 'tokenTransfer',
						description: 'Trigger on ERC-20 token transfers',
					},
					{
						name: 'NFT Transfer',
						value: 'nftTransfer',
						description: 'Trigger on NFT transfers (ERC-721/ERC-1155)',
					},
					{
						name: 'Contract Event',
						value: 'contractEvent',
						description: 'Trigger on specific contract events',
					},
					{
						name: 'ETH Balance Change',
						value: 'balanceChange',
						description: 'Trigger when ETH balance changes',
					},
					{
						name: 'Token Balance Change',
						value: 'tokenBalanceChange',
						description: 'Trigger when token balance changes',
					},
					{
						name: 'Large Transaction Alert',
						value: 'largeTransaction',
						description: 'Trigger on large value transactions',
					},
					{
						name: 'Bridge Deposit Initiated',
						value: 'bridgeDepositInitiated',
						description: 'Trigger when a deposit is initiated (L1 to L2)',
					},
					{
						name: 'Bridge Deposit Completed',
						value: 'bridgeDepositCompleted',
						description: 'Trigger when a deposit is completed on L2',
					},
					{
						name: 'Bridge Withdrawal Initiated',
						value: 'bridgeWithdrawalInitiated',
						description: 'Trigger when a withdrawal is initiated (L2 to L1)',
					},
					{
						name: 'Bridge Withdrawal Ready',
						value: 'bridgeWithdrawalReady',
						description: 'Trigger when a withdrawal can be executed',
					},
					{
						name: 'Price Alert',
						value: 'priceAlert',
						description: 'Trigger on token price changes',
					},
					{
						name: 'Large Swap',
						value: 'largeSwap',
						description: 'Trigger on large DEX swaps',
					},
				],
				default: 'newBlock',
			},

			// Address Field (for address-specific triggers)
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				required: true,
				default: '',
				placeholder: '0x...',
				description: 'The address to monitor',
				displayOptions: {
					show: {
						event: [
							'addressActivity',
							'balanceChange',
							'tokenBalanceChange',
							'bridgeDepositInitiated',
							'bridgeDepositCompleted',
							'bridgeWithdrawalInitiated',
							'bridgeWithdrawalReady',
						],
					},
				},
			},

			// Token Address (for token-specific triggers)
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				placeholder: '0x... (leave empty for all tokens)',
				description: 'Filter by specific token address',
				displayOptions: {
					show: {
						event: ['tokenTransfer', 'tokenBalanceChange', 'priceAlert'],
					},
				},
			},

			// Contract Address (for contract events)
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				required: true,
				default: '',
				placeholder: '0x...',
				description: 'The contract address to monitor',
				displayOptions: {
					show: {
						event: ['contractEvent', 'largeSwap'],
					},
				},
			},

			// Event Name (for contract events)
			{
				displayName: 'Event Name',
				name: 'eventName',
				type: 'string',
				default: '',
				placeholder: 'Transfer, Swap, etc.',
				description: 'Name of the event to listen for (leave empty for all events)',
				displayOptions: {
					show: {
						event: ['contractEvent'],
					},
				},
			},

			// ABI (for contract events)
			{
				displayName: 'ABI',
				name: 'abi',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				placeholder: '[{"name": "Transfer", "type": "event", ...}]',
				description: 'Contract ABI for event decoding (JSON format)',
				displayOptions: {
					show: {
						event: ['contractEvent'],
					},
				},
			},

			// NFT Collection (for NFT transfers)
			{
				displayName: 'Collection Address',
				name: 'collectionAddress',
				type: 'string',
				default: '',
				placeholder: '0x... (leave empty for all NFTs)',
				description: 'Filter by specific NFT collection',
				displayOptions: {
					show: {
						event: ['nftTransfer'],
					},
				},
			},

			// Filter Direction (for transfers)
			{
				displayName: 'Filter Direction',
				name: 'filterDirection',
				type: 'options',
				default: 'both',
				options: [
					{ name: 'Both (Send & Receive)', value: 'both' },
					{ name: 'Incoming Only', value: 'incoming' },
					{ name: 'Outgoing Only', value: 'outgoing' },
				],
				description: 'Filter transfers by direction',
				displayOptions: {
					show: {
						event: ['tokenTransfer', 'nftTransfer', 'addressActivity'],
					},
				},
			},

			// Threshold (for large transactions/swaps)
			{
				displayName: 'Threshold (ETH)',
				name: 'threshold',
				type: 'number',
				default: 10,
				description: 'Minimum value in ETH to trigger',
				displayOptions: {
					show: {
						event: ['largeTransaction', 'largeSwap'],
					},
				},
			},

			// Balance Change Threshold
			{
				displayName: 'Change Threshold',
				name: 'changeThreshold',
				type: 'string',
				default: '0.1',
				description: 'Minimum balance change to trigger (in ETH or tokens)',
				displayOptions: {
					show: {
						event: ['balanceChange', 'tokenBalanceChange'],
					},
				},
			},

			// Price Alert Settings
			{
				displayName: 'Price Direction',
				name: 'priceDirection',
				type: 'options',
				default: 'both',
				options: [
					{ name: 'Both', value: 'both' },
					{ name: 'Above Target', value: 'above' },
					{ name: 'Below Target', value: 'below' },
				],
				description: 'Trigger direction for price alerts',
				displayOptions: {
					show: {
						event: ['priceAlert'],
					},
				},
			},
			{
				displayName: 'Target Price (USD)',
				name: 'targetPrice',
				type: 'number',
				default: 0,
				description: 'Target price in USD',
				displayOptions: {
					show: {
						event: ['priceAlert'],
					},
				},
			},

			// DEX Selection (for swap monitoring)
			{
				displayName: 'DEX',
				name: 'dex',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All DEXes', value: 'all' },
					{ name: 'Uniswap V3', value: 'uniswapV3' },
					{ name: 'SushiSwap', value: 'sushiswap' },
					{ name: 'Camelot', value: 'camelot' },
					{ name: 'GMX', value: 'gmx' },
				],
				description: 'DEX to monitor for swaps',
				displayOptions: {
					show: {
						event: ['largeSwap'],
					},
				},
			},

			// Block Confirmations
			{
				displayName: 'Wait for Confirmations',
				name: 'confirmations',
				type: 'number',
				default: 1,
				description: 'Number of block confirmations to wait',
				displayOptions: {
					show: {
						event: [
							'newBlock',
							'addressActivity',
							'tokenTransfer',
							'nftTransfer',
							'contractEvent',
							'largeTransaction',
							'largeSwap',
						],
					},
				},
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const credentials = await this.getCredentials('arbitrumRpc');
		const network = credentials.network as string;
		const networkConfig = NETWORK_CONFIGS[network as keyof typeof NETWORK_CONFIGS] || NETWORK_CONFIGS.arbitrumOne;

		// Create provider
		let rpcUrl: string;
		const rpcProvider = credentials.rpcProvider as string;
		const apiKey = credentials.apiKey as string;

		if (rpcProvider === 'custom') {
			rpcUrl = credentials.customRpcUrl as string;
		} else {
			rpcUrl = networkConfig.rpcUrl;
		}

		const provider = new ethers.JsonRpcProvider(rpcUrl);

		// Get workflow static data for state persistence
		const workflowStaticData = this.getWorkflowStaticData('node');
		const lastBlockKey = 'lastProcessedBlock';
		const lastBalanceKey = 'lastBalance';
		const lastPriceKey = 'lastPrice';

		const returnData: INodeExecutionData[] = [];

		try {
			switch (event) {
				case 'newBlock': {
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						for (let blockNum = lastBlock + 1; blockNum <= currentBlock - confirmations; blockNum++) {
							const block = await provider.getBlock(blockNum);
							if (block) {
								returnData.push({
									json: {
										network: networkConfig.name,
										blockNumber: block.number,
										blockHash: block.hash,
										timestamp: block.timestamp,
										timestampDate: new Date(Number(block.timestamp) * 1000).toISOString(),
										gasLimit: block.gasLimit.toString(),
										gasUsed: block.gasUsed.toString(),
										baseFeePerGas: block.baseFeePerGas?.toString(),
										transactionCount: block.transactions.length,
									},
								});
							}
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'addressActivity': {
					const address = this.getNodeParameter('address') as string;
					const filterDirection = this.getNodeParameter('filterDirection') as string;
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						// Get transactions to/from address
						for (let blockNum = lastBlock + 1; blockNum <= currentBlock - confirmations; blockNum++) {
							const block = await provider.getBlock(blockNum, true);
							if (block && block.prefetchedTransactions) {
								for (const tx of block.prefetchedTransactions) {
									const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
									const isOutgoing = tx.from.toLowerCase() === address.toLowerCase();

									if (
										(filterDirection === 'both' && (isIncoming || isOutgoing)) ||
										(filterDirection === 'incoming' && isIncoming) ||
										(filterDirection === 'outgoing' && isOutgoing)
									) {
										returnData.push({
											json: {
												network: networkConfig.name,
												type: isIncoming ? 'incoming' : 'outgoing',
												transactionHash: tx.hash,
												from: tx.from,
												to: tx.to,
												value: ethers.formatEther(tx.value),
												valueWei: tx.value.toString(),
												blockNumber: tx.blockNumber,
												timestamp: block.timestamp,
											},
										});
									}
								}
							}
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'tokenTransfer': {
					const address = this.getNodeParameter('address', '') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', '') as string;
					const filterDirection = this.getNodeParameter('filterDirection') as string;
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						// Transfer event signature
						const transferTopic = ethers.id('Transfer(address,address,uint256)');
						
						const filter: ethers.Filter = {
							fromBlock: lastBlock + 1,
							toBlock: currentBlock - confirmations,
							topics: [transferTopic],
						};

						if (tokenAddress) {
							filter.address = tokenAddress;
						}

						const logs = await provider.getLogs(filter);

						for (const log of logs) {
							const from = '0x' + log.topics[1].slice(26);
							const to = '0x' + log.topics[2].slice(26);

							// Apply address filter
							if (address) {
								const isIncoming = to.toLowerCase() === address.toLowerCase();
								const isOutgoing = from.toLowerCase() === address.toLowerCase();

								if (
									(filterDirection === 'both' && !(isIncoming || isOutgoing)) ||
									(filterDirection === 'incoming' && !isIncoming) ||
									(filterDirection === 'outgoing' && !isOutgoing)
								) {
									continue;
								}
							}

							// Decode amount
							const amount = BigInt(log.data);

							// Get token info
							let symbol = 'Unknown';
							let decimals = 18;
							try {
								const tokenContract = new ethers.Contract(
									log.address,
									['function symbol() view returns (string)', 'function decimals() view returns (uint8)'],
									provider
								);
								[symbol, decimals] = await Promise.all([
									tokenContract.symbol(),
									tokenContract.decimals(),
								]);
							} catch (e) {
								// Use defaults
							}

							returnData.push({
								json: {
									network: networkConfig.name,
									type: 'ERC20Transfer',
									tokenAddress: log.address,
									tokenSymbol: symbol,
									from,
									to,
									amount: ethers.formatUnits(amount, decimals),
									amountWei: amount.toString(),
									transactionHash: log.transactionHash,
									blockNumber: log.blockNumber,
									logIndex: log.index,
								},
							});
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'nftTransfer': {
					const address = this.getNodeParameter('address', '') as string;
					const collectionAddress = this.getNodeParameter('collectionAddress', '') as string;
					const filterDirection = this.getNodeParameter('filterDirection') as string;
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						// ERC-721 Transfer event
						const erc721TransferTopic = ethers.id('Transfer(address,address,uint256)');
						
						const filter: ethers.Filter = {
							fromBlock: lastBlock + 1,
							toBlock: currentBlock - confirmations,
							topics: [erc721TransferTopic],
						};

						if (collectionAddress) {
							filter.address = collectionAddress;
						}

						const logs = await provider.getLogs(filter);

						for (const log of logs) {
							// ERC-721 has 4 topics (event sig + 3 indexed params)
							if (log.topics.length === 4) {
								const from = '0x' + log.topics[1].slice(26);
								const to = '0x' + log.topics[2].slice(26);
								const tokenId = BigInt(log.topics[3]);

								// Apply address filter
								if (address) {
									const isIncoming = to.toLowerCase() === address.toLowerCase();
									const isOutgoing = from.toLowerCase() === address.toLowerCase();

									if (
										(filterDirection === 'both' && !(isIncoming || isOutgoing)) ||
										(filterDirection === 'incoming' && !isIncoming) ||
										(filterDirection === 'outgoing' && !isOutgoing)
									) {
										continue;
									}
								}

								// Get collection info
								let name = 'Unknown';
								let symbol = 'Unknown';
								try {
									const nftContract = new ethers.Contract(
										log.address,
										['function name() view returns (string)', 'function symbol() view returns (string)'],
										provider
									);
									[name, symbol] = await Promise.all([
										nftContract.name(),
										nftContract.symbol(),
									]);
								} catch (e) {
									// Use defaults
								}

								returnData.push({
									json: {
										network: networkConfig.name,
										type: 'ERC721Transfer',
										collectionAddress: log.address,
										collectionName: name,
										collectionSymbol: symbol,
										from,
										to,
										tokenId: tokenId.toString(),
										transactionHash: log.transactionHash,
										blockNumber: log.blockNumber,
										logIndex: log.index,
									},
								});
							}
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'contractEvent': {
					const contractAddress = this.getNodeParameter('contractAddress') as string;
					const eventName = this.getNodeParameter('eventName', '') as string;
					const abiStr = this.getNodeParameter('abi', '') as string;
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						let iface: ethers.Interface | undefined;
						let eventTopic: string | undefined;

						if (abiStr) {
							try {
								const abi = JSON.parse(abiStr);
								iface = new ethers.Interface(abi);
								if (eventName) {
									eventTopic = iface.getEvent(eventName)?.topicHash;
								}
							} catch (e) {
								// Invalid ABI
							}
						}

						const filter: ethers.Filter = {
							address: contractAddress,
							fromBlock: lastBlock + 1,
							toBlock: currentBlock - confirmations,
						};

						if (eventTopic) {
							filter.topics = [eventTopic];
						}

						const logs = await provider.getLogs(filter);

						for (const log of logs) {
							let decoded: Record<string, unknown> = {};

							if (iface) {
								try {
									const parsed = iface.parseLog({ data: log.data, topics: log.topics as string[] });
									if (parsed) {
										decoded = {
											eventName: parsed.name,
											args: Object.fromEntries(
												parsed.fragment.inputs.map((input, i) => [
													input.name || `arg${i}`,
													typeof parsed.args[i] === 'bigint'
														? parsed.args[i].toString()
														: parsed.args[i],
												])
											),
										};
									}
								} catch (e) {
									// Decoding failed
								}
							}

							returnData.push({
								json: {
									network: networkConfig.name,
									contractAddress: log.address,
									transactionHash: log.transactionHash,
									blockNumber: log.blockNumber,
									logIndex: log.index,
									topics: log.topics,
									data: log.data,
									...decoded,
								},
							});
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'balanceChange': {
					const address = this.getNodeParameter('address') as string;
					const changeThreshold = this.getNodeParameter('changeThreshold') as string;
					const thresholdWei = ethers.parseEther(changeThreshold);

					const currentBalance = await provider.getBalance(address);
					const lastBalance = workflowStaticData[lastBalanceKey]
						? BigInt(workflowStaticData[lastBalanceKey] as string)
						: currentBalance;

					const change = currentBalance - lastBalance;
					const absChange = change < 0 ? -change : change;

					if (absChange >= thresholdWei) {
						returnData.push({
							json: {
								network: networkConfig.name,
								address,
								previousBalance: ethers.formatEther(lastBalance),
								currentBalance: ethers.formatEther(currentBalance),
								change: ethers.formatEther(change),
								changeWei: change.toString(),
								direction: change > 0 ? 'increase' : 'decrease',
								timestamp: new Date().toISOString(),
							},
						});
					}

					workflowStaticData[lastBalanceKey] = currentBalance.toString();
					break;
				}

				case 'tokenBalanceChange': {
					const address = this.getNodeParameter('address') as string;
					const tokenAddress = this.getNodeParameter('tokenAddress') as string;
					const changeThreshold = this.getNodeParameter('changeThreshold') as string;

					if (!tokenAddress) {
						throw new Error('Token address is required for token balance monitoring');
					}

					const tokenContract = new ethers.Contract(
						tokenAddress,
						[
							'function balanceOf(address) view returns (uint256)',
							'function decimals() view returns (uint8)',
							'function symbol() view returns (string)',
						],
						provider
					);

					const [currentBalance, decimals, symbol] = await Promise.all([
						tokenContract.balanceOf(address),
						tokenContract.decimals(),
						tokenContract.symbol(),
					]);

					const thresholdUnits = ethers.parseUnits(changeThreshold, decimals);
					const balanceKey = `${lastBalanceKey}_${tokenAddress}`;
					const lastBalance = workflowStaticData[balanceKey]
						? BigInt(workflowStaticData[balanceKey] as string)
						: currentBalance;

					const change = currentBalance - lastBalance;
					const absChange = change < 0n ? -change : change;

					if (absChange >= thresholdUnits) {
						returnData.push({
							json: {
								network: networkConfig.name,
								address,
								tokenAddress,
								tokenSymbol: symbol,
								previousBalance: ethers.formatUnits(lastBalance, decimals),
								currentBalance: ethers.formatUnits(currentBalance, decimals),
								change: ethers.formatUnits(change, decimals),
								changeWei: change.toString(),
								direction: change > 0n ? 'increase' : 'decrease',
								timestamp: new Date().toISOString(),
							},
						});
					}

					workflowStaticData[balanceKey] = currentBalance.toString();
					break;
				}

				case 'largeTransaction': {
					const threshold = this.getNodeParameter('threshold') as number;
					const thresholdWei = ethers.parseEther(threshold.toString());
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						for (let blockNum = lastBlock + 1; blockNum <= currentBlock - confirmations; blockNum++) {
							const block = await provider.getBlock(blockNum, true);
							if (block && block.prefetchedTransactions) {
								for (const tx of block.prefetchedTransactions) {
									if (tx.value >= thresholdWei) {
										returnData.push({
											json: {
												network: networkConfig.name,
												type: 'largeTransaction',
												transactionHash: tx.hash,
												from: tx.from,
												to: tx.to,
												value: ethers.formatEther(tx.value),
												valueWei: tx.value.toString(),
												threshold: threshold,
												blockNumber: tx.blockNumber,
												timestamp: block.timestamp,
											},
										});
									}
								}
							}
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'priceAlert': {
					const tokenAddress = this.getNodeParameter('tokenAddress') as string;
					const priceDirection = this.getNodeParameter('priceDirection') as string;
					const targetPrice = this.getNodeParameter('targetPrice') as number;

					// Use Chainlink price feeds
					const CHAINLINK_ETH_USD = '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612'; // Arbitrum One
					const feedAddress = tokenAddress || CHAINLINK_ETH_USD;

					const feed = new ethers.Contract(
						feedAddress,
						[
							'function latestRoundData() view returns (uint80, int256, uint256, uint256, uint80)',
							'function decimals() view returns (uint8)',
						],
						provider
					);

					const [roundData, decimals] = await Promise.all([
						feed.latestRoundData(),
						feed.decimals(),
					]);

					const currentPrice = Number(roundData[1]) / Math.pow(10, decimals);
					const lastPrice = workflowStaticData[lastPriceKey] as number;

					let shouldTrigger = false;
					if (priceDirection === 'above' && currentPrice >= targetPrice) {
						shouldTrigger = lastPrice ? lastPrice < targetPrice : true;
					} else if (priceDirection === 'below' && currentPrice <= targetPrice) {
						shouldTrigger = lastPrice ? lastPrice > targetPrice : true;
					} else if (priceDirection === 'both') {
						if (lastPrice) {
							shouldTrigger =
								(lastPrice < targetPrice && currentPrice >= targetPrice) ||
								(lastPrice > targetPrice && currentPrice <= targetPrice);
						}
					}

					if (shouldTrigger) {
						returnData.push({
							json: {
								network: networkConfig.name,
								type: 'priceAlert',
								feedAddress,
								currentPrice,
								targetPrice,
								direction: currentPrice >= targetPrice ? 'above' : 'below',
								previousPrice: lastPrice || null,
								timestamp: new Date().toISOString(),
							},
						});
					}

					workflowStaticData[lastPriceKey] = currentPrice;
					break;
				}

				case 'largeSwap': {
					const contractAddress = this.getNodeParameter('contractAddress', '') as string;
					const dex = this.getNodeParameter('dex') as string;
					const threshold = this.getNodeParameter('threshold') as number;
					const currentBlock = await provider.getBlockNumber();
					const lastBlock = (workflowStaticData[lastBlockKey] as number) || currentBlock - 1;
					const confirmations = this.getNodeParameter('confirmations') as number;

					if (currentBlock > lastBlock + confirmations) {
						// Uniswap V3 Swap event
						const swapTopic = ethers.id('Swap(address,address,int256,int256,uint160,uint128,int24)');

						const filter: ethers.Filter = {
							fromBlock: lastBlock + 1,
							toBlock: currentBlock - confirmations,
							topics: [swapTopic],
						};

						if (contractAddress) {
							filter.address = contractAddress;
						}

						const logs = await provider.getLogs(filter);

						for (const log of logs) {
							try {
								// Decode Uniswap V3 swap
								const iface = new ethers.Interface([
									'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
								]);
								const decoded = iface.parseLog({ data: log.data, topics: log.topics as string[] });

								if (decoded) {
									const amount0 = decoded.args.amount0;
									const amount1 = decoded.args.amount1;

									// Rough ETH value estimation (assuming 18 decimals)
									const absAmount0 = amount0 < 0n ? -amount0 : amount0;
									const absAmount1 = amount1 < 0n ? -amount1 : amount1;
									const maxAmount = absAmount0 > absAmount1 ? absAmount0 : absAmount1;
									const ethValue = Number(ethers.formatEther(maxAmount));

									if (ethValue >= threshold) {
										returnData.push({
											json: {
												network: networkConfig.name,
												type: 'largeSwap',
												poolAddress: log.address,
												sender: decoded.args.sender,
												recipient: decoded.args.recipient,
												amount0: amount0.toString(),
												amount1: amount1.toString(),
												estimatedValue: ethValue,
												threshold,
												transactionHash: log.transactionHash,
												blockNumber: log.blockNumber,
											},
										});
									}
								}
							} catch (e) {
								// Skip non-matching events
							}
						}
						workflowStaticData[lastBlockKey] = currentBlock - confirmations;
					}
					break;
				}

				case 'bridgeDepositInitiated':
				case 'bridgeDepositCompleted':
				case 'bridgeWithdrawalInitiated':
				case 'bridgeWithdrawalReady': {
					// Bridge events require monitoring specific bridge contracts
					// This is a simplified implementation
					const address = this.getNodeParameter('address') as string;
					
					returnData.push({
						json: {
							network: networkConfig.name,
							type: event,
							address,
							note: 'Bridge event monitoring requires integration with @arbitrum/sdk for full functionality',
							timestamp: new Date().toISOString(),
						},
					});
					break;
				}

				default:
					throw new Error(`Unknown event type: ${event}`);
			}
		} catch (error) {
			throw error;
		}

		if (returnData.length === 0) {
			return null;
		}

		return [returnData];
	}
}
