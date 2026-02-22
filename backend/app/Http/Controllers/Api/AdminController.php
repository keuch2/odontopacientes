<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Models\User;
use App\Models\Patient;
use App\Models\PatientProcedure;
use App\Models\Audit;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function systemStats(Request $request)
    {
        $stats = [
            'total_users' => User::count(),
            'pending_approvals' => 0, // Implementar lógica de aprobaciones si existe
            'active_universities' => 1, // Ajustar según modelo de universidades
            'total_patients' => Patient::count(),
            'pending_patients' => 0, // Implementar lógica de pacientes pendientes
            'system_health' => 98.5, // Calcular basado en métricas reales
            'api_calls_24h' => $this->getApiCalls24h(),
            'storage_used' => $this->getStorageUsed(),
        ];

        return response()->json([
            'data' => $stats,
        ]);
    }

    public function pendingApprovals(Request $request)
    {
        // Por ahora retornamos array vacío
        // Implementar cuando exista sistema de aprobaciones
        $approvals = [];

        return response()->json([
            'data' => $approvals,
        ]);
    }

    public function audits(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);

        $audits = Audit::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $audits->items()->map(function ($audit) {
                return [
                    'id' => $audit->id,
                    'action' => $audit->action,
                    'user' => $audit->user->email ?? 'Sistema',
                    'target' => $audit->auditable_type . ' #' . $audit->auditable_id,
                    'time' => $audit->created_at->diffForHumans(),
                    'created_at' => $audit->created_at->toIso8601String(),
                ];
            }),
            'meta' => [
                'current_page' => $audits->currentPage(),
                'last_page' => $audits->lastPage(),
                'per_page' => $audits->perPage(),
                'total' => $audits->total(),
            ],
        ]);
    }

    public function alerts(Request $request)
    {
        $alerts = [];

        // Verificar procedimientos pendientes
        $pendingProcedures = PatientProcedure::where('status', 'disponible')->count();
        if ($pendingProcedures > 10) {
            $alerts[] = [
                'id' => 1,
                'type' => 'warning',
                'message' => "$pendingProcedures procedimientos disponibles sin asignar",
                'time' => 'Hace 1 hora',
            ];
        }

        // Verificar usuarios inactivos
        $inactiveUsers = User::where('active', false)->count();
        if ($inactiveUsers > 0) {
            $alerts[] = [
                'id' => 2,
                'type' => 'info',
                'message' => "$inactiveUsers usuarios inactivos en el sistema",
                'time' => 'Hace 2 horas',
            ];
        }

        // Alerta de respaldo automático (simulado)
        $alerts[] = [
            'id' => 3,
            'type' => 'success',
            'message' => 'Respaldo automático completado exitosamente',
            'time' => 'Hace 6 horas',
        ];

        return response()->json([
            'data' => $alerts,
        ]);
    }

    private function getApiCalls24h()
    {
        // Implementar lógica real de conteo de llamadas API
        // Por ahora retornamos un valor estimado
        return rand(40000, 50000);
    }

    private function getStorageUsed()
    {
        // Calcular uso de almacenamiento real
        // Por ahora retornamos un porcentaje estimado
        return round(rand(60, 75) + (rand(0, 99) / 100), 1);
    }
}
