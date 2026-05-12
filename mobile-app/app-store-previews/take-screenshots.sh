#!/usr/bin/env bash
# take-screenshots.sh
# Captura screenshots para App Store desde el simulador iOS.
#
# Uso:
#   1. Asegurate de tener Xcode instalado y los simuladores descargados.
#   2. Iniciá la app en el simulador deseado:
#        cd mobile-app && npx expo start --ios
#   3. Una vez que la app esté abierta y logueada, ejecutá este script:
#        ./app-store-previews/take-screenshots.sh
#
# El script:
#   - Detecta el simulador iOS booted.
#   - Te guía pantalla por pantalla; navegás vos manualmente.
#   - Captura cada pantalla y la guarda en screenshots/<dispositivo>/<numero>-<nombre>.png

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_BASE="$SCRIPT_DIR/screenshots"

# Pantallas a capturar (en orden de aparición sugerido en la ficha)
SCREENS=(
  "01-login"
  "02-catedras"
  "03-pacientes-por-catedra"
  "04-odontograma"
  "05-mis-pacientes"
  "06-detalle-procedimiento"
  "07-historial-clinico"
)

DESCRIPTIONS=(
  "Pantalla de login (cerrá sesión si estás logueado)"
  "Lista de cátedras (pestaña 'Cátedras')"
  "Pacientes filtrados por cátedra (entrá a una cátedra)"
  "Odontograma de un paciente (abrí un paciente → Odontograma)"
  "Mis pacientes (pestaña 'Mis Pacientes')"
  "Detalle de procedimiento (abrí una asignación)"
  "Historial clínico (entrá al historial de un paciente)"
)

# Detectar simulador booted
BOOTED_DEVICE=$(xcrun simctl list devices booted | grep -E "Booted" | head -1 | sed -E 's/.*\(([A-F0-9-]+)\) \(Booted\).*/\1/' || true)

if [[ -z "$BOOTED_DEVICE" ]]; then
  echo "Error: no hay simulador iOS booted."
  echo "Iniciá uno con: open -a Simulator"
  echo "O desde Xcode: Window → Devices and Simulators."
  exit 1
fi

DEVICE_NAME=$(xcrun simctl list devices booted | grep -E "Booted" | head -1 | sed -E 's/^[[:space:]]*(.+) \([A-F0-9-]+\) \(Booted\).*/\1/' | tr ' ' '_' | tr '/' '_')
OUTPUT_DIR="$OUTPUT_BASE/$DEVICE_NAME"
mkdir -p "$OUTPUT_DIR"

echo "Simulador detectado: $DEVICE_NAME ($BOOTED_DEVICE)"
echo "Las capturas se guardarán en: $OUTPUT_DIR"
echo ""
echo "Vas a capturar ${#SCREENS[@]} pantallas. Para cada una:"
echo "  1. Navegá manualmente a la pantalla en el simulador."
echo "  2. Volvé a esta terminal y presioná ENTER."
echo "  3. Para saltar una pantalla, escribí 's' + ENTER."
echo ""

for i in "${!SCREENS[@]}"; do
  SCREEN_NAME="${SCREENS[$i]}"
  DESCRIPTION="${DESCRIPTIONS[$i]}"
  OUTPUT_FILE="$OUTPUT_DIR/$SCREEN_NAME.png"

  echo "──────────────────────────────────────────"
  echo "[$((i + 1))/${#SCREENS[@]}] $SCREEN_NAME"
  echo "  → $DESCRIPTION"
  echo ""
  read -r -p "ENTER para capturar (o 's' para saltar): " ANSWER

  if [[ "$ANSWER" == "s" ]]; then
    echo "  Saltada."
    continue
  fi

  xcrun simctl io "$BOOTED_DEVICE" screenshot "$OUTPUT_FILE"
  echo "  Guardada: $OUTPUT_FILE"
done

echo ""
echo "──────────────────────────────────────────"
echo "Listo. Capturas en: $OUTPUT_DIR"
echo ""
echo "Resoluciones requeridas por App Store:"
echo "  - iPhone 6.9\" (iPhone 16 Pro Max): 1320 × 2868 px"
echo "  - iPhone 6.7\" (iPhone 14 Plus):    1284 × 2778 px"
echo "  - iPad Pro 13\":                    2064 × 2752 px"
echo ""
echo "Verificá la resolución con:"
echo "  sips -g pixelWidth -g pixelHeight \"$OUTPUT_DIR\"/*.png"
echo ""
echo "Si no coinciden, abrí el simulador correspondiente desde Xcode:"
echo "  Xcode → Window → Devices and Simulators → seleccionar dispositivo."
