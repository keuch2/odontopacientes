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
        Schema::create('patient_procedures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('treatment_id')->constrained()->onDelete('cascade');
            $table->foreignId('chair_id')->constrained()->onDelete('cascade');
            $table->string('tooth_fdi', 3)->nullable(); // Notación FDI del diente (11, 12, 21, etc.)
            $table->string('tooth_surface', 10)->nullable(); // Superficie (O, M, D, V, L, combinaciones)
            $table->enum('status', ['disponible', 'proceso', 'finalizado', 'contraindicado'])->default('disponible');
            $table->text('notes')->nullable();
            $table->text('contraindication_reason')->nullable(); // Razón si está contraindicado
            $table->decimal('estimated_price', 10, 2)->nullable(); // Precio estimado (hasta 99,999,999.99)
            $table->integer('priority')->default(0); // Prioridad del tratamiento
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['patient_id', 'status']);
            $table->index(['chair_id', 'status']);
            $table->index(['treatment_id', 'status']);
            $table->index(['tooth_fdi', 'status']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_procedures');
    }
};
