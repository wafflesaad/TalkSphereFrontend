import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const ForgotPasswordForm = ({ onViewChange }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:4000/api/auth/send_reset_otp", {
        email,
      });

      if (response.data.success) {
        alert("Reset OTP sent to your email!");
      } else {
        setError(response.data.message || "Failed to send reset link.");
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
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </Button>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
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
