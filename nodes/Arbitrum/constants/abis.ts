/**
 * Standard ABIs for Arbitrum Operations
 *
 * Contains minimal ABIs for common contract interactions.
 * Full ABIs are fetched from Arbiscan when needed.
 */

/**
 * ERC-20 Token Standard ABI
 */
export const ERC20_ABI = [
	// Read functions
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function decimals() view returns (uint8)',
	'function totalSupply() view returns (uint256)',
	'function balanceOf(address owner) view returns (uint256)',
	'function allowance(address owner, address spender) view returns (uint256)',
	// Write functions
	'function transfer(address to, uint256 amount) returns (bool)',
	'function approve(address spender, uint256 amount) returns (bool)',
	'function transferFrom(address from, address to, uint256 amount) returns (bool)',
	// Events
	'event Transfer(address indexed from, address indexed to, uint256 value)',
	'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const;

/**
 * ERC-721 NFT Standard ABI
 */
export const ERC721_ABI = [
	// Read functions
	'function name() view returns (string)',
	'function symbol() view returns (string)',
	'function tokenURI(uint256 tokenId) view returns (string)',
	'function balanceOf(address owner) view returns (uint256)',
	'function ownerOf(uint256 tokenId) view returns (address)',
	'function getApproved(uint256 tokenId) view returns (address)',
	'function isApprovedForAll(address owner, address operator) view returns (bool)',
	'function supportsInterface(bytes4 interfaceId) view returns (bool)',
	// Write functions
	'function approve(address to, uint256 tokenId)',
	'function setApprovalForAll(address operator, bool approved)',
	'function transferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId)',
	'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
	// Events
	'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
	'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
	'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
] as const;

/**
 * ERC-1155 Multi-Token Standard ABI
 */
export const ERC1155_ABI = [
	// Read functions
	'function uri(uint256 id) view returns (string)',
	'function balanceOf(address account, uint256 id) view returns (uint256)',
	'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
	'function isApprovedForAll(address account, address operator) view returns (bool)',
	'function supportsInterface(bytes4 interfaceId) view returns (bool)',
	// Write functions
	'function setApprovalForAll(address operator, bool approved)',
	'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
	'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
	// Events
	'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
	'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
	'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
	'event URI(string value, uint256 indexed id)',
] as const;

/**
 * WETH (Wrapped ETH) ABI
 */
export const WETH_ABI = [
	...ERC20_ABI,
	'function deposit() payable',
	'function withdraw(uint256 amount)',
	'event Deposit(address indexed dst, uint256 wad)',
	'event Withdrawal(address indexed src, uint256 wad)',
] as const;

/**
 * Arbitrum System Precompile (ArbSys) ABI
 * Address: 0x0000000000000000000000000000000000000064
 */
export const ARB_SYS_ABI = [
	// Read functions
	'function arbBlockNumber() view returns (uint256)',
	'function arbBlockHash(uint256 blockNumber) view returns (bytes32)',
	'function arbChainID() view returns (uint256)',
	'function arbOSVersion() view returns (uint256)',
	'function getStorageGasAvailable() view returns (uint256)',
	'function isTopLevelCall() view returns (bool)',
	'function myCallersAddressWithoutAliasing() view returns (address)',
	'function wasMyCallersAddressAliased() view returns (bool)',
	'function sendTxToL1(address destination, bytes data) payable returns (uint256)',
	// L2 to L1 messaging
	'function sendMerkleTreeState() view returns (uint256 size, bytes32 root, bytes32[] partials)',
	// Events
	'event L2ToL1Tx(address caller, address indexed destination, uint256 indexed hash, uint256 indexed position, uint256 arbBlockNum, uint256 ethBlockNum, uint256 timestamp, uint256 callvalue, bytes data)',
	'event L2ToL1Transaction(address caller, address indexed destination, uint256 indexed uniqueId, uint256 indexed batchNumber, uint256 indexInBatch, uint256 arbBlockNum, uint256 ethBlockNum, uint256 timestamp, uint256 callvalue, bytes data)',
	'event SendMerkleUpdate(uint256 indexed reserved, bytes32 hash, uint256 position)',
] as const;

/**
 * Arbitrum Gas Info Precompile (ArbGasInfo) ABI
 * Address: 0x000000000000000000000000000000000000006C
 */
export const ARB_GAS_INFO_ABI = [
	'function getPricesInWei() view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
	'function getPricesInWeiWithAggregator(address aggregator) view returns (uint256, uint256, uint256, uint256, uint256, uint256)',
	'function getPricesInArbGas() view returns (uint256, uint256, uint256)',
	'function getPricesInArbGasWithAggregator(address aggregator) view returns (uint256, uint256, uint256)',
	'function getGasAccountingParams() view returns (uint256, uint256, uint256)',
	'function getMinimumGasPrice() view returns (uint256)',
	'function getGasPoolSeconds() view returns (uint64)',
	'function getL1BaseFeeEstimate() view returns (uint256)',
	'function getCurrentTxL1GasFees() view returns (uint256)',
	'function getL1GasPriceEstimate() view returns (uint256)',
	'function getL1RewardRate() view returns (uint64)',
	'function getL1RewardRecipient() view returns (address)',
	'function getL1PricingSurplus() view returns (int256)',
	'function getPerBatchGasCharge() view returns (int64)',
	'function getAmortizedCostCapBips() view returns (uint64)',
] as const;

/**
 * Arbitrum Retryable Ticket Precompile (ArbRetryableTx) ABI
 * Address: 0x000000000000000000000000000000000000006E
 */
export const ARB_RETRYABLE_TX_ABI = [
	'function redeem(bytes32 ticketId) returns (bytes32)',
	'function getTimeout(bytes32 ticketId) view returns (uint256)',
	'function getLifetime() view returns (uint256)',
	'function getKeepalivePrice(bytes32 ticketId) view returns (uint256, uint256)',
	'function keepalive(bytes32 ticketId) payable returns (uint256)',
	'function getBeneficiary(bytes32 ticketId) view returns (address)',
	'function cancel(bytes32 ticketId)',
	'function getSubmissionPrice(uint256 dataLength) view returns (uint256, uint256)',
	// Events
	'event TicketCreated(bytes32 indexed ticketId)',
	'event LifetimeExtended(bytes32 indexed ticketId, uint256 newTimeout)',
	'event RedeemScheduled(bytes32 indexed ticketId, bytes32 indexed retryTxHash, uint64 indexed sequenceNum, uint64 donatedGas, address gasDonor, uint256 maxRefund, uint256 submissionFeeRefund)',
	'event Canceled(bytes32 indexed ticketId)',
] as const;

/**
 * Node Interface ABI (for gas estimation and L1 data fee)
 * Address: 0x00000000000000000000000000000000000000C8
 */
export const NODE_INTERFACE_ABI = [
	'function estimateRetryableTicket(address sender, uint256 deposit, address to, uint256 l2CallValue, address excessFeeRefundAddress, address callValueRefundAddress, bytes data) view returns (uint256, uint256, uint256, uint256)',
	'function constructOutboxProof(uint64 size, uint64 leaf) view returns (bytes32 send, bytes32 root, bytes32[] proof)',
	'function findBatchContainingBlock(uint64 blockNum) view returns (uint64)',
	'function getL1Confirmations(bytes32 blockHash) view returns (uint64)',
	'function gasEstimateL1Component(address to, bool contractCreation, bytes data) view returns (uint64, uint256, uint256)',
	'function gasEstimateComponents(address to, bool contractCreation, bytes data) view returns (uint64, uint64, uint256, uint256)',
	'function legacyLookupMessageBatchProof(uint256 batchNum, uint64 index) view returns (bytes32[] proof, uint256 path, address l2Sender, address l1Dest, uint256 l2Block, uint256 l1Block, uint256 timestamp, uint256 amount, bytes calldataForL1)',
	'function nitroGenesisBlock() view returns (uint256)',
	'function l2BlockRangeForL1(uint64 blockNum) view returns (uint64, uint64)',
] as const;

/**
 * L1 Inbox ABI (for deposits)
 */
export const L1_INBOX_ABI = [
	'function sendL1FundedContractTransaction(uint256 gasLimit, uint256 maxFeePerGas, address to, bytes data) payable returns (uint256)',
	'function sendL1FundedUnsignedTransaction(uint256 gasLimit, uint256 maxFeePerGas, uint256 nonce, address to, bytes data) payable returns (uint256)',
	'function createRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, bytes data) payable returns (uint256)',
	'function unsafeCreateRetryableTicket(address to, uint256 l2CallValue, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, bytes data) payable returns (uint256)',
	'function depositEth() payable returns (uint256)',
	'function bridge() view returns (address)',
	'function sequencerInbox() view returns (address)',
	'function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) view returns (uint256)',
	// Events
	'event InboxMessageDelivered(uint256 indexed messageNum, bytes data)',
	'event InboxMessageDeliveredFromOrigin(uint256 indexed messageNum)',
] as const;

/**
 * L1 Outbox ABI (for withdrawals)
 */
export const L1_OUTBOX_ABI = [
	'function executeTransaction(bytes32[] proof, uint256 index, address l2Sender, address to, uint256 l2Block, uint256 l1Block, uint256 l2Timestamp, uint256 value, bytes data)',
	'function executeTransactionSimulation(uint256 index, address l2Sender, address to, uint256 l2Block, uint256 l1Block, uint256 l2Timestamp, uint256 value, bytes data)',
	'function isSpent(uint256 index) view returns (bool)',
	'function l2ToL1Sender() view returns (address)',
	'function l2ToL1Block() view returns (uint256)',
	'function l2ToL1EthBlock() view returns (uint256)',
	'function l2ToL1Timestamp() view returns (uint256)',
	'function l2ToL1BatchNum() view returns (uint256)',
	'function l2ToL1OutputId() view returns (bytes32)',
	// Events
	'event OutBoxTransactionExecuted(address indexed to, address indexed l2Sender, uint256 indexed zero, uint256 transactionIndex)',
] as const;

/**
 * L1 Gateway Router ABI
 */
export const L1_GATEWAY_ROUTER_ABI = [
	'function outboundTransfer(address token, address to, uint256 amount, uint256 maxGas, uint256 gasPriceBid, bytes data) payable returns (bytes)',
	'function outboundTransferCustomRefund(address token, address refundTo, address to, uint256 amount, uint256 maxGas, uint256 gasPriceBid, bytes data) payable returns (bytes)',
	'function getGateway(address token) view returns (address)',
	'function calculateL2TokenAddress(address l1Token) view returns (address)',
	'function counterpartGateway() view returns (address)',
	'function inbox() view returns (address)',
	'function router() view returns (address)',
	'function defaultGateway() view returns (address)',
	// Events
	'event TransferRouted(address indexed token, address indexed _userFrom, address indexed _userTo, address gateway)',
	'event GatewaySet(address indexed l1Token, address indexed gateway)',
	'event DefaultGatewayUpdated(address newDefaultGateway)',
] as const;

/**
 * L2 Gateway Router ABI
 */
export const L2_GATEWAY_ROUTER_ABI = [
	'function outboundTransfer(address token, address to, uint256 amount, bytes data) returns (bytes)',
	'function getGateway(address token) view returns (address)',
	'function calculateL2TokenAddress(address l1Token) view returns (address)',
	'function counterpartGateway() view returns (address)',
	'function defaultGateway() view returns (address)',
	// Events
	'event TransferRouted(address indexed token, address indexed _userFrom, address indexed _userTo, address gateway)',
] as const;

/**
 * Multicall3 ABI
 */
export const MULTICALL3_ABI = [
	'function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)',
	'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[])',
	'function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[])',
	'function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
	'function getBasefee() view returns (uint256 basefee)',
	'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
	'function getBlockNumber() view returns (uint256 blockNumber)',
	'function getChainId() view returns (uint256 chainid)',
	'function getCurrentBlockCoinbase() view returns (address coinbase)',
	'function getCurrentBlockDifficulty() view returns (uint256 difficulty)',
	'function getCurrentBlockGasLimit() view returns (uint256 gaslimit)',
	'function getCurrentBlockTimestamp() view returns (uint256 timestamp)',
	'function getEthBalance(address addr) view returns (uint256 balance)',
	'function getLastBlockHash() view returns (bytes32 blockHash)',
	'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[])',
	'function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)',
] as const;

/**
 * Uniswap V3 Router ABI (partial)
 */
export const UNISWAP_V3_ROUTER_ABI = [
	'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)',
	'function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)',
	'function exactOutputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountIn)',
	'function exactOutput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum) params) payable returns (uint256 amountIn)',
	'function multicall(bytes[] data) payable returns (bytes[] results)',
	'function unwrapWETH9(uint256 amountMinimum, address recipient) payable',
	'function refundETH() payable',
	'function sweepToken(address token, uint256 amountMinimum, address recipient) payable',
] as const;

/**
 * Uniswap V3 Quoter V2 ABI
 */
export const UNISWAP_V3_QUOTER_ABI = [
	'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
	'function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)',
	'function quoteExactOutputSingle(tuple(address tokenIn, address tokenOut, uint256 amount, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
	'function quoteExactOutput(bytes path, uint256 amountOut) returns (uint256 amountIn, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)',
] as const;

/**
 * Chainlink Price Feed ABI
 */
export const CHAINLINK_FEED_ABI = [
	'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
	'function decimals() view returns (uint8)',
	'function description() view returns (string)',
	'function version() view returns (uint256)',
	'function getRoundData(uint80 _roundId) view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
] as const;

/**
 * ArbOS Precompile: ArbWasm (for Stylus contracts)
 * Address: 0x0000000000000000000000000000000000000071
 */
export const ARB_WASM_ABI = [
	'function activateProgram(address program) returns (uint16, uint256)',
	'function stylusVersion() view returns (uint16)',
	'function codehashVersion(bytes32 codehash) view returns (uint16)',
	'function programVersion(address program) view returns (uint16)',
	'function codehashAsmSize(bytes32 codehash) view returns (uint32)',
	'function programAsmSize(address program) view returns (uint32)',
	'function codehashInitGas(bytes32 codehash) view returns (uint64, uint64)',
	'function programInitGas(address program) view returns (uint64, uint64)',
	'function programMemoryFootprint(address program) view returns (uint16)',
	// Events
	'event ProgramActivated(bytes32 indexed codehash, bytes32 moduleHash, address program, uint256 dataFee, uint16 version)',
	'event ProgramActivateFailed(bytes32 indexed codehash)',
] as const;

/**
 * Export all ABIs as a combined object
 */
export const ABIS = {
	ERC20: ERC20_ABI,
	ERC721: ERC721_ABI,
	ERC1155: ERC1155_ABI,
	WETH: WETH_ABI,
	ArbSys: ARB_SYS_ABI,
	ArbGasInfo: ARB_GAS_INFO_ABI,
	ArbRetryableTx: ARB_RETRYABLE_TX_ABI,
	NodeInterface: NODE_INTERFACE_ABI,
	L1Inbox: L1_INBOX_ABI,
	L1Outbox: L1_OUTBOX_ABI,
	L1GatewayRouter: L1_GATEWAY_ROUTER_ABI,
	L2GatewayRouter: L2_GATEWAY_ROUTER_ABI,
	Multicall3: MULTICALL3_ABI,
	UniswapV3Router: UNISWAP_V3_ROUTER_ABI,
	UniswapV3Quoter: UNISWAP_V3_QUOTER_ABI,
	ChainlinkFeed: CHAINLINK_FEED_ABI,
	ArbWasm: ARB_WASM_ABI,
} as const;
