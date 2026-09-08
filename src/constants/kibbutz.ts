import { KibbutzJobCategory } from '../types';

export interface CategoryInfo {
  id: KibbutzJobCategory;
  label: string;
  emoji: string;
  description: string;
  defaultPay: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const KIBBUTZ_CATEGORIES: CategoryInfo[] = [
  {
    id: 'בייביסיטר',
    label: 'בייביסיטר',
    emoji: '👶',
    description: 'השגחה על ילדים, משחקים, סיוע בהשכבה',
    defaultPay: 50,
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-700',
  },
  {
    id: 'טיול עם הכלב',
    label: 'טיול עם הכלב',
    emoji: '🐕',
    description: 'הוצאת כלב לטיול קצר או ארוך בשבילי הקיבוץ',
    defaultPay: 40,
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
  },
  {
    id: 'טיפול בחתול',
    label: 'טיפול בחתול',
    emoji: '🐈',
    description: 'האכלה, החלפת מים וחול בזמן היעדרות מהקיבוץ',
    defaultPay: 35,
    badgeBg: 'bg-orange-50',
    badgeBorder: 'border-orange-200',
    badgeText: 'text-orange-800',
  },
  {
    id: 'עזרה בגינון או פינוי פסולת',
    label: 'עזרה בגינון או פינוי פסולת',
    emoji: '🌱',
    description: 'ניכוש עשבים, כיסוח דשא, פינוי גזם וענפים למכולה',
    defaultPay: 150,
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
  },
  {
    id: 'הובלה',
    label: 'הובלה',
    emoji: '📦',
    description: 'העברת רהיט, מוצרי חשמל או ארגזים ברחבי הקיבוץ',
    defaultPay: 120,
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-800',
  },
  {
    id: 'משלוח',
    label: 'משלוח',
    emoji: '🛵',
    description: 'איסוף חבילה מדואר/כלבו, הבאת תרופות או קניות',
    defaultPay: 40,
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-800',
  },
  {
    id: 'שטיפת כלים',
    label: 'שטיפת כלים',
    emoji: '🍽️',
    description: 'שטיפת כלים לאחר אירוח או ארוחה משפחתית',
    defaultPay: 80,
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
    badgeText: 'text-cyan-800',
  },
  {
    id: 'ניקיון',
    label: 'ניקיון',
    emoji: '🧹',
    description: 'ניקיון שבועי, שטיפת רצפות, שאיבת שטיחים וחלונות',
    defaultPay: 180,
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    badgeText: 'text-teal-800',
  },
  {
    id: 'סידור כביסה',
    label: 'סידור כביסה',
    emoji: '🧺',
    description: 'קיפול כביסה, תלייה, סידור בארונות הבגדים',
    defaultPay: 70,
    badgeBg: 'bg-violet-50',
    badgeBorder: 'border-violet-200',
    badgeText: 'text-violet-800',
  },
  {
    id: 'משהו אחר',
    label: 'משהו אחר',
    emoji: '✨',
    description: 'עבודות מגוונות, עזרה טכנולוגית, צביעה ועוד',
    defaultPay: 100,
    badgeBg: 'bg-slate-50',
    badgeBorder: 'border-slate-200',
    badgeText: 'text-slate-800',
  },
];

export const KIBBUTZ_LOCATIONS = [
  'שכונת הרחבה חדשה',
  'קיבוץ ישן',
  'הרחבה ישנה',
  'אזור חדר האוכל',
  'שכונת הצעירים',
  'מרכז הקיבוץ',
  'שכונת הוותיקים',
  'אזור המגרשים והבריכה',
  'אזור המזכירות והכלבו',
];

export function getCategoryMeta(categoryName?: string, title?: string, details?: string): CategoryInfo {
  if (categoryName) {
    const found = KIBBUTZ_CATEGORIES.find(c => c.id === categoryName || c.label === categoryName);
    if (found) return found;
  }

  const combined = ((title || '') + ' ' + (details || '')).toLowerCase();
  if (combined.includes('בייביסיטר') || combined.includes('ילד') || combined.includes('השגחה')) {
    return KIBBUTZ_CATEGORIES[0];
  }
  if (combined.includes('כלב') || combined.includes('טיול')) {
    return KIBBUTZ_CATEGORIES[1];
  }
  if (combined.includes('חתול') || combined.includes('חול') || combined.includes('להאכיל')) {
    return KIBBUTZ_CATEGORIES[2];
  }
  if (combined.includes('גינון') || combined.includes('דשא') || combined.includes('גזם') || combined.includes('פסולת') || combined.includes('גינה')) {
    return KIBBUTZ_CATEGORIES[3];
  }
  if (combined.includes('הובלה') || combined.includes('סבל') || combined.includes('ספה') || combined.includes('ארון') || combined.includes('להעביר')) {
    return KIBBUTZ_CATEGORIES[4];
  }
  if (combined.includes('משלוח') || combined.includes('חבילה') || combined.includes('דואר') || combined.includes('כלבו')) {
    return KIBBUTZ_CATEGORIES[5];
  }
  if (combined.includes('כלים') || combined.includes('שטיפת כלים') || combined.includes('סירים')) {
    return KIBBUTZ_CATEGORIES[6];
  }
  if (combined.includes('ניקיון') || combined.includes('לנקות') || combined.includes('חלונות') || combined.includes('שטיפה')) {
    return KIBBUTZ_CATEGORIES[7];
  }
  if (combined.includes('כביסה') || combined.includes('לקפל') || combined.includes('לתלות') || combined.includes('ארון')) {
    return KIBBUTZ_CATEGORIES[8];
  }

  return KIBBUTZ_CATEGORIES[9]; // משהו אחר
}
