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
var protobuf_1 = require("../../protobuf");
var EMPTY_BUFFER = Buffer.allocUnsafe(0);
/**
 * ByzCoin metadata
 */
var DataHeader = /** @class */ (function (_super) {
    __extends(DataHeader, _super);
    function DataHeader(props) {
        var _this = _super.call(this, props) || this;
        _this.trieRoot = Buffer.from(_this.trieRoot || EMPTY_BUFFER);
        _this.clientTransactionHash = Buffer.from(_this.clientTransactionHash || EMPTY_BUFFER);
        _this.stateChangeHash = Buffer.from(_this.stateChangeHash || EMPTY_BUFFER);
        /* Protobuf aliases */
        Object.defineProperty(_this, "trieroot", {
            get: function () {
                return this.trieRoot;
            },
            set: function (value) {
                this.trieRoot = value;
            },
        });
        Object.defineProperty(_this, "clienttransactionhash", {
            get: function () {
                return this.clientTransactionHash;
            },
            set: function (value) {
                this.clientTransactionHash = value;
            },
        });
        Object.defineProperty(_this, "statechangehash", {
            get: function () {
                return this.stateChangeHash;
            },
            set: function (value) {
                this.stateChangeHash = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    DataHeader.register = function () {
        protobuf_1.registerMessage("byzcoin.DataHeader", DataHeader);
    };
    return DataHeader;
}(light_1.Message));
exports.default = DataHeader;
DataHeader.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS1oZWFkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhLWhlYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBdUQ7QUFDdkQsMkNBQWlEO0FBRWpELElBQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFM0M7O0dBRUc7QUFDSDtJQUF3Qyw4QkFBbUI7SUFhdkQsb0JBQVksS0FBOEI7UUFBMUMsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FrQ2Y7UUFoQ0csS0FBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxRQUFRLElBQUksWUFBWSxDQUFDLENBQUM7UUFDM0QsS0FBSSxDQUFDLHFCQUFxQixHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSSxDQUFDLHFCQUFxQixJQUFJLFlBQVksQ0FBQyxDQUFDO1FBQ3JGLEtBQUksQ0FBQyxlQUFlLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsZUFBZSxJQUFJLFlBQVksQ0FBQyxDQUFDO1FBRXpFLHNCQUFzQjtRQUV0QixNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUksRUFBRSxVQUFVLEVBQUU7WUFDcEMsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUN6QixDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQWE7Z0JBQ2IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7WUFDMUIsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLHVCQUF1QixFQUFFO1lBQ2pELEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxxQkFBcUIsQ0FBQztZQUN0QyxDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQWE7Z0JBQ2IsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEtBQUssQ0FBQztZQUN2QyxDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDM0MsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQWE7Z0JBQ2IsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7WUFDakMsQ0FBQztTQUNKLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBL0NEOztPQUVHO0lBQ0ksbUJBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsb0JBQW9CLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdEQsQ0FBQztJQTJDTCxpQkFBQztBQUFELENBQUMsQUFqREQsQ0FBd0MsZUFBTyxHQWlEOUM7O0FBRUQsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vLi4vcHJvdG9idWZcIjtcblxuY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jVW5zYWZlKDApO1xuXG4vKipcbiAqIEJ5ekNvaW4gbWV0YWRhdGFcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGF0YUhlYWRlciBleHRlbmRzIE1lc3NhZ2U8RGF0YUhlYWRlcj4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiYnl6Y29pbi5EYXRhSGVhZGVyXCIsIERhdGFIZWFkZXIpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHRyaWVSb290OiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgY2xpZW50VHJhbnNhY3Rpb25IYXNoOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgc3RhdGVDaGFuZ2VIYXNoOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgdGltZXN0YW1wOiBMb25nO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPERhdGFIZWFkZXI+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnRyaWVSb290ID0gQnVmZmVyLmZyb20odGhpcy50cmllUm9vdCB8fCBFTVBUWV9CVUZGRVIpO1xuICAgICAgICB0aGlzLmNsaWVudFRyYW5zYWN0aW9uSGFzaCA9IEJ1ZmZlci5mcm9tKHRoaXMuY2xpZW50VHJhbnNhY3Rpb25IYXNoIHx8IEVNUFRZX0JVRkZFUik7XG4gICAgICAgIHRoaXMuc3RhdGVDaGFuZ2VIYXNoID0gQnVmZmVyLmZyb20odGhpcy5zdGF0ZUNoYW5nZUhhc2ggfHwgRU1QVFlfQlVGRkVSKTtcblxuICAgICAgICAvKiBQcm90b2J1ZiBhbGlhc2VzICovXG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwidHJpZXJvb3RcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IEJ1ZmZlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudHJpZVJvb3Q7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWVSb290ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJjbGllbnR0cmFuc2FjdGlvbmhhc2hcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IEJ1ZmZlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2xpZW50VHJhbnNhY3Rpb25IYXNoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogQnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbGllbnRUcmFuc2FjdGlvbkhhc2ggPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInN0YXRlY2hhbmdlaGFzaFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQnVmZmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZUNoYW5nZUhhc2g7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlQ2hhbmdlSGFzaCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5EYXRhSGVhZGVyLnJlZ2lzdGVyKCk7XG4iXX0=