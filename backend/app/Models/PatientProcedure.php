<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PatientProcedure extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'treatment_id',
        'treatment_subclass_id',
        'chair_id',
        'tooth_fdi',
        'tooth_surface',
        'is_repair',
        'status',
        'notes',
        'contraindication_reason',
        'estimated_price',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'is_repair' => 'boolean',
        'estimated_price' => 'decimal:2',
        'priority' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Paciente al que pertenece este procedimiento
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Tratamiento asociado
     */
    public function treatment(): BelongsTo
    {
        return $this->belongsTo(Treatment::class);
    }

    /**
     * Sub-clase del tratamiento
     */
    public function treatmentSubclass(): BelongsTo
    {
        return $this->belongsTo(TreatmentSubclass::class);
    }

    /**
     * Cátedra asociada
     */
    public function chair(): BelongsTo
    {
        return $this->belongsTo(Chair::class);
    }

    /**
     * Usuario que creó este procedimiento
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Asignaciones de este procedimiento
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    /**
     * Asignación activa actual
     */
    public function activeAssignment(): HasOne
    {
        return $this->hasOne(Assignment::class)->where('status', 'activa');
    }

    /**
     * Verificar si está disponible
     */
    public function isAvailable(): bool
    {
        return $this->status === 'disponible';
    }

    /**
     * Verificar si está en proceso
     */
    public function isInProgress(): bool
    {
        return $this->status === 'proceso';
    }

    /**
     * Verificar si está finalizado
     */
    public function isCompleted(): bool
    {
        return $this->status === 'finalizado';
    }

    /**
     * Verificar si está contraindicado
     */
    public function isContraindicated(): bool
    {
        return $this->status === 'contraindicado';
    }

    /**
     * Obtener descripción completa del diente
     */
    public function getToothDescriptionAttribute(): ?string
    {
        if (!$this->tooth_fdi) {
            return null;
        }

        $description = "Diente {$this->tooth_fdi}";
        
        if ($this->tooth_surface) {
            $description .= " - Superficie: {$this->tooth_surface}";
        }

        return $description;
    }

    /**
     * Obtener precio formateado
     */
    public function getFormattedPriceAttribute(): ?string
    {
        if (!$this->estimated_price) {
            return null;
        }

        return number_format($this->estimated_price, 0, ',', '.');
    }

    /**
     * Scope para procedimientos disponibles
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'disponible');
    }

    /**
     * Scope para procedimientos en proceso
     */
    public function scopeInProgress($query)
    {
        return $query->where('status', 'proceso');
    }

    /**
     * Scope para procedimientos completados
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'finalizado');
    }

    /**
     * Scope para filtrar por cátedra
     */
    public function scopeByChair($query, $chairId)
    {
        return $query->where('chair_id', $chairId);
    }

    /**
     * Scope para filtrar por tratamiento
     */
    public function scopeByTreatment($query, $treatmentIds)
    {
        return $query->whereIn('treatment_id', (array) $treatmentIds);
    }

    /**
     * Scope para ordenar por prioridad
     */
    public function scopeOrderByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }
}
