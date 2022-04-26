const { ethers, deployments } = require("hardhat");
const fs = require("fs");

async function main(write) {
  const sCNFI = await deployments.get("live/sCNFI");
  const [signer] = await ethers.getSigners();
  const provider = signer.provider;
  const scnfi = new ethers.Contract(sCNFI.address, sCNFI.abi);
  const logs = await provider.getLogs({
    ...scnfi.filters.Transfer(),
    fromBlock: GENESIS,
  });
  const parsed = logs
    .map((d) => {
      const args = scnfi.interface.parseLog(d).args;
      return [args.from, args.to].filter(
        (d) => d !== ethers.constants.AddressZero
      )[0];
    })
    .reduce((acc, d) => {
      if (!acc.includes(d)) return [...acc, d];
      return acc;
    }, []);
  console.log(parsed.length);
  if (write) {
    fs.writeFileSync("deployments/payload.json", JSON.stringify(parsed));
  }
  return { logs, scnfi, provider, signer, parsed };
}

if (process.env.NODE_ENV) {
  main(true)
    .then(({ logs }) => console.log("done"))
    .catch(console.error);
}

module.exports = main;
