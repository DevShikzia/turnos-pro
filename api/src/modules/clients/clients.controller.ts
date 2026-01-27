import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { clientsService } from './clients.service.js';
import {
  CreateClientInput,
  UpdateClientInput,
  ClientQueryInput,
} from './clients.types.js';

const getAuditContext = (req: Request) => ({
  actorId: req.user!.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId,
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateClientInput;
  const client = await clientsService.create(input, getAuditContext(req));

  res.status(201).json({ data: client });
});

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ClientQueryInput;
  const result = await clientsService.findAll(query);

  res.json(result);
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.findById(req.params['id'] as string);

  res.json({ data: client });
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateClientInput;
  const client = await clientsService.update(
    req.params['id'] as string,
    input,
    getAuditContext(req)
  );

  res.json({ data: client });
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.delete(req.params['id'] as string, getAuditContext(req));

  res.json({
    data: client,
    meta: { message: 'Cliente desactivado correctamente' },
  });
});
