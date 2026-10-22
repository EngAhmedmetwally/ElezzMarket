
'use server';

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
    // Basic implementation for a generic HTTP POST API (like UltraMsg, Twilio, etc.)
    // We try to infer the format from common providers or use a standard JSON post
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Construct the URL. Some APIs use query params, some use body.
    // For this prototype, we'll use a standard body-based POST request.
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Common pattern
      },
      body: JSON.stringify({
        token,
        to: cleanPhone,
        body: message,
        instanceId, // UltraMsg pattern
        message: message, // Twilio pattern
        receiver: cleanPhone,
      }),
    });

    const data = await response.json();

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
  // A test just tries to ping the endpoint or send a metadata request if supported.
  // Since we don't know the exact provider, we'll try a minimal request.
  try {
    const response = await fetch(config.endpoint, {
      method: 'GET', // Many APIs have a status check on GET
      headers: {
        'Authorization': `Bearer ${config.token}`,
      },
    });

    if (response.status === 404 || response.status === 200) {
      // 404 might just mean the GET isn't supported but the host exists
      return { success: true };
    }
    
    return { success: false, error: `Received status ${response.status} from API endpoint.` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
