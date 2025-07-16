import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// This logging is critical. Please check your server console for this output.
console.log("Twilio Account SID:", accountSid ? "Loaded" : "Missing");
console.log("Twilio Auth Token:", authToken ? "Loaded" : "Missing");
console.log("Twilio From Number:", fromNumber ? "Loaded" : "Missing");

const client = (accountSid && authToken && fromNumber) 
  ? twilio(accountSid, authToken) 
  : null;

if (!client) {
  console.error("Twilio client is not configured. Check environment variables.");
}

export interface SendSMSOptions {
  to: string;
  body: string;
  webhookUrl?: string;
}

export interface SMSResponse {
  sid: string;
  status: string;
  errorMessage?: string;
}

export async function sendSMS(to: string, body: string, webhookUrl?: string): Promise<SMSResponse> {
  if (!client || !fromNumber) {
    console.error("Twilio client or from-number is not available. SMS not sent.");
    return {
      sid: '',
      status: 'failed',
      errorMessage: 'Twilio credentials not configured.',
    };
  }

  // Normalize phone number to E.164 format
  const normalizedTo = formatPhoneNumber(to);
  console.log('Twilio sendSMS - original to:', to, '| normalized to:', normalizedTo);

  const message = await client.messages.create({
    from: fromNumber,
    to: normalizedTo,
    body: body,
    statusCallback: webhookUrl,
  });

  if (message.sid) {
    return {
      sid: message.sid,
      status: message.status,
    };
  } else {
    return {
      sid: '',
      status: 'failed',
      errorMessage: 'Failed to send message. No SID returned.',
    };
  }
}

export async function getMessageStatus(messageSid: string) {
  if (!client) {
    return {
      sid: messageSid,
      status: 'failed',
      errorMessage: 'Twilio credentials not configured',
    };
  }

  try {
    const message = await client.messages(messageSid).fetch();
    return {
      sid: message.sid,
      status: message.status,
      dateUpdated: message.dateUpdated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch message status: ${error.message}`);
  }
}

export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic E.164 format validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add +1 for US numbers if not present
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return phoneNumber; // Return as-is if it doesn't match expected patterns
}

export function extractMergeTags(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;
  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
}
