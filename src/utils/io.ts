import {io} from "socket.io-client";
const baseURL = import.meta.env.VITE_BASE_URL;
const serverUrl = import.meta.env.VITE_SERVER

const socket = io(`${serverUrl}`, {
  withCredentials: true,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5
});

export default socket;