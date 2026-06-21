// src/components/GroupStage.jsx
import React, { useState } from 'react';
import { formatKickoff } from '../utils/dateFormatter';

export default function GroupStage({
  groupStandings,
  fixtures,
  matchesResults,
  bestThirds,
  onTeamClick
}) {
  const [selectedGroup, setSelectedGroup] = useState('ALL');

  // Groups list A to L
  const groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const bestThirdsTeams = bestThirds.map(bt => bt.team);

  const getQualifyClass = (index, teamName) => {
    if (index === 0) return 'standings-row-qualify-1';
    if (index === 1) return 'standings-row-qualify-2';
    if (index === 2 && bestThirdsTeams.includes(teamName)) return 'standings-row-qualify-3';
    return '';
  };

  const getFlagPlaceholder = (teamName) => {
    return teamName.substring(0, 3).toUpperCase();
  };

  // Filter fixtures
  const groupMatches = fixtures.filter(f => f.stage === 'group-stage');
  const filteredMatches = selectedGroup === 'ALL' 
    ? groupMatches 
    : groupMatches.filter(m => m.group === selectedGroup);

  return (
    <div>
      {/* Group Selector */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem', justifyContent: 'center' }}>
        <button 
          className={`btn ${selectedGroup === 'ALL' ? 'btn-secondary' : ''}`}
          onClick={() => setSelectedGroup('ALL')}
        >
          🌐 Todos os Grupos
        </button>
        {groupsList.map(g => (
          <button 
            key={g} 
            className={`btn ${selectedGroup === g ? 'btn-secondary' : ''}`}
            onClick={() => setSelectedGroup(g)}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      {/* Group Standings Grid */}
      <div className="group-stage-grid">
        {groupsList.filter(g => selectedGroup === 'ALL' || selectedGroup === g).map(g => {
          const standings = groupStandings[g] || [];
          return (
            <div key={g} className="glass-card" style={{ padding: '1.2rem' }}>
              <div className="group-title">Grupo {g}</div>
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th style={{ textAlign: 'left' }}>Seleção</th>
                    <th>P</th>
                    <th>J</th>
                    <th>V</th>
                    <th>SG</th>
                    <th>GP</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr key={row.team} className={getQualifyClass(index, row.team)}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{index + 1}</td>
                      <td className="team-cell" onClick={() => onTeamClick(row.team)}>
                        <span className="team-flag-placeholder">{getFlagPlaceholder(row.team)}</span>
                        {row.team}
                      </td>
                      <td style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{row.points}</td>
                      <td>{row.played}</td>
                      <td>{row.wins}</td>
                      <td style={{ color: row.goalDifference > 0 ? 'var(--success)' : row.goalDifference < 0 ? 'var(--danger)' : '' }}>
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td>{row.goalsFor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* Best Thirds Rankings Summary (only shown when view is ALL) */}
      {selectedGroup === 'ALL' && bestThirds.length > 0 && (
        <div className="glass-card" style={{ marginTop: '2rem', maxWidth: '600px', marginInline: 'auto' }}>
          <div className="group-title" style={{ borderColor: 'var(--warning)' }}>Classificação dos 3ºs Colocados (Top 8 Avançam)</div>
          <table className="standings-table">
            <thead>
              <tr>
                <th>#</th>
                <th style={{ textAlign: 'left' }}>Seleção</th>
                <th>Gp</th>
                <th>P</th>
                <th>SG</th>
                <th>GP</th>
                <th>V</th>
              </tr>
            </thead>
            <tbody>
              {bestThirds.map((row, index) => (
                <tr key={row.team} style={{ backgroundColor: index < 8 ? 'rgba(16, 185, 129, 0.04)' : '' }}>
                  <td style={{ fontWeight: 'bold', color: index < 8 ? 'var(--success)' : 'var(--text-dim)' }}>
                    {index + 1}º {index < 8 ? '✅' : '❌'}
                  </td>
                  <td className="team-cell" onClick={() => onTeamClick(row.team)}>
                    <span className="team-flag-placeholder">{getFlagPlaceholder(row.team)}</span>
                    {row.team}
                  </td>
                  <td>{row.group}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{row.points}</td>
                  <td style={{ color: row.goalDifference > 0 ? 'var(--success)' : row.goalDifference < 0 ? 'var(--danger)' : '' }}>
                    {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                  </td>
                  <td>{row.goalsFor}</td>
                  <td>{row.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Matches List */}
      <div className="matches-section">
        <h2 className="section-title">Partidas da Fase de Grupos</h2>
        <div className="matches-grid">
          {filteredMatches.map(match => {
            const result = matchesResults[match.match_number] || { home_score: null, away_score: null, status: 'pending' };
            const isLive = result.status === 'live';
            const isCompleted = result.status === 'completed';

            return (
              <div key={match.match_number} className={`match-card ${isLive ? 'live' : ''} ${isCompleted ? 'completed' : ''}`}>
                <div className="match-header" style={{ marginBottom: '0.4rem', paddingBottom: '0.2rem' }}>
                  <span>Jogo {match.match_number} • Grupo {match.group}</span>
                  <span style={{ 
                    color: isLive ? 'var(--danger)' : isCompleted ? 'var(--text-dim)' : 'var(--text-dim)',
                    fontWeight: 'bold',
                    fontSize: '0.7rem'
                  }}>
                    {isLive ? '🔴 AO VIVO' : isCompleted ? 'CONCLUÍDO' : 'AGUARDANDO'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--accent-secondary)', marginBottom: '0.8rem', opacity: 0.9 }}>
                  <span>📅 {formatKickoff(match.kickoff_utc, match.date)}</span>
                </div>
                <div className="match-teams">
                  <div className="match-team-row">
                    <div className="match-team-info" onClick={() => onTeamClick(match.home_team)}>
                      <span className="team-flag-placeholder">{getFlagPlaceholder(match.home_team)}</span>
                      <span>{match.home_team}</span>
                    </div>
                    <span className="match-score">
                      {result.home_score !== null ? result.home_score : '-'}
                    </span>
                  </div>
                  <div className="match-team-row">
                    <div className="match-team-info" onClick={() => onTeamClick(match.away_team)}>
                      <span className="team-flag-placeholder">{getFlagPlaceholder(match.away_team)}</span>
                      <span>{match.away_team}</span>
                    </div>
                    <span className="match-score">
                      {result.away_score !== null ? result.away_score : '-'}
                    </span>
                  </div>
                </div>
                <div className="match-footer">
                  <span>🏟️ {match.stadium}</span>
                  <span>📍 {match.host_city}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
