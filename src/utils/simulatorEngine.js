// src/utils/simulatorEngine.js

// Knuth's algorithm for Poisson distribution sampling
export function samplePoisson(lambda) {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > L && k < 30); // limit to 30 to avoid hang in extreme cases
  return k - 1;
}

export function poissonProbability(k, lambda) {
  if (lambda <= 0) return k === 0 ? 1.0 : 0.0;
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

export function calculateExpectedGoals(homeTeam, awayTeam, avgDefense, isNeutral) {
  // Expected goals: (AttackA * DefenseB) / AvgDefense
  let lambdaH = (homeTeam.attack_strength * awayTeam.defense_strength) / avgDefense;
  let lambdaA = (awayTeam.attack_strength * homeTeam.defense_strength) / avgDefense;

  // Apply home advantage if not neutral and team is one of the hosts
  if (!isNeutral) {
    if (["Mexico", "Canada", "United States"].includes(homeTeam.team)) {
      lambdaH *= 1.10;
      lambdaA /= 1.10;
    }
  }

  return { lambdaH, lambdaA };
}

export function simulateLiveMatchMinute(match, teamsMap, avgDefense, currentMinute) {
  // If match is already completed, do nothing
  if (match.status === 'completed') return null;

  const home = teamsMap[match.homeResolved || match.home_team];
  const away = teamsMap[match.awayResolved || match.away_team];

  if (!home || !away) return null;

  // Calculate expectations
  const { lambdaH, lambdaA } = calculateExpectedGoals(home, away, avgDefense, match.stage !== 'group-stage');

  // Probability of goal per minute
  // For 90 minutes: lambda / 90
  const minuteProbH = lambdaH / 90;
  const minuteProbA = lambdaA / 90;

  let newGoal = null;
  let homeScore = match.home_score || 0;
  let awayScore = match.away_score || 0;

  // Check if home scores
  if (Math.random() < minuteProbH) {
    homeScore += 1;
    newGoal = {
      match_number: match.match_number,
      team: 'home',
      teamName: home.team,
      minute: currentMinute,
      score: `${homeScore}-${awayScore}`
    };
  }

  // Check if away scores
  if (Math.random() < minuteProbA) {
    awayScore += 1;
    newGoal = {
      match_number: match.match_number,
      team: 'away',
      teamName: away.team,
      minute: currentMinute,
      score: `${homeScore}-${awayScore}`
    };
  }

  return {
    homeScore,
    awayScore,
    newGoal
  };
}

export function simulateFullMatch(homeTeam, awayTeam, avgDefense, isKnockout) {
  const isNeutral = isKnockout; // knockouts are neutral venues
  const { lambdaH, lambdaA } = calculateExpectedGoals(homeTeam, awayTeam, avgDefense, isNeutral);

  let homeScore = samplePoisson(lambdaH);
  let awayScore = samplePoisson(lambdaA);

  let penaltiesHome = null;
  let penaltiesAway = null;
  let wentToExtraTime = false;
  let wentToPenalties = false;

  if (isKnockout && homeScore === awayScore) {
    wentToExtraTime = true;
    // Simulate Extra Time (30 minutes)
    const lambdaET_H = lambdaH * (30 / 90);
    const lambdaET_A = lambdaA * (30 / 90);
    homeScore += samplePoisson(lambdaET_H);
    awayScore += samplePoisson(lambdaET_A);

    if (homeScore === awayScore) {
      wentToPenalties = true;
      // Simulate Penalty Shootout
      // Standard shootout: 5 shots, if tied sudden death
      let pH = 0;
      let pA = 0;
      let round = 1;
      
      // Basic penalty success rate: 75%
      const penaltySuccessRate = 0.75;

      while (pH === pA || round <= 5) {
        // Home shot
        if (Math.random() < penaltySuccessRate) pH++;
        // Away shot
        if (Math.random() < penaltySuccessRate) pA++;
        round++;
      }
      penaltiesHome = pH;
      penaltiesAway = pA;
    }
  }

  return {
    home_score: homeScore,
    away_score: awayScore,
    penalties_home: penaltiesHome,
    penalties_away: penaltiesAway,
    wentToExtraTime,
    wentToPenalties
  };
}
