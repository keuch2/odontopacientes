<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_subclasses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treatment_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->integer('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['treatment_id', 'active']);
        });

        // Add treatment_subclass_id to patient_procedures
        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->foreignId('treatment_subclass_id')->nullable()->after('treatment_id')
                  ->constrained('treatment_subclasses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->dropConstrainedForeignId('treatment_subclass_id');
        });
        Schema::dropIfExists('treatment_subclasses');
    }
};
