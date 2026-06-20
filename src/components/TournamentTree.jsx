// src/components/TournamentTree.jsx
import React from 'react';

export default function TournamentTree({
  knockoutMatches,
  matchesResults,
  onTeamClick
}) {
  // Ordered match numbers to align them visually
  const r32Order = [73, 75, 74, 77, 76, 78, 79, 80, 83, 84, 81, 82, 86, 88, 85, 87];
  const r16Order = [90, 89, 91, 92, 93, 94, 95, 96];
  const qfOrder = [97, 99, 98, 100];
  const sfOrder = [101, 102];
  const finalOrder = [104, 103]; // Final first, then 3rd Place

  const getFlagPlaceholder = (teamName) => {
    if (!teamName || teamName.startsWith('Vencedor') || teamName.startsWith('Perdedor') || teamName.includes('Grupo') || teamName.includes('third')) {
      return '?';
    }
    return teamName.substring(0, 3).toUpperCase();
  };

  const renderMatchCard = (matchNumber) => {
    const match = knockoutMatches[matchNumber];
    if (!match) return null;

    const result = matchesResults[matchNumber] || { 
      home_score: null, 
      away_score: null, 
      penalties_home: null, 
      penalties_away: null, 
      status: 'pending' 
    };

    const isLive = result.status === 'live';
    const isCompleted = result.status === 'completed';

    const home = match.homeResolved || match.home_team;
    const away = match.awayResolved || match.away_team;

    // Check if team is a resolved country or placeholder
    const isHomePlaceholder = home.startsWith('Vencedor') || home.startsWith('Perdedor') || home.includes('Grupo') || home.includes('third');
    const isAwayPlaceholder = away.startsWith('Vencedor') || away.startsWith('Perdedor') || away.includes('Grupo') || away.includes('third');

    const homeScore = result.home_score;
    const awayScore = result.away_score;
    const isHomeWinner = isCompleted && (homeScore > awayScore || (homeScore === awayScore && result.penalties_home > result.penalties_away));
    const isAwayWinner = isCompleted && (awayScore > homeScore || (homeScore === awayScore && result.penalties_away > result.penalties_home));

    return (
      <div 
        key={matchNumber} 
        className={`bracket-match-node ${isLive ? 'active-simulate' : ''}`}
        style={{ opacity: isCompleted ? 0.9 : 1 }}
      >
        {/* Match Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span>Jogo {matchNumber} • {match.stage === 'third-place' ? '3º Lugar' : match.stage.toUpperCase().replace('-', ' ')}</span>
          <span style={{ color: isLive ? 'var(--danger)' : isCompleted ? 'var(--text-dim)' : 'var(--accent-secondary)' }}>
            {isLive ? '🔴 LIVE' : isCompleted ? 'FIM' : match.date}
          </span>
        </div>

        {/* Home Team */}
        <div className={`bracket-team-row ${isHomeWinner ? 'winner' : ''}`}>
          <div 
            className="bracket-team-name" 
            style={{ cursor: !isHomePlaceholder ? 'pointer' : 'default' }}
            onClick={() => !isHomePlaceholder && onTeamClick(home)}
          >
            <span className="team-flag-placeholder">{getFlagPlaceholder(home)}</span>
            <span style={{ color: isHomePlaceholder ? 'var(--text-dim)' : 'var(--text-main)' }}>{home}</span>
          </div>
          <span className="bracket-team-score" style={{ color: isHomeWinner ? 'var(--success)' : '' }}>
            {homeScore !== null ? homeScore : ''}
            {result.penalties_home !== null && ` (${result.penalties_home})`}
          </span>
        </div>

        {/* Away Team */}
        <div className={`bracket-team-row ${isAwayWinner ? 'winner' : ''}`}>
          <div 
            className="bracket-team-name" 
            style={{ cursor: !isAwayPlaceholder ? 'pointer' : 'default' }}
            onClick={() => !isAwayPlaceholder && onTeamClick(away)}
          >
            <span className="team-flag-placeholder">{getFlagPlaceholder(away)}</span>
            <span style={{ color: isAwayPlaceholder ? 'var(--text-dim)' : 'var(--text-main)' }}>{away}</span>
          </div>
          <span className="bracket-team-score" style={{ color: isAwayWinner ? 'var(--success)' : '' }}>
            {awayScore !== null ? awayScore : ''}
            {result.penalties_away !== null && ` (${result.penalties_away})`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bracket-scroll-container">
      <div className="bracket-container">
        
        {/* Round of 32 */}
        <div className="bracket-round">
          <div className="bracket-round-title">32 avos de final</div>
          {r32Order.map(num => renderMatchCard(num))}
        </div>

        {/* Round of 16 */}
        <div className="bracket-round">
          <div className="bracket-round-title">Oitavas de final</div>
          {r16Order.map(num => renderMatchCard(num))}
        </div>

        {/* Quarter-finals */}
        <div className="bracket-round">
          <div className="bracket-round-title">Quartas de final</div>
          {qfOrder.map(num => renderMatchCard(num))}
        </div>

        {/* Semi-finals */}
        <div className="bracket-round">
          <div className="bracket-round-title">Semifinais</div>
          {sfOrder.map(num => renderMatchCard(num))}
        </div>

        {/* Finals */}
        <div className="bracket-round">
          <div className="bracket-round-title">Finais</div>
          {finalOrder.map(num => renderMatchCard(num))}
        </div>

      </div>
    </div>
  );
}
