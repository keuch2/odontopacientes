<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'faculty_id',
        'university_id',
        'phone',
        'active',
        'last_login_at',
        'city',
        'institution',
        'course',
        'facebook',
        'instagram',
        'tiktok',
        'profile_image',
        'birth_date',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'active' => 'boolean',
    ];

    /**
     * Facultad a la que pertenece este usuario
     */
    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }

    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    /**
     * Información adicional de estudiante (si aplica)
     */
    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    /**
     * Pacientes creados por este usuario
     */
    public function createdPatients(): HasMany
    {
        return $this->hasMany(Patient::class, 'created_by');
    }

    /**
     * Asignaciones de este usuario (si es estudiante)
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'student_id');
    }

    /**
     * Notificaciones de este usuario
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Auditorías realizadas por este usuario
     */
    public function audits(): HasMany
    {
        return $this->hasMany(Audit::class);
    }

    /**
     * Verificar si el usuario es administrador
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Verificar si el usuario es coordinador
     */
    public function isCoordinator(): bool
    {
        return $this->role === 'coordinador';
    }

    /**
     * Verificar si el usuario es de admisión
     */
    public function isAdmissions(): bool
    {
        return $this->role === 'admision';
    }

    /**
     * Verificar si el usuario es estudiante
     */
    public function isStudent(): bool
    {
        return $this->role === 'alumno';
    }
}
