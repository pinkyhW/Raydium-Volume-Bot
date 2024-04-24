import { Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import promptSync from 'prompt-sync';
import path from 'path';

const prompt = promptSync();

const keypairsDir = path.join(__dirname, 'keypairs');
const keyInfoPath = path.join(__dirname, 'keyInfo.json');

// Ensure the keypairs directory exists
if (!fs.existsSync(keypairsDir)) {
  fs.mkdirSync(keypairsDir, { recursive: true });
}

function generateWallets(numOfWallets: number): Keypair[] {
  let wallets: Keypair[] = [];
  for (let i = 0; i < numOfWallets; i++) {
    const wallet = Keypair.generate();
    wallets.push(wallet);
  }
  return wallets;
}

function saveKeypairToFile(keypair: Keypair, index: number) {
  const keypairPath = path.join(keypairsDir, `keypair${index + 1}.json`);
  fs.writeFileSync(keypairPath, JSON.stringify(Array.from(keypair.secretKey)));
}

function readKeypairs(): Keypair[] {
  const files = fs.readdirSync(keypairsDir);
  return files.map(file => {
    const filePath = path.join(keypairsDir, file);
    const secretKey = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Keypair.fromSecretKey(new Uint8Array(secretKey));
  });
}

function updatePoolInfo(wallets: Keypair[]) {
  const poolInfo: any = {
    numOfWallets: wallets.length,
  };

  wallets.forEach((wallet, index) => {
    poolInfo[`pubkey${index + 1}`] = wallet.publicKey.toString();
  });

  // Write the new poolInfo object to the file, overwriting any existing content.
  fs.writeFileSync(keyInfoPath, JSON.stringify(poolInfo, null, 2));
}


export function createKeypairs() {
  console.log('WARNING: If you create new ones, ensure you don\'t have SOL.');
  const action = prompt('Do you want to (c)reate new wallets or (u)se existing ones? (c/u): ');
  let wallets: Keypair[] = [];

  if (action === 'c') {
    const numOfWallets = parseInt(prompt('Enter the number of Solana wallets to create: '));
    if (isNaN(numOfWallets) || numOfWallets <= 0) {
      console.log('Invalid number. Please enter a positive integer.');
      return;
    }

    wallets = generateWallets(numOfWallets);
    wallets.forEach((wallet, index) => {
      saveKeypairToFile(wallet, index);
      console.log(`Wallet ${index + 1} Public Key: ${wallet.publicKey.toString()}`);
    });
  } else if (action === 'u') {
    wallets = readKeypairs();
    wallets.forEach((wallet, index) => {
      console.log(`Read Wallet ${index + 1} Public Key: ${wallet.publicKey.toString()}`);
    });
  } else {
    console.log('Invalid option. Please enter "c" for create or "u" for use existing.');
    return;
  }

  updatePoolInfo(wallets);
  console.log(`${wallets.length} wallets have been processed.`);
}
