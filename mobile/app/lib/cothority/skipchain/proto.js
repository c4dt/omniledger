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
var skipblock_1 = require("./skipblock");
var GetAllSkipChainIDs = /** @class */ (function (_super) {
    __extends(GetAllSkipChainIDs, _super);
    function GetAllSkipChainIDs() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    GetAllSkipChainIDs.register = function () {
        protobuf_1.registerMessage("GetAllSkipChainIDs", GetAllSkipChainIDs);
    };
    return GetAllSkipChainIDs;
}(light_1.Message));
exports.GetAllSkipChainIDs = GetAllSkipChainIDs;
var GetAllSkipChainIDsReply = /** @class */ (function (_super) {
    __extends(GetAllSkipChainIDsReply, _super);
    function GetAllSkipChainIDsReply(props) {
        var _this = _super.call(this, props) || this;
        _this.skipChainIDs = _this.skipChainIDs || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetAllSkipChainIDsReply.register = function () {
        protobuf_1.registerMessage("GetAllSkipChainIDsReply", GetAllSkipChainIDsReply);
    };
    return GetAllSkipChainIDsReply;
}(light_1.Message));
exports.GetAllSkipChainIDsReply = GetAllSkipChainIDsReply;
var StoreSkipBlock = /** @class */ (function (_super) {
    __extends(StoreSkipBlock, _super);
    function StoreSkipBlock(properties) {
        var _this = _super.call(this, properties) || this;
        _this.targetSkipChainID = Buffer.from(_this.targetSkipChainID || protobuf_1.EMPTY_BUFFER);
        _this.signature = Buffer.from(_this.signature || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    StoreSkipBlock.register = function () {
        protobuf_1.registerMessage("StoreSkipBlock", StoreSkipBlock, skipblock_1.SkipBlock);
    };
    return StoreSkipBlock;
}(light_1.Message));
exports.StoreSkipBlock = StoreSkipBlock;
var StoreSkipBlockReply = /** @class */ (function (_super) {
    __extends(StoreSkipBlockReply, _super);
    function StoreSkipBlockReply() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    StoreSkipBlockReply.register = function () {
        protobuf_1.registerMessage("StoreSkipBlockReply", StoreSkipBlockReply, skipblock_1.SkipBlock);
    };
    return StoreSkipBlockReply;
}(light_1.Message));
exports.StoreSkipBlockReply = StoreSkipBlockReply;
var GetSingleBlock = /** @class */ (function (_super) {
    __extends(GetSingleBlock, _super);
    function GetSingleBlock(props) {
        var _this = _super.call(this, props) || this;
        _this.id = Buffer.from(_this.id || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetSingleBlock.register = function () {
        protobuf_1.registerMessage("GetSingleBlock", GetSingleBlock);
    };
    return GetSingleBlock;
}(light_1.Message));
exports.GetSingleBlock = GetSingleBlock;
var GetSingleBlockByIndex = /** @class */ (function (_super) {
    __extends(GetSingleBlockByIndex, _super);
    function GetSingleBlockByIndex(props) {
        var _this = _super.call(this, props) || this;
        _this.genesis = Buffer.from(_this.genesis || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetSingleBlockByIndex.register = function () {
        protobuf_1.registerMessage("GetSingleBlockByIndex", GetSingleBlockByIndex);
    };
    return GetSingleBlockByIndex;
}(light_1.Message));
exports.GetSingleBlockByIndex = GetSingleBlockByIndex;
var GetSingleBlockByIndexReply = /** @class */ (function (_super) {
    __extends(GetSingleBlockByIndexReply, _super);
    function GetSingleBlockByIndexReply(props) {
        var _this = _super.call(this, props) || this;
        _this.links = _this.links || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetSingleBlockByIndexReply.register = function () {
        protobuf_1.registerMessage("GetSingleBlockByIndexReply", GetSingleBlockByIndexReply);
    };
    return GetSingleBlockByIndexReply;
}(light_1.Message));
exports.GetSingleBlockByIndexReply = GetSingleBlockByIndexReply;
var GetUpdateChain = /** @class */ (function (_super) {
    __extends(GetUpdateChain, _super);
    function GetUpdateChain(props) {
        var _this = _super.call(this, props) || this;
        _this.latestID = Buffer.from(_this.latestID || protobuf_1.EMPTY_BUFFER);
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetUpdateChain.register = function () {
        protobuf_1.registerMessage("GetUpdateChain", GetUpdateChain);
    };
    return GetUpdateChain;
}(light_1.Message));
exports.GetUpdateChain = GetUpdateChain;
var GetUpdateChainReply = /** @class */ (function (_super) {
    __extends(GetUpdateChainReply, _super);
    function GetUpdateChainReply(props) {
        var _this = _super.call(this, props) || this;
        _this.update = _this.update || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetUpdateChainReply.register = function () {
        protobuf_1.registerMessage("GetUpdateChainReply", GetUpdateChainReply, skipblock_1.SkipBlock);
    };
    return GetUpdateChainReply;
}(light_1.Message));
exports.GetUpdateChainReply = GetUpdateChainReply;
GetAllSkipChainIDs.register();
GetAllSkipChainIDsReply.register();
StoreSkipBlock.register();
StoreSkipBlockReply.register();
GetSingleBlock.register();
GetSingleBlockByIndex.register();
GetSingleBlockByIndexReply.register();
GetUpdateChain.register();
GetUpdateChainReply.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdG8uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm90by50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBdUQ7QUFDdkQsd0NBQTREO0FBQzVELHlDQUFxRDtBQUVyRDtJQUF3QyxzQ0FBMkI7SUFBbkU7O0lBT0EsQ0FBQztJQU5HOztPQUVHO0lBQ0ksMkJBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsb0JBQW9CLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBQ0wseUJBQUM7QUFBRCxDQUFDLEFBUEQsQ0FBd0MsZUFBTyxHQU85QztBQVBZLGdEQUFrQjtBQVMvQjtJQUE2QywyQ0FBZ0M7SUFVekUsaUNBQVksS0FBMkM7UUFBdkQsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0FHZjtRQURHLEtBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSSxDQUFDLFlBQVksSUFBSSxFQUFFLENBQUM7O0lBQ2hELENBQUM7SUFiRDs7T0FFRztJQUNJLGdDQUFRLEdBQWY7UUFDSSwwQkFBZSxDQUFDLHlCQUF5QixFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFDeEUsQ0FBQztJQVNMLDhCQUFDO0FBQUQsQ0FBQyxBQWZELENBQTZDLGVBQU8sR0FlbkQ7QUFmWSwwREFBdUI7QUFpQnBDO0lBQW9DLGtDQUF1QjtJQVl2RCx3QkFBWSxVQUFzQztRQUFsRCxZQUNJLGtCQUFNLFVBQVUsQ0FBQyxTQUlwQjtRQUZHLEtBQUksQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxpQkFBaUIsSUFBSSx1QkFBWSxDQUFDLENBQUM7UUFDN0UsS0FBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUksQ0FBQyxTQUFTLElBQUksdUJBQVksQ0FBQyxDQUFDOztJQUNqRSxDQUFDO0lBaEJEOztPQUVHO0lBQ0ksdUJBQVEsR0FBZjtRQUNJLDBCQUFlLENBQUMsZ0JBQWdCLEVBQUUs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RUFBRSxDQUFDO0FBQ25DLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUMxQixtQkFBbUIsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUMvQixjQUFjLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUIscUJBQXFCLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDakMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDdEMsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzFCLG1CQUFtQixDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWVzc2FnZSwgUHJvcGVydGllcyB9IGZyb20gXCJwcm90b2J1ZmpzL2xpZ2h0XCI7XG5pbXBvcnQgeyBFTVBUWV9CVUZGRVIsIHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi9wcm90b2J1ZlwiO1xuaW1wb3J0IHsgRm9yd2FyZExpbmssIFNraXBCbG9jayB9IGZyb20gXCIuL3NraXBibG9ja1wiO1xuXG5leHBvcnQgY2xhc3MgR2V0QWxsU2tpcENoYWluSURzIGV4dGVuZHMgTWVzc2FnZTxHZXRBbGxTa2lwQ2hhaW5JRHM+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkdldEFsbFNraXBDaGFpbklEc1wiLCBHZXRBbGxTa2lwQ2hhaW5JRHMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldEFsbFNraXBDaGFpbklEc1JlcGx5IGV4dGVuZHMgTWVzc2FnZTxHZXRBbGxTa2lwQ2hhaW5JRHNSZXBseT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiR2V0QWxsU2tpcENoYWluSURzUmVwbHlcIiwgR2V0QWxsU2tpcENoYWluSURzUmVwbHkpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHNraXBDaGFpbklEczogQnVmZmVyW107XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8R2V0QWxsU2tpcENoYWluSURzUmVwbHk+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnNraXBDaGFpbklEcyA9IHRoaXMuc2tpcENoYWluSURzIHx8IFtdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0b3JlU2tpcEJsb2NrIGV4dGVuZHMgTWVzc2FnZTxTdG9yZVNraXBCbG9jaz4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiU3RvcmVTa2lwQmxvY2tcIiwgU3RvcmVTa2lwQmxvY2ssIFNraXBCbG9jayk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgdGFyZ2V0U2tpcENoYWluSUQ6IEJ1ZmZlcjtcbiAgICByZWFkb25seSBuZXdCbG9jazogU2tpcEJsb2NrO1xuICAgIHJlYWRvbmx5IHNpZ25hdHVyZTogQnVmZmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvcGVydGllczogUHJvcGVydGllczxTdG9yZVNraXBCbG9jaz4pIHtcbiAgICAgICAgc3VwZXIocHJvcGVydGllcyk7XG5cbiAgICAgICAgdGhpcy50YXJnZXRTa2lwQ2hhaW5JRCA9IEJ1ZmZlci5mcm9tKHRoaXMudGFyZ2V0U2tpcENoYWluSUQgfHwgRU1QVFlfQlVGRkVSKTtcbiAgICAgICAgdGhpcy5zaWduYXR1cmUgPSBCdWZmZXIuZnJvbSh0aGlzLnNpZ25hdHVyZSB8fCBFTVBUWV9CVUZGRVIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0b3JlU2tpcEJsb2NrUmVwbHkgZXh0ZW5kcyBNZXNzYWdlPFN0b3JlU2tpcEJsb2NrPiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJTdG9yZVNraXBCbG9ja1JlcGx5XCIsIFN0b3JlU2tpcEJsb2NrUmVwbHksIFNraXBCbG9jayk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgbGF0ZXN0OiBTa2lwQmxvY2s7XG4gICAgcmVhZG9ubHkgcHJldmlvdXM6IFNraXBCbG9jaztcbn1cblxuZXhwb3J0IGNsYXNzIEdldFNpbmdsZUJsb2NrIGV4dGVuZHMgTWVzc2FnZTxHZXRTaW5nbGVCbG9jaz4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiR2V0U2luZ2xlQmxvY2tcIiwgR2V0U2luZ2xlQmxvY2spO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGlkOiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8R2V0U2luZ2xlQmxvY2s+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmlkID0gQnVmZmVyLmZyb20odGhpcy5pZCB8fCBFTVBUWV9CVUZGRVIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldFNpbmdsZUJsb2NrQnlJbmRleCBleHRlbmRzIE1lc3NhZ2U8R2V0U2luZ2xlQmxvY2tCeUluZGV4PiB7XG4gICAgLyoqXG4gICAgICogQHNlZSBSRUFETUUjTWVzc2FnZSBjbGFzc2VzXG4gICAgICovXG4gICAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgICAgICByZWdpc3Rlck1lc3NhZ2UoXCJHZXRTaW5nbGVCbG9ja0J5SW5kZXhcIiwgR2V0U2luZ2xlQmxvY2tCeUluZGV4KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBnZW5lc2lzOiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgaW5kZXg6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxHZXRTaW5nbGVCbG9ja0J5SW5kZXg+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmdlbmVzaXMgPSBCdWZmZXIuZnJvbSh0aGlzLmdlbmVzaXMgfHwgRU1QVFlfQlVGRkVSKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHZXRTaW5nbGVCbG9ja0J5SW5kZXhSZXBseSBleHRlbmRzIE1lc3NhZ2U8R2V0U2luZ2xlQmxvY2tCeUluZGV4UmVwbHk+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkdldFNpbmdsZUJsb2NrQnlJbmRleFJlcGx5XCIsIEdldFNpbmdsZUJsb2NrQnlJbmRleFJlcGx5KTtcbiAgICB9XG5cbiAgICByZWFkb25seSBza2lwYmxvY2s6IFNraXBCbG9jaztcbiAgICByZWFkb25seSBsaW5rczogRm9yd2FyZExpbmtbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxHZXRTaW5nbGVCbG9ja0J5SW5kZXhSZXBseT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMubGlua3MgPSB0aGlzLmxpbmtzIHx8IFtdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldFVwZGF0ZUNoYWluIGV4dGVuZHMgTWVzc2FnZTxHZXRVcGRhdGVDaGFpbj4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiR2V0VXBkYXRlQ2hhaW5cIiwgR2V0VXBkYXRlQ2hhaW4pO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IGxhdGVzdElEOiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8R2V0VXBkYXRlQ2hhaW4+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmxhdGVzdElEID0gQnVmZmVyLmZyb20odGhpcy5sYXRlc3RJRCB8fCBFTVBUWV9CVUZGRVIpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldFVwZGF0ZUNoYWluUmVwbHkgZXh0ZW5kcyBNZXNzYWdlPEdldFVwZGF0ZUNoYWluUmVwbHk+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkdldFVwZGF0ZUNoYWluUmVwbHlcIiwgR2V0VXBkYXRlQ2hhaW5SZXBseSwgU2tpcEJsb2NrKTtcbiAgICB9XG5cbiAgICByZWFkb25seSB1cGRhdGU6IFNraXBCbG9ja1tdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM6IFByb3BlcnRpZXM8R2V0VXBkYXRlQ2hhaW5SZXBseT4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIHRoaXMudXBkYXRlID0gdGhpcy51cGRhdGUgfHwgW107XG4gICAgfVxufVxuXG5HZXRBbGxTa2lwQ2hhaW5JRHMucmVnaXN0ZXIoKTtcbkdldEFsbFNraXBDaGFpbklEc1JlcGx5LnJlZ2lzdGVyKCk7XG5TdG9yZVNraXBCbG9jay5yZWdpc3RlcigpO1xuU3RvcmVTa2lwQmxvY2tSZXBseS5yZWdpc3RlcigpO1xuR2V0U2luZ2xlQmxvY2sucmVnaXN0ZXIoKTtcbkdldFNpbmdsZUJsb2NrQnlJbmRleC5yZWdpc3RlcigpO1xuR2V0U2luZ2xlQmxvY2tCeUluZGV4UmVwbHkucmVnaXN0ZXIoKTtcbkdldFVwZGF0ZUNoYWluLnJlZ2lzdGVyKCk7XG5HZXRVcGRhdGVDaGFpblJlcGx5LnJlZ2lzdGVyKCk7XG4iXX0=