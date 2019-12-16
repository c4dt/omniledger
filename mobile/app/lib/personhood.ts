// tslint:disable-next-line
require("nativescript-nodeify");

import { Data } from "~/lib/dynacred";

export function getMax(): IScore {
    return {
        attributes: 4,
        invites: 5,
        meetups: 3,
        parties: 2,
        polls: 3,
        registered: 1,
        roPaScis: 5,
        snack: 1,
    };
}

export function getMaxScore(): IScore {
    return {
        attributes: 0,
        invites: 15,
        meetups: 0,
        parties: 40,
        polls: 15,
        registered: 5,
        roPaScis: 15,
        snack: 10,
    };
}

export function getRawData(u: Data): IScore {
    const atts = 1 +
        (u.contact.email !== "" ? 1 : 0) +
        (u.contact.phone !== "" ? 1 : 0) +
        (u.contact.url !== "" ? 1 : 0);
    const max = getMax();

    return {
        attributes: Math.min(atts, max.attributes),
        invites: Math.min(u.references.length, max.invites),
        meetups: Math.min(u.uniqueMeetings, max.meetups),
        parties: Math.min(u.badges.length, max.parties),
        polls: Math.min(u.polls.filter((poll) => poll.chosen.length > 0).length, max.polls),
        registered: u.contact.isRegistered() ? 1 : 0,
        roPaScis: Math.min(u.ropascis.filter((rps) => rps.isDone()).length, max.roPaScis),
        snack: u.contact.hasSnack ? 1 : 0,
    };
}

export function rawToPercent(data: IScore): IScore {
    return {
        // attributes: 0%
        attributes: 0,
        // invites: 15%
        invites: 3 * data.invites,
        // meetups: 0%
        meetups: 0 * data.meetups,
        // parties: 45%
        parties: [0, 20, 40][data.parties],
        // polls: 15%
        polls: 5 * data.polls,
        // registered: 5%
        registered: 5 * data.registered,
        // ropascis: 15%
        roPaScis: 3 * data.roPaScis,
        // snack: 10%
        snack: 10 * data.snack,
    };
}

export interface IScore {
    attributes: number;
    meetups: number;
    parties: number;
    polls: number;
    invites: number;
    registered: number;
    roPaScis: number;
    snack: number;
}
