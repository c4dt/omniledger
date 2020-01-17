import { Component, Input } from "@angular/core";
import CoinInstance from "@c4dt/cothority/byzcoin/contracts/coin-instance";

@Component({
  selector: "app-coin",
  templateUrl: "./coin.component.html",
})
export class CoinComponent  {
  @Input() coin: CoinInstance;
}
