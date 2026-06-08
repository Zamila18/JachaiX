<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force every API request to be treated as wanting JSON.
 *
 * Without this, when validation/auth fails and the client did not send
 * `Accept: application/json`, Laravel issues a 302 HTML redirect instead of a
 * 422/401 JSON body — which the frontend cannot parse ("Unexpected token '<'").
 * Setting the Accept header here guarantees JSON error responses for all of
 * /api/*, so the frontend always gets a structured, friendly error.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}
