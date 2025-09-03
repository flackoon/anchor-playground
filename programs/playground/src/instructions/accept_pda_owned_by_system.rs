use anchor_lang::{
  prelude::*,
  solana_program::{
    program::invoke_signed,
    system_instruction
  },
};

#[derive(Accounts)]
pub struct AcceeptPdaOwnedBySystem<'info> {
  #[account(
    mut,
    seeds = [b"random_seed"],
    bump,
  )]
  pub pda_account: SystemAccount<'info>,

  #[account(mut)]
  pub signer: Signer<'info>,

  pub system_program: Program<'info, System>
}

// Prove that this program can sign instructions on behalf of a PDA account derived from
// itself but owned by the SystemProgram.
impl<'info> AcceeptPdaOwnedBySystem<'info> {
  pub fn process(&self, pda_account_bump: u8) -> Result<()> {
    assert_eq!(self.pda_account.owner, &Pubkey::from_str_const("11111111111111111111111111111111"));

    msg!("PDA account lamports balance: {}", self.pda_account.to_account_info().lamports.borrow());

    let transfer_instruction = system_instruction::transfer(
        &self.pda_account.key(),
        &self.signer.key(),
        100,
    );

    // Invoke the transfer instruction with PDA signing
    invoke_signed(
        &transfer_instruction,
        &[
            self.pda_account.to_account_info(),
            self.signer.to_account_info(),
            self.system_program.to_account_info(),
        ],
        &[&[b"random_seed".as_ref(), &[pda_account_bump]]],
    )?;

    msg!("Transferred 100 lamports to signer");

    Ok(())
  }
}
