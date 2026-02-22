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
        Schema::create('odontogram_teeth', function (Blueprint $table) {
            $table->id();
            $table->foreignId('odontogram_id')->constrained()->onDelete('cascade');
            $table->string('tooth_fdi', 3); // Notación FDI (11, 12, 21, etc.)
            $table->string('surface', 10)->nullable(); // O, M, D, V, L, combinaciones
            $table->enum('status', [
                'sano', 
                'indicado', 
                'proceso', 
                'finalizado', 
                'contraindicado',
                'ausente',
                'extraido',
                'corona',
                'protesis'
            ])->default('sano');
            $table->string('color', 7)->nullable(); // Color hex para el estado
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['odontogram_id', 'tooth_fdi']);
            $table->index(['tooth_fdi', 'status']);
            $table->unique(['odontogram_id', 'tooth_fdi', 'surface'], 'unique_tooth_surface');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('odontogram_teeth');
    }
};
