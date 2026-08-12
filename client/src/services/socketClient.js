import { io } from 'socket.io-client';

// Use env var or fallback to empty string so it connects to the same origin (Vite proxy)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // We will connect manually when authenticated
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
