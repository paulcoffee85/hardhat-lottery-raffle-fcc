const {deployments, getChainId, network} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0.25 is the premium, it costs 0.25 LINK / Request
const GAS_PRICE_LINK = 1e9 // = 1000000000// Calculated value based on the gas price of the chain

module.exports = async function ({getNamedAccounts, deployments}) {
	const {deployer} = await getNamedAccounts()
	const {deploy, log} = deployments
	// const chainId = network.config.chainId
	const args = [BASE_FEE, GAS_PRICE_LINK]

	if (developmentChains.includes(network.name)) {
		log("local network detected!, deploying mocks....")
		// deploy a mock vrfcoordinator
		await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			log: true,
			args: args
		})

		log("Mocks Deployed!")
		log(
			"-----------------------------------------------------------------------------------------------------------"
		)
	}
}
module.exports.tags = ["all", "mocks"]
