import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../api/config';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token) return;

    let newSocket;
    let cancelled = false;

    import('socket.io-client').then(({ io }) => {
      if (cancelled) return;
      newSocket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      const joinRooms = () => {
        if (user?.role === 'teacher' && user?.classroomId) {
          newSocket.emit('join-classroom', { classroomId: user.classroomId });
        } else if (user?.role === 'parent') {
          newSocket.emit('join-parent', user.id);
        }
      };

      newSocket.on('connect', joinRooms);
      newSocket.on('reconnect', joinRooms);

      setSocket(newSocket);
    });

    return () => {
      cancelled = true;
      if (newSocket) newSocket.close();
      setSocket(null);
    };
  }, [token, user?.role, user?.classroomId, user?.id]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
