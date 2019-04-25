// import { FileIO } from "./FileIO";
import {Roster} from './cothority/network';

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
  Address = "tls://local.c4dt.org:7774"
  Suite = "Ed25519"
  Public = "8cc0ad4a53bdd85949f660f2b86e7f82f70f25c6d257572dcb1d28840b7d05bc"
  Description = "Conode_3"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "11be211a0ea170b192138c7133e13dc0e8fcac429643a7166221501dfef5740c85bd026b9c35279a07e0b927bcb0839fc9d127ada2c0e8cbf5402517b74ff54824a6489b30e30bfb537b32bb506dbf44713281e5f1213cdb94e56ac60dd8de2257d1c4928dbb72f54a1a1aa24355ef6a72feb2a64fda1a83562e61fd98b50833"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "26c22a17484de7a40c53b61debe38bd1bef30441822898eaf7be54e798fd892a5eeb63b413a96773ed3c80fe04a2721fdc05fd14685683647378dae274c0c42f070e520c97778072a2b932f435ea30430cb7aaf262bed49fe23f501dc2930b9444e1e496ca7d1eff8cf5f10764ad5603c7f8f069fb3600e8f1d29f1465d4aee8"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "8b8de61b52e4c2deb78fbf3b393db659a71b240017b75eb3055e1a921a9371fc36cece682f8d89db06d4ed7090709bf97bfa2e354276bed63e7d35d70e916af38afe6728bbdcf9fd8e12f8d11dd8b9a7877748323cf04c26506ba2bf3e91f86d1a4fdcd5e5e638237e4cb982d0235faa0336efb36083686ceaa04fc1b6505103"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://local.c4dt.org:7772"
  Suite = "Ed25519"
  Public = "66a08a3ae1e8fe581047287cd83c04185caf3f9777b7528bbd0ee2504e5dd50c"
  Description = "Conode_2"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "39087b261e7cc6854d691e2aad9313f2f361899a04df026551df996a8961cd2b353d6339aa1880900ac7435f696000607b175fc5f71b8ec746f06dc7d35c0f9a544c457a0524cf1edbd466fcf5cf1e0f709aea74bd1b29a3559d85e4d5bf6c308048678ad97745652ad1f3b0a45f0d8290548de4540e3885412cffc41080f0e0"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "422a05c4c6f5a21c4c2917acb02e3f225c4eb503d13358f8e2ad8d9e551e8f551ad8d7bc8390ea124a1fd6b9550d060286d8072d3b838162d91a6174f6038f8e7788578e9b4ead7595469d27a6008cd0475ae3d5cc28c44464f7ddbf1af5e2861339e18099d49af40dcf6443d6ceb589395fc95573aed28471a9694159305652"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "666e41560c9c155eab09702d5107a9de2f76fea80680a70f45daf6963df5f3948006143fe45a2f3d27e8fb79d7aa914ad9c23473b8aa373870e9c978838ce5ce6a3447d64ec66d0e3105778692a030724938cd2458dd34b1bc8118017cc120b42f5792c54690de8bb4410304a202045a5d702916faf33a074239093cb175368a"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://local.c4dt.org:7770"
  Suite = "Ed25519"
  Public = "76f642ce02a7360e4a3b5879ce2a6088ce2fc85d83a9ea0b0eb783bb524625c9"
  Description = "Conode_1"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "5b641f7198dc364b42c1a459f8505c3b114544ecab450d7ea94f96cde7202bd96e7f42e7e6bdd8d382e0acfdc472e9bb508162cea8a7e353aa368517f9be77df4baeeafb739c9178b0206b44ea02ba1d18649a21192e2059a73327abf01b0344527bdac2492616cf8287fd8fbbc0d3cfbdf6f70c26a2b9992583798dcd8b41a6"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "3b2d03200c2c892253f584638a04dc52f507e3eaa3a2ecb0713412ec1288a8f92b85ac8317f42e5cb6a430c41b0b25daec6c2104f95958b827a738f96d3f963f172dea86f37ca73b6a8bbd5784e5599d20a803df9471b97b440334be45836c6f0a1ef78345e31769709afb0d61902e4a6c5786dcd679fd7ff294a426ca7277cb"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "55f45004e4d206f01723891a27e07ba93030edced3f2e20921108bc27517b67714d0743eef600a1a66799614c17615c40205c091aea0aeabbc46b83f199b167d0949835fa82b27702f4216744ab05e3fd279d2b7a7b1bcfd23104e669a462ad56358c6696de7cd7fc4cf2f5d7334e0a7848c5433b50aafbdf1a4dd72386d04fc"
      Suite = "bn256.adapter"
`,
    Roster: null,
    // ByzCoinID
    ByzCoinID: Buffer.from('983a4933ac3ce45c9e84fd485a425f56c3c0fe9602de7a72aa514b644a89099f', 'hex'),

    // - Testing settings - all settings here are set for the non-testing case. If testing == true, then the
    // settings should be set in the below 'if'. This ensures that we don't forget any testing setting.

    // Testing
    Testing: false,
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
    Defaults.LoadTestStore = true;
    // Defaults.Testing = false;
    // Defaults.LoadTestStore = true;
} else {
    Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLLOCAL);
    // Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLDEDIS);
}
