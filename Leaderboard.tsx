'use client'

import { useState, useEffect } from 'react'

// Leaderboard entry type
interface LeaderboardEntry {
  rank: number
  username: string
  reactionTime: number
}

// Seed data - reaction times sorted from lowest (best) to highest
const SEED_TIMES = [178, 201, 223, 240, 259]

// Generate random usernames for seeded data
const generateUsername = (index: number): string => {
  const prefixes = ['Speedy', 'Rapid', 'Swift', 'Nimble', 'Flash', 'Bolt', 'Quick', 'Fast', 'Lightning', 'Turbo']
  const suffixes = ['King', 'Master', 'Pro', 'Gamer', 'Wolf', 'Eagle', 'Hawk', 'Tiger', 'Dragon', 'Phoenix']
  return `${prefixes[index % prefixes.length]}${suffixes[index % suffixes.length]}${Math.floor(Math.random() * 99) + 1}`
}

// Generate seeded leaderboard data
const generateSeedData = (): LeaderboardEntry[] => {
  return SEED_TIMES.map((time, index) => ({
    rank: index + 1,
    username: generateUsername(index),
    reactionTime: time
  }))
}

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
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
    backdropFilter: 'blur(10px)',
  },
  container: {
    background: 'linear-gradient(145deg, rgba(20, 20, 45, 0.98), rgba(10, 10, 30, 0.98))',
    borderRadius: '24px',
    maxWidth: '480px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 0 60px rgba(153, 69, 255, 0.2), 0 25px 80px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '24px 20px 16px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  title: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#fff',
    margin: 0,
    letterSpacing: '2px',
    textShadow: '0 0 30px rgba(153, 69, 255, 0.5)',
  },
  subtitle: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '6px',
    letterSpacing: '1px',
  },
  closeBtn: {
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
  tabs: {
    display: 'flex',
    padding: '12px 16px',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  tab: {
    flex: 1,
    padding: '12px 8px',
    borderRadius: '12px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
    letterSpacing: '0.5px',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(153, 69, 255, 0.4)',
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
  },
  entry: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    marginBottom: '10px',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
  },
  entryTop3: {
    background: 'linear-gradient(135deg, rgba(153, 69, 255, 0.15), rgba(20, 241, 149, 0.1))',
    border: '1px solid rgba(153, 69, 255, 0.3)',
    boxShadow: '0 4px 20px rgba(153, 69, 255, 0.15)',
  },
  rank: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '800',
    marginRight: '14px',
    flexShrink: 0,
  },
  rankGold: {
    background: 'linear-gradient(135deg, #ffd700, #ff9500)',
    color: '#000',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
  },
  rankSilver: {
    background: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)',
    color: '#000',
    boxShadow: '0 0 20px rgba(192, 192, 192, 0.5)',
  },
  rankBronze: {
    background: 'linear-gradient(135deg, #cd7f32, #a0522d)',
    color: '#fff',
    boxShadow: '0 0 20px rgba(205, 127, 50, 0.5)',
  },
  rankDefault: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userLabel: {
    fontSize: '10px',
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: '2px',
  },
  time: {
    textAlign: 'right',
    flexShrink: 0,
  },
  timeValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#00ff88',
    textShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
  },
  timeUnit: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: '2px',
  },
  trophyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  categoryIcon: {
    fontSize: '20px',
    marginBottom: '4px',
    display: 'block',
  },
}

type Category = 'daily' | 'weekly' | 'alltime'

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<Category>('daily')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Load seed data on mount
  useEffect(() => {
    const data = generateSeedData()
    setEntries(data)
  }, [])

  // Handle category change with animation
  const handleCategoryChange = (category: Category) => {
    if (category === activeCategory) return
    
    setIsAnimating(true)
    setTimeout(() => {
      setActiveCategory(category)
      // Regenerate data with slight variations per category
      const data = generateSeedData().map((entry, index) => ({
        ...entry,
        rank: index + 1,
        // Add some variation per category
        reactionTime: category === 'daily' 
          ? entry.reactionTime 
          : category === 'weekly'
            ? entry.reactionTime + Math.floor(Math.random() * 30) - 15
            : entry.reactionTime + Math.floor(Math.random() * 50) - 25
      }))
      setEntries(data)
      setIsAnimating(false)
    }, 150)
  }

  const getRankStyle = (rank: number): React.CSSProperties => {
    switch (rank) {
      case 1: return { ...styles.rank, ...styles.rankGold }
      case 2: return { ...styles.rank, ...styles.rankSilver }
      case 3: return { ...styles.rank, ...styles.rankBronze }
      default: return { ...styles.rank, ...styles.rankDefault }
    }
  }

  const getCategoryIcon = (): string => {
    switch (activeCategory) {
      case 'daily': return '⚡'
      case 'weekly': return '📅'
      case 'alltime': return '👑'
    }
  }

  const getCategoryTitle = (): string => {
    switch (activeCategory) {
      case 'daily': return 'DAILY CHAMPIONS'
      case 'weekly': return 'WEEKLY WARRIORS'
      case 'alltime': return 'ALL-TIME LEGENDS'
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <button 
            style={styles.closeBtn}
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ✕
          </button>
          <div style={styles.trophyIcon}>🏆</div>
          <h2 style={styles.title}>LEADERBOARD</h2>
          <p style={styles.subtitle}>Top reflexes worldwide</p>
        </div>

        {/* Category Tabs */}
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeCategory === 'daily' ? styles.tabActive : {})
            }}
            onClick={() => handleCategoryChange('daily')}
          >
            <span style={styles.categoryIcon}>⚡</span>
            Daily
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeCategory === 'weekly' ? styles.tabActive : {})
            }}
            onClick={() => handleCategoryChange('weekly')}
          >
            <span style={styles.categoryIcon}>📅</span>
            Weekly
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeCategory === 'alltime' ? styles.tabActive : {})
            }}
            onClick={() => handleCategoryChange('alltime')}
          >
            <span style={styles.categoryIcon}>👑</span>
            All-Time
          </button>
        </div>

        {/* Leaderboard List */}
        <div style={{
          ...styles.listContainer,
          opacity: isAnimating ? 0 : 1,
          transition: 'opacity 0.15s ease',
        }}>
          {entries.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎮</div>
              <p>No entries yet. Be the first!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.rank}
                style={{
                  ...styles.entry,
                  ...(entry.rank <= 3 ? styles.entryTop3 : {}),
                  animation: `slideIn 0.3s ease ${entry.rank * 0.05}s both`,
                }}
              >
                <div style={getRankStyle(entry.rank)}>
                  {entry.rank <= 3 ? (
                    entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'
                  ) : (
                    `#${entry.rank}`
                  )}
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.username}>{entry.username}</div>
                  <div style={styles.userLabel}>
                    {activeCategory === 'daily' && 'Today'}
                    {activeCategory === 'weekly' && 'This week'}
                    {activeCategory === 'alltime' && 'All time'}
                  </div>
                </div>
                <div style={styles.time}>
                  <span style={styles.timeValue}>{entry.reactionTime}</span>
                  <span style={styles.timeUnit}>ms</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inline Styles for Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @media (max-width: 480px) {
          .leaderboard-container {
            border-radius: 20px 20px 0 0 !important;
            max-height: 90vh !important;
          }
        }
      `}</style>
    </div>
  )
}

