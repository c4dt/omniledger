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
  navLinks: any[];
  activeLinkIndex = -1;
  isLoaded = false;

  constructor(private router: Router) {
    Log.print("constructing user");
    this.navLinks = [
      {
        index: 0,
        label: "Yourself",
        link: "./yourself",
      }, {
        index: 1,
        label: "Contacts",
        link: "./contacts",
      }, {
        index: 2,
        label: "Secure",
        link: "./secure",
      }, {
        index: 3,
        label: "Status",
        link: "./status",
      },
    ];
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
    this.isLoaded = true;
    if (window.location.pathname === "/user") {
      this.router.navigateByUrl("/user/yourself");
    }
  }

  ngOnInit() {
    Log.print("init user");
    this.router.events.subscribe((res) => {
      this.activeLinkIndex = this.navLinks.indexOf(this.navLinks.find((tab) => tab.link === "." + this.router.url));
    });
  }

}
