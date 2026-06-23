// supabase-config.js

const { createClient } = supabase;

const SUPABASE_URL = "https://jbrqoxtbulvkgtodbkmj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpicnFveHRidWx2a2d0b2Ria21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzM3NDAsImV4cCI6MjA5NzEwOTc0MH0.Pt3VJctBVXkbybua1hav84mxwuFs125BsvjorrDdPx4";

// Initialize client
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Fetches log entries from Supabase and transforms snake_case columns to camelCase for the UI
 */
export async function loadEntriesFromDb() {
  const { data, error } = await supabaseClient
    .from("maintenance_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Database Fetch Error:", error);
    return [];
  }

  // Maps database snake_case back to your UI camelCase rendering
  return (data || []).map(e => ({
    id: e.id,
    technician: e.technician,
    workDate: e.work_date,
    site: e.site,
    shift: e.shift,
    shiftIncharge: e.shift_incharge,
    fromTime: e.from_time,
    toTime: e.to_time,
    equipment: e.equipment,
    subEquipment: e.sub_equipment,
    spareParts: e.spare_parts,
    status: e.status,
    workDone: e.work_done,
    followUp: e.follow_up,
    executedBy: e.executed_by,
    verifiedBy: e.verified_by,
    breakdownTime: e.breakdown_time,
    createdAt: e.created_at
  }));
}

/**
 * Inserts a single record into Supabase using snake_case properties
 */
export async function saveEntryToDb(uiEntry) {
  // Convert camelCase object properties to snake_case for PostgreSQL compatibility
  const dbPayload = {
    id: uiEntry.id,
    technician: uiEntry.technician,
    work_date: uiEntry.workDate, 
    site: uiEntry.site,
    shift: uiEntry.shift,
    shift_incharge: uiEntry.shiftIncharge, 
    from_time: uiEntry.fromTime,
    to_time: uiEntry.toTime,
    equipment: uiEntry.equipment,
    sub_equipment: uiEntry.subEquipment, 
    spare_parts: uiEntry.spareParts, 
    status: uiEntry.status,
    work_done: uiEntry.workDone, 
    follow_up: uiEntry.followUp, 
    executed_by: uiEntry.executedBy, 
    verified_by: uiEntry.verifiedBy, 
    breakdown_time: uiEntry.breakdownTime,
    created_at: uiEntry.createdAt ? Number(uiEntry.createdAt) : Date.now()
  };

  const { data, error } = await supabaseClient
    .from("maintenance_log")
    .insert([dbPayload])
    .select();

  if (error) {
    console.error("Supabase Insert Error:", error);
    alert(`Database Error: ${error.message}`);
    return null;
  }
  
  return data;
}