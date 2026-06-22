<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Plan de uso del usuario: 'basico' (solo lectura, sin contactos del
     * paciente) o 'premium' (acceso completo). Todos arrancan en 'basico'.
     * plan_expires_at = null significa sin expiración (Premium permanente
     * otorgado manualmente por un admin).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan', 20)->default('basico')->after('role');
            $table->timestamp('plan_expires_at')->nullable()->after('plan');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['plan', 'plan_expires_at']);
        });
    }
};
