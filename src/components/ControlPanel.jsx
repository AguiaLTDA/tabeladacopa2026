// src/components/ControlPanel.jsx
import React, { useState } from 'react';

export default function ControlPanel({
  simulationActive,
  currentMinute,
  speed,
  onToggleSimulation,
  onSetSpeed,
  onReset,
  onManualGoal,
  fixtures,
  matchesResults
}) {
  const [selectedMatchNum, setSelectedMatchNum] = useState('');
  const [manualHomeScore, setManualHomeScore] = useState('');
  const [manualAwayScore, setManualAwayScore] = useState('');

  // Filter matches that can be manually edited (group or knockout)
  const activeOrScheduled = fixtures.filter(f => {
    const res = matchesResults[f.match_number];
    return !res || res.home_score === null || res.status === 'live' || res.status === 'pending';
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!selectedMatchNum) {
      alert("Por favor, selecione uma partida.");
      return;
    }
    const h = parseInt(manualHomeScore);
    const a = parseInt(manualAwayScore);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) {
      alert("Placar inválido.");
      return;
    }

    onManualGoal(parseInt(selectedMatchNum), h, a);
    setSelectedMatchNum('');
    setManualHomeScore('');
    setManualAwayScore('');
  };

  return (
    <div className="glass-card control-panel">
      {/* Simulation Clock & Controls */}
      <div>
        <h3 style={{ marginBottom: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Controles de Simulação</h3>
        
        <div className="simulation-clock">
          <span>🕒 Minuto {currentMinute}'</span>
          {simulationActive && <span className="live-badge">Live</span>}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${simulationActive ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onToggleSimulation}
          >
            {simulationActive ? '⏸️ Pausar' : '▶️ Iniciar Simulação'}
          </button>
          
          <button className="btn" onClick={() => onReset(true)}>
            🔄 Reset Real (20/06/2026)
          </button>
          
          <button className="btn" onClick={() => onReset(false)}>
            ❌ Reset do Zero (Jogo 1)
          </button>
        </div>
      </div>

      {/* Speed Controls */}
      <div>
        <h3 style={{ marginBottom: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>Velocidade do Tempo</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>
          Velocidade atual: <strong>{speed}x</strong> (1 segundo real = {Math.round(speed)} minutos de jogo)
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[1, 5, 10, 30, 90].map(s => (
            <button 
              key={s} 
              className={`btn ${speed === s ? 'btn-secondary' : ''}`}
              onClick={() => onSetSpeed(s)}
            >
              {s === 90 ? '⚡ Instantâneo' : `${s}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Manual Goal Entry */}
      <div>
        <h3 style={{ marginBottom: '0.8rem', color: 'var(--accent-tertiary)', fontWeight: 700 }}>Atualização Manual</h3>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <select 
            className="select-team" 
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
            value={selectedMatchNum} 
            onChange={(e) => setSelectedMatchNum(e.target.value)}
          >
            <option value="">-- Selecione uma partida --</option>
            {activeOrScheduled.slice(0, 20).map(match => {
              const home = match.home_team;
              const away = match.away_team;
              return (
                <option key={match.match_number} value={match.match_number}>
                  Jogo {match.match_number} ({match.stage === 'group-stage' ? `Gp ${match.group}` : 'Mata-mata'}): {home} vs {away}
                </option>
              );
            })}
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="number" 
              placeholder="Gols Casa"
              className="select-team"
              style={{ width: '45%', padding: '0.5rem', textAlign: 'center' }}
              value={manualHomeScore}
              onChange={(e) => setManualHomeScore(e.target.value)}
              min="0"
            />
            <span style={{ alignSelf: 'center' }}>x</span>
            <input 
              type="number" 
              placeholder="Gols Fora"
              className="select-team"
              style={{ width: '45%', padding: '0.5rem', textAlign: 'center' }}
              value={manualAwayScore}
              onChange={(e) => setManualAwayScore(e.target.value)}
              min="0"
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
