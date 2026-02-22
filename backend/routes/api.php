<?php

use App\Support\DemoUserFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rutas de la API para el sistema OdontoPacientes.
| Todas las rutas están protegidas con Sanctum excepto las de autenticación.
|
*/

// Rutas de autenticación (públicas)
Route::prefix('auth')->group(function () {
    Route::post('/register', [\App\Http\Controllers\Api\AuthController::class, 'registerPublic']);
    Route::post('/check-email', [\App\Http\Controllers\Api\AuthController::class, 'checkEmail']);
    
    Route::post('/login', [\App\Http\Controllers\Api\AuthController::class, 'login']);

    Route::post('/logout', function () {
        return response()->json([
            'message' => 'Sesión finalizada correctamente.'
        ]);
    })->middleware('demo.auth');

    Route::get('/me', function (Request $request) {
        $user = $request->attributes->get('demo_user');

        return response()->json([
            'user' => $user,
        ]);
    })->middleware('demo.auth');

    // Manejar OPTIONS request para CORS preflight
    Route::options('/login', function () {
        return response()->json([])->header('Access-Control-Allow-Origin', '*')
                                   ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                                   ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
    });

    Route::options('/check-email', function () {
        return response()->json([])->header('Access-Control-Allow-Origin', '*')
                                   ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                                   ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With');
    });
});

// Rutas públicas de referencia (chairs, treatments, universities)
Route::get('/chairs', [\App\Http\Controllers\Api\ChairController::class, 'index']);
Route::get('/chairs/{chair}', [\App\Http\Controllers\Api\ChairController::class, 'show']);
Route::get('/treatments', [\App\Http\Controllers\Api\TreatmentController::class, 'index']);
Route::get('/treatments/{id}', [\App\Http\Controllers\Api\TreatmentController::class, 'show']);
Route::get('/universities', [\App\Http\Controllers\Api\UniversityController::class, 'index']);

// Rutas protegidas con token demo
Route::middleware('demo.auth')->group(function () {
    // Stats
    Route::get('/stats/dashboard', [\App\Http\Controllers\Api\StatsController::class, 'dashboard']);
    Route::get('/stats/procedures-by-chair', [\App\Http\Controllers\Api\StatsController::class, 'proceduresByChair']);
    Route::get('/stats/students-performance', [\App\Http\Controllers\Api\StatsController::class, 'studentsPerformance']);
    
    // Admin
    Route::get('/admin/system-stats', [\App\Http\Controllers\Api\AdminController::class, 'systemStats']);
    Route::get('/admin/pending-approvals', [\App\Http\Controllers\Api\AdminController::class, 'pendingApprovals']);
    Route::get('/admin/audits', [\App\Http\Controllers\Api\AdminController::class, 'audits']);
    Route::get('/admin/alerts', [\App\Http\Controllers\Api\AdminController::class, 'alerts']);
    
    // Profile update (for mobile app)
    Route::put('/profile', function (Request $request) {
        $user = $request->attributes->get('demo_user');
        
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }
        
        $userModel = \App\Models\User::find($user['id']);
        
        if (!$userModel) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'birth_date' => 'nullable|date',
            'city' => 'nullable|string|max:100',
            'institution' => 'nullable|string|max:255',
            'university_id' => 'nullable|exists:universities,id',
            'course' => 'nullable|string|max:100',
            'facebook' => 'nullable|string|max:255',
            'instagram' => 'nullable|string|max:255',
            'tiktok' => 'nullable|string|max:255',
        ]);
        
        $userModel->update($validated);
        $userModel->load('university');
        
        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'data' => [
                'id' => $userModel->id,
                'name' => $userModel->name,
                'email' => $userModel->email,
                'role' => $userModel->role,
                'phone' => $userModel->phone,
                'birth_date' => $userModel->birth_date,
                'city' => $userModel->city ?? null,
                'institution' => $userModel->institution ?? null,
                'university_id' => $userModel->university_id,
                'university' => $userModel->university ? [
                    'id' => $userModel->university->id,
                    'name' => $userModel->university->name,
                ] : null,
                'course' => $userModel->course ?? null,
                'facebook' => $userModel->facebook ?? null,
                'instagram' => $userModel->instagram ?? null,
                'tiktok' => $userModel->tiktok ?? null,
                'profile_image' => $userModel->profile_image ?? null,
            ]
        ]);
    });
    
    // Upload profile image
    Route::post('/profile/image', function (Request $request) {
        try {
            $user = $request->attributes->get('demo_user');
            
            if (!$user) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }
            
            $userModel = \App\Models\User::find($user['id']);
            
            if (!$userModel) {
                return response()->json(['message' => 'Usuario no encontrado'], 404);
            }
            
            $request->validate([
                'image' => 'required|string',
            ]);
            
            // Decode base64 image
            $imageData = $request->input('image');
            
            // Remove data:image/...;base64, prefix if present
            if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
                $imageData = substr($imageData, strpos($imageData, ',') + 1);
                $extension = $matches[1];
            } else {
                $extension = 'jpg';
            }
            
            $imageData = base64_decode($imageData);
            
            if ($imageData === false) {
                return response()->json(['message' => 'Imagen inválida - no se pudo decodificar base64'], 400);
            }
            
            // Use Laravel Storage facade for better path handling
            $storagePath = storage_path('app/public/profile-images');
            if (!file_exists($storagePath)) {
                mkdir($storagePath, 0755, true);
            }
            
            // Delete old image if exists
            if ($userModel->profile_image) {
                $oldImagePath = storage_path('app/public/' . $userModel->profile_image);
                if (file_exists($oldImagePath)) {
                    @unlink($oldImagePath);
                }
            }
            
            // Generate unique filename
            $filename = 'profile_' . $userModel->id . '_' . time() . '.' . $extension;
            $filepath = $storagePath . '/' . $filename;
            
            // Save image
            $saved = file_put_contents($filepath, $imageData);
            
            if ($saved === false) {
                return response()->json(['message' => 'Error al guardar la imagen en el servidor'], 500);
            }
            
            // Update user profile_image path
            $relativePath = 'profile-images/' . $filename;
            $userModel->update(['profile_image' => $relativePath]);
            
            return response()->json([
                'message' => 'Imagen de perfil actualizada correctamente',
                'data' => [
                    'profile_image' => $relativePath,
                    'profile_image_url' => url('storage/' . $relativePath),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error uploading profile image: ' . $e->getMessage());
            return response()->json(['message' => 'Error al procesar la imagen: ' . $e->getMessage()], 500);
        }
    });
    
    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationsController::class, 'index']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationsController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationsController::class, 'markAllAsRead']);

    // Notification Preferences
    Route::get('/notification-preferences', [\App\Http\Controllers\Api\NotificationPreferencesController::class, 'index']);
    Route::post('/notification-preferences', [\App\Http\Controllers\Api\NotificationPreferencesController::class, 'update']);
    
    // Assignments
    Route::get('/my-assignments', [\App\Http\Controllers\Api\AssignmentsController::class, 'myAssignments']);
    Route::get('/my-created-patients', [\App\Http\Controllers\Api\AssignmentsController::class, 'myCreatedPatients']);
    Route::get('/my-assignments/{id}', [\App\Http\Controllers\Api\AssignmentsController::class, 'show']);
    Route::post('/my-assignments/{id}/complete', [\App\Http\Controllers\Api\AssignmentsController::class, 'complete']);
    Route::post('/my-assignments/{id}/abandon', [\App\Http\Controllers\Api\AssignmentsController::class, 'abandon']);
    
    // Treatment Sessions
    Route::get('/assignments/{assignmentId}/sessions', [\App\Http\Controllers\Api\TreatmentSessionController::class, 'index']);
    Route::post('/assignments/{assignmentId}/sessions', [\App\Http\Controllers\Api\TreatmentSessionController::class, 'store']);
    Route::put('/treatment-sessions/{sessionId}', [\App\Http\Controllers\Api\TreatmentSessionController::class, 'update']);
    Route::delete('/treatment-sessions/{sessionId}', [\App\Http\Controllers\Api\TreatmentSessionController::class, 'destroy']);
    
    // Chairs CRUD (admin)
    Route::post('/chairs', [\App\Http\Controllers\Api\ChairController::class, 'store']);
    Route::put('/chairs/{chair}', [\App\Http\Controllers\Api\ChairController::class, 'update']);
    Route::delete('/chairs/{chair}', [\App\Http\Controllers\Api\ChairController::class, 'destroy']);

    // Treatments CRUD (admin)
    Route::post('/treatments', [\App\Http\Controllers\Api\TreatmentController::class, 'store']);
    Route::put('/treatments/{id}', [\App\Http\Controllers\Api\TreatmentController::class, 'update']);
    Route::delete('/treatments/{id}', [\App\Http\Controllers\Api\TreatmentController::class, 'destroy']);

    // Universities CRUD (admin)
    Route::get('/universities/{university}', [\App\Http\Controllers\Api\UniversityController::class, 'show']);
    Route::post('/universities', [\App\Http\Controllers\Api\UniversityController::class, 'store']);
    Route::put('/universities/{university}', [\App\Http\Controllers\Api\UniversityController::class, 'update']);
    Route::delete('/universities/{university}', [\App\Http\Controllers\Api\UniversityController::class, 'destroy']);

    // Patients
    Route::apiResource('patients', \App\Http\Controllers\Api\PatientController::class);
    
    // Patient Procedures
    Route::get('/patients/{patient}/procedures', [\App\Http\Controllers\Api\PatientProcedureController::class, 'index']);
    Route::post('/patients/{patient}/procedures', [\App\Http\Controllers\Api\PatientProcedureController::class, 'store']);
    Route::get('/patient-procedures/{patientProcedure}', [\App\Http\Controllers\Api\PatientProcedureController::class, 'show']);
    Route::put('/patient-procedures/{patientProcedure}', [\App\Http\Controllers\Api\PatientProcedureController::class, 'update']);
    Route::delete('/patient-procedures/{patientProcedure}', [\App\Http\Controllers\Api\PatientProcedureController::class, 'destroy']);
    Route::post('/patient-procedures/{patientProcedure}/assign', [\App\Http\Controllers\Api\PatientProcedureController::class, 'assign']);
    Route::post('/patient-procedures/{patientProcedure}/cancel', [\App\Http\Controllers\Api\PatientProcedureController::class, 'cancel']);
    
    // Odontograms
    Route::get('/patients/{patient}/odontograms', [\App\Http\Controllers\Api\OdontogramController::class, 'index']);
    Route::post('/patients/{patient}/odontograms', [\App\Http\Controllers\Api\OdontogramController::class, 'store']);
    Route::get('/odontograms/{odontogram}', [\App\Http\Controllers\Api\OdontogramController::class, 'show']);
    Route::put('/odontograms/{odontogram}', [\App\Http\Controllers\Api\OdontogramController::class, 'update']);
    Route::delete('/odontograms/{odontogram}', [\App\Http\Controllers\Api\OdontogramController::class, 'destroy']);
    Route::put('/odontograms/{odontogram}/teeth', [\App\Http\Controllers\Api\OdontogramController::class, 'updateTooth']);
    Route::delete('/odontograms/{odontogram}/teeth/{toothFdi}', [\App\Http\Controllers\Api\OdontogramController::class, 'deleteTooth']);
    
    // Procedure Photos
    Route::get('/assignments/{assignment}/photos', [\App\Http\Controllers\Api\ProcedurePhotoController::class, 'index']);
    Route::post('/assignments/{assignment}/photos', [\App\Http\Controllers\Api\ProcedurePhotoController::class, 'store']);
    Route::post('/assignments/{assignment}/photos/base64', [\App\Http\Controllers\Api\ProcedurePhotoController::class, 'storeBase64']);
    Route::put('/procedure-photos/{procedurePhoto}', [\App\Http\Controllers\Api\ProcedurePhotoController::class, 'update']);
    Route::delete('/procedure-photos/{procedurePhoto}', [\App\Http\Controllers\Api\ProcedurePhotoController::class, 'destroy']);
    
    // Endpoint de usuarios - devuelve usuarios de la base de datos
    Route::get('/users', function () {
        $users = \App\Models\User::with('university')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'active' => (bool) $user->active,
                    'phone' => $user->phone,
                    'birth_date' => $user->birth_date,
                    'profile_image' => $user->profile_image,
                    'university_id' => $user->university_id,
                    'university' => $user->university ? [
                        'id' => $user->university->id,
                        'name' => $user->university->name,
                    ] : null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            });
        
        return response()->json([
            'data' => $users
        ]);
    });
    
    // Endpoint para activar/desactivar usuario
    Route::put('/users/{id}/toggle-active', function ($id) {
        $user = \App\Models\User::findOrFail($id);
        $user->active = !$user->active;
        $user->save();
        
        return response()->json([
            'message' => 'Usuario actualizado correctamente',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'active' => (bool) $user->active,
                'phone' => $user->phone,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    });
    
    // Endpoint para crear nuevo usuario
    Route::post('/users', function (Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,alumno',
            'birth_date' => 'nullable|date',
            'university_id' => 'nullable|exists:universities,id',
        ]);

        $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        $validated['active'] = true;

        $user = \App\Models\User::create($validated);
        $user->load('university');

        return response()->json([
            'message' => 'Usuario creado correctamente',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'active' => (bool) $user->active,
                'phone' => $user->phone,
                'birth_date' => $user->birth_date,
                'profile_image' => $user->profile_image,
                'university_id' => $user->university_id,
                'university' => $user->university ? [
                    'id' => $user->university->id,
                    'name' => $user->university->name,
                ] : null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ], 201);
    });

    // Endpoint para actualizar usuario completo
    Route::put('/users/{id}', function (Illuminate\Http\Request $request, $id) {
        $user = \App\Models\User::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:admin,alumno',
            'active' => 'boolean',
            'birth_date' => 'nullable|date',
            'profile_image' => 'nullable|string',
            'university_id' => 'nullable|exists:universities,id',
        ]);
        
        $user->update($validated);
        $user->load('university');
        
        return response()->json([
            'message' => 'Usuario actualizado correctamente',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'active' => (bool) $user->active,
                'phone' => $user->phone,
                'birth_date' => $user->birth_date,
                'profile_image' => $user->profile_image,
                'university_id' => $user->university_id,
                'university' => $user->university ? [
                    'id' => $user->university->id,
                    'name' => $user->university->name,
                ] : null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    });
    
    // Ads CRUD endpoints (admin)
    Route::get('/ads', function () {
        $ads = \App\Models\Ad::orderBy('order')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json(['data' => $ads]);
    });
    
    Route::post('/ads', function (Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'image_url' => 'required|string|max:500',
            'link_url' => 'nullable|string|max:500',
            'position' => 'required|in:dashboard_banner,sidebar,popup',
            'active' => 'boolean',
            'order' => 'integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);
        
        $ad = \App\Models\Ad::create($validated);
        
        return response()->json([
            'message' => 'Anuncio creado correctamente',
            'data' => $ad
        ], 201);
    });
    
    Route::get('/ads/{id}', function ($id) {
        $ad = \App\Models\Ad::findOrFail($id);
        return response()->json(['data' => $ad]);
    });
    
    Route::put('/ads/{id}', function (Illuminate\Http\Request $request, $id) {
        $ad = \App\Models\Ad::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'image_url' => 'sometimes|required|string|max:500',
            'link_url' => 'nullable|string|max:500',
            'position' => 'sometimes|required|in:dashboard_banner,sidebar,popup',
            'active' => 'boolean',
            'order' => 'integer',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);
        
        $ad->update($validated);
        
        return response()->json([
            'message' => 'Anuncio actualizado correctamente',
            'data' => $ad
        ]);
    });
    
    Route::delete('/ads/{id}', function ($id) {
        $ad = \App\Models\Ad::findOrFail($id);
        $ad->delete();
        
        return response()->json([
            'message' => 'Anuncio eliminado correctamente'
        ]);
    });
    
    Route::post('/ads/{id}/click', function ($id) {
        $ad = \App\Models\Ad::findOrFail($id);
        $ad->incrementClicks();
        
        return response()->json(['message' => 'Click registrado']);
    });

    Route::post('/ads/upload-image', function (Illuminate\Http\Request $request) {
        $request->validate([
            'image' => 'required|string',
        ]);

        $imageData = $request->image;
        $extension = 'jpg';

        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
            $extension = $matches[1];
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
        }

        $imageData = base64_decode($imageData);
        if ($imageData === false) {
            return response()->json(['message' => 'Imagen inválida'], 400);
        }

        $storagePath = storage_path('app/public/ads');
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $filename = 'ad_' . time() . '_' . uniqid() . '.' . $extension;
        $filepath = $storagePath . '/' . $filename;
        file_put_contents($filepath, $imageData);

        $relativePath = 'ads/' . $filename;
        $publicUrl = url('storage/' . $relativePath);

        return response()->json([
            'message' => 'Imagen subida correctamente',
            'data' => [
                'path' => $relativePath,
                'url' => $publicUrl,
            ]
        ]);
    });
});

// Public endpoint for mobile app to get active ads
Route::get('/public/ads', function (Illuminate\Http\Request $request) {
    $position = $request->query('position', 'dashboard_banner');
    
    $ads = \App\Models\Ad::active()
        ->byPosition($position)
        ->orderBy('order')
        ->get()
        ->each(function ($ad) {
            $ad->incrementImpressions();
        });
    
    return response()->json(['data' => $ads]);
});

// Ruta de health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'service' => 'OdontoPacientes API'
    ]);
});

// Test routes
Route::get('/test', function () {
    return response()->json([
        'message' => 'Test endpoint working',
        'timestamp' => now()
    ]);
});

Route::post('/simple-login', function (Illuminate\Http\Request $request) {
    return response()->json([
        'message' => 'Simple login endpoint',
        'data' => $request->all()
    ]);
});

Route::get('/info', function () {
    return response()->json([
        'app_name' => config('app.name'),
        'api_version' => 'v1',
        'environment' => app()->environment()
    ]);
});
