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
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('faculty_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('document_type', 10)->default('CI'); // CI, RUC, etc.
            $table->string('document_number', 20)->nullable();
            $table->date('birthdate');
            $table->enum('gender', ['M', 'F', 'Other'])->nullable();
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->timestamp('university_registered_at')->nullable(); // Cuándo se registró en el sistema universitario
            $table->foreignId('created_by')->constrained('users'); // Usuario que creó el paciente
            $table->timestamps();

            $table->index(['faculty_id', 'created_at']);
            $table->index(['city', 'created_at']);
            $table->index(['last_name', 'first_name']);
            $table->unique(['faculty_id', 'document_type', 'document_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
