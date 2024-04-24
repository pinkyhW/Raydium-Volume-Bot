import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as bs58 from 'bs58'; // You'll need to install this package
import promptSync from 'prompt-sync';
import path from 'path';

const prompt = promptSync();

const keypairsDir = path.join(__dirname, 'keypairs');

// Ensure the keypairs directory exists
if (!fs.existsSync(keypairsDir)) {
  fs.mkdirSync(keypairsDir, { recursive: true });
}

function saveKeypairToFile(keypair: Keypair, index: number) {
  const keypairPath = path.join(keypairsDir, `keypair${index + 1}.json`);
  fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
}

export function importKeypair() {
  const privateKeyBase58 = prompt('Enter your private key in Base58 format: ');

  try {
    const privateKeyUint8Array = new Uint8Array(bs58.decode(privateKeyBase58));
    const keypair = Keypair.fromSecretKey(privateKeyUint8Array);

    saveKeypairToFile(keypair, 0); // Assuming a single keypair import, hence index 0
    console.log(`Keypair imported. Public Key: ${keypair.publicKey.toString()}`);
  } catch (error) {
    console.error('Failed to import keypair:', error);
  }
}

// Run the import function
importKeypair();
