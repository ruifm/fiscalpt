# Public AT Document Samples

Publicly available Portuguese tax documents used for parser testing and validation.

## Files

### `cld-liquidacao-2025.pdf`

Real "Demonstração de Liquidação de IRS" for tax year 2024. Found publicly
shared via cld.pt cloud storage. Cat A employee, low income, mínimo de
existência applied.

- **Source**: https://cld.pt/dl/download/6a2829f1-f69e-4a27-8e8e-670a41d1ae47/MM_2023/2026/DemonstracaoLiquidacao_203542100_202542847135_25.pdf
- **Type**: Liquidação
- **Year**: 2024
- **Key features**: Abatimento por mínimo de existência, low-bracket taxation

### `utad-comprovativo-2020.pdf`

Comprovativo from UTAD (university), published for student scholarship
documentation. Heavily redacted — mostly blank form template with minimal
extractable data.

- **Source**: https://comunicacao.sas.utad.pt/Media/Default/Estudar-na-utad/Bolsas-de-estudo/IRS_2020.pdf
- **Type**: Comprovativo
- **Year**: 2020
- **Key features**: Redacted, limited usefulness for parsing

## Other Public Resources (not downloaded)

- **AT blank forms**: https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/modelos_formularios/irs/
- **OCC IRS Manual 2026**: https://www.occ.pt/sites/default/files/public/2026-03/Essencial_IRS2026_DIG_final.pdf
- **IRS XML schemas**: https://github.com/rgl/irs-schemas
- **Portaria 47/2023 (form definitions)**: https://files.dre.pt/1s/2023/02/03300/0000800172.pdf

## Notes

No public database of filled comprovativos or liquidação documents exists.
These are confidential tax documents. The files here were found publicly
accessible via institutional websites (universities, municipalities).

For comprehensive parser testing, we rely on real documents stored locally
(not committed to the repo). Set `TAX_FIXTURES_DIR` to your local tax
documents directory when running those tests.
