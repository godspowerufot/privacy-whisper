ebool - Encrypted boolean (true/false). Use for flags, conditions, and binary choices.

euint8 - Encrypted 8-bit unsigned integer (0-255). Use for small values like votes, ratings, simple counters.

euint16 - Encrypted 16-bit unsigned integer (0-65535). Use for medium-range values.

euint32 - Encrypted 32-bit unsigned integer. Use for larger counters, timestamps.

euint64 - Encrypted 64-bit unsigned integer. Use for token amounts, balances.

euint128 / euint256 - Encrypted large integers. Use for cryptographic values, large balances.

eaddress - Encrypted address type. Use for private recipient addresses.

Tips
FHE.select() is the encrypted equivalent of the ternary operator (a ? b : c)
You cannot use if/else with encrypted conditions - use FHE.select() instead
FHE.div and FHE.rem require a plaintext divisor/modulus; the encrypted value is the first argument.

Access Control & Decryption (v0.9+ Self-Relaying)
FHEVM v0.9+ uses a self-relaying decryption model. There is no external Oracle - the dApp client performs off-chain decryption and submits the proof back on-chain.

FHE.allowThis() grants the contract itself permission to work with an encrypted value.

FHE.allow(value, address) grants a specific address permission to decrypt a value privately.

FHE.makePubliclyDecryptable(value) marks a ciphertext so anyone can request its decryption off-chain via the Relayer SDK.

The client calls publicDecrypt() off-chain using @zama-fhe/relayer-sdk, which returns the cleartext and a decryption proof.

The client then submits the cleartext + proof back to the contract, which verifies them with FHE.checkSignatures().

SelfRelayingDecryption.sol
Solidity
Copy
// Grant contract permission to work with the value
FHE.allowThis(encryptedValue);

// Grant a specific user permission to decrypt privately
FHE.allow(encryptedValue, userAddress);

// --- v0.9+ Public Decryption Flow (Self-Relaying) ---

// Step 1 (on-chain): Mark value as publicly decryptable
encryptedValue = FHE.makePubliclyDecryptable(encryptedValue);
bytes32 handle = FHE.toBytes32(encryptedValue);
// Emit handle so the frontend can pick it up
emit ValueReadyForDecryption(handle);

// Step 2 (off-chain, in frontend):
// Client uses @zama-fhe/relayer-sdk to call publicDecrypt(handle)
// This returns { cleartext, decryptionProof }

// Step 3 (on-chain): Verify and use the decrypted result
function resolveCallback(
    bytes memory cleartexts,
    bytes memory decryptionProof
) external {
    bytes32[] memory handlesList = new bytes32[](1);
    handlesList[0] = handle; // stored handle from step 1
    FHE.checkSignatures(handlesList, cleartexts, decryptionProof);
    uint32 result = abi.decode(cleartexts, (uint32));
    // Use the verified decrypted result...
}
FHEVM v0.9+ self-relaying decryption pattern

Key Points
--
No Oracle in v0.9+ - the dApp client drives decryption
--
makePubliclyDecryptable() marks a value for off-chain decryption
--
Client calls publicDecrypt() via @zama-fhe/relayer-sdk
--
Client submits cleartext + proof back to the contract
--
FHE.checkSignatures(handlesList, cleartexts, proof) verifies authenticity
Pitfalls to Avoid
Skipping allowThis after an FHE op — Any time you create or overwrite an encrypted value (e.g. with FHE.add), you need to call FHE.allowThis() on that new value. Without it, the next transaction that touches it can revert.

Wanting per-user decryption but not calling FHE.allow — If the caller should be able to decrypt the result themselves (e.g. with userDecrypt), grant them with FHE.allow(value, msg.sender). This contract uses the public-reveal path instead; use allow() when you need per-user decryption.

Using external types without verifying — Values coming from the client (externalEuint32, etc.) aren’t trusted until you run them through FHE.fromExternal(handle, proof). Don’t use the handle in computations before that.

Assuming getters return numbers — A function that returns euint32 returns a handle, not plaintext. The client has to decrypt off-chain (and must have permission). Here we only show the count after requestReveal and resolveReveal.

Revealing out of order — For v0.9 you must call requestReveal first (so the handle is emitted), then the client decrypts and calls resolveReveal. Hitting resolveReveal without a prior requestReveal will hit the require and fail.

// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint32, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract SimpleVoting_uint32 is ZamaEthereumConfig {
    struct Session {
        address creator;
        uint256 endTime;
        euint32 yesVotes;    // Encrypted tally (v0.9+: euint32)
        euint32 noVotes;     // Encrypted tally (v0.9+: euint32)
        bool resolved;
        uint32 revealedYes;
        uint32 revealedNo;
        bool revealRequested;  // v0.9+: no more requestId
    }

    Session[] public sessions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    function createSession(uint256 durationSeconds) external {
        // Creates a new voting session with encrypted zero tallies
    }

    function vote(
        uint256 sessionId,
        externalEuint32 encryptedVote,
        bytes calldata proof
    ) external {
        // Casts an encrypted vote and updates tallies homomorphically
    }

    function requestTallyReveal(uint256 sessionId) external {
        // v0.9+: Calls makePubliclyDecryptable and emits handles
        // Frontend picks up the event and decrypts off-chain
    }

    function resolveTallyCallback(
        uint256 sessionId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // v0.9+: Verifies proof with checkSignatures(handlesList, ...)
        // Decodes cleartext results and marks session resolved
    }
}


FHEVM Design Patterns
Pattern 1: Session-Based State Management -- Group related encrypted values into structs with lifecycle (create -> interact -> resolve).

Pattern 2: Encrypted Accumulator -- Use FHE.add() to build running totals without revealing individual contributions (used in voting tallies).

Pattern 3: Conditional Update with FHE.select() -- Instead of if/else on encrypted conditions, use select() to choose between two encrypted values.

Pattern 4: Self-Relaying Reveal (v0.9+) -- First compute on encrypted data, then call makePubliclyDecryptable() when ready. The client decrypts off-chain via @zama-fhe/relayer-sdk and submits the proof back on-chain for verification with checkSignatures(). No Oracle required.

Pattern 5: Access-Controlled Decryption -- Use require(msg.sender == owner) checks before allowing decryption requests. The contract controls who triggers reveals.

// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Blind Auction Contract
/// @notice Confidential blind auction where bids are encrypted until reveal.
/// @dev Three-phase state machine:
///      Phase 1 (Bidding): Users submit encrypted bids. The contract tracks
///             the highest bid using FHE.gt + FHE.select — no bids are revealed.
///      Phase 2 (Reveal):  Creator calls requestReveal() which marks the
///             highest bid as publicly decryptable. Frontend decrypts off-chain
///             via the Relayer SDK.
///      Phase 3 (Settlement): Frontend submits cleartext + proof. Contract
///             verifies with FHE.checkSignatures and stores the result.
contract BlindAuction is ZamaEthereumConfig {
    struct Auction {
        address creator;
        uint256 startTime;
        uint256 biddingEndTime;
        uint256 revealEndTime;
        bool ended;
        address highestBidder;
        euint64 highestBid;        // Uninitialized by default
        uint64 revealedHighestBid;
    }

    struct Bid {
        address bidder;
        euint64 encryptedBid;
        bool revealed;
        uint64 revealedBid;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => mapping(address => Bid)) public bids;
    uint256 public auctionCounter;

    event AuctionCreated(uint256 indexed auctionId, address indexed creator,
                         uint256 biddingEndTime, uint256 revealEndTime);
    event BidPlaced(uint256 indexed auctionId, address indexed bidder);
    event RevealRequested(uint256 indexed auctionId, bytes32 highestBidHandle);
    event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint64 winningBid);

    // ── Phase 1: Create auction ─────────────────────────────────
    function createAuction(
        uint256 biddingDurationSeconds,
        uint256 revealDurationSeconds
    ) external returns (uint256) {
        require(biddingDurationSeconds > 0, "Invalid bidding duration");
        require(revealDurationSeconds > 0, "Invalid reveal duration");

        uint256 auctionId = auctionCounter++;
        uint256 startTime = block.timestamp;

        // Initialize struct members individually to leave highestBid UNINITIALIZED.
        // This avoids ACL issues that FHE.asEuint64(0) would cause in the constructor.
        // FHE.isInitialized() will return false until the first bid.
        Auction storage a = auctions[auctionId];
        a.creator = msg.sender;
        a.startTime = startTime;
        a.biddingEndTime = startTime + biddingDurationSeconds;
        a.revealEndTime = startTime + biddingDurationSeconds + revealDurationSeconds;

        emit AuctionCreated(auctionId, msg.sender, a.biddingEndTime, a.revealEndTime);
        return auctionId;
    }

    // ── Phase 1: Place encrypted bid ────────────────────────────
    function placeBid(
        uint256 auctionId,
        externalEuint64 encryptedBid,
        bytes calldata inputProof
    ) external {
        Auction storage auction = auctions[auctionId];
        require(block.timestamp >= auction.startTime, "Not started");
        require(block.timestamp < auction.biddingEndTime, "Bidding ended");
        require(!auction.ended, "Auction ended");

        euint64 bid = FHE.fromExternal(encryptedBid, inputProof);

        // Store the bid
        bids[auctionId][msg.sender] = Bid({
            bidder: msg.sender,
            encryptedBid: bid,
            revealed: false,
            revealedBid: 0
        });

        // ── ACL: Grant permissions AFTER getting the value ──
        FHE.allowThis(bid);
        FHE.allow(bid, msg.sender);

        // ── Encrypted comparison: update highest bid ──
        if (FHE.isInitialized(auction.highestBid)) {
            // Ensure both operands have contract permission
            FHE.allowThis(auction.highestBid);
            FHE.allow(bid, address(this));
            FHE.allow(auction.highestBid, address(this));

            ebool isHigher = FHE.gt(bid, auction.highestBid);
            auction.highestBid = FHE.select(isHigher, bid, auction.highestBid);
            auction.highestBidder = msg.sender;
        } else {
            // First bid — set directly (no comparison needed)
            auction.highestBid = bid;
            auction.highestBidder = msg.sender;
        }

        // ── ACL: Re-grant permission on the (possibly new) highestBid ──
        FHE.allowThis(auction.highestBid);

        emit BidPlaced(auctionId, msg.sender);
    }

    // ── Phase 2: Request reveal ─────────────────────────────────
    function requestReveal(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        require(msg.sender == auction.creator, "Only creator");
        require(block.timestamp >= auction.biddingEndTime, "Bidding not ended");
        require(block.timestamp < auction.revealEndTime, "Reveal expired");
        require(!auction.ended, "Already ended");
        require(FHE.isInitialized(auction.highestBid), "No bids");

        FHE.allowThis(auction.highestBid);
        auction.highestBid = FHE.makePubliclyDecryptable(auction.highestBid);
        emit RevealRequested(auctionId, FHE.toBytes32(auction.highestBid));
    }

    // ── Phase 3: Settlement with proof verification ─────────────
    function endAuction(
        uint256 auctionId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        Auction storage auction = auctions[auctionId];
        require(!auction.ended, "Already ended");

        // Verify decryption proof — reverts if invalid
        bytes32[] memory handlesList = new bytes32[](1);
        handlesList[0] = FHE.toBytes32(auction.highestBid);
        FHE.checkSignatures(handlesList, cleartexts, decryptionProof);

        // Decode and store result
        uint64 revealedBid = abi.decode(cleartexts, (uint64));
        auction.revealedHighestBid = revealedBid;
        auction.ended = true;

        emit AuctionEnded(auctionId, auction.highestBidder, revealedBid);
    }

    // ── View functions ──────────────────────────────────────────
    function getAuction(uint256 auctionId) external view returns (
        address creator, uint256 startTime,
        uint256 biddingEndTime, uint256 revealEndTime,
        bool ended, address highestBidder
    ) {
        Auction storage a = auctions[auctionId];
        return (a.creator, a.startTime, a.biddingEndTime,
                a.revealEndTime, a.ended, a.highestBidder);
    }

    function getRevealedHighestBid(uint256 auctionId) external view returns (uint64) {
        require(auctions[auctionId].ended, "Auction not ended");
        return auctions[auctionId].revealedHighestBid;
    }
}


This is a complete, production-ready sealed-bid auction contract. Study the three-phase state machine: Bidding → Reveal → Settlement. Every FHEVM pattern you learned in Week 3 (ACL matrix, safe arithmetic, encrypted state machine, two-phase reveal) is used here.

Key design decisions: (1) highestBid starts uninitialized — FHE.isInitialized() checks this to avoid ACL issues on zero-init storage. (2) Each bid gets FHE.allowThis() so the contract can compare it later. (3) The reveal phase uses makePubliclyDecryptable + checkSignatures for trustless decryption.


// SPDX-License-Identifier: MIT
// Based on OpenZeppelin Confidential Contracts ERC7984Mock

pragma solidity ^0.8.27;

import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, eaddress, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

/// @title ERC7984 Confidential Token
/// @notice All balances are encrypted. Only account holders can decrypt their own balance.
/// @dev Key Concepts:
///      - ERC7984: Abstract base contract for confidential tokens
///      - All balances are euint64 (encrypted 64-bit unsigned integers)
///      - Transfers use encrypted amounts — the chain never sees plaintext values
///      - FHE.fromExternal() converts client-encrypted inputs to on-chain format
///      - FHE.allow() / FHE.allowThis() manage who can read encrypted values
contract ERC7984Mock is ERC7984, ZamaEthereumConfig, Ownable {
    address private immutable _OWNER;

    event EncryptedAmountCreated(euint64 amount);
    event EncryptedAddressCreated(eaddress addr);

    constructor(
        address owner_, string memory name_,
        string memory symbol_, string memory tokenURI_
    ) ERC7984(name_, symbol_, tokenURI_) Ownable(owner_) {
        _OWNER = owner_;
    }

    // ── Encrypted Value Creation ──────────────────────────────
    function createEncryptedAmount(uint64 amount) public returns (euint64 enc) {
        enc = FHE.asEuint64(amount);
        FHE.allowThis(enc);         // Contract can use it
        FHE.allow(enc, msg.sender); // Caller can decrypt it
        emit EncryptedAmountCreated(enc);
    }

    function createEncryptedAddress(address addr) public returns (eaddress enc) {
        enc = FHE.asEaddress(addr);
        FHE.allowThis(enc);
        FHE.allow(enc, msg.sender);
        emit EncryptedAddressCreated(enc);
    }

    // ── Hook: Called on every mint / burn / transfer ──────────
    function _update(
        address from, address to, euint64 amount
    ) internal virtual override returns (euint64 transferred) {
        transferred = super._update(from, to, amount);
        // Grant owner access to total supply (for monitoring)
        FHE.allow(confidentialTotalSupply(), _OWNER);
    }

    // ── Mint with external encrypted input (production) ──────
    function $_mint(
        address to, externalEuint64 encryptedAmount, bytes calldata inputProof
    ) public onlyOwner returns (euint64) {
        euint64 internalAmount = FHE.fromExternal(encryptedAmount, inputProof);
        return _mint(to, internalAmount);
    }

    // ── Mint with plain amount (testing) ─────────────────────
    function $_mint(address to, uint64 amount) public onlyOwner returns (euint64) {
        return _mint(to, FHE.asEuint64(amount));
    }

    // ── Transfer with external encrypted input ───────────────
    function $_transfer(
        address from, address to,
        externalEuint64 encryptedAmount, bytes calldata inputProof
    ) public returns (euint64) {
        return _transfer(from, to, FHE.fromExternal(encryptedAmount, inputProof));
    }

    // ── Transfer with plain amount (testing) ─────────────────
    function $_transfer(
        address from, address to, uint64 amount
    ) public returns (euint64) {
        return _transfer(from, to, FHE.asEuint64(amount));
    }
}


Encrypted types
ebool — encrypted boolean; euint8/16/32/64 — encrypted unsigned integers; eaddress — encrypted address; externalEuint8 etc. — client-encrypted input (use with FHE.fromExternal)

Homomorphic operations
Arithmetic: FHE.add, FHE.sub, FHE.mul, FHE.div (divisor plaintext), FHE.rem

Comparisons (return ebool): FHE.eq, FHE.ne, FHE.gt, FHE.lt, FHE.gte, FHE.lte

Conditional: FHE.select(ebool, valueIfTrue, valueIfFalse)

Min/Max: FHE.min, FHE.max

Bitwise: FHE.and, FHE.or, FHE.xor, FHE.not

Access control & decryption (v0.9)
FHE.allowThis(value) — contract may use value; grant after creating new ciphertexts.

FHE.allow(value, address) — allow address to decrypt (e.g. user or creator).

FHE.makePubliclyDecryptable(value) — allow anyone to request off-chain decryption (self-relaying).

FHE.checkSignatures(handles, cleartexts, proof) — verify decryption proof on-chain.

FHE.allowTransient(value) — allow use across call boundary (e.g. cross-contract).

v0.9 self-relaying flow
1. Contract: value = FHE.makePubliclyDecryptable(value); emit handle.

2. Client: publicDecrypt(handle) via Relayer SDK → cleartext + proof.

3. Client: call resolveCallback(..., abiEncodedCleartexts, proof).

4. Contract: FHE.checkSignatures(handles, cleartexts, proof); then use decoded values.
ACL (Access Control List)
FHEVM's permission system: who may decrypt or use an encrypted value. Managed with FHE.allowThis(), FHE.allow(), etc.
Ciphertext
Encrypted data. On FHEVM, encrypted types (euint8, ebool, etc.) are ciphertexts; operations run on them without decryption.
Handle
A bytes32 identifier for an encrypted value, used by the Relayer SDK and KMS for decryption requests (e.g. FHE.toBytes32(euint)).
Homomorphic operation
Computation on ciphertexts that yields an encrypted result (e.g. FHE.add(a, b) → encrypted sum).
KMS (Key Management Service)
Zama's off-chain service that holds decryption keys and produces decryption proofs. The Relayer SDK talks to it for publicDecrypt / userDecrypt.
Relayer SDK
Client-side library (@zama-fhe/relayer-sdk): createEncryptedInput, encrypt(), publicDecrypt(), userDecrypt(), and proof generation for v0.9 self-relaying.
Self-relaying (v0.9)
The dApp client performs off-chain decryption and submits cleartext + proof back on-chain. No general-purpose Oracle; FHE.checkSignatures verifies the proof.
Trivial encryption
Converting plaintext to encrypted type on-chain (e.g. FHE.asEuint32(0)). Used for constants and default values.
ZamaEthereumConfig
Contract inheritance that wires FHEVM to Zama's Ethereum infrastructure (replaces SepoliaConfig in v0.9).