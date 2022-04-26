'use strict';

const { Query } = (((require('../deployments/deployments')[31337] || {}).localhost || {}).contracts);
const ethers = require('ethers');
const queryInterface = new ethers.utils.Interface(Query.abi);

exports.runView = async (sc) => {
  const address = sc.signer && await sc.signer.getAddress() || ethers.constants.AddressZero;
  const provider = sc.signer && sc.signer.provider || sc.provider;
  const factory = new ethers.ContractFactory(Query.abi, Query.bytecode, provider);
  const result = await provider.call({
    data: factory.getDeployTransaction(sc.address, address).data
  });
  return queryInterface.decodeFunctionResult('render', result);
};
