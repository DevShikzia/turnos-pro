import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import { ApiResponse, SetupAdminRequest, UserDTO } from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class SetupAdminApi {
  private api = inject(ApiClientService);

  createAdmin(data: SetupAdminRequest, setupToken: string): Observable<ApiResponse<UserDTO>> {
    return this.api.postWithHeaders<ApiResponse<UserDTO>>(
      '/setup/admin',
      data,
      { 'x-setup-token': setupToken }
    );
  }
}
