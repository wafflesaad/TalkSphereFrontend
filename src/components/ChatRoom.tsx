

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, LogOut, Users, Search, X, UserPlus, UserCheck, UserMinus, MessageSquare, Phone, Video, Camera } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TopBar from "./TopBar";
import socket from "@/utils/io";
import { error } from "console";
import Peer from "peerjs";
import { io } from "socket.io-client";
const baseURL = import.meta.env.VITE_BASE_URL;
const serverUrl = import.meta.env.VITE_SERVER
const callUrl = import.meta.env.VITE_CALL
console.log(`::chatroom.tsx   ${baseURL}`);
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Add this at the top of the file, after the imports
declare global {
  interface Window {
    myPeer: Peer;
  }
}

// Initialize video socket connection
const videoSocket = io(`${callUrl}`, {
  withCredentials: true,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
});

// Add connection logging
videoSocket.on("connect", () => {
  console.log("Connected to video server:", videoSocket.id);
});

videoSocket.on("connect_error", (error) => {
  console.error("Video connection error:", error);
});

interface Friend {
  email: string;
  name: string;
}

interface Message {
  sender: string;
  content: string;
  timestamp: Date;
}

const ChatRoom = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [activeSection, setActiveSection] = useState<'none' | 'requests' | 'friends'>('none');
  const [videoCallRequest, setVideoCallRequest] = useState<boolean>(false);
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [myPeer, setMyPeer] = useState<Peer | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);
  const [isSelfCameraOpen, setIsSelfCameraOpen] = useState(false);
  const selfCameraRef = useRef<HTMLVideoElement>(null);
  const [selfStream, setSelfStream] = useState<MediaStream | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const baseURL = import.meta.env.VITE_BASE_URL;
  const peerUrl = import.meta.env.VITE_PEER;

  const initializeVideoCall = async () => {
    if (!myPeer) return;

    try {
      console.log("Initializing video call");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      console.log("Got local media stream");
      setMyStream(stream);
      setIsVideoCallOpen(true);

      // Set up local video
      if (localVideoRef.current) {
        console.log("Setting local video stream");
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute local video
        await localVideoRef.current.play().catch(e => console.error("Local video play error:", e));
        console.log("Local video playing");
      }

      // If we're the caller, connect to the other user using their peer ID
      if (isCaller && remotePeerId) {
        console.log("Making call to peer:", remotePeerId);
        const call = myPeer.call(remotePeerId, stream);

        call.on('stream', userVideoStream => {
          console.log("Received remote stream from outgoing call");
          if (remoteVideoRef.current) {
            console.log("Setting remote video stream");
            remoteVideoRef.current.srcObject = userVideoStream;
            remoteVideoRef.current.muted = false; // Unmute remote video
            remoteVideoRef.current.play().then(() => {
              console.log("Remote video playing");
            }).catch(e => console.error("Remote video play error:", e));
          }
        });

        call.on('error', error => {
          console.error('Call error:', error);
          toast({
            title: "Error",
            description: "Call failed: " + error.message,
            variant: "destructive"
          });
        });

        call.on('close', () => {
          console.log("Call closed");
          handleEndVideoCall();
        });
      }

      // Handle incoming calls
      myPeer.on('call', call => {
        console.log("Received call from peer:", call.peer);
        call.answer(stream);

        call.on('stream', userVideoStream => {
          console.log("Received remote stream from incoming call");
          if (remoteVideoRef.current) {
            console.log("Setting remote video stream from incoming call");
            remoteVideoRef.current.srcObject = userVideoStream;
            remoteVideoRef.current.muted = false; // Unmute remote video
            remoteVideoRef.current.play().then(() => {
              console.log("Remote video playing from incoming call");
            }).catch(e => console.error("Remote video play error:", e));
          }
        });

        call.on('error', error => {
          console.error('Call error:', error);
          toast({
            title: "Error",
            description: "Call failed: " + error.message,
            variant: "destructive"
          });
        });

        call.on('close', () => {
          console.log("Call closed");
          handleEndVideoCall();
        });
      });

    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Error",
        description: "Failed to access camera/microphone: " + error.message,
        variant: "destructive"
      });
    }
  };

  // Initialize PeerJS
  useEffect(() => {
    console.log("peer url");
    console.log(peerUrl);
    
    const peer = new Peer(undefined, {
      host: `${peerUrl}`,
      port: 443,
      path: '/',
      debug: 3,
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id) => {
      console.log("My peer ID is:", id);
      setMyPeer(peer);
      // Expose the peer instance to the window
      window.myPeer = peer;
    });

    peer.on('error', (error) => {
      console.error("Peer error:", error);
      toast({
        title: "Error",
        description: "Peer connection failed: " + error.message,
        variant: "destructive"
      });
    });

    return () => {
      peer.off("open");
      peer.off("error");
      if (peer) peer.destroy();
    };
  }, []);

  // Load chat history from localStorage when component mounts or selectedFriend changes
  useEffect(() => {
    if (selectedFriend) {
      const savedChat = localStorage.getItem(`chat_${selectedFriend.email}`);
      if (savedChat) {
        const parsedMessages = JSON.parse(savedChat).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    }
  }, [selectedFriend]);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (selectedFriend && messages.length > 0) {
      localStorage.setItem(`chat_${selectedFriend.email}`, JSON.stringify(messages));
    }
  }, [messages, selectedFriend]);

  useEffect(() => {
    // Check if we have a friend email in the URL
    const params = new URLSearchParams(location.search);
    const friendEmail = params.get('friend');

    if (friendEmail) {
      // Find the friend in the friends list
      const friend = friends.find(f => f.email === friendEmail);
      if (friend) {
        setSelectedFriend(friend);
      }
    }

    // Modify socket message handler for video calls
    socket.on("receiveMessage", (message, peerId, roomId) => {
      if (message === "_video") {
        setVideoCallRequest(true);
        setIsCaller(false);
        setRemotePeerId(peerId);
        setRoomId(roomId);
        toast({
          title: "Incoming Video Call",
          description: "You have an incoming video call request",
        });
      } else if (message === "_video_accepted") {
        setVideoCallRequest(false);
        // Open CallScreen in new tab
        window.open(`/callscreen?room=${roomId}&peer=${peerId}`, '_blank');
      } else {
        setMessages(prev => [...prev, {
          sender: "friend",
          content: message,
          timestamp: new Date()
        }]);
      }
    });

    // Video socket for user connections
    videoSocket.on("user-connected", (userId) => {
      console.log("User connected to video room:", userId);
      if (isCaller && userId === remotePeerId) {
        console.log("Remote user connected, initializing call");
        initializeVideoCall();
      }
    });

    return () => {
      socket.off("receiveMessage");
      videoSocket.off("user-connected");
    };
  }, [myPeer, selectedFriend, isCaller, remotePeerId]);

  useEffect(() => {
    // Fetch friends list
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${serverUrl}/api/user/getFriendList`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (data.success) {
          const uniqueFriends = Array.from(new Set(data.friends))
            .map((email: string) => ({ email, name: email.split('@')[0] }));
          setFriends(uniqueFriends);
        }
      } catch (error) {
        console.error("Fetch friends error:", error);
      }
    };

    fetchFriends();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${serverUrl}/api/user/data`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      let email = data.userData.email;

      let payload = {
        sender: email,
        receiver: selectedFriend.email,
        message: newMessage,
      };

      socket.emit("sendMessage", payload);

      // Add message to local state (sender's side)
      const newMsg = {
        sender: "me",
        content: newMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage("");

    } catch (e) {
      console.log(e.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSectionClick = (section: 'none' | 'requests' | 'friends') => {
    setActiveSection(activeSection === section ? 'none' : section);
  };

  const handleFriendSelect = async (friend: Friend) => {
    // Clear existing messages when selecting a new friend
    setMessages([]);
    setSelectedFriend(friend);

    try {
      const response = await fetch(`${serverUrl}/api/user/data`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      let email = data.userData.email;

      let payload = {
        sender: email,
        receiver: friend.email
      }

      socket.emit('joinRoom', payload);

    } catch (e) {
      alert(e.message);
    }

    // Update URL with friend's email
    navigate(`/chatroom?friend=${encodeURIComponent(friend.email)}`);
  };

  const handleAudioCall = () => {
    if (!selectedFriend) return;
    // Show alert for 1 second
    const alert = document.createElement('div');
    alert.textContent = 'Audio calling...';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.padding = '10px 20px';
    alert.style.backgroundColor = '#2196F3';
    alert.style.color = 'white';
    alert.style.borderRadius = '5px';
    alert.style.zIndex = '1000';
    document.body.appendChild(alert);
    setTimeout(() => {
      document.body.removeChild(alert);
    }, 1000);
  };

  // Add effect to handle call ended
  useEffect(() => {
    socket.on('call-ended', () => {
      setIsInCall(false);
      setVideoCallRequest(false);
      setRemotePeerId(null);
      setRoomId(null);
    });

    return () => {
      socket.off('call-ended');
    };
  }, [socket]);

  const handleEndVideoCall = () => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }
    setIsInCall(false);
    setIsVideoCallOpen(false);
    setVideoCallRequest(false);
    setRemotePeerId(null);
    setRoomId(null);

    if (selectedFriend) {
      socket.emit('endVideoCall', {
        to: selectedFriend.email,
        from: localStorage.getItem('email')
      });
    }
  };

  // Clean up media streams when component unmounts
  useEffect(() => {
    return () => {
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [myStream]);

  // Initialize video socket
  useEffect(() => {
    console.log("Setting up video socket listeners");

    videoSocket.on("connect", () => {
      console.log("Connected to video server:", videoSocket.id);
    });

    videoSocket.on("connect_error", (error) => {
      console.error("Video connection error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to video server",
        variant: "destructive"
      });
    });

    // Listen for user connections in the video room
    videoSocket.on("user-connected", (userId) => {
      console.log("User connected to video room:", userId);
      if (isCaller && userId === remotePeerId) {
        console.log("Remote user connected, initializing call");
        initializeVideoCall();
      }
    });

    return () => {
      console.log("Cleaning up video socket listeners");
      videoSocket.off("connect");
      videoSocket.off("connect_error");
      videoSocket.off("user-connected");
    };
  }, [isCaller, remotePeerId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle self camera
  const handleSelfCamera = async () => {
    console.log("Attempting to access camera...");
    try {
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }

      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      });

      console.log("Camera access granted, stream received:", stream);
      setSelfStream(stream);
      setIsSelfCameraOpen(true);
    } catch (error) {
      console.error("Detailed camera error:", error);
      toast({
        title: "Camera Error",
        description: `Failed to access camera: ${error.message}. Please make sure your camera is connected and you've granted permission to use it.`,
        variant: "destructive"
      });
    }
  };

  // Effect to handle video stream when dialog opens
  useEffect(() => {
    if (isSelfCameraOpen && selfStream && selfCameraRef.current) {
      console.log("Setting up video stream");
      selfCameraRef.current.srcObject = selfStream;

      // Add event listeners for debugging
      selfCameraRef.current.onloadedmetadata = () => {
        console.log("Video metadata loaded");
      };

      selfCameraRef.current.oncanplay = () => {
        console.log("Video can play");
      };

      selfCameraRef.current.onerror = (e) => {
        console.error("Video element error:", e);
      };

      // Try to play the video
      selfCameraRef.current.play()
        .then(() => console.log("Video playback started successfully"))
        .catch(error => console.error("Error playing video:", error));
    }
  }, [isSelfCameraOpen, selfStream]);

  // Function to close self camera
  const handleCloseSelfCamera = () => {
    if (selfStream) {
      console.log("Stopping camera stream");
      selfStream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind);
      });
      setSelfStream(null);
    }
    setIsSelfCameraOpen(false);
  };

  // Clean up self camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (selfStream) {
        selfStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selfStream]);


  const handleVideoCall = async () => {
    if (!selectedFriend || !myPeer) return;

    try {
      const response = await fetch(`${serverUrl}/api/user/data`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      let email = data.userData.email;

      // Create room ID using the same format as server.js
      const roomId = [email, selectedFriend.email].sort().join('-');

      // Set in call state
      setIsInCall(true);

      // Check if call window is already open
      // const callWindow = window.open('', 'videoCall');
      // if (callWindow && !callWindow.closed) {
      //   if (roomId){

      //     callWindow.location.href = `/callscreen?room=${roomId}&peer=${myPeer.id}`;
      //   }
      // } else {
      //   if(roomId){

      //     window.open(`/callscreen?room=${roomId}&peer=${myPeer.id}`, 'videoCall');
      //   }
      // }

      // Send video call request to friend
      let payload = {
        sender: email,
        receiver: selectedFriend.email,
        message: "_video",
        peerId: myPeer.id,
        roomId: roomId
      };

      socket.emit("sendMessage", payload);

    } catch (e) {
      console.log(e.message);
      toast({
        title: "Error",
        description: "Failed to initiate video call: " + e.message,
        variant: "destructive"
      });
      // Reset call state on error
      setIsInCall(false);
      setVideoCallRequest(false);
      setRemotePeerId(null);
      setRoomId(null);
    }
  };
  const handleAcceptVideoCall = async () => {

    setVideoCallRequest(false);

    try {
      const response = await fetch(`${serverUrl}/api/user/data`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      let email = data.userData.email;

      console.log(selectedFriend);
      
      // Use the same room ID that was sent in the video call request
      const roomId = [email, selectedFriend?.email].sort().join('-');
      console.log(roomId);
      
      // Set in call state
      setIsInCall(true);

      // Send acceptance message back to caller
      let payload = {
        sender: email,
        receiver: selectedFriend?.email,
        message: "_video_accepted",
        roomId: roomId,
        peerId: myPeer?.id
      };

      socket.emit("sendMessage", payload);

      console.log(remotePeerId);
      

      if (roomId && remotePeerId) {

        console.log("in block");
        console.log("email", email);
        console.log("selectedFriend", selectedFriend);
        console.log("roomId", roomId);
        console.log("remotePeerId", remotePeerId);
        

        const callWindow = window.open('', 'videoCall');
        if (callWindow && !callWindow.closed) {
          callWindow.location.href = `/callscreen?room=${roomId}&peer=${remotePeerId}`;
        } else {
          window.open(`/callscreen?room=${roomId}&peer=${remotePeerId}`, 'videoCall');
        }
      } else {
        console.warn("Call screen not opened: roomId or remotePeerId is undefined");
      }


    } catch (e) {
      console.log(e.message);
      toast({
        title: "Error",
        description: "Failed to accept video call: " + e.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
      <TopBar
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        friendRequestsCount={0}
        showMessageButton={false}
      />

      {/* Main Content */}
      <div className="flex h-screen pt-16">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 transition-colors duration-200">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 flex items-center justify-between bg-white dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {selectedFriend.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{selectedFriend.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedFriend.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleAudioCall}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleVideoCall}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Video Call Request Button - Only show to receiver */}
              {videoCallRequest && !isCaller && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                  <Button
                    onClick={handleAcceptVideoCall}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Accept Video Call
                  </Button>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-950 transition-colors duration-200 flex flex-col">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${message.sender === "me" ? "text-right" : "text-left"}`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${message.sender === "me"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        } transition-colors duration-200`}
                    >
                      {message.content}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-white dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors duration-200"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors duration-200"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 transition-colors duration-200">
              Select a friend to start chatting
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="w-1/4 border-l bg-white dark:bg-gray-900 dark:border-gray-800 p-4 transition-colors duration-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Friends</h2>
          <div className="space-y-2">
            {friends.map((friend) => (
              <div
                key={friend.email}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${selectedFriend?.email === friend.email ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                onClick={() => handleFriendSelect(friend)}
              >
                <Avatar>
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {friend.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{friend.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{friend.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Call Dialog */}
      <Dialog open={isVideoCallOpen} onOpenChange={setIsVideoCallOpen}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[1600px] max-h-[900px]">
          <DialogHeader>
            <DialogTitle>Video Call with {selectedFriend?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4 h-[calc(90vh-100px)]">
            <div className="relative h-full">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-lg bg-gray-900"
                style={{ transform: 'scaleX(-1)' }}
                onLoadedMetadata={() => console.log("Local video metadata loaded")}
                onCanPlay={() => console.log("Local video can play")}
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
                className="w-full h-full object-cover rounded-lg bg-gray-900"
                onLoadedMetadata={() => console.log("Remote video metadata loaded")}
                onCanPlay={() => console.log("Remote video can play")}
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded">
                {selectedFriend?.name}
              </div>
            </div>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            <Button
              variant="destructive"
              onClick={handleEndVideoCall}
            >
              End Call
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Self Camera Dialog */}
      <Dialog open={isSelfCameraOpen} onOpenChange={setIsSelfCameraOpen}>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[1600px] max-h-[900px]">
          <DialogHeader>
            <DialogTitle>Your Camera</DialogTitle>
            <DialogDescription>
              Your camera feed will appear below. Click "Turn Off Camera" to close.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[calc(90vh-100px)]">
            <video
              ref={selfCameraRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg bg-gray-900"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                variant="destructive"
                onClick={handleCloseSelfCamera}
                className="px-6"
              >
                Turn Off Camera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatRoom;

