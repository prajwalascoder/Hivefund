// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FundVault {

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
    }

    struct Campaign {
        address creator;
        uint256 goal;
        uint256 raised;
        uint256 deadline;
        bool withdrawn;
    }

    address public owner;
    uint256 public campaignCount;

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Donation[]) public campaignDonations;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 goal,
        uint256 deadline
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only backend allowed");
        _;
    }

    modifier campaignExists(uint256 campaignId) {
        require(campaignId < campaignCount, "Invalid campaign");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

   
       CREATE CAMPAIGN
    ==========================*/
    function createCampaign(
        address creator,
        uint256 goal,
        uint256 deadline
    ) external onlyOwner {

        require(deadline > block.timestamp, "Invalid deadline");
        require(goal > 0, "Goal must be > 0");

        campaigns[campaignCount] = Campaign({
            creator: creator,
            goal: goal,
            raised: 0,
            deadline: deadline,
            withdrawn: false
        });

        emit CampaignCreated(campaignCount, creator, goal, deadline);
        campaignCount++;
    }

  
       SIMPLE DEPOSIT (BACKEND COMPATIBLE)
    ==========================*/
    function deposit() external payable {
        require(msg.value > 0, "No ETH sent");

        emit DonationReceived(999, msg.sender, msg.value);
    }


       FULL DONATION LEDGER MODE
    ==========================*/
    function donate(uint256 campaignId)
        external
        payable
        campaignExists(campaignId)
    {
        require(msg.value > 0, "No ETH sent");

        Campaign storage c = campaigns[campaignId];
        require(block.timestamp <= c.deadline, "Campaign ended");

        c.raised += msg.value;

        campaignDonations[campaignId].push(
            Donation({
                donor: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        emit DonationReceived(campaignId, msg.sender, msg.value);
    }

   
       WITHDRAW
    ==========================*/
    function withdraw(uint256 campaignId)
        external
        campaignExists(campaignId)
    {
        Campaign storage c = campaigns[campaignId];

        require(msg.sender == c.creator, "Not campaign creator");
        require(!c.withdrawn, "Already withdrawn");

        require(
            block.timestamp >= c.deadline || c.raised >= c.goal,
            "Goal not met & deadline not reached"
        );

        c.withdrawn = true;

        uint256 amount = c.raised;
        (bool success, ) = payable(c.creator).call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(campaignId, c.creator, amount);
    }

    function getDonations(uint256 campaignId)
        external
        view
        returns (Donation[] memory)
    {
        return campaignDonations[campaignId];
    }

    function getCampaign(uint256 campaignId)
        external
        view
        returns (Campaign memory)
    {
        return campaigns[campaignId];
    }
}
