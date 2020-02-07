"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var kyber_1 = require("@dedis/kyber");
var cothority_1 = require("@dedis/cothority");
var Long = require("long");
var crypto_1 = require("crypto");
var credentials_1 = require("./credentials");
var keypair_1 = require("./keypair");
var ed25519 = new kyber_1.curve.edwards25519.Curve();
var CredentialFactory = /** @class */ (function () {
    function CredentialFactory() {
    }
    CredentialFactory.genesisDarc = function (priv) {
        var keyPair = keypair_1.KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        var signer = [keyPair.signer()];
        var adminDarc = cothority_1.darc.Darc.createBasic(signer, signer, Buffer.from("AdminDarc"), ["spawn:spawner", "spawn:coin", "spawn:credential", "spawn:longTermSecret",
            "spawn:calypsoWrite", "spawn:calypsoRead", "spawn:darc",
            "invoke:coin.mint", "invoke:coin.transfer", "invoke:coin.fetch"]);
        return { keyPair: keyPair, darc: adminDarc };
    };
    CredentialFactory.spawner = function (gu) {
        var coin = new cothority_1.byzcoin.contracts.Coin({
            name: cothority_1.personhood.SPAWNER_COIN,
            value: Long.fromNumber(1e9)
        });
        var coin10 = new cothority_1.byzcoin.contracts.Coin({
            name: cothority_1.personhood.SPAWNER_COIN,
            value: Long.fromNumber(10)
        });
        var coin100 = new cothority_1.byzcoin.contracts.Coin({
            name: cothority_1.personhood.SPAWNER_COIN,
            value: Long.fromNumber(100)
        });
        var coin1000 = new cothority_1.byzcoin.contracts.Coin({
            name: cothority_1.personhood.SPAWNER_COIN,
            value: Long.fromNumber(1000)
        });
        var spawner = new cothority_1.byzcoin.contracts.SpawnerStruct({
            costCRead: coin100,
            costCWrite: coin1000,
            costCoin: coin100,
            costCredential: coin1000,
            costDarc: coin100,
            costParty: coin1000,
            costRoPaSci: coin10,
            costValue: coin10,
        });
        return {
            coin: coin, spawner: spawner,
            coinID: Buffer.from(crypto_1.randomBytes(32)),
            spawnerID: Buffer.from(crypto_1.randomBytes(32))
        };
    };
    CredentialFactory.lts = function () {
        //        const lts = await LongTermSecret.spawn(bc, adminDarcID, [adminSigner]);
    };
    CredentialFactory.coinID = function (pub) {
        return cothority_1.byzcoin.contracts.CoinInstance.coinIID(pub.marshalBinary());
    };
    CredentialFactory.credID = function (pub) {
        return cothority_1.byzcoin.contracts.CredentialsInstance.credentialIID(pub.marshalBinary());
    };
    CredentialFactory.prepareInitialCred = function (alias, pub, spawner, deviceDarcID, lts) {
        var cred = new cothority_1.byzcoin.contracts.CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin", this.coinID(pub));
        cred.setAttribute("1-public", "version", Buffer.from(Long.fromNumber(0).toBytesLE()));
        cred.setAttribute("1-public", "seedPub", pub.marshalBinary());
        cred.setAttribute("1-config", "spawner", spawner);
        var svBuf = Buffer.alloc(4);
        svBuf.writeInt32LE(credentials_1.Credentials.structVersionLatest, 0);
        cred.setAttribute("1-config", "structVersion", svBuf);
        cred.setAttribute("1-devices", "initial", deviceDarcID);
        if (lts) {
            cred.setAttribute("1-config", "ltsID", lts.id);
            cred.setAttribute("1-config", "ltsX", lts.X.toProto());
        }
        return cred;
    };
    CredentialFactory.newUser = function (alias, spawnerID, priv) {
        var keyPair = keypair_1.KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        var signer = [keyPair.signer()];
        var darcDevice = cothority_1.darc.Darc.createBasic(signer, signer, Buffer.from("device"));
        var darcDeviceId = new cothority_1.darc.IdentityDarc({ id: darcDevice.getBaseID() });
        var darcSign = cothority_1.darc.Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        var darcSignId = new cothority_1.darc.IdentityDarc({ id: darcSign.getBaseID() });
        var darcCred = cothority_1.darc.Darc.createBasic([], [darcSignId], Buffer.from(cothority_1.byzcoin.contracts.CredentialsInstance.argumentCredential), ["invoke:" + cothority_1.byzcoin.contracts.CredentialsInstance.contractID + ".update"]);
        var rules = [cothority_1.byzcoin.contracts.CoinInstance.commandTransfer,
            cothority_1.byzcoin.contracts.CoinInstance.commandFetch,
            cothority_1.byzcoin.contracts.CoinInstance.commandStore].map(function (inv) { return "invoke:" + cothority_1.byzcoin.contracts.CoinInstance.contractID + "." + inv; });
        var darcCoin = cothority_1.darc.Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
        var coin = new cothority_1.byzcoin.contracts.Coin({ name: cothority_1.personhood.SPAWNER_COIN, value: Long.fromNumber(0) });
        var cred = this.prepareInitialCred(alias, keyPair.pub, spawnerID, darcDevice.getBaseID());
        return {
            keyPair: keyPair, cred: cred, darcDevice: darcDevice, darcSign: darcSign, darcCred: darcCred, darcCoin: darcCoin, coin: coin,
            credID: this.credID(keyPair.pub), coinID: this.coinID(keyPair.pub)
        };
    };
    return CredentialFactory;
}());
exports.CredentialFactory = CredentialFactory;
