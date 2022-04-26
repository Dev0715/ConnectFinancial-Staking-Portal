"use strict";

const hre = require("hardhat");

const abi = ["function admin() external view returns (address)"];

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log(
    await signer.provider.getStorageAt(
      process.env.ADDRESS,
      "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => console.error(err));
