import { useEffect, useRef, useState } from 'react'

type CountdownProps = {
  deadline: string
  onExpire?: () => void
}

const format = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

/** Live time-remaining display; fires onExpire once when the deadline passes. */
const Countdown = ({ deadline, onExpire }: CountdownProps) => {
  const [remaining, setRemaining] = useState(
    () => new Date(deadline).getTime() - Date.now()
  )
  const expiredRef = useRef(false)

  useEffect(() => {
    expiredRef.current = new Date(deadline).getTime() - Date.now() <= 0

    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now()
      setRemaining(ms)
      if (ms <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire?.()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deadline, onExpire])

  if (remaining <= 0) {
    return (
      <span className="text-xs text-muted-foreground">Deadline passed</span>
    )
  }

  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {format(remaining)} left
    </span>
  )
}

export default Countdown
