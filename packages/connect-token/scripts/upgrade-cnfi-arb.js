"use strict";

const hre = require("hardhat");
const CHAIN = hre.network.config.chainId;
const { ProxyAdmin } = require("../lib/proxy-admin.js");
const ProxyAdminAbi = require("../lib/proxy-admin.json");
const {
  ProxyAdminCallers,
  ProxyAdminImpls,
  Routers,
  Gateways,
  CNFI,
  CONTRACT_NAME,
} = require("../lib/chainutil");
const { makeArbBridge } = require("../lib/l2utils");
const { BridgeHelper } = require("arb-ts");
const { provider: l2provider, makeArbRetryableTx } = require("../lib/l2utils");
const gasPrice = 0;
let CNFI_IMPL;
const STAKING_CONTROLLER_ADDRESS = "0x25F6847487DE7Ea72E53cF54ccc6549631a807aF";

const getSigner = async () => {
  const [signer] = await hre.ethers.getSigners();
  if (hre.network.config.chainId != 31337) {
    if ((await signer.getAddress()) === ProxyAdminCallers.address())
      return signer;
    throw Error("wrong wallet to interact with ProxyAdmin");
  } else {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [ProxyAdminCallers.address()],
    });
    return await hre.ethers.getSigner(ProxyAdminCallers.address());
  }
};

const getDeployerAddress = async () => {
  await getSigner(); // verify we actually have the right signer if we are mainnet
  const [signer] = await hre.ethers.getSigners();
  return await signer.getAddress();
};

const main = async () => {
  const signer = await getSigner();
  //const { bridge } = await makeArbBridge();
  //const arbRetryableTx = await makeArbRetryableTx(l2provider);
  const proxyAdmin = new ethers.Contract(
    ProxyAdminImpls.address(),
    ProxyAdminAbi,
    signer
  );
  const cnfiIface = new ethers.utils.Interface(
    (await hre.artifacts.readArtifact("ConnectTokenL2")).abi
  );
  const connectTokenDeployment = await hre.deployments.get("ConnectTokenL2");
  console.log("deploying ConnectToken");
  const connectToken = await deployments.deploy("ConnectTokenL2", {
    contractName: "ConnectTokenL2",
    args: [],
    libraries: {},
    from: await getDeployerAddress(),
  });

  // console.log(connectToken.address);
  CNFI_IMPL = connectToken.address;
  const data = cnfiIface.encodeFunctionData("setStakingController", [
    STAKING_CONTROLLER_ADDRESS,
  ]);
  /*
  console.log("upgrading ConnectToken");
  console.log(CNFI.correspondingL2[hre.network.config.chainId]);
  const CNFI_L2 = CNFI.address(CNFI.correspondingL2[1]);

  console.log(CNFI_L2);
  const maxSubmission = (await arbRetryableTx.getSubmissionPrice(700))[0];
  const data = cnfiIface.encodeFunctionData(
    "registerTokenOnL2(address,address,address,uint256,uint256,uint256,uint256,uint256,address,address)",
    [
      Gateways.address(),
      Routers.address(),
      CNFI_L2,
      maxSubmission,
      maxSubmission,
      await l2provider.getGasPrice(),
      hre.ethers.utils.parseEther("0.0001"),
      hre.ethers.utils.parseEther("0.0001"),
      await signer.getAddress(),
      "0x52A62fe122FF79741e54f70F784A7aAA2F970005",
    ]
  );*/
  /*const receipt = await proxyAdmin.upgradeAndCall(
    CNFI.address(),
    CNFI_IMPL,
    data,
    {
      value: hre.ethers.utils.parseEther("0.0002"),
    }
  );*/
  /*await bridge.redeemRetryableTicket(
    "0x8981ff4b7f051b6750dd962cf4743901525c92d6870c8b0932ffe92fe6a50071"
  );*/
  /*const [, seqnum] = await bridge.getInboxSeqNumFromContractTransaction(
    await bridge.getL1Transaction(
      "0x8981ff4b7f051b6750dd962cf4743901525c92d6870c8b0932ffe92fe6a50071"
    )
  );
  const l2txhash = await bridge.calculateL2TransactionHash(seqnum);
  const l2tx = await bridge.l2Provider.waitForTransaction(
    l2txhash,
    undefined,
    900000
  );
  const retryHash = await BridgeHelper.calculateL2RetryableTransactionHash(
    seqnum,
    bridge.l2Provider
  );
  const redemptionRec = await bridge.l2Bridge.arbRetryableTx.redeem(retryHash);
  */
  const receipt = await proxyAdmin.upgradeAndCall(
    CNFI.address(),
    CNFI_IMPL,
    data
  );
  console.log("upgraded ConnectToken");
  await deployments.save(
    CONTRACT_NAME,
    Object.assign(connectTokenDeployment, {
      address: CNFI.address(),
      implementation: CNFI_IMPL,
    })
  );
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
