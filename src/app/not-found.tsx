import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-8 text-xl font-bold tracking-tight hover:opacity-80">
        FiscalPT
      </Link>
      <p className="text-8xl font-bold text-primary sm:text-9xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
        Página não encontrada
      </h1>
      <p className="mt-2 text-muted-foreground">
        A página que procura não existe ou foi movida.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Voltar ao início
        </Link>
        <Link
          href="/analise"
          className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          Começar análise
        </Link>
      </div>
    </main>
  )
}
