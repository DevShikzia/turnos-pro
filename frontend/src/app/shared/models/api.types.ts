// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

// ============================================
// Auth Types
// ============================================

export type Role = 'admin' | 'staff' | 'receptionist' | 'professional';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
  token: string;
}

export interface SetupAdminRequest {
  email: string;
  password: string;
}

// ============================================
// User Types
// ============================================

export interface UserDTO {
  id: string;
  _id?: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  isActive?: boolean;
}

// ============================================
// Client Types
// ============================================

export interface ClientDTO {
  _id: string;
  fullName: string;
  dni: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  fullName: string;
  dni: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateClientRequest {
  fullName?: string;
  dni?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface ClientQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// Service Types
// ============================================

export interface ServiceDTO {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
}

export interface ServiceQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// Professional Types
// ============================================

export interface ProfessionalDTO {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  services: ServiceDTO[] | string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfessionalRequest {
  fullName: string;
  email?: string;
  phone?: string;
  services: string[];
}

export interface UpdateProfessionalRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  services?: string[];
}

export interface ProfessionalQueryParams {
  search?: string;
  isActive?: boolean;
  serviceId?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// Appointment Types
// ============================================

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';

export interface AppointmentDTO {
  _id: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  clientId: ClientDTO | string;
  professionalId: ProfessionalDTO | string;
  serviceId: ServiceDTO | string;
  createdBy: UserDTO | string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  startAt: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  startAt?: string;
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  notes?: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
}

export interface AppointmentQueryParams {
  professionalId?: string;
  clientId?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============================================
// Availability Types
// ============================================

export interface TimeSlot {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface WeeklySchedule {
  weekday: number; // 1-7 (ISO: 1=Lunes, 7=Domingo)
  slots: TimeSlot[];
}

export interface AvailabilityException {
  date: string; // "YYYY-MM-DD"
  isAvailable: boolean;
  slots?: TimeSlot[];
}

export interface AvailabilityDTO {
  _id?: string;
  professionalId: string;
  serviceId: string | { _id: string; name: string };
  timezone: string;
  weekly: WeeklySchedule[];
  exceptions: AvailabilityException[];
  bufferMin: number;
  durationMin: number;
  price?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilityRequest {
  serviceId: string;
  timezone: string;
  weekly: WeeklySchedule[];
  exceptions: AvailabilityException[];
  bufferMin: number;
  durationMin: number;
  price?: number;
}

export interface AvailableSlot {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  available: boolean;
}

export interface AvailableSlotsResponse {
  professionalId: string;
  timezone: string;
  slots: AvailableSlot[];
}

export interface SlotsQueryParams {
  dateFrom: string;
  dateTo: string;
  serviceId?: string;
  [key: string]: string | undefined;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  todayTotal: number;
  todayConfirmed: number;
  todayCancelled: number;
  todayNoShow: number;
  todayAttended: number;
  todayPending: number;
}

// ============================================
// Location Types
// ============================================

/**
 * locationId: Identificador de la ubicación/sucursal
 * 
 * - "main": Ubicación principal (default para una sola sucursal)
 * - "sucursal-1", "sucursal-2", etc.: IDs específicos para múltiples sucursales
 * 
 * Cada ubicación tiene su propia fila de tickets independiente.
 * Los tickets generados en una ubicación solo se ven en esa ubicación.
 */

// ============================================
// Queue Types
// ============================================

export type TicketType = 'T' | 'C'; // T = Turno, C = Consulta
export type TicketStatus = 'waiting' | 'called' | 'in_service' | 'done' | 'cancelled' | 'no_show';

export interface QueueTicketDTO {
  _id: string;
  dateKey: string;
  locationId: string;
  type: TicketType;
  code: string;
  seq: number;
  dni: string;
  appointmentId?: string;
  status: TicketStatus;
  calledAt?: string;
  deskId?: string;
  receptionistId?: string;
  professionalId?: string;
  /** true si el cliente fue creado desde kiosk y debe completar datos antes de pedir turno */
  clientNeedsData?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  dni: string;
  locationId?: string;
}

export interface CallTicketRequest {
  deskId: string;
}

export interface AssignDeskRequest {
  locationId?: string;
  deskId: string;
}

export interface DeskDTO {
  _id: string;
  locationId: string;
  deskId: string;
  receptionistId: string;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketQueryParams {
  dateKey?: string;
  locationId?: string;
  status?: TicketStatus;
  type?: TicketType;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}
