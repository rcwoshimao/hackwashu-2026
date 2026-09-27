# Confluence Cloud REST API v2: the parts Ground Control uses

Extracted from Atlassian's official OpenAPI spec (`confluence-v2-openapi.json` in this folder, "The Confluence Cloud REST API v2" 2.0.0). Base URL: `https://<your-site>.atlassian.net/wiki/api/v2`.

## Authentication

- **basicAuth** (http, basic): You can access this resource via basic auth.
- **oAuthDefinitions** (oauth2): This API uses OAuth 2 with the authorizationCode grant flow.

For the hackathon use basic auth: the Atlassian account email as the username and an API token as the password.

## GET /pages/{id}  (`getPageById`)

Get page by id

Returns a specific page.

**[Permissions](https://confluence.atlassian.com/x/_AozKw) required**:
Permission to view the page and its corresponding space.

**Parameters**

- `id` (path, required): The ID of the page to be returned. If you don't know the page ID, use Get pages and filter the results. Schema: `{"format": "int64", "type": "integer"}`
- `body-format` (query): The content format types to be returned in the `body` field of the response. If available, the representation will be available under a response field of the same name under the `body` field. Schema: `{"<PrimaryBodyRepresentationSingle>": {"enum": ["storage", "atlas_doc_format", "view", "export_view", "anonymous_export_view", "styled_view", "editor"], "type": "string", "description": "The primary formats a body can be represented as. A subset of BodyRepresentation. These formats are the only allo`
- `get-draft` (query): Retrieve the draft version of this page. Schema: `{"type": "boolean", "default": false}`
- `status` (query): Filter the page being retrieved by its status. Schema: `{"type": "array", "items": {"type": "string", "enum": ["current", "archived", "trashed", "deleted", "historical", "draft"]}}`
- `version` (query): Allows you to retrieve a previously published version. Specify the previous version's number to retrieve its details. Schema: `{"type": "integer"}`
- `include-labels` (query): Includes labels associated with this page in the response.
The number of results will be limited to 50 and sorted in the default sort order. 
A `meta` and `_links` property will be present to indicate if more results are available and a link to retrieve the rest of the results. Schema: `{"type": "boolean", "default": false}`
- `include-properties` (query): Includes content properties associated with this page in the response.
The number of results will be limited to 50 and sorted in the default sort order. 
A `meta` and `_links` property will be present to indicate if more results are available and a link to retrieve the rest of the results. Schema: `{"type": "boolean", "default": false}`
- `include-operations` (query): Includes operations associated with this page in the response, as defined in the `Operation` object.
The number of results will be limited to 50 and sorted in the default sort order. 
A `meta` and `_links` property will be present to indicate if more results are available and a link to retrieve the  Schema: `{"type": "boolean", "default": false}`
- `include-likes` (query): Includes likes associated with this page in the response.
The number of results will be limited to 50 and sorted in the default sort order. 
A `meta` and `_links` property will be present to indicate if more results are available and a link to retrieve the rest of the results. Schema: `{"type": "boolean", "default": false}`
- `include-versions` (query): Includes versions associated with this page in the response.
The number of results will be limited to 50 and sorted in the default sort order. 
A `meta` and `_links` property will be present to indicate if more results are available and a link to retrieve the rest of the results. Schema: `{"type": "boolean", "default": false}`
- `include-version` (query): Includes the current version associated with this page in the response.
By default this is included and can be omitted by setting the value to `false`. Schema: `{"type": "boolean", "default": true}`
- `include-favorited-by-current-user-status` (query): Includes whether this page has been favorited by the current user. Schema: `{"type": "boolean", "default": false}`
- `include-webresources` (query): Includes web resources that can be used to render page content on a client. Schema: `{"type": "boolean", "default": false}`
- `include-collaborators` (query): Includes collaborators on the page. Schema: `{"type": "boolean", "default": false}`
- `include-direct-children` (query): Includes direct children of the page, as defined in the `ChildrenResponse` object. Schema: `{"type": "boolean", "default": false}`

**Success response**

```json
{
 "description": "Returned if the requested page is returned.",
 "content": {
  "application/json": {
   "schema": {
    "allOf": [
     {
      "<PageSingle>": {
       "type": "object",
       "properties": {
        "id": {
         "type": "string",
         "description": "ID of the page."
        },
        "status": {
         "<ContentStatus>": {
          "enum": [
           "current",
           "draft",
           "archived",
           "historical",
           "trashed",
           "deleted",
           "any"
          ],
          "type": "string",
          "description": "The status of the content."
         }
        },
        "title": {
         "type": "string",
         "description": "Title of the page."
        },
        "spaceId": {
         "type": "string",
         "description": "ID of the space the page is in."
        },
        "parentId": {
         "type": "string",
         "description": "ID of the parent page, or null if there is no parent page."
        },
        "parentType": {
         "<ParentContentType>": {
          "type": "string",
          "enum": [
           "page",
           "whiteboard",
           "database",
           "embed",
           "folder"
          ],
          "description": "Content type of the parent, or null if there is no parent."
         }
        },
        "position": {
         "format": "int32",
         "type": "integer",
         "nullable": true,
         "description": "Position of child page within the given parent page tree."
        },
        "authorId": {
         "type": "string",
         "description": "The account ID of the user who created this page originally."
        },
        "ownerId": {
         "type": "string",
         "nullable": true,
         "description": "The account ID of the user who owns this page."
        },
        "lastOwnerId": {
         "type": "string",
         "nullable": true,
         "description": "The account ID of the user who owned this page previously, or null if there is no previous owner."
        },
        "createdAt": {
         "type": "string",
         "format": "date-time",
         "description": "Date and time when the page was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
        },
        "version": {
         "<Version>": {
          "type": "object",
          "properties": {
           "createdAt": {
            "type": "string",
            "format": "date-time",
            "description": "Date and time when the version was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
           },
           "message": {
            "type": "string",
            "description": "Message associated with the current version."
           },
           "number": {
            "format": "int32",
            "type": "integer",
            "description": "The version number."
           },
           "minorEdit": {
            "type": "boolean",
            "description": "Describes if this version is a minor version. Email notifications and activity stream updates are not created for minor versions."
           },
           "authorId": {
            "type": "string",
            "description": "The account ID of the user who created this version."
           }
          }
         }
        },
        "body": {
         "<BodySingle>": {
          "type": "object",
          "description": "Contains fields for each representation type requested.",
          "properties": {
           "storage": {
            "<BodyType>": {
             "type": "object",
             "properties": {
              "representation": {
               "type": "string",
               "description": "Type of content representation used for the value field."
              },
              "value": {
               "type": "string",
               "description": "Body of the content, in the format found in the representation field."
              }
             }
            }
           },
           "atlas_doc_format": {
            "<BodyType>": {
             "type": "object",
             "properties": {
              "representation": {
               "type": "string",
               "description": "Type of content representation used for the value field."
              },
              "value": {
               "type": "string",
               "description": "Body of the content, in the format found in the representation field."
              }
             }
            }
           },
           "view": {
            "<BodyType>": {
             "type": "object",
             "properties": {
              "representation": {
               "type": "string",
               "description": "Type of content representation used for the value field."
              },
              "value": {
               "type": "string",
               "description": "Body of the content, in the format found in the representation field."
              }
             }
            }
           }
          }
   
```

## GET /pages/{id}/footer-comments  (`getPageFooterComments`)

Get footer comments for page

Returns the root footer comments of specific page. The number of results is limited by the `limit` parameter and additional results (if available)
will be available through the `next` URL present in the `Link` response header.

**[Permissions](https://confluence.atlassian.com/x/_AozKw) required**:
Permission to view the content of the page and its corresponding space.

**Parameters**

- `id` (path, required): The ID of the page for which footer comments should be returned. Schema: `{"format": "int64", "type": "integer"}`
- `body-format` (query): The content format type to be returned in the `body` field of the response. If available, the representation will be available under a response field of the same name under the `body` field. Schema: `{"<PrimaryBodyRepresentation>": {"enum": ["storage", "atlas_doc_format"], "type": "string", "description": "The primary formats a body can be represented as. A subset of BodyRepresentation. These formats are the only allowed formats in certain use cases."}}`
- `status` (query): Filter the footer comment being retrieved by its status. Schema: `{"type": "array", "items": {"type": "string", "enum": ["current", "archived", "trashed", "deleted", "historical", "draft"]}}`
- `sort` (query): Used to sort the result by a particular field. Schema: `{"<CommentSortOrder>": {"enum": ["created-date", "-created-date", "modified-date", "-modified-date"], "type": "string", "description": "The sort fields for comments. The default sort direction is ascending. To sort in descending order, append a `-` character before the sort field. For example, `fiel`
- `cursor` (query): Used for pagination, this opaque cursor will be returned in the `next` URL in the `Link` response header. Use the relative URL in the `Link` header to retrieve the `next` set of results. Schema: `{"type": "string"}`
- `limit` (query): Maximum number of footer comments per result to return. If more results exist, use the `Link` header to retrieve a relative URL that will return the next set of results. Schema: `{"format": "int32", "default": 25, "minimum": 1, "maximum": 250, "type": "integer"}`

**Success response**

```json
{
 "description": "Returned if the requested footer comments are returned.",
 "content": {
  "application/json": {
   "schema": {
    "title": "MultiEntityResult<PageCommentModel>",
    "type": "object",
    "properties": {
     "results": {
      "type": "array",
      "items": {
       "<PageCommentModel>": {
        "type": "object",
        "properties": {
         "id": {
          "type": "string",
          "description": "ID of the comment."
         },
         "status": {
          "<ContentStatus>": {
           "enum": [
            "current",
            "draft",
            "archived",
            "historical",
            "trashed",
            "deleted",
            "any"
           ],
           "type": "string",
           "description": "The status of the content."
          }
         },
         "title": {
          "type": "string",
          "description": "Title of the comment."
         },
         "pageId": {
          "type": "string",
          "description": "ID of the page the comment is in."
         },
         "version": {
          "<Version>": {
           "type": "object",
           "properties": {
            "createdAt": {
             "type": "string",
             "format": "date-time",
             "description": "Date and time when the version was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
            },
            "message": {
             "type": "string",
             "description": "Message associated with the current version."
            },
            "number": {
             "format": "int32",
             "type": "integer",
             "description": "The version number."
            },
            "minorEdit": {
             "type": "boolean",
             "description": "Describes if this version is a minor version. Email notifications and activity stream updates are not created for minor versions."
            },
            "authorId": {
             "type": "string",
             "description": "The account ID of the user who created this version."
            }
           }
          }
         },
         "body": {
          "<BodyBulk>": {
           "type": "object",
           "description": "Contains fields for each representation type requested.",
           "properties": {
            "storage": {
             "<BodyType>": {
              "type": "object",
              "properties": {
               "representation": {
                "type": "string",
                "description": "Type of content representation used for the value field."
               },
               "value": {
                "type": "string",
                "description": "Body of the content, in the format found in the representation field."
               }
              }
             }
            },
            "atlas_doc_format": {
             "<BodyType>": {
              "type": "object",
              "properties": {
               "representation": {
                "type": "string",
                "description": "Type of content representation used for the value field."
               },
               "value": {
                "type": "string",
                "description": "Body of the content, in the format found in the representation field."
               }
              }
             }
            }
           }
          }
         },
         "_links": {
          "<CommentLinks>": {
           "type": "object",
           "properties": {
            "webui": {
             "type": "string",
             "description": "Web UI link of the content."
            }
           }
          }
         }
        }
       }
      }
     },
     "_links": {
      "<MultiEntityLinks>": {
       "type": "object",
       "properties": {
        "next": {
         "type": "string",
         "description": "Used for pagination. Contains the relative URL for the next set of results, using a cursor query parameter.\nThis property will not be present if there is no additional data available."
        },
        "base": {
         "type": "string",
         "description": "Base url of the Confluence site."
        }
       }
      }
     }
    }
   }
  }
 },
 "headers": {
  "Link": {
   "schema": {
    "type": "string"
   },
   "description": "This header contains URL(s) within angle brackets and a relation description for each URL, describing how the provided URL relates to the incoming request's URL. For example, rel=\"next\" would be the URL necessary to get the next page of information. Example response header format: `Link: </wiki/api/v2/pages/<id>/footer-comments?cursor=<opaque cursor token>>; rel=\"next\", <https://site.atlassian.net/wiki>; rel=\"base\"`\n"
  }
 }
}
```

## POST /footer-comments  (`createFooterComment`)

Create footer comment

Create a footer comment.

The footer comment can be made against several locations: 
- at the top level (specifying pageId or blogPostId in the request body)
- as a reply (specifying parentCommentId in the request body)
- against an attachment (note: this is different than the comments added via the attachment properties page on the UI, which are referred to as version comments)
- against a custom content

**[Permissions](https://confluence.atlassian.com/x/_AozKw) required**:
Permission to view the content of the page or blogpost and its corresponding space. Permission to create comments in the space.

**Request body**

```json
{
 "description": "The footer comment to be created",
 "content": {
  "application/json": {
   "schema": {
    "<CreateFooterCommentModel>": {
     "type": "object",
     "properties": {
      "blogPostId": {
       "type": "string",
       "description": "ID of the containing blog post, if intending to create a top level footer comment. Do not provide if creating a reply."
      },
      "pageId": {
       "type": "string",
       "description": "ID of the containing page, if intending to create a top level footer comment. Do not provide if creating a reply."
      },
      "parentCommentId": {
       "type": "string",
       "description": "ID of the parent comment, if intending to create a reply. Do not provide if creating a top level comment."
      },
      "attachmentId": {
       "type": "string",
       "description": "ID of the attachment, if intending to create a comment against an attachment."
      },
      "customContentId": {
       "type": "string",
       "description": "ID of the custom content, if intending to create a comment against a custom content."
      },
      "body": {
       "oneOf": [
        {
         "<CommentBodyWrite>": {
          "type": "object",
          "properties": {
           "representation": {
            "enum": [
             "storage",
             "atlas_doc_format",
             "wiki"
            ],
            "type": "string",
            "description": "Type of content representation used for the value field."
           },
           "value": {
            "type": "string",
            "description": "Body of the comment, in the format found in the representation field."
           }
          }
         }
        },
        {
         "<CommentNestedBodyWrite>": {
          "type": "object",
          "description": "Body of the comment. Only one body format should be specified as the property\nfor this object, e.g. `storage`.",
          "properties": {
           "storage": {
            "<CommentBodyWrite>": {
             "type": "object",
             "properties": {
              "representation": {
               "enum": [
                "storage",
                "atlas_doc_format",
                "wiki"
               ],
               "type": "string",
               "description": "Type of content representation used for the value field."
              },
              "value": {
               "type": "string",
               "description": "Body of the comment, in the format found in the representation field."
              }
             }
            }
           },
           "atlas_doc_format": {
            "<CommentBodyWrite>": {
             "type": "object",
             "properties": {
              "representation": {
               "enum": [
                "storage",
                "atlas_doc_format",
                "wiki"
               ],
               "type": "string",
               "description": "Type of content representation used for the value field."
              },
              "value": {
               "type": "string",
               "description": "Body of the comment, in the format found in the representation field."
              }
             }
            }
           },
           "wiki": {
            "<CommentBodyWrite>": {
             "type": "object",
             "properties": {
              "representation": {
               "enum": [
                "storage",
                "atlas_doc_format",
                "wiki"
               ],
               "type": "string",
               "description": "Type of content representation used for the value field."
              },
              "value": {
               "type": "string",
               "description": "Body of the comment, in the format found in the representation field."
              }
             }
            }
           }
          }
         }
        }
       ]
      }
     }
    }
   }
  }
 },
 "required": true
}
```

**Success response**

```json
{
 "description": "Returned if the footer comment is created.",
 "content": {
  "application/json": {
   "schema": {
    "allOf": [
     {
      "<FooterCommentModel>": {
       "type": "object",
       "properties": {
        "id": {
         "type": "string",
         "description": "ID of the comment."
        },
        "status": {
         "<ContentStatus>": {
          "enum": [
           "current",
           "draft",
           "archived",
           "historical",
           "trashed",
           "deleted",
           "any"
          ],
          "type": "string",
          "description": "The status of the content."
         }
        },
        "title": {
         "type": "string",
         "description": "Title of the comment."
        },
        "blogPostId": {
         "type": "string",
         "description": "ID of the blog post containing the comment if the comment is on a blog post."
        },
        "pageId": {
         "type": "string",
         "description": "ID of the page containing the comment if the comment is on a page."
        },
        "attachmentId": {
         "type": "string",
         "description": "ID of the attachment containing the comment if the comment is on an attachment."
        },
        "customContentId": {
         "type": "string",
         "description": "ID of the custom content containing the comment if the comment is on a custom content."
        },
        "parentCommentId": {
         "type": "string",
         "description": "ID of the parent comment if the comment is a reply."
        },
        "version": {
         "<Version>": {
          "type": "object",
          "properties": {
           "createdAt": {
            "type": "string",
            "format": "date-time",
            "description": "Date and time when the version was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
           },
           "message": {
            "type": "string",
            "description": "Message associated with the current version."
           },
           "number": {
            "format": "int32",
            "type": "integer",
            "description": "The version number."
           },
           "minorEdit": {
            "type": "boolean",
            "description": "Describes if this version is a minor version. Email notifications and activity stream updates are not created for minor versions."
           },
           "authorId": {
            "type": "string",
            "description": "The account ID of the user who created this version."
           }
          }
         }
        },
        "properties": {
         "type": "object",
         "properties": {
          "results": {
           "type": "array",
           "items": {
            "<ContentProperty>": {
             "type": "object",
             "properties": {
              "id": {
               "type": "string",
               "description": "ID of the property"
              },
              "key": {
               "type": "string",
               "description": "Key of the property"
              },
              "value": {
               "description": "Value of the property. Must be a valid JSON value."
              },
              "version": {
               "<Version>": {
                "type": "object",
                "properties": {
                 "createdAt": {
                  "type": "string",
                  "format": "date-time",
                  "description": "Date and time when the version was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
                 },
                 "message": {
                  "type": "string",
                  "description": "Message associated with the current version."
                 },
                 "number": {
                  "format": "int32",
                  "type": "integer",
                  "description": "The version number."
                 },
                 "minorEdit": {
                  "type": "boolean",
                  "description": "Describes if this version is a minor version. Email notifications and activity stream updates are not created for minor versions."
                 },
                 "authorId": {
                  "type": "string",
                  "description": "The account ID of the user who created this version."
                 }
                }
               }
              }
             }
            }
           }
          },
          "meta": {
           "<OptionalFieldMeta>": {
            "type": "object",
            "properties": {
             "hasMore": {
              "type": "boolean",
              "description": "Indicates if there are more available results that can be fetched."
             },
             "cursor": {
              "type": "string",
              "description": "A token that can be used in the query parameter of the endpoint returned in the `_links` property to retrieve the next set of results."
             }
            }
  
```

## GET /pages  (`getPages`)

Get pages

Returns all pages. The number of results is limited by the `limit` parameter and additional results (if available)
will be available through the `next` URL present in the `Link` response header.

**[Permissions](https://confluence.atlassian.com/x/_AozKw) required**:
Permission to access the Confluence site ('Can use' global permission).
Only pages that the user has permission to view will be returned.

**Parameters**

- `id` (query): Filter the results based on page ids. Multiple page ids can be specified as a comma-separated list. Schema: `{"type": "array", "maxItems": 250, "items": {"type": "integer", "format": "int64"}}`
- `space-id` (query): Filter the results based on space ids. Multiple space ids can be specified as a comma-separated list. Schema: `{"type": "array", "maxItems": 100, "items": {"type": "integer", "format": "int64"}}`
- `sort` (query): Used to sort the result by a particular field. Schema: `{"<PageSortOrder>": {"enum": ["id", "-id", "created-date", "-created-date", "modified-date", "-modified-date", "title", "-title"], "type": "string", "description": "The sort fields for pages. The default sort direction is ascending. To sort in descending order, append a `-` character before the sort`
- `status` (query): Filter the results to pages based on their status. By default, `current` and `archived` are used. Schema: `{"type": "array", "items": {"type": "string", "enum": ["current", "archived", "deleted", "trashed"]}}`
- `title` (query): Filter the results to pages based on their title. Schema: `{"type": "string"}`
- `body-format` (query): The content format types to be returned in the `body` field of the response. If available, the representation will be available under a response field of the same name under the `body` field. Schema: `{"<PrimaryBodyRepresentation>": {"enum": ["storage", "atlas_doc_format"], "type": "string", "description": "The primary formats a body can be represented as. A subset of BodyRepresentation. These formats are the only allowed formats in certain use cases."}}`
- `subtype` (query): Filter the results to pages based on their subtype. Schema: `{"type": "string", "enum": ["live", "page"]}`
- `cursor` (query): Used for pagination, this opaque cursor will be returned in the `next` URL in the `Link` response header. Use the relative URL in the `Link` header to retrieve the `next` set of results. Schema: `{"type": "string"}`
- `limit` (query): Maximum number of pages per result to return. If more results exist, use the `Link` header to retrieve a relative URL that will return the next set of results. Schema: `{"format": "int32", "default": 25, "minimum": 1, "maximum": 250, "type": "integer"}`

**Success response**

```json
{
 "description": "Returned if the requested pages are returned.",
 "content": {
  "application/json": {
   "schema": {
    "title": "MultiEntityResult<Page>",
    "type": "object",
    "properties": {
     "results": {
      "type": "array",
      "items": {
       "<PageBulk>": {
        "type": "object",
        "properties": {
         "id": {
          "type": "string",
          "description": "ID of the page."
         },
         "status": {
          "<ContentStatus>": {
           "enum": [
            "current",
            "draft",
            "archived",
            "historical",
            "trashed",
            "deleted",
            "any"
           ],
           "type": "string",
           "description": "The status of the content."
          }
         },
         "title": {
          "type": "string",
          "description": "Title of the page."
         },
         "spaceId": {
          "type": "string",
          "description": "ID of the space the page is in."
         },
         "parentId": {
          "type": "string",
          "description": "ID of the parent page, or null if there is no parent page."
         },
         "parentType": {
          "<ParentContentType>": {
           "type": "string",
           "enum": [
            "page",
            "whiteboard",
            "database",
            "embed",
            "folder"
           ],
           "description": "Content type of the parent, or null if there is no parent."
          }
         },
         "position": {
          "format": "int32",
          "type": "integer",
          "nullable": true,
          "description": "Position of child page within the given parent page tree."
         },
         "authorId": {
          "type": "string",
          "description": "The account ID of the user who created this page originally."
         },
         "ownerId": {
          "type": "string",
          "nullable": true,
          "description": "The account ID of the user who owns this page."
         },
         "lastOwnerId": {
          "type": "string",
          "nullable": true,
          "description": "The account ID of the user who owned this page previously, or null if there is no previous owner."
         },
         "subtype": {
          "type": "string",
          "nullable": true,
          "description": "The subtype of the page."
         },
         "createdAt": {
          "type": "string",
          "format": "date-time",
          "description": "Date and time when the page was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
         },
         "version": {
          "<Version>": {
           "type": "object",
           "properties": {
            "createdAt": {
             "type": "string",
             "format": "date-time",
             "description": "Date and time when the version was created. In format \"YYYY-MM-DDTHH:mm:ss.sssZ\"."
            },
            "message": {
             "type": "string",
             "description": "Message associated with the current version."
            },
            "number": {
             "format": "int32",
             "type": "integer",
             "description": "The version number."
            },
            "minorEdit": {
             "type": "boolean",
             "description": "Describes if this version is a minor version. Email notifications and activity stream updates are not created for minor versions."
            },
            "authorId": {
             "type": "string",
             "description": "The account ID of the user who created this version."
            }
           }
          }
         },
         "body": {
          "<BodyBulk>": {
           "type": "object",
           "description": "Contains fields for each representation type requested.",
           "properties": {
            "storage": {
             "<BodyType>": {
              "type": "object",
              "properties": {
               "representation": {
                "type": "string",
                "description": "Type of content representation used for the value field."
               },
               "value": {
                "type": "string",
                "description": "Body of the content, in the format found in the representation field."
               }
              }
             }
            },
            "atlas_doc_format": {
             "<BodyType>": {
              "type": "object",
              "properties": {
               "representation": {
                "type": "string",
                "description": "Type of content representation used for the value field."
               },
               "value": {
                "type": "string",
                "description": "Body of the content, in the format found in the representation field."
               }
              }
             }
            }
           }
          }
         },
         "_links": {
          "<AbstractPageLinks>": {
           "type": "object",

```
