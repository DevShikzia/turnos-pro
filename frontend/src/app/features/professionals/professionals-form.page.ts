import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ProfessionalsApi } from './professionals.api';
import { ServicesApi } from '../services/services.api';
import { ServiceDTO } from '@shared/models/api.types';

@Component({
  selector: 'app-professionals-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    MultiSelectModule,
    ToastModule,
    PageHeaderComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="isEditing() ? 'Editar profesional' : 'Nuevo profesional'"
        [subtitle]="isEditing() ? 'Modifica los datos del profesional' : 'Agrega un nuevo profesional'"
      />

      @if (pageLoading()) {
        <app-loading text="Cargando..." />
      } @else {
        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="fullName">Nombre completo *</label>
                <input
                  pInputText
                  id="fullName"
                  formControlName="fullName"
                  placeholder="Ej: Juan Pérez"
                  class="w-full"
                />
                @if (form.get('fullName')?.touched && form.get('fullName')?.errors?.['required']) {
                  <small class="form-error">El nombre es requerido</small>
                }
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input
                  pInputText
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="profesional@email.com"
                  class="w-full"
                />
              </div>

              <div class="form-group">
                <label for="phone">Teléfono</label>
                <input
                  pInputText
                  id="phone"
                  formControlName="phone"
                  placeholder="+54 11 1234-5678"
                  class="w-full"
                />
              </div>

              <div class="form-group full-width">
                <label for="services">Servicios que ofrece</label>
                <p-multiSelect
                  id="services"
                  formControlName="services"
                  [options]="servicesOptions()"
                  optionLabel="name"
                  optionValue="_id"
                  placeholder="Seleccionar servicios"
                  display="chip"
                  styleClass="w-full"
                />
                <small class="form-hint">
                  Selecciona los servicios que este profesional puede realizar
                </small>
              </div>
            </div>

            <div class="form-actions">
              <p-button
                label="Cancelar"
                severity="secondary"
                routerLink="/professionals"
                styleClass="btn-cancel"
              />
              <p-button
                type="submit"
                [label]="isEditing() ? 'Guardar cambios' : 'Crear profesional'"
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
  `,
  styles: [`
    .form-card {
      max-width: 600px;
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
      color: var(--color-text-muted);
      font-size: 0.75rem;
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
  `],
})
export class ProfessionalsFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private professionalsApi = inject(ProfessionalsApi);
  private servicesApi = inject(ServicesApi);
  private messageService = inject(MessageService);

  isEditing = signal(false);
  pageLoading = signal(true);
  saving = signal(false);
  professionalId = '';
  servicesOptions = signal<ServiceDTO[]>([]);

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: [''],
    phone: [''],
    services: [[] as string[]],
  });

  ngOnInit(): void {
    this.professionalId = this.route.snapshot.params['id'];

    if (this.professionalId) {
      this.isEditing.set(true);
    }

    this.loadServices();
  }

  private loadServices(): void {
    this.servicesApi.list({ isActive: true, limit: 100 }).subscribe({
      next: (response) => {
        this.servicesOptions.set(response.data);

        if (this.isEditing()) {
          this.loadProfessional();
        } else {
          this.pageLoading.set(false);
        }
      },
      error: () => {
        this.pageLoading.set(false);
      },
    });
  }

  private loadProfessional(): void {
    this.professionalsApi.getById(this.professionalId).subscribe({
      next: (response) => {
        const professional = response.data;
        const serviceIds = professional.services?.map((s) =>
          typeof s === 'object' ? s._id : s
        ) || [];

        this.form.patchValue({
          fullName: professional.fullName,
          email: professional.email || '',
          phone: professional.phone || '',
          services: serviceIds,
        });
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
        this.router.navigate(['/professionals']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.getRawValue();
    const data = {
      fullName: formValue.fullName,
      email: formValue.email || undefined,
      phone: formValue.phone || undefined,
      services: formValue.services,
    };

    const request$ = this.isEditing()
      ? this.professionalsApi.update(this.professionalId, data)
      : this.professionalsApi.create(data);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditing() ? 'Profesional actualizado' : 'Profesional creado',
          detail: this.isEditing()
            ? 'Los cambios han sido guardados'
            : 'El profesional ha sido creado exitosamente',
        });
        this.router.navigate(['/professionals']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
