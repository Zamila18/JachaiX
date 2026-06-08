<?php

namespace App\Services;

use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTFactory;
use PHPOpenSourceSaver\JWTAuth\Payload;

class JwtService
{
    public function issueForUser(User $user, bool $remember): string
    {
        JWTAuth::factory()->setTTL($this->ttlMinutes($remember));
        return JWTAuth::fromUser($user);
    }

    public function issueForAdmin(string $email, bool $remember): string
    {
        $payload = JWTFactory::customClaims([
            'sub'   => $email,
            'email' => $email,
            'role'  => 'admin',
        ])->setTTL($this->ttlMinutes($remember))->make();

        return JWTAuth::encode($payload)->get();
    }

    public function decode(string $token): Payload
    {
        return JWTAuth::setToken($token)->getPayload();
    }

    private function ttlMinutes(bool $remember): int
    {
        $raw = $remember
            ? env('JWT_EXPIRES_IN', '60d')
            : env('JWT_EXPIRES_IN_SHORT', '7d');

        if (preg_match('/^(\d+)d$/i', $raw, $m)) {
            return (int) $m[1] * 1440;
        }
        if (preg_match('/^(\d+)h$/i', $raw, $m)) {
            return (int) $m[1] * 60;
        }
        return (int) $raw ?: 10080; // fallback 7d
    }
}
