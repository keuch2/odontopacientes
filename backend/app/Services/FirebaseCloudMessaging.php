<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseCloudMessaging
{
    private string $serverKey;
    private string $fcmUrl = 'https://fcm.googleapis.com/fcm/send';

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key');
    }

    /**
     * Enviar notificación push a un dispositivo específico
     */
    public function sendToDevice(string $deviceToken, array $notification, array $data = []): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, [
                'to' => $deviceToken,
                'notification' => $notification,
                'data' => $data,
                'priority' => 'high',
                'content_available' => true,
            ]);

            if ($response->successful()) {
                Log::info('FCM notification sent successfully', [
                    'device_token' => substr($deviceToken, 0, 20) . '...',
                    'notification' => $notification,
                ]);
                return true;
            }

            Log::error('FCM notification failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('FCM exception', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Enviar notificación a múltiples dispositivos
     */
    public function sendToMultipleDevices(array $deviceTokens, array $notification, array $data = []): array
    {
        $results = [];
        
        foreach ($deviceTokens as $token) {
            $results[$token] = $this->sendToDevice($token, $notification, $data);
        }

        return $results;
    }

    /**
     * Enviar notificación a un tópico
     */
    public function sendToTopic(string $topic, array $notification, array $data = []): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, [
                'to' => '/topics/' . $topic,
                'notification' => $notification,
                'data' => $data,
                'priority' => 'high',
            ]);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('FCM topic notification failed', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Suscribir dispositivo a un tópico
     */
    public function subscribeToTopic(string $deviceToken, string $topic): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://iid.googleapis.com/iid/v1/' . $deviceToken . '/rel/topics/' . $topic);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('FCM topic subscription failed', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}
