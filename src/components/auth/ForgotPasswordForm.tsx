import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ResetPasswordOTPForm from "./ResetPasswordOTPForm";

interface ForgotPasswordFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const ForgotPasswordForm = ({ onViewChange }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
        throw new Error(data.message || "Failed to send OTP");
      }

      toast({
        title: "Success",
        description: "OTP has been sent to your email",
      });

      setShowOTPForm(true);
    } catch (error) {
      console.error("Send OTP error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerified = (otp: string) => {
    // Here you can navigate to the new password form or handle the verified OTP
    console.log("OTP verified:", otp);
  };

  if (showOTPForm) {
    return (
      <ResetPasswordOTPForm
        email={email}
        onBack={() => setShowOTPForm(false)}
        onViewChange={onViewChange}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Sending OTP..." : "Send Reset Code"}
      </Button>
      <div className="text-center text-sm">
        Remember your password?{" "}
        <Button variant="link" onClick={() => onViewChange("login")}>
          Log in
        </Button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
