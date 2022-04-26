const { ethers, deployments } = require("hardhat");
const fs = require("fs");
// requires payload to be generated
const addresses = require("../deployments/payload.json");

async function main() {
  const provider = new ethers.providers.AlchemyProvider(
    1,
    "opf1pfLThCfvgyUtE9Mj_NvZwY3yIVJx"
  );
  const contracts = await addresses.reduce(async (acc, d, i) => {
    try {
      const code = await provider.getCode(d);
      if (code.length > 2) {
        return [...(await acc), d];
      }
      return await acc;
    } catch (e) {
      console.log(acc);
      console.error(e);
      console.log(d);
      return await acc;
    }
  }, []);

  fs.writeFileSync("deployments/contracts.json", JSON.stringify(contracts));
}

main()
  .then(() => {
    console.log("done");
  })
  .catch(console.error);
