// src/utils/predictionEngine.js

import { poissonProbability, samplePoisson, calculateExpectedGoals } from './simulatorEngine';

// Get Poisson match prediction details
export function predictMatch(teamA, teamB, avgDefense) {
  if (!teamA || !teamB) return null;

  const { lambdaH, lambdaA } = calculateExpectedGoals(teamA, teamB, avgDefense, true);

  let winA = 0;
  let winB = 0;
  let draw = 0;
  let over1_5 = 0;
  let over2_5 = 0;
  let btts = 0;
  let maxProb = -1;
  let bestScore = [0, 0];

  for (let x = 0; x < 10; x++) {
    const probX = poissonProbability(x, lambdaH);
    for (let y = 0; y < 10; y++) {
      const probY = poissonProbability(y, lambdaA);
      const probXY = probX * probY;

      if (x > y) winA += probXY;
      else if (x < y) winB += probXY;
      else draw += probXY;

      if (x + y > 1) over1_5 += probXY;
      if (x + y > 2) over2_5 += probXY;
      if (x > 0 && y > 0) btts += probXY;

      if (probXY > maxProb) {
        maxProb = probXY;
        bestScore = [x, y];
      }
    }
  }

  const sumP = winA + winB + draw;
  winA /= sumP;
  winB /= sumP;
  draw /= sumP;

  return {
    winA,
    winB,
    draw,
    over1_5,
    over2_5,
    btts,
    lambdaA: lambdaH,
    lambdaB: lambdaA,
    predictedScore: bestScore,
    predictedScoreChance: maxProb
  };
}

// Trace routes for 1st vs 2nd place
// Maps group -> position -> array of match steps
export const PATH_STEPS = {
  A: {
    '1st': { r32: 79, r16: 92, qf: 99, sf: 102, opposingGroups: { r32: ['C', 'E', 'F', 'H', 'I'], r16: ['L', 'E', 'H', 'I', 'J', 'K'] } },
    '2nd': { r32: 73, r16: 90, qf: 97, sf: 101, opposingGroups: { r32: ['B'], r16: ['F', 'C'] } }
  },
  B: {
    '1st': { r32: 85, r16: 96, qf: 100, sf: 102, opposingGroups: { r32: ['E', 'F', 'G', 'I', 'J'], r16: ['K', 'D', 'L'] } },
    '2nd': { r32: 73, r16: 90, qf: 97, sf: 101, opposingGroups: { r32: ['A'], r16: ['F', 'C'] } }
  },
  C: {
    '1st': { r32: 76, r16: 91, qf: 99, sf: 102, opposingGroups: { r32: ['F'], r16: ['E', 'I'] } },
    '2nd': { r32: 75, r16: 90, qf: 97, sf: 101, opposingGroups: { r32: ['F'], r16: ['A', 'B'] } }
  },
  D: {
    '1st': { r32: 81, r16: 94, qf: 98, sf: 101, opposingGroups: { r32: ['B', 'E', 'F', 'I', 'J'], r16: ['G', 'A', 'H'] } },
    '2nd': { r32: 88, r16: 95, qf: 100, sf: 102, opposingGroups: { r32: ['G'], r16: ['J', 'H'] } }
  },
  E: {
    '1st': { r32: 74, r16: 89, qf: 97, sf: 101, opposingGroups: { r32: ['A', 'B', 'C', 'D', 'F'], r16: ['I', 'C', 'G', 'H'] } },
    '2nd': { r32: 78, r16: 91, qf: 99, sf: 102, opposingGroups: { r32: ['I'], r16: ['C', 'F'] } }
  },
  F: {
    '1st': { r32: 75, r16: 90, qf: 97, sf: 101, opposingGroups: { r32: ['C'], r16: ['A', 'B'] } },
    '2nd': { r32: 76, r16: 91, qf: 99, sf: 102, opposingGroups: { r32: ['C'], r16: ['E', 'I'] } }
  },
  G: {
    '1st': { r32: 82, r16: 94, qf: 98, sf: 101, opposingGroups: { r32: ['A', 'E', 'H', 'I', 'J'], r16: ['D', 'B', 'F'] } },
    '2nd': { r32: 88, r16: 95, qf: 100, sf: 102, opposingGroups: { r32: ['D'], r16: ['J', 'H'] } }
  },
  H: {
    '1st': { r32: 84, r16: 93, qf: 98, sf: 101, opposingGroups: { r32: ['J'], r16: ['K', 'L'] } },
    '2nd': { r32: 86, r16: 95, qf: 100, sf: 102, opposingGroups: { r32: ['J'], r16: ['D', 'G'] } }
  },
  I: {
    '1st': { r32: 77, r16: 89, qf: 97, sf: 101, opposingGroups: { r32: ['C', 'D', 'F', 'G', 'H'], r16: ['E', 'A', 'B'] } },
    '2nd': { r32: 78, r16: 91, qf: 99, sf: 102, opposingGroups: { r32: ['E'], r16: ['C', 'F'] } }
  },
  J: {
    '1st': { r32: 86, r16: 95, qf: 100, sf: 102, opposingGroups: { r32: ['H'], r16: ['D', 'G'] } },
    '2nd': { r32: 84, r16: 93, qf: 98, sf: 101, opposingGroups: { r32: ['H'], r16: ['K', 'L'] } }
  },
  K: {
    '1st': { r32: 87, r16: 96, qf: 100, sf: 102, opposingGroups: { r32: ['D', 'E', 'I', 'J', 'L'], r16: ['B', 'F', 'G'] } },
    '2nd': { r32: 83, r16: 93, qf: 98, sf: 101, opposingGroups: { r32: ['L'], r16: ['H', 'J'] } }
  },
  L: {
    '1st': { r32: 80, r16: 92, qf: 99, sf: 102, opposingGroups: { r32: ['E', 'H', 'I', 'J', 'K'], r16: ['A', 'C', 'F'] } },
    '2nd': { r32: 83, r16: 93, qf: 98, sf: 101, opposingGroups: { r32: ['K'], r16: ['H', 'J'] } }
  }
};

// Calculate the average Elo of teams in group(s)
function getAverageGroupElo(groups, teamsData, fixtures) {
  const teamsInGroups = new Set();
  
  // Find which teams are in which group
  fixtures.forEach(f => {
    if (f.stage === 'group-stage' && groups.includes(f.group)) {
      teamsInGroups.add(f.home_team);
      teamsInGroups.add(f.away_team);
    }
  });

  if (teamsInGroups.size === 0) return 1750; // default baseline

  const elos = Array.from(teamsInGroups).map(teamName => {
    const t = teamsData.find(td => td.team === teamName);
    return t ? t.elo : 1600;
  });

  return elos.reduce((a, b) => a + b, 0) / elos.length;
}

// Get expected difficulty (Elo) of opponent at each knockout stage
export function analyzePathDifficulty(groupName, teamsData, fixtures) {
  const paths = PATH_STEPS[groupName];
  if (!paths) return null;

  const result = {
    '1st': { r32Elo: 0, r16Elo: 0, qfElo: 0, sfElo: 0, avgElo: 0, steps: paths['1st'] },
    '2nd': { r32Elo: 0, r16Elo: 0, qfElo: 0, sfElo: 0, avgElo: 0, steps: paths['2nd'] }
  };

  ['1st', '2nd'].forEach(pos => {
    const steps = paths[pos];
    
    // 1. Round of 32 Opponent Elo
    if (pos === '1st') {
      // 1st place plays a 3rd placed team from opposingGroups.r32
      // 3rd placed teams have lower Elo, we adjust average Elo by -100 points
      const groupAvg = getAverageGroupElo(steps.opposingGroups.r32, teamsData, fixtures);
      result[pos].r32Elo = Math.round(groupAvg - 100);
    } else {
      // 2nd place plays runner up of opposingGroups.r32 (which is 1 specific group)
      const groupAvg = getAverageGroupElo(steps.opposingGroups.r32, teamsData, fixtures);
      result[pos].r32Elo = Math.round(groupAvg);
    }

    // 2. Round of 16 Opponent Elo
    // Plays winner of another R32 match, which typically comes from opposingGroups.r16
    const r16GroupAvg = getAverageGroupElo(steps.opposingGroups.r16, teamsData, fixtures);
    // Winner will be one of the stronger teams, so add +30 Elo
    result[pos].r16Elo = Math.round(r16GroupAvg + 30);

    // 3. Quarterfinal Opponent Elo
    // On average, QF opponents are top teams. Let's sample the opposite half of their QF bracket
    // We can estimate QF difficulty based on the average Elo of the top 16 teams overall
    const sortedElos = [...teamsData].sort((a, b) => b.elo - a.elo);
    const top16Avg = sortedElos.slice(0, 16).reduce((sum, t) => sum + t.elo, 0) / 16;
    result[pos].qfElo = Math.round((result[pos].r16Elo + top16Avg) / 2);

    // 4. Semifinal Opponent Elo
    const top8Avg = sortedElos.slice(0, 8).reduce((sum, t) => sum + t.elo, 0) / 8;
    result[pos].sfElo = Math.round((result[pos].qfElo + top8Avg) / 2);

    // 5. Average path Elo
    result[pos].avgElo = Math.round(
      (result[pos].r32Elo + result[pos].r16Elo + result[pos].qfElo + result[pos].sfElo) / 4
    );
  });

  // Recommendation
  const diff = result['1st'].avgElo - result['2nd'].avgElo;
  let recommendation = '';
  let advantagePercent = Math.abs(diff) / 20; // estimate scale
  advantagePercent = Math.min(Math.round(advantagePercent), 15); // cap at 15%

  if (diff < -15) {
    recommendation = `Passar em 1º lugar é melhor (Caminho cerca de ${advantagePercent}% mais fácil).`;
  } else if (diff > 15) {
    recommendation = `Passar em 2º lugar é melhor (Caminho cerca de ${advantagePercent}% mais fácil).`;
  } else {
    recommendation = `Os caminhos são equilibrados. A preferência é passar em 1º para pegar um 3º colocado nos 32 avos.`;
  }

  return {
    group: groupName,
    '1st': result['1st'],
    '2nd': result['2nd'],
    diff,
    recommendation
  };
}
