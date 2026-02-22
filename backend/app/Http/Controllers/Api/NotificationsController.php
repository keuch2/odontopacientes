<?php

namespace App\Http\Controllers\Api;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class NotificationsController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->input('per_page', 20);

        $user = $request->attributes->get('demo_user');

        $notifications = Notification::where('user_id', $user['id'] ?? 1)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $items = collect($notifications->items())->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'body' => $notification->body,
                'data' => $notification->data,
                'priority' => $notification->priority,
                'created_at' => $notification->created_at->toIso8601String(),
                'read_at' => $notification->read_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markAsRead(Request $request, int $id)
    {
        $user = $request->attributes->get('demo_user');

        $notification = Notification::where('id', $id)
            ->where('user_id', $user['id'] ?? 0)
            ->firstOrFail();

        $notification->markAsRead();

        return response()->json(['message' => 'Notificación marcada como leída']);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->attributes->get('demo_user');

        Notification::where('user_id', $user['id'] ?? 0)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }
}
