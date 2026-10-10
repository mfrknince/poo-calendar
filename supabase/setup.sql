-- ==========================================
-- PooCalendar - Tam Sıfırlama ve Kurulum SQL Scripti
-- Bu kodu Supabase Dashboard -> SQL Editor kısmına yapıştırıp RUN diyerek çalıştırın.
-- ==========================================

-- 1. Önceki tabloları (eğer varsa) temizle
DROP TABLE IF EXISTS public.minutes_matrix CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Profiller tablosunu oluştur
-- Not: Şifreler Supabase'in kendi güvenli "auth.users" tablosunda bcrypt ile hashlenerek tutulur.
-- Bu tablo (profiles) sadece uygulamada gösterilecek açık profil verilerini içerir.
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' veya 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Matris tablosunu oluştur
CREATE TABLE public.minutes_matrix (
  id TEXT NOT NULL, -- 'HH:mm' formatında
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  pee_count INT NOT NULL DEFAULT 0,
  poop_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 4. RLS (Row Level Security) Aktifleştirme
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minutes_matrix ENABLE ROW LEVEL SECURITY;

-- 5. Güvenlik Politikaları ve Helper Fonksiyon
-- Infinite recursion (sonsuz döngü) hatasını önlemek için RLS'i bypass eden bir helper yazıyoruz.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiller için politikalar
CREATE POLICY "Kullanıcılar kendi profillerini görebilir" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Adminler tüm profilleri görebilir" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Adminler profilleri güncelleyebilir" ON public.profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Adminler profil silebilir" ON public.profiles
  FOR DELETE USING (public.is_admin());

-- Matris tablosu için politikalar
CREATE POLICY "Kullanıcılar kendi verilerini görebilir" ON public.minutes_matrix
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi verilerini ekleyebilir" ON public.minutes_matrix
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi verilerini güncelleyebilir" ON public.minutes_matrix
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi verilerini silebilir" ON public.minutes_matrix
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Adminler tüm matris verilerini görebilir" ON public.minutes_matrix
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Adminler tüm matris verilerini ekleyebilir" ON public.minutes_matrix
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Adminler tüm matris verilerini güncelleyebilir" ON public.minutes_matrix
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Adminler tüm matris verilerini silebilir" ON public.minutes_matrix
  FOR DELETE USING (public.is_admin());

-- 6. Yeni kullanıcı kayıt olduğunda otomatik profil oluşturma Trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username',
    -- İlk kayıt olan kullanıcı (veya kullanıcı adı admin olan) admin olsun
    CASE 
      WHEN new.raw_user_meta_data->>'username' = 'admin' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eski trigger varsa sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Yeni trigger'ı bağla
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 7. DEFAULT ADMIN HESABINI OLUŞTUR
-- Kullanıcı adı: admin
-- Şifre: admin123
DO $$
DECLARE
  admin_uid UUID := gen_random_uuid();
BEGIN
  -- Eğer admin hesabı zaten yoksa auth.users tablosuna şifreyi crypt ile hashleyerek ekle
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@poocalendar.local') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated', 
      'admin@poocalendar.local', crypt('admin123', gen_salt('bf')), NOW(), 
      '{"provider":"email","providers":["email"]}', '{"username":"admin"}', NOW(), NOW(),
      '', '', '', ''
    );
    
    -- Not: auth.users tablosuna kayıt yapıldığı an yukarıdaki trigger (handle_new_user)
    -- otomatik olarak devreye girip public.profiles tablosuna admin rolüyle kaydı ekleyecektir.
  END IF;
END $$;

-- 8. Admin Kullanıcı Yönetimi için Helper Fonksiyonlar (RPC)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_create_user(
  new_username text,
  new_password text,
  new_role text
)
RETURNS json AS $$
DECLARE
  new_uid uuid := gen_random_uuid();
  fake_email text := new_username || '@poocalendar.local';
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
    fake_email, crypt(new_password, gen_salt('bf')), NOW(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('username', new_username),
    NOW(), NOW(),
    '', '', '', ''
  );

  UPDATE public.profiles SET role = new_role WHERE id = new_uid;
  RETURN json_build_object('success', true, 'id', new_uid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id uuid,
  new_username text,
  new_password text,
  new_role text
)
RETURNS json AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  IF new_password IS NOT NULL AND new_password <> '' THEN
    UPDATE auth.users SET encrypted_password = crypt(new_password, gen_salt('bf')) WHERE id = target_user_id;
  END IF;

  IF new_username IS NOT NULL AND new_username <> '' THEN
    UPDATE auth.users SET email = new_username || '@poocalendar.local', raw_user_meta_data = json_build_object('username', new_username) WHERE id = target_user_id;
    UPDATE public.profiles SET username = new_username WHERE id = target_user_id;
  END IF;

  IF new_role IS NOT NULL AND new_role <> '' THEN
    UPDATE public.profiles SET role = new_role WHERE id = target_user_id;
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.admin_delete_user(
  target_user_id uuid
)
RETURNS json AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz işlem';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BİTTİ. Artık sistem tamamen hazır!
