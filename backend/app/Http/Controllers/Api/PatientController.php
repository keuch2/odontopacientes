<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Consent;
use App\Models\Chair;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\QueryBuilder\QueryBuilder;

class PatientController extends Controller
{
    /**
     * Listar pacientes con filtros
     */
    public function index(Request $request)
    {
        $patients = QueryBuilder::for(Patient::class)
            ->allowedFilters(['city', 'faculty_id', 'created_by'])
            ->allowedSorts(['first_name', 'last_name', 'created_at', 'birthdate'])
            ->with(['faculty.university', 'createdBy'])
            ->when($request->q, function ($query, $search) {
                return $query->searchByName($search);
            })
            ->when($request->chair_id, function ($query, $chairId) {
                return $query->whereHas('patientProcedures', function ($q) use ($chairId) {
                    $q->where('chair_id', $chairId);
                });
            })
            ->when($request->treatments, function ($query, $treatments) {
                return $query->whereHas('patientProcedures', function ($q) use ($treatments) {
                    $q->whereIn('treatment_id', $treatments);
                });
            })
            ->when($request->tooth_fdi, function ($query, $toothFdi) {
                return $query->whereHas('patientProcedures', function ($q) use ($toothFdi) {
                    $q->where('tooth_description', 'LIKE', "%Diente {$toothFdi}%");
                });
            })
            ->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => $patients->map(function ($patient) {
                return [
                    'id' => $patient->id,
                    'full_name' => $patient->full_name,
                    'first_name' => $patient->first_name,
                    'last_name' => $patient->last_name,
                    'age' => $patient->age,
                    'gender' => $patient->gender,
                    'city' => $patient->city,
                    'phone' => $patient->phone,
                    'document' => $patient->full_document,
                    'faculty' => $patient->faculty ? [
                        'id' => $patient->faculty->id,
                        'name' => $patient->faculty->name,
                        'university' => $patient->faculty->university->name ?? null,
                    ] : null,
                    'is_pediatric' => (bool) $patient->is_pediatric,
                    'has_valid_consent' => $patient->hasValidConsent(),
                    'procedures_available' => $patient->patientProcedures()->where('status', 'disponible')->count(),
                    'procedures_in_progress' => $patient->patientProcedures()->where('status', 'proceso')->count(),
                    'procedures_completed' => $patient->patientProcedures()->where('status', 'finalizado')->count(),
                    'procedures_count' => [
                        'disponible' => $patient->patientProcedures()->where('status', 'disponible')->count(),
                        'proceso' => $patient->patientProcedures()->where('status', 'proceso')->count(),
                        'finalizado' => $patient->patientProcedures()->where('status', 'finalizado')->count(),
                    ],
                    'university_registered_at' => $patient->university_registered_at,
                    'created_at' => $patient->created_at,
                ];
            }),
            'meta' => [
                'current_page' => $patients->currentPage(),
                'last_page' => $patients->lastPage(),
                'per_page' => $patients->perPage(),
                'total' => $patients->total(),
                'from' => $patients->firstItem(),
                'to' => $patients->lastItem(),
            ]
        ]);
    }

    /**
     * Mostrar detalles completos de un paciente
     */
    public function show(Patient $patient)
    {
        $patient->load([
            'faculty.university',
            'createdBy',
            'consents' => function ($query) {
                $query->orderBy('signed_at', 'desc');
            },
            'patientProcedures.treatment',
            'patientProcedures.chair',
            'patientProcedures.activeAssignment.student',
            'odontograms' => function ($query) {
                $query->orderBy('recorded_at', 'desc');
            }
        ]);

        // Agrupar procedimientos por estado
        $procedures = [
            'available' => [],
            'in_progress' => [],
            'completed' => [],
            'contraindicated' => []
        ];

        foreach ($patient->patientProcedures as $procedure) {
            $procedureData = [
                'id' => $procedure->id,
                'treatment' => [
                    'id' => $procedure->treatment->id,
                    'name' => $procedure->treatment->name,
                    'code' => $procedure->treatment->code,
                    'requires_tooth' => $procedure->treatment->requires_tooth,
                    'estimated_sessions' => $procedure->treatment->estimated_sessions,
                ],
                'chair' => [
                    'id' => $procedure->chair->id,
                    'name' => $procedure->chair->name,
                    'key' => $procedure->chair->key,
                    'color' => $procedure->chair->color,
                ],
                'tooth_description' => $procedure->tooth_description,
                'status' => $procedure->status,
                'notes' => $procedure->notes,
                'estimated_price' => $procedure->estimated_price,
                'formatted_price' => $procedure->formatted_price,
                'priority' => $procedure->priority,
                'created_at' => $procedure->created_at,
            ];

            // Agregar información de asignación si existe
            if ($procedure->activeAssignment) {
                $procedureData['assignment'] = [
                    'id' => $procedure->activeAssignment->id,
                    'student' => [
                        'id' => $procedure->activeAssignment->student->id,
                        'name' => $procedure->activeAssignment->student->name,
                        'email' => $procedure->activeAssignment->student->email,
                    ],
                    'started_at' => $procedure->activeAssignment->started_at,
                    'sessions_completed' => $procedure->activeAssignment->sessions_completed,
                    'session_progress' => $procedure->activeAssignment->session_progress,
                ];
            }

            switch ($procedure->status) {
                case 'disponible':
                    $procedures['available'][] = $procedureData;
                    break;
                case 'proceso':
                    $procedures['in_progress'][] = $procedureData;
                    break;
                case 'finalizado':
                    $procedures['completed'][] = $procedureData;
                    break;
                case 'contraindicado':
                    $procedures['contraindicated'][] = $procedureData;
                    break;
            }
        }

        return response()->json([
            'data' => [
                'id' => $patient->id,
                'full_name' => $patient->full_name,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'document_type' => $patient->document_type,
                'document_number' => $patient->document_number,
                'full_document' => $patient->full_document,
                'birthdate' => $patient->birthdate,
                'age' => $patient->age,
                'gender' => $patient->gender,
                'is_pediatric' => (bool) $patient->is_pediatric,
                'city' => $patient->city,
                'address' => $patient->address,
                'phone' => $patient->phone,
                'emergency_contact' => $patient->emergency_contact,
                'emergency_phone' => $patient->emergency_phone,
                'has_allergies' => (bool) $patient->has_allergies,
                'allergies_description' => $patient->allergies_description,
                'takes_medication' => (bool) $patient->takes_medication,
                'medication_description' => $patient->medication_description,
                'has_systemic_disease' => (bool) $patient->has_systemic_disease,
                'systemic_disease_description' => $patient->systemic_disease_description,
                'is_pregnant' => (bool) $patient->is_pregnant,
                'has_bleeding_disorder' => (bool) $patient->has_bleeding_disorder,
                'bleeding_disorder_description' => $patient->bleeding_disorder_description,
                'has_heart_condition' => (bool) $patient->has_heart_condition,
                'heart_condition_description' => $patient->heart_condition_description,
                'has_diabetes' => (bool) $patient->has_diabetes,
                'diabetes_description' => $patient->diabetes_description,
                'has_hypertension' => (bool) $patient->has_hypertension,
                'smokes' => (bool) $patient->smokes,
                'other_conditions' => $patient->other_conditions,
                'faculty' => $patient->faculty ? [
                    'id' => $patient->faculty->id,
                    'name' => $patient->faculty->name,
                    'code' => $patient->faculty->code,
                    'university' => $patient->faculty->university ? [
                        'id' => $patient->faculty->university->id,
                        'name' => $patient->faculty->university->name,
                        'code' => $patient->faculty->university->code,
                    ] : null,
                ] : null,
                'created_by' => [
                    'id' => $patient->createdBy->id,
                    'name' => $patient->createdBy->name,
                    'role' => $patient->createdBy->role,
                ],
                'procedures' => $procedures,
                'consents' => $patient->consents->map(function ($consent) {
                    return [
                        'id' => $consent->id,
                        'type' => $consent->type,
                        'formatted_type' => $consent->formatted_type,
                        'signed_at' => $consent->signed_at,
                        'signer_name' => $consent->signer_name,
                        'signer_relationship' => $consent->signer_relationship,
                        'formatted_relationship' => $consent->formatted_relationship,
                        'valid' => $consent->valid,
                        'has_file' => $consent->hasFile(),
                        'notes' => $consent->notes,
                    ];
                }),
                'odontograms' => $patient->odontograms->map(function ($odontogram) {
                    return [
                        'id' => $odontogram->id,
                        'type' => $odontogram->type,
                        'recorded_at' => $odontogram->recorded_at,
                        'general_notes' => $odontogram->general_notes,
                        'stats' => $odontogram->stats,
                    ];
                }),
                'has_valid_consent' => $patient->hasValidConsent(),
                'university_registered_at' => $patient->university_registered_at,
                'created_at' => $patient->created_at,
                'updated_at' => $patient->updated_at,
            ]
        ]);
    }

    /**
     * Crear nuevo paciente
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'document_type' => 'required|string|in:CI,RUC,Pasaporte',
            'document_number' => 'required|string|max:20',
            'birthdate' => 'required|date|before:today',
            'gender' => 'nullable|in:M,F,Other',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'is_pediatric' => 'nullable|boolean',
            'has_allergies' => 'nullable|boolean',
            'allergies_description' => 'nullable|string',
            'takes_medication' => 'nullable|boolean',
            'medication_description' => 'nullable|string',
            'has_systemic_diseases' => 'nullable|boolean',
            'systemic_diseases_description' => 'nullable|string',
            'is_pregnant' => 'nullable|boolean',
            'has_bleeding_disorders' => 'nullable|boolean',
            'has_heart_conditions' => 'nullable|boolean',
            'has_diabetes' => 'nullable|boolean',
            'has_hypertension' => 'nullable|boolean',
            'is_smoker' => 'nullable|boolean',
            'other_conditions' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json([
                'message' => 'Usuario no autenticado'
            ], 401);
        }

        // Verificar que no exista paciente con mismo documento
        $existingPatient = Patient::where('document_type', $request->document_type)
            ->where('document_number', $request->document_number)
            ->first();

        if ($existingPatient) {
            return response()->json([
                'message' => 'Ya existe un paciente con este documento',
                'errors' => [
                    'document_number' => ['Ya existe un paciente con este documento']
                ]
            ], 422);
        }

        $patient = Patient::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'birthdate' => $request->birthdate,
            'gender' => $request->gender,
            'city' => $request->city,
            'address' => $request->address,
            'phone' => $request->phone,
            'emergency_contact' => $request->emergency_contact,
            'emergency_phone' => $request->emergency_phone,
            'is_pediatric' => $request->boolean('is_pediatric'),
            'has_allergies' => $request->boolean('has_allergies'),
            'allergies_description' => $request->allergies_description,
            'takes_medication' => $request->boolean('takes_medication'),
            'medication_description' => $request->medication_description,
            'has_systemic_diseases' => $request->boolean('has_systemic_diseases'),
            'systemic_diseases_description' => $request->systemic_diseases_description,
            'is_pregnant' => $request->boolean('is_pregnant'),
            'has_bleeding_disorders' => $request->boolean('has_bleeding_disorders'),
            'has_heart_conditions' => $request->boolean('has_heart_conditions'),
            'has_diabetes' => $request->boolean('has_diabetes'),
            'has_hypertension' => $request->boolean('has_hypertension'),
            'is_smoker' => $request->boolean('is_smoker'),
            'other_conditions' => $request->other_conditions,
            'university_registered_at' => now(),
            'created_by' => $user['id'],
        ]);

        // Registrar auditoría
        \App\Models\Audit::log('created', 'Patient', $patient->id);

        // Notificar al usuario que creó el paciente
        \App\Models\Notification::create([
            'user_id' => $user['id'],
            'type' => 'patient_created',
            'title' => 'Paciente registrado',
            'body' => "Registraste al paciente {$patient->full_name} exitosamente.",
            'data' => [
                'patient_id' => $patient->id,
            ],
            'priority' => 'low',
        ]);

        return response()->json([
            'message' => 'Paciente creado exitosamente',
            'data' => [
                'id' => $patient->id,
                'full_name' => $patient->full_name,
                'full_document' => $patient->full_document,
                'age' => $patient->age,
                'city' => $patient->city,
            ]
        ], 201);
    }

    /**
     * Actualizar paciente
     */
    public function update(Request $request, Patient $patient)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'document_type' => 'required|string|in:CI,RUC,Pasaporte',
            'document_number' => 'required|string|max:20',
            'birthdate' => 'required|date|before:today',
            'gender' => 'nullable|in:M,F,Other',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:20',
            'is_pediatric' => 'nullable|boolean',
            'has_allergies' => 'nullable|boolean',
            'allergies_description' => 'nullable|string|max:1000',
            'takes_medication' => 'nullable|boolean',
            'medication_description' => 'nullable|string|max:1000',
            'has_systemic_disease' => 'nullable|boolean',
            'systemic_disease_description' => 'nullable|string|max:1000',
            'is_pregnant' => 'nullable|boolean',
            'has_bleeding_disorder' => 'nullable|boolean',
            'bleeding_disorder_description' => 'nullable|string|max:1000',
            'has_heart_condition' => 'nullable|boolean',
            'heart_condition_description' => 'nullable|string|max:1000',
            'has_diabetes' => 'nullable|boolean',
            'diabetes_description' => 'nullable|string|max:1000',
            'has_hypertension' => 'nullable|boolean',
            'smokes' => 'nullable|boolean',
            'other_conditions' => 'nullable|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldData = $patient->toArray();
        
        $patient->update($request->only([
            'first_name', 'last_name', 'document_type', 'document_number',
            'birthdate', 'gender', 'is_pediatric', 'city', 'address', 'phone',
            'emergency_contact', 'emergency_phone',
            'has_allergies', 'allergies_description',
            'takes_medication', 'medication_description',
            'has_systemic_disease', 'systemic_disease_description',
            'is_pregnant',
            'has_bleeding_disorder', 'bleeding_disorder_description',
            'has_heart_condition', 'heart_condition_description',
            'has_diabetes', 'diabetes_description',
            'has_hypertension', 'smokes', 'other_conditions',
        ]));

        // Registrar auditoría
        \App\Models\Audit::log('updated', 'Patient', $patient->id, [
            'old_data' => $oldData,
            'new_data' => $patient->toArray(),
        ]);

        return response()->json([
            'message' => 'Paciente actualizado exitosamente',
            'data' => [
                'id' => $patient->id,
                'full_name' => $patient->full_name,
                'full_document' => $patient->full_document,
            ]
        ]);
    }

    /**
     * Eliminar paciente
     */
    public function destroy(Patient $patient)
    {
        // Verificar que no tenga procedimientos en proceso
        if ($patient->inProgressProcedures()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el paciente porque tiene procedimientos en proceso'
            ], 422);
        }

        $patientData = $patient->toArray();
        $patient->delete();

        // Registrar auditoría
        \App\Models\Audit::log('deleted', 'Patient', $patient->id, $patientData);

        return response()->json([
            'message' => 'Paciente eliminado exitosamente'
        ]);
    }
}
