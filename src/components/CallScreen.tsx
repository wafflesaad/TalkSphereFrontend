import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Peer from "peerjs";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";
import { io } from "socket.io-client";

const CallScreen = () => {
  const [myPeer, setMyPeer] = useState<Peer | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('room');
  const peerId = searchParams.get('peer');

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io("http://localhost:4001", {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);

  // Initialize PeerJS
  useEffect(() => {
    const peer = new Peer(undefined, {
      host: 'localhost',
      port: 4002,
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log('My peer ID is:', id);
      setMyPeer(peer);
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    return () => {
      peer.destroy();
    };
  }, []);

  // Handle video stream and peer connections
  useEffect(() => {
    if (!myPeer || !socket || !roomId) return;

    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        console.log("Got media stream:", stream);
        setMyStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
        }

        // Join the room
        socket.emit("join-room", roomId, myPeer.id);

        // Handle incoming calls
        myPeer.on('call', call => {
          console.log('Answering call from:', call.peer);
          call.answer(stream);

          call.on('stream', userVideoStream => {
            console.log('Received remote stream from:', call.peer);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = userVideoStream;
            }
          });
        });

        // Connect to existing users when we join
        socket.on('user-connected', userId => {
          console.log('User connected to room:', userId);
          // Add a slight delay to ensure peer is ready
          setTimeout(() => {
            connectToNewUser(userId, stream);
          }, 1000);
        });

      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };

    initializeVideo();

    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [myPeer, socket, roomId]);

  const connectToNewUser = (userId: string, stream: MediaStream) => {
    console.log('Making call to:', userId);
    const call = myPeer.call(userId, stream);
    
    call.on('stream', userVideoStream => {
      console.log('Received stream from user:', userId);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = userVideoStream;
      }
    });

    call.on('error', error => {
      console.error('Call error:', error);
    });

    call.on('close', () => {
      handleEndCall();
    });
  };

  const handleEndCall = () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }
    navigate('/chatroom');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Room Info Header */}
      <div className="bg-gray-800 p-4 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold mb-2">Video Call</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Room ID:</p>
              <p className="font-mono">{roomId}</p>
            </div>
            <div>
              <p className="text-gray-400">Your Peer ID:</p>
              <p className="font-mono">{myPeer?.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        <div className="relative h-full">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-lg bg-gray-800"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
            You
          </div>
        </div>
        <div className="relative h-full">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover rounded-lg bg-gray-800"
          />
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
            Remote User
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800 flex justify-center">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleEndCall}
          className="flex items-center space-x-2"
        >
          <PhoneOff className="h-5 w-5" />
          <span>End Call</span>
        </Button>
      </div>
    </div>
  );
};

export default CallScreen; 