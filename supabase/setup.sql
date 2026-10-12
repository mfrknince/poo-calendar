-- ==========================================================
-- PooCalendar - Veritabanı Kurulum / Güncelleme Scripti
-- Supabase Dashboard -> SQL Editor -> yapıştır -> RUN
--
-- Hem boş hem mevcut veritabanında tekrar tekrar çalıştırılabilir.
-- Mevcut verileri SİLMEZ (tek istisna: kullanılmayan eski Bristol "evaluations" tablosu).
-- ==========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ==========================================================
-- 1. TABLOLAR
-- ==========================================================

-- Şifreler Supabase'in auth.users tablosunda bcrypt ile tutulur; burası sadece açık profil verisi.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE public.profiles SET role = 'user' WHERE role NOT IN ('user', 'admin');
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Dakika matrisi: her kullanıcı için 'HH:mm' başına toplam sayaç
CREATE TABLE IF NOT EXISTS public.minutes_matrix (
  id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pee_count INT NOT NULL DEFAULT 0,
  poop_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.minutes_matrix DROP CONSTRAINT IF EXISTS minutes_matrix_id_format;
ALTER TABLE public.minutes_matrix ADD CONSTRAINT minutes_matrix_id_format
  CHECK (id ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') NOT VALID;

-- Aktivite günlüğü: profil sayfasının günlük/haftalık istatistikleri
CREATE TABLE IF NOT EXISTS public.activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pee', 'poop')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_log_user_time ON public.activity_log (user_id, created_at);

-- Tuvalet değerlendirme: harita üzerindeki yerler
CREATE TABLE IF NOT EXISTS public.toilets (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Her kullanıcı bir tuvalete tek değerlendirme yapar (tekrar kaydederse güncellenir)
CREATE TABLE IF NOT EXISTS public.toilet_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  toilet_id BIGINT NOT NULL REFERENCES public.toilets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (toilet_id, user_id)
);

-- Eski Bristol dışkı değerlendirme tablosu artık kullanılmıyor
DROP TABLE IF EXISTS public.evaluations CASCADE;

-- ==========================================================
-- 2. YARDIMCI FONKSİYON
-- ==========================================================

-- RLS'i bypass eder (profiles politikalarında sonsuz döngüyü önler)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ==========================================================
-- 3. GÜVENLİK (RLS) POLİTİKALARI
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toilet_reviews ENABLE ROW LEVEL SECURITY;

-- Eski/yanlış politikalar dahil hepsini temizle, aşağıda doğrularını yeniden oluştur
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'minutes_matrix', 'activity_log', 'toilets', 'toilet_reviews')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- Profiller
CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Adminler tüm profilleri görebilir" ON public.profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Adminler profilleri güncelleyebilir" ON public.profiles
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Adminler profil silebilir" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Dakika matrisi: ekip ortak matrisi doldurur, herkes herkesin kaydını görür; yazma sadece kendi satırına
CREATE POLICY "Herkes matrisi görebilir" ON public.minutes_matrix
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kullanıcılar kendi verilerini ekleyebilir" ON public.minutes_matrix
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi verilerini güncelleyebilir" ON public.minutes_matrix
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi verilerini silebilir" ON public.minutes_matrix
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Adminler tüm matris verilerini ekleyebilir" ON public.minutes_matrix
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Adminler tüm matris verilerini güncelleyebilir" ON public.minutes_matrix
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Adminler tüm matris verilerini silebilir" ON public.minutes_matrix
  FOR DELETE USING (public.is_admin());

-- Aktivite günlüğü
CREATE POLICY "Kullanıcılar kendi aktivitelerini görebilir" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi aktivitelerini ekleyebilir" ON public.activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tuvaletler ve değerlendirmeler tüm giriş yapmış kullanıcılara açık
CREATE POLICY "Herkes tuvaletleri görebilir" ON public.toilets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kullanıcılar tuvalet ekleyebilir" ON public.toilets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Adminler tuvalet silebilir" ON public.toilets
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Herkes değerlendirmeleri görebilir" ON public.toilet_reviews
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Kullanıcılar değerlendirme ekleyebilir" ON public.toilet_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi değerlendirmesini güncelleyebilir" ON public.toilet_reviews
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi değerlendirmesini silebilir" ON public.toilet_reviews
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ==========================================================
-- 3b. EKİP MATRİSİ
-- ==========================================================

-- Ana sayfadaki ortak matris: tüm kullanıcıların dakika toplamları
-- security_invoker: RLS uygulanır, giriş yapmamış biri hiçbir şey göremez
CREATE OR REPLACE VIEW public.team_matrix WITH (security_invoker = true) AS
  SELECT id, SUM(pee_count)::int AS pee_count, SUM(poop_count)::int AS poop_count
  FROM public.minutes_matrix
  GROUP BY id;

-- Atomik +1: aynı anda tıklayan kullanıcılar birbirinin kaydını ezmez.
-- SECURITY INVOKER (varsayılan): RLS ile kullanıcı sadece kendi satırına yazar.
CREATE OR REPLACE FUNCTION public.log_minute(minute_id text, kind text)
RETURNS void
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF kind NOT IN ('pee', 'poop') THEN
    RAISE EXCEPTION 'Geçersiz tür: %', kind;
  END IF;

  INSERT INTO public.minutes_matrix (id, user_id, pee_count, poop_count, updated_at)
  VALUES (minute_id, auth.uid(), (kind = 'pee')::int, (kind = 'poop')::int, NOW())
  ON CONFLICT (id, user_id) DO UPDATE SET
    pee_count = minutes_matrix.pee_count + EXCLUDED.pee_count,
    poop_count = minutes_matrix.poop_count + EXCLUDED.poop_count,
    updated_at = NOW();

  INSERT INTO public.activity_log (type) VALUES (kind);
END;
$$;

-- Profil sayfası: kullanıcının kendi tüm zamanlar toplamı
CREATE OR REPLACE FUNCTION public.my_totals()
RETURNS TABLE (pee int, poop int)
LANGUAGE sql STABLE SET search_path = public
AS $$
  SELECT COALESCE(SUM(pee_count), 0)::int, COALESCE(SUM(poop_count), 0)::int
  FROM public.minutes_matrix
  WHERE user_id = auth.uid();
$$;

-- ==========================================================
-- 4. REALTIME (canlı güncelleme)
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'minutes_matrix'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.minutes_matrix;
  END IF;
END $$;

-- ==========================================================
-- 5. OTOMATİK PROFİL (yeni kayıt olan her kullanıcıya)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 6)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profili olmayan eski kullanıcılara profil aç (admin sadece kullanıcı adı 'admin' olana)
INSERT INTO public.profiles (id, username, role)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 6)),
  CASE WHEN raw_user_meta_data->>'username' = 'admin' THEN 'admin' ELSE 'user' END
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- 6. VARSAYILAN ADMIN (yoksa oluşturulur)
-- Kullanıcı adı: admin / Şifre: admin123  -> İLK GİRİŞTE PROFİLİM'DEN DEĞİŞTİRİN
-- ==========================================================
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@poocalendar.local') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
      'admin@poocalendar.local', extensions.crypt('admin123', extensions.gen_salt('bf')), NOW(),
      '{"provider":"email","providers":["email"]}', '{"username":"admin"}', NOW(), NOW(),
      '', '', '', ''
    );
    -- Trigger profili 'user' olarak açar, admin yap
    UPDATE public.profiles SET role = 'admin' WHERE id = admin_uid;
  END IF;
END $$;

-- ==========================================================
-- 7. ADMIN KULLANICI YÖNETİMİ (RPC)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_username text,
  new_password text,
  new_role text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  new_uid uuid := gen_random_uuid();
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_uid, 'authenticated', 'authenticated',
    new_username || '@poocalendar.local', crypt(new_password, gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('username', new_username),
    NOW(), NOW(),
    '', '', '', ''
  );

  UPDATE public.profiles SET role = new_role WHERE id = new_uid;
  RETURN json_build_object('success', true, 'id', new_uid);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id uuid,
  new_username text,
  new_password text,
  new_role text
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  IF new_password IS NOT NULL AND new_password <> '' THEN
    UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf')) WHERE id = target_user_id;
  END IF;

  IF new_username IS NOT NULL AND new_username <> '' THEN
    UPDATE auth.users
      SET email = new_username || '@poocalendar.local',
          raw_user_meta_data = json_build_object('username', new_username)
      WHERE id = target_user_id;
    UPDATE public.profiles SET username = new_username WHERE id = target_user_id;
  END IF;

  IF new_role IS NOT NULL AND new_role <> '' THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  target_user_id uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN json_build_object('success', true);
END;
$$;

COMMIT;

-- BİTTİ. Kontrol için: SELECT username, role FROM public.profiles WHERE role = 'admin';
