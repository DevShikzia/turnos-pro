import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { AvailabilityApi } from './availability.api';
import { ProfessionalsApi } from '../professionals/professionals.api';
import { ServicesApi } from '../services/services.api';
import {
  ProfessionalDTO,
  ServiceDTO,
  AvailabilityDTO,
  WeeklySchedule,
  TimeSlot,
  AvailabilityException,
} from '@shared/models/api.types';

interface WeekdayOption {
  label: string;
  value: number;
}

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DropdownModule,
    InputNumberModule,
    CalendarModule,
    TableModule,
    DialogModule,
    CheckboxModule,
    ToastModule,
    PageHeaderComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Disponibilidad"
        subtitle="Configura los horarios de trabajo de cada profesional"
      />

      <!-- Selector de profesional -->
      <div class="professional-selector card">
        <label>Seleccionar profesional</label>
        <p-dropdown
          [(ngModel)]="selectedProfessionalId"
          [options]="professionals()"
          optionLabel="fullName"
          optionValue="_id"
          placeholder="Elige un profesional"
          (onChange)="onProfessionalChange()"
          styleClass="w-full"
        />
      </div>

      <!-- Selector de servicio (solo si hay profesional seleccionado) -->
      @if (selectedProfessionalId) {
        <div class="service-selector card">
          <label>Seleccionar servicio</label>
          <p-dropdown
            [(ngModel)]="selectedServiceId"
            [options]="availableServices()"
            optionLabel="name"
            optionValue="_id"
            placeholder="Elige un servicio"
            (onChange)="onServiceChange()"
            styleClass="w-full"
          />
          <small class="form-hint">
            Cada servicio puede tener su propia disponibilidad. Los horarios no pueden solaparse entre servicios.
          </small>
        </div>
      }

      @if (!selectedProfessionalId) {
        <app-empty-state
          icon="pi-calendar"
          title="Selecciona un profesional"
          message="Elige un profesional para configurar su disponibilidad"
        />
      } @else if (!selectedServiceId) {
        <app-empty-state
          icon="pi-calendar"
          title="Selecciona un servicio"
          message="Elige un servicio para configurar su disponibilidad"
        />
      } @else if (loading()) {
        <app-loading text="Cargando disponibilidad..." />
      } @else {
        <div class="availability-config">
          <!-- Configuración general -->
          <div class="card config-card">
            <h3>Configuración</h3>
            <div class="config-grid">
              <div class="form-group">
                <label>Zona horaria</label>
                <p-dropdown
                  [(ngModel)]="timezone"
                  [options]="timezoneOptions"
                  placeholder="Seleccionar zona"
                  styleClass="w-full"
                />
              </div>
              <div class="form-group">
                <label>Duración de turnos (minutos) *</label>
                <p-inputNumber
                  [(ngModel)]="durationMin"
                  [min]="5"
                  [max]="480"
                  [step]="5"
                  suffix=" min"
                  placeholder="30"
                  styleClass="w-full"
                />
                <small class="form-hint">Duración por defecto de los turnos</small>
              </div>
              <div class="form-group">
                <label>Buffer entre turnos (minutos)</label>
                <p-inputNumber
                  [(ngModel)]="bufferMin"
                  [min]="0"
                  [max]="60"
                  suffix=" min"
                  placeholder="0"
                  styleClass="w-full"
                />
                <small class="form-hint">Tiempo de descanso entre turnos</small>
              </div>
              <div class="form-group">
                <label>Precio por turno (opcional)</label>
                <p-inputNumber
                  [(ngModel)]="price"
                  [min]="0"
                  mode="currency"
                  currency="ARS"
                  locale="es-AR"
                  placeholder="$ 0"
                  styleClass="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Horario semanal -->
          <div class="card schedule-card">
            <div class="card-header">
              <h3>Horario Semanal</h3>
              <p-button
                icon="pi pi-plus"
                [rounded]="true"
                severity="success"
                pTooltip="Agregar día"
                (onClick)="openAddDayDialog()"
              />
            </div>

            @if (weekly.length === 0) {
              <p class="text-muted text-center p-4">
                No hay horarios configurados. Agrega días de trabajo.
              </p>
            } @else {
              <div class="schedule-table">
                @for (day of weekly; track day.weekday) {
                  <div class="schedule-day">
                    <div class="day-header">
                      <span class="day-name">{{ getWeekdayLabel(day.weekday) }}</span>
                      <p-button
                        icon="pi pi-trash"
                        [rounded]="true"
                        severity="danger"
                        size="small"
                        pTooltip="Eliminar día"
                        (onClick)="removeDay(day.weekday)"
                      />
                    </div>
                    <div class="day-slots">
                      @for (slot of day.slots; track $index; let i = $index) {
                        <div class="slot-item">
                          <span>{{ slot.startTime }} - {{ slot.endTime }}</span>
                          <p-button
                            icon="pi pi-times"
                            [rounded]="true"
                            severity="warning"
                            size="small"
                            pTooltip="Quitar horario"
                            (onClick)="removeSlot(day.weekday, i)"
                          />
                        </div>
                      }
                      <p-button
                        icon="pi pi-plus"
                        [rounded]="true"
                        severity="info"
                        size="small"
                        pTooltip="Agregar horario"
                        (onClick)="openAddSlotDialog(day.weekday)"
                      />
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Excepciones -->
          <div class="card exceptions-card">
            <div class="card-header">
              <h3>Excepciones (Feriados / Días especiales)</h3>
              <p-button
                icon="pi pi-plus"
                [rounded]="true"
                severity="success"
                pTooltip="Agregar excepción"
                (onClick)="openAddExceptionDialog()"
              />
            </div>

            @if (exceptions.length === 0) {
              <p class="text-muted text-center p-4">
                No hay excepciones configuradas.
              </p>
            } @else {
              <div class="exceptions-list">
                @for (exc of exceptions; track exc.date) {
                  <div class="exception-item">
                    <div class="exception-info">
                      <span class="exception-date">{{ exc.date }}</span>
                      <span class="exception-status" [class.available]="exc.isAvailable">
                        {{ exc.isAvailable ? 'Disponible' : 'No disponible' }}
                      </span>
                    </div>
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      pTooltip="Eliminar excepción"
                      (onClick)="removeException(exc.date)"
                    />
                  </div>
                }
              </div>
            }
          </div>

          <!-- Botón guardar -->
          <div class="save-actions">
            <p-button
              label="Guardar cambios"
              icon="pi pi-check"
              [loading]="saving()"
              (onClick)="saveAvailability()"
            />
          </div>
        </div>
      }
    </div>

    <!-- Dialog agregar día -->
    <p-dialog
      header="Agregar día de trabajo"
      [(visible)]="addDayDialogVisible"
      [modal]="true"
      [style]="{ width: '450px', minHeight: '280px' }"
      [contentStyle]="{ overflow: 'visible' }"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label>Día de la semana</label>
          <p-dropdown
            [(ngModel)]="newDayWeekday"
            [options]="availableWeekdays()"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar día"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancelar"
            severity="secondary"
            (onClick)="addDayDialogVisible = false"
            styleClass="btn-cancel"
          />
          <p-button
            label="Agregar"
            icon="pi pi-check"
            (onClick)="addDay()"
            [disabled]="!newDayWeekday"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Dialog agregar slot -->
    <p-dialog
      header="Agregar horario"
      [(visible)]="addSlotDialogVisible"
      [modal]="true"
      [style]="{ width: '450px', minHeight: '320px' }"
      [contentStyle]="{ overflow: 'visible' }"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label>Hora inicio</label>
          <p-calendar
            [(ngModel)]="newSlotStart"
            [timeOnly]="true"
            [stepMinute]="15"
            placeholder="HH:mm"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
        <div class="form-group">
          <label>Hora fin</label>
          <p-calendar
            [(ngModel)]="newSlotEnd"
            [timeOnly]="true"
            [stepMinute]="15"
            placeholder="HH:mm"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancelar"
            severity="secondary"
            (onClick)="addSlotDialogVisible = false"
            styleClass="btn-cancel"
          />
          <p-button
            label="Agregar"
            icon="pi pi-check"
            (onClick)="addSlot()"
            [disabled]="!newSlotStart || !newSlotEnd"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Dialog agregar excepción -->
    <p-dialog
      header="Agregar excepción"
      [(visible)]="addExceptionDialogVisible"
      [modal]="true"
      [style]="{ width: '450px', minHeight: '320px' }"
      [contentStyle]="{ overflow: 'visible' }"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label>Fecha</label>
          <p-calendar
            [(ngModel)]="newExceptionDate"
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar fecha"
            styleClass="w-full"
            appendTo="body"
            [showIcon]="true"
          />
        </div>
        <div class="form-group checkbox-group">
          <p-checkbox
            [(ngModel)]="newExceptionAvailable"
            [binary]="true"
            inputId="availableCheck"
          />
          <label for="availableCheck">Disponible este día (con horario especial)</label>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancelar"
            severity="secondary"
            (onClick)="addExceptionDialogVisible = false"
            styleClass="btn-cancel"
          />
          <p-button
            label="Agregar"
            icon="pi pi-check"
            (onClick)="addException()"
            [disabled]="!newExceptionDate"
          />
        </div>
      </ng-template>
    </p-dialog>

    <p-toast />
  `,
  styles: [`
    .professional-selector {
      margin-bottom: var(--spacing-lg);

      label {
        display: block;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
      }
    }

    .availability-config {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);

      h3 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .form-hint {
      color: var(--color-text-muted);
      font-size: 0.75rem;
      margin-top: var(--spacing-xs);
      display: block;
    }

    .form-group {
      margin-bottom: var(--spacing-md);

      label {
        display: block;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
        color: var(--color-text);
      }
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      label {
        margin-bottom: 0;
        cursor: pointer;
      }
    }

    .schedule-day {
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-sm);
      overflow: hidden;
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-bg);
      font-weight: 600;
    }

    .day-slots {
      padding: var(--spacing-md);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .slot-item {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      background: var(--color-primary-light);
      color: var(--color-primary);
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-full);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .exceptions-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .exception-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .exception-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .exception-date {
      font-weight: 500;
    }

    .exception-status {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--color-danger-light);
      color: var(--color-danger);

      &.available {
        background: var(--color-success-light);
        color: var(--color-success);
      }
    }

    .save-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Dialog styles */
    .dialog-content {
      padding: var(--spacing-sm) 0;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
    }

    /* Override PrimeNG cancel button */
    :host ::ng-deep .btn-cancel {
      background-color: #6c757d !important;
      border-color: #6c757d !important;
      color: white !important;

      &:hover {
        background-color: #5a6268 !important;
        border-color: #545b62 !important;
      }

      .p-button-label {
        color: white !important;
      }
    }
  `],
})
export class AvailabilityPage implements OnInit {
  private availabilityApi = inject(AvailabilityApi);
  private professionalsApi = inject(ProfessionalsApi);
  private servicesApi = inject(ServicesApi);
  private messageService = inject(MessageService);

  professionals = signal<ProfessionalDTO[]>([]);
  availableServices = signal<ServiceDTO[]>([]);
  loading = signal(false);
  saving = signal(false);

  selectedProfessionalId: string | null = null;
  selectedServiceId: string | null = null;
  selectedProfessional: ProfessionalDTO | null = null;
  timezone = 'America/Argentina/Buenos_Aires';
  bufferMin = 0;
  durationMin = 30;
  price: number | null = null;
  weekly: WeeklySchedule[] = [];
  exceptions: AvailabilityException[] = [];

  timezoneOptions = [
    'America/Argentina/Buenos_Aires',
    'America/Sao_Paulo',
    'America/Santiago',
    'America/Bogota',
    'America/Lima',
    'America/Mexico_City',
    'America/New_York',
    'Europe/Madrid',
    'UTC',
  ];

  weekdays: WeekdayOption[] = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 7 },
  ];

  // Dialogs
  addDayDialogVisible = false;
  addSlotDialogVisible = false;
  addExceptionDialogVisible = false;
  newDayWeekday: number | null = null;
  newSlotStart: Date | null = null;
  newSlotEnd: Date | null = null;
  newExceptionDate: Date | null = null;
  newExceptionAvailable = false;
  currentWeekdayForSlot: number | null = null;

  ngOnInit(): void {
    this.loadProfessionals();
  }

  private loadProfessionals(): void {
    this.professionalsApi.list({ isActive: true, limit: 100 }).subscribe({
      next: (response) => this.professionals.set(response.data),
    });
  }

  onProfessionalChange(): void {
    if (!this.selectedProfessionalId) {
      this.selectedServiceId = null;
      this.availableServices.set([]);
      return;
    }

    // Cargar información del profesional y sus servicios
    this.professionalsApi.getById(this.selectedProfessionalId).subscribe({
      next: (response) => {
        this.selectedProfessional = response.data;
        const services = response.data.services || [];
        
        // Los servicios vienen con populate del backend, así que son objetos parciales
        // Necesitamos cargar los servicios completos para tener toda la información
        if (services.length > 0) {
          // Extraer los IDs de los servicios (pueden venir como objetos o strings)
          const serviceIds = services.map((s: any) => {
            if (typeof s === 'string') {
              return s;
            }
            // Si es un objeto, obtener el _id
            return s._id || s.id || String(s);
          }).filter((id: any) => id && typeof id === 'string');
          
          if (serviceIds.length > 0) {
            // Cargar los servicios completos desde la API
            this.servicesApi.list({ limit: 100 }).subscribe({
              next: (servicesResponse) => {
                const allServices = servicesResponse.data;
                const professionalServices = allServices.filter((s) =>
                  serviceIds.includes(s._id)
                );
                this.availableServices.set(professionalServices);
                
                // Si solo hay un servicio, seleccionarlo automáticamente
                if (professionalServices.length === 1) {
                  this.selectedServiceId = professionalServices[0]._id;
                  this.onServiceChange();
                } else {
                  this.selectedServiceId = null;
                  this.resetAvailabilityForm();
                }
              },
              error: (error) => {
                console.error('Error al cargar servicios:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudieron cargar los servicios del profesional',
                });
                this.availableServices.set([]);
                this.selectedServiceId = null;
                this.resetAvailabilityForm();
              },
            });
          } else {
            this.availableServices.set([]);
            this.selectedServiceId = null;
            this.resetAvailabilityForm();
          }
        } else {
          this.availableServices.set([]);
          this.selectedServiceId = null;
          this.resetAvailabilityForm();
        }
      },
      error: (error) => {
        console.error('Error al cargar profesional:', error);
        this.availableServices.set([]);
        this.selectedServiceId = null;
        this.resetAvailabilityForm();
      },
    });
  }

  onServiceChange(): void {
    if (!this.selectedProfessionalId || !this.selectedServiceId) {
      this.resetAvailabilityForm();
      return;
    }

    this.loading.set(true);
    this.availabilityApi.getByProfessionalId(this.selectedProfessionalId, this.selectedServiceId).subscribe({
      next: (response) => {
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        if (data) {
          this.timezone = data.timezone;
          this.bufferMin = data.bufferMin;
          this.durationMin = data.durationMin || 30;
          this.price = data.price || null;
          this.weekly = data.weekly || [];
          this.exceptions = data.exceptions || [];
        } else {
          this.resetAvailabilityForm();
        }
        this.loading.set(false);
      },
      error: () => {
        this.resetAvailabilityForm();
        this.loading.set(false);
      },
    });
  }

  private resetAvailabilityForm(): void {
    this.timezone = 'America/Argentina/Buenos_Aires';
    this.bufferMin = 0;
    this.durationMin = 30;
    this.price = null;
    this.weekly = [];
    this.exceptions = [];
  }

  availableWeekdays(): WeekdayOption[] {
    const usedWeekdays = this.weekly.map((w) => w.weekday);
    return this.weekdays.filter((w) => !usedWeekdays.includes(w.value));
  }

  getWeekdayLabel(weekday: number): string {
    return this.weekdays.find((w) => w.value === weekday)?.label || '';
  }

  openAddDayDialog(): void {
    this.newDayWeekday = null;
    this.addDayDialogVisible = true;
  }

  addDay(): void {
    if (!this.newDayWeekday) return;

    this.weekly.push({ weekday: this.newDayWeekday, slots: [] });
    this.weekly.sort((a, b) => a.weekday - b.weekday);
    this.addDayDialogVisible = false;
  }

  removeDay(weekday: number): void {
    this.weekly = this.weekly.filter((w) => w.weekday !== weekday);
  }

  openAddSlotDialog(weekday: number): void {
    this.currentWeekdayForSlot = weekday;
    this.newSlotStart = null;
    this.newSlotEnd = null;
    this.addSlotDialogVisible = true;
  }

  addSlot(): void {
    if (!this.currentWeekdayForSlot || !this.newSlotStart || !this.newSlotEnd) return;

    const startTime = this.formatTime(this.newSlotStart);
    const endTime = this.formatTime(this.newSlotEnd);

    if (startTime >= endTime) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La hora de inicio debe ser anterior a la hora de fin',
      });
      return;
    }

    const day = this.weekly.find((w) => w.weekday === this.currentWeekdayForSlot);
    if (day) {
      day.slots.push({ startTime, endTime });
      day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    this.addSlotDialogVisible = false;
  }

  removeSlot(weekday: number, index: number): void {
    const day = this.weekly.find((w) => w.weekday === weekday);
    if (day) {
      day.slots.splice(index, 1);
    }
  }

  openAddExceptionDialog(): void {
    this.newExceptionDate = null;
    this.newExceptionAvailable = false;
    this.addExceptionDialogVisible = true;
  }

  addException(): void {
    if (!this.newExceptionDate) return;

    const date = this.formatDate(this.newExceptionDate);

    if (this.exceptions.some((e) => e.date === date)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ya existe una excepción para esta fecha',
      });
      return;
    }

    this.exceptions.push({
      date,
      isAvailable: this.newExceptionAvailable,
    });
    this.exceptions.sort((a, b) => a.date.localeCompare(b.date));

    this.addExceptionDialogVisible = false;
  }

  removeException(date: string): void {
    this.exceptions = this.exceptions.filter((e) => e.date !== date);
  }

  saveAvailability(): void {
    if (!this.selectedProfessionalId || !this.selectedServiceId) return;

    this.saving.set(true);

    this.availabilityApi
      .upsert(this.selectedProfessionalId, {
        serviceId: this.selectedServiceId,
        timezone: this.timezone,
        bufferMin: this.bufferMin,
        durationMin: this.durationMin,
        price: this.price || undefined,
        weekly: this.weekly,
        exceptions: this.exceptions,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Guardado',
            detail: 'Disponibilidad actualizada correctamente',
          });
          this.saving.set(false);
        },
        error: (error) => {
          this.saving.set(false);
          const errorCode = error?.error?.error?.code;
          if (errorCode === 'SERVICE_SCHEDULE_OVERLAP') {
            this.messageService.add({
              severity: 'error',
              summary: 'Horario solapado',
              detail: error?.error?.error?.message || 'El horario se solapa con otro servicio del profesional',
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo guardar la disponibilidad',
            });
          }
        },
      });
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
