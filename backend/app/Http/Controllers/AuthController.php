<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function __construct(
        private JwtService $jwt,
        private ActivityLogger $activity,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name'            => trim($data['first_name'] . ' ' . $data['last_name']),
            'first_name'      => $data['first_name'],
            'last_name'       => $data['last_name'],
            'username'        => $data['username'],
            'email'           => strtolower($data['email']),
            'phone'           => $data['phone'],
            'country'         => $data['country'],
            'password'        => $data['password'], // casts: hashed
            'profile_picture' => $data['profile_picture'] ?? null,
            'gender'          => $data['gender'] ?? null,
            'date_of_birth'   => $data['date_of_birth'] ?? null,
            'role'            => 'user',
            'is_active'       => true,
            'email_verified'  => false,
        ]);

        $token = $this->jwt->issueForUser($user, false);

        $this->activity->log(
            $user->id,
            ActivityLogger::USER_REGISTERED,
            'Account created',
            ['description' => "Welcome to JachaiX, {$user->first_name}.", 'entity_type' => 'user', 'entity_id' => $user->id]
        );

        return response()->json([
            'message'  => 'Account created successfully.',
            'user'     => $this->userPayload($user),
            'token'    => $token,
            'redirect' => '/user/dashboard',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $email    = strtolower($request->input('email'));
        $password = $request->input('password');
        $remember = (bool) $request->input('remember', false);

        // ── Admin check (env only, never in MySQL) ───────────────────────────
        for ($i = 1; $i <= 4; $i++) {
            $adminEmail    = env("ADMIN_{$i}_EMAIL");
            $adminPassword = env("ADMIN_{$i}_PASSWORD");

            if ($adminEmail && strtolower($adminEmail) === $email) {
                if ($password !== $adminPassword) {
                    return response()->json(['message' => 'Invalid credentials.'], 401);
                }
                // Admins live in env, not the users table — no activity row (FK to users).
                $token = $this->jwt->issueForAdmin($email, $remember);
                return response()->json([
                    'role'     => 'admin',
                    'email'    => $email,
                    'token'    => $token,
                    'redirect' => '/admin/dashboard',
                ]);
            }
        }

        // ── Regular user ─────────────────────────────────────────────────────
        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            if ($user) {
                $this->activity->log(
                    $user->id,
                    ActivityLogger::FAILED_LOGIN,
                    'Failed login attempt',
                    ['description' => 'A sign-in attempt used an incorrect password.']
                );
            }
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is disabled.'], 403);
        }

        $token = $this->jwt->issueForUser($user, $remember);

        $this->activity->log(
            $user->id,
            ActivityLogger::USER_LOGGED_IN,
            'Signed in',
            ['description' => $remember ? 'Signed in with Remember Me (60 days).' : 'Signed in.']
        );

        return response()->json([
            'user'     => $this->userPayload($user),
            'token'    => $token,
            'redirect' => '/user/dashboard',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $role = $request->attributes->get('jwt_role');
        $user = $request->attributes->get('auth_user');

        if ($role === 'user' && $user) {
            $this->activity->log($user->id, ActivityLogger::USER_LOGGED_OUT, 'Signed out');
        }

        // Stateless JWT: client drops the token. No server-side denylist.
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        $role = $request->attributes->get('jwt_role');

        if ($role === 'admin') {
            return response()->json([
                'role'  => 'admin',
                'email' => $request->attributes->get('jwt_email'),
            ]);
        }

        $user = $request->attributes->get('auth_user');
        return response()->json(['user' => $this->userPayload($user)]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id'              => $user->id,
            'first_name'      => $user->first_name,
            'last_name'       => $user->last_name,
            'username'        => $user->username,
            'email'           => $user->email,
            'phone'           => $user->phone,
            'country'         => $user->country,
            'profile_picture' => $user->profile_picture,
            'gender'          => $user->gender,
            'date_of_birth'   => $user->date_of_birth?->toDateString(),
            'role'            => $user->role,
            'email_verified'  => $user->email_verified,
            'created_at'      => $user->created_at?->toIso8601String(),
        ];
    }
}
