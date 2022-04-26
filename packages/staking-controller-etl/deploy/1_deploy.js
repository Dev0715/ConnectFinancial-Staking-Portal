const hre = require("hardhat");
require("dotenv").config();
const gasnow = require("ethers-gasnow");
const { chunk } = require("lodash");
const getGasPrice = gasnow.createGetGasPrice("rapid");
const OPENING_TIME = Math.floor(Date.now() / 1000) + 120;
const TREASURY_ADDRESS = "0x6905Cae06C26558899aDb448B5be60cc6F1Cb5Ed";
const CLOSING_TIME = OPENING_TIME + 60 * 60 * 24 * 7;
const { BigNumber } = require("@ethersproject/bignumber");
const linker = require("solc/linker");
const IS_TEST = Boolean(process.argv.find((v) => ["node", "test"].includes(v)));
const maybeAppendTest = (name) => name + (IS_TEST ? "Test" : "");
const record = [];
const {
  isMainnet,
  isFork,
  getSigner,
  getSignerByAddress,
} = require("@connectfinancial/connect-token/lib/deploy-helpers");
let CNFI_ADDRESS = "0x6F5401c53e2769c858665621d22DDBF53D8d27c5";
const PROXY_ADMIN_CONTRACT = "0x7d82ed6e0f89009d76164c6e5379284ed0ec705e";
const PROXY_ADMIN = "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37";
const {
  ProxyAdmin,
} = require("@connectfinancial/connect-token/lib/proxy-admin");
const { runView } = require("@connectfinancial/connect-token");
const { ethers } = hre;
ethers.providers.BaseProvider.prototype.getGasPrice = getGasPrice;
const { parseEther, formatEther } = ethers.utils;

async function deploy(
  contractName,
  params,
  opts = {},
  name = undefined,
  abi = []
) {
  const artifact = await hre.artifacts.readArtifact(contractName);

  const [signer] = await ethers.getSigners();
  const factory = await hre.ethers.getContractFactory(contractName, {
    libraries: opts.libraries || {},
    signer,
  });

  //const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  const deployed = await hre.upgrades.deployProxy(factory, params, {
    unsafeAllow: ["external-library-linking", "delegatecall"],
  });
  record.push(deployed.deployTransaction.gasLimit);
  await hre.deployments.save(name || contractName, {
    address: deployed.address,
    abi: abi.length > 0 ? artifact.abi.concat(abi) : artifact.abi,
    bytecode: artifact.bytecode,
  });
  console.log(`${contractName} deployed to: ${deployed.address}`);
  return [deployed, factory];
}

module.exports = async function deployStaking() {
  global.IS_MAINNET = [1, 42161].includes(hre.network.config.chainId);
  const { deployments, ethers, upgrades, artifacts } = hre;
  const signer = await getSigner();
  const { abi } = await artifacts.readArtifact("StakingEventsLib");
  const [realSigner] = await ethers.getSigners();
  const from = await realSigner.getAddress();
  const pCnfiFactoryLib = await deployments.deploy("pCNFIFactoryLib", {
    contractName: "pCNFIFactoryLib",
    args: [],
    libraries: {},
    from,
  });
  const updateToLastLib = await deployments.deploy("UpdateToLastLib", {
    contractName: "UpdateToLastLib",
    args: [],
    libraries: {},
    from,
  });
  const calculateRewardsLib = await deployments.deploy("CalculateRewardsLib", {
    contractName: "CalculateRewardsLib",
    args: [],
    libraries: {},
    from,
  });
  const updateRedeemableLib = await deployments.deploy("UpdateRedeemableLib", {
    contractName: "UpdateRedeemableLib",
    args: [],
    libraries: {},
    from,
  });
  const redeployLib = await deployments.deploy("StakingRedeployLib", {
    contractName: "StakingRedeployLib",
    args: [],
    libraries: {},
    from,
  });
  const libraries = {
    pCNFIFactoryLib: pCnfiFactoryLib.address,
    UpdateToLastLib: updateToLastLib.address,
    UpdateRedeemableLib: updateRedeemableLib.address,
    CalculateRewardsLib: calculateRewardsLib.address,
    StakingRedeployLib: redeployLib.address,
  };
  console.log(libraries);
  console.log("deploying sCNFI");
  const [scnfi] = await deploy("sCNFI", []);
  const treasury = {
    address: TREASURY_ADDRESS,
  };
  let cnfi;
  const [sc] = await deploy(
    "StakingControllerArb",
    [CNFI_ADDRESS, scnfi.address, treasury.address],
    {
      libraries,
    },
    "StakingControllerArb",
    abi
  );
  //  else {
  //   const proxyAdmin = new ProxyAdmin(PROXY_ADMIN_CONTRACT, signer);
  const _cnfi = await deployments.deploy(maybeAppendTest("ConnectToken"), {
    contractName: maybeAppendTest("ConnectToken"),
    args: [],
    libraries: {},
    from,
  });
  //   console.log("deployed");
  //   const cnfiArtifact = await artifacts.readArtifact(
  //     maybeAppendTest("ConnectToken")
  //   );
  //   const cnfiInterface = new ethers.utils.Interface(cnfiArtifact.abi);
  //   const calldata = cnfiInterface.encodeFunctionData("setStakingController", [
  //     sc.address,
  //   ]);
  //   const result = await proxyAdmin.upgradeAndCall(
  //     CNFI_ADDRESS,
  //     _cnfi.address,
  //     cnfiInterface.encodeFunctionData("setStakingController", [sc.address])
  //   );
  //   console.log("upgraded");
  //   await hre.deployments.save(maybeAppendTest("ConnectToken"), {
  //     address: CNFI_ADDRESS,
  //     abi: cnfiArtifact.abi,
  //     bytecode: cnfiArtifact.bytecode,
  //   });
  //   cnfi = new ethers.Contract(CNFI_ADDRESS, cnfiArtifact.abi, signer);
  // }

  await scnfi.transferOwnership(sc.address);
  console.log("scnfi ownership transferred");
  await sc.fillFirstCycle();
  console.log("filled first cycle");
  const queryArtifact = await deployments.getArtifact("Query");
  await deployments.save("Query", {
    abi: queryArtifact.abi,
    address: queryArtifact.address,
    bytecode: queryArtifact.bytecode,
  });
  await sc.govern(
    60 * 60 * 24 * 30 * 6,
    60 * 60 * 24,
    parseEther("5000"),
    parseEther("0"),
    0,
    parseEther("2"),
    [
      parseEther("1.15"),
      parseEther("1.25"),
      parseEther("1.3"),
      parseEther("1.4"),
    ],
    [2, 4, 6, 8],
    [
      parseEther("5000"),
      parseEther("20000"),
      parseEther("100000"),
      parseEther("200000"),
    ]
  );

  console.log("redeploying isolate");
  const isolate = require("../deployments/isolate.json");
  await sc.restoreBaseState(isolate[0]);
  /*const userdata = require("../deployments/userdata.json");
    await chunk(userdata, process.env.PAYLOAD_LENGTH).reduce(async (acc, d) => {
      await acc;
      console.log(d.length);
      const write = d.map((a) => {
        if (a[6] == "0x79E9ff28B7b9C2eEF2E0d5D4E5c1c5e93f68Bc56") {
          return a.splice(6, 1, "0xf5f23A2Fbf5695dA0EBE773D612DC95642E675Da");
        }
        return a;
      });
      return await sc.restoreState(d);
    }, Promise.resolve());
    */

  console.log("govern sent");
  /*if (!global.IS_MAINNET) {
    //await sc.mintCnfi(treasury.address, parseEther('100000'));
    // console.log('minted');
    await cnfi.setStakingController(sc.address);
  }*/
  // await sc.mintCnfi(signer.address, parseEther('20000')).catch(() => {})
  // await sc.transferOwnership(process.env.USER_ADDRESS).catch(() => {})
  //  console.log(record.reduce((r, v) => r.add(v), BigNumber.from(0)).mul(ethers.utils.parseUnits('300', 9)).toString(10));
};
