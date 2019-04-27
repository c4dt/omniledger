// import { FileIO } from "./FileIO";
import {Roster} from './src/network';

export const Defaults = {
    DataDir: 'storage',
    // Standard Roster for the app
    RosterTOMLDEDIS: `
[[servers]]
  Address = "tls://pop.dedis.ch:7772"
  Suite = "Ed25519"
  Public = "057923aabaad24d9a5cf75c1c0d257e84e99ba5fd29db541432e4a1914af9ad2"
  Description = "Conode_1"
[[servers]]
  Address = "tls://pop.dedis.ch:7774"
  Suite = "Ed25519"
  Public = "da6e0f39da50185fce5656426adcf4e5bad3c27c1f5182f6ae1006c87173b7c9"
  Description = "Conode_2"
[[servers]]
  Address = "tls://pop.dedis.ch:7776"
  Suite = "Ed25519"
  Public = "82961f12d49af09492a44929a88c5e7fb6746c4599a59a99e298e7d3c526746c"
  Description = "Conode_3"
`,
// [[servers]]
//   Address = "tls://local.c4dt.org:7778"
//   Suite = "Ed25519"
//   Public = "a1104500cb49ddf49fb2dc27646d24ca617436d2ca21d96ba476667561693a35"
//   Description = "Conode_5"
//   [servers.Services]
//     [servers.Services.ByzCoin]
//       Public = "45812414eb3962a34a7f0da1a4bea8d6dd44066b3d1dbd291b57df1a62bf8d6516593c45dcd3dae6bdc4ae8f309f33fe441c1e09904680011ada5772759d6a2615bcb583337019f13c9a6dd67272b9f384402877fa62e644a55cf3056158407e03b2c582956472c5f416d4e9f5173fcfe4d6e6f4da4cbbd4b1fc38544c5ecaf2"
//       Suite = "bn256.adapter"
//     [servers.Services.Skipchain]
//       Public = "2ecf86086e93ebf317af679edd6071f47b9d28e2e8d5cb8c363da35f0c9e6f5f3e721fedd719c77ab7958517ba0b4b73ce450196c8d7d914a0d131ce43281ae38c83bd7ac606cdf441144207928080c28b1c61f6e7daf2f2db12ffd9b27dfe986d9f9d3fdfa7d1dba7acf716616f15e0a8d885312bfce7ee2e03868575b78aee"
//       Suite = "bn256.adapter"
//     [servers.Services.blsCoSiService]
//       Public = "63887d3b06ebee95bca343ee1e3a9010218881fcc4ecc849c6f07764fedddab9381e9881c352c90c96a45aa0399dd8190896464394e19e95bb019b3bd423018e456777f8b17abb5d2e08b6a15157925e8f5114fbee3c9f50865be3b2623c5d066a512099fa2264c3acb75c74040cae0cadb9f49ccae71288fb524262beb228c4"
//       Suite = "bn256.adapter"
// [[servers]]
//   Address = "tls://local.c4dt.org:7776"
//   Suite = "Ed25519"
//   Public = "845a49a5eec9bf0d925cbf409f640056ee666511a17e20976eb471cbcc3d6ec7"
//   Description = "Conode_4"
//   [servers.Services]
//     [servers.Services.ByzCoin]
//       Public = "6e2764bb1960d2feade5882bc5c6b38ea0274ff0cccaad0bba1bbf049fc6544d428b358772e4c2b4587093f0d7cf0cbe651015f8d9f673bc03f8f484a0a21a2e00128ed4fc5c4ed34f1811c3b43e96b1cb136ae0b7652a2e30cdbace9c21d67478fef3c4f3885beb23754a50e460129cc3bc9587b51abc74d85dc293667c4e29"
//       Suite = "bn256.adapter"
//     [servers.Services.Skipchain]
//       Public = "45a9de16964bbd55afc05b1a408c246e69299e3530e418461c94e5bc744e51648914609c5e1744e4093dd0ef555a9fd3827dfc99e6aa4b993c71ff89d6c88de48de20564a3a3d7e09e0203baab45d11dae2ae01c787a28da217e68340663dcde53770f58b82690da786d484c9634421ddd30ee03c82985c4427cc6c88a8cad13"
//       Suite = "bn256.adapter"
//     [servers.Services.blsCoSiService]
//       Public = "24b73271432ded23909a23452f0de4e0f4a3fd70fcf11200dd29f57795ea8d2b5523d3b1c1c8c0f53b75f7e6de1c049c6cba43ea208a708be9440b92fcfe7cf8514b8865fef8d0ebeca3ae2380902081f41e5ec4154b831c508cdce380291d6b3579318141a244049a6c8fe34254dc9d96724d9a9827a3e87a1a24e62cd0c893"
//       Suite = "bn256.adapter"
    RosterTOMLLOCAL: `
[[servers]]
  Address = "tls://localhost:7776"
  Suite = "Ed25519"
  Public = "56fbc77422ab0b324091dce093d9df511b4beb3e5ceb6640a717e5820611ac19"
  Description = "Conode_4"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6ff5d1e6af1c964bb4ac7d4e0969d21adf5c5568b410fd484aadb05292cfa093428de82ce60e4a4a456e09be80800ff0b65e6b62645b677099d999aee02907c86d4a822e3a05312281a019846ee28b046c426652809bf7a3d81a5b56849e5d7d7866362c98cc3880392248bae098175d69bd13b956c5660074f6111a9a3b2196"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "2c4f82a51a2cdce04216fca3fc8b3c3ce3afcecd3e61c4b630f6be25af2ff1002db27575e10e94a61f1f0534ea7a23ee0ade6aea4438b6a74398c74605c85d42491ec46e01b0904fd87148f4476a6d40e076f7b7c50074d358a0fc1136a68e483a4c09c064ace6afc87899fe290ab831c74f954d74356532d596a3eb835a14ad"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://localhost:7774"
  Suite = "Ed25519"
  Public = "159e469b4a39301806ea59f544a487b3b91d10166301a0d62ab6e9053a6115dd"
  Description = "Conode_3"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "3e8d352211a719a1891f62dfb24c5664b4b26048ca115ae7efd56bd627d04a1028ade59f6a74098f4bc31be2b9e883a00d37497371a99865d9bd67b0b55d1e570e12aa2c415d703c95e43813a85d8531ea8d1aede0f8a34ec89d3fca8918766d426dbeeb32fa66ba832cc532613ea13d7aa72bde94655b461e4b2eb5625615e3"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "05af7f4c1021b9e2f4b7d94e73012d696e71f63a94dfe0c8ff21d3dda1ed514084d13f0e9082380de1951797afd837ce24e7aabf16cb1fd13ce8df8b5de778068c4ee72d5a1c6b2909c1782fa0a3490ce9a9462cd2a11d5789d6e957acb04bf340e293c366b5590b94a2fbb583762a8551a7b361903ebd5ba8a19eb324c94acd"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://localhost:7772"
  Suite = "Ed25519"
  Public = "ccc5223fd8616e666f59dd362541fb817900ea194f9dd9c21c56a2b88f2f69a1"
  Description = "Conode_2"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "63fd171c8c41e49a91cc5c43cc143cdb79ce36e0757d4af417d2c9ddacc06d558631f6aba15e0dd77549de27e04bb7425fa616bb7d801e670591f06a9ab1786f43dd7aae856852905ba382473cc985a44a24554155e9571902624c9c567caa902a9cf74adb484ee375523c2ae237de7f15d929a34a1d085dc495d7fbe88d51a4"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "87c937c5857427866a26fb1cb6e7af99e25d3ec17c490d26178286b322656383147336938f9d6c7f508dd4323b9a33b8d20d1b2284ddb4d680107fd60b3620ec0f645275828eaf10f9d2a1702b55d586bd8831a9f919f3a5aa2ff6089356c02381b0102b4cabc4070e7899fc5618f65842805fe3c26bee22e96bb071dbfa205e"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://localhost:7770"
  Suite = "Ed25519"
  Public = "2b87ab56c9aed8e7b5512d1b2686253adf48a5c5714ed52eea534a4629a93e2b"
  Description = "Conode_1"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "028cf4ab5b7cba8a901d6bae8f6480a959bfacf856a4ac3545bc9167a8a0667c3483e452009ca84ecf31c515b6e21daa83f7add31ac168c23538940d67b5e86752889bfc118b0975ea0b50c0c22257d01f99ab768239454858d4ed4b05f42ac151090658299a3b250cc7d45ccfe744eba445f18538779b9db7f4da2e207a92c2"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "10b4fcc59a0048ee8b734af42a0b6e8253f3ca67e778d25d39468d1fcb0ed8048985dd1492b16a2ee7a05c035b21ab5c5484c09efb37de00ee6bb1434b3c75674cde478df060e88c33094aef82128461de39b596aba6a885fcdd5d5571be748359454cbfcb16b8bcf251917dec4715f34b77fb538457207d6fecbaba06567089"
      Suite = "bn256.adapter"
`,
    Roster: null,
    // ByzCoinID
    ByzCoinID: Buffer.from('07712e38b5e15dadff6610cdd255bbbe4bd93365fba95aa0abcdca900caf206c', 'hex'),

    // - Testing settings - all settings here are set for the non-testing case. If testing == true, then the
    // settings should be set in the below 'if'. This ensures that we don't forget any testing setting.

    // Testing
    Testing: true,
    // If Confirm is false, there are no security confirmations asked. This is for
    // easier UI testing.
    Confirm: true,
    // pre-loads polling stats for UI testing
    PollPrechoice: false,
    // Redirect pop.dedis.ch to another (local) IP
    NetRedirect: null,
    // Alias can be set to a non-"" value to have a default alias
    Alias: '',
    // TestButtons allow to delete everything
    TestButtons: false,
    // DataFile can be set to a string that will be used to overwrite the Data
    DataFile: null,
    // LoadTestStore
    LoadTestStore: false,
};

if (Defaults.Testing) {
    Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLLOCAL);
    // Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLDEDIS);
    // Defaults.NetRedirect = ["pop.dedis.ch", "192.168.0.1"];
    Defaults.Confirm = false;
    Defaults.TestButtons = true;
    Defaults.Alias = 'testing';
    Defaults.ByzCoinID = Buffer.from('c921c1291c7f9e82a0c05b7bcd89ff6a1629b8f8b535d33644ec5ae5161ebd9b', 'hex');
    // Defaults.Testing = false;
    // Defaults.LoadTestStore = true;
} else {
    Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLLOCAL);
    // Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLDEDIS);
}
