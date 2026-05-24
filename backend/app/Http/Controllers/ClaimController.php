<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessAnalysisJob;
use App\Models\AuditLog;
use App\Models\Claim;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClaimController extends Controller
{
    public function submit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'input_type' => 'required|in:text,image,audio,video,url',
            'raw_input'  => 'required|string|max:10000',
            'language'   => 'sometimes|string|max:10',
        ]);

        $claim = Claim::create([
            'input_type' => $validated['input_type'],
            'raw_input'  => $validated['raw_input'],
            'language'   => $validated['language'] ?? 'bn',
            'status'     => 'pending',
            'ip_address' => $request->ip(),
        ]);

        AuditLog::create([
            'claim_id'   => $claim->id,
            'event'      => 'claim_submitted',
            'metadata'   => ['input_type' => $claim->input_type],
            'ip_address' => $request->ip(),
        ]);

        ProcessAnalysisJob::dispatch($claim);

        return response()->json([
            'success'  => true,
            'claim_id' => $claim->id,
            'status'   => $claim->status,
            'message'  => 'Claim submitted successfully. Analysis in progress.',
        ], 201);
    }

    public function status(int $id): JsonResponse
    {
        $claim = Claim::findOrFail($id);

        return response()->json([
            'success' => true,
            'claim'   => [
                'id'               => $claim->id,
                'status'           => $claim->status,
                'verdict'          => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'explanation'      => $claim->explanation,
                'sources'          => $claim->sources,
            ],
        ]);
    }

    public function result(int $id): JsonResponse
    {
        $claim = Claim::findOrFail($id);

        return response()->json([
            'success' => true,
            'claim'   => [
                'id'               => $claim->id,
                'status'           => $claim->status,
                'verdict'          => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'explanation'      => $claim->explanation,
                'sources'          => $claim->sources,
                'input_type'       => $claim->input_type,
                'raw_input'        => $claim->raw_input,
                'language'         => $claim->language,
                'created_at'       => $claim->created_at,
            ],
        ]);
    }
}