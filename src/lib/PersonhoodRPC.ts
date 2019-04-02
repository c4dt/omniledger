import {InstanceID} from "./cothority/byzcoin/instance";
import {Log} from "./Log";
import ByzCoinRPC from "./cothority/byzcoin/byzcoin-rpc";
import {randomBytes} from "crypto";
import {RingSig, Sign} from "./RingSig";
import {Party} from "./Party";
import {Private, Public} from "./KeyPair";
import CredentialInstance, {CredentialStruct} from "./cothority/byzcoin/contracts/credentials-instance";
import * as Long from "long";
import {Contact} from "./Contact";
import DarcInstance from "./cothority/byzcoin/contracts/darc-instance";
import {Roster, ServerIdentity} from "./cothority/network";
import {objToProto, root} from "./cothority/protobuf";
import {IConnection, RosterWSConnection, WebSocketConnection} from "./cothority/network/connection";

const crypto = require("crypto");

export class PersonhoodRPC {
    private socket: IConnection;
    private list: ServerIdentity[];
    static serviceID = "Personhood";

    constructor(public bc: ByzCoinRPC) {
        this.socket = new RosterWSConnection(bc.getConfig().roster, PersonhoodRPC.serviceID);
        this.list = this.bc.getConfig().roster.list;
    }

    /**
     */
    async listParties(id: InstanceID = null): Promise<PersonhoodParty[]> {
        let party = {newparty: null};
        if (id) {
            let p = new PersonhoodParty(this.bc.getConfig().roster, this.bc.genesisID, id);
            party.newparty = p.toObject();
        }
        let parties: PersonhoodParty[] = [];
        await Promise.all(this.list.map(async addr => {
            let socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("PartyList", "PartyListResponse", party);
            // parties = parties.concat(resp.parties.map(r => PersonhoodParty.fromObject(r)));
        }));
        return parties.filter((party, i) => {
            return parties.findIndex(p => p.instanceID.equals(party.instanceID)) == i;
        });
    }

    // this removes all parties from the list, but not from byzcoin.
    async wipeParties() {
        await Promise.all(this.list.map(async addr => {
            let socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
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
        let uls: UserLocation[] = [];
        await Promise.all(this.list.map(async addr => {
            let socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("Meetup", "MeetupResponse", data);
            // try {
            //     resp.users.forEach(ul => uls.push(UserLocation.fromObject(ul)));
            // } catch (e) {
            //     Log.error(e);
            // }
        }));
        return uls.filter(m => m != null).filter((userlocation, i) => {
            return uls.findIndex(ul => ul.toProto().equals(userlocation.toProto())) == i;
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
        let ropasci = {newropasci: null};
        if (id) {
            ropasci.newropasci = new RoPaSci(this.bc.genesisID, id).toObject();
        }
        let ropascis: RoPaSci[] = [];
        await Promise.all(this.list.map(async addr => {
            let socket = new WebSocket(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("RoPaSciList", "RoPaSciListResponse", ropasci);
            // if (resp && resp.ropascis) {
            //     ropascis = ropascis.concat(resp.ropascis.map(r => RoPaSci.fromObject(r)));
            // }
        }));
        return ropascis.filter((ropasci, i) => {
            return ropascis.findIndex(p => p.instanceID.equals(ropasci.instanceID)) == i;
        });
    }

    async wipeRPS() {
        let ropasci = {wipe: true};
        await Promise.all(this.list.map(async addr => {
            let socket = new WebSocket(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // let resp = await socket.send("RoPaSciList", "RoPaSciListResponse", ropasci);
        }));
    }

    async pollNew(personhood: InstanceID, title: string, description: string, choices: string[]): Promise<PollStruct> {
        let np = new PollStruct(personhood, null, title, description, choices);
        let ps = await this.callPoll(new Poll(this.bc.genesisID, np, null, null));
        return ps[0];
    }

    async pollList(partyIDs: InstanceID[]): Promise<PollStruct[]> {
        return this.callPoll(new Poll(this.bc.genesisID, null, new PollList(partyIDs), null));
    }

    async pollAnswer(priv: Private, personhood: Party, pollId: Buffer, choice: number): Promise<PollStruct> {
        let context = Buffer.alloc(68);
        context.write("Poll");
        personhood.partyInstance.bc.genesisID.copy(context, 4);
        pollId.copy(context, 36);
        let msg = Buffer.alloc(7);
        msg.write("Choice");
        msg.writeUInt8(choice, 6);
        let contextHash = crypto.createHash("sha256");
        contextHash.update(context);
        let points = personhood.partyInstance.popPartyStruct.attendees.publics.map(p =>
            new Public(p));
        let lrs = await Sign(msg, points, contextHash.digest(), priv);
        let pa = new PollAnswer(pollId, choice, lrs.encode());
        let ps = await this.callPoll(new Poll(this.bc.genesisID, null, null, pa));
        return ps[0];
    }

    async pollWipe() {
        return this.callPoll(new Poll(this.bc.genesisID, null, null, null));
    }

    async callPoll(p: Poll): Promise<PollStruct[]> {
        let resp: PollResponse[] = [];
        await this.callAllPoll("Poll", "PollResponse", p.toObject(), resp);
        let str: PollStruct[] = [];
        resp.forEach(r => {
            if (r) {
                r.polls.forEach(poll => {
                    if (!str.find(s => s.pollID.equals(poll.pollID))) {
                        str.push(poll);
                    }
                })
            }
        });
        return str;
    }

    async callAllPoll(req: string, resp: string, query: any, response: PollResponse[]): Promise<any> {
        return await Promise.all(this.list.map(async addr => {
            let socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            // response.push(PollResponse.fromObject(await socket.send(req, resp, query)));
        }));
    }
}

export class PersonhoodParty {
    constructor(public roster: Roster, public byzcoinID: InstanceID, public instanceID: InstanceID) {
    }

    toObject(): any {
        return {
            roster: this.roster.toBytes(),
            byzcoinid: this.byzcoinID,
            instanceid: this.instanceID,
        }
    }

    static fromObject(obj: any): PersonhoodParty {
        return new PersonhoodParty(Roster.fromBytes(Buffer.from(obj.roster)),
            Buffer.from(obj.byzcoinid),
            Buffer.from(obj.instanceid));
    }
}

export class RoPaSci {
    constructor(public byzcoinID: InstanceID, public instanceID: InstanceID) {
    }

    toObject(): any {
        return {
            byzcoinid: this.byzcoinID,
            ropasciid: this.instanceID,
        }
    }

    static fromObject(obj: any): RoPaSci {
        return new RoPaSci(Buffer.from(obj.byzcoinid),
            Buffer.from(obj.ropasciid));
    }
}

// Poll allows for adding, listing, and answering to polls
export class Poll {
    constructor(public byzcoinID: Buffer, public newPoll: PollStruct, public list: PollList, public answer: PollAnswer) {
    }

    toObject(): any {
        return {
            byzcoinid: this.byzcoinID,
            newpoll: this.newPoll ? this.newPoll.toObject() : null,
            list: this.list ? this.list.toObject() : null,
            answer: this.answer ? this.answer.toObject() : null,
        }
    }

    static fromObject(obj: any): Poll {
        return new Poll(Buffer.from(obj.byzcoinid), PollStruct.fromObject(obj.newpoll),
            PollList.fromObject(obj.list), PollAnswer.fromObject(obj.answer));
    }
}

// Empty class to request the list of polls available.
export class PollList {
    constructor(public partyIDs: InstanceID[]) {
    }

    toObject(): any {
        return {partyids: this.partyIDs};
    }

    static fromObject(obj: any): PollList {
        if (obj == null) {
            return null;
        }
        return new PollList(obj.partyids.map(pi => Buffer.from(pi)));
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

    toObject(): any {
        return {
            personhood: this.personhood,
            pollid: this.pollID,
            title: this.title,
            description: this.description,
            choices: this.choices,
            chosen: this.chosen.map(c => c.toObject()),
        }
    }

    static fromObject(obj: any): PollStruct {
        if (obj == null) {
            return null;
        }
        return new PollStruct(Buffer.from(obj.personhood), Buffer.from(obj.pollid),
            obj.title, obj.description, obj.choices, obj.chosen.map(c => PollChoice.fromObject(c)));
    }

    choiceCount(c: number): number {
        return this.chosen.reduce((prev: number, curr) => {
            return curr.choice == c ? prev + 1 : prev
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

    toObject(): any {
        return {
            pollid: this.pollID,
            choice: this.choice,
            lrs: this.lrs,
        }
    }

    static fromObject(obj: any): PollAnswer {
        if (obj == null) {
            return null;
        }
        return new PollAnswer(Buffer.from(obj.pollid), obj.choice, Buffer.from(obj.lrs));
    }
}

// PollChoice represents one choice of one participant.
export class PollChoice {
    constructor(public choice: number, public lrstag: Buffer) {
    }

    toObject(): any {
        return {
            choice: this.choice,
            lrstag: this.lrstag,
        }
    }

    static fromObject(obj: any): PollChoice {
        return new PollChoice(obj.choice, Buffer.from(obj.lrstag));
    }
}

// PollResponse is sent back to the client and contains all known polls.
export class PollResponse {
    constructor(public polls: PollStruct[]) {
    }

    toObject(): any {
        return {
            polls: this.polls.map(p => p.toObject()),
        }
    }

    static fromObject(obj: any): PollResponse {
        return new PollResponse(obj.polls.map(p =>
            PollStruct.fromObject(p)));
    }
}

// Meetup contains one user that wants to meet others.
export class Meetup {
    constructor(public userLocation: UserLocation, public wipe: boolean = false) {
    }

    toObject(): any {
        let o = {
            userlocation: null,
            wipe: this.wipe,
        };
        if (this.userLocation) {
            o.userlocation = this.userLocation.toObject();
        }
        return o;
    }

    static fromObject(obj: any): Meetup {
        return new Meetup(UserLocation.fromObject(obj.userlocation), obj.wipe);
    }
}

// UserLocation is one user in one location, either a registered one, or an unregistered one.
export class UserLocation {
    static readonly protoName = "UserLocation";

    constructor(public credential: CredentialStruct, public location: string,
                public publicKey: Public = null,
                public credentialIID: InstanceID = null, public time: Long = Long.fromNumber(0)) {
    }

    toObject(): any {
        let o = {
            credential: this.credential.toBytes(),
            location: this.location,
            time: this.time,
            credentialiid: null,
            publickey: null,
        };
        if (this.credentialIID) {
            o.credentialiid = this.credentialIID;
        }
        if (this.publicKey) {
            o.publickey = this.publicKey.toBuffer();
        }
        return o
    }

    toProto(): Buffer {
        return objToProto(this.toObject(), UserLocation.protoName);
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

    equals(ul: UserLocation): boolean {
        return this.unique.equals(ul.unique);
    }

    async toContact(bc: ByzCoinRPC): Promise<Contact> {
        try {
            let c = new Contact(this.credential);
            if (this.credentialIID) {
                c.credentialInstance = await CredentialInstance.fromByzcoin(bc, this.credentialIID);
                c.credential = c.credentialInstance.credential.copy();
                c.darcInstance = await DarcInstance.fromByzcoin(bc, c.credentialInstance.darcID);
            } else {
                c.unregisteredPub = this.publicKey;
            }
            return c;
        } catch (e) {
            return Log.rcatch(e, "couldn't convert toContact");
        }
    }

    static fromObject(o: any): UserLocation {
        let crediid: InstanceID = null;
        let pubkey: Public = null;
        if (o.credentialiid && o.credentialiid.length == 32) {
            crediid = Buffer.from(o.credentialiid);
        }
        if (o.publickey) {
            pubkey = Public.fromBuffer(Buffer.from(o.publickey));
        }
        return new UserLocation(CredentialStruct.fromObject(o.credential),
            o.location, pubkey, crediid, o.time);
    }

    static fromProto(p: Buffer): UserLocation {
        return UserLocation.fromObject(root.lookup(UserLocation.protoName).decode(p));
    }

    static fromContact(c: Contact): UserLocation {
        return new UserLocation(c.credential, "somewhere", c.pubIdentity, c.credentialIID);
    }
}
