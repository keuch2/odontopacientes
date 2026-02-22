<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consent extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'type',
        'file_path',
        'signed_at',
        'signer_name',
        'signer_relationship',
        'valid',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'signed_at' => 'datetime',
        'valid' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Paciente al que pertenece este consentimiento
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Usuario que creó este consentimiento
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Verificar si es válido
     */
    public function isValid(): bool
    {
        return $this->valid;
    }

    /**
     * Verificar si tiene archivo adjunto
     */
    public function hasFile(): bool
    {
        return !empty($this->file_path);
    }

    /**
     * Obtener URL del archivo
     */
    public function getFileUrlAttribute(): ?string
    {
        if (!$this->hasFile()) {
            return null;
        }

        return asset('storage/' . $this->file_path);
    }

    /**
     * Obtener tipo formateado
     */
    public function getFormattedTypeAttribute(): string
    {
        return match($this->type) {
            'general' => 'Consentimiento General',
            'specific_treatment' => 'Consentimiento Específico',
            'surgery' => 'Consentimiento Quirúrgico',
            'anesthesia' => 'Consentimiento Anestésico',
            'orthodontics' => 'Consentimiento Ortodoncia',
            default => ucfirst($this->type)
        };
    }

    /**
     * Obtener relación formateada
     */
    public function getFormattedRelationshipAttribute(): string
    {
        return match($this->signer_relationship) {
            'self' => 'El mismo paciente',
            'parent' => 'Padre/Madre',
            'guardian' => 'Tutor legal',
            'spouse' => 'Cónyuge',
            'relative' => 'Familiar',
            default => ucfirst($this->signer_relationship ?? 'No especificado')
        };
    }

    /**
     * Scope para consentimientos válidos
     */
    public function scopeValid($query)
    {
        return $query->where('valid', true);
    }

    /**
     * Scope para consentimientos por tipo
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope para consentimientos recientes
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('signed_at', '>=', now()->subDays($days));
    }
}
