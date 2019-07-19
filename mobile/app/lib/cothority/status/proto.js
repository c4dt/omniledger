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
var proto_1 = require("../network/proto");
var protobuf_1 = require("../protobuf");
/**
 * Status request message
 */
var StatusRequest = /** @class */ (function (_super) {
    __extends(StatusRequest, _super);
    function StatusRequest() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    StatusRequest.register = function () {
        protobuf_1.registerMessage("Request", StatusRequest);
    };
    return StatusRequest;
}(light_1.Message));
exports.StatusRequest = StatusRequest;
/**
 * Status of a service
 */
var Status = /** @class */ (function (_super) {
    __extends(Status, _super);
    function Status(props) {
        var _this = _super.call(this, props) || this;
        _this.field = _this.field || {};
        return _this;
    }
    /**
     * @see README#Message classes
     */
    Status.register = function () {
        protobuf_1.registerMessage("Status", Status);
    };
    /**
     * Get the value of a field
     * @param field The name of the field
     * @returns the value or undefined
     */
    Status.prototype.getValue = function (k) {
        return this.field[k];
    };
    /**
     * Get a string representation of this status
     * @returns a string
     */
    Status.prototype.toString = function () {
        var _this = this;
        return Object.keys(this.field).sort().map(function (k) { return k + ": " + _this.field[k]; }).join("\n");
    };
    return Status;
}(light_1.Message));
exports.Status = Status;
/**
 * Status response message
 */
var StatusResponse = /** @class */ (function (_super) {
    __extends(StatusResponse, _super);
    function StatusResponse(props) {
        var _this = _super.call(this, props) || this;
        _this.status = _this.status || {};
        /* Protobuf aliases */
        Object.defineProperty(_this, "serveridentity", {
            get: function () {
                return this.serverIdentity;
            },
            set: function (value) {
                this.serverIdentity = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    StatusResponse.register = function () {
        protobuf_1.registerMessage("Response", StatusResponse, Status, proto_1.ServerIdentity);
    };
    /**
     * Get the status of a service
     * @param key The name of the service
     * @returns the status
     */
    StatusResponse.prototype.getStatus = function (key) {
        return this.status[key];
    };
    /**
     * Get a string representation of all the statuses
     * @returns a string
     */
    StatusResponse.prototype.toString = function () {
        var _this = this;
        return Object.keys(this.status).sort().map(function (k) { return "[" + k + "]\n" + _this.status[k].toString(); }).join("\n\n");
    };
    return StatusResponse;
}(light_1.Message));
exports.StatusResponse = StatusResponse;
StatusRequest.register();
StatusResponse.register();
Status.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm90by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBdUQ7QUFDdkQsMENBQWtEO0FBQ2xELHdDQUE4QztBQUU5Qzs7R0FFRztBQUNIO0lBQW1DLGlDQUFzQjtJQUF6RDs7SUFPQSxDQUFDO0lBTkc7O09BRUc7SUFDSSxzQkFBUSxHQUFmO1FBQ0ksMEJBQWUsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUNMLG9CQUFDO0FBQUQsQ0FBQyxBQVBELENBQW1DLGVBQU8sR0FPekM7QUFQWSxzQ0FBYTtBQVMxQjs7R0FFRztBQUNIO0lBQTRCLDBCQUFlO0lBVXZDLGdCQUFZLEtBQTBCO1FBQXRDLFlBQ0ksa0JBQU0sS0FBSyxDQUFDLFNBR2Y7UUFERyxLQUFJLENBQUMsS0FBSyxHQUFHLEtBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDOztJQUNsQyxDQUFDO0lBYkQ7O09BRUc7SUFDSSxlQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBVUQ7Ozs7T0FJRztJQUNILHlCQUFRLEdBQVIsVUFBUyxDQUFTO1FBQ2QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7O09BR0c7SUFDSCx5QkFBUSxHQUFSO1FBQUEsaUJBRUM7UUFERyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFDLENBQUMsSUFBSyxPQUFHLENBQUMsVUFBSyxLQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBRyxFQUF4QixDQUF3QixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFDTCxhQUFDO0FBQUQsQ0FBQyxBQWhDRCxDQUE0QixlQUFPLEdBZ0NsQztBQWhDWSx3QkFBTTtBQWtDbkI7O0dBRUc7QUFDSDtJQUFvQyxrQ0FBdUI7SUFXdkQsd0JBQVksS0FBa0M7UUFBOUMsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FjZjtRQVpHLEtBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFFaEMsc0JBQXNCO1FBRXRCLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzFDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDL0IsQ0FBQztZQUNELEdBQUcsWUFBQyxLQUFxQjtnQkFDckIsSUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7WUFDaEMsQ0FBQztTQUNKLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBekJEOztPQUVHO0lBQ0ksdUJBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsc0JBQWMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFzQkQ7Ozs7T0FJRztJQUNILGtDQUFTLEdBQVQsVUFBVSxHQUFXO1FBQ2pCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsaUNBQVEsR0FBUjtRQUFBLGlCQUVDO1FBREcsT0FBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxNQUFJLENBQUMsV0FBTSxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBSSxFQUF0QyxDQUFzQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzNHLENBQUM7SUFDTCxxQkFBQztBQUFELENBQUMsQUE1Q0QsQ0FBb0MsZUFBTyxHQTRDMUM7QUE1Q1ksd0NBQWM7QUE4QzNCLGFBQWEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN6QixjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUIsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyBTZXJ2ZXJJZGVudGl0eSB9IGZyb20gXCIuLi9uZXR3b3JrL3Byb3RvXCI7XG5pbXBvcnQgeyByZWdpc3Rlck1lc3NhZ2UgfSBmcm9tIFwiLi4vcHJvdG9idWZcIjtcblxuLyoqXG4gKiBTdGF0dXMgcmVxdWVzdCBtZXNzYWdlXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGF0dXNSZXF1ZXN0IGV4dGVuZHMgTWVzc2FnZTxTdGF0dXNSZXF1ZXN0PiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJSZXF1ZXN0XCIsIFN0YXR1c1JlcXVlc3QpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTdGF0dXMgb2YgYSBzZXJ2aWNlXG4gKi9cbmV4cG9ydCBjbGFzcyBTdGF0dXMgZXh0ZW5kcyBNZXNzYWdlPFN0YXR1cz4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiU3RhdHVzXCIsIFN0YXR1cyk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgZmllbGQ6IHsgW2s6IHN0cmluZ106IHN0cmluZyB9O1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPFN0YXR1cz4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMuZmllbGQgPSB0aGlzLmZpZWxkIHx8IHt9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgdmFsdWUgb2YgYSBmaWVsZFxuICAgICAqIEBwYXJhbSBmaWVsZCBUaGUgbmFtZSBvZiB0aGUgZmllbGRcbiAgICAgKiBAcmV0dXJucyB0aGUgdmFsdWUgb3IgdW5kZWZpbmVkXG4gICAgICovXG4gICAgZ2V0VmFsdWUoazogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRba107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoaXMgc3RhdHVzXG4gICAgICogQHJldHVybnMgYSBzdHJpbmdcbiAgICAgKi9cbiAgICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5maWVsZCkuc29ydCgpLm1hcCgoaykgPT4gYCR7a306ICR7dGhpcy5maWVsZFtrXX1gKS5qb2luKFwiXFxuXCIpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBTdGF0dXMgcmVzcG9uc2UgbWVzc2FnZVxuICovXG5leHBvcnQgY2xhc3MgU3RhdHVzUmVzcG9uc2UgZXh0ZW5kcyBNZXNzYWdlPFN0YXR1c1Jlc3BvbnNlPiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJSZXNwb25zZVwiLCBTdGF0dXNSZXNwb25zZSwgU3RhdHVzLCBTZXJ2ZXJJZGVudGl0eSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgc3RhdHVzOiB7IFtrOiBzdHJpbmddOiBTdGF0dXMgfTtcbiAgICByZWFkb25seSBzZXJ2ZXJJZGVudGl0eTogU2VydmVySWRlbnRpdHk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8U3RhdHVzUmVzcG9uc2U+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnN0YXR1cyA9IHRoaXMuc3RhdHVzIHx8IHt9O1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJzZXJ2ZXJpZGVudGl0eVwiLCB7XG4gICAgICAgICAgICBnZXQoKTogU2VydmVySWRlbnRpdHkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNlcnZlcklkZW50aXR5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogU2VydmVySWRlbnRpdHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlcnZlcklkZW50aXR5ID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHN0YXR1cyBvZiBhIHNlcnZpY2VcbiAgICAgKiBAcGFyYW0ga2V5IFRoZSBuYW1lIG9mIHRoZSBzZXJ2aWNlXG4gICAgICogQHJldHVybnMgdGhlIHN0YXR1c1xuICAgICAqL1xuICAgIGdldFN0YXR1cyhrZXk6IHN0cmluZyk6IFN0YXR1cyB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1c1trZXldO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbGwgdGhlIHN0YXR1c2VzXG4gICAgICogQHJldHVybnMgYSBzdHJpbmdcbiAgICAgKi9cbiAgICB0b1N0cmluZygpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5zdGF0dXMpLnNvcnQoKS5tYXAoKGspID0+IGBbJHtrfV1cXG4ke3RoaXMuc3RhdHVzW2tdLnRvU3RyaW5nKCl9YCkuam9pbihcIlxcblxcblwiKTtcbiAgICB9XG59XG5cblN0YXR1c1JlcXVlc3QucmVnaXN0ZXIoKTtcblN0YXR1c1Jlc3BvbnNlLnJlZ2lzdGVyKCk7XG5TdGF0dXMucmVnaXN0ZXIoKTtcbiJdfQ==