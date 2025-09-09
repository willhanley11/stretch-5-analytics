"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LeagueSpinnerProps {
  league?: "euroleague" | "eurocup"
  size?: "sm" | "md" | "lg" | "xl"
  message?: string
  className?: string
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-12 h-12",
  xl: "w-16 h-16"
}

export function LeagueSpinner({ 
  league = "euroleague", 
  size = "md", 
  message,
  className 
}: LeagueSpinnerProps) {
  const logoSrc = league === "eurocup" ? "/basketball2.png" : "/basketball2.png"
  const logoAlt = league === "eurocup" ? "EuroCup" : "Euroleague"

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className={cn(
        "relative animate-spin mb-4",
        sizeClasses[size]
      )}>
        <Image
          src={logoSrc}
          alt={`${logoAlt} logo`}
          fill
          className="object-contain"
          priority
        />
      </div>
      {message && (
        <p className="text-gray-500 text-sm font-medium">
          {message}
        </p>
      )}
    </div>
  )
}

// Preset loading screens for common use cases
export function LeagueLoadingScreen({ 
  league = "euroleague", 
  message = "Loading...",
  fullScreen = true,
  className
}: LeagueSpinnerProps & { fullScreen?: boolean }) {
  const content = (
    <LeagueSpinner 
      league={league} 
      size="lg" 
      message={message}
      className="text-center"
    />
  )

  if (fullScreen) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full min-h-[300px]",
        className
      )}>
        {content}
      </div>
    )
  }

  return content
}

// Loading overlay for full-screen coverage
export function LeagueLoadingOverlay({ 
  league = "euroleague", 
  message = "Loading...",
  className
}: LeagueSpinnerProps) {
  return (
    <div className={cn(
      "absolute inset-0 bg-warm-beige",
      className
    )}>
      <LeagueSpinner 
        league={league} 
        size="lg" 
        message={message}
        className="text-center mt-20 mb-20"
      />
    </div>
  )
}
