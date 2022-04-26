"use strict";

const hre = require("hardhat");

const { ProxyAdmin } = require("../lib/proxy-admin.js");
const PROXY_ADMIN_CONTRACT = "0x7d82ed6e0f89009d76164c6e5379284ed0ec705e";
const PROXY_ADMIN = ethers.utils.getAddress(
  "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37"
);
const CNFI_ADDRESS = ethers.utils.getAddress(
  "0xeabb8996ea1662cad2f7fb715127852cd3262ae9"
);
let CNFI_IMPL;

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
  if (chainId === 31337) return require("../deployments/live/ConnectToken");
  else await hre.deployments.get("ConnectToken");
};

const getDeployerAddress = async () => {
  await getSigner(); // verify we actually have the right signer if we are mainnet
  const [signer] = await hre.ethers.getSigners();
  return await signer.getAddress();
};

const main = async () => {
  const signer = await getSigner();
  const proxyAdmin = new ProxyAdmin(PROXY_ADMIN_CONTRACT, signer);

  const connectTokenDeployment = await getPreviousDeployment();
  console.log("deploying ConnectToken");
  const connectToken = await deployments.deploy("ConnectToken", {
    contractName: "ConnectToken",
    args: [],
    libraries: {},
    from: await getDeployerAddress(),
  });
  console.log(connectToken.receipt.contractAddress);
  CNFI_IMPL = connectToken.receipt.contractAddress;
  console.log("upgrading ConnectToken");
  await proxyAdmin.upgrade(CNFI_ADDRESS, CNFI_IMPL);
  console.log("upgraded ConnectToken");
  await deployments.save(
    "ConnectToken",
    Object.assign(require("../deployments/live/ConnectToken"), {
      address: CNFI_ADDRESS,
    })
  );
};

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
