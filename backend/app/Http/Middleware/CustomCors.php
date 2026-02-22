<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware CORS Profesional para OdontoPacientes
 * 
 * Maneja Cross-Origin Resource Sharing de forma robusta y segura.
 * Soporta múltiples orígenes, preflight requests y credenciales.
 * 
 * @package App\Http\Middleware
 * @author OdontoPacientes Team
 * @version 1.0.0
 */
class CustomCors
{
    /**
     * Orígenes permitidos para CORS
     * 
     * @var array<string>
     */
    private array $allowedOrigins = [
        'https://codexpy.com',
        'https://codexpy.com/odontopacientes/web-admin',
        'http://codexpy.com',
        'http://localhost/odontopacientes/web-admin',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5175',
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:8081',
        'http://localhost',
    ];

    /**
     * Métodos HTTP permitidos
     * 
     * @var array<string>
     */
    private array $allowedMethods = [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
    ];

    /**
     * Headers permitidos en las peticiones
     * 
     * @var array<string>
     */
    private array $allowedHeaders = [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-CSRF-Token',
        'X-Socket-Id',
    ];

    /**
     * Headers expuestos al cliente
     * 
     * @var array<string>
     */
    private array $exposedHeaders = [
        'Content-Length',
        'X-JSON',
    ];

    /**
     * Tiempo de caché para preflight requests (24 horas)
     * 
     * @var int
     */
    private int $maxAge = 86400;

    /**
     * Permitir credenciales (cookies, authorization headers)
     * 
     * @var bool
     */
    private bool $supportsCredentials = true;

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Obtener el origen de la petición
        $origin = $request->header('Origin', '');

        // Verificar si el origen está permitido
        $isAllowedOrigin = $this->isOriginAllowed($origin);

        // Manejar preflight requests (OPTIONS)
        if ($request->isMethod('OPTIONS')) {
            return $this->handlePreflightRequest($origin, $isAllowedOrigin);
        }

        // Procesar la petición normal
        $response = $next($request);

        // Agregar headers CORS a la respuesta
        return $this->addCorsHeaders($response, $origin, $isAllowedOrigin);
    }

    /**
     * Verifica si un origen está permitido
     *
     * @param  string  $origin
     * @return bool
     */
    private function isOriginAllowed(string $origin): bool
    {
        if (empty($origin)) {
            return false;
        }

        return in_array($origin, $this->allowedOrigins, true);
    }

    /**
     * Maneja las peticiones preflight (OPTIONS)
     *
     * @param  string  $origin
     * @param  bool  $isAllowedOrigin
     * @return \Symfony\Component\HttpFoundation\Response
     */
    private function handlePreflightRequest(string $origin, bool $isAllowedOrigin): Response
    {
        $response = response('', 204);

        if ($isAllowedOrigin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin, true);
        }

        $response->headers->set('Access-Control-Allow-Methods', implode(', ', $this->allowedMethods), true);
        $response->headers->set('Access-Control-Allow-Headers', implode(', ', $this->allowedHeaders), true);
        $response->headers->set('Access-Control-Max-Age', (string) $this->maxAge, true);

        if ($this->supportsCredentials) {
            $response->headers->set('Access-Control-Allow-Credentials', 'true', true);
        }

        return $response;
    }

    /**
     * Agrega headers CORS a la respuesta
     *
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     * @param  string  $origin
     * @param  bool  $isAllowedOrigin
     * @return \Symfony\Component\HttpFoundation\Response
     */
    private function addCorsHeaders(Response $response, string $origin, bool $isAllowedOrigin): Response
    {
        // Solo agregar headers CORS si el origen está permitido
        if ($isAllowedOrigin && !empty($origin)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin, true);
            $response->headers->set('Access-Control-Allow-Methods', implode(', ', $this->allowedMethods), true);
            $response->headers->set('Access-Control-Allow-Headers', implode(', ', $this->allowedHeaders), true);
            
            if (!empty($this->exposedHeaders)) {
                $response->headers->set('Access-Control-Expose-Headers', implode(', ', $this->exposedHeaders), true);
            }

            if ($this->supportsCredentials) {
                $response->headers->set('Access-Control-Allow-Credentials', 'true', true);
            }

            // Prevenir caching de respuestas CORS
            $response->headers->set('Vary', 'Origin', true);
        }

        return $response;
    }
}
