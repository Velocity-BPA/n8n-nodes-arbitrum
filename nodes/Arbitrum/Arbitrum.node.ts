/**
 * Copyright (c) 2026 Velocity BPA
 * 
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     https://github.com/VelocityBPA/n8n-nodes-arbitrum/blob/main/LICENSE
 * 
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeApiError,
} from 'n8n-workflow';

export class Arbitrum implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Arbitrum',
    name: 'arbitrum',
    icon: 'file:arbitrum.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Arbitrum API',
    defaults: {
      name: 'Arbitrum',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'arbitrumApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Account',
            value: 'account',
          },
          {
            name: 'Transaction',
            value: 'transaction',
          },
          {
            name: 'Block',
            value: 'block',
          },
          {
            name: 'SmartContract',
            value: 'smartContract',
          },
          {
            name: 'Network',
            value: 'network',
          },
          {
            name: 'Bridge',
            value: 'bridge',
          }
        ],
        default: 'account',
      },
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['account'] } },
  options: [
    { name: 'Get Balance', value: 'getBalance', description: 'Get account ETH balance', action: 'Get account balance' },
    { name: 'Get Transaction Count', value: 'getTransactionCount', description: 'Get account nonce/transaction count', action: 'Get transaction count' },
    { name: 'Get Code', value: 'getCode', description: 'Get contract bytecode at address', action: 'Get contract code' },
    { name: 'Get Storage At', value: 'getStorageAt', description: 'Get storage value at specific position', action: 'Get storage value' },
    { name: 'Get Token Balance', value: 'getTokenBalance', description: 'Get ERC20 token balance', action: 'Get token balance' },
    { name: 'Get Account Transactions', value: 'getAccountTransactions', description: 'Get transaction history for address', action: 'Get account transactions' },
    { name: 'Get Account Nonce', value: 'getAccountNonce', description: 'Get current nonce for address', action: 'Get account nonce' },
    { name: 'Is Contract', value: 'isContract', description: 'Check if address is a contract', action: 'Check if contract' },
  ],
  default: 'getBalance',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['transaction'] } },
  options: [
    { name: 'Send Raw Transaction', value: 'sendRawTransaction', description: 'Broadcast signed transaction to network', action: 'Send raw transaction' },
    { name: 'Get Transaction', value: 'getTransaction', description: 'Get transaction details by hash', action: 'Get transaction' },
    { name: 'Get Transaction Receipt', value: 'getTransactionReceipt', description: 'Get transaction receipt and status', action: 'Get transaction receipt' },
    { name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas required for transaction', action: 'Estimate gas' },
    { name: 'Get Transactions by Block Hash', value: 'getTransactionsByBlockHash', description: 'Get all transactions in block by hash', action: 'Get transactions by block hash' },
    { name: 'Get Transactions by Block Number', value: 'getTransactionsByBlockNumber', description: 'Get all transactions in block by number', action: 'Get transactions by block number' }
  ],
  default: 'sendRawTransaction',
},
{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['block'] } },
	options: [
		{
			name: 'Get Block Number',
			value: 'getBlockNumber',
			description: 'Get the latest block number',
			action: 'Get latest block number',
		},
		{
			name: 'Get Block by Hash',
			value: 'getBlockByHash',
			description: 'Get block information by hash',
			action: 'Get block by hash',
		},
		{
			name: 'Get Block by Number',
			value: 'getBlockByNumber',
			description: 'Get block information by number',
			action: 'Get block by number',
		},
		{
			name: 'Get Block Transaction Count by Hash',
			value: 'getBlockTransactionCountByHash',
			description: 'Get transaction count in block by hash',
			action: 'Get transaction count by hash',
		},
		{
			name: 'Get Block Transaction Count by Number',
			value: 'getBlockTransactionCountByNumber',
			description: 'Get transaction count in block by number',
			action: 'Get transaction count by number',
		},
		{
			name: 'Get Latest Block',
			value: 'getLatestBlock',
			description: 'Get latest block information',
			action: 'Get latest block',
		},
		{
			name: 'Get Block Transactions',
			value: 'getBlockTransactions',
			description: 'Get all transactions in a block',
			action: 'Get block transactions',
		},
		{
			name: 'Get Network Info',
			value: 'getNetworkInfo',
			description: 'Get network chain ID and status',
			action: 'Get network info',
		},
	],
	default: 'getBlockNumber',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['smartContract'] } },
  options: [
    { name: 'Call Contract Method', value: 'call', description: 'Execute read-only contract method', action: 'Call a contract method' },
    { name: 'Estimate Gas', value: 'estimateGas', description: 'Estimate gas for contract interaction', action: 'Estimate gas for contract interaction' },
    { name: 'Get Contract Logs', value: 'getLogs', description: 'Get contract event logs', action: 'Get contract event logs' },
    { name: 'Get Contract Code', value: 'getCode', description: 'Get contract bytecode', action: 'Get contract bytecode' },
    { name: 'Get Storage Value', value: 'getStorageAt', description: 'Get contract storage value', action: 'Get contract storage value' },
  ],
  default: 'call',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['network'] } },
  options: [
    { name: 'Get Chain ID', value: 'getChainId', description: 'Get current chain ID', action: 'Get chain ID' },
    { name: 'Get Gas Price', value: 'gasPrice', description: 'Get current gas price', action: 'Get gas price' },
    { name: 'Get Fee History', value: 'feeHistory', description: 'Get historical gas fee data', action: 'Get fee history' },
    { name: 'Get Max Priority Fee Per Gas', value: 'maxPriorityFeePerGas', description: 'Get current max priority fee', action: 'Get max priority fee per gas' },
    { name: 'Get Sync Status', value: 'syncing', description: 'Get network sync status', action: 'Get sync status' },
    { name: 'Get Client Version', value: 'clientVersion', description: 'Get client version information', action: 'Get client version' }
  ],
  default: 'getChainId',
},
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
      name: 'Deposit ETH',
      value: 'depositEth',
      description: 'Deposit ETH from L1 to L2',
      action: 'Deposit ETH from L1 to L2',
    },
    {
      name: 'Withdraw ETH',
      value: 'withdrawEth',
      description: 'Withdraw ETH from L2 to L1',
      action: 'Withdraw ETH from L2 to L1',
    },
    {
      name: 'Deposit Token',
      value: 'depositToken',
      description: 'Deposit ERC20 tokens from L1 to L2',
      action: 'Deposit ERC20 tokens from L1 to L2',
    },
    {
      name: 'Withdraw Token',
      value: 'withdrawToken',
      description: 'Withdraw ERC20 tokens from L2 to L1',
      action: 'Withdraw ERC20 tokens from L2 to L1',
    },
    {
      name: 'Get Deposit Status',
      value: 'getDepositStatus',
      description: 'Get status of L1 to L2 deposit',
      action: 'Get status of L1 to L2 deposit',
    },
  ],
  default: 'depositEth',
},
{
  displayName: 'Address',
  name: 'address',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getBalance', 'getTransactionCount', 'getCode', 'getStorageAt', 'getAccountTransactions', 'getAccountNonce', 'isContract']
    }
  },
  default: '',
  placeholder: '0x742d35Cc64C5b5f7Bc0DE1e8F3Aae8B5C2a9C0B9',
  description: 'Ethereum address to query'
},
{
  displayName: 'Block Number',
  name: 'blockNumber',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getBalance', 'getTransactionCount', 'getCode', 'getStorageAt', 'getAccountNonce']
    }
  },
  default: 'latest',
  placeholder: 'latest',
  description: 'Block number or tag (latest, earliest, pending)'
},
{
  displayName: 'Storage Position',
  name: 'position',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getStorageAt']
    }
  },
  default: '0x0',
  placeholder: '0x0',
  description: 'Storage position as hex string'
},
{
  displayName: 'Token Address',
  name: 'tokenAddress',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getTokenBalance'],
    },
  },
  default: '',
  description: 'The ERC20 token contract address',
},
{
  displayName: 'Holder Address',
  name: 'holderAddress',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getTokenBalance'],
    },
  },
  default: '',
  description: 'The address holding the tokens',
},
{
  displayName: 'Token Block Number',
  name: 'tokenBlockNumber',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getTokenBalance'],
    },
  },
  default: 'latest',
  description: 'Block number to query token balance at',
},
{
  displayName: 'From Block',
  name: 'fromBlock',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getAccountTransactions'],
    },
  },
  default: 'earliest',
  description: 'Starting block number for transaction history',
},
{
  displayName: 'To Block',
  name: 'toBlock',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getAccountTransactions'],
    },
  },
  default: 'latest',
  description: 'Ending block number for transaction history',
},
{
  displayName: 'Signed Transaction Data',
  name: 'signedTransactionData',
  type: 'string',
  required: true,
  displayOptions: { show: { resource: ['transaction'], operation: ['sendRawTransaction'] } },
  default: '',
  placeholder: '0x...',
  description: 'The signed transaction data to broadcast to the network',
},
{
  displayName: 'Transaction Hash',
  name: 'transactionHash',
  type: 'string',
  required: true,
  displayOptions: { show: { resource: ['transaction'], operation: ['getTransaction', 'getTransactionReceipt'] } },
  default: '',
  placeholder: '0x...',
  description: 'The hash of the transaction to retrieve',
},
{
  displayName: 'Transaction Object',
  name: 'transactionObject',
  type: 'json',
  required: true,
  displayOptions: { show: { resource: ['transaction'], operation: ['estimateGas'] } },
  default: '{}',
  description: 'The transaction object to estimate gas for',
},
{
  displayName: 'Block Hash',
  name: 'blockHash',
  type: 'string',
  required: true,
  displayOptions: { show: { resource: ['transaction'], operation: ['getTransactionsByBlockHash'] } },
  default: '',
  placeholder: '0x...',
  description: 'The hash of the block to retrieve transactions from',
},
{
  displayName: 'Full Transaction Objects',
  name: 'fullTransactionObjects',
  type: 'boolean',
  displayOptions: { show: { resource: ['transaction'], operation: ['getTransactionsByBlockHash', 'getTransactionsByBlockNumber'] } },
  default: true,
  description: 'Whether to return full transaction objects or just transaction hashes',
},
{
  displayName: 'Block Number',
  name: 'blockNumber',
  type: 'string',
  required: true,
  displayOptions: { show: { resource: ['transaction'], operation: ['getTransactionsByBlockNumber'] } },
  default: 'latest',
  placeholder: '0x...',
  description: 'The number of the block to retrieve transactions from (hex string or "latest", "pending", "earliest")',
},
{
	displayName: 'Block Hash',
	name: 'blockHash',
	type: 'string',
	required: true,
	displayOptions: {
		show: {
			resource: ['block'],
			operation: ['getBlockByHash', 'getBlockTransactionCountByHash'],
		},
	},
	default: '',
	description: 'The hash of the block',
},
{
	displayName: 'Block Number',
	name: 'blockNumber',
	type: 'string',
	required: true,
	displayOptions: {
		show: {
			resource: ['block'],
			operation: ['getBlockByNumber', 'getBlockTransactionCountByNumber'],
		},
	},
	default: 'latest',
	description: 'The block number (hex string, number, or "latest", "earliest", "pending")',
},
{
	displayName: 'Full Transaction Objects',
	name: 'fullTransactionObjects',
	type: 'boolean',
	displayOptions: {
		show: {
			resource: ['block'],
			operation: ['getBlockByHash', 'getBlockByNumber', 'getLatestBlock'],
		},
	},
	default: false,
	description: 'Whether to return full transaction objects or just transaction hashes',
},
{
  displayName: 'Block Identifier',
  name: 'blockIdentifier',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['block'],
      operation: ['getBlockTransactions'],
    },
  },
  default: '',
  description: 'Block number (hex or decimal) or block hash',
  placeholder: '0x123abc or latest',
},
{
  displayName: 'Contract Address',
  name: 'contractAddress',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '',
  placeholder: '0x...',
  description: 'The address of the smart contract',
},
{
  displayName: 'Method Signature',
  name: 'methodSignature',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '',
  placeholder: 'methodName(uint256,string)',
  description: 'The method signature to call',
},
{
  displayName: 'Parameters',
  name: 'parameters',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '',
  placeholder: '["123", "hello"]',
  description: 'Method parameters as JSON array',
},
{
  displayName: 'From Address',
  name: 'fromAddress',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '',
  placeholder: '0x...',
  description: 'The address the call is sent from',
},
{
  displayName: 'Value',
  name: 'value',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '0x0',
  description: 'Value sent with the call in hex',
},
{
  displayName: 'Gas Limit',
  name: 'gasLimit',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '',
  description: 'Gas limit for the call',
},
{
  displayName: 'Gas Price',
  name: 'gasPrice',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'estimateGas'],
    },
  },
  default: '',
  description: 'Gas price for the call',
},
{
  displayName: 'Block Number',
  name: 'blockNumber',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['call', 'getCode', 'getStorageAt'],
    },
  },
  default: 'latest',
  description: 'Block number to query (latest, earliest, pending, or hex number)',
},
{
  displayName: 'Filter Object',
  name: 'filterObject',
  type: 'json',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['getLogs'],
    },
  },
  default: '{}',
  description: 'Filter object for event logs',
},
{
  displayName: 'Contract Address',
  name: 'contractAddressCode',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['getCode'],
    },
  },
  default: '',
  placeholder: '0x...',
  description: 'The address of the contract to get code for',
},
{
  displayName: 'Contract Address',
  name: 'contractAddressStorage',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['getStorageAt'],
    },
  },
  default: '',
  placeholder: '0x...',
  description: 'The address of the contract to get storage for',
},
{
  displayName: 'Storage Position',
  name: 'storagePosition',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['getStorageAt'],
    },
  },
  default: '0x0',
  description: 'Storage position in hex format',
},
{
  displayName: 'Block Number',
  name: 'blockNumberStorage',
  type: 'string',
  displayOptions: {
    show: {
      resource: ['smartContract'],
      operation: ['getStorageAt'],
    },
  },
  default: 'latest',
  description: 'Block number to query (latest, earliest, pending, or hex number)',
},
{
  displayName: 'Block Count',
  name: 'blockCount',
  type: 'number',
  required: true,
  default: 10,
  description: 'Number of blocks in the requested range',
  displayOptions: {
    show: {
      resource: ['network'],
      operation: ['feeHistory']
    }
  }
},
{
  displayName: 'Newest Block',
  name: 'newestBlock',
  type: 'string',
  required: true,
  default: 'latest',
  description: 'Highest block of the requested range (latest, pending, or block number)',
  displayOptions: {
    show: {
      resource: ['network'],
      operation: ['feeHistory']
    }
  }
},
{
  displayName: 'Reward Percentiles',
  name: 'rewardPercentiles',
  type: 'string',
  required: true,
  default: '25,50,75',
  description: 'Array of percentile values (comma-separated)',
  displayOptions: {
    show: {
      resource: ['network'],
      operation: ['feeHistory']
    }
  }
},
{
  displayName: 'Amount',
  name: 'amount',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['depositEth', 'withdrawEth', 'depositToken', 'withdrawToken'],
    },
  },
  default: '',
  description: 'Amount of ETH to transfer (in wei)',
},
{
  displayName: 'Recipient',
  name: 'recipient',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['depositEth', 'withdrawEth', 'depositToken', 'withdrawToken'],
    },
  },
  default: '',
  description: 'Recipient address for the transfer',
},
{
  displayName: 'Token Address',
  name: 'bridgeTokenAddress',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['depositToken', 'withdrawToken'],
    },
  },
  default: '',
  description: 'Address of the ERC20 token contract',
},
{
  displayName: 'Transaction Hash',
  name: 'txHash',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['getDepositStatus'],
    },
  },
  default: '',
  description: 'Transaction hash of the deposit to check status',
},
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;

    switch (resource) {
      case 'account':
        return [await executeAccountOperations.call(this, items)];
      case 'transaction':
        return [await executeTransactionOperations.call(this, items)];
      case 'block':
        return [await executeBlockOperations.call(this, items)];
      case 'smartContract':
        return [await executeSmartContractOperations.call(this, items)];
      case 'network':
        return [await executeNetworkOperations.call(this, items)];
      case 'bridge':
        return [await executeBridgeOperations.call(this, items)];
      default:
        throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported`);
    }
  }
}

// ============================================================
// Resource Handler Functions
// ============================================================

async function executeAccountOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('arbitrumApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      
      switch (operation) {
        case 'getBalance': {
          const address = this.getNodeParameter('address', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [address, blockNumber],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: false,
          };

          const response = await this.helpers.httpRequest(options) as any;
          const parsedResponse = JSON.parse(response);
          
          if (parsedResponse.error) {
            throw new NodeApiError(this.getNode(), parsedResponse.error, { message: parsedResponse.error.message });
          }

          result = {
            address,
            balance: parsedResponse.result,
            balanceInEth: parseInt(parsedResponse.result, 16) / Math.pow(10, 18),
            blockNumber,
          };
          break;
        }
        
        case 'getTransactionCount': {
          const address = this.getNodeParameter('address', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [address, blockNumber],
            id: 1
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`
            },
            body: requestBody,
            json: true
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'getCode': {
          const address = this.getNodeParameter('address', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [address, blockNumber],
            id: 1
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`
            },
            body: requestBody,
            json: true
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'getStorageAt': {
          const address = this.getNodeParameter('address', i) as string;
          const position = this.getNodeParameter('position', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getStorageAt',
            params: [address, position, blockNumber],
            id: 1
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`
            },
            body: requestBody,
            json: true
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTokenBalance': {
          const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
          const holderAddress = this.getNodeParameter('holderAddress', i) as string;
          const blockNumber = this.getNodeParameter('tokenBlockNumber', i) as string;
          
          // ERC20 balanceOf function selector + padded address
          const data = '0x70a08231' + holderAddress.replace('0x', '').padStart(64, '0');
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: tokenAddress,
              data: data,
            }, blockNumber],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: false,
          };

          const response = await this.helpers.httpRequest(options) as any;
          const parsedResponse = JSON.parse(response);
          
          if (parsedResponse.error) {
            throw new NodeApiError(this.getNode(), parsedResponse.error, { message: parsedResponse.error.message });
          }

          result = {
            tokenAddress,
            holderAddress,
            balance: parsedResponse.result,
            balanceDecimal: parseInt(parsedResponse.result, 16),
            blockNumber,
          };
          break;
        }

        case 'getAccountTransactions': {
          const address = this.getNodeParameter('address', i) as string;
          const fromBlock = this.getNodeParameter('fromBlock', i) as string;
          const toBlock = this.getNodeParameter('toBlock', i) as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [{
              fromBlock: fromBlock,
              toBlock: toBlock,
              address: address,
            }],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: false,
          };

          const response = await this.helpers.httpRequest(options) as any;
          const parsedResponse = JSON.parse(response);
          
          if (parsedResponse.error) {
            throw new NodeApiError(this.getNode(), parsedResponse.error, { message: parsedResponse.error.message });
          }

          result = {
            address,
            fromBlock,
            toBlock,
            transactions: parsedResponse.result,
            transactionCount: parsedResponse.result?.length || 0,
          };
          break;
        }

        case 'getAccountNonce': {
          const address = this.getNodeParameter('address', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i) as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [address, blockNumber],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: false,
          };

          const response = await this.helpers.httpRequest(options) as any;
          const parsedResponse = JSON.parse(response);
          
          if (parsedResponse.error) {
            throw new NodeApiError(this.getNode(), parsedResponse.error, { message: parsedResponse.error.message });
          }

          result = {
            address,
            nonce: parsedResponse.result,
            nonceDecimal: parseInt(parsedResponse.result, 16),
            blockNumber,
          };
          break;
        }

        case 'isContract': {
          const address = this.getNodeParameter('address', i) as string;
          
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [address, 'latest'],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: false,
          };

          const response = await this.helpers.httpRequest(options) as any;
          const parsedResponse = JSON.parse(response);
          
          if (parsedResponse.error) {
            throw new NodeApiError(this.getNode(), parsedResponse.error, { message: parsedResponse.error.message });
          }

          const code = parsedResponse.result;
          const isContract = code && code !== '0x' && code.length > 2;

          result = {
            address,
            code,
            isContract,
            codeSize: code ? (code.length - 2) / 2 : 0,
          };
          break;
        }
        
        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({ json: result, pairedItem: { item: i } });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i }
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

async function executeTransactionOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('arbitrumApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'sendRawTransaction': {
          const signedTransactionData = this.getNodeParameter('signedTransactionData', i) as string;
          
          const payload = {
            jsonrpc: '2.0',
            method: 'eth_sendRawTransaction',
            params: [signedTransactionData],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(payload),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTransaction': {
          const transactionHash = this.getNodeParameter('transactionHash', i) as string;
          
          const payload = {
            jsonrpc: '2.0',
            method: 'eth_getTransactionByHash',
            params: [transactionHash],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(payload),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTransactionReceipt': {
          const transactionHash = this.getNodeParameter('transactionHash', i) as string;
          
          const payload = {
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [transactionHash],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(payload),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'estimateGas': {
          const transactionObject = this.getNodeParameter('transactionObject', i) as any;
          
          const payload = {
            jsonrpc: '2.0',
            method: 'eth_estimateGas',
            params: [transactionObject],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(payload),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTransactionsByBlockHash': {
          const blockHash = this.getNodeParameter('blockHash', i) as string;
          const fullTransactionObjects = this.getNodeParameter('fullTransactionObjects', i) as boolean;
          
          const payload = {
            jsonrpc: '2.0',
            method: 'eth_getBlockByHash',
            params: [blockHash, fullTransactionObjects],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(payload),
            json: true,
          };

          const blockResult = await this.helpers.httpRequest(options) as any;
          result = { transactions: blockResult.result?.transactions || [] };
          break;
        }

        case 'getTransactionsByBlockNumber': {
          const blockNumber = this.getNodeParameter('blockNumber', i) as string;
          const fullTransactionObjects = this.getNodeParameter('fullTransactionObjects', i) as boolean;
          
          const payload = {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [blockNumber, fullTransactionObjects],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(payload),
            json: true,
          };

          const blockResult = await this.helpers.httpRequest(options) as any;
          result = { transactions: blockResult.result?.transactions || [] };
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      if (result.error) {
        throw new NodeApiError(this.getNode(), result.error);
      }

      returnData.push({
        json: result,
        pairedItem: { item: i },
      });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i },
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

async function executeBlockOperations(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];
	const operation = this.getNodeParameter('operation', 0) as string;
	const credentials = await this.getCredentials('arbitrumApi') as any;

	for (let i = 0; i < items.length; i++) {
		try {
			let result: any;
			let rpcBody: any;

			switch (operation) {
				case 'getBlockNumber': {
					rpcBody = {
						jsonrpc: '2.0',
						method: 'eth_blockNumber',
						params: [],
						id: 1,
					};
					break;
				}
				case 'getBlockByHash': {
					const blockHash = this.getNodeParameter('blockHash', i) as string;
					const fullTransactionObjects = this.getNodeParameter('fullTransactionObjects', i, false) as boolean;
					
					rpcBody = {
						jsonrpc: '2.0',
						method: 'eth_getBlockByHash',
						params: [blockHash, fullTransactionObjects],
						id: 1,
					};
					break;
				}
				case 'getBlockByNumber': {
					const blockNumber = this.getNodeParameter('blockNumber', i) as string;
					const fullTransactionObjects = this.getNodeParameter('fullTransactionObjects', i, false) as boolean;
					
					rpcBody = {
						jsonrpc: '2.0',
						method: 'eth_getBlockByNumber',
						params: [blockNumber, fullTransactionObjects],
						id: 1,
					};
					break;
				}
				case 'getBlockTransactionCountByHash': {
					const blockHash = this.getNodeParameter('blockHash', i) as string;
					
					rpcBody = {
						jsonrpc: '2.0',
						method: 'eth_getBlockTransactionCountByHash',
						params: [blockHash],
						id: 1,
					};
					break;
				}
				case 'getBlockTransactionCountByNumber': {
					const blockNumber = this.getNodeParameter('blockNumber', i) as string;
					
					rpcBody = {
						jsonrpc: '2.0',
						method: 'eth_getBlockTransactionCountByNumber',
						params: [blockNumber],
						id: 1,
					};
					break;
				}

        case 'getLatestBlock': {
          const includeTransactions = this.getNodeParameter('fullTransactionObjects', i) as boolean;
          
          const rpcPayload = {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: ['latest', includeTransactions],
            id: Date.now(),
          };

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(rpcPayload),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          
          if (result.error) {
            throw new NodeApiError(this.getNode(), result.error);
          }
          
          result = result.result;
          returnData.push({
            json: result,
            pairedItem: { item: i },
          });
          continue;
        }

        case 'getBlockTransactions': {
          const blockIdentifier = this.getNodeParameter('blockIdentifier', i) as string;
          
          // First get the block with transaction hashes
          const blockRpcPayload = {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [formatBlockIdentifier(blockIdentifier), true],
            id: Date.now(),
          };

          if (blockIdentifier.startsWith('0x') && blockIdentifier.length === 66) {
            blockRpcPayload.method = 'eth_getBlockByHash';
          }

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(blockRpcPayload),
            json: true,
          };

          const blockResult = await this.helpers.httpRequest(options) as any;
          
          if (blockResult.error) {
            throw new NodeApiError(this.getNode(), blockResult.error);
          }
          
          if (!blockResult.result || !blockResult.result.transactions) {
            result = { transactions: [] };
          } else {
            result = {
              blockNumber: blockResult.result.number,
              blockHash: blockResult.result.hash,
              transactions: blockResult.result.transactions,
              transactionCount: blockResult.result.transactions.length,
            };
          }
          returnData.push({
            json: result,
            pairedItem: { item: i },
          });
          continue;
        }

        case 'getNetworkInfo': {
          // Get chain ID
          const chainIdPayload = {
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: Date.now(),
          };

          const chainIdOptions: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(chainIdPayload),
            json: true,
          };

          const chainIdResult = await this.helpers.httpRequest(options) as any;

          // Get network version
          const networkPayload = {
            jsonrpc: '2.0',
            method: 'net_version',
            params: [],
            id: Date.now() + 1,
          };

          const networkOptions: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(networkPayload),
            json: true,
          };

          const networkResult = await this.helpers.httpRequest(networkOptions) as any;

          // Get syncing status
          const syncPayload = {
            jsonrpc: '2.0',
            method: 'eth_syncing',
            params: [],
            id: Date.now() + 2,
          };

          const syncOptions: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(syncPayload),
            json: true,
          };

          const syncResult = await this.helpers.httpRequest(syncOptions) as any;

          result = {
            chainId: chainIdResult.result,
            chainIdDecimal: parseInt(chainIdResult.result, 16),
            networkVersion: networkResult.result,
            syncing: syncResult.result,
            networkName: 'Arbitrum One',
          };
          returnData.push({
            json: result,
            pairedItem: { item: i },
          });
          continue;
        }

				default:
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
			}

			const options: any = {
				method: 'POST',
				url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
				headers: {
					'Content-Type': 'application/json',
				},
				body: rpcBody,
				json: true,
			};

			if (credentials.apiKey) {
				options.headers['Authorization'] = `Bearer ${credentials.apiKey}`;
			}

			result = await this.helpers.httpRequest(options) as any;

			if (result.error) {
				throw new NodeApiError(this.getNode(), result.error, {
					message: `Arbitrum API Error: ${result.error.message}`,
				});
			}

			returnData.push({
				json: result.result || result,
				pairedItem: { item: i },
			});

		} catch (error: any) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i },
				});
			} else {
				throw error;
			}
		}
	}

	return returnData;
}

async function executeSmartContractOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('arbitrumApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;

      switch (operation) {
        case 'call': {
          const contractAddress = this.getNodeParameter('contractAddress', i) as string;
          const methodSignature = this.getNodeParameter('methodSignature', i) as string;
          const parameters = this.getNodeParameter('parameters', i, '') as string;
          const fromAddress = this.getNodeParameter('fromAddress', i, '') as string;
          const value = this.getNodeParameter('value', i, '0x0') as string;
          const gasLimit = this.getNodeParameter('gasLimit', i, '') as string;
          const gasPrice = this.getNodeParameter('gasPrice', i, '') as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;

          const transactionObject: any = {
            to: contractAddress,
            data: methodSignature,
          };

          if (fromAddress) transactionObject.from = fromAddress;
          if (value !== '0x0') transactionObject.value = value;
          if (gasLimit) transactionObject.gas = gasLimit;
          if (gasPrice) transactionObject.gasPrice = gasPrice;

          if (parameters) {
            try {
              const parsedParams = JSON.parse(parameters);
              transactionObject.data = methodSignature + JSON.stringify(parsedParams);
            } catch (error: any) {
              throw new NodeOperationError(this.getNode(), `Invalid parameters JSON: ${error.message}`);
            }
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [transactionObject, blockNumber],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'estimateGas': {
          const contractAddress = this.getNodeParameter('contractAddress', i) as string;
          const methodSignature = this.getNodeParameter('methodSignature', i) as string;
          const parameters = this.getNodeParameter('parameters', i, '') as string;
          const fromAddress = this.getNodeParameter('fromAddress', i, '') as string;
          const value = this.getNodeParameter('value', i, '0x0') as string;
          const gasPrice = this.getNodeParameter('gasPrice', i, '') as string;

          const transactionObject: any = {
            to: contractAddress,
            data: methodSignature,
          };

          if (fromAddress) transactionObject.from = fromAddress;
          if (value !== '0x0') transactionObject.value = value;
          if (gasPrice) transactionObject.gasPrice = gasPrice;

          if (parameters) {
            try {
              const parsedParams = JSON.parse(parameters);
              transactionObject.data = methodSignature + JSON.stringify(parsedParams);
            } catch (error: any) {
              throw new NodeOperationError(this.getNode(), `Invalid parameters JSON: ${error.message}`);
            }
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_estimateGas',
            params: [transactionObject],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getLogs': {
          const filterObject = this.getNodeParameter('filterObject', i) as object;

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [filterObject],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getCode': {
          const contractAddress = this.getNodeParameter('contractAddressCode', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i, 'latest') as string;

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [contractAddress, blockNumber],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getStorageAt': {
          const contractAddress = this.getNodeParameter('contractAddressStorage', i) as string;
          const storagePosition = this.getNodeParameter('storagePosition', i) as string;
          const blockNumber = this.getNodeParameter('blockNumberStorage', i, 'latest') as string;

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getStorageAt',
            params: [contractAddress, storagePosition, blockNumber],
            id: 1,
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: JSON.stringify(requestBody),
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      returnData.push({
        json: result,
        pairedItem: { item: i },
      });

    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({
          json: { error: error.message },
          pairedItem: { item: i },
        });
      } else {
        throw error;
      }
    }
  }

  return returnData;
}

async function executeNetworkOperations(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const credentials = await this.getCredentials('arbitrumApi') as any;

  for (let i = 0; i < items.length; i++) {
    try {
      let result: any;
      
      switch (operation) {
        case 'getChainId': {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`
            },
            body: requestBody,
            json: true
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'gasPrice': {
          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1
          };

          const options: any = {
            method: 'POST',
            url: credentials.baseUrl || 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`
            },
            body: requestBody,
            json: true
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'feeHistory': {
          const blockCount = this.getNodeParameter('blockCount', i) as number;
          const newestBlock = this.getNodeParameter('newestBlock', i) as string;
          const rewardPercentilesStr = this.getNodeParameter('rewardPercentiles', i) as string;
          const rewardPercentiles = rewardPercentilesStr.split(',').map(p => parseFloat(p.trim()));

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_feeHistory',