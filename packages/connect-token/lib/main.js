'use strict';

const ConnectTokenArtifact = require('../deployments/live/ConnectToken');

const ethers = require('ethers');
const { makeEthersBase } = require('ethers-base');

const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

exports.ConnectToken = class extends makeEthersBase(ConnectTokenArtifact) {
  static get networks() {
    return {
      '1': {
        address: ConnectTokenArtifact.address
      }
    };
  }
  async getAdmin() {
    const slot = await this.provider.getStorageAt(this.address, ADMIN_SLOT);
    return ethers.utils.getAddress('0x' + slot.substr(26));
  }
}

exports.ProxyAdmin = require('./proxy-admin.js').ProxyAdmin;
