import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";
import {PublicKey, Keypair, SystemProgram, StakeProgram, LAMPORTS_PER_SOL, Authorized, Lockup, Connection} from "@solana/web3.js"
import { getLogs } from "@solana-developers/helpers";
import { expect } from "chai";

describe("playground", () => {
  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.playground as Program<Playground>;

  it("initializing an account that is also signer", async () => {
    // Add your test here.
    const tx = await program.methods.initializeSignerAndPayer().rpc();
    console.log("Your transaction signature", tx);
  });

  it("initializing an account with space = 0", async () => {
    let tx = await program.methods.initializeZeroSpace().rpc();

    const logs = await getLogs(provider.connection, tx)
    console.log(logs)

    tx = await program.methods.initializeZeroSpace().rpc();
  })

  it("accepts a PDA owned by the SystemProgram", async () => {
    // Derive the PDA address using seeds and our Program ID
    const [pdaAccount, _] = PublicKey.findProgramAddressSync(
      [Buffer.from("random_seed")],
      program.programId
    );

    // Send SOL to the PDA
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: provider.wallet.payer.publicKey,
      toPubkey: pdaAccount,
      lamports: 1_000_000_000,
    });
    const transaction = new anchor.web3.Transaction().add(transferInstruction);
    await provider.sendAndConfirm(
      transaction,
      [provider.wallet.payer],
      {commitment: "confirmed"}
    );

    const tx = await program.
      methods.
      acceptPdaOwnedBySystem().
      accountsPartial({pdaAccount})
      .rpc();

    const logs = await getLogs(provider.connection, tx);
    console.log(logs);
  });

  it("sets inner data on a PDA", async () => {
    const pdaToModify = Keypair.generate()
    const pdaSize = 8 + 1;

    let tx = new anchor.web3.Transaction();
    tx.add(SystemProgram.createAccount({
      fromPubkey: provider.wallet.payer.publicKey,
      newAccountPubkey: pdaToModify.publicKey,
      lamports: await provider.connection.getMinimumBalanceForRentExemption(pdaSize),
      space: pdaSize,
      programId: program.programId,
    }));
    await provider.sendAndConfirm(tx, [provider.wallet.payer, pdaToModify], {commitment: "confirmed"});

    let pdaAccountInfo = await provider.connection.getAccountInfo(pdaToModify.publicKey)
    console.log("(before) PDA DATA: ", pdaAccountInfo.data)

    tx = new anchor.web3.Transaction();
    tx.add(await program.methods.setInnerOnPda().accounts({
      pdaToModify: pdaToModify.publicKey,
      signer: provider.wallet.publicKey
    }).instruction());

    await provider.sendAndConfirm(tx, [provider.wallet.payer], {commitment: "confirmed"});

    pdaAccountInfo = await provider.connection.getAccountInfo(pdaToModify.publicKey)
    console.log("(after)  PDA DATA: ", pdaAccountInfo.data)
  });

  it.only("passes StakeAccount(StakeStateV2) account when StakeAccount(StakeState) is expected", async () => {
    const payer = provider.wallet.payer;
    const airdropSignature = await provider.connection.requestAirdrop(payer.publicKey, 3 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdropSignature, "confirmed");

    // Generate keypair for the new stake account
    const stakeAccount = Keypair.generate();

    // Minimum lamports for rent exemption (~0.002 SOL) + staking amount
    const minimumRent = await provider.connection.getMinimumBalanceForRentExemption(
      StakeProgram.space // 200 bytes for stake account
    );
    const lamportsToStake = minimumRent + LAMPORTS_PER_SOL; // 1 SOL for staking + rent

    const createStakeAccountTx = new anchor.web3.Transaction().add(
      StakeProgram.createAccount({
        fromPubkey: payer.publicKey,
        stakePubkey: stakeAccount.publicKey,
        authorized: new Authorized(payer.publicKey, payer.publicKey), // Staker and withdrawer
        lockup: new Lockup(0, 0, payer.publicKey), // No lockup
        lamports: lamportsToStake,
      })
    );
    await provider.sendAndConfirm(createStakeAccountTx, [payer, stakeAccount], {commitment: "confirmed"});

    console.log("Stake account created:", stakeAccount.publicKey.toString());

    // Verify the stake account
    const stakeAccountInfo = await provider.connection.getAccountInfo(stakeAccount.publicKey);
    expect(stakeAccountInfo).to.not.be.null;
    expect(stakeAccountInfo!.lamports).to.equal(lamportsToStake);
    expect(stakeAccountInfo!.owner.toString()).to.equal(StakeProgram.programId.toString());

    // @warn: You'll need to update the validator vote pubkey here
    const votePubkey = new PublicKey("2SgDcG461vFoKH1HytNRYmzua5GeEVKBCbmZ6CXQuDBE");
    const delegateTx = new anchor.web3.Transaction().add(
      StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: payer.publicKey,
        votePubkey,
      }),
    );

    let delegateTxSig
    try {
      delegateTxSig = await provider.sendAndConfirm(delegateTx, [payer], {commitment: "confirmed"});
    } catch (err) {
      const logs = await getLogs(provider.connection, delegateTxSig);
      console.log(logs);
    }

    console.log("Stake account delegated:", stakeAccount.publicKey.toString());

    const tx = await program.methods
      .takeStakeAccount()
      .accounts({stakeAccount: stakeAccount.publicKey})
      .rpc();

    const logs = await getLogs(provider.connection, tx);
    console.log(logs);
  })
});
