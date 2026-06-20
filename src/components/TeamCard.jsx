// src/components/TeamCard.jsx
import React from 'react';

export default function TeamCard({
  teamName,
  teamsData,
  teamMatchesData,
  onClose
}) {
  if (!teamName) return null;

  const team = teamsData.find(t => t.team === teamName);
  const matches = teamMatchesData[teamName] || [];

  const getResultClass = (res) => {
    if (res === 'W') return 'var(--success)';
    if (res === 'L') return 'var(--danger)';
    return 'var(--text-muted)';
  };

  const getResultLabel = (res) => {
    if (res === 'W') return 'VITÓRIA';
    if (res === 'L') return 'DERROTA';
    return 'EMPATE';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {teamName}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.2rem' }}>
              Resumo estatístico das últimas 40 partidas internacionais ponderadas.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <div className="fifa-badge" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '10px' }}>
              Rank FIFA: <strong>#{team?.fifa_rank || '-'}</strong>
            </div>
            <div className="fifa-badge" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-primary)' }}>
              Elo Rating: <strong>{team?.elo || '-'}</strong>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Índice de Forma</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-secondary)', marginTop: '0.2rem' }}>
              {team?.form_index || '-'}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Força Ofensiva</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--success)', marginTop: '0.2rem' }}>
              {team?.attack_strength || '-'}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Força Defensiva</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '0.2rem' }}>
              {team?.defense_strength || '-'}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxa de Vitória</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {team ? `${Math.round(team.weighted_win_rate * 100)}%` : '-'}
            </div>
          </div>
        </div>

        {/* History Table */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '1rem' }}>
          Histórico Recente (Últimos Jogos)
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="standings-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Resultado</th>
                <th>Placar</th>
                <th style={{ textAlign: 'left' }}>Adversário</th>
                <th style={{ textAlign: 'left' }}>Competição</th>
                <th>Elo Adv.</th>
                <th>Rank FIFA</th>
                <th>Peso</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ color: 'var(--text-muted)', padding: '2rem' }}>Nenhum jogo histórico encontrado.</td>
                </tr>
              ) : (
                matches.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontFamily: 'monospace' }}>{m.date}</td>
                    <td style={{ fontWeight: 'bold', color: getResultClass(m.result) }}>
                      {getResultLabel(m.result)}
                    </td>
                    <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {m.goals_scored} - {m.goals_conceded}
                    </td>
                    <td style={{ textAlign: 'left', fontWeight: 600 }}>{m.opponent}</td>
                    <td style={{ textAlign: 'left', color: 'var(--text-muted)' }}>{m.competition}</td>
                    <td>{m.opp_elo}</td>
                    <td>#{m.opp_fifa_rank}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>{m.weight.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
