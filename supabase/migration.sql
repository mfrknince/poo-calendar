-- =============================================================
-- PooCalendar — Supabase SQL Migration
-- =============================================================
-- Bu script'i Supabase Dashboard → SQL Editor'da çalıştırın.
-- Run this script in Supabase Dashboard → SQL Editor.
-- =============================================================

-- 1. Ana Dakika Matris Tablosu (Main Minutes Matrix Table)
CREATE TABLE IF NOT EXISTS minutes_matrix (
    id TEXT PRIMARY KEY,          -- Format: "HH:mm" (e.g. "00:00", "14:36", "23:59")
    pee_count INT DEFAULT 0,      -- Pee counter
    poop_count INT DEFAULT 0,     -- Poop counter
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Realtime özelliğini aktif et (Enable Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE minutes_matrix;

-- 3. 00:00 - 23:59 arası 1440 dakikayı doldur (Populate 1440 minutes)
DO $$
DECLARE
    h INT;
    m INT;
    time_str TEXT;
BEGIN
    FOR h IN 0..23 LOOP
        FOR m IN 0..59 LOOP
            time_str := LPAD(h::TEXT, 2, '0') || ':' || LPAD(m::TEXT, 2, '0');
            INSERT INTO minutes_matrix (id, pee_count, poop_count)
            VALUES (time_str, 0, 0)
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 4. Row Level Security (RLS) — Herkesin okuma/yazma yapabilmesi için
--    (Allow everyone to read and update)
ALTER TABLE minutes_matrix ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (Everyone can read)
CREATE POLICY "Anyone can read minutes_matrix"
    ON minutes_matrix
    FOR SELECT
    USING (true);

-- Herkes güncelleyebilir (Everyone can update)
CREATE POLICY "Anyone can update minutes_matrix"
    ON minutes_matrix
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- =============================================================
-- ✅ Done! Now get your Supabase URL and Anon Key from:
-- Dashboard → Project Settings → API
-- =============================================================
