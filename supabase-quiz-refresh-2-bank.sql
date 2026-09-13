-- ===========================================================================
-- SOLANA QUEST 2 of 2 - BANK: 62 new questions
-- ===========================================================================
-- Project: qxejdpvjggqjqoydujjd.supabase.co   -   run in the SQL Editor
-- Requires supabase-quiz.sql to have been applied first.
--
-- FORMATTING, deliberately: zero single-quote characters, and zero semicolons
-- inside any text. Every string is dollar-quoted. An earlier version failed in
-- the SQL Editor with an error naming a word buried in an English sentence,
-- which means something between the editor and Postgres was losing track of
-- where string literals begin and end. This file gives it nothing to lose
-- track of. Running it twice is harmless.
-- ===========================================================================

-- Run supabase-quiz-refresh-1-core.sql FIRST. This file only adds questions.

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 4 — top up the bank
-- ═══════════════════════════════════════════════════════════════════════════
-- quiz_add takes the options with the CORRECT ANSWER FIRST, because that is
-- readable and reviewable, then shuffles before storing. Writing 60 questions
-- with hand-scattered indices is how you end up with a wrong key nobody
-- notices for a month.
--
-- Re-running is safe: a question whose exact text is already in the bank is
-- skipped, so the file can be replayed without duplicating anything.

create or replace function public.quiz_add(
  p_difficulty  int,
  p_category    text,
  p_question    text,
  p_options     jsonb,        -- correct answer FIRST
  p_explanation text
) returns uuid
language plpgsql
as $$
declare
  v_opts    text[];
  v_perm    text[];
  v_correct text;
  v_id      uuid;
begin
  if exists (select 1 from public.quiz_questions where question = p_question) then
    return null;
  end if;

  select array_agg(value order by ordinality) into v_opts
    from jsonb_array_elements_text(p_options) with ordinality;

  -- A wrong option count is caught by the CHECK on quiz_questions, which says
  -- so plainly enough. Raising here would need a format string, and this file
  -- deliberately contains no single quotes at all -- see the note in the header.

  v_correct := v_opts[1];
  select array_agg(o order by random()) into v_perm from unnest(v_opts) o;

  insert into public.quiz_questions
    (difficulty, category, question, options, correct_index, explanation)
  values
    (p_difficulty, p_category, p_question, to_jsonb(v_perm),
     array_position(v_perm, v_correct) - 1, p_explanation)
  returning id into v_id;

  return v_id;
end $$;


-- ── difficulty 1 · the ground floor ─────────────────────────────────────────

select public.quiz_add(1, $c$basics$c$, $q$How many lamports make one SOL?$q$,
  $o$["One billion","One million","One thousand","One hundred thousand"]$o$,
  $x$A billion, the same ratio as satoshis to bitcoin is not — bitcoin uses a hundred million. Fees are quoted in lamports because a signature costs 5,000 of them, which is easier to read than 0.000005 SOL.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What does a Solana wallet address actually encode?$q$,
  $o$["A public key","An email hash","A username","A bank routing number"]$o$,
  $x$The address is the base58 form of a 32-byte ed25519 public key. There is no registry behind it: valid addresses exist whether or not anyone has ever used them.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What is a Solana transaction signature used for?$q$,
  $o$["Identifying and looking up the transaction","Encrypting the transfer","Paying the fee","Naming the wallet"]$o$,
  $x$The first signature doubles as the transaction id. Paste it into an explorer and you get the whole transaction — which is why support requests always start with "send me the signature".$x$);

select public.quiz_add(1, $c$fees$c$, $q$Roughly what does a simple Solana transfer cost?$q$,
  $o$["A small fraction of a cent","About one dollar","About ten cents","It is free"]$o$,
  $x$The base fee is 5,000 lamports per signature — around a hundredth of a cent at most prices. Cheap fees are a design goal, not a promotion.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What is a validator on Solana?$q$,
  $o$["A computer that produces and verifies blocks","A wallet app","A type of token","An audit firm"]$o$,
  $x$Validators run the network: they vote on blocks, and in turn take the role of leader to produce them. Anyone can run one, though the hardware bar is high.$x$);

select public.quiz_add(1, $c$tokens$c$, $q$What makes an NFT different from a normal SPL token?$q$,
  $o$["Supply of one and no decimals","It is stored off-chain","It cannot be sold","It uses a different blockchain"]$o$,
  $x$An NFT is an ordinary token mint with supply 1 and 0 decimals, usually with its mint authority burned so no second copy can ever exist.$x$);

select public.quiz_add(1, $c$mobile$c$, $q$What is the Solana dApp Store?$q$,
  $o$["An app store for Solana apps on Saga and Seeker","A DEX","An NFT marketplace","A validator dashboard"]$o$,
  $x$It ships on Solana Mobile phones and takes no cut of in-app purchases, which is the whole argument for publishing there.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What is a devnet?$q$,
  $o$["A free test network with worthless tokens","A private company chain","The main network","An NFT collection"]$o$,
  $x$Devnet SOL is free from a faucet and worth nothing. Every serious app is tested there first, because a bug on mainnet costs real money.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What happens if you lose your seed phrase?$q$,
  $o$["The wallet is gone for good","Support can restore it","It regenerates after 30 days","The validator recovers it"]$o$,
  $x$There is no recovery path. The seed phrase is the wallet — this is the part of self-custody that people learn the expensive way.$x$);

select public.quiz_add(1, $c$ecosystem$c$, $q$What is a block explorer used for?$q$,
  $o$["Inspecting transactions and accounts on-chain","Mining SOL","Storing private keys","Writing programs"]$o$,
  $x$Explorers like Solscan and Solana Explorer read public chain state. They hold nothing of yours and cannot move anything.$x$);

select public.quiz_add(1, $c$tokens$c$, $q$What is a token mint address?$q$,
  $o$["The account that defines a token","Your token balance","The exchange listing","The wallet that bought it"]$o$,
  $x$The mint account holds the supply, decimals and authorities. Two tokens can share a name and logo, so the mint address is the only thing that identifies a token.$x$);

select public.quiz_add(1, $c$staking$c$, $q$What is the point of staking SOL?$q$,
  $o$["Helping secure the network and earning rewards","Faster transactions","Cheaper fees","A bigger airdrop"]$o$,
  $x$Stake backs a validator vote. Rewards come from inflation and are shared with delegators after the validator commission.$x$);

select public.quiz_add(1, $c$network$c$, $q$What is the leader in Solana consensus?$q$,
  $o$["The validator whose turn it is to produce a block","The largest staker","The founder","The block explorer"]$o$,
  $x$Leader slots are assigned by a schedule known in advance, weighted by stake. Knowing who is next is what lets clients forward transactions straight to them.$x$);

select public.quiz_add(1, $c$basics$c$, $q$How many transactions can fit in one Solana block?$q$,
  $o$["Thousands","Exactly one","About ten","About a hundred"]$o$,
  $x$Blocks are bounded by compute units rather than a transaction count, and routinely carry thousands. Parallel execution is what makes that possible.$x$);

select public.quiz_add(1, $c$mobile$c$, $q$What does a Seeker Genesis Token prove?$q$,
  $o$["That the holder owns a Seeker device","A validator stake","A DAO membership bought online","A completed KYC check"]$o$,
  $x$The SGT is minted to the phone and is what apps check when they want to gate something to real device owners. It is the anti-sybil primitive of the Solana Mobile stack.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What is an airdrop?$q$,
  $o$["Tokens distributed free to a set of wallets","A hardware wallet","A trading strategy","A validator reward"]$o$,
  $x$Projects use them to bootstrap users. On devnet the word also means the faucet command that hands you test SOL.$x$);

select public.quiz_add(1, $c$security$c$, $q$A site asks for your seed phrase to "verify your wallet". What is it?$q$,
  $o$["A scam, always","Standard KYC","A validator check","A wallet upgrade"]$o$,
  $x$No legitimate app ever needs the seed phrase. Signing a message proves ownership without revealing anything — which is exactly why the request itself is the red flag.$x$);

select public.quiz_add(1, $c$ecosystem$c$, $q$What is a DEX?$q$,
  $o$["An exchange that runs as on-chain programs","A hardware wallet","A block explorer","A validator client"]$o$,
  $x$A decentralised exchange settles trades through programs rather than a company holding your funds. You keep custody until the swap executes.$x$);

select public.quiz_add(1, $c$basics$c$, $q$What does it mean that a Solana transaction is atomic?$q$,
  $o$["Every instruction succeeds or none of them do","It is very small","It cannot be seen","It runs on one validator"]$o$,
  $x$A transaction can bundle many instructions across programs, and one failure rolls back the lot. That is what makes a swap-and-deposit safe to do in a single step.$x$);

select public.quiz_add(1, $c$tokens$c$, $q$Why do most tokens show a decimals value?$q$,
  $o$["Balances are stored as whole numbers","For price display only","To set the supply cap","It is the token age"]$o$,
  $x$On-chain balances are integers. Decimals says where to put the point, so 6 decimals means a stored 1,000,000 is one whole token.$x$);


-- ── difficulty 2 · you have used it ─────────────────────────────────────────

-- (The parallel-execution question is already in the bank at difficulty 3.)
select public.quiz_add(2, $c$accounts$c$, $q$What is a durable nonce used for?$q$,
  $o$["Signing a transaction that stays valid beyond the usual window","Making fees cheaper","Hiding the sender","Speeding up confirmation"]$o$,
  $x$A normal transaction expires with its blockhash after about a minute. A nonce account substitutes a stored value for that blockhash, which is how offline and multisig signing flows survive the wait for the last signature.$x$);

select public.quiz_add(2, $c$fees$c$, $q$What is a priority fee on Solana?$q$,
  $o$["An extra fee per compute unit to be scheduled sooner","A tax on large transfers","The staking commission","A fee paid to the DEX"]$o$,
  $x$When a block is contested the base fee is the same for everyone, so the priority fee is the tiebreaker. Wallets raise it automatically during congestion.$x$);

select public.quiz_add(2, $c$accounts$c$, $q$What is a PDA?$q$,
  $o$["An address derived from a program with no private key","A hardware wallet standard","A DAO proposal","A staking pool"]$o$,
  $x$A Program Derived Address sits off the ed25519 curve, so no key can sign for it — only its owning program can. That is how a program holds funds nobody can withdraw behind its back.$x$);

select public.quiz_add(2, $c$tokens$c$, $q$What does burning the mint authority achieve?$q$,
  $o$["The supply can never be increased","It deletes the token","It locks all transfers","It doubles the supply"]$o$,
  $x$Setting the mint authority to none makes the supply permanently fixed. Checking it is the first thing to do before believing a claimed hard cap.$x$);

select public.quiz_add(2, $c$network$c$, $q$What does a transaction blockhash do?$q$,
  $o$["Expires the transaction after a short window","Encrypts the payload","Pays the fee","Sets the priority"]$o$,
  $x$A recent blockhash makes the transaction valid for roughly a minute. It stops a signed transaction from being replayed weeks later, and it is why a stale one fails with "blockhash not found".$x$);

select public.quiz_add(2, $c$staking$c$, $q$What is a stake account epoch warm-up?$q$,
  $o$["New stake becomes active only from the next epoch","A fee discount period","A validator trial","A cooldown on rewards"]$o$,
  $x$Stake activates and deactivates on epoch boundaries, roughly every two to three days. It is why unstaking is never instant.$x$);

select public.quiz_add(2, $c$ecosystem$c$, $q$What problem do compressed NFTs solve?$q$,
  $o$["The cost of minting at large scale","Slow image loading","Wallet compatibility","Royalty enforcement"]$o$,
  $x$State compression keeps the data in a Merkle tree with only the root on-chain, cutting the cost of a large collection by orders of magnitude.$x$);

select public.quiz_add(2, $c$security$c$, $q$What does signing a message prove?$q$,
  $o$["Control of the private key, without spending anything","That you paid a fee","That the wallet is verified","That you own an NFT"]$o$,
  $x$It is an off-chain signature, free and non-transactional. The danger is the neighbouring pattern: a transaction dressed up as a login, so read what the wallet is actually asking you to approve.$x$);

select public.quiz_add(2, $c$accounts$c$, $q$Who pays for the space a new account occupies?$q$,
  $o$["Whoever creates it, as a refundable rent-exempt deposit","The validator","Nobody, storage is free","The Solana Foundation"]$o$,
  $x$The deposit scales with the account size and comes back in full when the account is closed. Storage is rented, not bought.$x$);

select public.quiz_add(2, $c$network$c$, $q$What is an epoch on Solana?$q$,
  $o$["A period of about two to three days","One block","Exactly 24 hours","One year"]$o$,
  $x$An epoch is roughly 432,000 slots. Stake changes, the leader schedule and reward payouts all move on epoch boundaries.$x$);

select public.quiz_add(2, $c$tokens$c$, $q$What can Token-2022 do that the original SPL Token program cannot?$q$,
  $o$["Transfer fees and confidential transfers","Run on other chains","Store images on-chain","Skip the fee entirely"]$o$,
  $x$Token-2022 adds optional extensions: transfer hooks, interest bearing balances, non-transferable tokens and more. Wallets must opt into supporting them, so adoption lags the capability.$x$);

select public.quiz_add(2, $c$mobile$c$, $q$Why does Mobile Wallet Adapter exist?$q$,
  $o$["So an app can request a signature without ever seeing the key","To speed up transactions","To store NFT images","To replace the dApp Store"]$o$,
  $x$MWA hands the transaction to the wallet app, which signs it in its own process. The requesting app receives a signed transaction and nothing else.$x$);

select public.quiz_add(2, $c$defi$c$, $q$What is slippage in a swap?$q$,
  $o$["The gap between the quoted and the executed price","The network fee","The staking reward","The time to confirm"]$o$,
  $x$Price moves between quote and execution. A slippage tolerance sets how much of that you will accept before the swap simply fails instead.$x$);

select public.quiz_add(2, $c$accounts$c$, $q$What does it mean that a Solana program is upgradeable?$q$,
  $o$["An authority can replace its code","Users vote on changes","It updates itself daily","Anyone can edit it"]$o$,
  $x$The upgrade authority can deploy new code to the same address. Handing that authority to nobody makes the program immutable — worth checking before trusting one with funds.$x$);

select public.quiz_add(2, $c$network$c$, $q$What is a compute unit?$q$,
  $o$["The budget that limits work in a transaction","A validator machine","A staking metric","A block reward"]$o$,
  $x$Each transaction gets a compute budget, and exceeding it aborts the transaction. Complex DeFi routes have to request a raised limit up front.$x$);

select public.quiz_add(2, $c$ecosystem$c$, $q$What is an oracle in this context?$q$,
  $o$["A service bringing off-chain data on-chain","A wallet backup","A validator ranking","A type of NFT"]$o$,
  $x$Programs cannot call the outside world, so oracles like Pyth publish prices on-chain for them to read. The oracle is therefore part of the trust model of anything that uses it.$x$);

select public.quiz_add(2, $c$security$c$, $q$What is a common sign of a drainer transaction?$q$,
  $o$["It requests authority over your token accounts","It has a high fee","It takes a long time","It comes from a DEX"]$o$,
  $x$Look for approvals and authority changes rather than transfers. A drainer usually asks for permission to move assets later, which reads as harmless in the moment.$x$);

select public.quiz_add(2, $c$defi$c$, $q$What is an AMM?$q$,
  $o$["A pool that prices trades by a formula, not an order book","A mobile wallet","An audit method","A validator client"]$o$,
  $x$Automated market makers hold reserves and quote from a curve. Liquidity providers earn fees and carry the impermanent loss that comes with it.$x$);

select public.quiz_add(2, $c$basics$c$, $q$What is the difference between finalized and confirmed?$q$,
  $o$["Finalized is backed by supermajority votes and will not revert","Confirmed is slower","They are the same","Finalized means the fee is paid"]$o$,
  $x$Confirmed is fast and almost always right, while finalized is the stronger guarantee. Exchanges wait for finalized before crediting a deposit for exactly that reason.$x$);

select public.quiz_add(2, $c$mobile$c$, $q$What does Seed Vault give an app that a software wallet cannot?$q$,
  $o$["Keys held in the phone secure element","Faster confirmations","Free transactions","Automatic staking"]$o$,
  $x$The key never leaves hardware. An app asks for a signature and the secure element returns one, so a compromised app still cannot extract the key.$x$);

select public.quiz_add(2, $c$tokens$c$, $q$Why might a token transfer fail with no associated token account?$q$,
  $o$["The recipient has no account for that mint yet","The token is frozen","The network is down","The amount is too small"]$o$,
  $x$Each token needs its own account per owner. The sender usually pays the small rent to create it, which is why a first-time transfer costs slightly more.$x$);

select public.quiz_add(2, $c$history$c$, $q$What was the Solana Saga?$q$,
  $o$["The first Solana crypto phone","A DeFi protocol","An NFT collection","A validator client"]$o$,
  $x$Released in 2023, it sold slowly until an airdrop made the bundled token worth more than the handset. It sold out, and the Seeker followed.$x$);


-- ── difficulty 3 · you have read the docs ───────────────────────────────────

select public.quiz_add(3, $c$network$c$, $q$What does Proof of History actually produce?$q$,
  $o$["A verifiable ordering of events before consensus","A hash of the block reward","A validator ranking","A random number"]$o$,
  $x$A sequential VDF hash chain proves that time passed between two events. Validators can then agree on order without exchanging timestamps, which is where the throughput comes from.$x$);

select public.quiz_add(3, $c$accounts$c$, $q$What is an address lookup table for?$q$,
  $o$["Fitting more accounts into one transaction","Naming wallets","Caching prices","Indexing NFTs"]$o$,
  $x$A transaction is capped at 1,232 bytes. Lookup tables replace 32-byte addresses with one-byte indices, which is what makes long DeFi routes fit at all.$x$);

select public.quiz_add(3, $c$network$c$, $q$What is Turbine?$q$,
  $o$["The block propagation protocol","The fee market","A wallet standard","The staking program"]$o$,
  $x$Turbine splits a block into packets and fans them out through a tree of validators, so the leader does not have to send the whole block to everyone.$x$);

select public.quiz_add(3, $c$network$c$, $q$What is Gulf Stream?$q$,
  $o$["Forwarding transactions to upcoming leaders before their slot","A bridge to Ethereum","An NFT standard","A validator client"]$o$,
  $x$Because the leader schedule is known ahead of time, clients push transactions to the next leaders early. Solana has no traditional mempool as a result.$x$);

select public.quiz_add(3, $c$fees$c$, $q$Where does the base transaction fee go?$q$,
  $o$["Half burned, half to the leader","All to the leader","All burned","To the Solana Foundation"]$o$,
  $x$The burn ties the fee to SOL scarcity, while the leader half pays for the work. Priority fees now go entirely to the validator.$x$);

select public.quiz_add(3, $c$accounts$c$, $q$What is the rent-exempt threshold based on?$q$,
  $o$["The size of the account in bytes","The token balance","The account age","The number of transactions"]$o$,
  $x$It is two years of rent for that byte size, held as a deposit. Every practical account is created rent-exempt, so rent collection is effectively historical.$x$);

select public.quiz_add(3, $c$staking$c$, $q$What is validator commission?$q$,
  $o$["The share of rewards the validator keeps","A fee on delegating","A slashing penalty","The stake minimum"]$o$,
  $x$Delegators receive rewards minus the commission. It can be changed by the operator, so a low advertised rate is a promise rather than a guarantee.$x$);

select public.quiz_add(3, $c$network$c$, $q$What is a fork in Solana consensus?$q$,
  $o$["Competing chains before votes settle on one","A software release","A wallet backup","A token split"]$o$,
  $x$Forks happen constantly at the tip and resolve as votes accumulate. Tower BFT applies increasing lockouts so validators cannot flip between them freely.$x$);

select public.quiz_add(3, $c$accounts$c$, $q$What does the owner field of an account hold?$q$,
  $o$["The program allowed to modify it","Your wallet address","The token mint","The creator name"]$o$,
  $x$Owner means the owning program, not a person. Your SOL account is owned by the System Program, and your token accounts by the Token program.$x$);

select public.quiz_add(3, $c$ecosystem$c$, $q$What is Anchor?$q$,
  $o$["A Rust framework for writing Solana programs","A bridge","A wallet","A stablecoin"]$o$,
  $x$Anchor handles account validation, serialisation and the IDL. It removes most of the boilerplate where security bugs used to live.$x$);

select public.quiz_add(3, $c$security$c$, $q$What is a signer check and why does it matter?$q$,
  $o$["Verifying the expected account actually signed","Checking the fee","Validating the blockhash","Confirming the token balance"]$o$,
  $x$A missing signer check lets anyone substitute a different account and act as its owner. It is one of the most common and most expensive Solana program bugs.$x$);

select public.quiz_add(3, $c$network$c$, $q$What is QUIC used for on Solana?$q$,
  $o$["Transaction ingestion into validators","Storing NFT metadata","Block explorers","Wallet connections"]$o$,
  $x$Validators moved transaction intake from raw UDP to QUIC so connections can be identified and rate-limited by stake, which blunts spam.$x$);

select public.quiz_add(3, $c$defi$c$, $q$What is a flash loan?$q$,
  $o$["A loan borrowed and repaid inside one transaction","A loan with fast approval","A staking derivative","A margin account"]$o$,
  $x$Atomicity is the collateral: if the repayment instruction does not succeed, the whole transaction reverts and the loan never happened.$x$);

select public.quiz_add(3, $c$tokens$c$, $q$What is a transfer hook in Token-2022?$q$,
  $o$["A program invoked on every transfer","A fee discount","A metadata field","A staking bonus"]$o$,
  $x$The hook lets an issuer enforce rules — allowlists, royalties, compliance — at transfer time. It also means the token can stop working if the hook program misbehaves.$x$);

select public.quiz_add(3, $c$network$c$, $q$What is the maximum size of a Solana transaction?$q$,
  $o$["1,232 bytes","4 kilobytes","64 kilobytes","There is no limit"]$o$,
  $x$The cap follows the IPv6 MTU minus headers, so a transaction always fits in one packet. It is the constraint that address lookup tables exist to work around.$x$);

select public.quiz_add(3, $c$staking$c$, $q$What is a liquid staking token?$q$,
  $o$["A tradable receipt for staked SOL","A stablecoin","A governance NFT","A validator licence"]$o$,
  $x$Tokens like mSOL and jitoSOL represent stake you can still trade or lend, at the cost of trusting the issuing protocol on top of the validator.$x$);

select public.quiz_add(3, $c$history$c$, $q$What did the September 2021 Solana outage stem from?$q$,
  $o$["Transaction flood exhausting validator memory","A consensus bug in voting","A hacked validator","An exchange failure"]$o$,
  $x$A bot storm during a token launch pushed validators out of memory and the network needed a coordinated restart. Later releases added fee markets and QUIC to make a repeat harder.$x$);

select public.quiz_add(3, $c$accounts$c$, $q$What is a cross-program invocation?$q$,
  $o$["One program calling another within a transaction","A bridge between chains","A wallet handshake","A validator vote"]$o$,
  $x$CPI lets programs compose, with signing authority carried through for PDAs. Depth is capped at four to keep the runtime bounded.$x$);

select public.quiz_add(3, $c$ecosystem$c$, $q$What does Jito add to a standard validator?$q$,
  $o$["A block engine and MEV tips shared with stakers","Free transactions","NFT minting","A wallet"]$o$,
  $x$Jito runs an auction for block space and returns tips to stakers. It moves MEV from an invisible advantage to a priced, visible market.$x$);

select public.quiz_add(3, $c$mobile$c$, $q$Why is a device-bound token like SGT useful against sybil attacks?$q$,
  $o$["One real device cannot cheaply become a thousand wallets","It hides the wallet address","It blocks bots at the network level","It requires a passport"]$o$,
  $x$Wallets are free and infinite. Phones are not. Binding a reward to hardware raises the cost of faking a thousand users to the cost of a thousand handsets.$x$);

-- Report the bank. answer_on_a should be roughly a quarter of each tier.
select difficulty,
       count(*)                                  as in_bank,
       count(*) filter (where correct_index = 0) as answer_on_a
  from public.quiz_questions
 where active
 group by difficulty
 order by difficulty;
