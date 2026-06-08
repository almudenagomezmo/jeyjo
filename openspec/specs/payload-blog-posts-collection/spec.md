# Payload blog posts collection

## Purpose

Payload `blog-posts` collection for corporate blog articles managed by Jeyjo staff (US-24, alcance §1.13, change #33).

## Requirements

### Requirement: Blog posts collection models editorial articles

The CMS SHALL expose a `blog-posts` collection with fields: `title` (required text), `slug` (unique, derived from title), `category` (required relationship to `blog-categories`), `tags` (optional array of text), `featuredImage` (required upload relation to `media` when published), `excerpt` (optional textarea), `content` (required Lexical rich text), `authorName` (required text), `metaDescription` (optional textarea), `published` (boolean, default false), and `publishedAt` (datetime).

#### Scenario: Staff creates a blog post with required fields

- **WHEN** personalizacion staff creates a post with title, category, content, authorName, featuredImage, `published` true, and `publishedAt` in the past
- **THEN** the document persists with a unique slug
- **AND** the featured image links to a media record

#### Scenario: Published post requires featured image

- **WHEN** staff sets `published` to true without a featured image
- **THEN** validation rejects the save with a clear error

### Requirement: Lexical editor supports rich blog formatting

The `content` field SHALL use Payload Lexical rich text with at least bold, italic, ordered and unordered lists, links, inline images, and headings H2 and H3.

#### Scenario: Staff adds structured content

- **WHEN** staff saves a post with H2 heading, bullet list, and embedded image in Lexical content
- **THEN** the stored JSON preserves those block types for storefront rendering

### Requirement: Tags are normalized on save

The CMS SHALL trim and lowercase each tag in the `tags` array on save and omit empty strings.

#### Scenario: Mixed-case tags stored consistently

- **WHEN** staff enters tags `Oficina`, ` B2B `
- **THEN** the stored tags are `oficina` and `b2b`

### Requirement: Default publishedAt when publishing without date

When staff sets `published` to true and `publishedAt` is empty, the CMS SHALL default `publishedAt` to the current timestamp before save.

#### Scenario: Immediate publish sets timestamp

- **WHEN** staff toggles `published` true on a new post without setting `publishedAt`
- **THEN** `publishedAt` is set to approximately the save time

### Requirement: Blog posts staff access

Only authenticated Payload staff with `superadmin`, `personalizacion`, or `marketing` in `staffRoles` SHALL have create, read, update, and delete access to `blog-posts` in admin.

#### Scenario: Personalizacion staff manages posts

- **WHEN** a personalizacion user opens the blog posts collection in admin
- **THEN** they can create, edit, and delete posts

#### Scenario: Catalog-only staff denied

- **WHEN** a catalogo-only staff user requests blog posts admin
- **THEN** access is denied

### Requirement: Blog post changes write audit log

Create, update, and delete operations on `blog-posts` SHALL emit audit log entries per `backoffice-audit-console`.

#### Scenario: Publish writes audit entry

- **WHEN** staff sets `published` from false to true on a blog post
- **THEN** an audit log entry records the change with operator and document id
