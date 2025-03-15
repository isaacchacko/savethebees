import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

async function getPUUID(gameName: string, tagLine: string) {
  const response = await fetch(
    `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${RIOT_API_KEY}`
  );
  if (!response.ok) throw new Error(`PUUID Request Failed: ${response.statusText}`);
  return response.json();
}

async function getMatchHistory(puuid: string, count: number = 10) {
  const response = await fetch(
    `https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}&api_key=${RIOT_API_KEY}`
  );
  if (!response.ok) throw new Error(`Match History Request Failed: ${response.statusText}`);
  return response.json();
}

async function getRank(summonerId: string) {
  const response = await fetch(
    `https://na1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`
  );
  if (!response.ok) throw new Error(`Rank Request Failed: ${response.statusText}`);
  const data = await response.json();
  return data.find(entry => entry.queueType === "RANKED_SOLO_5x5") || {};
}

async function calculateAverageCSPerMinute(puuid: string) {
  const matchIds = await getMatchHistory(puuid);
  let totalCSPerMinute = 0;
  let gamesProcessed = 0;

  for (const matchId of matchIds) {
    try {
      const matchResponse = await fetch(
        `https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${RIOT_API_KEY}`
      );
      const match = await matchResponse.json();
      
      if (!match.info?.participants) continue;

      const participant = match.info.participants.find((p) => p.puuid === puuid);
      if (participant) {
        const totalCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
        const gameMinutes = match.info.gameDuration / 60;
        totalCSPerMinute += totalCS / gameMinutes;
        gamesProcessed++;
      }
    } catch (error) {
      console.error(`Error processing match ${matchId}:`, error);
    }
  }

  return {
    averageCSPerMinute: gamesProcessed > 0 ? (totalCSPerMinute / gamesProcessed).toFixed(2) : '0.00',
    gamesAnalyzed: gamesProcessed
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gameName = searchParams.get('gameName');
  const tagLine = searchParams.get('tagLine');

  if (!gameName || !tagLine) {
    return NextResponse.json({ error: 'Missing gameName or tagLine' }, { status: 400 });
  }

  try {
    // Get account info
    const { puuid } = await getPUUID(gameName, tagLine);
    
    // Get summoner info for rank data
    const summonerResponse = await fetch(
      `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`
    );
    const summonerData = await summonerResponse.json();
    
    // Get stats
    const { averageCSPerMinute, gamesAnalyzed } = await calculateAverageCSPerMinute(puuid);
    const rankData = await getRank(summonerData.id);

    return NextResponse.json({
      gameName,
      tagLine,
      tier: rankData.tier || 'UNRANKED',
      rank: rankData.rank || 'N/A',
      wins: rankData.wins || 0,
      losses: rankData.losses || 0,
      averageCSPerMinute,
      gamesAnalyzed
    });

  } catch (error) {
    console.error('Error fetching LoL stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LoL stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
