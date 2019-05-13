import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Log } from "@c4dt/cothority/log";
import SkipchainRPC from "@c4dt/cothority/skipchain/skipchain-rpc";
import StatusRPC from "@c4dt/cothority/status/status-rpc";
import { Data, gData } from "../../../lib/Data";
import { Defaults } from "../../../lib/Defaults";

@Component({
  selector: "app-status",
  styleUrls: ["./status.component.css"],
  templateUrl: "./status.component.html",
})
export class StatusComponent implements OnInit {
  nodes = [];
  gData: Data;
  blockCount = -1;
  signID: string;

  constructor(private router: Router) {
    this.gData = gData;
    gData.contact.getDarcSignIdentity().then((dsi) => this.signID = dsi.toString());
  }

  async ngOnInit() {
    Log.lvl3("init status");
    await this.update();
  }

  async update() {
    this.nodes = [];
    const list = Defaults.Roster.list;
    const srpc = new StatusRPC(Defaults.Roster);
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
    await gData.bc.updateConfig();
    const skiprpc = new SkipchainRPC(gData.bc.getConfig().roster);
    const last = await skiprpc.getLatestBlock(gData.bc.genesisID);
    this.blockCount = last.index;
  }

  async deleteUser() {
    gData.delete();
    await gData.save();
    await this.router.navigateByUrl("/register");
  }
}
