const hre = require("hardhat");
const ethers = require("ethers");
const parseEther = ethers.utils.parseEther;
const proxyAdminAbi = require("@connectfinancial/connect-token/lib/proxy-admin.json");
const PROXY_ADMIN = "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37";
const getSigner = async () => {
  const [signer] = await hre.ethers.getSigners();
  const { chainId } = await signer.provider.getNetwork();
  if ([42161, 1].includes(chainId)) {
    if ((await signer.getAddress()).toLowerCase() === PROXY_ADMIN.toLowerCase())
      return signer;
    throw Error("wrong wallet to interact with ProxyAdmin");
  } else {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [PROXY_ADMIN],
    });
    return await hre.ethers.getSigner(PROXY_ADMIN);
  }
};

async function main() {
  // const [signer] = await hre.ethers.getSigners();
  /*await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x52A62fe122FF79741e54f70F784A7aAA2F970005"],
  });
  const signer = await hre.ethers.getSigner(
    "0x52A62fe122FF79741e54f70F784A7aAA2F970005"
  );

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xfe07d499e17482e5c4f40783ece3135dbdfe5d37"],
  });
  const admin = await hre.ethers.getSigner(
    "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37"
  );

  (await hre.ethers.getSigners())[0].sendTransaction({
    value: ethers.utils.parseEther("1"),
    to: await signer.getAddress(),
  });

  (await hre.ethers.getSigners())[0].sendTransaction({
    value: ethers.utils.parseEther("1"),
    to: await admin.getAddress(),
  });
  */

  const [signer] = await hre.ethers.getSigners();
  const proxyAdmin = new hre.ethers.Contract(
    "0x4e1dba58c9e4269f9d5897314c39c3629dde7302",
    proxyAdminAbi,
    await getSigner()
  );
  const scAbi = await hre.artifacts.readArtifact("StakingControllerArb");
  const sc = new hre.ethers.Contract(
    "0x25F6847487DE7Ea72E53cF54ccc6549631a807aF",
    scAbi.abi,
    signer
  );
  const from = await signer.getAddress();
  // console.log(await runView(sc));
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
  const scnfi_address = "0x5B745373D04a7A61693626530C73D71eceFd0145";
  const treasury_address = "0x6905Cae06C26558899aDb448B5be60cc6F1Cb5Ed";
  const stakingController = await deployments.deploy(
    "StakingControllerArb_Impl",
    {
      contract: "StakingControllerArb",
      args: [],
      libraries,
      from,
      gasPrice: await signer.provider.getGasPrice(),
    }
  );
  const impl = stakingController.receipt.contractAddress;
  console.log(impl);
  await proxyAdmin.upgrade(sc.address, impl);
  /* await sc.callStatic.receiveCallback(
    await signer.getAddress(),
    ethers.constants.AddressZero
  );*/
  //console.log(await sc.callStatic.unstake(5000));
}

main().then(() => {});
