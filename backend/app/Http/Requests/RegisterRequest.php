<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'first_name'      => ['required', 'string', 'min:2', 'max:50'],
            'last_name'       => ['required', 'string', 'min:2', 'max:50'],
            'username'        => ['required', 'string', 'min:4', 'max:30', 'regex:/^[A-Za-z0-9_]+$/', 'unique:users,username'],
            'email'           => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone'           => ['required', 'string', 'regex:/^\+[1-9]\d{6,14}$/'],
            'country'         => ['required', 'string', 'max:100'],
            'password'        => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
                'confirmed',
            ],
            'profile_picture' => ['nullable', 'url', 'max:2048'],
            'gender'          => ['nullable', 'string', 'in:male,female,other,prefer_not_to_say'],
            'date_of_birth'   => ['nullable', 'date', 'before:today'],
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex'   => 'Username may only contain letters, numbers, and underscores.',
            'phone.regex'      => 'Phone must be in international format, e.g. +8801711234567.',
            'password.regex'   => 'Password must contain uppercase, lowercase, number, and special character.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}
