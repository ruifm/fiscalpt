import pt from './pt'
import en from './en'
import type { Dictionary, Locale } from '@/lib/i18n'

export const dictionaries: Record<Locale, Dictionary> = { pt, en }
