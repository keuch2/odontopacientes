<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class AccountController extends Controller
{
    /**
     * Eliminar la cuenta del usuario autenticado.
     *
     * Por requerimiento de la App Store (Guideline 5.1.1(v)): los usuarios
     * deben poder iniciar la eliminación de su cuenta desde la app.
     *
     * Estrategia: anonimizamos al usuario en lugar de hard-delete para
     * preservar la integridad referencial de pacientes/procedimientos que
     * pertenecen a la cátedra (responsable académico). La PII del usuario
     * se elimina de forma irreversible.
     */
    public function destroy(Request $request)
    {
        $userAttr = $request->attributes->get('demo_user');
        $userId = null;

        if (is_array($userAttr) && isset($userAttr['id'])) {
            $userId = $userAttr['id'];
        } else {
            $bearer = $request->bearerToken();
            if ($bearer && str_starts_with($bearer, 'DEMO_')) {
                $decoded = base64_decode(substr($bearer, 5), true);
                if ($decoded) {
                    $found = User::where('email', $decoded)->first();
                    if ($found) {
                        $userId = $found->id;
                    }
                }
            }
        }

        if (!$userId) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        $validated = $request->validate([
            'password' => 'required|string',
            'confirm' => 'required|in:ELIMINAR',
        ], [
            'password.required' => 'Debes confirmar tu contraseña actual para eliminar la cuenta.',
            'confirm.in' => 'Debes escribir ELIMINAR para confirmar.',
        ]);

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'La contraseña no coincide. La cuenta no se eliminó.',
            ], 422);
        }

        try {
            DB::transaction(function () use ($user) {
                if ($user->profile_image) {
                    try {
                        Storage::disk('public')->delete($user->profile_image);
                    } catch (Throwable $e) {
                    }
                }

                DB::table('notifications')->where('user_id', $user->id)->delete();
                DB::table('sessions')->where('user_id', $user->id)->delete();

                if (method_exists($user, 'tokens')) {
                    try {
                        $user->tokens()->delete();
                    } catch (Throwable $e) {
                    }
                }

                $anonymizedEmail = sprintf('deleted-%d-%s@deleted.invalid', $user->id, Str::random(8));

                $user->update([
                    'name' => 'Cuenta eliminada',
                    'email' => $anonymizedEmail,
                    'password' => bcrypt(Str::random(40)),
                    'phone' => null,
                    'birth_date' => null,
                    'city' => null,
                    'institution' => null,
                    'course' => null,
                    'facebook' => null,
                    'instagram' => null,
                    'tiktok' => null,
                    'profile_image' => null,
                    'active' => false,
                ]);
            });
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'No se pudo eliminar la cuenta. Intenta nuevamente o contáctanos a privacidad@codexpy.com',
                'error' => app()->environment('production') ? null : $e->getMessage(),
            ], 500);
        }

        return response()->json([
            'message' => 'Tu cuenta fue eliminada. La sesión se cerrará automáticamente.',
        ]);
    }
}
