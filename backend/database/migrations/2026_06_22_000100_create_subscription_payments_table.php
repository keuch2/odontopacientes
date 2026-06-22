<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de operaciones de pago de suscripción (Bancard vPOS).
     * Se usa para auditar el flujo y garantizar idempotencia del webhook de
     * confirmación (un mismo process_id no debe activar Premium dos veces).
     */
    public function up(): void
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('plan_code', 40);              // ej. 'premium_monthly'
            $table->unsignedInteger('amount')->default(0); // monto en guaraníes
            $table->string('currency', 8)->default('PYG');
            $table->unsignedInteger('period_days')->default(30); // vigencia que otorga
            $table->string('process_id', 191)->unique();  // id de la operación Bancard
            $table->string('status', 20)->default('pending'); // pending|confirmed|failed
            $table->boolean('is_stub')->default(false);    // operación simulada (sin credenciales)
            $table->json('gateway_payload')->nullable();    // respuesta cruda del gateway
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_payments');
    }
};
