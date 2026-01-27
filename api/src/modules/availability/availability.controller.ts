import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { availabilityService } from './availability.service.js';

/**
 * GET /availability/:professionalId
 * Obtiene todas las disponibilidades de un profesional
 */
export const getAvailability = asyncHandler(async (req: Request, res: Response) => {
  const professionalId = req.params.professionalId as string;
  const serviceId = req.query.serviceId as string | undefined;

  if (serviceId) {
    // Obtener disponibilidad específica de un servicio
    const availability = await availabilityService.getByProfessionalAndService(
      professionalId,
      serviceId
    );
    res.json({
      data: availability || null,
    });
  } else {
    // Obtener todas las disponibilidades del profesional
    const availabilities = await availabilityService.getByProfessionalId(professionalId);
    res.json({
      data: availabilities,
    });
  }
});

/**
 * PUT /availability/:professionalId
 * Crea o actualiza la disponibilidad de un profesional para un servicio
 */
export const upsertAvailability = asyncHandler(async (req: Request, res: Response) => {
  const professionalId = req.params.professionalId as string;

  const availability = await availabilityService.upsert(professionalId, req.body);

  res.json({
    data: availability,
    meta: { message: 'Disponibilidad actualizada correctamente' },
  });
});

/**
 * GET /availability/:professionalId/slots
 * Obtiene los slots disponibles para un profesional en un rango de fechas
 */
export const getAvailableSlots = asyncHandler(async (req: Request, res: Response) => {
  const professionalId = req.params.professionalId as string;

  const slots = await availabilityService.getAvailableSlots(professionalId, {
    dateFrom: req.query.dateFrom as string,
    dateTo: req.query.dateTo as string,
    serviceId: req.query.serviceId as string | undefined,
  });

  res.json({ data: slots });
});
