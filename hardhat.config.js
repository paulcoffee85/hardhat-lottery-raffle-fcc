require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: "0.8.8",

	defaultNetwork: "hardhat",

	networks: {
		hardhat: {
			chainId: 31337,
			blockConfirmations: 1
		},
		// goerli: {
		// 	url: GOERLI_RPC_URL,
		// 	api: [PRIVATE_KEY],
		// 	chainId: 5,
		// 	blockConfirmations: 6
		// }
		goerli: {
			url: GOERLI_RPC_URL,
			accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
			//   accounts: {
			//     mnemonic: MNEMONIC,
			//   },

			saveDeployments: true,
			chainId: 5
		}
	},
	etherscan: {
		// yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
		apiKey: {
			goerli: ETHERSCAN_API_KEY
		}
	},
	namedAccounts: {
		deployer: {
			default: 0
		},
		player: {
			default: 1
		}
	},
	gasReporter: {
		enabled: true,
		currency: "ETH",
		outputFile: "gas-report.txt",
		noColors: true,
		coinmarketcap: COINMARKETCAP_API_KEY,
		token: "BTC"
	}
}
