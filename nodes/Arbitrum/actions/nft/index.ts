/**
 * NFT Resource Actions (ERC-721/ERC-1155)
 * Operations for Arbitrum NFT interactions
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { ethers } from 'ethers';
import {
	createProvider,
	validateAddress,
	formatTransactionResponse,
	waitForTransaction,
} from '../../transport/provider';
import { createArbiscanClient } from '../../transport/explorerApi';
import { ABIS } from '../../constants/abis';
import type { ArbitrumNetworkId } from '../../constants/networks';

export const nftOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['nft'],
			},
		},
		options: [
			{
				name: 'Get NFT Metadata',
				value: 'getMetadata',
				description: 'Get NFT metadata and token URI',
				action: 'Get NFT metadata',
			},
			{
				name: 'Get NFT Owner',
				value: 'getOwner',
				description: 'Get the owner of an NFT (ERC-721)',
				action: 'Get NFT owner',
			},
			{
				name: 'Get NFTs by Owner',
				value: 'getByOwner',
				description: 'Get all NFTs owned by an address',
				action: 'Get NFTs by owner',
			},
			{
				name: 'Transfer NFT',
				value: 'transfer',
				description: 'Transfer an NFT to another address',
				action: 'Transfer NFT',
			},
			{
				name: 'Get Collection Info',
				value: 'getCollectionInfo',
				description: 'Get NFT collection information',
				action: 'Get collection info',
			},
			{
				name: 'Get NFT Transfers',
				value: 'getTransfers',
				description: 'Get transfer history for an NFT collection',
				action: 'Get NFT transfers',
			},
			{
				name: 'Batch Transfer (ERC-1155)',
				value: 'batchTransfer',
				description: 'Transfer multiple ERC-1155 tokens',
				action: 'Batch transfer ERC-1155',
			},
			{
				name: 'Check Ownership',
				value: 'checkOwnership',
				description: 'Check if an address owns a specific NFT',
				action: 'Check NFT ownership',
			},
			{
				name: 'Get Balance (ERC-1155)',
				value: 'getBalance1155',
				description: 'Get ERC-1155 token balance',
				action: 'Get ERC-1155 balance',
			},
			{
				name: 'Approve',
				value: 'approve',
				description: 'Approve an address to transfer NFT',
				action: 'Approve NFT transfer',
			},
			{
				name: 'Set Approval For All',
				value: 'setApprovalForAll',
				description: 'Approve an address to transfer all NFTs',
				action: 'Set approval for all',
			},
		],
		default: 'getMetadata',
	},
];

export const nftFields: INodeProperties[] = [
	// NFT Type
	{
		displayName: 'NFT Standard',
		name: 'nftStandard',
		type: 'options',
		default: 'erc721',
		description: 'The NFT standard type',
		options: [
			{ name: 'ERC-721', value: 'erc721' },
			{ name: 'ERC-1155', value: 'erc1155' },
		],
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: [
					'getMetadata',
					'transfer',
					'checkOwnership',
					'approve',
				],
			},
		},
	},
	// Contract address
	{
		displayName: 'Contract Address',
		name: 'contractAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The NFT contract address',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: [
					'getMetadata',
					'getOwner',
					'transfer',
					'getCollectionInfo',
					'getTransfers',
					'batchTransfer',
					'checkOwnership',
					'getBalance1155',
					'approve',
					'setApprovalForAll',
				],
			},
		},
	},
	// Token ID
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1',
		description: 'The NFT token ID',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: [
					'getMetadata',
					'getOwner',
					'transfer',
					'checkOwnership',
					'getBalance1155',
					'approve',
				],
			},
		},
	},
	// Owner address for balance queries
	{
		displayName: 'Owner Address',
		name: 'ownerAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The NFT owner address',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getByOwner', 'checkOwnership', 'getBalance1155'],
			},
		},
	},
	// Transfer fields
	{
		displayName: 'To Address',
		name: 'toAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The recipient address',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer', 'batchTransfer'],
			},
		},
	},
	// ERC-1155 amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 1,
		description: 'Amount to transfer (for ERC-1155)',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer'],
				nftStandard: ['erc1155'],
			},
		},
	},
	// Batch transfer fields
	{
		displayName: 'Token IDs',
		name: 'tokenIds',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1,2,3',
		description: 'Comma-separated list of token IDs',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['batchTransfer'],
			},
		},
	},
	{
		displayName: 'Amounts',
		name: 'amounts',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1,1,1',
		description: 'Comma-separated list of amounts (must match token IDs)',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['batchTransfer'],
			},
		},
	},
	// Approval fields
	{
		displayName: 'Approved Address',
		name: 'approvedAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0x...',
		description: 'The address to approve',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['approve', 'setApprovalForAll'],
			},
		},
	},
	{
		displayName: 'Approved',
		name: 'approved',
		type: 'boolean',
		default: true,
		description: 'Whether to grant or revoke approval',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['setApprovalForAll'],
			},
		},
	},
	// Pagination for listings
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 1,
		description: 'Page number for paginated results',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getByOwner', 'getTransfers'],
			},
		},
	},
	{
		displayName: 'Page Size',
		name: 'pageSize',
		type: 'number',
		default: 100,
		description: 'Number of results per page',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['getByOwner', 'getTransfers'],
			},
		},
	},
	// Transaction options
	{
		displayName: 'Wait for Confirmation',
		name: 'waitForConfirmation',
		type: 'boolean',
		default: true,
		description: 'Whether to wait for the transaction to be confirmed',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer', 'batchTransfer', 'approve', 'setApprovalForAll'],
			},
		},
	},
	{
		displayName: 'Confirmations',
		name: 'confirmations',
		type: 'number',
		default: 1,
		description: 'Number of confirmations to wait for',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer', 'batchTransfer', 'approve', 'setApprovalForAll'],
				waitForConfirmation: [true],
			},
		},
	},
	// Use safe transfer
	{
		displayName: 'Use Safe Transfer',
		name: 'useSafeTransfer',
		type: 'boolean',
		default: true,
		description: 'Whether to use safeTransferFrom (recommended)',
		displayOptions: {
			show: {
				resource: ['nft'],
				operation: ['transfer'],
			},
		},
	},
];

/**
 * Execute NFT operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('arbitrumRpc');
	const network = credentials.network as ArbitrumNetworkId;

	let result: INodeExecutionData[] = [];

	try {
		switch (operation) {
			case 'getMetadata':
				result = await getMetadata.call(this, index, credentials);
				break;
			case 'getOwner':
				result = await getOwner.call(this, index, credentials);
				break;
			case 'getByOwner':
				result = await getByOwner.call(this, index, network);
				break;
			case 'transfer':
				result = await transferNft.call(this, index, credentials);
				break;
			case 'getCollectionInfo':
				result = await getCollectionInfo.call(this, index, credentials);
				break;
			case 'getTransfers':
				result = await getTransfers.call(this, index, network);
				break;
			case 'batchTransfer':
				result = await batchTransfer.call(this, index, credentials);
				break;
			case 'checkOwnership':
				result = await checkOwnership.call(this, index, credentials);
				break;
			case 'getBalance1155':
				result = await getBalance1155.call(this, index, credentials);
				break;
			case 'approve':
				result = await approveNft.call(this, index, credentials);
				break;
			case 'setApprovalForAll':
				result = await setApprovalForAll.call(this, index, credentials);
				break;
			default:
				throw new NodeOperationError(
					this.getNode(),
					`Unknown operation: ${operation}`,
				);
		}
	} catch (error) {
		if (error instanceof NodeOperationError) throw error;
		throw new NodeOperationError(
			this.getNode(),
			`NFT operation failed: ${(error as Error).message}`,
			{ itemIndex: index },
		);
	}

	return result;
}

// Operation implementations

async function getMetadata(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const tokenId = this.getNodeParameter('tokenId', index) as string;
	const nftStandard = this.getNodeParameter('nftStandard', index, 'erc721') as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const abi = nftStandard === 'erc721' ? ABIS.ERC721 : ABIS.ERC1155;
	const contract = new ethers.Contract(contractAddress, abi, provider);

	let tokenUri: string | null = null;
	let metadata: any = null;

	try {
		if (nftStandard === 'erc721') {
			tokenUri = await contract.tokenURI(tokenId);
		} else {
			tokenUri = await contract.uri(tokenId);
			// ERC-1155 URIs may have {id} placeholder
			tokenUri = tokenUri.replace('{id}', tokenId);
		}

		// Try to fetch metadata if it's an HTTP(S) URL
		if (tokenUri && (tokenUri.startsWith('http://') || tokenUri.startsWith('https://'))) {
			try {
				const response = await fetch(tokenUri);
				metadata = await response.json();
			} catch {
				// Metadata fetch failed, just return URI
			}
		} else if (tokenUri && tokenUri.startsWith('data:application/json')) {
			// Handle base64 encoded JSON
			const base64Data = tokenUri.split(',')[1];
			metadata = JSON.parse(Buffer.from(base64Data, 'base64').toString());
		}
	} catch {
		tokenUri = null;
	}

	return [
		{
			json: {
				contractAddress,
				tokenId,
				nftStandard,
				tokenUri,
				metadata,
				network: credentials.network,
			},
		},
	];
}

async function getOwner(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const tokenId = this.getNodeParameter('tokenId', index) as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(contractAddress, ABIS.ERC721, provider);

	const owner = await contract.ownerOf(tokenId);

	return [
		{
			json: {
				contractAddress,
				tokenId,
				owner,
				network: credentials.network,
			},
		},
	];
}

async function getByOwner(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;

	if (!validateAddress(ownerAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	// Get ERC-721 and ERC-1155 transfers to find owned NFTs
	const [erc721Transfers, erc1155Transfers] = await Promise.all([
		client.getNFTTransfers(ownerAddress, { page, offset: pageSize, sort: 'desc' }),
		client.getERC1155Transfers(ownerAddress, { page, offset: pageSize, sort: 'desc' }),
	]);

	return [
		{
			json: {
				ownerAddress,
				network,
				page,
				pageSize,
				erc721Transfers,
				erc1155Transfers,
			},
		},
	];
}

async function transferNft(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const tokenId = this.getNodeParameter('tokenId', index) as string;
	const toAddress = this.getNodeParameter('toAddress', index) as string;
	const nftStandard = this.getNodeParameter('nftStandard', index, 'erc721') as string;
	const useSafeTransfer = this.getNodeParameter('useSafeTransfer', index, true) as boolean;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(toAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to transfer NFTs',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const signerAddress = await signer.getAddress();
	let txResponse;

	if (nftStandard === 'erc721') {
		const contract = new ethers.Contract(contractAddress, ABIS.ERC721, signer);
		if (useSafeTransfer) {
			txResponse = await contract['safeTransferFrom(address,address,uint256)'](
				signerAddress,
				toAddress,
				tokenId,
			);
		} else {
			txResponse = await contract.transferFrom(signerAddress, toAddress, tokenId);
		}
	} else {
		const contract = new ethers.Contract(contractAddress, ABIS.ERC1155, signer);
		const amount = this.getNodeParameter('amount', index, 1) as number;
		txResponse = await contract.safeTransferFrom(
			signerAddress,
			toAddress,
			tokenId,
			amount,
			'0x',
		);
	}

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				contractAddress,
				tokenId,
				toAddress,
				nftStandard,
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function getCollectionInfo(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	
	// Try ERC-721 first
	const contract721 = new ethers.Contract(contractAddress, ABIS.ERC721, provider);

	const [name, symbol, totalSupply] = await Promise.all([
		contract721.name().catch(() => 'Unknown'),
		contract721.symbol().catch(() => 'UNKNOWN'),
		contract721.totalSupply?.().catch(() => null),
	]);

	// Check for common interfaces
	let supportsERC721 = false;
	let supportsERC1155 = false;

	try {
		// ERC-165 interface check
		supportsERC721 = await contract721.supportsInterface('0x80ac58cd');
	} catch {
		supportsERC721 = false;
	}

	try {
		supportsERC1155 = await contract721.supportsInterface('0xd9b67a26');
	} catch {
		supportsERC1155 = false;
	}

	return [
		{
			json: {
				contractAddress,
				name,
				symbol,
				totalSupply: totalSupply?.toString() || 'unknown',
				supportsERC721,
				supportsERC1155,
				network: credentials.network,
			},
		},
	];
}

async function getTransfers(
	this: IExecuteFunctions,
	index: number,
	network: ArbitrumNetworkId,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const page = this.getNodeParameter('page', index, 1) as number;
	const pageSize = this.getNodeParameter('pageSize', index, 100) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}

	const arbiscanCredentials = await this.getCredentials('arbiscan');
	const client = createArbiscanClient(arbiscanCredentials);

	const transfers = await client.getNFTTransfers(contractAddress, { page, offset: pageSize, sort: 'desc' });

	return [
		{
			json: {
				contractAddress,
				network,
				page,
				pageSize,
				transferCount: transfers.length,
				transfers,
			},
		},
	];
}

async function batchTransfer(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const toAddress = this.getNodeParameter('toAddress', index) as string;
	const tokenIdsStr = this.getNodeParameter('tokenIds', index) as string;
	const amountsStr = this.getNodeParameter('amounts', index) as string;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(toAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid to address: ${toAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to transfer NFTs',
			{ itemIndex: index },
		);
	}

	const tokenIds = tokenIdsStr.split(',').map((id) => id.trim());
	const amounts = amountsStr.split(',').map((amount) => BigInt(amount.trim()));

	if (tokenIds.length !== amounts.length) {
		throw new NodeOperationError(
			this.getNode(),
			'Token IDs and amounts must have the same length',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const signerAddress = await signer.getAddress();
	const contract = new ethers.Contract(contractAddress, ABIS.ERC1155, signer);

	const txResponse = await contract.safeBatchTransferFrom(
		signerAddress,
		toAddress,
		tokenIds,
		amounts,
		'0x',
	);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				contractAddress,
				toAddress,
				tokenIds,
				amounts: amounts.map((a) => a.toString()),
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function checkOwnership(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const tokenId = this.getNodeParameter('tokenId', index) as string;
	const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;
	const nftStandard = this.getNodeParameter('nftStandard', index, 'erc721') as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(ownerAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);

	let isOwner = false;
	let balance: string | null = null;

	if (nftStandard === 'erc721') {
		const contract = new ethers.Contract(contractAddress, ABIS.ERC721, provider);
		const owner = await contract.ownerOf(tokenId);
		isOwner = owner.toLowerCase() === ownerAddress.toLowerCase();
	} else {
		const contract = new ethers.Contract(contractAddress, ABIS.ERC1155, provider);
		const tokenBalance = await contract.balanceOf(ownerAddress, tokenId);
		balance = tokenBalance.toString();
		isOwner = tokenBalance > 0n;
	}

	return [
		{
			json: {
				contractAddress,
				tokenId,
				ownerAddress,
				nftStandard,
				isOwner,
				balance,
				network: credentials.network,
			},
		},
	];
}

async function getBalance1155(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const tokenId = this.getNodeParameter('tokenId', index) as string;
	const ownerAddress = this.getNodeParameter('ownerAddress', index) as string;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(ownerAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid owner address: ${ownerAddress}`, {
			itemIndex: index,
		});
	}

	const { provider } = await createProvider(credentials);
	const contract = new ethers.Contract(contractAddress, ABIS.ERC1155, provider);

	const balance = await contract.balanceOf(ownerAddress, tokenId);

	return [
		{
			json: {
				contractAddress,
				tokenId,
				ownerAddress,
				balance: balance.toString(),
				network: credentials.network,
			},
		},
	];
}

async function approveNft(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const tokenId = this.getNodeParameter('tokenId', index) as string;
	const approvedAddress = this.getNodeParameter('approvedAddress', index) as string;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(approvedAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid approved address: ${approvedAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to approve NFTs',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	const contract = new ethers.Contract(contractAddress, ABIS.ERC721, signer);
	const txResponse = await contract.approve(approvedAddress, tokenId);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				contractAddress,
				tokenId,
				approvedAddress,
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

async function setApprovalForAll(
	this: IExecuteFunctions,
	index: number,
	credentials: any,
): Promise<INodeExecutionData[]> {
	const contractAddress = this.getNodeParameter('contractAddress', index) as string;
	const approvedAddress = this.getNodeParameter('approvedAddress', index) as string;
	const approved = this.getNodeParameter('approved', index, true) as boolean;
	const waitForConfirmation = this.getNodeParameter('waitForConfirmation', index, true) as boolean;
	const confirmations = this.getNodeParameter('confirmations', index, 1) as number;

	if (!validateAddress(contractAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid contract address: ${contractAddress}`, {
			itemIndex: index,
		});
	}
	if (!validateAddress(approvedAddress)) {
		throw new NodeOperationError(this.getNode(), `Invalid approved address: ${approvedAddress}`, {
			itemIndex: index,
		});
	}
	if (!credentials.privateKey) {
		throw new NodeOperationError(
			this.getNode(),
			'Private key is required to approve NFTs',
			{ itemIndex: index },
		);
	}

	const { provider, signer } = await createProvider(credentials);
	if (!signer) {
		throw new NodeOperationError(this.getNode(), 'Failed to create signer', {
			itemIndex: index,
		});
	}

	// Works for both ERC-721 and ERC-1155
	const contract = new ethers.Contract(contractAddress, ABIS.ERC721, signer);
	const txResponse = await contract.setApprovalForAll(approvedAddress, approved);

	let receipt = null;
	if (waitForConfirmation) {
		receipt = await waitForTransaction(provider, txResponse.hash, confirmations);
	}

	return [
		{
			json: {
				success: true,
				contractAddress,
				approvedAddress,
				approved,
				transaction: formatTransactionResponse(txResponse),
				receipt: receipt
					? {
							status: receipt.status === 1 ? 'success' : 'failed',
							blockNumber: receipt.blockNumber,
							gasUsed: receipt.gasUsed.toString(),
					  }
					: null,
				network: credentials.network,
			},
		},
	];
}

export const nft = {
	operations: nftOperations,
	fields: nftFields,
	execute,
};
