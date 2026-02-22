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
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_procedure_id')->constrained()->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('finished_at')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['activa', 'completada', 'abandonada'])->default('activa');
            $table->integer('sessions_completed')->default(0);
            $table->decimal('final_price', 10, 2)->nullable(); // Precio final (hasta 99,999,999.99)
            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['patient_procedure_id', 'status']);
            $table->unique(['patient_procedure_id', 'student_id', 'status'], 'unique_active_assignment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};
