"use client"

import { useState } from "react"
import EnhancedShotChart from "@/components/enhanced-shot-chart"

export default function ShotChartTestPage() {
  const [playerId, setPlayerId] = useState("")
  const [playerName, setPlayerName] = useState("Nikola Mirotic")
  const [teamCode, setTeamCode] = useState("")
  const [season, setSeason] = useState("2024")
  const [league, setLeague] = useState("euroleague")
  const [fetchLeagueData, setFetchLeagueData] = useState(false)

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-6">Basketball Shot Chart Test</h1>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Chart Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player ID</label>
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., P123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Nikola Mirotic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Code</label>
            <input
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., MIL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">League</label>
            <select
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="euroleague">EuroLeague</option>
              <option value="eurocup">EuroCup</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="fetchLeagueData"
              checked={fetchLeagueData}
              onChange={(e) => setFetchLeagueData(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="fetchLeagueData" className="ml-2 block text-sm text-gray-700">
              Fetch League-wide Data
            </label>
          </div>
        </div>
      </div>

      {/* Shot Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Shot Chart</h2>
        <EnhancedShotChart
          playerId={playerId || undefined}
          playerName={playerName || undefined}
          teamCode={teamCode || undefined}
          season={season}
          league={league}
          fetchLeagueData={fetchLeagueData}
        />
      </div>
    </div>
  )
}
