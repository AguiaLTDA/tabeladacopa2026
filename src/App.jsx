// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import GroupStage from './components/GroupStage';
import TournamentTree from './components/TournamentTree';
import PredictionTab from './components/PredictionTab';
import TeamCard from './components/TeamCard';

import { 
  calculateStandings, 
  getBestThirdPlacedTeams, 
  allocateThirdPlaces, 
  determineKnockoutMatches 
} from './utils/tournamentRules';

export default function App() {
  // Static data loaded from public files
  const [teamsData, setTeamsData] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [teamMatchesData, setTeamMatchesData] = useState([]);

  // Dynamic tournament state (loaded from real_results.json)
  const [matchesResults, setMatchesResults] = useState({});
  const [groupStandings, setGroupStandings] = useState({});
  const [bestThirds, setBestThirds] = useState([]);
  const [bestThirdsAllocation, setBestThirdsAllocation] = useState({});
  const [knockoutMatches, setKnockoutMatches] = useState({});

  // UI state
  const [activeTab, setActiveTab] = useState('GROUPS');
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Load static data and results on mount
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;

    fetch(`${baseUrl}data/teams.json`)
      .then(res => res.json())
      .then(data => setTeamsData(data));

    fetch(`${baseUrl}data/fixtures.json`)
      .then(res => res.json())
      .then(data => setFixtures(data));

    fetch(`${baseUrl}data/team_matches.json`)
      .then(res => res.json())
      .then(data => setTeamMatchesData(data));

    fetch(`${baseUrl}data/real_results.json`)
      .then(res => res.json())
      .then(data => {
        initializeResults(data);
      });
  }, []);

  // Initialize matches results state
  const initializeResults = (realResults) => {
    const initial = {};
    for (let mNum = 1; mNum <= 104; mNum++) {
      const matchStr = String(mNum);
      if (realResults[matchStr]) {
        initial[mNum] = {
          home_score: realResults[matchStr].home_score,
          away_score: realResults[matchStr].away_score,
          penalties_home: realResults[matchStr].penalties_home || null,
          penalties_away: realResults[matchStr].penalties_away || null,
          status: 'completed'
        };
      } else {
        initial[mNum] = {
          home_score: null,
          away_score: null,
          penalties_home: null,
          penalties_away: null,
          status: 'pending'
        };
      }
    }
    setMatchesResults(initial);
  };

  // Recalculate standings, knockouts whenever match results change
  useEffect(() => {
    if (teamsData.length === 0 || fixtures.length === 0) return;

    // 1. Group Standings
    const standings = calculateStandings(fixtures, teamsData, matchesResults);
    setGroupStandings(standings);

    // 2. Best Thirds
    const thirds = getBestThirdPlacedTeams(standings);
    setBestThirds(thirds);

    // 3. Best Thirds Allocation
    const allocation = allocateThirdPlaces(thirds);
    setBestThirdsAllocation(allocation);

    // 4. Knockout Matches
    const ko = determineKnockoutMatches(fixtures, standings, allocation, matchesResults);
    setKnockoutMatches(ko);
  }, [matchesResults, teamsData, fixtures]);

  return (
    <div className="app-container">
      {/* Header */}
      <Header 
        fixtures={fixtures}
        matchesResults={matchesResults}
      />

      {/* Tabs Menu */}
      <div className="tabs-container" style={{ marginBottom: '3rem' }}>
        <button 
          className={`tab-button ${activeTab === 'GROUPS' ? 'active' : ''}`}
          onClick={() => setActiveTab('GROUPS')}
        >
          📊 Tabela de Grupos
        </button>
        <button 
          className={`tab-button ${activeTab === 'TREE' ? 'active' : ''}`}
          onClick={() => setActiveTab('TREE')}
        >
          🌳 Árvore do Mata-Mata
        </button>
        <button 
          className={`tab-button ${activeTab === 'PREDICTIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('PREDICTIONS')}
        >
          🔮 Previsões de Jogos & Rotas
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'GROUPS' && (
        <GroupStage 
          groupStandings={groupStandings}
          fixtures={fixtures}
          matchesResults={matchesResults}
          bestThirds={bestThirds}
          onTeamClick={setSelectedTeam}
        />
      )}

      {activeTab === 'TREE' && (
        <TournamentTree 
          knockoutMatches={knockoutMatches}
          matchesResults={matchesResults}
          onTeamClick={setSelectedTeam}
        />
      )}

      {activeTab === 'PREDICTIONS' && (
        <PredictionTab 
          teamsData={teamsData}
          fixtures={fixtures}
          onTeamClick={setSelectedTeam}
        />
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <TeamCard 
          teamName={selectedTeam}
          teamsData={teamsData}
          teamMatchesData={teamMatchesData}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
}
