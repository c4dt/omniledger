import { Point, PointFactory } from '@dedis/kyber';
import * as Long from 'long';
import * as Moment from 'moment';
import { Message, Properties } from 'protobufjs/light';
import { EMPTY_BUFFER, registerMessage } from '../protobuf';

export class PopPartyStruct extends Message<PopPartyStruct> {

    constructor(props?: Properties<PopPartyStruct>) {
        super(props);

        this.finalizations = this.finalizations || [];
        this.miners = this.miners || [];
        this.previous = Buffer.from(this.previous || EMPTY_BUFFER);
        this.next = Buffer.from(this.next || EMPTY_BUFFER);

        /* Protobuf aliases */

        Object.defineProperty(this, 'miningreward', {
            get(): Long {
                return this.miningReward;
            },
            set(value: Long) {
                this.miningReward = value;
            },
        });
    }

    state: number;
    readonly organizers: number;
    readonly finalizations: string[];
    readonly description: PopDesc;
    readonly attendees: Attendees;
    readonly miners: LRSTag[];
    readonly miningReward: Long;
    readonly previous: Buffer;
    readonly next: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('personhood.PopPartyStruct', PopPartyStruct, PopDesc, Attendees, LRSTag);
    }

    /**
     * Replace the current attendees by the new ones and sort them, so that different
     * organizers scanning in a different order get the same result.
     *
     * @param publics Public keys of the new attendees
     */
    updateAttendes(publics: Point[]): void {
        const keys = publics.map((p) => p.toProto());
        keys.sort((a, b) => Buffer.compare(a, b));
        this.attendees.keys.splice(0, this.attendees.keys.length, ...keys);
    }
}

export class FinalStatement extends Message<FinalStatement> {

    readonly desc: PopDesc;
    readonly attendees: Attendees;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('personhood.FinalStatement', FinalStatement, PopDesc, Attendees);
    }
}

export class PopDesc extends Message<PopDesc> {

    constructor(props?: Properties<PopDesc>) {
        super(props);
    }

    /**
     * Getter for the timestamp
     * @returns the timestamp as a number
     */
    get timestamp(): number {
        return this.datetime.toNumber();
    }

    /**
     * Format the timestamp into a human readable string
     * @returns a string of the time
     */
    get dateString(): string {
        return new Date(this.timestamp).toString().replace(/ GMT.*/, '');
    }

    /**
     * Format the timestamp to a unique string
     * @returns the string
     */
    get uniqueName(): string {
        const d = new Date(this.timestamp);
        return Moment(d).format('YY-MM-DD HH:mm');
    }

    readonly name: string;
    readonly purpose: string;
    readonly datetime: Long; // in seconds
    readonly location: string;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('personhood.PopDesc', PopDesc);
    }

    /**
     * Helper to encode the statement using protobuf
     * @returns the bytes
     */
    toBytes(): Buffer {
        return Buffer.from(PopDesc.encode(this).finish());
    }
}

export class Attendees extends Message<Attendees> {

    constructor(properties?: Properties<Attendees>) {
        super(properties);

        this.keys = this.keys.slice() || [];
    }

    /**
     * Get the keys as kyber points
     * @returns a list of points
     */
    get publics(): Point[] {
        return this.keys.map((k) => PointFactory.fromProto(k));
    }

    readonly keys: Buffer[];
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('personhood.Attendees', Attendees);
    }

    /**
     * Helper to encode the attendees using protobuf
     * @returns the bytes
     */
    toBytes(): Buffer {
        return Buffer.from(Attendees.encode(this).finish());
    }
}

export class LRSTag extends Message<LRSTag> {

    constructor(props?: Properties<LRSTag>) {
        super(props);

        this.tag = Buffer.from(this.tag || EMPTY_BUFFER);
    }

    readonly tag: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('personhood.LRSTag', LRSTag);
    }
}

PopPartyStruct.register();
FinalStatement.register();
PopDesc.register();
Attendees.register();
LRSTag.register();
