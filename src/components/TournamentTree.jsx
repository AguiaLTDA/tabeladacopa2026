// src/components/TournamentTree.jsx
import React from 'react';
import { formatKickoff, translateStage } from '../utils/dateFormatter';

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
    <div className="bracket-tab-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Explicação do encaixe dos times (Top) */}
      <div className="glass-card" style={{ padding: '2rem', borderLeft: '5px solid var(--accent-secondary)' }}>
        <h3 style={{ color: 'var(--accent-secondary)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🔗 Estrutura de Encaixe da Fase de Grupos
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Com o novo formato da Copa do Mundo de 2026 contendo <strong>48 seleções</strong> em <strong>12 grupos (A a L)</strong>, a fase de mata-mata (eliminatórias) é expandida para iniciar com <strong>32 seleções</strong> (32 avos de final). Classificam-se os <strong>2 primeiros de cada grupo</strong> e os <strong>8 melhores terceiros colocados</strong> no geral.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🎯 Confrontos Diretos Definidos
            </h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '0.8rem' }}>Confrontos fixados de antemão ligando líderes e vice-líderes de grupos:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>• <strong>Jogo 73:</strong> 2º A vs 2º B</div>
              <div>• <strong>Jogo 75:</strong> 1º F vs 2º C</div>
              <div>• <strong>Jogo 76:</strong> 1º C vs 2º F</div>
              <div>• <strong>Jogo 78:</strong> 2º E vs 2º I</div>
              <div>• <strong>Jogo 83:</strong> 2º K vs 2º L</div>
              <div>• <strong>Jogo 84:</strong> 1º H vs 2º J</div>
              <div>• <strong>Jogo 86:</strong> 1º J vs 2º H</div>
              <div>• <strong>Jogo 88:</strong> 2º D vs 2º G</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
            <h4 style={{ color: 'var(--accent-secondary)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              ⚖️ Distribuição dos 8 Melhores 3º Colocados
            </h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '0.8rem' }}>Os 8 melhores terceiros enfrentam líderes de grupos (A, B, C, D, E, G, I, K, L) conforme regras matemáticas para evitar recontros do mesmo grupo:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>• <strong>Jogo 74:</strong> 1º E vs 3º A/B/C/D/F</div>
              <div>• <strong>Jogo 77:</strong> 1º I vs 3º C/D/F/G/H</div>
              <div>• <strong>Jogo 79:</strong> 1º A vs 3º C/E/F/H/I</div>
              <div>• <strong>Jogo 80:</strong> 1º L vs 3º E/H/I/J/K</div>
              <div>• <strong>Jogo 81:</strong> 1º D vs 3º B/E/F/I/J</div>
              <div>• <strong>Jogo 82:</strong> 1º G vs 3º A/E/H/I/J</div>
              <div>• <strong>Jogo 85:</strong> 1º B vs 3º E/F/G/I/J</div>
              <div>• <strong>Jogo 87:</strong> 1º K vs 3º D/E/I/J/L</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. O Diagrama de Confrontos (Bracket) */}
      <div className="glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.4rem', fontWeight: '700', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Diagrama de Confrontos do Mata-Mata
        </h3>
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
