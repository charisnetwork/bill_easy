# Super Admin Password Reset

This folder contains scripts to reset the **Super Admin** password for the Admin Control Center (`admin.charisbilleasy.store`).

> ⚠️ **Important**: This is for the **SaaS Admin Panel** only, not for regular user accounts.

## 🔐 Default Login Credentials

After a fresh deployment, the default credentials are:
- **URL**: https://admin.charisbilleasy.store
- **Email**: `pachu.mgd@gmail.com`
- **Password**: `nishu@143`

If you've changed the password and forgotten it, use the methods below.

---

## Method 1: Node.js Script (Recommended)

Run this on your server where the admin backend is deployed:

```bash
cd admin/backend
npm install  # if not already done

# Reset with default password (Admin@2026)
node scripts/resetSuperAdminPassword.js

# Or with custom password
node scripts/resetSuperAdminPassword.js pachu.mgd@gmail.com MyNewPass123
```

**Requirements:**
- `DATABASE_URL_ADMIN` environment variable must be set
- Node.js must have access to the admin database

---

## Method 2: SQL Direct Execution

Generate the SQL and run it directly in your database:

```bash
cd admin/backend

# Generate SQL with default password
node scripts/generateResetSQL.js

# Generate SQL with custom password
node scripts/generateResetSQL.js MyNewPass123
```

Then copy the generated SQL and run it in your **admin database** (e.g., using psql, pgAdmin, or Render Dashboard SQL shell).

### Example SQL Output:
```sql
UPDATE "AdminUsers" SET 
  password_hash = '$2b$10$...',
  is_active = true,
  updated_at = NOW()
WHERE email = 'pachu.mgd@gmail.com';
```

---

## Database Information

The admin panel uses a **separate database** from the main SaaS app:

| Database | Purpose | Default Name |
|----------|---------|--------------|
| SaaS DB | User accounts, invoices, companies | `mybillbook` |
| Admin DB | Super admin users, affiliates, platform expenses | `mybillbook_admin` |

### Environment Variables:
```bash
# Main SaaS database
DATABASE_URL=postgres://user:pass@host:5432/mybillbook

# Admin database (separate!)
DATABASE_URL_ADMIN=postgres://user:pass@host:5432/mybillbook_admin
```

---

## Troubleshooting

### "Admin user not found"
The script will list all available admin users. Use one of those emails, or the script will create a default admin if none exist.

### "Database connection failed"
- Check `DATABASE_URL_ADMIN` is set correctly
- Verify PostgreSQL is running and accessible
- Check network/firewall settings

### "Permission denied"
Ensure the database user has UPDATE permissions on the `AdminUsers` table.

---

## Security Notes

1. **No Self-Service Forgot Password**: The admin panel intentionally doesn't have a "Forgot Password" feature for security. Use these scripts instead.

2. **Change Default Password**: After resetting, immediately change the password to something secure.

3. **Keep Admin DB Separate**: Never share the admin database credentials with the main app.
