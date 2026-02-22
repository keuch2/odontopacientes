<?php

use Illuminate\Support\Facades\Route;

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
