"use strict";

const hre = require("hardhat");

const { ProxyAdmin } = require("../lib/proxy-admin.js");
const PROXY_ADMIN_CONTRACT = "0x7d82ed6e0f89009d76164c6e5379284ed0ec705e";
const PROXY_ADMIN = ethers.utils.getAddress(
  "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37"
);
const STAKING_ADDRESS = ethers.utils.getAddress(
  "0xbbb604a12C6E4F88f1fa562603BF7D9d48CDf702"
);

let STAKING_IMPL = "0xEA5bA3A16c3dC399D2528D453aC4B8C9e1aC0eF4";

const getSigner = async () => {
  const [signer] = await hre.ethers.getSigners();
  const { chainId } = await signer.provider.getNetwork();
  if (chainId === 1) {
    if ((await signer.getAddress()) === PROXY_ADMIN) return signer;
    throw Error("wrong wallet to interact with ProxyAdmin");
  } else {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [PROXY_ADMIN],
    });
    return await hre.ethers.getSigner(PROXY_ADMIN);
  }
};

const getPreviousDeployment = async () => {
  const [signer] = await hre.ethers.getSigners();
  const { chainId } = await signer.provider.getNetwork();
  if (chainId === 31337)
    return require("../deployments/live/StakingController");
  else await hre.deployments.get("StakingController");
};

const getDeployerAddress = async () => {
  await getSigner(); // verify we actually have the right signer if we are mainnet
  const [signer] = await hre.ethers.getSigners();
  return await signer.getAddress();
};

const redeploy = async () => {
  const CNFI_ADDRESS = "0xEABB8996eA1662cAd2f7fB715127852cd3262Ae9";
  const SCNFI_ADDRESS = "0x4285c3c01616BF566abeb69e72fBe499d481b2B9";
  const TREASURY_ADDRESS = "0x6905Cae06C26558899aDb448B5be60cc6F1Cb5Ed";

  const from = await getDeployerAddress();

  const pCnfiFactoryLib = await deployments.deploy("pCNFIFactoryLib", {
    contractName: "pCNFIFactoryLib",
    args: [],
    libraries: {},
    from,
  });
  console.log("deployed pCnfiFactoryLib to:", pCnfiFactoryLib.address);
  const updateToLastLib = await deployments.deploy("UpdateToLastLib", {
    contractName: "UpdateToLastLib",
    args: [],
    libraries: {},
    from,
  });
  console.log("deployed updateToLastLib to:", updateToLastLib.address);
  const updateRedeemableLib = await deployments.deploy("UpdateRedeemableLib", {
    contractName: "UpdateRedeemableLib",
    args: [],
    libraries: {},
    from,
  });
  console.log("deployed updateRedeemableLib to:", updateRedeemableLib.address);
  const calculateRewardsLib = await deployments.deploy("CalculateRewardsLib", {
    contractName: "CalculateRewardsLib",
    args: [],
    libraries: {},
    from,
  });
  console.log("deployed calculateRewardsLib to:", calculateRewardsLib.address);
  const libraries = {
    pCNFIFactoryLib: pCnfiFactoryLib.address,
    UpdateToLastLib: updateToLastLib.address,
    UpdateRedeemableLib: updateRedeemableLib.address,
    CalculateRewardsLib: calculateRewardsLib.address,
  };

  const stakingControllerDeployment = await getPreviousDeployment();

  console.log("deploying Controller");
  const provider = ethers.getDefaultProvider(1);
  const stakingController = await deployments.deploy("StakingController", {
    contractName: "StakingController",
    args: [],
    libraries,
    from,
    gasPrice: await provider.getGasPrice(),
  });

  console.log(
    "deployed staking impl to:",
    stakingController.receipt.contractAddress
  );
};

const upgrade = async () => {
  const signer = await getSigner();
  const proxyAdmin = new ProxyAdmin(PROXY_ADMIN_CONTRACT, signer);

  console.log("upgrading StakingController");
  await proxyAdmin.upgrade(STAKING_ADDRESS, STAKING_IMPL);
  console.log("upgraded StakingController");
  await deployments.save(
    "StakingController",
    Object.assign(require("../deployments/live/StakingController"), {
      address: STAKING_ADDRESS,
    })
  );
};

const main = async () => {
  // await redeploy();

  await upgrade();
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
