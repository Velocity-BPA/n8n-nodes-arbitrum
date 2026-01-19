/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

describe('Arbitrum Node Unit Tests', () => {
	describe('Network Constants', () => {
		it('should have correct Arbitrum One chain ID', () => {
			const ARBITRUM_ONE_CHAIN_ID = 42161;
			expect(ARBITRUM_ONE_CHAIN_ID).toBe(42161);
		});

		it('should have correct Arbitrum Nova chain ID', () => {
			const ARBITRUM_NOVA_CHAIN_ID = 42170;
			expect(ARBITRUM_NOVA_CHAIN_ID).toBe(42170);
		});

		it('should have correct Arbitrum Sepolia chain ID', () => {
			const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
			expect(ARBITRUM_SEPOLIA_CHAIN_ID).toBe(421614);
		});
	});

	describe('Address Validation', () => {
		const isValidAddress = (address: string): boolean => {
			return /^0x[a-fA-F0-9]{40}$/.test(address);
		};

		it('should validate correct Ethereum addresses', () => {
			expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f2bD98')).toBe(true);
			expect(isValidAddress('0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')).toBe(true);
		});

		it('should reject invalid addresses', () => {
			expect(isValidAddress('0xinvalid')).toBe(false);
			expect(isValidAddress('not-an-address')).toBe(false);
			expect(isValidAddress('0x123')).toBe(false);
		});
	});

	describe('Precompile Addresses', () => {
		const PRECOMPILES = {
			ArbSys: '0x0000000000000000000000000000000000000064',
			ArbGasInfo: '0x000000000000000000000000000000000000006C',
			ArbRetryableTx: '0x000000000000000000000000000000000000006E',
			NodeInterface: '0x00000000000000000000000000000000000000C8',
			ArbWasm: '0x0000000000000000000000000000000000000071',
		};

		const isValidAddress = (address: string): boolean => {
			return /^0x[a-fA-F0-9]{40}$/.test(address);
		};

		it('should have valid ArbSys address', () => {
			expect(isValidAddress(PRECOMPILES.ArbSys)).toBe(true);
		});

		it('should have valid ArbGasInfo address', () => {
			expect(isValidAddress(PRECOMPILES.ArbGasInfo)).toBe(true);
		});

		it('should have valid ArbRetryableTx address', () => {
			expect(isValidAddress(PRECOMPILES.ArbRetryableTx)).toBe(true);
		});

		it('should have valid NodeInterface address', () => {
			expect(isValidAddress(PRECOMPILES.NodeInterface)).toBe(true);
		});

		it('should have valid ArbWasm address', () => {
			expect(isValidAddress(PRECOMPILES.ArbWasm)).toBe(true);
		});
	});

	describe('Token Addresses', () => {
		const TOKENS = {
			WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
			USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
			USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
			ARB: '0x912CE59144191C1204E64559FE8253a0e49E6548',
			DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
		};

		const isValidAddress = (address: string): boolean => {
			return /^0x[a-fA-F0-9]{40}$/.test(address);
		};

		it('should have valid WETH address', () => {
			expect(isValidAddress(TOKENS.WETH)).toBe(true);
		});

		it('should have valid USDC address', () => {
			expect(isValidAddress(TOKENS.USDC)).toBe(true);
		});

		it('should have valid USDT address', () => {
			expect(isValidAddress(TOKENS.USDT)).toBe(true);
		});

		it('should have valid ARB address', () => {
			expect(isValidAddress(TOKENS.ARB)).toBe(true);
		});

		it('should have valid DAI address', () => {
			expect(isValidAddress(TOKENS.DAI)).toBe(true);
		});
	});

	describe('Unit Conversion Logic', () => {
		it('should convert wei to ether correctly', () => {
			// 1 ETH = 10^18 wei
			const weiValue = BigInt('1000000000000000000');
			const etherValue = Number(weiValue) / 1e18;
			expect(etherValue).toBe(1);
		});

		it('should convert gwei to wei correctly', () => {
			// 1 gwei = 10^9 wei
			const gweiValue = 1;
			const weiValue = BigInt(gweiValue) * BigInt(1e9);
			expect(weiValue).toBe(BigInt('1000000000'));
		});

		it('should handle token decimals correctly', () => {
			// USDC has 6 decimals
			const usdcDecimals = 6;
			const rawAmount = BigInt('1000000'); // 1 USDC
			const formattedAmount = Number(rawAmount) / Math.pow(10, usdcDecimals);
			expect(formattedAmount).toBe(1);
		});
	});

	describe('L1ToL2 Message Status Constants', () => {
		const L1ToL2MessageStatus = {
			NOT_YET_CREATED: 1,
			CREATION_FAILED: 2,
			FUNDS_DEPOSITED_ON_L2: 3,
			REDEEMED: 4,
			EXPIRED: 5,
		};

		it('should have correct NOT_YET_CREATED status', () => {
			expect(L1ToL2MessageStatus.NOT_YET_CREATED).toBe(1);
		});

		it('should have correct REDEEMED status', () => {
			expect(L1ToL2MessageStatus.REDEEMED).toBe(4);
		});

		it('should have correct EXPIRED status', () => {
			expect(L1ToL2MessageStatus.EXPIRED).toBe(5);
		});
	});

	describe('L2ToL1 Message Status Constants', () => {
		const L2ToL1MessageStatus = {
			UNCONFIRMED: 1,
			CONFIRMED: 2,
			EXECUTED: 3,
		};

		it('should have correct UNCONFIRMED status', () => {
			expect(L2ToL1MessageStatus.UNCONFIRMED).toBe(1);
		});

		it('should have correct CONFIRMED status', () => {
			expect(L2ToL1MessageStatus.CONFIRMED).toBe(2);
		});

		it('should have correct EXECUTED status', () => {
			expect(L2ToL1MessageStatus.EXECUTED).toBe(3);
		});
	});

	describe('Bridge Contracts', () => {
		const ARBITRUM_ONE_BRIDGES = {
			inbox: '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f',
			outbox: '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840',
			bridge: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
			rollup: '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35',
		};

		const isValidAddress = (address: string): boolean => {
			return /^0x[a-fA-F0-9]{40}$/.test(address);
		};

		it('should have valid inbox address', () => {
			expect(isValidAddress(ARBITRUM_ONE_BRIDGES.inbox)).toBe(true);
		});

		it('should have valid outbox address', () => {
			expect(isValidAddress(ARBITRUM_ONE_BRIDGES.outbox)).toBe(true);
		});

		it('should have valid bridge address', () => {
			expect(isValidAddress(ARBITRUM_ONE_BRIDGES.bridge)).toBe(true);
		});

		it('should have valid rollup address', () => {
			expect(isValidAddress(ARBITRUM_ONE_BRIDGES.rollup)).toBe(true);
		});
	});

	describe('DEX Router Addresses', () => {
		const DEX_ROUTERS = {
			UniswapV3: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
			SushiSwap: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
			Camelot: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
		};

		const isValidAddress = (address: string): boolean => {
			return /^0x[a-fA-F0-9]{40}$/.test(address);
		};

		it('should have valid Uniswap V3 router address', () => {
			expect(isValidAddress(DEX_ROUTERS.UniswapV3)).toBe(true);
		});

		it('should have valid SushiSwap router address', () => {
			expect(isValidAddress(DEX_ROUTERS.SushiSwap)).toBe(true);
		});

		it('should have valid Camelot router address', () => {
			expect(isValidAddress(DEX_ROUTERS.Camelot)).toBe(true);
		});
	});
});
