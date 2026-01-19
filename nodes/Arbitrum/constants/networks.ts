/**
 * Arbitrum Network Configuration
 *
 * Comprehensive network definitions for all Arbitrum chains
 * including RPC endpoints, chain IDs, and explorer URLs.
 */

/**
 * Network identifiers
 */
export type ArbitrumNetworkId =
	| 'arbitrumOne'
	| 'arbitrumNova'
	| 'arbitrumSepolia'
	| 'arbitrumGoerli'
	| 'custom';

/**
 * L1 Network identifiers (corresponding parent chains)
 */
export type L1NetworkId = 'mainnet' | 'sepolia' | 'goerli';

/**
 * Network configuration interface
 */
export interface NetworkConfig {
	chainId: number;
	name: string;
	shortName: string;
	rpcUrl: string;
	wsUrl: string;
	explorerUrl: string;
	explorerApiUrl: string;
	l1ChainId: number;
	l1Name: string;
	l1RpcUrl: string;
	isTestnet: boolean;
	isNova: boolean;
	nativeCurrency: {
		name: string;
		symbol: string;
		decimals: number;
	};
	sequencerUrl?: string;
	feedUrl?: string;
	blockTime: number; // Average block time in seconds
	confirmations: number; // Recommended confirmations
}

/**
 * Main network configurations
 */
export const NETWORKS: Record<Exclude<ArbitrumNetworkId, 'custom'>, NetworkConfig> = {
	arbitrumOne: {
		chainId: 42161,
		name: 'Arbitrum One',
		shortName: 'arb1',
		rpcUrl: 'https://arb1.arbitrum.io/rpc',
		wsUrl: 'wss://arb1.arbitrum.io/ws',
		explorerUrl: 'https://arbiscan.io',
		explorerApiUrl: 'https://api.arbiscan.io/api',
		l1ChainId: 1,
		l1Name: 'Ethereum Mainnet',
		l1RpcUrl: 'https://eth.llamarpc.com',
		isTestnet: false,
		isNova: false,
		nativeCurrency: {
			name: 'Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		sequencerUrl: 'https://arb1-sequencer.arbitrum.io/rpc',
		feedUrl: 'wss://arb1.arbitrum.io/feed',
		blockTime: 0.25, // ~250ms average
		confirmations: 1,
	},
	arbitrumNova: {
		chainId: 42170,
		name: 'Arbitrum Nova',
		shortName: 'arb-nova',
		rpcUrl: 'https://nova.arbitrum.io/rpc',
		wsUrl: 'wss://nova.arbitrum.io/ws',
		explorerUrl: 'https://nova.arbiscan.io',
		explorerApiUrl: 'https://api-nova.arbiscan.io/api',
		l1ChainId: 1,
		l1Name: 'Ethereum Mainnet',
		l1RpcUrl: 'https://eth.llamarpc.com',
		isTestnet: false,
		isNova: true, // AnyTrust chain
		nativeCurrency: {
			name: 'Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		blockTime: 0.25,
		confirmations: 1,
	},
	arbitrumSepolia: {
		chainId: 421614,
		name: 'Arbitrum Sepolia',
		shortName: 'arb-sepolia',
		rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
		wsUrl: 'wss://sepolia-rollup.arbitrum.io/ws',
		explorerUrl: 'https://sepolia.arbiscan.io',
		explorerApiUrl: 'https://api-sepolia.arbiscan.io/api',
		l1ChainId: 11155111,
		l1Name: 'Sepolia',
		l1RpcUrl: 'https://rpc.sepolia.org',
		isTestnet: true,
		isNova: false,
		nativeCurrency: {
			name: 'Sepolia Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		blockTime: 0.25,
		confirmations: 1,
	},
	arbitrumGoerli: {
		chainId: 421613,
		name: 'Arbitrum Goerli',
		shortName: 'arb-goerli',
		rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
		wsUrl: 'wss://goerli-rollup.arbitrum.io/ws',
		explorerUrl: 'https://goerli.arbiscan.io',
		explorerApiUrl: 'https://api-goerli.arbiscan.io/api',
		l1ChainId: 5,
		l1Name: 'Goerli',
		l1RpcUrl: 'https://rpc.ankr.com/eth_goerli',
		isTestnet: true,
		isNova: false,
		nativeCurrency: {
			name: 'Goerli Ethereum',
			symbol: 'ETH',
			decimals: 18,
		},
		blockTime: 0.25,
		confirmations: 1,
	},
};

/**
 * Chain ID to network mapping
 */
export const CHAIN_ID_TO_NETWORK: Record<number, ArbitrumNetworkId> = {
	42161: 'arbitrumOne',
	42170: 'arbitrumNova',
	421614: 'arbitrumSepolia',
	421613: 'arbitrumGoerli',
};

/**
 * RPC provider configurations
 */
export const RPC_PROVIDERS = {
	alchemy: {
		name: 'Alchemy',
		arbitrumOne: 'https://arb-mainnet.g.alchemy.com/v2/',
		arbitrumNova: 'https://arb-nova.g.alchemy.com/v2/',
		arbitrumSepolia: 'https://arb-sepolia.g.alchemy.com/v2/',
		arbitrumGoerli: 'https://arb-goerli.g.alchemy.com/v2/',
	},
	infura: {
		name: 'Infura',
		arbitrumOne: 'https://arbitrum-mainnet.infura.io/v3/',
		arbitrumNova: null, // Not supported
		arbitrumSepolia: 'https://arbitrum-sepolia.infura.io/v3/',
		arbitrumGoerli: 'https://arbitrum-goerli.infura.io/v3/',
	},
	quicknode: {
		name: 'QuickNode',
		// QuickNode uses custom endpoints: https://{endpoint}.arbitrum-mainnet.quiknode.pro/{token}
		arbitrumOne: '.arbitrum-mainnet.quiknode.pro/',
		arbitrumNova: '.arbitrum-nova.quiknode.pro/',
		arbitrumSepolia: '.arbitrum-sepolia.quiknode.pro/',
		arbitrumGoerli: '.arbitrum-goerli.quiknode.pro/',
	},
	ankr: {
		name: 'Ankr',
		arbitrumOne: 'https://rpc.ankr.com/arbitrum/',
		arbitrumNova: 'https://rpc.ankr.com/arbitrumnova/',
		arbitrumSepolia: 'https://rpc.ankr.com/arbitrum_sepolia/',
		arbitrumGoerli: null, // Not supported
	},
} as const;

/**
 * Sequencer status URLs
 */
export const SEQUENCER_URLS = {
	arbitrumOne: 'https://arb1-sequencer.arbitrum.io/rpc',
	arbitrumNova: 'https://nova-sequencer.arbitrum.io/rpc',
	arbitrumSepolia: 'https://sepolia-rollup-sequencer.arbitrum.io/rpc',
	arbitrumGoerli: 'https://goerli-rollup-sequencer.arbitrum.io/rpc',
} as const;

/**
 * L1 to L2 network mapping
 */
export const L1_TO_L2_NETWORKS = {
	1: ['arbitrumOne', 'arbitrumNova'], // Ethereum mainnet
	11155111: ['arbitrumSepolia'], // Sepolia
	5: ['arbitrumGoerli'], // Goerli (deprecated)
} as const;

/**
 * Get network config by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | null {
	const networkId = CHAIN_ID_TO_NETWORK[chainId];
	if (!networkId || networkId === 'custom') return null;
	return NETWORKS[networkId];
}

/**
 * Get network config by network ID
 */
export function getNetwork(networkId: ArbitrumNetworkId): NetworkConfig | null {
	if (networkId === 'custom') return null;
	return NETWORKS[networkId];
}

/**
 * Build RPC URL with provider API key
 */
export function buildProviderRpcUrl(
	networkId: Exclude<ArbitrumNetworkId, 'custom'>,
	provider: keyof typeof RPC_PROVIDERS,
	apiKey: string,
	quicknodeEndpoint?: string,
): string | null {
	const providerConfig = RPC_PROVIDERS[provider];
	const baseUrl = providerConfig[networkId];

	if (!baseUrl) return null;

	if (provider === 'quicknode' && quicknodeEndpoint) {
		return `https://${quicknodeEndpoint}${baseUrl}${apiKey}`;
	}

	return `${baseUrl}${apiKey}`;
}

/**
 * Challenge period duration (in seconds)
 * This is the time users must wait for L2->L1 withdrawals
 */
export const CHALLENGE_PERIOD = {
	arbitrumOne: 7 * 24 * 60 * 60, // 7 days
	arbitrumNova: 7 * 24 * 60 * 60, // 7 days
	arbitrumSepolia: 1 * 60 * 60, // 1 hour (testnet)
	arbitrumGoerli: 1 * 60 * 60, // 1 hour (testnet)
} as const;

/**
 * Default gas settings
 */
export const DEFAULT_GAS_SETTINGS = {
	maxFeePerGas: '0.1', // gwei
	maxPriorityFeePerGas: '0.01', // gwei
	gasLimit: 21000, // Basic ETH transfer
	contractGasLimit: 500000, // Default for contract calls
} as const;

// Precompile contract addresses for Arbitrum
export const PRECOMPILES = {
	ArbSys: '0x0000000000000000000000000000000000000064',
	ArbInfo: '0x0000000000000000000000000000000000000065',
	ArbAddressTable: '0x0000000000000000000000000000000000000066',
	ArbBLS: '0x0000000000000000000000000000000000000067',
	ArbFunctionTable: '0x0000000000000000000000000000000000000068',
	ArbosTest: '0x0000000000000000000000000000000000000069',
	ArbGasInfo: '0x000000000000000000000000000000000000006C',
	ArbAggregator: '0x000000000000000000000000000000000000006D',
	ArbRetryableTx: '0x000000000000000000000000000000000000006E',
	ArbStatistics: '0x000000000000000000000000000000000000006F',
	ArbOwnerPublic: '0x000000000000000000000000000000000000006B',
	ArbWasm: '0x0000000000000000000000000000000000000071',
	ArbWasmCache: '0x0000000000000000000000000000000000000072',
	NodeInterface: '0x00000000000000000000000000000000000000C8',
} as const;

// Alias for compatibility
export const NETWORK_CONFIGS = NETWORKS;
export const ARBITRUM_NETWORKS = NETWORKS;
