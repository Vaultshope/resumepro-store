# Security Policy

## Reporting a Vulnerability

If you discover a security issue in this repository, please email the maintainer directly instead of opening a public issue.

## Sensitive Data

This storefront contains hardcoded configuration values in `index.html` for wallet addresses, contact email, and seller password. Before pushing to a public repository:

- Replace the placeholder wallet address with your own USDT (BEP-20) wallet
- Change the seller password from the default value
- Update the contact email address
- Consider moving these values to a separate local config file excluded by `.gitignore`

Never commit real wallet private keys, API keys, or other credentials to version control.
