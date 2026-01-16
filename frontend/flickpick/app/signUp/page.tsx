"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function SignUp() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password !== repassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("http://127.0.0.1:8000/register", {
        username,
        password,
        repassword,
      });

      // Redirect to login page on success
      router.push("/login");
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center p-4">
      {/* Signup Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">FlickPick</h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Join the movie revolution
          </p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Create account
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
                placeholder="Choose a username"
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
                placeholder="Create a password"
                required
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-200">
                Confirm Password
              </label>
              <input
                type="password"
                value={repassword}
                onChange={(e) => setRepassword(e.target.value)}
                placeholder="Confirm your password"
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-neutral-400 text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
