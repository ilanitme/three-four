export type JobStatus = 'new' | 'in_progress' | 'completed' | 'cancelled';

export type KibbutzJobCategory = 
  | 'בייביסיטר'
  | 'טיול עם הכלב'
  | 'טיפול בחתול'
  | 'עזרה בגינון או פינוי פסולת'
  | 'הובלה'
  | 'משלוח'
  | 'שטיפת כלים'
  | 'ניקיון'
  | 'סידור כביסה'
  | 'משהו אחר';

export interface JobCoordinates {
  lat: number;
  lng: number;
}

export type YouthGroup = 'שכבת י (כרם)' | 'שכבת יא (לוטם)' | 'שכבת יב (יער)' | 'אחר / כללי';

export interface UserProfile {
  uid: string;
  fullName: string;
  phoneNumber: string;
  isPhoneVerified?: boolean;
  isLookingForJob?: boolean;
  youthGroup?: YouthGroup | string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  createdAt: any;
}

export interface FeedbackReview {
  id: string;
  jobId: string;
  jobTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  role: 'creator' | 'worker'; // Role of the reviewer
  rating: number; // 1 to 5
  comment: string;
  createdAt: any;
}

export interface JobWorkerRegistration {
  uid: string;
  fullName: string;
  phoneNumber: string;
  ratingAverage?: number;
  youthGroup?: string;
  registeredAt: any;
  status?: 'registered' | 'selected' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Job {
  id: string;
  title: string;
  details: string;
  location: string;
  category?: KibbutzJobCategory | string;
  coordinates?: JobCoordinates | null;
  payment: number | string;
  status: JobStatus;
  creatorId: string;
  creatorName: string;
  creatorPhone: string;
  creatorRating?: number;
  // Multi-worker support
  workersNeeded: number; // default 1
  registeredWorkers: JobWorkerRegistration[];
  registeredWorkerIds: string[];
  // Legacy / primary worker fields
  workerId: string | null;
  workerName: string | null;
  workerPhone: string | null;
  workerRating?: number;
  createdAt: any;
  updatedAt: any;
}

export type AppTab = 'feed' | 'post' | 'dashboard';
export type DashboardSubTab = 'posted' | 'claimed' | 'reviews';

