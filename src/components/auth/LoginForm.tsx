import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const LoginForm = ({ onViewChange }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BASE_URL;
  const serverUrl = import.meta.env.VITE_SERVER;
  console.log(serverUrl);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
console.log(baseURL);
    try {
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      // Redirect to profile page after successful login
      navigate("/profile");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="h-10 sm:h-11 text-sm sm:text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className="h-10 sm:h-11 text-sm sm:text-base pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full h-10 sm:h-11 text-sm sm:text-base" 
        disabled={isLoading}
      >
        {isLoading ? "Logging in..." : "Log in"}
      </Button>
      <div className="mt-4 text-center space-y-2">
        <Button
          variant="link"
          onClick={() => onViewChange("forgot-password")}
          className="text-xs sm:text-sm px-2 py-1"
        >
          Forgot password?
        </Button>
        <div className="text-xs sm:text-sm">
          Don't have an account?{" "}
          <Button 
            variant="link" 
            onClick={() => onViewChange("signup")}
            className="text-xs sm:text-sm px-2 py-1"
          >
            Sign up
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
