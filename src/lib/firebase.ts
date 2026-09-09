import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  updateProfile,
  createUserWithEmailAndPassword,
  User
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  updateDoc, 
  deleteDoc, 
  addDoc
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Job, UserProfile, FeedbackReview, KibbutzJobCategory } from '../types';

// Support both Vercel/Vite environment variables and local firebase-applet-config.json
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Suppress non-critical backend connection warnings in console
try {
  setLogLevel('error');
} catch {}

// Initialize Firestore with robust connection settings and support for undefined fields
let dbInstance;
try {
  const customConfig = firebaseConfigJson as any;
  const dbId = (customConfig.firestoreDatabaseId && customConfig.firestoreDatabaseId !== '(default)')
    ? customConfig.firestoreDatabaseId
    : undefined;
  
  if (dbId) {
    dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true }, dbId);
  } else {
    dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
} catch {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

// Format Israeli phone numbers nicely (e.g., 052-1234567)
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('05')) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return phone;
}

// Clean phone digits for uniform index lookup
export function cleanPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

// Helper to prevent promises from hanging if Firestore is newly created or offline
export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500, fallbackValue: T): Promise<T> {
  let timeoutHandle: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve(fallbackValue);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return result;
  } catch (err) {
    clearTimeout(timeoutHandle);
    return fallbackValue;
  }
}

// Ensure an authenticated Firebase session exists or fallback to persistent local ID
export async function ensureAuthUser(): Promise<{ uid: string; displayName?: string | null }> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  try {
    const userPromise = signInAnonymously(auth).then(cred => cred.user);
    const user = await withTimeout(userPromise, 2000, null);
    if (user) return user;
  } catch (err: any) {
    console.warn('Anonymous auth unavailable, using persistent client identity:', err?.code || err?.message);
  }

  let fallbackUid = localStorage.getItem('quickjobs_fallback_uid');
  if (!fallbackUid) {
    fallbackUid = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('quickjobs_fallback_uid', fallbackUid);
  }
  return { uid: fallbackUid, displayName: null };
}

// Helper to check if a user has admin privileges strictly from users document (IsAdmin / isAdmin == true)
export function isUserAdmin(user: UserProfile | any | null | undefined): boolean {
  if (!user) return false;
  return user.isAdmin === true || user.IsAdmin === true || user.role === 'admin';
}

// Persistent cookie helpers for cross-session and link visits (e.g. from WhatsApp links)
export function setPersistentUserCookie(uid: string, phone: string) {
  try {
    if (typeof document !== 'undefined') {
      const cleanPhone = cleanPhoneDigits(phone);
      document.cookie = `three_four_uid=${encodeURIComponent(uid)}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `three_four_phone=${encodeURIComponent(cleanPhone)}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch {}
}

export function getPersistentUserCookie(): { uid?: string; phone?: string } | null {
  try {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);
    if (cookies.three_four_uid || cookies.three_four_phone) {
      return { uid: cookies.three_four_uid, phone: cookies.three_four_phone };
    }
  } catch {}
  return null;
}

export function clearPersistentUserCookie() {
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `three_four_uid=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `three_four_phone=; path=/; max-age=0; SameSite=Lax`;
    }
  } catch {}
}

// User Registration with Phone verification (Unique doc per clean phone)
export async function registerUser(
  fullName: string, 
  phoneNumber: string, 
  password: string,
  extraData?: {
    isLookingForJob?: boolean;
    youthGroup?: string;
  }
): Promise<UserProfile> {
  const cleanPhone = cleanPhoneDigits(phoneNumber);
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const userUid = `usr_${cleanPhone}`;

  // Check if phone number is already registered in users collection
  try {
    const existingDoc = await withTimeout(getDoc(doc(db, 'users', userUid)), 2000, null as any);
    if (existingDoc && existingDoc.exists()) {
      throw new Error('מספר טלפון זה כבר רשום במערכת. לחץ על כניסה לחשבון כדי להתחבר');
    }

    const usersRef = collection(db, 'users');
    const q1 = query(usersRef, where('phoneNumber', '==', formattedPhone));
    const snap1 = await withTimeout(getDocs(q1), 2000, null as any);
    if (snap1 && !snap1.empty) {
      throw new Error('מספר טלפון זה כבר רשום במערכת. לחץ על כניסה לחשבון כדי להתחבר');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('כבר רשום')) {
      throw err;
    }
  }

  // Ensure Firebase Auth session
  await ensureAuthUser();
  if (auth.currentUser) {
    updateProfile(auth.currentUser, { displayName: fullName.trim() }).catch(() => {});
  }

  const profile: UserProfile = {
    uid: userUid,
    fullName: fullName.trim(),
    phoneNumber: formattedPhone,
    isPhoneVerified: true,
    isLookingForJob: extraData?.isLookingForJob ?? false,
    youthGroup: (extraData?.isLookingForJob && extraData?.youthGroup) ? extraData.youthGroup : undefined,
    role: 'user',
    isAdmin: false,
    ratingAverage: 5.0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
  };

  // Prepare clean document for Firestore (strictly no undefined fields)
  const firestoreUserPayload: Record<string, any> = {
    uid: userUid,
    fullName: fullName.trim(),
    phoneNumber: formattedPhone,
    cleanPhone: cleanPhone,
    isPhoneVerified: true,
    isLookingForJob: Boolean(extraData?.isLookingForJob),
    youthGroup: (extraData?.isLookingForJob && extraData?.youthGroup) ? extraData.youthGroup : '',
    role: 'user',
    isAdmin: false,
    ratingAverage: 5.0,
    ratingCount: 0,
    password: password || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Write user document to Firestore users collection
  try {
    const userDocRef = doc(db, 'users', userUid);
    await setDoc(userDocRef, firestoreUserPayload, { merge: true });
    console.log('[Firestore] Successfully created user in users/' + userUid);

    // Also sync to auth currentUser UID doc if different, to ensure auth listener finds it
    if (auth.currentUser?.uid && auth.currentUser.uid !== userUid) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          ...firestoreUserPayload,
          originalUid: userUid,
        }, { merge: true });
      } catch (authDocErr) {
        console.warn('Auth UID alias doc write warning:', authDocErr);
      }
    }
  } catch (err: any) {
    console.error('Firestore write users error:', err);
    throw new Error('שגיאה ביצירת המשתמש במסד הנתונים: ' + (err?.message || 'אנא נסה שנית'));
  }

  // 2. Optionally attempt to register in Firebase Auth for Console Users view
  try {
    const syntheticEmail = `${cleanPhone}@threefour.kibbutz`;
    await createUserWithEmailAndPassword(auth, syntheticEmail, password).catch(() => {});
  } catch {}

  // 3. Save to local storage and persistent cookie for cross-session/link persistence
  try {
    localStorage.setItem('quickjobs_active_user', JSON.stringify(profile));
    localStorage.setItem(`phone_user_${cleanPhone}`, JSON.stringify({ ...profile, password }));
    setPersistentUserCookie(profile.uid, cleanPhone);
  } catch {}

  return profile;
}

// Update existing User Profile (e.g., toggle looking for job, group, or admin)
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', userId);
  
  // Update Firestore
  try {
    await setDoc(userDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore update profile queued:', err);
  }

  // Update active user in localStorage
  let updatedUser: UserProfile;
  try {
    const localRaw = localStorage.getItem('quickjobs_active_user');
    const existing = localRaw ? JSON.parse(localRaw) : {};
    updatedUser = { ...existing, ...updates, uid: userId };
    localStorage.setItem('quickjobs_active_user', JSON.stringify(updatedUser));
  } catch {
    updatedUser = { uid: userId, ...updates } as UserProfile;
  }

  return updatedUser;
}

// User Login by Phone & Password (Direct users collection query)
export async function loginUser(phoneNumber: string, password: string): Promise<UserProfile> {
  const cleanPhone = cleanPhoneDigits(phoneNumber);
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const userUid = `usr_${cleanPhone}`;

  let userData: any = null;

  // 1. Direct O(1) fetch by ID
  try {
    const directDoc = await withTimeout(getDoc(doc(db, 'users', userUid)), 2000, null as any);
    if (directDoc && directDoc.exists()) {
      userData = { uid: directDoc.id, ...directDoc.data() };
    }
  } catch (err) {
    console.warn('Direct user lookup warning:', err);
  }

  // 2. Query fallback if not found by direct doc ID
  if (!userData) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', formattedPhone));
      const snap = await withTimeout(getDocs(q), 2000, null as any);
      if (snap && !snap.empty) {
        const docSnap = snap.docs[0];
        userData = { uid: docSnap.id, ...docSnap.data() };
      }
    } catch (err) {
      console.warn('Query user lookup warning:', err);
    }
  }

  // 3. Fallback to localStorage
  if (!userData) {
    const localRaw = localStorage.getItem(`phone_user_${cleanPhone}`) || localStorage.getItem(`phone_auth_${cleanPhone}`);
    if (localRaw) {
      userData = JSON.parse(localRaw);
    }
  }

  if (!userData) {
    throw new Error('מספר הטלפון אינו קיים במערכת. אנא בצע הרשמה');
  }

  if (userData.password && userData.password !== password) {
    throw new Error('הסיסמה שהוזנה שגויה');
  }

  // Ensure Firebase Auth session
  await ensureAuthUser();
  if (auth.currentUser) {
    updateProfile(auth.currentUser, { displayName: userData.fullName }).catch(() => {});
  }

  const isAdmin = isUserAdmin(userData);

  const profile: UserProfile = {
    uid: userData.uid || userUid,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    isPhoneVerified: true,
    isLookingForJob: userData.isLookingForJob ?? false,
    youthGroup: userData.youthGroup,
    role: isAdmin ? 'admin' : (userData.role || 'user'),
    isAdmin: isAdmin,
    ratingAverage: userData.ratingAverage || 5.0,
    ratingCount: userData.ratingCount || 0,
    createdAt: userData.createdAt || new Date().toISOString(),
  };

  // Save session locally and in cookie
  try {
    localStorage.setItem('quickjobs_active_user', JSON.stringify(profile));
    setPersistentUserCookie(profile.uid, cleanPhone);
  } catch {}

  return profile;
}

// Get saved user session on app boot
export function getSavedUserSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem('quickjobs_active_user');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

// User Logout
export async function logoutUser(): Promise<void> {
  try {
    localStorage.removeItem('quickjobs_active_user');
    localStorage.removeItem('quickjobs_fallback_uid');
    clearPersistentUserCookie();
    await signOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Get User Profile from Firestore
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    let docData: any = null;
    let docId = uid;
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      docData = userDoc.data();
      docId = userDoc.id;
    } else if (!uid.startsWith('usr_')) {
      const altDoc = await getDoc(doc(db, 'users', `usr_${uid}`));
      if (altDoc.exists()) {
        docData = altDoc.data();
        docId = altDoc.id;
      }
    }
    if (docData) {
      const isAdmin = isUserAdmin(docData);
      return {
        ...docData,
        uid: docId,
        isAdmin,
        role: isAdmin ? 'admin' : (docData.role || 'user'),
      } as UserProfile;
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
  }
  return null;
}

// Submit Rating and Review
export async function submitFeedbackReview(reviewData: {
  jobId: string;
  jobTitle: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  role: 'creator' | 'worker';
  rating: number;
  comment: string;
}): Promise<string> {
  await ensureAuthUser();

  const reviewsRef = collection(db, 'reviews');
  const newReviewDoc = await addDoc(reviewsRef, {
    jobId: reviewData.jobId,
    jobTitle: reviewData.jobTitle,
    fromUserId: reviewData.fromUserId,
    fromUserName: reviewData.fromUserName,
    toUserId: reviewData.toUserId,
    toUserName: reviewData.toUserName,
    role: reviewData.role,
    rating: reviewData.rating,
    comment: reviewData.comment.trim(),
    createdAt: serverTimestamp(),
  });

  // Update recipient's rating statistics in users collection
  try {
    const toUserRef = doc(db, 'users', reviewData.toUserId);
    const toUserSnap = await getDoc(toUserRef);
    if (toUserSnap.exists()) {
      const userData = toUserSnap.data();
      const currentCount = userData.ratingCount || 0;
      const currentAvg = userData.ratingAverage || 5.0;
      const newCount = currentCount + 1;
      const newAvg = Number(((currentAvg * currentCount + reviewData.rating) / newCount).toFixed(1));

      await updateDoc(toUserRef, {
        ratingAverage: newAvg,
        ratingCount: newCount,
      });
    }
  } catch (err) {
    console.error('Error updating user rating stats:', err);
  }

  return newReviewDoc.id;
}

// Fetch reviews for a specific job
export async function fetchJobReviews(jobId: string): Promise<FeedbackReview[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('jobId', '==', jobId));
    const snap = await getDocs(q);
    const reviews: FeedbackReview[] = [];
    snap.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as FeedbackReview);
    });
    return reviews;
  } catch (err) {
    console.error('Error fetching job reviews:', err);
    return [];
  }
}

// Fetch all reviews received by a user
export async function fetchUserReviews(userId: string): Promise<FeedbackReview[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('toUserId', '==', userId));
    const snap = await getDocs(q);
    const reviews: FeedbackReview[] = [];
    snap.forEach((docSnap) => {
      reviews.push({ id: docSnap.id, ...docSnap.data() } as FeedbackReview);
    });
    // Sort newest first
    reviews.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    return reviews;
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    return [];
  }
}

// Subscribe to all jobs (for admin live sync & sheets backup)
export function subscribeAllJobs(callback: (jobs: Job[]) => void) {
  const jobsRef = collection(db, 'jobs');
  return onSnapshot(jobsRef, (snapshot) => {
    const jobs: Job[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      jobs.push({
        id: docSnap.id,
        ...data,
      } as Job);
    });
    jobs.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    callback(jobs);
  }, (err) => {
    console.warn('Firestore all-jobs listener notice:', err?.message);
  });
}

// Subscribe to available jobs (status == 'new')
export function subscribeAvailableJobs(callback: (jobs: Job[]) => void) {
  const jobsRef = collection(db, 'jobs');
  const q = query(
    jobsRef,
    where('status', '==', 'new')
  );

  return onSnapshot(q, (snapshot) => {
    const jobs: Job[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      jobs.push({
        id: docSnap.id,
        ...data,
      } as Job);
    });
    jobs.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    
    // Cache available jobs locally
    try {
      localStorage.setItem('quickjobs_cached_available', JSON.stringify(jobs));
    } catch {}

    callback(jobs);
  }, (err) => {
    console.warn('Firestore jobs listener notice:', err?.message);
    // Fallback to locally cached jobs if available
    try {
      const cached = localStorage.getItem('quickjobs_cached_available');
      if (cached) {
        callback(JSON.parse(cached));
      }
    } catch {}
  });
}

// Subscribe to jobs created by user
export function subscribeUserPostedJobs(userId: string, callback: (jobs: Job[]) => void) {
  const jobsRef = collection(db, 'jobs');
  const q = query(
    jobsRef,
    where('creatorId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const jobs: Job[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      jobs.push({
        id: docSnap.id,
        ...data,
      } as Job);
    });
    jobs.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    callback(jobs);
  }, (err) => {
    console.error('Error subscribing to user posted jobs:', err);
  });
}

// Subscribe to jobs claimed/registered by user
export function subscribeUserClaimedJobs(userId: string, callback: (jobs: Job[]) => void) {
  const jobsRef = collection(db, 'jobs');
  
  // We listen to jobs where user is in registeredWorkerIds array
  const qArray = query(
    jobsRef,
    where('registeredWorkerIds', 'array-contains', userId)
  );

  // We also listen to legacy workerId query to ensure 100% backward compatibility
  const qLegacy = query(
    jobsRef,
    where('workerId', '==', userId)
  );

  let arrayJobs: Job[] = [];
  let legacyJobs: Job[] = [];

  const mergeAndEmit = () => {
    const jobMap = new Map<string, Job>();
    arrayJobs.forEach(j => jobMap.set(j.id, j));
    legacyJobs.forEach(j => jobMap.set(j.id, j));

    const combined = Array.from(jobMap.values());
    combined.sort((a, b) => {
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
    callback(combined);
  };

  const unsubArray = onSnapshot(qArray, (snapshot) => {
    arrayJobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Job));
    mergeAndEmit();
  }, (err) => {
    console.error('Error in registeredWorkerIds snapshot:', err);
  });

  const unsubLegacy = onSnapshot(qLegacy, (snapshot) => {
    legacyJobs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Job));
    mergeAndEmit();
  }, (err) => {
    console.error('Error in legacy workerId snapshot:', err);
  });

  return () => {
    unsubArray();
    unsubLegacy();
  };
}

// Fetch single job by ID
export async function fetchJobById(jobId: string): Promise<Job | null> {
  try {
    const docRef = doc(db, 'jobs', jobId);
    const snap = await withTimeout(getDoc(docRef), 1800, null as any);
    if (snap && snap.exists()) {
      return { id: snap.id, ...snap.data() } as Job;
    }
  } catch (err) {
    console.warn('fetchJobById warning:', err);
  }

  // Check local cache
  try {
    const cached = localStorage.getItem('quickjobs_cached_available');
    if (cached) {
      const list: Job[] = JSON.parse(cached);
      const found = list.find((j) => j.id === jobId);
      if (found) return found;
    }
  } catch {}

  return null;
}

// Create new Job with multi-worker support
export async function createJob(jobData: {
  title: string;
  category?: KibbutzJobCategory | string;
  details: string;
  location: string;
  coordinates?: { lat: number; lng: number } | null;
  payment: number | string;
  workersNeeded?: number;
  creatorId: string;
  creatorName: string;
  creatorPhone: string;
  creatorRating?: number;
}): Promise<string> {
  await ensureAuthUser();

  const jobsRef = collection(db, 'jobs');
  const newJobDoc = doc(jobsRef);
  
  const workersNeeded = Math.max(1, Number(jobData.workersNeeded) || 1);

  const newJobPayload = {
    title: jobData.title.trim(),
    category: jobData.category || null,
    details: jobData.details.trim(),
    location: jobData.location.trim(),
    coordinates: jobData.coordinates || null,
    payment: jobData.payment,
    workersNeeded,
    registeredWorkers: [],
    registeredWorkerIds: [],
    status: 'new',
    creatorId: jobData.creatorId,
    creatorName: jobData.creatorName,
    creatorPhone: jobData.creatorPhone,
    creatorRating: jobData.creatorRating || 5.0,
    workerId: null,
    workerName: null,
    workerPhone: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // 1. Optimistically cache locally so it appears in UI immediately
  try {
    const cached = localStorage.getItem('quickjobs_cached_available');
    const list: Job[] = cached ? JSON.parse(cached) : [];
    const optimisticJob: Job = {
      id: newJobDoc.id,
      ...newJobPayload,
      createdAt: { seconds: Math.floor(Date.now() / 1000) } as any,
      updatedAt: { seconds: Math.floor(Date.now() / 1000) } as any,
    } as Job;
    localStorage.setItem('quickjobs_cached_available', JSON.stringify([optimisticJob, ...list.filter(j => j.id !== newJobDoc.id)]));
    
    const allCached = localStorage.getItem('quickjobs_all_known_jobs');
    const allList: Job[] = allCached ? JSON.parse(allCached) : [];
    localStorage.setItem('quickjobs_all_known_jobs', JSON.stringify([optimisticJob, ...allList.filter(j => j.id !== newJobDoc.id)]));
  } catch {}

  // 2. Direct write to Firestore
  try {
    await setDoc(newJobDoc, newJobPayload);
  } catch (err: any) {
    console.error('Error saving job to Firestore:', err);
    throw new Error(`שגיאה בשמירת העבודה: ${err?.message || 'אנא נסה שוב'}`);
  }

  return newJobDoc.id;
}

// Register / Claim Job with Firestore Transaction (Multi-worker support)
export async function claimJobTransaction(
  jobId: string, 
  worker: { 
    uid: string; 
    fullName: string; 
    phoneNumber: string; 
    ratingAverage?: number; 
    youthGroup?: string;
    notes?: string;
  }
): Promise<void> {
  await ensureAuthUser();

  const jobDocRef = doc(db, 'jobs', jobId);

  const applyClaim = (data: any) => {
    if (data.status === 'cancelled' || data.status === 'completed') {
      throw new Error('עבודה זו כבר אינה פעילה');
    }

    if (data.creatorId === worker.uid) {
      throw new Error('לא ניתן להירשם לעבודה שאתה פרסמת בעצמך');
    }

    const workersNeeded: number = Math.max(1, data.workersNeeded || 1);
    const existingWorkers: any[] = Array.isArray(data.registeredWorkers) ? [...data.registeredWorkers] : [];
    const existingIds: string[] = Array.isArray(data.registeredWorkerIds) ? [...data.registeredWorkerIds] : [];

    // Check if worker already registered
    if (existingIds.includes(worker.uid) || existingWorkers.some(w => w.uid === worker.uid) || data.workerId === worker.uid) {
      throw new Error('כבר נרשמת לעבודה זו!');
    }

    // Check if slots are filled
    if (existingWorkers.length >= workersNeeded) {
      throw new Error(`כל ${workersNeeded} המקומות לעבודה זו כבר נתפסו`);
    }

    const newRegistration = {
      uid: worker.uid,
      fullName: worker.fullName.trim(),
      phoneNumber: worker.phoneNumber.trim(),
      ratingAverage: worker.ratingAverage || 5.0,
      youthGroup: worker.youthGroup || '',
      registeredAt: new Date().toISOString(),
      status: 'registered',
      notes: worker.notes || '',
    };

    const updatedWorkers = [...existingWorkers, newRegistration];
    const updatedIds = [...existingIds, worker.uid];
    const isFull = updatedWorkers.length >= workersNeeded;

    const primaryWorker = updatedWorkers[0];

    return {
      registeredWorkers: updatedWorkers,
      registeredWorkerIds: updatedIds,
      workersNeeded,
      status: isFull ? 'in_progress' : 'new',
      workerId: primaryWorker?.uid || worker.uid,
      workerName: primaryWorker?.fullName || worker.fullName,
      workerPhone: primaryWorker?.phoneNumber || worker.phoneNumber,
      workerRating: primaryWorker?.ratingAverage || worker.ratingAverage || 5.0,
      updatedAt: serverTimestamp(),
    };
  };

  try {
    await runTransaction(db, async (transaction) => {
      const jobSnap = await transaction.get(jobDocRef);
      if (!jobSnap.exists()) {
        throw new Error('העבודה לא קיימת במערכת');
      }
      const updateData = applyClaim(jobSnap.data());
      transaction.update(jobDocRef, updateData);
    });
  } catch (txErr: any) {
    console.warn('Transaction claim warning, attempting direct update:', txErr);
    // Fallback: direct doc read & update
    const snap = await getDoc(jobDocRef);
    if (!snap.exists()) throw new Error('העבודה לא קיימת במערכת');
    const updateData = applyClaim(snap.data());
    await updateDoc(jobDocRef, updateData);
  }

  // Update optimistic local cache
  try {
    const cached = localStorage.getItem('quickjobs_cached_available');
    if (cached) {
      const list: Job[] = JSON.parse(cached);
      const updatedList = list.map(j => {
        if (j.id === jobId) {
          const regWorkers = Array.isArray(j.registeredWorkers) ? [...j.registeredWorkers] : [];
          const regIds = Array.isArray(j.registeredWorkerIds) ? [...j.registeredWorkerIds] : [];
          if (!regIds.includes(worker.uid)) {
            regWorkers.push({
              uid: worker.uid,
              fullName: worker.fullName,
              phoneNumber: worker.phoneNumber,
              ratingAverage: worker.ratingAverage,
              youthGroup: worker.youthGroup,
              registeredAt: new Date().toISOString(),
              status: 'registered'
            });
            regIds.push(worker.uid);
          }
          return {
            ...j,
            registeredWorkers: regWorkers,
            registeredWorkerIds: regIds,
            status: regWorkers.length >= (j.workersNeeded || 1) ? 'in_progress' : 'new',
            workerId: j.workerId || worker.uid,
            workerName: j.workerName || worker.fullName,
            workerPhone: j.workerPhone || worker.phoneNumber
          } as Job;
        }
        return j;
      });
      localStorage.setItem('quickjobs_cached_available', JSON.stringify(updatedList));
    }
  } catch {}
}

// Return job / Cancel worker registration
export async function returnJobToQueue(jobId: string, workerId: string): Promise<void> {
  await ensureAuthUser();

  const jobDocRef = doc(db, 'jobs', jobId);

  await runTransaction(db, async (transaction) => {
    const jobSnap = await transaction.get(jobDocRef);
    if (!jobSnap.exists()) throw new Error('העבודה לא קיימת');

    const data = jobSnap.data();
    const workersNeeded: number = Math.max(1, data.workersNeeded || 1);
    const existingWorkers: any[] = Array.isArray(data.registeredWorkers) ? [...data.registeredWorkers] : [];
    const existingIds: string[] = Array.isArray(data.registeredWorkerIds) ? [...data.registeredWorkerIds] : [];

    const isRegistered = existingIds.includes(workerId) || existingWorkers.some(w => w.uid === workerId) || data.workerId === workerId;
    if (!isRegistered) {
      throw new Error('אינך רשום לעבודה זו');
    }

    const updatedWorkers = existingWorkers.filter(w => w.uid !== workerId);
    const updatedIds = existingIds.filter(id => id !== workerId);

    const primaryWorker = updatedWorkers[0] || null;

    transaction.update(jobDocRef, {
      registeredWorkers: updatedWorkers,
      registeredWorkerIds: updatedIds,
      status: 'new', // Always reopen when someone leaves
      workerId: primaryWorker?.uid || null,
      workerName: primaryWorker?.fullName || null,
      workerPhone: primaryWorker?.phoneNumber || null,
      workerRating: primaryWorker?.ratingAverage || null,
      updatedAt: serverTimestamp(),
    });
  });
}

// Mark job as completed (Worker or Creator)
export async function markJobCompleted(jobId: string, userId: string): Promise<void> {
  await ensureAuthUser();

  const jobDocRef = doc(db, 'jobs', jobId);
  const snap = await getDoc(jobDocRef);
  if (!snap.exists()) throw new Error('העבודה לא קיימת');
  
  const data = snap.data();
  const registeredWorkerIds = Array.isArray(data.registeredWorkerIds) ? data.registeredWorkerIds : [];
  const isRegisteredWorker = registeredWorkerIds.includes(userId) || data.workerId === userId;

  if (data.creatorId !== userId && !isRegisteredWorker) {
    throw new Error('אינך מורשה לסמן עבודה זו כהושלמה');
  }

  await updateDoc(jobDocRef, {
    status: 'completed',
    updatedAt: serverTimestamp(),
  });
}

// Cancel job (Creator cancels)
export async function cancelJob(jobId: string, creatorId: string): Promise<void> {
  await ensureAuthUser();

  const jobDocRef = doc(db, 'jobs', jobId);
  const snap = await getDoc(jobDocRef);
  if (!snap.exists()) throw new Error('העבודה לא קיימת');
  
  const data = snap.data();
  if (data.creatorId !== creatorId) {
    throw new Error('רק יוצר העבודה יכול לבטלה');
  }

  await updateDoc(jobDocRef, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  });
}

// Update job details (Creator only)
export async function updateJob(
  jobId: string, 
  creatorId: string, 
  updates: {
    title: string;
    category?: KibbutzJobCategory | string;
    details: string;
    location: string;
    payment: number | string;
    workersNeeded?: number;
    coordinates?: { lat: number; lng: number } | null;
  }
): Promise<void> {
  await ensureAuthUser();

  const jobDocRef = doc(db, 'jobs', jobId);
  const snap = await getDoc(jobDocRef);
  if (!snap.exists()) throw new Error('העבודה לא קיימת');
  
  const data = snap.data();
  if (data.creatorId !== creatorId) {
    throw new Error('רק יוצר העבודה יכול לערוך אותה');
  }
  if (data.status === 'completed' || data.status === 'cancelled') {
    throw new Error('לא ניתן לערוך עבודה שהסתיימה או בוטלה');
  }

  const workersNeeded = Math.max(1, updates.workersNeeded || data.workersNeeded || 1);
  const currentRegisteredCount = Array.isArray(data.registeredWorkers) ? data.registeredWorkers.length : 0;
  const newStatus = currentRegisteredCount >= workersNeeded ? 'in_progress' : 'new';

  await updateDoc(jobDocRef, {
    title: updates.title.trim(),
    category: updates.category || data.category || null,
    details: updates.details.trim(),
    location: updates.location.trim(),
    payment: updates.payment,
    workersNeeded,
    status: newStatus,
    coordinates: updates.coordinates || null,
    updatedAt: serverTimestamp(),
  });
}

// Delete / Remove Job (Creator or Admin)
export async function deleteJob(jobId: string, userId: string, isAdminUser = false): Promise<void> {
  await ensureAuthUser();

  const jobDocRef = doc(db, 'jobs', jobId);
  const snap = await getDoc(jobDocRef);
  if (snap.exists()) {
    const data = snap.data();
    if (data.creatorId !== userId && !isAdminUser) {
      throw new Error('רק יוצר העבודה או מנהל מערכת יכולים למחוק עבודה זו');
    }
  }

  await deleteDoc(jobDocRef);

  // Clean local caches
  try {
    const cached = localStorage.getItem('quickjobs_cached_available');
    if (cached) {
      const list: Job[] = JSON.parse(cached);
      localStorage.setItem('quickjobs_cached_available', JSON.stringify(list.filter(j => j.id !== jobId)));
    }
    const allCached = localStorage.getItem('quickjobs_all_known_jobs');
    if (allCached) {
      const list: Job[] = JSON.parse(allCached);
      localStorage.setItem('quickjobs_all_known_jobs', JSON.stringify(list.filter(j => j.id !== jobId)));
    }
  } catch {}
}

