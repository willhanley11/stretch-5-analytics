"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, X } from "lucide-react"
import type { PlayerStatsFromGameLogs } from "@/lib/types"

interface PlayerSearchOption {
  player_id: string
  player_name: string
  season: number
  phase: string
  player_team_code: string
  player_team_name: string
  teamlogo: string
  games_played: number
}

interface PlayerSearchProps {
  onPlayerSelect: (player: PlayerSearchOption) => void
  allPlayers: PlayerStatsFromGameLogs[]
  placeholder?: string
  className?: string
}

export function PlayerSearch({ 
  onPlayerSelect, 
  allPlayers, 
  placeholder = "Search players...",
  className = "" 
}: PlayerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<PlayerSearchOption[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Create search options from all players data - filter to only Regular Season to avoid duplicates
  const searchOptions = useMemo(() => {
    const options = allPlayers
      .filter(player => player.phase === "Regular Season")
      .map(player => ({
        player_id: player.player_id,
        player_name: player.player_name,
        season: player.season,
        phase: player.phase,
        player_team_code: player.player_team_code,
        player_team_name: player.player_team_name,
        teamlogo: player.teamlogo,
        games_played: player.games_played
      }))
    
    // Debug logging (only when options change)
    console.log("PlayerSearch - allPlayers count:", allPlayers.length)
    console.log("PlayerSearch - searchOptions count:", options.length)
    if (options.length > 0) {
      console.log("PlayerSearch - sample option:", options[0])
    }
    
    return options
  }, [allPlayers])

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredOptions([])
      return
    }

    const filtered = searchOptions
      .filter(option => 
        option.player_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by season descending (most recent first), then by name
        if (a.player_name === b.player_name) {
          return b.season - a.season
        }
        return a.player_name.localeCompare(b.player_name)
      })
      .slice(0, 10) // Limit to 10 results

    setFilteredOptions(filtered)
  }, [searchTerm, searchOptions])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(value.length > 0)
  }

  const handleOptionSelect = (option: PlayerSearchOption) => {
    console.log("PlayerSearch - handleOptionSelect called with:", option)
    console.log("PlayerSearch - About to call onPlayerSelect")
    setSearchTerm(`${option.player_name} - ${option.season}`)
    setIsOpen(false)
    onPlayerSelect(option)
    console.log("PlayerSearch - onPlayerSelect called successfully")
  }

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setIsOpen(true)
    }
  }

  const handleClear = () => {
    setSearchTerm("")
    setIsOpen(false)
    setFilteredOptions([])
    inputRef.current?.focus()
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent text-base"
          style={{ fontSize: '16px' }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={`${option.player_id}-${option.season}-${option.phase}`}
              onMouseDown={(e) => {
                e.preventDefault() // Prevent input blur
                handleOptionSelect(option)
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
            >
              <div className="flex items-center space-x-2 pointer-events-none">
                {option.teamlogo && (
                  <img
                    src={option.teamlogo}
                    alt={option.player_team_name}
                    className="w-5 h-5 object-contain flex-shrink-0"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {option.player_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.player_team_name} • {option.season}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-400 pointer-events-none">
                {option.games_played}G
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
