const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner;
  let addr1;
  let addr2;
  let addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should start with voting closed", async function () {
      expect(await voting.votingOpen()).to.equal(false);
    });
  });

  describe("Candidates", function () {
    it("Should allow the owner to add candidates", async function () {
      await voting.addCandidate("Candidate 1");
      await voting.addCandidate("Candidate 2");
      
      expect(await voting.getCandidatesCount()).to.equal(2);
      
      const candidate1 = await voting.getCandidate(0);
      expect(candidate1[1]).to.equal("Candidate 1");
      
      const candidate2 = await voting.getCandidate(1);
      expect(candidate2[1]).to.equal("Candidate 2");
    });

    it("Should not allow non-owners to add candidates", async function () {
      await expect(
        voting.connect(addr1).addCandidate("Candidate 3")
      ).to.be.revertedWith("Only owner can call this function");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.addCandidate("Candidate 1");
      await voting.addCandidate("Candidate 2");
      await voting.startVoting(60); // 60 minutes
    });

    it("Should allow voters to cast votes", async function () {
      await voting.connect(addr1).vote(0);
      await voting.connect(addr2).vote(1);
      
      const candidate1 = await voting.getCandidate(0);
      const candidate2 = await voting.getCandidate(1);
      
      expect(candidate1[2]).to.equal(1);
      expect(candidate2[2]).to.equal(1);
    });

    it("Should not allow voters to vote twice", async function () {
      await voting.connect(addr1).vote(0);
      
      await expect(
        voting.connect(addr1).vote(1)
      ).to.be.revertedWith("You have already voted");
    });

    it("Should not allow voting for invalid candidates", async function () {
      await expect(
        voting.connect(addr1).vote(99)
      ).to.be.revertedWith("Invalid candidate ID");
    });
  });

  describe("Voting Status", function () {
    it("Should return the correct voting status", async function () {
      await voting.addCandidate("Candidate 1");
      
      let status = await voting.getVotingStatus();
      expect(status.isOpen).to.equal(false);
      
      await voting.startVoting(60);
      
      status = await voting.getVotingStatus();
      expect(status.isOpen).to.equal(true);
      
      await voting.endVoting();
      
      status = await voting.getVotingStatus();
      expect(status.isOpen).to.equal(false);
    });
  });
}); 