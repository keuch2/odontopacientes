<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'API OdontoPacientes',
        'version' => '1.0.0',
        'documentation' => url('/api/info'),
        'endpoints' => url('/api'),
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});
