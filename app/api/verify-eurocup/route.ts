import { NextResponse } from "next/server"
import { verifyEuroCupSetup } from "@/lib/db-verification"

export async function GET() {
  try {
    const verificationResult = await verifyEuroCupSetup()
    return NextResponse.json(verificationResult)
  } catch (error) {
    console.error("Error in verification API:", error)
    return NextResponse.json(
      {
        overallStatus: "error",
        issues: [`API Error: ${error.message}`],
        tablesExist: null,
        structureComparisons: null,
        sampleData: null,
      },
      { status: 500 },
    )
  }
}
