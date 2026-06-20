// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
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
import { 
  simulateLiveMatchMinute, 
  simulateFullMatch 
} from './utils/simulatorEngine';

export default function App() {
  // Static data loaded from public files
  const [teamsData, setTeamsData] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [teamMatchesData, setTeamMatchesData] = useState([]);
  const [seededRealResults, setSeededRealResults] = useState({});

  // Dynamic tournament state
  const [matchesResults, setMatchesResults] = useState({});
  const [groupStandings, setGroupStandings] = useState({});
  const [bestThirds, setBestThirds] = useState([]);
  const [bestThirdsAllocation, setBestThirdsAllocation] = useState({});
  const [knockoutMatches, setKnockoutMatches] = useState({});

  // Simulation controls
  const [simulationActive, setSimulationActive] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [speed, setSpeed] = useState(10); // 1s = 10 game minutes
  const [activeDate, setActiveDate] = useState('');
  const [activeMatches, setActiveMatches] = useState([]); // Match numbers currently simulating

  // UI state
  const [activeTab, setActiveTab] = useState('GROUPS');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [goalNotifications, setGoalNotifications] = useState([]);

  const simulationRef = useRef(null);

  // Load static data on mount
  useEffect(() => {
    fetch('/data/teams.json')
      .then(res => res.json())
      .then(data => setTeamsData(data));

    fetch('/data/fixtures.json')
      .then(res => res.json())
      .then(data => setFixtures(data));

    fetch('/data/team_matches.json')
      .then(res => res.json())
      .then(data => setTeamMatchesData(data));

    fetch('/data/real_results.json')
      .then(res => res.json())
      .then(data => {
        setSeededRealResults(data);
        initializeResults(data);
      });
  }, []);

  // Initialize matches results state
  const initializeResults = (realResults) => {
    const initial = {};
    // Seed matches results
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
    setCurrentMinute(0);
    setSimulationActive(false);
    setActiveMatches([]);
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

  // Find average defense
  const avgDefense = teamsData.length > 0 
    ? teamsData.reduce((sum, t) => sum + t.defense_strength, 0) / teamsData.length 
    : 1.0;

  // Map teams by name for easy stats lookup in simulation
  const teamsMap = {};
  teamsData.forEach(t => {
    teamsMap[t.team] = t;
  });

  // Get uncompleted matches grouped by date
  const getNextSimulationBatch = (results) => {
    // Group stage matches first
    const uncompletedGroup = fixtures.filter(f => f.stage === 'group-stage' && results[f.match_number]?.status !== 'completed');
    if (uncompletedGroup.length > 0) {
      // Find earliest date
      const dates = uncompletedGroup.map(m => m.date).sort();
      const earliestDate = dates[0];
      const matches = uncompletedGroup.filter(m => m.date === earliestDate);
      return { date: earliestDate, matches, isKnockout: false };
    }

    // If all group stage matches completed, find next knockout matches
    // Knockout rounds must be simulated sequentially: R32, then R16, QF, SF, 3rd/Final
    const stages = ['round-of-32', 'round-of-16', 'quarter-finals', 'semi-finals', 'third-place', 'final'];
    for (const stage of stages) {
      const stageMatches = fixtures.filter(f => f.stage === stage && results[f.match_number]?.status !== 'completed');
      if (stageMatches.length > 0) {
        // Run all matches of this knockout stage together (or by date)
        const dates = stageMatches.map(m => m.date).sort();
        const earliestDate = dates[0];
        const matches = stageMatches.filter(m => m.date === earliestDate);
        return { date: earliestDate, matches, isKnockout: true };
      }
    }

    return null;
  };

  // Toggle simulation
  const handleToggleSimulation = () => {
    if (simulationActive) {
      setSimulationActive(false);
    } else {
      // Check if there are matches left to simulate
      const batch = getNextSimulationBatch(matchesResults);
      if (!batch) {
        alert("A Copa do Mundo de 2026 terminou! Todos os jogos foram concluídos.");
        return;
      }
      setActiveDate(batch.date);
      setActiveMatches(batch.matches.map(m => m.match_number));
      setSimulationActive(true);
      
      // Initialize active matches scores to 0-0 if they are null
      setMatchesResults(prev => {
        const next = { ...prev };
        batch.matches.forEach(m => {
          if (next[m.match_number].home_score === null) {
            next[m.match_number] = {
              ...next[m.match_number],
              home_score: 0,
              away_score: 0,
              status: 'live'
            };
          }
        });
        return next;
      });
    }
  };

  // Speed adjustments
  const handleSetSpeed = (s) => {
    setSpeed(s);
  };

  // Reset tournament
  const handleResetTournament = (useRealHistory) => {
    if (window.confirm(useRealHistory ? "Deseja resetar para o estado real em 20/06/2026?" : "Deseja resetar o torneio inteiro para o Jogo 1?")) {
      initializeResults(useRealHistory ? seededRealResults : {});
    }
  };

  // Manual Goal Insertion
  const handleManualGoal = (matchNumber, homeScore, awayScore) => {
    const match = fixtures.find(f => f.match_number === matchNumber);
    if (!match) return;

    let penaltiesHome = null;
    let penaltiesAway = null;

    // If knockout and score is draw, simulate penalties instantly
    if (match.stage !== 'group-stage' && homeScore === awayScore) {
      // Simulate penalty shootout
      const success = 0.75;
      let pH = 0, pA = 0, round = 1;
      while (pH === pA || round <= 5) {
        if (Math.random() < success) pH++;
        if (Math.random() < success) pA++;
        round++;
      }
      penaltiesHome = pH;
      penaltiesAway = pA;
      alert(`Empate no tempo normal do mata-mata! Decisão por pênaltis simulada: ${pH} x ${pA}`);
    }

    setMatchesResults(prev => ({
      ...prev,
      [matchNumber]: {
        home_score: homeScore,
        away_score: awayScore,
        penalties_home: penaltiesHome,
        penalties_away: penaltiesAway,
        status: 'completed'
      }
    }));

    // Trigger goal notification
    const homeTeam = knockoutMatches[matchNumber]?.homeResolved || match.home_team;
    const awayTeam = knockoutMatches[matchNumber]?.awayResolved || match.away_team;
    triggerGoalNotification(matchNumber, `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam} (Placar Editado)`);
  };

  // Simulation Loop Tick
  useEffect(() => {
    if (!simulationActive || activeMatches.length === 0) {
      if (simulationRef.current) clearInterval(simulationRef.current);
      return;
    }

    // Instantaneous Simulation (speed = 90)
    if (speed === 90) {
      setMatchesResults(prev => {
        const next = { ...prev };
        activeMatches.forEach(mNum => {
          const match = fixtures.find(f => f.match_number === mNum);
          if (match) {
            // Resolve knockout vs group
            const isKO = match.stage !== 'group-stage';
            const homeName = knockoutMatches[mNum]?.homeResolved || match.home_team;
            const awayName = knockoutMatches[mNum]?.awayResolved || match.away_team;

            const tHome = teamsMap[homeName];
            const tAway = teamsMap[awayName];

            if (tHome && tAway) {
              const res = simulateFullMatch(tHome, tAway, avgDefense, isKO);
              next[mNum] = {
                home_score: res.home_score,
                away_score: res.away_score,
                penalties_home: res.penalties_home,
                penalties_away: res.penalties_away,
                status: 'completed'
              };
            }
          }
        });
        return next;
      });
      
      setSimulationActive(false);
      setCurrentMinute(0);
      setActiveMatches([]);
      return;
    }

    // Normal minute-by-minute simulation tick
    const tickTime = 1000 / speed;
    simulationRef.current = setInterval(() => {
      setCurrentMinute(prevMinute => {
        const nextMinute = prevMinute + 1;
        
        // Max match minute is 90 for group-stage, and 120 for knockout
        const match = fixtures.find(f => f.match_number === activeMatches[0]);
        const isKO = match && match.stage !== 'group-stage';
        
        // We will simulate until 90 or 120 (if tie in KO)
        let limitMinute = 90;
        let isTied = false;
        
        if (isKO) {
          // Check if any of the active matches are tied at 90 minutes
          const anyTied = activeMatches.some(mNum => {
            const res = matchesResults[mNum];
            return res && res.home_score === res.away_score;
          });
          if (anyTied) limitMinute = 120;
        }

        if (nextMinute > limitMinute) {
          clearInterval(simulationRef.current);
          
          // Complete matches
          setMatchesResults(prev => {
            const next = { ...prev };
            activeMatches.forEach(mNum => {
              const currentRes = next[mNum];
              
              // If tied in KO at 120', run penalty shootout
              let pH = null;
              let pA = null;
              if (isKO && currentRes.home_score === currentRes.away_score) {
                const penaltySuccessRate = 0.75;
                let h = 0, a = 0, r = 1;
                while (h === a || r <= 5) {
                  if (Math.random() < penaltySuccessRate) h++;
                  if (Math.random() < penaltySuccessRate) a++;
                  r++;
                }
                pH = h;
                pA = a;
                // Notify penalties
                const homeName = knockoutMatches[mNum]?.homeResolved || fixtures.find(f => f.match_number === mNum).home_team;
                const awayName = knockoutMatches[mNum]?.awayResolved || fixtures.find(f => f.match_number === mNum).away_team;
                triggerGoalNotification(mNum, `Decisão por Pênaltis: ${homeName} (${h}) x (${a}) ${awayName}`);
              }

              next[mNum] = {
                ...currentRes,
                penalties_home: pH,
                penalties_away: pA,
                status: 'completed'
              };
            });
            return next;
          });

          setSimulationActive(false);
          setActiveMatches([]);
          return 0; // reset clock
        }

        // Simulate goal events for this minute
        setMatchesResults(prev => {
          const next = { ...prev };
          activeMatches.forEach(mNum => {
            const matchObj = fixtures.find(f => f.match_number === mNum);
            const liveMatchData = {
              ...matchObj,
              homeResolved: knockoutMatches[mNum]?.homeResolved || matchObj.home_team,
              awayResolved: knockoutMatches[mNum]?.awayResolved || matchObj.away_team,
              home_score: prev[mNum]?.home_score || 0,
              away_score: prev[mNum]?.away_score || 0,
              status: 'live'
            };

            const sim = simulateLiveMatchMinute(liveMatchData, teamsMap, avgDefense, nextMinute);
            if (sim) {
              next[mNum] = {
                ...prev[mNum],
                home_score: sim.homeScore,
                away_score: sim.awayScore
              };
              if (sim.newGoal) {
                const text = `⚽ GOL! ${sim.newGoal.teamName} marcou aos ${sim.newGoal.minute}' (${sim.newGoal.score})`;
                triggerGoalNotification(mNum, text);
              }
            }
          });
          return next;
        });

        return nextMinute;
      });
    }, tickTime);

    return () => clearInterval(simulationRef.current);
  }, [simulationActive, activeMatches, speed, matchesResults]);

  // Goal Notifications handler
  const triggerGoalNotification = (matchNumber, text) => {
    const id = Date.now() + Math.random();
    setGoalNotifications(prev => [...prev, { id, matchNumber, text }]);
    setTimeout(() => {
      setGoalNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <Header 
        simulationActive={simulationActive}
        activeDate={activeDate}
        fixtures={fixtures}
        matchesResults={matchesResults}
      />

      {/* Tabs Menu */}
      <div className="tabs-container">
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

      {/* Simulation Controller */}
      <ControlPanel 
        simulationActive={simulationActive}
        currentMinute={currentMinute}
        speed={speed}
        onToggleSimulation={handleToggleSimulation}
        onSetSpeed={handleSetSpeed}
        onReset={handleResetTournament}
        onManualGoal={handleManualGoal}
        fixtures={fixtures}
        matchesResults={matchesResults}
      />

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

      {/* Goal popups overlay */}
      <div className="notification-container">
        {goalNotifications.map(n => (
          <div key={n.id} className="goal-notification">
            <div>
              <h4>GOL DA COPA 2026</h4>
              <p>{n.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
