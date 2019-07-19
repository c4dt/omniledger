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
var darc_1 = __importDefault(require("../../darc/darc"));
var proto_1 = require("../../network/proto");
var protobuf_1 = require("../../protobuf");
var skipblock_1 = require("../../skipchain/skipblock");
var client_transaction_1 = __importDefault(require("../client-transaction"));
var proof_1 = __importDefault(require("../proof"));
/**
 * Request to create a byzcoin skipchain
 */
var CreateGenesisBlock = /** @class */ (function (_super) {
    __extends(CreateGenesisBlock, _super);
    function CreateGenesisBlock(props) {
        var _this = _super.call(this, props) || this;
        _this.darcContractIDs = _this.darcContractIDs || [];
        /* Protobuf aliases */
        Object.defineProperty(_this, "genesisdarc", {
            get: function () {
                return this.genesisDarc;
            },
            set: function (value) {
                this.genesisDarc = value;
            },
        });
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
        Object.defineProperty(_this, "darccontractids", {
            get: function () {
                return this.darcContractIDs;
            },
            set: function (value) {
                this.darcContractIDs = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    CreateGenesisBlock.register = function () {
        protobuf_1.registerMessage("CreateGenesisBlock", CreateGenesisBlock, proto_1.Roster, darc_1.default);
    };
    return CreateGenesisBlock;
}(light_1.Message));
exports.CreateGenesisBlock = CreateGenesisBlock;
/**
 * Response of a request to create byzcoin skipchain
 */
var CreateGenesisBlockResponse = /** @class */ (function (_super) {
    __extends(CreateGenesisBlockResponse, _super);
    function CreateGenesisBlockResponse() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    CreateGenesisBlockResponse.register = function () {
        protobuf_1.registerMessage("CreateGenesisBlockResponse", CreateGenesisBlockResponse, skipblock_1.SkipBlock);
    };
    return CreateGenesisBlockResponse;
}(light_1.Message));
exports.CreateGenesisBlockResponse = CreateGenesisBlockResponse;
/**
 * Request to get the proof of presence/absence of a given key
 */
var GetProof = /** @class */ (function (_super) {
    __extends(GetProof, _super);
    function GetProof() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    GetProof.register = function () {
        protobuf_1.registerMessage("GetProof", GetProof);
    };
    return GetProof;
}(light_1.Message));
exports.GetProof = GetProof;
/**
 * Response of a proof request
 */
var GetProofResponse = /** @class */ (function (_super) {
    __extends(GetProofResponse, _super);
    function GetProofResponse() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    GetProofResponse.register = function () {
        protobuf_1.registerMessage("GetProofResponse", GetProofResponse, proof_1.default);
    };
    return GetProofResponse;
}(light_1.Message));
exports.GetProofResponse = GetProofResponse;
/**
 * Request to add a transaction
 */
var AddTxRequest = /** @class */ (function (_super) {
    __extends(AddTxRequest, _super);
    function AddTxRequest(props) {
        var _this = _super.call(this, props) || this;
        /* Protobuf aliases */
        Object.defineProperty(_this, "skipchainid", {
            get: function () {
                return this.skipchainID;
            },
            set: function (value) {
                this.skipchainID = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    AddTxRequest.register = function () {
        protobuf_1.registerMessage("AddTxRequest", AddTxRequest, client_transaction_1.default);
    };
    return AddTxRequest;
}(light_1.Message));
exports.AddTxRequest = AddTxRequest;
/**
 * Response of a request to add a transaction
 */
var AddTxResponse = /** @class */ (function (_super) {
    __extends(AddTxResponse, _super);
    function AddTxResponse() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * @see README#Message classes
     */
    AddTxResponse.register = function () {
        protobuf_1.registerMessage("AddTxResponse", AddTxResponse);
    };
    return AddTxResponse;
}(light_1.Message));
exports.AddTxResponse = AddTxResponse;
/**
 * Request to get the current counters for given signers
 */
var GetSignerCounters = /** @class */ (function (_super) {
    __extends(GetSignerCounters, _super);
    function GetSignerCounters(props) {
        var _this = _super.call(this, props) || this;
        _this.signerIDs = _this.signerIDs || [];
        /* Protobuf aliases */
        Object.defineProperty(_this, "signerids", {
            get: function () {
                return this.signerIDs;
            },
            set: function (value) {
                this.signerIDs = value;
            },
        });
        Object.defineProperty(_this, "skipchainid", {
            get: function () {
                return this.skipchainID;
            },
            set: function (value) {
                this.skipchainID = value;
            },
        });
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetSignerCounters.register = function () {
        protobuf_1.registerMessage("GetSignerCounters", GetSignerCounters);
    };
    return GetSignerCounters;
}(light_1.Message));
exports.GetSignerCounters = GetSignerCounters;
/**
 * Response of a counter request in the same order as the signers array
 */
var GetSignerCountersResponse = /** @class */ (function (_super) {
    __extends(GetSignerCountersResponse, _super);
    function GetSignerCountersResponse(props) {
        var _this = _super.call(this, props) || this;
        _this.counters = _this.counters || [];
        return _this;
    }
    /**
     * @see README#Message classes
     */
    GetSignerCountersResponse.register = function () {
        protobuf_1.registerMessage("GetSignerCountersResponse", GetSignerCountersResponse);
    };
    return GetSignerCountersResponse;
}(light_1.Message));
exports.GetSignerCountersResponse = GetSignerCountersResponse;
CreateGenesisBlock.register();
CreateGenesisBlockResponse.register();
GetProof.register();
GetProofResponse.register();
AddTxRequest.register();
AddTxResponse.register();
GetSignerCounters.register();
GetSignerCountersResponse.register();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyZXF1ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwwQ0FBdUQ7QUFDdkQseURBQW1DO0FBQ25DLDZDQUE2QztBQUM3QywyQ0FBaUQ7QUFDakQsdURBQXNEO0FBQ3RELDZFQUFzRDtBQUN0RCxtREFBNkI7QUFFN0I7O0dBRUc7QUFDSDtJQUF3QyxzQ0FBMkI7SUFlL0QsNEJBQVksS0FBc0M7UUFBbEQsWUFDSSxrQkFBTSxLQUFLLENBQUMsU0F5Q2Y7UUF2Q0csS0FBSSxDQUFDLGVBQWUsR0FBRyxLQUFJLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQztRQUVsRCxzQkFBc0I7UUFFdEIsTUFBTSxDQUFDLGNBQWMsQ0FBQyxLQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3ZDLEdBQUcsRUFBSDtnQkFDSSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7WUFDNUIsQ0FBQztZQUNELEdBQUcsWUFBQyxLQUFXO2dCQUNYLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1lBQzdCLENBQUM7U0FDSixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUksRUFBRSxlQUFlLEVBQUU7WUFDekMsR0FBRyxFQUFIO2dCQUNJLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUM5QixDQUFDO1lBQ0QsR0FBRyxZQUFDLEtBQVc7Z0JBQ1gsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7WUFDL0IsQ0FBQztTQUNKLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSSxFQUFFLGNBQWMsRUFBRTtZQUN4QyxHQUFHLEVBQUg7Z0JBQ0ksT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQzdCLENBQUM7WUFDRCxHQUFHLFlBQUMsS0FBYTtnQkFDYixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztZQUM5QixDQUFDO1NB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QUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3pCLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQzdCLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IExvbmcgZnJvbSBcImxvbmdcIjtcbmltcG9ydCB7IE1lc3NhZ2UsIFByb3BlcnRpZXMgfSBmcm9tIFwicHJvdG9idWZqcy9saWdodFwiO1xuaW1wb3J0IERhcmMgZnJvbSBcIi4uLy4uL2RhcmMvZGFyY1wiO1xuaW1wb3J0IHsgUm9zdGVyIH0gZnJvbSBcIi4uLy4uL25ldHdvcmsvcHJvdG9cIjtcbmltcG9ydCB7IHJlZ2lzdGVyTWVzc2FnZSB9IGZyb20gXCIuLi8uLi9wcm90b2J1ZlwiO1xuaW1wb3J0IHsgU2tpcEJsb2NrIH0gZnJvbSBcIi4uLy4uL3NraXBjaGFpbi9za2lwYmxvY2tcIjtcbmltcG9ydCBDbGllbnRUcmFuc2FjdGlvbiBmcm9tIFwiLi4vY2xpZW50LXRyYW5zYWN0aW9uXCI7XG5pbXBvcnQgUHJvb2YgZnJvbSBcIi4uL3Byb29mXCI7XG5cbi8qKlxuICogUmVxdWVzdCB0byBjcmVhdGUgYSBieXpjb2luIHNraXBjaGFpblxuICovXG5leHBvcnQgY2xhc3MgQ3JlYXRlR2VuZXNpc0Jsb2NrIGV4dGVuZHMgTWVzc2FnZTxDcmVhdGVHZW5lc2lzQmxvY2s+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkNyZWF0ZUdlbmVzaXNCbG9ja1wiLCBDcmVhdGVHZW5lc2lzQmxvY2ssIFJvc3RlciwgRGFyYyk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgdmVyc2lvbjogbnVtYmVyO1xuICAgIHJlYWRvbmx5IHJvc3RlcjogUm9zdGVyO1xuICAgIHJlYWRvbmx5IGdlbmVzaXNEYXJjOiBEYXJjO1xuICAgIHJlYWRvbmx5IGJsb2NrSW50ZXJ2YWw6IExvbmc7XG4gICAgcmVhZG9ubHkgbWF4QmxvY2tTaXplOiBudW1iZXI7XG4gICAgcmVhZG9ubHkgZGFyY0NvbnRyYWN0SURzOiBzdHJpbmdbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogUHJvcGVydGllczxDcmVhdGVHZW5lc2lzQmxvY2s+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmRhcmNDb250cmFjdElEcyA9IHRoaXMuZGFyY0NvbnRyYWN0SURzIHx8IFtdO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJnZW5lc2lzZGFyY1wiLCB7XG4gICAgICAgICAgICBnZXQoKTogRGFyYyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2VuZXNpc0RhcmM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBEYXJjKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5nZW5lc2lzRGFyYyA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiYmxvY2tpbnRlcnZhbFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogTG9uZyB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tJbnRlcnZhbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IExvbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrSW50ZXJ2YWwgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcIm1heGJsb2Nrc2l6ZVwiLCB7XG4gICAgICAgICAgICBnZXQoKTogbnVtYmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXhCbG9ja1NpemU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1heEJsb2NrU2l6ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwiZGFyY2NvbnRyYWN0aWRzXCIsIHtcbiAgICAgICAgICAgIGdldCgpOiBzdHJpbmdbXSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGFyY0NvbnRyYWN0SURzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNldCh2YWx1ZTogc3RyaW5nW10pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRhcmNDb250cmFjdElEcyA9IHZhbHVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlc3BvbnNlIG9mIGEgcmVxdWVzdCB0byBjcmVhdGUgYnl6Y29pbiBza2lwY2hhaW5cbiAqL1xuZXhwb3J0IGNsYXNzIENyZWF0ZUdlbmVzaXNCbG9ja1Jlc3BvbnNlIGV4dGVuZHMgTWVzc2FnZTxDcmVhdGVHZW5lc2lzQmxvY2tSZXNwb25zZT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiQ3JlYXRlR2VuZXNpc0Jsb2NrUmVzcG9uc2VcIiwgQ3JlYXRlR2VuZXNpc0Jsb2NrUmVzcG9uc2UsIFNraXBCbG9jayk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgdmVyc2lvbjogbnVtYmVyO1xuICAgIHJlYWRvbmx5IHNraXBibG9jazogU2tpcEJsb2NrO1xufVxuXG4vKipcbiAqIFJlcXVlc3QgdG8gZ2V0IHRoZSBwcm9vZiBvZiBwcmVzZW5jZS9hYnNlbmNlIG9mIGEgZ2l2ZW4ga2V5XG4gKi9cbmV4cG9ydCBjbGFzcyBHZXRQcm9vZiBleHRlbmRzIE1lc3NhZ2U8R2V0UHJvb2Y+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkdldFByb29mXCIsIEdldFByb29mKTtcbiAgICB9XG5cbiAgICByZWFkb25seSB2ZXJzaW9uOiBudW1iZXI7XG4gICAgcmVhZG9ubHkga2V5OiBCdWZmZXI7XG4gICAgcmVhZG9ubHkgaWQ6IEJ1ZmZlcjtcbn1cblxuLyoqXG4gKiBSZXNwb25zZSBvZiBhIHByb29mIHJlcXVlc3RcbiAqL1xuZXhwb3J0IGNsYXNzIEdldFByb29mUmVzcG9uc2UgZXh0ZW5kcyBNZXNzYWdlPEdldFByb29mUmVzcG9uc2U+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkdldFByb29mUmVzcG9uc2VcIiwgR2V0UHJvb2ZSZXNwb25zZSwgUHJvb2YpO1xuICAgIH1cblxuICAgIHJlYWRvbmx5IHZlcnNpb246IG51bWJlcjtcbiAgICByZWFkb25seSBwcm9vZjogUHJvb2Y7XG59XG5cbi8qKlxuICogUmVxdWVzdCB0byBhZGQgYSB0cmFuc2FjdGlvblxuICovXG5leHBvcnQgY2xhc3MgQWRkVHhSZXF1ZXN0IGV4dGVuZHMgTWVzc2FnZTxBZGRUeFJlcXVlc3Q+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkFkZFR4UmVxdWVzdFwiLCBBZGRUeFJlcXVlc3QsIENsaWVudFRyYW5zYWN0aW9uKTtcbiAgICB9XG5cbiAgICByZWFkb25seSB2ZXJzaW9uOiBudW1iZXI7XG4gICAgcmVhZG9ubHkgdHJhbnNhY3Rpb246IENsaWVudFRyYW5zYWN0aW9uO1xuICAgIHJlYWRvbmx5IGluY2x1c2lvbndhaXQ6IG51bWJlcjtcbiAgICByZWFkb25seSBza2lwY2hhaW5JRDogQnVmZmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPEFkZFR4UmVxdWVzdD4pIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJza2lwY2hhaW5pZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQnVmZmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5za2lwY2hhaW5JRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2tpcGNoYWluSUQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXNwb25zZSBvZiBhIHJlcXVlc3QgdG8gYWRkIGEgdHJhbnNhY3Rpb25cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZFR4UmVzcG9uc2UgZXh0ZW5kcyBNZXNzYWdlPEFkZFR4UmVzcG9uc2U+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkFkZFR4UmVzcG9uc2VcIiwgQWRkVHhSZXNwb25zZSk7XG4gICAgfVxuXG4gICAgcmVhZG9ubHkgdmVyc2lvbjogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlcXVlc3QgdG8gZ2V0IHRoZSBjdXJyZW50IGNvdW50ZXJzIGZvciBnaXZlbiBzaWduZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBHZXRTaWduZXJDb3VudGVycyBleHRlbmRzIE1lc3NhZ2U8R2V0U2lnbmVyQ291bnRlcnM+IHtcbiAgICAvKipcbiAgICAgKiBAc2VlIFJFQURNRSNNZXNzYWdlIGNsYXNzZXNcbiAgICAgKi9cbiAgICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgICAgIHJlZ2lzdGVyTWVzc2FnZShcIkdldFNpZ25lckNvdW50ZXJzXCIsIEdldFNpZ25lckNvdW50ZXJzKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBzaWduZXJJRHM6IHN0cmluZ1tdO1xuICAgIHJlYWRvbmx5IHNraXBjaGFpbklEOiBCdWZmZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb3BlcnRpZXM8R2V0U2lnbmVyQ291bnRlcnM+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLnNpZ25lcklEcyA9IHRoaXMuc2lnbmVySURzIHx8IFtdO1xuXG4gICAgICAgIC8qIFByb3RvYnVmIGFsaWFzZXMgKi9cblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJzaWduZXJpZHNcIiwge1xuICAgICAgICAgICAgZ2V0KCk6IHN0cmluZ1tdIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zaWduZXJJRHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2V0KHZhbHVlOiBzdHJpbmdbXSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2lnbmVySURzID0gdmFsdWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJza2lwY2hhaW5pZFwiLCB7XG4gICAgICAgICAgICBnZXQoKTogQnVmZmVyIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5za2lwY2hhaW5JRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZXQodmFsdWU6IEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc2tpcGNoYWluSUQgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXNwb25zZSBvZiBhIGNvdW50ZXIgcmVxdWVzdCBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGUgc2lnbmVycyBhcnJheVxuICovXG5leHBvcnQgY2xhc3MgR2V0U2lnbmVyQ291bnRlcnNSZXNwb25zZSBleHRlbmRzIE1lc3NhZ2U8R2V0U2lnbmVyQ291bnRlcnNSZXNwb25zZT4ge1xuICAgIC8qKlxuICAgICAqIEBzZWUgUkVBRE1FI01lc3NhZ2UgY2xhc3Nlc1xuICAgICAqL1xuICAgIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAgICAgcmVnaXN0ZXJNZXNzYWdlKFwiR2V0U2lnbmVyQ291bnRlcnNSZXNwb25zZVwiLCBHZXRTaWduZXJDb3VudGVyc1Jlc3BvbnNlKTtcbiAgICB9XG5cbiAgICByZWFkb25seSBjb3VudGVyczogTG9uZ1tdO1xuXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBQcm9wZXJ0aWVzPEdldFNpZ25lckNvdW50ZXJzUmVzcG9uc2U+KSB7XG4gICAgICAgIHN1cGVyKHByb3BzKTtcblxuICAgICAgICB0aGlzLmNvdW50ZXJzID0gdGhpcy5jb3VudGVycyB8fCBbXTtcbiAgICB9XG59XG5cbkNyZWF0ZUdlbmVzaXNCbG9jay5yZWdpc3RlcigpO1xuQ3JlYXRlR2VuZXNpc0Jsb2NrUmVzcG9uc2UucmVnaXN0ZXIoKTtcbkdldFByb29mLnJlZ2lzdGVyKCk7XG5HZXRQcm9vZlJlc3BvbnNlLnJlZ2lzdGVyKCk7XG5BZGRUeFJlcXVlc3QucmVnaXN0ZXIoKTtcbkFkZFR4UmVzcG9uc2UucmVnaXN0ZXIoKTtcbkdldFNpZ25lckNvdW50ZXJzLnJlZ2lzdGVyKCk7XG5HZXRTaWduZXJDb3VudGVyc1Jlc3BvbnNlLnJlZ2lzdGVyKCk7XG4iXX0=