<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Odontogram extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'type',
        'recorded_at',
        'general_notes',
        'created_by',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Paciente al que pertenece este odontograma
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Usuario que creó este odontograma
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Dientes registrados en este odontograma
     */
    public function teeth(): HasMany
    {
        return $this->hasMany(OdontogramTooth::class);
    }

    /**
     * Verificar si es de dientes permanentes
     */
    public function isPermanent(): bool
    {
        return $this->type === 'permanent';
    }

    /**
     * Verificar si es de dientes temporales
     */
    public function isTemporary(): bool
    {
        return $this->type === 'temporary';
    }

    /**
     * Obtener dientes por cuadrante
     */
    public function getTeethByQuadrant(int $quadrant): array
    {
        $quadrantTeeth = $this->teeth()
            ->whereRaw('LEFT(tooth_fdi, 1) = ?', [$quadrant])
            ->get()
            ->keyBy('tooth_fdi')
            ->toArray();

        // Rango de dientes según tipo de odontograma
        $range = $this->isPermanent() 
            ? range($quadrant * 10 + 1, $quadrant * 10 + 8) 
            : range($quadrant * 10 + 1, $quadrant * 10 + 5);

        $result = [];
        foreach ($range as $toothNumber) {
            $toothFdi = (string) $toothNumber;
            $result[$toothFdi] = $quadrantTeeth[$toothFdi] ?? null;
        }

        return $result;
    }

    /**
     * Obtener estadísticas del odontograma
     */
    public function getStatsAttribute(): array
    {
        $teeth = $this->teeth;
        $total = $teeth->count();

        if ($total === 0) {
            return [
                'total' => 0,
                'sano' => 0,
                'indicado' => 0,
                'proceso' => 0,
                'finalizado' => 0,
                'contraindicado' => 0,
                'otros' => 0
            ];
        }

        $stats = [
            'total' => $total,
            'sano' => $teeth->where('status', 'sano')->count(),
            'indicado' => $teeth->where('status', 'indicado')->count(),
            'proceso' => $teeth->where('status', 'proceso')->count(),
            'finalizado' => $teeth->where('status', 'finalizado')->count(),
            'contraindicado' => $teeth->where('status', 'contraindicado')->count(),
        ];

        $stats['otros'] = $total - array_sum(array_slice($stats, 1, -1));

        return $stats;
    }

    /**
     * Scope para odontogramas permanentes
     */
    public function scopePermanent($query)
    {
        return $query->where('type', 'permanent');
    }

    /**
     * Scope para odontogramas temporales
     */
    public function scopeTemporary($query)
    {
        return $query->where('type', 'temporary');
    }

    /**
     * Scope para odontogramas recientes
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('recorded_at', '>=', now()->subDays($days));
    }
}
