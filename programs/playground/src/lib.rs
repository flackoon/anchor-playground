pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
// pub use state::*;

declare_id!("4MKdc95cTVyMffFKrigJcarnvCZzGXAjkNb8VF9ayeND");

#[program]
pub mod playground {
    use super::*;

    pub fn initialize_signer_and_payer(ctx: Context<InitializeSignerAndPayer>) -> Result<()> {
        initialize_signer_and_payer::handler(ctx)
    }

    pub fn initialize_zero_space(ctx: Context<InitializeSpaceZero>) -> Result<()> {
        ctx.accounts.process()
    }

    pub fn accept_pda_owned_by_system(ctx: Context<AcceeptPdaOwnedBySystem>) -> Result<()> {
        ctx.accounts.process(ctx.bumps.pda_account)
    }

    pub fn set_inner_on_pda(ctx: Context<SetInnerOnPda>) -> Result<()> {
        ctx.accounts.process()
    }

    pub fn take_stake_account(ctx: Context<TakeStakeAccount>) -> Result<()> {
        ctx.accounts.process()
    }
}
