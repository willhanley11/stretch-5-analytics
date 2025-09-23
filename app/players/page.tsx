"use client"

import { Suspense } from "react"
import { ProLeagueNav } from "@/components/pro-league-nav"

function PlayersContent() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="statistics" />
    </div>
  )
}

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen flex items-center justify-center">Loading...</div>}>
      <PlayersContent />
    </Suspense>
  )
}
