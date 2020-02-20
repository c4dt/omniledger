/**
 * ContactList wraps a list of credentialIDs in a set to be able to do add,
 * rm, has and convert it back to a long buffer again.
 * As the existing sets will store happily Buffer.from("1") and
 * Buffer.from("1") twice, this class converts all buffer to hex-codes, and
 * then back again.
 */
import {BehaviorSubject, Observable} from "rxjs";
import {flatMap, map} from "rxjs/operators";

import {InstanceID} from "@dedis/cothority/byzcoin";

import {CredentialAttributeBS, CredentialStructBS} from "./credentialStructBS";
import {DoThings} from "./user";
import {ObservableHO} from "./observableHO";
import {tap} from "rxjs/internal/operators/tap";
import {Log} from "@dedis/cothority";

export class ContactListBS extends Observable<BehaviorSubject<CredentialStructBS>[]> {

    constructor(private dt: DoThings, private cred: CredentialAttributeBS<Buffer>) {
        super(subscriber => {
                ObservableHO(new ContactSO(dt, cred.pipe(
                    map(buf => buf || Buffer.alloc(0)),
                    map((buf) => {
                        const list = [];
                        for (let i = 0; i < buf.length; i += 32) {
                            list.push(buf.slice(i, i + 32).toString("hex"));
                        }
                        return list;
                    })))).subscribe(subscriber)
            }
        );
    }

    public getFullList(): Observable<CredentialStructBS[]>{
        return this.cred.pipe(
            map(c => ContactList.splitList(c)),
            flatMap(cs => Promise.all(
                cs.map(c => CredentialStructBS.fromScratch(this.dt, c))))
        );
    }

    public async addContact(id: InstanceID): Promise<void> {
        const list = new ContactList(this.cred.getValue());
        if (list.has(id)) {
            return;
        }
        list.add(id);
        return this.cred.setValue(list.toBuffer());
    }

    public async rmContact(id: InstanceID): Promise<void> {
        const list = new ContactList(this.cred.getValue());
        if (!list.has(id)) {
            return;
        }
        list.rm(id);
        return this.cred.setValue(list.toBuffer());
    }
}

class ContactSO {
    constructor(private dt: DoThings,
                public source: Observable<Buffer[]>) {
    }

    async convert(src: Buffer): Promise<BehaviorSubject<CredentialStructBS>> {
        return new BehaviorSubject(await CredentialStructBS.fromScratch(this.dt, src));
    }

    srcStringer(src: Buffer): string {
        return src.toString("hex");
    }

    stringToSrc(str: string): Buffer {
        return Buffer.from(str, "hex");
    }
}

export class ContactList {
    public readonly set: Set<string>;

    constructor(contacts: Buffer | null | undefined) {
        this.set = new Set(ContactList.splitList(contacts)
            .map(c => c.toString("hex")));
    }

    public static splitList(contacts: Buffer | null | undefined): Buffer[]{
        const list = [];
        if (contacts instanceof Buffer) {
            for (let i = 0; i < contacts.length; i += 32) {
                list.push(contacts.slice(i, i + 32));
            }
        }
        return list;
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
