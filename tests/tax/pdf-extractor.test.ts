import { describe, it, expect } from 'vitest'
import {
  parseLiquidacaoText,
  parseComprovativoPdfText,
  comprativoParsedToHousehold,
  detectDocumentType,
} from '@/lib/tax/pdf-extractor'

// ─── Real PDF text samples (extracted via pdfjs-dist) ────────

const LIQUIDACAO_2023_SP_A = `Demonstração de Liquidação de IRS  100000001   2024.5001987654   2023-01-01 a 2023-12-31  Sujeito Passivo   Número de Liquidação   Período de Rendimentos  4.104,00 0,00  Descrição   Valores  Deduções Específicas Perdas a recuperar Abatimento por mínimo de existência Deduções ao rendimento Quociente rendimentos anos anteriores Rendimentos isentos englobados para determinação da Taxa  RENDIMENTO GLOBAL  Parcela a Abater Imposto correspondente a rendimentos anos anteriores Imposto correspondente a rendimentos isentos Excesso em relação ao limite do quociente familiar Acréscimos à coleta Pagamentos por conta Juros de retenção-poupança Sobretaxa-resultado Juros compensatórios Juros indemnizatórios  0,00  9.214,68  0,00  45.279,39  0,00 0,00  45.279,39 20.375,73  5.713,58 0,00 0,00 0,00 0,00 0,00  14.662,15  642,45 490,69 0,00  13.529,01  0,00 4.314,33  9.214,68  0,00 0,00 0,00 0,00  TOTAL DO RENDIMENTO PARA DETERMINAÇÃO DA TAXA (6 + 8 - 7) RENDIMENTO COLETÁVEL (1 - (2 + 3 + 4 + 5)) IMPORTÂNCIA APURADA (9 : COEF x TAXA)  Imposto relativo a tributações autónomas Deduções à coleta  COLETA LÍQUIDA (18 - 19 - 20 (>=0) + 21)  Retenções na fonte  IMPOSTOS APURADOS (22 - (23 + 24)) Informação Adicional  2.636,10  1  2 3 4 5  6  7 8  9  10  11  12 13 14 15 16 17  18  19 20 21  22  23 24  25  26 27 28 29 Identificação Fiscal: 100000001  Total de Perdas a Reportar Consignação do Imposto Valor Consignado: Valor Consignado de IVA:  0,00 Identificação Fiscal: 500000002 67,64 0,00  Sobretaxa  Deduções = 0,00 Ret. Fonte Resultado 0,00 0,00 0,00  Quociente familiar   1,00   taxa 45,000% Taxa adicional (0,00 x 0,0% + 0,00 x 0%) x 1,00  Valor a pagar  Benefício Municipal   (3,50% da coleta)  COLETA TOTAL   [(11-12)x(1,00)+13-14+15+16+17] 48.849,87 Montante de cada pagamento por conta a efetuar durante o ano de 2025  Base   0,00 * 0,000 % Taxa Efetiva de Tributação - 29,88% de 2 Página 1
Demonstração de Liquidação de IRS  Deduções à Coleta   Valor Despesa   Dedução  Dedução dependentes   0,00   363,00 Dedução despesas gerais e familiares   6.936,44   250,00 Dedução com despesas de saúde e com seguros de saúde   846,51   98,44 Dedução com despesas de educação e formação   71,34   10,70  Total das Deduções :   642,45  Total das Deduções sujeitas a limite (art 78) :   109,14  Limite :   0,00  Dedução Efetiva :   642,45  Verificação das despesas da categoria B  NIF 100000001   Despesas Declaradas   Despesas Calculadas  Contribuições (Seg. Social)   0,00   4.104,00 Outras despesas   1.270,42   1.270,42 Total de despesas   0,00   4.840,90 Valor mín. despesas (15% Rend)   0,00   6.370,29 Acréscimo ao rendimento   0,00   1.529,39`

const LIQUIDACAO_2023_SP_B = `Demonstração de Liquidação de IRS  100000002   2024.4006234567   2023-01-01 a 2023-12-31  Sujeito Passivo   Número de Liquidação   Período de Rendimentos  0,00 0,00  Descrição   Valores  Deduções Específicas Perdas a recuperar Abatimento por mínimo de existência Deduções ao rendimento Quociente rendimentos anos anteriores Rendimentos isentos englobados para determinação da Taxa  RENDIMENTO GLOBAL  Parcela a Abater Imposto correspondente a rendimentos anos anteriores Imposto correspondente a rendimentos isentos Excesso em relação ao limite do quociente familiar Acréscimos à coleta Pagamentos por conta Juros de retenção-poupança Sobretaxa-resultado Juros compensatórios Juros indemnizatórios  0,00  1.276,58  0,00  0,00  0,00 0,00  0,00 0,00  0,00 0,00 0,00 0,00 0,00 9.408,07  9.408,07  0,00 0,00 0,00  9.408,07  0,00 10.665,33  1.257,26  19,32 0,00 0,00 0,00  TOTAL DO RENDIMENTO PARA DETERMINAÇÃO DA TAXA (6 + 8 - 7) RENDIMENTO COLETÁVEL (1 - (2 + 3 + 4 + 5)) IMPORTÂNCIA APURADA (9 : COEF x TAXA)  Imposto relativo a tributações autónomas Deduções à coleta  COLETA LÍQUIDA (18 - 19 - 20 (>=0) + 21)  Retenções na fonte  IMPOSTOS APURADOS (22 - (23 + 24)) Informação Adicional  0,00  1  2 3 4 5  6  7 8  9  10  11  12 13 14 15 16 17  18  19 20 21  22  23 24  25  26 27 28 29 Identificação Fiscal: 100000002  Total de Perdas a Reportar Consignação do Imposto Valor Consignado: Valor Consignado de IVA:  0,00 Identificação Fiscal: 500000002 47,04 0,00  Sobretaxa  Deduções = 0,00 Ret. Fonte Resultado 0,00 0,00 0,00  Quociente familiar   1,00   taxa 14,500% Taxa adicional (0,00 x 0,0% + 0,00 x 0%) x 1,00  Valor a reembolsar  Benefício Municipal   (3,50% da coleta)  COLETA TOTAL   [(11-12)x(1,00)+13-14+15+16+17] 0,00 Montante de cada pagamento por conta a efetuar durante o ano de 2025  Base   0,00 * 0,000 % Taxa Efetiva de Tributação - 20,00% de 2 Página 1
Demonstração de Liquidação de IRS  Deduções à Coleta   Valor Despesa   Dedução  Dedução despesas gerais e familiares   4.570,61   0,00 Dedução com despesas de saúde e com seguros de saúde   825,23   0,00 Dedução exigência de fatura   160,98   0,00  Total das Deduções :   0,00  Total das Deduções sujeitas a limite (art 78) :   0,00  Limite :   0,00  Dedução Efetiva :   0,00`

const LIQUIDACAO_2021_SP_A = `Demonstração de Liquidação de IRS  100000001   2022.4003456789   2021-01-01 a 2021-12-31  Sujeito Passivo   Número de Liquidação   Período de Rendimentos  4.104,00 0,00  Descrição   Valores  Deduções Específicas Perdas a recuperar Abatimento por mínimo de existência Deduções ao rendimento Quociente rendimentos anos anteriores Rendimentos isentos englobados para determinação da Taxa  RENDIMENTO GLOBAL  Parcela a Abater Imposto correspondente a rendimentos anos anteriores Imposto correspondente a rendimentos isentos Excesso em relação ao limite do quociente familiar Acréscimos à coleta Pagamentos por conta Juros de retenção-poupança Sobretaxa-resultado Juros compensatórios Juros indemnizatórios  0,00  1.598,56  0,00  10.439,88  0,00 0,00  10.439,88 2.975,37  1.039,47 0,00 0,00 0,00 0,00 0,00  1.935,90  341,73 39,85 0,00  1.554,32  0,00 3.152,88  1.598,56  0,00 0,00 0,00 0,00  TOTAL DO RENDIMENTO PARA DETERMINAÇÃO DA TAXA (6 + 8 - 7) RENDIMENTO COLETÁVEL (1 - (2 + 3 + 4 + 5)) IMPORTÂNCIA APURADA (9 : COEF x TAXA)  Imposto relativo a tributações autónomas Deduções à coleta  COLETA LÍQUIDA (18 - 19 - 20 (>=0) + 21)  Retenções na fonte  IMPOSTOS APURADOS (22 - (23 + 24)) Informação Adicional  0,00  1  2 3 4 5  6  7 8  9  10  11  12 13 14 15 16 17  18  19 20 21  22  23 24  25  26 27 28 29 Identificação Fiscal: 100000001  Total de Perdas a Reportar Consignação do Imposto Valor Consignado: Valor Consignado de IVA:  0,00 Identificação Fiscal: 500000002 7,77 0,00  Sobretaxa  Deduções = 0,00 Ret. Fonte Resultado 0,00 0,00 0,00  Quociente familiar   1,00   taxa 28,500% Taxa adicional (0,00 x 0,0% + 0,00 x 0%) x 1,00  Valor a reembolsar  Benefício Municipal   (2,50% da coleta)  COLETA TOTAL   [(11-12)x(1,00)+13-14+15+16+17] 14.010,36 Montante de cada pagamento por conta a efetuar durante o ano de 2023  Base   0,00 * 0,000 % Taxa Efetiva de Tributação - 14,89% de 2 Página 1
Demonstração de Liquidação de IRS  Deduções à Coleta   Valor Despesa   Dedução  Dedução despesas gerais e familiares   14.071,01   250,00 Dedução com despesas de saúde e com seguros de saúde   225,92   33,89 Dedução com despesas de educação e formação   153,28   45,98 Dedução exigência de fatura   283,15   44,35  Total das Deduções :   341,73  Total das Deduções sujeitas a limite (art 78) :   124,23  Limite :   0,00  Dedução Efetiva :   341,73`

const LIQUIDACAO_2024_PUBLIC = `Demonstração de Liquidação de IRS  203542100   2025.4002847135   2024-01-01 a 2024-12-31  Sujeito Passivo   Número de Liquidação   Período de Rendimentos  4.350,24 0,00  Descrição   Valores  Deduções Específicas Perdas a recuperar Abatimento por mínimo de existência Deduções ao rendimento Quociente rendimentos anos anteriores Rendimentos isentos englobados para determinação da Taxa  RENDIMENTO GLOBAL  Parcela a Abater Imposto correspondente a rendimentos anos anteriores Imposto correspondente a rendimentos isentos Excesso em relação ao limite do quociente familiar Acréscimos à coleta Pagamentos por conta Juros de retenção-poupança Sobretaxa-resultado Juros compensatórios Juros indemnizatórios  5.206,68  0,00  0,00  1.923,07  0,00 0,00  1.923,07 250,00  0,00 0,00 0,00 0,00 0,00 0,00  250,00  250,00 0,00 0,00  0,00  0,00 0,00  0,00  0,00 0,00 0,00 0,00  TOTAL DO RENDIMENTO PARA DETERMINAÇÃO DA TAXA (6 + 8 - 7) RENDIMENTO COLETÁVEL (1 - (2 + 3 + 4 + 5)) IMPORTÂNCIA APURADA (9 : COEF x TAXA)  Imposto relativo a tributações autónomas Deduções à coleta  COLETA LÍQUIDA (18 - 19 - 20 (>=0) + 21)  Retenções na fonte  IMPOSTOS APURADOS (22 - (23 + 24)) Informação Adicional  0,00  1  2 3 4 5  6  7 8  9  10  11  12 13 14 15 16 17  18  19 20 21  22  23 24  25  26 27 28 29 Identificação Fiscal: 203542100  Total de Perdas a Reportar   0,00  Sobretaxa  Deduções = 0,00 Ret. Fonte Resultado 0,00 0,00 0,00  Quociente familiar   1,00   taxa 13,000% Taxa adicional (0,00 x 0,0% + 0,00 x 0%) x 1,00  Valor apurado  Benefício Municipal   (0,00% da coleta)  COLETA TOTAL   [(11-12)x(1,00)+13-14+15+16+17] 11.480,00 Montante de cada pagamento por conta a efetuar durante o ano de 2026  Base   0,00 * 0,000 % Taxa Efetiva de Tributação -   0,00% de 2 Página 1 E-balcão -   www.portaldasfinancas.gov.pt   Centro de Atendimento Telefónico (+351) 217 206 707
Demonstração de Liquidação de IRS  Deduções à Coleta   Valor Despesa   Dedução  Dedução despesas gerais e familiares   3.509,57   250,00 Dedução com despesas de saúde e com seguros de saúde   27,26   0,00  Total das Deduções :   250,00  Total das Deduções sujeitas a limite (art 78) :   0,00  Limite :   0,00  Dedução Efetiva :   250,00  E-balcão -   www.portaldasfinancas.gov.pt   Centro de Atendimento Telefónico (+351) 217 206 707 Página 2 de 2`

// ─── Liquidação Parser Tests ─────────────────────────────────

describe('parseLiquidacaoText', () => {
  describe('SP-A 2023 liquidação', () => {
    const parsed = parseLiquidacaoText(LIQUIDACAO_2023_SP_A)

    it('extracts NIF', () => {
      expect(parsed.nif).toBe('100000001')
    })

    it('extracts year', () => {
      expect(parsed.year).toBe(2023)
    })

    it('extracts taxa efetiva', () => {
      expect(parsed.taxaEfetiva).toBeCloseTo(0.2988, 4)
    })

    it('extracts quociente familiar and marginal rate', () => {
      expect(parsed.quocienteFamiliar).toBe(1)
      expect(parsed.taxaMarginal).toBeCloseTo(0.45, 2)
    })

    it('extracts deduções específicas', () => {
      expect(parsed.deducoesEspecificas).toBe(4104)
    })

    it('extracts rendimento global (Line 1)', () => {
      expect(parsed.rendimentoGlobal).toBe(48849.87)
    })

    it('extracts rendimento coletável (Line 6)', () => {
      expect(parsed.rendimentoColetavel).toBe(45279.39)
    })

    it('extracts importância apurada', () => {
      expect(parsed.importanciaApurada).toBe(20375.73)
    })

    it('extracts parcela a abater', () => {
      expect(parsed.parcelaAbater).toBe(5713.58)
    })

    it('extracts coleta total (Line 18)', () => {
      expect(parsed.coletaTotal).toBe(14662.15)
    })

    it('extracts coleta líquida', () => {
      expect(parsed.coletaLiquida).toBe(13529.01)
    })

    it('extracts retenções na fonte', () => {
      expect(parsed.retencoesFonte).toBe(4314.33)
    })

    it('extracts deduções à coleta', () => {
      expect(parsed.deducoesColeta).toBe(642.45)
    })

    it('extracts benefício municipal', () => {
      expect(parsed.beneficioMunicipal).toBe(490.69)
    })

    it('extracts impostos apurados', () => {
      expect(parsed.impostosApurados).toBe(9214.68)
    })

    it('extracts valor a pagar', () => {
      expect(parsed.valorPagarReembolsar).toBe(9214.68)
    })

    it('extracts deduction breakdown', () => {
      expect(parsed.deducoesDependentes).toBe(363)
      expect(parsed.deducoesGerais).toBe(250)
      expect(parsed.deducoesSaude).toBeCloseTo(98.44, 2)
      expect(parsed.deducoesEducacao).toBeCloseTo(10.7, 2)
    })

    it('extracts total deduções and dedução efetiva', () => {
      expect(parsed.totalDeducoes).toBe(642.45)
      expect(parsed.deducaoEfetiva).toBe(642.45)
    })

    it('extracts Cat B expense verification', () => {
      expect(parsed.catBMinDespesas15).toBe(6370.29)
      expect(parsed.catBAcrescimoRendimento).toBe(1529.39)
    })
  })

  describe('SP-B 2023 liquidação (Cat A, mínimo de existência)', () => {
    const parsed = parseLiquidacaoText(LIQUIDACAO_2023_SP_B)

    it('extracts NIF', () => {
      expect(parsed.nif).toBe('100000002')
    })

    it('extracts year', () => {
      expect(parsed.year).toBe(2023)
    })

    it('extracts taxa efetiva (20%)', () => {
      expect(parsed.taxaEfetiva).toBeCloseTo(0.2, 4)
    })

    it('extracts quociente familiar and rate', () => {
      expect(parsed.quocienteFamiliar).toBe(1)
      expect(parsed.taxaMarginal).toBeCloseTo(0.145, 3)
    })

    it('extracts zero deduções específicas', () => {
      expect(parsed.deducoesEspecificas).toBe(0)
    })

    it('extracts retenções na fonte', () => {
      expect(parsed.retencoesFonte).toBe(10665.33)
    })

    it('extracts tributações autónomas (NHR flat tax)', () => {
      expect(parsed.impostoTributacoesAutonomas).toBe(9408.07)
    })

    it('extracts coleta total', () => {
      expect(parsed.coletaTotal).toBe(9408.07)
    })

    it('extracts coleta líquida', () => {
      expect(parsed.coletaLiquida).toBe(9408.07)
    })

    it('extracts impostos apurados (refund)', () => {
      expect(parsed.impostosApurados).toBeCloseTo(1257.26, 2)
    })

    it('extracts deduction breakdown (all zero)', () => {
      expect(parsed.deducoesGerais).toBe(0)
      expect(parsed.deducoesSaude).toBe(0)
      expect(parsed.deducoesExigenciaFatura).toBe(0)
    })

    it('extracts total deduções (zero)', () => {
      expect(parsed.totalDeducoes).toBe(0)
      expect(parsed.deducaoEfetiva).toBe(0)
    })
  })

  describe('SP-A 2021 liquidação', () => {
    const parsed = parseLiquidacaoText(LIQUIDACAO_2021_SP_A)

    it('extracts correct year', () => {
      expect(parsed.year).toBe(2021)
    })

    it('extracts taxa efetiva (14.89%)', () => {
      expect(parsed.taxaEfetiva).toBeCloseTo(0.1489, 4)
    })

    it('extracts marginal rate (28.5%)', () => {
      expect(parsed.taxaMarginal).toBeCloseTo(0.285, 3)
    })

    it('extracts deduction breakdown', () => {
      expect(parsed.deducoesGerais).toBe(250)
      expect(parsed.deducoesSaude).toBeCloseTo(33.89, 2)
      expect(parsed.deducoesEducacao).toBeCloseTo(45.98, 2)
      expect(parsed.deducoesExigenciaFatura).toBeCloseTo(44.35, 2)
    })

    it('extracts retenções na fonte', () => {
      expect(parsed.retencoesFonte).toBe(3152.88)
    })

    it('extracts deduções específicas', () => {
      expect(parsed.deducoesEspecificas).toBe(4104)
    })

    it('extracts rendimento global (Line 1)', () => {
      expect(parsed.rendimentoGlobal).toBe(14010.36)
    })

    it('extracts rendimento coletável', () => {
      expect(parsed.rendimentoColetavel).toBe(10439.88)
    })

    it('extracts coleta total', () => {
      expect(parsed.coletaTotal).toBe(1935.9)
    })

    it('extracts impostos apurados', () => {
      expect(parsed.impostosApurados).toBeCloseTo(1598.56, 2)
    })
  })

  describe('Public 2024 liquidação (NIF 203542100, low income with mínimo de existência)', () => {
    const parsed = parseLiquidacaoText(LIQUIDACAO_2024_PUBLIC)

    it('extracts NIF', () => {
      expect(parsed.nif).toBe('203542100')
    })

    it('extracts year', () => {
      expect(parsed.year).toBe(2024)
    })

    it('extracts deduções específicas', () => {
      expect(parsed.deducoesEspecificas).toBe(4350.24)
    })

    it('extracts abatimento mínimo de existência', () => {
      expect(parsed.abatimentoMinimo).toBe(5206.68)
    })

    it('extracts rendimento coletável', () => {
      expect(parsed.rendimentoColetavel).toBe(1923.07)
    })

    it('extracts rendimento global (Line 1)', () => {
      expect(parsed.rendimentoGlobal).toBe(11480)
    })

    it('extracts taxa marginal (13%)', () => {
      expect(parsed.taxaMarginal).toBeCloseTo(0.13, 2)
    })

    it('extracts taxa efetiva (0%)', () => {
      expect(parsed.taxaEfetiva).toBeCloseTo(0, 4)
    })

    it('extracts importância apurada', () => {
      expect(parsed.importanciaApurada).toBe(250)
    })

    it('extracts parcela a abater', () => {
      expect(parsed.parcelaAbater).toBe(0)
    })

    it('extracts coleta total', () => {
      expect(parsed.coletaTotal).toBe(250)
    })

    it('extracts deduções à coleta', () => {
      expect(parsed.deducoesColeta).toBe(250)
    })

    it('extracts coleta líquida (zero — fully offset by deductions)', () => {
      expect(parsed.coletaLiquida).toBe(0)
    })

    it('extracts retenções na fonte (zero)', () => {
      expect(parsed.retencoesFonte).toBe(0)
    })

    it('extracts impostos apurados (zero)', () => {
      expect(parsed.impostosApurados).toBe(0)
    })

    it('extracts deduction breakdown', () => {
      expect(parsed.deducoesGerais).toBe(250)
      expect(parsed.deducoesSaude).toBe(0)
    })

    it('extracts total deduções and dedução efetiva', () => {
      expect(parsed.totalDeducoes).toBe(250)
      expect(parsed.deducaoEfetiva).toBe(250)
    })
  })
})

// ─── Comprovativo Parser Tests ───────────────────────────────

// Simplified comprovativo text based on real 2024 SP-A comprovativo
const COMPROVATIVO_2024_SP_A = `ESTADO CIVIL DO SUJEITO PASSIVO Casado AGREGADO FAMILIAR CONTRIBUINTE EXEMPLO 100000001 X X 100000002 100000003 100000004 Comprovativo Mod.3 IRS: 100000001 / 2024 / 2847-K0392-15 Página 1 de 8
---PAGE---
REEMBOLSO POR TRANSFERÊNCIA BANCÁRIA X PT50002300004562932157094 X X X 501597565 X X 1 1 Comprovativo Mod.3 IRS: 100000001 / 2024 / 2847-K0392-15 Página 2 de 8
---PAGE---
RENDIMENTOS DA CATEGORIA B REGIME SIMPLIFICADO Anexo B DECLARAÇÃO DE RENDIMENTOS - IRS NIF do titular 100000001 1332 X 52.329,20 52.329,20 0,00 0,00 Comprovativo Mod.3 IRS: 100000001 / 2024 / 2847-K0392-15 Página 3 de 8
---PAGE---
RENDIMENTOS DA CATEGORIA B REGIME SIMPLIFICADO Prestações de serviços X X 0,00 0,00 X Comprovativo Mod.3 IRS: 100000001 / 2024 / 2847-K0392-15 Página 4 de 8
---PAGE---
SOMA X X X 52.329,20 42.468,62 52.329,20 42.468,62 0,00 Comprovativo Mod.3 IRS: 100000001 / 2024 / 2847-K0392-15 Página 5 de 8
---PAGE---
Anexo SS CATEGORIA B RENDIMENTOS 100000001 99900000001 52.329,20 52.329,20 0,00 X 1 52.329,20 Comprovativo Mod.3 IRS: 100000001 / 2024 / 2847-K0392-15 Página 8 de 8`

describe('parseComprovativoPdfText', () => {
  describe('SP-A 2024 comprovativo', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)

    it('extracts NIF', () => {
      expect(parsed.nif).toBe('100000001')
    })

    it('extracts year', () => {
      expect(parsed.year).toBe(2024)
    })

    it('detects cônjuge NIF', () => {
      expect(parsed.nifConjuge).toBe('100000002')
    })

    it('detects married filing status', () => {
      expect(parsed.filingStatus).toBe('married_joint')
    })

    it('detects dependents', () => {
      expect(parsed.dependentNifs).toBeDefined()
      expect(parsed.dependentNifs!.length).toBeGreaterThanOrEqual(1)
    })

    it('extracts Anexo B data', () => {
      expect(parsed.anexoB).toBeDefined()
      expect(parsed.anexoB!.length).toBeGreaterThan(0)
      const b = parsed.anexoB![0]
      expect(b.somaRendimentos).toBe(52329.2)
    })

    it('extracts Anexo SS data', () => {
      expect(parsed.anexoSS).toBeDefined()
      expect(parsed.anexoSS!.length).toBeGreaterThan(0)
      expect(parsed.anexoSS![0].somaRendimentos).toBe(52329.2)
    })
  })

  describe('Anexo A parsing', () => {
    it('extracts Cat A income from single filer', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_CAT_A)
      expect(parsed.anexoA).toBeDefined()
      expect(parsed.anexoA!.length).toBe(1)
      expect(parsed.anexoA![0].titular).toBe('A')
      expect(parsed.anexoA![0].rendimentoBruto).toBe(35000)
      expect(parsed.anexoA![0].retencoesIRS).toBe(4200)
      expect(parsed.anexoA![0].contribuicoesSS).toBe(3850)
    })

    it('extracts Cat A income for both spouses', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_MIXED)
      expect(parsed.anexoA).toBeDefined()
      expect(parsed.anexoA!.length).toBe(2)

      const spA = parsed.anexoA!.find((a) => a.titular === 'A')
      const spB = parsed.anexoA!.find((a) => a.titular === 'B')
      expect(spA).toBeDefined()
      expect(spA!.rendimentoBruto).toBe(28000)
      expect(spB).toBeDefined()
      expect(spB!.rendimentoBruto).toBe(22000)
    })

    it('detects IRS Jovem in Anexo A', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_IRS_JOVEM)
      expect(parsed.anexoA).toBeDefined()
      expect(parsed.anexoA!.length).toBe(1)
      expect(parsed.anexoA![0].irsJovem).toBe(true)
      expect(parsed.anexoA![0].irsJovemAno).toBe(3)
    })

    it('returns no Anexo A for Cat-B-only comprovativo', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)
      expect(parsed.anexoA).toBeUndefined()
    })
  })

  describe('Anexo A with real tail data format', () => {
    it('extracts income code and employer NIF from tail', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_CAT_A_MARRIED)
      expect(parsed.anexoA).toBeDefined()
      expect(parsed.anexoA!.length).toBe(1)
      const a = parsed.anexoA![0]
      expect(a.titular).toBe('A')
      expect(a.incomeCode).toBe('401')
      expect(a.nifEmployer).toBe('500000003')
      expect(a.rendimentoBruto).toBe(28718.38)
      expect(a.retencoesIRS).toBe(6801.66)
      expect(a.contribuicoesSS).toBe(3159.12)
    })

    it('does not falsely detect IRS Jovem from section header', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_CAT_A_MARRIED)
      const a = parsed.anexoA![0]
      expect(a.irsJovem).toBeFalsy()
    })

    it('extracts income code and employer NIF from Anexo J companion page', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_ANEXO_J)
      expect(parsed.anexoA).toBeDefined()
      expect(parsed.anexoA!.length).toBe(1)
      const a = parsed.anexoA![0]
      expect(a.incomeCode).toBe('401')
      expect(a.nifEmployer).toBe('500000001')
      expect(a.rendimentoBruto).toBe(27496.97)
      expect(a.retencoesIRS).toBe(5498.1)
      expect(a.contribuicoesSS).toBe(3024.67)
    })
  })

  describe('Anexo J parsing (foreign income)', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_ANEXO_J)

    it('detects Anexo J entries', () => {
      expect(parsed.anexoJ).toBeDefined()
      expect(parsed.anexoJ!.length).toBe(1)
    })

    it('extracts titular', () => {
      expect(parsed.anexoJ![0].titular).toBe('A')
    })

    it('extracts country code', () => {
      expect(parsed.anexoJ![0].countryCode).toBe('616')
    })

    it('extracts income code', () => {
      expect(parsed.anexoJ![0].incomeCode).toBe('401')
    })

    it('extracts rendimento bruto', () => {
      expect(parsed.anexoJ![0].rendimentoBruto).toBe(10762.5)
    })

    it('extracts imposto estrangeiro (foreign tax paid)', () => {
      expect(parsed.anexoJ![0].impostoEstrangeiro).toBe(799.5)
    })

    it('extracts retenção na fonte', () => {
      expect(parsed.anexoJ![0].retencaoFonte).toBe(1005.02)
    })

    it('does not detect Anexo J when not present', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)
      expect(parsed.anexoJ).toBeUndefined()
    })
  })

  describe('Anexo L parsing (NHR detection)', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_ANEXO_L)

    it('detects Anexo L entries', () => {
      expect(parsed.anexoL).toBeDefined()
      expect(parsed.anexoL!.length).toBe(1)
    })

    it('detects NHR status', () => {
      expect(parsed.anexoL![0].nhrStatus).toBe(true)
    })

    it('extracts titular', () => {
      expect(parsed.anexoL![0].titular).toBe('A')
    })

    it('extracts employer NIF', () => {
      expect(parsed.anexoL![0].nifEmployer).toBe('500000001')
    })

    it('extracts income code', () => {
      expect(parsed.anexoL![0].incomeCode).toBe('401')
    })

    it('extracts activity code', () => {
      expect(parsed.anexoL![0].activityCode).toBe('2512.0')
    })

    it('extracts domestic rendimento', () => {
      expect(parsed.anexoL![0].rendimento).toBe(27496.97)
    })

    it('extracts foreign country code', () => {
      expect(parsed.anexoL![0].foreignCountry).toBe('724')
    })

    it('extracts foreign rendimento', () => {
      expect(parsed.anexoL![0].foreignRendimento).toBe(10762.5)
    })

    it('extracts foreign tax paid', () => {
      expect(parsed.anexoL![0].foreignTax).toBe(1005.02)
    })

    it('does not detect Anexo L when not present', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)
      expect(parsed.anexoL).toBeUndefined()
    })
  })

  describe('married_separate filing detection', () => {
    it('detects married_separate when only 1 X between NIFs', () => {
      const parsed = parseComprovativoPdfText(COMPROVATIVO_MARRIED_SEPARATE)
      expect(parsed.filingStatus).toBe('married_separate')
      expect(parsed.tributacaoConjunta).toBe(false)
      expect(parsed.nifConjuge).toBe('333444555')
    })
  })
})

// ─── Comprovativo to Household Conversion ────────────────────

// Comprovativo with Cat A employment income
const COMPROVATIVO_CAT_A = `ESTADO CIVIL DO SUJEITO PASSIVO Solteiro AGREGADO FAMILIAR MARIA SILVA 111222333 Comprovativo Mod.3 IRS: 111222333 / 2025 / ABC-D0001-01 Página 1 de 4
---PAGE---
Anexo A CATEGORIA A 111222333 35.000,00 4.200,00 3.850,00 Comprovativo Mod.3 IRS: 111222333 / 2025 / ABC-D0001-01 Página 2 de 4`

// Comprovativo with both Cat A and Cat B (mixed income)
const COMPROVATIVO_MIXED = `ESTADO CIVIL DO SUJEITO PASSIVO Casado AGREGADO FAMILIAR JOAO SANTOS 222333444 X X 333444555 Comprovativo Mod.3 IRS: 222333444 / 2025 / XYZ-A0001-01 Página 1 de 6
---PAGE---
Anexo A CATEGORIA A 222333444 28.000,00 3.360,00 3.080,00 Comprovativo Mod.3 IRS: 222333444 / 2025 / XYZ-A0001-01 Página 2 de 6
---PAGE---
Anexo A CATEGORIA A 333444555 22.000,00 2.640,00 2.420,00 Comprovativo Mod.3 IRS: 222333444 / 2025 / XYZ-A0001-01 Página 3 de 6
---PAGE---
Anexo B CATEGORIA B 222333444 1332 X 15.000,00 15.000,00 0,00 0,00 Comprovativo Mod.3 IRS: 222333444 / 2025 / XYZ-A0001-01 Página 4 de 6`

// Comprovativo with IRS Jovem marker in Anexo A
const COMPROVATIVO_IRS_JOVEM = `ESTADO CIVIL DO SUJEITO PASSIVO Solteiro AGREGADO FAMILIAR ANA COSTA 444555666 Comprovativo Mod.3 IRS: 444555666 / 2025 / IJ-B0001-01 Página 1 de 4
---PAGE---
Anexo A CATEGORIA A 444555666 IRS Jovem ano 3 25.000,00 3.000,00 2.750,00 Comprovativo Mod.3 IRS: 444555666 / 2025 / IJ-B0001-01 Página 2 of 4`

// Real-format Anexo A with CATEGORIAS A / H header, tail data with employer NIF and income code
const COMPROVATIVO_CAT_A_MARRIED = `ESTADO CIVIL DO SUJEITO PASSIVO Casado AGREGADO FAMILIAR CONTRIBUINTE EXEMPLO 100000001 X X 100000002 100000003 Comprovativo Mod.3 IRS: 100000001 / 2022 / 4912-L7834-28 Página 1 de 4
---PAGE---
Anexo A CATEGORIAS A / H OPÇÃO PELO REGIME FISCAL DO ART.º 12.º-B DO CIRS - IRS JOVEM 2022 100000001 500000003 401 A 28.718,38 6.801,66 3.159,12 0,00 28.718,38 6.801,66 3.159,12 0,00 0,00 Comprovativo da entrega da Declaração Automática Mod.3 IRS: 100000001 / 2022 / 4912-L7834-28 Página 3 de 4`

// Comprovativo with Anexo J (foreign income)
const COMPROVATIVO_ANEXO_J = `ESTADO CIVIL DO SUJEITO PASSIVO Casado AGREGADO FAMILIAR 100000002 X X 100000001 Comprovativo Mod.3 IRS: 100000002 / 2021 / 4912-M2856-73 Página 1 de 10
---PAGE---
Anexo A CATEGORIAS A / H 2021 100000002 500000001 401 A 27.496,97 5.498,10 3.024,67 0,00 27.496,97 5.498,10 3.024,67 0,00 0,00 Comprovativo Mod.3 IRS: 100000002 / 2021 / 4912-M2856-73 Página 3 de 10
---PAGE---
RENDIMENTOS OBTIDOS NO ESTRANGEIRO Anexo J RENDIMENTOS DE TRABALHO DEPENDENTE (CATEGORIA A) 01 2021 100000002 100000002 616 401 A02 724 10.762,50 799,50 1.005,02 10.762,50 799,50 1.005,02 0,00 0,00 Comprovativo Mod.3 IRS: 100000002 / 2021 / 4912-M2856-73 Página 5 de 10`

// Comprovativo with Anexo L (NHR status)
const COMPROVATIVO_ANEXO_L = `ESTADO CIVIL DO SUJEITO PASSIVO Casado AGREGADO FAMILIAR 100000002 X X 100000001 Comprovativo Mod.3 IRS: 100000002 / 2021 / 4912-M2856-73 Página 1 de 10
---PAGE---
RESIDENTE NÃO HABITUAL Anexo L ATIVIDADES DE ELEVADO VALOR ACRESCENTADO 2021 100000002 100000002 X 500000001 401 2512.0 27.496,97 Q4A 401 2512.0 A 724 10.762,50 1.005,02 Comprovativo Mod.3 IRS: 100000002 / 2021 / 4912-M2856-73 Página 9 de 10`

// Married but filing separately (only 1 X between NIFs)
const COMPROVATIVO_MARRIED_SEPARATE = `ESTADO CIVIL DO SUJEITO PASSIVO Casado AGREGADO FAMILIAR 222333444 X 333444555 Comprovativo Mod.3 IRS: 222333444 / 2024 / SEP-A0001-01 Página 1 de 2`

describe('comprativoParsedToHousehold', () => {
  it('builds household from married comprovativo with Cat B income', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)
    const { household, issues } = comprativoParsedToHousehold(parsed)

    expect(household.year).toBe(2024)
    expect(household.filing_status).toBe('married_joint')
    expect(household.members).toBeDefined()
    expect(household.members!.length).toBe(2) // SP A + SP B

    // SP A should have Cat B income
    const memberA = household.members![0]
    expect(memberA.name).toBe('Sujeito Passivo A')
    expect(memberA.incomes.length).toBeGreaterThan(0)
    expect(memberA.incomes[0].category).toBe('B')
    expect(memberA.incomes[0].gross).toBe(52329.2)

    // Should have dependents
    expect(household.dependents!.length).toBeGreaterThanOrEqual(1)

    // Should not warn about dependent birth years — questionnaire handles it
    expect(issues.some((i) => i.code === 'MISSING_BIRTH_YEARS')).toBe(false)
  })

  it('builds single-filer household', () => {
    const singleText = `Solteiro NIF 123456789 Comprovativo Mod.3 IRS: 123456789 / 2024 / ABC
---PAGE---
Anexo B CATEGORIA B 123456789 1332 X 30.000,00 30.000,00 Comprovativo Mod.3 IRS: 123456789 / 2024 / ABC`

    const parsed = parseComprovativoPdfText(singleText)
    const { household } = comprativoParsedToHousehold(parsed)

    expect(household.filing_status).toBe('single')
    expect(household.members!.length).toBe(1)
  })

  it('builds household from Cat A comprovativo', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_CAT_A)
    const { household } = comprativoParsedToHousehold(parsed)

    expect(household.year).toBe(2025)
    expect(household.filing_status).toBe('single')
    expect(household.members!.length).toBe(1)

    const member = household.members![0]
    expect(member.name).toBe('Sujeito Passivo A')
    expect(member.incomes.length).toBe(1)
    expect(member.incomes[0].category).toBe('A')
    expect(member.incomes[0].gross).toBe(35000)
    expect(member.incomes[0].withholding).toBe(4200)
    expect(member.incomes[0].ss_paid).toBe(3850)
  })

  it('builds household with mixed Cat A + Cat B income', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_MIXED)
    const { household } = comprativoParsedToHousehold(parsed)

    expect(household.year).toBe(2025)
    expect(household.filing_status).toBe('married_joint')
    expect(household.members!.length).toBe(2)

    // SP A: Cat A + Cat B
    const memberA = household.members![0]
    expect(memberA.incomes.length).toBe(2)
    const catA = memberA.incomes.find((i) => i.category === 'A')
    const catB = memberA.incomes.find((i) => i.category === 'B')
    expect(catA).toBeDefined()
    expect(catA!.gross).toBe(28000)
    expect(catA!.withholding).toBe(3360)
    expect(catA!.ss_paid).toBe(3080)
    expect(catB).toBeDefined()
    expect(catB!.gross).toBe(15000)

    // SP B: Cat A only
    const memberB = household.members![1]
    expect(memberB.incomes.length).toBe(1)
    expect(memberB.incomes[0].category).toBe('A')
    expect(memberB.incomes[0].gross).toBe(22000)
    expect(memberB.incomes[0].withholding).toBe(2640)
    expect(memberB.incomes[0].ss_paid).toBe(2420)
  })

  it('detects IRS Jovem from Cat A comprovativo', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_IRS_JOVEM)
    const { household } = comprativoParsedToHousehold(parsed)

    const member = household.members![0]
    expect(member.special_regimes).toContain('irs_jovem')
    expect(member.irs_jovem_year).toBe(3)
  })

  it('handles comprovativo with no income anexos', () => {
    const emptyText = `Solteiro NIF 999888777 Comprovativo Mod.3 IRS: 999888777 / 2025 / ABC`
    const parsed = parseComprovativoPdfText(emptyText)
    const { household } = comprativoParsedToHousehold(parsed)

    expect(household.members!.length).toBe(1)
    expect(household.members![0].incomes.length).toBe(0)
  })

  it('does not add zero-value Anexo A income', () => {
    const zeroText = `Solteiro NIF 888777666 Comprovativo Mod.3 IRS: 888777666 / 2025 / ABC
---PAGE---
Anexo A CATEGORIA A 888777666 0,00 0,00 0,00 Comprovativo Mod.3 IRS: 888777666 / 2025 / ABC`
    const parsed = parseComprovativoPdfText(zeroText)
    const { household } = comprativoParsedToHousehold(parsed)

    expect(household.members![0].incomes.length).toBe(0)
  })

  it('maps cat_a_code from real Anexo A income code', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_CAT_A_MARRIED)
    const { household } = comprativoParsedToHousehold(parsed)

    const member = household.members![0]
    expect(member.incomes.length).toBe(1)
    expect(member.incomes[0].category).toBe('A')
    expect(member.incomes[0].cat_a_code).toBe(401)
    expect(member.incomes[0].gross).toBe(28718.38)
  })

  it('builds household with Anexo J foreign income', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_ANEXO_J)
    const { household } = comprativoParsedToHousehold(parsed)

    const memberA = household.members![0]
    // Should have both domestic Cat A and foreign Cat A income
    const domesticIncome = memberA.incomes.find((i) => i.category === 'A' && !i.country_code)
    const foreignIncome = memberA.incomes.find((i) => i.category === 'A' && i.country_code)

    expect(domesticIncome).toBeDefined()
    expect(domesticIncome!.gross).toBe(27496.97)

    expect(foreignIncome).toBeDefined()
    expect(foreignIncome!.gross).toBe(10762.5)
    expect(foreignIncome!.country_code).toBe('616')
    expect(foreignIncome!.foreign_tax_paid).toBe(799.5)
  })

  it('detects NHR from Anexo L in household', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_ANEXO_L)
    const { household } = comprativoParsedToHousehold(parsed)

    const memberA = household.members![0]
    expect(memberA.special_regimes).toContain('nhr')
  })
})

// ─── Document Type Detection ─────────────────────────────────

describe('detectDocumentType', () => {
  it('detects XML by extension', () => {
    expect(detectDocumentType('file.xml')).toBe('xml_modelo3')
  })

  it('detects XML decl-m3', () => {
    expect(detectDocumentType('decl-m3-2024.xml')).toBe('xml_modelo3')
  })

  it('detects liquidação by filename', () => {
    expect(detectDocumentType('DemonstracaoLiquidacao_100000001_202451342761.pdf')).toBe(
      'pdf_liquidacao',
    )
  })

  it('detects comprovativo by filename', () => {
    expect(detectDocumentType('comprovativo_632619797.pdf')).toBe('pdf_comprovativo')
  })

  it('detects liquidação by content', () => {
    expect(detectDocumentType('document.pdf', 'Demonstração de Liquidação de IRS')).toBe(
      'pdf_liquidacao',
    )
  })

  it('detects comprovativo by content', () => {
    expect(detectDocumentType('document.pdf', 'Comprovativo de Entrega da Declaração')).toBe(
      'pdf_comprovativo',
    )
  })

  it('returns unknown for unrecognized files', () => {
    expect(detectDocumentType('random.pdf')).toBe('unknown')
  })
})

// ─── Strict Validation Tests ─────────────────────────────────

describe('Strict validation — unsupported annexes', () => {
  it('should error on unsupported Anexo E in comprovativo', () => {
    const text = `Solteiro NIF 111222333 Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS 1 0 0 0 1 0 0 0 0 0 0 0 0 0 Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC
---PAGE---
Anexo A CATEGORIA A 111222333 30.000,00 3.600,00 3.300,00 Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC`
    const result = parseComprovativoPdfText(text)
    expect(
      result.issues.some((i) => i.severity === 'error' && i.code === 'UNSUPPORTED_ANEXO'),
    ).toBe(true)
    expect(result.issues.some((i) => i.message.includes('Anexo E'))).toBe(true)
  })

  it('should error on unsupported Anexo F in comprovativo', () => {
    const text = `Solteiro NIF 111222333 Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS 0 0 0 0 0 1 0 0 0 0 0 0 0 0 Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC`
    const result = parseComprovativoPdfText(text)
    expect(
      result.issues.some(
        (i) => i.severity === 'error' && i.code === 'UNSUPPORTED_ANEXO' && i.message.includes('F'),
      ),
    ).toBe(true)
  })

  it('should error on unsupported Anexo G in comprovativo', () => {
    const text = `Solteiro NIF 111222333 Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS 0 0 0 0 0 0 1 0 0 0 0 0 0 0 Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC`
    const result = parseComprovativoPdfText(text)
    expect(
      result.issues.some(
        (i) => i.severity === 'error' && i.code === 'UNSUPPORTED_ANEXO' && i.message.includes('G'),
      ),
    ).toBe(true)
  })

  it('should error on unsupported Anexo H in comprovativo', () => {
    const text = `Solteiro NIF 111222333 Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS 0 0 0 0 0 0 0 0 1 0 0 0 0 0 Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC`
    const result = parseComprovativoPdfText(text)
    expect(
      result.issues.some(
        (i) =>
          i.severity === 'error' && i.code === 'UNSUPPORTED_ANEXO' && i.message.includes('Anexo H'),
      ),
    ).toBe(true)
  })

  it('should not error when only supported annexes present', () => {
    const result = parseComprovativoPdfText(COMPROVATIVO_CAT_A_MARRIED)
    const errors = result.issues.filter(
      (i) => i.severity === 'error' && i.code === 'UNSUPPORTED_ANEXO',
    )
    expect(errors).toHaveLength(0)
  })

  it('should error when declared Anexo A has no extracted data', () => {
    // Comprovativo claiming Anexo A count=1 but with unparseable data page
    const text = `Solteiro NIF 111222333 Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS 1 0 0 0 0 0 0 0 0 0 0 0 0 0 Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC`
    const result = parseComprovativoPdfText(text)
    expect(result.issues.some((i) => i.severity === 'error' && i.code === 'PARSE_FAILED')).toBe(
      true,
    )
  })
})

describe('Strict validation — sentinel birth years', () => {
  it('should use sentinel birth_year=0 instead of placeholder', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)
    const { household } = comprativoParsedToHousehold(parsed)
    expect(household.dependents!.length).toBeGreaterThan(0)
    expect(household.dependents![0].birth_year).toBe(0)
  })

  it('should not emit MISSING_BIRTH_YEARS warning (questionnaire handles it)', () => {
    const parsed = parseComprovativoPdfText(COMPROVATIVO_2024_SP_A)
    const { issues } = comprativoParsedToHousehold(parsed)
    expect(issues.some((i) => i.code === 'MISSING_BIRTH_YEARS')).toBe(false)
  })
})

describe('Strict validation — union dues wiring', () => {
  it('should wire union_dues from Anexo A into income', () => {
    // The real Cat A comprovativo has quotizacoesSindicais=0.00
    const text = `Solteiro NIF 111222333 Comprovativo Mod.3 IRS: 111222333 / 2025 / ABC
---PAGE---
Anexo A CATEGORIAS A / H 2025 111222333 111222333 500000003 401 A 35.000,00 4.200,00 3.850,00 150,00 Comprovativo Mod.3 IRS: 111222333 / 2025 / ABC`
    const parsed = parseComprovativoPdfText(text)
    const { household } = comprativoParsedToHousehold(parsed)
    expect(household.members![0].incomes[0].union_dues).toBe(150)
  })
})

// ─── Edge Case / Robustness Tests ────────────────────────────

describe('PDF extractor edge cases', () => {
  it('parseLiquidacaoText returns empty result for empty text', () => {
    const result = parseLiquidacaoText('')
    expect(result.nif).toBeUndefined()
    expect(result.year).toBeUndefined()
  })

  it('parseLiquidacaoText returns empty result for non-liquidação text', () => {
    const result = parseLiquidacaoText('random text that is not a liquidação')
    expect(result.nif).toBeUndefined()
  })

  it('parseLiquidacaoText returns empty result for partial header only', () => {
    const result = parseLiquidacaoText('Demonstração de Liquidação de IRS')
    expect(result.nif).toBeUndefined()
  })

  it('parseComprovativoPdfText handles empty text gracefully', () => {
    const result = parseComprovativoPdfText('')
    expect(result.year).toBeUndefined()
    expect(result.nif).toBeUndefined()
    expect(result.anexoA).toBeUndefined()
    expect(result.anexoB).toBeUndefined()
  })

  it('parseComprovativoPdfText handles text with no anexos', () => {
    const text =
      'Comprovativo de Entrega da Declaração MODELO 3 111222333 X Comprovativo Mod.3 IRS: 111222333 / 2024 / ABC'
    const result = parseComprovativoPdfText(text)
    expect(result.year).toBe(2024)
    expect(result.nif).toBe('111222333')
    // No anexo data parsed from this minimal text
    expect(result.anexoA ?? []).toEqual([])
    expect(result.anexoB ?? []).toEqual([])
  })

  it('comprativoParsedToHousehold handles no members gracefully', () => {
    const result = comprativoParsedToHousehold({
      year: 2024,
      nif: '111222333',
      issues: [],
    })
    expect(result.household.year).toBe(2024)
  })

  it('detectDocumentType is case-insensitive for extensions', () => {
    expect(detectDocumentType('file.XML')).toBe('xml_modelo3')
    expect(detectDocumentType('FILE.Xml')).toBe('xml_modelo3')
  })

  it('detectDocumentType handles liquidação with accented filename', () => {
    expect(detectDocumentType('demonstracaoliquidacao_123.pdf')).toBe('pdf_liquidacao')
  })
})

// ─── Branch Coverage Tests ─────────────────────────────

describe('Marital status edge cases', () => {
  it('handles married but no cônjuge NIF → defaults to married_separate', () => {
    const text = `Casado
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 1 de 1`
    const parsed = parseComprovativoPdfText(text)
    expect(parsed.nif).toBe('100000001')
    // Only one NIF on page 1 (footer), no cônjuge NIF
    expect(parsed.nifConjuge).toBeUndefined()
    expect(parsed.filingStatus).toBe('married_separate')
    expect(parsed.tributacaoConjunta).toBe(false)
  })

  it('handles single filer — dependent NIF path with no cônjuge', () => {
    // Only main NIF on page 1 (appears twice), no other distinct NIF
    const text = `100000001 X 100000001
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 2 de 2`
    const parsed = parseComprovativoPdfText(text)
    expect(parsed.nif).toBe('100000001')
    expect(parsed.nifConjuge).toBeUndefined()
    expect(parsed.filingStatus).toBe('single')
    // Dependent NIF extraction runs but finds none (only main NIF repeated)
    expect(parsed.dependentNifs).toEqual([])
  })

  it('assigns filing status correctly for single filer — no X between NIFs', () => {
    const text = `100000001 X
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 1 de 1`
    const parsed = parseComprovativoPdfText(text)
    expect(parsed.filingStatus).toBe('single')
  })

  it('handles cônjuge NIF found but X pattern undetermined → married_separate', () => {
    // Two distinct NIFs on page 1, but main NIF indexOf returns -1 or cônjuge before main
    // Craft: nifConjuge found, but the search for main NIF position on page1 fails
    // This hits L377-380: conjIdx <= nifIdx branch
    const text = `200000001 100000001
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 1 de 1`
    const parsed = parseComprovativoPdfText(text)
    expect(parsed.nif).toBe('100000001')
    if (parsed.nifConjuge) {
      // Cônjuge found but X pattern can't be determined because
      // cônjuge NIF appears before main NIF in page text
      expect(parsed.filingStatus).toBe('married_separate')
      expect(parsed.tributacaoConjunta).toBe(false)
    }
  })
})

describe('Comprovativo declaration count validation', () => {
  it('detects declared Anexo A with no extracted data → PARSE_FAILED', () => {
    // Text with Anexo counts section declaring Anexo A=1, but no actual Anexo A page
    // ANEXO_NAMES: A, B, C, D, E, F, G, G1, H, I, J, L, Outros, SS (14 entries)
    const text = `100000001 X
---PAGE---
Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS
1 0 0 0 0 0 0 0 0 0 0 0 0 0 PRAZOS
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 2 de 2`
    const parsed = parseComprovativoPdfText(text)
    const parseFailed = parsed.issues.find(
      (i) => i.code === 'PARSE_FAILED' && i.message.includes('Anexo A'),
    )
    expect(parseFailed).toBeDefined()
  })

  it('detects unsupported Anexo E in counts → UNSUPPORTED_ANEXO error', () => {
    // UNSUPPORTED_PDF_ANEXOS = ['E', 'F', 'G', 'H']
    const text = `100000001 X
---PAGE---
Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS
0 0 0 0 1 0 0 0 0 0 0 0 0 0 PRAZOS
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 2 de 2`
    const parsed = parseComprovativoPdfText(text)
    const unsupported = parsed.issues.find(
      (i) => i.code === 'UNSUPPORTED_ANEXO' && i.message.includes('Anexo E'),
    )
    expect(unsupported).toBeDefined()
  })

  it('does not warn when supported annexes have data', () => {
    const text = `100000001 X
---PAGE---
Anexo A CATEGORIA A RENDIMENTOS 100000001 500000001 401 A 100000001 35.000,00 4.200,00 3.850,00 0,00 Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 2 de 3
---PAGE---
Anexo A Anexo B Anexo C Anexo D Anexo E Anexo F Anexo G Anexo G1 Anexo H Anexo I Anexo J Anexo L Outros Anexo SS
1 0 0 0 0 0 0 0 0 0 0 0 0 0 PRAZOS
---PAGE---
Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 3 de 3`
    const parsed = parseComprovativoPdfText(text)
    expect(parsed.issues.filter((i) => i.code === 'PARSE_FAILED')).toHaveLength(0)
  })
})

describe('Anexo A income code 417 — IRS Jovem detection', () => {
  it('detects IRS Jovem from income code 417', () => {
    const text = `100000001 X
---PAGE---
Anexo A CATEGORIA A RENDIMENTOS 2024 100000001 500000001 417 A 35.000,00 4.200,00 3.850,00 0,00 Comprovativo Mod.3 IRS: 100000001 / 2024 / 1234-X5678-00 Página 2 de 2`
    const parsed = parseComprovativoPdfText(text)
    expect(parsed.anexoA).toBeDefined()
    expect(parsed.anexoA!.length).toBe(1)
    expect(parsed.anexoA![0].irsJovem).toBe(true)
    expect(parsed.anexoA![0].incomeCode).toBe('417')
  })
})

describe('Document type detection — content fallback', () => {
  it('detects XML by Modelo3IRS content', () => {
    expect(detectDocumentType('unknown.dat', '<Modelo3IRS>')).toBe('xml_modelo3')
  })

  it('detects XML by AnexoA content', () => {
    expect(detectDocumentType('doc.txt', '<AnexoA>')).toBe('xml_modelo3')
  })

  it('detects XML by AnexoB content', () => {
    expect(detectDocumentType('doc.txt', '<AnexoB>')).toBe('xml_modelo3')
  })

  it('detects liquidação by content', () => {
    expect(detectDocumentType('doc.pdf', 'Demonstração de Liquidação IRS 2024')).toBe(
      'pdf_liquidacao',
    )
  })

  it('detects comprovativo by content', () => {
    expect(detectDocumentType('doc.pdf', 'Comprovativo de Entrega IRS 2024')).toBe(
      'pdf_comprovativo',
    )
  })

  it('returns unknown when no patterns match', () => {
    expect(detectDocumentType('random.pdf', 'some random content')).toBe('unknown')
  })
})
