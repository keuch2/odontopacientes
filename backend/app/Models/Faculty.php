<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Faculty extends Model
{
    use HasFactory;

    protected $fillable = [
        'university_id',
        'name',
        'code',
        'address',
        'phone',
        'email',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Universidad a la que pertenece esta facultad
     */
    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    /**
     * Usuarios de esta facultad
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Pacientes de esta facultad
     */
    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }
}
