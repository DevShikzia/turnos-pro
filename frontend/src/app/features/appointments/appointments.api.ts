import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  AppointmentDTO,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  UpdateAppointmentStatusRequest,
  AppointmentQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsApi {
  private api = inject(ApiClientService);

  list(params?: AppointmentQueryParams): Observable<PaginatedResponse<AppointmentDTO>> {
    return this.api.get<PaginatedResponse<AppointmentDTO>>('/appointments', params);
  }

  getById(id: string): Observable<ApiResponse<AppointmentDTO>> {
    return this.api.get<ApiResponse<AppointmentDTO>>(`/appointments/${id}`);
  }

  create(data: CreateAppointmentRequest): Observable<ApiResponse<AppointmentDTO>> {
    return this.api.post<ApiResponse<AppointmentDTO>>('/appointments', data);
  }

  update(id: string, data: UpdateAppointmentRequest): Observable<ApiResponse<AppointmentDTO>> {
    return this.api.patch<ApiResponse<AppointmentDTO>>(`/appointments/${id}`, data);
  }

  updateStatus(id: string, data: UpdateAppointmentStatusRequest): Observable<ApiResponse<AppointmentDTO>> {
    return this.api.patch<ApiResponse<AppointmentDTO>>(`/appointments/${id}/status`, data);
  }

  delete(id: string): Observable<ApiResponse<AppointmentDTO>> {
    return this.api.delete<ApiResponse<AppointmentDTO>>(`/appointments/${id}`);
  }
}
