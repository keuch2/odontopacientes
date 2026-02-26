<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatment_subclass_options', function (Blueprint $table) {
            // Add treatment_id column
            $table->foreignId('treatment_id')->nullable()->after('id')
                  ->constrained('treatments')->onDelete('cascade');
        });

        // Migrate existing data: set treatment_id from the subclass's treatment
        DB::statement('
            UPDATE treatment_subclass_options o
            JOIN treatment_subclasses s ON o.treatment_subclass_id = s.id
            SET o.treatment_id = s.treatment_id
        ');

        // Drop old foreign key and column
        Schema::table('treatment_subclass_options', function (Blueprint $table) {
            $table->dropForeign(['treatment_subclass_id']);
            $table->dropColumn('treatment_subclass_id');
        });

        // Update index
        Schema::table('treatment_subclass_options', function (Blueprint $table) {
            $table->index(['treatment_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::table('treatment_subclass_options', function (Blueprint $table) {
            $table->dropIndex(['treatment_id', 'active']);
            $table->foreignId('treatment_subclass_id')->nullable()->after('treatment_id')
                  ->constrained('treatment_subclasses')->onDelete('cascade');
            $table->dropForeign(['treatment_id']);
            $table->dropColumn('treatment_id');
        });
    }
};
