// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Voting {
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    address public owner;
    mapping(address => bool) public voters;
    Candidate[] public candidates;
    uint public votingEnd;
    bool public votingOpen;

    event VoteCast(address indexed voter, uint candidateId);
    event CandidateAdded(uint candidateId, string name);
    event VotingStarted(uint endTime);
    event VotingEnded();

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier votingIsOpen() {
        require(votingOpen, "Voting is not open");
        require(block.timestamp < votingEnd, "Voting period has ended");
        _;
    }

    constructor() {
        owner = msg.sender;
        votingOpen = false;
    }

    function addCandidate(string memory _name) public onlyOwner {
        require(!votingOpen, "Cannot add candidate once voting has started");
        uint candidateId = candidates.length;
        candidates.push(Candidate({
            id: candidateId,
            name: _name,
            voteCount: 0
        }));
        emit CandidateAdded(candidateId, _name);
    }

    function startVoting(uint _durationInMinutes) public onlyOwner {
        require(!votingOpen, "Voting is already open");
        require(candidates.length > 0, "No candidates added");
        
        votingOpen = true;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
        emit VotingStarted(votingEnd);
    }

    function vote(uint _candidateId) public votingIsOpen {
        require(!voters[msg.sender], "You have already voted");
        require(_candidateId < candidates.length, "Invalid candidate ID");
        
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        
        emit VoteCast(msg.sender, _candidateId);
    }

    function endVoting() public onlyOwner {
        require(votingOpen, "Voting is not open");
        votingOpen = false;
        emit VotingEnded();
    }

    function getCandidatesCount() public view returns (uint) {
        return candidates.length;
    }

    function getCandidate(uint _candidateId) public view returns (uint, string memory, uint) {
        require(_candidateId < candidates.length, "Invalid candidate ID");
        Candidate memory candidate = candidates[_candidateId];
        return (candidate.id, candidate.name, candidate.voteCount);
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function getVotingStatus() public view returns (bool isOpen, uint endTime, uint timeRemaining) {
        if (votingOpen && block.timestamp < votingEnd) {
            return (true, votingEnd, votingEnd - block.timestamp);
        } else {
            return (false, votingEnd, 0);
        }
    }

    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter];
    }
} 