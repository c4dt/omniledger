"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../protobuf");
/**
 * A rule will give who is allowed to use a given action
 */
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule(props) {
        var _this = _super.call(this, props) || this;
        _this.expr = Buffer.from(_this.expr || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Rule.register = function () {
        protobuf_1.registerMessage("Rule", Rule);
    };
    /**
     * Creates a rule given an action and an expression.
     *
     * @param action
     * @param expr
     */
    Rule.fromActionExpr = function (action, expr) {
        var r = new Rule({ action: action });
        r.append(expr.toString(), null);
        return r;
    };
    /**
     * Get a deep clone of the rule
     * @returns the new rule
     */
    Rule.prototype.clone = function () {
        return Rule.fromActionExpr(this.action, this.expr);
    };
    /**
     * Appends an identity given as a string to the expression and returns a copy of the
     * new expression.
     *
     * @param identity the identity to add, given as a string
     * @param op the operator to apply to the expression
     */
    Rule.prototype.append = function (identity, op) {
        if (this.expr.length > 0) {
            this.expr = Buffer.from(this.expr.toString() + " " + op + " " + identity);
        }
        else {
            this.expr = Buffer.from(identity);
        }
        return Buffer.from(this.expr);
    };
    /**
     * Searches for the given identity and removes it from the expression. Currently only
     * expressions containing Rule.OR are supported. It returns a copy of the new expression.
     *
     * @param identity the string representation of the identity
     */
    Rule.prototype.remove = function (identity) {
        var expr = this.expr.toString();
        if (expr.match(/(\(|\)|\&)/)) {
            throw new Error("don't know how to remove identity from expression with () or Rule.AND");
        }
        var matchReg = new RegExp("\\b" + identity + "\\b");
        if (!expr.match(matchReg)) {
            throw new Error("this identity is not part of the rule");
        }
        expr = expr.replace(matchReg, "");
        expr = expr.replace(/\|\s*\|/, "|");
        expr = expr.replace(/\s*\|\s*$/, "");
        expr = expr.replace(/^\s*\|\s*/, "");
        this.expr = Buffer.from(expr);
        return Buffer.from(this.expr);
    };
    /**
     * Returns the identities in the expression, in the case it is a single identity,
     * or if the identities are ORed together. If there are brakcets '()' or AND in the
     * expression, it will throw an error.
     */
    Rule.prototype.getIdentities = function () {
        if (this.expr.toString().match(/\(&/)) {
            throw new Error('Don\'t know what to do with "(" or "&" in expression');
        }
        return this.expr.toString().split("|").map(function (e) { return e.trim(); });
    };
    /**
     * Returns a copy of the expression.
     */
    Rule.prototype.getExpr = function () {
        return Buffer.from(this.expr);
    };
    /**
     * Get a string representation of the rule
     * @returns the string representation
     */
    Rule.prototype.toString = function () {
        return this.action + " - " + this.expr.toString();
    };
    Rule.OR = "|";
    Rule.AND = "&";
    return Rule;
}(light_1.Message));
exports.Rule = Rule;
/**
 * Wrapper around a list of rules that provides helpers to manage
 * the rules
 */
var Rules = /** @class */ (function (_super) {
    __extends(Rules, _super);
    function Rules(properties) {
        var _this = _super.call(this, properties) || this;
        if (!properties || !_this.list) {
            _this.list = [];
        }
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Rules.register = function () {
        protobuf_1.registerMessage("Rules", Rules, Rule);
    };
    /**
     * Create or update a rule with the given identity
     * @param action    the name of the rule
     * @param identity  the identity to append
     * @param op        the operator to use if the rule exists
     */
    Rules.prototype.appendToRule = function (action, identity, op) {
        var idx = this.list.findIndex(function (r) { return r.action === action; });
        if (idx >= 0) {
            this.list[idx].append(identity.toString(), op);
        }
        else {
            this.list.push(Rule.fromActionExpr(action, Buffer.from(identity.toString())));
        }
    };
    /**
     * Sets a rule to correspond to the given identity. If the rule already exists, it will be
     * replaced.
     * @param action    the name of the rule
     * @param identity  the identity to append
     */
    Rules.prototype.setRule = function (action, identity) {
        this.setRuleExp(action, Buffer.from(identity.toString()));
    };
    /**
     * Sets the expression of a rule. If the rule already exists, it will be replaced. If the
     * rule does not exist yet, it will be appended to the list of rules.
     * @param action the name of the rule
     * @param expression the expression to put in the rule
     */
    Rules.prototype.setRuleExp = function (action, expression) {
        var idx = this.list.findIndex(function (r) { return r.action === action; });
        var nr = Rule.fromActionExpr(action, expression);
        if (idx >= 0) {
            this.list[idx] = nr;
        }
        else {
            this.list.push(nr);
        }
    };
    /**
     * Removes a given rule from the list.
     *
     * @param action the action that will be removed.
     */
    Rules.prototype.removeRule = function (action) {
        var pos = this.list.findIndex(function (rule) { return rule.action === action; });
        if (pos >= 0) {
            this.list.splice(pos);
        }
    };
    /**
     * getRule returns the rule with the given action
     *
     * @param action to search in the rules for.
     */
    Rules.prototype.getRule = function (action) {
        return this.list.find(function (r) { return r.action === action; });
    };
    /**
     * Get a deep copy of the list of rules
     * @returns the clone
     */
    Rules.prototype.clone = function () {
        return new Rules({ list: this.list.map(function (r) { return r.clone(); }) });
    };
    /**
     * Get a string representation of the rules
     * @returns a string representation
     */
    Rules.prototype.toString = function () {
        return this.list.map(function (l) { return l.toString(); }).join("\n");
    };
    return Rules;
}(light_1.Message));
exports.default = Rules;
Rule.register();
Rules.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJydWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBdUQ7QUFHdkQsd0NBQTREO0FBRzVEOztHQUVHO0FBQ0g7SUFBMEIsd0JBQWE7SUEyQm5DLGNBQVksS0FBd0I7UUFBcEMsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FHZjtRQURHLEtBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsSUFBSSxJQUFJLHVCQUFZLENBQUMsQ0FBQzs7SUFDdkQsQ0FBQztJQTFCRDs7T0FFRztJQUNJLGFBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNJLG1CQUFjLEdBQXJCLFVBQXNCLE1BQWMsRUFBRSxJQUFZO1FBQzlDLElBQU0sQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUMsTUFBTSxRQUFBLEVBQUMsQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQVdEOzs7T0FHRztJQUNILG9CQUFLLEdBQUw7UUFDSSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILHFCQUFNLEdBQU4sVUFBTyxRQUFnQixFQUFFLEVBQVU7UUFDL0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQUksRUFBRSxTQUFJLFFBQVUsQ0FBQyxDQUFDO1NBQ3hFO2FBQU07WUFDSCxJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDckM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILHFCQUFNLEdBQU4sVUFBTyxRQUFnQjtRQUNuQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLHVFQUF1RSxDQUFDLENBQUM7U0FDNUY7UUFDRCxJQUFNLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFNLFFBQVEsUUFBSyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDdkIsTUFBTSxJQUFJLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1NBQzVEO1FBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDckMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsNEJBQWEsR0FBYjtRQUNJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO1NBQzNFO1FBQ0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQVIsQ0FBUSxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsc0JBQU8sR0FBUDtRQUNJLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILHVCQUFRLEdBQVI7UUFDSSxPQUFPLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDdEQsQ0FBQztJQXZHZSxPQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ1QsUUFBRyxHQUFHLEdBQUcsQ0FBQztJQXVHOUIsV0FBQztDQUFBLEFBMUdELENBQTBCLGVBQU8sR0EwR2hDO0FBMUdZLG9CQUFJO0FBNEdqQjs7O0dBR0c7QUFDSDtJQUFtQyx5QkFBYztJQVc3QyxlQUFZLFVBQThCO1FBQTFDLFlBQ0ksa0JBQU0sVUFBVSxDQUFDLFNBS3BCO1FBSEcsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUksQ0FBQyxJQUFJLEVBQUU7WUFDM0IsS0FBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7U0FDbEI7O0lBQ0wsQ0FBQztJQWZEOztPQUVHO0lBQ0ksY0FBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFZRDs7Ozs7T0FLRztJQUNILDRCQUFZLEdBQVosVUFBYSxNQUFjLEVBQUUsUUFBbUIsRUFBRSxFQUFVO1FBQ3hELElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQW5CLENBQW1CLENBQUMsQ0FBQztRQUU1RCxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUU7WUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDbEQ7YUFBTTtZQUNILElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pGO0lBQ0wsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsdUJBQU8sR0FBUCxVQUFRLE1BQWMsRUFBRSxRQUFtQjtRQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsMEJBQVUsR0FBVixVQUFXLE1BQWMsRUFBRSxVQUFrQjtRQUN6QyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUFuQixDQUFtQixDQUFDLENBQUM7UUFFNUQsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbkQsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFO1lBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDdkI7YUFBTTtZQUNILElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ3RCO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCwwQkFBVSxHQUFWLFVBQVcsTUFBYztRQUNyQixJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFDLElBQUksSUFBSyxPQUFBLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxFQUF0QixDQUFzQixDQUFDLENBQUM7UUFDbEUsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFO1lBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILHVCQUFPLEdBQVAsVUFBUSxNQUFjO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBbkIsQ0FBbUIsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRDs7O09BR0c7SUFDSCxxQkFBSyxHQUFMO1FBQ0ksT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFBLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBVCxDQUFTLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVEOzs7T0FHRztJQUNILHdCQUFRLEdBQVI7UUFDSSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBQyxJQUFLLE9BQUEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFaLENBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBQ0wsWUFBQztBQUFELENBQUMsQUFsR0QsQ0FBbUMsZUFBTyxHQWtHekM7O0FBRUQsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2hCLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9ieXpjb2luXCI7XG5pbXBvcnQgTG9nIGZyb20gXCIuLi9sb2dcIjtcbmltcG9ydCB7IEVNUFRZX0JVRkZFUiwgcmVnaXN0ZXJNZXNzYWdlIH0gZnJvbSBcIi4uL3Byb3RvYnVmXCI7XG5pbXBvcnQgeyBJSWRlbnRpdHkgfSBmcm9tIFwiLi9pZGVudGl0eS13cmFwcGVyXCI7XG5cbi8qKlxuICogQSBydWxlIHdpbGwgZ2l2ZSB3aG8gaXMgYWxsb3dlZCB0byB1c2UgYSBnaXZlbiBhY3Rpb25cbiAqL1xuZXhwb3J0IGNsYXNzIFJ1bGUgZXh0ZW5kcyBNZXNzYWdlPFJ1bGU+IHtcblxuICAgIHN0YXRpYyByZWFkb25seSBPUiA9IFwifFwiO1xuICAgIHN0YXRpYyByZWFkb25seSBBTkQgPSBcIiZcIjtcblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiUnVsZVwiLCBSdWxlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcnVsZSBnaXZlbiBhbiBhY3Rpb24gYW5kIGFuIGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gYWN0aW9uXG4gICAgICogQHBhcmFtIGV4cHJcbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbUFjdGlvbkV4cHIoYWN0aW9uOiBzdHJpbmcsIGV4cHI6IEJ1ZmZlcikge1xuICAgICAgICBjb25zdCByID0gbmV3IFJ1bGUoe2FjdGlvbn0pO1xuICAgICAgICByLmFwcGVuZChleHByLnRvU3RyaW5nKCksIG51bGwpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG5cbiAgICByZWFkb25seSBhY3Rpb246IHN0cmluZztcbiAgICBwcml2YXRlIGV4cHI6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxSdWxlPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5leHByID0gQnVmZmVyLmZyb20odGhpcy5leHByIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgZGVlcCBjbG9uZSBvZiB0aGUgcnVsZVxuICAgICAqIEByZXR1cm5zIHRoZSBuZXcgcnVsZVxuICAgICAqL1xuICAgIGNsb25lKCk6IFJ1bGUge1xuICAgICAgICByZXR1cm4gUnVsZS5mcm9tQWN0aW9uRXhwcih0aGlzLmFjdGlvbiwgdGhpcy5leHByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBcHBlbmRzIGFuIGlkZW50aXR5IGdpdmVuIGFzIGEgc3RyaW5nIHRvIHRoZSBleHByZXNzaW9uIGFuZCByZXR1cm5zIGEgY29weSBvZiB0aGVcbiAgICAgKiBuZXcgZXhwcmVzc2lvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBpZGVudGl0eSB0aGUgaWRlbnRpdHkgdG8gYWRkLCBnaXZlbiBhcyBhIHN0cmluZ1xuICAgICAqIEBwYXJhbSBvcCB0aGUgb3BlcmF0b3IgdG8gYXBwbHkgdG8gdGhlIGV4cHJlc3Npb25cbiAgICAgKi9cbiAgICBhcHBlbmQoaWRlbnRpdHk6IHN0cmluZywgb3A6IHN0cmluZyk6IEJ1ZmZlciB7XG4gICAgICAgIGlmICh0aGlzLmV4cHIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy5leHByID0gQnVmZmVyLmZyb20oYCR7dGhpcy5leHByLnRvU3RyaW5nKCl9ICR7b3B9ICR7aWRlbnRpdHl9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmV4cHIgPSBCdWZmZXIuZnJvbShpZGVudGl0eSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHRoaXMuZXhwcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VhcmNoZXMgZm9yIHRoZSBnaXZlbiBpZGVudGl0eSBhbmQgcmVtb3ZlcyBpdCBmcm9tIHRoZSBleHByZXNzaW9uLiBDdXJyZW50bHkgb25seVxuICAgICAqIGV4cHJlc3Npb25zIGNvbnRhaW5pbmcgUnVsZS5PUiBhcmUgc3VwcG9ydGVkLiBJdCByZXR1cm5zIGEgY29weSBvZiB0aGUgbmV3IGV4cHJlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gaWRlbnRpdHkgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgaWRlbnRpdHlcbiAgICAgKi9cbiAgICByZW1vdmUoaWRlbnRpdHk6IHN0cmluZyk6IEJ1ZmZlciB7XG4gICAgICAgIGxldCBleHByID0gdGhpcy5leHByLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmIChleHByLm1hdGNoKC8oXFwofFxcKXxcXCYpLykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImRvbid0IGtub3cgaG93IHRvIHJlbW92ZSBpZGVudGl0eSBmcm9tIGV4cHJlc3Npb24gd2l0aCAoKSBvciBSdWxlLkFORFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtYXRjaFJlZyA9IG5ldyBSZWdFeHAoYFxcXFxiJHtpZGVudGl0eX1cXFxcYmApO1xuICAgICAgICBpZiAoIWV4cHIubWF0Y2gobWF0Y2hSZWcpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0aGlzIGlkZW50aXR5IGlzIG5vdCBwYXJ0IG9mIHRoZSBydWxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGV4cHIgPSBleHByLnJlcGxhY2UobWF0Y2hSZWcsIFwiXCIpO1xuICAgICAgICBleHByID0gZXhwci5yZXBsYWNlKC9cXHxcXHMqXFx8LywgXCJ8XCIpO1xuICAgICAgICBleHByID0gZXhwci5yZXBsYWNlKC9cXHMqXFx8XFxzKiQvLCBcIlwiKTtcbiAgICAgICAgZXhwciA9IGV4cHIucmVwbGFjZSgvXlxccypcXHxcXHMqLywgXCJcIik7XG4gICAgICAgIHRoaXMuZXhwciA9IEJ1ZmZlci5mcm9tKGV4cHIpO1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20odGhpcy5leHByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBpZGVudGl0aWVzIGluIHRoZSBleHByZXNzaW9uLCBpbiB0aGUgY2FzZSBpdCBpcyBhIHNpbmdsZSBpZGVudGl0eSxcbiAgICAgKiBvciBpZiB0aGUgaWRlbnRpdGllcyBhcmUgT1JlZCB0b2dldGhlci4gSWYgdGhlcmUgYXJlIGJyYWtjZXRzICcoKScgb3IgQU5EIGluIHRoZVxuICAgICAqIGV4cHJlc3Npb24sIGl0IHdpbGwgdGhyb3cgYW4gZXJyb3IuXG4gICAgICovXG4gICAgZ2V0SWRlbnRpdGllcygpOiBzdHJpbmdbXSB7XG4gICAgICAgIGlmICh0aGlzLmV4cHIudG9TdHJpbmcoKS5tYXRjaCgvXFwoJi8pKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvblxcJ3Qga25vdyB3aGF0IHRvIGRvIHdpdGggXCIoXCIgb3IgXCImXCIgaW4gZXhwcmVzc2lvbicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmV4cHIudG9TdHJpbmcoKS5zcGxpdChcInxcIikubWFwKChlKSA9PiBlLnRyaW0oKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIGV4cHJlc3Npb24uXG4gICAgICovXG4gICAgZ2V0RXhwcigpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gQnVmZmVyLmZyb20odGhpcy5leHByKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIHJ1bGVcbiAgICAgKiBAcmV0dXJucyB0aGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uXG4gICAgICovXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aW9uICsgXCIgLSBcIiArIHRoaXMuZXhwci50b1N0cmluZygpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBXcmFwcGVyIGFyb3VuZCBhIGxpc3Qgb2YgcnVsZXMgdGhhdCBwcm92aWRlcyBoZWxwZXJzIHRvIG1hbmFnZVxuICogdGhlIHJ1bGVzXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJ1bGVzIGV4dGVuZHMgTWVzc2FnZTxSdWxlcz4ge1xuXG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJSdWxlc1wiLCBSdWxlcywgUnVsZSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgbGlzdDogUnVsZVtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcGVydGllcz86IFByb3BlcnRpZXM8UnVsZXM+KSB7XG4gICAgICAgIHN1cGVyKHByb3BlcnRpZXMpO1xuXG4gICAgICAgIGlmICghcHJvcGVydGllcyB8fCAhdGhpcy5saXN0KSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBvciB1cGRhdGUgYSBydWxlIHdpdGggdGhlIGdpdmVuIGlkZW50aXR5XG4gICAgICogQHBhcmFtIGFjdGlvbiAgICB0aGUgbmFtZSBvZiB0aGUgcnVsZVxuICAgICAqIEBwYXJhbSBpZGVudGl0eSAgdGhlIGlkZW50aXR5IHRvIGFwcGVuZFxuICAgICAqIEBwYXJhbSBvcCAgICAgICAgdGhlIG9wZXJhdG9yIHRvIHVzZSBpZiB0aGUgcnVsZSBleGlzdHNcbiAgICAgKi9cbiAgICBhcHBlbmRUb1J1bGUoYWN0aW9uOiBzdHJpbmcsIGlkZW50aXR5OiBJSWRlbnRpdHksIG9wOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5saXN0LmZpbmRJbmRleCgocikgPT4gci5hY3Rpb24gPT09IGFjdGlvbik7XG5cbiAgICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RbaWR4XS5hcHBlbmQoaWRlbnRpdHkudG9TdHJpbmcoKSwgb3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5saXN0LnB1c2goUnVsZS5mcm9tQWN0aW9uRXhwcihhY3Rpb24sIEJ1ZmZlci5mcm9tKGlkZW50aXR5LnRvU3RyaW5nKCkpKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgcnVsZSB0byBjb3JyZXNwb25kIHRvIHRoZSBnaXZlbiBpZGVudGl0eS4gSWYgdGhlIHJ1bGUgYWxyZWFkeSBleGlzdHMsIGl0IHdpbGwgYmVcbiAgICAgKiByZXBsYWNlZC5cbiAgICAgKiBAcGFyYW0gYWN0aW9uICAgIHRoZSBuYW1lIG9mIHRoZSBydWxlXG4gICAgICogQHBhcmFtIGlkZW50aXR5ICB0aGUgaWRlbnRpdHkgdG8gYXBwZW5kXG4gICAgICovXG4gICAgc2V0UnVsZShhY3Rpb246IHN0cmluZywgaWRlbnRpdHk6IElJZGVudGl0eSk6IHZvaWQge1xuICAgICAgICB0aGlzLnNldFJ1bGVFeHAoYWN0aW9uLCBCdWZmZXIuZnJvbShpZGVudGl0eS50b1N0cmluZygpKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgZXhwcmVzc2lvbiBvZiBhIHJ1bGUuIElmIHRoZSBydWxlIGFscmVhZHkgZXhpc3RzLCBpdCB3aWxsIGJlIHJlcGxhY2VkLiBJZiB0aGVcbiAgICAgKiBydWxlIGRvZXMgbm90IGV4aXN0IHlldCwgaXQgd2lsbCBiZSBhcHBlbmRlZCB0byB0aGUgbGlzdCBvZiBydWxlcy5cbiAgICAgKiBAcGFyYW0gYWN0aW9uIHRoZSBuYW1lIG9mIHRoZSBydWxlXG4gICAgICogQHBhcmFtIGV4cHJlc3Npb24gdGhlIGV4cHJlc3Npb24gdG8gcHV0IGluIHRoZSBydWxlXG4gICAgICovXG4gICAgc2V0UnVsZUV4cChhY3Rpb246IHN0cmluZywgZXhwcmVzc2lvbjogQnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMubGlzdC5maW5kSW5kZXgoKHIpID0+IHIuYWN0aW9uID09PSBhY3Rpb24pO1xuXG4gICAgICAgIGNvbnN0IG5yID0gUnVsZS5mcm9tQWN0aW9uRXhwcihhY3Rpb24sIGV4cHJlc3Npb24pO1xuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFtpZHhdID0gbnI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxpc3QucHVzaChucik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGEgZ2l2ZW4gcnVsZSBmcm9tIHRoZSBsaXN0LlxuICAgICAqXG4gICAgICogQHBhcmFtIGFjdGlvbiB0aGUgYWN0aW9uIHRoYXQgd2lsbCBiZSByZW1vdmVkLlxuICAgICAqL1xuICAgIHJlbW92ZVJ1bGUoYWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgcG9zID0gdGhpcy5saXN0LmZpbmRJbmRleCgocnVsZSkgPT4gcnVsZS5hY3Rpb24gPT09IGFjdGlvbik7XG4gICAgICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5saXN0LnNwbGljZShwb3MpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogZ2V0UnVsZSByZXR1cm5zIHRoZSBydWxlIHdpdGggdGhlIGdpdmVuIGFjdGlvblxuICAgICAqXG4gICAgICogQHBhcmFtIGFjdGlvbiB0byBzZWFyY2ggaW4gdGhlIHJ1bGVzIGZvci5cbiAgICAgKi9cbiAgICBnZXRSdWxlKGFjdGlvbjogc3RyaW5nKTogUnVsZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3QuZmluZCgocikgPT4gci5hY3Rpb24gPT09IGFjdGlvbik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgZGVlcCBjb3B5IG9mIHRoZSBsaXN0IG9mIHJ1bGVzXG4gICAgICogQHJldHVybnMgdGhlIGNsb25lXG4gICAgICovXG4gICAgY2xvbmUoKTogUnVsZXMge1xuICAgICAgICByZXR1cm4gbmV3IFJ1bGVzKHtsaXN0OiB0aGlzLmxpc3QubWFwKChyKSA9PiByLmNsb25lKCkpfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBydWxlc1xuICAgICAqIEByZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uXG4gICAgICovXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdC5tYXAoKGwpID0+IGwudG9TdHJpbmcoKSkuam9pbihcIlxcblwiKTtcbiAgICB9XG59XG5cblJ1bGUucmVnaXN0ZXIoKTtcblJ1bGVzLnJlZ2lzdGVyKCk7XG4iXX0=