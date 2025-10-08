"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronDown, Trophy, Users, BarChart, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import OffenseTab from "./my-season/offense-tab"
import ComparisonTab from "./my-season/comparison-tab"
import YamagataTeamStats from "./yamagata-team-stats"
import StatisticsTab from "./statistics-tab"
import LandingPage from "./landing-page"
import GamesTab from "./games-tab"

// Add International section with Euroleague
const countries = [{ id: "international", name: "International", flag: "🌍" }]

const leaguesByCountry = {
  international: [
    {
      id: "international-euroleague",
      name: "Euroleague",
      country: "International",
      flag: "🌍",
      color: "#FF6600",
    },
    {
      id: "international-eurocup",
      name: "EuroCup",
      country: "International",
      flag: "🌍",
      color: "#0066CC",
    },
  ],
}

// Flatten leagues for easy lookup
const allLeagues = Object.values(leaguesByCountry).flat()

// League sections - reordered with Games first
const leagueSections = [
  { id: "games", label: "Games", initial: "G", icon: Calendar },
  { id: "teams", label: "Teams", initial: "T", icon: BarChart },
  { id: "statistics", label: "Players", initial: "P", icon: Users },
  { id: "standings", label: "Leaders", initial: "S", icon: Trophy },
]

interface ProLeagueNavProps {
  initialSection?: string
  showLandingPage?: boolean
}

export function ProLeagueNav({ initialSection, showLandingPage: initialShowLandingPage = false }: ProLeagueNavProps) {
  const router = useRouter()

  // Initialize state from props or defaults
  const [activeLeague, setActiveLeague] = useState("international-euroleague")
  const [activeSection, setActiveSection] = useState(initialSection || "games")
  const [showLandingPage, setShowLandingPage] = useState(initialShowLandingPage)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [playerNameSearch, setPlayerNameSearch] = useState("")
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [filteredPlayerImages, setFilteredPlayerImages] = useState<any[]>([])
  const [hideSelectors, setHideSelectors] = useState(false)
  const [hideRightActions, setHideRightActions] = useState(false)
  const [useInitials, setUseInitials] = useState(false)
  const [isMobileSeasonOpen, setIsMobileSeasonOpen] = useState(false)
  const [seasons, setSeasons] = useState<{ id: number; display: string }[]>([
    { id: 2025, display: "2025-26" },
    { id: 2024, display: "2024-25" },
    { id: 2023, display: "2023-24" },
    { id: 2022, display: "2022-23" },
    { id: 2021, display: "2021-22" },
  ])

  const [selectedLeague, setSelectedLeague] = useState("international-euroleague")
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false)
  const [isLeagueDropdownOpen, setIsLeagueDropdownOpen] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<number>(2025)

  // Sync activeLeague with selectedLeague when it changes
  useEffect(() => {
    setActiveLeague(selectedLeague)
  }, [selectedLeague])

  // Debug when selectedSeason changes
  useEffect(() => {}, [selectedSeason])

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setIsSeasonDropdownOpen(false)
    setIsLeagueDropdownOpen(false)
    setIsUserMenuOpen(false)
    setIsMobileSeasonOpen(false)
  }

  // State for landing page selections
  const [landingPageSelections, setLandingPageSelections] = useState<any>(null)

  const mockPlayers = [
    { id: 1, name: "Marcelinho", image: null, initials: "MH" },
    { id: 2, name: "Facundo", image: null, initials: "FC" },
    { id: 3, name: "Nikola", image: null, initials: "NM" },
    { id: 4, name: "Sasu", image: null, initials: "SS" },
    { id: 5, name: "John", image: null, initials: "JS" },
  ]

  useEffect(() => {
    if (playerNameSearch.trim() === "") {
      setFilteredPlayerImages(mockPlayers)
    } else {
      const filtered = mockPlayers.filter((player) =>
        player.name.toLowerCase().includes(playerNameSearch.toLowerCase()),
      )
      setFilteredPlayerImages(filtered)
    }
  }, [playerNameSearch])

  const userMenuRef = useRef<HTMLDivElement>(null)
  const seasonDropdownRef = useRef<HTMLDivElement>(null)
  const leagueDropdownRef = useRef<HTMLDivElement>(null)
  const selectorsRef = useRef<HTMLDivElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  const rightActionsRef = useRef<HTMLDivElement>(null)
  const mobileSeasonRef = useRef<HTMLDivElement>(null)

  const currentLeague = allLeagues.find((league) => league.id === activeLeague) || allLeagues[0]

  // --- START: Refined Changes for smooth shrink effect ---

  // Ref for the entire header container
  const headerRef = useRef<HTMLDivElement>(null)
  const topHeaderRowRef = useRef<HTMLDivElement>(null) // Ref for the top row
  const bottomRowRef = useRef<HTMLDivElement>(null) // Ref for the bottom row

  const [headerHeight, setHeaderHeight] = useState(0) // Total header height
  const [topHeaderRowHeight, setTopHeaderRowHeight] = useState(0) // Height of the top row
  const [bottomRowHeight, setBottomRowHeight] = useState(0) // Height of the bottom row
  const [scrollY, setScrollY] = useState(0)
  const [isBottomRowFixed, setIsBottomRowFixed] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (topHeaderRowRef.current) {
        const topRowBottom = topHeaderRowRef.current.getBoundingClientRect().bottom
        // When the top row scrolls out of view, fix the bottom row
        setIsBottomRowFixed(topRowBottom <= 0)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Get heights of header rows on mount and resize
  useEffect(() => {
    const updateHeaderHeights = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
      if (topHeaderRowRef.current) {
        setTopHeaderRowHeight(topHeaderRowRef.current.offsetHeight)
      }
      if (bottomRowRef.current) {
        setBottomRowHeight(bottomRowRef.current.offsetHeight)
      }
    }
    updateHeaderHeights()
    window.addEventListener("resize", updateHeaderHeights)
    return () => window.removeEventListener("resize", updateHeaderHeights)
  }, [])

  // --- END: Refined Changes for smooth shrink effect ---

  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasonsData = await fetch("/api/seasons").then((res) => res.json())
        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData)
        }
      } catch (error) {
        console.error("Error fetching seasons:", error)
      }
    }

    // For now, we'll use the hardcoded seasons
    // fetchSeasons()
  }, [])

  // Enhanced click-outside functionality for dropdowns
  useEffect(() => {
    // Only add event listeners when dropdowns are actually open (performance optimization)
    const isAnyDropdownOpen = isSeasonDropdownOpen || isLeagueDropdownOpen || isUserMenuOpen || isMobileSeasonOpen

    if (!isAnyDropdownOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Check each dropdown individually and close if click is outside
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false)
      }
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(target)) {
        setIsSeasonDropdownOpen(false)
      }
      if (leagueDropdownRef.current && !leagueDropdownRef.current.contains(target)) {
        setIsLeagueDropdownOpen(false)
      }
      if (mobileSeasonRef.current && !mobileSeasonRef.current.contains(target)) {
        setIsMobileSeasonOpen(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAllDropdowns()
      }
    }

    // Add both mousedown and click event listeners for more reliable detection
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("click", handleClickOutside)
    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("click", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isSeasonDropdownOpen, isLeagueDropdownOpen, isUserMenuOpen, isMobileSeasonOpen]) // Dependencies for proper event listener updates

  const checkOverlap = useCallback(() => {
    if (selectorsRef.current && navigationRef.current && rightActionsRef.current) {
      const selectorsRect = selectorsRef.current.getBoundingClientRect()
      const navigationRect = navigationRef.current.getBoundingClientRect()
      const rightActionsRect = rightActionsRef.current.getBoundingClientRect()

      const leftOverlap = selectorsRect.right > navigationRect.left - 20
      setHideSelectors(leftOverlap)

      const rightOverlap = navigationRect.right + 20 > rightActionsRect.left
      setHideRightActions(rightOverlap)

      const availableSpace = rightActionsRect.left - selectorsRect.right - 40
      const navigationWidth = navigationRect.width
      const needsInitials = navigationWidth > availableSpace * 0.8
      setUseInitials(needsInitials)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(checkOverlap, 100)

    const handleResize = () => {
      checkOverlap()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timer)
    }
  }, [checkOverlap])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  const handleTabClick = (sectionId: string) => {
    setActiveSection(sectionId)
  }

  const handleLandingPageNavigation = (tab: string, selections: any) => {
    // Update season and league FIRST before other state changes
    if (selections?.season) {
      setSelectedSeason(selections.season)
    }
    if (selections?.league) {
      setSelectedLeague(selections.league)
    }

    // Store landing page selections to pass to tabs
    setLandingPageSelections({ tab, ...selections })

    // Then update other states
    setShowLandingPage(false)
    setActiveSection(tab)

    // Navigate to the appropriate URL
  }

  const renderActiveContent = () => {
    switch (activeSection) {
      case "teams":
        return (
          <motion.div
            className=" px-2 pb-4 pt-6 md:px-8 md:pt-2"
            style={{ background: "background-color: #f3f4f6" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-10xl mx-auto ">
              <YamagataTeamStats
                initialTab="teams"
                hideNav={true}
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
                initialTeam={landingPageSelections?.team}
                onSectionChange={(section) => setActiveSection(section)}
              />
            </div>
          </motion.div>
        )
      case "statistics":
        return (
          <motion.div
            className="px-2 pb-4 pt-6  md:px-8 md:pt-2"
            style={{
              background: "background-color: #ffffff",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-10xl mx-auto ">
              <OffenseTab
                playerSearch={playerNameSearch}
                onPlayerSearchChange={setPlayerNameSearch}
                selectedPlayer={selectedPlayer}
                onPlayerSelect={setSelectedPlayer}
                filteredPlayers={filteredPlayerImages}
                selectedSeason={selectedSeason}
                onSeasonChange={setSelectedSeason}
                league={selectedLeague === "international-euroleague" ? "euroleague" : "eurocup"}
                initialPlayer={landingPageSelections?.player}
                initialTeam={landingPageSelections?.team}
              />
            </div>
          </motion.div>
        )
      case "standings":
        return (
          <motion.div
            className="px-2 pb-4 pt-6 sm:px-6 md:px-8 md:pt-2"
            style={{
              background: "background-color: #ffffff",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-10xl mx-auto">
              <YamagataTeamStats
                initialTab="league"
                hideNav={true}
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
                initialTeam={landingPageSelections?.team}
                initialTableMode={landingPageSelections?.mode}
                onSectionChange={(section) => setActiveSection(section)}
              />
            </div>
          </motion.div>
        )
      case "players":
        return (
          <motion.div
            className="px-4 pb-4 pt-6 sm:px-6 md:px-8 md:pt-2" // Use consistent padding
            style={{
              background: "background-color: #ffffff",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-10xl mx-auto ">
              <StatisticsTab
                playerSearch={playerNameSearch}
                onPlayerSearchChange={setPlayerNameSearch}
                season={selectedSeason}
                league={selectedLeague === "international-euroleague" ? "euroleague" : "eurocup"}
              />
            </div>
          </motion.div>
        )
      case "games":
        return (
          <motion.div
            className="px-2 pb-4 pt-6 sm:px-6 md:px-8 md:pt-2"
            style={{
              background: "background-color: #f9fafb",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-10xl mx-auto">
              <GamesTab selectedSeason={selectedSeason} selectedLeague={selectedLeague} />
            </div>
          </motion.div>
        )
      case "comparison":
        return (
          <motion.div
            className="px-2 pb-4 pt-6 sm:px-6 md:px-8 md:pt-2" // Use consistent padding
            style={{
              background: "background-color: #ffffff",
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="max-w-10xl mx-auto ">
              <ComparisonTab
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
                initialPlayers={landingPageSelections?.players}
              />
            </div>
          </motion.div>
        )
      default:
        return (
          <div className="px-4 sm:px-6 md:px-8 pt-6 md:pt-2 pb-4 bg-white">
            <div className="max-w-10xl mx-auto bg-gray-100 rounded-lg shadow-lg p-2 border border-gray-300">
              <YamagataTeamStats
                initialTab="teams"
                hideNav={true}
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
                initialTeam={landingPageSelections?.team}
                onSectionChange={(section) => setActiveSection(section)}
              />
            </div>
          </div>
        )
    }
  }

  // Show landing page if showLandingPage is true
  if (showLandingPage) {
    return (
      <LandingPage
        onNavigate={handleLandingPageNavigation}
        selectedSeason={selectedSeason}
        selectedLeague={selectedLeague}
        onSeasonChange={setSelectedSeason}
        onLeagueChange={setSelectedLeague}
      />
    )
  }

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <header
        ref={headerRef}
        className="relative top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
      >
        {/* Top row - Logo + League Buttons + Season + Actions */}
        <div ref={topHeaderRowRef} className="w-full">
          <div className="max-w-screen-2xl mx-auto">
            {/* Desktop Navigation */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between h-16 px-4 sm:px-8 gap-4">
                {/* Left - Brand + League Buttons */}
                <div className="flex items-center space-x-6 flex-shrink-0">
                  <button
                    onClick={() => setShowLandingPage(true)}
                    className="relative h-10 w-32 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <Image
                      src="/stretch5-logo-original.png"
                      alt="Stretch 5 Analytics"
                      fill
                      className="object-contain"
                    />
                  </button>

                  {/* League Dropdown */}
                  <div className="relative" ref={leagueDropdownRef}>
                    <button
                      onClick={() => {
                        closeAllDropdowns()
                        setIsLeagueDropdownOpen(true)
                      }}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 shadow-sm"
                    >
                      <span className="text-sm font-medium">
                        {allLeagues.find((l) => l.id === activeLeague)?.name || "Select League"}
                      </span>
                      <svg
                        className={`h-4 w-4 transition-transform ${isLeagueDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isLeagueDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-40 rounded-lg overflow-hidden z-[1001] border border-gray-200 shadow-lg bg-white/95 backdrop-blur-md">
                        <div className="py-2">
                          {allLeagues.map((league) => (
                            <button
                              key={league.id}
                              onClick={() => {
                                setActiveLeague(league.id)
                                setSelectedLeague(league.id)
                                setIsLeagueDropdownOpen(false)
                              }}
                              className={cn(
                                "flex items-center w-full px-3 py-2 text-sm transition-colors",
                                activeLeague === league.id
                                  ? "bg-gray-100 text-gray-900 font-medium"
                                  : "text-gray-600 hover:bg-gray-50",
                              )}
                            >
                              {league.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right - Season Selector + Actions */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {/* Season Selector */}
                  <div className="relative" ref={seasonDropdownRef}>
                    <button
                      onClick={() => {
                        closeAllDropdowns()
                        setIsSeasonDropdownOpen(true)
                      }}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 shadow-sm"
                    >
                      <span className="text-sm font-medium">
                        {seasons.find((s) => s.id === selectedSeason)?.display || "2024-25"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {isSeasonDropdownOpen && (
                        <motion.div
                          className="absolute right-0 mt-2 w-40 rounded-lg overflow-hidden z-[1001] border border-gray-200 shadow-lg bg-white/95 backdrop-blur-md"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="py-2">
                            {seasons.map((season) => (
                              <button
                                key={season.id}
                                onClick={() => {
                                  setSelectedSeason(season.id)
                                  setIsSeasonDropdownOpen(false)
                                }}
                                className={cn(
                                  "flex items-center w-full px-3 py-2 text-sm transition-colors",
                                  selectedSeason === season.id
                                    ? "bg-gray-100 text-gray-900 font-medium"
                                    : "text-gray-600 hover:bg-gray-50",
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
                </div>
              </div>
            </div>

            {/* Mobile Navigation - Single Level with Logo and Right-aligned League/Season Buttons */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-100">
                {/* Logo */}
                <button
                  onClick={() => setShowLandingPage(true)}
                  className="relative h-7 w-24 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Image src="/stretch5-logo-original.png" alt="Stretch 5 Analytics" fill className="object-contain" />
                </button>

                {/* League and Season Dropdowns - Mobile */}
                <div className="flex items-center space-x-2">
                  {/* League Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        closeAllDropdowns()
                        setIsLeagueDropdownOpen(true)
                      }}
                      className="flex items-center space-x-1 px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200 text-[11px] font-semibold"
                    >
                      <span className="text-xs">{allLeagues.find((l) => l.id === activeLeague)?.name || "League"}</span>
                      <svg
                        className={`h-3 w-3 transition-transform ${isLeagueDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isLeagueDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-32 rounded-lg overflow-hidden z-[9999] border border-gray-200 shadow-lg bg-white">
                        <div className="py-2 max-h-40 overflow-y-auto">
                          {allLeagues.map((league) => (
                            <button
                              key={league.id}
                              onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setActiveLeague(league.id)
                                setSelectedLeague(league.id)
                                setIsLeagueDropdownOpen(false)
                              }}
                              className={cn(
                                "flex items-center w-full px-3 py-2 text-xs transition-colors cursor-pointer",
                                activeLeague === league.id
                                  ? "bg-blue-50 text-blue-900 font-semibold"
                                  : "text-gray-600 hover:bg-gray-50",
                              )}
                            >
                              {league.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Season Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        closeAllDropdowns()
                        setIsMobileSeasonOpen(true)
                      }}
                      className="flex items-center space-x-1 px-3 py-1 rounded-md text-white bg-orange-600 hover:bg-orange-700 shadow-md transition-all duration-200 text-[11px] font-semibold"
                    >
                      <span className="text-xs">
                        {seasons.find((s) => s.id === selectedSeason)?.display || "2024-25"}
                      </span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <AnimatePresence>
                      {isMobileSeasonOpen && (
                        <motion.div
                          className="absolute right-0 mt-2 w-24 rounded-lg overflow-hidden z-[1001] border border-gray-200 shadow-lg bg-white/95 backdrop-blur-md"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="py-2 max-h-40 overflow-y-auto">
                            {seasons.map((season) => (
                              <button
                                key={season.id}
                                onClick={() => {
                                  setSelectedSeason(season.id)
                                  setIsMobileSeasonOpen(false)
                                }}
                                className={cn(
                                  "flex items-center w-full px-3 py-2 text-xs transition-colors",
                                  selectedSeason === season.id
                                    ? "bg-orange-50 text-orange-900 font-semibold"
                                    : "text-gray-600 hover:bg-gray-50",
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          ref={bottomRowRef}
          className={cn(
            "w-full border-t border-gray-100 bg-white/95 backdrop-blur-md z-50 transition-all duration-200",
            isBottomRowFixed ? "fixed top-0 left-0 right-0 shadow-md" : "relative",
          )}
        >
          <div className="max-w-screen-2xl mx-auto">
            {/* Desktop Navigation Tabs */}
            <div className="hidden sm:block border-t border-gray-100 px-4 sm:px-8">
              <nav className="flex items-center justify-center space-x-8 py-1">
                {leagueSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleTabClick(section.id)}
                    className={cn(
                      "text-sm font-medium transition-all duration-200 relative whitespace-nowrap px-3 py-1.5 uppercase",
                      activeSection === section.id
                        ? "text-gray-900 border-b-4 border-blue-700"
                        : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent",
                    )}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="sm:hidden px-2 pt-0.5">
              <div className="flex items-center justify-center">
                {/* Navigation Tabs */}
                <nav className="flex items-center w-full">
                  {leagueSections.map((section) => {
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleTabClick(section.id)}
                        className={cn(
                          "text-xs font-medium transition-all duration-200 relative whitespace-nowrap px-2 py-1.5 flex-1 uppercase",
                          activeSection === section.id
                            ? "text-gray-900 border-b-4 border-blue-700"
                            : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent",
                        )}
                      >
                        <span className="text-[11px]">{section.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isBottomRowFixed && <div style={{ height: `${bottomRowHeight}px` }} />}

      {/* Main Content Area */}
      <main className="relative z-10">{renderActiveContent()}</main>

      {/* Mobile menu (remains outside the fixed header logic for its own animation) */}
      <AnimatePresence>
        {/*{isMobileMenuOpen && (*/}
        {/*  <motion.div*/}
        {/*    className="fixed inset-0 z-40 sm:hidden"*/}
        {/*    initial={{ opacity: 0 }}*/}
        {/*    animate={{ opacity: 1 }}*/}
        {/*    exit={{ opacity: 0 }}*/}
        {/*    transition={{ duration: 0.2 }}*/}
        {/*  >*/}
        {/*    <motion.div*/}
        {/*      className="absolute inset-y-0 right-0 w-full max-w-xs flex flex-col border-l shadow-xl bg-white"*/}
        {/*      initial={{ x: "100%" }}*/}
        {/*      animate={{ x: 0 }}*/}
        {/*      exit={{ x: "100%" }}*/}
        {/*      transition={{ type: "spring", damping: 30, stiffness: 300 }}*/}
        {/*    >*/}
        {/*      /!* ... existing mobile menu content ... *!/*/}
        {/*    </motion.div>*/}
        {/*  </motion.div>*/}
        {/*)}*/}
      </AnimatePresence>
    </motion.div>
  )
}
