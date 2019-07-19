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
var CheckAuthorization = /** @class */ (function (_super) {
    __extends(CheckAuthorization, _super);
    function CheckAuthorization(props) {
        var _this = _super.call(this, props) || this;
        /* Protobuf aliases */
        Object.defineProperty(_this, "byzcoinid", {
            get: function () {
                return this.byzcoinID;
            },
            set: function (value) {
                this.byzcoinID = value;
            },
        });
        Object.defineProperty(_this, "darcid", {
            get: function () {
                return this.darcID;
            },
            set: function (value) {
                this.darcID = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    CheckAuthorization.register = function () {
        protobuf_1.registerMessage("byzcoin.CheckAuthorization", CheckAuthorization, client_transaction_1.default);
    };
    return CheckAuthorization;
}(light_1.Message));
exports.default = CheckAuthorization;
var CheckAuthorizationResponse = /** @class */ (function (_super) {
    __extends(CheckAuthorizationResponse, _super);
    function CheckAuthorizationResponse(props) {
        return _super.call(this, props) || this;
    }
    /**
     * @see README#Message classes
     */
    CheckAuthorizationResponse.register = function () {
        protobuf_1.registerMessage("byzcoin.CheckAuthorizationResponse", CheckAuthorizationResponse, client_transaction_1.default);
    };
    return CheckAuthorizationResponse;
}(light_1.Message));
exports.CheckAuthorizationResponse = CheckAuthorizationResponse;
CheckAuthorization.register();
CheckAuthorizationResponse.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2stYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoZWNrLWF1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMENBQXVEO0FBRXZELDJDQUFpRDtBQUNqRCw2RUFBc0Q7QUFHdEQ7SUFBZ0Qsc0NBQTJCO0lBYXZFLDRCQUFZLEtBQXNDO1FBQWxELFlBQ0ksa0JBQU0sS0FBSyxDQUFDLFNBcUJmO1FBbkJHLHNCQUFzQjtRQUV0QixNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUksRUFBRSxXQUFXLEVBQUU7WUFDckMsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUMxQixDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQWlCO2dCQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztZQUMzQixDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsUUFBUSxFQUFFO1lBQ2xDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7WUFDdkIsQ0FBQztZQUNELEdBQUcsWUFBQyxLQUFpQjtnQkFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDeEIsQ0FBQztTQUNKLENBQUMsQ0FBQzs7SUFDUCxDQUFDO0lBbENEOztPQUVHO0lBQ0ksMkJBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsNEJBQTRCLEVBQUUsa0JBQWtCLEVBQUUsNEJBQWlCLENBQUMsQ0FBQztJQUN6RixDQUFDO0lBOEJMLHlCQUFDO0FBQUQsQ0FBQyxBQXBDRCxDQUFnRCxlQUFPLEdBb0N0RDs7QUFDRDtJQUFpRCw4Q0FBbUM7SUFVaEYsb0NBQVksS0FBOEM7ZUFDdEQsa0JBQU0sS0FBSyxDQUFDO0lBQ2hCLENBQUM7SUFYRDs7T0FFRztJQUNJLG1DQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLG9DQUFvQyxFQUFFLDBCQUEwQixFQUFFLDRCQUFpQixDQUFDLENBQUM7SUFDekcsQ0FBQztJQU9MLGlDQUFDO0FBQUQsQ0FBQyxBQWJELENBQWlELGVBQU8sR0FhdkQ7QUFiYSxnRUFBMEI7QUFleEMsa0JBQWtCLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDOUIsMEJBQTBCLENBQUMsUUFBUSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNZXNzYWdlLCBQcm9wZXJ0aWVzIH0gZnJvbSBcInByb3RvYnVmanMvbGlnaHRcIjtcbmltcG9ydCBJZGVudGl0eVdyYXBwZXIgZnJvbSBcIi4uLy4uL2RhcmMvaWRlbnRpdHktd3JhcHBlclwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJNZXNzYWdlIH0gZnJvbSBcIi4uLy4uL3Byb3RvYnVmXCI7XG5pbXBvcnQgQ2xpZW50VHJhbnNhY3Rpb24gZnJvbSBcIi4uL2NsaWVudC10cmFuc2FjdGlvblwiO1xuaW1wb3J0IHsgSW5zdGFuY2VJRCB9IGZyb20gXCIuLi9pbnN0YW5jZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDaGVja0F1dGhvcml6YXRpb24gZXh0ZW5kcyBNZXNzYWdlPENoZWNrQXV0aG9yaXphdGlvbj4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiYnl6Y29pbi5DaGVja0F1dGhvcml6YXRpb25cIiwgQ2hlY2tBdXRob3JpemF0aW9uLCBDbGllbnRUcmFuc2FjdGlvbik7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgdmVyc2lvbjogbnVtYmVyO1xuICAgIHJlYWRvbmx5IGJ5emNvaW5JRDogSW5zdGFuY2VJRDtcbiAgICByZWFkb25seSBkYXJjSUQ6IEluc3RhbmNlSUQ7XG4gICAgcmVhZG9ubHkgaWRlbnRpdGllczogSWRlbnRpdHlXcmFwcGVyW107XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8Q2hlY2tBdXRob3JpemF0aW9uPikge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG5cbiAgICAgICAgLyogUHJvdG9idWYgYWxpYXNlcyAqL1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImJ5emNvaW5pZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogSW5zdGFuY2VJRCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYnl6Y29pbklEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogSW5zdGFuY2VJRCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYnl6Y29pbklEID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJkYXJjaWRcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IEluc3RhbmNlSUQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRhcmNJRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IEluc3RhbmNlSUQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhcmNJRCA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0ICBjbGFzcyBDaGVja0F1dGhvcml6YXRpb25SZXNwb25zZSBleHRlbmRzIE1lc3NhZ2U8Q2hlY2tBdXRob3JpemF0aW9uUmVzcG9uc2U+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcImJ5emNvaW4uQ2hlY2tBdXRob3JpemF0aW9uUmVzcG9uc2VcIiwgQ2hlY2tBdXRob3JpemF0aW9uUmVzcG9uc2UsIENsaWVudFRyYW5zYWN0aW9uKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBhY3Rpb25zOiBzdHJpbmdbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxDaGVja0F1dGhvcml6YXRpb25SZXNwb25zZT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgIH1cbn1cblxuQ2hlY2tBdXRob3JpemF0aW9uLnJlZ2lzdGVyKCk7XG5DaGVja0F1dGhvcml6YXRpb25SZXNwb25zZS5yZWdpc3RlcigpO1xuIl19