import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface UserData {
  name: string;
  isAccountVerified: boolean;
}

const UserProfile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/user/data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
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
        // Redirect to login if there's an authentication error
        if (error instanceof Error && (error.message.includes('token') || error.message.includes('authentication'))) {
          navigate("/");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [toast, navigate]);

  const handleVerifyClick = () => {
    navigate("/verify-email");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>No user data available</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Name</h3>
            <p className="text-gray-600">{userData.name}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium">Account Status</h3>
            {userData.isAccountVerified ? (
              <p className="text-green-600">Verified</p>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600">Not Verified</p>
                <Button onClick={handleVerifyClick}>
                  Verify Account
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile; 