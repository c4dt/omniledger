// import { FileIO } from "./FileIO";
import { Roster } from "@c4dt/cothority/network";

// tslint:disable-next-line
export const Defaults = {
    DataDir: "storage",
    // Standard Roster for the app
    // tslint:disable:max-line-length
    RosterTOMLDEDIS: `
[[servers]]
  Address = "tls://conode.dedis.ch:7000"
  Url = "https://conode.dedis.ch"
  Suite = "Ed25519"
  Public = "ec5c65a3c922d1df32075640e3de606197be24af76059a2ef145501122884bd3"
  Description = "EPFL Cothority-server"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6f69dc10dbef8f4d80072aa9d1bee191b0f68b137a9d06d006c39fe6667738fa2d3439caf428a1dcb6f4a5bd2ce6ff6f1462ebb1b7374080d95310bc6e1115e105d7ae38f9fed1585094b0cb13dc3a0f3e74daeaa794ca10058e44ef339055510f4d12a7234779f8db2e093dd8a14a03440a7d5a8ef04cac8fd735f20440b589"
      Suite = "bn256.adapter"
    [servers.Services.PoPServer]
      Public = "8f3d081c68394ffa6b6049da3f65ff996549ae4ccf9584a5a0b0ad6b7d6263265b39d9c044b2a58038670d6a8efe57dcc99a0ab7cbbd91dc08febacd4a1ee548142438b5eedca67789ba0bb664b02beea62cf40cde2d2a2f3794e9b3afdbacb322090b653b723ee59ae2d8b6db7281c32f764bc4250d160caab058057e25fa8a"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "32ba0cccec06ac4259b39102dcba13677eb385e0fdce99c93406542c5cbed3ec6ac71a81b01207451346402542923449ecf71fc0d69b1d019df34407b532fb2a09005c801e359afb377cc3255e918a096912bf6f7b7e4040532404996e05f78c408760b57fcf9e04c50eb7bc413438aca9d653dd0b6a8353d128370ebd4bdb10"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "6a62b35ee5ec659625bdcc69b47e14a5b5aad9a0aacb8c6ac1fa301667471be915da15f6fefa2537ee5cc8fdad0d31de01f3f7ab4dda80aa104215f1ee85f1e255cd767d8f353fd5f89815b18a8f0e96e08532a131f221e87d3e19eb07f0e27b55b03977579a30f8ce4aad04449f2ec405c4070cf37786de8322e8109d52b891"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://dedis.nella.org:7770"
  Url = "https://dedis.nella.org:7771"
  Suite = "Ed25519"
  Public = "ad91a87dd89d31e4fc77ee04f1fc684bb6697bcef96720b84422437ff00b79e3"
  Description = "dedis.nella.org"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "7a989c19ef64ac45d4962fa0e60184c0adaf90082f5ea572de2d241d11ac8e6a53f968928d80a910ed7d883c05d74cf3e3c2c9096dd9fb5b64a03f9e552700388effcd3106e58f4bb99c384afb4b6b2530bfee6fdfb6b4f41a383b2ad31bf03c18d3f43a4a8bacbe5da16c3851c3c8be3607af1bb19b085861d71cd92c8b8406"
      Suite = "bn256.adapter"
    [servers.Services.PoPServer]
      Public = "28122b3f4a6d7a17d682859c4a37287d851aba7afd994e7dffbd0f636b21e975614dd3a4a8c45ac56044a045333fcaf9044031dd2d9c46e07847c6078a60740515d1bd01b83c6fffe7a55ff851feeb59dadb82f11bc70a5be65070408fd67da94ab250f6eac2c04f72edf122840ba6c7d76d0906ff20915a1d44a83df19b569f"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "78dd1cfd6e70ad9cf5afb8263811fabe95aedee835567cc5ca7773a6787a03736ee24accb8e00370768aab14dab949584054e255c626d0141182454f8c77794a4e8c69a4dc6082f30f1cf33de45daea63fc52c4a91ed79ca88e4f6d363a46d87017b038da5ca4656f610d77fd91e1aae320d7d399ca7fdf41f5348b63712310f"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "672a542f50329271b0e4832f39f7be95278ff65037ceab0affc485751feffd1089cef346e0a1c503ad48926f73f35849bed634dc7bc3f2c538fea8b186eb2cf8049ff177ae922fa6414c02b28689cc0afe571ff32c5a113b5b64f9651e935b5b5594a528505ff74ad4df7efecbd1b76f52cd3fe69751c6a4c046e75e454e643c"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://fairywren.ch:7770"
  Url = "https://fairywren.ch:7771"
  Suite = "Ed25519"
  Public = "0bcdaebde16f50fb65b717a0501e7ede020045286d6ece10fdea1bdd8f37af39"
  Description = "Gaylor's Conode"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "2754e502579e77f92322458022f6b97ff18471f2e7523028ea6dab720da11ab189f98ef9a0308c7aa656f3339baded992248def25e3e2e1428c1601809579b934bb2aaf66b3d8a68712f68d744661d270278ebcf434204af961c729db6db85a54930dfe6b75184647d0e81138db2a87ccaeccff3500be2bf409827eef5ec150d"
      Suite = "bn256.adapter"
    [servers.Services.PoPServer]
      Public = "56f8aff826b48f4ccb60ce5aabf1484d3156533c6de378c8c9c209cf38d3e75249cd1dcc833a50173b59a27dd885683fbc68fabb536f0a55f89167fb7b2c393710564e2f9876dcef0067b68cf695d944e5d116420726cc1e20f48d20dc5dc4f96e5b9a9d35eb7b5a46059fc8aad4ce4ff282b89b6b1fd840eabbf307fe56338c"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "69088f9df0396cfd296eeeb060bc84d807f3f2cf3b02b8eafd953f30e9e979a203fd11035e9f1fca2662383841c3c630ee3554150ec2b5fdb50819a22a2682dd341f0424fec4eafb8a17041b939ef18eabdd8c38e2f057619a541c506bbae5755265ae6b9156690b7a2907ca0ec6394d79363d5492aa2c9512e3fba882aad358"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "753367383700559bc310a2ba7d201b19e00c5bd37fa9fc0c7914757b1d88bfc35b3f00fefb25a6cb2bb0f46f7b5d0439493f0ecb8aae1d6b939a1b0fa38a850b43be80468dc1cd5f81f9f57e22931c4535541c7f5565b5b46c0f26897764322a1aaacb7ad312396c995c3c934b8106fa4bcb4c370ebe6264e2cae376735f715a"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://conode.c4dt.org:7770"
  Url = "https://conode.c4dt.org:7771"
  Suite = "Ed25519"
  Public = "67e30e168f83c4d4614e277cefba42dbc1fb5886b3945364ea5dae3f4e4fbc0d"
  Description = "C4DT Conode"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6bb65e6c3fb7cb9d84c81a21ce4cedf70539452e3e220c0383f087832bbd1d588590eb4fe777a360c3e12b8020a424db20fc00deafb1212bf8a4f70b978adbae093efc9aadff0a97cb0199372d5b55f135793393d94028cac0f432fb144b269f12162dbc163a80e32bea7219c2c51700ae8de5bd849d6d4001dfb2a3a8e2a161"
      Suite = "bn256.adapter"
    [servers.Services.PoPServer]
      Public = "842fdff85d9d1b16039c1ae3bde443fe949734080f80a3c1f0beb74ad2d3a43b7218b4f3d99f33da15f4411a0af0230681ced09e0c597b46408bd27a6dbe3aa1821acb39f8ba959da48c2567ed9e4b7ac10857efe771a6fa882b334b9972c9bc645ff507a5761bef61b69f5d4785876cceab29f78762d49b6f603574fb77b985"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "70a1f68fee1a78e621e023ea9ab0eaa042c1fa72e5bc2abd8ed9c039ce9dbdce122306f8b9e3d423757084fc9b4043adcf7b91f04c6fb66577a98f24bcddc248636fe63a69f661cd7e668fc4fa63fc2b55316c9d108d864e6f5461e31b77e03b0bcd6fcfb60b60c8a19ff07e068c43e7b3abad35ffb297710680fb693f5eee72"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "79e01b74993efc47a002c897356620eb0c3616127fcc2059ef87678c1198562e51b97148c9ce95dff439b0453a3a66e5f72baa275acb33591bd63b951b00e7f677f4a1814f4d73c028ad26d96a4c907d433c1189937fab27b2332079267db61a2be2e07ce1c10e52e645400cb998d8bc1f0c57382a13e07658c340f3f63f5e96"
      Suite = "bn256.adapter"

[[servers]]
  Address = "tls://gasser.blue:7770"
  Url = "https://gasser.blue:7771"
  Suite = "Ed25519"
  Public = "0e4c620122daca9518cace2a6b11c5c0892fbde7b130d04e8a194fd02906ffc6"
  Description = "Ineiti's conode"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "00fe956fe1b90332bd7c5182d9f125c0e2108f5178d71b42b5f02582f9f2814281d4f2e0c9bd25f711c7138f9c2fb5fb6578b65aeae8cff1c349df34c497882f86ba36037678275d086b57bd04a9a020a80a47242b08274c696c009f097d3e7a31d0a6fc2b2e01b9d005e8c2ea538f3c581baac918cacb0650f6b3c2082e549f"
      Suite = "bn256.adapter"
    [servers.Services.PoPServer]
      Public = "034be6b1ad082df3fa70520e3cbb937e4c51a15aa1e75680bffd01f7fc7d911f38a8c353ebdcdffd47182507415055b1590dfaa0c9fd3b91402b52f3a9701b9d85555409b23882e92393671f9ccb1e2fa380196cde89266ba020cbbab7b077e81a1828b9504c79374611b6c2639784d27194b9c6bc3830b5baeb6046de88f013"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "5878c63855bf0ad9a2575865b18a8e5856ed6c6b1cbfe1bacc0f4e889b9cd79f78b024fdcef448be2ffb292622927595047227f45a361e9094d5bb3ebcfd9bdb60bf179d5c6c3319d4c8bf2e1e149b78c1056814ac581b7c97decd9c58a570d6018712143844e5fd0a31ddb61e2d81bc1f35bfc47e8a884683d9692529119240"
      Suite = "bn256.adapter"
    [servers.Services.blsCoSiService]
      Public = "3fbfc26efa7e39879ef106fc5a5a4da8c2e9e6be5ef4d369ddfad0a134031fe33b4c322c066b681c5b7b28b1ff668e5efecb96c5e0732ee854929dd0ea5f5c5a7837311cf73d2f6170567b1a287a3553ec46324ccf15fbcff84fdd433fe87c185592a79203b89a23a901e905531b7f19f31c8b599464aa0c9c5890e72a121e75"
      Suite = "bn256.adapter"
`,
    RosterTOMLLOCAL: `
[[servers]]
  Address = "tls://localhost:7776"
  Suite = "Ed25519"
  Public = "ed2494dfd826cd2c2ea23adedf564fb19619c6004bff91f08bc76e80bdb4ec7f"
  Description = "Conode_4"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "01dc5f40cae57758c6e7200106d5784f6bcb668959ddfd2f702f6aed63e47e3a6d90a61899a315b6fccaec991a4f2807d4fedce0b53c125c2005d34e0c1b4a9478cf60c1e5ab24a1e4ab597f596b4e2ba06af19cc3e5589bda58030a0f70f8208abfeeb072e04a87c79f2f814634257be9b0be4f9b8b6a927abcdfab099bc16c"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "3ff215e1755712e28f8f4d60ca412101c60d3707a68f68b37cf6c29437cc315c79ab1190fa941309e50dee30eeb677e6f2b8796f01d99a866c24dd5dd59594840dd387970c6eaaf6b56c8f8055c7c9d65f3a82e1bfc3bb7efb80d5faa9c33ff35099a96c9dbd32e65e3448f78693d00b346400796629229432161e1044b0af5f"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://localhost:7774"
  Suite = "Ed25519"
  Public = "0a0bdbb3f4059e9dad2d92b967bde211865f7d00839abd3330d8c9c4423b10bc"
  Description = "Conode_3"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6ea7db10d9f93b36045203d4008501f30a80d7c177847a784b483dcf6fdcfbe47e9f0123093ca3d715307662a642c684a3884656fc75c04d16f3cb1db67cd9e12f8c5ea637d124e1824522ce445f2848763bf3962b05ee662eafb78ac8ddd3b8771bccc8e920287857f56eabe094e5962f201a11f1f2c8ab388ff47dcb2e1f7a"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "58eaa4086f9033bb6398a8d4a6e6a7c136aa19e85c452f0ae069eb5a008e220305f726a056451ae0cb2c8deec820d6b5ad6585684122c38199403fa49bafeda06734432240cac370d70a5be9799258d044fb04f6aa634fed5d4c7080b340e08359142bbbd602323924ee97db1dbf6e3fb19b941880156cb98552fbe957115743"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://localhost:7772"
  Suite = "Ed25519"
  Public = "5f1a868b2dfa1e799c958a2dd5d850a660e3596a5ceb4fe7ff9dcf9c2efd419b"
  Description = "Conode_2"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "70208fdcbaa6f3fa539380d5b19d7318a1c8ae46aa8af1d17e2d321afbda46397654fd72432f2050689f3c942801fe9e2e401d73c1accae8b7f683c0a261c57469937eb409864b1d9c0ed5fd012ec0b4fa835b92c12770e5b3cd5b900528fa9b1b6672b9121d68b4f98fd238918c96c31643271d2ac0fdb54af15dabfd772f6c"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "7dafa5bc547beb1ecb26267df3b5294e1a641c356d1039cc5c94acc0048a56fb2e2d6dc7507291cf4fe03418e1e16f0810637a67e9a31edf8d06cca399f0f5c85e3dbe740bd564968467b0cc1792688791bd59a61eb98723ab30ab3f784e2225054437110ea972c43f633dc510fd07d50871ec346ee1c088e5441d415dd9e95e"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://localhost:7770"
  Suite = "Ed25519"
  Public = "3de71200e7ecaeb49dc7f824317fb4ef6890e90018c49617139b6e61075f0247"
  Description = "Conode_1"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "7ab3a36be090002cf36a82bc606d6b0ef1c4432abae0c432c0ab02c9c0d5b2513c6f18625f847aef2d49a57fe5adaea103ba48dc60e9b4dd51f1beecce2b0a2f763a25ca4e2a460b20fd3e80e0d9d306b760cd9c715ecbc77047e875f32dc8435ee5ceb8910a1290827d4fbf61483aa7758c81f83ab9a8ca58fc8a6b1c0f1d5b"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "0524681253b82af55c0976e792014707c39405fe215bb1ebf6a3159dcbbb944535619f32ed4a91a4d1fcf4d9aa4ad14a1d349d5354dbbd6fb51907087a09ce7862ee5808a4c3f5b3b23ee631f1ce42b56107acec13fa06817263d1e7f77938f1149249e598fd24207e7e5e33ece750d36fe966faf8fda9c7ace13a6a8b0b9fa4"
      Suite = "bn256.adapter"
`,
    RosterTOMLC4DT: `
[[servers]]
  Address = "tls://conode.c4dt.org:8886"
  Suite = "Ed25519"
  Public = "ed2494dfd826cd2c2ea23adedf564fb19619c6004bff91f08bc76e80bdb4ec7f"
  Description = "Conode_4"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "01dc5f40cae57758c6e7200106d5784f6bcb668959ddfd2f702f6aed63e47e3a6d90a61899a315b6fccaec991a4f2807d4fedce0b53c125c2005d34e0c1b4a9478cf60c1e5ab24a1e4ab597f596b4e2ba06af19cc3e5589bda58030a0f70f8208abfeeb072e04a87c79f2f814634257be9b0be4f9b8b6a927abcdfab099bc16c"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "3ff215e1755712e28f8f4d60ca412101c60d3707a68f68b37cf6c29437cc315c79ab1190fa941309e50dee30eeb677e6f2b8796f01d99a866c24dd5dd59594840dd387970c6eaaf6b56c8f8055c7c9d65f3a82e1bfc3bb7efb80d5faa9c33ff35099a96c9dbd32e65e3448f78693d00b346400796629229432161e1044b0af5f"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://conode.c4dt.org:8884"
  Suite = "Ed25519"
  Public = "0a0bdbb3f4059e9dad2d92b967bde211865f7d00839abd3330d8c9c4423b10bc"
  Description = "Conode_3"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "6ea7db10d9f93b36045203d4008501f30a80d7c177847a784b483dcf6fdcfbe47e9f0123093ca3d715307662a642c684a3884656fc75c04d16f3cb1db67cd9e12f8c5ea637d124e1824522ce445f2848763bf3962b05ee662eafb78ac8ddd3b8771bccc8e920287857f56eabe094e5962f201a11f1f2c8ab388ff47dcb2e1f7a"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "58eaa4086f9033bb6398a8d4a6e6a7c136aa19e85c452f0ae069eb5a008e220305f726a056451ae0cb2c8deec820d6b5ad6585684122c38199403fa49bafeda06734432240cac370d70a5be9799258d044fb04f6aa634fed5d4c7080b340e08359142bbbd602323924ee97db1dbf6e3fb19b941880156cb98552fbe957115743"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://conode.c4dt.org:8882"
  Suite = "Ed25519"
  Public = "5f1a868b2dfa1e799c958a2dd5d850a660e3596a5ceb4fe7ff9dcf9c2efd419b"
  Description = "Conode_2"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "70208fdcbaa6f3fa539380d5b19d7318a1c8ae46aa8af1d17e2d321afbda46397654fd72432f2050689f3c942801fe9e2e401d73c1accae8b7f683c0a261c57469937eb409864b1d9c0ed5fd012ec0b4fa835b92c12770e5b3cd5b900528fa9b1b6672b9121d68b4f98fd238918c96c31643271d2ac0fdb54af15dabfd772f6c"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "7dafa5bc547beb1ecb26267df3b5294e1a641c356d1039cc5c94acc0048a56fb2e2d6dc7507291cf4fe03418e1e16f0810637a67e9a31edf8d06cca399f0f5c85e3dbe740bd564968467b0cc1792688791bd59a61eb98723ab30ab3f784e2225054437110ea972c43f633dc510fd07d50871ec346ee1c088e5441d415dd9e95e"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://conode.c4dt.org:8880"
  Suite = "Ed25519"
  Public = "3de71200e7ecaeb49dc7f824317fb4ef6890e90018c49617139b6e61075f0247"
  Description = "Conode_1"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "7ab3a36be090002cf36a82bc606d6b0ef1c4432abae0c432c0ab02c9c0d5b2513c6f18625f847aef2d49a57fe5adaea103ba48dc60e9b4dd51f1beecce2b0a2f763a25ca4e2a460b20fd3e80e0d9d306b760cd9c715ecbc77047e875f32dc8435ee5ceb8910a1290827d4fbf61483aa7758c81f83ab9a8ca58fc8a6b1c0f1d5b"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "0524681253b82af55c0976e792014707c39405fe215bb1ebf6a3159dcbbb944535619f32ed4a91a4d1fcf4d9aa4ad14a1d349d5354dbbd6fb51907087a09ce7862ee5808a4c3f5b3b23ee631f1ce42b56107acec13fa06817263d1e7f77938f1149249e598fd24207e7e5e33ece750d36fe966faf8fda9c7ace13a6a8b0b9fa4"
      Suite = "bn256.adapter"
`,
    /*
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
    */
    // tslint:disable-next-line
    RosterTOMLCalypso: `
[[servers]]
  Address = "tls://conode.c4dt.org:7776"
  Suite = "Ed25519"
  Public = "c2d64d0b6b4ad33eca744f3b1cf09c417b6c1b94be7128ffaba01d118220c294"
  Description = "Conode_3"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "07e87f17f4ecd8f556f6692da991080e5b554e2bbc2bbd41e45b11e6a52945be7f6e1d411295d813d660fd0c3fdd08d0e9dd8f1af56fc6650fac5bb44b513a0560da91d6d5b85509dfc32d2479092e85abff18ada72e7f0a6c3ff35c7002a27283419957311dbe10786ef0f8611d58ee6d5280ef0cfcd07f3319712b2fd0e695"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "81c12d72c2e9523dead1beb6f954116caaea41d5b8286c8c2958c984c5e79c5b00bf0d4bb5112b7f43b9cf9ebf44f68be0cf84de98d6bee2fc1c120e97ed40b10b8ae75471f4133bfb12f6ed64fa8459c720f3b0348add0e7a14a3ecc833d30681d31b565fde21f3d2961ec4e48afa8767a476e85fb2f0cc37a4519eabc70353"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://conode.c4dt.org:7774"
  Suite = "Ed25519"
  Public = "0866448991887684959bd183da8a300558d44ecf31aa9091d31c17e42ec9cb12"
  Description = "Conode_2"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "73ee09ef3daf9df0d9100390d14a4900937deba4a4dbf140da7e877ed6a1e1038020f90d8c3b2ab425afec04ad1e955b3996cd8d5b71b541d071a524aebd6bfb31033150a1015f034c4b38176613d47e437fc067da4e3304fba9849cbd3a000a6002a1808d35cf34fa11b2ec6abe01b7862268366fbbc9c0ad51c941101ed26f"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "7bfc28c37d77914f65f63ee284462b4e9b5edc3914afb2f188293af88f60b9541b971e401f0df992d83b663b3c0376e1e8e892242f8e84370f984d1dc633384520166e78bf187cde742ed683afa90c0ce540efd38bdcd21a67271c17fe5635953e4d981fa4c26a4fbcefc0fca73908a356ce637a948d9282941743e3bed377ff"
      Suite = "bn256.adapter"
[[servers]]
  Address = "tls://conode.c4dt.org:7772"
  Suite = "Ed25519"
  Public = "7f9d54738f9ba0cb040e12e9304f00404cc5e23bf75ce52c2e0fd4cf533d3834"
  Description = "Conode_1"
  [servers.Services]
    [servers.Services.ByzCoin]
      Public = "5f7e8168cdcec8ac358b548362489420b46a1bac1d30cc064d4d14bac16805a74bc6220262a0df06ee8beba24c0d88e64fe4c2af81c9cc14aefa15ea9a238fd5872ce28d7418116d464c634df104c2bca0428fd6c1d43f2ac610646521d222fe64e96e61addd0f43c4d4bade0a023c7af8025c45516edb3f6f637a3cd839c67b"
      Suite = "bn256.adapter"
    [servers.Services.Skipchain]
      Public = "53f75cc50ff0c67622ee9df25e488acfd7917af63cbc2350feddf65515fa50fe473082e0fb6c34c850666e28f63673f46299243f1490c312e76b41b6da42fdd425e8d3d7c9310ec7a469b564c41c46bfea0a2fce7f972eba1c9acbf018a17ee323d5e7a0d285b929a73233d38a5c70599037b5c739dc5fdfff10101285b3d1dd"
      Suite = "bn256.adapter"
`,
    // ByzCoinID
    ByzCoinID: null,
    AdminDarc: null,
    Ephemeral: null,

    // - Testing settings - all settings here are set for the non-testing case. If testing == true, then the
    // settings should be set in the below 'if'. This ensures that we don't forget any testing setting.

    Roster: null,
    RosterCalypso: null,

    // Testing
    Testing: false,
    // Calling registering of calypso
    CalypsoRegister: false,
    // If Confirm is false, there are no security confirmations asked. This is for
    // easier UI testing.
    Confirm: true,
    // pre-loads polling stats for UI testing
    PollPrechoice: false,
    // Alias can be set to a non-"" value to have a default alias
    Alias: "",
    // TestButtons allow to delete everything
    TestButtons: false,
    // DataFile can be set to a string that will be used to overwrite the Data
    DataFile: null,
};

export function activateTesting() {
    Defaults.Testing = true;
    Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLLOCAL);
    Defaults.RosterCalypso = Roster.fromTOML(Defaults.RosterTOMLLOCAL);
    Defaults.CalypsoRegister = true;
    Defaults.ByzCoinID = Buffer.from("5f78d08a260b6fcc0b492448ec272dc4a59794ddf34a9914fdfe4f3faeba616e", "hex");
    Defaults.AdminDarc = Buffer.from("1cbc6c2c4da749020ffa838e262c952862f582d9730e14c8afe2a1954aa7c50a", "hex");
    Defaults.Ephemeral = Buffer.from("2d9e65673748d99ba5ba7b6be76ff462aaf226461ea226fbb059cbb2af4a7e0c", "hex");
    Defaults.Alias = "garfield";
    Defaults.Confirm = false;
    Defaults.TestButtons = true;
}

export function activateDEDIS() {
    Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLDEDIS);
    Defaults.RosterCalypso = Roster.fromTOML(Defaults.RosterTOMLCalypso);
    Defaults.ByzCoinID = Buffer.from("9cc36071ccb902a1de7e0d21a2c176d73894b1cf88ae4cc2ba4c95cd76f474f3", "hex");
    Defaults.AdminDarc = Buffer.from("d025450db8db9f4f5ddb2f6eed83cb3f50dfcf53b005239041458f6984d34ff3", "hex");
}

export function activateC4DT() {
    Defaults.Roster = Roster.fromTOML(Defaults.RosterTOMLC4DT);
    Defaults.RosterCalypso = Roster.fromTOML(Defaults.RosterTOMLC4DT);
    Defaults.CalypsoRegister = true;
    Defaults.ByzCoinID = Buffer.from("5b081e02e38e583085204abfe4553ceb6e0833a530bf8fa476ce2f5c1a9a51ae", "hex");
    Defaults.AdminDarc = Buffer.from("05e647cbdd220e30e33db4d168bd3ceacd09839ca099ca8ef5ab146c986726f6", "hex");
    Defaults.Ephemeral = Buffer.from("ed3ebf1be6fbe7496a8a31c4124fe560fa2f1651dbfa851c61cbd48c961ab30c", "hex");
    Defaults.Alias = "c4dt";
}

// activateTesting();
activateC4DT();
// activateDEDIS();
