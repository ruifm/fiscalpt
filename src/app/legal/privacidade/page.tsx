'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n'

const LAST_UPDATED = '2025-07-17'
const CONTACT_EMAIL = 'privacidade@fiscalpt.com'
const DATA_CONTROLLER = 'Rui Pedro Ferreira Marques'

export default function PrivacidadePage() {
  const t = useT()

  return (
    <article>
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t('legal.privacidade.title')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('legal.privacidade.lastUpdated', { date: LAST_UPDATED })}
        </p>
      </header>

      <div className="space-y-10 text-base leading-7 text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mb-4 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2">
        <section>
          <h2>{t('legal.privacidade.section1Title')}</h2>
          <p>
            {t('legal.privacidade.section1P1Before', { dataController: DATA_CONTROLLER })}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {CONTACT_EMAIL}
            </a>
            {t('legal.privacidade.section1P1After')}
          </p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section2Title')}</h2>
          <p>{t('legal.privacidade.section2P1')}</p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section3Title')}</h2>
          <p>
            {t('legal.privacidade.section3P1Before')}
            <strong>{t('legal.privacidade.section3P1Bold')}</strong>
            {t('legal.privacidade.section3P1After')}
          </p>
          <ul>
            <li>{t('legal.privacidade.section3Li1')}</li>
            <li>{t('legal.privacidade.section3Li2')}</li>
            <li>{t('legal.privacidade.section3Li3')}</li>
            <li>{t('legal.privacidade.section3Li4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.privacidade.section4Title')}</h2>
          <p>{t('legal.privacidade.section4P1')}</p>
          <ul>
            <li>
              <strong>{t('legal.privacidade.section4Li1Bold')}</strong>
              {t('legal.privacidade.section4Li1Text')}
            </li>
            <li>
              <strong>{t('legal.privacidade.section4Li2Bold')}</strong>
              {t('legal.privacidade.section4Li2TextBefore')}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {t('legal.privacidade.section4Li2Link')}
              </a>
              {t('legal.privacidade.section4Li2TextAfter')}
            </li>
          </ul>
        </section>

        <section>
          <h2>{t('legal.privacidade.section5Title')}</h2>
          <p>{t('legal.privacidade.section5P1')}</p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section6Title')}</h2>
          <p>
            <strong>{t('legal.privacidade.section6P1Bold')}</strong>
            {t('legal.privacidade.section6P1Text')}
          </p>
          <p>
            <strong>{t('legal.privacidade.section6P2Bold')}</strong>
            {t('legal.privacidade.section6P2Text')}
          </p>
          <p>
            <strong>{t('legal.privacidade.section6P3Bold')}</strong>
            {t('legal.privacidade.section6P3Text')}
          </p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section7Title')}</h2>
          <p>{t('legal.privacidade.section7P1')}</p>
          <ul>
            <li>
              <strong>{t('legal.privacidade.section7Li1Bold')}</strong>
              {t('legal.privacidade.section7Li1Text')}
            </li>
            <li>
              <strong>{t('legal.privacidade.section7Li2Bold')}</strong>
              {t('legal.privacidade.section7Li2Text')}
            </li>
            <li>
              <strong>{t('legal.privacidade.section7Li3Bold')}</strong>
              {t('legal.privacidade.section7Li3Text')}
            </li>
            <li>
              <strong>{t('legal.privacidade.section7Li4Bold')}</strong>
              {t('legal.privacidade.section7Li4Text')}
            </li>
            <li>
              <strong>{t('legal.privacidade.section7Li5Bold')}</strong>
              {t('legal.privacidade.section7Li5Text')}
            </li>
          </ul>
          <p>
            {t('legal.privacidade.section7P2Before')}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {CONTACT_EMAIL}
            </a>
            {t('legal.privacidade.section7P2After')}
          </p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section8Title')}</h2>
          <p>{t('legal.privacidade.section8P1')}</p>
          <ol>
            <li>{t('legal.privacidade.section8Li1')}</li>
            <li>
              {t('legal.privacidade.section8Li2Before')}
              <strong>{t('legal.privacidade.section8Li2Bold')}</strong>
              {t('legal.privacidade.section8Li2After')}
            </li>
            <li>{t('legal.privacidade.section8Li3')}</li>
            <li>{t('legal.privacidade.section8Li4')}</li>
          </ol>
        </section>

        <section>
          <h2>{t('legal.privacidade.section9Title')}</h2>
          <p>
            {t('legal.privacidade.section9P1Before')}
            <a
              href="https://www.cnpd.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t('legal.privacidade.section9P1Link')}
            </a>
            {t('legal.privacidade.section9P1After')}
          </p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section10Title')}</h2>
          <p>{t('legal.privacidade.section10P1')}</p>
        </section>

        <section>
          <h2>{t('legal.privacidade.section11Title')}</h2>
          <p>
            {t('legal.privacidade.section11P1Before')}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {CONTACT_EMAIL}
            </a>
            {t('legal.privacidade.section11P1After')}
          </p>
        </section>

        <div className="border-t pt-8 mt-12">
          <p className="text-sm text-muted-foreground">
            {t('legal.seeAlsoTerms')}{' '}
            <Link
              href="/legal/termos"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t('legal.termsLink')}
            </Link>
            .
          </p>
        </div>
      </div>
    </article>
  )
}
