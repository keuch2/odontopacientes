<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Audit;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AuditSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $coordinador = User::where('role', 'coordinador')->first();

        $audits = [
            [
                'user_id' => $admin->id ?? 1,
                'action' => 'Usuario habilitado',
                'auditable_type' => 'App\Models\User',
                'auditable_id' => 3,
                'old_values' => json_encode(['active' => false]),
                'new_values' => json_encode(['active' => true]),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'created_at' => now()->subHours(2),
                'updated_at' => now()->subHours(2),
            ],
            [
                'user_id' => $admin->id ?? 1,
                'action' => 'Paciente aprobado',
                'auditable_type' => 'App\Models\Patient',
                'auditable_id' => 1,
                'old_values' => json_encode(['status' => 'pending']),
                'new_values' => json_encode(['status' => 'approved']),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'created_at' => now()->subHours(3),
                'updated_at' => now()->subHours(3),
            ],
            [
                'user_id' => $coordinador->id ?? 2,
                'action' => 'Cátedra creada',
                'auditable_type' => 'App\Models\Chair',
                'auditable_id' => 1,
                'old_values' => null,
                'new_values' => json_encode(['name' => 'Implantología', 'active' => true]),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'created_at' => now()->subHours(5),
                'updated_at' => now()->subHours(5),
            ],
            [
                'user_id' => $admin->id ?? 1,
                'action' => 'Procedimiento asignado',
                'auditable_type' => 'App\Models\PatientProcedure',
                'auditable_id' => 10,
                'old_values' => json_encode(['status' => 'disponible']),
                'new_values' => json_encode(['status' => 'proceso']),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'created_at' => now()->subHours(6),
                'updated_at' => now()->subHours(6),
            ],
            [
                'user_id' => $coordinador->id ?? 2,
                'action' => 'Tratamiento actualizado',
                'auditable_type' => 'App\Models\Treatment',
                'auditable_id' => 5,
                'old_values' => json_encode(['price' => 100.00]),
                'new_values' => json_encode(['price' => 120.00]),
                'ip_address' => '127.0.0.1',
                'user_agent' => 'Mozilla/5.0',
                'created_at' => now()->subHours(8),
                'updated_at' => now()->subHours(8),
            ],
        ];

        foreach ($audits as $audit) {
            Audit::create($audit);
        }

        $this->command->info('✓ Auditorías de ejemplo creadas exitosamente');
    }
}
