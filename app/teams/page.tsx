"use client"

import { Suspense } from "react"
import { ProLeagueNav } from "@/components/pro-league-nav"

function TeamsContent() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="teams" />
    </div>
  )
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen flex items-center justify-center">Loading...</div>}>
      <TeamsContent />
    </Suspense>
  )
}
