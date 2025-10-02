import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { teamName, season, league, phase } = await request.json()

    console.log('=== GET TEAM CODE API CALLED ===')
    console.log('Team Name:', teamName, 'Season:', season, 'League:', league, 'Phase:', phase)

    // Map league to table name
    const tableMapping: Record<string, string> = {
      euroleague: 'player_stats_from_gamelogs_euroleague',
      eurocup: 'player_stats_from_gamelogs_eurocup'
    }

    const tableName = tableMapping[league]
    if (!tableName) {
      return NextResponse.json({ error: 'Invalid league' }, { status: 400 })
    }

    console.log('Executing query with parameters:', { teamName, season, phase, tableName })

    // Use sql.query for parameterized queries with table names as template literals
    const query = `
      SELECT DISTINCT player_team_code 
      FROM ${tableName}
      WHERE player_team_name = $1 
        AND season = $2 
        AND phase = $3 
      LIMIT 1
    `

    const result = await sql.query(query, [teamName, season, phase])
    
    console.log('Query result:', result)

    if (result.length > 0) {
      const teamCode = result[0].player_team_code
      console.log('Found team code:', teamCode)
      return NextResponse.json({ teamCode })
    } else {
      console.log('No team code found')
      return NextResponse.json({ teamCode: null })
    }

  } catch (error) {
    console.error('Error in get-team-code API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
