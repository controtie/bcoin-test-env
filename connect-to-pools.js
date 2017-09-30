'use strict';

const bcoin = require('../bcoin').set('regtest');
const Chain = bcoin.chain;
const Mempool = bcoin.mempool;
const Pool = bcoin.pool;
const Miner = bcoin.miner;
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const prefix = '/Volumes/DylansBackup/test/.bcoin/regtest'
const chain = new Chain({
  db: 'leveldb',
  location: prefix + '/chain',
  //db: 'memory',
  network: 'regtest',
});

const mempool = new Mempool({ chain: chain });
const pool = new Pool({
  chain: chain,
  mempool: mempool,
  listen: true,
  broadcast: true,
  host: '127.0.0.1',
  port: 48444,
  maxPeers: 2
});

// Open the pool (implicitly opens mempool and chain).
(async function() {
  console.log('opening pool');
  await pool.open();
  await pool.connect();
  pool.startSync();
  console.log('setup complete');

  chain.on('block', (block) => {
    /*
    console.log('Connected block to blockchain:');
    console.log(block);
    */
  });

  mempool.on('tx', (tx) => {
    console.log('Added tx to mempool:');
    console.log(tx);
  });

  pool.on('tx', (tx) => {
    console.log('Saw transaction:');
    console.log(tx.rhash);
  });
  
})().catch(err => console.log(err.stack))


const miner = new Miner({
  chain: chain,
  mempool: mempool,
  address: 'n1NrMoKvnPeMB9q5anD4H5WCConHSp991T',
  useWorkers: true,
});
miner.open();


rl.on('line', (input) => {
  if (input === 'mine') {
    (async function() {
      let job, block, entry;

      job = await miner.createJob();
      block = await job.mineAsync();
      await chain.add(block);
      entry = await chain.getEntry(block.hash('hex'));
      await mempool.addBlock(entry, block.txs);
      console.log('mined block', block);
    })().catch(err => console.log(err.stack));
    return;
  }
  if (input === 'tx') {
    (async function() {
      console.log('tx');
    })().catch(err => console.log(err.stack));
    return;
  }

  console.log('===============================================================');
});


