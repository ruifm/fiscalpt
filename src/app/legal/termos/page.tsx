'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

const LAST_UPDATED = '2025-07-17'
const CONTACT_EMAIL = 'legal@fiscalpt.com'

export default function TermosPage() {
  const t = useT()

  return (
    <article>
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('legal.termos.title')}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('legal.termos.lastUpdated', { date: LAST_UPDATED })}
        </p>
      </header>

      <div className="space-y-10 text-base leading-7 text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mb-4 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2">
        <section>
          <h2>{t('legal.termos.section1Title')}</h2>
          <p>{t('legal.termos.section1P1')}</p>
          <p>
            <strong>{t('legal.termos.section1P2Bold')}</strong> {t('legal.termos.section1P2After')}
          </p>
        </section>

        <section>
          <h2>{t('legal.termos.section2Title')}</h2>
          <p>{t('legal.termos.section2P1')}</p>
          <ul>
            <li>{t('legal.termos.section2Li1')}</li>
            <li>{t('legal.termos.section2Li2')}</li>
            <li>{t('legal.termos.section2Li3')}</li>
            <li>{t('legal.termos.section2Li4')}</li>
            <li>{t('legal.termos.section2Li5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.termos.section3Title')}</h2>
          <p>{t('legal.termos.section3P1')}</p>
          <ul>
            <li>{t('legal.termos.section3Li1')}</li>
            <li>{t('legal.termos.section3Li2')}</li>
            <li>{t('legal.termos.section3Li3')}</li>
            <li>{t('legal.termos.section3Li4')}</li>
          </ul>
          <p>
            <strong>{t('legal.termos.section3P2Bold')}</strong>
          </p>
        </section>

        <section>
          <h2>{t('legal.termos.section4Title')}</h2>
          <p>
            {t('legal.termos.section4P1Before')}
            <strong>{t('legal.termos.section4P1Bold')}</strong>
            {t('legal.termos.section4P1After')}
          </p>
          <p>
            {t('legal.termos.section4P2Before')}
            <Link
              href="/legal/privacidade"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t('legal.privacyLink')}
            </Link>
            {t('legal.termos.section4P2After')}
          </p>
        </section>

        <section>
          <h2>{t('legal.termos.section5Title')}</h2>
          <p>{t('legal.termos.section5P1')}</p>
        </section>

        <section>
          <h2>{t('legal.termos.section6Title')}</h2>
          <p>
            {t('legal.termos.section6P1Before')}
            <strong>{t('legal.termos.section6P1Bold')}</strong>
            {t('legal.termos.section6P1After')}
          </p>
          <p>{t('legal.termos.section6P2')}</p>
        </section>

        <section>
          <h2>{t('legal.termos.section7Title')}</h2>
          <p>{t('legal.termos.section7P1')}</p>
        </section>

        <section>
          <h2>{t('legal.termos.section8Title')}</h2>
          <p>{t('legal.termos.section8P1')}</p>
        </section>

        <section>
          <h2>{t('legal.termos.section9Title')}</h2>
          <p>
            {t('legal.termos.section9P1Before')}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {CONTACT_EMAIL}
            </a>
            {t('legal.termos.section9P1After')}
          </p>
        </section>
      </div>
    </article>
  )
}
