import {KeyPair} from "../src/keypair";
import {Darc} from "@dedis/cothority/darc";
import {Coin} from "@dedis/cothority/byzcoin/contracts/coin-instance";
import {InstanceID} from "@dedis/cothority/byzcoin";
import {SpawnerStruct} from "@dedis/cothority/personhood/spawner-instance";
import {CredentialStruct} from "@dedis/cothority/personhood/credentials-instance";
import {Observable, ReplaySubject} from "rxjs";
import {Instances} from "../src/instances";
import {Log} from "@dedis/cothority";
import {Scalar} from "@dedis/kyber";
import {IByzCoinAddTransaction} from "../src/byzcoin-simul";
import {distinctUntilChanged, map} from "rxjs/operators";
import {first} from "rxjs/internal/operators/first";

export interface IGenesisUser {
    keyPair: KeyPair;
    darc: Darc;
}

export interface ISpawner {
    coin: Coin;
    coinID?: InstanceID;
    spawner: SpawnerStruct;
    spawnerID?: InstanceID;
}

export interface IUser {
    keyPair: KeyPair;
    cred: CredentialStruct;
    credID?: InstanceID;
    coin: Coin;
    coinID?: InstanceID;
    darcDevice: Darc;
    darcSign: Darc;
    darcCred: Darc;
    darcCoin: Darc;
}

export enum EAttributes {
    alias = "1-public:alias",
    email = "1-public:email",
    coinID = "1-public:coinID"
}

export interface IUpdateCredential {
    name: EAttributes;
    value: string | InstanceID;
}

/**
 * Credential holds static methods that allow to setup instances for credentials.
 */
export class Credentials {
    public static readonly structVersionLatest = 2;
    public static readonly urlRegistered = "https://pop.dedis.ch/qrcode/identity-2";
    public static readonly urlUnregistered = "https://pop.dedis.ch/qrcode/unregistered-2";
    private attributeCache = new Map<string, ReplaySubject<Buffer>>();

    constructor(private inst: Instances, private id: InstanceID,
                private cred: ReplaySubject<CredentialStruct>) {
    }

    public static async fromScratch(inst: Instances, id: InstanceID): Promise<Credentials> {
        const cred = new ReplaySubject<CredentialStruct>(1);
        (await inst.instanceObservable(id))
            .pipe(map((ii) => CredentialStruct.decode(ii.value)))
            .subscribe({next: (inst) => cred.next(inst)});
        return new Credentials(inst, id, cred);
    }

    public attributeObservable(name: EAttributes): Observable<Buffer> {
        let bs = this.attributeCache.get(name);
        if (bs !== undefined) {
            return bs;
        }

        const newBS = new ReplaySubject<Buffer>(1);
        this.cred.pipe(map((cred) => {
            const fields = name.split(":");
            return cred.getAttribute(fields[0], fields[1]) || Buffer.alloc(0);
        }), distinctUntilChanged((a, b) => a.equals(b)))
            .subscribe({next: (buf) => newBS.next(buf)});
        this.attributeCache.set(name, newBS);
        return newBS;
    }

    public aliasObservable(): Observable<string> {
        return this.attributeObservable(EAttributes.alias).pipe(map((buf) => buf.toString()));
    }

    public emailObservable(): Observable<string> {
        return this.attributeObservable(EAttributes.email).pipe(map((buf) => buf.toString()));
    }

    public coinIDObservable(): Observable<InstanceID> {
        return this.attributeObservable(EAttributes.coinID).pipe(map((buf) => <InstanceID>buf));
    }

    public async updateCredentials(bc: IByzCoinAddTransaction, priv: Scalar, ...cred: IUpdateCredential[]): Promise<void> {
        this.cred.pipe(first()).subscribe(async (orig) => {
            for (const c of cred) {
                const fields = c.name.split(":");
                let value = c.value instanceof Buffer ? c.value : Buffer.from(c.value);
                orig.setAttribute(fields[0], fields[1], value);
            }
            await bc.addTransaction({
                update: {
                    instID: this.id,
                    value: orig.toBytes()
                }
            });
            await this.inst.reload();
        });
    }
}
