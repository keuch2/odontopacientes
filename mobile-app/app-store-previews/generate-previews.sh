#!/usr/bin/env bash
set -e

SRC="/opt/homebrew/var/www/odontopacientes/mobile-app/mockups"
OUT="/opt/homebrew/var/www/odontopacientes/mobile-app/app-store-previews/videos"
TMP=$(mktemp -d)
BG="0x102C6A"     # navy
W=1080; H=1920    # App Store portrait preview resolution
DUR=6             # seconds per slide
TRANS=0.5         # crossfade duration

trap "rm -rf $TMP" EXIT

# ── Genera un clip de DUR segundos a partir de una imagen ──────────────────
# $1 = path imagen  $2 = filtro extra (opcional, ej: para recortar imagen alta)
make_clip() {
  local img="$1"
  local extra="${2:-}"
  local out="$3"
  local filter="scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=${BG}"
  if [[ -n "$extra" ]]; then
    filter="$extra,$filter"
  fi
  ffmpeg -y -loop 1 -t $DUR -i "$img" \
    -vf "$filter,fade=t=in:st=0:d=0.4,fade=t=out:st=$((DUR-1)):d=0.4" \
    -r 30 -pix_fmt yuv420p -c:v libx264 -preset fast -crf 18 \
    "$out" -loglevel error
  echo "  ✓ clip: $(basename $img)"
}

# ── Concatena 3 clips con xfade ────────────────────────────────────────────
concat3() {
  local c1="$1" c2="$2" c3="$3" out="$4"
  local off1=$(echo "$DUR $TRANS" | awk '{printf "%.1f", $1-$2}')
  local off2=$(echo "$DUR $TRANS" | awk '{printf "%.1f", ($1-$2)*2}')
  ffmpeg -y -i "$c1" -i "$c2" -i "$c3" \
    -filter_complex \
      "[0][1]xfade=transition=fade:duration=${TRANS}:offset=${off1}[v01];
       [v01][2]xfade=transition=fade:duration=${TRANS}:offset=${off2}[out]" \
    -map "[out]" -c:v libx264 -preset fast -crf 16 -pix_fmt yuv420p \
    "$out" -loglevel error
  echo "  ✓ video: $(basename $out)"
}

# ═══════════════════════════════════════════════════════════════════════════
echo "▶ Video 1 — Inicio rápido (Login → Cátedras → Pacientes)"
make_clip "$SRC/login.png"                               "" "$TMP/c1a.mp4"
make_clip "$SRC/catedras.png"                            "" "$TMP/c1b.mp4"
make_clip "$SRC/catedra con lista de pacientes.png"      "" "$TMP/c1c.mp4"
concat3 "$TMP/c1a.mp4" "$TMP/c1b.mp4" "$TMP/c1c.mp4" \
        "$OUT/preview-1-inicio.mp4"

echo "▶ Video 2 — Gestión clínica (Ficha → Agendar → Procedimiento)"
# ficha es 786×2888 → escalar a ancho 786, recortar top 1704 px antes de filtro general
make_clip "$SRC/paciente-ficha.png"                      "scale=786:-1,crop=786:1704:0:120" "$TMP/c2a.mp4"
make_clip "$SRC/paciente-agendar-procedimiento.png"      "" "$TMP/c2b.mp4"
make_clip "$SRC/paciente-ver-procedimiento.png"          "" "$TMP/c2c.mp4"
concat3 "$TMP/c2a.mp4" "$TMP/c2b.mp4" "$TMP/c2c.mp4" \
        "$OUT/preview-2-clinica.mp4"

echo "▶ Video 3 — Tu cátedra digital (Cátedras → Pacientes → Ficha)"
make_clip "$SRC/catedras.png"                            "" "$TMP/c3a.mp4"
make_clip "$SRC/catedra con lista de pacientes.png"      "" "$TMP/c3b.mp4"
make_clip "$SRC/paciente-ficha.png"                      "scale=786:-1,crop=786:1704:0:120" "$TMP/c3c.mp4"
concat3 "$TMP/c3a.mp4" "$TMP/c3b.mp4" "$TMP/c3c.mp4" \
        "$OUT/preview-3-catedra.mp4"

echo ""
echo "✅ Videos generados en app-store-previews/videos/"
ls -lh "$OUT"/*.mp4 | awk '{print "   "$5, $9}'
