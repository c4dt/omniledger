import {BehaviorSubject, Observable} from "rxjs";
import {map, pairwise} from "rxjs/operators";
import {mergeMap} from "rxjs/internal/operators/mergeMap";
import {Log} from "@dedis/cothority";
import {startWith} from "rxjs/internal/operators/startWith";

/**
 * Creates a second order observable from source S that emits an array of
 * BehaviorSubjecets<D>
 * @param sob
 * @constructor
 */
export function ObservableHO<S, Q, D extends BehaviorSubject<Q>>(sob: SecondObs<S, D>)
    : Observable<D[]> {

    const bssCache = new Map<string, D>();
    return sob.source.pipe(
        map((rs) => new Set(rs.map(r => sob.srcStringer(r)))),
        startWith(new Set()),
        pairwise(),
        map((pair) => {
            const [prev, curr] = pair;
            const newBS: S[] = [];
            prev.forEach((t) => {
                if (!curr.has(t)) {
                    const bs = bssCache.get(t);
                    if (bs !== undefined) {
                        bs.complete();
                        bssCache.delete(t);
                    }
                }
            });
            curr.forEach((t) => {
                if (!prev.has(t)) {
                    newBS.push(sob.stringToSrc(t))
                }
            });
            return newBS;
        })
    ).pipe(
        mergeMap(async (ts: S[]) => {
            return {
                str: ts.map(sob.srcStringer),
                dest: await Promise.all(ts.map(sob.convert)),
            }}),
        map((rs) => {
            rs.str.forEach((str, i) => {
                bssCache.set(str, rs.dest[i]);
            });
            return rs.dest;
        })
    );
}

export async function BehaviorSubjectHO<T, R extends BehaviorSubject<R>>(sob: SecondObs<T, R>)
    : Promise<BehaviorSubject<BehaviorSubject<R>[]>> {

    let bs: BehaviorSubject<BehaviorSubject<R>[]>;
    return new Promise((resolve) => {
        ObservableHO(sob)
            .subscribe((bss) => {
                if (bs === undefined) {
                    bs = new BehaviorSubject(bss);
                    resolve(bs);
                } else {
                    bs.next(bss);
                }
            })
    })
}

export async function ObservableToBS<T>(src: Observable<T>): Promise<BehaviorSubject<T>>{
    return new Promise((resolve) => {
        let bs: BehaviorSubject<T>;
        src.subscribe((next) => {
            if (bs === undefined){
                bs = new BehaviorSubject(next);
                resolve(bs);
            } else {
                bs.next(next);
            }
        })
    })
}

export function ConvertBS<S, D>(convert: IConvert<S, D>, src: BehaviorSubject<S>): BehaviorSubject<D>{
    const bs = new BehaviorSubject(convert(src.getValue()));
    src.pipe(map(convert)).subscribe(bs);
    return bs;
}

export interface IConvert<S, D>{
    (src: S): D;
}

export interface SecondObs<T, R> {
    source: Observable<T[]>;

    convert(source: T): Promise<R>;

    srcStringer(source: T): string;

    stringToSrc(str: string): T;
}
