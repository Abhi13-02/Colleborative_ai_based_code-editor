"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation"; // ✅ Use usePathname
import { auth } from "@/config/firebase";
import { LoadingScreen } from "@/components/ui/Loading";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // ✅ Get current path

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);

        // ✅ Redirect to dashboard only when user is on login, register, or home
        if (pathname === "/login" || pathname === "/" || pathname === "/register") {
          router.push("/dashboard");
        }
      } else {
        setUser(null);

        // ✅ Redirect to login if user is on a protected route
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/workspace")) {
          router.push("/login");
        }
      }
      setLoading(false); // ✅ Ensure loading turns to false
    });

    return () => unsubscribe();
  }, [pathname, router]); // ✅ Ensure pathname updates trigger re-runs

  if (loading) return <LoadingScreen message="Initializing..." description="Setting up your secure session" />;

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
