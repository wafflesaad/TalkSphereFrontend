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
  const baseURL = import.meta.env.VITE_BASE_URL;
  console.log(`::callscreen.tsx   ${baseURL}`);


  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(`http://${baseURL}:4001`, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("Connected to video server:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Video connection error:", error);
    });

    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);

  // Use the existing PeerJS instance from the parent window
  useEffect(() => {
    if (window.opener && window.opener.myPeer) {
      console.log("Using existing PeerJS instance");
      setMyPeer(window.opener.myPeer);
    } else {
      console.error("No existing PeerJS instance found");
    }
  }, []);

  // Handle video stream and peer connections
  useEffect(() => {
    if (!myPeer || !socket) {
      console.log("Waiting for peer and socket:", { myPeer: !!myPeer, socket: !!socket });
      return;
    }

    const initializeVideo = async () => {
      try {
        // First check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia is not supported in this browser");
        }

        // List available devices first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        const audioDevices = devices.filter(device => device.kind === 'audioinput');

        console.log('Available video devices:', videoDevices);
        console.log('Available audio devices:', audioDevices);

        if (videoDevices.length === 0) {
          throw new Error("No video devices found");
        }

        // Try to get media stream with fallback options
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: audioDevices.length > 0? true:false
        });
        
        console.log("Got media stream:", stream);
        setMyStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(e => console.error("Local video play error:", e));
        }

        // Join the room
        const finalRoomId = roomId || "temporary";
        console.log("Attempting to join room:", finalRoomId, "with peer ID:", myPeer.id);
        socket.emit("join-room", finalRoomId, myPeer.id);

        // Handle incoming calls
        myPeer.on('call', call => {
          console.log('Answering call from:', call.peer);
          call.answer(stream);

          call.on('stream', userVideoStream => {
            console.log('Received remote stream from:', call.peer);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = userVideoStream;
              remoteVideoRef.current.play().catch(e => console.error("Remote video play error:", e));
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
        // You can add toast notifications here if you want
        alert(`Failed to access camera/microphone: ${error.message}. Please make sure your camera is connected and you've granted permission to use it.`);
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
    
    // Emit end call event to the room
    if (socket && roomId) {
      socket.emit('end-call', roomId);
    }
    
    // Close this tab
    window.close();
  };

  // Listen for end call event
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.on('call-ended', () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
      }
      window.close();
    });

    return () => {
      socket.off('call-ended');
    };
  }, [socket, roomId]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Room Info Header */}
      <div className="bg-gray-800 p-4 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold mb-2">Video Call</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Room ID:</p>
              <p className="font-mono">{roomId || "temporary"}</p>
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