"use client";

import { useEffect, useState } from "react";
import { getUser } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<string>("attendee");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { user } = await getUser();
      if (!user) {
        router.push("/signin");
      }
    };
    checkAuth();
  }, [router]);

  const handleRoleSelection = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          role: selectedRole,
        },
      });

      if (error) {
        console.error("Error updating role:", error);
        return;
      }

      // Redirect based on role
      if (selectedRole === "organizer") {
        router.push("/dashboard/admin");
      } else if (selectedRole === "both") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-eerieblack px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-lg bg-charleston border border-fadedgrey shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img className="h-10 w-auto" src="/syncup.png" alt="SyncUp" />
            <span className="text-xl font-bold text-primary">SyncUp++</span>
          </div>
          <h1 className="text-3xl font-bold text-light">Welcome! 🎉</h1>
          <p className="text-gray-400 text-sm mt-2">
            Choose how you'd like to use SyncUp++
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-3 mb-8">
          {/* Attendee Option */}
          <div
            onClick={() => setSelectedRole("attendee")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedRole === "attendee"
                ? "border-primary bg-primary/10"
                : "border-fadedgrey hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedRole === "attendee"
                    ? "border-primary bg-primary"
                    : "border-gray-400"
                }`}
              >
                {selectedRole === "attendee" && (
                  <div className="h-2 w-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-light">Attendee</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Join and attend events. Register for events you're interested in.
                </p>
              </div>
            </div>
          </div>

          {/* Organizer Option */}
          <div
            onClick={() => setSelectedRole("organizer")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedRole === "organizer"
                ? "border-primary bg-primary/10"
                : "border-fadedgrey hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedRole === "organizer"
                    ? "border-primary bg-primary"
                    : "border-gray-400"
                }`}
              >
                {selectedRole === "organizer" && (
                  <div className="h-2 w-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-light">Organizer</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Create and manage events. Build your community and grow your audience.
                </p>
              </div>
            </div>
          </div>

          {/* Both Option */}
          <div
            onClick={() => setSelectedRole("both")}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedRole === "both"
                ? "border-primary bg-primary/10"
                : "border-fadedgrey hover:border-primary/50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedRole === "both"
                    ? "border-primary bg-primary"
                    : "border-gray-400"
                }`}
              >
                {selectedRole === "both" && (
                  <div className="h-2 w-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-light">Both</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Do everything. Create events and attend others. Maximum flexibility.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRoleSelection}
            disabled={loading}
            className="w-full bg-primary hover:bg-primarydark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
          <p className="text-center text-xs text-gray-500">
            You can change this later in your settings
          </p>
        </div>
      </div>
    </div>
  );
}