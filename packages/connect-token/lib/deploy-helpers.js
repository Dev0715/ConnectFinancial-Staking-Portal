const hre = require("hardhat");

const {
  network: {
    config: { forking },
    provider,
  },
  ethers: {
    utils: { parseEther },
    providers: { BaseProvider },
  },
} = hre;
exports.PROXY_ADMIN = "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37";
const IS_TEST = process.argv.find((v) => ["test", "node", "local"].includes(v));
exports.getSignerByAddress = async (address) => {
  const signers = await ethers.getSigners();
  if (
    ethers.utils.getAddress(await signers[0].getAddress()) ===
    ethers.utils.getAddress(address)
  )
    return signers[0];
  if (global.IS_MAINNET && !IS_TEST) throw Error("Could not get signer");
  try {
    await provider.request({
      method: "hardhat_impersonateAccount",
      params: [address],
    });
  } catch (e) {}
  return await ethers.provider.getSigner(address);
};

exports.getSigner = async () => {
  return await exports.getSignerByAddress(exports.PROXY_ADMIN);
};
const { ethers } = hre;
exports.isFork = () =>
  Boolean(
    (forking && forking.enabled) || process.argv.find((v) => v === "local")
  );
exports.isMainnet = async () => {
  const [signer] = await ethers.getSigners();
  console.log(exports.isFork());
  return (await signer.provider.getNetwork()).chainId === 1;
};
