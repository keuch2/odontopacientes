<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OdontogramTooth extends Model
{
    use HasFactory;

    protected $fillable = [
        'odontogram_id',
        'tooth_fdi',
        'surface',
        'status',
        'color',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Odontograma al que pertenece este diente
     */
    public function odontogram(): BelongsTo
    {
        return $this->belongsTo(Odontogram::class);
    }

    /**
     * Obtener el nombre del diente en español
     */
    public function getToothNameAttribute(): string
    {
        return $this->getToothNameFromFDI($this->tooth_fdi);
    }

    /**
     * Obtener cuadrante del diente
     */
    public function getQuadrantAttribute(): int
    {
        return (int) substr($this->tooth_fdi, 0, 1);
    }

    /**
     * Obtener número del diente dentro del cuadrante
     */
    public function getToothNumberAttribute(): int
    {
        return (int) substr($this->tooth_fdi, -1);
    }

    /**
     * Verificar si es un diente permanente
     */
    public function isPermanent(): bool
    {
        return in_array($this->quadrant, [1, 2, 3, 4]);
    }

    /**
     * Verificar si es un diente temporal
     */
    public function isTemporary(): bool
    {
        return in_array($this->quadrant, [5, 6, 7, 8]);
    }

    /**
     * Obtener estado formateado
     */
    public function getFormattedStatusAttribute(): string
    {
        return match($this->status) {
            'sano' => 'Sano',
            'indicado' => 'Indicado',
            'proceso' => 'En Proceso',
            'finalizado' => 'Finalizado',
            'contraindicado' => 'Contraindicado',
            'ausente' => 'Ausente',
            'extraido' => 'Extraído',
            'corona' => 'Con Corona',
            'protesis' => 'Con Prótesis',
            default => ucfirst($this->status)
        };
    }

    /**
     * Obtener superficie formateada
     */
    public function getFormattedSurfaceAttribute(): string
    {
        if (!$this->surface) {
            return 'Toda la pieza';
        }

        $surfaces = [
            'O' => 'Oclusal',
            'M' => 'Mesial',
            'D' => 'Distal',
            'V' => 'Vestibular',
            'L' => 'Lingual',
            'MO' => 'Mesio-Oclusal',
            'DO' => 'Disto-Oclusal',
            'MOD' => 'Mesio-Ocluso-Distal',
            'VL' => 'Vestíbulo-Lingual'
        ];

        return $surfaces[$this->surface] ?? $this->surface;
    }

    /**
     * Convertir notación FDI a nombre del diente
     */
    private function getToothNameFromFDI(string $fdi): string
    {
        $quadrant = (int) substr($fdi, 0, 1);
        $number = (int) substr($fdi, -1);

        // Nombres para dientes permanentes
        $permanentNames = [
            1 => 'Incisivo Central',
            2 => 'Incisivo Lateral', 
            3 => 'Canino',
            4 => 'Primer Premolar',
            5 => 'Segundo Premolar',
            6 => 'Primer Molar',
            7 => 'Segundo Molar',
            8 => 'Tercer Molar'
        ];

        // Nombres para dientes temporales
        $temporaryNames = [
            1 => 'Incisivo Central Temporal',
            2 => 'Incisivo Lateral Temporal',
            3 => 'Canino Temporal',
            4 => 'Primer Molar Temporal',
            5 => 'Segundo Molar Temporal'
        ];

        $quadrantNames = [
            1 => 'Superior Derecho',
            2 => 'Superior Izquierdo',
            3 => 'Inferior Izquierdo',
            4 => 'Inferior Derecho',
            5 => 'Superior Derecho (Temporal)',
            6 => 'Superior Izquierdo (Temporal)',
            7 => 'Inferior Izquierdo (Temporal)',
            8 => 'Inferior Derecho (Temporal)'
        ];

        $toothName = in_array($quadrant, [1, 2, 3, 4]) 
            ? ($permanentNames[$number] ?? "Diente {$number}")
            : ($temporaryNames[$number] ?? "Diente Temporal {$number}");

        $quadrantName = $quadrantNames[$quadrant] ?? "Cuadrante {$quadrant}";

        return "{$toothName} - {$quadrantName}";
    }

    /**
     * Scope para dientes por estado
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope para dientes por cuadrante
     */
    public function scopeByQuadrant($query, $quadrant)
    {
        return $query->whereRaw('LEFT(tooth_fdi, 1) = ?', [$quadrant]);
    }

    /**
     * Scope para dientes permanentes
     */
    public function scopePermanent($query)
    {
        return $query->whereRaw('LEFT(tooth_fdi, 1) IN (1, 2, 3, 4)');
    }

    /**
     * Scope para dientes temporales
     */
    public function scopeTemporary($query)
    {
        return $query->whereRaw('LEFT(tooth_fdi, 1) IN (5, 6, 7, 8)');
    }
}
