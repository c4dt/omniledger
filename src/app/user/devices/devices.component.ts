import { Component, OnInit } from "@angular/core";
import { Device } from "../../../lib/Device";

@Component({
    selector: "app-devices",
    styleUrls: ["./devices.component.css"],
    templateUrl: "./devices.component.html",
})
export class DevicesComponent implements OnInit {
    devices: Device[];

    constructor() {
    }

    ngOnInit() {
    }

    delete(device: Device) {}

    add() {}
}
