<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use Symfony\Component\HttpFoundation\Response;

class VerifyToken
{
    public function __construct(private JwtService $jwt) {}

    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();
        if (!$bearer) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $payload = $this->jwt->decode($bearer);
        } catch (TokenExpiredException) {
            return response()->json(['message' => 'Token expired'], 401);
        } catch (TokenInvalidException|\Throwable) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $role  = $payload->get('role') ?? 'user';
        $email = $payload->get('email');
        $id    = $payload->get('sub');

        $request->attributes->set('jwt_role', $role);
        $request->attributes->set('jwt_email', $email);
        $request->attributes->set('jwt_sub', $id);

        if ($role === 'user') {
            $user = User::find((int) $id);
            if (!$user || !$user->is_active) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            $request->attributes->set('auth_user', $user);
        }

        return $next($request);
    }
}
