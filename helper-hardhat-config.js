const {ethers} = require("hardhat")

const networkConfig = {
	5: {
		name: "goerli",
		vrfCoordinatorV2: "0x2bce784e69d2Ff36c71edcB9F88358dB0DfB55b4",
		// vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
		entranceFee: ethers.utils.parseEther("0.01"),
		gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
		subscriptionId: "10506",
		callbackGasLimit: "300000",
		interval: "30"
	},
	31337: {
		name: "hardhat",
		entranceFee: ethers.utils.parseEther("0.01"),
		gasLane: "0x0476f9a745b61ea5c0ab224d3a6e4c99f0b02fce4da01143a4f70aa80ae76e8a",
		callbackGasLimit: "50000",
		interval: "30" // 30 seconds
	}
}
const developmentChains = ["hardhat", "localhost"]

module.exports = {
	networkConfig,
	developmentChains
}
