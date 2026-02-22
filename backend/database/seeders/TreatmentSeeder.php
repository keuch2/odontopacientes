<?php

namespace Database\Seeders;

use App\Models\Chair;
use App\Models\Treatment;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TreatmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $treatmentsByChair = [
            'cirugias' => [
                ['name' => 'Exodoncia Simple', 'code' => 'CIR-001', 'requires_tooth' => true, 'sessions' => 1, 'price' => 50000],
                ['name' => 'Exodoncia Complicada', 'code' => 'CIR-002', 'requires_tooth' => true, 'sessions' => 1, 'price' => 100000],
                ['name' => 'Extracción de 3ros Molares', 'code' => 'CIR-003', 'requires_tooth' => true, 'sessions' => 1, 'price' => 150000],
                ['name' => 'Cirugía de Quistes', 'code' => 'CIR-004', 'requires_tooth' => false, 'sessions' => 2, 'price' => 300000],
                ['name' => 'Frenectomía', 'code' => 'CIR-005', 'requires_tooth' => false, 'sessions' => 1, 'price' => 80000],
            ],
            'periodoncia' => [
                ['name' => 'Profilaxis', 'code' => 'PER-001', 'requires_tooth' => false, 'sessions' => 1, 'price' => 60000],
                ['name' => 'Curetaje Cerrado', 'code' => 'PER-002', 'requires_tooth' => true, 'sessions' => 2, 'price' => 80000],
                ['name' => 'Curetaje Abierto', 'code' => 'PER-003', 'requires_tooth' => true, 'sessions' => 3, 'price' => 150000],
                ['name' => 'Injerto de Encía', 'code' => 'PER-004', 'requires_tooth' => true, 'sessions' => 2, 'price' => 200000],
                ['name' => 'Gingivectomía', 'code' => 'PER-005', 'requires_tooth' => true, 'sessions' => 1, 'price' => 100000],
            ],
            'pediatria' => [
                ['name' => 'Control y Prevención', 'code' => 'PED-001', 'requires_tooth' => false, 'sessions' => 1, 'price' => 40000],
                ['name' => 'Sellado de Fosetas', 'code' => 'PED-002', 'requires_tooth' => true, 'sessions' => 1, 'price' => 30000],
                ['name' => 'Obturación en Diente Temporal', 'code' => 'PED-003', 'requires_tooth' => true, 'sessions' => 1, 'price' => 50000],
                ['name' => 'Pulpotomía', 'code' => 'PED-004', 'requires_tooth' => true, 'sessions' => 2, 'price' => 80000],
                ['name' => 'Corona de Acero', 'code' => 'PED-005', 'requires_tooth' => true, 'sessions' => 2, 'price' => 120000],
            ],
            'operatoria' => [
                ['name' => 'Caries Clase I', 'code' => 'OP-001', 'requires_tooth' => true, 'sessions' => 1, 'price' => 60000],
                ['name' => 'Caries Clase II', 'code' => 'OP-002', 'requires_tooth' => true, 'sessions' => 1, 'price' => 70000],
                ['name' => 'Caries Clase III', 'code' => 'OP-003', 'requires_tooth' => true, 'sessions' => 1, 'price' => 65000],
                ['name' => 'Caries Clase IV', 'code' => 'OP-004', 'requires_tooth' => true, 'sessions' => 2, 'price' => 80000],
                ['name' => 'Caries Clase V', 'code' => 'OP-005', 'requires_tooth' => true, 'sessions' => 1, 'price' => 60000],
                ['name' => 'Caries Clase VI', 'code' => 'OP-006', 'requires_tooth' => true, 'sessions' => 1, 'price' => 55000],
            ],
            'endodoncia' => [
                ['name' => 'Endodoncia Unirradicular', 'code' => 'END-001', 'requires_tooth' => true, 'sessions' => 3, 'price' => 200000],
                ['name' => 'Endodoncia Birradicular', 'code' => 'END-002', 'requires_tooth' => true, 'sessions' => 4, 'price' => 250000],
                ['name' => 'Endodoncia Multirradicular', 'code' => 'END-003', 'requires_tooth' => true, 'sessions' => 5, 'price' => 300000],
                ['name' => 'Retratamiento Endodóntico', 'code' => 'END-004', 'requires_tooth' => true, 'sessions' => 4, 'price' => 350000],
                ['name' => 'Apexificación', 'code' => 'END-005', 'requires_tooth' => true, 'sessions' => 6, 'price' => 400000],
            ],
            'protesis' => [
                ['name' => 'Prótesis Parcial Removible', 'code' => 'PROT-001', 'requires_tooth' => false, 'sessions' => 6, 'price' => 500000],
                ['name' => 'Prótesis Total Superior', 'code' => 'PROT-002', 'requires_tooth' => false, 'sessions' => 8, 'price' => 600000],
                ['name' => 'Prótesis Total Inferior', 'code' => 'PROT-003', 'requires_tooth' => false, 'sessions' => 8, 'price' => 600000],
                ['name' => 'Corona de Porcelana', 'code' => 'PROT-004', 'requires_tooth' => true, 'sessions' => 4, 'price' => 400000],
                ['name' => 'Puente Fijo', 'code' => 'PROT-005', 'requires_tooth' => false, 'sessions' => 6, 'price' => 800000],
            ],
            'preventiva' => [
                ['name' => 'Diagnóstico y Plan de Tratamiento', 'code' => 'PREV-001', 'requires_tooth' => false, 'sessions' => 1, 'price' => 50000],
                ['name' => 'Educación en Higiene Oral', 'code' => 'PREV-002', 'requires_tooth' => false, 'sessions' => 1, 'price' => 30000],
                ['name' => 'Aplicación de Flúor', 'code' => 'PREV-003', 'requires_tooth' => false, 'sessions' => 1, 'price' => 40000],
                ['name' => 'Control Postoperatorio', 'code' => 'PREV-004', 'requires_tooth' => false, 'sessions' => 1, 'price' => 25000],
                ['name' => 'Radiografías Diagnósticas', 'code' => 'PREV-005', 'requires_tooth' => false, 'sessions' => 1, 'price' => 35000],
            ],
            'implantes' => [
                ['name' => 'Colocación de Implante Unitario', 'code' => 'IMP-001', 'requires_tooth' => true, 'sessions' => 2, 'price' => 800000],
                ['name' => 'Corona sobre Implante', 'code' => 'IMP-002', 'requires_tooth' => true, 'sessions' => 3, 'price' => 500000],
                ['name' => 'Implantes Múltiples', 'code' => 'IMP-003', 'requires_tooth' => false, 'sessions' => 4, 'price' => 1500000],
                ['name' => 'Prótesis sobre Implantes', 'code' => 'IMP-004', 'requires_tooth' => false, 'sessions' => 6, 'price' => 2000000],
                ['name' => 'Regeneración Ósea', 'code' => 'IMP-005', 'requires_tooth' => false, 'sessions' => 2, 'price' => 600000],
            ],
        ];

        foreach ($treatmentsByChair as $chairKey => $treatments) {
            $chair = Chair::where('key', $chairKey)->first();
            
            if ($chair) {
                foreach ($treatments as $index => $treatmentData) {
                    Treatment::create([
                        'chair_id' => $chair->id,
                        'name' => $treatmentData['name'],
                        'code' => $treatmentData['code'],
                        'requires_tooth' => $treatmentData['requires_tooth'],
                        'estimated_sessions' => $treatmentData['sessions'],
                        'base_price' => $treatmentData['price'],
                        'sort_order' => $index + 1,
                    ]);
                }
            }
        }
    }
}
