
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordFormProps {
  onViewChange: (view: "login" | "signup" | "forgot-password") => void;
}

const ForgotPasswordForm = ({ onViewChange }: ForgotPasswordFormProps) => {
  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="Enter your email" required />
      </div>
      <Button type="submit" className="w-full">
        Send reset link
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
