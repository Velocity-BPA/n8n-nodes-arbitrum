# n8n-nodes-arbitrum

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for interacting with the Arbitrum Layer 2 blockchain network. This node provides access to 5 core resources including bridge operations, transaction management, account queries, and block data retrieval, enabling seamless integration of Arbitrum blockchain functionality into your n8n workflows.

![n8n Community Node](https://img.shields.io/badge/n8n-Community%20Node-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Arbitrum](https://img.shields.io/badge/Arbitrum-Layer%202-42a5f5)
![Blockchain](https://img.shields.io/badge/Blockchain-Ethereum-627eea)
![DeFi](https://img.shields.io/badge/DeFi-Compatible-green)

## Features

- **Bridge Operations** - Execute cross-layer transfers between Ethereum mainnet and Arbitrum networks
- **Transaction Management** - Send, track, and analyze transactions on Arbitrum with detailed receipt information
- **Account Monitoring** - Query account balances, transaction history, and wallet activities
- **Block Data Access** - Retrieve comprehensive block information including transactions and metadata
- **Gas Optimization** - Leverage Arbitrum's low-cost transaction fees for efficient blockchain operations
- **Multi-Network Support** - Compatible with Arbitrum One and Arbitrum Nova networks
- **Real-time Data** - Access live blockchain data with automatic retry mechanisms
- **Developer Friendly** - Comprehensive error handling and detailed response formatting

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
| API Key | Your Arbitrum API key for authenticated requests | Yes |
| Network | Select target network (Arbitrum One, Arbitrum Nova) | Yes |
| RPC Endpoint | Custom RPC endpoint URL (optional, uses default if empty) | No |
| Private Key | Wallet private key for transaction signing (encrypted) | No* |

*Required only for operations that create transactions

## Resources & Operations

### 1. Bridge

| Operation | Description |
|-----------|-------------|
| Deposit | Transfer tokens from Ethereum L1 to Arbitrum L2 |
| Withdraw | Initiate withdrawal from Arbitrum L2 to Ethereum L1 |
| Get Bridge Status | Check the status of pending bridge transactions |
| Estimate Bridge Fees | Calculate gas costs for bridge operations |
| Get Bridge History | Retrieve historical bridge transactions for an address |

### 2. Transaction

| Operation | Description |
|-----------|-------------|
| Send Transaction | Execute a new transaction on Arbitrum network |
| Get Transaction | Retrieve transaction details by transaction hash |
| Get Transaction Receipt | Get transaction receipt with execution details |
| Get Transaction Status | Check current status of a pending transaction |
| Estimate Gas | Calculate gas requirements for transaction execution |
| Get Pending Transactions | List pending transactions in mempool |

### 3. Account

| Operation | Description |
|-----------|-------------|
| Get Balance | Retrieve ETH balance for specified address |
| Get Token Balance | Get ERC-20 token balance for an address |
| Get Transaction History | List all transactions for an account |
| Get Nonce | Get current nonce value for transaction sequencing |
| Validate Address | Verify if address format is valid |

### 4. Block

| Operation | Description |
|-----------|-------------|
| Get Block | Retrieve block data by block number or hash |
| Get Latest Block | Get the most recent block information |
| Get Block Transactions | List all transactions within a specific block |
| Get Block Range | Retrieve multiple blocks within specified range |
| Get Block Statistics | Get statistical data for block analysis |

### 5. Unknown (Partial)

| Operation | Description |
|-----------|-------------|
| Get Network Info | Retrieve general Arbitrum network information |
| Get Gas Price | Get current gas price recommendations |
| Call Contract | Execute read-only smart contract function calls |

## Usage Examples

```javascript
// Bridge ETH from L1 to L2
{
  "resource": "bridge",
  "operation": "deposit",
  "amount": "0.1",
  "currency": "ETH",
  "recipient": "0x742d35Cc6635C0532925a3b8D1d28E",
  "gasLimit": "100000"
}
```

```javascript
// Check account balance
{
  "resource": "account",
  "operation": "getBalance",
  "address": "0x742d35Cc6635C0532925a3b8D1d28E",
  "blockTag": "latest"
}
```

```javascript
// Send transaction with gas estimation
{
  "resource": "transaction",
  "operation": "sendTransaction",
  "to": "0x742d35Cc6635C0532925a3b8D1d28E",
  "value": "1000000000000000000",
  "data": "0x",
  "gasPrice": "auto"
}
```

```javascript
// Retrieve latest block information
{
  "resource": "block",
  "operation": "getLatestBlock",
  "includeTransactions": true,
  "format": "detailed"
}
```

## Error Handling

| Error | Description | Solution |
|-------|-------------|----------|
| Invalid API Key | Authentication failed with provided credentials | Verify API key is correct and has proper permissions |
| Insufficient Balance | Account lacks funds for transaction execution | Check account balance and add sufficient ETH/tokens |
| Gas Limit Too Low | Transaction requires more gas than specified | Increase gas limit or use gas estimation |
| Network Timeout | Request exceeded maximum response time | Retry request or check network connectivity |
| Invalid Address | Provided address format is incorrect | Validate address format using checksum encoding |
| Nonce Too Low | Transaction nonce is behind current account nonce | Get current nonce and increment appropriately |

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
- **Arbitrum Documentation**: [Official Arbitrum Docs](https://docs.arbitrum.io/)
- **Developer Portal**: [Arbitrum Developer Center](https://developer.arbitrum.io/)