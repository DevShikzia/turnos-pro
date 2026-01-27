import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { holidaysService } from './holidays.service.js';
import {
  createHolidaySchema,
  updateHolidaySchema,
  holidayQuerySchema,
  idParamSchema,
} from './holidays.schema.js';

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const input = createHolidaySchema.parse(req.body);

  const holiday = await holidaysService.create(input);

  res.status(201).json({
    message: 'Feriado creado exitosamente',
    data: holiday,
  });
});

export const getHolidays = asyncHandler(async (req: Request, res: Response) => {
  const query = holidayQuerySchema.parse(req.query);

  const result = await holidaysService.findAll(query);

  res.json(result);
});

export const getHolidayById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);

  const holiday = await holidaysService.findById(id);

  res.json({ data: holiday });
});

export const updateHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateHolidaySchema.parse(req.body);

  const holiday = await holidaysService.update(id, input);

  res.json({
    message: 'Feriado actualizado exitosamente',
    data: holiday,
  });
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);

  const holiday = await holidaysService.delete(id);

  res.json({
    message: 'Feriado eliminado exitosamente',
    data: holiday,
  });
});

export const getHolidaysInRange = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };

  if (!dateFrom || !dateTo) {
    res.status(400).json({
      message: 'Se requieren dateFrom y dateTo',
    });
    return;
  }

  const holidays = await holidaysService.getHolidaysInRange(dateFrom, dateTo);

  res.json({ data: holidays });
});
