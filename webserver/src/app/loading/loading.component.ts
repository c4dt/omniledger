import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import Log from "src/lib/cothority/log";
import { Defaults } from "../../lib/Defaults";

@Component({
  selector: "app-loading",
  styleUrls: ["./loading.component.css"],
  templateUrl: "./loading.component.html",
})
export class LoadingComponent implements OnInit {

  constructor(private router: Router) {
    this.router.navigateByUrl(Defaults.PathUser);
  }

  ngOnInit() {
    Log.llvl3("init loading");
  }
}
