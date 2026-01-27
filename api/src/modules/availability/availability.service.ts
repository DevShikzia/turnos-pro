import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { Availability } from './availability.model.js';
import {
  IAvailabilityDocument,
  AvailabilityInput,
  SlotsQueryInput,
  IAvailableSlot,
  IAvailableSlotsResponse,
  ITimeSlot,
} from './availability.types.js';
import { ApiError } from '../../utils/api-error.js';
import { professionalsService } from '../professionals/professionals.service.js';
import { servicesService } from '../services/services.service.js';
import { Appointment } from '../appointments/appointments.model.js';
import { APPOINTMENT_STATUS } from '../../constants/appointment-status.js';
import { holidaysService } from '../holidays/holidays.service.js';

class AvailabilityService {
  /**
   * Obtiene todas las disponibilidades de un profesional
   */
  async getByProfessionalId(professionalId: string): Promise<IAvailabilityDocument[]> {
    // Verificar que el profesional existe
    await professionalsService.findById(professionalId);

    return Availability.find({
      professionalId: new Types.ObjectId(professionalId),
    }).populate('serviceId', 'name');
  }

  /**
   * Obtiene la disponibilidad de un profesional para un servicio específico
   */
  async getByProfessionalAndService(
    professionalId: string,
    serviceId: string
  ): Promise<IAvailabilityDocument | null> {
    // Verificar que el profesional existe
    const professional = await professionalsService.findById(professionalId);
    
    // Verificar que el profesional ofrece este servicio
    // Los servicios pueden venir como ObjectIds o como objetos populados (con populate)
    const serviceIdObj = new Types.ObjectId(serviceId);
    
    const hasService = professional.services.some((s: any) => {
      // Caso 1: Objeto populado (tiene _id como propiedad)
      if (s && typeof s === 'object' && s._id) {
        const sId = s._id instanceof Types.ObjectId ? s._id : new Types.ObjectId(s._id);
        return sId.equals(serviceIdObj);
      }
      // Caso 2: ObjectId de Mongoose
      if (s instanceof Types.ObjectId) {
        return s.equals(serviceIdObj);
      }
      // Caso 3: String o cualquier otro formato
      try {
        const sId = new Types.ObjectId(s);
        return sId.equals(serviceIdObj);
      } catch {
        return false;
      }
    });
    
    if (!hasService) {
      throw ApiError.badRequest(
        'El profesional no ofrece este servicio',
        'PROFESSIONAL_SERVICE_MISMATCH'
      );
    }

    return Availability.findOne({
      professionalId: new Types.ObjectId(professionalId),
      serviceId: new Types.ObjectId(serviceId),
    });
  }

  /**
   * Crea o actualiza la disponibilidad de un profesional para un servicio
   */
  async upsert(
    professionalId: string,
    input: AvailabilityInput
  ): Promise<IAvailabilityDocument> {
    // Verificar que el profesional existe
    const professional = await professionalsService.findById(professionalId);

    // Verificar que el profesional ofrece este servicio
    // Los servicios pueden venir como ObjectIds o como objetos populados (con populate)
    const serviceIdObj = new Types.ObjectId(input.serviceId);
    
    const hasService = professional.services.some((s: any) => {
      // Caso 1: Objeto populado (tiene _id como propiedad)
      if (s && typeof s === 'object' && s._id) {
        const sId = s._id instanceof Types.ObjectId ? s._id : new Types.ObjectId(s._id);
        return sId.equals(serviceIdObj);
      }
      // Caso 2: ObjectId de Mongoose
      if (s instanceof Types.ObjectId) {
        return s.equals(serviceIdObj);
      }
      // Caso 3: String o cualquier otro formato
      try {
        const sId = new Types.ObjectId(s);
        return sId.equals(serviceIdObj);
      } catch {
        return false;
      }
    });
    
    if (!hasService) {
      throw ApiError.badRequest(
        'El profesional no ofrece este servicio',
        'PROFESSIONAL_SERVICE_MISMATCH'
      );
    }

    // Validar slots no solapados dentro de cada día
    this.validateNoOverlappingSlots(input.weekly);

    // Validar que no haya choques con otros servicios del mismo profesional
    await this.validateNoServiceOverlap(professionalId, input.serviceId, input.weekly, input.exceptions);

    const availability = await Availability.findOneAndUpdate(
      {
        professionalId: new Types.ObjectId(professionalId),
        serviceId: new Types.ObjectId(input.serviceId),
      },
      {
        $set: {
          serviceId: new Types.ObjectId(input.serviceId),
          timezone: input.timezone,
          weekly: input.weekly,
          exceptions: input.exceptions,
          bufferMin: input.bufferMin,
          durationMin: input.durationMin,
          price: input.price,
        },
      },
      { new: true, upsert: true }
    );

    return availability;
  }

  /**
   * Obtiene los slots disponibles para un profesional en un rango de fechas
   */
  async getAvailableSlots(
    professionalId: string,
    query: SlotsQueryInput
  ): Promise<IAvailableSlotsResponse> {
    const professional = await professionalsService.findById(professionalId);
    
    if (!query.serviceId) {
      throw ApiError.badRequest(
        'El serviceId es requerido para obtener slots disponibles',
        'SERVICE_ID_REQUIRED'
      );
    }

    const availability = await this.getByProfessionalAndService(professionalId, query.serviceId);

    if (!availability) {
      throw ApiError.notFound(
        'No se ha configurado disponibilidad para este profesional',
        'AVAILABILITY_NOT_FOUND'
      );
    }

    // Usar duración y buffer de la disponibilidad del profesional
    const durationMin = availability.durationMin;
    const totalBuffer = availability.bufferMin;

    // Obtener turnos existentes en el rango
    const existingAppointments = await Appointment.find({
      professionalId: new Types.ObjectId(professionalId),
      status: { $ne: APPOINTMENT_STATUS.CANCELLED },
      startAt: {
        $gte: DateTime.fromISO(query.dateFrom, { zone: availability.timezone }).startOf('day').toJSDate(),
        $lte: DateTime.fromISO(query.dateTo, { zone: availability.timezone }).endOf('day').toJSDate(),
      },
    }).lean();

    // Obtener feriados en el rango
    const holidays = await holidaysService.getHolidaysInRange(query.dateFrom, query.dateTo);

    // Generar slots disponibles
    const slots = this.generateSlots(
      availability,
      query.dateFrom,
      query.dateTo,
      durationMin,
      totalBuffer,
      existingAppointments,
      holidays
    );

    return {
      professionalId,
      timezone: availability.timezone,
      slots,
    };
  }

  /**
   * Valida que un horario cae dentro de la disponibilidad del profesional para un servicio
   */
  async validateAppointmentTime(
    professionalId: string,
    serviceId: string,
    startAt: Date,
    endAt: Date
  ): Promise<void> {
    const availability = await this.getByProfessionalAndService(professionalId, serviceId);

    if (!availability) {
      // Si no hay disponibilidad configurada, permitir (comportamiento legacy)
      return;
    }

    const startDT = DateTime.fromJSDate(startAt).setZone(availability.timezone);
    const endDT = DateTime.fromJSDate(endAt).setZone(availability.timezone);
    const dateStr = startDT.toFormat('yyyy-MM-dd');
    const weekday = startDT.weekday; // 1-7 ISO

    // Verificar si es feriado
    const isHoliday = await holidaysService.isHoliday(dateStr);
    if (isHoliday) {
      throw ApiError.conflict(
        'No se pueden agendar turnos en días feriados',
        'HOLIDAY_DATE',
        { date: dateStr }
      );
    }

    // Verificar si hay una excepción para esta fecha
    const exception = availability.exceptions.find((e) => e.date === dateStr);

    if (exception) {
      if (!exception.isAvailable) {
        throw ApiError.conflict(
          'El profesional no está disponible en esta fecha',
          'OUTSIDE_AVAILABILITY',
          { date: dateStr, reason: 'exception_not_available' }
        );
      }

      // Verificar slots de la excepción
      if (exception.slots && exception.slots.length > 0) {
        if (!this.isWithinSlots(startDT, endDT, exception.slots)) {
          throw ApiError.conflict(
            'El horario no está dentro de la disponibilidad del profesional',
            'OUTSIDE_AVAILABILITY',
            { date: dateStr, reason: 'outside_exception_slots' }
          );
        }
        return;
      }
    }

    // Verificar disponibilidad semanal
    const weeklySchedule = availability.weekly.find((w) => w.weekday === weekday);

    if (!weeklySchedule || weeklySchedule.slots.length === 0) {
      throw ApiError.conflict(
        'El profesional no trabaja este día',
        'OUTSIDE_AVAILABILITY',
        { weekday, reason: 'day_not_available' }
      );
    }

    if (!this.isWithinSlots(startDT, endDT, weeklySchedule.slots)) {
      throw ApiError.conflict(
        'El horario no está dentro del horario de trabajo del profesional',
        'OUTSIDE_AVAILABILITY',
        { weekday, reason: 'outside_working_hours' }
      );
    }
  }

  /**
   * Verifica si un rango de tiempo cae dentro de algún slot
   */
  private isWithinSlots(
    startDT: DateTime,
    endDT: DateTime,
    slots: ITimeSlot[]
  ): boolean {
    const startTime = startDT.toFormat('HH:mm');
    const endTime = endDT.toFormat('HH:mm');

    return slots.some((slot) => {
      return startTime >= slot.startTime && endTime <= slot.endTime;
    });
  }

  /**
   * Genera slots disponibles para un rango de fechas
   */
  private generateSlots(
    availability: IAvailabilityDocument,
    dateFrom: string,
    dateTo: string,
    durationMin: number,
    bufferMin: number,
    existingAppointments: Array<{ startAt: Date; endAt: Date }>,
    holidays: string[]
  ): IAvailableSlot[] {
    const slots: IAvailableSlot[] = [];
    const tz = availability.timezone;
    const holidaySet = new Set(holidays);

    let currentDate = DateTime.fromISO(dateFrom, { zone: tz });
    const endDate = DateTime.fromISO(dateTo, { zone: tz });

    while (currentDate <= endDate) {
      const dateStr = currentDate.toFormat('yyyy-MM-dd');
      const weekday = currentDate.weekday;

      // Saltar feriados
      if (holidaySet.has(dateStr)) {
        currentDate = currentDate.plus({ days: 1 });
        continue;
      }

      // Obtener slots para este día
      let daySlots: ITimeSlot[] = [];
      const exception = availability.exceptions.find((e) => e.date === dateStr);

      if (exception) {
        if (!exception.isAvailable) {
          currentDate = currentDate.plus({ days: 1 });
          continue;
        }
        daySlots = exception.slots || [];
      } else {
        const weeklySchedule = availability.weekly.find((w) => w.weekday === weekday);
        daySlots = weeklySchedule?.slots || [];
      }

      // Generar slots para cada rango de tiempo
      for (const timeSlot of daySlots) {
        const [startHour, startMinute] = timeSlot.startTime.split(':');
        const [endHour, endMinute] = timeSlot.endTime.split(':');

        let slotStart = currentDate.set({
          hour: parseInt(startHour || '0', 10),
          minute: parseInt(startMinute || '0', 10),
          second: 0,
          millisecond: 0,
        });

        const slotEnd = currentDate.set({
          hour: parseInt(endHour || '0', 10),
          minute: parseInt(endMinute || '0', 10),
          second: 0,
          millisecond: 0,
        });

        while (slotStart.plus({ minutes: durationMin }) <= slotEnd) {
          const appointmentEnd = slotStart.plus({ minutes: durationMin });

          // Verificar si está disponible (no hay turnos que se solapen)
          const isAvailable = !existingAppointments.some((apt) => {
            const aptStart = DateTime.fromJSDate(apt.startAt);
            const aptEnd = DateTime.fromJSDate(apt.endAt);
            // Considerar buffer
            const aptEndWithBuffer = aptEnd.plus({ minutes: bufferMin });
            const slotStartWithBuffer = slotStart.minus({ minutes: bufferMin });

            return slotStartWithBuffer < aptEndWithBuffer && appointmentEnd > aptStart;
          });

          // Solo incluir slots futuros
          if (slotStart > DateTime.now()) {
            slots.push({
              startTime: slotStart.toISO()!,
              endTime: appointmentEnd.toISO()!,
              available: isAvailable,
            });
          }

          slotStart = slotStart.plus({ minutes: durationMin + bufferMin });
        }
      }

      currentDate = currentDate.plus({ days: 1 });
    }

    return slots;
  }

  /**
   * Valida que no haya slots solapados dentro de un mismo día
   */
  private validateNoOverlappingSlots(
    weekly: Array<{ weekday: number; slots: ITimeSlot[] }>
  ): void {
    for (const day of weekly) {
      const slots = day.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (let i = 0; i < slots.length - 1; i++) {
        const currentSlot = slots[i];
        const nextSlot = slots[i + 1];
        if (currentSlot && nextSlot && currentSlot.endTime > nextSlot.startTime) {
          throw ApiError.badRequest(
            `Slots solapados en el día ${day.weekday}`,
            'OVERLAPPING_SLOTS',
            {
              weekday: day.weekday,
              slot1: currentSlot,
              slot2: nextSlot,
            }
          );
        }
      }
    }
  }

  /**
   * Valida que no haya choques entre servicios del mismo profesional
   */
  private async validateNoServiceOverlap(
    professionalId: string,
    currentServiceId: string,
    weekly: Array<{ weekday: number; slots: ITimeSlot[] }>,
    exceptions: Array<{ date: string; isAvailable: boolean; slots?: ITimeSlot[] }>
  ): Promise<void> {
    // Obtener todas las disponibilidades del profesional excepto la actual
    const otherAvailabilities = await Availability.find({
      professionalId: new Types.ObjectId(professionalId),
      serviceId: { $ne: new Types.ObjectId(currentServiceId) },
    }).populate('serviceId', 'name');

    if (otherAvailabilities.length === 0) {
      return; // No hay otros servicios, no hay choques posibles
    }

    // Verificar choques en horarios semanales
    for (const day of weekly) {
      for (const slot of day.slots) {
        for (const otherAvailability of otherAvailabilities) {
          const otherDay = otherAvailability.weekly.find((w) => w.weekday === day.weekday);
          if (otherDay) {
            for (const otherSlot of otherDay.slots) {
              // Verificar si hay solapamiento
              if (
                (slot.startTime < otherSlot.endTime && slot.endTime > otherSlot.startTime) ||
                (otherSlot.startTime < slot.endTime && otherSlot.endTime > slot.startTime)
              ) {
                const serviceName =
                  typeof otherAvailability.serviceId === 'object' &&
                  otherAvailability.serviceId !== null &&
                  'name' in otherAvailability.serviceId
                    ? (otherAvailability.serviceId as { name: string }).name
                    : 'otro servicio';

                throw ApiError.conflict(
                  `El horario se solapa con el servicio "${serviceName}" en el día ${day.weekday}`,
                  'SERVICE_SCHEDULE_OVERLAP',
                  {
                    weekday: day.weekday,
                    currentSlot: slot,
                    conflictingSlot: otherSlot,
                    conflictingService: serviceName,
                  }
                );
              }
            }
          }
        }
      }
    }

    // Verificar choques en excepciones
    for (const exception of exceptions) {
      if (!exception.isAvailable || !exception.slots || exception.slots.length === 0) {
        continue;
      }

      for (const slot of exception.slots) {
        for (const otherAvailability of otherAvailabilities) {
          const otherException = otherAvailability.exceptions.find(
            (e) => e.date === exception.date && e.isAvailable && e.slots && e.slots.length > 0
          );
          if (otherException && otherException.slots) {
            for (const otherSlot of otherException.slots) {
              // Verificar si hay solapamiento
              if (
                (slot.startTime < otherSlot.endTime && slot.endTime > otherSlot.startTime) ||
                (otherSlot.startTime < slot.endTime && otherSlot.endTime > slot.startTime)
              ) {
                const serviceName =
                  typeof otherAvailability.serviceId === 'object' &&
                  otherAvailability.serviceId !== null &&
                  'name' in otherAvailability.serviceId
                    ? (otherAvailability.serviceId as { name: string }).name
                    : 'otro servicio';

                throw ApiError.conflict(
                  `El horario se solapa con el servicio "${serviceName}" en la fecha ${exception.date}`,
                  'SERVICE_SCHEDULE_OVERLAP',
                  {
                    date: exception.date,
                    currentSlot: slot,
                    conflictingSlot: otherSlot,
                    conflictingService: serviceName,
                  }
                );
              }
            }
          }
        }
      }
    }
  }
}

export const availabilityService = new AvailabilityService();
