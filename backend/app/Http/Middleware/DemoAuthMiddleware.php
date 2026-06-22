<?php

namespace App\Http\Middleware;

use App\Support\DemoUserFactory;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Laravel\Sanctum\PersonalAccessToken;

class DemoAuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        $authorization = $request->header('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            return $this->unauthorizedResponse('Token de autenticación requerido.');
        }

        $token = substr($authorization, 7);

        // Try demo token first
        if (str_starts_with($token, 'demo-token-')) {
            $encodedEmail = substr($token, strlen('demo-token-'));
            $email = base64_decode(strtr($encodedEmail, '-_', '+/'));

            if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $user = DemoUserFactory::getUserByEmail($email);
                if ($user) {
                    $request->attributes->set('demo_user', $user);
                    return $next($request);
                }
            }
        }

        // Try Sanctum token
        $accessToken = PersonalAccessToken::findToken($token);
        if ($accessToken) {
            $user = $accessToken->tokenable;
            if ($user instanceof User) {
                $user->load(['faculty.university', 'student']);
                // Mismo builder que DemoUserFactory para que el array demo_user
                // (incluido el plan / is_premium) nunca diverja entre ramas.
                $userData = DemoUserFactory::buildFromModel($user);
                $request->attributes->set('demo_user', $userData);
                return $next($request);
            }
        }

        return $this->unauthorizedResponse('Token inválido o expirado.');
    }

    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'message' => $message,
        ], 401)->header('Access-Control-Allow-Origin', '*');
    }
}
