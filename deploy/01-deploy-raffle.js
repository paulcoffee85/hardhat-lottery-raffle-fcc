// const {transactionReceipt} = require("ethers")
const {network, getNamedAccounts, ethers} = require("hardhat")
const {developmentChains, networkConfig} = require("../helper-hardhat-config")
const {verify} = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("5")
module.exports = async function ({getNamedAccounts, deployments}) {
	const {deploy, log} = deployments
	const {deployer} = await getNamedAccounts()
	const chainId = network.config.chainId
	let VRFCoordinatorV2Mock, vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock
	// *****************************  IF ON DEVELOPMENT CHAIN  ************************************************************
	if (developmentChains.includes(network.name)) {
		VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
		const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
		vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address

		// **************************   CREATE SUBSCRIPTION  *****************************************************************************

		const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
		const transactionReceipt = await transactionResponse.wait(1)
		// console.log(transactionReceipt)
		subscriptionId = await transactionReceipt.events[0].args.subId
		// **************************   FUND SUBSCRIPTION    ******************************************************************
		// Fund the subscription
		//  Usually , you'd need the link token on a real network
		// await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
		await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
	} else {
		vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
		subscriptionId = networkConfig[chainId]["subscriptionId"]
	}
	const entranceFee = networkConfig[chainId]["entranceFee"]
	const gasLane = networkConfig[chainId]["gasLane"]
	const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
	const interval = networkConfig[chainId]["interval"]
	const args = [
		vrfCoordinatorV2Address,
		entranceFee,
		gasLane,
		subscriptionId,
		callbackGasLimit,
		interval
	]
	const raffle = await deploy("Raffle", {
		from: deployer,
		args: args,
		log: true
		// waitConfirmations: network.config.blockConfirmations || 1
	})
	//************************************************ =>VRFCoordinatorV2Mock update ***********************************/
	if (developmentChains.includes(network.name)) {
		await VRFCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
		log("Consumer is added")
	}
	//************************************************  IF NOT ON DEVELOPMENT CHAIN **********************************/
	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
		log("Verifying....")
		await verify(raffle.address, args)
		console.log(raffle.address)
	}
	log(
		"-------------------------------------------------------------------------------------------------------------"
	)
}
module.exports.tags = ["all", "raffle"]
