/**
 * Extract text from a PDF file using pdfjs-dist.
 * Works in the browser.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')

  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const data = new Uint8Array(arrayBuffer)
  const doc = await pdfjsLib.getDocument({ data }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    pages.push(text)
  }

  return pages.join('\n---PAGE---\n')
}

import type { Household, Person, Dependent, ValidationIssue } from './types'

// ─── Number Parsing Helpers ──────────────────────────────────

/** Parse a Portuguese-formatted number string (e.g. "1.234,56" → 1234.56). */
function parsePtNumber(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.'))
}

/**
 * Extract all Portuguese-formatted numbers from a text segment.
 * Returns them in order of appearance.
 */
function extractNumbers(text: string): number[] {
  const matches = text.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g)
  if (!matches) return []
  return matches.map(parsePtNumber)
}

// ─── Liquidação Parser ───────────────────────────────────────

type NumericKeys<T> = Exclude<
  {
    [K in keyof T]: T[K] extends number | undefined ? K : never
  }[keyof T],
  undefined
>

export interface LiquidacaoParsed {
  nif?: string
  year?: number
  // AT form line items (Demonstração de Liquidação de IRS)
  rendimentoGlobal?: number // Line 1
  deducoesEspecificas?: number // Line 2
  perdasRecuperar?: number // Line 3
  abatimentoMinimo?: number // Line 4
  deducoesRendimento?: number // Line 5
  rendimentoColetavel?: number // Line 6
  quocienteAnosAnteriores?: number // Line 7
  rendimentosIsentosEnglobados?: number // Line 8
  rendimentosParaTaxa?: number // Line 9
  // Line 10 = Quociente familiar / taxa (info row, no value in Valores column)
  importanciaApurada?: number // Line 11
  parcelaAbater?: number // Line 12
  impostoAnosAnteriores?: number // Line 13
  impostoRendimentosIsentos?: number // Line 14
  taxaAdicional?: number // Line 15
  excessoQuocienteFamiliar?: number // Line 16
  impostoTributacoesAutonomas?: number // Line 17
  coletaTotal?: number // Line 18
  deducoesColeta?: number // Line 19
  beneficioMunicipal?: number // Line 20
  acrescimosColeta?: number // Line 21
  coletaLiquida?: number // Line 22
  pagamentosConta?: number // Line 23
  retencoesFonte?: number // Line 24
  impostosApurados?: number // Line 25
  jurosRetencaoPoupanca?: number // Line 26
  sobretaxaResultado?: number // Line 27
  jurosCompensatorios?: number // Line 28
  jurosIndemnizatorios?: number // Line 29
  // Derived values (outside the 29-line table)
  valorPagarReembolsar?: number
  taxaEfetiva?: number
  quocienteFamiliar?: number
  taxaMarginal?: number
  // Deduction breakdown (page 2)
  deducoesDependentes?: number
  deducoesGerais?: number
  deducoesSaude?: number
  deducoesEducacao?: number
  deducoesExigenciaFatura?: number
  totalDeducoes?: number
  deducaoEfetiva?: number
  // Cat B expense verification (page 2)
  catBDespesasDeclaradas?: number
  catBDespesasCalculadas?: number
  catBMinDespesas15?: number
  catBAcrescimoRendimento?: number
}

/**
 * Deterministic parser for AT "Demonstração de Liquidação de IRS" PDFs.
 *
 * The AT liquidação form has 29 numbered line items in a table with
 * "Descrição" and "Valores" columns. When pdfjs-dist extracts text,
 * the content stream order differs from the visual layout:
 *
 * 1. Two values (Lines 2-3) appear BEFORE the "Descrição Valores" header
 * 2. All description labels appear as a block
 * 3. Remaining 26 values appear: Lines 4, valor_pagar, 5-9, 11-29
 *    (Line 10 is QF info with no value in the Valores column)
 * 4. Line 1 (RENDIMENTO GLOBAL) renders LAST in the content stream
 *
 * We extract values positionally from these blocks.
 */
export function parseLiquidacaoText(text: string): LiquidacaoParsed {
  const result: LiquidacaoParsed = {}

  // NIF
  const nifMatch = text.match(/Identificação Fiscal:\s*(\d{9})/)
  if (nifMatch) result.nif = nifMatch[1]

  // Year — period line like "2023-01-01 a 2023-12-31"
  const yearMatch = text.match(/(\d{4})-01-01\s+a\s+\d{4}-12-31/)
  if (yearMatch) result.year = parseInt(yearMatch[1])

  // Taxa Efetiva
  const taxaMatch = text.match(/Taxa Efetiva de Tributação\s*-\s*([\d,]+)%/)
  if (taxaMatch) {
    result.taxaEfetiva = parsePtNumber(taxaMatch[1]) / 100
  }

  // Quociente familiar and marginal rate
  const qfMatch = text.match(/Quociente familiar\s+([\d,]+)\s+taxa\s+([\d,]+)%/)
  if (qfMatch) {
    result.quocienteFamiliar = parsePtNumber(qfMatch[1])
    result.taxaMarginal = parsePtNumber(qfMatch[2]) / 100
  }

  // ── Positional extraction of the 29-line table ─────────────
  // Block 1: Two values before "Descrição" = Lines 2, 3
  const beforeDesc = text.split('Descrição')[0] || ''
  const initValues = extractNumbers(beforeDesc)

  // Block 2: Values between last label and formula labels
  const afterLabels = text.split('Juros indemnizatórios')[1]?.split('TOTAL DO RENDIMENTO')[0] || ''
  const mainValues = extractNumbers(afterLabels)

  // Block 3: Line 1 (RENDIMENTO GLOBAL) renders last in content stream,
  // appearing after "COLETA TOTAL [...formula...]" near end of page 1
  const rgMatch = text.match(/COLETA TOTAL\s+\[.*?\]\s+(\d{1,3}(?:\.\d{3})*,\d{2})/)

  // Map initial block → Lines 2-3
  if (initValues.length >= 1) result.deducoesEspecificas = initValues[0]
  if (initValues.length >= 2) result.perdasRecuperar = initValues[1]

  // Positional mapping: array index → LiquidacaoParsed field.
  // The AT content stream renders values in this specific order.
  const MAIN_BLOCK_FIELDS: NumericKeys<LiquidacaoParsed>[] = [
    'abatimentoMinimo', // 0 — Line 4
    'valorPagarReembolsar', // 1 — not a numbered line
    'deducoesRendimento', // 2 — Line 5
    'rendimentoColetavel', // 3 — Line 6
    'quocienteAnosAnteriores', // 4 — Line 7
    'rendimentosIsentosEnglobados', // 5 — Line 8
    'rendimentosParaTaxa', // 6 — Line 9
    'importanciaApurada', // 7 — Line 11
    'parcelaAbater', // 8 — Line 12
    'impostoAnosAnteriores', // 9 — Line 13
    'impostoRendimentosIsentos', // 10 — Line 14
    'taxaAdicional', // 11 — Line 15
    'excessoQuocienteFamiliar', // 12 — Line 16
    'impostoTributacoesAutonomas', // 13 — Line 17
    'coletaTotal', // 14 — Line 18
    'deducoesColeta', // 15 — Line 19
    'beneficioMunicipal', // 16 — Line 20
    'acrescimosColeta', // 17 — Line 21
    'coletaLiquida', // 18 — Line 22
    'pagamentosConta', // 19 — Line 23
    'retencoesFonte', // 20 — Line 24
    'impostosApurados', // 21 — Line 25
    'jurosRetencaoPoupanca', // 22 — Line 26
    'sobretaxaResultado', // 23 — Line 27
    'jurosCompensatorios', // 24 — Line 28
    'jurosIndemnizatorios', // 25 — Line 29
  ]

  if (mainValues.length >= MAIN_BLOCK_FIELDS.length) {
    for (let i = 0; i < MAIN_BLOCK_FIELDS.length; i++) {
      result[MAIN_BLOCK_FIELDS[i]] = mainValues[i]
    }
  }

  // Line 1 (RENDIMENTO GLOBAL) — rendered last in content stream
  if (rgMatch) result.rendimentoGlobal = parsePtNumber(rgMatch[1])

  // ── Deduction breakdown (page 2) ──────────────────────────
  const extractDeduction = (label: string): number | undefined => {
    // Format: "Dedução <label>   <valor_despesa>   <dedução>"
    // We want the second number (the actual deduction amount)
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(
      escaped + '\\s+(\\d{1,3}(?:\\.\\d{3})*,\\d{2})\\s+(\\d{1,3}(?:\\.\\d{3})*,\\d{2})',
    )
    const m = text.match(re)
    if (m) return parsePtNumber(m[2])
    return undefined
  }

  // Deduction labels → LiquidacaoParsed field
  const DEDUCTION_FIELDS: [string, NumericKeys<LiquidacaoParsed>][] = [
    ['Dedução dependentes', 'deducoesDependentes'],
    ['Dedução despesas gerais e familiares', 'deducoesGerais'],
    ['Dedução com despesas de saúde e com seguros de saúde', 'deducoesSaude'],
    ['Dedução com despesas de educação e formação', 'deducoesEducacao'],
    ['Dedução exigência de fatura', 'deducoesExigenciaFatura'],
  ]
  for (const [label, field] of DEDUCTION_FIELDS) {
    result[field] = extractDeduction(label)
  }

  // Total deductions
  const totalDedMatch = text.match(/Total das Deduções\s*:\s+(\d{1,3}(?:\.\d{3})*,\d{2})/)
  if (totalDedMatch) result.totalDeducoes = parsePtNumber(totalDedMatch[1])

  const dedEfMatch = text.match(/Dedução Efetiva\s*:\s+(\d{1,3}(?:\.\d{3})*,\d{2})/)
  if (dedEfMatch) result.deducaoEfetiva = parsePtNumber(dedEfMatch[1])

  // Cat B expense verification
  const minDespMatch = text.match(/Valor mín\. despesas \(15% Rend\)\s+[\d.,]+\s+([\d.,]+)/)
  if (minDespMatch) result.catBMinDespesas15 = parsePtNumber(minDespMatch[1])

  const acrescimoMatch = text.match(/Acréscimo ao rendimento\s+[\d.,]+\s+([\d.,]+)/)
  if (acrescimoMatch) result.catBAcrescimoRendimento = parsePtNumber(acrescimoMatch[1])

  return result
}

// ─── Comprovativo Parser ─────────────────────────────────────

interface AnexoBEntry {
  titular: string
  nif?: string
  activityCode?: string
  cae?: string
  prestacaoServicos?: number
  vendasProdutos?: number
  outrosRendimentos?: number
  somaRendimentos?: number
  retencoesFonte?: number
}

interface AnexoSSEntry {
  titular: string
  nif?: string
  niss?: string
  prestacaoServicos?: number
  vendasMercadorias?: number
  somaRendimentos?: number
}

interface AnexoAEntry {
  titular: string
  incomeCode?: string
  nifEmployer?: string
  rendimentoBruto?: number
  retencoesIRS?: number
  contribuicoesSS?: number
  quotizacoesSindicais?: number
  irsJovem?: boolean
  irsJovemAno?: number
  irsJovemNivel?: number
}

interface AnexoJEntry {
  titular: string
  countryCode?: string
  incomeCode?: string
  rendimentoBruto?: number
  impostoEstrangeiro?: number
  retencaoFonte?: number
}

interface AnexoLEntry {
  titular: string
  nhrStatus?: boolean
  activityCode?: string
  nifEmployer?: string
  incomeCode?: string
  rendimento?: number
  foreignCountry?: string
  foreignRendimento?: number
  foreignTax?: number
}

export interface ComprovativoParsed {
  nif?: string
  nifConjuge?: string
  year?: number
  filingStatus?: 'single' | 'married_joint' | 'married_separate'
  tributacaoConjunta?: boolean
  dependentNifs?: string[]
  ascendantNifs?: string[]
  anexoA?: AnexoAEntry[]
  anexoB?: AnexoBEntry[]
  anexoSS?: AnexoSSEntry[]
  anexoJ?: AnexoJEntry[]
  anexoL?: AnexoLEntry[]
  anexoCounts?: Record<string, number>
  issues: ValidationIssue[]
}

/**
 * Deterministic parser for AT "Comprovativo de Entrega da Declaração Modelo 3 de IRS" PDFs.
 *
 * The comprovativo contains the full declaration as submitted to AT.
 * Text layout is structured by quadros (sections) with field codes.
 * Values (X marks, numbers, NIFs) appear at the end of each page section.
 */
export function parseComprovativoPdfText(text: string): ComprovativoParsed {
  const result: ComprovativoParsed = { issues: [] }

  // ── Identification ──────────────────────────────────────────
  // Year and NIF from the footer: "Comprovativo Mod.3 IRS: NIF / YEAR / ..."
  // Some years use "Declaração Automática Mod.3 IRS:" instead of "Comprovativo Mod.3 IRS:"
  const footerMatch = text.match(/Mod\.3 IRS:\s*(\d{9})\s*\/\s*(\d{4})/)
  if (footerMatch) {
    result.nif = footerMatch[1]
    result.year = parseInt(footerMatch[2])
  }

  // ── Filing Status (Quadro 4 + 5) ───────────────────────────
  // Detect civil status from text markers
  const isMarried = /\bCasado\b/i.test(text) || /\bUnido de facto\b/i.test(text)

  // Parse NIF do cônjuge from the structured data
  // After the form fields, NIFs appear as 9-digit sequences
  const page1 = text.split('---PAGE---')[0] || text
  const nifsOnPage1 = page1.match(/\b\d{9}\b/g) || []

  if (result.nif && nifsOnPage1.length >= 2) {
    // Find the second distinct NIF (cônjuge)
    const distinctNifs = [...new Set(nifsOnPage1)].filter((n) => n !== result.nif)
    if (distinctNifs.length > 0) {
      result.nifConjuge = distinctNifs[0]
    }
  }

  // Look for dependent NIFs — they follow the cônjuge NIF on page 1
  if (result.nif && result.nifConjuge) {
    const afterConjuge = page1.substring(page1.lastIndexOf(result.nifConjuge) + 9)
    const depNifs = afterConjuge.match(/\b\d{9}\b/g) || []
    // Filter out the main NIF, cônjuge NIF, and validation code
    result.dependentNifs = [
      ...new Set(depNifs.filter((n) => n !== result.nif && n !== result.nifConjuge)),
    ]
  } else if (result.nif) {
    // Single filer — look for dependent NIFs after the main NIF
    const afterNif = page1.substring(page1.indexOf(result.nif) + 9)
    const depNifs = afterNif.match(/\b\d{9}\b/g) || []
    result.dependentNifs = [...new Set(depNifs.filter((n) => n !== result.nif))]
  }

  // Determine filing status
  if (result.nifConjuge) {
    // Parse Quadro 5: "OPÇÃO PELA TRIBUTAÇÃO CONJUNTA DOS RENDIMENTOS"
    // The PDF text contains: "...tributação conjunta dos rendimentos: Sim 01 [X] Não 02 [X]"
    // Sim marked = joint filing; Não marked = separate filing.
    const conjuntaIdx = page1.toLowerCase().indexOf('tributação conjunta')
    if (conjuntaIdx >= 0) {
      // Look at the first Sim/Não answer after the heading (within 500 chars)
      const chunk = page1.substring(conjuntaIdx, conjuntaIdx + 500)
      const simMarked = /Sim\s+\d+\s+X\b/i.test(chunk)
      const naoMarked = /N[ãa]o\s+\d+\s+X\b/i.test(chunk)
      if (simMarked && !naoMarked) {
        result.tributacaoConjunta = true
        result.filingStatus = 'married_joint'
      } else {
        // Não marked, or ambiguous → separate (safer default)
        result.tributacaoConjunta = false
        result.filingStatus = 'married_separate'
      }
    } else {
      // Can't find tributação conjunta section — default to separate
      result.tributacaoConjunta = false
      result.filingStatus = 'married_separate'
    }
  } else if (isMarried) {
    // Married but no cônjuge NIF found — filing preference is unknown,
    // the questionnaire will ask. Default to separate (safer assumption).
    result.tributacaoConjunta = false
    result.filingStatus = 'married_separate'
  } else {
    result.filingStatus = 'single'
  }

  // ── Anexo Counts (Quadro 12) ───────────────────────────────
  // Look for the Anexo list section
  const anexoCountMatch = text.match(
    /Anexo\s+A\s+Anexo\s+B[\s\S]*?(?:Anexo\s+SS)([\s\S]*?)(?:PRAZOS|Comprovativo)/,
  )
  if (anexoCountMatch) {
    const countBlock = anexoCountMatch[0]
    const counts = countBlock.match(/\d+/g)
    if (counts) {
      const ANEXO_NAMES = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'G1',
        'H',
        'I',
        'J',
        'L',
        'Outros',
        'SS',
      ]
      result.anexoCounts = {}
      const lastNumbers = counts.slice(-ANEXO_NAMES.length)
      for (let i = 0; i < Math.min(lastNumbers.length, ANEXO_NAMES.length); i++) {
        const c = parseInt(lastNumbers[i])
        if (c > 0) {
          result.anexoCounts[ANEXO_NAMES[i]] = c
        }
      }
    }
  }

  // ── Anexo A (Cat A/H employment income) ─────────────────────
  const anexoAPages = text
    .split('---PAGE---')
    .filter((p) => p.includes('Anexo A') && /CATEGORIAS?\s*A(?:\s*\/\s*H)?/i.test(p))
  if (anexoAPages.length > 0) {
    result.anexoA = []
    for (const page of anexoAPages) {
      const entry: AnexoAEntry = {
        titular: 'A',
      }

      // Titular: match NIF against holder/spouse
      const nifMatches = page.match(/\b\d{9}\b/g) || []
      const titularNif = nifMatches.find((n) => n === result.nif || n === result.nifConjuge)
      if (titularNif) {
        entry.titular = titularNif === result.nif ? 'A' : 'B'
      }

      // Metadata: try structured tail (single-employer: year NIF empNIF code AB)
      const tailMatch = page.match(/(\d{4})\s+(\d{9})\s+(\d{9})\s+(\d{3})\s+([AB])/)
      if (tailMatch) {
        entry.nifEmployer = tailMatch[3]
        entry.incomeCode = tailMatch[4]
      } else {
        // Fallback: first 3-digit code before A/B titular letter
        const codeMatch = page.match(/\b(\d{3})\s+[AB]\b/)
        if (codeMatch) entry.incomeCode = codeMatch[1]
      }

      // Amounts: prefer summary row (last 5 numbers on real PDFs), fall back
      // to positional for synthetic/minimal pages.
      // Real Anexo A pages always end with: [gross, wh, ss, sobretaxa, sindical]
      // This works for both single and multi-employer pages.
      const numbers = extractNumbers(page)
      if (numbers.length >= 5) {
        const summary = numbers.slice(-5)
        entry.rendimentoBruto = summary[0]
        entry.retencoesIRS = summary[1]
        entry.contribuicoesSS = summary[2]
        // summary[3] = retenção da sobretaxa (not stored)
        entry.quotizacoesSindicais = summary[4]
      } else if (numbers.length >= 4) {
        entry.rendimentoBruto = numbers[0]
        entry.retencoesIRS = numbers[1]
        entry.contribuicoesSS = numbers[2]
        entry.quotizacoesSindicais = numbers[3]
      } else {
        if (numbers.length >= 1) entry.rendimentoBruto = numbers[0]
        if (numbers.length >= 2) entry.retencoesIRS = numbers[1]
        if (numbers.length >= 3) entry.contribuicoesSS = numbers[2]
      }

      // IRS Jovem: code 417 or explicit "IRS Jovem ano X" marker
      if (entry.incomeCode === '417') {
        entry.irsJovem = true
      }
      const jovemMatch = page.match(/IRS\s*Jovem\s+ano\s+(\d{1,2})/i)
      if (jovemMatch) {
        entry.irsJovem = true
        entry.irsJovemAno = parseInt(jovemMatch[1])
      }

      result.anexoA.push(entry)
    }
  }

  // ── Anexo B (Cat B income) ─────────────────────────────────
  // Look for Anexo B pages
  const anexoBMatch = text.match(
    /Anexo B[\s\S]*?RENDIMENTOS.*?CATEGORIA B[\s\S]*?(?=(?:Comprovativo|Declara\u00e7\u00e3o Autom\u00e1tica) Mod\.3)/g,
  )
  if (anexoBMatch) {
    result.anexoB = []
    for (const block of anexoBMatch) {
      const entry: AnexoBEntry = {
        titular: 'A',
      }

      // Titular NIF
      const titNifMatch = block.match(/NIF do titular\s+[\s\S]*?(\d{9})/)
      if (titNifMatch) {
        entry.nif = titNifMatch[1]
        entry.titular = entry.nif === result.nif ? 'A' : 'B'
      }

      // Activity code
      const actMatch = block.match(/(?:art\.º 151|atividades)[\s\S]*?(\d{4})\b/)
      if (actMatch) entry.activityCode = actMatch[1]

      // Extract income amounts — look for the SOMA values
      // The block ends with numbers before the footer
      const numbers = extractNumbers(block)
      if (numbers.length >= 2) {
        // In Anexo B, the last numbers before the footer are:
        // SOMA rendimentos profissionais, SOMA rendimentos agrícolas, total
        entry.somaRendimentos = numbers.find((n) => n > 0) || 0
      }

      // Specific field: Prestações de serviços (campo 403/404)
      const prestMatch = block.match(
        /(?:Prestações de serviços|Rendimento das atividades)[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/,
      )
      if (prestMatch) entry.prestacaoServicos = parsePtNumber(prestMatch[1])

      // Retenções na fonte
      const retMatch = block.match(/Retenções na fonte[\s\S]*?(\d{1,3}(?:\.\d{3})*,\d{2})/)
      if (retMatch) entry.retencoesFonte = parsePtNumber(retMatch[1])

      result.anexoB.push(entry)
    }
  }

  // ── Anexo B: simpler extraction from the known value positions ─
  // The comprovativo text for Anexo B has values at the end of each page.
  // e.g. "X X 2024 100000001 X 100000001 1332 X 60.148,51 60.148,51 0,00 0,00"
  if (!result.anexoB || result.anexoB.length === 0) {
    const anexoBPages = text
      .split('---PAGE---')
      .filter((p) => p.includes('Anexo B') && p.includes('CATEGORIA B'))
    if (anexoBPages.length > 0) {
      result.anexoB = []
      for (const page of anexoBPages) {
        const entry: AnexoBEntry = {
          titular: 'A',
        }

        // Find NIF and activity code near end of page
        const nifMatches = page.match(/\b\d{9}\b/g) || []
        const titularNif = nifMatches.find((n) => n === result.nif || n === result.nifConjuge)
        if (titularNif) {
          entry.nif = titularNif
          entry.titular = titularNif === result.nif ? 'A' : 'B'
        }

        // Activity code (4-digit number after NIF)
        const actCodeMatch = page.match(/\b(\d{4})\b(?=\s+X)/)
        if (actCodeMatch) entry.activityCode = actCodeMatch[1]

        // Income values at end of page
        const numbers = extractNumbers(page)
        // Filter to meaningful amounts (> 0)
        const amounts = numbers.filter((n) => n > 0)
        if (amounts.length > 0) {
          entry.somaRendimentos = amounts[0] // First significant amount
          entry.prestacaoServicos = amounts[0]
        }

        result.anexoB.push(entry)
      }
    }
  }

  // ── Anexo J (Foreign income) ─────────────────────────────────
  const anexoJPages = text
    .split('---PAGE---')
    .filter(
      (p) => p.includes('Anexo J') && /ESTRANGEIRO/i.test(p) && !/Anexo\s+A\s+Anexo\s+B/.test(p),
    )
  if (anexoJPages.length > 0) {
    result.anexoJ = []
    for (const page of anexoJPages) {
      const entry: AnexoJEntry = { titular: 'A' }

      const footerIdx = page.lastIndexOf('Comprovativo')
      const tailData = footerIdx > 0 ? page.substring(0, footerIdx) : page

      // Determine titular from NIF
      const nifMatches = tailData.match(/\b\d{9}\b/g) || []
      const titularNif = nifMatches.find((n) => n === result.nif || n === result.nifConjuge)
      if (titularNif) {
        entry.titular = titularNif === result.nif ? 'A' : 'B'
      }

      // Country code and income code: NIF NIF countryCode incomeCode
      const codeMatch = tailData.match(/\d{9}\s+\d{9}\s+(\d{3})\s+(\d{3})/)
      if (codeMatch) {
        entry.countryCode = codeMatch[1]
        entry.incomeCode = codeMatch[2]
      }

      // Amounts: gross, foreignTax, retention (first three Portuguese numbers)
      const numbers = extractNumbers(tailData)
      if (numbers.length >= 1) entry.rendimentoBruto = numbers[0]
      if (numbers.length >= 2) entry.impostoEstrangeiro = numbers[1]
      if (numbers.length >= 3) entry.retencaoFonte = numbers[2]

      result.anexoJ.push(entry)
    }
  }

  // ── Anexo L (NHR / Residente Não Habitual) ─────────────────
  const anexoLPages = text
    .split('---PAGE---')
    .filter((p) => p.includes('Anexo L') && /HABITUAL/i.test(p) && !/Anexo\s+A\s+Anexo\s+B/.test(p))
  if (anexoLPages.length > 0) {
    result.anexoL = []
    for (const page of anexoLPages) {
      const entry: AnexoLEntry = { titular: 'A' }

      const footerIdx = page.lastIndexOf('Comprovativo')
      const tailData = footerIdx > 0 ? page.substring(0, footerIdx) : page

      // Determine titular from NIF
      const nifMatches = tailData.match(/\b\d{9}\b/g) || []
      const titularNif = nifMatches.find((n) => n === result.nif || n === result.nifConjuge)
      if (titularNif) {
        entry.titular = titularNif === result.nif ? 'A' : 'B'
      }

      // NHR status: X after NIF pair
      entry.nhrStatus = /\d{9}\s+\d{9}\s+X\b/.test(tailData)

      // Employer NIF: 9-digit after NIF X pattern
      const empMatch = tailData.match(/\d{9}\s+X\s+(\d{9})/)
      if (empMatch) entry.nifEmployer = empMatch[1]

      // Income code and activity code: 3-digit code followed by 4-digit.1-digit
      const codeMatch = tailData.match(/(\d{3})\s+(\d{4}\.\d)/)
      if (codeMatch) {
        entry.incomeCode = codeMatch[1]
        entry.activityCode = codeMatch[2]
      }

      // Domestic income: first Portuguese-formatted number
      const numbers = extractNumbers(tailData)
      if (numbers.length >= 1) entry.rendimento = numbers[0]

      // Foreign income: titular letter + country code + amounts near end
      const foreignMatch = tailData.match(
        /[AB]\s+(\d{3})\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})/,
      )
      if (foreignMatch) {
        entry.foreignCountry = foreignMatch[1]
        entry.foreignRendimento = parsePtNumber(foreignMatch[2])
        entry.foreignTax = parsePtNumber(foreignMatch[3])
      }

      result.anexoL.push(entry)
    }
  }

  // ── Anexo SS (Social Security) ─────────────────────────────
  const anexoSSPages = text
    .split('---PAGE---')
    .filter((p) => p.includes('ANEXO SS') || (p.includes('Anexo SS') && p.includes('CATEGORIA B')))
  if (anexoSSPages.length > 0) {
    result.anexoSS = []
    for (const page of anexoSSPages) {
      const entry: AnexoSSEntry = {
        titular: 'A',
      }

      // NISS (11-digit social security number)
      const nissMatch = page.match(/\b(\d{11})\b/)
      if (nissMatch) entry.niss = nissMatch[1]

      // NIF
      const nifMatches = page.match(/\b\d{9}\b/g) || []
      const titularNif = nifMatches.find((n) => n === result.nif || n === result.nifConjuge)
      if (titularNif) {
        entry.nif = titularNif
        entry.titular = titularNif === result.nif ? 'A' : 'B'
      }

      // Income amounts
      const numbers = extractNumbers(page)
      const amounts = numbers.filter((n) => n > 0)
      if (amounts.length > 0) {
        entry.somaRendimentos = amounts[0]
        entry.prestacaoServicos = amounts[0]
      }

      result.anexoSS.push(entry)
    }
  }

  // ── Unsupported Anexo Detection ──────────────────────────────
  const UNSUPPORTED_PDF_ANEXOS = ['E', 'F', 'G', 'H'] as const
  const PDF_SUPPORTED_ANEXOS = ['A', 'B', 'J', 'L', 'SS'] as const

  if (result.anexoCounts) {
    for (const anexo of UNSUPPORTED_PDF_ANEXOS) {
      if (result.anexoCounts[anexo] && result.anexoCounts[anexo] > 0) {
        result.issues.push({
          severity: 'error',
          code: 'UNSUPPORTED_ANEXO',
          message: `O Anexo ${anexo} foi detetado no comprovativo mas não é suportado na extração de PDF. Utilize o ficheiro XML do Modelo 3 para uma análise completa.`,
        })
      }
    }

    // Validate that supported annexes with declared count actually extracted data
    for (const anexo of PDF_SUPPORTED_ANEXOS) {
      if (result.anexoCounts[anexo] && result.anexoCounts[anexo] > 0) {
        const hasData =
          (anexo === 'A' && result.anexoA && result.anexoA.length > 0) ||
          (anexo === 'B' && result.anexoB && result.anexoB.length > 0) ||
          (anexo === 'J' && result.anexoJ && result.anexoJ.length > 0) ||
          (anexo === 'L' && result.anexoL && result.anexoL.length > 0) ||
          (anexo === 'SS' && result.anexoSS && result.anexoSS.length > 0)
        if (!hasData) {
          result.issues.push({
            severity: 'error',
            code: 'PARSE_FAILED',
            message: `O Anexo ${anexo} foi declarado no comprovativo mas não foi possível extrair os dados. Utilize o ficheiro XML.`,
          })
        }
      }
    }
  }

  return result
}

/**
 * Build a partial Household from parsed comprovativo data.
 * This converts the raw parsed values into the domain model.
 */
export function comprativoParsedToHousehold(parsed: ComprovativoParsed): {
  household: Partial<Household>
  issues: ValidationIssue[]
} {
  const issues: ValidationIssue[] = [...parsed.issues]

  function buildMember(titular: string, name: string): Person {
    const person: Person = { name, incomes: [], deductions: [], special_regimes: [] }

    // Anexo A → Cat A income
    const anexoAEntries = parsed.anexoA?.filter((a) => a.titular === titular) || []
    for (const a of anexoAEntries) {
      if (a.rendimentoBruto && a.rendimentoBruto > 0) {
        person.incomes.push({
          category: 'A',
          gross: a.rendimentoBruto,
          withholding: a.retencoesIRS || 0,
          ss_paid: a.contribuicoesSS || 0,
          cat_a_code: a.incomeCode ? parseInt(a.incomeCode) : undefined,
        })

        // Union dues → sindical deduction (same as XML parser)
        if (a.quotizacoesSindicais && a.quotizacoesSindicais > 0) {
          person.deductions.push({
            category: 'sindical',
            amount: a.quotizacoesSindicais,
          })
        }
      }
      if (a.irsJovem) {
        if (!person.special_regimes.includes('irs_jovem')) {
          person.special_regimes.push('irs_jovem')
        }
        if (a.irsJovemAno) person.irs_jovem_year = a.irsJovemAno
      }
    }

    // Anexo J → Cat A foreign income
    const anexoJEntries = parsed.anexoJ?.filter((j) => j.titular === titular) || []
    for (const j of anexoJEntries) {
      if (j.rendimentoBruto && j.rendimentoBruto > 0) {
        person.incomes.push({
          category: 'A',
          gross: j.rendimentoBruto,
          withholding: j.retencaoFonte || 0,
          country_code: j.countryCode,
          foreign_tax_paid: j.impostoEstrangeiro || 0,
        })
      }
    }

    // Anexo L → NHR detection
    const anexoLEntries = parsed.anexoL?.filter((l) => l.titular === titular) || []
    for (const l of anexoLEntries) {
      if (l.nhrStatus && !person.special_regimes.includes('nhr')) {
        person.special_regimes.push('nhr')
        person.nhr_confirmed = true
      }
    }

    // Anexo B → Cat B income
    const anexoBEntries = parsed.anexoB?.filter((b) => b.titular === titular) || []
    for (const b of anexoBEntries) {
      if (b.somaRendimentos && b.somaRendimentos > 0) {
        person.incomes.push({
          category: 'B',
          gross: b.somaRendimentos,
          withholding: b.retencoesFonte || 0,
          cat_b_regime: 'simplified',
          cat_b_activity_code: b.activityCode,
          cat_b_cae: b.cae,
        })
      }
    }

    return person
  }

  const members: Person[] = [buildMember('A', 'Sujeito Passivo A')]
  if (parsed.nifConjuge) {
    members.push(buildMember('B', 'Sujeito Passivo B'))
  }

  const dependents: Dependent[] = (parsed.dependentNifs || []).map((_nif, i) => ({
    name: `Dependente ${i + 1}`,
    // PDF doesn't contain birth years — default to age 10 (standard €600
    // deduction, no special benefits). Questionnaire lets user override.
    birth_year: (parsed.year ?? new Date().getFullYear()) - 10,
  }))

  return {
    household: {
      year: parsed.year,
      filing_status: parsed.filingStatus || 'single',
      members,
      dependents,
    },
    issues,
  }
}

// ─── Liquidação Cross-Validation ─────────────────────────────

import type { ScenarioResult } from './types'

export interface LiquidacaoValidation {
  isValid: boolean
  issues: ValidationIssue[]
  comparison: {
    field: string
    expected: number
    actual: number
    difference: number
    withinTolerance: boolean
  }[]
}

// Thresholds for reporting liquidação mismatches to users.
// Below these, differences are noise (rounding, minor deduction gaps).
const LIQUIDACAO_IRS_THRESHOLD = 500 // €500
const LIQUIDACAO_RATE_THRESHOLD = 0.1 // 10 percentage points

/**
 * Cross-validate our tax calculation against AT's official liquidação.
 * Only surfaces differences above meaningful thresholds (€500 IRS or 10pp rate).
 * Returns issues with 'info' severity — these are informational, not errors.
 */
export function validateAgainstLiquidacao(
  liquidacao: LiquidacaoParsed,
  scenarioResult: ScenarioResult,
  personIndex?: number,
): LiquidacaoValidation {
  const issues: ValidationIssue[] = []
  const comparison: LiquidacaoValidation['comparison'] = []

  // When personIndex is provided, compare against that specific person's data
  // (used for separate filing where liquidação is per-person).
  const persons =
    personIndex != null ? [scenarioResult.persons[personIndex]] : scenarioResult.persons

  if (liquidacao.rendimentoGlobal != null) {
    // AT's rendimento global (Line 1) = total income after specific deductions,
    // but BEFORE IRS Jovem deduction (Line 5 "Deduções ao Rendimento").
    // Engine's total_taxable is AFTER IRS Jovem exemption, so we must add it back.
    const engineRendimentoGlobal = persons.reduce(
      (sum, p) => sum + p.taxable_income + p.irs_jovem_exemption,
      0,
    )
    const diff = Math.abs(liquidacao.rendimentoGlobal - engineRendimentoGlobal)
    comparison.push({
      field: 'Rendimento Global',
      expected: liquidacao.rendimentoGlobal,
      actual: engineRendimentoGlobal,
      difference: diff,
      withinTolerance: diff <= LIQUIDACAO_IRS_THRESHOLD,
    })
  }

  if (liquidacao.coletaTotal != null) {
    // AT's Coleta Total (Line 18) is the GROSS coleta — sum of bracket tax,
    // autonomous taxation, solidarity surcharge — BEFORE deductions (tax credits).
    // Engine equivalent: irs_before_deductions + autonomous_tax + solidarity_surcharge + nhr_tax
    const engineColeta = persons.reduce(
      (sum, p) =>
        sum + p.irs_before_deductions + p.autonomous_tax + p.solidarity_surcharge + p.nhr_tax,
      0,
    )
    const diff = Math.abs(liquidacao.coletaTotal - engineColeta)
    comparison.push({
      field: 'Coleta Total',
      expected: liquidacao.coletaTotal,
      actual: engineColeta,
      difference: diff,
      withinTolerance: diff <= LIQUIDACAO_IRS_THRESHOLD,
    })
    if (diff > LIQUIDACAO_IRS_THRESHOLD) {
      issues.push({
        severity: 'info',
        code: 'LIQUIDACAO_MISMATCH',
        message: `Diferença de ${diff.toFixed(0)}€ no IRS face à liquidação AT (calculado: ${engineColeta.toFixed(2)}€, oficial: ${liquidacao.coletaTotal.toFixed(2)}€).`,
      })
    }
  }

  if (liquidacao.taxaEfetiva != null) {
    const calculatedRate =
      personIndex != null ? persons[0].effective_rate_irs : scenarioResult.effective_rate_irs
    const diff = Math.abs(liquidacao.taxaEfetiva - calculatedRate)
    comparison.push({
      field: 'Taxa Efetiva',
      expected: liquidacao.taxaEfetiva,
      actual: calculatedRate,
      difference: diff,
      withinTolerance: diff <= LIQUIDACAO_RATE_THRESHOLD,
    })
    if (diff > LIQUIDACAO_RATE_THRESHOLD) {
      issues.push({
        severity: 'info',
        code: 'LIQUIDACAO_MISMATCH',
        message: `Diferença de ${(diff * 100).toFixed(1)}pp na taxa efetiva face à liquidação AT (calculada: ${(calculatedRate * 100).toFixed(2)}%, oficial: ${(liquidacao.taxaEfetiva * 100).toFixed(2)}%).`,
      })
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    comparison,
  }
}

// ─── Document Type Detection ─────────────────────────────────

export type DocumentType = 'xml_modelo3' | 'pdf_liquidacao' | 'pdf_comprovativo' | 'unknown'

export function detectDocumentType(filename: string, textContent?: string): DocumentType {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.xml')) {
    return 'xml_modelo3'
  }
  if (lower.includes('demonstracaoliquidacao') || lower.includes('liquidacao')) {
    return 'pdf_liquidacao'
  }
  if (lower.includes('comprovativo')) {
    return 'pdf_comprovativo'
  }

  if (textContent) {
    if (
      textContent.includes('Modelo3IRS') ||
      textContent.includes('AnexoA') ||
      textContent.includes('AnexoB')
    ) {
      return 'xml_modelo3'
    }
    if (textContent.includes('Demonstração de Liquidação')) {
      return 'pdf_liquidacao'
    }
    if (textContent.includes('Comprovativo de Entrega')) {
      return 'pdf_comprovativo'
    }
  }

  return 'unknown'
}
