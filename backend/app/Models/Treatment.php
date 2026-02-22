<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Treatment extends Model
{
    use HasFactory;

    protected $fillable = [
        'chair_id',
        'name',
        'code',
        'description',
        'requires_tooth',
        'applies_to_all_upper',
        'applies_to_all_lower',
        'estimated_sessions',
        'base_price',
        'sort_order',
        'active',
    ];

    protected $casts = [
        'requires_tooth' => 'boolean',
        'applies_to_all_upper' => 'boolean',
        'applies_to_all_lower' => 'boolean',
        'estimated_sessions' => 'integer',
        'base_price' => 'decimal:2',
        'sort_order' => 'integer',
        'active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Cátedra a la que pertenece este tratamiento
     */
    public function chair(): BelongsTo
    {
        return $this->belongsTo(Chair::class);
    }

    /**
     * Procedimientos de pacientes con este tratamiento
     */
    public function patientProcedures(): HasMany
    {
        return $this->hasMany(PatientProcedure::class);
    }

    /**
     * Scope para tratamientos activos
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope para ordenar por orden de clasificación
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Obtener precio formateado
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->base_price, 0, ',', '.');
    }
}
