import { useEffect, useRef, useState } from 'react'
import './cinematic-cut.css'

export type CinematicCutId = 'departure' | 'arrival'

/**
 * Short story cuts from the canonical animation set. They play once at the two
 * moments the story turns — the courier setting out, and the goyo landing — and
 * are always skippable, because a demo that cannot be skipped is a demo that
 * wastes a judge's time.
 */
export function cinematicSourceFor(id: CinematicCutId): string {
  return id === 'departure' ? '/assets/cine-departure.mp4' : '/assets/cine-arrival.mp4'
}

export const CINEMATIC_COPY = {
  departure: { en: 'Setting out', ja: '出陣' },
  arrival: { en: 'Goyo delivered', ja: '御用、相務めました' },
} as const

export interface CinematicCutProps {
  id: CinematicCutId
  locale: 'en' | 'ja'
  onDone: () => void
}

export function CinematicCut({ id, locale, onDone }: CinematicCutProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [done, setDone] = useState(false)

  // A cut that fails to load, is blocked by autoplay policy, or is disabled by
  // a reduced-motion preference must never strand the player mid-flow.
  const finish = () => {
    if (done) return
    setDone(true)
    onDone()
  }

  useEffect(() => {
    const reduced = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      finish()
      return
    }
    const timer = window.setTimeout(finish, 9000)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="cinematic-cut" role="presentation" lang={locale}>
      <video
        ref={videoRef}
        key={id}
        className="cinematic-cut__video"
        src={cinematicSourceFor(id)}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
      <p className="cinematic-cut__caption">{CINEMATIC_COPY[id][locale]}</p>
      <button className="cinematic-cut__skip" type="button" onClick={finish}>
        {locale === 'ja' ? 'スキップ' : 'Skip'} <span aria-hidden="true">›</span>
      </button>
    </div>
  )
}
