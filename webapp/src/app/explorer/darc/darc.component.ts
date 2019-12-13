import { Component, Input, OnChanges, OnInit } from "@angular/core";
import DarcInstance from "@dedis/cothority/byzcoin/contracts/darc-instance";

type ExprValue = [string, string];
type Rule = [string, ExprValue[]];

@Component({
  selector: "app-darc",
  templateUrl: "./darc.component.html",
})
export class DarcComponent implements OnChanges {

  rules: Rule[] | undefined;
  @Input() inst: DarcInstance;

  ngOnChanges() {
    this.rules = this.inst.darc.rules.list.map((r): Rule => {
      const evs = r.getExpr().toString()
          .replace(/ /g, "")
          .split(/[\|&\(\)]/)
          .map((ev): ExprValue => {
            const value = ev.split(":", 2);
            if (value.length !== 2) {
              throw new Error("got wrong value in darc rule");
            }
            return [value[0], value[1]];
          });
      return [r.action, evs];
    });
  }
}
