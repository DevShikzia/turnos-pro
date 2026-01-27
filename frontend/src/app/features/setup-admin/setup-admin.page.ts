import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SetupAdminApi } from './setup-admin.api';

@Component({
  selector: 'app-setup-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  template: `
    <div class="setup-container">
      <div class="setup-card">
        <!-- Header -->
        <div class="setup-header">
          <div class="logo">
            <i class="pi pi-cog"></i>
          </div>
          <h1>Configuración Inicial</h1>
          <p>Crea el primer administrador del sistema</p>
        </div>

        <!-- Info -->
        <div class="setup-info">
          <i class="pi pi-info-circle"></i>
          <span>Este paso solo se puede realizar una vez. Asegúrate de guardar las credenciales.</span>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="setupToken">Token de Setup</label>
            <input
              pInputText
              id="setupToken"
              type="password"
              formControlName="setupToken"
              placeholder="Token proporcionado en .env"
              class="w-full"
            />
            @if (form.get('setupToken')?.touched && form.get('setupToken')?.errors?.['required']) {
              <small class="form-error">El token es requerido</small>
            }
            <small class="form-hint">Variable SETUP_TOKEN de tu archivo .env</small>
          </div>

          <div class="form-group">
            <label for="email">Email del Administrador</label>
            <input
              pInputText
              id="email"
              type="email"
              formControlName="email"
              placeholder="admin@tuempresa.com"
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
            <label for="password">Contraseña</label>
            <p-password
              id="password"
              formControlName="password"
              [feedback]="true"
              [toggleMask]="true"
              placeholder="Mínimo 8 caracteres"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            @if (form.get('password')?.touched && form.get('password')?.errors?.['required']) {
              <small class="form-error">La contraseña es requerida</small>
            }
            @if (form.get('password')?.touched && form.get('password')?.errors?.['minlength']) {
              <small class="form-error">Mínimo 8 caracteres</small>
            }
            @if (form.get('password')?.touched && form.get('password')?.errors?.['pattern']) {
              <small class="form-error">Debe incluir mayúscula, minúscula y número</small>
            }
          </div>

          <p-button
            type="submit"
            label="Crear Administrador"
            icon="pi pi-check"
            [loading]="loading()"
            [disabled]="form.invalid || loading()"
            styleClass="w-full"
          />
        </form>

        <!-- Footer -->
        <div class="setup-footer">
          <p>¿Ya existe un admin? <a routerLink="/login">Iniciar sesión</a></p>
        </div>
      </div>
    </div>
    <p-toast />
  `,
  styles: [`
    .setup-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%);
    }

    .setup-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--spacing-2xl);
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-lg);
    }

    .setup-header {
      text-align: center;
      margin-bottom: var(--spacing-lg);

      .logo {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-lg);
        background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-primary) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto var(--spacing-md);

        i {
          font-size: 1.75rem;
          color: white;
        }
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-text);
        margin: 0 0 var(--spacing-xs);
      }

      p {
        color: var(--color-text-secondary);
        margin: 0;
      }
    }

    .setup-info {
      background: var(--color-info-light);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      font-size: 0.875rem;
      color: #0891B2;

      i {
        flex-shrink: 0;
        margin-top: 2px;
      }
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

    .setup-footer {
      margin-top: var(--spacing-lg);
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-text-secondary);

      a {
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `],
})
export class SetupAdminPage {
  private fb = inject(FormBuilder);
  private setupApi = inject(SetupAdminApi);
  private messageService = inject(MessageService);
  private router = inject(Router);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    setupToken: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
      ],
    ],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    const { setupToken, email, password } = this.form.getRawValue();

    this.setupApi.createAdmin({ email, password }, setupToken).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Éxito!',
          detail: 'Administrador creado correctamente. Ahora puedes iniciar sesión.',
          life: 5000,
        });
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
