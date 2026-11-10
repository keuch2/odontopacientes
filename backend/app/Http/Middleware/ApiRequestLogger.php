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

        // Solo los nombres de los campos: los valores incluyen datos clínicos y fotos.
        if ($request->isMethod('post') || $request->isMethod('put') || $request->isMethod('patch')) {
            $context['payload_fields'] = array_keys($request->all());
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
}
