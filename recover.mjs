import * as bitcoin from 'bitcoinjs-lib';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

const knownPart = "5bCRZhiS5sEGMpmcRZdpAhmWLRfMmutGmPHtjVob"; // Replace with your known 40 characters
const targetAddress = "1PfNh5fRcE9JKDmicD2Rh3pexGwce1LqyU"; // Replace with your wallet's public address
const hexChars = "0123456789abcdef";
const numThreads = 8; // Number of threads to use

if (isMainThread) {
  // Main thread: Distribute the workload
  console.log("Starting brute force with parallel threads...");

  const totalCombinations = 16 ** 12;
  const chunkSize = Math.ceil(totalCombinations / numThreads);

  for (let i = 0; i < numThreads; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, totalCombinations);

    new Worker(new URL(import.meta.url), { workerData: { start, end, knownPart, targetAddress } });
  }
} else {
  // Worker thread: Perform brute force
  const { start, end, knownPart, targetAddress } = workerData;

  function toHex(n, length) {
    return n.toString(16).padStart(length, '0');
  }

  for (let i = start; i < end; i++) {
    const prefix = toHex(i, 12);
    const privateKeyHex = prefix + knownPart;

    try {
      const keyPair = bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKeyHex, 'hex'));
      const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
      if (address === targetAddress) {
        console.log(`Found private key: ${privateKeyHex}`);
        process.exit(0); // Stop all threads
      }
    } catch (err) {
      // Ignore invalid keys
    }
  }

  console.log("Worker finished processing.");
}