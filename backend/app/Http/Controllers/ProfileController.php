<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function __construct(private ActivityLogger $activity) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');
        $data = $request->validated();

        $phoneChanged   = isset($data['phone'])   && $data['phone']   !== $user->phone;
        $countryChanged = isset($data['country']) && $data['country'] !== $user->country;

        $user->fill([
            'first_name'    => $data['first_name'],
            'last_name'     => $data['last_name'],
            'phone'         => $data['phone'],
            'country'       => $data['country'],
            'gender'        => $data['gender'] ?? $user->gender,
            'date_of_birth' => $data['date_of_birth'] ?? $user->date_of_birth,
        ]);
        $user->name = trim($data['first_name'] . ' ' . $data['last_name']);
        if (array_key_exists('profile_picture', $data)) {
            $user->profile_picture = $data['profile_picture'];
        }
        $user->save();

        $this->activity->log($user->id, ActivityLogger::PROFILE_UPDATED, 'Profile updated',
            ['description' => 'Personal information was updated.'], $request);
        if ($phoneChanged) {
            $this->activity->log($user->id, ActivityLogger::PHONE_UPDATED, 'Phone number updated', [], $request);
        }
        if ($countryChanged) {
            $this->activity->log($user->id, ActivityLogger::COUNTRY_UPDATED, 'Country updated', [], $request);
        }

        return response()->json(['message' => 'Profile updated.', 'user' => $this->payload($user)]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->password = $request->input('password'); // hashed cast
        $user->save();

        $this->activity->log($user->id, ActivityLogger::PASSWORD_CHANGED, 'Password changed',
            ['description' => 'Account password was changed.'], $request);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function setAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $validated = $request->validate([
            'profile_picture' => ['required', 'url', 'max:2048'],
        ]);

        $user->profile_picture = $validated['profile_picture'];
        $user->save();

        $this->activity->log($user->id, ActivityLogger::PROFILE_IMAGE_UPLOADED, 'Profile photo updated',
            ['description' => 'A new profile photo was uploaded.'], $request);

        return response()->json(['message' => 'Profile photo updated.', 'user' => $this->payload($user)]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        $user->profile_picture = null;
        $user->save();

        $this->activity->log($user->id, ActivityLogger::PROFILE_IMAGE_DELETED, 'Profile photo removed', [], $request);

        return response()->json(['message' => 'Profile photo removed.', 'user' => $this->payload($user)]);
    }

    private function payload(User $user): array
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
