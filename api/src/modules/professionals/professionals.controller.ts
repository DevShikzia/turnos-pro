import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { professionalsService } from './professionals.service.js';
import {
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalQueryInput,
} from './professionals.types.js';

const getAuditContext = (req: Request) => ({
  actorId: req.user!.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId,
});

export const createProfessional = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateProfessionalInput;
  const professional = await professionalsService.create(input, getAuditContext(req));

  res.status(201).json({ data: professional });
});

export const getProfessionals = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ProfessionalQueryInput;
  const result = await professionalsService.findAll(query);

  res.json(result);
});

export const getProfessionalById = asyncHandler(async (req: Request, res: Response) => {
  const professional = await professionalsService.findById(req.params['id'] as string);

  res.json({ data: professional });
});

export const updateProfessional = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateProfessionalInput;
  const professional = await professionalsService.update(
    req.params['id'] as string,
    input,
    getAuditContext(req)
  );

  res.json({ data: professional });
});

export const deleteProfessional = asyncHandler(async (req: Request, res: Response) => {
  const professional = await professionalsService.delete(req.params['id'] as string, getAuditContext(req));

  res.json({
    data: professional,
    meta: { message: 'Profesional desactivado correctamente' },
  });
});
