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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var kyber_1 = require("@dedis/kyber");
var moment_1 = __importDefault(require("moment"));
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../protobuf");
var PopPartyStruct = /** @class */ (function (_super) {
    __extends(PopPartyStruct, _super);
    function PopPartyStruct(props) {
        var _this = _super.call(this, props) || this;
        _this.finalizations = _this.finalizations || [];
        _this.miners = _this.miners || [];
        _this.previous = Buffer.from(_this.previous || protobuf_1.EMPTY_BUFFER);
        _this.next = Buffer.from(_this.next || protobuf_1.EMPTY_BUFFER);
        /* Protobuf aliases */
        Object.defineProperty(_this, "miningreward", {
            get: function () {
                return this.miningReward;
            },
            set: function (value) {
                this.miningReward = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    PopPartyStruct.register = function () {
        protobuf_1.registerMessage("personhood.PopPartyStruct", PopPartyStruct, PopDesc, Attendees, LRSTag);
    };
    /**
     * Replace the current attendees by the new ones and sort them, so that different
     * organizers scanning in a different order get the same result.
     *
     * @param publics Public keys of the new attendees
     */
    PopPartyStruct.prototype.updateAttendes = function (publics) {
        var _a;
        var keys = publics.map(function (p) { return p.toProto(); });
        keys.sort(function (a, b) { return Buffer.compare(a, b); });
        (_a = this.attendees.keys).splice.apply(_a, [0, this.attendees.keys.length].concat(keys));
    };
    return PopPartyStruct;
}(light_1.Message));
exports.PopPartyStruct = PopPartyStruct;
var FinalStatement = /** @class */ (function (_super) {
    __extends(FinalStatement, _super);
    function FinalStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    FinalStatement.register = function () {
        protobuf_1.registerMessage("personhood.FinalStatement", FinalStatement, PopDesc, Attendees);
    };
    return FinalStatement;
}(light_1.Message));
exports.FinalStatement = FinalStatement;
var PopDesc = /** @class */ (function (_super) {
    __extends(PopDesc, _super);
    function PopDesc(props) {
        return _super.call(this, props) || this;
    }
    Object.defineProperty(PopDesc.prototype, "timestamp", {
        /**
         * Getter for the timestamp
         * @returns the timestamp as a number
         */
        get: function () {
            return this.datetime.toNumber();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PopDesc.prototype, "dateString", {
        /**
         * Format the timestamp into a human readable string
         * @returns a string of the time
         */
        get: function () {
            return new Date(this.timestamp).toString().replace(/ GMT.*/, "");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PopDesc.prototype, "uniqueName", {
        /**
         * Format the timestamp to a unique string
         * @returns the string
         */
        get: function () {
            var d = new Date(this.timestamp);
            return moment_1.default(d).format("YY-MM-DD HH:mm");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    PopDesc.register = function () {
        protobuf_1.registerMessage("personhood.PopDesc", PopDesc);
    };
    /**
     * Helper to encode the statement using protobuf
     * @returns the bytes
     */
    PopDesc.prototype.toBytes = function () {
        return Buffer.from(PopDesc.encode(this).finish());
    };
    return PopDesc;
}(light_1.Message));
exports.PopDesc = PopDesc;
var Attendees = /** @class */ (function (_super) {
    __extends(Attendees, _super);
    function Attendees(properties) {
        var _this = _super.call(this, properties) || this;
        _this.keys = _this.keys.slice() || [];
        return _this;
    }
    Object.defineProperty(Attendees.prototype, "publics", {
        /**
         * Get the keys as kyber points
         * @returns a list of points
         */
        get: function () {
            return this.keys.map(function (k) { return kyber_1.PointFactory.fromProto(k); });
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    Attendees.register = function () {
        protobuf_1.registerMessage("personhood.Attendees", Attendees);
    };
    /**
     * Helper to encode the attendees using protobuf
     * @returns the bytes
     */
    Attendees.prototype.toBytes = function () {
        return Buffer.from(Attendees.encode(this).finish());
    };
    return Attendees;
}(light_1.Message));
exports.Attendees = Attendees;
var LRSTag = /** @class */ (function (_super) {
    __extends(LRSTag, _super);
    function LRSTag(props) {
        var _this = _super.call(this, props) || this;
        _this.tag = Buffer.from(_this.tag || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    LRSTag.register = function () {
        protobuf_1.registerMessage("personhood.LRSTag", LRSTag);
    };
    return LRSTag;
}(light_1.Message));
exports.LRSTag = LRSTag;
PopPartyStruct.register();
FinalStatement.register();
PopDesc.register();
Attendees.register();
LRSTag.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm90by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQ0FBbUQ7QUFFbkQsa0RBQTRCO0FBQzVCLDBDQUF1RDtBQUN2RCx3Q0FBNEQ7QUFFNUQ7SUFBb0Msa0NBQXVCO0lBa0J2RCx3QkFBWSxLQUFrQztRQUE5QyxZQUNJLGtCQUFNLEtBQUssQ0FBQyxTQWlCZjtRQWZHLEtBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSSxDQUFDLGFBQWEsSUFBSSxFQUFFLENBQUM7UUFDOUMsS0FBSSxDQUFDLE1BQU0sR0FBRyxLQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUNoQyxLQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLFFBQVEsSUFBSSx1QkFBWSxDQUFDLENBQUM7UUFDM0QsS0FBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxJQUFJLElBQUksdUJBQVksQ0FBQyxDQUFDO1FBRW5ELHNCQUFzQjtRQUV0QixNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUksRUFBRSxjQUFjLEVBQUU7WUFDeEMsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztZQUM3QixDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQVc7Z0JBQ1gsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDOUIsQ0FBQztTQUNKLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBbkNEOztPQUVHO0lBQ0ksdUJBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsMkJBQTJCLEVBQUUsY0FBYyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDN0YsQ0FBQztJQWdDRDs7Ozs7T0FLRztJQUNILHVDQUFjLEdBQWQsVUFBZSxPQUFnQjs7UUFDM0IsSUFBTSxJQUFJLEdBQUcsT0FBTyxD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TUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUNMLGdCQUFDO0FBQUQsQ0FBQyxBQS9CRCxDQUErQixlQUFPLEdBK0JyQztBQS9CWSw4QkFBUztBQWlDdEI7SUFBNEIsMEJBQWU7SUFVdkMsZ0JBQVksS0FBMEI7UUFBdEMsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FHZjtRQURHLEtBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsR0FBRyxJQUFJLHVCQUFZLENBQUMsQ0FBQzs7SUFDckQsQ0FBQztJQWJEOztPQUVHO0lBQ0ksZUFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxtQkFBbUIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBU0wsYUFBQztBQUFELENBQUMsQUFmRCxDQUE0QixlQUFPLEdBZWxDO0FBZlksd0JBQU07QUFpQm5CLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUMxQixjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUIsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ25CLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNyQixNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQb2ludCwgUG9pbnRGYWN0b3J5IH0gZnJvbSBcIkBkZWRpcy9reWJlclwiO1xuaW1wb3J0IExvbmcgZnJvbSBcImxvbmdcIjtcbmltcG9ydCBNb21lbnQgZnJvbSBcIm1vbWVudFwiO1xuaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyBFTVBUWV9CVUZGRVIsIHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi9wcm90b2J1ZlwiO1xuXG5leHBvcnQgY2xhc3MgUG9wUGFydHlTdHJ1Y3QgZXh0ZW5kcyBNZXNzYWdlPFBvcFBhcnR5U3RydWN0PiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJwZXJzb25ob29kLlBvcFBhcnR5U3RydWN0XCIsIFBvcFBhcnR5U3RydWN0LCBQb3BEZXNjLCBBdHRlbmRlZXMsIExSU1RhZyk7XG4gICAgfVxuXG4gICAgc3RhdGU6IG51bWJlcjtcbiAgICByZWFkb25seSBvcmdhbml6ZXJzOiBudW1iZXI7XG4gICAgcmVhZG9ubHkgZmluYWxpemF0aW9uczogc3RyaW5nW107XG4gICAgcmVhZG9ubHkgZGVzY3JpcHRpb246IFBvcERlc2M7XG4gICAgcmVhZG9ubHkgYXR0ZW5kZWVzOiBBdHRlbmRlZXM7XG4gICAgcmVhZG9ubHkgbWluZXJzOiBMUlNUYWdbXTtcbiAgICByZWFkb25seSBtaW5pbmdSZXdhcmQ6IExvbmc7XG4gICAgcmVhZG9ubHkgcHJldmlvdXM6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBuZXh0OiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8UG9wUGFydHlTdHJ1Y3Q+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmZpbmFsaXphdGlvbnMgPSB0aGlzLmZpbmFsaXphdGlvbnMgfHwgW107XG4gICAgICAgIHRoaXMubWluZXJzID0gdGhpcy5taW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMucHJldmlvdXMgPSBCdWZmZXIuZnJvbSh0aGlzLnByZXZpb3VzIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgICAgIHRoaXMubmV4dCA9IEJ1ZmZlci5mcm9tKHRoaXMubmV4dCB8fCBFTVBUWV9CVUZGRVIpO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJtaW5pbmdyZXdhcmRcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IExvbmcge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1pbmluZ1Jld2FyZDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IExvbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1pbmluZ1Jld2FyZCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVwbGFjZSB0aGUgY3VycmVudCBhdHRlbmRlZXMgYnkgdGhlIG5ldyBvbmVzIGFuZCBzb3J0IHRoZW0sIHNvIHRoYXQgZGlmZmVyZW50XG4gICAgICogb3JnYW5pemVycyBzY2FubmluZyBpbiBhIGRpZmZlcmVudCBvcmRlciBnZXQgdGhlIHNhbWUgcmVzdWx0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHB1YmxpY3MgUHVibGljIGtleXMgb2YgdGhlIG5ldyBhdHRlbmRlZXNcbiAgICAgKi9cbiAgICB1cGRhdGVBdHRlbmRlcyhwdWJsaWNzOiBQb2ludFtdKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBwdWJsaWNzLm1hcCgocCkgPT4gcC50b1Byb3RvKCkpO1xuICAgICAgICBrZXlzLnNvcnQoKGEsIGIpID0+IEJ1ZmZlci5jb21wYXJlKGEsIGIpKTtcbiAgICAgICAgdGhpcy5hdHRlbmRlZXMua2V5cy5zcGxpY2UoMCwgdGhpcy5hdHRlbmRlZXMua2V5cy5sZW5ndGgsIC4uLmtleXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEZpbmFsU3RhdGVtZW50IGV4dGVuZHMgTWVzc2FnZTxGaW5hbFN0YXRlbWVudD4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwicGVyc29uaG9vZC5GaW5hbFN0YXRlbWVudFwiLCBGaW5hbFN0YXRlbWVudCwgUG9wRGVzYywgQXR0ZW5kZWVzKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBkZXNjOiBQb3BEZXNjO1xuICAgIHJlYWRvbmx5IGF0dGVuZGVlczogQXR0ZW5kZWVzO1xufVxuXG5leHBvcnQgY2xhc3MgUG9wRGVzYyBleHRlbmRzIE1lc3NhZ2U8UG9wRGVzYz4ge1xuXG4gICAgLyoqXG4gICAgICogR2V0dGVyIGZvciB0aGUgdGltZXN0YW1wXG4gICAgICogQHJldHVybnMgdGhlIHRpbWVzdGFtcCBhcyBhIG51bWJlclxuICAgICAqL1xuICAgIGdldCB0aW1lc3RhbXAoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0ZXRpbWUudG9OdW1iZXIoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGb3JtYXQgdGhlIHRpbWVzdGFtcCBpbnRvIGEgaHVtYW4gcmVhZGFibGUgc3RyaW5nXG4gICAgICogQHJldHVybnMgYSBzdHJpbmcgb2YgdGhlIHRpbWVcbiAgICAgKi9cbiAgICBnZXQgZGF0ZVN0cmluZygpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gbmV3IERhdGUodGhpcy50aW1lc3RhbXApLnRvU3RyaW5nKCkucmVwbGFjZSgvIEdNVC4qLywgXCJcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRm9ybWF0IHRoZSB0aW1lc3RhbXAgdG8gYSB1bmlxdWUgc3RyaW5nXG4gICAgICogQHJldHVybnMgdGhlIHN0cmluZ1xuICAgICAqL1xuICAgIGdldCB1bmlxdWVOYW1lKCk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh0aGlzLnRpbWVzdGFtcCk7XG4gICAgICAgIHJldHVybiBNb21lbnQoZCkuZm9ybWF0KFwiWVktTU0tREQgSEg6bW1cIik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwicGVyc29uaG9vZC5Qb3BEZXNjXCIsIFBvcERlc2MpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgICByZWFkb25seSBwdXJwb3NlOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgZGF0ZXRpbWU6IExvbmc7IC8vIGluIHNlY29uZHNcbiAgICByZWFkb25seSBsb2NhdGlvbjogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPFBvcERlc2M+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gZW5jb2RlIHRoZSBzdGF0ZW1lbnQgdXNpbmcgcHJvdG9idWZcbiAgICAgKiBAcmV0dXJucyB0aGUgYnl0ZXNcbiAgICAgKi9cbiAgICB0b0J5dGVzKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShQb3BEZXNjLmVuY29kZSh0aGlzKS5maW5pc2goKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXR0ZW5kZWVzIGV4dGVuZHMgTWVzc2FnZTxBdHRlbmRlZXM+IHtcblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUga2V5cyBhcyBreWJlciBwb2ludHNcbiAgICAgKiBAcmV0dXJucyBhIGxpc3Qgb2YgcG9pbnRzXG4gICAgICovXG4gICAgZ2V0IHB1YmxpY3MoKTogUG9pbnRbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLmtleXMubWFwKChrKSA9PiBQb2ludEZhY3RvcnkuZnJvbVByb3RvKGspKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJwZXJzb25ob29kLkF0dGVuZGVlc1wiLCBBdHRlbmRlZXMpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGtleXM6IEJ1ZmZlcltdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcGVydGllcz86IFByb3BlcnRpZXM8QXR0ZW5kZWVzPikge1xuICAgICAgICBzdXBlcihwcm9wZXJ0aWVzKTtcblxuICAgICAgICB0aGlzLmtleXMgPSB0aGlzLmtleXMuc2xpY2UoKSB8fCBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gZW5jb2RlIHRoZSBhdHRlbmRlZXMgdXNpbmcgcHJvdG9idWZcbiAgICAgKiBAcmV0dXJucyB0aGUgYnl0ZXNcbiAgICAgKi9cbiAgICB0b0J5dGVzKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShBdHRlbmRlZXMuZW5jb2RlKHRoaXMpLmZpbmlzaCgpKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBMUlNUYWcgZXh0ZW5kcyBNZXNzYWdlPExSU1RhZz4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwicGVyc29uaG9vZC5MUlNUYWdcIiwgTFJTVGFnKTtcbiAgICB9XG5cbiAgICByZWFkb25seSB0YWc6IEJ1ZmZlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxMUlNUYWc+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnRhZyA9IEJ1ZmZlci5mcm9tKHRoaXMudGFnIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgfVxufVxuXG5Qb3BQYXJ0eVN0cnVjdC5yZWdpc3RlcigpO1xuRmluYWxTdGF0ZW1lbnQucmVnaXN0ZXIoKTtcblBvcERlc2MucmVnaXN0ZXIoKTtcbkF0dGVuZGVlcy5yZWdpc3RlcigpO1xuTFJTVGFnLnJlZ2lzdGVyKCk7XG4iXX0=