import Long from "long";

import { InstanceID } from "@dedis/cothority/byzcoin";
import {
    Coin,
    CoinInstance,
    CredentialsInstance,
    CredentialStruct,
    SPAWNER_COIN,
} from "@dedis/cothority/byzcoin/contracts";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";
import { LongTermSecret } from "@dedis/cothority/calypso";
import { Darc, IdentityDarc, IIdentity, Rule } from "@dedis/cothority/darc";
import { curve, Point, Scalar } from "@dedis/kyber";

import Log from "@dedis/cothority/log";
import { CredentialStructBS, EAttributesConfig, EAttributesPublic, ECredentials } from "./credentialStructBS";
import { KeyPair } from "./keypair";

const ed25519 = new curve.edwards25519.Curve();

export class UserSkeleton {

    get credID(): InstanceID {
        return CredentialsInstance.credentialIID(this.keyPair.pub.marshalBinary());
    }

    get coinID(): InstanceID {
        return CoinInstance.coinIID(this.keyPair.pub.marshalBinary());
    }

    set email(e: string) {
        this.cred.setAttribute(ECredentials.pub, EAttributesPublic.email, e);
    }

    set view(v: string) {
        this.cred.setAttribute(ECredentials.config, EAttributesConfig.view, v);
    }

    static prepareInitialCred(alias: string, pub: Point, spawner: InstanceID, deviceDarc: Darc,
                              lts?: LongTermSecret): CredentialStruct {
        const cred = new CredentialStruct();
        cred.setAttribute("1-public", "alias", Buffer.from(alias));
        cred.setAttribute("1-public", "coin",
            CoinInstance.coinIID(pub.marshalBinary()));
        cred.setAttribute("1-public", "version", Buffer.from(Long.fromNumber(0).toBytesLE()));
        cred.setAttribute("1-public", "seedPub", pub.marshalBinary());
        cred.setAttribute("1-config", "spawner", spawner);
        const svBuf = Buffer.alloc(4);
        svBuf.writeInt32LE(CredentialStructBS.structVersionLatest, 0);
        cred.setAttribute("1-config", "structVersion", svBuf);
        cred.setAttribute("1-devices",
            deviceDarc.description.toString().replace(/^device:/, ""),
            deviceDarc.getBaseID());
        if (lts) {
            cred.setAttribute("1-config", "ltsID", lts.id);
            cred.setAttribute("1-config", "ltsX", lts.X.toProto());
        }
        return cred;
    }
    keyPair: KeyPair;
    cred: CredentialStruct;
    coin: Coin;
    darcDevice: Darc;
    darcSign: Darc;
    darcCred: Darc;
    darcCoin: Darc;

    constructor(alias: string, spawnerID: InstanceID, priv?: Scalar) {
        this.keyPair = KeyPair.fromPrivate(priv || ed25519.scalar().pick());
        const signer = [this.keyPair.signer()];

        this.darcDevice = Darc.createBasic(signer, signer, Buffer.from("device:initial"));
        const darcDeviceId = new IdentityDarc({id: this.darcDevice.getBaseID()});
        this.darcSign = Darc.createBasic([darcDeviceId], [darcDeviceId], Buffer.from("signer"));
        this.updateDarcs();
        this.coin = new Coin({
            name: SPAWNER_COIN,
            value: Long.fromNumber(0),
        });
        this.cred = UserSkeleton.prepareInitialCred(alias, this.keyPair.pub, spawnerID, this.darcDevice);
    }

    updateDarcs() {
        const darcSignId = new IdentityDarc({id: this.darcSign.getBaseID()});
        this.darcCred = Darc.createBasic([], [darcSignId], Buffer.from(CredentialsInstance.argumentCredential),
          ["invoke:" + CredentialsInstance.contractID + ".update"]);
        const rules = [CoinInstance.commandTransfer,
            CoinInstance.commandFetch,
            CoinInstance.commandStore].map((inv) => `invoke:${CoinInstance.contractID}.${inv}`);
        this.darcCoin = Darc.createBasic([], [darcSignId], Buffer.from("coin"), rules);
    }

    addPubBuffer(attr: EAttributesPublic, b: Buffer) {
        const newB = [this.cred.getAttribute(ECredentials.pub, attr) || Buffer.alloc(0), b];
        this.cred.setAttribute(ECredentials.pub, attr, Buffer.concat(newB));
    }

    addContact(c: Buffer) {
        this.addPubBuffer(EAttributesPublic.contacts, c);
    }

    addGroup(g: Buffer) {
        this.addPubBuffer(EAttributesPublic.groups, g);
    }

    addAction(a: Buffer) {
        this.addPubBuffer(EAttributesPublic.actions, a);
    }

    addRecovery(name: string, id: InstanceID) {
        const idDarc = new IdentityDarc({id}).toString();
        this.darcSign.rules.getRule(Darc.ruleSign).append(idDarc, Rule.OR);
        this.darcSign.rules.getRule(DarcInstance.ruleEvolve).append(idDarc, Rule.OR);
        this.cred.setAttribute(ECredentials.recoveries, name, id);
        this.updateDarcs();
    }

    addLTS(lts: LongTermSecret) {
        this.cred.setAttribute(ECredentials.config, EAttributesConfig.ltsID, lts.id);
        this.cred.setAttribute(ECredentials.config, EAttributesConfig.ltsX, lts.X.toProto());
    }
}
