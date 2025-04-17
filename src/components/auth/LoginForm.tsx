
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const LoginForm = ({ onViewChange }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
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
      <Button type="submit" className="w-full">
        Log in
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
