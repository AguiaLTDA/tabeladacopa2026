// src/components/GroupStage.jsx
import React, { useState } from 'react';
import { formatKickoff } from '../utils/dateFormatter';

export default function GroupStage({
  groupStandings,
  fixtures,
  matchesResults,
  bestThirds,
  onTeamClick,
  viewMode = 'ALL'
}) {
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('ALL');

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

  // Get unique dates for group matches
  const uniqueDates = React.useMemo(() => {
    const dates = [...new Set(groupMatches.map(m => m.date))];
    dates.sort(); // Sort chronologically (YYYY-MM-DD)
    return dates.map(d => {
      const matchForDate = groupMatches.find(m => m.date === d);
      let label = d;
      if (matchForDate && matchForDate.kickoff_utc) {
        try {
          const dateObj = new Date(matchForDate.kickoff_utc);
          if (!isNaN(dateObj.getTime())) {
            const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
            const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
            const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            label = `${capWeekday}, ${dateStr}`;
          }
        } catch (e) {}
      }
      return { raw: d, formatted: label };
    });
  }, [fixtures, groupMatches]);

  const filteredMatches = groupMatches.filter(m => {
    const matchesGroup = selectedGroup === 'ALL' || m.group === selectedGroup;
    const matchesDate = selectedDate === 'ALL' || m.date === selectedDate;
    return matchesGroup && matchesDate;
  });

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
      {(viewMode === 'ALL' || viewMode === 'STANDINGS') && (
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
      )}

      {/* Best Thirds Rankings Summary */}
      {(viewMode === 'ALL' || viewMode === 'STANDINGS') && selectedGroup === 'ALL' && bestThirds.length > 0 && (
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
      {(viewMode === 'ALL' || viewMode === 'MATCHES') && (
        <div className="matches-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Partidas da Fase de Grupos</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📅 Filtrar por Dia:</span>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ 
                  background: 'var(--card-bg)', 
                  border: '1px solid var(--card-border)', 
                  color: 'var(--text-main)', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '160px',
                  transition: 'var(--transition-fast)'
                }}
              >
                <option value="ALL">Todos os Dias</option>
                {uniqueDates.map(d => (
                  <option key={d.raw} value={d.raw}>{d.formatted}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredMatches.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed', borderRadius: '16px' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem', fontSize: '0.95rem' }}>
                Nenhum jogo encontrado para os filtros selecionados.
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setSelectedGroup('ALL'); setSelectedDate('ALL'); }}
                style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
              >
                🔄 Limpar Filtros
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
