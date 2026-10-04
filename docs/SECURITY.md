# Security Review Notes

## Controls present

- Passwords are hashed with bcrypt; plaintext passwords are not stored.
- JWT is sent in an HttpOnly cookie with a seven-day expiry. Cookie uses SameSite=Lax and Secure in production.
- Protected endpoints validate the signed token and reload the active user; role middleware restricts teacher/admin and student actions.
- Public registration always creates a student role, blocking client self-assignment of elevated roles.
- Student data operations scope revision, exam and attempt reads/writes to the current user.
- Quiz scores are calculated on the server; client-submitted score values are ignored.
- Student question and quiz responses omit answer keys/explanations; user responses omit password and sensitive token fields.
- Email verification and password reset persist hashed one-time tokens with expiry. These are emailed links, not numeric OTPs.
- Google OAuth state validation is enabled in the optional Passport integration.
- Vite build output and environment files are excluded by the current `.gitignore` rules.

## Configuration and deployment requirements

- Set a long unpredictable `JWT_SECRET`; do not use the `.env.example` placeholder.
- Set production `CLIENT_URL`, database credentials and cookie Secure behavior; serve over HTTPS.
- Restrict database network access and use a dedicated database account with only required privileges.
- Configure trusted SMTP and Google OAuth credentials through deployment secrets. Do not commit secrets or paste them into reports.
- Verify CORS origins and proxy targets match the deployed frontend/backend origins.
- Back up the database and use a reviewed migration process before schema changes.

## Known risks and follow-up

- Login currently does not enforce `emailVerified`; users can authenticate before verification. This is actual behavior and a policy decision for a future security change.
- Registration may create the user before SMTP failure is reported; this can leave an unverified account requiring resend/recovery.
- Startup schema helpers are additive, not a complete migration/versioning system.
- The observed physical schema has nullable FK columns and a missing `quizzes.topic_id` FK, reducing database-level integrity compared with model intent.
- Rate limiting, brute-force controls, CSRF-specific review, operational monitoring, dependency audit, and production penetration testing were not evidenced by this verification set; treat these as deployment/security review tasks rather than implemented claims.
- Third-party SMTP delivery and Google OAuth callback were not live-tested.

This document records observed controls and limitations. It is not a formal security certification.
