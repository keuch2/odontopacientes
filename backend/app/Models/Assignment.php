<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_procedure_id',
        'student_id',
        'started_at',
        'finished_at',
        'notes',
        'status',
        'sessions_completed',
        'final_price',
        'final_notes',
        'completed_at',
        'abandoned_at',
        'abandon_reason',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'completed_at' => 'datetime',
        'abandoned_at' => 'datetime',
        'sessions_completed' => 'integer',
        'final_price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Procedimiento del paciente asignado
     */
    public function patientProcedure(): BelongsTo
    {
        return $this->belongsTo(PatientProcedure::class);
    }

    /**
     * Estudiante asignado
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Fotos del procedimiento
     */
    public function photos()
    {
        return $this->hasMany(ProcedurePhoto::class);
    }

    /**
     * Verificar si está activa
     */
    public function isActive(): bool
    {
        return $this->status === 'activa';
    }

    /**
     * Verificar si está completada
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completada';
    }

    /**
     * Verificar si fue abandonada
     */
    public function isAbandoned(): bool
    {
        return $this->status === 'abandonada';
    }

    /**
     * Obtener duración en días
     */
    public function getDurationInDaysAttribute(): ?int
    {
        if (!$this->finished_at) {
            return Carbon::parse($this->started_at)->diffInDays(now());
        }

        return Carbon::parse($this->started_at)->diffInDays($this->finished_at);
    }

    /**
     * Obtener precio final formateado
     */
    public function getFormattedFinalPriceAttribute(): ?string
    {
        if (!$this->final_price) {
            return null;
        }

        return number_format($this->final_price, 0, ',', '.');
    }

    /**
     * Obtener progreso de sesiones
     */
    public function getSessionProgressAttribute(): array
    {
        $estimated = $this->patientProcedure->treatment->estimated_sessions ?? 1;
        $completed = $this->sessions_completed;
        
        return [
            'completed' => $completed,
            'estimated' => $estimated,
            'percentage' => $estimated > 0 ? round(($completed / $estimated) * 100, 1) : 0
        ];
    }

    /**
     * Scope para asignaciones activas
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'activa');
    }

    /**
     * Scope para asignaciones completadas
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completada');
    }

    /**
     * Scope para asignaciones por estudiante
     */
    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Scope para asignaciones recientes
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('started_at', '>=', now()->subDays($days));
    }
}
