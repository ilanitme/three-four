import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Job } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Format Hebrew date/time for sheet
function formatHebrewDateTime(timestamp: any): string {
  if (!timestamp) return new Date().toLocaleString('he-IL');
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toLocaleString('he-IL');
  }
  if (typeof timestamp === 'string' || timestamp instanceof Date) {
    return new Date(timestamp).toLocaleString('he-IL');
  }
  return new Date().toLocaleString('he-IL');
}

// Translate job status to Hebrew label
function getJobStatusHebrew(status: string, registeredCount: number, neededCount: number): string {
  if (status === 'completed') return 'הושלם בהצלחה ✅';
  if (status === 'cancelled') return 'בוטל ❌';
  if (status === 'in_progress' || registeredCount >= neededCount) return 'בביצוע (מלא) 🔒';
  if (registeredCount > 0) return `נרשמו ${registeredCount}/${neededCount} (פנוי חלקית) ⏳`;
  return 'פנוי ללקיחה 🟢';
}

// Initialize Auth listener for Google Sheets
export function initGoogleSheetsAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
}

// Sign in with Google to get access token for Google Sheets API
export async function connectGoogleAccount(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('לא התקבל Access Token מחיבור גוגל');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export function getCachedAccessToken(): string | null {
  return cachedAccessToken;
}

// Get saved Spreadsheet ID and URL from Firestore or localStorage
export async function getSavedSpreadsheetInfo(): Promise<{ spreadsheetId: string | null; spreadsheetUrl: string | null }> {
  try {
    const configDoc = await getDoc(doc(db, 'app_settings', 'google_sheets'));
    if (configDoc.exists()) {
      const data = configDoc.data();
      const id = data?.spreadsheetId || localStorage.getItem('three_four_google_sheet_id') || null;
      const url = data?.spreadsheetUrl || (id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : null);
      if (id) localStorage.setItem('three_four_google_sheet_id', id);
      if (url) localStorage.setItem('three_four_google_sheet_url', url);
      return { spreadsheetId: id, spreadsheetUrl: url };
    }
  } catch (err) {
    console.warn('Firestore sheet config fetch notice:', err);
  }

  const localId = localStorage.getItem('three_four_google_sheet_id');
  const localUrl = localStorage.getItem('three_four_google_sheet_url') || (localId ? `https://docs.google.com/spreadsheets/d/${localId}/edit` : null);
  return { spreadsheetId: localId, spreadsheetUrl: localUrl };
}

// Get saved Spreadsheet ID from Firestore or localStorage
export async function getSavedSpreadsheetId(): Promise<string | null> {
  const info = await getSavedSpreadsheetInfo();
  return info.spreadsheetId;
}

// Set custom Google Sheet URL or ID directly from admin
export async function setCustomSpreadsheetUrl(rawInput: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  let trimmed = rawInput.trim();
  let spreadsheetId = trimmed;

  // Extract ID from full URL (e.g., https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...)
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    spreadsheetId = match[1];
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  await saveSpreadsheetId(spreadsheetId, spreadsheetUrl);
  return { spreadsheetId, spreadsheetUrl };
}

// Save Spreadsheet ID
export async function saveSpreadsheetId(spreadsheetId: string, url: string): Promise<void> {
  localStorage.setItem('three_four_google_sheet_id', spreadsheetId);
  localStorage.setItem('three_four_google_sheet_url', url);
  try {
    await setDoc(doc(db, 'app_settings', 'google_sheets'), {
      spreadsheetId,
      spreadsheetUrl: url,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not persist sheet ID to Firestore config:', err);
  }
}

// Create new Google Spreadsheet for Three-Four Kibbutz Jobs
export async function createJobsSpreadsheet(token: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const title = `שלוש - ארבע: יומן עבודות וגיבוי קיבוצי`;

  const headers = [
    'מזהה עבודה',
    'תאריך פרסום',
    'כותרת העבודה',
    'קטגוריה',
    'מיקום בקיבוץ',
    'תשלום (₪)',
    'עובדים דרושים',
    'עובדים שנרשמו (שם + טלפון)',
    'סטטוס נוכחי',
    'מפרסם המודעה',
    'טלפון מפרסם',
    'פרטי המודעה',
    'עודכן לאחרונה'
  ];

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
        locale: 'he_IL',
      },
      sheets: [
        {
          properties: {
            title: 'עבודות בקיבוץ',
            rightToLeft: true,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headers.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                      backgroundColor: { red: 0.06, green: 0.46, blue: 0.43 }, // Mediterranean Teal
                      horizontalAlignment: 'CENTER',
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || 'שגיאה ביצירת גיליון Google Sheets');
  }

  const sheetData = await res.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  await saveSpreadsheetId(spreadsheetId, spreadsheetUrl);
  return { spreadsheetId, spreadsheetUrl };
}

// Convert Job to Sheet Row format
function jobToSheetRow(job: Job): any[] {
  const registeredCount = Array.isArray(job.registeredWorkers) ? job.registeredWorkers.length : 0;
  const workersNeeded = Math.max(1, job.workersNeeded || 1);
  
  const workersString = Array.isArray(job.registeredWorkers) && job.registeredWorkers.length > 0
    ? job.registeredWorkers.map((w, idx) => `${idx + 1}. ${w.fullName} (${w.phoneNumber})`).join(' | ')
    : (job.workerName ? `${job.workerName} (${job.workerPhone || ''})` : 'אין עובדים רשומים');

  return [
    job.id || '',
    formatHebrewDateTime(job.createdAt),
    job.title || '',
    job.category || 'כללי',
    job.location || '',
    typeof job.payment === 'number' ? `${job.payment} ₪` : (job.payment || ''),
    workersNeeded,
    workersString,
    getJobStatusHebrew(job.status, registeredCount, workersNeeded),
    job.creatorName || '',
    job.creatorPhone || '',
    job.details || '',
    formatHebrewDateTime(job.updatedAt || job.createdAt),
  ];
}

// Export / Sync full jobs list into Google Sheets
export async function exportAllJobsToSheet(
  jobs: Job[],
  token: string,
  onProgress?: (msg: string) => void
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; syncedCount: number }> {
  if (onProgress) onProgress('בודק גיליון קיים...');

  let spreadsheetId = await getSavedSpreadsheetId();
  let spreadsheetUrl = spreadsheetId ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` : '';

  // If no spreadsheet exists, create one
  if (!spreadsheetId) {
    if (onProgress) onProgress('יוצר גיליון Google Sheets חדש עבור שלוש - ארבע...');
    const created = await createJobsSpreadsheet(token);
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl;
  }

  if (onProgress) onProgress(`מעדכן ${jobs.length} עבודות בגיליון...`);

  const headers = [
    'מזהה עבודה',
    'תאריך פרסום',
    'כותרת העבודה',
    'קטגוריה',
    'מיקום בקיבוץ',
    'תשלום (₪)',
    'עובדים דרושים',
    'עובדים שנרשמו (שם + טלפון)',
    'סטטוס נוכחי',
    'מפרסם המודעה',
    'טלפון מפרסם',
    'פרטי המודעה',
    'עודכן לאחרונה'
  ];

  const rows = [headers, ...jobs.map(jobToSheetRow)];

  // Clear existing sheet data and write fresh records
  const updateRange = 'עבודות בקיבוץ!A1:M' + Math.max(rows.length, 50);

  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: updateRange,
        majorDimension: 'ROWS',
        values: rows,
      }),
    }
  );

  // If error (e.g. sheet tab name mismatch), fallback to Sheet1!A1
  if (!writeRes.ok) {
    const fallbackRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:M${Math.max(rows.length, 50)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rows,
        }),
      }
    );

    if (!fallbackRes.ok) {
      // Create new sheet if original was deleted
      const recreated = await createJobsSpreadsheet(token);
      spreadsheetId = recreated.spreadsheetId;
      spreadsheetUrl = recreated.spreadsheetUrl;

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:M${Math.max(rows.length, 50)}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: rows,
          }),
        }
      );
    }
  }

  localStorage.setItem('three_four_last_sheets_sync', new Date().toISOString());

  return {
    spreadsheetId,
    spreadsheetUrl,
    syncedCount: jobs.length,
  };
}

// Background auto sync trigger (non-blocking)
export async function autoBackgroundSyncJobs(jobs: Job[]): Promise<void> {
  const token = getCachedAccessToken();
  if (!token || jobs.length === 0) return;

  try {
    await exportAllJobsToSheet(jobs, token);
    console.log(`[Google Sheets] Auto-synced ${jobs.length} jobs to Google Sheet.`);
  } catch (err: any) {
    console.warn('[Google Sheets] Background auto-sync notice:', err?.message);
  }
}

// Open Google Sheet directly (or prompt to initialize/sync if not yet created)
export async function openGoogleSpreadsheetDirectly(jobs: Job[] = []): Promise<void> {
  const info = await getSavedSpreadsheetInfo();
  if (info.spreadsheetUrl) {
    window.open(info.spreadsheetUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  if (info.spreadsheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${info.spreadsheetId}/edit`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // If no sheet created yet, initialize it
  try {
    let token = getCachedAccessToken();
    if (!token) {
      const authRes = await connectGoogleAccount();
      token = authRes.accessToken;
    }
    const result = await exportAllJobsToSheet(jobs, token);
    if (result.spreadsheetUrl) {
      window.open(result.spreadsheetUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err: any) {
    console.error('Error opening sheet directly:', err);
    alert(err?.message || 'שגיאה בפתיחת קובץ Google Sheet');
  }
}

// Generate CSV string representing all jobs with Hebrew column headers
export function generateJobsCsv(jobs: Job[]): string {
  const headers = [
    'מזהה עבודה',
    'תאריך פרסום',
    'כותרת העבודה',
    'קטגוריה',
    'מיקום בקיבוץ',
    'תשלום (₪)',
    'עובדים דרושים',
    'עובדים שנרשמו (שם + טלפון)',
    'סטטוס נוכחי',
    'מפרסם המודעה',
    'טלפון מפרסם',
    'פרטי המודעה',
    'עודכן לאחרונה'
  ];

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const cleanStr = String(val).replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ').replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = [
    headers.map(escapeCsv).join(','),
    ...jobs.map((job) => jobToSheetRow(job).map(escapeCsv).join(','))
  ];

  // UTF-8 BOM prefix (\uFEFF) to guarantee Excel, Numbers, and Google Sheets display Hebrew text perfectly
  return '\uFEFF' + rows.join('\r\n');
}

// Download CSV file directly to user device with 1 click
export function downloadJobsCsvFile(jobs: Job[], filename = 'יומן_עבודות_שלוש_ארבע.csv'): void {
  const csvContent = generateJobsCsv(jobs);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


