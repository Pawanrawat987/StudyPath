class SmsConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SmsConfigurationError';
    this.code = 'SMS_NOT_CONFIGURED';
  }
}

async function sendSms({ to, message }) {
  assertSmsConfigured();
  const accountSid = process.env.SMS_API_KEY;
  const authToken = process.env.SMS_API_SECRET;
  const from = process.env.SMS_FROM;

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: from, To: to, Body: message }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const error = new Error('SMS provider rejected the message');
    error.code = 'SMS_PROVIDER_ERROR';
    error.status = response.status;
    throw error;
  }
}

function assertSmsConfigured() {
  const provider = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (!provider) {
    throw new SmsConfigurationError('Phone recovery is not configured. Set up an SMS provider on the server.');
  }
  if (provider !== 'twilio') {
    throw new SmsConfigurationError(`Unsupported SMS_PROVIDER "${provider}". Supported provider: twilio.`);
  }

  const accountSid = process.env.SMS_API_KEY;
  const authToken = process.env.SMS_API_SECRET;
  const from = process.env.SMS_FROM;
  if (!accountSid || !authToken || !from) {
    throw new SmsConfigurationError('Twilio SMS configuration is incomplete. Set SMS_API_KEY, SMS_API_SECRET, and SMS_FROM.');
  }
}

module.exports = { sendSms, assertSmsConfigured, SmsConfigurationError };
