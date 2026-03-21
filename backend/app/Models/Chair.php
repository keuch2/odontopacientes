<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chair extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'color',
        'icon',
        'icon_url',
        'description',
        'sort_order',
        'active',
        'faculty_id',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Tratamientos de esta cátedra
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Faculty::class);
    }

    public function treatments(): HasMany
    {
        return $this->hasMany(Treatment::class)->orderBy('sort_order');
    }

    /**
     * Procedimientos de pacientes de esta cátedra
     */
    public function patientProcedures(): HasMany
    {
        return $this->hasMany(PatientProcedure::class);
    }

    /**
     * Scope para cátedras activas
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
}
