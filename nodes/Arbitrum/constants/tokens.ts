/**
 * Common Token Addresses on Arbitrum Networks
 *
 * This file contains addresses for popular tokens on Arbitrum One and Nova.
 * Includes native tokens, stablecoins, DeFi tokens, and bridged assets.
 */

import { ArbitrumNetworkId } from './networks';

/**
 * Token information interface
 */
export interface TokenInfo {
	address: string;
	name: string;
	symbol: string;
	decimals: number;
	logoURI?: string;
	l1Address?: string; // Corresponding address on L1 Ethereum
	isNative?: boolean;
	coingeckoId?: string;
}

/**
 * Token list for a network
 */
export type TokenList = Record<string, TokenInfo>;

/**
 * Arbitrum One Mainnet Tokens
 */
export const ARBITRUM_ONE_TOKENS: TokenList = {
	// Native/Wrapped ETH
	ETH: {
		address: '0x0000000000000000000000000000000000000000',
		name: 'Ethereum',
		symbol: 'ETH',
		decimals: 18,
		isNative: true,
		coingeckoId: 'ethereum',
	},
	WETH: {
		address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
		name: 'Wrapped Ethereum',
		symbol: 'WETH',
		decimals: 18,
		l1Address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
		coingeckoId: 'weth',
	},

	// Stablecoins
	USDC: {
		address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
		name: 'USD Coin',
		symbol: 'USDC',
		decimals: 6,
		l1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		coingeckoId: 'usd-coin',
	},
	'USDC.e': {
		address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
		name: 'Bridged USDC',
		symbol: 'USDC.e',
		decimals: 6,
		l1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		coingeckoId: 'usd-coin',
	},
	USDT: {
		address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
		name: 'Tether USD',
		symbol: 'USDT',
		decimals: 6,
		l1Address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
		coingeckoId: 'tether',
	},
	DAI: {
		address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
		name: 'Dai Stablecoin',
		symbol: 'DAI',
		decimals: 18,
		l1Address: '0x6B175474E89094C44Da98b954EescdeCB5BE3830',
		coingeckoId: 'dai',
	},
	FRAX: {
		address: '0x17FC002b466eEc40DaE837Fc4bE5c67993ddBd6F',
		name: 'Frax',
		symbol: 'FRAX',
		decimals: 18,
		l1Address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
		coingeckoId: 'frax',
	},
	LUSD: {
		address: '0x93b346b6BC2548dA6A1E7d98E9a421B42541425b',
		name: 'Liquity USD',
		symbol: 'LUSD',
		decimals: 18,
		l1Address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
		coingeckoId: 'liquity-usd',
	},

	// Major Cryptos
	WBTC: {
		address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
		name: 'Wrapped Bitcoin',
		symbol: 'WBTC',
		decimals: 8,
		l1Address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
		coingeckoId: 'wrapped-bitcoin',
	},

	// Arbitrum Native Tokens
	ARB: {
		address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
		name: 'Arbitrum',
		symbol: 'ARB',
		decimals: 18,
		coingeckoId: 'arbitrum',
	},

	// DeFi Tokens
	GMX: {
		address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
		name: 'GMX',
		symbol: 'GMX',
		decimals: 18,
		coingeckoId: 'gmx',
	},
	MAGIC: {
		address: '0x539bdE0d7Dbd336b79148AA742883198BBF60342',
		name: 'MAGIC',
		symbol: 'MAGIC',
		decimals: 18,
		coingeckoId: 'magic',
	},
	GRAIL: {
		address: '0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8',
		name: 'Camelot Token',
		symbol: 'GRAIL',
		decimals: 18,
		coingeckoId: 'camelot-token',
	},
	PENDLE: {
		address: '0x0c880f6761F1af8d9Aa9C466984b80DAb9a8c9e8',
		name: 'Pendle',
		symbol: 'PENDLE',
		decimals: 18,
		l1Address: '0x808507121B80c02388fAd14726482e061B8da827',
		coingeckoId: 'pendle',
	},
	RDNT: {
		address: '0x3082CC23568eA640225c2467653dB90e9250AaA0',
		name: 'Radiant',
		symbol: 'RDNT',
		decimals: 18,
		coingeckoId: 'radiant-capital',
	},
	JOE: {
		address: '0x371c7ec6D8039ff7933a2AA28EB827Ffe1F52f07',
		name: 'JoeToken',
		symbol: 'JOE',
		decimals: 18,
		coingeckoId: 'joe',
	},
	SUSHI: {
		address: '0xd4d42F0b6DEF4CE0383636770eF773390d85c61A',
		name: 'SushiToken',
		symbol: 'SUSHI',
		decimals: 18,
		l1Address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
		coingeckoId: 'sushi',
	},
	UNI: {
		address: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
		name: 'Uniswap',
		symbol: 'UNI',
		decimals: 18,
		l1Address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
		coingeckoId: 'uniswap',
	},
	LINK: {
		address: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
		name: 'ChainLink Token',
		symbol: 'LINK',
		decimals: 18,
		l1Address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
		coingeckoId: 'chainlink',
	},
	CRV: {
		address: '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978',
		name: 'Curve DAO Token',
		symbol: 'CRV',
		decimals: 18,
		l1Address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
		coingeckoId: 'curve-dao-token',
	},

	// Liquid Staking
	wstETH: {
		address: '0x5979D7b546E38E414F7E9822514be443A4800529',
		name: 'Wrapped stETH',
		symbol: 'wstETH',
		decimals: 18,
		l1Address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
		coingeckoId: 'wrapped-steth',
	},
	rETH: {
		address: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8',
		name: 'Rocket Pool ETH',
		symbol: 'rETH',
		decimals: 18,
		l1Address: '0xae78736Cd615f374D3085123A210448E74Fc6393',
		coingeckoId: 'rocket-pool-eth',
	},
	cbETH: {
		address: '0x1DEBd73E752bEaF79865Fd6446b0c970EaE7732f',
		name: 'Coinbase Wrapped Staked ETH',
		symbol: 'cbETH',
		decimals: 18,
		l1Address: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
		coingeckoId: 'coinbase-wrapped-staked-eth',
	},
};

/**
 * Arbitrum Nova Tokens
 */
export const ARBITRUM_NOVA_TOKENS: TokenList = {
	ETH: {
		address: '0x0000000000000000000000000000000000000000',
		name: 'Ethereum',
		symbol: 'ETH',
		decimals: 18,
		isNative: true,
		coingeckoId: 'ethereum',
	},
	WETH: {
		address: '0x722E8BdD2ce80A4422E880164f2079488e115365',
		name: 'Wrapped Ethereum',
		symbol: 'WETH',
		decimals: 18,
		l1Address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
		coingeckoId: 'weth',
	},
	USDC: {
		address: '0x750ba8b76187092B0D1E87E28daaf484d1b5273b',
		name: 'USD Coin',
		symbol: 'USDC',
		decimals: 6,
		l1Address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
		coingeckoId: 'usd-coin',
	},
	DAI: {
		address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
		name: 'Dai Stablecoin',
		symbol: 'DAI',
		decimals: 18,
		l1Address: '0x6B175474E89094C44Da98b954EedscdeCB5BE3830',
		coingeckoId: 'dai',
	},
	ARB: {
		address: '0xf823C3cD3CeBE0a1fA952ba88Dc9EEf8e0Bf46AD',
		name: 'Arbitrum',
		symbol: 'ARB',
		decimals: 18,
		coingeckoId: 'arbitrum',
	},
	MOON: {
		address: '0x0057Ac2d777797d31CD3f8f13bF5e927571D6Ad0',
		name: 'Moons',
		symbol: 'MOON',
		decimals: 18,
		coingeckoId: 'moons',
	},
};

/**
 * Arbitrum Sepolia Testnet Tokens
 */
export const ARBITRUM_SEPOLIA_TOKENS: TokenList = {
	ETH: {
		address: '0x0000000000000000000000000000000000000000',
		name: 'Sepolia Ethereum',
		symbol: 'ETH',
		decimals: 18,
		isNative: true,
	},
	WETH: {
		address: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
		name: 'Wrapped Ethereum',
		symbol: 'WETH',
		decimals: 18,
	},
};

/**
 * Get token list for a specific network
 */
export function getTokenList(networkId: ArbitrumNetworkId): TokenList {
	switch (networkId) {
		case 'arbitrumOne':
			return ARBITRUM_ONE_TOKENS;
		case 'arbitrumNova':
			return ARBITRUM_NOVA_TOKENS;
		case 'arbitrumSepolia':
		case 'arbitrumGoerli':
			return ARBITRUM_SEPOLIA_TOKENS;
		default:
			return {};
	}
}

/**
 * Get token by symbol
 */
export function getTokenBySymbol(
	networkId: ArbitrumNetworkId,
	symbol: string,
): TokenInfo | undefined {
	const tokens = getTokenList(networkId);
	return tokens[symbol.toUpperCase()];
}

/**
 * Get token by address
 */
export function getTokenByAddress(
	networkId: ArbitrumNetworkId,
	address: string,
): TokenInfo | undefined {
	const tokens = getTokenList(networkId);
	const normalizedAddress = address.toLowerCase();
	return Object.values(tokens).find(
		(token) => token.address.toLowerCase() === normalizedAddress,
	);
}

/**
 * DEX Router Addresses
 */
export const DEX_ROUTERS = {
	arbitrumOne: {
		uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
		uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
		uniswapV3QuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
		uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
		sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
		camelotRouter: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
		camelotFactory: '0x6EcCab422D763aC031210895C81787E87B43A652',
		oneInchRouter: '0x1111111254EEB25477B68fb85Ed929f73A960582',
		gmxRouter: '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064',
		gmxReader: '0x22199a49A999c351eF7927602CFB187ec3cae489',
		gmxVault: '0x489ee077994B6658eAfA855C308275EAd8097C4A',
		balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
		curveRegistry: '0x0E9fBb167DF83EdE3240D6a5fa5d40c6C6851e15',
	},
	arbitrumNova: {
		sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
		rcpswapRouter: '0x28e0f3ebab59a998C4f1019358388B5E2ca92cfA',
	},
} as const;

/**
 * Price Feed Addresses (Chainlink)
 */
export const CHAINLINK_FEEDS = {
	arbitrumOne: {
		'ETH/USD': '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612',
		'BTC/USD': '0x6ce185860a4963106506C203335A25e4Cb4b4Bb4',
		'ARB/USD': '0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6',
		'LINK/USD': '0x86E53CF1B870786351Da77A57575e79CB55812CB',
		'USDC/USD': '0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3',
		'USDT/USD': '0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7',
		'DAI/USD': '0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB',
		'GMX/USD': '0xDB98056FecFff59D032aB628337A4887110df3dB',
		'UNI/USD': '0x9C917083fDb403ab5ADbEC26Ee294f6EcAda2720',
		'SUSHI/USD': '0xb2A8BA74cbca38508BA1632761b56C897060147C',
		'CRV/USD': '0xaebDA2c976cfd1eE1977Eac079B4382acb849325',
		'FRAX/USD': '0x0809E3d38d1B4214958faf06D8b1B1a2b73f2ab8',
	},
} as const;

/**
 * Common contract addresses
 */
export const COMMON_CONTRACTS = {
	arbitrumOne: {
		// ENS (via Arbitrum portal)
		ensResolver: '0x0000000000000000000000000000000000000000', // No native ENS on Arbitrum

		// Permit2
		permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',

		// Multicall
		multicall2: '0x842eC2c7D803033Edf55E478F461FC547Bc54EB2',
		multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',

		// WETH
		weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',

		// Create2 deployer
		create2Deployer: '0x13b0D85CcB8bf860b6b79AF3029fCA081AE9beF2',
	},
	arbitrumNova: {
		permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
		multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
		weth: '0x722E8BdD2ce80A4422E880164f2079488e115365',
	},
} as const;
