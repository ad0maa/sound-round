import { useEffect, useState } from 'react'

import './WakingLoader.css'

export interface WakingLoaderProps {
  /** Caption shown under the animation. */
  message?: string
  /** Cheeky second line under the caption. Pass null to hide it. */
  subMessage?: string | null
  /** Delay before the loader appears (ms). Warm loads that resolve faster than
   * this never see it. Pass 0 to show immediately (e.g. the preview page). */
  delayMs?: number
  /** Center the loader in a full-screen container. Defaults to true. */
  fullscreen?: boolean
}

const WakingLoader = ({
  message = 'Waking up the database',
  subMessage = 'hosting ain’t free',
  delayMs = 700,
  fullscreen = true,
}: WakingLoaderProps) => {
  const [visible, setVisible] = useState(delayMs <= 0)

  useEffect(() => {
    if (delayMs <= 0) return
    const timer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(timer)
  }, [delayMs])

  if (!visible) return null

  const wrapperClass = fullscreen
    ? 'wl-root flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 p-6'
    : 'wl-root flex w-full flex-col items-center justify-center gap-3'

  return (
    <div className={wrapperClass} role="status" aria-live="polite">
      <span className="sr-only">{message}…</span>
      <svg
        className="wl-svg"
        viewBox="0 0 560 220"
        role="img"
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <title>Waking up the database</title>
        <desc>
          A person in a hoodie walks to a desk and boots a PC while a golden
          retriever settles into a dog bed.
        </desc>
        <rect x="0" y="176" width="560" height="4" fill="#9aa3b0" opacity="0.5" />
        <rect x="26" y="162" width="72" height="8" fill="#5a6b7d" />
        <rect x="30" y="168" width="64" height="10" fill="#93a7bd" />
        <rect x="26" y="176" width="72" height="3" fill="#5a6b7d" />
        <rect x="360" y="150" width="150" height="8" fill="#8a5a3b" />
        <rect x="366" y="158" width="8" height="22" fill="#6f462d" />
        <rect x="496" y="158" width="8" height="22" fill="#6f462d" />
        <rect className="wl-steam" x="368" y="122" width="3" height="8" fill="#cbd5e1" />
        <rect className="wl-steam2" x="374" y="120" width="3" height="8" fill="#cbd5e1" />
        <rect x="362" y="134" width="16" height="16" fill="#dc2626" />
        <rect x="364" y="134" width="12" height="3" fill="#7f1d1d" />
        <rect x="378" y="138" width="5" height="3" fill="#dc2626" />
        <rect x="381" y="141" width="3" height="4" fill="#dc2626" />
        <rect x="378" y="145" width="5" height="3" fill="#dc2626" />
        <rect x="408" y="96" width="78" height="52" fill="#2b3242" />
        <rect x="414" y="102" width="66" height="40" fill="#10141c" />
        <g className="wl-screen-on">
          <rect x="414" y="102" width="66" height="40" fill="#2563eb" />
          <rect x="420" y="110" width="30" height="5" fill="#bcd3ff" />
          <rect x="420" y="120" width="46" height="4" fill="#7fa8f5" />
          <rect className="wl-bootbar" x="420" y="130" width="52" height="5" fill="#bcd3ff" />
        </g>
        <rect x="440" y="148" width="14" height="4" fill="#3a4152" />
        <rect x="518" y="118" width="26" height="58" fill="#3a4152" />
        <rect x="522" y="122" width="18" height="6" fill="#20252f" />
        <circle cx="531" cy="140" r="4" fill="#5b6472" />
        <rect x="524" y="152" width="16" height="3" fill="#20252f" />
        <rect x="524" y="158" width="16" height="3" fill="#20252f" />
        <g className="wl-admin">
          <g className="wl-bob">
            <g className="wl-legL">
              <rect x="10" y="150" width="7" height="26" fill="#334155" />
              <rect x="8" y="172" width="11" height="6" fill="#1e293b" />
            </g>
            <g className="wl-legR">
              <rect x="22" y="150" width="7" height="26" fill="#334155" />
              <rect x="20" y="172" width="11" height="6" fill="#1e293b" />
            </g>
            <rect x="4" y="100" width="34" height="14" fill="#3b4656" />
            <rect x="6" y="110" width="30" height="46" fill="#4b5768" />
            <rect x="11" y="130" width="20" height="14" fill="#3b4656" />
            <rect x="16" y="112" width="2" height="9" fill="#e2e8f0" />
            <rect x="24" y="112" width="2" height="9" fill="#e2e8f0" />
            <g className="wl-arm">
              <rect x="30" y="120" width="14" height="6" fill="#4b5768" />
              <rect x="42" y="120" width="6" height="6" fill="#f2c7a0" />
            </g>
            <rect x="12" y="86" width="18" height="20" fill="#f2c7a0" />
            <rect x="14" y="94" width="3" height="4" fill="#1f2937" />
            <rect x="24" y="94" width="3" height="4" fill="#1f2937" />
            <rect x="14" y="103" width="10" height="3" fill="#c8996b" />
            <rect x="10" y="80" width="22" height="8" fill="#7f1d1d" />
            <rect x="12" y="74" width="18" height="7" fill="#991b1b" />
          </g>
        </g>
        <g className="wl-dogwalk">
          <g className="wl-dLegA">
            <rect x="4" y="166" width="4" height="12" fill="#c8902f" />
            <rect x="30" y="166" width="4" height="12" fill="#c8902f" />
          </g>
          <g className="wl-dLegB">
            <rect x="10" y="166" width="4" height="12" fill="#d9a441" />
            <rect x="36" y="166" width="4" height="12" fill="#d9a441" />
          </g>
          <rect className="wl-tail" x="-6" y="150" width="10" height="5" fill="#e0a94a" />
          <rect x="2" y="152" width="36" height="16" fill="#e0a94a" />
          <rect x="34" y="144" width="14" height="14" fill="#e6b45a" />
          <rect x="34" y="144" width="6" height="11" fill="#c8902f" />
          <rect x="46" y="150" width="9" height="7" fill="#e6b45a" />
          <rect x="53" y="151" width="3" height="3" fill="#3a2a17" />
          <rect x="42" y="148" width="2" height="2" fill="#3a2a17" />
        </g>
        <g className="wl-dogsit">
          <rect className="wl-tailsit" x="34" y="158" width="12" height="5" fill="#e0a94a" />
          <rect x="44" y="150" width="22" height="20" fill="#e0a94a" />
          <rect x="46" y="168" width="16" height="4" fill="#c8902f" />
          <rect x="60" y="138" width="14" height="30" fill="#e6b45a" />
          <rect x="62" y="158" width="4" height="12" fill="#d9a441" />
          <rect x="68" y="158" width="4" height="12" fill="#d9a441" />
          <rect x="60" y="126" width="16" height="16" fill="#e6b45a" />
          <rect x="60" y="126" width="6" height="13" fill="#c8902f" />
          <rect x="74" y="132" width="8" height="7" fill="#e6b45a" />
          <rect x="80" y="133" width="3" height="3" fill="#3a2a17" />
          <rect x="68" y="131" width="2" height="2" fill="#3a2a17" />
        </g>
      </svg>
      <p
        className="font-mono text-sm text-muted-foreground"
        aria-hidden="true"
      >
        {message}
        <span className="wl-dot" />
      </p>
      {subMessage && (
        <p
          className="font-mono text-xs text-muted-foreground opacity-70"
          aria-hidden="true"
        >
          …{subMessage}
        </p>
      )}
    </div>
  )
}

export default WakingLoader
