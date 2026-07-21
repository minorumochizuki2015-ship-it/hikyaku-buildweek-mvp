import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { NutritionReport } from '../../shared/nutrition'
import { GozenLedgerScreen } from './GozenLedgerScreen'

const report: NutritionReport = {
  description: 'Courier bowl',
  amountGrams: 200,
  productName: 'Rice bowl',
  source: 'hybrid',
  foodScore: 82,
  nutrients: [
    { key: 'energy', amount: 688, source: 'open-food-facts', judgment: 'OK' },
    { key: 'protein', amount: 24.1, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fat', amount: 12.9, source: 'deterministic-fallback', judgment: 'Low' },
    { key: 'carbohydrates', amount: 71.5, source: 'open-food-facts', judgment: 'OK' },
    { key: 'fiber', amount: 4.2, source: 'gpt-5.6-sol', judgment: 'Low' },
    { key: 'sodium', amount: 0.74, source: 'gpt-5.6-sol', judgment: 'OK' },
  ],
}

describe('GozenLedgerScreen', () => {
  it('renders the supplied food score and movement values', () => {
    const screen = renderToStaticMarkup(<GozenLedgerScreen report={report} steps={8236} kcal={512} locale="ja" />)

    expect(screen).toContain('82')
    expect(screen).toContain('8,236')
    expect(screen).toContain('512 kcal')
  })

  it('derives achieved nutrients and mixed sources from the report nutrients', () => {
    const screen = renderToStaticMarkup(<GozenLedgerScreen report={report} steps={8236} kcal={512} locale="ja" />)

    expect(screen).toContain('4 / 6')
    expect(screen).toContain('複合ソース')
    expect(screen).toContain('整え札')
  })

  it('switches every visible label between Japanese and English', () => {
    const japanese = renderToStaticMarkup(<GozenLedgerScreen report={report} steps={8236} kcal={512} locale="ja" />)
    const english = renderToStaticMarkup(<GozenLedgerScreen report={report} steps={8236} kcal={512} locale="en" />)

    expect(japanese).toContain('御膳帳 Premium')
    expect(japanese).toContain('今日の食事スコア')
    expect(english).toContain('Premium Meal Ledger')
    expect(english).toContain('Today’s meal score')
    expect(english).not.toContain('御膳帳 Premium')
  })
})
