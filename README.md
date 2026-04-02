# n8n-nodes-arbitrum

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for interacting with Arbitrum blockchain networks. This node provides access to 5 core resources (Account, Transaction, Block, SmartContract, Network) with extensive operations for querying balances, transaction data, smart contract interactions, and network statistics across Arbitrum One and Arbitrum Nova.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Arbitrum](https://img.shields.io/badge/Arbitrum-Layer%202-blue)
![Web3](https://img.shields.io/badge/Web3-Ethereum-green)
![DeFi](https://img.shields.io/badge/DeFi-Compatible-orange)

## Features

- **Account Management** - Query account balances, transaction history, and token holdings across Arbitrum networks
- **Transaction Operations** - Send transactions, check status, estimate gas fees, and retrieve detailed transaction data
- **Block Data Access** - Fetch block information, transaction lists, and blockchain statistics
- **Smart Contract Integration** - Read contract state, execute functions, deploy contracts, and monitor events
- **Network Utilities** - Access network information, gas pricing, and chain statistics
- **Multi-Network Support** - Compatible with Arbitrum One, Arbitrum Nova, and testnets
- **Comprehensive Error Handling** - Detailed error messages and retry mechanisms for robust automation
- **Type Safety** - Full TypeScript implementation with proper type definitions

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-arbitrum`
5. Click **Install**

### Manual Installation

```bash
cd ~/.n8n
npm install n8n-nodes-arbitrum
```

### Development Installation

```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-arbitrum.git
cd n8n-nodes-arbitrum
npm install
npm run build
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-arbitrum
n8n start
```

## Credentials Setup

| Field | Description | Required |
|-------|-------------|----------|
| API Key | Arbitrum RPC endpoint API key or Infura/Alchemy key | Yes |
| Network | Target Arbitrum network (arbitrum-one, arbitrum-nova, arbitrum-goerli) | Yes |
| RPC URL | Custom RPC endpoint URL (optional if using standard networks) | No |

## Resources & Operations

### 1. Account

| Operation | Description |
|-----------|-------------|
| Get Balance | Retrieve ETH balance for an account |
| Get Token Balance | Get ERC-20 token balance for an account |
| Get Transaction Count | Fetch nonce/transaction count for an account |
| Get Transaction History | List transactions for an account with pagination |
| Get Code | Retrieve contract bytecode for an account |
| Get Storage | Read storage slots from an account |

### 2. Transaction

| Operation | Description |
|-----------|-------------|
| Send Transaction | Submit a new transaction to the network |
| Get Transaction | Retrieve transaction details by hash |
| Get Receipt | Get transaction receipt and status |
| Estimate Gas | Calculate gas requirements for a transaction |
| Get Gas Price | Fetch current gas price recommendations |
| Wait for Confirmation | Poll until transaction is confirmed |
| Trace Transaction | Get detailed execution trace |

### 3. Block

| Operation | Description |
|-----------|-------------|
| Get Block | Retrieve block data by number or hash |
| Get Latest Block | Fetch the most recent block |
| Get Block Range | Get multiple blocks within a specified range |
| Get Uncle Count | Count uncle blocks for a given block |
| Search Blocks | Find blocks matching specific criteria |
| Get Block Transactions | List all transactions in a block |

### 4. SmartContract

| Operation | Description |
|-----------|-------------|
| Call Function | Execute a read-only contract function |
| Send Function | Execute a state-changing contract function |
| Deploy Contract | Deploy a new smart contract |
| Get Events | Query contract events with filtering |
| Encode Function Data | Encode function call data |
| Decode Function Result | Decode function return values |
| Get Contract Info | Retrieve contract metadata and ABI |

### 5. Network

| Operation | Description |
|-----------|-------------|
| Get Network Info | Fetch network details and chain ID |
| Get Peer Count | Get number of connected peers |
| Get Sync Status | Check network synchronization status |
| Get Protocol Version | Retrieve network protocol version |
| Get Mining Status | Check if network is mining/validating |
| Get Hash Rate | Get current network hash rate |
| Get Chain Stats | Comprehensive network statistics |

## Usage Examples

```javascript
// Get account balance
{
  "resource": "account",
  "operation": "getBalance",
  "address": "0x742d35Cc6634C0532925a3b8D5C9E1C8b0F2b0e8",
  "blockTag": "latest"
}
```

```javascript
// Send ETH transaction
{
  "resource": "transaction",
  "operation": "sendTransaction",
  "to": "0x742d35Cc6634C0532925a3b8D5C9E1C8b0F2b0e8",
  "value": "0.1",
  "gasLimit": "21000",
  "gasPrice": "0.5"
}
```

```javascript
// Call smart contract function
{
  "resource": "smartContract",
  "operation": "callFunction",
  "contractAddress": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
  "functionName": "balanceOf",
  "inputs": ["0x742d35Cc6634C0532925a3b8D5C9E1C8b0F2b0e8"]
}
```

```javascript
// Get latest block information
{
  "resource": "block",
  "operation": "getLatestBlock",
  "includeTransactions": true
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Invalid API Key | Authentication failed with RPC provider | Verify API key and network configuration |
| Insufficient Funds | Account balance too low for transaction | Check account balance and reduce transaction amount |
| Gas Limit Too Low | Transaction requires more gas than specified | Increase gas limit or use gas estimation |
| Contract Not Found | Smart contract does not exist at address | Verify contract address and network |
| Network Timeout | RPC request timed out | Check network connection and try again |
| Invalid Parameters | Function parameters don't match ABI | Verify function signature and parameter types |

## Development

```bash
npm install
npm run build
npm test
npm run lint
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

Contributions are welcome! Please ensure:

1. Code follows existing style conventions
2. All tests pass (`npm test`)
3. Linting passes (`npm run lint`)
4. Documentation is updated for new features
5. Commit messages are descriptive

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-arbitrum/issues)
- **Arbitrum Documentation**: [Arbitrum Developer Docs](https://developer.arbitrum.io/)
- **Arbitrum Community**: [Arbitrum Discord](https://discord.gg/arbitrum)