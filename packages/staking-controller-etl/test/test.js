const hre = require("hardhat");

const { ethers, waffle } = hre;
const { expect } = require("chai");
const TREASURY_ADDRESS = "0x6905Cae06C26558899aDb448B5be60cc6F1Cb5Ed";

const connect = require("@connectfinancial/connect-token");

const isTest = () => Boolean(process.argv.find((v) => v === "test"));

const getCurrentTimestamp = async (provider) => {
  const block = await provider.getBlock("latest");
  return Number(block.timestamp);
};

const {
  utils: { parseEther, Interface, formatEther },
  Contract,
  constants: { AddressZero },
} = ethers;
function toPrecision5(v) {
  return Number(formatEther(v)).toFixed(5);
}
const lodash = require("lodash");

const triggerAllCallbacks = async (sc) => {
  await sc.triggerNextCycle();
  await sc.triggerNextReward();
};

const receiveCallback = async (sc) => {
  await sc.triggerCycle();
  await sc.trackDailyRewards();
  await sc.updateCumulativeRewards(sc.signer.getAddress());
  await sc.updateToLast(sc.signer.getAddress());
  await sc.updateWeightsWithMultiplier(sc.signer.getAddress());
  await sc.updateDailyStatsToLast(sc.signer.getAddress());
};

async function runView(sc) {
  const factory = await hre.ethers.getContractFactory("Query", {
    signer: sc.signer,
  });
  const data = await sc.signer.provider.call({
    data: factory.getDeployTransaction(sc.address, await sc.signer.getAddress())
      .data,
  });
  const [base, redeemable, bonuses] = factory.interface.decodeFunctionResult(
    "decodeResponse",
    data
  );
  const decoded = factory.interface.decodeFunctionResult("render", base);

  return decoded;
}

const addTimestamp = async (provider, nextTs) => {
  await provider.send("evm_setNextBlockTimestamp", [
    (await getCurrentTimestamp(provider)) + nextTs,
  ]);
  await provider.send("evm_mine", []);
};

describe("redeploy", () => {
  let deployer,
    treasury,
    second,
    stakingEventsInterface,
    deployment,
    scnfiDeploy,
    cnfiDeploy,
    cnfi,
    scnfi,
    sc,
    sc2,
    snapshotId,
    generate;
  const setup = async () => {
    let [_deployer] = await ethers.getSigners();
    deployer = _deployer;
    generate = async () => {
      const wallet = ethers.Wallet.createRandom().connect(_deployer.provider);
      await deployer.sendTransaction({
        to: wallet.address,
        value: ethers.utils.parseEther("2"),
      });
      return wallet;
    };
    second = await generate();

    deployment = await hre.deployments.get("StakingControllerArb");
    console.log("done 1");
    scnfiDeploy = await hre.deployments.get("sCNFI");
    cnfiDeploy = await hre.deployments.get("ConnectTokenTest");
    const _treasury = {
      address: TREASURY_ADDRESS, // await hre.deployments.get('CNFITreasury');
      abi: [],
    };
    const stakingEventsAbi = (
      await hre.deployments.getArtifact("StakingEventsLib")
    ).abi;
    console.log("done 2");
    if (!stakingEventsInterface)
      stakingEventsInterface = new ethers.utils.Interface(stakingEventsAbi);
    deployer.provider = waffle.provider;
    cnfi = new Contract(cnfiDeploy.address, cnfiDeploy.abi, deployer);
    scnfi = new Contract(scnfiDeploy.address, scnfiDeploy.abi, deployer);
    treasury = new Contract(_treasury.address, _treasury.abi, waffle.provider);
    sc = new Contract(
      deployment.address,
      lodash.uniqBy(deployment.abi.concat(stakingEventsAbi), "name"),
      deployer
    );
    sc2 = sc.connect(second);
    console.log("done");
  };
  beforeEach(async () => {
    await hre.deployments.fixture();
    await setup().catch(console.error);
  });
  it("should redeploy correctly", async () => {
    const testAddresses = [
      "0x5589c8FEDf36A8B465331cc76A8174262F1A4864",
      "0x04e01eD0158E1099E25d76fD9111E86bE9F8281a",
      "0x5544549799fe8af5fe828FD3b71B9ceb486aEFA7",
      "0x339A68452D46701Bc8b40ff3E2E9eAE75dfC6403",
    ];
    const cycles = [
      {
        totalWeight: parseEther("123012310948123").toString(),
        totalRawWeight: parseEther("123012310948123").toString(),
        pCnfiToken: ethers.constants.AddressZero,
        reserved: parseEther("12038912").toString(),
        day: "1",
        inflateBy: 500,
        canUnstake: true,
      },
      {
        totalWeight: parseEther("123012310948123"),
        totalRawWeight: parseEther("123012310948123"),
        pCnfiToken: ethers.constants.AddressZero,
        reserved: parseEther("12038912"),
        day: "2",
        inflateBy: 500,
        canUnstake: true,
      },
      {
        totalWeight: parseEther("123012310948123"),
        totalRawWeight: parseEther("123012310948123"),
        pCnfiToken: ethers.constants.AddressZero,
        reserved: parseEther("12038912"),
        day: "3",
        inflateBy: 500,
        canUnstake: true,
      },
    ];
    const IsolateView = {
      currentCycle: 1,
      cnfiTreasury: treasury.address,
      cnfi: cnfi.address,
      sCnfi: scnfi.address,
      pCnfi: ethers.constants.AddressZero,
      nextCycleTime: +new Date() + 1000000,
      cycleInterval: 5000,
      nextTimestamp: +new Date() + 300000,
      inflateBy: ethers.utils.parseEther("500"),
      inflatepcnfiBy: ethers.utils.parseEther("500"),
      tiersLength: 5,
      rewardInterval: 20000,
      baseUnstakePenalty: parseEther("0.1"),
      commitmentViolationPenalty: parseEther("0.1"),
      totalWeight: parseEther("1203102301"),
      lastTotalWeight: parseEther("123908121"),
      cumulativeTotalWeight: parseEther("12390845901284908234"),
      pCnfiImplementation: ethers.constants.AddressZero,
      currentDay: 50,
      cycles,
    };
    await sc.restoreBaseState(IsolateView);
    const view = await runView(sc);
    // TODO: write expects
    const retCycle = view.retCycle.map((d) =>
      d && d._isBigNumber ? d.toString() : d
    );
    expect(retCycle).to.include.members(
      Object.values({ ...cycles[0], inflateBy: undefined }).filter(Boolean)
    );
    const UserView = testAddresses.map((address) => ({
      user: [],
      dailyUser: {
        multiplier: [parseEther("1.15"), parseEther("1.25"), parseEther("1")][
          parseInt((Math.random() * 3) / 3)
        ],
        cycleEnd: 3,
        cyclesHeld: 1,
        redeemable: 0,
        start: +new Date(),
        weight: parseEther((Math.random() * 1000).toString()),
        claimed: 0,
        commitment: 2,
        lastDaySeen: 1,
        cumulativeTotalWeight: parseEther((Math.random() * 1000).toString()),
        cumulativeRewardWeight: parseEther((Math.random() * 1000).toString()),
        lastTotalWeight: parseEther((Math.random() * 1000).toString()),
        currentTier: 0,
      },
      weightChanges: [],
      dailyBonusesAccrued: parseEther((Math.random() * 1000).toString()),
      bonusesAccrued: parseEther((Math.random() * 1000).toString()),
      userAddress: address,
      lockCommitment: 3,
      scnfiBalance: 0,
    }));
    await sc.restoreState(UserView);
  });
  it("should test for correct balances after restore", async () => {
    const impersonate = process.env.IMPERSONATE;
    let impersonated;
    if (impersonate) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [impersonate],
      });
      impersonated = await hre.ethers.getSigner(impersonate);
    }
    const res = await runView(sc.connect(impersonated));
    console.log(res);
  });
});
