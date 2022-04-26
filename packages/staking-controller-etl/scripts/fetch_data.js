const hre = require("hardhat");
const util = require("util");
const { ethers, deployments, artifacts } = hre;
const fs = require("fs");

const { chunk } = require("lodash");

async function main() {
  const controller = {
    address: "0xbbb604a12C6E4F88f1fa562603BF7D9d48CDf702",
  };
  const [realsigner] = await ethers.getSigners();
  const signer = realsigner;

  const provider = signer.provider;
  const Query = artifacts.readArtifactSync("ETLQuery");
  const query = new ethers.ContractFactory(Query.abi, Query.bytecode, signer);
  let payload = [];
  try {
    payload = require("../deployments/payload.json");
  } catch (e) {
    console.error(e);
  }

  if (process.env.ISOLATE) {
    console.log(controller.address);
    const decoded = query.interface.decodeFunctionResult(
      "render",
      await provider.call({
        data: query.getDeployTransaction(
          query.interface.getSighash("render"),
          controller.address,
          []
        ).data,
      })
    );
    console.log(decoded);
    fs.writeFileSync("deployments/isolate.json", JSON.stringify(decoded));
  } else {
    console.log(payload.length);
    let userdata = await chunk(payload, process.env.PAYLOAD_LENGTH).reduce(
      async (acc, d) => {
        await acc;
        console.log(d.length);
        let res = query.interface.decodeFunctionResult(
          "getUsers",
          await provider.call({
            data: query.getDeployTransaction(
              query.interface.getSighash("getUsers"),
              controller.address,
              d
            ).data,
          })
        );
        return [...(await acc), ...res[0]];
      },
      []
    );
    console.log(userdata.length);
    fs.writeFileSync("deployments/userdata.json", JSON.stringify(userdata));
  }
}

if (process.env.NODE_ENV) {
  main()
    .then(() => console.log("done"))
    .catch(console.error);
}

module.exports = main;
