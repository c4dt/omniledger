import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material";
import { Router } from "@angular/router";
import { Log } from "@c4dt/cothority/log";
import { Data, gData } from "../../lib/Data";
import { CalypsoUploadComponent } from "./secure/secure.component";

@Component({
  selector: "app-user",
  styleUrls: ["./user.component.css"],
  templateUrl: "./user.component.html",
})
export class UserComponent implements OnInit {
  isLoaded = false;

  constructor(private dialog: MatDialog,
              private router: Router) {
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
          this.router.navigateByUrl("/register");
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
            this.router.navigateByUrl("/register");
          }
        });
      });
    }
  }

  navigateToSubtab() {
    if (window.location.pathname === "/user") {
      this.router.navigateByUrl("/user/yourself");
    }
    this.isLoaded = true;
  }

  ngOnInit() {
    Log.llvl3("init user");
  }

}

@Component({
  selector: "app-retry-load",
  templateUrl: "retry-load.html",
})
export class RetryLoadComponent {
  constructor(
      public dialogRef: MatDialogRef<RetryLoadComponent>,
      @Inject(MAT_DIALOG_DATA) public data: string) {
  }
}
