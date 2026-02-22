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
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Configuración de excepciones para API
        $exceptions->render(function (Exception $e, $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'error' => config('app.debug') ? $e->getTrace() : null
                ], 500);
            }
        });
    })->create();
