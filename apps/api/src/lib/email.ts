import { config } from '../config.js';

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (config.mockEmail) {
    console.info(`[mock-email] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  if (!config.brevoApiKey) throw new Error('BREVO_API_KEY is required');
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': config.brevoApiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: { name: config.emailFromName, email: config.emailFrom }, to: [{ email: to }], subject, textContent: text }),
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status})`);
}
