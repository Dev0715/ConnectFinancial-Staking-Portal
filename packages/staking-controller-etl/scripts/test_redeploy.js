const hre = require("hardhat");
const ethers = require("ethers");
const parseEther = ethers.utils.parseEther;
const proxyAdminAbi = require("@connectfinancial/connect-token/lib/proxy-admin.json");
async function main() {
  // const [signer] = await hre.ethers.getSigners();
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0x05896Fe4c77cFF7c1222662B3a21A6E33c700475"],
  });
  const signer = await hre.ethers.getSigner(
    "0x05896Fe4c77cFF7c1222662B3a21A6E33c700475"
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
  const proxyAdmin = new hre.ethers.Contract(
    "0x4e1dba58c9e4269f9d5897314c39c3629dde7302",
    proxyAdminAbi,
    admin
  );
  const scAbi = await hre.artifacts.readArtifact("StakingControllerArb");
  const sc = new hre.ethers.Contract(
    "0x25F6847487DE7Ea72E53cF54ccc6549631a807aF",
    scAbi.abi,
    signer
  );
  console.log(sc.address);
  console.log((await signer.provider.getBlockNumber()).toString());
  async function runView(sc) {
    const factory = await hre.ethers.getContractFactory("ArbQuery", {
      signer,
    });
    const data = await signer.provider.call({
      data: factory.getDeployTransaction(sc.address, await signer.getAddress())
        .data,
    });
    console.log(data);
    const [base, redeemable, bonuses] = factory.interface.decodeFunctionResult(
      "decodeResponse",
      data
    );
    const decoded = factory.interface.decodeFunctionResult("render", base);

    return decoded;
  }
  const from = await (await hre.ethers.getSigners())[0].getAddress();
  console.log(
    ethers.utils.formatEther(
      (await runView(sc)).returnstats.totalWeight.toString()
    )
  );
  /* await sc.callStatic.receiveCallback(
    await signer.getAddress(),
    ethers.constants.AddressZero
  );*/
  //console.log((await signer.provider.getBlockNumber()).toString());
  // console.log(await sc.callStatic.unstake(5000));
  console.log(await sc.callStatic.claimRewards());
}

main().then(() => {});
