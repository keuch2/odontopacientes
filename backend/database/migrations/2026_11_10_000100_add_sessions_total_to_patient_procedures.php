<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->unsignedSmallInteger('sessions_total')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->dropColumn('sessions_total');
        });
    }
};
