/**
 * Shared Type Definitions for the Katatib Application
 */

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'traveler' | 'host' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface TahfidCenter {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
  dropInWelcomed: boolean;
  gender: 'men' | 'women' | 'boys' | 'girls' | 'mixed';
  ageGroups: string[]; // e.g. ["children", "youth", "adults"]
  languages: string[]; // e.g. ["English", "Arabic", "Turkish"]
  recitationStyles: string[]; // e.g. ["Hafs", "Warsh", "Qalun"]
  operatingHours: string;
  teacherName: string;
  contactEmail?: string;
  contactPhone?: string;
  reviewsCount?: number;
  averageRating?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isApproved?: boolean; // New field for moderator acceptance workflow
  moderationNote?: string; // Feedback from admin/moderator if unapproved/unaccepted
  noQuranHifz?: boolean; // If true, indicates the center does NOT offer/focus on Quran Hifz (memorization), focuses only on recitation/reading
  offersCourses?: boolean; // If true, indicates the center offers academic courses or seminars
}

export interface Review {
  id: string;
  centerId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  travelerOrigin: string; // e.g. "London, UK"
  welcomingScore: number; // 1-5
  createdAt: string;
}
