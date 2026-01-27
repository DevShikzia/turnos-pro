import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  UserDTO,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private api = inject(ApiClientService);

  login(data: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.api.post<ApiResponse<LoginResponse>>('/auth/login', data);
  }

  me(): Observable<ApiResponse<UserDTO>> {
    return this.api.get<ApiResponse<UserDTO>>('/auth/me');
  }
}
