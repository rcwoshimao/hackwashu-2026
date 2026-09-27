import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS(function(exports) {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/visit.js
var require_visit = __commonJS(function(exports) {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function")
      return visitor(key, node, path);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path);
    return;
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS(function(exports) {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS(function(exports) {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS(function(exports) {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k of Array.from(val.keys())) {
          const v0 = val.get(k);
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            val.delete(k);
          else if (v1 !== v0)
            val.set(k, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k, v0);
          if (v1 === undefined)
            delete val[k];
          else if (v1 !== v0)
            val[k] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS(function(exports) {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v, i) => toJS(v, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res) => {
        data.res = res;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports.toJS = toJS;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS(function(exports) {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values())
          onAnchor(res, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports.NodeBase = NodeBase;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS(function(exports) {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      if (ctx?.maxAliasCount === 0)
        throw new ReferenceError("Alias resolution is disabled");
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      if (found && ctx) {
        const { anchors, doc, maxAliasCount } = ctx;
        let data = anchors.get(found);
        if (!data) {
          toJS.toJS(found, null, ctx);
          data = anchors.get(found);
        }
        if (data?.res === undefined) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, found, anchors);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const source = this.resolve(ctx.doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      return ctx.anchors.get(source).res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors && source && anchors.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors);
        if (c > count)
          count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors);
      const vc = getAliasCount(doc, node.value, anchors);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS(function(exports) {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS(function(exports) {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node = new Scalar.Scalar(value);
        if (ref)
          ref.node = node;
        return node;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS(function(exports) {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v = value;
    for (let i = path.length - 1;i >= 0; --i) {
      const k = path[i];
      if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
        const a = [];
        a[k] = v;
        v = a;
      } else {
        v = new Map([[k, v]]);
      }
    }
    return createNode.createNode(v, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path, value) {
      if (isEmptyPath(path))
        this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS(function(exports) {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS(function(exports) {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j])
              return text;
            folds.push(j);
            escapedFolds[j] = true;
            end = j + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i = 0;i < folds.length; ++i) {
      const fold = folds[i];
      const end = folds[i + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
      qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs = doubleQuotedString;
      else
        qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t);
      if (res === null)
        throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS(function(exports) {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trailingComma: false,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0)
        return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? `
` : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === `
` && valueComment)
          ws = `

`;
      } else {
        ws += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws = "";
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports.stringifyPair = stringifyPair;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/log.js
var require_log = __commonJS(function(exports) {
  var node_process = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports.debug = debug;
  exports.warn = warn;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
      for (const it of source.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(source))
      for (const it of source)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS(function(exports) {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS(function(exports) {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k = createNode.createNode(key, undefined, ctx);
    const v = createNode.createNode(value, undefined, ctx);
    return new Pair(k, v);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports.Pair = Pair;
  exports.createPair = createPair;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS(function(exports) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str = stringify.stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      if (chompKeep && comment)
        chompKeep = false;
      lines.push(blockItemPrefix + str);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
      if (i < items.length - 1) {
        str += ",";
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
        }
        if (reqNewline) {
          str += ",";
        }
      }
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS(function(exports) {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS(function(exports) {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map, onError) {
      if (!identity.isMap(map))
        onError("Expected a mapping for this tag");
      return map;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports.map = map;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS(function(exports) {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS(function(exports) {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq, onError) {
      if (!identity.isSeq(seq))
        onError("Expected a sequence for this tag");
      return seq;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports.seq = seq;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS(function(exports) {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports.string = string;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports.nullTag = nullTag;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports.boolTag = boolTag;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS(function(exports) {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d = minFractionDigits - (n.length - i - 1);
      while (d-- > 0)
        n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports.schema = schema;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports.schema = schema;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS(function(exports) {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o = 0;i < n; ++i, o += lineWidth) {
          lines[i] = str.substr(o, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports.binary = binary;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs = new YAMLSeq.YAMLSeq(schema);
    pairs.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS(function(exports) {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_, ctx) {
      if (!ctx)
        return super.toJSON(_);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap = new this;
      omap.items = pairs$1.items;
      return omap;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0")
          node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n = BigInt(str);
      return sign === "-" ? BigInt(-1) * n : n;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_, ctx) {
      return super.toJSON(_, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set.items.push(Pair.createPair(value, null, ctx));
        }
      return set;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d = parseSexagesimal(tz, false);
        if (Math.abs(d) < 30)
          d *= 60;
        date -= 60000 * d;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports.schema = schema;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags.includes(tagObj))
        tags.push(tagObj);
      return tags;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS(function(exports) {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports.Schema = Schema;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS(function(exports) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else {
          lines.push(`... ${cs}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports.stringifyDocument = stringifyDocument;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS(function(exports) {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k = this.createNode(key, null, options);
      const v = this.createNode(value, null, options);
      return new Pair.Pair(k, v);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path) {
      if (Collection.isEmptyPath(path))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res } of ctx.anchors.values())
          onAnchor(res, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/errors.js
var require_errors = __commonJS(function(exports) {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "…" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "…";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `…
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS(function(exports) {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports.resolveProps = resolveProps;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS(function(exports) {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st of key.end)
            if (st.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start)
            if (st.type === "newline")
              return true;
          if (it.sep) {
            for (const st of it.sep)
              if (st.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS(function(exports) {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS(function(exports) {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS(function(exports) {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS(function(exports) {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS(function(exports) {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports.resolveEnd = resolveEnd;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found)
                  break;
                if (st.type === "newline") {
                  onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce, ...ee] = fc.end;
    let cePos = offset;
    if (ce?.source === expectedEnd)
      cePos = ce.offset + ce.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce && ce.source.length !== 1)
        ee.unshift(ce);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end = start + header.length;
      if (scalar.source)
        end += scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts = token.source;
          if (ts && typeof ts === "string")
            length += ts.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m = first.match(/^( *)/);
    const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return unfoldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function unfoldLines(source) {
    const line = /(.*?)\r?\n/sy;
    let match = line.exec(source);
    if (!match)
      return source;
    let trimEnd, trimBoth;
    try {
      trimEnd = new RegExp("(?<![ \t])[ \t]+$");
      trimBoth = new RegExp("^[ \t]+|(?<![ \t])[ \t]+$", "g");
    } catch {
      trimEnd = /[ \t]+$/;
      trimBoth = /^[ \t]+|[ \t]+$/g;
    }
    let res = match[1].replace(trimEnd, "");
    let sep = " ";
    let pos = line.lastIndex;
    while (match = line.exec(source)) {
      const lm = match[1].replace(trimBoth, "");
      if (lm === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + lm;
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = next === "x" ? 2 : next === "u" ? 4 : 8;
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "",
    _: " ",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
      return String.fromCodePoint(code);
    } catch {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
      return kt;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag) => (tag.default === true || atKey && tag.default === "key") && tag.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag) => tag.default && tag.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts = directives.tagString(tag.tag);
        const cs = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts} or ${cs}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS(function(exports) {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS(function(exports) {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          onError(token, "RESOURCE_EXHAUSTION", message);
        }
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        isSrcToken = false;
      }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
      alias.comment = re.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS(function(exports) {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
      doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS(function(exports) {
  var node_process = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        for (let i = 0;i < this.errors.length; ++i)
          doc.errors.push(this.errors[i]);
        for (let i = 0;i < this.warnings.length; ++i)
          doc.warnings.push(this.warnings[i]);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports.Composer = Composer;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS(function(exports) {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he = source.indexOf(`
`);
        const head = source.substring(0, he);
        const body = source.substring(he + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he = source.indexOf(`
`);
    const head = source.substring(0, he);
    const body = source.substring(he + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS(function(exports) {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st of token.end)
          res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start)
      res += st.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st of sep)
        res += st.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS(function(exports) {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports.visit = visit;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS(function(exports) {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS(function(exports) {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs - 1;
            break;
          } else {
            cs = line.indexOf("#", cs + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return "block-start";
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = qb.indexOf(`
`, cs);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i = this.pos;ch = this.buffer[i]; ++i) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i = nl - 1;
          let ch = this.buffer[i];
          if (ch === "\r")
            ch = this.buffer[--i];
          const lastChar = i;
          while (ch === " ")
            ch = this.buffer[--i];
          if (ch === `
` && i >= this.pos && i + 1 + indent > lastChar)
            nl = i;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs = this.continueScalar(i + 1);
            if (cs === -1)
              break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      let n = 0;
      loop:
        while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            case "?":
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
      return n;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports.Lexer = Lexer;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS(function(exports) {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports.LineCounter = LineCounter;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS(function(exports) {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function arrayPushArray(target, source) {
    if (source.length < 1e5)
      Array.prototype.push.apply(target, source);
    else
      for (let i = 0;i < source.length; ++i)
        target.push(source[i]);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              arrayPushArray(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            arrayPushArray(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs);
            } else {
              Object.assign(it, { key: fs, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs, sep: [] });
            else if (it.sep)
              this.stack.push(fs);
            else
              Object.assign(it, { key: fs, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports.Parser = Parser;
});

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS(function(exports) {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});

// node_modules/.bun/@mozilla+readability@0.6.0/node_modules/@mozilla/readability/Readability.js
var require_Readability = __commonJS(function(exports, module) {
  function Readability(doc, options) {
    if (options && options.documentElement) {
      doc = options;
      options = arguments[2];
    } else if (!doc || !doc.documentElement) {
      throw new Error("First argument to Readability constructor should be a document object.");
    }
    options = options || {};
    this._doc = doc;
    this._docJSDOMParser = this._doc.firstChild.__JSDOMParser__;
    this._articleTitle = null;
    this._articleByline = null;
    this._articleDir = null;
    this._articleSiteName = null;
    this._attempts = [];
    this._metadata = {};
    this._debug = !!options.debug;
    this._maxElemsToParse = options.maxElemsToParse || this.DEFAULT_MAX_ELEMS_TO_PARSE;
    this._nbTopCandidates = options.nbTopCandidates || this.DEFAULT_N_TOP_CANDIDATES;
    this._charThreshold = options.charThreshold || this.DEFAULT_CHAR_THRESHOLD;
    this._classesToPreserve = this.CLASSES_TO_PRESERVE.concat(options.classesToPreserve || []);
    this._keepClasses = !!options.keepClasses;
    this._serializer = options.serializer || function(el) {
      return el.innerHTML;
    };
    this._disableJSONLD = !!options.disableJSONLD;
    this._allowedVideoRegex = options.allowedVideoRegex || this.REGEXPS.videos;
    this._linkDensityModifier = options.linkDensityModifier || 0;
    this._flags = this.FLAG_STRIP_UNLIKELYS | this.FLAG_WEIGHT_CLASSES | this.FLAG_CLEAN_CONDITIONALLY;
    if (this._debug) {
      let logNode = function(node) {
        if (node.nodeType == node.TEXT_NODE) {
          return `${node.nodeName} ("${node.textContent}")`;
        }
        let attrPairs = Array.from(node.attributes || [], function(attr) {
          return `${attr.name}="${attr.value}"`;
        }).join(" ");
        return `<${node.localName} ${attrPairs}>`;
      };
      this.log = function() {
        if (typeof console !== "undefined") {
          let args = Array.from(arguments, (arg) => {
            if (arg && arg.nodeType == this.ELEMENT_NODE) {
              return logNode(arg);
            }
            return arg;
          });
          args.unshift("Reader: (Readability)");
          console.log(...args);
        } else if (typeof dump !== "undefined") {
          var msg = Array.prototype.map.call(arguments, function(x) {
            return x && x.nodeName ? logNode(x) : x;
          }).join(" ");
          dump("Reader: (Readability) " + msg + `
`);
        }
      };
    } else {
      this.log = function() {};
    }
  }
  Readability.prototype = {
    FLAG_STRIP_UNLIKELYS: 1,
    FLAG_WEIGHT_CLASSES: 2,
    FLAG_CLEAN_CONDITIONALLY: 4,
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    DEFAULT_MAX_ELEMS_TO_PARSE: 0,
    DEFAULT_N_TOP_CANDIDATES: 5,
    DEFAULT_TAGS_TO_SCORE: "section,h2,h3,h4,h5,h6,p,td,pre".toUpperCase().split(","),
    DEFAULT_CHAR_THRESHOLD: 500,
    REGEXPS: {
      unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
      okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i,
      positive: /article|body|content|entry|hentry|h-entry|main|page|pagination|post|text|blog|story/i,
      negative: /-ad-|hidden|^hid$| hid$| hid |^hid |banner|combx|comment|com-|contact|footer|gdpr|masthead|media|meta|outbrain|promo|related|scroll|share|shoutbox|sidebar|skyscraper|sponsor|shopping|tags|widget/i,
      extraneous: /print|archive|comment|discuss|e[\-]?mail|share|reply|all|login|sign|single|utility/i,
      byline: /byline|author|dateline|writtenby|p-author/i,
      replaceFonts: /<(\/?)font[^>]*>/gi,
      normalize: /\s{2,}/g,
      videos: /\/\/(www\.)?((dailymotion|youtube|youtube-nocookie|player\.vimeo|v\.qq)\.com|(archive|upload\.wikimedia)\.org|player\.twitch\.tv)/i,
      shareElements: /(\b|_)(share|sharedaddy)(\b|_)/i,
      nextLink: /(next|weiter|continue|>([^\|]|$)|»([^\|]|$))/i,
      prevLink: /(prev|earl|old|new|<|«)/i,
      tokenize: /\W+/g,
      whitespace: /^\s*$/,
      hasContent: /\S$/,
      hashUrl: /^#.+/,
      srcsetUrl: /(\S+)(\s+[\d.]+[xw])?(\s*(?:,|$))/g,
      b64DataUrl: /^data:\s*([^\s;,]+)\s*;\s*base64\s*,/i,
      commas: /\u002C|\u060C|\uFE50|\uFE10|\uFE11|\u2E41|\u2E34|\u2E32|\uFF0C/g,
      jsonLdArticleTypes: /^Article|AdvertiserContentArticle|NewsArticle|AnalysisNewsArticle|AskPublicNewsArticle|BackgroundNewsArticle|OpinionNewsArticle|ReportageNewsArticle|ReviewNewsArticle|Report|SatiricalArticle|ScholarlyArticle|MedicalScholarlyArticle|SocialMediaPosting|BlogPosting|LiveBlogPosting|DiscussionForumPosting|TechArticle|APIReference$/,
      adWords: /^(ad(vertising|vertisement)?|pub(licité)?|werb(ung)?|广告|Реклама|Anuncio)$/iu,
      loadingWords: /^((loading|正在加载|Загрузка|chargement|cargando)(…|\.\.\.)?)$/iu
    },
    UNLIKELY_ROLES: [
      "menu",
      "menubar",
      "complementary",
      "navigation",
      "alert",
      "alertdialog",
      "dialog"
    ],
    DIV_TO_P_ELEMS: new Set([
      "BLOCKQUOTE",
      "DL",
      "DIV",
      "IMG",
      "OL",
      "P",
      "PRE",
      "TABLE",
      "UL"
    ]),
    ALTER_TO_DIV_EXCEPTIONS: ["DIV", "ARTICLE", "SECTION", "P", "OL", "UL"],
    PRESENTATIONAL_ATTRIBUTES: [
      "align",
      "background",
      "bgcolor",
      "border",
      "cellpadding",
      "cellspacing",
      "frame",
      "hspace",
      "rules",
      "style",
      "valign",
      "vspace"
    ],
    DEPRECATED_SIZE_ATTRIBUTE_ELEMS: ["TABLE", "TH", "TD", "HR", "PRE"],
    PHRASING_ELEMS: [
      "ABBR",
      "AUDIO",
      "B",
      "BDO",
      "BR",
      "BUTTON",
      "CITE",
      "CODE",
      "DATA",
      "DATALIST",
      "DFN",
      "EM",
      "EMBED",
      "I",
      "IMG",
      "INPUT",
      "KBD",
      "LABEL",
      "MARK",
      "MATH",
      "METER",
      "NOSCRIPT",
      "OBJECT",
      "OUTPUT",
      "PROGRESS",
      "Q",
      "RUBY",
      "SAMP",
      "SCRIPT",
      "SELECT",
      "SMALL",
      "SPAN",
      "STRONG",
      "SUB",
      "SUP",
      "TEXTAREA",
      "TIME",
      "VAR",
      "WBR"
    ],
    CLASSES_TO_PRESERVE: ["page"],
    HTML_ESCAPE_MAP: {
      lt: "<",
      gt: ">",
      amp: "&",
      quot: '"',
      apos: "'"
    },
    _postProcessContent(articleContent) {
      this._fixRelativeUris(articleContent);
      this._simplifyNestedElements(articleContent);
      if (!this._keepClasses) {
        this._cleanClasses(articleContent);
      }
    },
    _removeNodes(nodeList, filterFn) {
      if (this._docJSDOMParser && nodeList._isLiveNodeList) {
        throw new Error("Do not pass live node lists to _removeNodes");
      }
      for (var i = nodeList.length - 1;i >= 0; i--) {
        var node = nodeList[i];
        var parentNode = node.parentNode;
        if (parentNode) {
          if (!filterFn || filterFn.call(this, node, i, nodeList)) {
            parentNode.removeChild(node);
          }
        }
      }
    },
    _replaceNodeTags(nodeList, newTagName) {
      if (this._docJSDOMParser && nodeList._isLiveNodeList) {
        throw new Error("Do not pass live node lists to _replaceNodeTags");
      }
      for (const node of nodeList) {
        this._setNodeTag(node, newTagName);
      }
    },
    _forEachNode(nodeList, fn) {
      Array.prototype.forEach.call(nodeList, fn, this);
    },
    _findNode(nodeList, fn) {
      return Array.prototype.find.call(nodeList, fn, this);
    },
    _someNode(nodeList, fn) {
      return Array.prototype.some.call(nodeList, fn, this);
    },
    _everyNode(nodeList, fn) {
      return Array.prototype.every.call(nodeList, fn, this);
    },
    _getAllNodesWithTag(node, tagNames) {
      if (node.querySelectorAll) {
        return node.querySelectorAll(tagNames.join(","));
      }
      return [].concat.apply([], tagNames.map(function(tag) {
        var collection = node.getElementsByTagName(tag);
        return Array.isArray(collection) ? collection : Array.from(collection);
      }));
    },
    _cleanClasses(node) {
      var classesToPreserve = this._classesToPreserve;
      var className = (node.getAttribute("class") || "").split(/\s+/).filter((cls) => classesToPreserve.includes(cls)).join(" ");
      if (className) {
        node.setAttribute("class", className);
      } else {
        node.removeAttribute("class");
      }
      for (node = node.firstElementChild;node; node = node.nextElementSibling) {
        this._cleanClasses(node);
      }
    },
    _isUrl(str) {
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    },
    _fixRelativeUris(articleContent) {
      var baseURI = this._doc.baseURI;
      var documentURI = this._doc.documentURI;
      function toAbsoluteURI(uri) {
        if (baseURI == documentURI && uri.charAt(0) == "#") {
          return uri;
        }
        try {
          return new URL(uri, baseURI).href;
        } catch (ex) {}
        return uri;
      }
      var links = this._getAllNodesWithTag(articleContent, ["a"]);
      this._forEachNode(links, function(link) {
        var href = link.getAttribute("href");
        if (href) {
          if (href.indexOf("javascript:") === 0) {
            if (link.childNodes.length === 1 && link.childNodes[0].nodeType === this.TEXT_NODE) {
              var text = this._doc.createTextNode(link.textContent);
              link.parentNode.replaceChild(text, link);
            } else {
              var container = this._doc.createElement("span");
              while (link.firstChild) {
                container.appendChild(link.firstChild);
              }
              link.parentNode.replaceChild(container, link);
            }
          } else {
            link.setAttribute("href", toAbsoluteURI(href));
          }
        }
      });
      var medias = this._getAllNodesWithTag(articleContent, [
        "img",
        "picture",
        "figure",
        "video",
        "audio",
        "source"
      ]);
      this._forEachNode(medias, function(media) {
        var src = media.getAttribute("src");
        var poster = media.getAttribute("poster");
        var srcset = media.getAttribute("srcset");
        if (src) {
          media.setAttribute("src", toAbsoluteURI(src));
        }
        if (poster) {
          media.setAttribute("poster", toAbsoluteURI(poster));
        }
        if (srcset) {
          var newSrcset = srcset.replace(this.REGEXPS.srcsetUrl, function(_, p1, p2, p3) {
            return toAbsoluteURI(p1) + (p2 || "") + p3;
          });
          media.setAttribute("srcset", newSrcset);
        }
      });
    },
    _simplifyNestedElements(articleContent) {
      var node = articleContent;
      while (node) {
        if (node.parentNode && ["DIV", "SECTION"].includes(node.tagName) && !(node.id && node.id.startsWith("readability"))) {
          if (this._isElementWithoutContent(node)) {
            node = this._removeAndGetNext(node);
            continue;
          } else if (this._hasSingleTagInsideElement(node, "DIV") || this._hasSingleTagInsideElement(node, "SECTION")) {
            var child = node.children[0];
            for (var i = 0;i < node.attributes.length; i++) {
              child.setAttributeNode(node.attributes[i].cloneNode());
            }
            node.parentNode.replaceChild(child, node);
            node = child;
            continue;
          }
        }
        node = this._getNextNode(node);
      }
    },
    _getArticleTitle() {
      var doc = this._doc;
      var curTitle = "";
      var origTitle = "";
      try {
        curTitle = origTitle = doc.title.trim();
        if (typeof curTitle !== "string") {
          curTitle = origTitle = this._getInnerText(doc.getElementsByTagName("title")[0]);
        }
      } catch (e) {}
      var titleHadHierarchicalSeparators = false;
      function wordCount(str) {
        return str.split(/\s+/).length;
      }
      if (/ [\|\-\\\/>»] /.test(curTitle)) {
        titleHadHierarchicalSeparators = / [\\\/>»] /.test(curTitle);
        let allSeparators = Array.from(origTitle.matchAll(/ [\|\-\\\/>»] /gi));
        curTitle = origTitle.substring(0, allSeparators.pop().index);
        if (wordCount(curTitle) < 3) {
          curTitle = origTitle.replace(/^[^\|\-\\\/>»]*[\|\-\\\/>»]/gi, "");
        }
      } else if (curTitle.includes(": ")) {
        var headings = this._getAllNodesWithTag(doc, ["h1", "h2"]);
        var trimmedTitle = curTitle.trim();
        var match = this._someNode(headings, function(heading) {
          return heading.textContent.trim() === trimmedTitle;
        });
        if (!match) {
          curTitle = origTitle.substring(origTitle.lastIndexOf(":") + 1);
          if (wordCount(curTitle) < 3) {
            curTitle = origTitle.substring(origTitle.indexOf(":") + 1);
          } else if (wordCount(origTitle.substr(0, origTitle.indexOf(":"))) > 5) {
            curTitle = origTitle;
          }
        }
      } else if (curTitle.length > 150 || curTitle.length < 15) {
        var hOnes = doc.getElementsByTagName("h1");
        if (hOnes.length === 1) {
          curTitle = this._getInnerText(hOnes[0]);
        }
      }
      curTitle = curTitle.trim().replace(this.REGEXPS.normalize, " ");
      var curTitleWordCount = wordCount(curTitle);
      if (curTitleWordCount <= 4 && (!titleHadHierarchicalSeparators || curTitleWordCount != wordCount(origTitle.replace(/[\|\-\\\/>»]+/g, "")) - 1)) {
        curTitle = origTitle;
      }
      return curTitle;
    },
    _prepDocument() {
      var doc = this._doc;
      this._removeNodes(this._getAllNodesWithTag(doc, ["style"]));
      if (doc.body) {
        this._replaceBrs(doc.body);
      }
      this._replaceNodeTags(this._getAllNodesWithTag(doc, ["font"]), "SPAN");
    },
    _nextNode(node) {
      var next = node;
      while (next && next.nodeType != this.ELEMENT_NODE && this.REGEXPS.whitespace.test(next.textContent)) {
        next = next.nextSibling;
      }
      return next;
    },
    _replaceBrs(elem) {
      this._forEachNode(this._getAllNodesWithTag(elem, ["br"]), function(br) {
        var next = br.nextSibling;
        var replaced = false;
        while ((next = this._nextNode(next)) && next.tagName == "BR") {
          replaced = true;
          var brSibling = next.nextSibling;
          next.remove();
          next = brSibling;
        }
        if (replaced) {
          var p = this._doc.createElement("p");
          br.parentNode.replaceChild(p, br);
          next = p.nextSibling;
          while (next) {
            if (next.tagName == "BR") {
              var nextElem = this._nextNode(next.nextSibling);
              if (nextElem && nextElem.tagName == "BR") {
                break;
              }
            }
            if (!this._isPhrasingContent(next)) {
              break;
            }
            var sibling = next.nextSibling;
            p.appendChild(next);
            next = sibling;
          }
          while (p.lastChild && this._isWhitespace(p.lastChild)) {
            p.lastChild.remove();
          }
          if (p.parentNode.tagName === "P") {
            this._setNodeTag(p.parentNode, "DIV");
          }
        }
      });
    },
    _setNodeTag(node, tag) {
      this.log("_setNodeTag", node, tag);
      if (this._docJSDOMParser) {
        node.localName = tag.toLowerCase();
        node.tagName = tag.toUpperCase();
        return node;
      }
      var replacement = node.ownerDocument.createElement(tag);
      while (node.firstChild) {
        replacement.appendChild(node.firstChild);
      }
      node.parentNode.replaceChild(replacement, node);
      if (node.readability) {
        replacement.readability = node.readability;
      }
      for (var i = 0;i < node.attributes.length; i++) {
        replacement.setAttributeNode(node.attributes[i].cloneNode());
      }
      return replacement;
    },
    _prepArticle(articleContent) {
      this._cleanStyles(articleContent);
      this._markDataTables(articleContent);
      this._fixLazyImages(articleContent);
      this._cleanConditionally(articleContent, "form");
      this._cleanConditionally(articleContent, "fieldset");
      this._clean(articleContent, "object");
      this._clean(articleContent, "embed");
      this._clean(articleContent, "footer");
      this._clean(articleContent, "link");
      this._clean(articleContent, "aside");
      var shareElementThreshold = this.DEFAULT_CHAR_THRESHOLD;
      this._forEachNode(articleContent.children, function(topCandidate) {
        this._cleanMatchedNodes(topCandidate, function(node, matchString) {
          return this.REGEXPS.shareElements.test(matchString) && node.textContent.length < shareElementThreshold;
        });
      });
      this._clean(articleContent, "iframe");
      this._clean(articleContent, "input");
      this._clean(articleContent, "textarea");
      this._clean(articleContent, "select");
      this._clean(articleContent, "button");
      this._cleanHeaders(articleContent);
      this._cleanConditionally(articleContent, "table");
      this._cleanConditionally(articleContent, "ul");
      this._cleanConditionally(articleContent, "div");
      this._replaceNodeTags(this._getAllNodesWithTag(articleContent, ["h1"]), "h2");
      this._removeNodes(this._getAllNodesWithTag(articleContent, ["p"]), function(paragraph) {
        var contentElementCount = this._getAllNodesWithTag(paragraph, [
          "img",
          "embed",
          "object",
          "iframe"
        ]).length;
        return contentElementCount === 0 && !this._getInnerText(paragraph, false);
      });
      this._forEachNode(this._getAllNodesWithTag(articleContent, ["br"]), function(br) {
        var next = this._nextNode(br.nextSibling);
        if (next && next.tagName == "P") {
          br.remove();
        }
      });
      this._forEachNode(this._getAllNodesWithTag(articleContent, ["table"]), function(table) {
        var tbody = this._hasSingleTagInsideElement(table, "TBODY") ? table.firstElementChild : table;
        if (this._hasSingleTagInsideElement(tbody, "TR")) {
          var row = tbody.firstElementChild;
          if (this._hasSingleTagInsideElement(row, "TD")) {
            var cell = row.firstElementChild;
            cell = this._setNodeTag(cell, this._everyNode(cell.childNodes, this._isPhrasingContent) ? "P" : "DIV");
            table.parentNode.replaceChild(cell, table);
          }
        }
      });
    },
    _initializeNode(node) {
      node.readability = { contentScore: 0 };
      switch (node.tagName) {
        case "DIV":
          node.readability.contentScore += 5;
          break;
        case "PRE":
        case "TD":
        case "BLOCKQUOTE":
          node.readability.contentScore += 3;
          break;
        case "ADDRESS":
        case "OL":
        case "UL":
        case "DL":
        case "DD":
        case "DT":
        case "LI":
        case "FORM":
          node.readability.contentScore -= 3;
          break;
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
        case "TH":
          node.readability.contentScore -= 5;
          break;
      }
      node.readability.contentScore += this._getClassWeight(node);
    },
    _removeAndGetNext(node) {
      var nextNode = this._getNextNode(node, true);
      node.remove();
      return nextNode;
    },
    _getNextNode(node, ignoreSelfAndKids) {
      if (!ignoreSelfAndKids && node.firstElementChild) {
        return node.firstElementChild;
      }
      if (node.nextElementSibling) {
        return node.nextElementSibling;
      }
      do {
        node = node.parentNode;
      } while (node && !node.nextElementSibling);
      return node && node.nextElementSibling;
    },
    _textSimilarity(textA, textB) {
      var tokensA = textA.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
      var tokensB = textB.toLowerCase().split(this.REGEXPS.tokenize).filter(Boolean);
      if (!tokensA.length || !tokensB.length) {
        return 0;
      }
      var uniqTokensB = tokensB.filter((token) => !tokensA.includes(token));
      var distanceB = uniqTokensB.join(" ").length / tokensB.join(" ").length;
      return 1 - distanceB;
    },
    _isValidByline(node, matchString) {
      var rel = node.getAttribute("rel");
      var itemprop = node.getAttribute("itemprop");
      var bylineLength = node.textContent.trim().length;
      return (rel === "author" || itemprop && itemprop.includes("author") || this.REGEXPS.byline.test(matchString)) && !!bylineLength && bylineLength < 100;
    },
    _getNodeAncestors(node, maxDepth) {
      maxDepth = maxDepth || 0;
      var i = 0, ancestors = [];
      while (node.parentNode) {
        ancestors.push(node.parentNode);
        if (maxDepth && ++i === maxDepth) {
          break;
        }
        node = node.parentNode;
      }
      return ancestors;
    },
    _grabArticle(page) {
      this.log("**** grabArticle ****");
      var doc = this._doc;
      var isPaging = page !== null;
      page = page ? page : this._doc.body;
      if (!page) {
        this.log("No body found in document. Abort.");
        return null;
      }
      var pageCacheHtml = page.innerHTML;
      while (true) {
        this.log("Starting grabArticle loop");
        var stripUnlikelyCandidates = this._flagIsActive(this.FLAG_STRIP_UNLIKELYS);
        var elementsToScore = [];
        var node = this._doc.documentElement;
        let shouldRemoveTitleHeader = true;
        while (node) {
          if (node.tagName === "HTML") {
            this._articleLang = node.getAttribute("lang");
          }
          var matchString = node.className + " " + node.id;
          if (!this._isProbablyVisible(node)) {
            this.log("Removing hidden node - " + matchString);
            node = this._removeAndGetNext(node);
            continue;
          }
          if (node.getAttribute("aria-modal") == "true" && node.getAttribute("role") == "dialog") {
            node = this._removeAndGetNext(node);
            continue;
          }
          if (!this._articleByline && !this._metadata.byline && this._isValidByline(node, matchString)) {
            var endOfSearchMarkerNode = this._getNextNode(node, true);
            var next = this._getNextNode(node);
            var itemPropNameNode = null;
            while (next && next != endOfSearchMarkerNode) {
              var itemprop = next.getAttribute("itemprop");
              if (itemprop && itemprop.includes("name")) {
                itemPropNameNode = next;
                break;
              } else {
                next = this._getNextNode(next);
              }
            }
            this._articleByline = (itemPropNameNode ?? node).textContent.trim();
            node = this._removeAndGetNext(node);
            continue;
          }
          if (shouldRemoveTitleHeader && this._headerDuplicatesTitle(node)) {
            this.log("Removing header: ", node.textContent.trim(), this._articleTitle.trim());
            shouldRemoveTitleHeader = false;
            node = this._removeAndGetNext(node);
            continue;
          }
          if (stripUnlikelyCandidates) {
            if (this.REGEXPS.unlikelyCandidates.test(matchString) && !this.REGEXPS.okMaybeItsACandidate.test(matchString) && !this._hasAncestorTag(node, "table") && !this._hasAncestorTag(node, "code") && node.tagName !== "BODY" && node.tagName !== "A") {
              this.log("Removing unlikely candidate - " + matchString);
              node = this._removeAndGetNext(node);
              continue;
            }
            if (this.UNLIKELY_ROLES.includes(node.getAttribute("role"))) {
              this.log("Removing content with role " + node.getAttribute("role") + " - " + matchString);
              node = this._removeAndGetNext(node);
              continue;
            }
          }
          if ((node.tagName === "DIV" || node.tagName === "SECTION" || node.tagName === "HEADER" || node.tagName === "H1" || node.tagName === "H2" || node.tagName === "H3" || node.tagName === "H4" || node.tagName === "H5" || node.tagName === "H6") && this._isElementWithoutContent(node)) {
            node = this._removeAndGetNext(node);
            continue;
          }
          if (this.DEFAULT_TAGS_TO_SCORE.includes(node.tagName)) {
            elementsToScore.push(node);
          }
          if (node.tagName === "DIV") {
            var p = null;
            var childNode = node.firstChild;
            while (childNode) {
              var nextSibling = childNode.nextSibling;
              if (this._isPhrasingContent(childNode)) {
                if (p !== null) {
                  p.appendChild(childNode);
                } else if (!this._isWhitespace(childNode)) {
                  p = doc.createElement("p");
                  node.replaceChild(p, childNode);
                  p.appendChild(childNode);
                }
              } else if (p !== null) {
                while (p.lastChild && this._isWhitespace(p.lastChild)) {
                  p.lastChild.remove();
                }
                p = null;
              }
              childNode = nextSibling;
            }
            if (this._hasSingleTagInsideElement(node, "P") && this._getLinkDensity(node) < 0.25) {
              var newNode = node.children[0];
              node.parentNode.replaceChild(newNode, node);
              node = newNode;
              elementsToScore.push(node);
            } else if (!this._hasChildBlockElement(node)) {
              node = this._setNodeTag(node, "P");
              elementsToScore.push(node);
            }
          }
          node = this._getNextNode(node);
        }
        var candidates = [];
        this._forEachNode(elementsToScore, function(elementToScore) {
          if (!elementToScore.parentNode || typeof elementToScore.parentNode.tagName === "undefined") {
            return;
          }
          var innerText = this._getInnerText(elementToScore);
          if (innerText.length < 25) {
            return;
          }
          var ancestors = this._getNodeAncestors(elementToScore, 5);
          if (ancestors.length === 0) {
            return;
          }
          var contentScore = 0;
          contentScore += 1;
          contentScore += innerText.split(this.REGEXPS.commas).length;
          contentScore += Math.min(Math.floor(innerText.length / 100), 3);
          this._forEachNode(ancestors, function(ancestor, level) {
            if (!ancestor.tagName || !ancestor.parentNode || typeof ancestor.parentNode.tagName === "undefined") {
              return;
            }
            if (typeof ancestor.readability === "undefined") {
              this._initializeNode(ancestor);
              candidates.push(ancestor);
            }
            if (level === 0) {
              var scoreDivider = 1;
            } else if (level === 1) {
              scoreDivider = 2;
            } else {
              scoreDivider = level * 3;
            }
            ancestor.readability.contentScore += contentScore / scoreDivider;
          });
        });
        var topCandidates = [];
        for (var c = 0, cl = candidates.length;c < cl; c += 1) {
          var candidate = candidates[c];
          var candidateScore = candidate.readability.contentScore * (1 - this._getLinkDensity(candidate));
          candidate.readability.contentScore = candidateScore;
          this.log("Candidate:", candidate, "with score " + candidateScore);
          for (var t = 0;t < this._nbTopCandidates; t++) {
            var aTopCandidate = topCandidates[t];
            if (!aTopCandidate || candidateScore > aTopCandidate.readability.contentScore) {
              topCandidates.splice(t, 0, candidate);
              if (topCandidates.length > this._nbTopCandidates) {
                topCandidates.pop();
              }
              break;
            }
          }
        }
        var topCandidate = topCandidates[0] || null;
        var neededToCreateTopCandidate = false;
        var parentOfTopCandidate;
        if (topCandidate === null || topCandidate.tagName === "BODY") {
          topCandidate = doc.createElement("DIV");
          neededToCreateTopCandidate = true;
          while (page.firstChild) {
            this.log("Moving child out:", page.firstChild);
            topCandidate.appendChild(page.firstChild);
          }
          page.appendChild(topCandidate);
          this._initializeNode(topCandidate);
        } else if (topCandidate) {
          var alternativeCandidateAncestors = [];
          for (var i = 1;i < topCandidates.length; i++) {
            if (topCandidates[i].readability.contentScore / topCandidate.readability.contentScore >= 0.75) {
              alternativeCandidateAncestors.push(this._getNodeAncestors(topCandidates[i]));
            }
          }
          var MINIMUM_TOPCANDIDATES = 3;
          if (alternativeCandidateAncestors.length >= MINIMUM_TOPCANDIDATES) {
            parentOfTopCandidate = topCandidate.parentNode;
            while (parentOfTopCandidate.tagName !== "BODY") {
              var listsContainingThisAncestor = 0;
              for (var ancestorIndex = 0;ancestorIndex < alternativeCandidateAncestors.length && listsContainingThisAncestor < MINIMUM_TOPCANDIDATES; ancestorIndex++) {
                listsContainingThisAncestor += Number(alternativeCandidateAncestors[ancestorIndex].includes(parentOfTopCandidate));
              }
              if (listsContainingThisAncestor >= MINIMUM_TOPCANDIDATES) {
                topCandidate = parentOfTopCandidate;
                break;
              }
              parentOfTopCandidate = parentOfTopCandidate.parentNode;
            }
          }
          if (!topCandidate.readability) {
            this._initializeNode(topCandidate);
          }
          parentOfTopCandidate = topCandidate.parentNode;
          var lastScore = topCandidate.readability.contentScore;
          var scoreThreshold = lastScore / 3;
          while (parentOfTopCandidate.tagName !== "BODY") {
            if (!parentOfTopCandidate.readability) {
              parentOfTopCandidate = parentOfTopCandidate.parentNode;
              continue;
            }
            var parentScore = parentOfTopCandidate.readability.contentScore;
            if (parentScore < scoreThreshold) {
              break;
            }
            if (parentScore > lastScore) {
              topCandidate = parentOfTopCandidate;
              break;
            }
            lastScore = parentOfTopCandidate.readability.contentScore;
            parentOfTopCandidate = parentOfTopCandidate.parentNode;
          }
          parentOfTopCandidate = topCandidate.parentNode;
          while (parentOfTopCandidate.tagName != "BODY" && parentOfTopCandidate.children.length == 1) {
            topCandidate = parentOfTopCandidate;
            parentOfTopCandidate = topCandidate.parentNode;
          }
          if (!topCandidate.readability) {
            this._initializeNode(topCandidate);
          }
        }
        var articleContent = doc.createElement("DIV");
        if (isPaging) {
          articleContent.id = "readability-content";
        }
        var siblingScoreThreshold = Math.max(10, topCandidate.readability.contentScore * 0.2);
        parentOfTopCandidate = topCandidate.parentNode;
        var siblings = parentOfTopCandidate.children;
        for (var s = 0, sl = siblings.length;s < sl; s++) {
          var sibling = siblings[s];
          var append = false;
          this.log("Looking at sibling node:", sibling, sibling.readability ? "with score " + sibling.readability.contentScore : "");
          this.log("Sibling has score", sibling.readability ? sibling.readability.contentScore : "Unknown");
          if (sibling === topCandidate) {
            append = true;
          } else {
            var contentBonus = 0;
            if (sibling.className === topCandidate.className && topCandidate.className !== "") {
              contentBonus += topCandidate.readability.contentScore * 0.2;
            }
            if (sibling.readability && sibling.readability.contentScore + contentBonus >= siblingScoreThreshold) {
              append = true;
            } else if (sibling.nodeName === "P") {
              var linkDensity = this._getLinkDensity(sibling);
              var nodeContent = this._getInnerText(sibling);
              var nodeLength = nodeContent.length;
              if (nodeLength > 80 && linkDensity < 0.25) {
                append = true;
              } else if (nodeLength < 80 && nodeLength > 0 && linkDensity === 0 && nodeContent.search(/\.( |$)/) !== -1) {
                append = true;
              }
            }
          }
          if (append) {
            this.log("Appending node:", sibling);
            if (!this.ALTER_TO_DIV_EXCEPTIONS.includes(sibling.nodeName)) {
              this.log("Altering sibling:", sibling, "to div.");
              sibling = this._setNodeTag(sibling, "DIV");
            }
            articleContent.appendChild(sibling);
            siblings = parentOfTopCandidate.children;
            s -= 1;
            sl -= 1;
          }
        }
        if (this._debug) {
          this.log("Article content pre-prep: " + articleContent.innerHTML);
        }
        this._prepArticle(articleContent);
        if (this._debug) {
          this.log("Article content post-prep: " + articleContent.innerHTML);
        }
        if (neededToCreateTopCandidate) {
          topCandidate.id = "readability-page-1";
          topCandidate.className = "page";
        } else {
          var div = doc.createElement("DIV");
          div.id = "readability-page-1";
          div.className = "page";
          while (articleContent.firstChild) {
            div.appendChild(articleContent.firstChild);
          }
          articleContent.appendChild(div);
        }
        if (this._debug) {
          this.log("Article content after paging: " + articleContent.innerHTML);
        }
        var parseSuccessful = true;
        var textLength = this._getInnerText(articleContent, true).length;
        if (textLength < this._charThreshold) {
          parseSuccessful = false;
          page.innerHTML = pageCacheHtml;
          this._attempts.push({
            articleContent,
            textLength
          });
          if (this._flagIsActive(this.FLAG_STRIP_UNLIKELYS)) {
            this._removeFlag(this.FLAG_STRIP_UNLIKELYS);
          } else if (this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
            this._removeFlag(this.FLAG_WEIGHT_CLASSES);
          } else if (this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
            this._removeFlag(this.FLAG_CLEAN_CONDITIONALLY);
          } else {
            this._attempts.sort(function(a, b) {
              return b.textLength - a.textLength;
            });
            if (!this._attempts[0].textLength) {
              return null;
            }
            articleContent = this._attempts[0].articleContent;
            parseSuccessful = true;
          }
        }
        if (parseSuccessful) {
          var ancestors = [parentOfTopCandidate, topCandidate].concat(this._getNodeAncestors(parentOfTopCandidate));
          this._someNode(ancestors, function(ancestor) {
            if (!ancestor.tagName) {
              return false;
            }
            var articleDir = ancestor.getAttribute("dir");
            if (articleDir) {
              this._articleDir = articleDir;
              return true;
            }
            return false;
          });
          return articleContent;
        }
      }
    },
    _unescapeHtmlEntities(str) {
      if (!str) {
        return str;
      }
      var htmlEscapeMap = this.HTML_ESCAPE_MAP;
      return str.replace(/&(quot|amp|apos|lt|gt);/g, function(_, tag) {
        return htmlEscapeMap[tag];
      }).replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi, function(_, hex, numStr) {
        var num = parseInt(hex || numStr, hex ? 16 : 10);
        if (num == 0 || num > 1114111 || num >= 55296 && num <= 57343) {
          num = 65533;
        }
        return String.fromCodePoint(num);
      });
    },
    _getJSONLD(doc) {
      var scripts = this._getAllNodesWithTag(doc, ["script"]);
      var metadata;
      this._forEachNode(scripts, function(jsonLdElement) {
        if (!metadata && jsonLdElement.getAttribute("type") === "application/ld+json") {
          try {
            var content = jsonLdElement.textContent.replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "");
            var parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              parsed = parsed.find((it) => {
                return it["@type"] && it["@type"].match(this.REGEXPS.jsonLdArticleTypes);
              });
              if (!parsed) {
                return;
              }
            }
            var schemaDotOrgRegex = /^https?\:\/\/schema\.org\/?$/;
            var matches = typeof parsed["@context"] === "string" && parsed["@context"].match(schemaDotOrgRegex) || typeof parsed["@context"] === "object" && typeof parsed["@context"]["@vocab"] == "string" && parsed["@context"]["@vocab"].match(schemaDotOrgRegex);
            if (!matches) {
              return;
            }
            if (!parsed["@type"] && Array.isArray(parsed["@graph"])) {
              parsed = parsed["@graph"].find((it) => {
                return (it["@type"] || "").match(this.REGEXPS.jsonLdArticleTypes);
              });
            }
            if (!parsed || !parsed["@type"] || !parsed["@type"].match(this.REGEXPS.jsonLdArticleTypes)) {
              return;
            }
            metadata = {};
            if (typeof parsed.name === "string" && typeof parsed.headline === "string" && parsed.name !== parsed.headline) {
              var title = this._getArticleTitle();
              var nameMatches = this._textSimilarity(parsed.name, title) > 0.75;
              var headlineMatches = this._textSimilarity(parsed.headline, title) > 0.75;
              if (headlineMatches && !nameMatches) {
                metadata.title = parsed.headline;
              } else {
                metadata.title = parsed.name;
              }
            } else if (typeof parsed.name === "string") {
              metadata.title = parsed.name.trim();
            } else if (typeof parsed.headline === "string") {
              metadata.title = parsed.headline.trim();
            }
            if (parsed.author) {
              if (typeof parsed.author.name === "string") {
                metadata.byline = parsed.author.name.trim();
              } else if (Array.isArray(parsed.author) && parsed.author[0] && typeof parsed.author[0].name === "string") {
                metadata.byline = parsed.author.filter(function(author) {
                  return author && typeof author.name === "string";
                }).map(function(author) {
                  return author.name.trim();
                }).join(", ");
              }
            }
            if (typeof parsed.description === "string") {
              metadata.excerpt = parsed.description.trim();
            }
            if (parsed.publisher && typeof parsed.publisher.name === "string") {
              metadata.siteName = parsed.publisher.name.trim();
            }
            if (typeof parsed.datePublished === "string") {
              metadata.datePublished = parsed.datePublished.trim();
            }
          } catch (err) {
            this.log(err.message);
          }
        }
      });
      return metadata ? metadata : {};
    },
    _getArticleMetadata(jsonld) {
      var metadata = {};
      var values = {};
      var metaElements = this._doc.getElementsByTagName("meta");
      var propertyPattern = /\s*(article|dc|dcterm|og|twitter)\s*:\s*(author|creator|description|published_time|title|site_name)\s*/gi;
      var namePattern = /^\s*(?:(dc|dcterm|og|twitter|parsely|weibo:(article|webpage))\s*[-\.:]\s*)?(author|creator|pub-date|description|title|site_name)\s*$/i;
      this._forEachNode(metaElements, function(element) {
        var elementName = element.getAttribute("name");
        var elementProperty = element.getAttribute("property");
        var content = element.getAttribute("content");
        if (!content) {
          return;
        }
        var matches = null;
        var name = null;
        if (elementProperty) {
          matches = elementProperty.match(propertyPattern);
          if (matches) {
            name = matches[0].toLowerCase().replace(/\s/g, "");
            values[name] = content.trim();
          }
        }
        if (!matches && elementName && namePattern.test(elementName)) {
          name = elementName;
          if (content) {
            name = name.toLowerCase().replace(/\s/g, "").replace(/\./g, ":");
            values[name] = content.trim();
          }
        }
      });
      metadata.title = jsonld.title || values["dc:title"] || values["dcterm:title"] || values["og:title"] || values["weibo:article:title"] || values["weibo:webpage:title"] || values.title || values["twitter:title"] || values["parsely-title"];
      if (!metadata.title) {
        metadata.title = this._getArticleTitle();
      }
      const articleAuthor = typeof values["article:author"] === "string" && !this._isUrl(values["article:author"]) ? values["article:author"] : undefined;
      metadata.byline = jsonld.byline || values["dc:creator"] || values["dcterm:creator"] || values.author || values["parsely-author"] || articleAuthor;
      metadata.excerpt = jsonld.excerpt || values["dc:description"] || values["dcterm:description"] || values["og:description"] || values["weibo:article:description"] || values["weibo:webpage:description"] || values.description || values["twitter:description"];
      metadata.siteName = jsonld.siteName || values["og:site_name"];
      metadata.publishedTime = jsonld.datePublished || values["article:published_time"] || values["parsely-pub-date"] || null;
      metadata.title = this._unescapeHtmlEntities(metadata.title);
      metadata.byline = this._unescapeHtmlEntities(metadata.byline);
      metadata.excerpt = this._unescapeHtmlEntities(metadata.excerpt);
      metadata.siteName = this._unescapeHtmlEntities(metadata.siteName);
      metadata.publishedTime = this._unescapeHtmlEntities(metadata.publishedTime);
      return metadata;
    },
    _isSingleImage(node) {
      while (node) {
        if (node.tagName === "IMG") {
          return true;
        }
        if (node.children.length !== 1 || node.textContent.trim() !== "") {
          return false;
        }
        node = node.children[0];
      }
      return false;
    },
    _unwrapNoscriptImages(doc) {
      var imgs = Array.from(doc.getElementsByTagName("img"));
      this._forEachNode(imgs, function(img) {
        for (var i = 0;i < img.attributes.length; i++) {
          var attr = img.attributes[i];
          switch (attr.name) {
            case "src":
            case "srcset":
            case "data-src":
            case "data-srcset":
              return;
          }
          if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
            return;
          }
        }
        img.remove();
      });
      var noscripts = Array.from(doc.getElementsByTagName("noscript"));
      this._forEachNode(noscripts, function(noscript) {
        if (!this._isSingleImage(noscript)) {
          return;
        }
        var tmp = doc.createElement("div");
        tmp.innerHTML = noscript.innerHTML;
        var prevElement = noscript.previousElementSibling;
        if (prevElement && this._isSingleImage(prevElement)) {
          var prevImg = prevElement;
          if (prevImg.tagName !== "IMG") {
            prevImg = prevElement.getElementsByTagName("img")[0];
          }
          var newImg = tmp.getElementsByTagName("img")[0];
          for (var i = 0;i < prevImg.attributes.length; i++) {
            var attr = prevImg.attributes[i];
            if (attr.value === "") {
              continue;
            }
            if (attr.name === "src" || attr.name === "srcset" || /\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
              if (newImg.getAttribute(attr.name) === attr.value) {
                continue;
              }
              var attrName = attr.name;
              if (newImg.hasAttribute(attrName)) {
                attrName = "data-old-" + attrName;
              }
              newImg.setAttribute(attrName, attr.value);
            }
          }
          noscript.parentNode.replaceChild(tmp.firstElementChild, prevElement);
        }
      });
    },
    _removeScripts(doc) {
      this._removeNodes(this._getAllNodesWithTag(doc, ["script", "noscript"]));
    },
    _hasSingleTagInsideElement(element, tag) {
      if (element.children.length != 1 || element.children[0].tagName !== tag) {
        return false;
      }
      return !this._someNode(element.childNodes, function(node) {
        return node.nodeType === this.TEXT_NODE && this.REGEXPS.hasContent.test(node.textContent);
      });
    },
    _isElementWithoutContent(node) {
      return node.nodeType === this.ELEMENT_NODE && !node.textContent.trim().length && (!node.children.length || node.children.length == node.getElementsByTagName("br").length + node.getElementsByTagName("hr").length);
    },
    _hasChildBlockElement(element) {
      return this._someNode(element.childNodes, function(node) {
        return this.DIV_TO_P_ELEMS.has(node.tagName) || this._hasChildBlockElement(node);
      });
    },
    _isPhrasingContent(node) {
      return node.nodeType === this.TEXT_NODE || this.PHRASING_ELEMS.includes(node.tagName) || (node.tagName === "A" || node.tagName === "DEL" || node.tagName === "INS") && this._everyNode(node.childNodes, this._isPhrasingContent);
    },
    _isWhitespace(node) {
      return node.nodeType === this.TEXT_NODE && node.textContent.trim().length === 0 || node.nodeType === this.ELEMENT_NODE && node.tagName === "BR";
    },
    _getInnerText(e, normalizeSpaces) {
      normalizeSpaces = typeof normalizeSpaces === "undefined" ? true : normalizeSpaces;
      var textContent = e.textContent.trim();
      if (normalizeSpaces) {
        return textContent.replace(this.REGEXPS.normalize, " ");
      }
      return textContent;
    },
    _getCharCount(e, s) {
      s = s || ",";
      return this._getInnerText(e).split(s).length - 1;
    },
    _cleanStyles(e) {
      if (!e || e.tagName.toLowerCase() === "svg") {
        return;
      }
      for (var i = 0;i < this.PRESENTATIONAL_ATTRIBUTES.length; i++) {
        e.removeAttribute(this.PRESENTATIONAL_ATTRIBUTES[i]);
      }
      if (this.DEPRECATED_SIZE_ATTRIBUTE_ELEMS.includes(e.tagName)) {
        e.removeAttribute("width");
        e.removeAttribute("height");
      }
      var cur = e.firstElementChild;
      while (cur !== null) {
        this._cleanStyles(cur);
        cur = cur.nextElementSibling;
      }
    },
    _getLinkDensity(element) {
      var textLength = this._getInnerText(element).length;
      if (textLength === 0) {
        return 0;
      }
      var linkLength = 0;
      this._forEachNode(element.getElementsByTagName("a"), function(linkNode) {
        var href = linkNode.getAttribute("href");
        var coefficient = href && this.REGEXPS.hashUrl.test(href) ? 0.3 : 1;
        linkLength += this._getInnerText(linkNode).length * coefficient;
      });
      return linkLength / textLength;
    },
    _getClassWeight(e) {
      if (!this._flagIsActive(this.FLAG_WEIGHT_CLASSES)) {
        return 0;
      }
      var weight = 0;
      if (typeof e.className === "string" && e.className !== "") {
        if (this.REGEXPS.negative.test(e.className)) {
          weight -= 25;
        }
        if (this.REGEXPS.positive.test(e.className)) {
          weight += 25;
        }
      }
      if (typeof e.id === "string" && e.id !== "") {
        if (this.REGEXPS.negative.test(e.id)) {
          weight -= 25;
        }
        if (this.REGEXPS.positive.test(e.id)) {
          weight += 25;
        }
      }
      return weight;
    },
    _clean(e, tag) {
      var isEmbed = ["object", "embed", "iframe"].includes(tag);
      this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(element) {
        if (isEmbed) {
          for (var i = 0;i < element.attributes.length; i++) {
            if (this._allowedVideoRegex.test(element.attributes[i].value)) {
              return false;
            }
          }
          if (element.tagName === "object" && this._allowedVideoRegex.test(element.innerHTML)) {
            return false;
          }
        }
        return true;
      });
    },
    _hasAncestorTag(node, tagName, maxDepth, filterFn) {
      maxDepth = maxDepth || 3;
      tagName = tagName.toUpperCase();
      var depth = 0;
      while (node.parentNode) {
        if (maxDepth > 0 && depth > maxDepth) {
          return false;
        }
        if (node.parentNode.tagName === tagName && (!filterFn || filterFn(node.parentNode))) {
          return true;
        }
        node = node.parentNode;
        depth++;
      }
      return false;
    },
    _getRowAndColumnCount(table) {
      var rows = 0;
      var columns = 0;
      var trs = table.getElementsByTagName("tr");
      for (var i = 0;i < trs.length; i++) {
        var rowspan = trs[i].getAttribute("rowspan") || 0;
        if (rowspan) {
          rowspan = parseInt(rowspan, 10);
        }
        rows += rowspan || 1;
        var columnsInThisRow = 0;
        var cells = trs[i].getElementsByTagName("td");
        for (var j = 0;j < cells.length; j++) {
          var colspan = cells[j].getAttribute("colspan") || 0;
          if (colspan) {
            colspan = parseInt(colspan, 10);
          }
          columnsInThisRow += colspan || 1;
        }
        columns = Math.max(columns, columnsInThisRow);
      }
      return { rows, columns };
    },
    _markDataTables(root) {
      var tables = root.getElementsByTagName("table");
      for (var i = 0;i < tables.length; i++) {
        var table = tables[i];
        var role = table.getAttribute("role");
        if (role == "presentation") {
          table._readabilityDataTable = false;
          continue;
        }
        var datatable = table.getAttribute("datatable");
        if (datatable == "0") {
          table._readabilityDataTable = false;
          continue;
        }
        var summary = table.getAttribute("summary");
        if (summary) {
          table._readabilityDataTable = true;
          continue;
        }
        var caption = table.getElementsByTagName("caption")[0];
        if (caption && caption.childNodes.length) {
          table._readabilityDataTable = true;
          continue;
        }
        var dataTableDescendants = ["col", "colgroup", "tfoot", "thead", "th"];
        var descendantExists = function(tag) {
          return !!table.getElementsByTagName(tag)[0];
        };
        if (dataTableDescendants.some(descendantExists)) {
          this.log("Data table because found data-y descendant");
          table._readabilityDataTable = true;
          continue;
        }
        if (table.getElementsByTagName("table")[0]) {
          table._readabilityDataTable = false;
          continue;
        }
        var sizeInfo = this._getRowAndColumnCount(table);
        if (sizeInfo.columns == 1 || sizeInfo.rows == 1) {
          table._readabilityDataTable = false;
          continue;
        }
        if (sizeInfo.rows >= 10 || sizeInfo.columns > 4) {
          table._readabilityDataTable = true;
          continue;
        }
        table._readabilityDataTable = sizeInfo.rows * sizeInfo.columns > 10;
      }
    },
    _fixLazyImages(root) {
      this._forEachNode(this._getAllNodesWithTag(root, ["img", "picture", "figure"]), function(elem) {
        if (elem.src && this.REGEXPS.b64DataUrl.test(elem.src)) {
          var parts = this.REGEXPS.b64DataUrl.exec(elem.src);
          if (parts[1] === "image/svg+xml") {
            return;
          }
          var srcCouldBeRemoved = false;
          for (var i = 0;i < elem.attributes.length; i++) {
            var attr = elem.attributes[i];
            if (attr.name === "src") {
              continue;
            }
            if (/\.(jpg|jpeg|png|webp)/i.test(attr.value)) {
              srcCouldBeRemoved = true;
              break;
            }
          }
          if (srcCouldBeRemoved) {
            var b64starts = parts[0].length;
            var b64length = elem.src.length - b64starts;
            if (b64length < 133) {
              elem.removeAttribute("src");
            }
          }
        }
        if ((elem.src || elem.srcset && elem.srcset != "null") && !elem.className.toLowerCase().includes("lazy")) {
          return;
        }
        for (var j = 0;j < elem.attributes.length; j++) {
          attr = elem.attributes[j];
          if (attr.name === "src" || attr.name === "srcset" || attr.name === "alt") {
            continue;
          }
          var copyTo = null;
          if (/\.(jpg|jpeg|png|webp)\s+\d/.test(attr.value)) {
            copyTo = "srcset";
          } else if (/^\s*\S+\.(jpg|jpeg|png|webp)\S*\s*$/.test(attr.value)) {
            copyTo = "src";
          }
          if (copyTo) {
            if (elem.tagName === "IMG" || elem.tagName === "PICTURE") {
              elem.setAttribute(copyTo, attr.value);
            } else if (elem.tagName === "FIGURE" && !this._getAllNodesWithTag(elem, ["img", "picture"]).length) {
              var img = this._doc.createElement("img");
              img.setAttribute(copyTo, attr.value);
              elem.appendChild(img);
            }
          }
        }
      });
    },
    _getTextDensity(e, tags) {
      var textLength = this._getInnerText(e, true).length;
      if (textLength === 0) {
        return 0;
      }
      var childrenLength = 0;
      var children = this._getAllNodesWithTag(e, tags);
      this._forEachNode(children, (child) => childrenLength += this._getInnerText(child, true).length);
      return childrenLength / textLength;
    },
    _cleanConditionally(e, tag) {
      if (!this._flagIsActive(this.FLAG_CLEAN_CONDITIONALLY)) {
        return;
      }
      this._removeNodes(this._getAllNodesWithTag(e, [tag]), function(node) {
        var isDataTable = function(t) {
          return t._readabilityDataTable;
        };
        var isList = tag === "ul" || tag === "ol";
        if (!isList) {
          var listLength = 0;
          var listNodes = this._getAllNodesWithTag(node, ["ul", "ol"]);
          this._forEachNode(listNodes, (list) => listLength += this._getInnerText(list).length);
          isList = listLength / this._getInnerText(node).length > 0.9;
        }
        if (tag === "table" && isDataTable(node)) {
          return false;
        }
        if (this._hasAncestorTag(node, "table", -1, isDataTable)) {
          return false;
        }
        if (this._hasAncestorTag(node, "code")) {
          return false;
        }
        if ([...node.getElementsByTagName("table")].some((tbl) => tbl._readabilityDataTable)) {
          return false;
        }
        var weight = this._getClassWeight(node);
        this.log("Cleaning Conditionally", node);
        var contentScore = 0;
        if (weight + contentScore < 0) {
          return true;
        }
        if (this._getCharCount(node, ",") < 10) {
          var p = node.getElementsByTagName("p").length;
          var img = node.getElementsByTagName("img").length;
          var li = node.getElementsByTagName("li").length - 100;
          var input = node.getElementsByTagName("input").length;
          var headingDensity = this._getTextDensity(node, [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6"
          ]);
          var embedCount = 0;
          var embeds = this._getAllNodesWithTag(node, [
            "object",
            "embed",
            "iframe"
          ]);
          for (var i = 0;i < embeds.length; i++) {
            for (var j = 0;j < embeds[i].attributes.length; j++) {
              if (this._allowedVideoRegex.test(embeds[i].attributes[j].value)) {
                return false;
              }
            }
            if (embeds[i].tagName === "object" && this._allowedVideoRegex.test(embeds[i].innerHTML)) {
              return false;
            }
            embedCount++;
          }
          var innerText = this._getInnerText(node);
          if (this.REGEXPS.adWords.test(innerText) || this.REGEXPS.loadingWords.test(innerText)) {
            return true;
          }
          var contentLength = innerText.length;
          var linkDensity = this._getLinkDensity(node);
          var textishTags = ["SPAN", "LI", "TD"].concat(Array.from(this.DIV_TO_P_ELEMS));
          var textDensity = this._getTextDensity(node, textishTags);
          var isFigureChild = this._hasAncestorTag(node, "figure");
          const shouldRemoveNode = () => {
            const errs = [];
            if (!isFigureChild && img > 1 && p / img < 0.5) {
              errs.push(`Bad p to img ratio (img=${img}, p=${p})`);
            }
            if (!isList && li > p) {
              errs.push(`Too many li's outside of a list. (li=${li} > p=${p})`);
            }
            if (input > Math.floor(p / 3)) {
              errs.push(`Too many inputs per p. (input=${input}, p=${p})`);
            }
            if (!isList && !isFigureChild && headingDensity < 0.9 && contentLength < 25 && (img === 0 || img > 2) && linkDensity > 0) {
              errs.push(`Suspiciously short. (headingDensity=${headingDensity}, img=${img}, linkDensity=${linkDensity})`);
            }
            if (!isList && weight < 25 && linkDensity > 0.2 + this._linkDensityModifier) {
              errs.push(`Low weight and a little linky. (linkDensity=${linkDensity})`);
            }
            if (weight >= 25 && linkDensity > 0.5 + this._linkDensityModifier) {
              errs.push(`High weight and mostly links. (linkDensity=${linkDensity})`);
            }
            if (embedCount === 1 && contentLength < 75 || embedCount > 1) {
              errs.push(`Suspicious embed. (embedCount=${embedCount}, contentLength=${contentLength})`);
            }
            if (img === 0 && textDensity === 0) {
              errs.push(`No useful content. (img=${img}, textDensity=${textDensity})`);
            }
            if (errs.length) {
              this.log("Checks failed", errs);
              return true;
            }
            return false;
          };
          var haveToRemove = shouldRemoveNode();
          if (isList && haveToRemove) {
            for (var x = 0;x < node.children.length; x++) {
              let child = node.children[x];
              if (child.children.length > 1) {
                return haveToRemove;
              }
            }
            let li_count = node.getElementsByTagName("li").length;
            if (img == li_count) {
              return false;
            }
          }
          return haveToRemove;
        }
        return false;
      });
    },
    _cleanMatchedNodes(e, filter) {
      var endOfSearchMarkerNode = this._getNextNode(e, true);
      var next = this._getNextNode(e);
      while (next && next != endOfSearchMarkerNode) {
        if (filter.call(this, next, next.className + " " + next.id)) {
          next = this._removeAndGetNext(next);
        } else {
          next = this._getNextNode(next);
        }
      }
    },
    _cleanHeaders(e) {
      let headingNodes = this._getAllNodesWithTag(e, ["h1", "h2"]);
      this._removeNodes(headingNodes, function(node) {
        let shouldRemove = this._getClassWeight(node) < 0;
        if (shouldRemove) {
          this.log("Removing header with low class weight:", node);
        }
        return shouldRemove;
      });
    },
    _headerDuplicatesTitle(node) {
      if (node.tagName != "H1" && node.tagName != "H2") {
        return false;
      }
      var heading = this._getInnerText(node, false);
      this.log("Evaluating similarity of header:", heading, this._articleTitle);
      return this._textSimilarity(this._articleTitle, heading) > 0.75;
    },
    _flagIsActive(flag) {
      return (this._flags & flag) > 0;
    },
    _removeFlag(flag) {
      this._flags = this._flags & ~flag;
    },
    _isProbablyVisible(node) {
      return (!node.style || node.style.display != "none") && (!node.style || node.style.visibility != "hidden") && !node.hasAttribute("hidden") && (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.includes && node.className.includes("fallback-image"));
    },
    parse() {
      if (this._maxElemsToParse > 0) {
        var numTags = this._doc.getElementsByTagName("*").length;
        if (numTags > this._maxElemsToParse) {
          throw new Error("Aborting parsing document; " + numTags + " elements found");
        }
      }
      this._unwrapNoscriptImages(this._doc);
      var jsonLd = this._disableJSONLD ? {} : this._getJSONLD(this._doc);
      this._removeScripts(this._doc);
      this._prepDocument();
      var metadata = this._getArticleMetadata(jsonLd);
      this._metadata = metadata;
      this._articleTitle = metadata.title;
      var articleContent = this._grabArticle();
      if (!articleContent) {
        return null;
      }
      this.log("Grabbed: " + articleContent.innerHTML);
      this._postProcessContent(articleContent);
      if (!metadata.excerpt) {
        var paragraphs = articleContent.getElementsByTagName("p");
        if (paragraphs.length) {
          metadata.excerpt = paragraphs[0].textContent.trim();
        }
      }
      var textContent = articleContent.textContent;
      return {
        title: this._articleTitle,
        byline: metadata.byline || this._articleByline,
        dir: this._articleDir,
        lang: this._articleLang,
        content: this._serializer(articleContent),
        textContent,
        length: textContent.length,
        excerpt: metadata.excerpt,
        siteName: metadata.siteName || this._articleSiteName,
        publishedTime: metadata.publishedTime
      };
    }
  };
  if (typeof module === "object") {
    module.exports = Readability;
  }
});

// node_modules/.bun/@mozilla+readability@0.6.0/node_modules/@mozilla/readability/Readability-readerable.js
var require_Readability_readerable = __commonJS(function(exports, module) {
  var REGEXPS = {
    unlikelyCandidates: /-ad-|ai2html|banner|breadcrumbs|combx|comment|community|cover-wrap|disqus|extra|footer|gdpr|header|legends|menu|related|remark|replies|rss|shoutbox|sidebar|skyscraper|social|sponsor|supplemental|ad-break|agegate|pagination|pager|popup|yom-remote/i,
    okMaybeItsACandidate: /and|article|body|column|content|main|shadow/i
  };
  function isNodeVisible(node) {
    return (!node.style || node.style.display != "none") && !node.hasAttribute("hidden") && (!node.hasAttribute("aria-hidden") || node.getAttribute("aria-hidden") != "true" || node.className && node.className.includes && node.className.includes("fallback-image"));
  }
  function isProbablyReaderable(doc, options = {}) {
    if (typeof options == "function") {
      options = { visibilityChecker: options };
    }
    var defaultOptions = {
      minScore: 20,
      minContentLength: 140,
      visibilityChecker: isNodeVisible
    };
    options = Object.assign(defaultOptions, options);
    var nodes = doc.querySelectorAll("p, pre, article");
    var brNodes = doc.querySelectorAll("div > br");
    if (brNodes.length) {
      var set = new Set(nodes);
      [].forEach.call(brNodes, function(node) {
        set.add(node.parentNode);
      });
      nodes = Array.from(set);
    }
    var score = 0;
    return [].some.call(nodes, function(node) {
      if (!options.visibilityChecker(node)) {
        return false;
      }
      var matchString = node.className + " " + node.id;
      if (REGEXPS.unlikelyCandidates.test(matchString) && !REGEXPS.okMaybeItsACandidate.test(matchString)) {
        return false;
      }
      if (node.matches("li p")) {
        return false;
      }
      var textContentLength = node.textContent.trim().length;
      if (textContentLength < options.minContentLength) {
        return false;
      }
      score += Math.sqrt(textContentLength - options.minContentLength);
      if (score > options.minScore) {
        return true;
      }
      return false;
    });
  }
  if (typeof module === "object") {
    module.exports = isProbablyReaderable;
  }
});

// node_modules/.bun/@mozilla+readability@0.6.0/node_modules/@mozilla/readability/index.js
var require_readability = __commonJS(function(exports, module) {
  var Readability = require_Readability();
  var isProbablyReaderable = require_Readability_readerable();
  module.exports = {
    Readability,
    isProbablyReaderable
  };
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/StyleSheet.js
var require_StyleSheet = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.StyleSheet = function StyleSheet() {
    this.parentStyleSheet = null;
  };
  exports.StyleSheet = CSSOM.StyleSheet;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSRule.js
var require_CSSRule = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.CSSRule = function CSSRule() {
    this.parentRule = null;
    this.parentStyleSheet = null;
  };
  CSSOM.CSSRule.UNKNOWN_RULE = 0;
  CSSOM.CSSRule.STYLE_RULE = 1;
  CSSOM.CSSRule.CHARSET_RULE = 2;
  CSSOM.CSSRule.IMPORT_RULE = 3;
  CSSOM.CSSRule.MEDIA_RULE = 4;
  CSSOM.CSSRule.FONT_FACE_RULE = 5;
  CSSOM.CSSRule.PAGE_RULE = 6;
  CSSOM.CSSRule.KEYFRAMES_RULE = 7;
  CSSOM.CSSRule.KEYFRAME_RULE = 8;
  CSSOM.CSSRule.MARGIN_RULE = 9;
  CSSOM.CSSRule.NAMESPACE_RULE = 10;
  CSSOM.CSSRule.COUNTER_STYLE_RULE = 11;
  CSSOM.CSSRule.SUPPORTS_RULE = 12;
  CSSOM.CSSRule.DOCUMENT_RULE = 13;
  CSSOM.CSSRule.FONT_FEATURE_VALUES_RULE = 14;
  CSSOM.CSSRule.VIEWPORT_RULE = 15;
  CSSOM.CSSRule.REGION_STYLE_RULE = 16;
  CSSOM.CSSRule.prototype = {
    constructor: CSSOM.CSSRule
  };
  exports.CSSRule = CSSOM.CSSRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSStyleRule.js
var require_CSSStyleRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
    CSSRule: require_CSSRule().CSSRule
  };
  CSSOM.CSSStyleRule = function CSSStyleRule() {
    CSSOM.CSSRule.call(this);
    this.selectorText = "";
    this.style = new CSSOM.CSSStyleDeclaration;
    this.style.parentRule = this;
  };
  CSSOM.CSSStyleRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSStyleRule.prototype.constructor = CSSOM.CSSStyleRule;
  CSSOM.CSSStyleRule.prototype.type = 1;
  Object.defineProperty(CSSOM.CSSStyleRule.prototype, "cssText", {
    get: function() {
      var text;
      if (this.selectorText) {
        text = this.selectorText + " {" + this.style.cssText + "}";
      } else {
        text = "";
      }
      return text;
    },
    set: function(cssText) {
      var rule = CSSOM.CSSStyleRule.parse(cssText);
      this.style = rule.style;
      this.selectorText = rule.selectorText;
    }
  });
  CSSOM.CSSStyleRule.parse = function(ruleText) {
    var i = 0;
    var state = "selector";
    var index;
    var j = i;
    var buffer = "";
    var SIGNIFICANT_WHITESPACE = {
      selector: true,
      value: true
    };
    var styleRule = new CSSOM.CSSStyleRule;
    var name, priority = "";
    for (var character;character = ruleText.charAt(i); i++) {
      switch (character) {
        case " ":
        case "\t":
        case "\r":
        case `
`:
        case "\f":
          if (SIGNIFICANT_WHITESPACE[state]) {
            switch (ruleText.charAt(i - 1)) {
              case " ":
              case "\t":
              case "\r":
              case `
`:
              case "\f":
                break;
              default:
                buffer += " ";
                break;
            }
          }
          break;
        case '"':
          j = i + 1;
          index = ruleText.indexOf('"', j) + 1;
          if (!index) {
            throw '" is missing';
          }
          buffer += ruleText.slice(i, index);
          i = index - 1;
          break;
        case "'":
          j = i + 1;
          index = ruleText.indexOf("'", j) + 1;
          if (!index) {
            throw "' is missing";
          }
          buffer += ruleText.slice(i, index);
          i = index - 1;
          break;
        case "/":
          if (ruleText.charAt(i + 1) === "*") {
            i += 2;
            index = ruleText.indexOf("*/", i);
            if (index === -1) {
              throw new SyntaxError("Missing */");
            } else {
              i = index + 1;
            }
          } else {
            buffer += character;
          }
          break;
        case "{":
          if (state === "selector") {
            styleRule.selectorText = buffer.trim();
            buffer = "";
            state = "name";
          }
          break;
        case ":":
          if (state === "name") {
            name = buffer.trim();
            buffer = "";
            state = "value";
          } else {
            buffer += character;
          }
          break;
        case "!":
          if (state === "value" && ruleText.indexOf("!important", i) === i) {
            priority = "important";
            i += "important".length;
          } else {
            buffer += character;
          }
          break;
        case ";":
          if (state === "value") {
            styleRule.style.setProperty(name, buffer.trim(), priority);
            priority = "";
            buffer = "";
            state = "name";
          } else {
            buffer += character;
          }
          break;
        case "}":
          if (state === "value") {
            styleRule.style.setProperty(name, buffer.trim(), priority);
            priority = "";
            buffer = "";
          } else if (state === "name") {
            break;
          } else {
            buffer += character;
          }
          state = "selector";
          break;
        default:
          buffer += character;
          break;
      }
    }
    return styleRule;
  };
  exports.CSSStyleRule = CSSOM.CSSStyleRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSStyleSheet.js
var require_CSSStyleSheet = __commonJS(function(exports) {
  var CSSOM = {
    StyleSheet: require_StyleSheet().StyleSheet,
    CSSStyleRule: require_CSSStyleRule().CSSStyleRule
  };
  CSSOM.CSSStyleSheet = function CSSStyleSheet() {
    CSSOM.StyleSheet.call(this);
    this.cssRules = [];
  };
  CSSOM.CSSStyleSheet.prototype = new CSSOM.StyleSheet;
  CSSOM.CSSStyleSheet.prototype.constructor = CSSOM.CSSStyleSheet;
  CSSOM.CSSStyleSheet.prototype.insertRule = function(rule, index) {
    if (index < 0 || index > this.cssRules.length) {
      throw new RangeError("INDEX_SIZE_ERR");
    }
    var cssRule = CSSOM.parse(rule).cssRules[0];
    cssRule.parentStyleSheet = this;
    this.cssRules.splice(index, 0, cssRule);
    return index;
  };
  CSSOM.CSSStyleSheet.prototype.deleteRule = function(index) {
    if (index < 0 || index >= this.cssRules.length) {
      throw new RangeError("INDEX_SIZE_ERR");
    }
    this.cssRules.splice(index, 1);
  };
  CSSOM.CSSStyleSheet.prototype.toString = function() {
    var result = "";
    var rules = this.cssRules;
    for (var i = 0;i < rules.length; i++) {
      result += rules[i].cssText + `
`;
    }
    return result;
  };
  exports.CSSStyleSheet = CSSOM.CSSStyleSheet;
  CSSOM.parse = require_parse().parse;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/MediaList.js
var require_MediaList = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.MediaList = function MediaList() {
    this.length = 0;
  };
  CSSOM.MediaList.prototype = {
    constructor: CSSOM.MediaList,
    get mediaText() {
      return Array.prototype.join.call(this, ", ");
    },
    set mediaText(value) {
      var values = value.split(",");
      var length = this.length = values.length;
      for (var i = 0;i < length; i++) {
        this[i] = values[i].trim();
      }
    },
    appendMedium: function(medium) {
      if (Array.prototype.indexOf.call(this, medium) === -1) {
        this[this.length] = medium;
        this.length++;
      }
    },
    deleteMedium: function(medium) {
      var index = Array.prototype.indexOf.call(this, medium);
      if (index !== -1) {
        Array.prototype.splice.call(this, index, 1);
      }
    }
  };
  exports.MediaList = CSSOM.MediaList;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSImportRule.js
var require_CSSImportRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule,
    CSSStyleSheet: require_CSSStyleSheet().CSSStyleSheet,
    MediaList: require_MediaList().MediaList
  };
  CSSOM.CSSImportRule = function CSSImportRule() {
    CSSOM.CSSRule.call(this);
    this.href = "";
    this.media = new CSSOM.MediaList;
    this.styleSheet = new CSSOM.CSSStyleSheet;
  };
  CSSOM.CSSImportRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSImportRule.prototype.constructor = CSSOM.CSSImportRule;
  CSSOM.CSSImportRule.prototype.type = 3;
  Object.defineProperty(CSSOM.CSSImportRule.prototype, "cssText", {
    get: function() {
      var mediaText = this.media.mediaText;
      return "@import url(" + this.href + ")" + (mediaText ? " " + mediaText : "") + ";";
    },
    set: function(cssText) {
      var i = 0;
      var state = "";
      var buffer = "";
      var index;
      for (var character;character = cssText.charAt(i); i++) {
        switch (character) {
          case " ":
          case "\t":
          case "\r":
          case `
`:
          case "\f":
            if (state === "after-import") {
              state = "url";
            } else {
              buffer += character;
            }
            break;
          case "@":
            if (!state && cssText.indexOf("@import", i) === i) {
              state = "after-import";
              i += "import".length;
              buffer = "";
            }
            break;
          case "u":
            if (state === "url" && cssText.indexOf("url(", i) === i) {
              index = cssText.indexOf(")", i + 1);
              if (index === -1) {
                throw i + ': ")" not found';
              }
              i += "url(".length;
              var url = cssText.slice(i, index);
              if (url[0] === url[url.length - 1]) {
                if (url[0] === '"' || url[0] === "'") {
                  url = url.slice(1, -1);
                }
              }
              this.href = url;
              i = index;
              state = "media";
            }
            break;
          case '"':
            if (state === "url") {
              index = cssText.indexOf('"', i + 1);
              if (!index) {
                throw i + `: '"' not found`;
              }
              this.href = cssText.slice(i + 1, index);
              i = index;
              state = "media";
            }
            break;
          case "'":
            if (state === "url") {
              index = cssText.indexOf("'", i + 1);
              if (!index) {
                throw i + `: "'" not found`;
              }
              this.href = cssText.slice(i + 1, index);
              i = index;
              state = "media";
            }
            break;
          case ";":
            if (state === "media") {
              if (buffer) {
                this.media.mediaText = buffer.trim();
              }
            }
            break;
          default:
            if (state === "media") {
              buffer += character;
            }
            break;
        }
      }
    }
  });
  exports.CSSImportRule = CSSOM.CSSImportRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSGroupingRule.js
var require_CSSGroupingRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule
  };
  CSSOM.CSSGroupingRule = function CSSGroupingRule() {
    CSSOM.CSSRule.call(this);
    this.cssRules = [];
  };
  CSSOM.CSSGroupingRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSGroupingRule.prototype.constructor = CSSOM.CSSGroupingRule;
  CSSOM.CSSGroupingRule.prototype.insertRule = function insertRule(rule, index) {
    if (index < 0 || index > this.cssRules.length) {
      throw new RangeError("INDEX_SIZE_ERR");
    }
    var cssRule = CSSOM.parse(rule).cssRules[0];
    cssRule.parentRule = this;
    this.cssRules.splice(index, 0, cssRule);
    return index;
  };
  CSSOM.CSSGroupingRule.prototype.deleteRule = function deleteRule(index) {
    if (index < 0 || index >= this.cssRules.length) {
      throw new RangeError("INDEX_SIZE_ERR");
    }
    this.cssRules.splice(index, 1)[0].parentRule = null;
  };
  exports.CSSGroupingRule = CSSOM.CSSGroupingRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSConditionRule.js
var require_CSSConditionRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule,
    CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule
  };
  CSSOM.CSSConditionRule = function CSSConditionRule() {
    CSSOM.CSSGroupingRule.call(this);
    this.cssRules = [];
  };
  CSSOM.CSSConditionRule.prototype = new CSSOM.CSSGroupingRule;
  CSSOM.CSSConditionRule.prototype.constructor = CSSOM.CSSConditionRule;
  CSSOM.CSSConditionRule.prototype.conditionText = "";
  CSSOM.CSSConditionRule.prototype.cssText = "";
  exports.CSSConditionRule = CSSOM.CSSConditionRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSMediaRule.js
var require_CSSMediaRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule,
    CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
    CSSConditionRule: require_CSSConditionRule().CSSConditionRule,
    MediaList: require_MediaList().MediaList
  };
  CSSOM.CSSMediaRule = function CSSMediaRule() {
    CSSOM.CSSConditionRule.call(this);
    this.media = new CSSOM.MediaList;
  };
  CSSOM.CSSMediaRule.prototype = new CSSOM.CSSConditionRule;
  CSSOM.CSSMediaRule.prototype.constructor = CSSOM.CSSMediaRule;
  CSSOM.CSSMediaRule.prototype.type = 4;
  Object.defineProperties(CSSOM.CSSMediaRule.prototype, {
    conditionText: {
      get: function() {
        return this.media.mediaText;
      },
      set: function(value) {
        this.media.mediaText = value;
      },
      configurable: true,
      enumerable: true
    },
    cssText: {
      get: function() {
        var cssTexts = [];
        for (var i = 0, length = this.cssRules.length;i < length; i++) {
          cssTexts.push(this.cssRules[i].cssText);
        }
        return "@media " + this.media.mediaText + " {" + cssTexts.join("") + "}";
      },
      configurable: true,
      enumerable: true
    }
  });
  exports.CSSMediaRule = CSSOM.CSSMediaRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSSupportsRule.js
var require_CSSSupportsRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule,
    CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
    CSSConditionRule: require_CSSConditionRule().CSSConditionRule
  };
  CSSOM.CSSSupportsRule = function CSSSupportsRule() {
    CSSOM.CSSConditionRule.call(this);
  };
  CSSOM.CSSSupportsRule.prototype = new CSSOM.CSSConditionRule;
  CSSOM.CSSSupportsRule.prototype.constructor = CSSOM.CSSSupportsRule;
  CSSOM.CSSSupportsRule.prototype.type = 12;
  Object.defineProperty(CSSOM.CSSSupportsRule.prototype, "cssText", {
    get: function() {
      var cssTexts = [];
      for (var i = 0, length = this.cssRules.length;i < length; i++) {
        cssTexts.push(this.cssRules[i].cssText);
      }
      return "@supports " + this.conditionText + " {" + cssTexts.join("") + "}";
    }
  });
  exports.CSSSupportsRule = CSSOM.CSSSupportsRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSFontFaceRule.js
var require_CSSFontFaceRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
    CSSRule: require_CSSRule().CSSRule
  };
  CSSOM.CSSFontFaceRule = function CSSFontFaceRule() {
    CSSOM.CSSRule.call(this);
    this.style = new CSSOM.CSSStyleDeclaration;
    this.style.parentRule = this;
  };
  CSSOM.CSSFontFaceRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSFontFaceRule.prototype.constructor = CSSOM.CSSFontFaceRule;
  CSSOM.CSSFontFaceRule.prototype.type = 5;
  Object.defineProperty(CSSOM.CSSFontFaceRule.prototype, "cssText", {
    get: function() {
      return "@font-face {" + this.style.cssText + "}";
    }
  });
  exports.CSSFontFaceRule = CSSOM.CSSFontFaceRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSHostRule.js
var require_CSSHostRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule
  };
  CSSOM.CSSHostRule = function CSSHostRule() {
    CSSOM.CSSRule.call(this);
    this.cssRules = [];
  };
  CSSOM.CSSHostRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSHostRule.prototype.constructor = CSSOM.CSSHostRule;
  CSSOM.CSSHostRule.prototype.type = 1001;
  Object.defineProperty(CSSOM.CSSHostRule.prototype, "cssText", {
    get: function() {
      var cssTexts = [];
      for (var i = 0, length = this.cssRules.length;i < length; i++) {
        cssTexts.push(this.cssRules[i].cssText);
      }
      return "@host {" + cssTexts.join("") + "}";
    }
  });
  exports.CSSHostRule = CSSOM.CSSHostRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSKeyframeRule.js
var require_CSSKeyframeRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule,
    CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration
  };
  CSSOM.CSSKeyframeRule = function CSSKeyframeRule() {
    CSSOM.CSSRule.call(this);
    this.keyText = "";
    this.style = new CSSOM.CSSStyleDeclaration;
    this.style.parentRule = this;
  };
  CSSOM.CSSKeyframeRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSKeyframeRule.prototype.constructor = CSSOM.CSSKeyframeRule;
  CSSOM.CSSKeyframeRule.prototype.type = 8;
  Object.defineProperty(CSSOM.CSSKeyframeRule.prototype, "cssText", {
    get: function() {
      return this.keyText + " {" + this.style.cssText + "} ";
    }
  });
  exports.CSSKeyframeRule = CSSOM.CSSKeyframeRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSKeyframesRule.js
var require_CSSKeyframesRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule
  };
  CSSOM.CSSKeyframesRule = function CSSKeyframesRule() {
    CSSOM.CSSRule.call(this);
    this.name = "";
    this.cssRules = [];
  };
  CSSOM.CSSKeyframesRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSKeyframesRule.prototype.constructor = CSSOM.CSSKeyframesRule;
  CSSOM.CSSKeyframesRule.prototype.type = 7;
  Object.defineProperty(CSSOM.CSSKeyframesRule.prototype, "cssText", {
    get: function() {
      var cssTexts = [];
      for (var i = 0, length = this.cssRules.length;i < length; i++) {
        cssTexts.push("  " + this.cssRules[i].cssText);
      }
      return "@" + (this._vendorPrefix || "") + "keyframes " + this.name + ` { 
` + cssTexts.join(`
`) + `
}`;
    }
  });
  exports.CSSKeyframesRule = CSSOM.CSSKeyframesRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSValue.js
var require_CSSValue = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.CSSValue = function CSSValue() {};
  CSSOM.CSSValue.prototype = {
    constructor: CSSOM.CSSValue,
    set cssText(text) {
      var name = this._getConstructorName();
      throw new Error('DOMException: property "cssText" of "' + name + '" is readonly and can not be replaced with "' + text + '"!');
    },
    get cssText() {
      var name = this._getConstructorName();
      throw new Error('getter "cssText" of "' + name + '" is not implemented!');
    },
    _getConstructorName: function() {
      var s = this.constructor.toString(), c = s.match(/function\s([^\(]+)/), name = c[1];
      return name;
    }
  };
  exports.CSSValue = CSSOM.CSSValue;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSValueExpression.js
var require_CSSValueExpression = __commonJS(function(exports) {
  var CSSOM = {
    CSSValue: require_CSSValue().CSSValue
  };
  CSSOM.CSSValueExpression = function CSSValueExpression(token, idx) {
    this._token = token;
    this._idx = idx;
  };
  CSSOM.CSSValueExpression.prototype = new CSSOM.CSSValue;
  CSSOM.CSSValueExpression.prototype.constructor = CSSOM.CSSValueExpression;
  CSSOM.CSSValueExpression.prototype.parse = function() {
    var token = this._token, idx = this._idx;
    var character = "", expression = "", error = "", info, paren = [];
    for (;; ++idx) {
      character = token.charAt(idx);
      if (character === "") {
        error = "css expression error: unfinished expression!";
        break;
      }
      switch (character) {
        case "(":
          paren.push(character);
          expression += character;
          break;
        case ")":
          paren.pop(character);
          expression += character;
          break;
        case "/":
          if (info = this._parseJSComment(token, idx)) {
            if (info.error) {
              error = "css expression error: unfinished comment in expression!";
            } else {
              idx = info.idx;
            }
          } else if (info = this._parseJSRexExp(token, idx)) {
            idx = info.idx;
            expression += info.text;
          } else {
            expression += character;
          }
          break;
        case "'":
        case '"':
          info = this._parseJSString(token, idx, character);
          if (info) {
            idx = info.idx;
            expression += info.text;
          } else {
            expression += character;
          }
          break;
        default:
          expression += character;
          break;
      }
      if (error) {
        break;
      }
      if (paren.length === 0) {
        break;
      }
    }
    var ret;
    if (error) {
      ret = {
        error
      };
    } else {
      ret = {
        idx,
        expression
      };
    }
    return ret;
  };
  CSSOM.CSSValueExpression.prototype._parseJSComment = function(token, idx) {
    var nextChar = token.charAt(idx + 1), text;
    if (nextChar === "/" || nextChar === "*") {
      var startIdx = idx, endIdx, commentEndChar;
      if (nextChar === "/") {
        commentEndChar = `
`;
      } else if (nextChar === "*") {
        commentEndChar = "*/";
      }
      endIdx = token.indexOf(commentEndChar, startIdx + 1 + 1);
      if (endIdx !== -1) {
        endIdx = endIdx + commentEndChar.length - 1;
        text = token.substring(idx, endIdx + 1);
        return {
          idx: endIdx,
          text
        };
      } else {
        var error = "css expression error: unfinished comment in expression!";
        return {
          error
        };
      }
    } else {
      return false;
    }
  };
  CSSOM.CSSValueExpression.prototype._parseJSString = function(token, idx, sep) {
    var endIdx = this._findMatchedIdx(token, idx, sep), text;
    if (endIdx === -1) {
      return false;
    } else {
      text = token.substring(idx, endIdx + sep.length);
      return {
        idx: endIdx,
        text
      };
    }
  };
  CSSOM.CSSValueExpression.prototype._parseJSRexExp = function(token, idx) {
    var before = token.substring(0, idx).replace(/\s+$/, ""), legalRegx = [
      /^$/,
      /\($/,
      /\[$/,
      /\!$/,
      /\+$/,
      /\-$/,
      /\*$/,
      /\/\s+/,
      /\%$/,
      /\=$/,
      /\>$/,
      /<$/,
      /\&$/,
      /\|$/,
      /\^$/,
      /\~$/,
      /\?$/,
      /\,$/,
      /delete$/,
      /in$/,
      /instanceof$/,
      /new$/,
      /typeof$/,
      /void$/
    ];
    var isLegal = legalRegx.some(function(reg) {
      return reg.test(before);
    });
    if (!isLegal) {
      return false;
    } else {
      var sep = "/";
      return this._parseJSString(token, idx, sep);
    }
  };
  CSSOM.CSSValueExpression.prototype._findMatchedIdx = function(token, idx, sep) {
    var startIdx = idx, endIdx;
    var NOT_FOUND = -1;
    while (true) {
      endIdx = token.indexOf(sep, startIdx + 1);
      if (endIdx === -1) {
        endIdx = NOT_FOUND;
        break;
      } else {
        var text = token.substring(idx + 1, endIdx), matched = text.match(/\\+$/);
        if (!matched || matched[0] % 2 === 0) {
          break;
        } else {
          startIdx = endIdx;
        }
      }
    }
    var nextNewLineIdx = token.indexOf(`
`, idx + 1);
    if (nextNewLineIdx < endIdx) {
      endIdx = NOT_FOUND;
    }
    return endIdx;
  };
  exports.CSSValueExpression = CSSOM.CSSValueExpression;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/MatcherList.js
var require_MatcherList = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.MatcherList = function MatcherList() {
    this.length = 0;
  };
  CSSOM.MatcherList.prototype = {
    constructor: CSSOM.MatcherList,
    get matcherText() {
      return Array.prototype.join.call(this, ", ");
    },
    set matcherText(value) {
      var values = value.split(",");
      var length = this.length = values.length;
      for (var i = 0;i < length; i++) {
        this[i] = values[i].trim();
      }
    },
    appendMatcher: function(matcher) {
      if (Array.prototype.indexOf.call(this, matcher) === -1) {
        this[this.length] = matcher;
        this.length++;
      }
    },
    deleteMatcher: function(matcher) {
      var index = Array.prototype.indexOf.call(this, matcher);
      if (index !== -1) {
        Array.prototype.splice.call(this, index, 1);
      }
    }
  };
  exports.MatcherList = CSSOM.MatcherList;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSDocumentRule.js
var require_CSSDocumentRule = __commonJS(function(exports) {
  var CSSOM = {
    CSSRule: require_CSSRule().CSSRule,
    MatcherList: require_MatcherList().MatcherList
  };
  CSSOM.CSSDocumentRule = function CSSDocumentRule() {
    CSSOM.CSSRule.call(this);
    this.matcher = new CSSOM.MatcherList;
    this.cssRules = [];
  };
  CSSOM.CSSDocumentRule.prototype = new CSSOM.CSSRule;
  CSSOM.CSSDocumentRule.prototype.constructor = CSSOM.CSSDocumentRule;
  CSSOM.CSSDocumentRule.prototype.type = 10;
  Object.defineProperty(CSSOM.CSSDocumentRule.prototype, "cssText", {
    get: function() {
      var cssTexts = [];
      for (var i = 0, length = this.cssRules.length;i < length; i++) {
        cssTexts.push(this.cssRules[i].cssText);
      }
      return "@-moz-document " + this.matcher.matcherText + " {" + cssTexts.join("") + "}";
    }
  });
  exports.CSSDocumentRule = CSSOM.CSSDocumentRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/parse.js
var require_parse = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.parse = function parse(token) {
    var i = 0;
    var state = "before-selector";
    var index;
    var buffer = "";
    var valueParenthesisDepth = 0;
    var SIGNIFICANT_WHITESPACE = {
      selector: true,
      value: true,
      "value-parenthesis": true,
      atRule: true,
      "importRule-begin": true,
      importRule: true,
      atBlock: true,
      conditionBlock: true,
      "documentRule-begin": true
    };
    var styleSheet = new CSSOM.CSSStyleSheet;
    var currentScope = styleSheet;
    var parentRule;
    var ancestorRules = [];
    var hasAncestors = false;
    var prevScope;
    var name, priority = "", styleRule, mediaRule, supportsRule, importRule, fontFaceRule, keyframesRule, documentRule, hostRule;
    var atKeyframesRegExp = /@(-(?:\w+-)+)?keyframes/g;
    var parseError = function(message) {
      var lines = token.substring(0, i).split(`
`);
      var lineCount = lines.length;
      var charCount = lines.pop().length + 1;
      var error = new Error(message + " (line " + lineCount + ", char " + charCount + ")");
      error.line = lineCount;
      error["char"] = charCount;
      error.styleSheet = styleSheet;
      throw error;
    };
    for (var character;character = token.charAt(i); i++) {
      switch (character) {
        case " ":
        case "\t":
        case "\r":
        case `
`:
        case "\f":
          if (SIGNIFICANT_WHITESPACE[state]) {
            buffer += character;
          }
          break;
        case '"':
          index = i + 1;
          do {
            index = token.indexOf('"', index) + 1;
            if (!index) {
              parseError('Unmatched "');
            }
          } while (token[index - 2] === "\\");
          buffer += token.slice(i, index);
          i = index - 1;
          switch (state) {
            case "before-value":
              state = "value";
              break;
            case "importRule-begin":
              state = "importRule";
              break;
          }
          break;
        case "'":
          index = i + 1;
          do {
            index = token.indexOf("'", index) + 1;
            if (!index) {
              parseError("Unmatched '");
            }
          } while (token[index - 2] === "\\");
          buffer += token.slice(i, index);
          i = index - 1;
          switch (state) {
            case "before-value":
              state = "value";
              break;
            case "importRule-begin":
              state = "importRule";
              break;
          }
          break;
        case "/":
          if (token.charAt(i + 1) === "*") {
            i += 2;
            index = token.indexOf("*/", i);
            if (index === -1) {
              parseError("Missing */");
            } else {
              i = index + 1;
            }
          } else {
            buffer += character;
          }
          if (state === "importRule-begin") {
            buffer += " ";
            state = "importRule";
          }
          break;
        case "@":
          if (token.indexOf("@-moz-document", i) === i) {
            state = "documentRule-begin";
            documentRule = new CSSOM.CSSDocumentRule;
            documentRule.__starts = i;
            i += "-moz-document".length;
            buffer = "";
            break;
          } else if (token.indexOf("@media", i) === i) {
            state = "atBlock";
            mediaRule = new CSSOM.CSSMediaRule;
            mediaRule.__starts = i;
            i += "media".length;
            buffer = "";
            break;
          } else if (token.indexOf("@supports", i) === i) {
            state = "conditionBlock";
            supportsRule = new CSSOM.CSSSupportsRule;
            supportsRule.__starts = i;
            i += "supports".length;
            buffer = "";
            break;
          } else if (token.indexOf("@host", i) === i) {
            state = "hostRule-begin";
            i += "host".length;
            hostRule = new CSSOM.CSSHostRule;
            hostRule.__starts = i;
            buffer = "";
            break;
          } else if (token.indexOf("@import", i) === i) {
            state = "importRule-begin";
            i += "import".length;
            buffer += "@import";
            break;
          } else if (token.indexOf("@font-face", i) === i) {
            state = "fontFaceRule-begin";
            i += "font-face".length;
            fontFaceRule = new CSSOM.CSSFontFaceRule;
            fontFaceRule.__starts = i;
            buffer = "";
            break;
          } else {
            atKeyframesRegExp.lastIndex = i;
            var matchKeyframes = atKeyframesRegExp.exec(token);
            if (matchKeyframes && matchKeyframes.index === i) {
              state = "keyframesRule-begin";
              keyframesRule = new CSSOM.CSSKeyframesRule;
              keyframesRule.__starts = i;
              keyframesRule._vendorPrefix = matchKeyframes[1];
              i += matchKeyframes[0].length - 1;
              buffer = "";
              break;
            } else if (state === "selector") {
              state = "atRule";
            }
          }
          buffer += character;
          break;
        case "{":
          if (state === "selector" || state === "atRule") {
            styleRule.selectorText = buffer.trim();
            styleRule.style.__starts = i;
            buffer = "";
            state = "before-name";
          } else if (state === "atBlock") {
            mediaRule.media.mediaText = buffer.trim();
            if (parentRule) {
              ancestorRules.push(parentRule);
            }
            currentScope = parentRule = mediaRule;
            mediaRule.parentStyleSheet = styleSheet;
            buffer = "";
            state = "before-selector";
          } else if (state === "conditionBlock") {
            supportsRule.conditionText = buffer.trim();
            if (parentRule) {
              ancestorRules.push(parentRule);
            }
            currentScope = parentRule = supportsRule;
            supportsRule.parentStyleSheet = styleSheet;
            buffer = "";
            state = "before-selector";
          } else if (state === "hostRule-begin") {
            if (parentRule) {
              ancestorRules.push(parentRule);
            }
            currentScope = parentRule = hostRule;
            hostRule.parentStyleSheet = styleSheet;
            buffer = "";
            state = "before-selector";
          } else if (state === "fontFaceRule-begin") {
            if (parentRule) {
              fontFaceRule.parentRule = parentRule;
            }
            fontFaceRule.parentStyleSheet = styleSheet;
            styleRule = fontFaceRule;
            buffer = "";
            state = "before-name";
          } else if (state === "keyframesRule-begin") {
            keyframesRule.name = buffer.trim();
            if (parentRule) {
              ancestorRules.push(parentRule);
              keyframesRule.parentRule = parentRule;
            }
            keyframesRule.parentStyleSheet = styleSheet;
            currentScope = parentRule = keyframesRule;
            buffer = "";
            state = "keyframeRule-begin";
          } else if (state === "keyframeRule-begin") {
            styleRule = new CSSOM.CSSKeyframeRule;
            styleRule.keyText = buffer.trim();
            styleRule.__starts = i;
            buffer = "";
            state = "before-name";
          } else if (state === "documentRule-begin") {
            documentRule.matcher.matcherText = buffer.trim();
            if (parentRule) {
              ancestorRules.push(parentRule);
              documentRule.parentRule = parentRule;
            }
            currentScope = parentRule = documentRule;
            documentRule.parentStyleSheet = styleSheet;
            buffer = "";
            state = "before-selector";
          }
          break;
        case ":":
          if (state === "name") {
            name = buffer.trim();
            buffer = "";
            state = "before-value";
          } else {
            buffer += character;
          }
          break;
        case "(":
          if (state === "value") {
            if (buffer.trim() === "expression") {
              var info = new CSSOM.CSSValueExpression(token, i).parse();
              if (info.error) {
                parseError(info.error);
              } else {
                buffer += info.expression;
                i = info.idx;
              }
            } else {
              state = "value-parenthesis";
              valueParenthesisDepth = 1;
              buffer += character;
            }
          } else if (state === "value-parenthesis") {
            valueParenthesisDepth++;
            buffer += character;
          } else {
            buffer += character;
          }
          break;
        case ")":
          if (state === "value-parenthesis") {
            valueParenthesisDepth--;
            if (valueParenthesisDepth === 0)
              state = "value";
          }
          buffer += character;
          break;
        case "!":
          if (state === "value" && token.indexOf("!important", i) === i) {
            priority = "important";
            i += "important".length;
          } else {
            buffer += character;
          }
          break;
        case ";":
          switch (state) {
            case "value":
              styleRule.style.setProperty(name, buffer.trim(), priority);
              priority = "";
              buffer = "";
              state = "before-name";
              break;
            case "atRule":
              buffer = "";
              state = "before-selector";
              break;
            case "importRule":
              importRule = new CSSOM.CSSImportRule;
              importRule.parentStyleSheet = importRule.styleSheet.parentStyleSheet = styleSheet;
              importRule.cssText = buffer + character;
              styleSheet.cssRules.push(importRule);
              buffer = "";
              state = "before-selector";
              break;
            default:
              buffer += character;
              break;
          }
          break;
        case "}":
          switch (state) {
            case "value":
              styleRule.style.setProperty(name, buffer.trim(), priority);
              priority = "";
            case "before-name":
            case "name":
              styleRule.__ends = i + 1;
              if (parentRule) {
                styleRule.parentRule = parentRule;
              }
              styleRule.parentStyleSheet = styleSheet;
              currentScope.cssRules.push(styleRule);
              buffer = "";
              if (currentScope.constructor === CSSOM.CSSKeyframesRule) {
                state = "keyframeRule-begin";
              } else {
                state = "before-selector";
              }
              break;
            case "keyframeRule-begin":
            case "before-selector":
            case "selector":
              if (!parentRule) {
                parseError("Unexpected }");
              }
              hasAncestors = ancestorRules.length > 0;
              while (ancestorRules.length > 0) {
                parentRule = ancestorRules.pop();
                if (parentRule.constructor.name === "CSSMediaRule" || parentRule.constructor.name === "CSSSupportsRule") {
                  prevScope = currentScope;
                  currentScope = parentRule;
                  currentScope.cssRules.push(prevScope);
                  break;
                }
                if (ancestorRules.length === 0) {
                  hasAncestors = false;
                }
              }
              if (!hasAncestors) {
                currentScope.__ends = i + 1;
                styleSheet.cssRules.push(currentScope);
                currentScope = styleSheet;
                parentRule = null;
              }
              buffer = "";
              state = "before-selector";
              break;
          }
          break;
        default:
          switch (state) {
            case "before-selector":
              state = "selector";
              styleRule = new CSSOM.CSSStyleRule;
              styleRule.__starts = i;
              break;
            case "before-name":
              state = "name";
              break;
            case "before-value":
              state = "value";
              break;
            case "importRule-begin":
              state = "importRule";
              break;
          }
          buffer += character;
          break;
      }
    }
    return styleSheet;
  };
  exports.parse = CSSOM.parse;
  CSSOM.CSSStyleSheet = require_CSSStyleSheet().CSSStyleSheet;
  CSSOM.CSSStyleRule = require_CSSStyleRule().CSSStyleRule;
  CSSOM.CSSImportRule = require_CSSImportRule().CSSImportRule;
  CSSOM.CSSGroupingRule = require_CSSGroupingRule().CSSGroupingRule;
  CSSOM.CSSMediaRule = require_CSSMediaRule().CSSMediaRule;
  CSSOM.CSSConditionRule = require_CSSConditionRule().CSSConditionRule;
  CSSOM.CSSSupportsRule = require_CSSSupportsRule().CSSSupportsRule;
  CSSOM.CSSFontFaceRule = require_CSSFontFaceRule().CSSFontFaceRule;
  CSSOM.CSSHostRule = require_CSSHostRule().CSSHostRule;
  CSSOM.CSSStyleDeclaration = require_CSSStyleDeclaration().CSSStyleDeclaration;
  CSSOM.CSSKeyframeRule = require_CSSKeyframeRule().CSSKeyframeRule;
  CSSOM.CSSKeyframesRule = require_CSSKeyframesRule().CSSKeyframesRule;
  CSSOM.CSSValueExpression = require_CSSValueExpression().CSSValueExpression;
  CSSOM.CSSDocumentRule = require_CSSDocumentRule().CSSDocumentRule;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/CSSStyleDeclaration.js
var require_CSSStyleDeclaration = __commonJS(function(exports) {
  var CSSOM = {};
  CSSOM.CSSStyleDeclaration = function CSSStyleDeclaration() {
    this.length = 0;
    this.parentRule = null;
    this._importants = {};
  };
  CSSOM.CSSStyleDeclaration.prototype = {
    constructor: CSSOM.CSSStyleDeclaration,
    getPropertyValue: function(name) {
      return this[name] || "";
    },
    setProperty: function(name, value, priority) {
      if (this[name]) {
        var index = Array.prototype.indexOf.call(this, name);
        if (index < 0) {
          this[this.length] = name;
          this.length++;
        }
      } else {
        this[this.length] = name;
        this.length++;
      }
      this[name] = value + "";
      this._importants[name] = priority;
    },
    removeProperty: function(name) {
      if (!(name in this)) {
        return "";
      }
      var index = Array.prototype.indexOf.call(this, name);
      if (index < 0) {
        return "";
      }
      var prevValue = this[name];
      this[name] = "";
      Array.prototype.splice.call(this, index, 1);
      return prevValue;
    },
    getPropertyCSSValue: function() {},
    getPropertyPriority: function(name) {
      return this._importants[name] || "";
    },
    getPropertyShorthand: function() {},
    isPropertyImplicit: function() {},
    get cssText() {
      var properties = [];
      for (var i = 0, length = this.length;i < length; ++i) {
        var name = this[i];
        var value = this.getPropertyValue(name);
        var priority = this.getPropertyPriority(name);
        if (priority) {
          priority = " !" + priority;
        }
        properties[i] = name + ": " + value + priority + ";";
      }
      return properties.join(" ");
    },
    set cssText(text) {
      var i, name;
      for (i = this.length;i--; ) {
        name = this[i];
        this[name] = "";
      }
      Array.prototype.splice.call(this, 0, this.length);
      this._importants = {};
      var dummyRule = CSSOM.parse("#bogus{" + text + "}").cssRules[0].style;
      var length = dummyRule.length;
      for (i = 0;i < length; ++i) {
        name = dummyRule[i];
        this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
      }
    }
  };
  exports.CSSStyleDeclaration = CSSOM.CSSStyleDeclaration;
  CSSOM.parse = require_parse().parse;
});

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/clone.js
var require_clone = __commonJS(function(exports) {
  var CSSOM = {
    CSSStyleSheet: require_CSSStyleSheet().CSSStyleSheet,
    CSSRule: require_CSSRule().CSSRule,
    CSSStyleRule: require_CSSStyleRule().CSSStyleRule,
    CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
    CSSConditionRule: require_CSSConditionRule().CSSConditionRule,
    CSSMediaRule: require_CSSMediaRule().CSSMediaRule,
    CSSSupportsRule: require_CSSSupportsRule().CSSSupportsRule,
    CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
    CSSKeyframeRule: require_CSSKeyframeRule().CSSKeyframeRule,
    CSSKeyframesRule: require_CSSKeyframesRule().CSSKeyframesRule
  };
  CSSOM.clone = function clone(stylesheet) {
    var cloned = new CSSOM.CSSStyleSheet;
    var rules = stylesheet.cssRules;
    if (!rules) {
      return cloned;
    }
    for (var i = 0, rulesLength = rules.length;i < rulesLength; i++) {
      var rule = rules[i];
      var ruleClone = cloned.cssRules[i] = new rule.constructor;
      var style = rule.style;
      if (style) {
        var styleClone = ruleClone.style = new CSSOM.CSSStyleDeclaration;
        for (var j = 0, styleLength = style.length;j < styleLength; j++) {
          var name = styleClone[j] = style[j];
          styleClone[name] = style[name];
          styleClone._importants[name] = style.getPropertyPriority(name);
        }
        styleClone.length = style.length;
      }
      if (rule.hasOwnProperty("keyText")) {
        ruleClone.keyText = rule.keyText;
      }
      if (rule.hasOwnProperty("selectorText")) {
        ruleClone.selectorText = rule.selectorText;
      }
      if (rule.hasOwnProperty("mediaText")) {
        ruleClone.mediaText = rule.mediaText;
      }
      if (rule.hasOwnProperty("conditionText")) {
        ruleClone.conditionText = rule.conditionText;
      }
      if (rule.hasOwnProperty("cssRules")) {
        ruleClone.cssRules = clone(rule).cssRules;
      }
    }
    return cloned;
  };
  exports.clone = CSSOM.clone;
});

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/commonjs/canvas-shim.cjs
var require_canvas_shim = __commonJS(function(exports, module) {
  class Canvas {
    constructor(width, height) {
      this.width = width;
      this.height = height;
    }
    getContext() {
      return null;
    }
    toDataURL() {
      return "";
    }
  }
  module.exports = {
    createCanvas: (width, height) => new Canvas(width, height)
  };
});

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/commonjs/canvas.cjs
var require_canvas = __commonJS(function(exports, module) {
  try {
    module.exports = (()=>{throw new Error("Cannot require module "+"canvas");})();
  } catch (fallback) {
    module.exports = require_canvas_shim();
  }
});

// action/src/git-context.ts
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// action/src/limits.ts
var reportTimeoutMs = 60000;
var reportRetryDelayMs = 500;
var reportAttempts = 2;
var maxTelemetryBytes = 2000000;
var gitTimeoutMs = 5000;
var gitOutputLimitBytes = 2000000;

// action/src/git-context.ts
function field(value, path) {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current))
      return null;
    current = current[key];
  }
  return current;
}
function stringField(value, path) {
  const found = field(value, path);
  return typeof found === "string" && found.length > 0 ? found : null;
}
function matchingRunRepository(event, expectedRepo) {
  return typeof expectedRepo === "string" && expectedRepo.length > 0 && typeof field(event, ["repository", "private"]) === "boolean" && stringField(event, ["repository", "full_name"]) === expectedRepo;
}
function systemGitDiff(root, args) {
  const result = spawnSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    shell: false,
    timeout: gitTimeoutMs,
    maxBuffer: gitOutputLimitBytes
  });
  if (result.error || result.status !== 0 || typeof result.stdout !== "string")
    return null;
  return result.stdout.split(/\r?\n/u).filter((path) => path.length > 0);
}
function checkedOutCommit(root, diff = systemGitDiff) {
  const sha = diff(root, ["rev-parse", "HEAD"])?.[0];
  return sha && /^[0-9a-f]{40,64}$/u.test(sha) ? sha : null;
}
function changedPaths(root, event, diff) {
  const base = stringField(event, ["pull_request", "base", "sha"]);
  const head = stringField(event, ["pull_request", "head", "sha"]);
  if (base && head)
    return diff(root, ["diff", "--name-only", base, head]);
  const before = stringField(event, ["before"]);
  const after = stringField(event, ["after"]);
  if (!after)
    return [];
  if (!before || /^0+$/u.test(before))
    return diff(root, [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      after
    ]);
  return diff(root, ["diff", "--name-only", before, after]);
}
function watchedDocs(root) {
  const paths = new Set(["README.md"]);
  try {
    const plan = JSON.parse(readFileSync(join(root, "flightchecks/flightplan.json"), "utf8"));
    const claims = field(plan, ["claims"]);
    if (!Array.isArray(claims))
      return paths;
    for (const claim of claims) {
      const occurrences = field(claim, ["occurrences"]);
      if (!Array.isArray(occurrences))
        continue;
      for (const occurrence of occurrences) {
        if (stringField(occurrence, ["location", "kind"]) !== "file")
          continue;
        const path = stringField(occurrence, ["location", "path"]);
        if (path)
          paths.add(path);
      }
    }
  } catch {
    return paths;
  }
  return paths;
}
function commitAuthorLogin(event) {
  if (field(event, ["pull_request"]) !== null)
    return null;
  const login = stringField(event, ["head_commit", "author", "username"]);
  return login && /^[A-Za-z0-9-]{1,39}$/u.test(login) ? login : null;
}
function actionMetadata(root, event, diff = systemGitDiff) {
  const changedFiles = changedPaths(root, event, diff);
  const authorLogin = commitAuthorLogin(event);
  const metadata = {};
  const pullRequestNumber = field(event, ["number"]);
  const pullRequest = field(event, ["pull_request"]);
  if (typeof pullRequest === "object" && pullRequest !== null && typeof pullRequestNumber === "number" && Number.isSafeInteger(pullRequestNumber) && pullRequestNumber > 0)
    metadata.pullRequestNumber = pullRequestNumber;
  if (authorLogin)
    metadata.authorLogin = authorLogin;
  if (changedFiles !== null) {
    const watched = watchedDocs(root);
    metadata.changedFiles = changedFiles;
    metadata.docsChanged = changedFiles.some((path) => watched.has(path) || path.startsWith("docs/") && path.endsWith(".md"));
    metadata.codeChanged = changedFiles.some((path) => !path.endsWith(".md") && !path.startsWith("docs/") && !path.startsWith("flightchecks/"));
  }
  return metadata;
}
function metadataForCheckout(root, event, commitSha, diff = systemGitDiff) {
  const metadata = actionMetadata(root, event, diff);
  if (metadata.pullRequestNumber !== undefined && stringField(event, ["pull_request", "head", "sha"]) !== commitSha) {
    delete metadata.pullRequestNumber;
  }
  return metadata;
}
function readActionEvent(path) {
  if (!path)
    return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

// action/src/report.ts
import { readFileSync as readFileSync2, statSync } from "node:fs";
import { join as join2 } from "node:path";

// action/src/report-context.ts
var repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
var shaPattern = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u;
function field2(value, path) {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current))
      return null;
    current = current[key];
  }
  return current;
}
function validReportIdentity(identity) {
  return identity !== null && repoPattern.test(identity.repo) && shaPattern.test(identity.commitSha) && (identity.pullRequestNumber === undefined || Number.isSafeInteger(identity.pullRequestNumber) && identity.pullRequestNumber > 0 && identity.pullRequestNumber <= 2147483647);
}
function pullRequestIdentity(event, repo) {
  const head = field2(event, ["pull_request", "head", "sha"]);
  const number = field2(event, ["number"]);
  const headRepo = field2(event, ["pull_request", "head", "repo", "full_name"]);
  if (typeof head !== "string" || !shaPattern.test(head) || typeof number !== "number" || !Number.isSafeInteger(number) || number < 1 || number > 2147483647 || headRepo !== repo)
    return null;
  return { repo, commitSha: head, pullRequestNumber: number };
}
function trustedReportIdentity(context) {
  const { repository, workflowSha, eventName, event } = context;
  if (!repository || !workflowSha || !repoPattern.test(repository) || !shaPattern.test(workflowSha) || !matchingRunRepository(event, repository))
    return null;
  if (eventName === "pull_request")
    return pullRequestIdentity(event, repository);
  if (eventName !== "push" && eventName !== "schedule" && eventName !== "workflow_dispatch")
    return null;
  const after = field2(event, ["after"]);
  if (eventName === "push" && after !== null && after !== workflowSha)
    return null;
  return { repo: repository, commitSha: workflowSha };
}

// action/src/report.ts
function readTelemetry(root) {
  try {
    const path = join2(root, ".groundcontrol/telemetry.json");
    if (statSync(path).size > maxTelemetryBytes)
      return null;
    const value = JSON.parse(readFileSync2(path, "utf8"));
    if (typeof value !== "object" || value === null || !("repo" in value) || !("commitSha" in value) || !("results" in value))
      return null;
    if (typeof value.repo !== "string" || typeof value.commitSha !== "string" || !Array.isArray(value.results))
      return null;
    return value;
  } catch {
    return null;
  }
}
function telemetryEndpoint(server) {
  try {
    const base = new URL(server);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
    if (base.protocol !== "https:" && !(base.protocol === "http:" && local))
      return null;
    if (base.username || base.password || base.search || base.hash)
      return null;
    return new URL("/api/telemetry", base);
  } catch {
    return null;
  }
}
async function sendOnce(endpoint, token, body, transport) {
  try {
    const response = await transport(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body,
      signal: AbortSignal.timeout(reportTimeoutMs)
    });
    if (response.ok)
      return { ok: true, kind: "sent" };
    return { ok: false, error: "server_rejected", status: response.status };
  } catch {
    return { ok: false, error: "network" };
  }
}
async function reportTelemetry(root, server, token, identity, transport = fetch) {
  if (!server || !token)
    return { ok: true, kind: "skipped" };
  const endpoint = telemetryEndpoint(server);
  if (!endpoint)
    return { ok: false, error: "invalid_server" };
  if (!validReportIdentity(identity))
    return { ok: false, error: "invalid_context" };
  const telemetry = readTelemetry(root);
  if (!telemetry)
    return { ok: false, error: "invalid_telemetry" };
  if (telemetry.repo !== identity.repo || telemetry.commitSha !== identity.commitSha || telemetry.pullRequestNumber !== identity.pullRequestNumber)
    return { ok: false, error: "identity_mismatch" };
  const body = JSON.stringify(telemetry);
  let last = { ok: false, error: "network" };
  for (let attempt = 1;attempt <= reportAttempts; attempt += 1) {
    const result = await sendOnce(endpoint, token, body, transport);
    last = result;
    if (result.ok || result.error === "server_rejected" && (result.status ?? 0) < 500)
      return result;
    if (attempt < reportAttempts)
      await new Promise((resolve) => setTimeout(resolve, reportRetryDelayMs));
  }
  return last;
}

// action/src/run.ts
import { mkdirSync, readFileSync as readFileSync3, writeFileSync } from "node:fs";
import { join as join3 } from "node:path";
import { pathToFileURL } from "node:url";

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array, separator = "|") {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}

class Cached {
  constructor(getter) {
    this._getter = getter;
    this._value = undefined;
  }
  get value() {
    const getter = this._getter;
    if (getter !== undefined) {
      this._value = getter();
      this._getter = undefined;
    }
    return this._value;
  }
}
function cached(getter) {
  return new Cached(getter);
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
function mirrorProps(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source[key]);
    else
      putProp(target, key, desc.value);
  }
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== undefined && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class && ((value, key) => selected && !selected.has(key) ? value : new Class({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : undefined;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class({ type: "nonoptional", innerType: value }));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
  var _a;
  for (let i = start;i < issues.length; i++) {
    (_a = issues[i]).schema ?? (_a.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config) {
  var _a;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a = iss).schema ?? (_a.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : undefined;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0;i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
function derived(computes, table) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table;
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? undefined : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = undefined;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: undefined };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = () => value;
  fn[CONSTANT_CATCH] = true;
  return fn;
}

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/core.js
var _a;
var _zodDesc = { value: undefined, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition;
      }
      try {
        return new Definition;
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition;
}
function $constructor(name, initializer, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = new Set;
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && new WeakSet;
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = undefined;
      }
    } else if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer(inst, def);
    if (initialized) {
      const own = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto = _.prototype;
    for (const k in proto) {
      if (!Object.prototype.hasOwnProperty.call(proto, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = undefined;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: undefined, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = undefined;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, undefined, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
function flattenError(error, mapper = (issue) => issue.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error, path = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node = curr[el];
            if (terminal) {
              node._errors.push(mapper(issue));
            }
            curr = node;
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError;
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
function failure(Err, issues, ctx) {
  let error;
  return {
    success: false,
    get error() {
      if (!error) {
        error = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = undefined;
        ctx = undefined;
      }
      return error;
    },
    set error(e) {
      error = e;
      issues = undefined;
      ctx = undefined;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = (schema, value, _ctx) => {
  const validator = schema._zod.bag.validator;
  if (validator !== undefined) {
    if (validator(value) !== COMPILE_INVALID)
      return true;
    if (validator.definite === true && _ctx === undefined)
      return false;
  }
  return validateFallback(schema, value, _ctx);
};
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length === 0;
}
var validateAsync = async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
};
var _encode = (_Err) => {
  const parse = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decode = (_Err) => {
  const parse = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    return parse(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _encodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _decodeAsync = (_Err) => {
  const parseAsync = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    return await parseAsync(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
  return new RegExp(`^${source}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== undefined;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units > def.maximum ? codePointLength(input) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input = payload.value;
    const units = input.length;
    const length = typeof input === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join(`
`)}
};`);
    return factory(...Object.values(this.closed));
  }
}

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 5
};

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary) => {
            return handleCanaryResult(canary, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result) => runChecks(result, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {}
      return validateAsync2(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function canParseURL(input) {
  try {
    if (typeof URL !== "undefined" && typeof URL.canParse === "function")
      return URL.canParse(input);
    new URL(input);
    return true;
  } catch {
    return false;
  }
}
function validateURL(trimmed, def) {
  if (!("normalize" in def) && !("hostname" in def) && !("protocol" in def)) {
    return canParseURL(trimmed) || URL_UNPARSEABLE;
  }
  return parseURLObject(trimmed, def);
}
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    if (typeof URL !== "undefined") {
      const URLStatic = URL;
      if (typeof URLStatic.parse === "function")
        return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
    }
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url, hostname) {
  hostname.lastIndex = 0;
  return hostname.test(url.hostname);
}
function urlProtocolOk(url, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
}
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url = validateURL(trimmed, def);
      if (url === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url === true) {
        payload.value = stripTabAndNewline(trimmed);
        return;
      }
      if (def.hostname && !urlHostnameOk(url, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== undefined && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === undefined ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  return canParseURL(`http://[${value}]`);
}
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts = value.split("/");
  if (parts.length !== 2)
    return false;
  const [address, prefix] = parts;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? String(input) : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, optin, optout) {
  const isPresent = key in input;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== undefined && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === undefined) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: undefined,
        path: [key]
      });
    }
    return;
  }
  if (result.value === undefined) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = undefined;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst,
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, new Set);
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== undefined)
          propValues[key].add(undefined);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo = globalConfig.memoizer;
  const generateFastpass = (shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo, syms });
    const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== undefined;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== undefined) ? "optional" : undefined);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results, payload, inst, ctx);
    });
  };
});
function discriminatorMap(def) {
  const map = new Map;
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map.has(value)) {
        if (value !== undefined)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map.set(value, null);
      } else {
        map.set(value, option);
      }
    }
  }
  return map;
}
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(undefined))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, new Set);
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(undefined);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const value = input?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== undefined || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value) => disc.value.get(value) !== null),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left, right]) => {
        return handleIntersectionResults(payload, left, right);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = new Map;
  let unrecIssue;
  const keyIssues = new Map;
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo = globalConfig.memoizer;
  memo?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = new Set;
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result) => {
              if (result.issues.length) {
                payload.issues.push(...prefixIssues(key, result.issues));
              }
              payload.value[outKey] = result.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo ? memo.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result) => {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? undefined : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? new Set([...values, undefined]) : undefined;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === undefined) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result) => handleOptionalResult(payload, result));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? new Set([...zod.def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleDefaultResult(result, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleNonOptionalResult(result, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleCatchResult(payload, result, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/memoizer.js
class $ZodCyclicError extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
}
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && typeof value === "object";
}
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap;
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve) {
  const cached = recursive.get(inst);
  if (cached !== undefined)
    return cached ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check = (child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result)
        result = answer;
    }
  };
  const shape = (sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  };
  const merge = (answer) => {
    if (answer > result)
      result = answer;
  };
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge(raw ? shape(raw, true) : ASSUMED);
      check(def.catchall);
      break;
    }
    case "array":
      check(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check(el);
      check(def.rest);
      break;
    case "record":
    case "map":
      check(def.keyType);
      check(def.valueType);
      break;
    case "set":
      check(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check(el);
      break;
    case "intersection":
      check(def.left);
      check(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check(def.innerType);
      break;
    case "pipe":
      check(def.in);
      check(def.out);
      break;
    case "function":
      check(def.input);
      check(def.output);
      break;
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : undefined);
      merge(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    case "template_literal":
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check(value);
        else if (Array.isArray(value))
          for (const el of value)
            check(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = new WeakMap;
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = undefined;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a;
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError;
        return base(payload, ctx);
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (isRecursiveInst === undefined) {
          const walked = isRecursive(inst, new Set, false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input = payload.value;
        if (!isRef(input))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: new WeakMap, backEdges: undefined };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = new WeakSet);
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = undefined;
        const entry = open.length > depth ? open.pop() : undefined;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== undefined && isRef(value) && backEdges.has(value);
}
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/locales/en.js
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    currency_code: "currency code",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  function getTypeName(type, input) {
    if (type === "number" && typeof input === "number" && !Number.isFinite(input)) {
      return String(input);
    }
    return TypeDictionary[type] ?? type;
  }
  return (issue) => {
    switch (issue.code) {
      case "invalid_type": {
        const expected = getTypeName(issue.expected);
        const receivedType = parsedType(issue.input);
        const received = getTypeName(receivedType, issue.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue.values, "|")}`;
      case "too_big": {
        const adj = issue.exact ? "exactly " : issue.inclusive ? "<=" : "<";
        const sizing = getSizing(issue.origin);
        if (sizing)
          return `Too big: expected ${issue.origin ?? "value"} to have ${adj}${issue.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue.origin ?? "value"} to be ${adj}${issue.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue.exact ? "exactly " : issue.inclusive ? ">=" : ">";
        const sizing = getSizing(issue.origin);
        if (sizing) {
          return `Too small: expected ${issue.origin} to have ${adj}${issue.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue.origin} to be ${adj}${issue.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue.keys.length > 1 ? "s" : ""}: ${joinValues(issue.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue.origin}`;
      case "invalid_union":
        if (issue.options && Array.isArray(issue.options) && issue.options.length > 0) {
          const opts = issue.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/registries.js
var _a2;
class $ZodRegistry {
  constructor() {
    this._map = new WeakMap;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new WeakMap;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/api.js
function snapshotChecks(def) {
  if (def.checks)
    def.checks = [...def.checks];
  return def;
}
function _string(Class, params) {
  return new Class(snapshotChecks({ type: "string", ...normalizeParams(params) }));
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _slugify() {
  return _overwrite((input) => slugify(input));
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn, params) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source)) {
      if (Object.prototype.propertyIsEnumerable.call(source, key)) {
        assignProp(target, key, source[key]);
      }
    }
  }
  return target;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {}),
    io: params?.io ?? "output",
    counter: 0,
    seen: new Map,
    sharedDefsExtractedFor: undefined,
    sharedEmitDoneFor: undefined,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? undefined
  };
}
function handleUnrepresentable(schema, ctx, json, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === undefined || result === "throw")
    throw new Error(message);
  Object.assign(json, result);
  return true;
}
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = undefined;
  ctx.sharedEmitDoneFor = undefined;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema);
  if (meta)
    assignProps(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a = result.schema).default ?? (_a.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = new Map;
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id) => id);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema = seen.schema;
    for (const key in schema) {
      delete schema[key];
    }
    schema.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error("Cycle detected: " + `#/${seen.cycle?.join("/")}/<root>` + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== undefined)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === undefined || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
function foldObjects(members) {
  const objects = [];
  for (const member of members) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties = {};
  const required = new Set;
  for (const object of objects) {
    for (const key in object.properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key))
        continue;
      const parts = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === undefined)
          continue;
        if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts.push(part);
      }
      const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
      assignProp(properties, key, merged);
    }
    for (const key of object.required ?? [])
      required.add(key);
  }
  const folded = { type: "object", properties };
  if (required.size)
    folded.required = [...required];
  if (objects.every((object) => object.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object of objects) {
      const constraint = undeclaredConstraint(object);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
function foldIntersection(json) {
  const allOf = json.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union[k]));
    if (Object.keys(union).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union);
    const branches = union[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json.allOf;
  assignProps(json, folded);
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema = seen.def ?? seen.schema;
    const _cached = { ...schema };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema.allOf = schema.allOf ?? [];
        schema.allOf.push(refSchema);
      } else {
        assignProps(schema, refSchema);
      }
      assignProps(schema, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema,
      path: seen.path ?? []
    });
  };
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = new Map;
      for (const seen of ctx.seen.values()) {
        for (const json of [seen.schema, seen.def]) {
          const allOf = json?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json);
          else
            carriers.set(allOf, [json]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json of carriers.get(allOf) ?? [])
          foldIntersection(json);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {}
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== undefined && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {} else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: new Set };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
  if (agg[key] === undefined || value > agg[key])
    agg[key] = value;
};
var narrowMax = (agg, key, value) => {
  if (agg[key] === undefined || value < agg[key])
    agg[key] = value;
};
var narrowBoth = (agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
  agg.patterns ?? (agg.patterns = new Set);
  agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
  agg.format = format;
  if (format.includes("int"))
    agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
};
var contributors = {
  greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
  less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
  multiple_of: (agg, def) => addDivisor(agg, def.value),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: (agg, def) => narrowBoth(agg, def.length),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: (agg, def) => narrowBoth(agg, def.size),
  string_format: (agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  },
  mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== undefined)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== undefined)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== undefined)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== undefined)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== undefined)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== undefined) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
};
var exactPatterns = new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time" || laxFormat) {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json.allOf = [
        ...patternList.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = new Set;
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== undefined)
      json.multipleOf = first;
    if (rest.length)
      json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === undefined) {
      if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {} else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var customProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json, params) => {
  handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json.type = "object";
  json.properties = {};
  for (const key in shape) {
    assignProp(json.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const requiredKeys = [];
  for (const key of Object.keys(shape)) {
    const field = def.shape[key];
    if (ctx.io === "input" ? inputOptin(field) === undefined : field._zod.optout === undefined) {
      requiredKeys.push(key);
    }
  }
  if (requiredKeys.length > 0) {
    json.required = requiredKeys;
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => ("allOf" in val) && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
  ctx.intersections.push(allOf);
};
function stringifyKeyNames(bySchema, json, visited) {
  if (json.$ref) {
    if (visited.has(json))
      return json;
    visited.add(json);
    const def = bySchema.get(json)?.def;
    if (!def)
      return json;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json = { ...json, [keyword]: mapped };
  }
  const types = Array.isArray(json.type) ? json.type : [json.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json.enum ?? (json.const !== undefined ? [json.const] : undefined);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
var pendingRecords = new WeakMap;
function rewriteKeyNames(ctx) {
  const bySchema = new Map;
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = new Map;
  for (const record of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, new Set);
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
var recordProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== undefined;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues.map(String);
    }
  }
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json.default = value;
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json._prefault = value;
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(undefined);
  } catch {
    handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
  _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
  _lazyMethod(proto, "addIssue", (self) => (issue) => {
    self.issues.push(issue);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self) => (issues) => {
    self.issues.push(...issues);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, undefined, {
  Parent: Error
});

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/.bun/zod@4.6.5/node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta) {
    reg.add(this, meta);
    return this;
  },
  refine(check, params) {
    return this.check(refine(check, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(_overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(undefined).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  get "~standard"() {
    return hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  },
  parse: function _parse(data, params) {
    return parse2(this, data, params, { callee: _parse });
  },
  parseAsync: async function _parseAsync(data, params) {
    return await parseAsync(this, data, params, { callee: _parseAsync });
  },
  safeParse(data, params) {
    return safeParse(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync(this, data, params);
  },
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: function _encode(data, params) {
    return encode(this, data, params, { callee: _encode });
  },
  decode: function _decode(data, params) {
    return decode(this, data, params, { callee: _decode });
  },
  encodeAsync: async function _encodeAsync(data, params) {
    return await encodeAsync(this, data, params, { callee: _encodeAsync });
  },
  decodeAsync: async function _decodeAsync(data, params) {
    return await decodeAsync(this, data, params, { callee: _decodeAsync });
  },
  safeEncode(data, params) {
    return safeEncode(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  get description() {
    return globalRegistry.get(this)?.description;
  },
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
}, /* @__PURE__ */ derived({
  format: (inst) => aggregateChecks(inst).format ?? null,
  minLength: (inst) => aggregateChecks(inst).minimum ?? null,
  maxLength: (inst) => aggregateChecks(inst).maximum ?? null
}, {
  regex(...args) {
    return this.check(_regex(...args));
  },
  includes(...args) {
    return this.check(_includes(...args));
  },
  startsWith(...args) {
    return this.check(_startsWith(...args));
  },
  endsWith(...args) {
    return this.check(_endsWith(...args));
  },
  min(...args) {
    return this.check(_minLength(...args));
  },
  max(...args) {
    return this.check(_maxLength(...args));
  },
  length(...args) {
    return this.check(_length(...args));
  },
  nonempty(...args) {
    return this.check(_minLength(1, ...args));
  },
  lowercase(params) {
    return this.check(_lowercase(params));
  },
  uppercase(params) {
    return this.check(_uppercase(params));
  },
  trim() {
    return this.check(_trim());
  },
  normalize(...args) {
    return this.check(_normalize(...args));
  },
  toLowerCase() {
    return this.check(_toLowerCase());
  },
  toUpperCase() {
    return this.check(_toUpperCase());
  },
  slugify() {
    return this.check(_slugify());
  }
}));
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(_email(ZodEmail, params));
  },
  url(params) {
    return this.check(_url(ZodURL, params));
  },
  jwt(params) {
    return this.check(_jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(_emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(_guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(_uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(_uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(_uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(_uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(_nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(_cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(_cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(_ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(_base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(_base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(_xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(_ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(_ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(_ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(_cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(_cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(_e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(_isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(_isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(_isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(_isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
  inst.isFinite = true;
}, /* @__PURE__ */ derived({
  minValue: (inst) => {
    const { minimum, exclusiveMinimum } = aggregateChecks(inst);
    return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
  },
  maxValue: (inst) => {
    const { maximum, exclusiveMaximum } = aggregateChecks(inst);
    return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
  },
  isInt: (inst) => {
    const { isInt, multipleOf } = aggregateChecks(inst);
    return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
  },
  format: (inst) => aggregateChecks(inst).format ?? null
}, {
  gt(value, params) {
    return this.check(_gt(value, params));
  },
  gte(value, params) {
    return this.check(_gte(value, params));
  },
  min(value, params) {
    return this.check(_gte(value, params));
  },
  lt(value, params) {
    return this.check(_lt(value, params));
  },
  lte(value, params) {
    return this.check(_lte(value, params));
  },
  max(value, params) {
    return this.check(_lte(value, params));
  },
  int(params) {
    return this.check(int(params));
  },
  safe(params) {
    return this.check(int(params));
  },
  positive(params) {
    return this.check(_gt(0, params));
  },
  nonnegative(params) {
    return this.check(_gte(0, params));
  },
  negative(params) {
    return this.check(_lt(0, params));
  },
  nonpositive(params) {
    return this.check(_lte(0, params));
  },
  multipleOf(value, params) {
    return this.check(_multipleOf(value, params));
  },
  step(value, params) {
    return this.check(_multipleOf(value, params));
  },
  finite() {
    return this;
  }
}));
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(_minLength(n, params));
  },
  nonempty(params) {
    return this.check(_minLength(1, params));
  },
  max(n, params) {
    return this.check(_maxLength(n, params));
  },
  length(n, params) {
    return this.check(_length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
  keyof() {
    return _enum(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(mergeDefs(this._zod.def, { catchall: undefined }));
  },
  extend(incoming) {
    return extend(this, incoming);
  },
  safeExtend(incoming) {
    return safeExtend(this, incoming);
  },
  merge(other) {
    return merge(this, other);
  },
  pick(mask) {
    return pick(this, mask);
  },
  omit(mask) {
    return omit(this, mask);
  },
  partial(...args) {
    return partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: never(),
    ...normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => recordProcessor(inst, ctx, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output) => {
        payload.value = output;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
// node_modules/.bun/yaml@2.9.1/node_modules/yaml/dist/index.js
var composer = require_composer();
var Document = require_Document();
var Schema = require_Schema();
var errors2 = require_errors();
var Alias = require_Alias();
var identity = require_identity();
var Pair = require_Pair();
var Scalar = require_Scalar();
var YAMLMap = require_YAMLMap();
var YAMLSeq = require_YAMLSeq();
var cst = require_cst();
var lexer = require_lexer();
var lineCounter = require_line_counter();
var parser = require_parser();
var publicApi = require_public_api();
var visit = require_visit();
var $Composer = composer.Composer;
var $Document = Document.Document;
var $Schema = Schema.Schema;
var $YAMLError = errors2.YAMLError;
var $YAMLParseError = errors2.YAMLParseError;
var $YAMLWarning = errors2.YAMLWarning;
var $Alias = Alias.Alias;
var $isAlias = identity.isAlias;
var $isCollection = identity.isCollection;
var $isDocument = identity.isDocument;
var $isMap = identity.isMap;
var $isNode = identity.isNode;
var $isPair = identity.isPair;
var $isScalar = identity.isScalar;
var $isSeq = identity.isSeq;
var $Pair = Pair.Pair;
var $Scalar = Scalar.Scalar;
var $YAMLMap = YAMLMap.YAMLMap;
var $YAMLSeq = YAMLSeq.YAMLSeq;
var $Lexer = lexer.Lexer;
var $LineCounter = lineCounter.LineCounter;
var $Parser = parser.Parser;
var $parse = publicApi.parse;
var $parseAllDocuments = publicApi.parseAllDocuments;
var $parseDocument = publicApi.parseDocument;
var $stringify = publicApi.stringify;
var $visit = visit.visit;
var $visitAsync = visit.visitAsync;

// packages/sources/src/discovery.ts
var httpsUrl = url().refine((value) => value.startsWith("https://"));
var configEntrySchema = union([
  object({ readme: string2().min(1) }),
  object({ docs: string2().min(1) }),
  object({ wiki: literal(true) }),
  object({ man: string2().min(1) }),
  object({
    confluence: object({ site: string2().min(1), pages: array(httpsUrl) })
  }),
  object({ url: httpsUrl, owner: string2().min(1).optional() })
]);
var configSchema = object({
  sources: array(configEntrySchema).default([])
});
// config/limits.ts
var maxCandidateFileBytes = 2 * 1024 * 1024;
var maxSavedPlanBytes = 2 * 1024 * 1024;
var maxSourceHtmlBytes = 2 * 1024 * 1024;

// packages/sources/src/fetch.ts
var pageSchema = object({
  id: string2(),
  version: object({ number: number2() }),
  body: object({ storage: object({ value: string2() }) })
});
// packages/sources/src/html.ts
var import_readability = __toESM(require_readability(), 1);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/symbols.js
var CHANGED = Symbol("changed");
var CLASS_LIST = Symbol("classList");
var CUSTOM_ELEMENTS = Symbol("CustomElements");
var CONTENT = Symbol("content");
var DATASET = Symbol("dataset");
var DOCTYPE = Symbol("doctype");
var DOM_PARSER = Symbol("DOMParser");
var END = Symbol("end");
var EVENT_TARGET = Symbol("EventTarget");
var GLOBALS = Symbol("globals");
var IMAGE = Symbol("image");
var MIME = Symbol("mime");
var MUTATION_OBSERVER = Symbol("MutationObserver");
var NEXT = Symbol("next");
var OWNER_ELEMENT = Symbol("ownerElement");
var PREV = Symbol("prev");
var PRIVATE = Symbol("private");
var SHEET = Symbol("sheet");
var START = Symbol("start");
var STYLE = Symbol("style");
var UPGRADE = Symbol("upgrade");
var VALUE = Symbol("value");

// node_modules/.bun/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/index.js
var exports_esm3 = {};
__export(exports_esm3, {
  DefaultHandler: () => DomHandler,
  DomHandler: () => DomHandler,
  DomUtils: () => exports_esm2,
  ElementType: () => exports_esm,
  Parser: () => Parser,
  QuoteType: () => QuoteType,
  Tokenizer: () => Tokenizer,
  createDocumentStream: () => createDocumentStream,
  createDomStream: () => createDomStream,
  getFeed: () => getFeed,
  parseDOM: () => parseDOM,
  parseDocument: () => parseDocument,
  parseFeed: () => parseFeed
});

// node_modules/.bun/entities@7.0.1/node_modules/entities/dist/esm/decode-codepoint.js
var _a3;
var decodeMap = new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
var fromCodePoint = (_a3 = String.fromCodePoint) !== null && _a3 !== undefined ? _a3 : (codePoint) => {
  let output = "";
  if (codePoint > 65535) {
    codePoint -= 65536;
    output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
    codePoint = 56320 | codePoint & 1023;
  }
  output += String.fromCharCode(codePoint);
  return output;
};
function replaceCodePoint(codePoint) {
  var _a;
  if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
    return 65533;
  }
  return (_a = decodeMap.get(codePoint)) !== null && _a !== undefined ? _a : codePoint;
}

// node_modules/.bun/entities@7.0.1/node_modules/entities/dist/esm/internal/decode-shared.js
function decodeBase64(input) {
  const binary = typeof atob === "function" ? atob(input) : typeof Buffer.from === "function" ? Buffer.from(input, "base64").toString("binary") : new Buffer(input, "base64").toString("binary");
  const evenLength = binary.length & ~1;
  const out = new Uint16Array(evenLength / 2);
  for (let index = 0, outIndex = 0;index < evenLength; index += 2) {
    const lo = binary.charCodeAt(index);
    const hi = binary.charCodeAt(index + 1);
    out[outIndex++] = lo | hi << 8;
  }
  return out;
}

// node_modules/.bun/entities@7.0.1/node_modules/entities/dist/esm/generated/decode-data-html.js
var htmlDecodeTree = /* @__PURE__ */ decodeBase64("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWlsN2E6ZHIAAOA12CjdciJlZW4AOGFjAHkARWRjAHkAXGRwAGYAAOA12FzdYwByAADgNdjA3IALQUJFSGFiY2RlZmdoamxtbm9wcnN0dXYAXhxtHHEcdRx5HN8cBx0dHTwd3B3tHfEdAR4EHh0eLB5FHrwewx7hHgkfPR9LH4ABYXJ0AGQcZxxpHHIA8gBvB/IAxQLhIWlsAKAbKeEhcnIAoA4pZ6BmIgCgiyphAHIAAKBiKWMJjRwAAJAcAACVHAAAAAAAAAAAAACZHJwcAACmHKgcrRwAANIc9SF0ZTph7SJwdHl2AKC0KXIAYQDuAFoG4iFkYbtjZwAAoegnZGyhHKMcAKCRKeUAiwYAoIUqdQBvADuAqwCrQHIAgKOQIWJmaGxwc3QAuhy/HMIcxBzHHMoczhxmoOQhcwAAoB8pcwAAoB0p6wCyGnAAAKCrIWwAAKA5KWkAbQAAoHMpbAAAoKIhAKGrKmFl1hzaHGkAbAAAoBkpc6CtKgDgrSoA/oABYWJyAOUc6RztHHIAcgAAoAwpcgBrAACgcicAAWFr8Rz4HGMAAAFla/Yc9xx7YFtgAAFlc/wc/hwAoIspbAAAAWR1Ax0FHQCgjykAoI0pAAJhZXV5Dh0RHRodHB3yIW9uPmEAAWRpFR0YHWkAbAA8YewAowbiAPccO2QAAmNxcnMkHScdLB05HWEAAKA2KXUAbwDyoBwgqhEAAWR1MB00HeghYXIAoGcpcyJoYXIAAKBLKWgAAKCyIQCiZCJmZ3FzRB1FB5Qdnh10AIACYWhscnQATh1WHWUdbB2NHXIicm93AHSgkCFhAOkAzxxhI3Jwb29uAAABZHVeHWId7yF3bgCgvSFwAACgvCHlJGZ0YXJyb3dzAKDHIWkiZ2h0AIABYWhzAHUdex2DHXIicm93APOglCGdBmEAcgBwAG8AbwBuAPMAzgtxAHUAaQBnAGEAcgByAG8A9wBlGugkcmVldGltZXMAoMsi8aFkIk0HAACaHWwAYQBuAPQAXgcAon0qY2Rnc6YdqR2xHbcdYwAAoKgqbwB0AG+gfypyoIEqAKCDKmXg2iIA/nMAAKCTKoACYWRlZ3MAwB3GHcod1h3ZHXAAcAByAG8A+ACmHG8AdAAAoNYicQAAAWdxzx3SHXQA8gBGB2cAdADyAHQcdADyAFMHaQDtAGMHgAFpbHIA4h3mHeod8yFodACgfClvAG8A8gDKBgDgNdgp3UWgdiIAoJEqYQH1Hf4dcgAAAWR1YB35HWygvCEAoGopbABrAACghCVjAHkAWWQAomoiYWNodAweDx4VHhkecgDyAGsdbwByAG4AZQDyAGAW4SFyZACgaylyAGkAAKD6JQABaW8hHiQe5CFvdEBh9SFzdGGgsCPjIWhlAKCwIwACRWFlczMeNR48HkEeAKBoInAAcKCJKvIhb3gAoIkqcaCHKvGghyo0HmkAbQAAoOYiAARhYm5vcHR3elIeXB5fHoUelh6mHqsetB4AAW5yVh5ZHmcAAKDsJ3IAAKD9IXIA6wCwBmcAgAFsbXIAZh52Hnse5SFmdAABYXKIB2weaQBnAGgAdABhAHIAcgBvAPcAkwfhInBzdG8AoPwnaQBnAGgAdABhAHIAcgBvAPcAmgdwI2Fycm93AAABbHKNHpEeZQBmAPQAxhxpImdodAAAoKwhgAFhZmwAnB6fHqIecgAAoIUpAOA12F3ddQBzAACgLSppIm1lcwAAoDQqYQGvHrMecwB0AACgFyLhAIoOZaHKJbkeRhLuIWdlAKDKJWEAcgBsoCgAdAAAoJMpgAJhY2htdADMHs8e1R7bHt0ecgDyAJ0GbwByAG4AZQDyANYWYQByAGSgyyEAoG0pAKAOIHIAaQAAoL8iAANhY2hpcXTrHu8e1QfzHv0eBh/xIXVvAKA5IHIAAOA12MHcbQDloXIi+h4AAPweAKCNKgCgjyoAAWJ19xwBH28AcqAYIACgGiDyIW9rQmEAhDwAO2NkaGlscXJCBhcfxh0gHyQfKB8sHzEfAAFjaRsfHR8AoKYqcgAAoHkqcgBlAOUAkx3tIWVzAKDJIuEhcnIAoHYpdSJlc3QAAKB7KgABUGk1HzkfYQByAACglillocMlAgdfEnIAAAFkdUIfRx9zImhhcgAAoEop6CFhcgCgZikAAWVuTx9WH3IjdG5lcXEAAOBoIgD+xQBUHwAHRGFjZGVmaGlsbm9wc3VuH3Ifoh+rH68ftx+7H74f5h/uH/MfBwj/HwsgxCFvdACgOiIAAmNscHJ5H30fiR+eH3IAO4CvAK9AAAFldIEfgx8AoEImZaAgJ3MAZQAAoCAnc6CmIXQAbwCAoaYhZGx1AJQfmB+cH28AdwDuAHkDZQBmAPQA6gbwAOkO6yFlcgCgriUAAW95ph+qH+0hbWEAoCkqPGThIXNoAKAUIOElc3VyZWRhbmdsZQCgISJyAADgNdgq3W8AAKAnIYABY2RuAMQfyR/bH3IAbwA7gLUAtUBhoiMi0B8AANMf1x9zAPQAKxFpAHIAAKDwKm8AdAA7gLcAt0B1AHMA4qESIh4TAADjH3WgOCIAoCoqYwHqH+0fcAAAoNsq8gB+GnAAbAB1APMACAgAAWRw9x/7H+UhbHMAoKciZgAA4DXYXt0AAWN0AyAHIHIAAOA12MLc8CFvcwCgPiJsobwDECAVIPQiaW1hcACguCJhAPAAEyAADEdMUlZhYmNkZWZnaGlqbG1vcHJzdHV2dzwgRyBmIG0geSCqILgg2iDeIBEhFSEyIUMhTSFQIZwhnyHSIQAiIyKLIrEivyIUIwABZ3RAIEMgAODZIjgD9uBrItIgBwmAAWVsdABNIF8gYiBmAHQAAAFhclMgWCByInJvdwAAoM0h6SRnaHRhcnJvdwCgziEA4NgiOAP24Goi0iBfCekkZ2h0YXJyb3cAoM8hAAFEZHEgdSDhIXNoAKCvIuEhc2gAoK4igAJiY25wdACCIIYgiSCNIKIgbABhAACgByL1IXRlRGFnAADgICLSIACiSSJFaW9wlSCYIJwgniAA4HAqOANkAADgSyI4A3MASWFyAG8A+AAyCnUAcgBhoG4mbADzoG4mmwjzAa8gAACzIHAAO4CgAKBAbQBwAOXgTiI4AyoJgAJhZW91eQDBIMogzSDWINkg8AHGIAAAyCAAoEMqbwBuAEhh5CFpbEZhbgBnAGSgRyJvAHQAAOBtKjgDcAAAoEIqPWThIXNoAKATIACjYCJBYWRxc3jpIO0g+SD+IAIhDCFyAHIAAKDXIXIAAAFocvIg9SBrAACgJClvoJch9wAGD28AdAAA4FAiOAN1AGkA9gC7CAABZWkGIQohYQByAACgKCntAN8I6SFzdPOgBCLlCHIAAOA12CvdAAJFZXN0/wgcISshLiHxoXEiIiEAABMJ8aFxIgAJAAAnIWwAYQBuAPQAEwlpAO0AGQlyoG8iAKBvIoABQWFwADghOyE/IXIA8gBeIHIAcgAAoK4hYQByAACg8ipzogsiSiEAAAAAxwtkoPwiAKD6ImMAeQBaZIADQUVhZGVzdABcIV8hYiFmIWkhkyGWIXIA8gBXIADgZiI4A3IAcgAAoJohcgAAoCUggKFwImZxcwBwIYQhjiF0AAABYXJ1IXohcgByAG8A9wBlIWkAZwBoAHQAYQByAHIAbwD3AD4h8aFwImAhAACKIWwAYQBuAPQAZwlz4H0qOAMAoG4iaQDtAG0JcqBuImkA5aDqIkUJaQDkADoKAAFwdKMhpyFmAADgNdhf3YCBrAA7aW4AriGvIcchrEBuAIChCSJFZHYAtyG6Ib8hAOD5IjgDbwB0AADg9SI4A+EB1gjEIcYhAKD3IgCg9iJpAHagDCLhAagJzyHRIQCg/iIAoP0igAFhb3IA2CHsIfEhcgCAoSYiYXN0AOAh5SHpIWwAbABlAOwAywhsAADg/SrlIADgAiI4A2wiaW50AACgFCrjoYAi9yEAAPohdQDlAJsJY+CvKjgDZaCAIvEAkwkAAkFhaXQHIgoiFyIeInIA8gBsIHIAcgAAoZshY3cRIhQiAOAzKTgDAOCdITgDZyRodGFycm93AACgmyFyAGkA5aDrIr4JgANjaGltcHF1AC8iPCJHIpwhTSJQIloigKGBImNlcgA2Iv0JOSJ1AOUABgoA4DXYw9zvIXJ0bQKdIQAAAABEImEAcgDhAOEhbQBloEEi8aBEIiYKYQDyAMsIcwB1AAABYnBWIlgi5QDUCeUA3wmAAWJjcABgInMieCKAoYQiRWVzAGci7glqIgDgxSo4A2UAdABl4IIi0iBxAPGgiCJoImMAZaCBIvEA/gmAoYUiRWVzAH8iFgqCIgDgxio4A2UAdABl4IMi0iBxAPGgiSKAIgACZ2lscpIilCKaIpwi7AAMCWwAZABlADuA8QDxQOcAWwlpI2FuZ2xlAAABbHKkIqoi5SFmdGWg6iLxAEUJaSJnaHQAZaDrIvEAvgltoL0DAKEjAGVzuCK8InIAbwAAoBYhcAAAoAcggARESGFkZ2lscnMAziLSItYi2iLeIugi7SICIw8j4SFzaACgrSLhIXJyAKAEKXAAAOBNItIg4SFzaACgrCIAAWV04iLlIgDgZSLSIADgPgDSIG4iZmluAACg3imAAUFldADzIvci+iJyAHIAAKACKQDgZCLSIHLgPADSIGkAZQAA4LQi0iAAAUF0BiMKI3IAcgAAoAMp8iFpZQDgtSLSIGkAbQAA4Dwi0iCAAUFhbgAaIx4jKiNyAHIAAKDWIXIAAAFociMjJiNrAACgIylvoJYh9wD/DuUhYXIAoCcpUxJqFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVCMAAF4jaSN/I4IjjSOeI8AUAAAAAKYjwCMAANoj3yMAAO8jHiQvJD8kRCQAAWNzVyNsFHUAdABlADuA8wDzQAABaXlhI2cjcgBjoJoiO4D0APRAPmSAAmFiaW9zAHEjdCN3I3EBeiNzAOgAdhTsIWFjUWF2AACgOCrvIWxkAKC8KewhaWdTYQABY3KFI4kjaQByAACgvykA4DXYLN1vA5QjAAAAAJYjAACcI24A22JhAHYAZQA7gPIA8kAAoMEpAAFibaEjjAphAHIAAKC1KQACYWNpdKwjryO6I70jcgDyAFkUAAFpcrMjtiNyAACgvinvIXNzAKC7KW4A5QDZCgCgwCmAAWFlaQDFI8gjyyNjAHIATWFnAGEAyWOAAWNkbgDRI9Qj1iPyIW9uv2MAoLYpdQDzAHgBcABmAADgNdhg3YABYWVsAOQj5yPrI3IAAKC3KXIAcAAAoLkpdQDzAHwBAKMoImFkaW9zdvkj/CMPJBMkFiQbJHIA8gBeFIChXSplZm0AAyQJJAwkcgBvoDQhZgAAoDQhO4CqAKpAO4C6ALpA5yFvZgCgtiJyAACgVipsIm9wZQAAoFcqAKBbKoABY2xvACMkJSQrJPIACCRhAHMAaAA7gPgA+EBsAACgmCJpAGwBMyQ4JGQAZQA7gPUA9UBlAHMAYaCXInMAAKA2Km0AbAA7gPYA9kDiIWFyAKA9I+EKXiQAAHokAAB8JJQkAACYJKkkAAAAALUkEQsAAPAkAAAAAAQleiUAAIMlcgCAoSUiYXN0AGUkbyQBCwCBtgA7bGokayS2QGwAZQDsABgDaQJ1JAAAAAB4JG0AAKDzKgCg/Sp5AD9kcgCAAmNpbXB0AIUkiCSLJJkSjyRuAHQAJWBvAGQALmBpAGwAAKAwIOUhbmsAoDEgcgAA4DXYLd2AAWltbwCdJKAkpCR2oMYD1WNtAGEA9AD+B24AZQAAoA4m9KHAA64kAAC0JGMjaGZvcmsAAKDUItZjAAFhdbgkxCRuAAABY2u9JMIkawBooA8hAKAOIfYAaRpzAACkKwBhYmNkZW1zdNMkIRPXJNsk4STjJOck6yTjIWlyAKAjKmkAcgAAoCIqAAFvdYsW3yQAoCUqAKByKm4AO4CxALFAaQBtAACgJip3AG8AAKAnKoABaXB1APUk+iT+JO4idGludACgFSpmAADgNdhh3W4AZAA7gKMAo0CApHoiRWFjZWlub3N1ABMlFSUYJRslTCVRJVklSSV1JQCgsypwAACgtyp1AOUAPwtjoK8qgKJ6ImFjZW5zACclLSU0JTYlSSVwAHAAcgBvAPgAFyV1AHIAbAB5AGUA8QA/C/EAOAuAAWFlcwA8JUElRSXwInByb3gAoLkqcQBxAACgtSppAG0AAKDoImkA7QBEC20AZQDzoDIgIguAAUVhcwBDJVclRSXwAEAlgAFkZnAATwtfJXElgAFhbHMAZSVpJW0l7CFhcgCgLiPpIW5lAKASI/UhcmYAoBMjdKAdIu8AWQvyIWVsAKCwIgABY2l9JYElcgAA4DXYxdzIY24iY3NwAACgCCAAA2Zpb3BzdZElKxuVJZolnyWkJXIAAOA12C7dcABmAADgNdhi3XIiaW1lAACgVyBjAHIAAOA12MbcgAFhZW8AqiW6JcAldAAAAWVpryW2JXIAbgBpAG8AbgDzABkFbgB0AACgFipzAHQAZaA/APEACRj0AG0LgApBQkhhYmNkZWZoaWxtbm9wcnN0dXgA4yXyJfYl+iVpJpAmpia9JtUm5ib4JlonaCdxJ3UnnietJ7EnyCfiJ+cngAFhcnQA6SXsJe4lcgDyAJkM8gD6AuEhaWwAoBwpYQByAPIA3BVhAHIAAKBkKYADY2RlbnFydAAGJhAmEyYYJiYmKyZaJgABZXUKJg0mAOA9IjEDdABlAFVhaQDjACAN7SJwdHl2AKCzKWcAgKHpJ2RlbAAgJiImJCYAoJIpAKClKeUA9wt1AG8AO4C7ALtAcgAApZIhYWJjZmhscHN0dz0mQCZFJkcmSiZMJk4mUSZVJlgmcAAAoHUpZqDlIXMAAKAgKQCgMylzAACgHinrALka8ACVHmwAAKBFKWkAbQAAoHQpbAAAoKMhAKCdIQABYWleJmImaQBsAACgGilvAG6gNiJhAGwA8wB2C4ABYWJyAG8mciZ2JnIA8gAvEnIAawAAoHMnAAFha3omgSZjAAABZWt/JoAmfWBdYAABZXOFJocmAKCMKWwAAAFkdYwmjiYAoI4pAKCQKQACYWV1eZcmmiajJqUm8iFvbllhAAFkaZ4moSZpAGwAV2HsAA8M4gCAJkBkAAJjbHFzrSawJrUmuiZhAACgNylkImhhcgAAoGkpdQBvAPKgHSCjAWgAAKCzIYABYWNnAMMm0iaUC2wAgKEcIWlwcwDLJs4migxuAOUAoAxhAHIA9ADaC3QAAKCtJYABaWxyANsm3ybjJvMhaHQAoH0pbwBvAPIANgwA4DXYL90AAWFv6ib1JnIAAAFkde8m8SYAoMEhbKDAIQCgbCl2oMED8WOAAWducwD+Jk4nUCdoAHQAAANhaGxyc3QKJxInISc1Jz0nRydyInJvdwB0oJIhYQDpAFYmYSNycG9vbgAAAWR1GiceJ28AdwDuAPAmcAAAoMAh5SFmdAABYWgnJy0ncgByAG8AdwDzAAkMYQByAHAAbwBvAG4A8wATBGklZ2h0YXJyb3dzAACgySFxAHUAaQBnAGEAcgByAG8A9wBZJugkcmVldGltZXMAoMwiZwDaYmkAbgBnAGQAbwB0AHMAZQDxABwYgAFhaG0AYCdjJ2YncgDyAAkMYQDyABMEAKAPIG8idXN0AGGgsSPjIWhlAKCxI+0haWQAoO4qAAJhYnB0fCeGJ4knmScAAW5ygCeDJ2cAAKDtJ3IAAKD+IXIA6wAcDIABYWZsAI8nkieVJ3IAAKCGKQDgNdhj3XUAcwAAoC4qaSJtZXMAAKA1KgABYXCiJ6gncgBnoCkAdAAAoJQp7yJsaW50AKASKmEAcgDyADwnAAJhY2hxuCe8J6EMwCfxIXVvAKA6IHIAAOA12MfcAAFidYAmxCdvAPKgGSCoAYABaGlyAM4n0ifWJ3IAZQDlAE0n7SFlcwCgyiJpAIChuSVlZmwAXAxjEt4n9CFyaQCgzinsInVoYXIAoGgpAKAeIWENBSgJKA0oSyhVKIYoAACLKLAoAAAAAOMo5ygAABApJCkxKW0pcSmHKaYpAACYKgAAAACxKmMidXRlAFthcQB1AO8ABR+ApHsiRWFjZWlucHN5ABwoHignKCooLygyKEEoRihJKACgtCrwASMoAAAlKACguCpvAG4AYWF1AOUAgw1koLAqaQBsAF9hcgBjAF1hgAFFYXMAOCg6KD0oAKC2KnAAAKC6KmkAbQAAoOki7yJsaW50AKATKmkA7QCIDUFkbwB0AGKixSKRFgAAAABTKACgZiqAA0FhY21zdHgAYChkKG8ocyh1KHkogihyAHIAAKDYIXIAAAFocmkoayjrAJAab6CYIfcAzAd0ADuApwCnQGkAO2D3IWFyAKApKW0AAAFpbn4ozQBuAHUA8wDOAHQAAKA2J3IA7+A12DDdIxkAAmFjb3mRKJUonSisKHIAcAAAoG8mAAFoeZkonChjAHkASWRIZHIAdABtAqUoAAAAAKgoaQDkAFsPYQByAGEA7ABsJDuArQCtQAABZ22zKLsobQBhAAChwwNmdroouijCY4CjPCJkZWdsbnByAMgozCjPKNMo1yjaKN4obwB0AACgairxoEMiCw5FoJ4qAKCgKkWgnSoAoJ8qZQAAoEYi7CF1cwCgJCrhIXJyAKByKWEAcgDyAPwMAAJhZWl07Sj8KAEpCCkAAWxz8Sj4KGwAcwBlAHQAbQDpAH8oaABwAACgMyrwImFyc2wAoOQpAAFkbFoPBSllAACgIyNloKoqc6CsKgDgrCoA/oABZmxwABUpGCkfKfQhY3lMZGKgLwBhoMQpcgAAoD8jZgAA4DXYZN1hAAABZHIoKRcDZQBzAHWgYCZpAHQAAKBgJoABY3N1ADYpRilhKQABYXU6KUApcABzoJMiAOCTIgD+cABzoJQiAOCUIgD+dQAAAWJwSylWKQChjyJlcz4NUCllAHQAZaCPIvEAPw0AoZAiZXNIDVspZQB0AGWgkCLxAEkNAKGhJWFmZilbBHIAZQFrKVwEAKChJWEAcgDyAAMNAAJjZW10dyl7KX8pgilyAADgNdjI3HQAbQDuAM4AaQDsAAYpYQByAOYAVw0AAWFyiimOKXIA5qAGJhESAAFhbpIpoylpImdodAAAAWVwmSmgKXAAcwBpAGwAbwDuANkXaADpAKAkcwCvYIACYmNtbnAArin8KY4NJSooKgCkgiJFZGVtbnByc7wpvinCKcgpzCnUKdgp3CkAoMUqbwB0AACgvSpkoIYibwB0AACgwyr1IWx0AKDBKgABRWXQKdIpAKDLKgCgiiLsIXVzAKC/KuEhcnIAoHkpgAFlaXUA4inxKfQpdAAAoYIiZW7oKewpcQDxoIYivSllAHEA8aCKItEpbQAAoMcqAAFicPgp+ikAoNUqAKDTKmMAgKJ7ImFjZW5zAAcqDSoUKhYqRihwAHAAcgBvAPgAIyh1AHIAbAB5AGUA8QCDDfEAfA2AAWFlcwAcKiIqPShwAHAAcgBvAPgAPChxAPEAOShnAACgaiYApoMiMTIzRWRlaGxtbnBzPCo/KkIqRSpHKlIqWCpjKmcqaypzKncqO4C5ALlAO4CyALJAO4CzALNAAKDGKgABb3NLKk4qdAAAoL4qdQBiAACg2CpkoIcibwB0AACgxCpzAAABb3VdKmAqbAAAoMknYgAAoNcq4SFycgCgeyn1IWx0AKDCKgABRWVvKnEqAKDMKgCgiyLsIXVzAKDAKoABZWl1AH0qjCqPKnQAAKGDImVugyqHKnEA8aCHIkYqZQBxAPGgiyJwKm0AAKDIKgABYnCTKpUqAKDUKgCg1iqAAUFhbgCdKqEqrCpyAHIAAKDZIXIAAAFocqYqqCrrAJUab6CZIfcAxQf3IWFyAKAqKWwAaQBnADuA3wDfQOELzyrZKtwq6SrsKvEqAAD1KjQrAAAAAAAAAAAAAEwrbCsAAHErvSsAAAAAAADRK3IC1CoAAAAA2CrnIWV0AKAWI8RjcgDrAOUKgAFhZXkA4SrkKucq8iFvbmVh5CFpbGNhQmRvAPQAIg5sInJlYwAAoBUjcgAA4DXYMd0AAmVpa2/7KhIrKCsuK/IBACsAAAkrZQAAATRm6g0EK28AcgDlAOsNYQBzorgDECsAAAAAEit5AG0A0WMAAWNuFislK2sAAAFhcxsrIStwAHAAcgBvAPgAFw5pAG0AAKA8InMA8AD9DQABYXMsKyEr8AAXDnIAbgA7gP4A/kDsATgrOyswG2QA5QBnAmUAcwCAgdcAO2JkAEMrRCtJK9dAYaCgInIAAKAxKgCgMCqAAWVwcwBRK1MraSvhAAkh4qKkIlsrXysAAAAAYytvAHQAAKA2I2kAcgAAoPEqb+A12GXdcgBrAACg2irhAHgociJpbWUAAKA0IIABYWlwAHYreSu3K2QA5QC+DYADYWRlbXBzdACFK6MrmiunK6wrsCuzK24iZ2xlAACitSVkbHFykCuUK5ornCvvIXduAKC/JeUhZnRloMMl8QACBwCgXCJpImdodABloLkl8QBdDG8AdAAAoOwlaSJudXMAAKA6KuwhdXMAoDkqYgAAoM0p6SFtZQCgOyrlInppdW0AoOIjgAFjaHQAwivKK80rAAFyecYrySsA4DXYydxGZGMAeQBbZPIhb2tnYQABaW/UK9creAD0ANERaCJlYWQAAAFsct4r5ytlAGYAdABhAHIAcgBvAPcAXQbpJGdodGFycm93AKCgIQAJQUhhYmNkZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");

// node_modules/.bun/entities@7.0.1/node_modules/entities/dist/esm/generated/decode-data-xml.js
var xmlDecodeTree = /* @__PURE__ */ decodeBase64("AAJhZ2xxBwARABMAFQBtAg0AAAAAAA8AcAAmYG8AcwAnYHQAPmB0ADxg9SFvdCJg");

// node_modules/.bun/entities@7.0.1/node_modules/entities/dist/esm/internal/bin-trie-flags.js
var BinTrieFlags;
(function(BinTrieFlags) {
  BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
  BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
  BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));

// node_modules/.bun/entities@7.0.1/node_modules/entities/dist/esm/decode.js
var CharCodes;
(function(CharCodes) {
  CharCodes[CharCodes["NUM"] = 35] = "NUM";
  CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
  CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
  CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
  CharCodes[CharCodes["NINE"] = 57] = "NINE";
  CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
  CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
  CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
  CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
  CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
  CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
  CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
function isNumber(code) {
  return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState) {
  EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode) {
  DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
  DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
  DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));

class EntityDecoder {
  constructor(decodeTree, emitCodePoint, errors) {
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
    this.state = EntityDecoderState.EntityStart;
    this.consumed = 1;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.decodeMode = DecodingMode.Strict;
    this.runConsumed = 0;
  }
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
    this.runConsumed = 0;
  }
  write(input, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart: {
        if (input.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(input, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(input, offset);
      }
      case EntityDecoderState.NumericStart: {
        return this.stateNumericStart(input, offset);
      }
      case EntityDecoderState.NumericDecimal: {
        return this.stateNumericDecimal(input, offset);
      }
      case EntityDecoderState.NumericHex: {
        return this.stateNumericHex(input, offset);
      }
      case EntityDecoderState.NamedEntity: {
        return this.stateNamedEntity(input, offset);
      }
    }
  }
  stateNumericStart(input, offset) {
    if (offset >= input.length) {
      return -1;
    }
    if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(input, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(input, offset);
  }
  stateNumericHex(input, offset) {
    while (offset < input.length) {
      const char = input.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
        this.result = this.result * 16 + digit;
        this.consumed++;
        offset++;
      } else {
        return this.emitNumericEntity(char, 3);
      }
    }
    return -1;
  }
  stateNumericDecimal(input, offset) {
    while (offset < input.length) {
      const char = input.charCodeAt(offset);
      if (isNumber(char)) {
        this.result = this.result * 10 + (char - CharCodes.ZERO);
        this.consumed++;
        offset++;
      } else {
        return this.emitNumericEntity(char, 2);
      }
    }
    return -1;
  }
  emitNumericEntity(lastCp, expectedLength) {
    var _a;
    if (this.consumed <= expectedLength) {
      (_a = this.errors) === null || _a === undefined || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) {
      this.consumed += 1;
    } else if (this.decodeMode === DecodingMode.Strict) {
      return 0;
    }
    this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) {
        this.errors.missingSemicolonAfterCharacterReference();
      }
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  stateNamedEntity(input, offset) {
    const { decodeTree } = this;
    let current = decodeTree[this.treeIndex];
    let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
    while (offset < input.length) {
      if (valueLength === 0 && (current & BinTrieFlags.FLAG13) !== 0) {
        const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        if (this.runConsumed === 0) {
          const firstChar = current & BinTrieFlags.JUMP_TABLE;
          if (input.charCodeAt(offset) !== firstChar) {
            return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          }
          offset++;
          this.excess++;
          this.runConsumed++;
        }
        while (this.runConsumed < runLength) {
          if (offset >= input.length) {
            return -1;
          }
          const charIndexInPacked = this.runConsumed - 1;
          const packedWord = decodeTree[this.treeIndex + 1 + (charIndexInPacked >> 1)];
          const expectedChar = charIndexInPacked % 2 === 0 ? packedWord & 255 : packedWord >> 8 & 255;
          if (input.charCodeAt(offset) !== expectedChar) {
            this.runConsumed = 0;
            return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          }
          offset++;
          this.excess++;
          this.runConsumed++;
        }
        this.runConsumed = 0;
        this.treeIndex += 1 + (runLength >> 1);
        current = decodeTree[this.treeIndex];
        valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      }
      if (offset >= input.length)
        break;
      const char = input.charCodeAt(offset);
      if (char === CharCodes.SEMI && valueLength !== 0 && (current & BinTrieFlags.FLAG13) !== 0) {
        return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
      }
      this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
      if (this.treeIndex < 0) {
        return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      }
      current = decodeTree[this.treeIndex];
      valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      if (valueLength !== 0) {
        if (char === CharCodes.SEMI) {
          return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        }
        if (this.decodeMode !== DecodingMode.Strict && (current & BinTrieFlags.FLAG13) === 0) {
          this.result = this.treeIndex;
          this.consumed += this.excess;
          this.excess = 0;
        }
      }
      offset++;
      this.excess++;
    }
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    var _a;
    const { result, decodeTree } = this;
    const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    (_a = this.errors) === null || _a === undefined || _a.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~(BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13) : decodeTree[result + 1], consumed);
    if (valueLength === 3) {
      this.emitCodePoint(decodeTree[result + 2], consumed);
    }
    return consumed;
  }
  end() {
    var _a;
    switch (this.state) {
      case EntityDecoderState.NamedEntity: {
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      }
      case EntityDecoderState.NumericDecimal: {
        return this.emitNumericEntity(0, 2);
      }
      case EntityDecoderState.NumericHex: {
        return this.emitNumericEntity(0, 3);
      }
      case EntityDecoderState.NumericStart: {
        (_a = this.errors) === null || _a === undefined || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      case EntityDecoderState.EntityStart: {
        return 0;
      }
    }
  }
}
function determineBranch(decodeTree, current, nodeIndex, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (branchCount === 0) {
    return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
  }
  if (jumpOffset) {
    const value = char - jumpOffset;
    return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
  }
  const packedKeySlots = branchCount + 1 >> 1;
  let lo = 0;
  let hi = branchCount - 1;
  while (lo <= hi) {
    const mid = lo + hi >>> 1;
    const slot = mid >> 1;
    const packed = decodeTree[nodeIndex + slot];
    const midKey = packed >> (mid & 1) * 8 & 255;
    if (midKey < char) {
      lo = mid + 1;
    } else if (midKey > char) {
      hi = mid - 1;
    } else {
      return decodeTree[nodeIndex + packedKeySlots + mid];
    }
  }
  return -1;
}

// node_modules/.bun/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/Tokenizer.js
var CharCodes2;
(function(CharCodes) {
  CharCodes[CharCodes["Tab"] = 9] = "Tab";
  CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
  CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
  CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
  CharCodes[CharCodes["Space"] = 32] = "Space";
  CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
  CharCodes[CharCodes["Number"] = 35] = "Number";
  CharCodes[CharCodes["Amp"] = 38] = "Amp";
  CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
  CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
  CharCodes[CharCodes["Dash"] = 45] = "Dash";
  CharCodes[CharCodes["Slash"] = 47] = "Slash";
  CharCodes[CharCodes["Zero"] = 48] = "Zero";
  CharCodes[CharCodes["Nine"] = 57] = "Nine";
  CharCodes[CharCodes["Semi"] = 59] = "Semi";
  CharCodes[CharCodes["Lt"] = 60] = "Lt";
  CharCodes[CharCodes["Eq"] = 61] = "Eq";
  CharCodes[CharCodes["Gt"] = 62] = "Gt";
  CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
  CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
  CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
  CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
  CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
  CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
  CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
  CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
  CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes2 || (CharCodes2 = {}));
var State;
(function(State) {
  State[State["Text"] = 1] = "Text";
  State[State["BeforeTagName"] = 2] = "BeforeTagName";
  State[State["InTagName"] = 3] = "InTagName";
  State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
  State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
  State[State["InClosingTagName"] = 6] = "InClosingTagName";
  State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
  State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
  State[State["InAttributeName"] = 9] = "InAttributeName";
  State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
  State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
  State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
  State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
  State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
  State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
  State[State["InDeclaration"] = 16] = "InDeclaration";
  State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
  State[State["BeforeComment"] = 18] = "BeforeComment";
  State[State["CDATASequence"] = 19] = "CDATASequence";
  State[State["InSpecialComment"] = 20] = "InSpecialComment";
  State[State["InCommentLike"] = 21] = "InCommentLike";
  State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
  State[State["BeforeSpecialT"] = 23] = "BeforeSpecialT";
  State[State["SpecialStartSequence"] = 24] = "SpecialStartSequence";
  State[State["InSpecialTag"] = 25] = "InSpecialTag";
  State[State["InEntity"] = 26] = "InEntity";
})(State || (State = {}));
function isWhitespace(c) {
  return c === CharCodes2.Space || c === CharCodes2.NewLine || c === CharCodes2.Tab || c === CharCodes2.FormFeed || c === CharCodes2.CarriageReturn;
}
function isEndOfTagSection(c) {
  return c === CharCodes2.Slash || c === CharCodes2.Gt || isWhitespace(c);
}
function isASCIIAlpha(c) {
  return c >= CharCodes2.LowerA && c <= CharCodes2.LowerZ || c >= CharCodes2.UpperA && c <= CharCodes2.UpperZ;
}
var QuoteType;
(function(QuoteType) {
  QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
  QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
  QuoteType[QuoteType["Single"] = 2] = "Single";
  QuoteType[QuoteType["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
var Sequences = {
  Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
  CdataEnd: new Uint8Array([93, 93, 62]),
  CommentEnd: new Uint8Array([45, 45, 62]),
  ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
  StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
  TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101]),
  TextareaEnd: new Uint8Array([
    60,
    47,
    116,
    101,
    120,
    116,
    97,
    114,
    101,
    97
  ]),
  XmpEnd: new Uint8Array([60, 47, 120, 109, 112])
};

class Tokenizer {
  constructor({ xmlMode = false, decodeEntities = true }, cbs) {
    this.cbs = cbs;
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.entityStart = 0;
    this.baseState = State.Text;
    this.isSpecial = false;
    this.running = true;
    this.offset = 0;
    this.currentSequence = undefined;
    this.sequenceIndex = 0;
    this.xmlMode = xmlMode;
    this.decodeEntities = decodeEntities;
    this.entityDecoder = new EntityDecoder(xmlMode ? xmlDecodeTree : htmlDecodeTree, (cp, consumed) => this.emitCodePoint(cp, consumed));
  }
  reset() {
    this.state = State.Text;
    this.buffer = "";
    this.sectionStart = 0;
    this.index = 0;
    this.baseState = State.Text;
    this.currentSequence = undefined;
    this.running = true;
    this.offset = 0;
  }
  write(chunk) {
    this.offset += this.buffer.length;
    this.buffer = chunk;
    this.parse();
  }
  end() {
    if (this.running)
      this.finish();
  }
  pause() {
    this.running = false;
  }
  resume() {
    this.running = true;
    if (this.index < this.buffer.length + this.offset) {
      this.parse();
    }
  }
  stateText(c) {
    if (c === CharCodes2.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes2.Lt)) {
      if (this.index > this.sectionStart) {
        this.cbs.ontext(this.sectionStart, this.index);
      }
      this.state = State.BeforeTagName;
      this.sectionStart = this.index;
    } else if (this.decodeEntities && c === CharCodes2.Amp) {
      this.startEntity();
    }
  }
  stateSpecialStartSequence(c) {
    const isEnd = this.sequenceIndex === this.currentSequence.length;
    const isMatch = isEnd ? isEndOfTagSection(c) : (c | 32) === this.currentSequence[this.sequenceIndex];
    if (!isMatch) {
      this.isSpecial = false;
    } else if (!isEnd) {
      this.sequenceIndex++;
      return;
    }
    this.sequenceIndex = 0;
    this.state = State.InTagName;
    this.stateInTagName(c);
  }
  stateInSpecialTag(c) {
    if (this.sequenceIndex === this.currentSequence.length) {
      if (c === CharCodes2.Gt || isWhitespace(c)) {
        const endOfText = this.index - this.currentSequence.length;
        if (this.sectionStart < endOfText) {
          const actualIndex = this.index;
          this.index = endOfText;
          this.cbs.ontext(this.sectionStart, endOfText);
          this.index = actualIndex;
        }
        this.isSpecial = false;
        this.sectionStart = endOfText + 2;
        this.stateInClosingTagName(c);
        return;
      }
      this.sequenceIndex = 0;
    }
    if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
      this.sequenceIndex += 1;
    } else if (this.sequenceIndex === 0) {
      if (this.currentSequence === Sequences.TitleEnd) {
        if (this.decodeEntities && c === CharCodes2.Amp) {
          this.startEntity();
        }
      } else if (this.fastForwardTo(CharCodes2.Lt)) {
        this.sequenceIndex = 1;
      }
    } else {
      this.sequenceIndex = Number(c === CharCodes2.Lt);
    }
  }
  stateCDATASequence(c) {
    if (c === Sequences.Cdata[this.sequenceIndex]) {
      if (++this.sequenceIndex === Sequences.Cdata.length) {
        this.state = State.InCommentLike;
        this.currentSequence = Sequences.CdataEnd;
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
      }
    } else {
      this.sequenceIndex = 0;
      this.state = State.InDeclaration;
      this.stateInDeclaration(c);
    }
  }
  fastForwardTo(c) {
    while (++this.index < this.buffer.length + this.offset) {
      if (this.buffer.charCodeAt(this.index - this.offset) === c) {
        return true;
      }
    }
    this.index = this.buffer.length + this.offset - 1;
    return false;
  }
  stateInCommentLike(c) {
    if (c === this.currentSequence[this.sequenceIndex]) {
      if (++this.sequenceIndex === this.currentSequence.length) {
        if (this.currentSequence === Sequences.CdataEnd) {
          this.cbs.oncdata(this.sectionStart, this.index, 2);
        } else {
          this.cbs.oncomment(this.sectionStart, this.index, 2);
        }
        this.sequenceIndex = 0;
        this.sectionStart = this.index + 1;
        this.state = State.Text;
      }
    } else if (this.sequenceIndex === 0) {
      if (this.fastForwardTo(this.currentSequence[0])) {
        this.sequenceIndex = 1;
      }
    } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
      this.sequenceIndex = 0;
    }
  }
  isTagStartChar(c) {
    return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
  }
  startSpecial(sequence, offset) {
    this.isSpecial = true;
    this.currentSequence = sequence;
    this.sequenceIndex = offset;
    this.state = State.SpecialStartSequence;
  }
  stateBeforeTagName(c) {
    if (c === CharCodes2.ExclamationMark) {
      this.state = State.BeforeDeclaration;
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.Questionmark) {
      this.state = State.InProcessingInstruction;
      this.sectionStart = this.index + 1;
    } else if (this.isTagStartChar(c)) {
      const lower = c | 32;
      this.sectionStart = this.index;
      if (this.xmlMode) {
        this.state = State.InTagName;
      } else if (lower === Sequences.ScriptEnd[2]) {
        this.state = State.BeforeSpecialS;
      } else if (lower === Sequences.TitleEnd[2] || lower === Sequences.XmpEnd[2]) {
        this.state = State.BeforeSpecialT;
      } else {
        this.state = State.InTagName;
      }
    } else if (c === CharCodes2.Slash) {
      this.state = State.BeforeClosingTagName;
    } else {
      this.state = State.Text;
      this.stateText(c);
    }
  }
  stateInTagName(c) {
    if (isEndOfTagSection(c)) {
      this.cbs.onopentagname(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    }
  }
  stateBeforeClosingTagName(c) {
    if (isWhitespace(c)) {} else if (c === CharCodes2.Gt) {
      this.state = State.Text;
    } else {
      this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
      this.sectionStart = this.index;
    }
  }
  stateInClosingTagName(c) {
    if (c === CharCodes2.Gt || isWhitespace(c)) {
      this.cbs.onclosetag(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.state = State.AfterClosingTagName;
      this.stateAfterClosingTagName(c);
    }
  }
  stateAfterClosingTagName(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeAttributeName(c) {
    if (c === CharCodes2.Gt) {
      this.cbs.onopentagend(this.index);
      if (this.isSpecial) {
        this.state = State.InSpecialTag;
        this.sequenceIndex = 0;
      } else {
        this.state = State.Text;
      }
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.Slash) {
      this.state = State.InSelfClosingTag;
    } else if (!isWhitespace(c)) {
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateInSelfClosingTag(c) {
    if (c === CharCodes2.Gt) {
      this.cbs.onselfclosingtag(this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
      this.isSpecial = false;
    } else if (!isWhitespace(c)) {
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    }
  }
  stateInAttributeName(c) {
    if (c === CharCodes2.Eq || isEndOfTagSection(c)) {
      this.cbs.onattribname(this.sectionStart, this.index);
      this.sectionStart = this.index;
      this.state = State.AfterAttributeName;
      this.stateAfterAttributeName(c);
    }
  }
  stateAfterAttributeName(c) {
    if (c === CharCodes2.Eq) {
      this.state = State.BeforeAttributeValue;
    } else if (c === CharCodes2.Slash || c === CharCodes2.Gt) {
      this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
      this.sectionStart = -1;
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    } else if (!isWhitespace(c)) {
      this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
      this.state = State.InAttributeName;
      this.sectionStart = this.index;
    }
  }
  stateBeforeAttributeValue(c) {
    if (c === CharCodes2.DoubleQuote) {
      this.state = State.InAttributeValueDq;
      this.sectionStart = this.index + 1;
    } else if (c === CharCodes2.SingleQuote) {
      this.state = State.InAttributeValueSq;
      this.sectionStart = this.index + 1;
    } else if (!isWhitespace(c)) {
      this.sectionStart = this.index;
      this.state = State.InAttributeValueNq;
      this.stateInAttributeValueNoQuotes(c);
    }
  }
  handleInAttributeValue(c, quote) {
    if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(quote === CharCodes2.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index + 1);
      this.state = State.BeforeAttributeName;
    } else if (this.decodeEntities && c === CharCodes2.Amp) {
      this.startEntity();
    }
  }
  stateInAttributeValueDoubleQuotes(c) {
    this.handleInAttributeValue(c, CharCodes2.DoubleQuote);
  }
  stateInAttributeValueSingleQuotes(c) {
    this.handleInAttributeValue(c, CharCodes2.SingleQuote);
  }
  stateInAttributeValueNoQuotes(c) {
    if (isWhitespace(c) || c === CharCodes2.Gt) {
      this.cbs.onattribdata(this.sectionStart, this.index);
      this.sectionStart = -1;
      this.cbs.onattribend(QuoteType.Unquoted, this.index);
      this.state = State.BeforeAttributeName;
      this.stateBeforeAttributeName(c);
    } else if (this.decodeEntities && c === CharCodes2.Amp) {
      this.startEntity();
    }
  }
  stateBeforeDeclaration(c) {
    if (c === CharCodes2.OpeningSquareBracket) {
      this.state = State.CDATASequence;
      this.sequenceIndex = 0;
    } else {
      this.state = c === CharCodes2.Dash ? State.BeforeComment : State.InDeclaration;
    }
  }
  stateInDeclaration(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.ondeclaration(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateInProcessingInstruction(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.onprocessinginstruction(this.sectionStart, this.index);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeComment(c) {
    if (c === CharCodes2.Dash) {
      this.state = State.InCommentLike;
      this.currentSequence = Sequences.CommentEnd;
      this.sequenceIndex = 2;
      this.sectionStart = this.index + 1;
    } else {
      this.state = State.InDeclaration;
    }
  }
  stateInSpecialComment(c) {
    if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
      this.cbs.oncomment(this.sectionStart, this.index, 0);
      this.state = State.Text;
      this.sectionStart = this.index + 1;
    }
  }
  stateBeforeSpecialS(c) {
    const lower = c | 32;
    if (lower === Sequences.ScriptEnd[3]) {
      this.startSpecial(Sequences.ScriptEnd, 4);
    } else if (lower === Sequences.StyleEnd[3]) {
      this.startSpecial(Sequences.StyleEnd, 4);
    } else {
      this.state = State.InTagName;
      this.stateInTagName(c);
    }
  }
  stateBeforeSpecialT(c) {
    const lower = c | 32;
    switch (lower) {
      case Sequences.TitleEnd[3]: {
        this.startSpecial(Sequences.TitleEnd, 4);
        break;
      }
      case Sequences.TextareaEnd[3]: {
        this.startSpecial(Sequences.TextareaEnd, 4);
        break;
      }
      case Sequences.XmpEnd[3]: {
        this.startSpecial(Sequences.XmpEnd, 4);
        break;
      }
      default: {
        this.state = State.InTagName;
        this.stateInTagName(c);
      }
    }
  }
  startEntity() {
    this.baseState = this.state;
    this.state = State.InEntity;
    this.entityStart = this.index;
    this.entityDecoder.startEntity(this.xmlMode ? DecodingMode.Strict : this.baseState === State.Text || this.baseState === State.InSpecialTag ? DecodingMode.Legacy : DecodingMode.Attribute);
  }
  stateInEntity() {
    const indexInBuffer = this.index - this.offset;
    const length = this.entityDecoder.write(this.buffer, indexInBuffer);
    if (length >= 0) {
      this.state = this.baseState;
      if (length === 0) {
        this.index -= 1;
      }
    } else {
      if (indexInBuffer < this.buffer.length && this.buffer.charCodeAt(indexInBuffer) === CharCodes2.Amp) {
        this.state = this.baseState;
        this.index -= 1;
        return;
      }
      this.index = this.offset + this.buffer.length - 1;
    }
  }
  cleanup() {
    if (this.running && this.sectionStart !== this.index) {
      if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
        this.cbs.ontext(this.sectionStart, this.index);
        this.sectionStart = this.index;
      } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = this.index;
      }
    }
  }
  shouldContinue() {
    return this.index < this.buffer.length + this.offset && this.running;
  }
  parse() {
    while (this.shouldContinue()) {
      const c = this.buffer.charCodeAt(this.index - this.offset);
      switch (this.state) {
        case State.Text: {
          this.stateText(c);
          break;
        }
        case State.SpecialStartSequence: {
          this.stateSpecialStartSequence(c);
          break;
        }
        case State.InSpecialTag: {
          this.stateInSpecialTag(c);
          break;
        }
        case State.CDATASequence: {
          this.stateCDATASequence(c);
          break;
        }
        case State.InAttributeValueDq: {
          this.stateInAttributeValueDoubleQuotes(c);
          break;
        }
        case State.InAttributeName: {
          this.stateInAttributeName(c);
          break;
        }
        case State.InCommentLike: {
          this.stateInCommentLike(c);
          break;
        }
        case State.InSpecialComment: {
          this.stateInSpecialComment(c);
          break;
        }
        case State.BeforeAttributeName: {
          this.stateBeforeAttributeName(c);
          break;
        }
        case State.InTagName: {
          this.stateInTagName(c);
          break;
        }
        case State.InClosingTagName: {
          this.stateInClosingTagName(c);
          break;
        }
        case State.BeforeTagName: {
          this.stateBeforeTagName(c);
          break;
        }
        case State.AfterAttributeName: {
          this.stateAfterAttributeName(c);
          break;
        }
        case State.InAttributeValueSq: {
          this.stateInAttributeValueSingleQuotes(c);
          break;
        }
        case State.BeforeAttributeValue: {
          this.stateBeforeAttributeValue(c);
          break;
        }
        case State.BeforeClosingTagName: {
          this.stateBeforeClosingTagName(c);
          break;
        }
        case State.AfterClosingTagName: {
          this.stateAfterClosingTagName(c);
          break;
        }
        case State.BeforeSpecialS: {
          this.stateBeforeSpecialS(c);
          break;
        }
        case State.BeforeSpecialT: {
          this.stateBeforeSpecialT(c);
          break;
        }
        case State.InAttributeValueNq: {
          this.stateInAttributeValueNoQuotes(c);
          break;
        }
        case State.InSelfClosingTag: {
          this.stateInSelfClosingTag(c);
          break;
        }
        case State.InDeclaration: {
          this.stateInDeclaration(c);
          break;
        }
        case State.BeforeDeclaration: {
          this.stateBeforeDeclaration(c);
          break;
        }
        case State.BeforeComment: {
          this.stateBeforeComment(c);
          break;
        }
        case State.InProcessingInstruction: {
          this.stateInProcessingInstruction(c);
          break;
        }
        case State.InEntity: {
          this.stateInEntity();
          break;
        }
      }
      this.index++;
    }
    this.cleanup();
  }
  finish() {
    if (this.state === State.InEntity) {
      this.entityDecoder.end();
      this.state = this.baseState;
    }
    this.handleTrailingData();
    this.cbs.onend();
  }
  handleTrailingData() {
    const endIndex = this.buffer.length + this.offset;
    if (this.sectionStart >= endIndex) {
      return;
    }
    if (this.state === State.InCommentLike) {
      if (this.currentSequence === Sequences.CdataEnd) {
        this.cbs.oncdata(this.sectionStart, endIndex, 0);
      } else {
        this.cbs.oncomment(this.sectionStart, endIndex, 0);
      }
    } else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {} else {
      this.cbs.ontext(this.sectionStart, endIndex);
    }
  }
  emitCodePoint(cp, consumed) {
    if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
      if (this.sectionStart < this.entityStart) {
        this.cbs.onattribdata(this.sectionStart, this.entityStart);
      }
      this.sectionStart = this.entityStart + consumed;
      this.index = this.sectionStart - 1;
      this.cbs.onattribentity(cp);
    } else {
      if (this.sectionStart < this.entityStart) {
        this.cbs.ontext(this.sectionStart, this.entityStart);
      }
      this.sectionStart = this.entityStart + consumed;
      this.index = this.sectionStart - 1;
      this.cbs.ontextentity(cp, this.sectionStart);
    }
  }
}

// node_modules/.bun/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/Parser.js
var formTags = new Set([
  "input",
  "option",
  "optgroup",
  "select",
  "button",
  "datalist",
  "textarea"
]);
var pTag = new Set(["p"]);
var tableSectionTags = new Set(["thead", "tbody"]);
var ddtTags = new Set(["dd", "dt"]);
var rtpTags = new Set(["rt", "rp"]);
var openImpliesClose = new Map([
  ["tr", new Set(["tr", "th", "td"])],
  ["th", new Set(["th"])],
  ["td", new Set(["thead", "th", "td"])],
  ["body", new Set(["head", "link", "script"])],
  ["li", new Set(["li"])],
  ["p", pTag],
  ["h1", pTag],
  ["h2", pTag],
  ["h3", pTag],
  ["h4", pTag],
  ["h5", pTag],
  ["h6", pTag],
  ["select", formTags],
  ["input", formTags],
  ["output", formTags],
  ["button", formTags],
  ["datalist", formTags],
  ["textarea", formTags],
  ["option", new Set(["option"])],
  ["optgroup", new Set(["optgroup", "option"])],
  ["dd", ddtTags],
  ["dt", ddtTags],
  ["address", pTag],
  ["article", pTag],
  ["aside", pTag],
  ["blockquote", pTag],
  ["details", pTag],
  ["div", pTag],
  ["dl", pTag],
  ["fieldset", pTag],
  ["figcaption", pTag],
  ["figure", pTag],
  ["footer", pTag],
  ["form", pTag],
  ["header", pTag],
  ["hr", pTag],
  ["main", pTag],
  ["nav", pTag],
  ["ol", pTag],
  ["pre", pTag],
  ["section", pTag],
  ["table", pTag],
  ["ul", pTag],
  ["rt", rtpTags],
  ["rp", rtpTags],
  ["tbody", tableSectionTags],
  ["tfoot", tableSectionTags]
]);
var voidElements = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
var foreignContextElements = new Set(["math", "svg"]);
var htmlIntegrationElements = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignobject",
  "desc",
  "title"
]);
var reNameEnd = /\s|\//;

class Parser {
  constructor(cbs, options = {}) {
    var _a, _b, _c, _d, _e, _f;
    this.options = options;
    this.startIndex = 0;
    this.endIndex = 0;
    this.openTagStart = 0;
    this.tagname = "";
    this.attribname = "";
    this.attribvalue = "";
    this.attribs = null;
    this.stack = [];
    this.buffers = [];
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
    this.cbs = cbs !== null && cbs !== undefined ? cbs : {};
    this.htmlMode = !this.options.xmlMode;
    this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== undefined ? _a : this.htmlMode;
    this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== undefined ? _b : this.htmlMode;
    this.recognizeSelfClosing = (_c = options.recognizeSelfClosing) !== null && _c !== undefined ? _c : !this.htmlMode;
    this.tokenizer = new ((_d = options.Tokenizer) !== null && _d !== undefined ? _d : Tokenizer)(this.options, this);
    this.foreignContext = [!this.htmlMode];
    (_f = (_e = this.cbs).onparserinit) === null || _f === undefined || _f.call(_e, this);
  }
  ontext(start, endIndex) {
    var _a, _b;
    const data = this.getSlice(start, endIndex);
    this.endIndex = endIndex - 1;
    (_b = (_a = this.cbs).ontext) === null || _b === undefined || _b.call(_a, data);
    this.startIndex = endIndex;
  }
  ontextentity(cp, endIndex) {
    var _a, _b;
    this.endIndex = endIndex - 1;
    (_b = (_a = this.cbs).ontext) === null || _b === undefined || _b.call(_a, fromCodePoint(cp));
    this.startIndex = endIndex;
  }
  isVoidElement(name) {
    return this.htmlMode && voidElements.has(name);
  }
  onopentagname(start, endIndex) {
    this.endIndex = endIndex;
    let name = this.getSlice(start, endIndex);
    if (this.lowerCaseTagNames) {
      name = name.toLowerCase();
    }
    this.emitOpenTag(name);
  }
  emitOpenTag(name) {
    var _a, _b, _c, _d;
    this.openTagStart = this.startIndex;
    this.tagname = name;
    const impliesClose = this.htmlMode && openImpliesClose.get(name);
    if (impliesClose) {
      while (this.stack.length > 0 && impliesClose.has(this.stack[0])) {
        const element = this.stack.shift();
        (_b = (_a = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a, element, true);
      }
    }
    if (!this.isVoidElement(name)) {
      this.stack.unshift(name);
      if (this.htmlMode) {
        if (foreignContextElements.has(name)) {
          this.foreignContext.unshift(true);
        } else if (htmlIntegrationElements.has(name)) {
          this.foreignContext.unshift(false);
        }
      }
    }
    (_d = (_c = this.cbs).onopentagname) === null || _d === undefined || _d.call(_c, name);
    if (this.cbs.onopentag)
      this.attribs = {};
  }
  endOpenTag(isImplied) {
    var _a, _b;
    this.startIndex = this.openTagStart;
    if (this.attribs) {
      (_b = (_a = this.cbs).onopentag) === null || _b === undefined || _b.call(_a, this.tagname, this.attribs, isImplied);
      this.attribs = null;
    }
    if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
      this.cbs.onclosetag(this.tagname, true);
    }
    this.tagname = "";
  }
  onopentagend(endIndex) {
    this.endIndex = endIndex;
    this.endOpenTag(false);
    this.startIndex = endIndex + 1;
  }
  onclosetag(start, endIndex) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    this.endIndex = endIndex;
    let name = this.getSlice(start, endIndex);
    if (this.lowerCaseTagNames) {
      name = name.toLowerCase();
    }
    if (this.htmlMode && (foreignContextElements.has(name) || htmlIntegrationElements.has(name))) {
      this.foreignContext.shift();
    }
    if (!this.isVoidElement(name)) {
      const pos = this.stack.indexOf(name);
      if (pos !== -1) {
        for (let index = 0;index <= pos; index++) {
          const element = this.stack.shift();
          (_b = (_a = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a, element, index !== pos);
        }
      } else if (this.htmlMode && name === "p") {
        this.emitOpenTag("p");
        this.closeCurrentTag(true);
      }
    } else if (this.htmlMode && name === "br") {
      (_d = (_c = this.cbs).onopentagname) === null || _d === undefined || _d.call(_c, "br");
      (_f = (_e = this.cbs).onopentag) === null || _f === undefined || _f.call(_e, "br", {}, true);
      (_h = (_g = this.cbs).onclosetag) === null || _h === undefined || _h.call(_g, "br", false);
    }
    this.startIndex = endIndex + 1;
  }
  onselfclosingtag(endIndex) {
    this.endIndex = endIndex;
    if (this.recognizeSelfClosing || this.foreignContext[0]) {
      this.closeCurrentTag(false);
      this.startIndex = endIndex + 1;
    } else {
      this.onopentagend(endIndex);
    }
  }
  closeCurrentTag(isOpenImplied) {
    var _a, _b;
    const name = this.tagname;
    this.endOpenTag(isOpenImplied);
    if (this.stack[0] === name) {
      (_b = (_a = this.cbs).onclosetag) === null || _b === undefined || _b.call(_a, name, !isOpenImplied);
      this.stack.shift();
    }
  }
  onattribname(start, endIndex) {
    this.startIndex = start;
    const name = this.getSlice(start, endIndex);
    this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
  }
  onattribdata(start, endIndex) {
    this.attribvalue += this.getSlice(start, endIndex);
  }
  onattribentity(cp) {
    this.attribvalue += fromCodePoint(cp);
  }
  onattribend(quote, endIndex) {
    var _a, _b;
    this.endIndex = endIndex;
    (_b = (_a = this.cbs).onattribute) === null || _b === undefined || _b.call(_a, this.attribname, this.attribvalue, quote === QuoteType.Double ? '"' : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? undefined : null);
    if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
      this.attribs[this.attribname] = this.attribvalue;
    }
    this.attribvalue = "";
  }
  getInstructionName(value) {
    const index = value.search(reNameEnd);
    let name = index < 0 ? value : value.substr(0, index);
    if (this.lowerCaseTagNames) {
      name = name.toLowerCase();
    }
    return name;
  }
  ondeclaration(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  onprocessinginstruction(start, endIndex) {
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex);
    if (this.cbs.onprocessinginstruction) {
      const name = this.getInstructionName(value);
      this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
    }
    this.startIndex = endIndex + 1;
  }
  oncomment(start, endIndex, offset) {
    var _a, _b, _c, _d;
    this.endIndex = endIndex;
    (_b = (_a = this.cbs).oncomment) === null || _b === undefined || _b.call(_a, this.getSlice(start, endIndex - offset));
    (_d = (_c = this.cbs).oncommentend) === null || _d === undefined || _d.call(_c);
    this.startIndex = endIndex + 1;
  }
  oncdata(start, endIndex, offset) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    this.endIndex = endIndex;
    const value = this.getSlice(start, endIndex - offset);
    if (!this.htmlMode || this.options.recognizeCDATA) {
      (_b = (_a = this.cbs).oncdatastart) === null || _b === undefined || _b.call(_a);
      (_d = (_c = this.cbs).ontext) === null || _d === undefined || _d.call(_c, value);
      (_f = (_e = this.cbs).oncdataend) === null || _f === undefined || _f.call(_e);
    } else {
      (_h = (_g = this.cbs).oncomment) === null || _h === undefined || _h.call(_g, `[CDATA[${value}]]`);
      (_k = (_j = this.cbs).oncommentend) === null || _k === undefined || _k.call(_j);
    }
    this.startIndex = endIndex + 1;
  }
  onend() {
    var _a, _b;
    if (this.cbs.onclosetag) {
      this.endIndex = this.startIndex;
      for (let index = 0;index < this.stack.length; index++) {
        this.cbs.onclosetag(this.stack[index], true);
      }
    }
    (_b = (_a = this.cbs).onend) === null || _b === undefined || _b.call(_a);
  }
  reset() {
    var _a, _b, _c, _d;
    (_b = (_a = this.cbs).onreset) === null || _b === undefined || _b.call(_a);
    this.tokenizer.reset();
    this.tagname = "";
    this.attribname = "";
    this.attribs = null;
    this.stack.length = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    (_d = (_c = this.cbs).onparserinit) === null || _d === undefined || _d.call(_c, this);
    this.buffers.length = 0;
    this.foreignContext.length = 0;
    this.foreignContext.unshift(!this.htmlMode);
    this.bufferOffset = 0;
    this.writeIndex = 0;
    this.ended = false;
  }
  parseComplete(data) {
    this.reset();
    this.end(data);
  }
  getSlice(start, end) {
    while (start - this.bufferOffset >= this.buffers[0].length) {
      this.shiftBuffer();
    }
    let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
    while (end - this.bufferOffset > this.buffers[0].length) {
      this.shiftBuffer();
      slice += this.buffers[0].slice(0, end - this.bufferOffset);
    }
    return slice;
  }
  shiftBuffer() {
    this.bufferOffset += this.buffers[0].length;
    this.writeIndex--;
    this.buffers.shift();
  }
  write(chunk) {
    var _a, _b;
    if (this.ended) {
      (_b = (_a = this.cbs).onerror) === null || _b === undefined || _b.call(_a, new Error(".write() after done!"));
      return;
    }
    this.buffers.push(chunk);
    if (this.tokenizer.running) {
      this.tokenizer.write(chunk);
      this.writeIndex++;
    }
  }
  end(chunk) {
    var _a, _b;
    if (this.ended) {
      (_b = (_a = this.cbs).onerror) === null || _b === undefined || _b.call(_a, new Error(".end() after done!"));
      return;
    }
    if (chunk)
      this.write(chunk);
    this.ended = true;
    this.tokenizer.end();
  }
  pause() {
    this.tokenizer.pause();
  }
  resume() {
    this.tokenizer.resume();
    while (this.tokenizer.running && this.writeIndex < this.buffers.length) {
      this.tokenizer.write(this.buffers[this.writeIndex++]);
    }
    if (this.ended)
      this.tokenizer.end();
  }
  parseChunk(chunk) {
    this.write(chunk);
  }
  done(chunk) {
    this.end(chunk);
  }
}
// node_modules/.bun/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js
var exports_esm = {};
__export(exports_esm, {
  CDATA: () => CDATA,
  Comment: () => Comment,
  Directive: () => Directive,
  Doctype: () => Doctype,
  ElementType: () => ElementType,
  Root: () => Root,
  Script: () => Script,
  Style: () => Style,
  Tag: () => Tag,
  Text: () => Text,
  isTag: () => isTag
});
var ElementType;
(function(ElementType2) {
  ElementType2["Root"] = "root";
  ElementType2["Text"] = "text";
  ElementType2["Directive"] = "directive";
  ElementType2["Comment"] = "comment";
  ElementType2["Script"] = "script";
  ElementType2["Style"] = "style";
  ElementType2["Tag"] = "tag";
  ElementType2["CDATA"] = "cdata";
  ElementType2["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag(elem) {
  return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
var Root = ElementType.Root;
var Text = ElementType.Text;
var Directive = ElementType.Directive;
var Comment = ElementType.Comment;
var Script = ElementType.Script;
var Style = ElementType.Style;
var Tag = ElementType.Tag;
var CDATA = ElementType.CDATA;
var Doctype = ElementType.Doctype;

// node_modules/.bun/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js
class Node {
  constructor() {
    this.parent = null;
    this.prev = null;
    this.next = null;
    this.startIndex = null;
    this.endIndex = null;
  }
  get parentNode() {
    return this.parent;
  }
  set parentNode(parent) {
    this.parent = parent;
  }
  get previousSibling() {
    return this.prev;
  }
  set previousSibling(prev) {
    this.prev = prev;
  }
  get nextSibling() {
    return this.next;
  }
  set nextSibling(next) {
    this.next = next;
  }
  cloneNode(recursive = false) {
    return cloneNode(this, recursive);
  }
}

class DataNode extends Node {
  constructor(data) {
    super();
    this.data = data;
  }
  get nodeValue() {
    return this.data;
  }
  set nodeValue(data) {
    this.data = data;
  }
}

class Text2 extends DataNode {
  constructor() {
    super(...arguments);
    this.type = ElementType.Text;
  }
  get nodeType() {
    return 3;
  }
}

class Comment2 extends DataNode {
  constructor() {
    super(...arguments);
    this.type = ElementType.Comment;
  }
  get nodeType() {
    return 8;
  }
}

class ProcessingInstruction extends DataNode {
  constructor(name, data) {
    super(data);
    this.name = name;
    this.type = ElementType.Directive;
  }
  get nodeType() {
    return 1;
  }
}

class NodeWithChildren extends Node {
  constructor(children) {
    super();
    this.children = children;
  }
  get firstChild() {
    var _a;
    return (_a = this.children[0]) !== null && _a !== undefined ? _a : null;
  }
  get lastChild() {
    return this.children.length > 0 ? this.children[this.children.length - 1] : null;
  }
  get childNodes() {
    return this.children;
  }
  set childNodes(children) {
    this.children = children;
  }
}

class CDATA2 extends NodeWithChildren {
  constructor() {
    super(...arguments);
    this.type = ElementType.CDATA;
  }
  get nodeType() {
    return 4;
  }
}

class Document2 extends NodeWithChildren {
  constructor() {
    super(...arguments);
    this.type = ElementType.Root;
  }
  get nodeType() {
    return 9;
  }
}

class Element extends NodeWithChildren {
  constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
    super(children);
    this.name = name;
    this.attribs = attribs;
    this.type = type;
  }
  get nodeType() {
    return 1;
  }
  get tagName() {
    return this.name;
  }
  set tagName(name) {
    this.name = name;
  }
  get attributes() {
    return Object.keys(this.attribs).map((name) => {
      var _a, _b;
      return {
        name,
        value: this.attribs[name],
        namespace: (_a = this["x-attribsNamespace"]) === null || _a === undefined ? undefined : _a[name],
        prefix: (_b = this["x-attribsPrefix"]) === null || _b === undefined ? undefined : _b[name]
      };
    });
  }
}
function isTag2(node) {
  return isTag(node);
}
function isCDATA(node) {
  return node.type === ElementType.CDATA;
}
function isText(node) {
  return node.type === ElementType.Text;
}
function isComment(node) {
  return node.type === ElementType.Comment;
}
function isDirective(node) {
  return node.type === ElementType.Directive;
}
function isDocument(node) {
  return node.type === ElementType.Root;
}
function hasChildren(node) {
  return Object.prototype.hasOwnProperty.call(node, "children");
}
function cloneNode(node, recursive = false) {
  let result;
  if (isText(node)) {
    result = new Text2(node.data);
  } else if (isComment(node)) {
    result = new Comment2(node.data);
  } else if (isTag2(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Element(node.name, { ...node.attribs }, children);
    children.forEach((child) => child.parent = clone);
    if (node.namespace != null) {
      clone.namespace = node.namespace;
    }
    if (node["x-attribsNamespace"]) {
      clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
    }
    if (node["x-attribsPrefix"]) {
      clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
    }
    result = clone;
  } else if (isCDATA(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new CDATA2(children);
    children.forEach((child) => child.parent = clone);
    result = clone;
  } else if (isDocument(node)) {
    const children = recursive ? cloneChildren(node.children) : [];
    const clone = new Document2(children);
    children.forEach((child) => child.parent = clone);
    if (node["x-mode"]) {
      clone["x-mode"] = node["x-mode"];
    }
    result = clone;
  } else if (isDirective(node)) {
    const instruction = new ProcessingInstruction(node.name, node.data);
    if (node["x-name"] != null) {
      instruction["x-name"] = node["x-name"];
      instruction["x-publicId"] = node["x-publicId"];
      instruction["x-systemId"] = node["x-systemId"];
    }
    result = instruction;
  } else {
    throw new Error(`Not implemented yet: ${node.type}`);
  }
  result.startIndex = node.startIndex;
  result.endIndex = node.endIndex;
  if (node.sourceCodeLocation != null) {
    result.sourceCodeLocation = node.sourceCodeLocation;
  }
  return result;
}
function cloneChildren(childs) {
  const children = childs.map((child) => cloneNode(child, true));
  for (let i = 1;i < children.length; i++) {
    children[i].prev = children[i - 1];
    children[i - 1].next = children[i];
  }
  return children;
}

// node_modules/.bun/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js
var defaultOpts = {
  withStartIndices: false,
  withEndIndices: false,
  xmlMode: false
};

class DomHandler {
  constructor(callback, options, elementCB) {
    this.dom = [];
    this.root = new Document2(this.dom);
    this.done = false;
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
    if (typeof options === "function") {
      elementCB = options;
      options = defaultOpts;
    }
    if (typeof callback === "object") {
      options = callback;
      callback = undefined;
    }
    this.callback = callback !== null && callback !== undefined ? callback : null;
    this.options = options !== null && options !== undefined ? options : defaultOpts;
    this.elementCB = elementCB !== null && elementCB !== undefined ? elementCB : null;
  }
  onparserinit(parser) {
    this.parser = parser;
  }
  onreset() {
    this.dom = [];
    this.root = new Document2(this.dom);
    this.done = false;
    this.tagStack = [this.root];
    this.lastNode = null;
    this.parser = null;
  }
  onend() {
    if (this.done)
      return;
    this.done = true;
    this.parser = null;
    this.handleCallback(null);
  }
  onerror(error) {
    this.handleCallback(error);
  }
  onclosetag() {
    this.lastNode = null;
    const elem = this.tagStack.pop();
    if (this.options.withEndIndices) {
      elem.endIndex = this.parser.endIndex;
    }
    if (this.elementCB)
      this.elementCB(elem);
  }
  onopentag(name, attribs) {
    const type = this.options.xmlMode ? ElementType.Tag : undefined;
    const element = new Element(name, attribs, undefined, type);
    this.addNode(element);
    this.tagStack.push(element);
  }
  ontext(data) {
    const { lastNode } = this;
    if (lastNode && lastNode.type === ElementType.Text) {
      lastNode.data += data;
      if (this.options.withEndIndices) {
        lastNode.endIndex = this.parser.endIndex;
      }
    } else {
      const node = new Text2(data);
      this.addNode(node);
      this.lastNode = node;
    }
  }
  oncomment(data) {
    if (this.lastNode && this.lastNode.type === ElementType.Comment) {
      this.lastNode.data += data;
      return;
    }
    const node = new Comment2(data);
    this.addNode(node);
    this.lastNode = node;
  }
  oncommentend() {
    this.lastNode = null;
  }
  oncdatastart() {
    const text = new Text2("");
    const node = new CDATA2([text]);
    this.addNode(node);
    text.parent = node;
    this.lastNode = text;
  }
  oncdataend() {
    this.lastNode = null;
  }
  onprocessinginstruction(name, data) {
    const node = new ProcessingInstruction(name, data);
    this.addNode(node);
  }
  handleCallback(error) {
    if (typeof this.callback === "function") {
      this.callback(error, this.dom);
    } else if (error) {
      throw error;
    }
  }
  addNode(node) {
    const parent = this.tagStack[this.tagStack.length - 1];
    const previousSibling = parent.children[parent.children.length - 1];
    if (this.options.withStartIndices) {
      node.startIndex = this.parser.startIndex;
    }
    if (this.options.withEndIndices) {
      node.endIndex = this.parser.endIndex;
    }
    parent.children.push(node);
    if (previousSibling) {
      node.prev = previousSibling;
      previousSibling.next = node;
    }
    node.parent = parent;
    this.lastNode = null;
  }
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/index.js
var exports_esm2 = {};
__export(exports_esm2, {
  DocumentPosition: () => DocumentPosition,
  append: () => append,
  appendChild: () => appendChild,
  compareDocumentPosition: () => compareDocumentPosition,
  existsOne: () => existsOne,
  filter: () => filter,
  find: () => find,
  findAll: () => findAll,
  findOne: () => findOne,
  findOneChild: () => findOneChild,
  getAttributeValue: () => getAttributeValue,
  getChildren: () => getChildren,
  getElementById: () => getElementById,
  getElements: () => getElements,
  getElementsByClassName: () => getElementsByClassName,
  getElementsByTagName: () => getElementsByTagName,
  getElementsByTagType: () => getElementsByTagType,
  getFeed: () => getFeed,
  getInnerHTML: () => getInnerHTML,
  getName: () => getName,
  getOuterHTML: () => getOuterHTML,
  getParent: () => getParent,
  getSiblings: () => getSiblings,
  getText: () => getText,
  hasAttrib: () => hasAttrib,
  hasChildren: () => hasChildren,
  innerText: () => innerText,
  isCDATA: () => isCDATA,
  isComment: () => isComment,
  isDocument: () => isDocument,
  isTag: () => isTag2,
  isText: () => isText,
  nextElementSibling: () => nextElementSibling,
  prepend: () => prepend,
  prependChild: () => prependChild,
  prevElementSibling: () => prevElementSibling,
  removeElement: () => removeElement,
  removeSubsets: () => removeSubsets,
  replaceElement: () => replaceElement,
  testElement: () => testElement,
  textContent: () => textContent,
  uniqueSort: () => uniqueSort
});

// node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/escape.js
var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
var xmlCodeMap = new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [39, "&apos;"],
  [60, "&lt;"],
  [62, "&gt;"]
]);
var getCodePoint = String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index);
function encodeXML(str) {
  let ret = "";
  let lastIdx = 0;
  let match;
  while ((match = xmlReplacer.exec(str)) !== null) {
    const i = match.index;
    const char = str.charCodeAt(i);
    const next = xmlCodeMap.get(char);
    if (next !== undefined) {
      ret += str.substring(lastIdx, i) + next;
      lastIdx = i + 1;
    } else {
      ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
      lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
    }
  }
  return ret + str.substr(lastIdx);
}
function getEscaper(regex, map) {
  return function escape(data) {
    let match;
    let lastIdx = 0;
    let result = "";
    while (match = regex.exec(data)) {
      if (lastIdx !== match.index) {
        result += data.substring(lastIdx, match.index);
      }
      result += map.get(match[0].charCodeAt(0));
      lastIdx = match.index + 1;
    }
    return result + data.substring(lastIdx);
  };
}
var escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
var escapeAttribute = getEscaper(/["&\u00A0]/g, new Map([
  [34, "&quot;"],
  [38, "&amp;"],
  [160, "&nbsp;"]
]));
var escapeText = getEscaper(/[&<>\u00A0]/g, new Map([
  [38, "&amp;"],
  [60, "&lt;"],
  [62, "&gt;"],
  [160, "&nbsp;"]
]));
// node_modules/.bun/entities@4.5.0/node_modules/entities/lib/esm/index.js
var EntityLevel;
(function(EntityLevel) {
  EntityLevel[EntityLevel["XML"] = 0] = "XML";
  EntityLevel[EntityLevel["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode) {
  EncodingMode[EncodingMode["UTF8"] = 0] = "UTF8";
  EncodingMode[EncodingMode["ASCII"] = 1] = "ASCII";
  EncodingMode[EncodingMode["Extensive"] = 2] = "Extensive";
  EncodingMode[EncodingMode["Attribute"] = 3] = "Attribute";
  EncodingMode[EncodingMode["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));

// node_modules/.bun/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js
var elementNames = new Map([
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "clipPath",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "foreignObject",
  "glyphRef",
  "linearGradient",
  "radialGradient",
  "textPath"
].map((val) => [val.toLowerCase(), val]));
var attributeNames = new Map([
  "definitionURL",
  "attributeName",
  "attributeType",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "clipPathUnits",
  "diffuseConstant",
  "edgeMode",
  "filterUnits",
  "glyphRef",
  "gradientTransform",
  "gradientUnits",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "markerUnits",
  "markerWidth",
  "maskContentUnits",
  "maskUnits",
  "numOctaves",
  "pathLength",
  "patternContentUnits",
  "patternTransform",
  "patternUnits",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "preserveAspectRatio",
  "primitiveUnits",
  "refX",
  "refY",
  "repeatCount",
  "repeatDur",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewBox",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan"
].map((val) => [val.toLowerCase(), val]));

// node_modules/.bun/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js
var unencodedElements = new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript"
]);
function replaceQuotes(value) {
  return value.replace(/"/g, "&quot;");
}
function formatAttributes(attributes, opts) {
  var _a;
  if (!attributes)
    return;
  const encode = ((_a = opts.encodeEntities) !== null && _a !== undefined ? _a : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
  return Object.keys(attributes).map((key) => {
    var _a, _b;
    const value = (_a = attributes[key]) !== null && _a !== undefined ? _a : "";
    if (opts.xmlMode === "foreign") {
      key = (_b = attributeNames.get(key)) !== null && _b !== undefined ? _b : key;
    }
    if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
      return key;
    }
    return `${key}="${encode(value)}"`;
  }).join(" ");
}
var singleTag = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);
function render(node, options = {}) {
  const nodes = "length" in node ? node : [node];
  let output = "";
  for (let i = 0;i < nodes.length; i++) {
    output += renderNode(nodes[i], options);
  }
  return output;
}
var esm_default = render;
function renderNode(node, options) {
  switch (node.type) {
    case Root:
      return render(node.children, options);
    case Doctype:
    case Directive:
      return renderDirective(node);
    case Comment:
      return renderComment(node);
    case CDATA:
      return renderCdata(node);
    case Script:
    case Style:
    case Tag:
      return renderTag(node, options);
    case Text:
      return renderText(node, options);
  }
}
var foreignModeIntegrationPoints = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignObject",
  "desc",
  "title"
]);
var foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
  var _a;
  if (opts.xmlMode === "foreign") {
    elem.name = (_a = elementNames.get(elem.name)) !== null && _a !== undefined ? _a : elem.name;
    if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
      opts = { ...opts, xmlMode: false };
    }
  }
  if (!opts.xmlMode && foreignElements.has(elem.name)) {
    opts = { ...opts, xmlMode: "foreign" };
  }
  let tag = `<${elem.name}`;
  const attribs = formatAttributes(elem.attribs, opts);
  if (attribs) {
    tag += ` ${attribs}`;
  }
  if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
    if (!opts.xmlMode)
      tag += " ";
    tag += "/>";
  } else {
    tag += ">";
    if (elem.children.length > 0) {
      tag += render(elem.children, opts);
    }
    if (opts.xmlMode || !singleTag.has(elem.name)) {
      tag += `</${elem.name}>`;
    }
  }
  return tag;
}
function renderDirective(elem) {
  return `<${elem.data}>`;
}
function renderText(elem, opts) {
  var _a;
  let data = elem.data || "";
  if (((_a = opts.encodeEntities) !== null && _a !== undefined ? _a : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
    data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
  }
  return data;
}
function renderCdata(elem) {
  return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
  return `<!--${elem.data}-->`;
}

// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/stringify.js
function getOuterHTML(node, options) {
  return esm_default(node, options);
}
function getInnerHTML(node, options) {
  return hasChildren(node) ? node.children.map((node) => getOuterHTML(node, options)).join("") : "";
}
function getText(node) {
  if (Array.isArray(node))
    return node.map(getText).join("");
  if (isTag2(node))
    return node.name === "br" ? `
` : getText(node.children);
  if (isCDATA(node))
    return getText(node.children);
  if (isText(node))
    return node.data;
  return "";
}
function textContent(node) {
  if (Array.isArray(node))
    return node.map(textContent).join("");
  if (hasChildren(node) && !isComment(node)) {
    return textContent(node.children);
  }
  if (isText(node))
    return node.data;
  return "";
}
function innerText(node) {
  if (Array.isArray(node))
    return node.map(innerText).join("");
  if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) {
    return innerText(node.children);
  }
  if (isText(node))
    return node.data;
  return "";
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/traversal.js
function getChildren(elem) {
  return hasChildren(elem) ? elem.children : [];
}
function getParent(elem) {
  return elem.parent || null;
}
function getSiblings(elem) {
  const parent = getParent(elem);
  if (parent != null)
    return getChildren(parent);
  const siblings = [elem];
  let { prev, next } = elem;
  while (prev != null) {
    siblings.unshift(prev);
    ({ prev } = prev);
  }
  while (next != null) {
    siblings.push(next);
    ({ next } = next);
  }
  return siblings;
}
function getAttributeValue(elem, name) {
  var _a;
  return (_a = elem.attribs) === null || _a === undefined ? undefined : _a[name];
}
function hasAttrib(elem, name) {
  return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
}
function getName(elem) {
  return elem.name;
}
function nextElementSibling(elem) {
  let { next } = elem;
  while (next !== null && !isTag2(next))
    ({ next } = next);
  return next;
}
function prevElementSibling(elem) {
  let { prev } = elem;
  while (prev !== null && !isTag2(prev))
    ({ prev } = prev);
  return prev;
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/manipulation.js
function removeElement(elem) {
  if (elem.prev)
    elem.prev.next = elem.next;
  if (elem.next)
    elem.next.prev = elem.prev;
  if (elem.parent) {
    const childs = elem.parent.children;
    const childsIndex = childs.lastIndexOf(elem);
    if (childsIndex >= 0) {
      childs.splice(childsIndex, 1);
    }
  }
  elem.next = null;
  elem.prev = null;
  elem.parent = null;
}
function replaceElement(elem, replacement) {
  const prev = replacement.prev = elem.prev;
  if (prev) {
    prev.next = replacement;
  }
  const next = replacement.next = elem.next;
  if (next) {
    next.prev = replacement;
  }
  const parent = replacement.parent = elem.parent;
  if (parent) {
    const childs = parent.children;
    childs[childs.lastIndexOf(elem)] = replacement;
    elem.parent = null;
  }
}
function appendChild(parent, child) {
  removeElement(child);
  child.next = null;
  child.parent = parent;
  if (parent.children.push(child) > 1) {
    const sibling = parent.children[parent.children.length - 2];
    sibling.next = child;
    child.prev = sibling;
  } else {
    child.prev = null;
  }
}
function append(elem, next) {
  removeElement(next);
  const { parent } = elem;
  const currNext = elem.next;
  next.next = currNext;
  next.prev = elem;
  elem.next = next;
  next.parent = parent;
  if (currNext) {
    currNext.prev = next;
    if (parent) {
      const childs = parent.children;
      childs.splice(childs.lastIndexOf(currNext), 0, next);
    }
  } else if (parent) {
    parent.children.push(next);
  }
}
function prependChild(parent, child) {
  removeElement(child);
  child.parent = parent;
  child.prev = null;
  if (parent.children.unshift(child) !== 1) {
    const sibling = parent.children[1];
    sibling.prev = child;
    child.next = sibling;
  } else {
    child.next = null;
  }
}
function prepend(elem, prev) {
  removeElement(prev);
  const { parent } = elem;
  if (parent) {
    const childs = parent.children;
    childs.splice(childs.indexOf(elem), 0, prev);
  }
  if (elem.prev) {
    elem.prev.next = prev;
  }
  prev.parent = parent;
  prev.prev = elem.prev;
  prev.next = elem;
  elem.prev = prev;
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/querying.js
function filter(test, node, recurse = true, limit = Infinity) {
  return find(test, Array.isArray(node) ? node : [node], recurse, limit);
}
function find(test, nodes, recurse, limit) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (;; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (indexStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (test(elem)) {
      result.push(elem);
      if (--limit <= 0)
        return result;
    }
    if (recurse && hasChildren(elem) && elem.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(elem.children);
    }
  }
}
function findOneChild(test, nodes) {
  return nodes.find(test);
}
function findOne(test, nodes, recurse = true) {
  const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
  for (let i = 0;i < searchedNodes.length; i++) {
    const node = searchedNodes[i];
    if (isTag2(node) && test(node)) {
      return node;
    }
    if (recurse && hasChildren(node) && node.children.length > 0) {
      const found = findOne(test, node.children, true);
      if (found)
        return found;
    }
  }
  return null;
}
function existsOne(test, nodes) {
  return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag2(node) && test(node) || hasChildren(node) && existsOne(test, node.children));
}
function findAll(test, nodes) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (;; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const elem = nodeStack[0][indexStack[0]++];
    if (isTag2(elem) && test(elem))
      result.push(elem);
    if (hasChildren(elem) && elem.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(elem.children);
    }
  }
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/legacy.js
var Checks = {
  tag_name(name) {
    if (typeof name === "function") {
      return (elem) => isTag2(elem) && name(elem.name);
    } else if (name === "*") {
      return isTag2;
    }
    return (elem) => isTag2(elem) && elem.name === name;
  },
  tag_type(type) {
    if (typeof type === "function") {
      return (elem) => type(elem.type);
    }
    return (elem) => elem.type === type;
  },
  tag_contains(data) {
    if (typeof data === "function") {
      return (elem) => isText(elem) && data(elem.data);
    }
    return (elem) => isText(elem) && elem.data === data;
  }
};
function getAttribCheck(attrib, value) {
  if (typeof value === "function") {
    return (elem) => isTag2(elem) && value(elem.attribs[attrib]);
  }
  return (elem) => isTag2(elem) && elem.attribs[attrib] === value;
}
function combineFuncs(a, b) {
  return (elem) => a(elem) || b(elem);
}
function compileTest(options) {
  const funcs = Object.keys(options).map((key) => {
    const value = options[key];
    return Object.prototype.hasOwnProperty.call(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
  });
  return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
function testElement(options, node) {
  const test = compileTest(options);
  return test ? test(node) : true;
}
function getElements(options, nodes, recurse, limit = Infinity) {
  const test = compileTest(options);
  return test ? filter(test, nodes, recurse, limit) : [];
}
function getElementById(id, nodes, recurse = true) {
  if (!Array.isArray(nodes))
    nodes = [nodes];
  return findOne(getAttribCheck("id", id), nodes, recurse);
}
function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
  return filter(Checks["tag_name"](tagName), nodes, recurse, limit);
}
function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
  return filter(getAttribCheck("class", className), nodes, recurse, limit);
}
function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
  return filter(Checks["tag_type"](type), nodes, recurse, limit);
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/helpers.js
function removeSubsets(nodes) {
  let idx = nodes.length;
  while (--idx >= 0) {
    const node = nodes[idx];
    if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
      nodes.splice(idx, 1);
      continue;
    }
    for (let ancestor = node.parent;ancestor; ancestor = ancestor.parent) {
      if (nodes.includes(ancestor)) {
        nodes.splice(idx, 1);
        break;
      }
    }
  }
  return nodes;
}
var DocumentPosition;
(function(DocumentPosition) {
  DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
  DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
  DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
  DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
  DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition || (DocumentPosition = {}));
function compareDocumentPosition(nodeA, nodeB) {
  const aParents = [];
  const bParents = [];
  if (nodeA === nodeB) {
    return 0;
  }
  let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
  while (current) {
    aParents.unshift(current);
    current = current.parent;
  }
  current = hasChildren(nodeB) ? nodeB : nodeB.parent;
  while (current) {
    bParents.unshift(current);
    current = current.parent;
  }
  const maxIdx = Math.min(aParents.length, bParents.length);
  let idx = 0;
  while (idx < maxIdx && aParents[idx] === bParents[idx]) {
    idx++;
  }
  if (idx === 0) {
    return DocumentPosition.DISCONNECTED;
  }
  const sharedParent = aParents[idx - 1];
  const siblings = sharedParent.children;
  const aSibling = aParents[idx];
  const bSibling = bParents[idx];
  if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
    if (sharedParent === nodeB) {
      return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
    }
    return DocumentPosition.FOLLOWING;
  }
  if (sharedParent === nodeA) {
    return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
  }
  return DocumentPosition.PRECEDING;
}
function uniqueSort(nodes) {
  nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));
  nodes.sort((a, b) => {
    const relative = compareDocumentPosition(a, b);
    if (relative & DocumentPosition.PRECEDING) {
      return -1;
    } else if (relative & DocumentPosition.FOLLOWING) {
      return 1;
    }
    return 0;
  });
  return nodes;
}
// node_modules/.bun/domutils@3.2.2/node_modules/domutils/lib/esm/feeds.js
function getFeed(doc) {
  const feedRoot = getOneElement(isValidFeed, doc);
  return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
}
function getAtomFeed(feedRoot) {
  var _a;
  const childs = feedRoot.children;
  const feed = {
    type: "atom",
    items: getElementsByTagName("entry", childs).map((item) => {
      var _a;
      const { children } = item;
      const entry = { media: getMediaElements(children) };
      addConditionally(entry, "id", "id", children);
      addConditionally(entry, "title", "title", children);
      const href = (_a = getOneElement("link", children)) === null || _a === undefined ? undefined : _a.attribs["href"];
      if (href) {
        entry.link = href;
      }
      const description = fetch2("summary", children) || fetch2("content", children);
      if (description) {
        entry.description = description;
      }
      const pubDate = fetch2("updated", children);
      if (pubDate) {
        entry.pubDate = new Date(pubDate);
      }
      return entry;
    })
  };
  addConditionally(feed, "id", "id", childs);
  addConditionally(feed, "title", "title", childs);
  const href = (_a = getOneElement("link", childs)) === null || _a === undefined ? undefined : _a.attribs["href"];
  if (href) {
    feed.link = href;
  }
  addConditionally(feed, "description", "subtitle", childs);
  const updated = fetch2("updated", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally(feed, "author", "email", childs, true);
  return feed;
}
function getRssFeed(feedRoot) {
  var _a, _b;
  const childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === undefined ? undefined : _a.children) !== null && _b !== undefined ? _b : [];
  const feed = {
    type: feedRoot.name.substr(0, 3),
    id: "",
    items: getElementsByTagName("item", feedRoot.children).map((item) => {
      const { children } = item;
      const entry = { media: getMediaElements(children) };
      addConditionally(entry, "id", "guid", children);
      addConditionally(entry, "title", "title", children);
      addConditionally(entry, "link", "link", children);
      addConditionally(entry, "description", "description", children);
      const pubDate = fetch2("pubDate", children) || fetch2("dc:date", children);
      if (pubDate)
        entry.pubDate = new Date(pubDate);
      return entry;
    })
  };
  addConditionally(feed, "title", "title", childs);
  addConditionally(feed, "link", "link", childs);
  addConditionally(feed, "description", "description", childs);
  const updated = fetch2("lastBuildDate", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally(feed, "author", "managingEditor", childs, true);
  return feed;
}
var MEDIA_KEYS_STRING = ["url", "type", "lang"];
var MEDIA_KEYS_INT = [
  "fileSize",
  "bitrate",
  "framerate",
  "samplingrate",
  "channels",
  "duration",
  "height",
  "width"
];
function getMediaElements(where) {
  return getElementsByTagName("media:content", where).map((elem) => {
    const { attribs } = elem;
    const media = {
      medium: attribs["medium"],
      isDefault: !!attribs["isDefault"]
    };
    for (const attrib of MEDIA_KEYS_STRING) {
      if (attribs[attrib]) {
        media[attrib] = attribs[attrib];
      }
    }
    for (const attrib of MEDIA_KEYS_INT) {
      if (attribs[attrib]) {
        media[attrib] = parseInt(attribs[attrib], 10);
      }
    }
    if (attribs["expression"]) {
      media.expression = attribs["expression"];
    }
    return media;
  });
}
function getOneElement(tagName, node) {
  return getElementsByTagName(tagName, node, true, 1)[0];
}
function fetch2(tagName, where, recurse = false) {
  return textContent(getElementsByTagName(tagName, where, recurse, 1)).trim();
}
function addConditionally(obj, prop, tagName, where, recurse = false) {
  const val = fetch2(tagName, where, recurse);
  if (val)
    obj[prop] = val;
}
function isValidFeed(value) {
  return value === "rss" || value === "feed" || value === "rdf:RDF";
}
// node_modules/.bun/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/index.js
function parseDocument(data, options) {
  const handler = new DomHandler(undefined, options);
  new Parser(handler, options).end(data);
  return handler.root;
}
function parseDOM(data, options) {
  return parseDocument(data, options).children;
}
function createDocumentStream(callback, options, elementCallback) {
  const handler = new DomHandler((error) => callback(error, handler.root), options, elementCallback);
  return new Parser(handler, options);
}
function createDomStream(callback, options, elementCallback) {
  const handler = new DomHandler(callback, options, elementCallback);
  return new Parser(handler, options);
}
var parseFeedDefaultOptions = { xmlMode: true };
function parseFeed(feed, options = parseFeedDefaultOptions) {
  return getFeed(parseDOM(feed, options));
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/constants.js
var NODE_END = -1;
var ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = 2;
var TEXT_NODE = 3;
var CDATA_SECTION_NODE = 4;
var COMMENT_NODE = 8;
var DOCUMENT_NODE = 9;
var DOCUMENT_TYPE_NODE = 10;
var DOCUMENT_FRAGMENT_NODE = 11;
var BLOCK_ELEMENTS = new Set(["ARTICLE", "ASIDE", "BLOCKQUOTE", "BODY", "BR", "BUTTON", "CANVAS", "CAPTION", "COL", "COLGROUP", "DD", "DIV", "DL", "DT", "EMBED", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "P"]);
var SHOW_ALL = -1;
var SHOW_ELEMENT = 1;
var SHOW_TEXT = 4;
var SHOW_CDATA_SECTION = 8;
var SHOW_COMMENT = 128;
var DOCUMENT_POSITION_DISCONNECTED = 1;
var DOCUMENT_POSITION_PRECEDING = 2;
var DOCUMENT_POSITION_FOLLOWING = 4;
var DOCUMENT_POSITION_CONTAINS = 8;
var DOCUMENT_POSITION_CONTAINED_BY = 16;
var DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/object.js
var {
  assign,
  create,
  defineProperties,
  entries,
  getOwnPropertyDescriptors,
  keys,
  setPrototypeOf
} = Object;

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/utils.js
var $String = String;
var getEnd = (node) => node.nodeType === ELEMENT_NODE ? node[END] : node;
var ignoreCase = ({ ownerDocument }) => ownerDocument[MIME].ignoreCase;
var knownAdjacent = (prev, next) => {
  prev[NEXT] = next;
  next[PREV] = prev;
};
var knownBoundaries = (prev, current, next) => {
  knownAdjacent(prev, current);
  knownAdjacent(getEnd(current), next);
};
var knownSegment = (prev, start, end, next) => {
  knownAdjacent(prev, start);
  knownAdjacent(getEnd(end), next);
};
var knownSiblings = (prev, current, next) => {
  knownAdjacent(prev, current);
  knownAdjacent(current, next);
};
var localCase = ({ localName, ownerDocument }) => {
  return ownerDocument[MIME].ignoreCase ? localName.toUpperCase() : localName;
};
var setAdjacent = (prev, next) => {
  if (prev)
    prev[NEXT] = next;
  if (next)
    next[PREV] = prev;
};
var htmlToFragment = (ownerDocument, html) => {
  const fragment = ownerDocument.createDocumentFragment();
  const elem = ownerDocument.createElement("");
  elem.innerHTML = html;
  const { firstChild, lastChild } = elem;
  if (firstChild) {
    knownSegment(fragment, firstChild, lastChild, fragment[END]);
    let child = firstChild;
    do {
      child.parentNode = fragment;
    } while (child !== lastChild && (child = getEnd(child)[NEXT]));
  }
  return fragment;
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/shadow-roots.js
var shadowRoots = new WeakMap;

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/custom-element-registry.js
var reactive = false;
var Classes = new WeakMap;
var customElements = new WeakMap;
var attributeChangedCallback = (element, attributeName, oldValue, newValue) => {
  if (reactive && customElements.has(element) && element.attributeChangedCallback && element.constructor.observedAttributes.includes(attributeName)) {
    element.attributeChangedCallback(attributeName, oldValue, newValue);
  }
};
var createTrigger = (method, isConnected) => (element) => {
  if (customElements.has(element)) {
    const info = customElements.get(element);
    if (info.connected !== isConnected && element.isConnected === isConnected) {
      info.connected = isConnected;
      if (method in element)
        element[method]();
    }
  }
};
var triggerConnected = createTrigger("connectedCallback", true);
var connectedCallback = (element) => {
  if (reactive) {
    triggerConnected(element);
    if (shadowRoots.has(element))
      element = shadowRoots.get(element).shadowRoot;
    let { [NEXT]: next, [END]: end } = element;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE)
        triggerConnected(next);
      next = next[NEXT];
    }
  }
};
var triggerDisconnected = createTrigger("disconnectedCallback", false);
var disconnectedCallback = (element) => {
  if (reactive) {
    triggerDisconnected(element);
    if (shadowRoots.has(element))
      element = shadowRoots.get(element).shadowRoot;
    let { [NEXT]: next, [END]: end } = element;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE)
        triggerDisconnected(next);
      next = next[NEXT];
    }
  }
};

class CustomElementRegistry {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.registry = new Map;
    this.waiting = new Map;
    this.active = false;
  }
  define(localName, Class, options = {}) {
    const { ownerDocument, registry, waiting } = this;
    if (registry.has(localName))
      throw new Error("unable to redefine " + localName);
    if (Classes.has(Class))
      throw new Error("unable to redefine the same class: " + Class);
    this.active = reactive = true;
    const { extends: extend } = options;
    Classes.set(Class, {
      ownerDocument,
      options: { is: extend ? localName : "" },
      localName: extend || localName
    });
    const check = extend ? (element) => {
      return element.localName === extend && element.getAttribute("is") === localName;
    } : (element) => element.localName === localName;
    registry.set(localName, { Class, check });
    if (waiting.has(localName)) {
      for (const resolve of waiting.get(localName))
        resolve(Class);
      waiting.delete(localName);
    }
    ownerDocument.querySelectorAll(extend ? `${extend}[is="${localName}"]` : localName).forEach(this.upgrade, this);
  }
  upgrade(element) {
    if (customElements.has(element))
      return;
    const { ownerDocument, registry } = this;
    const ce = element.getAttribute("is") || element.localName;
    if (registry.has(ce)) {
      const { Class, check } = registry.get(ce);
      if (check(element)) {
        const { attributes, isConnected } = element;
        for (const attr of attributes)
          element.removeAttributeNode(attr);
        const values = entries(element);
        for (const [key] of values)
          delete element[key];
        setPrototypeOf(element, Class.prototype);
        ownerDocument[UPGRADE] = { element, values };
        new Class(ownerDocument, ce);
        customElements.set(element, { connected: isConnected });
        for (const attr of attributes)
          element.setAttributeNode(attr);
        if (isConnected && element.connectedCallback)
          element.connectedCallback();
      }
    }
  }
  whenDefined(localName) {
    const { registry, waiting } = this;
    return new Promise((resolve) => {
      if (registry.has(localName))
        resolve(registry.get(localName).Class);
      else {
        if (!waiting.has(localName))
          waiting.set(localName, []);
        waiting.get(localName).push(resolve);
      }
    });
  }
  get(localName) {
    const info = this.registry.get(localName);
    return info && info.Class;
  }
  getName(Class) {
    if (Classes.has(Class)) {
      const { localName } = Classes.get(Class);
      return localName;
    }
    return null;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/parse-from-string.js
var { Parser: Parser2 } = exports_esm3;
var notParsing = true;
var append2 = (self, node, active) => {
  const end = self[END];
  node.parentNode = self;
  knownBoundaries(end[PREV], node, end);
  if (active && node.nodeType === ELEMENT_NODE)
    connectedCallback(node);
  return node;
};
var attribute = (element, end, attribute, value, active) => {
  attribute[VALUE] = value;
  attribute.ownerElement = element;
  knownSiblings(end[PREV], attribute, end);
  if (attribute.name === "class")
    element.className = value;
  if (active)
    attributeChangedCallback(element, attribute.name, null, value);
};
var parseFromString = (document, isHTML, markupLanguage) => {
  const { active, registry } = document[CUSTOM_ELEMENTS];
  let node = document;
  let ownerSVGElement = null;
  let parsingCData = false;
  notParsing = false;
  const content = new Parser2({
    onprocessinginstruction(name, data) {
      if (name.toLowerCase() === "!doctype")
        document.doctype = data.slice(name.length).trim();
    },
    onopentag(name, attributes) {
      let create = true;
      if (isHTML) {
        if (ownerSVGElement) {
          node = append2(node, document.createElementNS(SVG_NAMESPACE, name), active);
          node.ownerSVGElement = ownerSVGElement;
          create = false;
        } else if (name === "svg" || name === "SVG") {
          ownerSVGElement = document.createElementNS(SVG_NAMESPACE, name);
          node = append2(node, ownerSVGElement, active);
          create = false;
        } else if (active) {
          const ce = name.includes("-") ? name : attributes.is || "";
          if (ce && registry.has(ce)) {
            const { Class } = registry.get(ce);
            node = append2(node, new Class, active);
            delete attributes.is;
            create = false;
          }
        }
      }
      if (create)
        node = append2(node, document.createElement(name), false);
      let end = node[END];
      for (const name of keys(attributes))
        attribute(node, end, document.createAttribute(name), attributes[name], active);
    },
    oncomment(data) {
      append2(node, document.createComment(data), active);
    },
    ontext(text) {
      if (parsingCData) {
        append2(node, document.createCDATASection(text), active);
      } else {
        append2(node, document.createTextNode(text), active);
      }
    },
    oncdatastart() {
      parsingCData = true;
    },
    oncdataend() {
      parsingCData = false;
    },
    onclosetag() {
      if (isHTML && node === ownerSVGElement)
        ownerSVGElement = null;
      node = node.parentNode;
    }
  }, {
    lowerCaseAttributeNames: false,
    decodeEntities: true,
    xmlMode: !isHTML
  });
  content.write(markupLanguage);
  content.end();
  notParsing = true;
  return document;
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/register-html-class.js
var htmlClasses = new Map;
var registerHTMLClass = (names, Class) => {
  for (const name of [].concat(names)) {
    htmlClasses.set(name, Class);
    htmlClasses.set(name.toUpperCase(), Class);
  }
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/jsdon.js
var loopSegment = ({ [NEXT]: next, [END]: end }, json) => {
  while (next !== end) {
    switch (next.nodeType) {
      case ATTRIBUTE_NODE:
        attrAsJSON(next, json);
        break;
      case TEXT_NODE:
      case COMMENT_NODE:
      case CDATA_SECTION_NODE:
        characterDataAsJSON(next, json);
        break;
      case ELEMENT_NODE:
        elementAsJSON(next, json);
        next = getEnd(next);
        break;
      case DOCUMENT_TYPE_NODE:
        documentTypeAsJSON(next, json);
        break;
    }
    next = next[NEXT];
  }
  const last = json.length - 1;
  const value = json[last];
  if (typeof value === "number" && value < 0)
    json[last] += NODE_END;
  else
    json.push(NODE_END);
};
var attrAsJSON = (attr, json) => {
  json.push(ATTRIBUTE_NODE, attr.name);
  const value = attr[VALUE].trim();
  if (value)
    json.push(value);
};
var characterDataAsJSON = (node, json) => {
  const value = node[VALUE];
  if (value.trim())
    json.push(node.nodeType, value);
};
var nonElementAsJSON = (node, json) => {
  json.push(node.nodeType);
  loopSegment(node, json);
};
var documentTypeAsJSON = ({ name, publicId, systemId }, json) => {
  json.push(DOCUMENT_TYPE_NODE, name);
  if (publicId)
    json.push(publicId);
  if (systemId)
    json.push(systemId);
};
var elementAsJSON = (element, json) => {
  json.push(ELEMENT_NODE, element.localName);
  loopSegment(element, json);
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/mutation-observer.js
var createRecord = (type, target, element, addedNodes, removedNodes, attributeName, oldValue) => ({
  type,
  target,
  addedNodes,
  removedNodes,
  attributeName,
  oldValue,
  previousSibling: element?.previousSibling || null,
  nextSibling: element?.nextSibling || null
});
var queueAttribute = (observer, target, attributeName, attributeFilter, attributeOldValue, oldValue) => {
  if (!attributeFilter || attributeFilter.includes(attributeName)) {
    const { callback, records, scheduled } = observer;
    records.push(createRecord("attributes", target, null, [], [], attributeName, attributeOldValue ? oldValue : undefined));
    if (!scheduled) {
      observer.scheduled = true;
      Promise.resolve().then(() => {
        observer.scheduled = false;
        callback(records.splice(0), observer);
      });
    }
  }
};
var attributeChangedCallback2 = (element, attributeName, oldValue) => {
  const { ownerDocument } = element;
  const { active, observers } = ownerDocument[MUTATION_OBSERVER];
  if (active) {
    for (const observer of observers) {
      for (const [
        target,
        {
          childList,
          subtree,
          attributes,
          attributeFilter,
          attributeOldValue
        }
      ] of observer.nodes) {
        if (childList) {
          if (subtree && (target === ownerDocument || target.contains(element)) || !subtree && target.children.includes(element)) {
            queueAttribute(observer, element, attributeName, attributeFilter, attributeOldValue, oldValue);
            break;
          }
        } else if (attributes && target === element) {
          queueAttribute(observer, element, attributeName, attributeFilter, attributeOldValue, oldValue);
          break;
        }
      }
    }
  }
};
var moCallback = (element, parentNode) => {
  const { ownerDocument } = element;
  const { active, observers } = ownerDocument[MUTATION_OBSERVER];
  if (active) {
    for (const observer of observers) {
      for (const [target, { subtree, childList, characterData }] of observer.nodes) {
        if (childList) {
          if (parentNode && (target === parentNode || subtree && target.contains(parentNode)) || !parentNode && (subtree && (target === ownerDocument || target.contains(element)) || !subtree && target[characterData ? "childNodes" : "children"].includes(element))) {
            const { callback, records, scheduled } = observer;
            records.push(createRecord("childList", target, element, parentNode ? [] : [element], parentNode ? [element] : []));
            if (!scheduled) {
              observer.scheduled = true;
              Promise.resolve().then(() => {
                observer.scheduled = false;
                callback(records.splice(0), observer);
              });
            }
            break;
          }
        }
      }
    }
  }
};

class MutationObserverClass {
  constructor(ownerDocument) {
    const observers = new Set;
    this.observers = observers;
    this.active = false;
    this.class = class MutationObserver {
      constructor(callback) {
        this.callback = callback;
        this.nodes = new Map;
        this.records = [];
        this.scheduled = false;
      }
      disconnect() {
        this.records.splice(0);
        this.nodes.clear();
        observers.delete(this);
        ownerDocument[MUTATION_OBSERVER].active = !!observers.size;
      }
      observe(target, options = {
        subtree: false,
        childList: false,
        attributes: false,
        attributeFilter: null,
        attributeOldValue: false,
        characterData: false
      }) {
        if ("attributeOldValue" in options || "attributeFilter" in options)
          options.attributes = true;
        options.childList = !!options.childList;
        options.subtree = !!options.subtree;
        this.nodes.set(target, options);
        observers.add(this);
        ownerDocument[MUTATION_OBSERVER].active = true;
      }
      takeRecords() {
        return this.records.splice(0);
      }
    };
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/attributes.js
var emptyAttributes = new Set([
  "allowfullscreen",
  "allowpaymentrequest",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "class",
  "contenteditable",
  "controls",
  "default",
  "defer",
  "disabled",
  "draggable",
  "formnovalidate",
  "hidden",
  "id",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
  "style",
  "truespeed"
]);
var setAttribute = (element, attribute) => {
  const { [VALUE]: value, name } = attribute;
  attribute.ownerElement = element;
  knownSiblings(element, attribute, element[NEXT]);
  if (name === "class")
    element.className = value;
  attributeChangedCallback2(element, name, null);
  attributeChangedCallback(element, name, null, value);
};
var removeAttribute = (element, attribute) => {
  const { [VALUE]: value, name } = attribute;
  knownAdjacent(attribute[PREV], attribute[NEXT]);
  attribute.ownerElement = attribute[PREV] = attribute[NEXT] = null;
  if (name === "class")
    element[CLASS_LIST] = null;
  attributeChangedCallback2(element, name, value);
  attributeChangedCallback(element, name, value, null);
};
var booleanAttribute = {
  get(element, name) {
    return element.hasAttribute(name);
  },
  set(element, name, value) {
    if (value)
      element.setAttribute(name, "");
    else
      element.removeAttribute(name);
  }
};
var numericAttribute = {
  get(element, name) {
    return parseFloat(element.getAttribute(name) || 0);
  },
  set(element, name, value) {
    element.setAttribute(name, value);
  }
};
var stringAttribute = {
  get(element, name) {
    return element.getAttribute(name) || "";
  },
  set(element, name, value) {
    element.setAttribute(name, value);
  }
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/event-target.js
var wm = new WeakMap;
function dispatch(event, listener) {
  if (typeof listener === "function")
    listener.call(event.target, event);
  else
    listener.handleEvent(event);
  return event._stopImmediatePropagationFlag;
}
function invokeListeners({ currentTarget, target }) {
  const map = wm.get(currentTarget);
  if (map && map.has(this.type)) {
    const listeners = map.get(this.type);
    if (currentTarget === target) {
      this.eventPhase = this.AT_TARGET;
    } else {
      this.eventPhase = this.BUBBLING_PHASE;
    }
    this.currentTarget = currentTarget;
    this.target = target;
    for (const [listener, options] of listeners) {
      if (options && options.once)
        listeners.delete(listener);
      if (dispatch(this, listener))
        break;
    }
    delete this.currentTarget;
    delete this.target;
    return this.cancelBubble;
  }
}

class DOMEventTarget {
  constructor() {
    wm.set(this, new Map);
  }
  _getParent() {
    return null;
  }
  addEventListener(type, listener, options) {
    const map = wm.get(this);
    if (!map.has(type))
      map.set(type, new Map);
    map.get(type).set(listener, options);
  }
  removeEventListener(type, listener) {
    const map = wm.get(this);
    if (map.has(type)) {
      const listeners = map.get(type);
      if (listeners.delete(listener) && !listeners.size)
        map.delete(type);
    }
  }
  dispatchEvent(event) {
    let node = this;
    event.eventPhase = event.CAPTURING_PHASE;
    while (node) {
      if (node.dispatchEvent)
        event._path.push({ currentTarget: node, target: this });
      node = event.bubbles && node._getParent && node._getParent();
    }
    event._path.some(invokeListeners, event);
    event._path = [];
    event.eventPhase = event.NONE;
    return !event.defaultPrevented;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/node-list.js
class NodeList extends Array {
  item(i) {
    return i < this.length ? this[i] : null;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/node.js
var getParentNodeCount = ({ parentNode }) => {
  let count = 0;
  while (parentNode) {
    count++;
    parentNode = parentNode.parentNode;
  }
  return count;
};

class Node2 extends DOMEventTarget {
  static get ELEMENT_NODE() {
    return ELEMENT_NODE;
  }
  static get ATTRIBUTE_NODE() {
    return ATTRIBUTE_NODE;
  }
  static get TEXT_NODE() {
    return TEXT_NODE;
  }
  static get CDATA_SECTION_NODE() {
    return CDATA_SECTION_NODE;
  }
  static get COMMENT_NODE() {
    return COMMENT_NODE;
  }
  static get DOCUMENT_NODE() {
    return DOCUMENT_NODE;
  }
  static get DOCUMENT_FRAGMENT_NODE() {
    return DOCUMENT_FRAGMENT_NODE;
  }
  static get DOCUMENT_TYPE_NODE() {
    return DOCUMENT_TYPE_NODE;
  }
  constructor(ownerDocument, localName, nodeType) {
    super();
    this.ownerDocument = ownerDocument;
    this.localName = localName;
    this.nodeType = nodeType;
    this.parentNode = null;
    this[NEXT] = null;
    this[PREV] = null;
  }
  get ELEMENT_NODE() {
    return ELEMENT_NODE;
  }
  get ATTRIBUTE_NODE() {
    return ATTRIBUTE_NODE;
  }
  get TEXT_NODE() {
    return TEXT_NODE;
  }
  get CDATA_SECTION_NODE() {
    return CDATA_SECTION_NODE;
  }
  get COMMENT_NODE() {
    return COMMENT_NODE;
  }
  get DOCUMENT_NODE() {
    return DOCUMENT_NODE;
  }
  get DOCUMENT_FRAGMENT_NODE() {
    return DOCUMENT_FRAGMENT_NODE;
  }
  get DOCUMENT_TYPE_NODE() {
    return DOCUMENT_TYPE_NODE;
  }
  get baseURI() {
    const ownerDocument = this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument;
    if (ownerDocument) {
      const base = ownerDocument.querySelector("base");
      if (base)
        return base.getAttribute("href");
      const { location } = ownerDocument.defaultView;
      if (location)
        return location.href;
    }
    return null;
  }
  get isConnected() {
    return false;
  }
  get nodeName() {
    return this.localName;
  }
  get parentElement() {
    return null;
  }
  get previousSibling() {
    return null;
  }
  get previousElementSibling() {
    return null;
  }
  get nextSibling() {
    return null;
  }
  get nextElementSibling() {
    return null;
  }
  get childNodes() {
    return new NodeList;
  }
  get firstChild() {
    return null;
  }
  get lastChild() {
    return null;
  }
  get nodeValue() {
    return null;
  }
  set nodeValue(value) {}
  get textContent() {
    return null;
  }
  set textContent(value) {}
  normalize() {}
  cloneNode() {
    return null;
  }
  contains() {
    return false;
  }
  insertBefore(newNode, referenceNode) {
    return newNode;
  }
  appendChild(child) {
    return child;
  }
  replaceChild(newChild, oldChild) {
    return oldChild;
  }
  removeChild(child) {
    return child;
  }
  toString() {
    return "";
  }
  hasChildNodes() {
    return !!this.lastChild;
  }
  isSameNode(node) {
    return this === node;
  }
  compareDocumentPosition(target) {
    let result = 0;
    if (this !== target) {
      let self = getParentNodeCount(this);
      let other = getParentNodeCount(target);
      if (self < other) {
        result += DOCUMENT_POSITION_FOLLOWING;
        if (this.contains(target))
          result += DOCUMENT_POSITION_CONTAINED_BY;
      } else if (other < self) {
        result += DOCUMENT_POSITION_PRECEDING;
        if (target.contains(this))
          result += DOCUMENT_POSITION_CONTAINS;
      } else if (self && other) {
        const { childNodes } = this.parentNode;
        if (childNodes.indexOf(this) < childNodes.indexOf(target))
          result += DOCUMENT_POSITION_FOLLOWING;
        else
          result += DOCUMENT_POSITION_PRECEDING;
      }
      if (!self || !other) {
        result += DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
        result += DOCUMENT_POSITION_DISCONNECTED;
      }
    }
    return result;
  }
  isEqualNode(node) {
    if (this === node)
      return true;
    if (this.nodeType === node.nodeType) {
      switch (this.nodeType) {
        case DOCUMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE: {
          const aNodes = this.childNodes;
          const bNodes = node.childNodes;
          return aNodes.length === bNodes.length && aNodes.every((node, i) => node.isEqualNode(bNodes[i]));
        }
      }
      return this.toString() === node.toString();
    }
    return false;
  }
  _getParent() {
    return this.parentNode;
  }
  getRootNode() {
    let root = this;
    while (root.parentNode)
      root = root.parentNode;
    return root;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/text-escaper.js
var { replace } = "";
var ca = /[<>&\xA0]/g;
var esca = {
  " ": "&#160;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
var pe = (m) => esca[m];
var escape2 = (es) => replace.call(es, ca, pe);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/attr.js
var QUOTE = /"/g;

class Attr extends Node2 {
  constructor(ownerDocument, name, value = "") {
    super(ownerDocument, name, ATTRIBUTE_NODE);
    this.ownerElement = null;
    this.name = $String(name);
    this[VALUE] = $String(value);
    this[CHANGED] = false;
  }
  get value() {
    return this[VALUE];
  }
  set value(newValue) {
    const { [VALUE]: oldValue, name, ownerElement } = this;
    this[VALUE] = $String(newValue);
    this[CHANGED] = true;
    if (ownerElement) {
      attributeChangedCallback2(ownerElement, name, oldValue);
      attributeChangedCallback(ownerElement, name, oldValue, this[VALUE]);
    }
  }
  cloneNode() {
    const { ownerDocument, name, [VALUE]: value } = this;
    return new Attr(ownerDocument, name, value);
  }
  toString() {
    const { name, [VALUE]: value } = this;
    if (emptyAttributes.has(name) && !value) {
      return ignoreCase(this) ? name : `${name}=""`;
    }
    const escapedValue = (ignoreCase(this) ? value : escape2(value)).replace(QUOTE, "&quot;");
    return `${name}="${escapedValue}"`;
  }
  toJSON() {
    const json = [];
    attrAsJSON(this, json);
    return json;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/node.js
var isConnected = ({ ownerDocument, parentNode }) => {
  while (parentNode) {
    if (parentNode === ownerDocument)
      return true;
    parentNode = parentNode.parentNode || parentNode.host;
  }
  return false;
};
var parentElement = ({ parentNode }) => {
  if (parentNode) {
    switch (parentNode.nodeType) {
      case DOCUMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE:
        return null;
    }
  }
  return parentNode;
};
var previousSibling = ({ [PREV]: prev }) => {
  switch (prev ? prev.nodeType : 0) {
    case NODE_END:
      return prev[START];
    case TEXT_NODE:
    case COMMENT_NODE:
    case CDATA_SECTION_NODE:
      return prev;
  }
  return null;
};
var nextSibling = (node) => {
  const next = getEnd(node)[NEXT];
  return next && (next.nodeType === NODE_END ? null : next);
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/mixin/non-document-type-child-node.js
var nextElementSibling2 = (node) => {
  let next = nextSibling(node);
  while (next && next.nodeType !== ELEMENT_NODE)
    next = nextSibling(next);
  return next;
};
var previousElementSibling = (node) => {
  let prev = previousSibling(node);
  while (prev && prev.nodeType !== ELEMENT_NODE)
    prev = previousSibling(prev);
  return prev;
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/mixin/child-node.js
var asFragment = (ownerDocument, nodes) => {
  const fragment = ownerDocument.createDocumentFragment();
  fragment.append(...nodes);
  return fragment;
};
var before = (node, nodes) => {
  const { ownerDocument, parentNode } = node;
  if (parentNode)
    parentNode.insertBefore(asFragment(ownerDocument, nodes), node);
};
var after = (node, nodes) => {
  const { ownerDocument, parentNode } = node;
  if (parentNode)
    parentNode.insertBefore(asFragment(ownerDocument, nodes), getEnd(node)[NEXT]);
};
var replaceWith = (node, nodes) => {
  const { ownerDocument, parentNode } = node;
  if (parentNode) {
    if (nodes.includes(node))
      replaceWith(node, [node = node.cloneNode()]);
    parentNode.insertBefore(asFragment(ownerDocument, nodes), node);
    node.remove();
  }
};
var remove = (prev, current, next) => {
  const { parentNode, nodeType } = current;
  if (prev || next) {
    setAdjacent(prev, next);
    current[PREV] = null;
    getEnd(current)[NEXT] = null;
  }
  if (parentNode) {
    current.parentNode = null;
    moCallback(current, parentNode);
    if (nodeType === ELEMENT_NODE)
      disconnectedCallback(current);
  }
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/character-data.js
class CharacterData extends Node2 {
  constructor(ownerDocument, localName, nodeType, data) {
    super(ownerDocument, localName, nodeType);
    this[VALUE] = $String(data);
  }
  get isConnected() {
    return isConnected(this);
  }
  get parentElement() {
    return parentElement(this);
  }
  get previousSibling() {
    return previousSibling(this);
  }
  get nextSibling() {
    return nextSibling(this);
  }
  get previousElementSibling() {
    return previousElementSibling(this);
  }
  get nextElementSibling() {
    return nextElementSibling2(this);
  }
  before(...nodes) {
    before(this, nodes);
  }
  after(...nodes) {
    after(this, nodes);
  }
  replaceWith(...nodes) {
    replaceWith(this, nodes);
  }
  remove() {
    remove(this[PREV], this, this[NEXT]);
  }
  get data() {
    return this[VALUE];
  }
  set data(value) {
    this[VALUE] = $String(value);
    moCallback(this, this.parentNode);
  }
  get nodeValue() {
    return this.data;
  }
  set nodeValue(value) {
    this.data = value;
  }
  get textContent() {
    return this.data;
  }
  set textContent(value) {
    this.data = value;
  }
  get length() {
    return this.data.length;
  }
  substringData(offset, count) {
    return this.data.substr(offset, count);
  }
  appendData(data) {
    this.data += data;
  }
  insertData(offset, data) {
    const { data: t } = this;
    this.data = t.slice(0, offset) + data + t.slice(offset);
  }
  deleteData(offset, count) {
    const { data: t } = this;
    this.data = t.slice(0, offset) + t.slice(offset + count);
  }
  replaceData(offset, count, data) {
    const { data: t } = this;
    this.data = t.slice(0, offset) + data + t.slice(offset + count);
  }
  toJSON() {
    const json = [];
    characterDataAsJSON(this, json);
    return json;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/cdata-section.js
class CDATASection extends CharacterData {
  constructor(ownerDocument, data = "") {
    super(ownerDocument, "#cdatasection", CDATA_SECTION_NODE, data);
  }
  cloneNode() {
    const { ownerDocument, [VALUE]: data } = this;
    return new CDATASection(ownerDocument, data);
  }
  toString() {
    return `<![CDATA[${this[VALUE]}]]>`;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/comment.js
class Comment3 extends CharacterData {
  constructor(ownerDocument, data = "") {
    super(ownerDocument, "#comment", COMMENT_NODE, data);
  }
  cloneNode() {
    const { ownerDocument, [VALUE]: data } = this;
    return new Comment3(ownerDocument, data);
  }
  toString() {
    return `<!--${this[VALUE]}-->`;
  }
}

// node_modules/.bun/boolbase@2.0.0/node_modules/boolbase/dist/index.js
function trueFunc() {
  return true;
}
function falseFunc() {
  return false;
}

// node_modules/.bun/css-what@8.0.0/node_modules/css-what/dist/types.js
var SelectorType;
(function(SelectorType) {
  SelectorType["Attribute"] = "attribute";
  SelectorType["Pseudo"] = "pseudo";
  SelectorType["PseudoElement"] = "pseudo-element";
  SelectorType["Tag"] = "tag";
  SelectorType["Universal"] = "universal";
  SelectorType["Adjacent"] = "adjacent";
  SelectorType["Child"] = "child";
  SelectorType["Descendant"] = "descendant";
  SelectorType["Parent"] = "parent";
  SelectorType["Sibling"] = "sibling";
  SelectorType["ColumnCombinator"] = "column-combinator";
})(SelectorType || (SelectorType = {}));
var AttributeAction;
(function(AttributeAction) {
  AttributeAction["Any"] = "any";
  AttributeAction["Element"] = "element";
  AttributeAction["End"] = "end";
  AttributeAction["Equals"] = "equals";
  AttributeAction["Exists"] = "exists";
  AttributeAction["Hyphen"] = "hyphen";
  AttributeAction["Not"] = "not";
  AttributeAction["Start"] = "start";
})(AttributeAction || (AttributeAction = {}));

// node_modules/.bun/css-what@8.0.0/node_modules/css-what/dist/parse.js
var reName = /^[^#\\]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\u00B0-\uFFFF-])+/;
var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
var CharCode;
(function(CharCode) {
  CharCode[CharCode["LeftParenthesis"] = 40] = "LeftParenthesis";
  CharCode[CharCode["RightParenthesis"] = 41] = "RightParenthesis";
  CharCode[CharCode["LeftSquareBracket"] = 91] = "LeftSquareBracket";
  CharCode[CharCode["RightSquareBracket"] = 93] = "RightSquareBracket";
  CharCode[CharCode["Comma"] = 44] = "Comma";
  CharCode[CharCode["Period"] = 46] = "Period";
  CharCode[CharCode["Colon"] = 58] = "Colon";
  CharCode[CharCode["SingleQuote"] = 39] = "SingleQuote";
  CharCode[CharCode["DoubleQuote"] = 34] = "DoubleQuote";
  CharCode[CharCode["Plus"] = 43] = "Plus";
  CharCode[CharCode["Tilde"] = 126] = "Tilde";
  CharCode[CharCode["QuestionMark"] = 63] = "QuestionMark";
  CharCode[CharCode["ExclamationMark"] = 33] = "ExclamationMark";
  CharCode[CharCode["Slash"] = 47] = "Slash";
  CharCode[CharCode["Equal"] = 61] = "Equal";
  CharCode[CharCode["Dollar"] = 36] = "Dollar";
  CharCode[CharCode["Pipe"] = 124] = "Pipe";
  CharCode[CharCode["Circumflex"] = 94] = "Circumflex";
  CharCode[CharCode["Asterisk"] = 42] = "Asterisk";
  CharCode[CharCode["GreaterThan"] = 62] = "GreaterThan";
  CharCode[CharCode["LessThan"] = 60] = "LessThan";
  CharCode[CharCode["Hash"] = 35] = "Hash";
  CharCode[CharCode["LowerI"] = 105] = "LowerI";
  CharCode[CharCode["LowerS"] = 115] = "LowerS";
  CharCode[CharCode["BackSlash"] = 92] = "BackSlash";
  CharCode[CharCode["Space"] = 32] = "Space";
  CharCode[CharCode["Tab"] = 9] = "Tab";
  CharCode[CharCode["NewLine"] = 10] = "NewLine";
  CharCode[CharCode["FormFeed"] = 12] = "FormFeed";
  CharCode[CharCode["CarriageReturn"] = 13] = "CarriageReturn";
})(CharCode || (CharCode = {}));
var actionTypes = new Map([
  [CharCode.Tilde, AttributeAction.Element],
  [CharCode.Circumflex, AttributeAction.Start],
  [CharCode.Dollar, AttributeAction.End],
  [CharCode.Asterisk, AttributeAction.Any],
  [CharCode.ExclamationMark, AttributeAction.Not],
  [CharCode.Pipe, AttributeAction.Hyphen]
]);
var unpackPseudos = new Set([
  "has",
  "not",
  "matches",
  "is",
  "where",
  "host",
  "host-context"
]);
var pseudosToPseudoElements = new Set([
  "before",
  "after",
  "first-line",
  "first-letter"
]);
function isTraversal(selector) {
  switch (selector.type) {
    case SelectorType.Adjacent:
    case SelectorType.Child:
    case SelectorType.Descendant:
    case SelectorType.Parent:
    case SelectorType.Sibling:
    case SelectorType.ColumnCombinator: {
      return true;
    }
    case SelectorType.Attribute:
    case SelectorType.Pseudo:
    case SelectorType.PseudoElement:
    case SelectorType.Tag:
    case SelectorType.Universal: {
      return false;
    }
  }
}
var stripQuotesFromPseudos = new Set(["contains", "icontains"]);
function funescape(_, escaped, escapedWhitespace) {
  const high = Number.parseInt(escaped, 16) - 65536;
  return Number.isNaN(high) || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
}
function unescapeCSS(cssString) {
  return cssString.replace(reEscape, funescape);
}
function isQuote(c) {
  return c === CharCode.SingleQuote || c === CharCode.DoubleQuote;
}
function isWhitespace2(c) {
  return c === CharCode.Space || c === CharCode.Tab || c === CharCode.NewLine || c === CharCode.FormFeed || c === CharCode.CarriageReturn;
}
function parse3(selector) {
  const subselects = [];
  const endIndex = parseSelector(subselects, `${selector}`, 0);
  if (endIndex < selector.length) {
    throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`);
  }
  return subselects;
}
function parseSelector(subselects, selector, selectorIndex) {
  let tokens = [];
  function getName(offset) {
    const match = selector.slice(selectorIndex + offset).match(reName);
    if (!match) {
      throw new Error(`Expected name, found ${selector.slice(selectorIndex)}`);
    }
    const [name] = match;
    selectorIndex += offset + name.length;
    return unescapeCSS(name);
  }
  function stripWhitespace(offset) {
    selectorIndex += offset;
    while (selectorIndex < selector.length && isWhitespace2(selector.charCodeAt(selectorIndex))) {
      selectorIndex++;
    }
  }
  function readValueWithParenthesis() {
    selectorIndex += 1;
    const start = selectorIndex;
    for (let counter = 1;selectorIndex < selector.length; selectorIndex++) {
      switch (selector.charCodeAt(selectorIndex)) {
        case CharCode.BackSlash: {
          selectorIndex += 1;
          break;
        }
        case CharCode.LeftParenthesis: {
          counter += 1;
          break;
        }
        case CharCode.RightParenthesis: {
          counter -= 1;
          if (counter === 0) {
            return unescapeCSS(selector.slice(start, selectorIndex++));
          }
          break;
        }
      }
    }
    throw new Error("Parenthesis not matched");
  }
  function ensureNotTraversal() {
    if (tokens.length > 0 && isTraversal(tokens[tokens.length - 1])) {
      throw new Error("Did not expect successive traversals.");
    }
  }
  function addTraversal(type) {
    if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
      tokens[tokens.length - 1].type = type;
      return;
    }
    ensureNotTraversal();
    tokens.push({ type });
  }
  function addSpecialAttribute(name, action) {
    tokens.push({
      type: SelectorType.Attribute,
      name,
      action,
      value: getName(1),
      namespace: null,
      ignoreCase: "quirks"
    });
  }
  function finalizeSubselector() {
    if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
      tokens.pop();
    }
    if (tokens.length === 0) {
      throw new Error("Empty sub-selector");
    }
    subselects.push(tokens);
  }
  stripWhitespace(0);
  if (selector.length === selectorIndex) {
    return selectorIndex;
  }
  loop:
    while (selectorIndex < selector.length) {
      const firstChar = selector.charCodeAt(selectorIndex);
      switch (firstChar) {
        case CharCode.Space:
        case CharCode.Tab:
        case CharCode.NewLine:
        case CharCode.FormFeed:
        case CharCode.CarriageReturn: {
          if (tokens.length === 0 || tokens[0].type !== SelectorType.Descendant) {
            ensureNotTraversal();
            tokens.push({ type: SelectorType.Descendant });
          }
          stripWhitespace(1);
          break;
        }
        case CharCode.GreaterThan: {
          addTraversal(SelectorType.Child);
          stripWhitespace(1);
          break;
        }
        case CharCode.LessThan: {
          addTraversal(SelectorType.Parent);
          stripWhitespace(1);
          break;
        }
        case CharCode.Tilde: {
          addTraversal(SelectorType.Sibling);
          stripWhitespace(1);
          break;
        }
        case CharCode.Plus: {
          addTraversal(SelectorType.Adjacent);
          stripWhitespace(1);
          break;
        }
        case CharCode.Period: {
          addSpecialAttribute("class", AttributeAction.Element);
          break;
        }
        case CharCode.Hash: {
          addSpecialAttribute("id", AttributeAction.Equals);
          break;
        }
        case CharCode.LeftSquareBracket: {
          stripWhitespace(1);
          let name;
          let namespace = null;
          if (selector.charCodeAt(selectorIndex) === CharCode.Pipe) {
            name = getName(1);
          } else if (selector.startsWith("*|", selectorIndex)) {
            namespace = "*";
            name = getName(2);
          } else {
            name = getName(0);
            if (selector.charCodeAt(selectorIndex) === CharCode.Pipe && selector.charCodeAt(selectorIndex + 1) !== CharCode.Equal) {
              namespace = name;
              name = getName(1);
            }
          }
          stripWhitespace(0);
          let action = AttributeAction.Exists;
          const possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
          if (possibleAction) {
            action = possibleAction;
            if (selector.charCodeAt(selectorIndex + 1) !== CharCode.Equal) {
              throw new Error("Expected `=`");
            }
            stripWhitespace(2);
          } else if (selector.charCodeAt(selectorIndex) === CharCode.Equal) {
            action = AttributeAction.Equals;
            stripWhitespace(1);
          }
          let value = "";
          let ignoreCase = null;
          if (action !== "exists") {
            if (isQuote(selector.charCodeAt(selectorIndex))) {
              const quote = selector.charCodeAt(selectorIndex);
              selectorIndex += 1;
              const sectionStart = selectorIndex;
              while (selectorIndex < selector.length && selector.charCodeAt(selectorIndex) !== quote) {
                selectorIndex += selector.charCodeAt(selectorIndex) === CharCode.BackSlash ? 2 : 1;
              }
              if (selector.charCodeAt(selectorIndex) !== quote) {
                throw new Error("Attribute value didn't end");
              }
              value = unescapeCSS(selector.slice(sectionStart, selectorIndex));
              selectorIndex += 1;
            } else {
              const valueStart = selectorIndex;
              while (selectorIndex < selector.length && !isWhitespace2(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== CharCode.RightSquareBracket) {
                selectorIndex += selector.charCodeAt(selectorIndex) === CharCode.BackSlash ? 2 : 1;
              }
              value = unescapeCSS(selector.slice(valueStart, selectorIndex));
            }
            stripWhitespace(0);
            switch (selector.charCodeAt(selectorIndex) | 32) {
              case CharCode.LowerI: {
                ignoreCase = true;
                stripWhitespace(1);
                break;
              }
              case CharCode.LowerS: {
                ignoreCase = false;
                stripWhitespace(1);
                break;
              }
            }
          }
          if (selector.charCodeAt(selectorIndex) !== CharCode.RightSquareBracket) {
            throw new Error("Attribute selector didn't terminate");
          }
          selectorIndex += 1;
          const attributeSelector = {
            type: SelectorType.Attribute,
            name,
            action,
            value,
            namespace,
            ignoreCase
          };
          tokens.push(attributeSelector);
          break;
        }
        case CharCode.Colon: {
          if (selector.charCodeAt(selectorIndex + 1) === CharCode.Colon) {
            tokens.push({
              type: SelectorType.PseudoElement,
              name: getName(2).toLowerCase(),
              data: selector.charCodeAt(selectorIndex) === CharCode.LeftParenthesis ? readValueWithParenthesis() : null
            });
            break;
          }
          const name = getName(1).toLowerCase();
          if (pseudosToPseudoElements.has(name)) {
            tokens.push({
              type: SelectorType.PseudoElement,
              name,
              data: null
            });
            break;
          }
          let data = null;
          if (selector.charCodeAt(selectorIndex) === CharCode.LeftParenthesis) {
            if (unpackPseudos.has(name)) {
              if (isQuote(selector.charCodeAt(selectorIndex + 1))) {
                throw new Error(`Pseudo-selector ${name} cannot be quoted`);
              }
              data = [];
              selectorIndex = parseSelector(data, selector, selectorIndex + 1);
              if (selector.charCodeAt(selectorIndex) !== CharCode.RightParenthesis) {
                throw new Error(`Missing closing parenthesis in :${name} (${selector})`);
              }
              selectorIndex += 1;
            } else {
              data = readValueWithParenthesis();
              if (stripQuotesFromPseudos.has(name)) {
                const quot = data.charCodeAt(0);
                if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) {
                  data = data.slice(1, -1);
                }
              }
              data = unescapeCSS(data);
            }
          }
          tokens.push({ type: SelectorType.Pseudo, name, data });
          break;
        }
        case CharCode.Comma: {
          finalizeSubselector();
          tokens = [];
          stripWhitespace(1);
          break;
        }
        default: {
          if (selector.startsWith("/*", selectorIndex)) {
            const endIndex = selector.indexOf("*/", selectorIndex + 2);
            if (endIndex === -1) {
              throw new Error("Comment was not terminated");
            }
            selectorIndex = endIndex + 2;
            if (tokens.length === 0) {
              stripWhitespace(0);
            }
            break;
          }
          let namespace = null;
          let name;
          if (firstChar === CharCode.Asterisk) {
            selectorIndex += 1;
            name = "*";
          } else if (firstChar === CharCode.Pipe) {
            name = "";
            if (selector.charCodeAt(selectorIndex + 1) === CharCode.Pipe) {
              addTraversal(SelectorType.ColumnCombinator);
              stripWhitespace(2);
              break;
            }
          } else if (reName.test(selector.slice(selectorIndex))) {
            name = getName(0);
          } else {
            break loop;
          }
          if (selector.charCodeAt(selectorIndex) === CharCode.Pipe && selector.charCodeAt(selectorIndex + 1) !== CharCode.Pipe) {
            namespace = name;
            if (selector.charCodeAt(selectorIndex + 1) === CharCode.Asterisk) {
              name = "*";
              selectorIndex += 2;
            } else {
              name = getName(1);
            }
          }
          tokens.push(name === "*" ? { type: SelectorType.Universal, namespace } : { type: SelectorType.Tag, name, namespace });
        }
      }
    }
  finalizeSubselector();
  return selectorIndex;
}
// node_modules/.bun/domelementtype@3.0.0/node_modules/domelementtype/dist/index.js
var ElementType2;
(function(ElementType) {
  ElementType["Root"] = "root";
  ElementType["Text"] = "text";
  ElementType["Directive"] = "directive";
  ElementType["Comment"] = "comment";
  ElementType["Script"] = "script";
  ElementType["Style"] = "style";
  ElementType["Tag"] = "tag";
  ElementType["CDATA"] = "cdata";
  ElementType["Doctype"] = "doctype";
})(ElementType2 || (ElementType2 = {}));
function isTag3(element) {
  return element.type === ElementType2.Tag || element.type === ElementType2.Script || element.type === ElementType2.Style;
}
var Root2 = ElementType2.Root;
var Text3 = ElementType2.Text;
var Directive2 = ElementType2.Directive;
var Comment4 = ElementType2.Comment;
var Script2 = ElementType2.Script;
var Style2 = ElementType2.Style;
var Tag2 = ElementType2.Tag;
var CDATA3 = ElementType2.CDATA;
var Doctype2 = ElementType2.Doctype;

// node_modules/.bun/domhandler@6.0.1/node_modules/domhandler/dist/node.js
function isTag4(node) {
  return isTag3(node);
}
function isCDATA2(node) {
  return node.type === ElementType2.CDATA;
}
function isText2(node) {
  return node.type === ElementType2.Text;
}
function isComment2(node) {
  return node.type === ElementType2.Comment;
}
function hasChildren2(node) {
  return Object.hasOwn(node, "children");
}

// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/index.js
var exports_dist2 = {};
__export(exports_dist2, {
  DocumentPosition: () => DocumentPosition2,
  append: () => append3,
  appendChild: () => appendChild2,
  compareDocumentPosition: () => compareDocumentPosition2,
  existsOne: () => existsOne2,
  filter: () => filter2,
  find: () => find2,
  findAll: () => findAll2,
  findOne: () => findOne2,
  getAttributeValue: () => getAttributeValue2,
  getChildren: () => getChildren2,
  getElementById: () => getElementById2,
  getElements: () => getElements2,
  getElementsByClassName: () => getElementsByClassName2,
  getElementsByTagName: () => getElementsByTagName2,
  getElementsByTagType: () => getElementsByTagType2,
  getFeed: () => getFeed2,
  getInnerHTML: () => getInnerHTML2,
  getName: () => getName2,
  getOuterHTML: () => getOuterHTML2,
  getParent: () => getParent2,
  getSiblings: () => getSiblings2,
  getText: () => getText2,
  hasAttrib: () => hasAttrib2,
  innerText: () => innerText2,
  nextElementSibling: () => nextElementSibling3,
  prepend: () => prepend2,
  prependChild: () => prependChild2,
  prevElementSibling: () => prevElementSibling2,
  removeElement: () => removeElement2,
  removeSubsets: () => removeSubsets2,
  replaceElement: () => replaceElement2,
  testElement: () => testElement2,
  textContent: () => textContent2,
  uniqueSort: () => uniqueSort2
});

// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/querying.js
function filter2(test, node, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return find2(test, Array.isArray(node) ? node : [node], recurse, limit);
}
function find2(test, nodes, recurse, limit) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (;; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (indexStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const element = nodeStack[0][indexStack[0]++];
    if (test(element)) {
      result.push(element);
      if (--limit <= 0)
        return result;
    }
    if (recurse && hasChildren2(element) && element.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(element.children);
    }
  }
}
function findOne2(test, nodes, recurse = true) {
  const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
  for (const node of searchedNodes) {
    if (isTag4(node) && test(node)) {
      return node;
    }
    if (recurse && hasChildren2(node) && node.children.length > 0) {
      const found = findOne2(test, node.children, true);
      if (found)
        return found;
    }
  }
  return null;
}
function existsOne2(test, nodes) {
  return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag4(node) && test(node) || hasChildren2(node) && existsOne2(test, node.children));
}
function findAll2(test, nodes) {
  const result = [];
  const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
  const indexStack = [0];
  for (;; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const element = nodeStack[0][indexStack[0]++];
    if (isTag4(element) && test(element))
      result.push(element);
    if (hasChildren2(element) && element.children.length > 0) {
      indexStack.unshift(0);
      nodeStack.unshift(element.children);
    }
  }
}

// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/legacy.js
var Checks2 = {
  tag_name(name) {
    if (typeof name === "function") {
      return (element) => isTag4(element) && name(element.name);
    }
    if (name === "*") {
      return isTag4;
    }
    return (element) => isTag4(element) && element.name === name;
  },
  tag_type(type) {
    if (typeof type === "function") {
      return (element) => type(element.type);
    }
    return (element) => element.type === type;
  },
  tag_contains(data) {
    if (typeof data === "function") {
      return (element) => isText2(element) && data(element.data);
    }
    return (element) => isText2(element) && element.data === data;
  }
};
function getAttribCheck2(attrib, value) {
  if (typeof value === "function") {
    return (element) => isTag4(element) && value(element.attribs[attrib]);
  }
  return (element) => isTag4(element) && element.attribs[attrib] === value;
}
function combineFuncs2(a, b) {
  return (element) => a(element) || b(element);
}
function compileTest2(options) {
  const funcs = Object.keys(options).map((key) => {
    const value = options[key];
    return Object.hasOwn(Checks2, key) ? Checks2[key](value) : getAttribCheck2(key, value);
  });
  return funcs.length === 0 ? null : funcs.reduce(combineFuncs2);
}
function testElement2(options, node) {
  const test = compileTest2(options);
  return test ? test(node) : true;
}
function getElements2(options, nodes, recurse, limit = Number.POSITIVE_INFINITY) {
  const test = compileTest2(options);
  return test ? filter2(test, nodes, recurse, limit) : [];
}
function getElementById2(id, nodes, recurse = true) {
  if (!Array.isArray(nodes))
    nodes = [nodes];
  return findOne2(getAttribCheck2("id", id), nodes, recurse);
}
function getElementsByTagName2(tagName, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return filter2(Checks2["tag_name"](tagName), nodes, recurse, limit);
}
function getElementsByClassName2(className, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return filter2(getAttribCheck2("class", className), nodes, recurse, limit);
}
function getElementsByTagType2(type, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
  return filter2(Checks2["tag_type"](type), nodes, recurse, limit);
}

// node_modules/.bun/entities@8.1.0/node_modules/entities/dist/escape.js
function getEscape(char) {
  return char === 34 ? "&quot;" : char === 38 ? "&amp;" : char === 39 ? "&apos;" : char === 60 ? "&lt;" : char === 62 ? "&gt;" : "&nbsp;";
}
var XML_BITSET_VALUE = 1342177476;
var xmlEncodeRegex = /["&'<>\u0080-\uFFFF]/g;
function isXmlEscapable(code) {
  return code >= 128 || code >= 32 && code < 64 && (XML_BITSET_VALUE >>> code & 1) === 1;
}
function encodeXML2(input) {
  const { length } = input;
  let out;
  let last = 0;
  let index = 0;
  while (index < length) {
    const char = input.charCodeAt(index);
    if (!isXmlEscapable(char)) {
      const bound = Math.min(index + 32, length);
      let next = index + 1;
      while (next < bound && !isXmlEscapable(input.charCodeAt(next))) {
        next++;
      }
      if (next < bound) {
        index = next;
        continue;
      }
      if (next >= length)
        break;
      xmlEncodeRegex.lastIndex = next;
      if (!xmlEncodeRegex.test(input))
        break;
      index = xmlEncodeRegex.lastIndex - 1;
      continue;
    }
    if (out === undefined)
      out = input.substring(0, index);
    else if (last !== index)
      out += input.substring(last, index);
    if (char < 64) {
      out += getEscape(char);
      last = index += 1;
      continue;
    }
    const cp = input.codePointAt(index);
    out += `&#x${cp.toString(16)};`;
    if (cp !== char)
      index++;
    last = index += 1;
  }
  if (out === undefined)
    return input;
  if (last < length)
    out += input.substr(last);
  return out;
}
function escapeWithRegex(re, data) {
  re.lastIndex = 0;
  if (!re.test(data))
    return data;
  let out = "";
  let last = 0;
  do {
    const index = re.lastIndex - 1;
    if (last !== index)
      out += data.substring(last, index);
    const char = data.charCodeAt(index);
    out += getEscape(char);
    last = index + 1;
  } while (re.test(data));
  return out + data.substring(last);
}
var attributeEscapeRegex = /["&\u{A0}]/gu;
function escapeAttribute2(data) {
  return escapeWithRegex(attributeEscapeRegex, data);
}
var textEscapeRegex = /[&<>\u{A0}]/gu;
function escapeText2(data) {
  return escapeWithRegex(textEscapeRegex, data);
}

// node_modules/.bun/entities@8.1.0/node_modules/entities/dist/index.js
var EntityLevel2;
(function(EntityLevel) {
  EntityLevel[EntityLevel["XML"] = 0] = "XML";
  EntityLevel[EntityLevel["HTML"] = 1] = "HTML";
})(EntityLevel2 || (EntityLevel2 = {}));
var EncodingMode2;
(function(EncodingMode) {
  EncodingMode[EncodingMode["UTF8"] = 0] = "UTF8";
  EncodingMode[EncodingMode["ASCII"] = 1] = "ASCII";
  EncodingMode[EncodingMode["Extensive"] = 2] = "Extensive";
  EncodingMode[EncodingMode["Attribute"] = 3] = "Attribute";
  EncodingMode[EncodingMode["Text"] = 4] = "Text";
})(EncodingMode2 || (EncodingMode2 = {}));

// node_modules/.bun/dom-serializer@3.1.1/node_modules/dom-serializer/dist/foreign-names.js
var elementNames2 = new Map("altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath".split(" ").map((name) => [name.toLowerCase(), name]));
var attributeNames2 = new Map("definitionURL attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits diffuseConstant edgeMode filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan".split(" ").map((name) => [name.toLowerCase(), name]));

// node_modules/.bun/dom-serializer@3.1.1/node_modules/dom-serializer/dist/index.js
var unencodedElements2 = new Set("style script xmp iframe noembed noframes plaintext noscript".split(" "));
var voidElements2 = new Set("area base basefont br col command embed frame hr img input isindex keygen link meta param source track wbr".split(" "));
var foreignElements2 = new Set(["svg", "math"]);
var foreignModeIntegrationPoints2 = new Set("mi mo mn ms mtext annotation-xml foreignObject desc title".split(" "));
function render2(node, options = {}) {
  const nodes = "length" in node ? node : [node];
  const xmlMode = options.xmlMode ?? false;
  let output = "";
  for (let index = 0;index < nodes.length; index++) {
    output += renderNode2(nodes[index], options, xmlMode);
  }
  return output;
}
var dist_default = render2;
function renderChildren(children, options, xmlMode) {
  let output = "";
  for (let index = 0;index < children.length; index++) {
    output += renderNode2(children[index], options, xmlMode);
  }
  return output;
}
function renderNode2(node, options, xmlMode) {
  switch (node.type) {
    case Root2: {
      return renderChildren(node.children, options, xmlMode);
    }
    case Directive2: {
      return `<${node.data}>`;
    }
    case Comment4: {
      return `<!--${node.data}-->`;
    }
    case CDATA3: {
      return `<![CDATA[${node.children[0].data}]]>`;
    }
    case Script2:
    case Style2:
    case Tag2: {
      return renderTag2(node, options, xmlMode);
    }
    case Text3: {
      const element = node;
      const data = element.data || "";
      if ((options.encodeEntities ?? options.decodeEntities) !== false && !(!xmlMode && element.parent && unencodedElements2.has(element.parent.name))) {
        return xmlMode || options.encodeEntities !== "utf8" ? encodeXML2(data) : escapeText2(data);
      }
      return data;
    }
  }
}
function renderTag2(element, options, xmlMode) {
  if (xmlMode === "foreign") {
    element.name = elementNames2.get(element.name) ?? element.name;
    if (element.parent && foreignModeIntegrationPoints2.has(element.parent.name)) {
      xmlMode = false;
    }
  }
  if (!xmlMode && foreignElements2.has(element.name)) {
    xmlMode = "foreign";
  }
  const { name, children } = element;
  const isVoid = !xmlMode && voidElements2.has(name);
  let tag = `<${name}${formatAttributes2(element.attribs, options, xmlMode)}`;
  if (children.length === 0 && (xmlMode ? options.selfClosingTags !== false : options.selfClosingTags && isVoid)) {
    tag += xmlMode ? "/>" : " />";
  } else {
    tag += ">";
    if (children.length > 0) {
      tag += renderChildren(children, options, xmlMode);
    }
    if (!isVoid) {
      tag += `</${name}>`;
    }
  }
  return tag;
}
function replaceQuotes2(value) {
  return value.replaceAll('"', "&quot;");
}
function formatAttributes2(attributes, options, xmlMode) {
  if (!attributes)
    return "";
  const encode = (options.encodeEntities ?? options.decodeEntities) === false ? replaceQuotes2 : xmlMode || options.encodeEntities !== "utf8" ? encodeXML2 : escapeAttribute2;
  const isForeign = xmlMode === "foreign";
  const showEmpty = !!(options.emptyAttrs ?? xmlMode);
  let result = "";
  for (const key in attributes) {
    if (!Object.hasOwn(attributes, key))
      continue;
    const value = attributes[key];
    const k = isForeign ? attributeNames2.get(key) ?? key : key;
    result += !showEmpty && (value == null || value === "") ? ` ${k}` : ` ${k}="${encode(value == null ? "" : String(value))}"`;
  }
  return result;
}

// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/stringify.js
function getOuterHTML2(node, options) {
  return dist_default(node, options);
}
function getInnerHTML2(node, options) {
  return hasChildren2(node) ? node.children.map((node) => getOuterHTML2(node, options)).join("") : "";
}
function getText2(node) {
  if (Array.isArray(node))
    return node.map(getText2).join("");
  if (isTag4(node))
    return node.name === "br" ? `
` : getText2(node.children);
  if (isCDATA2(node))
    return getText2(node.children);
  if (isText2(node))
    return node.data;
  return "";
}
function textContent2(node) {
  if (Array.isArray(node))
    return node.map(textContent2).join("");
  if (hasChildren2(node) && !isComment2(node)) {
    return textContent2(node.children);
  }
  if (isText2(node))
    return node.data;
  return "";
}
function innerText2(node) {
  if (Array.isArray(node))
    return node.map(innerText2).join("");
  if (hasChildren2(node) && (node.type === ElementType2.Tag || isCDATA2(node))) {
    return innerText2(node.children);
  }
  if (isText2(node))
    return node.data;
  return "";
}

// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/feeds.js
function getFeed2(document) {
  const feedRoot = getOneElement2(isValidFeed2, document);
  return feedRoot ? feedRoot.name === "feed" ? getAtomFeed2(feedRoot) : getRssFeed2(feedRoot) : null;
}
function getAtomFeed2(feedRoot) {
  const childs = feedRoot.children;
  const feed = {
    type: "atom",
    items: getElementsByTagName2("entry", childs).map((item) => {
      const { children } = item;
      const entry = { media: getMediaElements2(children) };
      addConditionally2(entry, "id", "id", children);
      addConditionally2(entry, "title", "title", children);
      const href = getOneElement2("link", children)?.attribs["href"];
      if (href) {
        entry.link = href;
      }
      const description = fetch3("summary", children) || fetch3("content", children);
      if (description) {
        entry.description = description;
      }
      const pubDate = fetch3("updated", children);
      if (pubDate) {
        entry.pubDate = new Date(pubDate);
      }
      return entry;
    })
  };
  addConditionally2(feed, "id", "id", childs);
  addConditionally2(feed, "title", "title", childs);
  const href = getOneElement2("link", childs)?.attribs["href"];
  if (href) {
    feed.link = href;
  }
  addConditionally2(feed, "description", "subtitle", childs);
  const updated = fetch3("updated", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally2(feed, "author", "email", childs, true);
  return feed;
}
function getRssFeed2(feedRoot) {
  const childs = getOneElement2("channel", feedRoot.children)?.children ?? [];
  const feed = {
    type: feedRoot.name.substr(0, 3),
    id: "",
    items: getElementsByTagName2("item", feedRoot.children).map((item) => {
      const { children } = item;
      const entry = { media: getMediaElements2(children) };
      addConditionally2(entry, "id", "guid", children);
      addConditionally2(entry, "title", "title", children);
      addConditionally2(entry, "link", "link", children);
      addConditionally2(entry, "description", "description", children);
      const pubDate = fetch3("pubDate", children) || fetch3("dc:date", children);
      if (pubDate)
        entry.pubDate = new Date(pubDate);
      return entry;
    })
  };
  addConditionally2(feed, "title", "title", childs);
  addConditionally2(feed, "link", "link", childs);
  addConditionally2(feed, "description", "description", childs);
  const updated = fetch3("lastBuildDate", childs);
  if (updated) {
    feed.updated = new Date(updated);
  }
  addConditionally2(feed, "author", "managingEditor", childs, true);
  return feed;
}
var MEDIA_KEYS_STRING2 = ["url", "type", "lang"];
var MEDIA_KEYS_INT2 = [
  "fileSize",
  "bitrate",
  "framerate",
  "samplingrate",
  "channels",
  "duration",
  "height",
  "width"
];
function getMediaElements2(where) {
  return getElementsByTagName2("media:content", where).map((element) => {
    const { attribs } = element;
    const media = {
      medium: attribs["medium"],
      isDefault: !!attribs["isDefault"]
    };
    for (const attrib of MEDIA_KEYS_STRING2) {
      if (attribs[attrib]) {
        media[attrib] = attribs[attrib];
      }
    }
    for (const attrib of MEDIA_KEYS_INT2) {
      if (attribs[attrib]) {
        media[attrib] = Number.parseInt(attribs[attrib], 10);
      }
    }
    if (attribs["expression"]) {
      media.expression = attribs["expression"];
    }
    return media;
  });
}
function getOneElement2(tagName, node) {
  return getElementsByTagName2(tagName, node, true, 1)[0];
}
function fetch3(tagName, where, recurse = false) {
  return textContent2(getElementsByTagName2(tagName, where, recurse, 1)).trim();
}
function addConditionally2(object, property, tagName, where, recurse = false) {
  const value = fetch3(tagName, where, recurse);
  if (value)
    object[property] = value;
}
function isValidFeed2(value) {
  return value === "rss" || value === "feed" || value === "rdf:RDF";
}
// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/helpers.js
function removeSubsets2(nodes) {
  let index = nodes.length;
  while (--index >= 0) {
    const node = nodes[index];
    if (index > 0 && nodes.lastIndexOf(node, index - 1) >= 0) {
      nodes.splice(index, 1);
      continue;
    }
    for (let ancestor = node.parent;ancestor; ancestor = ancestor.parent) {
      if (nodes.includes(ancestor)) {
        nodes.splice(index, 1);
        break;
      }
    }
  }
  return nodes;
}
var DocumentPosition2;
(function(DocumentPosition) {
  DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
  DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
  DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
  DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
  DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition2 || (DocumentPosition2 = {}));
function compareDocumentPosition2(nodeA, nodeB) {
  const aParents = [];
  const bParents = [];
  if (nodeA === nodeB) {
    return 0;
  }
  let current = hasChildren2(nodeA) ? nodeA : nodeA.parent;
  while (current) {
    aParents.unshift(current);
    current = current.parent;
  }
  current = hasChildren2(nodeB) ? nodeB : nodeB.parent;
  while (current) {
    bParents.unshift(current);
    current = current.parent;
  }
  const maxIndex = Math.min(aParents.length, bParents.length);
  let index = 0;
  while (index < maxIndex && aParents[index] === bParents[index]) {
    index++;
  }
  if (index === 0) {
    return DocumentPosition2.DISCONNECTED;
  }
  const sharedParent = aParents[index - 1];
  const siblings = sharedParent.children;
  const aSibling = aParents[index];
  const bSibling = bParents[index];
  if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
    if (sharedParent === nodeB) {
      return DocumentPosition2.FOLLOWING | DocumentPosition2.CONTAINED_BY;
    }
    return DocumentPosition2.FOLLOWING;
  }
  if (sharedParent === nodeA) {
    return DocumentPosition2.PRECEDING | DocumentPosition2.CONTAINS;
  }
  return DocumentPosition2.PRECEDING;
}
function uniqueSort2(nodes) {
  nodes = nodes.filter((node, index, array) => !array.includes(node, index + 1));
  nodes.sort((a, b) => {
    const relative = compareDocumentPosition2(a, b);
    if (relative & DocumentPosition2.PRECEDING) {
      return -1;
    }
    if (relative & DocumentPosition2.FOLLOWING) {
      return 1;
    }
    return 0;
  });
  return nodes;
}
// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/manipulation.js
function removeElement2(element) {
  if (element.prev)
    element.prev.next = element.next;
  if (element.next)
    element.next.prev = element.prev;
  if (element.parent) {
    const childs = element.parent.children;
    const childsIndex = childs.lastIndexOf(element);
    if (childsIndex !== -1) {
      childs.splice(childsIndex, 1);
    }
  }
  element.next = null;
  element.prev = null;
  element.parent = null;
}
function replaceElement2(element, replacement) {
  replacement.prev = element.prev;
  if (replacement.prev) {
    replacement.prev.next = replacement;
  }
  replacement.next = element.next;
  if (replacement.next) {
    replacement.next.prev = replacement;
  }
  replacement.parent = element.parent;
  if (replacement.parent) {
    const { children } = replacement.parent;
    const elementIndex = children.lastIndexOf(element);
    if (elementIndex === -1) {
      return;
    }
    children[elementIndex] = replacement;
    element.parent = null;
  }
}
function appendChild2(parent, child) {
  removeElement2(child);
  child.next = null;
  child.parent = parent;
  if (parent.children.push(child) > 1) {
    const sibling = parent.children[parent.children.length - 2];
    sibling.next = child;
    child.prev = sibling;
  } else {
    child.prev = null;
  }
}
function append3(element, next) {
  removeElement2(next);
  const { parent } = element;
  const currentNext = element.next;
  next.next = currentNext;
  next.prev = element;
  element.next = next;
  next.parent = parent;
  if (currentNext) {
    currentNext.prev = next;
    if (parent) {
      const childs = parent.children;
      childs.splice(childs.lastIndexOf(currentNext), 0, next);
    }
  } else if (parent) {
    parent.children.push(next);
  }
}
function prependChild2(parent, child) {
  removeElement2(child);
  child.parent = parent;
  child.prev = null;
  if (parent.children.unshift(child) === 1) {
    child.next = null;
  } else {
    const sibling = parent.children[1];
    sibling.prev = child;
    child.next = sibling;
  }
}
function prepend2(element, previous) {
  removeElement2(previous);
  const { parent } = element;
  if (parent) {
    const childs = parent.children;
    childs.splice(childs.indexOf(element), 0, previous);
  }
  if (element.prev) {
    element.prev.next = previous;
  }
  previous.parent = parent;
  previous.prev = element.prev;
  previous.next = element;
  element.prev = previous;
}
// node_modules/.bun/domutils@4.0.2/node_modules/domutils/dist/traversal.js
function getChildren2(element) {
  return hasChildren2(element) ? element.children : [];
}
function getParent2(element) {
  return element.parent || null;
}
function getSiblings2(element) {
  const parent = getParent2(element);
  if (parent != null)
    return getChildren2(parent);
  const siblings = [element];
  let { prev, next } = element;
  while (prev != null) {
    siblings.unshift(prev);
    ({ prev } = prev);
  }
  while (next != null) {
    siblings.push(next);
    ({ next } = next);
  }
  return siblings;
}
function getAttributeValue2(element, name) {
  const { attribs } = element;
  return attribs?.[name];
}
function hasAttrib2(element, name) {
  const { attribs } = element;
  return attribs != null && Object.hasOwn(attribs, name) && attribs[name] != null;
}
function getName2(element) {
  return element.name;
}
function nextElementSibling3(element) {
  let { next } = element;
  while (next !== null && !isTag4(next))
    ({ next } = next);
  return next;
}
function prevElementSibling2(element) {
  let { prev } = element;
  while (prev !== null && !isTag4(prev))
    ({ prev } = prev);
  return prev;
}
// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/attributes.js
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
var whitespaceRe = /\s/;
function escapeRegex2(value) {
  return value.replace(reChars, "\\$&");
}
var caseInsensitiveAttributes = new Set([
  "accept",
  "accept-charset",
  "align",
  "alink",
  "axis",
  "bgcolor",
  "charset",
  "checked",
  "clear",
  "codetype",
  "color",
  "compact",
  "declare",
  "defer",
  "dir",
  "direction",
  "disabled",
  "enctype",
  "face",
  "frame",
  "hreflang",
  "http-equiv",
  "lang",
  "language",
  "link",
  "media",
  "method",
  "multiple",
  "nohref",
  "noresize",
  "noshade",
  "nowrap",
  "readonly",
  "rel",
  "rev",
  "rules",
  "scope",
  "scrolling",
  "selected",
  "shape",
  "target",
  "text",
  "type",
  "valign",
  "valuetype",
  "vlink"
]);
function shouldIgnoreCase(selector, options) {
  return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
}
var attributeRules = {
  equals(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (element) => {
        const attribute = adapter.getAttributeValue(element, name);
        return attribute != null && attribute.length === value.length && attribute.toLowerCase() === value && next(element);
      };
    }
    return (element) => adapter.getAttributeValue(element, name) === value && next(element);
  },
  hyphen(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const { length } = value;
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return function hyphenIC(element) {
        const attribute = adapter.getAttributeValue(element, name);
        return attribute != null && (attribute.length === length || attribute.charAt(length) === "-") && attribute.substr(0, length).toLowerCase() === value && next(element);
      };
    }
    return function hyphen(element) {
      const attribute = adapter.getAttributeValue(element, name);
      return attribute != null && (attribute.length === length || attribute.charAt(length) === "-") && attribute.substr(0, length) === value && next(element);
    };
  },
  element(next, data, options) {
    const { adapter } = options;
    const { name, value } = data;
    if (whitespaceRe.test(value)) {
      return falseFunc;
    }
    const regex = new RegExp(`(?:^|\\s)${escapeRegex2(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
    return function element(node) {
      const attribute = adapter.getAttributeValue(node, name);
      return attribute != null && attribute.length >= value.length && regex.test(attribute) && next(node);
    };
  },
  exists(next, { name }, { adapter }) {
    return (element) => adapter.hasAttrib(element, name) && next(element);
  },
  start(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const { length } = value;
    if (length === 0) {
      return falseFunc;
    }
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (element) => {
        const attribute = adapter.getAttributeValue(element, name);
        return attribute != null && attribute.length >= length && attribute.substr(0, length).toLowerCase() === value && next(element);
      };
    }
    return (element) => !!adapter.getAttributeValue(element, name)?.startsWith(value) && next(element);
  },
  end(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    const length = -value.length;
    if (length === 0) {
      return falseFunc;
    }
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (element) => adapter.getAttributeValue(element, name)?.substr(length).toLowerCase() === value && next(element);
    }
    return (element) => !!adapter.getAttributeValue(element, name)?.endsWith(value) && next(element);
  },
  any(next, data, options) {
    const { adapter } = options;
    const { name, value } = data;
    if (value === "") {
      return falseFunc;
    }
    if (shouldIgnoreCase(data, options)) {
      const regex = new RegExp(escapeRegex2(value), "i");
      return function anyIC(element) {
        const attribute = adapter.getAttributeValue(element, name);
        return attribute != null && attribute.length >= value.length && regex.test(attribute) && next(element);
      };
    }
    return (element) => !!adapter.getAttributeValue(element, name)?.includes(value) && next(element);
  },
  not(next, data, options) {
    const { adapter } = options;
    const { name } = data;
    let { value } = data;
    if (value === "") {
      return (element) => !!adapter.getAttributeValue(element, name) && next(element);
    }
    if (shouldIgnoreCase(data, options)) {
      value = value.toLowerCase();
      return (element) => {
        const attribute = adapter.getAttributeValue(element, name);
        return (attribute == null || attribute.length !== value.length || attribute.toLowerCase() !== value) && next(element);
      };
    }
    return (element) => adapter.getAttributeValue(element, name) !== value && next(element);
  }
};

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/helpers/querying.js
function findAll3(query, nodes, options) {
  const { adapter, xmlMode = false } = options;
  const result = [];
  const nodeStack = [nodes];
  const indexStack = [0];
  for (;; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return result;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const element = nodeStack[0][indexStack[0]++];
    if (!adapter.isTag(element)) {
      continue;
    }
    if (query(element)) {
      result.push(element);
    }
    if (xmlMode || adapter.getName(element) !== "template") {
      const children = adapter.getChildren(element);
      if (children.length > 0) {
        nodeStack.unshift(children);
        indexStack.unshift(0);
      }
    }
  }
}
function findOne3(query, nodes, options) {
  const { adapter, xmlMode = false } = options;
  const nodeStack = [nodes];
  const indexStack = [0];
  for (;; ) {
    if (indexStack[0] >= nodeStack[0].length) {
      if (nodeStack.length === 1) {
        return null;
      }
      nodeStack.shift();
      indexStack.shift();
      continue;
    }
    const element = nodeStack[0][indexStack[0]++];
    if (!adapter.isTag(element)) {
      continue;
    }
    if (query(element)) {
      return element;
    }
    if (xmlMode || adapter.getName(element) !== "template") {
      const children = adapter.getChildren(element);
      if (children.length > 0) {
        nodeStack.unshift(children);
        indexStack.unshift(0);
      }
    }
  }
}
function getNextSiblings(element, adapter) {
  const siblings = adapter.getSiblings(element);
  if (siblings.length <= 1) {
    return [];
  }
  const elementIndex = siblings.indexOf(element);
  if (elementIndex === -1 || elementIndex === siblings.length - 1) {
    return [];
  }
  return siblings.slice(elementIndex + 1).filter(adapter.isTag);
}
function getElementParent(node, adapter) {
  const parent = adapter.getParent(node);
  return parent != null && adapter.isTag(parent) ? parent : null;
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/pseudo-selectors/aliases.js
var textControl = "input:is([type=text i],[type=search i],[type=url i],[type=tel i],[type=email i],[type=password i],[type=date i],[type=month i],[type=week i],[type=time i],[type=datetime-local i],[type=number i])";
var aliases = {
  "any-link": ":is(a, area, link)[href]",
  link: ":any-link:not(:visited)",
  disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
  enabled: ":is(button, input, select, textarea, optgroup, option, fieldset):not(:disabled)",
  checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], :selected)",
  required: ":is(input, select, textarea)[required]",
  optional: ":is(input, select, textarea):not([required])",
  "read-only": `[readonly]:is(textarea, ${textControl})`,
  "read-write": `:not([readonly]):is(textarea, ${textControl})`,
  selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
  checkbox: "[type=checkbox]",
  file: "[type=file]",
  password: "[type=password]",
  radio: "[type=radio]",
  reset: "[type=reset]",
  image: "[type=image]",
  submit: "[type=submit]",
  parent: ":not(:empty)",
  header: ":is(h1, h2, h3, h4, h5, h6)",
  button: ":is(button, input[type=button])",
  input: ":is(input, textarea, select, button)",
  text: "input:is(:not([type!='']), [type=text])"
};

// node_modules/.bun/nth-check@3.0.1/node_modules/nth-check/dist/compile.js
function compile2(parsed) {
  const a = parsed[0];
  const b = parsed[1] - 1;
  if (b < 0 && a <= 0)
    return falseFunc;
  if (a === -1)
    return (index) => index <= b;
  if (a === 0)
    return (index) => index === b;
  if (a === 1)
    return b < 0 ? trueFunc : (index) => index >= b;
  const absA = Math.abs(a);
  const bModulo = (b % absA + absA) % absA;
  return a > 1 ? (index) => index >= b && index % absA === bModulo : (index) => index <= b && index % absA === bModulo;
}

// node_modules/.bun/nth-check@3.0.1/node_modules/nth-check/dist/parse.js
var whitespace = new Set([9, 10, 12, 13, 32]);
var ZERO = 48;
var NINE = 57;
function parse4(formula) {
  formula = formula.trim().toLowerCase();
  switch (formula) {
    case "even": {
      return [2, 0];
    }
    case "odd": {
      return [2, 1];
    }
  }
  let index = 0;
  let a = 0;
  let sign = readSign();
  let number = readNumber();
  if (index < formula.length && formula.charAt(index) === "n") {
    index++;
    a = sign * (number ?? 1);
    skipWhitespace();
    if (index < formula.length) {
      sign = readSign();
      skipWhitespace();
      number = readNumber();
    } else {
      sign = number = 0;
    }
  }
  if (number === null || index < formula.length) {
    throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
  }
  return [a, sign * number];
  function readSign() {
    switch (formula.charAt(index)) {
      case "-": {
        index++;
        return -1;
      }
      case "+": {
        index++;
        break;
      }
    }
    return 1;
  }
  function readNumber() {
    const start = index;
    let value = 0;
    while (index < formula.length && formula.charCodeAt(index) >= ZERO && formula.charCodeAt(index) <= NINE) {
      value = value * 10 + (formula.charCodeAt(index) - ZERO);
      index++;
    }
    return index === start ? null : value;
  }
  function skipWhitespace() {
    while (index < formula.length && whitespace.has(formula.charCodeAt(index))) {
      index++;
    }
  }
}

// node_modules/.bun/nth-check@3.0.1/node_modules/nth-check/dist/index.js
function nthCheck(formula) {
  return compile2(parse4(formula));
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/helpers/cache.js
function cacheParentResults(next, { adapter, cacheResults }, matches) {
  if (cacheResults === false || typeof WeakMap === "undefined") {
    return (element) => next(element) && matches(element);
  }
  const resultCache = new WeakMap;
  function addResultToCache(element) {
    const result = matches(element);
    resultCache.set(element, result);
    return result;
  }
  return function cachedMatcher(element) {
    if (!next(element)) {
      return false;
    }
    if (resultCache.has(element)) {
      return resultCache.get(element) ?? false;
    }
    let node = element;
    do {
      const parent = getElementParent(node, adapter);
      if (parent === null) {
        return addResultToCache(element);
      }
      node = parent;
    } while (!resultCache.has(node));
    return resultCache.get(node) ? addResultToCache(element) : false;
  };
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/helpers/options.js
function copyOptions(options) {
  const { context: _, rootFunc: __, ...copied } = options;
  return copied;
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/pseudo-selectors/filters.js
function extendedFilter(tag, range) {
  if (range[0] !== "*" && range[0] !== tag[0])
    return false;
  let tagIndex = 1;
  for (let rangeIndex = 1;rangeIndex < range.length; rangeIndex++) {
    if (range[rangeIndex] === "*")
      continue;
    while (tagIndex < tag.length && tag[tagIndex] !== range[rangeIndex]) {
      if (tag[tagIndex++].length <= 1)
        return false;
    }
    if (tagIndex >= tag.length)
      return false;
    tagIndex++;
  }
  return true;
}
var nthOfRegex = /^(.+?)\s+of\s+(.+)$/is;
function compileNth(reverse, ofType) {
  return function nth(next, rule, options, context, compileToken) {
    const { adapter, equals } = options;
    const ofMatch = ofType ? null : rule.match(nthOfRegex);
    const nthCheck2 = nthCheck(ofMatch ? ofMatch[1].trim() : rule);
    if (nthCheck2 === falseFunc)
      return falseFunc;
    const ofSelector = ofMatch && compileToken ? compileToken(parse3(ofMatch[2].trim()), copyOptions(options), context) : undefined;
    if (ofSelector === falseFunc)
      return falseFunc;
    if (nthCheck2 === trueFunc && !ofSelector) {
      return (element) => getElementParent(element, adapter) !== null && next(element);
    }
    const shouldCount = ofSelector ? (_element, sibling) => ofSelector(sibling) : ofType ? (element, sibling) => adapter.getName(sibling) === adapter.getName(element) : trueFunc;
    if (reverse) {
      return function nthLast(element) {
        if (ofSelector && !ofSelector(element))
          return false;
        const siblings = adapter.getSiblings(element);
        let pos = 0;
        for (let index = siblings.length - 1;index >= 0; index--) {
          const sibling = siblings[index];
          if (equals(element, sibling))
            break;
          if (adapter.isTag(sibling) && shouldCount(element, sibling))
            pos++;
        }
        return nthCheck2(pos) && next(element);
      };
    }
    return function nth(element) {
      if (ofSelector && !ofSelector(element))
        return false;
      const siblings = adapter.getSiblings(element);
      let pos = 0;
      for (const sibling of siblings) {
        if (equals(element, sibling))
          break;
        if (adapter.isTag(sibling) && shouldCount(element, sibling))
          pos++;
      }
      return nthCheck2(pos) && next(element);
    };
  };
}
var filters = {
  contains(next, text, options) {
    const { getText } = options.adapter;
    return cacheParentResults(next, options, (element) => getText(element).includes(text));
  },
  icontains(next, text, options) {
    const itext = text.toLowerCase();
    const { getText } = options.adapter;
    return cacheParentResults(next, options, (element) => getText(element).toLowerCase().includes(itext));
  },
  "nth-child": compileNth(false, false),
  "nth-last-child": compileNth(true, false),
  "nth-of-type": compileNth(false, true),
  "nth-last-of-type": compileNth(true, true),
  root(next, _rule, { adapter }) {
    return (element) => getElementParent(element, adapter) === null && next(element);
  },
  scope(next, rule, options, context) {
    const { equals } = options;
    if (!context || context.length === 0) {
      return filters["root"](next, rule, options);
    }
    if (context.length === 1) {
      return (element) => equals(context[0], element) && next(element);
    }
    return (element) => context.includes(element) && next(element);
  },
  lang(next, code, { adapter }) {
    const ranges = code.split(",").map((r) => r.trim()).filter((r) => r.length > 0).map((r) => r.replace(/^['"]|['"]$/g, "").toLowerCase().split("-"));
    return function lang(element) {
      let node = element;
      while (node != null) {
        const value = adapter.getAttributeValue(node, "xml:lang") ?? adapter.getAttributeValue(node, "lang");
        if (value != null) {
          if (!value) {
            return ranges.some((r) => r[0] === "") && next(element);
          }
          const tag = value.toLowerCase().split("-");
          return ranges.some((r) => extendedFilter(tag, r)) && next(element);
        }
        const parent = adapter.getParent(node);
        node = parent != null && adapter.isTag(parent) ? parent : null;
      }
      return ranges.some((r) => r[0] === "") && next(element);
    };
  },
  hover: dynamicStatePseudo("isHovered"),
  visited: dynamicStatePseudo("isVisited"),
  active: dynamicStatePseudo("isActive")
};
function dynamicStatePseudo(name) {
  return function dynamicPseudo(next, _rule, { adapter }) {
    const filterFunction = adapter[name];
    if (typeof filterFunction !== "function") {
      return falseFunc;
    }
    return function active(element) {
      return filterFunction(element) && next(element);
    };
  };
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/pseudo-selectors/pseudos.js
var isDocumentWhiteSpace = /^[ \t\r\n]*$/;
var pseudos = {
  empty(element, { adapter }) {
    const children = adapter.getChildren(element);
    return children.every((element) => !adapter.isTag(element)) && children.every((element) => isDocumentWhiteSpace.test(adapter.getText(element)));
  },
  "first-child"(element, { adapter, equals }) {
    if (adapter.prevElementSibling) {
      return adapter.prevElementSibling(element) == null;
    }
    const firstChild = adapter.getSiblings(element).find((sibling) => adapter.isTag(sibling));
    return firstChild != null && equals(element, firstChild);
  },
  "last-child"(element, { adapter, equals }) {
    const siblings = adapter.getSiblings(element);
    for (let index = siblings.length - 1;index >= 0; index--) {
      if (equals(element, siblings[index])) {
        return true;
      }
      if (adapter.isTag(siblings[index])) {
        break;
      }
    }
    return false;
  },
  "first-of-type"(element, { adapter, equals }) {
    const siblings = adapter.getSiblings(element);
    const elementName = adapter.getName(element);
    for (const currentSibling of siblings) {
      if (equals(element, currentSibling)) {
        return true;
      }
      if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elementName) {
        break;
      }
    }
    return false;
  },
  "last-of-type"(element, { adapter, equals }) {
    const siblings = adapter.getSiblings(element);
    const elementName = adapter.getName(element);
    for (let index = siblings.length - 1;index >= 0; index--) {
      const currentSibling = siblings[index];
      if (equals(element, currentSibling)) {
        return true;
      }
      if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elementName) {
        break;
      }
    }
    return false;
  },
  "only-of-type"(element, { adapter, equals }) {
    const elementName = adapter.getName(element);
    return adapter.getSiblings(element).every((sibling) => equals(element, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elementName);
  },
  "only-child"(element, { adapter, equals }) {
    return adapter.getSiblings(element).every((sibling) => equals(element, sibling) || !adapter.isTag(sibling));
  }
};
function verifyPseudoArguments(pseudoClassCondition, name, subselect, argumentIndex) {
  if (subselect === null) {
    if (pseudoClassCondition.length > argumentIndex) {
      throw new Error(`Pseudo-class :${name} requires an argument`);
    }
  } else if (pseudoClassCondition.length === argumentIndex) {
    throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
  }
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/helpers/selectors.js
function isTraversal2(token) {
  return token.type === "_flexibleDescendant" || isTraversal(token);
}
function sortRules(array) {
  const ratings = array.map(getQuality);
  for (let index = 1;index < array.length; index++) {
    const procNew = ratings[index];
    if (procNew < 0) {
      continue;
    }
    for (let currentIndex = index;currentIndex > 0 && procNew < ratings[currentIndex - 1]; currentIndex--) {
      const token = array[currentIndex];
      array[currentIndex] = array[currentIndex - 1];
      array[currentIndex - 1] = token;
      ratings[currentIndex] = ratings[currentIndex - 1];
      ratings[currentIndex - 1] = procNew;
    }
  }
}
function getAttributeQuality(token) {
  switch (token.action) {
    case AttributeAction.Exists: {
      return 10;
    }
    case AttributeAction.Equals: {
      return token.name === "id" ? 9 : 8;
    }
    case AttributeAction.Not: {
      return 7;
    }
    case AttributeAction.Start: {
      return 6;
    }
    case AttributeAction.End: {
      return 6;
    }
    case AttributeAction.Any: {
      return 5;
    }
    case AttributeAction.Hyphen: {
      return 4;
    }
    case AttributeAction.Element: {
      return 3;
    }
  }
}
function getQuality(token) {
  switch (token.type) {
    case SelectorType.Universal: {
      return 50;
    }
    case SelectorType.Tag: {
      return 30;
    }
    case SelectorType.Attribute: {
      return Math.floor(getAttributeQuality(token) / (token.ignoreCase ? 2 : 1));
    }
    case SelectorType.Pseudo: {
      return token.data ? token.name === "has" || token.name === "contains" || token.name === "icontains" ? 0 : Array.isArray(token.data) ? Math.max(0, Math.min(...token.data.map((d) => Math.min(...d.map(getQuality))))) : 2 : 3;
    }
    default: {
      return -1;
    }
  }
}
function includesScopePseudo(t) {
  return t.type === SelectorType.Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data) => data.some(includesScopePseudo)));
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/pseudo-selectors/subselects.js
var PLACEHOLDER_ELEMENT = {};
function hasDependsOnCurrentElement(selector) {
  return selector.some((sel) => sel.length > 0 && (isTraversal2(sel[0]) || sel.some(includesScopePseudo)));
}
var is = (next, token, options, context, compileToken) => {
  const compiledToken = compileToken(token, copyOptions(options), context);
  return compiledToken === trueFunc ? next : compiledToken === falseFunc ? falseFunc : (element) => compiledToken(element) && next(element);
};
var subselects = {
  is,
  matches: is,
  where: is,
  not(next, token, options, context, compileToken) {
    const compiledToken = compileToken(token, copyOptions(options), context);
    return compiledToken === falseFunc ? next : compiledToken === trueFunc ? falseFunc : (element) => !compiledToken(element) && next(element);
  },
  has(next, subselect, options, _context, compileToken) {
    const { adapter } = options;
    const copiedOptions = copyOptions(options);
    copiedOptions.relativeSelector = true;
    const context = subselect.some((s) => s.some(isTraversal2)) ? [PLACEHOLDER_ELEMENT] : undefined;
    const skipCache = hasDependsOnCurrentElement(subselect);
    const compiled = compileToken(subselect, copiedOptions, context);
    if (compiled === falseFunc) {
      return falseFunc;
    }
    if (context && compiled !== trueFunc) {
      return skipCache ? (element) => {
        if (!next(element)) {
          return false;
        }
        context[0] = element;
        const childs = adapter.getChildren(element);
        return findOne3(compiled, compiled.shouldTestNextSiblings ? [
          ...childs,
          ...getNextSiblings(element, adapter)
        ] : childs, options) !== null;
      } : cacheParentResults(next, options, (element) => {
        context[0] = element;
        return findOne3(compiled, adapter.getChildren(element), options) !== null;
      });
    }
    const hasOne = (element) => findOne3(compiled, adapter.getChildren(element), options) !== null;
    return skipCache ? (element) => next(element) && hasOne(element) : cacheParentResults(next, options, hasOne);
  }
};

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/pseudo-selectors/index.js
function compilePseudoSelector(next, selector, options, context, compileToken) {
  const { name, data } = selector;
  if (Array.isArray(data)) {
    if (!(name in subselects)) {
      throw new Error(`Unknown pseudo-class :${name}(${data})`);
    }
    return subselects[name](next, data, options, context, compileToken);
  }
  const userPseudo = options.pseudos?.[name];
  const stringPseudo = typeof userPseudo === "string" ? userPseudo : aliases[name];
  if (typeof stringPseudo === "string") {
    if (data != null) {
      throw new Error(`Pseudo ${name} doesn't have any arguments`);
    }
    const alias = parse3(stringPseudo);
    return subselects["is"](next, alias, options, context, compileToken);
  }
  if (typeof userPseudo === "function") {
    verifyPseudoArguments(userPseudo, name, data, 1);
    return (element) => userPseudo(element, data) && next(element);
  }
  if (name in filters) {
    return filters[name](next, data, options, context, compileToken);
  }
  if (name in pseudos) {
    const pseudo = pseudos[name];
    verifyPseudoArguments(pseudo, name, data, 2);
    return (element) => pseudo(element, options, data) && next(element);
  }
  throw new Error(`Unknown pseudo-class :${name}`);
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/general.js
function compileGeneralSelector(next, selector, options, context, compileToken, hasExpensiveSubselector) {
  const { adapter, equals, cacheResults } = options;
  switch (selector.type) {
    case SelectorType.PseudoElement: {
      throw new Error("Pseudo-elements are not supported by css-select");
    }
    case SelectorType.ColumnCombinator: {
      throw new Error("Column combinators are not yet supported by css-select");
    }
    case SelectorType.Attribute: {
      if (selector.namespace != null) {
        throw new Error("Namespaced attributes are not yet supported by css-select");
      }
      if (!options.xmlMode || options.lowerCaseAttributeNames) {
        selector.name = selector.name.toLowerCase();
      }
      return attributeRules[selector.action](next, selector, options);
    }
    case SelectorType.Pseudo: {
      return compilePseudoSelector(next, selector, options, context, compileToken);
    }
    case SelectorType.Tag: {
      if (selector.namespace != null) {
        throw new Error("Namespaced tag names are not yet supported by css-select");
      }
      let { name } = selector;
      if (!options.xmlMode || options.lowerCaseTags) {
        name = name.toLowerCase();
      }
      return function tag(element) {
        return adapter.getName(element) === name && next(element);
      };
    }
    case SelectorType.Descendant: {
      if (!hasExpensiveSubselector || cacheResults === false || typeof WeakMap === "undefined") {
        return function descendant(element) {
          let current = element;
          while (current = getElementParent(current, adapter)) {
            if (next(current)) {
              return true;
            }
          }
          return false;
        };
      }
      const resultCache = new WeakMap;
      return function cachedDescendant(element) {
        let current = element;
        let result;
        while (current = getElementParent(current, adapter)) {
          const cached = resultCache.get(current);
          if (cached === undefined) {
            result ??= { matches: false };
            result.matches = next(current);
            resultCache.set(current, result);
            if (result.matches) {
              return true;
            }
          } else {
            if (result) {
              result.matches = cached.matches;
            }
            return cached.matches;
          }
        }
        return false;
      };
    }
    case "_flexibleDescendant": {
      return function flexibleDescendant(element) {
        let current = element;
        do {
          if (next(current)) {
            return true;
          }
          current = getElementParent(current, adapter);
        } while (current);
        return false;
      };
    }
    case SelectorType.Parent: {
      return function parent(element) {
        return adapter.getChildren(element).some((element) => adapter.isTag(element) && next(element));
      };
    }
    case SelectorType.Child: {
      return function child(element) {
        const parent = getElementParent(element, adapter);
        return parent !== null && next(parent);
      };
    }
    case SelectorType.Sibling: {
      return function sibling(element) {
        const siblings = adapter.getSiblings(element);
        for (const currentSibling of siblings) {
          if (equals(element, currentSibling)) {
            break;
          }
          if (adapter.isTag(currentSibling) && next(currentSibling)) {
            return true;
          }
        }
        return false;
      };
    }
    case SelectorType.Adjacent: {
      if (adapter.prevElementSibling) {
        return function adjacent(element) {
          const previous = adapter.prevElementSibling(element);
          return previous != null && next(previous);
        };
      }
      return function adjacent(element) {
        const siblings = adapter.getSiblings(element);
        let lastElement;
        for (const currentSibling of siblings) {
          if (equals(element, currentSibling)) {
            break;
          }
          if (adapter.isTag(currentSibling)) {
            lastElement = currentSibling;
          }
        }
        return !!lastElement && next(lastElement);
      };
    }
    case SelectorType.Universal: {
      if (selector.namespace != null && selector.namespace !== "*") {
        throw new Error("Namespaced universal selectors are not yet supported by css-select");
      }
      return next;
    }
  }
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/compile.js
var DESCENDANT_TOKEN = { type: SelectorType.Descendant };
var FLEXIBLE_DESCENDANT_TOKEN = {
  type: "_flexibleDescendant"
};
var SCOPE_TOKEN = {
  type: SelectorType.Pseudo,
  name: "scope",
  data: null
};
function absolutize(token, { adapter }, context) {
  const hasContext = !!context?.every((element) => element === PLACEHOLDER_ELEMENT || adapter.isTag(element) && getElementParent(element, adapter) !== null);
  for (const t of token) {
    if (t.length > 0 && isTraversal2(t[0]) && t[0].type !== SelectorType.Descendant) {} else if (hasContext && !t.some(includesScopePseudo)) {
      t.unshift(DESCENDANT_TOKEN);
    } else {
      continue;
    }
    t.unshift(SCOPE_TOKEN);
  }
}
function compileToken(token, options, compilationContext) {
  for (const rules of token) {
    sortRules(rules);
  }
  const { context = compilationContext, rootFunc: rootFunction = trueFunc } = options;
  const isArrayContext = Array.isArray(context);
  const finalContext = context && (Array.isArray(context) ? context : [context]);
  if (options.relativeSelector !== false) {
    absolutize(token, options, finalContext);
  } else if (token.some((t) => t.length > 0 && isTraversal2(t[0]))) {
    throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
  }
  let shouldTestNextSiblings = false;
  let query = falseFunc;
  combineLoop:
    for (const rules of token) {
      if (rules.length >= 2) {
        const [first, second] = rules;
        if (first.type !== SelectorType.Pseudo || first.name !== "scope") {} else if (isArrayContext && second.type === SelectorType.Descendant) {
          rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
        } else if (second.type === SelectorType.Adjacent || second.type === SelectorType.Sibling) {
          shouldTestNextSiblings = true;
        }
      }
      let next = rootFunction;
      let hasExpensiveSubselector = false;
      for (const rule of rules) {
        next = compileGeneralSelector(next, rule, options, finalContext, compileToken, hasExpensiveSubselector);
        const quality = getQuality(rule);
        if (quality === 0) {
          hasExpensiveSubselector = true;
        }
        if (next === falseFunc) {
          continue combineLoop;
        }
      }
      if (next === rootFunction) {
        return rootFunction;
      }
      query = query === falseFunc ? next : or(query, next);
    }
  query.shouldTestNextSiblings = shouldTestNextSiblings;
  return query;
}
function or(a, b) {
  return (element) => a(element) || b(element);
}

// node_modules/.bun/css-select@7.0.0/node_modules/css-select/dist/index.js
var defaultEquals = (a, b) => a === b;
var defaultOptions = {
  adapter: { ...exports_dist2, isTag: isTag4 },
  equals: defaultEquals
};
function convertOptionFormats(options) {
  const finalOptions = options ?? defaultOptions;
  finalOptions.adapter ??= defaultOptions.adapter;
  finalOptions.equals ??= finalOptions.adapter?.equals ?? defaultEquals;
  return finalOptions;
}
function compile3(selector, options, context) {
  const convertedOptions = convertOptionFormats(options);
  const next = _compileUnsafe(selector, convertedOptions, context);
  return next === falseFunc ? falseFunc : (element) => convertedOptions.adapter.isTag(element) && next(element);
}
function _compileUnsafe(selector, options, context) {
  return compileToken(typeof selector === "string" ? parse3(selector) : selector, convertOptionFormats(options), context);
}
function getSelectorFunction(searchFunction) {
  return function select(query, elements, options) {
    const convertedOptions = convertOptionFormats(options);
    if (typeof query !== "function") {
      query = _compileUnsafe(query, convertedOptions, elements);
    }
    const filteredElements = prepareContext(elements, convertedOptions.adapter, query.shouldTestNextSiblings);
    return searchFunction(query, filteredElements, convertedOptions);
  };
}
function prepareContext(elements, adapter, shouldTestNextSiblings = false) {
  if (shouldTestNextSiblings) {
    elements = appendNextSiblings(elements, adapter);
  }
  return Array.isArray(elements) ? adapter.removeSubsets(elements) : adapter.getChildren(elements);
}
function appendNextSiblings(element, adapter) {
  const elements = Array.isArray(element) ? [...element] : [element];
  const elementsLength = elements.length;
  for (let index = 0;index < elementsLength; index++) {
    const nextSiblings = getNextSiblings(elements[index], adapter);
    elements.push(...nextSiblings);
  }
  return elements;
}
var selectAll = getSelectorFunction((query, elements, options) => query === falseFunc || !elements || elements.length === 0 ? [] : findAll3(query, elements, options));
var selectOne = getSelectorFunction((query, elements, options) => query === falseFunc || !elements || elements.length === 0 ? null : findOne3(query, elements, options));
function is2(element, query, options) {
  return (typeof query === "function" ? query : compile3(query, options))(element);
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/matches.js
var { isArray } = Array;
var isTag5 = ({ nodeType }) => nodeType === ELEMENT_NODE;
var existsOne3 = (test, elements) => elements.some((element) => isTag5(element) && (test(element) || existsOne3(test, getChildren3(element))));
var getAttributeValue3 = (element, name) => name === "class" ? element.classList.value : element.getAttribute(name);
var getChildren3 = ({ childNodes }) => childNodes;
var getName3 = (element) => {
  const { localName } = element;
  return ignoreCase(element) ? localName.toLowerCase() : localName;
};
var getParent3 = ({ parentNode }) => parentNode;
var getSiblings3 = (element) => {
  const { parentNode } = element;
  return parentNode ? getChildren3(parentNode) : element;
};
var getText3 = (node) => {
  if (isArray(node))
    return node.map(getText3).join("");
  if (isTag5(node))
    return getText3(getChildren3(node));
  if (node.nodeType === TEXT_NODE)
    return node.data;
  return "";
};
var hasAttrib3 = (element, name) => element.hasAttribute(name);
var removeSubsets3 = (nodes) => {
  let { length } = nodes;
  while (length--) {
    const node = nodes[length];
    if (length && -1 < nodes.lastIndexOf(node, length - 1)) {
      nodes.splice(length, 1);
      continue;
    }
    for (let { parentNode } = node;parentNode; parentNode = parentNode.parentNode) {
      if (nodes.includes(parentNode)) {
        nodes.splice(length, 1);
        break;
      }
    }
  }
  return nodes;
};
var findAll4 = (test, nodes) => {
  const matches = [];
  for (const node of nodes) {
    if (isTag5(node)) {
      if (test(node))
        matches.push(node);
      matches.push(...findAll4(test, getChildren3(node)));
    }
  }
  return matches;
};
var findOne4 = (test, nodes) => {
  for (let node of nodes)
    if (test(node) || (node = findOne4(test, getChildren3(node))))
      return node;
  return null;
};
var adapter = {
  isTag: isTag5,
  existsOne: existsOne3,
  getAttributeValue: getAttributeValue3,
  getChildren: getChildren3,
  getName: getName3,
  getParent: getParent3,
  getSiblings: getSiblings3,
  getText: getText3,
  hasAttrib: hasAttrib3,
  removeSubsets: removeSubsets3,
  findAll: findAll4,
  findOne: findOne4
};
var prepareMatch = (element, selectors) => compile3(selectors, {
  context: selectors.includes(":scope") ? element : undefined,
  xmlMode: !ignoreCase(element),
  adapter
});
var matches = (element, selectors) => is2(element, selectors, {
  strict: true,
  context: selectors.includes(":scope") ? element : undefined,
  xmlMode: !ignoreCase(element),
  adapter
});

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/text.js
class Text4 extends CharacterData {
  constructor(ownerDocument, data = "") {
    super(ownerDocument, "#text", TEXT_NODE, data);
  }
  get wholeText() {
    const text = [];
    let { previousSibling, nextSibling } = this;
    while (previousSibling) {
      if (previousSibling.nodeType === TEXT_NODE)
        text.unshift(previousSibling[VALUE]);
      else
        break;
      previousSibling = previousSibling.previousSibling;
    }
    text.push(this[VALUE]);
    while (nextSibling) {
      if (nextSibling.nodeType === TEXT_NODE)
        text.push(nextSibling[VALUE]);
      else
        break;
      nextSibling = nextSibling.nextSibling;
    }
    return text.join("");
  }
  cloneNode() {
    const { ownerDocument, [VALUE]: data } = this;
    return new Text4(ownerDocument, data);
  }
  toString() {
    return escape2(this[VALUE]);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/mixin/parent-node.js
var isNode = (node) => node instanceof Node2;
var insert = (parentNode, child, nodes) => {
  const { ownerDocument } = parentNode;
  for (const node of nodes)
    parentNode.insertBefore(isNode(node) ? node : new Text4(ownerDocument, node), child);
};

class ParentNode extends Node2 {
  constructor(ownerDocument, localName, nodeType) {
    super(ownerDocument, localName, nodeType);
    this[PRIVATE] = null;
    this[NEXT] = this[END] = {
      [NEXT]: null,
      [PREV]: this,
      [START]: this,
      nodeType: NODE_END,
      ownerDocument: this.ownerDocument,
      parentNode: null
    };
  }
  get childNodes() {
    const childNodes = new NodeList;
    let { firstChild } = this;
    while (firstChild) {
      childNodes.push(firstChild);
      firstChild = nextSibling(firstChild);
    }
    return childNodes;
  }
  get children() {
    const children = new NodeList;
    let { firstElementChild } = this;
    while (firstElementChild) {
      children.push(firstElementChild);
      firstElementChild = nextElementSibling2(firstElementChild);
    }
    return children;
  }
  get firstChild() {
    let { [NEXT]: next, [END]: end } = this;
    while (next.nodeType === ATTRIBUTE_NODE)
      next = next[NEXT];
    return next === end ? null : next;
  }
  get firstElementChild() {
    let { firstChild } = this;
    while (firstChild) {
      if (firstChild.nodeType === ELEMENT_NODE)
        return firstChild;
      firstChild = nextSibling(firstChild);
    }
    return null;
  }
  get lastChild() {
    const prev = this[END][PREV];
    switch (prev.nodeType) {
      case NODE_END:
        return prev[START];
      case ATTRIBUTE_NODE:
        return null;
    }
    return prev === this ? null : prev;
  }
  get lastElementChild() {
    let { lastChild } = this;
    while (lastChild) {
      if (lastChild.nodeType === ELEMENT_NODE)
        return lastChild;
      lastChild = previousSibling(lastChild);
    }
    return null;
  }
  get childElementCount() {
    return this.children.length;
  }
  prepend(...nodes) {
    insert(this, this.firstChild, nodes);
  }
  append(...nodes) {
    insert(this, this[END], nodes);
  }
  replaceChildren(...nodes) {
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end && next.nodeType === ATTRIBUTE_NODE)
      next = next[NEXT];
    while (next !== end) {
      const after = getEnd(next)[NEXT];
      next.remove();
      next = after;
    }
    if (nodes.length)
      insert(this, end, nodes);
  }
  getElementsByClassName(className) {
    const elements = new NodeList;
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE && next.hasAttribute("class") && next.classList.has(className))
        elements.push(next);
      next = next[NEXT];
    }
    return elements;
  }
  getElementsByTagName(tagName) {
    const elements = new NodeList;
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE && (next.localName === tagName || localCase(next) === tagName))
        elements.push(next);
      next = next[NEXT];
    }
    return elements;
  }
  querySelector(selectors) {
    const matches = prepareMatch(this, selectors);
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE && matches(next))
        return next;
      next = next.nodeType === ELEMENT_NODE && next.localName === "template" ? next[END] : next[NEXT];
    }
    return null;
  }
  querySelectorAll(selectors) {
    const matches = prepareMatch(this, selectors);
    const elements = new NodeList;
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE && matches(next))
        elements.push(next);
      next = next.nodeType === ELEMENT_NODE && next.localName === "template" ? next[END] : next[NEXT];
    }
    return elements;
  }
  appendChild(node) {
    return this.insertBefore(node, this[END]);
  }
  contains(node) {
    let parentNode = node;
    while (parentNode && parentNode !== this)
      parentNode = parentNode.parentNode;
    return parentNode === this;
  }
  insertBefore(node, before = null) {
    if (node === before)
      return node;
    if (node === this)
      throw new Error("unable to append a node to itself");
    const next = before || this[END];
    switch (node.nodeType) {
      case ELEMENT_NODE:
        node.remove();
        node.parentNode = this;
        knownBoundaries(next[PREV], node, next);
        moCallback(node, null);
        connectedCallback(node);
        break;
      case DOCUMENT_FRAGMENT_NODE: {
        let { [PRIVATE]: parentNode, firstChild, lastChild } = node;
        if (firstChild) {
          knownSegment(next[PREV], firstChild, lastChild, next);
          knownAdjacent(node, node[END]);
          if (parentNode)
            parentNode.replaceChildren();
          do {
            firstChild.parentNode = this;
            moCallback(firstChild, null);
            if (firstChild.nodeType === ELEMENT_NODE)
              connectedCallback(firstChild);
          } while (firstChild !== lastChild && (firstChild = nextSibling(firstChild)));
        }
        break;
      }
      case TEXT_NODE:
      case COMMENT_NODE:
      case CDATA_SECTION_NODE:
        node.remove();
      default:
        node.parentNode = this;
        knownSiblings(next[PREV], node, next);
        moCallback(node, null);
        break;
    }
    return node;
  }
  normalize() {
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      const { [NEXT]: $next, [PREV]: $prev, nodeType } = next;
      if (nodeType === TEXT_NODE) {
        if (!next[VALUE])
          next.remove();
        else if ($prev && $prev.nodeType === TEXT_NODE) {
          $prev.textContent += next.textContent;
          next.remove();
        }
      }
      next = $next;
    }
  }
  removeChild(node) {
    if (node.parentNode !== this)
      throw new Error("node is not a child");
    node.remove();
    return node;
  }
  replaceChild(node, replaced) {
    const next = getEnd(replaced)[NEXT];
    replaced.remove();
    this.insertBefore(node, next);
    return replaced;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/mixin/non-element-parent-node.js
class NonElementParentNode extends ParentNode {
  getElementById(id) {
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      if (next.nodeType === ELEMENT_NODE && next.id === id)
        return next;
      next = next[NEXT];
    }
    return null;
  }
  cloneNode(deep) {
    const { ownerDocument, constructor } = this;
    const nonEPN = new constructor(ownerDocument);
    if (deep) {
      const { [END]: end } = nonEPN;
      for (const node of this.childNodes)
        nonEPN.insertBefore(node.cloneNode(deep), end);
    }
    return nonEPN;
  }
  toString() {
    const { childNodes, localName } = this;
    return `<${localName}>${childNodes.join("")}</${localName}>`;
  }
  toJSON() {
    const json = [];
    nonElementAsJSON(this, json);
    return json;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/document-fragment.js
class DocumentFragment extends NonElementParentNode {
  constructor(ownerDocument) {
    super(ownerDocument, "#document-fragment", DOCUMENT_FRAGMENT_NODE);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/document-type.js
class DocumentType extends Node2 {
  constructor(ownerDocument, name, publicId = "", systemId = "") {
    super(ownerDocument, "#document-type", DOCUMENT_TYPE_NODE);
    this.name = name;
    this.publicId = publicId;
    this.systemId = systemId;
  }
  cloneNode() {
    const { ownerDocument, name, publicId, systemId } = this;
    return new DocumentType(ownerDocument, name, publicId, systemId);
  }
  toString() {
    const { name, publicId, systemId } = this;
    const hasPublic = 0 < publicId.length;
    const str = [name];
    if (hasPublic)
      str.push("PUBLIC", `"${publicId}"`);
    if (systemId.length) {
      if (!hasPublic)
        str.push("SYSTEM");
      str.push(`"${systemId}"`);
    }
    return `<!DOCTYPE ${str.join(" ")}>`;
  }
  toJSON() {
    const json = [];
    documentTypeAsJSON(this, json);
    return json;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/mixin/inner-html.js
var getInnerHtml = (node) => node.childNodes.join("");
var setInnerHtml = (node, html) => {
  const { ownerDocument } = node;
  const { constructor } = ownerDocument;
  const document = new constructor;
  document[CUSTOM_ELEMENTS] = ownerDocument[CUSTOM_ELEMENTS];
  const { childNodes } = parseFromString(document, ignoreCase(node), html);
  node.replaceChildren(...childNodes.map(setOwnerDocument, ownerDocument));
};
function setOwnerDocument(node) {
  node.ownerDocument = this;
  switch (node.nodeType) {
    case ELEMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE:
      node.childNodes.forEach(setOwnerDocument, this);
      break;
  }
  return node;
}

// node_modules/.bun/uhyphen@0.2.0/node_modules/uhyphen/esm/index.js
var esm_default2 = (camel) => camel.replace(/(([A-Z0-9])([A-Z0-9][a-z]))|(([a-z0-9]+)([A-Z]))/g, "$2$5-$3$6").toLowerCase();

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/dom/string-map.js
var refs = new WeakMap;
var key = (name) => `data-${esm_default2(name)}`;
var prop = (name) => name.slice(5).replace(/-([a-z])/g, (_, $1) => $1.toUpperCase());
var handler = {
  get(dataset, name) {
    if (name in dataset)
      return refs.get(dataset).getAttribute(key(name));
  },
  set(dataset, name, value) {
    dataset[name] = value;
    refs.get(dataset).setAttribute(key(name), value);
    return true;
  },
  deleteProperty(dataset, name) {
    if (name in dataset)
      refs.get(dataset).removeAttribute(key(name));
    return delete dataset[name];
  }
};

class DOMStringMap {
  constructor(ref) {
    for (const { name, value } of ref.attributes) {
      if (/^data-/.test(name))
        this[prop(name)] = value;
    }
    refs.set(this, ref);
    return new Proxy(this, handler);
  }
}
setPrototypeOf(DOMStringMap.prototype, null);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/dom/token-list.js
var { add } = Set.prototype;
var addTokens = (self, tokens) => {
  for (const token of tokens) {
    if (token)
      add.call(self, token);
  }
};
var update = ({ [OWNER_ELEMENT]: ownerElement, value }) => {
  const attribute = ownerElement.getAttributeNode("class");
  if (attribute)
    attribute.value = value;
  else
    setAttribute(ownerElement, new Attr(ownerElement.ownerDocument, "class", value));
};

class DOMTokenList extends Set {
  constructor(ownerElement) {
    super();
    this[OWNER_ELEMENT] = ownerElement;
    const attribute = ownerElement.getAttributeNode("class");
    if (attribute)
      addTokens(this, attribute.value.split(/\s+/));
  }
  get length() {
    return this.size;
  }
  get value() {
    return [...this].join(" ");
  }
  add(...tokens) {
    addTokens(this, tokens);
    update(this);
  }
  contains(token) {
    return this.has(token);
  }
  remove(...tokens) {
    for (const token of tokens)
      this.delete(token);
    update(this);
  }
  toggle(token, force) {
    if (this.has(token)) {
      if (force)
        return true;
      this.delete(token);
      update(this);
    } else if (force || arguments.length === 1) {
      super.add(token);
      update(this);
      return true;
    }
    return false;
  }
  replace(token, newToken) {
    if (this.has(token)) {
      this.delete(token);
      super.add(newToken);
      update(this);
      return true;
    }
    return false;
  }
  supports() {
    return true;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/css-style-declaration.js
var refs2 = new WeakMap;
var getKeys = (style) => [...style.keys()].filter((key) => key !== PRIVATE);
var updateKeys = (style) => {
  const attr = refs2.get(style).getAttributeNode("style");
  if (!attr || attr[CHANGED] || style.get(PRIVATE) !== attr) {
    style.clear();
    if (attr) {
      style.set(PRIVATE, attr);
      for (const rule of attr[VALUE].split(/\s*;\s*/)) {
        let [key, ...rest] = rule.split(":");
        if (rest.length > 0) {
          key = key.trim();
          const value = rest.join(":").trim();
          if (key && value)
            style.set(key, value);
        }
      }
    }
  }
  return attr;
};
var handler2 = {
  get(style, name) {
    if (name in prototype)
      return style[name];
    updateKeys(style);
    if (name === "length")
      return getKeys(style).length;
    if (/^\d+$/.test(name))
      return getKeys(style)[name];
    return style.get(esm_default2(name)) ?? "";
  },
  set(style, name, value) {
    if (name === "cssText")
      style[name] = value;
    else {
      let attr = updateKeys(style);
      if (value == null)
        style.delete(esm_default2(name));
      else
        style.set(esm_default2(name), value);
      if (!attr) {
        const element = refs2.get(style);
        attr = element.ownerDocument.createAttribute("style");
        element.setAttributeNode(attr);
        style.set(PRIVATE, attr);
      }
      attr[CHANGED] = false;
      attr[VALUE] = style.toString();
    }
    return true;
  }
};

class CSSStyleDeclaration extends Map {
  constructor(element) {
    super();
    refs2.set(this, element);
    return new Proxy(this, handler2);
  }
  get cssText() {
    return this.toString();
  }
  set cssText(value) {
    refs2.get(this).setAttribute("style", value);
  }
  getPropertyValue(name) {
    const self = this[PRIVATE];
    return handler2.get(self, name);
  }
  setProperty(name, value) {
    const self = this[PRIVATE];
    handler2.set(self, name, value);
  }
  removeProperty(name) {
    const self = this[PRIVATE];
    handler2.set(self, name, null);
  }
  [Symbol.iterator]() {
    const self = this[PRIVATE];
    updateKeys(self);
    const keys = getKeys(self);
    const { length } = keys;
    let i = 0;
    return {
      next() {
        const done = i === length;
        return { done, value: done ? null : keys[i++] };
      }
    };
  }
  get [PRIVATE]() {
    return this;
  }
  toString() {
    const self = this[PRIVATE];
    updateKeys(self);
    const cssText = [];
    self.forEach(push, cssText);
    return cssText.join(";");
  }
}
var { prototype } = CSSStyleDeclaration;
function push(value, key) {
  if (key !== PRIVATE)
    this.push(`${key}:${value}`);
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/event.js
var BUBBLING_PHASE = 3;
var AT_TARGET = 2;
var CAPTURING_PHASE = 1;
var NONE2 = 0;
function getCurrentTarget(ev) {
  return ev.currentTarget;
}

class GlobalEvent {
  static get BUBBLING_PHASE() {
    return BUBBLING_PHASE;
  }
  static get AT_TARGET() {
    return AT_TARGET;
  }
  static get CAPTURING_PHASE() {
    return CAPTURING_PHASE;
  }
  static get NONE() {
    return NONE2;
  }
  constructor(type, eventInitDict = {}) {
    this.type = type;
    this.bubbles = !!eventInitDict.bubbles;
    this.cancelBubble = false;
    this._stopImmediatePropagationFlag = false;
    this.cancelable = !!eventInitDict.cancelable;
    this.eventPhase = this.NONE;
    this.timeStamp = Date.now();
    this.defaultPrevented = false;
    this.originalTarget = null;
    this.returnValue = null;
    this.srcElement = null;
    this.target = null;
    this._path = [];
  }
  get BUBBLING_PHASE() {
    return BUBBLING_PHASE;
  }
  get AT_TARGET() {
    return AT_TARGET;
  }
  get CAPTURING_PHASE() {
    return CAPTURING_PHASE;
  }
  get NONE() {
    return NONE2;
  }
  preventDefault() {
    this.defaultPrevented = true;
  }
  composedPath() {
    return this._path.map(getCurrentTarget);
  }
  stopPropagation() {
    this.cancelBubble = true;
  }
  stopImmediatePropagation() {
    this.stopPropagation();
    this._stopImmediatePropagationFlag = true;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/named-node-map.js
class NamedNodeMap extends Array {
  constructor(ownerElement) {
    super();
    this.ownerElement = ownerElement;
  }
  getNamedItem(name) {
    return this.ownerElement.getAttributeNode(name);
  }
  setNamedItem(attr) {
    this.ownerElement.setAttributeNode(attr);
    this.unshift(attr);
  }
  removeNamedItem(name) {
    const item = this.getNamedItem(name);
    this.ownerElement.removeAttribute(name);
    this.splice(this.indexOf(item), 1);
  }
  item(index) {
    return index < this.length ? this[index] : null;
  }
  getNamedItemNS(_, name) {
    return this.getNamedItem(name);
  }
  setNamedItemNS(_, attr) {
    return this.setNamedItem(attr);
  }
  removeNamedItemNS(_, name) {
    return this.removeNamedItem(name);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/shadow-root.js
class ShadowRoot extends NonElementParentNode {
  constructor(host) {
    super(host.ownerDocument, "#shadow-root", DOCUMENT_FRAGMENT_NODE);
    this.host = host;
  }
  get innerHTML() {
    return getInnerHtml(this);
  }
  set innerHTML(html) {
    setInnerHtml(this, html);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/element.js
var attributesHandler = {
  get(target, key) {
    return key in target ? target[key] : target.find(({ name }) => name === key);
  }
};
var create2 = (ownerDocument, element, localName) => {
  if ("ownerSVGElement" in element) {
    const svg = ownerDocument.createElementNS(SVG_NAMESPACE, localName);
    svg.ownerSVGElement = element.ownerSVGElement;
    return svg;
  }
  return ownerDocument.createElement(localName);
};
var isVoid = ({ localName, ownerDocument }) => {
  return ownerDocument[MIME].voidElements.test(localName);
};

class Element2 extends ParentNode {
  constructor(ownerDocument, localName) {
    super(ownerDocument, localName, ELEMENT_NODE);
    this[CLASS_LIST] = null;
    this[DATASET] = null;
    this[STYLE] = null;
  }
  get isConnected() {
    return isConnected(this);
  }
  get parentElement() {
    return parentElement(this);
  }
  get previousSibling() {
    return previousSibling(this);
  }
  get nextSibling() {
    return nextSibling(this);
  }
  get namespaceURI() {
    return "http://www.w3.org/1999/xhtml";
  }
  get previousElementSibling() {
    return previousElementSibling(this);
  }
  get nextElementSibling() {
    return nextElementSibling2(this);
  }
  before(...nodes) {
    before(this, nodes);
  }
  after(...nodes) {
    after(this, nodes);
  }
  replaceWith(...nodes) {
    replaceWith(this, nodes);
  }
  remove() {
    remove(this[PREV], this, this[END][NEXT]);
  }
  get id() {
    return stringAttribute.get(this, "id");
  }
  set id(value) {
    stringAttribute.set(this, "id", value);
  }
  get className() {
    return this.classList.value;
  }
  set className(value) {
    const { classList } = this;
    classList.clear();
    classList.add(...$String(value).split(/\s+/));
  }
  get nodeName() {
    return localCase(this);
  }
  get tagName() {
    return localCase(this);
  }
  get classList() {
    return this[CLASS_LIST] || (this[CLASS_LIST] = new DOMTokenList(this));
  }
  get dataset() {
    return this[DATASET] || (this[DATASET] = new DOMStringMap(this));
  }
  getBoundingClientRect() {
    return {
      x: 0,
      y: 0,
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0
    };
  }
  get nonce() {
    return stringAttribute.get(this, "nonce");
  }
  set nonce(value) {
    stringAttribute.set(this, "nonce", value);
  }
  get style() {
    return this[STYLE] || (this[STYLE] = new CSSStyleDeclaration(this));
  }
  get tabIndex() {
    return numericAttribute.get(this, "tabindex") || -1;
  }
  set tabIndex(value) {
    numericAttribute.set(this, "tabindex", value);
  }
  get slot() {
    return stringAttribute.get(this, "slot");
  }
  set slot(value) {
    stringAttribute.set(this, "slot", value);
  }
  get innerText() {
    const text = [];
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      if (next.nodeType === TEXT_NODE) {
        text.push(next.textContent.replace(/\s+/g, " "));
      } else if (text.length && next[NEXT] != end && BLOCK_ELEMENTS.has(next.tagName)) {
        text.push(`
`);
      }
      next = next[NEXT];
    }
    return text.join("");
  }
  get textContent() {
    const text = [];
    let { [NEXT]: next, [END]: end } = this;
    while (next !== end) {
      const nodeType = next.nodeType;
      if (nodeType === TEXT_NODE || nodeType === CDATA_SECTION_NODE)
        text.push(next.textContent);
      next = next[NEXT];
    }
    return text.join("");
  }
  set textContent(text) {
    this.replaceChildren();
    if (text != null && text !== "")
      this.appendChild(new Text4(this.ownerDocument, text));
  }
  get innerHTML() {
    return getInnerHtml(this);
  }
  set innerHTML(html) {
    setInnerHtml(this, html);
  }
  get outerHTML() {
    return this.toString();
  }
  set outerHTML(html) {
    const template = this.ownerDocument.createElement("");
    template.innerHTML = html;
    this.replaceWith(...template.childNodes);
  }
  get attributes() {
    const attributes = new NamedNodeMap(this);
    let next = this[NEXT];
    while (next.nodeType === ATTRIBUTE_NODE) {
      attributes.push(next);
      next = next[NEXT];
    }
    return new Proxy(attributes, attributesHandler);
  }
  focus() {
    this.dispatchEvent(new GlobalEvent("focus"));
  }
  getAttribute(name) {
    if (name === "class")
      return this.className;
    const attribute = this.getAttributeNode(name);
    return attribute && (ignoreCase(this) ? attribute.value : escape2(attribute.value));
  }
  getAttributeNode(name) {
    let next = this[NEXT];
    while (next.nodeType === ATTRIBUTE_NODE) {
      if (next.name === name)
        return next;
      next = next[NEXT];
    }
    return null;
  }
  getAttributeNames() {
    const attributes = new NodeList;
    let next = this[NEXT];
    while (next.nodeType === ATTRIBUTE_NODE) {
      attributes.push(next.name);
      next = next[NEXT];
    }
    return attributes;
  }
  hasAttribute(name) {
    return !!this.getAttributeNode(name);
  }
  hasAttributes() {
    return this[NEXT].nodeType === ATTRIBUTE_NODE;
  }
  removeAttribute(name) {
    if (name === "class" && this[CLASS_LIST])
      this[CLASS_LIST].clear();
    let next = this[NEXT];
    while (next.nodeType === ATTRIBUTE_NODE) {
      if (next.name === name) {
        removeAttribute(this, next);
        return;
      }
      next = next[NEXT];
    }
  }
  removeAttributeNode(attribute) {
    let next = this[NEXT];
    while (next.nodeType === ATTRIBUTE_NODE) {
      if (next === attribute) {
        removeAttribute(this, next);
        return;
      }
      next = next[NEXT];
    }
  }
  setAttribute(name, value) {
    if (name === "class")
      this.className = value;
    else {
      const attribute = this.getAttributeNode(name);
      if (attribute)
        attribute.value = value;
      else
        setAttribute(this, new Attr(this.ownerDocument, name, value));
    }
  }
  setAttributeNode(attribute) {
    const { name } = attribute;
    const previously = this.getAttributeNode(name);
    if (previously !== attribute) {
      if (previously)
        this.removeAttributeNode(previously);
      const { ownerElement } = attribute;
      if (ownerElement)
        ownerElement.removeAttributeNode(attribute);
      setAttribute(this, attribute);
    }
    return previously;
  }
  toggleAttribute(name, force) {
    if (this.hasAttribute(name)) {
      if (!force) {
        this.removeAttribute(name);
        return false;
      }
      return true;
    } else if (force || arguments.length === 1) {
      this.setAttribute(name, "");
      return true;
    }
    return false;
  }
  get shadowRoot() {
    if (shadowRoots.has(this)) {
      const { mode, shadowRoot } = shadowRoots.get(this);
      if (mode === "open")
        return shadowRoot;
    }
    return null;
  }
  attachShadow(init) {
    if (shadowRoots.has(this))
      throw new Error("operation not supported");
    const shadowRoot = new ShadowRoot(this);
    shadowRoots.set(this, {
      mode: init.mode,
      shadowRoot
    });
    return shadowRoot;
  }
  matches(selectors) {
    return matches(this, selectors);
  }
  closest(selectors) {
    let parentElement = this;
    const matches = prepareMatch(parentElement, selectors);
    while (parentElement && !matches(parentElement))
      parentElement = parentElement.parentElement;
    return parentElement;
  }
  insertAdjacentElement(position, element) {
    const { parentElement } = this;
    switch (position) {
      case "beforebegin":
        if (parentElement) {
          parentElement.insertBefore(element, this);
          break;
        }
        return null;
      case "afterbegin":
        this.insertBefore(element, this.firstChild);
        break;
      case "beforeend":
        this.insertBefore(element, null);
        break;
      case "afterend":
        if (parentElement) {
          parentElement.insertBefore(element, this.nextSibling);
          break;
        }
        return null;
    }
    return element;
  }
  insertAdjacentHTML(position, html) {
    this.insertAdjacentElement(position, htmlToFragment(this.ownerDocument, html));
  }
  insertAdjacentText(position, text) {
    const node = this.ownerDocument.createTextNode(text);
    this.insertAdjacentElement(position, node);
  }
  cloneNode(deep = false) {
    const { ownerDocument, localName } = this;
    const addNext = (next) => {
      next.parentNode = parentNode;
      knownAdjacent($next, next);
      $next = next;
    };
    const clone = create2(ownerDocument, this, localName);
    let parentNode = clone, $next = clone;
    let { [NEXT]: next, [END]: prev } = this;
    while (next !== prev && (deep || next.nodeType === ATTRIBUTE_NODE)) {
      switch (next.nodeType) {
        case NODE_END:
          knownAdjacent($next, parentNode[END]);
          $next = parentNode[END];
          parentNode = parentNode.parentNode;
          break;
        case ELEMENT_NODE: {
          const node = create2(ownerDocument, next, next.localName);
          addNext(node);
          parentNode = node;
          break;
        }
        case ATTRIBUTE_NODE: {
          const attr = next.cloneNode(deep);
          attr.ownerElement = parentNode;
          addNext(attr);
          break;
        }
        case TEXT_NODE:
        case COMMENT_NODE:
        case CDATA_SECTION_NODE:
          addNext(next.cloneNode(deep));
          break;
      }
      next = next[NEXT];
    }
    knownAdjacent($next, clone[END]);
    return clone;
  }
  toString() {
    const out = [];
    const { [END]: end } = this;
    let next = { [NEXT]: this };
    let isOpened = false;
    do {
      next = next[NEXT];
      switch (next.nodeType) {
        case ATTRIBUTE_NODE: {
          const attr = " " + next;
          switch (attr) {
            case " id":
            case " class":
            case " style":
              break;
            default:
              out.push(attr);
          }
          break;
        }
        case NODE_END: {
          const start = next[START];
          if (isOpened) {
            if ("ownerSVGElement" in start)
              out.push(" />");
            else if (isVoid(start))
              out.push(ignoreCase(start) ? ">" : " />");
            else
              out.push(`></${start.localName}>`);
            isOpened = false;
          } else
            out.push(`</${start.localName}>`);
          break;
        }
        case ELEMENT_NODE:
          if (isOpened)
            out.push(">");
          if (next.toString !== this.toString) {
            out.push(next.toString());
            next = next[END];
            isOpened = false;
          } else {
            out.push(`<${next.localName}`);
            isOpened = true;
          }
          break;
        case TEXT_NODE:
        case COMMENT_NODE:
        case CDATA_SECTION_NODE:
          out.push((isOpened ? ">" : "") + next);
          isOpened = false;
          break;
      }
    } while (next !== end);
    return out.join("");
  }
  toJSON() {
    const json = [];
    elementAsJSON(this, json);
    return json;
  }
  getAttributeNS(_, name) {
    return this.getAttribute(name);
  }
  getElementsByTagNameNS(_, name) {
    return this.getElementsByTagName(name);
  }
  hasAttributeNS(_, name) {
    return this.hasAttribute(name);
  }
  removeAttributeNS(_, name) {
    this.removeAttribute(name);
  }
  setAttributeNS(_, name, value) {
    this.setAttribute(name, value);
  }
  setAttributeNodeNS(attr) {
    return this.setAttributeNode(attr);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/svg/element.js
var classNames = new WeakMap;
var handler3 = {
  get(target, name) {
    return target[name];
  },
  set(target, name, value) {
    target[name] = value;
    return true;
  }
};

class SVGElement extends Element2 {
  constructor(ownerDocument, localName, ownerSVGElement = null) {
    super(ownerDocument, localName);
    this.ownerSVGElement = ownerSVGElement;
  }
  get className() {
    if (!classNames.has(this))
      classNames.set(this, new Proxy({ baseVal: "", animVal: "" }, handler3));
    return classNames.get(this);
  }
  set className(value) {
    const { classList } = this;
    classList.clear();
    classList.add(...$String(value).split(/\s+/));
  }
  get namespaceURI() {
    return "http://www.w3.org/2000/svg";
  }
  getAttribute(name) {
    return name === "class" ? [...this.classList].join(" ") : super.getAttribute(name);
  }
  setAttribute(name, value) {
    if (name === "class")
      this.className = value;
    else if (name === "style") {
      const { className } = this;
      className.baseVal = className.animVal = value;
    }
    super.setAttribute(name, value);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/facades.js
var illegalConstructor = () => {
  throw new TypeError("Illegal constructor");
};
function Attr2() {
  illegalConstructor();
}
setPrototypeOf(Attr2, Attr);
Attr2.prototype = Attr.prototype;
function CDATASection2() {
  illegalConstructor();
}
setPrototypeOf(CDATASection2, CDATASection);
CDATASection2.prototype = CDATASection.prototype;
function CharacterData2() {
  illegalConstructor();
}
setPrototypeOf(CharacterData2, CharacterData);
CharacterData2.prototype = CharacterData.prototype;
function Comment5() {
  illegalConstructor();
}
setPrototypeOf(Comment5, Comment3);
Comment5.prototype = Comment3.prototype;
function DocumentFragment2() {
  illegalConstructor();
}
setPrototypeOf(DocumentFragment2, DocumentFragment);
DocumentFragment2.prototype = DocumentFragment.prototype;
function DocumentType2() {
  illegalConstructor();
}
setPrototypeOf(DocumentType2, DocumentType);
DocumentType2.prototype = DocumentType.prototype;
function Element3() {
  illegalConstructor();
}
setPrototypeOf(Element3, Element2);
Element3.prototype = Element2.prototype;
function Node3() {
  illegalConstructor();
}
setPrototypeOf(Node3, Node2);
Node3.prototype = Node2.prototype;
function ShadowRoot2() {
  illegalConstructor();
}
setPrototypeOf(ShadowRoot2, ShadowRoot);
ShadowRoot2.prototype = ShadowRoot.prototype;
function Text5() {
  illegalConstructor();
}
setPrototypeOf(Text5, Text4);
Text5.prototype = Text4.prototype;
function SVGElement2() {
  illegalConstructor();
}
setPrototypeOf(SVGElement2, SVGElement);
SVGElement2.prototype = SVGElement.prototype;
var Facades = {
  Attr: Attr2,
  CDATASection: CDATASection2,
  CharacterData: CharacterData2,
  Comment: Comment5,
  DocumentFragment: DocumentFragment2,
  DocumentType: DocumentType2,
  Element: Element3,
  Node: Node3,
  ShadowRoot: ShadowRoot2,
  Text: Text5,
  SVGElement: SVGElement2
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/element.js
var Level0 = new WeakMap;
var level0 = {
  get(element, name) {
    return Level0.has(element) && Level0.get(element)[name] || null;
  },
  set(element, name, value) {
    if (!Level0.has(element))
      Level0.set(element, {});
    const handlers = Level0.get(element);
    const type = name.slice(2);
    if (handlers[name])
      element.removeEventListener(type, handlers[name], false);
    if (handlers[name] = value)
      element.addEventListener(type, value, false);
  }
};

class HTMLElement extends Element2 {
  static get observedAttributes() {
    return [];
  }
  constructor(ownerDocument = null, localName = "") {
    super(ownerDocument, localName);
    const ownerLess = !ownerDocument;
    let options;
    if (ownerLess) {
      const { constructor: Class } = this;
      if (!Classes.has(Class))
        throw new Error("unable to initialize this Custom Element");
      ({ ownerDocument, localName, options } = Classes.get(Class));
    }
    if (ownerDocument[UPGRADE]) {
      const { element, values } = ownerDocument[UPGRADE];
      ownerDocument[UPGRADE] = null;
      for (const [key, value] of values)
        element[key] = value;
      return element;
    }
    if (ownerLess) {
      this.ownerDocument = this[END].ownerDocument = ownerDocument;
      this.localName = localName;
      customElements.set(this, { connected: false });
      if (options.is)
        this.setAttribute("is", options.is);
    }
  }
  blur() {
    this.dispatchEvent(new GlobalEvent("blur"));
  }
  click() {
    const clickEvent = new GlobalEvent("click", { bubbles: true, cancelable: true });
    clickEvent.button = 0;
    this.dispatchEvent(clickEvent);
  }
  get accessKeyLabel() {
    const { accessKey } = this;
    return accessKey && `Alt+Shift+${accessKey}`;
  }
  get isContentEditable() {
    return this.hasAttribute("contenteditable");
  }
  get contentEditable() {
    return booleanAttribute.get(this, "contenteditable");
  }
  set contentEditable(value) {
    booleanAttribute.set(this, "contenteditable", value);
  }
  get draggable() {
    return booleanAttribute.get(this, "draggable");
  }
  set draggable(value) {
    booleanAttribute.set(this, "draggable", value);
  }
  get hidden() {
    return booleanAttribute.get(this, "hidden");
  }
  set hidden(value) {
    booleanAttribute.set(this, "hidden", value);
  }
  get spellcheck() {
    return booleanAttribute.get(this, "spellcheck");
  }
  set spellcheck(value) {
    booleanAttribute.set(this, "spellcheck", value);
  }
  get accessKey() {
    return stringAttribute.get(this, "accesskey");
  }
  set accessKey(value) {
    stringAttribute.set(this, "accesskey", value);
  }
  get dir() {
    return stringAttribute.get(this, "dir");
  }
  set dir(value) {
    stringAttribute.set(this, "dir", value);
  }
  get lang() {
    return stringAttribute.get(this, "lang");
  }
  set lang(value) {
    stringAttribute.set(this, "lang", value);
  }
  get title() {
    return stringAttribute.get(this, "title");
  }
  set title(value) {
    stringAttribute.set(this, "title", value);
  }
  get onabort() {
    return level0.get(this, "onabort");
  }
  set onabort(value) {
    level0.set(this, "onabort", value);
  }
  get onblur() {
    return level0.get(this, "onblur");
  }
  set onblur(value) {
    level0.set(this, "onblur", value);
  }
  get oncancel() {
    return level0.get(this, "oncancel");
  }
  set oncancel(value) {
    level0.set(this, "oncancel", value);
  }
  get oncanplay() {
    return level0.get(this, "oncanplay");
  }
  set oncanplay(value) {
    level0.set(this, "oncanplay", value);
  }
  get oncanplaythrough() {
    return level0.get(this, "oncanplaythrough");
  }
  set oncanplaythrough(value) {
    level0.set(this, "oncanplaythrough", value);
  }
  get onchange() {
    return level0.get(this, "onchange");
  }
  set onchange(value) {
    level0.set(this, "onchange", value);
  }
  get onclick() {
    return level0.get(this, "onclick");
  }
  set onclick(value) {
    level0.set(this, "onclick", value);
  }
  get onclose() {
    return level0.get(this, "onclose");
  }
  set onclose(value) {
    level0.set(this, "onclose", value);
  }
  get oncontextmenu() {
    return level0.get(this, "oncontextmenu");
  }
  set oncontextmenu(value) {
    level0.set(this, "oncontextmenu", value);
  }
  get oncuechange() {
    return level0.get(this, "oncuechange");
  }
  set oncuechange(value) {
    level0.set(this, "oncuechange", value);
  }
  get ondblclick() {
    return level0.get(this, "ondblclick");
  }
  set ondblclick(value) {
    level0.set(this, "ondblclick", value);
  }
  get ondrag() {
    return level0.get(this, "ondrag");
  }
  set ondrag(value) {
    level0.set(this, "ondrag", value);
  }
  get ondragend() {
    return level0.get(this, "ondragend");
  }
  set ondragend(value) {
    level0.set(this, "ondragend", value);
  }
  get ondragenter() {
    return level0.get(this, "ondragenter");
  }
  set ondragenter(value) {
    level0.set(this, "ondragenter", value);
  }
  get ondragleave() {
    return level0.get(this, "ondragleave");
  }
  set ondragleave(value) {
    level0.set(this, "ondragleave", value);
  }
  get ondragover() {
    return level0.get(this, "ondragover");
  }
  set ondragover(value) {
    level0.set(this, "ondragover", value);
  }
  get ondragstart() {
    return level0.get(this, "ondragstart");
  }
  set ondragstart(value) {
    level0.set(this, "ondragstart", value);
  }
  get ondrop() {
    return level0.get(this, "ondrop");
  }
  set ondrop(value) {
    level0.set(this, "ondrop", value);
  }
  get ondurationchange() {
    return level0.get(this, "ondurationchange");
  }
  set ondurationchange(value) {
    level0.set(this, "ondurationchange", value);
  }
  get onemptied() {
    return level0.get(this, "onemptied");
  }
  set onemptied(value) {
    level0.set(this, "onemptied", value);
  }
  get onended() {
    return level0.get(this, "onended");
  }
  set onended(value) {
    level0.set(this, "onended", value);
  }
  get onerror() {
    return level0.get(this, "onerror");
  }
  set onerror(value) {
    level0.set(this, "onerror", value);
  }
  get onfocus() {
    return level0.get(this, "onfocus");
  }
  set onfocus(value) {
    level0.set(this, "onfocus", value);
  }
  get oninput() {
    return level0.get(this, "oninput");
  }
  set oninput(value) {
    level0.set(this, "oninput", value);
  }
  get oninvalid() {
    return level0.get(this, "oninvalid");
  }
  set oninvalid(value) {
    level0.set(this, "oninvalid", value);
  }
  get onkeydown() {
    return level0.get(this, "onkeydown");
  }
  set onkeydown(value) {
    level0.set(this, "onkeydown", value);
  }
  get onkeypress() {
    return level0.get(this, "onkeypress");
  }
  set onkeypress(value) {
    level0.set(this, "onkeypress", value);
  }
  get onkeyup() {
    return level0.get(this, "onkeyup");
  }
  set onkeyup(value) {
    level0.set(this, "onkeyup", value);
  }
  get onload() {
    return level0.get(this, "onload");
  }
  set onload(value) {
    level0.set(this, "onload", value);
  }
  get onloadeddata() {
    return level0.get(this, "onloadeddata");
  }
  set onloadeddata(value) {
    level0.set(this, "onloadeddata", value);
  }
  get onloadedmetadata() {
    return level0.get(this, "onloadedmetadata");
  }
  set onloadedmetadata(value) {
    level0.set(this, "onloadedmetadata", value);
  }
  get onloadstart() {
    return level0.get(this, "onloadstart");
  }
  set onloadstart(value) {
    level0.set(this, "onloadstart", value);
  }
  get onmousedown() {
    return level0.get(this, "onmousedown");
  }
  set onmousedown(value) {
    level0.set(this, "onmousedown", value);
  }
  get onmouseenter() {
    return level0.get(this, "onmouseenter");
  }
  set onmouseenter(value) {
    level0.set(this, "onmouseenter", value);
  }
  get onmouseleave() {
    return level0.get(this, "onmouseleave");
  }
  set onmouseleave(value) {
    level0.set(this, "onmouseleave", value);
  }
  get onmousemove() {
    return level0.get(this, "onmousemove");
  }
  set onmousemove(value) {
    level0.set(this, "onmousemove", value);
  }
  get onmouseout() {
    return level0.get(this, "onmouseout");
  }
  set onmouseout(value) {
    level0.set(this, "onmouseout", value);
  }
  get onmouseover() {
    return level0.get(this, "onmouseover");
  }
  set onmouseover(value) {
    level0.set(this, "onmouseover", value);
  }
  get onmouseup() {
    return level0.get(this, "onmouseup");
  }
  set onmouseup(value) {
    level0.set(this, "onmouseup", value);
  }
  get onmousewheel() {
    return level0.get(this, "onmousewheel");
  }
  set onmousewheel(value) {
    level0.set(this, "onmousewheel", value);
  }
  get onpause() {
    return level0.get(this, "onpause");
  }
  set onpause(value) {
    level0.set(this, "onpause", value);
  }
  get onplay() {
    return level0.get(this, "onplay");
  }
  set onplay(value) {
    level0.set(this, "onplay", value);
  }
  get onplaying() {
    return level0.get(this, "onplaying");
  }
  set onplaying(value) {
    level0.set(this, "onplaying", value);
  }
  get onprogress() {
    return level0.get(this, "onprogress");
  }
  set onprogress(value) {
    level0.set(this, "onprogress", value);
  }
  get onratechange() {
    return level0.get(this, "onratechange");
  }
  set onratechange(value) {
    level0.set(this, "onratechange", value);
  }
  get onreset() {
    return level0.get(this, "onreset");
  }
  set onreset(value) {
    level0.set(this, "onreset", value);
  }
  get onresize() {
    return level0.get(this, "onresize");
  }
  set onresize(value) {
    level0.set(this, "onresize", value);
  }
  get onscroll() {
    return level0.get(this, "onscroll");
  }
  set onscroll(value) {
    level0.set(this, "onscroll", value);
  }
  get onseeked() {
    return level0.get(this, "onseeked");
  }
  set onseeked(value) {
    level0.set(this, "onseeked", value);
  }
  get onseeking() {
    return level0.get(this, "onseeking");
  }
  set onseeking(value) {
    level0.set(this, "onseeking", value);
  }
  get onselect() {
    return level0.get(this, "onselect");
  }
  set onselect(value) {
    level0.set(this, "onselect", value);
  }
  get onshow() {
    return level0.get(this, "onshow");
  }
  set onshow(value) {
    level0.set(this, "onshow", value);
  }
  get onstalled() {
    return level0.get(this, "onstalled");
  }
  set onstalled(value) {
    level0.set(this, "onstalled", value);
  }
  get onsubmit() {
    return level0.get(this, "onsubmit");
  }
  set onsubmit(value) {
    level0.set(this, "onsubmit", value);
  }
  get onsuspend() {
    return level0.get(this, "onsuspend");
  }
  set onsuspend(value) {
    level0.set(this, "onsuspend", value);
  }
  get ontimeupdate() {
    return level0.get(this, "ontimeupdate");
  }
  set ontimeupdate(value) {
    level0.set(this, "ontimeupdate", value);
  }
  get ontoggle() {
    return level0.get(this, "ontoggle");
  }
  set ontoggle(value) {
    level0.set(this, "ontoggle", value);
  }
  get onvolumechange() {
    return level0.get(this, "onvolumechange");
  }
  set onvolumechange(value) {
    level0.set(this, "onvolumechange", value);
  }
  get onwaiting() {
    return level0.get(this, "onwaiting");
  }
  set onwaiting(value) {
    level0.set(this, "onwaiting", value);
  }
  get onauxclick() {
    return level0.get(this, "onauxclick");
  }
  set onauxclick(value) {
    level0.set(this, "onauxclick", value);
  }
  get ongotpointercapture() {
    return level0.get(this, "ongotpointercapture");
  }
  set ongotpointercapture(value) {
    level0.set(this, "ongotpointercapture", value);
  }
  get onlostpointercapture() {
    return level0.get(this, "onlostpointercapture");
  }
  set onlostpointercapture(value) {
    level0.set(this, "onlostpointercapture", value);
  }
  get onpointercancel() {
    return level0.get(this, "onpointercancel");
  }
  set onpointercancel(value) {
    level0.set(this, "onpointercancel", value);
  }
  get onpointerdown() {
    return level0.get(this, "onpointerdown");
  }
  set onpointerdown(value) {
    level0.set(this, "onpointerdown", value);
  }
  get onpointerenter() {
    return level0.get(this, "onpointerenter");
  }
  set onpointerenter(value) {
    level0.set(this, "onpointerenter", value);
  }
  get onpointerleave() {
    return level0.get(this, "onpointerleave");
  }
  set onpointerleave(value) {
    level0.set(this, "onpointerleave", value);
  }
  get onpointermove() {
    return level0.get(this, "onpointermove");
  }
  set onpointermove(value) {
    level0.set(this, "onpointermove", value);
  }
  get onpointerout() {
    return level0.get(this, "onpointerout");
  }
  set onpointerout(value) {
    level0.set(this, "onpointerout", value);
  }
  get onpointerover() {
    return level0.get(this, "onpointerover");
  }
  set onpointerover(value) {
    level0.set(this, "onpointerover", value);
  }
  get onpointerup() {
    return level0.get(this, "onpointerup");
  }
  set onpointerup(value) {
    level0.set(this, "onpointerup", value);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/template-element.js
var tagName = "template";

class HTMLTemplateElement extends HTMLElement {
  constructor(ownerDocument) {
    super(ownerDocument, tagName);
    const content = this.ownerDocument.createDocumentFragment();
    (this[CONTENT] = content)[PRIVATE] = this;
  }
  get content() {
    if (this.hasChildNodes() && !this[CONTENT].hasChildNodes()) {
      for (const node of this.childNodes)
        this[CONTENT].appendChild(node.cloneNode(true));
    }
    return this[CONTENT];
  }
}
registerHTMLClass(tagName, HTMLTemplateElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/html-element.js
class HTMLHtmlElement extends HTMLElement {
  constructor(ownerDocument, localName = "html") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/text-element.js
var { toString } = HTMLElement.prototype;

class TextElement extends HTMLElement {
  get innerHTML() {
    return this.textContent;
  }
  set innerHTML(html) {
    this.textContent = html;
  }
  toString() {
    const outerHTML = toString.call(this.cloneNode());
    return outerHTML.replace("><", () => `>${this.textContent}<`);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/script-element.js
var tagName2 = "script";

class HTMLScriptElement extends TextElement {
  constructor(ownerDocument, localName = tagName2) {
    super(ownerDocument, localName);
  }
  get type() {
    return stringAttribute.get(this, "type");
  }
  set type(value) {
    stringAttribute.set(this, "type", value);
  }
  get src() {
    return stringAttribute.get(this, "src");
  }
  set src(value) {
    stringAttribute.set(this, "src", value);
  }
  get defer() {
    return booleanAttribute.get(this, "defer");
  }
  set defer(value) {
    booleanAttribute.set(this, "defer", value);
  }
  get crossOrigin() {
    return stringAttribute.get(this, "crossorigin");
  }
  set crossOrigin(value) {
    stringAttribute.set(this, "crossorigin", value);
  }
  get nomodule() {
    return booleanAttribute.get(this, "nomodule");
  }
  set nomodule(value) {
    booleanAttribute.set(this, "nomodule", value);
  }
  get referrerPolicy() {
    return stringAttribute.get(this, "referrerpolicy");
  }
  set referrerPolicy(value) {
    stringAttribute.set(this, "referrerpolicy", value);
  }
  get nonce() {
    return stringAttribute.get(this, "nonce");
  }
  set nonce(value) {
    stringAttribute.set(this, "nonce", value);
  }
  get async() {
    return booleanAttribute.get(this, "async");
  }
  set async(value) {
    booleanAttribute.set(this, "async", value);
  }
  get text() {
    return this.textContent;
  }
  set text(content) {
    this.textContent = content;
  }
}
registerHTMLClass(tagName2, HTMLScriptElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/frame-element.js
class HTMLFrameElement extends HTMLElement {
  constructor(ownerDocument, localName = "frame") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/i-frame-element.js
var tagName3 = "iframe";

class HTMLIFrameElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName3) {
    super(ownerDocument, localName);
  }
  get src() {
    return stringAttribute.get(this, "src");
  }
  set src(value) {
    stringAttribute.set(this, "src", value);
  }
  get srcdoc() {
    return stringAttribute.get(this, "srcdoc");
  }
  set srcdoc(value) {
    stringAttribute.set(this, "srcdoc", value);
  }
  get name() {
    return stringAttribute.get(this, "name");
  }
  set name(value) {
    stringAttribute.set(this, "name", value);
  }
  get allow() {
    return stringAttribute.get(this, "allow");
  }
  set allow(value) {
    stringAttribute.set(this, "allow", value);
  }
  get allowFullscreen() {
    return booleanAttribute.get(this, "allowfullscreen");
  }
  set allowFullscreen(value) {
    booleanAttribute.set(this, "allowfullscreen", value);
  }
  get referrerPolicy() {
    return stringAttribute.get(this, "referrerpolicy");
  }
  set referrerPolicy(value) {
    stringAttribute.set(this, "referrerpolicy", value);
  }
  get loading() {
    return stringAttribute.get(this, "loading");
  }
  set loading(value) {
    stringAttribute.set(this, "loading", value);
  }
}
registerHTMLClass(tagName3, HTMLIFrameElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/object-element.js
class HTMLObjectElement extends HTMLElement {
  constructor(ownerDocument, localName = "object") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/head-element.js
class HTMLHeadElement extends HTMLElement {
  constructor(ownerDocument, localName = "head") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/body-element.js
class HTMLBodyElement extends HTMLElement {
  constructor(ownerDocument, localName = "body") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/cssom@0.5.0/node_modules/cssom/lib/index.js
var $CSSStyleDeclaration = require_CSSStyleDeclaration().CSSStyleDeclaration;
var $CSSRule = require_CSSRule().CSSRule;
var $CSSGroupingRule = require_CSSGroupingRule().CSSGroupingRule;
var $CSSConditionRule = require_CSSConditionRule().CSSConditionRule;
var $CSSStyleRule = require_CSSStyleRule().CSSStyleRule;
var $MediaList = require_MediaList().MediaList;
var $CSSMediaRule = require_CSSMediaRule().CSSMediaRule;
var $CSSSupportsRule = require_CSSSupportsRule().CSSSupportsRule;
var $CSSImportRule = require_CSSImportRule().CSSImportRule;
var $CSSFontFaceRule = require_CSSFontFaceRule().CSSFontFaceRule;
var $CSSHostRule = require_CSSHostRule().CSSHostRule;
var $StyleSheet = require_StyleSheet().StyleSheet;
var $CSSStyleSheet = require_CSSStyleSheet().CSSStyleSheet;
var $CSSKeyframesRule = require_CSSKeyframesRule().CSSKeyframesRule;
var $CSSKeyframeRule = require_CSSKeyframeRule().CSSKeyframeRule;
var $MatcherList = require_MatcherList().MatcherList;
var $CSSDocumentRule = require_CSSDocumentRule().CSSDocumentRule;
var $CSSValue = require_CSSValue().CSSValue;
var $CSSValueExpression = require_CSSValueExpression().CSSValueExpression;
var $parse2 = require_parse().parse;
var $clone = require_clone().clone;

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/style-element.js
var tagName4 = "style";

class HTMLStyleElement extends TextElement {
  constructor(ownerDocument, localName = tagName4) {
    super(ownerDocument, localName);
    this[SHEET] = null;
  }
  get sheet() {
    const sheet = this[SHEET];
    if (sheet !== null) {
      return sheet;
    }
    return this[SHEET] = $parse2(this.textContent);
  }
  get innerHTML() {
    return super.innerHTML || "";
  }
  set innerHTML(value) {
    super.textContent = value;
    this[SHEET] = null;
  }
  get innerText() {
    return super.innerText || "";
  }
  set innerText(value) {
    super.textContent = value;
    this[SHEET] = null;
  }
  get textContent() {
    return super.textContent || "";
  }
  set textContent(value) {
    super.textContent = value;
    this[SHEET] = null;
  }
}
registerHTMLClass(tagName4, HTMLStyleElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/time-element.js
class HTMLTimeElement extends HTMLElement {
  constructor(ownerDocument, localName = "time") {
    super(ownerDocument, localName);
  }
  get dateTime() {
    return stringAttribute.get(this, "datetime");
  }
  set dateTime(value) {
    stringAttribute.set(this, "datetime", value);
  }
}
registerHTMLClass("time", HTMLTimeElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/field-set-element.js
class HTMLFieldSetElement extends HTMLElement {
  constructor(ownerDocument, localName = "fieldset") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/embed-element.js
class HTMLEmbedElement extends HTMLElement {
  constructor(ownerDocument, localName = "embed") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/hr-element.js
class HTMLHRElement extends HTMLElement {
  constructor(ownerDocument, localName = "hr") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/progress-element.js
class HTMLProgressElement extends HTMLElement {
  constructor(ownerDocument, localName = "progress") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/paragraph-element.js
class HTMLParagraphElement extends HTMLElement {
  constructor(ownerDocument, localName = "p") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/table-element.js
class HTMLTableElement extends HTMLElement {
  constructor(ownerDocument, localName = "table") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/frame-set-element.js
class HTMLFrameSetElement extends HTMLElement {
  constructor(ownerDocument, localName = "frameset") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/li-element.js
class HTMLLIElement extends HTMLElement {
  constructor(ownerDocument, localName = "li") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/base-element.js
class HTMLBaseElement extends HTMLElement {
  constructor(ownerDocument, localName = "base") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/data-list-element.js
class HTMLDataListElement extends HTMLElement {
  constructor(ownerDocument, localName = "datalist") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/input-element.js
var tagName5 = "input";

class HTMLInputElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName5) {
    super(ownerDocument, localName);
  }
  get autofocus() {
    return booleanAttribute.get(this, "autofocus") || -1;
  }
  set autofocus(value) {
    booleanAttribute.set(this, "autofocus", value);
  }
  get disabled() {
    return booleanAttribute.get(this, "disabled");
  }
  set disabled(value) {
    booleanAttribute.set(this, "disabled", value);
  }
  get name() {
    return this.getAttribute("name");
  }
  set name(value) {
    this.setAttribute("name", value);
  }
  get placeholder() {
    return this.getAttribute("placeholder");
  }
  set placeholder(value) {
    this.setAttribute("placeholder", value);
  }
  get type() {
    return this.getAttribute("type");
  }
  set type(value) {
    this.setAttribute("type", value);
  }
  get value() {
    return stringAttribute.get(this, "value");
  }
  set value(value) {
    stringAttribute.set(this, "value", value);
  }
}
registerHTMLClass(tagName5, HTMLInputElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/param-element.js
class HTMLParamElement extends HTMLElement {
  constructor(ownerDocument, localName = "param") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/media-element.js
class HTMLMediaElement extends HTMLElement {
  constructor(ownerDocument, localName = "media") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/audio-element.js
class HTMLAudioElement extends HTMLElement {
  constructor(ownerDocument, localName = "audio") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/heading-element.js
var tagName6 = "h1";

class HTMLHeadingElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName6) {
    super(ownerDocument, localName);
  }
}
registerHTMLClass([tagName6, "h2", "h3", "h4", "h5", "h6"], HTMLHeadingElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/directory-element.js
class HTMLDirectoryElement extends HTMLElement {
  constructor(ownerDocument, localName = "dir") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/quote-element.js
class HTMLQuoteElement extends HTMLElement {
  constructor(ownerDocument, localName = "quote") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/canvas-element.js
var import_canvas = __toESM(require_canvas(), 1);
var { createCanvas } = import_canvas.default;
var tagName7 = "canvas";

class HTMLCanvasElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName7) {
    super(ownerDocument, localName);
    this[IMAGE] = createCanvas(300, 150);
  }
  get width() {
    return this[IMAGE].width;
  }
  set width(value) {
    numericAttribute.set(this, "width", value);
    this[IMAGE].width = value;
  }
  get height() {
    return this[IMAGE].height;
  }
  set height(value) {
    numericAttribute.set(this, "height", value);
    this[IMAGE].height = value;
  }
  getContext(type) {
    return this[IMAGE].getContext(type);
  }
  toDataURL(...args) {
    return this[IMAGE].toDataURL(...args);
  }
}
registerHTMLClass(tagName7, HTMLCanvasElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/legend-element.js
class HTMLLegendElement extends HTMLElement {
  constructor(ownerDocument, localName = "legend") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/option-element.js
var tagName8 = "option";

class HTMLOptionElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName8) {
    super(ownerDocument, localName);
  }
  get value() {
    return stringAttribute.get(this, "value");
  }
  set value(value) {
    stringAttribute.set(this, "value", value);
  }
  get selected() {
    return booleanAttribute.get(this, "selected");
  }
  set selected(value) {
    const option = this.parentElement?.querySelector("option[selected]");
    if (option && option !== this)
      option.selected = false;
    booleanAttribute.set(this, "selected", value);
  }
}
registerHTMLClass(tagName8, HTMLOptionElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/span-element.js
class HTMLSpanElement extends HTMLElement {
  constructor(ownerDocument, localName = "span") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/meter-element.js
class HTMLMeterElement extends HTMLElement {
  constructor(ownerDocument, localName = "meter") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/video-element.js
class HTMLVideoElement extends HTMLElement {
  constructor(ownerDocument, localName = "video") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/table-cell-element.js
class HTMLTableCellElement extends HTMLElement {
  constructor(ownerDocument, localName = "td") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/title-element.js
var tagName9 = "title";

class HTMLTitleElement extends TextElement {
  constructor(ownerDocument, localName = tagName9) {
    super(ownerDocument, localName);
  }
}
registerHTMLClass(tagName9, HTMLTitleElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/output-element.js
class HTMLOutputElement extends HTMLElement {
  constructor(ownerDocument, localName = "output") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/table-row-element.js
class HTMLTableRowElement extends HTMLElement {
  constructor(ownerDocument, localName = "tr") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/data-element.js
class HTMLDataElement extends HTMLElement {
  constructor(ownerDocument, localName = "data") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/menu-element.js
class HTMLMenuElement extends HTMLElement {
  constructor(ownerDocument, localName = "menu") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/select-element.js
var tagName10 = "select";

class HTMLSelectElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName10) {
    super(ownerDocument, localName);
  }
  get options() {
    let children = new NodeList;
    let { firstElementChild } = this;
    while (firstElementChild) {
      if (firstElementChild.tagName === "OPTGROUP")
        children.push(...firstElementChild.children);
      else
        children.push(firstElementChild);
      firstElementChild = firstElementChild.nextElementSibling;
    }
    return children;
  }
  get disabled() {
    return booleanAttribute.get(this, "disabled");
  }
  set disabled(value) {
    booleanAttribute.set(this, "disabled", value);
  }
  get name() {
    return this.getAttribute("name");
  }
  set name(value) {
    this.setAttribute("name", value);
  }
  get value() {
    return this.querySelector("option[selected]")?.value;
  }
}
registerHTMLClass(tagName10, HTMLSelectElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/br-element.js
class HTMLBRElement extends HTMLElement {
  constructor(ownerDocument, localName = "br") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/button-element.js
var tagName11 = "button";

class HTMLButtonElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName11) {
    super(ownerDocument, localName);
  }
  get disabled() {
    return booleanAttribute.get(this, "disabled");
  }
  set disabled(value) {
    booleanAttribute.set(this, "disabled", value);
  }
  get name() {
    return this.getAttribute("name");
  }
  set name(value) {
    this.setAttribute("name", value);
  }
  get type() {
    return this.getAttribute("type");
  }
  set type(value) {
    this.setAttribute("type", value);
  }
}
registerHTMLClass(tagName11, HTMLButtonElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/map-element.js
class HTMLMapElement extends HTMLElement {
  constructor(ownerDocument, localName = "map") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/opt-group-element.js
class HTMLOptGroupElement extends HTMLElement {
  constructor(ownerDocument, localName = "optgroup") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/d-list-element.js
class HTMLDListElement extends HTMLElement {
  constructor(ownerDocument, localName = "dl") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/text-area-element.js
var tagName12 = "textarea";

class HTMLTextAreaElement extends TextElement {
  constructor(ownerDocument, localName = tagName12) {
    super(ownerDocument, localName);
  }
  get disabled() {
    return booleanAttribute.get(this, "disabled");
  }
  set disabled(value) {
    booleanAttribute.set(this, "disabled", value);
  }
  get name() {
    return this.getAttribute("name");
  }
  set name(value) {
    this.setAttribute("name", value);
  }
  get placeholder() {
    return this.getAttribute("placeholder");
  }
  set placeholder(value) {
    this.setAttribute("placeholder", value);
  }
  get type() {
    return this.getAttribute("type");
  }
  set type(value) {
    this.setAttribute("type", value);
  }
  get value() {
    return this.textContent;
  }
  set value(content) {
    this.textContent = content;
  }
}
registerHTMLClass(tagName12, HTMLTextAreaElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/font-element.js
class HTMLFontElement extends HTMLElement {
  constructor(ownerDocument, localName = "font") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/div-element.js
class HTMLDivElement extends HTMLElement {
  constructor(ownerDocument, localName = "div") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/link-element.js
var tagName13 = "link";

class HTMLLinkElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName13) {
    super(ownerDocument, localName);
  }
  get disabled() {
    return booleanAttribute.get(this, "disabled");
  }
  set disabled(value) {
    booleanAttribute.set(this, "disabled", value);
  }
  get href() {
    return stringAttribute.get(this, "href").trim();
  }
  set href(value) {
    stringAttribute.set(this, "href", value);
  }
  get hreflang() {
    return stringAttribute.get(this, "hreflang");
  }
  set hreflang(value) {
    stringAttribute.set(this, "hreflang", value);
  }
  get media() {
    return stringAttribute.get(this, "media");
  }
  set media(value) {
    stringAttribute.set(this, "media", value);
  }
  get rel() {
    return stringAttribute.get(this, "rel");
  }
  set rel(value) {
    stringAttribute.set(this, "rel", value);
  }
  get type() {
    return stringAttribute.get(this, "type");
  }
  set type(value) {
    stringAttribute.set(this, "type", value);
  }
}
registerHTMLClass(tagName13, HTMLLinkElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/slot-element.js
var tagName14 = "slot";

class HTMLSlotElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName14) {
    super(ownerDocument, localName);
  }
  get name() {
    return this.getAttribute("name");
  }
  set name(value) {
    this.setAttribute("name", value);
  }
  assign() {}
  assignedNodes(options) {
    const isNamedSlot = !!this.name;
    const hostChildNodes = this.getRootNode().host?.childNodes ?? [];
    let slottables;
    if (isNamedSlot) {
      slottables = [...hostChildNodes].filter((node) => node.slot === this.name);
    } else {
      slottables = [...hostChildNodes].filter((node) => !node.slot);
    }
    if (options?.flatten) {
      const result = [];
      for (let slottable of slottables) {
        if (slottable.localName === "slot") {
          result.push(...slottable.assignedNodes({ flatten: true }));
        } else {
          result.push(slottable);
        }
      }
      slottables = result;
    }
    return slottables.length ? slottables : [...this.childNodes];
  }
  assignedElements(options) {
    const slottables = this.assignedNodes(options).filter((n) => n.nodeType === 1);
    return slottables.length ? slottables : [...this.children];
  }
}
registerHTMLClass(tagName14, HTMLSlotElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/form-element.js
class HTMLFormElement extends HTMLElement {
  constructor(ownerDocument, localName = "form") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/image-element.js
var tagName15 = "img";

class HTMLImageElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName15) {
    super(ownerDocument, localName);
  }
  get alt() {
    return stringAttribute.get(this, "alt");
  }
  set alt(value) {
    stringAttribute.set(this, "alt", value);
  }
  get sizes() {
    return stringAttribute.get(this, "sizes");
  }
  set sizes(value) {
    stringAttribute.set(this, "sizes", value);
  }
  get src() {
    return stringAttribute.get(this, "src");
  }
  set src(value) {
    stringAttribute.set(this, "src", value);
  }
  get srcset() {
    return stringAttribute.get(this, "srcset");
  }
  set srcset(value) {
    stringAttribute.set(this, "srcset", value);
  }
  get title() {
    return stringAttribute.get(this, "title");
  }
  set title(value) {
    stringAttribute.set(this, "title", value);
  }
  get width() {
    return numericAttribute.get(this, "width");
  }
  set width(value) {
    numericAttribute.set(this, "width", value);
  }
  get height() {
    return numericAttribute.get(this, "height");
  }
  set height(value) {
    numericAttribute.set(this, "height", value);
  }
}
registerHTMLClass(tagName15, HTMLImageElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/pre-element.js
class HTMLPreElement extends HTMLElement {
  constructor(ownerDocument, localName = "pre") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/u-list-element.js
class HTMLUListElement extends HTMLElement {
  constructor(ownerDocument, localName = "ul") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/meta-element.js
var tagName16 = "meta";

class HTMLMetaElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName16) {
    super(ownerDocument, localName);
  }
  get name() {
    return stringAttribute.get(this, "name");
  }
  set name(value) {
    stringAttribute.set(this, "name", value);
  }
  get httpEquiv() {
    return stringAttribute.get(this, "http-equiv");
  }
  set httpEquiv(value) {
    stringAttribute.set(this, "http-equiv", value);
  }
  get content() {
    return stringAttribute.get(this, "content");
  }
  set content(value) {
    stringAttribute.set(this, "content", value);
  }
  get charset() {
    return stringAttribute.get(this, "charset");
  }
  set charset(value) {
    stringAttribute.set(this, "charset", value);
  }
  get media() {
    return stringAttribute.get(this, "media");
  }
  set media(value) {
    stringAttribute.set(this, "media", value);
  }
}
registerHTMLClass(tagName16, HTMLMetaElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/picture-element.js
class HTMLPictureElement extends HTMLElement {
  constructor(ownerDocument, localName = "picture") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/area-element.js
class HTMLAreaElement extends HTMLElement {
  constructor(ownerDocument, localName = "area") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/o-list-element.js
class HTMLOListElement extends HTMLElement {
  constructor(ownerDocument, localName = "ol") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/table-caption-element.js
class HTMLTableCaptionElement extends HTMLElement {
  constructor(ownerDocument, localName = "caption") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/anchor-element.js
var tagName17 = "a";

class HTMLAnchorElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName17) {
    super(ownerDocument, localName);
  }
  get href() {
    return encodeURI(decodeURI(stringAttribute.get(this, "href"))).trim();
  }
  set href(value) {
    stringAttribute.set(this, "href", decodeURI(value));
  }
  get download() {
    return encodeURI(decodeURI(stringAttribute.get(this, "download")));
  }
  set download(value) {
    stringAttribute.set(this, "download", decodeURI(value));
  }
  get target() {
    return stringAttribute.get(this, "target");
  }
  set target(value) {
    stringAttribute.set(this, "target", value);
  }
  get type() {
    return stringAttribute.get(this, "type");
  }
  set type(value) {
    stringAttribute.set(this, "type", value);
  }
  get rel() {
    return stringAttribute.get(this, "rel");
  }
  set rel(value) {
    stringAttribute.set(this, "rel", value);
  }
}
registerHTMLClass(tagName17, HTMLAnchorElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/label-element.js
class HTMLLabelElement extends HTMLElement {
  constructor(ownerDocument, localName = "label") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/unknown-element.js
class HTMLUnknownElement extends HTMLElement {
  constructor(ownerDocument, localName = "unknown") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/mod-element.js
class HTMLModElement extends HTMLElement {
  constructor(ownerDocument, localName = "mod") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/details-element.js
class HTMLDetailsElement extends HTMLElement {
  constructor(ownerDocument, localName = "details") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/source-element.js
var tagName18 = "source";

class HTMLSourceElement extends HTMLElement {
  constructor(ownerDocument, localName = tagName18) {
    super(ownerDocument, localName);
  }
  get src() {
    return stringAttribute.get(this, "src");
  }
  set src(value) {
    stringAttribute.set(this, "src", value);
  }
  get srcset() {
    return stringAttribute.get(this, "srcset");
  }
  set srcset(value) {
    stringAttribute.set(this, "srcset", value);
  }
  get sizes() {
    return stringAttribute.get(this, "sizes");
  }
  set sizes(value) {
    stringAttribute.set(this, "sizes", value);
  }
  get type() {
    return stringAttribute.get(this, "type");
  }
  set type(value) {
    stringAttribute.set(this, "type", value);
  }
}
registerHTMLClass(tagName18, HTMLSourceElement);

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/track-element.js
class HTMLTrackElement extends HTMLElement {
  constructor(ownerDocument, localName = "track") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/html/marquee-element.js
class HTMLMarqueeElement extends HTMLElement {
  constructor(ownerDocument, localName = "marquee") {
    super(ownerDocument, localName);
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/html-classes.js
var HTMLClasses = {
  HTMLElement,
  HTMLTemplateElement,
  HTMLHtmlElement,
  HTMLScriptElement,
  HTMLFrameElement,
  HTMLIFrameElement,
  HTMLObjectElement,
  HTMLHeadElement,
  HTMLBodyElement,
  HTMLStyleElement,
  HTMLTimeElement,
  HTMLFieldSetElement,
  HTMLEmbedElement,
  HTMLHRElement,
  HTMLProgressElement,
  HTMLParagraphElement,
  HTMLTableElement,
  HTMLFrameSetElement,
  HTMLLIElement,
  HTMLBaseElement,
  HTMLDataListElement,
  HTMLInputElement,
  HTMLParamElement,
  HTMLMediaElement,
  HTMLAudioElement,
  HTMLHeadingElement,
  HTMLDirectoryElement,
  HTMLQuoteElement,
  HTMLCanvasElement,
  HTMLLegendElement,
  HTMLOptionElement,
  HTMLSpanElement,
  HTMLMeterElement,
  HTMLVideoElement,
  HTMLTableCellElement,
  HTMLTitleElement,
  HTMLOutputElement,
  HTMLTableRowElement,
  HTMLDataElement,
  HTMLMenuElement,
  HTMLSelectElement,
  HTMLBRElement,
  HTMLButtonElement,
  HTMLMapElement,
  HTMLOptGroupElement,
  HTMLDListElement,
  HTMLTextAreaElement,
  HTMLFontElement,
  HTMLDivElement,
  HTMLLinkElement,
  HTMLSlotElement,
  HTMLFormElement,
  HTMLImageElement,
  HTMLPreElement,
  HTMLUListElement,
  HTMLMetaElement,
  HTMLPictureElement,
  HTMLAreaElement,
  HTMLOListElement,
  HTMLTableCaptionElement,
  HTMLAnchorElement,
  HTMLLabelElement,
  HTMLUnknownElement,
  HTMLModElement,
  HTMLDetailsElement,
  HTMLSourceElement,
  HTMLTrackElement,
  HTMLMarqueeElement
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/mime.js
var voidElements3 = { test: () => true };
var Mime = {
  "text/html": {
    docType: "<!DOCTYPE html>",
    ignoreCase: true,
    voidElements: /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i
  },
  "image/svg+xml": {
    docType: '<?xml version="1.0" encoding="utf-8"?>',
    ignoreCase: false,
    voidElements: voidElements3
  },
  "text/xml": {
    docType: '<?xml version="1.0" encoding="utf-8"?>',
    ignoreCase: false,
    voidElements: voidElements3
  },
  "application/xml": {
    docType: '<?xml version="1.0" encoding="utf-8"?>',
    ignoreCase: false,
    voidElements: voidElements3
  },
  "application/xhtml+xml": {
    docType: '<?xml version="1.0" encoding="utf-8"?>',
    ignoreCase: false,
    voidElements: voidElements3
  }
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/custom-event.js
class CustomEvent extends GlobalEvent {
  constructor(type, eventInitDict = {}) {
    super(type, eventInitDict);
    this.detail = eventInitDict.detail;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/input-event.js
class InputEvent extends GlobalEvent {
  constructor(type, inputEventInit = {}) {
    super(type, inputEventInit);
    this.inputType = inputEventInit.inputType;
    this.data = inputEventInit.data;
    this.dataTransfer = inputEventInit.dataTransfer;
    this.isComposing = inputEventInit.isComposing || false;
    this.ranges = inputEventInit.ranges;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/image.js
var ImageClass = (ownerDocument) => class Image extends HTMLImageElement {
  constructor(width, height) {
    super(ownerDocument);
    switch (arguments.length) {
      case 1:
        this.height = width;
        this.width = width;
        break;
      case 2:
        this.height = height;
        this.width = width;
        break;
    }
  }
};

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/range.js
var deleteContents = ({ [START]: start, [END]: end }, fragment = null) => {
  setAdjacent(start[PREV], end[NEXT]);
  do {
    const after = getEnd(start);
    const next = after === end ? after : after[NEXT];
    if (fragment)
      fragment.insertBefore(start, fragment[END]);
    else
      start.remove();
    start = next;
  } while (start !== end);
};

class Range {
  constructor() {
    this[START] = null;
    this[END] = null;
    this.commonAncestorContainer = null;
  }
  insertNode(newNode) {
    this[END].parentNode.insertBefore(newNode, this[START]);
  }
  selectNode(node) {
    this[START] = node;
    this[END] = getEnd(node);
  }
  selectNodeContents(node) {
    this.selectNode(node);
    this.commonAncestorContainer = node;
  }
  surroundContents(parentNode) {
    parentNode.replaceChildren(this.extractContents());
  }
  setStartBefore(node) {
    this[START] = node;
  }
  setStartAfter(node) {
    this[START] = node.nextSibling;
  }
  setEndBefore(node) {
    this[END] = getEnd(node.previousSibling);
  }
  setEndAfter(node) {
    this[END] = getEnd(node);
  }
  cloneContents() {
    let { [START]: start, [END]: end } = this;
    const fragment = start.ownerDocument.createDocumentFragment();
    while (start !== end) {
      fragment.insertBefore(start.cloneNode(true), fragment[END]);
      start = getEnd(start);
      if (start !== end)
        start = start[NEXT];
    }
    return fragment;
  }
  deleteContents() {
    deleteContents(this);
  }
  extractContents() {
    const fragment = this[START].ownerDocument.createDocumentFragment();
    deleteContents(this, fragment);
    return fragment;
  }
  createContextualFragment(html) {
    const { commonAncestorContainer: doc } = this;
    const isSVG = "ownerSVGElement" in doc;
    const document = isSVG ? doc.ownerDocument : doc;
    let content = htmlToFragment(document, html);
    if (isSVG) {
      const childNodes = [...content.childNodes];
      content = document.createDocumentFragment();
      Object.setPrototypeOf(content, SVGElement.prototype);
      content.ownerSVGElement = document;
      for (const child of childNodes) {
        Object.setPrototypeOf(child, SVGElement.prototype);
        child.ownerSVGElement = document;
        content.appendChild(child);
      }
    } else
      this.selectNode(content);
    return content;
  }
  cloneRange() {
    const range = new Range;
    range[START] = this[START];
    range[END] = this[END];
    return range;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/tree-walker.js
var isOK = ({ nodeType }, mask) => {
  switch (nodeType) {
    case ELEMENT_NODE:
      return mask & SHOW_ELEMENT;
    case TEXT_NODE:
      return mask & SHOW_TEXT;
    case COMMENT_NODE:
      return mask & SHOW_COMMENT;
    case CDATA_SECTION_NODE:
      return mask & SHOW_CDATA_SECTION;
  }
  return 0;
};

class TreeWalker {
  constructor(root, whatToShow = SHOW_ALL) {
    this.root = root;
    this.currentNode = root;
    this.whatToShow = whatToShow;
    let { [NEXT]: next, [END]: end } = root;
    if (root.nodeType === DOCUMENT_NODE) {
      const { documentElement } = root;
      next = documentElement;
      end = documentElement[END];
    }
    const nodes = [];
    while (next && next !== end) {
      if (isOK(next, whatToShow))
        nodes.push(next);
      next = next[NEXT];
    }
    this[PRIVATE] = { i: 0, nodes };
  }
  nextNode() {
    const $ = this[PRIVATE];
    this.currentNode = $.i < $.nodes.length ? $.nodes[$.i++] : null;
    return this.currentNode;
  }
}

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/interface/document.js
var query = (method, ownerDocument, selectors) => {
  let { [NEXT]: next, [END]: end } = ownerDocument;
  return method.call({ ownerDocument, [NEXT]: next, [END]: end }, selectors);
};
var globalExports = assign({}, Facades, HTMLClasses, {
  CustomEvent,
  Event: GlobalEvent,
  EventTarget: DOMEventTarget,
  InputEvent,
  NamedNodeMap,
  NodeList
});
var window = new WeakMap;

class Document3 extends NonElementParentNode {
  constructor(type) {
    super(null, "#document", DOCUMENT_NODE);
    this[CUSTOM_ELEMENTS] = { active: false, registry: null };
    this[MUTATION_OBSERVER] = { active: false, class: null };
    this[MIME] = Mime[type];
    this[DOCTYPE] = null;
    this[DOM_PARSER] = null;
    this[GLOBALS] = null;
    this[IMAGE] = null;
    this[UPGRADE] = null;
  }
  get defaultView() {
    if (!window.has(this))
      window.set(this, new Proxy(globalThis, {
        set: (target, name, value) => {
          switch (name) {
            case "addEventListener":
            case "removeEventListener":
            case "dispatchEvent":
              this[EVENT_TARGET][name] = value;
              break;
            default:
              target[name] = value;
              break;
          }
          return true;
        },
        get: (globalThis2, name) => {
          switch (name) {
            case "addEventListener":
            case "removeEventListener":
            case "dispatchEvent":
              if (!this[EVENT_TARGET]) {
                const et = this[EVENT_TARGET] = new DOMEventTarget;
                et.dispatchEvent = et.dispatchEvent.bind(et);
                et.addEventListener = et.addEventListener.bind(et);
                et.removeEventListener = et.removeEventListener.bind(et);
              }
              return this[EVENT_TARGET][name];
            case "document":
              return this;
            case "navigator":
              return {
                userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"
              };
            case "window":
              return window.get(this);
            case "customElements":
              if (!this[CUSTOM_ELEMENTS].registry)
                this[CUSTOM_ELEMENTS] = new CustomElementRegistry(this);
              return this[CUSTOM_ELEMENTS];
            case "performance":
              return globalThis2.performance;
            case "DOMParser":
              return this[DOM_PARSER];
            case "Image":
              if (!this[IMAGE])
                this[IMAGE] = ImageClass(this);
              return this[IMAGE];
            case "MutationObserver":
              if (!this[MUTATION_OBSERVER].class)
                this[MUTATION_OBSERVER] = new MutationObserverClass(this);
              return this[MUTATION_OBSERVER].class;
          }
          return this[GLOBALS] && this[GLOBALS][name] || globalExports[name] || globalThis2[name];
        }
      }));
    return window.get(this);
  }
  get doctype() {
    const docType = this[DOCTYPE];
    if (docType)
      return docType;
    const { firstChild } = this;
    if (firstChild && firstChild.nodeType === DOCUMENT_TYPE_NODE)
      return this[DOCTYPE] = firstChild;
    return null;
  }
  set doctype(value) {
    if (/^([a-z:]+)(\s+system|\s+public(\s+"([^"]+)")?)?(\s+"([^"]+)")?/i.test(value)) {
      const { $1: name, $4: publicId, $6: systemId } = RegExp;
      this[DOCTYPE] = new DocumentType(this, name, publicId, systemId);
      knownSiblings(this, this[DOCTYPE], this[NEXT]);
    }
  }
  get documentElement() {
    return this.firstElementChild;
  }
  get isConnected() {
    return true;
  }
  _getParent() {
    return this[EVENT_TARGET];
  }
  createAttribute(name) {
    return new Attr(this, name);
  }
  createCDATASection(data) {
    return new CDATASection(this, data);
  }
  createComment(textContent) {
    return new Comment3(this, textContent);
  }
  createDocumentFragment() {
    return new DocumentFragment(this);
  }
  createDocumentType(name, publicId, systemId) {
    return new DocumentType(this, name, publicId, systemId);
  }
  createElement(localName) {
    return new Element2(this, localName);
  }
  createRange() {
    const range = new Range;
    range.commonAncestorContainer = this;
    return range;
  }
  createTextNode(textContent) {
    return new Text4(this, textContent);
  }
  createTreeWalker(root, whatToShow = -1) {
    return new TreeWalker(root, whatToShow);
  }
  createNodeIterator(root, whatToShow = -1) {
    return this.createTreeWalker(root, whatToShow);
  }
  createEvent(name) {
    const event = create(name === "Event" ? new GlobalEvent("") : new CustomEvent(""));
    event.initEvent = event.initCustomEvent = (type, canBubble = false, cancelable = false, detail) => {
      event.bubbles = !!canBubble;
      defineProperties(event, {
        type: { value: type },
        canBubble: { value: canBubble },
        cancelable: { value: cancelable },
        detail: { value: detail }
      });
    };
    return event;
  }
  cloneNode(deep = false) {
    const {
      constructor,
      [CUSTOM_ELEMENTS]: customElements,
      [DOCTYPE]: doctype
    } = this;
    const document = new constructor;
    document[CUSTOM_ELEMENTS] = customElements;
    if (deep) {
      const end = document[END];
      const { childNodes } = this;
      for (let { length } = childNodes, i = 0;i < length; i++)
        document.insertBefore(childNodes[i].cloneNode(true), end);
      if (doctype)
        document[DOCTYPE] = childNodes[0];
    }
    return document;
  }
  importNode(externalNode) {
    const deep = 1 < arguments.length && !!arguments[1];
    const node = externalNode.cloneNode(deep);
    const { [CUSTOM_ELEMENTS]: customElements } = this;
    const { active } = customElements;
    const upgrade = (element) => {
      const { ownerDocument, nodeType } = element;
      element.ownerDocument = this;
      if (active && ownerDocument !== this && nodeType === ELEMENT_NODE)
        customElements.upgrade(element);
    };
    upgrade(node);
    if (deep) {
      switch (node.nodeType) {
        case ELEMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE: {
          let { [NEXT]: next, [END]: end } = node;
          while (next !== end) {
            if (next.nodeType === ELEMENT_NODE)
              upgrade(next);
            next = next[NEXT];
          }
          break;
        }
      }
    }
    return node;
  }
  toString() {
    return this.childNodes.join("");
  }
  querySelector(selectors) {
    return query(super.querySelector, this, selectors);
  }
  querySelectorAll(selectors) {
    return query(super.querySelectorAll, this, selectors);
  }
  getElementsByTagNameNS(_, name) {
    return this.getElementsByTagName(name);
  }
  createAttributeNS(_, name) {
    return this.createAttribute(name);
  }
  createElementNS(nsp, localName, options) {
    return nsp === SVG_NAMESPACE ? new SVGElement(this, localName, null) : this.createElement(localName, options);
  }
}
setPrototypeOf(globalExports.Document = function Document() {
  illegalConstructor();
}, Document3).prototype = Document3.prototype;

// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/shared/parse-json.js
var { parse: parse5 } = JSON;
// node_modules/.bun/linkedom@0.18.13/node_modules/linkedom/esm/index.js
function Document4() {
  illegalConstructor();
}
setPrototypeOf(Document4, Document3).prototype = Document3.prototype;
// packages/sources/src/man.ts
var supported = new Set(["TH", "SH", "SS", "PP", "TP", "B", "I", "BR", "IR"]);

// packages/sources/src/index.ts
var identifierSchema = string2().min(1);
var repoSchema = string2().regex(/^[^/\s]+\/[^/\s]+$/);
var relativePathSchema = string2().min(1).refine((path) => {
  if (path.startsWith("/") || path.includes("\\") || path.includes(":"))
    return false;
  return path.split("/").every((part) => part !== "" && part !== "." && part !== "..");
});
var pageUrlSchema = url().refine((url2) => /^https?:\/\//i.test(url2));
var sourceKindSchema = _enum([
  "readme",
  "docs",
  "wiki",
  "man",
  "confluence",
  "url"
]);
var sourceSchema = discriminatedUnion("kind", [
  object({
    id: identifierSchema,
    repo: repoSchema,
    kind: literal("readme"),
    path: relativePathSchema
  }),
  object({
    id: identifierSchema,
    repo: repoSchema,
    kind: literal("docs"),
    path: relativePathSchema
  }),
  object({
    id: identifierSchema,
    repo: repoSchema,
    kind: literal("man"),
    path: relativePathSchema
  }),
  object({
    id: identifierSchema,
    repo: repoSchema,
    kind: literal("wiki"),
    page: identifierSchema,
    url: pageUrlSchema
  }),
  object({
    id: identifierSchema,
    repo: repoSchema,
    kind: literal("confluence"),
    site: identifierSchema,
    pageId: identifierSchema,
    url: pageUrlSchema
  }),
  object({
    id: identifierSchema,
    repo: repoSchema,
    kind: literal("url"),
    url: pageUrlSchema,
    owner: identifierSchema.optional()
  })
]);
var offsetsSchema = object({
  sourceId: identifierSchema,
  startOffset: int().nonnegative(),
  endOffset: int().positive()
});
var locationSchema = discriminatedUnion("kind", [
  offsetsSchema.extend({
    kind: literal("file"),
    path: relativePathSchema,
    lineStart: int().positive(),
    lineEnd: int().positive()
  }),
  offsetsSchema.extend({
    kind: literal("wiki"),
    page: identifierSchema,
    headingPath: array(identifierSchema),
    url: pageUrlSchema
  }),
  offsetsSchema.extend({
    kind: literal("confluence"),
    pageId: identifierSchema,
    headingPath: array(identifierSchema),
    url: pageUrlSchema
  }),
  offsetsSchema.extend({
    kind: literal("url"),
    url: pageUrlSchema,
    headingPath: array(identifierSchema)
  })
]).superRefine((location, context) => {
  if (location.startOffset >= location.endOffset) {
    context.addIssue({
      code: "custom",
      path: ["endOffset"],
      message: "Location must cover text"
    });
  }
  if (location.kind === "file" && location.lineStart > location.lineEnd) {
    context.addIssue({
      code: "custom",
      path: ["lineEnd"],
      message: "Line range is reversed"
    });
  }
});
var spanBaseSchema = object({
  startOffset: int().nonnegative(),
  endOffset: int().positive(),
  location: locationSchema
});
var docSpanSchema = discriminatedUnion("kind", [
  spanBaseSchema.extend({
    kind: literal("heading"),
    level: int().min(1).max(6)
  }),
  spanBaseSchema.extend({ kind: literal("text") }),
  spanBaseSchema.extend({
    kind: literal("code"),
    language: string2().nullable()
  })
]);
var docTextSchema = object({
  sourceId: identifierSchema,
  text: string2(),
  spans: array(docSpanSchema)
}).superRefine((doc, context) => {
  let previousEnd = 0;
  for (const [index, span] of doc.spans.entries()) {
    const valid = span.startOffset >= previousEnd && span.startOffset < span.endOffset && span.endOffset <= doc.text.length && span.location.sourceId === doc.sourceId && span.location.startOffset === span.startOffset && span.location.endOffset === span.endOffset;
    if (!valid)
      context.addIssue({
        code: "custom",
        path: ["spans", index],
        message: "Span must map to an ordered range of this document"
      });
    previousEnd = span.endOffset;
  }
});

// packages/plan/src/checks.ts
var identifierSchema2 = string2().min(1);
var portSchema = int().min(1).max(65535);
var commandTimeoutSchema = int().positive().max(120000);
var portTimeoutSchema = int().positive().max(30000);
var commandSchema = string2().min(1).refine((command) => command === command.trim() && /^(?:npm|pnpm|yarn|bun|node|npx|cp|mkdir|touch)(?:\s|$)/.test(command) && !/[;&|<>`$()\r\n]/u.test(command));
var checkKindSchema = _enum([
  "file_exists",
  "script_exists",
  "code_reference",
  "env_var",
  "version",
  "cli_flag",
  "command_succeeds",
  "port_listens",
  "http_example"
]);
var checkSchema = discriminatedUnion("kind", [
  object({
    kind: literal("file_exists"),
    params: strictObject({ path: relativePathSchema })
  }),
  object({
    kind: literal("script_exists"),
    params: strictObject({ script: identifierSchema2 })
  }),
  object({
    kind: literal("code_reference"),
    params: strictObject({ name: identifierSchema2 })
  }),
  object({
    kind: literal("env_var"),
    params: strictObject({
      name: string2().regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
    })
  }),
  object({
    kind: literal("version"),
    params: strictObject({ range: identifierSchema2 })
  }),
  object({
    kind: literal("cli_flag"),
    params: strictObject({
      flag: string2().regex(/^--?[A-Za-z][A-Za-z0-9-]*$/)
    })
  }),
  object({
    kind: literal("command_succeeds"),
    params: strictObject({
      command: commandSchema,
      timeoutMs: commandTimeoutSchema.optional()
    })
  }),
  object({
    kind: literal("port_listens"),
    params: strictObject({
      port: portSchema,
      startScript: identifierSchema2,
      timeoutMs: portTimeoutSchema.optional()
    })
  }),
  object({
    kind: literal("http_example"),
    params: strictObject({
      method: _enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]),
      path: string2().startsWith("/"),
      expectedStatus: int().min(100).max(599),
      expectedKeys: array(identifierSchema2)
    })
  })
]);

// packages/plan/src/identity.ts
import { createHash } from "node:crypto";
function canonicalJson(value) {
  if (value === null)
    return "null";
  if (typeof value === "string" || typeof value === "boolean")
    return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("Canonical JSON requires finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (typeof value !== "object")
    throw new TypeError("Canonical JSON requires a JSON value");
  const object = value;
  const entries = Object.keys(object).sort().filter((key) => object[key] !== undefined).map((key) => {
    const item = object[key];
    return `${JSON.stringify(key)}:${canonicalJson(item)}`;
  });
  return `{${entries.join(",")}}`;
}
function claimId(sourceId, quote, kind, params) {
  const normalizedQuote = quote.normalize("NFC").replace(/\s+/gu, " ").trim();
  const input = `${sourceId}
${normalizedQuote}
${kind}
${canonicalJson(params)}`;
  return `c_${createHash("sha256").update(input).digest("hex").slice(0, 10)}`;
}
function factKey(kind, params) {
  return `${kind}
${canonicalJson(params)}`;
}

// packages/plan/src/schema.ts
var idSchema = string2().min(1);
var shaSchema = string2().regex(/^[0-9a-f]{7,64}$/);
var twentyLinesSchema = string2().refine((value) => value.split(/\r?\n/).length <= 20);
var claimSchema = intersection(checkSchema, object({
  id: string2().regex(/^c_[0-9a-f]{10}$/),
  sourceId: idSchema,
  occurrences: array(object({ quote: idSchema, location: locationSchema })).min(1),
  tier: _enum(["static", "runtime"])
})).superRefine((claim, context) => {
  for (const [index, occurrence] of claim.occurrences.entries()) {
    if (claim.id !== claimId(claim.sourceId, occurrence.quote, claim.kind, claim.params)) {
      context.addIssue({
        code: "custom",
        path: ["occurrences", index, "quote"],
        message: "Claim ID does not match occurrence quote"
      });
    }
    if (occurrence.location.sourceId !== claim.sourceId) {
      context.addIssue({
        code: "custom",
        path: ["occurrences", index, "location"],
        message: "Occurrence location must use claim source ID"
      });
    }
  }
  const runtime = [
    "command_succeeds",
    "port_listens",
    "http_example"
  ].includes(claim.kind);
  if (claim.kind !== "cli_flag" && claim.tier !== (runtime ? "runtime" : "static")) {
    context.addIssue({
      code: "custom",
      path: ["tier"],
      message: "Tier does not match check kind"
    });
  }
});
var flightPlanSchema = object({
  repo: string2().regex(/^[^/\s]+\/[^/\s]+$/),
  sourceHashes: record(string2(), string2().regex(/^[0-9a-f]{64}$/)),
  claims: array(claimSchema)
}).superRefine((plan, context) => {
  const seen = new Set;
  for (const [index, claim] of plan.claims.entries()) {
    if (seen.has(claim.id)) {
      context.addIssue({
        code: "custom",
        path: ["claims", index, "id"],
        message: "Duplicate claim ID; merge occurrences"
      });
    }
    seen.add(claim.id);
    if (!(claim.sourceId in plan.sourceHashes)) {
      context.addIssue({
        code: "custom",
        path: ["claims", index, "sourceId"],
        message: "Claim source has no content hash"
      });
    }
  }
});
var trustStateSchema = _enum([
  "unconfirmed",
  "confirmed",
  "disputed",
  "dropped"
]);
var claimEvidenceSchema = object({
  claimId: string2().regex(/^c_[0-9a-f]{10}$/),
  sourceId: idSchema,
  sourceKind: sourceKindSchema,
  location: locationSchema,
  quote: idSchema,
  expected: string2(),
  actual: twentyLinesSchema,
  lastPassSha: shaSchema.nullable(),
  firstFailSha: shaSchema,
  relatedFiles: array(string2()),
  suspectedCommit: object({ sha: shaSchema, author: string2().nullable() }).nullable(),
  deepLink: url(),
  fix: object({
    kind: _enum(["pr", "wiki_patch", "confluence_comment", "evidence_only"]),
    url: url().optional(),
    suggestedText: string2().optional()
  })
}).superRefine((item, context) => {
  if (item.location.sourceId !== item.sourceId) {
    context.addIssue({
      code: "custom",
      path: ["location"],
      message: "Evidence location must use its source ID"
    });
  }
});
var evidenceSchema = intersection(checkSchema, object({
  factKey: idSchema,
  claims: array(claimEvidenceSchema).min(1)
})).superRefine((evidence, context) => {
  if (evidence.factKey !== factKey(evidence.kind, evidence.params)) {
    context.addIssue({
      code: "custom",
      path: ["factKey"],
      message: "Fact key does not match kind and parameters"
    });
  }
});

// action/src/run.ts
function readPlan(root, repo) {
  const content = readFileSync3(join3(root, "flightchecks/flightplan.json"), "utf8");
  const parsed = flightPlanSchema.safeParse(JSON.parse(content));
  if (!parsed.success)
    throw new TypeError("Flight plan is invalid");
  if (parsed.data.repo !== repo)
    throw new TypeError("Flight plan repository does not match checkout");
  return parsed.data;
}
function deepLink(repo, sha, claim) {
  const location = claim.occurrences[0]?.location;
  if (location?.kind !== "file" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repo))
    return null;
  const path = location.path.split("/").map(encodeURIComponent).join("/");
  return `https://github.com/${repo}/blob/${sha}/${path}#L${location.lineStart}`;
}
function resultFor(claim, outcome, repo, sha) {
  const quote = claim.occurrences[0]?.quote;
  if (!quote)
    throw new TypeError(`Claim ${claim.id} lacks an occurrence`);
  return {
    kind: claim.kind,
    params: claim.params,
    claimId: claim.id,
    sourceId: claim.sourceId,
    quote,
    status: outcome.status,
    expected: outcome.expected,
    actual: outcome.actual.split(/\r?\n/u).slice(0, 20).join(`
`),
    deepLink: deepLink(repo, sha, claim)
  };
}
async function loadRunner(root) {
  const path = pathToFileURL(join3(root, "flightchecks/runner.mjs")).href;
  const module = await import(path);
  if (typeof module !== "object" || module === null || !("runPlan" in module) || typeof module.runPlan !== "function") {
    throw new TypeError("Bundled runner does not export runPlan");
  }
  return module.runPlan;
}
async function loadConnectedRunner(root, event, repo) {
  if (!repo || !matchingRunRepository(event, repo))
    return { ok: false, error: { code: "repository_identity_required" } };
  readPlan(root, repo);
  return { ok: true, value: await loadRunner(root) };
}
async function runFlightChecks(root, repo, commitSha, runner, metadata = {}) {
  const plan = readPlan(root, repo);
  const results = await runner(plan, root);
  const telemetry = {
    repo,
    commitSha,
    ...metadata,
    results: plan.claims.map((claim) => {
      const outcome = results[claim.id];
      if (!outcome)
        throw new Error(`Runner returned no result for ${claim.id}`);
      return resultFor(claim, outcome, repo, commitSha);
    })
  };
  const output = join3(root, ".groundcontrol");
  mkdirSync(output, { recursive: true });
  writeFileSync(join3(output, "telemetry.json"), `${JSON.stringify(telemetry, null, 2)}
`);
  return telemetry;
}

// action/src/index.ts
async function main() {
  const root = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const mode = process.env.INPUT_MODE;
  if (mode === "report") {
    if (!process.env.INPUT_SERVER || !process.env.INPUT_TOKEN) {
      process.stderr.write(`missing_configuration
`);
      process.exitCode = 1;
      return;
    }
    const identity = trustedReportIdentity({
      repository: process.env.GITHUB_REPOSITORY,
      workflowSha: process.env.GITHUB_SHA,
      eventName: process.env.GITHUB_EVENT_NAME,
      event: readActionEvent(process.env.GITHUB_EVENT_PATH)
    });
    const result = await reportTelemetry(root, process.env.INPUT_SERVER ?? "", process.env.INPUT_TOKEN ?? "", identity);
    if (!result.ok) {
      process.stderr.write(`Telemetry report failed: ${result.error}${result.status ? ` (${result.status})` : ""}
`);
      process.exitCode = 1;
    }
    return;
  }
  if (mode !== "run")
    throw new TypeError("Action mode must be run or report");
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const event = readActionEvent(process.env.GITHUB_EVENT_PATH);
  const runner = await loadConnectedRunner(root, event, repo);
  if (!runner.ok) {
    process.stderr.write(`${runner.error.code}
`);
    process.exitCode = 1;
    return;
  }
  const sha = checkedOutCommit(root);
  if (!sha || !/^[0-9a-f]{40,64}$/u.test(sha))
    throw new TypeError("GitHub repository and checked-out commit are required");
  const metadata = metadataForCheckout(root, event, sha);
  await runFlightChecks(root, repo, sha, runner.value, metadata);
}
await main().catch(() => {
  process.stderr.write(`Ground Control action failed before telemetry could be reported
`);
  process.exitCode = 1;
});
