<?php

namespace Database\Seeders;

use App\Models\Assignment;
use App\Models\Chair;
use App\Models\Odontogram;
use App\Models\OdontogramTooth;
use App\Models\Patient;
use App\Models\PatientProcedure;
use App\Models\Treatment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class PatientProcedureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('es_PY');
        $patients = Patient::all();
        $chairs = Chair::all();
        $admisionUser = User::where('role', 'admision')->first();
        $students = User::where('role', 'alumno')->get();

        // Dientes FDI permanentes y temporales
        $permanentTeeth = [
            // Cuadrante superior derecho
            '11', '12', '13', '14', '15', '16', '17', '18',
            // Cuadrante superior izquierdo  
            '21', '22', '23', '24', '25', '26', '27', '28',
            // Cuadrante inferior izquierdo
            '31', '32', '33', '34', '35', '36', '37', '38',
            // Cuadrante inferior derecho
            '41', '42', '43', '44', '45', '46', '47', '48'
        ];

        $surfaces = ['O', 'M', 'D', 'V', 'L', 'MO', 'DO', 'MOD', 'VL'];
        
        foreach ($patients as $patient) {
            // Crear odontograma para cada paciente
            $odontogram = Odontogram::create([
                'patient_id' => $patient->id,
                'type' => 'permanent',
                'recorded_at' => $faker->dateTimeBetween($patient->university_registered_at, 'now'),
                'general_notes' => $faker->boolean(30) ? $faker->sentence() : null,
                'created_by' => $admisionUser->id,
            ]);

            // Crear estado de algunos dientes en el odontograma
            $teethToProcess = $faker->randomElements($permanentTeeth, $faker->numberBetween(3, 12));
            
            foreach ($teethToProcess as $tooth) {
                $status = $faker->randomElement(['sano', 'indicado', 'proceso', 'finalizado', 'contraindicado']);
                $surface = $faker->boolean(70) ? $faker->randomElement($surfaces) : null;
                
                OdontogramTooth::create([
                    'odontogram_id' => $odontogram->id,
                    'tooth_fdi' => $tooth,
                    'surface' => $surface,
                    'status' => $status,
                    'color' => $this->getColorForStatus($status),
                    'notes' => $faker->boolean(20) ? $faker->sentence() : null,
                ]);
            }

            // Crear procedimientos para este paciente (2-8 procedimientos por paciente)
            $numProcedures = $faker->numberBetween(2, 8);
            
            foreach ($chairs as $chair) {
                if ($faker->boolean(60)) { // 60% chance por cátedra
                    $treatments = Treatment::where('chair_id', $chair->id)->inRandomOrder()->limit($faker->numberBetween(1, 3))->get();
                    
                    foreach ($treatments as $treatment) {
                        if ($numProcedures > 0) {
                            $tooth = null;
                            $surface = null;
                            
                            if ($treatment->requires_tooth) {
                                $tooth = $faker->randomElement($permanentTeeth);
                                $surface = $faker->boolean(60) ? $faker->randomElement($surfaces) : null;
                            }

                            $statusOptions = ['disponible', 'disponible', 'disponible', 'disponible', 'disponible',
                                             'proceso', 'proceso', 'finalizado', 'finalizado', 'contraindicado'];
                            $status = $faker->randomElement($statusOptions);

                            $procedure = PatientProcedure::create([
                                'patient_id' => $patient->id,
                                'treatment_id' => $treatment->id,
                                'chair_id' => $chair->id,
                                'tooth_fdi' => $tooth,
                                'tooth_surface' => $surface,
                                'status' => $status,
                                'notes' => $faker->boolean(30) ? $faker->sentence() : null,
                                'contraindication_reason' => $status === 'contraindicado' ? $faker->sentence() : null,
                                'estimated_price' => $faker->boolean(80) ? $treatment->base_price * $faker->randomFloat(2, 0.8, 1.2) : null,
                                'priority' => $faker->randomElement([0, 1, 2, 3]),
                                'created_by' => $admisionUser->id,
                            ]);

                            // Si está en proceso o finalizado, asignar a un estudiante
                            if (in_array($status, ['proceso', 'finalizado']) && $students->count() > 0) {
                                $student = $students->random();
                                $startedAt = $faker->dateTimeBetween($procedure->created_at, 'now');
                                $finishedAt = $status === 'finalizado' ? $faker->dateTimeBetween($startedAt, 'now') : null;

                                Assignment::create([
                                    'patient_procedure_id' => $procedure->id,
                                    'student_id' => $student->id,
                                    'started_at' => $startedAt,
                                    'finished_at' => $finishedAt,
                                    'notes' => $faker->boolean(40) ? $faker->sentence() : null,
                                    'status' => $status === 'finalizado' ? 'completada' : 'activa',
                                    'sessions_completed' => $faker->numberBetween(0, $treatment->estimated_sessions),
                                    'final_price' => $finishedAt ? $procedure->estimated_price : null,
                                ]);
                            }

                            $numProcedures--;
                        }
                    }
                }
            }
        }
    }

    private function getColorForStatus(string $status): string
    {
        return match($status) {
            'sano' => '#22c55e',
            'indicado' => '#eab308', 
            'proceso' => '#3b82f6',
            'finalizado' => '#6366f1',
            'contraindicado' => '#ef4444',
            'ausente' => '#6b7280',
            'extraido' => '#dc2626',
            'corona' => '#f59e0b',
            'protesis' => '#8b5cf6',
            default => '#6b7280'
        };
    }
}
