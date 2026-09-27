# Confluence Cloud REST API v2: vendored reference

- `confluence-v2-openapi.json`: the official OpenAPI document, "The Confluence Cloud REST API v2" (2.0.0), as mirrored in a public client repository in June 2026. Treat it as the source of truth for paths, parameters and schemas.
- `CONFLUENCE_V2_REFERENCE.md`: the four operations Ground Control uses, extracted from that file with their parameters and schemas.

## Facts Ground Control depends on
1. **Base URL:** `https://<site>.atlassian.net/wiki/api/v2`.
2. **Auth for the hackathon:** HTTP basic auth, with the Atlassian account email as the username and an API token as the password.
3. **Read a page:** `GET /pages/{id}?body-format=storage` returns the page with `version.number` and `body.storage.value` (Confluence storage format, XHTML). Poll `version.number` to detect edits.
4. **List a page's comments:** `GET /pages/{id}/footer-comments`.
5. **Post a correction:** `POST /footer-comments` with `pageId` and a `body` in storage representation. Ground Control never edits page bodies.
6. **Code blocks in storage format** appear as an `ac:structured-macro` named `code`, with the text in `ac:plain-text-body`.

If anything here disagrees with `confluence-v2-openapi.json`, the JSON wins.
