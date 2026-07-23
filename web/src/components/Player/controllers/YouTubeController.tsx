import { useEffect, useRef } from 'react'

/**
 * YouTube IFrame API wrapper. Auto-advance is reliable here:
 * onStateChange fires ENDED (0) when the video finishes.
 */

type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
}

type YTNamespace = {
  Player: new (
    el: HTMLElement,
    options: {
      videoId: string
      width: string
      height: string
      playerVars: Record<string, number>
      events: {
        onReady: () => void
        onStateChange: (event: { data: number }) => void
      }
    }
  ) => YTPlayer
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null

const loadYouTubeApi = (): Promise<YTNamespace> => {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    })
  }
  return ytApiPromise
}

type ControllerProps = {
  videoId: string
  isPlaying: boolean
  onEnded: () => void
  onPlayingChange: (playing: boolean) => void
}

const YouTubeController = ({
  videoId,
  isPlaying,
  onEnded,
  onPlayingChange,
}: ControllerProps) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const readyRef = useRef(false)
  // Keep the latest callbacks without re-creating the player.
  const callbacksRef = useRef({ onEnded, onPlayingChange })
  callbacksRef.current = { onEnded, onPlayingChange }

  useEffect(() => {
    let cancelled = false
    readyRef.current = false

    // The API replaces the mount node, so give it a disposable child.
    const host = mountRef.current
    const child = document.createElement('div')
    host?.appendChild(child)

    loadYouTubeApi().then((YT) => {
      if (cancelled) return
      playerRef.current = new YT.Player(child, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            readyRef.current = true
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              callbacksRef.current.onEnded()
            } else if (event.data === YT.PlayerState.PLAYING) {
              callbacksRef.current.onPlayingChange(true)
            } else if (event.data === YT.PlayerState.PAUSED) {
              callbacksRef.current.onPlayingChange(false)
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy()
      } catch {
        // a player mid-initialisation can throw on destroy — ignore
      }
      playerRef.current = null
      if (host?.contains(child)) {
        host.removeChild(child)
      }
    }
  }, [videoId])

  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return
    if (isPlaying) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }, [isPlaying])

  return <div ref={mountRef} className="h-full w-full overflow-hidden" />
}

export default YouTubeController
