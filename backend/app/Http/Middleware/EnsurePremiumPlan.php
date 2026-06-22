<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Permite continuar solo a usuarios con acceso completo (admin O Premium
 * activo). El plan Básico recibe 403. Debe correr DESPUÉS de demo.auth, que es
 * quien puebla el array `demo_user` con `is_premium` ya resuelto.
 *
 * Importante (App Store): el mensaje del 403 es NEUTRO — no menciona "Premium"
 * ni compra/upgrade. El cliente usa `code: plan_restriction` para mostrar un
 * texto genérico.
 */
class EnsurePremiumPlan
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        $user = $request->attributes->get('demo_user');

        if (!$user) {
            // Defensa en profundidad: demo.auth debería haber corrido antes.
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], 401)->header('Access-Control-Allow-Origin', '*');
        }

        $isAdmin = ($user['role'] ?? null) === 'admin';
        $isPremium = (bool) ($user['is_premium'] ?? false);

        // Doble red: admin pasa siempre, aunque is_premium no estuviera poblado.
        if ($isAdmin || $isPremium) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Esta función no está disponible en tu plan actual.',
            'code' => 'plan_restriction',
        ], 403)->header('Access-Control-Allow-Origin', '*');
    }
}
