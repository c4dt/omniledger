import {Message, Properties} from 'protobufjs/light';
import Darc from '../../darc/darc';
import {Roster} from '../../network/proto';
import {registerMessage} from '../../protobuf';
import {SkipBlock} from '../../skipchain/skipblock';
import ClientTransaction from '../client-transaction';
import Proof from '../proof';

/**
 * Request to create a byzcoin skipchain
 */
export class CreateGenesisBlock extends Message<CreateGenesisBlock> {

    constructor(props?: Properties<CreateGenesisBlock>) {
        super(props);

        this.darcContractIDs = this.darcContractIDs || [];

        /* Protobuf aliases */

        Object.defineProperty(this, 'genesisdarc', {
            get(): Darc {
                return this.genesisDarc;
            },
            set(value: Darc) {
                this.genesisDarc = value;
            },
        });

        Object.defineProperty(this, 'blockinterval', {
            get(): Long {
                return this.blockInterval;
            },
            set(value: Long) {
                this.blockInterval = value;
            },
        });

        Object.defineProperty(this, 'maxblocksize', {
            get(): number {
                return this.maxBlockSize;
            },
            set(value: number) {
                this.maxBlockSize = value;
            },
        });

        Object.defineProperty(this, 'darccontractids', {
            get(): string[] {
                return this.darcContractIDs;
            },
            set(value: string[]) {
                this.darcContractIDs = value;
            },
        });
    }

    readonly version: number;
    readonly roster: Roster;
    readonly genesisDarc: Darc;
    readonly blockInterval: Long;
    readonly maxBlockSize: number;
    readonly darcContractIDs: string[];
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('CreateGenesisBlock', CreateGenesisBlock, Roster, Darc);
    }
}

/**
 * Response of a request to create byzcoin skipchain
 */
export class CreateGenesisBlockResponse extends Message<CreateGenesisBlockResponse> {

    readonly version: number;
    readonly skipblock: SkipBlock;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('CreateGenesisBlockResponse', CreateGenesisBlockResponse, SkipBlock);
    }
}

/**
 * Request to get the proof of presence/absence of a given key
 */
export class GetProof extends Message<GetProof> {

    readonly version: number;
    readonly key: Buffer;
    readonly id: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetProof', GetProof);
    }
}

/**
 * Response of a proof request
 */
export class GetProofResponse extends Message<GetProofResponse> {

    readonly version: number;
    readonly proof: Proof;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetProofResponse', GetProofResponse, Proof);
    }
}

/**
 * Request to add a transaction
 */
export class AddTxRequest extends Message<AddTxRequest> {

    constructor(props?: Properties<AddTxRequest>) {
        super(props);

        /* Protobuf aliases */

        Object.defineProperty(this, 'skipchainid', {
            get(): Buffer {
                return this.skipchainID;
            },
            set(value: Buffer) {
                this.skipchainID = value;
            },
        });
    }

    readonly version: number;
    readonly transaction: ClientTransaction;
    readonly inclusionwait: number;
    readonly skipchainID: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('AddTxRequest', AddTxRequest, ClientTransaction);
    }
}

/**
 * Response of a request to add a transaction
 */
export class AddTxResponse extends Message<AddTxResponse> {

    readonly version: number;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('AddTxResponse', AddTxResponse);
    }
}

/**
 * Request to get the current counters for given signers
 */
export class GetSignerCounters extends Message<GetSignerCounters> {

    constructor(props?: Properties<GetSignerCounters>) {
        super(props);

        this.signerIDs = this.signerIDs || [];

        /* Protobuf aliases */

        Object.defineProperty(this, 'signerids', {
            get(): string[] {
                return this.signerIDs;
            },
            set(value: string[]) {
                this.signerIDs = value;
            },
        });

        Object.defineProperty(this, 'skipchainid', {
            get(): Buffer {
                return this.skipchainID;
            },
            set(value: Buffer) {
                this.skipchainID = value;
            },
        });
    }

    readonly signerIDs: string[];
    readonly skipchainID: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetSignerCounters', GetSignerCounters);
    }
}

/**
 * Response of a counter request in the same order as the signers array
 */
export class GetSignerCountersResponse extends Message<GetSignerCountersResponse> {

    constructor(props?: Properties<GetSignerCountersResponse>) {
        super(props);

        this.counters = this.counters || [];
    }

    readonly counters: Long[];
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetSignerCountersResponse', GetSignerCountersResponse);
    }
}

CreateGenesisBlock.register();
CreateGenesisBlockResponse.register();
GetProof.register();
GetProofResponse.register();
AddTxRequest.register();
AddTxResponse.register();
GetSignerCounters.register();
GetSignerCountersResponse.register();
