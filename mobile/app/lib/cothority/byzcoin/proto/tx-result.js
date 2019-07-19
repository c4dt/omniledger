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
var client_transaction_1 = __importDefault(require("../client-transaction"));
var TxResult = /** @class */ (function (_super) {
    __extends(TxResult, _super);
    function TxResult(props) {
        var _this = _super.call(this, props) || this;
        /* Protobuf aliases */
        Object.defineProperty(_this, "clienttransaction", {
            get: function () {
                return this.clientTransaction;
            },
            set: function (value) {
                this.clientTransaction = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    TxResult.register = function () {
        protobuf_1.registerMessage("byzcoin.TxResult", TxResult, client_transaction_1.default);
    };
    return TxResult;
}(light_1.Message));
exports.default = TxResult;
TxResult.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHgtcmVzdWx0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHgtcmVzdWx0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUF1RDtBQUN2RCwyQ0FBaUQ7QUFDakQsNkVBQXNEO0FBRXREO0lBQXNDLDRCQUFpQjtJQVduRCxrQkFBWSxLQUE0QjtRQUF4QyxZQUNJLGtCQUFNLEtBQUssQ0FBQyxTQVlmO1FBVkcsc0JBQXNCO1FBRXRCLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLG1CQUFtQixFQUFFO1lBQzdDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztZQUNsQyxDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQXdCO2dCQUN4QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1lBQ25DLENBQUM7U0FDSixDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQXZCRDs7T0FFRztJQUNJLGlCQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsRUFBRSw0QkFBaUIsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFtQkwsZUFBQztBQUFELENBQUMsQUF6QkQsQ0FBc0MsZUFBTyxHQXlCNUM7O0FBRUQsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vcHJvdG9idWZcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiBmcm9tIFwiLi4vY2xpZW50LXRyYW5zYWN0aW9uXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFR4UmVzdWx0IGV4dGVuZHMgTWVzc2FnZTxUeFJlc3VsdD4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiYnl6Y29pbi5UeFJlc3VsdFwiLCBUeFJlc3VsdCwgQ2xpZW50VHJhbnNhY3Rpb24pO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGNsaWVudFRyYW5zYWN0aW9uOiBDbGllbnRUcmFuc2FjdGlvbjtcbiAgICByZWFkb25seSBhY2NlcHRlZDogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxUeFJlc3VsdD4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJjbGllbnR0cmFuc2FjdGlvblwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQ2xpZW50VHJhbnNhY3Rpb24ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNsaWVudFRyYW5zYWN0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQ2xpZW50VHJhbnNhY3Rpb24pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWVudFRyYW5zYWN0aW9uID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cblR4UmVzdWx0LnJlZ2lzdGVyKCk7XG4iXX0=