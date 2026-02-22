<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UniversityController extends Controller
{
    public function index(): JsonResponse
    {
        $universities = University::with('faculties')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $universities->map(fn ($u) => $this->format($u)),
        ]);
    }

    public function show(University $university): JsonResponse
    {
        $university->load('faculties');

        return response()->json([
            'data' => $this->format($university),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:universities,code',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
        ]);

        $university = University::create($validated);

        return response()->json([
            'message' => 'Universidad creada correctamente',
            'data' => $this->format($university),
        ], 201);
    }

    public function update(Request $request, University $university): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:10|unique:universities,code,' . $university->id,
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
        ]);

        $university->update($validated);

        return response()->json([
            'message' => 'Universidad actualizada correctamente',
            'data' => $this->format($university),
        ]);
    }

    public function destroy(University $university): JsonResponse
    {
        if ($university->faculties()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar una universidad con facultades asociadas',
            ], 422);
        }

        $university->delete();

        return response()->json(['message' => 'Universidad eliminada correctamente']);
    }

    private function format(University $university): array
    {
        return [
            'id' => $university->id,
            'name' => $university->name,
            'code' => $university->code,
            'address' => $university->address,
            'phone' => $university->phone,
            'email' => $university->email,
            'website' => $university->website,
            'faculties_count' => $university->faculties ? $university->faculties->count() : 0,
            'faculties' => $university->faculties ? $university->faculties->map(fn ($f) => [
                'id' => $f->id,
                'name' => $f->name,
            ]) : [],
            'created_at' => $university->created_at,
            'updated_at' => $university->updated_at,
        ];
    }
}
