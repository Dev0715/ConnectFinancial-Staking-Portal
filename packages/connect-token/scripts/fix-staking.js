import ethers from 'ethers';

async function main() {
  const sc = await ethers.getContract('StakingController');
  console.log(sc.address);
}

main();
