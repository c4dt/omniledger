import { Component, OnInit } from "@angular/core";
import { gData } from "src/lib/dynacred/Data";

@Component({
  selector: "app-welcome",
  styleUrls: ["./welcome.component.css"],
  templateUrl: "./welcome.component.html",
})
export class WelcomeComponent implements OnInit {
    name: string;

  constructor() {
      this.name = gData.contact.alias;
  }

  ngOnInit() {
  }

}
