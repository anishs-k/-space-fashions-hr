import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });

export const signOut = () => supabase.auth.signOut();

/**
 * Fetches all rows from a Supabase table by automatically paginating through PostgREST 1000-row limit.
 */
export async function fetchAllRows(tableName: string, selectQuery = 'id, data') {
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const from = page * pageSize;
    const to = (page + 1) * pageSize - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select(selectQuery)
      .range(from, to);
      
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  
  return allData;
}

/**
 * Upserts rows in chunks safely.
 * Handles deduplication within the same batch to prevent Postgres 21000 ON CONFLICT 500 error.
 * Includes graceful row-by-row fallback.
 */
export async function upsertInBatches(tableName: string, rows: any[], batchSize = 100) {
  if (!rows || rows.length === 0) return;

  // 1. Deduplicate by 'id' within the batch (keep latest)
  const seenIds = new Set<string>();
  const uniqueRows: any[] = [];
  
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const id = r.id || `EMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      uniqueRows.unshift({ ...r, id });
    }
  }

  // 2. Upsert in smaller chunks with individual fallback
  for (let i = 0; i < uniqueRows.length; i += batchSize) {
    const chunk = uniqueRows.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(chunk);
    if (error) {
      console.warn(`Batch upsert error (${error.message || '500'}), executing safe item-by-item upsert...`);
      for (const singleRow of chunk) {
        const { error: singleErr } = await supabase.from(tableName).upsert(singleRow);
        if (singleErr) {
          console.error(`Error saving individual row ${singleRow.id}:`, singleErr);
        }
      }
    }
  }
}
