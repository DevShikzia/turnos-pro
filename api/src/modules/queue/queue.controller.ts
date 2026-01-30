import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { queueService } from './queue.service.js';
import { AuditContext } from '../../types/common.types.js';

const getAuditContext = (req: Request): AuditContext => ({
  actorId: req.user!.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId,
});

/**
 * POST /queue/kiosk/ticket
 * Endpoint público para kiosco (genera ticket)
 */
export const createTicketFromKiosk = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await queueService.createTicket(req.body);

  res.status(201).json({
    data: {
      code: ticket.code,
      type: ticket.type,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
    meta: { message: 'Ticket generado correctamente' },
  });
});

/**
 * GET /queue/kiosk/screen
 * Estado de la pantalla pública (llamado actual + últimos llamados). Persiste al actualizar/recargar.
 */
export const getScreenState = asyncHandler(async (req: Request, res: Response) => {
  const locationId = ((req.query.locationId as string) || 'main') as string;
  const state = await queueService.getScreenState(locationId);
  res.json({ data: state });
});

/**
 * GET /queue/kiosk/status/:code
 * Obtiene estado de un ticket por código (kiosco)
 */
export const getTicketStatusByCode = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string;
  const locationId = ((req.query.locationId as string) || 'main') as string;

  const ticket = await queueService.getTicketByCode(code, locationId);

  if (!ticket) {
    res.status(404).json({
      error: {
        code: 'TICKET_NOT_FOUND',
        message: 'Ticket no encontrado',
        requestId: req.requestId,
      },
    });
    return;
  }

  res.json({
    data: {
      code: ticket.code,
      status: ticket.status,
      calledAt: ticket.calledAt,
      deskId: ticket.deskId,
    },
  });
});

/**
 * GET /queue/tickets
 * Obtiene lista de tickets (requiere auth)
 */
export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const result = await queueService.getTickets(req.query as any);

  res.json(result);
});

/**
 * GET /queue/tickets/:id
 * Obtiene un ticket por ID
 */
export const getTicketById = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await queueService.getTicketById(req.params.id as string);

  res.json({ data: ticket });
});

/**
 * POST /queue/tickets/:id/call
 * Llama a un ticket
 */
export const callTicket = asyncHandler(async (req: Request, res: Response) => {
  const context = getAuditContext(req);
  const ticket = await queueService.callTicket(req.params.id as string, req.body, context);

  res.json({
    data: ticket,
    meta: { message: 'Ticket llamado correctamente' },
  });
});

/**
 * POST /queue/tickets/:id/serve
 * Marca ticket como "en servicio"
 */
export const serveTicket = asyncHandler(async (req: Request, res: Response) => {
  const context = getAuditContext(req);
  const ticket = await queueService.serveTicket(req.params.id as string, context);

  res.json({
    data: ticket,
    meta: { message: 'Ticket en servicio' },
  });
});

/**
 * POST /queue/tickets/:id/done
 * Marca ticket como "completado"
 */
export const doneTicket = asyncHandler(async (req: Request, res: Response) => {
  const context = getAuditContext(req);
  const ticket = await queueService.doneTicket(req.params.id as string, context);

  res.json({
    data: ticket,
    meta: { message: 'Ticket completado' },
  });
});

/**
 * POST /queue/tickets/:id/cancel
 * Cancela un ticket
 */
export const cancelTicket = asyncHandler(async (req: Request, res: Response) => {
  const context = getAuditContext(req);
  const ticket = await queueService.cancelTicket(req.params.id as string, context);

  res.json({
    data: ticket,
    meta: { message: 'Ticket cancelado' },
  });
});

/**
 * PUT /queue/desks/assign
 * Asigna una ventanilla a un recepcionista
 */
export const assignDesk = asyncHandler(async (req: Request, res: Response) => {
  const context = getAuditContext(req);
  const assignment = await queueService.assignDesk(req.body, context);

  res.json({
    data: assignment,
    meta: { message: 'Ventanilla asignada correctamente' },
  });
});

/**
 * GET /queue/desks
 * Obtiene todas las ventanillas de una ubicación
 */
export const getDesks = asyncHandler(async (req: Request, res: Response) => {
  const locationId = ((req.query.locationId as string) || 'main') as string;
  const desks = await queueService.getDesks(locationId);

  res.json({ data: desks });
});
