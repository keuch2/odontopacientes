<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreatmentSubclassOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'treatment_subclass_id',
        'name',
        'sort_order',
        'active',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'active' => 'boolean',
    ];

    public function subclass(): BelongsTo
    {
        return $this->belongsTo(TreatmentSubclass::class, 'treatment_subclass_id');
    }

    public function patientProcedures(): HasMany
    {
        return $this->hasMany(PatientProcedure::class);
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}
