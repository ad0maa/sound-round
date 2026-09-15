import WakingLoader from './WakingLoader'
import './WakingPopup.css'

/**
 * A small floating card that pops up while a submit (login / signup) is waiting
 * on a slow database wake-up. It overlays the page without replacing it, so the
 * already-loaded form stays put — unlike the full-screen loader used on the
 * protected routes. Non-interactive (pointer-events: none), so it never blocks
 * the form behind it.
 *
 * Mount it only once past the cold-start threshold (the caller owns that delay);
 * the inner loader renders immediately with delayMs=0.
 */
const WakingPopup = () => {
  return (
    <div className="wl-popup">
      <WakingLoader delayMs={0} fullscreen={false} />
    </div>
  )
}

export default WakingPopup
