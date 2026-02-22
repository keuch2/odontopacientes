<?php

namespace App\Support;

use App\Models\User;

class DemoUserFactory
{
    /**
     * Retrieve user data by email from database.
     * Falls back to demo data if user not found in database.
     */
    public static function getUserByEmail(string $email): ?array
    {
        // First try to get user from database
        $user = User::where('email', $email)->with(['faculty.university', 'student'])->first();
        
        if ($user) {
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
            ],
        ];

        return $demoUsers[$email] ?? null;
    }
}
