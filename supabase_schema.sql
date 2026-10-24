-- ========================================================
-- DineTap SaaS: Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ikkljurxmfwmhhumoiqo/sql
-- ========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    table_number TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Guest Diner',
    items JSONB NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
    source TEXT DEFAULT 'nfc' CHECK (source IN ('nfc', 'qr', 'web')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Waiter Buzzer Calls Table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    table_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved'))
);

-- 3. Row Level Security (RLS) & Public Policies for Dine-in Customers
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

-- Allow anonymous diner inserts & reads via anon publishable key
CREATE POLICY "Allow public order creation" 
ON public.orders FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public order read" 
ON public.orders FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public order updates" 
ON public.orders FOR UPDATE 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public waiter buzzer calls" 
ON public.waiter_calls FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Enable Supabase Realtime for live Kitchen Display updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
