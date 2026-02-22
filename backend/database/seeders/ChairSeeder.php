<?php

namespace Database\Seeders;

use App\Models\Chair;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ChairSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $chairs = [
            [
                'key' => 'cirugias',
                'name' => 'Cirugías',
                'color' => '#ef4444',
                'description' => 'Cátedra de Cirugía Bucal y Maxilofacial',
                'sort_order' => 1,
            ],
            [
                'key' => 'periodoncia',
                'name' => 'Periodoncia',
                'color' => '#f97316',
                'description' => 'Cátedra de Periodoncia y Medicina Periodontal',
                'sort_order' => 2,
            ],
            [
                'key' => 'pediatria',
                'name' => 'Pediatría',
                'color' => '#eab308',
                'description' => 'Cátedra de Odontopediatría',
                'sort_order' => 3,
            ],
            [
                'key' => 'operatoria',
                'name' => 'Operatoria',
                'color' => '#22c55e',
                'description' => 'Cátedra de Operatoria Dental',
                'sort_order' => 4,
            ],
            [
                'key' => 'endodoncia',
                'name' => 'Endodoncia',
                'color' => '#06b6d4',
                'description' => 'Cátedra de Endodoncia',
                'sort_order' => 5,
            ],
            [
                'key' => 'protesis',
                'name' => 'Prótesis',
                'color' => '#3b82f6',
                'description' => 'Cátedra de Prótesis Fija y Removible',
                'sort_order' => 6,
            ],
            [
                'key' => 'preventiva',
                'name' => 'Preventiva',
                'color' => '#8b5cf6',
                'description' => 'Cátedra de Odontología Preventiva y Social',
                'sort_order' => 7,
            ],
            [
                'key' => 'implantes',
                'name' => 'Implantes',
                'color' => '#ec4899',
                'description' => 'Cátedra de Implantología',
                'sort_order' => 8,
            ],
        ];

        foreach ($chairs as $chair) {
            Chair::create($chair);
        }
    }
}
