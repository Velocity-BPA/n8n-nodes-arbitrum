import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as actions from './actions';

export class Arbitrum implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Arbitrum',
		name: 'arbitrum',
		icon: 'file:arbitrum.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Arbitrum blockchain - L2 scaling solution for Ethereum',
		defaults: {
			name: 'Arbitrum',
		},
		inputs: ['main'],
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
		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
						description: 'Account and balance operations',
					},
					{
						name: 'Block',
						value: 'block',
						description: 'Block information and queries',
					},
					{
						name: 'Bridge',
						value: 'bridge',
						description: 'L1 <-> L2 bridge operations',
					},
					{
						name: 'Contract',
						value: 'contract',
						description: 'Smart contract interactions',
					},
					{
						name: 'DeFi',
						value: 'defi',
						description: 'DeFi and DEX operations',
					},
					{
						name: 'Events',
						value: 'events',
						description: 'Event log queries and filtering',
					},
					{
						name: 'L2 to L1 Messaging',
						value: 'l2tol1',
						description: 'L2 to L1 withdrawal and messaging',
					},
					{
						name: 'NFT',
						value: 'nft',
						description: 'ERC-721 and ERC-1155 NFT operations',
					},
					{
						name: 'Nova',
						value: 'nova',
						description: 'Arbitrum Nova specific operations',
					},
					{
						name: 'Retryable Tickets',
						value: 'retryable',
						description: 'Retryable ticket management',
					},
					{
						name: 'Stylus',
						value: 'stylus',
						description: 'Stylus WASM contract operations',
					},
					{
						name: 'Token',
						value: 'token',
						description: 'ERC-20 token operations',
					},
					{
						name: 'Transaction',
						value: 'transaction',
						description: 'Transaction operations and queries',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Utility functions and conversions',
					},
				],
				default: 'account',
			},

			// Account Operations and Fields
			...actions.account.operations,
			...actions.account.fields,

			// Transaction Operations and Fields
			...actions.transaction.operations,
			...actions.transaction.fields,

			// Token Operations and Fields
			...actions.token.operations,
			...actions.token.fields,

			// NFT Operations and Fields
			...actions.nft.operations,
			...actions.nft.fields,

			// Contract Operations and Fields
			...actions.contract.operations,
			...actions.contract.fields,

			// Block Operations and Fields
			...actions.block.operations,
			...actions.block.fields,

			// Events Operations and Fields
			...actions.events.operations,
			...actions.events.fields,

			// Bridge Operations and Fields
			...actions.bridge.operations,
			...actions.bridge.fields,

			// Retryable Operations and Fields
			...actions.retryable.operations,
			...actions.retryable.fields,

			// L2 to L1 Operations and Fields
			...actions.l2tol1.operations,
			...actions.l2tol1.fields,

			// Nova Operations and Fields
			...actions.nova.operations,
			...actions.nova.fields,

			// Stylus Operations and Fields
			...actions.stylus.operations,
			...actions.stylus.fields,

			// DeFi Operations and Fields
			...actions.defi.operations,
			...actions.defi.fields,

			// Utility Operations and Fields
			...actions.utility.operations,
			...actions.utility.fields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[];

				switch (resource) {
					case 'account':
						result = await actions.account.execute.call(this, i);
						break;
					case 'transaction':
						result = await actions.transaction.execute.call(this, i);
						break;
					case 'token':
						result = await actions.token.execute.call(this, i);
						break;
					case 'nft':
						result = await actions.nft.execute.call(this, i);
						break;
					case 'contract':
						result = await actions.contract.execute.call(this, i);
						break;
					case 'block':
						result = await actions.block.execute.call(this, i);
						break;
					case 'events':
						result = await actions.events.execute.call(this, i);
						break;
					case 'bridge':
						result = await actions.bridge.execute.call(this, i);
						break;
					case 'retryable':
						result = await actions.retryable.execute.call(this, i);
						break;
					case 'l2tol1':
						result = await actions.l2tol1.execute.call(this, i);
						break;
					case 'nova':
						result = await actions.nova.execute.call(this, i);
						break;
					case 'stylus':
						result = await actions.stylus.execute.call(this, i);
						break;
					case 'defi':
						result = await actions.defi.execute.call(this, i);
						break;
					case 'utility':
						result = await actions.utility.execute.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
