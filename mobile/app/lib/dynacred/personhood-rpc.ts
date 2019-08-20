import { Scalar } from "@dedis/kyber";
import { randomBytes } from "crypto-browserify";
import * as crypto from "crypto-browserify";
import Long from "long";
import { Message, Properties } from "protobufjs";
import ByzCoinRPC from "~/lib/cothority/byzcoin/byzcoin-rpc";
import DarcInstance from "~/lib/cothority/byzcoin/contracts/darc-instance";
import { InstanceID } from "~/lib/cothority/byzcoin/instance";
import Log from "~/lib/cothority/log";
import { Roster, ServerIdentity } from "~/lib/cothority/network";
import { IConnection, RosterWSConnection, WebSocketConnection } from "~/lib/cothority/network/connection";
import CredentialsInstance, { CredentialStruct } from "~/lib/cothority/personhood/credentials-instance";
import { PopPartyInstance } from "~/lib/cothority/personhood/pop-party-instance";
import { Sign } from "~/lib/cothority/personhood/ring-sig";
import { registerMessage } from "~/lib/cothority/protobuf";

/**
 * PersonhoodRPC interacts with the personhood service and all personhood-related contracts, like personhood-party,
 * rock-paper-scissors, and spawner.
 * Once it's more stable, it should go into dedis/cothority/external/js/cothority. For this reason it should not
 * depend on anything from dynacred.
 */
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
    async listParties(newParty: Party = null): Promise<Party[]> {
        const partyList = new PartyList({newparty: newParty});
        let parties: Party[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            const resp = await socket.send(partyList, PartyListResponse) as PartyListResponse;
            parties.push(...resp.parties);
        }));
        // Filter out double parties
        parties = parties.filter((py, i) => {
            return parties.findIndex((p) => p.instanceID.equals(py.instanceID)) === i;
        });
        // Only take parties from our byzcoin
        return parties.filter((party) => party.byzCoinID.equals(this.rpc.genesisID));
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
    async meetups(meetup: Meetup = new Meetup()): Promise<UserLocation[]> {
        const uls: UserLocation[] = [];
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            const resp = (await socket.send(meetup, MeetupResponse)) as MeetupResponse;
            if (resp.users) {
                uls.push(...resp.users);
            }
        }));
        return uls.filter((m) => m != null).filter((userlocation, i) => {
            return uls.findIndex((ul) => ul.equals(userlocation)) === i;
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

    async listRPS(newRoPaSci: RoPaSci = null): Promise<RoPaSci[]> {
        const ropascis: RoPaSci[] = [];
        let rpsList = new RoPaSciList();
        if (newRoPaSci) {
            rpsList = new RoPaSciList({newRoPaSci});
        }
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            const resp: RoPaSciListResponse = await socket.send(rpsList, RoPaSciListResponse);
            if (resp && resp.roPaScis) {
                ropascis.push(...resp.roPaScis);
            }
        }));
        return ropascis.filter((rps, i) => {
            return ropascis.findIndex((p) => p.roPaSciID.equals(rps.roPaSciID)) === i;
        });
    }

    async wipeRPS() {
        const ropasci = new RoPaSciList({wipe: true});
        await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            await socket.send(ropasci, RoPaSciListResponse);
        }));
    }

    async pollNew(personhood: InstanceID, title: string, description: string, choices: string[]): Promise<PollStruct> {
        const newPoll = new PollStruct({
            choices,
            description,
            personhood,
            pollID: randomBytes(32),
            title,
        });
        const ps = await this.callPoll(new Poll({
            byzcoinID: this.rpc.genesisID,
            newPoll,
        }));
        return ps[0];
    }

    async pollList(partyIDs: InstanceID[]): Promise<PollStruct[]> {
        return this.callPoll(new Poll({
            byzcoinID: this.rpc.genesisID,
            list: new PollList({partyIDs}),
        }));
    }

    async pollAnswer(priv: Scalar, personhood: PopPartyInstance, pollID: Buffer, choice: number): Promise<PollStruct> {
        const context = Buffer.alloc(68);
        context.write("Poll");
        this.rpc.genesisID.copy(context, 4);
        pollID.copy(context, 36);
        const msg = Buffer.alloc(7);
        msg.write("Choice");
        msg.writeUInt8(choice, 6);
        const contextHash = crypto.createHash("sha256");
        contextHash.update(context);
        const points = personhood.popPartyStruct.attendees.publics;
        const lrs = await Sign(msg, points, contextHash.digest(), priv);
        const answer = new PollAnswer({
            choice,
            lrs: lrs.encode(),
            pollID,
        });
        const ps = await this.callPoll(new Poll({
            answer,
            byzcoinID: this.rpc.genesisID,
            },
        ));
        return ps[0];
    }

    async pollWipe() {
        return this.callPoll(new Poll({byzcoinID: this.rpc.genesisID}));
    }

    async callPoll(p: Poll): Promise<PollStruct[]> {
        const resp: PollResponse[] = [];
        await this.callAllPoll(p, resp);
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

    async callAllPoll(query: Poll, response: PollResponse[]): Promise<any> {
        return await Promise.all(this.list.map(async (addr) => {
            const socket = new WebSocketConnection(addr.getWebSocketAddress(), PersonhoodRPC.serviceID);
            response.push(await socket.send(query, PollResponse));
        }));
    }
}

export class RoPaSci extends Message<RoPaSci> {

    static register() {
        registerMessage("RoPaSci", RoPaSci);
    }
    readonly byzcoinID: InstanceID;
    readonly roPaSciID: InstanceID;

    constructor(props?: Properties<RoPaSci>) {
        super(props);

        Object.defineProperty(this, "byzcoinid", {
            get(): InstanceID {
                return this.byzcoinID;
            },
            set(value: InstanceID) {
                this.byzcoinID = value;
            },
        });
        Object.defineProperty(this, "ropasciid", {
            get(): Buffer {
                return this.roPaSciID;
            },
            set(value: Buffer) {
                this.roPaSciID = value;
            },
        });
    }
}

export class RoPaSciList extends Message<RoPaSciList> {

    static register() {
        registerMessage("RoPaSciList", RoPaSciList);
    }
    readonly newRoPaSci: RoPaSci;
    readonly wipe: boolean;

    constructor(props?: Properties<RoPaSciList>) {
        super(props);

        Object.defineProperty(this, "newropasci", {
            get(): RoPaSci {
                return this.newRoPaSci;
            },
            set(value: RoPaSci) {
                this.newRoPaSci = value;
            },
        });
    }
}

export class RoPaSciListResponse extends Message<RoPaSciListResponse> {

    static register() {
        registerMessage("RoPaSciListResponse", RoPaSciListResponse);
    }
    readonly roPaScis: RoPaSci[];

    constructor(props?: Properties<RoPaSciListResponse>) {
        super(props);

        Object.defineProperty(this, "ropascis", {
            get(): RoPaSci[] {
                return this.roPaScis;
            },
            set(value: RoPaSci[]) {
                this.roPaScis = value;
            },
        });
    }
}

// Poll allows for adding, listing, and answering to polls
export class Poll extends Message<Poll> {

    static register() {
        registerMessage("Poll", Poll);
    }
    readonly byzcoinID: Buffer;
    readonly newPoll: PollStruct;
    readonly list: PollList;
    readonly answer: PollAnswer;

    constructor(props?: Properties<Poll>) {
        super(props);

        Object.defineProperty(this, "byzcoinid", {
            get(): Buffer {
                return this.byzcoinID;
            },
            set(value: Buffer) {
                this.byzcoinID = value;
            },
        });
        Object.defineProperty(this, "newpoll", {
            get(): PollStruct {
                return this.newPoll;
            },
            set(value: PollStruct) {
                this.newPoll = value;
            },
        });
    }
}

// Empty class to request the list of polls available.
export class PollList extends Message<PollList> {

    static register() {
        registerMessage("PollList", PollList);
    }
    readonly partyIDs: InstanceID[];

    constructor(props?: Properties<PollList>) {
        super(props);

        Object.defineProperty(this, "partyids", {
            get(): InstanceID[] {
                return this.partyIDs;
            },
            set(value: InstanceID[]) {
                this.partyIDs = value;
            },
        });
    }
}

// PollStruct represents one poll with answers.
export class PollStruct extends Message<PollStruct> {

    static register() {
        registerMessage("PollStruct", PollStruct);
    }
    readonly personhood: InstanceID;
    readonly pollID: Buffer;
    readonly title: string;
    readonly description: string;
    readonly choices: string[];
    readonly chosen: PollChoice[];

    constructor(props?: Properties<PollStruct>) {
        super(props);

        Object.defineProperty(this, "pollid", {
            get(): Buffer {
                return this.pollID;
            },
            set(value: Buffer) {
                this.pollID = value;
            },
        });
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
export class PollAnswer extends Message<PollAnswer> {

    static register() {
        registerMessage("PollAnswer", PollAnswer);
    }
    readonly pollID: Buffer;
    readonly choice: number;
    readonly lrs: Buffer;

    constructor(props?: Properties<PollAnswer>) {
        super(props);

        Object.defineProperty(this, "pollid", {
            get(): Buffer {
                return this.pollID;
            },
            set(value: Buffer) {
                this.pollID = value;
            },
        });
    }
}

// PollChoice represents one choice of one participant.
export class PollChoice extends Message<PollChoice> {

    static register() {
        registerMessage("PollChoice", PollChoice);
    }
    readonly choice: number;
    readonly lrstag: Buffer;

    constructor(props?: Properties<PollChoice>) {
        super(props);
    }
}

// PollResponse is sent back to the client and contains all known polls.
export class PollResponse extends Message<PollResponse> {

    static register() {
        registerMessage("PollResponse", PollResponse);
    }
    readonly polls: PollStruct[];

    constructor(props?: Properties<PollResponse>) {
        super(props);
    }
}

// UserLocation is one user in one location, either a registered one, or an unregistered one.
export class UserLocation extends Message<UserLocation> {

    get alias(): string {
        const aliasbuf = this.credential.getAttribute("1-public", "alias");
        return aliasbuf ? aliasbuf.toString() : "unknown";
    }

    get unique(): Buffer {
        if (this.credentialIID) {
            return this.credentialIID;
        }
        return Buffer.from(this.alias);
    }

    static register() {
        registerMessage("UserLocation", UserLocation);
    }

    readonly credential: CredentialStruct;
    readonly location: string;
    readonly publicKey: Buffer;
    readonly credentialIID: InstanceID;
    readonly time: Long;

    constructor(props?: Properties<UserLocation>) {
        super(props);

        Object.defineProperty(this, "publickey", {
            get(): Buffer {
                return this.publicKey;
            },
            set(value: Buffer) {
                this.publicKey = value;
            },
        });
        Object.defineProperty(this, "credentialiid", {
            get(): InstanceID {
                return this.credentialIID;
            },
            set(value: InstanceID) {
                this.credentialIID = value;
            },
        });
    }

    equals(ul: UserLocation): boolean {
        return this.unique.equals(ul.unique);
    }
}

export class Party extends Message<Party> {

    static register() {
        registerMessage("Party", Party);
    }
    readonly roster: Roster;
    // ByzCoinID represents the ledger where the pop-party is stored.
    readonly byzCoinID: InstanceID;
    // InstanceID is where to find the party in the ledger.
    readonly instanceID: InstanceID;

    constructor(props?: Properties<Party>) {
        super(props);

        Object.defineProperty(this, "byzcoinid", {
            get(): InstanceID {
                return this.byzCoinID;
            },
            set(value: InstanceID) {
                this.byzCoinID = value;
            },
        });
        Object.defineProperty(this, "instanceid", {
            get(): InstanceID {
                return this.instanceID;
            },
            set(value: InstanceID) {
                this.instanceID = value;
            },
        });
    }
}

export class PartyList extends Message<PartyList> {

    static register() {
        registerMessage("PartyList", PartyList);
    }
    readonly newparty: Party;
    readonly wipeparties: boolean;

    constructor(props?: Properties<PartyList>) {
        super(props);
    }
}

export class PartyListResponse extends Message<PartyListResponse> {

    static register() {
        registerMessage("PartyListResponse", PartyListResponse);
    }
    readonly parties: Party[];

    constructor(props?: Properties<PartyListResponse>) {
        super(props);
    }
}

// Meetup contains one user that wants to meet others.
export class Meetup extends Message<Meetup> {

    static register() {
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

export class MeetupResponse extends Message<MeetupResponse> {

    static register() {
        registerMessage("MeetupResponse", MeetupResponse);
    }
    readonly users: UserLocation[];

    constructor(props?: Properties<MeetupResponse>) {
        super(props);
    }
}

RoPaSci.register();
RoPaSciList.register();
RoPaSciListResponse.register();
Poll.register();
PollList.register();
PollStruct.register();
PollAnswer.register();
PollChoice.register();
PollResponse.register();
UserLocation.register();
Party.register();
PartyList.register();
PartyListResponse.register();
Meetup.register();
MeetupResponse.register();
