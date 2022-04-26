const hre = require("hardhat");

const { ethers, waffle } = hre;
const { expect } = require("chai");
const TREASURY_ADDRESS = "0x6905Cae06C26558899aDb448B5be60cc6F1Cb5Ed";
const PROXY_ADMIN_CONTRACT = "0x7d82ed6e0f89009d76164c6e5379284ed0ec705e";
const PROXY_ADMIN = "0xfe07d499e17482e5c4f40783ece3135dbdfe5d37";
const { ProxyAdmin } = require("../lib/proxy-admin.js");
const {
  ProxyAdminCallers,
  ProxyAdminImpls,
  Routers,
  Gateways,
  CNFI,
  CONTRACT_NAME,
} = require("../lib/chainutil");
const { provider: l2provider, makeArbRetryableTx } = require("../lib/l2utils");

const connect = require("../");

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

describe("Daily Rewards Test", () => {
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

    deployment = await hre.deployments.get("StakingController");
    scnfiDeploy = await hre.deployments.get("sCNFI");
    cnfiDeploy = await hre.deployments.get("ConnectTokenTest");
    const _treasury = {
      address: TREASURY_ADDRESS, // await hre.deployments.get('CNFITreasury');
      abi: [],
    };
    const stakingEventsAbi = (
      await hre.deployments.getArtifact("StakingEventsLib")
    ).abi;
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

    await sc.mintCnfi(deployer.address, parseEther("20000"));
    await sc2.mintCnfi(second.address, parseEther("40000"));
    await sc.govern(
      0,
      0,
      parseEther("100"),
      parseEther("100"),
      0,
      0,
      [parseEther("1"), parseEther("2")],
      [1, 1],
      [parseEther("5000"), parseEther("10000")]
    );
  };
  beforeEach(async () => {
    await hre.deployments.fixture();
    await setup();
  });
  it("totalWeightFail: should not rebalance when staking in more", async () => {
    await cnfi.approve(sc.address, parseEther("10000"));
    await sc.stake(parseEther("10000"), 1);

    await sc.triggerNextReward();
    await sc.triggerNextReward();

    expect((await sc.callStatic.claimRewards())["amountToRedeem"]).to.equal(
      parseEther("200")
    );
    await cnfi.approve(sc.address, parseEther("10000"));
    await sc.stake(parseEther("10000"), 1);

    expect((await sc.callStatic.claimRewards())["amountToRedeem"]).to.equal(
      parseEther("200")
    );
  });
  it("should test staking", async () => {
    const pre = await cnfi.balanceOf(treasury.address);
    // cycle = 1
    expect(await sc.currentCycle()).to.be.equal(1);
    // testing if redeeming tokens per day works properly by triggering newer reward epochs manually

    await cnfi.approve(sc.address, parseEther("10000"));

    await sc.stake(parseEther("10000"), 1);
    expect(await cnfi.balanceOf(deployer.address)).to.equal(
      parseEther("10000")
    );
    expect(await cnfi.balanceOf(treasury.address)).to.equal(
      pre.add(parseEther("10000"))
    );

    await cnfi.connect(second).approve(sc.address, parseEther("30000"));
    const logArgs = (
      await (await sc2.stake(parseEther("30000"), 1)).wait()
    ).logs.reduce((r, v) => {
      try {
        const log = stakingEventsInterface.parseLog(v);
        return log;
      } catch (e) {
        return r;
      }
    }, {}).args;

    expect(logArgs[1]).to.be.equal(parseEther("30000"));

    expect(logArgs[2]).to.be.equal(1);
    expect(await cnfi.balanceOf(second.address)).to.equal(parseEther("10000"));
    expect(await cnfi.balanceOf(treasury.address)).to.equal(
      pre.add(parseEther("40000"))
    );

    expect(
      (
        await (
          await sc.unstake(
            scnfi.connect(sc.signer).balanceOf(sc.signer.getAddress())
          )
        ).wait()
      ).logs.reduce((r, v) => {
        try {
          const log = stakingEventsInterface.parseLog(v);
          return log;
        } catch (e) {
          return r;
        }
      }, {}).args[1]
    ).to.be.equal(parseEther("10000"));

    await sc2.unstake(
      scnfi.connect(sc2.signer).balanceOf(sc2.signer.getAddress())
    );
  });

  it("should test if rewards carry over correctly", async () => {
    /**
     * cycle 1
     * user 1: 10k
     * user 2: 30k
     */
    await cnfi.approve(sc.address, parseEther("10000"));

    await sc.stake(parseEther("10000"), 1);
    await cnfi.connect(second).approve(sc.address, parseEther("30000"));

    await sc2.stake(parseEther("30000"), 1);

    await sc.triggerNextCycle();

    /**
     * cycle 2
     * user 1: 20k
     * user 2: 60k
     */
    await sc.mintCnfi(deployer.address, parseEther("20000"));
    await sc2.mintCnfi(second.address, parseEther("40000"));

    await cnfi.approve(sc.address, parseEther("10000"));

    await sc.stake(parseEther("10000"), 1);
    await cnfi.connect(second).approve(sc.address, parseEther("30000"));
    await sc2.stake(parseEther("30000"), 1);
    await sc.triggerNextDailyCycle(deployer.address);

    await sc2.triggerNextDailyCycle(second.address);

    await sc.triggerNextReward();

    await sc.mintCnfi(treasury.address, parseEther("100000"));
    expect((await sc2.callStatic.claimRewards())[0]).to.equal(parseEther("75"));
    expect((await sc.callStatic.claimRewards())[0]).to.equal(parseEther("25"));

    const claimRewardsTx = await sc.claimRewards();
    const receipt = await claimRewardsTx.wait();
    const sum = receipt.events.reduce((r, v) => {
      return r.add((v.args || {}).amountToRedeem || "0");
    }, ethers.BigNumber.from("0"));
    expect(sum).to.equal(parseEther("25"));

    await sc.triggerNextReward();

    expect((await sc.callStatic.claimRewards())[0]).to.equal(parseEther("25"));
    expect((await sc2.callStatic.claimRewards())[0]).to.equal(
      parseEther("150")
    );

    await sc.claimRewards();
    await sc2.claimRewards();
  });
  it("should test unstaking rebalances weights and multiplier correctly", async () => {
    // cycle = 3
    await sc.mintCnfi(deployer.address, parseEther("5000"));
    await sc.mintCnfi(second.address, parseEther("5000"));
    // dummy cycle to have a user stake again
    await cnfi.approve(sc.address, parseEther("5000"));
    await cnfi.connect(second).approve(sc.address, parseEther("5000"));

    await sc.stake(parseEther("5000"), 1);
    await sc.connect(second).stake(parseEther("5000"), 1);
    await sc.triggerNextCycle();
    // cycle = 4
    // check if rebalanced weights + multipliers work correctly
    await sc.triggerNextReward();
    expect(
      ethers.utils.formatEther((await sc.callStatic.claimRewards())[0])
    ).to.eql("50.0");
    expect(
      ethers.utils.formatEther(
        (await sc.connect(second).callStatic.claimRewards())[0]
      )
    ).to.eql("50.0");
  });
  it("unstakebasepenalty: should test unstaking base penalty", async () => {
    await sc.govern(
      0,
      0,
      parseEther("100"),
      parseEther("100"),
      parseEther("0.1"),
      0,
      [parseEther("1"), parseEther("2")],
      [1, 1],
      [parseEther("5000"), parseEther("10000")]
    );
    await sc.mintCnfi(deployer.address, parseEther("5000"));
    await cnfi.approve(sc.address, parseEther("5000"));
    await sc.stake(parseEther("5000"), 0);
    const balance = await cnfi.balanceOf(deployer.address);
    const unstakeAmount = parseEther("5000");
    await sc.unstake(unstakeAmount);
    expect(await cnfi.balanceOf(deployer.address)).to.equal(
      balance.add(unstakeAmount.mul(9).div(10))
    );
  });
  it("should apply the commitmentPenalty when unstaked early", async () => {
    const [signer] = await hre.ethers.getSigners();
    const from = await signer.getAddress();
    const sc = await hre.ethers.getContract("StakingController");
    const cnfi = await hre.ethers.getContract("ConnectTokenTest");
    const sCnfi = await hre.ethers.getContract("sCNFI");
    await sc.govern(
      60 * 60,
      60,
      parseEther("1000"),
      parseEther("1000"),
      0,
      parseEther("2"),
      [parseEther("1"), parseEther("1.25")],
      [1, 2],
      [parseEther("50"), parseEther("20000")]
    );
    const balance = await cnfi.balanceOf(from);
    await cnfi.approve(sc.address, balance);
    await cnfi.connect(second).approve(sc.address, balance);
    await sc.stake(balance, 2);
    await sc2.stake(balance, 0);
    const penalty = await sc.commitmentViolationPenalty();
    const ln = (v) => {
      return v;
    };
    await sc.triggerNextReward();
    const { bonuses, amountToRedeem } = (
      await (await sc.claimRewards()).wait()
    ).events
      .map((v) => {
        try {
          return stakingEventsInterface.parseLog(v);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .find((v) => v.name === "Redeemed").args;

    const bonusesAccrued = await sc.dailyBonusesAccrued(from);
    await sc.unstake(sCnfi.balanceOf(from));
    const newBalance = await cnfi.balanceOf(from);

    /* TODO: Fix
    expect(newBalance).to.equal(
      balance.add(amountToRedeem).sub(bonuses.mul(penalty).div(parseEther('1')))
    );
    */
  });

  it("should not apply the commitmentPenalty when unstaked properly", async () => {
    const [signer] = await hre.ethers.getSigners();
    const from = await signer.getAddress();
    const sc = await hre.ethers.getContract("StakingController");
    const cnfi = await hre.ethers.getContract("ConnectTokenTest");
    const sCnfi = await hre.ethers.getContract("sCNFI");
    await sc.govern(
      0,
      0,
      parseEther("1000"),
      parseEther("1000"),
      parseEther("0"),
      parseEther("2"),
      [parseEther("1"), parseEther("2")],
      [1, 4],
      [parseEther("50"), parseEther("20000")]
    );
    const balance = await cnfi.balanceOf(from);
    await cnfi.approve(sc.address, balance);
    await sc.stake(balance, 2);
    await sc.triggerNextReward();
    //console.log('next cycle');
    await sc.triggerNextDailyCycle(deployer.address);
    //console.log('next cycle');
    await sc.triggerNextDailyCycle(deployer.address);
    await sc.triggerNextDailyCycle(deployer.address);
    await sc.triggerNextDailyCycle(deployer.address);

    await sc.unstake(await sCnfi.balanceOf(from));

    expect(Number(ethers.utils.formatEther(balance))).to.be.equal(20000);
    expect(await cnfi.balanceOf(from)).to.be.equal(balance);
    await sc.claimRewards();
    const newBalance = await cnfi.balanceOf(from);

    expect(newBalance).to.be.equal(balance.add(parseEther("1000")));
  });
  /*
  it('should execute a call query', async () => {
    const factory = await hre.ethers.getContractFactory('MockQuery');
    const view = await hre.ethers.getContractFactory('MockView');
    const iface = view.interface;
    const render =
      iface.functions[
        Object.keys(iface.functions).find(v => v.match('render'))
      ];
    const [{ provider }] = await ethers.getSigners();
    const sc = await ethers.getContract('StakingController');
    const result = iface.decodeFunctionResult(
      render,
      await provider.call({
        data: factory.getDeployTransaction(sc.address).data,
      })
    );
    expect(result[0]).to.eql(await sc.pCnfiImplementation());
  });
  */

  it("should execute THE call query", async () => {
    const factory = await hre.ethers.getContractFactory("Query");
    const [signer] = await ethers.getSigners();
    const { provider } = signer;
    const sc = await ethers.getContract("StakingController");

    const cnfi = await hre.ethers.getContract("ConnectTokenTest");
    await sc.govern(
      60 * 60,
      60,
      parseEther("1000"),
      parseEther("1000"),
      parseEther("0.1"),
      parseEther("2"),
      [parseEther("1"), parseEther("2")],
      [1, 2],
      [parseEther("50"), parseEther("20000")]
    );
    await sc.mintCnfi(await signer.getAddress(), parseEther("50000"));
    const balance = await cnfi.balanceOf(deployer.address);
    await cnfi.approve(sc.address, balance);
    await sc.stake(balance, 0);
    await sc.triggerNextCycle();
    await sc.triggerNextReward();

    await sc.triggerNextCycle();
    await sc.triggerNextCycle();

    await sc.triggerNextReward();
    const [response, amountToRedeem, bonuses] =
      factory.interface.decodeFunctionResult(
        "decodeResponse",
        await provider.call({
          data: factory.getDeployTransaction(sc.address, deployer.address).data,
        })
      );
    const result = factory.interface.decodeFunctionResult("render", response);
    expect(result.dailyUser.redeemable).to.equal(
      (await sc.callStatic.claimRewards())[0]
    );
    expect(result["returnstats"]["totalStakedInProtocol"]).to.equal(
      await scnfi.totalSupply()
    );
  });
  it("should execute the call query from a blank state", async () => {
    const factory = await hre.ethers.getContractFactory("Query");
    const sc = await hre.ethers.getContract("StakingController");
    const [signer] = await ethers.getSigners();
    const { provider } = signer;
    const from = await signer.getAddress();
    await provider.call({
      data: factory.getDeployTransaction(sc.address, from).data,
    });
  });
  /*
  it('should execute the call query with null results', async () => {
    const factory = await hre.ethers.getContractFactory('Query');
    const view = await hre.ethers.getContractFactory('Viewer');
    const iface = view.interface;
    const render =
      iface.functions[
        Object.keys(iface.functions).find(v => v.match('render'))
      ];
    const [{ provider }] = await ethers.getSigners();
    const sc = await ethers.getContract('StakingController');

    const cnfi = await hre.ethers.getContract('ConnectToken');
    await sc.govern(
      60 * 60,
      60,
      parseEther('1000'),
      parseEther('1000'),
      parseEther('0.1'),
      parseEther('2'),
    
    [parseEther('1'), parseEther('2')],
      [1, 2],
      [parseEther('50'), parseEther('20000')]
    );
    const balance = await cnfi.balanceOf(deployer.address);
    await cnfi.approve(sc.address, balance);
    await sc.stake(balance, 0);
    // await sc.triggerNextCycle()
    // await sc.triggerNextReward()

    // await sc.triggerNextCycle()
    // await sc.triggerNextCycle()

    // await sc.triggerNextReward()
    const [ response, amountToRedeem, bonuses ] = factory.interface.decodeFunctionResult(
      'decodeResponse',
      await provider.call({
        data: factory.getDeployTransaction(sc.address, deployer.address).data,
      })
    );
    console.log(response, amountToRedeem, bonuses);
    const result = factory.interface.decodeFunctionResult(
      'render',
      response
    );
    expect(result.redeemable).to.equal(parseEther('0'));
    expect(result['returnstats']['totalStakedInProtocol']).to.equal(
      await scnfi.totalSupply()
    );
  });
  */
  it("deductcommitmentpenalty: should deduct correct commitment violation penalty when unstaking from the same cycle", async () => {
    await sc.govern(
      60,
      60 * 10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [parseEther("1.15"), parseEther("2.5"), parseEther("3"), parseEther("4")],
      [5, 10, 15, 20],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );

    await cnfi.approve(sc.address, parseEther("25000"));
    await sc.mintCnfi(deployer.address, parseEther("25000"));
    await sc.mintCnfi(treasury.address, parseEther("10000"));
    await sc.stake(parseEther("25000"), 2);
    await sc.triggerNextCycle();
    await sc.triggerNextReward();
    await sc.triggerNextReward();
    const tx = await sc.claimRewards();
    const receipt = await tx.wait();
    const { bonuses } = receipt.events.find((v) => v.event === "Redeemed").args;
    const balanceStart = await scnfi.balanceOf(deployer.address);
    const cnfiBalanceStart = await cnfi.balanceOf(deployer.address);

    await sc.unstake(parseEther("10000"));

    const cnfiBalanceEnd = await cnfi.balanceOf(deployer.address);
    const balanceEnd = await scnfi.balanceOf(deployer.address);
    const diff = balanceStart.sub(balanceEnd).sub(parseEther("10000"));
    const cnfiDiff = cnfiBalanceEnd.sub(cnfiBalanceStart);

    expect(diff).to.be.equal(bonuses.mul(2));
  });
  it("should maintain correct multipliers", async () => {
    await sc.govern(
      0,
      0,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, parseEther("20000"));
    await cnfi.connect(second).approve(sc.address, parseEther("20000"));

    await sc.stake(parseEther("20000"), 2);
    await sc.triggerNextCycle();
    await sc.triggerNextReward();
    await sc.triggerNextReward();
    await sc.connect(second).stake(parseEther("20000"), 0);

    await sc.triggerNextCycle();

    await sc.triggerNextReward();

    await sc.triggerNextReward();
  });
  it("should take not let multiplier increase when staked is 0", async () => {
    await sc.govern(
      0,
      0,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await sc.mintCnfi(deployer.address, parseEther("20000"));

    await cnfi.approve(sc.address, parseEther("20000"));
    await cnfi.connect(second).approve(sc.address, parseEther("20000"));

    // await sc.stake(parseEther('20000'), 2)
    await sc2.stake(parseEther("20000"), 0);
    await sc.triggerNextCycle();
    await sc.triggerNextReward();
    await sc.triggerNextReward();
    // console.log(formatEther((await sc.callStatic.claimRewards())[0]))
    //console.log(formatEther((await sc2.callStatic.claimRewards())[0]))
    await sc2.unstake(parseEther("20000"));
    await sc.triggerNextCycle();
    await sc.triggerNextCycle();
    await sc.triggerNextCycle();

    //console.log(formatEther((await sc2.callStatic.claimRewards())[0]))
  });
  it("should increment lastDaySeen properly", async () => {
    async function redemptionAmount() {
      const rewards = await sc.callStatic.claimRewards();
      return rewards.amountToRedeem;
    }
    await cnfi.approve(sc.address, await cnfi.balanceOf(deployer.address));
    await sc.stake(await cnfi.balanceOf(deployer.address), 2);
    await sc.triggerNextReward();
    await sc.claimRewards();
    await sc.triggerNextReward();
    expect(await redemptionAmount()).to.equal(parseEther("100"));
  });
  it("viewproper: should test view layer for proper values", async () => {
    function triggerCycles(num) {
      return Array.from(new Array(num)).reduce(async (r, d) => {
        await r;
        return await sc.triggerNextDailyCycle(deployer.address);
      }, Promise.resolve());
    }
    await sc.govern(
      360 * 60 * 24,
      0,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, await cnfi.balanceOf(deployer.address));
    await sc.stake(await cnfi.balanceOf(deployer.address), 0);
    let decoded = await runView(sc);
    expect(decoded.dailyUser.currentTier).to.equal(0);
    await triggerCycles(1);
    await receiveCallback(sc);
    await triggerCycles(1);
    await receiveCallback(sc);
    decoded = await runView(sc);
    expect(decoded.dailyUser.currentTier).to.equal(1);
    await triggerCycles(2);
    decoded = await runView(sc);
    expect(decoded.dailyUser.currentTier).to.equal(2);
    await triggerCycles(1);
    decoded = await runView(sc);
    expect(decoded.dailyUser.currentTier).to.equal(2);
    await sc.unstake(scnfi.balanceOf(deployer.address));
    decoded = await runView(sc);
    expect(decoded.dailyUser.currentTier).to.equal(0);
  });
  it("should test cumulative weights", async () => {
    await sc.govern(
      360 * 60 * 24,
      60 * 10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, await cnfi.balanceOf(deployer.address));
    await sc.stake(await cnfi.balanceOf(deployer.address), 2);
    await sc.triggerNextReward();
    await sc.triggerNextReward();
    const reward1 = await sc.callStatic.claimRewards();

    await cnfi
      .connect(second)
      .approve(sc2.address, await cnfi.balanceOf(second.address));
    await sc2.stake(await cnfi.balanceOf(second.address), 0);

    const reward2 = await sc.callStatic.claimRewards();

    expect(reward1.bonuses).to.equal(reward2.bonuses);
    // await sc.receiveCallback(deployer.address, AddressZero)

    await sc.claimRewards();
    await sc2.claimRewards();
    await sc.triggerNextReward();

    const reward3 = await sc.callStatic.claimRewards();
    // const reward32 = await sc2.callStatic.claimRewards()
    const reward4 = await sc2.callStatic.claimRewards();
    //    expect(reward3.amountToRedeem.gte(reward2.amountToRedeem))

    // console.log(formatEther(reward32.amountToRedeem))
  });
  it("unstakecommitment1", async () => {
    await sc.govern(
      60 * 60,
      60,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [parseEther("1"), parseEther("1.25")],
      [1, 2],
      [parseEther("50"), parseEther("20000")]
    );
    await cnfi.approve(sc.address, parseEther("50000"));
    await sc.stake(parseEther("20000"), 2);
    await sc.unstake(parseEther("5000"));
    await sc.stake(parseEther("5000"), 2);
    await sc.triggerNextReward();
    const { amountToRedeem } = await sc.callStatic.claimRewards();
    expect(formatEther(amountToRedeem)).to.equal(
      formatEther(parseEther("100"))
    );
  });
  it("unstakecommitment2", async () => {
    await sc.govern(
      60 * 60,
      60,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [parseEther("1"), parseEther("1.25")],
      [1, 2],
      [parseEther("50"), parseEther("20000")]
    );
    await cnfi.approve(sc.address, parseEther("50000"));
    await sc.stake(parseEther("20000"), 2);
    await sc.unstake(parseEther("5000"));
    await sc.triggerNextReward();
    const { amountToRedeem } = await sc.callStatic.claimRewards();
    expect(formatEther(amountToRedeem)).to.equal(
      formatEther(parseEther("100"))
    );
  });
  it("unstakecommitment3: should track cumulative when staking then unstaking directly after to break commitment", async () => {
    await sc.govern(
      60 * 60,
      60,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [parseEther("1"), parseEther("1.25")],
      [1, 2],
      [parseEther("50"), parseEther("20000")]
    );
    await cnfi.approve(sc.address, parseEther("50000"));
    await sc.stake(parseEther("20000"), 2);
    await sc.unstake(parseEther("5000"));
    await sc.triggerNextReward();
    const { amountToRedeem } = await sc.callStatic.claimRewards();
    expect(formatEther(amountToRedeem)).to.equal(
      formatEther(parseEther("100"))
    );
  });
  it("unstakecommitment4: should display the correct values in the view", async () => {
    await sc.govern(
      60 * 60 * 24,
      60 * 10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [parseEther("1"), parseEther("1.25")],
      [10, 20],
      [parseEther("50"), parseEther("20000")]
    );
    await cnfi.approve(sc.address, parseEther("50000"));
    await sc.stake(parseEther("20000"), 2);
    await sc.unstake(parseEther("5000"));
    await sc.triggerNextReward();
    const decoded = await runView(sc);
    expect(decoded.returnstats.bonuses).to.equal("0");
  });
  it("propermultiplier: shouldnt change multiplier to the next one", async () => {
    function triggerCycles(num) {
      return Array.from(new Array(num)).reduce(async (r, d) => {
        await r;
        return await sc.triggerNextDailyCycle(deployer.address);
      }, Promise.resolve());
    }
    await sc.govern(
      360 * 60 * 24,
      60 * 10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, parseEther("20000"));
    await sc.stake(parseEther("20000"), 2);
    await triggerCycles(5);
    let decoded = await runView(sc);
    await sc.callStatic.claimRewards();
    expect(decoded.dailyUser.multiplier).to.be.equal(parseEther("1.25"));
    await sc.unstake(parseEther("5000"));
    decoded = await runView(sc);

    expect(
      Math.max(
        decoded.dailyUser.currentTier,
        decoded.currentTier,
        decoded.dailyUser.commitment
      )
    ).to.be.equal(1);
    expect(decoded.dailyUser.multiplier).to.not.be.equal(parseEther("1"));
    expect(decoded.dailyUser.multiplier).to.not.be.equal(parseEther("1.25"));
  });
  it("propermultiplier2: should maintain proper multiplier and bonuses across cycles and test black tier", async () => {
    function triggerCycles(num) {
      return Array.from(new Array(num)).reduce(async (r, d) => {
        await r;
        return await sc.triggerNextDailyCycle(deployer.address);
      }, Promise.resolve());
    }
    await sc.govern(
      360 * 60 * 24,
      60 * 10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await sc.mintCnfi(deployer.address, parseEther("200000"));
    await cnfi.approve(sc.address, parseEther("200000"));
    await sc.stake(parseEther("200000"), 0);
    await triggerCycles(9);
    await sc.triggerNextReward();
    const decoded = await runView(sc);
    expect(decoded.dailyUser.currentTier).to.be.equal(4);
    expect((await sc.callStatic.claimRewards()).bonuses).to.not.be.equal(0);
  });
  it("propermultiplier3: should maintain correct multipliers - gold edition", async () => {
    function triggerCycles(num) {
      return Array.from(new Array(num)).reduce(async (r, d) => {
        await r;
        return await sc.triggerNextDailyCycle(deployer.address);
      }, Promise.resolve());
    }
    await sc.govern(
      360 * 60 * 24,
      60 * 10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, parseEther("20000"));
    await sc.stake(parseEther("20000"), 2);
    await sc.triggerNextReward();
    await sc.unstake(parseEther("5000"));
    await sc.triggerNextReward();
    const bonus1 = await sc.callStatic.claimRewards();
    await cnfi.approve(sc.address, parseEther("5000"));
    await sc.stake(parseEther("5000"), 2);
    await sc.triggerNextReward();
    const decoded = await runView(sc);
    const bonus2 = await sc.callStatic.claimRewards();
    expect(bonus2.bonuses.sub(bonus1.bonuses)).to.equal(parseEther("20"));
  });
  it("stakingcontrollerdeposit: staking controller test", async () => {
    const cnfi = await hre.ethers.getContract("ConnectTokenTest");
    const [signer] = await hre.ethers.getSigners();
    const sc = await hre.ethers.getContract("StakingController");
    await cnfi.mint(await signer.getAddress(), parseEther("10000"));
    await sc.stake(parseEther("10000"), 0);
  });
  it("correctcycles: should correctly clock cycles", async () => {
    await sc.govern(
      60,
      10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, parseEther("20000"));
    await sc.mintCnfi(sc.signer.getAddress(), parseEther("20000"));
    await sc.stake(parseEther("20000"), 0);
    const ts = await getCurrentTimestamp(sc.signer.provider);
    const nextTs = ts + 60 * 4 + 20;
    await cnfi.approve(sc.address, parseEther("10"));
    await sc.signer.provider.send("evm_setNextBlockTimestamp", [nextTs]);
    await sc.signer.provider.send("evm_mine", []);
    const decoded = await runView(sc);
    expect(ethers.utils.formatEther(decoded.dailyUser.multiplier)).to.eql(
      "1.25"
    );
  });
  it("propermultipler4: should correctly increment multiplier", async () => {
    await sc.govern(
      60,
      10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, parseEther("5000"));
    await sc.mintCnfi(sc.signer.getAddress(), parseEther("5000"));
    await sc.stake(parseEther("5000"), 0);
    await sc.triggerNextDailyCycle(deployer.address);
    const decoded = await runView(sc);
    expect(decoded.dailyUser.multiplier).to.not.be.equal(parseEther("1.15"));
  });
  it("incrementmultiplier: should increment the multiplier due to passage of time", async () => {
    await sc.govern(
      60,
      10,
      parseEther("100"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await cnfi.approve(sc.address, parseEther("100000"));
    await sc.mintCnfi(sc.signer.getAddress(), parseEther("100000"));
    await sc.stake(parseEther("100000"), 0);
    await addTimestamp(sc.signer.provider, 60 * 6 + 5);
    const view = await runView(sc);
    expect(view.dailyUser.currentTier).to.equal(0x03);
  });
  it("rewardsdontdecline: should never decrease the unclaimed rewards in the pool over time", async () => {
    await sc.govern(
      60 * 60,
      10 * 60,
      parseEther("5000"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await sc.fillFirstCycle();
    await cnfi.approve(sc.address, parseEther("20000"));
    await cnfi.connect(second).approve(sc.address, parseEther("20000"));
    await sc.mintCnfi(sc.signer.getAddress(), parseEther("20000"));
    await sc.mintCnfi(second.getAddress(), parseEther("20000"));
    await sc.stake(parseEther("20000"), 2);
    await sc.connect(second).stake(parseEther("20000"), 0);
    await sc.connect(second).unstake(parseEther("1"));
    await addTimestamp(sc.signer.provider, 60);

    const view = await runView(sc);
    await addTimestamp(sc.signer.provider, 60 * 60);
  });
  it("rewardsgoup: shouldnt make rewards go up when someone unstakes", async () => {
    await sc.govern(
      60 * 60,
      10 * 60,
      parseEther("5000"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await sc.fillFirstCycle();
    await cnfi.approve(sc.address, parseEther("20000"));
    await sc.stake(parseEther("20000"), 2);
    console.log("staked 1");
    await cnfi.connect(second).approve(sc.address, parseEther("20000"));
    await sc2.stake(parseEther("20000"), 0);
    console.log("staked 2");
    await sc.triggerNextReward();
    console.log("rewards triggered");
    const rewards1 = await sc.callStatic.claimRewards();
    console.log("callstatic 1");
    await sc2.unstake(parseEther("20000"));
    console.log("unstake 2");
    const rewards2 = await sc.callStatic.claimRewards();
    console.log("callstatic 2");

    console.log(
      (await sc2.callStatic.claimRewards()).amountToRedeem.toString()
    );
    expect(rewards2.amountToRedeem).to.be.lte(rewards1.amountToRedeem);
  });
  it("multipliernotzero: multiplier should not be zero after staking for the correct amount of cycles for a tier", async () => {
    await sc.govern(
      60 * 60,
      10 * 60,
      parseEther("5000"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await sc.mintCnfi(sc.signer.getAddress(), parseEther("5000"));
    await sc.stake(parseEther("5000"), 0);
    await addTimestamp(sc.signer.provider, 60 * 60 + 10);
    await receiveCallback(sc);
    await addTimestamp(sc.signer.provider, 60 * 60 + 10);
    console.log("running view");
    const view = await runView(sc);
    expect(view.dailyUser.multiplier).to.equal(parseEther("1.15"));
  });
  it("bonusgoesto0: shouldnt set bonuses to 1x after unstaking", async () => {
    await sc.govern(
      60 * 60,
      10 * 60,
      parseEther("5000"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    await sc.mintCnfi(sc.signer.getAddress(), parseEther("50000"));
    await sc.stake(parseEther("50000"), 1);
    await sc.triggerNextReward();

    await sc.unstake(parseEther("45000"));
    await receiveCallback(sc);
    const view = await runView(sc);
    expect(view.dailyUser.multiplier).to.be.equal(parseEther("1.15"));
  });
  it("rewardsgodown: shouldnt cause rewards to go down", async () => {
    await sc.govern(
      60 * 60,
      10 * 60,
      parseEther("5000"),
      parseEther("100"),
      0,
      parseEther("2"),
      [
        parseEther("1.15"),
        parseEther("1.25"),
        parseEther("1.3"),
        parseEther("1.4"),
      ],
      [2, 4, 6, 8],
      [
        parseEther("5000"),
        parseEther("20000"),
        parseEther("100000"),
        parseEther("200000"),
      ]
    );
    const third = await generate();
    async function testIfDown(signer) {
      let available = (await runView(sc.connect(signer))).dailyUser.redeemable;
      async function run() {
        const result = await runView(sc.connect(signer));
        const redeemable = result.dailyUser.redeemable;
        console.log(redeemable.gte(available), formatEther(redeemable));
        if (redeemable.lt(available)) throw new Error("error");
        avaliable = redeemable;
      }
      return { run };
    }
    async function triggerNext(...controllers) {
      await addTimestamp(sc.signer.provider, 60 * 60 + 10);
    }

    const { run } = await testIfDown(third);
    await sc.mintCnfi(third.getAddress(), parseEther("5000"));
    await sc.stake(parseEther("5000"), 0);
    await sc2.stake(parseEther("5000"), 0);
    await sc.connect(third).stake(parseEther("5000"), 0);

    await triggerNext(sc, sc2, sc.connect(third));

    await run();
    await sc.unstake(parseEther("2500"));
    await triggerNext();
    await run();
    await sc2.unstake(parseEther("2500"));
    await triggerNext();
    await run();
    await triggerNext();
    await run();
  });
  it("should block", async () => {
    const BLOCKED = "0x2c6900b24221de2b4a45c8c89482fff96ffb7e55";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [BLOCKED],
    });

    const blocked = await hre.ethers.getSigner(BLOCKED);
    console.log(await blocked.getAddress());
    const cnfiblocked = cnfi.connect(blocked);
    const tx = await cnfiblocked.transfer(TREASURY_ADDRESS, parseEther("0"));
    console.log(tx);
    await tx.wait();
  });
  it("should rescue cnfi stck at blacklisted address", async () => {
    const BLOCKED = "0x2c6900b24221de2b4a45c8c89482fff96ffb7e55";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [PROXY_ADMIN],
    });

    const arbRetryableTx = await makeArbRetryableTx(l2provider);
    const cnfiAbi = hre.artifacts.readArtifactSync("ConnectTokenTest");
    const cnfiIface = new hre.ethers.utils.Interface(cnfiAbi.abi);
    const proxySigner = await hre.ethers.getSigner(PROXY_ADMIN);
    const proxyAdmin = new ProxyAdmin(PROXY_ADMIN_CONTRACT, proxySigner);
    const maxSubmission = (await arbRetryableTx.getSubmissionPrice(700))[0];
    console.log(Gateways.address(1), Routers.address(1));
    const data = cnfiIface.encodeFunctionData(
      "registerTokenOnL2(address,address,address,uint256,uint256,uint256,uint256,uint256,address,address)",
      [
        Gateways.address(1),
        Routers.address(1),
        cnfi.address,
        maxSubmission,
        maxSubmission,
        await l2provider.getGasPrice(),
        hre.ethers.utils.parseEther("0.0001"),
        hre.ethers.utils.parseEther("0.0001"),
        await proxySigner.getAddress(),
        await proxySigner.getAddress(),
      ]
    );
    await proxySigner.sendTransaction({
      to: cnfi.address,
      data: data,
    });
    const bal = await cnfi.balanceOf(PROXY_ADMIN);
    console.log(await bal.toString());
  });
});
