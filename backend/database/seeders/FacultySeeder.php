<?php

namespace Database\Seeders;

use App\Models\Faculty;
use App\Models\University;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FacultySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faculties = [
            [
                'university_code' => 'UNA',
                'name' => 'Facultad de Odontología',
                'code' => 'ODON',
                'address' => 'Av. Brasil y Dr. Montero, Asunción',
                'phone' => '+595 21 585 562',
                'email' => 'odontologia@una.py'
            ],
            [
                'university_code' => 'UCA',
                'name' => 'Facultad de Ciencias de la Salud',
                'code' => 'SALUD',
                'address' => 'Independencia Nacional y Comuneros',
                'phone' => '+595 21 441 044',
                'email' => 'salud@uca.edu.py'
            ],
            [
                'university_code' => 'UNINORTE',
                'name' => 'Facultad de Odontología',
                'code' => 'ODON',
                'address' => 'Acceso Sur km 14, Asunción',
                'phone' => '+595 21 585 700',
                'email' => 'odontologia@uninorte.edu.py'
            ],
            [
                'university_code' => 'DEMO',
                'name' => 'Facultad de Odontología Demo',
                'code' => 'ODON-DEMO',
                'address' => 'Calle Demo 123, Ciudad Demo',
                'phone' => '+595 21 000 001',
                'email' => 'odontologia@demo.edu.py'
            ]
        ];

        foreach ($faculties as $facultyData) {
            $university = University::where('code', $facultyData['university_code'])->first();
            
            if ($university) {
                Faculty::create([
                    'university_id' => $university->id,
                    'name' => $facultyData['name'],
                    'code' => $facultyData['code'],
                    'address' => $facultyData['address'],
                    'phone' => $facultyData['phone'],
                    'email' => $facultyData['email'],
                ]);
            }
        }
    }
}
