"use client";

import { useState } from "react";
import { loginWithEmailAndPassword, loginWithGoogle } from "@/helpers/loginHelp";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import { auth, db } from "@/config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import "react-toastify/dist/ReactToastify.css";
import { LoadingSpinner } from "@/components/ui/Loading";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginWithEmailAndPassword(email, password);
      console.log("Logged in as:", user.email);

      if (user) {
        toast.success("Login successful!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      setError(error.message);
      toast.error("Login failed ", toastOptions);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log("Logged in with Google:", user.displayName);

      if (user) {
        toast.success("Logged in with Google!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      setError(error.message);
      toast.error("Google login failed ", toastOptions);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      
      toast.success("Password reset link sent to your email!"); // Show success toast
      setIsDialogOpen(false);
    } catch (error) {
      
      toast.error("Error sending password reset email "); // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
      <ToastContainer theme="dark" />
      
      <Card className="w-96 bg-[#1e293b] border border-gray-500 shadow-2xl rounded-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-white">Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white text-black border border-gray-300" required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white text-black border border-gray-300" required />
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold">
              Login with Email
            </Button>
          </form>
          <Button onClick={handleGoogleLogin} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
            Login with Google
          </Button>
          <p className="text-center text-sm text-gray-300">
            Don't have an account? <Link href="/register" className="text-blue-400 hover:text-blue-500 hover:underline">Sign Up</Link>
          </p>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="w-full text-blue-400 hover:text-blue-500 text-sm">
                Forgot Password?
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 p-6 rounded-lg">
              <DialogTitle className="text-lg font-semibold mb-4 text-white">Reset Password</DialogTitle>
              <DialogDescription className="text-sm text-gray-400 mb-4">
                Enter your email to receive a password reset link.
              </DialogDescription>
              <Input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4 bg-gray-700 text-white border border-blue-500 rounded-md text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-sm font-medium py-2 px-4 rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className={`${isLoading ? "bg-gray-500" : "bg-blue-600"} hover:bg-blue-700 text-sm font-medium py-2 px-4 rounded-md text-white`}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" variant="muted" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send Link"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;