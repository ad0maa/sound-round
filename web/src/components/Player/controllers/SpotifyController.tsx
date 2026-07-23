import { useEffect, useRef } from 'react'

/**
 * Spotify iFrame Embed API wrapper. Weakest of the three:
 * - logged-out listeners get ~30s previews
 * - there is no explicit "ended" event; we infer it from playback_update
 *   position ≈ duration, so auto-advance is best-effort (the dock's Next
 *   button is the guaranteed path)
 */

type SpotifyEmbedController = {
  play: () => void
  pause: () => void
  togglePlay: () => void
  destroy: () => void
  addListener: (
    event: string,
    listener: (e: {
      data: { position: number; duration: number; isPaused: boolean }
    }) => void
  ) => void
}

type SpotifyIFrameAPI = {
  createController: (
    el: HTMLElement,
    options: { uri: string; width: string; height: string },
    callback: (controller: SpotifyEmbedController) => void
  ) => void
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void
    SpotifyIframeApi?: SpotifyIFrameAPI
  }
}

let spotifyApiPromise: Promise<SpotifyIFrameAPI> | null = null

const loadSpotifyApi = (): Promise<SpotifyIFrameAPI> => {
  if (window.SpotifyIframeApi) {
    return Promise.resolve(window.SpotifyIframeApi)
  }
  if (!spotifyApiPromise) {
    spotifyApiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = (api) => {
        window.SpotifyIframeApi = api
        resolve(api)
      }
      const script = document.createElement('script')
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      document.head.appendChild(script)
    })
  }
  return spotifyApiPromise
}

type ControllerProps = {
  trackId: string
  isPlaying: boolean
  onEnded: () => void
  onPlayingChange: (playing: boolean) => void
}

const SpotifyController = ({
  trackId,
  isPlaying,
  onEnded,
  onPlayingChange,
}: ControllerProps) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<SpotifyEmbedController | null>(null)
  const endedFiredRef = useRef(false)
  const callbacksRef = useRef({ onEnded, onPlayingChange })
  callbacksRef.current = { onEnded, onPlayingChange }

  useEffect(() => {
    let cancelled = false
    endedFiredRef.current = false

    const host = mountRef.current
    const child = document.createElement('div')
    host?.appendChild(child)

    loadSpotifyApi().then((api) => {
      if (cancelled) return
      api.createController(
        child,
        { uri: `spotify:track:${trackId}`, width: '100%', height: '100%' },
        (controller) => {
          controllerRef.current = controller
          controller.addListener('ready', () => controller.play())
          controller.addListener('playback_update', (event) => {
            const { position, duration, isPaused } = event.data
            callbacksRef.current.onPlayingChange(!isPaused)
            // "Ended" inference: within 300ms of the end (or past it).
            if (
              !endedFiredRef.current &&
              duration > 0 &&
              position >= duration - 300
            ) {
              endedFiredRef.current = true
              callbacksRef.current.onEnded()
            }
          })
        }
      )
    })

    return () => {
      cancelled = true
      try {
        controllerRef.current?.destroy()
      } catch {
        // mid-initialisation destroy can throw — ignore
      }
      controllerRef.current = null
      if (host?.contains(child)) {
        host.removeChild(child)
      }
    }
  }, [trackId])

  useEffect(() => {
    if (!controllerRef.current) return
    if (isPlaying) {
      controllerRef.current.play()
    } else {
      controllerRef.current.pause()
    }
  }, [isPlaying])

  return <div ref={mountRef} className="h-full w-full overflow-hidden" />
}

export default SpotifyController
