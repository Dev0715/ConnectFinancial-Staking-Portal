const ethers = require("ethers");
const hre = require("hardhat");
const { provider, makeArbRetryableTx } = require("../lib/l2utils");
const { Routers } = require("../lib/chainutil");
const { Bridge } = require("arb-ts");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const l2Signer = new ethers.Wallet(process.env.PRIV_KEY, provider);
  // const bridge = await Bridge.init(
  //   signer,
  //   l2Signer,
  //   Routers.address(4),
  //   Routers.address(421611)
  // );
  //console.log(await l2Signer.getAddress());
  /* const retryableTx = await makeArbRetryableTx(l2Signer);
  const seqNum = await bridge.getInboxSeqNumFromContractTransaction(
    await bridge.getL1Transaction(
      "0x5a7e5a8ae0cc25e645e00bf410c66e932044f7f7c07685a42a9b2c14581d79c1"
    )
  );
  console.log(seqNum);
  const hash = await bridge.calculateRetryableAutoRedeemTxnHash(seqNum[0]);
  console.log(hash.toString());
  await bridge.redeemRetryableTicket(
    "0x374f636cca4e71e728b50dfba7910bc86e89169cc6347da93805953a96d391c8"
  );
  */
  const CNFI = await hre.deployments.get("ConnectToken");

  //const params = await bridge.getDepositTxParams({
  //erc20L1Address: CNFI.address,
  //amount: ethers.utils.parseEther("10"),
  //destinationAddress: await signer.getAddress(),
  //});
  //console.log(params);
  // const tx = await bridge.deposit(params);
  const cnfiArtifact = await hre.artifacts.readArtifact("ConnectTokenTest");
  const cnfi = new ethers.Contract(CNFI.address, cnfiArtifact.abi, signer);
  //await cnfi.mint(await signer.getAddress(), ethers.utils.parseEther("100"));
  //const iface = new ethers.utils.Interface(cnfiArtifact.abi);
  //console.log(iface.encodeFunctionData("initialize", require("./args")));*/
  console.log(await cnfi.name());
}

main();
