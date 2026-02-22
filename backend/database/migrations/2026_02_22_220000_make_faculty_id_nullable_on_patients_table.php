<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable()->change();
        });

        // Update unique constraint to allow null faculty_id
        Schema::table('patients', function (Blueprint $table) {
            $table->dropUnique(['faculty_id', 'document_type', 'document_number']);
            $table->unique(['document_type', 'document_number']);
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropUnique(['document_type', 'document_number']);
            $table->unique(['faculty_id', 'document_type', 'document_number']);
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->foreignId('faculty_id')->nullable(false)->change();
        });
    }
};
