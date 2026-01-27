import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { appointmentsService } from './appointments.service.js';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
  AppointmentQueryInput,
} from './appointments.types.js';

const getAuditContext = (req: Request) => ({
  actorId: req.user!.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId,
});

export const createAppointment = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateAppointmentInput;
  const appointment = await appointmentsService.create(input, getAuditContext(req));

  res.status(201).json({ data: appointment });
});

export const getAppointments = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as AppointmentQueryInput;
  const result = await appointmentsService.findAll(query);

  res.json(result);
});

export const getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentsService.findById(req.params['id'] as string);

  res.json({ data: appointment });
});

export const updateAppointment = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateAppointmentInput;
  const appointment = await appointmentsService.update(
    req.params['id'] as string,
    input,
    getAuditContext(req)
  );

  res.json({ data: appointment });
});

export const updateAppointmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateAppointmentStatusInput;
  const appointment = await appointmentsService.updateStatus(
    req.params['id'] as string,
    input,
    getAuditContext(req)
  );

  res.json({ data: appointment });
});

export const cancelAppointment = asyncHandler(async (req: Request, res: Response) => {
  const appointment = await appointmentsService.cancel(req.params['id'] as string, getAuditContext(req));

  res.json({
    data: appointment,
    meta: { message: 'Turno cancelado correctamente' },
  });
});
