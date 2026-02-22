<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE patient_procedures MODIFY COLUMN status ENUM('disponible','proceso','finalizado','contraindicado','ausente','cancelado') DEFAULT 'disponible'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE patient_procedures MODIFY COLUMN status ENUM('disponible','proceso','finalizado','contraindicado','ausente') DEFAULT 'disponible'");
    }
};
