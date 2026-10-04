# Google OAuth local setup

1. In Google Cloud Console, create an OAuth 2.0 Client ID with application type **Web application**.
2. Add this **Authorized JavaScript origin**:

   `http://localhost:5173`

3. Add this **Authorized redirect URI**:

   `http://localhost:5000/api/auth/google/callback`

4. Put the generated client ID and client secret in `backend/.env`. Set:

   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

5. Restart the backend, then use **Continue with Google** on the login page.

The client secret stays in the backend environment. The OAuth state is kept in a short-lived, HttpOnly, same-site session cookie. Successful authentication creates the same JWT cookie used by email/password login and redirects to `CLIENT_URL/dashboard`.
