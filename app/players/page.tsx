"use client"

import { ProLeagueNav } from "@/components/pro-league-nav"

export default function PlayersPage() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="statistics" />
    </div>
  )
}