import { Point, Scalar } from "@dedis/kyber";
import * as crypto from "crypto-browserify";
import { randomBytes } from "crypto-browserify";
import Long from "long";
import { Message, Properties } from "protobufjs";
import ByzCoinRPC from "~/lib/cothority/byzcoin/byzcoin-rpc";
import DarcInstance from "~/lib/cothority/byzcoin/contracts/darc-instance";
import { InstanceID } from "~/lib/cothority/byzcoin/instance";
import { Roster, ServerIdentity } from "~/lib/cothority/network";
import { IConnection, RosterWSConnection, WebSocketConnection } from "~/lib/cothority/network/connection";
import { CredentialStruct } from "~/lib/cothority/personhood/credentials-instance";
import { PopPartyInstance } from "~/lib/cothority/personhood/pop-party-instance";
import { ed25519, Sign } from "~/lib/cothority/personhood/ring-sig";
import Log from "~/lib/cothority/log";
import { registerMessage } from "~/lib/cothority/protobuf";
import { Contact } from "~/lib/dynacred/Contact";
import CredentialsInstance from "~/lib/cothority/personhood/credentials-instance";
import { Public } from "~/lib/dynacred/KeyPair";
import { Party } from "~/lib/dynacred/Party";

export class PersonhoodRPC {
    static serviceID = "Personhood";
    private socket: IConnection;
    private list: ServerIdentity[];

    constructor(public rpc: ByzCoinRPC) {
        this.socket = new RosterWSConnection(rpc.getConfig().roster, PersonhoodRPC.serviceID);
        this.list = this.rpc.getConfig().roster.list;
    }

    /**
     */
    async listParties(newParty: Party = null): Promise<PersonhoodParty[]> {
        const partyList = new PartyList({newparty: newParty});
        const parties: PersonhoodParty[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            let resp = await socket.send(partyList, PartyListResponse) as PartyListResponse;
            Log.print("got response", resp);
            parties.push(...parties.concat(resp.parties.map(r => PersonhoodParty.fromObject(r))));
        }));
        return parties.filter((py, i) => {
            return parties.findIndex((p) => p.instanceID.equals(py.instanceID)) === i;
        });
    }

    // this removes all parties from the list, but not from byzcoin.
    async wipeParties() {
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            await socket.send(new PartyList({wipeparties: true}), PartyListResponse);
        }));
    }

    // meetups interfaces the meetup endpoint from the personhood service. It will always return the
    // currently stored meetups, but can either add a new meetup, or wipe  all meetups.
    async meetups(meetup: Meetup = null): Promise<UserLocation[]> {
        const uls: UserLocation[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            let resp = (await socket.send(meetup, MeetupResponse)) as MeetupResponse;
            try {
                resp.users.forEach(ul => uls.push(UserLocation.fromObject(ul)));
            } catch (e) {
                Log.error(e);
            }
        }));
        return uls.filter((m) => m != null).filter((userlocation, i) => {
            return uls.findIndex((ul) => ul.toProto().equals(userlocation.toProto())) === i;
        });
    }

    // listMeetups returns a list of all currently stored meetups.
    async listMeetups(): Promise<UserLocation[]> {
        return this.meetups();
    }

    // wipeMeetups removes all meetups from the servers. This is mainly for tests.
    async wipeMeetups() {
        return this.meetups(new Meetup({wipe: true}));
    }

    async listRPS(id: InstanceID = null): Promise<RoPaSci[]> {
        const ropasci: { newropasci: any } = {newropasci: null};
        if (id) {
            ropasci.newropasci = new RoPaSci(this.rpc.genesisID, id).toObject();
        }
        const ropascis: RoPaSci[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocket(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("RoPaSciList", "RoPaSciListResponse", ropasci);
            // if (resp && resp.ropascis) {
            //     ropascis = ropascis.concat(resp.ropascis.map(r => RoPaSci.fromObject(r)));
            // }
        }));
        return ropascis.filter((rps, i) => {
            return ropascis.findIndex((p) => p.instanceID.equals(rps.instanceID)) === i;
        });
    }

    async wipeRPS() {
        const ropasci = {wipe: true};
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocket(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("RoPaSciList", "RoPaSciListResponse", ropasci);
        }));
    }

    async pollNew(personhood: InstanceID, title: string, description: string, choices: string[]): Promise<PollStruct> {
        const np = new PollStruct(personhood, null, title, description, choices);
        const ps = await this.callPoll(new Poll(this.rpc.genesisID, np, null, null));
        return ps[0];
    }

    async pollList(partyIDs: InstanceID[]): Promise<PollStruct[]> {
        return this.callPoll(new Poll(this.rpc.genesisID, null, new PollList(partyIDs), null));
    }

    async pollAnswer(priv: Scalar, personhood: PopPartyInstance, pollId: Buffer, choice: number): Promise<PollStruct> {
        const context = Buffer.alloc(68);
        context.write("Poll");
        this.rpc.genesisID.copy(context, 4);
        pollId.copy(context, 36);
        const msg = Buffer.alloc(7);
        msg.write("Choice");
        msg.writeUInt8(choice, 6);
        const contextHash = crypto.createHash("sha256");
        contextHash.update(context);
        const points = personhood.popPartyStruct.attendees.publics;
        const lrs = await Sign(msg, points, contextHash.digest(), priv);
        const pa = new PollAnswer(pollId, choice, lrs.encode());
        const ps = await this.callPoll(new Poll(this.rpc.genesisID, null, null, pa));
        return ps[0];
    }

    async pollWipe() {
        return this.callPoll(new Poll(this.rpc.genesisID, null, null, null));
    }

    async callPoll(p: Poll): Promise<PollStruct[]> {
        const resp: PollResponse[] = [];
        await this.callAllPoll("Poll", "PollResponse", p.toObject(), resp);
        const str: PollStruct[] = [];
        resp.forEach((r) => {
            if (r) {
                r.polls.forEach((poll) => {
                    if (!str.find((s) => s.pollID.equals(poll.pollID))) {
                        str.push(poll);
                    }
                });
            }
        });
        return str;
    }

    async callAllPoll(req: string, resp: string, query: any, response: PollResponse[]): Promise<any> {
        return await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // response.push(PollResponse.fromObject(await socket.send(req, resp, query)));
        }));
    }
}

export class PersonhoodParty {

    constructor(public roster: Roster, public byzcoinID: InstanceID, public instanceID: InstanceID) {
    }

    static fromObject(obj: any): PersonhoodParty {
        return new PersonhoodParty(Roster.fromBytes(Buffer.from(obj.roster)),
            Buffer.from(obj.byzcoinid),
            Buffer.from(obj.instanceid));
    }

    toObject(): any {
        return {
            byzcoinid: this.byzcoinID,
            instanceid: this.instanceID,
            roster: this.roster.toBytes(),
        };
    }
}

export class RoPaSci {

    constructor(public byzcoinID: InstanceID, public instanceID: InstanceID) {
    }

    static fromObject(obj: any): RoPaSci {
        return new RoPaSci(Buffer.from(obj.byzcoinid),
            Buffer.from(obj.ropasciid));
    }

    toObject(): any {
        return {
            byzcoinid: this.byzcoinID,
            ropasciid: this.instanceID,
        };
    }
}

// Poll allows for adding, listing, and answering to polls
export class Poll {

    constructor(public byzcoinID: Buffer, public newPoll: PollStruct, public list: PollList,
                public answer: PollAnswer) {
    }

    static fromObject(obj: any): Poll {
        return new Poll(Buffer.from(obj.byzcoinid), PollStruct.fromObject(obj.newpoll),
            PollList.fromObject(obj.list), PollAnswer.fromObject(obj.answer));
    }

    toObject(): any {
        return {
            answer: this.answer ? this.answer.toObject() : null,
            byzcoinid: this.byzcoinID,
            list: this.list ? this.list.toObject() : null,
            newpoll: this.newPoll ? this.newPoll.toObject() : null,
        };
    }
}

// Empty class to request the list of polls available.
export class PollList {

    constructor(public partyIDs: InstanceID[]) {
    }

    static fromObject(obj: any): PollList {
        if (obj == null) {
            return null;
        }
        return new PollList(obj.partyids.map((pi: any) => Buffer.from(pi)));
    }

    toObject(): any {
        return {partyids: this.partyIDs};
    }
}

// PollStruct represents one poll with answers.
export class PollStruct {

    constructor(public personhood: InstanceID, public pollID: Buffer, public title: string,
                public description: string, public choices: string[], public chosen: PollChoice[] = []) {
        if (this.pollID == null) {
            this.pollID = randomBytes(32);
        }
    }

    static fromObject(obj: any): PollStruct {
        if (obj == null) {
            return null;
        }
        return new PollStruct(Buffer.from(obj.personhood), Buffer.from(obj.pollid),
            obj.title, obj.description, obj.choices, obj.chosen.map((c: any) => PollChoice.fromObject(c)));
    }

    toObject(): any {
        return {
            choices: this.choices,
            chosen: this.chosen.map((c) => c.toObject()),
            description: this.description,
            personhood: this.personhood,
            pollid: this.pollID,
            title: this.title,
        };
    }

    choiceCount(c: number): number {
        return this.chosen.reduce((prev: number, curr) => {
            return curr.choice === c ? prev + 1 : prev;
        }, 0);
    }
}

// PollAnswer stores one answer for a poll. It needs to be signed with a Linkable Ring Signature
// to proof that the choice is unique. The context for the LRS must be
//   'Poll' + ByzCoinID + PollID
// And the message must be
//   'Choice' + byte(Choice)
export class PollAnswer {

    constructor(public pollID: Buffer, public choice: number, public lrs: Buffer) {
    }

    static fromObject(obj: any): PollAnswer {
        if (obj == null) {
            return null;
        }
        return new PollAnswer(Buffer.from(obj.pollid), obj.choice, Buffer.from(obj.lrs));
    }

    toObject(): any {
        return {
            choice: this.choice,
            lrs: this.lrs,
            pollid: this.pollID,
        };
    }
}

// PollChoice represents one choice of one participant.
export class PollChoice {

    constructor(public choice: number, public lrstag: Buffer) {
    }

    static fromObject(obj: any): PollChoice {
        return new PollChoice(obj.choice, Buffer.from(obj.lrstag));
    }

    toObject(): any {
        return {
            choice: this.choice,
            lrstag: this.lrstag,
        };
    }
}

// PollResponse is sent back to the client and contains all known polls.
export class PollResponse {

    constructor(public polls: PollStruct[]) {
    }

    static fromObject(obj: any): PollResponse {
        return new PollResponse(obj.polls.map((p: any) =>
            PollStruct.fromObject(p)));
    }

    toObject(): any {
        return {
            polls: this.polls.map((p) => p.toObject()),
        };
    }
}

// UserLocation is one user in one location, either a registered one, or an unregistered one.
export class UserLocation {

    static readonly protoName = "UserLocation";

    constructor(public credential: CredentialStruct, public location: string,
                public publicKey: Point = null,
                public credentialIID: InstanceID = null, public time: Long = Long.fromNumber(0)) {
    }

    get alias(): string {
        return this.credential.getAttribute("personal", "alias").toString();
    }

    get unique(): Buffer {
        if (this.credentialIID) {
            return this.credentialIID;
        }
        return Buffer.from(this.alias);
    }

    static fromObject(o: any): UserLocation {
        let crediid: InstanceID = null;
        let pubkey: Point = null;
        if (o.credentialiid && o.credentialiid.length === 32) {
            crediid = Buffer.from(o.credentialiid);
        }
        if (o.publickey) {
            pubkey = ed25519.point();
            pubkey.unmarshalBinary(Buffer.from(o.publickey));
        }
        return new UserLocation(CredentialStruct.fromObject(o.credential),
            o.location, pubkey, crediid, o.time);
    }

    static fromProto(p: Buffer): UserLocation {
        throw new Error("not yet implemented");
        // return UserLocation.fromObject(root.lookup(UserLocation.protoName).decode(p));
    }

    static fromContact(c: Contact): UserLocation {
        return new UserLocation(c.credential, "somewhere", c.seedPublic.point, c.credentialIID);
    }

    toObject(): any {
        const o: {
            credential: Buffer,
            credentialiid: Buffer,
            location: string,
            publickey: Buffer,
            time: Long,
        } = {
            credential: this.credential.toBytes(),
            credentialiid: null,
            location: this.location,
            publickey: null,
            time: this.time,
        };
        if (this.credentialIID) {
            o.credentialiid = this.credentialIID;
        }
        if (this.publicKey) {
            o.publickey = this.publicKey.marshalBinary();
        }
        return o;
    }

    toProto(): Buffer {
        throw new Error("not yet implemented");
        // return objToProto(this.toObject(), UserLocation.protoName);
    }

    equals(ul: UserLocation): boolean {
        return this.unique.equals(ul.unique);
    }

    async toContact(bc: ByzCoinRPC): Promise<Contact> {
        try {
            let c = new Contact(this.credential);
            if (this.credentialIID) {
                c.CredentialsInstance = await CredentialsInstance.fromByzcoin(bc, this.credentialIID);
                c.credential = c.CredentialsInstance.credential.copy();
                c.darcInstance = await DarcInstance.fromByzcoin(bc, c.CredentialsInstance.darcID);
            } else {
                c.seedPublic = new Public(this.publicKey);
            }
            return c;
        } catch (e) {
            return Log.rcatch(e, "couldn't convert toContact");
        }
    }
}

export class PartyList extends Message<PartyList>{
    static register(){
        registerMessage("PartyList", PartyList);
    }

    readonly newparty: Party;
    readonly wipeparties: boolean;

    constructor(props?: Properties<PartyList>){
        super(props);
    }
}

export class PartyListResponse extends Message<PartyListResponse>{
    static register(){
        registerMessage("PartyListResponse", PartyListResponse);
    }

    readonly parties: Party[];

    constructor(props?: Properties<PartyListResponse>){
        super(props);
    }
}

// Meetup contains one user that wants to meet others.
export class Meetup extends Message<Meetup>{
    static register(){
        registerMessage("Meetup", Meetup);
    }

    readonly userLocation: UserLocation;
    readonly wipe: boolean;

    constructor(props?: Properties<Meetup>) {
        super(props);

        Object.defineProperty(this, "userlocation", {
            get(): UserLocation {
                return this.userLocation;
            },
            set(value: UserLocation) {
                this.userLocation = value;
            },
        });
    }
}

export class MeetupResponse extends Message<Meetup>{
    static register(){
        registerMessage("Meetup", Meetup);
    }

    readonly users: UserLocation[];

    constructor(props?: Properties<Meetup>) {
        super(props);
    }
}

PartyList.register();
PartyListResponse.register();
