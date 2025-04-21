
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

interface LoginFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const LoginForm = ({ onViewChange }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        // Redirect or switch view on success
        alert("Login successful!");
        // You could store the token or move to the dashboard
      } else {
        setError(response.data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };



  return (
<form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="Enter your password"
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
      {error && <p className="text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Logging in..." : "Log in"}
      </Button>


      <div className="mt-4 text-center space-y-2">
        <Button
          variant="link"
          onClick={() => onViewChange("forgot-password")}
          className="text-sm"
        >
          Forgot password?
        </Button>
        <div className="text-sm">
          Don't have an account?{" "}
          <Button variant="link" onClick={() => onViewChange("signup")}>
            Sign up
          </Button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
