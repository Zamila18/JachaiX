<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'first_name'      => ['required', 'string', 'min:2', 'max:50'],
            'last_name'       => ['required', 'string', 'min:2', 'max:50'],
            'phone'           => ['required', 'string', 'regex:/^\+[1-9]\d{6,14}$/'],
            'country'         => ['required', 'string', 'max:100'],
            'gender'          => ['nullable', 'string', 'in:male,female,other,prefer_not_to_say'],
            'date_of_birth'   => ['nullable', 'date', 'before:today'],
            'profile_picture' => ['nullable', 'url', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex' => 'Phone must be in international format, e.g. +8801711234567.',
        ];
    }
}
