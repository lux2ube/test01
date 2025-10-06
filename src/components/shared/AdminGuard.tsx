
"use client";

import { useAuthContext } from "@/hooks/useAuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If loading is finished and there's no user, or user is not an admin, redirect
      if (!user || user.profile?.role !== 'admin') {
        router.push("/dashboard"); // Redirect non-admins to the regular dashboard
      }
    }
  }, [isLoading, user, router]);

  // While loading, or if the user is not yet verified as an admin, show a spinner
  if (isLoading || !user || user.profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is an admin, render the children
  return <>{children}</>;
}
