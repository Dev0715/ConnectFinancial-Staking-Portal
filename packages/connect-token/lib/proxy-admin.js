const proxyAdminAbi = require('./proxy-admin.json');

const { makeEthersBase } = require('ethers-base');
const ethers = require('ethers');

class ProxyAdmin extends makeEthersBase({ abi: proxyAdminAbi, address: ethers.constants.AddressZero, networks: { '1': { address: '0x7d82ed6e0f89009d76164c6e5379284ed0ec705e' } } }) {
}
module.exports.ProxyAdmin = ProxyAdmin;
