import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  AvailabilityDTO,
  AvailabilityRequest,
  AvailableSlotsResponse,
  SlotsQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityApi {
  private api = inject(ApiClientService);

  /**
   * Obtiene todas las disponibilidades de un profesional
   */
  getByProfessionalId(professionalId: string, serviceId?: string): Observable<ApiResponse<AvailabilityDTO | AvailabilityDTO[]>> {
    const params = serviceId ? { serviceId } : {};
    return this.api.get<ApiResponse<AvailabilityDTO | AvailabilityDTO[]>>(`/availability/${professionalId}`, params);
  }

  /**
   * Crea o actualiza la disponibilidad de un profesional
   */
  upsert(professionalId: string, data: AvailabilityRequest): Observable<ApiResponse<AvailabilityDTO>> {
    return this.api.put<ApiResponse<AvailabilityDTO>>(`/availability/${professionalId}`, data);
  }

  /**
   * Obtiene los slots disponibles para un profesional
   */
  getSlots(professionalId: string, params: SlotsQueryParams): Observable<ApiResponse<AvailableSlotsResponse>> {
    return this.api.get<ApiResponse<AvailableSlotsResponse>>(
      `/availability/${professionalId}/slots`,
      params
    );
  }
}
