import { describe, it, expect } from 'vitest'
import {
  encodeSimulationInputs,
  decodeSimulationInputs,
  inputsToFormState,
} from '@/lib/tax/simulation-share'
import type { SimulationInputs } from '@/lib/tax/simulation'

describe('simulation-share', () => {
  const singlePerson: SimulationInputs = {
    married: false,
    persons: [{ birth_year: 1995, gross_cat_a: 25000 }],
    dependents_under_3: 0,
    dependents_3_to_6: 0,
    dependents_over_6: 0,
  }

  const marriedWithKids: SimulationInputs = {
    married: true,
    persons: [
      { birth_year: 1988, gross_cat_a: 30000, gross_cat_b: 5000 },
      { birth_year: 1990, gross_cat_a: 22000, nhr: true },
    ],
    dependents_under_3: 1,
    dependents_3_to_6: 0,
    dependents_over_6: 2,
  }

  describe('round-trip encode/decode', () => {
    it('round-trips single person inputs', () => {
      const encoded = encodeSimulationInputs(singlePerson)
      const decoded = decodeSimulationInputs(encoded)
      expect(decoded).toEqual(singlePerson)
    })

    it('round-trips married couple with dependents', () => {
      const encoded = encodeSimulationInputs(marriedWithKids)
      const decoded = decodeSimulationInputs(encoded)
      expect(decoded).toEqual(marriedWithKids)
    })

    it('produces URL-safe characters only', () => {
      const encoded = encodeSimulationInputs(marriedWithKids)
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('produces compact output', () => {
      const encoded = encodeSimulationInputs(singlePerson)
      // JSON is ~110 chars, base64 adds ~33% overhead
      expect(encoded.length).toBeLessThan(200)
    })
  })

  describe('decode error handling', () => {
    it('returns null for empty string', () => {
      expect(decodeSimulationInputs('')).toBeNull()
    })

    it('returns null for invalid base64', () => {
      expect(decodeSimulationInputs('not!valid!base64!!!')).toBeNull()
    })

    it('returns null for valid base64 but invalid JSON', () => {
      const encoded = btoa('not json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      expect(decodeSimulationInputs(encoded)).toBeNull()
    })

    it('returns null for valid JSON but wrong shape (no married field)', () => {
      const encoded = btoa(JSON.stringify({ foo: 'bar' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      expect(decodeSimulationInputs(encoded)).toBeNull()
    })

    it('returns null for valid JSON but no persons array', () => {
      const encoded = btoa(JSON.stringify({ married: true, persons: 'not array' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      expect(decodeSimulationInputs(encoded)).toBeNull()
    })

    it('returns null for valid JSON but empty persons array', () => {
      const encoded = btoa(JSON.stringify({ married: false, persons: [] }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
      expect(decodeSimulationInputs(encoded)).toBeNull()
    })
  })

  describe('inputsToFormState', () => {
    it('converts single person inputs to form state', () => {
      const state = inputsToFormState(singlePerson)
      expect(state).toEqual({
        married: false,
        persons: [
          {
            birth_year: '1995',
            gross_cat_a: '25000',
            gross_cat_b: '',
            nhr: false,
            first_work_year: '',
          },
        ],
        depsUnder3: 0,
        deps3to6: 0,
        depsOver6: 0,
      })
    })

    it('converts married couple with all fields', () => {
      const state = inputsToFormState(marriedWithKids)
      expect(state.married).toBe(true)
      expect(state.persons).toHaveLength(2)
      expect(state.persons[0].gross_cat_b).toBe('5000')
      expect(state.persons[1].nhr).toBe(true)
      expect(state.depsUnder3).toBe(1)
      expect(state.depsOver6).toBe(2)
    })

    it('handles zero gross_cat_a as empty string', () => {
      const inputs: SimulationInputs = {
        married: false,
        persons: [{ birth_year: 1990, gross_cat_a: 0, gross_cat_b: 35000 }],
        dependents_under_3: 0,
        dependents_3_to_6: 0,
        dependents_over_6: 0,
      }
      const state = inputsToFormState(inputs)
      expect(state.persons[0].gross_cat_a).toBe('')
      expect(state.persons[0].gross_cat_b).toBe('35000')
    })
  })
})
