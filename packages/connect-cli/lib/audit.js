'use strict';

exports.retrieveEventsForBlock = async (sc, fromBlock, toBlock) => {
  const logs = await sc.provider.getLogs({
    address: sc.address,
    toBlock,
    fromBlock
  });
  return logs.map((v) => {
    try {
      const result = {
        ...v,
        event: sc.interface.parseLog(v)
      };
      return result;
    } catch (e) { return null; }
  }).filter(Boolean);
};

const lodash = require('lodash');

exports.pollForNewEvents = async function *(sc) {
  while (true) {
    const newBlock = await new Promise((resolve, reject) => sc.provider.on('block', resolve));
    yield await exports.retrieveEventsForBlock(sc, newBlock, newBlock);
  }
};

exports.retrieveEventsFromBlock = async function *(sc, fromBlock, chunkSize, finalBlock) {
  const blockNumber = finalBlock || await sc.provider.getBlockNumber();
  const range = lodash.range(fromBlock, blockNumber, chunkSize);
  let ptr = range[0];
  for (const toBlock of range.slice(1)) {
    yield await exports.retrieveEventsForBlock(sc, ptr, toBlock - 1);
    ptr = toBlock;
  }
  if (!finalBlock) yield *exports.pollForNewEvents(sc);
};


