#!/usr/bin/env python
# coding: utf-8

# In[11]:


# Inserts 2025 data into these 6 tables:

# schedule_results_euroleague
# schedule_results_eurocup
# cumulative_standings_euroleague
# cumulative_standings_eurocup
# team_advanced_stats_euroleague
# team_advanced_stats_eurocup

import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import execute_values
from euroleague_api.game_stats import GameStats
from euroleague_api.boxscore_data import BoxScoreData

def create_team_records_dataset_euroleague(df):
    """
    Create a dataset for EuroLeague where each row represents a team's game with their cumulative record
    """
    all_team_records = []
    all_teams = set(df['local.club.name'].unique()).union(df['road.club.name'].unique())

    phase_order = {'RS': 0,'TS' :1, 'PI': 2, 'PO': 3, 'FF': 4}

    for team in all_teams:
        team_games = df[(df['local.club.name'] == team) | (df['road.club.name'] == team)].copy()
        team_games['PhaseOrder'] = team_games['Phase'].map(phase_order)
        team_games = team_games.sort_values(['Season', 'PhaseOrder', 'Round', 'localDate'])

        for season, season_games in team_games.groupby('Season'):
            wins = 0
            losses = 0
            current_phase_group = None

            for idx, game in season_games.iterrows():
                if game['Phase'] in ['RS','TS']:
                    phase_group = 'RS'
                elif game['Phase'] in ['PI', 'PO', 'FF']:
                    phase_group = 'Playoffs'
                else:
                    phase_group = game['Phase']

                if current_phase_group != phase_group:
                    current_phase_group = phase_group
                    wins = 0
                    losses = 0

                if game['local.club.name'] == team:
                    location = 'Home'
                    team_score = game['local.score']
                    opponent_score = game['road.score']
                    opponent = game['road.club.name']
                    team_code = game['local.club.code']
                    team_image = game['local.club.images.crest']
                    opponent_code = game['road.club.code']
                    opponent_image = game['road.club.images.crest']
                else:
                    location = 'Away'
                    team_score = game['road.score']
                    opponent_score = game['local.score']
                    opponent = game['local.club.name']
                    team_code = game['road.club.code']
                    team_image = game['road.club.images.crest']
                    opponent_code = game['local.club.code']
                    opponent_image = game['local.club.images.crest']

                if team_score > opponent_score:
                    result = 'Win'
                    wins += 1
                elif team_score < opponent_score:
                    result = 'Loss'
                    losses += 1
                else:
                    result = 'Draw'

                record = f"{wins}-{losses}"

                all_team_records.append({
                    'Team': team,
                    'TeamCode': team_code,
                    'TeamImage': team_image,
                    'Date': game['localDate'],
                    'Opponent': opponent,
                    'OpponentCode': opponent_code,
                    'OpponentImage': opponent_image,
                    'Round': game['Round'],
                    'Result': result,
                    'Location': location,
                    'Record': record,
                    'Team_Score': team_score,
                    'Opponent_Score': opponent_score,
                    'Gamecode': game['Gamecode'],
                    'Season': game['Season'],
                    'Phase': game['Phase'],
                    'PhaseGroup': phase_group
                })

    team_records_df = pd.DataFrame(all_team_records)
    team_records_df = team_records_df.sort_values(['Team', 'Season', 'PhaseGroup', 'Round', 'Date'])

    return team_records_df

def create_team_records_dataset_eurocup(df):
    """
    Create a dataset for EuroCup where each row represents a team's game with their cumulative record
    """
    all_team_records = []
    all_teams = set(df['local.club.name'].unique()).union(df['road.club.name'].unique())

    phase_order = {'RS': 0,'TS':1, '8F': 2, '4F': 3}

    for team in all_teams:
        team_games = df[(df['local.club.name'] == team) | (df['road.club.name'] == team)].copy()
        team_games['PhaseOrder'] = team_games['Phase'].map(phase_order)
        team_games = team_games.sort_values(['Season', 'PhaseOrder', 'Round', 'localDate'])

        for season, season_games in team_games.groupby('Season'):
            wins = 0
            losses = 0
            current_phase_group = None

            for idx, game in season_games.iterrows():
                if game['Phase'] in ['RS','TS']:
                    phase_group = 'RS'
                elif game['Phase'] in ['8F', '4F']:
                    phase_group = 'Playoffs'
                else:
                    phase_group = game['Phase']

                if current_phase_group != phase_group:
                    current_phase_group = phase_group
                    wins = 0
                    losses = 0

                if game['local.club.name'] == team:
                    location = 'Home'
                    team_score = game['local.score']
                    opponent_score = game['road.score']
                    opponent = game['road.club.name']
                    team_code = game['local.club.code']
                    team_image = game['local.club.images.crest']
                    opponent_code = game['road.club.code']
                    opponent_image = game['road.club.images.crest']
                else:
                    location = 'Away'
                    team_score = game['road.score']
                    opponent_score = game['local.score']
                    opponent = game['local.club.name']
                    team_code = game['road.club.code']
                    team_image = game['road.club.images.crest']
                    opponent_code = game['local.club.code']
                    opponent_image = game['local.club.images.crest']

                if team_score > opponent_score:
                    result = 'Win'
                    wins += 1
                elif team_score < opponent_score:
                    result = 'Loss'
                    losses += 1
                else:
                    result = 'Draw'

                record = f"{wins}-{losses}"

                all_team_records.append({
                    'Team': team,
                    'TeamCode': team_code,
                    'TeamImage': team_image,
                    'Date': game['localDate'],
                    'Opponent': opponent,
                    'OpponentCode': opponent_code,
                    'OpponentImage': opponent_image,
                    'Round': game['Round'],
                    'Result': result,
                    'Location': location,
                    'Record': record,
                    'Team_Score': team_score,
                    'Opponent_Score': opponent_score,
                    'Gamecode': game['Gamecode'],
                    'Season': game['Season'],
                    'Phase': game['Phase'],
                    'PhaseGroup': phase_group
                })

    team_records_df = pd.DataFrame(all_team_records)
    team_records_df = team_records_df.sort_values(['Team', 'Season', 'PhaseGroup', 'Round', 'Date'])

    return team_records_df

def insert_schedule_results_to_db(team_records_df, competition):
    """
    Insert schedule results data into the database
    """
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    table_name = f"schedule_results_{competition}"

    try:
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id SERIAL PRIMARY KEY,
                team TEXT,
                teamcode TEXT,
                teamlogo TEXT,
                game_date TEXT,
                opponent TEXT,
                opponentcode TEXT,
                opponentlogo TEXT,
                round INTEGER,
                result TEXT,
                location TEXT,
                record TEXT,
                team_score INTEGER,
                opponent_score INTEGER,
                gamecode TEXT,
                season INTEGER,
                phase TEXT,
                UNIQUE(team, gamecode, season)
            );
        """)
        conn.commit()

        seasons_to_process = list(team_records_df['Season'].unique())
        if seasons_to_process:
            seasons_str = ','.join(map(str, seasons_to_process))
            cursor.execute(f"DELETE FROM {table_name} WHERE season IN ({seasons_str})")
            deleted_count = cursor.rowcount
            conn.commit()
            print(f"Deleted {deleted_count} existing records for seasons: {seasons_to_process}")

        def safe_int(val):
            if pd.isna(val):
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        data_tuples = []
        for _, row in team_records_df.iterrows():
            data_tuples.append((
                row["Team"],
                row["TeamCode"],
                row["TeamImage"],
                row["Date"],
                row["Opponent"],
                row["OpponentCode"],
                row["OpponentImage"],
                safe_int(row["Round"]),
                row["Result"],
                row["Location"],
                row["Record"],
                safe_int(row["Team_Score"]),
                safe_int(row["Opponent_Score"]),
                row["Gamecode"],
                safe_int(row["Season"]),
                row["Phase"]
            ))

        insert_query = f"""
            INSERT INTO {table_name} (
                team, teamcode, teamlogo, game_date, opponent, opponentcode, opponentlogo,
                round, result, location, record, team_score, opponent_score, gamecode, season, phase
            )
            VALUES %s
            ON CONFLICT (team, gamecode, season) DO UPDATE SET
                teamcode = EXCLUDED.teamcode,
                teamlogo = EXCLUDED.teamlogo,
                game_date = EXCLUDED.game_date,
                opponent = EXCLUDED.opponent,
                opponentcode = EXCLUDED.opponentcode,
                opponentlogo = EXCLUDED.opponentlogo,
                round = EXCLUDED.round,
                result = EXCLUDED.result,
                location = EXCLUDED.location,
                record = EXCLUDED.record,
                team_score = EXCLUDED.team_score,
                opponent_score = EXCLUDED.opponent_score,
                phase = EXCLUDED.phase;
        """

        execute_values(cursor, insert_query, data_tuples)
        conn.commit()

        print(f"Successfully inserted schedule results for {competition}")

    except Exception as e:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def create_cumulative_standings(team_records_df, competition='euroleague'):
    """
    Create cumulative standings for each season (RS phase only)
    """
    standings_data = []

    rs_data = team_records_df[team_records_df['Phase'] == 'RS'].copy()

    for (season, team), group in rs_data.groupby(['Season', 'Team']):
        group = group.sort_values(['Date'])

        team_code = group['TeamCode'].iloc[0]
        team_logo = group['TeamImage'].iloc[0]

        wins = (group['Result'] == 'Win').sum()
        losses = (group['Result'] == 'Loss').sum()
        total_games = wins + losses
        win_percentage = wins / total_games if total_games > 0 else 0.0

        total_diff = (group['Team_Score'] - group['Opponent_Score']).sum()

        home_games = group[group['Location'] == 'Home']
        home_wins = (home_games['Result'] == 'Win').sum()
        home_losses = (home_games['Result'] == 'Loss').sum()
        home_record = f"{home_wins}-{home_losses}"

        away_games = group[group['Location'] == 'Away']
        away_wins = (away_games['Result'] == 'Win').sum()
        away_losses = (away_games['Result'] == 'Loss').sum()
        away_record = f"{away_wins}-{away_losses}"

        last_10_games = group.tail(10)
        l10_wins = (last_10_games['Result'] == 'Win').sum()
        l10_losses = (last_10_games['Result'] == 'Loss').sum()
        l10_record = f"{l10_wins}-{l10_losses}"

        streak = calculate_streak(group)

        standings_data.append({
            'Season': season,
            'Phase': 'RS',
            'TeamCode': team_code,
            'Team': team,
            'TeamLogo': team_logo,
            'W': wins,
            'L': losses,
            'WinPercentage': round(win_percentage, 3),
            'Diff': total_diff,
            'Home': home_record,
            'Away': away_record,
            'L10': l10_record,
            'Streak': streak
        })

    standings_df = pd.DataFrame(standings_data)

    standings_with_position = []
    for season, group in standings_df.groupby('Season'):
        group_sorted = group.sort_values(['W', 'Diff'], ascending=[False, False])
        group_sorted['Position'] = range(1, len(group_sorted) + 1)
        standings_with_position.append(group_sorted)

    final_standings_df = pd.concat(standings_with_position, ignore_index=True)

    return final_standings_df

def calculate_streak(games_df):
    """
    Calculate the current win/loss streak for a team
    """
    if len(games_df) == 0:
        return "0"

    recent_results = games_df['Result'].values

    if len(recent_results) == 0:
        return "0"

    current_result = recent_results[-1]
    streak_count = 1

    for i in range(len(recent_results) - 2, -1, -1):
        if recent_results[i] == current_result:
            streak_count += 1
        else:
            break

    if current_result == 'Win':
        return f"W{streak_count}"
    elif current_result == 'Loss':
        return f"L{streak_count}"
    else:
        return "0"

def insert_cumulative_standings_to_db(standings_df, competition):
    """
    Insert the cumulative standings data into the database
    """
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    table_name = f"cumulative_standings_{competition}"

    try:
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id SERIAL PRIMARY KEY,
                season INTEGER,
                phase TEXT,
                position INTEGER,
                teamcode TEXT,
                name TEXT,
                teamlogo TEXT,
                w INTEGER,
                l INTEGER,
                win_percent REAL,
                diff INTEGER,
                home TEXT,
                away TEXT,
                l10 TEXT,
                streak TEXT,
                UNIQUE(season, phase, teamcode)
            );
        """)
        conn.commit()

        seasons_to_process = list(standings_df['Season'].unique())
        if seasons_to_process:
            seasons_str = ','.join(map(str, seasons_to_process))
            cursor.execute(f"DELETE FROM {table_name} WHERE season IN ({seasons_str})")
            deleted_count = cursor.rowcount
            conn.commit()
            print(f"Deleted {deleted_count} existing records for seasons: {seasons_to_process}")

        def safe_int(val):
            if pd.isna(val):
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        def safe_float(val):
            if pd.isna(val):
                return None
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        data_tuples = []
        for _, row in standings_df.iterrows():
            data_tuples.append((
                safe_int(row["Season"]),
                row["Phase"],
                safe_int(row["Position"]),
                row["TeamCode"],
                row["Team"],
                row["TeamLogo"],
                safe_int(row["W"]),
                safe_int(row["L"]),
                safe_float(row["WinPercentage"]),
                safe_int(row["Diff"]),
                row["Home"],
                row["Away"],
                row["L10"],
                row["Streak"]
            ))

        insert_query = f"""
            INSERT INTO {table_name} (
                season, phase, position, teamcode, name, teamlogo,
                w, l, win_percent, diff, home, away, l10, streak
            )
            VALUES %s
            ON CONFLICT (season, phase, teamcode) DO UPDATE SET
                position = EXCLUDED.position,
                name = EXCLUDED.name,
                teamlogo = EXCLUDED.teamlogo,
                w = EXCLUDED.w,
                l = EXCLUDED.l,
                win_percent = EXCLUDED.win_percent,
                diff = EXCLUDED.diff,
                home = EXCLUDED.home,
                away = EXCLUDED.away,
                l10 = EXCLUDED.l10,
                streak = EXCLUDED.streak;
        """

        execute_values(cursor, insert_query, data_tuples)
        conn.commit()

        print(f"Successfully inserted cumulative standings for {competition}")

    except Exception as e:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def get_team_logos_from_schedule(competition):
    """
    Get team logos from the schedule_results table
    """
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    try:
        cursor.execute(f"""
            SELECT DISTINCT season, team as teamname, teamcode, teamlogo
            FROM schedule_results_{competition}
            ORDER BY season DESC
        """)
        results = cursor.fetchall()

        team_logos = {}
        for season, teamname, teamcode, teamlogo in results:
            key = (season, teamcode)
            team_logos[key] = {
                'teamname': teamname,
                'teamlogo': teamlogo
            }

        return team_logos
    finally:
        cursor.close()
        conn.close()

def calculate_advanced_team_stats_with_logos(boxscore_data, competition):
    """
    Calculate advanced team stats directly from API data and store in database with logos
    """
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"

    # Connection retry logic
    max_retries = 3
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(
                conn_str,
                connect_timeout=30,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=5
            )
            conn.autocommit = False
            cursor = conn.cursor()
            break
        except Exception as e:
            print(f"Connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                import time
                time.sleep(retry_delay)
            else:
                raise Exception(f"Failed to connect after {max_retries} attempts")

    try:
        print(f"=== CALCULATING ADVANCED TEAM STATS FOR {competition.upper()} ===")

        team_logos = get_team_logos_from_schedule(competition)
        print(f"Retrieved logos for {len(team_logos)} team/season combinations")

        df = boxscore_data.copy()
        print(f"Raw API data has {len(df)} rows")

        team_games = df[df['Player_ID'] == 'Total'].copy()
        print(f"Found {len(team_games)} team game records")

        if len(team_games) == 0:
            print(f"No team game data found for {competition}!")
            return

        team_games_with_opponents = []
        for idx, team_row in team_games.iterrows():
            opponent_row = df[
                (df['Gamecode'] == team_row['Gamecode']) &
                (df['Season'] == team_row['Season']) &
                (df['Player_ID'] == 'Total') &
                (df['Team'] != team_row['Team'])
            ]

            if len(opponent_row) > 0:
                opp = opponent_row.iloc[0]
                combined_row = team_row.copy()

                combined_row['opp_fgm'] = (opp['FieldGoalsMade2'] or 0) + (opp['FieldGoalsMade3'] or 0)
                combined_row['opp_fga'] = (opp['FieldGoalsAttempted2'] or 0) + (opp['FieldGoalsAttempted3'] or 0)
                combined_row['opp_3pm'] = opp['FieldGoalsMade3'] or 0
                combined_row['opp_3pa'] = opp['FieldGoalsAttempted3'] or 0
                combined_row['opp_oreb'] = opp['OffensiveRebounds'] or 0
                combined_row['opp_dreb'] = opp['DefensiveRebounds'] or 0
                combined_row['opp_treb'] = opp['TotalRebounds'] or 0
                combined_row['opp_to'] = opp['Turnovers'] or 0
                combined_row['opp_ftm'] = opp['FreeThrowsMade'] or 0
                combined_row['opp_fta'] = opp['FreeThrowsAttempted'] or 0
                combined_row['opp_points'] = opp['Points'] or 0
                combined_row['opp_ast'] = opp['Assistances'] or 0
                combined_row['opp_stl'] = opp['Steals'] or 0
                combined_row['opp_blk'] = opp['BlocksFavour'] or 0
                combined_row['opp_pf'] = opp['FoulsCommited'] or 0
                combined_row['opponent_team'] = opp['Team']

                team_games_with_opponents.append(combined_row)

        df_with_opponents = pd.DataFrame(team_games_with_opponents)
        print(f"Successfully matched {len(df_with_opponents)} games with opponent data")

        def calculate_team_advanced_stats(team_games):
            if len(team_games) == 0:
                return None

            def safe_numeric(series, default=0):
                return pd.to_numeric(series, errors='coerce').fillna(default)

            numeric_cols = [
                'Points', 'FieldGoalsMade2', 'FieldGoalsAttempted2', 'FieldGoalsMade3', 'FieldGoalsAttempted3',
                'FreeThrowsMade', 'FreeThrowsAttempted', 'OffensiveRebounds', 'DefensiveRebounds', 'TotalRebounds',
                'Assistances', 'Steals', 'Turnovers', 'BlocksFavour', 'opp_fgm', 'opp_fga', 'opp_3pm', 'opp_3pa',
                'opp_oreb', 'opp_dreb', 'opp_to', 'opp_ftm', 'opp_fta', 'opp_points', 'opp_ast', 'opp_stl', 'opp_blk'
            ]

            for col in numeric_cols:
                if col in team_games.columns:
                    team_games[col] = safe_numeric(team_games[col])

            games_played = len(team_games)

            points = team_games['Points'].sum()
            fgm2 = team_games['FieldGoalsMade2'].sum()
            fga2 = team_games['FieldGoalsAttempted2'].sum()
            fgm3 = team_games['FieldGoalsMade3'].sum()
            fga3 = team_games['FieldGoalsAttempted3'].sum()
            fgm = fgm2 + fgm3
            fga = fga2 + fga3
            ftm = team_games['FreeThrowsMade'].sum()
            fta = team_games['FreeThrowsAttempted'].sum()
            oreb = team_games['OffensiveRebounds'].sum()
            dreb = team_games['DefensiveRebounds'].sum()
            ast = team_games['Assistances'].sum()
            stl = team_games['Steals'].sum()
            to = team_games['Turnovers'].sum()
            blk = team_games['BlocksFavour'].sum()

            opp_points = team_games['opp_points'].sum()
            opp_fgm = team_games['opp_fgm'].sum()
            opp_fga = team_games['opp_fga'].sum()
            opp_3pm = team_games['opp_3pm'].sum()
            opp_3pa = team_games['opp_3pa'].sum()
            opp_ftm = team_games['opp_ftm'].sum()
            opp_fta = team_games['opp_fta'].sum()
            opp_oreb = team_games['opp_oreb'].sum()
            opp_dreb = team_games['opp_dreb'].sum()
            opp_to = team_games['opp_to'].sum()
            opp_ast = team_games['opp_ast'].sum()
            opp_stl = team_games['opp_stl'].sum()
            opp_blk = team_games['opp_blk'].sum()

            team_poss = fga + 0.4 * fta - 1.07 * (oreb / max(1, oreb + opp_dreb)) * (fga - fgm) + to
            opp_poss = opp_fga + 0.4 * opp_fta - 1.07 * (opp_oreb / max(1, opp_oreb + dreb)) * (opp_fga - opp_fgm) + opp_to

            avg_total_poss = (team_poss + opp_poss) / games_played if games_played > 0 else 0
            pace = (200 / 202.2) * avg_total_poss / 2 if avg_total_poss > 0 else 0
            efficiency_o = (points / team_poss) * 100 if team_poss > 0 else 0
            efficiency_d = (opp_points / opp_poss) * 100 if opp_poss > 0 else 0
            net_rating = efficiency_o - efficiency_d

            efgperc_o = ((fgm + 0.5 * fgm3) / fga) * 100 if fga > 0 else 0
            toratio_o = (to / (fga + to + 0.44 * fta)) * 100 if (fga + to + 0.44 * fta) > 0 else 0
            orebperc_o = (oreb / (oreb + opp_dreb)) * 100 if (oreb + opp_dreb) > 0 else 0
            ftrate_o = (fta / fga) * 100 if fga > 0 else 0

            efgperc_d = ((opp_fgm + 0.5 * opp_3pm) / opp_fga) * 100 if opp_fga > 0 else 0
            toratio_d = (opp_to / (opp_fga + opp_to + 0.44 * opp_fta)) * 100 if (opp_fga + opp_to + 0.44 * opp_fta) > 0 else 0
            orebperc_d = (opp_oreb / (opp_oreb + dreb)) * 100 if (opp_oreb + dreb) > 0 else 0
            ftrate_d = (opp_fta / opp_fga) * 100 if opp_fga > 0 else 0

            threeperc_o = (fgm3 / fga3) * 100 if fga3 > 0 else 0
            threeperc_d = (opp_3pm / opp_3pa) * 100 if opp_3pa > 0 else 0
            twoperc_o = (fgm2 / fga2) * 100 if fga2 > 0 else 0
            twoperc_d = ((opp_fgm - opp_3pm) / (opp_fga - opp_3pa)) * 100 if (opp_fga - opp_3pa) > 0 else 0
            ftperc_o = (ftm / fta) * 100 if fta > 0 else 0
            ftperc_d = (opp_ftm / opp_fta) * 100 if opp_fta > 0 else 0

            threeattmprate_o = (fga3 / fga) * 100 if fga > 0 else 0
            threeattmprate_d = (opp_3pa / opp_fga) * 100 if opp_fga > 0 else 0
            assistperc_o = (ast / fgm) * 100 if fgm > 0 else 0
            assistperc_d = (opp_ast / opp_fgm) * 100 if opp_fgm > 0 else 0
            stealperc_o = (stl / opp_poss) * 100 if opp_poss > 0 else 0
            stealperc_d = (opp_stl / team_poss) * 100 if team_poss > 0 else 0
            blockperc_o = (opp_blk / fga2) * 100 if fga2 > 0 else 0
            blockperc_d = (blk / (opp_fga - opp_3pa)) * 100 if (opp_fga - opp_3pa) > 0 else 0

            points2perc_o = ((fgm2 * 2) / points) * 100 if points > 0 else 0
            points2perc_d = (((opp_fgm - opp_3pm) * 2) / opp_points) * 100 if opp_points > 0 else 0
            points3perc_o = ((fgm3 * 3) / points) * 100 if points > 0 else 0
            points3perc_d = ((opp_3pm * 3) / opp_points) * 100 if opp_points > 0 else 0
            pointsftperc_o = (ftm / points) * 100 if points > 0 else 0
            pointsftperc_d = (opp_ftm / opp_points) * 100 if opp_points > 0 else 0

            return {
                'games_played': games_played,
                'pace': pace,
                'efficiency_o': efficiency_o,
                'efficiency_d': efficiency_d,
                'net_rating': net_rating,
                'efgperc_o': efgperc_o,
                'toratio_o': toratio_o,
                'orebperc_o': orebperc_o,
                'ftrate_o': ftrate_o,
                'efgperc_d': efgperc_d,
                'toratio_d': toratio_d,
                'orebperc_d': orebperc_d,
                'ftrate_d': ftrate_d,
                'threeperc_o': threeperc_o,
                'twoperc_o': twoperc_o,
                'ftperc_o': ftperc_o,
                'threeperc_d': threeperc_d,
                'twoperc_d': twoperc_d,
                'ftperc_d': ftperc_d,
                'threeattmprate_o': threeattmprate_o,
                'assistperc_o': assistperc_o,
                'stealperc_o': stealperc_o,
                'blockperc_o': blockperc_o,
                'threeattmprate_d': threeattmprate_d,
                'assistperc_d': assistperc_d,
                'stealperc_d': stealperc_d,
                'blockperc_d': blockperc_d,
                'points2perc_o': points2perc_o,
                'points3perc_o': points3perc_o,
                'pointsftperc_o': pointsftperc_o,
                'points2perc_d': points2perc_d,
                'points3perc_d': points3perc_d,
                'pointsftperc_d': pointsftperc_d,
            }

        if competition == 'euroleague':
            def map_euroleague_phase(phase):
                if phase in ['RS','TS']:
                    return 'RS'
                elif phase in ['PI', 'PO', 'FF']:
                    return 'Playoffs'
                else:
                    return phase
            df_with_opponents['Phase'] = df_with_opponents['Phase'].apply(map_euroleague_phase)
        elif competition == 'eurocup':
            def map_eurocup_phase(phase):
                if phase in ['RS','TS']:
                    return 'RS'
                elif phase in ['2F', '4F', '8F', 'Final']:
                    return 'Playoffs'
                else:
                    return phase
            df_with_opponents['Phase'] = df_with_opponents['Phase'].apply(map_eurocup_phase)

        league_stats_list = []
        for (season, phase), group in df_with_opponents.groupby(['Season', 'Phase']):
            print(f"Processing League Averages - {season} - {phase} ({len(group)} games)")
            league_stats = calculate_team_advanced_stats(group)
            if league_stats:
                league_stats_list.append({
                    'season': season,
                    'phase': phase,
                    'teamcode': 'League',
                    'teamname': 'League Averages',
                    'teamlogo': '',
                    **league_stats
                })

        team_stats_list = []
        for (season, phase, team), group in df_with_opponents.groupby(['Season', 'Phase', 'Team']):
            print(f"Processing {team} - {season} - {phase} ({len(group)} games)")
            stats = calculate_team_advanced_stats(group)
            if stats:
                team_info = team_logos.get((season, team), {})
                teamname = team_info.get('teamname', team)
                teamlogo = team_info.get('teamlogo', '')

                team_stats_list.append({
                    'season': season,
                    'phase': phase,
                    'teamcode': team,
                    'teamname': teamname,
                    'teamlogo': teamlogo,
                    **stats
                })

        all_stats_list = team_stats_list + league_stats_list
        print(f"Calculated stats for {len(team_stats_list)} team/season/phase combinations")
        print(f"Calculated league averages for {len(league_stats_list)} season/phase combinations")

        print(f"Calculating rankings for {competition}...")
        stats_to_rank = [
            ('pace', False), ('efficiency_o', False), ('efficiency_d', True), ('net_rating', False),
            ('efgperc_o', False), ('efgperc_d', True), ('toratio_o', True), ('toratio_d', False),
            ('orebperc_o', False), ('orebperc_d', True), ('ftrate_o', False), ('ftrate_d', True),
            ('threeperc_o', False), ('threeperc_d', True), ('twoperc_o', False), ('twoperc_d', True),
            ('ftperc_o', False), ('ftperc_d', True), ('threeattmprate_o', False), ('threeattmprate_d', True),
            ('assistperc_o', False), ('assistperc_d', True), ('stealperc_o', False), ('stealperc_d', False),
            ('blockperc_o', False), ('blockperc_d', False), ('points2perc_o', False), ('points2perc_d', True),
            ('points3perc_o', False), ('points3perc_d', True), ('pointsftperc_o', False), ('pointsftperc_d', True)
        ]

        stats_df = pd.DataFrame(all_stats_list)

        for (season, phase), group in stats_df.groupby(['season', 'phase']):
            team_only_group = group[group['teamcode'] != 'League']
            for stat, ascending in stats_to_rank:
                if stat in team_only_group.columns:
                    ranks = team_only_group[stat].rank(method='min', ascending=ascending)
                    team_mask = (stats_df['season'] == season) & (stats_df['phase'] == phase) & (stats_df['teamcode'] != 'League')
                    stats_df.loc[team_mask, f'rank_{stat}'] = ranks
                    league_mask = (stats_df['season'] == season) & (stats_df['phase'] == phase) & (stats_df['teamcode'] == 'League')
                    stats_df.loc[league_mask, f'rank_{stat}'] = None

        team_stats_list = stats_df.to_dict('records')

        table_name = f"team_advanced_stats_{competition}"
        print(f"Creating/updating {table_name} table...")

        try:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id SERIAL PRIMARY KEY,
                    season INTEGER NOT NULL,
                    phase VARCHAR(10) NOT NULL,
                    teamcode VARCHAR(10) NOT NULL,
                    teamname VARCHAR(100) NOT NULL,
                    teamlogo TEXT,
                    games_played INTEGER DEFAULT 0,
                    pace DECIMAL(6,2) DEFAULT 0,
                    efficiency_o DECIMAL(6,2) DEFAULT 0,
                    efficiency_d DECIMAL(6,2) DEFAULT 0,
                    net_rating DECIMAL(6,2) DEFAULT 0,
                    efgperc_o DECIMAL(5,2) DEFAULT 0,
                    toratio_o DECIMAL(5,2) DEFAULT 0,
                    orebperc_o DECIMAL(5,2) DEFAULT 0,
                    ftrate_o DECIMAL(5,2) DEFAULT 0,
                    efgperc_d DECIMAL(5,2) DEFAULT 0,
                    toratio_d DECIMAL(5,2) DEFAULT 0,
                    orebperc_d DECIMAL(5,2) DEFAULT 0,
                    ftrate_d DECIMAL(5,2) DEFAULT 0,
                    threeperc_o DECIMAL(5,2) DEFAULT 0,
                    twoperc_o DECIMAL(5,2) DEFAULT 0,
                    ftperc_o DECIMAL(5,2) DEFAULT 0,
                    threeperc_d DECIMAL(5,2) DEFAULT 0,
                    twoperc_d DECIMAL(5,2) DEFAULT 0,
                    ftperc_d DECIMAL(5,2) DEFAULT 0,
                    threeattmprate_o DECIMAL(5,2) DEFAULT 0,
                    assistperc_o DECIMAL(5,2) DEFAULT 0,
                    stealperc_o DECIMAL(5,2) DEFAULT 0,
                    blockperc_o DECIMAL(5,2) DEFAULT 0,
                    threeattmprate_d DECIMAL(5,2) DEFAULT 0,
                    assistperc_d DECIMAL(5,2) DEFAULT 0,
                    stealperc_d DECIMAL(5,2) DEFAULT 0,
                    blockperc_d DECIMAL(5,2) DEFAULT 0,
                    points2perc_o DECIMAL(5,2) DEFAULT 0,
                    points3perc_o DECIMAL(5,2) DEFAULT 0,
                    pointsftperc_o DECIMAL(5,2) DEFAULT 0,
                    points2perc_d DECIMAL(5,2) DEFAULT 0,
                    points3perc_d DECIMAL(5,2) DEFAULT 0,
                    pointsftperc_d DECIMAL(5,2) DEFAULT 0,
                    rank_pace INTEGER DEFAULT 0,
                    rank_efficiency_o INTEGER DEFAULT 0,
                    rank_efficiency_d INTEGER DEFAULT 0,
                    rank_net_rating INTEGER DEFAULT 0,
                    rank_efgperc_o INTEGER DEFAULT 0,
                    rank_efgperc_d INTEGER DEFAULT 0,
                    rank_toratio_o INTEGER DEFAULT 0,
                    rank_toratio_d INTEGER DEFAULT 0,
                    rank_orebperc_o INTEGER DEFAULT 0,
                    rank_orebperc_d INTEGER DEFAULT 0,
                    rank_ftrate_o INTEGER DEFAULT 0,
                    rank_ftrate_d INTEGER DEFAULT 0,
                    rank_threeperc_o INTEGER DEFAULT 0,
                    rank_threeperc_d INTEGER DEFAULT 0,
                    rank_twoperc_o INTEGER DEFAULT 0,
                    rank_twoperc_d INTEGER DEFAULT 0,
                    rank_ftperc_o INTEGER DEFAULT 0,
                    rank_ftperc_d INTEGER DEFAULT 0,
                    rank_threeattmprate_o INTEGER DEFAULT 0,
                    rank_threeattmprate_d INTEGER DEFAULT 0,
                    rank_assistperc_o INTEGER DEFAULT 0,
                    rank_stealperc_o INTEGER DEFAULT 0,
                    rank_blockperc_o INTEGER DEFAULT 0,
                    rank_assistperc_d INTEGER DEFAULT 0,
                    rank_stealperc_d INTEGER DEFAULT 0,
                    rank_blockperc_d INTEGER DEFAULT 0,
                    rank_points2perc_o INTEGER DEFAULT 0,
                    rank_points2perc_d INTEGER DEFAULT 0,
                    rank_points3perc_o INTEGER DEFAULT 0,
                    rank_points3perc_d INTEGER DEFAULT 0,
                    rank_pointsftperc_o INTEGER DEFAULT 0,
                    rank_pointsftperc_d INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(season, phase, teamcode)
                );
            """)
            conn.commit()
            print(f"Ensured {table_name} table exists")

            seasons_to_process = list(df_with_opponents['Season'].unique())
            if seasons_to_process:
                seasons_str = ','.join(map(str, seasons_to_process))
                cursor.execute(f"DELETE FROM {table_name} WHERE season IN ({seasons_str})")
                deleted_count = cursor.rowcount
                conn.commit()
                print(f"Deleted {deleted_count} existing records for seasons: {seasons_to_process}")

            index_queries = [
                f"CREATE INDEX IF NOT EXISTS idx_{table_name}_season_phase ON {table_name}(season, phase);",
                f"CREATE INDEX IF NOT EXISTS idx_{table_name}_teamcode ON {table_name}(teamcode);",
                f"CREATE INDEX IF NOT EXISTS idx_{table_name}_lookup ON {table_name}(season, phase, teamcode);"
            ]
            for idx_query in index_queries:
                try:
                    cursor.execute(idx_query)
                    conn.commit()
                except Exception as e:
                    print(f"Warning: Could not create index: {e}")
                    conn.rollback()

        except Exception as e:
            print(f"Error setting up table: {e}")
            conn.rollback()
            raise

        print(f"Inserting calculated data into {table_name}...")

        def safe_value(val, default=0):
            if pd.isna(val) or val is None:
                return default
            return float(val)

        batch_size = 100
        total_inserted = 0

        for i in range(0, len(team_stats_list), batch_size):
            batch = team_stats_list[i:i + batch_size]
            data_tuples = []

            for stats in batch:
                data_tuples.append((
                    int(stats['season']),
                    str(stats['phase']),
                    str(stats['teamcode']),
                    str(stats['teamname']),
                    str(stats.get('teamlogo', '')),
                    int(stats['games_played']),
                    safe_value(stats['pace']),
                    safe_value(stats['efficiency_o']),
                    safe_value(stats['efficiency_d']),
                    safe_value(stats['net_rating']),
                    safe_value(stats['efgperc_o']),
                    safe_value(stats['toratio_o']),
                    safe_value(stats['orebperc_o']),
                    safe_value(stats['ftrate_o']),
                    safe_value(stats['efgperc_d']),
                    safe_value(stats['toratio_d']),
                    safe_value(stats['orebperc_d']),
                    safe_value(stats['ftrate_d']),
                    safe_value(stats['threeperc_o']),
                    safe_value(stats['twoperc_o']),
                    safe_value(stats['ftperc_o']),
                    safe_value(stats['threeperc_d']),
                    safe_value(stats['twoperc_d']),
                    safe_value(stats['ftperc_d']),
                    safe_value(stats['threeattmprate_o']),
                    safe_value(stats['assistperc_o']),
                    safe_value(stats['stealperc_o']),
                    safe_value(stats['blockperc_o']),
                    safe_value(stats['threeattmprate_d']),
                    safe_value(stats['assistperc_d']),
                    safe_value(stats['stealperc_d']),
                    safe_value(stats['blockperc_d']),
                    safe_value(stats['points2perc_o']),
                    safe_value(stats['points3perc_o']),
                    safe_value(stats['pointsftperc_o']),
                    safe_value(stats['points2perc_d']),
                    safe_value(stats['points3perc_d']),
                    safe_value(stats['pointsftperc_d']),
                    int(safe_value(stats.get('rank_pace', 0))),
                    int(safe_value(stats.get('rank_efficiency_o', 0))),
                    int(safe_value(stats.get('rank_efficiency_d', 0))),
                    int(safe_value(stats.get('rank_net_rating', 0))),
                    int(safe_value(stats.get('rank_efgperc_o', 0))),
                    int(safe_value(stats.get('rank_efgperc_d', 0))),
                    int(safe_value(stats.get('rank_toratio_o', 0))),
                    int(safe_value(stats.get('rank_toratio_d', 0))),
                    int(safe_value(stats.get('rank_orebperc_o', 0))),
                    int(safe_value(stats.get('rank_orebperc_d', 0))),
                    int(safe_value(stats.get('rank_ftrate_o', 0))),
                    int(safe_value(stats.get('rank_ftrate_d', 0))),
                    int(safe_value(stats.get('rank_threeperc_o', 0))),
                    int(safe_value(stats.get('rank_threeperc_d', 0))),
                    int(safe_value(stats.get('rank_twoperc_o', 0))),
                    int(safe_value(stats.get('rank_twoperc_d', 0))),
                    int(safe_value(stats.get('rank_ftperc_o', 0))),
                    int(safe_value(stats.get('rank_ftperc_d', 0))),
                    int(safe_value(stats.get('rank_threeattmprate_o', 0))),
                    int(safe_value(stats.get('rank_threeattmprate_d', 0))),
                    int(safe_value(stats.get('rank_assistperc_o', 0))),
                    int(safe_value(stats.get('rank_stealperc_o', 0))),
                    int(safe_value(stats.get('rank_blockperc_o', 0))),
                    int(safe_value(stats.get('rank_assistperc_d', 0))),
                    int(safe_value(stats.get('rank_stealperc_d', 0))),
                    int(safe_value(stats.get('rank_blockperc_d', 0))),
                    int(safe_value(stats.get('rank_points2perc_o', 0))),
                    int(safe_value(stats.get('rank_points2perc_d', 0))),
                    int(safe_value(stats.get('rank_points3perc_o', 0))),
                    int(safe_value(stats.get('rank_points3perc_d', 0))),
                    int(safe_value(stats.get('rank_pointsftperc_o', 0))),
                    int(safe_value(stats.get('rank_pointsftperc_d', 0))),
                ))

            insert_query = f"""
                INSERT INTO {table_name} (
                    season, phase, teamcode, teamname, teamlogo, games_played,
                    pace, efficiency_o, efficiency_d, net_rating,
                    efgperc_o, toratio_o, orebperc_o, ftrate_o,
                    efgperc_d, toratio_d, orebperc_d, ftrate_d,
                    threeperc_o, twoperc_o, ftperc_o,
                    threeperc_d, twoperc_d, ftperc_d,
                    threeattmprate_o, assistperc_o, stealperc_o, blockperc_o,
                    threeattmprate_d, assistperc_d, stealperc_d, blockperc_d,
                    points2perc_o, points3perc_o, pointsftperc_o,
                    points2perc_d, points3perc_d, pointsftperc_d,
                    rank_pace, rank_efficiency_o, rank_efficiency_d, rank_net_rating,
                    rank_efgperc_o, rank_efgperc_d, rank_toratio_o, rank_toratio_d,
                    rank_orebperc_o, rank_orebperc_d, rank_ftrate_o, rank_ftrate_d,
                    rank_threeperc_o, rank_threeperc_d, rank_twoperc_o, rank_twoperc_d,
                    rank_ftperc_o, rank_ftperc_d, rank_threeattmprate_o, rank_threeattmprate_d,
                    rank_assistperc_o, rank_stealperc_o, rank_blockperc_o,
                    rank_assistperc_d, rank_stealperc_d, rank_blockperc_d,
                    rank_points2perc_o, rank_points2perc_d, rank_points3perc_o, rank_points3perc_d,
                    rank_pointsftperc_o, rank_pointsftperc_d
                )
                VALUES %s
                ON CONFLICT (season, phase, teamcode) DO UPDATE SET
                    teamname = EXCLUDED.teamname,
                    teamlogo = EXCLUDED.teamlogo,
                    games_played = EXCLUDED.games_played,
                    pace = EXCLUDED.pace,
                    efficiency_o = EXCLUDED.efficiency_o,
                    efficiency_d = EXCLUDED.efficiency_d,
                    net_rating = EXCLUDED.net_rating,
                    efgperc_o = EXCLUDED.efgperc_o,
                    toratio_o = EXCLUDED.toratio_o,
                    orebperc_o = EXCLUDED.orebperc_o,
                    ftrate_o = EXCLUDED.ftrate_o,
                    efgperc_d = EXCLUDED.efgperc_d,
                    toratio_d = EXCLUDED.toratio_d,
                    orebperc_d = EXCLUDED.orebperc_d,
                    ftrate_d = EXCLUDED.ftrate_d,
                    threeperc_o = EXCLUDED.threeperc_o,
                    twoperc_o = EXCLUDED.twoperc_o,
                    ftperc_o = EXCLUDED.ftperc_o,
                    threeperc_d = EXCLUDED.threeperc_d,
                    twoperc_d = EXCLUDED.twoperc_d,
                    ftperc_d = EXCLUDED.ftperc_d,
                    threeattmprate_o = EXCLUDED.threeattmprate_o,
                    assistperc_o = EXCLUDED.assistperc_o,
                    stealperc_o = EXCLUDED.stealperc_o,
                    blockperc_o = EXCLUDED.blockperc_o,
                    threeattmprate_d = EXCLUDED.threeattmprate_d,
                    assistperc_d = EXCLUDED.assistperc_d,
                    stealperc_d = EXCLUDED.stealperc_d,
                    blockperc_d = EXCLUDED.blockperc_d,
                    points2perc_o = EXCLUDED.points2perc_o,
                    points3perc_o = EXCLUDED.points3perc_o,
                    pointsftperc_o = EXCLUDED.pointsftperc_o,
                    points2perc_d = EXCLUDED.points2perc_d,
                    points3perc_d = EXCLUDED.points3perc_d,
                    pointsftperc_d = EXCLUDED.pointsftperc_d,
                    rank_pace = EXCLUDED.rank_pace,
                    rank_efficiency_o = EXCLUDED.rank_efficiency_o,
                    rank_efficiency_d = EXCLUDED.rank_efficiency_d,
                    rank_net_rating = EXCLUDED.rank_net_rating,
                    rank_efgperc_o = EXCLUDED.rank_efgperc_o,
                    rank_efgperc_d = EXCLUDED.rank_efgperc_d,
                    rank_toratio_o = EXCLUDED.rank_toratio_o,
                    rank_toratio_d = EXCLUDED.rank_toratio_d,
                    rank_orebperc_o = EXCLUDED.rank_orebperc_o,
                    rank_orebperc_d = EXCLUDED.rank_orebperc_d,
                    rank_ftrate_o = EXCLUDED.rank_ftrate_o,
                    rank_ftrate_d = EXCLUDED.rank_ftrate_d,
                    rank_threeperc_o = EXCLUDED.rank_threeperc_o,
                    rank_threeperc_d = EXCLUDED.rank_threeperc_d,
                    rank_twoperc_o = EXCLUDED.rank_twoperc_o,
                    rank_twoperc_d = EXCLUDED.rank_twoperc_d,
                    rank_ftperc_o = EXCLUDED.rank_ftperc_o,
                    rank_ftperc_d = EXCLUDED.rank_ftperc_d,
                    rank_threeattmprate_o = EXCLUDED.rank_threeattmprate_o,
                    rank_threeattmprate_d = EXCLUDED.rank_threeattmprate_d,
                    rank_assistperc_o = EXCLUDED.rank_assistperc_o,
                    rank_stealperc_o = EXCLUDED.rank_stealperc_o,
                    rank_blockperc_o = EXCLUDED.rank_blockperc_o,
                    rank_assistperc_d = EXCLUDED.rank_assistperc_d,
                    rank_stealperc_d = EXCLUDED.rank_stealperc_d,
                    rank_blockperc_d = EXCLUDED.rank_blockperc_d,
                    rank_points2perc_o = EXCLUDED.rank_points2perc_o,
                    rank_points2perc_d = EXCLUDED.rank_points2perc_d,
                    rank_points3perc_o = EXCLUDED.rank_points3perc_o,
                    rank_points3perc_d = EXCLUDED.rank_points3perc_d,
                    rank_pointsftperc_o = EXCLUDED.rank_pointsftperc_o,
                    rank_pointsftperc_d = EXCLUDED.rank_pointsftperc_d,
                    updated_at = CURRENT_TIMESTAMP;
            """

            try:
                execute_values(cursor, insert_query, data_tuples)
                batch_inserted = cursor.rowcount
                total_inserted += batch_inserted
                conn.commit()
                print(f"Inserted batch {i//batch_size + 1}: {batch_inserted} rows")
            except Exception as e:
                print(f"Error inserting batch {i//batch_size + 1}: {e}")
                conn.rollback()
                continue

        print(f"Successfully inserted/updated {total_inserted} total rows in {table_name}")

    except Exception as e:
        print(f"Error during calculation: {e}")
        try:
            conn.rollback()
        except:
            pass
        raise
    finally:
        try:
            cursor.close()
            conn.close()
        except:
            pass

print("=== CREATING ALL BASKETBALL TABLES WITH LOGOS (2025 SEASON ONLY) ===")

print("\n=== STEP 1: CREATING SCHEDULE RESULTS AND STANDINGS ===")

print("Processing EuroLeague schedule and standings...")
gs_euroleague = GameStats('E')
gamestats_euroleague = gs_euroleague.get_game_reports_range_seasons(2025, 2025)
team_records_euroleague = create_team_records_dataset_euroleague(gamestats_euroleague)
insert_schedule_results_to_db(team_records_euroleague, 'euroleague')

cumulative_standings_euroleague = create_cumulative_standings(team_records_euroleague, 'euroleague')
insert_cumulative_standings_to_db(cumulative_standings_euroleague, 'euroleague')

print("Processing EuroCup schedule and standings...")
gs_eurocup = GameStats('U')
gamestats_eurocup = gs_eurocup.get_game_reports_range_seasons(2025, 2025)
team_records_eurocup = create_team_records_dataset_eurocup(gamestats_eurocup)
insert_schedule_results_to_db(team_records_eurocup, 'eurocup')

cumulative_standings_eurocup = create_cumulative_standings(team_records_eurocup, 'eurocup')
insert_cumulative_standings_to_db(cumulative_standings_eurocup, 'eurocup')

print("\n=== STEP 2: CREATING ADVANCED STATS WITH LOGOS ===")

print("Getting boxscore data...")
boxdata_euroleague = BoxScoreData(competition='E')
boxscore_data_euroleague = boxdata_euroleague.get_player_boxscore_stats_multiple_seasons(2025, 2025)

boxdata_eurocup = BoxScoreData(competition='U')
boxscore_data_eurocup = boxdata_eurocup.get_player_boxscore_stats_multiple_seasons(2025, 2025)

print("Processing EuroLeague advanced stats...")
try:
    calculate_advanced_team_stats_with_logos(boxscore_data_euroleague, 'euroleague')
    print("✓ Completed EuroLeague 2025")
except Exception as e:
    print(f"✗ Failed EuroLeague 2025: {e}")

print("Processing EuroCup advanced stats...")
try:
    calculate_advanced_team_stats_with_logos(boxscore_data_eurocup, 'eurocup')
    print("✓ Completed EuroCup 2025")
except Exception as e:
    print(f"✗ Failed EuroCup 2025: {e}")

print("\n=== ALL 6 TABLES UPDATED SUCCESSFULLY WITH 2025 DATA! ===")
print("Tables updated:")
print("1. schedule_results_euroleague")
print("2. schedule_results_eurocup")
print("3. cumulative_standings_euroleague")
print("4. cumulative_standings_eurocup")
print("5. team_advanced_stats_euroleague")
print("6. team_advanced_stats_eurocup")


# In[12]:


# Inserts 2025 data into these 4 tables
# eurocup_game_logs
# euroleague_game_logs
# player_stats_from_gamelogs_eurocup
# player_stats_from_gamelogs_euroleague

import psycopg2
from psycopg2.extras import execute_values
import pandas as pd

from euroleague_api.boxscore_data import BoxScoreData

boxdata = BoxScoreData(competition='U')
boxscore_data = boxdata.get_player_boxscore_stats_multiple_seasons(2025, 2025)

# Remove the filter to include Team and Total rows
game_logs = boxscore_data.sort_values(['Player', 'Season', 'Round'], ascending=[True, False, False])

# Handle GameSequence differently for Team and Total rows
def calculate_game_sequence(df):
    # For regular players, calculate sequence as before
    player_mask = ~df['Player_ID'].isin(['Team', 'Total'])
    df.loc[player_mask, 'GameSequence'] = df[player_mask].groupby('Player_ID').cumcount() + 1

    # For Team and Total rows, set GameSequence to None or 0
    df.loc[~player_mask, 'GameSequence'] = None

    return df

game_logs = calculate_game_sequence(game_logs)

# Create a season-round identifier for easier reference
game_logs['SeasonRound'] = game_logs['Season'].astype(str) + '-' + game_logs['Round'].astype(str)

def insert_euroleague_game_logs_to_db(game_logs_df, table_name='eurocup_game_logs'):
    # Connect to the database
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    try:
        # 1. Print local DataFrame info
        print(f"Local DataFrame has {len(game_logs_df)} rows")

        # Check distribution of Player_ID types
        team_count = (game_logs_df['Player_ID'] == 'Team').sum()
        total_count = (game_logs_df['Player_ID'] == 'Total').sum()
        regular_count = len(game_logs_df) - team_count - total_count

        print(f"Regular players: {regular_count}, Team rows: {team_count}, Total rows: {total_count}")

        # 2. Check for duplicates and create a unique identifier
        # Add a row number to handle multiple Team/Total entries per game
        game_logs_df = game_logs_df.copy()
        game_logs_df['row_number'] = game_logs_df.groupby(['Player_ID', 'Gamecode', 'Season', 'Team']).cumcount() + 1

        duplicates = game_logs_df.groupby(['Player_ID', 'Gamecode', 'Season', 'Team', 'row_number']).size()
        duplicates = duplicates[duplicates > 1]
        if len(duplicates) > 0:
            print(f"Warning: Found {len(duplicates)} duplicate combinations after adding row_number")

        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id SERIAL PRIMARY KEY,
            season INTEGER,
            phase TEXT,
            round INTEGER,
            gamecode TEXT,
            home INTEGER,
            player_id TEXT,
            is_starter REAL,
            is_playing REAL,
            team TEXT,
            dorsal INTEGER,
            player TEXT,
            minutes TEXT,
            points INTEGER,
            field_goals_made_2 INTEGER,
            field_goals_attempted_2 INTEGER,
            field_goals_made_3 INTEGER,
            field_goals_attempted_3 INTEGER,
            free_throws_made INTEGER,
            free_throws_attempted INTEGER,
            offensive_rebounds INTEGER,
            defensive_rebounds INTEGER,
            total_rebounds INTEGER,
            assistances INTEGER,
            steals INTEGER,
            turnovers INTEGER,
            blocks_favour INTEGER,
            blocks_against INTEGER,
            fouls_commited INTEGER,
            fouls_received INTEGER,
            valuation INTEGER,
            plusminus REAL,
            game_sequence INTEGER,
            season_round TEXT,
            row_type TEXT DEFAULT 'player',
            row_number INTEGER DEFAULT 1,
            UNIQUE(player_id, gamecode, season, team, row_number)
        );
        """)
        conn.commit()

        cursor.execute(f"DELETE FROM {table_name} WHERE season = 2025")
        deleted_count = cursor.rowcount
        conn.commit()
        print(f"Deleted {deleted_count} existing records for season 2025")

        # 4. Check current row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        before_count = cursor.fetchone()[0]
        print(f"Rows in database before insert: {before_count}")

        # 5. Define helper functions with better handling for Team/Total rows
        def safe_int(val):
            if pd.isna(val) or val == 'DNP' or val == 'None':
                return None
            try:
                return int(float(val))  # Convert to float first to handle string numbers
            except (ValueError, TypeError):
                return None

        def safe_float(val):
            if pd.isna(val) or val == 'None':
                return None
            try:
                return float(val)
            except (ValueError, TypeError):
                return None

        def safe_str(val):
            if pd.isna(val) or val == 'None':
                return None
            return str(val)

        # 6. Build the data tuples from the DataFrame with better error handling
        data_tuples = []
        for idx, row in game_logs_df.iterrows():
            try:
                # Determine row type
                if row["Player_ID"] == 'Team':
                    row_type = 'team'
                elif row["Player_ID"] == 'Total':
                    row_type = 'total'
                else:
                    row_type = 'player'

                data_tuples.append((
                    safe_int(row["Season"]),
                    safe_str(row["Phase"]),
                    safe_int(row["Round"]),
                    safe_str(row["Gamecode"]),
                    safe_int(row["Home"]),
                    safe_str(row["Player_ID"]),
                    safe_float(row["IsStarter"]),
                    safe_float(row["IsPlaying"]),
                    safe_str(row["Team"]),
                    safe_int(row["Dorsal"]),
                    safe_str(row["Player"]),
                    safe_str(row["Minutes"]),
                    safe_int(row["Points"]),
                    safe_int(row["FieldGoalsMade2"]),
                    safe_int(row["FieldGoalsAttempted2"]),
                    safe_int(row["FieldGoalsMade3"]),
                    safe_int(row["FieldGoalsAttempted3"]),
                    safe_int(row["FreeThrowsMade"]),
                    safe_int(row["FreeThrowsAttempted"]),
                    safe_int(row["OffensiveRebounds"]),
                    safe_int(row["DefensiveRebounds"]),
                    safe_int(row["TotalRebounds"]),
                    safe_int(row["Assistances"]),
                    safe_int(row["Steals"]),
                    safe_int(row["Turnovers"]),
                    safe_int(row["BlocksFavour"]),
                    safe_int(row["BlocksAgainst"]),
                    safe_int(row["FoulsCommited"]),
                    safe_int(row["FoulsReceived"]),
                    safe_int(row["Valuation"]),
                    safe_float(row["Plusminus"]),
                    safe_int(row["GameSequence"]),
                    safe_str(row["SeasonRound"]),
                    row_type,
                    safe_int(row["row_number"])
                ))
            except Exception as e:
                print(f"Error processing row {idx}: {e}")
                print(f"Row data: {row.to_dict()}")
                continue

        print(f"Prepared {len(data_tuples)} tuples for insertion")

        # 7. Define the INSERT statement with proper conflict resolution
        insert_query = f"""
        INSERT INTO {table_name} (
            season, phase, round, gamecode, home, player_id, is_starter, is_playing,
            team, dorsal, player, minutes, points, field_goals_made_2, field_goals_attempted_2,
            field_goals_made_3, field_goals_attempted_3, free_throws_made, free_throws_attempted,
            offensive_rebounds, defensive_rebounds, total_rebounds, assistances, steals,
            turnovers, blocks_favour, blocks_against, fouls_commited, fouls_received,
            valuation, plusminus, game_sequence, season_round, row_type, row_number
        ) VALUES %s
        ON CONFLICT (player_id, gamecode, season, team, row_number) DO UPDATE SET
            phase = EXCLUDED.phase,
            round = EXCLUDED.round,
            home = EXCLUDED.home,
            is_starter = EXCLUDED.is_starter,
            is_playing = EXCLUDED.is_playing,
            dorsal = EXCLUDED.dorsal,
            player = EXCLUDED.player,
            minutes = EXCLUDED.minutes,
            points = EXCLUDED.points,
            field_goals_made_2 = EXCLUDED.field_goals_made_2,
            field_goals_attempted_2 = EXCLUDED.field_goals_attempted_2,
            field_goals_made_3 = EXCLUDED.field_goals_made_3,
            field_goals_attempted_3 = EXCLUDED.field_goals_attempted_3,
            free_throws_made = EXCLUDED.free_throws_made,
            free_throws_attempted = EXCLUDED.free_throws_attempted,
            offensive_rebounds = EXCLUDED.offensive_rebounds,
            defensive_rebounds = EXCLUDED.defensive_rebounds,
            total_rebounds = EXCLUDED.total_rebounds,
            assistances = EXCLUDED.assistances,
            steals = EXCLUDED.steals,
            turnovers = EXCLUDED.turnovers,
            blocks_favour = EXCLUDED.blocks_favour,
            blocks_against = EXCLUDED.blocks_against,
            fouls_commited = EXCLUDED.fouls_commited,
            fouls_received = EXCLUDED.fouls_received,
            valuation = EXCLUDED.valuation,
            plusminus = EXCLUDED.plusminus,
            game_sequence = EXCLUDED.game_sequence,
            season_round = EXCLUDED.season_round,
            row_type = EXCLUDED.row_type;
        """

        # 8. Bulk insert data
        execute_values(cursor, insert_query, data_tuples)
        rows_affected = cursor.rowcount
        conn.commit()

        print(f"Insert operation affected {rows_affected} rows")

        # 9. Check final row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        after_count = cursor.fetchone()[0]
        print(f"Rows in database after insert: {after_count}")

        # 10. Verify data integrity by row type
        cursor.execute(f"SELECT row_type, COUNT(*) FROM {table_name} GROUP BY row_type;")
        row_type_counts = cursor.fetchall()
        print("Row counts by type:")
        for row_type, count in row_type_counts:
            print(f"  {row_type}: {count}")

        # 11. Show some sample data including Team and Total rows
        cursor.execute(f"""
            SELECT player_id, player, team, season, round, points, total_rebounds, assistances, row_type, row_number
            FROM {table_name}
            WHERE row_type IN ('team', 'total')
            ORDER BY season DESC, round DESC, team, row_type
            LIMIT 10;
        """)
        sample_team_total = cursor.fetchall()
        print("\nSample Team/Total data:")
        for row in sample_team_total:
            print(f"ID: {row[0]}, Player: {row[1]}, Team: {row[2]}, Season: {row[3]}, Round: {row[4]}, Points: {row[5]}, Rebounds: {row[6]}, Assists: {row[7]}, Type: {row[8]}, Row#: {row[9]}")

        cursor.execute(f"""
            SELECT player_id, player, team, season, round, points, total_rebounds, assistances, row_type 
            FROM {table_name}
            WHERE row_type = 'player'
            ORDER BY season DESC, round DESC 
            LIMIT 3;
        """)
        sample_players = cursor.fetchall()
        print("\nSample Player data:")
        for row in sample_players:
            print(f"ID: {row[0]}, Player: {row[1]}, Team: {row[2]}, Season: {row[3]}, Round: {row[4]}, Points: {row[5]}, Rebounds: {row[6]}, Assists: {row[7]}, Type: {row[8]}")

        print(f"\nGame logs data (including Team and Total rows) inserted successfully!")

    except Exception as e:
        print(f"Error during database operation: {e}")
        conn.rollback()
        raise
    finally:
        # Close connections
        cursor.close()
        conn.close()

# Call the function with your game_logs DataFrame
insert_euroleague_game_logs_to_db(game_logs, 'eurocup_game_logs')


# game_logs_euroleague

boxdata = BoxScoreData(competition='E')
boxscore_data = boxdata.get_player_boxscore_stats_multiple_seasons(2025, 2025)

# Remove the filter to include Team and Total rows
game_logs = boxscore_data.sort_values(['Player', 'Season', 'Round'], ascending=[True, False, False])

# Handle GameSequence differently for Team and Total rows
game_logs = calculate_game_sequence(game_logs)

# Create a season-round identifier for easier reference
game_logs['SeasonRound'] = game_logs['Season'].astype(str) + '-' + game_logs['Round'].astype(str)

# Call the function with your game_logs DataFrame
insert_euroleague_game_logs_to_db(game_logs, 'euroleague_game_logs')

import psycopg2
import pandas as pd

def create_player_stats_from_gamelogs_eurocup():
    """
    Create aggregated player statistics table from EuroCup game logs.
    This replicates the SQL script functionality in Python.
    """
    # Connect to the database
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    try:
        print("Creating player_stats_from_gamelogs_eurocup table...")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS player_stats_from_gamelogs_eurocup (
            season INTEGER,
            phase TEXT,
            player_id TEXT,
            player_name TEXT,
            player_team_code TEXT,
            player_team_name TEXT,
            teamlogo TEXT,
            games_played BIGINT,
            games_started BIGINT,
            minutes_played NUMERIC,
            points_scored NUMERIC,
            points_scored_per_40 NUMERIC,
            two_pointers_made NUMERIC,
            two_pointers_attempted NUMERIC,
            two_pointers_percentage NUMERIC,
            two_pointers_made_per_40 NUMERIC,
            two_pointers_attempted_per_40 NUMERIC,
            three_pointers_made NUMERIC,
            three_pointers_attempted NUMERIC,
            three_pointers_percentage NUMERIC,
            three_pointers_made_per_40 NUMERIC,
            three_pointers_attempted_per_40 NUMERIC,
            free_throws_made NUMERIC,
            free_throws_attempted NUMERIC,
            free_throws_percentage NUMERIC,
            free_throws_made_per_40 NUMERIC,
            free_throws_attempted_per_40 NUMERIC,
            offensive_rebounds NUMERIC,
            defensive_rebounds NUMERIC,
            total_rebounds NUMERIC,
            offensive_rebounds_per_40 NUMERIC,
            defensive_rebounds_per_40 NUMERIC,
            total_rebounds_per_40 NUMERIC,
            assists NUMERIC,
            steals NUMERIC,
            turnovers NUMERIC,
            blocks NUMERIC,
            blocks_against NUMERIC,
            fouls_commited NUMERIC,
            fouls_drawn NUMERIC,
            pir NUMERIC,
            assists_per_40 NUMERIC,
            steals_per_40 NUMERIC,
            turnovers_per_40 NUMERIC,
            blocks_per_40 NUMERIC,
            blocks_against_per_40 NUMERIC,
            fouls_commited_per_40 NUMERIC,
            fouls_drawn_per_40 NUMERIC,
            pir_per_40 NUMERIC,
            total_points BIGINT,
            total_minutes NUMERIC,
            total_two_pointers_made BIGINT,
            total_two_pointers_attempted BIGINT,
            total_three_pointers_made BIGINT,
            total_three_pointers_attempted BIGINT,
            total_free_throws_made BIGINT,
            total_free_throws_attempted BIGINT,
            total_offensive_rebounds BIGINT,
            total_defensive_rebounds BIGINT,
            total_total_rebounds BIGINT,
            total_assists BIGINT,
            total_steals BIGINT,
            total_turnovers BIGINT,
            total_blocks BIGINT,
            total_blocks_against BIGINT,
            total_fouls_commited BIGINT,
            total_fouls_drawn BIGINT,
            total_pir BIGINT
        );
        """)
        conn.commit()

        cursor.execute("DELETE FROM player_stats_from_gamelogs_eurocup WHERE season = 2025")
        deleted_count = cursor.rowcount
        conn.commit()
        print(f"Deleted {deleted_count} existing records for season 2025")

        insert_query = """
        INSERT INTO player_stats_from_gamelogs_eurocup
        SELECT 
            elgl.season, 
            case when elgl.phase in ('RS','TS') then 'Regular Season' else 'Playoffs' end as phase,
            elgl.player_id,
            MAX(elgl.player) AS player_name,
            elgl.team AS player_team_code,
            sr.team AS player_team_name,
            sr.teamlogo,

            -- Basic stats
            COUNT(*) AS games_played,
            SUM(CASE WHEN elgl.is_starter = 1 THEN 1 ELSE 0 END) AS games_started,
            AVG(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)) AS minutes_played,

            -- Scoring (per game averages)
            AVG(elgl.points) AS points_scored,

            -- Per 40 minutes calculations
            (SUM(elgl.points)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS points_scored_per_40,

            -- Two-point shooting (per game averages)
            AVG(elgl.field_goals_made_2) AS two_pointers_made,
            AVG(elgl.field_goals_attempted_2) AS two_pointers_attempted,
            CASE 
                WHEN SUM(elgl.field_goals_attempted_2) > 0 
                THEN (SUM(elgl.field_goals_made_2)::DECIMAL / SUM(elgl.field_goals_attempted_2)) * 100 
                ELSE 0 
            END AS two_pointers_percentage,

            -- Per 40 minutes calculations for shooting
            (SUM(elgl.field_goals_made_2)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS two_pointers_made_per_40,
            (SUM(elgl.field_goals_attempted_2)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS two_pointers_attempted_per_40,

            -- Three-point shooting (per game averages)
            AVG(elgl.field_goals_made_3) AS three_pointers_made,
            AVG(elgl.field_goals_attempted_3) AS three_pointers_attempted,
            CASE 
                WHEN SUM(elgl.field_goals_attempted_3) > 0 
                THEN (SUM(elgl.field_goals_made_3)::DECIMAL / SUM(elgl.field_goals_attempted_3)) * 100 
                ELSE 0 
            END AS three_pointers_percentage,

            -- Per 40 minutes calculations for three-pointers
            (SUM(elgl.field_goals_made_3)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS three_pointers_made_per_40,
            (SUM(elgl.field_goals_attempted_3)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS three_pointers_attempted_per_40,

            -- Free throw shooting (per game averages)
            AVG(elgl.free_throws_made) AS free_throws_made,
            AVG(elgl.free_throws_attempted) AS free_throws_attempted,
            CASE 
                WHEN SUM(elgl.free_throws_attempted) > 0 
                THEN (SUM(elgl.free_throws_made)::DECIMAL / SUM(elgl.free_throws_attempted)) * 100 
                ELSE 0 
            END AS free_throws_percentage,

            -- Per 40 minutes calculations for free throws
            (SUM(elgl.free_throws_made)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS free_throws_made_per_40,
            (SUM(elgl.free_throws_attempted)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS free_throws_attempted_per_40,

            -- Rebounds (per game averages)
            AVG(elgl.offensive_rebounds) AS offensive_rebounds,
            AVG(elgl.defensive_rebounds) AS defensive_rebounds,
            AVG(elgl.total_rebounds) AS total_rebounds,

            -- Per 40 minutes calculations for rebounds
            (SUM(elgl.offensive_rebounds)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS offensive_rebounds_per_40,
            (SUM(elgl.defensive_rebounds)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS defensive_rebounds_per_40,
            (SUM(elgl.total_rebounds)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS total_rebounds_per_40,

            -- Other stats (per game averages)
            AVG(elgl.assistances) AS assists,
            AVG(elgl.steals) AS steals,
            AVG(elgl.turnovers) AS turnovers,
            AVG(elgl.blocks_favour) AS blocks,
            AVG(elgl.blocks_against) AS blocks_against,
            AVG(elgl.fouls_commited) AS fouls_commited,
            AVG(elgl.fouls_received) AS fouls_drawn,
            AVG(elgl.valuation) AS pir,

            -- Per 40 minutes calculations for other stats
            (SUM(elgl.assistances)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS assists_per_40,
            (SUM(elgl.steals)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS steals_per_40,
            (SUM(elgl.turnovers)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS turnovers_per_40,
            (SUM(elgl.blocks_favour)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS blocks_per_40,
            (SUM(elgl.blocks_against)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS blocks_against_per_40,
            (SUM(elgl.fouls_commited)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS fouls_commited_per_40,
            (SUM(elgl.fouls_received)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS fouls_drawn_per_40,
            (SUM(elgl.valuation)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS pir_per_40,

            -- Totals for reference
            SUM(elgl.points) AS total_points,
            SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)) AS total_minutes,
            SUM(elgl.field_goals_made_2) AS total_two_pointers_made,
            SUM(elgl.field_goals_attempted_2) AS total_two_pointers_attempted,
            SUM(elgl.field_goals_made_3) AS total_three_pointers_made,
            SUM(elgl.field_goals_attempted_3) AS total_three_pointers_attempted,
            SUM(elgl.free_throws_made) AS total_free_throws_made,
            SUM(elgl.free_throws_attempted) AS total_free_throws_attempted,
            SUM(elgl.offensive_rebounds) AS total_offensive_rebounds,
            SUM(elgl.defensive_rebounds) AS total_defensive_rebounds,
            SUM(elgl.total_rebounds) AS total_total_rebounds,
            SUM(elgl.assistances) AS total_assists,
            SUM(elgl.steals) AS total_steals,
            SUM(elgl.turnovers) AS total_turnovers,
            SUM(elgl.blocks_favour) AS total_blocks,
            SUM(elgl.blocks_against) AS total_blocks_against,
            SUM(elgl.fouls_commited) AS total_fouls_commited,
            SUM(elgl.fouls_received) AS total_fouls_drawn,
            SUM(elgl.valuation) AS total_pir
        FROM eurocup_game_logs elgl
        JOIN (
            SELECT DISTINCT season, team, teamcode, teamlogo
            FROM schedule_results_eurocup
        ) sr ON elgl.season = sr.season AND elgl.team = sr.teamcode
        WHERE elgl.player IS NOT NULL 
            AND elgl.player != '' 
            AND LOWER(elgl.player) NOT IN ('total', 'team')
            AND elgl.minutes != 'DNP'
            AND elgl.minutes != ''
            AND elgl.season = 2025
        GROUP BY elgl.season, 
            case when elgl.phase in ('RS','TS') then 'Regular Season' else 'Playoffs' end,
            elgl.player_id, elgl.team, sr.team, sr.teamlogo;
        """

        cursor.execute(insert_query)
        conn.commit()

        # Get row count
        cursor.execute("SELECT COUNT(*) FROM player_stats_from_gamelogs_eurocup WHERE season = 2025;")
        row_count = cursor.fetchone()[0]
        print(f"Inserted {row_count} rows for season 2025 into player_stats_from_gamelogs_eurocup")

        # Show sample data
        cursor.execute("""
            SELECT player_name, player_team_name, season, phase, games_played, 
                   ROUND(points_scored::NUMERIC, 2) as points_per_game,
                   ROUND(total_rebounds::NUMERIC, 2) as rebounds_per_game,
                   ROUND(assists::NUMERIC, 2) as assists_per_game
            FROM player_stats_from_gamelogs_eurocup
            WHERE season = 2025
            ORDER BY points_scored DESC
            LIMIT 5;
        """)
        sample_data = cursor.fetchall()

        print("\nTop 5 scorers in 2025 EuroCup:")
        for row in sample_data:
            print(f"{row[0]} ({row[1]}) - {row[2]} {row[3]}: {row[4]} games, {row[5]} PPG, {row[6]} RPG, {row[7]} APG")

        print("\nEuroCup player statistics table updated successfully!")

    except Exception as e:
        print(f"Error creating EuroCup player stats: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

# Run the function
create_player_stats_from_gamelogs_eurocup()



def create_player_stats_from_gamelogs_euroleague():
    """
    Create aggregated player statistics table from EuroLeague game logs.
    This replicates the SQL script functionality in Python.
    """
    # Connect to the database
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    try:
        print("Creating player_stats_from_gamelogs_euroleague table...")

        cursor.execute("""
        CREATE TABLE IF NOT EXISTS player_stats_from_gamelogs_euroleague (
            season INTEGER,
            phase TEXT,
            player_id TEXT,
            player_name TEXT,
            player_team_code TEXT,
            player_team_name TEXT,
            teamlogo TEXT,
            games_played BIGINT,
            games_started BIGINT,
            minutes_played NUMERIC,
            points_scored NUMERIC,
            points_scored_per_40 NUMERIC,
            two_pointers_made NUMERIC,
            two_pointers_attempted NUMERIC,
            two_pointers_percentage NUMERIC,
            two_pointers_made_per_40 NUMERIC,
            two_pointers_attempted_per_40 NUMERIC,
            three_pointers_made NUMERIC,
            three_pointers_attempted NUMERIC,
            three_pointers_percentage NUMERIC,
            three_pointers_made_per_40 NUMERIC,
            three_pointers_attempted_per_40 NUMERIC,
            free_throws_made NUMERIC,
            free_throws_attempted NUMERIC,
            free_throws_percentage NUMERIC,
            free_throws_made_per_40 NUMERIC,
            free_throws_attempted_per_40 NUMERIC,
            offensive_rebounds NUMERIC,
            defensive_rebounds NUMERIC,
            total_rebounds NUMERIC,
            offensive_rebounds_per_40 NUMERIC,
            defensive_rebounds_per_40 NUMERIC,
            total_rebounds_per_40 NUMERIC,
            assists NUMERIC,
            steals NUMERIC,
            turnovers NUMERIC,
            blocks NUMERIC,
            blocks_against NUMERIC,
            fouls_commited NUMERIC,
            fouls_drawn NUMERIC,
            pir NUMERIC,
            assists_per_40 NUMERIC,
            steals_per_40 NUMERIC,
            turnovers_per_40 NUMERIC,
            blocks_per_40 NUMERIC,
            blocks_against_per_40 NUMERIC,
            fouls_commited_per_40 NUMERIC,
            fouls_drawn_per_40 NUMERIC,
            pir_per_40 NUMERIC,
            total_points BIGINT,
            total_minutes NUMERIC,
            total_two_pointers_made BIGINT,
            total_two_pointers_attempted BIGINT,
            total_three_pointers_made BIGINT,
            total_three_pointers_attempted BIGINT,
            total_free_throws_made BIGINT,
            total_free_throws_attempted BIGINT,
            total_offensive_rebounds BIGINT,
            total_defensive_rebounds BIGINT,
            total_total_rebounds BIGINT,
            total_assists BIGINT,
            total_steals BIGINT,
            total_turnovers BIGINT,
            total_blocks BIGINT,
            total_blocks_against BIGINT,
            total_fouls_commited BIGINT,
            total_fouls_drawn BIGINT,
            total_pir BIGINT
        );
        """)
        conn.commit()

        cursor.execute("DELETE FROM player_stats_from_gamelogs_euroleague WHERE season = 2025")
        deleted_count = cursor.rowcount
        conn.commit()
        print(f"Deleted {deleted_count} existing records for season 2025")

        insert_query = """
        INSERT INTO player_stats_from_gamelogs_euroleague
        SELECT 
            elgl.season, 
            case when elgl.phase in ('RS','TS') then 'Regular Season' else 'Playoffs' end as phase,
            elgl.player_id,
            MAX(elgl.player) AS player_name,
            elgl.team AS player_team_code,
            sr.team AS player_team_name,
            sr.teamlogo,

            -- Basic stats
            COUNT(*) AS games_played,
            SUM(CASE WHEN elgl.is_starter = 1 THEN 1 ELSE 0 END) AS games_started,
            AVG(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)) AS minutes_played,

            -- Scoring (per game averages)
            AVG(elgl.points) AS points_scored,

            -- Per 40 minutes calculations
            (SUM(elgl.points)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS points_scored_per_40,

            -- Two-point shooting (per game averages)
            AVG(elgl.field_goals_made_2) AS two_pointers_made,
            AVG(elgl.field_goals_attempted_2) AS two_pointers_attempted,
            CASE 
                WHEN SUM(elgl.field_goals_attempted_2) > 0 
                THEN (SUM(elgl.field_goals_made_2)::DECIMAL / SUM(elgl.field_goals_attempted_2)) * 100 
                ELSE 0 
            END AS two_pointers_percentage,

            -- Per 40 minutes calculations for shooting
            (SUM(elgl.field_goals_made_2)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS two_pointers_made_per_40,
            (SUM(elgl.field_goals_attempted_2)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS two_pointers_attempted_per_40,

            -- Three-point shooting (per game averages)
            AVG(elgl.field_goals_made_3) AS three_pointers_made,
            AVG(elgl.field_goals_attempted_3) AS three_pointers_attempted,
            CASE 
                WHEN SUM(elgl.field_goals_attempted_3) > 0 
                THEN (SUM(elgl.field_goals_made_3)::DECIMAL / SUM(elgl.field_goals_attempted_3)) * 100 
                ELSE 0 
            END AS three_pointers_percentage,

            -- Per 40 minutes calculations for three-pointers
            (SUM(elgl.field_goals_made_3)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS three_pointers_made_per_40,
            (SUM(elgl.field_goals_attempted_3)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS three_pointers_attempted_per_40,

            -- Free throw shooting (per game averages)
            AVG(elgl.free_throws_made) AS free_throws_made,
            AVG(elgl.free_throws_attempted) AS free_throws_attempted,
            CASE 
                WHEN SUM(elgl.free_throws_attempted) > 0 
                THEN (SUM(elgl.free_throws_made)::DECIMAL / SUM(elgl.free_throws_attempted)) * 100 
                ELSE 0 
            END AS free_throws_percentage,

            -- Per 40 minutes calculations for free throws
            (SUM(elgl.free_throws_made)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS free_throws_made_per_40,
            (SUM(elgl.free_throws_attempted)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS free_throws_attempted_per_40,

            -- Rebounds (per game averages)
            AVG(elgl.offensive_rebounds) AS offensive_rebounds,
            AVG(elgl.defensive_rebounds) AS defensive_rebounds,
            AVG(elgl.total_rebounds) AS total_rebounds,

            -- Per 40 minutes calculations for rebounds
            (SUM(elgl.offensive_rebounds)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS offensive_rebounds_per_40,
            (SUM(elgl.defensive_rebounds)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS defensive_rebounds_per_40,
            (SUM(elgl.total_rebounds)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS total_rebounds_per_40,

            -- Other stats (per game averages)
            AVG(elgl.assistances) AS assists,
            AVG(elgl.steals) AS steals,
            AVG(elgl.turnovers) AS turnovers,
            AVG(elgl.blocks_favour) AS blocks,
            AVG(elgl.blocks_against) AS blocks_against,
            AVG(elgl.fouls_commited) AS fouls_commited,
            AVG(elgl.fouls_received) AS fouls_drawn,
            AVG(elgl.valuation) AS pir,

            -- Per 40 minutes calculations for other stats
            (SUM(elgl.assistances)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS assists_per_40,
            (SUM(elgl.steals)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS steals_per_40,
            (SUM(elgl.turnovers)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS turnovers_per_40,
            (SUM(elgl.blocks_favour)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS blocks_per_40,
            (SUM(elgl.blocks_against)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS blocks_against_per_40,
            (SUM(elgl.fouls_commited)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS fouls_commited_per_40,
            (SUM(elgl.fouls_received)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS fouls_drawn_per_40,
            (SUM(elgl.valuation)::DECIMAL * 40) / NULLIF(SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)), 0::DECIMAL) AS pir_per_40,

            -- Totals for reference
            SUM(elgl.points) AS total_points,
            SUM(CAST(REPLACE(elgl.minutes, ':', '.') AS DECIMAL)) AS total_minutes,
            SUM(elgl.field_goals_made_2) AS total_two_pointers_made,
            SUM(elgl.field_goals_attempted_2) AS total_two_pointers_attempted,
            SUM(elgl.field_goals_made_3) AS total_three_pointers_made,
            SUM(elgl.field_goals_attempted_3) AS total_three_pointers_attempted,
            SUM(elgl.free_throws_made) AS total_free_throws_made,
            SUM(elgl.free_throws_attempted) AS total_free_throws_attempted,
            SUM(elgl.offensive_rebounds) AS total_offensive_rebounds,
            SUM(elgl.defensive_rebounds) AS total_defensive_rebounds,
            SUM(elgl.total_rebounds) AS total_total_rebounds,
            SUM(elgl.assistances) AS total_assists,
            SUM(elgl.steals) AS total_steals,
            SUM(elgl.turnovers) AS total_turnovers,
            SUM(elgl.blocks_favour) AS total_blocks,
            SUM(elgl.blocks_against) AS total_blocks_against,
            SUM(elgl.fouls_commited) AS total_fouls_commited,
            SUM(elgl.fouls_received) AS total_fouls_drawn,
            SUM(elgl.valuation) AS total_pir
        FROM euroleague_game_logs elgl
        JOIN (
            SELECT DISTINCT season, team, teamcode, teamlogo
            FROM schedule_results_euroleague
        ) sr ON elgl.season = sr.season AND elgl.team = sr.teamcode
        WHERE elgl.player IS NOT NULL 
            AND elgl.player != '' 
            AND LOWER(elgl.player) NOT IN ('total', 'team')
            AND elgl.minutes != 'DNP'
            AND elgl.minutes != ''
            AND elgl.season = 2025
        GROUP BY elgl.season, 
            case when elgl.phase in ('RS','TS') then 'Regular Season' else 'Playoffs' end,
            elgl.player_id, elgl.team, sr.team, sr.teamlogo;
        """

        cursor.execute(insert_query)
        conn.commit()

        # Get row count
        cursor.execute("SELECT COUNT(*) FROM player_stats_from_gamelogs_euroleague WHERE season = 2025;")
        row_count = cursor.fetchone()[0]
        print(f"Inserted {row_count} rows for season 2025 into player_stats_from_gamelogs_euroleague")

        # Show sample data
        cursor.execute("""
            SELECT player_name, player_team_name, season, phase, games_played, 
                   ROUND(points_scored::NUMERIC, 2) as points_per_game,
                   ROUND(total_rebounds::NUMERIC, 2) as rebounds_per_game,
                   ROUND(assists::NUMERIC, 2) as assists_per_game
            FROM player_stats_from_gamelogs_euroleague
            WHERE season = 2025
            ORDER BY points_scored DESC
            LIMIT 5;
        """)
        sample_data = cursor.fetchall()

        print("\nTop 5 scorers in 2025 EuroLeague:")
        for row in sample_data:
            print(f"{row[0]} ({row[1]}) - {row[2]} {row[3]}: {row[4]} games, {row[5]} PPG, {row[6]} RPG, {row[7]} APG")

        print("\nEuroLeague player statistics table updated successfully!")

    except Exception as e:
        print(f"Error creating EuroLeague player stats: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

# Run the function
create_player_stats_from_gamelogs_euroleague()


# In[13]:


# Inserts 2025 data into these 4 tables 
# shot_data_euroleague
# shot_data_euroleague_averages
# shot_data_eurocup
# shot_data_eurocup_averages

import psycopg2
from psycopg2.extras import execute_values
import pandas as pd
import math
from euroleague_api.shot_data import ShotData

# --- 1. Define Court Parameters (from JavaScript's findCourtParameters) ---
COURT_PARAMS = {
    'basket_x': 0,
    'basket_y': 0,
    'three_point_radius': 675,
    'corner_line_x': 660,
    'corner_intersection_y': 157.5,
    'restricted_area_radius': 125,
    'baseline_y': -100,
    'paint_width': 490,
    'paint_height': 580,
    'free_throw_distance': 580,
    'free_throw_circle_radius': 180,
    'court_min_x': -750,
    'court_max_x': 750,
    'court_min_y': -100,
    'court_max_y': 850,
}

# --- 2. Shot Classification Function ---
def classify_shots_py(data_df: pd.DataFrame) -> pd.DataFrame:
    """
    Filters out free throws and adds 'made' status to the DataFrame.
    """
    filtered_df = data_df[
        ~(
            data_df['ID_ACTION'].str.lower().str.contains("ft", na=False) |
            data_df['ID_ACTION'].str.lower().str.contains("free", na=False) |
            data_df['ACTION'].str.lower().str.contains("free throw", na=False) |
            data_df['ACTION'].str.lower().str.contains("ft", na=False)
        )
    ].copy()

    filtered_df['made'] = filtered_df['POINTS'].apply(lambda p: 1 if p > 0 else 0)
    return filtered_df

# --- 3. Zone Classification Function ---
def classify_zones_py(shot_data_row, court_params):
    """
    Classifies a single shot into one of the 11 specified zones.
    """
    x = shot_data_row['COORD_X']
    y = shot_data_row['COORD_Y']

    if pd.isna(x) or pd.isna(y):
        return "Unknown"

    basket_x = court_params['basket_x']
    basket_y = court_params['basket_y']
    three_point_radius = court_params['three_point_radius']
    corner_line_x = court_params['corner_line_x']
    corner_intersection_y = court_params['corner_intersection_y']
    restricted_area_radius = court_params['restricted_area_radius']

    distance = math.sqrt((x - basket_x)**2 + (y - basket_y)**2)
    angle = math.degrees(math.atan2(x - basket_x, y - basket_y))

    bin_zone = "Other"

    is_in_corner_3_zone = abs(x) >= corner_line_x and y <= corner_intersection_y
    is_in_arc_3_zone = distance >= three_point_radius and y > corner_intersection_y
    is_actually_3pt_location = is_in_corner_3_zone or is_in_arc_3_zone

    if is_actually_3pt_location:
        if is_in_corner_3_zone:
            bin_zone = "corner 3 left" if x < 0 else "right corner 3"
        else:
            if angle < -30:
                bin_zone = "right side 3"
            elif angle > 30:
                bin_zone = "left side 3"
            else:
                bin_zone = "top 3"
    else:
        if distance <= restricted_area_radius:
            bin_zone = "at the rim"
        elif distance <= 300:
            if x < -50:
                bin_zone = "short 2pt left"
            elif x > 50:
                bin_zone = "short 2pt right"
            else:
                bin_zone = "short 2pt center"
        else:
            if x < -50:
                bin_zone = "mid 2pt left"
            elif x > 50:
                bin_zone = "mid 2pt right"
            else:
                bin_zone = "mid 2pt center"

    return bin_zone

# --- 4. Insert Shot Data Function ---
def insert_shot_data_to_db(shot_data_df, competition):
    """
    Insert shot data into the database for a specific competition.
    Only deletes and re-inserts season 2025 data.
    """
    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    table_name = f"shot_data_{competition}"

    try:
        print(f"\n=== Processing {table_name} ===")
        print(f"Local DataFrame has {len(shot_data_df)} rows")

        # Check for duplicates
        duplicates = shot_data_df.groupby(['ID_PLAYER', 'Gamecode', 'Season', 'NUM_ANOT']).size()
        duplicates = duplicates[duplicates > 1]
        if len(duplicates) > 0:
            print(f"Warning: Found {len(duplicates)} duplicate player-gamecode-season-annotation combinations")

        # Create table if not exists
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id SERIAL PRIMARY KEY,
            season INTEGER,
            phase TEXT,
            round INTEGER,
            gamecode TEXT,
            num_anot INTEGER,
            team TEXT,
            id_player TEXT,
            player TEXT,
            id_action TEXT,
            action TEXT,
            points INTEGER,
            coord_x INTEGER,
            coord_y INTEGER,
            zone TEXT,
            bin TEXT,
            fastbreak INTEGER,
            second_chance INTEGER,
            points_off_turnover INTEGER,
            minute INTEGER,
            console TEXT,
            points_a INTEGER,
            points_b INTEGER,
            utc TEXT,
            UNIQUE(id_player, gamecode, season, num_anot)
        );
        """)
        conn.commit()
        print(f"Ensured {table_name} table exists")

        # Delete only season 2025 data
        seasons_to_process = list(shot_data_df['Season'].unique())
        if seasons_to_process:
            seasons_str = ','.join(map(str, seasons_to_process))
            cursor.execute(f"DELETE FROM {table_name} WHERE season IN ({seasons_str})")
            deleted_count = cursor.rowcount
            conn.commit()
            print(f"Deleted {deleted_count} existing records for seasons: {seasons_to_process}")

        # Helper functions
        def safe_int(val):
            if pd.isna(val):
                return None
            try:
                return int(val)
            except (ValueError, TypeError):
                return None

        def safe_str(val):
            if pd.isna(val):
                return None
            return str(val)

        # Build data tuples
        data_tuples = []
        for _, row in shot_data_df.iterrows():
            data_tuples.append((
                safe_int(row["Season"]),
                safe_str(row["Phase"]),
                safe_int(row["Round"]),
                safe_str(row["Gamecode"]),
                safe_int(row["NUM_ANOT"]),
                safe_str(row["TEAM"]),
                safe_str(row["ID_PLAYER"]),
                safe_str(row["PLAYER"]),
                safe_str(row["ID_ACTION"]),
                safe_str(row["ACTION"]),
                safe_int(row["POINTS"]),
                safe_int(row["COORD_X"]),
                safe_int(row["COORD_Y"]),
                safe_str(row["ZONE"]) if "ZONE" in row else None,
                safe_str(row["Bin"]),
                safe_int(row["FASTBREAK"]),
                safe_int(row["SECOND_CHANCE"]),
                safe_int(row["POINTS_OFF_TURNOVER"]),
                safe_int(row["MINUTE"]),
                safe_str(row["CONSOLE"]),
                safe_int(row["POINTS_A"]),
                safe_int(row["POINTS_B"]),
                safe_str(row["UTC"])
            ))

        print(f"Prepared {len(data_tuples)} tuples for insertion")

        # Insert with conflict resolution
        insert_query = f"""
        INSERT INTO {table_name} (
            season, phase, round, gamecode, num_anot, team, id_player, player,
            id_action, action, points, coord_x, coord_y, zone, bin, fastbreak,
            second_chance, points_off_turnover, minute, console, points_a,
            points_b, utc
        ) VALUES %s
        ON CONFLICT (id_player, gamecode, season, num_anot) DO UPDATE SET
            phase = EXCLUDED.phase,
            round = EXCLUDED.round,
            team = EXCLUDED.team,
            player = EXCLUDED.player,
            id_action = EXCLUDED.id_action,
            action = EXCLUDED.action,
            points = EXCLUDED.points,
            coord_x = EXCLUDED.coord_x,
            coord_y = EXCLUDED.coord_y,
            zone = EXCLUDED.zone,
            bin = EXCLUDED.bin,
            fastbreak = EXCLUDED.fastbreak,
            second_chance = EXCLUDED.second_chance,
            points_off_turnover = EXCLUDED.points_off_turnover,
            minute = EXCLUDED.minute,
            console = EXCLUDED.console,
            points_a = EXCLUDED.points_a,
            points_b = EXCLUDED.points_b,
            utc = EXCLUDED.utc;
        """

        execute_values(cursor, insert_query, data_tuples)
        rows_affected = cursor.rowcount
        conn.commit()

        print(f"Insert operation affected {rows_affected} rows")

        # Verify final count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        after_count = cursor.fetchone()[0]
        print(f"Total rows in {table_name}: {after_count}")

        # Show bin distribution
        cursor.execute(f"""
            SELECT bin, COUNT(*) as count
            FROM {table_name}
            WHERE season = 2025
            GROUP BY bin
            ORDER BY count DESC;
        """)
        bin_stats = cursor.fetchall()
        print(f"\n2025 Shot Bin distribution in {table_name}:")
        for bin_name, count in bin_stats:
            print(f"  {bin_name}: {count}")

        print(f"\n✓ Shot data for {competition} inserted successfully!")

    except Exception as e:
        print(f"Error during database operation: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

# --- 5. Insert League Averages Function ---
def insert_league_averages_to_db(shot_data_df: pd.DataFrame, competition: str):
    """
    Calculates league averages for shot zones per season and inserts them into the database.
    Only deletes and re-inserts season 2025 data.
    """
    if shot_data_df.empty:
        print(f"No shot data to process for {competition} league averages.")
        return

    # Calculate league averages per season per bin
    league_averages = shot_data_df.groupby(['Season', 'Bin']).agg(
        total_shots=('made', 'size'),
        made_shots=('made', 'sum')
    ).reset_index()

    league_averages['shot_percentage'] = (league_averages['made_shots'] / league_averages['total_shots']).fillna(0)

    print(f"\nCalculated League Averages for {competition}:")
    print(f"Total average rows to insert: {len(league_averages)}")

    conn_str = "postgresql://euroleague_owner:npg_6WgqinJyK5lz@ep-late-sun-a54sr5mz-pooler.us-east-2.aws.neon.tech/euroleague?sslmode=require"
    conn = psycopg2.connect(conn_str)
    cursor = conn.cursor()

    table_name = f"shot_data_{competition}_averages"

    try:
        # Create table if not exists
        cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id SERIAL PRIMARY KEY,
            season INTEGER NOT NULL,
            bin TEXT NOT NULL,
            total_shots INTEGER,
            made_shots INTEGER,
            shot_percentage REAL,
            UNIQUE(season, bin)
        );
        """)
        conn.commit()
        print(f"Ensured {table_name} table exists")

        # Delete only season 2025 data
        seasons_to_process = list(league_averages['Season'].unique())
        if seasons_to_process:
            seasons_str = ','.join(map(str, seasons_to_process))
            cursor.execute(f"DELETE FROM {table_name} WHERE season IN ({seasons_str})")
            deleted_count = cursor.rowcount
            conn.commit()
            print(f"Deleted {deleted_count} existing records for seasons: {seasons_to_process}")

        # Prepare data for insertion
        data_tuples = []
        for _, row in league_averages.iterrows():
            data_tuples.append((
                row["Season"],
                row["Bin"],
                row["total_shots"],
                row["made_shots"],
                row["shot_percentage"]
            ))

        print(f"Prepared {len(data_tuples)} tuples for insertion into {table_name}")

        # Insert with conflict resolution
        insert_query = f"""
        INSERT INTO {table_name} (
            season, bin, total_shots, made_shots, shot_percentage
        ) VALUES %s
        ON CONFLICT (season, bin) DO UPDATE SET
            total_shots = EXCLUDED.total_shots,
            made_shots = EXCLUDED.made_shots,
            shot_percentage = EXCLUDED.shot_percentage;
        """

        execute_values(cursor, insert_query, data_tuples)
        rows_affected = cursor.rowcount
        conn.commit()

        print(f"Insert operation affected {rows_affected} rows in {table_name}")

        # Verify data
        cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
        after_count = cursor.fetchone()[0]
        print(f"Total rows in {table_name}: {after_count}")

        # Show sample data
        cursor.execute(f"""
            SELECT season, bin, total_shots, made_shots, shot_percentage
            FROM {table_name}
            WHERE season = 2025
            ORDER BY bin
            LIMIT 10;
        """)
        sample_data = cursor.fetchall()
        print(f"\nSample 2025 data from {table_name}:")
        for row in sample_data:
            print(f"  Season: {row[0]}, Bin: {row[1]}, Total: {row[2]}, Made: {row[3]}, %: {row[4]:.4f}")

        print(f"\n✓ League averages for {competition} inserted successfully!")

    except Exception as e:
        print(f"Error during database operation for averages: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

# ============================================================================
# MAIN EXECUTION - Process 2025 season only
# ============================================================================

print("=" * 80)
print("UPDATING 2025 SHOT DATA FOR EUROLEAGUE AND EUROCUP")
print("=" * 80)

# --- EUROLEAGUE ---
print("\n### PROCESSING EUROLEAGUE ###")
shotdata_api_euroleague = ShotData(competition='E')
shot_data_euroleague = shotdata_api_euroleague.get_game_shot_data_multiple_seasons(2025, 2025)

if not shot_data_euroleague.empty:
    shot_data_euroleague = classify_shots_py(shot_data_euroleague)
    shot_data_euroleague['Bin'] = shot_data_euroleague.apply(lambda row: classify_zones_py(row, COURT_PARAMS), axis=1)
    print(f"Processed {len(shot_data_euroleague)} EuroLeague shots")

    # Insert shot data
    insert_shot_data_to_db(shot_data_euroleague, 'euroleague')

    # Insert league averages
    insert_league_averages_to_db(shot_data_euroleague, 'euroleague')
else:
    print("No EuroLeague shot data retrieved for 2025")

# --- EUROCUP ---
print("\n### PROCESSING EUROCUP ###")
shotdata_api_eurocup = ShotData(competition='U')
shot_data_eurocup = shotdata_api_eurocup.get_game_shot_data_multiple_seasons(2025, 2025)

if not shot_data_eurocup.empty:
    shot_data_eurocup = classify_shots_py(shot_data_eurocup)
    shot_data_eurocup['Bin'] = shot_data_eurocup.apply(lambda row: classify_zones_py(row, COURT_PARAMS), axis=1)
    print(f"Processed {len(shot_data_eurocup)} EuroCup shots")

    # Insert shot data
    insert_shot_data_to_db(shot_data_eurocup, 'eurocup')

    # Insert league averages
    insert_league_averages_to_db(shot_data_eurocup, 'eurocup')
else:
    print("No EuroCup shot data retrieved for 2025")

print("\n" + "=" * 80)
print("✓ ALL 4 TABLES UPDATED SUCCESSFULLY FOR 2025 SEASON!")
print("=" * 80)
print("Tables updated:")
print("1. shot_data_euroleague")
print("2. shot_data_euroleague_averages")
print("3. shot_data_eurocup")
print("4. shot_data_eurocup_averages")


# In[ ]:





# In[ ]:





# In[ ]:





# In[ ]:




