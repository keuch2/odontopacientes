<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'university_id',
        'year',
        'student_number',
        'phone',
    ];

    protected $casts = [
        'year' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Usuario asociado a este estudiante
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Universidad del estudiante
     */
    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    /**
     * Obtener nombre completo del estudiante
     */
    public function getFullNameAttribute(): string
    {
        return $this->user->name;
    }

    /**
     * Obtener email del estudiante
     */
    public function getEmailAttribute(): string
    {
        return $this->user->email;
    }
}
