/**
 * Arbiscan Explorer API Transport
 *
 * Handles API interactions with Arbiscan for:
 * - Transaction history
 * - Token information
 * - Contract verification
 * - ABI retrieval
 * - Gas price oracles
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { ARBISCAN_URLS, ArbiscanNetwork } from '../../../credentials/Arbiscan.credentials';

/**
 * Arbiscan API response wrapper
 */
interface ArbiscanResponse<T = unknown> {
	status: '0' | '1';
	message: string;
	result: T;
}

/**
 * Transaction list item
 */
export interface ArbiscanTransaction {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	nonce: string;
	blockHash: string;
	transactionIndex: string;
	from: string;
	to: string;
	value: string;
	gas: string;
	gasPrice: string;
	isError: string;
	txreceipt_status: string;
	input: string;
	contractAddress: string;
	cumulativeGasUsed: string;
	gasUsed: string;
	confirmations: string;
	methodId: string;
	functionName: string;
}

/**
 * Token transfer item
 */
export interface ArbiscanTokenTransfer {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	nonce: string;
	blockHash: string;
	from: string;
	contractAddress: string;
	to: string;
	value: string;
	tokenName: string;
	tokenSymbol: string;
	tokenDecimal: string;
	transactionIndex: string;
	gas: string;
	gasPrice: string;
	gasUsed: string;
	cumulativeGasUsed: string;
	input: string;
	confirmations: string;
}

/**
 * NFT transfer item
 */
export interface ArbiscanNFTTransfer {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	nonce: string;
	blockHash: string;
	from: string;
	contractAddress: string;
	to: string;
	tokenID: string;
	tokenName: string;
	tokenSymbol: string;
	tokenDecimal: string;
	transactionIndex: string;
	gas: string;
	gasPrice: string;
	gasUsed: string;
	cumulativeGasUsed: string;
	input: string;
	confirmations: string;
}

/**
 * Internal transaction item
 */
export interface ArbiscanInternalTx {
	blockNumber: string;
	timeStamp: string;
	hash: string;
	from: string;
	to: string;
	value: string;
	contractAddress: string;
	input: string;
	type: string;
	gas: string;
	gasUsed: string;
	traceId: string;
	isError: string;
	errCode: string;
}

/**
 * Contract source code info
 */
export interface ContractSourceInfo {
	SourceCode: string;
	ABI: string;
	ContractName: string;
	CompilerVersion: string;
	OptimizationUsed: string;
	Runs: string;
	ConstructorArguments: string;
	EVMVersion: string;
	Library: string;
	LicenseType: string;
	Proxy: string;
	Implementation: string;
	SwarmSource: string;
}

/**
 * Token info from Arbiscan
 */
export interface ArbiscanTokenInfo {
	contractAddress: string;
	tokenName: string;
	symbol: string;
	divisor: string;
	tokenType: string;
	totalSupply: string;
	blueCheckmark: string;
	description: string;
	website: string;
	email: string;
	blog: string;
	reddit: string;
	slack: string;
	facebook: string;
	twitter: string;
	bitcointalk: string;
	github: string;
	telegram: string;
	wechat: string;
	linkedin: string;
	discord: string;
	whitepaper: string;
	tokenPriceUSD: string;
}

/**
 * Gas oracle response
 */
export interface GasOracle {
	LastBlock: string;
	SafeGasPrice: string;
	ProposeGasPrice: string;
	FastGasPrice: string;
	suggestBaseFee: string;
	gasUsedRatio: string;
	UsdPrice: string;
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
	private queue: Array<() => void> = [];
	private processing = false;
	private lastCall = 0;
	private minInterval: number;

	constructor(callsPerSecond: number) {
		this.minInterval = 1000 / callsPerSecond;
	}

	async acquire(): Promise<void> {
		return new Promise((resolve) => {
			this.queue.push(resolve);
			this.process();
		});
	}

	private async process(): Promise<void> {
		if (this.processing) return;
		this.processing = true;

		while (this.queue.length > 0) {
			const now = Date.now();
			const wait = Math.max(0, this.minInterval - (now - this.lastCall));

			if (wait > 0) {
				await new Promise((r) => setTimeout(r, wait));
			}

			const resolve = this.queue.shift();
			if (resolve) {
				this.lastCall = Date.now();
				resolve();
			}
		}

		this.processing = false;
	}
}

/**
 * Arbiscan API Client
 */
export class ArbiscanClient {
	private client: AxiosInstance;
	private apiKey: string;
	private network: ArbiscanNetwork;
	private rateLimiter: RateLimiter;

	constructor(credentials: ICredentialDataDecryptedObject) {
		this.network = (credentials.network as ArbiscanNetwork) || 'arbitrumOne';
		this.apiKey = credentials.apiKey as string;
		const rateLimit = (credentials.rateLimit as number) || 5;

		const baseURL = ARBISCAN_URLS[this.network];
		if (!baseURL) {
			throw new Error(`Unsupported network: ${this.network}`);
		}

		this.client = axios.create({
			baseURL,
			timeout: 30000,
		});

		this.rateLimiter = new RateLimiter(rateLimit);
	}

	/**
	 * Make an API request with rate limiting
	 */
	private async request<T>(
		module: string,
		action: string,
		params: Record<string, string | number> = {},
	): Promise<T> {
		await this.rateLimiter.acquire();

		const response: AxiosResponse<ArbiscanResponse<T>> = await this.client.get('/api', {
			params: {
				module,
				action,
				apikey: this.apiKey,
				...params,
			},
		});

		if (response.data.status === '0' && response.data.message !== 'No transactions found') {
			throw new Error(`Arbiscan API error: ${response.data.message}`);
		}

		return response.data.result;
	}

	// ==================== Account API ====================

	/**
	 * Get ETH balance for a single address
	 */
	async getBalance(address: string): Promise<string> {
		return this.request<string>('account', 'balance', {
			address,
			tag: 'latest',
		});
	}

	/**
	 * Get ETH balance for multiple addresses
	 */
	async getBalanceMulti(addresses: string[]): Promise<Array<{ account: string; balance: string }>> {
		return this.request('account', 'balancemulti', {
			address: addresses.join(','),
			tag: 'latest',
		});
	}

	/**
	 * Get normal transactions for an address
	 */
	async getTransactions(
		address: string,
		options: {
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {},
	): Promise<ArbiscanTransaction[]> {
		return this.request<ArbiscanTransaction[]>('account', 'txlist', {
			address,
			startblock: options.startBlock || 0,
			endblock: options.endBlock || 99999999,
			page: options.page || 1,
			offset: options.offset || 10,
			sort: options.sort || 'desc',
		});
	}

	/**
	 * Get internal transactions for an address
	 */
	async getInternalTransactions(
		address: string,
		options: {
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {},
	): Promise<ArbiscanInternalTx[]> {
		return this.request<ArbiscanInternalTx[]>('account', 'txlistinternal', {
			address,
			startblock: options.startBlock || 0,
			endblock: options.endBlock || 99999999,
			page: options.page || 1,
			offset: options.offset || 10,
			sort: options.sort || 'desc',
		});
	}

	/**
	 * Get ERC20 token transfers for an address
	 */
	async getTokenTransfers(
		address: string,
		options: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {},
	): Promise<ArbiscanTokenTransfer[]> {
		const params: Record<string, string | number> = {
			address,
			startblock: options.startBlock || 0,
			endblock: options.endBlock || 99999999,
			page: options.page || 1,
			offset: options.offset || 100,
			sort: options.sort || 'desc',
		};

		if (options.contractAddress) {
			params.contractaddress = options.contractAddress;
		}

		return this.request<ArbiscanTokenTransfer[]>('account', 'tokentx', params);
	}

	/**
	 * Get ERC721 (NFT) transfers for an address
	 */
	async getNFTTransfers(
		address: string,
		options: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {},
	): Promise<ArbiscanNFTTransfer[]> {
		const params: Record<string, string | number> = {
			address,
			startblock: options.startBlock || 0,
			endblock: options.endBlock || 99999999,
			page: options.page || 1,
			offset: options.offset || 100,
			sort: options.sort || 'desc',
		};

		if (options.contractAddress) {
			params.contractaddress = options.contractAddress;
		}

		return this.request<ArbiscanNFTTransfer[]>('account', 'tokennfttx', params);
	}

	/**
	 * Get ERC1155 transfers for an address
	 */
	async getERC1155Transfers(
		address: string,
		options: {
			contractAddress?: string;
			startBlock?: number;
			endBlock?: number;
			page?: number;
			offset?: number;
			sort?: 'asc' | 'desc';
		} = {},
	): Promise<ArbiscanNFTTransfer[]> {
		const params: Record<string, string | number> = {
			address,
			startblock: options.startBlock || 0,
			endblock: options.endBlock || 99999999,
			page: options.page || 1,
			offset: options.offset || 100,
			sort: options.sort || 'desc',
		};

		if (options.contractAddress) {
			params.contractaddress = options.contractAddress;
		}

		return this.request<ArbiscanNFTTransfer[]>('account', 'token1155tx', params);
	}

	/**
	 * Get token balance for an address
	 */
	async getTokenBalance(address: string, contractAddress: string): Promise<string> {
		return this.request<string>('account', 'tokenbalance', {
			address,
			contractaddress: contractAddress,
			tag: 'latest',
		});
	}

	// ==================== Contract API ====================

	/**
	 * Get contract ABI
	 */
	async getContractABI(address: string): Promise<string> {
		return this.request<string>('contract', 'getabi', {
			address,
		});
	}

	/**
	 * Get contract source code
	 */
	async getContractSource(address: string): Promise<ContractSourceInfo[]> {
		return this.request<ContractSourceInfo[]>('contract', 'getsourcecode', {
			address,
		});
	}

	/**
	 * Verify contract source code
	 */
	async verifyContract(params: {
		address: string;
		sourceCode: string;
		contractName: string;
		compilerVersion: string;
		optimizationUsed: boolean;
		runs?: number;
		constructorArguements?: string;
		evmVersion?: string;
		licenseType?: number;
	}): Promise<string> {
		return this.request<string>('contract', 'verifysourcecode', {
			contractaddress: params.address,
			sourceCode: params.sourceCode,
			codeformat: 'solidity-single-file',
			contractname: params.contractName,
			compilerversion: params.compilerVersion,
			optimizationUsed: params.optimizationUsed ? 1 : 0,
			runs: params.runs || 200,
			constructorArguements: params.constructorArguements || '',
			evmversion: params.evmVersion || '',
			licenseType: params.licenseType || 1,
		});
	}

	/**
	 * Check contract verification status
	 */
	async checkVerificationStatus(guid: string): Promise<string> {
		return this.request<string>('contract', 'checkverifystatus', {
			guid,
		});
	}

	// ==================== Transaction API ====================

	/**
	 * Get transaction receipt status
	 */
	async getTransactionReceiptStatus(txHash: string): Promise<{ status: string }> {
		return this.request<{ status: string }>('transaction', 'getstatus', {
			txhash: txHash,
		});
	}

	/**
	 * Get transaction execution status
	 */
	async getTransactionStatus(txHash: string): Promise<{
		isError: string;
		errDescription: string;
	}> {
		return this.request<{ isError: string; errDescription: string }>(
			'transaction',
			'gettxreceiptstatus',
			{
				txhash: txHash,
			},
		);
	}

	// ==================== Block API ====================

	/**
	 * Get block reward by block number
	 */
	async getBlockReward(blockNumber: number): Promise<{
		blockNumber: string;
		timeStamp: string;
		blockMiner: string;
		blockReward: string;
		uncles: unknown[];
		uncleInclusionReward: string;
	}> {
		return this.request('block', 'getblockreward', {
			blockno: blockNumber,
		});
	}

	/**
	 * Get estimated block countdown time
	 */
	async getBlockCountdown(blockNumber: number): Promise<{
		CurrentBlock: string;
		CountdownBlock: string;
		RemainingBlock: string;
		EstimateTimeInSec: string;
	}> {
		return this.request('block', 'getblockcountdown', {
			blockno: blockNumber,
		});
	}

	/**
	 * Get block number by timestamp
	 */
	async getBlockNumberByTime(
		timestamp: number,
		closest: 'before' | 'after' = 'before',
	): Promise<string> {
		return this.request<string>('block', 'getblocknobytime', {
			timestamp,
			closest,
		});
	}

	// ==================== Logs API ====================

	/**
	 * Get event logs
	 */
	async getLogs(params: {
		address?: string;
		fromBlock?: number;
		toBlock?: number;
		topic0?: string;
		topic1?: string;
		topic2?: string;
		topic3?: string;
		topic0_1_opr?: 'and' | 'or';
		topic1_2_opr?: 'and' | 'or';
		topic2_3_opr?: 'and' | 'or';
		page?: number;
		offset?: number;
	}): Promise<
		Array<{
			address: string;
			topics: string[];
			data: string;
			blockNumber: string;
			timeStamp: string;
			gasPrice: string;
			gasUsed: string;
			logIndex: string;
			transactionHash: string;
			transactionIndex: string;
		}>
	> {
		const apiParams: Record<string, string | number> = {
			fromBlock: params.fromBlock || 0,
			toBlock: params.toBlock || 'latest',
			page: params.page || 1,
			offset: params.offset || 1000,
		};

		if (params.address) apiParams.address = params.address;
		if (params.topic0) apiParams.topic0 = params.topic0;
		if (params.topic1) apiParams.topic1 = params.topic1;
		if (params.topic2) apiParams.topic2 = params.topic2;
		if (params.topic3) apiParams.topic3 = params.topic3;
		if (params.topic0_1_opr) apiParams.topic0_1_opr = params.topic0_1_opr;
		if (params.topic1_2_opr) apiParams.topic1_2_opr = params.topic1_2_opr;
		if (params.topic2_3_opr) apiParams.topic2_3_opr = params.topic2_3_opr;

		return this.request('logs', 'getLogs', apiParams);
	}

	// ==================== Token API ====================

	/**
	 * Get token info
	 */
	async getTokenInfo(contractAddress: string): Promise<ArbiscanTokenInfo[]> {
		return this.request<ArbiscanTokenInfo[]>('token', 'tokeninfo', {
			contractaddress: contractAddress,
		});
	}

	/**
	 * Get token holder list
	 */
	async getTokenHolders(
		contractAddress: string,
		page = 1,
		offset = 100,
	): Promise<Array<{ TokenHolderAddress: string; TokenHolderQuantity: string }>> {
		return this.request('token', 'tokenholderlist', {
			contractaddress: contractAddress,
			page,
			offset,
		});
	}

	// ==================== Gas Tracker API ====================

	/**
	 * Get gas oracle
	 */
	async getGasOracle(): Promise<GasOracle> {
		return this.request<GasOracle>('gastracker', 'gasoracle', {});
	}

	// ==================== Stats API ====================

	/**
	 * Get ETH price
	 */
	async getEthPrice(): Promise<{
		ethbtc: string;
		ethbtc_timestamp: string;
		ethusd: string;
		ethusd_timestamp: string;
	}> {
		return this.request('stats', 'ethprice', {});
	}

	/**
	 * Get ETH supply
	 */
	async getEthSupply(): Promise<string> {
		return this.request<string>('stats', 'ethsupply', {});
	}
}

/**
 * Create Arbiscan client from credentials
 */
export function createArbiscanClient(
	credentials: ICredentialDataDecryptedObject,
): ArbiscanClient {
	return new ArbiscanClient(credentials);
}
