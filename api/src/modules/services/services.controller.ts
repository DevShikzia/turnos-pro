import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { servicesService } from './services.service.js';
import {
  CreateServiceInput,
  UpdateServiceInput,
  ServiceQueryInput,
} from './services.types.js';

const getAuditContext = (req: Request) => ({
  actorId: req.user!.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId,
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateServiceInput;
  const service = await servicesService.create(input, getAuditContext(req));

  res.status(201).json({ data: service });
});

export const getServices = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ServiceQueryInput;
  const result = await servicesService.findAll(query);

  res.json(result);
});

export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const service = await servicesService.findById(req.params['id'] as string);

  res.json({ data: service });
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateServiceInput;
  const service = await servicesService.update(
    req.params['id'] as string,
    input,
    getAuditContext(req)
  );

  res.json({ data: service });
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const service = await servicesService.delete(req.params['id'] as string, getAuditContext(req));

  res.json({
    data: service,
    meta: { message: 'Servicio desactivado correctamente' },
  });
});
