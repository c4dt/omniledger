"use strict";

import {Private, Public} from "./KeyPair";

require("nativescript-nodeify");
const Kyber = require("@dedis/kyber-js");
const Blake = require("@stablelib/blake2xs").BLAKE2Xs;
import {cloneDeep} from "lodash";

export const Suite = new Kyber.curve.edwards25519.Curve;

import {Log} from "./Log";

/**
 * Sign a message using (un)linkable ring signature. This method is ported from the Kyber Golang version
 * available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer to the documentation
 * of the given link for detailed instructions. This port stick to the Go implementation, however the hashing function
 * used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Buffer} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param [linkScope] - ths link scope used for linkable signature
 * @param {Private} privateKey - the private key of the signer
 * @return {RingSig} - the signature
 */
export async function Sign(message: Buffer, anonymitySet: Public[],
                           linkScope: Buffer, privateKey: Private):
    Promise<RingSig> {
    let hasLS = (linkScope) && (linkScope !== null);

    let pi = await sortSet(anonymitySet, privateKey);
    let n = anonymitySet.length;
    let L = anonymitySet.slice(0);

    let linkBase;
    let linkTag: Public;
    if (hasLS) {
        let linkStream = new Blake(undefined, {key: linkScope});
        linkBase = Suite.point().pick(createStreamFromBlake(linkStream));
        linkTag = new Public(Suite.point().mul(privateKey.scalar, linkBase));
    }

    let H1pre = signH1pre(linkScope, linkTag, message);

    let u = Suite.scalar().pick();
    let UB = Suite.point().mul(u);
    let UL;
    if (hasLS) {
        UL = new Public(Suite.point().mul(u, linkBase));
    }

    let s: any[] = [];
    let c: Private[] = [];

    c[(pi + 1) % n] = signH1(H1pre, new Public(UB), UL);

    let P = Suite.point();
    let PG = Suite.point();
    let PH: Public;
    if (hasLS) {
        PH = new Public(Suite.point());
    }
    for (let i = (pi + 1) % n; i !== pi; i = (i + 1) % n) {
        s[i] = Suite.scalar().pick();
        PG.add(PG.mul(s[i]), P.mul(c[i].scalar, L[i].point));
        if (hasLS) {
            PH.point.add(PH.point.mul(s[i], linkBase), P.mul(c[i].scalar, linkTag.point));
        }
        c[(i + 1) % n] = signH1(H1pre, new Public(PG), PH);
    }
    s[pi] = Suite.scalar();
    s[pi].mul(privateKey.scalar, c[pi].scalar).sub(u, s[pi]);

    return new RingSig(c[0], s.map(s => new Private(s)), linkTag);
}

/**
 * Verify the signature of a message  a message using (un)linkable ring signature. This method is ported from
 * the Kyber Golang version available at https://github.com/dedis/kyber/blob/master/sign/anon/sig.go. Please refer
 * to the documentation of the given link for detailed instructions. This port stick to the Go implementation, however
 * the hashing function used here is Blake2xs, whereas Blake2xb is used in the Golang version.
 *
 * @param {Kyber.Curve} suite - the crypto suite used for the sign process
 * @param {Uint8Array} message - the message to be signed
 * @param {Array} anonymitySet - an array containing the public keys of the group
 * @param [linkScope] - ths link scope used for linkable signature
 * @param signatureBuffer - the signature the will be verified
 * @return {SignatureVerification} - contains the property of the verification
 */
export async function Verify(message: Buffer, anonymitySet: Public[], linkScope: Buffer, signatureBuffer: Buffer):
    Promise<SignatureVerification> {
    if (!(signatureBuffer instanceof Uint8Array)) {
        return Promise.reject("signatureBuffer must be Uint8Array");
    }
    anonymitySet.sort((a, b) => {
        return Buffer.compare(a.toBuffer(), b.toBuffer());
    });

    let n = anonymitySet.length;
    let L = anonymitySet.slice(0);

    let linkBase, linkTag;
    let sig = decodeSignature(signatureBuffer, !!linkScope);
    if (anonymitySet.length != sig.S.length) {
        return Promise.reject("given anonymity set and signature anonymity set not of equal length")
    }

    if (linkScope) {
        let linkStream = new Blake(undefined, {key: linkScope});
        linkBase = Suite.point().pick(createStreamFromBlake(linkStream));
        linkTag = sig.Tag.point;
    }

    let H1pre = signH1pre(linkScope, new Public(linkTag), message);

    let P, PG, PH: Public;
    P = Suite.point();
    PG = Suite.point();
    if (linkScope) {
        PH = new Public(Suite.point());
    }
    let s = sig.S;
    let ci = sig.C0;
    for (let i = 0; i < n; i++) {
        PG.add(PG.mul(s[i].scalar), P.mul(ci.scalar, L[i].point));
        if (linkScope) {
            PH.point.add(PH.point.mul(s[i].scalar, linkBase), P.mul(ci.scalar, linkTag));
        }
        ci = signH1(H1pre, new Public(PG), PH);
    }
    if (!ci.equal(sig.C0)) {
        return new SignatureVerification(false);
    }

    if (linkScope) {
        return new SignatureVerification(true, new Public(linkTag));
    }

    return new SignatureVerification(true);
}

export class SignatureVerification {
    constructor(public valid: boolean, public tag: Public = null) {
    }
}

/**
 * Sign a message using (un)linkable ring signature
 *
 * @param {Badge} b - the badge used to sign the message
 * @param {Uint8Array} message -  the message to be signed
 * @param {Uint8Array} [scope] - has to be given if linkable ring signature is used
 * @return {Uint8Array} - the signature
 */
export function SignWithBadge(b, message, scope) {
    let attendees = b.finalStatement.attendees;
    attendees.sort((a, b) => {
        return Buffer.compare(Buffer.from(a.marshalBinary()), Buffer.from(b.marshalBinary()));
    });
    let anonymitySet = new Set();
    let minePublic = b.keypair.public;
    let minePrivate = b.keypair.private;
    let mine = -1;
    for (let i = 0; i < attendees.length; i++) {
        let attendee = attendees[i];
        anonymitySet.add(attendee);
        if (attendee.equal(minePublic)) {
            mine = i;
        }
    }

    if (mine < 0) {
        return Promise.reject("Pop Token is invalid");
    }

    // @ts-ignore
    return this.Sign(Suite, message, [...anonymitySet], scope, mine, minePrivate)
}

function concatArrays(constructor, arrays) {
    let totalLength = 0;
    for (const arr of arrays) {
        totalLength += arr.length;
    }
    const result = new constructor(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

function createStreamFromBlake(blakeInstance) {
    if (!(blakeInstance instanceof Blake)) {
        return Promise.reject("blakeInstance must be of type Blake2xs");
    }

    function getNextBytes(count) {
        if (!Number.isInteger(count)) {
            return Promise.reject("count must be a integer");
        }
        let array = new Uint8Array(count);
        blakeInstance.stream(array);
        return array;
    }

    return getNextBytes;
}

function signH1pre(linkScope: Buffer, linkTag: Public, message: Buffer): any {
    let H1pre = new Blake(undefined, {key: message});

    if (linkScope) {
        H1pre.update(linkScope);
        let tag = linkTag.toBuffer();
        H1pre.update(tag);
    }

    return H1pre;
}

function signH1(H1pre, PG: Public, PH: Public): Private {
    let H1 = cloneDeep(H1pre);

    let PGb = PG.toBuffer();
    H1.update(PGb);
    if (PH) {
        let PHb = PH.toBuffer();
        H1.update(PHb);
    }
    return new Private(Suite.scalar().pick(createStreamFromBlake(H1)));
}

function decodeSignature(signatureBuffer: Buffer, isLinkableSig: boolean): RingSig {
    let scalarMarshalSize = Suite.scalar().marshalSize();
    let pointMarshalSize = Suite.point().marshalSize();
    let c0 = Private.fromBuffer(signatureBuffer.slice(0, pointMarshalSize));

    let S: Private[] = [];
    let endIndex = isLinkableSig ? signatureBuffer.length - pointMarshalSize : signatureBuffer.length;
    for (let i = pointMarshalSize; i < endIndex; i += scalarMarshalSize) {
        S.push(Private.fromBuffer(signatureBuffer.slice(i, i + scalarMarshalSize)));
    }

    let fields = new RingSig(c0, S);

    if (isLinkableSig) {
        fields.Tag = Public.fromBuffer(signatureBuffer.slice(endIndex));
    }

    return fields;
}

export class RingSig {
    constructor(public C0: Private, public S: Private[], public Tag: Public = null) {
    }

    encode(): Buffer {
        let array = [];

        array.push(this.C0.toBuffer());

        for (let scalar of this.S) {
            array.push(scalar.toBuffer());
        }

        if (this.Tag) {
            array.push(this.Tag.toBuffer());
        }

        return Buffer.from(concatArrays(Buffer, array));
    }
}

async function sortSet(anonymitySet: Public[], privateKey: Private): Promise<number>{
    anonymitySet.sort((a, b) => {
        return Buffer.compare(a.toBuffer(), b.toBuffer());
    });
    let pubKey = Public.base().mul(privateKey);
    let pi = anonymitySet.findIndex(pub => pub.equal(pubKey));
    if (pi < 0){
        return Promise.reject("didn't find public key in anonymity set")
    }
    return pi;
}

