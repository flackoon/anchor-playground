use anchor_lang::{prelude::*, solana_program::stake::state::{StakeStateV2, StakeState}};
use anchor_spl::stake::{Stake, StakeAccount};

#[error_code]
pub enum Error {
    #[msg("Required delegated stake")]
    RequiredDelegatedStake,
}

#[derive(Accounts)]
pub struct TakeStakeAccount<'info> {
    #[account(mut)]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

impl<'info> TakeStakeAccount<'info> {
    pub fn process(&mut self) -> Result<()> {
        let delegation = self.stake_account.delegation().ok_or_else(|| {
            error!(Error::RequiredDelegatedStake).with_account_name("stake_account")
        })?;

        msg!("Delegation amount {}", delegation.stake);

        Ok(())
    }
}
