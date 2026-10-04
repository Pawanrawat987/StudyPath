# Phone password recovery SMS setup

Phone recovery requires a real SMS provider. The backend supports Twilio through a small provider adapter and does not generate a successful response when SMS credentials are missing.

1. Create/configure a Twilio account and obtain an Account SID, Auth Token, and SMS-capable sender number.
2. Set these values in `backend/.env` (never commit real credentials):

   ```env
   SMS_PROVIDER=twilio
   SMS_API_KEY=your_twilio_account_sid
   SMS_API_SECRET=your_twilio_auth_token
   SMS_FROM=+1xxxxxxxxxx
   ```

3. Restart the backend. A phone number must be saved on the StudyPath account in international E.164 format (for example, `+919876543210`). New registrations can optionally provide it. Existing accounts need their phone number added to the `users.phone_number` column before phone recovery can find them.

Twilio trial accounts may restrict delivery to verified recipient numbers. Phone OTP codes expire after five minutes, allow at most five verification attempts, and have a 60-second resend cooldown. The raw OTP is sent only by SMS and is never stored or logged.
