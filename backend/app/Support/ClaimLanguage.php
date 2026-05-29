<?php

namespace App\Support;

class ClaimLanguage
{
    public static function profile(string $text, ?string $requestedLanguage = null): array
    {
        $requested = self::normalizeLanguage($requestedLanguage);
        $detected = self::detectLanguage($text);
        $language = $requested === 'auto' ? $detected : $requested;

        $normalizedText = $text;
        if ($language === 'banglish' || ($language === 'mixed' && $detected === 'banglish')) {
            $normalizedText = self::transliterateBanglishToBangla($text);
        }

        $variants = array_values(array_unique(array_filter([
            trim($text),
            trim($normalizedText),
            $detected === 'banglish' ? trim(self::transliterateBanglishToBangla($text)) : null,
        ])));

        return [
            'language' => $language,
            'detected_language' => $detected,
            'normalized_text' => $normalizedText,
            'query_variants' => $variants,
        ];
    }

    public static function normalizeLanguage(?string $language): string
    {
        $value = strtolower(trim((string) $language));

        return match ($value) {
            '', 'auto' => 'auto',
            'bn', 'bangla', 'bengali' => 'bn',
            'en', 'english' => 'en',
            'banglish', 'romanized-bn', 'romanized_bn', 'roman-bangla' => 'banglish',
            'mixed', 'bn-en', 'bilingual' => 'mixed',
            'international', 'global' => 'international',
            default => 'auto',
        };
    }

    private static function detectLanguage(string $text): string
    {
        $banglaCount = preg_match_all('/\p{Bengali}/u', $text) ?: 0;
        $latinCount = preg_match_all('/[A-Za-z]/', $text) ?: 0;

        if ($banglaCount > 0 && $latinCount > 0) {
            return self::looksBanglish($text) ? 'banglish' : 'mixed';
        }

        if ($banglaCount > 0) {
            return 'bn';
        }

        if ($latinCount > 0) {
            return self::looksBanglish($text) ? 'banglish' : 'en';
        }

        return 'international';
    }

    private static function looksBanglish(string $text): bool
    {
        $sample = strtolower($text);

        preg_match_all('/[a-z]+/i', $sample, $matches);
        $tokens = $matches[0] ?? [];

        if ($tokens === []) {
            return false;
        }

        $keywordSignals = [
            'ami', 'apni', 'tumi', 'tomar', 'amar', 'amader', 'apnader',
            'bangla', 'banglish', 'kotha', 'kemon', 'hobe', 'hoy', 'kore', 'ki', 'na',
            'ashole', 'ashamir', 'shami', 'jorito', 'chilo', 'hottakande', 'hottakando',
            'mithya', 'vuya', 'khobor', 'dabi', 'ghotona', 'ramisa', 'ramisha', 'ramishar',
            'haam', 'ham', 'measles', 'shishu', 'nihoto', 'mara', 'mrityu', 'hoise', 'hoyese',
        ];
        $transliterationPatterns = ['kh', 'gh', 'jh', 'dh', 'bh', 'sh', 'tt'];

        $keywordHits = 0;
        $patternHits = 0;

        foreach ($tokens as $token) {
            if (in_array($token, $keywordSignals, true)) {
                $keywordHits++;
            }

            if (strlen($token) < 4) {
                continue;
            }

            foreach ($transliterationPatterns as $pattern) {
                if (str_contains($token, $pattern)) {
                    $patternHits++;
                    break;
                }
            }
        }

        return $keywordHits >= 2 || ($keywordHits >= 1 && $patternHits >= 1);
    }

    private static function transliterateBanglishToBangla(string $text): string
    {
        $normalized = strtolower($text);
        $replacements = [
            'hottakande' => 'হত্যাকাণ্ডে',
            'hottakando' => 'হত্যাকাণ্ড',
            'hottakand' => 'হত্যাকাণ্ড',
            'haam' => 'হাম',
            'ham' => 'হাম',
            'measles' => 'হাম',
            'shishu' => 'শিশু',
            'nihoto' => 'নিহত',
            'mara' => 'মারা',
            'mrityu' => 'মৃত্যু',
            'hoise' => 'হয়েছে',
            'hoyese' => 'হয়েছে',
            'hoiche' => 'হয়েছে',
            'akkranto' => 'আক্রান্ত',
            'akranto' => 'আক্রান্ত',
            'ramisa' => 'রামিসা',
            'ramisha' => 'রামিশা',
            'ramishar' => 'রামিশার',
            'ashamir' => 'আসামির',
            'shami' => 'স্বামী',
            'jorito' => 'জড়িত',
            'jorita' => 'জড়িত',
            'chilo' => 'ছিল',
            'kono' => 'কোনো',
            'ashole' => 'আসলে',
            'kotha' => 'কথা',
            'kemon' => 'কেমন',
            'hobe' => 'হবে',
            'hoy' => 'হয়',
            'kore' => 'করে',
            'ki' => 'কি',
            'murder' => 'হত্যাকাণ্ড',
            'fake' => 'ভুয়া',
            'false' => 'মিথ্যা',
            'claim' => 'দাবি',
        ];

        foreach ($replacements as $from => $to) {
            $normalized = preg_replace('/\b' . preg_quote($from, '/') . '\b/i', $to, $normalized) ?? $normalized;
        }

        return $normalized;
    }
}