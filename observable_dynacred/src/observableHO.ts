import {BehaviorSubject, Observable} from "rxjs";
import {map, pairwise} from "rxjs/operators";
import {mergeMap} from "rxjs/internal/operators/mergeMap";
import {startWith} from "rxjs/internal/operators/startWith";
import {filter} from "rxjs/internal/operators/filter";

export interface SecondObs<S, D> {
    source: Observable<S[]>;

    srcStringer(source: S): string;

    convert(source: S): Promise<BehaviorSubject<D>>;
}

/**
 * Creates a second order observable from source S that emits an array of
 * BehaviorSubjecets<D>
 * @param sob
 * @constructor
 */
export function ObservableHO<S extends Observable<Q>, Q, D>(sob: SecondObs<S, D>)
    : Observable<BehaviorSubject<D>[]> {

    const bssCache = new Map<string, BehaviorSubject<D>>();
    return sob.source.pipe(
        map((rs) => new Map(rs.map(r => [sob.srcStringer(r), r]))),
        startWith(new Map<string, S>()),
        pairwise(),
        map((pair) => {
            const [prev, curr] = pair;
            [...prev.keys()].filter(k => !curr.has(k))
                .forEach((k) => {
                    const bs = bssCache.get(k);
                    if (bs !== undefined) {
                        bs.complete();
                        bssCache.delete(k);
                    }
                });
            return [...curr.keys()].filter(k => !prev.has(k))
                .map(k => [k, curr.get(k)]);
        })
    ).pipe(
        filter(ts => ts.length > 0),
        mergeMap(async (ts: [string, S][]) => {
            return {
                str: ts.map(t => t[0]),
                dest: await Promise.all(ts.map(t => sob.convert(t[1]))),
            }
        }),
        map((rs) => {
            rs.str.forEach((str, i) => {
                bssCache.set(str, rs.dest[i]);
            });
            return rs.dest;
        })
    );
}

export async function ObservableToBS<T>(src: Observable<T>): Promise<BehaviorSubject<T>> {
    return new Promise((resolve) => {
        let bs: BehaviorSubject<T>;
        src.subscribe((next) => {
            if (bs === undefined) {
                bs = new BehaviorSubject(next);
                resolve(bs);
            } else {
                bs.next(next);
            }
        })
    })
}

export function ConvertBS<S, D>(src: BehaviorSubject<S>, convert: IConvert<S, D>): BehaviorSubject<D> {
    const bs = new BehaviorSubject(convert(src.getValue()));
    src.pipe(map(convert)).subscribe(bs);
    return bs;
}

export interface IConvert<S, D> {
    (src: S): D;
}

