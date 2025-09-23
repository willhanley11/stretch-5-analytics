"use client"

import { Suspense } from "react"
import { ProLeagueNav } from "@/components/pro-league-nav"

function ComparisonContent() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav initialSection="comparison" />
    </div>
  )
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen flex items-center justify-center">Loading...</div>}>
      <ComparisonContent />
    </Suspense>
  )
}
