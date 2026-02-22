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
        Schema::table('patients', function (Blueprint $table) {
            // Campos de Anamnesis (Historial Médico)
            $table->boolean('has_allergies')->default(false)->after('emergency_phone');
            $table->text('allergies_description')->nullable()->after('has_allergies');
            
            $table->boolean('takes_medication')->default(false)->after('allergies_description');
            $table->text('medication_description')->nullable()->after('takes_medication');
            
            $table->boolean('has_systemic_disease')->default(false)->after('medication_description');
            $table->text('systemic_disease_description')->nullable()->after('has_systemic_disease');
            
            $table->boolean('is_pregnant')->nullable()->after('systemic_disease_description');
            
            $table->boolean('has_bleeding_disorder')->default(false)->after('is_pregnant');
            $table->text('bleeding_disorder_description')->nullable()->after('has_bleeding_disorder');
            
            $table->boolean('has_heart_condition')->default(false)->after('bleeding_disorder_description');
            $table->text('heart_condition_description')->nullable()->after('has_heart_condition');
            
            $table->boolean('has_diabetes')->default(false)->after('heart_condition_description');
            $table->text('diabetes_description')->nullable()->after('has_diabetes');
            
            $table->boolean('has_hypertension')->default(false)->after('diabetes_description');
            
            $table->boolean('smokes')->default(false)->after('has_hypertension');
            
            $table->text('other_conditions')->nullable()->after('smokes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'has_allergies',
                'allergies_description',
                'takes_medication',
                'medication_description',
                'has_systemic_disease',
                'systemic_disease_description',
                'is_pregnant',
                'has_bleeding_disorder',
                'bleeding_disorder_description',
                'has_heart_condition',
                'heart_condition_description',
                'has_diabetes',
                'diabetes_description',
                'has_hypertension',
                'smokes',
                'other_conditions',
            ]);
        });
    }
};
