import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createNft,
    mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
    generateSigner,
    percentAmount,
    signerIdentity,
    createNoopSigner,
    publicKey as umiPublicKey,
} from '@metaplex-foundation/umi';
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Connection, PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Solana mainnet-beta RPC endpoint
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const CLUSTER = 'mainnet-beta';

const APP_IDENTITY = {
    name: 'StayFit',
    uri: 'https://gostay.fit',
    icon: 'favicon.ico',
};

/**
 * Build a minimal Metaplex-compatible NFT metadata JSON and return it
 * as a data URI so we don't need a separate upload step.
 * For production you would upload this to Arweave / IPFS / Supabase Storage.
 */
const buildMetadataUri = (
    name: string,
    description: string,
    imageUrl: string
): string => {
    const metadata = {
        name,
        description,
        image: imageUrl,
        attributes: [
            { trait_type: 'App', value: 'StayFit Seeker' },
            { trait_type: 'Type', value: 'Progress Photo' },
        ],
        properties: {
            files: [{ uri: imageUrl, type: 'image/jpeg' }],
            category: 'image',
        },
    };
    // Encode as base64 data URI so the Metaplex validator accepts a URL
    const { Buffer } = require('buffer');
    return (
        'data:application/json;base64,' +
        Buffer.from(JSON.stringify(metadata)).toString('base64')
    );
};

export const mintProgressNFT = async (
    photoUrl: string,
    walletAddressStr: string,
    metadata: { name: string; description: string },
    userId?: string
) => {
    let txSignature = '';
    let mintAddress = '';

    try {
        console.log(`[NFT] Minting on mainnet-beta for wallet: ${walletAddressStr}`);

        await transact(async (wallet) => {
            // 1. Reauthorize with stored token (silent) or do a full authorize
            const storedAuthToken = userId
                ? await AsyncStorage.getItem(`wallet_auth_token_${userId}`)
                : null;

            let authResult: any;
            if (storedAuthToken) {
                try {
                    authResult = await wallet.reauthorize({
                        auth_token: storedAuthToken,
                        identity: APP_IDENTITY,
                    });
                    console.log('[NFT] Reauthorized successfully');
                } catch {
                    console.log('[NFT] Reauth failed, falling back to authorize');
                    authResult = await wallet.authorize({
                        cluster: CLUSTER,
                        identity: APP_IDENTITY,
                    });
                }
            } else {
                authResult = await wallet.authorize({
                    cluster: CLUSTER,
                    identity: APP_IDENTITY,
                });
            }

            // 2. Decode the MWA base64 address to a base58 public key
            const { Buffer } = require('buffer');
            const account = authResult.accounts[0];
            const userPubkeyStr = new PublicKey(
                Buffer.from(account.address, 'base64')
            ).toBase58();
            console.log('[NFT] Signing wallet:', userPubkeyStr);

            // Persist refreshed auth token
            if (authResult.auth_token && userId) {
                await AsyncStorage.setItem(
                    `wallet_auth_token_${userId}`,
                    authResult.auth_token
                );
            }

            // 3. Set up UMI with mainnet-beta RPC and the user as a no-op identity
            const umi = createUmi(RPC_ENDPOINT).use(mplTokenMetadata());
            const userNoopSigner = createNoopSigner(umiPublicKey(userPubkeyStr));
            umi.use(signerIdentity(userNoopSigner));

            // 4. Create a fresh mint keypair for this NFT
            const mint = generateSigner(umi);
            mintAddress = mint.publicKey.toString();
            console.log('[NFT] Mint address:', mintAddress);

            // 5. Build a metadata URI (use the photo URL as the image)
            const metadataUri = buildMetadataUri(
                metadata.name,
                metadata.description,
                photoUrl
            );

            // 6. Build the createNft instruction set
            const builder = createNft(umi, {
                mint,
                name: metadata.name,
                symbol: 'STFPROG',
                uri: metadataUri,
                sellerFeeBasisPoints: percentAmount(0),
                // The user's wallet is the update authority
                updateAuthority: userNoopSigner,
            });

            // 7. Fetch a fresh blockhash and build the raw UMI transaction
            const connection = new Connection(RPC_ENDPOINT, 'confirmed');
            const { blockhash, lastValidBlockHeight } =
                await connection.getLatestBlockhash('confirmed');

            const umiTx = builder.setBlockhash(blockhash).build(umi);

            // 8. The mint keypair must sign first (it is the mint authority)
            const signedByMint = await mint.signTransaction(umiTx);

            // 9. Convert to a web3.js VersionedTransaction for MWA signing
            const web3Tx = toWeb3JsTransaction(signedByMint);

            // 10. Ask the user's wallet to sign (pays fees + approves NFT creation)
            const [signedTx] = await wallet.signTransactions({
                transactions: [web3Tx],
            });

            // 11. Broadcast to mainnet-beta
            // skipPreflight: true is recommended for Metaplex multi-instruction txs
            txSignature = await connection.sendRawTransaction(
                signedTx.serialize(),
                {
                    skipPreflight: true,
                    preflightCommitment: 'confirmed',
                    maxRetries: 3,
                }
            );

            console.log('[NFT] Transaction sent:', txSignature);

            // 12. Wait for confirmation
            await connection.confirmTransaction(
                {
                    signature: txSignature,
                    blockhash,
                    lastValidBlockHeight,
                },
                'confirmed'
            );

            console.log('[NFT] Confirmed on mainnet-beta! Mint:', mintAddress);
        });

        return {
            success: true,
            mintAddress,
            signature: txSignature,
        };
    } catch (error: any) {
        console.error('[NFT] Minting error:', error);
        throw new Error(
            error.message || 'Minting failed. Please try again or check your wallet.'
        );
    }
};
