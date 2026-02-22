<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Models\NotificationPreference;
use App\Models\Treatment;

class NotificationPreferencesController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $userId = is_array($user) ? ($user['id'] ?? null) : ($user->id ?? null);

        $treatments = Treatment::with('chair')->orderBy('chair_id')->orderBy('name')->get();

        $preferences = NotificationPreference::where('user_id', $userId)
            ->pluck('treatment_id')
            ->toArray();

        $data = $treatments->map(function ($treatment) use ($preferences) {
            return [
                'treatment_id' => $treatment->id,
                'treatment_name' => $treatment->name,
                'chair_name' => $treatment->chair->name ?? '',
                'enabled' => in_array($treatment->id, $preferences),
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function update(Request $request)
    {
        $user = $request->attributes->get('demo_user');
        if (!$user) {
            return response()->json(['message' => 'No autorizado'], 401);
        }

        $userId = is_array($user) ? ($user['id'] ?? null) : ($user->id ?? null);

        $request->validate([
            'treatment_ids' => 'required|array',
            'treatment_ids.*' => 'integer|exists:treatments,id',
        ]);

        $treatmentIds = $request->input('treatment_ids', []);

        // Remove all existing preferences
        NotificationPreference::where('user_id', $userId)->delete();

        // Insert new preferences
        foreach ($treatmentIds as $treatmentId) {
            NotificationPreference::create([
                'user_id' => $userId,
                'treatment_id' => $treatmentId,
                'enabled' => true,
            ]);
        }

        return response()->json([
            'message' => 'Preferencias actualizadas',
            'data' => ['count' => count($treatmentIds)],
        ]);
    }
}
