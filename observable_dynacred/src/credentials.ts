import {BehaviorSubject, Observable, ReplaySubject, Subject} from "rxjs";
import {curve, Scalar} from "@dedis/kyber";
import {distinctUntilChanged, map, pairwise, startWith} from "rxjs/operators";
import {first} from "rxjs/internal/operators/first";
import {mergeMap} from "rxjs/internal/operators/mergeMap";
import {byzcoin, darc, Log} from "@dedis/cothority";

import {Instances} from "src/instances";
import {IByzCoinAddTransaction} from "src/interfaces";

type CredentialStruct = byzcoin.contracts.CredentialStruct;
type InstanceID = byzcoin.InstanceID;
const {CredentialStruct, CredentialsInstance} = byzcoin.contracts;
const {ClientTransaction, Instruction, Argument} = byzcoin;
const {SignerEd25519} = darc;
export const ed25519 = new curve.edwards25519.Curve();

export enum EAttributes {
    alias = "1-public:alias",
    email = "1-public:email",
    coinID = "1-public:coin",
    contacts = "1-public:contactsBuf",
    version = "1-public:version",
    structVersion = "1-public:structVersion",
    seed = "1-public:seedPub",
    spawner = "1-public:spawner",
    ltsID = "1-config:ltsID",
    ltsX = "1-config:ltsX",
    devInitial = "1-devices:initial"
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
    private contactsCache = new Map<string, Subject<Credentials>>();

    constructor(private inst: Instances, public readonly id: InstanceID,
                private cred: Subject<CredentialStruct>) {
    }

    public static async fromScratch(inst: Instances, id: InstanceID): Promise<Credentials> {
        const cred = new ReplaySubject<CredentialStruct>(1);
        (await inst.instanceObservable(id))
            .pipe(map((ii) => CredentialStruct.decode(ii.value)))
            .subscribe(cred);
        return new Credentials(inst, id, cred);
    }

    public attributeObservable(name: EAttributes): ReplaySubject<Buffer> {
        let bs = this.attributeCache.get(name);
        if (bs !== undefined) {
            return bs;
        }

        const newBS = new ReplaySubject<Buffer>(1);
        this.cred.pipe(
            map((cred) => {
                const fields = name.split(":");
                return cred.getAttribute(fields[0], fields[1]) || Buffer.alloc(0);
            }),
            distinctUntilChanged((a, b) => a.equals(b)))
            .subscribe(newBS);
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

    // contactsObservable returns an observable that emits a list of new
    // contacts whenever one or more new contacts are available.
    // When first calling this method, all available contacts will be sent
    // together.
    // Once a contact disappears, the `complete` method is invoked.
    public contactsObservable(): Observable<BehaviorSubject<Credentials>[]> {
        return this.attributeObservable(EAttributes.contacts)
            .pipe(
                startWith(Buffer.alloc(0)),
                map((buf): ContactList => new ContactList(buf)),
                pairwise(),
                map((pair): InstanceID[] => {
                    // First check which contacts have been removed
                    const [previous, current] = pair;
                    Log.lvl3("Got new pair:", current.set);
                    const newCreds: InstanceID[] = [];
                    previous.set.forEach((id) => {
                        if (!current.has(id)) {
                            // End this contact
                            const co = this.contactsCache.get(id);
                            if (co !== undefined) {
                                Log.lvl2("Removing contact", id);
                                co.complete();
                                this.contactsCache.delete(id);
                            }
                        }
                    });
                    current.set.forEach((id) => {
                        if (!previous.has(id)) {
                            Log.lvl2("Adding contact", id);
                            newCreds.push(Buffer.from(id, "hex"));
                        }
                    });
                    return newCreds;
                }))
            .pipe(
                mergeMap((ids) => {
                    return Promise.all(ids.map((id) =>
                        Credentials.fromScratch(this.inst, id)))
                }),
                map((creds) => {
                    return creds.map((cred) => {
                        const co = new BehaviorSubject(cred);
                        this.contactsCache.set(cred.id.toString("hex"), co);
                        return co;
                    });
                })
            )
    }

    public async updateCredentials(bc: IByzCoinAddTransaction, priv: Scalar, ...cred: IUpdateCredential[]): Promise<void> {
        this.cred.pipe(first()).subscribe(async (orig) => {
            for (const c of cred) {
                const fields = c.name.split(":");
                let value = c.value instanceof Buffer ? c.value : Buffer.from(c.value);
                orig.setAttribute(fields[0], fields[1], value);
            }
            const ctx = ClientTransaction.make(3,
                Instruction.createInvoke(this.id, CredentialsInstance.contractID,
                    CredentialsInstance.commandUpdate, [
                        new Argument({
                            name: CredentialsInstance.argumentCredential,
                            value: orig.toBytes()
                        })
                    ]
                )
            );
            const signer = [[new SignerEd25519(ed25519.point().mul(priv), priv)]];
            await ctx.updateCountersAndSign(bc, signer);
            await bc.addTransaction(ctx);
            await this.inst.reload();
        });
    }

    public async addContact(bc: IByzCoinAddTransaction, priv: Scalar, id: InstanceID): Promise<void> {
        const creds = await ContactList.fromCredentials(this);
        if (creds.has(id)) {
            return;
        }
        creds.add(id);
        return this.updateCredentials(bc, priv,
            {name: EAttributes.contacts, value: creds.toBuffer()});
    }

    public async rmContact(bc: IByzCoinAddTransaction, priv: Scalar, id: InstanceID): Promise<void> {
        const creds = await ContactList.fromCredentials(this);
        if (!creds.has(id)) {
            return;
        }
        creds.rm(id);
        return this.updateCredentials(bc, priv,
            {name: EAttributes.contacts, value: creds.toBuffer()});
    }
}

/**
 * ContactList wraps a list of credentialIDs in a set to be able to do add,
 * rm, has and convert it back to a long buffer again.
 * As the existing sets will store happily Buffer.from("1") and
 * Buffer.from("1") twice, this class converts all buffer to hex-codes, and
 * then back again.
 */
export class ContactList {
    public readonly set: Set<string>;

    constructor(contacts: Buffer | Set<string>) {
        if (contacts instanceof Buffer) {
            const list = [];
            for (let i = 0; i < contacts.length; i += 32) {
                list.push(contacts.slice(i, i + 32).toString("hex"));
            }
            this.set = new Set(list);
        } else {
            this.set = contacts;
        }
    }

    static async fromCredentials(cred: Credentials): Promise<ContactList> {
        return new ContactList(await new Promise((r) => {
            cred.attributeObservable(EAttributes.contacts)
                .subscribe((buf) => r(buf));
        }));
    }

    toBuffer(): Buffer {
        const ret = Buffer.alloc(this.set.size * 32);
        let i = 0;
        this.set.forEach((c) => {
            Buffer.from(c, "hex").copy(ret, i * 32);
            i++;
        });
        return ret;
    }

    add(contact: InstanceID | string) {
        if (contact instanceof Buffer) {
            this.set.add(contact.toString("hex"));
        } else {
            this.set.add(contact);
        }
    }

    rm(contact: InstanceID | string) {
        if (contact instanceof Buffer) {
            this.set.delete(contact.toString("hex"));
        } else {
            this.set.delete(contact);
        }
    }

    has(contact: InstanceID | string): boolean {
        if (contact instanceof Buffer) {
            return this.set.has(contact.toString("hex"));
        } else {
            return this.set.has(contact);
        }
    }
}
