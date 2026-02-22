<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => [], // Deshabilitado - CORS manejado por CustomCors middleware

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost/odontopacientes/web-admin',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5175',
        'http://localhost:8081',
        'http://localhost:19006',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:19006',
        'http://localhost',
    ],

    // Permitir IPs LAN para desarrollo móvil (Expo Go)
    'allowed_origins_patterns' => [
        '/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/',  // 192.168.x.x
        '/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/', // 10.x.x.x
        '/^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/', // 172.16.x.x - 172.31.x.x
    ],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
