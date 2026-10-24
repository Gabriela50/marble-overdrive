import { useEffect, useState } from 'react'
import './App.css'

const initialPlayers = [
  { id: 1, name: 'PLAYER 01', color: 'cyan', lives: 3, speed: 0, power: 'PHASE SHIFT' },
  { id: 2, name: 'PLAYER 02', color: 'orange', lives: 3, speed: 0, power: 'ELECTRO PULSE' },
]

function App() {
  const [players, setPlayers] = useState(initialPlayers)
  const [language, setLanguage] = useState('ES')
  const [countdownRunning, setCountdownRunning] = useState(false)
  const [phase, setPhase] = useState('setup')
  const [countdown, setCountdown] = useState(5)
  const [items, setItems] = useState({ 1: [], 2: [] })
  const [message, setMessage] = useState('PLACE YOUR TRAPS')
  const [progress, setProgress] = useState({ 1: 8, 2: 8 })
  const [raceTime, setRaceTime] = useState(0)
  const [usedPower, setUsedPower] = useState({ 1: false, 2: false })
  const [braking, setBraking] = useState({ 1: false, 2: false })

  useEffect(() => {
    if (phase !== 'setup' || !countdownRunning) return

    const timer = setInterval(() => {
      setCountdown(value => {
        if (value <= 1) {
          clearInterval(timer)
          setPhase('race')
          setCountdownRunning(false)
          setMessage(language === 'ES' ? 'CARRERA EN CURSO' : 'RACE IN PROGRESS')
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, countdownRunning, language])

  useEffect(() => {
    if (phase !== 'race') return

    const timer = setInterval(() => {
      const next = { ...progress }

      players.forEach(player => {
        const id = player.id
        const speed = braking[id] ? 0 : 1.7
        next[id] = Math.min(100, next[id] + speed + (usedPower[id] ? 0.7 : 0))
      })

      setProgress(next)
      setRaceTime(value => value + 1)

      const winner = Object.entries(next).find(([, value]) => value >= 100)
      if (winner) {
        setPhase('finished')
        setMessage(language === 'ES'
          ? `¡GANA EL JUGADOR 0${winner[0]}!`
          : `PLAYER 0${winner[0]} WINS`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, braking, usedPower, players, progress, language])

  function placeItem(playerId, type) {
    if (phase !== 'setup') return

    setItems(previous => ({
      ...previous,
      [playerId]: [...previous[playerId], type],
    }))

    setMessage(
      language === 'ES'
        ? `${type} COLOCADO · JUGADOR 0${playerId}`
        : `${type} PLACED · PLAYER 0${playerId}`
    )
  }

  function startRace() {
    if (phase !== 'setup' || countdownRunning) return

    setCountdown(5)
    setCountdownRunning(true)
    setMessage(language === 'ES' ? '¡PREPÁRATE!' : 'GET READY!')
  }

  function activatePower(id) {
    if (phase !== 'race' || usedPower[id]) return

    setUsedPower(previous => ({ ...previous, [id]: true }))
    setPlayers(previous =>
      previous.map(player =>
        player.id === id
          ? { ...player, speed: Math.min(99, player.speed + 20) }
          : player
      )
    )

    setMessage(`PLAYER 0${id} · POWER ACTIVATED`)
  }

  function activateBrake(id) {
    if (phase !== 'race') return

    setBraking(previous => ({ ...previous, [id]: true }))
    setMessage(`PLAYER 0${id} · EMERGENCY BRAKE`)

    setTimeout(() => {
      setBraking(previous => ({ ...previous, [id]: false }))
    }, 500)
  }

  function resetGame() {
    setPlayers(initialPlayers)
    setPhase('setup')
    setCountdown(5)
    setCountdownRunning(false)
    setItems({ 1: [], 2: [] })
    setMessage('PLACE YOUR TRAPS')
    setProgress({ 1: 8, 2: 8 })
    setRaceTime(0)
    setUsedPower({ 1: false, 2: false })
    setBraking({ 1: false, 2: false })
  }

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Marble Overdrive home">
          <span className="brand-mark">M<span>Ø</span></span>
          <span className="brand-name">MARBLE<span>OVERDRIVE</span></span>
        </a>

        <div className="language-switch" aria-label="Language">
          <button className={language === 'ES' ? 'active' : ''} onClick={() => setLanguage('ES')}>ES</button>
          <button className={language === 'EN' ? 'active' : ''} onClick={() => setLanguage('EN')}>EN</button>
        </div>

        <div className="top-status">
          <span className="live-dot" />
          LOCAL DUEL
          <span className="status-divider" />
          <span className="status-muted">BUILD 01.0</span>
        </div>

        <button className="reset-button" onClick={resetGame}>
          ↻ <span>{language === 'ES' ? 'NUEVA CARRERA' : 'NEW RACE'}</span>
        </button>
      </header>

      <section className="intro">
        <div>
          <div className="eyebrow"><span /> PHYSICS-BASED COMPETITION</div>
          <h1>MARBLE <span>OVERDRIVE</span></h1>
          <p className="subtitle">SHARED TRACK DUEL <span> / </span> TWO PLAYERS. ONE TRACK. NO MERCY.</p>
        </div>

        <div className="round-info">
          <span>ROUND</span>
          <strong>01</strong>
          <span className="round-divider">/</span>
          <span className="status-muted">LOCAL MATCH</span>
        </div>
      </section>

      <section className="player-grid">
        {players.map(player => (
          <article className={`player-card ${player.color}`} key={player.id}>
            <div className="player-card-top">
              <div className="player-identity">
                <div className="player-orb">{player.id === 1 ? '◉' : '◈'}</div>
                <div>
                  <div className="player-label">{player.name}</div>
                  <div className="player-subtitle">
                    {player.id === 1 ? 'CYAN DIVISION' : 'EMBER DIVISION'}
                  </div>
                </div>
              </div>
              <span className="player-indicator">P0{player.id}</span>
            </div>

            <div className="player-stats">
              <div className="stat">
                <span>INTEGRITY</span>
                <div className="life-row">
                  {[1, 2, 3].map(life => (
                    <span
                      key={life}
                      className={`life ${life <= player.lives ? 'alive' : ''}`}
                    />
                  ))}
                  <strong>{player.lives}/3</strong>
                </div>
              </div>
              <div className="stat speed-stat">
                <span>VELOCITY</span>
                <div><strong>{braking[player.id] ? '0' : Math.round(20 + progress[player.id] * 0.7)}</strong><small> KM/H</small></div>
              </div>
            </div>

            <div className="progress-track">
              <div style={{ width: `${progress[player.id]}%` }} />
            </div>
            <div className="progress-label">
              <span>START</span>
              <span>{Math.round(progress[player.id])}% DISTANCE</span>
              <span>FINISH</span>
            </div>
          </article>
        ))}
      </section>

      <section className="race-layout">
        <aside className="side-panel left-panel">
          <div className="panel-heading">
            <span className="panel-index cyan-text">01</span>
            <div><h2>{language === 'ES' ? 'EQUIPO TÁCTICO' : 'TACTICAL LOADOUT'}</h2><p>{language === 'ES' ? 'JUGADOR 01' : 'PLAYER 01'} · CYAN</p></div>
          </div>

          <div className="inventory-title">{language === 'ES' ? 'MÓDULOS DISPONIBLES' : 'AVAILABLE MODULES'} <span>{3 - Math.min(3, items[1].length)}/3</span></div>

          {[
            ['ACCEL RAMP', '↗', 'Boost the marble', 'ramp'],
            ['MAGNETIC TRAP', '⊕', 'Slow the rival', 'magnet'],
            ['BARRIER', '⊣', 'Block the track', 'barrier'],
          ].map(([name, icon, description, type]) => (
            <button className="inventory-item" key={type} onClick={() => placeItem(1, type)} disabled={phase !== 'setup' || items[1].length >= 3}>
              <span className="item-icon">{icon}</span>
              <span className="item-copy"><strong>{name}</strong><small>{description}</small></span>
              <span className="item-add">+</span>
            </button>
          ))}

          <div className="placed-items">
            <span>PLACED</span>
            <div>{items[1].length ? items[1].join(' · ').toUpperCase() : 'NO MODULES PLACED'}</div>
          </div>
        </aside>

        <section className="track-panel">
          <div className="track-toolbar">
            <div className="track-title"><span className="live-dot" /> LIVE CIRCUIT <span className="track-tag">TRACK 001</span></div>
            <div className="track-coordinates">SECTOR A <span>·</span> 2 MARBLES</div>
          </div>

          <div className="track-scene">
            <div className="scene-grid" />
            <div className="scene-glow glow-cyan" />
            <div className="scene-glow glow-orange" />

            <svg className="circuit-svg" viewBox="0 0 700 500" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Shared winding marble racing track">
              <defs>
                <linearGradient id="rail" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1b6676" />
                  <stop offset="50%" stopColor="#9aacc0" />
                  <stop offset="100%" stopColor="#263a57" />
                </linearGradient>
                <filter id="trackGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="trackSurface" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#172637" />
                  <stop offset="100%" stopColor="#0a101b" />
                </linearGradient>
              </defs>

              <path d="M 90 70 L 570 70 Q 620 70 620 120 L 620 175 Q 620 205 580 205 L 175 205 Q 130 205 130 250 L 130 290 Q 130 325 175 325 L 525 325 Q 570 325 570 365 L 570 400 Q 570 430 525 430 L 105 430"
                fill="none" stroke="#243548" strokeWidth="62" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 90 70 L 570 70 Q 620 70 620 120 L 620 175 Q 620 205 580 205 L 175 205 Q 130 205 130 250 L 130 290 Q 130 325 175 325 L 525 325 Q 570 325 570 365 L 570 400 Q 570 430 525 430 L 105 430"
                fill="none" stroke="url(#rail)" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 90 70 L 570 70 Q 620 70 620 120 L 620 175 Q 620 205 580 205 L 175 205 Q 130 205 130 250 L 130 290 Q 130 325 175 325 L 525 325 Q 570 325 570 365 L 570 400 Q 570 430 525 430 L 105 430"
                fill="none" stroke="url(#trackSurface)" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 90 70 L 570 70 Q 620 70 620 120 L 620 175 Q 620 205 580 205 L 175 205 Q 130 205 130 250 L 130 290 Q 130 325 175 325 L 525 325 Q 570 325 570 365 L 570 400 Q 570 430 525 430 L 105 430"
                fill="none" stroke="#7595ad" strokeWidth="1.5" strokeDasharray="5 10" opacity=".65" />

              <path d="M 90 70 L 570 70 Q 620 70 620 120 L 620 175 Q 620 205 580 205 L 175 205 Q 130 205 130 250 L 130 290 Q 130 325 175 325 L 525 325 Q 570 325 570 365 L 570 400 Q 570 430 525 430 L 105 430"
                fill="none" stroke="#43e7ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".75" filter="url(#trackGlow)" />

              <path d="M 105 430 L 525 430 Q 570 430 570 400 L 570 365 Q 570 325 525 325 L 175 325 Q 130 325 130 290 L 130 250 Q 130 205 175 205 L 580 205 Q 620 205 620 175 L 620 120 Q 620 70 570 70 L 90 70"
                fill="none" stroke="#ff994f" strokeWidth="2" strokeDasharray="8 15" opacity=".75" />

              {[0, 1, 2, 3, 4].map(i => (
                <g key={i} opacity=".45">
                  <circle cx={180 + i * 80} cy="70" r="2" fill="#42eaff" />
                  <circle cx={180 + i * 80} cy="430" r="2" fill="#ff994f" />
                </g>
              ))}

              <g transform={`translate(${90 + progress[1] * 4.5},70)`}>
                <circle r="20" fill="#45eaff" opacity=".16" />
                <circle r="13" fill="#07111c" stroke="#42eaff" strokeWidth="3" />
                <circle cx="-3" cy="-4" r="5" fill="#d8fbff" />
                <circle cx="4" cy="4" r="4" fill="#2ab5e5" />
              </g>
              <g transform={`translate(${90 + progress[2] * 4.5},84)`}>
                <circle r="20" fill="#ff984d" opacity=".16" />
                <circle r="13" fill="#17101a" stroke="#ff984d" strokeWidth="3" />
                <circle cx="-3" cy="-4" r="5" fill="#fff0d5" />
                <circle cx="4" cy="4" r="4" fill="#e26d31" />
              </g>

              <g transform="translate(105 430)">
                <rect x="-15" y="-13" width="30" height="26" rx="3" fill="#13202b" stroke="#a9c0d5" />
                <path d="M-7 -13 V13 M0 -13 V13 M7 -13 V13" stroke="#d8e5f0" strokeWidth="2" />
              </g>
              <g transform="translate(90 38)">
                <rect x="-36" y="-15" width="72" height="24" rx="5" fill="#071722" stroke="#2e8397" />
                <text y="1" fill="#56eaff" fontSize="10" fontWeight="700" textAnchor="middle">START</text>
              </g>
              <g transform="translate(525 463)">
                <rect x="-35" y="-15" width="70" height="24" rx="5" fill="#20150f" stroke="#b86e37" />
                <text y="1" fill="#ffab68" fontSize="10" fontWeight="700" textAnchor="middle">FINISH</text>
              </g>

              {items[1].map((item, i) => (
                <g key={`p1-${i}`} transform={`translate(${200 + i * 50} 190)`}>
                  <rect x="-11" y="-11" width="22" height="22" rx="4" fill="#0a2631" stroke="#42eaff" strokeWidth="2" />
                  <text y="4" fill="#42eaff" fontSize="12" textAnchor="middle">{item === 'ramp' ? '↗' : item === 'magnet' ? '⊕' : '⊣'}</text>
                </g>
              ))}
              {items[2].map((item, i) => (
                <g key={`p2-${i}`} transform={`translate(${400 + i * 40} 310)`}>
                  <rect x="-11" y="-11" width="22" height="22" rx="4" fill="#301a10" stroke="#ff984d" strokeWidth="2" />
                  <text y="4" fill="#ff984d" fontSize="12" textAnchor="middle">{item === 'ramp' ? '↗' : item === 'magnet' ? '⊕' : '⊣'}</text>
                </g>
              ))}
            </svg>

            <div className="track-countdown">
              <span>{phase === 'setup' ? 'PREPARATION PHASE' : phase === 'race' ? 'RACE IN PROGRESS' : 'RACE COMPLETE'}</span>
              <strong>{phase === 'setup' ? `00:0${countdown}` : phase === 'race' ? `${String(Math.floor(raceTime / 60)).padStart(2, '0')}:${String(raceTime % 60).padStart(2, '0')}` : 'FINISH'}</strong>
              <small>{phase === 'setup' ? 'PLACE YOUR MODULES' : phase === 'race' ? 'MAINTAIN YOUR MOMENTUM' : message}</small>
            </div>
          </div>

          <div className="track-footer">
            <span><i className="legend-dot cyan-bg" /> PLAYER 01</span>
            <span><i className="legend-dot orange-bg" /> PLAYER 02</span>
            <button
              className="start-race-button"
              onClick={startRace}
              disabled={phase !== 'setup' || countdownRunning}
            >
              {language === 'ES' ? 'INICIAR CARRERA' : 'START RACE'}
            </button>
            <span className="track-footer-note">SHARED PHYSICS ENGINE <b>●</b></span>
          </div>
        </section>

        <aside className="side-panel right-panel">
          <div className="panel-heading">
            <span className="panel-index orange-text">02</span>
            <div><h2>{language === 'ES' ? 'EQUIPO TÁCTICO' : 'TACTICAL LOADOUT'}</h2><p>{language === 'ES' ? 'JUGADOR 02' : 'PLAYER 02'} · EMBER</p></div>
          </div>

          <div className="inventory-title">{language === 'ES' ? 'MÓDULOS DISPONIBLES' : 'AVAILABLE MODULES'} <span>{3 - Math.min(3, items[2].length)}/3</span></div>

          {[
            ['ACCEL RAMP', '↗', 'Boost the marble', 'ramp'],
            ['MAGNETIC TRAP', '⊕', 'Slow the rival', 'magnet'],
            ['BARRIER', '⊣', 'Block the track', 'barrier'],
          ].map(([name, icon, description, type]) => (
            <button className="inventory-item" key={type} onClick={() => placeItem(2, type)} disabled={phase !== 'setup' || items[2].length >= 3}>
              <span className="item-icon">{icon}</span>
              <span className="item-copy"><strong>{name}</strong><small>{description}</small></span>
              <span className="item-add">+</span>
            </button>
          ))}

          <div className="placed-items">
            <span>PLACED</span>
            <div>{items[2].length ? items[2].join(' · ').toUpperCase() : 'NO MODULES PLACED'}</div>
          </div>
        </aside>
      </section>

      <section className="action-deck">
        <div className="action-message">
          <span className="live-dot" />
          <div><strong>{message}</strong><small>{phase === 'setup' ? 'CHOOSE MODULES BEFORE THE COUNTDOWN ENDS' : phase === 'race' ? 'USE YOUR POWER WISELY · BRAKING COSTS MOMENTUM' : 'START A NEW RACE TO PLAY AGAIN'}</small></div>
        </div>

        {players.map(player => (
          <div className={`action-player ${player.color}`} key={player.id}>
            <span className="action-player-name">P0{player.id}</span>
            <button className="power-button" onClick={() => activatePower(player.id)} disabled={phase !== 'race' || usedPower[player.id]}>
              <span>⚡</span><span><strong>POWER</strong><small>{usedPower[player.id] ? 'USED' : player.power}</small></span>
            </button>
            <button className={`brake-button ${braking[player.id] ? 'is-braking' : ''}`} onClick={() => activateBrake(player.id)} disabled={phase !== 'race' || braking[player.id]}>
              <span>Ⅱ</span><span><strong>BRAKE</strong><small>0.5 SEC</small></span>
            </button>
          </div>
        ))}
      </section>

      <footer className="game-footer">
        <span>MARBLE OVERDRIVE <b>©</b> 2026</span>
        <span>BUILT FOR COMPETITION <i>✦</i></span>
        <span>PHYSICS FIRST. SPEED ALWAYS.</span>
      </footer>
    </main>
  )
}

export default App