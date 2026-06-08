import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Footer settings global + blog collections (incremental, idempotent).
 * Replaces auto-generated full-schema migration unsafe on existing DBs.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "blog_categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "description" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "blog_posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "generate_slug" boolean DEFAULT true,
      "slug" varchar NOT NULL,
      "category_id" integer NOT NULL,
      "featured_image_id" integer,
      "excerpt" varchar,
      "content" jsonb NOT NULL,
      "author_name" varchar DEFAULT 'Equipo Jeyjo' NOT NULL,
      "meta_description" varchar,
      "published" boolean DEFAULT false,
      "published_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "blog_posts_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "tag" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "footer_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "show_stores" boolean DEFAULT true,
      "show_social" boolean DEFAULT true,
      "social_facebook" varchar,
      "social_instagram" varchar,
      "social_linkedin" varchar,
      "social_youtube" varchar,
      "blog_enabled" boolean DEFAULT false,
      "blog_label" varchar DEFAULT 'Blog',
      "eu_funding_enabled" boolean DEFAULT false,
      "eu_funding_image_id" integer,
      "eu_funding_alt" varchar,
      "eu_funding_url" varchar,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "blog_categories_id" integer,
      ADD COLUMN IF NOT EXISTS "blog_posts_id" integer;

    CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_slug_idx"
      ON "blog_categories" ("slug");
    CREATE INDEX IF NOT EXISTS "blog_categories_updated_at_idx"
      ON "blog_categories" ("updated_at");
    CREATE INDEX IF NOT EXISTS "blog_categories_created_at_idx"
      ON "blog_categories" ("created_at");

    CREATE INDEX IF NOT EXISTS "blog_posts_tags_order_idx"
      ON "blog_posts_tags" ("_order");
    CREATE INDEX IF NOT EXISTS "blog_posts_tags_parent_id_idx"
      ON "blog_posts_tags" ("_parent_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_idx"
      ON "blog_posts" ("slug");
    CREATE INDEX IF NOT EXISTS "blog_posts_category_idx"
      ON "blog_posts" ("category_id");
    CREATE INDEX IF NOT EXISTS "blog_posts_featured_image_idx"
      ON "blog_posts" ("featured_image_id");
    CREATE INDEX IF NOT EXISTS "blog_posts_updated_at_idx"
      ON "blog_posts" ("updated_at");
    CREATE INDEX IF NOT EXISTS "blog_posts_created_at_idx"
      ON "blog_posts" ("created_at");

    CREATE INDEX IF NOT EXISTS "footer_settings_eu_funding_image_idx"
      ON "footer_settings" ("eu_funding_image_id");

    DO $$ BEGIN
      ALTER TABLE "blog_posts_tags"
        ADD CONSTRAINT "blog_posts_tags_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_posts"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "blog_posts"
        ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk"
        FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "blog_posts"
        ADD CONSTRAINT "blog_posts_featured_image_id_media_id_fk"
        FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "footer_settings"
        ADD CONSTRAINT "footer_settings_eu_funding_image_id_media_id_fk"
        FOREIGN KEY ("eu_funding_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk"
        FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk"
        FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_categories_id_idx"
      ON "payload_locked_documents_rels" ("blog_categories_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_posts_id_idx"
      ON "payload_locked_documents_rels" ("blog_posts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_blog_posts_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_blog_categories_fk";
    ALTER TABLE "footer_settings" DROP CONSTRAINT IF EXISTS "footer_settings_eu_funding_image_id_media_id_fk";
    ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_featured_image_id_media_id_fk";
    ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_category_id_blog_categories_id_fk";
    ALTER TABLE "blog_posts_tags" DROP CONSTRAINT IF EXISTS "blog_posts_tags_parent_id_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "blog_posts_id",
      DROP COLUMN IF EXISTS "blog_categories_id";

    DROP TABLE IF EXISTS "blog_posts_tags" CASCADE;
    DROP TABLE IF EXISTS "blog_posts" CASCADE;
    DROP TABLE IF EXISTS "blog_categories" CASCADE;
    DROP TABLE IF EXISTS "footer_settings" CASCADE;
  `)
}
