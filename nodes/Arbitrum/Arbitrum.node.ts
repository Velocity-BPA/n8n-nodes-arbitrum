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
      // Resource selector
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Bridge',
            value: 'bridge',
          },
          {
            name: 'Transaction',
            value: 'transaction',
          },
          {
            name: 'unknown',
            value: 'unknown',
          },
          {
            name: 'Account',
            value: 'account',
          },
          {
            name: 'Block',
            value: 'block',
          }
        ],
        default: 'bridge',
      },
      // Operation dropdowns per resource
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
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['transaction'],
    },
  },
  options: [
    {
      name: 'Send Transaction',
      value: 'sendTransaction',
      description: 'Send a transaction to the network',
      action: 'Send transaction',
    },
    {
      name: 'Get Transaction',
      value: 'getTransaction',
      description: 'Get transaction details by hash',
      action: 'Get transaction',
    },
    {
      name: 'Get Transaction Receipt',
      value: 'getTransactionReceipt',
      description: 'Get transaction receipt',
      action: 'Get transaction receipt',
    },
    {
      name: 'Estimate Gas',
      value: 'estimateGas',
      description: 'Estimate gas for transaction',
      action: 'Estimate gas',
    },
    {
      name: 'Get Transaction Count',
      value: 'getTransactionCount',
      description: 'Get nonce for address',
      action: 'Get transaction count',
    },
  ],
  default: 'sendTransaction',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['account'],
    },
  },
  options: [
    {
      name: 'Get Balance',
      value: 'getBalance',
      description: 'Get ETH balance of address',
      action: 'Get ETH balance',
    },
    {
      name: 'Get Token Balance',
      value: 'getTokenBalance',
      description: 'Get ERC20 token balance',
      action: 'Get token balance',
    },
    {
      name: 'Get Account Transactions',
      value: 'getAccountTransactions',
      description: 'Get transaction history for address',
      action: 'Get account transactions',
    },
    {
      name: 'Get Account Nonce',
      value: 'getAccountNonce',
      description: 'Get current nonce for address',
      action: 'Get account nonce',
    },
    {
      name: 'Is Contract',
      value: 'isContract',
      description: 'Check if address is a contract',
      action: 'Check if contract',
    },
  ],
  default: 'getBalance',
},
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['block'],
    },
  },
  options: [
    {
      name: 'Get Block',
      value: 'getBlock',
      description: 'Get block by number or hash',
      action: 'Get block',
    },
    {
      name: 'Get Latest Block',
      value: 'getLatestBlock',
      description: 'Get latest block information',
      action: 'Get latest block',
    },
    {
      name: 'Get Block Number',
      value: 'getBlockNumber',
      description: 'Get current block number',
      action: 'Get block number',
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
  default: 'getBlock',
},
      // Parameter definitions
{
  displayName: 'Amount',
  name: 'amount',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['depositEth', 'withdrawEth'],
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
      operation: ['depositEth', 'withdrawEth'],
    },
  },
  default: '',
  description: 'Recipient address for the transfer',
},
{
  displayName: 'Token Address',
  name: 'tokenAddress',
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
  displayName: 'Amount',
  name: 'amount',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['depositToken', 'withdrawToken'],
    },
  },
  default: '',
  description: 'Amount of tokens to transfer',
},
{
  displayName: 'Recipient',
  name: 'recipient',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['bridge'],
      operation: ['depositToken', 'withdrawToken'],
    },
  },
  default: '',
  description: 'Recipient address for the transfer',
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
{
  displayName: 'From Address',
  name: 'from',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['sendTransaction', 'estimateGas'],
    },
  },
  default: '',
  description: 'The sender address',
},
{
  displayName: 'To Address',
  name: 'to',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['sendTransaction', 'estimateGas'],
    },
  },
  default: '',
  description: 'The recipient address',
},
{
  displayName: 'Value',
  name: 'value',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['sendTransaction', 'estimateGas'],
    },
  },
  default: '0x0',
  description: 'The value to send in wei (hex format)',
},
{
  displayName: 'Data',
  name: 'data',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['sendTransaction', 'estimateGas'],
    },
  },
  default: '0x',
  description: 'Transaction data (hex format)',
},
{
  displayName: 'Gas Limit',
  name: 'gasLimit',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['sendTransaction'],
    },
  },
  default: '',
  description: 'Gas limit for the transaction (hex format)',
},
{
  displayName: 'Transaction Hash',
  name: 'transactionHash',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['getTransaction', 'getTransactionReceipt'],
    },
  },
  default: '',
  description: 'The transaction hash to query',
},
{
  displayName: 'Address',
  name: 'address',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['getTransactionCount'],
    },
  },
  default: '',
  description: 'The address to get transaction count for',
},
{
  displayName: 'Block Number',
  name: 'blockNumber',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['transaction'],
      operation: ['getTransactionCount'],
    },
  },
  default: 'latest',
  description: 'The block number or tag (latest, pending, earliest)',
},
{
  displayName: 'Address',
  name: 'address',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getBalance', 'getAccountTransactions', 'getAccountNonce', 'isContract'],
    },
  },
  default: '',
  description: 'The account address to query',
},
{
  displayName: 'Block Number',
  name: 'blockNumber',
  type: 'string',
  required: false,
  displayOptions: {
    show: {
      resource: ['account'],
      operation: ['getBalance', 'getAccountNonce'],
    },
  },
  default: 'latest',
  description: 'Block number to query (latest, earliest, pending, or hex number)',
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
  displayName: 'Block Identifier',
  name: 'blockIdentifier',
  type: 'string',
  required: true,
  displayOptions: {
    show: {
      resource: ['block'],
      operation: ['getBlock'],
    },
  },
  default: '',
  description: 'Block number (hex or decimal) or block hash',
  placeholder: '0x123abc or latest',
},
{
  displayName: 'Include Transactions',
  name: 'includeTransactions',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['block'],
      operation: ['getBlock'],
    },
  },
  default: false,
  description: 'Whether to include full transaction data or just transaction hashes',
},
{
  displayName: 'Include Transactions',
  name: 'includeTransactions',
  type: 'boolean',
  displayOptions: {
    show: {
      resource: ['block'],
      operation: ['getLatestBlock'],
    },
  },
  default: false,
  description: 'Whether to include full transaction data or just transaction hashes',
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const resource = this.getNodeParameter('resource', 0) as string;

    switch (resource) {
      case 'bridge':
        return [await executeBridgeOperations.call(this, items)];
      case 'transaction':
        return [await executeTransactionOperations.call(this, items)];
      case 'unknown':
        return [await executeunknownOperations.call(this, items)];
      case 'account':
        return [await executeAccountOperations.call(this, items)];
      case 'block':
        return [await executeBlockOperations.call(this, items)];
      default:
        throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not supported`);
    }
  }
}

// ============================================================
// Resource Handler Functions
// ============================================================

async function executeBridgeOperations(
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
        case 'depositEth': {
          const amount = this.getNodeParameter('amount', i) as string;
          const recipient = this.getNodeParameter('recipient', i) as string;
          
          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
            body: {
              jsonrpc: '2.0',
              method: 'eth_sendTransaction',
              params: [{
                to: recipient,
                value: amount,
                data: '0x',
              }],
              id: 1,
            },
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'withdrawEth': {
          const amount = this.getNodeParameter('amount', i) as string;
          const recipient = this.getNodeParameter('recipient', i) as string;
          
          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
            body: {
              jsonrpc: '2.0',
              method: 'arb_withdrawEth',
              params: [{
                amount: amount,
                destination: recipient,
              }],
              id: 1,
            },
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'depositToken': {
          const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
          const amount = this.getNodeParameter('amount', i) as string;
          const recipient = this.getNodeParameter('recipient', i) as string;
          
          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
            body: {
              jsonrpc: '2.0',
              method: 'arb_depositToken',
              params: [{
                tokenAddress: tokenAddress,
                amount: amount,
                recipient: recipient,
              }],
              id: 1,
            },
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'withdrawToken': {
          const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;
          const amount = this.getNodeParameter('amount', i) as string;
          const recipient = this.getNodeParameter('recipient', i) as string;
          
          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
            body: {
              jsonrpc: '2.0',
              method: 'arb_withdrawToken',
              params: [{
                tokenAddress: tokenAddress,
                amount: amount,
                destination: recipient,
              }],
              id: 1,
            },
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        case 'getDepositStatus': {
          const txHash = this.getNodeParameter('txHash', i) as string;
          
          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
            body: {
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [txHash],
              id: 1,
            },
          };
          
          result = await this.helpers.httpRequest(options) as any;
          break;
        }
        
        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }
      
      returnData.push({ json: result, pairedItem: { item: i } });
    } catch (error: any) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
      } else {
        throw new NodeApiError(this.getNode(), error);
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
        case 'sendTransaction': {
          const from = this.getNodeParameter('from', i) as string;
          const to = this.getNodeParameter('to', i) as string;
          const value = this.getNodeParameter('value', i) as string;
          const data = this.getNodeParameter('data', i) as string;
          const gasLimit = this.getNodeParameter('gasLimit', i) as string;

          const params: any = {
            from,
            to,
            value,
            data,
          };

          if (gasLimit) {
            params.gas = gasLimit;
          }

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_sendTransaction',
              params: [params],
              id: 1,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTransaction': {
          const transactionHash = this.getNodeParameter('transactionHash', i) as string;

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_getTransactionByHash',
              params: [transactionHash],
              id: 1,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTransactionReceipt': {
          const transactionHash = this.getNodeParameter('transactionHash', i) as string;

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [transactionHash],
              id: 1,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'estimateGas': {
          const from = this.getNodeParameter('from', i) as string;
          const to = this.getNodeParameter('to', i) as string;
          const value = this.getNodeParameter('value', i) as string;
          const data = this.getNodeParameter('data', i) as string;

          const params: any = {
            from,
            to,
            value,
            data,
          };

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_estimateGas',
              params: [params],
              id: 1,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        case 'getTransactionCount': {
          const address = this.getNodeParameter('address', i) as string;
          const blockNumber = this.getNodeParameter('blockNumber', i) as string;

          const options: any = {
            method: 'POST',
            url: 'https://arb1.arbitrum.io/rpc',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: {
              jsonrpc: '2.0',
              method: 'eth_getTransactionCount',
              params: [address, blockNumber],
              id: 1,
            },
            json: true,
          };

          result = await this.helpers.httpRequest(options) as any;
          break;
        }

        default:
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
      }

      if (result.error) {
        throw new NodeApiError(this.getNode(), result.error);
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

// PARSE ERROR for unknown — manual fix needed
// Raw: // No additional imports

{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['smartContract'],
    },
  },
  options: [
    {
      name: 'Deploy Contract',
      value: 'deployContract',
      description:

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
          const blockNumber = this.getNodeParameter('blockNumber', i) as string;
          
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
      
      switch (operation) {
        case 'getBlock': {
          const blockIdentifier = this.getNodeParameter('blockIdentifier', i) as string;
          const includeTransactions = this.getNodeParameter('includeTransactions', i) as boolean;
          
          const rpcPayload = {
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [formatBlockIdentifier(blockIdentifier), includeTransactions],
            id: Date.now(),
          };

          // If blockIdentifier looks like a hash, use eth_getBlockByHash instead
          if (blockIdentifier.startsWith('0x') && blockIdentifier.length === 66) {
            rpcPayload.method = 'eth_getBlockByHash';
          }

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
          break;
        }

        case 'getLatestBlock': {
          const includeTransactions = this.getNodeParameter('includeTransactions', i) as boolean;
          
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
          break;
        }

        case 'getBlockNumber': {
          const rpcPayload = {
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
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
          
          result = {
            blockNumber: result.result,
            blockNumberDecimal: parseInt(result.result, 16),
          };
          break;
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
          break;
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

          const chainIdResult = await this.helpers.httpRequest(chainIdOptions) as any;

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

function formatBlockIdentifier(identifier: string): string {
  // If it's a number, convert to hex
  if (/^\d+$/.test(identifier)) {
    return '0x' + parseInt(identifier, 10).toString(16);
  }
  
  // If it's already hex or a special value like 'latest', 'earliest', 'pending'
  if (identifier.startsWith('0x') || ['latest', 'earliest', 'pending'].includes(identifier)) {
    return identifier;
  }
  
  // Default to latest if unclear
  return 'latest';
}
