import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material";
import { Router } from "@angular/router";
import Log from "../../lib/cothority/log";
import { Data, gData } from "../../lib/Data";
import { Defaults } from "../../lib/Defaults";
import { BcviewerService } from "../bcviewer/bcviewer.component";
import { RetryLoadComponent } from "../user/user.component";

@Component({
  selector: "app-c4dt",
  styleUrls: ["./c4dt.component.css"],
  templateUrl: "./c4dt.component.html",
})
export class C4dtComponent implements OnInit {
  isLoaded = false;

  constructor(private dialog: MatDialog,
              private router: Router,
              private bcs: BcviewerService) {
    if (gData.contact && gData.contact.isRegistered() && gData.coinInstance) {
      Log.lvl1("user is registered");
      this.navigateToSubtab();
    } else {
      gData.load().then((gd: Data) => {
        Log.lvl1("loading user");
        if (gd.contact.isRegistered()) {
          Log.lvl1("user is registered after load");
          this.navigateToSubtab();
        } else {
          Log.lvl1("user is not registered after load");
          this.router.navigateByUrl(Defaults.PathNew);
        }
      }).catch((e) => {
        Log.lvl1("error while loading");
        const fileDialog = this.dialog.open(RetryLoadComponent, {
          width: "300px",
        });
        fileDialog.afterClosed().subscribe(async (result: boolean) => {
          if (result) {
            window.location.reload();
          } else {
            this.router.navigateByUrl(Defaults.PathNew);
          }
        });
      });
    }
  }

  navigateToSubtab() {
    if (window.location.pathname === "/c4dt") {
      this.router.navigateByUrl("/c4dt");
    }
    this.isLoaded = true;
    this.bcs.updateBlocks();
  }


  ngOnInit() {
  }

}
