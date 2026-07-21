import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MIKOTO } from '../../shared/couriers'
import { buildWorkoutMissionInput, WorkoutEntryScreen } from './WorkoutEntryScreen'

const duty = {
  name: 'Deliver the sealed letter',
  route: 'Nihonbashi → Asakusa',
  distanceMetres: 1200,
}

function renderScreen(locale: 'en' | 'ja', acceptedDuty: typeof duty | null = duty, generating = false): string {
  return renderToStaticMarkup(
    <WorkoutEntryScreen
      duty={acceptedDuty}
      generating={generating}
      locale={locale}
      onBack={() => undefined}
      onSubmit={() => undefined}
    />,
  )
}

describe('WorkoutEntryScreen', () => {
  it('renders an accepted duty only when the caller provides one', () => {
    const accepted = renderScreen('en')
    const none = renderScreen('en', null)

    expect(accepted).toContain(duty.name)
    expect(accepted).toContain(duty.route)
    expect(accepted).toContain('workout-entry-contract')
    expect(accepted).toContain('Nihonbashi')
    expect(accepted).toContain('240 m')
    expect(none).not.toContain('workout-entry-contract')
    expect(none).not.toContain('Accepted duty')
  })

  it('keeps the dispatch option sets and fixed courier mission payload', () => {
    const screen = renderScreen('en')
    const input = buildWorkoutMissionInput(15, 'Ready', '  Ada  ')

    expect(screen).toContain('value="5"')
    expect(screen).toContain('value="10"')
    expect(screen).toContain('value="15"')
    expect(screen).toContain('value="walk"')
    expect(screen).toContain('value="demo"')
    expect(screen).toContain('maxLength="40"')
    expect(input).toEqual({ availableMinutes: 15, energy: 'Ready', courierId: MIKOTO.id, displayName: 'Ada' })
  })

  it('uses a Japanese-only visible interface when Japanese is selected', () => {
    const screen = renderScreen('ja')

    expect(screen).toContain('巡行設定')
    expect(screen).toContain('ランナー向け')
    expect(screen).toContain('デモで進む')
    expect(screen).toContain('巡行を開始')
    expect(screen).not.toContain('Begin Junko')
    expect(screen).not.toContain('Runner settings')
  })

  it('disables the primary action during generation', () => {
    const screen = renderScreen('en', duty, true)

    expect(screen).toMatch(/<button[^>]*disabled[^>]*>Preparing your mission…<\/button>/)
  })
})
