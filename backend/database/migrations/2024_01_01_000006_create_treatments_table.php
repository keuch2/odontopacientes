<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('treatments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chair_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('code', 20)->unique(); // Código de tratamiento
            $table->text('description')->nullable();
            $table->boolean('requires_tooth')->default(false); // Si requiere especificar diente
            $table->integer('estimated_sessions')->default(1); // Sesiones estimadas
            $table->decimal('base_price', 10, 2)->nullable(); // Precio base referencial (hasta 99,999,999.99)
            $table->integer('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['chair_id', 'active']);
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('treatments');
    }
};
