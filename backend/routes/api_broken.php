<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChairController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PatientProcedureController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TreatmentController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OdontogramController;
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
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Rutas protegidas con Sanctum
Route::middleware('auth:sanctum')->group(function () {
    
    // Autenticación - rutas protegidas
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
    });

    // Cátedras
    Route::get('/chairs', [ChairController::class, 'index']);
    Route::get('/chairs/{chair}', [ChairController::class, 'show']);
    
    // Tratamientos
    Route::get('/treatments', [TreatmentController::class, 'index']);
    Route::get('/treatments/{treatment}', [TreatmentController::class, 'show']);
    Route::get('/chairs/{chair}/treatments', [TreatmentController::class, 'byChair']);

    // Pacientes
    Route::get('/patients', [PatientController::class, 'index']);
    Route::get('/patients/{patient}', [PatientController::class, 'show']);
    Route::post('/patients', [PatientController::class, 'store'])->middleware('role:admin,coordinador,admision');
    Route::put('/patients/{patient}', [PatientController::class, 'update'])->middleware('role:admin,coordinador,admision');
    Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])->middleware('role:admin,coordinador');
    Route::get('/patients/{patient}/procedures', [PatientController::class, 'procedures']);
    Route::get('/patients/{patient}/odontograms', [PatientController::class, 'odontograms']);
    Route::get('/patients/{patient}/consents', [PatientController::class, 'consents']);
    Route::post('/patients/{patient}/consents', [PatientController::class, 'storeConsent'])->middleware('role:admin,coordinador,admision');

    // Procedimientos de pacientes
    Route::get('/patient-procedures', [PatientProcedureController::class, 'index']);
    Route::get('/patient-procedures/{patientProcedure}', [PatientProcedureController::class, 'show']);
    Route::post('/patient-procedures', [PatientProcedureController::class, 'store'])->middleware('role:admin,coordinador,admision');
    Route::put('/patient-procedures/{patientProcedure}', [PatientProcedureController::class, 'update'])->middleware('role:admin,coordinador,admision');
    Route::delete('/patient-procedures/{patientProcedure}', [PatientProcedureController::class, 'destroy'])->middleware('role:admin,coordinador');
    
    // Asignaciones de procedimientos (estudiantes)
    Route::post('/patient-procedures/{patientProcedure}/assign', [PatientProcedureController::class, 'assign']);
    Route::post('/patient-procedures/{patientProcedure}/complete', [PatientProcedureController::class, 'complete']);
    Route::post('/patient-procedures/{patientProcedure}/abandon', [PatientProcedureController::class, 'abandon']);
    Route::put('/patient-procedures/{patientProcedure}/progress', [PatientProcedureController::class, 'updateProgress']);

    // Estudiantes y sus asignaciones
    Route::get('/students', [StudentController::class, 'index'])->middleware('role:admin,coordinador');
    Route::get('/students/{student}', [StudentController::class, 'show']);
    Route::get('/students/{student}/assignments', [StudentController::class, 'assignments']);
    Route::get('/students/{student}/history', [StudentController::class, 'history']);
    Route::get('/my-assignments', [StudentController::class, 'myAssignments']);
    Route::get('/my-history', [StudentController::class, 'myHistory']);

    // Usuarios (solo admin y coordinadores)
    Route::middleware('role:admin,coordinador')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store'])->middleware('role:admin');
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('role:admin');
        Route::put('/users/{user}/toggle-active', [UserController::class, 'toggleActive'])->middleware('role:admin');
    });

    // Odontogramas
    Route::get('/odontograms/{odontogram}', [OdontogramController::class, 'show']);
    Route::post('/patients/{patient}/odontograms', [OdontogramController::class, 'store']);
    Route::put('/odontograms/{odontogram}', [OdontogramController::class, 'update']);
    Route::delete('/odontograms/{odontogram}', [OdontogramController::class, 'destroy'])->middleware('role:admin,coordinador');
    Route::post('/odontograms/{odontogram}/teeth', [OdontogramController::class, 'updateTooth']);

    // Notificaciones
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

    // Estadísticas y reportes
    Route::prefix('stats')->middleware('role:admin,coordinador')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'patients_count' => \App\Models\Patient::count(),
                'procedures_available' => \App\Models\PatientProcedure::available()->count(),
                'procedures_in_progress' => \App\Models\PatientProcedure::inProgress()->count(),
                'procedures_completed' => \App\Models\PatientProcedure::completed()->count(),
                'students_active' => \App\Models\User::where('role', 'alumno')->where('active', true)->count(),
                'assignments_active' => \App\Models\Assignment::active()->count(),
            ]);
        });

        Route::get('/procedures-by-chair', function () {
            return \App\Models\Chair::withCount([
                'patientProcedures as available' => function ($query) {
                    $query->where('status', 'disponible');
                },
                'patientProcedures as in_progress' => function ($query) {
                    $query->where('status', 'proceso');
                },
                'patientProcedures as completed' => function ($query) {
                    $query->where('status', 'finalizado');
                }
            ])->get();
        });

        Route::get('/students-performance', function () {
            return \App\Models\User::where('role', 'alumno')
                ->with('student')
                ->withCount([
                    'assignments as total_assignments',
                    'assignments as completed_assignments' => function ($query) {
                        $query->where('status', 'completada');
                    },
                    'assignments as active_assignments' => function ($query) {
                        $query->where('status', 'activa');
                    }
                ])
                ->get();
        });
    });

    // Búsqueda global
    Route::get('/search', function () {
        $query = request('q');
        $type = request('type', 'all');

        $results = [];

        if ($type === 'all' || $type === 'patients') {
            $results['patients'] = \App\Models\Patient::searchByName($query)
                ->with('faculty')
                ->limit(10)
                ->get();
        }

        if ($type === 'all' || $type === 'treatments') {
            $results['treatments'] = \App\Models\Treatment::where('name', 'like', "%{$query}%")
                ->orWhere('code', 'like', "%{$query}%")
                ->with('chair')
                ->get();
        }

        return response()->json($results);
});

// Ruta de health check
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'service' => 'OdontoPacientes API',
        'environment' => app()->environment()
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
        'documentation' => url('/api/documentation'),
        'support_email' => 'soporte@odontopacientes.local',
    ]);
});

// Fallback para rutas no encontradas
Route::fallback(function () {
    return response()->json([
        'message' => 'Ruta no encontrada',
        'available_endpoints' => [
            'GET /api/health' => 'Estado de la API',
            'GET /api/info' => 'Información de la API',
            'POST /api/auth/login' => 'Iniciar sesión',
            'GET /api/chairs' => 'Listar cátedras',
            'GET /api/patients' => 'Listar pacientes',
        ]
    ], 404);
});
