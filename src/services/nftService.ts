import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createNft,
    mplTokenMetadata
} from '@metaplex-foundation/mpl-token-metadata';
import {
    generateSigner,
    percentAmount,
    signerIdentity,
    createNoopSigner,
    publicKey
} from '@metaplex-foundation/umi';
import { toWeb3JsTransaction } from '@metaplex-foundation/umi-web3js-adapters';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { Connection, PublicKey } from '@solana/web3.js';
import { supabase } from '../lib/supabase';

export const mintProgressNFT = async (
    photoUrl: string,
    walletAddressStr: string,
    metadata: { name: string, description: string }
) => {
    let signature = '';
    let mintAddress = '';

    try {
        console.log(`Minting NFT process started for: ${walletAddressStr}`);

        await transact(async (wallet) => {
            // 1. Authorize the dApp connection
            const authResult = await wallet.authorize({
                cluster: 'devnet',
                identity: {
                    name: 'StayFit',
                    uri: 'https://stayfit.app',
                    icon: 'favicon.ico',
                },
            });

            const account = authResult.accounts[0];
            const userPubkeyStr = new PublicKey(account.address).toBase58();

            // 2. Setup Umi & connection
            const rpcEndpoint = 'https://api.devnet.solana.com';
            const umi = createUmi(rpcEndpoint).use(mplTokenMetadata());
            const connection = new Connection(rpcEndpoint, 'confirmed');

            // Set user dummy signer so Umi knows fee payer/creator
            const userNoopSigner = createNoopSigner(publicKey(userPubkeyStr));
            umi.use(signerIdentity(userNoopSigner));

            // Generate Mint keypair representing the NFT
            const mint = generateSigner(umi);
            mintAddress = mint.publicKey.toString();

            // We'll use a placeholder generic metadata URI for the Hackathon prototype
            const metadataUri = 'https://raw.githubusercontent.com/stayfit-app/metadata/main/progress-nft.json';

            // 3. Build the Umi Transaction Builder
            const builder = createNft(umi, {
                mint,
                name: metadata.name,
                symbol: 'STFPROG',
                uri: metadataUri,
                sellerFeeBasisPoints: percentAmount(0),
            });

            // 4. Fetch the Blockhash and assemble the Transaction without Payer Signature
            const latestBlockhash = await connection.getLatestBlockhash();
            const tx = builder.setBlockhash(latestBlockhash.blockhash).build(umi);

            // 5. Sign the Transaction with the newly generated `mint` keypair
            const signedByMint = await mint.signTransaction(tx);

            // 6. Convert the Umi Transaction to a Web3.js VersionedTransaction
            const web3Tx = toWeb3JsTransaction(signedByMint);

            // 7. Request the user to sign the transaction natively inside their Wallet
            const [signedWeb3Tx] = await wallet.signTransactions({
                transactions: [web3Tx]
            });

            // 8. Send & Confirm Transaction on-chain
            signature = await connection.sendRawTransaction(signedWeb3Tx.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });

            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
            }, 'confirmed');

            console.log("Successfully minted! Tx Signature: ", signature);
        });

        return {
            success: true,
            mintAddress,
            signature
        };
    } catch (error: any) {
        console.error('Error minting NFT:', error);
        throw new Error(error.message || 'Minting failed. User might have rejected the transaction.');
    }
};
