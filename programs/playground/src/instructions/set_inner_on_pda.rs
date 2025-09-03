use anchor_lang::prelude::*;

#[account]
pub struct PdaData {
  number: u8
}

#[derive(Accounts)]
pub struct SetInnerOnPda<'info> {
  #[account(zero, rent_exempt = enforce)]
  pub pda_to_modify: Account<'info, PdaData>,

  #[account(mut)]
  pub signer: Signer<'info>,
}

// Prove that `set_inner` sets the discrimnator on the PDA to the sha256 hash of its struct name
impl<'info> SetInnerOnPda<'info> {
  pub fn process(&mut self) -> Result<()> {
    self.pda_to_modify.set_inner(PdaData { number: 222 });

    Ok(())
  }
}
