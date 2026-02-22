<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Odontogram;
use App\Models\OdontogramTooth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class OdontogramController extends Controller
{
    /**
     * Listar odontogramas de un paciente
     */
    public function index(Patient $patient)
    {
        $odontograms = $patient->odontograms()
            ->with(['teeth', 'createdBy'])
            ->orderBy('recorded_at', 'desc')
            ->get();

        return response()->json([
            'data' => $odontograms->map(function ($odontogram) {
                return [
                    'id' => $odontogram->id,
                    'type' => $odontogram->type,
                    'recorded_at' => $odontogram->recorded_at,
                    'general_notes' => $odontogram->general_notes,
                    'stats' => $odontogram->stats,
                    'teeth_count' => $odontogram->teeth->count(),
                    'created_by' => [
                        'id' => $odontogram->createdBy->id,
                        'name' => $odontogram->createdBy->name,
                    ],
                    'created_at' => $odontogram->created_at,
                ];
            })
        ]);
    }

    /**
     * Crear nuevo odontograma
     */
    public function store(Request $request, Patient $patient)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:permanent,temporary',
            'recorded_at' => 'nullable|date',
            'general_notes' => 'nullable|string',
            'teeth' => 'nullable|array',
            'teeth.*.tooth_fdi' => 'required|string|max:2',
            'teeth.*.status' => 'required|in:sano,caries,obturado,ausente,corona,endodoncia,extraido,indicado,proceso,finalizado,contraindicado',
            'teeth.*.surfaces' => 'nullable|string|max:10',
            'teeth.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $odontogram = Odontogram::create([
                'patient_id' => $patient->id,
                'type' => $request->type,
                'recorded_at' => $request->recorded_at ?? now(),
                'general_notes' => $request->general_notes,
                'created_by' => auth()->id(),
            ]);

            // Crear dientes si se proporcionaron
            if ($request->has('teeth') && is_array($request->teeth)) {
                foreach ($request->teeth as $toothData) {
                    OdontogramTooth::create([
                        'odontogram_id' => $odontogram->id,
                        'tooth_fdi' => $toothData['tooth_fdi'],
                        'status' => $toothData['status'],
                        'surfaces' => $toothData['surfaces'] ?? null,
                        'notes' => $toothData['notes'] ?? null,
                    ]);
                }
            }

            // Registrar auditoría
            \App\Models\Audit::log('created', 'Odontogram', $odontogram->id);

            DB::commit();

            $odontogram->load('teeth');

            return response()->json([
                'message' => 'Odontograma creado exitosamente',
                'data' => [
                    'id' => $odontogram->id,
                    'type' => $odontogram->type,
                    'teeth_count' => $odontogram->teeth->count(),
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al crear el odontograma',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mostrar detalles de un odontograma
     */
    public function show(Odontogram $odontogram)
    {
        $odontogram->load(['patient', 'teeth', 'createdBy']);

        // Organizar dientes por cuadrante
        $teethByQuadrant = [
            1 => $odontogram->getTeethByQuadrant(1),
            2 => $odontogram->getTeethByQuadrant(2),
            3 => $odontogram->getTeethByQuadrant(3),
            4 => $odontogram->getTeethByQuadrant(4),
        ];

        // Si es temporal, agregar cuadrantes 5-8
        if ($odontogram->isTemporary()) {
            $teethByQuadrant[5] = $odontogram->getTeethByQuadrant(5);
            $teethByQuadrant[6] = $odontogram->getTeethByQuadrant(6);
            $teethByQuadrant[7] = $odontogram->getTeethByQuadrant(7);
            $teethByQuadrant[8] = $odontogram->getTeethByQuadrant(8);
        }

        return response()->json([
            'data' => [
                'id' => $odontogram->id,
                'patient' => [
                    'id' => $odontogram->patient->id,
                    'full_name' => $odontogram->patient->full_name,
                    'age' => $odontogram->patient->age,
                ],
                'type' => $odontogram->type,
                'recorded_at' => $odontogram->recorded_at,
                'general_notes' => $odontogram->general_notes,
                'stats' => $odontogram->stats,
                'teeth_by_quadrant' => $teethByQuadrant,
                'teeth' => $odontogram->teeth->map(function ($tooth) {
                    return [
                        'id' => $tooth->id,
                        'tooth_fdi' => $tooth->tooth_fdi,
                        'status' => $tooth->status,
                        'surfaces' => $tooth->surfaces,
                        'notes' => $tooth->notes,
                        'created_at' => $tooth->created_at,
                        'updated_at' => $tooth->updated_at,
                    ];
                }),
                'created_by' => [
                    'id' => $odontogram->createdBy->id,
                    'name' => $odontogram->createdBy->name,
                ],
                'created_at' => $odontogram->created_at,
                'updated_at' => $odontogram->updated_at,
            ]
        ]);
    }

    /**
     * Actualizar odontograma
     */
    public function update(Request $request, Odontogram $odontogram)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|required|in:permanent,temporary',
            'recorded_at' => 'nullable|date',
            'general_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldData = $odontogram->toArray();

        $odontogram->update($request->only([
            'type', 'recorded_at', 'general_notes'
        ]));

        // Registrar auditoría
        \App\Models\Audit::log('updated', 'Odontogram', $odontogram->id, [
            'old_data' => $oldData,
            'new_data' => $odontogram->toArray(),
        ]);

        return response()->json([
            'message' => 'Odontograma actualizado exitosamente',
            'data' => [
                'id' => $odontogram->id,
                'type' => $odontogram->type,
            ]
        ]);
    }

    /**
     * Eliminar odontograma
     */
    public function destroy(Odontogram $odontogram)
    {
        $odontogramData = $odontogram->toArray();
        
        // Eliminar dientes asociados (cascade)
        $odontogram->teeth()->delete();
        $odontogram->delete();

        // Registrar auditoría
        \App\Models\Audit::log('deleted', 'Odontogram', $odontogram->id, $odontogramData);

        return response()->json([
            'message' => 'Odontograma eliminado exitosamente'
        ]);
    }

    /**
     * Agregar o actualizar diente en odontograma
     */
    public function updateTooth(Request $request, Odontogram $odontogram)
    {
        $validator = Validator::make($request->all(), [
            'tooth_fdi' => 'required|string|max:2',
            'status' => 'required|in:sano,indicado,proceso,finalizado,contraindicado,ausente,extraido,corona,protesis',
            'surfaces' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Buscar si el diente ya existe
        $tooth = $odontogram->teeth()
            ->where('tooth_fdi', $request->tooth_fdi)
            ->first();

        if ($tooth) {
            // Actualizar diente existente
            $tooth->update([
                'status' => $request->status,
                'surfaces' => $request->surfaces,
                'notes' => $request->notes,
            ]);
            $message = 'Diente actualizado exitosamente';
        } else {
            // Crear nuevo diente
            $tooth = OdontogramTooth::create([
                'odontogram_id' => $odontogram->id,
                'tooth_fdi' => $request->tooth_fdi,
                'status' => $request->status,
                'surfaces' => $request->surfaces,
                'notes' => $request->notes,
            ]);
            $message = 'Diente agregado exitosamente';
        }

        return response()->json([
            'message' => $message,
            'data' => [
                'id' => $tooth->id,
                'tooth_fdi' => $tooth->tooth_fdi,
                'status' => $tooth->status,
                'surfaces' => $tooth->surfaces,
                'notes' => $tooth->notes,
            ]
        ]);
    }

    /**
     * Eliminar diente de odontograma
     */
    public function deleteTooth(Odontogram $odontogram, $toothFdi)
    {
        $tooth = $odontogram->teeth()
            ->where('tooth_fdi', $toothFdi)
            ->first();

        if (!$tooth) {
            return response()->json([
                'message' => 'Diente no encontrado'
            ], 404);
        }

        $tooth->delete();

        return response()->json([
            'message' => 'Diente eliminado exitosamente'
        ]);
    }
}
