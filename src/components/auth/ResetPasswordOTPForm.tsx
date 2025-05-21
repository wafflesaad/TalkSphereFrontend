import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

interface ResetPasswordOTPFormProps {
  email: string;
  onBack: () => void;
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const ResetPasswordOTPForm = ({ email, onBack, onViewChange }: ResetPasswordOTPFormProps) => {
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const baseURL = import.meta.env.VITE_BASE_URL;
  const serverUrl = import.meta.env.VITE_SERVER;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/api/auth/reset_pass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPass: formData.newPassword,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Password reset failed");
      }

      toast({
        title: "Success",
        description: "Password has been reset successfully!",
      });

      // Redirect to login page
      onViewChange("login");
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Password reset failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/auth/send_reset_otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      toast({
        title: "Success",
        description: "OTP has been resent to your email",
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          type="text"
          placeholder="Enter 6-digit code"
          required
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to {email}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            required
            value={formData.newPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
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
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Resetting Password..." : "Reset Password"}
      </Button>
      <div className="text-center text-sm">
        <Button
          variant="link"
          onClick={handleResendOTP}
          className="text-sm"
        >
          Resend Code
        </Button>
        <Button
          variant="link"
          onClick={onBack}
          className="text-sm"
        >
          Back
        </Button>
      </div>
    </form>
  );
};

export default ResetPasswordOTPForm; 