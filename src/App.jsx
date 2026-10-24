
import { useEffect, useRef, useState } from 'react'
import './App.css'

const initialPlayers = [
  { id: 1, name: 'PLAYER 01', color: 'cyan', lives: 3, speed: 0, power: 'PHASE SHIFT' },
  { id: 2, name: 'PLAYER 02', color: 'orange', lives: 3, speed: 0, power: 'ELECTRO PULSE' },
]

const TRACK_PATH =
  'M 90 70 C 90 48 108 40 132 40 L 535 40 C 590 40 625 67 625 112 L 625 150 C 625 180 605 195 570 195 L 205 195 C 160 195 140 215 140 250 L 140 278 C 140 313 165 335 200 335 L 500 335 C 545 335 575 355 575 390 L 575 400 C 575 425 555 440 525 440 L 105 440'

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
  const [marblePositions, setMarblePositions] = useState({
    1: { x: 90, y: 63 },
    2: { x: 90, y: 77 },
  })

  const trackPathRef = useRef(null)
  const progressRef = useRef(progress)
  const brakingRef = useRef(braking)
  const usedPowerRef = useRef(usedPower)
  const winnerRef = useRef(false)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    brakingRef.current = braking
  }, [braking])

  useEffect(() => {
    usedPowerRef.current = usedPower
  }, [usedPower])

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
      const next = { ...progressRef.current }

      players.forEach(player => {
        const id = player.id
        const isBraking = brakingRef.current[id]
        const hasPower = usedPowerRef.current[id]
        const speed = isBraking ? 0 : hasPower ? 2.4 : 1.7

        next[id] = Math.min(100, next[id] + speed)
      })

      progressRef.current = next
      setProgress(next)
      setRaceTime(value => value + 1)

      const winner = Object.entries(next).find(([, value]) => value >= 100)

      if (winner && !winnerRef.current) {
        winnerRef.current = true
        setPhase('finished')
        setMessage(
          language === 'ES'
            ? `¡GANA EL JUGADOR 0${winner[0]}!`
            : `PLAYER 0${winner[0]} WINS`
        )
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, players, language])

  function placeItem(playerId, type) {
    if (phase !== 'setup') return
    if (items[playerId].length >= 3) return

    setItems(previous => ({
      ...previous,
      [playerId]: [...previous[playerId], type],
    }))

    setMessage(
      language === 'ES'
        ? `${type.toUpperCase()} COLOCADO · JUGADOR 0${playerId}`
        : `${type.toUpperCase()} PLACED · PLAYER 0${playerId}`
    )
  }

  function startRace() {
    if (phase !== 'setup' || countdownRunning) return

    setCountdown(5)
    setCountdownRunning(true)
    setMessage(language === 'ES' ? '¡PREPÁRATE!' : 'GET READY!')
  }

  function activatePower(id) {
    if (phase !== 'race' || usedPowerRef.current[id]) return

    const nextPower = { ...usedPowerRef.current, [id]: true }
    usedPowerRef.current = nextPower
    setUsedPower(nextPower)

    setPlayers(previous =>
      previous.map(player =>
        player.id === id
          ? { ...player, speed: Math.min(99, player.speed + 20) }
          : player
      )
    )

    setMessage(
      language === 'ES'
        ? `PODER ACTIVADO · JUGADOR 0${id}`
        : `PLAYER 0${id} · POWER ACTIVATED`
    )
  }

  function activateBrake(id) {
    if (phase !== 'race' || brakingRef.current[id]) return

    const nextBraking = { ...brakingRef.current, [id]: true }
    brakingRef.current = nextBraking
    setBraking(nextBraking)

    setMessage(
      language === 'ES'
        ? `FRENO DE EMERGENCIA · JUGADOR 0${id}`
        : `PLAYER 0${id} · EMERGENCY BRAKE`
    )

    setTimeout(() => {
      setBraking(previous => {
        const updated = { ...previous, [id]: false }
        brakingRef.current = updated
        return updated
      })
    }, 500)
  }

  function resetGame() {
    setPlayers(initialPlayers)
    setPhase('setup')
    setCountdown(5)
    setCountdownRunning(false)
    setItems({ 1: [], 2: [] })
    setMessage(language === 'ES' ? 'COLOCA TUS MÓDULOS' : 'PLACE YOUR TRAPS')
    setProgress({ 1: 8, 2: 8 })
    progressRef.current = { 1: 8, 2: 8 }
    setRaceTime(0)
    setUsedPower({ 1: false, 2: false })
    usedPowerRef.current = { 1: false, 2: false }
    setBraking({ 1: false, 2: false })
    brakingRef.current = { 1: false, 2: false }
    winnerRef.current = false
  }

  useEffect(() => {
    const path = trackPathRef.current
    if (!path) return

    const length = path.getTotalLength()
    const positions = {}

    for (const id of [1, 2]) {
      const distance = length * Math.min(100, progress[id]) / 100
      const point = path.getPointAtLength(distance)

      positions[id] = {
        x: point.x,
        y: point.y + (id === 1 ? -7 : 7),
      }
    }

    setMarblePositions(positions)
  }, [progress])



  const isSpanish = language === 'ES'

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
          ↻ <span>{isSpanish ? 'NUEVA CARRERA' : 'NEW RACE'}</span>
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
                <div>
                  <strong>
                    {braking[player.id]
                      ? '0'
                      : Math.round(20 + progress[player.id] * 0.7 + (usedPower[player.id] ? 12 : 0))}
                  </strong>
                  <small> KM/H</small>
                </div>
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
            <div>
              <h2>{isSpanish ? 'EQUIPO TÁCTICO' : 'TACTICAL LOADOUT'}</h2>
              <p>{isSpanish ? 'JUGADOR 01' : 'PLAYER 01'} · CYAN</p>
            </div>
          </div>

          <div className="inventory-title">
            {isSpanish ? 'MÓDULOS DISPONIBLES' : 'AVAILABLE MODULES'}
            <span>{3 - Math.min(3, items[1].length)}/3</span>
          </div>

          {[
            ['ACCEL RAMP', '↗', 'Boost the marble', 'ramp'],
            ['MAGNETIC TRAP', '⊕', 'Slow the rival', 'magnet'],
            ['BARRIER', '⊣', 'Block the track', 'barrier'],
          ].map(([name, icon, description, type]) => (
            <button
              className="inventory-item"
              key={type}
              onClick={() => placeItem(1, type)}
              disabled={phase !== 'setup' || items[1].length >= 3}
            >
              <span className="item-icon">{icon}</span>
              <span className="item-copy"><strong>{name}</strong><small>{description}</small></span>
              <span className="item-add">+</span>
            </button>
          ))}

          <div className="placed-items">
            <span>{isSpanish ? 'COLOCADOS' : 'PLACED'}</span>
            <div>{items[1].length ? items[1].join(' · ').toUpperCase() : (isSpanish ? 'SIN MÓDULOS' : 'NO MODULES PLACED')}</div>
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

            <svg
              className="circuit-svg"
              viewBox="0 0 700 500"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Shared winding marble racing track"
            >
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

              <path
                ref={trackPathRef}
                d={TRACK_PATH}
                fill="none"
                stroke="none"
                pointerEvents="none"
              />

              <path d={TRACK_PATH}
                fill="none" stroke="#243548" strokeWidth="62"
                strokeLinecap="round" strokeLinejoin="round"
              />

              <path d={TRACK_PATH}
                fill="none" stroke="url(#rail)" strokeWidth="46"
                strokeLinecap="round" strokeLinejoin="round"
              />

              <path d={TRACK_PATH}
                fill="none" stroke="url(#trackSurface)" strokeWidth="34"
                strokeLinecap="round" strokeLinejoin="round"
              />

              <path d={TRACK_PATH}
                fill="none" stroke="#7595ad" strokeWidth="1.5"
                strokeDasharray="5 10" opacity=".65"
              />

              <path d={TRACK_PATH}
                fill="none" stroke="#43e7ff" strokeWidth="3"
                strokeLinecap="round" strokeLinejoin="round"
                opacity=".75" filter="url(#trackGlow)"
              />

              <path
                d={TRACK_PATH}
                fill="none"
                stroke="#ff994f"
                strokeWidth="2"
                strokeDasharray="8 15"
                opacity=".75"
              />

              {[0, 1, 2, 3, 4].map(i => (
                <g key={i} opacity=".45">
                  <circle cx={180 + i * 80} cy="70" r="2" fill="#42eaff" />
                  <circle cx={180 + i * 80} cy="430" r="2" fill="#ff994f" />
                </g>
              ))}

              {[1, 2].map(id => {
                const point = marblePositions[id]
                const isCyan = id === 1
                const color = isCyan ? '#45eaff' : '#ff984d'
                const darkColor = isCyan ? '#07111c' : '#17101a'
                const highlight = isCyan ? '#d8fbff' : '#fff0d5'
                const shadow = isCyan ? '#2ab5e5' : '#e26d31'

                return (
                  <g key={id} transform={`translate(${point.x},${point.y})`}>
                    <circle r="20" fill={color} opacity=".16" />
                    <circle r="13" fill={darkColor} stroke={color} strokeWidth="3" />
                    <circle cx="-3" cy="-4" r="5" fill={highlight} />
                    <circle cx="4" cy="4" r="4" fill={shadow} />
                  </g>
                )
              })}

              <g transform="translate(105 430)">
                <rect x="-15" y="-13" width="30" height="26" rx="3" fill="#13202b" stroke="#a9c0d5" />
                <path d="M-7 -13 V13 M0 -13 V13 M7 -13 V13" stroke="#d8e5f0" strokeWidth="2" />
              </g>

              <g transform="translate(90 38)">
                <rect x="-36" y="-15" width="72" height="24" rx="5" fill="#071722" stroke="#2e8397" />
                <text y="1" fill="#56eaff" fontSize="10" fontWeight="700" textAnchor="middle">START</text>
              </g>

              <g transform="translate(105 463)">
                <rect x="-35" y="-15" width="70" height="24" rx="5" fill="#20150f" stroke="#b86e37" />
                <text y="1" fill="#ffab68" fontSize="10" fontWeight="700" textAnchor="middle">FINISH</text>
              </g>

              {items[1].map((item, i) => (
                <g key={`p1-${i}`} transform={`translate(${200 + i * 50} 190)`}>
                  <rect x="-11" y="-11" width="22" height="22" rx="4" fill="#0a2631" stroke="#42eaff" strokeWidth="2" />
                  <text y="4" fill="#42eaff" fontSize="12" textAnchor="middle">
                    {item === 'ramp' ? '↗' : item === 'magnet' ? '⊕' : '⊣'}
                  </text>
                </g>
              ))}

              {items[2].map((item, i) => (
                <g key={`p2-${i}`} transform={`translate(${400 + i * 40} 310)`}>
                  <rect x="-11" y="-11" width="22" height="22" rx="4" fill="#301a10" stroke="#ff984d" strokeWidth="2" />
                  <text y="4" fill="#ff984d" fontSize="12" textAnchor="middle">
                    {item === 'ramp' ? '↗' : item === 'magnet' ? '⊕' : '⊣'}
                  </text>
                </g>
              ))}
            </svg>

            <div className="track-countdown">
              <span>
                {phase === 'setup'
                  ? (isSpanish ? 'FASE DE PREPARACIÓN' : 'PREPARATION PHASE')
                  : phase === 'race'
                    ? (isSpanish ? 'CARRERA EN CURSO' : 'RACE IN PROGRESS')
                    : (isSpanish ? 'CARRERA TERMINADA' : 'RACE COMPLETE')}
              </span>

              <strong>
                {phase === 'setup'
                  ? `00:0${countdown}`
                  : phase === 'race'
                    ? `${String(Math.floor(raceTime / 60)).padStart(2, '0')}:${String(raceTime % 60).padStart(2, '0')}`
                    : 'FINISH'}
              </strong>

              <small>
                {phase === 'setup'
                  ? (isSpanish ? 'COLOCA TUS MÓDULOS' : 'PLACE YOUR MODULES')
                  : phase === 'race'
                    ? (isSpanish ? 'MANTÉN EL IMPULSO' : 'MAINTAIN YOUR MOMENTUM')
                    : message}
              </small>
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
              {isSpanish ? 'INICIAR CARRERA' : 'START RACE'}
            </button>

            <span className="track-footer-note">
              SHARED PHYSICS ENGINE <b>●</b>
            </span>
          </div>
        </section>

        <aside className="side-panel right-panel">
          <div className="panel-heading">
            <span className="panel-index orange-text">02</span>
            <div>
              <h2>{isSpanish ? 'EQUIPO TÁCTICO' : 'TACTICAL LOADOUT'}</h2>
              <p>{isSpanish ? 'JUGADOR 02' : 'PLAYER 02'} · EMBER</p>
            </div>
          </div>

          <div className="inventory-title">
            {isSpanish ? 'MÓDULOS DISPONIBLES' : 'AVAILABLE MODULES'}
            <span>{3 - Math.min(3, items[2].length)}/3</span>
          </div>

          {[
            ['ACCEL RAMP', '↗', 'Boost the marble', 'ramp'],
            ['MAGNETIC TRAP', '⊕', 'Slow the rival', 'magnet'],
            ['BARRIER', '⊣', 'Block the track', 'barrier'],
          ].map(([name, icon, description, type]) => (
            <button
              className="inventory-item"
              key={type}
              onClick={() => placeItem(2, type)}
              disabled={phase !== 'setup' || items[2].length >= 3}
            >
              <span className="item-icon">{icon}</span>
              <span className="item-copy"><strong>{name}</strong><small>{description}</small></span>
              <span className="item-add">+</span>
            </button>
          ))}

          <div className="placed-items">
            <span>{isSpanish ? 'COLOCADOS' : 'PLACED'}</span>
            <div>{items[2].length ? items[2].join(' · ').toUpperCase() : (isSpanish ? 'SIN MÓDULOS' : 'NO MODULES PLACED')}</div>
          </div>
        </aside>
      </section>

      <section className="action-deck">
        <div className="action-message">
          <span className="live-dot" />
          <div>
            <strong>{message}</strong>
            <small>
              {phase === 'setup'
                ? (isSpanish ? 'ELIGE MÓDULOS ANTES DE QUE TERMINE LA CUENTA ATRÁS' : 'CHOOSE MODULES BEFORE THE COUNTDOWN ENDS')
                : phase === 'race'
                  ? (isSpanish ? 'USA TU PODER CON CABEZA · FRENAR CUESTA IMPULSO' : 'USE YOUR POWER WISELY · BRAKING COSTS MOMENTUM')
                  : (isSpanish ? 'INICIA UNA NUEVA CARRERA PARA VOLVER A JUGAR' : 'START A NEW RACE TO PLAY AGAIN')}
            </small>
          </div>
        </div>

        {players.map(player => (
          <div className={`action-player ${player.color}`} key={player.id}>
            <span className="action-player-name">P0{player.id}</span>

            <button
              className="power-button"
              onClick={() => activatePower(player.id)}
              disabled={phase !== 'race' || usedPower[player.id]}
            >
              <span>⚡</span>
              <span>
                <strong>POWER</strong>
                <small>{usedPower[player.id] ? 'USED' : player.power}</small>
              </span>
            </button>

            <button
              className={`brake-button ${braking[player.id] ? 'is-braking' : ''}`}
              onClick={() => activateBrake(player.id)}
              disabled={phase !== 'race' || braking[player.id]}
            >
              <span>Ⅱ</span>
              <span><strong>BRAKE</strong><small>0.5 SEC</small></span>
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
