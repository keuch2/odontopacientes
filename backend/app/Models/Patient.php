<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'faculty_id',
        'first_name',
        'last_name',
        'document_type',
        'document_number',
        'birthdate',
        'gender',
        'city',
        'address',
        'phone',
        'emergency_contact',
        'emergency_phone',
        'university_registered_at',
        'created_by',
        'has_allergies',
        'allergies_description',
        'takes_medication',
        'medication_description',
        'has_systemic_disease',
        'systemic_disease_description',
        'is_pediatric',
        'is_pregnant',
        'has_bleeding_disorder',
        'bleeding_disorder_description',
        'has_heart_condition',
        'heart_condition_description',
        'has_diabetes',
        'diabetes_description',
        'has_hypertension',
        'smokes',
        'other_conditions',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'university_registered_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'has_allergies' => 'boolean',
        'takes_medication' => 'boolean',
        'has_systemic_disease' => 'boolean',
        'is_pediatric' => 'boolean',
        'is_pregnant' => 'boolean',
        'has_bleeding_disorder' => 'boolean',
        'has_heart_condition' => 'boolean',
        'has_diabetes' => 'boolean',
        'has_hypertension' => 'boolean',
        'smokes' => 'boolean',
    ];

    /**
     * Facultad a la que pertenece este paciente
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    /**
     * Usuario que creó este paciente
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Consentimientos de este paciente
     */
    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    /**
     * Procedimientos de este paciente
     */
    public function patientProcedures(): HasMany
    {
        return $this->hasMany(PatientProcedure::class);
    }

    /**
     * Odontogramas de este paciente
     */
    public function odontograms(): HasMany
    {
        return $this->hasMany(Odontogram::class);
    }

    /**
     * Obtener nombre completo
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Obtener edad
     */
    public function getAgeAttribute(): int
    {
        return Carbon::parse($this->birthdate)->age;
    }

    /**
     * Obtener documento completo
     */
    public function getFullDocumentAttribute(): string
    {
        return "{$this->document_type}: {$this->document_number}";
    }

    /**
     * Procedimientos disponibles
     */
    public function availableProcedures()
    {
        return $this->patientProcedures()->where('status', 'disponible');
    }

    /**
     * Procedimientos en proceso
     */
    public function inProgressProcedures()
    {
        return $this->patientProcedures()->where('status', 'proceso');
    }

    /**
     * Procedimientos finalizados
     */
    public function completedProcedures()
    {
        return $this->patientProcedures()->where('status', 'finalizado');
    }

    /**
     * Procedimientos contraindicados
     */
    public function contraindicatedProcedures()
    {
        return $this->patientProcedures()->where('status', 'contraindicado');
    }

    /**
     * Verificar si tiene consentimiento válido
     */
    public function hasValidConsent(): bool
    {
        return $this->consents()->where('valid', true)->exists();
    }

    /**
     * Scope para búsqueda por nombre
     */
    public function scopeSearchByName($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('first_name', 'like', "%{$search}%")
              ->orWhere('last_name', 'like', "%{$search}%")
              ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
        });
    }

    /**
     * Scope para filtrar por ciudad
     */
    public function scopeByCity($query, $city)
    {
        return $query->where('city', $city);
    }

    /**
     * Scope para filtrar por facultad
     */
    public function scopeByFaculty($query, $facultyId)
    {
        return $query->where('faculty_id', $facultyId);
    }
}
