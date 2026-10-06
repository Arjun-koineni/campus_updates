CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');
CREATE TYPE "CategoryType" AS ENUM ('DEADLINE', 'NOTICE');
CREATE TYPE "PostType" AS ENUM ('DEADLINE', 'NOTICE');
CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "Priority" AS ENUM ('NORMAL', 'CRITICAL');
CREATE TYPE "AudienceType" AS ENUM ('ALL', 'YEAR', 'BRANCH', 'SECTION');
CREATE TYPE "RegistrationStatus" AS ENUM ('DONE', 'REMIND_LATER');
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'PUSH');

CREATE TABLE "User" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "roll_no" TEXT NOT NULL,
  "name" TEXT NOT NULL, "email" TEXT NOT NULL, "password_hash" TEXT,
  "role" "Role" NOT NULL DEFAULT 'STUDENT', "year" TEXT, "branch" TEXT,
  "section" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
  "first_login_required" BOOLEAN NOT NULL DEFAULT true,
  "failed_login_count" INTEGER NOT NULL DEFAULT 0,
  "locked_until" TIMESTAMPTZ(3), "last_login_at" TIMESTAMPTZ(3),
  "last_visit_at" TIMESTAMPTZ(3), "session_version" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_roll_no_key" ON "User"("roll_no");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Category" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0, "type" "CategoryType" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_active_name_key" ON "Category"(lower("name")) WHERE "active" = true;
CREATE INDEX "Category_order_idx" ON "Category"("order");

CREATE TABLE "Post" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "category_id" UUID NOT NULL,
  "type" "PostType" NOT NULL, "title" TEXT NOT NULL, "summary" TEXT NOT NULL,
  "source" TEXT, "link" TEXT, "attachment_url" TEXT, "fees" TEXT, "deadline_at" TIMESTAMPTZ(3),
  "valid_until" TIMESTAMPTZ(3), "pinned" BOOLEAN NOT NULL DEFAULT false,
  "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
  "audience_type" "AudienceType" NOT NULL DEFAULT 'ALL', "audience_value" TEXT,
  "status" "PostStatus" NOT NULL DEFAULT 'ACTIVE', "archived_at" TIMESTAMPTZ(3),
  "created_by" UUID NOT NULL, "updated_by" UUID,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Post_category_id_status_idx" ON "Post"("category_id", "status");
CREATE INDEX "Post_deadline_at_status_idx" ON "Post"("deadline_at", "status");
CREATE INDEX "Post_valid_until_status_idx" ON "Post"("valid_until", "status");
CREATE INDEX "Post_pinned_status_idx" ON "Post"("pinned", "status");
CREATE INDEX "post_search_idx" ON "Post" USING GIN (to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("source", '') || ' ' || coalesce("link", '')));

CREATE TABLE "Registration" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL,
  "post_id" UUID NOT NULL, "status" "RegistrationStatus" NOT NULL,
  "remind_at" TIMESTAMPTZ(3), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Registration_user_id_post_id_key" ON "Registration"("user_id", "post_id");
CREATE INDEX "Registration_user_id_status_idx" ON "Registration"("user_id", "status");

CREATE TABLE "Notification" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "post_id" UUID,
  "title" TEXT NOT NULL, "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "NotificationRead" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL,
  "notification_id" UUID NOT NULL, "read_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationRead_user_id_notification_id_key" ON "NotificationRead"("user_id", "notification_id");

CREATE TABLE "Reminder" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL,
  "post_id" UUID NOT NULL, "send_at" TIMESTAMPTZ(3) NOT NULL,
  "channel" "ReminderChannel" NOT NULL, "sent" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Reminder_send_at_sent_idx" ON "Reminder"("send_at", "sent");

CREATE TABLE "AuthToken" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL, "purpose" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL, "used_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuthToken_user_id_purpose_expires_at_idx" ON "AuthToken"("user_id", "purpose", "expires_at");

CREATE TABLE "AuditLog" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "actor_id" UUID NOT NULL,
  "action" TEXT NOT NULL, "entity_type" TEXT NOT NULL, "entity_id" TEXT NOT NULL,
  "details" JSONB, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entity_type_entity_id_idx" ON "AuditLog"("entity_type", "entity_id");
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

CREATE TABLE "PostHistory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "post_id" UUID NOT NULL,
  "changed_by" UUID NOT NULL, "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PostHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PostHistory_post_id_created_at_idx" ON "PostHistory"("post_id", "created_at");

ALTER TABLE "Post" ADD CONSTRAINT "Post_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationRead" ADD CONSTRAINT "NotificationRead_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PostHistory" ADD CONSTRAINT "PostHistory_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PostHistory" ADD CONSTRAINT "PostHistory_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
