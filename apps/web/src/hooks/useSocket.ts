import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, initSocket, PLANNING_EVENTS, SocketEventHandlers } from '@/lib/socket';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = initSocket();
    socketRef.current = socket;

    // Set up event listeners
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Register event handlers
  const on = <T extends keyof SocketEventHandlers>(
    event: T,
    handler: SocketEventHandlers[T]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler as any);
    }
  };

  // Unregister event handlers
  const off = <T extends keyof SocketEventHandlers>(
    event: T,
    handler: SocketEventHandlers[T]
  ) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler as any);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    on,
    off,
  };
} 