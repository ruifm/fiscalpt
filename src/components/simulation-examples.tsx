'use client'

import { Briefcase, Users, GraduationCap, FileText, UserPlus } from 'lucide-react'
import { useT } from '@/lib/i18n'
import type { SimulationFormState, PersonFormState } from '@/components/simulation-form'
import { DEFAULT_PERSON } from '@/components/simulation-form'
import { cn } from '@/lib/utils'

interface SimulationExamplesProps {
  onSelect: (state: SimulationFormState) => void
}

function person(overrides: Partial<PersonFormState>): PersonFormState {
  return { ...DEFAULT_PERSON, ...overrides }
}

const EXAMPLES: Array<{
  key: string
  icon: typeof Briefcase
  state: SimulationFormState
}> = [
  {
    key: 'employee',
    icon: Briefcase,
    state: {
      married: false,
      persons: [person({ birth_year: '1994', gross_cat_a: '25000' })],
      depsUnder3: 0,
      deps3to6: 0,
      depsOver6: 0,
    },
  },
  {
    key: 'coupleKids',
    icon: Users,
    state: {
      married: true,
      persons: [
        person({ birth_year: '1990', gross_cat_a: '30000' }),
        person({ birth_year: '1992', gross_cat_a: '22000' }),
      ],
      depsUnder3: 0,
      deps3to6: 1,
      depsOver6: 1,
    },
  },
  {
    key: 'irsJovem',
    icon: GraduationCap,
    state: {
      married: false,
      persons: [person({ birth_year: '1999', gross_cat_a: '20000' })],
      depsUnder3: 0,
      deps3to6: 0,
      depsOver6: 0,
    },
  },
  {
    key: 'selfEmployed',
    icon: FileText,
    state: {
      married: false,
      persons: [person({ birth_year: '1989', gross_cat_b: '35000' })],
      depsUnder3: 0,
      deps3to6: 0,
      depsOver6: 0,
    },
  },
  {
    key: 'mixedCouple',
    icon: UserPlus,
    state: {
      married: true,
      persons: [
        person({ birth_year: '1991', gross_cat_a: '28000' }),
        person({ birth_year: '1993', gross_cat_b: '18000' }),
      ],
      depsUnder3: 0,
      deps3to6: 0,
      depsOver6: 1,
    },
  },
]

export function SimulationExamples({ onSelect }: SimulationExamplesProps) {
  const t = useT()

  return (
    <div className="mb-6">
      <p className="mb-3 text-center text-sm text-muted-foreground">
        {t('simulation.examplesLabel')}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2 sm:justify-center">
        {EXAMPLES.map((ex) => {
          const Icon = ex.icon
          return (
            <button
              key={ex.key}
              type="button"
              onClick={() => onSelect(ex.state)}
              className={cn(
                'flex min-w-[140px] shrink-0 flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5',
                'bg-card text-card-foreground transition-colors',
                'hover:border-primary/50 hover:bg-accent',
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium leading-tight">
                {t(`simulation.example_${ex.key}`)}
              </span>
              <span className="text-[10px] leading-tight text-muted-foreground">
                {t(`simulation.example_${ex.key}_desc`)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
