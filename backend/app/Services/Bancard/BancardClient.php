<?php

namespace App\Services\Bancard;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Cliente AISLADO de Bancard vPOS.
 *
 * Mientras no haya credenciales (BANCARD_PUBLIC_KEY / BANCARD_PRIVATE_KEY) el
 * cliente opera en MODO STUB: no hace ninguna llamada de red y devuelve
 * respuestas simuladas, de modo que el flujo web (checkout → confirmación →
 * activación de Premium) se puede probar end-to-end sin el gateway real.
 *
 * Para conectar el gateway real solo hay que cargar las credenciales en .env;
 * `isStub()` pasará a false y se usarán las llamadas HTTP reales.
 *
 * Docs Bancard vPOS "single buy":
 *   - Crear operación:  POST {base}/vpos/api/0.3/single_buy
 *   - token = md5(private_key + shop_process_id + amount + currency)
 *   - El usuario completa el pago en el iframe de Bancard con el process_id.
 *   - Bancard confirma vía callback a una URL pública (webhook).
 */
class BancardClient
{
    private ?string $publicKey;
    private ?string $privateKey;
    private string $environment; // 'staging' | 'production'

    public function __construct()
    {
        $this->publicKey = config('services.bancard.public_key');
        $this->privateKey = config('services.bancard.private_key');
        $this->environment = config('services.bancard.environment', 'staging');
    }

    /**
     * Sin credenciales => modo simulado.
     */
    public function isStub(): bool
    {
        return empty($this->publicKey) || empty($this->privateKey);
    }

    private function baseUrl(): string
    {
        return $this->environment === 'production'
            ? 'https://vpos.infonet.com.py'
            : 'https://vpos.infonet.com.py:8888';
    }

    /**
     * Crea una operación de pago. Devuelve un array con al menos:
     *   ['process_id' => string, 'is_stub' => bool, 'iframe_url' => string|null, 'raw' => array]
     *
     * @param int    $amount   monto en guaraníes
     * @param string $currency 'PYG'
     */
    public function createCharge(int $amount, string $currency, string $returnUrl): array
    {
        $shopProcessId = (string) random_int(100000000, 999999999);

        if ($this->isStub()) {
            // Operación simulada: no se llama a Bancard. El "process_id" sirve
            // para que el frontend simule el iframe y confirme la operación.
            return [
                'process_id' => 'STUB-' . $shopProcessId . '-' . Str::random(6),
                'is_stub' => true,
                'iframe_url' => null,
                'raw' => ['stub' => true, 'shop_process_id' => $shopProcessId],
            ];
        }

        $amountStr = number_format($amount, 2, '.', '');
        $token = md5($this->privateKey . $shopProcessId . $amountStr . $currency);

        $response = Http::acceptJson()->post($this->baseUrl() . '/vpos/api/0.3/single_buy', [
            'public_key' => $this->publicKey,
            'operation' => [
                'token' => $token,
                'shop_process_id' => $shopProcessId,
                'amount' => $amountStr,
                'currency' => $currency,
                'additional_data' => '',
                'description' => 'OdontoPacientes Premium',
                'return_url' => $returnUrl,
                'cancel_url' => $returnUrl,
            ],
        ]);

        $raw = $response->json() ?? [];

        return [
            'process_id' => $raw['process_id'] ?? $shopProcessId,
            'is_stub' => false,
            'iframe_url' => $this->baseUrl() . '/checkout/new?process_id=' . ($raw['process_id'] ?? $shopProcessId),
            'raw' => $raw,
        ];
    }

    /**
     * Verifica el resultado de una operación contra Bancard.
     * En modo stub asume éxito (para poder cerrar el flujo en pruebas).
     *
     * @return bool true si el pago está aprobado
     */
    public function isChargeApproved(string $processId): bool
    {
        if ($this->isStub()) {
            return true;
        }

        $token = md5($this->privateKey . $processId . 'get_confirmation');
        $response = Http::acceptJson()->post($this->baseUrl() . '/vpos/api/0.3/single_buy/confirmations', [
            'public_key' => $this->publicKey,
            'operation' => ['token' => $token, 'shop_process_id' => $processId],
        ]);

        $status = data_get($response->json(), 'confirmation.status');
        return $status === 'success';
    }
}
