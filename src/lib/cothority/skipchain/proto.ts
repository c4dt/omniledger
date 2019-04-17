import { Message, Properties } from 'protobufjs/light';
import { EMPTY_BUFFER, registerMessage } from '../protobuf';
import { ForwardLink, SkipBlock } from './skipblock';

export class GetAllSkipChainIDs extends Message<GetAllSkipChainIDs> {
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetAllSkipChainIDs', GetAllSkipChainIDs);
    }
}

export class GetAllSkipChainIDsReply extends Message<GetAllSkipChainIDsReply> {

    constructor(props?: Properties<GetAllSkipChainIDsReply>) {
        super(props);

        this.skipChainIDs = this.skipChainIDs || [];
    }

    readonly skipChainIDs: Buffer[];
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetAllSkipChainIDsReply', GetAllSkipChainIDsReply);
    }
}

export class StoreSkipBlock extends Message<StoreSkipBlock> {

    constructor(properties: Properties<StoreSkipBlock>) {
        super(properties);

        this.targetSkipChainID = Buffer.from(this.targetSkipChainID || EMPTY_BUFFER);
        this.signature = Buffer.from(this.signature || EMPTY_BUFFER);
    }

    readonly targetSkipChainID: Buffer;
    readonly newBlock: SkipBlock;
    readonly signature: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('StoreSkipBlock', StoreSkipBlock, SkipBlock);
    }
}

export class StoreSkipBlockReply extends Message<StoreSkipBlock> {

    readonly latest: SkipBlock;
    readonly previous: SkipBlock;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('StoreSkipBlockReply', StoreSkipBlockReply, SkipBlock);
    }
}

export class GetSingleBlock extends Message<GetSingleBlock> {

    constructor(props?: Properties<GetSingleBlock>) {
        super(props);

        this.id = Buffer.from(this.id || EMPTY_BUFFER);
    }

    readonly id: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetSingleBlock', GetSingleBlock);
    }
}

export class GetSingleBlockByIndex extends Message<GetSingleBlockByIndex> {

    constructor(props?: Properties<GetSingleBlockByIndex>) {
        super(props);

        this.genesis = Buffer.from(this.genesis || EMPTY_BUFFER);
    }

    readonly genesis: Buffer;
    readonly index: number;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetSingleBlockByIndex', GetSingleBlockByIndex);
    }
}

export class GetSingleBlockByIndexReply extends Message<GetSingleBlockByIndexReply> {

    constructor(props?: Properties<GetSingleBlockByIndexReply>) {
        super(props);

        this.links = this.links || [];
    }

    readonly skipblock: SkipBlock;
    readonly links: ForwardLink[];
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetSingleBlockByIndexReply', GetSingleBlockByIndexReply);
    }
}

export class GetUpdateChain extends Message<GetUpdateChain> {

    constructor(props?: Properties<GetUpdateChain>) {
        super(props);

        this.latestID = Buffer.from(this.latestID || EMPTY_BUFFER);
    }

    readonly latestID: Buffer;
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetUpdateChain', GetUpdateChain);
    }
}

export class GetUpdateChainReply extends Message<GetUpdateChainReply> {

    constructor(props: Properties<GetUpdateChainReply>) {
        super(props);

        this.update = this.update || [];
    }

    readonly update: SkipBlock[];
    /**
     * @see README#Message classes
     */
    static register() {
        registerMessage('GetUpdateChainReply', GetUpdateChainReply, SkipBlock);
    }
}

GetAllSkipChainIDs.register();
GetAllSkipChainIDsReply.register();
StoreSkipBlock.register();
StoreSkipBlockReply.register();
GetSingleBlock.register();
GetSingleBlockByIndex.register();
GetSingleBlockByIndexReply.register();
GetUpdateChain.register();
GetUpdateChainReply.register();
