import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

export interface QueueTicketEvent {
  id: string;
  code: string;
  type: 'T' | 'C';
  status: string;
  dni?: string;
  deskId?: string;
  calledAt?: string;
  createdAt?: string;
}

export interface QueueSnapshot {
  locationId: string;
  tickets: QueueTicketEvent[];
}

export interface DeskAssignedEvent {
  deskId: string;
  receptionistId: string;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private storage = inject(StorageService);
  private socket: Socket | null = null;

  connect(locationId: string = 'main', deskId?: string): void {
    if (this.socket?.connected) {
      this.socket.disconnect();
    }

    const token = this.storage.getToken();
    // Socket.io se conecta al mismo dominio que la API
    const url = environment.apiBaseUrl.replace(/\/api$/, '');

    this.socket = io(url, {
      path: '/socket.io',
      auth: {
        token: token || undefined,
      },
      query: {
        locationId,
        ...(deskId && { deskId }),
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket conectado');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onTicketCreated(callback: (ticket: QueueTicketEvent) => void): void {
    if (this.socket) {
      this.socket.on('queue:ticketCreated', callback);
    }
  }

  onTicketUpdated(callback: (ticket: QueueTicketEvent) => void): void {
    if (this.socket) {
      this.socket.on('queue:ticketUpdated', callback);
    }
  }

  onTicketCalled(callback: (ticket: QueueTicketEvent) => void): void {
    if (this.socket) {
      this.socket.on('queue:ticketCalled', callback);
    }
  }

  onDeskAssigned(callback: (assignment: DeskAssignedEvent) => void): void {
    if (this.socket) {
      this.socket.on('queue:deskAssigned', callback);
    }
  }

  onSnapshot(callback: (snapshot: QueueSnapshot) => void): void {
    if (this.socket) {
      this.socket.on('queue:snapshot', callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
