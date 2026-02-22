<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Audit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'entity',
        'entity_id',
        'meta',
        'ip',
        'user_agent',
    ];

    protected $casts = [
        'meta' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Usuario que realizó la acción
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtener descripción formateada de la acción
     */
    public function getFormattedActionAttribute(): string
    {
        $actions = [
            'created' => 'creó',
            'updated' => 'actualizó',
            'deleted' => 'eliminó',
            'assigned' => 'asignó',
            'completed' => 'completó',
            'cancelled' => 'canceló',
            'restored' => 'restauró',
            'login' => 'inició sesión',
            'logout' => 'cerró sesión',
            'viewed' => 'visualizó',
            'downloaded' => 'descargó',
            'uploaded' => 'subió',
        ];

        return $actions[$this->action] ?? $this->action;
    }

    /**
     * Obtener nombre formateado de la entidad
     */
    public function getFormattedEntityAttribute(): string
    {
        $entities = [
            'Patient' => 'Paciente',
            'PatientProcedure' => 'Procedimiento',
            'Assignment' => 'Asignación',
            'Treatment' => 'Tratamiento',
            'Chair' => 'Cátedra',
            'User' => 'Usuario',
            'Consent' => 'Consentimiento',
            'Odontogram' => 'Odontograma',
            'Notification' => 'Notificación',
        ];

        return $entities[$this->entity] ?? $this->entity;
    }

    /**
     * Obtener descripción completa de la auditoría
     */
    public function getDescriptionAttribute(): string
    {
        $userName = $this->user->name ?? 'Usuario desconocido';
        $action = $this->formatted_action;
        $entity = $this->formatted_entity;
        
        return "{$userName} {$action} {$entity} #{$this->entity_id}";
    }

    /**
     * Obtener color para el tipo de acción
     */
    public function getActionColorAttribute(): string
    {
        return match($this->action) {
            'created' => '#22c55e',
            'updated' => '#3b82f6',
            'deleted' => '#ef4444',
            'assigned' => '#8b5cf6',
            'completed' => '#06b6d4',
            'cancelled' => '#f97316',
            'login' => '#10b981',
            'logout' => '#6b7280',
            default => '#6b7280'
        };
    }

    /**
     * Scope para auditorías por acción
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope para auditorías por entidad
     */
    public function scopeByEntity($query, $entity, $entityId = null)
    {
        $query = $query->where('entity', $entity);
        
        if ($entityId) {
            $query->where('entity_id', $entityId);
        }
        
        return $query;
    }

    /**
     * Scope para auditorías por usuario
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para auditorías recientes
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope para auditorías por IP
     */
    public function scopeByIp($query, $ip)
    {
        return $query->where('ip', $ip);
    }

    /**
     * Crear registro de auditoría estática
     */
    public static function log(string $action, string $entity, int $entityId, array $meta = []): self
    {
        return self::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'meta' => $meta,
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
