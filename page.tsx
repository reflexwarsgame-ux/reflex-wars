'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Leaderboard from '@/components/Leaderboard'

// Google Identity Services type declaration
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: () => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

// ============================================================
// REFLEX WARS - 1v1 Reaction Game
// ============================================================

// Difficulty Modes
type DifficultyMode = 'recruit' | 'soldier' | 'elite'

interface DifficultySettings {
  minDelay: number
  maxDelay: number
  circleSize: number
  hasShake: boolean
}

const DIFFICULTY_SETTINGS: Record<DifficultyMode, DifficultySettings> = {
  recruit: {
    minDelay: 1500,
    maxDelay: 3000,
    circleSize: 160,
    hasShake: false,
  },
  soldier: {
    minDelay: 600,
    maxDelay: 2000,
    circleSize: 130,
    hasShake: false,
  },
  elite: {
    minDelay: 400,
    maxDelay: 1200,
    circleSize: 90,
    hasShake: true,
  },
}

// ============================================================
// ARENA CONFIGURATION (RW Coins)
// ============================================================

type ArenaId = 'training' | 'bronze' | 'silver' | 'gold' | 'elite'

interface Arena {
  id: ArenaId
  name: string
  entryFee: number
  difficulty: DifficultyMode
  color: string
  icon: string
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
}

const ARENAS: Arena[] = [
  {
    id: 'training',
    name: 'Training Arena',
    entryFee: 0,
    difficulty: 'recruit',
    color: '#00ff88',
    icon: '🎯',
    description: 'Perfect for beginners',
    riskLevel: 'low',
  },
  {
    id: 'bronze',
    name: 'Bronze Arena',
    entryFee: 500,
    difficulty: 'soldier',
    color: '#cd7f32',
    icon: '🥉',
    description: 'Entry-level competition',
    riskLevel: 'medium',
  },
  {
    id: 'silver',
    name: 'Silver Arena',
    entryFee: 2000,
    difficulty: 'soldier',
    color: '#c0c0c0',
    icon: '🥈',
    description: 'Skilled opponents',
    riskLevel: 'medium',
  },
  {
    id: 'gold',
    name: 'Gold Arena',
    entryFee: 10000,
    difficulty: 'elite',
    color: '#ffd700',
    icon: '🥇',
    description: 'Elite warriors only',
    riskLevel: 'high',
  },
  {
    id: 'elite',
    name: 'Elite Arena',
    entryFee: 50000,
    difficulty: 'elite',
    color: '#9945ff',
    icon: '👑',
    description: 'The ultimate challenge',
    riskLevel: 'extreme',
  },
]

// Calculate potential reward for an arena (assuming 2 players)
const calculatePotentialReward = (entryFee: number): number => {
  if (entryFee === 0) return 0 // Training has no rewards
  return Math.floor(entryFee * 2 * 0.9) // 90% of total pot (2 players)
}

// ============================================================
// CUSTOMIZATION TYPES
// ============================================================

type TargetColor = 'cyan' | 'purple' | 'gold' | 'red' | 'white'
type BackgroundTheme = 'darkArena' | 'neonBattlefield' | 'crimsonWarzone'
type GlowEffect = 'standard' | 'intense' | 'pulsing' | 'rainbow'

interface CustomizationState {
  targetColor: TargetColor
  backgroundTheme: BackgroundTheme
  glowEffect: GlowEffect
}

interface UnlockableItem {
  id: string
  name: string
  requirement: number
  unlocked: boolean
}

// Customization unlock requirements
const TARGET_COLORS: UnlockableItem[] = [
  { id: 'cyan', name: 'Cyan Core', requirement: 0, unlocked: true },
  { id: 'purple', name: 'Void Purple', requirement: 50, unlocked: false },
  { id: 'gold', name: 'Golden Glory', requirement: 100, unlocked: false },
  { id: 'red', name: 'Crimson Fury', requirement: 250, unlocked: false },
  { id: 'white', name: 'Prismatic White', requirement: 500, unlocked: false },
]

const BACKGROUND_THEMES: UnlockableItem[] = [
  { id: 'darkArena', name: 'Dark Arena', requirement: 0, unlocked: true },
  { id: 'neonBattlefield', name: 'Neon Battlefield', requirement: 25, unlocked: false },
  { id: 'crimsonWarzone', name: 'Crimson Warzone', requirement: 75, unlocked: false },
]

const GLOW_EFFECTS: UnlockableItem[] = [
  { id: 'standard', name: 'Standard', requirement: 0, unlocked: true },
  { id: 'intense', name: 'Intense', requirement: 30, unlocked: false },
  { id: 'pulsing', name: 'Pulsing', requirement: 60, unlocked: false },
  { id: 'rainbow', name: 'Rainbow', requirement: 120, unlocked: false },
]

// Get color values for target colors
const getTargetColorValues = (color: TargetColor) => {
  switch (color) {
    case 'cyan':
      return {
        primary: '#00ff88',
        secondary: '#00cc6a',
        glow: 'rgba(0, 255, 136, 0.8)',
        gradient: 'radial-gradient(circle at 30% 30%, #40ffb0 0%, #00ff88 40%, #00cc6a 100%)',
      }
    case 'purple':
      return {
        primary: '#9945ff',
        secondary: '#7b2dcc',
        glow: 'rgba(153, 69, 255, 0.8)',
        gradient: 'radial-gradient(circle at 30% 30%, #b366ff 0%, #9945ff 40%, #7b2dcc 100%)',
      }
    case 'gold':
      return {
        primary: '#ffd700',
        secondary: '#cc9900',
        glow: 'rgba(255, 215, 0, 0.8)',
        gradient: 'radial-gradient(circle at 30% 30%, #ffe066 0%, #ffd700 40%, #cc9900 100%)',
      }
    case 'red':
      return {
        primary: '#ff4757',
        secondary: '#cc3945',
        glow: 'rgba(255, 71, 87, 0.8)',
        gradient: 'radial-gradient(circle at 30% 30%, #ff6b7a 0%, #ff4757 40%, #cc3945 100%)',
      }
    case 'white':
      return {
        primary: '#ffffff',
        secondary: '#cccccc',
        glow: 'rgba(255, 255, 255, 0.8)',
        gradient: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #e0e0e0 40%, #cccccc 100%)',
      }
  }
}

// Get background gradient based on theme
const getBackgroundTheme = (theme: BackgroundTheme) => {
  switch (theme) {
    case 'darkArena':
      return 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 25%, #0d1a2e 50%, #0a0a1a 75%, #1a0a2e 100%)'
    case 'neonBattlefield':
      return 'linear-gradient(135deg, #0a0015 0%, #1a0030 25%, #001a2e 50%, #0a0015 75%, #150030 100%)'
    case 'crimsonWarzone':
      return 'linear-gradient(135deg, #1a0505 0%, #2e0a0a 25%, #2e0a15 50%, #1a0505 75%, #2e0a0a 100%)'
  }
}

// ============================================================
// GAME LOGIC HOOK
// ============================================================

function useReflexWars(difficulty: DifficultyMode = 'soldier', customizations: CustomizationState) {
  const settings = DIFFICULTY_SETTINGS[difficulty]
  const [gameState, setGameState] = useState<GameState>('disconnected')
  const [playerScore, setPlayerScore] = useState<number>(0)
  const [match, setMatch] = useState<Match | null>(null)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [countdown, setCountdown] = useState<number>(3)
  const [opponentAction, setOpponentAction] = useState<string>('')
  const [playerId] = useState<string>(() => 'Player_' + Math.random().toString(36).substring(2, 8))
  
  // New state for result screen
  const [personalBest, setPersonalBest] = useState<number | null>(null)
  const [matchReactionTimes, setMatchReactionTimes] = useState<number[]>([])
  const [showResultScreen, setShowResultScreen] = useState(false)
  
  // Battle stats - win streak tracking
  const [currentWinStreak, setCurrentWinStreak] = useState<number>(0)
  const [bestStreak, setBestStreak] = useState<number>(0)
  const [showNewRecordText, setShowNewRecordText] = useState(false)
  
  // Total games played for unlocks
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0)
  
  const [circleScale, setCircleScale] = useState(0)
  const [circlePosition, setCirclePosition] = useState<CirclePosition>({ x: 50, y: 50 })
  const [clickEffect, setClickEffect] = useState(false)
  const [circleSize, setCircleSize] = useState(settings.circleSize)
  const [screenShake, setScreenShake] = useState(false)
  
  // Visual effect states
  const [spawnFlash, setSpawnFlash] = useState(false)
  const [spawnShockwave, setSpawnShockwave] = useState(false)
  const [clickParticles, setClickParticles] = useState<ClickParticle[]>([])
  const [energyCollapse, setEnergyCollapse] = useState(false)
  
  // Glow animation state for rainbow effect
  const [glowHue, setGlowHue] = useState(0)
  
  const circleAppearTime = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Rainbow glow animation
  useEffect(() => {
    if (customizations.glowEffect === 'rainbow' && gameState === 'ready' && circleScale > 0) {
      const interval = setInterval(() => {
        setGlowHue((prev) => (prev + 5) % 360)
      }, 50)
      return () => clearInterval(interval)
    }
  }, [customizations.glowEffect, gameState, circleScale])

  const getWeightedDelay = useCallback((): number => {
    const { minDelay, maxDelay } = settings
    const rand = Math.random()
    if (rand < 0.7) {
      return minDelay + Math.random() * (maxDelay - minDelay)
    } else if (rand < 0.85) {
      return minDelay + (Math.random() * 0.2 + 0.5) * (maxDelay - minDelay)
    } else {
      return minDelay + (Math.random() * 0.2 + 0.7) * (maxDelay - minDelay)
    }
  }, [settings])

  const getRandomPosition = useCallback((): CirclePosition => {
    return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 60 }
  }, [])

  // Update circle size when difficulty changes
  useEffect(() => {
    setCircleSize(settings.circleSize)
  }, [settings.circleSize])

  const startCountdown = useCallback(() => {
    setCountdown(3)
    setGameState('countdown')
    const cd = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cd)
          startRound()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const startRound = useCallback(() => {
    setGameState('ready')
    setReactionTime(null)
    setRoundResult(null)
    setCircleScale(0)
    setCirclePosition(getRandomPosition())
    setOpponentAction('')
    circleAppearTime.current = null

    const delay = getWeightedDelay()
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      circleAppearTime.current = Date.now()
      setGameState('ready')
      
      // REMOVED: Burst effect before button appears
      
      setTimeout(() => setCircleScale(1), 50)
      
      // Screen shake effect for Elite difficulty
      if (settings.hasShake) {
        setScreenShake(true)
        setTimeout(() => setScreenShake(false), 300)
      }
      
      const opponentReaction = 200 + Math.random() * 400
      timerRef.current = setTimeout(() => {
        setOpponentAction('opponent_clicked')
      }, opponentReaction)
    }, delay)
  }, [getWeightedDelay, getRandomPosition, settings.hasShake])

  const findMatch = useCallback(async () => {
    setGameState('waiting')
    
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500))
    
    const opponentNames = ['SpeedySam', 'QuickQuinn', 'FastFrankie', 'RapidRiley', 'SwiftSydney', 'NimbleNoah', 'BriskBella', 'ZippyZoe']
    const opponentName = opponentNames[Math.floor(Math.random() * opponentNames.length)]
    
    const newMatch: Match = {
      id: Math.random().toString(36).substring(2, 10),
      players: [
        { id: playerId, displayName: 'You' },
        { id: 'opponent', displayName: opponentName }
      ],
      currentRound: 1,
      maxRounds: 5,
      scores: [0, 0]
    }
    setMatch(newMatch)
    setGameState('matched')
    startCountdown()
  }, [playerId, startCountdown])

  const createClickParticles = useCallback((x: number, y: number) => {
    const colorValues = getTargetColorValues(customizations.targetColor)
    const colors = [colorValues.primary, colorValues.secondary, '#ffffff', '#9945ff']
    const particles: ClickParticle[] = []
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12
      const speed = 3 + Math.random() * 4
      particles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      })
    }
    setClickParticles(particles)
    setTimeout(() => setClickParticles([]), 500)
  }, [customizations.targetColor])

  const handleClick = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (gameState === 'ready' && circleAppearTime.current) {
      const time = Date.now() - circleAppearTime.current
      setReactionTime(time)
      
      // Track reaction time for the match
      setMatchReactionTimes(prev => [...prev, time])
      
      setGameState('success')
      setClickEffect(true)
      setEnergyCollapse(true)
      
      // Create click particles
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect()
      if (rect) {
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        createClickParticles(x, y)
      }
      
      setTimeout(() => setClickEffect(false), 150)
      setTimeout(() => setEnergyCollapse(false), 300)
      
      const opponentTime = 200 + Math.random() * 400
      const playerWon = time < opponentTime
      
      setRoundResult({ winner: playerWon ? 0 : 1, playerTime: time, opponentTime: opponentTime, isEarly: false })
      
      setMatch(prev => {
        if (!prev) return prev
        const newScores = [...prev.scores] as [number, number]
        if (playerWon) newScores[0]++ 
        else newScores[1]++
        return { ...prev, scores: newScores, currentRound: prev.currentRound + 1 }
      })
    }
  }, [gameState, createClickParticles])

  const continueMatch = useCallback(() => {
    if (!match) return
    // Check if either player has already won 3 rounds (best of 5 = first to 3)
    if (match.scores[0] >= 3 || match.scores[1] >= 3) {
      setGameState('game_over')
    } else if (match.currentRound > match.maxRounds) {
      setGameState('game_over')
    } else {
      startCountdown()
    }
  }, [match, startCountdown])

  const quitMatch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMatch(null)
    setGameState('connected')
    setRoundResult(null)
    setMatchReactionTimes([])
    setShowResultScreen(false)
  }, [])

  const startGame = useCallback(() => {
    setPlayerScore(0)
    setGameState('connected')
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return {
    gameState, 
    playerScore,
    match, 
    reactionTime, 
    roundResult, 
    countdown, 
    opponentAction,
    circleScale, 
    circlePosition, 
    clickEffect,
    circleSize,
    screenShake,
    spawnFlash,
    spawnShockwave,
    clickParticles,
    energyCollapse,
    personalBest,
    matchReactionTimes,
    showResultScreen,
    currentWinStreak,
    bestStreak,
    showNewRecordText,
    totalGamesPlayed,
    glowHue,
    findMatch, 
    handleClick, 
    continueMatch, 
    quitMatch,
    startGame,
    setGameState,
    setPersonalBest,
    setMatchReactionTimes,
    setShowResultScreen,
    setCurrentWinStreak,
    setBestStreak,
    setShowNewRecordText,
    setTotalGamesPlayed,
  }
}

// Available worldwide - no restrictions
type GameState = 
  | 'disconnected' 
  | 'connected'
  | 'waiting'
  | 'matched'
  | 'countdown'
  | 'ready'
  | 'success'
  | 'opponent_early'
  | 'game_over'
  | 'challenge_waiting'
  | 'challenge_accepted'
  | 'duel_result'

// Challenge data structure
interface ChallengeData {
  id: string
  challengerName: string
  challengerScore: number
  timestamp: number
}

interface Player {
  id: string
  displayName: string
}

interface Match {
  id: string
  players: [Player, Player]
  currentRound: number
  maxRounds: number
  scores: [number, number]
}

interface RoundResult {
  winner: 0 | 1 | null
  playerTime: number | null
  opponentTime: number | null
  isEarly: boolean
}

interface CirclePosition {
  x: number
  y: number
}

// Particle interface for click effects
interface ClickParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
}

// ============================================================
// STYLES
// ============================================================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100dvh', 
    width: '100%', 
    position: 'relative', 
    overflow: 'hidden',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    fontFamily: '"Orbitron", "Exo 2", "Rajdhani", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  // CINEMATIC BACKGROUND - Animated gradient with cyber colors
  backgroundGradient: {
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
    zIndex: 0,
    transition: 'background 0.5s ease',
  },
  // Animated light streaks layer
  lightStreaks: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  lightStreak: {
    position: 'absolute',
    width: '2px',
    height: '100%',
    animation: 'lightStreak 8s linear infinite',
  },
  // Floating particles container
  particlesContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  // Grid overlay for cyber feel
  gridOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      linear-gradient(rgba(153, 69, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(153, 69, 255, 0.03) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    zIndex: 3,
    pointerEvents: 'none',
  },
  // Vignette effect
  vignetteOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%)',
    zIndex: 4,
    pointerEvents: 'none',
  },
header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    padding: '12px 16px',
    paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    zIndex: 100,
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoIcon: { 
    fontSize: '32px', 
    filter: 'drop-shadow(0 0 10px rgba(153, 69, 255, 0.8))',
    animation: 'logoPulse 2s ease-in-out infinite',
  },
logoText: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#fff',
    letterSpacing: '4px',
    textShadow: '0 0 20px rgba(153, 69, 255, 0.8), 0 0 40px rgba(20, 241, 149, 0.4)',
    background: 'linear-gradient(90deg, #9945ff, #14f195, #9945ff)',
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'logoGradient 3s linear infinite',
    whiteSpace: 'nowrap',
  },
  content: { 
    position: 'relative', 
    zIndex: 10, 
    minHeight: 'calc(100dvh - 120px)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '80px 16px 60px',
    width: '100%',
  },
  card: {
    background: 'rgba(15, 15, 35, 0.95)',
    borderRadius: '24px', 
    padding: '40px', 
    maxWidth: '420px', 
    width: '100%',
    textAlign: 'center', 
    border: '1px solid rgba(153, 69, 255, 0.3)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(153, 69, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '24px',
    padding: '1px',
    background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.5), rgba(20, 241, 149, 0.3), rgba(153, 69, 255, 0.5))',
    backgroundSize: '300% 300%',
    animation: 'borderGlow 4s ease infinite',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  },
  cardIcon: { 
    fontSize: '72px', 
    marginBottom: '16px',
    filter: 'drop-shadow(0 0 20px rgba(153, 69, 255, 0.6))',
    animation: 'bounce 2s ease-in-out infinite',
  },
  cardTitle: { 
    fontSize: '32px', 
    fontWeight: '900', 
    color: '#fff', 
    margin: '0 0 8px', 
    letterSpacing: '2px',
    textShadow: '0 0 30px rgba(153, 69, 255, 0.5)',
  },
  cardSubtitle: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: '16px', 
    margin: '0 0 30px',
    fontFamily: '"Rajdhani", sans-serif',
    fontWeight: '500',
    letterSpacing: '1px',
  },
  startBtn: {
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)', 
    border: 'none', 
    color: '#fff', 
    fontSize: '20px', 
    fontWeight: '800',
    padding: '18px 50px', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: '12px',
    margin: '0 auto 30px', 
    boxShadow: '0 4px 30px rgba(153, 69, 255, 0.5), 0 0 60px rgba(20, 241, 149, 0.3)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  },
  startBtnHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 40px rgba(153, 69, 255, 0.7), 0 0 80px rgba(20, 241, 149, 0.5)',
  },
  features: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '16px', 
    flexWrap: 'wrap',
    marginTop: '20px',
  },
  feature: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: '13px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px',
    fontFamily: '"Rajdhani", sans-serif',
    fontWeight: '600',
  },
  featureBox: {
    flexDirection: 'column',
    gap: '8px',
    padding: '20px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '16px',
    border: '1px solid rgba(153, 69, 255, 0.2)',
    transition: 'all 0.3s ease',
  },
  featureBoxHover: {
    borderColor: 'rgba(153, 69, 255, 0.5)',
    boxShadow: '0 0 30px rgba(153, 69, 255, 0.3)',
    transform: 'translateY(-5px)',
  },
  findMatchBtn: { 
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)', 
    border: 'none', 
    color: '#000', 
    fontSize: '18px', 
    fontWeight: '800', 
    padding: '18px 50px', 
    borderRadius: '50px', 
    cursor: 'pointer', 
    letterSpacing: '1px', 
    boxShadow: '0 4px 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.3)',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
  },
  armoryBtn: {
    background: 'linear-gradient(135deg, #9945ff 0%, #7b2dcc 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    padding: '12px 32px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '1px',
    boxShadow: '0 4px 20px rgba(153, 69, 255, 0.4)',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
  },
  searching: { 
    color: '#fff', 
    fontSize: '20px', 
    marginBottom: '16px',
    fontFamily: '"Rajdhani", sans-serif',
    fontWeight: '600',
  },
  searchingSpinner: { 
    width: '60px', 
    height: '60px', 
    border: '3px solid rgba(255,255,255,0.1)', 
    borderTopColor: '#00ff88', 
    borderRadius: '50%', 
    margin: '0 auto 20px', 
    animation: 'spin 1s linear infinite',
    boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)',
  },
  waitingText: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: '14px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  matchFound: { 
    marginBottom: '24px',
    animation: 'resultCardEnter 0.5s ease-out',
  },
  matchIcon: { 
    fontSize: '56px', 
    display: 'block', 
    marginBottom: '12px',
    filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.8))',
    animation: 'pulse 0.5s ease-in-out',
  },
  matchInfo: { 
    background: 'rgba(0,0,0,0.4)', 
    borderRadius: '16px', 
    padding: '20px', 
    marginBottom: '20px',
    border: '1px solid rgba(153, 69, 255, 0.2)',
  },
  playerRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    fontSize: '18px', 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: '12px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  matchDetails: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: '13px', 
    color: 'rgba(255,255,255,0.5)',
    fontFamily: '"Rajdhani", sans-serif',
  },
  countdownOverlay: { 
    textAlign: 'center', 
    color: '#fff',
    animation: 'resultCardEnter 0.3s ease-out',
  },
  countdownNumber: { 
    fontSize: '140px', 
    fontWeight: '900', 
    color: '#00ff88', 
    textShadow: '0 0 60px rgba(0, 255, 136, 0.8), 0 0 120px rgba(0, 255, 136, 0.5), 0 0 180px rgba(0, 255, 136, 0.3)',
    animation: 'countdownPulse 0.5s ease-in-out',
    fontFamily: '"Orbitron", sans-serif',
    lineHeight: 1,
  },
  countdownText: { 
    fontSize: '20px', 
    color: 'rgba(255,255,255,0.7)',
    fontFamily: '"Rajdhani", sans-serif',
    fontWeight: '600',
    letterSpacing: '2px',
  },
  gameArea: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    zIndex: 10, 
    touchAction: 'none',
    background: 'transparent',
  },
  // Score bar with neon styling
  scoreBar: {
    position: 'fixed', 
    top: 'calc(60px + env(safe-area-inset-top, 0px))', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '90%', 
    maxWidth: '500px', 
    padding: '14px 20px', 
    background: 'rgba(15, 15, 35, 0.95)', 
    borderRadius: '16px', 
    backdropFilter: 'blur(20px)', 
    zIndex: 20,
    border: '1px solid rgba(153, 69, 255, 0.3)',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 20px rgba(153, 69, 255, 0.2)',
  },
  playerScore: { 
    color: '#00ff88', 
    fontWeight: '800', 
    fontSize: '18px',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
  },
  roundInfo: { 
    color: 'rgba(255,255,255,0.7)', 
    fontSize: '14px',
    fontFamily: '"Rajdhani", sans-serif',
    fontWeight: '600',
    letterSpacing: '1px',
  },
  opponentScore: { 
    color: '#ff6b6b', 
    fontWeight: '800', 
    fontSize: '18px',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px rgba(255, 107, 107, 0.8)',
  },
  gamePrompt: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: '24px', 
    fontWeight: '600',
    fontFamily: '"Rajdhani", sans-serif',
  },
  
  // ENERGY CORE TARGET - The main reaction button
  circleButton: {
    position: 'absolute', 
    borderRadius: '50%', 
    border: 'none', 
    cursor: 'pointer',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    transition: 'transform 0.15s ease-out, box-shadow 0.15s ease-out',
  },
  // Outer glowing ring for energy core
  circleOuterRing: {
    position: 'absolute',
    borderRadius: '50%',
    border: '2px solid',
    animation: 'outerRingPulse 1.5s ease-in-out infinite',
  },
  // Inner ring
  circleInnerRing: {
    position: 'absolute',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    animation: 'innerRingRotate 10s linear infinite',
  },
  circleText: { 
    color: '#000', 
    fontSize: '20px', 
    fontWeight: '900', 
    letterSpacing: '1px',
    fontFamily: '"Orbitron", sans-serif',
    textTransform: 'uppercase',
    textShadow: '0 1px 2px rgba(255,255,255,0.3)',
  },
  
  // Spawn effects
  spawnFlash: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    pointerEvents: 'none',
    animation: 'spawnFlashAnim 0.2s ease-out forwards',
  },
  spawnShockwave: {
    position: 'absolute',
    borderRadius: '50%',
    border: '3px solid',
    zIndex: 16,
    pointerEvents: 'none',
    animation: 'shockwaveAnim 0.4s ease-out forwards',
  },
  
  // Click particles container
  clickParticlesContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 25,
    pointerEvents: 'none',
  },
  clickParticle: {
    position: 'absolute',
    borderRadius: '50%',
    pointerEvents: 'none',
    boxShadow: '0 0 10px currentColor',
  },
  
  // Energy collapse effect
  energyCollapse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    animation: 'energyCollapseAnim 0.3s ease-out forwards',
    pointerEvents: 'none',
  },
  
  // Result card with enhanced styling (no animation)
  resultCard: {
    position: 'absolute', 
    top: '50%', 
    left: '50%', 
    transform: 'translate(-50%, -50%)', 
    background: 'rgba(15, 15, 35, 0.98)',
    borderRadius: '24px', 
    padding: '40px 60px', 
    textAlign: 'center', 
    border: '1px solid rgba(153, 69, 255, 0.4)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(153, 69, 255, 0.3)',
    minWidth: '280px',
  },
  winEmoji: { 
    fontSize: '64px', 
    marginBottom: '12px',
    filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.8))',
    animation: 'celebratePulse 0.5s ease-in-out',
  },
  loseEmoji: { 
    fontSize: '64px', 
    marginBottom: '12px',
    filter: 'drop-shadow(0 0 20px rgba(255, 107, 107, 0.8))',
  },
  winText: { 
    color: '#00ff88', 
    fontSize: '26px', 
    fontWeight: '800', 
    margin: '0 0 8px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '2px',
    textShadow: '0 0 20px rgba(0, 255, 136, 0.8)',
  },
  loseText: { 
    color: '#ff6b6b', 
    fontSize: '26px', 
    fontWeight: '800', 
    margin: '0 0 8px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '2px',
    textShadow: '0 0 20px rgba(255, 107, 107, 0.8)',
  },
  timeText: { 
    color: '#fff', 
    fontSize: '56px', 
    fontWeight: '900', 
    margin: '0 0 8px',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 30px rgba(153, 69, 255, 0.8)',
  },
  opponentInfo: { 
    color: 'rgba(255,255,255,0.5)', 
    fontSize: '14px', 
    margin: 0,
    fontFamily: '"Rajdhani", sans-serif',
  },
  continueBtn: {
    position: 'fixed', 
    bottom: 'calc(100px + env(safe-area-inset-bottom, 0px))', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    background: 'linear-gradient(135deg, #9945ff, #14f195)', 
    color: '#fff',
    fontSize: '16px', 
    fontWeight: '700', 
    padding: '16px 48px', 
    borderRadius: '50px', 
    border: 'none', 
    cursor: 'pointer', 
    zIndex: 30, 
    boxShadow: '0 4px 30px rgba(153, 69, 255, 0.5)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  gameOverIcon: { 
    fontSize: '80px', 
    marginBottom: '16px',
    filter: 'drop-shadow(0 0 20px rgba(153, 69, 255, 0.8))',
  },
  gameOverTitle: { 
    fontSize: '36px', 
    fontWeight: '900', 
    color: '#fff', 
    margin: '0 0 24px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '2px',
    textShadow: '0 0 30px rgba(153, 69, 255, 0.8)',
  },
  finalScore: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '20px', 
    fontSize: '28px', 
    fontWeight: '700', 
    color: '#fff', 
    marginBottom: '24px',
    fontFamily: '"Orbitron", sans-serif',
  },
  resultInfo: { 
    marginBottom: '16px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  resultLabel: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: '14px', 
    marginBottom: '4px',
    fontFamily: '"Rajdhani", sans-serif',
    fontWeight: '600',
    letterSpacing: '1px',
  },
  resultAmount: { 
    color: '#00ff88', 
    fontSize: '32px', 
    fontWeight: '900',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 20px rgba(0, 255, 136, 0.8)',
  },
  playAgainBtn: { 
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)', 
    border: 'none', 
    color: '#fff', 
    fontSize: '16px', 
    fontWeight: '700', 
    padding: '14px 40px', 
    borderRadius: '50px', 
    cursor: 'pointer',
    boxShadow: '0 4px 30px rgba(153, 69, 255, 0.5)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  footer: { 
    position: 'fixed', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: '12px 16px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    textAlign: 'center', 
    color: 'rgba(255,255,255,0.3)', 
    fontSize: '12px', 
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)', 
    zIndex: 100,
    fontFamily: '"Rajdhani", sans-serif',
    letterSpacing: '1px',
  },
loginBtn: {
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    padding: '10px 20px',
    borderRadius: '25px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(153, 69, 255, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    boxShadow: '0 0 15px rgba(153, 69, 255, 0.5)',
  },
  userName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    maxWidth: '100px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '12px',
    fontWeight: '600',
    padding: '8px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    letterSpacing: '0.5px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
    animation: 'fadeIn 0.3s ease-out',
  },
  modalContent: {
    background: 'linear-gradient(145deg, rgba(30, 30, 60, 0.98), rgba(15, 15, 35, 0.98))',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '360px',
    width: '90%',
    textAlign: 'center',
    border: '1px solid rgba(153, 69, 255, 0.3)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(153, 69, 255, 0.2)',
    animation: 'modalSlideIn 0.4s ease-out',
  },
  modalTitle: {
    color: '#fff',
    fontSize: '26px',
    fontWeight: '800',
    margin: '0 0 8px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '1px',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    margin: '0 0 24px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  inputField: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid rgba(153, 69, 255, 0.3)',
    background: 'rgba(0, 0, 0, 0.4)',
    color: '#fff',
    fontSize: '16px',
    marginBottom: '20px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: '"Rajdhani", sans-serif',
  },
  modalLoginBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    padding: '14px',
    borderRadius: '25px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(153, 69, 255, 0.4)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    marginTop: '16px',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontFamily: '"Rajdhani", sans-serif',
    transition: 'color 0.2s',
  },
  googleBtn: {
    width: '100%',
    background: '#fff',
    border: 'none',
    color: '#333',
    fontSize: '16px',
    fontWeight: '600',
    padding: '14px',
    borderRadius: '25px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '16px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  googleIcon: {
    width: '20px',
    height: '20px',
  },
  orText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '14px',
    margin: '0 0 16px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(0,0,0,0.1)',
    borderTopColor: '#333',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  userEmail: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
playersOnline: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0, 0, 0, 0.4)',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    border: '1px solid rgba(153, 69, 255, 0.3)',
    fontFamily: '"Rajdhani", sans-serif',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#00ff88',
    boxShadow: '0 0 8px rgba(0, 255, 136, 0.8), 0 0 16px rgba(0, 255, 136, 0.4)',
    animation: 'onlinePulse 2s ease-in-out infinite',
  },
headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },

  // Back button style
  backButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  },
  
  // ============================================================
  // CINEMATIC RESULT SCREEN STYLES (no animation)
  // ============================================================
  resultScreenOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 5, 16, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
    backdropFilter: 'blur(20px)',
  },
  resultScreenCard: {
    background: 'linear-gradient(145deg, rgba(30, 30, 60, 0.98), rgba(10, 10, 30, 0.98))',
    borderRadius: '32px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    border: '2px solid rgba(0, 255, 136, 0.4)',
    boxShadow: '0 0 80px rgba(0, 255, 136, 0.3), 0 25px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  resultScreenGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '32px',
    padding: '2px',
    background: 'linear-gradient(135deg, #9945ff, #14f195, #9945ff)',
    backgroundSize: '300% 300%',
    animation: 'borderGlow 4s ease infinite',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none',
  },
  resultScreenTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    fontFamily: '"Orbitron", sans-serif',
  },
  resultScreenMainTime: {
    fontSize: '80px',
    fontWeight: '900',
    color: '#fff',
    textShadow: '0 0 40px rgba(0, 255, 136, 0.8), 0 0 80px rgba(0, 255, 136, 0.4)',
    lineHeight: 1,
    marginBottom: '24px',
    fontFamily: '"Orbitron", sans-serif',
    animation: 'glowText 2s ease-in-out infinite',
  },
  resultScreenMs: {
    fontSize: '28px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: '"Rajdhani", sans-serif',
  },
  resultScreenStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '32px',
    padding: '24px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '20px',
    border: '1px solid rgba(153, 69, 255, 0.2)',
    flexWrap: 'wrap',
  },
  resultScreenStat: {
    flex: 1,
    textAlign: 'center',
    minWidth: '70px',
  },
  resultScreenStatLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '6px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  resultScreenStatValue: {
    fontSize: '22px',
    fontWeight: '800',
    fontFamily: '"Orbitron", sans-serif',
  },
  personalBestValue: {
    color: '#ffd700',
    textShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
  },
  rankValue: {
    color: '#9945ff',
    textShadow: '0 0 20px rgba(153, 69, 255, 0.8)',
  },
  resultScreenButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fightAgainBtn: {
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    color: '#000',
    fontSize: '18px',
    fontWeight: '800',
    padding: '18px 36px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '1px',
    boxShadow: '0 4px 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.3)',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  shareBtn: {
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    padding: '16px 36px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 30px rgba(153, 69, 255, 0.5)',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  leaderboardBtn: {
    background: 'transparent',
    border: '2px solid rgba(255,255,255,0.3)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    padding: '14px 36px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  
  // Toast Styles
  toastContainer: {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 300,
    animation: 'toastSlideIn 0.3s ease-out',
  },
  toastMessage: {
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    color: '#000',
    padding: '14px 28px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '700',
    boxShadow: '0 4px 30px rgba(0, 255, 136, 0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  newRecordBadge: {
    position: 'absolute',
    top: '-14px',
    right: '-14px',
    background: 'linear-gradient(135deg, #ffd700, #ff9500)',
    color: '#000',
    fontSize: '11px',
    fontWeight: '900',
    padding: '6px 12px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
    animation: 'pulse 1s ease-in-out infinite',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.5)',
    zIndex: 10,
  },
  // New Record Banner
  newRecordBanner: {
    background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.15), rgba(255, 215, 0, 0.15))',
    borderRadius: '16px',
    padding: '14px 20px',
    marginBottom: '20px',
    animation: 'newRecordPulse 1s ease-in-out infinite',
    border: '2px solid rgba(255, 215, 0, 0.5)',
  },
  newRecordText: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#ffd700',
    textShadow: '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 165, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '1px',
  },
  // Streak stat styles
  streakValue: {
    color: '#14f195',
    textShadow: '0 0 20px rgba(20, 241, 149, 0.8)',
  },
  bestStreakValue: {
    color: '#9945ff',
    textShadow: '0 0 20px rgba(153, 69, 255, 0.8)',
  },
  
  // Difficulty Selector Styles
  difficultyContainer: {
    marginBottom: '28px',
  },
  difficultyLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '14px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  difficultyOptions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  difficultyBtn: {
    flex: 1,
    padding: '14px 8px',
    borderRadius: '14px',
    border: '2px solid rgba(153, 69, 255, 0.2)',
    background: 'rgba(0, 0, 0, 0.3)',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  difficultyBtnActive: {
    borderColor: '#00ff88',
    background: 'rgba(0, 255, 136, 0.15)',
    color: '#00ff88',
    boxShadow: '0 0 25px rgba(0, 255, 136, 0.4), inset 0 0 20px rgba(0, 255, 136, 0.1)',
  },
  difficultyIcon: {
    fontSize: '24px',
    display: 'block',
    marginBottom: '6px',
  },
  difficultyDesc: {
    fontSize: '9px',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '4px',
    letterSpacing: '0.5px',
  },
  // Screen shake animation
  screenShake: {
    animation: 'shake 0.3s ease-in-out',
  },
  
  // Warrior name display
  warriorNameDisplay: {
    color: '#9945ff',
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
    textShadow: '0 0 15px rgba(153, 69, 255, 0.8)',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '1px',
  },

  // ============================================================
  // ARMORY PANEL STYLES
  // ============================================================
  armoryOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 5, 16, 0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 600,
    padding: '20px',
    backdropFilter: 'blur(15px)',
  },
  armoryContainer: {
    background: 'linear-gradient(145deg, rgba(25, 25, 55, 0.98), rgba(15, 15, 40, 0.98))',
    borderRadius: '28px',
    maxWidth: '520px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'hidden',
    border: '2px solid rgba(153, 69, 255, 0.4)',
    boxShadow: '0 0 60px rgba(153, 69, 255, 0.3), 0 25px 80px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
  },
  armoryHeader: {
    padding: '24px 20px 16px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  armoryTitle: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#fff',
    margin: 0,
    letterSpacing: '3px',
    textShadow: '0 0 30px rgba(153, 69, 255, 0.6)',
    background: 'linear-gradient(135deg, #9945ff, #14f195)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  armorySubtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '6px',
    letterSpacing: '1px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  armoryCloseBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  armoryContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
  },
  armorySection: {
    marginBottom: '24px',
  },
  armorySectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: '14px',
    fontFamily: '"Rajdhani", sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  armoryOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: '10px',
  },
  armoryOption: {
    padding: '12px 8px',
    borderRadius: '14px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  armoryOptionSelected: {
    borderColor: '#00ff88',
    boxShadow: '0 0 20px rgba(0, 255, 136, 0.4), inset 0 0 20px rgba(0, 255, 136, 0.1)',
    background: 'rgba(0, 255, 136, 0.1)',
  },
  armoryOptionLocked: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  armoryOptionColor: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    margin: '0 auto 8px',
    boxShadow: '0 0 15px currentColor',
  },
  armoryOptionName: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: '0.5px',
    fontFamily: '"Rajdhani", sans-serif',
    textTransform: 'uppercase',
  },
  armoryOptionLock: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    fontSize: '12px',
  },
  armoryOptionUnlock: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '4px',
    fontFamily: '"Rajdhani", sans-serif',
  },
gamesPlayedBadge: {
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(153, 69, 255, 0.4)',
    fontFamily: '"Rajdhani", sans-serif',
  },

  // ============================================================
  // CHALLENGE FEATURE STYLES
  // ============================================================
  
  // Challenge a Friend Button
  challengeBtn: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    padding: '16px 36px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 30px rgba(255, 107, 107, 0.5)',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  
  // Challenge Link Modal
  challengeModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(15px)',
    animation: 'fadeIn 0.3s ease-out',
  },
  challengeModalCard: {
    background: 'linear-gradient(145deg, rgba(40, 20, 60, 0.98), rgba(20, 10, 35, 0.98))',
    borderRadius: '28px',
    padding: '40px',
    maxWidth: '420px',
    width: '90%',
    textAlign: 'center',
    border: '2px solid rgba(255, 107, 107, 0.4)',
    boxShadow: '0 0 60px rgba(255, 107, 107, 0.3), 0 25px 80px rgba(0, 0, 0, 0.8)',
    animation: 'modalSlideIn 0.4s ease-out',
    position: 'relative',
  },
  challengeModalIcon: {
    fontSize: '56px',
    marginBottom: '16px',
    filter: 'drop-shadow(0 0 20px rgba(255, 107, 107, 0.8))',
    animation: 'pulse 1s ease-in-out infinite',
  },
  challengeModalTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#fff',
    margin: '0 0 12px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '1px',
  },
  challengeModalText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
    margin: '0 0 24px',
    fontFamily: '"Rajdhani", sans-serif',
    lineHeight: 1.5,
  },
  challengeLinkBox: {
    background: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '12px',
    padding: '14px 18px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    wordBreak: 'break-all',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: '"Rajdhani", sans-serif',
  },
  challengeModalButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  generateLinkBtn: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    padding: '16px 32px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 25px rgba(255, 107, 107, 0.5)',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  
  // Challenge Waiting Screen (when friend opens link)
  challengeWaitingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 5, 16, 0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
    padding: '20px',
    backdropFilter: 'blur(20px)',
  },
  challengeWaitingCard: {
    background: 'linear-gradient(145deg, rgba(40, 20, 60, 0.98), rgba(20, 10, 35, 0.98))',
    borderRadius: '32px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    textAlign: 'center',
    border: '2px solid rgba(255, 107, 107, 0.5)',
    boxShadow: '0 0 80px rgba(255, 107, 107, 0.4), 0 25px 80px rgba(0, 0, 0, 0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  challengeChallengerInfo: {
    background: 'rgba(255, 107, 107, 0.15)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid rgba(255, 107, 107, 0.3)',
  },
  challengerName: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#ff6b6b',
    margin: '0 0 8px',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 20px rgba(255, 107, 107, 0.6)',
  },
  challengerScore: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#fff',
    margin: '0',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 30px rgba(255, 255, 255, 0.5)',
  },
  challengerScoreLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '4px',
    fontFamily: '"Rajdhani", sans-serif',
    letterSpacing: '1px',
  },
  challengeSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 28px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  acceptChallengeBtn: {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '800',
    padding: '20px 60px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '1px',
    boxShadow: '0 4px 30px rgba(255, 107, 107, 0.6), 0 0 60px rgba(255, 142, 83, 0.3)',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  declineChallengeBtn: {
    background: 'transparent',
    border: '2px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 32px',
    borderRadius: '50px',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  
  // Challenge Game Area
  challengeGameArea: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    touchAction: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeScoreBar: {
    position: 'fixed',
    top: 'calc(60px + env(safe-area-inset-top, 0px))',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    maxWidth: '500px',
    padding: '14px 20px',
    background: 'rgba(15, 15, 35, 0.95)',
    borderRadius: '16px',
    backdropFilter: 'blur(20px)',
    zIndex: 60,
    border: '1px solid rgba(255, 107, 107, 0.3)',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255, 107, 107, 0.2)',
  },
  challengeChallengerScore: {
    color: '#ff6b6b',
    fontWeight: '800',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px rgba(255, 107, 107, 0.8)',
  },
  challengeVsText: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '2px',
  },
  challengePlayerScore: {
    color: '#00ff88',
    fontWeight: '800',
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
  },
  challengePrompt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '20px',
    fontWeight: '600',
    marginTop: '100px',
    fontFamily: '"Rajdhani", sans-serif',
    textAlign: 'center',
  },
  
  // Duel Result Screen
  duelResultOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 5, 16, 0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 700,
    padding: '20px',
    backdropFilter: 'blur(25px)',
    animation: 'fadeIn 0.5s ease-out',
  },
  duelResultCard: {
    background: 'linear-gradient(145deg, rgba(40, 20, 60, 0.98), rgba(15, 10, 30, 0.98))',
    borderRadius: '32px',
    padding: '48px 32px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    border: '3px solid rgba(255, 107, 107, 0.5)',
    boxShadow: '0 0 100px rgba(255, 107, 107, 0.4), 0 25px 100px rgba(0, 0, 0, 0.8)',
    position: 'relative',
    overflow: 'hidden',
    animation: 'duelReveal 0.8s ease-out',
  },
  duelResultTitle: {
    fontSize: '32px',
    fontWeight: '900',
    margin: '0 0 24px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '2px',
  },
  victoryTitle: {
    color: '#00ff88',
    textShadow: '0 0 30px rgba(0, 255, 136, 0.8), 0 0 60px rgba(0, 255, 136, 0.4)',
  },
  defeatTitle: {
    color: '#ff6b6b',
    textShadow: '0 0 30px rgba(255, 107, 107, 0.8), 0 0 60px rgba(255, 107, 107, 0.4)',
  },
  
  // Split screen duel display
  duelSplitScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  duelPlayerCard: {
    flex: 1,
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '20px',
    padding: '24px 16px',
    border: '2px solid',
  },
  duelChallengerCard: {
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  duelPlayerCardWin: {
    borderColor: 'rgba(0, 255, 136, 0.6)',
    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)',
  },
  duelPlayerCardLose: {
    borderColor: 'rgba(255, 107, 107, 0.6)',
    boxShadow: '0 0 30px rgba(255, 107, 107, 0.3)',
  },
  duelPlayerName: {
    fontSize: '14px',
    fontWeight: '700',
    marginBottom: '8px',
    fontFamily: '"Orbitron", sans-serif',
    letterSpacing: '1px',
  },
  duelChallengerName: {
    color: '#ff6b6b',
  },
  duelPlayerTime: {
    fontSize: '36px',
    fontWeight: '900',
    fontFamily: '"Orbitron", sans-serif',
  },
  duelChallengerTime: {
    color: '#ff6b6b',
    textShadow: '0 0 20px rgba(255, 107, 107, 0.6)',
  },
  duelPlayerTime2: {
    color: '#00ff88',
    textShadow: '0 0 20px rgba(0, 255, 136, 0.6)',
  },
  duelVsBadge: {
    background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '900',
    color: '#fff',
    fontFamily: '"Orbitron", sans-serif',
    boxShadow: '0 0 25px rgba(255, 107, 107, 0.6)',
    flexShrink: 0,
  },
  
  // Duel result buttons
  duelResultButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rematchBtn: {
    background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
    border: 'none',
    color: '#000',
    fontSize: '16px',
    fontWeight: '800',
    padding: '16px 40px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 30px rgba(0, 255, 136, 0.5)',
    textTransform: 'uppercase',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  sendBackChallengeBtn: {
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '700',
    padding: '14px 32px',
    borderRadius: '50px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 25px rgba(153, 69, 255, 0.5)',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },
  backToMenuBtn: {
    background: 'transparent',
    border: '2px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    fontWeight: '600',
    padding: '12px 28px',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
  },

  // ============================================================
  // RW COINS UI STYLES
  // ============================================================
  
  // Coin Display in Header
coinDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1))',
    padding: '8px 16px',
    borderRadius: '25px',
    border: '1px solid rgba(255, 215, 0, 0.4)',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.2), inset 0 0 15px rgba(255, 215, 0, 0.05)',
    whiteSpace: 'nowrap',
  },
  coinIcon: {
    fontSize: '20px',
    filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.8))',
  },
  coinAmount: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#ffd700',
    fontFamily: '"Orbitron", sans-serif',
    textShadow: '0 0 10px rgba(255, 215, 0, 0.6)',
    letterSpacing: '1px',
  },
  coinAmountLow: {
    color: '#ff6b6b',
    textShadow: '0 0 10px rgba(255, 107, 107, 0.6)',
  },
  
  // Coin Animation
  coinChangePopup: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '25px',
    fontSize: '16px',
    fontWeight: '800',
    fontFamily: '"Orbitron", sans-serif',
    zIndex: 150,
    animation: 'coinPopup 2s ease-out forwards',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
  },
  coinChangeWin: {
    background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
    color: '#000',
    border: '2px solid rgba(0, 255, 136, 0.5)',
  },
  coinChangeLoss: {
    background: 'linear-gradient(135deg, #ff6b6b, #ff4757)',
    color: '#fff',
    border: '2px solid rgba(255, 107, 107, 0.5)',
  },
  coinChangeClaim: {
    background: 'linear-gradient(135deg, #ffd700, #ff9500)',
    color: '#000',
    border: '2px solid rgba(255, 215, 0, 0.5)',
  },

  // Arena Selection Overlay
  arenaOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 5, 16, 0.98)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
    padding: '20px',
    backdropFilter: 'blur(15px)',
  },
  arenaContainer: {
    background: 'linear-gradient(145deg, rgba(25, 25, 55, 0.98), rgba(15, 15, 40, 0.98))',
    borderRadius: '28px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'hidden',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    boxShadow: '0 0 60px rgba(255, 215, 0, 0.2), 0 25px 80px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
  },
  arenaHeader: {
    padding: '24px 20px 16px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.05))',
  },
  arenaTitle: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#ffd700',
    margin: 0,
    letterSpacing: '3px',
    textShadow: '0 0 30px rgba(255, 215, 0, 0.6)',
    fontFamily: '"Orbitron", sans-serif',
  },
  arenaSubtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '6px',
    letterSpacing: '1px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  arenaCloseBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.7)',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  arenaContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  arenaList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  arenaCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: '16px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  arenaCardSelected: {
    borderColor: '#ffd700',
    boxShadow: '0 0 25px rgba(255, 215, 0, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.1)',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0.4))',
  },
  arenaCardLocked: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  arenaIcon: {
    fontSize: '36px',
    marginRight: '16px',
    flexShrink: 0,
  },
  arenaInfo: {
    flex: 1,
  },
  arenaName: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '4px',
    fontFamily: '"Orbitron", sans-serif',
  },
  arenaDescription: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: '"Rajdhani", sans-serif',
  },
  arenaRiskBadge: {
    fontSize: '10px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: '"Rajdhani", sans-serif',
  },
  arenaFeeContainer: {
    textAlign: 'right',
    marginLeft: '16px',
  },
  arenaFeeLabel: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '4px',
    fontFamily: '"Rajdhani", sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  arenaFee: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    fontSize: '18px',
    fontWeight: '800',
    fontFamily: '"Orbitron", sans-serif',
  },
  arenaRewardContainer: {
    textAlign: 'right',
    marginTop: '8px',
  },
  arenaRewardLabel: {
    fontSize: '9px',
    color: 'rgba(255, 255, 255, 0.3)',
    fontFamily: '"Rajdhani", sans-serif',
  },
  arenaReward: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#00ff88',
    fontFamily: '"Rajdhani", sans-serif',
  },
  arenaSelectBtn: {
    background: 'linear-gradient(135deg, #ffd700 0%, #ff9500 100%)',
    border: 'none',
    color: '#000',
    fontSize: '16px',
    fontWeight: '800',
    padding: '16px 40px',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 4px 30px rgba(255, 215, 0, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
    marginTop: '20px',
    width: '100%',
  },
  notEnoughCoins: {
    background: 'rgba(255, 107, 107, 0.2)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
    borderRadius: '12px',
    padding: '12px',
    marginTop: '16px',
    color: '#ff6b6b',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: '"Rajdhani", sans-serif',
    textAlign: 'center',
  },
  
  // Daily Claim Button
  dailyClaimBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #ffd700 0%, #ff9500 100%)',
    border: 'none',
    color: '#000',
    fontSize: '14px',
    fontWeight: '800',
    padding: '10px 20px',
    borderRadius: '25px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
    transition: 'all 0.3s ease',
    fontFamily: '"Rajdhani", sans-serif',
    letterSpacing: '0.5px',
  },
}

// ============================================================
// ARMORY PANEL COMPONENT
// ============================================================

function ArmoryPanel({ 
  customizations, 
  onCustomizationChange,
  totalGamesPlayed,
  onClose 
}: { 
  customizations: CustomizationState
  onCustomizationChange: (key: keyof CustomizationState, value: string) => void
  totalGamesPlayed: number
  onClose: () => void
}) {
  // Determine which items are unlocked based on games played
  const isUnlocked = (requirement: number) => totalGamesPlayed >= requirement

  return (
    <div style={styles.armoryOverlay} onClick={onClose}>
      <div style={styles.armoryContainer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.armoryHeader}>
          <button 
            style={styles.armoryCloseBtn}
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ✕
          </button>
          <h2 style={styles.armoryTitle}>⚔️ ARMORY ⚔️</h2>
          <p style={styles.armorySubtitle}>Customize your battle gear</p>
        </div>

        {/* Games Played Badge */}
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <div style={styles.gamesPlayedBadge}>
            🎮 {totalGamesPlayed} Games Played
          </div>
        </div>

        {/* Content */}
        <div style={styles.armoryContent}>
          {/* Target Colors */}
          <div style={styles.armorySection}>
            <div style={styles.armorySectionTitle}>
              <span>🎯</span> Target Color
            </div>
            <div style={styles.armoryOptions}>
              {TARGET_COLORS.map((color) => {
                const colorValues = getTargetColorValues(color.id as TargetColor)
                const unlocked = isUnlocked(color.requirement)
                const selected = customizations.targetColor === color.id
                
                return (
                  <div
                    key={color.id}
                    style={{
                      ...styles.armoryOption,
                      ...(selected ? styles.armoryOptionSelected : {}),
                      ...(!unlocked ? styles.armoryOptionLocked : {}),
                    }}
                    onClick={() => unlocked && onCustomizationChange('targetColor', color.id)}
                  >
                    {!unlocked && <span style={styles.armoryOptionLock}>🔒</span>}
                    <div 
                      style={{
                        ...styles.armoryOptionColor,
                        background: colorValues.gradient,
                        color: colorValues.primary,
                      }} 
                    />
                    <div style={styles.armoryOptionName}>{color.name}</div>
                    {!unlocked && (
                      <div style={styles.armoryOptionUnlock}>{color.requirement} games</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Background Themes */}
          <div style={styles.armorySection}>
            <div style={styles.armorySectionTitle}>
              <span>🌌</span> Battleground
            </div>
            <div style={styles.armoryOptions}>
              {BACKGROUND_THEMES.map((theme) => {
                const unlocked = isUnlocked(theme.requirement)
                const selected = customizations.backgroundTheme === theme.id
                
                return (
                  <div
                    key={theme.id}
                    style={{
                      ...styles.armoryOption,
                      ...(selected ? styles.armoryOptionSelected : {}),
                      ...(!unlocked ? styles.armoryOptionLocked : {}),
                    }}
                    onClick={() => unlocked && onCustomizationChange('backgroundTheme', theme.id)}
                  >
                    {!unlocked && <span style={styles.armoryOptionLock}>🔒</span>}
                    <div 
                      style={{
                        ...styles.armoryOptionColor,
                        background: getBackgroundTheme(theme.id as BackgroundTheme),
                        borderRadius: '8px',
                        width: 'auto',
                        height: '36px',
                      }} 
                    />
                    <div style={styles.armoryOptionName}>{theme.name}</div>
                    {!unlocked && (
                      <div style={styles.armoryOptionUnlock}>{theme.requirement} games</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Glow Effects */}
          <div style={styles.armorySection}>
            <div style={styles.armorySectionTitle}>
              <span>✨</span> Glow Effect
            </div>
            <div style={styles.armoryOptions}>
              {GLOW_EFFECTS.map((effect) => {
                const unlocked = isUnlocked(effect.requirement)
                const selected = customizations.glowEffect === effect.id
                
                return (
                  <div
                    key={effect.id}
                    style={{
                      ...styles.armoryOption,
                      ...(selected ? styles.armoryOptionSelected : {}),
                      ...(!unlocked ? styles.armoryOptionLocked : {}),
                    }}
                    onClick={() => unlocked && onCustomizationChange('glowEffect', effect.id)}
                  >
                    {!unlocked && <span style={styles.armoryOptionLock}>🔒</span>}
                    <div 
                      style={{
                        ...styles.armoryOptionColor,
                        background: effect.id === 'rainbow' 
                          ? 'linear-gradient(135deg, #ff0000, #ff9900, #ffff00, #00ff00, #0099ff, #9900ff)'
                          : effect.id === 'intense'
                            ? 'rgba(153, 69, 255, 0.8)'
                            : effect.id === 'pulsing'
                              ? 'rgba(20, 241, 149, 0.8)'
                              : 'rgba(0, 255, 136, 0.6)',
                        animation: effect.id === 'pulsing' ? 'pulse 1s ease-in-out infinite' : 'none',
                      }} 
                    />
                    <div style={styles.armoryOptionName}>{effect.name}</div>
                    {!unlocked && (
                      <div style={styles.armoryOptionUnlock}>{effect.requirement} games</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inline Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// CHALLENGE GAME AREA COMPONENT
// ============================================================

function ChallengeGameArea({
  challengeData,
  customizations,
  glowHue,
  onComplete,
  onCancel,
  colorValues,
}: {
  challengeData: ChallengeData
  customizations: CustomizationState
  glowHue: number
  onComplete: (playerTime: number) => void
  onCancel: () => void
  colorValues: ReturnType<typeof getTargetColorValues>
}) {
  const settings = DIFFICULTY_SETTINGS.soldier
  const [gameState, setGameState] = useState<'countdown' | 'ready' | 'success'>('countdown')
  const [countdown, setCountdown] = useState(3)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [circleScale, setCircleScale] = useState(0)
  const [circlePosition, setCirclePosition] = useState<CirclePosition>({ x: 50, y: 50 })
  const [clickEffect, setClickEffect] = useState(false)
  const [energyCollapse, setEnergyCollapse] = useState(false)
  const [clickParticles, setClickParticles] = useState<ClickParticle[]>([])
  
  const circleAppearTime = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get random position
  const getRandomPosition = useCallback((): CirclePosition => {
    return { x: 15 + Math.random() * 70, y: 15 + Math.random() * 60 }
  }, [])
  
  // Create click particles
  const createClickParticles = useCallback((x: number, y: number) => {
    const colors = [colorValues.primary, colorValues.secondary, '#ffffff', '#9945ff']
    const particles: ClickParticle[] = []
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12
      const speed = 3 + Math.random() * 4
      particles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      })
    }
    setClickParticles(particles)
    setTimeout(() => setClickParticles([]), 500)
  }, [colorValues])
  
  // Start countdown
  useEffect(() => {
    setGameState('countdown')
    setCountdown(3)
    
    const cd = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(cd)
          startRound()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(cd)
  }, [])
  
  // Start the round
  const startRound = useCallback(() => {
    setGameState('ready')
    setReactionTime(null)
    setCircleScale(0)
    setCirclePosition(getRandomPosition())
    circleAppearTime.current = null
    
    const delay = 600 + Math.random() * 1400
    if (timerRef.current) clearTimeout(timerRef.current)
    
    timerRef.current = setTimeout(() => {
      circleAppearTime.current = Date.now()
      setGameState('ready')
      setTimeout(() => setCircleScale(1), 50)
    }, delay)
  }, [getRandomPosition])
  
  // Handle click
  const handleClick = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (gameState === 'ready' && circleAppearTime.current) {
      const time = Date.now() - circleAppearTime.current
      setReactionTime(time)
      setGameState('success')
      setClickEffect(true)
      setEnergyCollapse(true)
      
      const rect = (e?.currentTarget as HTMLElement)?.getBoundingClientRect()
      if (rect) {
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        createClickParticles(x, y)
      }
      
      setTimeout(() => setClickEffect(false), 150)
      setTimeout(() => setEnergyCollapse(false), 300)
      
      // Complete the challenge after showing result
      setTimeout(() => {
        onComplete(time)
      }, 1500)
    }
  }, [gameState, createClickParticles, onComplete])
  
  // Get dynamic circle style
  const getDynamicCircleStyle = (baseSize: number): React.CSSProperties => {
    const glowIntensity = customizations.glowEffect === 'intense' ? 1.5 : 
                          customizations.glowEffect === 'pulsing' ? 1.2 : 1
    
    let glowColor = colorValues.glow
    if (customizations.glowEffect === 'rainbow') {
      glowColor = `hsl(${glowHue}, 100%, 60%)`
    }
    
    return {
      ...styles.circleButton,
      width: baseSize,
      height: baseSize,
      background: colorValues.gradient,
      boxShadow: clickEffect 
        ? `0 0 ${80 * glowIntensity}px ${glowColor}, 0 0 ${120 * glowIntensity}px ${glowColor}, inset 0 0 30px rgba(255, 255, 255, 0.5)` 
        : `0 0 ${50 * glowIntensity}px ${glowColor}, 0 0 ${100 * glowIntensity}px ${glowColor}, 0 0 ${150 * glowIntensity}px ${glowColor}, inset 0 0 30px rgba(255, 255, 255, 0.3)`,
    }
  }
  
  return (
    <div style={styles.challengeGameArea}>
      {/* Score Bar */}
      <div style={styles.challengeScoreBar}>
        <span style={styles.challengeChallengerScore}>
          {challengeData.challengerName}: {challengeData.challengerScore}ms
        </span>
        <span style={styles.challengeVsText}>VS</span>
        <span style={styles.challengePlayerScore}>
          You: {reactionTime ? `${reactionTime}ms` : '--'}
        </span>
      </div>
      
      {/* Countdown */}
      {gameState === 'countdown' && (
        <div style={styles.countdownOverlay}>
          <div style={styles.countdownNumber}>{countdown}</div>
          <p>Prepare to click!</p>
        </div>
      )}
      
      {/* Ready - Circle visible */}
      {gameState === 'ready' && circleScale > 0 && (
        <>
          <button
            onClick={(e) => handleClick(e)} 
            style={{
              ...getDynamicCircleStyle(130),
              left: circlePosition.x + '%', 
              top: circlePosition.y + '%',
              transform: `translate(-50%, -50%) scale(${circleScale})`,
            }}
          >
            <span style={{
              ...styles.circleText, 
              transform: clickEffect ? 'scale(1.15)' : 'scale(1)',
              color: clickEffect ? '#fff' : '#000',
            }}>
              CLICK!
            </span>
            {energyCollapse && (
              <div style={{
                ...styles.energyCollapse,
                background: `radial-gradient(circle, ${colorValues.primary}80 0%, transparent 70%)`,
              }} />
            )}
          </button>
        </>
      )}
      
      {/* Success - Show result */}
      {gameState === 'success' && reactionTime !== null && (
        <div style={styles.resultCard}>
          <div style={reactionTime < challengeData.challengerScore ? styles.winEmoji : styles.loseEmoji}>
            {reactionTime < challengeData.challengerScore ? '🎉' : '😢'}
          </div>
          <h2 style={reactionTime < challengeData.challengerScore ? styles.winText : styles.loseText}>
            {reactionTime < challengeData.challengerScore ? 'YOU WON!' : 'TOO SLOW!'}
          </h2>
          <p style={styles.timeText}>{reactionTime}ms</p>
          <p style={styles.opponentInfo}>Target: {challengeData.challengerScore}ms</p>
        </div>
      )}
      
      {/* Click particles */}
      <div style={styles.clickParticlesContainer}>
        {clickParticles.map((particle) => (
          <div
            key={particle.id}
            style={{
              ...styles.clickParticle,
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              transform: `translate(${particle.vx * (1 - particle.life)}px, ${particle.vy * (1 - particle.life)}px)`,
              opacity: particle.life,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// COIN STATE HOOK (RW Coins System)
// ============================================================

function useRWCoinSystem() {
  const [coinBalance, setCoinBalance] = useState<number>(5000) // Start with 5000 coins
  const [lastClaimTime, setLastClaimTime] = useState<number>(0)
  const [canClaimDaily, setCanClaimDaily] = useState<boolean>(true)
  const [coinChangeAnimation, setCoinChangeAnimation] = useState<{ amount: number; type: 'win' | 'loss' | 'claim' } | null>(null)

  // Load coins from localStorage on mount
  useEffect(() => {
    const savedCoins = localStorage.getItem('reflexwars_rw_coins')
    if (savedCoins) {
      const parsed = parseInt(savedCoins, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        setCoinBalance(parsed)
      }
    }
    
    const savedClaimTime = localStorage.getItem('reflexwars_last_claim')
    if (savedClaimTime) {
      const timestamp = parseInt(savedClaimTime, 10)
      if (!isNaN(timestamp)) {
        setLastClaimTime(timestamp)
        // Check if 24 hours have passed since last claim
        const hoursSinceLastClaim = (Date.now() - timestamp) / (1000 * 60 * 60)
        setCanClaimDaily(hoursSinceLastClaim >= 24)
      }
    }
  }, [])

  // Save coins to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reflexwars_rw_coins', coinBalance.toString())
  }, [coinBalance])

  // Check for daily claim availability every minute
  useEffect(() => {
    const checkClaimAvailability = () => {
      if (lastClaimTime > 0) {
        const hoursSinceLastClaim = (Date.now() - lastClaimTime) / (1000 * 60 * 60)
        setCanClaimDaily(hoursSinceLastClaim >= 24)
      }
    }
    
    checkClaimAvailability()
    const interval = setInterval(checkClaimAvailability, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [lastClaimTime])

  // Deduct entry fee
  const deductEntryFee = (fee: number): boolean => {
    if (coinBalance < fee) {
      return false // Not enough coins
    }
    setCoinBalance(prev => prev - fee)
    setCoinChangeAnimation({ amount: fee, type: 'loss' })
    setTimeout(() => setCoinChangeAnimation(null), 2000)
    return true
  }

  // Add winnings (90% of pot)
  const addWinnings = (amount: number) => {
    setCoinBalance(prev => prev + amount)
    setCoinChangeAnimation({ amount, type: 'win' })
    setTimeout(() => setCoinChangeAnimation(null), 2000)
  }

  // Claim daily supply (1000 coins)
  const claimDailySupply = (): boolean => {
    if (!canClaimDaily || coinBalance > 0) {
      return false // Already claimed or has balance
    }
    
    setCoinBalance(1000)
    setLastClaimTime(Date.now())
    setLastClaimTime(Date.now())
    localStorage.setItem('reflexwars_last_claim', Date.now().toString())
    setCanClaimDaily(false)
    setCoinChangeAnimation({ amount: 1000, type: 'claim' })
    setTimeout(() => setCoinChangeAnimation(null), 2000)
    return true
  }

  // Check if player can afford arena
  const canAfford = (fee: number): boolean => {
    return coinBalance >= fee
  }

  return {
    coinBalance,
    lastClaimTime,
    canClaimDaily,
    coinChangeAnimation,
    deductEntryFee,
    addWinnings,
    claimDailySupply,
    canAfford,
    setCoinBalance,
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReflexWars() {
  // Difficulty state
  const [difficulty, setDifficulty] = useState<DifficultyMode>('soldier')
  
  // Arena state (RW Coins)
  const [selectedArena, setSelectedArena] = useState<ArenaId>('training')
  const [showArenaSelect, setShowArenaSelect] = useState(false)
  
  // Coin system state
  const {
    coinBalance,
    lastClaimTime,
    canClaimDaily,
    coinChangeAnimation,
    deductEntryFee,
    addWinnings,
    claimDailySupply,
    canAfford,
    setCoinBalance,
  } = useRWCoinSystem()
  
  // Customization state - load from localStorage
  const [customizations, setCustomizations] = useState<CustomizationState>({
    targetColor: 'cyan',
    backgroundTheme: 'darkArena',
    glowEffect: 'standard',
  })
  
  // Total games played for unlocks
  const [totalGamesPlayed, setTotalGamesPlayed] = useState<number>(0)
  
  // Show armory panel
  const [showArmory, setShowArmory] = useState(false)
  
  const { 
    gameState, playerScore, match, reactionTime, roundResult, countdown, opponentAction, 
    circleScale, circlePosition, clickEffect, circleSize, screenShake,
    spawnFlash, spawnShockwave, clickParticles, energyCollapse,
    personalBest, matchReactionTimes, showResultScreen, currentWinStreak, bestStreak, showNewRecordText, 
    glowHue,
    findMatch, handleClick, continueMatch, quitMatch, startGame, setGameState, 
    setPersonalBest, setMatchReactionTimes, setShowResultScreen, 
    setCurrentWinStreak, setBestStreak, setShowNewRecordText,
  } = useReflexWars(difficulty, customizations)

  // Login state - initialize from localStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Warrior Name state - initialize from localStorage
  const [warriorName, setWarriorName] = useState<string>('')
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [usernameError, setUsernameError] = useState<string>('')
  const [playersOnline, setPlayersOnline] = useState<number>(247)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, duration: number, delay: number}>>([])
  const [ambientParticles, setAmbientParticles] = useState<Array<{id: number, x: number, y: number, size: number, duration: number, delay: number, color: string}>>([])
  
  // Toast state
  const [toast, setToast] = useState<{visible: boolean, message: string}>({ visible: false, message: '' })
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  // Back button visibility state
  const [showBackButton, setShowBackButton] = useState(false)
  
  // Support modal state
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportForm, setSupportForm] = useState({
    username: '',
    email: '',
    message: ''
  })
  const [supportSent, setSupportSent] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  
// Animation state for counting up numbers
  const [displayedTime, setDisplayedTime] = useState(0)
  
  // Challenge state
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeResult, setChallengeResult] = useState<'win' | 'lose' | null>(null)
  const [isChallengeMode, setIsChallengeMode] = useState(false)
  
  // Battle stats - local state for persistence
  const [battleStats, setBattleStats] = useState({
    personalBest: null as number | null,
    currentWinStreak: 0,
    bestStreak: 0,
  })

  // Animated time for result screen
  useEffect(() => {
    if (showResultScreen) {
      const finalTime = matchReactionTimes.length > 0 
        ? Math.round(matchReactionTimes.reduce((a, b) => a + b, 0) / matchReactionTimes.length)
        : reactionTime || 0
      
      // Animate the number counting up
      let startTime = 0
      const duration = 1500
      const startTimestamp = Date.now()
      
      const animateCountUp = () => {
        const elapsed = Date.now() - startTimestamp
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3)
        setDisplayedTime(Math.round(finalTime * easeOut))
        
        if (progress < 1) {
          requestAnimationFrame(animateCountUp)
        }
      }
      
      requestAnimationFrame(animateCountUp)
    }
  }, [showResultScreen, reactionTime, matchReactionTimes])

  // Create floating ambient particles
  useEffect(() => {
    const newParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 10,
      color: i % 3 === 0 ? '#9945ff' : i % 3 === 1 ? '#14f195' : '#00ff88',
    }))
    setAmbientParticles(newParticles)
  }, [])

  // Legacy particles (kept for compatibility)
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }))
    setParticles(newParticles)
  }, [])

  // Load Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  // Simulate online players count
  useEffect(() => {
    const updateOnlinePlayers = () => setPlayersOnline(Math.floor(200 + Math.random() * 100))
    updateOnlinePlayers()
    const interval = setInterval(updateOnlinePlayers, 30000)
    return () => clearInterval(interval)
  }, [])

  // Load battle stats and customizations from localStorage
  useEffect(() => {
    // Load battle stats
    const savedStats = localStorage.getItem('reflexwars_battle_stats')
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats)
        setBattleStats({
          personalBest: parsed.personalBest || null,
          currentWinStreak: parsed.currentWinStreak || 0,
          bestStreak: parsed.bestStreak || 0,
        })
        setPersonalBest(parsed.personalBest || null)
        setCurrentWinStreak(parsed.currentWinStreak || 0)
        setBestStreak(parsed.bestStreak || 0)
      } catch (e) {
        console.error('Error parsing battle stats:', e)
      }
    }
    
    // Load total games played
    const savedGames = localStorage.getItem('reflexwars_total_games')
    if (savedGames) {
      try {
        const games = parseInt(savedGames, 10)
        setTotalGamesPlayed(games)
      } catch (e) {
        console.error('Error parsing total games:', e)
      }
    }
    
    // Load customizations
    const savedCustomizations = localStorage.getItem('reflexwars_customizations')
    if (savedCustomizations) {
      try {
        const parsed = JSON.parse(savedCustomizations)
        setCustomizations({
          targetColor: parsed.targetColor || 'cyan',
          backgroundTheme: parsed.backgroundTheme || 'darkArena',
          glowEffect: parsed.glowEffect || 'standard',
        })
      } catch (e) {
        console.error('Error parsing customizations:', e)
      }
    }
    
    // Load warrior name from localStorage
    const savedWarriorName = localStorage.getItem('reflexwars_warrior_name')
    if (savedWarriorName) {
      setWarriorName(savedWarriorName)
    }
  }, [setPersonalBest, setCurrentWinStreak, setBestStreak])

  // Save customizations to localStorage
  const saveCustomizations = (newCustomizations: CustomizationState) => {
    setCustomizations(newCustomizations)
    localStorage.setItem('reflexwars_customizations', JSON.stringify(newCustomizations))
  }

  // Handle customization change
  const handleCustomizationChange = (key: keyof CustomizationState, value: string) => {
    const newCustomizations = { ...customizations, [key]: value }
    saveCustomizations(newCustomizations)
  }

  // Save battle stats to localStorage
  const saveBattleStats = (newStats: { personalBest: number | null, currentWinStreak: number, bestStreak: number }) => {
    setBattleStats(newStats)
    setPersonalBest(newStats.personalBest)
    setCurrentWinStreak(newStats.currentWinStreak)
    setBestStreak(newStats.bestStreak)
    localStorage.setItem('reflexwars_battle_stats', JSON.stringify(newStats))
  }

  // Show result screen when game ends
  useEffect(() => {
    if (gameState === 'game_over' && match && reactionTime !== null) {
      // Calculate average reaction time from match
      const avgTime = matchReactionTimes.length > 0 
        ? Math.round(matchReactionTimes.reduce((a, b) => a + b, 0) / matchReactionTimes.length)
        : reactionTime
      
      // Determine if player won the match
      const playerWon = match.scores[0] > match.scores[1]
      
      // Award coins based on match result (RW Coins System)
      const currentArena = ARENAS.find(a => a.id === selectedArena)
      if (currentArena && currentArena.entryFee > 0) {
        if (playerWon) {
          // Winner receives 90% of total pot (2 players = 2x entry fee)
          const winnings = calculatePotentialReward(currentArena.entryFee)
          addWinnings(winnings)
        }
        // Loser already paid entry fee when starting match
      }
      
      // Update win streak
      let newCurrentStreak = playerWon ? currentWinStreak + 1 : 0
      let newBestStreak = Math.max(bestStreak, newCurrentStreak)
      
      // Check for new personal best
      const isNewRecord = battleStats.personalBest === null || avgTime < battleStats.personalBest
      
      // Save all battle stats
      saveBattleStats({
        personalBest: isNewRecord ? avgTime : battleStats.personalBest,
        currentWinStreak: newCurrentStreak,
        bestStreak: newBestStreak,
      })
      
      // Increment total games played
      const newTotalGames = totalGamesPlayed + 1
      setTotalGamesPlayed(newTotalGames)
      localStorage.setItem('reflexwars_total_games', newTotalGames.toString())
      
      // Show new record notification
      if (isNewRecord) {
        setIsNewRecord(true)
        setShowNewRecordText(true)
        setTimeout(() => setShowNewRecordText(false), 3000)
      }
      
      setShowResultScreen(true)
    }
  }, [gameState, match, reactionTime, matchReactionTimes, currentWinStreak, bestStreak, battleStats.personalBest, totalGamesPlayed, setPersonalBest, setCurrentWinStreak, setBestStreak, setShowResultScreen])

  // Toast notification handler
  const showToast = (message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: '' })
    }, 3000)
  }

  // Share victory handler
  const handleShareVictory = async () => {
    const avgTime = matchReactionTimes.length > 0 
      ? Math.round(matchReactionTimes.reduce((a, b) => a + b, 0) / matchReactionTimes.length)
      : reactionTime || 0
    
    const shareText = `I just scored ${avgTime}ms in Reflex Wars ⚔️  
Think you're faster? Prove it.  
Play now: https://yourgameurl.com`

    try {
      await navigator.clipboard.writeText(shareText)
      showToast('Victory copied to clipboard! 🎉')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Victory copied to clipboard! 🎉')
    }
  }

  // Fight again handler
  const handleFightAgain = () => {
    setShowResultScreen(false)
    setMatchReactionTimes([])
    setIsNewRecord(false)
    setShowNewRecordText(false)
    setGameState('connected')
  }

  // Auto-advance to next round after 2 seconds when round is complete
  useEffect(() => {
    if (gameState === 'success' || gameState === 'opponent_early') {
      const timer = setTimeout(() => {
        continueMatch()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gameState, continueMatch])

  // Leaderboard handler
  const handleLeaderboard = () => {
    setShowLeaderboard(true)
  }

// Back button handler - navigate to home/disconnected state
  const handleBack = () => {
    quitMatch()
    setShowBackButton(false)
    // Navigate to home screen
    setGameState('disconnected')
  }

// Show back button based on game state
  useEffect(() => {
    const shouldShowBack = ['waiting', 'matched', 'countdown', 'ready', 'success', 'opponent_early', 'game_over'].includes(gameState)
    setShowBackButton(shouldShowBack)
  }, [gameState])

  // Parse URL parameters for challenge data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const challengeId = params.get('challenge')
      const userParam = params.get('user')
      const scoreParam = params.get('score')
      
      if (challengeId && userParam && scoreParam) {
        // Validate and set challenge data
        const score = parseInt(scoreParam, 10)
        if (!isNaN(score) && score > 0 && score < 10000) {
          setChallengeData({
            id: challengeId,
            challengerName: decodeURIComponent(userParam),
            challengerScore: score,
            timestamp: Date.now(),
          })
          setIsChallengeMode(true)
          setGameState('challenge_waiting')
          
          // Clear URL params after reading
          window.history.replaceState({}, '', window.location.pathname)
        }
      }
    }
  }, [setGameState])

  // Challenge handlers
  const handleChallengeFriend = () => {
    setShowChallengeModal(true)
  }

  const generateChallengeLink = () => {
    const avgTime = matchReactionTimes.length > 0 
      ? Math.round(matchReactionTimes.reduce((a, b) => a + b, 0) / matchReactionTimes.length)
      : reactionTime || 0
    
    const challengeId = Math.random().toString(36).substring(2, 10)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reflexwars.game'
    const challengeUrl = `${baseUrl}?challenge=${challengeId}&user=${encodeURIComponent(warriorName || 'Warrior')}&score=${avgTime}`
    
    navigator.clipboard.writeText(challengeUrl).then(() => {
      showToast('Challenge link copied! Send it to your friend 🎯')
      setShowChallengeModal(false)
    }).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = challengeUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Challenge link copied! Send it to your friend 🎯')
      setShowChallengeModal(false)
    })
  }

  const handleAcceptChallenge = () => {
    setGameState('challenge_accepted')
  }

  const handleChallengeComplete = (playerTime: number) => {
    if (!challengeData) return
    
    const playerWon = playerTime < challengeData.challengerScore
    setChallengeResult(playerWon ? 'win' : 'lose')
    setGameState('duel_result')
  }

  const handleSendBackChallenge = () => {
    // Create a new challenge with current player's score
    const currentScore = displayedTime || reactionTime || 0
    const challengeId = Math.random().toString(36).substring(2, 10)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reflexwars.game'
    const challengeUrl = `${baseUrl}?challenge=${challengeId}&user=${encodeURIComponent(warriorName || 'Warrior')}&score=${currentScore}`
    
    navigator.clipboard.writeText(challengeUrl).then(() => {
      showToast('Challenge link sent back! 🎯')
    }).catch(() => {
      const textArea = document.createElement('textarea')
      textArea.value = challengeUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('Challenge link sent back! 🎯')
    })
  }

  const handleChallengeRematch = () => {
    setChallengeResult(null)
    setIsChallengeMode(false)
    setChallengeData(null)
    setGameState('connected')
  }

  const handleBackFromChallenge = () => {
    setChallengeData(null)
    setIsChallengeMode(false)
    setGameState('connected')
  }

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('reflexwars_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        if (userData.email && userData.username) {
          setEmail(userData.email)
          setUsername(userData.username)
          setIsLoggedIn(true)
        }
      } catch (e) {
        console.error('Error parsing saved user data:', e)
      }
    }
  }, [])

  // Save user data to localStorage
  const saveUserData = (email: string, username: string) => {
    const userData = {
      email,
      username,
      loginTime: Date.now()
    }
    localStorage.setItem('reflexwars_user', JSON.stringify(userData))
  }

  // Validate and save warrior name
  const saveWarriorName = (name: string): boolean => {
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setUsernameError('Please enter a warrior name')
      return false
    }
    
    if (trimmedName.length < 3) {
      setUsernameError('Name must be at least 3 characters')
      return false
    }
    
    if (trimmedName.length > 12) {
      setUsernameError('Name must be 12 characters or less')
      return false
    }
    
    setWarriorName(trimmedName)
    localStorage.setItem('reflexwars_warrior_name', trimmedName)
    setUsernameError('')
    return true
  }

  // Handle username modal submit
  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = (e.target as HTMLFormElement).elements.namedItem('warriorName') as HTMLInputElement
    if (saveWarriorName(input.value)) {
      setShowUsernameModal(false)
    }
  }

  const handleGoogleLogin = () => {
    setIsLoading(true)
    
    // Check if Google Identity Services is available and we have a valid Client ID
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (window.google?.accounts?.id && clientId && clientId !== 'YOUR_CLIENT_ID') {
      // Use real Google OAuth with valid Client ID
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) {
            // Decode the JWT token to get user info
            const decoded = JSON.parse(atob(response.credential.split('.')[1]))
            const googleEmail = decoded.email
            const googleName = decoded.name || decoded.given_name || googleEmail.split('@')[0]
            
            setEmail(googleEmail)
            setUsername(googleName)
            setIsLoggedIn(true)
            saveUserData(googleEmail, googleName)
            setShowLoginModal(false)
            setIsLoading(false)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false
      })

      // Show the Google sign-in prompt
      window.google.accounts.id.prompt()
    } else {
      // Fallback - use mock login for demo (works without Google Client ID)
      const mockEmail = email || `player${Math.floor(Math.random() * 9000) + 1000}@gmail.com`
      const displayName = mockEmail.split('@')[0]
      
      setEmail(mockEmail)
      setUsername(displayName)
      setIsLoggedIn(true)
      saveUserData(mockEmail, displayName)
      setShowLoginModal(false)
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Revoke Google OAuth if available
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
    
    localStorage.removeItem('reflexwars_user')
    setIsLoggedIn(false)
    setUsername('')
    setEmail('')
  }

  const openLoginModal = () => {
    setShowLoginModal(true)
  }

  // Get current target color values
  const colorValues = getTargetColorValues(customizations.targetColor)

  // Calculate dynamic styles based on customizations
  const getDynamicCircleStyle = (baseSize: number): React.CSSProperties => {
    const glowIntensity = customizations.glowEffect === 'intense' ? 1.5 : 
                          customizations.glowEffect === 'pulsing' ? 1.2 : 1
    
    let glowColor = colorValues.glow
    if (customizations.glowEffect === 'rainbow') {
      glowColor = `hsl(${glowHue}, 100%, 60%)`
    }
    
    return {
      ...styles.circleButton,
      width: baseSize,
      height: baseSize,
      background: colorValues.gradient,
      boxShadow: clickEffect 
        ? `0 0 ${80 * glowIntensity}px ${glowColor}, 0 0 ${120 * glowIntensity}px ${glowColor}, inset 0 0 30px rgba(255, 255, 255, 0.5)` 
        : `0 0 ${50 * glowIntensity}px ${glowColor}, 0 0 ${100 * glowIntensity}px ${glowColor}, 0 0 ${150 * glowIntensity}px ${glowColor}, inset 0 0 30px rgba(255, 255, 255, 0.3)`,
    }
  }

  const getDynamicOuterRingStyle = (baseSize: number): React.CSSProperties => {
    let glowColor = colorValues.primary
    if (customizations.glowEffect === 'rainbow') {
      glowColor = `hsl(${glowHue}, 100%, 60%)`
    }
    
    return {
      ...styles.circleOuterRing,
      width: baseSize + 30,
      height: baseSize + 30,
      borderColor: glowColor,
      boxShadow: `0 0 30px ${glowColor}, inset 0 0 30px ${glowColor}40`,
    }
  }

  // Add mobile responsive styles and cinematic animations
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap');
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(153, 69, 255, 0.4), 0 0 40px rgba(20, 241, 149, 0.2); }
        50% { box-shadow: 0 0 40px rgba(153, 69, 255, 0.6), 0 0 60px rgba(20, 241, 149, 0.4); }
      }
      @keyframes particle-float {
        0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
      }
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes pulse-glow {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes logoPulse {
        0%, 100% { filter: drop-shadow(0 0 10px rgba(153, 69, 255, 0.8)); }
        50% { filter: drop-shadow(0 0 20px rgba(153, 69, 255, 1)); }
      }
      @keyframes logoGradient {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
      @keyframes borderGlow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes outerRingPulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.1); opacity: 1; }
      }
      @keyframes innerRingRotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes spawnFlashAnim {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes shockwaveAnim {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
      @keyframes energyCollapseAnim {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(0); opacity: 0; }
      }
      @keyframes countdownPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); text-shadow: 0 0 80px rgba(0, 255, 136, 1), 0 0 160px rgba(0, 255, 136, 0.7); }
        100% { transform: scale(1); }
      }
      @keyframes glowText {
        0%, 100% { text-shadow: 0 0 40px rgba(0, 255, 136, 0.8), 0 0 80px rgba(0, 255, 136, 0.4); }
        50% { text-shadow: 0 0 60px rgba(0, 255, 136, 1), 0 0 100px rgba(0, 255, 136, 0.6); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalSlideIn {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes resultScreenEnter {
        from { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
      @keyframes onlinePulse {
        0%, 100% { box-shadow: 0 0 8px rgba(0, 255, 136, 0.8), 0 0 16px rgba(0, 255, 136, 0.4); }
        50% { box-shadow: 0 0 12px rgba(0, 255, 136, 1), 0 0 24px rgba(0, 255, 136, 0.6); }
      }
      @keyframes ambientParticleFloat {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100px) translateX(30px); opacity: 0; }
      }
      @keyframes lightStreakAnim {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100vh); }
      }
      .hero-card {
        animation: glow 2s ease-in-out infinite, float 3s ease-in-out infinite;
      }
      .play-btn {
        animation: pulse-glow 2s ease-in-out infinite;
      }
      .particle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }
      .ambient-particle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: ambientParticleFloat var(--duration) ease-in-out infinite;
        animation-delay: var(--delay);
      }
      .light-streak {
        position: absolute;
        width: 2px;
        height: 100%;
        background: linear-gradient(to bottom, transparent, rgba(153, 69, 255, 0.3), transparent);
        animation: lightStreakAnim 8s linear infinite;
        animation-delay: var(--delay);
      }
      .hero-title {
        background: linear-gradient(135deg, #9945ff, #14f195, #9945ff);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradient-shift 3s ease infinite;
      }
      .hero-subtitle {
        animation: bounce 2s ease-in-out infinite;
      }
      .feature-icon {
        animation: float 3s ease-in-out infinite;
      }
      .feature-icon:nth-child(2) { animation-delay: 0.5s; }
      .feature-icon:nth-child(3) { animation-delay: 1s; }
@media (max-width: 480px) {
        .card { padding: 24px 16px !important; border-radius: 16px !important; }
        .cardTitle { font-size: 22px !important; }
        .cardIcon { font-size: 40px !important; }
        .playNowLoginBtn { position: absolute !important; top: 10px !important; right: 10px !important; font-size: 10px !important; padding: 5px 10px !important; z-index: 10 !important; }
        .findMatchBtn { padding: 14px 32px !important; font-size: 16px !important; }
        .countdownNumber { font-size: 80px !important; }
        .scoreBar { padding: 12px 16px !important; width: 94% !important; }
        .playerScore, .opponentScore { font-size: 14px !important; }
        .roundInfo { font-size: 12px !important; }
        .circleButton { width: 100px !important; height: 100px !important; }
        .circleText { font-size: 16px !important; }
        .resultCard { padding: 24px 32px !important; }
        .timeText { font-size: 36px !important; }
        .winText, .loseText { font-size: 18px !important; }
        .continueBtn { padding: 14px 36px !important; font-size: 14px !important; bottom: 80px !important; }
        .gameOverTitle { font-size: 24px !important; }
        .finalScore { font-size: 18px !important; }
        .resultAmount { font-size: 24px !important; }
        .features { gap: 12px !important; }
        .feature { font-size: 11px !important; }
        .resultScreenCard { padding: 32px 20px !important; border-radius: 24px !important; }
        .resultScreenTitle { font-size: 12px !important; }
        .resultScreenMainTime { font-size: 48px !important; }
.resultScreenMs { font-size: 18px !important; }
        .resultScreenStats { padding: 16px !important; gap: 12px !important; flex-wrap: wrap; }
        .resultScreenStat { min-width: 45%; }
        .resultScreenStatLabel { font-size: 9px !important; }
        .resultScreenStatValue { font-size: 14px !important; }
        .fightAgainBtn, .shareBtn, .leaderboardBtn { padding: 14px 24px !important; font-size: 14px !important; }
        .newRecordBadge { font-size: 9px !important; padding: 3px 8px !important; }
        .newRecordBanner { padding: 8px 12px !important; margin-bottom: 16px !important; }
        .newRecordText { font-size: 14px !important; }
        .difficultyOptions { gap: 6px !important; }
        .difficultyBtn { padding: 10px 4px !important; font-size: 9px !important; }
        .difficultyIcon { font-size: 16px !important; }
        .difficultyDesc { display: none !important; }
        .armoryOptions { grid-template-columns: repeat(3, 1fr) !important; }
        .armoryOption { padding: 10px 6px !important; }
        .armoryOptionName { font-size: 8px !important; }
      }
      @media (max-width: 360px) {
        .circleButton { width: 90px !important; height: 90px !important; }
      }
      * { box-sizing: border-box; }
      body { overflow-x: hidden; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
      @keyframes toastSlideIn {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
      @keyframes toastSlideOut {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(100px); opacity: 0; }
      }
      @keyframes resultCardEnter {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes celebratePulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes newRecordPulse {
        0% { transform: scale(1); text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
        50% { transform: scale(1.1); text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 165, 0, 0.5); }
        100% { transform: scale(1); text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
      }
      .result-card-enter {
        animation: resultCardEnter 0.4s ease-out forwards;
      }
      .toast-enter {
        animation: toastSlideIn 0.3s ease-out forwards;
      }
      .toast-exit {
        animation: toastSlideOut 0.3s ease-in forwards;
      }
      .new-record-text {
        animation: newRecordPulse 1s ease-in-out infinite;
        background: linear-gradient(90deg, #ffd700, #ff9500, #ffd700);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
.screen-shake {
        animation: shake 0.3s ease-in-out;
      }
      @keyframes duelReveal {
        0% { transform: scale(0.8); opacity: 0; }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes vsGlow {
        0%, 100% { box-shadow: 0 0 25px rgba(255, 107, 107, 0.6); }
        50% { box-shadow: 0 0 40px rgba(255, 107, 107, 0.9), 0 0 60px rgba(255, 142, 83, 0.5); }
      }
      .vs-glow {
        animation: vsGlow 1s ease-in-out infinite;
      }
      @keyframes challengePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .challenge-pulse {
        animation: challengePulse 1.5s ease-in-out infinite;
      }
      @keyframes coinPopup {
        0% { opacity: 0; transform: translateY(-20px) scale(0.8); }
        20% { opacity: 1; transform: translateY(0) scale(1.1); }
        30% { transform: translateY(0) scale(1); }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-10px); }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const getMatchWinner = () => {
    if (!match) return null
    if (match.scores[0] > match.scores[1]) return 'YOU WIN!'
    if (match.scores[0] < match.scores[1]) return 'YOU LOSE'
    return 'DRAW'
  }

  return (
    <main style={styles.container}>
      {/* Dynamic background based on selected theme */}
      <div 
        style={{
          ...styles.backgroundGradient,
          background: getBackgroundTheme(customizations.backgroundTheme),
        }} 
      />
      
      {/* Light streaks */}
      <div style={styles.lightStreaks}>
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="light-streak"
            style={{
              left: `${15 + i * 20}%`,
              '--delay': `${i * 2}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Floating ambient particles */}
      <div style={styles.particlesContainer}>
        {ambientParticles.map((particle) => (
          <div
            key={particle.id}
            className="ambient-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              opacity: 0.6,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
              '--duration': `${particle.duration}s`,
              '--delay': `${particle.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Grid overlay for cyber feel */}
      <div style={styles.gridOverlay} />
      
      {/* Vignette effect */}
      <div style={styles.vignetteOverlay} />
      
      <div style={styles.header}>
        {/* Back Button - shown when not on home screen */}
        {showBackButton && (
          <button 
            style={styles.backButton}
            onClick={handleBack}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ←
          </button>
        )}
        
        <div style={styles.logo}>
          <span style={styles.logoText} className="logoText">REFLEX WARS</span>
        </div>
        
        <div style={styles.headerRight}>
          {/* RW Coins Display */}
          <div style={styles.coinDisplay}>
            <span style={styles.coinIcon}>🪙</span>
            <span style={{
              ...styles.coinAmount,
              ...(coinBalance < 500 ? styles.coinAmountLow : {}),
            }}>
              {coinBalance.toLocaleString()}
            </span>
          </div>
        
          {/* Players Online Indicator */}
          <div style={styles.playersOnline}>
            <span style={styles.onlineDot} />
            <span>{playersOnline} Online</span>
          </div>
        
          {!isLoggedIn ? (
            <button 
              style={styles.loginBtn} 
              onClick={openLoginModal}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 25px rgba(153, 69, 255, 0.6)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(153, 69, 255, 0.4)'
              }}
            >
              🔐 Login
            </button>
          ) : (
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <span style={styles.userName}>{username}</span>
                <div style={styles.userEmail}>{email}</div>
              </div>
              <button 
                style={styles.logoutBtn}
                onClick={handleLogout}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={styles.content}>
        {/* Legacy particles (for compatibility) */}
        {particles.map((particle) => (
          <div
            key={`legacy-${particle.id}`}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              background: particle.id % 2 === 0 ? 'rgba(153, 69, 255, 0.6)' : 'rgba(20, 241, 149, 0.6)',
              animation: `particle-float ${particle.duration}s linear infinite`,
              animationDelay: `${particle.id * 0.5}s`,
            }}
          />
        ))}

{(gameState === 'disconnected') && (
          <div style={{...styles.card, padding: '50px 40px'}} className="hero-card">
            {/* Glowing border effect */}
            <div style={styles.cardGlowBorder} />
            
            {/* Login/User Section - Top Right of Card */}
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
              {!isLoggedIn ? (
                <button
                  onClick={openLoginModal}
                  style={{
                    ...styles.loginBtn,
                    fontSize: '12px',
                    padding: '8px 16px',
                  }}
                >
                  🔐 Login
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9945ff, #14f195)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}>
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            
            <div style={{...styles.cardIcon, fontSize: '80px', animation: 'bounce 2s ease-in-out infinite'}} className="cardIcon">⚔️</div>
            <h1 style={{...styles.cardTitle, fontSize: '42px', background: 'linear-gradient(135deg, #9945ff, #14f195)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}} className="hero-title">REFLEX WARS</h1>
            <p style={{...styles.cardSubtitle, fontSize: '20px', animation: 'bounce 2s ease-in-out infinite'}} className="hero-subtitle">1v1 Reaction Battle</p>
<button 
              onClick={startGame} 
              style={{
                ...styles.startBtn,
                padding: '20px 60px',
                fontSize: '22px',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
              className="play-btn"
            >
              PLAY NOW
            </button>
            
            {/* Challenge a Friend Button - shown on main screen */}
            {warriorName && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                <button 
                  onClick={() => setShowChallengeModal(true)}
                  style={{
                    ...styles.challengeBtn,
                    width: 'auto',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 6px 30px rgba(255, 107, 107, 0.6)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(255, 107, 107, 0.5)'
                  }}
                >
                  🎯 Challenge a Friend
                </button>
              </div>
            )}
            
            {/* Armory Button - centered below PLAY NOW */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button 
                onClick={() => setShowArmory(true)}
                style={{
                  ...styles.armoryBtn,
                  width: 'auto',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(153, 69, 255, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(153, 69, 255, 0.4)'
                }}
              >
                🛡️ Armory
              </button>
            </div>

            {/* Support Button - below Armory */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
              <button 
                onClick={() => setShowSupportModal(true)}
                style={{
                  ...styles.armoryBtn,
                  width: 'auto',
                  background: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(0, 180, 219, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 180, 219, 0.4)'
                }}
              >
                🎧 Support
              </button>
            </div>
            
            <div style={{...styles.features, marginTop: '20px'}} className="features">
              <div style={{...styles.feature, flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px'}} className="feature-icon">
                <span style={{fontSize: '32px'}}>⚔️</span>
                <span>Real-time 1v1</span>
              </div>
              <div style={{...styles.feature, flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px'}} className="feature-icon">
                <span style={{fontSize: '32px'}}>🏆</span>
                <span>Best of 5</span>
              </div>
              <div style={{...styles.feature, flexDirection: 'column', gap: '8px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px'}} className="feature-icon">
                <span style={{fontSize: '32px'}}>⚡</span>
                <span>Test Reflexes</span>
              </div>
            </div>
          </div>
        )}

        {gameState === 'connected' && (
          <div style={styles.card} className="card">
            <div style={styles.cardGlowBorder} />
            <h2 style={styles.cardTitle} className="cardTitle">LOBBY</h2>
            
            {/* Arena Info */}
            <div style={{ marginBottom: '24px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
              Ready to test your reflexes? Select an arena to enter!
            </div>
            
            {/* Selected Arena Display */}
            <div 
              onClick={() => setShowArenaSelect(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 165, 0, 0.1))',
                borderRadius: '16px',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                marginBottom: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.3)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '28px' }}>
                {ARENAS.find(a => a.id === selectedArena)?.icon}
              </span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '800', 
                  color: ARENAS.find(a => a.id === selectedArena)?.color,
                  fontFamily: '"Orbitron", sans-serif',
                }}>
                  {ARENAS.find(a => a.id === selectedArena)?.name}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: '"Rajdhani", sans-serif',
                }}>
                  Click to change arena
                </div>
              </div>
              <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)' }}>→</span>
            </div>
            
            {/* Entry Fee Display */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px',
              padding: '12px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '12px',
            }}>
              <span style={{ fontSize: '18px' }}>🪙</span>
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: canAfford(ARENAS.find(a => a.id === selectedArena)?.entryFee || 0) ? '#ffd700' : '#ff6b6b',
                fontFamily: '"Orbitron", sans-serif',
              }}>
                {ARENAS.find(a => a.id === selectedArena)?.entryFee.toLocaleString() || 0} Entry
              </span>
              {(ARENAS.find(a => a.id === selectedArena)?.entryFee || 0) > 0 && (
                <span style={{ 
                  fontSize: '14px', 
                  color: '#00ff88',
                  fontFamily: '"Rajdhani", sans-serif',
                }}>
                  → Win {calculatePotentialReward(ARENAS.find(a => a.id === selectedArena)?.entryFee || 0).toLocaleString()}
                </span>
              )}
            </div>
            
            {/* Daily Claim (if needed) */}
            {coinBalance === 0 && canClaimDaily && (
              <button 
                style={{
                  ...styles.dailyClaimBtn,
                  width: '100%',
                  marginBottom: '16px',
                }}
                onClick={() => {
                  if (claimDailySupply()) {
                    showToast('🎁 Claimed 1,000 RW Coins!')
                  }
                }}
              >
                🎁 Claim Daily Supply (1,000 RW Coins)
              </button>
            )}
            
            <button 
              onClick={() => {
                const arena = ARENAS.find(a => a.id === selectedArena)
                if (!arena) return
                
                if (!canAfford(arena.entryFee)) {
                  showToast('Not enough RW Coins!')
                  setShowArenaSelect(true)
                  return
                }
                
                if (!warriorName) {
                  setShowUsernameModal(true)
                } else {
                  // Deduct entry fee
                  deductEntryFee(arena.entryFee)
                  findMatch()
                }
              }} 
              style={{
                ...styles.findMatchBtn,
                ...(!canAfford(ARENAS.find(a => a.id === selectedArena)?.entryFee || 0) ? { opacity: 0.6 } : {}),
              }}
              className="findMatchBtn"
            >
              ⚔️ Find Match
            </button>
          </div>
        )}

        {gameState === 'waiting' && (
          <div style={styles.card} className="card">
            <div style={styles.cardGlowBorder} />
            <div style={styles.searching}><div style={styles.searchingSpinner} /><p>Finding opponent...</p></div>
            <p style={styles.waitingText}>Matching you with a worthy opponent</p>
          </div>
        )}

        {gameState === 'matched' && match && (
          <div style={styles.card} className="card">
            <div style={styles.cardGlowBorder} />
            <div style={styles.matchFound}><span style={styles.matchIcon}>🎯</span><h2>MATCH FOUND!</h2></div>
            <div style={styles.matchInfo}>
              <div style={styles.playerRow}><span>👤 You</span><span>{match.scores[0]} - {match.scores[1]}</span><span>👤 {match.players[1].displayName}</span></div>
              <div style={styles.matchDetails}><div>Round {Math.min(match.currentRound, match.maxRounds)} / {match.maxRounds}</div></div>
            </div>
            <p style={styles.countdownText}>Get ready...</p>
          </div>
        )}

        {gameState === 'countdown' && (
          <div style={styles.countdownOverlay}><div style={styles.countdownNumber} className="countdownNumber">{countdown}</div><p>Prepare to click!</p></div>
        )}

        {(gameState === 'ready' || gameState === 'success' || gameState === 'opponent_early') && match && (
          <div style={{
            ...styles.gameArea,
            ...(screenShake ? { animation: 'shake 0.3s ease-in-out' } : {}),
          }} className="screen-shake">
            <div style={styles.scoreBar} className="scoreBar">
              <span style={styles.playerScore} className="playerScore">You: {match.scores[0]}</span>
              <span style={styles.roundInfo} className="roundInfo">Round {Math.min(match.currentRound, match.maxRounds)}</span>
              <span style={styles.opponentScore} className="opponentScore">Opponent: {match.scores[1]}</span>
            </div>
            
            {/* REMOVED: Spawn Flash and Shockwave effects - no burst before button appears */}
            
            {gameState === 'ready' && circleScale > 0 && (
              <>
                {/* Main energy core button */}
                <button
                  onClick={(e) => handleClick(e)} 
                  style={{
                    ...getDynamicCircleStyle(circleSize),
                    left: circlePosition.x + '%', 
                    top: circlePosition.y + '%',
                    transform: `translate(-50%, -50%) scale(${circleScale})`,
                  }} 
                  className="circleButton"
                >
                  <span style={{
                    ...styles.circleText, 
                    transform: clickEffect ? 'scale(1.15)' : 'scale(1)',
                    color: clickEffect ? '#fff' : '#000',
                  }} 
                  className="circleText"
                  >
                    CLICK!
                  </span>
                  {/* Energy collapse effect */}
                  {energyCollapse && (
                    <div style={{
                      ...styles.energyCollapse,
                      background: `radial-gradient(circle, ${colorValues.primary}80 0%, transparent 70%)`,
                    }} />
                  )}
                </button>
              </>
            )}
            
            {/* Click particles */}
            <div style={styles.clickParticlesContainer}>
              {clickParticles.map((particle) => (
                <div
                  key={particle.id}
                  style={{
                    ...styles.clickParticle,
                    left: particle.x,
                    top: particle.y,
                    width: particle.size,
                    height: particle.size,
                    background: particle.color,
                    transform: `translate(${particle.vx * (1 - particle.life)}px, ${particle.vy * (1 - particle.life)}px)`,
                    opacity: particle.life,
                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                  }}
                />
              ))}
            </div>
            
            {gameState === 'success' && roundResult && (
              <div style={styles.resultCard} className="resultCard">
                {roundResult.winner === 0 ? (
                  <><div style={styles.winEmoji}>🎉</div><h2 style={styles.winText} className="winText">YOU WON THIS ROUND!</h2><p style={styles.timeText} className="timeText">{reactionTime}ms</p><p style={styles.opponentInfo}>Opponent: {Math.round(roundResult.opponentTime || 0)}ms</p></>
                ) : (
                  <><div style={styles.loseEmoji}>😢</div><h2 style={styles.loseText} className="loseText">ROUND LOST</h2><p style={styles.timeText} className="timeText">{reactionTime}ms</p><p style={styles.opponentInfo}>Opponent: {Math.round(roundResult.opponentTime || 0)}ms</p></>
                )}
              </div>
            )}
            
            {gameState === 'opponent_early' && (
              <div style={styles.resultCard} className="resultCard"><div style={styles.loseEmoji}>⚠️</div><h2 style={styles.loseText} className="loseText">TOO EARLY!</h2><p style={styles.opponentInfo}>Point to opponent</p></div>
            )}
          </div>
        )}

        {gameState === 'game_over' && match && !showResultScreen && (
          <div style={styles.card} className="card">
            <div style={styles.cardGlowBorder} />
            <div style={styles.gameOverIcon} className="gameOverIcon">{match.scores[0] > match.scores[1] ? '🏆' : match.scores[0] < match.scores[1] ? '😞' : '🤝'}</div>
            <h2 style={styles.gameOverTitle} className="gameOverTitle">{getMatchWinner()}</h2>
            <div style={styles.finalScore} className="finalScore"><span>You: {match.scores[0]}</span><span>-</span><span>Opponent: {match.scores[1]}</span></div>
            <div style={styles.resultInfo}>
              {match.scores[0] > match.scores[1] ? <><div style={styles.resultLabel}>VICTORY!</div><div style={styles.resultAmount} className="resultAmount">⭐ {Math.min(match.scores[0], 5)} / 5</div></> : match.scores[0] === match.scores[1] ? <div style={styles.resultLabel}>DRAW - PLAY AGAIN</div> : <div style={styles.resultLabel}>BETTER LUCK NEXT TIME</div>}
            </div>
            <button onClick={quitMatch} style={styles.playAgainBtn}>Back to Lobby</button>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <span>© 2026 Reflex Wars</span>
        <span style={{ marginLeft: '12px' }}>Support: reflexwars.game@gmail.com</span>
      </div>

      {/* Result Screen */}
      {showResultScreen && (
        <div style={styles.resultScreenOverlay}>
          <div style={styles.resultScreenCard}>
            {/* Glowing border */}
            <div style={styles.resultScreenGlowBorder} />
            
            {isNewRecord && <div style={styles.newRecordBadge}>NEW RECORD!</div>}
            
            {/* NEW WAR RECORD Banner */}
            {showNewRecordText && (
              <div style={styles.newRecordBanner}>
                <div style={styles.newRecordText} className="new-record-text">
                  ⚔️ NEW WAR RECORD! ⚔️
                </div>
              </div>
            )}
            
            <div style={styles.resultScreenTitle}>MATCH COMPLETE</div>
            
            {/* Warrior Name Display - Bold and highlighted */}
            {warriorName && (
              <div style={{
                ...styles.warriorNameDisplay,
                fontSize: '20px',
                fontWeight: '900',
                color: '#fff',
                background: 'linear-gradient(135deg, #9945ff, #14f195)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                marginBottom: '16px',
                letterSpacing: '2px',
              }}>
                ⚔️ {warriorName.toUpperCase()} ⚔️
              </div>
            )}
            
            {/* Main reaction time with animated counting */}
            <div style={styles.resultScreenMainTime}>
              {displayedTime}
              <span style={styles.resultScreenMs}>ms</span>
            </div>
            
            {/* Stats row - 4 stats: Personal Best, Average, Current Streak, Best Streak */}
            <div style={styles.resultScreenStats}>
              <div style={styles.resultScreenStat}>
                <div style={styles.resultScreenStatLabel}>Personal Best</div>
                <div style={{...styles.resultScreenStatValue, ...styles.personalBestValue}}>
                  {battleStats.personalBest || '--'}ms
                </div>
              </div>
              <div style={styles.resultScreenStat}>
                <div style={styles.resultScreenStatLabel}>Avg Time</div>
                <div style={{...styles.resultScreenStatValue, color: '#fff'}}>
                  {matchReactionTimes.length > 0 
                    ? Math.round(matchReactionTimes.reduce((a, b) => a + b, 0) / matchReactionTimes.length)
                    : reactionTime || 0}ms
                </div>
              </div>
              <div style={styles.resultScreenStat}>
                <div style={styles.resultScreenStatLabel}>Current Streak</div>
                <div style={{...styles.resultScreenStatValue, ...styles.streakValue}}>
                  🔥 {battleStats.currentWinStreak}
                </div>
              </div>
              <div style={styles.resultScreenStat}>
                <div style={styles.resultScreenStatLabel}>Best Streak</div>
                <div style={{...styles.resultScreenStatValue, ...styles.bestStreakValue}}>
                  ⭐ {battleStats.bestStreak}
                </div>
              </div>
            </div>
            
            {/* Buttons */}
            <div style={styles.resultScreenButtons}>
              <button 
                style={styles.fightAgainBtn}
                onClick={handleFightAgain}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 40px rgba(0, 255, 136, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 255, 136, 0.4)'
                }}
              >
                ⚔️ Fight Again
              </button>
              
<button 
                style={styles.shareBtn}
                onClick={handleShareVictory}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 40px rgba(153, 69, 255, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(153, 69, 255, 0.4)'
                }}
              >
                📤 Share My Victory
              </button>
              
              <button 
                style={styles.challengeBtn}
                onClick={handleChallengeFriend}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 40px rgba(255, 107, 107, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(255, 107, 107, 0.4)'
                }}
              >
                🎯 Challenge a Friend
              </button>
              
              <button 
                style={styles.leaderboardBtn}
                onClick={handleLeaderboard}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
              >
                🏆 Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div style={styles.toastContainer} className="toast-enter">
          <div style={styles.toastMessage}>
            ✓ {toast.message}
          </div>
        </div>
      )}

      {/* Coin Change Animation Popup */}
      {coinChangeAnimation && (
        <div style={{
          ...styles.coinChangePopup,
          ...(coinChangeAnimation.type === 'win' ? styles.coinChangeWin : 
              coinChangeAnimation.type === 'loss' ? styles.coinChangeLoss : 
              styles.coinChangeClaim),
        }}>
          {coinChangeAnimation.type === 'win' ? '⬆️' : coinChangeAnimation.type === 'loss' ? '⬇️' : '🎁'}
          {coinChangeAnimation.type === 'win' ? '+' : coinChangeAnimation.type === 'loss' ? '-' : '+'}
          {coinChangeAnimation.amount.toLocaleString()} RW Coins
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoginModal(false)
          }}
        >
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>Welcome!</h2>
            <p style={styles.modalSubtitle}>Sign in to save your progress</p>
            
            {/* Google Login Button */}
            <button 
              style={styles.googleBtn}
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <div style={styles.loadingSpinner} />
              ) : (
                <>
                  <svg style={styles.googleIcon} viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            
            <p style={styles.orText}>or enter email manually</p>
            
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGoogleLogin()
              }}
              style={styles.inputField}
              maxLength={50}
            />
            
            <button 
              style={styles.modalLoginBtn}
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Continue'}
            </button>
            
            <button 
              style={styles.cancelBtn}
              onClick={() => setShowLoginModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Warrior Name Modal - Show when user needs to set their warrior name */}
      {showUsernameModal && (
        <div 
          style={styles.modalOverlay}
          onClick={(e) => {
            // Don't close on overlay click - require username
          }}
        >
          <div style={styles.modalContent}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚔️</div>
            <h2 style={styles.modalTitle}>Choose Your Warrior Name</h2>
            <p style={styles.modalSubtitle}>This name will be displayed on the leaderboard</p>
            
            <form onSubmit={handleUsernameSubmit}>
              <input
                name="warriorName"
                type="text"
                placeholder="Enter warrior name"
                autoFocus
                style={{
                  ...styles.inputField,
                  borderColor: usernameError ? '#ff6b6b' : 'rgba(255,255,255,0.2)',
                }}
                maxLength={12}
                minLength={3}
              />
              
              {usernameError && (
                <div style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '-16px', marginBottom: '16px', textAlign: 'left' }}>
                  {usernameError}
                </div>
              )}
              
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '20px', textAlign: 'left' }}>
                3-12 characters • No empty names
              </div>
              
              <button 
                type="submit"
                style={styles.modalLoginBtn}
              >
                Start Battle ⚔️
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Armory Panel */}
      {showArmory && (
        <ArmoryPanel 
          customizations={customizations}
          onCustomizationChange={handleCustomizationChange}
          totalGamesPlayed={totalGamesPlayed}
          onClose={() => setShowArmory(false)}
        />
      )}

      {/* Arena Selection Panel */}
      {showArenaSelect && (
        <div style={styles.arenaOverlay} onClick={() => setShowArenaSelect(false)}>
          <div style={styles.arenaContainer} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={styles.arenaHeader}>
              <button 
                style={styles.arenaCloseBtn}
                onClick={() => setShowArenaSelect(false)}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                ✕
              </button>
              <h2 style={styles.arenaTitle}>🏆 ARENA SELECT 🏆</h2>
              <p style={styles.arenaSubtitle}>Choose your battleground</p>
            </div>

            {/* Current Balance */}
            <div style={{ textAlign: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={styles.coinDisplay}>
                <span style={styles.coinIcon}>🪙</span>
                <span style={styles.coinAmount}>{coinBalance.toLocaleString()} RW Coins</span>
              </div>
            </div>

            {/* Content */}
            <div style={styles.arenaContent}>
              <div style={styles.arenaList}>
                {ARENAS.map((arena) => {
                  const canAffordArena = coinBalance >= arena.entryFee
                  const isSelected = selectedArena === arena.id
                  const potentialReward = calculatePotentialReward(arena.entryFee)
                  
                  return (
                    <div
                      key={arena.id}
                      style={{
                        ...styles.arenaCard,
                        ...(isSelected ? styles.arenaCardSelected : {}),
                        ...(!canAffordArena ? styles.arenaCardLocked : {}),
                      }}
                      onClick={() => {
                        if (canAffordArena) {
                          setSelectedArena(arena.id)
                        }
                      }}
                    >
                      <span style={styles.arenaIcon}>{arena.icon}</span>
                      <div style={styles.arenaInfo}>
                        <div style={{...styles.arenaName, color: arena.color}}>{arena.name}</div>
                        <div style={styles.arenaDescription}>{arena.description}</div>
                      </div>
                      <div style={{
                        ...styles.arenaRiskBadge,
                        background: arena.riskLevel === 'low' ? 'rgba(0, 255, 136, 0.2)' :
                                   arena.riskLevel === 'medium' ? 'rgba(255, 215, 0, 0.2)' :
                                   arena.riskLevel === 'high' ? 'rgba(255, 107, 107, 0.2)' :
                                   'rgba(153, 69, 255, 0.2)',
                        color: arena.riskLevel === 'low' ? '#00ff88' :
                               arena.riskLevel === 'medium' ? '#ffd700' :
                               arena.riskLevel === 'high' ? '#ff6b6b' :
                               '#9945ff',
                      }}>
                        {arena.riskLevel}
                      </div>
                      <div style={styles.arenaFeeContainer}>
                        <div style={styles.arenaFeeLabel}>Entry Fee</div>
                        <div style={{
                          ...styles.arenaFee,
                          color: canAffordArena ? '#ffd700' : '#ff6b6b',
                        }}>
                          <span>🪙</span>
                          {arena.entryFee.toLocaleString()}
                        </div>
                        {arena.entryFee > 0 && (
                          <div style={styles.arenaRewardContainer}>
                            <div style={styles.arenaRewardLabel}>Win Reward</div>
                            <div style={styles.arenaReward}>
                              🪙 {potentialReward.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Select Button */}
              <button 
                style={{
                  ...styles.arenaSelectBtn,
                  ...(coinBalance < ARENAS.find(a => a.id === selectedArena)?.entryFee! ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                }}
                onClick={() => {
                  const arena = ARENAS.find(a => a.id === selectedArena)
                  if (arena && canAfford(arena.entryFee)) {
                    setShowArenaSelect(false)
                    // Update difficulty based on arena
                    setDifficulty(arena.difficulty)
                    // Proceed to find match
                    if (!warriorName) {
                      setShowUsernameModal(true)
                    } else {
                      findMatch()
                    }
                  }
                }}
                onMouseOver={(e) => {
                  if (canAfford(ARENAS.find(a => a.id === selectedArena)?.entryFee || 0)) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 6px 40px rgba(255, 215, 0, 0.6)'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(255, 215, 0, 0.5)'
                }}
                disabled={!canAfford(ARENAS.find(a => a.id === selectedArena)?.entryFee || 0)}
              >
                ⚔️ Enter Arena
              </button>
              
              {/* Not enough coins message */}
              {coinBalance < ARENAS.find(a => a.id === selectedArena)?.entryFee! && (
                <div style={styles.notEnoughCoins}>
                  ⚠️ Not enough RW Coins. Select a different arena or claim daily supply!
                </div>
              )}
              
              {/* Low Balance - Daily Claim */}
              {coinBalance === 0 && canClaimDaily && (
                <button 
                  style={{
                    ...styles.dailyClaimBtn,
                    width: '100%',
                    marginTop: '12px',
                  }}
                  onClick={() => {
                    if (claimDailySupply()) {
                      showToast('🎁 Claimed 1,000 RW Coins!')
                    }
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  🎁 Claim Daily Supply (1,000 RW Coins)
                </button>
              )}
              
              {/* Cooldown message */}
              {coinBalance === 0 && !canClaimDaily && (
                <div style={{
                  ...styles.notEnoughCoins,
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderColor: 'rgba(255, 215, 0, 0.3)',
                  color: '#ffd700',
                }}>
                  ⏰ Daily claim available in 24 hours
                </div>
              )}
            </div>
          </div>
        </div>
      )}

{/* Challenge Link Modal */}
      {showChallengeModal && (
        <div style={styles.challengeModalOverlay}>
          <div style={styles.challengeModalCard}>
            <div style={styles.challengeModalIcon}>🎯</div>
            <h2 style={styles.challengeModalTitle}>Challenge a Friend!</h2>
            <p style={styles.challengeModalText}>
              {showResultScreen 
                ? "Send your score to a friend and see if they can beat your reaction time!"
                : "Play a match first, then challenge your friends to beat your score!"}
            </p>
            {showResultScreen && (
              <>
                <div style={styles.challengeLinkBox}>
                  {typeof window !== 'undefined' && (
                    `${window.location.origin}/?user=${encodeURIComponent(warriorName || 'Warrior')}&score=${matchReactionTimes.length > 0 ? Math.round(matchReactionTimes.reduce((a, b) => a + b, 0) / matchReactionTimes.length) : reactionTime || 0}`
                  )}
                </div>
                <div style={styles.challengeModalButtons}>
                  <button 
                    style={styles.generateLinkBtn}
                    onClick={generateChallengeLink}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 6px 35px rgba(255, 107, 107, 0.6)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 25px rgba(255, 107, 107, 0.5)'
                    }}
                  >
                    📋 Copy Challenge Link
                  </button>
                  <button 
                    style={styles.cancelBtn}
                    onClick={() => setShowChallengeModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {!showResultScreen && (
              <button 
                style={styles.fightAgainBtn}
                onClick={() => {
                  setShowChallengeModal(false)
                  setGameState('connected')
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 40px rgba(0, 255, 136, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 255, 136, 0.4)'
                }}
              >
                ⚔️ Play Match First
              </button>
            )}
          </div>
        </div>
      )}

      {/* Challenge Waiting Screen - shown when friend opens challenge link */}
      {gameState === 'challenge_waiting' && challengeData && (
        <div style={styles.challengeWaitingOverlay}>
          <div style={styles.challengeWaitingCard}>
            <div style={styles.challengeModalIcon}>⚔️</div>
            <h2 style={styles.challengeModalTitle}>DUEL CHALLENGE!</h2>
            
            <div style={styles.challengeChallengerInfo}>
              <div style={styles.challengerName}>{challengeData.challengerName}</div>
              <div style={styles.challengerScore}>{challengeData.challengerScore}<span style={{fontSize: '20px'}}>ms</span></div>
              <div style={styles.challengerScoreLabel}>SCORE TO BEAT</div>
            </div>
            
            <p style={styles.challengeSubtitle}>
              Can you defeat this warrior? Play now and prove your reflexes are faster!
            </p>
            
            <button 
              style={styles.acceptChallengeBtn}
              className="challenge-pulse"
              onClick={handleAcceptChallenge}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 40px rgba(255, 107, 107, 0.7)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 30px rgba(255, 107, 107, 0.6)'
              }}
            >
              ⚔️ Accept Challenge
            </button>
            
            <button 
              style={styles.declineChallengeBtn}
              onClick={handleBackFromChallenge}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Challenge Game Area */}
      {gameState === 'challenge_accepted' && challengeData && (
        <ChallengeGameArea
          challengeData={challengeData}
          customizations={customizations}
          glowHue={glowHue}
          onComplete={handleChallengeComplete}
          onCancel={handleBackFromChallenge}
          colorValues={colorValues}
        />
      )}

      {/* Duel Result Screen */}
      {gameState === 'duel_result' && challengeData && challengeResult && (
        <div style={styles.duelResultOverlay}>
          <div style={styles.duelResultCard}>
            <div style={styles.duelResultTitle}>
              {challengeResult === 'win' ? (
                <span style={styles.victoryTitle}>VICTORY ⚔️</span>
              ) : (
                <span style={styles.defeatTitle}>DEFEATED 💀</span>
              )}
            </div>
            
            {/* Split Screen Duel Display */}
            <div style={styles.duelSplitScreen}>
              {/* Challenger Card */}
              <div style={{
                ...styles.duelPlayerCard,
                ...(challengeResult === 'lose' ? styles.duelPlayerCardWin : styles.duelPlayerCardLose),
              }}>
                <div style={{...styles.duelPlayerName, ...styles.duelChallengerName}}>
                  {challengeData.challengerName}
                </div>
                <div style={{...styles.duelPlayerTime, ...styles.duelChallengerTime}}>
                  {challengeData.challengerScore}ms
                </div>
              </div>
              
              {/* VS Badge */}
              <div style={styles.duelVsBadge} className="vs-glow">
                VS
              </div>
              
              {/* Player Card */}
              <div style={{
                ...styles.duelPlayerCard,
                ...(challengeResult === 'win' ? styles.duelPlayerCardWin : styles.duelPlayerCardLose),
              }}>
                <div style={styles.duelPlayerName}>
                  You
                </div>
                <div style={{
                  ...styles.duelPlayerTime,
                  ...(challengeResult === 'win' ? styles.duelPlayerTime2 : styles.duelChallengerTime)
                }}>
                  {displayedTime || reactionTime}ms
                </div>
              </div>
            </div>
            
            <p style={{
              ...styles.challengeSubtitle,
              marginBottom: '28px',
            }}>
              {challengeResult === 'win' 
                ? `You defeated ${challengeData.challengerName}!` 
                : `${challengeData.challengerName} was faster!`}
            </p>
            
            {/* Result Buttons */}
            <div style={styles.duelResultButtons}>
              <button 
                style={styles.rematchBtn}
                onClick={handleChallengeRematch}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 40px rgba(0, 255, 136, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 255, 136, 0.5)'
                }}
              >
                🔄 Rematch
              </button>
              
              <button 
                style={styles.sendBackChallengeBtn}
                onClick={handleSendBackChallenge}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 35px rgba(153, 69, 255, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 25px rgba(153, 69, 255, 0.5)'
                }}
              >
                🎯 Send Back Challenge
              </button>
              
              <button 
                style={styles.backToMenuBtn}
                onClick={handleChallengeRematch}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Support Modal */}
      {showSupportModal && (
        <div 
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSupportModal(false)
          }}
        >
          <div style={{
            ...styles.modalContent,
            maxWidth: '420px',
          }}>
            {/* Close button */}
            <button 
              onClick={() => {
                setShowSupportModal(false)
                setSupportSent(false)
                setSupportForm({ username: '', email: '', message: '' })
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              ✕
            </button>

            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎧</div>
            <h2 style={styles.modalTitle}>Support & Contact</h2>
            
            {!supportSent ? (
              <>
                <p style={{ 
                  ...styles.modalSubtitle, 
                  marginBottom: '24px',
                  lineHeight: 1.5,
                }}>
                  If you experience bugs, coin issues, leaderboard errors, or have feedback, contact us below.
                </p>
                
                {/* Email Display with Copy Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: '1px solid rgba(153, 69, 255, 0.2)',
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                    reflexwars.game@gmail.com
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('reflexwars.game@gmail.com')
                      setEmailCopied(true)
                      setTimeout(() => setEmailCopied(false), 2000)
                    }}
                    style={{
                      background: emailCopied ? 'rgba(0, 255, 136, 0.2)' : 'rgba(153, 69, 255, 0.3)',
                      border: 'none',
                      color: emailCopied ? '#00ff88' : '#fff',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: '"Rajdhani", sans-serif',
                    }}
                  >
                    {emailCopied ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                
                {/* Contact Form */}
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (!supportForm.message.trim()) {
                    showToast('Please enter a message')
                    return
                  }
                  // Simulate form submission
                  setSupportSent(true)
                  showToast('Support request sent successfully!')
                }}>
                  <input
                    type="text"
                    placeholder="Username (auto-filled)"
                    value={supportForm.username || warriorName || username}
                    onChange={(e) => setSupportForm({ ...supportForm, username: e.target.value })}
                    style={styles.inputField}
                  />
                  
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                    style={styles.inputField}
                  />
                  
                  <textarea
                    placeholder="Message (required) *"
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                    style={{
                      ...styles.inputField,
                      minHeight: '100px',
                      resize: 'vertical',
                      fontFamily: '"Rajdhani", sans-serif',
                    }}
                    required
                  />
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button 
                      type="submit"
                      style={{
                        ...styles.modalLoginBtn,
                        flex: 1,
                      }}
                    >
                      📤 Send
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowSupportModal(false)
                        setSupportSent(false)
                        setSupportForm({ username: '', email: '', message: '' })
                      }}
                      style={{
                        ...styles.cancelBtn,
                        marginTop: 0,
                        padding: '14px 24px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '25px',
                        background: 'transparent',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* Success State */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ 
                  color: '#00ff88', 
                  fontSize: '22px', 
                  fontWeight: '800',
                  marginBottom: '12px',
                  fontFamily: '"Orbitron", sans-serif',
                }}>
                  Support Request Sent!
                </h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.6)', 
                  fontSize: '14px',
                  marginBottom: '24px',
                  fontFamily: '"Rajdhani", sans-serif',
                }}>
                  We'll get back to you as soon as possible.
                </p>
                <button 
                  onClick={() => {
                    setShowSupportModal(false)
                    setSupportSent(false)
                    setSupportForm({ username: '', email: '', message: '' })
                  }}
                  style={styles.playAgainBtn}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

