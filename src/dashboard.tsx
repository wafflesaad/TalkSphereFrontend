import { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface User {
  name: string
  email: string
  isAccountVerified: boolean
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/auth/profile", { withCredentials: true })
        setUser(response.data.user)  
      } catch (error) {
        console.error("Failed to fetch user:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader>
          {loading ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{user?.name.split(" ").map(word => word[0]).join("")}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl font-semibold">{user?.name}</CardTitle>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-4 w-1/2" />
          ) : (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Account Verified</span>
              <span className={user?.isAccountVerified ? "text-green-500" : "text-red-500"}>
                {user?.isAccountVerified ? "Yes" : "No"}
              </span>
            </div>
          )}

          {!loading && (
            <div className="pt-2 border-t">
              <Button className="w-full">Edit Profile</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
