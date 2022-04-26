const hre = require("hardhat");
const ethers = require("ethers");
const parseEther = ethers.utils.parseEther;
async function main() {
  /* await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xFE07D499e17482e5c4F40783ece3135dbdfe5D37"],
  });
  const signer = await hre.ethers.getSigner(
    "0xFE07D499e17482e5c4F40783ece3135dbdfe5D37"
  );

  (await hre.ethers.getSigners())[0].sendTransaction({
    value: ethers.utils.parseEther("1"),
    to: await signer.getAddress(),
  });
  */
  const scAbi = await hre.artifacts.readArtifact("StakingControllerArb");
  const sc = new hre.ethers.Contract(
    "0x25F6847487DE7Ea72E53cF54ccc6549631a807aF",
    scAbi.abi,
    (await hre.ethers.getSigners())[0]
  );
  console.log(sc.address);
  async function runView(sc) {
    const factory = await hre.ethers.getContractFactory("ArbQuery", {
      signer,
    });
    const data = await signer.provider.call({
      data: factory.getDeployTransaction(sc.address, await signer.getAddress())
        .data,
    });
    const [base, redeemable, bonuses] = factory.interface.decodeFunctionResult(
      "decodeResponse",
      data
    );
    const decoded = factory.interface.decodeFunctionResult("render", base);

    return decoded;
  }
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
  const isolate = require("../deployments/isolate.json");
  await sc.restoreBaseState(isolate[0]);

  // console.log(await runView(sc));
}

main().then(() => {});
