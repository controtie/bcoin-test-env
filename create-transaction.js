var bcoin = require('../bcoin');
var assert = require('assert');

var master = bcoin.hd.generate();

// derive first child from master hd wallet
var key = master.derive(0);

// make a keyring from that key: contains public key, address, pub key hash
var keyring = new bcoin.keyring(key.privateKey);
var cb = new bcoin.mtx();
cb.addInput({
  prevout: new bcoin.outpoint(),
  script: new bcoin.script(),
  sequence: 0xffffffff
});

// Send 50,000 satoshis to ourselves.
cb.addOutput({
  address: keyring.getAddress(),
  value: 50000
});

// Our available coins.
var coins = [];

// Convert the coinbase output to a Coin
// object and add it to our available coins.
// In reality you might get these coins from a wallet.
var coin = bcoin.coin.fromTX(cb, 0, -1);
coins.push(coin);

// Create our redeeming transaction.
var mtx = new bcoin.mtx();

// Send 10,000 satoshis to ourself.
mtx.addOutput({
  address: keyring.getAddress(),
  value: 10000
});

// Now that we've created the output, we can do some coin selection (the output
// must be added first so we know how much money is needed and also so we can
// accurately estimate the size for fee calculation).

// Select coins from our array and add inputs.
// Calculate fee and add a change output.
mtx.fund(coins, {
  // Use a rate of 10,000 satoshis per kb.
  // With the `fullnode` object, you can
  // use the fee estimator for this instead
  // of blindly guessing.
  rate: 10000,
  // Send the change back to ourselves.
  changeAddress: keyring.getAddress()
}).then(function() {
  // Sign input 0
  mtx.sign(keyring);

  // The transaction should now verify.
  assert(mtx.verify());

  // Commit our transaction and make it immutable.
  // This turns it from an MTX into a TX.
  var tx = mtx.toTX();

  // The transaction should still verify.
  // Regular transactions require a coin
  // viewpoint to be passed in.
  assert(tx.verify(mtx.view));
});
