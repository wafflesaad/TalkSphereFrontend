import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios"; // Importing axios for making API requests

interface SignupFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const SignupForm = ({ onViewChange }: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // To store error message
  const [loading, setLoading] = useState(false); // To handle loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Set loading to true

    try {
      const response = await axios.post("http://localhost:4000/api/auth/register", {
        name,
        email,
        password,
      });

      if (response.data.success) {
        // Registration successful, navigate to login or handle accordingly
        onViewChange("login");
      } else {
        setError(response.data.message); // Set error message if registration fails
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500">{error}</p>} {/* Display error message */}
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Button variant="link" onClick={() => onViewChange("login")}>
          Log in
        </Button>
      </div>
    </form>
  );
};

export default SignupForm;
