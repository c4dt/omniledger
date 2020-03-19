import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import Log from "@dedis/cothority/log";
import StatusRPC from "@dedis/cothority/status/status-rpc";

import { hexBuffer } from "../../../lib/Ui";
import {UserService} from "src/app/user.service";
import {ByzCoinBuilder} from "dynacred2";

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
      private user: UserService,
      private builder: ByzCoinBuilder,
      ) {
    this.signID = this.user.identityDarcSigner.id.toString("hex");
    this.userID = hexBuffer(this.user.credStructBS.id);
    this.pubKey = hexBuffer(this.user.kpp.pub.marshalBinary());
  }

  async ngOnInit() {
    Log.lvl3("init status");
    await this.update();
  }

  async update() {
    this.nodes = [];
    const roster = this.builder.bc.getConfig().roster;
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
    await this.router.navigate(["/newuser"]);
  }
}
