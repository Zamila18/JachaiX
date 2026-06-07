import json
from datetime import datetime
from pathlib import Path


RAW_DIR = Path(__file__).resolve().parent.parent / "corpus" / "raw"
BENCHMARK_PATH = Path(__file__).resolve().parent / "benchmark_claims_human_v1.json"


NEW_ARTICLES = [
    {
        "file": "prothom_alo_seed_20260528.json",
        "data": {
            "source": "prothom_alo",
            "url": "https://www.prothomalo.com/bangladesh/mt9x822e9i",
            "title": "সাম্য, ত্যাগ ও মানবিকতার বার্তা নিয়ে বছর ঘুরে আবার এসেছে পবিত্র ঈদুল আজহা",
            "content": "মুসলমানদের জীবনে বছরে দুটি প্রধান আনন্দ-উৎসবের একটি ঈদুল আজহা। ধর্মীয় ভাবগাম্ভীর্য, আত্মত্যাগ ও মানবিকতার বার্তা নিয়ে এ উৎসব ঘিরে সারা দেশে প্রস্তুতি চলছে। রাজধানীসহ বিভিন্ন এলাকায় পশুর হাট বসেছে, ঈদগাহগুলো প্রস্তুত করা হয়েছে এবং মানুষ পরিবার-পরিজনের সঙ্গে ঈদের দিন উদযাপনের অপেক্ষায় আছে।",
            "language": "bn",
            "published_date": "2026-05-28T00:00:00+06:00",
            "reliability_score": 0.90,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "prothom_alo_seed_20260528_b.json",
        "data": {
            "source": "prothom_alo",
            "url": "https://www.prothomalo.com/bangladesh/fwwq9o86bf",
            "title": "আলোচিত মহিষ ‘ডোনাল্ড ট্রাম্প’–এর ঠিকানা হচ্ছে চিড়িয়াখানা",
            "content": "স্বরাষ্ট্রমন্ত্রীর হস্তক্ষেপে আলোচিত অ্যালবিনো জাতের মহিষ ‘ডোনাল্ড ট্রাম্প’কে কোরবানি না দিয়ে চিড়িয়াখানায় নেওয়ার সিদ্ধান্ত হয়েছে। স্থানীয়ভাবে আলোচিত এই পশুকে ঘিরে ব্যাপক কৌতূহল তৈরি হয়েছিল এবং শেষ পর্যন্ত সেটির নতুন ঠিকানা নির্ধারিত হয়।",
            "language": "bn",
            "published_date": "2026-05-28T00:00:00+06:00",
            "reliability_score": 0.90,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "bdnews24_seed_20260528.json",
        "data": {
            "source": "bdnews24",
            "url": "https://bangla.bdnews24.com/bangladesh/ac3232a7e133",
            "title": "আদ-দ্বীন হাসপাতালে একসঙ্গে ৬ শিশুর মৃত্যু, তদন্তে পুলিশ",
            "content": "রাজধানীর মগবাজারের আদ-দ্বীন মেডিকেল কলেজ হাসপাতালের পোস্ট অপারেটিভ ওয়ার্ডে একসঙ্গে ছয় নবজাতকের মৃত্যু হয়েছে। হাসপাতাল কর্তৃপক্ষ ঘটনাটিকে দুর্ঘটনাজনিত বললেও পুলিশ ও স্বাস্থ্য অধিদপ্তর তদন্ত শুরু করেছে এবং ঘটনার কারণ খুঁজে বের করার চেষ্টা চলছে।",
            "language": "bn",
            "published_date": "2026-05-28T00:00:00+06:00",
            "reliability_score": 0.88,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "bdnews24_seed_20260528_b.json",
        "data": {
            "source": "bdnews24",
            "url": "https://bangla.bdnews24.com/politics/ad7ec23a7a7c",
            "title": "ঈদুল আজহায় দেশবাসীকে প্রধানমন্ত্রীর ভিডিওবার্তা",
            "content": "ঈদুল আজহা উপলক্ষে দেশবাসীকে শুভেচ্ছা জানিয়ে প্রধানমন্ত্রীর ভিডিওবার্তা প্রকাশিত হয়েছে। বার্তায় তিনি শান্তি, সম্প্রীতি এবং ত্যাগের আদর্শে অনুপ্রাণিত হয়ে উৎসব উদযাপনের আহ্বান জানান।",
            "language": "bn",
            "published_date": "2026-05-28T00:00:00+06:00",
            "reliability_score": 0.88,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "kalerkantho_seed_20260528.json",
        "data": {
            "source": "kalerkantho",
            "url": "https://www.kalerkantho.com/online/national/2026/05/27/1690520",
            "title": "ঢাকায় ঈদের জামাত কোথায় কখন",
            "content": "রাজধানীর জাতীয় ঈদগাহ, বায়তুল মোকাররমসহ বিভিন্ন স্থানে ঈদের জামাতের সময়সূচি প্রকাশ করা হয়েছে। ঈদের প্রধান জামাত আয়োজনের জন্য জাতীয় ঈদগাহ প্রস্তুত করা হয়েছে এবং রাষ্ট্রপতি ও প্রধানমন্ত্রী সেখানে অংশ নেওয়ার কথা রয়েছে।",
            "language": "bn",
            "published_date": "2026-05-27T00:00:00+06:00",
            "reliability_score": 0.86,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "kalerkantho_seed_20260528_b.json",
        "data": {
            "source": "kalerkantho",
            "url": "https://www.kalerkantho.com/online/dhaka/2026/05/27/1690567",
            "title": "আদ-দ্বীনে শিশু মৃত্যু : অবহেলার অভিযোগ এনে মামলা",
            "content": "রাজধানীর মগবাজারের আদ-দ্বীন মেডিকেল কলেজ হাসপাতালে ছয় নবজাতকের মৃত্যুর ঘটনায় অবহেলার অভিযোগ এনে মামলা করা হয়েছে। পরিবারের সদস্যরা দ্রুত তদন্ত ও দায়ীদের বিরুদ্ধে ব্যবস্থা নেওয়ার দাবি জানিয়েছেন।",
            "language": "bn",
            "published_date": "2026-05-27T00:00:00+06:00",
            "reliability_score": 0.86,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "ittefaq_seed_20260528.json",
        "data": {
            "source": "ittefaq",
            "url": "https://www.ittefaq.com.bd/790972/%E0%A6%86%E0%A6%A6-%E0%A6%A6%E0%A7%8D%E0%A6%AC%E0%A7%80%E0%A6%A8-%E0%A6%B9%E0%A6%BE%E0%A6%B8%E0%A6%AA%E0%A6%BE%E0%A6%A4%E0%A6%BE%E0%A6%B2%E0%A7%87-%E0%A7%AC-%E0%A6%A8%E0%A6%AC%E0%A6%9C%E0%A6%BE%E0%A6%A4%E0%A6%95%E0%A7%87%E0%A6%B0-%E0%A6%AE%E0%A7%83%E0%A6%A4%E0%A7%8D%E0%A6%AF%E0%A7%81%E0%A6%B0-%E0%A6%98%E0%A6%9F%E0%A6%A8%E0%A6%BE%E0%A7%9F-%E0%A6%AE%E0%A6%BE%E0%A6%AE%E0%A6%B2%E0%A6%BE",
            "title": "আদ-দ্বীন হাসপাতালে ৬ নবজাতকের মৃত্যুর ঘটনায় মামলা",
            "content": "রাজধানীর মগবাজারে অবস্থিত আদ-দ্বীন মেডিকেল কলেজ হাসপাতালে একসঙ্গে ছয় নবজাতকের মর্মান্তিক মৃত্যুর ঘটনায় মামলা হয়েছে। নিহত এক শিশুর স্বজন বাদী হয়ে হাসপাতাল কর্তৃপক্ষের বিরুদ্ধে অভিযোগ করেছেন।",
            "language": "bn",
            "published_date": "2026-05-28T00:00:00+06:00",
            "reliability_score": 0.85,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "ittefaq_seed_20260528_b.json",
        "data": {
            "source": "ittefaq",
            "url": "https://www.ittefaq.com.bd/790971/%E0%A6%AA%E0%A6%AC%E0%A6%BF%E0%A6%A4%E0%A7%8D%E0%A6%B0-%E0%A6%88%E0%A6%A6%E0%A7%81%E0%A6%B2-%E0%A6%86%E0%A6%9C%E0%A6%B9%E0%A6%BE-%E0%A6%86%E0%A6%9C",
            "title": "পবিত্র ঈদুল আজহা আজ",
            "content": "আজ পবিত্র ঈদুল আজহা। আত্মত্যাগ ও পরম উৎসর্গের মহান আদর্শে মহিমান্বিত এই ধর্মীয় উৎসব সারা দেশে উদযাপিত হচ্ছে। নগর ও গ্রামে ঈদগাহগুলোতে নামাজ, কোরবানির প্রস্তুতি এবং পারিবারিক উৎসবের আমেজ দেখা যাচ্ছে।",
            "language": "bn",
            "published_date": "2026-05-28T00:00:00+06:00",
            "reliability_score": 0.85,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "jugantor_seed_20260528.json",
        "data": {
            "source": "jugantor",
            "url": "https://www.jugantor.com/national/1107133",
            "title": "আদ-দ্বীন হাসপাতালে ৬ নবজাতকের মৃত্যুর ঘটনায় মামলা",
            "content": "রাজধানীর মগবাজারের আদ-দ্বীন মেডিকেল কলেজ হাসপাতালে একসঙ্গে ৬ নবজাতকের মৃত্যুর ঘটনায় মামলা হয়েছে। নিহত এক শিশুর স্বজন হাবিবুর রহমান বাদি হয়ে হাসপাতাল কর্তৃপক্ষের বিরুদ্ধে অভিযোগ করেছেন।",
            "language": "bn",
            "published_date": "2026-05-27T22:41:00+06:00",
            "reliability_score": 0.82,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
    {
        "file": "jugantor_seed_20260528_b.json",
        "data": {
            "source": "jugantor",
            "url": "https://www.jugantor.com/national/1107126",
            "title": "মেট্রো স্টেশনের নিচে হাট, সিটি করপোরেশনকে দুষলেন মন্ত্রী",
            "content": "রাজধানীর মেট্রো স্টেশনের নিচে পশুর হাট বসায় নাগরিক ভোগান্তির প্রশ্ন উঠেছে। এ বিষয়ে সংশ্লিষ্ট মন্ত্রী সিটি করপোরেশনের ভূমিকা নিয়ে প্রশ্ন তুলেছেন এবং অব্যবস্থাপনার দায় নিয়ে আলোচনা তৈরি হয়েছে।",
            "language": "bn",
            "published_date": "2026-05-27T00:00:00+06:00",
            "reliability_score": 0.82,
            "scraped_at": datetime.utcnow().isoformat(),
        },
    },
]


BENCHMARK_ITEMS = [
    {"id": "h01", "text": "বাংলাদেশের রাজধানী ঢাকা।", "language": "bn", "expected_verdict": "true", "category": "general_fact", "rationale": "ভৌগোলিকভাবে সুপ্রতিষ্ঠিত সত্য"},
    {"id": "h02", "text": "The capital of Bangladesh is Chittagong.", "language": "en", "expected_verdict": "false", "category": "general_fact", "rationale": "ভুল রাজধানী উল্লেখ"},
    {"id": "h03", "text": "সূর্য পশ্চিম দিক থেকে উদয় হয়।", "language": "bn", "expected_verdict": "false", "category": "general_fact", "rationale": "পূর্ব থেকে উদয় হয়"},
    {"id": "h04", "text": "বাংলাদেশ ১৯৭১ সালে স্বাধীনতা লাভ করে।", "language": "bn", "expected_verdict": "true", "category": "history", "rationale": "ঐতিহাসিক সত্য"},
    {"id": "h05", "text": "Water boils at 100 degrees Celsius at sea level.", "language": "en", "expected_verdict": "true", "category": "science", "rationale": "মানক বৈজ্ঞানিক সত্য"},
    {"id": "h06", "text": "The Great Wall of China is visible from the Moon with naked eyes.", "language": "en", "expected_verdict": "false", "category": "myth", "rationale": "জনপ্রিয় মিথ"},
    {"id": "h07", "text": "এই দাবির কোনো নির্ভরযোগ্য উৎস এখনো পাওয়া যায়নি।", "language": "bn", "expected_verdict": "unverified", "category": "uncertain", "rationale": "প্রমাণ অনুপস্থিত"},
    {"id": "h08", "text": "COVID-19 vaccine contains microchips to track people.", "language": "en", "expected_verdict": "false", "category": "health_misinformation", "rationale": "ষড়যন্ত্রমূলক মিথ্যা দাবি"},
    {"id": "h09", "text": "একটি পুরনো ছবিকে নতুন ঘটনার ছবি হিসেবে ছড়ানো হচ্ছে।", "language": "bn", "expected_verdict": "misleading", "category": "misleading_context", "rationale": "প্রসঙ্গ বদলে দেওয়া হয়েছে"},
    {"id": "h10", "text": "Earth is the third planet from the Sun.", "language": "en", "expected_verdict": "true", "category": "science", "rationale": "জ্যোতির্বিদ্যার সত্য"},
    {"id": "h11", "text": "বাংলাদেশের সরকারি মুদ্রার নাম টাকা।", "language": "bn", "expected_verdict": "true", "category": "general_fact", "rationale": "আনুষ্ঠানিক সত্য"},
    {"id": "h12", "text": "2 + 2 equals 5.", "language": "en", "expected_verdict": "false", "category": "general_fact", "rationale": "গাণিতিকভাবে ভুল"},
    {"id": "h13", "text": "রাজধানীর জাতীয় ঈদগাহে রাষ্ট্রপতি ও প্রধানমন্ত্রী ঈদের জামাতে অংশ নেবেন।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "প্রথম আলো/কালের কণ্ঠের প্রতিবেদনের সাথে সামঞ্জস্যপূর্ণ"},
    {"id": "h14", "text": "আদ-দ্বীন হাসপাতালে একসঙ্গে ছয় নবজাতকের মৃত্যু হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "একাধিক প্রতিবেদনে একই তথ্য এসেছে"},
    {"id": "h15", "text": "‘ডোনাল্ড ট্রাম্প’ নামের মহিষটিকে কোরবানি দেওয়া হয়েছে।", "language": "bn", "expected_verdict": "false", "category": "news", "rationale": "প্রতিবেদন অনুযায়ী কোরবানি হয়নি"},
    {"id": "h16", "text": "স্বরাষ্ট্রমন্ত্রীর হস্তক্ষেপে ‘ডোনাল্ড ট্রাম্প’ মহিষটি চিড়িয়াখানায় নেওয়া হচ্ছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "প্রথম আলো ও bdnews24 প্রতিবেদনের সাথে সামঞ্জস্যপূর্ণ"},
    {"id": "h17", "text": "ঢাকায় ঈদের জামাতের সময়সূচি প্রকাশ করা হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "সংবাদে প্রকাশিত তথ্য"},
    {"id": "h18", "text": "রাজধানীতে কোনো পশুর হাট বসেনি।", "language": "bn", "expected_verdict": "false", "category": "news", "rationale": "বাস্তব প্রতিবেদনের বিপরীত"},
    {"id": "h19", "text": "ঈদুল আজহা উপলক্ষে দেশবাসীকে প্রধানমন্ত্রীর ভিডিওবার্তা প্রকাশিত হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "bdnews24 প্রতিবেদনের তথ্য"},
    {"id": "h20", "text": "আদ-দ্বীন হাসপাতালে শিশু মৃত্যুর ঘটনায় কোনো তদন্ত শুরু হয়নি।", "language": "bn", "expected_verdict": "false", "category": "news", "rationale": "তদন্ত শুরু হয়েছে বলে প্রতিবেদনে এসেছে"},
    {"id": "h21", "text": "আদ-দ্বীন হাসপাতালে শিশু মৃত্যু নিয়ে অবহেলার অভিযোগ এনে মামলা হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "ইত্তেফাক/কালের কণ্ঠের প্রতিবেদন"},
    {"id": "h22", "text": "মুসলমানদের জীবনে বছরে দুটি প্রধান আনন্দ-উৎসবের একটি ঈদুল আজহা।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "প্রথম আলোর প্রচলিত ব্যাখ্যা"},
    {"id": "h23", "text": "বাংলাদেশে ঈদের দিন কুরবানি নিষিদ্ধ করা হয়েছে।", "language": "bn", "expected_verdict": "false", "category": "news", "rationale": "সংবাদে এমন কিছু নেই"},
    {"id": "h24", "text": "ঈদের দিন রাজধানীতে ভারী বৃষ্টির পূর্বাভাস দেওয়া হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "ইত্তেফাক প্রতিবেদনের তথ্য"},
    {"id": "h25", "text": "বাংলাদেশি ৪ যুবককে রাশিয়ার সেনাবাহিনীর কাছে বিক্রির অভিযোগ উঠেছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "ইত্তেফাকের প্রতিবেদনের মূল দাবি"},
    {"id": "h26", "text": "পবিত্র ঈদুল আজহা আজ।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "তারিখভিত্তিক রিপোর্টিং"},
    {"id": "h27", "text": "রাজধানীর মেট্রো স্টেশনের নিচে হাট বসানোর সিদ্ধান্তে সবাই সন্তুষ্ট।", "language": "bn", "expected_verdict": "false", "category": "news", "rationale": "প্রতিবেদনে সমালোচনা ও ভোগান্তির কথা আছে"},
    {"id": "h28", "text": "আদ-দ্বীন হাসপাতালে মৃত্যু কেবল একটি প্রযুক্তিগত ত্রুটির কারণে ঘটেছে, এতে কোনো তদন্তের দরকার নেই।", "language": "bn", "expected_verdict": "unverified", "category": "news", "rationale": "চূড়ান্ত কারণ নিশ্চিত নয়"},
    {"id": "h29", "text": "রামিসা হত্যাকাণ্ড নিয়ে দেবের নামে ভুয়া মন্তব্য ছড়ানো হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "fact_check", "rationale": "রিউমার স্ক্যানার রিপোর্ট"},
    {"id": "h30", "text": "মিজানুর রহমান আজহারীর নামে জুলাই গণঅভ্যুত্থান নিয়ে ভুয়া মন্তব্য প্রচারিত হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "fact_check", "rationale": "রিউমার স্ক্যানার রিপোর্ট"},
    {"id": "h31", "text": "কক্সবাজারে এক নারীকে মারধরের ভিডিওটি ভারতের ভিন্ন ঘটনার বলে দাবি করা হচ্ছে।", "language": "bn", "expected_verdict": "misleading", "category": "fact_check", "rationale": "প্রসঙ্গ বদলানো হয়েছে"},
    {"id": "h32", "text": "একটি পুরনো ভিডিওকে নতুন ঘটনার প্রমাণ হিসেবে ব্যবহার করা হয়েছে।", "language": "bn", "expected_verdict": "misleading", "category": "fact_check", "rationale": "প্রসঙ্গহীন পুনর্ব্যবহার"},
    {"id": "h33", "text": "বাংলাদেশে ২০২৬ সালে ভূমিকম্পে পুরো রাজধানী ধ্বংস হয়েছে।", "language": "bn", "expected_verdict": "false", "category": "disaster", "rationale": "অবাস্তব ও মিথ্যা দাবি"},
    {"id": "h34", "text": "ঢাকা বিশ্ববিদ্যালয়ে ঈদুল আজহার প্রথম জামাত সকাল সাড়ে ৭টায় অনুষ্ঠিত হয়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "bdnews24 প্রতিবেদনের সাথে সামঞ্জস্যপূর্ণ"},
    {"id": "h35", "text": "যুক্তরাষ্ট্রে রাসায়নিকের ট্যাংক বিস্ফোরণে নিহত ১, নিখোঁজ ৯।", "language": "en", "expected_verdict": "true", "category": "news", "rationale": "সংবাদ শিরোনাম অনুযায়ী"},
    {"id": "h36", "text": "The moon is made of cheese.", "language": "en", "expected_verdict": "false", "category": "myth", "rationale": "প্রচলিত ভুল ধারণা"},
    {"id": "h37", "text": "ফেসবুকে ছড়ানো একটি দাবি যাচাইয়ে কোনো নির্ভরযোগ্য প্রমাণ পাওয়া যায়নি।", "language": "bn", "expected_verdict": "unverified", "category": "uncertain", "rationale": "প্রমাণ অনুপস্থিত"},
    {"id": "h38", "text": "ঈদের দিন সারা দেশে কেবল একটি ঈদগাহেই নামাজ হয়েছে।", "language": "bn", "expected_verdict": "false", "category": "news", "rationale": "একাধিক স্থানে জামাত হয়েছে"},
    {"id": "h39", "text": "রাজধানীতে শেষ দিনেও বৃষ্টিতে পশুর হাটে ভাটা পড়েছে।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "প্রথম আলোর খবর"},
    {"id": "h40", "text": "প্রথম আলোর একটি প্রতিবেদনে বলা হয়েছে, রংপুরের পশুর হাটে ক্রেতা কম ছিল।", "language": "bn", "expected_verdict": "true", "category": "news", "rationale": "ফটো/হোমপেজ সারাংশের সাথে মেলে"},
    {"id": "h41", "text": "ক্যালেন্ডার অনুযায়ী ৩০ ফেব্রুয়ারি আসে।", "language": "bn", "expected_verdict": "false", "category": "general_fact", "rationale": "ক্যালেন্ডারগত ভুল"},
    {"id": "h42", "text": "Bangladesh lies in South Asia.", "language": "en", "expected_verdict": "true", "category": "geography", "rationale": "ভৌগোলিক সত্য"},
    {"id": "h43", "text": "The capital of India is Mumbai.", "language": "en", "expected_verdict": "false", "category": "geography", "rationale": "ভুল রাজধানী"},
    {"id": "h44", "text": "Eid prayer at the National Eidgah in Dhaka was prepared for the president and the prime minister to attend.", "language": "en", "expected_verdict": "true", "category": "news", "rationale": "news coverage aligned"},
    {"id": "h45", "text": "The New York and New Jersey authorities started an investigation into FIFA World Cup ticket sales allegations.", "language": "en", "expected_verdict": "true", "category": "news", "rationale": "Jugantor headline summary"},
    {"id": "h46", "text": "A video of an old protest was shared as if it showed today’s Eid chaos in Dhaka.", "language": "en", "expected_verdict": "misleading", "category": "fact_check", "rationale": "context manipulation"},
    {"id": "h47", "text": "A false quote was attributed to a public figure on social media.", "language": "en", "expected_verdict": "false", "category": "fact_check", "rationale": "fabricated attribution"},
    {"id": "h48", "text": "The claim that the hospital reported zero deaths is accurate.", "language": "en", "expected_verdict": "false", "category": "news", "rationale": "contradicts reporting"},
    {"id": "h49", "text": "There is no confirmed evidence that the claim is true yet.", "language": "en", "expected_verdict": "unverified", "category": "uncertain", "rationale": "evidence not confirmed"},
    {"id": "h50", "text": "বাংলাদেশে আগামী সপ্তাহে সব স্কুল বন্ধ ঘোষণা করা হয়েছে।", "language": "bn", "expected_verdict": "unverified", "category": "news", "rationale": "সুনির্দিষ্ট সরকারি ঘোষণা ছাড়া দাবি যাচাইযোগ্য নয়"},
]


def write_json(path: Path, payload: dict | list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    for item in NEW_ARTICLES:
        write_json(RAW_DIR / item["file"], item["data"])

    write_json(BENCHMARK_PATH, BENCHMARK_ITEMS)

    print(f"Wrote {len(NEW_ARTICLES)} new raw corpus files into {RAW_DIR}")
    print(f"Wrote {len(BENCHMARK_ITEMS)} human-labeled benchmark claims into {BENCHMARK_PATH}")


if __name__ == "__main__":
    main()