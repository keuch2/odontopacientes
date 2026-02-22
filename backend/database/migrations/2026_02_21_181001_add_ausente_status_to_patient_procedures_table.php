<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE patient_procedures MODIFY COLUMN status ENUM('disponible', 'proceso', 'finalizado', 'contraindicado', 'ausente') DEFAULT 'disponible'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE patient_procedures MODIFY COLUMN status ENUM('disponible', 'proceso', 'finalizado', 'contraindicado') DEFAULT 'disponible'");
    }
};
