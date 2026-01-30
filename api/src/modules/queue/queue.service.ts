import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { QueueCounter, QueueTicket, DeskAssignment } from './queue.model.js';
import {
  IQueueTicketDocument,
  IDeskAssignmentDocument,
  CreateTicketInput,
  CallTicketInput,
  AssignDeskInput,
  TicketQueryInput,
  TicketType,
  TicketStatus,
} from './queue.types.js';
import { ApiError } from '../../utils/api-error.js';
import { clientsService } from '../clients/clients.service.js';
import { Appointment } from '../appointments/appointments.model.js';
import { APPOINTMENT_STATUS } from '../../constants/appointment-status.js';
import { PaginatedResult, AuditContext } from '../../types/common.types.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';
import {
  emitTicketCreated,
  emitTicketUpdated,
  emitDeskAssigned,
} from './queue.socket.js';
import { env } from '../../config/env.js';

class QueueService {
  /**
   * Genera un ticket desde el kiosco
   * Detecta si tiene turno para hoy y genera T o C.
   * No permite más de un ticket pendiente (waiting) por DNI por día.
   */
  async createTicket(
    input: CreateTicketInput,
    locationId: string = 'main'
  ): Promise<IQueueTicketDocument> {
    const { dni } = input;
    const locId = input.locationId || locationId;

    // Obtener fecha actual en timezone local
    const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const dateKey = now.toFormat('yyyy-MM-dd');
    const startOfDay = now.startOf('day').toJSDate();
    const endOfDay = now.endOf('day').toJSDate();

    // No permitir otro ticket si ya tiene uno pendiente (waiting) hoy
    const existingTicket = await QueueTicket.findOne({
      dateKey,
      locationId: locId,
      dni,
      status: 'waiting',
    });

    if (existingTicket) {
      throw ApiError.badRequest(
        'Ya tiene un turno pendiente para hoy. Espere a ser atendido antes de solicitar otro.',
        'PENDING_TICKET_EXISTS'
      );
    }

    // Buscar cliente por DNI; si no existe, crear uno mínimo desde kiosk
    let client = await clientsService.findByDni(dni).catch(() => null);
    let clientNeedsData = false;

    if (!client) {
      client = await clientsService.createMinimalFromKiosk(dni);
      clientNeedsData = true;
    }

    let appointmentId: Types.ObjectId | undefined;
    let ticketType: TicketType = 'C';

    if (client) {
      // Buscar turno del día para este cliente
      const appointment = await Appointment.findOne({
        clientId: new Types.ObjectId(client._id),
        status: { $ne: APPOINTMENT_STATUS.CANCELLED },
        startAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      }).lean();

      if (appointment) {
        ticketType = 'T';
        appointmentId = new Types.ObjectId(appointment._id);
      }
    }

    // Generar código de ticket de forma atómica
    const counter = await QueueCounter.findOneAndUpdate(
      {
        dateKey,
        locationId: locId,
        type: ticketType,
      },
      {
        $inc: { seq: 1 },
      },
      {
        upsert: true,
        new: true,
      }
    );

    const seq = counter.seq;
    const code = `${ticketType}${String(seq).padStart(3, '0')}`;

    // Crear ticket (marcar como demo si corresponde; clientNeedsData si se creó cliente desde kiosk)
    const ticket = await QueueTicket.create({
      dateKey,
      locationId: locId,
      type: ticketType,
      code,
      seq,
      dni,
      appointmentId,
      status: 'waiting',
      isDemo: env.DEMO_MODE || false,
      clientNeedsData,
    });

    // Emitir evento Socket.io
    emitTicketCreated(locId, ticket);

    return ticket;
  }

  /**
   * Obtiene tickets con filtros y paginación
   */
  async getTickets(query: TicketQueryInput): Promise<PaginatedResult> {
    const { dateKey, locationId, status, type, page, limit } = query;

    // Si no hay dateKey, usar hoy
    const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const todayKey = dateKey || now.toFormat('yyyy-MM-dd');
    const locId = locationId || 'main';

    const filter: Record<string, unknown> = {
      dateKey: todayKey,
      locationId: locId,
    };

    if (status) {
      filter.status = status;
    }

    if (type) {
      filter.type = type;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      QueueTicket.find(filter)
        .populate('appointmentId', 'startAt endAt')
        .populate('receptionistId', 'email')
        .populate('professionalId', 'fullName')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QueueTicket.countDocuments(filter),
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

  /**
   * Obtiene un ticket por ID
   */
  async getTicketById(id: string): Promise<IQueueTicketDocument> {
    const ticket = await QueueTicket.findById(id)
      .populate('appointmentId', 'startAt endAt')
      .populate('receptionistId', 'email')
      .populate('professionalId', 'fullName');

    if (!ticket) {
      throw ApiError.notFound('Ticket no encontrado');
    }

    return ticket;
  }

  /**
   * Obtiene un ticket por código (para kiosco)
   */
  async getTicketByCode(code: string, locationId: string = 'main'): Promise<IQueueTicketDocument | null> {
    const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    const dateKey = now.toFormat('yyyy-MM-dd');

    const ticket = await QueueTicket.findOne({
      dateKey,
      locationId,
      code,
    })
      .populate('appointmentId', 'startAt endAt')
      .lean();

    return ticket as IQueueTicketDocument | null;
  }

  /**
   * Llama a un ticket (cambia status a "called")
   */
  async callTicket(
    id: string,
    input: CallTicketInput,
    context: AuditContext
  ): Promise<IQueueTicketDocument> {
    const ticket = await this.getTicketById(id);

    if (ticket.status !== 'waiting') {
      throw ApiError.badRequest(
        `No se puede llamar un ticket con estado "${ticket.status}"`,
        'INVALID_TICKET_STATUS'
      );
    }

    ticket.status = 'called';
    ticket.calledAt = new Date();
    ticket.deskId = input.deskId;
    ticket.receptionistId = context.actorId;

    await ticket.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.TICKET_CALLED,
      AUDIT_ENTITIES.QUEUE_TICKET,
      ticket._id as Types.ObjectId,
      { status: 'waiting' },
      { status: 'called', deskId: input.deskId }
    );

    // Emitir evento Socket.io - convertir a objeto plano para asegurar que todos los campos estén disponibles
    const ticketPlain = ticket.toObject ? ticket.toObject() : ticket;
    const locationId = ticket.locationId || 'main';
    
    console.log('[QueueService] Llamando ticket:', {
      id: ticket._id,
      code: ticket.code,
      status: ticket.status,
      deskId: ticket.deskId,
      locationId: locationId,
    });
    
    emitTicketUpdated(locationId, {
      _id: ticket._id,
      code: ticket.code,
      status: ticket.status,
      deskId: ticket.deskId,
      calledAt: ticket.calledAt,
      locationId: locationId,
      clientNeedsData: ticket.clientNeedsData,
    });

    return ticket;
  }

  /**
   * Marca ticket como "en servicio"
   */
  async serveTicket(id: string, context: AuditContext): Promise<IQueueTicketDocument> {
    const ticket = await this.getTicketById(id);

    if (ticket.status !== 'called') {
      throw ApiError.badRequest(
        `No se puede atender un ticket con estado "${ticket.status}"`,
        'INVALID_TICKET_STATUS'
      );
    }

    const before = ticket.toObject();
    ticket.status = 'in_service';
    await ticket.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.TICKET_SERVED,
      AUDIT_ENTITIES.QUEUE_TICKET,
      ticket._id as Types.ObjectId,
      { status: before.status },
      { status: 'in_service' }
    );

    // Emitir evento Socket.io
    emitTicketUpdated(ticket.locationId, ticket);

    return ticket;
  }

  /**
   * Marca ticket como "completado"
   */
  async doneTicket(id: string, context: AuditContext): Promise<IQueueTicketDocument> {
    const ticket = await this.getTicketById(id);

    if (!['called', 'in_service'].includes(ticket.status)) {
      throw ApiError.badRequest(
        `No se puede completar un ticket con estado "${ticket.status}"`,
        'INVALID_TICKET_STATUS'
      );
    }

    const before = ticket.toObject();
    ticket.status = 'done';
    await ticket.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.TICKET_DONE,
      AUDIT_ENTITIES.QUEUE_TICKET,
      ticket._id as Types.ObjectId,
      { status: before.status },
      { status: 'done' }
    );

    // Emitir evento Socket.io
    emitTicketUpdated(ticket.locationId, ticket);

    return ticket;
  }

  /**
   * Cancela un ticket
   */
  async cancelTicket(id: string, context: AuditContext): Promise<IQueueTicketDocument> {
    const ticket = await this.getTicketById(id);

    if (['done', 'cancelled'].includes(ticket.status)) {
      throw ApiError.badRequest(
        `No se puede cancelar un ticket con estado "${ticket.status}"`,
        'INVALID_TICKET_STATUS'
      );
    }

    const before = ticket.toObject();
    ticket.status = 'cancelled';
    await ticket.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.TICKET_CANCELLED,
      AUDIT_ENTITIES.QUEUE_TICKET,
      ticket._id as Types.ObjectId,
      { status: before.status },
      { status: 'cancelled' }
    );

    // Emitir evento Socket.io
    emitTicketUpdated(ticket.locationId, ticket);

    return ticket;
  }

  /**
   * Asigna una ventanilla a un recepcionista
   */
  async assignDesk(
    input: AssignDeskInput,
    context: AuditContext
  ): Promise<IDeskAssignmentDocument> {
    const { locationId, deskId } = input;
    const locId = locationId || 'main';

    // Desactivar desk anterior de esta recepcionista
    await DeskAssignment.updateMany(
      {
        receptionistId: context.actorId,
        active: true,
      },
      {
        $set: { active: false },
      }
    );

    // Crear o actualizar asignación
    const assignment = await DeskAssignment.findOneAndUpdate(
      {
        locationId: locId,
        deskId,
      },
      {
        $set: {
          receptionistId: context.actorId,
          active: true,
          lastSeenAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
      }
    ).populate('receptionistId', 'email');

    await auditService.logCreate(
      context,
      AUDIT_ACTIONS.DESK_ASSIGNED,
      AUDIT_ENTITIES.DESK,
      assignment._id as Types.ObjectId,
      {
        locationId: locId,
        deskId,
        receptionistId: context.actorId,
      }
    );

    // Emitir evento Socket.io
    emitDeskAssigned(locId, assignment);

    return assignment;
  }

  /**
   * Obtiene todas las ventanillas de una ubicación
   */
  async getDesks(locationId: string = 'main'): Promise<IDeskAssignmentDocument[]> {
    return DeskAssignment.find({
      locationId,
      active: true,
    })
      .populate('receptionistId', 'email')
      .sort({ deskId: 1 });
  }

  /**
   * Limpia tickets marcados como demo (cron job).
   * Elimina todos los tickets con isDemo=true de días anteriores.
   */
  async cleanupDemoTickets(): Promise<number> {
    const todayKey = DateTime.now()
      .setZone('America/Argentina/Buenos_Aires')
      .toFormat('yyyy-MM-dd');

    const result = await QueueTicket.deleteMany({
      isDemo: true,
      dateKey: { $lt: todayKey },
    });

    return result.deletedCount || 0;
  }

  /**
   * Limpia tickets antiguos (cron job)
   */
  async cleanupOldTickets(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = DateTime.now()
      .minus({ days: daysToKeep })
      .toFormat('yyyy-MM-dd');

    const result = await QueueTicket.deleteMany({
      dateKey: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  }

  /**
   * Desactiva desk assignments antiguos (cron job)
   */
  async cleanupOldDeskAssignments(): Promise<number> {
    const cutoffTime = DateTime.now().minus({ hours: 24 }).toJSDate();

    const result = await DeskAssignment.updateMany(
      {
        active: true,
        lastSeenAt: { $lt: cutoffTime },
      },
      {
        $set: { active: false },
      }
    );

    return result.modifiedCount || 0;
  }
}

export const queueService = new QueueService();
