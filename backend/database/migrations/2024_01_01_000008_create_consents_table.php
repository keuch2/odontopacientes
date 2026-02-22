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
        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->string('type')->default('general'); // general, specific_treatment, etc.
            $table->string('file_path')->nullable(); // Ruta al archivo escaneado
            $table->timestamp('signed_at');
            $table->string('signer_name'); // Nombre de quien firma
            $table->string('signer_relationship')->nullable(); // Relación con el paciente (self, parent, guardian)
            $table->boolean('valid')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->index(['patient_id', 'type', 'valid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consents');
    }
};
