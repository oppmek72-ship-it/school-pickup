import { useEffect } from 'react';
import { useSocket as useSocketContext } from '../context/SocketContext';

export function useSocketEvent(event, callback) {
  const socket = useSocketContext();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [socket, event, callback]);
}
