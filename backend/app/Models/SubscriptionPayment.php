<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_code',
        'amount',
        'currency',
        'period_days',
        'process_id',
        'status',
        'is_stub',
        'gateway_payload',
        'confirmed_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'period_days' => 'integer',
        'is_stub' => 'boolean',
        'gateway_payload' => 'array',
        'confirmed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
