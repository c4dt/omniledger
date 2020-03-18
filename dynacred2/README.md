# Observable Dynacred

This new dynacred version makes extended use of rxjs observables to implement a more reactive dynacred.
The main goal is to remove all need of `reload` and clean up the mess that the previous dynacred has become.
Next steps include:

- calypso support for identity attributes (email, webpage)
- sharable address-book
- BEvm support

## Class structure

Two main classes are used to keep all other classes together:
- `User` holds an instance of each class needed for a fully loaded user
- `ByzCoinBS` defines the interaction between `ByzCoin` and the caches 

```
User > ByzCoinBuilder
  + KeyPair
  + dbBase
  + CredentialStructBS
  + SpawnerInstanceBS
  + CoinBS
  + CredentialSignerBS
  + AddressBook
```

```  
ByzcoinBS
  + ByzCoinRPC
  + IDataBase
  + Instances
```

The following two helper classes are used throughout the code:

```
ByzCoinBuilder > ByzCoinBS
  - retrieveAddressBook
  - retrieveUser(|By(Ephemeral|URL|Migration|DB))
  - retrieveUserKeyCredID
  - retrieveCoinBS
  - retrieveCredentialSignerBS
  - retrieveDarcsBS
  - retrieveDarcBS
  - retrieveSignerDarcBS
```

```
CredentialTransaction > Transaction
  - sendCoins
  - spawnDarc(|Basic)
  - spawnCoin
  - spawnCredential
  - createUser
```

### Basic credential structure definitions

These all stem from the `CredentialStruct` class and allow an easy way to access eventual updates to the values. 
No interpretation is done that requires to query byzcoin.
So you'll find `Buffer` and `InstanceMap`, but no `Darc` or `Coin` in these definitions.
  
```
CredentialStructBS > BS<CredentialStruct>
  + id, darcID
  + CredentialPublic
  + CredentialConfig
  + credDevices: CredentialInstanceMapBS
  + credRecoveries: CredentialInstanceMapBS
  - getCredential(|InstanceMap)BS
  - (update|set)Credentials
```

```
CredentialBS > BS<Credential>
  - getAttribute(|BS|Buffer|String|InstanceSet)
  - setValue
  - rmValue
```

```
CredentialInstanceMapBS > BS<InstanceMap>
  - setInstanceSet
  - setValue
  - rmValue
```

```
Attribute(Buffer|String|Long|Point|Bool|Number|InstanceSet)BS > BS<*>
  - setValue(T)
```

```
CredentialPublic
  + contacts, alias, ...: Attribute*BS
```

```
CredentialConfig
  + view, spawner: Attribute*BS
```
  
```
InstanceSet
```

```
InstanceMap
```

### Structures that fetch more information from ByzCoin

As the `CredentialStruct` class points to other byzcoin-instances, these classes allow to interact directly with 
these instances.
Every one of these classes gives a `BehaviorSubject` access to the underlying byzcoin-instances, as well as methods 
to `WORM` the bc-instances.

#### AddressBook

```
AddressBook
  + ABContactsBS
  + ABGroupsBS
  + ABActionsBS
```

```
ABContactsBS > BS<CredentialStructBS[]>
  - create, link, unlink, rename
```

```
ABGroupsBS > BS<DarcsBS>
  - create, link, unlink, rename
```

```
ABActionsBS > BS<ActionBS[]>
  - create, link, unlink, rename
```

```
ActionBS
  + DarcBS
  + CoinBS
```
  
#### CredentialSigner

```
CredentialSigner > DarcBS
  + devices: CSTypesBS
  + recoveries: CSTypesBS
```

```
CSTypesBS > DarcsBS
  - create, link, unlink, rename
```
  
### Classes to be integrated into dedis/ByzCoin npm

```
DarcsBS > BS<DarcBS[]>
```

```
DarcBS > BS<Darc>
  - evolve
  - (set|add|rm)signEvolve
```

```
CoinBS
  - transfer
```

```
Transaction
  - send
  - (spawn|invoke|delete)
```
