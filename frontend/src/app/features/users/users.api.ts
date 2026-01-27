import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  UserDTO,
  CreateUserRequest,
  UpdateUserRequest,
} from '@shared/models/api.types';

export interface UserQueryParams {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | undefined;
}

@Injectable({
  providedIn: 'root',
})
export class UsersApi {
  private api = inject(ApiClientService);

  list(params?: UserQueryParams): Observable<PaginatedResponse<UserDTO>> {
    return this.api.get<PaginatedResponse<UserDTO>>('/users', params);
  }

  getById(id: string): Observable<ApiResponse<UserDTO>> {
    return this.api.get<ApiResponse<UserDTO>>(`/users/${id}`);
  }

  create(data: CreateUserRequest): Observable<ApiResponse<UserDTO>> {
    return this.api.post<ApiResponse<UserDTO>>('/users', data);
  }

  update(id: string, data: UpdateUserRequest): Observable<ApiResponse<UserDTO>> {
    return this.api.patch<ApiResponse<UserDTO>>(`/users/${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<UserDTO>> {
    return this.api.delete<ApiResponse<UserDTO>>(`/users/${id}`);
  }
}
