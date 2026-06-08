// Shared presentation helpers for activity logs.

export function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.floor((Date.now() - then) / 1000);

  if (secs < 45) return "just now";
  if (secs < 90) return "a minute ago";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

// Emoji + tone per activity type, used by the feed and dashboard card.
const META: Record<string, { icon: string; tone: string }> = {
  USER_REGISTERED:           { icon: "🎉", tone: "green" },
  USER_LOGGED_IN:            { icon: "🔓", tone: "green" },
  USER_LOGGED_OUT:           { icon: "🔒", tone: "muted" },
  PASSWORD_CHANGED:          { icon: "🔑", tone: "amber" },
  PROFILE_UPDATED:           { icon: "✏️", tone: "blue" },
  PROFILE_IMAGE_UPLOADED:    { icon: "🖼️", tone: "blue" },
  PROFILE_IMAGE_DELETED:     { icon: "🗑️", tone: "muted" },
  FACT_VIEWED:               { icon: "👁️", tone: "blue" },
  FACT_SHARED:               { icon: "🔗", tone: "blue" },
  BOOKMARK_CREATED:          { icon: "🔖", tone: "green" },
  BOOKMARK_REMOVED:          { icon: "🗑️", tone: "muted" },
  CLAIM_SUBMITTED:           { icon: "📤", tone: "green" },
  CLAIM_UPDATED:             { icon: "📝", tone: "blue" },
  CLAIM_APPROVED:            { icon: "✅", tone: "green" },
  CLAIM_REJECTED:            { icon: "❌", tone: "red" },
  HUMAN_REVIEW_REQUESTED:    { icon: "🧑‍⚖️", tone: "amber" },
  REVIEW_COMPLETED:          { icon: "📋", tone: "green" },
  LANGUAGE_CHANGED:          { icon: "🌐", tone: "muted" },
  COUNTRY_UPDATED:           { icon: "📍", tone: "muted" },
  PHONE_UPDATED:             { icon: "📞", tone: "muted" },
  FAILED_LOGIN_ATTEMPT:      { icon: "⚠️", tone: "red" },
  UNAUTHORIZED_ACCESS_ATTEMPT:{ icon: "🚫", tone: "red" },
};

export function activityIcon(type: string): string {
  return META[type]?.icon ?? "•";
}

export function activityTone(type: string): string {
  return META[type]?.tone ?? "muted";
}
