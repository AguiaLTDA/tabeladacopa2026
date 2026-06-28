// src/components/TournamentTree.jsx
import React, { useState } from 'react';
import { formatKickoff, translateStage } from '../utils/dateFormatter';

export default function TournamentTree({
  knockoutMatches,
  matchesResults,
  onTeamClick,
  teamsData
}) {
  // State for dynamic visualization
  const [treeViewMode, setTreeViewMode] = useState('FULL'); // 'FULL' or 'ROUND'
  const [selectedRound, setSelectedRound] = useState('r32'); // 'r32', 'r16', 'qf', 'sf', 'final'

  // Ordered match numbers to align them visually
  const r32Order = [73, 75, 74, 77, 76, 78, 79, 80, 83, 84, 81, 82, 86, 88, 85, 87];
  const r16Order = [90, 89, 91, 92, 93, 94, 95, 96];
  const qfOrder = [97, 99, 98, 100];
  const sfOrder = [101, 102];
  const finalOrder = [104, 103]; // Final first, then 3rd Place

  const roundsMap = {
    r32: { title: '32 avos de final', order: r32Order },
    r16: { title: 'Oitavas de final', order: r16Order },
    qf: { title: 'Quartas de final', order: qfOrder },
    sf: { title: 'Semifinais', order: sfOrder },
    final: { title: 'Finais (Final & Disputa de 3º Lugar)', order: finalOrder }
  };

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

    // Calculate quality difference (Elo disparity)
    let hasQualityGap = false;
    let eloDiff = 0;
    if (!isHomePlaceholder && !isAwayPlaceholder && teamsData) {
      const homeTeam = teamsData.find(t => t.team === home);
      const awayTeam = teamsData.find(t => t.team === away);
      if (homeTeam && awayTeam) {
        eloDiff = Math.abs(homeTeam.elo - awayTeam.elo);
        if (eloDiff >= 250) {
          hasQualityGap = true;
        }
      }
    }

    return (
      <div 
        key={matchNumber} 
        className={`bracket-match-node ${isLive ? 'active-simulate' : ''} ${hasQualityGap ? 'disparity-warning' : ''}`}
        style={{ opacity: isCompleted ? 0.9 : 1 }}
      >
        {hasQualityGap && (
          <div className="match-disparity-alert">
            ⚠️ Alta Disparidade ({eloDiff} pts Elo)
          </div>
        )}
        {/* Match Header */}
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Jogo {matchNumber} • {translateStage(match.stage)}</span>
            <span style={{ color: isLive ? 'var(--danger)' : isCompleted ? 'var(--text-dim)' : 'var(--text-dim)', fontWeight: 'bold' }}>
              {isLive ? '🔴 LIVE' : isCompleted ? 'FIM' : 'PENDENTE'}
            </span>
          </div>
          <div style={{ color: 'var(--accent-secondary)', opacity: 0.9 }}>
            📅 {formatKickoff(match.kickoff_utc, match.date)}
          </div>
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
    <div className="bracket-tab-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Controles de Visualização Dinâmica */}
      <div className="tree-view-controls-card glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👁️ Visualização Dinâmica do Mata-Mata
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Escolha entre visualizar a chave horizontal completa ou focar em uma rodada específica.
            </p>
          </div>
          <div className="view-mode-toggle-group">
            <button 
              className={`view-mode-btn ${treeViewMode === 'FULL' ? 'active' : ''}`}
              onClick={() => setTreeViewMode('FULL')}
            >
              🌳 Chave Completa
            </button>
            <button 
              className={`view-mode-btn ${treeViewMode === 'ROUND' ? 'active' : ''}`}
              onClick={() => setTreeViewMode('ROUND')}
            >
              🎯 Por Rodada
            </button>
          </div>
        </div>

        {treeViewMode === 'ROUND' && (
          <div className="round-selector-pills" style={{ marginTop: '1.2rem' }}>
            {Object.entries(roundsMap).map(([key, value]) => (
              <button
                key={key}
                className={`round-pill-btn ${selectedRound === key ? 'active' : ''}`}
                onClick={() => setSelectedRound(key)}
              >
                {value.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. O Diagrama de Confrontos (Bracket) */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Diagrama de Confrontos do Mata-Mata
        </h3>

        {treeViewMode === 'FULL' ? (
          <div className="bracket-scroll-container" style={{ padding: '0 0 1rem 0' }}>
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
        ) : (
          <div style={{ padding: '0.5rem 0' }}>
            <h4 style={{ color: 'var(--accent-secondary)', fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.2rem', borderBottom: '1px solid rgba(6, 182, 212, 0.15)', paddingBottom: '0.5rem' }}>
              📍 {roundsMap[selectedRound].title}
            </h4>
            <div className="bracket-grid-layout">
              {roundsMap[selectedRound].order.map(num => renderMatchCard(num))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Regras Consideradas (Bottom) */}
      <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-primary)' }}>
        <h3 style={{ color: 'var(--text-main)', fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 Regras e Critérios Considerados na Simulação
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', fontSize: '0.9rem', lineHeight: '1.6' }}>
          <div>
            <h4 style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.6rem' }}>
              Critérios de Desempate (Fase de Grupos)
            </h4>
            <ul style={{ paddingLeft: '1.1rem', color: 'var(--text-muted)' }}>
              <li><strong>Pontos obtidos:</strong> 3 por vitória, 1 por empate, 0 por derrota.</li>
              <li><strong>Saldo de gols:</strong> Gols marcados menos gols sofridos.</li>
              <li><strong>Gols marcados:</strong> Total de gols feitos no grupo.</li>
              <li><strong>Confronto direto:</strong> Pontuação no jogo entre as duas seleções empatadas.</li>
              <li><strong>Ranking FIFA:</strong> Critério final de desempate utilizado no pipeline.</li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.6rem' }}>
              Alocação dos Melhores Terceiros
            </h4>
            <p style={{ color: 'var(--text-muted)' }}>
              Os 12 terceiros colocados são listados sob os mesmos critérios acima (pontos, saldo, gols, vitórias e ranking). Os <strong>8 melhores</strong> avançam.
              <br />
              Um <strong>algoritmo de emparelhamento dinâmico</strong> distribui essas equipes nos respectivos slots do mata-mata, priorizando evitar que uma equipe enfrente o líder do seu próprio grupo de origem na rodada inicial de 32 avos.
            </p>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem', fontWeight: '700', marginBottom: '0.6rem' }}>
              Regras das Fases Eliminatórias
            </h4>
            <ul style={{ paddingLeft: '1.1rem', color: 'var(--text-muted)' }}>
              <li><strong>Eliminação simples:</strong> Os perdedores são eliminados diretamente (exceto das semifinais, que jogam a disputa de 3º lugar).</li>
              <li><strong>Empates no tempo normal:</strong> Haverá prorrogação de 30 minutos (2 tempos de 15 min). Se persistir o empate, a vaga será decidida em disputa por pênaltis.</li>
              <li><strong>Caminho fixo:</strong> A chave é pré-definida. Nenhuma equipe muda de lado na árvore após o início do mata-mata.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
