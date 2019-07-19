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
 * Identity based on a DARC identifier
 */
var IdentityDarc = /** @class */ (function (_super) {
    __extends(IdentityDarc, _super);
    function IdentityDarc(props) {
        var _this = _super.call(this, props) || this;
        _this.id = Buffer.from(_this.id || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    IdentityDarc.register = function () {
        protobuf_1.registerMessage("IdentityDarc", IdentityDarc);
    };
    /** @inheritdoc */
    IdentityDarc.prototype.verify = function (msg, signature) {
        return false;
    };
    /** @inheritdoc */
    IdentityDarc.prototype.toBytes = function () {
        return this.id;
    };
    /** @inheritdoc */
    IdentityDarc.prototype.toString = function () {
        return "darc:" + this.id.toString("hex");
    };
    return IdentityDarc;
}(light_1.Message));
exports.default = IdentityDarc;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpdHktZGFyYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImlkZW50aXR5LWRhcmMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMENBQXVEO0FBQ3ZELHdDQUE0RDtBQUc1RDs7R0FFRztBQUNIO0lBQTBDLGdDQUFxQjtJQVUzRCxzQkFBWSxLQUFnQztRQUE1QyxZQUNJLGtCQUFNLEtBQUssQ0FBQyxTQUdmO1FBREcsS0FBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxFQUFFLElBQUksdUJBQVksQ0FBQyxDQUFDOztJQUNuRCxDQUFDO0lBYkQ7O09BRUc7SUFDSSxxQkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQVVELGtCQUFrQjtJQUNsQiw2QkFBTSxHQUFOLFVBQU8sR0FBVyxFQUFFLFNBQWlCO1FBQ2pDLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsOEJBQU8sR0FBUDtRQUNJLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQsa0JBQWtCO0lBQ2xCLCtCQUFRLEdBQVI7UUFDSSxPQUFPLFVBQVEsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFHLENBQUM7SUFDN0MsQ0FBQztJQUNMLG1CQUFDO0FBQUQsQ0FBQyxBQTlCRCxDQUEwQyxlQUFPLEdBOEJoRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IHsgRU1QVFlfQlVGRkVSLCByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcbmltcG9ydCBJZGVudGl0eVdyYXBwZXIsIHsgSUlkZW50aXR5IH0gZnJvbSBcIi4vaWRlbnRpdHktd3JhcHBlclwiO1xuXG4vKipcbiAqIElkZW50aXR5IGJhc2VkIG9uIGEgREFSQyBpZGVudGlmaWVyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIElkZW50aXR5RGFyYyBleHRlbmRzIE1lc3NhZ2U8SWRlbnRpdHlEYXJjPiBpbXBsZW1lbnRzIElJZGVudGl0eSB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJJZGVudGl0eURhcmNcIiwgSWRlbnRpdHlEYXJjKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBpZDogQnVmZmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPElkZW50aXR5RGFyYz4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuaWQgPSBCdWZmZXIuZnJvbSh0aGlzLmlkIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgdmVyaWZ5KG1zZzogQnVmZmVyLCBzaWduYXR1cmU6IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqIEBpbmhlcml0ZG9jICovXG4gICAgdG9CeXRlcygpOiBCdWZmZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG5cbiAgICAvKiogQGluaGVyaXRkb2MgKi9cbiAgICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gYGRhcmM6JHt0aGlzLmlkLnRvU3RyaW5nKFwiaGV4XCIpfWA7XG4gICAgfVxufVxuIl19