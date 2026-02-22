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
        Schema::table('chairs', function (Blueprint $table) {
            $table->string('icon', 50)->nullable()->after('color');
            $table->foreignId('faculty_id')->nullable()->after('id')->constrained()->onDelete('set null');
        });

        Schema::table('treatments', function (Blueprint $table) {
            $table->boolean('applies_to_all_upper')->default(false)->after('requires_tooth');
            $table->boolean('applies_to_all_lower')->default(false)->after('applies_to_all_upper');
        });

        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->boolean('is_repair')->default(false)->after('tooth_surface');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chairs', function (Blueprint $table) {
            $table->dropColumn('icon');
            $table->dropForeign(['faculty_id']);
            $table->dropColumn('faculty_id');
        });

        Schema::table('treatments', function (Blueprint $table) {
            $table->dropColumn(['applies_to_all_upper', 'applies_to_all_lower']);
        });

        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->dropColumn('is_repair');
        });
    }
};
