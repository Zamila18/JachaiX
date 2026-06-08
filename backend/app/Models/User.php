<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable([
    'name', 'first_name', 'last_name', 'username', 'email', 'phone', 'country',
    'profile_picture', 'gender', 'date_of_birth', 'role', 'is_active',
    'email_verified', 'password',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_of_birth'     => 'date',
            'is_active'         => 'boolean',
            'email_verified'    => 'boolean',
            'password'          => 'hashed',
        ];
    }

    // ── JWTSubject ───────────────────────────────────────────────────────────

    /** The identifier stored in the JWT `sub` claim. */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /** Custom claims embedded in every user token. */
    public function getJWTCustomClaims(): array
    {
        return [
            'role'  => $this->role ?? 'user',
            'email' => $this->email,
        ];
    }

    // ── Relations ────────────────────────────────────────────────────────────

    public function claims(): HasMany
    {
        return $this->hasMany(Claim::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function statistic(): HasOne
    {
        return $this->hasOne(UserStatistic::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function savedSearches(): HasMany
    {
        return $this->hasMany(SavedSearch::class);
    }
}
