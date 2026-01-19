# n8n-nodes-arbitrum

> [Velocity BPA Licensing Notice]
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

![n8n.io - Workflow Automation](https://img.shields.io/badge/n8n.io-Workflow_Automation-orange)
![Arbitrum](https://img.shields.io/badge/Arbitrum-L2_Scaling-blue)
![License](https://img.shields.io/badge/License-BUSL--1.1-blue)

A comprehensive n8n community node package for **Arbitrum blockchain** integration. This toolkit provides complete access to Arbitrum One, Arbitrum Nova, and testnets with support for bridging, DeFi operations, smart contracts, NFTs, and Arbitrum-specific features like Stylus (WASM contracts) and retryable tickets.

## Features

### Complete Arbitrum Integration
- **Multi-Network Support**: Arbitrum One, Nova, Sepolia testnet, Goerli (deprecated), Custom RPC
- **L1 ↔ L2 Bridging**: Full bridge operations with retryable tickets and withdrawal tracking
- **DeFi Operations**: Uniswap V3, Chainlink price feeds, swap execution
- **Smart Contracts**: Read/write operations, ABI encoding, multicall
- **NFT Operations**: ERC-721 and ERC-1155 support
- **Stylus Support**: Rust/WASM smart contract interactions
- **Real-time Triggers**: Block monitoring, token transfers, price alerts

### 14 Action Resources with 111+ Operations
| Resource | Operations | Description |
|----------|------------|-------------|
| Account | 9 | Balances, transaction history, address validation |
| Transaction | 14 | Send ETH, gas estimation, transaction status |
| Token | 9 | ERC-20 transfers, approvals, token info |
| NFT | 11 | ERC-721/ERC-1155 transfers, metadata |
| Contract | 11 | Read/write, deploy, multicall, events |
| Block | 6 | Block info, L1 block correlation |
| Events | 6 | Log filtering, event decoding |
| Bridge | 14 | L1↔L2 deposits, withdrawals, gateway info |
| Retryable | 7 | Ticket status, redemption, lifecycle |
| L2 to L1 | 7 | Outbox proofs, challenge period, execution |
| Nova | 4 | DAC info, gas comparison |
| Stylus | 5 | WASM contracts, activation, gas estimation |
| DeFi | 8 | Swaps, prices, liquidity pools |
| Utility | 11 | Unit conversion, ABI encoding, signing |

### 13 Trigger Event Types
- New Block monitoring
- Address activity tracking
- ERC-20 token transfers
- NFT transfers
- Custom contract events
- Balance change alerts
- Large transaction detection
- Price alerts (Chainlink)
- Bridge deposit/withdrawal events
- Large DEX swap monitoring

## Installation

### Community Nodes (Recommended)
1. Go to **Settings** → **Community Nodes** in n8n
2. Click **Install a community node**
3. Enter `n8n-nodes-arbitrum`
4. Click **Install**

### Manual Installation
```bash
cd ~/.n8n/nodes
npm install n8n-nodes-arbitrum
```

### Development Installation
```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-arbitrum.git
cd n8n-nodes-arbitrum
npm install
npm run build
npm link

# In your n8n installation directory
npm link n8n-nodes-arbitrum
```

## Configuration

### Arbitrum RPC Credentials

1. In n8n, go to **Credentials** → **New Credential**
2. Search for "Arbitrum RPC"
3. Configure:
   - **Network**: Select Arbitrum One, Nova, Sepolia, or Custom
   - **RPC URL**: Auto-populated or custom endpoint
   - **Private Key**: Required for write operations (transfers, swaps)
   - **Chain ID**: Auto-populated based on network

**Recommended RPC Providers:**
- [Alchemy](https://www.alchemy.com/) - High performance, generous free tier
- [Infura](https://infura.io/) - Reliable, MetaMask integration
- [QuickNode](https://www.quicknode.com/) - Fast, multiple chains
- [Ankr](https://www.ankr.com/) - Affordable, decentralized

### Arbiscan API Credentials (Optional)

For enhanced transaction history and contract verification:
1. Get an API key from [Arbiscan](https://arbiscan.io/apis)
2. Create "Arbiscan API" credential in n8n
3. Enter your API key

## Usage Examples

### Example 1: Send ETH on Arbitrum

```javascript
// Send 0.1 ETH to an address on Arbitrum One
{
  "resource": "transaction",
  "operation": "sendEth",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98",
  "amount": "0.1"
}
```

### Example 2: Check Token Balance

```javascript
// Get USDC balance for an address
{
  "resource": "token",
  "operation": "getBalance",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98",
  "tokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" // USDC on Arbitrum
}
```

### Example 3: Transfer ERC-20 Tokens

```javascript
// Transfer 100 USDC
{
  "resource": "token",
  "operation": "transfer",
  "tokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98",
  "amount": "100"
}
```

### Example 4: Bridge ETH from L1 to L2

```javascript
// Initiate ETH deposit from Ethereum to Arbitrum
{
  "resource": "bridge",
  "operation": "depositEth",
  "amount": "1.0",
  "l1Provider": "https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY"
}
```

### Example 5: Track Bridge Deposit

```javascript
// Check status of L1→L2 deposit
{
  "resource": "bridge",
  "operation": "getDepositStatus",
  "txHash": "0x1234567890abcdef..."
}
```

### Example 6: Initiate L2 to L1 Withdrawal

```javascript
// Withdraw ETH from Arbitrum to Ethereum
// Note: 7-day challenge period applies
{
  "resource": "bridge",
  "operation": "withdrawEth",
  "amount": "0.5"
}
```

### Example 7: Check Withdrawal Status

```javascript
// Track L2→L1 withdrawal progress
{
  "resource": "l2tol1",
  "operation": "getMessageStatus",
  "txHash": "0xabcdef123456..."
}
// Returns: UNCONFIRMED, CONFIRMED, or EXECUTED
```

### Example 8: Execute Completed Withdrawal

```javascript
// After 7-day challenge period, execute on L1
{
  "resource": "l2tol1",
  "operation": "executeMessage",
  "txHash": "0xabcdef123456..."
}
```

### Example 9: Get Retryable Ticket Status

```javascript
// Check status of L1→L2 retryable ticket
{
  "resource": "retryable",
  "operation": "getStatus",
  "ticketId": "0x..."
}
// Returns: NOT_CREATED, CREATED, REDEEMED, or EXPIRED
```

### Example 10: Redeem Failed Retryable

```javascript
// Manually redeem a retryable ticket that failed auto-redeem
{
  "resource": "retryable",
  "operation": "redeem",
  "ticketId": "0x..."
}
```

### Example 11: Get Token Price

```javascript
// Get ETH price from Chainlink oracle
{
  "resource": "defi",
  "operation": "getTokenPrice",
  "token": "ETH"
}
```

### Example 12: Execute Token Swap

```javascript
// Swap 0.1 ETH for USDC on Uniswap V3
{
  "resource": "defi",
  "operation": "swap",
  "tokenIn": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
  "tokenOut": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
  "amountIn": "0.1",
  "slippageBps": "50", // 0.5% slippage
  "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98"
}
```

### Example 13: Approve and Swap

```javascript
// Approve token spending and execute swap in one flow
{
  "resource": "defi",
  "operation": "approveAndSwap",
  "tokenIn": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
  "tokenOut": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
  "amountIn": "100",
  "slippageBps": "50"
}
```

### Example 14: Read Smart Contract

```javascript
// Read totalSupply from ERC-20 contract
{
  "resource": "contract",
  "operation": "read",
  "contractAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "functionName": "totalSupply",
  "abi": "[{\"name\":\"totalSupply\",\"type\":\"function\",\"inputs\":[],\"outputs\":[{\"type\":\"uint256\"}]}]"
}
```

### Example 15: Write Smart Contract

```javascript
// Call a contract function that modifies state
{
  "resource": "contract",
  "operation": "write",
  "contractAddress": "0x...",
  "functionName": "stake",
  "args": "[1000000000000000000]",
  "abi": "[{\"name\":\"stake\",\"type\":\"function\",\"inputs\":[{\"name\":\"amount\",\"type\":\"uint256\"}]}]"
}
```

### Example 16: Multicall (Batch Read)

```javascript
// Execute multiple read calls in one request
{
  "resource": "contract",
  "operation": "multicall",
  "calls": [
    {
      "target": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "functionName": "totalSupply",
      "abi": "..."
    },
    {
      "target": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "functionName": "balanceOf",
      "args": ["0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98"],
      "abi": "..."
    }
  ]
}
```

### Example 17: Get NFT Metadata

```javascript
// Retrieve NFT metadata and attributes
{
  "resource": "nft",
  "operation": "getMetadata",
  "contractAddress": "0x...",
  "tokenId": "1234"
}
```

### Example 18: Transfer NFT

```javascript
// Transfer an ERC-721 NFT
{
  "resource": "nft",
  "operation": "transfer",
  "contractAddress": "0x...",
  "tokenId": "1234",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98"
}
```

### Example 19: Compare Arbitrum One vs Nova Costs

```javascript
// Compare gas costs between Arbitrum One and Nova
{
  "resource": "nova",
  "operation": "compareGasCosts"
}
```

### Example 20: Check Stylus Contract

```javascript
// Get info about a Stylus (WASM) contract
{
  "resource": "stylus",
  "operation": "getContractInfo",
  "contractAddress": "0x..."
}
```

### Example 21: Estimate Total Gas Cost

```javascript
// Calculate total gas including L1 data fee
{
  "resource": "utility",
  "operation": "calculateTotalGas",
  "toAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98",
  "data": "0xa9059cbb000000000000000000000000...",
  "value": "0"
}
```

### Example 22: Sign Message

```javascript
// Sign a message with EIP-191 personal sign
{
  "resource": "utility",
  "operation": "signMessage",
  "message": "Hello Arbitrum!",
  "signType": "personal"
}
```

## Trigger Examples

### Monitor New Blocks

```javascript
// Trigger on every new Arbitrum block
{
  "eventType": "newBlock",
  "confirmations": 1
}
```

### Watch Address Activity

```javascript
// Trigger when address receives or sends transactions
{
  "eventType": "addressActivity",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98",
  "direction": "both" // incoming, outgoing, or both
}
```

### Monitor Token Transfers

```javascript
// Trigger on USDC transfers to specific address
{
  "eventType": "tokenTransfer",
  "tokenAddress": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "filterAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98"
}
```

### Price Alert

```javascript
// Trigger when ETH price reaches target
{
  "eventType": "priceAlert",
  "priceFeed": "ETH/USD",
  "targetPrice": "4000",
  "comparison": "above" // above, below, or equals
}
```

### Large Transaction Alert

```javascript
// Trigger on transactions over 100 ETH
{
  "eventType": "largeTransaction",
  "thresholdEth": "100"
}
```

### Custom Contract Event

```javascript
// Trigger on specific contract event
{
  "eventType": "contractEvent",
  "contractAddress": "0x...",
  "eventAbi": "[{\"name\":\"Transfer\",\"type\":\"event\",...}]",
  "eventName": "Transfer"
}
```

## Arbitrum Concepts

### L1 Data Fee
Arbitrum transactions include an L1 data fee for posting transaction data to Ethereum. This is in addition to the L2 execution gas. Use the "Calculate Total Gas" operation to estimate both components.

### Retryable Tickets
When bridging from L1 to L2, transactions use retryable tickets:
1. **Ticket Created**: Transaction submitted on L1
2. **Auto-Redeem Attempted**: Sequencer tries to execute on L2
3. **Success/Failure**: Either completes or needs manual redemption
4. **Manual Redeem**: If auto-redeem fails, anyone can redeem within 7 days

### L2 to L1 Withdrawals
Withdrawals from Arbitrum to Ethereum have a **7-day challenge period**:
1. **Initiate**: Start withdrawal on L2
2. **Wait**: 7-day challenge period
3. **Ready**: Can execute on L1 after challenge period
4. **Execute**: Claim funds on Ethereum

### Arbitrum Nova
Nova uses a Data Availability Committee (DAC) instead of posting all data to Ethereum:
- ~95% cheaper for data posting
- Slightly different trust assumptions
- Best for high-throughput, gaming, social apps

### Stylus
Stylus enables WASM smart contracts on Arbitrum:
- Write contracts in Rust, C, C++
- 10-100x cheaper for compute-heavy operations
- Interoperable with Solidity contracts

## Network Information

| Network | Chain ID | Explorer | Native Token |
|---------|----------|----------|--------------|
| Arbitrum One | 42161 | [arbiscan.io](https://arbiscan.io) | ETH |
| Arbitrum Nova | 42170 | [nova.arbiscan.io](https://nova.arbiscan.io) | ETH |
| Sepolia Testnet | 421614 | [sepolia.arbiscan.io](https://sepolia.arbiscan.io) | ETH |

## Common Token Addresses (Arbitrum One)

| Token | Address |
|-------|---------|
| WETH | 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 |
| USDC | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| USDC.e (Bridged) | 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8 |
| USDT | 0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9 |
| DAI | 0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1 |
| ARB | 0x912CE59144191C1204E64559FE8253a0e49E6548 |
| GMX | 0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a |
| LINK | 0xf97f4df75117a78c1A5a0DBb814Af92458539FB4 |

## DEX Router Addresses (Arbitrum One)

| DEX | Router Address |
|-----|----------------|
| Uniswap V3 | 0xE592427A0AEce92De3Edee1F18E0157C05861564 |
| SushiSwap | 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506 |
| Camelot | 0xc873fEcbd354f5A56E00E710B90EF4201db2448d |
| 1inch | 0x1111111254fb6c44bac0bed2854e76f90643097d |

## Precompile Addresses

| Precompile | Address | Purpose |
|------------|---------|---------|
| ArbSys | 0x64 | L2 system info, withdrawals |
| ArbGasInfo | 0x6c | Gas pricing info |
| ArbRetryableTx | 0x6e | Retryable ticket management |
| NodeInterface | 0xc8 | Gas estimation, L1 data fee |
| ArbWasm | 0x71 | Stylus WASM contracts |
| ArbWasmCache | 0x72 | Stylus caching |

## Error Handling

The node provides descriptive error messages for common issues:

- **INSUFFICIENT_FUNDS**: Not enough ETH/tokens for transaction + gas
- **NONCE_TOO_LOW**: Transaction already processed
- **GAS_PRICE_TOO_LOW**: Increase gas price or use speed up
- **CONTRACT_REVERT**: Smart contract execution failed
- **INVALID_ADDRESS**: Malformed Ethereum address
- **BRIDGE_ERROR**: L1↔L2 bridge operation failed
- **RETRYABLE_EXPIRED**: Retryable ticket expired (7 days)

## Security Best Practices

1. **Never share private keys** - Use environment variables
2. **Test on Sepolia first** - Verify workflows before mainnet
3. **Set gas limits** - Prevent runaway transaction costs
4. **Verify addresses** - Double-check recipient addresses
5. **Monitor bridge transactions** - Track retryable tickets
6. **Understand withdrawal delays** - 7-day challenge period for L2→L1

## API Rate Limits

- **RPC Calls**: Varies by provider (typically 10-100/second)
- **Arbiscan API**: 5 calls/second (free tier)
- **Chainlink Price Feeds**: No rate limit (on-chain)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Support

- **GitHub Issues**: [Report bugs](https://github.com/Velocity-BPA/n8n-nodes-arbitrum/issues)
- **n8n Community**: [Community forum](https://community.n8n.io/)
- **Arbitrum Docs**: [developer.arbitrum.io](https://developer.arbitrum.io/)

## License

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service,
or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Acknowledgments

- [Arbitrum](https://arbitrum.io/) - Layer 2 scaling solution
- [n8n](https://n8n.io/) - Workflow automation platform
- [ethers.js](https://docs.ethers.org/) - Ethereum library
- [Chainlink](https://chain.link/) - Price feed oracles

---

**Built with ❤️ by [Velocity BPA](https://velobpa.com)**
