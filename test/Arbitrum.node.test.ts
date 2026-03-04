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
describe('Bridge Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
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

  describe('depositEth operation', () => {
    it('should deposit ETH successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'depositEth';
        if (param === 'amount') return '1000000000000000000';
        if (param === 'recipient') return '0x742d35Cc6635C0532925a3b8D654E8f');
        return '';
      });

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567890abcdef',
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeBridgeOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://arb1.arbitrum.io/rpc',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key',
        },
        json: true,
        body: {
          jsonrpc: '2.0',
          method: 'eth_sendTransaction',
          params: [{
            to: '0x742d35Cc6635C0532925a3b8D654E8f',
            value: '1000000000000000000',
            data: '0x',
          }],
          id: 1,
        },
      });
    });
  });

  describe('withdrawEth operation', () => {
    it('should withdraw ETH successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'withdrawEth';
        if (param === 'amount') return '1000000000000000000';
        if (param === 'recipient') return '0x742d35Cc6635C0532925a3b8D654E8f';
        return '';
      });

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567890abcdef',
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeBridgeOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });
  });

  describe('depositToken operation', () => {
    it('should deposit tokens successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'depositToken';
        if (param === 'tokenAddress') return '0xA0b86991c431D24c0f4F5c4e';
        if (param === 'amount') return '1000000';
        if (param === 'recipient') return '0x742d35Cc6635C0532925a3b8D654E8f';
        return '';
      });

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: '0x1234567890abcdef',
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeBridgeOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });
  });

  describe('getDepositStatus operation', () => {
    it('should get deposit status successfully', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'getDepositStatus';
        if (param === 'txHash') return '0x1234567890abcdef';
        return '';
      });

      const mockResponse = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          status: '0x1',
          transactionHash: '0x1234567890abcdef',
          blockNumber: '0x123456',
        },
      };

      mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockResponse);

      const result = await executeBridgeOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle API errors correctly', async () => {
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'depositEth';
        return '';
      });

      const mockError = new Error('API Error');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(mockError);

      await expect(executeBridgeOperations.call(mockExecuteFunctions, [{ json: {} }])).rejects.toThrow();
    });

    it('should continue on fail when configured', async () => {
      mockExecuteFunctions.continueOnFail.mockReturnValue(true);
      mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
        if (param === 'operation') return 'depositEth';
        return '';
      });

      const mockError = new Error('API Error');
      mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(mockError);

      const result = await executeBridgeOperations.call(mockExecuteFunctions, [{ json: {} }]);

      expect(result).toHaveLength(1);
      expect(result[0].json).toEqual({ error: 'API Error' });
    });
  });
});

describe('Transaction Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
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

  test('should send transaction successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      const params: any = {
        operation: 'sendTransaction',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0x1000000000000000000',
        data: '0x',
        gasLimit: '0x5208',
      };
      return params[paramName];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
  });

  test('should get transaction details successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      const params: any = {
        operation: 'getTransaction',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };
      return params[paramName];
    });

    const mockTransaction = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0x1000000000000000000',
        gas: '0x5208',
        gasPrice: '0x4a817c800',
        nonce: '0x1',
      },
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockTransaction);

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result.hash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
  });

  test('should estimate gas successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      const params: any = {
        operation: 'estimateGas',
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        value: '0x1000000000000000000',
        data: '0x',
      };
      return params[paramName];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: '0x5208',
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('0x5208');
  });

  test('should get transaction count successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      const params: any = {
        operation: 'getTransactionCount',
        address: '0x1234567890123456789012345678901234567890',
        blockNumber: 'latest',
      };
      return params[paramName];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      result: '0x1a',
    });

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.result).toBe('0x1a');
  });

  test('should handle API errors', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      const params: any = {
        operation: 'getTransaction',
        transactionHash: 'invalid-hash',
      };
      return params[paramName];
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue({
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32602,
        message: 'Invalid transaction hash',
      },
    });

    await expect(
      executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow();
  });

  test('should handle network errors with continueOnFail', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      const params: any = {
        operation: 'getTransaction',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };
      return params[paramName];
    });

    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

    const result = await executeTransactionOperations.call(mockExecuteFunctions, [{ json: {} }]);
    
    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('Network error');
  });
});

describe('Account Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
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

  it('should get ETH balance successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getBalance';
      if (param === 'address') return '0x742d35Cc6635C0532925a3b8D357Fc8ded0E0a8c';
      if (param === 'blockNumber') return 'latest';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: '0xde0b6b3a7640000'
    }));

    const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toHaveProperty('address');
    expect(result[0].json).toHaveProperty('balance');
    expect(result[0].json).toHaveProperty('balanceInEth');
  });

  it('should get token balance successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getTokenBalance';
      if (param === 'tokenAddress') return '0x912CE59144191C1204E64559FE8253a0e49E6548';
      if (param === 'holderAddress') return '0x742d35Cc6635C0532925a3b8D357Fc8ded0E0a8c';
      if (param === 'tokenBlockNumber') return 'latest';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: '0x1bc16d674ec80000'
    }));

    const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toHaveProperty('tokenAddress');
    expect(result[0].json).toHaveProperty('holderAddress');
    expect(result[0].json).toHaveProperty('balance');
    expect(result[0].json).toHaveProperty('balanceDecimal');
  });

  it('should get account nonce successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getAccountNonce';
      if (param === 'address') return '0x742d35Cc6635C0532925a3b8D357Fc8ded0E0a8c';
      if (param === 'blockNumber') return 'latest';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: '0x42'
    }));

    const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toHaveProperty('address');
    expect(result[0].json).toHaveProperty('nonce');
    expect(result[0].json).toHaveProperty('nonceDecimal');
    expect(result[0].json.nonceDecimal).toBe(66);
  });

  it('should check if address is contract successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'isContract';
      if (param === 'address') return '0x912CE59144191C1204E64559FE8253a0e49E6548';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      result: '0x608060405234801561001057600080fd5b50600436106100365760003560e01c'
    }));

    const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toHaveProperty('address');
    expect(result[0].json).toHaveProperty('isContract');
    expect(result[0].json).toHaveProperty('code');
    expect(result[0].json.isContract).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getBalance';
      if (param === 'address') return 'invalid-address';
      if (param === 'blockNumber') return 'latest';
    });

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      error: {
        code: -32602,
        message: 'Invalid address'
      }
    }));

    await expect(executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]))
      .rejects.toThrow();
  });

  it('should handle continue on fail', async () => {
    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.getNodeParameter.mockImplementation((param: string) => {
      if (param === 'operation') return 'getBalance';
      if (param === 'address') return 'invalid-address';
      if (param === 'blockNumber') return 'latest';
    });

    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

    const result = await executeAccountOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toHaveProperty('error');
    expect(result[0].json.error).toBe('Network error');
  });
});

describe('Block Resource', () => {
  let mockExecuteFunctions: any;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getCredentials: jest.fn().mockResolvedValue({
        apiKey: 'test-api-key',
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

  test('should get block by number successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getBlock';
        case 'blockIdentifier': return '0x12345';
        case 'includeTransactions': return false;
        default: return undefined;
      }
    });

    const mockBlockData = {
      result: {
        number: '0x12345',
        hash: '0xabcdef',
        transactions: ['0xtx1', '0xtx2'],
        timestamp: '0x123456789',
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockBlockData);

    const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockBlockData.result);
    expect(mockExecuteFunctions.helpers.httpRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: 'https://arb1.arbitrum.io/rpc',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['0x12345', false],
        id: expect.any(Number),
      }),
      json: true,
    });
  });

  test('should get latest block successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getLatestBlock';
        case 'includeTransactions': return true;
        default: return undefined;
      }
    });

    const mockLatestBlock = {
      result: {
        number: '0x98765',
        hash: '0xlatest',
        transactions: [{ hash: '0xtxfull' }],
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockLatestBlock);

    const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual(mockLatestBlock.result);
  });

  test('should get block number successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getBlockNumber';
        default: return undefined;
      }
    });

    const mockBlockNumber = {
      result: '0x12345'
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockBlockNumber);

    const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual({
      blockNumber: '0x12345',
      blockNumberDecimal: 74565,
    });
  });

  test('should get block transactions successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getBlockTransactions';
        case 'blockIdentifier': return '0x12345';
        default: return undefined;
      }
    });

    const mockBlockWithTxs = {
      result: {
        number: '0x12345',
        hash: '0xblockhash',
        transactions: [
          { hash: '0xtx1', from: '0xfrom1' },
          { hash: '0xtx2', from: '0xfrom2' },
        ]
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockBlockWithTxs);

    const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.transactions).toHaveLength(2);
    expect(result[0].json.transactionCount).toBe(2);
  });

  test('should get network info successfully', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getNetworkInfo';
        default: return undefined;
      }
    });

    mockExecuteFunctions.helpers.httpRequest
      .mockResolvedValueOnce({ result: '0xa4b1' }) // chainId
      .mockResolvedValueOnce({ result: '42161' }) // network version
      .mockResolvedValueOnce({ result: false }); // syncing

    const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json).toEqual({
      chainId: '0xa4b1',
      chainIdDecimal: 42161,
      networkVersion: '42161',
      syncing: false,
      networkName: 'Arbitrum One',
    });
  });

  test('should handle API errors', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getBlock';
        case 'blockIdentifier': return '0xinvalid';
        case 'includeTransactions': return false;
        default: return undefined;
      }
    });

    const mockError = {
      error: {
        code: -32602,
        message: 'Invalid params'
      }
    };

    mockExecuteFunctions.helpers.httpRequest.mockResolvedValue(mockError);

    await expect(
      executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }])
    ).rejects.toThrow('Invalid params');
  });

  test('should continue on fail when configured', async () => {
    mockExecuteFunctions.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case 'operation': return 'getBlock';
        case 'blockIdentifier': return '0xinvalid';
        case 'includeTransactions': return false;
        default: return undefined;
      }
    });

    mockExecuteFunctions.continueOnFail.mockReturnValue(true);
    mockExecuteFunctions.helpers.httpRequest.mockRejectedValue(new Error('Network error'));

    const result = await executeBlockOperations.call(mockExecuteFunctions, [{ json: {} }]);

    expect(result).toHaveLength(1);
    expect(result[0].json.error).toBe('Network error');
  });
});
});
