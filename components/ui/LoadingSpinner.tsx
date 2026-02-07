"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function LoadingSpinner({ size = "md", message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizeClasses[size]} border-2 border-purple-500 border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {message && (
        <p className="text-sm text-slate-400">{message}</p>
      )}
    </div>
  );
}

export function LoadingPage({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}
