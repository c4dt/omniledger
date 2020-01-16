export interface INetObserver {
    something(): void;
}

export class Network {
    constructor(public instances: INetObserver) {

    }
}
