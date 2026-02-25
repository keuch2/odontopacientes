<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Models\Assignment;
use App\Support\DemoUserFactory;

class AssignmentsController extends Controller
{
    public function myAssignments(Request $request)
    {
        // Obtener usuario desde el middleware demo.auth
        $user = $request->attributes->get('demo_user');
        
        // Si no hay usuario en el request, usar DemoUserFactory como fallback
        if (!$user) {
            $authHeader = $request->header('Authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
                $email = base64_decode(str_replace(['-', '_'], ['+', '/'], substr($token, 11)));
                $user = DemoUserFactory::getUserByEmail($email);
            }
        }
        
        if (!$user || $user['role'] !== 'alumno') {
            return response()->json([
                'message' => 'No autorizado',
                'data' => []
            ], 403);
        }
        
        // Consultar asignaciones reales de la base de datos
        $assignments = Assignment::with([
                'patientProcedure.patient',
                'patientProcedure.treatment.chair',
                'patientProcedure.treatmentSubclass',
                'patientProcedure.treatmentSubclassOption',
            ])
            ->where('student_id', $user['id'])
            ->whereIn('status', ['activa', 'completada'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                    'sessions_completed' => $assignment->sessions_completed ?? 0,
                    'patient_procedure' => [
                        'id' => $assignment->patientProcedure->id,
                        'treatment' => [
                            'id' => $assignment->patientProcedure->treatment->id,
                            'name' => $assignment->patientProcedure->treatment->name,
                            'estimated_sessions' => $assignment->patientProcedure->treatment->estimated_sessions ?? 1,
                        ],
                        'treatment_subclass' => $assignment->patientProcedure->treatmentSubclass ? [
                            'id' => $assignment->patientProcedure->treatmentSubclass->id,
                            'name' => $assignment->patientProcedure->treatmentSubclass->name,
                        ] : null,
                        'treatment_subclass_option' => $assignment->patientProcedure->treatmentSubclassOption ? [
                            'id' => $assignment->patientProcedure->treatmentSubclassOption->id,
                            'name' => $assignment->patientProcedure->treatmentSubclassOption->name,
                        ] : null,
                        'chair' => [
                            'id' => $assignment->patientProcedure->treatment->chair->id,
                            'name' => $assignment->patientProcedure->treatment->chair->name,
                        ],
                        'patient' => [
                            'id' => $assignment->patientProcedure->patient->id,
                            'full_name' => $assignment->patientProcedure->patient->full_name,
                            'is_pediatric' => (bool) $assignment->patientProcedure->patient->is_pediatric,
                        ],
                    ],
                    'assigned_at' => $assignment->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'data' => $assignments,
        ]);
    }

    public function myCreatedPatients(Request $request)
    {
        $user = $request->attributes->get('demo_user');
        
        if (!$user) {
            $authHeader = $request->header('Authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
                $email = base64_decode(str_replace(['-', '_'], ['+', '/'], substr($token, 11)));
                $user = DemoUserFactory::getUserByEmail($email);
            }
        }
        
        if (!$user) {
            return response()->json(['message' => 'No autorizado', 'data' => []], 403);
        }

        $patients = \App\Models\Patient::where('created_by', $user['id'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'full_name' => $patient->full_name,
                    'city' => $patient->city,
                    'document_number' => $patient->document_number,
                    'created_at' => $patient->created_at->toIso8601String(),
                ];
            });

        return response()->json(['data' => $patients]);
    }

    public function show(Request $request, $id)
    {
        // Obtener usuario
        $user = $request->attributes->get('demo_user');
        
        if (!$user) {
            $authHeader = $request->header('Authorization');
            if ($authHeader && str_starts_with($authHeader, 'Bearer ')) {
                $token = substr($authHeader, 7);
                $email = base64_decode(str_replace(['-', '_'], ['+', '/'], substr($token, 11)));
                $user = DemoUserFactory::getUserByEmail($email);
            }
        }
        
        // Buscar asignación en la base de datos
        $assignment = Assignment::with([
                'patientProcedure.patient',
                'patientProcedure.treatment.chair',
                'patientProcedure.treatmentSubclass',
                'patientProcedure.treatmentSubclassOption',
            ])
            ->where('id', $id)
            ->where('student_id', $user['id'])
            ->first();

        if (!$assignment) {
            return response()->json([
                'message' => 'Asignación no encontrada',
            ], 404);
        }

        $data = [
            'id' => $assignment->id,
            'status' => $assignment->status,
            'sessions_completed' => $assignment->sessions_completed ?? 0,
            'notes' => $assignment->notes,
            'patient_procedure' => [
                'id' => $assignment->patientProcedure->id,
                'treatment' => [
                    'id' => $assignment->patientProcedure->treatment->id,
                    'name' => $assignment->patientProcedure->treatment->name,
                    'description' => $assignment->patientProcedure->treatment->description,
                    'estimated_sessions' => $assignment->patientProcedure->treatment->estimated_sessions ?? 1,
                ],
                'treatment_subclass' => $assignment->patientProcedure->treatmentSubclass ? [
                    'id' => $assignment->patientProcedure->treatmentSubclass->id,
                    'name' => $assignment->patientProcedure->treatmentSubclass->name,
                ] : null,
                'treatment_subclass_option' => $assignment->patientProcedure->treatmentSubclassOption ? [
                    'id' => $assignment->patientProcedure->treatmentSubclassOption->id,
                    'name' => $assignment->patientProcedure->treatmentSubclassOption->name,
                ] : null,
                'chair' => [
                    'id' => $assignment->patientProcedure->treatment->chair->id,
                    'name' => $assignment->patientProcedure->treatment->chair->name,
                ],
                'patient' => [
                    'id' => $assignment->patientProcedure->patient->id,
                    'full_name' => $assignment->patientProcedure->patient->full_name,
                    'email' => $assignment->patientProcedure->patient->email,
                    'phone' => $assignment->patientProcedure->patient->phone,
                    'city' => $assignment->patientProcedure->patient->city,
                    'birth_date' => $assignment->patientProcedure->patient->birth_date,
                    'is_pediatric' => (bool) $assignment->patientProcedure->patient->is_pediatric,
                ],
            ],
            'assigned_at' => $assignment->created_at->toIso8601String(),
            'updated_at' => $assignment->updated_at->toIso8601String(),
        ];

        if ($assignment->status === 'completada' && $assignment->completed_at) {
            $data['completed_at'] = $assignment->completed_at->toIso8601String();
        }

        if ($assignment->status === 'abandonada' && $assignment->abandoned_at) {
            $data['abandoned_at'] = $assignment->abandoned_at->toIso8601String();
        }

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Completar una asignación
     */
    public function complete(Request $request, $id)
    {
        $request->validate([
            'final_notes' => 'nullable|string|max:1000',
        ]);

        // Obtener usuario
        $user = $request->attributes->get('demo_user');
        
        // Buscar asignación
        $assignment = Assignment::where('id', $id)
            ->where('student_id', $user['id'])
            ->where('status', 'activa')
            ->first();

        if (!$assignment) {
            return response()->json([
                'message' => 'Asignación no encontrada o ya completada',
            ], 404);
        }

        // Actualizar asignación
        $assignment->status = 'completada';
        $assignment->completed_at = now();
        $assignment->final_notes = $request->input('final_notes', '');
        $assignment->save();

        // Actualizar el procedimiento del paciente
        $assignment->patientProcedure->status = 'finalizado';
        $assignment->patientProcedure->save();
        
        return response()->json([
            'message' => 'Tratamiento completado exitosamente',
            'data' => [
                'id' => $assignment->id,
                'status' => 'completada',
                'completed_at' => $assignment->completed_at->toIso8601String(),
                'final_notes' => $assignment->final_notes,
            ],
        ]);
    }

    /**
     * Abandonar una asignación
     */
    public function abandon(Request $request, $id)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        // Obtener usuario
        $user = $request->attributes->get('demo_user');
        
        // Buscar asignación
        $assignment = Assignment::where('id', $id)
            ->where('student_id', $user['id'])
            ->where('status', 'activa')
            ->first();

        if (!$assignment) {
            return response()->json([
                'message' => 'Asignación no encontrada o ya finalizada',
            ], 404);
        }

        // Actualizar asignación
        $assignment->status = 'abandonada';
        $assignment->abandoned_at = now();
        $assignment->abandon_reason = $request->input('reason');
        $assignment->save();

        // Devolver el procedimiento a disponible
        $assignment->patientProcedure->status = 'disponible';
        $assignment->patientProcedure->save();
        
        return response()->json([
            'message' => 'Caso abandonado exitosamente',
            'data' => [
                'id' => $assignment->id,
                'status' => 'abandonada',
                'abandoned_at' => $assignment->abandoned_at->toIso8601String(),
                'abandon_reason' => $assignment->abandon_reason,
            ],
        ]);
    }
}
