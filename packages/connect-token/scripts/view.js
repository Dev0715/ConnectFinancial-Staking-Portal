const ethers = require('ethers')
const hre = require('hardhat')
const repl = require('repl')

async function main() {
  const [signer] = await hre.ethers.getSigners()
  const query = await hre.ethers.getContractFactory('Query', {signer})
  console.log(process.argv)
  const address = "0x8A7EdA14e84610625CCaB653c8dF633fc0b2875f"
  const data = await signer.provider.call({
    data: query.getDeployTransaction("0xbbb604a12C6E4F88f1fa562603BF7D9d48CDf702", address).data
  })
  const [base, redeemable, bonuses] = query.interface.decodeFunctionResult('decodeResponse', data)
  const decoded = query.interface.decodeFunctionResult("render", base)
  const SC = await hre.deployments.get("StakingController")

  const sc = new ethers.Contract(SC.address, SC.abi, signer)



  repl.start().context.values = {
    decoded,
    redeemable,
    bonuses,
    signer,
    query,
    sc: "0xbbb604a12C6E4F88f1fa562603BF7D9d48CDf702",
    address,
    ethers
  }
}

main().catch(console.error)
