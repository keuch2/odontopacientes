<?php

namespace Database\Seeders;

use App\Models\University;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UniversitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $universities = [
            [
                'name' => 'Universidad Nacional de Asunción',
                'code' => 'UNA',
                'address' => 'Avda. España 1098, Asunción',
                'phone' => '+595 21 585 606',
                'email' => 'info@una.py',
                'website' => 'https://www.una.py'
            ],
            [
                'name' => 'Universidad Católica Nuestra Señora de la Asunción',
                'code' => 'UCA',
                'address' => 'Independencia Nacional y Comuneros',
                'phone' => '+595 21 441 044',
                'email' => 'info@uca.edu.py',
                'website' => 'https://www.uca.edu.py'
            ],
            [
                'name' => 'Universidad del Norte',
                'code' => 'UNINORTE',
                'address' => 'Acceso Sur km 14, Asunción',
                'phone' => '+595 21 585 700',
                'email' => 'informes@uninorte.edu.py',
                'website' => 'https://www.uninorte.edu.py'
            ],
            [
                'name' => 'Universidad Demo',
                'code' => 'DEMO',
                'address' => 'Calle Demo 123, Ciudad Demo',
                'phone' => '+595 21 000 000',
                'email' => 'info@demo.edu.py',
                'website' => 'https://demo.edu.py'
            ]
        ];

        foreach ($universities as $university) {
            University::create($university);
        }
    }
}
