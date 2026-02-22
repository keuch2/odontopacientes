<?php

namespace Database\Seeders;

use App\Models\Consent;
use App\Models\Faculty;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class PatientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('es_PY');
        $demoFaculty = Faculty::where('code', 'ODON-DEMO')->first();
        $admisionUser = User::where('role', 'admision')->first();

        $cities = [
            'Asunción', 'San Lorenzo', 'Luque', 'Capiatá', 'Lambaré',
            'Ñemby', 'Villa Elisa', 'Mariano Roque Alonso', 'Limpio',
            'Fernando de la Mora', 'Caacupé', 'Itauguá', 'Areguá'
        ];

        // Crear 80 pacientes de demostración
        for ($i = 1; $i <= 80; $i++) {
            $firstName = $faker->firstName();
            $lastName = $faker->lastName();
            $birthdate = $faker->dateTimeBetween('-70 years', '-5 years');
            $gender = $faker->randomElement(['M', 'F']);

            $patient = Patient::create([
                'faculty_id' => $demoFaculty->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'document_type' => 'CI',
                'document_number' => $faker->unique()->numerify('######'),
                'birthdate' => $birthdate,
                'gender' => $gender,
                'city' => $faker->randomElement($cities),
                'address' => $faker->address(),
                'phone' => $faker->e164PhoneNumber(),
                'emergency_contact' => $faker->name(),
                'emergency_phone' => $faker->e164PhoneNumber(),
                'university_registered_at' => $faker->dateTimeBetween('-2 years', 'now'),
                'created_by' => $admisionUser->id,
            ]);

            // Crear consentimiento para algunos pacientes
            if ($faker->boolean(80)) {
                Consent::create([
                    'patient_id' => $patient->id,
                    'type' => 'general',
                    'signed_at' => $faker->dateTimeBetween($patient->university_registered_at, 'now'),
                    'signer_name' => $patient->first_name . ' ' . $patient->last_name,
                    'signer_relationship' => 'self',
                    'valid' => true,
                    'created_by' => $admisionUser->id,
                ]);
            }
        }

        // Algunos pacientes específicos con nombres conocidos para testing
        $specificPatients = [
            ['name' => 'María García', 'city' => 'Asunción', 'age' => 25],
            ['name' => 'Carlos López', 'city' => 'San Lorenzo', 'age' => 30],
            ['name' => 'Ana Rodríguez', 'city' => 'Luque', 'age' => 45],
            ['name' => 'Pedro Martínez', 'city' => 'Capiatá', 'age' => 35],
            ['name' => 'Laura Fernández', 'city' => 'Lambaré', 'age' => 28],
        ];

        foreach ($specificPatients as $data) {
            $names = explode(' ', $data['name']);
            $birthdate = now()->subYears($data['age'])->subMonths($faker->numberBetween(0, 11));

            $patient = Patient::create([
                'faculty_id' => $demoFaculty->id,
                'first_name' => $names[0],
                'last_name' => $names[1],
                'document_type' => 'CI',
                'document_number' => $faker->unique()->numerify('######'),
                'birthdate' => $birthdate,
                'gender' => $faker->randomElement(['M', 'F']),
                'city' => $data['city'],
                'address' => $faker->address(),
                'phone' => $faker->e164PhoneNumber(),
                'emergency_contact' => $faker->name(),
                'emergency_phone' => $faker->e164PhoneNumber(),
                'university_registered_at' => $faker->dateTimeBetween('-1 year', 'now'),
                'created_by' => $admisionUser->id,
            ]);

            // Consentimiento para pacientes específicos
            Consent::create([
                'patient_id' => $patient->id,
                'type' => 'general',
                'signed_at' => $faker->dateTimeBetween($patient->university_registered_at, 'now'),
                'signer_name' => $patient->first_name . ' ' . $patient->last_name,
                'signer_relationship' => 'self',
                'valid' => true,
                'created_by' => $admisionUser->id,
            ]);
        }
    }
}
