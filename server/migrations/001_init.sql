-- 001_init.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_email TEXT REFERENCES users(email),
  stripe_subscription_id TEXT,
  status TEXT,
  price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  to_email TEXT,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT
);

CREATE TABLE IF NOT EXISTS coverage (
  id TEXT PRIMARY KEY,
  title TEXT,
  outlet TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  snippet TEXT,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
