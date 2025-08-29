"use client"
import { getTeamLogo, safeFormat, getTeamBorderColor } from "./utils" // Assuming these functions are declared in a utils file
import Flame from "./Flame" // Assuming Flame is a component

const BasketballPlayerHeader = ({
  playerData,
  calculatedPlayerStats,
  getFilteredGameLogs,
  selectedPlayer,
  selectedStat,
  playerRanks,
  setSelectedStat,
}) => {
  return (
    <div className="w-full">
      {/* Main section for Player Image, Name, Team, and Basic Stats */}
      <div className="flex items-start w-full">
        {/* Player Name, Team Name, and Basic Stats - No Image */}
        <div className="flex flex-col flex-grow">
          <div className="flex flex-col w-full relative">
            {/* Logo and Name Row */}
            <div className="flex items-start gap-2 sm:gap-3 pb-2">
              {/* Team Logo - positioned to the left of player/team name */}
              {playerData.teamAbbr && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-12 xl:h-12 bg-white rounded-md sm:rounded-lg border border-black shadow-lg">
                    {getTeamLogo(playerData.teamAbbr, playerData.teamLogoUrl, "w-full h-full")}
                  </div>
                </div>
              )}

              <div className="flex flex-col">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 leading-tight truncate">
                  {playerData.name || "Select Player"}
                </h2>
                {/* Team Name */}
                {playerData.teamAbbr && (
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 truncate">
                    {playerData.team}
                  </span>
                )}
              </div>
            </div>

            {/* Basic Stats Row - Mobile: show below name, all stats compact */}
            <div className="flex md:hidden items-center gap-0.5 flex-wrap justify-start mb-2">
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">GP</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {calculatedPlayerStats ? calculatedPlayerStats.games_played : 0}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">GS</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {
                    getFilteredGameLogs.filter(
                      (game) => game.is_starter === 1 || game.is_starter === true || game.is_starter === "1",
                    ).length
                  }
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">MIN</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.minutes_played) : "0.0"}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">TO</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {selectedPlayer ? safeFormat(selectedPlayer.turnovers) : "0.0"}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">2P%</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.two_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">3P%</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.three_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-md py-0.5 px-2 text-center shadow-sm">
                <div className="text-[6px] font-bold text-gray-600 uppercase tracking-wide">FT%</div>
                <div className="text-[8px] font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.free_throws_percentage) : "0.0"}
                </div>
              </div>
            </div>

            {/* Desktop Basic Stats - Keep original position and styling */}
            <div className="hidden md:flex items-center gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 flex-wrap justify-end flex-shrink-0 absolute top-0 right-0">
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  GP
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? calculatedPlayerStats.games_played : 0}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  GS
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {
                    getFilteredGameLogs.filter(
                      (game) => game.is_starter === 1 || game.is_starter === true || game.is_starter === "1",
                    ).length
                  }
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                  MIN
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.minutes_played) : "0.0"}
                </div>
              </div>

              {/* Additional stats - Hidden until medium screens */}
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  TO
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {selectedPlayer ? safeFormat(selectedPlayer.turnovers) : "0.0"}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  2P%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.two_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  3P%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.three_pointers_percentage) : "0.0"}
                </div>
              </div>
              <div className="hidden md:block bg-gray-50 border-2 border-gray-300 rounded-lg py-0.5 px-1 sm:px-2 md:px-3 text-center shadow-sm">
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-600 uppercase tracking-wide">
                  FT%
                </div>
                <div className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-900">
                  {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.free_throws_percentage) : "0.0"}
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats Grid - Mobile: 6 columns with STL/BLK, Desktop: original responsive sizing */}
          <div className="grid grid-cols-6 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 lg:gap-2 w-full mt-1 sm:mt-2">
            {/* Points */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl pt-1 pb-0.5 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedStat === "points"
                  ? `border-2 ${playerRanks?.points?.isTopTier ? "bg-orange-100" : "bg-white"}`
                  : `border-gray-300 ${playerRanks?.points?.isTopTier ? "bg-orange-100" : "bg-white"}`
              }`}
              style={selectedStat === "points" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("points")}
            >
              <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-700 mb-0 sm:mb-0.5">PTS</div>
              <div className="flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.points_scored) : "0.0"}
                {playerRanks?.points?.isTopTier && (
                  <Flame className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 sm:ml-0.5" />
                )}
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 sm:px-1 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                {playerRanks?.points ? `#${playerRanks.points.rank} of ${playerRanks.points.total} ` : "N/A"}
              </span>
            </div>

            {/* Rebounds */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl pt-1 pb-0.5 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedStat === "rebounds"
                  ? `border-2 ${playerRanks?.rebounds?.isTopTier ? "bg-orange-100" : "bg-white"}`
                  : `border-gray-300 ${playerRanks?.rebounds?.isTopTier ? "bg-orange-100" : "bg-white"}`
              }`}
              style={selectedStat === "rebounds" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("rebounds")}
            >
              <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-700 mb-0 sm:mb-0.5">REB</div>
              <div className="flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.total_rebounds) : "0.0"}
                {playerRanks?.rebounds?.isTopTier && (
                  <Flame className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 sm:ml-0.5" />
                )}
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 sm:px-1 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                {playerRanks?.rebounds ? `#${playerRanks.rebounds.rank} of ${playerRanks.rebounds.total} ` : "N/A"}
              </span>
            </div>

            {/* Assists */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl pt-1 pb-0.5 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedStat === "assists"
                  ? `border-2 ${playerRanks?.assists?.isTopTier ? "bg-orange-100" : "bg-white"}`
                  : `border-gray-300 ${playerRanks?.assists?.isTopTier ? "bg-orange-100" : "bg-white"}`
              }`}
              style={selectedStat === "assists" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("assists")}
            >
              <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-700 mb-0 sm:mb-0.5">AST</div>
              <div className="flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.assists) : "0.0"}
                {playerRanks?.assists?.isTopTier && (
                  <Flame className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 sm:ml-0.5" />
                )}
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 sm:px-1 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                {playerRanks?.assists ? `#${playerRanks.assists.rank} of ${playerRanks.assists.total} ` : "N/A"}
              </span>
            </div>

            {/* 3PM */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl pt-1 pb-0.5 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedStat === "threePointers"
                  ? `border-2 ${playerRanks?.threePointers?.isTopTier ? "bg-orange-100" : "bg-white"}`
                  : `border-gray-300 ${playerRanks?.threePointers?.isTopTier ? "bg-orange-100" : "bg-white"}`
              }`}
              style={selectedStat === "threePointers" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("threePointers")}
            >
              <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-700 mb-0 sm:mb-0.5">3PM</div>
              <div className="flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.three_pointers_made) : "0.0"}
                {playerRanks?.threePointers?.isTopTier && (
                  <Flame className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 sm:ml-0.5" />
                )}
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 sm:px-1 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                {playerRanks?.threePointers
                  ? `#${playerRanks.threePointers.rank} of ${playerRanks.threePointers.total} `
                  : "N/A"}
              </span>
            </div>

            {/* Steals - Now visible on mobile */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl pt-1 pb-0.5 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedStat === "steals"
                  ? `border-2 ${playerRanks?.steals?.isTopTier ? "bg-orange-100" : "bg-white"}`
                  : `border-gray-300 ${playerRanks?.steals?.isTopTier ? "bg-orange-100" : "bg-white"}`
              }`}
              style={selectedStat === "steals" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("steals")}
            >
              <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-700 mb-0 sm:mb-0.5">STL</div>
              <div className="flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.steals) : "0.0"}
                {playerRanks?.steals?.isTopTier && (
                  <Flame className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 sm:ml-0.5" />
                )}
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 sm:px-1 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                {playerRanks?.steals ? `#${playerRanks.steals.rank} of ${playerRanks.steals.total} ` : "N/A"}
              </span>
            </div>

            {/* Blocks - Now visible on mobile */}
            <div
              className={`border-2 rounded-lg sm:rounded-xl pt-1 pb-0.5 sm:py-1.5 px-0 sm:px-1 text-center shadow-lg hover:shadow-xl transition-all cursor-pointer ${
                selectedStat === "blocks"
                  ? `border-2 ${playerRanks?.blocks?.isTopTier ? "bg-orange-100" : "bg-white"}`
                  : `border-gray-300 ${playerRanks?.blocks?.isTopTier ? "bg-orange-100" : "bg-white"}`
              }`}
              style={selectedStat === "blocks" ? { borderColor: getTeamBorderColor(playerData.teamAbbr) } : {}}
              onClick={() => setSelectedStat("blocks")}
            >
              <div className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-gray-700 mb-0 sm:mb-0.5">BLK</div>
              <div className="flex items-center justify-center text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0 sm:mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.blocks) : "0.0"}
                {playerRanks?.blocks?.isTopTier && (
                  <Flame className="h-2 w-2 sm:h-3 sm:w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0 sm:ml-0.5" />
                )}
              </div>
              <span className="text-[6px] sm:text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-0.5 sm:px-1 md:px-1.5 py-0 sm:py-0.5 rounded-full">
                {playerRanks?.blocks ? `#${playerRanks.blocks.rank} of ${playerRanks.blocks.total}` : "N/A"}
              </span>
            </div>

            {/* PIR (Player Index Rating) - Hidden on mobile, visible on sm+ */}
            <div
              className={`hidden sm:block border-2 border-gray-300 rounded-lg sm:rounded-xl py-1 sm:py-1.5 px-0.5 sm:px-1 text-center shadow-lg hover:shadow-xl transition-shadow ${playerRanks?.pir?.isTopTier ? "bg-orange-100" : "bg-white"}`}
            >
              <div className="text-[8px] md:text-[10px] font-bold text-gray-700 mb-0.5">PIR</div>
              <div className="flex items-center justify-center text-xs md:text-sm lg:text-base font-bold text-gray-900 mb-0.5">
                {calculatedPlayerStats ? safeFormat(calculatedPlayerStats.pir) : "0.0"}
                {playerRanks?.pir?.isTopTier && (
                  <Flame className="h-3 w-3 md:h-4 md:w-4 text-orange-600 fill-orange-600 ml-0.5" />
                )}
              </div>
              <span className="text-[8px] md:text-[10px] font-bold text-blue-600 bg-blue-50 px-1 md:px-1.5 py-0.5 rounded-full">
                {playerRanks?.pir ? `#${playerRanks.pir.rank} of ${playerRanks.pir.total} ` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BasketballPlayerHeader
