"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var buffer_1 = require("buffer/");
var util_1 = __importDefault(require("util"));
var defaultLvl = 2;
var lvlStr = ["E ", "W ", "I ", "!4", "!3", "!2", "!1", "P ", " 1", " 2", " 3", " 4"];
var Logger = /** @class */ (function () {
    function Logger(lvl) {
        this.out = function () {
            var str = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                str[_i] = arguments[_i];
            }
            // tslint:disable-next-line
            console.log(str.join(" "));
        };
        this._lvl = lvl === undefined ? defaultLvl : lvl;
    }
    Object.defineProperty(Logger.prototype, "lvl", {
        get: function () {
            return this._lvl;
        },
        set: function (l) {
            this._lvl = l;
        },
        enumerable: true,
        configurable: true
    });
    Logger.prototype.joinArgs = function (args) {
        var _this = this;
        return args.map(function (a) {
            if (typeof a === "string") {
                return a;
            }
            if (a == null) {
                return "null";
            }
            try {
                // return JSON.stringify(a, undefined, 4);
                var type = typeof a;
                if (a === Object(a)) {
                    if (a.constructor) {
                        type = a.constructor.name;
                    }
                }
                else if (type === "o") {
                    // tslint:disable-next-line
                    console.dir(a);
                }
                // Have some special cases for the content
                var content = "unparsable";
                if (a.toString) {
                    content = a.toString();
                }
                console.log(util_1.default.inspect(a));
                if (type === "Uint8Array" || type === "Buffer") {
                    content = buffer_1.Buffer.from(a).toString("hex");
                }
                else if (content === "[object Object]" || content === "unparsable") {
                    content = util_1.default.inspect(a);
                }
                return "{" + type + "}: " + content;
            }
            catch (e) {
                // tslint:disable-next-line
                _this.out("error while inspecting:", e);
                return a;
            }
        }).join(" ");
    };
    Logger.prototype.printCaller = function (err, i) {
        try {
            var stack = err.stack.split("\n");
            var method = stack[i].trim().replace(/^at */, "").split("(");
            var module_1 = "unknown";
            var file = method[0].replace(/^.*\//g, "");
            if (method.length > 1) {
                module_1 = method[0];
                file = method[1].replace(/^.*\/|\)$/g, "");
            }
            // @ts-ignore
            return (file).padEnd(20);
        }
        catch (e) {
            return this.printCaller(new Error("Couldn't get stack - " + e), i + 2);
        }
    };
    Logger.prototype.printLvl = function (l, args) {
        var indent = Math.abs(l);
        indent = indent >= 5 ? 0 : indent;
        if (l <= this._lvl) {
            // tslint:disable-next-line
            this.out(lvlStr[l + 7] + ": " + this.printCaller(new Error(), 3) +
                " -> " + " ".repeat(indent * 2) + this.joinArgs(args));
        }
    };
    Logger.prototype.print = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(0, args);
    };
    Logger.prototype.lvl1 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(1, args);
    };
    Logger.prototype.lvl2 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(2, args);
    };
    Logger.prototype.lvl3 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(3, args);
    };
    Logger.prototype.lvl4 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(4, args);
    };
    Logger.prototype.llvl1 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-1, args);
    };
    Logger.prototype.llvl2 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-2, args);
    };
    Logger.prototype.llvl3 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-3, args);
    };
    Logger.prototype.llvl4 = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-4, args);
    };
    Logger.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-5, args);
    };
    Logger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-6, args);
    };
    Logger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.printLvl(-7, args);
    };
    Logger.prototype.catch = function (e) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var errMsg = e;
        if (e.message) {
            errMsg = e.message;
        }
        if (e.stack) {
            for (var i = 1; i < e.stack.split("\n").length; i++) {
                if (i > 1) {
                    errMsg = "";
                }
                this.out("C : " + this.printCaller(e, i) + " -> (" + errMsg + ") " +
                    this.joinArgs(args));
            }
        }
        else {
            this.out("C : " + this.printCaller(e, 1) + " -> (" + errMsg + ") " +
                this.joinArgs(args));
        }
    };
    Logger.prototype.rcatch = function (e) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var errMsg = e;
        if (e.message) {
            errMsg = e.message;
        }
        if (e.stack) {
            for (var i = 1; i < e.stack.split("\n").length; i++) {
                if (i > 1) {
                    errMsg = "";
                }
                this.out("C : " + this.printCaller(e, i) + " -> (" + errMsg + ") " +
                    this.joinArgs(args));
            }
        }
        else {
            this.out("C : " + this.printCaller(e, 1) + " -> (" + errMsg + ") " +
                this.joinArgs(args));
        }
        return Promise.reject(errMsg.toString().replace(/Error: /, ""));
    };
    return Logger;
}());
exports.Logger = Logger;
// tslint:disable-next-line
var Log = new Logger(2);
exports.default = Log;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsa0NBQWlDO0FBQ2pDLDhDQUF3QjtBQUV4QixJQUFNLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFFckIsSUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXhGO0lBRUksZ0JBQVksR0FBVztRQWN2QixRQUFHLEdBQUc7WUFBQyxhQUFnQjtpQkFBaEIsVUFBZ0IsRUFBaEIscUJBQWdCLEVBQWhCLElBQWdCO2dCQUFoQix3QkFBZ0I7O1lBQ25CLDJCQUEyQjtZQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDLENBQUM7UUFoQkUsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUNyRCxDQUFDO0lBSUQsc0JBQUksdUJBQUc7YUFBUDtZQUNJLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztRQUNyQixDQUFDO2FBRUQsVUFBUSxDQUFDO1lBQ0wsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDbEIsQ0FBQzs7O09BSkE7SUFXRCx5QkFBUSxHQUFSLFVBQVMsSUFBUztRQUFsQixpQkF1Q0M7UUF0Q0csT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBTTtZQUNuQixJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDdkIsT0FBTyxDQUFDLENBQUM7YUFDWjtZQUNELElBQUksQ0FBQyxJQUFJLElBQUksRUFBRTtn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SyxjQUFZO2FBQVosVUFBWSxFQUFaLHFCQUFZLEVBQVosSUFBWTtZQUFaLHlCQUFZOztRQUNiLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQU0sY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQU0sY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQU0sY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQU0sY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxxQkFBSSxHQUFKO1FBQUssY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDYixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxxQkFBSSxHQUFKO1FBQUssY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDYixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxzQkFBSyxHQUFMO1FBQU0sY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFFRCxzQkFBSyxHQUFMLFVBQU0sQ0FBbUI7UUFBRSxjQUFZO2FBQVosVUFBWSxFQUFaLHFCQUFZLEVBQVosSUFBWTtZQUFaLDZCQUFZOztRQUNuQyxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDZixJQUFLLENBQVcsQ0FBQyxPQUFPLEVBQUU7WUFDdEIsTUFBTSxHQUFJLENBQVcsQ0FBQyxPQUFPLENBQUM7U0FDakM7UUFDRCxJQUFLLENBQVcsQ0FBQyxLQUFLLEVBQUU7WUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFJLENBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDNUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNQLE1BQU0sR0FBRyxFQUFFLENBQUM7aUJBQ2Y7Z0JBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLE1BQU0sR0FBRyxJQUFJO29CQUM5RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDNUI7U0FDSjthQUFNO1lBQ0gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsT0FBTyxHQUFHLE1BQU0sR0FBRyxJQUFJO2dCQUM5RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDNUI7SUFDTCxDQUFDO0lBRUQsdUJBQU0sR0FBTixVQUFPLENBQW1CO1FBQUUsY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWiw2QkFBWTs7UUFDcEMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSyxDQUFXLENBQUMsT0FBTyxFQUFFO1lBQ3RCLE1BQU0sR0FBSSxDQUFXLENBQUMsT0FBTyxDQUFDO1NBQ2pDO1FBQ0QsSUFBSyxDQUFXLENBQUMsS0FBSyxFQUFFO1lBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBSSxDQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDUCxNQUFNLEdBQUcsRUFBRSxDQUFDO2lCQUNmO2dCQUNELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsSUFBSTtvQkFDOUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2FBQzVCO1NBQ0o7YUFBTTtZQUNILElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxNQUFNLEdBQUcsSUFBSTtnQkFDOUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQzVCO1FBQ0QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUNMLGFBQUM7QUFBRCxDQUFDLEFBaExELElBZ0xDO0FBaExZLHdCQUFNO0FBa0xuQiwyQkFBMkI7QUFDM0IsSUFBSSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsa0JBQWUsR0FBRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlci9cIjtcbmltcG9ydCB1dGlsIGZyb20gXCJ1dGlsXCI7XG5cbmNvbnN0IGRlZmF1bHRMdmwgPSAyO1xuXG5jb25zdCBsdmxTdHIgPSBbXCJFIFwiLCBcIlcgXCIsIFwiSSBcIiwgXCIhNFwiLCBcIiEzXCIsIFwiITJcIiwgXCIhMVwiLCBcIlAgXCIsIFwiIDFcIiwgXCIgMlwiLCBcIiAzXCIsIFwiIDRcIl07XG5cbmV4cG9ydCBjbGFzcyBMb2dnZXIge1xuXG4gICAgY29uc3RydWN0b3IobHZsOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbHZsID0gbHZsID09PSB1bmRlZmluZWQgPyBkZWZhdWx0THZsIDogbHZsO1xuICAgIH1cblxuICAgIF9sdmw6IG51bWJlcjtcblxuICAgIGdldCBsdmwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9sdmw7XG4gICAgfVxuXG4gICAgc2V0IGx2bChsKSB7XG4gICAgICAgIHRoaXMuX2x2bCA9IGw7XG4gICAgfVxuXG4gICAgb3V0ID0gKC4uLnN0cjogc3RyaW5nW10pID0+IHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgIGNvbnNvbGUubG9nKHN0ci5qb2luKFwiIFwiKSk7XG4gICAgfTtcblxuICAgIGpvaW5BcmdzKGFyZ3M6IGFueSkge1xuICAgICAgICByZXR1cm4gYXJncy5tYXAoKGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYSwgdW5kZWZpbmVkLCA0KTtcbiAgICAgICAgICAgICAgICBsZXQgdHlwZTogc3RyaW5nID0gdHlwZW9mIGE7XG4gICAgICAgICAgICAgICAgaWYgKGEgPT09IE9iamVjdChhKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYS5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA9IGEuY29uc3RydWN0b3IubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJvXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEhhdmUgc29tZSBzcGVjaWFsIGNhc2VzIGZvciB0aGUgY29udGVudFxuICAgICAgICAgICAgICAgIGxldCBjb250ZW50ID0gXCJ1bnBhcnNhYmxlXCI7XG4gICAgICAgICAgICAgICAgaWYgKGEudG9TdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGEudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codXRpbC5pbnNwZWN0KGEpKVxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSBcIlVpbnQ4QXJyYXlcIiB8fCB0eXBlID09PSBcIkJ1ZmZlclwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBCdWZmZXIuZnJvbShhKS50b1N0cmluZyhcImhleFwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbnRlbnQgPT09IFwiW29iamVjdCBPYmplY3RdXCIgfHwgY29udGVudCA9PT0gXCJ1bnBhcnNhYmxlXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHV0aWwuaW5zcGVjdChhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwie1wiICsgdHlwZSArIFwifTogXCIgKyBjb250ZW50O1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuICAgICAgICAgICAgICAgIHRoaXMub3V0KFwiZXJyb3Igd2hpbGUgaW5zcGVjdGluZzpcIiwgZSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuam9pbihcIiBcIik7XG4gICAgfVxuXG4gICAgcHJpbnRDYWxsZXIoZXJyOiAoRXJyb3IgfCBzdHJpbmcpLCBpOiBudW1iZXIpOiBhbnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc3RhY2sgPSAoZXJyIGFzIEVycm9yKS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgICAgIGNvbnN0IG1ldGhvZCA9IHN0YWNrW2ldLnRyaW0oKS5yZXBsYWNlKC9eYXQgKi8sIFwiXCIpLnNwbGl0KFwiKFwiKTtcbiAgICAgICAgICAgIGxldCBtb2R1bGUgPSBcInVua25vd25cIjtcbiAgICAgICAgICAgIGxldCBmaWxlID0gbWV0aG9kWzBdLnJlcGxhY2UoL14uKlxcLy9nLCBcIlwiKTtcbiAgICAgICAgICAgIGlmIChtZXRob2QubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIG1vZHVsZSA9IG1ldGhvZFswXTtcbiAgICAgICAgICAgICAgICBmaWxlID0gbWV0aG9kWzFdLnJlcGxhY2UoL14uKlxcL3xcXCkkL2csIFwiXCIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICByZXR1cm4gKGZpbGUpLnBhZEVuZCgyMCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByaW50Q2FsbGVyKG5ldyBFcnJvcihcIkNvdWxkbid0IGdldCBzdGFjayAtIFwiICsgZSksIGkgKyAyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaW50THZsKGw6IG51bWJlciwgYXJnczogYW55KSB7XG4gICAgICAgIGxldCBpbmRlbnQgPSBNYXRoLmFicyhsKTtcbiAgICAgICAgaW5kZW50ID0gaW5kZW50ID49IDUgPyAwIDogaW5kZW50O1xuICAgICAgICBpZiAobCA8PSB0aGlzLl9sdmwpIHtcbiAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuICAgICAgICAgICAgdGhpcy5vdXQobHZsU3RyW2wgKyA3XSArIFwiOiBcIiArIHRoaXMucHJpbnRDYWxsZXIobmV3IEVycm9yKCksIDMpICtcbiAgICAgICAgICAgICAgICBcIiAtPiBcIiArIFwiIFwiLnJlcGVhdChpbmRlbnQgKiAyKSArIHRoaXMuam9pbkFyZ3MoYXJncykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpbnQoLi4uYXJnczogYW55KSB7XG4gICAgICAgIHRoaXMucHJpbnRMdmwoMCwgYXJncyk7XG4gICAgfVxuXG4gICAgbHZsMSguLi5hcmdzOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wcmludEx2bCgxLCBhcmdzKTtcbiAgICB9XG5cbiAgICBsdmwyKC4uLmFyZ3M6IGFueSkge1xuICAgICAgICB0aGlzLnByaW50THZsKDIsIGFyZ3MpO1xuICAgIH1cblxuICAgIGx2bDMoLi4uYXJnczogYW55KSB7XG4gICAgICAgIHRoaXMucHJpbnRMdmwoMywgYXJncyk7XG4gICAgfVxuXG4gICAgbHZsNCguLi5hcmdzOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wcmludEx2bCg0LCBhcmdzKTtcbiAgICB9XG5cbiAgICBsbHZsMSguLi5hcmdzOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wcmludEx2bCgtMSwgYXJncyk7XG4gICAgfVxuXG4gICAgbGx2bDIoLi4uYXJnczogYW55KSB7XG4gICAgICAgIHRoaXMucHJpbnRMdmwoLTIsIGFyZ3MpO1xuICAgIH1cblxuICAgIGxsdmwzKC4uLmFyZ3M6IGFueSkge1xuICAgICAgICB0aGlzLnByaW50THZsKC0zLCBhcmdzKTtcbiAgICB9XG5cbiAgICBsbHZsNCguLi5hcmdzOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wcmludEx2bCgtNCwgYXJncyk7XG4gICAgfVxuXG4gICAgaW5mbyguLi5hcmdzOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wcmludEx2bCgtNSwgYXJncyk7XG4gICAgfVxuXG4gICAgd2FybiguLi5hcmdzOiBhbnkpIHtcbiAgICAgICAgdGhpcy5wcmludEx2bCgtNiwgYXJncyk7XG4gICAgfVxuXG4gICAgZXJyb3IoLi4uYXJnczogYW55KSB7XG4gICAgICAgIHRoaXMucHJpbnRMdmwoLTcsIGFyZ3MpO1xuICAgIH1cblxuICAgIGNhdGNoKGU6IChFcnJvciB8IHN0cmluZyksIC4uLmFyZ3M6IGFueSkge1xuICAgICAgICBsZXQgZXJyTXNnID0gZTtcbiAgICAgICAgaWYgKChlIGFzIEVycm9yKS5tZXNzYWdlKSB7XG4gICAgICAgICAgICBlcnJNc2cgPSAoZSBhcyBFcnJvcikubWVzc2FnZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKGUgYXMgRXJyb3IpLnN0YWNrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IChlIGFzIEVycm9yKS5zdGFjay5zcGxpdChcIlxcblwiKS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChpID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBlcnJNc2cgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLm91dChcIkMgOiBcIiArIHRoaXMucHJpbnRDYWxsZXIoZSwgaSkgKyBcIiAtPiAoXCIgKyBlcnJNc2cgKyBcIikgXCIgK1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmpvaW5BcmdzKGFyZ3MpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMub3V0KFwiQyA6IFwiICsgdGhpcy5wcmludENhbGxlcihlLCAxKSArIFwiIC0+IChcIiArIGVyck1zZyArIFwiKSBcIiArXG4gICAgICAgICAgICAgICAgdGhpcy5qb2luQXJncyhhcmdzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByY2F0Y2goZTogKEVycm9yIHwgc3RyaW5nKSwgLi4uYXJnczogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IGVyck1zZyA9IGU7XG4gICAgICAgIGlmICgoZSBhcyBFcnJvcikubWVzc2FnZSkge1xuICAgICAgICAgICAgZXJyTXNnID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKChlIGFzIEVycm9yKS5zdGFjaykge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCAoZSBhcyBFcnJvcikuc3RhY2suc3BsaXQoXCJcXG5cIikubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyTXNnID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5vdXQoXCJDIDogXCIgKyB0aGlzLnByaW50Q2FsbGVyKGUsIGkpICsgXCIgLT4gKFwiICsgZXJyTXNnICsgXCIpIFwiICtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5qb2luQXJncyhhcmdzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm91dChcIkMgOiBcIiArIHRoaXMucHJpbnRDYWxsZXIoZSwgMSkgKyBcIiAtPiAoXCIgKyBlcnJNc2cgKyBcIikgXCIgK1xuICAgICAgICAgICAgICAgIHRoaXMuam9pbkFyZ3MoYXJncykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJNc2cudG9TdHJpbmcoKS5yZXBsYWNlKC9FcnJvcjogLywgXCJcIikpO1xuICAgIH1cbn1cblxuLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lXG5sZXQgTG9nID0gbmV3IExvZ2dlcigyKTtcbmV4cG9ydCBkZWZhdWx0IExvZztcbiJdfQ==