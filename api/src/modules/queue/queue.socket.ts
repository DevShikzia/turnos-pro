import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { User } from '../users/users.model.js';
import { logger } from '../../utils/logger.js';

export type SocketServer = SocketIOServer;

let io: SocketServer | null = null;

/**
 * Inicializa Socket.io
 */
export function initializeSocketIO(httpServer: HTTPServer): SocketServer {
  // Parsear múltiples orígenes para CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  
  // En desarrollo, permitir cualquier localhost
  const corsOrigins = env.NODE_ENV === 'development' 
    ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : allowedOrigins;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
    path: '/socket.io',
  });

  // Middleware de autenticación para sockets
  io.use(async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        // Permitir conexiones sin token (para pantallas públicas y kiosco)
        return next();
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
      const user = await User.findById(decoded.sub);

      if (!user || !user.isActive) {
        return next(new Error('Usuario no válido'));
      }

      // Agregar información del usuario al socket
      socket.data.userId = user._id.toString();
      socket.data.userRole = user.role;
      next();
    } catch (error) {
      // Permitir conexiones sin autenticación (pantallas públicas)
      next();
    }
  });

  io.on('connection', (socket) => {
    const locationId = (socket.handshake.query.locationId as string) || 'main';
    
    logger.info(
      {
        socketId: socket.id,
        userId: socket.data.userId,
        locationId: locationId,
        rooms: [`queue:${locationId}`],
      },
      'Cliente conectado a Socket.io'
    );

    // Unirse al room de locationId
    socket.join(`queue:${locationId}`);
    logger.info({ socketId: socket.id, room: `queue:${locationId}` }, 'Socket unido al room');

    // Si tiene deskId, unirse también a ese room
    const deskId = socket.handshake.query.deskId as string;
    if (deskId) {
      socket.join(`desk:${locationId}:${deskId}`);
      logger.info({ socketId: socket.id, room: `desk:${locationId}:${deskId}` }, 'Socket unido al room del desk');
    }

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Cliente desconectado de Socket.io');
    });
  });

  return io;
}

/**
 * Obtiene la instancia de Socket.io
 */
export function getSocketIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
}

/**
 * Emite evento de ticket creado
 */
export function emitTicketCreated(locationId: string, ticket: any): void {
  if (!io) return;

  io.to(`queue:${locationId}`).emit('queue:ticketCreated', {
    id: ticket._id,
    code: ticket.code,
    type: ticket.type,
    status: ticket.status,
    dni: ticket.dni,
    createdAt: ticket.createdAt,
  });
}

/**
 * Emite evento de ticket actualizado
 */
export function emitTicketUpdated(locationId: string, ticket: any): void {
  if (!io) {
    console.warn('[Socket] Socket.io no inicializado, no se puede emitir evento');
    return;
  }

  const locId = locationId || ticket.locationId || 'main';
  const ticketStatus = ticket.status || 'waiting';
  const ticketDeskId = ticket.deskId || null;

  console.log('[Socket] Emitiendo ticketUpdated:', {
    locationId: locId,
    code: ticket.code,
    status: ticketStatus,
    deskId: ticketDeskId,
  });

  io.to(`queue:${locId}`).emit('queue:ticketUpdated', {
    id: ticket._id || ticket.id,
    code: ticket.code,
    status: ticketStatus,
    deskId: ticketDeskId,
    calledAt: ticket.calledAt,
    clientNeedsData: ticket.clientNeedsData === true,
  });

  // Si el ticket fue llamado (status = "called"), emitir evento específico al room general
  if (ticketStatus === 'called' && ticketDeskId) {
    const ticketCalledData = {
      id: ticket._id || ticket.id,
      code: ticket.code,
      deskId: ticketDeskId,
      calledAt: ticket.calledAt || new Date().toISOString(),
      clientNeedsData: ticket.clientNeedsData === true,
    };

    console.log('[Socket] Emitiendo ticketCalled al room general:', {
      room: `queue:${locId}`,
      data: ticketCalledData,
      connectedClients: io.sockets.adapter.rooms.get(`queue:${locId}`)?.size || 0,
    });

    // Emitir al room general
    io.to(`queue:${locId}`).emit('queue:ticketCalled', ticketCalledData);

    // También emitir al room específico del desk
    io.to(`desk:${locId}:${ticketDeskId}`).emit('queue:ticketCalled', ticketCalledData);
    
    // DEBUG: Emitir también a todos los sockets conectados para verificar
    console.log('[Socket] Total de sockets conectados:', io.sockets.sockets.size);
    io.sockets.sockets.forEach((socket) => {
      const socketLocationId = (socket.handshake.query.locationId as string) || 'main';
      console.log('[Socket] Socket:', {
        id: socket.id,
        locationId: socketLocationId,
        rooms: Array.from(socket.rooms),
      });
    });
  }
}

/**
 * Emite evento de ventanilla asignada
 */
export function emitDeskAssigned(locationId: string, assignment: any): void {
  if (!io) return;

  io.to(`queue:${locationId}`).emit('queue:deskAssigned', {
    deskId: assignment.deskId,
    receptionistId: assignment.receptionistId,
    active: assignment.active,
  });
}

/**
 * Envía snapshot inicial de la fila (solo al conectar)
 */
export function emitQueueSnapshot(socket: any, locationId: string, tickets: any[]): void {
  socket.emit('queue:snapshot', {
    locationId,
    tickets: tickets.map((t) => ({
      id: t._id,
      code: t.code,
      type: t.type,
      status: t.status,
      dni: t.dni,
      deskId: t.deskId,
      calledAt: t.calledAt,
      createdAt: t.createdAt,
    })),
  });
}
