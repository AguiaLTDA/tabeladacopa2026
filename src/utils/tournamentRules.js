// src/utils/tournamentRules.js

export function calculateStandings(fixtures, teamsData, matchesResults) {
  const standings = {};

  // Initialize standings for all 48 teams
  teamsData.forEach(team => {
    standings[team.team] = {
      team: team.team,
      fifa_rank: team.fifa_rank,
      elo: team.elo,
      played: 0,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      headToHead: {} // opponent_name -> points_gained
    };
  });

  // Group stage matches only
  const groupMatches = fixtures.filter(f => f.stage === 'group-stage');

  groupMatches.forEach(match => {
    const result = matchesResults[match.match_number];
    if (result && result.home_score !== null && result.away_score !== null) {
      const home = match.home_team;
      const away = match.away_team;
      const hScore = result.home_score;
      const aScore = result.away_score;

      if (!standings[home] || !standings[away]) return;

      standings[home].played += 1;
      standings[away].played += 1;
      standings[home].goalsFor += hScore;
      standings[home].goalsAgainst += aScore;
      standings[away].goalsFor += aScore;
      standings[away].goalsAgainst += hScore;

      if (hScore > aScore) {
        standings[home].points += 3;
        standings[home].wins += 1;
        standings[away].losses += 1;
        standings[home].headToHead[away] = (standings[home].headToHead[away] || 0) + 3;
        standings[away].headToHead[home] = (standings[away].headToHead[home] || 0) + 0;
      } else if (hScore < aScore) {
        standings[away].points += 3;
        standings[away].wins += 1;
        standings[home].losses += 1;
        standings[away].headToHead[home] = (standings[away].headToHead[home] || 0) + 3;
        standings[home].headToHead[away] = (standings[home].headToHead[away] || 0) + 0;
      } else {
        standings[home].points += 1;
        standings[away].points += 1;
        standings[home].draws += 1;
        standings[away].draws += 1;
        standings[home].headToHead[away] = (standings[home].headToHead[away] || 0) + 1;
        standings[away].headToHead[home] = (standings[away].headToHead[home] || 0) + 1;
      }
    }
  });

  // Calculate goal differences
  Object.keys(standings).forEach(team => {
    standings[team].goalDifference = standings[team].goalsFor - standings[team].goalsAgainst;
  });

  // Group teams by their World Cup group (A to L)
  const groups = {};
  fixtures.forEach(match => {
    if (match.stage === 'group-stage') {
      const g = match.group;
      if (!groups[g]) groups[g] = new Set();
      groups[g].add(match.home_team);
      groups[g].add(match.away_team);
    }
  });

  const groupStandings = {};
  Object.keys(groups).forEach(g => {
    const teamList = Array.from(groups[g]).map(teamName => standings[teamName]);

    // Sort group teams using FIFA tiebreakers
    teamList.sort((a, b) => {
      // 1. Points
      if (b.points !== a.points) return b.points - a.points;
      // 2. Goal Difference
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      // 3. Goals Scored
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

      // 4. Head-to-Head points (only if 2 teams are tied, simplified head-to-head points check)
      const aH2h = a.headToHead[b.team] || 0;
      const bH2h = b.headToHead[a.team] || 0;
      if (bH2h !== aH2h) return bH2h - aH2h;

      // 5. FIFA Rank (lower is better rank)
      return a.fifa_rank - b.fifa_rank;
    });

    groupStandings[g] = teamList;
  });

  return groupStandings;
}

export function getBestThirdPlacedTeams(groupStandings) {
  const thirds = [];
  Object.keys(groupStandings).forEach(g => {
    const list = groupStandings[g];
    if (list && list.length >= 3) {
      thirds.push({
        group: g,
        team: list[2].team,
        points: list[2].points,
        goalDifference: list[2].goalDifference,
        goalsFor: list[2].goalsFor,
        wins: list[2].wins,
        fifa_rank: list[2].fifa_rank
      });
    }
  });

  // Sort thirds
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.fifa_rank - b.fifa_rank;
  });

  return thirds.slice(0, 8); // Top 8 third-placed teams qualify
}

export function allocateThirdPlaces(bestThirds) {
  const slots = [
    { matchNumber: 74, allowedGroups: ['A', 'B', 'C', 'D', 'F'], opponentGroup: 'E' },
    { matchNumber: 77, allowedGroups: ['C', 'D', 'F', 'G', 'H'], opponentGroup: 'I' },
    { matchNumber: 79, allowedGroups: ['C', 'E', 'F', 'H', 'I'], opponentGroup: 'A' },
    { matchNumber: 80, allowedGroups: ['E', 'H', 'I', 'J', 'K'], opponentGroup: 'L' },
    { matchNumber: 81, allowedGroups: ['B', 'E', 'F', 'I', 'J'], opponentGroup: 'D' },
    { matchNumber: 82, allowedGroups: ['A', 'E', 'H', 'I', 'J'], opponentGroup: 'G' },
    { matchNumber: 85, allowedGroups: ['E', 'F', 'G', 'I', 'J'], opponentGroup: 'B' },
    { matchNumber: 87, allowedGroups: ['D', 'E', 'I', 'J', 'L'], opponentGroup: 'K' }
  ];

  const assignment = {};
  const usedThirds = new Set();

  function backtrack(slotIndex) {
    if (slotIndex === slots.length) return true;
    const slot = slots[slotIndex];

    for (let i = 0; i < bestThirds.length; i++) {
      if (usedThirds.has(i)) continue;
      const third = bestThirds[i];

      if (slot.allowedGroups.includes(third.group) && slot.opponentGroup !== third.group) {
        assignment[slot.matchNumber] = third.team;
        usedThirds.add(i);
        if (backtrack(slotIndex + 1)) return true;
        usedThirds.delete(i);
        delete assignment[slot.matchNumber];
      }
    }

    // Relax constraint: allow opponentGroup === third.group if absolutely needed
    for (let i = 0; i < bestThirds.length; i++) {
      if (usedThirds.has(i)) continue;
      const third = bestThirds[i];
      if (slot.allowedGroups.includes(third.group)) {
        assignment[slot.matchNumber] = third.team;
        usedThirds.add(i);
        if (backtrack(slotIndex + 1)) return true;
        usedThirds.delete(i);
        delete assignment[slot.matchNumber];
      }
    }
    return false;
  }

  if (backtrack(0)) {
    return assignment;
  }

  // Fallback
  const fallback = {};
  slots.forEach((slot, index) => {
    if (index < bestThirds.length) {
      fallback[slot.matchNumber] = bestThirds[index].team;
    }
  });
  return fallback;
}

export function determineKnockoutMatches(fixtures, groupStandings, bestThirdsAllocation, matchesResults) {
  const knockoutMatches = {};

  // Initialize all matches mapping
  fixtures.forEach(match => {
    if (match.stage !== 'group-stage') {
      knockoutMatches[match.match_number] = {
        ...match,
        homeResolved: null,
        awayResolved: null,
        status: 'pending' // pending, live, completed
      };
    }
  });

  // Resolve Round of 32
  const r32Matches = fixtures.filter(f => f.stage === 'round-of-32');
  r32Matches.forEach(match => {
    const num = match.match_number;
    let home = '';
    let away = '';

    if (num === 73) {
      home = groupStandings['A']?.[1]?.team || '2º Grupo A';
      away = groupStandings['B']?.[1]?.team || '2º Grupo B';
    } else if (num === 74) {
      home = groupStandings['E']?.[0]?.team || '1º Grupo E';
      away = bestThirdsAllocation[74] || '3º A/B/C/D/F';
    } else if (num === 75) {
      home = groupStandings['F']?.[0]?.team || '1º Grupo F';
      away = groupStandings['C']?.[1]?.team || '2º Grupo C';
    } else if (num === 76) {
      home = groupStandings['C']?.[0]?.team || '1º Grupo C';
      away = groupStandings['F']?.[1]?.team || '2º Grupo F';
    } else if (num === 77) {
      home = groupStandings['I']?.[0]?.team || '1º Grupo I';
      away = bestThirdsAllocation[77] || '3º C/D/F/G/H';
    } else if (num === 78) {
      home = groupStandings['E']?.[1]?.team || '2º Grupo E';
      away = groupStandings['I']?.[1]?.team || '2º Grupo I';
    } else if (num === 79) {
      home = groupStandings['A']?.[0]?.team || '1º Grupo A';
      away = bestThirdsAllocation[79] || '3º C/E/F/H/I';
    } else if (num === 80) {
      home = groupStandings['L']?.[0]?.team || '1º Grupo L';
      away = bestThirdsAllocation[80] || '3º E/H/I/J/K';
    } else if (num === 81) {
      home = groupStandings['D']?.[0]?.team || '1º Grupo D';
      away = bestThirdsAllocation[81] || '3º B/E/F/I/J';
    } else if (num === 82) {
      home = groupStandings['G']?.[0]?.team || '1º Grupo G';
      away = bestThirdsAllocation[82] || '3º A/E/H/I/J';
    } else if (num === 83) {
      home = groupStandings['K']?.[1]?.team || '2º Grupo K';
      away = groupStandings['L']?.[1]?.team || '2º Grupo L';
    } else if (num === 84) {
      home = groupStandings['H']?.[0]?.team || '1º Grupo H';
      away = groupStandings['J']?.[1]?.team || '2º Grupo J';
    } else if (num === 85) {
      home = groupStandings['B']?.[0]?.team || '1º Grupo B';
      away = bestThirdsAllocation[85] || '3º E/F/G/I/J';
    } else if (num === 86) {
      home = groupStandings['J']?.[0]?.team || '1º Grupo J';
      away = groupStandings['H']?.[1]?.team || '2º Grupo H';
    } else if (num === 87) {
      home = groupStandings['K']?.[0]?.team || '1º Grupo K';
      away = bestThirdsAllocation[87] || '3º D/E/I/J/L';
    } else if (num === 88) {
      home = groupStandings['D']?.[1]?.team || '2º Grupo D';
      away = groupStandings['G']?.[1]?.team || '2º Grupo G';
    }

    knockoutMatches[num].homeResolved = home;
    knockoutMatches[num].awayResolved = away;
  });

  // Helper to resolve winner of a match number
  function getWinner(matchNum) {
    const result = matchesResults[matchNum];
    if (result && result.home_score !== null && result.away_score !== null) {
      if (result.home_score > result.away_score) {
        return knockoutMatches[matchNum].homeResolved;
      } else if (result.home_score < result.away_score) {
        return knockoutMatches[matchNum].awayResolved;
      } else {
        // If draw, check penalties
        if (result.penalties_home > result.penalties_away) {
          return knockoutMatches[matchNum].homeResolved;
        } else if (result.penalties_home < result.penalties_away) {
          return knockoutMatches[matchNum].awayResolved;
        }
        // Fallback: home team wins
        return knockoutMatches[matchNum].homeResolved;
      }
    }
    return null;
  }

  // Helper to resolve loser of a match number (for 3rd place match)
  function getLoser(matchNum) {
    const result = matchesResults[matchNum];
    if (result && result.home_score !== null && result.away_score !== null) {
      if (result.home_score > result.away_score) {
        return knockoutMatches[matchNum].awayResolved;
      } else if (result.home_score < result.away_score) {
        return knockoutMatches[matchNum].homeResolved;
      } else {
        if (result.penalties_home > result.penalties_away) {
          return knockoutMatches[matchNum].awayResolved;
        } else {
          return knockoutMatches[matchNum].homeResolved;
        }
      }
    }
    return null;
  }

  // Resolve sequential knockout stages (R16, QF, SF, 3rd, Final)
  const stages = ['round-of-16', 'quarter-finals', 'semi-finals', 'third-place', 'final'];
  stages.forEach(stage => {
    const stageMatches = fixtures.filter(f => f.stage === stage);
    stageMatches.forEach(match => {
      const num = match.match_number;
      let home = '';
      let away = '';

      // Match details are defined in fixtures.csv like "Winner Match XX" or "Loser Match XX"
      // Home team
      const homeText = match.home_team;
      const homeMatch = homeText.match(/Winner Match (\d+)/i);
      const homeLoserMatch = homeText.match(/Loser Match (\d+)/i);
      if (homeMatch) {
        const parentNum = parseInt(homeMatch[1]);
        home = getWinner(parentNum) || `Vencedor Jogo ${parentNum}`;
      } else if (homeLoserMatch) {
        const parentNum = parseInt(homeLoserMatch[1]);
        home = getLoser(parentNum) || `Perdedor Jogo ${parentNum}`;
      } else {
        home = homeText;
      }

      // Away team
      const awayText = match.away_team;
      const awayMatch = awayText.match(/Winner Match (\d+)/i);
      const awayLoserMatch = awayText.match(/Loser Match (\d+)/i);
      if (awayMatch) {
        const parentNum = parseInt(awayMatch[1]);
        away = getWinner(parentNum) || `Vencedor Jogo ${parentNum}`;
      } else if (awayLoserMatch) {
        const parentNum = parseInt(awayLoserMatch[1]);
        away = getLoser(parentNum) || `Perdedor Jogo ${parentNum}`;
      } else {
        away = awayText;
      }

      knockoutMatches[num].homeResolved = home;
      knockoutMatches[num].awayResolved = away;
    });
  });

  return knockoutMatches;
}
