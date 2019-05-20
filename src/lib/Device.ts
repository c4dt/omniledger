import { InstanceID } from "@dedis/cothority/byzcoin";

export class Device {
    constructor(public name: string, public darcID: InstanceID) {}
}
