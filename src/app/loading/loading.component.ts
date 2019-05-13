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
    this.router.navigateByUrl("/user");
  }

  ngOnInit() {
    Log.llvl3("init loading");
  }
}
