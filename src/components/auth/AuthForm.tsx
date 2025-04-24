import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPasswordForm from "./ForgotPasswordForm";

type AuthView = "login" | "signup" | "forgot-password";

const AuthForm = () => {
  const [view, setView] = useState<AuthView>("login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md mx-auto sm:mx-0">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-xl sm:text-2xl font-bold">
            {view === "login" && "Welcome Back"}
            {view === "signup" && "Create Account"}
            {view === "forgot-password" && "Reset Password"}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            {view === "login" && "Enter your credentials to access your account"}
            {view === "signup" && "Sign up to get started with our service"}
            {view === "forgot-password" && "Enter your email to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {view === "login" && <LoginForm onViewChange={setView} />}
          {view === "signup" && <SignupForm onViewChange={setView} />}
          {view === "forgot-password" && <ForgotPasswordForm onViewChange={setView} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
