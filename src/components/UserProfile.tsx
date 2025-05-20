import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Users, Search, X, UserPlus, UserCheck, UserMinus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import TopBar from "./TopBar";

interface UserData {
  name: string;
  isAccountVerified: boolean;
  email: string;
  profilePicture?: string;
  bio?: string;
  interests?: string[];
}

interface SearchResult {
  name: string;
  email: string;
  isFriend?: boolean;
}

interface FriendRequest {
  email: string;
  name: string;
}

const UserProfile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'none' | 'requests' | 'friends'>('none');
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BASE_URL;


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://${baseURL}:4000/api/user/data`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!data.success) {
          if (data.message === "Token not found!" || data.message.includes("token")) {
            navigate("/");
            return;
          }
          throw new Error(data.message || "Failed to fetch user data");
        }

        setUserData(data.userData);
      } catch (error) {
        console.error("Fetch user data error:", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch user data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [toast, navigate]);

  const handleSectionClick = (section: 'none' | 'requests' | 'friends') => {
    setActiveSection(activeSection === section ? 'none' : section);
  };

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(`http://${baseURL}:4000/api/user/getFriendRequests`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();
        
        if (data.success) {
          // Filter out any requests from users who are already friends
          const friendEmails = new Set(friends.map(friend => friend.email));
          const uniqueRequests = Array.from(new Set(data.requests))
            .filter((email: string) => !friendEmails.has(email))
            .map((email: string) => ({ email, name: email.split('@')[0] }));
          
          setFriendRequests(uniqueRequests);
        }
      } catch (error) {
        console.error("Fetch friend requests error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch friend requests",
          variant: "destructive",
        });
      }
    };

    const fetchFriends = async () => {
      try {
        const response = await fetch(`http://${baseURL}:4000/api/user/getFriendList`, {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();
        
        if (data.success) {
          // Remove duplicates by using a Set
          const uniqueFriends = Array.from(new Set(data.friends))
            .map((email: string) => ({ email, name: email.split('@')[0] }));
          
          setFriends(uniqueFriends);
        }
      } catch (error) {
        console.error("Fetch friends error:", error);
        toast({
          title: "Error",
          description: "Failed to fetch friends list",
          variant: "destructive",
        });
      }
    };

    // Fetch both friend requests and friends list when component mounts
    fetchFriendRequests();
    fetchFriends();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast({
        title: "Error",
        description: "Please enter at least 2 characters to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://${baseURL}:4000/api/user/search-users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Check which users are already friends
        const resultsWithFriendStatus = data.users.map((user: SearchResult) => ({
          ...user,
          isFriend: friends.some(friend => friend.email === user.email)
        }));
        setSearchResults(resultsWithFriendStatus);
      } else {
        setSearchResults([]);
        toast({
          title: "Error",
          description: data.message || "Failed to search for users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: "Failed to search for users",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (email: string) => {
    try {
      const response = await fetch(`http://${baseURL}:4000/api/user/sendFriendRequest`, {
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
          description: data.message || "Friend request sent successfully",
        });
        setSearchQuery("");
        setSearchResults([]);
      } else {
        throw new Error(data.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Send friend request error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (email: string) => {
    try {
      // Check if user is already a friend
      const isAlreadyFriend = friends.some(friend => friend.email === email);
      if (isAlreadyFriend) {
        toast({
          title: "Error",
          description: "User is already your friend",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`http://${baseURL}:4000/api/user/acceptFriendRequest`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Friend request accepted",
        });
        // Remove from requests and add to friends
        setFriendRequests(prev => prev.filter(req => req.email !== email));
        setFriends(prev => [...prev, { email, name: email.split('@')[0] }]);
      } else {
        throw new Error(data.message || "Failed to accept friend request");
      }
    } catch (error) {
      console.error("Accept friend request error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (email: string) => {
    try {
      const response = await fetch(`http://${baseURL}:4000/api/user/deleteFriendRequest`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Friend request rejected",
        });
        // Remove from requests
        setFriendRequests(prev => prev.filter(req => req.email !== email));
      } else {
        throw new Error(data.message || "Failed to reject friend request");
      }
    } catch (error) {
      console.error("Reject friend request error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (email: string) => {
    try {
      const response = await fetch(`http://${baseURL}:4000/api/user/remove-friend`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendEmail: email }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Friend removed successfully",
        });
        // Remove from friends list
        setFriends(prev => prev.filter(friend => friend.email !== email));
      } else {
        throw new Error(data.message || "Failed to remove friend");
      }
    } catch (error) {
      console.error("Remove friend error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>No user data available</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200">
      <TopBar 
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
        friendRequestsCount={friendRequests.length}
        showMessageButton={true}
      />

      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        <Card className="p-6 bg-white dark:bg-gray-900 transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={userData?.profilePicture} />
              <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {userData?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{userData?.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">{userData?.email}</p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h2>
            <p className="text-gray-600 dark:text-gray-300">{userData?.bio || "No bio yet"}</p>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Interests</h2>
            <div className="flex flex-wrap gap-2">
              {userData?.interests?.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </Card>

        {/* Friend Requests Section */}
        {activeSection === 'requests' && (
          <div className="mt-6">
            <Card className="p-6 bg-white dark:bg-gray-900 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Friend Requests</h2>
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div
                    key={request.email}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          {request.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{request.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{request.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptRequest(request.email)}
                        className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.email)}
                        className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Friends Section */}
        {activeSection === 'friends' && (
          <div className="mt-6">
            <Card className="p-6 bg-white dark:bg-gray-900 transition-colors duration-200">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Friends</h2>
              <div className="space-y-4">
                {friends.map((friend) => (
                  <div
                    key={friend.email}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.email)}
                      className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 