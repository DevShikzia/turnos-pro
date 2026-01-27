import { Types, FilterQuery } from 'mongoose';
import { Appointment } from './appointments.model.js';
import {
  IAppointmentDocument,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  AppointmentQueryInput,
} from './appointments.types.js';
import { PaginatedResult, AuditContext } from '../../types/common.types.js';
import { ApiError } from '../../utils/api-error.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';
import { APPOINTMENT_STATUS, AppointmentStatus } from '../../constants/appointment-status.js';
import { clientsService } from '../clients/clients.service.js';
import { professionalsService } from '../professionals/professionals.service.js';
import { servicesService } from '../services/services.service.js';
import { availabilityService } from '../availability/availability.service.js';

class AppointmentsService {
  async create(
    input: CreateAppointmentInput,
    context: AuditContext
  ): Promise<IAppointmentDocument> {
    // Validar que el cliente, profesional y servicio existan y estén activos
    const [client, professional, service] = await Promise.all([
      clientsService.findActiveById(input.clientId),
      professionalsService.findActiveById(input.professionalId),
      servicesService.findActiveById(input.serviceId),
    ]);

    // Verificar que el profesional ofrece este servicio
    const professionalServices = professional.services.map((s) => s.toString());
    if (!professionalServices.includes(input.serviceId)) {
      throw ApiError.badRequest(
        'El profesional no ofrece este servicio',
        'PROFESSIONAL_SERVICE_MISMATCH'
      );
    }

    // Verificar si el cliente ya tiene un turno con el mismo servicio el mismo día
    const startAt = new Date(input.startAt);
    const { DateTime } = await import('luxon');
    const startDT = DateTime.fromJSDate(startAt);
    const startOfDay = startDT.startOf('day').toJSDate();
    const endOfDay = startDT.endOf('day').toJSDate();

    const existingAppointment = await Appointment.findOne({
      clientId: new Types.ObjectId(input.clientId),
      serviceId: new Types.ObjectId(input.serviceId),
      status: { $ne: APPOINTMENT_STATUS.CANCELLED },
      startAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('serviceId', 'name')
      .populate('professionalId', 'fullName')
      .lean();

    if (existingAppointment) {
      const serviceId = existingAppointment.serviceId as unknown;
      const professionalId = existingAppointment.professionalId as unknown;
      
      const serviceName =
        typeof serviceId === 'object' && serviceId !== null && 'name' in serviceId
          ? (serviceId as { name: string }).name
          : 'este servicio';
      const professionalName =
        typeof professionalId === 'object' && professionalId !== null && 'fullName' in professionalId
          ? (professionalId as { fullName: string }).fullName
          : 'un profesional';

      throw ApiError.conflict(
        'El cliente ya tiene un turno con este servicio para este día',
        'DUPLICATE_CLIENT_SERVICE_APPOINTMENT',
        {
          existingAppointment: {
            id: existingAppointment._id,
            startAt: existingAppointment.startAt,
            serviceName,
            professionalName,
          },
        }
      );
    }

    // Obtener disponibilidad para calcular duración y buffer
    const availability = await availabilityService.getByProfessionalAndService(
      input.professionalId,
      input.serviceId
    );
    if (!availability) {
      throw ApiError.badRequest(
        'El profesional no tiene disponibilidad configurada para este servicio',
        'AVAILABILITY_NOT_FOUND'
      );
    }

    // Calcular endAt basado en la duración de la disponibilidad del profesional
    const endAt = new Date(startAt.getTime() + availability.durationMin * 60 * 1000);

    // Validar que el horario está dentro de la disponibilidad del profesional para este servicio
    await availabilityService.validateAppointmentTime(
      input.professionalId,
      input.serviceId,
      startAt,
      endAt
    );

    // Usar buffer de la disponibilidad
    const totalBuffer = availability.bufferMin;

    // Verificar solapamiento de turnos (considerando buffer)
    await this.checkOverlap(input.professionalId, startAt, endAt, undefined, totalBuffer);

    const appointment = await Appointment.create({
      startAt,
      endAt,
      status: APPOINTMENT_STATUS.PENDING,
      clientId: new Types.ObjectId(input.clientId),
      professionalId: new Types.ObjectId(input.professionalId),
      serviceId: new Types.ObjectId(input.serviceId),
      createdBy: context.actorId,
      notes: input.notes,
    });

    await auditService.logCreate(
      context,
      AUDIT_ACTIONS.APPOINTMENT_CREATED,
      AUDIT_ENTITIES.APPOINTMENT,
      appointment._id as Types.ObjectId,
      {
        ...appointment.toObject(),
        clientName: client.fullName,
        professionalName: professional.fullName,
        serviceName: service.name,
      }
    );

    return appointment;
  }

  async findAll(query: AppointmentQueryInput): Promise<PaginatedResult> {
    const { professionalId, clientId, status, dateFrom, dateTo, page, limit } = query;

    const filter: FilterQuery<IAppointmentDocument> = {};

    if (professionalId) {
      filter.professionalId = new Types.ObjectId(professionalId);
    }

    if (clientId) {
      filter.clientId = new Types.ObjectId(clientId);
    }

    if (status) {
      filter.status = status;
    }

    if (dateFrom || dateTo) {
      filter.startAt = {};
      if (dateFrom) {
        filter.startAt.$gte = dateFrom;
      }
      if (dateTo) {
        filter.startAt.$lte = dateTo;
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Appointment.find(filter)
        .populate('clientId', 'fullName phone email')
        .populate('professionalId', 'fullName')
        .populate('serviceId', 'name description')
        .populate('createdBy', 'email')
        .sort({ startAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<IAppointmentDocument> {
    const appointment = await Appointment.findById(id)
      .populate('clientId', 'fullName phone email')
      .populate('professionalId', 'fullName')
      .populate('serviceId', 'name description')
      .populate('createdBy', 'email');

    if (!appointment) {
      throw ApiError.notFound('Turno no encontrado');
    }

    return appointment;
  }

  async update(
    id: string,
    input: UpdateAppointmentInput,
    context: AuditContext
  ): Promise<IAppointmentDocument> {
    const appointment = await this.findById(id);
    const before = appointment.toObject();

    // No permitir editar turnos cancelados
    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw ApiError.badRequest('No se puede editar un turno cancelado', 'APPOINTMENT_CANCELLED');
    }

    // Validar entidades si se están actualizando
    if (input.clientId) {
      await clientsService.findActiveById(input.clientId);
      appointment.clientId = new Types.ObjectId(input.clientId);
    }

    let service = null;
    if (input.serviceId) {
      service = await servicesService.findActiveById(input.serviceId);
      appointment.serviceId = new Types.ObjectId(input.serviceId);
    }

    if (input.professionalId) {
      const professional = await professionalsService.findActiveById(input.professionalId);
      const serviceId = input.serviceId || appointment.serviceId.toString();
      const professionalServices = professional.services.map((s) => s.toString());
      if (!professionalServices.includes(serviceId)) {
        throw ApiError.badRequest(
          'El profesional no ofrece este servicio',
          'PROFESSIONAL_SERVICE_MISMATCH'
        );
      }
      appointment.professionalId = new Types.ObjectId(input.professionalId);
    }

    // Si cambia startAt, professionalId o serviceId, recalcular endAt usando disponibilidad
    if (input.startAt || input.professionalId || input.serviceId) {
      const startAt = input.startAt ? new Date(input.startAt) : appointment.startAt;
      const professionalId = input.professionalId || appointment.professionalId.toString();
      const serviceId = input.serviceId || appointment.serviceId.toString();

      // Obtener disponibilidad para calcular duración y buffer
      const availability = await availabilityService.getByProfessionalAndService(
        professionalId,
        serviceId
      );
      if (!availability) {
        throw ApiError.badRequest(
          'El profesional no tiene disponibilidad configurada para este servicio',
          'AVAILABILITY_NOT_FOUND'
        );
      }

      const endAt = new Date(startAt.getTime() + availability.durationMin * 60 * 1000);

      // Validar disponibilidad
      await availabilityService.validateAppointmentTime(professionalId, serviceId, startAt, endAt);

      // Usar buffer de la disponibilidad
      const totalBuffer = availability.bufferMin;

      // Verificar solapamiento (excluyendo este turno)
      await this.checkOverlap(professionalId, startAt, endAt, id, totalBuffer);

      appointment.startAt = startAt;
      appointment.endAt = endAt;
    }

    if (input.notes !== undefined) {
      appointment.notes = input.notes;
    }

    await appointment.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.APPOINTMENT_UPDATED,
      AUDIT_ENTITIES.APPOINTMENT,
      appointment._id as Types.ObjectId,
      before,
      appointment.toObject()
    );

    return appointment;
  }

  async updateStatus(
    id: string,
    input: UpdateAppointmentStatusInput,
    context: AuditContext
  ): Promise<IAppointmentDocument> {
    const appointment = await this.findById(id);
    const before = appointment.toObject();

    // Validar transiciones de estado válidas
    this.validateStatusTransition(appointment.status, input.status);

    appointment.status = input.status as AppointmentStatus;
    await appointment.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.APPOINTMENT_STATUS_CHANGED,
      AUDIT_ENTITIES.APPOINTMENT,
      appointment._id as Types.ObjectId,
      { status: before.status },
      { status: input.status }
    );

    return appointment;
  }

  async cancel(id: string, context: AuditContext): Promise<IAppointmentDocument> {
    const appointment = await this.findById(id);
    const before = appointment.toObject();

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw ApiError.badRequest('El turno ya está cancelado', 'ALREADY_CANCELLED');
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    await appointment.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.APPOINTMENT_CANCELLED,
      AUDIT_ENTITIES.APPOINTMENT,
      appointment._id as Types.ObjectId,
      { status: before.status },
      { status: APPOINTMENT_STATUS.CANCELLED }
    );

    return appointment;
  }

  /**
   * Verifica si hay solapamiento de turnos para un profesional
   * Condición de solapamiento: (startAt < existingEndAt + buffer) AND (endAt + buffer > existingStartAt)
   */
  private async checkOverlap(
    professionalId: string,
    startAt: Date,
    endAt: Date,
    excludeAppointmentId?: string,
    bufferMin: number = 0
  ): Promise<void> {
    // Expandir el rango de búsqueda para considerar el buffer
    const searchStartAt = new Date(startAt.getTime() - bufferMin * 60 * 1000);
    const searchEndAt = new Date(endAt.getTime() + bufferMin * 60 * 1000);

    const filter: FilterQuery<IAppointmentDocument> = {
      professionalId: new Types.ObjectId(professionalId),
      status: { $ne: APPOINTMENT_STATUS.CANCELLED },
      startAt: { $lt: searchEndAt },
      endAt: { $gt: searchStartAt },
    };

    if (excludeAppointmentId) {
      filter._id = { $ne: new Types.ObjectId(excludeAppointmentId) };
    }

    const overlappingAppointment = await Appointment.findOne(filter);

    if (overlappingAppointment) {
      throw ApiError.conflict(
        'El profesional ya tiene un turno en ese horario',
        'APPOINTMENT_OVERLAP',
        {
          existingAppointment: {
            id: overlappingAppointment._id,
            startAt: overlappingAppointment.startAt,
            endAt: overlappingAppointment.endAt,
          },
          bufferMin,
        }
      );
    }
  }

  /**
   * Valida las transiciones de estado permitidas
   */
  private validateStatusTransition(
    currentStatus: AppointmentStatus,
    newStatus: string
  ): void {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [APPOINTMENT_STATUS.PENDING]: [
        APPOINTMENT_STATUS.CONFIRMED,
        APPOINTMENT_STATUS.CANCELLED,
      ],
      [APPOINTMENT_STATUS.CONFIRMED]: [
        APPOINTMENT_STATUS.ATTENDED,
        APPOINTMENT_STATUS.NO_SHOW,
        APPOINTMENT_STATUS.CANCELLED,
      ],
      [APPOINTMENT_STATUS.ATTENDED]: [],
      [APPOINTMENT_STATUS.NO_SHOW]: [],
      [APPOINTMENT_STATUS.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus as AppointmentStatus)) {
      throw ApiError.badRequest(
        `No se puede cambiar el estado de "${currentStatus}" a "${newStatus}"`,
        'INVALID_STATUS_TRANSITION'
      );
    }
  }
}

export const appointmentsService = new AppointmentsService();
