"use client"

import { ProLeagueNav } from "@/components/pro-league-nav"

export default function TeamsPage() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="teams" />
    </div>
  )
}
