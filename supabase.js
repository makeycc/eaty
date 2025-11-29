const SUPABASE_URL = 'https://iglrrvgntvlubynkzptj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbHJydmdudHZsdWJ5bmt6cHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDgwMjAsImV4cCI6MjA3OTk4NDAyMH0.mg_E8yT8yXOcbQDc2C_9oHZCIfNurEFvJKxFZtBjj5w';
const SUPABASE_TABLE = 'diary_entries';

function withAuthHeaders(extra = {}) {
    return {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...extra,
    };
}

function normalizeEntryPayload(dateKey, entry) {
    return {
        id: entry.id,
        date_key: dateKey,
        name: entry.name,
        barcode: entry.barcode || null,
        weight: entry.weight,
        calories: entry.calories,
        proteins: entry.proteins,
        fats: entry.fats,
        carbs: entry.carbs,
        base: entry.base || {},
    };
}

function adaptRemoteEntry(row) {
    return {
        id: row.id,
        name: row.name,
        barcode: row.barcode || '',
        weight: Number(row.weight) || 0,
        calories: Number(row.calories) || 0,
        proteins: Number(row.proteins) || 0,
        fats: Number(row.fats) || 0,
        carbs: Number(row.carbs) || 0,
        base: row.base || {},
    };
}

async function fetchEntriesByDate(dateKey) {
    try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`);
        url.searchParams.set('date_key', `eq.${dateKey}`);
        url.searchParams.set('select', '*');
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: withAuthHeaders(),
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        return data.map(adaptRemoteEntry);
    } catch (error) {
        console.error('Supabase: не удалось загрузить записи', error);
        return null;
    }
}

async function upsertEntry(dateKey, entry) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
            method: 'POST',
            headers: withAuthHeaders({ Prefer: 'resolution=merge-duplicates' }),
            body: JSON.stringify([normalizeEntryPayload(dateKey, entry)]),
        });
        if (!response.ok) throw new Error(await response.text());
        return true;
    } catch (error) {
        console.error('Supabase: не удалось сохранить запись', error);
        return false;
    }
}

async function removeEntry(entryId) {
    try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`);
        url.searchParams.set('id', `eq.${entryId}`);
        const response = await fetch(url.toString(), {
            method: 'DELETE',
            headers: withAuthHeaders(),
        });
        if (!response.ok) throw new Error(await response.text());
        return true;
    } catch (error) {
        console.error('Supabase: не удалось удалить запись', error);
        return false;
    }
}

window.diaryApi = {
    fetchEntriesByDate,
    upsertEntry,
    removeEntry,
};
