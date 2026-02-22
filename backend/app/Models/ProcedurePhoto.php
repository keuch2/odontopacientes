<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProcedurePhoto extends Model
{
    use HasFactory;

    protected $fillable = [
        'assignment_id',
        'file_path',
        'file_name',
        'mime_type',
        'size',
        'description',
        'taken_at',
        'created_by',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Assignment al que pertenece esta foto
     */
    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    /**
     * Usuario que subió la foto
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Obtener URL completa de la foto
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    /**
     * Obtener URL completa con dominio
     */
    public function getFullUrlAttribute(): string
    {
        return url(Storage::url($this->file_path));
    }

    /**
     * Verificar si el archivo existe
     */
    public function fileExists(): bool
    {
        return Storage::exists($this->file_path);
    }

    /**
     * Eliminar archivo físico
     */
    public function deleteFile(): bool
    {
        if ($this->fileExists()) {
            return Storage::delete($this->file_path);
        }
        return true;
    }

    /**
     * Obtener tamaño formateado
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    /**
     * Boot method para eliminar archivo al borrar registro
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($photo) {
            $photo->deleteFile();
        });
    }
}
