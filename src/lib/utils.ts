import confetti from 'canvas-confetti';
import { Job } from '../types';

// Format currency
export function formatPayment(payment: number | string): string {
  if (typeof payment === 'number' || (!isNaN(Number(payment)) && payment !== '')) {
    return `${Number(payment).toLocaleString()} ₪`;
  }
  return String(payment);
}

// Format relative or friendly Hebrew date
export function formatHebrewDate(timestamp: any): string {
  if (!timestamp) return 'הרגע';
  
  let date: Date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return 'הרגע';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'לפני כמה שניות';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Generate structured WhatsApp share text
export function generateWhatsAppShareText(job: {
  id: string;
  title: string;
  location: string;
  payment: number | string;
  details?: string;
}): string {
  const appUrl = window.location.origin;
  const deepLink = `${appUrl}/?jobId=${job.id}`;
  const paymentFormatted = formatPayment(job.payment);

  const text = 
`⚡ *שלוש - ארבע: עבודה חדשה זמינה!* ⚡

🛠️ *מה לעשות:* ${job.title}
📍 *מיקום:* ${job.location}
💰 *תשלום מוצע:* ${paymentFormatted}
${job.details ? `📝 *פרטים נוספים:* ${job.details.slice(0, 100)}${job.details.length > 100 ? '...' : ''}\n` : ''}
🚀 *לקבלת העבודה עכשיו ב-שלוש-ארבע:*
🔗 ${deepLink}

_(כל הקודם זוכה - נלקח ישירות באפליקציה)_`;

  return text;
}

// Format clean phone for WhatsApp link
export function cleanPhoneForWhatsApp(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '972' + clean.slice(1);
  }
  return clean;
}

// Generate structured message when a worker claims a job to send directly to the creator via WhatsApp
export function generateClaimWhatsAppMessage(
  job: {
    title: string;
    location?: string;
    payment: number | string;
    details?: string;
    creatorName?: string;
  },
  worker: {
    fullName: string;
    phoneNumber: string;
    youthGroup?: string;
  }
): string {
  const paymentFormatted = formatPayment(job.payment);
  const creatorGreeting = job.creatorName ? `שלום ${job.creatorName} 👋` : `שלום 👋`;

  const lines: string[] = [
    creatorGreeting,
    `לקחתי את העבודה שפרסמת בלוח העבודות "שלוש - ארבע"! 🌟`,
    ``,
    `📌 *פרטי העבודה:*`,
    `• *עבודה:* ${job.title}`,
  ];

  if (job.location) {
    lines.push(`• *מיקום:* ${job.location}`);
  }
  if (paymentFormatted) {
    lines.push(`• *תשלום:* ${paymentFormatted}`);
  }
  if (job.details && job.details.trim()) {
    const cleanDetails = job.details.trim();
    lines.push(`• *פירוט:* ${cleanDetails}`);
  }

  lines.push(``);
  lines.push(`👤 *פרטי הלוקח/ת:*`);
  lines.push(`• *שם:* ${worker.fullName}`);
  lines.push(`• *טלפון:* ${worker.phoneNumber}`);
  if (worker.youthGroup) {
    lines.push(`• *שכבה / קבוצה:* ${worker.youthGroup}`);
  }

  lines.push(``);
  lines.push(`אשמח שנתאם את שעת ההגעה ופרטים נוספים. תודה רבה! 🙏`);

  return lines.join('\n');
}

// Generate WhatsApp direct URL for claiming worker to contact creator
export function getClaimWhatsAppUrl(
  job: {
    title: string;
    creatorPhone?: string;
    creatorName?: string;
    location?: string;
    payment: number | string;
    details?: string;
  },
  worker: {
    fullName: string;
    phoneNumber: string;
    youthGroup?: string;
  },
  customText?: string
): string {
  const cleanPhone = cleanPhoneForWhatsApp(job.creatorPhone || '');
  const text = customText || generateClaimWhatsAppMessage(job, worker);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// Generate WhatsApp direct URL
export function getWhatsAppShareUrl(job: {
  id: string;
  title: string;
  location: string;
  payment: number | string;
  details?: string;
}): string {
  const text = generateWhatsAppShareText(job);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

// Launch celebratory confetti
export function triggerCelebrationConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6']
  });
}
