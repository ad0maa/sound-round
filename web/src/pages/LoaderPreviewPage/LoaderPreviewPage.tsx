import { useState } from 'react'

import { Metadata } from '@cedarjs/web'

import WakingLoader from 'src/components/WakingLoader/WakingLoader'
import WakingPopup from 'src/components/WakingLoader/WakingPopup'
import { Button } from 'src/components/ui/button'

type Sim = { key: number; delayMs: number; settleMs: number } | null

const LoaderPreviewPage = () => {
  const [sim, setSim] = useState<Sim>(null)
  const [showPopup, setShowPopup] = useState(false)

  const previewPopup = () => {
    setShowPopup(true)
    setTimeout(() => setShowPopup(false), 4500)
  }

  // Mounts a real WakingLoader (with its production 700ms delay) and then
  // "resolves" after settleMs, mimicking a fast vs. slow database response.
  const runSim = (settleMs: number) => {
    const key = Date.now()
    setSim({ key, delayMs: 700, settleMs })
    setTimeout(() => {
      setSim((current) => (current?.key === key ? null : current))
    }, settleMs)
  }

  return (
    <>
      <Metadata title="Loader preview" description="Preview the waking-database loader" />

      <main className="mx-auto max-w-2xl space-y-8 p-6">
        <header className="space-y-1">
          <h1 className="font-heading text-2xl">Waking-database loader</h1>
          <p className="text-sm text-muted-foreground">
            A throwaway page for testing the cold-start loader locally and on
            preview deploys. Safe to delete later.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Always on (no delay)
          </h2>
          <div className="rounded-2xl border border-border bg-card">
            <WakingLoader delayMs={0} fullscreen={false} />
            <div className="p-4" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Simulate the real delayed reveal (700ms threshold)
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => runSim(400)}>
              Simulate warm load (400ms)
            </Button>
            <Button variant="outline" onClick={() => runSim(4000)}>
              Simulate cold start (4s)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Warm load resolves before the threshold, so the loader never appears.
            Cold start crosses it, so you see the animation until it resolves.
          </p>
          <div className="min-h-[280px] rounded-2xl border border-border bg-card">
            {sim ? (
              <WakingLoader key={sim.key} delayMs={sim.delayMs} fullscreen={false} />
            ) : (
              <div className="flex min-h-[280px] items-center justify-center p-6 text-sm text-muted-foreground">
                Content area — press a button above.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Auth-page popup (login / signup submit)
          </h2>
          <p className="text-xs text-muted-foreground">
            A small floating card that overlays the page while a slow login/signup
            waits on a cold start — the form stays put, nothing is replaced.
          </p>
          <Button variant="outline" onClick={previewPopup}>
            Show the popup for 4.5s
          </Button>
        </section>
      </main>

      {showPopup && <WakingPopup />}
    </>
  )
}

export default LoaderPreviewPage
