-- Create uuid extension (safe if it already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_uri" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- Subscriptions table
CREATE TABLE "Subscription" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon_key" TEXT,
    "category" TEXT,
    "price" DECIMAL(65,30),
    "currency" TEXT,
    "billing_cycle" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "next_payment_date" TIMESTAMP(3),
    "notes" TEXT,
    "reminder_days_before" INTEGER,
    "notification_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Subscription_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "Subscription_user_id_idx" ON "Subscription" ("user_id");
