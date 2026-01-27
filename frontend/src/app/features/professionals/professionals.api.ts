import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  ProfessionalDTO,
  CreateProfessionalRequest,
  UpdateProfessionalRequest,
  ProfessionalQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalsApi {
  private api = inject(ApiClientService);

  list(params?: ProfessionalQueryParams): Observable<PaginatedResponse<ProfessionalDTO>> {
    return this.api.get<PaginatedResponse<ProfessionalDTO>>('/professionals', params);
  }

  getById(id: string): Observable<ApiResponse<ProfessionalDTO>> {
    return this.api.get<ApiResponse<ProfessionalDTO>>(`/professionals/${id}`);
  }

  create(data: CreateProfessionalRequest): Observable<ApiResponse<ProfessionalDTO>> {
    return this.api.post<ApiResponse<ProfessionalDTO>>('/professionals', data);
  }

  update(id: string, data: UpdateProfessionalRequest): Observable<ApiResponse<ProfessionalDTO>> {
    return this.api.patch<ApiResponse<ProfessionalDTO>>(`/professionals/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<ProfessionalDTO>> {
    return this.api.delete<ApiResponse<ProfessionalDTO>>(`/professionals/${id}`);
  }
}
