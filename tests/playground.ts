import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";
import {PublicKey, Keypair, SystemProgram} from "@solana/web3.js"
import { getLogs } from "@solana-developers/helpers";

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

  it.only("accepts a PDA owned by the SystemProgram", async () => {
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
});
