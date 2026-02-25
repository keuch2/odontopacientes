<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Treatment;
use App\Models\TreatmentSubclass;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TreatmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Treatment::with(['chair', 'subclasses' => function ($q) {
            $q->where('active', true)->orderBy('sort_order')->orderBy('name');
        }]);

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
        $treatment = Treatment::with(['chair', 'subclasses'])->findOrFail($id);

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

    // ---- Subclass CRUD ----

    public function subclassIndex(int $treatmentId): JsonResponse
    {
        $treatment = Treatment::findOrFail($treatmentId);
        $subclasses = $treatment->subclasses()->orderBy('sort_order')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $subclasses->map(fn ($s) => [
                'id' => $s->id,
                'treatment_id' => $s->treatment_id,
                'name' => $s->name,
                'sort_order' => $s->sort_order,
                'active' => (bool) $s->active,
            ]),
        ]);
    }

    public function subclassStore(Request $request, int $treatmentId): JsonResponse
    {
        $treatment = Treatment::findOrFail($treatmentId);

        if ($treatment->subclasses()->count() >= 5) {
            return response()->json([
                'message' => 'Un tratamiento puede tener un maximo de 5 sub-clases',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
        ]);

        $subclass = $treatment->subclasses()->create(array_merge([
            'sort_order' => 0,
            'active' => true,
        ], $validated));

        return response()->json([
            'message' => 'Sub-clase creada correctamente',
            'data' => [
                'id' => $subclass->id,
                'treatment_id' => $subclass->treatment_id,
                'name' => $subclass->name,
                'sort_order' => $subclass->sort_order,
                'active' => (bool) $subclass->active,
            ],
        ], 201);
    }

    public function subclassUpdate(Request $request, int $treatmentId, int $subclassId): JsonResponse
    {
        Treatment::findOrFail($treatmentId);
        $subclass = TreatmentSubclass::where('treatment_id', $treatmentId)->findOrFail($subclassId);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
        ]);

        $subclass->update($validated);

        return response()->json([
            'message' => 'Sub-clase actualizada correctamente',
            'data' => [
                'id' => $subclass->id,
                'treatment_id' => $subclass->treatment_id,
                'name' => $subclass->name,
                'sort_order' => $subclass->sort_order,
                'active' => (bool) $subclass->active,
            ],
        ]);
    }

    public function subclassDestroy(int $treatmentId, int $subclassId): JsonResponse
    {
        Treatment::findOrFail($treatmentId);
        $subclass = TreatmentSubclass::where('treatment_id', $treatmentId)->findOrFail($subclassId);

        if ($subclass->patientProcedures()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar una sub-clase con procedimientos asociados',
            ], 422);
        }

        $subclass->delete();

        return response()->json(['message' => 'Sub-clase eliminada correctamente']);
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
            'subclasses' => $treatment->relationLoaded('subclasses')
                ? $treatment->subclasses->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'sort_order' => $s->sort_order,
                    'active' => (bool) $s->active,
                ])->values()->toArray()
                : [],
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
