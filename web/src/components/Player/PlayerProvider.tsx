import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type QueueTrack = {
  submissionId: string
  platform: string
  platformTrackId: string
  trackUrl: string
  trackName: string
  artistName: string
  artworkUrl?: string | null
}

type PlayerContextValue = {
  queue: QueueTrack[]
  currentIndex: number | null
  currentTrack: QueueTrack | null
  isPlaying: boolean
  /** Start the given queue from the top. */
  playAll: (tracks: QueueTrack[]) => void
  /** Play one track of the given queue (queue is replaced). */
  playTrack: (tracks: QueueTrack[], submissionId: string) => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  stop: () => void
  /** Called by the active platform controller when its track finishes. */
  handleEnded: () => void
  /** Lets controllers sync embed-initiated play/pause back to the dock UI. */
  reportPlaying: (playing: boolean) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const usePlayer = () => {
  const ctx = useContext(PlayerContext)
  if (!ctx) {
    throw new Error('usePlayer must be used inside a PlayerProvider')
  }
  return ctx
}

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [queue, setQueue] = useState<QueueTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const playAll = useCallback((tracks: QueueTrack[]) => {
    if (tracks.length === 0) return
    setQueue(tracks)
    setCurrentIndex(0)
    setIsPlaying(true)
  }, [])

  const playTrack = useCallback(
    (tracks: QueueTrack[], submissionId: string) => {
      const index = tracks.findIndex((t) => t.submissionId === submissionId)
      if (index === -1) return
      setQueue(tracks)
      setCurrentIndex(index)
      setIsPlaying(true)
    },
    []
  )

  const togglePlay = useCallback(() => setIsPlaying((p) => !p), [])

  const next = useCallback(() => {
    setCurrentIndex((i) => {
      if (i === null) return null
      if (i + 1 >= queue.length) {
        setIsPlaying(false)
        return i
      }
      setIsPlaying(true)
      return i + 1
    })
  }, [queue.length])

  const prev = useCallback(() => {
    setCurrentIndex((i) => {
      if (i === null) return null
      setIsPlaying(true)
      return Math.max(0, i - 1)
    })
  }, [])

  const stop = useCallback(() => {
    setCurrentIndex(null)
    setIsPlaying(false)
  }, [])

  const handleEnded = useCallback(() => {
    setCurrentIndex((i) => {
      if (i === null) return null
      if (i + 1 >= queue.length) {
        setIsPlaying(false)
        return i
      }
      return i + 1
    })
  }, [queue.length])

  const reportPlaying = useCallback(
    (playing: boolean) => setIsPlaying(playing),
    []
  )

  const value = useMemo(
    () => ({
      queue,
      currentIndex,
      currentTrack:
        currentIndex === null ? null : (queue[currentIndex] ?? null),
      isPlaying,
      playAll,
      playTrack,
      togglePlay,
      next,
      prev,
      stop,
      handleEnded,
      reportPlaying,
    }),
    [
      queue,
      currentIndex,
      isPlaying,
      playAll,
      playTrack,
      togglePlay,
      next,
      prev,
      stop,
      handleEnded,
      reportPlaying,
    ]
  )

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  )
}
