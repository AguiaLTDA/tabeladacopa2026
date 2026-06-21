// src/components/Header.jsx
import React from 'react';

export default function Header({
  fixtures,
  matchesResults
}) {
  // Compute current stage of the tournament
  const totalMatches = Object.keys(matchesResults).length;
  const completedMatches = Object.values(matchesResults).filter(r => r.status === 'completed').length;
  const liveMatches = Object.values(matchesResults).filter(r => r.status === 'live').length;

  let tournamentStatus = 'Fase de Grupos';
  if (completedMatches === 0 && liveMatches === 0) {
    tournamentStatus = 'Aguardando o pontapé inicial';
  } else if (completedMatches === 104) {
    tournamentStatus = 'Fim do Campeonato! Copa do Mundo Concluída 🏆';
  } else if (completedMatches >= 102) {
    tournamentStatus = 'Grande Final da Copa do Mundo';
  } else if (completedMatches >= 100) {
    tournamentStatus = 'Semifinais';
  } else if (completedMatches >= 96) {
    tournamentStatus = 'Quartas de Final';
  } else if (completedMatches >= 88) {
    tournamentStatus = 'Oitavas de Final';
  } else if (completedMatches >= 72) {
    tournamentStatus = '32 avos de final (Mata-mata)';
  }

  // Format date display
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(dateStr + 'T00:00:00');
      return dateObj.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <header className="app-header">
      <h1 className="app-title">Copa do Mundo FIFA 2026</h1>
      <p className="app-subtitle">Dashboard de Resultados e Previsões em Tempo Real</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <div className="fifa-badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          Fase Atual: <strong>{tournamentStatus}</strong>
        </div>
        <div className="fifa-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          Jogos Completados: <strong>{completedMatches} / 104</strong>
        </div>

      </div>
    </header>
  );
}
