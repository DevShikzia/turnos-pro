import { Component, input, output, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { QueueApi } from './queue.api';
import { DeskDTO } from '@shared/models/api.types';
import { StorageService } from '@core/services/storage.service';

@Component({
  selector: 'app-queue-desks',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DropdownModule, TooltipModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="desk-selector">
      <label>Mi ventanilla:</label>
      <div class="flex gap-2 align-items-center">
        <p-dropdown
          [options]="deskOptions()"
          [(ngModel)]="selectedDeskValue"
          optionLabel="label"
          optionValue="value"
          placeholder="Seleccionar ventanilla"
          [showClear]="true"
          (onChange)="onDeskChange()"
          styleClass="w-full"
        />
        @if (selectedDeskValue()) {
          <p-button
            icon="pi pi-times"
            [rounded]="true"
            severity="danger"
            (click)="clearDesk()"
            [pTooltip]="'Desasignar ventanilla'"
            styleClass="clear-desk-btn"
          />
        }
      </div>
    </div>
  `,
  styles: [
    `
      .desk-selector {
        background: var(--surface-card);
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }
      .desk-selector label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }

      :host ::ng-deep .clear-desk-btn {
        min-width: 2.5rem;
        height: 2.5rem;
        padding: 0;
        background-color: #ef4444 !important;
        border-color: #ef4444 !important;
        color: white !important;

        &:hover {
          background-color: #dc2626 !important;
          border-color: #dc2626 !important;
        }

        .p-button-icon {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class QueueDesksComponent implements OnInit {
  selectedDesk = input<string | null>(null);
  deskSelected = output<string | null>();

  private queueApi = inject(QueueApi);
  private storage = inject(StorageService);
  private messageService = inject(MessageService);
  
  selectedDeskValue = signal<string | null>(null);
  desks = signal<DeskDTO[]>([]);
  deskOptions = signal<Array<{ label: string; value: string; disabled?: boolean }>>([]);
  currentUserId: string | null = null;

  private readonly DESK_STORAGE_KEY = 'queue_selected_desk';

  constructor() {
    // Efecto para sincronizar cuando cambia el input del padre
    effect(() => {
      const desk = this.selectedDesk();
      if (desk !== this.selectedDeskValue()) {
        this.selectedDeskValue.set(desk);
        // Si el padre establece un valor, guardarlo en sessionStorage
        if (desk) {
          this.storage.setSessionItem(this.DESK_STORAGE_KEY, desk);
        } else {
          this.storage.removeSessionItem(this.DESK_STORAGE_KEY);
        }
      }
    });
  }

  ngOnInit(): void {
    // Obtener usuario actual
    const user = this.storage.getUser<any>();
    this.currentUserId = user?._id || null;

    // Priorizar el input del padre, luego sessionStorage
    if (this.selectedDesk()) {
      this.selectedDeskValue.set(this.selectedDesk());
    } else {
      // Cargar ventanilla desde sessionStorage si no viene del padre
      const savedDesk = this.storage.getSessionItem(this.DESK_STORAGE_KEY);
      if (savedDesk) {
        this.selectedDeskValue.set(savedDesk);
        // Emitir para que el padre se sincronice
        setTimeout(() => {
          this.deskSelected.emit(savedDesk);
        }, 0);
      }
    }

    this.loadDesks();
  }

  loadDesks(): void {
    this.queueApi.getDesks('main').subscribe({
      next: (response) => {
        this.desks.set(response.data);
        this.generateDeskOptions();
        
        // Verificar si la ventanilla actual sigue disponible
        const currentDesk = this.selectedDeskValue();
        if (currentDesk) {
          const isStillAvailable = !this.desks().some(
            (d) => d.deskId === currentDesk && d.active && d.receptionistId !== this.currentUserId
          );
          
          if (!isStillAvailable) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Ventanilla ocupada',
              detail: 'Tu ventanilla fue asignada a otro agente',
            });
            this.clearDesk();
          }
        }
      },
      error: () => {
        // Si falla, generar opciones sin filtro
        this.generateDeskOptions();
      },
    });
  }

  generateDeskOptions(): void {
    const assignedDesks = this.desks()
      .filter((d) => d.active && d.receptionistId !== this.currentUserId)
      .map((d) => d.deskId);

    // Generar opciones de ventanillas (VENT-1 a VENT-20)
    const options = Array.from({ length: 20 }, (_, i) => {
      const deskId = `VENT-${i + 1}`;
      const isOccupied = assignedDesks.includes(deskId);
      
      return {
        label: isOccupied 
          ? `Ventanilla ${i + 1} (Ocupada)` 
          : `Ventanilla ${i + 1}`,
        value: deskId,
        disabled: isOccupied,
      };
    });
    
    this.deskOptions.set(options);
  }

  onDeskChange(): void {
    const deskId = this.selectedDeskValue();
    
    if (deskId) {
      // Verificar si está ocupada
      const isOccupied = this.desks().some(
        (d) => d.deskId === deskId && d.active && d.receptionistId !== this.currentUserId
      );

      if (isOccupied) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Ventanilla ocupada',
          detail: 'Esta ventanilla ya está asignada a otro agente',
        });
        // Resetear selección
        this.selectedDeskValue.set(null);
        return;
      }

      // Guardar en sessionStorage
      this.storage.setSessionItem(this.DESK_STORAGE_KEY, deskId);
    } else {
      // Limpiar sessionStorage
      this.storage.removeSessionItem(this.DESK_STORAGE_KEY);
    }

    this.deskSelected.emit(deskId);
  }

  clearDesk(): void {
    this.selectedDeskValue.set(null);
    this.storage.removeSessionItem(this.DESK_STORAGE_KEY);
    this.deskSelected.emit(null);
    this.loadDesks(); // Recargar para actualizar opciones
  }
}
