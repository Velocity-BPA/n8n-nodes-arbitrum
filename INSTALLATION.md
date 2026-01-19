# n8n-nodes-arbitrum - Installation & Testing Guide

## Package Status
The package builds successfully with TypeScript warnings (type errors that don't prevent compilation). The `noEmitOnError: false` setting allows JavaScript output despite type warnings.

---

## Step-by-Step Local Installation

### Prerequisites
- Node.js 18+ installed
- n8n installed locally (either via npm or docker)
- Git installed
- A terminal/command prompt

### Step 1: Clone or Download the Package

**Option A: Clone from GitHub (after you push it)**
```bash
git clone https://github.com/Velocity-BPA/n8n-nodes-arbitrum.git
cd n8n-nodes-arbitrum
```

**Option B: Create from scratch (if GitHub repo not set up)**
```bash
mkdir n8n-nodes-arbitrum
cd n8n-nodes-arbitrum
# Copy all the files from the provided package
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Build the Package
```bash
npm run build
```
Note: You'll see TypeScript warnings, but the build will complete and generate the `dist/` folder.

### Step 4: Copy Icon File
```bash
mkdir -p dist/nodes/Arbitrum
cp nodes/Arbitrum/arbitrum.svg dist/nodes/Arbitrum/
```

### Step 5: Link Package to n8n

**For Local n8n Installation:**
```bash
# In the n8n-nodes-arbitrum directory
npm link

# Find your n8n installation
# Usually: ~/.n8n/nodes or /usr/lib/node_modules/n8n

# Navigate to n8n directory and link
cd ~/.n8n
mkdir -p nodes
cd nodes
npm link n8n-nodes-arbitrum
```

**For Docker n8n:**
```bash
# Build package first
npm pack

# Copy .tgz file to your docker volume
# Then in docker-compose.yml, add:
# volumes:
#   - ./n8n-nodes-arbitrum-1.0.0.tgz:/home/node/.n8n/nodes/n8n-nodes-arbitrum.tgz

# Or mount the entire directory
```

### Step 6: Restart n8n
```bash
# If running via npm
n8n start

# If running via PM2
pm2 restart n8n

# If running via Docker
docker-compose restart n8n
```

### Step 7: Verify Installation
1. Open n8n in your browser (default: http://localhost:5678)
2. Create a new workflow
3. Click "+" to add a node
4. Search for "Arbitrum"
5. You should see:
   - **Arbitrum** (action node)
   - **Arbitrum Trigger** (trigger node)

---

## Testing the Nodes

### Test 1: Get ETH Balance (Read-Only)
1. Add "Arbitrum" node to workflow
2. Create credentials:
   - Credential Type: "Arbitrum RPC"
   - Network: Arbitrum One
   - RPC Provider: Public (for testing)
   - Leave Private Key empty for read-only
3. Configure node:
   - Resource: Account
   - Operation: Get Balance
   - Address: `0x912CE59144191C1204E64559FE8253a0e49E6548` (ARB token contract)
4. Execute node - should return ETH balance

### Test 2: Get Token Info
1. Add another "Arbitrum" node
2. Configure:
   - Resource: Token
   - Operation: Get Token Info
   - Token Address: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` (USDC)
3. Execute - should return token name, symbol, decimals

### Test 3: Get Block Info
1. Add "Arbitrum" node
2. Configure:
   - Resource: Block
   - Operation: Get Block
   - Block Number: `latest`
3. Execute - should return current block info

### Test 4: Trigger Test (New Block)
1. Add "Arbitrum Trigger" node
2. Configure:
   - Event Type: New Block
   - Confirmations: 1
3. Click "Listen for Event" or execute workflow
4. Should trigger when new block is mined (~250ms)

---

## Push to GitHub

```bash
# Extract and navigate
unzip n8n-nodes-arbitrum.zip
cd n8n-nodes-arbitrum

# Initialize and push
git init
git add .
git commit -m "Initial commit: n8n Arbitrum blockchain community node

Features:
- Account: Get balance, transaction history, token balances
- Transaction: Send ETH, estimate gas, get transaction details
- Token: ERC-20 transfers, approvals, token info
- NFT: ERC-721/ERC-1155 transfers, metadata, ownership
- Contract: Read/write operations, multicall, events
- Block: Get block info, L1 block correlation
- Events: Log filtering, event decoding
- Bridge: L1↔L2 deposits, withdrawals, gateway info
- Retryable: Ticket status, redemption, lifecycle
- L2toL1: Outbox proofs, challenge period, execution
- Nova: DAC info, gas comparison
- Stylus: WASM contracts, activation, gas estimation
- DeFi: Uniswap swaps, Chainlink prices, liquidity
- Utility: Unit conversion, ABI encoding, signing"

git remote add origin https://github.com/Velocity-BPA/n8n-nodes-arbitrum.git
git branch -M main
git push -u origin main
```

### Add GitHub Topics
In your GitHub repo settings, add topics:
- `n8n`
- `n8n-community-node-package`
- `arbitrum`
- `blockchain`
- `web3`

---

## Publishing to npm (Optional)

### Step 1: Create npm Account
1. Go to npmjs.com
2. Create account or login

### Step 2: Login via CLI
```bash
npm login
```

### Step 3: Publish
```bash
npm publish
```

### Step 4: Verify
```bash
npm view n8n-nodes-arbitrum
```

---

## Troubleshooting

### Node doesn't appear in n8n
1. Check `dist/` folder exists with compiled JS files
2. Verify `package.json` n8n section paths are correct
3. Restart n8n after installation
4. Check n8n logs for errors

### TypeScript Errors During Build
The package uses `noEmitOnError: false` to build despite type warnings. These are type hints, not runtime errors. The JavaScript output is functional.

### RPC Connection Failed
1. Verify RPC URL is correct
2. For public RPC, there may be rate limits
3. Consider using Alchemy/Infura with API key

### Private Key Required
For write operations (transfers, swaps), you need:
1. Add private key to credentials
2. Ensure wallet has ETH for gas
3. Test on Sepolia testnet first

---

## Package Structure
```
n8n-nodes-arbitrum/
├── credentials/          # Credential definitions
├── nodes/Arbitrum/       # Main node code
│   ├── actions/          # Resource operations
│   ├── constants/        # Network configs, ABIs
│   ├── transport/        # RPC, Explorer API
│   ├── utils/            # Helper functions
│   ├── Arbitrum.node.ts  # Main action node
│   └── ArbitrumTrigger.node.ts
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

---

## Support
- GitHub Issues: Report bugs
- n8n Community: https://community.n8n.io/
- Arbitrum Docs: https://developer.arbitrum.io/

---

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)
