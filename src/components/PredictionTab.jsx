// src/components/PredictionTab.jsx
import React, { useState, useEffect } from 'react';
import { predictMatch, analyzePathDifficulty, PATH_STEPS } from '../utils/predictionEngine';

export default function PredictionTab({
  teamsData,
  fixtures,
  onTeamClick
}) {
  const [subTab, setSubTab] = useState('SIMULATOR'); // SIMULATOR or STRATEGY
  const [teamA, setTeamA] = useState('Argentina');
  const [teamB, setTeamB] = useState('Brazil');
  const [prediction, setPrediction] = useState(null);

  // Strategy states
  const [selectedGroupStrategy, setSelectedGroupStrategy] = useState('A');
  const [groupStrategies, setGroupStrategies] = useState([]);

  // Calculate average defense
  const avgDefense = teamsData.reduce((sum, t) => sum + t.defense_strength, 0) / teamsData.length;

  useEffect(() => {
    if (teamsData.length > 0) {
      // Find defaults
      const names = teamsData.map(t => t.team).sort();
      if (!names.includes(teamA)) setTeamA(names[0] || '');
      if (!names.includes(teamB)) setTeamB(names[1] || '');
    }
  }, [teamsData]);

  // Run Poisson Match Simulation
  const handleSimulate = () => {
    const tA = teamsData.find(t => t.team === teamA);
    const tB = teamsData.find(t => t.team === teamB);
    if (tA && tB) {
      const res = predictMatch(tA, tB, avgDefense);
      setPrediction(res);
    }
  };

  // Run Path Difficulty Analysis for all groups
  useEffect(() => {
    if (teamsData.length > 0 && fixtures.length > 0) {
      const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
      const strats = groups.map(g => analyzePathDifficulty(g, teamsData, fixtures));
      setGroupStrategies(strats);
    }
  }, [teamsData, fixtures]);

  const activeStrategy = groupStrategies.find(s => s?.group === selectedGroupStrategy);

  const getRecommendationBadge = (strat) => {
    if (!strat) return null;
    if (strat.diff < -15) {
      return <span className="rec-highlight first">🏆 1º Lugar (+{Math.min(Math.round(Math.abs(strat.diff)/20), 15)}%)</span>;
    }
    if (strat.diff > 15) {
      return <span className="rec-highlight second">🥈 2º Lugar (+{Math.min(Math.round(strat.diff)/20, 15)}%)</span>;
    }
    return <span className="rec-highlight draw">⚖️ Equilibrado</span>;
  };

  // Helper to find likely opponent label based on group names
  const getOpponentLabel = (groups) => {
    if (!groups) return '';
    return groups.join('/');
  };

  return (
    <div>
      {/* Sub Tabs Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${subTab === 'SIMULATOR' ? 'btn-primary' : ''}`}
          onClick={() => setSubTab('SIMULATOR')}
        >
          🎲 Simulador de Confrontos
        </button>
        <button 
          className={`btn ${subTab === 'STRATEGY' ? 'btn-primary' : ''}`}
          onClick={() => setSubTab('STRATEGY')}
        >
          🔮 Análise de Posição (1º vs 2º)
        </button>
      </div>

      {subTab === 'SIMULATOR' ? (
        // SIMULATOR TAB
        <div className="prediction-layout">
          
          {/* Selectors and trigger */}
          <div className="glass-card poisson-sim-container">
            <h3 style={{ color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Simular Partida Avulsa</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Simule a probabilidade do resultado entre duas seleções baseado em suas estatísticas de ataque, defesa e decaimento temporal.
            </p>

            <div className="sim-selectors" style={{ marginTop: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Time de Casa</label>
                <select 
                  className="select-team" 
                  value={teamA} 
                  onChange={(e) => { setTeamA(e.target.value); setPrediction(null); }}
                >
                  {teamsData.map(t => (
                    <option key={t.team} value={t.team}>{t.team}</option>
                  ))}
                </select>
              </div>

              <div className="vs-badge">VS</div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Time de Fora</label>
                <select 
                  className="select-team" 
                  value={teamB} 
                  onChange={(e) => { setTeamB(e.target.value); setPrediction(null); }}
                >
                  {teamsData.map(t => (
                    <option key={t.team} value={t.team}>{t.team}</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ marginTop: '1.2rem', padding: '1rem' }}
              onClick={handleSimulate}
              disabled={teamA === teamB}
            >
              📊 Rodar Previsão Poisson
            </button>
          </div>

          {/* Results Display */}
          <div className="glass-card" style={{ display: prediction ? 'block' : 'none' }}>
            {prediction && (
              <div>
                <h3 style={{ color: 'var(--accent-secondary)', fontWeight: 700, marginBottom: '1.2rem', textAlign: 'center' }}>
                  Probabilidade do Confronto
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  <span>{teamA} ({ (prediction.winA * 100).toFixed(1) }%)</span>
                  <span>Empate ({ (prediction.draw * 100).toFixed(1) }%)</span>
                  <span>{teamB} ({ (prediction.winB * 100).toFixed(1) }%)</span>
                </div>

                <div className="prob-bar-container">
                  <div className="prob-bar home" style={{ width: `${prediction.winA * 100}%` }}>
                    { (prediction.winA * 100).toFixed(0) }%
                  </div>
                  <div className="prob-bar draw" style={{ width: `${prediction.draw * 100}%` }}>
                    { (prediction.draw * 100).toFixed(0) }%
                  </div>
                  <div className="prob-bar away" style={{ width: `${prediction.winB * 100}%` }}>
                    { (prediction.winB * 100).toFixed(0) }%
                  </div>
                </div>

                {/* Score prediction */}
                <div style={{ textAlign: 'center', margin: '2rem 0', background: 'rgba(255,255,255,0.02)', padding: '1.2rem', borderRadius: '15px', border: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Placar Mais Provável
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-tertiary)', margin: '0.2rem 0' }}>
                    {prediction.predictedScore[0]} - {prediction.predictedScore[1]}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Probabilidade do placar exato: <strong>{ (prediction.predictedScoreChance * 100).toFixed(1) }%</strong>
                  </div>
                </div>

                {/* Stats comparisons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gols Esperados (xG)</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {teamA}: {prediction.lambdaA.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {teamB}: {prediction.lambdaB.toFixed(2)}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Métricas de Gols</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                      <span>Ambos Marcam:</span>
                      <strong style={{ color: 'var(--accent-secondary)' }}>{(prediction.btts * 100).toFixed(0)}%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                      <span>Mais de 2.5 Gols:</span>
                      <strong style={{ color: 'var(--accent-tertiary)' }}>{(prediction.over2_5 * 100).toFixed(0)}%</strong>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      ) : (
        // STRATEGY TAB (1st vs 2nd Analysis)
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          <div className="glass-card">
            <h3 style={{ color: 'var(--accent-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Estratégia de Classificação</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Simulação de dificuldades futuras para cada grupo. O "Caminho Médio" calcula o Elo ponderado dos adversários projetados nos 32 avos, oitavas, quartas e semifinal.
            </p>

            <table className="strategy-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Rota se 1º Lugar (Elo Médio)</th>
                  <th>Rota se 2º Lugar (Elo Médio)</th>
                  <th>Diferença de Elo</th>
                  <th>Recomendação de Posição</th>
                </tr>
              </thead>
              <tbody>
                {groupStrategies.map(strat => {
                  if (!strat) return null;
                  const isSelected = selectedGroupStrategy === strat.group;
                  return (
                    <tr 
                      key={strat.group} 
                      className="strategy-row"
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.08)' : '',
                        borderLeft: isSelected ? '4px solid var(--accent-primary)' : ''
                      }}
                      onClick={() => setSelectedGroupStrategy(strat.group)}
                    >
                      <td style={{ fontWeight: 'bold' }}>Grupo {strat.group}</td>
                      <td>
                        <strong>{strat['1st'].avgElo}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                          (vs 3º {getOpponentLabel(strat['1st'].steps.opposingGroups.r32)})
                        </span>
                      </td>
                      <td>
                        <strong>{strat['2nd'].avgElo}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                          (vs 2º {getOpponentLabel(strat['2nd'].steps.opposingGroups.r32)})
                        </span>
                      </td>
                      <td style={{ 
                        color: strat.diff < -15 ? 'var(--success)' : strat.diff > 15 ? 'var(--danger)' : 'var(--text-muted)',
                        fontWeight: 'bold'
                      }}>
                        {strat.diff > 0 ? `+${strat.diff}` : strat.diff} pts
                      </td>
                      <td>{getRecommendationBadge(strat)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detailed Path Analysis for Selected Group */}
          {activeStrategy && (
            <div className="glass-card" style={{ borderTop: '4px solid var(--accent-secondary)' }}>
              <h3 style={{ color: 'var(--accent-secondary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                Detalhamento: Rota de Classificação do Grupo {selectedGroupStrategy}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                {activeStrategy.recommendation}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem' }}>
                {/* 1st Place Path */}
                <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(16, 185, 129, 0.02)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <h4 style={{ color: 'var(--success)', marginBottom: '1rem', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '0.4rem' }}>
                    Se Terminar em 1º Lugar (Rota {activeStrategy['1st'].steps.r32})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>32 avos de final:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.1rem' }}>
                        vs 3º {getOpponentLabel(activeStrategy['1st'].steps.opposingGroups.r32)} (Elo projetado: ~{activeStrategy['1st'].r32Elo})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Oitavas de final:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.1rem' }}>
                        vs Vencedor {activeStrategy['1st'].steps.r16 - 13} (Elo projetado: ~{activeStrategy['1st'].r16Elo})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Caminho até as Quartas/Semis:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.1rem' }}>
                        Dificuldade média (Elo do caminho): <strong>{activeStrategy['1st'].avgElo}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2nd Place Path */}
                <div className="glass-card" style={{ padding: '1.2rem', background: 'rgba(6, 182, 212, 0.02)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                  <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '1rem', borderBottom: '1px solid rgba(6,182,212,0.2)', paddingBottom: '0.4rem' }}>
                    Se Terminar em 2º Lugar (Rota {activeStrategy['2nd'].steps.r32})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>32 avos de final:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.1rem' }}>
                        vs 2º {getOpponentLabel(activeStrategy['2nd'].steps.opposingGroups.r32)} (Elo projetado: ~{activeStrategy['2nd'].r32Elo})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Oitavas de final:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.1rem' }}>
                        vs Vencedor {activeStrategy['2nd'].steps.r16 - 13} (Elo projetado: ~{activeStrategy['2nd'].r16Elo})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Caminho até as Quartas/Semis:</span>
                      <div style={{ fontWeight: 'bold', marginTop: '0.1rem' }}>
                        Dificuldade média (Elo do caminho): <strong>{activeStrategy['2nd'].avgElo}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
}
