<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPayment;
use App\Models\User;
use App\Services\Bancard\BancardClient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Suscripción al plan Premium vía Bancard vPOS.
 *
 * Módulo AISLADO: funciona en modo stub mientras no haya credenciales. El
 * control de acceso por plan (middleware plan.premium) NO depende de este
 * controlador — esto solo ACTIVA el plan tras un pago confirmado.
 */
class SubscriptionController extends Controller
{
    public function __construct(private BancardClient $bancard)
    {
    }

    /** Catálogo de planes disponibles (público). */
    public function plans()
    {
        return response()->json([
            'data' => [
                [
                    'code' => 'premium',
                    'name' => 'Premium',
                    'amount' => (int) config('services.premium.amount'),
                    'currency' => config('services.premium.currency'),
                    'period_days' => (int) config('services.premium.period_days'),
                ],
            ],
            'is_stub' => $this->bancard->isStub(),
        ]);
    }

    /** Inicia una operación de pago para el usuario autenticado. */
    public function checkout(Request $request)
    {
        $authUser = $request->attributes->get('demo_user');
        if (!$authUser || empty($authUser['id'])) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        $request->validate(['plan_code' => 'required|in:premium']);

        $amount = (int) config('services.premium.amount');
        $currency = config('services.premium.currency');
        $periodDays = (int) config('services.premium.period_days');

        $charge = $this->bancard->createCharge(
            $amount,
            $currency,
            url('/odontopacientes/app/plan')
        );

        $payment = SubscriptionPayment::create([
            'user_id' => $authUser['id'],
            'plan_code' => 'premium',
            'amount' => $amount,
            'currency' => $currency,
            'period_days' => $periodDays,
            'process_id' => $charge['process_id'],
            'status' => 'pending',
            'is_stub' => $charge['is_stub'],
            'gateway_payload' => $charge['raw'],
        ]);

        return response()->json([
            'message' => 'Operación de pago creada',
            'data' => [
                'process_id' => $payment->process_id,
                'is_stub' => $payment->is_stub,
                'iframe_url' => $charge['iframe_url'],
                'amount' => $amount,
                'currency' => $currency,
            ],
        ]);
    }

    /**
     * Consulta el estado de una operación. Si está aprobada (y aún no se aplicó),
     * activa el plan Premium del usuario. Idempotente por process_id.
     */
    public function status(Request $request, string $processId)
    {
        $payment = SubscriptionPayment::where('process_id', $processId)->first();
        if (!$payment) {
            return response()->json(['message' => 'Operación no encontrada'], 404);
        }

        if ($payment->status !== 'confirmed' && $this->bancard->isChargeApproved($processId)) {
            $this->confirmPayment($payment);
        }

        return response()->json([
            'data' => [
                'process_id' => $payment->process_id,
                'status' => $payment->status,
                'is_stub' => $payment->is_stub,
            ],
        ]);
    }

    /**
     * Webhook público de Bancard (confirmación del pago). En producción Bancard
     * llama a esta URL; validar la firma/token antes de confiar. En modo stub
     * no se usa (la confirmación ocurre en status()).
     */
    public function webhook(Request $request)
    {
        $processId = (string) $request->input('operation.shop_process_id', $request->input('process_id', ''));
        if ($processId === '') {
            return response()->json(['message' => 'process_id requerido'], 422);
        }

        $payment = SubscriptionPayment::where('process_id', $processId)->first();
        if (!$payment) {
            return response()->json(['message' => 'Operación no encontrada'], 404);
        }

        // TODO: validar firma/token de Bancard cuando haya credenciales.
        if ($payment->status !== 'confirmed' && $this->bancard->isChargeApproved($processId)) {
            $this->confirmPayment($payment);
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Marca el pago confirmado y activa Premium en el usuario. Atómico para
     * evitar doble activación si llegan webhook y polling a la vez.
     */
    private function confirmPayment(SubscriptionPayment $payment): void
    {
        DB::transaction(function () use ($payment) {
            $fresh = SubscriptionPayment::whereKey($payment->id)->lockForUpdate()->first();
            if (!$fresh || $fresh->status === 'confirmed') {
                return;
            }

            $user = User::find($fresh->user_id);
            if ($user) {
                $user->plan = 'premium';
                // Extiende desde la fecha de expiración vigente si aún es futura,
                // si no desde ahora. Permite renovaciones acumulativas.
                $base = ($user->plan_expires_at && $user->plan_expires_at->isFuture())
                    ? $user->plan_expires_at
                    : now();
                $user->plan_expires_at = $base->copy()->addDays($fresh->period_days);
                $user->save();
            }

            $fresh->status = 'confirmed';
            $fresh->confirmed_at = now();
            $fresh->save();

            $payment->refresh();
        });
    }
}
