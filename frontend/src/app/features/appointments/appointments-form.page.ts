import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DateTime } from 'luxon';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { AppointmentsApi } from './appointments.api';
import { ClientsApi } from '../clients/clients.api';
import { ServicesApi } from '../services/services.api';
import { ProfessionalsApi } from '../professionals/professionals.api';
import { AvailabilityApi } from '../availability/availability.api';
import {
  ClientDTO,
  ServiceDTO,
  ProfessionalDTO,
  AvailableSlot,
} from '@shared/models/api.types';
import { environment } from '@env';

interface SlotOption {
  label: string;
  value: string;
  available: boolean;
}

@Component({
  selector: 'app-appointments-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    DropdownModule,
    CalendarModule,
    InputTextareaModule,
    ToastModule,
    ProgressSpinnerModule,
    DialogModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="isEditing() ? 'Editar turno' : 'Nuevo turno'"
        [subtitle]="isEditing() ? 'Modifica los datos del turno' : 'Agenda un nuevo turno'"
      />

      @if (pageLoading()) {
        <app-loading text="Cargando..." />
      } @else {
        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <!-- Client -->
              <div class="form-group">
                <label for="clientId">Cliente *</label>
                <p-dropdown
                  id="clientId"
                  formControlName="clientId"
                  [options]="clients()"
                  optionLabel="fullName"
                  optionValue="_id"
                  placeholder="Seleccionar cliente"
                  [filter]="true"
                  filterPlaceholder="Buscar por nombre o DNI..."
                  styleClass="w-full"
                >
                  <ng-template let-client pTemplate="item">
                    <div class="client-option">
                      <span>{{ client.fullName }}</span>
                      <span class="client-dni">DNI: {{ client.dni }}</span>
                    </div>
                  </ng-template>
                </p-dropdown>
                @if (form.get('clientId')?.touched && form.get('clientId')?.errors?.['required']) {
                  <small class="form-error">El cliente es requerido</small>
                }
              </div>

              <!-- Service -->
              <div class="form-group">
                <label for="serviceId">Servicio *</label>
                <p-dropdown
                  id="serviceId"
                  formControlName="serviceId"
                  [options]="filteredServices()"
                  optionLabel="name"
                  optionValue="_id"
                  placeholder="Seleccionar servicio"
                  (onChange)="onServiceChange()"
                  styleClass="w-full"
                >
                  <ng-template let-service pTemplate="item">
                    <div class="service-option">
                      <span>{{ service.name }}</span>
                    </div>
                  </ng-template>
                </p-dropdown>
                @if (form.get('serviceId')?.touched && form.get('serviceId')?.errors?.['required']) {
                  <small class="form-error">El servicio es requerido</small>
                }
              </div>

              <!-- Professional -->
              <div class="form-group">
                <label for="professionalId">Profesional *</label>
                <p-dropdown
                  id="professionalId"
                  formControlName="professionalId"
                  [options]="filteredProfessionals()"
                  optionLabel="fullName"
                  optionValue="_id"
                  placeholder="Seleccionar profesional"
                  [disabled]="!form.get('serviceId')?.value"
                  (onChange)="onProfessionalChange()"
                  styleClass="w-full"
                />
                @if (form.get('professionalId')?.touched && form.get('professionalId')?.errors?.['required']) {
                  <small class="form-error">El profesional es requerido</small>
                }
                @if (!form.get('serviceId')?.value) {
                  <small class="form-hint">Selecciona un servicio primero</small>
                }
                @if (form.get('serviceId')?.value && filteredProfessionals().length === 0) {
                  <small class="form-error">No hay profesionales disponibles para este servicio</small>
                }
              </div>

              <!-- Professional Availability Info -->
              @if (form.get('professionalId')?.value && professionalAvailability()) {
                <div class="form-group full-width">
                  <label>Disponibilidad del Profesional</label>
                  <div class="availability-info">
                    @if (loadingAvailability()) {
                      <div class="availability-loading">
                        <p-progressSpinner [style]="{ width: '20px', height: '20px' }" />
                        <span>Cargando disponibilidad...</span>
                      </div>
                    } @else if (professionalAvailability()?.weekly?.length > 0) {
                      <div class="availability-schedule">
                        <div class="availability-days">
                          @for (day of professionalAvailability().weekly; track day.weekday) {
                            <div class="availability-day">
                              <span class="day-name">{{ getDayName(day.weekday) }}</span>
                              @if (day.slots && day.slots.length > 0) {
                                <div class="day-slots">
                                  @for (slot of day.slots; track slot.startTime + slot.endTime) {
                                    <span class="slot-badge">
                                      {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
                                    </span>
                                  }
                                </div>
                              } @else {
                                <span class="day-unavailable">No disponible</span>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <div class="availability-empty">
                        <i class="pi pi-info-circle"></i>
                        <span>No hay disponibilidad configurada para este profesional</span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Date selection -->
              <div class="form-group">
                <label for="selectedDate">Fecha *</label>
                <p-calendar
                  id="selectedDate"
                  [(ngModel)]="selectedDate"
                  [ngModelOptions]="{ standalone: true }"
                  [showIcon]="true"
                  [minDate]="minDate"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccionar fecha"
                  (onSelect)="onDateChange()"
                  [disabled]="!form.get('professionalId')?.value || !form.get('serviceId')?.value"
                  styleClass="w-full"
                />
                @if (!form.get('professionalId')?.value || !form.get('serviceId')?.value) {
                  <small class="form-hint">Selecciona servicio y profesional primero</small>
                }
              </div>

              <!-- Available slots -->
              <div class="form-group full-width">
                <label>Horario disponible *</label>
                @if (loadingSlots()) {
                  <div class="slots-loading">
                    <p-progressSpinner [style]="{ width: '30px', height: '30px' }" />
                    <span>Cargando horarios disponibles...</span>
                  </div>
                } @else if (!selectedDate || !form.get('professionalId')?.value || !form.get('serviceId')?.value) {
                  <div class="slots-empty">
                    <i class="pi pi-clock"></i>
                    <span>Selecciona fecha, servicio y profesional para ver horarios</span>
                  </div>
                } @else if (availableSlots().length === 0) {
                  <div class="slots-empty">
                    <i class="pi pi-calendar-times"></i>
                    <span>No hay horarios disponibles para esta fecha</span>
                  </div>
                } @else {
                  <div class="slots-grid">
                    @for (slot of availableSlots(); track slot.value) {
                      <button
                        type="button"
                        class="slot-btn"
                        [class.selected]="selectedSlot === slot.value"
                        [class.unavailable]="!slot.available"
                        [disabled]="!slot.available"
                        (click)="selectSlot(slot)"
                      >
                        {{ slot.label }}
                      </button>
                    }
                  </div>
                }
                @if (form.get('startAt')?.touched && form.get('startAt')?.errors?.['required']) {
                  <small class="form-error">Selecciona un horario</small>
                }
              </div>

              <!-- Notes -->
              <div class="form-group full-width">
                <label for="notes">Notas (opcional)</label>
                <textarea
                  pInputTextarea
                  id="notes"
                  formControlName="notes"
                  placeholder="Información adicional sobre el turno..."
                  [rows]="3"
                  class="w-full"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <p-button
                label="Cancelar"
                severity="secondary"
                routerLink="/appointments"
                styleClass="btn-cancel"
              />
              <p-button
                type="submit"
                [label]="isEditing() ? 'Guardar cambios' : 'Crear turno'"
                icon="pi pi-check"
                [loading]="saving()"
                [disabled]="form.invalid || saving()"
              />
            </div>
          </form>
        </div>
      }
    </div>
    <p-toast />
    <p-confirmDialog />
  `,
  styles: [`
    .form-card {
      max-width: 700px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      label {
        display: block;
        font-weight: 500;
        margin-bottom: var(--spacing-xs);
        color: var(--color-text);
      }
    }

    .form-error {
      color: var(--color-danger);
      font-size: 0.875rem;
      margin-top: var(--spacing-xs);
      display: block;
    }

    .form-hint {
      color: var(--color-text-secondary);
      font-size: 0.875rem;
      margin-top: var(--spacing-xs);
      display: block;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-border-light);
    }

    :host ::ng-deep .btn-cancel {
      background-color: #6c757d !important;
      border-color: #6c757d !important;
      color: white !important;

      &:hover {
        background-color: #5a6268 !important;
        border-color: #545b62 !important;
      }
    }

    :host ::ng-deep .duplicate-appointment-message {
      p {
        margin-bottom: var(--spacing-sm);
      }

      ul {
        margin: var(--spacing-sm) 0;
        padding-left: var(--spacing-lg);
      }
    }

    .client-option, .service-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .client-dni, .service-duration {
      font-size: 0.75rem;
      color: var(--color-text-secondary);
    }

    .slots-loading, .slots-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xl);
      background: var(--color-bg);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);

      i {
        font-size: 1.5rem;
      }
    }

    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: var(--spacing-xs);
    }

    .slot-btn {
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover:not(:disabled) {
        background: var(--color-surface-hover);
        border-color: var(--color-primary);
      }

      &.selected {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: white;
      }

      &.unavailable {
        background: var(--color-bg);
        color: var(--color-text-muted);
        cursor: not-allowed;
        text-decoration: line-through;
      }
    }

    .availability-info {
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      margin-top: var(--spacing-xs);
    }

    .availability-loading {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-text-secondary);
    }

    .availability-empty {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--color-text-secondary);
      padding: var(--spacing-sm);

      i {
        font-size: 1.25rem;
      }
    }

    .availability-schedule {
      .availability-days {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      }

      .availability-day {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-sm);
        border-bottom: 1px solid var(--color-border-light);

        &:last-child {
          border-bottom: none;
        }

        .day-name {
          font-weight: 600;
          min-width: 100px;
          color: var(--color-text);
        }

        .day-slots {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .slot-badge {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-primary-light);
          color: var(--color-primary-dark);
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .day-unavailable {
          color: var(--color-text-muted);
          font-style: italic;
        }
      }
    }
  `],
})
export class AppointmentsFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appointmentsApi = inject(AppointmentsApi);
  private clientsApi = inject(ClientsApi);
  private servicesApi = inject(ServicesApi);
  private professionalsApi = inject(ProfessionalsApi);
  private availabilityApi = inject(AvailabilityApi);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  isEditing = signal(false);
  pageLoading = signal(true);
  saving = signal(false);
  loadingSlots = signal(false);
  appointmentId = '';

  clients = signal<ClientDTO[]>([]);
  services = signal<ServiceDTO[]>([]);
  professionals = signal<ProfessionalDTO[]>([]);
  filteredServices = signal<ServiceDTO[]>([]);
  filteredProfessionals = signal<ProfessionalDTO[]>([]);
  availableSlots = signal<SlotOption[]>([]);
  professionalAvailability = signal<any>(null);
  loadingAvailability = signal(false);

  selectedDate: Date | null = null;
  selectedSlot: string | null = null;
  minDate = new Date();

  form = this.fb.nonNullable.group({
    clientId: ['', Validators.required],
    professionalId: ['', Validators.required],
    serviceId: ['', Validators.required],
    startAt: [null as Date | null, Validators.required],
    notes: [''],
  });

  ngOnInit(): void {
    this.appointmentId = this.route.snapshot.params['id'];
    const clientIdParam = this.route.snapshot.queryParams['clientId'];

    if (environment.demoMode && !this.appointmentId) {
      if (clientIdParam !== environment.demoClientId) {
        this.router.navigate(['/appointments']);
        return;
      }
    }

    if (this.appointmentId) {
      this.isEditing.set(true);
    }

    this.loadData(clientIdParam);
  }

  private loadData(preselectedClientId?: string): void {
    // Load all data in parallel
    this.clientsApi.list({ isActive: true, limit: 100 }).subscribe({
      next: (response) => {
        this.clients.set(response.data);
        // Preseleccionar cliente si viene por query param
        if (preselectedClientId && !this.isEditing()) {
          this.form.patchValue({ clientId: preselectedClientId });
        }
      },
    });

    this.servicesApi.list({ isActive: true, limit: 100 }).subscribe({
      next: (response) => {
        this.services.set(response.data);
        // Inicializar servicios filtrados con todos
        this.filteredServices.set(response.data);
      },
    });

    this.professionalsApi.list({ isActive: true, limit: 100 }).subscribe({
      next: (response) => {
        this.professionals.set(response.data);
        // Inicializar profesionales filtrados con todos
        this.filteredProfessionals.set(response.data);
        this.pageLoading.set(false);

        if (this.isEditing()) {
          this.loadAppointment();
        }
      },
      error: () => this.pageLoading.set(false),
    });
  }

  private loadAppointment(): void {
    this.appointmentsApi.getById(this.appointmentId).subscribe({
      next: (response) => {
        const apt = response.data;
        const clientId = typeof apt.clientId === 'string' ? apt.clientId : apt.clientId._id;
        const professionalId = typeof apt.professionalId === 'string' ? apt.professionalId : apt.professionalId._id;
        const serviceId = typeof apt.serviceId === 'string' ? apt.serviceId : apt.serviceId._id;

        this.form.patchValue({
          clientId,
          professionalId,
          serviceId,
          startAt: new Date(apt.startAt),
          notes: apt.notes || '',
        });

        // Set up filtered services and professionals
        this.updateFilteredServices(professionalId);
        this.updateFilteredProfessionals(serviceId);
        
        // Cargar disponibilidad
        this.loadProfessionalAvailability(professionalId, serviceId);

        // Set date and slot for editing
        this.selectedDate = new Date(apt.startAt);
        this.selectedSlot = apt.startAt;
      },
    });
  }

  onServiceChange(): void {
    const serviceId = this.form.get('serviceId')?.value;
    
    // Reset professional, slots and availability
    this.form.patchValue({ professionalId: '', startAt: null });
    this.availableSlots.set([]);
    this.selectedSlot = null;
    this.professionalAvailability.set(null);

    if (serviceId) {
      // Filtrar profesionales que ofrecen este servicio
      this.updateFilteredProfessionals(serviceId);
    } else {
      // Si no hay servicio, mostrar todos los profesionales
      this.filteredProfessionals.set(this.professionals());
      // Filtrar servicios basado en profesional si hay uno seleccionado
      const professionalId = this.form.get('professionalId')?.value;
      if (professionalId) {
        this.updateFilteredServices(professionalId);
      } else {
        this.filteredServices.set(this.services());
      }
    }
  }

  onProfessionalChange(): void {
    const professionalId = this.form.get('professionalId')?.value;
    const serviceId = this.form.get('serviceId')?.value;
    
    if (!professionalId) {
      this.professionalAvailability.set(null);
      return;
    }

    // Reset slots
    this.availableSlots.set([]);
    this.selectedSlot = null;
    this.form.patchValue({ startAt: null });

    // Cargar disponibilidad del profesional para el servicio seleccionado
    if (serviceId) {
      this.loadProfessionalAvailability(professionalId, serviceId);
    }

    // Si hay fecha seleccionada, recargar slots
    if (this.selectedDate && serviceId) {
      this.loadAvailableSlots();
    }
  }

  private updateFilteredProfessionals(serviceId: string): void {
    const filtered = this.professionals().filter((p) => {
      const professionalServiceIds = p.services.map((s) =>
        typeof s === 'string' ? s : s._id
      );
      return professionalServiceIds.includes(serviceId);
    });

    this.filteredProfessionals.set(filtered);
  }

  private updateFilteredServices(professionalId: string): void {
    const professional = this.professionals().find((p) => p._id === professionalId);
    if (!professional) {
      this.filteredServices.set(this.services());
      return;
    }

    const professionalServiceIds = professional.services.map((s) =>
      typeof s === 'string' ? s : s._id
    );

    const filtered = this.services().filter((s) =>
      professionalServiceIds.includes(s._id)
    );

    this.filteredServices.set(filtered);
  }

  private loadProfessionalAvailability(professionalId: string, serviceId: string): void {
    this.loadingAvailability.set(true);
    this.availabilityApi.getByProfessionalId(professionalId, serviceId).subscribe({
      next: (response) => {
        const availability = Array.isArray(response.data) ? response.data[0] : response.data;
        this.professionalAvailability.set(availability);
        this.loadingAvailability.set(false);
      },
      error: () => {
        this.professionalAvailability.set(null);
        this.loadingAvailability.set(false);
      },
    });
  }

  /** weekday en formato ISO: 1 = Lunes, 7 = Domingo */
  getDayName(weekday: number): string {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    if (weekday >= 1 && weekday <= 7) {
      return days[weekday === 7 ? 0 : weekday];
    }
    return '';
  }

  /** Formatea hora "HH:mm" a "HH:mm" (válida y evita Invalid DateTime) */
  formatTime(time: string | undefined | null): string {
    if (time == null || time === '') {
      return '--:--';
    }
    const dt = DateTime.fromISO(`2000-01-01T${time}`, { zone: 'utc' });
    if (!dt.isValid) {
      return String(time);
    }
    return dt.toFormat('HH:mm');
  }

  onDateChange(): void {
    this.selectedSlot = null;
    this.form.patchValue({ startAt: null });
    this.loadAvailableSlots();
  }

  private loadAvailableSlots(): void {
    const professionalId = this.form.get('professionalId')?.value;

    if (!professionalId || !this.selectedDate) return;

    this.loadingSlots.set(true);

    const dateStr = DateTime.fromJSDate(this.selectedDate).toFormat('yyyy-MM-dd');

    const serviceId = this.form.get('serviceId')?.value;
    if (!serviceId) {
      this.availableSlots.set([]);
      return;
    }

    this.availabilityApi.getSlots(professionalId, {
      dateFrom: dateStr,
      dateTo: dateStr,
      serviceId: serviceId,
    }).subscribe({
      next: (response) => {
        const slots = response.data.slots.map((slot): SlotOption => {
          const dt = DateTime.fromISO(slot.startTime);
          return {
            label: dt.toFormat('HH:mm'),
            value: slot.startTime,
            available: slot.available,
          };
        });

        this.availableSlots.set(slots);
        this.loadingSlots.set(false);
      },
      error: () => {
        this.loadingSlots.set(false);
        // Si no hay disponibilidad configurada, permitir selección manual
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin disponibilidad',
          detail: 'No hay disponibilidad configurada. Puedes seleccionar la hora manualmente.',
        });
      },
    });
  }

  selectSlot(slot: SlotOption): void {
    if (!slot.available) return;

    this.selectedSlot = slot.value;
    this.form.patchValue({ startAt: new Date(slot.value) });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.getRawValue();

    const data = {
      clientId: formValue.clientId,
      professionalId: formValue.professionalId,
      serviceId: formValue.serviceId,
      startAt: formValue.startAt!.toISOString(),
      notes: formValue.notes || undefined,
    };

    const request$ = this.isEditing()
      ? this.appointmentsApi.update(this.appointmentId, data)
      : this.appointmentsApi.create(data);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditing() ? 'Turno actualizado' : 'Turno creado',
          detail: this.isEditing()
            ? 'Los cambios han sido guardados'
            : 'El turno ha sido creado exitosamente',
        });
        this.router.navigate(['/appointments']);
      },
      error: (error) => {
        this.saving.set(false);
        const errorCode = error?.error?.error?.code;
        const errorDetails = error?.error?.error?.details;

        // Handle duplicate appointment
        if (errorCode === 'DUPLICATE_CLIENT_SERVICE_APPOINTMENT') {
          const existingAppointment = errorDetails?.existingAppointment;
          const serviceName = existingAppointment?.serviceName || 'este servicio';
          const professionalName = existingAppointment?.professionalName || 'un profesional';
          
          let existingDate = '';
          if (existingAppointment?.startAt) {
            const startAtValue = existingAppointment.startAt;
            // Puede ser string ISO o Date
            const dt = typeof startAtValue === 'string' 
              ? DateTime.fromISO(startAtValue)
              : DateTime.fromJSDate(new Date(startAtValue));
            existingDate = dt.toFormat('dd/MM/yyyy HH:mm');
          }

          this.confirmationService.confirm({
            message: `
              <div class="duplicate-appointment-message">
                <p><strong>El cliente ya tiene un turno con ${serviceName} para este día.</strong></p>
                <p>Turno existente:</p>
                <ul>
                  <li>Fecha: ${existingDate}</li>
                  <li>Profesional: ${professionalName}</li>
                  <li>Servicio: ${serviceName}</li>
                </ul>
                <p>¿Qué deseas hacer?</p>
              </div>
            `,
            header: 'Turno duplicado',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Cambiar fecha',
            rejectLabel: 'Mantener turno actual',
            acceptButtonStyleClass: 'p-button-primary',
            rejectButtonStyleClass: 'p-button-secondary',
            accept: () => {
              // El usuario quiere cambiar la fecha, solo limpiar la fecha seleccionada
              this.selectedDate = null;
              this.selectedSlot = null;
              this.form.patchValue({ startAt: null });
              this.availableSlots.set([]);
              this.messageService.add({
                severity: 'info',
                summary: 'Selecciona otra fecha',
                detail: 'Por favor, elige una fecha diferente para el turno.',
              });
            },
            reject: () => {
              // El usuario quiere mantener el turno actual, navegar a la lista
              this.messageService.add({
                severity: 'info',
                summary: 'Turno mantenido',
                detail: 'Se mantiene el turno existente.',
              });
              this.router.navigate(['/appointments']);
            },
          });
        } else if (errorCode === 'APPOINTMENT_OVERLAP') {
          this.messageService.add({
            severity: 'error',
            summary: 'Horario ocupado',
            detail: 'Ya existe un turno en ese horario. Por favor, selecciona otro.',
          });
        } else if (errorCode === 'OUTSIDE_AVAILABILITY') {
          this.messageService.add({
            severity: 'error',
            summary: 'Fuera de horario',
            detail: 'El horario seleccionado está fuera de la disponibilidad del profesional.',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.error?.error?.message || 'No se pudo crear el turno. Por favor, intenta nuevamente.',
          });
        }
      },
    });
  }
}
