import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ServicesApi } from './services.api';

@Component({
  selector: 'app-services-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    ToastModule,
    PageHeaderComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="isEditing() ? 'Editar servicio' : 'Nuevo servicio'"
        [subtitle]="isEditing() ? 'Modifica los datos del servicio' : 'Agrega un nuevo servicio'"
      />

      @if (pageLoading()) {
        <app-loading text="Cargando..." />
      } @else {
        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="name">Nombre del servicio *</label>
                <input
                  pInputText
                  id="name"
                  formControlName="name"
                  placeholder="Ej: Corte de cabello"
                  class="w-full"
                />
                @if (form.get('name')?.touched && form.get('name')?.errors?.['required']) {
                  <small class="form-error">El nombre es requerido</small>
                }
              </div>

              <div class="form-group full-width">
                <label for="description">Descripción</label>
                <textarea
                  pInputTextarea
                  id="description"
                  formControlName="description"
                  placeholder="Descripción del servicio..."
                  [rows]="3"
                  class="w-full"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <p-button
                label="Cancelar"
                severity="secondary"
                routerLink="/services"
                styleClass="btn-cancel"
              />
              <p-button
                type="submit"
                [label]="isEditing() ? 'Guardar cambios' : 'Crear servicio'"
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
export class ServicesFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private servicesApi = inject(ServicesApi);
  private messageService = inject(MessageService);

  isEditing = signal(false);
  pageLoading = signal(false);
  saving = signal(false);
  serviceId = '';

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.serviceId = this.route.snapshot.params['id'];

    if (this.serviceId) {
      this.isEditing.set(true);
      this.loadService();
    }
  }

  private loadService(): void {
    this.pageLoading.set(true);

    this.servicesApi.getById(this.serviceId).subscribe({
      next: (response) => {
        const service = response.data;
        this.form.patchValue({
          name: service.name,
          description: service.description || '',
        });
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
        this.router.navigate(['/services']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.getRawValue();
    const data = {
      name: formValue.name,
      description: formValue.description || undefined,
    };

    const request$ = this.isEditing()
      ? this.servicesApi.update(this.serviceId, data)
      : this.servicesApi.create(data);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditing() ? 'Servicio actualizado' : 'Servicio creado',
          detail: this.isEditing()
            ? 'Los cambios han sido guardados'
            : 'El servicio ha sido creado exitosamente',
        });
        this.router.navigate(['/services']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
