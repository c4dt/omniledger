import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Log } from "@c4dt/cothority/log";
import { Data, gData } from "../../lib/Data";

@Component({
  selector: "app-user",
  styleUrls: ["./user.component.css"],
  templateUrl: "./user.component.html",
})
export class UserComponent implements OnInit {
  isLoaded = false;

  constructor(private router: Router) {
    Log.print("constructing user");
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
        Log.lvl1("error while loading - registering");
        this.router.navigateByUrl("/register");
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
    Log.lvl3("init user");
  }

}
