import {UserLocation} from './src/personhood/personhood-rpc';

export class SocialNode {
    constructor(public users: UserLocation[]) {
    }

    static fromObject(o: any): SocialNode {
        return new SocialNode(o.users.map(u => UserLocation.fromObject(u)));
    }

    toObject(): any {
        return {
            users: this.users.map(u => u.toObject())
        };
    }
}
