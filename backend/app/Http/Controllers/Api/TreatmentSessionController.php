<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\TreatmentSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TreatmentSessionController extends Controller
{
    public function index(int $assignmentId): JsonResponse
    {
        $assignment = Assignment::findOrFail($assignmentId);
        
        $sessions = TreatmentSession::where('assignment_id', $assignmentId)
            ->with('creator:id,name')
            ->orderBy('session_number')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $sessions,
        ]);
    }

    public function store(Request $request, int $assignmentId): JsonResponse
    {
        $assignment = Assignment::findOrFail($assignmentId);

        $validated = $request->validate([
            'session_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:programada,completada,cancelada',
        ]);

        $nextSessionNumber = TreatmentSession::where('assignment_id', $assignmentId)
            ->max('session_number') + 1;

        $user = $request->attributes->get('demo_user');
        $userId = is_array($user) ? ($user['id'] ?? null) : ($user->id ?? null);

        $session = TreatmentSession::create([
            'assignment_id' => $assignmentId,
            'session_number' => $nextSessionNumber,
            'session_date' => $validated['session_date'],
            'notes' => $validated['notes'] ?? null,
            'status' => $validated['status'] ?? 'completada',
            'created_by' => $userId,
        ]);

        if ($validated['status'] ?? 'completada' === 'completada') {
            $assignment->increment('sessions_completed');
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesión registrada correctamente',
            'data' => $session->load('creator:id,name'),
        ], 201);
    }

    public function update(Request $request, int $sessionId): JsonResponse
    {
        $session = TreatmentSession::findOrFail($sessionId);

        $validated = $request->validate([
            'session_date' => 'sometimes|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'sometimes|in:programada,completada,cancelada',
        ]);

        $oldStatus = $session->status;
        $session->update($validated);

        if (isset($validated['status']) && $oldStatus !== $validated['status']) {
            $assignment = $session->assignment;
            if ($oldStatus === 'completada' && $validated['status'] !== 'completada') {
                $assignment->decrement('sessions_completed');
            } elseif ($oldStatus !== 'completada' && $validated['status'] === 'completada') {
                $assignment->increment('sessions_completed');
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesión actualizada correctamente',
            'data' => $session->load('creator:id,name'),
        ]);
    }

    public function destroy(int $sessionId): JsonResponse
    {
        $session = TreatmentSession::findOrFail($sessionId);
        
        if ($session->status === 'completada') {
            $session->assignment->decrement('sessions_completed');
        }

        $session->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión eliminada correctamente',
        ]);
    }

    public function updateSessionsTotal(Request $request, int $assignmentId): JsonResponse
    {
        $assignment = Assignment::findOrFail($assignmentId);

        $validated = $request->validate([
            'sessions_total' => 'required|integer|min:1|max:50',
        ]);

        $assignment->patientProcedure->treatment->update([
            'estimated_sessions' => $validated['sessions_total'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Número de sesiones actualizado',
            'data' => [
                'sessions_total' => $validated['sessions_total'],
            ],
        ]);
    }
}
