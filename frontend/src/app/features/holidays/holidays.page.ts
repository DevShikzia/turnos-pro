import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { HolidaysApi, HolidayDTO, CreateHolidayRequest } from './holidays.api';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-holidays',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    CalendarModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header
        title="Feriados y Días No Laborables"
        subtitle="Configura los días en que no se podrán agendar turnos"
      >
        <p-button
          label="Agregar feriado"
          icon="pi pi-plus"
          (onClick)="openDialog()"
        />
      </app-page-header>

      @if (loading()) {
        <app-loading text="Cargando feriados..." />
      } @else if (holidays().length === 0) {
        <app-empty-state
          icon="pi-calendar-times"
          title="No hay feriados configurados"
          message="Agrega feriados o días no laborables para bloquear turnos"
        >
          <p-button
            label="Agregar feriado"
            icon="pi pi-plus"
            (onClick)="openDialog()"
          />
        </app-empty-state>
      } @else {
        <div class="card">
          <p-table
            [value]="holidays()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th class="hide-mobile">Descripción</th>
                <th>Recurrente</th>
                <th>Estado</th>
                <th style="width: 120px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-holiday>
              <tr>
                <td>
                  <span class="font-medium">{{ formatDate(holiday.date) }}</span>
                </td>
                <td>{{ holiday.name }}</td>
                <td class="hide-mobile">{{ holiday.description || '-' }}</td>
                <td>
                  <p-tag
                    [value]="holiday.isRecurring ? 'Sí' : 'No'"
                    [severity]="holiday.isRecurring ? 'info' : 'secondary'"
                  />
                </td>
                <td>
                  <p-tag
                    [value]="holiday.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="holiday.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  <div class="actions">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      severity="info"
                      size="small"
                      (onClick)="openDialog(holiday)"
                      pTooltip="Editar"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      (onClick)="confirmDelete(holiday)"
                      pTooltip="Eliminar"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>

    <!-- Dialog para crear/editar -->
    <p-dialog
      [header]="editingHoliday ? 'Editar feriado' : 'Nuevo feriado'"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: '450px', minHeight: '400px' }"
      [contentStyle]="{ overflow: 'visible' }"
    >
      <div class="dialog-content">
        <div class="form-group">
          <label for="holidayDate">Fecha *</label>
          <p-calendar
            id="holidayDate"
            [(ngModel)]="formDate"
            dateFormat="dd/mm/yy"
            [showIcon]="true"
            placeholder="Seleccionar fecha"
            styleClass="w-full"
            appendTo="body"
          />
        </div>

        <div class="form-group">
          <label for="holidayName">Nombre *</label>
          <input
            pInputText
            id="holidayName"
            [(ngModel)]="formName"
            placeholder="Ej: Navidad"
            class="w-full"
          />
        </div>

        <div class="form-group">
          <label for="holidayDescription">Descripción</label>
          <textarea
            pInputTextarea
            id="holidayDescription"
            [(ngModel)]="formDescription"
            placeholder="Descripción opcional..."
            [rows]="2"
            class="w-full"
          ></textarea>
        </div>

        <div class="form-group checkbox-group">
          <p-checkbox
            [(ngModel)]="formIsRecurring"
            [binary]="true"
            inputId="isRecurring"
          />
          <label for="isRecurring">Feriado recurrente (se repite cada año)</label>
        </div>

        @if (editingHoliday) {
          <div class="form-group checkbox-group">
            <p-checkbox
              [(ngModel)]="formIsActive"
              [binary]="true"
              inputId="isActive"
            />
            <label for="isActive">Activo</label>
          </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="dialog-footer">
          <p-button
            label="Cancelar"
            severity="secondary"
            (onClick)="dialogVisible = false"
            styleClass="btn-cancel"
          />
          <p-button
            [label]="editingHoliday ? 'Guardar' : 'Crear'"
            icon="pi pi-check"
            [loading]="saving()"
            (onClick)="saveHoliday()"
            [disabled]="!formDate || !formName"
          />
        </div>
      </ng-template>
    </p-dialog>

    <p-toast />
    <p-confirmDialog />
  `,
  styles: [`
    .actions {
      display: flex;
      gap: var(--spacing-xs);
    }

    .dialog-content {
      padding: var(--spacing-sm) 0;
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

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--spacing-sm);
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
export class HolidaysPage implements OnInit {
  private holidaysApi = inject(HolidaysApi);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  loading = signal(true);
  saving = signal(false);
  holidays = signal<HolidayDTO[]>([]);

  // Dialog
  dialogVisible = false;
  editingHoliday: HolidayDTO | null = null;
  formDate: Date | null = null;
  formName = '';
  formDescription = '';
  formIsRecurring = false;
  formIsActive = true;

  ngOnInit(): void {
    this.loadHolidays();
  }

  private loadHolidays(): void {
    this.holidaysApi.list({ limit: 100 }).subscribe({
      next: (response) => {
        this.holidays.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  formatDate(dateStr: string): string {
    return DateTime.fromISO(dateStr).toFormat('dd/MM/yyyy');
  }

  openDialog(holiday?: HolidayDTO): void {
    if (holiday) {
      this.editingHoliday = holiday;
      this.formDate = DateTime.fromISO(holiday.date).toJSDate();
      this.formName = holiday.name;
      this.formDescription = holiday.description || '';
      this.formIsRecurring = holiday.isRecurring;
      this.formIsActive = holiday.isActive;
    } else {
      this.editingHoliday = null;
      this.formDate = null;
      this.formName = '';
      this.formDescription = '';
      this.formIsRecurring = false;
      this.formIsActive = true;
    }
    this.dialogVisible = true;
  }

  saveHoliday(): void {
    if (!this.formDate || !this.formName) return;

    this.saving.set(true);
    const dateStr = DateTime.fromJSDate(this.formDate).toFormat('yyyy-MM-dd');

    if (this.editingHoliday) {
      this.holidaysApi
        .update(this.editingHoliday._id, {
          date: dateStr,
          name: this.formName,
          description: this.formDescription || undefined,
          isRecurring: this.formIsRecurring,
          isActive: this.formIsActive,
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Feriado actualizado',
              detail: 'Los cambios han sido guardados',
            });
            this.dialogVisible = false;
            this.saving.set(false);
            this.loadHolidays();
          },
          error: () => {
            this.saving.set(false);
          },
        });
    } else {
      const data: CreateHolidayRequest = {
        date: dateStr,
        name: this.formName,
        description: this.formDescription || undefined,
        isRecurring: this.formIsRecurring,
      };

      this.holidaysApi.create(data).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Feriado creado',
            detail: `${this.formName} ha sido agregado`,
          });
          this.dialogVisible = false;
          this.saving.set(false);
          this.loadHolidays();
        },
        error: () => {
          this.saving.set(false);
        },
      });
    }
  }

  confirmDelete(holiday: HolidayDTO): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar "${holiday.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteHoliday(holiday),
    });
  }

  private deleteHoliday(holiday: HolidayDTO): void {
    this.holidaysApi.delete(holiday._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Feriado eliminado',
          detail: `${holiday.name} ha sido eliminado`,
        });
        this.loadHolidays();
      },
    });
  }
}
