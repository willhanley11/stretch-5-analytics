"use client"

import { Suspense } from "react"
import { ProLeagueNav } from "@/components/pro-league-nav"

function StandingsContent() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="standings" />
    </div>
  )
}

export default function StandingsPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen flex items-center justify-center">Loading...</div>}>
      <StandingsContent />
    </Suspense>
  )
}
