<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'first_name')) {
                $table->string('first_name', 50)->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'last_name')) {
                $table->string('last_name', 50)->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username', 30)->nullable()->unique()->after('last_name');
            }
            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 30)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'country')) {
                $table->string('country', 100)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'profile_picture')) {
                $table->text('profile_picture')->nullable()->after('country');
            }
            if (!Schema::hasColumn('users', 'gender')) {
                $table->string('gender', 20)->nullable()->after('profile_picture');
            }
            if (!Schema::hasColumn('users', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->enum('role', ['user'])->default('user')->after('date_of_birth');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('role');
            }
            if (!Schema::hasColumn('users', 'email_verified')) {
                $table->boolean('email_verified')->default(false)->after('is_active');
            }
        });

        // `name` is NOT NULL in the base table but registration uses first/last —
        // make it nullable so we can set it from "First Last" without constraint issues.
        if (Schema::hasColumn('users', 'name')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('name')->nullable()->change();
                });
            } catch (\Throwable $e) {
                // doctrine/dbal may be unavailable on Laravel 13; safe to skip — controller always sets name.
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ([
                'first_name', 'last_name', 'username', 'phone', 'country',
                'profile_picture', 'gender', 'date_of_birth', 'role',
                'is_active', 'email_verified',
            ] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    if ($col === 'username') {
                        try { $table->dropUnique(['username']); } catch (\Throwable $e) {}
                    }
                    $table->dropColumn($col);
                }
            }
        });
    }
};
