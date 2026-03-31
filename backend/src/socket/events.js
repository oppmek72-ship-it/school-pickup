const setupSocketEvents = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Monitor/Gate display
    socket.on('join-monitor', () => {
      socket.join('monitor');
      console.log('Monitor connected:', socket.id);
    });

    // Teacher joins their classroom room
    socket.on('join-classroom', ({ classroomId }) => {
      socket.join(`classroom_${classroomId}`);
      console.log(`Teacher joined classroom_${classroomId}:`, socket.id);
    });

    // Parent joins their room
    socket.on('join-parent', (userId) => {
      socket.join(`parent_${userId}`);
    });

    // Legacy support
    socket.on('join:gate', () => socket.join('monitor'));
    socket.on('join:teacher', () => socket.join('teacher'));
    socket.on('join:parent', (userId) => socket.join(`parent_${userId}`));

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = setupSocketEvents;
