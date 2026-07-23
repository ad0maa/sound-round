import { Music, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'

import SoundCloudController from 'src/components/Player/controllers/SoundCloudController'
import SpotifyController from 'src/components/Player/controllers/SpotifyController'
import YouTubeController from 'src/components/Player/controllers/YouTubeController'
import { usePlayer } from 'src/components/Player/PlayerProvider'
import { cn } from 'src/lib/utils'

const controlBtnClass =
  'grid size-9 flex-none place-items-center rounded-full border-[1.5px] border-divider bg-background dark:bg-card text-foreground transition-colors enabled:hover:border-brand enabled:hover:text-brand disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Bottom-docked queue player. Mounts exactly ONE platform embed at a time —
 * auto-advance is reliable on YouTube/SoundCloud, best-effort on Spotify
 * (previews for logged-out listeners; Next is always there as the fallback).
 * Sits above the mobile bottom tab bar, flush to the bottom on desktop.
 */
const PlayerDock = () => {
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    togglePlay,
    next,
    prev,
    stop,
    handleEnded,
    reportPlaying,
  } = usePlayer()

  if (currentTrack === null || currentIndex === null) {
    return null
  }

  const controllerProps = {
    isPlaying,
    onEnded: handleEnded,
    onPlayingChange: reportPlaying,
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(60px+env(safe-area-inset-bottom))] z-30 nav:bottom-0">
      <div className="mx-auto w-full max-w-3xl border-t border-x border-divider bg-card px-4 pb-3 pt-3 shadow-[0_-6px_24px_rgba(0,0,0,0.08)] nav:rounded-t-3xl">
        <div className="mb-2.5 flex items-center gap-3">
          {currentTrack.artworkUrl ? (
            <img
              src={currentTrack.artworkUrl}
              alt=""
              className="size-10 flex-none rounded-xl object-cover"
            />
          ) : (
            <span className="grid size-10 flex-none place-items-center rounded-xl bg-brand text-white">
              <Music className="h-4 w-4" strokeWidth={2.2} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {currentTrack.trackName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {currentTrack.artistName}
            </p>
          </div>

          <div className="flex flex-none items-center gap-1.5">
            <button
              type="button"
              className={controlBtnClass}
              onClick={prev}
              disabled={currentIndex === 0}
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                controlBtnClass,
                'border-brand bg-brand text-white enabled:hover:text-white'
              )}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="ml-0.5 h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              className={controlBtnClass}
              onClick={next}
              disabled={currentIndex >= queue.length - 1}
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          <span className="hidden flex-none text-xs font-semibold text-muted-foreground sm:block">
            {currentIndex + 1} of {queue.length}
          </span>

          <button
            type="button"
            className="grid size-9 flex-none place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            onClick={stop}
            aria-label="Close player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-20 overflow-hidden rounded-xl">
          {currentTrack.platform === 'youtube' && (
            <YouTubeController
              key={currentTrack.submissionId}
              videoId={currentTrack.platformTrackId}
              {...controllerProps}
            />
          )}
          {currentTrack.platform === 'soundcloud' && (
            <SoundCloudController
              key={currentTrack.submissionId}
              trackUrl={currentTrack.trackUrl}
              {...controllerProps}
            />
          )}
          {currentTrack.platform === 'spotify' && (
            <SpotifyController
              key={currentTrack.submissionId}
              trackId={currentTrack.platformTrackId}
              {...controllerProps}
            />
          )}
        </div>

        {currentTrack.platform === 'spotify' && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Spotify plays previews unless you&apos;re logged in — use Next if it
            doesn&apos;t advance on its own.
          </p>
        )}
      </div>
    </div>
  )
}

export default PlayerDock
