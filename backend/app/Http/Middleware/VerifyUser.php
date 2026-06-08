<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->attributes->get('jwt_role') !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}
