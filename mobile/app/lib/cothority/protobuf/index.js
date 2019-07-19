"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var long_1 = __importDefault(require("long"));
var light_1 = require("protobufjs/light");
var log_1 = __importDefault(require("../log"));
var protobuf = __importStar(require("protobufjs/light"));
var models_1 = __importDefault(require("./models"));
/**
 * ProtobufJS uses Uint8Array for a browser environment but we want the Buffer
 * to be available. The following will force the library to use buffer
 * (https://www.npmjs.com/package/buffer) which combines the efficiency of
 * Uint8Array but provide most of the Buffer interface. See README.
 */
if (!protobuf.util.isNode) {
    // The module is needed only for a specific environment so
    // we delay the import
    // tslint:disable-next-line
    var buffer_1 = require('buffer');
    // @ts-ignore
    protobuf.Reader.prototype._slice = buffer_1.Buffer.prototype.slice;
    protobuf.Reader.create = function (buf) { return new light_1.Reader(buffer_1.Buffer.from(buf)); };
    // @ts-ignore
    protobuf.util.Long = long_1.default;
    protobuf.configure();
}
/**
 * Detect a wrong import of the protobufsjs library that could lead
 * to inconsistency at runtime because of different bundles
 */
if (protobuf.build !== "light") {
    throw new Error("expecting to use the light module of protobufs");
}
exports.root = protobuf.Root.fromJSON(models_1.default);
exports.EMPTY_BUFFER = Buffer.allocUnsafe(0);
/**
 * Register the message to be encoded/decoded by protobufjs. The name
 * should match the one in the model and the dependencies of the
 * message should be provided to insure their registration.
 *
 * @param name          The name of the message in the protobuf definition
 * @param ctor          The message class
 * @param dependencies  The message classes of the dependencies
 */
function registerMessage(name, ctor) {
    var dependencies = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        dependencies[_i - 2] = arguments[_i];
    }
    // register the messages used inside the new one
    dependencies.forEach(function (d) {
        // as we can have cycle dependencies, this will deal with them by retarding
        // the registration until everything is defined
        if (d && d.register) {
            d.register();
        }
    });
    var m = exports.root.lookupType(name);
    m.ctor = ctor;
    log_1.default.lvl3("Message registered: " + ctor.name);
}
exports.registerMessage = registerMessage;
/**
 * Add a JSON definition to the existing root
 *
 * @param json The definition imported from a json file
 */
function addJSON(json) {
    exports.root.addJSON(json.nested);
}
exports.addJSON = addJSON;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSw4Q0FBd0I7QUFDeEIsMENBQXNEO0FBQ3RELCtDQUF5QjtBQUV6Qix5REFBNkM7QUFFN0Msb0RBQThCO0FBRTlCOzs7OztHQUtHO0FBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO0lBQ3ZCLDBEQUEwRDtJQUMxRCxzQkFBc0I7SUFDdEIsMkJBQTJCO0lBQzNCLElBQU0sUUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUVqQyxhQUFhO0lBQ2IsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFFBQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztJQUNqRSxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxVQUFDLEdBQUcsSUFBSyxPQUFBLElBQUksY0FBTSxDQUFDLFFBQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQW5DLENBQW1DLENBQUM7SUFFdEUsYUFBYTtJQUNiLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLGNBQUksQ0FBQztJQUMxQixRQUFRLENBQUMsU0FBUyxFQUFFLENBQUM7Q0FDeEI7QUFFRDs7O0dBR0c7QUFDSCxJQUFJLFFBQVEsQ0FBQyxLQUFLLEtBQUssT0FBTyxFQUFFO0lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0RBQWdELENBQUMsQ0FBQztDQUNyRTtBQUVZLFFBQUEsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFNLENBQUMsQ0FBQztBQUV0QyxRQUFBLFlBQVksR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBVWxEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0IsZUFBZSxDQUMzQixJQUFZLEVBQ1osSUFBOEI7SUFDOUIsc0JBQXVDO1NBQXZDLFVBQXVDLEVBQXZDLHFCQUF1QyxFQUF2QyxJQUF1QztRQUF2QyxxQ0FBdUM7O0lBQ3ZDLGdEQUFnRDtJQUNoRCxZQUFZLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztRQUNuQiwyRUFBMkU7UUFDM0UsK0NBQStDO1FBQy9DLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFDakIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2hCO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFNLENBQUMsR0FBRyxZQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRWhDLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBRWQsYUFBRyxDQUFDLElBQUksQ0FBQyx5QkFBdUIsSUFBSSxDQUFDLElBQU0sQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFsQkQsMENBa0JDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxJQUFnQjtJQUNwQyxZQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBRkQsMEJBRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTG9uZyBmcm9tIFwibG9uZ1wiO1xuaW1wb3J0IHsgSU5hbWVzcGFjZSwgUmVhZGVyIH0gZnJvbSBcInByb3RvYnVmanMvbGlnaHRcIjtcbmltcG9ydCBMb2cgZnJvbSBcIi4uL2xvZ1wiO1xuXG5pbXBvcnQgKiBhcyBwcm90b2J1ZiBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuXG5pbXBvcnQgbW9kZWxzIGZyb20gXCIuL21vZGVsc1wiO1xuXG4vKipcbiAqIFByb3RvYnVmSlMgdXNlcyBVaW50OEFycmF5IGZvciBhIGJyb3dzZXIgZW52aXJvbm1lbnQgYnV0IHdlIHdhbnQgdGhlIEJ1ZmZlclxuICogdG8gYmUgYXZhaWxhYmxlLiBUaGUgZm9sbG93aW5nIHdpbGwgZm9yY2UgdGhlIGxpYnJhcnkgdG8gdXNlIGJ1ZmZlclxuICogKGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2J1ZmZlcikgd2hpY2ggY29tYmluZXMgdGhlIGVmZmljaWVuY3kgb2ZcbiAqIFVpbnQ4QXJyYXkgYnV0IHByb3ZpZGUgbW9zdCBvZiB0aGUgQnVmZmVyIGludGVyZmFjZS4gU2VlIFJFQURNRS5cbiAqL1xuaWYgKCFwcm90b2J1Zi51dGlsLmlzTm9kZSkge1xuICAgIC8vIFRoZSBtb2R1bGUgaXMgbmVlZGVkIG9ubHkgZm9yIGEgc3BlY2lmaWMgZW52aXJvbm1lbnQgc29cbiAgICAvLyB3ZSBkZWxheSB0aGUgaW1wb3J0XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gICAgY29uc3QgYnVmZmVyID0gcmVxdWlyZSgnYnVmZmVyJyk7XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHJvdG9idWYuUmVhZGVyLnByb3RvdHlwZS5fc2xpY2UgPSBidWZmZXIuQnVmZmVyLnByb3RvdHlwZS5zbGljZTtcbiAgICBwcm90b2J1Zi5SZWFkZXIuY3JlYXRlID0gKGJ1ZikgPT4gbmV3IFJlYWRlcihidWZmZXIuQnVmZmVyLmZyb20oYnVmKSk7XG5cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcHJvdG9idWYudXRpbC5Mb25nID0gTG9uZztcbiAgICBwcm90b2J1Zi5jb25maWd1cmUoKTtcbn1cblxuLyoqXG4gKiBEZXRlY3QgYSB3cm9uZyBpbXBvcnQgb2YgdGhlIHByb3RvYnVmc2pzIGxpYnJhcnkgdGhhdCBjb3VsZCBsZWFkXG4gKiB0byBpbmNvbnNpc3RlbmN5IGF0IHJ1bnRpbWUgYmVjYXVzZSBvZiBkaWZmZXJlbnQgYnVuZGxlc1xuICovXG5pZiAocHJvdG9idWYuYnVpbGQgIT09IFwibGlnaHRcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImV4cGVjdGluZyB0byB1c2UgdGhlIGxpZ2h0IG1vZHVsZSBvZiBwcm90b2J1ZnNcIik7XG59XG5cbmV4cG9ydCBjb25zdCByb290ID0gcHJvdG9idWYuUm9vdC5mcm9tSlNPTihtb2RlbHMpO1xuXG5leHBvcnQgY29uc3QgRU1QVFlfQlVGRkVSID0gQnVmZmVyLmFsbG9jVW5zYWZlKDApO1xuXG5pbnRlcmZhY2UgSVJlZ2lzdHJhdGlvbk1lc3NhZ2UgZXh0ZW5kcyBwcm90b2J1Zi5Db25zdHJ1Y3Rvcjx7fT4ge1xuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIHRoZSBtZXNzYWdlIHRvIGJlIHVzZWQgYXMgdGhlIGRlZmF1bHQgY2xhc3MgZm9yXG4gICAgICogdGhlIGdpdmVuIHByb3RvYnVmIHR5cGVcbiAgICAgKi9cbiAgICByZWdpc3RlcigpOiB2b2lkO1xufVxuXG4vKipcbiAqIFJlZ2lzdGVyIHRoZSBtZXNzYWdlIHRvIGJlIGVuY29kZWQvZGVjb2RlZCBieSBwcm90b2J1ZmpzLiBUaGUgbmFtZVxuICogc2hvdWxkIG1hdGNoIHRoZSBvbmUgaW4gdGhlIG1vZGVsIGFuZCB0aGUgZGVwZW5kZW5jaWVzIG9mIHRoZVxuICogbWVzc2FnZSBzaG91bGQgYmUgcHJvdmlkZWQgdG8gaW5zdXJlIHRoZWlyIHJlZ2lzdHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gbmFtZSAgICAgICAgICBUaGUgbmFtZSBvZiB0aGUgbWVzc2FnZSBpbiB0aGUgcHJvdG9idWYgZGVmaW5pdGlvblxuICogQHBhcmFtIGN0b3IgICAgICAgICAgVGhlIG1lc3NhZ2UgY2xhc3NcbiAqIEBwYXJhbSBkZXBlbmRlbmNpZXMgIFRoZSBtZXNzYWdlIGNsYXNzZXMgb2YgdGhlIGRlcGVuZGVuY2llc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJNZXNzYWdlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBjdG9yOiBwcm90b2J1Zi5Db25zdHJ1Y3Rvcjx7fT4sXG4gICAgLi4uZGVwZW5kZW5jaWVzOiBJUmVnaXN0cmF0aW9uTWVzc2FnZVtdKTogdm9pZCB7XG4gICAgLy8gcmVnaXN0ZXIgdGhlIG1lc3NhZ2VzIHVzZWQgaW5zaWRlIHRoZSBuZXcgb25lXG4gICAgZGVwZW5kZW5jaWVzLmZvckVhY2goKGQpID0+IHtcbiAgICAgICAgLy8gYXMgd2UgY2FuIGhhdmUgY3ljbGUgZGVwZW5kZW5jaWVzLCB0aGlzIHdpbGwgZGVhbCB3aXRoIHRoZW0gYnkgcmV0YXJkaW5nXG4gICAgICAgIC8vIHRoZSByZWdpc3RyYXRpb24gdW50aWwgZXZlcnl0aGluZyBpcyBkZWZpbmVkXG4gICAgICAgIGlmIChkICYmIGQucmVnaXN0ZXIpIHtcbiAgICAgICAgICAgIGQucmVnaXN0ZXIoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgbSA9IHJvb3QubG9va3VwVHlwZShuYW1lKTtcblxuICAgIG0uY3RvciA9IGN0b3I7XG5cbiAgICBMb2cubHZsMyhgTWVzc2FnZSByZWdpc3RlcmVkOiAke2N0b3IubmFtZX1gKTtcbn1cblxuLyoqXG4gKiBBZGQgYSBKU09OIGRlZmluaXRpb24gdG8gdGhlIGV4aXN0aW5nIHJvb3RcbiAqXG4gKiBAcGFyYW0ganNvbiBUaGUgZGVmaW5pdGlvbiBpbXBvcnRlZCBmcm9tIGEganNvbiBmaWxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRKU09OKGpzb246IElOYW1lc3BhY2UpOiB2b2lkIHtcbiAgICByb290LmFkZEpTT04oanNvbi5uZXN0ZWQpO1xufVxuIl19