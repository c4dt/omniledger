import {IConnection, RosterWSConnection, WebSocketConnection} from '../network/connection';
import {Roster, ServerIdentity} from '../network';
import ByzCoinRPC from '../byzcoin/byzcoin-rpc';
import {Argument, ClientTransaction, InstanceID, Instruction, Proof} from '../byzcoin';
import {Signer} from '../darc';
import {OnChainSecretInstance, DecodeKey} from './calypso-instance';
import {Message, Properties} from 'protobufjs';
import {registerMessage} from '../protobuf';
import {Point, curve, PointFactory, Scalar} from '@dedis/kyber';
import {Public} from '../../KeyPair';
import {Log} from '../../Log';

const Curve25519 = curve.newCurve('edwards25519');

/**
 * OnChainSecretRPC is used to contact the OnChainSecret service of the cothority.
 * With it you can set up a new long-term onchain-secret, give it a policy to accept
 * new requests, and ask for re-encryption requests.
 */

export default class OnChainSecretRPC {
  private socket: IConnection;
  private list: ServerIdentity[];
  static serviceID = 'Calypso';

  constructor(public bc: ByzCoinRPC) {
    this.socket = new RosterWSConnection(bc.getConfig().roster, OnChainSecretRPC.serviceID);
    this.list = this.bc.getConfig().roster.list;
  }

  // CreateLTS creates a random LTSID that can be used to reference the LTS group
  // created. It first sends a transaction to ByzCoin to spawn a LTS instance,
  // then it asks the Calypso cothority to start the DKG.
  async createLTS(bc: ByzCoinRPC, r: Roster, darcID: InstanceID, signers: Signer[]): Promise<CreateLTSReply> {
    let buf = Buffer.from(LtsInstanceInfo.encode(new LtsInstanceInfo({roster: r})).finish());
    let ctx = new ClientTransaction({
      instructions: [
        Instruction.createSpawn(darcID, OnChainSecretInstance.contractID, [
          new Argument({name: 'lts_instance_info', value: buf})
        ])
      ]
    });
    await ctx.updateCountersAndSign(bc, [signers]);
    await bc.sendTransactionAndWait(ctx);
    let p = await bc.getProof(ctx.instructions[0].deriveId());

    return new WebSocketConnection(r.list[0].getWebSocketAddress(), OnChainSecretRPC.serviceID)
      .send(new CreateLTS({proof: p}), CreateLTSReply);
  }

  // Authorise adds a ByzCoinID to the list of authorized IDs for each
  // server in the roster. The AuthoriseByzcoinID service refuses requests
  // that do not come from localhost.
  //
  // It should be called by the administrator at the beginning, before any other
  // API calls are made. A ByzCoinID that is not authorised will not be allowed to
  // call the other APIs.
  async authorise(who: ServerIdentity, bcid: InstanceID): Promise<AuthoriseReply> {
    let sock = new WebSocketConnection(who.getWebSocketAddress(), OnChainSecretRPC.serviceID);
    return sock.send(new Authorise({byzcoinid: bcid}), AuthoriseReply);
  }

  // DecryptKey takes as input Read- and Write- Proofs. It verifies that
  // the read/write requests match and then re-encrypts the secret
  // given the public key information of the reader.
  async decryptKey(write: Proof, read: Proof): Promise<DecryptKeyReply> {
    let sock = new WebSocketConnection(this.list[0].getWebSocketAddress(), OnChainSecretRPC.serviceID);
    return sock.send(new DecryptKey({read: read, write: write}), DecryptKeyReply);
  }
}

/**
 Authorise is used to add the given ByzCoinID into the list of
 authorised IDs.
 */
export class Authorise extends Message<Authorise> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('Authorise', Authorise);
  }

  constructor(props?: Properties<Authorise>) {
    super(props);
  }

  readonly byzcoinid: InstanceID;
}

// AuthoriseReply is returned upon successful authorisation.
export class AuthoriseReply extends Message<AuthoriseReply> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('AuthoriseReply', AuthoriseReply);
  }
}

// CreateLTS is used to start a DKG and store the private keys in each node.
// Prior to using this request, the Calypso roster must be recorded on the
// ByzCoin blockchain in the instance specified by InstanceID.
export class CreateLTS extends Message<CreateLTS> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('CreateLTS', CreateLTS);
  }

  constructor(props?: Properties<CreateLTS>) {
    super(props);
  }

  readonly proof: Proof;
}

// CreateLTSReply is returned upon successfully setting up the distributed
// key.
export class CreateLTSReply extends Message<CreateLTSReply> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('CreateLTSReply', CreateLTSReply);
  }

  get X(): Point {
    return PointFactory.fromProto(this.x);
  }

  readonly byzcoinid: InstanceID;
  readonly instanceid: InstanceID;
  readonly x: Buffer;
}

// DecryptKey is sent by a reader after he successfully stored a 'Read' request
// in byzcoin Client.
export class DecryptKey extends Message<DecryptKey> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('DecryptKey', DecryptKey);
  }

  constructor(props?: Properties<DecryptKey>) {
    super(props);
  }

  readonly read: Proof;
  readonly write: Proof;
}

// DecryptKeyReply is returned if the service verified successfully that the
// decryption request is valid.
export class DecryptKeyReply extends Message<DecryptKeyReply> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('DecryptKeyReply', DecryptKeyReply);
  }

  readonly c: Buffer;
  readonly xhatenc: Buffer;
  readonly x: Buffer;

  async decrypt(priv: Scalar): Promise<Buffer> {
    Log.print(this.x, this.xhatenc, this.c);
    let X = PointFactory.fromProto(this.x);
    let C = PointFactory.fromProto(this.c);
    let XhatEnc = PointFactory.fromProto(this.xhatenc);
    return DecodeKey(X, C, XhatEnc, priv);
  }
}

// LtsInstanceInfo is the information stored in an LTS instance.
export class LtsInstanceInfo extends Message<LtsInstanceInfo> {
  /**
   * @see README#Message classes
   */
  static register() {
    registerMessage('LtsInstanceInfo', LtsInstanceInfo);
  }

  constructor(props?: Properties<LtsInstanceInfo>) {
    super(props);
  }

  readonly roster: Roster;
}

Authorise.register();
AuthoriseReply.register();
CreateLTS.register();
CreateLTSReply.register();
DecryptKey.register();
DecryptKeyReply.register();
LtsInstanceInfo.register();
