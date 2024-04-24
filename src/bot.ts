import { 
  //SimulatedTransactionAccountInfo, 
  TransactionMessage, 
  VersionedTransaction,
  PublicKey,
  TransactionInstruction,
  Keypair,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { lookupTableProvider } from "./utils/LookupTableProvider";
// @ts-ignore
import { IDL } from '@jup-ag/raydium-clmm-sdk';
import { connection } from './config';
import { IPoolKeys } from './utils/interfaces';
import * as readline from 'readline';
import { derivePoolKeys } from './utils/poolKeys';
import { createKeypairs } from './createKeys';
import * as spl from '@solana/spl-token';
import { TOKEN_PROGRAM_ID, MAINNET_PROGRAM_ID } from '@raydium-io/raydium-sdk';
import path from 'path';
import fs from 'fs';

const keypairsDir = path.join(__dirname, 'keypairs');

async function executeSwaps(keypair: Keypair, marketID: string) {
  const poolKeysData = await derivePoolKeys(new PublicKey(marketID), keypair);
  if (poolKeysData === null) {
    throw new Error("Failed to derive pool keys.");
  }
  const poolKeysINIT: IPoolKeys = poolKeysData;
  
  const { buyIxs } = makeSwap(poolKeysINIT, false, keypair);
  const { sellIxs } = makeSwap(poolKeysINIT, true, keypair);

  let volumeIxs: TransactionInstruction[] = [
    ...buyIxs,
    ...sellIxs,
  ];

  const addressesMain: PublicKey[] = [];
    volumeIxs.forEach((ixn) => {
      ixn.keys.forEach((key) => {
          addressesMain.push(key.pubkey);
      });
  });

  const lookupTablesMain =
            lookupTableProvider.computeIdealLookupTablesForAddresses(addressesMain);

  const latestBlockhash = await connection.getLatestBlockhash('finalized');

  const messageV0 = new TransactionMessage({
    payerKey: keypair.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: volumeIxs,
  }).compileToV0Message(lookupTablesMain);

  const volumeTX = new VersionedTransaction(messageV0);
  
  try {
    volumeTX.sign([keypair]);
    const serializedMsg = volumeTX.serialize();
    if (serializedMsg.length > 1232) {
      console.log('tx too big');
      process.exit(0);
    }
  
    /*
    // Simulate the transaction
    const simulationResult = await connection.simulateTransaction(volumeTX, { commitment: "processed" });
  
    if (simulationResult.value.err) {
      console.log("Simulation error:", simulationResult.value.err);
    } else {
      console.log("Simulation success. Logs:");
      simulationResult.value.logs?.forEach(log => console.log(log));
    }
    */
  
  } catch (e) {
    console.log(e, 'error with volumeTX');
    process.exit(0);
  }
  
  try {
    // Send the transaction
    const txn =  await connection.sendTransaction(volumeTX, { skipPreflight: false, preflightCommitment: 'finalized' });  
    console.log("Transaction sent. Signature:", txn);
  } catch (error) {
    console.log(error, 'error sending transaction');
  }
  
}

function loadKeypairs(): Keypair[] {
  return fs.readdirSync(keypairsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(keypairsDir, file);
      const secretKeyString = fs.readFileSync(filePath, { encoding: 'utf8' });
      const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
      return Keypair.fromSecretKey(secretKey);
    });
}


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
      rl.question(query, (answer: string) => {
          resolve(answer);
      });
  });
}

async function main() {
  await createKeypairs(); // Remove if annoying eventually
  let keypairs = loadKeypairs();
  const marketID = await question('Enter your market ID: ');
  const cycles = +await question('Number of swaps to perform (Ex. 10): ');
  const delay = +await question('Delay between swaps in seconds (Ex. 3): ');

  for (let i = 0; i < cycles; i++) {
    // Dequeue the first keypair, ensuring it's not undefined
    const keypair = keypairs.shift();
    if (!keypair) {
      console.error("No available keypairs for this cycle.");
      break; // Exit the loop if no keypairs are available
    }
  
    console.log(`Cycle ${i + 1}, executing swap with keypair ${keypair.publicKey.toBase58()}`);
    await executeSwaps(keypair, marketID);
  
    // Enqueue the keypair back at the end
    keypairs.push(keypair);
  
    // Wait for the specified delay before proceeding to the next cycle
    await new Promise(resolve => setTimeout(resolve, delay * 1000));
  
    // Check if all cycles are completed for the current keypair before rotating
    if ((i + 1) % keypairs.length === 0) {
      console.log(`Completed a full rotation with all keypairs.`);
    }
  }
  

  console.log('Execution completed.');
}

main();

function makeSwap(
  poolKeys: IPoolKeys, 
  reverse: boolean,
  keypair: Keypair,
) { 
const programId = new PublicKey('Axz6g5nHgKzm5CbLJcAQauxpdpkL1BafBywSvotyTUSv'); // MY PROGRAM
const account1 = TOKEN_PROGRAM_ID; // token program
const account2 = poolKeys.id; // amm id  writable
const account3 = poolKeys.authority; // amm authority
const account4 = poolKeys.openOrders; // amm open orders  writable
const account5 = poolKeys.targetOrders; // amm target orders  writable
const account6 = poolKeys.baseVault; // pool coin token account  writable  AKA baseVault
const account7 = poolKeys.quoteVault; // pool pc token account  writable   AKA quoteVault
const account8 = poolKeys.marketProgramId; // serum program id
const account9 = poolKeys.marketId; //   serum market  writable
const account10 = poolKeys.marketBids; // serum bids  writable
const account11 = poolKeys.marketAsks; // serum asks  writable
const account12 = poolKeys.marketEventQueue; // serum event queue  writable
const account13 = poolKeys.marketBaseVault; // serum coin vault  writable     AKA marketBaseVault
const account14 = poolKeys.marketQuoteVault; //   serum pc vault  writable    AKA marketQuoteVault
const account15 = poolKeys.marketAuthority; // serum vault signer       AKA marketAuthority
let account16 = poolKeys.ownerQuoteAta; // user source token account  writable
let account17 = poolKeys.ownerBaseAta; // user dest token account   writable
const account18 = keypair.publicKey; // user owner (signer)  writable
const account19 = MAINNET_PROGRAM_ID.AmmV4; // ammV4  writable

if (reverse == true) {
  account16 = poolKeys.ownerBaseAta;
  account17 = poolKeys.ownerQuoteAta;
}

const buffer = Buffer.alloc(16);
const prefix = Buffer.from([0x09]);
const instructionData = Buffer.concat([prefix, buffer]);
const accountMetas = [
  { pubkey: account1, isSigner: false, isWritable: false },
  { pubkey: account2, isSigner: false, isWritable: true },
  { pubkey: account3, isSigner: false, isWritable: false },
  { pubkey: account4, isSigner: false, isWritable: true },
  { pubkey: account5, isSigner: false, isWritable: true },
  { pubkey: account6, isSigner: false, isWritable: true },
  { pubkey: account7, isSigner: false, isWritable: true },
  { pubkey: account8, isSigner: false, isWritable: false },
  { pubkey: account9, isSigner: false, isWritable: true },
  { pubkey: account10, isSigner: false, isWritable: true },
  { pubkey: account11, isSigner: false, isWritable: true },
  { pubkey: account12, isSigner: false, isWritable: true },
  { pubkey: account13, isSigner: false, isWritable: true },
  { pubkey: account14, isSigner: false, isWritable: true },
  { pubkey: account15, isSigner: false, isWritable: false },
  { pubkey: account16, isSigner: false, isWritable: true },
  { pubkey: account17, isSigner: false, isWritable: true },
  { pubkey: account18, isSigner: true, isWritable: true },
  { pubkey: account19, isSigner: false, isWritable: true }
];

const UNITPRICE = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: 600000 // change gas here
});

const UNITLIMIT = ComputeBudgetProgram.setComputeUnitLimit({ units: 250000 }); // change gas here
const createWsolQuoteAta = spl.createAssociatedTokenAccountIdempotentInstruction(
  keypair.publicKey,
  poolKeys.ownerQuoteAta,
  keypair.publicKey,
  poolKeys.quoteMint
);

const createTokenBaseAta = spl.createAssociatedTokenAccountIdempotentInstruction(
  keypair.publicKey,
  poolKeys.ownerBaseAta,
  keypair.publicKey,
  poolKeys.baseMint
);

const swap = new TransactionInstruction({
  keys: accountMetas,
  programId,
  data: instructionData
});

//const closeAta = spl.createCloseAccountInstruction(poolKeys.ownerBaseAta, keypair.publicKey, keypair.publicKey);

let buyIxs: TransactionInstruction[] = [];
let sellIxs: TransactionInstruction[] = [];

if (reverse === false) {
  buyIxs.push(UNITLIMIT);
  buyIxs.push(UNITPRICE);
  buyIxs.push(createWsolQuoteAta);
  buyIxs.push(createTokenBaseAta);
  buyIxs.push(swap);
}

if (reverse === true) {
  sellIxs.push(swap);
  //sellIxs.push(closeAta);
}

return { buyIxs, sellIxs } ;
}