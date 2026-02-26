<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('procedure_photos', function (Blueprint $table) {
            // Add patient_procedure_id for photos uploaded directly to a procedure (without assignment)
            $table->foreignId('patient_procedure_id')->nullable()->after('assignment_id')
                  ->constrained('patient_procedures')->nullOnDelete();

            // Make assignment_id nullable (photos can now belong to procedure directly)
            $table->foreignId('assignment_id')->nullable()->change();

            $table->index(['patient_procedure_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('procedure_photos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('patient_procedure_id');
            $table->dropIndex(['patient_procedure_id', 'created_at']);
            $table->foreignId('assignment_id')->nullable(false)->change();
        });
    }
};
