# Deploy StudyPath to Railway

This repository is configured as one Railway web service: Docker builds the Vite app, then Express serves the frontend and `/api` from the same domain. Keep the Railway service root directory at the repository root (`/`) so it can see both folders and the root `Dockerfile`.

## 1. Add a Railway MySQL service

In the Railway project, add a MySQL database. In the StudyPath web service's Variables tab, add these references. Replace `MySQL` with the exact name of your database service if it differs:

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

## 2. Configure the web service

Connect this repository to a Railway service, with its root directory at `/`. Railway detects the root `Dockerfile`; it installs the frontend and backend dependencies, builds the frontend, and starts `backend/server.js`.

Set these service variables:

```env
NODE_ENV=production
JWT_SECRET=<long-random-secret>
CLIENT_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

Generate a public domain from the service's Networking settings. Configure the health check path as `/api/health`.

The frontend uses relative `/api` requests in production, so it shares the backend's Railway domain. `VITE_API_URL` is not needed for this single-service deployment.

## 3. Optional integrations

For Google OAuth, configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and:

```env
GOOGLE_CALLBACK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/api/auth/google/callback
```

Add that exact callback URL to the Google OAuth client's authorized redirect URIs. For email delivery, set the existing `EMAIL_*` variables. Phone OTP requires the Twilio variables documented in [backend/SMS_OTP.md](backend/SMS_OTP.md).

Do not copy local `.env` files into Railway or commit them. Configure production secrets in Railway's Variables tab.
