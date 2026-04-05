import { describe, it, expect, beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'

// The XML parser uses DOMParser which is a browser API.
// We need to polyfill it for Node.js tests.
beforeAll(() => {
  const dom = new JSDOM('')
  globalThis.DOMParser = dom.window.DOMParser
})

import { parseModelo3Xml } from '@/lib/tax/xml-parser'

// ─── Test XML Fixtures ──────────────────────────────────────

const XML_MARRIED_SEPARATE = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2025</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>JOAO SILVA</Q03SPA>
      <Q03C01>123456789</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>1</Q04B01></Quadro04>
    <Quadro05><Q05B01>N</Q05B01></Quadro05>
    <Quadro06>
      <Q06C01>987654321</Q06C01>
      <Rostoq06BT01>
        <Rostoq06BT01-Linha numero="1"><NIF>111222333</NIF></Rostoq06BT01-Linha>
        <Rostoq06BT01-Linha numero="2"><NIF>444555666</NIF></Rostoq06BT01-Linha>
      </Rostoq06BT01>
    </Quadro06>
    <Quadro08><Q08B01>1</Q08B01></Quadro08>
    <Quadro09><Q09C01>PT50002300004562932157094</Q09C01></Quadro09>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>35000.00</Rendimentos>
          <Retencoes>7000.00</Retencoes>
          <Contribuicoes>3850.00</Contribuicoes>
          <Quotizacoes>120.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
  <AnexoB>
    <Quadro01><AnexoBq01B01>1</AnexoBq01B01></Quadro01>
    <Quadro03>
      <AnexoBq03C01>123456789</AnexoBq03C01>
      <AnexoBq03C07>1332</AnexoBq03C07>
      <AnexoBq03C08>62010</AnexoBq03C08>
      <AnexoBq03B10>S</AnexoBq03B10>
    </Quadro03>
    <Quadro04>
      <AnexoBq04C403>20000.00</AnexoBq04C403>
      <AnexoBq04SomaC01>20000.00</AnexoBq04SomaC01>
      <AnexoBq04SomaC02>0.00</AnexoBq04SomaC02>
      <AnexoBq04SomaC03>0.00</AnexoBq04SomaC03>
    </Quadro04>
    <Quadro06>
      <AnexoBq06C603>2500.00</AnexoBq06C603>
    </Quadro06>
    <Quadro13>
      <AnexoBq13C1305>15000.00</AnexoBq13C1305>
    </Quadro13>
  </AnexoB>
</Modelo3IRSv2026>`

const XML_MARRIED_JOINT = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>ANA COSTA</Q03SPA>
      <Q03C01>111111111</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>1</Q04B01></Quadro04>
    <Quadro05><Q05B01>N</Q05B01></Quadro05>
    <Quadro06>
      <Q06C01>222222222</Q06C01>
    </Quadro06>
    <Quadro08><Q08B01>2</Q08B01></Quadro08>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>30000.00</Rendimentos>
          <Retencoes>6000.00</Retencoes>
          <Contribuicoes>3300.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
        <AnexoAq04AT01-Linha numero="2">
          <NIF>500200300</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>B</Titular>
          <Rendimentos>25000.00</Rendimentos>
          <Retencoes>5000.00</Retencoes>
          <Contribuicoes>2750.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
</Modelo3IRSv2026>`

const XML_SINGLE = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>MARIA SANTOS</Q03SPA>
      <Q03C01>999888777</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>22000.00</Rendimentos>
          <Retencoes>4400.00</Retencoes>
          <Contribuicoes>2420.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
</Modelo3IRSv2026>`

const XML_SHARED_CUSTODY = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>PEDRO OLIVEIRA</Q03SPA>
      <Q03C01>333444555</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
    <Quadro06>
      <Rostoq06BT02>
        <Rostoq06BT02-Linha numero="1">
          <NIF>666777888</NIF>
          <GrauDeficiencia>70</GrauDeficiencia>
          <PartilhaDespesas>50</PartilhaDespesas>
          <NIFOutroSP>999000111</NIFOutroSP>
        </Rostoq06BT02-Linha>
      </Rostoq06BT02>
    </Quadro06>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>28000.00</Rendimentos>
          <Retencoes>5600.00</Retencoes>
          <Contribuicoes>3080.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
</Modelo3IRSv2026>`

const XML_ASCENDANTS = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>LUIS FERREIRA</Q03SPA>
      <Q03C01>444555666</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
    <Quadro06>
      <Rostoq07AT01>
        <Rostoq07AT01-Linha numero="1">
          <NIF>111000222</NIF>
          <Rendimento>4500</Rendimento>
          <GrauDeficiencia>80</GrauDeficiencia>
        </Rostoq07AT01-Linha>
        <Rostoq07AT01-Linha numero="2">
          <NIF>111000333</NIF>
          <Rendimento>3200</Rendimento>
        </Rostoq07AT01-Linha>
      </Rostoq07AT01>
    </Quadro06>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>40000.00</Rendimentos>
          <Retencoes>8000.00</Retencoes>
          <Contribuicoes>4400.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
</Modelo3IRSv2026>`

const XML_MULTI_CAT_B = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>CARLOS MENDES</Q03SPA>
      <Q03C01>555666777</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
  </Rosto>
  <AnexoB>
    <Quadro01><AnexoBq01B01>1</AnexoBq01B01></Quadro01>
    <Quadro03>
      <AnexoBq03C01>555666777</AnexoBq03C01>
      <AnexoBq03C07>1332</AnexoBq03C07>
    </Quadro03>
    <Quadro04>
      <AnexoBq04C403>50000.00</AnexoBq04C403>
      <AnexoBq04C401>10000.00</AnexoBq04C401>
      <AnexoBq04SomaC01>60000.00</AnexoBq04SomaC01>
      <AnexoBq04SomaC02>2000.00</AnexoBq04SomaC02>
      <AnexoBq04SomaC03>500.00</AnexoBq04SomaC03>
    </Quadro04>
    <Quadro06>
      <AnexoBq06C603>5000.00</AnexoBq06C603>
    </Quadro06>
  </AnexoB>
</Modelo3IRSv2026>`

const XML_PENSION = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>ANTONIO REIS</Q03SPA>
      <Q03C01>777888999</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>15000.00</Rendimentos>
          <Retencoes>3000.00</Retencoes>
          <Contribuicoes>1650.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
      <AnexoAq04BT01>
        <AnexoAq04BT01-Linha numero="1">
          <NIF>500300400</NIF>
          <CodRendimentos>501</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>12000.00</Rendimentos>
          <Retencoes>1200.00</Retencoes>
          <Contribuicoes>0.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04BT01-Linha>
      </AnexoAq04BT01>
    </Quadro04>
  </AnexoA>
</Modelo3IRSv2026>`

const XML_IRS_JOVEM = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>SOFIA NUNES</Q03SPA>
      <Q03C01>888999000</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>417</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>20000.00</Rendimentos>
          <Retencoes>4000.00</Retencoes>
          <Contribuicoes>2200.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
</Modelo3IRSv2026>`

const XML_ANEXO_SS = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>RUI MARQUES</Q03SPA>
      <Q03C01>100000001</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>1</Q04B01></Quadro04>
    <Quadro06>
      <Q06C01>100000002</Q06C01>
    </Quadro06>
    <Quadro08><Q08B01>1</Q08B01></Quadro08>
  </Rosto>
  <AnexoB>
    <Quadro01><AnexoBq01B01>1</AnexoBq01B01></Quadro01>
    <Quadro03>
      <AnexoBq03C01>100000001</AnexoBq03C01>
      <AnexoBq03C07>1332</AnexoBq03C07>
    </Quadro03>
    <Quadro04>
      <AnexoBq04C403>52329.20</AnexoBq04C403>
      <AnexoBq04SomaC01>52329.20</AnexoBq04SomaC01>
    </Quadro04>
  </AnexoB>
  <AnexoSS>
    <Quadro03>
      <AnexoSSq03C06>100000001</AnexoSSq03C06>
      <AnexoSSq03C07>99900000001</AnexoSSq03C07>
    </Quadro03>
    <Quadro04>
      <AnexoSSq04C406>52329.20</AnexoSSq04C406>
      <AnexoSSq04C1>52329.20</AnexoSSq04C1>
    </Quadro04>
    <Quadro06>
      <AnexoSSq06B1>S</AnexoSSq06B1>
      <AnexoSSq06T1>
        <AnexoSSq06T1-Linha>
          <Pais>724</Pais>
          <NFiscalEstrangeiro>B70340872</NFiscalEstrangeiro>
          <Valor>52329.20</Valor>
        </AnexoSSq06T1-Linha>
      </AnexoSSq06T1>
    </Quadro06>
  </AnexoSS>
</Modelo3IRSv2026>`

const XML_DEDUCTIONS = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2024</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>TESTE DEDUCOES</Q03SPA>
      <Q03C01>111222333</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>30000.00</Rendimentos>
          <Retencoes>6000.00</Retencoes>
          <Contribuicoes>3300.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
  <AnexoH>
    <Quadro06>
      <AnexoHq06AAT01>
        <AnexoHq06AAT01-Linha>
          <Titular>A</Titular>
          <Valor>3000.00</Valor>
        </AnexoHq06AAT01-Linha>
      </AnexoHq06AAT01>
      <AnexoHq06BAT01>
        <AnexoHq06BAT01-Linha>
          <Titular>A</Titular>
          <Valor>2000.00</Valor>
        </AnexoHq06BAT01-Linha>
      </AnexoHq06BAT01>
    </Quadro06>
    <Quadro07>
      <AnexoHq07AT01>
        <AnexoHq07AT01-Linha>
          <Titular>A</Titular>
          <Valor>800.00</Valor>
        </AnexoHq07AT01-Linha>
      </AnexoHq07AT01>
    </Quadro07>
  </AnexoH>
</Modelo3IRSv2026>`

/** XML with 2 valid Cat A lines, 2 zero-gross placeholder lines, and empty Anexo L lines */
const XML_ZERO_GROSS_LINES = `<?xml version="1.0" encoding="UTF-8"?>
<Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
  <Rosto>
    <Quadro02><Q02C01>2025</Q02C01></Quadro02>
    <Quadro03>
      <Q03SPA>ANA COSTA</Q03SPA>
      <Q03C01>999888777</Q03C01>
    </Quadro03>
    <Quadro04><Q04B01>3</Q04B01></Quadro04>
  </Rosto>
  <AnexoA>
    <Quadro04>
      <AnexoAq04AT01>
        <AnexoAq04AT01-Linha numero="1">
          <NIF>500100200</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>20000.00</Rendimentos>
          <Retencoes>4000.00</Retencoes>
          <Contribuicoes>2200.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
        <AnexoAq04AT01-Linha numero="2">
          <NIF>500200300</NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>15000.00</Rendimentos>
          <Retencoes>3000.00</Retencoes>
          <Contribuicoes>1650.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
        <AnexoAq04AT01-Linha numero="3">
          <NIF></NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>0.00</Rendimentos>
          <Retencoes>0.00</Retencoes>
          <Contribuicoes>0.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
        <AnexoAq04AT01-Linha numero="4">
          <NIF></NIF>
          <CodRendimentos>401</CodRendimentos>
          <Titular>A</Titular>
          <Rendimentos>0.00</Rendimentos>
          <Retencoes>0.00</Retencoes>
          <Contribuicoes>0.00</Contribuicoes>
          <Quotizacoes>0.00</Quotizacoes>
        </AnexoAq04AT01-Linha>
      </AnexoAq04AT01>
    </Quadro04>
  </AnexoA>
  <AnexoL id="999888777">
    <AnexoLq04AT01>
      <AnexoLq04AT01-Linha numero="1"></AnexoLq04AT01-Linha>
      <AnexoLq04AT01-Linha numero="2"></AnexoLq04AT01-Linha>
    </AnexoLq04AT01>
  </AnexoL>
</Modelo3IRSv2026>`

// ─── Tests ──────────────────────────────────────────────────

describe('XML Parser — Modelo 3 IRS', () => {
  // ─── Rosto Parsing ──────────────────────────────────────

  describe('Rosto — front page', () => {
    it('should parse basic fields: year, NIF, name, civil status', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.year).toBe(2025)
      expect(result.raw.subjectA_nif).toBe('123456789')
      expect(result.raw.subjectA_name).toBe('JOAO SILVA')
      expect(result.raw.subjectB_nif).toBe('987654321')
      expect(result.raw.civilStatus).toBe(1)
    })

    it('Q08B01=1 → married_separate filing', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.household.filing_status).toBe('married_separate')
    })

    it('Q08B01=2 → married_joint filing', () => {
      const result = parseModelo3Xml(XML_MARRIED_JOINT)
      expect(result.household.filing_status).toBe('married_joint')
      expect(result.household.members).toHaveLength(2)
    })

    it('Q04B01=3 → single filing', () => {
      const result = parseModelo3Xml(XML_SINGLE)
      expect(result.household.filing_status).toBe('single')
      expect(result.household.members).toHaveLength(1)
    })

    it('should parse disability as 0 when Q05B01 is N', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.disabilitySPA).toBe(0)
      expect(result.raw.disabilitySPB).toBe(0)
      expect(result.household.members[0].disability_degree).toBeUndefined()
    })

    it('should parse SP A disability degree from Q05', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
        <Rosto>
          <Quadro02><Q02C01>2025</Q02C01></Quadro02>
          <Quadro03><Q03SPA>MARIA</Q03SPA><Q03C01>111111111</Q03C01></Quadro03>
          <Quadro04><Q04B01>3</Q04B01></Quadro04>
          <Quadro05><Q05B01>S</Q05B01><Q05C01>75</Q05C01></Quadro05>
        </Rosto>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.raw.disabilitySPA).toBe(75)
      expect(result.household.members[0].disability_degree).toBe(75)
    })

    it('should default SP A disability to 60 when S but no degree', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
        <Rosto>
          <Quadro02><Q02C01>2025</Q02C01></Quadro02>
          <Quadro03><Q03SPA>MARIA</Q03SPA><Q03C01>111111111</Q03C01></Quadro03>
          <Quadro04><Q04B01>3</Q04B01></Quadro04>
          <Quadro05><Q05B01>S</Q05B01></Quadro05>
        </Rosto>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.raw.disabilitySPA).toBe(60)
      expect(result.household.members[0].disability_degree).toBe(60)
    })

    it('should parse filing option (Q08B01)', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.filingOption).toBe(1)
    })

    it('should parse IBAN (Q09C01)', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.iban).toBe('PT50002300004562932157094')
    })

    it('should parse regular dependents (BT01)', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.household.dependents).toHaveLength(2)
      expect(result.raw.dependents).toHaveLength(2)
      expect(result.raw.dependents[0].nif).toBe('111222333')
      expect(result.raw.dependents[1].nif).toBe('444555666')
      // Disability defaults to 0 (no disability) when absent from XML
      expect(result.household.dependents[0].disability_degree).toBe(0)
      expect(result.household.dependents[1].disability_degree).toBe(0)
    })

    it('should parse shared custody dependents (BT02) with disability', () => {
      const result = parseModelo3Xml(XML_SHARED_CUSTODY)
      expect(result.household.dependents).toHaveLength(1)
      const dep = result.household.dependents[0]
      expect(dep.shared_custody).toBe(true)
      expect(dep.disability_degree).toBe(70)
      expect(dep.name).toContain('guarda conjunta')

      // Raw data
      expect(result.raw.dependents).toHaveLength(1)
      expect(result.raw.dependents[0].sharedCustody).toBe(true)
      expect(result.raw.dependents[0].disabilityDegree).toBe(70)
      expect(result.raw.dependents[0].otherParentNif).toBe('999000111')
      expect(result.raw.dependents[0].expenseSharePercent).toBe(50)
    })

    it('should parse ascendants (Q07 AT01) with income and disability', () => {
      const result = parseModelo3Xml(XML_ASCENDANTS)
      expect(result.household.ascendants).toHaveLength(2)

      const asc1 = result.household.ascendants![0]
      expect(asc1.income).toBe(4500)
      expect(asc1.disability_degree).toBe(80)

      const asc2 = result.household.ascendants![1]
      expect(asc2.income).toBe(3200)
      expect(asc2.disability_degree).toBe(0)

      // Raw
      expect(result.raw.ascendants).toHaveLength(2)
      expect(result.raw.ascendants[0].nif).toBe('111000222')
    })
  })

  // ─── Anexo A — Cat A + Cat H ────────────────────────────

  describe('Anexo A — Cat A employment + Cat H pensions', () => {
    it('should parse Cat A lines with income code and titular', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      const personA = result.household.members[0]
      const catA = personA.incomes.find((i) => i.category === 'A')
      expect(catA).toBeDefined()
      expect(catA!.gross).toBe(35000)
      expect(catA!.withholding).toBe(7000)
      expect(catA!.ss_paid).toBe(3850)
      expect(catA!.cat_a_code).toBe(401)
    })

    it('should parse union dues as sindical deduction', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      const personA = result.household.members[0]
      const sindical = personA.deductions.find((d) => d.category === 'sindical')
      expect(sindical).toBeDefined()
      expect(sindical!.amount).toBe(120)
    })

    it('should assign Titular B income to second member (joint filing)', () => {
      const result = parseModelo3Xml(XML_MARRIED_JOINT)
      const personB = result.household.members[1]
      expect(personB.incomes).toHaveLength(1)
      expect(personB.incomes[0].gross).toBe(25000)
      expect(personB.incomes[0].category).toBe('A')
    })

    it('should parse Cat H pension lines (BT01)', () => {
      const result = parseModelo3Xml(XML_PENSION)
      const person = result.household.members[0]
      expect(person.incomes).toHaveLength(2)
      const catH = person.incomes.find((i) => i.category === 'H')
      expect(catH).toBeDefined()
      expect(catH!.gross).toBe(12000)
      expect(catH!.cat_a_code).toBe(501)
    })

    it('should detect IRS Jovem from income code 417', () => {
      const result = parseModelo3Xml(XML_IRS_JOVEM)
      const person = result.household.members[0]
      expect(person.special_regimes).toContain('irs_jovem')
      expect(result.raw.catAIncomeCodes[0].code).toBe(417)
    })

    it('should track income codes in raw output', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.catAIncomeCodes).toHaveLength(1)
      expect(result.raw.catAIncomeCodes[0]).toEqual({
        titular: 'A',
        code: 401,
        gross: 35000,
      })
    })

    it('should filter out zero-gross Anexo A and empty Anexo L placeholder lines', () => {
      const result = parseModelo3Xml(XML_ZERO_GROSS_LINES)
      const person = result.household.members[0]
      // Only the 2 lines with actual income should be kept
      // (2 zero-gross Anexo A + 2 empty Anexo L lines all filtered out)
      expect(person.incomes).toHaveLength(2)
      expect(person.incomes[0].gross).toBe(20000)
      expect(person.incomes[1].gross).toBe(15000)
      // Raw income codes should also exclude zero-gross lines
      expect(result.raw.catAIncomeCodes).toHaveLength(2)
      // NHR should NOT be set (all Anexo L lines were empty)
      expect(person.special_regimes).not.toContain('nhr')
    })
  })

  // ─── Anexo B — Cat B ────────────────────────────────────

  describe('Anexo B — Cat B self-employment', () => {
    it('should parse regime, activity code, and CAE', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.anexoB).toHaveLength(1)
      const ab = result.raw.anexoB[0]
      expect(ab.regime).toBe('simplified')
      expect(ab.activityCode).toBe('1332')
      expect(ab.cae).toBe('62010')
      expect(ab.firstYear).toBe(true)
    })

    it('should create Income with income code and regime', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      const personA = result.household.members[0]
      const catB = personA.incomes.find((i) => i.category === 'B')
      expect(catB).toBeDefined()
      expect(catB!.gross).toBe(20000)
      expect(catB!.cat_b_regime).toBe('simplified')
      expect(catB!.cat_b_income_code).toBe(403)
      expect(catB!.cat_b_activity_code).toBe('1332')
      expect(catB!.cat_b_cae).toBe('62010')
      expect(catB!.withholding).toBe(2500)
    })

    it('should parse prior year income (Q13C1305)', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.anexoB[0].priorYearIncome).toBe(15000)
    })

    it('should handle multiple income codes (C401 + C403)', () => {
      const result = parseModelo3Xml(XML_MULTI_CAT_B)
      const person = result.household.members[0]
      const catBIncomes = person.incomes.filter((i) => i.category === 'B')
      expect(catBIncomes).toHaveLength(2)

      const services = catBIncomes.find((i) => i.cat_b_income_code === 403)
      expect(services).toBeDefined()
      expect(services!.gross).toBe(50000)

      const merchandise = catBIncomes.find((i) => i.cat_b_income_code === 401)
      expect(merchandise).toBeDefined()
      expect(merchandise!.gross).toBe(10000)
    })

    it('should allocate withholding proportionally across codes', () => {
      const result = parseModelo3Xml(XML_MULTI_CAT_B)
      const person = result.household.members[0]
      const catBIncomes = person.incomes.filter((i) => i.category === 'B')

      const services = catBIncomes.find((i) => i.cat_b_income_code === 403)!
      const merchandise = catBIncomes.find((i) => i.cat_b_income_code === 401)!
      // 5000 × (50000/60000) ≈ 4166.67, 5000 × (10000/60000) ≈ 833.33
      expect(services.withholding).toBeCloseTo(4166.67, 1)
      expect(merchandise.withholding).toBeCloseTo(833.33, 1)
    })

    it('should allocate documented expenses proportionally', () => {
      const result = parseModelo3Xml(XML_MULTI_CAT_B)
      const person = result.household.members[0]
      const catBIncomes = person.incomes.filter((i) => i.category === 'B')

      const services = catBIncomes.find((i) => i.cat_b_income_code === 403)!
      // Total expenses = 2000 + 500 = 2500
      // services share: 2500 × (50000/60000) ≈ 2083.33
      expect(services.cat_b_documented_expenses).toBeCloseTo(2083.33, 1)
    })
  })

  // ─── Anexo SS — Social Security ────────────────────────

  describe('Anexo SS — Social Security', () => {
    it('should parse Cat B income base and NISS', () => {
      const result = parseModelo3Xml(XML_ANEXO_SS)
      expect(result.raw.anexoSS).toHaveLength(1)
      const ss = result.raw.anexoSS[0]
      expect(ss.nif).toBe('100000001')
      expect(ss.niss).toBe('99900000001')
      expect(ss.catBIncome).toBe(52329.2)
    })

    it('should parse foreign SS contributions', () => {
      const result = parseModelo3Xml(XML_ANEXO_SS)
      const ss = result.raw.anexoSS[0]
      expect(ss.foreignActivity).toBe(true)
      expect(ss.foreignActivityEntries).toHaveLength(1)
      expect(ss.foreignActivityEntries[0].country).toBe('724')
      expect(ss.foreignActivityEntries[0].foreignNif).toBe('B70340872')
      expect(ss.foreignActivityEntries[0].amount).toBe(52329.2)
    })

    it('should note foreign activity in Anexo SS', () => {
      const result = parseModelo3Xml(XML_ANEXO_SS)
      expect(result.issues.some((i) => i.message.includes('estrangeiro'))).toBe(true)
    })

    it('foreign activity issue should be info severity (not warning or error)', () => {
      const result = parseModelo3Xml(XML_ANEXO_SS)
      const foreignIssue = result.issues.find((i) => i.code === 'FOREIGN_ACTIVITY')
      expect(foreignIssue).toBeDefined()
      expect(foreignIssue!.severity).toBe('info')
    })

    it('foreign activity message describes income from activity abroad (not SS contributions)', () => {
      const result = parseModelo3Xml(XML_ANEXO_SS)
      const foreignIssue = result.issues.find((i) => i.code === 'FOREIGN_ACTIVITY')
      expect(foreignIssue).toBeDefined()
      // Must NOT say "contribuições SS" or "SS pagas no estrangeiro"
      expect(foreignIssue!.message).not.toMatch(/contribui/i)
      // Must say "atividade exercida no estrangeiro" (correct interpretation of Q06)
      expect(foreignIssue!.message).toMatch(/atividade.*estrangeiro/i)
    })
  })

  // ─── Anexo H — Deductions ──────────────────────────────

  describe('Anexo H — Deductions', () => {
    it('should parse alimony deductions (Q06A)', () => {
      const result = parseModelo3Xml(XML_DEDUCTIONS)
      const person = result.household.members[0]
      const alimony = person.deductions.find((d) => d.category === 'alimony')
      expect(alimony).toBeDefined()
      expect(alimony!.amount).toBe(3000)
    })

    it('should parse PPR deductions (Q06B)', () => {
      const result = parseModelo3Xml(XML_DEDUCTIONS)
      const person = result.household.members[0]
      const ppr = person.deductions.find((d) => d.category === 'ppr')
      expect(ppr).toBeDefined()
      expect(ppr!.amount).toBe(2000)
    })

    it('should parse housing expenses (Q07)', () => {
      const result = parseModelo3Xml(XML_DEDUCTIONS)
      const person = result.household.members[0]
      const housing = person.deductions.find((d) => d.category === 'housing')
      expect(housing).toBeDefined()
      expect(housing!.amount).toBe(800)
    })
  })

  // ─── Detected Anexos ───────────────────────────────────

  describe('Detected Anexos', () => {
    it('should list all Anexos present in declaration', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.raw.anexosPresent).toContain('AnexoA')
      expect(result.raw.anexosPresent).toContain('AnexoB')
    })

    it('should warn about unparsed Anexos', () => {
      // AnexoC, AnexoD, AnexoI are not parseable
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
        <Rosto>
          <Quadro02><Q02C01>2024</Q02C01></Quadro02>
          <Quadro03><Q03SPA>TEST</Q03SPA><Q03C01>111222333</Q03C01></Quadro03>
          <Quadro04><Q04B01>3</Q04B01></Quadro04>
        </Rosto>
        <AnexoC><Quadro01></Quadro01></AnexoC>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.issues.some((i) => i.message.includes('AnexoC'))).toBe(true)
    })
  })

  // ─── Edge Cases & Validation ───────────────────────────

  describe('Edge cases', () => {
    it('should throw on invalid XML', () => {
      expect(() => parseModelo3Xml('<invalid')).toThrow()
    })

    it('should warn when no income found', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
        <Rosto>
          <Quadro02><Q02C01>2024</Q02C01></Quadro02>
          <Quadro03><Q03SPA>EMPTY</Q03SPA><Q03C01>111222333</Q03C01></Quadro03>
          <Quadro04><Q04B01>3</Q04B01></Quadro04>
        </Rosto>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.issues.some((i) => i.message.includes('Nenhum rendimento'))).toBe(true)
    })

    it('should not emit birth year warnings (questionnaire handles it)', () => {
      const result = parseModelo3Xml(XML_MARRIED_SEPARATE)
      expect(result.issues.some((i) => i.code === 'MISSING_BIRTH_YEARS')).toBe(false)
    })

    it('should handle Anexo B without explicit income codes (use SomaC01)', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Modelo3IRSv2026 xmlns="http://www.dgci.gov.pt/2009/Modelo3IRSv2026">
        <Rosto>
          <Quadro02><Q02C01>2024</Q02C01></Quadro02>
          <Quadro03><Q03SPA>TEST</Q03SPA><Q03C01>111222333</Q03C01></Quadro03>
          <Quadro04><Q04B01>3</Q04B01></Quadro04>
        </Rosto>
        <AnexoB>
          <Quadro03><AnexoBq03C01>111222333</AnexoBq03C01></Quadro03>
          <Quadro04>
            <AnexoBq04SomaC01>15000.00</AnexoBq04SomaC01>
          </Quadro04>
        </AnexoB>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catB = result.household.members[0].incomes.find((i) => i.category === 'B')
      expect(catB).toBeDefined()
      expect(catB!.gross).toBe(15000)
    })
  })

  // ─── Anexo E — Cat E Capital Income ─────────────────────────

  describe('Anexo E (Cat E — Capital Income)', () => {
    it('parses dividends with withholding and englobamento', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoE>
          <Quadro04>
            <AnexoEq04AT01-Linha>
              <Titular>A</Titular>
              <NIF>999888777</NIF>
              <CodRendimentos>805</CodRendimentos>
              <Rendimentos>5000.00</Rendimentos>
              <Retencoes>1400.00</Retencoes>
              <Englobamento>S</Englobamento>
            </AnexoEq04AT01-Linha>
            <AnexoEq04AT01-Linha>
              <Titular>A</Titular>
              <NIF>888777666</NIF>
              <CodRendimentos>801</CodRendimentos>
              <Rendimentos>3000.00</Rendimentos>
              <Retencoes>840.00</Retencoes>
              <Englobamento>N</Englobamento>
            </AnexoEq04AT01-Linha>
          </Quadro04>
        </AnexoE>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catE = result.household.members[0].incomes.filter((i) => i.category === 'E')
      expect(catE).toHaveLength(2)
      expect(catE[0].gross).toBe(5000)
      expect(catE[0].withholding).toBe(1400)
      expect(catE[0].englobamento).toBe(true)
      expect(catE[1].gross).toBe(3000)
      expect(catE[1].englobamento).toBeFalsy()
    })
  })

  // ─── Anexo F — Cat F Rental Income ──────────────────────────

  describe('Anexo F (Cat F — Rental Income)', () => {
    it('parses rental income with expenses and contract duration', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoF>
          <Quadro04>
            <AnexoFq04AT01-Linha>
              <Titular>A</Titular>
              <Rendimentos>12000.00</Rendimentos>
              <Retencoes>3360.00</Retencoes>
              <Encargos>2000.00</Encargos>
              <DuracaoContrato>5</DuracaoContrato>
              <Englobamento>S</Englobamento>
              <Artigo>12345</Artigo>
            </AnexoFq04AT01-Linha>
          </Quadro04>
        </AnexoF>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catF = result.household.members[0].incomes.filter((i) => i.category === 'F')
      expect(catF).toHaveLength(1)
      expect(catF[0].gross).toBe(12000)
      expect(catF[0].withholding).toBe(3360)
      expect(catF[0].expenses).toBe(2000)
      expect(catF[0].rental_contract_duration).toBe(5)
      expect(catF[0].englobamento).toBe(true)
    })

    it('parses rental with alternate tag names (RendasBrutas, Despesas)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoF>
          <Quadro04>
            <AnexoFq04AT01-Linha>
              <Titular>A</Titular>
              <RendasBrutas>8000.00</RendasBrutas>
              <Despesas>1500.00</Despesas>
            </AnexoFq04AT01-Linha>
          </Quadro04>
        </AnexoF>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catF = result.household.members[0].incomes.filter((i) => i.category === 'F')
      expect(catF).toHaveLength(1)
      expect(catF[0].gross).toBe(8000)
      expect(catF[0].expenses).toBe(1500)
    })
  })

  // ─── Anexo G — Cat G Capital Gains ──────────────────────────

  describe('Anexo G (Cat G — Capital Gains)', () => {
    it('parses real estate gains (Q04)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoG>
          <Quadro04>
            <AnexoGq04AT01-Linha>
              <Titular>A</Titular>
              <ValorRealizacao>200000.00</ValorRealizacao>
              <ValorAquisicao>150000.00</ValorAquisicao>
              <DataAquisicao>2015-03-01</DataAquisicao>
              <DataAlienacao>2024-06-15</DataAlienacao>
              <Retencoes>0.00</Retencoes>
            </AnexoGq04AT01-Linha>
          </Quadro04>
        </AnexoG>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catG = result.household.members[0].incomes.filter((i) => i.category === 'G')
      expect(catG).toHaveLength(1)
      expect(catG[0].gross).toBe(50000) // gain = 200000 - 150000
      expect(catG[0].asset_type).toBe('real_estate')
    })

    it('parses financial gains (Q09)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoG>
          <Quadro09>
            <AnexoGq09AT01-Linha>
              <Titular>A</Titular>
              <ValorRealizacao>10000.00</ValorRealizacao>
              <ValorAquisicao>7000.00</ValorAquisicao>
              <Retencoes>840.00</Retencoes>
              <Englobamento>N</Englobamento>
            </AnexoGq09AT01-Linha>
          </Quadro09>
        </AnexoG>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catG = result.household.members[0].incomes.filter((i) => i.category === 'G')
      expect(catG).toHaveLength(1)
      expect(catG[0].gross).toBe(3000) // gain = 10000 - 7000
      expect(catG[0].asset_type).toBe('financial')
      expect(catG[0].withholding).toBe(840)
    })

    it('parses crypto gains (Q14)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoG>
          <Quadro14>
            <AnexoGq14AT01-Linha>
              <Titular>A</Titular>
              <ValorRealizacao>15000.00</ValorRealizacao>
              <ValorAquisicao>5000.00</ValorAquisicao>
              <Retencoes>0.00</Retencoes>
              <Englobamento>N</Englobamento>
            </AnexoGq14AT01-Linha>
          </Quadro14>
        </AnexoG>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catG = result.household.members[0].incomes.filter((i) => i.category === 'G')
      expect(catG).toHaveLength(1)
      expect(catG[0].gross).toBe(10000) // gain = 15000 - 5000
      expect(catG[0].asset_type).toBe('crypto')
    })

    it('parses multiple gain types in same Anexo G', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoG>
          <Quadro04>
            <AnexoGq04AT01-Linha>
              <Titular>A</Titular>
              <ValorRealizacao>200000.00</ValorRealizacao>
              <ValorAquisicao>150000.00</ValorAquisicao>
            </AnexoGq04AT01-Linha>
          </Quadro04>
          <Quadro09>
            <AnexoGq09AT01-Linha>
              <Titular>A</Titular>
              <ValorRealizacao>10000.00</ValorRealizacao>
              <ValorAquisicao>8000.00</ValorAquisicao>
            </AnexoGq09AT01-Linha>
          </Quadro09>
        </AnexoG>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catG = result.household.members[0].incomes.filter((i) => i.category === 'G')
      expect(catG).toHaveLength(2)
      expect(catG.find((g) => g.asset_type === 'real_estate')!.gross).toBe(50000)
      expect(catG.find((g) => g.asset_type === 'financial')!.gross).toBe(2000)
    })
  })

  // ─── Anexo H — Deductions ──────────────────────────────────

  describe('Anexo H (Deductions)', () => {
    it('parses alimony (Q06A)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoH>
          <Quadro06A>
            <AnexoHq06AAT01-Linha>
              <Titular>A</Titular>
              <Valor>6000.00</Valor>
            </AnexoHq06AAT01-Linha>
          </Quadro06A>
        </AnexoH>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const alimony = result.household.members[0].deductions.filter((d) => d.category === 'alimony')
      expect(alimony).toHaveLength(1)
      expect(alimony[0].amount).toBe(6000)
    })

    it('parses PPR (Q06B)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoH>
          <Quadro06B>
            <AnexoHq06BAT01-Linha>
              <Titular>A</Titular>
              <Montante>2000.00</Montante>
            </AnexoHq06BAT01-Linha>
          </Quadro06B>
        </AnexoH>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const ppr = result.household.members[0].deductions.filter((d) => d.category === 'ppr')
      expect(ppr).toHaveLength(1)
      expect(ppr[0].amount).toBe(2000)
    })

    it('parses expense corrections with type mapping (Q06C)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoH>
          <Quadro06C>
            <AnexoHq06CAT01-Linha>
              <Tipo>1</Tipo>
              <Valor>500.00</Valor>
            </AnexoHq06CAT01-Linha>
            <AnexoHq06CAT01-Linha>
              <Tipo>2</Tipo>
              <Valor>300.00</Valor>
            </AnexoHq06CAT01-Linha>
            <AnexoHq06CAT01-Linha>
              <Tipo>3</Tipo>
              <Valor>200.00</Valor>
            </AnexoHq06CAT01-Linha>
            <AnexoHq06CAT01-Linha>
              <Tipo>4</Tipo>
              <Valor>100.00</Valor>
            </AnexoHq06CAT01-Linha>
            <AnexoHq06CAT01-Linha>
              <CodDespesa>saude</CodDespesa>
              <Montante>150.00</Montante>
            </AnexoHq06CAT01-Linha>
          </Quadro06C>
        </AnexoH>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const deds = result.household.members[0].deductions
      expect(deds.filter((d) => d.category === 'health')).toHaveLength(2) // tipo=1 + saude
      expect(deds.filter((d) => d.category === 'education')).toHaveLength(1) // tipo=2
      expect(deds.filter((d) => d.category === 'housing')).toHaveLength(1) // tipo=3
      expect(deds.filter((d) => d.category === 'care_home')).toHaveLength(1) // tipo=4
    })

    it('parses housing expenses (Q07)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoH>
          <Quadro07>
            <AnexoHq07AT01-Linha>
              <Titular>A</Titular>
              <Valor>4000.00</Valor>
            </AnexoHq07AT01-Linha>
          </Quadro07>
        </AnexoH>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const housing = result.household.members[0].deductions.filter((d) => d.category === 'housing')
      expect(housing).toHaveLength(1)
      expect(housing[0].amount).toBe(4000)
    })
  })

  // ─── Anexo J — Foreign Income ───────────────────────────────

  describe('Anexo J (Foreign Income)', () => {
    it('parses foreign Cat A income with tax paid', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoJ>
          <Quadro04A>
            <AnexoJq04AAT01-Linha>
              <Titular>A</Titular>
              <CodPais>724</CodPais>
              <Rendimentos>25000.00</Rendimentos>
              <ImpostoPago>5000.00</ImpostoPago>
            </AnexoJq04AAT01-Linha>
          </Quadro04A>
        </AnexoJ>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const incomes = result.household.members[0].incomes.filter((i) => i.category === 'A')
      expect(incomes).toHaveLength(1)
      expect(incomes[0].gross).toBe(25000)
      expect(incomes[0].country_code).toBe('724')
      expect(incomes[0].foreign_tax_paid).toBe(5000)
    })

    it('parses multiple foreign income categories', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoJ>
          <Quadro04A>
            <AnexoJq04AAT01-Linha>
              <Titular>A</Titular>
              <CodPais>724</CodPais>
              <Rendimentos>20000.00</Rendimentos>
              <ImpostoPago>4000.00</ImpostoPago>
            </AnexoJq04AAT01-Linha>
          </Quadro04A>
          <Quadro04E>
            <AnexoJq04EAT01-Linha>
              <Titular>A</Titular>
              <CodPais>826</CodPais>
              <Rendimentos>3000.00</Rendimentos>
              <ImpostoPago>600.00</ImpostoPago>
            </AnexoJq04EAT01-Linha>
          </Quadro04E>
          <Quadro04F>
            <AnexoJq04FAT01-Linha>
              <Titular>A</Titular>
              <CodPais>250</CodPais>
              <Rendimentos>8000.00</Rendimentos>
              <ImpostoPago>2000.00</ImpostoPago>
            </AnexoJq04FAT01-Linha>
          </Quadro04F>
          <Quadro04G>
            <AnexoJq04GAT01-Linha>
              <Titular>A</Titular>
              <CodPais>276</CodPais>
              <Rendimentos>5000.00</Rendimentos>
              <ImpostoPago>1000.00</ImpostoPago>
            </AnexoJq04GAT01-Linha>
          </Quadro04G>
          <Quadro04H>
            <AnexoJq04HAT01-Linha>
              <Titular>A</Titular>
              <CodPais>040</CodPais>
              <Rendimentos>6000.00</Rendimentos>
              <ImpostoPago>1200.00</ImpostoPago>
            </AnexoJq04HAT01-Linha>
          </Quadro04H>
        </AnexoJ>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const incomes = result.household.members[0].incomes
      expect(incomes.filter((i) => i.category === 'A')).toHaveLength(1)
      expect(incomes.filter((i) => i.category === 'E')).toHaveLength(1)
      expect(incomes.filter((i) => i.category === 'F')).toHaveLength(1)
      expect(incomes.filter((i) => i.category === 'G')).toHaveLength(1)
      expect(incomes.filter((i) => i.category === 'H')).toHaveLength(1)
      // All should have foreign_tax_paid set
      for (const inc of incomes) {
        expect(inc.foreign_tax_paid).toBeGreaterThan(0)
        expect(inc.country_code).toBeTruthy()
      }
    })

    it('parses foreign Cat B income', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoJ>
          <Quadro04B>
            <AnexoJq04BAT01-Linha>
              <Titular>A</Titular>
              <Pais>840</Pais>
              <Rendimentos>15000.00</Rendimentos>
              <ImpostoPago>3000.00</ImpostoPago>
            </AnexoJq04BAT01-Linha>
          </Quadro04B>
        </AnexoJ>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catB = result.household.members[0].incomes.filter((i) => i.category === 'B')
      expect(catB).toHaveLength(1)
      expect(catB[0].gross).toBe(15000)
      expect(catB[0].country_code).toBe('840')
      expect(catB[0].foreign_tax_paid).toBe(3000)
    })
  })

  // ─── Anexo L — NHR ─────────────────────────────────────────

  describe('Anexo L (NHR)', () => {
    it('parses NHR Cat A income and sets special regime', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoL>
          <Quadro03><AnexoLq03C01>111222333</AnexoLq03C01></Quadro03>
          <Quadro04>
            <AnexoLq04AT01-Linha>
              <Titular>A</Titular>
              <CodRendimentos>401</CodRendimentos>
              <Rendimentos>50000.00</Rendimentos>
              <Retencoes>10000.00</Retencoes>
            </AnexoLq04AT01-Linha>
          </Quadro04>
        </AnexoL>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const person = result.household.members[0]
      expect(person.special_regimes).toContain('nhr')
      expect(person.nhr_confirmed).toBe(true)
      expect(person.incomes).toHaveLength(1)
      expect(person.incomes[0].gross).toBe(50000)
      expect(person.incomes[0].withholding).toBe(10000)
    })

    it('parses NHR Tabela B income', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoL>
          <Quadro03><AnexoLq03C01>111222333</AnexoLq03C01></Quadro03>
          <Quadro04B>
            <AnexoLq04BT01-Linha>
              <Titular>A</Titular>
              <CodRendimentos>501</CodRendimentos>
              <Rendimentos>30000.00</Rendimentos>
              <Retencoes>6000.00</Retencoes>
            </AnexoLq04BT01-Linha>
          </Quadro04B>
        </AnexoL>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const person = result.household.members[0]
      expect(person.special_regimes).toContain('nhr')
      expect(person.nhr_confirmed).toBe(true)
      expect(person.incomes[0].gross).toBe(30000)
    })

    it('does not double-count income when Anexo A and Anexo L overlap', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2025</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test NHR</Nome></Rostoq03>
        </Rosto>
        <AnexoA>
          <Quadro04>
            <AnexoAq04AT01>
              <AnexoAq04AT01-Linha numero="1">
                <NIF>500100200</NIF>
                <CodRendimentos>401</CodRendimentos>
                <Titular>A</Titular>
                <Rendimentos>40000.00</Rendimentos>
                <Retencoes>8000.00</Retencoes>
                <Contribuicoes>4400.00</Contribuicoes>
                <Quotizacoes>0.00</Quotizacoes>
              </AnexoAq04AT01-Linha>
            </AnexoAq04AT01>
          </Quadro04>
        </AnexoA>
        <AnexoL>
          <Quadro03><AnexoLq03C01>111222333</AnexoLq03C01></Quadro03>
          <Quadro04>
            <AnexoLq04AT01-Linha numero="1">
              <NIFEntidade>500100200</NIFEntidade>
              <CodRendimento>401</CodRendimento>
              <Rendimento>40000.00</Rendimento>
            </AnexoLq04AT01-Linha>
          </Quadro04>
        </AnexoL>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const person = result.household.members[0]
      // Only 1 income entry (from Anexo A), not 2
      expect(person.incomes).toHaveLength(1)
      expect(person.incomes[0].gross).toBe(40000)
      expect(person.incomes[0].ss_paid).toBe(4400)
      // NHR confirmed
      expect(person.special_regimes).toContain('nhr')
      expect(person.nhr_confirmed).toBe(true)
    })
  })

  // ─── Anexo SS — Foreign SS entries ─────────────────────────

  describe('Anexo SS (Foreign SS entries)', () => {
    it('parses foreign SS flag and entries', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoSS>
          <AnexoSSq03C01>111222333</AnexoSSq03C01>
          <AnexoSSq03C02>12345678901</AnexoSSq03C02>
          <AnexoSSq06B1>S</AnexoSSq06B1>
          <AnexoSSq06T1-Linha>
            <Pais>724</Pais>
            <NFiscalEstrangeiro>ES12345</NFiscalEstrangeiro>
            <Valor>3000.00</Valor>
          </AnexoSSq06T1-Linha>
        </AnexoSS>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.raw.anexoSS).toHaveLength(1)
      expect(result.raw.anexoSS[0].foreignActivity).toBe(true)
      expect(result.raw.anexoSS[0].foreignActivityEntries).toHaveLength(1)
      expect(result.raw.anexoSS[0].foreignActivityEntries[0].country).toBe('724')
      expect(result.raw.anexoSS[0].foreignActivityEntries[0].amount).toBe(3000)
    })
  })

  // ─── Edge cases and error handling ─────────────────────────

  describe('Edge cases', () => {
    it('handles empty Anexo elements gracefully', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoE></AnexoE>
        <AnexoF></AnexoF>
        <AnexoG></AnexoG>
        <AnexoH></AnexoH>
        <AnexoJ></AnexoJ>
        <AnexoL></AnexoL>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.household.members[0].incomes).toHaveLength(0)
      expect(result.household.members[0].deductions).toHaveLength(0)
      expect(result.raw.anexosPresent).toEqual(
        expect.arrayContaining(['AnexoE', 'AnexoF', 'AnexoG', 'AnexoH', 'AnexoJ', 'AnexoL']),
      )
    })

    it('handles two-person household with Anexo J per person', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>PersonA</Nome></Rostoq03>
          <Rostoq04><Q04B01>1</Q04B01></Rostoq04>
          <Quadro06>
            <Q06C01>222333444</Q06C01>
          </Quadro06>
          <Quadro08><Q08B01>2</Q08B01></Quadro08>
        </Rosto>
        <AnexoJ>
          <Quadro04A>
            <AnexoJq04AAT01-Linha>
              <Titular>A</Titular>
              <CodPais>724</CodPais>
              <Rendimentos>20000.00</Rendimentos>
              <ImpostoPago>4000.00</ImpostoPago>
            </AnexoJq04AAT01-Linha>
            <AnexoJq04AAT01-Linha>
              <Titular>B</Titular>
              <CodPais>826</CodPais>
              <Rendimentos>15000.00</Rendimentos>
              <ImpostoPago>3000.00</ImpostoPago>
            </AnexoJq04AAT01-Linha>
          </Quadro04A>
        </AnexoJ>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.household.members).toHaveLength(2)
      const personA = result.household.members[0]
      const personB = result.household.members[1]
      expect(personA.incomes).toHaveLength(1)
      expect(personA.incomes[0].country_code).toBe('724')
      expect(personB.incomes).toHaveLength(1)
      expect(personB.incomes[0].country_code).toBe('826')
    })

    it('handles Cat G with loss (negative gain)', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoG>
          <Quadro09>
            <AnexoGq09AT01-Linha>
              <Titular>A</Titular>
              <ValorRealizacao>5000.00</ValorRealizacao>
              <ValorAquisicao>8000.00</ValorAquisicao>
              <Retencoes>0</Retencoes>
            </AnexoGq09AT01-Linha>
          </Quadro09>
        </AnexoG>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      const catG = result.household.members[0].incomes.filter((i) => i.category === 'G')
      expect(catG).toHaveLength(1)
      expect(catG[0].gross).toBe(-3000) // loss
    })

    it('detects all Anexos present', () => {
      const xml = `<Modelo3IRSv2026>
        <Rosto>
          <Rostoq02><AnoIRS>2024</AnoIRS></Rostoq02>
          <Rostoq03><NIF>111222333</NIF><Nome>Test</Nome></Rostoq03>
        </Rosto>
        <AnexoA></AnexoA>
        <AnexoB></AnexoB>
        <AnexoE></AnexoE>
        <AnexoF></AnexoF>
        <AnexoG></AnexoG>
        <AnexoH></AnexoH>
        <AnexoJ></AnexoJ>
        <AnexoL></AnexoL>
        <AnexoSS></AnexoSS>
      </Modelo3IRSv2026>`
      const result = parseModelo3Xml(xml)
      expect(result.raw.anexosPresent).toEqual(
        expect.arrayContaining([
          'AnexoA',
          'AnexoB',
          'AnexoE',
          'AnexoF',
          'AnexoG',
          'AnexoH',
          'AnexoJ',
          'AnexoL',
          'AnexoSS',
        ]),
      )
    })
  })
})
