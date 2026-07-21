import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../../shared/nutrition'
import { TomorrowSuggestScreen } from './TomorrowSuggestScreen'

const report: NutritionReport = {
  description: 'Test courier bowl',
  amountGrams: 200,
  productName: null,
  source: 'deterministic-fallback',
  foodScore: 50,
  nutrients: [
    { key: 'energy', amount: 350, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'protein', amount: 30, source: 'deterministic-fallback', judgment: 'High' },
    { key: 'fat', amount: 20, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'carbohydrates', amount: 70, source: 'deterministic-fallback', judgment: 'OK' },
    { key: 'fiber', amount: 4.2, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'sodium', amount: 0.8, source: 'deterministic-fallback', judgment: 'OK' },
  ],
}

function render(locale: 'en' | 'ja'): string {
  return renderToStaticMarkup(
    <TomorrowSuggestScreen
      report={report}
      locale={locale}
      onRecordMeal={() => undefined}
      onViewGoyo={() => undefined}
      onBackToTown={() => undefined}
    />,
  )
}

describe('TomorrowSuggestScreen', () => {
  it('names the nutrient with the lowest non-OK report ratio', () => {
    const screen = render('ja')

    expect(screen).toContain('力飯値')
    expect(screen).toContain('350 kcal / 700 kcal')
    expect(screen).not.toContain('御力札')
  })

  it('renders the supplied report values and specified food asset', () => {
    const screen = render('ja')

    expect(screen).toContain('/assets/food/fish-set-tray.png')
    expect(screen).toContain('食事を記録する')
    expect(screen).toContain('明日の御用を見る')
    expect(screen).toContain('町へ戻る')
  })

  it('switches every visible string to English', () => {
    const screen = render('en')

    expect(screen).toContain('A gentle suggestion for tomorrow')
    expect(screen).toContain('Meal suggestion')
    expect(screen).toContain('Return to town')
    expect(screen).not.toContain('明日の軽いおすすめ')
  })
})
