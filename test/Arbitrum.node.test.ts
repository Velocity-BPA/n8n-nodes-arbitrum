/**
 * Copyright (c) 2026 Velocity BPA
 * Licensed under the Business Source License 1.1
 */

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Arbitrum } from '../nodes/Arbitrum/Arbitrum.node';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
  ...jest.requireActual('n8n-workflow'),
  NodeApiError: class NodeApiError extends Error {
    constructor(node: any, error: any) { super(error.message || 'API Error'); }
  },
  NodeOperationError: class NodeOperationError extends Error {
    constructor(node: any, message: string) { super(message); }
  },
}));

describe('Arbitrum Node', () => {
  let node: Arbitrum;

  beforeAll(() => {
    node = new Arbitrum();
  });

  describe('Node Definition', () => {
    it('should have correct basic properties', () => {
      expect(node.description.displayName).toBe('Arbitrum');
      expect(node.description.name).toBe('arbitrum');
      expect(node.description.version).toBe(1);
      expect(node.description.inputs).toContain('main');
      expect(node.description.outputs).toContain('main');
    });

    it('should define 5 resources', () => {
      const resourceProp = node.description.properties.find(
        (p: any) => p.name === 'resource'
      );
      expect(resourceProp).toBeDefined();
      expect(resourceProp!.type).toBe('options');
      expect(resourceProp!.options).toHaveLength(5);
    });

    it('should have operation dropdowns for each resource', () => {
      const operations = node.description.properties.filter(
        (p: any) => p.name === 'operation'
      );
      expect(operations.length).toBe(5);
    });

    it('should require credentials', () => {
      expect(node.description.credentials).toBeDefined();
      expect(node.description.credentials!.length).toBeGreaterThan(0);
      expect(node.description.credentials![0].required).toBe(true);
    });

    it('should have parameters with proper displayOptions', () => {
      const params = node.description.properties.filter(
        (p: any) => p.displayOptions?.show?.resource
      );
      for (const param of params) {
        expect(param.displayOptions.show.resource).toBeDefined();
        expect(Array.isArray(param.displayOptions.show.resource)).toBe(true);
      }
    });
  });

  // Resource-specific tests
describe('Account Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-key',
        baseUrl: 'https://arb1.arbitrum.io/rpc'
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: {
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn()
      },
    };
  });

  test('getBalance operation should return account balance', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getBalance')
      .mockReturnValueOnce('0x742d35Cc64C5b5f7Bc0DE1e8F3Aae8B5C2a9C0B9')
      .mockReturnValueOnce('latest');

    const mockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: '0x1bc16d674ec80000'
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeAccountOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  test('getTransactionCount operation should return nonce', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getTransactionCount')
      .mockReturnValueOnce('0x742d35Cc64C5b5f7Bc0DE1e8F3Aae8B5C2a9C0B9')
      .mockReturnValueOnce('latest');

    const mockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: '0x5'
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeAccountOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  test('getCode operation should return contract bytecode', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getCode')
      .mockReturnValueOnce('0x742d35Cc64C5b5f7Bc0DE1e8F3Aae8B5C2a9C0B9')
      .mockReturnValueOnce('latest');

    const mockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: '0x608060405234801561001057600080fd5b50...'
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeAccountOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  test('getStorageAt operation should return storage value', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getStorageAt')
      .mockReturnValueOnce('0x742d35Cc64C5b5f7Bc0DE1e8F3Aae8B5C2a9C0B9')
      .mockReturnValueOnce('0x0')
      .mockReturnValueOnce('latest');

    const mockResponse = {
      jsonrpc: '2.0',
      id: 1,
      result: '0x000000000000000000000000000000000000000000000000000000000000002a'
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

    const result = await executeAccountOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockResponse);
  });

  test('should handle API errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter
      .mockReturnValueOnce('getBalance')
      .mockReturnValueOnce('0x742d35Cc64C5b5f7Bc0DE1e8F3Aae8B5C2a9C0B9')
      .mockReturnValueOnce('latest');

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API Error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeAccountOperations.call(
      mockExecuteFunctions,
      [{ json: {} }]
    );

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('API Error');
  });

  test('should throw error for unknown operation', async () => {
    mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('unknownOperation');

    await expect(
      executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Unknown operation: unknownOperation');
  });
});

describe('Transaction Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://arb1.arbitrum.io/rpc' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  test('sendRawTransaction operation should broadcast transaction', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'sendRawTransaction';
      if (param === 'signedTransactionData') return '0xf86c808504a817c800825208943535353535353535353535353535353535353535880de0b6b3a76400008025a04f4c17305743700648bc4f6cd3038ec6f6af0df73e31757d3aa2e484b7382291a04f4c17305743700648bc4f6cd3038ec6f6af0df73e31757d3aa2e484b7382291';
      return '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: '0x1234567890abcdef'
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('0x1234567890abcdef');
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://arb1.arbitrum.io/rpc',
      })
    );
  });

  test('getTransaction operation should retrieve transaction details', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getTransaction';
      if (param === 'transactionHash') return '0x1234567890abcdef';
      return '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { hash: '0x1234567890abcdef', value: '0x1000' }
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.result.hash).toBe('0x1234567890abcdef');
  });

  test('getTransactionReceipt operation should retrieve transaction receipt', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getTransactionReceipt';
      if (param === 'transactionHash') return '0x1234567890abcdef';
      return '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: { transactionHash: '0x1234567890abcdef', status: '0x1' }
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.result.status).toBe('0x1');
  });

  test('estimateGas operation should return gas estimate', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'estimateGas';
      if (param === 'transactionObject') return { to: '0x1234', value: '0x1000' };
      return '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: '0x5208'
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('0x5208');
  });

  test('should handle errors gracefully when continueOnFail is true', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getTransaction';
      if (param === 'transactionHash') return '0x1234567890abcdef';
      return '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('Network error');
  });

  test('should throw error when continueOnFail is false', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getTransaction';
      if (param === 'transactionHash') return '0x1234567890abcdef';
      return '';
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
    mockExecuteFunctions.continueOnFail.mockReturnValue(false);

    await expect(executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow('Network error');
  });
});

describe('Block Resource', () => {
	let mockExecuteFunctions: any;

	beforeEach(() => {
		mockExecuteFunctions = {
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				baseUrl: 'https://arb1.arbitrum.io/rpc',
			}),
			getInputData: jest.fn().mockReturnValue([{ json: {} }]),
			getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
			continueOnFail: jest.fn().mockReturnValue(false),
			helpers: {
				httpRequest: jest.fn(),
				requestWithAuthentication: jest.fn(),
			},
		};
	});

	it('should get block number successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getBlockNumber');
		
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			result: '0x10d4f',
		});

		const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toHaveLength(1);
		expect(result[0].json).toBe('0x10d4f');
		expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://arb1.arbitrum.io/rpc',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer test-key',
			},
			body: {
				jsonrpc: '2.0',
				method: 'eth_blockNumber',
				params: [],
				id: 1,
			},
			json: true,
		});
	});

	it('should get block by hash successfully', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getBlockByHash')
			.mockReturnValueOnce('0x1234567890abcdef')
			.mockReturnValueOnce(true);
		
		const mockBlock = {
			number: '0x10d4f',
			hash: '0x1234567890abcdef',
			transactions: [],
		};
		
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			result: mockBlock,
		});

		const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toHaveLength(1);
		expect(result[0].json).toEqual(mockBlock);
	});

	it('should handle API errors', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getBlockNumber');
		
		mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
			error: {
				code: -32602,
				message: 'Invalid params',
			},
		});

		await expect(
			executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }])
		).rejects.toThrow('Arbitrum API Error: Invalid params');
	});

	it('should continue on fail when configured', async () => {
		mockExecuteFunctions.getNodeParameter
			.mockReturnValueOnce('getBlockNumber');
		mockExecuteFunctions.continueOnFail.mockReturnValue(true);
		
		mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

		const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

		expect(result).toHaveLength(1);
		expect(result[0].json).toEqual({ error: 'Network error' });
	});
});

describe('SmartContract Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://arb1.arbitrum.io/rpc' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  describe('call operation', () => {
    it('should successfully call contract method', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('call')
        .mockReturnValueOnce('0x1234567890123456789012345678901234567890')
        .mockReturnValueOnce('balanceOf(address)')
        .mockReturnValueOnce('["0x1234567890123456789012345678901234567890"]')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('0x0')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0x00000000000000000000000000000000000000000000000000000de0b6b3a7640000'
      });

      const result = await executeSmartContractOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBeDefined();
    });

    it('should handle call operation errors', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValueOnce('call');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeSmartContractOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result[0].json.error).toEqual('Network error');
    });
  });

  describe('estimateGas operation', () => {
    it('should successfully estimate gas', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('estimateGas')
        .mockReturnValueOnce('0x1234567890123456789012345678901234567890')
        .mockReturnValueOnce('transfer(address,uint256)')
        .mockReturnValueOnce('["0x1234567890123456789012345678901234567890", "1000"]')
        .mockReturnValueOnce('0x1111111111111111111111111111111111111111')
        .mockReturnValueOnce('0x0')
        .mockReturnValueOnce('')
        .mockReturnValueOnce('');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0x5208'
      });

      const result = await executeSmartContractOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBe('0x5208');
    });
  });

  describe('getLogs operation', () => {
    it('should successfully get contract logs', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getLogs')
        .mockReturnValueOnce({
          address: '0x1234567890123456789012345678901234567890',
          fromBlock: 'earliest',
          toBlock: 'latest'
        });

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: [
          {
            address: '0x1234567890123456789012345678901234567890',
            topics: ['0x...'],
            data: '0x...',
            blockNumber: '0x...'
          }
        ]
      });

      const result = await executeSmartContractOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toHaveLength(1);
      expect(Array.isArray(result[0].json.result)).toBe(true);
    });
  });

  describe('getCode operation', () => {
    it('should successfully get contract code', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getCode')
        .mockReturnValueOnce('0x1234567890123456789012345678901234567890')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0x608060405234801561001057600080fd5b50...'
      });

      const result = await executeSmartContractOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toMatch(/^0x/);
    });
  });

  describe('getStorageAt operation', () => {
    it('should successfully get storage value', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('getStorageAt')
        .mockReturnValueOnce('0x1234567890123456789012345678901234567890')
        .mockReturnValueOnce('0x0')
        .mockReturnValueOnce('latest');

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0x0000000000000000000000000000000000000000000000000000000000000001'
      });

      const result = await executeSmartContractOperations.call(
        mockExecuteFunctions,
        [{ json: {} }]
      );

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toMatch(/^0x/);
    });
  });
});

describe('Network Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({ 
        apiKey: 'test-key', 
        baseUrl: 'https://arb1.arbitrum.io/rpc' 
      }),
      getInputData: jest.fn().mockReturnValue([{ json: {} }]),
      getNode: jest.fn().mockReturnValue({ name: 'Test Node' }),
      continueOnFail: jest.fn().mockReturnValue(false),
      helpers: { 
        httpRequest: jest.fn(),
        requestWithAuthentication: jest.fn() 
      },
    };
  });

  describe('getChainId operation', () => {
    it('should get chain ID successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('getChainId');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0xa4b1'
      });

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBe('0xa4b1');
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://arb1.arbitrum.io/rpc',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        },
        body: {
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        },
        json: true
      });
    });

    it('should handle getChainId error', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('getChainId');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result[0].json.error).toBe('Network error');
    });
  });

  describe('gasPrice operation', () => {
    it('should get gas price successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('gasPrice');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0x174876e800'
      });

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBe('0x174876e800');
    });

    it('should handle gasPrice error', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('gasPrice');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('API error'));
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result[0].json.error).toBe('API error');
    });
  });

  describe('feeHistory operation', () => {
    it('should get fee history successfully', async () => {
      mockExecuteFunctions.getNodeParameter
        .mockReturnValueOnce('feeHistory')
        .mockReturnValueOnce(10)
        .mockReturnValueOnce('latest')
        .mockReturnValueOnce('25,50,75');
      
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: {
          baseFeePerGas: ['0x1', '0x2'],
          gasUsedRatio: [0.5, 0.6],
          reward: [['0x1', '0x2', '0x3']]
        }
      });

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://arb1.arbitrum.io/rpc',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-key'
        },
        body: {
          jsonrpc: '2.0',
          method: 'eth_feeHistory',
          params: [10, 'latest', [25, 50, 75]],
          id: 1
        },
        json: true
      });
    });
  });

  describe('maxPriorityFeePerGas operation', () => {
    it('should get max priority fee per gas successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('maxPriorityFeePerGas');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: '0x59682f00'
      });

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBe('0x59682f00');
    });
  });

  describe('syncing operation', () => {
    it('should get syncing status successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('syncing');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: false
      });

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBe(false);
    });
  });

  describe('clientVersion operation', () => {
    it('should get client version successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockReturnValue('clientVersion');
      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
        jsonrpc: '2.0',
        id: 1,
        result: 'Geth/v1.10.0-stable/linux-amd64/go1.16.2'
      });

      const result = await executeNetworkOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json.result).toBe('Geth/v1.10.0-stable/linux-amd64/go1.16.2');
    });
  });
});
});
