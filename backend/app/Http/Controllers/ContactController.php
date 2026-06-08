<?php

namespace App\Http\Controllers;

use App\Mail\ContactFormMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

class ContactController extends Controller
{
    public function send(Request $request): JsonResponse
    {
        // Rate-limit: 3 submissions per IP per 10 minutes
        $key = 'contact:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 10)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many requests. Please try again in {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($key, 600);

        $validated = $request->validate([
            'name'     => ['required', 'string', 'min:2', 'max:100'],
            'email'    => ['required', 'email:rfc', 'max:200'],
            'category' => ['required', 'string', 'in:general,support,partnership,feedback,bug,other,General Inquiry,Report Misinformation,Partnership,Technical Support,Media,Other'],
            'subject'  => ['required', 'string', 'min:5', 'max:200'],
            'message'  => ['required', 'string', 'min:20', 'max:5000'],
        ]);

        $recipient = config('mail.contact_recipient', env('CONTACT_MAIL_TO', $validated['email']));

        Mail::to($recipient)->send(new ContactFormMail(
            senderName:  $validated['name'],
            senderEmail: $validated['email'],
            mailSubject: $validated['subject'],
            category:    $validated['category'],
            messageBody: $validated['message'],
        ));

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent. We will get back to you soon.',
        ]);
    }
}
