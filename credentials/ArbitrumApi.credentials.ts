import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ArbitrumApi implements ICredentialType {
	name = 'arbitrumApi';
	displayName = 'Arbitrum API';
	documentationUrl = 'https://docs.arbitrum.io/';
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Testnet (Goerli)',
					value: 'testnet',
				},
			],
			default: 'mainnet',
			description: 'The Arbitrum network to connect to',
		},
		{
			displayName: 'RPC Provider',
			name: 'provider',
			type: 'options',
			options: [
				{
					name: 'Arbitrum Public RPC',
					value: 'public',
				},
				{
					name: 'Alchemy',
					value: 'alchemy',
				},
				{
					name: 'Infura',
					value: 'infura',
				},
				{
					name: 'QuickNode',
					value: 'quicknode',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			default: 'public',
			description: 'The RPC provider to use',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			displayOptions: {
				hide: {
					provider: [
						'public',
					],
				},
			},
			description: 'API key for your RPC provider',
		},
		{
			displayName: 'Custom RPC URL',
			name: 'customUrl',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					provider: [
						'custom',
					],
				},
			},
			description: 'Custom RPC endpoint URL',
		},
		{
			displayName: 'API Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://arb1.arbitrum.io/rpc',
			description: 'Base URL for the Arbitrum RPC endpoint',
			displayOptions: {
				hide: {
					provider: [
						'custom',
					],
				},
			},
		},
	];
}