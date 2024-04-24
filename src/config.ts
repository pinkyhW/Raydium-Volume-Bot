import { PublicKey, Connection } from '@solana/web3.js';

export const rayFee = new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5');
export const RayLiqPoolv4 = {
  string: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  pubKey: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
};

export const connection = new Connection('', { // RPC URL HERE
  commitment: 'confirmed',
});

