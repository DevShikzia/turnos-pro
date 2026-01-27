import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ClientsApi } from './clients.api';

@Component({
  selector: 'app-clients-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    ToastModule,
    PageHeaderComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="isEditing() ? 'Editar cliente' : 'Nuevo cliente'"
        [subtitle]="isEditing() ? 'Modifica los datos del cliente' : 'Agrega un nuevo cliente al sistema'"
      />

      @if (pageLoading()) {
        <app-loading text="Cargando..." />
      } @else {
        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group">
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
                <label for="dni">DNI / Documento *</label>
                <input
                  pInputText
                  id="dni"
                  formControlName="dni"
                  placeholder="Ej: 12345678"
                  class="w-full"
                />
                @if (form.get('dni')?.touched && form.get('dni')?.errors?.['required']) {
                  <small class="form-error">El DNI es requerido</small>
                }
                @if (form.get('dni')?.touched && form.get('dni')?.errors?.['minlength']) {
                  <small class="form-error">Mínimo 5 caracteres</small>
                }
              </div>

              <div class="form-group">
                <label for="email">Email</label>
                <input
                  pInputText
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="cliente@email.com"
                  class="w-full"
                />
                @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
                  <small class="form-error">Email inválido</small>
                }
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
                <label for="notes">Notas</label>
                <textarea
                  pInputTextarea
                  id="notes"
                  formControlName="notes"
                  placeholder="Información adicional sobre el cliente..."
                  [rows]="3"
                  class="w-full"
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <p-button
                label="Cancelar"
                severity="secondary"
                routerLink="/clients"
                styleClass="btn-cancel"
              />
              <p-button
                type="submit"
                [label]="isEditing() ? 'Guardar cambios' : 'Crear cliente'"
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
export class ClientsFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientsApi = inject(ClientsApi);
  private messageService = inject(MessageService);

  isEditing = signal(false);
  pageLoading = signal(false);
  saving = signal(false);
  clientId = '';

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    dni: ['', [Validators.required, Validators.minLength(5)]],
    email: ['', Validators.email],
    phone: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.clientId = this.route.snapshot.params['id'];

    if (this.clientId) {
      this.isEditing.set(true);
      this.loadClient();
    }
  }

  private loadClient(): void {
    this.pageLoading.set(true);

    this.clientsApi.getById(this.clientId).subscribe({
      next: (response) => {
        const client = response.data;
        this.form.patchValue({
          fullName: client.fullName,
          dni: client.dni,
          email: client.email || '',
          phone: client.phone || '',
          notes: client.notes || '',
        });
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
        this.router.navigate(['/clients']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const data = this.form.getRawValue();

    const request$ = this.isEditing()
      ? this.clientsApi.update(this.clientId, data)
      : this.clientsApi.create(data);

    request$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditing() ? 'Cliente actualizado' : 'Cliente creado',
          detail: this.isEditing()
            ? 'Los cambios han sido guardados'
            : 'El cliente ha sido creado exitosamente',
        });
        this.router.navigate(['/clients']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }
}
