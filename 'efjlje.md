


Demo Secrets (Fictional)
For documentation and local testing only. Every value below is fake.
Do not use these values in production, and never commit real credentials to Git.

1. Demo environment variables
# Application
APP_ENV=development
APP_PORT=3000
APP_BASE_URL=http://localhost:3000

# Database — fictional placeholder
DATABASE_URL=postgresql://demo_user:demo_password@localhost:5432/demo_db

# Authentication — fake value; replace locally with a securely generated key
JWT_SECRET=demo-only-not-a-real-secret-change-me

# Third-party API — intentionally invalid placeholder
PAYMENT_API_KEY=demo_test_key_1234567890
EMAIL_API_KEY=demo_email_key_not_valid
2. Demo JSON secret configuration
{
  "database": {
    "username": "demo_user",
    "password": "demo_password"
  },
  "auth": {
    "jwtSecret": "demo-only-not-a-real-secret-change-me"
  },
  "services": {
    "paymentApiKey": "demo_test_key_1234567890",
    "emailApiKey": "demo_email_key_not_valid"
  }
}
3. Demo cloud credentials
AWS_ACCESS_KEY_ID=AKIADEMOEXAMPLE000000
AWS_SECRET_ACCESS_KEY=DEMO_ONLY_NOT_A_REAL_AWS_SECRET
AWS_REGION=ap-south-1
These are illustrative strings, not valid AWS credentials.

4. Recommended handling
Keep real secrets in environment variables or a secrets manager.
Add .env, .env.* (except safe example files), and private key files to .gitignore.
Commit a .env.example containing placeholder values only.
Rotate any real secret that is accidentally committed or exposed.
Use least-privilege permissions for API keys and cloud credentials.
Never paste production secrets into logs, screenshots, issue trackers, or chat messages.
5. Example .gitignore
.env
.env.*
!.env.example
*.pem
*.key
secrets/




