#!/bin/bash
# Redact PII from real tax XML files for use as E2E test fixtures.
# Replaces names and NIFs with deterministic fake values while preserving
# all financial data and XML structure.

set -euo pipefail

SRC_HOLDER_A="${TAX_FIXTURES_DIR_A:?Set TAX_FIXTURES_DIR_A to holder A XML directory}"
SRC_HOLDER_B="${TAX_FIXTURES_DIR_B:?Set TAX_FIXTURES_DIR_B to holder B XML directory}"
DEST="tests/fixtures/e2e"

# NIF mapping: real → fake (deterministic so cross-references stay valid)
# Sujeito A: → 100000001
# Sujeito B: → 100000002
# Dependente 1: → 100000003
# Dependente 2: → 100000004
# Employer: → 500000001
# Consignação org: → 500000002

redact() {
  local src="$1" dst="$2"
  sed \
    -e "s/${NIF_A:?Set NIF_A}/100000001/g" \
    -e "s/${NIF_B:?Set NIF_B}/100000002/g" \
    -e "s/${NIF_DEP1:-SKIP_NO_MATCH}/100000003/g" \
    -e "s/${NIF_DEP2:-SKIP_NO_MATCH}/100000004/g" \
    -e "s/${NIF_EMPLOYER:-SKIP_NO_MATCH}/500000001/g" \
    -e "s/${NIF_CONSIGN:-SKIP_NO_MATCH}/500000002/g" \
    -e "s/${NAME_A:?Set NAME_A}/SUJEITO A TESTE/g" \
    -e "s/${NAME_B:-SKIP_NO_MATCH}/SUJEITO B TESTE/g" \
    "$src" > "$dst"
  echo "  ✓ $(basename "$dst")"
}

echo "Redacting XML fixtures..."
mkdir -p "$DEST"

# Rui's declarations (all years available)
# Holder A declarations
for f in "$SRC_HOLDER_A"/decl-m3-irs-*.xml; do
  year=$(echo "$f" | grep -oP '\d{4}(?=-)')
  redact "$f" "$DEST/decl-m3-irs-${year}-holder-a.xml"
done

# Holder B declarations
for f in "$SRC_HOLDER_B"/decl-m3-irs-*.xml; do
  year=$(echo "$f" | grep -oP '\d{4}(?=-)')
  redact "$f" "$DEST/decl-m3-irs-${year}-holder-b.xml"
done

echo ""
echo "Done. Fixtures in $DEST:"
ls -la "$DEST"
