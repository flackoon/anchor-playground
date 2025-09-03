use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeSpaceZero<'info> {
    /// CHECK: no discriminator used
    #[account(
        init, // will ensure it is system account
        payer = rent_payer,
        space = 0,
        seeds = [b"duplication_flag"],
        bump,
    )]
    pub duplication_flag: UncheckedAccount<'info>,

    #[account(mut)]
    pub rent_payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}


/// Showcases a case where a PDA with 0 space and `init` constraint is used for the sole
/// purpose of existence check.
impl<'info> InitializeSpaceZero<'info> {
  pub fn process(&self) -> Result<()> {
    msg!("Account size: {}", self.duplication_flag.data.borrow().len());
    Ok(())
  }
}
