import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  ClientDTO,
  CreateClientRequest,
  UpdateClientRequest,
  ClientQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class ClientsApi {
  private api = inject(ApiClientService);

  list(params?: ClientQueryParams): Observable<PaginatedResponse<ClientDTO>> {
    return this.api.get<PaginatedResponse<ClientDTO>>('/clients', params);
  }

  getById(id: string): Observable<ApiResponse<ClientDTO>> {
    return this.api.get<ApiResponse<ClientDTO>>(`/clients/${id}`);
  }

  create(data: CreateClientRequest): Observable<ApiResponse<ClientDTO>> {
    return this.api.post<ApiResponse<ClientDTO>>('/clients', data);
  }

  update(id: string, data: UpdateClientRequest): Observable<ApiResponse<ClientDTO>> {
    return this.api.patch<ApiResponse<ClientDTO>>(`/clients/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<ClientDTO>> {
    return this.api.delete<ApiResponse<ClientDTO>>(`/clients/${id}`);
  }
}
