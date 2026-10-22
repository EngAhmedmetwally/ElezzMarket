
'use server';

import { formatPhoneNumberForWhatsApp } from "@/lib/utils";

/**
 * Server Action to proxy WhatsApp API requests.
 * This keeps API tokens secure and avoids CORS issues.
 */
export async function sendWhatsAppMessage(config: {
  endpoint: string;
  token: string;
  instanceId?: string;
  phone: string;
  message: string;
}) {
  const { endpoint, token, instanceId, phone, message } = config;

  if (!endpoint || !token || !phone || !message) {
    return { success: false, error: 'Missing required configuration or recipient data' };
  }

  try {
    // Standardize phone number format for common WhatsApp APIs (e.g. 2010...)
    const cleanPhone = formatPhoneNumberForWhatsApp(phone);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token, // Some APIs use token in body
        to: cleanPhone, // Standard
        body: message,
        instanceId, // UltraMsg pattern
        message: message, // Twilio pattern
        receiver: cleanPhone, // Generic pattern
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      return { success: true, data };
    } else {
      return { 
        success: false, 
        error: data.error || data.message || `API Error: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error: any) {
    console.error('WhatsApp API Proxy Error:', error);
    return { success: false, error: error.message || 'Network error occurred while calling WhatsApp API' };
  }
}

/**
 * Special test function to verify connectivity
 */
export async function testWhatsAppConnection(config: {
  endpoint: string;
  token: string;
  instanceId?: string;
}) {
  try {
    // Minimal check: Send a standard HEAD/GET request or a generic ping if supported.
    // Since providers vary, we just check if the endpoint is reachable.
    const response = await fetch(config.endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
    });

    // 200, 401 (unauthorized), or 405 (method not allowed) all imply the server is alive and reachable.
    if (response.status < 500) {
      return { success: true };
    }
    
    return { success: false, error: `Received status ${response.status} from API endpoint.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
