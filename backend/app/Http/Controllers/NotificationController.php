<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId  = (int) $request->attributes->get('jwt_sub');
        $perPage = min((int) $request->query('per_page', 20), 100);

        $page = Notification::where('user_id', $userId)
            ->latest('created_at')
            ->paginate($perPage);

        $items = array_map(fn (Notification $n) => [
            'id'          => $n->id,
            'type'        => $n->type,
            'title'       => $n->title,
            'message'     => $n->message,
            'entity_type' => $n->entity_type,
            'entity_id'   => $n->entity_id,
            'is_read'     => $n->read_at !== null,
            'created_at'  => $n->created_at?->toIso8601String(),
        ], $page->items());

        return response()->json([
            'success' => true,
            'items'   => $items,
            'pagination' => [
                'current_page' => $page->currentPage(),
                'per_page'     => $page->perPage(),
                'total'        => $page->total(),
                'last_page'    => $page->lastPage(),
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');
        $count  = Notification::where('user_id', $userId)->whereNull('read_at')->count();
        return response()->json(['success' => true, 'unread' => $count]);
    }

    public function markRead(Request $request, int $id): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');
        Notification::where('user_id', $userId)->where('id', $id)
            ->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $userId = (int) $request->attributes->get('jwt_sub');
        Notification::where('user_id', $userId)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['success' => true]);
    }
}
