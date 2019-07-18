import { InstanceID } from "~/lib/cothority/byzcoin";

export class Device {
    constructor(public name: string, public darcID: InstanceID) {}
}
