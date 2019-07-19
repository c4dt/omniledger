"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var credentials_instance_1 = __importStar(require("../../personhood/credentials-instance"));
var pop_party_instance_1 = require("../../personhood/pop-party-instance");
var PopPartyProto = __importStar(require("../../personhood/proto"));
var ro_pa_sci_instance_1 = __importStar(require("../../personhood/ro-pa-sci-instance"));
var spawner_instance_1 = __importStar(require("../../personhood/spawner-instance"));
var coin_instance_1 = __importStar(require("./coin-instance"));
var darc_instance_1 = __importDefault(require("./darc-instance"));
var coin = {
    Coin: coin_instance_1.Coin,
    CoinInstance: coin_instance_1.default,
};
exports.coin = coin;
var credentials = {
    Attribute: credentials_instance_1.Attribute,
    Credential: credentials_instance_1.Credential,
    CredentialStruct: credentials_instance_1.CredentialStruct,
    CredentialsInstance: credentials_instance_1.default,
};
exports.credentials = credentials;
var darc = {
    DarcInstance: darc_instance_1.default,
};
exports.darc = darc;
var pop = __assign({ PopPartyInstance: pop_party_instance_1.PopPartyInstance }, PopPartyProto);
exports.pop = pop;
var game = {
    RoPaSciInstance: ro_pa_sci_instance_1.default,
    RoPaSciStruct: ro_pa_sci_instance_1.RoPaSciStruct,
};
exports.game = game;
var spawner = {
    SpawnerInstance: spawner_instance_1.default,
    SpawnerStruct: spawner_instance_1.SpawnerStruct,
};
exports.spawner = spawner;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDRGQUFxSDtBQUNySCwwRUFBdUU7QUFDdkUsb0VBQXdEO0FBQ3hELHdGQUFxRjtBQUNyRixvRkFBbUY7QUFDbkYsK0RBQXFEO0FBQ3JELGtFQUEyQztBQUUzQyxJQUFNLElBQUksR0FBRztJQUNULElBQUksc0JBQUE7SUFDSixZQUFZLHlCQUFBO0NBQ2YsQ0FBQztBQTZCRSxvQkFBSTtBQTNCUixJQUFNLFdBQVcsR0FBRztJQUNoQixTQUFTLGtDQUFBO0lBQ1QsVUFBVSxtQ0FBQTtJQUNWLGdCQUFnQix5Q0FBQTtJQUNoQixtQkFBbUIsZ0NBQUE7Q0FDdEIsQ0FBQztBQXVCRSxrQ0FBVztBQXJCZixJQUFNLElBQUksR0FBRztJQUNULFlBQVkseUJBQUE7Q0FDZixDQUFDO0FBb0JFLG9CQUFJO0FBbEJSLElBQU0sR0FBRyxjQUNMLGdCQUFnQix1Q0FBQSxJQUNiLGFBQWEsQ0FDbkIsQ0FBQztBQWdCRSxrQkFBRztBQWRQLElBQU0sSUFBSSxHQUFHO0lBQ1QsZUFBZSw4QkFBQTtJQUNmLGFBQWEsb0NBQUE7Q0FDaEIsQ0FBQztBQVlFLG9CQUFJO0FBVlIsSUFBTSxPQUFPLEdBQUc7SUFDWixlQUFlLDRCQUFBO0lBQ2YsYUFBYSxrQ0FBQTtDQUNoQixDQUFDO0FBUUUsMEJBQU8iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ3JlZGVudGlhbHNJbnN0YW5jZSwgeyBBdHRyaWJ1dGUsIENyZWRlbnRpYWwsIENyZWRlbnRpYWxTdHJ1Y3QgfSBmcm9tIFwiLi4vLi4vcGVyc29uaG9vZC9jcmVkZW50aWFscy1pbnN0YW5jZVwiO1xuaW1wb3J0IHsgUG9wUGFydHlJbnN0YW5jZSB9IGZyb20gXCIuLi8uLi9wZXJzb25ob29kL3BvcC1wYXJ0eS1pbnN0YW5jZVwiO1xuaW1wb3J0ICogYXMgUG9wUGFydHlQcm90byBmcm9tIFwiLi4vLi4vcGVyc29uaG9vZC9wcm90b1wiO1xuaW1wb3J0IFJvUGFTY2lJbnN0YW5jZSwgeyBSb1BhU2NpU3RydWN0IH0gZnJvbSBcIi4uLy4uL3BlcnNvbmhvb2Qvcm8tcGEtc2NpLWluc3RhbmNlXCI7XG5pbXBvcnQgU3Bhd25lckluc3RhbmNlLCB7IFNwYXduZXJTdHJ1Y3QgfSBmcm9tIFwiLi4vLi4vcGVyc29uaG9vZC9zcGF3bmVyLWluc3RhbmNlXCI7XG5pbXBvcnQgQ29pbkluc3RhbmNlLCB7IENvaW4gfSBmcm9tIFwiLi9jb2luLWluc3RhbmNlXCI7XG5pbXBvcnQgRGFyY0luc3RhbmNlIGZyb20gXCIuL2RhcmMtaW5zdGFuY2VcIjtcblxuY29uc3QgY29pbiA9IHtcbiAgICBDb2luLFxuICAgIENvaW5JbnN0YW5jZSxcbn07XG5cbmNvbnN0IGNyZWRlbnRpYWxzID0ge1xuICAgIEF0dHJpYnV0ZSxcbiAgICBDcmVkZW50aWFsLFxuICAgIENyZWRlbnRpYWxTdHJ1Y3QsXG4gICAgQ3JlZGVudGlhbHNJbnN0YW5jZSxcbn07XG5cbmNvbnN0IGRhcmMgPSB7XG4gICAgRGFyY0luc3RhbmNlLFxufTtcblxuY29uc3QgcG9wID0ge1xuICAgIFBvcFBhcnR5SW5zdGFuY2UsXG4gICAgLi4uUG9wUGFydHlQcm90byxcbn07XG5cbmNvbnN0IGdhbWUgPSB7XG4gICAgUm9QYVNjaUluc3RhbmNlLFxuICAgIFJvUGFTY2lTdHJ1Y3QsXG59O1xuXG5jb25zdCBzcGF3bmVyID0ge1xuICAgIFNwYXduZXJJbnN0YW5jZSxcbiAgICBTcGF3bmVyU3RydWN0LFxufTtcblxuZXhwb3J0IHtcbiAgICBjb2luLFxuICAgIGNyZWRlbnRpYWxzLFxuICAgIGRhcmMsXG4gICAgcG9wLFxuICAgIGdhbWUsXG4gICAgc3Bhd25lcixcbn07XG4iXX0=