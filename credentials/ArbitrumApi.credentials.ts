import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ArbitrumApi implements ICredentialType {
	name = 'arbitrumApi';
	displayName = 'Arbitrum API';
	documentationUrl = 'https://docs.arbitrum.io/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'API key for RPC provider (Alchemy, Infura, QuickNode, etc.)',
		},
		{
			displayName: 'RPC Endpoint',
			name: 'rpcEndpoint',
			type: 'string',
			default: 'https://arb1.arbitrum.io/rpc',
			description: 'Arbitrum RPC endpoint URL',
			required: true,
		},
	];
}