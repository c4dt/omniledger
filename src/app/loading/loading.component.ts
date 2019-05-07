import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Log } from "@c4dt/cothority/log";
import { gData } from "../../lib/Data";

@Component({
  selector: "app-loading",
  styleUrls: ["./loading.component.css"],
  templateUrl: "./loading.component.html",
})
export class LoadingComponent implements OnInit {

  constructor(private router: Router) {
    Log.print("starting to load");
    gData.load().then(() => {
      Log.print("got user");
      return this.router.navigateByUrl("/user");
    }).catch((e) => {
      Log.catch(e, "couldnt get user");
      return this.router.navigateByUrl("/register");
    });
  }

  ngOnInit() {
    Log.llvl3("init loading");
  }
}
