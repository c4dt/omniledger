import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import Log from "@dedis/cothority/log";
import StatusRPC from "@dedis/cothority/status/status-rpc";

import { Data } from "@c4dt/dynacred";

import { hexBuffer } from "../../../lib/Ui";
import { UserData } from "../../user-data.service";

@Component({
  selector: "app-status",
  templateUrl: "./status.component.html",
})
export class StatusComponent implements OnInit {
  nodes = [];
  signID: string;
  userID: string;
  pubKey: string;

  constructor(
      private router: Router,
      private uData: UserData,
      ) {
    this.uData.contact.getDarcSignIdentity().then((dsi) => this.signID = hexBuffer(dsi.id));
    this.userID = hexBuffer(this.uData.contact.credentialIID);
    this.pubKey = hexBuffer(this.uData.keyIdentity._public.toBuffer());
  }

  async ngOnInit() {
    Log.lvl3("init status");
    await this.update();
  }

  async update() {
    this.nodes = [];
    const roster = this.uData.bc.getConfig().roster;
    const list = roster.list;
    const srpc = new StatusRPC(roster);
    for (let i = 0; i < list.length; i++) {
      let node = list[i].description;
      try {
        const s = await srpc.getStatus(i);
        node += ": OK - Port:" + JSON.stringify(s.status.Generic.field.Port);
      } catch (e) {
        node += ": Failed";
      }
      this.nodes.push(node);
    }
    this.nodes.sort();
  }

  async deleteUser() {
    const d = new Data(this.uData.bc);
    await d.save();
    await this.router.navigate(["/newuser"]);
  }
}
