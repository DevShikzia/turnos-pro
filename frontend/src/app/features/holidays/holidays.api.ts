import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import { ApiResponse, PaginatedResponse } from '@shared/models/api.types';

export interface HolidayDTO {
  _id: string;
  date: string;
  name: string;
  description?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHolidayRequest {
  date: string;
  name: string;
  description?: string;
  isRecurring?: boolean;
}

export interface UpdateHolidayRequest {
  date?: string;
  name?: string;
  description?: string;
  isRecurring?: boolean;
  isActive?: boolean;
}

export interface HolidayQueryParams {
  dateFrom?: string;
  dateTo?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class HolidaysApi {
  private api = inject(ApiClientService);

  list(params?: HolidayQueryParams): Observable<PaginatedResponse<HolidayDTO>> {
    return this.api.get<PaginatedResponse<HolidayDTO>>('/holidays', params);
  }

  getById(id: string): Observable<ApiResponse<HolidayDTO>> {
    return this.api.get<ApiResponse<HolidayDTO>>(`/holidays/${id}`);
  }

  getInRange(dateFrom: string, dateTo: string): Observable<ApiResponse<string[]>> {
    return this.api.get<ApiResponse<string[]>>('/holidays/range', { dateFrom, dateTo });
  }

  create(data: CreateHolidayRequest): Observable<ApiResponse<HolidayDTO>> {
    return this.api.post<ApiResponse<HolidayDTO>>('/holidays', data);
  }

  update(id: string, data: UpdateHolidayRequest): Observable<ApiResponse<HolidayDTO>> {
    return this.api.patch<ApiResponse<HolidayDTO>>(`/holidays/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<HolidayDTO>> {
    return this.api.delete<ApiResponse<HolidayDTO>>(`/holidays/${id}`);
  }
}
