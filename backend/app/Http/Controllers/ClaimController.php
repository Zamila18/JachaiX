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
            'input_type' => 'required|in:text,image,pdf',
            'raw_input'  => 'required_if:input_type,text|nullable|string|max:10000',
            'file'       => 'required_if:input_type,image,pdf|nullable|file|max:10240',
            'language'   => 'sometimes|string|max:10',
        ]);

        $filePath = null;
        $rawInput = $validated['raw_input'] ?? null;

        // Handle file upload for image or pdf
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('uploads', 'local');
            $rawInput = $filePath;
        }

        $claim = Claim::create([
            'input_type' => $validated['input_type'],
            'raw_input'  => $rawInput,
            'file_path'  => $filePath,
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
            'message'  => 'Claim submitted. Analysis in progress.',
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
                'input_type'       => $claim->input_type,
                'extracted_text'   => $claim->extracted_text,
                'claim_text'       => $claim->claim_text,
                'verdict'          => $claim->verdict,
                'confidence_score' => $claim->confidence_score,
                'explanation'      => $claim->explanation,
                'sources'          => $claim->sources,
                'language'         => $claim->language,
                'created_at'       => $claim->created_at,
            ],
        ]);
    }
}