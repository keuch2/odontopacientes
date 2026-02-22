<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('city', 100)->nullable()->after('phone');
            $table->string('institution', 255)->nullable()->after('city');
            $table->string('course', 100)->nullable()->after('institution');
            $table->string('facebook', 255)->nullable()->after('course');
            $table->string('instagram', 255)->nullable()->after('facebook');
            $table->string('tiktok', 255)->nullable()->after('instagram');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['city', 'institution', 'course', 'facebook', 'instagram', 'tiktok']);
        });
    }
};
