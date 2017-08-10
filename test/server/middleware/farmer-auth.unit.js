'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const secp256k1 = require('secp256k1');
const auth = require('../../../lib/server/middleware/farmer-auth');

describe('Farmer Authentication Middleware', function() {
  const sandbox = sinon.sandbox.create();
  afterEach(() => sandbox.restore());

  describe('#authFarmer', function() {
    it('will give error for invalid timestamp', function() {
    });
    it('will give error for invalid pubkey', function() {
    });
    it('will give error for invalid nodeid', function() {
    });
    it('will give error if missing body', function() {
    });
    it('will give error for invalid signature', function() {
    });
    it('will continue without error', function() {
    });
  });


  describe('#checkTimestamp', function() {
    it('return false with timestamp below threshold', function() {
      const clock = sandbox.useFakeTimers();
      clock.tick(1502390208007 + 300000);
      let req = {
        headers: function(key) {
          if (key === 'timestamp') {
            return 1502390208007 - 300000 - 1;
          }
        }
      };
      expect(auth.checkTimestamp(req)).to.equal(false);
    });
    it('return false with timestamp above threshold', function() {
      const clock = sandbox.useFakeTimers();
      clock.tick(1502390208007 + 300000);
      let req = {
        headers: function(key) {
          if (key === 'timestamp') {
            return 1502390208007 + 600000 + 1;
          }
        }
      };
      expect(auth.checkTimestamp(req)).to.equal(false);
    });
    it('return true with timestamp within threshold', function() {
      const clock = sandbox.useFakeTimers();
      clock.tick(1502390208007 + 300000);
      let req = {
        headers: function(key) {
          if (key === 'timestamp') {
            return 1502390208007 + 300000 + 1;
          }
        }
      };
      expect(auth.checkTimestamp(req)).to.equal(true);
    });
  });

  describe('#checkNodeID', function() {
    it('return false for invalid nodeID (nonhex)', function() {
      const nodeID = 'somegarbage';
      const pubkey = '038cdc0b987405176647449b7f727444d263101f74e2a593d76ecedf11230706dd';
      expect(auth.checkNodeID(nodeID, pubkey)).to.equal(false);
    });
    it('return false for invalid nodeID (does not match pubkey)', function() {
      const nodeID = 'e6a498de631c6f3eba57da0e416881f9d4a6fca1';
      const pubkey = '038cdc0b987405176647449b7f727444d263101f74e2a593d76ecedf11230706dd';
      expect(auth.checkNodeID(nodeID, pubkey)).to.equal(false);
    });
    it('return true for valid nodeID ', function() {
      const nodeID = 'e6a498de631c6f3eba57da0e416881f9d4a6fca1';
      const pubkey = '03f716a870a72aaa61a75f5b06381ea1771f49c3a9866636007affc4ac06ef54b8';
      expect(auth.checkNodeID(nodeID, pubkey)).to.equal(true);
    });
  });

  describe('#checkPubkey', function() {
    it('will fail if pubkey is an invalid format (nonhex doubles)', function() {
      const pubkey = '38cdc0b987405176647449b7f727444d263101f74e2a593d76ecedf11230706dd';
      expect(auth.checkPubkey(pubkey)).to.equal(false);
    });
    it('will fail if pubkey is an invalid format (nonhex)', function() {
      const pubkey = 'z38cdc0b987405176647449b7f727444d263101f74e2a593d76ecedf11230706dd';
      expect(auth.checkPubkey(pubkey)).to.equal(false);
    });
    it('return false if invalid pubkey (serialization)', function() {
      const pubkey = '098cdc0b987405176647449b7f727444d263101f74e2a593d76ecedf11230706dd';
      expect(auth.checkPubkey(pubkey)).to.equal(false);
    });
    it('return true for valid pubkey', function() {
      const pubkey = '038cdc0b987405176647449b7f727444d263101f74e2a593d76ecedf11230706dd';
      expect(auth.checkPubkey(pubkey)).to.equal(true);
    });
  });

  describe('#checkSig', function() {
    it('will verify that signature is correct', function() {
      let privkey = '8e812246e61ea983efdd4d1c86e246832667a4e4b8fc2d9ff01c534c8a6d7681';
      let pubkey = '03ea58aff546b28bb748d560ad05bb78c0e1b9f5de8edc5021494833c73c224284';
      let sig = null;
      let req = {
        headers: function(key) {
          if (key === 'x-node-timestamp') {
            return '1502390208007';
          } else if (key === 'x-node-pubkey') {
            return pubkey;
          } else if (key === 'x-node-signature') {
            return sig;
          }
        },
        method: 'POST',
        protocol: 'https',
        originalUrl: '/contacts?someQueryArgument=value',
        get: function(key) {
          if (key === 'host') {
            return 'api.storj.io';
          }
        },
        rawbody: Buffer.from('{"key": "value"}', 'utf8')
      }
      const sighash = auth.getSigHash(req);
      const sigObj = secp256k1.sign(sighash, Buffer.from(privkey, 'hex'));
      sig = secp256k1.signatureExport(sigObj.signature).toString('hex');
      expect(auth.checkSig(req)).to.equal(true);
    });
    it('will verify that signature is incorrect', function() {
      let privkey = '8e812246e61ea983efdd4d1c86e246832667a4e4b8fc2d9ff01c534c8a6d7681';
      let pubkey = '03ea58aff546b28bb748d560ad05bb78c0e1b9f5de8edc5021494833c73c224284';
      let timestamp = '1502390208007';
      let sig = null;
      let req = {
        headers: function(key) {
          if (key === 'x-node-timestamp') {
            return timestamp;
          } else if (key === 'x-node-pubkey') {
            return pubkey;
          } else if (key === 'x-node-signature') {
            return sig;
          }
        },
        method: 'POST',
        protocol: 'https',
        originalUrl: '/contacts?someQueryArgument=value',
        get: function(key) {
          if (key === 'host') {
            return 'api.storj.io';
          }
        },
        rawbody: Buffer.from('{"key": "value"}', 'utf8')
      }
      const sighash = auth.getSigHash(req);
      const sigObj = secp256k1.sign(sighash, Buffer.from(privkey, 'hex'));
      sig = secp256k1.signatureExport(sigObj.signature).toString('hex');
      // change the data so the signature fails
      timestamp = '1502390208009';
      expect(auth.checkSig(req)).to.equal(false);
    });
  });

  describe('#isHexaString', function() {
    it('return false for nonhex string', function() {
      expect(auth.isHexString('zz')).to.equal(false);
    });
    it('return false for nonhex string (incorrect bytes)', function() {
      expect(auth.isHexString('aaa')).to.equal(false);
    });
    it('return true for hex string', function() {
      expect(auth.isHexString('038c')).to.equal(true);
    });
  });

  describe('#getSigHash', function() {
    it('will get the expected hash from the request', function() {
      let req = {
        headers: function(key) {
          if (key === 'x-node-timestamp') {
            return '1502390208007';
          }
        },
        method: 'POST',
        protocol: 'https',
        originalUrl: '/contacts?someQueryArgument=value',
        get: function(key) {
          if (key === 'host') {
            return 'api.storj.io';
          }
        },
        rawbody: Buffer.from('{"key": "value"}', 'utf8')
      }
      const hash = auth.getSigHash(req);
      expect(hash.toString('hex')).to.equal('59146f00725c9c052ef5ec6acd63f3842728c9d191ac146668204de6ed4a648b');
    });
  });
});
