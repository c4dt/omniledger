import {BehaviorSubject, Observable} from "rxjs";
import {filter, map, mergeMap, pairwise, startWith} from "rxjs/operators";

export interface SecondObs<S, D> {
    source: Observable<S[]>;

    srcStringer(source: S): string;

    convert(source: S): Promise<BehaviorSubject<D>>;
}

/**
 * Creates a second order observable from source S that emits an array of
 * BehaviorSubjecets<D>.
 *
 * It is my preciouss method which took me two days to write but turned out to be unusable :( Perhaps somebody else
 * will have the possibility to use it?
 *
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

