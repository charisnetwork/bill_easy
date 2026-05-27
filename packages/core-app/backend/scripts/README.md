# Admin Password Reset Scripts

## Quick Reset (Recommended)

If you've forgotten the admin password, use these scripts to reset it.

### Method 1: Node.js Script (Direct Database Update)

```bash
cd /path/to/bill-easy/backend

# Reset default admin (pachu.mgd@gmail.com) with default password
node scripts/resetAdminPassword.js

# Reset specific user with custom password
node scripts/resetAdminPassword.js user@example.com NewPassword123
```

**Default credentials after reset:**
- Email: `pachu.mgd@gmail.com`
- Password: `Admin@123456`

### Method 2: Generate SQL (For Manual Database Execution)

```bash
cd /path/to/bill-easy/backend

# Generate SQL for default password
node scripts/resetPasswordSQL.js

# Generate SQL with custom password
node scripts/resetPasswordSQL.js MyNewPassword123
```

Then copy the generated SQL and run it in your database console (e.g., Render Dashboard SQL shell, pgAdmin, or psql).

### Method 3: Using the "Forgot Password" Feature

The app has a built-in password reset via email:

1. Go to the login page
2. Click "Forgot Password?"
3. Enter your admin email
4. Check your email for the reset link
5. Set a new password

---

## Important Notes

1. **Change the default password immediately** after logging in for security.
2. The scripts require Node.js and access to the database (via environment variables).
3. Ensure `DATABASE_URL` or DB credentials are set in your `.env` file or environment.

## Troubleshooting

**"User not found" error:**
- The script will list all owner users in the database
- Use one of those emails or check your database directly

**Database connection error:**
- Verify your `DATABASE_URL` environment variable is set correctly
- For local development, check `.env` file has correct DB credentials
