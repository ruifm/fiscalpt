#!/usr/bin/env bash
#
# anonymize-doc.sh — Remove personal data from AT tax documents
#
# Strips NIF, names, addresses, IBAN, phone numbers and emails from
# XML Modelo 3 and PDF text while preserving all fiscal values.
#
# Usage:
#   ./scripts/anonymize-doc.sh <file.xml|file.pdf>
#
# Output:
#   <file>.anonymized.xml  or  <file>.anonymized.txt  (PDF → text)
#
# What is removed/replaced:
#   - NIF (9-digit tax number) → 999999990
#   - Names → NOME_ANONIMO
#   - Addresses (Rua, Av., Travessa, etc.) → MORADA_ANONIMA
#   - Postal codes (1234-567) → 0000-000
#   - IBAN (PT50...) → PT50000000000000000000000
#   - Phone numbers → 900000000
#   - Email addresses → anon@example.com
#
# What is preserved:
#   - All monetary values (rendimentos, deduções, coleta, etc.)
#   - Tax year, filing status, income categories
#   - Bracket calculations, rates, coefficients

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <ficheiro.xml|ficheiro.pdf>"
  echo ""
  echo "Remove dados pessoais (NIF, nomes, moradas, IBAN) de documentos AT,"
  echo "preservando todos os valores fiscais para debugging."
  exit 1
fi

INPUT="$1"

if [[ ! -f "$INPUT" ]]; then
  echo "Erro: ficheiro não encontrado: $INPUT"
  exit 1
fi

EXT="${INPUT##*.}"
BASENAME="${INPUT%.*}"

anonymize_text() {
  local content="$1"

  # NIF: 9 digits (standalone, not part of larger numbers like monetary values)
  # Match NIFs in XML tags or preceded by word boundaries
  content=$(echo "$content" | sed -E 's/(<[^>]*Nif[^>]*>)[0-9]{9}(<)/\1999999990\2/gi')
  content=$(echo "$content" | sed -E 's/(NIF|nif|Nif)[: ]*[0-9]{9}/\1: 999999990/g')

  # Names in XML tags
  content=$(echo "$content" | sed -E 's/(<[^>]*Nome[^>]*>)[^<]+(<)/\1NOME_ANONIMO\2/gi')

  # Addresses in XML tags
  content=$(echo "$content" | sed -E 's/(<[^>]*Morada[^>]*>)[^<]+(<)/\1MORADA_ANONIMA\2/gi')
  content=$(echo "$content" | sed -E 's/(<[^>]*Rua[^>]*>)[^<]+(<)/\1MORADA_ANONIMA\2/gi')
  content=$(echo "$content" | sed -E 's/(<[^>]*Localidade[^>]*>)[^<]+(<)/\1LOCALIDADE_ANONIMA\2/gi')
  content=$(echo "$content" | sed -E 's/(<[^>]*Distrito[^>]*>)[^<]+(<)/\1DISTRITO_ANONIMO\2/gi')
  content=$(echo "$content" | sed -E 's/(<[^>]*Concelho[^>]*>)[^<]+(<)/\1CONCELHO_ANONIMO\2/gi')
  content=$(echo "$content" | sed -E 's/(<[^>]*Freguesia[^>]*>)[^<]+(<)/\1FREGUESIA_ANONIMA\2/gi')

  # Postal codes (1234-567)
  content=$(echo "$content" | sed -E 's/[0-9]{4}-[0-9]{3}/0000-000/g')

  # IBAN
  content=$(echo "$content" | sed -E 's/PT50[0-9]{21}/PT50000000000000000000000/g')
  content=$(echo "$content" | sed -E 's/\b[A-Z]{2}[0-9]{2}[0-9A-Z]{11,30}\b/PT50000000000000000000000/g')

  # Phone numbers (9 digits starting with 91-96, 21-29, or 30-39 — Portuguese mobile/landline)
  content=$(echo "$content" | sed -E 's/\b(9[1-6])[0-9]{7}\b/900000000/g')
  content=$(echo "$content" | sed -E 's/\b(2[1-9])[0-9]{7}\b/900000000/g')

  # Email addresses
  content=$(echo "$content" | sed -E 's/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/anon@example.com/g')

  # Names in PDF text (common patterns)
  content=$(echo "$content" | sed -E 's/(Contribuinte|Nome|Sujeito Passivo)[: ]+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+ [A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç ]+/\1: NOME_ANONIMO/g')

  # Addresses in PDF text
  content=$(echo "$content" | sed -E 's/(Rua|Av\.|Avenida|Travessa|Largo|Praça|Estrada) [A-Za-záéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ ,0-9]+/MORADA_ANONIMA/g')

  echo "$content"
}

case "$EXT" in
  xml|XML)
    OUTPUT="${BASENAME}.anonymized.xml"
    CONTENT=$(cat "$INPUT")
    anonymize_text "$CONTENT" > "$OUTPUT"
    echo "✓ Ficheiro anonimizado: $OUTPUT"
    echo ""
    echo "Verifique o resultado antes de partilhar:"
    echo "  grep -iE 'nif|nome|morada|iban' $OUTPUT"
    ;;

  pdf|PDF)
    OUTPUT="${BASENAME}.anonymized.txt"
    if ! command -v pdftotext &>/dev/null; then
      echo "Erro: 'pdftotext' não encontrado. Instale com:"
      echo "  sudo apt install poppler-utils    # Ubuntu/Debian"
      echo "  brew install poppler               # macOS"
      exit 1
    fi
    CONTENT=$(pdftotext "$INPUT" -)
    anonymize_text "$CONTENT" > "$OUTPUT"
    echo "✓ Ficheiro anonimizado: $OUTPUT (texto extraído do PDF)"
    echo ""
    echo "⚠️  O PDF original pode conter dados em imagens que não são extraídos."
    echo "    Partilhe apenas o ficheiro .anonymized.txt, nunca o PDF original."
    echo ""
    echo "Verifique o resultado antes de partilhar:"
    echo "  grep -iE 'nif|nome|morada|iban' $OUTPUT"
    ;;

  *)
    echo "Erro: formato não suportado: .$EXT"
    echo "Formatos suportados: .xml, .pdf"
    exit 1
    ;;
esac
