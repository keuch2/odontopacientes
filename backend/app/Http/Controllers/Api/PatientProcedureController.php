<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientProcedure;
use App\Models\Treatment;
use App\Models\Chair;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PatientProcedureController extends Controller
{
    /**
     * Listar procedimientos de un paciente
     */
    public function index(Patient $patient)
    {
        $procedures = $patient->patientProcedures()
            ->with(['treatment.subclasses', 'chair', 'activeAssignment.student', 'treatmentSubclass', 'treatmentSubclassOption'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $procedures->map(function ($procedure) {
                return [
                    'id' => $procedure->id,
                    'treatment' => [
                        'id' => $procedure->treatment->id,
                        'name' => $procedure->treatment->name,
                        'code' => $procedure->treatment->code,
                        'requires_tooth' => $procedure->treatment->requires_tooth,
                        'estimated_sessions' => $procedure->treatment->estimated_sessions,
                        'subclasses' => $procedure->treatment->subclasses ? $procedure->treatment->subclasses->map(fn ($s) => [
                            'id' => $s->id,
                            'name' => $s->name,
                        ])->values()->toArray() : [],
                    ],
                    'treatment_subclass' => $procedure->treatmentSubclass ? [
                        'id' => $procedure->treatmentSubclass->id,
                        'name' => $procedure->treatmentSubclass->name,
                    ] : null,
                    'treatment_subclass_option' => $procedure->treatmentSubclassOption ? [
                        'id' => $procedure->treatmentSubclassOption->id,
                        'name' => $procedure->treatmentSubclassOption->name,
                    ] : null,
                    'chair' => [
                        'id' => $procedure->chair->id,
                        'name' => $procedure->chair->name,
                        'key' => $procedure->chair->key,
                        'color' => $procedure->chair->color,
                    ],
                    'tooth_fdi' => $procedure->tooth_fdi,
                    'tooth_surface' => $procedure->tooth_surface,
                    'tooth_description' => $procedure->tooth_description,
                    'status' => $procedure->status,
                    'notes' => $procedure->notes,
                    'estimated_price' => $procedure->estimated_price,
                    'formatted_price' => $procedure->formatted_price,
                    'priority' => $procedure->priority,
                    'assignment' => $procedure->activeAssignment ? [
                        'id' => $procedure->activeAssignment->id,
                        'student' => [
                            'id' => $procedure->activeAssignment->student->id,
                            'name' => $procedure->activeAssignment->student->name,
                        ],
                        'started_at' => $procedure->activeAssignment->started_at,
                        'sessions_completed' => $procedure->activeAssignment->sessions_completed,
                    ] : null,
                    'created_at' => $procedure->created_at,
                    'updated_at' => $procedure->updated_at,
                ];
            })
        ]);
    }

    /**
     * Crear nuevo procedimiento para un paciente
     */
    public function store(Request $request, Patient $patient)
    {
        $isAusente = $request->status === 'ausente';

        $validator = Validator::make($request->all(), [
            'treatment_id' => $isAusente ? 'nullable|exists:treatments,id' : 'required|exists:treatments,id',
            'treatment_subclass_id' => 'nullable|exists:treatment_subclasses,id',
            'treatment_subclass_option_id' => 'nullable|exists:treatment_subclass_options,id',
            'chair_id' => 'nullable|exists:chairs,id',
            'tooth_description' => 'nullable|string|max:255',
            'tooth_fdi' => 'required|string|max:255',
            'tooth_surface' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
            'estimated_price' => 'nullable|numeric|min:0',
            'price' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:baja,media,alta',
            'status' => 'nullable|in:disponible,proceso,finalizado,contraindicado,ausente,cancelado',
            'sessions_total' => 'nullable|integer|min:1',
            'auto_assign' => 'nullable|boolean',
            'is_repair' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        if ($isAusente && !$request->treatment_id) {
            $treatment = Treatment::where('code', 'AUS-001')->first();
            if (!$treatment) {
                return response()->json(['message' => 'Tratamiento "Diente Ausente" no encontrado. Contacte al administrador.'], 422);
            }
        } else {
            $treatment = Treatment::find($request->treatment_id);
        }
        $chairId = $request->chair_id ?? ($treatment ? $treatment->chair_id : Chair::first()?->id);

        // Build tooth description from FDI and surface if provided
        $toothDescription = $request->tooth_description;
        if (empty($toothDescription) && $request->tooth_fdi) {
            $toothDescription = 'Diente ' . $request->tooth_fdi;
            if ($request->tooth_surface) {
                $toothDescription .= ' - Superficie ' . $request->tooth_surface;
            }
        }

        $priorityMap = ['baja' => 0, 'media' => 1, 'alta' => 2];
        $priorityValue = $priorityMap[$request->priority ?? 'media'] ?? 1;

        $user = $request->attributes->get('demo_user');
        $userId = is_array($user) ? ($user['id'] ?? null) : ($user->id ?? null);

        $procedure = PatientProcedure::create([
            'patient_id' => $patient->id,
            'treatment_id' => $treatment->id,
            'treatment_subclass_id' => $request->treatment_subclass_id,
            'treatment_subclass_option_id' => $request->treatment_subclass_option_id,
            'chair_id' => $chairId,
            'tooth_fdi' => $request->tooth_fdi,
            'tooth_surface' => $request->tooth_surface,
            'is_repair' => $request->boolean('is_repair'),
            'notes' => $request->notes,
            'priority' => $priorityValue,
            'status' => $request->status ?? 'disponible',
            'created_by' => $userId,
        ]);

        // Registrar auditoría
        \App\Models\Audit::log('created', 'PatientProcedure', $procedure->id);

        // Handle auto-assignment if requested
        $assignment = null;
        if ($request->auto_assign && $userId) {
            $assignment = \App\Models\Assignment::create([
                'patient_procedure_id' => $procedure->id,
                'student_id' => $userId,
                'status' => 'activa',
                'started_at' => now(),
                'estimated_sessions' => $request->sessions_total ?? $treatment->estimated_sessions ?? 1,
                'sessions_completed' => 0,
            ]);
            
            // Update procedure status to 'proceso'
            $procedure->update(['status' => 'proceso']);
            
            \App\Models\Audit::log('created', 'Assignment', $assignment->id);

            // Notify the user who auto-assigned themselves
            \App\Models\Notification::create([
                'user_id' => $userId,
                'type' => 'assignment',
                'title' => 'Te asignaste a un procedimiento',
                'body' => "Te asignaste al procedimiento {$treatment->name} de {$patient->full_name}.",
                'data' => [
                    'procedure_id' => $procedure->id,
                    'patient_id' => $patient->id,
                    'assignment_id' => $assignment->id,
                ],
                'priority' => 'normal',
            ]);
        }

        $procedure->load(['treatment', 'chair']);

        return response()->json([
            'message' => $assignment 
                ? 'Procedimiento creado y asignado exitosamente' 
                : 'Procedimiento creado exitosamente',
            'data' => [
                'id' => $procedure->id,
                'treatment' => [
                    'id' => $procedure->treatment->id,
                    'name' => $procedure->treatment->name,
                ],
                'chair' => [
                    'id' => $procedure->chair->id,
                    'name' => $procedure->chair->name,
                ],
                'status' => $procedure->status,
                'assignment' => $assignment ? [
                    'id' => $assignment->id,
                    'status' => $assignment->status,
                ] : null,
            ]
        ], 201);
    }

    /**
     * Mostrar detalles de un procedimiento
     */
    public function show(PatientProcedure $patientProcedure)
    {
        $patientProcedure->load([
            'patient',
            'treatment.subclasses',
            'chair',
            'activeAssignment.student',
            'createdBy',
            'treatmentSubclass',
            'treatmentSubclassOption'
        ]);

        return response()->json([
            'data' => [
                'id' => $patientProcedure->id,
                'patient' => [
                    'id' => $patientProcedure->patient->id,
                    'full_name' => $patientProcedure->patient->full_name,
                    'age' => $patientProcedure->patient->birth_date ? $patientProcedure->patient->birth_date->age : null,
                    'city' => $patientProcedure->patient->city,
                    'document_number' => $patientProcedure->patient->document_number,
                ],
                'treatment' => [
                    'id' => $patientProcedure->treatment->id,
                    'name' => $patientProcedure->treatment->name,
                    'code' => $patientProcedure->treatment->code,
                    'requires_tooth' => $patientProcedure->treatment->requires_tooth,
                    'estimated_sessions' => $patientProcedure->treatment->estimated_sessions,
                    'subclasses' => $patientProcedure->treatment->subclasses ? $patientProcedure->treatment->subclasses->map(fn ($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                    ])->values()->toArray() : [],
                ],
                'treatment_subclass' => $patientProcedure->treatmentSubclass ? [
                    'id' => $patientProcedure->treatmentSubclass->id,
                    'name' => $patientProcedure->treatmentSubclass->name,
                ] : null,
                'treatment_subclass_option' => $patientProcedure->treatmentSubclassOption ? [
                    'id' => $patientProcedure->treatmentSubclassOption->id,
                    'name' => $patientProcedure->treatmentSubclassOption->name,
                ] : null,
                'chair' => [
                    'id' => $patientProcedure->chair->id,
                    'name' => $patientProcedure->chair->name,
                    'key' => $patientProcedure->chair->key,
                    'color' => $patientProcedure->chair->color,
                ],
                'tooth_description' => $patientProcedure->tooth_description,
                'status' => $patientProcedure->status,
                'notes' => $patientProcedure->notes,
                'estimated_price' => $patientProcedure->estimated_price,
                'formatted_price' => $patientProcedure->formatted_price,
                'final_price' => $patientProcedure->final_price,
                'priority' => $patientProcedure->priority,
                'assignment' => $patientProcedure->activeAssignment ? [
                    'id' => $patientProcedure->activeAssignment->id,
                    'student' => [
                        'id' => $patientProcedure->activeAssignment->student->id,
                        'name' => $patientProcedure->activeAssignment->student->name,
                        'email' => $patientProcedure->activeAssignment->student->email,
                        'phone' => $patientProcedure->activeAssignment->student->phone ?? null,
                    ],
                    'status' => $patientProcedure->activeAssignment->status,
                    'started_at' => $patientProcedure->activeAssignment->started_at,
                    'completed_at' => $patientProcedure->activeAssignment->completed_at,
                    'sessions_completed' => $patientProcedure->activeAssignment->sessions_completed,
                ] : null,
                'created_by' => [
                    'id' => $patientProcedure->createdBy->id,
                    'name' => $patientProcedure->createdBy->name,
                ],
                'created_at' => $patientProcedure->created_at,
                'updated_at' => $patientProcedure->updated_at,
            ]
        ]);
    }

    /**
     * Actualizar procedimiento
     */
    public function update(Request $request, PatientProcedure $patientProcedure)
    {
        // No permitir editar si está en proceso (tiene asignación activa) o finalizado
        if ($patientProcedure->status === 'finalizado') {
            return response()->json([
                'message' => 'No se puede editar un procedimiento finalizado'
            ], 422);
        }
        if ($patientProcedure->status === 'proceso' && $patientProcedure->activeAssignment) {
            return response()->json([
                'message' => 'No se puede editar un procedimiento con asignación activa'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'treatment_id' => 'sometimes|required|exists:treatments,id',
            'treatment_subclass_id' => 'nullable|exists:treatment_subclasses,id',
            'treatment_subclass_option_id' => 'nullable|exists:treatment_subclass_options,id',
            'chair_id' => 'sometimes|required|exists:chairs,id',
            'tooth_description' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'estimated_price' => 'nullable|numeric|min:0',
            'priority' => 'nullable|in:baja,media,alta',
            'status' => 'nullable|in:disponible,contraindicado',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Si se cambia el tratamiento, verificar que pertenece a la cátedra
        if ($request->has('treatment_id')) {
            $treatment = Treatment::find($request->treatment_id);
            $chairId = $request->chair_id ?? $patientProcedure->chair_id;
            
            if ($treatment->chair_id != $chairId) {
                return response()->json([
                    'message' => 'El tratamiento no pertenece a la cátedra seleccionada',
                    'errors' => [
                        'treatment_id' => ['El tratamiento no es válido para esta cátedra']
                    ]
                ], 422);
            }

            if ($treatment->requires_tooth && empty($request->tooth_description) && empty($patientProcedure->tooth_description)) {
                return response()->json([
                    'message' => 'Este tratamiento requiere especificar el diente',
                    'errors' => [
                        'tooth_description' => ['Debe especificar el diente para este tratamiento']
                    ]
                ], 422);
            }
        }

        $oldData = $patientProcedure->toArray();

        $updateData = $request->only([
            'treatment_id', 'treatment_subclass_id', 'treatment_subclass_option_id', 'chair_id', 'tooth_description', 'notes', 'status'
        ]);

        if ($request->has('priority')) {
            $priorityMap = ['baja' => 0, 'media' => 1, 'alta' => 2];
            $updateData['priority'] = $priorityMap[$request->priority] ?? 1;
        }

        $patientProcedure->update($updateData);

        // Registrar auditoría
        \App\Models\Audit::log('updated', 'PatientProcedure', $patientProcedure->id, [
            'old_data' => $oldData,
            'new_data' => $patientProcedure->toArray(),
        ]);

        return response()->json([
            'message' => 'Procedimiento actualizado exitosamente',
            'data' => [
                'id' => $patientProcedure->id,
                'status' => $patientProcedure->status,
            ]
        ]);
    }

    /**
     * Asignar procedimiento al usuario actual (estudiante)
     */
    public function assign(Request $request, PatientProcedure $patientProcedure)
    {
        // Verificar que el procedimiento esté disponible
        if ($patientProcedure->status !== 'disponible') {
            return response()->json([
                'message' => 'Este procedimiento no está disponible para asignación'
            ], 422);
        }

        // Verificar que no tenga asignaciones activas
        if ($patientProcedure->activeAssignment) {
            return response()->json([
                'message' => 'Este procedimiento ya tiene una asignación activa'
            ], 422);
        }

        // Obtener el usuario actual del middleware demo.auth
        $user = $request->attributes->get('demo_user');
        
        if (!$user) {
            return response()->json([
                'message' => 'No se pudo identificar al usuario'
            ], 401);
        }

        // Crear la asignación
        $assignment = \App\Models\Assignment::create([
            'patient_procedure_id' => $patientProcedure->id,
            'student_id' => $user['id'],
            'started_at' => now(),
            'status' => 'activa',
            'sessions_completed' => 0,
        ]);

        // Actualizar el estado del procedimiento a "proceso"
        $patientProcedure->update(['status' => 'proceso']);

        // Registrar auditoría
        \App\Models\Audit::log('assigned', 'PatientProcedure', $patientProcedure->id, [
            'student_id' => $user['id'],
            'assignment_id' => $assignment->id,
        ]);

        $patientProcedure->load(['treatment', 'chair', 'patient']);

        // Notify the student who assigned themselves
        \App\Models\Notification::create([
            'user_id' => $user['id'],
            'type' => 'assignment',
            'title' => 'Te asignaste a un procedimiento',
            'body' => "Te asignaste al procedimiento {$patientProcedure->treatment->name} de {$patientProcedure->patient->full_name}.",
            'data' => [
                'procedure_id' => $patientProcedure->id,
                'patient_id' => $patientProcedure->patient->id,
                'assignment_id' => $assignment->id,
            ],
            'priority' => 'normal',
        ]);

        // Notify the creator of the procedure (if different from the assigning user)
        if ($patientProcedure->created_by && $patientProcedure->created_by !== $user['id']) {
            \App\Models\Notification::create([
                'user_id' => $patientProcedure->created_by,
                'type' => 'assignment',
                'title' => 'Nuevo alumno asignado',
                'body' => "{$user['name']} se asignó al procedimiento {$patientProcedure->treatment->name} que creaste para {$patientProcedure->patient->full_name}.",
                'data' => [
                    'procedure_id' => $patientProcedure->id,
                    'patient_id' => $patientProcedure->patient->id,
                    'assignment_id' => $assignment->id,
                    'student_id' => $user['id'],
                ],
                'priority' => 'normal',
            ]);
        }

        return response()->json([
            'message' => 'Procedimiento asignado exitosamente',
            'data' => [
                'assignment_id' => $assignment->id,
                'procedure' => [
                    'id' => $patientProcedure->id,
                    'treatment' => $patientProcedure->treatment->name,
                    'patient' => $patientProcedure->patient->full_name,
                    'status' => $patientProcedure->status,
                ],
            ]
        ]);
    }

    /**
     * Cancelar procedimiento (solo el creador puede cancelarlo)
     */
    public function cancel(Request $request, PatientProcedure $patientProcedure)
    {
        $user = $request->attributes->get('demo_user');
        $userId = is_array($user) ? ($user['id'] ?? null) : ($user->id ?? null);

        if (!$userId || $patientProcedure->created_by !== $userId) {
            return response()->json([
                'message' => 'Solo el usuario que creó este procedimiento puede cancelarlo'
            ], 403);
        }

        if ($patientProcedure->status === 'finalizado') {
            return response()->json([
                'message' => 'No se puede cancelar un procedimiento finalizado'
            ], 422);
        }

        // If there's an active assignment, abandon it first
        if ($patientProcedure->activeAssignment) {
            $patientProcedure->activeAssignment->update([
                'status' => 'abandonada',
                'ended_at' => now(),
            ]);
        }

        $oldStatus = $patientProcedure->status;
        $patientProcedure->update(['status' => 'cancelado']);

        \App\Models\Audit::log('cancelled', 'PatientProcedure', $patientProcedure->id, [
            'old_status' => $oldStatus,
            'cancelled_by' => $userId,
        ]);

        return response()->json([
            'message' => 'Procedimiento cancelado exitosamente'
        ]);
    }

    /**
     * Eliminar procedimiento
     */
    public function destroy(PatientProcedure $patientProcedure)
    {
        // No permitir eliminar si está en proceso o finalizado
        if (in_array($patientProcedure->status, ['proceso', 'finalizado'])) {
            return response()->json([
                'message' => 'No se puede eliminar un procedimiento en proceso o finalizado'
            ], 422);
        }

        // Verificar que no tenga asignaciones
        if ($patientProcedure->assignments()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar un procedimiento con asignaciones'
            ], 422);
        }

        $procedureData = $patientProcedure->toArray();
        $patientProcedure->delete();

        // Registrar auditoría
        \App\Models\Audit::log('deleted', 'PatientProcedure', $patientProcedure->id, $procedureData);

        return response()->json([
            'message' => 'Procedimiento eliminado exitosamente'
        ]);
    }
}
