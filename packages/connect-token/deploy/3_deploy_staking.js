const hre = require("hardhat");
require("dotenv").config();
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
} = require("../lib/deploy-helpers");
let CNFI_ADDRESS = "0xeabb8996ea1662cad2f7fb715127852cd3262ae9";
const PROXY_ADMIN_CONTRACT = "0x7d82ed6e0f89009d76164c6e5379284ed0ec705e";
const PROXY_ADMIN = "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37";
const { ProxyAdmin } = require("../lib/proxy-admin.js");
const { runView } = require("../");
const { ethers } = hre;
const { parseEther, formatEther } = ethers.utils;

async function deploy(
  contractName,
  params,
  opts = {},
  name = undefined,
  abi = []
) {
  console.log(global.IS_MAINNET);
  const artifact = await hre.artifacts.readArtifact(contractName);
  const [signer] = await ethers.getSigners();
  const factory = await hre.ethers.getContractFactory(contractName, {
    libraries: opts.libraries || {},
    signer,
  });
  //const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  const deployed = await hre.upgrades.deployProxy(factory, params, {
    unsafeAllowLinkedLibraries: true,
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

async function deployStaking() {
  global.IS_MAINNET = false;
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
  const libraries = {
    pCNFIFactoryLib: pCnfiFactoryLib.address,
    UpdateToLastLib: updateToLastLib.address,
    UpdateRedeemableLib: updateRedeemableLib.address,
    CalculateRewardsLib: calculateRewardsLib.address,
  };
  console.log("deploying sCNFI");
  const [scnfi] = await deploy("sCNFI", []);
  if (!global.IS_MAINNET) {
    console.log("deploying CNFI");
    CNFI_ADDRESS = (await deploy("ConnectToken", []))[0].address;
  }
  const treasury = {
    address: TREASURY_ADDRESS,
  };
  const [sc] =
    !global.IS_MAINNET || IS_TEST
      ? await deploy(
          "StakingControllerTest",
          [CNFI_ADDRESS, scnfi.address, treasury.address],
          {
            libraries,
          },
          "StakingController",
          abi
        )
      : await deploy(
          "StakingController",
          [CNFI_ADDRESS, scnfi.address, treasury.address],
          {
            libraries,
          },
          undefined,
          abi
        );
  let cnfi;
  if (!global.IS_MAINNET) {
    const [_cnfi, cnfiFactory] = await deploy(
      maybeAppendTest("ConnectToken"),
      []
    );
    cnfi = _cnfi;
  } else {
    const proxyAdmin = new ProxyAdmin(PROXY_ADMIN_CONTRACT, signer);

    //const cnfi = await ethers.getContractFactory("ConnectToken", { signer });
    cnfi = new ethers.Contract(
      CNFI_ADDRESS,
      (await artifacts.readArtifact(maybeAppendTest("ConnectToken"))).abi,
      signer
    );
    //    await cnfi.transferOwnership(proxyAdmin.address);

    const _cnfi = await deployments.deploy(maybeAppendTest("ConnectToken"), {
      contractName: maybeAppendTest("ConnectToken"),
      args: [],
      libraries: {},
      from,
    });
    console.log("deployed");
    const cnfiArtifact = await artifacts.readArtifact(
      maybeAppendTest("ConnectToken")
    );
    const cnfiInterface = new ethers.utils.Interface(cnfiArtifact.abi);
    const calldata = cnfiInterface.encodeFunctionData("setStakingController", [
      sc.address,
    ]);
    const result = await proxyAdmin.upgradeAndCall(
      CNFI_ADDRESS,
      _cnfi.address,
      cnfiInterface.encodeFunctionData("setStakingController", [sc.address])
    );
    console.log("upgraded");
    await hre.deployments.save(maybeAppendTest("ConnectToken"), {
      address: CNFI_ADDRESS,
      abi: cnfiArtifact.abi,
      bytecode: cnfiArtifact.bytecode,
    });
    cnfi = new ethers.Contract(CNFI_ADDRESS, cnfiArtifact.abi, signer);
  }
  //  const [treasury] = await deploy('CNFITreasury', [signer.address]);

  /*
  let tx = await signer.sendTransaction({
    to: cnfi.address,
    data: cnfiFactory.interface.encodeFunctionData('transferOwnership', [
      sc.address,
    ]),
  });
  */
  //  await treasury.transferOwnership(sc.address);
  if (IS_TEST) {
    const treasurySigner = await getSignerByAddress(TREASURY_ADDRESS);
    const tx = await cnfi
      .connect(treasurySigner)
      .approve(sc.address, ethers.constants.MaxUint256);
    console.log("treasury balance approved");
  }
  await scnfi.transferOwnership(sc.address);
  console.log("scnfi ownership transferred");
  /*
  await cnfi.transferOwnership(sc.address);
  console.log('cnfi ownership transferred');
  */
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
  console.log("govern sent");
  if (!global.IS_MAINNET) {
    //await sc.mintCnfi(treasury.address, parseEther('100000'));
    // console.log('minted');
    await cnfi.setStakingController(sc.address);
  }
  // await sc.mintCnfi(signer.address, parseEther('20000')).catch(() => {})
  // await sc.transferOwnership(process.env.USER_ADDRESS).catch(() => {})
  //  console.log(record.reduce((r, v) => r.add(v), BigNumber.from(0)).mul(ethers.utils.parseUnits('300', 9)).toString(10));
}

module.exports = deployStaking;
