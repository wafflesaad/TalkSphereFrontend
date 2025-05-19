import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Peer from "peerjs";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";

const CallScreen = () => {
  const [myPeer, setMyPeer] = useState<Peer | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roomId = searchParams.get('room');
  const peerId = searchParams.get('peer');

  // Initialize PeerJS
  useEffect(() => {
    const peer = new Peer(undefined, {
      host: 'localhost',
      port: 4003,
      path: '/',
      debug: 3
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

  // Handle video stream
  useEffect(() => {
    if (!myPeer) return;

    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      setMyStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }).catch(err => {
      console.error('Error accessing media devices:', err);
    });

    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [myPeer]);

  // Handle peer connection
  useEffect(() => {
    if (!myPeer || !myStream || !peerId) return;

    const call = myPeer.call(peerId, myStream);
    
    call.on('stream', (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
    });

    call.on('close', () => {
      handleEndCall();
    });

    return () => {
      call.close();
    };
  }, [myPeer, myStream, peerId]);

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