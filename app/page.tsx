"use client"

import { Suspense } from "react"
import { ProLeagueNav } from "@/components/pro-league-nav"

function PageContent() {
  return (
    <div className="bg-background min-h-screen">
      <ProLeagueNav showLandingPage={true} />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="bg-background min-h-screen flex items-center justify-center">Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}
