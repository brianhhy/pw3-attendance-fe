export const EVENT_STORAGE_KEY = "pw3_event";
export const EVENTS_CHANGED = "pw3-events-changed";

export interface SavedEvent {
  date: string;
  type: string;
}

export function readEvents(): SavedEvent[] {
  try {
    const raw = localStorage.getItem(EVENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return (Array.isArray(parsed) ? parsed : [parsed]).filter(
      (event): event is SavedEvent => !!event && typeof event === "object" &&
        typeof event.date === "string" && typeof event.type === "string"
    );
  } catch {
    return [];
  }
}

export function saveEvents(events: SavedEvent[]) {
  if (events.length) localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events));
  else localStorage.removeItem(EVENT_STORAGE_KEY);
  window.dispatchEvent(new Event(EVENTS_CHANGED));
}
