const hre = require("hardhat");
const ethers = require("ethers");
const parseEther = ethers.utils.parseEther;
const proxyAdminAbi = require("@connectfinancial/connect-token/lib/proxy-admin.json");
const PROXY_ADMIN = "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37";
const ARB_GNOSIS = "0x3452BDAc30Ba47BbE7489D98fbB1908Aa392E3F8";
const CNFI_ADMIN = "0x8A01Cd2339B2352906Ce2271522f741288f27Cd3";
const CNFI = "0x6F5401c53e2769c858665621d22DDBF53D8d27c5";
const getSigner = async () => {
  const [signer] = await hre.ethers.getSigners();
  const { chainId } = await signer.provider.getNetwork();
  if ([42161, 1].includes(chainId)) {
    if ((await signer.getAddress()).toLowerCase() === PROXY_ADMIN.toLowerCase())
      return signer;
    throw Error("wrong wallet to interact with ProxyAdmin");
  } else {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [PROXY_ADMIN],
    });
    return await hre.ethers.getSigner(PROXY_ADMIN);
  }
};

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const proxyAdmin = new hre.ethers.Contract(
    "0x4e1dba58c9e4269f9d5897314c39c3629dde7302",
    proxyAdminAbi,
    await getSigner()
  );
  const proxyAdmin2 = new hre.ethers.Contract(
    CNFI_ADMIN,
    proxyAdminAbi,
    await getSigner()
  );
  const scAbi = await hre.artifacts.readArtifact("StakingControllerArb");
  const sc = new hre.ethers.Contract(
    "0x25F6847487DE7Ea72E53cF54ccc6549631a807aF",
    scAbi.abi,
    await getSigner()
  );
  const from = await signer.getAddress();
  // console.log(await runView(sc));
  await sc.transferOwnership(ARB_GNOSIS);
  await proxyAdmin.transferOwnership(ARB_GNOSIS);
  await proxyAdmin2.transferOwnership(ARB_GNOSIS);
}

main().then(() => {});
