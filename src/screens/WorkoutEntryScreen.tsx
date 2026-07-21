import { useState } from 'react'
import type { AvailableMinutes, Energy, MissionInput } from '../../shared/mockMission'
import { MIKOTO } from '../../shared/couriers'
import { checkpointRouteState } from '../checkpointRoute'
import { distanceTargetMetres, type MovementMode } from '../movement'
import './workout-entry.css'

type Locale = 'en' | 'ja'

export interface AcceptedDuty {
  name: string
  route: string
  distanceMetres: number
}

export interface WorkoutEntryScreenProps {
  duty: AcceptedDuty | null
  onSubmit: (input: MissionInput, movementMode: MovementMode) => void
  onBack: () => void
  generating: boolean
  locale: Locale
}

const COPY = {
  en: {
    title: 'Junko Setup',
    subtitle: 'Choose how you move today',
    duration: 'Runner settings',
    time: 'Time',
    minute: 'min',
    movementMode: 'Movement mode',
    realWalk: 'Real Walk',
    judgeDemo: 'Judge Demo',
    judgeDemoHelp: 'Judge Demo simulates the walk so you can complete a full mission without moving.',
    privacyHelp: 'Real Walk: your location stays on your device.',
    energy: 'Energy',
    low: 'Low',
    steady: 'Steady',
    ready: 'Ready',
    displayName: 'Courier name',
    optional: '(optional)',
    displayNamePlaceholder: 'Your courier name',
    target: 'Current target',
    targetNote: 'Time and energy set this target distance.',
    submit: 'Begin Junko',
    generating: 'Preparing your mission…',
    contract: 'Today’s contract',
    acceptedDuty: 'Accepted duty',
    rankPending: 'Rank is awarded at arrival',
    nextCheckpoint: 'Next checkpoint',
  },
  ja: {
    title: '巡行設定',
    subtitle: '今日の走り方を決める',
    duration: 'ランナー向け',
    time: '時間',
    minute: '分',
    movementMode: '巡行のしかた',
    realWalk: '実際に歩く',
    judgeDemo: 'デモで進む',
    judgeDemoHelp: 'デモで進むを選ぶと、動かずに御用を最後まで見届けられます。',
    privacyHelp: '実際に歩く：位置情報は端末から出ません。',
    energy: '今日の調子',
    low: '低い',
    steady: 'ふつう',
    ready: '万全',
    displayName: '飛脚名',
    optional: '（任意）',
    displayNamePlaceholder: '飛脚の名',
    target: '現在の目標距離',
    targetNote: '時間と調子が目標距離に反映されます。',
    submit: '巡行を開始',
    generating: '御用を整えています…',
    contract: '今日の契約',
    acceptedDuty: '承った御用',
    rankPending: '等級は到着時に決まります',
    nextCheckpoint: '次の関所',
  },
} as const

export function buildWorkoutMissionInput(availableMinutes: AvailableMinutes, energy: Energy, displayName: string): MissionInput {
  return {
    availableMinutes,
    energy,
    courierId: MIKOTO.id,
    displayName: displayName.trim() || undefined,
  }
}

function formatDistance(distanceMetres: number, locale: Locale): string {
  return locale === 'ja'
    ? `${distanceMetres.toLocaleString('ja-JP')}m`
    : `${distanceMetres.toLocaleString('en-US')} m`
}

export function WorkoutEntryScreen({ duty, onSubmit, generating, locale }: WorkoutEntryScreenProps) {
  const [availableMinutes, setAvailableMinutes] = useState<AvailableMinutes>(10)
  const [energy, setEnergy] = useState<Energy>('Steady')
  const [displayName, setDisplayName] = useState('')
  const [movementMode, setMovementMode] = useState<MovementMode>('demo')
  const copy = COPY[locale]
  const targetDistanceMetres = distanceTargetMetres(availableMinutes, energy)
  const route = duty ? checkpointRouteState(0, duty.distanceMetres) : null

  const energies: ReadonlyArray<{ value: Energy; label: string }> = [
    { value: 'Low', label: copy.low },
    { value: 'Steady', label: copy.steady },
    { value: 'Ready', label: copy.ready },
  ]

  return (
    <main className="workout-entry-screen" aria-labelledby="workout-entry-title" lang={locale}>
      <header className="workout-entry-header">
        <h1 id="workout-entry-title">{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>

      <form
        className="workout-entry-form"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(buildWorkoutMissionInput(availableMinutes, energy, displayName), movementMode)
        }}
      >
        <fieldset className="workout-entry-panel">
          <legend>{copy.duration}</legend>
          <div className="workout-entry-setting-row">
            <span>{copy.time}</span>
            <div className="workout-entry-choice-row workout-entry-time-row">
              {([5, 10, 15] as AvailableMinutes[]).map((minutes) => (
                <label className="workout-entry-choice" key={minutes}>
                  <input type="radio" name="workout-entry-minutes" value={minutes} checked={availableMinutes === minutes} onChange={() => setAvailableMinutes(minutes)} />
                  <span>{minutes}<small>{copy.minute}</small></span>
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        <fieldset className="workout-entry-panel">
          <legend>{copy.movementMode}</legend>
          <div className="workout-entry-choice-row workout-entry-two-columns">
            <label className="workout-entry-choice">
              <input type="radio" name="workout-entry-movement-mode" value="walk" checked={movementMode === 'walk'} onChange={() => setMovementMode('walk')} />
              <span>{copy.realWalk}</span>
            </label>
            <label className="workout-entry-choice">
              <input type="radio" name="workout-entry-movement-mode" value="demo" checked={movementMode === 'demo'} onChange={() => setMovementMode('demo')} />
              <span>{copy.judgeDemo}</span>
            </label>
          </div>
          <p className="workout-entry-helper">{copy.judgeDemoHelp}</p>
          <p className="workout-entry-helper workout-entry-privacy-note">{copy.privacyHelp}</p>
        </fieldset>

        <fieldset className="workout-entry-panel">
          <legend>{copy.energy}</legend>
          <div className="workout-entry-choice-row">
            {energies.map(({ value, label }) => (
              <label className="workout-entry-choice" key={value}>
                <input type="radio" name="workout-entry-energy" value={value} checked={energy === value} onChange={() => setEnergy(value)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {duty && route && (
          <section className="workout-entry-contract" aria-label={copy.contract}>
            <span className="workout-entry-contract-emblem" aria-hidden="true">⚑</span>
            <div className="workout-entry-contract-goal">
              <span>{copy.acceptedDuty}</span>
              <strong>{duty.name}</strong>
              <p>{duty.route}</p>
            </div>
            <div className="workout-entry-contract-route">
              <span className="workout-entry-contract-rank">{copy.rankPending}</span>
              <ol className="workout-entry-checkpoint-rail" aria-label={copy.nextCheckpoint}>
                {route.waypoints.map((checkpoint) => (
                  <li key={checkpoint.name.ja} className={checkpoint.state === 'current' ? 'is-next' : undefined}>
                    <span aria-hidden="true">⛩</span>
                  </li>
                ))}
              </ol>
              {route.nextCheckpoint && <p><b>{copy.nextCheckpoint}</b> {route.nextCheckpoint.name[locale]} · {formatDistance(route.nextCheckpoint.distanceRemainingMetres, locale)}</p>}
            </div>
          </section>
        )}

        <label className="workout-entry-name-field workout-entry-panel">
          <span>{copy.displayName} <em>{copy.optional}</em></span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={40} placeholder={copy.displayNamePlaceholder} />
        </label>

        <div className="workout-entry-footer">
          <p>{copy.target}: <strong>{formatDistance(targetDistanceMetres, locale)}</strong> — {copy.targetNote}</p>
          <button className="workout-entry-submit" type="submit" disabled={generating}>{generating ? copy.generating : copy.submit}</button>
        </div>
      </form>
    </main>
  )
}
