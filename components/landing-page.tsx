"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react" 
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LandingPageProps {
  onNavigate: (tab: string, selections?: any) => void
  selectedSeason: number
  selectedLeague: string
  onSeasonChange: (season: number) => void
  onLeagueChange: (league: string) => void
}

const seasons = [
  { id: 2025, display: "2025-26" },
  { id: 2024, display: "2024-25" },
  { id: 2023, display: "2023-24" },
  { id: 2022, display: "2022-23" },
  { id: 2021, display: "2021-22" },
]

const leagues = [
  { id: "international-euroleague", name: "Euroleague", color: "#FF6600" },
  { id: "international-eurocup", name: "EuroCup", color: "#0066CC" },
]

// Define the Menu Items
const menuItems = [
  {
    id: "games",
    title: "Games",
    description: "Upcoming Games & Round Results", 
    color: "#1D4ED8", // Explicit blue color for border
    shadow: "shadow-blue-200",
  },
  {
    id: "teams",
    title: "Teams",
    description: "Reports, Schedule/Results, Rosters", 
    color: "#EA580C", // Explicit orange color for border
    shadow: "shadow-orange-200",
  },
  {
    id: "players",
    title: "Players",
    description: "Profiles, Shot Charts, Game Logs", 
    color: "#4B5563", // Explicit gray color for border
    shadow: "shadow-gray-200",
  },
  {
    id: "leaders",
    title: "Leaders",
    description: "League Standings, Player Statistics", 
    color: "#1D4ED8", // Explicit blue color for border
    shadow: "shadow-blue-200",
  },
]

export default function LandingPage({
  onNavigate,
  selectedSeason,
  selectedLeague,
  onSeasonChange,
  onLeagueChange,
}: LandingPageProps) {
  const [isExiting, setIsExiting] = useState(false)
  
  const [isLeagueDropdownOpen, setIsLeagueDropdown] = useState(false)
  const [isSeasonDropdownOpen, setIsSeasonDropdown] = useState(false)

  const leagueDropdownRef = useRef<HTMLDivElement>(null)
  const seasonDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      const isOutsideLeague = leagueDropdownRef.current && !leagueDropdownRef.current.contains(target)
      const isOutsideSeason = seasonDropdownRef.current && !seasonDropdownRef.current.contains(target)
      
      if (isOutsideLeague) setIsLeagueDropdown(false)
      if (isOutsideSeason) setIsSeasonDropdown(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMenuSelection = (option: string) => {
    setIsExiting(true)
    
    const sectionMap: { [key: string]: string } = {
      games: "games",
      teams: "teams", 
      players: "statistics",
      leaders: "standings"
    }
    
    const targetSection = sectionMap[option] || option
    
    setTimeout(() => {
      onNavigate(targetSection, {
        season: selectedSeason,
        league: selectedLeague,
      })
    }, 300)
  }

  return (
    <motion.div
      className="min-h-screen fixed inset-0 z-[100] overflow-y-auto bg-warm-beige"
      
      animate={{
        opacity: isExiting ? 0 : 1,
      }}
      transition={{ duration: 0.5 }}
    >
      
      {/* 1. FULL WIDTH LOGO HEADER (FIXED) */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm py-4"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-xl mx-auto flex justify-center">
          <Image
            src="/stretch5-logo-original.png"
            alt="Stretch 5 Analytics"
            width={220}
            height={90}
            className="object-contain filter drop-shadow-sm"
          />
        </div>
      </motion.div>
      
      {/* Spacer to push content down below the fixed header */}
      <div className="h-[75px] md:h-[80px]" />


      <div className="flex flex-col justify-start items-center p-4 pt-4 min-h-[calc(100vh-80px)]">
        
        {/* Header Section and Dropdowns - max-w-md on mobile, max-w-lg on desktop */}
        <motion.div
          className="text-center mb-6 w-full max-w-md sm:max-w-lg mx-auto" 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          
          {/* Main Title (SUBTLE & SMALLER) */}
          <motion.h1
            className="text-sm md:text-lg text-black mb-1 -mt-1 tracking-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Basketball Analytics & Visualization
          </motion.h1>

          {/* League and Season Selection */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 mt-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* League Dropdown */}
            <div className="relative flex-1" ref={leagueDropdownRef}>
              <button
                onClick={() => {
                  if (isSeasonDropdownOpen) setIsSeasonDropdown(false) 
                  setIsLeagueDropdown((prev) => !prev) 
                }}
                className={cn(
                  "w-full border border-gray-300 bg-white text-left text-gray-800 outline-none hover:bg-gray-50 flex items-center justify-between font-semibold transition-all duration-200 h-11 px-4 text-base shadow-sm",
                  isLeagueDropdownOpen 
                    ? "rounded-t-lg border-b-0 shadow-lg ring-2 ring-blue-700/50" 
                    : "rounded-lg"
                )}
              >
                <span className="truncate">{leagues.find((l) => l.id === selectedLeague)?.name}</span>
                <svg
                  className={cn(
                    "transition-transform duration-300 h-4 w-4",
                    isLeagueDropdownOpen ? "rotate-180 text-blue-700" : "text-gray-500" 
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isLeagueDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-10 w-full bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-xl overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {leagues.map((league) => (
                        <button
                          key={league.id}
                          onClick={() => {
                            onLeagueChange(league.id)
                            setIsLeagueDropdown(false)
                          }}
                          className={cn(
                            "w-full flex items-center px-4 py-2 text-left transition-colors text-base font-medium",
                            selectedLeague === league.id 
                              ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-700"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {league.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Season Dropdown */}
            <div className="relative flex-1" ref={seasonDropdownRef}>
              <button
                onClick={() => {
                  if (isLeagueDropdownOpen) setIsLeagueDropdown(false)
                  setIsSeasonDropdown((prev) => !prev)
                }}
                className={cn(
                  "w-full border border-gray-300 bg-white text-left text-gray-800 outline-none hover:bg-gray-50 flex items-center justify-between font-semibold transition-all duration-200 h-11 px-4 text-base shadow-sm",
                  isSeasonDropdownOpen 
                    ? "rounded-t-lg border-b-0 shadow-lg ring-2 ring-orange-500/50" 
                    : "rounded-lg"
                )}
              >
                <span className="truncate">{seasons.find((s) => s.id === selectedSeason)?.display}</span>
                <svg
                  className={cn(
                    "transition-transform duration-300 h-4 w-4",
                    isSeasonDropdownOpen ? "rotate-180 text-orange-500" : "text-gray-500" 
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isSeasonDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-10 w-full bg-white border border-gray-300 border-t-0 rounded-b-lg shadow-xl overflow-hidden"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {seasons.map((season) => (
                        <button
                          key={season.id}
                          onClick={() => {
                            onSeasonChange(season.id)
                            setIsSeasonDropdown(false)
                          }}
                          className={cn(
                            "w-full flex items-center px-4 py-2 text-left transition-colors text-base font-medium",
                            selectedSeason === season.id 
                              ? "bg-orange-50 text-orange-700 font-bold border-l-4 border-orange-500"
                              : "text-gray-700 hover:bg-gray-100"
                          )}
                        >
                          {season.display}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Subtle Divider Line */}
        <motion.hr 
            className="w-full max-w-md sm:max-w-lg border-gray-300 mb-4" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.65 }}
        />

        {/* 4-Box Menu Grid (NARROWER) */}
        <div className="w-full max-w-xs sm:max-w-sm mx-auto pb-4">
          
          <motion.div
            // *** FIX: Apply an initial hidden state to the grid content and animate in
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {/* Single Column Grid */}
            <div className="grid grid-cols-1 gap-4"> 
              {menuItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  // Removed staggered delay on the main wrapper, now applying it to children
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  // Adjusted delay to start immediately after the parent fade-in is timed
                  transition={{ duration: 0.3, delay: 0.0 + index * 0.05 }} 
                  whileHover={{ 
                      scale: 1.02, 
                      boxShadow: `0 10px 20px -5px ${item.shadow}`,
                      borderLeftColor: item.color, 
                  }} 
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-xl relative overflow-hidden transition-all duration-300 cursor-pointer border border-gray-200 shadow-md"
                  style={{ 
                      willChange: "transform, box-shadow",
                      borderLeftWidth: '4px', 
                      borderLeftColor: item.color, 
                  }}
                >
                  <button className="w-full text-left p-3" onClick={() => handleMenuSelection(item.id)}> 
                    
                    <div className="relative z-10 flex items-center gap-3 justify-between">
                      
                      <div className="flex items-center gap-3 ml-1"> 
                          {/* Title and description */}
                          <div className="flex-grow">
                            <h3 className="text-lg font-bold text-gray-900 mb-0.5 tracking-wide">
                              {item.title}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                              {item.description}
                            </p>
                          </div>
                      </div>
                      
                      {/* Go Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
