"use client"

import type React from "react"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface PlayerPercentilesRadarProps {
  playerRanks: {
    assistToTurnover?: { rank: number; total: number; isTopTier?: boolean }
    effectiveFieldGoal?: { rank: number; total: number; isTopTier?: boolean }
    steals?: { rank: number; total: number; isTopTier?: boolean }
    blocks?: { rank: number; total: number; isTopTier?: boolean }
    points?: { rank: number; total: number; isTopTier?: boolean }
    assists?: { rank: number; total: number; isTopTier?: boolean }
    offensiveRebounds?: { rank: number; total: number; isTopTier?: boolean }
    defensiveRebounds?: { rank: number; total: number; isTopTier?: boolean }
  }
  calculatedPlayerStats: any
  gameData: any[]
  teamColor: string
  playerName?: string
}

const PlayerPercentilesRadar: React.FC<PlayerPercentilesRadarProps> = ({
  playerRanks,
  calculatedPlayerStats,
  gameData,
  teamColor,
  playerName = "Player",
}) => {
  const rankToPercentile = (rank?: { rank: number; total: number }): number => {
    if (!rank || rank.total === 0) return 50
    return Math.round(((rank.total - rank.rank + 1) / rank.total) * 100)
  }

  const calculateREBPercentile = (): number => {
    const oreb = rankToPercentile(playerRanks?.offensiveRebounds)
    const dreb = rankToPercentile(playerRanks?.defensiveRebounds)
    return Math.round((dreb * 0.7 + oreb * 0.3))
  }

  const calculateSTOCKSPercentile = (): number => {
    const steals = rankToPercentile(playerRanks?.steals)
    const blocks = rankToPercentile(playerRanks?.blocks)
    return Math.round((steals + blocks) / 2)
  }

  const radarData = [
    { subject: "SCORING", value: rankToPercentile(playerRanks?.points), fullMark: 100 },
    { subject: "AST", value: rankToPercentile(playerRanks?.assists), fullMark: 100 },
    { subject: "AST/TO", value: rankToPercentile(playerRanks?.assistToTurnover), fullMark: 100 },
    { subject: "REBOUND", value: calculateREBPercentile(), fullMark: 100 },
    { subject: "STOCKS", value: calculateSTOCKSPercentile(), fullMark: 100 },
    { subject: "eFG%", value: rankToPercentile(playerRanks?.effectiveFieldGoal), fullMark: 100 },
  ]

 const CustomPolarAngleAxisTick = ({ cx, cy, payload, index }: any) => {
  const { value } = payload
  const totalPoints = radarData.length
  const angleInRadians = (index * 2 * Math.PI) / totalPoints - Math.PI / 2
  const angleDeg = (angleInRadians * 180) / Math.PI

  const outerRadius = 150
  const dataValue = radarData[index]?.value || 0
  const dataRadius = (dataValue / 100) * outerRadius

  const dataX = cx + Math.cos(angleInRadians) * dataRadius
  const dataY = cy + Math.sin(angleInRadians) * dataRadius

  const labelRadius = outerRadius + 18
  const labelX = cx + Math.cos(angleInRadians) * labelRadius
  const labelY = cy + Math.sin(angleInRadians) * labelRadius

  let textAnchor: "start" | "middle" | "end" = "middle"
  if (angleDeg > -160 && angleDeg < -100) textAnchor = "end"
  else if (angleDeg > 100 && angleDeg < 160) textAnchor = "start"

  return (
    <g>
      {/* Dotted guide line */}
      <line
        x1={dataX}
        y1={dataY}
        x2={labelX}
        y2={labelY}
        stroke="#9CA3AF"
        strokeWidth={1}
        strokeDasharray="2,2"
        opacity={0.6}
      />

      {/* Dot at data value */}
      <circle cx={dataX} cy={dataY} r={4} fill="white" stroke={teamColor} strokeWidth={2} />

      {/* Stat label */}
      <text
        x={labelX}
        y={labelY}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
        fill="#374151"
      >
        {value}
      </text>
    </g>
  )
}



  const CustomPolarRadiusTick = ({ x, y, payload }: any) => {
    if (payload.value % 25 !== 0 || payload.value === 0) return null
    return (
      <text
        x={x + 6} // Move to the right
        y={y}
        textAnchor="start"
        fill="#6B7280"
        fontSize={10}
        dominantBaseline="middle"
      >
        {payload.value}
      </text>
    )
  }

  return (
    <div className="w-full h-full relative bg-red-300 rounded-xl shadow-lg flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
  cx="50%"
  cy="50%"
  outerRadius={150}
  data={radarData}
  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
>

          <PolarGrid
            gridType="polygon"
            radialLines={true}
            stroke="#E5E7EB"
            strokeWidth={1.5}
          />

          <PolarAngleAxis
            dataKey="subject"
            tick={CustomPolarAngleAxisTick}
            tickLine={false}
            axisLine={false}
          />

          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tickCount={5}
            axisLine={false}
            tick={CustomPolarRadiusTick}
            tickSize={0}
          />

          <Radar
            name={playerName}
            dataKey="value"
            stroke={teamColor}
            fill={teamColor}
            fillOpacity={0.25}
            strokeWidth={3}
            dot={false}
            strokeLinecap="round"
            strokeLinejoin="round"
            isAnimationActive={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />

          <Tooltip
            formatter={(value: any) => [`${value}%`, "Percentile"]}
            labelFormatter={(label) => label}
            contentStyle={{
              backgroundColor: "white",
              border: `2px solid ${teamColor}`,
              borderRadius: "12px",
              padding: "16px",
              fontSize: "13px",
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            labelStyle={{
              color: "#374151",
              marginBottom: "6px",
              fontWeight: "700",
            }}
            itemStyle={{
              color: teamColor,
              fontWeight: "600",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PlayerPercentilesRadar
