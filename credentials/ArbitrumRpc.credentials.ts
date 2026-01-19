import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Arbitrum RPC Credentials
 *
 * Supports multiple Arbitrum networks:
 * - Arbitrum One (Mainnet) - Chain ID: 42161
 * - Arbitrum Nova - Chain ID: 42170
 * - Arbitrum Sepolia (Testnet) - Chain ID: 421614
 * - Arbitrum Goerli (Deprecated) - Chain ID: 421613
 * - Custom RPC endpoint
 *
 * Provides authentication for both read operations (RPC URL)
 * and write operations (private key required)
 */
export class ArbitrumRpc implements ICredentialType {
	name = 'arbitrumRpc';
	displayName = 'Arbitrum RPC';
	documentationUrl = 'https://docs.arbitrum.io/';
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			default: 'arbitrumOne',
			description: 'Select the Arbitrum network to connect to',
			options: [
				{
					name: 'Arbitrum One (Mainnet)',
					value: 'arbitrumOne',
					description: 'Main production network - Chain ID: 42161',
				},
				{
					name: 'Arbitrum Nova',
					value: 'arbitrumNova',
					description: 'AnyTrust chain optimized for gaming/social - Chain ID: 42170',
				},
				{
					name: 'Arbitrum Sepolia (Testnet)',
					value: 'arbitrumSepolia',
					description: 'Sepolia testnet for development - Chain ID: 421614',
				},
				{
					name: 'Arbitrum Goerli (Deprecated)',
					value: 'arbitrumGoerli',
					description: 'Deprecated Goerli testnet - Chain ID: 421613',
				},
				{
					name: 'Custom',
					value: 'custom',
					description: 'Custom RPC endpoint',
				},
			],
		},
		{
			displayName: 'RPC Provider',
			name: 'rpcProvider',
			type: 'options',
			default: 'public',
			description: 'Select RPC provider or use custom endpoint',
			displayOptions: {
				hide: {
					network: ['custom'],
				},
			},
			options: [
				{
					name: 'Public RPC (Rate Limited)',
					value: 'public',
					description: 'Free public endpoint with rate limits',
				},
				{
					name: 'Alchemy',
					value: 'alchemy',
					description: 'Alchemy RPC provider',
				},
				{
					name: 'Infura',
					value: 'infura',
					description: 'Infura RPC provider',
				},
				{
					name: 'QuickNode',
					value: 'quicknode',
					description: 'QuickNode RPC provider',
				},
				{
					name: 'Ankr',
					value: 'ankr',
					description: 'Ankr RPC provider',
				},
				{
					name: 'Custom URL',
					value: 'customUrl',
					description: 'Custom RPC URL',
				},
			],
		},
		{
			displayName: 'RPC URL',
			name: 'rpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://arb1.arbitrum.io/rpc',
			description: 'Full RPC endpoint URL',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'RPC URL',
			name: 'customRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://your-custom-rpc.com',
			description: 'Custom RPC endpoint URL',
			displayOptions: {
				show: {
					rpcProvider: ['customUrl'],
				},
			},
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for enhanced RPC providers (Alchemy, Infura, QuickNode, Ankr)',
			displayOptions: {
				show: {
					rpcProvider: ['alchemy', 'infura', 'quicknode', 'ankr'],
				},
			},
		},
		{
			displayName: 'QuickNode Endpoint',
			name: 'quicknodeEndpoint',
			type: 'string',
			default: '',
			placeholder: 'your-endpoint-name',
			description: 'Your QuickNode endpoint subdomain',
			displayOptions: {
				show: {
					rpcProvider: ['quicknode'],
				},
			},
		},
		{
			displayName: 'Chain ID',
			name: 'chainId',
			type: 'number',
			default: 42161,
			description: 'Chain ID for custom networks',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Private key for signing transactions (required for write operations). NEVER share this key.',
			hint: 'Required only for write operations like sending transactions, deploying contracts, etc.',
		},
		{
			displayName: 'WebSocket URL',
			name: 'wsUrl',
			type: 'string',
			default: '',
			placeholder: 'wss://arb1.arbitrum.io/ws',
			description: 'WebSocket endpoint for real-time subscriptions (optional)',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'Enable WebSocket',
			name: 'enableWebSocket',
			type: 'boolean',
			default: false,
			description: 'Whether to enable WebSocket connections for real-time updates',
			displayOptions: {
				hide: {
					network: ['custom'],
				},
			},
		},
		{
			displayName: 'L1 RPC URL',
			name: 'l1RpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
			description: 'Ethereum L1 RPC URL (required for bridge operations)',
			hint: 'Required for L1<->L2 bridging, retryable tickets, and withdrawal proofs',
		},
		{
			displayName: 'L1 Private Key',
			name: 'l1PrivateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Private key for L1 transactions (for bridge deposits)',
			hint: 'Required for initiating deposits from Ethereum to Arbitrum',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$self.getResolvedRpcUrl()}}',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 1,
			}),
		},
	};
}

/**
 * Network configuration mapping
 */
export const ARBITRUM_NETWORKS = {
	arbitrumOne: {
		chainId: 42161,
		name: 'Arbitrum One',
		rpcUrl: 'https://arb1.arbitrum.io/rpc',
		wsUrl: 'wss://arb1.arbitrum.io/ws',
		explorerUrl: 'https://arbiscan.io',
		l1ChainId: 1,
	},
	arbitrumNova: {
		chainId: 42170,
		name: 'Arbitrum Nova',
		rpcUrl: 'https://nova.arbitrum.io/rpc',
		wsUrl: 'wss://nova.arbitrum.io/ws',
		explorerUrl: 'https://nova.arbiscan.io',
		l1ChainId: 1,
	},
	arbitrumSepolia: {
		chainId: 421614,
		name: 'Arbitrum Sepolia',
		rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
		wsUrl: 'wss://sepolia-rollup.arbitrum.io/ws',
		explorerUrl: 'https://sepolia.arbiscan.io',
		l1ChainId: 11155111,
	},
	arbitrumGoerli: {
		chainId: 421613,
		name: 'Arbitrum Goerli',
		rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
		wsUrl: 'wss://goerli-rollup.arbitrum.io/ws',
		explorerUrl: 'https://goerli.arbiscan.io',
		l1ChainId: 5,
	},
} as const;

/**
 * RPC provider URL templates
 */
export const RPC_PROVIDERS = {
	alchemy: {
		arbitrumOne: 'https://arb-mainnet.g.alchemy.com/v2/',
		arbitrumNova: 'https://arb-nova.g.alchemy.com/v2/',
		arbitrumSepolia: 'https://arb-sepolia.g.alchemy.com/v2/',
		arbitrumGoerli: 'https://arb-goerli.g.alchemy.com/v2/',
	},
	infura: {
		arbitrumOne: 'https://arbitrum-mainnet.infura.io/v3/',
		arbitrumNova: '', // Infura doesn't support Nova
		arbitrumSepolia: 'https://arbitrum-sepolia.infura.io/v3/',
		arbitrumGoerli: 'https://arbitrum-goerli.infura.io/v3/',
	},
	ankr: {
		arbitrumOne: 'https://rpc.ankr.com/arbitrum/',
		arbitrumNova: 'https://rpc.ankr.com/arbitrumnova/',
		arbitrumSepolia: 'https://rpc.ankr.com/arbitrum_sepolia/',
		arbitrumGoerli: '',
	},
} as const;
