<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Models\Patient;
use App\Models\PatientProcedure;
use App\Models\Assignment;
use App\Models\User;
use App\Models\University;
use App\Models\Chair;
use App\Models\Audit;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function dashboard(Request $request)
    {
        $recentAudits = Audit::with('user')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($audit) {
                return [
                    'id' => $audit->id,
                    'action' => $audit->action,
                    'action_label' => $audit->formatted_action,
                    'entity' => $audit->entity,
                    'entity_label' => $audit->formatted_entity,
                    'entity_id' => $audit->entity_id,
                    'user' => $audit->user ? $audit->user->name : 'Sistema',
                    'user_email' => $audit->user ? $audit->user->email : null,
                    'created_at' => $audit->created_at,
                    'time_ago' => $audit->created_at->diffForHumans(),
                ];
            });

        $stats = [
            'users_count' => User::count(),
            'users_active' => User::where('active', true)->count(),
            'patients_count' => Patient::count(),
            'universities_count' => University::count(),
            'chairs_count' => Chair::where('active', true)->count(),
            'procedures_available' => PatientProcedure::where('status', 'disponible')->count(),
            'procedures_in_progress' => PatientProcedure::where('status', 'proceso')->count(),
            'procedures_completed' => PatientProcedure::where('status', 'finalizado')->count(),
            'assignments_active' => Assignment::where('status', 'activa')->count(),
            'recent_audits' => $recentAudits,
        ];

        return response()->json([
            'data' => $stats,
        ]);
    }

    public function proceduresByChair(Request $request)
    {
        $stats = DB::table('chairs')
            ->leftJoin('treatments', 'chairs.id', '=', 'treatments.chair_id')
            ->leftJoin('patient_procedures', 'treatments.id', '=', 'patient_procedures.treatment_id')
            ->select(
                'chairs.name as chair',
                DB::raw('COUNT(patient_procedures.id) as procedures_total'),
                DB::raw('SUM(CASE WHEN patient_procedures.status = "finalizado" THEN 1 ELSE 0 END) as procedures_completed'),
                DB::raw('SUM(CASE WHEN patient_procedures.status = "proceso" THEN 1 ELSE 0 END) as procedures_in_progress'),
                DB::raw('SUM(CASE WHEN patient_procedures.status = "disponible" THEN 1 ELSE 0 END) as procedures_available')
            )
            ->where('chairs.active', true)
            ->groupBy('chairs.id', 'chairs.name')
            ->orderBy('chairs.sort_order')
            ->get()
            ->map(function ($item) {
                return [
                    'chair' => $item->chair,
                    'procedures_total' => (int) $item->procedures_total,
                    'procedures_completed' => (int) $item->procedures_completed,
                    'procedures_in_progress' => (int) $item->procedures_in_progress,
                    'procedures_available' => (int) $item->procedures_available,
                ];
            });

        return response()->json([
            'data' => $stats,
        ]);
    }

    public function studentsPerformance(Request $request)
    {
        $stats = DB::table('users')
            ->leftJoin('assignments', 'users.id', '=', 'assignments.student_id')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                DB::raw('COUNT(assignments.id) as total_assignments'),
                DB::raw('SUM(CASE WHEN assignments.status = "completada" THEN 1 ELSE 0 END) as completed_assignments'),
                DB::raw('SUM(CASE WHEN assignments.status = "activa" THEN 1 ELSE 0 END) as active_assignments'),
                DB::raw('AVG(assignments.sessions_completed) as avg_sessions')
            )
            ->where('users.role', 'alumno')
            ->where('users.active', true)
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('completed_assignments')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'email' => $item->email,
                    'total_assignments' => (int) $item->total_assignments,
                    'completed_assignments' => (int) $item->completed_assignments,
                    'active_assignments' => (int) $item->active_assignments,
                    'avg_sessions' => round((float) $item->avg_sessions, 1),
                ];
            });

        return response()->json([
            'data' => $stats,
        ]);
    }
}
