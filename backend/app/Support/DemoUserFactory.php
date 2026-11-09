<?php

namespace App\Support;

use App\Models\User;

class DemoUserFactory
{
    /**
     * Construye el array `demo_user` (el que los controladores leen vía
     * $request->attributes->get('demo_user')) a partir de un modelo User.
     *
     * ESTE es el único lugar donde se arma el array a partir de un modelo:
     * lo usa DemoAuthMiddleware, para que los campos expuestos (incluido el
     * plan) no diverjan.
     */
    public static function buildFromModel(User $user): array
    {
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'faculty_id' => $user->faculty_id,
            'phone' => $user->phone,
            'active' => (bool) $user->active,
            'city' => $user->city,
            'institution' => $user->institution,
            'course' => $user->course,
            'facebook' => $user->facebook,
            'instagram' => $user->instagram,
            'tiktok' => $user->tiktok,
            'profile_image' => $user->profile_image,
            'birth_date' => $user->birth_date,
            // Plan: `plan` es el literal (para el badge del perfil),
            // `is_premium` es el acceso efectivo ya resuelto (admin O premium
            // activo) que consulta el middleware de autorización.
            'plan' => $user->plan,
            'plan_expires_at' => $user->plan_expires_at,
            'is_premium' => $user->hasFullAccess(),
        ];

        if ($user->faculty) {
            $userData['faculty'] = [
                'id' => $user->faculty->id,
                'name' => $user->faculty->name,
            ];
            if ($user->faculty->university) {
                $userData['faculty']['university'] = [
                    'id' => $user->faculty->university->id,
                    'name' => $user->faculty->university->name,
                    'code' => $user->faculty->university->code ?? null,
                ];
            }
        }

        if ($user->student) {
            $userData['student'] = [
                'id' => $user->student->id,
                'student_number' => $user->student->student_number,
                'year' => $user->student->year,
            ];
        }

        return $userData;
    }
}
