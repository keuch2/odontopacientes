<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_subclass_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('treatment_subclass_id')->constrained('treatment_subclasses')->onDelete('cascade');
            $table->string('name');
            $table->integer('sort_order')->default(0);
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index(['treatment_subclass_id', 'active']);
        });

        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->foreignId('treatment_subclass_option_id')->nullable()->after('treatment_subclass_id')
                  ->constrained('treatment_subclass_options')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('patient_procedures', function (Blueprint $table) {
            $table->dropConstrainedForeignId('treatment_subclass_option_id');
        });
        Schema::dropIfExists('treatment_subclass_options');
    }
};
