const setupSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join:gate', () => {
      socket.join('gate');
      console.log('Gate display connected:', socket.id);
    });

    socket.on('join:teacher', () => {
      socket.join('teacher');
      console.log('Teacher connected:', socket.id);
    });

    socket.on('join:parent', (userId) => {
      socket.join(`parent:${userId}`);
      console.log(`Parent ${userId} connected:`, socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSocketEvents;
