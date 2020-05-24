import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

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
        });
    });
}

export function ConvertBS<S, D>(src: BehaviorSubject<S>, convert: IConvert<S, D>): BehaviorSubject<D> {
    const bs = new BehaviorSubject(convert(src.getValue()));
    src.pipe(map(convert)).subscribe(bs);
    return bs;
}

export type IConvert<S, D> = (src: S) => D;
