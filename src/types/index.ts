export type UserRole = 'USER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  mobile?: string | null;
  email?: string | null;
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  instagram?: string | null;
  role: UserRole;
  createdAt: string;
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'SOLD_OUT' | 'COMPLETED' | 'CANCELLED';

export interface TicketType {
  id: string;
  eventId: string;
  name: string; // e.g. "Early Bird Pass", "Regular Pass"
  price: number; // in INR
  totalAvailable: number;
  soldCount: number;
  remainingCount: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  perks: string[];
  sortOrder: number;
}

export interface CustomField {
  id: string;
  eventId: string;
  fieldLabel: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'email' | 'phone' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'textarea';
  placeholder?: string;
  required: boolean;
  options?: string[];
  displayOrder: number;
}

export interface EventItem {
  id: string;
  slug: string;
  eventNumber: string; // "BAWAL #001"
  title: string; // "The Bowling Social"
  subtitle?: string;
  dateStr: string; // "11/10/26"
  startTime: string; // "11:00 AM"
  endTime: string; // "2:00 PM"
  venue: string; // "Dave & Buster’s Pacific Mall"
  address: string;
  city: string;
  description: string;
  about: string;
  highlights: string[];
  activities: string[];
  rules: string[];
  whatsIncluded: string[];
  whoShouldJoin: string;
  totalCapacity: number; // e.g. 100
  registeredCount: number;
  remainingSpots: number;
  status: EventStatus;
  heroImage: string;
  gallery: string[];
  videoUrl?: string;
  mapEmbedUrl?: string;
  isActive: boolean;
  createdAt: string;
  ticketTypes?: TicketType[];
  customFields?: CustomField[];
  faqs?: EventFaq[];
}

export type RegistrationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type TicketStatus = 'CONFIRMED' | 'USED' | 'CANCELLED';

export interface Registration {
  id: string;
  registrationId: string; // e.g. "BW00101"
  userId: string;
  eventId: string;
  ticketTypeId: string;
  status: RegistrationStatus;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  attendeeAge?: number;
  attendeeGender?: string;
  attendeeInstagram?: string;
  customAnswers?: Record<string, any>;
  amount: number;
  createdAt: string;
  updatedAt: string;
  eventTitle?: string;
  ticketTypeName?: string;
}

export interface Payment {
  id: string;
  registrationId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payuTxnId?: string;
  payuMihpayid?: string;
  payuHash?: string;
  payuMode?: string;
  paymentMethod?: string;
  errorDescription?: string;
  createdAt: string;
  attendeeName?: string;
  registrationCode?: string;
  eventTitle?: string;
}

export interface Ticket {
  id: string;
  ticketId: string; // unique UUID/token
  registrationId: string;
  registrationCode: string; // BW00101
  eventId: string;
  eventTitle: string;
  eventNumber: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  userId: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  ticketTypeName: string;
  price: number;
  status: TicketStatus;
  qrToken: string;
  qrDataUrl: string;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  createdAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface EventFaq {
  id: string;
  eventId?: string | null;
  question: string;
  answer: string;
  displayOrder: number;
}

export interface AdminStats {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  totalRevenue: number;
  ticketsSold: number;
  ticketsRemaining: number;
  earlyBirdSold: number;
  regularSold: number;
}
