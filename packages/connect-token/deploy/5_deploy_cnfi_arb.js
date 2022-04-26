const hre = require("hardhat");
const fs = require("fs");
const AddressZero = hre.ethers.constants.AddressZero;
const { Gateways, Routers, CNFI } = require("../lib/chainutil");
const record = [];
const stakingController = {
  mainnet: AddressZero,
  test: AddressZero,
};

async function checkNetwork() {
  switch (hre.network.config.chainId) {
    case 42161:
      return [true, true];
    case 421611:
      return [false, true];
    case 1:
      return [true, false];
    default:
      return [false, false];
  }
}

async function ifTest() {}

async function deploy(
  contractName,
  params,
  opts = {},
  name = undefined,
  abi = []
) {
  const artifact = await hre.artifacts.readArtifact(contractName);
  const [signer] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractFactory(contractName, {
    libraries: opts.libraries || {},
    signer,
  });
  //const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  const deployed = await hre.upgrades.deployProxy(factory, params);
  record.push(deployed.deployTransaction.gasLimit);
  await hre.deployments.save(name || contractName, {
    address: deployed.address,
    abi: abi.length > 0 ? artifact.abi.concat(abi) : artifact.abi,
    bytecode: artifact.bytecode,
    args: params,
  });
  console.log(`${contractName} deployed to: ${deployed.address}`);
  return [deployed, factory];
}

module.exports = async function main() {
  const [isMainnet, isL2] = await checkNetwork();
  const [signer] = await hre.ethers.getSigners();
  if (!isMainnet && !isL2) {
    let [cnfi] = await deploy("ConnectToken", []);
  } else {
    const args = [
      Gateways.address(),
      CNFI.address(CNFI.correspondingL1[hre.network.config.chainId]),
    ];
    console.log(args);

    await hre.deployments.deploy("ConnectTokenL2", {
      from: await signer.getAddress(),
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          methodName: "initialize",
          args: [
            Gateways.address(),
            CNFI.address(CNFI.correspondingL1[hre.network.config.chainId]),
          ],
        },
      },

      log: true,
    });
  }
};
