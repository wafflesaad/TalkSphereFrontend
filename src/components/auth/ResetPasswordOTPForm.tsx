import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface ResetPasswordOTPFormProps {
  email: string;
  onBack: () => void;
  onOTPVerified: (otp: string) => void;
}

const ResetPasswordOTPForm = ({ email, onBack, onOTPVerified }: ResetPasswordOTPFormProps) => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/auth/reset_pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Verification failed");
      }

      toast({
        title: "Success",
        description: "OTP verified successfully!",
      });

      // Call the callback with the verified OTP
      onOTPVerified(otp);
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Verification failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/auth/send_reset_otp", {
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
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Verify Code"}
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