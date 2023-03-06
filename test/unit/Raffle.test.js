const {getNamedAccounts, deployments, ethers, network} = require("hardhat")
const {assert, expect} = require("chai")
const {developmentChains, networkConfig} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Raffle", async function () {
			let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval

			const chainId = network.config.chainId

			beforeEach(async function () {
				// Import getNamedAccounts() from hardhat
				deployer = (await getNamedAccounts()).deployer
				// deploy raffle, vrfCoordinatorV2Mock using our fixtures
				await deployments.fixture(["all"])
				// once deployed// a new instance of the 'Raffle' contract is created using the specific 'deployer account
				raffle = await ethers.getContract("Raffle", deployer)
				// console.log(raffle)
				vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
				// raffleEntranceFee
				raffleEntranceFee = await raffle.getEntranceFee()
				// evm_increaseTime [interval.toNumber()]
				interval = await raffle.getInterval()
			})
			describe("constructor", async function () {
				it("Initializes the Raffle correctly ", async function () {
					// Test case to make sure raffle is set to OPEN
					const raffleState = await raffle.getRaffleState()

					/*the assertion is checking whether the initial
             state of the Raffle smart contract is set to OPEN. 
            If the raffleState variable is equal to 0, the assertion will pass. If not, it will fail.*/
					assert.equal(raffleState.toString(), "0")
					assert.equal(interval.toString(), networkConfig[chainId]["interval"]) // should equal whatever is in our helper-config
				})
			})
			describe("enterRaffle", async function () {
				it("reverts when you don't pay enough ", async function () {
					await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__NotEnoughETHEntered")
				})
				it("records players when they enter", async function () {
					await raffle.enterRaffle({value: raffleEntranceFee})
					// make sure that our deployer here has been correctly recorded
					const playerFromContract = await raffle.getPlayer(0) //index 0 because we record them in our players array & getPlayer() that pulls them out
					assert.equal(playerFromContract, deployer) // player from contract should be the deployer.
				})

				// **************************************** Testing  EVENTS & CHAI MATCHERS ***********************************************************************
				it("emits event on enter", async function () {
					//  First time testing to make sure a function() emits an event
					await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit(
						raffle,
						"RaffleEnter"
					)
				})
				// **************************************** Doesn't Allow Entrees when Calculating... ***********************************************
				it("doesn't allow entrance when raffle is calculating", async function () {
					// enter the raffle, (we have a player)
					await raffle.enterRaffle({value: raffleEntranceFee})
					//  Use hh Special testing/debugging methods
					// evm_increaseTime
					// evm_mine
					//  To get checkUpkeep to return true, need to increase interval
					await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
					// using empty array, mine one extra block to move forward
					await network.provider.send("evm_mine", [])
					// Raffle state is open, time's passed, has players && has balance
					// checkUpkeep() === true => be able to call performUpkeep()
					// Now pretend to be a chainlink keeper, passing blank array (empty calldata)
					await raffle.performUpkeep([])
					//  NOW in a calculating state
					//  enterRaffle() reverts correctly if it isn't open
					await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWith(
						"Raffle__NotOpen"
					)
				})
			})
	  })
