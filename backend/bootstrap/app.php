<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);
        // Ensure all /api/* routes return JSON (not 302 HTML redirects) on
        // validation/auth failures, regardless of the client's Accept header.
        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);
        $middleware->alias([
            'auth.jwt'  => \App\Http\Middleware\VerifyToken::class,
            'role.user' => \App\Http\Middleware\VerifyUser::class,
            'role.admin'=> \App\Http\Middleware\VerifyAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();