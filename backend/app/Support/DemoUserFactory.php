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
     * tanto la rama Sanctum de DemoAuthMiddleware como getUserByEmail() lo
     * usan, para que nunca diverjan los campos expuestos (incluido el plan).
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

    /**
     * Retrieve user data by email from database.
     * Falls back to demo data if user not found in database.
     */
    public static function getUserByEmail(string $email): ?array
    {
        // First try to get user from database
        $user = User::where('email', $email)->with(['faculty.university', 'student'])->first();

        if ($user) {
            return self::buildFromModel($user);
        }

        // Fallback to demo users if not in database
        $demoUsers = [
            'admin@demo.test' => [
                'id' => 1,
                'name' => 'Admin Demo',
                'email' => 'admin@demo.test',
                'role' => 'admin',
                'faculty_id' => 101,
                'faculty' => [
                    'id' => 101,
                    'name' => 'Facultad de Odontología - Sede Central',
                    'university' => [
                        'id' => 10,
                        'name' => 'Universidad Nacional de Ciencias de la Salud',
                        'code' => 'UNCS'
                    ],
                ],
                'phone' => '+595 21 555 1000',
                'active' => true,
                'plan' => 'basico',
                'plan_expires_at' => null,
                'is_premium' => true, // admin => acceso completo siempre
            ],
            'coordinador@demo.test' => [
                'id' => 2,
                'name' => 'Coordinador Demo',
                'email' => 'coordinador@demo.test',
                'role' => 'coordinador',
                'faculty_id' => 101,
                'faculty' => [
                    'id' => 101,
                    'name' => 'Facultad de Odontología - Sede Central',
                    'university' => [
                        'id' => 10,
                        'name' => 'Universidad Nacional de Ciencias de la Salud',
                        'code' => 'UNCS'
                    ],
                ],
                'phone' => '+595 21 555 1100',
                'active' => true,
                'plan' => 'basico',
                'plan_expires_at' => null,
                'is_premium' => false,
            ],
            'alumno@demo.test' => [
                'id' => 3,
                'name' => 'Alumno Demo',
                'email' => 'alumno@demo.test',
                'role' => 'alumno',
                'faculty_id' => 102,
                'faculty' => [
                    'id' => 102,
                    'name' => 'Facultad de Odontología - Sede Clínicas',
                    'university' => [
                        'id' => 11,
                        'name' => 'Universidad Católica de la Salud',
                        'code' => 'UCS'
                    ],
                ],
                'phone' => '+595 971 200 300',
                'active' => true,
                'plan' => 'basico',
                'plan_expires_at' => null,
                'is_premium' => false,
                'student' => [
                    'id' => 501,
                    'student_number' => 'OD-2024-115',
                    'year' => 4,
                ],
            ],
            'admision@demo.test' => [
                'id' => 4,
                'name' => 'Admisión Demo',
                'email' => 'admision@demo.test',
                'role' => 'admision',
                'faculty_id' => 103,
                'faculty' => [
                    'id' => 103,
                    'name' => 'Facultad de Odontología - Sede Regional',
                    'university' => [
                        'id' => 12,
                        'name' => 'Universidad Metropolitana de Ciencias',
                        'code' => 'UMC'
                    ],
                ],
                'phone' => '+595 981 123 456',
                'active' => true,
                'plan' => 'basico',
                'plan_expires_at' => null,
                'is_premium' => false,
            ],
        ];

        return $demoUsers[$email] ?? null;
    }
}
