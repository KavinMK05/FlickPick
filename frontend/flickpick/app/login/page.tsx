"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/login", {
        username,
        password,
      });

      // Store user data in localStorage
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem(
        "has_embedding",
        response.data.has_embedding.toString()
      );

      // Redirect to main page
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">FlickPick</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Your personal movie companion
          </p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-950/50 border border-red-900 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-neutral-200 text-neutral-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              Don't have an account?{" "}
              <Link
                href="/signUp"
                className="text-white hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
