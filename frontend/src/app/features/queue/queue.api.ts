import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@core/services/api-client.service';
import {
  ApiResponse,
  PaginatedResponse,
  QueueTicketDTO,
  CreateTicketRequest,
  CallTicketRequest,
  AssignDeskRequest,
  DeskDTO,
  TicketQueryParams,
} from '@shared/models/api.types';

@Injectable({
  providedIn: 'root',
})
export class QueueApi {
  private api = inject(ApiClientService);

  // Kiosco (público)
  createTicket(data: CreateTicketRequest): Observable<ApiResponse<QueueTicketDTO>> {
    return this.api.post<ApiResponse<QueueTicketDTO>>('/queue/kiosk/ticket', data);
  }

  getTicketStatus(code: string, locationId?: string): Observable<ApiResponse<QueueTicketDTO>> {
    const params = locationId ? { locationId } : {};
    return this.api.get<ApiResponse<QueueTicketDTO>>(`/queue/kiosk/status/${code}`, params);
  }

  // Tickets (privado)
  list(params?: TicketQueryParams): Observable<PaginatedResponse<QueueTicketDTO>> {
    return this.api.get<PaginatedResponse<QueueTicketDTO>>('/queue/tickets', params);
  }

  getById(id: string): Observable<ApiResponse<QueueTicketDTO>> {
    return this.api.get<ApiResponse<QueueTicketDTO>>(`/queue/tickets/${id}`);
  }

  call(id: string, data: CallTicketRequest): Observable<ApiResponse<QueueTicketDTO>> {
    return this.api.post<ApiResponse<QueueTicketDTO>>(`/queue/tickets/${id}/call`, data);
  }

  serve(id: string): Observable<ApiResponse<QueueTicketDTO>> {
    return this.api.post<ApiResponse<QueueTicketDTO>>(`/queue/tickets/${id}/serve`, {});
  }

  done(id: string): Observable<ApiResponse<QueueTicketDTO>> {
    return this.api.post<ApiResponse<QueueTicketDTO>>(`/queue/tickets/${id}/done`, {});
  }

  cancel(id: string): Observable<ApiResponse<QueueTicketDTO>> {
    return this.api.post<ApiResponse<QueueTicketDTO>>(`/queue/tickets/${id}/cancel`, {});
  }

  // Desks
  assignDesk(data: AssignDeskRequest): Observable<ApiResponse<DeskDTO>> {
    return this.api.put<ApiResponse<DeskDTO>>('/queue/desks/assign', data);
  }

  getDesks(locationId?: string): Observable<ApiResponse<DeskDTO[]>> {
    const params = locationId ? { locationId } : {};
    return this.api.get<ApiResponse<DeskDTO[]>>('/queue/desks', params);
  }
}
