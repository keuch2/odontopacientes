<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeders en orden
        // 1. Crear usuarios demo para pruebas
        \App\Models\User::create([
            'name' => 'Admin Demo',
            'email' => 'admin@demo.test',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'admin',
        ]);

        \App\Models\User::create([
            'name' => 'Coordinador Demo',
            'email' => 'coordinador@demo.test',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'coordinador',
        ]);

        \App\Models\User::create([
            'name' => 'Estudiante Demo',
            'email' => 'alumno@demo.test',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'alumno',
        ]);

        \App\Models\User::create([
            'name' => 'Admisión Demo',
            'email' => 'admision@demo.test',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'role' => 'admision',
        ]);

        // 2. Ejecutar seeders de datos base
        $this->call([
            UniversitySeeder::class,
            FacultySeeder::class,
            ChairSeeder::class,
            TreatmentSeeder::class,
            PatientSeeder::class,
            PatientProcedureSeeder::class,
        ]);
    }
}
