import { afterEach, describe, expect, it, vi } from 'vitest'

import { isNutritionReport, NUTRIENT_DEFINITIONS, perMealReferenceValue, type NutrientKey } from '../shared/nutrition'
import { buildNutritionReport, foodScoreFor, judgeGap } from './nutrition'

type Amounts = Record<NutrientKey, number>

const foods: ReadonlyArray<{ name: string; amounts: Amounts }> = [
  { name: 'onigiri', amounts: { energy: 320, protein: 5, fat: 1, carbohydrates: 74, fiber: 1, sodium: 0.7 } },
  { name: 'tofu', amounts: { energy: 114, protein: 12, fat: 7.2, carbohydrates: 2.9, fiber: 0.5, sodium: 0.015 } },
  { name: 'grilled salmon', amounts: { energy: 250, protein: 27, fat: 15, carbohydrates: 0, fiber: 0, sodium: 0.08 } },
  { name: 'miso soup', amounts: { energy: 40, protein: 3, fat: 1.5, carbohydrates: 5, fiber: 1, sodium: 1 } },
  { name: 'Kit Kat', amounts: { energy: 230, protein: 3, fat: 12, carbohydrates: 28, fiber: 1, sodium: 0.12 } },
  { name: 'Coca-Cola', amounts: { energy: 225, protein: 0, fat: 0, carbohydrates: 56, fiber: 0, sodium: 0.02 } },
]

const balancedSingleItem: Amounts = Object.fromEntries(
  NUTRIENT_DEFINITIONS.map((nutrient) => [
    nutrient.key,
    perMealReferenceValue(nutrient, 'japan'),
  ]),
) as Amounts

function openFoodFactsMiss(): Response {
  return new Response(JSON.stringify({ page_count: 0, products: [] }), { status: 200 })
}

function validAiResponse(): Response {
  const nutrients = NUTRIENT_DEFINITIONS.map((nutrient, index) => ({ key: nutrient.key, amount: index + 1 }))
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ nutrients }) } }] }), { status: 200 })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('nutrition scoring', () => {
  it('uses the single-item reference for the status pills', () => {
    const energy = NUTRIENT_DEFINITIONS[0]!
    const singleItemReference = perMealReferenceValue(energy, 'japan')

    expect(judgeGap(singleItemReference, singleItemReference)).toBe('OK')
    expect(judgeGap(singleItemReference * 0.84, singleItemReference)).toBe('Low')
    expect(judgeGap(singleItemReference * 1.16, singleItemReference)).toBe('High')
  })

  it('keeps a realistic single meal out of an all-high judgment state', () => {
    const meal: Amounts = { energy: 300, protein: 12, fat: 10, carbohydrates: 40, fiber: 6, sodium: 0.5 }
    const judgments = NUTRIENT_DEFINITIONS.map((nutrient) => {
      const displayedGuide = perMealReferenceValue(nutrient, 'japan')
      const judgment = judgeGap(meal[nutrient.key], displayedGuide)
      return { key: nutrient.key, amount: meal[nutrient.key], displayedGuide, judgment }
    })

    expect(judgments.every(({ judgment }) => judgment === 'High')).toBe(false)
    for (const nutrient of judgments) {
      if (nutrient.amount < nutrient.displayedGuide) expect(nutrient.judgment).not.toBe('High')
    }
  })

  it('gives the measured food fixtures visibly different scores', () => {
    const scores = foods.map(({ name, amounts }) => ({ name, score: foodScoreFor(amounts) }))

    expect(scores).toEqual([
      { name: 'onigiri', score: 54 },
      { name: 'tofu', score: 39 },
      { name: 'grilled salmon', score: 35 },
      { name: 'miso soup', score: 24 },
      { name: 'Kit Kat', score: 55 },
      { name: 'Coca-Cola', score: 26 },
    ])
    expect(new Set(scores.map(({ score }) => score)).size).toBe(scores.length)
    expect(foodScoreFor(balancedSingleItem)).toBe(100)
    expect(foodScoreFor(balancedSingleItem)).toBeGreaterThan(
      scores.find(({ name }) => name === 'Coca-Cola')!.score,
    )
  })
})

describe('nutrition AI attempt reporting', () => {
  it('reports that AI was skipped when no API key is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(openFoodFactsMiss())
    vi.stubGlobal('fetch', fetchMock)

    const report = await buildNutritionReport({ description: 'unlisted meal', amountGrams: 100 }, {})

    expect(report.aiAttempt).toEqual({ status: 'skipped-no-api-key', estimatedCount: 0 })
    expect(report.nutrients.every((nutrient) => nutrient.source === 'deterministic-fallback')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports an AI HTTP failure and keeps deterministic fallback values honest', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(openFoodFactsMiss())
      .mockResolvedValue(new Response('', { status: 400 }))
    vi.stubGlobal('fetch', fetchMock)

    const report = await buildNutritionReport({ description: 'unlisted meal', amountGrams: 100 }, { OPENAI_API_KEY: 'test-key' })

    expect(report.aiAttempt).toEqual({ status: 'failed', estimatedCount: 0, reason: 'HTTP 400' })
    expect(report.nutrients.every((nutrient) => nutrient.source === 'deterministic-fallback')).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('reports AI success only when validated values supply every missing nutrient', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(openFoodFactsMiss())
      .mockResolvedValueOnce(validAiResponse())
    vi.stubGlobal('fetch', fetchMock)

    const report = await buildNutritionReport({ description: 'unlisted meal', amountGrams: 100 }, { OPENAI_API_KEY: 'test-key' })
    const requestBody = JSON.parse(String((fetchMock.mock.calls[1]![1] as RequestInit).body)) as Record<string, unknown>
    const schema = JSON.stringify((requestBody.response_format as { json_schema: { schema: unknown } }).json_schema.schema)

    expect(report.aiAttempt).toEqual({ status: 'succeeded', estimatedCount: NUTRIENT_DEFINITIONS.length })
    expect(report.nutrients.every((nutrient) => nutrient.source === 'gpt-5.6-sol')).toBe(true)
    expect(schema).not.toContain('minItems')
    expect(schema).not.toContain('maxItems')
    expect(schema).not.toContain('minimum')
  })

  it('accepts an older nutrition report without AI attempt status', () => {
    const legacyReport = {
      description: 'Legacy meal',
      amountGrams: 100,
      productName: null,
      source: 'deterministic-fallback',
      foodScore: 50,
      nutrients: NUTRIENT_DEFINITIONS.map((nutrient) => ({
        key: nutrient.key,
        amount: 1,
        source: 'deterministic-fallback',
        judgment: 'Low',
      })),
    }

    expect(isNutritionReport(legacyReport)).toBe(true)
  })
})
