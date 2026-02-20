// =============================================
// VoidPark - Socket.IO Handler
// =============================================

const { Server } = require('socket.io');

let io = null;

function initializeSocket(httpServer, corsOrigins) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ── Room subscriptions ──
    socket.on('subscribeToDashboard', () => {
      socket.join('dashboard');
      console.log(`   📊 ${socket.id} joined dashboard`);
    });

    socket.on('unsubscribeFromDashboard', () => {
      socket.leave('dashboard');
    });

    socket.on('subscribeToParkingSpace', (parkingId) => {
      if (parkingId) {
        socket.join(`parking:${parkingId}`);
        console.log(`   🅿️  ${socket.id} joined parking:${parkingId}`);
      }
    });

    socket.on('unsubscribeFromParkingSpace', (parkingId) => {
      if (parkingId) {
        socket.leave(`parking:${parkingId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log('   ✅ Socket.IO initialized');
  return io;
}

// ── Helper emitters (called from controllers) ──
function emitSlotBooked(parkingId, data) {
  if (io) {
    io.to(`parking:${parkingId}`).emit('slotBooked', data);
    io.to('dashboard').emit('slotBooked', { parkingId });
  }
}

function emitSlotReleased(parkingId, data) {
  if (io) {
    io.to(`parking:${parkingId}`).emit('slotReleased', data);
    io.to('dashboard').emit('slotReleased', { parkingId });
  }
}

function emitParkingUpdated(parkingId, type) {
  if (io) {
    io.to(`parking:${parkingId}`).emit('parkingUpdated', { type, parkingId });
    io.to('dashboard').emit('parkingUpdated', { type, parkingId });
  }
}

function getIO() {
  return io;
}

module.exports = {
  initializeSocket,
  emitSlotBooked,
  emitSlotReleased,
  emitParkingUpdated,
  getIO,
};
