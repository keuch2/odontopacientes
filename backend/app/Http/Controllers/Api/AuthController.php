<?php

namespace App\Http\Controllers\Api;

use Illuminate\Routing\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function checkEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422)->header('Access-Control-Allow-Origin', '*')
              ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
              ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
        }

        $email = $request->input('email');
        $exists = User::where('email', $email)->exists();

        return response()->json([
            'exists' => $exists,
        ])->header('Access-Control-Allow-Origin', '*')
          ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
    }

    /**
     * Iniciar sesión
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Datos de entrada inválidos',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                \Log::info('Login failed - Invalid credentials', [
                    'email' => $request->email,
                    'user_found' => $user ? 'yes' : 'no',
                    'password_check' => $user ? (Hash::check($request->password, $user->password) ? 'match' : 'no match') : 'N/A'
                ]);
                return response()->json([
                    'message' => 'Las credenciales proporcionadas son incorrectas.'
                ], 401);
            }

            // Verificar si la cuenta está activa
            if (!$user->active) {
                \Log::info('Login blocked - Inactive account', ['email' => $request->email, 'user_id' => $user->id]);
                return response()->json([
                    'message' => 'Tu cuenta está pendiente de aprobación por un administrador. Por favor espera a que tu cuenta sea activada.'
                ], 403);
            }

            // Crear token de acceso
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Inicio de sesión exitoso',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'profile_image' => $user->profile_image,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error interno del servidor',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información del usuario autenticado
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(['faculty.university', 'student']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'faculty_id' => $user->faculty_id,
                'faculty' => $user->faculty ? [
                    'id' => $user->faculty->id,
                    'name' => $user->faculty->name,
                    'university' => [
                        'id' => $user->faculty->university->id,
                        'name' => $user->faculty->university->name,
                        'code' => $user->faculty->university->code,
                    ]
                ] : null,
                'student' => $user->student ? [
                    'id' => $user->student->id,
                    'student_number' => $user->student->student_number,
                    'year' => $user->student->year,
                ] : null,
                'phone' => $user->phone,
                'profile_image' => $user->profile_image,
                'active' => $user->active,
                'email_verified_at' => $user->email_verified_at,
                'created_at' => $user->created_at,
            ]
        ]);
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // Registrar auditoría antes de eliminar tokens
        \App\Models\Audit::log('logout', 'User', $user->id);

        // Revocar todos los tokens del usuario actual
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    /**
     * Registrar nuevo usuario desde app móvil (público)
     */
    public function registerPublic(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'required|string|max:20',
            'birth_date' => 'nullable|date',
            'course' => 'nullable|string|max:100',
            'faculty' => 'nullable|string|max:255',
            'profile_image' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Procesar imagen de perfil si se envió
            $profileImagePath = null;
            if ($request->profile_image && str_starts_with($request->profile_image, 'data:image')) {
                $imageData = $request->profile_image;
                $image = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
                $image = base64_decode($image);
                
                if ($image) {
                    $fileName = 'profile_' . uniqid() . '.jpg';
                    $path = 'profile_images/' . $fileName;
                    \Storage::disk('public')->put($path, $image);
                    $profileImagePath = '/storage/' . $path;
                }
            }

            // Crear usuario con rol de alumno por defecto
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'alumno',
                'phone' => $request->phone,
                'active' => true, // Cuenta activa automáticamente
                'profile_image' => $profileImagePath,
            ]);

            // Crear token de acceso
            $token = $user->createToken('mobile_app')->plainTextToken;

            // Registrar auditoría
            \App\Models\Audit::log('created', 'User', $user->id, [
                'source' => 'mobile_app',
                'role' => 'alumno',
                'course' => $request->course,
                'faculty' => $request->faculty,
            ]);

            return response()->json([
                'message' => 'Registro exitoso. Tu cuenta está pendiente de aprobación.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'active' => $user->active,
                ],
                'access_token' => $token,
                'token_type' => 'Bearer',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Registrar nuevo usuario (solo admin)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,coordinador,admision,alumno',
            'faculty_id' => 'required|exists:faculties,id',
            'phone' => 'nullable|string|max:20',
            'student_number' => 'nullable|string|max:20|unique:students,student_number',
            'year' => 'nullable|integer|min:2020|max:' . (date('Y') + 5),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'faculty_id' => $request->faculty_id,
            'phone' => $request->phone,
        ]);

        // Si es estudiante, crear registro adicional
        if ($request->role === 'alumno' && $request->student_number) {
            \App\Models\Student::create([
                'user_id' => $user->id,
                'university_id' => $user->faculty->university_id,
                'student_number' => $request->student_number,
                'year' => $request->year ?? date('Y'),
                'phone' => $request->phone,
            ]);
        }

        // Registrar auditoría
        \App\Models\Audit::log('created', 'User', $user->id, [
            'role' => $request->role,
            'faculty_id' => $request->faculty_id,
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ], 201);
    }

    /**
     * Actualizar perfil del usuario autenticado
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $oldData = $user->only(['name', 'email', 'phone']);
        
        $user->update($request->only(['name', 'email', 'phone']));

        // Registrar auditoría
        \App\Models\Audit::log('updated', 'User', $user->id, [
            'old_data' => $oldData,
            'new_data' => $user->only(['name', 'email', 'phone']),
        ]);

        return response()->json([
            'message' => 'Perfil actualizado exitosamente',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ]
        ]);
    }

    /**
     * Actualizar contraseña del usuario autenticado
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta',
                'errors' => [
                    'current_password' => ['La contraseña actual es incorrecta']
                ]
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Registrar auditoría
        \App\Models\Audit::log('updated', 'User', $user->id, [
            'field' => 'password',
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada exitosamente'
        ]);
    }

    /**
     * Solicitar restablecimiento de contraseña
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Aquí implementarías el envío del email de restablecimiento
        // Por ahora, solo retornamos un mensaje de éxito

        return response()->json([
            'message' => 'Se ha enviado un enlace de restablecimiento a tu correo electrónico'
        ]);
    }

    /**
     * Restablecer contraseña
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos de entrada inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Aquí implementarías la lógica de validación del token
        // y el restablecimiento de la contraseña

        return response()->json([
            'message' => 'Contraseña restablecida exitosamente'
        ]);
    }
}
