import { useEffect, useRef } from 'react'

/**
 * SoundCloud Widget API wrapper. Auto-advance is reliable here:
 * the widget fires FINISH when the track ends.
 */

type SCWidget = {
  bind: (event: string, listener: () => void) => void
  unbind: (event: string) => void
  play: () => void
  pause: () => void
}

type SCNamespace = {
  Widget: ((iframe: HTMLIFrameElement) => SCWidget) & {
    Events: { FINISH: string; PLAY: string; PAUSE: string; READY: string }
  }
}

declare global {
  interface Window {
    SC?: SCNamespace
  }
}

let scApiPromise: Promise<SCNamespace> | null = null

const loadSoundCloudApi = (): Promise<SCNamespace> => {
  if (window.SC?.Widget) {
    return Promise.resolve(window.SC)
  }
  if (!scApiPromise) {
    scApiPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://w.soundcloud.com/player/api.js'
      script.onload = () => resolve(window.SC)
      document.head.appendChild(script)
    })
  }
  return scApiPromise
}

type ControllerProps = {
  trackUrl: string
  isPlaying: boolean
  onEnded: () => void
  onPlayingChange: (playing: boolean) => void
}

const SoundCloudController = ({
  trackUrl,
  isPlaying,
  onEnded,
  onPlayingChange,
}: ControllerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<SCWidget | null>(null)
  const callbacksRef = useRef({ onEnded, onPlayingChange })
  callbacksRef.current = { onEnded, onPlayingChange }

  useEffect(() => {
    let cancelled = false

    loadSoundCloudApi().then((SC) => {
      if (cancelled || !iframeRef.current) return
      const widget = SC.Widget(iframeRef.current)
      widgetRef.current = widget
      widget.bind(SC.Widget.Events.FINISH, () => callbacksRef.current.onEnded())
      widget.bind(SC.Widget.Events.PLAY, () =>
        callbacksRef.current.onPlayingChange(true)
      )
      widget.bind(SC.Widget.Events.PAUSE, () =>
        callbacksRef.current.onPlayingChange(false)
      )
    })

    return () => {
      cancelled = true
      const SC = window.SC
      if (widgetRef.current && SC) {
        widgetRef.current.unbind(SC.Widget.Events.FINISH)
        widgetRef.current.unbind(SC.Widget.Events.PLAY)
        widgetRef.current.unbind(SC.Widget.Events.PAUSE)
      }
      widgetRef.current = null
    }
    // The iframe src carries the track — remounting on trackUrl change
    // re-runs this effect against the fresh iframe.
  }, [trackUrl])

  useEffect(() => {
    if (!widgetRef.current) return
    if (isPlaying) {
      widgetRef.current.play()
    } else {
      widgetRef.current.pause()
    }
  }, [isPlaying])

  const params =
    'auto_play=true&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false&show_artwork=true'

  return (
    <iframe
      ref={iframeRef}
      title="SoundCloud player"
      width="100%"
      height="100%"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&${params}`}
    />
  )
}

export default SoundCloudController
