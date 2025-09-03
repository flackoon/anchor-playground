use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeSignerAndPayer<'info> {
    #[account(
        init,
        signer,
        payer = payer,
        space = 8 + PoolConfig::INIT_SPACE
    )]
    pub config: AccountLoader<'info, PoolConfig>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Prove that an account cannot have the `signer` and `init` constraints at the same time.
pub fn handler(ctx: Context<InitializeSignerAndPayer>) -> Result<()> {
    let mut config = ctx.accounts.config.load_init()?;

    config.token_decimal = 9;

    Ok(())
}

#[account(zero_copy)]
#[derive(InitSpace)]
pub struct PoolConfig {
    /// token decimals
    pub token_decimal: u8,
}
