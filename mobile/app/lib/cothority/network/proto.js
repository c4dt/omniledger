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
var crypto_browserify_1 = require("crypto-browserify");
var light_1 = require("protobufjs/light");
var pure_uuid_1 = __importDefault(require("pure-uuid"));
var toml_1 = __importDefault(require("toml"));
var protobuf_1 = require("../protobuf");
var BASE_URL_WS = "ws://";
var BASE_URL_TLS = "tls://";
var URL_PORT_SPLITTER = ":";
var PORT_MIN = 0;
var PORT_MAX = 65535;
/**
 * List of server identities
 */
var Roster = /** @class */ (function (_super) {
    __extends(Roster, _super);
    function Roster(properties) {
        var _this = _super.call(this, properties) || this;
        if (!properties) {
            return _this;
        }
        var id = properties.id, list = properties.list, aggregate = properties.aggregate;
        if (!id || !aggregate) {
            var h_1 = crypto_browserify_1.createHash("sha256");
            list.forEach(function (srvid) {
                h_1.update(srvid.getPublic().marshalBinary());
                for (var _i = 0, _a = srvid.serviceIdentities; _i < _a.length; _i++) {
                    var srviceId = _a[_i];
                    h_1.update(srviceId.getPublic().marshalBinary());
                }
                if (!_this._agg) {
                    _this._agg = srvid.getPublic();
                }
                else {
                    _this._agg.add(_this._agg, srvid.getPublic());
                }
            });
            // protobuf fields need to be initialized if we want to encode later
            _this.aggregate = _this._agg.toProto();
            _this.id = Buffer.from(new pure_uuid_1.default(5, "ns:URL", h_1.digest().toString("hex")).export());
        }
        return _this;
    }
    Object.defineProperty(Roster.prototype, "length", {
        /**
         * Get the length of the roster
         * @returns the length as a number
         */
        get: function () {
            return this.list.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @see README#Message classes
     */
    Roster.register = function () {
        protobuf_1.registerMessage("Roster", Roster, ServerIdentity);
    };
    Roster.fromBytes = function (b) {
        return Roster.decode(b);
    };
    /**
     * Parse cothority roster toml string into a Roster object.
     * @example
     * // Toml needs to adhere to the following format
     * // where public has to be a hex-encoded string.
     *
     *    [[servers]]
     *        Address = "tcp://127.0.0.1:7001"
     *        Public = "4e3008c1a2b6e022fb60b76b834f174911653e9c9b4156cc8845bfb334075655"
     *        Description = "conode1"
     *    [[servers]]
     *        Address = "tcp://127.0.0.1:7003"
     *        Public = "e5e23e58539a09d3211d8fa0fb3475d48655e0c06d83e93c8e6e7d16aa87c106"
     *        Description = "conode2"
     *
     * @param data toml with the above format
     * @returns the parsed roster
     */
    Roster.fromTOML = function (data) {
        var roster = toml_1.default.parse(data);
        var list = roster.servers.map(function (server) {
            var Public = server.Public, Suite = server.Suite, Address = server.Address, Description = server.Description, Services = server.Services, Url = server.Url;
            var p = kyber_1.PointFactory.fromToml(Suite, Public);
            return new ServerIdentity({
                address: Address,
                description: Description,
                public: p.toProto(),
                serviceIdentities: Object.keys(Services || {}).map(function (key) {
                    var _a = Services[key], pub = _a.Public, suite = _a.Suite;
                    var point = kyber_1.PointFactory.fromToml(suite, pub);
                    return new ServiceIdentity({ name: key, public: point.toProto(), suite: suite });
                }),
                url: Url,
            });
        });
        return new Roster({ list: list });
    };
    /**
     * Get the public keys for a given service
     *
     * @param name The name of the service
     * @returns the list of points
     */
    Roster.prototype.getServicePublics = function (name) {
        return this.list.map(function (srvid) {
            var t = srvid.serviceIdentities.find(function (s) { return s.name === name; });
            return kyber_1.PointFactory.fromProto(t.public);
        });
    };
    /**
     * Returns the list of public keys of the conodes in the roster.
     */
    Roster.prototype.getPublics = function () {
        return this.list.map(function (si) { return si.getPublic(); });
    };
    /**
     * Get a subset of the roster
     *
     * @param start Index of the first identity
     * @param end   Index of the last identity, not inclusive
     * @returns the new roster
     */
    Roster.prototype.slice = function (start, end) {
        return new Roster({ list: this.list.slice(start, end) });
    };
    /**
     * Helper to encode the Roster using protobuf
     * @returns the bytes
     */
    Roster.prototype.toBytes = function () {
        return Buffer.from(Roster.encode(this).finish());
    };
    return Roster;
}(light_1.Message));
exports.Roster = Roster;
/**
 * Identity of a conode
 */
var ServerIdentity = /** @class */ (function (_super) {
    __extends(ServerIdentity, _super);
    function ServerIdentity(properties) {
        var _this = _super.call(this, properties) || this;
        if (!properties) {
            return _this;
        }
        if (!properties.id) {
            var hex = _this.getPublic().toString();
            _this.id = Buffer.from(new pure_uuid_1.default(5, "ns:URL", "https://dedis.epfl.ch/id/" + hex).export());
        }
        return _this;
    }
    /**
     * Converts an HTTP-S URL to a Wesocket URL. It converts 'http' to 'ws' and 'https' to 'wss'.
     * Any other protocols are forbidden and will raise an error. It also removes any trailing '/'.
     * Here are some examples:
     *      http://example.com:77        => ws://example.com:77
     *      https://example.com/path/    => wss:example.com/path
     *      https://example.com:443/     => wss:example.com
     *      tcp://127.0.0.1              => Error
     * Note: It will NOT include the given port in the case it's the default one (for example 80 or 443).
     * Note: In the case there are many slashes at the end of the url, it will only remove one.
     * @param url   the given url field
     * @returns a websocket url
     */
    ServerIdentity.urlToWebsocket = function (url) {
        var urlParser = new URL(url);
        switch (urlParser.protocol) {
            case "http:": {
                urlParser.protocol = "ws:";
                break;
            }
            case "https:": {
                urlParser.protocol = "wss:";
                break;
            }
            default: {
                throw new Error("The url field should use either 'http:' or 'https:', but we found "
                    + urlParser.protocol);
            }
        }
        var result = urlParser.toString();
        if (result.slice(-1) === "/") {
            result = result.slice(0, -1);
        }
        return result;
    };
    /**
     * @see README#Message classes
     */
    ServerIdentity.register = function () {
        protobuf_1.registerMessage("ServerIdentity", ServerIdentity, ServiceIdentity);
    };
    /**
     * Checks wether the address given as parameter has the right format.
     * @param address the address to check
     * @returns true if and only if the address has the right format
     */
    ServerIdentity.isValidAddress = function (address) {
        if (address.startsWith(BASE_URL_TLS)) {
            var _a = address.replace(BASE_URL_TLS, "").split(URL_PORT_SPLITTER), array = _a.slice(1);
            if (array.length === 1) {
                var port = parseInt(array[0], 10);
                // Port equal to PORT_MAX is not allowed since the port will be
                // increased by one for the websocket urlRegistered.
                return PORT_MIN <= port && port < PORT_MAX;
            }
        }
        return false;
    };
    /**
     * Converts a TLS URL to a Wesocket URL and builds a complete URL with the path given as parameter.
     * @param address   the server identity to take the urlRegistered from
     * @param path      the path after the base urlRegistered
     * @returns a websocket address
     */
    ServerIdentity.addressToWebsocket = function (address, path) {
        if (path === void 0) { path = ""; }
        var _a = address.replace(BASE_URL_TLS, "").split(URL_PORT_SPLITTER), ip = _a[0], portStr = _a[1];
        var port = parseInt(portStr, 10) + 1;
        return BASE_URL_WS + ip + URL_PORT_SPLITTER + port + path;
    };
    /**
     * Get the public key of the server as a Point
     * @returns the point
     */
    ServerIdentity.prototype.getPublic = function () {
        if (!this._point) {
            // cache the point to avoid multiple unmarshaling
            this._point = kyber_1.PointFactory.fromProto(this.public);
        }
        return this._point.clone();
    };
    /**
     * Returns websocket version of this.url if set, otherwise converts the server
     * address to match the websocket format.
     * @returns the websocket address
     */
    ServerIdentity.prototype.getWebSocketAddress = function () {
        if (this.url) {
            return ServerIdentity.urlToWebsocket(this.url);
        }
        else {
            return ServerIdentity.addressToWebsocket(this.address);
        }
    };
    return ServerIdentity;
}(light_1.Message));
exports.ServerIdentity = ServerIdentity;
/**
 * Identity of a service for a specific conode. Some services have their own
 * key pair and don't the default one.
 */
var ServiceIdentity = /** @class */ (function (_super) {
    __extends(ServiceIdentity, _super);
    function ServiceIdentity(properties) {
        var _this = _super.call(this, properties) || this;
        _this.public = Buffer.from(_this.public || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    ServiceIdentity.register = function () {
        protobuf_1.registerMessage("ServiceIdentity", ServiceIdentity);
    };
    /**
     * Get the public key as a Kyber point
     *
     * @returns the public key
     */
    ServiceIdentity.prototype.getPublic = function () {
        if (!this._point) {
            this._point = kyber_1.PointFactory.fromProto(this.public);
        }
        return this._point;
    };
    return ServiceIdentity;
}(light_1.Message));
exports.ServiceIdentity = ServiceIdentity;
// Roster.register();
// ServerIdentity.register();
// ServiceIdentity.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm90by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQ0FBbUQ7QUFDbkQsdURBQStDO0FBQy9DLDBDQUF1RDtBQUN2RCx3REFBNkI7QUFDN0IsOENBQXdCO0FBQ3hCLHdDQUE0RDtBQUU1RCxJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUM7QUFDNUIsSUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDO0FBQzlCLElBQU0saUJBQWlCLEdBQUcsR0FBRyxDQUFDO0FBQzlCLElBQU0sUUFBUSxHQUFHLENBQUMsQ0FBQztBQUNuQixJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFFdkI7O0dBRUc7QUFDSDtJQUE0QiwwQkFBZTtJQWtFdkMsZ0JBQVksVUFBK0I7UUFBM0MsWUFDSSxrQkFBTSxVQUFVLENBQUMsU0E0QnBCO1FBMUJHLElBQUksQ0FBQyxVQUFVLEVBQUU7O1NBRWhCO1FBRU0sSUFBQSxrQkFBRSxFQUFFLHNCQUFJLEVBQUUsZ0NBQVMsQ0FBZTtRQUV6QyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ25CLElBQU0sR0FBQyxHQUFHLDhCQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUs7Z0JBQ2YsR0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztnQkFFNUMsS0FBdUIsVUFBdUIsRUFBdkIsS0FBQSxLQUFLLENBQUMsaUJBQWlCLEVBQXZCLGNBQXVCLEVBQXZCLElBQXVCLEVBQUU7b0JBQTNDLElBQU0sUUFBUSxTQUFBO29CQUNmLEdBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUM7aUJBQ2xEO2dCQUVELElBQUksQ0FBQyxLQUFJLENBQUMs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O0lBQXFDLG1DQUF3QjtJQWF6RCx5QkFBWSxVQUF1QztRQUFuRCxZQUNJLGtCQUFNLFVBQVUsQ0FBQyxTQUdwQjtRQURHLEtBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFJLENBQUMsTUFBTSxJQUFJLHVCQUFZLENBQUMsQ0FBQzs7SUFDM0QsQ0FBQztJQWZEOztPQUVHO0lBQ0ksd0JBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQVlEOzs7O09BSUc7SUFDSCxtQ0FBUyxHQUFUO1FBQ0ksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZCxJQUFJLENBQUMsTUFBTSxHQUFHLG9CQUFZLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNyRDtRQUVELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBQ0wsc0JBQUM7QUFBRCxDQUFDLEFBL0JELENBQXFDLGVBQU8sR0ErQjNDO0FBL0JZLDBDQUFlO0FBaUM1QixxQkFBcUI7QUFDckIsNkJBQTZCO0FBQzdCLDhCQUE4QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvaW50LCBQb2ludEZhY3RvcnkgfSBmcm9tIFwiQGRlZGlzL2t5YmVyXCI7XG5pbXBvcnQgeyBjcmVhdGVIYXNoIH0gZnJvbSBcImNyeXB0by1icm93c2VyaWZ5XCI7XG5pbXBvcnQgeyBNZXNzYWdlLCBQcm9wZXJ0aWVzIH0gZnJvbSBcInByb3RvYnVmanMvbGlnaHRcIjtcbmltcG9ydCBVVUlEIGZyb20gXCJwdXJlLXV1aWRcIjtcbmltcG9ydCB0b21sIGZyb20gXCJ0b21sXCI7XG5pbXBvcnQgeyBFTVBUWV9CVUZGRVIsIHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi9wcm90b2J1ZlwiO1xuXG5jb25zdCBCQVNFX1VSTF9XUyA9IFwid3M6Ly9cIjtcbmNvbnN0IEJBU0VfVVJMX1RMUyA9IFwidGxzOi8vXCI7XG5jb25zdCBVUkxfUE9SVF9TUExJVFRFUiA9IFwiOlwiO1xuY29uc3QgUE9SVF9NSU4gPSAwO1xuY29uc3QgUE9SVF9NQVggPSA2NTUzNTtcblxuLyoqXG4gKiBMaXN0IG9mIHNlcnZlciBpZGVudGl0aWVzXG4gKi9cbmV4cG9ydCBjbGFzcyBSb3N0ZXIgZXh0ZW5kcyBNZXNzYWdlPFJvc3Rlcj4ge1xuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBsZW5ndGggb2YgdGhlIHJvc3RlclxuICAgICAqIEByZXR1cm5zIHRoZSBsZW5ndGggYXMgYSBudW1iZXJcbiAgICAgKi9cbiAgICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3QubGVuZ3RoO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiUm9zdGVyXCIsIFJvc3RlciwgU2VydmVySWRlbnRpdHkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tQnl0ZXMoYjogQnVmZmVyKTogUm9zdGVyIHtcbiAgICAgICAgcmV0dXJuIFJvc3Rlci5kZWNvZGUoYik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFyc2UgY290aG9yaXR5IHJvc3RlciB0b21sIHN0cmluZyBpbnRvIGEgUm9zdGVyIG9iamVjdC5cbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIC8vIFRvbWwgbmVlZHMgdG8gYWRoZXJlIHRvIHRoZSBmb2xsb3dpbmcgZm9ybWF0XG4gICAgICogLy8gd2hlcmUgcHVibGljIGhhcyB0byBiZSBhIGhleC1lbmNvZGVkIHN0cmluZy5cbiAgICAgKlxuICAgICAqICAgIFtbc2VydmVyc11dXG4gICAgICogICAgICAgIEFkZHJlc3MgPSBcInRjcDovLzEyNy4wLjAuMTo3MDAxXCJcbiAgICAgKiAgICAgICAgUHVibGljID0gXCI0ZTMwMDhjMWEyYjZlMDIyZmI2MGI3NmI4MzRmMTc0OTExNjUzZTljOWI0MTU2Y2M4ODQ1YmZiMzM0MDc1NjU1XCJcbiAgICAgKiAgICAgICAgRGVzY3JpcHRpb24gPSBcImNvbm9kZTFcIlxuICAgICAqICAgIFtbc2VydmVyc11dXG4gICAgICogICAgICAgIEFkZHJlc3MgPSBcInRjcDovLzEyNy4wLjAuMTo3MDAzXCJcbiAgICAgKiAgICAgICAgUHVibGljID0gXCJlNWUyM2U1ODUzOWEwOWQzMjExZDhmYTBmYjM0NzVkNDg2NTVlMGMwNmQ4M2U5M2M4ZTZlN2QxNmFhODdjMTA2XCJcbiAgICAgKiAgICAgICAgRGVzY3JpcHRpb24gPSBcImNvbm9kZTJcIlxuICAgICAqXG4gICAgICogQHBhcmFtIGRhdGEgdG9tbCB3aXRoIHRoZSBhYm92ZSBmb3JtYXRcbiAgICAgKiBAcmV0dXJucyB0aGUgcGFyc2VkIHJvc3RlclxuICAgICAqL1xuICAgIHN0YXRpYyBmcm9tVE9NTChkYXRhOiBzdHJpbmcpOiBSb3N0ZXIge1xuICAgICAgICBjb25zdCByb3N0ZXIgPSB0b21sLnBhcnNlKGRhdGEpO1xuICAgICAgICBjb25zdCBsaXN0ID0gcm9zdGVyLnNlcnZlcnMubWFwKChzZXJ2ZXI6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qge1B1YmxpYywgU3VpdGUsIEFkZHJlc3MsIERlc2NyaXB0aW9uLCBTZXJ2aWNlcywgVXJsfSA9IHNlcnZlcjtcbiAgICAgICAgICAgIGNvbnN0IHAgPSBQb2ludEZhY3RvcnkuZnJvbVRvbWwoU3VpdGUsIFB1YmxpYyk7XG5cbiAgICAgICAgICAgIHJldHVybiBuZXcgU2VydmVySWRlbnRpdHkoe1xuICAgICAgICAgICAgICAgIGFkZHJlc3M6IEFkZHJlc3MsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IERlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgIHB1YmxpYzogcC50b1Byb3RvKCksXG4gICAgICAgICAgICAgICAgc2VydmljZUlkZW50aXRpZXM6IE9iamVjdC5rZXlzKFNlcnZpY2VzIHx8IHt9KS5tYXAoKGtleSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7UHVibGljOiBwdWIsIFN1aXRlOiBzdWl0ZX0gPSBTZXJ2aWNlc1trZXldO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb2ludCA9IFBvaW50RmFjdG9yeS5mcm9tVG9tbChzdWl0ZSwgcHViKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNlcnZpY2VJZGVudGl0eSh7bmFtZToga2V5LCBwdWJsaWM6IHBvaW50LnRvUHJvdG8oKSwgc3VpdGV9KTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB1cmw6IFVybCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFJvc3Rlcih7bGlzdH0pO1xuICAgIH1cbiAgICByZWFkb25seSBpZDogQnVmZmVyO1xuICAgIHJlYWRvbmx5IGxpc3Q6IFNlcnZlcklkZW50aXR5W107XG4gICAgcmVhZG9ubHkgYWdncmVnYXRlOiBCdWZmZXI7XG4gICAgcHJpdmF0ZSBfYWdnOiBQb2ludDtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BlcnRpZXM/OiBQcm9wZXJ0aWVzPFJvc3Rlcj4pIHtcbiAgICAgICAgc3VwZXIocHJvcGVydGllcyk7XG5cbiAgICAgICAgaWYgKCFwcm9wZXJ0aWVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7aWQsIGxpc3QsIGFnZ3JlZ2F0ZX0gPSBwcm9wZXJ0aWVzO1xuXG4gICAgICAgIGlmICghaWQgfHwgIWFnZ3JlZ2F0ZSkge1xuICAgICAgICAgICAgY29uc3QgaCA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgICAgICAgICBsaXN0LmZvckVhY2goKHNydmlkKSA9PiB7XG4gICAgICAgICAgICAgICAgaC51cGRhdGUoc3J2aWQuZ2V0UHVibGljKCkubWFyc2hhbEJpbmFyeSgpKTtcblxuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgc3J2aWNlSWQgb2Ygc3J2aWQuc2VydmljZUlkZW50aXRpZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaC51cGRhdGUoc3J2aWNlSWQuZ2V0UHVibGljKCkubWFyc2hhbEJpbmFyeSgpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuX2FnZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZ2cgPSBzcnZpZC5nZXRQdWJsaWMoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hZ2cuYWRkKHRoaXMuX2FnZywgc3J2aWQuZ2V0UHVibGljKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBwcm90b2J1ZiBmaWVsZHMgbmVlZCB0byBiZSBpbml0aWFsaXplZCBpZiB3ZSB3YW50IHRvIGVuY29kZSBsYXRlclxuICAgICAgICAgICAgdGhpcy5hZ2dyZWdhdGUgPSB0aGlzLl9hZ2cudG9Qcm90bygpO1xuICAgICAgICAgICAgdGhpcy5pZCA9IEJ1ZmZlci5mcm9tKG5ldyBVVUlEKDUsIFwibnM6VVJMXCIsIGguZGlnZXN0KCkudG9TdHJpbmcoXCJoZXhcIikpLmV4cG9ydCgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcHVibGljIGtleXMgZm9yIGEgZ2l2ZW4gc2VydmljZVxuICAgICAqXG4gICAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIHNlcnZpY2VcbiAgICAgKiBAcmV0dXJucyB0aGUgbGlzdCBvZiBwb2ludHNcbiAgICAgKi9cbiAgICBnZXRTZXJ2aWNlUHVibGljcyhuYW1lOiBzdHJpbmcpOiBQb2ludFtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdC5tYXAoKHNydmlkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0ID0gc3J2aWQuc2VydmljZUlkZW50aXRpZXMuZmluZCgocykgPT4gcy5uYW1lID09PSBuYW1lKTtcblxuICAgICAgICAgICAgcmV0dXJuIFBvaW50RmFjdG9yeS5mcm9tUHJvdG8odC5wdWJsaWMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBsaXN0IG9mIHB1YmxpYyBrZXlzIG9mIHRoZSBjb25vZGVzIGluIHRoZSByb3N0ZXIuXG4gICAgICovXG4gICAgZ2V0UHVibGljcygpOiBQb2ludFtdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdC5tYXAoKHNpKSA9PiBzaS5nZXRQdWJsaWMoKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGEgc3Vic2V0IG9mIHRoZSByb3N0ZXJcbiAgICAgKlxuICAgICAqIEBwYXJhbSBzdGFydCBJbmRleCBvZiB0aGUgZmlyc3QgaWRlbnRpdHlcbiAgICAgKiBAcGFyYW0gZW5kICAgSW5kZXggb2YgdGhlIGxhc3QgaWRlbnRpdHksIG5vdCBpbmNsdXNpdmVcbiAgICAgKiBAcmV0dXJucyB0aGUgbmV3IHJvc3RlclxuICAgICAqL1xuICAgIHNsaWNlKHN0YXJ0OiBudW1iZXIsIGVuZD86IG51bWJlcik6IFJvc3RlciB7XG4gICAgICAgIHJldHVybiBuZXcgUm9zdGVyKHtsaXN0OiB0aGlzLmxpc3Quc2xpY2Uoc3RhcnQsIGVuZCl9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdG8gZW5jb2RlIHRoZSBSb3N0ZXIgdXNpbmcgcHJvdG9idWZcbiAgICAgKiBAcmV0dXJucyB0aGUgYnl0ZXNcbiAgICAgKi9cbiAgICB0b0J5dGVzKCk6IEJ1ZmZlciB7XG4gICAgICAgIHJldHVybiBCdWZmZXIuZnJvbShSb3N0ZXIuZW5jb2RlKHRoaXMpLmZpbmlzaCgpKTtcbiAgICB9XG59XG5cbi8qKlxuICogSWRlbnRpdHkgb2YgYSBjb25vZGVcbiAqL1xuZXhwb3J0IGNsYXNzIFNlcnZlcklkZW50aXR5IGV4dGVuZHMgTWVzc2FnZTxTZXJ2ZXJJZGVudGl0eT4ge1xuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYW4gSFRUUC1TIFVSTCB0byBhIFdlc29ja2V0IFVSTC4gSXQgY29udmVydHMgJ2h0dHAnIHRvICd3cycgYW5kICdodHRwcycgdG8gJ3dzcycuXG4gICAgICogQW55IG90aGVyIHByb3RvY29scyBhcmUgZm9yYmlkZGVuIGFuZCB3aWxsIHJhaXNlIGFuIGVycm9yLiBJdCBhbHNvIHJlbW92ZXMgYW55IHRyYWlsaW5nICcvJy5cbiAgICAgKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzOlxuICAgICAqICAgICAgaHR0cDovL2V4YW1wbGUuY29tOjc3ICAgICAgICA9PiB3czovL2V4YW1wbGUuY29tOjc3XG4gICAgICogICAgICBodHRwczovL2V4YW1wbGUuY29tL3BhdGgvICAgID0+IHdzczpleGFtcGxlLmNvbS9wYXRoXG4gICAgICogICAgICBodHRwczovL2V4YW1wbGUuY29tOjQ0My8gICAgID0+IHdzczpleGFtcGxlLmNvbVxuICAgICAqICAgICAgdGNwOi8vMTI3LjAuMC4xICAgICAgICAgICAgICA9PiBFcnJvclxuICAgICAqIE5vdGU6IEl0IHdpbGwgTk9UIGluY2x1ZGUgdGhlIGdpdmVuIHBvcnQgaW4gdGhlIGNhc2UgaXQncyB0aGUgZGVmYXVsdCBvbmUgKGZvciBleGFtcGxlIDgwIG9yIDQ0MykuXG4gICAgICogTm90ZTogSW4gdGhlIGNhc2UgdGhlcmUgYXJlIG1hbnkgc2xhc2hlcyBhdCB0aGUgZW5kIG9mIHRoZSB1cmwsIGl0IHdpbGwgb25seSByZW1vdmUgb25lLlxuICAgICAqIEBwYXJhbSB1cmwgICB0aGUgZ2l2ZW4gdXJsIGZpZWxkXG4gICAgICogQHJldHVybnMgYSB3ZWJzb2NrZXQgdXJsXG4gICAgICovXG4gICAgc3RhdGljIHVybFRvV2Vic29ja2V0KHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgdXJsUGFyc2VyID0gbmV3IFVSTCh1cmwpO1xuICAgICAgICBzd2l0Y2ggKHVybFBhcnNlci5wcm90b2NvbCkge1xuICAgICAgICAgICAgY2FzZSBcImh0dHA6XCI6IHtcbiAgICAgICAgICAgICAgICB1cmxQYXJzZXIucHJvdG9jb2wgPSBcIndzOlwiO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcImh0dHBzOlwiOiB7XG4gICAgICAgICAgICAgICAgdXJsUGFyc2VyLnByb3RvY29sID0gXCJ3c3M6XCI7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkZWZhdWx0IDoge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSB1cmwgZmllbGQgc2hvdWxkIHVzZSBlaXRoZXIgJ2h0dHA6JyBvciAnaHR0cHM6JywgYnV0IHdlIGZvdW5kIFwiXG4gICAgICAgICAgICAgICAgICAgICsgdXJsUGFyc2VyLnByb3RvY29sKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0ID0gdXJsUGFyc2VyLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmIChyZXN1bHQuc2xpY2UoLTEpID09PSBcIi9cIikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVzdWx0LnNsaWNlKDAsIC0xKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiU2VydmVySWRlbnRpdHlcIiwgU2VydmVySWRlbnRpdHksIFNlcnZpY2VJZGVudGl0eSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdldGhlciB0aGUgYWRkcmVzcyBnaXZlbiBhcyBwYXJhbWV0ZXIgaGFzIHRoZSByaWdodCBmb3JtYXQuXG4gICAgICogQHBhcmFtIGFkZHJlc3MgdGhlIGFkZHJlc3MgdG8gY2hlY2tcbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIGFuZCBvbmx5IGlmIHRoZSBhZGRyZXNzIGhhcyB0aGUgcmlnaHQgZm9ybWF0XG4gICAgICovXG4gICAgc3RhdGljIGlzVmFsaWRBZGRyZXNzKGFkZHJlc3M6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoYWRkcmVzcy5zdGFydHNXaXRoKEJBU0VfVVJMX1RMUykpIHtcbiAgICAgICAgICAgIGNvbnN0IFssIC4uLmFycmF5XSA9IGFkZHJlc3MucmVwbGFjZShCQVNFX1VSTF9UTFMsIFwiXCIpLnNwbGl0KFVSTF9QT1JUX1NQTElUVEVSKTtcblxuICAgICAgICAgICAgaWYgKGFycmF5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvcnQgPSBwYXJzZUludChhcnJheVswXSwgMTApO1xuXG4gICAgICAgICAgICAgICAgLy8gUG9ydCBlcXVhbCB0byBQT1JUX01BWCBpcyBub3QgYWxsb3dlZCBzaW5jZSB0aGUgcG9ydCB3aWxsIGJlXG4gICAgICAgICAgICAgICAgLy8gaW5jcmVhc2VkIGJ5IG9uZSBmb3IgdGhlIHdlYnNvY2tldCB1cmxSZWdpc3RlcmVkLlxuICAgICAgICAgICAgICAgIHJldHVybiBQT1JUX01JTiA8PSBwb3J0ICYmIHBvcnQgPCBQT1JUX01BWDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29udmVydHMgYSBUTFMgVVJMIHRvIGEgV2Vzb2NrZXQgVVJMIGFuZCBidWlsZHMgYSBjb21wbGV0ZSBVUkwgd2l0aCB0aGUgcGF0aCBnaXZlbiBhcyBwYXJhbWV0ZXIuXG4gICAgICogQHBhcmFtIGFkZHJlc3MgICB0aGUgc2VydmVyIGlkZW50aXR5IHRvIHRha2UgdGhlIHVybFJlZ2lzdGVyZWQgZnJvbVxuICAgICAqIEBwYXJhbSBwYXRoICAgICAgdGhlIHBhdGggYWZ0ZXIgdGhlIGJhc2UgdXJsUmVnaXN0ZXJlZFxuICAgICAqIEByZXR1cm5zIGEgd2Vic29ja2V0IGFkZHJlc3NcbiAgICAgKi9cbiAgICBzdGF0aWMgYWRkcmVzc1RvV2Vic29ja2V0KGFkZHJlc3M6IHN0cmluZywgcGF0aDogc3RyaW5nID0gXCJcIik6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IFtpcCwgcG9ydFN0cl0gPSBhZGRyZXNzLnJlcGxhY2UoQkFTRV9VUkxfVExTLCBcIlwiKS5zcGxpdChVUkxfUE9SVF9TUExJVFRFUik7XG4gICAgICAgIGNvbnN0IHBvcnQgPSBwYXJzZUludChwb3J0U3RyLCAxMCkgKyAxO1xuXG4gICAgICAgIHJldHVybiBCQVNFX1VSTF9XUyArIGlwICsgVVJMX1BPUlRfU1BMSVRURVIgKyBwb3J0ICsgcGF0aDtcbiAgICB9XG4gICAgcmVhZG9ubHkgcHVibGljOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgaWQ6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBhZGRyZXNzOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICByZWFkb25seSBzZXJ2aWNlSWRlbnRpdGllczogU2VydmljZUlkZW50aXR5W107XG4gICAgcmVhZG9ubHkgdXJsOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfcG9pbnQ6IFBvaW50O1xuXG4gICAgY29uc3RydWN0b3IocHJvcGVydGllcz86IFByb3BlcnRpZXM8U2VydmVySWRlbnRpdHk+KSB7XG4gICAgICAgIHN1cGVyKHByb3BlcnRpZXMpO1xuXG4gICAgICAgIGlmICghcHJvcGVydGllcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcm9wZXJ0aWVzLmlkKSB7XG4gICAgICAgICAgICBjb25zdCBoZXggPSB0aGlzLmdldFB1YmxpYygpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB0aGlzLmlkID0gQnVmZmVyLmZyb20obmV3IFVVSUQoNSwgXCJuczpVUkxcIiwgYGh0dHBzOi8vZGVkaXMuZXBmbC5jaC9pZC8ke2hleH1gKS5leHBvcnQoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHB1YmxpYyBrZXkgb2YgdGhlIHNlcnZlciBhcyBhIFBvaW50XG4gICAgICogQHJldHVybnMgdGhlIHBvaW50XG4gICAgICovXG4gICAgZ2V0UHVibGljKCk6IFBvaW50IHtcbiAgICAgICAgaWYgKCF0aGlzLl9wb2ludCkge1xuICAgICAgICAgICAgLy8gY2FjaGUgdGhlIHBvaW50IHRvIGF2b2lkIG11bHRpcGxlIHVubWFyc2hhbGluZ1xuICAgICAgICAgICAgdGhpcy5fcG9pbnQgPSBQb2ludEZhY3RvcnkuZnJvbVByb3RvKHRoaXMucHVibGljKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9wb2ludC5jbG9uZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgd2Vic29ja2V0IHZlcnNpb24gb2YgdGhpcy51cmwgaWYgc2V0LCBvdGhlcndpc2UgY29udmVydHMgdGhlIHNlcnZlclxuICAgICAqIGFkZHJlc3MgdG8gbWF0Y2ggdGhlIHdlYnNvY2tldCBmb3JtYXQuXG4gICAgICogQHJldHVybnMgdGhlIHdlYnNvY2tldCBhZGRyZXNzXG4gICAgICovXG4gICAgZ2V0V2ViU29ja2V0QWRkcmVzcygpOiBzdHJpbmcge1xuICAgICAgICBpZiAodGhpcy51cmwpIHtcbiAgICAgICAgICAgIHJldHVybiBTZXJ2ZXJJZGVudGl0eS51cmxUb1dlYnNvY2tldCh0aGlzLnVybCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gU2VydmVySWRlbnRpdHkuYWRkcmVzc1RvV2Vic29ja2V0KHRoaXMuYWRkcmVzcyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogSWRlbnRpdHkgb2YgYSBzZXJ2aWNlIGZvciBhIHNwZWNpZmljIGNvbm9kZS4gU29tZSBzZXJ2aWNlcyBoYXZlIHRoZWlyIG93blxuICoga2V5IHBhaXIgYW5kIGRvbid0IHRoZSBkZWZhdWx0IG9uZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFNlcnZpY2VJZGVudGl0eSBleHRlbmRzIE1lc3NhZ2U8U2VydmljZUlkZW50aXR5PiB7XG5cbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIlNlcnZpY2VJZGVudGl0eVwiLCBTZXJ2aWNlSWRlbnRpdHkpO1xuICAgIH1cbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XG4gICAgcmVhZG9ubHkgc3VpdGU6IHN0cmluZztcbiAgICByZWFkb25seSBwdWJsaWM6IEJ1ZmZlcjtcbiAgICBwcml2YXRlIF9wb2ludDogUG9pbnQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wZXJ0aWVzOiBQcm9wZXJ0aWVzPFNlcnZpY2VJZGVudGl0eT4pIHtcbiAgICAgICAgc3VwZXIocHJvcGVydGllcyk7XG5cbiAgICAgICAgdGhpcy5wdWJsaWMgPSBCdWZmZXIuZnJvbSh0aGlzLnB1YmxpYyB8fCBFTVBUWV9CVUZGRVIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgcHVibGljIGtleSBhcyBhIEt5YmVyIHBvaW50XG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgcHVibGljIGtleVxuICAgICAqL1xuICAgIGdldFB1YmxpYygpOiBQb2ludCB7XG4gICAgICAgIGlmICghdGhpcy5fcG9pbnQpIHtcbiAgICAgICAgICAgIHRoaXMuX3BvaW50ID0gUG9pbnRGYWN0b3J5LmZyb21Qcm90byh0aGlzLnB1YmxpYyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5fcG9pbnQ7XG4gICAgfVxufVxuXG4vLyBSb3N0ZXIucmVnaXN0ZXIoKTtcbi8vIFNlcnZlcklkZW50aXR5LnJlZ2lzdGVyKCk7XG4vLyBTZXJ2aWNlSWRlbnRpdHkucmVnaXN0ZXIoKTtcbiJdfQ==