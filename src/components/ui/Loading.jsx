"use client";

import { motion } from "framer-motion";
import { Code, Sparkles, Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "md", variant = "primary" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };

  const variants = {
    primary: "text-blue-500",
    secondary: "text-purple-500",
    accent: "text-green-500",
    muted: "text-gray-400"
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizeClasses[size]} ${variants[variant]}`}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
}

export function LoadingDots({ variant = "primary" }) {
  const variants = {
    primary: "bg-blue-500",
    secondary: "bg-purple-500",
    accent: "bg-green-500",
    muted: "bg-gray-400"
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 rounded-full ${variants[variant]}`}
          animate={{
            y: [0, -8, 0],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ children, variant = "primary" }) {
  const variants = {
    primary: "bg-blue-500/20 border-blue-500/30",
    secondary: "bg-purple-500/20 border-purple-500/30",
    accent: "bg-green-500/20 border-green-500/30",
    muted: "bg-gray-500/20 border-gray-500/30"
  };

  return (
    <motion.div
      className={`px-4 py-2 rounded-lg border ${variants[variant]}`}
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [1, 1.02, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

export function LoadingScreen({ 
  message = "Loading...", 
  description,
  showIcon = true,
  variant = "primary" 
}) {
  const iconVariants = {
    primary: "text-blue-400",
    secondary: "text-purple-400", 
    accent: "text-green-400",
    muted: "text-gray-400"
  };

  const gradients = {
    primary: "from-blue-400 to-purple-400",
    secondary: "from-purple-400 to-pink-400",
    accent: "from-green-400 to-blue-400",
    muted: "from-gray-400 to-gray-600"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {showIcon && (
            <div className="relative mb-6">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className={`w-16 h-16 mx-auto ${iconVariants[variant]} relative`}
              >
                <Code className="w-full h-full" />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </motion.div>
              </motion.div>
              
              {/* Animated rings */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 rounded-full border-2 border-${variant === 'primary' ? 'blue' : variant === 'secondary' ? 'purple' : variant === 'accent' ? 'green' : 'gray'}-400/30`}
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.5, 1], 
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 0.5
                }}
                className={`absolute inset-0 rounded-full border border-${variant === 'primary' ? 'purple' : variant === 'secondary' ? 'pink' : variant === 'accent' ? 'blue' : 'gray'}-500/20`}
              />
            </div>
          )}

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`text-2xl font-bold mb-4 bg-gradient-to-r ${gradients[variant]} bg-clip-text text-transparent`}
          >
            {message}
          </motion.h2>

          {description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 mb-6 max-w-md mx-auto"
            >
              {description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center"
          >
            <LoadingDots variant={variant} />
          </motion.div>
        </motion.div>

        {/* Progress bar animation */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut",
            repeatType: "reverse"
          }}
          className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full max-w-xs mx-auto mb-4"
        />
        
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-xs text-gray-500"
        >
          Please wait while we prepare everything for you...
        </motion.p>
      </div>
    </div>
  );
}

export function InlineLoader({ 
  message = "Loading...",
  size = "md",
  variant = "primary",
  showDots = true
}) {
  return (
    <div className="flex items-center justify-center space-x-3 py-4">
      <LoadingSpinner size={size} variant={variant} />
      <div className="flex items-center space-x-2">
        <span className="text-gray-300">{message}</span>
        {showDots && <LoadingDots variant={variant} />}
      </div>
    </div>
  );
}