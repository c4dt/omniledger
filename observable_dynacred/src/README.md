# Observable Dynacred

Using rxjs observables to implement a more reactive dynacred.

## Class structure

### Main structures linking it all together

Two main classes are used to keep all other classes together:
- `User` holds an instance of each class needed
- `ByzCoinBS` defines the interaction with `ByzCoin` and the caches 

User > ByzCoinBS
  + KeyPair
  + dbBase
  + CredentialStructBS
  + SpawnerInstanceBS
  + CoinBS
  + CredentialSignerBS
  + AddressBook
  
ByzcoinBS
  + ByzCoinRPC
  + IDataBase
  + Instances

### Basic credential structure definitions

These all stem from the `CredentialStruct` class and allow an easy way to access eventual updates to the values. 
No interpretation is done that requires to query byzcoin.
So you'll find `Buffer` and `InstanceMap`, but no `Darc` or `Coin` in these definitions.
  
CredentialStructBS > BS<CredentialStruct>
  + id, darcID
  + CredentialPublic
  + CredentialConfig
  + credDevices: CredentialInstanceMapBS
  + credRecoveries: CredentialInstanceMapBS
  - getCredential(|InstanceMap)BS
  - (update|set)Credentials

CredentialBS > BS<Credential>
  - getAttribute(|BS|Buffer|String|InstanceSet)
  - setValue
  - rmValue
  
CredentialInstanceMapBS > BS<InstanceMap>
  - setInstanceSet
  - setValue
  - rmValue

Attribute(Buffer|String|Long|Point|Bool|Number|InstanceSet)BS > BS<*>
  - setValue(T)

CredentialPublic
  + contacts, alias, ...: Attribute*BS

CredentialConfig
  + view, spawner: Attribute*BS
  
InstanceSet

InstanceMap

### Structures that fetch more information from ByzCoin

As the `CredentialStruct` class points to other byzcoin-instances, these classes allow to interact directly with 
these instances.
Every one of these classes gives a `BehaviorSubject` access to the underlying byzcoin-instances, as well as methods 
to `WORM` the bc-instances.

#### AddressBook

AddressBook
  + ABContactsBS
  + ABGroupsBS
  + ABActionsBS

ABContactsBS > BS<CredentialStructBS[]>
  - create, link, unlink, rename

ABGroupsBS > BS<DarcsBS>
  - create, link, unlink, rename

ABActionsBS > BS<ActionBS[]>
  - create, link, unlink, rename

ActionBS
  + DarcBS
  + CoinBS
  
#### CredentialSigner

CredentialSigner > DarcBS
  + devices: CSTypesBS
  + recoveries: CSTypesBS

CSTypesBS > DarcsBS
  - create, link, unlink, rename
  
#### Darc(s)BS

DarcsBS > BS<DarcBS[]>

DarcBS > BS<Darc>
