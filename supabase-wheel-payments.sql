create table if not exists public.wheel_sol_payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  device_id text not null,
  wallet_address text not null,
  tx_signature text not null unique,
  lamports bigint not null,
  sol_amount numeric not null,
  network text not null,
  status text not null default 'confirmed'
);

create index if not exists wheel_sol_payments_device_id_idx
  on public.wheel_sol_payments (device_id);

create index if not exists wheel_sol_payments_wallet_address_idx
  on public.wheel_sol_payments (wallet_address);

alter table public.wheel_sol_payments enable row level security;

drop policy if exists "Allow app to store wheel payments"
  on public.wheel_sol_payments;

create policy "Allow app to store wheel payments"
  on public.wheel_sol_payments
  for insert
  to anon, authenticated
  with check (
    device_id is not null
    and wallet_address is not null
    and tx_signature is not null
    and lamports = 10000000
    and sol_amount = 0.01
    and network = 'devnet'
    and status = 'confirmed'
  );
