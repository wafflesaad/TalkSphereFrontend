import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

interface SignupFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const SignupForm = ({ onViewChange }: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const baseURL = import.meta.env.VITE_BASE_URL;
  const serverUrl = import.meta.env.VITE_SERVER;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${serverUrl}/api/auth/register`, {
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
        throw new Error(data.message || "Registration failed");
      }

      toast({
        title: "Success",
        description: "Account created successfully! Welcome to TalkSphere.",
      });

      // Redirect to home page or dashboard after successful registration
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm sm:text-base">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className="h-10 sm:h-11 text-sm sm:text-base"
          />
        </div>
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
              placeholder="Create a password"
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
      </div>
      <Button 
        type="submit" 
        className="w-full h-10 sm:h-11 text-sm sm:text-base" 
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
      <div className="text-center text-xs sm:text-sm">
        Already have an account?{" "}
        <Button 
          variant="link" 
          onClick={() => onViewChange("login")}
          className="text-xs sm:text-sm px-2 py-1"
        >
          Log in
        </Button>
      </div>
    </form>
  );
};

export default SignupForm;
