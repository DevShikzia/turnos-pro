import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  ServiceDTO,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class ServicesApi {
  private api = inject(ApiClientService);

  list(params?: ServiceQueryParams): Observable<PaginatedResponse<ServiceDTO>> {
    return this.api.get<PaginatedResponse<ServiceDTO>>('/services', params);
  }

  getById(id: string): Observable<ApiResponse<ServiceDTO>> {
    return this.api.get<ApiResponse<ServiceDTO>>(`/services/${id}`);
  }

  create(data: CreateServiceRequest): Observable<ApiResponse<ServiceDTO>> {
    return this.api.post<ApiResponse<ServiceDTO>>('/services', data);
  }

  update(id: string, data: UpdateServiceRequest): Observable<ApiResponse<ServiceDTO>> {
    return this.api.patch<ApiResponse<ServiceDTO>>(`/services/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<ServiceDTO>> {
    return this.api.delete<ApiResponse<ServiceDTO>>(`/services/${id}`);
  }
}
