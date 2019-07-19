"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var connection = __importStar(require("./connection"));
exports.connection = connection;
var proto_1 = require("./proto");
exports.Roster = proto_1.Roster;
exports.ServerIdentity = proto_1.ServerIdentity;
exports.ServiceIdentity = proto_1.ServiceIdentity;
var websocket_adapter_1 = require("./websocket-adapter");
exports.BrowserWebSocketAdapter = websocket_adapter_1.BrowserWebSocketAdapter;
exports.WebSocketAdapter = websocket_adapter_1.WebSocketAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSx1REFBMkM7QUFLdkMsZ0NBQVU7QUFKZCxpQ0FBa0U7QUFLOUQsaUJBTEssY0FBTSxDQUtMO0FBQ04seUJBTmEsc0JBQWMsQ0FNYjtBQUNkLDBCQVA2Qix1QkFBZSxDQU83QjtBQU5uQix5REFBZ0Y7QUFRNUUsa0NBUkssMkNBQXVCLENBUUw7QUFEdkIsMkJBUDhCLG9DQUFnQixDQU85QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNvbm5lY3Rpb24gZnJvbSBcIi4vY29ubmVjdGlvblwiO1xuaW1wb3J0IHsgUm9zdGVyLCBTZXJ2ZXJJZGVudGl0eSwgU2VydmljZUlkZW50aXR5IH0gZnJvbSBcIi4vcHJvdG9cIjtcbmltcG9ydCB7IEJyb3dzZXJXZWJTb2NrZXRBZGFwdGVyLCBXZWJTb2NrZXRBZGFwdGVyIH0gZnJvbSBcIi4vd2Vic29ja2V0LWFkYXB0ZXJcIjtcblxuZXhwb3J0IHtcbiAgICBjb25uZWN0aW9uLFxuICAgIFJvc3RlcixcbiAgICBTZXJ2ZXJJZGVudGl0eSxcbiAgICBTZXJ2aWNlSWRlbnRpdHksXG4gICAgV2ViU29ja2V0QWRhcHRlcixcbiAgICBCcm93c2VyV2ViU29ja2V0QWRhcHRlcixcbn07XG4iXX0=