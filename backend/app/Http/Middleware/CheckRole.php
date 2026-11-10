<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Las rutas protegidas usan demo.auth, que deja el usuario en este atributo.
        $user = $request->attributes->get('demo_user');

        if (!$user) {
            return response()->json([
                'message' => 'No autenticado'
            ], 401);
        }

        if (!in_array($user['role'] ?? null, $roles, true)) {
            return response()->json([
                'message' => 'Sin permisos para acceder a este recurso',
            ], 403);
        }

        return $next($request);
    }
}
