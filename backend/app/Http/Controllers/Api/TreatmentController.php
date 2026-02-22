<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Treatment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TreatmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Treatment::with('chair');

        if ($request->has('chair_id')) {
            $query->where('chair_id', $request->chair_id);
        }

        $treatments = $query->orderBy('sort_order')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $treatments->map(fn ($t) => $this->formatTreatment($t)),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $treatment = Treatment::with('chair')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->formatTreatment($treatment),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'chair_id' => 'required|exists:chairs,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:treatments,code',
            'description' => 'nullable|string',
            'requires_tooth' => 'nullable|boolean',
            'applies_to_all_upper' => 'nullable|boolean',
            'applies_to_all_lower' => 'nullable|boolean',
            'estimated_sessions' => 'nullable|integer|min:0',
            'base_price' => 'nullable|numeric|min:0',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
        ]);

        $treatment = Treatment::create(array_merge([
            'requires_tooth' => false,
            'applies_to_all_upper' => false,
            'applies_to_all_lower' => false,
            'estimated_sessions' => 1,
            'sort_order' => 0,
            'active' => true,
        ], $validated));

        return response()->json([
            'message' => 'Tratamiento creado correctamente',
            'data' => $this->formatTreatment($treatment->load('chair')),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $treatment = Treatment::findOrFail($id);

        $validated = $request->validate([
            'chair_id' => 'sometimes|required|exists:chairs,id',
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:20|unique:treatments,code,' . $treatment->id,
            'description' => 'nullable|string',
            'requires_tooth' => 'nullable|boolean',
            'applies_to_all_upper' => 'nullable|boolean',
            'applies_to_all_lower' => 'nullable|boolean',
            'estimated_sessions' => 'nullable|integer|min:0',
            'base_price' => 'nullable|numeric|min:0',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
        ]);

        $treatment->update($validated);

        return response()->json([
            'message' => 'Tratamiento actualizado correctamente',
            'data' => $this->formatTreatment($treatment->load('chair')),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $treatment = Treatment::findOrFail($id);

        if ($treatment->patientProcedures()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar un tratamiento con procedimientos asociados',
            ], 422);
        }

        $treatment->delete();

        return response()->json(['message' => 'Tratamiento eliminado correctamente']);
    }

    private function formatTreatment(Treatment $treatment): array
    {
        return [
            'id' => $treatment->id,
            'chair_id' => $treatment->chair_id,
            'name' => $treatment->name,
            'code' => $treatment->code,
            'description' => $treatment->description,
            'requires_tooth' => (bool) $treatment->requires_tooth,
            'applies_to_all_upper' => (bool) $treatment->applies_to_all_upper,
            'applies_to_all_lower' => (bool) $treatment->applies_to_all_lower,
            'estimated_sessions' => $treatment->estimated_sessions,
            'base_price' => $treatment->base_price,
            'sort_order' => $treatment->sort_order,
            'active' => (bool) $treatment->active,
            'chair' => $treatment->chair ? [
                'id' => $treatment->chair->id,
                'name' => $treatment->chair->name,
                'color' => $treatment->chair->color,
            ] : null,
            'created_at' => $treatment->created_at,
            'updated_at' => $treatment->updated_at,
        ];
    }
}
