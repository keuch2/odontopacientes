<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Bancard vPOS
    |--------------------------------------------------------------------------
    |
    | Credenciales del comercio para la pasarela de pago Bancard. Si no están
    | configuradas, el BancardClient opera en MODO STUB (sin llamadas de red)
    | y el flujo de suscripción se puede probar end-to-end sin el gateway real.
    |
    */
    'bancard' => [
        'public_key' => env('BANCARD_PUBLIC_KEY'),
        'private_key' => env('BANCARD_PRIVATE_KEY'),
        'environment' => env('BANCARD_ENV', 'staging'),
    ],

    // Monto y vigencia del plan Premium (configurable sin tocar código).
    'premium' => [
        'amount' => (int) env('PREMIUM_AMOUNT', 50000),     // guaraníes
        'currency' => env('PREMIUM_CURRENCY', 'PYG'),
        'period_days' => (int) env('PREMIUM_PERIOD_DAYS', 30),
    ],
];
