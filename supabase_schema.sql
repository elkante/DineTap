-- ========================================================
-- DineTap SaaS: Supabase Complete Database Schema
-- Paste and Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ikkljurxmfwmhhumoiqo/sql
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Restaurants Table
CREATE TABLE IF NOT EXISTS public.restaurants (
    id TEXT PRIMARY KEY,
    owner_id TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT DEFAULT 'Fresh flavours and signature dishes',
    logo TEXT DEFAULT '🍽️',
    currency TEXT DEFAULT '₦',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    opening_hours TEXT DEFAULT '10:00 AM - 10:00 PM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category TEXT DEFAULT 'Main Dishes',
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC NOT NULL,
    badge TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    prep_time TEXT DEFAULT '15 min',
    allergens TEXT[] DEFAULT '{}',
    is_sold_out BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Guest Diner',
    customer_phone TEXT DEFAULT '',
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
    payment_method TEXT DEFAULT 'pos' CHECK (payment_method IN ('pos', 'cash', 'transfer')),
    source TEXT DEFAULT 'qr' CHECK (source IN ('nfc', 'qr', 'web')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Waiter Buzzer Calls Table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved'))
);

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- Allow public reads and writes for anon (so customers can view menu and place table orders without logging in)
CREATE POLICY "Public restaurants read" ON public.restaurants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public restaurants write" ON public.restaurants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public menu items read" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public menu items write" ON public.menu_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public orders read" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public orders insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public orders update" ON public.orders FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Public waiter calls" ON public.waiter_calls FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable Realtime for live Kitchen Display
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
