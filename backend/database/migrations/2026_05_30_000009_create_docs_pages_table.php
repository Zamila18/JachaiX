<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('docs_pages', function (Blueprint $table) {
            $table->id();
            $table->string('page_key', 60)->unique()->default('main');
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('available_from')->nullable();
            $table->timestamp('available_until')->nullable();
            $table->json('pitch_sections')->nullable();
            $table->json('technical_sections')->nullable();
            $table->json('team_members')->nullable();
            $table->string('team_name', 120)->nullable();
            $table->string('updated_by', 100)->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        DB::table('docs_pages')->insert([
            'page_key' => 'main',
            'is_enabled' => true,
            'available_from' => '2026-06-10 00:00:00',
            'available_until' => '2026-06-14 23:59:00',
            'pitch_sections' => json_encode([
                ['id' => 'problem', 'title' => 'Problem', 'content' => 'Misinformation spreads quickly across text, screenshots, and reposted media while verification remains slow.'],
                ['id' => 'solution', 'title' => 'Solution', 'content' => 'JachaiX provides OCR + retrieval + explainable verdicting with source links and reviewer escalation.'],
                ['id' => 'why-now', 'title' => 'Why Now', 'content' => 'AI-generated misinformation volume is increasing while trust in social feeds is dropping.'],
                ['id' => 'demo', 'title' => 'Product Demo', 'content' => 'Submit text/image/PDF claims and get evidence-backed verdicts with confidence and sources.'],
                ['id' => 'market', 'title' => 'Market Opportunity', 'content' => 'Newsrooms, civic organizations, trust-and-safety teams, and election monitoring programs.'],
                ['id' => 'business-model', 'title' => 'Business Model', 'content' => 'B2B SaaS subscriptions + enterprise deployment + custom integration services.'],
                ['id' => 'traction', 'title' => 'Traction', 'content' => 'Live claim pipeline, public fact-check pages, and multilingual verification baseline.'],
                ['id' => 'competition', 'title' => 'Competition', 'content' => 'Most alternatives are static or manual; few combine multilingual OCR + explainability + workflow.'],
                ['id' => 'advantage', 'title' => 'Unique Advantage', 'content' => 'Bangla-first design with extensible architecture for international scale.'],
                ['id' => 'gtm', 'title' => 'Go-To-Market', 'content' => 'Pilot with media and civic partners, then expand to public sector and platforms.'],
                ['id' => 'vision', 'title' => 'Vision', 'content' => 'Become the trusted verification layer for multilingual digital ecosystems.']
            ]),
            'technical_sections' => json_encode([
                'product_overview' => 'JachaiX verifies claims from text, image, and PDF workflows and publishes structured fact-check outputs.',
                'feature_matrix' => [
                    ['name' => 'Text verification', 'status' => 'live'],
                    ['name' => 'Image OCR verification', 'status' => 'live'],
                    ['name' => 'PDF OCR verification', 'status' => 'live'],
                    ['name' => 'Public fact-check hub', 'status' => 'live'],
                    ['name' => 'Audio/video verification', 'status' => 'planned']
                ],
                'architecture_diagram' => "flowchart LR\nUI[Next.js UI] --> API[Laravel API]\nAPI --> Q[Queue Worker]\nQ --> OCR[OCR Service]\nQ --> EMB[Embedder Service]\nQ --> RERANK[Reranker Service]\nQ --> DB[(MySQL)]\nEMB --> VDB[(Vector Index)]",
                'data_flow_diagram' => "flowchart LR\nIN[Input] --> NORM[Normalization/OCR]\nNORM --> RET[Retrieval]\nRET --> RERANK[Rerank]\nRERANK --> LLM[Verdict Generation]\nLLM --> OUT[Result + Sources]\nOUT --> FB[Human Review Feedback]",
                'technology_stack' => [
                    'frontend' => 'Next.js + TypeScript',
                    'backend' => 'Laravel + Queues',
                    'database' => 'MySQL + Redis',
                    'ai' => 'OCR + embeddings + reranker + LLM',
                    'infra' => 'Docker Compose'
                ],
                'api_documentation' => 'Core APIs: /analyze/text, /analyze/image, /analyze/pdf, /claims/{id}/status, /claims/{id}/result, /public/fact-checks.',
                'data_layer' => 'Raw corpus ingestion, chunking, vector indexing, source reliability weighting.',
                'ai_layer' => 'Extraction + retrieval + evidence synthesis + explainable confidence scoring.',
                'roadmap' => [
                    ['horizon' => 'short', 'items' => ['Admin moderation UX', 'Docs publishing controls']],
                    ['horizon' => 'mid', 'items' => ['Audio/video verification', 'entity graph analysis']],
                    ['horizon' => 'long', 'items' => ['Cross-platform API ecosystem', 'regional language packs']]
                ],
                'performance_scalability' => 'Queue-based async processing with modular services and cache-first retrieval paths.',
                'security' => 'RBAC-ready admin routes, isolated services, auditable actions.',
                'analytics' => 'Claims throughput, verdict distribution, confidence trends, review escalation rate.',
                'changelog' => [
                    ['version' => 'v1', 'notes' => 'Initial docs system created']
                ]
            ]),
            'team_members' => json_encode([
                [
                    'name' => 'Founding Team Member',
                    'role' => 'Product + Engineering',
                    'email' => 'team@jachaix.local',
                    'image_url' => null
                ]
            ]),
            'team_name' => 'JachaiX Core Team',
            'updated_by' => 'system',
            'version' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('docs_pages');
    }
};
