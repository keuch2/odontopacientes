<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // CORS: Manejado por CustomCors middleware
        
        // Middleware específico para API
        $middleware->api(prepend: [
            \App\Http\Middleware\CustomCors::class,
            \App\Http\Middleware\ApiRequestLogger::class,
        ]);

        // Alias de middleware para uso en rutas específicas
        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            'faculty' => \App\Http\Middleware\CheckFaculty::class,
            'api.logger' => \App\Http\Middleware\ApiRequestLogger::class,
            'demo.auth' => \App\Http\Middleware\DemoAuthMiddleware::class,
            'plan.premium' => \App\Http\Middleware\EnsurePremiumPlan::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Configuración de excepciones para API
        $exceptions->render(function (Exception $e, $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof \Illuminate\Validation\ValidationException
                || $e instanceof \Illuminate\Auth\AuthenticationException
                || $e instanceof \Illuminate\Http\Exceptions\HttpResponseException) {
                return null;
            }

            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json(['message' => 'Recurso no encontrado.'], 404);
            }

            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return response()->json(['message' => 'No autorizado.'], 403);
            }

            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $messages = [
                    403 => 'No autorizado.',
                    404 => 'Recurso no encontrado.',
                    405 => 'Método no permitido.',
                    413 => 'El archivo es demasiado grande.',
                    429 => 'Demasiados intentos. Espera un momento.',
                ];

                return response()->json(['message' => $messages[$status] ?? 'No se pudo completar la solicitud.'], $status);
            }

            return response()->json(['message' => 'Ocurrió un error inesperado. Intenta nuevamente.'], 500);
        });
    })->create();
