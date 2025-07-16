import axios from 'axios';

const apiKey = process.env.SHORTIO_API_KEY;
const domain = process.env.SHORTIO_DOMAIN || 'short.io';

if (!apiKey) {
  console.warn('SHORTIO_API_KEY not provided. Short link functionality will be limited.');
}

export interface CreateShortLinkOptions {
  originalUrl: string;
  title?: string;
  customPath?: string;
}

export interface ShortLinkResponse {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  success: boolean;
  error?: string;
}

export async function createShortLink(options: CreateShortLinkOptions): Promise<ShortLinkResponse> {
  if (!apiKey) {
    // Fallback to simple short code generation
    const shortCode = generateShortCode();
    return {
      shortUrl: `https://sms.ly/${shortCode}`,
      shortCode,
      originalUrl: options.originalUrl,
      success: true,
    };
  }

  try {
    const response = await axios.post('https://api.short.io/links', {
      originalURL: options.originalUrl,
      domain: domain,
      path: options.customPath,
      title: options.title,
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    const shortCode = data.shortURL.split('/').pop();

    return {
      shortUrl: data.shortURL,
      shortCode,
      originalUrl: options.originalUrl,
      success: true,
    };
  } catch (error: any) {
    console.error('Short.io API error:', error.response?.data || error.message);
    
    // Fallback to simple short code generation
    const shortCode = generateShortCode();
    return {
      shortUrl: `https://sms.ly/${shortCode}`,
      shortCode,
      originalUrl: options.originalUrl,
      success: true,
    };
  }
}

export async function getLinkStats(shortCode: string) {
  if (!apiKey) {
    return { clicks: 0, error: 'API key not configured' };
  }

  try {
    const response = await axios.get(`https://api.short.io/links/expand?shortURL=https://${domain}/${shortCode}`, {
      headers: {
        'Authorization': apiKey,
      },
    });

    return {
      clicks: response.data.clicks || 0,
      originalUrl: response.data.originalURL,
    };
  } catch (error: any) {
    console.error('Short.io stats error:', error.response?.data || error.message);
    return { clicks: 0, error: error.message };
  }
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function extractLinksFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export function replaceLinksWithShortLinks(text: string, linkMap: Map<string, string>): string {
  let result = text;
  for (const [originalUrl, shortUrl] of linkMap) {
    result = result.replace(originalUrl, shortUrl);
  }
  return result;
}
