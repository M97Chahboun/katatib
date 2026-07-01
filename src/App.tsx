import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  googleProvider, 
  OperationType, 
  handleFirestoreError 
} from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { 
  MapPin, 
  Compass, 
  User as UserIcon, 
  BookOpen, 
  Sparkles, 
  Languages, 
  Users, 
  Filter, 
  Plus, 
  Search, 
  Star, 
  MessageSquare, 
  LogOut, 
  Globe, 
  Phone, 
  Mail, 
  BookMarked, 
  Heart, 
  Check, 
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Calendar,
  AlertCircle,
  Database,
  Sun,
  Moon,
  ShieldCheck,
  Edit,
  Clock,
  Copy,
  ExternalLink,
  Share2
} from 'lucide-react';
import { UserProfile, TahfidCenter, Review } from './types';
import { SEED_CENTERS, SEED_REVIEWS } from './lib/seedData';
const InteractiveMap = React.lazy(() => import('./components/InteractiveMap'));
const LocationPickerMap = React.lazy(() => import('./components/LocationPickerMap'));
import { translations } from './lib/translations';
import { Logo } from './components/Logo';
import { Country, City } from 'country-state-city';

export default function App() {
  // Localization & Theme State
  const [lang, setLang] = useState<'ar' | 'en'>(() => {
    const saved = localStorage.getItem('katatib_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar'; // Default Arabic as requested
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('katatib_darkMode') === 'true';
  });

  const t = translations[lang];

  // Country & City Lists from package
  const countriesList = Country.getAllCountries();

  const getCountryDisplayName = (countryName: string, currentLang: 'ar' | 'en') => {
    if (currentLang !== 'ar') return countryName;
    const arabicCountries: Record<string, string> = {
      'Morocco': 'المغرب',
      'Saudi Arabia': 'المملكة العربية السعودية',
      'Egypt': 'مصر',
      'Turkey': 'تركيا',
      'Jordan': 'الأردن',
      'Algeria': 'الجزائر',
      'Tunisia': 'تونس',
      'Libya': 'ليبيا',
      'Mauritania': 'موريتانيا',
      'Syria': 'سوريا',
      'Lebanon': 'لبنان',
      'Palestine': 'فلسطين',
      'Iraq': 'العراق',
      'Yemen': 'اليمن',
      'United Arab Emirates': 'الإمارات العربية المتحدة',
      'Qatar': 'قطر',
      'Kuwait': 'الكويت',
      'Bahrain': 'البحرين',
      'Oman': 'عمان',
      'Sudan': 'السودان',
      'Somalia': 'الصومال',
      'Djibouti': 'جيبوتي',
      'Comoros': 'جزر القمر',
      'United Kingdom': 'المملكة المتحدة',
      'United States': 'الولايات المتحدة الأمريكية',
      'France': 'فرنسا',
      'Spain': 'إسبانيا',
      'Germany': 'ألمانيا',
      'Indonesia': 'إندونيسيا',
      'Malaysia': 'ماليزيا',
      'Pakistan': 'باكستان',
      'Bangladesh': 'بنغلاديش'
    };
    return arabicCountries[countryName] || countryName;
  };

  const getTimestampMs = (val: any): number => {
    if (!val) return 0;
    if (typeof val.toDate === 'function') {
      try {
        return val.toDate().getTime();
      } catch {
        // fallback
      }
    }
    if (typeof val.seconds === 'number') {
      return val.seconds * 1000;
    }
    if (typeof val === 'string') {
      return new Date(val).getTime();
    }
    if (typeof val === 'number') {
      return val;
    }
    return 0;
  };

  const getGenderLabel = (gender: string) => {
    if (lang === 'ar') {
      switch (gender) {
        case 'mixed': return 'مختلط';
        case 'men': return 'رجال فقط';
        case 'women': return 'نساء فقط';
        case 'boys': return 'أولاد فقط';
        case 'girls': return 'بنات فقط';
        default: return gender;
      }
    } else {
      switch (gender) {
        case 'mixed': return 'Mixed Genders';
        case 'men': return 'Men Only';
        case 'women': return 'Women Only';
        case 'boys': return 'Boys Only';
        case 'girls': return 'Girls Only';
        default: return gender;
      }
    }
  };

  const getAgeGroupLabel = (age: string) => {
    if (lang === 'ar') {
      switch (age.toLowerCase()) {
        case 'children': return 'أطفال';
        case 'youth': return 'شباب';
        case 'adults': return 'كبار / بالغين';
        default: return age;
      }
    } else {
      switch (age.toLowerCase()) {
        case 'children': return 'Children';
        case 'youth': return 'Youth';
        case 'adults': return 'Adults';
        default: return age;
      }
    }
  };

  const getLanguageLabel = (language: string) => {
    const isArabic = lang === 'ar';
    const clean = language.trim().toLowerCase();
    
    if (clean === 'arabic' || clean === 'العربية') {
      return isArabic ? 'العربية' : 'Arabic';
    }
    if (clean === 'english' || clean === 'الإنجليزية') {
      return isArabic ? 'الإنجليزية' : 'English';
    }
    if (clean === 'french' || clean === 'الفرنسية') {
      return isArabic ? 'الفرنسية' : 'French';
    }
    if (clean === 'turkish' || clean === 'التركية') {
      return isArabic ? 'التركية' : 'Turkish';
    }
    if (clean === 'malay' || clean === 'الملايوية') {
      return isArabic ? 'الملايوية' : 'Malay';
    }
    return language;
  };

  const getRecitationLabel = (style: string) => {
    const isArabic = lang === 'ar';
    const clean = style.trim().toLowerCase();
    
    if (clean === 'warsh' || clean === 'ورش') {
      return isArabic ? 'ورش عن نافع' : 'Warsh';
    }
    if (clean === 'hafs' || clean === 'حفص') {
      return isArabic ? 'حفص عن عاصم' : 'Hafs';
    }
    if (clean === 'qalun' || clean === 'قالون') {
      return isArabic ? 'قالون عن نافع' : 'Qalun';
    }
    if (clean === 'al-duri' || clean === 'الدوري') {
      return isArabic ? 'الدوري عن أبي عمرو' : 'Al-Duri';
    }
    if (clean === 'بدون حفظ' || clean === 'none' || clean === 'none (unsupported hifz)' || clean === 'unsupported hifz' || clean === 'no_hifz') {
      return isArabic ? 'لا يوجد محفظ' : 'None (Unsupported Hifz)';
    }
    return style;
  };

  useEffect(() => {
    localStorage.setItem('katatib_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('katatib_darkMode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auth & Profile State
  const [user, setUser] = useState<(User & { role?: 'traveler' | 'host' | 'admin' }) | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedOnboardRole, setSelectedOnboardRole] = useState<'traveler' | 'host' | 'admin' | null>(null);
  const [onboardingDisplayName, setOnboardingDisplayName] = useState('');

  // App Tabs / Views
  const [activeTab, setActiveTab] = useState<'discover' | 'host' | 'about' | 'admin'>('discover');
  
  // Administrative privileges check
  const isAdmin = userProfile?.role === 'admin';

  // Centers & Reviews State
  const [centers, setCenters] = useState<TahfidCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<TahfidCenter | null>(null);
  const [centerReviews, setCenterReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [expandedApprovedCenters, setExpandedApprovedCenters] = useState<Record<string, boolean>>({});
  const [expandedPendingCenters, setExpandedPendingCenters] = useState<Record<string, boolean>>({});

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterDropIn, setFilterDropIn] = useState(false);
  const [filterGender, setFilterGender] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterRecitation, setFilterRecitation] = useState('all');
  const [filterOffersCourses, setFilterOffersCourses] = useState(false);

  // Lazy Loading / Pagination State for Centers
  const [visibleCount, setVisibleCount] = useState(5);

  // Reset pagination when search or filters change
  useEffect(() => {
    setVisibleCount(5);
  }, [searchQuery, filterCity, filterDropIn, filterGender, filterLanguage, filterRecitation, filterOffersCourses]);

  // Write Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewWelcomingScore, setReviewWelcomingScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewOrigin, setReviewOrigin] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [copied, setCopied] = useState(false);

  // Host Add Center Form State
  const [hostNewCenter, setHostNewCenter] = useState({
    name: '',
    description: '',
    lat: '34.0333',
    lng: '-5.0000',
    address: '',
    city: 'Fes',
    country: 'Morocco',
    dropInWelcomed: true,
    gender: 'mixed' as TahfidCenter['gender'],
    ageGroups: [] as string[],
    languages: ['العربية'] as string[],
    recitationStyles: ['ورش'] as string[],
    operatingHours: '',
    teacherName: '',
    contactEmail: '',
    contactPhone: '',
    offersCourses: false
  });
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [isSubmittingCenter, setIsSubmittingCenter] = useState(false);
  const [centerFormError, setCenterFormError] = useState('');

  const selectedCountryObj = countriesList.find(c => c.name === hostNewCenter.country);
  const citiesOfSelectedCountry = selectedCountryObj 
    ? City.getCitiesOfCountry(selectedCountryObj.isoCode) 
    : [];

  const handleCountryChange = (countryName: string) => {
    const countryObj = countriesList.find(c => c.name === countryName);
    let defaultCityName = '';
    let defaultLat = '34.0333';
    let defaultLng = '-5.0000';

    if (countryObj) {
      const cities = City.getCitiesOfCountry(countryObj.isoCode);
      if (countryObj.isoCode === 'MA') {
        const fesCity = cities.find(c => {
          const nameLower = c.name.toLowerCase();
          return nameLower === 'fes' || nameLower === 'fès' || nameLower === 'fez' || nameLower.includes('fes');
        });
        defaultCityName = fesCity ? fesCity.name : 'Fes';
        defaultLat = fesCity && fesCity.latitude ? fesCity.latitude : '34.0333';
        defaultLng = fesCity && fesCity.longitude ? fesCity.longitude : '-5.0000';
      } else {
        defaultCityName = cities[0]?.name || '';
        defaultLat = cities[0]?.latitude || countryObj.latitude || '0';
        defaultLng = cities[0]?.longitude || countryObj.longitude || '0';
      }
    }

    setHostNewCenter(prev => ({
      ...prev,
      country: countryName,
      city: defaultCityName,
      lat: defaultLat,
      lng: defaultLng
    }));
  };

  const handleCityChange = (cityName: string) => {
    const cityObj = citiesOfSelectedCountry.find(c => c.name === cityName);
    setHostNewCenter(prev => ({
      ...prev,
      city: cityName,
      lat: cityObj && cityObj.latitude ? cityObj.latitude : prev.lat,
      lng: cityObj && cityObj.longitude ? cityObj.longitude : prev.lng
    }));
  };

  // --- Custom Dialogs State (for iframe and sandbox reliability) ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder?: string;
    onConfirm: (val: string) => void;
    confirmText?: string;
    cancelText?: string;
    initialValue?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Helper functions for custom alerts, confirms, and prompts
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Automatically hide toast after 4 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showConfirm = (options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      onConfirm: () => {
        options.onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      isDanger: options.isDanger,
    });
  };

  const showPrompt = (options: {
    title: string;
    message: string;
    placeholder?: string;
    onConfirm: (val: string) => void;
    confirmText?: string;
    cancelText?: string;
    initialValue?: string;
  }) => {
    setPromptModal({
      isOpen: true,
      title: options.title,
      message: options.message,
      placeholder: options.placeholder,
      onConfirm: (val) => {
        options.onConfirm(val);
        setPromptModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      initialValue: options.initialValue || '',
    });
  };

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);

      if (currentUser) {
        // Fetch User Profile from Firestore
        setLoadingProfile(true);
        const profileRef = doc(db, 'user_profiles', currentUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            const data = profileSnap.data() as UserProfile;
            setUserProfile(data);
            setUser(prev => prev ? Object.assign(prev, { role: data.role }) : null);
            setShowRoleSelection(false);
          } else {
            // Profile does not exist, trigger role onboarding
            setShowRoleSelection(true);
            setOnboardingDisplayName(currentUser.displayName || '');
          }
        } catch (err) {
          console.warn("Firestore profile read failed, using localStorage profile fallback: ", err);
          const cachedProfileKey = `katatib_profile_${currentUser.uid}`;
          const cached = localStorage.getItem(cachedProfileKey);
          if (cached) {
            try {
              const data = JSON.parse(cached) as UserProfile;
              setUserProfile(data);
              setUser(prev => prev ? Object.assign(prev, { role: data.role }) : null);
              setShowRoleSelection(false);
            } catch {
              setShowRoleSelection(true);
              setOnboardingDisplayName(currentUser.displayName || '');
            }
          } else {
            setShowRoleSelection(true);
            setOnboardingDisplayName(currentUser.displayName || '');
          }
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setUserProfile(null);
        setShowRoleSelection(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Centers from Firestore or load fallback seed data
  useEffect(() => {
    setLoadingCenters(true);
    const path = 'tahfid_centers';
    
    // Set up real-time listener for centers
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: TahfidCenter[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as TahfidCenter);
        });
        setCenters(list);
        setIsUsingFallback(false);
        setLoadingCenters(false);
      },
      (error) => {
        console.warn("Firestore access error, loading offline seed centers: ", error);
        const cached = localStorage.getItem('katatib_centers');
        if (cached) {
          try {
            setCenters(JSON.parse(cached));
          } catch {
            setCenters(SEED_CENTERS);
          }
        } else {
          setCenters(SEED_CENTERS);
          localStorage.setItem('katatib_centers', JSON.stringify(SEED_CENTERS));
        }
        setIsUsingFallback(true);
        setLoadingCenters(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch reviews for selected center
  useEffect(() => {
    if (!selectedCenter) {
      setCenterReviews([]);
      return;
    }

    setLoadingReviews(true);
    const path = `tahfid_centers/${selectedCenter.id}/reviews`;

    // Try live subscription first
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list: Review[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Review);
        });
        
        if (list.length > 0) {
          setCenterReviews(list.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt)));
        } else {
          // Check if we are in fallback, and load from localStorage
          const cachedReviewsKey = `katatib_reviews_${selectedCenter.id}`;
          const cached = localStorage.getItem(cachedReviewsKey);
          if (cached) {
            try {
              setCenterReviews(JSON.parse(cached));
            } catch {
              const offlineReviews = SEED_REVIEWS.filter(r => r.centerId === selectedCenter.id);
              setCenterReviews(offlineReviews);
            }
          } else {
            const offlineReviews = SEED_REVIEWS.filter(r => r.centerId === selectedCenter.id);
            setCenterReviews(offlineReviews);
          }
        }
        setLoadingReviews(false);
      },
      (error) => {
        console.warn("Firestore reviews read failed, fallback to offline reviews: ", error);
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch {
          // Ignore thrown exception so the offline fallback can run uninterrupted
        }
        const cachedReviewsKey = `katatib_reviews_${selectedCenter.id}`;
        const cached = localStorage.getItem(cachedReviewsKey);
        if (cached) {
          try {
            setCenterReviews(JSON.parse(cached));
          } catch {
            const offlineReviews = SEED_REVIEWS.filter(r => r.centerId === selectedCenter.id);
            setCenterReviews(offlineReviews);
          }
        } else {
          const offlineReviews = SEED_REVIEWS.filter(r => r.centerId === selectedCenter.id);
          setCenterReviews(offlineReviews);
          localStorage.setItem(cachedReviewsKey, JSON.stringify(offlineReviews));
        }
        setLoadingReviews(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCenter]);

  // Auto-scroll to selected card when a center is selected (e.g., from map click)
  useEffect(() => {
    if (selectedCenter && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        const cardEl = document.getElementById(`center-card-${selectedCenter.id}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCenter]);

  // Auth Functions
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Sign-in error: ", err);
    }
  };

  const handleGuestSignIn = () => {
    const mockUid = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestUser = {
      uid: mockUid,
      displayName: lang === 'ar' ? 'زائر تجريبي' : 'Demo Guest',
      email: 'guest@katatib.example.com',
      emailVerified: true,
      isAnonymous: true,
    };
    setUser(guestUser as any);
    setUserProfile(null); // This forces the onboarding modal to open, letting them choose role and type name
    setShowRoleSelection(true);
    showToast(
      lang === 'ar' 
        ? 'تم الدخول كزائر! يرجى كتابة اسمك واختيار صفتك لإكمال التسجيل.' 
        : 'Signed in as Guest! Please complete onboarding with your name and role.', 
      'info'
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setActiveTab('discover');
    } catch (err) {
      console.error("Sign-out error: ", err);
    }
  };

  // Onboarding Profile Creation
  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOnboardRole || !onboardingDisplayName.trim()) return;

    setLoadingProfile(true);
    const path = `user_profiles/${user.uid}`;
    
    try {
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: onboardingDisplayName.trim(),
        email: user.email || '',
        role: selectedOnboardRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isUsingFallback) {
        localStorage.setItem(`katatib_profile_${user.uid}`, JSON.stringify(newProfile));
        setUserProfile(newProfile);
        setUser(prev => prev ? Object.assign(prev, { role: newProfile.role }) : null);
        setShowRoleSelection(false);
      } else {
        // Set document using our schema fields
        await setDoc(doc(db, 'user_profiles', user.uid), {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        setUserProfile(newProfile);
        setUser(prev => prev ? Object.assign(prev, { role: newProfile.role }) : null);
        setShowRoleSelection(false);
      }
    } catch (error) {
      if (isUsingFallback) {
        // Handle gracefully even in fallback
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: onboardingDisplayName.trim(),
          email: user.email || '',
          role: selectedOnboardRole,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(`katatib_profile_${user.uid}`, JSON.stringify(newProfile));
        setUserProfile(newProfile);
        setUser(prev => prev ? Object.assign(prev, { role: newProfile.role }) : null);
        setShowRoleSelection(false);
      } else {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Switch Account Role dynamically (no hardcoding, pure Firestore updates)
  const handleSwitchRole = async (newRole: 'traveler' | 'host' | 'admin') => {
    if (!user) return;
    try {
      const updatedProfile: UserProfile = {
        uid: user.uid,
        displayName: userProfile?.displayName || user.displayName || 'User',
        email: userProfile?.email || user.email || '',
        role: newRole,
        createdAt: userProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isUsingFallback) {
        const cachedProfileKey = `katatib_profile_${user.uid}`;
        localStorage.setItem(cachedProfileKey, JSON.stringify(updatedProfile));
        setUserProfile(updatedProfile);
        setUser(prev => prev ? Object.assign(prev, { role: newRole }) : null);
        showToast(
          lang === 'ar' ? `تم تغيير الحساب إلى ${newRole === 'admin' ? 'مشرف' : newRole === 'host' ? 'مستضيف' : 'مسافر'} بنجاح` : `Switched role to ${newRole} successfully!`,
          'success'
        );
      } else {
        const profileRef = doc(db, 'user_profiles', user.uid);
        await updateDoc(profileRef, {
          role: newRole,
          updatedAt: serverTimestamp()
        });
        setUserProfile(updatedProfile);
        setUser(prev => prev ? Object.assign(prev, { role: newRole }) : null);
        showToast(
          lang === 'ar' ? `تم تغيير الحساب إلى ${newRole === 'admin' ? 'مشرف' : newRole === 'host' ? 'مستضيف' : 'مسافر'} بنجاح` : `Switched role to ${newRole} successfully!`,
          'success'
        );
      }
    } catch (err) {
      console.error("Failed to switch role: ", err);
      showToast(
        lang === 'ar' ? "فشل تغيير دور الحساب" : "Failed to switch role.",
        'error'
      );
    }
  };

  // Seed live database with our sample centers (convenience for demo)
  const handleSeedDatabaseLive = async () => {
    if (!user) {
      showToast(t.authRequiredToReview, 'error');
      return;
    }
    setLoadingCenters(true);
    try {
      if (isUsingFallback) {
        // Seeding to LocalStorage
        const existingIds = new Set(centers.map(c => c.id));
        let updatedCenters = [...centers];
        
        for (const center of SEED_CENTERS) {
          if (existingIds.has(center.id)) {
            console.log(`Center ${center.id} already exists in local cache. Skipping...`);
            continue;
          }

          updatedCenters.push({
            ...center,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isApproved: true
          });

          // Seed reviews in localStorage
          const reviews = SEED_REVIEWS.filter(r => r.centerId === center.id);
          const cachedReviewsKey = `katatib_reviews_${center.id}`;
          localStorage.setItem(cachedReviewsKey, JSON.stringify(reviews));
        }

        setCenters(updatedCenters);
        localStorage.setItem('katatib_centers', JSON.stringify(updatedCenters));
        showToast(t.seedAlertSuccess, 'success');
      } else {
        // 1. Get all existing centers in Firestore to see what's already there
        const querySnapshot = await getDocs(collection(db, 'tahfid_centers'));
        const existingIds = new Set(querySnapshot.docs.map(doc => doc.id));

        for (const center of SEED_CENTERS) {
          // If it already exists, skip it to avoid permission/createdAt overwrite issues
          if (existingIds.has(center.id)) {
            console.log(`Center ${center.id} already exists in Firestore. Skipping...`);
            continue;
          }

          // Create center document
          const centerRef = doc(db, 'tahfid_centers', center.id);
          await setDoc(centerRef, {
            ...center,
            createdBy: user.uid, // Claim ownership so user can manage/delete
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isApproved: true
          });

          // Add corresponding seed reviews
          const reviews = SEED_REVIEWS.filter(r => r.centerId === center.id);
          for (const rev of reviews) {
            const revRef = doc(collection(db, `tahfid_centers/${center.id}/reviews`), rev.id);
            await setDoc(revRef, {
              ...rev,
              userId: user.uid, // Satisfy rule: data.userId == request.auth.uid
              createdAt: serverTimestamp()
            });
          }
        }
        setIsUsingFallback(false);
        showToast(t.seedAlertSuccess, 'success');
      }
    } catch (err) {
      console.error("Seeding live DB failed: ", err);
      showToast(t.seedAlertFail + "\nError: " + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setLoadingCenters(false);
    }
  };

  // Administrative Reset & Re-Seed with Arabic mock data
  const handleResetAndSeedDatabase = () => {
    if (!user) {
      showToast(t.authRequiredToReview, 'error');
      return;
    }

    showConfirm({
      title: lang === 'ar' ? "إعادة تهيئة قاعدة البيانات" : "Reset & Seed Database",
      message: lang === 'ar' 
        ? "هل أنت متأكد من رغبتك في حذف جميع الحلقات الحالية وإعادة تهيئة قاعدة البيانات بالبيانات العربية التجريبية؟" 
        : "Are you sure you want to delete all current listings and reset the database with the new Arabic seed data?",
      isDanger: true,
      onConfirm: async () => {
        setLoadingCenters(true);
        try {
          if (isUsingFallback) {
            // Seeding LocalStorage
            const seededCenters = SEED_CENTERS.map(c => ({
              ...c,
              createdBy: user.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isApproved: true
            }));

            // Save centers to localStorage
            localStorage.setItem('katatib_centers', JSON.stringify(seededCenters));
            setCenters(seededCenters);

            // Save reviews to localStorage
            for (const center of SEED_CENTERS) {
              const reviews = SEED_REVIEWS.filter(r => r.centerId === center.id).map(r => ({
                ...r,
                userId: user.uid,
                createdAt: new Date().toISOString()
              }));
              localStorage.setItem(`katatib_reviews_${center.id}`, JSON.stringify(reviews));
            }

            showToast(lang === 'ar' ? "تمت إعادة تهيئة قاعدة البيانات بالبيانات العربية بنجاح!" : "Database reset and re-seeded with Arabic dummy data successfully!", 'success');
          } else {
            // Delete all current centers from Firestore
            const querySnapshot = await getDocs(collection(db, 'tahfid_centers'));
            for (const docSnap of querySnapshot.docs) {
              await deleteDoc(docSnap.ref);
            }
            
            // Now write the new Arabic seed centers
            for (const center of SEED_CENTERS) {
              const centerRef = doc(db, 'tahfid_centers', center.id);
              await setDoc(centerRef, {
                ...center,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isApproved: true
              });

              // Add corresponding seed reviews
              const reviews = SEED_REVIEWS.filter(r => r.centerId === center.id);
              for (const rev of reviews) {
                const revRef = doc(collection(db, `tahfid_centers/${center.id}/reviews`), rev.id);
                await setDoc(revRef, {
                  ...rev,
                  userId: user.uid, // Satisfy rule: data.userId == request.auth.uid
                  createdAt: serverTimestamp()
                });
              }
            }
            setIsUsingFallback(false);
            showToast(lang === 'ar' ? "تمت إعادة تهيئة قاعدة البيانات بالبيانات العربية بنجاح!" : "Database reset and re-seeded with Arabic dummy data successfully!", 'success');
          }
        } catch (err) {
          console.error("Database reset failed: ", err);
          showToast((lang === 'ar' ? "فشلت إعادة تهيئة قاعدة البيانات. خطأ: " : "Failed to reset and seed database. Error: ") + (err instanceof Error ? err.message : String(err)), 'error');
        } finally {
          setLoadingCenters(false);
        }
      }
    });
  };

  // Submit a Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCenter || !reviewComment.trim() || !reviewOrigin.trim()) return;

    setIsSubmittingReview(true);
    setReviewError('');

    const centerId = selectedCenter.id;
    const reviewId = `rev_${user.uid}_${Date.now()}`;
    const reviewsPath = `tahfid_centers/${centerId}/reviews/${reviewId}`;

    try {
      const currentCount = selectedCenter.reviewsCount || 0;
      const currentRating = selectedCenter.averageRating || 0;
      const newCount = currentCount + 1;
      const newRatingAverage = ((currentRating * currentCount) + Number(reviewRating)) / newCount;
      const roundedRating = Math.round(newRatingAverage * 10) / 10;

      const newReviewPayload = {
        id: reviewId,
        centerId,
        userId: user.uid,
        userName: userProfile?.displayName || user.displayName || 'Traveler',
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
        travelerOrigin: reviewOrigin.trim(),
        welcomingScore: Number(reviewWelcomingScore)
      };

      if (isUsingFallback) {
        // Save review to localStorage for this center
        const cachedReviewsKey = `katatib_reviews_${centerId}`;
        const existingReviewsCached = localStorage.getItem(cachedReviewsKey);
        let reviewsList: Review[] = [];
        if (existingReviewsCached) {
          try {
            reviewsList = JSON.parse(existingReviewsCached);
          } catch {
            reviewsList = SEED_REVIEWS.filter(r => r.centerId === centerId);
          }
        } else {
          reviewsList = SEED_REVIEWS.filter(r => r.centerId === centerId);
        }
        const reviewWithDate = {
          ...newReviewPayload,
          createdAt: new Date().toISOString()
        };
        reviewsList = [reviewWithDate, ...reviewsList];
        localStorage.setItem(cachedReviewsKey, JSON.stringify(reviewsList));
        setCenterReviews(reviewsList);

        // Update center record in localStorage & local state
        const updatedCenters = centers.map(c => {
          if (c.id === centerId) {
            return {
              ...c,
              reviewsCount: newCount,
              averageRating: roundedRating
            };
          }
          return c;
        });
        setCenters(updatedCenters);
        localStorage.setItem('katatib_centers', JSON.stringify(updatedCenters));
      } else {
        // 1. Save review document to the subcollection
        const reviewRef = doc(db, `tahfid_centers/${centerId}/reviews`, reviewId);
        await setDoc(reviewRef, {
          ...newReviewPayload,
          createdAt: serverTimestamp()
        });

        // 2. Increment reviews count and update average score on the parent center document
        const centerRef = doc(db, 'tahfid_centers', centerId);
        await updateDoc(centerRef, {
          reviewsCount: newCount,
          averageRating: roundedRating
        });
      }

      // Reset form
      setReviewComment('');
      setReviewOrigin('');
      setReviewRating(5);
      setReviewWelcomingScore(5);
      
      // Update local state copy to feel instant
      setSelectedCenter(prev => {
        if (!prev) return null;
        return {
          ...prev,
          reviewsCount: newCount,
          averageRating: roundedRating
        };
      });

    } catch (error: any) {
      if (isUsingFallback) {
        // Fail gracefully
        const currentCount = selectedCenter.reviewsCount || 0;
        const currentRating = selectedCenter.averageRating || 0;
        const newCount = currentCount + 1;
        const newRatingAverage = ((currentRating * currentCount) + Number(reviewRating)) / newCount;
        const roundedRating = Math.round(newRatingAverage * 10) / 10;
        
        const cachedReviewsKey = `katatib_reviews_${centerId}`;
        const existingReviewsCached = localStorage.getItem(cachedReviewsKey);
        let reviewsList: Review[] = [];
        if (existingReviewsCached) {
          try {
            reviewsList = JSON.parse(existingReviewsCached);
          } catch {
            reviewsList = SEED_REVIEWS.filter(r => r.centerId === centerId);
          }
        } else {
          reviewsList = SEED_REVIEWS.filter(r => r.centerId === centerId);
        }
        const reviewWithDate = {
          id: reviewId,
          centerId,
          userId: user.uid,
          userName: userProfile?.displayName || user.displayName || 'Traveler',
          rating: Number(reviewRating),
          comment: reviewComment.trim(),
          travelerOrigin: reviewOrigin.trim(),
          welcomingScore: Number(reviewWelcomingScore),
          createdAt: new Date().toISOString()
        };
        reviewsList = [reviewWithDate, ...reviewsList];
        localStorage.setItem(cachedReviewsKey, JSON.stringify(reviewsList));
        setCenterReviews(reviewsList);

        const updatedCenters = centers.map(c => {
          if (c.id === centerId) {
            return {
              ...c,
              reviewsCount: newCount,
              averageRating: roundedRating
            };
          }
          return c;
        });
        setCenters(updatedCenters);
        localStorage.setItem('katatib_centers', JSON.stringify(updatedCenters));

        setReviewComment('');
        setReviewOrigin('');
        setReviewRating(5);
        setReviewWelcomingScore(5);
        
        setSelectedCenter(prev => {
          if (!prev) return null;
          return {
            ...prev,
            reviewsCount: newCount,
            averageRating: roundedRating
          };
        });
      } else {
        try {
          handleFirestoreError(error, OperationType.WRITE, reviewsPath);
        } catch (err: any) {
          try {
            const parsed = JSON.parse(err.message);
            setReviewError(lang === 'ar' 
              ? `فشل إرسال التقييم: ${parsed.error}` 
              : `Review submission failed: ${parsed.error}`
            );
          } catch {
            setReviewError(error.message || "Submission failed.");
          }
        }
        console.error("Error submitting review: ", error);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Submit a New or Edited Tahfid Center (Host function)
  const handleCreateCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const {
      name, description, lat, lng, address, city, country,
      gender, ageGroups, languages, recitationStyles, operatingHours, teacherName,
      contactEmail, contactPhone
    } = hostNewCenter;

    // Direct Validation Check
    if (!name.trim() || name.length < 3 || name.length > 150) {
      setCenterFormError("Center name must be between 3 and 150 characters.");
      return;
    }
    if (!description.trim() || description.length < 10 || description.length > 2000) {
      setCenterFormError("Description must be between 10 and 2000 characters.");
      return;
    }
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || numLat < -90 || numLat > 90) {
      setCenterFormError("Latitude must be a valid number between -90 and 90.");
      return;
    }
    if (isNaN(numLng) || numLng < -180 || numLng > 180) {
      setCenterFormError("Longitude must be a valid number between -180 and 180.");
      return;
    }
    if (!contactPhone.trim()) {
      setCenterFormError(lang === 'ar' ? "رقم الهاتف للتواصل مطلوب." : "Contact phone number is required.");
      return;
    }

    setIsSubmittingCenter(true);
    setCenterFormError('');

    const isEdit = editingCenterId !== null;
    const centerId = isEdit ? editingCenterId : `center_${user.uid}_${Date.now()}`;
    const centerPath = `tahfid_centers/${centerId}`;

    const finalAgeGroups = ageGroups && ageGroups.length > 0 ? ageGroups : ['children', 'youth', 'adults'];
    const finalLanguages = languages && languages.length > 0 ? languages : ['العربية'];
    const finalRecitationStyles = recitationStyles && recitationStyles.length > 0 ? recitationStyles : ['ورش'];

    try {
      if (isUsingFallback) {
        const payload: any = {
          name: name.trim(),
          description: description.trim(),
          lat: numLat,
          lng: numLng,
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          dropInWelcomed: hostNewCenter.dropInWelcomed,
          gender,
          ageGroups: finalAgeGroups,
          languages: finalLanguages,
          recitationStyles: finalRecitationStyles,
          operatingHours: operatingHours.trim(),
          teacherName: teacherName.trim(),
          isApproved: isAdmin, // admins keep it approved, normal hosts go back to pending
          moderationNote: "",
          offersCourses: !!hostNewCenter.offersCourses
        };

        if (contactEmail.trim()) payload.contactEmail = contactEmail.trim();
        else payload.contactEmail = "";
        
        if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();

        if (isEdit) {
          const updated = centers.map(c => {
            if (c.id === centerId) {
              return {
                ...c,
                ...payload,
                updatedAt: new Date().toISOString()
              };
            }
            return c;
          });
          setCenters(updated);
          localStorage.setItem('katatib_centers', JSON.stringify(updated));
          showToast(t.updateSuccessAlert, 'success');
          setEditingCenterId(null);
        } else {
          const newCenter: TahfidCenter = {
            id: centerId,
            ...payload,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewsCount: 0,
            averageRating: 0.0
          };
          const updated = [...centers, newCenter];
          setCenters(updated);
          localStorage.setItem('katatib_centers', JSON.stringify(updated));
          showToast(t.centerRegisterSuccessAlert, 'success');
          setActiveTab('discover');
        }
      } else {
        if (isEdit) {
          // Edit flow
          const payload: any = {
            name: name.trim(),
            description: description.trim(),
            lat: numLat,
            lng: numLng,
            address: address.trim(),
            city: city.trim(),
            country: country.trim(),
            dropInWelcomed: hostNewCenter.dropInWelcomed,
            gender,
            ageGroups: finalAgeGroups,
            languages: finalLanguages,
            recitationStyles: finalRecitationStyles,
            operatingHours: operatingHours.trim(),
            teacherName: teacherName.trim(),
            isApproved: isAdmin, // admins keep it approved, normal hosts go back to pending
            moderationNote: "", // clear note upon edit submit
            offersCourses: !!hostNewCenter.offersCourses,
            updatedAt: serverTimestamp()
          };

          if (contactEmail.trim()) payload.contactEmail = contactEmail.trim();
          else payload.contactEmail = "";
          
          if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();

          await updateDoc(doc(db, 'tahfid_centers', centerId), payload);
          showToast(t.updateSuccessAlert, 'success');
          setEditingCenterId(null);
        } else {
          // Create flow
          const payload: any = {
            id: centerId,
            name: name.trim(),
            description: description.trim(),
            lat: numLat,
            lng: numLng,
            address: address.trim(),
            city: city.trim(),
            country: country.trim(),
            dropInWelcomed: hostNewCenter.dropInWelcomed,
            gender,
            ageGroups: finalAgeGroups,
            languages: finalLanguages,
            recitationStyles: finalRecitationStyles,
            operatingHours: operatingHours.trim(),
            teacherName: teacherName.trim(),
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            reviewsCount: 0,
            averageRating: 0.0,
            isApproved: isAdmin,
            moderationNote: "",
            offersCourses: !!hostNewCenter.offersCourses
          };

          if (contactEmail.trim()) payload.contactEmail = contactEmail.trim();
          if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();

          await setDoc(doc(db, 'tahfid_centers', centerId), payload);
          showToast(t.centerRegisterSuccessAlert, 'success');
          setActiveTab('discover');
        }
      }

      // Reset Form State
      setHostNewCenter({
        name: '',
        description: '',
        lat: '34.0333',
        lng: '-5.0000',
        address: '',
        city: 'Fes',
        country: 'Morocco',
        dropInWelcomed: true,
        gender: 'mixed',
        ageGroups: [],
        languages: ['العربية'],
        recitationStyles: ['ورش'],
        operatingHours: '',
        teacherName: '',
        contactEmail: '',
        contactPhone: '',
        offersCourses: false
      });

    } catch (error) {
      if (isUsingFallback) {
        // Handle fallback write anyway
        const payload: any = {
          name: name.trim(),
          description: description.trim(),
          lat: numLat,
          lng: numLng,
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
          dropInWelcomed: hostNewCenter.dropInWelcomed,
          gender,
          ageGroups: finalAgeGroups,
          languages: finalLanguages,
          recitationStyles: finalRecitationStyles,
          operatingHours: operatingHours.trim(),
          teacherName: teacherName.trim(),
          isApproved: isAdmin,
          moderationNote: "",
          offersCourses: !!hostNewCenter.offersCourses
        };

        if (contactEmail.trim()) payload.contactEmail = contactEmail.trim();
        else payload.contactEmail = "";
        if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();

        if (isEdit) {
          const updated = centers.map(c => {
            if (c.id === centerId) {
              return {
                ...c,
                ...payload,
                updatedAt: new Date().toISOString()
              };
            }
            return c;
          });
          setCenters(updated);
          localStorage.setItem('katatib_centers', JSON.stringify(updated));
          showToast(t.updateSuccessAlert, 'success');
          setEditingCenterId(null);
        } else {
          const newCenter: TahfidCenter = {
            id: centerId,
            ...payload,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewsCount: 0,
            averageRating: 0.0
          };
          const updated = [...centers, newCenter];
          setCenters(updated);
          localStorage.setItem('katatib_centers', JSON.stringify(updated));
          showToast(t.centerRegisterSuccessAlert, 'success');
          setActiveTab('discover');
        }

        setHostNewCenter({
          name: '',
          description: '',
          lat: '34.0333',
          lng: '-5.0000',
          address: '',
          city: 'Fes',
          country: 'Morocco',
          dropInWelcomed: true,
          gender: 'mixed',
          ageGroups: [],
          languages: ['العربية'],
          recitationStyles: ['ورش'],
          operatingHours: '',
          teacherName: '',
          contactEmail: '',
          contactPhone: '',
          offersCourses: false
        });
      } else {
        setCenterFormError(isEdit ? t.updateFailAlert : t.centerRegisterFailAlert);
        handleFirestoreError(error, isEdit ? OperationType.UPDATE : OperationType.CREATE, centerPath);
      }
    } finally {
      setIsSubmittingCenter(false);
    }
  };

  // Delete center listing (Host function)
  const handleDeleteCenter = (centerId: string) => {
    showConfirm({
      title: lang === 'ar' ? "حذف الجمعية" : "Delete Association",
      message: t.confirmDelete,
      isDanger: true,
      onConfirm: async () => {
        const centerPath = `tahfid_centers/${centerId}`;
        try {
          if (isUsingFallback) {
            const updated = centers.filter(c => c.id !== centerId);
            setCenters(updated);
            localStorage.setItem('katatib_centers', JSON.stringify(updated));
            localStorage.removeItem(`katatib_reviews_${centerId}`);
            if (selectedCenter?.id === centerId) {
              setSelectedCenter(null);
            }
            showToast(t.deleteListingBtn, 'success');
          } else {
            await deleteDoc(doc(db, 'tahfid_centers', centerId));
            if (selectedCenter?.id === centerId) {
              setSelectedCenter(null);
            }
            showToast(t.deleteListingBtn, 'success');
          }
        } catch (error) {
          if (isUsingFallback) {
            const updated = centers.filter(c => c.id !== centerId);
            setCenters(updated);
            localStorage.setItem('katatib_centers', JSON.stringify(updated));
            localStorage.removeItem(`katatib_reviews_${centerId}`);
            if (selectedCenter?.id === centerId) {
              setSelectedCenter(null);
            }
            showToast(t.deleteListingBtn, 'success');
          } else {
            showToast((lang === 'ar' ? "فشل حذف الجمعية. خطأ: " : "Failed to delete association. Error: ") + (error instanceof Error ? error.message : String(error)), 'error');
            handleFirestoreError(error, OperationType.DELETE, centerPath);
          }
        }
      }
    });
  };

  // Start editing center (Host function)
  const handleStartEdit = (center: TahfidCenter) => {
    setEditingCenterId(center.id);
    setHostNewCenter({
      name: center.name,
      description: center.description,
      lat: String(center.lat),
      lng: String(center.lng),
      address: center.address,
      city: center.city,
      country: center.country,
      dropInWelcomed: center.dropInWelcomed,
      gender: center.gender,
      ageGroups: center.ageGroups,
      languages: center.languages || [],
      recitationStyles: center.recitationStyles || [],
      operatingHours: center.operatingHours,
      teacherName: center.teacherName,
      contactEmail: center.contactEmail || '',
      contactPhone: center.contactPhone || '',
      offersCourses: !!center.offersCourses
    });
    // Scroll smoothly to top where the form resides
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Approve center (Admin function)
  const handleApproveCenter = async (centerId: string) => {
    try {
      if (isUsingFallback) {
        const updated = centers.map(c => {
          if (c.id === centerId) {
            return { ...c, isApproved: true, moderationNote: "" };
          }
          return c;
        });
        setCenters(updated);
        localStorage.setItem('katatib_centers', JSON.stringify(updated));
        showToast(t.approveSuccess, 'success');
      } else {
        await updateDoc(doc(db, 'tahfid_centers', centerId), {
          isApproved: true,
          moderationNote: "", // Clear any previous rejection/unapproval note
          updatedAt: serverTimestamp()
        });

        showToast(t.approveSuccess, 'success');
      }
    } catch (error) {
      if (isUsingFallback) {
        const updated = centers.map(c => {
          if (c.id === centerId) {
            return { ...c, isApproved: true, moderationNote: "" };
          }
          return c;
        });
        setCenters(updated);
        localStorage.setItem('katatib_centers', JSON.stringify(updated));
        showToast(t.approveSuccess, 'success');
      } else {
        console.error("Failed to approve center: ", error);
        showToast(t.approveFail + "\nError: " + (error instanceof Error ? error.message : String(error)), 'error');
      }
    }
  };

  // Revoke/Unaccept center approval with a note (Admin function)
  const handleRevokeCenter = (centerId: string) => {
    showPrompt({
      title: lang === 'ar' ? "إلغاء الاعتماد" : "Unapprove",
      message: t.unacceptPrompt,
      placeholder: lang === 'ar' ? "اكتب سبب إلغاء الاعتماد هنا..." : "Type the unapproval reason here...",
      onConfirm: async (note) => {
        if (!note || !note.trim()) {
          showToast(lang === 'ar' ? "يجب كتابة سبب إلغاء الاعتماد." : "A moderation note is required.", 'error');
          return;
        }
        try {
          if (isUsingFallback) {
            const updated = centers.map(c => {
              if (c.id === centerId) {
                return { ...c, isApproved: false, moderationNote: note.trim() };
              }
              return c;
            });
            setCenters(updated);
            localStorage.setItem('katatib_centers', JSON.stringify(updated));
            showToast(t.unacceptSuccess, 'success');
          } else {
            await updateDoc(doc(db, 'tahfid_centers', centerId), {
              isApproved: false,
              moderationNote: note.trim(),
              updatedAt: serverTimestamp()
            });

            showToast(t.unacceptSuccess, 'success');
          }
        } catch (error) {
          if (isUsingFallback) {
            const updated = centers.map(c => {
              if (c.id === centerId) {
                return { ...c, isApproved: false, moderationNote: note.trim() };
              }
              return c;
            });
            setCenters(updated);
            localStorage.setItem('katatib_centers', JSON.stringify(updated));
            showToast(t.unacceptSuccess, 'success');
          } else {
            console.error("Failed to revoke approval: ", error);
            showToast(t.unacceptFail + "\nError: " + (error instanceof Error ? error.message : String(error)), 'error');
          }
        }
      }
    });
  };

  // Reject / Delete center (Admin/Host function)
  const handleRejectCenter = (centerId: string) => {
    showConfirm({
      title: lang === 'ar' ? "رفض وحذف طلب التسجيل" : "Reject and Delete",
      message: t.confirmDelete,
      isDanger: true,
      onConfirm: async () => {
        const centerPath = `tahfid_centers/${centerId}`;
        try {
          if (isUsingFallback) {
            const updated = centers.filter(c => c.id !== centerId);
            setCenters(updated);
            localStorage.setItem('katatib_centers', JSON.stringify(updated));
            localStorage.removeItem(`katatib_reviews_${centerId}`);
            if (selectedCenter?.id === centerId) {
              setSelectedCenter(null);
            }
            showToast(lang === 'ar' ? "تم رفض وحذف طلب التسجيل بنجاح." : "Registration request successfully rejected and deleted.", 'success');
          } else {
            await deleteDoc(doc(db, 'tahfid_centers', centerId));
            if (selectedCenter?.id === centerId) {
              setSelectedCenter(null);
            }
            showToast(lang === 'ar' ? "تم رفض وحذف طلب التسجيل بنجاح." : "Registration request successfully rejected and deleted.", 'success');
          }
        } catch (error) {
          if (isUsingFallback) {
            const updated = centers.filter(c => c.id !== centerId);
            setCenters(updated);
            localStorage.setItem('katatib_centers', JSON.stringify(updated));
            localStorage.removeItem(`katatib_reviews_${centerId}`);
            if (selectedCenter?.id === centerId) {
              setSelectedCenter(null);
            }
            showToast(lang === 'ar' ? "تم رفض وحذف طلب التسجيل بنجاح." : "Registration request successfully rejected and deleted.", 'success');
          } else {
            showToast((lang === 'ar' ? "فشل الحذف. خطأ: " : "Failed to delete. Error: ") + (error instanceof Error ? error.message : String(error)), 'error');
            handleFirestoreError(error, OperationType.DELETE, centerPath);
          }
        }
      }
    });
  };

  // List unique cities for dropdown selection
  const uniqueCities = Array.from(new Set(centers.map(c => c.city))).sort();

  // Filter Centers list
  const filteredCenters = centers.filter(center => {
    // Standard users should only see approved centers. Admins can see everything.
    // If a center doesn't have isApproved field, assume true (compatibility with older data/seed fallback)
    const isApproved = center.isApproved !== false;
    if (!isApproved && !isAdmin) return false;

    const matchesSearch = 
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = filterCity === 'all' || center.city === filterCity;
    const matchesDropIn = !filterDropIn || center.dropInWelcomed === true;
    const matchesGender = filterGender === 'all' || center.gender === filterGender;

    const matchesLanguage = filterLanguage === 'all' || (
      center.languages && center.languages.some(langVal => {
        const cleanLang = langVal.trim().toLowerCase();
        const cleanFilter = filterLanguage.trim().toLowerCase();
        if (cleanFilter === 'العربية' || cleanFilter === 'arabic') {
          return cleanLang === 'arabic' || cleanLang === 'العربية';
        }
        if (cleanFilter === 'الإنجليزية' || cleanFilter === 'english') {
          return cleanLang === 'english' || cleanLang === 'الإنجليزية';
        }
        if (cleanFilter === 'الفرنسية' || cleanFilter === 'french') {
          return cleanLang === 'french' || cleanLang === 'الفرنسية';
        }
        if (cleanFilter === 'التركية' || cleanFilter === 'turkish') {
          return cleanLang === 'turkish' || cleanLang === 'التركية';
        }
        if (cleanFilter === 'الملايوية' || cleanFilter === 'malay') {
          return cleanLang === 'malay' || cleanLang === 'الملايوية';
        }
        return cleanLang === cleanFilter;
      })
    );

    const matchesRecitation = filterRecitation === 'all' || (
      center.recitationStyles && center.recitationStyles.some(recVal => {
        const cleanRec = recVal.trim().toLowerCase();
        const cleanFilter = filterRecitation.trim().toLowerCase();
        if (cleanFilter === 'ورش' || cleanFilter === 'warsh') {
          return cleanRec === 'warsh' || cleanRec === 'ورش';
        }
        if (cleanFilter === 'حفص' || cleanFilter === 'hafs') {
          return cleanRec === 'hafs' || cleanRec === 'حفص';
        }
        if (cleanFilter === 'قالون' || cleanFilter === 'qalun') {
          return cleanRec === 'qalun' || cleanRec === 'قالون';
        }
        if (cleanFilter === 'الدوري' || cleanFilter === 'al-duri') {
          return cleanRec === 'al-duri' || cleanRec === 'الدوري';
        }
        return cleanRec === cleanFilter;
      })
    );

    const matchesOffersCourses = !filterOffersCourses || center.offersCourses === true;

    return matchesSearch && matchesCity && matchesDropIn && matchesGender && matchesLanguage && matchesRecitation && matchesOffersCourses;
  });

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen font-sans antialiased flex flex-col selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300 ${
        darkMode 
          ? 'bg-stone-950 text-stone-100' 
          : 'bg-[#FCFBF9] text-stone-900'
      }`}
    >
      
      {/* Decorative Top Bar */}
      <div className="w-full h-1.5 bg-[#064E3B]" />

      {/* Main Navigation Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 md:px-8 py-4 transition-colors duration-300 ${
        darkMode 
          ? 'bg-stone-900/95 border-stone-800' 
          : 'bg-[#FCFBF9]/95 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div 
            onClick={() => { setActiveTab('discover'); setSelectedCenter(null); }}
            className="flex items-center gap-3 cursor-pointer group animate-fade-in"
          >
            <div className="w-13 h-13 bg-emerald-950 text-emerald-400 dark:text-emerald-300 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-950/15 border border-emerald-800/80 group-hover:scale-105 transition-transform duration-200 p-1.5 shrink-0">
              <Logo size={34} className="text-emerald-400 dark:text-emerald-300" strokeWidth={5.2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-serif text-lg md:text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-[#064E3B]'}`}>
                  {t.appName}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  darkMode ? 'bg-emerald-950/85 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {t.portalSubtitle}
                </span>
              </div>
              <p className={`text-[10px] font-bold ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>{t.logoTagline}</p>
            </div>
          </div>

          {/* Center navigation controls */}
          <nav className={`hidden md:flex items-center gap-1 p-1.5 rounded-2xl border transition-colors duration-300 ${
            darkMode ? 'bg-stone-900 border-stone-800' : 'bg-stone-100 border-stone-200'
          }`}>
            <button
              onClick={() => { setActiveTab('discover'); setSelectedCenter(null); }}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'discover' 
                  ? (darkMode ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-950 shadow-sm') 
                  : (darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-600 hover:text-stone-900')
              }`}
              id="nav-discover-btn"
            >
              {t.exploreCenters}
            </button>
            <button
              onClick={() => setActiveTab('host')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'host' 
                  ? (darkMode ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-950 shadow-sm') 
                  : (darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-600 hover:text-stone-900')
              }`}
              id="nav-host-btn"
            >
              {t.hostHub}
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                activeTab === 'about' 
                  ? (darkMode ? 'bg-stone-800 text-white shadow-sm' : 'bg-white text-stone-950 shadow-sm') 
                  : (darkMode ? 'text-stone-400 hover:text-stone-200' : 'text-stone-600 hover:text-stone-900')
              }`}
              id="nav-about-btn"
            >
              {t.heritage}
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'admin' 
                    ? (darkMode ? 'bg-amber-950/40 text-amber-300 shadow-sm border border-amber-900/30' : 'bg-amber-50 text-amber-950 shadow-sm border border-amber-100') 
                    : (darkMode ? 'text-amber-500 hover:text-amber-400' : 'text-[#D97706] hover:text-[#B45309]')
                }`}
                id="nav-admin-btn"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                {t.adminPortal}
              </button>
            )}
          </nav>

          {/* User Auth and Theme/Language controls */}
          <div className="flex items-center gap-3">
            {/* Toggles */}
            <div className="flex items-center gap-1.5">
              {/* Language Selector */}
              <button
                onClick={() => setLang(prev => prev === 'ar' ? 'en' : 'ar')}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-[11px] font-bold uppercase cursor-pointer ${
                  darkMode 
                    ? 'bg-stone-850 border-stone-800 hover:bg-stone-800 text-stone-200 hover:text-white' 
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700 hover:text-stone-950'
                }`}
                title={lang === 'ar' ? 'Switch to English' : 'تحويل للعربية'}
              >
                <Languages className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline-block">{lang === 'ar' ? 'EN' : 'العربية'}</span>
              </button>

              {/* Dark/Light Mode Selector */}
              <button
                onClick={() => setDarkMode(prev => !prev)}
                className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                  darkMode 
                    ? 'bg-stone-850 border-stone-800 hover:bg-stone-800 text-amber-400 hover:text-amber-300' 
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-600 hover:text-stone-900'
                }`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="h-5 w-px bg-stone-300 dark:bg-stone-800 hidden sm:block" />

            {loadingAuth ? (
              <div className={`w-8 h-8 rounded-full border-2 animate-spin ${darkMode ? 'border-stone-700 border-t-[#064E3B]' : 'border-stone-200 border-t-[#064E3B]'}`} />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="text-end hidden sm:block">
                  <div className={`text-xs font-bold ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                    {userProfile?.displayName || user.displayName || 'Traveler'}
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wide">
                    {userProfile?.role === 'admin' ? '🛡️ ' + t.adminPortal : userProfile?.role === 'host' ? '🕌 ' + t.hostHub : '🌍 ' + t.onboardTravelerTitle}
                  </div>
                </div>
                
                {/* Profile Avatar / Settings Dropdown */}
                <div className="relative group">
                  <button className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden shadow-sm hover:scale-105 transition-all cursor-pointer ${
                    darkMode ? 'bg-stone-900 border-stone-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="avatar" referrerPolicy="no-referrer" loading="lazy" />
                    ) : (
                      <UserIcon className="w-5 h-5" />
                    )}
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className={`absolute end-0 mt-2 w-48 rounded-[1.5rem] shadow-lg border py-2.5 hidden group-hover:block hover:block z-50 transition-colors duration-300 ${
                    darkMode ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                  }`}>
                    <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                      <div className="text-xs font-bold line-clamp-1">{user.displayName}</div>
                      <div className="text-[10px] text-stone-400 font-bold line-clamp-1">{user.email}</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('discover')}
                      className={`w-full text-start px-4 py-2 text-xs flex items-center gap-2 font-bold cursor-pointer ${
                        darkMode ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-emerald-500" />
                      {t.exploreCenters}
                    </button>
                    {(userProfile?.role === 'host' || userProfile?.role === 'admin' || isAdmin) && (
                      <button
                        onClick={() => setActiveTab('host')}
                        className={`w-full text-start px-4 py-2 text-xs flex items-center gap-2 font-bold cursor-pointer ${
                          darkMode ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-emerald-500" />
                        {t.yourListings}
                      </button>
                    )}
                    {(userProfile?.role === 'admin' || isAdmin) && (
                      <button
                        onClick={() => setActiveTab('admin')}
                        className={`w-full text-start px-4 py-2 text-xs flex items-center gap-2 font-bold cursor-pointer ${
                          darkMode ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        {t.adminPortal}
                      </button>
                    )}
                    {/* Role switcher inside dropdown */}
                    <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-1.5">
                      <div className="text-[9px] uppercase tracking-wider font-extrabold text-stone-400 mb-1">
                        {lang === 'ar' ? 'تغيير نوع الحساب:' : 'Switch Account Role:'}
                      </div>
                      <div className="flex flex-col gap-1">
                        {userProfile?.role !== 'traveler' && (
                          <button
                            onClick={() => handleSwitchRole('traveler')}
                            className={`w-full text-start px-2 py-1 text-[10px] font-bold rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 transition cursor-pointer`}
                          >
                            🌍 {t.onboardTravelerTitle}
                          </button>
                        )}
                        {userProfile?.role !== 'host' && (
                          <button
                            onClick={() => handleSwitchRole('host')}
                            className={`w-full text-start px-2 py-1 text-[10px] font-bold rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 transition cursor-pointer`}
                          >
                            🕌 {t.hostHub}
                          </button>
                        )}
                        {userProfile?.role !== 'admin' && (
                          <button
                            onClick={() => handleSwitchRole('admin')}
                            className={`w-full text-start px-2 py-1 text-[10px] font-bold rounded hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 transition cursor-pointer`}
                          >
                            🛡️ {t.onboardAdminTitle}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-start px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 border-t border-stone-100 dark:border-stone-800 font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.signOut}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleGuestSignIn}
                  className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-[11px] font-bold rounded-full border border-stone-200 dark:border-stone-700 cursor-pointer transition-all active:scale-95"
                  id="header-guest-login-btn"
                >
                  {lang === 'ar' ? 'دخول زائر' : 'Guest Sign-In'}
                </button>
                <button
                  onClick={handleGoogleSignIn}
                  className="px-3.5 py-1.5 bg-[#064E3B] hover:bg-[#043327] text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-sm transition-all duration-200 border border-emerald-950 cursor-pointer active:scale-95"
                  id="header-login-btn"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-200" />
                  {t.signIn}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs Bar */}
      <div className={`md:hidden sticky top-[72px] z-30 border-b px-4 py-2 flex justify-around transition-colors duration-300 ${
        darkMode ? 'bg-stone-900 border-stone-800' : 'bg-[#fbfbf8] border-slate-200'
      }`}>
        <button
          onClick={() => { setActiveTab('discover'); setSelectedCenter(null); }}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
            activeTab === 'discover' ? 'text-emerald-500 font-bold' : (darkMode ? 'text-stone-400' : 'text-slate-500')
          }`}
        >
          <Compass className="w-4 h-4" />
          {t.exploreCenters}
        </button>
        <button
          onClick={() => setActiveTab('host')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
            activeTab === 'host' ? 'text-emerald-500 font-bold' : (darkMode ? 'text-stone-400' : 'text-slate-500')
          }`}
        >
          <Plus className="w-4 h-4" />
          {t.hostHub}
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
            activeTab === 'about' ? 'text-emerald-500 font-bold' : (darkMode ? 'text-stone-400' : 'text-slate-500')
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {t.heritage}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
              activeTab === 'admin' ? 'text-amber-500 font-bold' : (darkMode ? 'text-stone-400 hover:text-amber-300' : 'text-slate-500 hover:text-[#B45309]')
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            {t.adminPortal}
          </button>
        )}
      </div>

      {/* Main Content Sections Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        
        {/* Onboarding Dialog Modal */}
        <AnimatePresence>
          {showRoleSelection && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`rounded-3xl border shadow-2xl max-w-md w-full p-6 md:p-8 relative overflow-hidden transition-colors duration-300 ${
                  darkMode ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-slate-200 text-stone-900'
                }`}
              >
                {/* Visual decoration */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-700" />
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-50 rounded-full blur-xl opacity-30" />

                <div className="text-center mb-6">
                  <div className={`w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-3 border p-2.5 transition-all shadow-inner ${
                    darkMode ? 'bg-stone-800 border-stone-700 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  }`}>
                    <Logo size={46} className="text-emerald-600 dark:text-emerald-400" strokeWidth={5.2} />
                  </div>
                  <h3 className={`text-lg font-bold font-serif tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.onboardTitle}
                  </h3>
                  <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>
                    {t.onboardSubtitle}
                  </p>
                </div>

                <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                  {/* Name field */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${darkMode ? 'text-stone-300' : 'text-slate-700'}`}>
                      {t.onboardNameLabel}
                    </label>
                    <input
                      type="text"
                      value={onboardingDisplayName}
                      onChange={(e) => setOnboardingDisplayName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-700 transition ${
                        darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-slate-50 border-slate-200 text-stone-900'
                      }`}
                      placeholder="e.g., Omar Al-Khattab"
                      required
                      id="onboard-name"
                    />
                  </div>

                  {/* Role choosing */}
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wide mb-2 ${darkMode ? 'text-stone-300' : 'text-slate-700'}`}>
                      {t.onboardRoleLabel}
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Traveler choice */}
                      <button
                        type="button"
                        onClick={() => setSelectedOnboardRole('traveler')}
                        className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                          selectedOnboardRole === 'traveler'
                            ? (darkMode ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/35 text-white' : 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/35')
                            : (darkMode ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200')
                        }`}
                        id="onboard-role-traveler"
                      >
                        <div>
                          <div className="text-lg mb-1">🌍</div>
                          <h4 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.onboardTravelerTitle}</h4>
                        </div>
                        <p className={`text-[9px] leading-snug mt-1 ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>
                          {t.onboardTravelerDesc}
                        </p>
                      </button>

                      {/* Host choice */}
                      <button
                        type="button"
                        onClick={() => setSelectedOnboardRole('host')}
                        className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                          selectedOnboardRole === 'host'
                            ? (darkMode ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/35 text-white' : 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/35')
                            : (darkMode ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200')
                        }`}
                        id="onboard-role-host"
                      >
                        <div>
                          <div className="text-lg mb-1">🕌</div>
                          <h4 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.hostHub}</h4>
                        </div>
                        <p className={`text-[9px] leading-snug mt-1 ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>
                          {t.onboardHostDesc}
                        </p>
                      </button>

                      {/* Admin choice */}
                      <button
                        type="button"
                        onClick={() => setSelectedOnboardRole('admin')}
                        className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                          selectedOnboardRole === 'admin'
                            ? (darkMode ? 'bg-emerald-950/60 border-emerald-500 ring-1 ring-emerald-500/35 text-white' : 'bg-emerald-50/70 border-emerald-600 ring-1 ring-emerald-600/35')
                            : (darkMode ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750' : 'bg-slate-50 hover:bg-slate-100/50 border-slate-200')
                        }`}
                        id="onboard-role-admin"
                      >
                        <div>
                          <div className="text-lg mb-1">🛡️</div>
                          <h4 className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{t.onboardAdminTitle}</h4>
                        </div>
                        <p className={`text-[9px] leading-snug mt-1 ${darkMode ? 'text-stone-400' : 'text-slate-500'}`}>
                          {t.onboardAdminDesc}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    type="submit"
                    disabled={!selectedOnboardRole || !onboardingDisplayName.trim() || loadingProfile}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-amber-50 text-xs font-semibold rounded-xl shadow border border-emerald-900 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    id="onboard-submit-btn"
                  >
                    {loadingProfile 
                      ? (t.onboardLoading || (lang === 'ar' ? 'جاري الإعداد...' : 'Setting up...')) 
                      : `${t.onboardSubmit || (lang === 'ar' ? 'ابدأ رحلتك الآن' : 'Get Started')} \u2192`}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- VIEW 1: DISCOVER TAB --- */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            
            {/* Bento Grid Header Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Primary Welcome Bento Block */}
              <div className="lg:col-span-8 bg-emerald-900 text-amber-50 p-8 rounded-[2.5rem] relative overflow-hidden border border-emerald-950 shadow-sm flex flex-col justify-between min-h-[300px]">
                {/* Backlight glow */}
                <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-800/80 via-emerald-900/40 to-transparent pointer-events-none" />
                
                <div className="relative z-10 max-w-2xl">
                  <span className="text-[10px] font-bold tracking-wider bg-emerald-800 text-amber-200 px-3 py-1.5 rounded-full uppercase">
                    🌍 Quranic Fellowship
                  </span>
                  <h1 className="text-3xl md:text-4.5xl font-serif font-bold tracking-tight text-white mt-6 leading-tight">
                    {t.heroHeadline}
                  </h1>
                  <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed mt-4 max-w-xl">
                    {t.heroSubheadline}
                  </p>
                </div>

                {/* Instant Database Seeder Info for reviewers / new users */}
                {(isUsingFallback || (centers.length > 0 && centers.length < 6)) && (
                  <div className="mt-6 p-4 bg-emerald-950/80 rounded-[1.5rem] border border-emerald-800/60 max-w-xl text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div>
                      <span className="font-bold block">⚠️ {t.dbEmptyBanner}</span>
                      <span className="text-[11px] text-slate-300">
                        {lang === 'ar' 
                          ? "هل ترغب في تهيئة قاعدة البيانات بالبيانات العربية الستة والتقييمات؟" 
                          : t.dbEmptyDesc}
                      </span>
                    </div>
                    <button
                      onClick={handleSeedDatabaseLive}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer"
                      id="seed-live-db-btn"
                    >
                      <Database className="w-4 h-4" />
                      {t.seedDbBtn}
                    </button>
                  </div>
                )}
              </div>

              {/* Featured Traveler Session Bento Block */}
              <div className="lg:col-span-4 bg-emerald-950 text-white rounded-[2.5rem] border border-emerald-900 shadow-sm p-8 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">{t.activeJourney}</span>
                    <span className="bg-emerald-800 text-emerald-300 text-[10px] px-2 py-1 rounded-lg">ACTIVE</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif italic mt-6 leading-tight">{t.activeJourneyTitle}</h2>
                  <p className="mt-4 text-emerald-200 text-xs leading-relaxed opacity-90">
                    {t.activeJourneyDesc}
                  </p>
                </div>
                <button
                  onClick={() => showToast(t.checkInAlert, 'success')}
                  className="bg-white text-emerald-900 w-full py-3.5 mt-6 rounded-2xl font-bold text-xs tracking-wide shadow-lg hover:bg-emerald-50 transition cursor-pointer"
                >
                  {t.checkInBtn}
                </button>
              </div>

            </div>

            {/* INTERACTIVE GEOGRAPHIC MAP */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <h3 className={`font-serif font-bold text-base md:text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {t.locationMapTitle}
                  </h3>
                </div>
                {selectedCenter && (
                  <button 
                    onClick={() => setSelectedCenter(null)}
                    className="text-xs text-stone-500 hover:text-emerald-500 transition cursor-pointer"
                    id="clear-selection-btn"
                  >
                    {t.clearMapSelection}
                  </button>
                )}
              </div>
              <React.Suspense fallback={
                <div className={`w-full h-[350px] rounded-[2.5rem] border flex flex-col items-center justify-center gap-3 transition-colors duration-300 ${
                  darkMode ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-[#F9F8F6] border-stone-200 text-stone-900'
                }`}>
                  <Compass className="w-8 h-8 text-emerald-600 animate-spin" />
                  <span className="text-xs font-serif italic uppercase tracking-widest text-stone-400 font-bold">
                    {lang === 'ar' ? 'جاري تحميل الخريطة التفاعلية...' : 'Loading Interactive Map...'}
                  </span>
                </div>
              }>
                <InteractiveMap 
                  centers={filteredCenters}
                  selectedCenter={selectedCenter}
                  onSelectCenter={setSelectedCenter}
                  darkMode={darkMode}
                />
              </React.Suspense>
            </div>

            {/* COMMUNITY STATS & QUOTE BANNER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Stats Card */}
              <div className={`rounded-[2.5rem] border p-6 flex flex-col justify-center text-center transition-colors duration-300 ${
                darkMode ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-[#F9F8F6] border-stone-200 text-stone-900'
              }`}>
                <span className="text-4xl font-serif italic text-emerald-500">{filteredCenters.length || 6}</span>
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-2">{t.verifiedKuttabsGlobally}</span>
              </div>

              {/* Community Review */}
              <div className="md:col-span-2 bg-stone-900 text-stone-400 rounded-[2.5rem] p-6 flex flex-col sm:flex-row justify-between items-center gap-6 text-start border border-stone-850">
                <div className="flex-1">
                  <p className="text-xs leading-relaxed italic font-serif text-stone-300">
                    "{t.nomadQuote}"
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-stone-700"></div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-stone-400">{t.nomadQuoteAuthor}</span>
                  </div>
                </div>
                <div className="hidden sm:block h-12 w-px bg-stone-850"></div>
                <div className="flex items-center gap-4 text-white shrink-0">
                  <div>
                    <div className="text-xl font-bold font-serif italic text-amber-100">4.9 / 5.0</div>
                    <div className="text-[8px] text-stone-500 uppercase font-black tracking-widest">{lang === 'ar' ? 'تقييم المسافرين العالمي' : 'Global Traveler Rating'}</div>
                  </div>
                  <Compass className="w-5 h-5 text-emerald-650 animate-spin-slow" />
                </div>
              </div>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className={`border rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-4 transition-colors duration-300 ${
              darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}>
              
              {/* Search text and dropdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Text */}
                <div className="relative md:col-span-2">
                  <Search className="absolute start-3.5 top-1/2 transform -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className={`w-full ps-10 pe-4 py-3 border rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                      darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                    id="search-input"
                  />
                </div>

                {/* City Dropdown */}
                <div className="relative">
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className={`w-full ${lang === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border rounded-2xl text-xs appearance-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition font-bold cursor-pointer ${
                      darkMode 
                        ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850' 
                        : 'bg-white border-stone-300 hover:border-stone-400 text-stone-800 shadow-sm hover:shadow'
                    }`}
                    id="filter-city-select"
                  >
                    <option value="all">🗺️ {lang === 'ar' ? 'كل المدن' : 'All Cities'}</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>📍 {city}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none ${
                    lang === 'ar' ? 'left-3' : 'right-3'
                  }`} />
                </div>
              </div>

              {/* Collapsible Advanced Filters */}
              <div className="border-t border-stone-100 dark:border-stone-800 pt-4 flex flex-wrap items-center justify-between gap-4">
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Drop-In Filter */}
                  <label className={`flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-xl text-xs font-bold transition ${
                    darkMode 
                      ? 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-300' 
                      : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      checked={filterDropIn}
                      onChange={(e) => setFilterDropIn(e.target.checked)}
                      className="accent-emerald-900 w-3.5 h-3.5 rounded"
                      id="filter-drop-in-checkbox"
                    />
                    ✨ {t.welcomesDropins}
                  </label>

                  {/* Offers Courses Filter */}
                  <label className={`flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-xl text-xs font-bold transition ${
                    darkMode 
                      ? 'bg-stone-900 hover:bg-stone-850 border-stone-800 text-stone-300' 
                      : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-700 shadow-sm'
                  }`}>
                    <input
                      type="checkbox"
                      checked={filterOffersCourses}
                      onChange={(e) => setFilterOffersCourses(e.target.checked)}
                      className="accent-emerald-900 w-3.5 h-3.5 rounded"
                      id="filter-courses-checkbox"
                    />
                    🎓 {t.coursesFilter || (lang === 'ar' ? 'تقدم دورات ومحاضرات' : 'Offers Courses/Seminars')}
                  </label>

                  {/* Gender Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">{lang === 'ar' ? 'الجنس:' : 'Gender:'}</span>
                    <div className="relative">
                      <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className={`appearance-none ${lang === 'ar' ? 'pl-8 pr-3' : 'pr-8 pl-3'} py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-[#064E3B] transition duration-200 cursor-pointer ${
                          darkMode 
                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850' 
                            : 'bg-white border-stone-300 hover:border-stone-400 text-stone-700 shadow-sm hover:shadow'
                        }`}
                        id="filter-gender-select"
                      >
                        <option value="all">{lang === 'ar' ? 'مختلط / كل الأجناس' : 'Mixed / All Genders'}</option>
                        <option value="men">{lang === 'ar' ? 'رجال فقط' : 'Men Only'}</option>
                        <option value="women">{lang === 'ar' ? 'نساء فقط' : 'Women Only'}</option>
                        <option value="boys">{lang === 'ar' ? 'أولاد فقط' : 'Boys Only'}</option>
                        <option value="girls">{lang === 'ar' ? 'بنات فقط' : 'Girls Only'}</option>
                      </select>
                      <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none ${
                        lang === 'ar' ? 'left-2' : 'right-2'
                      }`} />
                    </div>
                  </div>

                  {/* Language Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">{lang === 'ar' ? 'اللغة:' : 'Language:'}</span>
                    <div className="relative">
                      <select
                        value={filterLanguage}
                        onChange={(e) => setFilterLanguage(e.target.value)}
                        className={`appearance-none ${lang === 'ar' ? 'pl-8 pr-3' : 'pr-8 pl-3'} py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-[#064E3B] transition duration-200 cursor-pointer ${
                          darkMode 
                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850' 
                            : 'bg-white border-stone-300 hover:border-stone-400 text-stone-700 shadow-sm hover:shadow'
                        }`}
                        id="filter-language-select"
                      >
                        <option value="all">{lang === 'ar' ? 'كل اللغات' : 'All Languages'}</option>
                        <option value="العربية">{lang === 'ar' ? 'العربية' : 'Arabic'}</option>
                        <option value="الإنجليزية">{lang === 'ar' ? 'الإنجليزية' : 'English'}</option>
                        <option value="الفرنسية">{lang === 'ar' ? 'الفرنسية' : 'French'}</option>
                        <option value="التركية">{lang === 'ar' ? 'التركية' : 'Turkish'}</option>
                        <option value="الملايوية">{lang === 'ar' ? 'الملايوية' : 'Malay'}</option>
                      </select>
                      <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none ${
                        lang === 'ar' ? 'left-2' : 'right-2'
                      }`} />
                    </div>
                  </div>

                  {/* Recitation Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden sm:inline">{lang === 'ar' ? 'الرواية:' : 'Recitation:'}</span>
                    <div className="relative">
                      <select
                        value={filterRecitation}
                        onChange={(e) => setFilterRecitation(e.target.value)}
                        className={`appearance-none ${lang === 'ar' ? 'pl-8 pr-3' : 'pr-8 pl-3'} py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-[#064E3B] transition duration-200 cursor-pointer ${
                          darkMode 
                            ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850' 
                            : 'bg-white border-stone-300 hover:border-stone-400 text-stone-700 shadow-sm hover:shadow'
                        }`}
                        id="filter-recitation-select"
                      >
                        <option value="all">{lang === 'ar' ? 'كل الروايات' : 'All Recitations'}</option>
                        <option value="ورش">{lang === 'ar' ? 'ورش عن نافع' : 'Warsh'}</option>
                        <option value="حفص">{lang === 'ar' ? 'حفص عن عاصم' : 'Hafs'}</option>
                        <option value="قالون">{lang === 'ar' ? 'قالون عن نافع' : 'Qalun'}</option>
                        <option value="الدوري">{lang === 'ar' ? 'الدوري عن أبي عمرو' : 'Al-Duri'}</option>
                        <option value="بدون حفظ">{lang === 'ar' ? 'لا يوجد محفظ' : 'None (Unsupported Hifz)'}</option>
                      </select>
                      <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none ${
                        lang === 'ar' ? 'left-2' : 'right-2'
                      }`} />
                    </div>
                  </div>

                </div>

                {/* Reset Filters */}
                {(searchQuery || filterCity !== 'all' || filterDropIn || filterGender !== 'all' || filterLanguage !== 'all' || filterRecitation !== 'all' || filterOffersCourses) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterCity('all');
                      setFilterDropIn(false);
                      setFilterGender('all');
                      setFilterLanguage('all');
                      setFilterRecitation('all');
                      setFilterOffersCourses(false);
                    }}
                    className="text-xs font-bold text-emerald-900 hover:text-emerald-950 hover:underline transition cursor-pointer"
                    id="reset-filters-btn"
                  >
                    {t.resetFilters || 'Reset All Filters'}
                  </button>
                )}
              </div>
            </div>

            {/* RESULTS LIST & DETAILS SCREEN */}
            <div className="max-w-4xl mx-auto space-y-4">
              
              <div className="flex items-center justify-between px-2">
                <h4 className={`text-base font-bold font-serif italic ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                  {t.discoveredCentersCount} ({filteredCenters.length})
                </h4>
                {isUsingFallback && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50 uppercase">
                    Offline Mode Fallback Active
                  </span>
                )}
              </div>

              {filteredCenters.length === 0 ? (
                <div className={`border p-10 text-center rounded-[2.5rem] transition-colors duration-300 ${
                  darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}>
                  <Compass className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <h5 className={`text-sm font-bold font-serif ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                    {t.noCentersFound}
                  </h5>
                  <p className={`text-xs mt-2 max-w-md mx-auto leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {t.noCentersFoundDesc}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCenters.slice(0, visibleCount).map(center => {
                    const isSelected = selectedCenter?.id === center.id;
                    return (
                      <div
                        key={center.id}
                        id={`center-card-${center.id}`}
                        className={`rounded-[2.5rem] border transition-all duration-300 overflow-hidden ${
                          darkMode
                            ? isSelected 
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/10 shadow-md' 
                              : 'border-stone-800 bg-stone-900 shadow-sm hover:border-stone-700 hover:shadow-md'
                            : isSelected
                              ? 'border-[#064E3B] ring-2 ring-[#064E3B]/20 shadow-md bg-emerald-50/5'
                              : 'border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md'
                        }`}
                      >
                        {/* Clickable Header Summary */}
                        <div
                          onClick={() => setSelectedCenter(isSelected ? null : center)}
                          className="p-6 cursor-pointer text-start"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                                  darkMode ? 'bg-stone-800 border-stone-700 text-stone-400' : 'bg-stone-50 border-stone-100 text-stone-400'
                                }`}>
                                  📍 {center.city}, {center.country}
                                </span>
                                {center.dropInWelcomed && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    darkMode ? 'text-emerald-300 bg-emerald-950 border border-emerald-900' : 'text-emerald-900 bg-emerald-100/70'
                                  }`}>
                                    ✨ {t.welcomesDropins}
                                  </span>
                                )}
                                {center.offersCourses && (
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                    darkMode ? 'text-blue-300 bg-blue-950 border border-blue-900' : 'text-blue-900 bg-blue-100/70'
                                  }`}>
                                    🎓 {lang === 'ar' ? 'دورات علمية' : 'Academic Courses'}
                                  </span>
                                )}
                              </div>
                              <h4 className={`text-lg md:text-xl font-bold font-serif tracking-tight mt-3 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                {center.name}
                              </h4>
                              <p className={`text-xs leading-relaxed mt-2 line-clamp-2 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                {center.description}
                              </p>
                            </div>

                            {/* Ratings Badge */}
                            <div className={`border p-3 rounded-2xl text-center min-w-14 shadow-sm shrink-0 ${
                              darkMode ? 'bg-stone-800 border-stone-750' : 'bg-stone-50 border-stone-200'
                            }`}>
                              <div className="text-amber-500 text-xs font-bold flex items-center justify-center gap-0.5">
                                ★ <span className={`font-serif font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>{center.averageRating?.toFixed(1) || '0.0'}</span>
                              </div>
                              <div className="text-[9px] text-stone-400 mt-1 font-bold uppercase tracking-wider">
                                {center.reviewsCount || 0} {lang === 'ar' ? 'تقييم' : 'rev'}
                              </div>
                            </div>
                          </div>

                          {/* Quick Info Tags */}
                          <div className={`flex flex-wrap items-center gap-2 mt-5 pt-4 border-t text-[10px] font-bold ${
                            darkMode ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-600'
                          }`}>
                            <span className={`px-3 py-1.5 rounded-xl border ${
                              darkMode ? 'bg-stone-800 text-stone-300 border-stone-700' : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}>
                              👥 {getGenderLabel(center.gender)}
                            </span>
                            <span className={`px-3 py-1.5 rounded-xl border ${
                              darkMode ? 'bg-stone-800 text-stone-300 border-stone-700' : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}>
                              🤝 {center.dropInWelcomed ? (lang === 'ar' ? 'يرحب بالزوار والمسافرين' : 'Welcomes travelers') : (lang === 'ar' ? 'التسجيل مسبقاً مطلوب' : 'Prior registration required')}
                            </span>
                            {center.offersCourses && (
                              <span className={`px-3 py-1.5 rounded-xl border ${
                                darkMode ? 'bg-blue-950/25 text-blue-300 border-blue-900/50' : 'bg-blue-50 text-blue-900 border-blue-200'
                              }`}>
                                🎓 {lang === 'ar' ? 'تقدم دورات ومحاضرات تدريبية' : 'Offers academic courses & seminars'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Inline Detailed Expansion */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              onClick={(e) => e.stopPropagation()}
                              className={`border-t p-6 md:p-8 space-y-6 text-start transition-all duration-300 ${
                                darkMode ? 'border-stone-800 bg-stone-900/40 text-stone-100' : 'border-stone-100 bg-stone-50/20 text-stone-900'
                              }`}
                            >
                              {/* Detailed Info section */}
                              <div className="space-y-3">
                                <div>
                                  <p className={`text-xs flex items-center gap-1.5 font-medium ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                    <MapPin className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                                    {center.address}, {center.city}, {center.country}
                                  </p>
                                </div>

                                {/* Fast Action Buttons Bar */}
                                <div className="flex flex-wrap gap-2 pt-1.5">
                                  {/* Get Directions Link */}
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${center.name} ${center.address} ${center.city}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                                      darkMode ? 'bg-emerald-950/40 hover:bg-emerald-950/75 border-emerald-900/50 text-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    <Compass className="w-3.5 h-3.5 animate-spin-slow text-emerald-500" />
                                    {lang === 'ar' ? 'عرض في الخرائط ↗' : 'Get Directions ↗'}
                                  </a>

                                  {/* Copy Info Button */}
                                  <button
                                    onClick={() => {
                                      const text = `${center.name}\n📍 ${center.address}, ${center.city}, ${center.country}\n📧 ${center.contactEmail || ''}\n📞 ${center.contactPhone || ''}\n📖 ${center.description}`;
                                      navigator.clipboard.writeText(text);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer ${
                                      copied
                                        ? (darkMode ? 'bg-emerald-900/50 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white')
                                        : (darkMode ? 'bg-stone-850 hover:bg-stone-800 border-stone-750 text-stone-300' : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700')
                                    }`}
                                  >
                                    {copied ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        {lang === 'ar' ? 'تم النسخ!' : 'Copied!'}
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        {lang === 'ar' ? 'نسخ التفاصيل' : 'Copy Info'}
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Bio */}
                              <div className={`p-5 rounded-[2rem] border transition-all duration-300 ${
                                darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50/70 border-stone-150'
                              }`}>
                                <h4 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                  <BookMarked className="w-4 h-4 text-emerald-500" />
                                  {t.aboutCircle}
                                </h4>
                                <p className={`text-xs leading-relaxed font-normal ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                                  {center.description}
                                </p>
                              </div>

                              {/* Operating specifications */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-xs pt-1">
                                <div>
                                  <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wide flex items-center gap-1 mb-1">
                                    <UserIcon className="w-3.5 h-3.5 text-emerald-500" />
                                    {t.teacherName}
                                  </span>
                                  <span className={`font-bold text-xs ${darkMode ? 'text-stone-200' : 'text-stone-850'}`}>
                                    {center.teacherName}
                                  </span>
                                </div>
                                
                                <div>
                                  <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wide flex items-center gap-1 mb-1">
                                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                                    {t.operatingHours}
                                  </span>
                                  <span className={`font-bold text-xs ${darkMode ? 'text-stone-200' : 'text-stone-850'}`}>
                                    {center.operatingHours}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wide flex items-center gap-1 mb-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                                    {lang === 'ar' ? 'الجنس المستهدف' : 'Gender Target'}
                                  </span>
                                  <span className={`font-bold text-xs ${darkMode ? 'text-stone-200' : 'text-stone-850'}`}>
                                    {getGenderLabel(center.gender)}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wide flex items-center gap-1 mb-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                                    {lang === 'ar' ? 'سياسة الزيارة' : 'Visitor Policy'}
                                  </span>
                                  <span className={`font-bold text-xs ${darkMode ? 'text-stone-200' : 'text-stone-850'}`}>
                                    {center.dropInWelcomed ? (lang === 'ar' ? 'يرحب بالزوار والمسافرين' : 'Welcomes travelers & drop-ins') : (lang === 'ar' ? 'التسجيل مسبقاً مطلوب' : 'Prior registration required')}
                                  </span>
                                </div>

                                <div>
                                  <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wide flex items-center gap-1 mb-1.5">
                                    <Languages className="w-3.5 h-3.5 text-blue-500" />
                                    {lang === 'ar' ? 'لغات التواصل' : 'Communication'}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {center.languages && center.languages.length > 0 ? (
                                      center.languages.map(l => (
                                        <span key={l} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-bold">
                                          {getLanguageLabel(l)}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-stone-400">-</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <span className="font-bold text-stone-400 uppercase text-[9px] tracking-wide flex items-center gap-1 mb-1.5">
                                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                                    {lang === 'ar' ? 'روايات التلاوة' : 'Recitations'}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-0.5 font-sans">
                                    {center.recitationStyles && center.recitationStyles.length > 0 ? (
                                      center.recitationStyles.map(r => (
                                        <span key={r} className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded text-[10px] font-bold">
                                          {getRecitationLabel(r)}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-stone-400">-</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Host contact cards */}
                              {(center.contactEmail || center.contactPhone) && (
                                <div className="border-t border-stone-100 dark:border-stone-850 pt-5">
                                  <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">
                                    {t.contactHost}
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    {center.contactEmail && (
                                      <a
                                        href={`mailto:${center.contactEmail}`}
                                        className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 hover:scale-[1.01] ${
                                          darkMode ? 'bg-stone-850 border-stone-800 hover:border-stone-750 text-stone-300 hover:text-white' : 'bg-stone-50 border-stone-100 hover:border-stone-200 text-stone-700 hover:text-[#064E3B]'
                                        }`}
                                      >
                                        <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="font-bold truncate">{center.contactEmail}</span>
                                      </a>
                                    )}
                                    {center.contactPhone && (
                                      <a
                                        href={`tel:${center.contactPhone}`}
                                        className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 hover:scale-[1.01] ${
                                          darkMode ? 'bg-stone-850 border-stone-800 hover:border-stone-750 text-stone-300 hover:text-white' : 'bg-stone-50 border-stone-100 hover:border-stone-200 text-stone-700 hover:text-[#064E3B]'
                                        }`}
                                      >
                                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="font-bold truncate">{center.contactPhone}</span>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* REVIEW SYSTEM */}
                              <div className="border-t border-stone-100 dark:border-stone-850 pt-6 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-stone-800'}`}>
                                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                                    {t.reviews} ({centerReviews.length})
                                  </h4>
                                  
                                  {/* Aggregate stats */}
                                  <div className={`flex items-center gap-1 border px-2.5 py-1 rounded-full text-xs ${
                                    darkMode ? 'bg-stone-850 border-stone-800 text-stone-300' : 'bg-amber-50/70 border-amber-100 text-amber-900'
                                  }`}>
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span className="font-bold">
                                      {center.averageRating?.toFixed(1) || '0.0'}
                                    </span>
                                  </div>
                                </div>

                                {/* Reviews list rendering */}
                                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                                  {loadingReviews ? (
                                    <div className="text-center py-6 text-xs text-stone-400 font-medium">{lang === 'ar' ? 'جاري تحميل التقييمات...' : 'Loading feedback...'}</div>
                                  ) : centerReviews.length === 0 ? (
                                    <div className={`text-center py-8 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 ${
                                      darkMode ? 'bg-stone-850/30 border-stone-800 text-stone-400' : 'bg-stone-50/50 border-stone-100 text-stone-500'
                                    }`}>
                                      <MessageSquare className="w-5 h-5 text-stone-400 opacity-60" />
                                      <span className="text-xs font-medium leading-relaxed">{t.noReviews}</span>
                                    </div>
                                  ) : (
                                    centerReviews.map(rev => (
                                      <div key={rev.id} className={`p-4 rounded-[1.5rem] border transition-all duration-300 hover:shadow-md ${
                                        darkMode ? 'bg-stone-850/60 border-stone-800 hover:border-stone-750' : 'bg-white border-stone-150 shadow-sm hover:border-stone-200'
                                      }`}>
                                        <div className="flex justify-between items-start gap-3">
                                          <div className="flex items-center gap-2.5">
                                            {/* Avatar Circle with initials */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider shrink-0 ${
                                              darkMode ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                                            }`}>
                                              {rev.userName ? rev.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TR'}
                                            </div>
                                            <div>
                                              <span className={`text-xs font-bold block leading-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                                {rev.userName}
                                              </span>
                                              <span className="text-[9px] text-stone-400 font-medium">
                                                {lang === 'ar' ? `من ${rev.travelerOrigin}` : `From ${rev.travelerOrigin}`}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          <div className="text-end">
                                            <div className="flex items-center gap-0.5 justify-end">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star 
                                                  key={star} 
                                                  className={`w-3 h-3 ${star <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300 dark:text-stone-700'}`} 
                                                />
                                              ))}
                                            </div>
                                            <div className="text-[8px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
                                              {lang === 'ar' ? `الترحيب: ${rev.welcomingScore}/5` : `Welcome: ${rev.welcomingScore}/5`}
                                            </div>
                                          </div>
                                        </div>
                                        <p className={`text-xs leading-relaxed italic mt-3 pl-1 font-serif ${darkMode ? 'text-stone-300' : 'text-stone-650'}`}>
                                          "{rev.comment}"
                                        </p>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* WRITE A REVIEW FORM */}
                                <div className={`border p-5 rounded-[2rem] space-y-4 ${
                                  darkMode ? 'bg-stone-850/50 border-stone-800' : 'bg-stone-50 border-stone-150'
                                }`}>
                                  <h5 className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>
                                    ✍️ {t.vouchForCenter}
                                  </h5>
                                  
                                  {user ? (
                                    <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Interactive Star Rating Row */}
                                        <div className="space-y-1">
                                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                                            {lang === 'ar' ? 'تقييم الجمعية' : 'Quran Association Rating'}
                                          </label>
                                          <div className="flex items-center gap-1 pt-1">
                                            {[1, 2, 3, 4, 5].map((starVal) => (
                                              <button
                                                key={starVal}
                                                type="button"
                                                onClick={() => setReviewRating(starVal)}
                                                className="focus:outline-none transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                                              >
                                                <Star 
                                                  className={`w-7 h-7 transition-colors duration-150 ${
                                                    starVal <= reviewRating 
                                                      ? 'text-amber-400 fill-amber-400' 
                                                      : 'text-stone-300 dark:text-stone-700'
                                                  }`} 
                                                />
                                              </button>
                                            ))}
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wide ml-2 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                                              {reviewRating === 5 ? (lang === 'ar' ? 'ممتاز' : 'Excellent') : reviewRating === 4 ? (lang === 'ar' ? 'جيد جداً' : 'Very Good') : reviewRating === 3 ? (lang === 'ar' ? 'مقبول' : 'Average') : reviewRating === 2 ? (lang === 'ar' ? 'ضعيف' : 'Poor') : (lang === 'ar' ? 'سيئ' : 'Terrible')}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Segmented Welcoming score button row */}
                                        <div className="space-y-1">
                                          <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                                            {lang === 'ar' ? 'مستوى الترحيب بالغرباء' : 'Foreigner Welcome Score'}
                                          </label>
                                          <div className="flex gap-1.5 pt-1.5">
                                            {[1, 2, 3, 4, 5].map((scoreVal) => {
                                              const isSelected = scoreVal === reviewWelcomingScore;
                                              return (
                                                <button
                                                  key={scoreVal}
                                                  type="button"
                                                  onClick={() => setReviewWelcomingScore(scoreVal)}
                                                  className={`flex-1 py-1.5 text-center text-xs font-black rounded-xl border transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
                                                    isSelected 
                                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                                                      : darkMode 
                                                        ? 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750' 
                                                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                                                  }`}
                                                >
                                                  {scoreVal} {scoreVal === 5 ? '🤩' : scoreVal === 4 ? '😊' : scoreVal === 3 ? '🙂' : scoreVal === 2 ? '😐' : '😞'}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Home Town origin */}
                                      <div className="space-y-1">
                                        <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                                          {lang === 'ar' ? 'بلدك الأصلي ومدينتك' : 'Your Hometown & Country'}
                                        </label>
                                        <input
                                          type="text"
                                          value={reviewOrigin}
                                          onChange={(e) => setReviewOrigin(e.target.value)}
                                          placeholder="e.g. Birmingham, UK"
                                          className={`w-full px-3 py-2.5 border rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all ${
                                            darkMode ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'bg-white border-stone-200 placeholder-stone-400'
                                          }`}
                                          required
                                          id="review-origin-input"
                                        />
                                      </div>

                                      {/* Written Comment */}
                                      <div className="space-y-1">
                                        <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                                          {lang === 'ar' ? 'ملاحظاتك المكتوبة' : 'Written Feedback'}
                                        </label>
                                        <textarea
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                          placeholder={lang === 'ar' ? 'شاركنا كيف كان ترحيبهم بك كمسافر...' : 'Share how accommodating they were to you as a traveler...'}
                                          rows={4}
                                          className={`w-full px-3 py-2.5 border rounded-xl text-xs resize-y min-h-[90px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all ${
                                            darkMode ? 'bg-stone-800 border-stone-700 text-white placeholder-stone-500' : 'bg-white border-stone-200 text-stone-900 placeholder-stone-400'
                                          }`}
                                          required
                                          minLength={5}
                                          maxLength={1000}
                                          id="review-comment-textarea"
                                        />
                                      </div>

                                      {reviewError && (
                                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                          <AlertCircle className="w-3.5 h-3.5" />
                                          {reviewError}
                                        </p>
                                      )}

                                      <button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold rounded-xl shadow border border-emerald-900 hover:border-emerald-950 transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-98"
                                        id="submit-review-btn"
                                      >
                                        {isSubmittingReview ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : (t.postReview || (lang === 'ar' ? 'إرسال التقييم' : 'Submit Review'))}
                                      </button>
                                    </form>
                                  ) : (
                                    <div className="text-center py-4 space-y-3">
                                      <p className="text-[10px] text-stone-400 leading-relaxed max-w-xs mx-auto">{lang === 'ar' ? 'سجل الدخول للمشاركة بالتقييم وتزكية هذا المكان' : 'Sign in to write a review and vouch for this space'}</p>
                                      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                                        <button
                                          type="button"
                                          onClick={handleGuestSignIn}
                                          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-[10px] font-bold rounded-xl shadow hover:scale-105 transition-all cursor-pointer active:scale-95 border dark:border-stone-700"
                                          id="review-guest-signin-btn"
                                        >
                                          {lang === 'ar' ? 'الدخول السريع كزائر' : 'Quick Guest Sign-In'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={handleGoogleSignIn}
                                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-bold rounded-xl shadow hover:scale-105 transition-all cursor-pointer active:scale-95"
                                          id="review-signin-btn"
                                        >
                                          {t.signInWithGoogle}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Lazy Loading / Load More Trigger */}
              {filteredCenters.length > visibleCount && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className={`px-6 py-3 rounded-full border text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm ${
                      darkMode 
                        ? 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-850 hover:border-stone-700 hover:text-white' 
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 hover:text-[#064E3B]'
                    }`}
                    id="load-more-centers-btn"
                  >
                    <span>{lang === 'ar' ? 'عرض المزيد من الكتاتيب والجمعيات' : 'Show More Katatib & Centers'}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      darkMode ? 'bg-stone-800 text-stone-400' : 'bg-stone-100 text-stone-500'
                    }`}>
                      +{filteredCenters.length - visibleCount}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW 2: HOST HUB TAB --- */}
        {activeTab === 'host' && (
          <div className={`space-y-6 max-w-4xl mx-auto ${lang === 'ar' ? 'text-right' : 'text-left'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Host Banner */}
            <div className="bg-emerald-950 text-amber-50 p-8 rounded-[2.5rem] relative overflow-hidden border border-emerald-900 shadow-sm">
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent pointer-events-none" />
              
              <div className="relative z-10 max-w-xl">
                <span className="text-[10px] font-bold tracking-wider bg-emerald-800 text-amber-300 px-3 py-1.5 rounded-full uppercase">
                  🕌 {lang === 'ar' ? 'المساجد ومراكز التحفيظ' : 'Masjid & Tahfid Centers'}
                </span>
                <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-white mt-5">
                  {t.welcomeHostHeadline}
                </h1>
                <p className="text-xs text-emerald-100/90 leading-relaxed mt-3">
                  {t.welcomeHostSubheadline}
                </p>
              </div>
            </div>

            {/* Authenticated Check */}
            {!user ? (
              <div className={`border rounded-[2.5rem] p-10 text-center max-w-md mx-auto shadow-sm transition-colors duration-300 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}>
                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 border p-3 transition-all ${
                  darkMode ? 'bg-stone-850 border-stone-800 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-[#064E3B]'
                }`}>
                  <Logo size={54} className="text-[#064E3B] dark:text-emerald-400" strokeWidth={5.2} />
                </div>
                <h4 className={`text-sm font-bold font-serif ${darkMode ? 'text-white' : 'text-stone-800'}`}>{t.authRequired}</h4>
                <p className={`text-xs mt-2 mb-6 leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-400'}`}>
                  {t.authRequiredDesc}
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-center">
                  <button
                    onClick={handleGuestSignIn}
                    className="w-full sm:w-auto px-5 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 font-bold text-xs rounded-full border dark:border-stone-700 cursor-pointer transition-all active:scale-95"
                    id="host-guest-signin-btn"
                  >
                    {lang === 'ar' ? 'دخول سريع كزائر' : 'Quick Guest Sign-In'}
                  </button>
                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-full shadow border border-emerald-900 transition-all cursor-pointer active:scale-95"
                    id="host-signin-btn"
                  >
                    {t.signInWithGoogle}
                  </button>
                </div>
              </div>
            ) : (userProfile?.role !== 'host' && userProfile?.role !== 'admin') ? (
              /* If logged in but signed up as traveler */
              <div className={`border rounded-[2.5rem] p-10 text-center max-w-md mx-auto shadow-sm space-y-5 transition-colors duration-300 ${
                darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}>
                <Compass className="w-14 h-14 text-emerald-600 mx-auto" />
                <h4 className={`text-sm font-bold font-serif ${darkMode ? 'text-white' : 'text-stone-800'}`}>{t.musaafirActive}</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                  {t.musaafirActiveDesc}
                </p>
                <button
                  onClick={() => {
                    const confirmTitle = lang === 'ar' ? "تغيير نوع الحساب" : "Switch Role";
                    const confirmMsg = lang === 'ar' 
                      ? "هل تريد بالتأكيد تحويل حسابك إلى مستضيف؟ سيسمح لك هذا بإدراج وإدارة جمعيات التحفيظ على المنصة."
                      : "Switch your role to Association Host? This will allow you to list and manage associations on Katatib.";
                    showConfirm({
                      title: confirmTitle,
                      message: confirmMsg,
                      onConfirm: async () => {
                        try {
                          const profileRef = doc(db, 'user_profiles', user.uid);
                          await updateDoc(profileRef, {
                            role: 'host',
                            updatedAt: new Date().toISOString()
                          });
                          setUserProfile(prev => prev ? { ...prev, role: 'host' } : null);
                          setUser(prev => prev ? Object.assign(prev, { role: 'host' as const }) : null);
                          showToast(lang === 'ar' ? "تم تحويل حسابك إلى مستضيف بنجاح!" : "Switched your role to Association Host successfully!", 'success');
                        } catch (err) {
                          console.error(err);
                          showToast(lang === 'ar' ? "فشل تحويل الحساب." : "Failed to switch role.", 'error');
                        }
                      }
                    });
                  }}
                  className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-full cursor-pointer transition-all border border-emerald-950 shadow-sm"
                  id="switch-to-host-btn"
                >
                  {t.switchRoleToHost} 🕌
                </button>
              </div>
            ) : (
              /* ACTIVE HOST DASHBOARD */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Form to Create Center: MD column 7 */}
                <div className={`md:col-span-7 border rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6 transition-colors duration-300 ${
                  darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}>
                  <h3 className={`text-lg font-bold font-serif pb-3 border-b flex items-center gap-2 ${
                    darkMode ? 'text-white border-stone-800' : 'text-stone-900 border-stone-150'
                  }`}>
                    {editingCenterId ? (
                      <Edit className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Plus className="w-5 h-5 text-emerald-650" />
                    )}
                    {editingCenterId ? t.editBtn : t.registerCircle}
                  </h3>

                  <form onSubmit={handleCreateCenter} className="space-y-4 text-xs text-stone-700">
                    
                    {/* General Name */}
                    <div>
                      <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.centerNameLabel}</label>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'مثال: مدرسة دار القرآن المحمدية بالدار البيضاء' : 'e.g. Dar Al-Quran Al-Muhammadiyya, Casablanca'}
                        value={hostNewCenter.name}
                        onChange={e => setHostNewCenter({ ...hostNewCenter, name: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-2xl text-start focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                          darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                        }`}
                        id="center-name-input"
                      />
                    </div>

                    {/* Teacher & Hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.teacherNameLabel}</label>
                        <input
                          type="text"
                          required
                          placeholder={lang === 'ar' ? 'مثال: الشيخ عبد الكبير' : 'e.g. Sheikh Abdelkabir'}
                          value={hostNewCenter.teacherName}
                          onChange={e => setHostNewCenter({ ...hostNewCenter, teacherName: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-2xl text-start focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                            darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                          }`}
                          id="center-teacher-input"
                        />
                      </div>
                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.operatingHoursLabel}</label>
                        <input
                          type="text"
                          required
                          placeholder={lang === 'ar' ? 'مثال: يومياً من 8 صباحاً إلى 11 صباحاً' : 'e.g. Weekdays: 8:00 AM - 11:00 AM'}
                          value={hostNewCenter.operatingHours}
                          onChange={e => setHostNewCenter({ ...hostNewCenter, operatingHours: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-2xl text-start focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                            darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                          }`}
                          id="center-hours-input"
                        />
                      </div>
                    </div>

                    {/* Address details */}
                    <div>
                      <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.physicalAddressLabel}</label>
                      <input
                        type="text"
                        required
                        placeholder={lang === 'ar' ? 'مثال: شارع الحسن الثاني، المعاريف' : 'e.g. Bd Hassan II, Maârif'}
                        value={hostNewCenter.address}
                        onChange={e => setHostNewCenter({ ...hostNewCenter, address: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-2xl text-start focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                          darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                        }`}
                        id="center-address-input"
                      />
                    </div>

                    {/* City & Country Selects */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.countryLabel}</label>
                        <div className="relative">
                          <select
                            value={hostNewCenter.country}
                            onChange={e => handleCountryChange(e.target.value)}
                            className={`w-full appearance-none ${lang === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition font-bold cursor-pointer ${
                              darkMode ? 'bg-stone-900 border-stone-800 text-white hover:bg-stone-850' : 'bg-white border-stone-300 hover:border-stone-400 text-stone-900 shadow-sm hover:shadow'
                            }`}
                            id="center-country-select"
                          >
                            {countriesList.map(c => (
                              <option key={c.isoCode} value={c.name} className={darkMode ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}>
                                {getCountryDisplayName(c.name, lang)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none ${
                            lang === 'ar' ? 'left-3.5' : 'right-3.5'
                          }`} />
                        </div>
                      </div>

                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.cityLabel}</label>
                        <div className="relative">
                          <select
                            value={hostNewCenter.city}
                            onChange={e => handleCityChange(e.target.value)}
                            className={`w-full appearance-none ${lang === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition font-bold cursor-pointer ${
                              darkMode ? 'bg-stone-900 border-stone-800 text-white hover:bg-stone-850' : 'bg-white border-stone-300 hover:border-stone-400 text-stone-900 shadow-sm hover:shadow'
                            }`}
                            id="center-city-select"
                          >
                            {citiesOfSelectedCountry.length > 0 ? (
                              citiesOfSelectedCountry.map(ct => (
                                <option key={ct.name} value={ct.name} className={darkMode ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}>
                                  {ct.name}
                                </option>
                              ))
                            ) : (
                              <option value="" className={darkMode ? 'bg-stone-900 text-white' : 'bg-white text-stone-900'}>No cities found</option>
                            )}
                          </select>
                          <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none ${
                            lang === 'ar' ? 'left-3.5' : 'right-3.5'
                          }`} />
                        </div>
                      </div>
                    </div>

                    {/* Geographic Coordinates Helper */}
                    <div className={`p-4 rounded-2xl border space-y-3 ${
                      darkMode ? 'bg-stone-850 border-stone-800' : 'bg-[#F9F8F6] border-stone-200'
                    }`}>
                      <div className={`flex items-center gap-1.5 font-bold text-xs ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                        <Compass className="w-4 h-4 text-emerald-650" />
                        {t.mapCoordinateTitle}
                      </div>
                      <p className={`text-[11px] leading-normal font-medium ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        {t.mapCoordinateDesc}
                      </p>

                      <React.Suspense fallback={
                        <div className="h-[220px] w-full rounded-2xl flex items-center justify-center border border-dashed border-stone-300 dark:border-stone-750 text-xs text-stone-400">
                          {lang === 'ar' ? 'جاري تحميل خريطة تحديد الموقع...' : 'Loading location picker map...'}
                        </div>
                      }>
                        <LocationPickerMap
                          lat={hostNewCenter.lat}
                          lng={hostNewCenter.lng}
                          onChange={(newLat, newLng) => {
                            setHostNewCenter(prev => ({
                              ...prev,
                              lat: String(newLat),
                              lng: String(newLng)
                            }));
                          }}
                          darkMode={darkMode}
                          lang={lang}
                        />
                      </React.Suspense>
                      
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className={`block font-bold text-[10px] mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.latLabel}</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 33.5731"
                            value={hostNewCenter.lat}
                            onChange={e => setHostNewCenter({ ...hostNewCenter, lat: e.target.value })}
                            className={`w-full px-3.5 py-2 border rounded-xl text-xs text-start ${
                              darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-200'
                            }`}
                            id="center-lat-input"
                          />
                        </div>
                        <div>
                          <label className={`block font-bold text-[10px] mb-1 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.lngLabel}</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. -7.5898"
                            value={hostNewCenter.lng}
                            onChange={e => setHostNewCenter({ ...hostNewCenter, lng: e.target.value })}
                            className={`w-full px-3.5 py-2 border rounded-xl text-xs text-start ${
                              darkMode ? 'bg-stone-800 border-stone-700 text-white' : 'bg-white border-stone-200'
                            }`}
                            id="center-lng-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Details Specification Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Gender Choice */}
                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.genderLabel}</label>
                        <div className="relative">
                          <select
                            value={hostNewCenter.gender}
                            onChange={e => setHostNewCenter({ ...hostNewCenter, gender: e.target.value as TahfidCenter['gender'] })}
                            className={`w-full appearance-none ${lang === 'ar' ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition font-bold cursor-pointer ${
                              darkMode ? 'bg-stone-900 border-stone-800 text-stone-200 hover:bg-stone-850' : 'bg-white border-stone-300 hover:border-stone-400 text-stone-800 shadow-sm hover:shadow'
                            }`}
                            id="center-gender-select"
                          >
                            <option value="mixed">{lang === 'ar' ? 'مختلط' : 'Mixed Genders'}</option>
                            <option value="men">{lang === 'ar' ? 'رجال فقط' : 'Men Only'}</option>
                            <option value="women">{lang === 'ar' ? 'نساء فقط' : 'Women Only'}</option>
                            <option value="boys">{lang === 'ar' ? 'أولاد فقط' : 'Boys Only'}</option>
                            <option value="girls">{lang === 'ar' ? 'بنات فقط' : 'Girls Only'}</option>
                          </select>
                          <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none ${
                            lang === 'ar' ? 'left-3.5' : 'right-3.5'
                          }`} />
                        </div>
                      </div>

                      {/* Options Checkboxes */}
                      <div className="flex flex-col justify-center space-y-2.5 pt-2">
                        {/* Drop-In Checkbox */}
                        <label className={`flex items-center gap-2 cursor-pointer font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                          <input
                            type="checkbox"
                            checked={hostNewCenter.dropInWelcomed}
                            onChange={e => setHostNewCenter({ ...hostNewCenter, dropInWelcomed: e.target.checked })}
                            className="accent-emerald-700 w-4 h-4 rounded cursor-pointer"
                            id="center-dropin-checkbox"
                          />
                          🤝 {t.welcomeVisitors}
                        </label>

                        {/* Offers Courses Checkbox */}
                        <label className={`flex items-center gap-2 cursor-pointer font-bold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                          <input
                            type="checkbox"
                            checked={hostNewCenter.offersCourses}
                            onChange={e => setHostNewCenter({ ...hostNewCenter, offersCourses: e.target.checked })}
                            className="accent-emerald-700 w-4 h-4 rounded cursor-pointer"
                            id="center-offerscourses-checkbox-form"
                          />
                          🎓 {t.offersCoursesLabel || (lang === 'ar' ? 'تقدم دورات ومحاضرات' : 'Offers courses & seminars')}
                        </label>
                      </div>
                    </div>

                    {/* Supported Languages Checklist */}
                    <div>
                      <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                        🌐 {lang === 'ar' ? 'لغات التواصل المتحدثة' : 'Communication Languages'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-2xl border bg-stone-50/50 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800">
                        {[
                          { id: 'العربية', label: lang === 'ar' ? 'العربية' : 'Arabic' },
                          { id: 'الإنجليزية', label: lang === 'ar' ? 'الإنجليزية' : 'English' },
                          { id: 'الفرنسية', label: lang === 'ar' ? 'الفرنسية' : 'French' },
                          { id: 'التركية', label: lang === 'ar' ? 'التركية' : 'Turkish' },
                          { id: 'الملايوية', label: lang === 'ar' ? 'الملايوية' : 'Malay' },
                        ].map(langOption => {
                          const isChecked = hostNewCenter.languages.includes(langOption.id);
                          return (
                            <label key={langOption.id} className="flex items-center gap-2 cursor-pointer text-xs select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const updated = e.target.checked
                                    ? [...hostNewCenter.languages, langOption.id]
                                    : hostNewCenter.languages.filter(l => l !== langOption.id);
                                  setHostNewCenter({ ...hostNewCenter, languages: updated });
                                }}
                                className="accent-emerald-700 w-4 h-4 rounded"
                              />
                              <span className={isChecked ? 'font-bold text-emerald-800 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400'}>
                                {langOption.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recitation Styles Checklist */}
                    <div>
                      <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                        📖 {lang === 'ar' ? 'روايات التلاوة المعتمدة' : 'Quranic Recitations'}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-2xl border bg-stone-50/50 dark:bg-stone-850/40 border-stone-200 dark:border-stone-800">
                        {[
                          { id: 'ورش', label: lang === 'ar' ? 'ورش عن نافع' : 'Warsh' },
                          { id: 'حفص', label: lang === 'ar' ? 'حفص عن عاصم' : 'Hafs' },
                          { id: 'قالون', label: lang === 'ar' ? 'قالون عن نافع' : 'Qalun' },
                          { id: 'الدوري', label: lang === 'ar' ? 'الدوري عن أبي عمرو' : 'Al-Duri' },
                          { id: 'بدون حفظ', label: lang === 'ar' ? 'لا يوجد محفظ' : 'None (Unsupported Hifz)' },
                        ].map(recOption => {
                          const isChecked = hostNewCenter.recitationStyles.includes(recOption.id);
                          return (
                            <label key={recOption.id} className="flex items-center gap-2 cursor-pointer text-xs select-none">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const updated = e.target.checked
                                    ? [...hostNewCenter.recitationStyles, recOption.id]
                                    : hostNewCenter.recitationStyles.filter(r => r !== recOption.id);
                                  setHostNewCenter({ ...hostNewCenter, recitationStyles: updated });
                                }}
                                className="accent-emerald-700 w-4 h-4 rounded"
                              />
                              <span className={isChecked ? 'font-bold text-emerald-800 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400'}>
                                {recOption.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                     {/* Host Contacts */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{lang === 'ar' ? 'البريد الإلكتروني للتواصل (اختياري)' : 'Contact Email (Optional)'}</label>
                        <input
                          type="email"
                          placeholder="contact@katatib.ma"
                          value={hostNewCenter.contactEmail}
                          onChange={e => setHostNewCenter({ ...hostNewCenter, contactEmail: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                            darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                          }`}
                          id="center-email-input"
                        />
                      </div>
                      <div>
                        <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{lang === 'ar' ? 'رقم الهاتف للتواصل *' : 'Contact Phone *'}</label>
                        <input
                          type="text"
                          required
                          placeholder="+212 6 1234 5678"
                          value={hostNewCenter.contactPhone}
                          onChange={e => setHostNewCenter({ ...hostNewCenter, contactPhone: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                            darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                          }`}
                          id="center-phone-input"
                        />
                      </div>
                    </div>

                    {/* Detailed Description */}
                    <div>
                      <label className={`block font-bold mb-1.5 ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{t.detailedCircleDesc}</label>
                      <textarea
                        required
                        placeholder={lang === 'ar' ? 'اذكر تفاصيل هيكل الحلقة، المتطلبات، آلية الاستقبال، وموقع الحلقة بدقة داخل المسجد أو المجمع...' : 'Detail the circle structure, requirements, welcoming process, specific location coordinates details within the building or complex...'}
                        rows={8}
                        value={hostNewCenter.description}
                        onChange={e => setHostNewCenter({ ...hostNewCenter, description: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-2xl resize-y min-h-[180px] focus:ring-2 focus:ring-emerald-500/20 focus:border-[#064E3B] transition ${
                          darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-stone-50 border-stone-200 text-stone-900'
                        }`}
                        minLength={10}
                        maxLength={2000}
                        id="center-desc-textarea"
                      />
                    </div>

                    {centerFormError && (
                      <p className="text-red-500 font-bold flex items-center gap-1.5 text-[11px] mt-1">
                        <AlertCircle className="w-4 h-4" />
                        {centerFormError}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSubmittingCenter}
                        className="flex-1 w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-2xl shadow border border-emerald-950 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        id="host-submit-center-btn"
                      >
                        {isSubmittingCenter 
                          ? (t.submittingRegistry || (lang === 'ar' ? 'جاري تسجيل الجمعية...' : 'Publishing Registry...')) 
                          : (editingCenterId ? (t.saveChangesBtn || (lang === 'ar' ? 'حفظ التعديلات وإرسال للمراجعة' : 'Save Changes & Resubmit')) : (t.publishCircleBtn || (lang === 'ar' ? 'نشر الجمعية القرآنية' : 'Publish Memorization Association')))}
                      </button>
                      
                      {editingCenterId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCenterId(null);
                            setHostNewCenter({
                              name: '',
                              description: '',
                              lat: '34.0333',
                              lng: '-5.0000',
                              address: '',
                              city: 'Fes',
                              country: 'Morocco',
                              dropInWelcomed: true,
                              gender: 'mixed',
                              ageGroups: [],
                              languages: ['العربية'],
                              recitationStyles: ['ورش'],
                              operatingHours: '',
                              teacherName: '',
                              contactEmail: '',
                              contactPhone: ''
                            });
                          }}
                          className="flex-1 w-full py-3.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-2xl border border-stone-250 dark:border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {t.cancelEditBtn}
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Left Side: Host Listed Centers: MD column 5 */}
                <div className="md:col-span-5 space-y-4">
                  <h3 className={`text-base font-bold font-serif pb-3 border-b flex items-center gap-2 px-1 ${
                    darkMode ? 'text-white border-stone-800' : 'text-stone-950 border-stone-150'
                  }`}>
                    <UserIcon className="w-5 h-5 text-emerald-650" />
                    {t.yourListlistings} ({centers.filter(c => c.createdBy === user.uid).length})
                  </h3>

                  {centers.filter(c => c.createdBy === user.uid).length === 0 ? (
                    <div className={`border rounded-[2.5rem] p-8 text-center space-y-3 shadow-sm ${
                      darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                    }`}>
                      <Compass className="w-12 h-12 text-stone-200 mx-auto" />
                      <h5 className={`text-sm font-bold font-serif ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>{t.noRegisteredCenters}</h5>
                      <p className={`text-xs leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-400'}`}>
                        {t.noRegisteredCentersDesc}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {centers.filter(c => c.createdBy === user.uid).map(center => (
                        <div key={center.id} className={`border rounded-[2.5rem] p-6 shadow-sm space-y-4 relative overflow-hidden ${
                          darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                        }`}>
                          {/* Label tag */}
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                                darkMode ? 'bg-stone-885 border-stone-750 text-stone-400' : 'bg-stone-50 border-stone-100 text-stone-400'
                              }`}>
                                📍 {center.city}, {center.country}
                              </span>
                              <h4 className={`text-base md:text-lg font-bold font-serif leading-snug mt-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                {center.name}
                              </h4>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="bg-amber-50 text-amber-900 font-serif font-bold text-xs px-2.5 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                                ★ {center.averageRating?.toFixed(1) || '0.0'}
                              </span>
                              {center.isApproved === false ? (
                                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/20">
                                  {center.moderationNote ? t.needsAttention : t.moderationPending}
                                </span>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                  {t.moderationApproved}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Moderation note banner if rejected/unapproved */}
                          {center.isApproved === false && center.moderationNote && (
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
                              <p className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                ⚠️ {t.needsAttention}
                              </p>
                              <p className={`${darkMode ? 'text-stone-300' : 'text-stone-700'} font-medium`}>
                                <strong className="opacity-80">{t.adminNote}</strong> {center.moderationNote}
                              </p>
                            </div>
                          )}

                          <div className={`flex items-center justify-between text-xs pt-3.5 border-t ${
                            darkMode ? 'border-stone-800' : 'border-stone-100'
                          }`}>
                            <span className="text-stone-400 font-bold uppercase tracking-wider text-[9px]">
                              {center.reviewsCount || 0} {lang === 'ar' ? 'تقييمات مسجلة' : 'reviews written'}
                            </span>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => handleStartEdit(center)}
                                className="text-amber-650 dark:text-amber-400 hover:underline font-bold transition cursor-pointer"
                                id={`edit-center-${center.id}`}
                              >
                                {t.editBtn}
                              </button>
                              <button
                                onClick={() => handleDeleteCenter(center.id)}
                                className="text-red-500 hover:text-red-600 font-bold transition cursor-pointer hover:underline"
                                id={`delete-center-${center.id}`}
                              >
                                {t.deleteListing}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 3: ABOUT TAB (HERITAGE / ESSAY) --- */}
        {activeTab === 'about' && (
          <div className="max-w-3xl mx-auto space-y-8 text-start py-4">
            
            {/* Header branding */}
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto font-serif text-3xl font-bold border shadow-sm ${
                darkMode ? 'bg-stone-850 border-stone-800 text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
              }`}>
                الكتّاب
              </div>
              <h2 className={`text-3xl md:text-4xl font-serif font-bold tracking-tight ${darkMode ? 'text-white' : 'text-[#064E3B]'}`}>
                {t.aboutTitle}
              </h2>
              <div className="w-16 h-1 bg-emerald-650 mx-auto rounded-full" />
              <p className="text-[10px] text-stone-500 font-bold tracking-widest uppercase">
                {t.aboutSubtitle}
              </p>
            </div>

            {/* Editorial Content */}
            <article className={`prose max-w-none text-xs md:text-sm leading-relaxed space-y-5 ${
              darkMode ? 'prose-invert text-stone-300' : 'prose-slate text-stone-600'
            }`}>
              
              <p>
                {lang === 'ar' ? (
                  <>على مر القرون في العالم الإسلامي، كانت <strong>الجمعيات التقليدية</strong> بمثابة الصرح الأول لتلقي العلم وحفظ كتاب الله وترسيخ الهوية الإيمانية. فقبل ظهور المجمعات الأكاديمية الضخمة والجامعات المعاصرة، كانت جمعيات العلم المتواضعة هذه - التي غالبًا ما تلتئم في أفنية المساجد، أو تحت ظلال أشجار الزيتون، أو في غرف ملحقة مخصصة - بمثابة نبض الأمة الحافظ للقرآن الكريم ورواياته. هنا، كان الصغار والكبار يجلسون جنبًا إلى جنب على الحصر المنسوجة، يخطون الآيات بالدواة والفحم على الألواح الخشبية.</>
                ) : (
                  <>For centuries throughout the Muslim world, traditional <strong>Associations</strong> served as the primary sanctuary for literacy and spiritual cultivation. Long before the advent of massive academic complexes, these humble learning associations—often nestled in mosque courtyards, under olive trees, or in dedicated community halls—were the beating heart of Islamic preservation. Here, children and adults alike would sit shoulder-to-shoulder on woven carpets, writing Quranic verses with charcoal ink onto wooden boards (<em>Lauh</em>).</>
                )}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                <div className="bg-emerald-900 text-amber-50 p-6 rounded-[2.5rem] border border-emerald-950 shadow-sm flex flex-col justify-between">
                  <h4 className="font-serif italic text-base text-white mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {t.aboutSpiritual}
                  </h4>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    {t.aboutSpiritualDesc}
                  </p>
                </div>
                <div className={`border p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-between ${
                  darkMode ? 'bg-stone-900 border-stone-850' : 'bg-[#F9F8F6] border-stone-200'
                }`}>
                  <h4 className={`font-serif italic text-base mb-2 flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    <Heart className="w-4 h-4 text-emerald-500" />
                    {t.aboutBrotherhood}
                  </h4>
                  <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {t.aboutBrotherhoodDesc}
                  </p>
                </div>
              </div>

              <h3 className={`font-serif font-bold text-lg border-b pb-2 ${darkMode ? 'text-white border-stone-800' : 'text-stone-900 border-stone-100'}`}>
                {t.whyTravelersNeed}
              </h3>
              <p>
                {lang === 'ar' ? (
                  <>عندما تسافر العائلات المسلمة أو الطلاب أو الرحالة الرقميون لقضاء الإجازات أو العمل، غالبًا ما يتعرض روتينهم اليومي لتلاوة وحفظ القرآن الكريم للانقطاع. وبينما يسهل العثور على مساجد لأداء الصلوات المكتوبة، فإن الاندماج في جمعية تحفيظ محلية يواجه عدة عقبات وصعوبات:</>
                ) : (
                  <>When Muslim families, digital nomads, or students travel for holidays, their daily Quran routines are easily disrupted. While finding mosques to pray in is simple, plugging into a structured Quran memorization association is full of friction:</>
                )}
              </p>
              
              <ul className={`list-disc list-inside space-y-1.5 pl-2 font-medium ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                <li><strong>{lang === 'ar' ? 'غياب الرؤية والوصول:' : 'No visibility:'}</strong> {t.why1}</li>
                <li><strong>{lang === 'ar' ? 'العوائق اللغوية والرواية:' : 'Language barriers:'}</strong> {t.why2}</li>
                <li><strong>{lang === 'ar' ? 'عراقيل التسجيل والالتزام:' : 'Enrollment friction:'}</strong> {t.why3}</li>
              </ul>

              <p>
                {t.whyConclusion}
              </p>

              <div className="p-5 bg-emerald-950/40 text-emerald-300 rounded-2xl border border-emerald-900/30 text-xs leading-relaxed font-bold">
                {t.aboutPledge}
              </div>
            </article>
          </div>
        )}

        {/* --- VIEW 4: ADMIN PORTAL --- */}
        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-8 py-4 animate-fade-in text-start font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Header section */}
            <div className={`p-8 rounded-[2.5rem] border ${
              darkMode ? 'bg-gradient-to-br from-amber-950/20 to-stone-900 border-stone-800' : 'bg-gradient-to-br from-amber-50/40 to-[#FCFBF9] border-stone-200'
            } relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className={`text-2xl md:text-3xl font-serif font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    {t.adminBannerTitle}
                  </h2>
                  <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                    {t.adminBannerDesc}
                  </p>
                </div>
              </div>

              {/* Reset/Seeding action for administrator */}
              <button
                onClick={handleResetAndSeedDatabase}
                className="relative z-10 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-600 shadow-sm md:self-center shrink-0"
              >
                <Database className="w-4 h-4" />
                {lang === 'ar' ? "إعادة تهيئة قاعدة البيانات بالبيانات العربية" : "Reset & Seed with Arabic Data"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Right column: Pending registrations (col-span-7) */}
              <div className="lg:col-span-7 space-y-5">
                <h3 className={`text-lg font-bold font-serif pb-2 border-b flex items-center gap-2 px-1 ${
                  darkMode ? 'text-white border-stone-800' : 'text-stone-950 border-stone-200'
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  {t.pendingCenters} ({centers.filter(c => c.isApproved === false).length})
                </h3>

                {centers.filter(c => c.isApproved === false).length === 0 ? (
                  <div className={`border rounded-[2.5rem] p-12 text-center space-y-4 ${
                    darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}>
                    <div className="w-16 h-16 bg-stone-100 dark:bg-stone-850 rounded-full flex items-center justify-center mx-auto text-stone-300 dark:text-stone-700">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold font-serif ${darkMode ? 'text-stone-300' : 'text-stone-800'}`}>
                        {t.noPending}
                      </h4>
                      <p className="text-stone-400 text-xs mt-1.5">
                        {lang === 'ar' ? 'جميع الطلبات المقدمة تمت مراجعتها واعتمادها بنجاح.' : 'All submitted requests have been reviewed and approved.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {centers.filter(c => c.isApproved === false).map(center => {
                      const isExpanded = !!expandedPendingCenters[center.id];
                      return (
                        <div 
                          key={center.id} 
                          className={`border rounded-3xl p-5 shadow-xs transition-all space-y-4 ${
                            darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-150'
                          }`}
                        >
                          {/* Top row: Summary */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 flex-1 text-start">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-amber-100/50 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30 text-[9px] font-extrabold px-2 py-0.5 rounded border border-amber-200">
                                  {t.moderationPending}
                                </span>
                              </div>
                              <h4 className={`text-sm font-bold font-serif truncate mt-1.5 ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                                {center.name}
                              </h4>
                              <p className="text-[10px] text-stone-400 font-medium mt-1 font-sans">
                                📍 {center.city}, {center.country} &bull; 👤 {center.teacherName}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => setExpandedPendingCenters(prev => ({ ...prev, [center.id]: !prev[center.id] }))}
                              className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition cursor-pointer border shrink-0 ${
                                isExpanded 
                                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isExpanded 
                                ? (lang === 'ar' ? 'إخفاء التفاصيل' : 'Hide details') 
                                : (lang === 'ar' ? 'عرض التفاصيل' : 'Show details')}
                            </button>
                          </div>

                          {/* Expanded detailed content */}
                          {isExpanded && (
                            <div className="space-y-3.5 pt-3.5 border-t border-stone-100 dark:border-stone-800 text-xs text-start animate-fade-in font-sans">
                              
                              {/* Grid of basic specs */}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-0.5">{lang === 'ar' ? 'الفئة المستهدفة' : 'Gender Target'}</p>
                                  <p className={`font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{getGenderLabel(center.gender)}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-0.5">{lang === 'ar' ? 'أوقات العمل' : 'Operating Hours'}</p>
                                  <p className={`font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{center.operatingHours}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl border col-span-2 ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-0.5">{lang === 'ar' ? 'العنوان الكامل' : 'Full Address'}</p>
                                  <p className={`font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{center.address}</p>
                                </div>
                              </div>

                              {/* Description */}
                              <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/40 border-stone-800' : 'bg-stone-50/50 border-stone-100'}`}>
                                <p className="text-stone-400 text-[9px] font-bold mb-1">{lang === 'ar' ? 'نبذة عن الجمعية' : 'About the Association'}</p>
                                <p className={`leading-relaxed text-[11px] ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{center.description}</p>
                              </div>

                              {/* Contact section */}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-1 flex items-center gap-1 font-sans">
                                    <Mail className="w-3 h-3 text-emerald-500" />
                                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Contact Email'}
                                  </p>
                                  <p className={`font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`} title={center.contactEmail || 'N/A'}>
                                    {center.contactEmail || (lang === 'ar' ? 'غير متوفر' : 'Not provided')}
                                  </p>
                                </div>
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-1 flex items-center gap-1 font-sans">
                                    <Phone className="w-3 h-3 text-emerald-500" />
                                    {lang === 'ar' ? 'رقم الهاتف' : 'Contact Phone'}
                                  </p>
                                  <p className={`font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`} title={center.contactPhone || 'N/A'}>
                                    {center.contactPhone || (lang === 'ar' ? 'غير متوفر' : 'Not provided')}
                                  </p>
                                </div>
                              </div>

                              {/* Drop-in Welcome */}
                              <div className={`p-3 rounded-xl border text-[11px] flex items-center justify-between gap-1 ${darkMode ? 'bg-stone-850/30 border-stone-800' : 'bg-stone-50/30 border-stone-100'}`}>
                                <span className="text-stone-400 text-[9px] font-bold">{lang === 'ar' ? 'الزوار العابرون:' : 'Drop-in Visitors:'}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  center.dropInWelcomed 
                                    ? (darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                                    : (darkMode ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-700')
                                }`}>
                                  {center.dropInWelcomed 
                                    ? (lang === 'ar' ? 'مرحب بهم' : 'Welcomed') 
                                    : (lang === 'ar' ? 'يتطلب تنسيقاً' : 'Prior RSVP')}
                                </span>
                              </div>

                              {/* Submitter ID */}
                              <div className="flex items-center justify-between text-[9px] text-stone-400">
                                <span>{lang === 'ar' ? 'مُعرّف المسجل:' : 'Registered by:'}</span>
                                <span className="font-mono bg-stone-100 dark:bg-stone-850 px-1 py-0.5 rounded text-[8px]">
                                  {center.createdBy || 'System / Pre-seeded'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Moderator controls */}
                          <div className="flex items-center gap-3 pt-3 border-t border-stone-100 dark:border-stone-850 font-sans">
                            <button
                              onClick={() => handleApproveCenter(center.id)}
                              className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-2xl border border-emerald-900 transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                              id="admin-approve-center-btn"
                            >
                              <Check className="w-4 h-4" />
                              {t.approveBtn}
                            </button>
                            <button
                              onClick={() => handleRejectCenter(center.id)}
                              className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-xs font-bold rounded-2xl border border-red-200 dark:border-red-900/30 transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              {t.rejectBtn}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Left column: Approved Centers (col-span-5) */}
              <div className="lg:col-span-5 space-y-5">
                <h3 className={`text-lg font-bold font-serif pb-2 border-b flex items-center gap-2 px-1 ${
                  darkMode ? 'text-white border-stone-800' : 'text-stone-950 border-stone-200'
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {t.approvedCenters} ({centers.filter(c => c.isApproved !== false).length})
                </h3>

                {centers.filter(c => c.isApproved !== false).length === 0 ? (
                  <p className="text-xs text-stone-500 font-bold px-1">{lang === 'ar' ? 'لا توجد حلقات معتمدة حالياً.' : 'No approved centers yet.'}</p>
                ) : (
                  <div className="space-y-3.5">
                    {centers.filter(c => c.isApproved !== false).map(center => {
                      const isExpanded = !!expandedApprovedCenters[center.id];
                      return (
                        <div 
                          key={center.id} 
                          className={`border rounded-3xl p-5 shadow-xs transition-all space-y-4 ${
                            darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-150'
                          }`}
                        >
                          {/* Top row: Summary */}
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0 flex-1 text-start">
                              <h4 className={`text-sm font-bold font-serif truncate ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>
                                {center.name}
                              </h4>
                              <p className="text-[10px] text-stone-400 font-medium mt-1">
                                📍 {center.city}, {center.country} &bull; 👤 {center.teacherName}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => setExpandedApprovedCenters(prev => ({ ...prev, [center.id]: !prev[center.id] }))}
                              className={`px-2.5 py-1 rounded-xl text-[9px] font-bold transition cursor-pointer border shrink-0 ${
                                isExpanded 
                                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {isExpanded 
                                ? (lang === 'ar' ? 'إخفاء التفاصيل' : 'Hide details') 
                                : (lang === 'ar' ? 'عرض التفاصيل' : 'Show details')}
                            </button>
                          </div>

                          {/* Expanded detailed content */}
                          {isExpanded && (
                            <div className="space-y-3.5 pt-3.5 border-t border-stone-100 dark:border-stone-800 text-xs text-start animate-fade-in">
                              
                              {/* Grid of basic specs */}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-0.5">{lang === 'ar' ? 'الفئة المستهدفة' : 'Gender Target'}</p>
                                  <p className={`font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{getGenderLabel(center.gender)}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-0.5">{lang === 'ar' ? 'أوقات العمل' : 'Operating Hours'}</p>
                                  <p className={`font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{center.operatingHours}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl border col-span-2 ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-0.5">{lang === 'ar' ? 'العنوان الكامل' : 'Full Address'}</p>
                                  <p className={`font-bold ${darkMode ? 'text-stone-200' : 'text-stone-800'}`}>{center.address}</p>
                                </div>
                              </div>

                              {/* Description */}
                              <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/40 border-stone-800' : 'bg-stone-50/50 border-stone-100'}`}>
                                <p className="text-stone-400 text-[9px] font-bold mb-1">{lang === 'ar' ? 'نبذة عن الجمعية' : 'About the Association'}</p>
                                <p className={`leading-relaxed text-[11px] ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>{center.description}</p>
                              </div>

                              {/* Contact section */}
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-1 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-emerald-500" />
                                    {lang === 'ar' ? 'البريد الإلكتروني' : 'Contact Email'}
                                  </p>
                                  <p className={`font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`} title={center.contactEmail || 'N/A'}>
                                    {center.contactEmail || (lang === 'ar' ? 'غير متوفر' : 'Not provided')}
                                  </p>
                                </div>
                                <div className={`p-2.5 rounded-xl border ${darkMode ? 'bg-stone-850/60 border-stone-800' : 'bg-stone-50 border-stone-100'}`}>
                                  <p className="text-stone-400 text-[9px] font-bold mb-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-500" />
                                    {lang === 'ar' ? 'رقم الهاتف' : 'Contact Phone'}
                                  </p>
                                  <p className={`font-bold truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`} title={center.contactPhone || 'N/A'}>
                                    {center.contactPhone || (lang === 'ar' ? 'غير متوفر' : 'Not provided')}
                                  </p>
                                </div>
                              </div>

                              {/* Drop-in Welcome */}
                              <div className={`p-3 rounded-xl border text-[11px] flex items-center justify-between gap-1 ${darkMode ? 'bg-stone-850/30 border-stone-800' : 'bg-stone-50/30 border-stone-100'}`}>
                                <span className="text-stone-400 text-[9px] font-bold">{lang === 'ar' ? 'الزوار العابرون:' : 'Drop-in Visitors:'}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  center.dropInWelcomed 
                                    ? (darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-700')
                                    : (darkMode ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-700')
                                }`}>
                                  {center.dropInWelcomed 
                                    ? (lang === 'ar' ? 'مرحب بهم' : 'Welcomed') 
                                    : (lang === 'ar' ? 'يتطلب تنسيقاً' : 'Prior RSVP')}
                                </span>
                              </div>

                              {/* Submitter ID */}
                              <div className="flex items-center justify-between text-[9px] text-stone-400">
                                <span>{lang === 'ar' ? 'مُعرّف المسجل:' : 'Registered by:'}</span>
                                <span className="font-mono bg-stone-100 dark:bg-stone-850 px-1 py-0.5 rounded text-[8px]">
                                  {center.createdBy || 'System / Pre-seeded'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action controls */}
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-850">
                            {/* Revoke / Unaccept button */}
                            <button
                              onClick={() => handleRevokeCenter(center.id)}
                              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold rounded-xl transition cursor-pointer text-[10px]"
                              title={t.unacceptBtn}
                            >
                              {lang === 'ar' ? 'إلغاء الاعتماد' : 'Unapprove'}
                            </button>
                            
                            {/* Delete button */}
                            <button
                              onClick={() => handleRejectCenter(center.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 font-bold rounded-xl transition cursor-pointer text-[10px]"
                              title={lang === 'ar' ? 'حذف الجمعية نهائياً' : 'Delete permanently'}
                            >
                              {lang === 'ar' ? 'حذف' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className={`mt-auto border-t transition-colors duration-300 ${
        darkMode ? 'bg-stone-950 border-stone-850 text-stone-400' : 'bg-[#FCFBF9] border-stone-200 text-stone-500'
      } py-8 px-4 md:px-8`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold">
          
          {/* Logo brand */}
          <div className={`flex items-center gap-2 font-bold ${darkMode ? 'text-emerald-500' : 'text-[#064E3B]'}`}>
            <span className="font-serif">{lang === 'ar' ? 'بوابة كتاتيب الرقمية' : 'Katatib Portal'}</span>
            <span>&bull;</span>
            <span className="font-sans">{lang === 'ar' ? 'إحياء تراث الكتّاب القرآني' : 'Reviving the Kuttab Heritage'}</span>
          </div>

          {/* Quick links */}
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('discover')} className="hover:text-emerald-500 cursor-pointer">{lang === 'ar' ? 'استكشف' : 'Explore'}</button>
            <button onClick={() => setActiveTab('host')} className="hover:text-emerald-500 cursor-pointer">{lang === 'ar' ? 'مركز المستضيف' : 'Host Hub'}</button>
            <button onClick={() => setActiveTab('about')} className="hover:text-emerald-500 cursor-pointer">{lang === 'ar' ? 'التراث الأصيل' : 'Heritage'}</button>
          </div>

          <div className="text-stone-500 dark:text-stone-400">
            &copy; {new Date().getFullYear()} Katatib. {lang === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>

      {/* --- CUSTOM IFRAME-SAFE TOAST SYSTEM --- */}
      {toast.show && (
        <div className="fixed bottom-5 left-5 z-50 max-w-sm pointer-events-auto animate-fade-in" style={{ animationDuration: '250ms' }}>
          <div className={`rounded-3xl p-4 shadow-xl border flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-900 border-emerald-950 text-emerald-100' 
              : toast.type === 'error'
              ? 'bg-red-950 border-red-900 text-red-200'
              : 'bg-stone-900 border-stone-850 text-stone-100'
          }`}>
            <span className="text-base leading-none">
              {toast.type === 'success' ? '✨' : toast.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <div className="text-xs font-semibold font-sans text-start flex-1 whitespace-pre-line leading-relaxed">
              {toast.message}
            </div>
            <button 
              onClick={hideToast}
              className="p-1 hover:bg-white/10 rounded-full transition cursor-pointer text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* --- CUSTOM IFRAME-SAFE CONFIRMATION MODAL --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className={`w-full max-w-md rounded-[2rem] p-6 shadow-2xl border text-start animate-scale-in ${
            darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {confirmModal.title}
            </h3>
            <p className={`mt-3 text-xs leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
              {confirmModal.message}
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                  darkMode ? 'border-stone-800 hover:bg-stone-800 text-stone-300' : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                {confirmModal.cancelText || (lang === 'ar' ? 'إلغاء' : 'Cancel')}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition cursor-pointer ${
                  confirmModal.isDanger 
                    ? 'bg-red-650 hover:bg-red-700' 
                    : 'bg-emerald-800 hover:bg-emerald-900'
                }`}
              >
                {confirmModal.confirmText || (lang === 'ar' ? 'تأكيد' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM IFRAME-SAFE PROMPT MODAL --- */}
      {promptModal.isOpen && (
        <PromptModalInner 
          promptModal={promptModal}
          setPromptModal={setPromptModal}
          darkMode={darkMode}
          lang={lang}
        />
      )}
    </div>
  );
}

// Inner Component for prompt modal text inputs to keep key transitions smooth
function PromptModalInner({ promptModal, setPromptModal, darkMode, lang }: {
  promptModal: any;
  setPromptModal: any;
  darkMode: boolean;
  lang: string;
}) {
  const [val, setVal] = useState(promptModal.initialValue || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className={`w-full max-w-md rounded-[2rem] p-6 shadow-2xl border text-start animate-scale-in ${
        darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
      }`}>
        <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
          {promptModal.title}
        </h3>
        <p className={`mt-2 text-xs leading-relaxed ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          {promptModal.message}
        </p>
        <div className="mt-4">
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={promptModal.placeholder}
            rows={3}
            className={`w-full p-3.5 rounded-2xl text-xs border focus:outline-hidden focus:ring-1 focus:ring-emerald-600 ${
              darkMode 
                ? 'bg-stone-850 border-stone-800 text-white placeholder-stone-500' 
                : 'bg-stone-50 border-stone-200 text-stone-950 placeholder-stone-400'
            }`}
            autoFocus
          />
        </div>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={() => setPromptModal((prev: any) => ({ ...prev, isOpen: false }))}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
              darkMode ? 'border-stone-800 hover:bg-stone-800 text-stone-300' : 'border-stone-200 hover:bg-stone-50 text-stone-600'
            }`}
          >
            {promptModal.cancelText || (lang === 'ar' ? 'إلغاء' : 'Cancel')}
          </button>
          <button
            onClick={() => promptModal.onConfirm(val)}
            className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-emerald-800 hover:bg-emerald-900 transition cursor-pointer"
          >
            {promptModal.confirmText || (lang === 'ar' ? 'تأكيد' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
