import {io} from "socket.io-client";
const baseURL = import.meta.env.VITE_BASE_URL;

const socket = io(`http://${baseURL}:4000`, {
  withCredentials: true,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5
});

export default socket;