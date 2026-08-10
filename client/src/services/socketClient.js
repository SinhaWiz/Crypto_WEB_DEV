import { io } from 'socket.io-client';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:10000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? API_ORIGIN;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socket;
}
