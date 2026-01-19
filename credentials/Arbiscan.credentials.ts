import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Arbiscan API Credentials
 *
 * Provides API access to Arbiscan block explorer for:
 * - Contract verification
 * - Transaction history
 * - Token information
 * - Contract ABI retrieval
 * - Gas price oracles
 *
 * Supports both Arbitrum One and Arbitrum Nova explorers
 */
export class Arbiscan implements ICredentialType {
	name = 'arbiscan';
	displayName = 'Arbiscan API';
	documentationUrl = 'https://docs.arbiscan.io/';
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			default: 'arbitrumOne',
			description: 'Select the Arbiscan network',
			options: [
				{
					name: 'Arbitrum One',
					value: 'arbitrumOne',
					description: 'Arbiscan for Arbitrum One mainnet',
				},
				{
					name: 'Arbitrum Nova',
					value: 'arbitrumNova',
					description: 'Arbiscan for Arbitrum Nova',
				},
				{
					name: 'Arbitrum Sepolia',
					value: 'arbitrumSepolia',
					description: 'Arbiscan for Arbitrum Sepolia testnet',
				},
				{
					name: 'Arbitrum Goerli (Deprecated)',
					value: 'arbitrumGoerli',
					description: 'Arbiscan for Arbitrum Goerli testnet',
				},
			],
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Arbiscan API key - obtain from arbiscan.io/myapikey',
			hint: 'Free tier allows 5 calls/second, 100,000 calls/day',
		},
		{
			displayName: 'Rate Limit (calls/second)',
			name: 'rateLimit',
			type: 'number',
			default: 5,
			description: 'Maximum API calls per second (free tier: 5)',
			hint: 'Adjust based on your API plan',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				apikey: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$self.getBaseUrl($credentials.network)}}',
			url: '/api',
			qs: {
				module: 'account',
				action: 'balance',
				address: '0x0000000000000000000000000000000000000000',
				tag: 'latest',
				apikey: '={{$credentials.apiKey}}',
			},
		},
	};
}

/**
 * Arbiscan API base URLs by network
 */
export const ARBISCAN_URLS = {
	arbitrumOne: 'https://api.arbiscan.io',
	arbitrumNova: 'https://api-nova.arbiscan.io',
	arbitrumSepolia: 'https://api-sepolia.arbiscan.io',
	arbitrumGoerli: 'https://api-goerli.arbiscan.io',
} as const;

/**
 * Arbiscan explorer URLs (for links)
 */
export const ARBISCAN_EXPLORER_URLS = {
	arbitrumOne: 'https://arbiscan.io',
	arbitrumNova: 'https://nova.arbiscan.io',
	arbitrumSepolia: 'https://sepolia.arbiscan.io',
	arbitrumGoerli: 'https://goerli.arbiscan.io',
} as const;

/**
 * Helper type for network selection
 */
export type ArbiscanNetwork = keyof typeof ARBISCAN_URLS;
