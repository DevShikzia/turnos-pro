import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  AppointmentDTO,
  AppointmentQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalApi {
  private api = inject(ApiClientService);

  /**
   * Obtiene los turnos del día para el profesional actual
   */
  getTodayAppointments(professionalId: string): Observable<PaginatedResponse<AppointmentDTO>> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const params: AppointmentQueryParams = {
      professionalId,
      dateFrom: startOfDay.toISOString(),
      dateTo: endOfDay.toISOString(),
      page: 1,
      limit: 100,
    };

    return this.api.get<PaginatedResponse<AppointmentDTO>>('/appointments', params);
  }
}
