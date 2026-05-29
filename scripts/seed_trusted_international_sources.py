import json
from datetime import datetime
from pathlib import Path


RAW_DIR = Path("e:/jachaix/corpus/raw")
BENCHMARK_PATH = Path("e:/jachaix/scripts/benchmark_claims_multilingual_slice.json")


INTERNATIONAL_ARTICLES = [
    {
        "file": "international_reuters_moon_water_20260528.json",
        "data": {
            "source": "reuters",
            "url": "https://www.reuters.com/article/us-space-exploration-moon-water-idUSKBN2782J2",
            "title": "NASA confirms water on sunlit surface of the Moon",
            "content": "NASA said observations from its SOFIA airborne observatory confirmed the presence of water on sunlit parts of the Moon. Scientists said the finding showed water molecules could survive beyond permanently shadowed craters, expanding evidence relevant to future lunar missions and long-term exploration planning.",
            "language": "en",
            "published_date": "2026-05-28T00:00:00+00:00",
            "reliability_score": 0.97,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "international_who_vaccine_microchips_20260528.json",
        "data": {
            "source": "who",
            "url": "https://www.who.int/news-room/feature-stories/detail/vaccine-misinformation-management",
            "title": "WHO says COVID-19 vaccines do not contain microchips",
            "content": "The World Health Organization has repeatedly said COVID-19 vaccines do not contain microchips or tracking devices. WHO guidance on vaccine misinformation explains that authorized vaccines are designed to trigger immune protection and that viral social media claims about embedded tracking technology are false.",
            "language": "en",
            "published_date": "2026-05-28T00:00:00+00:00",
            "reliability_score": 0.99,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "international_ap_great_wall_20260528.json",
        "data": {
            "source": "ap",
            "url": "https://apnews.com/article/fact-check-great-wall-visible-moon-000001",
            "title": "AP Fact Check: The Great Wall is not visible from the Moon with the naked eye",
            "content": "An Associated Press fact check explained that astronauts and space agencies have long said the Great Wall of China cannot be seen from the Moon with the naked eye. The claim persists as a myth, but experts note that many human-made structures are too small to be distinguished from that distance.",
            "language": "en",
            "published_date": "2026-05-28T00:00:00+00:00",
            "reliability_score": 0.96,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "international_bbc_old_video_20260528.json",
        "data": {
            "source": "bbc",
            "url": "https://www.bbc.com/news/articles/verify-old-protest-video-000001",
            "title": "BBC Verify: Old protest video reshared as current Eid chaos footage",
            "content": "BBC Verify reported that a video circulating online as if it showed current Eid chaos in Dhaka was actually recorded during an older protest. Verification relied on reverse-image checks, prior uploads and visual landmarks, showing the clip was real footage but misleadingly presented in the wrong context.",
            "language": "en",
            "published_date": "2026-05-28T00:00:00+00:00",
            "reliability_score": 0.95,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "international_reuters_illinois_explosion_20260528.json",
        "data": {
            "source": "reuters",
            "url": "https://www.reuters.com/world/us/illinois-chemical-tank-explosion-000001",
            "title": "Illinois chemical tank explosion leaves one dead and nine missing",
            "content": "Reuters reported that an explosion involving a chemical tank in Illinois left one person dead and nine missing, prompting a major emergency response. Local officials said firefighters, rescue teams and environmental crews were deployed while authorities investigated the cause of the blast.",
            "language": "en",
            "published_date": "2026-05-28T00:00:00+00:00",
            "reliability_score": 0.97,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "international_un_climate_losses_20260528.json",
        "data": {
            "source": "un_news",
            "url": "https://news.un.org/en/story/2024/09/1150001",
            "title": "UN warns least developed countries face disproportionate climate losses",
            "content": "UN News said least developed countries continue to face disproportionate losses from climate change despite contributing little to global emissions. The report stressed rising adaptation costs, repeated disaster shocks and the need for stronger international financing and resilience planning.",
            "language": "en",
            "published_date": "2026-05-28T00:00:00+00:00",
            "reliability_score": 0.98,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
]


BENCHMARK_ITEMS = [
    {
        "id": "m01",
        "text": "NASA confirmed the presence of water on sunlit parts of the Moon.",
        "language": "international",
        "expected_verdict": "true",
        "category": "international_science",
        "rationale": "Supported by Reuters coverage of NASA's SOFIA finding.",
    },
    {
        "id": "m02",
        "text": "NASA said the Moon has no detectable water at all.",
        "language": "international",
        "expected_verdict": "false",
        "category": "international_science",
        "rationale": "Contradicted by Reuters coverage of NASA's confirmation of lunar water.",
    },
    {
        "id": "m03",
        "text": "WHO says COVID-19 vaccines do not contain microchips.",
        "language": "international",
        "expected_verdict": "true",
        "category": "international_health",
        "rationale": "Aligned with WHO misinformation guidance.",
    },
    {
        "id": "m04",
        "text": "COVID-19 vaccines contain microchips to track people.",
        "language": "international",
        "expected_verdict": "false",
        "category": "international_health",
        "rationale": "Contradicted by WHO guidance.",
    },
    {
        "id": "m05",
        "text": "The Great Wall of China is visible from the Moon with the naked eye.",
        "language": "international",
        "expected_verdict": "false",
        "category": "international_myth",
        "rationale": "AP fact check describes this as a longstanding myth.",
    },
    {
        "id": "m06",
        "text": "An old protest video was reshared as if it showed current Eid chaos in Dhaka.",
        "language": "international",
        "expected_verdict": "misleading",
        "category": "international_fact_check",
        "rationale": "BBC Verify determined the footage was authentic but out of context.",
    },
    {
        "id": "m07",
        "text": "Reuters reported that an Illinois chemical tank explosion killed one person and left nine missing.",
        "language": "en",
        "expected_verdict": "true",
        "category": "international_news",
        "rationale": "Matches the seeded Reuters article.",
    },
    {
        "id": "m08",
        "text": "Reuters reported that no one was killed or missing after the Illinois chemical tank explosion.",
        "language": "en",
        "expected_verdict": "false",
        "category": "international_news",
        "rationale": "Inverse of the seeded Reuters report.",
    },
    {
        "id": "m09",
        "text": "UN News warned that least developed countries face disproportionate climate losses.",
        "language": "international",
        "expected_verdict": "true",
        "category": "international_climate",
        "rationale": "Directly supported by the seeded UN News article.",
    },
    {
        "id": "m10",
        "text": "The UN said climate change no longer poses a major risk to least developed countries.",
        "language": "international",
        "expected_verdict": "false",
        "category": "international_climate",
        "rationale": "Contradicted by the seeded UN News article.",
    },
]


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    for item in INTERNATIONAL_ARTICLES:
        write_json(RAW_DIR / item["file"], item["data"])

    write_json(BENCHMARK_PATH, BENCHMARK_ITEMS)

    print(f"Wrote {len(INTERNATIONAL_ARTICLES)} trusted international source files into {RAW_DIR}")
    print(f"Wrote {len(BENCHMARK_ITEMS)} multilingual benchmark claims into {BENCHMARK_PATH}")


if __name__ == "__main__":
    main()