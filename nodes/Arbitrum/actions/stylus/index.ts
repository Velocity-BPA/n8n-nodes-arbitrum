import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getProvider, validateAddress } from '../../transport/provider';
import { ARBITRUM_NETWORKS, ABIS } from '../../constants';
import { ethers } from 'ethers';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stylus'],
			},
		},
		options: [
			{
				name: 'Get Stylus Contract Info',
				value: 'getStylusContractInfo',
				description: 'Get information about a Stylus (WASM) contract',
				action: 'Get stylus contract info',
			},
			{
				name: 'Check Stylus Activation',
				value: 'checkStylusActivation',
				description: 'Check if a contract is activated as a Stylus contract',
				action: 'Check stylus activation',
			},
			{
				name: 'Get WASM Contract Code',
				value: 'getWasmContractCode',
				description: 'Get the WASM bytecode of a Stylus contract',
				action: 'Get wasm contract code',
			},
			{
				name: 'Estimate Stylus Gas',
				value: 'estimateStylusGas',
				description: 'Estimate gas for a Stylus contract call',
				action: 'Estimate stylus gas',
			},
			{
				name: 'Activate Stylus Contract',
				value: 'activateStylusContract',
				description: 'Activate a deployed Stylus contract',
				action: 'Activate stylus contract',
			},
		],
		default: 'getStylusContractInfo',
	},
];

export const fields: INodeProperties[] = [
	// Contract Address (common field)
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The address of the Stylus contract',
		displayOptions: {
			show: {
				resource: ['stylus'],
				operation: [
					'getStylusContractInfo',
					'checkStylusActivation',
					'getWasmContractCode',
					'estimateStylusGas',
					'activateStylusContract',
				],
			},
		},
	},
	// Function Name (for gas estimation)
	{
		displayName: 'Function Name',
		name: 'functionName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'myFunction',
		description: 'Name of the function to estimate gas for',
		displayOptions: {
			show: {
				resource: ['stylus'],
				operation: ['estimateStylusGas'],
			},
		},
	},
	// Function Arguments
	{
		displayName: 'Function Arguments',
		name: 'functionArgs',
		type: 'string',
		default: '[]',
		placeholder: '["arg1", 123, true]',
		description: 'JSON array of function arguments',
		displayOptions: {
			show: {
				resource: ['stylus'],
				operation: ['estimateStylusGas'],
			},
		},
	},
	// ABI (for gas estimation)
	{
		displayName: 'ABI',
		name: 'abi',
		type: 'string',
		typeOptions: {
			rows: 5,
		},
		required: true,
		default: '',
		placeholder: '[{"name": "myFunction", "type": "function", ...}]',
		description: 'Contract ABI (JSON format)',
		displayOptions: {
			show: {
				resource: ['stylus'],
				operation: ['estimateStylusGas'],
			},
		},
	},
	// Data Deposit Value (for activation)
	{
		displayName: 'Data Fee (ETH)',
		name: 'dataFee',
		type: 'string',
		default: '0.001',
		description: 'ETH to deposit for data retention (recommended: 0.001 ETH)',
		displayOptions: {
			show: {
				resource: ['stylus'],
				operation: ['activateStylusContract'],
			},
		},
	},
	// Wait for Confirmation
	{
		displayName: 'Wait for Confirmation',
		name: 'waitForConfirmation',
		type: 'boolean',
		default: true,
		description: 'Whether to wait for the activation transaction to be confirmed',
		displayOptions: {
			show: {
				resource: ['stylus'],
				operation: ['activateStylusContract'],
			},
		},
	},
];

// ArbWasm precompile address and ABI
const ARB_WASM_ADDRESS = '0x0000000000000000000000000000000000000071';
const ARB_WASM_ABI = [
	'function activateProgram(address program) payable returns (uint16 version, uint256 dataFee)',
	'function programVersion(address program) view returns (uint16 version)',
	'function codehashVersion(bytes32 codehash) view returns (uint16 version)',
	'function stylusVersion() view returns (uint16 version)',
	'function programSize(address program) view returns (uint32 size)',
	'function programMemoryFootprint(address program) view returns (uint16 footprint)',
	'function programInitGas(address program) view returns (uint64 gas, uint64 gasWhenCached)',
	'function initGas(address program, bytes calldata data) view returns (uint64 gas, uint64 gasWhenCached)',
	'function activationCost(address program) view returns (uint64 gas, uint64 gasWhenCached)',
];

// ArbWasmCache precompile (for caching)
const ARB_WASM_CACHE_ADDRESS = '0x0000000000000000000000000000000000000072';
const ARB_WASM_CACHE_ABI = [
	'function cacheCodehash(bytes32 codehash) payable',
	'function cacheProgram(address program) payable',
	'function isProgramCached(address program) view returns (bool cached)',
	'function isCacheManager(address manager) view returns (bool isManager)',
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;

	let result: Record<string, unknown>;

	switch (operation) {
		case 'getStylusContractInfo': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			if (!validateAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid contract address');
			}
			result = await getStylusContractInfo.call(this, contractAddress);
			break;
		}

		case 'checkStylusActivation': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			if (!validateAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid contract address');
			}
			result = await checkStylusActivation.call(this, contractAddress);
			break;
		}

		case 'getWasmContractCode': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			if (!validateAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid contract address');
			}
			result = await getWasmContractCode.call(this, contractAddress);
			break;
		}

		case 'estimateStylusGas': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const functionName = this.getNodeParameter('functionName', index) as string;
			const functionArgsStr = this.getNodeParameter('functionArgs', index) as string;
			const abi = this.getNodeParameter('abi', index) as string;
			
			if (!validateAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid contract address');
			}
			
			let functionArgs: unknown[];
			try {
				functionArgs = JSON.parse(functionArgsStr);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid function arguments JSON');
			}
			
			let parsedAbi: ethers.InterfaceAbi;
			try {
				parsedAbi = JSON.parse(abi);
			} catch (error) {
				throw new NodeOperationError(this.getNode(), 'Invalid ABI JSON');
			}
			
			result = await estimateStylusGas.call(this, contractAddress, functionName, functionArgs, parsedAbi);
			break;
		}

		case 'activateStylusContract': {
			const contractAddress = this.getNodeParameter('contractAddress', index) as string;
			const dataFee = this.getNodeParameter('dataFee', index) as string;
			const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index) as boolean;
			
			if (!validateAddress(contractAddress)) {
				throw new NodeOperationError(this.getNode(), 'Invalid contract address');
			}
			
			result = await activateStylusContract.call(this, contractAddress, dataFee, waitForConfirmation);
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result as IDataObject }];
}

async function getStylusContractInfo(
	this: IExecuteFunctions,
	contractAddress: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Get basic contract info
	const code = await provider.getCode(contractAddress);
	if (code === '0x') {
		throw new NodeOperationError(this.getNode(), 'No contract found at this address');
	}

	// Check if it's a Stylus contract using ArbWasm precompile
	const arbWasm = new ethers.Contract(ARB_WASM_ADDRESS, ARB_WASM_ABI, provider);
	const arbWasmCache = new ethers.Contract(ARB_WASM_CACHE_ADDRESS, ARB_WASM_CACHE_ABI, provider);

	let stylusInfo: Record<string, unknown> = {
		address: contractAddress,
		network: networkConfig.name,
		chainId: networkConfig.chainId,
		isContract: true,
		bytecodeLength: code.length / 2 - 1, // Hex string, minus '0x'
	};

	try {
		// Get Stylus version
		const version = await arbWasm.programVersion(contractAddress);
		const isStylusContract = version > 0;

		stylusInfo.isStylusContract = isStylusContract;
		stylusInfo.stylusVersion = Number(version);

		if (isStylusContract) {
			// Get additional Stylus-specific info
			const [programSize, memoryFootprint, initGas, currentStylusVersion, isCached] = await Promise.all([
				arbWasm.programSize(contractAddress),
				arbWasm.programMemoryFootprint(contractAddress),
				arbWasm.programInitGas(contractAddress),
				arbWasm.stylusVersion(),
				arbWasmCache.isProgramCached(contractAddress),
			]);

			stylusInfo = {
				...stylusInfo,
				programSize: Number(programSize),
				memoryFootprint: Number(memoryFootprint),
				initGas: initGas[0].toString(),
				initGasCached: initGas[1].toString(),
				currentStylusVersion: Number(currentStylusVersion),
				isCached,
				contractType: 'Stylus (WASM)',
				supportedLanguages: ['Rust', 'C', 'C++'],
				description: 'This is a Stylus contract compiled to WASM bytecode',
			};
		} else {
			stylusInfo.contractType = 'EVM (Solidity/Vyper)';
			stylusInfo.description = 'This is a standard EVM contract, not a Stylus contract';
		}
	} catch (error) {
		// If ArbWasm calls fail, it's likely not a Stylus contract
		stylusInfo.isStylusContract = false;
		stylusInfo.contractType = 'EVM (Solidity/Vyper)';
		stylusInfo.note = 'Could not query Stylus-specific information';
	}

	return stylusInfo;
}

async function checkStylusActivation(
	this: IExecuteFunctions,
	contractAddress: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	const arbWasm = new ethers.Contract(ARB_WASM_ADDRESS, ARB_WASM_ABI, provider);
	const arbWasmCache = new ethers.Contract(ARB_WASM_CACHE_ADDRESS, ARB_WASM_CACHE_ABI, provider);

	// Get contract bytecode hash
	const code = await provider.getCode(contractAddress);
	if (code === '0x') {
		throw new NodeOperationError(this.getNode(), 'No contract found at this address');
	}
	const codehash = ethers.keccak256(code);

	try {
		const [programVersion, codehashVersion, stylusVersion, isCached] = await Promise.all([
			arbWasm.programVersion(contractAddress),
			arbWasm.codehashVersion(codehash),
			arbWasm.stylusVersion(),
			arbWasmCache.isProgramCached(contractAddress),
		]);

		const isActivated = Number(programVersion) > 0;

		return {
			address: contractAddress,
			network: networkConfig.name,
			codehash,
			isActivated,
			programVersion: Number(programVersion),
			codehashVersion: Number(codehashVersion),
			currentStylusVersion: Number(stylusVersion),
			isCached,
			needsActivation: !isActivated && Number(codehashVersion) > 0,
			status: isActivated
				? 'Active - Contract is activated and can be called'
				: Number(codehashVersion) > 0
					? 'Pending - WASM code deployed but not activated'
					: 'Not Stylus - This is not a Stylus contract',
			activationInfo: isActivated ? null : {
				description: 'To activate a Stylus contract, call the activateProgram function on ArbWasm',
				arbWasmAddress: ARB_WASM_ADDRESS,
				estimatedCost: 'Varies based on program size and complexity',
			},
		};
	} catch (error) {
		return {
			address: contractAddress,
			network: networkConfig.name,
			isActivated: false,
			isStylusContract: false,
			error: 'Failed to query activation status',
			message: 'This may not be a Stylus contract, or Stylus precompiles are not available on this network',
		};
	}
}

async function getWasmContractCode(
	this: IExecuteFunctions,
	contractAddress: string,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	const code = await provider.getCode(contractAddress);
	if (code === '0x') {
		throw new NodeOperationError(this.getNode(), 'No contract found at this address');
	}

	const codehash = ethers.keccak256(code);
	const arbWasm = new ethers.Contract(ARB_WASM_ADDRESS, ARB_WASM_ABI, provider);

	let version = 0;
	try {
		version = Number(await arbWasm.programVersion(contractAddress));
	} catch (error) {
		// Not a Stylus contract
	}

	const isStylusContract = version > 0;

	// Analyze WASM header if it looks like a Stylus contract
	let wasmInfo: Record<string, unknown> = {};
	if (isStylusContract) {
		// WASM magic number: 0x00 0x61 0x73 0x6D (\\0asm)
		const wasmMagic = '0061736d';
		const hasWasmHeader = code.slice(2, 10).toLowerCase() === wasmMagic;
		
		wasmInfo = {
			hasWasmHeader,
			wasmVersion: hasWasmHeader ? parseInt(code.slice(10, 18), 16) : null,
			format: 'Arbitrum Stylus WASM',
		};
	}

	return {
		address: contractAddress,
		network: networkConfig.name,
		codehash,
		bytecodeLength: (code.length - 2) / 2, // In bytes
		bytecodeHex: code,
		isStylusContract,
		stylusVersion: version,
		...wasmInfo,
		note: isStylusContract
			? 'This is compiled WASM bytecode from a Stylus contract'
			: 'This is standard EVM bytecode',
	};
}

async function estimateStylusGas(
	this: IExecuteFunctions,
	contractAddress: string,
	functionName: string,
	functionArgs: unknown[],
	abi: ethers.InterfaceAbi,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	const arbWasm = new ethers.Contract(ARB_WASM_ADDRESS, ARB_WASM_ABI, provider);

	// Create contract instance
	const contract = new ethers.Contract(contractAddress, abi, provider);

	// Encode function call
	const iface = new ethers.Interface(abi);
	const encodedData = iface.encodeFunctionData(functionName, functionArgs);

	// Get Stylus-specific gas info
	let initGas = { gas: BigInt(0), gasCached: BigInt(0) };
	let isStylusContract = false;
	
	try {
		const version = await arbWasm.programVersion(contractAddress);
		isStylusContract = Number(version) > 0;
		
		if (isStylusContract) {
			const gasInfo = await arbWasm.initGas(contractAddress, encodedData);
			initGas = { gas: gasInfo[0], gasCached: gasInfo[1] };
		}
	} catch (error) {
		// Not a Stylus contract or error getting gas info
	}

	// Estimate standard gas
	let estimatedGas: bigint;
	try {
		estimatedGas = await provider.estimateGas({
			to: contractAddress,
			data: encodedData,
		});
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Gas estimation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	// Get current gas prices
	const feeData = await provider.getFeeData();

	// Calculate costs
	const gasPrice = feeData.gasPrice || BigInt(100000000); // 0.1 gwei fallback
	const estimatedCost = estimatedGas * gasPrice;

	return {
		address: contractAddress,
		network: networkConfig.name,
		functionName,
		functionArgs,
		encodedData,
		isStylusContract,
		gasEstimation: {
			standardGas: estimatedGas.toString(),
			stylusInitGas: initGas.gas.toString(),
			stylusInitGasCached: initGas.gasCached.toString(),
			totalEstimatedGas: (estimatedGas + initGas.gas).toString(),
		},
		pricing: {
			gasPrice: gasPrice.toString(),
			gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
			estimatedCostWei: estimatedCost.toString(),
			estimatedCostEth: ethers.formatEther(estimatedCost),
		},
		notes: isStylusContract
			? [
				'Stylus contracts may have different gas costs than EVM contracts',
				'InitGas represents WASM initialization cost',
				'Cached gas is lower after first call in a block',
			]
			: [
				'This appears to be a standard EVM contract',
				'Gas estimation uses standard EVM rules',
			],
	};
}

async function activateStylusContract(
	this: IExecuteFunctions,
	contractAddress: string,
	dataFee: string,
	waitForConfirmation: boolean,
): Promise<Record<string, unknown>> {
	const provider = await getProvider.call(this);
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as string;
	const networkConfig = ARBITRUM_NETWORKS[network] || ARBITRUM_NETWORKS.arbitrumOne;

	// Need a signer for activation
	const privateKey = credentials.privateKey as string;
	if (!privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key required for contract activation'
		);
	}

	const signer = new ethers.Wallet(privateKey, provider);

	// Check if already activated
	const arbWasm = new ethers.Contract(ARB_WASM_ADDRESS, ARB_WASM_ABI, provider);
	const arbWasmWithSigner = new ethers.Contract(ARB_WASM_ADDRESS, ARB_WASM_ABI, signer);

	try {
		const currentVersion = await arbWasm.programVersion(contractAddress);
		if (Number(currentVersion) > 0) {
			return {
				address: contractAddress,
				network: networkConfig.name,
				status: 'Already Activated',
				currentVersion: Number(currentVersion),
				message: 'This contract is already activated as a Stylus contract',
			};
		}
	} catch (error) {
		// Continue with activation attempt
	}

	// Estimate activation cost
	let activationCost = { gas: BigInt(0), gasCached: BigInt(0) };
	try {
		activationCost = await arbWasm.activationCost(contractAddress);
	} catch (error) {
		// Use default estimates
	}

	// Convert data fee to wei
	const dataFeeWei = ethers.parseEther(dataFee);

	try {
		// Activate the contract
		const tx = await arbWasmWithSigner.activateProgram(contractAddress, {
			value: dataFeeWei,
		});

		const result: Record<string, unknown> = {
			address: contractAddress,
			network: networkConfig.name,
			transactionHash: tx.hash,
			dataFeePaid: dataFee,
			dataFeePaidWei: dataFeeWei.toString(),
			activationGasEstimate: activationCost.gas.toString(),
			status: 'Submitted',
		};

		if (waitForConfirmation) {
			const receipt = await tx.wait();
			
			// Try to get the new version
			let newVersion = 0;
			try {
				newVersion = Number(await arbWasm.programVersion(contractAddress));
			} catch (error) {
				// Version query failed
			}

			result.status = receipt?.status === 1 ? 'Activated' : 'Failed';
			result.blockNumber = receipt?.blockNumber;
			result.gasUsed = receipt?.gasUsed.toString();
			result.newVersion = newVersion;
			result.receipt = {
				blockHash: receipt?.blockHash,
				transactionIndex: receipt?.index,
				effectiveGasPrice: receipt?.gasPrice?.toString(),
			};
		}

		return result;
	} catch (error) {
		throw new NodeOperationError(
			this.getNode(),
			`Activation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

export const stylus = { operations, fields, execute };
