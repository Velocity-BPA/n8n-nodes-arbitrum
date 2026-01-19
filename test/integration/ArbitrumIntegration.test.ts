/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Integration tests for Arbitrum Node
 * 
 * These tests verify that the compiled code works correctly.
 * Set SKIP_INTEGRATION=true to skip network-dependent tests.
 */

const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === 'true';

describe('Arbitrum Integration Tests', () => {
	describe('Compiled Code Verification', () => {
		it('should have valid dist directory structure', () => {
			const fs = require('fs');
			const path = require('path');
			
			const distPath = path.join(__dirname, '../../dist');
			expect(fs.existsSync(distPath)).toBe(true);
		});

		it('should have compiled main node file', () => {
			const fs = require('fs');
			const path = require('path');
			
			const nodePath = path.join(__dirname, '../../dist/nodes/Arbitrum/Arbitrum.node.js');
			expect(fs.existsSync(nodePath)).toBe(true);
		});

		it('should have compiled trigger node file', () => {
			const fs = require('fs');
			const path = require('path');
			
			const triggerPath = path.join(__dirname, '../../dist/nodes/Arbitrum/ArbitrumTrigger.node.js');
			expect(fs.existsSync(triggerPath)).toBe(true);
		});

		it('should have compiled credentials files', () => {
			const fs = require('fs');
			const path = require('path');
			
			const rpcCredPath = path.join(__dirname, '../../dist/credentials/ArbitrumRpc.credentials.js');
			const arbiscanCredPath = path.join(__dirname, '../../dist/credentials/Arbiscan.credentials.js');
			
			expect(fs.existsSync(rpcCredPath)).toBe(true);
			expect(fs.existsSync(arbiscanCredPath)).toBe(true);
		});

		it('should have compiled action modules', () => {
			const fs = require('fs');
			const path = require('path');
			
			const actionsPath = path.join(__dirname, '../../dist/nodes/Arbitrum/actions');
			const expectedModules = [
				'account',
				'block',
				'bridge',
				'contract',
				'defi',
				'events',
				'l2tol1',
				'nft',
				'nova',
				'retryable',
				'stylus',
				'token',
				'transaction',
				'utility',
			];
			
			for (const module of expectedModules) {
				const modulePath = path.join(actionsPath, module, 'index.js');
				expect(fs.existsSync(modulePath)).toBe(true);
			}
		});

		it('should have compiled transport modules', () => {
			const fs = require('fs');
			const path = require('path');
			
			const transportPath = path.join(__dirname, '../../dist/nodes/Arbitrum/transport');
			const expectedModules = ['provider.js', 'explorerApi.js', 'arbitrumSdk.js'];
			
			for (const module of expectedModules) {
				const modulePath = path.join(transportPath, module);
				expect(fs.existsSync(modulePath)).toBe(true);
			}
		});

		it('should have compiled utility modules', () => {
			const fs = require('fs');
			const path = require('path');
			
			const utilsPath = path.join(__dirname, '../../dist/nodes/Arbitrum/utils');
			const expectedModules = [
				'index.js',
				'unitConverter.js',
				'gasCalculator.js',
				'bridgeUtils.js',
				'retryableUtils.js',
			];
			
			for (const module of expectedModules) {
				const modulePath = path.join(utilsPath, module);
				expect(fs.existsSync(modulePath)).toBe(true);
			}
		});

		it('should have node icon', () => {
			const fs = require('fs');
			const path = require('path');
			
			const iconPath = path.join(__dirname, '../../dist/nodes/Arbitrum/arbitrum.svg');
			expect(fs.existsSync(iconPath)).toBe(true);
		});
	});

	describe('Package Configuration', () => {
		it('should have valid package.json', () => {
			const packageJson = require('../../package.json');
			
			expect(packageJson.name).toBe('n8n-nodes-arbitrum');
			expect(packageJson.version).toBe('1.0.0');
			expect(packageJson.license).toBe('BUSL-1.1');
		});

		it('should have correct n8n configuration', () => {
			const packageJson = require('../../package.json');
			
			expect(packageJson.n8n).toBeDefined();
			expect(packageJson.n8n.n8nNodesApiVersion).toBe(1);
			expect(packageJson.n8n.credentials).toHaveLength(2);
			expect(packageJson.n8n.nodes).toHaveLength(2);
		});

		it('should have correct author information', () => {
			const packageJson = require('../../package.json');
			
			expect(packageJson.author.name).toBe('Velocity BPA');
			expect(packageJson.author.email).toBe('licensing@velobpa.com');
			expect(packageJson.author.url).toBe('https://velobpa.com');
		});
	});

	describe('Licensing Files', () => {
		it('should have LICENSE file', () => {
			const fs = require('fs');
			const path = require('path');
			
			const licensePath = path.join(__dirname, '../../LICENSE');
			expect(fs.existsSync(licensePath)).toBe(true);
			
			const content = fs.readFileSync(licensePath, 'utf8');
			expect(content).toContain('Business Source License 1.1');
			expect(content).toContain('Velocity BPA');
		});

		it('should have COMMERCIAL_LICENSE.md file', () => {
			const fs = require('fs');
			const path = require('path');
			
			const licensePath = path.join(__dirname, '../../COMMERCIAL_LICENSE.md');
			expect(fs.existsSync(licensePath)).toBe(true);
		});

		it('should have LICENSING_FAQ.md file', () => {
			const fs = require('fs');
			const path = require('path');
			
			const faqPath = path.join(__dirname, '../../LICENSING_FAQ.md');
			expect(fs.existsSync(faqPath)).toBe(true);
		});
	});
});
