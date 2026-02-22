<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ApiRequestLogger
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = (string) Str::uuid();
        $startTime = microtime(true);

        $context = [
            'request_id' => $requestId,
            'method' => $request->getMethod(),
            'uri' => $request->getPathInfo(),
            'query' => $request->query(),
            'ip' => $request->ip(),
            'user_id' => optional($request->user())->id,
        ];

        $payload = [];
        if ($request->isMethod('post') || $request->isMethod('put') || $request->isMethod('patch')) {
            $payload = $this->sanitizePayload($request->all());
        }

        if (!empty($payload)) {
            $context['payload'] = $payload;
        }

        Log::info('API request received', $context);

        try {
            $response = $next($request);
        } catch (\Throwable $exception) {
            Log::error('API request failed', $context + [
                'exception' => $exception->getMessage(),
                'trace' => config('app.debug') ? $exception->getTraceAsString() : null,
            ]);

            throw $exception;
        }

        $duration = round((microtime(true) - $startTime) * 1000, 2);
        $status = $response->getStatusCode();

        $responseContext = $context + [
            'status' => $status,
            'duration_ms' => $duration,
        ];

        if ($response instanceof JsonResponse) {
            $responseContext['response_size'] = strlen($response->getContent());
        }

        if ($status >= 500) {
            Log::error('API request completed with server error', $responseContext);
        } elseif ($status >= 400) {
            Log::warning('API request completed with client error', $responseContext);
        } else {
            Log::info('API request completed successfully', $responseContext);
        }

        return $response;
    }

    /**
     * Remove sensitive fields from the request payload before logging.
     */
    private function sanitizePayload(array $payload): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
        ];

        return collect($payload)
            ->map(function ($value, $key) use ($sensitiveKeys) {
                if (in_array($key, $sensitiveKeys, true)) {
                    return '*** redacted ***';
                }

                if (is_array($value)) {
                    return $this->sanitizePayload($value);
                }

                return $value;
            })
            ->toArray();
    }
}
