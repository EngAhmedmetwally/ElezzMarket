import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, language: 'ar' | 'en'): string {
    const numericValue = Number(value) || 0;
    if (language === 'ar') {
        const numberPart = new Intl.NumberFormat('ar-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numericValue);
        return `${numberPart} جنيه`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericValue);
}

export function formatPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return "";
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle numbers with 00 prefix
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Handle local Egyptian numbers starting with 0
  if (cleaned.startsWith('0')) {
    cleaned = `20${cleaned.substring(1)}`;
  } else if (!cleaned.startsWith('20') && cleaned.length === 10 && (cleaned.startsWith('10') || cleaned.startsWith('11') || cleaned.startsWith('12') || cleaned.startsWith('15'))) {
      // Handle mobile numbers missing country code
      cleaned = `20${cleaned}`;
  }
  
  return cleaned;
}
