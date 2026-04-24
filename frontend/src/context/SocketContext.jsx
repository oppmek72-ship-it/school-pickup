import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    // Connect socket for ALL users (including unauthenticated monitor)
    const newSocket = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Join appropriate rooms based on role
      if (user?.role === 'teacher' && user?.classroomId) {
        newSocket.emit('join-classroom', { classroomId: user.classroomId });
      } else if (user?.role === 'parent') {
        newSocket.emit('join-parent', user.id);
      }
    });

    newSocket.on('reconnect', () => {
      console.log('Socket reconnected');
      if (user?.role === 'teacher' && user?.classroomId) {
        newSocket.emit('join-classroom', { classroomId: user.classroomId });
      } else if (user?.role === 'parent') {
        newSocket.emit('join-parent', user.id);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user?.role, user?.classroomId, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
