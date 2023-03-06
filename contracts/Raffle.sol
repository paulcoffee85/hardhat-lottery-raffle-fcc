// RAFFLE

//  Enter the lottery (paying some amount)

// Pick a random winner (verifiably random)
//  Winner to be selected every X minutes =>  completely automated

// Chainlink ORacle -> Randomness, Automated Execution  (Cahinlink Keeper)

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";
// import "@chainlink/contracts/src/v0.8/dev/VRFConsumerBaesV2.sol";

error Raffle__NotEnoughETHEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

contract Raffle is
	VRFConsumerBaseV2,
	AutomationCompatibleInterface //  ***********************  CONTRACT  ***************************************************
{
	/* Type declarations */
	enum RaffleState {
		OPEN,
		CALUCULATING
	}
	/*  State Variables  */
	// Minimum eth price to enter raffle
	uint256 private immutable i_entranceFee;
	// address is going to be modified alot, so we'll need to put it in storage
	address payable[] private s_players; // Make players `payable` so we can pay them when they win

	VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
	bytes32 private immutable i_gasLane;
	uint64 private immutable i_subscriptionId;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint32 private immutable i_callbackGasLimit;
	uint32 private constant NUM_WORDS = 1;

	// *********************************************** LOTTERY VARIABLES **********************************************************
	address private s_recentWinner;
	RaffleState private s_raffleState; // to pending, open, closed, calculating
	uint256 private s_lastTimeStamp;
	uint256 private immutable i_interval;

	//	************************************************* EVENTS ****************************************************************************************
	event RaffleEnter(address indexed player);
	event RequestedRaffleWinner(uint256 indexed requestId);
	event WinnerPicked(address indexed winner);

	/*         FUNCTIONS          */
	constructor(
		//  ************************** CONSTRUCTOR *****************************************************************************
		address vrfCoordinatorV2, // CONTRACT address , Will need do deploy some mocks for this
		uint256 entranceFee,
		bytes32 gasLane,
		uint64 subscriptionId,
		uint32 callbackGasLimit,
		uint256 interval
	) VRFConsumerBaseV2(vrfCoordinatorV2) {
		i_entranceFee = entranceFee;
		i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
		i_gasLane = gasLane;
		i_subscriptionId = subscriptionId;
		i_callbackGasLimit = callbackGasLimit;
		s_raffleState = RaffleState.OPEN;
		// update with current timeStamp
		s_lastTimeStamp = block.timestamp;
		i_interval = interval;
	}

	function enterRaffle() public payable {
		// want anyone to enter our raffle (payable)
		if (msg.value < i_entranceFee) {
			// people will send `msg.value`
			revert Raffle__NotEnoughETHEntered();
		}
		// If statement if raffle not open
		if (s_raffleState != RaffleState.OPEN) {
			revert Raffle__NotOpen();
		}

		s_players.push(payable(msg.sender)); //  msg.sender doesn't work without typecasting / wrapping it in`payble(msg.sender)
		// Emit an event when we update a dyamic array or mapping
		// Named events with the function name reversed
		emit RaffleEnter(msg.sender);
	}

	/**
	 *@dev  This is the function that the Chainlink nodes call
	 * they look for the 'upkeepNeeded' to return true
	 * The following should be true in order to return true;
	 * 1. Our time interval should have passed
	 * 2. The lottery should have at least 1 player, and enough ETH
	 * 3. Our subscription is funded with LINK
	 * 4. The lottery should be in an "open" state.
	 */ // CheckUpKeep
	// Check to see if it's time to trigger our picking the random winner , let's write the function that gets executed
	// After this returns true
	function checkUpkeep(
		bytes memory /*checkData*/ // Added 'view' to 'public view override' after seen in updated Repo
	)
		public
		view
		override
		returns (
			// external  ( change checkUpkeep from external to public so our own smart contract can call this checkUpkeep function)
			bool upkeepNeeded,
			bytes memory /*perform Data*/
		)
	{
		bool isOpen = (RaffleState.OPEN == s_raffleState);
		bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval); // check bool to see if enough time has passed
		bool hasPlayers = (s_players.length > 0);
		bool hasBalance = address(this).balance > 0;
		upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
	}

	// Use a function used to request a random winner using Chainlink VRF
	/*                             CHANGE requestRandomWinner() to performUpkeep()                           */
	// function requestRandomWinner() external {
	function performUpkeep(bytes calldata /*perform Data*/) external override {
		//  performUpkeep is identified in the keeper compatible interface, so WE WILL `OVERRIDE` that function
		(bool upkeepNeeded, ) = checkUpkeep(""); //  pass it a blank call data
		if (!upkeepNeeded) {
			revert Raffle__UpkeepNotNeeded(
				address(this).balance,
				s_players.length,
				uint256(s_raffleState)
			);
		}
		// External functions cheaper than public view function.  Solidity knows our own contract cant call this 'external
		// Request Random number
		// Do something with it
		// 2 transaction process

		s_raffleState = RaffleState.CALUCULATING; // so no one can enter the lottery, or trigger a new update
		uint256 requestId = i_vrfCoordinator.requestRandomWords(
			i_gasLane, // gasLane
			i_subscriptionId,
			REQUEST_CONFIRMATIONS,
			i_callbackGasLimit,
			NUM_WORDS
		);
		emit RequestedRaffleWinner(requestId);
	}

	// *********************************************  WAY TO GET OUR RANDOM NUMBER *****************************************************************
	//  we use Words instead of Numbers, comes from computer science terminology
	function fulfillRandomWords(
		uint256 /*requestId*/,
		uint256[] memory randomWords
	) internal override {
		/* View / Pure functions */
		uint256 indexOfWinner = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[indexOfWinner];
		s_recentWinner = recentWinner;
		s_raffleState = RaffleState.OPEN; // RESET RAFFLE STATE
		s_players = new address payable[](0); // RESET PLAYERS ARRAY
		// address payable[] memory s_players = new adress payable [](0);
		s_lastTimeStamp = block.timestamp;

		(bool success, ) = recentWinner.call{value: address(this).balance}("");
		// require(success)
		if (!success) {
			revert Raffle__TransferFailed();
		}
		emit WinnerPicked(recentWinner);
	}

	// ************************************************************ GETTER FUNCTIONS()  View / Pure *********************************************************
	function getEntranceFee() public view returns (uint256) {
		return i_entranceFee;
	}

	function getPlayer(uint256 index) public view returns (address) {
		return s_players[index];
	}

	function getRecentWinner() public view returns (address) {
		return s_recentWinner;
	}

	function getRaffleState() public view returns (RaffleState) {
		return s_raffleState;
	}

	function getNumWords() public pure returns (uint256) {
		return NUM_WORDS;
	}

	function getNumberOfPlayers() public view returns (uint256) {
		return s_players.length;
	}

	function getLatestTimeStamp() public view returns (uint256) {
		return s_lastTimeStamp;
	}

	function getRequestConfirmations() public pure returns (uint256) {
		return REQUEST_CONFIRMATIONS;
	}

	function getInterval() public view returns (uint256) {
		return i_interval;
	}
}
