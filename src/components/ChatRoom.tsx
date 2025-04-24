import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, LogOut, Users, Search, X, UserPlus, UserCheck, UserMinus, MessageSquare, Phone, Video } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import TopBar from "./TopBar";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

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
  }, [location.search, friends]);

  useEffect(() => {
    // Fetch friends list
    const fetchFriends = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/user/getFriendList", {
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

  const handleSendMessage = () => {


    // Add message to local state
    setMessages(prev => [...prev, {
      sender: "me",
      content: newMessage,
      timestamp: new Date(),
    }]);
    setNewMessage("");

    // Show alert for 1 second
    const alert = document.createElement('div');
    alert.textContent = 'Message sent';
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.padding = '10px 20px';
    alert.style.backgroundColor = '#4CAF50';
    alert.style.color = 'white';
    alert.style.borderRadius = '5px';
    alert.style.zIndex = '1000';
    document.body.appendChild(alert);
    setTimeout(() => {
      document.body.removeChild(alert);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSectionClick = (section: 'none' | 'requests' | 'friends') => {
    setActiveSection(activeSection === section ? 'none' : section);
  };

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend);
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

  const handleVideoCall = () => {
    if (!selectedFriend) return;
    // Show alert for 1 second
    const alert = document.createElement('div');
    alert.textContent = 'Video calling...';
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

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-white dark:bg-gray-950 transition-colors duration-200">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.sender === "me" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.sender === "me"
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
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${
                  selectedFriend?.email === friend.email ? "bg-gray-100 dark:bg-gray-800" : ""
                }`}
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
    </div>
  );
};

export default ChatRoom; 