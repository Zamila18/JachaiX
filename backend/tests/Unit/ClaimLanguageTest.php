<?php

namespace Tests\Unit;

use App\Support\ClaimLanguage;
use PHPUnit\Framework\TestCase;

class ClaimLanguageTest extends TestCase
{
    public function test_profile_detects_bangla_text(): void
    {
        $profile = ClaimLanguage::profile('বাংলাদেশের রাজধানী ঢাকা।');

        $this->assertSame('bn', $profile['language']);
        $this->assertSame('bn', $profile['detected_language']);
        $this->assertSame('বাংলাদেশের রাজধানী ঢাকা।', $profile['normalized_text']);
    }

    public function test_profile_detects_and_normalizes_banglish_text(): void
    {
        $profile = ClaimLanguage::profile('ramishar hottakande ki ashamir shami jorito chilo?');

        $this->assertSame('banglish', $profile['language']);
        $this->assertSame('banglish', $profile['detected_language']);
        $this->assertStringContainsString('রামিশার', $profile['normalized_text']);
        $this->assertStringContainsString('হত্যাকাণ্ডে', $profile['normalized_text']);
        $this->assertGreaterThan(1, count($profile['query_variants']));
    }

    public function test_profile_keeps_english_as_english(): void
    {
        $profile = ClaimLanguage::profile('NASA confirmed the presence of water on the Moon.');

        $this->assertSame('en', $profile['language']);
        $this->assertSame('en', $profile['detected_language']);
        $this->assertSame('NASA confirmed the presence of water on the Moon.', $profile['normalized_text']);
    }

    public function test_profile_detects_mixed_bangla_and_english_text(): void
    {
        $profile = ClaimLanguage::profile('বাংলাদেশ is in South Asia.');

        $this->assertSame('mixed', $profile['language']);
        $this->assertSame('mixed', $profile['detected_language']);
    }

    public function test_profile_preserves_explicit_international_routing(): void
    {
        $profile = ClaimLanguage::profile('WHO says COVID-19 vaccines do not contain microchips.', 'international');

        $this->assertSame('international', $profile['language']);
        $this->assertSame('en', $profile['detected_language']);
        $this->assertSame('WHO says COVID-19 vaccines do not contain microchips.', $profile['normalized_text']);
    }
}