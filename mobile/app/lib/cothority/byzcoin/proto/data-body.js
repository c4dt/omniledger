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
var light_1 = require("protobufjs/light");
var protobuf_1 = require("../../protobuf");
var tx_result_1 = __importDefault(require("./tx-result"));
/**
 * ByzCoin block payload
 */
var DataBody = /** @class */ (function (_super) {
    __extends(DataBody, _super);
    function DataBody(props) {
        var _this = _super.call(this, props) || this;
        _this.txResults = _this.txResults || [];
        /* Protobuf aliases */
        Object.defineProperty(_this, "txresults", {
            get: function () {
                return this.txResults;
            },
            set: function (value) {
                this.txResults = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    DataBody.register = function () {
        protobuf_1.registerMessage("byzcoin.DataBody", DataBody, tx_result_1.default);
    };
    return DataBody;
}(light_1.Message));
exports.default = DataBody;
DataBody.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1ib2R5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGF0YS1ib2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUF1RDtBQUN2RCwyQ0FBaUQ7QUFDakQsMERBQW1DO0FBRW5DOztHQUVHO0FBQ0g7SUFBc0MsNEJBQWlCO0lBVW5ELGtCQUFZLEtBQTRCO1FBQXhDLFlBQ0ksa0JBQU0sS0FBSyxDQUFDLFNBY2Y7UUFaRyxLQUFJLENBQUMsU0FBUyxHQUFHLEtBQUksQ0FBQyxTQUFTLElBQUksRUFBRSxDQUFDO1FBRXRDLHNCQUFzQjtRQUV0QixNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUksRUFBRSxXQUFXLEVBQUU7WUFDckMsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUMxQixDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQWlCO2dCQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUMzQixDQUFDO1NBQ0osQ0FBQyxDQUFDOztJQUNQLENBQUM7SUF4QkQ7O09BRUc7SUFDSSxpQkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsbUJBQVEsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFvQkwsZUFBQztBQUFELENBQUMsQUExQkQsQ0FBc0MsZUFBTyxHQTBCNUM7O0FBRUQsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vcHJvdG9idWZcIjtcbmltcG9ydCBUeFJlc3VsdCBmcm9tIFwiLi90eC1yZXN1bHRcIjtcblxuLyoqXG4gKiBCeXpDb2luIGJsb2NrIHBheWxvYWRcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGF0YUJvZHkgZXh0ZW5kcyBNZXNzYWdlPERhdGFCb2R5PiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJieXpjb2luLkRhdGFCb2R5XCIsIERhdGFCb2R5LCBUeFJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgdHhSZXN1bHRzOiBUeFJlc3VsdFtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPERhdGFCb2R5Pikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgdGhpcy50eFJlc3VsdHMgPSB0aGlzLnR4UmVzdWx0cyB8fCBbXTtcblxuICAgICAgICAvKiBQcm90b2J1ZiBhbGlhc2VzICovXG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidHhyZXN1bHRzXCIsIHtcbiAgICAgICAgICAgIGdldCgpOiBUeFJlc3VsdFtdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50eFJlc3VsdHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBUeFJlc3VsdFtdKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50eFJlc3VsdHMgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuRGF0YUJvZHkucmVnaXN0ZXIoKTtcbiJdfQ==