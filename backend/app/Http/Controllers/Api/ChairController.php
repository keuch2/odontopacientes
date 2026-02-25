<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chair;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

class ChairController extends Controller
{
    /**
     * Listar todas las cátedras
     */
    public function index(Request $request)
    {
        $query = QueryBuilder::for(Chair::class)
            ->allowedFilters(['key', 'name', 'active'])
            ->allowedSorts(['name', 'sort_order', 'created_at'])
            ->with(['treatments' => function ($query) {
                $query->ordered()->with('subclasses');
            }])
            ->ordered();

        if (!$request->has('filter[active]') && !$request->has('include_inactive')) {
            $query->active();
        }

        $chairs = $query->get();

        return response()->json([
            'data' => $chairs->map(function ($chair) {
                return $this->formatChair($chair);
            }),
            'meta' => [
                'total' => $chairs->count(),
                'active_count' => $chairs->where('active', true)->count(),
            ]
        ]);
    }

    /**
     * Mostrar detalles de una cátedra específica
     */
    public function show(Chair $chair)
    {
        $chair->load(['treatments' => function ($query) {
            $query->ordered()->with('subclasses');
        }]);

        $stats = [
            'procedures_total' => $chair->patientProcedures()->count(),
            'procedures_available' => $chair->patientProcedures()->available()->count(),
            'procedures_in_progress' => $chair->patientProcedures()->inProgress()->count(),
            'procedures_completed' => $chair->patientProcedures()->completed()->count(),
        ];

        $popularTreatments = $chair->treatments()
            ->withCount('patientProcedures')
            ->orderBy('patient_procedures_count', 'desc')
            ->limit(5)
            ->get();

        $data = $this->formatChair($chair);
        $data['stats'] = $stats;
        $data['popular_treatments'] = $popularTreatments->map(function ($treatment) {
            return [
                'id' => $treatment->id,
                'name' => $treatment->name,
                'code' => $treatment->code,
                'procedures_count' => $treatment->patient_procedures_count,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'key' => 'required|string|max:20|unique:chairs,key',
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
            'faculty_id' => 'nullable|exists:faculties,id',
        ]);

        $chair = Chair::create(array_merge([
            'color' => '#6366f1',
            'sort_order' => 0,
            'active' => true,
        ], $validated));

        return response()->json([
            'message' => 'Cátedra creada correctamente',
            'data' => $this->formatChair($chair->load('treatments')),
        ], 201);
    }

    public function update(Request $request, Chair $chair)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'key' => 'sometimes|required|string|max:20|unique:chairs,key,' . $chair->id,
            'color' => 'nullable|string|max:7',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'sort_order' => 'nullable|integer',
            'active' => 'nullable|boolean',
            'faculty_id' => 'nullable|exists:faculties,id',
        ]);

        $chair->update($validated);

        return response()->json([
            'message' => 'Cátedra actualizada correctamente',
            'data' => $this->formatChair($chair->load('treatments')),
        ]);
    }

    public function destroy(Chair $chair)
    {
        if ($chair->patientProcedures()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar una cátedra con procedimientos asociados',
            ], 422);
        }

        $chair->treatments()->delete();
        $chair->delete();

        return response()->json(['message' => 'Cátedra eliminada correctamente']);
    }

    private function formatChair(Chair $chair): array
    {
        return [
            'id' => $chair->id,
            'key' => $chair->key,
            'name' => $chair->name,
            'color' => $chair->color,
            'icon' => $chair->icon,
            'description' => $chair->description,
            'sort_order' => $chair->sort_order,
            'active' => (bool) $chair->active,
            'faculty_id' => $chair->faculty_id,
            'treatments_count' => $chair->treatments ? $chair->treatments->count() : 0,
            'treatments' => $chair->treatments ? $chair->treatments->map(function ($treatment) {
                return [
                    'id' => $treatment->id,
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
                ];
            }) : [],
            'created_at' => $chair->created_at,
            'updated_at' => $chair->updated_at,
        ];
    }
}
