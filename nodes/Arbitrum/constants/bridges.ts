/**
 * Arbitrum Bridge Contract Addresses
 *
 * Official bridge infrastructure contracts for L1 <-> L2 messaging
 * and asset transfers. These addresses are critical for:
 * - Token deposits (L1 -> L2)
 * - Token withdrawals (L2 -> L1)
 * - Cross-chain messaging
 * - Retryable ticket management
 */

import { ArbitrumNetworkId } from './networks';

/**
 * Bridge contract addresses interface
 */
export interface BridgeContracts {
	// L1 Contracts (on Ethereum)
	l1: {
		inbox: string; // Receives L1->L2 transactions
		outbox: string; // Processes L2->L1 messages
		bridge: string; // Main bridge contract
		rollup: string; // Rollup contract
		sequencerInbox: string; // Sequencer batch posting
		gateway: string; // ERC20 gateway router
		gatewayRouter: string; // Routes tokens to gateways
		customGateway: string; // Custom token gateway
		wethGateway: string; // WETH-specific gateway
		multicall: string; // Multicall contract
	};
	// L2 Contracts (on Arbitrum)
	l2: {
		arbSys: string; // Arbitrum system precompile
		arbRetryableTx: string; // Retryable ticket precompile
		arbGasInfo: string; // Gas pricing precompile
		arbAggregator: string; // Batch submission precompile
		nodeInterface: string; // Node interface precompile
		gateway: string; // ERC20 gateway
		gatewayRouter: string; // Gateway router
		customGateway: string; // Custom token gateway
		wethGateway: string; // WETH gateway
		weth: string; // Wrapped ETH on L2
		multicall: string; // Multicall contract
	};
}

/**
 * Arbitrum One Mainnet bridge contracts
 */
export const ARBITRUM_ONE_BRIDGES: BridgeContracts = {
	l1: {
		inbox: '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f',
		outbox: '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840',
		bridge: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
		rollup: '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35',
		sequencerInbox: '0x1c479675ad559DC151F6Ec7ed3FbF8ceE79582B6',
		gateway: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef', // GatewayRouter
		gatewayRouter: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef',
		customGateway: '0xcEe284F754E854890e311e3280b767F80797180d',
		wethGateway: '0xd92023E9d9911199a6711321D1277285e6d4e2db',
		multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696', // Multicall2
	},
	l2: {
		arbSys: '0x0000000000000000000000000000000000000064',
		arbRetryableTx: '0x000000000000000000000000000000000000006E',
		arbGasInfo: '0x000000000000000000000000000000000000006C',
		arbAggregator: '0x000000000000000000000000000000000000006D',
		nodeInterface: '0x00000000000000000000000000000000000000C8',
		gateway: '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933', // L2GatewayRouter
		gatewayRouter: '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933',
		customGateway: '0x096760F208390250649E3e8763348E783AEF5562',
		wethGateway: '0x6c411aD3E74De3E7Bd422b94A27770f5B86C623B',
		weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
		multicall: '0x842eC2c7D803033Edf55E478F461FC547Bc54EB2', // Multicall2
	},
};

/**
 * Arbitrum Nova bridge contracts
 */
export const ARBITRUM_NOVA_BRIDGES: BridgeContracts = {
	l1: {
		inbox: '0xc4448b71118c9071Bcb9734A0EAc55D18A153949',
		outbox: '0xD4B80C3D7240325D18E645B49e6535A3Bf95cc58',
		bridge: '0xC1Ebd02f738644983b6C4B2d440b8e77DdE276Bd',
		rollup: '0xFb209827c58283535b744575e11953DCC4bEAD88',
		sequencerInbox: '0x211E1c4c7f1bF5351Ac850Ed10FD68CFfCF6c21b',
		gateway: '0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48', // GatewayRouter
		gatewayRouter: '0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48',
		customGateway: '0x23122da8C581AA7E0d07A36Ff1f16F799650232f',
		wethGateway: '0xE4E2121b479017955Be0b175305B35f312330BaE',
		multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696', // Multicall2 on L1
	},
	l2: {
		arbSys: '0x0000000000000000000000000000000000000064',
		arbRetryableTx: '0x000000000000000000000000000000000000006E',
		arbGasInfo: '0x000000000000000000000000000000000000006C',
		arbAggregator: '0x000000000000000000000000000000000000006D',
		nodeInterface: '0x00000000000000000000000000000000000000C8',
		gateway: '0x21903d3F8176b1a0c17E953Cd896610Be9fFDFa8', // L2GatewayRouter
		gatewayRouter: '0x21903d3F8176b1a0c17E953Cd896610Be9fFDFa8',
		customGateway: '0xbf544970E6BD77b21C6492C281AB60d0770451F4',
		wethGateway: '0x7626841cB6113412F9c88D3ADC720C9FAC88D9eD',
		weth: '0x722E8BdD2ce80A4422E880164f2079488e115365',
		multicall: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3
	},
};

/**
 * Arbitrum Sepolia Testnet bridge contracts
 */
export const ARBITRUM_SEPOLIA_BRIDGES: BridgeContracts = {
	l1: {
		inbox: '0xaAe29B0366299461418F5324a79Afc425BE5ae21',
		outbox: '0x65f07C7D521164a4d5DaC6eB8Fac8DA067A3B78F',
		bridge: '0x38f918D0E9F1b721EDaA41302E399fa1B79333a9',
		rollup: '0xd80810638dbDF9081b72C1B33c65375e807281C8',
		sequencerInbox: '0x6c97864CE4bEf387dE0b3310A44230f7E3F1be0D',
		gateway: '0xcE18836b233C83325Cc8848CA4487e94C6288264', // GatewayRouter
		gatewayRouter: '0xcE18836b233C83325Cc8848CA4487e94C6288264',
		customGateway: '0xba2F7B6eAe1F9d174199C5E4867b563E0eaC40F3',
		wethGateway: '0xA8aD8d7e13cbf556eE75CB0324c13535d8100e1E',
		multicall: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3
	},
	l2: {
		arbSys: '0x0000000000000000000000000000000000000064',
		arbRetryableTx: '0x000000000000000000000000000000000000006E',
		arbGasInfo: '0x000000000000000000000000000000000000006C',
		arbAggregator: '0x000000000000000000000000000000000000006D',
		nodeInterface: '0x00000000000000000000000000000000000000C8',
		gateway: '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7', // L2GatewayRouter
		gatewayRouter: '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7',
		customGateway: '0x8Ca1e1AC0f260BC4dA7Dd60aCA6CA66208E642C5',
		wethGateway: '0xCFB1f08A4852699a979909e22c30263ca249556D',
		weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
		multicall: '0xcA11bde05977b3631167028862bE2a173976CA11', // Multicall3
	},
};

/**
 * Arbitrum Goerli Testnet bridge contracts (deprecated)
 */
export const ARBITRUM_GOERLI_BRIDGES: BridgeContracts = {
	l1: {
		inbox: '0x6BEbC4925716945D46F0Ec336D5C2564F419682C',
		outbox: '0x45Af9Ed1D03703e480CE7d328fB684bb67DA5049',
		bridge: '0xaf4159A80B6Cc41ED517DB1c453d1Ef5C2e4dB72',
		rollup: '0x45e5cAea8768F42B385A366D3551Ad1e0cbFAb17',
		sequencerInbox: '0x0484A87B144745A2E5b7c359552119B6EA2917A9',
		gateway: '0x4c7708168395aEa569453Fc36862D2ffcDaC588c', // GatewayRouter
		gatewayRouter: '0x4c7708168395aEa569453Fc36862D2ffcDaC588c',
		customGateway: '0x9fDD1C4E4AA24EEc1d913FABea925594a20d43C7',
		wethGateway: '0x6e244cD02BBB8a6dbd7F626f05B2ef82151Ab502',
		multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
	},
	l2: {
		arbSys: '0x0000000000000000000000000000000000000064',
		arbRetryableTx: '0x000000000000000000000000000000000000006E',
		arbGasInfo: '0x000000000000000000000000000000000000006C',
		arbAggregator: '0x000000000000000000000000000000000000006D',
		nodeInterface: '0x00000000000000000000000000000000000000C8',
		gateway: '0xE5B9d8d42d656d1DcB8065A6c012FE3780246f4',
		gatewayRouter: '0xE5B9d8d42d656d1DcB8065A6c012FE3780246f4',
		customGateway: '0x8Ca1e1AC0f260BC4dA7Dd60aCA6CA66208E642C5',
		wethGateway: '0xf9F2e89c8347BD96E6405EFfd86B86E60Ab01F6B',
		weth: '0x96E23DA31Ea53C31D16c9f7cBD7d3dE6e96b7C2',
		multicall: '0x842eC2c7D803033Edf55E478F461FC547Bc54EB2',
	},
};

/**
 * Get bridge contracts for a specific network
 */
export function getBridgeContracts(networkId: ArbitrumNetworkId): BridgeContracts {
	switch (networkId) {
		case 'arbitrumOne':
			return ARBITRUM_ONE_BRIDGES;
		case 'arbitrumNova':
			return ARBITRUM_NOVA_BRIDGES;
		case 'arbitrumSepolia':
			return ARBITRUM_SEPOLIA_BRIDGES;
		case 'arbitrumGoerli':
			return ARBITRUM_GOERLI_BRIDGES;
		case 'custom':
		default:
			// Default to Arbitrum One for custom networks
			return ARBITRUM_ONE_BRIDGES;
	}
}

/**
 * Arbitrum precompile addresses (same on all networks)
 * These are special addresses built into ArbOS
 */
export const BRIDGE_PRECOMPILES = {
	// Core ArbOS precompiles
	ArbSys: '0x0000000000000000000000000000000000000064',
	ArbInfo: '0x0000000000000000000000000000000000000065',
	ArbAddressTable: '0x0000000000000000000000000000000000000066',
	ArbBLS: '0x0000000000000000000000000000000000000067',
	ArbFunctionTable: '0x0000000000000000000000000000000000000068',
	ArbosTest: '0x0000000000000000000000000000000000000069',
	ArbGasInfo: '0x000000000000000000000000000000000000006C',
	ArbAggregator: '0x000000000000000000000000000000000000006D',
	ArbRetryableTx: '0x000000000000000000000000000000000000006E',
	ArbStatistics: '0x000000000000000000000000000000000000006F',
	ArbOwnerPublic: '0x000000000000000000000000000000000000006B',
	ArbOwner: '0x0000000000000000000000000000000000000070',
	ArbWasm: '0x0000000000000000000000000000000000000071',
	ArbWasmCache: '0x0000000000000000000000000000000000000072',

	// Node interface (special - not a precompile but acts like one)
	NodeInterface: '0x00000000000000000000000000000000000000C8',
} as const;

/**
 * Standard token gateway types
 */
export const GATEWAY_TYPES = {
	STANDARD: 'standard', // Standard ERC20 gateway
	CUSTOM: 'custom', // Custom gateway for special tokens
	WETH: 'weth', // WETH gateway
	DISABLED: 'disabled', // Token bridging disabled
} as const;

/**
 * Message status types for cross-chain messaging
 */
export const MESSAGE_STATUS = {
	// L1 to L2 (Retryable tickets)
	NOT_YET_CREATED: 'NOT_YET_CREATED',
	CREATION_FAILED: 'CREATION_FAILED',
	FUNDS_DEPOSITED_ON_L2: 'FUNDS_DEPOSITED_ON_L2',
	REDEEMED: 'REDEEMED',
	EXPIRED: 'EXPIRED',

	// L2 to L1 (Outbox messages)
	UNCONFIRMED: 'UNCONFIRMED',
	CONFIRMED: 'CONFIRMED',
	EXECUTED: 'EXECUTED',
} as const;

/**
 * Retryable ticket lifecycle status
 */
export const RETRYABLE_STATUS = {
	FUNDS_DEPOSITED: 'FUNDS_DEPOSITED',
	REDEEMED: 'REDEEMED',
	EXPIRED: 'EXPIRED',
	NOT_FOUND: 'NOT_FOUND',
	PENDING: 'PENDING',
} as const;

/**
 * Default bridge parameters
 */
export const BRIDGE_DEFAULTS = {
	// Gas settings for retryable tickets
	maxSubmissionCost: '0.01', // ETH - max cost to create ticket
	gasLimit: 2000000, // L2 gas for retryable execution
	maxFeePerGas: '0.5', // gwei - L2 gas price

	// Timeouts
	retryableLifetime: 7 * 24 * 60 * 60, // 7 days until expiry

	// Safety margins
	submissionCostMultiplier: 1.5, // Safety margin for submission cost
	gasLimitMultiplier: 1.2, // Safety margin for gas limit
} as const;

// Aliases for compatibility
export const BRIDGE_CONTRACTS = {
  arbitrumOne: ARBITRUM_ONE_BRIDGES,
  arbitrumNova: ARBITRUM_NOVA_BRIDGES,
  arbitrumSepolia: ARBITRUM_SEPOLIA_BRIDGES,
  arbitrumGoerli: ARBITRUM_GOERLI_BRIDGES,
};
export const L1_TO_L2_MESSAGE_STATUS = MESSAGE_STATUS;
export const L2_TO_L1_MESSAGE_STATUS = MESSAGE_STATUS;
