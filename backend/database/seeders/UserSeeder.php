<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demoFaculty = Faculty::where('code', 'ODON-DEMO')->first();

        // Usuario administrador
        $admin = User::create([
            'name' => 'Administrador Demo',
            'email' => 'admin@demo.test',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'faculty_id' => $demoFaculty->id,
            'phone' => '+595 981 000 001',
            'email_verified_at' => now(),
        ]);

        // Usuario coordinador
        $coordinador = User::create([
            'name' => 'Dr. María González',
            'email' => 'coordinador@demo.test',
            'password' => Hash::make('password'),
            'role' => 'coordinador',
            'faculty_id' => $demoFaculty->id,
            'phone' => '+595 981 000 002',
            'email_verified_at' => now(),
        ]);

        // Usuario de admisión
        $admision = User::create([
            'name' => 'Ana López',
            'email' => 'admision@demo.test',
            'password' => Hash::make('password'),
            'role' => 'admision',
            'faculty_id' => $demoFaculty->id,
            'phone' => '+595 981 000 003',
            'email_verified_at' => now(),
        ]);

        // Usuarios estudiantes
        $estudiantes = [
            [
                'name' => 'Juan Pérez',
                'email' => 'alumno@demo.test',
                'student_number' => '2024001',
                'year' => 2024,
                'phone' => '+595 981 100 001',
            ],
            [
                'name' => 'María Rodríguez',
                'email' => 'maria.rodriguez@demo.test',
                'student_number' => '2024002',
                'year' => 2024,
                'phone' => '+595 981 100 002',
            ],
            [
                'name' => 'Carlos Fernández',
                'email' => 'carlos.fernandez@demo.test',
                'student_number' => '2024003',
                'year' => 2024,
                'phone' => '+595 981 100 003',
            ],
            [
                'name' => 'Ana Silva',
                'email' => 'ana.silva@demo.test',
                'student_number' => '2023045',
                'year' => 2023,
                'phone' => '+595 981 100 004',
            ],
            [
                'name' => 'Pedro Martínez',
                'email' => 'pedro.martinez@demo.test',
                'student_number' => '2023046',
                'year' => 2023,
                'phone' => '+595 981 100 005',
            ]
        ];

        foreach ($estudiantes as $estudianteData) {
            $user = User::create([
                'name' => $estudianteData['name'],
                'email' => $estudianteData['email'],
                'password' => Hash::make('password'),
                'role' => 'alumno',
                'faculty_id' => $demoFaculty->id,
                'phone' => $estudianteData['phone'],
                'email_verified_at' => now(),
            ]);

            // Crear registro de estudiante
            Student::create([
                'user_id' => $user->id,
                'university_id' => $demoFaculty->university_id,
                'year' => $estudianteData['year'],
                'student_number' => $estudianteData['student_number'],
                'phone' => $estudianteData['phone'],
            ]);
        }
    }
}
