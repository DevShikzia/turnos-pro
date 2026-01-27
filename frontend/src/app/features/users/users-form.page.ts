import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { UsersApi } from './users.api';
import { Role } from '@shared/models/api.types';

interface RoleOption {
  label: string;
  value: Role;
  description: string;
}

@Component({
  selector: 'app-users-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DropdownModule,
    CheckboxModule,
    ToastModule,
    PageHeaderComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        [title]="isEditing() ? 'Editar usuario' : 'Nuevo usuario'"
        [subtitle]="isEditing() ? 'Modifica los datos del usuario' : 'Crea un nuevo usuario del sistema'"
      />

      @if (pageLoading()) {
        <app-loading text="Cargando..." />
      } @else {
        <div class="card form-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="email">Email *</label>
                <input
                  pInputText
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="usuario@empresa.com"
                  class="w-full"
                />
                @if (form.get('email')?.touched && form.get('email')?.errors?.['required']) {
                  <small class="form-error">El email es requerido</small>
                }
                @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
                  <small class="form-error">Email inválido</small>
                }
              </div>

              <div class="form-group">
                <label for="password">
                  {{ isEditing() ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña *' }}
                </label>
                <p-password
                  id="password"
                  formControlName="password"
                  [placeholder]="isEditing() ? '••••••••' : 'Mínimo 6 caracteres'"
                  [toggleMask]="true"
                  [feedback]="!isEditing()"
                  styleClass="w-full"
                />
                @if (!isEditing() && form.get('password')?.touched && form.get('password')?.errors?.['required']) {
                  <small class="form-error">La contraseña es requerida</small>
                }
                @if (form.get('password')?.touched && form.get('password')?.errors?.['minlength']) {
                  <small class="form-error">Mínimo 6 caracteres</small>
                }
              </div>

              <div class="form-group">
                <label for="role">Rol *</label>
                <p-dropdown
                  id="role"
                  formControlName="role"
                  [options]="roleOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Seleccionar rol"
                  styleClass="w-full"
                >
                  <ng-template let-option pTemplate="item">
                    <div class="role-option">
                      <span class="role-label">{{ option.label }}</span>
                      <span class="role-description">{{ option.description }}</span>
                    </div>
                  </ng-template>
                </p-dropdown>
                @if (form.get('role')?.touched && form.get('role')?.errors?.['required']) {
                  <small class="form-error">El rol es requerido</small>
                }
              </div>

              @if (isEditing()) {
                <div class="form-group">
                  <label>Estado</label>
                  <div class="checkbox-wrapper">
                    <p-checkbox
                      formControlName="isActive"
                      [binary]="true"
                      inputId="isActive"
                    />
                    <label for="isActive">Usuario activo</label>
                  </div>
                  <small class="form-hint">
                    Los usuarios inactivos no pueden iniciar sesión
                  </small>
                </div>
              }
            </div>

            <div class="form-actions">
              <p-button
                label="Cancelar"
                severity="secondary"
                routerLink="/users"
                styleClass="btn-cancel"
              />
              <p-button
                type="submit"
                [label]="isEditing() ? 'Guardar cambios' : 'Crear usuario'"
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
      color: var(--color-text-secondary);
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

    .role-option {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .role-label {
        font-weight: 500;
      }

      .role-description {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
      }
    }

    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);

      label {
        margin-bottom: 0;
        cursor: pointer;
      }
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
export class UsersFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersApi = inject(UsersApi);
  private messageService = inject(MessageService);

  isEditing = signal(false);
  pageLoading = signal(false);
  saving = signal(false);
  userId = '';

  roleOptions: RoleOption[] = [
    { label: 'Administrador', value: 'admin', description: 'Acceso total al sistema' },
    { label: 'Staff', value: 'staff', description: 'Gestión de turnos, clientes y configuración' },
    { label: 'Recepcionista', value: 'receptionist', description: 'Solo turnos y clientes' },
  ];

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['staff' as Role, Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];

    if (this.userId) {
      this.isEditing.set(true);
      // En edición, la contraseña es opcional
      this.form.get('password')?.clearValidators();
      this.form.get('password')?.setValidators([Validators.minLength(6)]);
      this.form.get('password')?.updateValueAndValidity();
      this.loadUser();
    }
  }

  private loadUser(): void {
    this.pageLoading.set(true);

    this.usersApi.getById(this.userId).subscribe({
      next: (response) => {
        const user = response.data;
        this.form.patchValue({
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        });
        this.pageLoading.set(false);
      },
      error: () => {
        this.pageLoading.set(false);
        this.router.navigate(['/users']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.getRawValue();

    if (this.isEditing()) {
      // En edición, solo enviar contraseña si se ingresó una nueva
      const updateData: Record<string, unknown> = {
        email: formValue.email,
        role: formValue.role,
        isActive: formValue.isActive,
      };

      if (formValue.password) {
        updateData['password'] = formValue.password;
      }

      this.usersApi.update(this.userId, updateData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario actualizado',
            detail: 'Los cambios han sido guardados',
          });
          this.router.navigate(['/users']);
        },
        error: () => {
          this.saving.set(false);
        },
      });
    } else {
      this.usersApi.create({
        email: formValue.email,
        password: formValue.password,
        role: formValue.role,
      }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario creado',
            detail: 'El usuario ha sido creado exitosamente',
          });
          this.router.navigate(['/users']);
        },
        error: () => {
          this.saving.set(false);
        },
      });
    }
  }
}
