//API RESPONSE TYPES 

export interface PagedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// EVENT TYPES 

export interface Interest {
  id: number;
  name: string;
  category: string;
  icon?: string;
  description?: string;
  isActive: boolean;
}

export interface EventInterest {
  eventId: number;
  interestId: number;
  weight: number;
  interest: Interest;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  city: string;
  country: string;
  location: string;
  startTime: string;  // ISO 8601 date string
  endTime: string;
  price?: number;
  isFree: boolean;
  coverImage?: string;
  organizerId: number;
  organizer?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  isActive: boolean;
  isPublished: boolean;
  attendeeCount: number;
  viewCount: number;
  likeCount: number;
  maxAttendees?: number;
  isFull: boolean;
  relevanceScore: number;
  eventInterests: EventInterest[];
  createdAt: string;
  updatedAt: string;
}

//  USER TYPES 

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  dateOfBirth?: string;
  city?: string;
  country?: string;
  website?: string;
  profilePicture?: string;
  age?: number;
}

export interface ProfileCompleteness {
  isComplete: boolean;
  percentage: number;
  message: string;
  missingFields: string[];
}

//  AUTH TYPES 

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  token?: string;
  user?: UserProfile;
}

export interface SelectInterestsDto {
  interestIds: number[];
}

// EVENT FILTER TYPES 

export interface EventFilters {
  city?: string;
  country?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isFreeOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  interestIds?: number[];
  limit?: number;
  offset?: number;
  sortBy?: 'date_asc' | 'date_desc' | 'popularity' | 'price_asc' | 'price_desc' | 'relevance';
}