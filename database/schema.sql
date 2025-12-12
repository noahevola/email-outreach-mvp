-- Enable pgcrypto for encryption
create extension if not exists pgcrypto;

-- 1. User Mail Accounts Table
create table user_mail_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  account_name text not null,
  smtp_host text not null,
  smtp_port int not null,
  smtp_user text not null,
  smtp_pass text not null, -- Store encrypted value here in production
  imap_host text,
  imap_port int,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Contacts Table
create table contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  email text not null,
  first_name text,
  last_name text,
  status text default 'Prospect',
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, email)
);

-- 3. Campaigns Table
create table campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  subject text not null,
  body text not null,
  status text default 'Draft',
  sent_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Campaign Recipients Table
create table campaign_recipients (
  campaign_id uuid references campaigns(id) on delete cascade not null,
  contact_id uuid references contacts(id) on delete cascade not null,
  send_status text default 'Pending',
  sent_at timestamp with time zone,
  open_count int default 0,
  primary key (campaign_id, contact_id)
);

-- Enable Row Level Security (RLS)
alter table user_mail_accounts enable row level security;
alter table contacts enable row level security;
alter table campaigns enable row level security;
alter table campaign_recipients enable row level security;

-- RLS Policies (Simplified for owner access)
create policy "Users manage their own accounts" on user_mail_accounts for all using (auth.uid() = user_id);
create policy "Users manage their own contacts" on contacts for all using (auth.uid() = user_id);
create policy "Users manage their own campaigns" on campaigns for all using (auth.uid() = user_id);
create policy "Users manage their own recipients" on campaign_recipients for all using (exists (select 1 from campaigns where campaigns.id = campaign_recipients.campaign_id and campaigns.user_id = auth.uid()));
