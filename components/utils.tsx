// Team utility functions

// Helper function to safely format numbers and handle NaN
export const safeFormat = (value: number | string | undefined | null, decimals = 1): string => {
  if (value === null || value === undefined) {
    return "0.0"
  }

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  if (isNaN(numValue)) {
    return "0.0"
  }

  return numValue.toFixed(decimals)
}

// Team colors for border styling
const teamColors = {
  BER: "#d6c042", // ALBA Berlin
  IST: "#2a619c", // Anadolu Efes
  MCO: "#b03340", // Monaco
  BAS: "#2c5f94", // Baskonia
  RED: "#c24b5a", // Crvena Zvezda
  MIL: "#d44c60", // Milan
  BAR: "#2b5c94", // Barcelona
  MUN: "#9e3b4d", // Bayern
  ULK: "#d4b041", // Fenerbahce
  ASV: "#8a8d90", // ASVEL
  TEL: "#d4a355", // Maccabi
  OLY: "#bf5050", // Olympiacos
  PAN: "#2a7046", // Panathinaikos
  PRS: "#4e565f", // Paris
  PAR: "#3a3834", // Partizan
  MAD: "#999999", // Real Madrid
  VIR: "#2f2f2f", // Virtus
  ZAL: "#2a7a51", // Zalgiris
  PAM: "#d47800", // Valencia Basket
}

// Helper function to get team border color
export const getTeamBorderColor = (teamAbbr: string) => {
  return teamColors[teamAbbr] || "#6b7280"
}

// Original team logo function that uses actual logo URLs
export const getTeamLogo = (teamAbbr: string, teamLogoUrl?: string, className?: string) => {
  if (teamLogoUrl) {
    return (
      <img
        src={teamLogoUrl}
        alt={`${teamAbbr} logo`}
        className={className}
      />
    )
  }
  return null
}