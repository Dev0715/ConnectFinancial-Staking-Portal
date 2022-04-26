// "use strict";
// import React from "react";
import { ethers } from "ethers";
// import { makeEthersBase } from "ethers-base";
// import Query from "@connectfinancial/staking-controller-etl/artifacts/contracts/ArbQuery.sol/ArbQuery.json";
import { ProxyAdmin } from "@connectfinancial/connect-token/lib/proxy-admin.js";
import { ConnectToken } from "@connectfinancial/connect-token/lib/main";
//import MintCNFI from '@connectfinancial/connect-token/artifacts/contracts/token/MintCNFI.sol/MintCNFI';
const deployments = require("@connectfinancial/connect-token/deployments/deployments.json");
const arbDeployments = require("@connectfinancial/staking-controller-etl/deployments/deployments.json");

const events = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountToRedeem",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bonuses",
        type: "uint256",
      },
    ],
    name: "Redeemed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "commitmentTier",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minimum",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "timeLocked",
        type: "bool",
      },
    ],
    name: "Staked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "slashed",
        type: "uint256",
      },
    ],
    name: "Unstaked",
    type: "event",
  },
];

// const INFURA_PROJECT_ID =
//   process.env.REACT_APP_INFURA_PROJECT_ID || "c1a9ac9c4eaa432d99aa1dbf8ca7552c";
// const INFURA_URL = `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;

export function getCNFI({ signer, chain }) {
  /*  const makeStakingController = (deployment, query) => {
    return class StakingController extends makeEthersBase(deployment) {
      dataView = async (account) => {
        const qFac = new ethers.ContractFactory(
          query.abi,
          query.bytecode,
          this.signer
        );
        // await qFac.deploy(this.address, account)
        let data;
        console.log(this.signer);
        if (!this.signer) {
          data = await signer.call({
            data: qFac.getDeployTransaction(
              this.address,
              account ? account : ethers.constants.AddressZero
            ).data,
          });
        } else {
          data = await this.signer.call({
            data: qFac.getDeployTransaction(this.address, account).data,
          });
        }
        console.log(data);
        const decodedResult = qFac.interface.decodeFunctionResult(
          "decodeResponse",
          data
        );
        const [result, amountToRedeem, bonuses, timestamp] = decodedResult;
        const decoded = qFac.interface.decodeFunctionResult("render", result);
        return Object.assign({}, decoded, {
          amountToRedeem,
          redeemable: amountToRedeem,
          bonuses,
        });
      };
      logsView = async (account) => {
        if (
          !account ||
          account.length == 0 ||
          account == ethers.constants.AddressZero
        )
          return [];
        const data = await (this.signer
          ? this.signer.provider
          : signer
        ).getLogs({
          ...this.filters.Redeemed(account),
          fromBlock: process.env.REACT_APP_GENESIS || 0,
        });
        return data.map((d) => this.interface.parseLog(d));
      };

      loadView = async (account) => {
        if (window.debug && window.debug.fauxUser)
          account = window.debug.fauxUser;
        if (!account) account = ethers.constants.AddressZero;

        const [data, logs] = await Promise.all([
          this.dataView(account),
          this.logsView(account),
        ]);

        if (data) {
          const totalEarned = logs
            .reduce(
              (total, log) => total.add(log.args.amountToRedeem || "0"),
              ethers.BigNumber.from("0")
            )
            .add(data.dailyUser.redeemable || "0");

          const totalBonuses = logs.reduce(
            (total, log) =>
              log.name === "Redeemed" ? total.add(log.args.bonuses) : total,
            ethers.BigNumber.from(data.returnstats.bonuses || "0")
          );
          const result = {
            ...data,
            user: Object.assign({}, data.dailyUser),
            totalBonuses,
            totalEarned,
            earned: totalEarned.sub(data.returnstats.bonuses || "0"),
          };
          if (window.debug && window.debug.logView) console.log(result);
          return result;
        }
      };
    };
  };
  */

  const getContracts = () => {
    const deploymentsForChain = Object.keys(deployments[chain]);
    const relavantDeployments = deploymentsForChain.includes("localhost")
      ? "localhost"
      : deploymentsForChain[0];
    return {
      ...deployments[chain][relavantDeployments].contracts,
      ...(chain === 42161
        ? arbDeployments[chain][relavantDeployments].contracts
        : {}),
    };
  };

  const getConnectToken = (deployment) => {
    return (
      deployment.ConnectTokenTest ||
      deployment.ConnectTokenL2 ||
      deployment.ConnectToken
    );
  };

  const getStakingController = (deployment) => {
    return (
      deployment.StakingControllerTest ||
      deployment.StakingControllerArb ||
      deployment.StakingController
    );
  };

  const getsCNFI = (deployment) => {
    return deployment.sCNFI;
  };

  const contracts = () => {
    const deployedContracts = getContracts(chain);
    const connectToken = getConnectToken(deployedContracts);
    const cnfi = new ConnectToken(connectToken.address, signer);
    const StakingController = getStakingController(deployedContracts);
    const SCNFI = getsCNFI(deployedContracts);
    const scnfi = new ConnectToken(SCNFI.address, signer);
    /* const staking = new (makeStakingController(
      {
        ...StakingController,
        abi: [...StakingController.abi, ...events],
      },
      Query
    ))(StakingController.address, signer);
    */
    const staking = new ethers.Contract(
      StakingController.address,
      [...StakingController.abi, ...events],
      signer
    );
    window.contracts = { cnfi, staking };
    return {
      cnfi,
      staking,
      scnfi,
    };
  };

  const getAdmin = async (contracts) => {
    const connectToken = new ConnectToken(contracts.cnfi.address, signer);
    const admin = await connectToken.getAdmin();
    const proxyAdmin = new ProxyAdmin(admin, signer);
    const owner = await proxyAdmin.owner();
    await proxyAdmin.provider.send("hardhat_impersonateAccount", [owner]);
    const _signer = await proxyAdmin.provider.getSigner(owner);
    return new ProxyAdmin(owner, _signer);
  };

  return { contracts: contracts(), getAdmin };
}
