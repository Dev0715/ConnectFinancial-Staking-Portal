"use strict";

const hre = require("hardhat");
const ethers = require("ethers");

const correspondingL2 = {
  1: 42161,
  4: 421611,
};
const correspondingL1 = {
  42161: 1,
  421611: 4,
};

class Implementation {
  addresses = {
    1: "",
    4: "",
    42161: "",
    421611: "",
  };
  correspondingL1 = correspondingL1;
  correspondingL2 = correspondingL2;
  defaultChainId =
    hre.network.config.chainId == 31337 ? 1 : hre.network.config.chainId;
  constructor(addresses, abi, signerOrProvider) {
    this.addresses = addresses;
    this.signerOrProvider = signerOrProvider;
    this.abi = abi;
  }
  async getDefaultContract(chainId, abi) {
    return new ethers.Contract(
      this.addresses[chainId || this.defaultChainId],
      abi || this.abi,
      (await hre.ethers.getSigners())[0]
    );
  }
  async getCorrespondingL2Contract(chainId, abi) {
    return await this.getDefaultContract(
      correspondingL2[chainId || this.defaultChainId],
      abi
    );
  }
  async getCorrespondingL1Contract(chainId, abi) {
    return await this.getDefaultContract(
      correspondingL1[chainId || this.defaultChainId],
      abi
    );
  }
  address(chain) {
    return this.addresses[chain ? chain : this.defaultChainId];
  }
}

const CHAIN = hre.network.config.chainId;
const { ProxyAdmin } = require("./proxy-admin.js");
const ProxyAdminImpls = new Implementation({
  1: "0x7d82ed6e0f89009d76164c6e5379284ed0ec705e",
  421611: "0xFE0ab62D55E211336C295bbAdE6D07da46ed50C1",
  42161: "0x8A01Cd2339B2352906Ce2271522f741288f27Cd3",
  4: "0xddc55067bff62398548ed9ab113b3a9b4798942b",
});
const ProxyAdminCallers = new Implementation({
  1: ethers.utils.getAddress("0xfe07d499e17482e5c4f40783ece3135dbdfe5d37"),
  4: ethers.utils.getAddress("0x7F19b8BE3e0254088CAac3055c35bccFB62aCdFb"),
  421611: "0x34f01e11EADcCADdB25A5b575196af225B4E9A48",
  42161: ethers.utils.getAddress("0xfe07d499e17482e5c4f40783ece3135dbdfe5d37"),
});
const CNFI = new Implementation({
  1: ethers.utils.getAddress("0xeabb8996ea1662cad2f7fb715127852cd3262ae9"),
  4: "0xB3081B53E5EB8C35Ccb4BBd0A4c1420f8Af0125D",
  421611: "0x8012B69F9a796649d0431E3FbeB0e897f4116691",
  42161: "0x6F5401c53e2769c858665621d22DDBF53D8d27c5",
});
const CONTRACT_NAME = (() => {
  switch (CHAIN) {
    case 1:
      return "ConnectTokenArb";
    case 4:
      return "ConnectTokenTest";
    case 421611:
    case 42161:
      return "ConnectTokenL2";
    default:
      return "ConnectToken";
  }
})();
const Gateways = new Implementation({
  1: "0xcEe284F754E854890e311e3280b767F80797180d",
  4: "0x917dc9a69F65dC3082D518192cd3725E1Fa96cA2",
  42161: "0x096760F208390250649E3e8763348E783AEF5562",
  421611: "0x9b014455AcC2Fe90c52803849d0002aeEC184a06",
});
const Routers = new Implementation({
  1: "0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef",
  4: "0x70C143928eCfFaf9F5b406f7f4fC28Dc43d68380",
  42161: "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933",
  421611: "0x9413AD42910c1eA60c737dB5f58d1C504498a3cD",
});

module.exports = {
  ProxyAdminImpls,
  ProxyAdminCallers,
  CNFI,
  CONTRACT_NAME,
  Gateways,
  Routers,
  correspondingL1,
  correspondingL2,
};
