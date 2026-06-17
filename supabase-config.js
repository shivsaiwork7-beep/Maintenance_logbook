const SUPABASE_URL = "https://jbrqoxtbulvkgtodbkmj.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_0h_k9HKG9H7EFFeO2ne1vQ_bWARm_BU";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* =========================
   AUTH FUNCTIONS
========================= */

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

/* =========================
   FETCH LOGS
========================= */

async function fetchLogs() {
  const { data, error } = await supabaseClient
    .from("maintenance_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/* =========================
   INSERT LOG
========================= */

async function insertLog(entry) {
  const { data, error } = await supabaseClient
    .from("maintenance_logs")
    .insert([entry]);

  if (error) throw error;
  return data;
}

/* =========================
   REALTIME SUBSCRIPTION
========================= */

function subscribeToLogs(callback) {
  return supabaseClient
    .channel("maintenance_logs_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "maintenance_logs"
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
}

/* =========================
   EXPORT GLOBALS
========================= */

window.supabaseClient = supabaseClient;
window.signIn = signIn;
window.signOut = signOut;
window.fetchLogs = fetchLogs;
window.insertLog = insertLog;
window.subscribeToLogs = subscribeToLogs;