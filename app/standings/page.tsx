"use client"

import { ProLeagueNav } from "@/components/pro-league-nav"

export default function StandingsPage() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="standings" />
    </div>
  )
}
