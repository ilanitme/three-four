import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Job } from '../types';

export interface GreenApiConfig {
  idInstance: string;
  apiTokenInstance: string;
  hostUrl?: string; // default 'https://api.green-api.com' or 'https://7103.api.greenapi.com'
  chatId: string; // Group ID (e.g. 120363041234567890@g.us or phone number)
  groupName?: string;
  isEnabled: boolean;
  autoSendOnNewJob: boolean;
}

const DEFAULT_CONFIG: GreenApiConfig = {
  idInstance: '',
  apiTokenInstance: '',
  hostUrl: 'https://api.green-api.com',
  chatId: '',
  groupName: 'קבוצת נוער / עבודות בקיבוץ',
  isEnabled: false,
  autoSendOnNewJob: true,
};

// Helper with timeout
async function withTimeout<T>(promise: Promise<T>, ms: number = 2500, fallbackValue?: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue as T), ms);
  });
  return Promise.race([
    promise.then((res) => {
      clearTimeout(timer);
      return res;
    }),
    timeoutPromise,
  ]);
}

// Load configuration from Firestore and localStorage cache
export async function getGreenApiConfig(): Promise<GreenApiConfig> {
  try {
    const fetchPromise = getDoc(doc(db, 'app_settings', 'green_api'));
    const docSnap = await withTimeout(fetchPromise, 2000, null as any);
    if (docSnap && docSnap.exists()) {
      const data = docSnap.data() as Partial<GreenApiConfig>;
      const config = { ...DEFAULT_CONFIG, ...data };
      localStorage.setItem('three_four_green_api_config', JSON.stringify(config));
      return config;
    }
  } catch (err) {
    console.warn('Could not read Green API config from Firestore:', err);
  }

  try {
    const cached = localStorage.getItem('three_four_green_api_config');
    if (cached) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(cached) };
    }
  } catch {}

  return DEFAULT_CONFIG;
}

// Save configuration to Firestore and localStorage
export async function saveGreenApiConfig(config: GreenApiConfig): Promise<void> {
  // Always save to localStorage immediately
  try {
    localStorage.setItem('three_four_green_api_config', JSON.stringify(config));
  } catch (e) {
    console.warn('localStorage save failed', e);
  }

  // Save to Firestore with timeout so UI never blocks
  try {
    const savePromise = setDoc(doc(db, 'app_settings', 'green_api'), {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    await withTimeout(savePromise, 2000, undefined);
  } catch (err) {
    console.warn('Could not persist Green API config to Firestore:', err);
  }
}

// Format message for WhatsApp group
export function formatJobWhatsAppText(job: Job): string {
  const workersNeeded = Math.max(1, job.workersNeeded || 1);
  const workersText = workersNeeded > 1 ? `👥 *דרושים:* ${workersNeeded} נערים/עובדים\n` : '';
  const paymentText = job.payment ? `💰 *תשלום:* ${job.payment}${typeof job.payment === 'number' ? ' ₪' : ''}\n` : '';
  const locationText = job.location ? `📍 *שכונה/מיקום:* ${job.location}\n` : '';
  const categoryText = job.category ? `🏷️ *קטגוריה:* ${job.category}\n` : '';
  
  const origin = window.location.origin;
  const appLink = `${origin}/#job-${job.id}`;

  return `🔔 *עבודה חדשה בקיבוץ - שלוש, ארבע!*

📋 *${job.title}*
${categoryText}${locationText}${paymentText}${workersText}
📝 *פרטים:* ${job.details || 'ללא פירוט נוסף'}
👤 *מפרסם:* ${job.creatorName} (${job.creatorPhone})

🚀 *לחצו לתפיסת העבודה באפליקציה:*
${appLink}`;
}

// Get API base URL
function getApiUrl(config: GreenApiConfig, method: string): string {
  const host = (config.hostUrl || 'https://api.green-api.com').replace(/\/$/, '');
  const idInstance = config.idInstance.trim();
  const token = config.apiTokenInstance.trim();
  return `${host}/waInstance${idInstance}/${method}/${token}`;
}

// Send test message
export async function sendGreenApiTestMessage(
  config: GreenApiConfig,
  customMessage?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!config.idInstance || !config.apiTokenInstance || !config.chatId) {
    return { success: false, error: 'נא למלא את כל שדות החיבור (Instance ID, Token, ומזהה הקבוצה)' };
  }

  let cleanChatId = config.chatId.trim();
  // If user pasted a group invite code or partial ID, ensure suffix
  if (!cleanChatId.includes('@')) {
    cleanChatId = `${cleanChatId}@g.us`;
  }

  const message = customMessage || `👋 שלום! זוהי הודעת בדיקה מאפליקציית "שלוש - ארבע".\nהחיבור האוטומטי לקבוצת הקיבוץ הוגדר ופועל בהצלחה! 🟢`;

  try {
    const url = getApiUrl(config, 'sendMessage');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: cleanChatId,
        message,
      }),
    });

    const data = await res.json();
    if (res.ok && data.idMessage) {
      return { success: true, messageId: data.idMessage };
    } else {
      return { success: false, error: data.message || data.error || 'השרת של Green-API החזיר שגיאה' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'שגיאת רשת בחיבור ל-Green-API' };
  }
}

// Fetch list of chats/groups from Green-API to make selecting group easy
export async function fetchGreenApiChats(
  config: GreenApiConfig
): Promise<Array<{ id: string; name: string }>> {
  if (!config.idInstance || !config.apiTokenInstance) {
    throw new Error('חסרים פרטי התחברות (idInstance / apiTokenInstance)');
  }

  try {
    const url = getApiUrl(config, 'getChats');
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`שגיאה בשליפת צ'אטים: ${res.statusText}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data
        .filter((c: any) => c.id && (c.id.includes('@g.us') || c.id.includes('@c.us')))
        .map((c: any) => ({
          id: c.id,
          name: c.name || (c.id.includes('@g.us') ? 'קבוצת וואטסאפ' : 'צ\'אט פרטי'),
        }));
    }
    return [];
  } catch (err: any) {
    console.warn('fetchGreenApiChats error:', err);
    throw err;
  }
}

// Send automated job notification to group
export async function sendGreenApiJobNotification(job: Job): Promise<boolean> {
  const config = await getGreenApiConfig();
  if (!config.isEnabled || !config.autoSendOnNewJob || !config.idInstance || !config.apiTokenInstance || !config.chatId) {
    return false;
  }

  let cleanChatId = config.chatId.trim();
  if (!cleanChatId.includes('@')) {
    cleanChatId = `${cleanChatId}@g.us`;
  }

  const messageText = formatJobWhatsAppText(job);

  try {
    const url = getApiUrl(config, 'sendMessage');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: cleanChatId,
        message: messageText,
      }),
    });

    const data = await res.json();
    if (res.ok && data.idMessage) {
      console.log(`[Green API] Notification sent automatically to group ${cleanChatId}:`, data.idMessage);
      return true;
    } else {
      console.warn('[Green API] Send message warning:', data);
      return false;
    }
  } catch (err) {
    console.error('[Green API] Failed to send job notification:', err);
    return false;
  }
}
