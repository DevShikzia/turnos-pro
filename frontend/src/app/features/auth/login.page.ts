import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthApi } from './auth.api';
import { StorageService } from '@core/services/storage.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
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
    <div class="login-container">
      @if (environment.demoMode) {
        <div class="demo-banner">
          <i class="pi pi-info-circle"></i>
          <span>Modo demo: solo usuario de prueba. No se pueden crear usuarios ni clientes nuevos.</span>
          @if (environment.demoUserEmail) {
            <small>Usuario: {{ environment.demoUserEmail }}</small>
          }
        </div>
      }
      <div class="login-card">
        <!-- Logo -->
        <div class="login-header">
          <div class="logo">
            <i class="pi pi-calendar-plus"></i>
          </div>
          <h1>Turnos PRO</h1>
          <p>Inicia sesión para continuar</p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              formControlName="email"
              placeholder="tu@email.com"
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
              [feedback]="false"
              [toggleMask]="true"
              placeholder="Tu contraseña"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
            @if (form.get('password')?.touched && form.get('password')?.errors?.['required']) {
              <small class="form-error">La contraseña es requerida</small>
            }
          </div>

          <p-button
            type="submit"
            label="Iniciar sesión"
            [loading]="loading()"
            [disabled]="form.invalid || loading()"
            styleClass="w-full"
          />
        </form>

        <!-- Setup Link -->
        <div class="login-footer">
          <p>¿Primera vez? <a routerLink="/setup">Configurar administrador</a></p>
        </div>
      </div>
    </div>
    <p-toast />
  `,
  styles: [`
    .demo-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: var(--spacing-sm) var(--spacing-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      font-size: 0.875rem;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .demo-banner small {
      opacity: 0.9;
      margin-left: var(--spacing-sm);
    }
    .login-container {
      min-height: 100vh;
      padding-top: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-bg) 100%);
    }

    .login-card {
      background: var(--color-surface);
      border-radius: var(--radius-xl);
      padding: var(--spacing-2xl);
      width: 100%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
    }

    .login-header {
      text-align: center;
      margin-bottom: var(--spacing-xl);

      .logo {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-lg);
        background: var(--color-primary);
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

    .login-footer {
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
export class LoginPage {
  private fb = inject(FormBuilder);
  private authApi = inject(AuthApi);
  private storage = inject(StorageService);
  private router = inject(Router);

  readonly environment = environment;
  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: [environment.demoMode && environment.demoUserEmail ? environment.demoUserEmail : '', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);

    this.authApi.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.storage.setToken(response.data.token);
        this.storage.setUser(response.data.user);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
