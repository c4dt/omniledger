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
var protobuf_1 = require("../protobuf");
var ChainConfig = /** @class */ (function (_super) {
    __extends(ChainConfig, _super);
    function ChainConfig(properties) {
        var _this = _super.call(this, properties) || this;
        /* Protobuf aliases */
        Object.defineProperty(_this, "blockinterval", {
            get: function () {
                return this.blockInterval;
            },
            set: function (value) {
                this.blockInterval = value;
            },
        });
        Object.defineProperty(_this, "maxblocksize", {
            get: function () {
                return this.maxBlockSize;
            },
            set: function (value) {
                this.maxBlockSize = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    ChainConfig.register = function () {
        protobuf_1.registerMessage("byzcoin.ChainConfig", ChainConfig);
    };
    /**
     * Create a chain configuration from a known instance
     * @param proof The proof for the instance
     */
    ChainConfig.fromProof = function (proof) {
        return ChainConfig.decode(proof.stateChangeBody.value);
    };
    return ChainConfig;
}(light_1.Message));
exports.default = ChainConfig;
ChainConfig.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUF1RDtBQUV2RCx3Q0FBOEM7QUFHOUM7SUFBeUMsK0JBQW9CO0lBb0J6RCxxQkFBWSxVQUFvQztRQUFoRCxZQUNJLGtCQUFNLFVBQVUsQ0FBQyxTQXFCcEI7UUFuQkcsc0JBQXNCO1FBRXRCLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLGVBQWUsRUFBRTtZQUN6QyxHQUFHLEVBQUg7Z0JBQ0ksT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQzlCLENBQUM7WUFDRCxHQUFHLFlBQUMsS0FBVztnQkFDWCxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztZQUMvQixDQUFDO1NBQ0osQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsY0FBYyxFQUFFO1lBQ3hDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDN0IsQ0FBQztZQUNELEdBQUcsWUFBQyxLQUFhO2dCQUNiLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzlCLENBQUM7U0FDSixDQUFDLENBQUM7O0lBQ1AsQ0FBQztJQXpDRDs7T0FFRztJQUNJLG9CQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLHFCQUFxQixFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRDs7O09BR0c7SUFDSSxxQkFBUyxHQUFoQixVQUFpQixLQUFZO1FBQ3pCLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNELENBQUM7SUE2Qkwsa0JBQUM7QUFBRCxDQUFDLEFBM0NELENBQXlDLGVBQU8sR0EyQy9DOztBQUVELFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IHsgUm9zdGVyIH0gZnJvbSBcIi4uL25ldHdvcmsvcHJvdG9cIjtcbmltcG9ydCB7IHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi9wcm90b2J1ZlwiO1xuaW1wb3J0IFByb29mIGZyb20gXCIuL3Byb29mXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENoYWluQ29uZmlnIGV4dGVuZHMgTWVzc2FnZTxDaGFpbkNvbmZpZz4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiYnl6Y29pbi5DaGFpbkNvbmZpZ1wiLCBDaGFpbkNvbmZpZyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgY2hhaW4gY29uZmlndXJhdGlvbiBmcm9tIGEga25vd24gaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0gcHJvb2YgVGhlIHByb29mIGZvciB0aGUgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBzdGF0aWMgZnJvbVByb29mKHByb29mOiBQcm9vZik6IENoYWluQ29uZmlnIHtcbiAgICAgICAgcmV0dXJuIENoYWluQ29uZmlnLmRlY29kZShwcm9vZi5zdGF0ZUNoYW5nZUJvZHkudmFsdWUpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHJvc3RlcjogUm9zdGVyO1xuICAgIHJlYWRvbmx5IGJsb2NrSW50ZXJ2YWw6IExvbmc7XG4gICAgcmVhZG9ubHkgbWF4QmxvY2tTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wZXJ0aWVzPzogUHJvcGVydGllczxDaGFpbkNvbmZpZz4pIHtcbiAgICAgICAgc3VwZXIocHJvcGVydGllcyk7XG5cbiAgICAgICAgLyogUHJvdG9idWYgYWxpYXNlcyAqL1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImJsb2NraW50ZXJ2YWxcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IExvbmcge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmJsb2NrSW50ZXJ2YWw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBMb25nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ja0ludGVydmFsID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJtYXhibG9ja3NpemVcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IG51bWJlciB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWF4QmxvY2tTaXplO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXhCbG9ja1NpemUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuQ2hhaW5Db25maWcucmVnaXN0ZXIoKTtcbiJdfQ==