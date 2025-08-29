"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronDown, Trophy, Group, Users, Shield, LineChart, Scale, BarChart, PersonStanding } from "lucide-react"
import { cn } from "@/lib/utils"
import OffenseTab from "./my-season/offense-tab"
import ComparisonTab from "./my-season/comparison-tab"
import YamagataTeamStats from "./yamagata-team-stats"
import StatisticsTab from "./statistics-tab"
import AboutPage from "./about-page"

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
      logo: "/euroleague-logo.png",
    },
    {
      id: "international-eurocup",
      name: "EuroCup",
      country: "International",
      flag: "🌍",
      color: "#0066CC",
      logo: "/eurocup-logo.png",
    },
  ],
}

// Flatten leagues for easy lookup
const allLeagues = Object.values(leaguesByCountry).flat()

// League sections - reordered and renamed "Statistics" to "Profiles"
const leagueSections = [
  { id: "teams", label: "Teams", initial: "T", icon: Users },
  { id: "statistics", label: "Players", initial: "P", icon: PersonStanding },

  { id: "standings", label: "League", initial: "S", icon: Trophy },
  { id: "players", label: "Statistics", initial: "St", icon: BarChart },
  { id: "comparison", label: "Comparison", initial: "C", icon: Scale },
]

export function ProLeagueNav() {
  const [activeLeague, setActiveLeague] = useState("international-euroleague")
  const [activeSection, setActiveSection] = useState("teams")
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
    { id: 2024, display: "2024-25" },
    { id: 2023, display: "2023-24" },
    { id: 2022, display: "2022-23" },
    { id: 2021, display: "2021-22" },
    { id: 2020, display: "2020-21" },
    { id: 2019, display: "2019-20" },
    { id: 2018, display: "2018-19" },
    { id: 2017, display: "2017-18" },
    { id: 2016, display: "2016-17" },
  ])

  const [selectedLeague, setSelectedLeague] = useState("international-euroleague")
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false)
  const [selectedSeason, setSelectedSeason] = useState<number>(2024)

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
  const selectorsRef = useRef<HTMLDivElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  const rightActionsRef = useRef<HTMLDivElement>(null)
  const mobileSeasonRef = useRef<HTMLDivElement>(null)

  const currentLeague = allLeagues.find((league) => league.id === activeLeague) || allLeagues[0]

  // --- START: Refined Changes for smooth shrink effect ---

  // Ref for the entire header container
  const headerRef = useRef<HTMLDivElement>(null)
  const topHeaderRowRef = useRef<HTMLDivElement>(null) // Ref for the top row

  const [headerHeight, setHeaderHeight] = useState(0) // Total header height
  const [topHeaderRowHeight, setTopHeaderRowHeight] = useState(0) // Height of the top row
  const [scrollY, setScrollY] = useState(0)

  // Update scrollY on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
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
    }
    updateHeaderHeights()
    window.addEventListener("resize", updateHeaderHeights)
    return () => window.removeEventListener("resize", updateHeaderHeights)
  }, [])

  // Calculate the amount the *entire header* should translate up
  // It should be 0 when scrollY is 0, and up to -topHeaderRowHeight when scrollY >= topHeaderRowHeight
  const headerTranslateY = Math.max(-topHeaderRowHeight, -scrollY)

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setIsSeasonDropdownOpen(false)
      }
      if (mobileSeasonRef.current && !mobileSeasonRef.current.contains(event.target as Node)) {
        setIsMobileSeasonOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const renderActiveContent = () => {
    switch (activeSection) {
      case "teams":
        return (
          <div
            className="px-4 pb-4 pt-6 sm:px-6 md:px-8 lg:pt-12"
            style={{
              background: "background-color: #f3f4f6"
            }}
          >
            <div className="max-w-10xl mx-auto ">
              <YamagataTeamStats
                initialTab="teams"
                hideNav={true}
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
              />
            </div>
          </div>
        );
      case "statistics":
        return (
          <div
            className="px-4 pb-4 pt-6 sm:px-6 md:px-8 lg:pt-12"
            style={{
              background: "background-color: #ffffff",
            }}
          >
            <div className="max-w-10xl mx-auto ">
              <OffenseTab
                playerSearch={playerNameSearch}
                onPlayerSearchChange={setPlayerNameSearch}
                selectedPlayer={selectedPlayer}
                onPlayerSelect={setSelectedPlayer}
                filteredPlayers={filteredPlayerImages}
                selectedSeason={selectedSeason}
                league={selectedLeague === "international-euroleague" ? "euroleague" : "eurocup"}
              />
            </div>
          </div>
        );
      case "standings":
        return (
          <div
            className="px-4 pb-4 pt-6 sm:px-6 md:px-8 lg:pt-12"
            style={{
              background: "background-color: #ffffff",
            }}
          >
            <div className="max-w-10xl mx-auto">
              <YamagataTeamStats
                initialTab="league"
                hideNav={true}
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
              />
            </div>
          </div>
        );
      case "players":
        return (
          <div
            className="px-4 pb-4 pt-6 sm:px-6 md:px-8 lg:pt-12" // Use consistent padding
            style={{
              background: "background-color: #ffffff",
            }}
          >
            <div className="max-w-10xl mx-auto ">
              <StatisticsTab
                playerSearch={playerNameSearch}
                onPlayerSearchChange={setPlayerNameSearch}
                season={selectedSeason}
                league={selectedLeague === "international-euroleague" ? "euroleague" : "eurocup"}
              />
            </div>
          </div>
        );
      case "comparison":
        return (
          <div
            className="px-4 pb-4 pt-6 sm:px-6 md:px-8 lg:pt-12" // Use consistent padding
            style={{
              background: "background-color: #ffffff",
            }}
          >
            <div className="max-w-10xl mx-auto ">
              <ComparisonTab selectedSeason={selectedSeason} selectedLeague={selectedLeague} />
            </div>
          </div>
        );
      case "about":
        return (
          <div className="px-4 pt-12 sm:px-6 sm:pt-0 md:px-8 pb-4">
            <div className="max-w-4xl mx-auto">
              <AboutPage />
            </div>
          </div>
        );
      default:
        return (
          <div className="px-4 sm:px-6 md:px-8 pt-4 pb-4 bg-white">
            <div className="max-w-10xl mx-auto bg-gray-100 rounded-lg shadow-lg p-2 border border-gray-300">
              <YamagataTeamStats
                initialTab="teams"
                hideNav={true}
                selectedSeason={selectedSeason}
                selectedLeague={selectedLeague}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fixed header container that holds both rows */}
      <header
        ref={headerRef} // Attach ref to the entire header
        style={{ transform: `translateY(${headerTranslateY}px)` }} // Apply dynamic translateY to the whole header
        className={cn(
          "fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-transform duration-100 ease-out",
        )}
      >
        {/* Top row - Logo + League Buttons + Season + Actions */}
        <div
          ref={topHeaderRowRef} // Attach ref here to measure its height
          className={cn(
            "w-full transition-all duration-100 ease-out", // Keep this for subtle transitions if content changes
            // The actual slide-up is handled by the parent's translateY
          )}
        >
          <div className="max-w-screen-2xl mx-auto">
            {/* Desktop Navigation */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between h-16 px-4 sm:px-8 gap-4">
                {/* Left - Brand + League Buttons */}
                <div className="flex items-center space-x-6 flex-shrink-0">
                  <div className="relative h-10 w-32">
                    <Image src="/stretch5-logo-original.png" alt="Stretch5 Analytics" fill className="object-contain" />
                  </div>

                  {/* League Buttons - Horizontal */}
                  <div className="flex items-center space-x-6">
                    {allLeagues.map((league) => (
                      <button
                        key={league.id}
                        onClick={() => {
                          setActiveLeague(league.id)
                          setSelectedLeague(league.id)
                        }}
                        className={cn(
                          "flex items-center space-x-2 px-1 py-1 text-sm transition-all duration-200 relative",
                          league.id === activeLeague
                            ? "text-gray-900 font-semibold"
                            : "text-gray-600 hover:text-gray-800 font-medium",
                        )}
                      >
                        <div className="relative h-4 w-4">
                          <Image
                            src={league.logo || "/placeholder.svg"}
                            alt={league.name}
                            width={16}
                            height={16}
                            className="object-contain"
                          />
                        </div>
                        <span>{league.name}</span>
                        {league.id === activeLeague && (
                          <motion.div
                            layoutId="activeLeagueIndicator"
                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-900"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right - Season Selector + Actions */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {/* Season Selector */}
                  <div className="relative" ref={seasonDropdownRef}>
                    <button
                      onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
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
                          className="absolute right-0 mt-2 w-40 rounded-lg overflow-hidden z-50 border border-gray-200 shadow-lg bg-white/95 backdrop-blur-md"
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

                  {/* About Button */}
                  <button
                    onClick={() => handleTabClick("about")}
                    className={cn(
                      "text-sm font-medium transition-colors duration-200",
                      activeSection === "about" ? "text-gray-900" : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    About
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Navigation - Single Level with Logo and Right-aligned League Buttons */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                {/* Logo */}
                <div className="relative h-6 w-20 flex-shrink-0">
                  <Image src="/stretch5-logo-original.png" alt="Stretch5 Analytics" fill className="object-contain" />
                </div>

                {/* League Buttons - Right Aligned */}
                <div className="flex items-center space-x-4">
                  {allLeagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => {
                        setActiveLeague(league.id)
                        setSelectedLeague(league.id)
                      }}
                      className={cn(
                        "flex items-center space-x-1 px-1 py-1 text-xs transition-all duration-200 relative",
                        league.id === activeLeague
                          ? "text-gray-900 font-semibold"
                          : "text-gray-600 hover:text-gray-800 font-medium",
                      )}
                    >
                      <div className="relative h-4 w-4">
                        <img
                          src={league.logo || "/placeholder.svg"}
                          alt={league.name}
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <span>{league.name}</span>
                      {league.id === activeLeague && (
                        <motion.div
                          layoutId="mobileActiveLeagueIndicator"
                          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gray-900"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row - Navigation tabs */}
        <div
          className={cn(
            "w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-all duration-100 ease-out",
            // The border-t will appear when the top row slides up, thanks to the main header's translateY
            // If the border-t on desktop needs to only appear when sticky, you could conditionally apply it here
            // based on `scrollY >= topHeaderRowHeight`
          )}
        >
          <div className="max-w-screen-2xl mx-auto">
            {/* Desktop Navigation Tabs */}
            <div className="hidden sm:block border-t border-gray-100 px-4 sm:px-8">
              <nav className="flex items-center justify-center space-x-8 py-2">
                {leagueSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleTabClick(section.id)}
                    className={cn(
                      "text-sm font-medium transition-all duration-200 relative whitespace-nowrap px-3 py-1.5 rounded-lg",
                      activeSection === section.id ? "text-gray-900" : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {section.label}
                    {activeSection === section.id && (
                      <motion.div
                        layoutId="tabBackground"
                        className="absolute inset-0 bg-gray-100 rounded-lg -z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Mobile Navigation Tabs with Season Selector */}
            <div className="sm:hidden px-4 py-1.5">
              <div className="flex items-center justify-between">
                {/* Left - Navigation Tabs */}
                <nav className="flex items-center space-x-2 overflow-x-auto flex-1">
                  {leagueSections.map((section) => {
                    const IconComponent = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleTabClick(section.id)}
                        className={cn(
                          "text-xs font-medium transition-all duration-200 relative whitespace-nowrap px-2 py-1 flex-shrink-0 flex flex-col items-center rounded-md",
                          activeSection === section.id ? "text-gray-900" : "text-gray-600 hover:text-gray-900",
                        )}
                      >
                        <IconComponent className="h-4 w-4 mb-1" />
                        {activeSection === section.id && (
                          <motion.div
                            layoutId="mobileTabBackground"
                            className="absolute inset-0 bg-gray-100 rounded-md -z-10"
                            initial={false}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>

                {/* Right - Season Selector */}
                <div className="relative ml-2 flex-shrink-0" ref={mobileSeasonRef}>
                  <button
                    onClick={() => setIsMobileSeasonOpen(!isMobileSeasonOpen)}
                    className="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 text-xs"
                  >
                    <span className="font-medium text-xs">
                      {seasons.find((s) => s.id === selectedSeason)?.display || "2024-25"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <AnimatePresence>
                    {isMobileSeasonOpen && (
                      <motion.div
                        className="absolute right-0 mt-2 w-28 rounded-lg overflow-hidden z-50 border border-gray-200 shadow-lg bg-white/95 backdrop-blur-md"
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
                                "flex items-center w-full px-2 py-1.5 text-xs transition-colors",
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
        </div>
      </header>

      {/* Spacer to prevent content from hiding behind the sticky header */}
      <div
        style={{
          // The height should always be the current calculated height of the entire header
          height: `${headerHeight}px`,
        }}
        className="w-full bg-transparent"
      ></div>

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
    </div>
  )
}
