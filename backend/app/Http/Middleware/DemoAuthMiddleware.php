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
                $userData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'faculty_id' => $user->faculty_id,
                    'phone' => $user->phone,
                    'city' => $user->city,
                    'institution' => $user->institution,
                    'course' => $user->course,
                    'facebook' => $user->facebook,
                    'instagram' => $user->instagram,
                    'tiktok' => $user->tiktok,
                    'profile_image' => $user->profile_image,
                    'birth_date' => $user->birth_date,
                ];
                if ($user->faculty) {
                    $userData['faculty'] = [
                        'id' => $user->faculty->id,
                        'name' => $user->faculty->name,
                    ];
                }
                if ($user->student) {
                    $userData['student'] = [
                        'id' => $user->student->id,
                        'student_number' => $user->student->student_number ?? '',
                        'year' => $user->student->year ?? 1,
                    ];
                }
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
