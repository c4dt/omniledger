import ByzCoinRPC from "@dedis/cothority/byzcoin/byzcoin-rpc";
import { InstanceID } from "@dedis/cothority/byzcoin/instance";
import { Roster, ServerIdentity } from "@dedis/cothority/network";
import { IConnection, RosterWSConnection, WebSocketConnection } from "@dedis/cothority/network/connection";
import { CredentialStruct } from "@dedis/cothority/personhood/credentials-instance";
import { PopPartyInstance } from "@dedis/cothority/personhood/pop-party-instance";
import { ed25519, Sign } from "@dedis/cothority/personhood/ring-sig";
import { Point, Scalar } from "@dedis/kyber";
import * as crypto from "crypto";
import { randomBytes } from "crypto";
import Long from "long";

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
    async listParties(id: InstanceID = null): Promise<PersonhoodParty[]> {
        const party: {newparty: any} = {newparty: null};
        if (id) {
            const p = new PersonhoodParty(this.rpc.getConfig().roster, this.rpc.genesisID, id);
            party.newparty = p.toObject();
        }
        const parties: PersonhoodParty[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("PartyList", "PartyListResponse", party);
            // parties = parties.concat(resp.parties.map(r => PersonhoodParty.fromObject(r)));
        }));
        return parties.filter((py, i) => {
            return parties.findIndex((p) => p.instanceID.equals(py.instanceID)) === i;
        });
    }

    // this removes all parties from the list, but not from byzcoin.
    async wipeParties() {
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // await socket.send("PartyList", "PartyListResponse", {wipeparties: true});
        }));
    }

    // meetups interfaces the meetup endpoint from the personhood service. It will always return the
    // currently stored meetups, but can either add a new meetup, or wipe  all meetups.
    async meetups(meetup: Meetup = null): Promise<UserLocation[]> {
        let data = {};
        if (meetup != null) {
            data = meetup.toObject();
        }
        const uls: UserLocation[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("Meetup", "MeetupResponse", data);
            // try {
            //     resp.users.forEach(ul => uls.push(UserLocation.fromObject(ul)));
            // } catch (e) {
            //     Log.error(e);
            // }
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
        return this.meetups(new Meetup(null, true));
    }

    async listRPS(id: InstanceID = null): Promise<RoPaSci[]> {
        const ropasci: {newropasci: any} = {newropasci: null};
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

    static fromObject(obj: any): PersonhoodParty {
        return new PersonhoodParty(Roster.fromBytes(Buffer.from(obj.roster)),
            Buffer.from(obj.byzcoinid),
            Buffer.from(obj.instanceid));
    }

    constructor(public roster: Roster, public byzcoinID: InstanceID, public instanceID: InstanceID) {
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

    static fromObject(obj: any): RoPaSci {
        return new RoPaSci(Buffer.from(obj.byzcoinid),
            Buffer.from(obj.ropasciid));
    }

    constructor(public byzcoinID: InstanceID, public instanceID: InstanceID) {
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

    static fromObject(obj: any): Poll {
        return new Poll(Buffer.from(obj.byzcoinid), PollStruct.fromObject(obj.newpoll),
            PollList.fromObject(obj.list), PollAnswer.fromObject(obj.answer));
    }

    constructor(public byzcoinID: Buffer, public newPoll: PollStruct, public list: PollList,
                public answer: PollAnswer) {
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

    static fromObject(obj: any): PollList {
        if (obj == null) {
            return null;
        }
        return new PollList(obj.partyids.map((pi: any) => Buffer.from(pi)));
    }

    constructor(public partyIDs: InstanceID[]) {
    }

    toObject(): any {
        return {partyids: this.partyIDs};
    }
}

// PollStruct represents one poll with answers.
export class PollStruct {

    static fromObject(obj: any): PollStruct {
        if (obj == null) {
            return null;
        }
        return new PollStruct(Buffer.from(obj.personhood), Buffer.from(obj.pollid),
            obj.title, obj.description, obj.choices, obj.chosen.map((c: any) => PollChoice.fromObject(c)));
    }

    constructor(public personhood: InstanceID, public pollID: Buffer, public title: string,
                public description: string, public choices: string[], public chosen: PollChoice[] = []) {
        if (this.pollID == null) {
            this.pollID = randomBytes(32);
        }
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

    static fromObject(obj: any): PollAnswer {
        if (obj == null) {
            return null;
        }
        return new PollAnswer(Buffer.from(obj.pollid), obj.choice, Buffer.from(obj.lrs));
    }

    constructor(public pollID: Buffer, public choice: number, public lrs: Buffer) {
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

    static fromObject(obj: any): PollChoice {
        return new PollChoice(obj.choice, Buffer.from(obj.lrstag));
    }

    constructor(public choice: number, public lrstag: Buffer) {
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

    static fromObject(obj: any): PollResponse {
        return new PollResponse(obj.polls.map((p: any) =>
            PollStruct.fromObject(p)));
    }

    constructor(public polls: PollStruct[]) {
    }

    toObject(): any {
        return {
            polls: this.polls.map((p) => p.toObject()),
        };
    }
}

// Meetup contains one user that wants to meet others.
export class Meetup {

    static fromObject(obj: any): Meetup {
        return new Meetup(UserLocation.fromObject(obj.userlocation), obj.wipe);
    }

    constructor(public userLocation: UserLocation, public wipe: boolean = false) {
    }

    toObject(): any {
        const o: {userlocation: any, wipe: boolean} = {
            userlocation: null,
            wipe: this.wipe,
        };
        if (this.userLocation) {
            o.userlocation = this.userLocation.toObject();
        }
        return o;
    }
}

// UserLocation is one user in one location, either a registered one, or an unregistered one.
export class UserLocation {

    get alias(): string {
        return this.credential.getAttribute("personal", "alias").toString();
    }

    get unique(): Buffer {
        if (this.credentialIID) {
            return this.credentialIID;
        }
        return Buffer.from(this.alias);
    }

    static readonly protoName = "UserLocation";

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

    constructor(public credential: CredentialStruct, public location: string,
                public publicKey: Point = null,
                public credentialIID: InstanceID = null, public time: Long = Long.fromNumber(0)) {
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
}
