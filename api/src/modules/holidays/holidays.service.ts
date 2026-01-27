import { Holiday } from './holidays.model.js';
import {
  IHolidayDocument,
  CreateHolidayInput,
  UpdateHolidayInput,
  HolidayQueryInput,
} from './holidays.types.js';
import { ApiError } from '../../utils/api-error.js';

interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class HolidaysService {
  async create(input: CreateHolidayInput): Promise<IHolidayDocument> {
    // Verificar que no exista un feriado en la misma fecha
    const existing = await Holiday.findOne({ date: input.date });
    if (existing) {
      throw ApiError.conflict(
        `Ya existe un feriado para la fecha ${input.date}`,
        'HOLIDAY_DATE_EXISTS'
      );
    }

    const holiday = await Holiday.create(input);
    return holiday;
  }

  async findAll(query: HolidayQueryInput): Promise<PaginatedResult<IHolidayDocument>> {
    const { dateFrom, dateTo, isActive, page = 1, limit = 50 } = query;

    const filter: Record<string, unknown> = {};

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        (filter.date as Record<string, string>).$gte = dateFrom;
      }
      if (dateTo) {
        (filter.date as Record<string, string>).$lte = dateTo;
      }
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Holiday.find(filter).sort({ date: 1 }).skip(skip).limit(limit),
      Holiday.countDocuments(filter),
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

  async findById(id: string): Promise<IHolidayDocument> {
    const holiday = await Holiday.findById(id);
    if (!holiday) {
      throw ApiError.notFound('Feriado no encontrado');
    }
    return holiday;
  }

  async update(id: string, input: UpdateHolidayInput): Promise<IHolidayDocument> {
    const holiday = await this.findById(id);

    // Si cambia la fecha, verificar que no exista otro feriado en esa fecha
    if (input.date && input.date !== holiday.date) {
      const existing = await Holiday.findOne({ date: input.date, _id: { $ne: id } });
      if (existing) {
        throw ApiError.conflict(
          `Ya existe un feriado para la fecha ${input.date}`,
          'HOLIDAY_DATE_EXISTS'
        );
      }
    }

    Object.assign(holiday, input);
    await holiday.save();
    return holiday;
  }

  async delete(id: string): Promise<IHolidayDocument> {
    const holiday = await this.findById(id);
    await holiday.deleteOne();
    return holiday;
  }

  /**
   * Verifica si una fecha es feriado
   */
  async isHoliday(date: string): Promise<boolean> {
    // Buscar feriado exacto o recurrente (mismo día/mes)
    const [year, month, day] = date.split('-');
    
    const holiday = await Holiday.findOne({
      isActive: true,
      $or: [
        { date }, // Fecha exacta
        { 
          isRecurring: true,
          date: { $regex: `-${month}-${day}$` } // Mismo día/mes (recurrente)
        },
      ],
    });

    return !!holiday;
  }

  /**
   * Obtiene los feriados de un rango de fechas (incluyendo recurrentes)
   */
  async getHolidaysInRange(dateFrom: string, dateTo: string): Promise<string[]> {
    const holidays = await Holiday.find({
      isActive: true,
      $or: [
        { date: { $gte: dateFrom, $lte: dateTo } },
        { isRecurring: true },
      ],
    });

    const holidayDates: Set<string> = new Set();
    const startYear = parseInt(dateFrom.split('-')[0] || '2024');
    const endYear = parseInt(dateTo.split('-')[0] || '2024');

    for (const h of holidays) {
      if (h.isRecurring) {
        // Para feriados recurrentes, generar las fechas para los años en el rango
        const parts = h.date.split('-');
        const month = parts[1] || '01';
        const day = parts[2] || '01';
        for (let year = startYear; year <= endYear; year++) {
          const recurringDate = `${year}-${month}-${day}`;
          if (recurringDate >= dateFrom && recurringDate <= dateTo) {
            holidayDates.add(recurringDate);
          }
        }
      } else {
        holidayDates.add(h.date);
      }
    }

    return Array.from(holidayDates).sort();
  }
}

export const holidaysService = new HolidaysService();
