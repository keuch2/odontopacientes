<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // El índice incluía el estado e impedía abandonar dos veces el mismo caso.
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropUnique('unique_active_assignment');
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->unique(['patient_procedure_id', 'student_id', 'status'], 'unique_active_assignment');
        });
    }
};
