const hre = require("hardhat");
// const {} = require("@connectfinancial/connect-token/lib/chainutil");
// const {} = require("@connectfinancial/connect-token/lib/l2utils");
const { chunk, compact } = require("lodash");
const fs = require("fs");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const scDeployment = await hre.artifacts.readArtifact("StakingControllerArb");
  const sc = new hre.ethers.Contract(
    "0x25f6847487de7ea72e53cf54ccc6549631a807af",
    scDeployment.abi,
    signer
  );
  const userdata = require("../deployments/userdata.json");
  let writtenAddresses = require("../deployments/written.json");
  console.log(userdata.length);
  console.log(process.env.PAYLOAD_LENGTH);
  if (!writtenAddresses) writtenAddresses = [];
  await chunk(userdata, process.env.PAYLOAD_LENGTH).reduce(async (acc, d) => {
    await acc;
    const write = d.map((a) => {
      if (writtenAddresses.includes(a[6])) return null;
      if (a[6] == "0x79E9ff28B7b9C2eEF2E0d5D4E5c1c5e93f68Bc56") {
        a.splice(6, 1, "0xf5f23A2Fbf5695dA0EBE773D612DC95642E675Da");
      }
      return a;
    });
    writtenAddresses = [...writtenAddresses, ...d.map((a) => a[6])];

    const toWrite = compact(write);
    console.log(toWrite.length);
    if (toWrite.length > 0) {
      const p = await sc.restoreState(toWrite);
      fs.writeFileSync(
        "deployments/written.json",
        JSON.stringify(writtenAddresses)
      );
    }
  }, Promise.resolve());
}

main()
  .then(() => {})
  .catch(console.error);
