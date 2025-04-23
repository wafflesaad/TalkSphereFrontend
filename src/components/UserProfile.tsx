import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Users, Search, X, UserPlus, UserCheck, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserData {
  name: string;
  isAccountVerified: boolean;
  email: string;
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/user/data", {
          method: "GET",
          credentials: "include",
        });

        const data = await response.json();

        if (!data.success) {
          if (data.message === "Token not found!" || data.message.includes("token")) {
            navigate("/login");
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
        const response = await fetch("http://localhost:4000/api/user/getFriendRequests", {
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
        const response = await fetch("http://localhost:4000/api/user/getFriendList", {
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
      const response = await fetch("http://localhost:4000/api/user/search-users", {
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
      const response = await fetch("http://localhost:4000/api/user/sendFriendRequest", {
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

      const response = await fetch("http://localhost:4000/api/user/acceptFriendRequest", {
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
      const response = await fetch("http://localhost:4000/api/user/deleteFriendRequest", {
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
      const response = await fetch("http://localhost:4000/api/user/remove-friend", {
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Search */}
            <div className="flex items-center">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 hover:bg-transparent"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Center section - Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">TalkSphere</h1>
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-4">
              {/* Friend Requests Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className={`relative ${activeSection === 'requests' ? 'bg-gray-100' : ''}`}
                onClick={() => handleSectionClick('requests')}
              >
                <UserPlus className="h-5 w-5" />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </Button>

              {/* Friends Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className={activeSection === 'friends' ? 'bg-gray-100' : ''}
                onClick={() => handleSectionClick('friends')}
              >
                <UserCheck className="h-5 w-5" />
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{userData.name}</span>
              </div>

              {/* Logout Button */}
              <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-gray-100">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Name</h3>
                  <p className="text-gray-600">{userData.name}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Email</h3>
                  <p className="text-gray-600">{userData.email}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Account Status</h3>
                  {userData.isAccountVerified ? (
                    <p className="text-green-600">Verified</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-600">Not Verified</p>
                      <Button onClick={() => navigate("/verify-email")}>
                        Verify Account
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.map((result) => (
                    <div key={result.email} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarFallback>{result.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <p className="text-sm text-gray-500">{result.email}</p>
                        </div>
                      </div>
                      {!result.isFriend && (
                        <Button 
                          className="w-full" 
                          onClick={() => handleSendRequest(result.email)}
                        >
                          Send Friend Request
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Friend Requests */}
          {activeSection === 'requests' && (
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friendRequests.length === 0 ? (
                    <p className="text-sm text-gray-500">No pending requests</p>
                  ) : (
                    friendRequests.map((request) => (
                      <div key={request.email} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.name}</p>
                            <p className="text-sm text-gray-500">{request.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleAcceptRequest(request.email)}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleRejectRequest(request.email)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Friends List */}
          {activeSection === 'friends' && (
            <Card>
              <CardHeader>
                <CardTitle>Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {friends.length === 0 ? (
                    <p className="text-sm text-gray-500">No friends yet</p>
                  ) : (
                    friends.map((friend) => (
                      <div key={friend.email} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{friend.name}</p>
                              <p className="text-sm text-gray-500">{friend.email}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveFriend(friend.email)}
                            className="hover:bg-red-100 hover:text-red-600"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfile; 