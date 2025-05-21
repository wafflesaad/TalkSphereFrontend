import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Search, UserPlus, UserCheck, MessageSquare, Moon, Sun, Home, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

interface TopBarProps {
  activeSection?: 'none' | 'requests' | 'friends';
  onSectionClick?: (section: 'none' | 'requests' | 'friends') => void;
  friendRequestsCount?: number;
  showMessageButton?: boolean;
}

interface FriendRequest {
  email: string;
  name: string;
}

interface Friend {
  email: string;
  name: string;
}

const TopBar = ({ 
  activeSection = 'none', 
  onSectionClick, 
  friendRequestsCount = 0,
  showMessageButton = true 
}: TopBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{name: string, email: string}[]>([]);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isFriendsDrawerOpen, setIsFriendsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const baseURL = import.meta.env.VITE_BASE_URL;
  const serverUrl = import.meta.env.VITE_SERVER

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(`${serverUrl}/api/user/getFriendRequests`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();
        
        if (data.success) {
          const uniqueRequests = Array.from(new Set(data.requests))
            .map((email: string) => ({ email, name: email.split('@')[0] }));
          setFriendRequests(uniqueRequests);
        }
      } catch (error) {
        console.error("Fetch friend requests error:", error);
      }
    };

    fetchFriendRequests();
  }, []);

  useEffect(() => {
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleAcceptRequest = async (email: string) => {
    try {
      const response = await fetch(`${serverUrl}/api/user/acceptFriendRequest`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(prev => prev.filter(req => req.email !== email));
        setFriends(prev => [...prev, { email, name: email.split('@')[0] }]);
      }
    } catch (error) {
      console.error("Accept friend request error:", error);
    }
  };

  const handleRejectRequest = async (email: string) => {
    try {
      const response = await fetch(`${serverUrl}/api/user/deleteFriendRequest`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(prev => prev.filter(req => req.email !== email));
      }
    } catch (error) {
      console.error("Reject friend request error:", error);
    }
  };

  const handleRemoveFriend = async (email: string) => {
    try {
      const response = await fetch(`${serverUrl}/api/user/remove-friend`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendEmail: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFriends(prev => prev.filter(friend => friend.email !== email));
      }
    } catch (error) {
      console.error("Remove friend error:", error);
    }
  };

  const toggleFriendsDrawer = () => {
    setIsFriendsDrawerOpen(!isFriendsDrawerOpen);
  };

  const isChatRoom = location.pathname === '/chatroom';

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchResultsOpen(false);
      return;
    }
    
    try {
      const response = await fetch(`${serverUrl}/api/user/check-user`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: searchQuery }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults([data.user]);
        setIsSearchResultsOpen(true);
      } else {
        setSearchResults([]);
        setIsSearchResultsOpen(false);
        toast({
          title: "User not found",
          description: "No user found with that email address",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search for user",
        variant: "destructive",
      });
    }
  };

  const handleSendFriendRequest = async (email: string) => {
    try {
      const response = await fetch(`${serverUrl}/api/user/sendFriendRequest`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Friend request sent successfully",
        });
        setIsSearchResultsOpen(false);
        setSearchQuery("");
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Send friend request error:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Search */}
            <div className="flex items-center">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64 pr-10 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 hover:bg-transparent"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
                {/* Search Results Dropdown */}
                {isSearchResultsOpen && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                    {searchResults.map((user) => (
                      <div
                        key={user.email}
                        className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendFriendRequest(user.email)}
                          className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Center section - Title */}
            <div className="flex items-center">
              <h1 
                className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300"
                onClick={() => navigate("/profile")}
              >
                TalkSphere
              </h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Home/Message Button */}
              {isChatRoom ? (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/profile")}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Home className="h-5 w-5" />
                </Button>
              ) : showMessageButton && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate("/chatroom")}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              )}

              {/* Friend Requests Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={`relative ${activeSection === 'requests' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                  >
                    <UserPlus className="h-5 w-5" />
                    {friendRequestsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {friendRequestsCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 dark:bg-gray-800 dark:border-gray-700">
                  <div className="p-2">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Friend Requests</h3>
                    <div className="space-y-2">
                      {friendRequests.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests</p>
                      ) : (
                        friendRequests.map((request) => (
                          <div
                            key={request.email}
                            className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{request.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{request.email}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAcceptRequest(request.email)}
                                className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRejectRequest(request.email)}
                                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Friends Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className={activeSection === 'friends' ? 'bg-gray-100 dark:bg-gray-700' : ''}
                onClick={toggleFriendsDrawer}
              >
                <UserCheck className="h-5 w-5" />
              </Button>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Friends Drawer */}
      <div
        className={`fixed right-0 top-16 w-80 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${
          isFriendsDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Friends</h2>
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No friends yet</p>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.email}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{friend.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{friend.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFriend(friend.email)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TopBar; 