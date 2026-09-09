// node_modules/.pnpm/property-graph@4.1.0/node_modules/property-graph/dist/index.mjs
var EventDispatcher = class {
  _listeners = {};
  addEventListener(type, listener) {
    const listeners = this._listeners;
    if (listeners[type] === void 0) listeners[type] = [];
    if (listeners[type].indexOf(listener) === -1) listeners[type].push(listener);
    return this;
  }
  removeEventListener(type, listener) {
    const listenerArray = this._listeners[type];
    if (listenerArray !== void 0) {
      const index = listenerArray.indexOf(listener);
      if (index !== -1) listenerArray.splice(index, 1);
    }
    return this;
  }
  dispatchEvent(event) {
    const listenerArray = this._listeners[event.type];
    if (listenerArray !== void 0) {
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) array[i].call(this, event);
    }
    return this;
  }
  dispose() {
    for (const key in this._listeners) delete this._listeners[key];
  }
};
var GraphEdge = class {
  _disposed = false;
  _name;
  _parent;
  _child;
  _attributes;
  constructor(_name, _parent, _child, _attributes = {}) {
    this._name = _name;
    this._parent = _parent;
    this._child = _child;
    this._attributes = _attributes;
    if (!_parent.isOnGraph(_child)) throw new Error("Cannot connect disconnected graphs.");
  }
  /** Name (attribute name from parent {@link GraphNode}). */
  getName() {
    return this._name;
  }
  /** Owner node. */
  getParent() {
    return this._parent;
  }
  /** Resource node. */
  getChild() {
    return this._child;
  }
  /**
  * Sets the child node.
  *
  * @internal Only {@link Graph} implementations may safely call this method directly. Use
  * 	{@link Property.swap} or {@link Graph.swapChild} instead.
  */
  setChild(child) {
    this._child = child;
    return this;
  }
  /** Attributes of the graph node relationship. */
  getAttributes() {
    return this._attributes;
  }
  /** Destroys a (currently intact) edge, updating both the graph and the owner. */
  dispose() {
    if (this._disposed) return;
    this._parent._destroyRef(this);
    this._disposed = true;
  }
  /** Whether this link has been destroyed. */
  isDisposed() {
    return this._disposed;
  }
};
var Graph = class extends EventDispatcher {
  _emptySet = /* @__PURE__ */ new Set();
  _edges = /* @__PURE__ */ new Set();
  _parentEdges = /* @__PURE__ */ new Map();
  _childEdges = /* @__PURE__ */ new Map();
  /** Returns a list of all parent->child edges on this graph. */
  listEdges() {
    return Array.from(this._edges);
  }
  /** Returns a list of all edges on the graph having the given node as their child. */
  listParentEdges(node) {
    return Array.from(this._childEdges.get(node) || this._emptySet);
  }
  /** Returns a list of parent nodes for the given child node. */
  listParents(node) {
    const parentSet = /* @__PURE__ */ new Set();
    for (const edge of this.listParentEdges(node)) parentSet.add(edge.getParent());
    return Array.from(parentSet);
  }
  /** Returns a list of all edges on the graph having the given node as their parent. */
  listChildEdges(node) {
    return Array.from(this._parentEdges.get(node) || this._emptySet);
  }
  /** Returns a list of child nodes for the given parent node. */
  listChildren(node) {
    const childSet = /* @__PURE__ */ new Set();
    for (const edge of this.listChildEdges(node)) childSet.add(edge.getChild());
    return Array.from(childSet);
  }
  disconnectParents(node, filter) {
    for (const edge of this.listParentEdges(node)) if (!filter || filter(edge.getParent())) edge.dispose();
    return this;
  }
  /**********************************************************************************************
  * Internal.
  */
  /**
  * Creates a {@link GraphEdge} connecting two {@link GraphNode} instances. Edge is returned
  * for the caller to store.
  * @param a Owner
  * @param b Resource
  * @hidden
  * @internal
  */
  _createEdge(name, a, b, attributes) {
    const edge = new GraphEdge(name, a, b, attributes);
    this._edges.add(edge);
    const parent = edge.getParent();
    if (!this._parentEdges.has(parent)) this._parentEdges.set(parent, /* @__PURE__ */ new Set());
    this._parentEdges.get(parent).add(edge);
    const child = edge.getChild();
    if (!this._childEdges.has(child)) this._childEdges.set(child, /* @__PURE__ */ new Set());
    this._childEdges.get(child).add(edge);
    return edge;
  }
  /**
  * Detaches a {@link GraphEdge} from the {@link Graph}. Before calling this
  * method, ensure that the GraphEdge has first been detached from any
  * associated {@link GraphNode} attributes.
  * @hidden
  * @internal
  */
  _destroyEdge(edge) {
    this._edges.delete(edge);
    this._parentEdges.get(edge.getParent()).delete(edge);
    this._childEdges.get(edge.getChild()).delete(edge);
    return this;
  }
};
var RefList = class {
  list = [];
  constructor(refs) {
    if (refs) for (const ref of refs) this.list.push(ref);
  }
  add(ref) {
    this.list.push(ref);
  }
  remove(ref) {
    const index = this.list.indexOf(ref);
    if (index >= 0) this.list.splice(index, 1);
  }
  removeChild(child) {
    const refs = [];
    for (const ref of this.list) if (ref.getChild() === child) refs.push(ref);
    for (const ref of refs) this.remove(ref);
    return refs;
  }
  listRefsByChild(child) {
    const refs = [];
    for (const ref of this.list) if (ref.getChild() === child) refs.push(ref);
    return refs;
  }
  values() {
    return this.list;
  }
};
var RefSet = class {
  set = /* @__PURE__ */ new Set();
  map = /* @__PURE__ */ new Map();
  constructor(refs) {
    if (refs) for (const ref of refs) this.add(ref);
  }
  add(ref) {
    const child = ref.getChild();
    this.removeChild(child);
    this.set.add(ref);
    this.map.set(child, ref);
  }
  remove(ref) {
    this.set.delete(ref);
    this.map.delete(ref.getChild());
  }
  removeChild(child) {
    const ref = this.map.get(child) || null;
    if (ref) this.remove(ref);
    return ref;
  }
  getRefByChild(child) {
    return this.map.get(child) || null;
  }
  values() {
    return Array.from(this.set);
  }
};
var RefMap = class {
  map = {};
  constructor(map) {
    if (map) Object.assign(this.map, map);
  }
  set(key, child) {
    this.map[key] = child;
  }
  delete(key) {
    delete this.map[key];
  }
  get(key) {
    return this.map[key] || null;
  }
  keys() {
    return Object.keys(this.map);
  }
  values() {
    return Object.values(this.map);
  }
};
var $attributes = /* @__PURE__ */ Symbol("attributes");
var $immutableKeys = /* @__PURE__ */ Symbol("immutableKeys");
var GraphNode = class GraphNode2 extends EventDispatcher {
  _disposed = false;
  /**
  * Internal graph used to search and maintain references.
  * @hidden
  */
  graph;
  /**
  * Attributes (literal values and GraphNode references) associated with this instance. For each
  * GraphNode reference, the attributes stores a {@link GraphEdge}. List and Map references are
  * stored as arrays and dictionaries of edges.
  * @internal
  */
  [$attributes];
  /**
  * Attributes included with `getDefaultAttributes` are considered immutable, and cannot be
  * modifed by `.setRef()`, `.copy()`, or other GraphNode methods. Both the edges and the
  * properties will be disposed with the parent GraphNode.
  *
  * Currently, only single-edge references (getRef/setRef) are supported as immutables.
  *
  * @internal
  */
  [$immutableKeys];
  constructor(graph) {
    super();
    this.graph = graph;
    this[$immutableKeys] = /* @__PURE__ */ new Set();
    this[$attributes] = this._createAttributes();
  }
  /**
  * Returns default attributes for the graph node. Subclasses having any attributes (either
  * literal values or references to other graph nodes) must override this method. Literal
  * attributes should be given their default values, if any. References should generally be
  * initialized as empty (Ref → null, RefList → [], RefMap → {}) and then modified by setters.
  *
  * Any single-edge references (setRef) returned by this method will be considered immutable,
  * to be owned by and disposed with the parent node. Multi-edge references (addRef, removeRef,
  * setRefMap) cannot be returned as default attributes.
  */
  getDefaults() {
    return {};
  }
  /**
  * Constructs and returns an object used to store a graph nodes attributes. Compared to the
  * default Attributes interface, this has two distinctions:
  *
  * 1. Slots for GraphNode<T> objects are replaced with slots for GraphEdge<this, GraphNode<T>>
  * 2. GraphNode<T> objects provided as defaults are considered immutable
  *
  * @internal
  */
  _createAttributes() {
    const defaultAttributes = this.getDefaults();
    const attributes = {};
    for (const key in defaultAttributes) {
      const value = defaultAttributes[key];
      if (value instanceof GraphNode2) {
        const ref = this.graph._createEdge(key, this, value);
        this[$immutableKeys].add(key);
        attributes[key] = ref;
      } else attributes[key] = value;
    }
    return attributes;
  }
  /** @internal Returns true if two nodes are on the same {@link Graph}. */
  isOnGraph(other) {
    return this.graph === other.graph;
  }
  /** Returns true if the node has been permanently removed from the graph. */
  isDisposed() {
    return this._disposed;
  }
  /**
  * Removes both inbound references to and outbound references from this object. At the end
  * of the process the object holds no references, and nothing holds references to it. A
  * disposed object is not reusable.
  */
  dispose() {
    if (this._disposed) return;
    this.graph.listChildEdges(this).forEach((edge) => edge.dispose());
    this.graph.disconnectParents(this);
    this._disposed = true;
    this.dispatchEvent({ type: "dispose" });
  }
  /**
  * Removes all inbound references to this object. At the end of the process the object is
  * considered 'detached': it may hold references to child resources, but nothing holds
  * references to it. A detached object may be re-attached.
  */
  detach() {
    this.graph.disconnectParents(this);
    return this;
  }
  /**
  * Transfers this object's references from the old node to the new one. The old node is fully
  * detached from this parent at the end of the process.
  *
  * @hidden
  */
  swap(prevValue, nextValue) {
    for (const attribute in this[$attributes]) {
      const value = this[$attributes][attribute];
      if (value instanceof GraphEdge) {
        const ref = value;
        if (ref.getChild() === prevValue) this.setRef(attribute, nextValue, ref.getAttributes());
      } else if (value instanceof RefList) for (const ref of value.listRefsByChild(prevValue)) {
        const refAttributes = ref.getAttributes();
        this.removeRef(attribute, prevValue);
        this.addRef(attribute, nextValue, refAttributes);
      }
      else if (value instanceof RefSet) {
        const ref = value.getRefByChild(prevValue);
        if (ref) {
          const refAttributes = ref.getAttributes();
          this.removeRef(attribute, prevValue);
          this.addRef(attribute, nextValue, refAttributes);
        }
      } else if (value instanceof RefMap) for (const key of value.keys()) {
        const ref = value.get(key);
        if (ref.getChild() === prevValue) this.setRefMap(attribute, key, nextValue, ref.getAttributes());
      }
    }
    return this;
  }
  /**********************************************************************************************
  * Literal attributes.
  */
  /** @hidden */
  get(attribute) {
    return this[$attributes][attribute];
  }
  /** @hidden */
  set(attribute, value) {
    this[$attributes][attribute] = value;
    return this.dispatchEvent({
      type: "change",
      attribute
    });
  }
  /**********************************************************************************************
  * Ref: 1:1 graph node references.
  */
  /** @hidden */
  getRef(attribute) {
    const ref = this[$attributes][attribute];
    return ref ? ref.getChild() : null;
  }
  /** @hidden */
  setRef(attribute, value, attributes) {
    if (this[$immutableKeys].has(attribute)) throw new Error(`Cannot overwrite immutable attribute, "${attribute}".`);
    const prevRef = this[$attributes][attribute];
    if (prevRef) prevRef.dispose();
    if (!value) return this;
    const ref = this.graph._createEdge(attribute, this, value, attributes);
    this[$attributes][attribute] = ref;
    return this.dispatchEvent({
      type: "change",
      attribute
    });
  }
  /**********************************************************************************************
  * RefList: 1:many graph node references.
  */
  /** @hidden */
  listRefs(attribute) {
    return this.assertRefList(attribute).values().map((ref) => ref.getChild());
  }
  /** @hidden */
  addRef(attribute, value, attributes) {
    const ref = this.graph._createEdge(attribute, this, value, attributes);
    this.assertRefList(attribute).add(ref);
    return this.dispatchEvent({
      type: "change",
      attribute
    });
  }
  /** @hidden */
  removeRef(attribute, value) {
    const refs = this.assertRefList(attribute);
    if (refs instanceof RefList) for (const ref of refs.listRefsByChild(value)) ref.dispose();
    else {
      const ref = refs.getRefByChild(value);
      if (ref) ref.dispose();
    }
    return this;
  }
  /** @hidden */
  assertRefList(attribute) {
    const refs = this[$attributes][attribute];
    if (refs instanceof RefList || refs instanceof RefSet) return refs;
    throw new Error(`Expected RefList or RefSet for attribute "${attribute}"`);
  }
  /**********************************************************************************************
  * RefMap: Named 1:many (map) graph node references.
  */
  /** @hidden */
  listRefMapKeys(attribute) {
    return this.assertRefMap(attribute).keys();
  }
  /** @hidden */
  listRefMapValues(attribute) {
    return this.assertRefMap(attribute).values().map((ref) => ref.getChild());
  }
  /** @hidden */
  getRefMap(attribute, key) {
    const ref = this.assertRefMap(attribute).get(key);
    return ref ? ref.getChild() : null;
  }
  /** @hidden */
  setRefMap(attribute, key, value, metadata) {
    const refMap = this.assertRefMap(attribute);
    const prevRef = refMap.get(key);
    if (prevRef) prevRef.dispose();
    if (!value) return this;
    metadata = Object.assign(metadata || {}, { key });
    const ref = this.graph._createEdge(attribute, this, value, {
      ...metadata,
      key
    });
    refMap.set(key, ref);
    return this.dispatchEvent({
      type: "change",
      attribute,
      key
    });
  }
  /** @hidden */
  assertRefMap(attribute) {
    const map = this[$attributes][attribute];
    if (map instanceof RefMap) return map;
    throw new Error(`Expected RefMap for attribute "${attribute}"`);
  }
  /**********************************************************************************************
  * Events.
  */
  /**
  * Dispatches an event on the GraphNode, and on the associated
  * Graph. Event types on the graph are prefixed, `"node:[type]"`.
  */
  dispatchEvent(event) {
    super.dispatchEvent({
      ...event,
      target: this
    });
    this.graph.dispatchEvent({
      ...event,
      target: this,
      type: `node:${event.type}`
    });
    return this;
  }
  /**********************************************************************************************
  * Internal.
  */
  /** @hidden */
  _destroyRef(ref) {
    const attribute = ref.getName();
    if (this[$attributes][attribute] === ref) {
      this[$attributes][attribute] = null;
      if (this[$immutableKeys].has(attribute)) ref.getChild().dispose();
    } else if (this[$attributes][attribute] instanceof RefList) this[$attributes][attribute].remove(ref);
    else if (this[$attributes][attribute] instanceof RefSet) this[$attributes][attribute].remove(ref);
    else if (this[$attributes][attribute] instanceof RefMap) {
      const refMap = this[$attributes][attribute];
      for (const key of refMap.keys()) if (refMap.get(key) === ref) refMap.delete(key);
    } else return;
    this.graph._destroyEdge(ref);
    this.dispatchEvent({
      type: "change",
      attribute
    });
  }
};

// packages/core/src/properties/property.ts
var COPY_IDENTITY = (t) => t;
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof GraphEdge) && !(value instanceof RefList) && !(value instanceof RefSet) && !(value instanceof RefMap) && !ArrayBuffer.isView(value) && !(value instanceof ArrayBuffer);
}
function isArray(value) {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}
function equalsRef(a, b) {
  if (a && b) return a.getChild().equals(b.getChild());
  return a === b;
}
function equalsRefSet(a, b) {
  if (!a || !b) return a === b;
  const aValues = [...a.values()];
  const bValues = [...b.values()];
  if (aValues.length !== bValues.length) return false;
  for (let i = 0; i < aValues.length; i++) {
    if (!aValues[i].getChild().equals(bValues[i].getChild())) return false;
  }
  return true;
}
function equalsRefMap(a, b) {
  if (!a || !b) return a === b;
  const aKeys = [...a.keys()];
  const bKeys = [...b.keys()];
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    const aRef = a.get(key);
    const bRef = b.get(key);
    if (!aRef || !bRef) return false;
    if (!aRef.getChild().equals(bRef.getChild())) return false;
  }
  return true;
}
function equalsObject(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
function equalsArray(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
var EMPTY_SET = /* @__PURE__ */ new Set();
var Property = class extends GraphNode {
  /** @hidden */
  constructor(graph, name = "") {
    super(graph);
    this[$attributes]["name"] = name;
    this.init();
    this.dispatchEvent({ type: "create" });
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), { name: "", extras: {} });
  }
  /** @hidden */
  set(attribute, value) {
    if (Array.isArray(value)) value = value.slice();
    return super.set(attribute, value);
  }
  getName() {
    return this.get("name");
  }
  setName(name) {
    return this.set("name", name);
  }
  getExtras() {
    return this.get("extras");
  }
  setExtras(extras) {
    return this.set("extras", extras);
  }
  clone() {
    const PropertyClass = this.constructor;
    return new PropertyClass(this.graph).copy(this, COPY_IDENTITY);
  }
  copy(other, resolve = COPY_IDENTITY) {
    for (const key in this[$attributes]) {
      const value = this[$attributes][key];
      if (value instanceof GraphEdge) {
        if (!this[$immutableKeys].has(key)) {
          value.dispose();
        }
      } else if (value instanceof RefList || value instanceof RefSet) {
        for (const ref of value.values()) {
          ref.dispose();
        }
      } else if (value instanceof RefMap) {
        for (const ref of value.values()) {
          ref.dispose();
        }
      }
    }
    for (const key in other[$attributes]) {
      const thisValue = this[$attributes][key];
      const otherValue = other[$attributes][key];
      if (otherValue instanceof GraphEdge) {
        if (this[$immutableKeys].has(key)) {
          const ref = thisValue;
          ref.getChild().copy(resolve(otherValue.getChild()), resolve);
        } else {
          this.setRef(key, resolve(otherValue.getChild()), otherValue.getAttributes());
        }
      } else if (otherValue instanceof RefSet || otherValue instanceof RefList) {
        for (const ref of otherValue.values()) {
          this.addRef(key, resolve(ref.getChild()), ref.getAttributes());
        }
      } else if (otherValue instanceof RefMap) {
        for (const subkey of otherValue.keys()) {
          const ref = otherValue.get(subkey);
          this.setRefMap(key, subkey, resolve(ref.getChild()), ref.getAttributes());
        }
      } else if (isPlainObject(otherValue)) {
        this[$attributes][key] = JSON.parse(JSON.stringify(otherValue));
      } else if (Array.isArray(otherValue) || otherValue instanceof ArrayBuffer || ArrayBuffer.isView(otherValue)) {
        this[$attributes][key] = otherValue.slice();
      } else {
        this[$attributes][key] = otherValue;
      }
    }
    return this;
  }
  equals(other, skip = EMPTY_SET) {
    if (this === other) return true;
    if (this.propertyType !== other.propertyType) return false;
    for (const key in this[$attributes]) {
      if (skip.has(key)) continue;
      const a = this[$attributes][key];
      const b = other[$attributes][key];
      if (a instanceof GraphEdge || b instanceof GraphEdge) {
        if (!equalsRef(a, b)) return false;
      } else if (a instanceof RefSet || b instanceof RefSet || a instanceof RefList || b instanceof RefList) {
        if (!equalsRefSet(a, b)) return false;
      } else if (a instanceof RefMap || b instanceof RefMap) {
        if (!equalsRefMap(a, b)) return false;
      } else if (isPlainObject(a) || isPlainObject(b)) {
        if (!equalsObject(a, b)) return false;
      } else if (isArray(a) || isArray(b)) {
        if (!equalsArray(a, b)) return false;
      } else {
        if (a !== b) return false;
      }
    }
    return true;
  }
  detach() {
    this.graph.disconnectParents(this, (n) => n.propertyType !== "Root");
    return this;
  }
  listParents() {
    return this.graph.listParents(this);
  }
};

// packages/core/src/properties/extensible-property.ts
var ExtensibleProperty = class extends Property {
  getDefaults() {
    return Object.assign(super.getDefaults(), { extensions: new RefMap() });
  }
  getExtension(name) {
    return this.getRefMap("extensions", name);
  }
  setExtension(name, extensionProperty) {
    return this.setRefMap("extensions", name, extensionProperty);
  }
  listExtensions() {
    return this.listRefMapValues("extensions");
  }
};

// packages/core/src/constants.ts
var VERSION = `v${import.meta.env?.PACKAGE_VERSION ?? "0.0.0-dev"}`;
var FGUI_MAGIC = 1179080009;
var NULL_STRING_INDEX = 65534;
var EMPTY_STRING_INDEX = 65533;

// packages/core/src/properties/root.ts
var Root = class extends ExtensibleProperty {
  _extensions = /* @__PURE__ */ new Set();
  init() {
    this.propertyType = "Root" /* ROOT */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      projectId: "",
      projectType: 0,
      version: VERSION,
      branches: [],
      settings: {},
      packages: new RefSet()
    });
  }
  /** @internal */
  constructor(graph) {
    super(graph);
    graph.addEventListener("node:create", (event) => {
      this._addChildOfRoot(event.target);
    });
  }
  clone() {
    throw new Error("Root cannot be cloned.");
  }
  copy(other, resolve = COPY_IDENTITY) {
    if (resolve === COPY_IDENTITY) throw new Error("Root cannot be copied.");
    this.set("projectId", other.get("projectId"));
    this.set("projectType", other.get("projectType"));
    this.set("version", other.get("version"));
    this.set("branches", other.get("branches"));
    this.set("settings", other.get("settings"));
    this.setName(other.getName());
    this.setExtras({ ...other.getExtras() });
    for (const extensionName of other.listRefMapKeys("extensions")) {
      const otherExtension = other.getExtension(extensionName);
      this.setExtension(extensionName, resolve(otherExtension));
    }
    return this;
  }
  _addChildOfRoot(child) {
    if (child.propertyType === "Package" /* PACKAGE */) {
      this.addRef("packages", child);
    }
    return this;
  }
  /****** Project metadata ******/
  getProjectId() {
    return this.get("projectId");
  }
  setProjectId(id) {
    return this.set("projectId", id);
  }
  getProjectType() {
    return this.get("projectType");
  }
  setProjectType(type) {
    return this.set("projectType", type);
  }
  getVersion() {
    return this.get("version");
  }
  setVersion(version) {
    return this.set("version", version);
  }
  listBranches() {
    return [...this.get("branches")];
  }
  setBranches(branches) {
    return this.set("branches", [...branches]);
  }
  addBranch(branch) {
    if (!branch) return this;
    const branches = this.listBranches();
    if (!branches.includes(branch)) branches.push(branch);
    return this.set("branches", branches);
  }
  getSettings() {
    return this.get("settings");
  }
  setSettings(settings) {
    return this.set("settings", settings);
  }
  /****** Extensions ******/
  listExtensionsUsed() {
    return Array.from(this._extensions);
  }
  listExtensionsRequired() {
    return this.listExtensionsUsed().filter((extension) => extension.isRequired());
  }
  /** @internal */
  _enableExtension(extension) {
    this._extensions.add(extension);
    return this;
  }
  /** @internal */
  _disableExtension(extension) {
    this._extensions.delete(extension);
    return this;
  }
  /****** Packages ******/
  listPackages() {
    return this.listRefs("packages");
  }
  getPackage(name) {
    return this.listPackages().find((p) => p.getName() === name) || null;
  }
  getPackageById(id) {
    return this.listPackages().find((p) => p.getId() === id) || null;
  }
};

// packages/core/src/properties/package.ts
var Package = class extends ExtensibleProperty {
  init() {
    this.propertyType = "Package" /* PACKAGE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      compressPNG: null,
      jpegQuality: null,
      publishName: "",
      publishPath: "",
      publishBranchPath: "",
      publishPackageCount: 0,
      genCode: false,
      codePath: "",
      resources: new RefSet(),
      atlases: new RefSet(),
      dependencies: new RefSet()
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getCompressPNG() {
    return this.get("compressPNG");
  }
  setCompressPNG(value) {
    return this.set("compressPNG", value);
  }
  getJpegQuality() {
    return this.get("jpegQuality");
  }
  setJpegQuality(value) {
    return this.set("jpegQuality", value);
  }
  getPublishName() {
    return this.get("publishName");
  }
  setPublishName(name) {
    return this.set("publishName", name);
  }
  getPublishPath() {
    return this.get("publishPath");
  }
  setPublishPath(path3) {
    return this.set("publishPath", path3);
  }
  getPublishBranchPath() {
    return this.get("publishBranchPath");
  }
  setPublishBranchPath(path3) {
    return this.set("publishBranchPath", path3);
  }
  getPublishPackageCount() {
    return this.get("publishPackageCount");
  }
  setPublishPackageCount(count) {
    return this.set("publishPackageCount", count);
  }
  getGenCode() {
    return this.get("genCode");
  }
  setGenCode(value) {
    return this.set("genCode", value);
  }
  getCodePath() {
    return this.get("codePath");
  }
  setCodePath(path3) {
    return this.set("codePath", path3);
  }
  addResource(resource) {
    return this.addRef("resources", resource);
  }
  removeResource(resource) {
    return this.removeRef("resources", resource);
  }
  listResources() {
    return this.listRefs("resources");
  }
  getResourceById(id) {
    return this.listResources().find((resource) => resource.getId?.() === id) ?? null;
  }
  listComponents() {
    return this.listResources().filter((r) => r.propertyType === "Component" /* COMPONENT */);
  }
  listImageResources() {
    return this.listResources().filter((r) => r.propertyType === "ImageResource" /* IMAGE_RESOURCE */);
  }
  getComponent(name) {
    return this.listComponents().find((c) => c.getName() === name) || null;
  }
  addAtlas(atlas2) {
    return this.addRef("atlases", atlas2);
  }
  removeAtlas(atlas2) {
    return this.removeRef("atlases", atlas2);
  }
  listAtlases() {
    return this.listRefs("atlases");
  }
  addDependency(dep) {
    return this.addRef("dependencies", dep);
  }
  removeDependency(dep) {
    return this.removeRef("dependencies", dep);
  }
  listDependencies() {
    return this.listRefs("dependencies");
  }
};

// packages/core/src/properties/image-resource.ts
var ImageResource = class extends ExtensibleProperty {
  init() {
    this.propertyType = "ImageResource" /* IMAGE_RESOURCE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      fileName: "",
      path: "",
      branch: "",
      branchItemIds: [],
      width: 0,
      height: 0,
      exported: false,
      textureSetMode: "",
      qualityOption: "",
      smoothing: true,
      duplicatePadding: false,
      scaleOption: 0,
      scale9Grid: null,
      tileGridIndice: 0,
      imageData: null,
      pixelHitTestPixelWidth: 0,
      pixelHitTestScaleDenominator: 1,
      pixelHitTestPixels: null
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getFileName() {
    return this.get("fileName");
  }
  setFileName(fileName) {
    return this.set("fileName", fileName);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getWidth() {
    return this.get("width");
  }
  setWidth(w) {
    return this.set("width", w);
  }
  getHeight() {
    return this.get("height");
  }
  setHeight(h) {
    return this.set("height", h);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getTextureSetMode() {
    return this.get("textureSetMode");
  }
  setTextureSetMode(v) {
    return this.set("textureSetMode", v);
  }
  getQualityOption() {
    return this.get("qualityOption");
  }
  setQualityOption(v) {
    return this.set("qualityOption", v);
  }
  getSmoothing() {
    return this.get("smoothing");
  }
  setSmoothing(v) {
    return this.set("smoothing", v);
  }
  getDuplicatePadding() {
    return this.get("duplicatePadding");
  }
  setDuplicatePadding(v) {
    return this.set("duplicatePadding", v);
  }
  getScaleOption() {
    return this.get("scaleOption");
  }
  setScaleOption(v) {
    return this.set("scaleOption", v);
  }
  getScale9Grid() {
    return this.get("scale9Grid");
  }
  setScale9Grid(v) {
    return this.set("scale9Grid", v);
  }
  getTileGridIndice() {
    return this.get("tileGridIndice");
  }
  setTileGridIndice(v) {
    return this.set("tileGridIndice", v);
  }
  getImageData() {
    return this.getRef("imageData");
  }
  setImageData(buffer) {
    return this.setRef("imageData", buffer);
  }
  getPixelHitTestData() {
    const pixelWidth = this.get("pixelHitTestPixelWidth");
    const scaleDenominator = this.get("pixelHitTestScaleDenominator");
    const pixels = this.get("pixelHitTestPixels");
    if (pixelWidth <= 0 || scaleDenominator <= 0 || !(pixels instanceof Uint8Array)) return null;
    return {
      pixelWidth,
      scaleDenominator,
      pixels
    };
  }
  setPixelHitTestData(data) {
    if (!data) {
      this.set("pixelHitTestPixelWidth", 0);
      this.set("pixelHitTestScaleDenominator", 1);
      return this.set("pixelHitTestPixels", null);
    }
    this.set("pixelHitTestPixelWidth", data.pixelWidth);
    this.set("pixelHitTestScaleDenominator", data.scaleDenominator);
    return this.set("pixelHitTestPixels", data.pixels);
  }
};

// packages/core/src/properties/misc-resource.ts
var MiscResource = class extends ExtensibleProperty {
  init() {
    this.propertyType = "MiscResource" /* MISC_RESOURCE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      path: "",
      branch: "",
      branchItemIds: [],
      file: "",
      exported: false,
      resourceData: null
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getFile() {
    return this.get("file");
  }
  setFile(file) {
    return this.set("file", file);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getResourceData() {
    return this.getRef("resourceData");
  }
  setResourceData(buffer) {
    return this.setRef("resourceData", buffer);
  }
};

// packages/core/src/properties/sound-resource.ts
var SoundResource = class extends ExtensibleProperty {
  init() {
    this.propertyType = "SoundResource" /* SOUND_RESOURCE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      path: "",
      branch: "",
      branchItemIds: [],
      file: "",
      exported: false,
      soundData: null
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getFile() {
    return this.get("file");
  }
  setFile(file) {
    return this.set("file", file);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getSoundData() {
    return this.getRef("soundData");
  }
  setSoundData(buffer) {
    return this.setRef("soundData", buffer);
  }
};

// packages/core/src/properties/font-resource.ts
var FontResource = class extends ExtensibleProperty {
  init() {
    this.propertyType = "FontResource" /* FONT_RESOURCE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      path: "",
      branch: "",
      branchItemIds: [],
      fileName: "",
      textureId: "",
      exported: false,
      renderMode: "",
      samplePointSize: 0,
      ttf: false,
      tint: false,
      autoScale: false,
      hasChannel: false,
      fontSize: 0,
      xAdvance: 0,
      lineHeight: 0,
      glyphs: new RefList()
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getFileName() {
    return this.get("fileName");
  }
  setFileName(fileName) {
    return this.set("fileName", fileName);
  }
  getTextureId() {
    return this.get("textureId");
  }
  setTextureId(textureId) {
    return this.set("textureId", textureId);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getRenderMode() {
    return this.get("renderMode");
  }
  setRenderMode(v) {
    return this.set("renderMode", v);
  }
  getSamplePointSize() {
    return this.get("samplePointSize");
  }
  setSamplePointSize(v) {
    return this.set("samplePointSize", v);
  }
  getTtf() {
    return this.get("ttf");
  }
  setTtf(v) {
    return this.set("ttf", v);
  }
  getTint() {
    return this.get("tint");
  }
  setTint(v) {
    return this.set("tint", v);
  }
  getAutoScale() {
    return this.get("autoScale");
  }
  setAutoScale(v) {
    return this.set("autoScale", v);
  }
  getHasChannel() {
    return this.get("hasChannel");
  }
  setHasChannel(v) {
    return this.set("hasChannel", v);
  }
  getFontSize() {
    return this.get("fontSize");
  }
  setFontSize(v) {
    return this.set("fontSize", v);
  }
  getXAdvance() {
    return this.get("xAdvance");
  }
  setXAdvance(v) {
    return this.set("xAdvance", v);
  }
  getLineHeight() {
    return this.get("lineHeight");
  }
  setLineHeight(v) {
    return this.set("lineHeight", v);
  }
  addGlyph(glyph) {
    return this.addRef("glyphs", glyph);
  }
  removeGlyph(glyph) {
    return this.removeRef("glyphs", glyph);
  }
  listGlyphs() {
    return this.listRefs("glyphs");
  }
};

// packages/core/src/properties/movie-clip-resource.ts
var MovieClipResource = class extends ExtensibleProperty {
  init() {
    this.propertyType = "MovieClipResource" /* MOVIE_CLIP_RESOURCE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      path: "",
      branch: "",
      branchItemIds: [],
      fileName: "",
      exported: false,
      width: 0,
      height: 0,
      interval: 0,
      swing: false,
      repeatDelay: 0,
      smoothing: true,
      frames: new RefList()
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getFileName() {
    return this.get("fileName");
  }
  setFileName(fileName) {
    return this.set("fileName", fileName);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getWidth() {
    return this.get("width");
  }
  setWidth(v) {
    return this.set("width", v);
  }
  getHeight() {
    return this.get("height");
  }
  setHeight(v) {
    return this.set("height", v);
  }
  getInterval() {
    return this.get("interval");
  }
  setInterval(v) {
    return this.set("interval", v);
  }
  getSwing() {
    return this.get("swing");
  }
  setSwing(v) {
    return this.set("swing", v);
  }
  getRepeatDelay() {
    return this.get("repeatDelay");
  }
  setRepeatDelay(v) {
    return this.set("repeatDelay", v);
  }
  getSmoothing() {
    return this.get("smoothing");
  }
  setSmoothing(v) {
    return this.set("smoothing", v);
  }
  addFrame(frame) {
    return this.addRef("frames", frame);
  }
  removeFrame(frame) {
    return this.removeRef("frames", frame);
  }
  listFrames() {
    return this.listRefs("frames");
  }
};

// packages/core/src/properties/skeleton-resource-base.ts
var SkeletonResourceBase = class extends ExtensibleProperty {
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      path: "",
      branch: "",
      branchItemIds: [],
      file: "",
      exported: false,
      width: 0,
      height: 0,
      requireIds: [],
      atlasNames: [],
      anchorX: 0,
      anchorY: 0
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getFile() {
    return this.get("file");
  }
  setFile(file) {
    return this.set("file", file);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getWidth() {
    return this.get("width");
  }
  setWidth(v) {
    return this.set("width", v);
  }
  getHeight() {
    return this.get("height");
  }
  setHeight(v) {
    return this.set("height", v);
  }
  getRequireIds() {
    return [...this.get("requireIds")];
  }
  setRequireIds(ids) {
    return this.set("requireIds", [...ids]);
  }
  getAtlasNames() {
    return [...this.get("atlasNames")];
  }
  setAtlasNames(names) {
    return this.set("atlasNames", [...names]);
  }
  getAnchorX() {
    return this.get("anchorX");
  }
  setAnchorX(v) {
    return this.set("anchorX", v);
  }
  getAnchorY() {
    return this.get("anchorY");
  }
  setAnchorY(v) {
    return this.set("anchorY", v);
  }
  setAnchor(x, y) {
    this.setAnchorX(x);
    return this.setAnchorY(y);
  }
};

// packages/core/src/properties/spine-resource.ts
var SpineResource = class extends SkeletonResourceBase {
  init() {
    this.propertyType = "SpineResource" /* SPINE_RESOURCE */;
  }
};

// packages/core/src/properties/dragon-bones-resource.ts
var DragonBonesResource = class extends SkeletonResourceBase {
  init() {
    this.propertyType = "DragonBonesResource" /* DRAGON_BONES_RESOURCE */;
  }
};

// packages/core/src/properties/component.ts
var Component = class extends ExtensibleProperty {
  init() {
    this.propertyType = "Component" /* COMPONENT */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      path: "",
      branch: "",
      branchItemIds: [],
      exported: false,
      width: 0,
      height: 0,
      minWidth: 0,
      maxWidth: 0,
      minHeight: 0,
      maxHeight: 0,
      pivotX: 0,
      pivotY: 0,
      pivotAsAnchor: false,
      extType: 9 /* Component */,
      overflow: 0 /* Visible */,
      margin: [0, 0, 0, 0],
      clipSoftness: [0, 0],
      hitTest: "",
      customData: "",
      mask: "",
      reversedMask: false,
      scrollType: 1,
      scrollBarDisplay: 0,
      scrollBarFlags: 0,
      scrollBarMargin: [0, 0, 0, 0],
      vtScrollBarRes: "",
      hzScrollBarRes: "",
      headerRes: "",
      footerRes: "",
      bgColor: "",
      bgColorEnabled: false,
      designImageAlpha: 0,
      designImageLayer: 0,
      designImageOffsetX: 0,
      designImageOffsetY: 0,
      idNum: 0,
      initName: "",
      remark: "",
      extensionType: "",
      buttonMode: 0,
      sound: "",
      soundVolumeScale: 1,
      addedToStageSound: "",
      removedFromStageSound: "",
      downEffect: 0,
      downEffectValue: 0.8,
      dropdown: "",
      promptText: "",
      selectionController: "",
      titleType: 0,
      reverse: false,
      wholeNumbers: false,
      changeOnClick: true,
      fixedGripSize: false,
      opaque: true,
      childrenRenderOrder: 0 /* Ascent */,
      apexIndex: 0,
      relations: [],
      displayList: new RefList(),
      controllers: new RefList(),
      transitions: new RefList()
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
  getPath() {
    return this.get("path");
  }
  setPath(path3) {
    return this.set("path", path3);
  }
  getBranch() {
    return this.get("branch");
  }
  setBranch(branch) {
    return this.set("branch", branch);
  }
  getBranchItemIds() {
    return [...this.get("branchItemIds")];
  }
  setBranchItemIds(ids) {
    return this.set("branchItemIds", [...ids]);
  }
  getExported() {
    return this.get("exported");
  }
  setExported(v) {
    return this.set("exported", v);
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  getMinWidth() {
    return this.get("minWidth");
  }
  setMinWidth(v) {
    return this.set("minWidth", v);
  }
  getMaxWidth() {
    return this.get("maxWidth");
  }
  setMaxWidth(v) {
    return this.set("maxWidth", v);
  }
  getMinHeight() {
    return this.get("minHeight");
  }
  setMinHeight(v) {
    return this.set("minHeight", v);
  }
  getMaxHeight() {
    return this.get("maxHeight");
  }
  setMaxHeight(v) {
    return this.set("maxHeight", v);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  getPivotX() {
    return this.get("pivotX");
  }
  setPivotX(v) {
    return this.set("pivotX", v);
  }
  getPivotY() {
    return this.get("pivotY");
  }
  setPivotY(v) {
    return this.set("pivotY", v);
  }
  getPivotAsAnchor() {
    return this.get("pivotAsAnchor");
  }
  setPivotAsAnchor(v) {
    return this.set("pivotAsAnchor", v);
  }
  getExtType() {
    return this.get("extType");
  }
  setExtType(v) {
    return this.set("extType", v);
  }
  getOverflow() {
    return this.get("overflow");
  }
  setOverflow(v) {
    return this.set("overflow", v);
  }
  getMargin() {
    const margin = this.get("margin");
    return {
      top: margin[0] ?? 0,
      bottom: margin[1] ?? 0,
      left: margin[2] ?? 0,
      right: margin[3] ?? 0
    };
  }
  setMargin(v) {
    if (Array.isArray(v)) {
      return this.set("margin", [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0]);
    }
    return this.set("margin", [v.top ?? 0, v.bottom ?? 0, v.left ?? 0, v.right ?? 0]);
  }
  getClipSoftness() {
    const clipSoftness = this.get("clipSoftness");
    return {
      x: clipSoftness[0] ?? 0,
      y: clipSoftness[1] ?? 0
    };
  }
  setClipSoftness(v) {
    if (Array.isArray(v)) {
      return this.set("clipSoftness", [v[0] ?? 0, v[1] ?? 0]);
    }
    return this.set("clipSoftness", [v.x ?? 0, v.y ?? 0]);
  }
  getHitTest() {
    return this.get("hitTest");
  }
  setHitTest(v) {
    return this.set("hitTest", v);
  }
  getCustomData() {
    return this.get("customData");
  }
  setCustomData(v) {
    return this.set("customData", v);
  }
  getMask() {
    return this.get("mask");
  }
  setMask(v) {
    return this.set("mask", v);
  }
  getReversedMask() {
    return this.get("reversedMask");
  }
  setReversedMask(v) {
    return this.set("reversedMask", v);
  }
  getScrollType() {
    return this.get("scrollType");
  }
  setScrollType(v) {
    return this.set("scrollType", v);
  }
  getScrollBarDisplay() {
    return this.get("scrollBarDisplay");
  }
  setScrollBarDisplay(v) {
    return this.set("scrollBarDisplay", v);
  }
  getScrollBarFlags() {
    return this.get("scrollBarFlags");
  }
  setScrollBarFlags(v) {
    return this.set("scrollBarFlags", v);
  }
  getScrollBarMargin() {
    const margin = this.get("scrollBarMargin");
    return {
      top: margin[0] ?? 0,
      bottom: margin[1] ?? 0,
      left: margin[2] ?? 0,
      right: margin[3] ?? 0
    };
  }
  setScrollBarMargin(v) {
    if (Array.isArray(v)) {
      return this.set("scrollBarMargin", [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0]);
    }
    return this.set("scrollBarMargin", [v.top ?? 0, v.bottom ?? 0, v.left ?? 0, v.right ?? 0]);
  }
  getVtScrollBarRes() {
    return this.get("vtScrollBarRes");
  }
  setVtScrollBarRes(v) {
    return this.set("vtScrollBarRes", v);
  }
  getHzScrollBarRes() {
    return this.get("hzScrollBarRes");
  }
  setHzScrollBarRes(v) {
    return this.set("hzScrollBarRes", v);
  }
  getHeaderRes() {
    return this.get("headerRes");
  }
  setHeaderRes(v) {
    return this.set("headerRes", v);
  }
  getFooterRes() {
    return this.get("footerRes");
  }
  setFooterRes(v) {
    return this.set("footerRes", v);
  }
  getBgColor() {
    return this.get("bgColor");
  }
  setBgColor(v) {
    return this.set("bgColor", v);
  }
  getBgColorEnabled() {
    return this.get("bgColorEnabled");
  }
  setBgColorEnabled(v) {
    return this.set("bgColorEnabled", v);
  }
  getDesignImageAlpha() {
    return this.get("designImageAlpha");
  }
  setDesignImageAlpha(v) {
    return this.set("designImageAlpha", v);
  }
  getDesignImageLayer() {
    return this.get("designImageLayer");
  }
  setDesignImageLayer(v) {
    return this.set("designImageLayer", v);
  }
  getDesignImageOffsetX() {
    return this.get("designImageOffsetX");
  }
  setDesignImageOffsetX(v) {
    return this.set("designImageOffsetX", v);
  }
  getDesignImageOffsetY() {
    return this.get("designImageOffsetY");
  }
  setDesignImageOffsetY(v) {
    return this.set("designImageOffsetY", v);
  }
  getIdNum() {
    return this.get("idNum");
  }
  setIdNum(v) {
    return this.set("idNum", v);
  }
  getInitName() {
    return this.get("initName");
  }
  setInitName(v) {
    return this.set("initName", v);
  }
  getRemark() {
    return this.get("remark");
  }
  setRemark(v) {
    return this.set("remark", v);
  }
  getExtensionType() {
    return this.get("extensionType");
  }
  setExtensionType(v) {
    return this.set("extensionType", v);
  }
  getButtonMode() {
    return this.get("buttonMode");
  }
  setButtonMode(v) {
    return this.set("buttonMode", v);
  }
  getSound() {
    return this.get("sound");
  }
  setSound(v) {
    return this.set("sound", v);
  }
  getSoundVolumeScale() {
    return this.get("soundVolumeScale");
  }
  setSoundVolumeScale(v) {
    return this.set("soundVolumeScale", v);
  }
  getAddedToStageSound() {
    return this.get("addedToStageSound");
  }
  setAddedToStageSound(v) {
    return this.set("addedToStageSound", v);
  }
  getRemovedFromStageSound() {
    return this.get("removedFromStageSound");
  }
  setRemovedFromStageSound(v) {
    return this.set("removedFromStageSound", v);
  }
  getDownEffect() {
    return this.get("downEffect");
  }
  setDownEffect(v) {
    return this.set("downEffect", v);
  }
  getDownEffectValue() {
    return this.get("downEffectValue");
  }
  setDownEffectValue(v) {
    return this.set("downEffectValue", v);
  }
  getDropdown() {
    return this.get("dropdown");
  }
  setDropdown(v) {
    return this.set("dropdown", v);
  }
  getPromptText() {
    return this.get("promptText");
  }
  setPromptText(v) {
    return this.set("promptText", v);
  }
  getSelectionController() {
    return this.get("selectionController");
  }
  setSelectionController(v) {
    return this.set("selectionController", v);
  }
  getTitleType() {
    return this.get("titleType");
  }
  setTitleType(v) {
    return this.set("titleType", v);
  }
  getReverse() {
    return this.get("reverse");
  }
  setReverse(v) {
    return this.set("reverse", v);
  }
  getWholeNumbers() {
    return this.get("wholeNumbers");
  }
  setWholeNumbers(v) {
    return this.set("wholeNumbers", v);
  }
  getChangeOnClick() {
    return this.get("changeOnClick");
  }
  setChangeOnClick(v) {
    return this.set("changeOnClick", v);
  }
  getFixedGripSize() {
    return this.get("fixedGripSize");
  }
  setFixedGripSize(v) {
    return this.set("fixedGripSize", v);
  }
  getOpaque() {
    return this.get("opaque");
  }
  setOpaque(v) {
    return this.set("opaque", v);
  }
  getChildrenRenderOrder() {
    return this.get("childrenRenderOrder");
  }
  setChildrenRenderOrder(v) {
    return this.set("childrenRenderOrder", v);
  }
  /****** Relations ******/
  getRelations() {
    return this.get("relations");
  }
  setRelations(relations) {
    return this.set("relations", relations);
  }
  addRelation(relation) {
    const relations = [...this.getRelations(), relation];
    return this.set("relations", relations);
  }
  /****** Display List ******/
  addChild(child) {
    return this.addRef("displayList", child);
  }
  removeChild(child) {
    return this.removeRef("displayList", child);
  }
  listChildren() {
    return this.listRefs("displayList");
  }
  getChild(name) {
    return this.listChildren().find((child) => child.getName() === name) || null;
  }
  getChildById(id) {
    return this.listChildren().find((child) => child.getId() === id) || null;
  }
  /****** Controllers ******/
  addController(ctrl) {
    return this.addRef("controllers", ctrl);
  }
  removeController(ctrl) {
    return this.removeRef("controllers", ctrl);
  }
  listControllers() {
    return this.listRefs("controllers");
  }
  getController(name) {
    return this.listControllers().find((c) => c.getName() === name) || null;
  }
  /****** Transitions ******/
  addTransition(trans) {
    return this.addRef("transitions", trans);
  }
  removeTransition(trans) {
    return this.removeRef("transitions", trans);
  }
  listTransitions() {
    return this.listRefs("transitions");
  }
  getTransition(name) {
    return this.listTransitions().find((t) => t.getName() === name) || null;
  }
};

// packages/core/src/properties/atlas.ts
var Atlas = class extends ExtensibleProperty {
  init() {
    this.propertyType = "Atlas" /* ATLAS */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      index: 0,
      file: "",
      width: 0,
      height: 0,
      sprites: new RefSet()
    });
  }
  getIndex() {
    return this.get("index");
  }
  setIndex(v) {
    return this.set("index", v);
  }
  getFile() {
    return this.get("file");
  }
  setFile(v) {
    return this.set("file", v);
  }
  getWidth() {
    return this.get("width");
  }
  setWidth(v) {
    return this.set("width", v);
  }
  getHeight() {
    return this.get("height");
  }
  setHeight(v) {
    return this.set("height", v);
  }
  addSprite(sprite) {
    return this.addRef("sprites", sprite);
  }
  removeSprite(sprite) {
    return this.removeRef("sprites", sprite);
  }
  listSprites() {
    return this.listRefs("sprites");
  }
};

// packages/core/src/properties/sprite.ts
var Sprite = class extends ExtensibleProperty {
  init() {
    this.propertyType = "Sprite" /* SPRITE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      itemId: "",
      atlas: null,
      rectX: 0,
      rectY: 0,
      rectWidth: 0,
      rectHeight: 0,
      rotated: false,
      offsetX: 0,
      offsetY: 0,
      originalWidth: 0,
      originalHeight: 0
    });
  }
  getItemId() {
    return this.get("itemId");
  }
  setItemId(v) {
    return this.set("itemId", v);
  }
  getAtlas() {
    return this.getRef("atlas");
  }
  setAtlas(atlas2) {
    return this.setRef("atlas", atlas2);
  }
  getRectX() {
    return this.get("rectX");
  }
  setRectX(v) {
    return this.set("rectX", v);
  }
  getRectY() {
    return this.get("rectY");
  }
  setRectY(v) {
    return this.set("rectY", v);
  }
  getRectWidth() {
    return this.get("rectWidth");
  }
  setRectWidth(v) {
    return this.set("rectWidth", v);
  }
  getRectHeight() {
    return this.get("rectHeight");
  }
  setRectHeight(v) {
    return this.set("rectHeight", v);
  }
  getRotated() {
    return this.get("rotated");
  }
  setRotated(v) {
    return this.set("rotated", v);
  }
  getOffsetX() {
    return this.get("offsetX");
  }
  setOffsetX(v) {
    return this.set("offsetX", v);
  }
  getOffsetY() {
    return this.get("offsetY");
  }
  setOffsetY(v) {
    return this.set("offsetY", v);
  }
  getOriginalWidth() {
    return this.get("originalWidth");
  }
  setOriginalWidth(v) {
    return this.set("originalWidth", v);
  }
  getOriginalHeight() {
    return this.get("originalHeight");
  }
  setOriginalHeight(v) {
    return this.set("originalHeight", v);
  }
};

// packages/core/src/properties/buffer.ts
var FairyBuffer = class extends Property {
  init() {
    this.propertyType = "Buffer" /* BUFFER */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      uri: "",
      mimeType: "",
      data: null
    });
  }
  getURI() {
    return this.get("uri");
  }
  setURI(uri) {
    return this.set("uri", uri);
  }
  getMimeType() {
    return this.get("mimeType");
  }
  setMimeType(mimeType) {
    return this.set("mimeType", mimeType);
  }
  getData() {
    return this.get("data");
  }
  setData(data) {
    return this.set("data", data);
  }
};

// packages/core/src/properties/font-glyph.ts
var FontGlyph = class extends Property {
  init() {
    this.propertyType = "FontGlyph" /* FONT_GLYPH */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      charId: 0,
      char: "",
      x: 0,
      y: 0,
      xOffset: 0,
      yOffset: 0,
      width: 0,
      height: 0,
      advance: 0,
      lineHeight: 0,
      channel: 0,
      img: ""
    });
  }
  getCharId() {
    return this.get("charId");
  }
  setCharId(v) {
    return this.set("charId", v);
  }
  getChar() {
    return this.get("char");
  }
  setChar(v) {
    return this.set("char", v);
  }
  getX() {
    return this.get("x");
  }
  setX(v) {
    return this.set("x", v);
  }
  getY() {
    return this.get("y");
  }
  setY(v) {
    return this.set("y", v);
  }
  getXOffset() {
    return this.get("xOffset");
  }
  setXOffset(v) {
    return this.set("xOffset", v);
  }
  getYOffset() {
    return this.get("yOffset");
  }
  setYOffset(v) {
    return this.set("yOffset", v);
  }
  getWidth() {
    return this.get("width");
  }
  setWidth(v) {
    return this.set("width", v);
  }
  getHeight() {
    return this.get("height");
  }
  setHeight(v) {
    return this.set("height", v);
  }
  getAdvance() {
    return this.get("advance");
  }
  setAdvance(v) {
    return this.set("advance", v);
  }
  getLineHeight() {
    return this.get("lineHeight");
  }
  setLineHeight(v) {
    return this.set("lineHeight", v);
  }
  getChannel() {
    return this.get("channel");
  }
  setChannel(v) {
    return this.set("channel", v);
  }
  getImg() {
    return this.get("img");
  }
  setImg(v) {
    return this.set("img", v);
  }
};

// packages/core/src/properties/movie-frame.ts
var MovieFrame = class extends Property {
  init() {
    this.propertyType = "MovieFrame" /* MOVIE_FRAME */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      rectX: 0,
      rectY: 0,
      rectWidth: 0,
      rectHeight: 0,
      addDelay: 0,
      spriteId: ""
    });
  }
  getRectX() {
    return this.get("rectX");
  }
  setRectX(v) {
    return this.set("rectX", v);
  }
  getRectY() {
    return this.get("rectY");
  }
  setRectY(v) {
    return this.set("rectY", v);
  }
  getRectWidth() {
    return this.get("rectWidth");
  }
  setRectWidth(v) {
    return this.set("rectWidth", v);
  }
  getRectHeight() {
    return this.get("rectHeight");
  }
  setRectHeight(v) {
    return this.set("rectHeight", v);
  }
  getAddDelay() {
    return this.get("addDelay");
  }
  setAddDelay(v) {
    return this.set("addDelay", v);
  }
  getSpriteId() {
    return this.get("spriteId");
  }
  setSpriteId(v) {
    return this.set("spriteId", v);
  }
};

// packages/core/src/properties/g-object.ts
var GObject = class extends ExtensibleProperty {
  init() {
    this.propertyType = "GObject" /* G_OBJECT */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: "",
      sourceWidth: 0,
      sourceHeight: 0,
      initWidth: 0,
      initHeight: 0,
      relations: [],
      gears: new RefList()
    });
  }
  getObjectProp(key) {
    const self = this;
    return self.get(key);
  }
  setObjectProp(key, value) {
    const self = this;
    return self.set(key, value);
  }
  getId() {
    return this.getObjectProp("id");
  }
  setId(id) {
    return this.setObjectProp("id", id);
  }
  getSourceWidth() {
    return this.getObjectProp("sourceWidth");
  }
  setSourceWidth(v) {
    return this.setObjectProp("sourceWidth", v);
  }
  getSourceHeight() {
    return this.getObjectProp("sourceHeight");
  }
  setSourceHeight(v) {
    return this.setObjectProp("sourceHeight", v);
  }
  getInitWidth() {
    return this.getObjectProp("initWidth");
  }
  setInitWidth(v) {
    return this.setObjectProp("initWidth", v);
  }
  getInitHeight() {
    return this.getObjectProp("initHeight");
  }
  setInitHeight(v) {
    return this.setObjectProp("initHeight", v);
  }
  /****** Relations ******/
  getRelations() {
    return this.getObjectProp("relations");
  }
  setRelations(relations) {
    return this.setObjectProp("relations", relations);
  }
  addRelation(relation) {
    const relations = [...this.getRelations(), relation];
    return this.setObjectProp("relations", relations);
  }
  /****** Gears ******/
  addGear(gear) {
    return this.addRef("gears", gear);
  }
  removeGear(gear) {
    return this.removeRef("gears", gear);
  }
  listGears() {
    return this.listRefs("gears");
  }
};

// packages/core/src/properties/g-image.ts
var GImage = class extends GObject {
  init() {
    this.propertyType = "GImage" /* G_IMAGE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      src: "",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      locked: false,
      aspect: false,
      pivotX: 0,
      pivotY: 0,
      anchor: false,
      scaleX: 1,
      scaleY: 1,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      skewX: 0,
      skewY: 0,
      tooltips: "",
      customData: "",
      fileName: "",
      packageId: "",
      filter: "",
      filterData: "",
      flip: 0 /* None */,
      color: "#FFFFFF",
      fillMethod: 0 /* None */,
      fillOrigin: 0 /* Top */,
      fillClockwise: true,
      fillAmount: 100
    });
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
  getX() {
    return this.get("x");
  }
  getY() {
    return this.get("y");
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  getLocked() {
    return this.get("locked");
  }
  setXY(x, y) {
    this.set("x", x);
    return this.set("y", y);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  setLocked(v) {
    return this.set("locked", v);
  }
  setX(v) {
    return this.set("x", v);
  }
  setY(v) {
    return this.set("y", v);
  }
  getAspect() {
    return this.get("aspect");
  }
  setAspect(v) {
    return this.set("aspect", v);
  }
  getPivotX() {
    return this.get("pivotX");
  }
  getPivotY() {
    return this.get("pivotY");
  }
  getPivotAsAnchor() {
    return this.get("anchor");
  }
  setPivot(x, y, anchor = false) {
    this.set("pivotX", x);
    this.set("pivotY", y);
    return this.set("anchor", anchor);
  }
  setPivotAsAnchor(v) {
    return this.set("anchor", v);
  }
  getScaleX() {
    return this.get("scaleX");
  }
  getScaleY() {
    return this.get("scaleY");
  }
  setScale(x, y) {
    this.set("scaleX", x);
    return this.set("scaleY", y);
  }
  getGroup() {
    return this.get("group");
  }
  setGroup(v) {
    return this.set("group", v);
  }
  getAlpha() {
    return this.get("alpha");
  }
  setAlpha(v) {
    return this.set("alpha", v);
  }
  getRotation() {
    return this.get("rotation");
  }
  setRotation(v) {
    return this.set("rotation", v);
  }
  getVisible() {
    return this.get("visible");
  }
  setVisible(v) {
    return this.set("visible", v);
  }
  getTouchable() {
    return this.get("touchable");
  }
  setTouchable(v) {
    return this.set("touchable", v);
  }
  getGrayed() {
    return this.get("grayed");
  }
  setGrayed(v) {
    return this.set("grayed", v);
  }
  getSkewX() {
    return this.get("skewX");
  }
  getSkewY() {
    return this.get("skewY");
  }
  setSkew(x, y) {
    this.set("skewX", x);
    return this.set("skewY", y);
  }
  getTooltips() {
    return this.get("tooltips");
  }
  setTooltips(v) {
    return this.set("tooltips", v);
  }
  getCustomData() {
    return this.get("customData");
  }
  setCustomData(v) {
    return this.set("customData", v);
  }
  getFileName() {
    return this.get("fileName");
  }
  setFileName(v) {
    return this.set("fileName", v);
  }
  getPackageId() {
    return this.get("packageId");
  }
  setPackageId(v) {
    return this.set("packageId", v);
  }
  getFilter() {
    return this.get("filter");
  }
  setFilter(v) {
    return this.set("filter", v);
  }
  getFilterData() {
    return this.get("filterData");
  }
  setFilterData(v) {
    return this.set("filterData", v);
  }
  getFlip() {
    return this.get("flip");
  }
  setFlip(v) {
    return this.set("flip", v);
  }
  getColor() {
    return this.get("color");
  }
  setColor(v) {
    return this.set("color", v);
  }
  getFillMethod() {
    return this.get("fillMethod");
  }
  setFillMethod(v) {
    return this.set("fillMethod", v);
  }
  getFillOrigin() {
    return this.get("fillOrigin");
  }
  setFillOrigin(v) {
    return this.set("fillOrigin", v);
  }
  getFillClockwise() {
    return this.get("fillClockwise");
  }
  setFillClockwise(v) {
    return this.set("fillClockwise", v);
  }
  getFillAmount() {
    return this.get("fillAmount");
  }
  setFillAmount(v) {
    return this.set("fillAmount", v);
  }
};

// packages/core/src/properties/g-text-field.ts
var GTextField = class extends GObject {
  init() {
    this.propertyType = "GTextField" /* G_TEXT_FIELD */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      minWidth: 0,
      maxWidth: 0,
      minHeight: 0,
      maxHeight: 0,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      tooltips: "",
      customData: "",
      pivotX: 0,
      pivotY: 0,
      anchor: false,
      scaleX: 1,
      scaleY: 1,
      skewX: 0,
      skewY: 0,
      text: "",
      font: "",
      fontSize: 12,
      color: "#000000",
      align: 0 /* Left */,
      vAlign: 0 /* Top */,
      leading: 3,
      letterSpacing: 0,
      autoSize: 1 /* Both */,
      singleLine: false,
      autoClearText: false,
      demoText: "",
      templateVarsEnabled: false,
      faceDilate: 0,
      underlaySoftness: 0,
      ubbEnabled: false,
      underline: false,
      italic: false,
      bold: false,
      strikethrough: false,
      outline: false,
      outlineColor: null,
      outlineSize: 1,
      shadowColor: null,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      templateVars: null
    });
  }
  getTextFieldProp(key) {
    const self = this;
    return self.get(key);
  }
  setTextFieldProp(key, value) {
    const self = this;
    return self.set(key, value);
  }
  getText() {
    return this.getTextFieldProp("text");
  }
  setText(v) {
    return this.setTextFieldProp("text", v);
  }
  getX() {
    return this.getTextFieldProp("x");
  }
  getY() {
    return this.getTextFieldProp("y");
  }
  getWidth() {
    return this.getTextFieldProp("width");
  }
  getHeight() {
    return this.getTextFieldProp("height");
  }
  getMinWidth() {
    return this.getTextFieldProp("minWidth");
  }
  getMaxWidth() {
    return this.getTextFieldProp("maxWidth");
  }
  getMinHeight() {
    return this.getTextFieldProp("minHeight");
  }
  getMaxHeight() {
    return this.getTextFieldProp("maxHeight");
  }
  setXY(x, y) {
    this.setTextFieldProp("x", x);
    return this.setTextFieldProp("y", y);
  }
  setSize(w, h) {
    this.setTextFieldProp("width", w);
    return this.setTextFieldProp("height", h);
  }
  setMinWidth(v) {
    return this.setTextFieldProp("minWidth", v);
  }
  setMaxWidth(v) {
    return this.setTextFieldProp("maxWidth", v);
  }
  setMinHeight(v) {
    return this.setTextFieldProp("minHeight", v);
  }
  setMaxHeight(v) {
    return this.setTextFieldProp("maxHeight", v);
  }
  setX(v) {
    return this.setTextFieldProp("x", v);
  }
  setY(v) {
    return this.setTextFieldProp("y", v);
  }
  getPivotX() {
    return this.getTextFieldProp("pivotX");
  }
  getPivotY() {
    return this.getTextFieldProp("pivotY");
  }
  getPivotAsAnchor() {
    return this.getTextFieldProp("anchor");
  }
  setPivot(x, y, anchor = false) {
    this.setTextFieldProp("pivotX", x);
    this.setTextFieldProp("pivotY", y);
    return this.setTextFieldProp("anchor", anchor);
  }
  getScaleX() {
    return this.getTextFieldProp("scaleX");
  }
  getScaleY() {
    return this.getTextFieldProp("scaleY");
  }
  setScale(x, y) {
    this.setTextFieldProp("scaleX", x);
    return this.setTextFieldProp("scaleY", y);
  }
  setPivotAsAnchor(v) {
    return this.setTextFieldProp("anchor", v);
  }
  getGroup() {
    return this.getTextFieldProp("group");
  }
  setGroup(v) {
    return this.setTextFieldProp("group", v);
  }
  getAlpha() {
    return this.getTextFieldProp("alpha");
  }
  setAlpha(v) {
    return this.setTextFieldProp("alpha", v);
  }
  getRotation() {
    return this.getTextFieldProp("rotation");
  }
  setRotation(v) {
    return this.setTextFieldProp("rotation", v);
  }
  getVisible() {
    return this.getTextFieldProp("visible");
  }
  setVisible(v) {
    return this.setTextFieldProp("visible", v);
  }
  getTouchable() {
    return this.getTextFieldProp("touchable");
  }
  setTouchable(v) {
    return this.setTextFieldProp("touchable", v);
  }
  getGrayed() {
    return this.getTextFieldProp("grayed");
  }
  setGrayed(v) {
    return this.setTextFieldProp("grayed", v);
  }
  getTooltips() {
    return this.getTextFieldProp("tooltips");
  }
  setTooltips(v) {
    return this.setTextFieldProp("tooltips", v);
  }
  getCustomData() {
    return this.getTextFieldProp("customData");
  }
  setCustomData(v) {
    return this.setTextFieldProp("customData", v);
  }
  getFont() {
    return this.getTextFieldProp("font");
  }
  setFont(v) {
    return this.setTextFieldProp("font", v);
  }
  getFontSize() {
    return this.getTextFieldProp("fontSize");
  }
  setFontSize(v) {
    return this.setTextFieldProp("fontSize", v);
  }
  getColor() {
    return this.getTextFieldProp("color");
  }
  setColor(v) {
    return this.setTextFieldProp("color", v);
  }
  getAlign() {
    return this.getTextFieldProp("align");
  }
  setAlign(v) {
    return this.setTextFieldProp("align", v);
  }
  getVAlign() {
    return this.getTextFieldProp("vAlign");
  }
  setVAlign(v) {
    return this.setTextFieldProp("vAlign", v);
  }
  getLeading() {
    return this.getTextFieldProp("leading");
  }
  setLeading(v) {
    return this.setTextFieldProp("leading", v);
  }
  getLetterSpacing() {
    return this.getTextFieldProp("letterSpacing");
  }
  setLetterSpacing(v) {
    return this.setTextFieldProp("letterSpacing", v);
  }
  getAutoSize() {
    return this.getTextFieldProp("autoSize");
  }
  setAutoSize(v) {
    return this.setTextFieldProp("autoSize", v);
  }
  getSingleLine() {
    return this.getTextFieldProp("singleLine");
  }
  setSingleLine(v) {
    return this.setTextFieldProp("singleLine", v);
  }
  getAutoClearText() {
    return this.getTextFieldProp("autoClearText");
  }
  setAutoClearText(v) {
    return this.setTextFieldProp("autoClearText", v);
  }
  getDemoText() {
    return this.getTextFieldProp("demoText");
  }
  setDemoText(v) {
    return this.setTextFieldProp("demoText", v);
  }
  getTemplateVarsEnabled() {
    return this.getTextFieldProp("templateVarsEnabled");
  }
  setTemplateVarsEnabled(v) {
    return this.setTextFieldProp("templateVarsEnabled", v);
  }
  getFaceDilate() {
    return this.getTextFieldProp("faceDilate");
  }
  setFaceDilate(v) {
    return this.setTextFieldProp("faceDilate", v);
  }
  getUnderlaySoftness() {
    return this.getTextFieldProp("underlaySoftness");
  }
  setUnderlaySoftness(v) {
    return this.setTextFieldProp("underlaySoftness", v);
  }
  getUbbEnabled() {
    return this.getTextFieldProp("ubbEnabled");
  }
  setUbbEnabled(v) {
    return this.setTextFieldProp("ubbEnabled", v);
  }
  getUnderline() {
    return this.getTextFieldProp("underline");
  }
  setUnderline(v) {
    return this.setTextFieldProp("underline", v);
  }
  getItalic() {
    return this.getTextFieldProp("italic");
  }
  setItalic(v) {
    return this.setTextFieldProp("italic", v);
  }
  getBold() {
    return this.getTextFieldProp("bold");
  }
  setBold(v) {
    return this.setTextFieldProp("bold", v);
  }
  getStrikethrough() {
    return this.getTextFieldProp("strikethrough");
  }
  setStrikethrough(v) {
    return this.setTextFieldProp("strikethrough", v);
  }
  getStrokeColor() {
    return this.getTextFieldProp("outlineColor");
  }
  setStrokeColor(v) {
    return this.setTextFieldProp("outlineColor", v);
  }
  getStrokeSize() {
    return this.getTextFieldProp("outlineSize");
  }
  setStrokeSize(v) {
    return this.setTextFieldProp("outlineSize", v);
  }
  getShadowColor() {
    return this.getTextFieldProp("shadowColor");
  }
  setShadowColor(v) {
    return this.setTextFieldProp("shadowColor", v);
  }
  getShadowOffsetX() {
    return this.getTextFieldProp("shadowOffsetX");
  }
  setShadowOffsetX(v) {
    return this.setTextFieldProp("shadowOffsetX", v);
  }
  getShadowOffsetY() {
    return this.getTextFieldProp("shadowOffsetY");
  }
  setShadowOffsetY(v) {
    return this.setTextFieldProp("shadowOffsetY", v);
  }
  getShadowOffset() {
    return {
      x: this.getShadowOffsetX(),
      y: this.getShadowOffsetY()
    };
  }
  setShadowOffset(v) {
    this.setShadowOffsetX(v.x ?? 0);
    return this.setShadowOffsetY(v.y ?? 0);
  }
};

// packages/core/src/properties/g-rich-text-field.ts
var GRichTextField = class extends GTextField {
  init() {
    this.propertyType = "GRichTextField" /* G_RICH_TEXT_FIELD */;
  }
};

// packages/core/src/properties/g-text-input.ts
var GTextInput = class extends GTextField {
  init() {
    this.propertyType = "GTextInput" /* G_TEXT_INPUT */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      promptText: "",
      maxLength: 0,
      restrict: "",
      password: false,
      keyboardType: 0
    });
  }
  getPromptText() {
    return this.get("promptText");
  }
  setPromptText(v) {
    return this.set("promptText", v);
  }
  getMaxLength() {
    return this.get("maxLength");
  }
  setMaxLength(v) {
    return this.set("maxLength", v);
  }
  getRestrict() {
    return this.get("restrict");
  }
  setRestrict(v) {
    return this.set("restrict", v);
  }
  getPassword() {
    return this.get("password");
  }
  setPassword(v) {
    return this.set("password", v);
  }
  getKeyboardType() {
    return this.get("keyboardType");
  }
  setKeyboardType(v) {
    return this.set("keyboardType", v);
  }
};

// packages/core/src/properties/g-graph.ts
var GGraph = class extends GObject {
  init() {
    this.propertyType = "GGraph" /* G_GRAPH */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      locked: false,
      minWidth: 0,
      maxWidth: 0,
      minHeight: 0,
      maxHeight: 0,
      pivotX: 0,
      pivotY: 0,
      anchor: false,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      skewX: 0,
      skewY: 0,
      scaleX: 1,
      scaleY: 1,
      graphType: 0 /* Empty */,
      lineSize: 1,
      lineColor: "#000000",
      fillColor: "#FFFFFF",
      cornerRadius: null,
      points: null,
      sides: 0,
      startAngle: 0,
      distances: null
    });
  }
  getGraphType() {
    return this.get("graphType");
  }
  setGraphType(v) {
    return this.set("graphType", v);
  }
  getX() {
    return this.get("x");
  }
  getY() {
    return this.get("y");
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  getLocked() {
    return this.get("locked");
  }
  getMinWidth() {
    return this.get("minWidth");
  }
  getMaxWidth() {
    return this.get("maxWidth");
  }
  getMinHeight() {
    return this.get("minHeight");
  }
  getMaxHeight() {
    return this.get("maxHeight");
  }
  setXY(x, y) {
    this.set("x", x);
    return this.set("y", y);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  setLocked(v) {
    return this.set("locked", v);
  }
  setMinWidth(v) {
    return this.set("minWidth", v);
  }
  setMaxWidth(v) {
    return this.set("maxWidth", v);
  }
  setMinHeight(v) {
    return this.set("minHeight", v);
  }
  setMaxHeight(v) {
    return this.set("maxHeight", v);
  }
  setX(v) {
    return this.set("x", v);
  }
  setY(v) {
    return this.set("y", v);
  }
  getPivotX() {
    return this.get("pivotX");
  }
  getPivotY() {
    return this.get("pivotY");
  }
  getPivotAsAnchor() {
    return this.get("anchor");
  }
  setPivot(x, y, anchor = false) {
    this.set("pivotX", x);
    this.set("pivotY", y);
    return this.set("anchor", anchor);
  }
  setPivotAsAnchor(v) {
    return this.set("anchor", v);
  }
  getGroup() {
    return this.get("group");
  }
  setGroup(v) {
    return this.set("group", v);
  }
  getSkewX() {
    return this.get("skewX");
  }
  getSkewY() {
    return this.get("skewY");
  }
  setSkew(x, y) {
    this.set("skewX", x);
    return this.set("skewY", y);
  }
  getScaleX() {
    return this.get("scaleX");
  }
  getScaleY() {
    return this.get("scaleY");
  }
  setScale(x, y) {
    this.set("scaleX", x);
    return this.set("scaleY", y);
  }
  getAlpha() {
    return this.get("alpha");
  }
  setAlpha(v) {
    return this.set("alpha", v);
  }
  getRotation() {
    return this.get("rotation");
  }
  setRotation(v) {
    return this.set("rotation", v);
  }
  getVisible() {
    return this.get("visible");
  }
  setVisible(v) {
    return this.set("visible", v);
  }
  getTouchable() {
    return this.get("touchable");
  }
  setTouchable(v) {
    return this.set("touchable", v);
  }
  getGrayed() {
    return this.get("grayed");
  }
  setGrayed(v) {
    return this.set("grayed", v);
  }
  getLineSize() {
    return this.get("lineSize");
  }
  setLineSize(v) {
    return this.set("lineSize", v);
  }
  getLineColor() {
    return this.get("lineColor");
  }
  setLineColor(v) {
    return this.set("lineColor", v);
  }
  getFillColor() {
    return this.get("fillColor");
  }
  setFillColor(v) {
    return this.set("fillColor", v);
  }
  getCornerRadius() {
    return this.get("cornerRadius");
  }
  setCornerRadius(v) {
    return this.set("cornerRadius", v);
  }
  getPoints() {
    return this.get("points");
  }
  setPoints(v) {
    return this.set("points", v);
  }
  getSides() {
    return this.get("sides");
  }
  setSides(v) {
    return this.set("sides", v);
  }
  getStartAngle() {
    return this.get("startAngle");
  }
  setStartAngle(v) {
    return this.set("startAngle", v);
  }
  getDistances() {
    return this.get("distances");
  }
  setDistances(v) {
    return this.set("distances", v);
  }
};

// packages/core/src/properties/g-group.ts
var GGroup = class extends GObject {
  init() {
    this.propertyType = "GGroup" /* G_GROUP */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      locked: false,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      layout: 0 /* None */,
      lineGap: 0,
      columnGap: 0,
      advanced: false,
      excludeInvisibles: false,
      autoSizeDisabled: false,
      mainGridIndex: -1
    });
  }
  getLayout() {
    return this.get("layout");
  }
  setLayout(v) {
    return this.set("layout", v);
  }
  getX() {
    return this.get("x");
  }
  getY() {
    return this.get("y");
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  getLocked() {
    return this.get("locked");
  }
  setXY(x, y) {
    this.set("x", x);
    return this.set("y", y);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  setLocked(v) {
    return this.set("locked", v);
  }
  setX(v) {
    return this.set("x", v);
  }
  setY(v) {
    return this.set("y", v);
  }
  getPivotX() {
    return this.get("pivotX");
  }
  getPivotY() {
    return this.get("pivotY");
  }
  getPivotAsAnchor() {
    return this.get("anchor");
  }
  setPivot(x, y, anchor = false) {
    this.set("pivotX", x);
    this.set("pivotY", y);
    return this.set("anchor", anchor);
  }
  getScaleX() {
    return this.get("scaleX");
  }
  getScaleY() {
    return this.get("scaleY");
  }
  setScale(x, y) {
    this.set("scaleX", x);
    return this.set("scaleY", y);
  }
  setPivotAsAnchor(v) {
    return this.set("anchor", v);
  }
  getAlpha() {
    return this.get("alpha");
  }
  setAlpha(v) {
    return this.set("alpha", v);
  }
  getRotation() {
    return this.get("rotation");
  }
  setRotation(v) {
    return this.set("rotation", v);
  }
  getVisible() {
    return this.get("visible");
  }
  setVisible(v) {
    return this.set("visible", v);
  }
  getGroup() {
    return this.get("group");
  }
  setGroup(v) {
    return this.set("group", v);
  }
  getTouchable() {
    return this.get("touchable");
  }
  setTouchable(v) {
    return this.set("touchable", v);
  }
  getGrayed() {
    return this.get("grayed");
  }
  setGrayed(v) {
    return this.set("grayed", v);
  }
  getLineGap() {
    return this.get("lineGap");
  }
  setLineGap(v) {
    return this.set("lineGap", v);
  }
  getColumnGap() {
    return this.get("columnGap");
  }
  setColumnGap(v) {
    return this.set("columnGap", v);
  }
  getAdvanced() {
    return this.get("advanced");
  }
  setAdvanced(v) {
    return this.set("advanced", v);
  }
  getExcludeInvisibles() {
    return this.get("excludeInvisibles");
  }
  setExcludeInvisibles(v) {
    return this.set("excludeInvisibles", v);
  }
  getAutoSizeDisabled() {
    return this.get("autoSizeDisabled");
  }
  setAutoSizeDisabled(v) {
    return this.set("autoSizeDisabled", v);
  }
  getMainGridIndex() {
    return this.get("mainGridIndex");
  }
  setMainGridIndex(v) {
    return this.set("mainGridIndex", v);
  }
};

// packages/core/src/properties/g-loader.ts
var GLoader = class extends GObject {
  init() {
    this.propertyType = "GLoader" /* G_LOADER */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pivotX: 0,
      pivotY: 0,
      anchor: false,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      group: "",
      url: "",
      filter: "",
      filterData: "",
      fill: 0 /* None */,
      shrinkOnly: false,
      autoSize: false,
      useResize: false,
      align: 0,
      vAlign: 0,
      frame: 0,
      playing: true,
      color: "#FFFFFF",
      fillMethod: 0 /* None */,
      fillOrigin: 0 /* Top */,
      fillClockwise: true,
      fillAmount: 100,
      clearOnPublish: false
    });
  }
  getUrl() {
    return this.get("url");
  }
  setUrl(v) {
    return this.set("url", v);
  }
  getFilter() {
    return this.get("filter");
  }
  setFilter(v) {
    return this.set("filter", v);
  }
  getFilterData() {
    return this.get("filterData");
  }
  setFilterData(v) {
    return this.set("filterData", v);
  }
  getX() {
    return this.get("x");
  }
  getY() {
    return this.get("y");
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  setXY(x, y) {
    this.set("x", x);
    return this.set("y", y);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  setX(v) {
    return this.set("x", v);
  }
  setY(v) {
    return this.set("y", v);
  }
  getPivotX() {
    return this.get("pivotX");
  }
  getPivotY() {
    return this.get("pivotY");
  }
  setPivot(x, y, anchor = false) {
    this.set("pivotX", x);
    this.set("pivotY", y);
    return this.set("anchor", anchor);
  }
  getPivotAsAnchor() {
    return this.get("anchor");
  }
  setPivotAsAnchor(v) {
    return this.set("anchor", v);
  }
  getScaleX() {
    return this.get("scaleX");
  }
  getScaleY() {
    return this.get("scaleY");
  }
  setScale(x, y) {
    this.set("scaleX", x);
    return this.set("scaleY", y);
  }
  getGroup() {
    return this.get("group");
  }
  setGroup(v) {
    return this.set("group", v);
  }
  getAlpha() {
    return this.get("alpha");
  }
  setAlpha(v) {
    return this.set("alpha", v);
  }
  getRotation() {
    return this.get("rotation");
  }
  setRotation(v) {
    return this.set("rotation", v);
  }
  getVisible() {
    return this.get("visible");
  }
  setVisible(v) {
    return this.set("visible", v);
  }
  getTouchable() {
    return this.get("touchable");
  }
  setTouchable(v) {
    return this.set("touchable", v);
  }
  getGrayed() {
    return this.get("grayed");
  }
  setGrayed(v) {
    return this.set("grayed", v);
  }
  getFill() {
    return this.get("fill");
  }
  setFill(v) {
    return this.set("fill", v);
  }
  getShrinkOnly() {
    return this.get("shrinkOnly");
  }
  setShrinkOnly(v) {
    return this.set("shrinkOnly", v);
  }
  getAutoSize() {
    return this.get("autoSize");
  }
  setAutoSize(v) {
    return this.set("autoSize", v);
  }
  getUseResize() {
    return this.get("useResize");
  }
  setUseResize(v) {
    return this.set("useResize", v);
  }
  getAlign() {
    return this.get("align");
  }
  setAlign(v) {
    return this.set("align", v);
  }
  getVAlign() {
    return this.get("vAlign");
  }
  setVAlign(v) {
    return this.set("vAlign", v);
  }
  getFrame() {
    return this.get("frame");
  }
  setFrame(v) {
    return this.set("frame", v);
  }
  getPlaying() {
    return this.get("playing");
  }
  setPlaying(v) {
    return this.set("playing", v);
  }
  getColor() {
    return this.get("color");
  }
  setColor(v) {
    return this.set("color", v);
  }
  getFillMethod() {
    return this.get("fillMethod");
  }
  setFillMethod(v) {
    return this.set("fillMethod", v);
  }
  getFillOrigin() {
    return this.get("fillOrigin");
  }
  setFillOrigin(v) {
    return this.set("fillOrigin", v);
  }
  getFillClockwise() {
    return this.get("fillClockwise");
  }
  setFillClockwise(v) {
    return this.set("fillClockwise", v);
  }
  getFillAmount() {
    return this.get("fillAmount");
  }
  setFillAmount(v) {
    return this.set("fillAmount", v);
  }
  getClearOnPublish() {
    return this.get("clearOnPublish");
  }
  setClearOnPublish(v) {
    return this.set("clearOnPublish", v);
  }
};

// packages/core/src/properties/g-loader-3d.ts
var GLoader3D = class extends GObject {
  init() {
    this.propertyType = "GLoader3D" /* G_LOADER_3D */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      url: "",
      fill: 0 /* None */,
      shrinkOnly: false,
      autoSize: false,
      align: 0,
      vAlign: 0,
      animationName: "",
      skinName: "",
      playing: true,
      frame: 0,
      loop: true,
      color: "#FFFFFF"
    });
  }
  getUrl() {
    return this.get("url");
  }
  setUrl(v) {
    return this.set("url", v);
  }
  getX() {
    return this.get("x");
  }
  getY() {
    return this.get("y");
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  setXY(x, y) {
    this.set("x", x);
    return this.set("y", y);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  setX(v) {
    return this.set("x", v);
  }
  setY(v) {
    return this.set("y", v);
  }
  getAlpha() {
    return this.get("alpha");
  }
  setAlpha(v) {
    return this.set("alpha", v);
  }
  getRotation() {
    return this.get("rotation");
  }
  setRotation(v) {
    return this.set("rotation", v);
  }
  getVisible() {
    return this.get("visible");
  }
  setVisible(v) {
    return this.set("visible", v);
  }
  getTouchable() {
    return this.get("touchable");
  }
  setTouchable(v) {
    return this.set("touchable", v);
  }
  getGrayed() {
    return this.get("grayed");
  }
  setGrayed(v) {
    return this.set("grayed", v);
  }
  getFill() {
    return this.get("fill");
  }
  setFill(v) {
    return this.set("fill", v);
  }
  getShrinkOnly() {
    return this.get("shrinkOnly");
  }
  setShrinkOnly(v) {
    return this.set("shrinkOnly", v);
  }
  getAutoSize() {
    return this.get("autoSize");
  }
  setAutoSize(v) {
    return this.set("autoSize", v);
  }
  getAlign() {
    return this.get("align");
  }
  setAlign(v) {
    return this.set("align", v);
  }
  getVAlign() {
    return this.get("vAlign");
  }
  setVAlign(v) {
    return this.set("vAlign", v);
  }
  getAnimationName() {
    return this.get("animationName");
  }
  setAnimationName(v) {
    return this.set("animationName", v);
  }
  getSkinName() {
    return this.get("skinName");
  }
  setSkinName(v) {
    return this.set("skinName", v);
  }
  getPlaying() {
    return this.get("playing");
  }
  setPlaying(v) {
    return this.set("playing", v);
  }
  getFrame() {
    return this.get("frame");
  }
  setFrame(v) {
    return this.set("frame", v);
  }
  getLoop() {
    return this.get("loop");
  }
  setLoop(v) {
    return this.set("loop", v);
  }
  getColor() {
    return this.get("color");
  }
  setColor(v) {
    return this.set("color", v);
  }
};

// packages/core/src/properties/g-movie-clip.ts
var GMovieClip = class extends GObject {
  init() {
    this.propertyType = "GMovieClip" /* G_MOVIE_CLIP */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      src: "",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pivotX: 0,
      pivotY: 0,
      scaleX: 1,
      scaleY: 1,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      fileName: "",
      packageId: "",
      filter: "",
      filterData: "",
      playing: true,
      frame: 0,
      color: "#FFFFFF"
    });
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
  getX() {
    return this.get("x");
  }
  getY() {
    return this.get("y");
  }
  getWidth() {
    return this.get("width");
  }
  getHeight() {
    return this.get("height");
  }
  setXY(x, y) {
    this.set("x", x);
    return this.set("y", y);
  }
  setSize(w, h) {
    this.set("width", w);
    return this.set("height", h);
  }
  setX(v) {
    return this.set("x", v);
  }
  setY(v) {
    return this.set("y", v);
  }
  getPivotX() {
    return this.get("pivotX");
  }
  getPivotY() {
    return this.get("pivotY");
  }
  setPivot(x, y) {
    this.set("pivotX", x);
    return this.set("pivotY", y);
  }
  getScaleX() {
    return this.get("scaleX");
  }
  getScaleY() {
    return this.get("scaleY");
  }
  setScale(x, y) {
    this.set("scaleX", x);
    return this.set("scaleY", y);
  }
  getGroup() {
    return this.get("group");
  }
  setGroup(v) {
    return this.set("group", v);
  }
  getAlpha() {
    return this.get("alpha");
  }
  setAlpha(v) {
    return this.set("alpha", v);
  }
  getRotation() {
    return this.get("rotation");
  }
  setRotation(v) {
    return this.set("rotation", v);
  }
  getVisible() {
    return this.get("visible");
  }
  setVisible(v) {
    return this.set("visible", v);
  }
  getTouchable() {
    return this.get("touchable");
  }
  setTouchable(v) {
    return this.set("touchable", v);
  }
  getGrayed() {
    return this.get("grayed");
  }
  setGrayed(v) {
    return this.set("grayed", v);
  }
  getFileName() {
    return this.get("fileName");
  }
  setFileName(v) {
    return this.set("fileName", v);
  }
  getPackageId() {
    return this.get("packageId");
  }
  setPackageId(v) {
    return this.set("packageId", v);
  }
  getFilter() {
    return this.get("filter");
  }
  setFilter(v) {
    return this.set("filter", v);
  }
  getFilterData() {
    return this.get("filterData");
  }
  setFilterData(v) {
    return this.set("filterData", v);
  }
  getPlaying() {
    return this.get("playing");
  }
  setPlaying(v) {
    return this.set("playing", v);
  }
  getFrame() {
    return this.get("frame");
  }
  setFrame(v) {
    return this.set("frame", v);
  }
  getColor() {
    return this.get("color");
  }
  setColor(v) {
    return this.set("color", v);
  }
};

// packages/core/src/properties/g-component.ts
function firstString(value) {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}
var GComponent = class extends GObject {
  init() {
    this.propertyType = "GComponent" /* G_COMPONENT */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      src: "",
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      locked: false,
      minWidth: 0,
      maxWidth: 0,
      minHeight: 0,
      maxHeight: 0,
      aspect: false,
      pivotX: 0,
      pivotY: 0,
      anchor: false,
      scaleX: 1,
      scaleY: 1,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      tooltips: "",
      customData: "",
      fileName: "",
      packageId: "",
      filter: "",
      filterData: "",
      overflow: 0 /* Visible */,
      scrollType: 1 /* Vertical */,
      scrollBarDisplay: 0 /* Default */,
      scrollBarFlags: 0,
      margin: [0, 0, 0, 0],
      clipSoftness: [0, 0],
      pageController: "",
      controllerOverrides: "",
      instanceExtType: "",
      instanceTitle: "",
      instanceSelectedTitle: "",
      instanceIcon: "",
      instanceSelectedIcon: "",
      instanceTitleColor: "",
      instanceTitleFontSize: 0,
      instanceController: "",
      instancePage: "",
      instanceChecked: false,
      instancePromptText: "",
      instanceSelectionController: "",
      instanceVisibleItemCount: 0,
      instanceValue: 0,
      instanceMax: 0,
      instanceMin: 0,
      instanceComboItems: []
    });
  }
  getComponentProp(key) {
    const self = this;
    return self.get(key);
  }
  setComponentProp(key, value) {
    const self = this;
    return self.set(key, value);
  }
  getSrc() {
    return this.getComponentProp("src");
  }
  setSrc(v) {
    return this.setComponentProp("src", v);
  }
  getX() {
    return this.getComponentProp("x");
  }
  getY() {
    return this.getComponentProp("y");
  }
  getWidth() {
    return this.getComponentProp("width");
  }
  getHeight() {
    return this.getComponentProp("height");
  }
  getLocked() {
    return this.getComponentProp("locked");
  }
  getMinWidth() {
    return this.getComponentProp("minWidth");
  }
  getMaxWidth() {
    return this.getComponentProp("maxWidth");
  }
  getMinHeight() {
    return this.getComponentProp("minHeight");
  }
  getMaxHeight() {
    return this.getComponentProp("maxHeight");
  }
  setXY(x, y) {
    this.setComponentProp("x", x);
    return this.setComponentProp("y", y);
  }
  setSize(w, h) {
    this.setComponentProp("width", w);
    return this.setComponentProp("height", h);
  }
  setLocked(v) {
    return this.setComponentProp("locked", v);
  }
  setMinWidth(v) {
    return this.setComponentProp("minWidth", v);
  }
  setMaxWidth(v) {
    return this.setComponentProp("maxWidth", v);
  }
  setMinHeight(v) {
    return this.setComponentProp("minHeight", v);
  }
  setMaxHeight(v) {
    return this.setComponentProp("maxHeight", v);
  }
  setX(v) {
    return this.setComponentProp("x", v);
  }
  setY(v) {
    return this.setComponentProp("y", v);
  }
  getAspect() {
    return this.getComponentProp("aspect");
  }
  setAspect(v) {
    return this.setComponentProp("aspect", v);
  }
  getPivotX() {
    return this.getComponentProp("pivotX");
  }
  getPivotY() {
    return this.getComponentProp("pivotY");
  }
  getPivotAsAnchor() {
    return this.getComponentProp("anchor");
  }
  setPivot(x, y, anchor = false) {
    this.setComponentProp("pivotX", x);
    this.setComponentProp("pivotY", y);
    return this.setComponentProp("anchor", anchor);
  }
  setPivotAsAnchor(v) {
    return this.setComponentProp("anchor", v);
  }
  getScaleX() {
    return this.getComponentProp("scaleX");
  }
  getScaleY() {
    return this.getComponentProp("scaleY");
  }
  setScale(x, y) {
    this.setComponentProp("scaleX", x);
    return this.setComponentProp("scaleY", y);
  }
  getGroup() {
    return this.getComponentProp("group");
  }
  setGroup(v) {
    return this.setComponentProp("group", v);
  }
  getAlpha() {
    return this.getComponentProp("alpha");
  }
  setAlpha(v) {
    return this.setComponentProp("alpha", v);
  }
  getRotation() {
    return this.getComponentProp("rotation");
  }
  setRotation(v) {
    return this.setComponentProp("rotation", v);
  }
  getVisible() {
    return this.getComponentProp("visible");
  }
  setVisible(v) {
    return this.setComponentProp("visible", v);
  }
  getTouchable() {
    return this.getComponentProp("touchable");
  }
  setTouchable(v) {
    return this.setComponentProp("touchable", v);
  }
  getGrayed() {
    return this.getComponentProp("grayed");
  }
  setGrayed(v) {
    return this.setComponentProp("grayed", v);
  }
  getTooltips() {
    return firstString(this.getComponentProp("tooltips"));
  }
  setTooltips(v) {
    return this.setComponentProp("tooltips", v);
  }
  getCustomData() {
    return firstString(this.getComponentProp("customData"));
  }
  setCustomData(v) {
    return this.setComponentProp("customData", v);
  }
  getFileName() {
    return firstString(this.getComponentProp("fileName"));
  }
  setFileName(v) {
    return this.setComponentProp("fileName", v);
  }
  getPackageId() {
    return firstString(this.getComponentProp("packageId"));
  }
  setPackageId(v) {
    return this.setComponentProp("packageId", v);
  }
  getFilter() {
    return firstString(this.getComponentProp("filter"));
  }
  setFilter(v) {
    return this.setComponentProp("filter", v);
  }
  getFilterData() {
    return firstString(this.getComponentProp("filterData"));
  }
  setFilterData(v) {
    return this.setComponentProp("filterData", v);
  }
  getOverflow() {
    return this.getComponentProp("overflow");
  }
  setOverflow(v) {
    return this.setComponentProp("overflow", v);
  }
  getScrollType() {
    return this.getComponentProp("scrollType");
  }
  setScrollType(v) {
    return this.setComponentProp("scrollType", v);
  }
  getScrollBarDisplay() {
    return this.getComponentProp("scrollBarDisplay");
  }
  setScrollBarDisplay(v) {
    return this.setComponentProp("scrollBarDisplay", v);
  }
  getPageController() {
    return firstString(this.getComponentProp("pageController"));
  }
  setPageController(v) {
    return this.setComponentProp("pageController", v);
  }
  getControllerOverrides() {
    return firstString(this.getComponentProp("controllerOverrides"));
  }
  setControllerOverrides(v) {
    return this.setComponentProp("controllerOverrides", v);
  }
  getInstanceExtType() {
    return firstString(this.getComponentProp("instanceExtType"));
  }
  setInstanceExtType(v) {
    return this.setComponentProp("instanceExtType", v);
  }
  getInstanceTitle() {
    return firstString(this.getComponentProp("instanceTitle"));
  }
  setInstanceTitle(v) {
    return this.setComponentProp("instanceTitle", v);
  }
  getInstanceSelectedTitle() {
    return firstString(this.getComponentProp("instanceSelectedTitle"));
  }
  setInstanceSelectedTitle(v) {
    return this.setComponentProp("instanceSelectedTitle", v);
  }
  getInstanceIcon() {
    return firstString(this.getComponentProp("instanceIcon"));
  }
  setInstanceIcon(v) {
    return this.setComponentProp("instanceIcon", v);
  }
  getInstanceSelectedIcon() {
    return firstString(this.getComponentProp("instanceSelectedIcon"));
  }
  setInstanceSelectedIcon(v) {
    return this.setComponentProp("instanceSelectedIcon", v);
  }
  getInstanceTitleColor() {
    return firstString(this.getComponentProp("instanceTitleColor"));
  }
  setInstanceTitleColor(v) {
    return this.setComponentProp("instanceTitleColor", v);
  }
  getInstanceTitleFontSize() {
    return this.getComponentProp("instanceTitleFontSize");
  }
  setInstanceTitleFontSize(v) {
    return this.setComponentProp("instanceTitleFontSize", v);
  }
  getInstanceController() {
    return firstString(this.getComponentProp("instanceController"));
  }
  setInstanceController(v) {
    return this.setComponentProp("instanceController", v);
  }
  getInstancePage() {
    return firstString(this.getComponentProp("instancePage"));
  }
  setInstancePage(v) {
    return this.setComponentProp("instancePage", v);
  }
  getInstanceChecked() {
    return this.getComponentProp("instanceChecked");
  }
  setInstanceChecked(v) {
    return this.setComponentProp("instanceChecked", v);
  }
  getInstancePromptText() {
    return firstString(this.getComponentProp("instancePromptText"));
  }
  setInstancePromptText(v) {
    return this.setComponentProp("instancePromptText", v);
  }
  getInstanceSelectionController() {
    return firstString(this.getComponentProp("instanceSelectionController"));
  }
  setInstanceSelectionController(v) {
    return this.setComponentProp("instanceSelectionController", v);
  }
  getInstanceVisibleItemCount() {
    return this.getComponentProp("instanceVisibleItemCount");
  }
  setInstanceVisibleItemCount(v) {
    return this.setComponentProp("instanceVisibleItemCount", v);
  }
  getInstanceValue() {
    return this.getComponentProp("instanceValue");
  }
  setInstanceValue(v) {
    return this.setComponentProp("instanceValue", v);
  }
  getInstanceMax() {
    return this.getComponentProp("instanceMax");
  }
  setInstanceMax(v) {
    return this.setComponentProp("instanceMax", v);
  }
  getInstanceMin() {
    return this.getComponentProp("instanceMin");
  }
  setInstanceMin(v) {
    return this.setComponentProp("instanceMin", v);
  }
  getInstanceComboItems() {
    return this.get("instanceComboItems");
  }
  setInstanceComboItems(v) {
    return this.set("instanceComboItems", v);
  }
  getMargin() {
    return this.getComponentProp("margin");
  }
  setMargin(v) {
    return this.setComponentProp("margin", v);
  }
};

// packages/core/src/properties/g-list.ts
function firstString2(value) {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}
var GListBase = class extends GObject {
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      group: "",
      alpha: 1,
      rotation: 0,
      visible: true,
      touchable: true,
      grayed: false,
      layout: 0 /* SingleColumn */,
      align: 0,
      vAlign: 0,
      lineGap: 0,
      columnGap: 0,
      lineCount: 0,
      columnCount: 0,
      selectionMode: 0 /* Single */,
      defaultItem: "",
      autoResizeItem: true,
      childrenRenderOrder: 0,
      apexIndex: 0,
      src: "",
      overflow: 0,
      scrollType: 1,
      scrollBarFlags: 0,
      scrollBarMargin: [0, 0, 0, 0],
      vtScrollBarRes: "",
      hzScrollBarRes: "",
      headerRes: "",
      footerRes: "",
      margin: [0, 0, 0, 0],
      clipSoftness: [0, 0],
      scrollItemToViewOnClick: true,
      foldInvisibleItems: false,
      listItems: [],
      pivotX: 0,
      pivotY: 0,
      anchor: false,
      scaleX: 1,
      scaleY: 1,
      pageController: "",
      controllerOverrides: "",
      selectionController: ""
    });
  }
  getListProp(key) {
    const self = this;
    return self.get(key);
  }
  setListProp(key, value) {
    const self = this;
    return self.set(key, value);
  }
  getLayout() {
    return this.getListProp("layout");
  }
  setLayout(v) {
    return this.setListProp("layout", v);
  }
  getX() {
    return this.getListProp("x");
  }
  getY() {
    return this.getListProp("y");
  }
  getWidth() {
    return this.getListProp("width");
  }
  getHeight() {
    return this.getListProp("height");
  }
  setXY(x, y) {
    this.setListProp("x", x);
    return this.setListProp("y", y);
  }
  setSize(w, h) {
    this.setListProp("width", w);
    return this.setListProp("height", h);
  }
  setX(v) {
    return this.setListProp("x", v);
  }
  setY(v) {
    return this.setListProp("y", v);
  }
  getPivotX() {
    return this.getListProp("pivotX");
  }
  getPivotY() {
    return this.getListProp("pivotY");
  }
  getPivotAsAnchor() {
    return this.getListProp("anchor");
  }
  setPivot(x, y, anchor = false) {
    this.setListProp("pivotX", x);
    this.setListProp("pivotY", y);
    return this.setListProp("anchor", anchor);
  }
  getScaleX() {
    return this.getListProp("scaleX");
  }
  getScaleY() {
    return this.getListProp("scaleY");
  }
  setScale(x, y) {
    this.setListProp("scaleX", x);
    return this.setListProp("scaleY", y);
  }
  setPivotAsAnchor(v) {
    return this.setListProp("anchor", v);
  }
  getAlpha() {
    return this.getListProp("alpha");
  }
  setAlpha(v) {
    return this.setListProp("alpha", v);
  }
  getRotation() {
    return this.getListProp("rotation");
  }
  setRotation(v) {
    return this.setListProp("rotation", v);
  }
  getVisible() {
    return this.getListProp("visible");
  }
  setVisible(v) {
    return this.setListProp("visible", v);
  }
  getGroup() {
    return this.getListProp("group");
  }
  setGroup(v) {
    return this.setListProp("group", v);
  }
  getTouchable() {
    return this.getListProp("touchable");
  }
  setTouchable(v) {
    return this.setListProp("touchable", v);
  }
  getGrayed() {
    return this.getListProp("grayed");
  }
  setGrayed(v) {
    return this.setListProp("grayed", v);
  }
  getAlign() {
    return this.getListProp("align");
  }
  setAlign(v) {
    return this.setListProp("align", v);
  }
  getVAlign() {
    return this.getListProp("vAlign");
  }
  setVAlign(v) {
    return this.setListProp("vAlign", v);
  }
  getLineGap() {
    return this.getListProp("lineGap");
  }
  setLineGap(v) {
    return this.setListProp("lineGap", v);
  }
  getColumnGap() {
    return this.getListProp("columnGap");
  }
  setColumnGap(v) {
    return this.setListProp("columnGap", v);
  }
  getLineCount() {
    return this.getListProp("lineCount");
  }
  setLineCount(v) {
    return this.setListProp("lineCount", v);
  }
  getColumnCount() {
    return this.getListProp("columnCount");
  }
  setColumnCount(v) {
    return this.setListProp("columnCount", v);
  }
  getSelectionMode() {
    return this.getListProp("selectionMode");
  }
  setSelectionMode(v) {
    return this.setListProp("selectionMode", v);
  }
  getDefaultItem() {
    return this.getListProp("defaultItem");
  }
  setDefaultItem(v) {
    return this.setListProp("defaultItem", v);
  }
  getAutoResizeItem() {
    return this.getListProp("autoResizeItem");
  }
  setAutoResizeItem(v) {
    return this.setListProp("autoResizeItem", v);
  }
  getChildrenRenderOrder() {
    return this.getListProp("childrenRenderOrder");
  }
  setChildrenRenderOrder(v) {
    return this.setListProp("childrenRenderOrder", v);
  }
  getApexIndex() {
    return this.getListProp("apexIndex");
  }
  setApexIndex(v) {
    return this.setListProp("apexIndex", v);
  }
  getSrc() {
    return this.getListProp("src");
  }
  setSrc(v) {
    return this.setListProp("src", v);
  }
  getOverflow() {
    return this.getListProp("overflow");
  }
  setOverflow(v) {
    return this.setListProp("overflow", v);
  }
  getScrollType() {
    return this.getListProp("scrollType");
  }
  setScrollType(v) {
    return this.setListProp("scrollType", v);
  }
  getScrollBarFlags() {
    return this.getListProp("scrollBarFlags");
  }
  setScrollBarFlags(v) {
    return this.setListProp("scrollBarFlags", v);
  }
  getScrollBarMargin() {
    const margin = this.getListProp("scrollBarMargin");
    return {
      top: margin[0] ?? 0,
      bottom: margin[1] ?? 0,
      left: margin[2] ?? 0,
      right: margin[3] ?? 0
    };
  }
  setScrollBarMargin(v) {
    if (Array.isArray(v)) {
      return this.setListProp("scrollBarMargin", [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0]);
    }
    return this.setListProp("scrollBarMargin", [v.top ?? 0, v.bottom ?? 0, v.left ?? 0, v.right ?? 0]);
  }
  getVtScrollBarRes() {
    return this.getListProp("vtScrollBarRes");
  }
  setVtScrollBarRes(v) {
    return this.setListProp("vtScrollBarRes", v);
  }
  getHzScrollBarRes() {
    return this.getListProp("hzScrollBarRes");
  }
  setHzScrollBarRes(v) {
    return this.setListProp("hzScrollBarRes", v);
  }
  getHeaderRes() {
    return this.getListProp("headerRes");
  }
  setHeaderRes(v) {
    return this.setListProp("headerRes", v);
  }
  getFooterRes() {
    return this.getListProp("footerRes");
  }
  setFooterRes(v) {
    return this.setListProp("footerRes", v);
  }
  getPageController() {
    return firstString2(this.getListProp("pageController"));
  }
  setPageController(v) {
    return this.setListProp("pageController", v);
  }
  getControllerOverrides() {
    return firstString2(this.getListProp("controllerOverrides"));
  }
  setControllerOverrides(v) {
    return this.setListProp("controllerOverrides", v);
  }
  getMargin() {
    const margin = this.getListProp("margin");
    return {
      top: margin[0] ?? 0,
      bottom: margin[1] ?? 0,
      left: margin[2] ?? 0,
      right: margin[3] ?? 0
    };
  }
  setMargin(v) {
    if (Array.isArray(v)) {
      return this.setListProp("margin", [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 0]);
    }
    return this.setListProp("margin", [v.top ?? 0, v.bottom ?? 0, v.left ?? 0, v.right ?? 0]);
  }
  getClipSoftness() {
    const clipSoftness = this.getListProp("clipSoftness");
    return {
      x: clipSoftness[0] ?? 0,
      y: clipSoftness[1] ?? 0
    };
  }
  setClipSoftness(v) {
    if (Array.isArray(v)) {
      return this.setListProp("clipSoftness", [v[0] ?? 0, v[1] ?? 0]);
    }
    return this.setListProp("clipSoftness", [v.x ?? 0, v.y ?? 0]);
  }
  getScrollItemToViewOnClick() {
    return this.getListProp("scrollItemToViewOnClick");
  }
  setScrollItemToViewOnClick(v) {
    return this.setListProp("scrollItemToViewOnClick", v);
  }
  getFoldInvisibleItems() {
    return this.getListProp("foldInvisibleItems");
  }
  setFoldInvisibleItems(v) {
    return this.setListProp("foldInvisibleItems", v);
  }
  getListItems() {
    return this.get("listItems");
  }
  setListItems(v) {
    return this.set("listItems", v);
  }
  getSelectionController() {
    return firstString2(this.getListProp("selectionController"));
  }
  setSelectionController(v) {
    return this.setListProp("selectionController", v);
  }
};
var GList = class extends GListBase {
  init() {
    this.propertyType = "GList" /* G_LIST */;
  }
};

// packages/core/src/utils/id-utils.ts
function generateId(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
function parseURL(url) {
  if (!url.startsWith("ui://")) return null;
  const body = url.substring(5);
  if (body.length < 8) return null;
  return {
    packageId: body.substring(0, 8),
    resourceId: body.substring(8)
  };
}

// packages/core/src/properties/g-tree.ts
var GTree = class extends GListBase {
  init() {
    this.propertyType = "GTree" /* G_TREE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      treeView: true,
      indent: 30,
      clickToExpand: 0
    });
  }
  getTreeView() {
    return this.get("treeView");
  }
  setTreeView(v) {
    return this.set("treeView", v);
  }
  getIndent() {
    return this.get("indent");
  }
  setIndent(v) {
    return this.set("indent", v);
  }
  getClickToExpand() {
    return this.get("clickToExpand");
  }
  setClickToExpand(v) {
    return this.set("clickToExpand", v);
  }
  getDefaultItemComponent(root) {
    const parsed = parseURL(this.getDefaultItem());
    if (!parsed) return null;
    const pkg = root.getPackageById(parsed.packageId);
    if (!pkg) return null;
    const resource = pkg.getResourceById(parsed.resourceId);
    return resource?.propertyType === "Component" /* COMPONENT */ ? resource : null;
  }
  inspectDefaultItemTemplate(root) {
    const component = this.getDefaultItemComponent(root);
    if (!component) return null;
    const expandButton = component.getChild("expandButton");
    return {
      component,
      expandedController: component.getController("expanded"),
      leafController: component.getController("leaf"),
      titleChild: component.getChild("title"),
      iconChild: component.getChild("icon"),
      indentChild: component.getChild("indent"),
      expandButtonChild: expandButton?.propertyType === "GComponent" /* G_COMPONENT */ ? expandButton : null
    };
  }
  createInteractionState(state = {}) {
    const items = this.getListItems();
    const folderIndices = new Set(
      items.map((item, index) => item.isFolder ?? false ? index : -1).filter((index) => index >= 0)
    );
    const expandedItemIndices = state.expandedItemIndices ? state.expandedItemIndices.filter((index) => folderIndices.has(index)) : Array.from(folderIndices);
    const validNodeIndices = new Set(items.map((_, index) => index));
    const selectedItemIndices = (state.selectedItemIndices ?? []).filter((index) => validNodeIndices.has(index));
    const lastSelectedItemIndex = validNodeIndices.has(state.lastSelectedItemIndex ?? -1) ? state.lastSelectedItemIndex : selectedItemIndices.length > 0 ? selectedItemIndices[selectedItemIndices.length - 1] : -1;
    return {
      expandedItemIndices: Array.from(new Set(expandedItemIndices)),
      selectedItemIndices: Array.from(new Set(selectedItemIndices)),
      lastSelectedItemIndex
    };
  }
  buildRuntimeTree(state = {}) {
    const interaction = this.createInteractionState(state);
    const expanded = new Set(interaction.expandedItemIndices);
    const selected = new Set(interaction.selectedItemIndices);
    const root = {
      itemIndex: -1,
      level: 0,
      sourceLevel: -1,
      isFolder: true,
      expanded: true,
      selected: false,
      visible: true,
      visibleIndex: null,
      title: null,
      icon: null,
      url: null,
      name: null,
      selectedTitle: null,
      selectedIcon: null,
      parent: null,
      children: []
    };
    const folderStack = [root];
    for (const [index, item] of this.getListItems().entries()) {
      const sourceLevel = Math.max(0, item.level ?? 0);
      while (folderStack.length - 1 > sourceLevel) {
        folderStack.pop();
      }
      const parent = folderStack[folderStack.length - 1] ?? root;
      const node = this._createRuntimeNode(item, index, sourceLevel, parent, expanded, selected);
      parent.children.push(node);
      if (node.isFolder) {
        folderStack[sourceLevel + 1] = node;
        folderStack.length = sourceLevel + 2;
      }
    }
    let visibleIndex = 0;
    const assignVisibleIndex = (node) => {
      for (const child of node.children) {
        if (child.visible) {
          child.visibleIndex = visibleIndex;
          visibleIndex += 1;
        }
        assignVisibleIndex(child);
      }
    };
    assignVisibleIndex(root);
    return root;
  }
  listRuntimeNodes(state = {}) {
    const result = [];
    const visit = (node) => {
      for (const child of node.children) {
        result.push(child);
        visit(child);
      }
    };
    visit(this.buildRuntimeTree(state));
    return result;
  }
  listVisibleRuntimeNodes(state = {}) {
    return this.listRuntimeNodes(state).filter((node) => node.visible);
  }
  getRuntimeNode(itemIndex, state = {}) {
    return this.listRuntimeNodes(state).find((node) => node.itemIndex === itemIndex) ?? null;
  }
  getSelectedRuntimeNode(state = {}) {
    return this.listRuntimeNodes(state).find((node) => node.selected) ?? null;
  }
  getSelectedRuntimeNodes(state = {}) {
    return this.listRuntimeNodes(state).filter((node) => node.selected);
  }
  setRuntimeNodeExpanded(state, itemIndex, expanded) {
    const interaction = this.createInteractionState(state);
    const node = this.getRuntimeNode(itemIndex, interaction);
    if (!node?.isFolder) return interaction;
    const nextExpanded = new Set(interaction.expandedItemIndices);
    if (expanded) {
      nextExpanded.add(itemIndex);
    } else {
      nextExpanded.delete(itemIndex);
    }
    return {
      expandedItemIndices: Array.from(nextExpanded),
      selectedItemIndices: interaction.selectedItemIndices.slice(),
      lastSelectedItemIndex: interaction.lastSelectedItemIndex
    };
  }
  toggleRuntimeNodeExpanded(state, itemIndex) {
    const interaction = this.createInteractionState(state);
    const node = this.getRuntimeNode(itemIndex, interaction);
    if (!node?.isFolder) return interaction;
    return this.setRuntimeNodeExpanded(interaction, itemIndex, !node.expanded);
  }
  expandAll(state = {}) {
    const interaction = this.createInteractionState(state);
    return {
      expandedItemIndices: this.listRuntimeNodes(interaction).filter((node) => node.isFolder).map((node) => node.itemIndex),
      selectedItemIndices: interaction.selectedItemIndices.slice(),
      lastSelectedItemIndex: interaction.lastSelectedItemIndex
    };
  }
  collapseAll(state = {}) {
    const interaction = this.createInteractionState(state);
    return {
      expandedItemIndices: [],
      selectedItemIndices: interaction.selectedItemIndices.slice(),
      lastSelectedItemIndex: interaction.lastSelectedItemIndex
    };
  }
  selectRuntimeNode(state, itemIndex, append = false) {
    const interaction = this.createInteractionState(state);
    const node = this.getRuntimeNode(itemIndex, interaction);
    if (!node) return interaction;
    const expanded = new Set(interaction.expandedItemIndices);
    let cursor = node.parent;
    while (cursor && cursor.itemIndex >= 0) {
      if (cursor.isFolder) expanded.add(cursor.itemIndex);
      cursor = cursor.parent;
    }
    let selectedItemIndices = [];
    if (this.getSelectionMode() !== 3 /* None */) {
      if (append && (this.getSelectionMode() === 1 /* Multiple */ || this.getSelectionMode() === 2 /* MultipleSingleClick */)) {
        selectedItemIndices = Array.from(/* @__PURE__ */ new Set([...interaction.selectedItemIndices, itemIndex]));
      } else {
        selectedItemIndices = [itemIndex];
      }
    }
    return {
      expandedItemIndices: Array.from(expanded),
      selectedItemIndices,
      lastSelectedItemIndex: itemIndex
    };
  }
  unselectRuntimeNode(state, itemIndex) {
    const interaction = this.createInteractionState(state);
    return {
      expandedItemIndices: interaction.expandedItemIndices.slice(),
      selectedItemIndices: interaction.selectedItemIndices.filter((index) => index !== itemIndex),
      lastSelectedItemIndex: interaction.lastSelectedItemIndex
    };
  }
  clearRuntimeSelection(state = {}) {
    const interaction = this.createInteractionState(state);
    return {
      expandedItemIndices: interaction.expandedItemIndices.slice(),
      selectedItemIndices: [],
      lastSelectedItemIndex: interaction.lastSelectedItemIndex
    };
  }
  selectAllVisibleRuntimeNodes(state = {}) {
    const interaction = this.createInteractionState(state);
    if (this.getSelectionMode() === 3 /* None */ || this.getSelectionMode() === 0 /* Single */) {
      return interaction;
    }
    const visibleNodes = this.listVisibleRuntimeNodes(interaction);
    return {
      expandedItemIndices: interaction.expandedItemIndices.slice(),
      selectedItemIndices: visibleNodes.map((node) => node.itemIndex),
      lastSelectedItemIndex: visibleNodes.length > 0 ? visibleNodes[visibleNodes.length - 1].itemIndex : interaction.lastSelectedItemIndex
    };
  }
  selectReverseVisibleRuntimeNodes(state = {}) {
    const interaction = this.createInteractionState(state);
    if (this.getSelectionMode() === 3 /* None */ || this.getSelectionMode() === 0 /* Single */) {
      return interaction;
    }
    const selected = new Set(interaction.selectedItemIndices);
    const visibleNodes = this.listVisibleRuntimeNodes(interaction);
    const selectedItemIndices = visibleNodes.filter((node) => !selected.has(node.itemIndex)).map((node) => node.itemIndex);
    return {
      expandedItemIndices: interaction.expandedItemIndices.slice(),
      selectedItemIndices,
      lastSelectedItemIndex: selectedItemIndices.length > 0 ? selectedItemIndices[selectedItemIndices.length - 1] : interaction.lastSelectedItemIndex
    };
  }
  selectRuntimeRange(state, itemIndex, anchorItemIndex, append = true) {
    const interaction = this.createInteractionState(state);
    if (this.getSelectionMode() === 3 /* None */ || this.getSelectionMode() === 0 /* Single */) {
      return this.selectRuntimeNode(interaction, itemIndex);
    }
    const range = this._collectSelectionRange(interaction, anchorItemIndex ?? interaction.lastSelectedItemIndex, itemIndex);
    if (range.length === 0) {
      return this.selectRuntimeNode(interaction, itemIndex, append);
    }
    const selected = append ? new Set(interaction.selectedItemIndices) : /* @__PURE__ */ new Set();
    for (const index of range) selected.add(index);
    return {
      expandedItemIndices: interaction.expandedItemIndices.slice(),
      selectedItemIndices: Array.from(selected),
      lastSelectedItemIndex: interaction.lastSelectedItemIndex
    };
  }
  setSelectionOnRuntimeNode(state, itemIndex, options = {}) {
    const interaction = this.createInteractionState(state);
    const node = this.getRuntimeNode(itemIndex, interaction);
    if (!node || this.getSelectionMode() === 3 /* None */) return interaction;
    if (this.getSelectionMode() === 0 /* Single */) {
      return this.selectRuntimeNode(interaction, itemIndex);
    }
    if (options.shiftKey) {
      if (!node.selected && interaction.lastSelectedItemIndex !== -1) {
        return this.selectRuntimeRange(interaction, itemIndex, interaction.lastSelectedItemIndex, true);
      }
      if (!node.selected) {
        return this.selectRuntimeNode(interaction, itemIndex);
      }
      return interaction;
    }
    if (options.ctrlKey || this.getSelectionMode() === 2 /* MultipleSingleClick */) {
      const selected = new Set(interaction.selectedItemIndices);
      if (selected.has(itemIndex)) selected.delete(itemIndex);
      else selected.add(itemIndex);
      return {
        expandedItemIndices: interaction.expandedItemIndices.slice(),
        selectedItemIndices: Array.from(selected),
        lastSelectedItemIndex: itemIndex
      };
    }
    return {
      expandedItemIndices: interaction.expandedItemIndices.slice(),
      selectedItemIndices: [itemIndex],
      lastSelectedItemIndex: itemIndex
    };
  }
  navigateRuntimeSelection(state, direction) {
    const interaction = this.createInteractionState(state);
    const current = this._getNavigationAnchorNode(interaction);
    if (!current) return interaction;
    switch (direction) {
      case "up":
      case "down": {
        const visibleNodes = this.listVisibleRuntimeNodes(interaction);
        const currentVisibleIndex = visibleNodes.findIndex((node) => node.itemIndex === current.itemIndex);
        if (currentVisibleIndex < 0) return interaction;
        const nextVisibleIndex = direction === "up" ? currentVisibleIndex - 1 : currentVisibleIndex + 1;
        const nextNode = visibleNodes[nextVisibleIndex];
        if (!nextNode) return interaction;
        return this.selectRuntimeNode(interaction, nextNode.itemIndex);
      }
      case "right": {
        if (current.isFolder) {
          if (!current.expanded) {
            return this.setRuntimeNodeExpanded(interaction, current.itemIndex, true);
          }
          const firstVisibleChild = current.children.find((child) => child.visible);
          if (firstVisibleChild) {
            return this.selectRuntimeNode(interaction, firstVisibleChild.itemIndex);
          }
        }
        return interaction;
      }
      case "left": {
        if (current.isFolder && current.expanded) {
          return this.setRuntimeNodeExpanded(interaction, current.itemIndex, false);
        }
        if (current.parent && current.parent.itemIndex >= 0) {
          return this.selectRuntimeNode(interaction, current.parent.itemIndex);
        }
        return interaction;
      }
      default:
        return interaction;
    }
  }
  _createRuntimeNode(item, index, sourceLevel, parent, expanded, selected) {
    const isFolder = item.isFolder ?? false;
    return {
      itemIndex: index,
      level: parent.level + 1,
      sourceLevel,
      isFolder,
      expanded: isFolder ? expanded.has(index) : null,
      selected: selected.has(index),
      visible: parent.visible && (parent.itemIndex < 0 || parent.expanded === true),
      visibleIndex: null,
      title: item.title ?? null,
      icon: item.icon ?? null,
      url: item.url ?? null,
      name: item.name ?? null,
      selectedTitle: item.selectedTitle ?? null,
      selectedIcon: item.selectedIcon ?? null,
      parent,
      children: []
    };
  }
  _collectSelectionRange(state, anchorItemIndex, targetItemIndex) {
    const visibleNodes = this.listVisibleRuntimeNodes(state);
    const visibleIndices = new Map(visibleNodes.map((node, index) => [node.itemIndex, index]));
    const anchorVisibleIndex = visibleIndices.get(anchorItemIndex);
    const targetVisibleIndex = visibleIndices.get(targetItemIndex);
    if (anchorVisibleIndex !== void 0 && targetVisibleIndex !== void 0) {
      const min2 = Math.min(anchorVisibleIndex, targetVisibleIndex);
      const max2 = Math.max(anchorVisibleIndex, targetVisibleIndex);
      return visibleNodes.slice(min2, max2 + 1).map((node) => node.itemIndex);
    }
    const allNodes = this.listRuntimeNodes(state);
    const allIndices = new Map(allNodes.map((node, index) => [node.itemIndex, index]));
    const anchorIndex = allIndices.get(anchorItemIndex);
    const targetIndex = allIndices.get(targetItemIndex);
    if (anchorIndex === void 0 || targetIndex === void 0) return [];
    const min = Math.min(anchorIndex, targetIndex);
    const max = Math.max(anchorIndex, targetIndex);
    return allNodes.slice(min, max + 1).map((node) => node.itemIndex);
  }
  _getNavigationAnchorNode(state) {
    if (state.lastSelectedItemIndex >= 0) {
      const lastSelected = this.getRuntimeNode(state.lastSelectedItemIndex, state);
      if (lastSelected) return lastSelected;
    }
    return this.getSelectedRuntimeNode(state);
  }
};

// packages/core/src/properties/g-button.ts
var GButton = class extends GComponent {
  init() {
    this.propertyType = "GButton" /* G_BUTTON */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      title: "",
      icon: "",
      selectedTitle: "",
      selectedIcon: "",
      titleColor: "#000000",
      titleFontSize: 0,
      sound: "",
      soundVolumeScale: 1,
      mode: 0 /* Common */,
      pageOption: "",
      changeStateOnClick: true,
      downEffect: 0,
      downEffectValue: 0.8,
      src: ""
    });
  }
  getTitle() {
    return this.get("title");
  }
  setTitle(v) {
    return this.set("title", v);
  }
  getIcon() {
    return this.get("icon");
  }
  setIcon(v) {
    return this.set("icon", v);
  }
  getSelectedTitle() {
    return this.get("selectedTitle");
  }
  setSelectedTitle(v) {
    return this.set("selectedTitle", v);
  }
  getSelectedIcon() {
    return this.get("selectedIcon");
  }
  setSelectedIcon(v) {
    return this.set("selectedIcon", v);
  }
  getTitleColor() {
    return this.get("titleColor");
  }
  setTitleColor(v) {
    return this.set("titleColor", v);
  }
  getTitleFontSize() {
    return this.get("titleFontSize");
  }
  setTitleFontSize(v) {
    return this.set("titleFontSize", v);
  }
  getSound() {
    return this.get("sound");
  }
  setSound(v) {
    return this.set("sound", v);
  }
  getSoundVolumeScale() {
    return this.get("soundVolumeScale");
  }
  setSoundVolumeScale(v) {
    return this.set("soundVolumeScale", v);
  }
  getMode() {
    return this.get("mode");
  }
  setMode(v) {
    return this.set("mode", v);
  }
  getDownEffect() {
    return this.get("downEffect");
  }
  setDownEffect(v) {
    return this.set("downEffect", v);
  }
  getDownEffectValue() {
    return this.get("downEffectValue");
  }
  setDownEffectValue(v) {
    return this.set("downEffectValue", v);
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
};

// packages/core/src/properties/g-label.ts
var GLabel = class extends GComponent {
  init() {
    this.propertyType = "GLabel" /* G_LABEL */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      title: "",
      icon: "",
      titleColor: "#000000",
      titleFontSize: 0,
      sound: "",
      soundVolumeScale: 1,
      src: ""
    });
  }
  getTitle() {
    return this.get("title");
  }
  setTitle(v) {
    return this.set("title", v);
  }
  getIcon() {
    return this.get("icon");
  }
  setIcon(v) {
    return this.set("icon", v);
  }
  getTitleColor() {
    return this.get("titleColor");
  }
  setTitleColor(v) {
    return this.set("titleColor", v);
  }
  getTitleFontSize() {
    return this.get("titleFontSize");
  }
  setTitleFontSize(v) {
    return this.set("titleFontSize", v);
  }
  getSound() {
    return this.get("sound");
  }
  setSound(v) {
    return this.set("sound", v);
  }
  getSoundVolumeScale() {
    return this.get("soundVolumeScale");
  }
  setSoundVolumeScale(v) {
    return this.set("soundVolumeScale", v);
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
};

// packages/core/src/properties/g-combo-box.ts
var GComboBox = class extends GComponent {
  init() {
    this.propertyType = "GComboBox" /* G_COMBO_BOX */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      title: "",
      icon: "",
      titleColor: "#000000",
      titleFontSize: 0,
      items: [],
      icons: [],
      values: [],
      selectedIndex: -1,
      popupDirection: 0,
      visibleItemCount: 0,
      sound: "",
      soundVolumeScale: 1,
      src: ""
    });
  }
  getTitle() {
    return this.get("title");
  }
  setTitle(v) {
    return this.set("title", v);
  }
  getIcon() {
    return this.get("icon");
  }
  setIcon(v) {
    return this.set("icon", v);
  }
  getTitleColor() {
    return this.get("titleColor");
  }
  setTitleColor(v) {
    return this.set("titleColor", v);
  }
  getTitleFontSize() {
    return this.get("titleFontSize");
  }
  setTitleFontSize(v) {
    return this.set("titleFontSize", v);
  }
  getItems() {
    return this.get("items");
  }
  setItems(v) {
    return this.set("items", v);
  }
  getIcons() {
    return this.get("icons");
  }
  setIcons(v) {
    return this.set("icons", v);
  }
  getValues() {
    return this.get("values");
  }
  setValues(v) {
    return this.set("values", v);
  }
  getVisibleItemCount() {
    return this.get("visibleItemCount");
  }
  setVisibleItemCount(v) {
    return this.set("visibleItemCount", v);
  }
  getPopupDirection() {
    return this.get("popupDirection");
  }
  setPopupDirection(v) {
    return this.set("popupDirection", v);
  }
  getSound() {
    return this.get("sound");
  }
  setSound(v) {
    return this.set("sound", v);
  }
  getSoundVolumeScale() {
    return this.get("soundVolumeScale");
  }
  setSoundVolumeScale(v) {
    return this.set("soundVolumeScale", v);
  }
  getSelectedIndex() {
    return this.get("selectedIndex");
  }
  setSelectedIndex(v) {
    return this.set("selectedIndex", v);
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
};

// packages/core/src/properties/g-progress-bar.ts
var GProgressBar = class extends GComponent {
  init() {
    this.propertyType = "GProgressBar" /* G_PROGRESS_BAR */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      titleType: 0 /* Percent */,
      min: 0,
      max: 100,
      value: 0,
      reverse: false,
      sound: "",
      soundVolumeScale: 1,
      src: ""
    });
  }
  getTitleType() {
    return this.get("titleType");
  }
  setTitleType(v) {
    return this.set("titleType", v);
  }
  getMin() {
    return this.get("min");
  }
  setMin(v) {
    return this.set("min", v);
  }
  getMax() {
    return this.get("max");
  }
  setMax(v) {
    return this.set("max", v);
  }
  getValue() {
    return this.get("value");
  }
  setValue(v) {
    return this.set("value", v);
  }
  getReverse() {
    return this.get("reverse");
  }
  setReverse(v) {
    return this.set("reverse", v);
  }
  getSound() {
    return this.get("sound");
  }
  setSound(v) {
    return this.set("sound", v);
  }
  getSoundVolumeScale() {
    return this.get("soundVolumeScale");
  }
  setSoundVolumeScale(v) {
    return this.set("soundVolumeScale", v);
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
};

// packages/core/src/properties/g-slider.ts
var GSlider = class extends GComponent {
  init() {
    this.propertyType = "GSlider" /* G_SLIDER */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      titleType: 0 /* Percent */,
      min: 0,
      max: 100,
      value: 0,
      wholeNumbers: false,
      reverse: false,
      changeOnClick: true,
      canDrag: true,
      src: ""
    });
  }
  getTitleType() {
    return this.get("titleType");
  }
  setTitleType(v) {
    return this.set("titleType", v);
  }
  getMin() {
    return this.get("min");
  }
  setMin(v) {
    return this.set("min", v);
  }
  getMax() {
    return this.get("max");
  }
  setMax(v) {
    return this.set("max", v);
  }
  getValue() {
    return this.get("value");
  }
  setValue(v) {
    return this.set("value", v);
  }
  getWholeNumbers() {
    return this.get("wholeNumbers");
  }
  setWholeNumbers(v) {
    return this.set("wholeNumbers", v);
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
};

// packages/core/src/properties/g-scroll-bar.ts
var GScrollBar = class extends GComponent {
  init() {
    this.propertyType = "GScrollBar" /* G_SCROLL_BAR */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      src: "",
      fixedGripSize: false
    });
  }
  getSrc() {
    return this.get("src");
  }
  setSrc(v) {
    return this.set("src", v);
  }
  getFixedGripSize() {
    return this.get("fixedGripSize");
  }
  setFixedGripSize(v) {
    return this.set("fixedGripSize", v);
  }
};

// packages/core/src/properties/controller.ts
var Controller = class extends ExtensibleProperty {
  init() {
    this.propertyType = "Controller" /* CONTROLLER */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      selectedIndex: 0,
      autoRadioGroupDepth: false,
      pages: new RefList(),
      actions: new RefList()
    });
  }
  getSelectedIndex() {
    return this.get("selectedIndex");
  }
  setSelectedIndex(v) {
    return this.set("selectedIndex", v);
  }
  getAutoRadioGroupDepth() {
    return this.get("autoRadioGroupDepth");
  }
  setAutoRadioGroupDepth(v) {
    return this.set("autoRadioGroupDepth", v);
  }
  addPage(page) {
    return this.addRef("pages", page);
  }
  removePage(page) {
    return this.removeRef("pages", page);
  }
  listPages() {
    return this.listRefs("pages");
  }
  getPage(name) {
    return this.listPages().find((p) => p.getName() === name) || null;
  }
  addAction(action) {
    return this.addRef("actions", action);
  }
  removeAction(action) {
    return this.removeRef("actions", action);
  }
  listActions() {
    return this.listRefs("actions");
  }
};

// packages/core/src/properties/controller-page.ts
var ControllerPage = class extends Property {
  init() {
    this.propertyType = "ControllerPage" /* CONTROLLER_PAGE */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      id: ""
    });
  }
  getId() {
    return this.get("id");
  }
  setId(id) {
    return this.set("id", id);
  }
};

// packages/core/src/properties/controller-action.ts
var ControllerAction = class extends Property {
  init() {
    this.propertyType = "ControllerAction" /* CONTROLLER_ACTION */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      actionType: 0 /* PlayTransition */,
      fromPage: [],
      toPage: [],
      transitionName: "",
      playTimes: 1,
      delay: 0,
      stopOnExit: false,
      objectId: "",
      controllerName: "",
      targetPage: ""
    });
  }
  getActionType() {
    return this.get("actionType");
  }
  setActionType(v) {
    return this.set("actionType", v);
  }
  getFromPage() {
    return this.get("fromPage");
  }
  setFromPage(v) {
    return this.set("fromPage", v);
  }
  getToPage() {
    return this.get("toPage");
  }
  setToPage(v) {
    return this.set("toPage", v);
  }
  getTransitionName() {
    return this.get("transitionName");
  }
  setTransitionName(v) {
    return this.set("transitionName", v);
  }
  getPlayTimes() {
    return this.get("playTimes");
  }
  setPlayTimes(v) {
    return this.set("playTimes", v);
  }
  getDelay() {
    return this.get("delay");
  }
  setDelay(v) {
    return this.set("delay", v);
  }
  getStopOnExit() {
    return this.get("stopOnExit");
  }
  setStopOnExit(v) {
    return this.set("stopOnExit", v);
  }
  getObjectId() {
    return this.get("objectId");
  }
  setObjectId(v) {
    return this.set("objectId", v);
  }
  getControllerName() {
    return this.get("controllerName");
  }
  setControllerName(v) {
    return this.set("controllerName", v);
  }
  getTargetPage() {
    return this.get("targetPage");
  }
  setTargetPage(v) {
    return this.set("targetPage", v);
  }
};

// packages/core/src/properties/transition.ts
var Transition = class extends ExtensibleProperty {
  init() {
    this.propertyType = "Transition" /* TRANSITION */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      autoPlay: false,
      autoPlayTimes: 1,
      autoPlayDelay: 0,
      options: 0,
      fps: 24,
      items: new RefList()
    });
  }
  getAutoPlay() {
    return this.get("autoPlay");
  }
  setAutoPlay(v) {
    return this.set("autoPlay", v);
  }
  getAutoPlayTimes() {
    return this.get("autoPlayTimes");
  }
  setAutoPlayTimes(v) {
    return this.set("autoPlayTimes", v);
  }
  getAutoPlayDelay() {
    return this.get("autoPlayDelay");
  }
  setAutoPlayDelay(v) {
    return this.set("autoPlayDelay", v);
  }
  getOptions() {
    return this.get("options");
  }
  setOptions(v) {
    return this.set("options", v);
  }
  getFps() {
    return this.get("fps");
  }
  setFps(v) {
    return this.set("fps", v);
  }
  addItem(item) {
    return this.addRef("items", item);
  }
  removeItem(item) {
    return this.removeRef("items", item);
  }
  listItems() {
    return this.listRefs("items");
  }
};

// packages/core/src/properties/transition-item.ts
var TransitionItem = class extends Property {
  init() {
    this.propertyType = "TransitionItem" /* TRANSITION_ITEM */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      time: 0,
      targetId: "",
      actionType: 0 /* XY */,
      tween: false,
      duration: 0,
      startValue: [],
      endValue: [],
      easeType: 5 /* QuadOut */,
      repeat: 0,
      yoyo: false,
      label: "",
      label2: "",
      path: "",
      customEasePath: "",
      hook: "",
      hook2: ""
    });
  }
  getTime() {
    return this.get("time");
  }
  setTime(v) {
    return this.set("time", v);
  }
  getTargetId() {
    return this.get("targetId");
  }
  setTargetId(v) {
    return this.set("targetId", v);
  }
  getActionType() {
    return this.get("actionType");
  }
  setActionType(v) {
    return this.set("actionType", v);
  }
  getTween() {
    return this.get("tween");
  }
  setTween(v) {
    return this.set("tween", v);
  }
  getDuration() {
    return this.get("duration");
  }
  setDuration(v) {
    return this.set("duration", v);
  }
  getStartValue() {
    return this.get("startValue");
  }
  setStartValue(v) {
    return this.set("startValue", v);
  }
  getEndValue() {
    return this.get("endValue");
  }
  setEndValue(v) {
    return this.set("endValue", v);
  }
  getEaseType() {
    return this.get("easeType");
  }
  setEaseType(v) {
    return this.set("easeType", v);
  }
  getRepeat() {
    return this.get("repeat");
  }
  setRepeat(v) {
    return this.set("repeat", v);
  }
  getYoyo() {
    return this.get("yoyo");
  }
  setYoyo(v) {
    return this.set("yoyo", v);
  }
  getLabel() {
    return this.get("label");
  }
  setLabel(v) {
    return this.set("label", v);
  }
  getEndLabel() {
    return this.get("label2");
  }
  setEndLabel(v) {
    return this.set("label2", v);
  }
  getPath() {
    return this.get("path");
  }
  setPath(v) {
    return this.set("path", v);
  }
  getCustomEasePath() {
    return this.get("customEasePath");
  }
  setCustomEasePath(v) {
    return this.set("customEasePath", v);
  }
};

// packages/core/src/properties/gear.ts
var Gear = class extends Property {
  init() {
    this.propertyType = "Gear" /* GEAR */;
  }
  getDefaults() {
    return Object.assign(super.getDefaults(), {
      gearType: 0 /* Display */,
      controller: null,
      pages: "",
      values: "",
      condition: "",
      defaultValue: null,
      pageValues: {},
      positionsInPercent: false,
      tween: false,
      tweenDuration: 0.3,
      tweenDelay: 0,
      easeType: 5,
      customEasePath: ""
    });
  }
  getGearType() {
    return this.get("gearType");
  }
  setGearType(v) {
    return this.set("gearType", v);
  }
  getController() {
    return this.getRef("controller");
  }
  setController(ctrl) {
    return this.setRef("controller", ctrl);
  }
  getPages() {
    return this.get("pages");
  }
  setPages(v) {
    return this.set("pages", v);
  }
  getValues() {
    return this.get("values");
  }
  setValues(v) {
    return this.set("values", v);
  }
  getCondition() {
    return this.get("condition");
  }
  setCondition(v) {
    return this.set("condition", v);
  }
  getDefaultValue() {
    return this.get("defaultValue");
  }
  setDefaultValue(v) {
    return this.set("defaultValue", v);
  }
  getPageValues() {
    return this.get("pageValues");
  }
  setPageValues(v) {
    return this.set("pageValues", v);
  }
  setPageValue(pageId, value) {
    const values = { ...this.getPageValues(), [pageId]: value };
    return this.set("pageValues", values);
  }
  getPageValue(pageId) {
    return this.getPageValues()[pageId] ?? this.getDefaultValue();
  }
  getPositionsInPercent() {
    return this.get("positionsInPercent");
  }
  setPositionsInPercent(v) {
    return this.set("positionsInPercent", v);
  }
  getTween() {
    return this.get("tween");
  }
  setTween(v) {
    return this.set("tween", v);
  }
  getTweenDuration() {
    return this.get("tweenDuration");
  }
  setTweenDuration(v) {
    return this.set("tweenDuration", v);
  }
  getTweenDelay() {
    return this.get("tweenDelay");
  }
  setTweenDelay(v) {
    return this.set("tweenDelay", v);
  }
  getEaseType() {
    return this.get("easeType");
  }
  setEaseType(v) {
    return this.set("easeType", v);
  }
  getCustomEasePath() {
    return this.get("customEasePath");
  }
  setCustomEasePath(v) {
    return this.set("customEasePath", v);
  }
};

// packages/core/src/utils/logger.ts
var Verbosity = /* @__PURE__ */ ((Verbosity2) => {
  Verbosity2[Verbosity2["SILENT"] = 4] = "SILENT";
  Verbosity2[Verbosity2["ERROR"] = 3] = "ERROR";
  Verbosity2[Verbosity2["WARN"] = 2] = "WARN";
  Verbosity2[Verbosity2["INFO"] = 1] = "INFO";
  Verbosity2[Verbosity2["DEBUG"] = 0] = "DEBUG";
  return Verbosity2;
})(Verbosity || {});
var Logger = class _Logger {
  verbosity;
  static Verbosity = Verbosity;
  static DEFAULT_INSTANCE = new _Logger(1 /* INFO */);
  constructor(verbosity) {
    this.verbosity = verbosity;
  }
  debug(text) {
    if (this.verbosity <= 0 /* DEBUG */) console.debug(text);
  }
  info(text) {
    if (this.verbosity <= 1 /* INFO */) console.info(text);
  }
  warn(text) {
    if (this.verbosity <= 2 /* WARN */) console.warn(text);
  }
  error(text) {
    if (this.verbosity <= 3 /* ERROR */) console.error(text);
  }
};

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/util.js
var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
var regexName = new RegExp("^" + nameRegexp + "$");
function getAllMatches(string, regex) {
  const matches = [];
  let match = regex.exec(string);
  while (match) {
    const allmatches = [];
    allmatches.startIndex = regex.lastIndex - match[0].length;
    const len = match.length;
    for (let index = 0; index < len; index++) {
      allmatches.push(match[index]);
    }
    matches.push(allmatches);
    match = regex.exec(string);
  }
  return matches;
}
var isName = function(string) {
  const match = regexName.exec(string);
  return !(match === null || typeof match === "undefined");
};
function isExist(v) {
  return typeof v !== "undefined";
}
var DANGEROUS_PROPERTY_NAMES = [
  // '__proto__',
  // 'constructor',
  // 'prototype',
  "hasOwnProperty",
  "toString",
  "valueOf",
  "__defineGetter__",
  "__defineSetter__",
  "__lookupGetter__",
  "__lookupSetter__"
];
var criticalProperties = ["__proto__", "constructor", "prototype"];

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/validator.js
var defaultOptions = {
  allowBooleanAttributes: false,
  //A tag can have attributes without any value
  unpairedTags: []
};
function validate(xmlData, options) {
  options = Object.assign({}, defaultOptions, options);
  const tags = [];
  let tagFound = false;
  let reachedRoot = false;
  if (xmlData[0] === "\uFEFF") {
    xmlData = xmlData.substr(1);
  }
  for (let i = 0; i < xmlData.length; i++) {
    if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
      i += 2;
      i = readPI(xmlData, i);
      if (i.err) return i;
    } else if (xmlData[i] === "<") {
      let tagStartPos = i;
      i++;
      if (xmlData[i] === "!") {
        i = readCommentAndCDATA(xmlData, i);
        continue;
      } else {
        let closingTag = false;
        if (xmlData[i] === "/") {
          closingTag = true;
          i++;
        }
        let tagName = "";
        for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
          tagName += xmlData[i];
        }
        tagName = tagName.trim();
        if (tagName[tagName.length - 1] === "/") {
          tagName = tagName.substring(0, tagName.length - 1);
          i--;
        }
        if (!validateTagName(tagName)) {
          let msg;
          if (tagName.trim().length === 0) {
            msg = "Invalid space after '<'.";
          } else {
            msg = "Tag '" + tagName + "' is an invalid name.";
          }
          return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
        }
        const result = readAttributeStr(xmlData, i);
        if (result === false) {
          return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
        }
        let attrStr = result.value;
        i = result.index;
        if (attrStr[attrStr.length - 1] === "/") {
          const attrStrStart = i - attrStr.length;
          attrStr = attrStr.substring(0, attrStr.length - 1);
          const isValid = validateAttributeString(attrStr, options);
          if (isValid === true) {
            tagFound = true;
          } else {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
          }
        } else if (closingTag) {
          if (!result.tagClosed) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
          } else if (attrStr.trim().length > 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
          } else if (tags.length === 0) {
            return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
          } else {
            const otg = tags.pop();
            if (tagName !== otg.tagName) {
              let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
              return getErrorObject(
                "InvalidTag",
                "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                getLineNumberForPosition(xmlData, tagStartPos)
              );
            }
            if (tags.length == 0) {
              reachedRoot = true;
            }
          }
        } else {
          const isValid = validateAttributeString(attrStr, options);
          if (isValid !== true) {
            return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
          }
          if (reachedRoot === true) {
            return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
          } else if (options.unpairedTags.indexOf(tagName) !== -1) {
          } else {
            tags.push({ tagName, tagStartPos });
          }
          tagFound = true;
        }
        for (i++; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            if (xmlData[i + 1] === "!") {
              i++;
              i = readCommentAndCDATA(xmlData, i);
              continue;
            } else if (xmlData[i + 1] === "?") {
              i = readPI(xmlData, ++i);
              if (i.err) return i;
            } else {
              break;
            }
          } else if (xmlData[i] === "&") {
            const afterAmp = validateAmpersand(xmlData, i);
            if (afterAmp == -1)
              return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
            i = afterAmp;
          } else {
            if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
              return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
            }
          }
        }
        if (xmlData[i] === "<") {
          i--;
        }
      }
    } else {
      if (isWhiteSpace(xmlData[i])) {
        continue;
      }
      return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
    }
  }
  if (!tagFound) {
    return getErrorObject("InvalidXml", "Start tag expected.", 1);
  } else if (tags.length == 1) {
    return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
  } else if (tags.length > 0) {
    return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
  }
  return true;
}
function isWhiteSpace(char) {
  return char === " " || char === "	" || char === "\n" || char === "\r";
}
function readPI(xmlData, i) {
  const start = i;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] == "?" || xmlData[i] == " ") {
      const tagname = xmlData.substr(start, i - start);
      if (i > 5 && tagname === "xml") {
        return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
      } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
        i++;
        break;
      } else {
        continue;
      }
    }
  }
  return i;
}
function readCommentAndCDATA(xmlData, i) {
  if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
    for (i += 3; i < xmlData.length; i++) {
      if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
    let angleBracketsCount = 1;
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === "<") {
        angleBracketsCount++;
      } else if (xmlData[i] === ">") {
        angleBracketsCount--;
        if (angleBracketsCount === 0) {
          break;
        }
      }
    }
  } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
    for (i += 8; i < xmlData.length; i++) {
      if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
        i += 2;
        break;
      }
    }
  }
  return i;
}
var doubleQuote = '"';
var singleQuote = "'";
function readAttributeStr(xmlData, i) {
  let attrStr = "";
  let startChar = "";
  let tagClosed = false;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
      if (startChar === "") {
        startChar = xmlData[i];
      } else if (startChar !== xmlData[i]) {
      } else {
        startChar = "";
      }
    } else if (xmlData[i] === ">") {
      if (startChar === "") {
        tagClosed = true;
        break;
      }
    }
    attrStr += xmlData[i];
  }
  if (startChar !== "") {
    return false;
  }
  return {
    value: attrStr,
    index: i,
    tagClosed
  };
}
var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
function validateAttributeString(attrStr, options) {
  const matches = getAllMatches(attrStr, validAttrStrRegxp);
  const attrNames = {};
  for (let i = 0; i < matches.length; i++) {
    if (matches[i][1].length === 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
      return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
    } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
      return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
    }
    const attrName = matches[i][2];
    if (!validateAttrName(attrName)) {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
    }
    if (!Object.prototype.hasOwnProperty.call(attrNames, attrName)) {
      attrNames[attrName] = 1;
    } else {
      return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
    }
  }
  return true;
}
function validateNumberAmpersand(xmlData, i) {
  let re = /\d/;
  if (xmlData[i] === "x") {
    i++;
    re = /[\da-fA-F]/;
  }
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === ";")
      return i;
    if (!xmlData[i].match(re))
      break;
  }
  return -1;
}
function validateAmpersand(xmlData, i) {
  i++;
  if (xmlData[i] === ";")
    return -1;
  if (xmlData[i] === "#") {
    i++;
    return validateNumberAmpersand(xmlData, i);
  }
  let count = 0;
  for (; i < xmlData.length; i++, count++) {
    if (xmlData[i].match(/\w/) && count < 20)
      continue;
    if (xmlData[i] === ";")
      break;
    return -1;
  }
  return i;
}
function getErrorObject(code, message, lineNumber) {
  return {
    err: {
      code,
      msg: message,
      line: lineNumber.line || lineNumber,
      col: lineNumber.col
    }
  };
}
function validateAttrName(attrName) {
  return isName(attrName);
}
function validateTagName(tagname) {
  return isName(tagname);
}
function getLineNumberForPosition(xmlData, index) {
  const lines = xmlData.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length,
    // column number is last line's length + 1, because column numbering starts at 1:
    col: lines[lines.length - 1].length + 1
  };
}
function getPositionFromMatch(match) {
  return match.startIndex + match[1].length;
}

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var defaultOnDangerousProperty = (name) => {
  if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
    return "__" + name;
  }
  return name;
};
var defaultOptions2 = {
  preserveOrder: false,
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  removeNSPrefix: false,
  // remove NS from tag name or attribute name if true
  allowBooleanAttributes: false,
  //a tag can have attributes without any value
  //ignoreRootElement : false,
  parseTagValue: true,
  parseAttributeValue: false,
  trimValues: true,
  //Trim string values of tag and attributes
  cdataPropName: false,
  numberParseOptions: {
    hex: true,
    leadingZeros: true,
    eNotation: true
  },
  tagValueProcessor: function(tagName, val) {
    return val;
  },
  attributeValueProcessor: function(attrName, val) {
    return val;
  },
  stopNodes: [],
  //nested tags will not be parsed even for errors
  alwaysCreateTextNode: false,
  isArray: () => false,
  commentPropName: false,
  unpairedTags: [],
  processEntities: true,
  htmlEntities: false,
  ignoreDeclaration: false,
  ignorePiTags: false,
  transformTagName: false,
  transformAttributeName: false,
  updateTag: function(tagName, jPath, attrs) {
    return tagName;
  },
  // skipEmptyListItem: false
  captureMetaData: false,
  maxNestedTags: 100,
  strictReservedNames: true,
  jPath: true,
  // if true, pass jPath string to callbacks; if false, pass matcher instance
  onDangerousProperty: defaultOnDangerousProperty
};
function validatePropertyName(propertyName, optionName) {
  if (typeof propertyName !== "string") {
    return;
  }
  const normalized = propertyName.toLowerCase();
  if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
    throw new Error(
      `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
    );
  }
  if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
    throw new Error(
      `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
    );
  }
}
function normalizeProcessEntities(value) {
  if (typeof value === "boolean") {
    return {
      enabled: value,
      // true or false
      maxEntitySize: 1e4,
      maxExpansionDepth: 10,
      maxTotalExpansions: 1e3,
      maxExpandedLength: 1e5,
      maxEntityCount: 100,
      allowedTags: null,
      tagFilter: null
    };
  }
  if (typeof value === "object" && value !== null) {
    return {
      enabled: value.enabled !== false,
      maxEntitySize: Math.max(1, value.maxEntitySize ?? 1e4),
      maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 1e4),
      maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
      maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 1e5),
      maxEntityCount: Math.max(1, value.maxEntityCount ?? 1e3),
      allowedTags: value.allowedTags ?? null,
      tagFilter: value.tagFilter ?? null
    };
  }
  return normalizeProcessEntities(true);
}
var buildOptions = function(options) {
  const built = Object.assign({}, defaultOptions2, options);
  const propertyNameOptions = [
    { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
    { value: built.attributesGroupName, name: "attributesGroupName" },
    { value: built.textNodeName, name: "textNodeName" },
    { value: built.cdataPropName, name: "cdataPropName" },
    { value: built.commentPropName, name: "commentPropName" }
  ];
  for (const { value, name } of propertyNameOptions) {
    if (value) {
      validatePropertyName(value, name);
    }
  }
  if (built.onDangerousProperty === null) {
    built.onDangerousProperty = defaultOnDangerousProperty;
  }
  built.processEntities = normalizeProcessEntities(built.processEntities);
  if (built.stopNodes && Array.isArray(built.stopNodes)) {
    built.stopNodes = built.stopNodes.map((node) => {
      if (typeof node === "string" && node.startsWith("*.")) {
        return ".." + node.substring(2);
      }
      return node;
    });
  }
  return built;
};

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var METADATA_SYMBOL;
if (typeof Symbol !== "function") {
  METADATA_SYMBOL = "@@xmlMetadata";
} else {
  METADATA_SYMBOL = /* @__PURE__ */ Symbol("XML Node Metadata");
}
var XmlNode = class {
  constructor(tagname) {
    this.tagname = tagname;
    this.child = [];
    this[":@"] = /* @__PURE__ */ Object.create(null);
  }
  add(key, val) {
    if (key === "__proto__") key = "#__proto__";
    this.child.push({ [key]: val });
  }
  addChild(node, startIndex) {
    if (node.tagname === "__proto__") node.tagname = "#__proto__";
    if (node[":@"] && Object.keys(node[":@"]).length > 0) {
      this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
    } else {
      this.child.push({ [node.tagname]: node.child });
    }
    if (startIndex !== void 0) {
      this.child[this.child.length - 1][METADATA_SYMBOL] = { startIndex };
    }
  }
  /** symbol used for metadata */
  static getMetaDataSymbol() {
    return METADATA_SYMBOL;
  }
};

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var DocTypeReader = class {
  constructor(options) {
    this.suppressValidationErr = !options;
    this.options = options;
  }
  readDocType(xmlData, i) {
    const entities = /* @__PURE__ */ Object.create(null);
    let entityCount = 0;
    if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
      i = i + 9;
      let angleBracketsCount = 1;
      let hasBody = false, comment = false;
      let exp = "";
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && !comment) {
          if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
            i += 7;
            let entityName, val;
            [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
            if (val.indexOf("&") === -1) {
              if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                throw new Error(
                  `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                );
              }
              const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              entities[entityName] = {
                regx: RegExp(`&${escaped};`, "g"),
                val
              };
              entityCount++;
            }
          } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
            i += 8;
            const { index } = this.readElementExp(xmlData, i + 1);
            i = index;
          } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
            i += 8;
          } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
            i += 9;
            const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
            i = index;
          } else if (hasSeq(xmlData, "!--", i)) comment = true;
          else throw new Error(`Invalid DOCTYPE`);
          angleBracketsCount++;
          exp = "";
        } else if (xmlData[i] === ">") {
          if (comment) {
            if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
              comment = false;
              angleBracketsCount--;
            }
          } else {
            angleBracketsCount--;
          }
          if (angleBracketsCount === 0) {
            break;
          }
        } else if (xmlData[i] === "[") {
          hasBody = true;
        } else {
          exp += xmlData[i];
        }
      }
      if (angleBracketsCount !== 0) {
        throw new Error(`Unclosed DOCTYPE`);
      }
    } else {
      throw new Error(`Invalid Tag instead of DOCTYPE`);
    }
    return { entities, i };
  }
  readEntityExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    const startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
      i++;
    }
    let entityName = xmlData.substring(startIndex, i);
    validateEntityName(entityName);
    i = skipWhitespace(xmlData, i);
    if (!this.suppressValidationErr) {
      if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
        throw new Error("External entities are not supported");
      } else if (xmlData[i] === "%") {
        throw new Error("Parameter entities are not supported");
      }
    }
    let entityValue = "";
    [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
    if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
      throw new Error(
        `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
      );
    }
    i--;
    return [entityName, entityValue, i];
  }
  readNotationExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    const startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let notationName = xmlData.substring(startIndex, i);
    !this.suppressValidationErr && validateEntityName(notationName);
    i = skipWhitespace(xmlData, i);
    const identifierType = xmlData.substring(i, i + 6).toUpperCase();
    if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
      throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
    }
    i += identifierType.length;
    i = skipWhitespace(xmlData, i);
    let publicIdentifier = null;
    let systemIdentifier = null;
    if (identifierType === "PUBLIC") {
      [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
      i = skipWhitespace(xmlData, i);
      if (xmlData[i] === '"' || xmlData[i] === "'") {
        [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
      }
    } else if (identifierType === "SYSTEM") {
      [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
      if (!this.suppressValidationErr && !systemIdentifier) {
        throw new Error("Missing mandatory system identifier for SYSTEM notation");
      }
    }
    return { notationName, publicIdentifier, systemIdentifier, index: --i };
  }
  readIdentifierVal(xmlData, i, type) {
    let identifierVal = "";
    const startChar = xmlData[i];
    if (startChar !== '"' && startChar !== "'") {
      throw new Error(`Expected quoted string, found "${startChar}"`);
    }
    i++;
    const startIndex = i;
    while (i < xmlData.length && xmlData[i] !== startChar) {
      i++;
    }
    identifierVal = xmlData.substring(startIndex, i);
    if (xmlData[i] !== startChar) {
      throw new Error(`Unterminated ${type} value`);
    }
    i++;
    return [i, identifierVal];
  }
  readElementExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    const startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let elementName = xmlData.substring(startIndex, i);
    if (!this.suppressValidationErr && !isName(elementName)) {
      throw new Error(`Invalid element name: "${elementName}"`);
    }
    i = skipWhitespace(xmlData, i);
    let contentModel = "";
    if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) i += 4;
    else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) i += 2;
    else if (xmlData[i] === "(") {
      i++;
      const startIndex2 = i;
      while (i < xmlData.length && xmlData[i] !== ")") {
        i++;
      }
      contentModel = xmlData.substring(startIndex2, i);
      if (xmlData[i] !== ")") {
        throw new Error("Unterminated content model");
      }
    } else if (!this.suppressValidationErr) {
      throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
    }
    return {
      elementName,
      contentModel: contentModel.trim(),
      index: i
    };
  }
  readAttlistExp(xmlData, i) {
    i = skipWhitespace(xmlData, i);
    let startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let elementName = xmlData.substring(startIndex, i);
    validateEntityName(elementName);
    i = skipWhitespace(xmlData, i);
    startIndex = i;
    while (i < xmlData.length && !/\s/.test(xmlData[i])) {
      i++;
    }
    let attributeName = xmlData.substring(startIndex, i);
    if (!validateEntityName(attributeName)) {
      throw new Error(`Invalid attribute name: "${attributeName}"`);
    }
    i = skipWhitespace(xmlData, i);
    let attributeType = "";
    if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
      attributeType = "NOTATION";
      i += 8;
      i = skipWhitespace(xmlData, i);
      if (xmlData[i] !== "(") {
        throw new Error(`Expected '(', found "${xmlData[i]}"`);
      }
      i++;
      let allowedNotations = [];
      while (i < xmlData.length && xmlData[i] !== ")") {
        const startIndex2 = i;
        while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
          i++;
        }
        let notation = xmlData.substring(startIndex2, i);
        notation = notation.trim();
        if (!validateEntityName(notation)) {
          throw new Error(`Invalid notation name: "${notation}"`);
        }
        allowedNotations.push(notation);
        if (xmlData[i] === "|") {
          i++;
          i = skipWhitespace(xmlData, i);
        }
      }
      if (xmlData[i] !== ")") {
        throw new Error("Unterminated list of notations");
      }
      i++;
      attributeType += " (" + allowedNotations.join("|") + ")";
    } else {
      const startIndex2 = i;
      while (i < xmlData.length && !/\s/.test(xmlData[i])) {
        i++;
      }
      attributeType += xmlData.substring(startIndex2, i);
      const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
      if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
        throw new Error(`Invalid attribute type: "${attributeType}"`);
      }
    }
    i = skipWhitespace(xmlData, i);
    let defaultValue = "";
    if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
      defaultValue = "#REQUIRED";
      i += 8;
    } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
      defaultValue = "#IMPLIED";
      i += 7;
    } else {
      [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
    }
    return {
      elementName,
      attributeName,
      attributeType,
      defaultValue,
      index: i
    };
  }
};
var skipWhitespace = (data, index) => {
  while (index < data.length && /\s/.test(data[index])) {
    index++;
  }
  return index;
};
function hasSeq(data, seq, i) {
  for (let j = 0; j < seq.length; j++) {
    if (seq[j] !== data[i + j + 1]) return false;
  }
  return true;
}
function validateEntityName(name) {
  if (isName(name))
    return name;
  else
    throw new Error(`Invalid entity name ${name}`);
}

// node_modules/.pnpm/strnum@2.2.2/node_modules/strnum/strnum.js
var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
var consider = {
  hex: true,
  // oct: false,
  leadingZeros: true,
  decimalPoint: ".",
  eNotation: true,
  //skipLike: /regex/,
  infinity: "original"
  // "null", "infinity" (Infinity type), "string" ("Infinity" (the string literal))
};
function toNumber(str, options = {}) {
  options = Object.assign({}, consider, options);
  if (!str || typeof str !== "string") return str;
  let trimmedStr = str.trim();
  if (trimmedStr.length === 0) return str;
  else if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr)) return str;
  else if (trimmedStr === "0") return 0;
  else if (options.hex && hexRegex.test(trimmedStr)) {
    return parse_int(trimmedStr, 16);
  } else if (!isFinite(trimmedStr)) {
    return handleInfinity(str, Number(trimmedStr), options);
  } else if (trimmedStr.includes("e") || trimmedStr.includes("E")) {
    return resolveEnotation(str, trimmedStr, options);
  } else {
    const match = numRegex.exec(trimmedStr);
    if (match) {
      const sign = match[1] || "";
      const leadingZeros = match[2];
      let numTrimmedByZeros = trimZeros(match[3]);
      const decimalAdjacentToLeadingZeros = sign ? (
        // 0., -00., 000.
        str[leadingZeros.length + 1] === "."
      ) : str[leadingZeros.length] === ".";
      if (!options.leadingZeros && (leadingZeros.length > 1 || leadingZeros.length === 1 && !decimalAdjacentToLeadingZeros)) {
        return str;
      } else {
        const num = Number(trimmedStr);
        const parsedStr = String(num);
        if (num === 0) return num;
        if (parsedStr.search(/[eE]/) !== -1) {
          if (options.eNotation) return num;
          else return str;
        } else if (trimmedStr.indexOf(".") !== -1) {
          if (parsedStr === "0") return num;
          else if (parsedStr === numTrimmedByZeros) return num;
          else if (parsedStr === `${sign}${numTrimmedByZeros}`) return num;
          else return str;
        }
        let n = leadingZeros ? numTrimmedByZeros : trimmedStr;
        if (leadingZeros) {
          return n === parsedStr || sign + n === parsedStr ? num : str;
        } else {
          return n === parsedStr || n === sign + parsedStr ? num : str;
        }
      }
    } else {
      return str;
    }
  }
}
var eNotationRegx = /^([-+])?(0*)(\d*(\.\d*)?[eE][-\+]?\d+)$/;
function resolveEnotation(str, trimmedStr, options) {
  if (!options.eNotation) return str;
  const notation = trimmedStr.match(eNotationRegx);
  if (notation) {
    let sign = notation[1] || "";
    const eChar = notation[3].indexOf("e") === -1 ? "E" : "e";
    const leadingZeros = notation[2];
    const eAdjacentToLeadingZeros = sign ? (
      // 0E.
      str[leadingZeros.length + 1] === eChar
    ) : str[leadingZeros.length] === eChar;
    if (leadingZeros.length > 1 && eAdjacentToLeadingZeros) return str;
    else if (leadingZeros.length === 1 && (notation[3].startsWith(`.${eChar}`) || notation[3][0] === eChar)) {
      return Number(trimmedStr);
    } else if (leadingZeros.length > 0) {
      if (options.leadingZeros && !eAdjacentToLeadingZeros) {
        trimmedStr = (notation[1] || "") + notation[3];
        return Number(trimmedStr);
      } else return str;
    } else {
      return Number(trimmedStr);
    }
  } else {
    return str;
  }
}
function trimZeros(numStr) {
  if (numStr && numStr.indexOf(".") !== -1) {
    numStr = numStr.replace(/0+$/, "");
    if (numStr === ".") numStr = "0";
    else if (numStr[0] === ".") numStr = "0" + numStr;
    else if (numStr[numStr.length - 1] === ".") numStr = numStr.substring(0, numStr.length - 1);
    return numStr;
  }
  return numStr;
}
function parse_int(numStr, base) {
  if (parseInt) return parseInt(numStr, base);
  else if (Number.parseInt) return Number.parseInt(numStr, base);
  else if (window && window.parseInt) return window.parseInt(numStr, base);
  else throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
}
function handleInfinity(str, num, options) {
  const isPositive = num === Infinity;
  switch (options.infinity.toLowerCase()) {
    case "null":
      return null;
    case "infinity":
      return num;
    // Return Infinity or -Infinity
    case "string":
      return isPositive ? "Infinity" : "-Infinity";
    case "original":
    default:
      return str;
  }
}

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/ignoreAttributes.js
function getIgnoreAttributesFn(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/.pnpm/path-expression-matcher@1.2.1/node_modules/path-expression-matcher/src/Expression.js
var Expression = class {
  /**
   * Create a new Expression
   * @param {string} pattern - Pattern string (e.g., "root.users.user", "..user[id]")
   * @param {Object} options - Configuration options
   * @param {string} options.separator - Path separator (default: '.')
   */
  constructor(pattern, options = {}) {
    this.pattern = pattern;
    this.separator = options.separator || ".";
    this.segments = this._parse(pattern);
    this._hasDeepWildcard = this.segments.some((seg) => seg.type === "deep-wildcard");
    this._hasAttributeCondition = this.segments.some((seg) => seg.attrName !== void 0);
    this._hasPositionSelector = this.segments.some((seg) => seg.position !== void 0);
  }
  /**
   * Parse pattern string into segments
   * @private
   * @param {string} pattern - Pattern to parse
   * @returns {Array} Array of segment objects
   */
  _parse(pattern) {
    const segments = [];
    let i = 0;
    let currentPart = "";
    while (i < pattern.length) {
      if (pattern[i] === this.separator) {
        if (i + 1 < pattern.length && pattern[i + 1] === this.separator) {
          if (currentPart.trim()) {
            segments.push(this._parseSegment(currentPart.trim()));
            currentPart = "";
          }
          segments.push({ type: "deep-wildcard" });
          i += 2;
        } else {
          if (currentPart.trim()) {
            segments.push(this._parseSegment(currentPart.trim()));
          }
          currentPart = "";
          i++;
        }
      } else {
        currentPart += pattern[i];
        i++;
      }
    }
    if (currentPart.trim()) {
      segments.push(this._parseSegment(currentPart.trim()));
    }
    return segments;
  }
  /**
   * Parse a single segment
   * @private
   * @param {string} part - Segment string (e.g., "user", "ns::user", "user[id]", "ns::user:first")
   * @returns {Object} Segment object
   */
  _parseSegment(part) {
    const segment = { type: "tag" };
    let bracketContent = null;
    let withoutBrackets = part;
    const bracketMatch = part.match(/^([^\[]+)(\[[^\]]*\])(.*)$/);
    if (bracketMatch) {
      withoutBrackets = bracketMatch[1] + bracketMatch[3];
      if (bracketMatch[2]) {
        const content = bracketMatch[2].slice(1, -1);
        if (content) {
          bracketContent = content;
        }
      }
    }
    let namespace = void 0;
    let tagAndPosition = withoutBrackets;
    if (withoutBrackets.includes("::")) {
      const nsIndex = withoutBrackets.indexOf("::");
      namespace = withoutBrackets.substring(0, nsIndex).trim();
      tagAndPosition = withoutBrackets.substring(nsIndex + 2).trim();
      if (!namespace) {
        throw new Error(`Invalid namespace in pattern: ${part}`);
      }
    }
    let tag = void 0;
    let positionMatch = null;
    if (tagAndPosition.includes(":")) {
      const colonIndex = tagAndPosition.lastIndexOf(":");
      const tagPart = tagAndPosition.substring(0, colonIndex).trim();
      const posPart = tagAndPosition.substring(colonIndex + 1).trim();
      const isPositionKeyword = ["first", "last", "odd", "even"].includes(posPart) || /^nth\(\d+\)$/.test(posPart);
      if (isPositionKeyword) {
        tag = tagPart;
        positionMatch = posPart;
      } else {
        tag = tagAndPosition;
      }
    } else {
      tag = tagAndPosition;
    }
    if (!tag) {
      throw new Error(`Invalid segment pattern: ${part}`);
    }
    segment.tag = tag;
    if (namespace) {
      segment.namespace = namespace;
    }
    if (bracketContent) {
      if (bracketContent.includes("=")) {
        const eqIndex = bracketContent.indexOf("=");
        segment.attrName = bracketContent.substring(0, eqIndex).trim();
        segment.attrValue = bracketContent.substring(eqIndex + 1).trim();
      } else {
        segment.attrName = bracketContent.trim();
      }
    }
    if (positionMatch) {
      const nthMatch = positionMatch.match(/^nth\((\d+)\)$/);
      if (nthMatch) {
        segment.position = "nth";
        segment.positionValue = parseInt(nthMatch[1], 10);
      } else {
        segment.position = positionMatch;
      }
    }
    return segment;
  }
  /**
   * Get the number of segments
   * @returns {number}
   */
  get length() {
    return this.segments.length;
  }
  /**
   * Check if expression contains deep wildcard
   * @returns {boolean}
   */
  hasDeepWildcard() {
    return this._hasDeepWildcard;
  }
  /**
   * Check if expression has attribute conditions
   * @returns {boolean}
   */
  hasAttributeCondition() {
    return this._hasAttributeCondition;
  }
  /**
   * Check if expression has position selectors
   * @returns {boolean}
   */
  hasPositionSelector() {
    return this._hasPositionSelector;
  }
  /**
   * Get string representation
   * @returns {string}
   */
  toString() {
    return this.pattern;
  }
};

// node_modules/.pnpm/path-expression-matcher@1.2.1/node_modules/path-expression-matcher/src/Matcher.js
var MUTATING_METHODS = /* @__PURE__ */ new Set(["push", "pop", "reset", "updateCurrent", "restore"]);
var Matcher = class {
  /**
   * Create a new Matcher
   * @param {Object} options - Configuration options
   * @param {string} options.separator - Default path separator (default: '.')
   */
  constructor(options = {}) {
    this.separator = options.separator || ".";
    this.path = [];
    this.siblingStacks = [];
  }
  /**
   * Push a new tag onto the path
   * @param {string} tagName - Name of the tag
   * @param {Object} attrValues - Attribute key-value pairs for current node (optional)
   * @param {string} namespace - Namespace for the tag (optional)
   */
  push(tagName, attrValues = null, namespace = null) {
    this._pathStringCache = null;
    if (this.path.length > 0) {
      const prev = this.path[this.path.length - 1];
      prev.values = void 0;
    }
    const currentLevel = this.path.length;
    if (!this.siblingStacks[currentLevel]) {
      this.siblingStacks[currentLevel] = /* @__PURE__ */ new Map();
    }
    const siblings = this.siblingStacks[currentLevel];
    const siblingKey = namespace ? `${namespace}:${tagName}` : tagName;
    const counter = siblings.get(siblingKey) || 0;
    let position = 0;
    for (const count of siblings.values()) {
      position += count;
    }
    siblings.set(siblingKey, counter + 1);
    const node = {
      tag: tagName,
      position,
      counter
    };
    if (namespace !== null && namespace !== void 0) {
      node.namespace = namespace;
    }
    if (attrValues !== null && attrValues !== void 0) {
      node.values = attrValues;
    }
    this.path.push(node);
  }
  /**
   * Pop the last tag from the path
   * @returns {Object|undefined} The popped node
   */
  pop() {
    if (this.path.length === 0) {
      return void 0;
    }
    this._pathStringCache = null;
    const node = this.path.pop();
    if (this.siblingStacks.length > this.path.length + 1) {
      this.siblingStacks.length = this.path.length + 1;
    }
    return node;
  }
  /**
   * Update current node's attribute values
   * Useful when attributes are parsed after push
   * @param {Object} attrValues - Attribute values
   */
  updateCurrent(attrValues) {
    if (this.path.length > 0) {
      const current = this.path[this.path.length - 1];
      if (attrValues !== null && attrValues !== void 0) {
        current.values = attrValues;
      }
    }
  }
  /**
   * Get current tag name
   * @returns {string|undefined}
   */
  getCurrentTag() {
    return this.path.length > 0 ? this.path[this.path.length - 1].tag : void 0;
  }
  /**
   * Get current namespace
   * @returns {string|undefined}
   */
  getCurrentNamespace() {
    return this.path.length > 0 ? this.path[this.path.length - 1].namespace : void 0;
  }
  /**
   * Get current node's attribute value
   * @param {string} attrName - Attribute name
   * @returns {*} Attribute value or undefined
   */
  getAttrValue(attrName) {
    if (this.path.length === 0) return void 0;
    const current = this.path[this.path.length - 1];
    return current.values?.[attrName];
  }
  /**
   * Check if current node has an attribute
   * @param {string} attrName - Attribute name
   * @returns {boolean}
   */
  hasAttr(attrName) {
    if (this.path.length === 0) return false;
    const current = this.path[this.path.length - 1];
    return current.values !== void 0 && attrName in current.values;
  }
  /**
   * Get current node's sibling position (child index in parent)
   * @returns {number}
   */
  getPosition() {
    if (this.path.length === 0) return -1;
    return this.path[this.path.length - 1].position ?? 0;
  }
  /**
   * Get current node's repeat counter (occurrence count of this tag name)
   * @returns {number}
   */
  getCounter() {
    if (this.path.length === 0) return -1;
    return this.path[this.path.length - 1].counter ?? 0;
  }
  /**
   * Get current node's sibling index (alias for getPosition for backward compatibility)
   * @returns {number}
   * @deprecated Use getPosition() or getCounter() instead
   */
  getIndex() {
    return this.getPosition();
  }
  /**
   * Get current path depth
   * @returns {number}
   */
  getDepth() {
    return this.path.length;
  }
  /**
   * Get path as string
   * @param {string} separator - Optional separator (uses default if not provided)
   * @param {boolean} includeNamespace - Whether to include namespace in output (default: true)
   * @returns {string}
   */
  toString(separator, includeNamespace = true) {
    const sep = separator || this.separator;
    const isDefault = sep === this.separator && includeNamespace === true;
    if (isDefault) {
      if (this._pathStringCache !== null && this._pathStringCache !== void 0) {
        return this._pathStringCache;
      }
      const result = this.path.map(
        (n) => includeNamespace && n.namespace ? `${n.namespace}:${n.tag}` : n.tag
      ).join(sep);
      this._pathStringCache = result;
      return result;
    }
    return this.path.map(
      (n) => includeNamespace && n.namespace ? `${n.namespace}:${n.tag}` : n.tag
    ).join(sep);
  }
  /**
   * Get path as array of tag names
   * @returns {string[]}
   */
  toArray() {
    return this.path.map((n) => n.tag);
  }
  /**
   * Reset the path to empty
   */
  reset() {
    this._pathStringCache = null;
    this.path = [];
    this.siblingStacks = [];
  }
  /**
   * Match current path against an Expression
   * @param {Expression} expression - The expression to match against
   * @returns {boolean} True if current path matches the expression
   */
  matches(expression) {
    const segments = expression.segments;
    if (segments.length === 0) {
      return false;
    }
    if (expression.hasDeepWildcard()) {
      return this._matchWithDeepWildcard(segments);
    }
    return this._matchSimple(segments);
  }
  /**
   * Match simple path (no deep wildcards)
   * @private
   */
  _matchSimple(segments) {
    if (this.path.length !== segments.length) {
      return false;
    }
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const node = this.path[i];
      const isCurrentNode = i === this.path.length - 1;
      if (!this._matchSegment(segment, node, isCurrentNode)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Match path with deep wildcards
   * @private
   */
  _matchWithDeepWildcard(segments) {
    let pathIdx = this.path.length - 1;
    let segIdx = segments.length - 1;
    while (segIdx >= 0 && pathIdx >= 0) {
      const segment = segments[segIdx];
      if (segment.type === "deep-wildcard") {
        segIdx--;
        if (segIdx < 0) {
          return true;
        }
        const nextSeg = segments[segIdx];
        let found = false;
        for (let i = pathIdx; i >= 0; i--) {
          const isCurrentNode = i === this.path.length - 1;
          if (this._matchSegment(nextSeg, this.path[i], isCurrentNode)) {
            pathIdx = i - 1;
            segIdx--;
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      } else {
        const isCurrentNode = pathIdx === this.path.length - 1;
        if (!this._matchSegment(segment, this.path[pathIdx], isCurrentNode)) {
          return false;
        }
        pathIdx--;
        segIdx--;
      }
    }
    return segIdx < 0;
  }
  /**
   * Match a single segment against a node
   * @private
   * @param {Object} segment - Segment from Expression
   * @param {Object} node - Node from path
   * @param {boolean} isCurrentNode - Whether this is the current (last) node
   * @returns {boolean}
   */
  _matchSegment(segment, node, isCurrentNode) {
    if (segment.tag !== "*" && segment.tag !== node.tag) {
      return false;
    }
    if (segment.namespace !== void 0) {
      if (segment.namespace !== "*" && segment.namespace !== node.namespace) {
        return false;
      }
    }
    if (segment.attrName !== void 0) {
      if (!isCurrentNode) {
        return false;
      }
      if (!node.values || !(segment.attrName in node.values)) {
        return false;
      }
      if (segment.attrValue !== void 0) {
        const actualValue = node.values[segment.attrName];
        if (String(actualValue) !== String(segment.attrValue)) {
          return false;
        }
      }
    }
    if (segment.position !== void 0) {
      if (!isCurrentNode) {
        return false;
      }
      const counter = node.counter ?? 0;
      if (segment.position === "first" && counter !== 0) {
        return false;
      } else if (segment.position === "odd" && counter % 2 !== 1) {
        return false;
      } else if (segment.position === "even" && counter % 2 !== 0) {
        return false;
      } else if (segment.position === "nth") {
        if (counter !== segment.positionValue) {
          return false;
        }
      }
    }
    return true;
  }
  /**
   * Create a snapshot of current state
   * @returns {Object} State snapshot
   */
  snapshot() {
    return {
      path: this.path.map((node) => ({ ...node })),
      siblingStacks: this.siblingStacks.map((map) => new Map(map))
    };
  }
  /**
   * Restore state from snapshot
   * @param {Object} snapshot - State snapshot
   */
  restore(snapshot) {
    this._pathStringCache = null;
    this.path = snapshot.path.map((node) => ({ ...node }));
    this.siblingStacks = snapshot.siblingStacks.map((map) => new Map(map));
  }
  /**
   * Return a read-only view of this matcher.
   *
   * The returned object exposes all query/inspection methods but throws a
   * TypeError if any state-mutating method is called (`push`, `pop`, `reset`,
   * `updateCurrent`, `restore`).  Property reads (e.g. `.path`, `.separator`)
   * are allowed but the returned arrays/objects are frozen so callers cannot
   * mutate internal state through them either.
   *
   * @returns {ReadOnlyMatcher} A proxy that forwards read operations and blocks writes.
   *
   * @example
   * const matcher = new Matcher();
   * matcher.push("root", {});
   *
   * const ro = matcher.readOnly();
   * ro.matches(expr);      // ✓ works
   * ro.getCurrentTag();    // ✓ works
   * ro.push("child", {}); // ✗ throws TypeError
   * ro.reset();            // ✗ throws TypeError
   */
  readOnly() {
    const self = this;
    return new Proxy(self, {
      get(target, prop, receiver) {
        if (MUTATING_METHODS.has(prop)) {
          return () => {
            throw new TypeError(
              `Cannot call '${prop}' on a read-only Matcher. Obtain a writable instance to mutate state.`
            );
          };
        }
        const value = Reflect.get(target, prop, receiver);
        if (prop === "path" || prop === "siblingStacks") {
          return Object.freeze(
            Array.isArray(value) ? value.map(
              (item) => item instanceof Map ? Object.freeze(new Map(item)) : Object.freeze({ ...item })
              // freeze a copy of each node
            ) : value
          );
        }
        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      },
      // Prevent any property assignment on the read-only view
      set(_target, prop) {
        throw new TypeError(
          `Cannot set property '${String(prop)}' on a read-only Matcher.`
        );
      },
      // Prevent property deletion
      deleteProperty(_target, prop) {
        throw new TypeError(
          `Cannot delete property '${String(prop)}' from a read-only Matcher.`
        );
      }
    });
  }
};

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
function extractRawAttributes(prefixedAttrs, options) {
  if (!prefixedAttrs) return {};
  const attrs = options.attributesGroupName ? prefixedAttrs[options.attributesGroupName] : prefixedAttrs;
  if (!attrs) return {};
  const rawAttrs = {};
  for (const key in attrs) {
    if (key.startsWith(options.attributeNamePrefix)) {
      const rawName = key.substring(options.attributeNamePrefix.length);
      rawAttrs[rawName] = attrs[key];
    } else {
      rawAttrs[key] = attrs[key];
    }
  }
  return rawAttrs;
}
function extractNamespace(rawTagName) {
  if (!rawTagName || typeof rawTagName !== "string") return void 0;
  const colonIndex = rawTagName.indexOf(":");
  if (colonIndex !== -1 && colonIndex > 0) {
    const ns = rawTagName.substring(0, colonIndex);
    if (ns !== "xmlns") {
      return ns;
    }
  }
  return void 0;
}
var OrderedObjParser = class {
  constructor(options) {
    this.options = options;
    this.currentNode = null;
    this.tagsNodeStack = [];
    this.docTypeEntities = {};
    this.lastEntities = {
      "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
      "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
      "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
      "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
    };
    this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
    this.htmlEntities = {
      "space": { regex: /&(nbsp|#160);/g, val: " " },
      // "lt" : { regex: /&(lt|#60);/g, val: "<" },
      // "gt" : { regex: /&(gt|#62);/g, val: ">" },
      // "amp" : { regex: /&(amp|#38);/g, val: "&" },
      // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
      // "apos" : { regex: /&(apos|#39);/g, val: "'" },
      "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
      "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
      "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
      "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
      "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
      "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
      "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
      "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => fromCodePoint(str, 10, "&#") },
      "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => fromCodePoint(str, 16, "&#x") }
    };
    this.addExternalEntities = addExternalEntities;
    this.parseXml = parseXml;
    this.parseTextData = parseTextData;
    this.resolveNameSpace = resolveNameSpace;
    this.buildAttributesMap = buildAttributesMap;
    this.isItStopNode = isItStopNode;
    this.replaceEntitiesValue = replaceEntitiesValue;
    this.readStopNodeData = readStopNodeData;
    this.saveTextToParentTag = saveTextToParentTag;
    this.addChild = addChild;
    this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
    this.entityExpansionCount = 0;
    this.currentExpandedLength = 0;
    this.matcher = new Matcher();
    this.readonlyMatcher = this.matcher.readOnly();
    this.isCurrentNodeStopNode = false;
    if (this.options.stopNodes && this.options.stopNodes.length > 0) {
      this.stopNodeExpressions = [];
      for (let i = 0; i < this.options.stopNodes.length; i++) {
        const stopNodeExp = this.options.stopNodes[i];
        if (typeof stopNodeExp === "string") {
          this.stopNodeExpressions.push(new Expression(stopNodeExp));
        } else if (stopNodeExp instanceof Expression) {
          this.stopNodeExpressions.push(stopNodeExp);
        }
      }
    }
  }
};
function addExternalEntities(externalEntities) {
  const entKeys = Object.keys(externalEntities);
  for (let i = 0; i < entKeys.length; i++) {
    const ent = entKeys[i];
    const escaped = ent.replace(/[.\-+*:]/g, "\\.");
    this.lastEntities[ent] = {
      regex: new RegExp("&" + escaped + ";", "g"),
      val: externalEntities[ent]
    };
  }
}
function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
  if (val !== void 0) {
    if (this.options.trimValues && !dontTrim) {
      val = val.trim();
    }
    if (val.length > 0) {
      if (!escapeEntities) val = this.replaceEntitiesValue(val, tagName, jPath);
      const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
      const newval = this.options.tagValueProcessor(tagName, val, jPathOrMatcher, hasAttributes, isLeafNode);
      if (newval === null || newval === void 0) {
        return val;
      } else if (typeof newval !== typeof val || newval !== val) {
        return newval;
      } else if (this.options.trimValues) {
        return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
      } else {
        const trimmedVal = val.trim();
        if (trimmedVal === val) {
          return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
        } else {
          return val;
        }
      }
    }
  }
}
function resolveNameSpace(tagname) {
  if (this.options.removeNSPrefix) {
    const tags = tagname.split(":");
    const prefix = tagname.charAt(0) === "/" ? "/" : "";
    if (tags[0] === "xmlns") {
      return "";
    }
    if (tags.length === 2) {
      tagname = prefix + tags[1];
    }
  }
  return tagname;
}
var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
function buildAttributesMap(attrStr, jPath, tagName) {
  if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
    const matches = getAllMatches(attrStr, attrsRegx);
    const len = matches.length;
    const attrs = {};
    const processedVals = new Array(len);
    let hasRawAttrs = false;
    const rawAttrsForMatcher = {};
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      const oldVal = matches[i][4];
      if (attrName.length && oldVal !== void 0) {
        let val = oldVal;
        if (this.options.trimValues) val = val.trim();
        val = this.replaceEntitiesValue(val, tagName, this.readonlyMatcher);
        processedVals[i] = val;
        rawAttrsForMatcher[attrName] = val;
        hasRawAttrs = true;
      }
    }
    if (hasRawAttrs && typeof jPath === "object" && jPath.updateCurrent) {
      jPath.updateCurrent(rawAttrsForMatcher);
    }
    const jPathStr = this.options.jPath ? jPath.toString() : this.readonlyMatcher;
    let hasAttrs = false;
    for (let i = 0; i < len; i++) {
      const attrName = this.resolveNameSpace(matches[i][1]);
      if (this.ignoreAttributesFn(attrName, jPathStr)) continue;
      let aName = this.options.attributeNamePrefix + attrName;
      if (attrName.length) {
        if (this.options.transformAttributeName) {
          aName = this.options.transformAttributeName(aName);
        }
        aName = sanitizeName(aName, this.options);
        if (matches[i][4] !== void 0) {
          const oldVal = processedVals[i];
          const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPathStr);
          if (newVal === null || newVal === void 0) {
            attrs[aName] = oldVal;
          } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
            attrs[aName] = newVal;
          } else {
            attrs[aName] = parseValue(oldVal, this.options.parseAttributeValue, this.options.numberParseOptions);
          }
          hasAttrs = true;
        } else if (this.options.allowBooleanAttributes) {
          attrs[aName] = true;
          hasAttrs = true;
        }
      }
    }
    if (!hasAttrs) return;
    if (this.options.attributesGroupName) {
      const attrCollection = {};
      attrCollection[this.options.attributesGroupName] = attrs;
      return attrCollection;
    }
    return attrs;
  }
}
var parseXml = function(xmlData) {
  xmlData = xmlData.replace(/\r\n?/g, "\n");
  const xmlObj = new XmlNode("!xml");
  let currentNode = xmlObj;
  let textData = "";
  this.matcher.reset();
  this.entityExpansionCount = 0;
  this.currentExpandedLength = 0;
  const docTypeReader = new DocTypeReader(this.options.processEntities);
  for (let i = 0; i < xmlData.length; i++) {
    const ch = xmlData[i];
    if (ch === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
        let tagName = xmlData.substring(i + 2, closeIndex).trim();
        if (this.options.removeNSPrefix) {
          const colonIndex = tagName.indexOf(":");
          if (colonIndex !== -1) {
            tagName = tagName.substr(colonIndex + 1);
          }
        }
        tagName = transformTagName(this.options.transformTagName, tagName, "", this.options).tagName;
        if (currentNode) {
          textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
        }
        const lastTagName = this.matcher.getCurrentTag();
        if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
          throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
        }
        if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
          this.matcher.pop();
          this.tagsNodeStack.pop();
        }
        this.matcher.pop();
        this.isCurrentNodeStopNode = false;
        currentNode = this.tagsNodeStack.pop();
        textData = "";
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        let tagData = readTagExp(xmlData, i, false, "?>");
        if (!tagData) throw new Error("Pi Tag is not closed.");
        textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
        if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
        } else {
          const childNode = new XmlNode(tagData.tagName);
          childNode.add(this.options.textNodeName, "");
          if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
            childNode[":@"] = this.buildAttributesMap(tagData.tagExp, this.matcher, tagData.tagName);
          }
          this.addChild(currentNode, childNode, this.readonlyMatcher, i);
        }
        i = tagData.closeIndex + 1;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
        if (this.options.commentPropName) {
          const comment = xmlData.substring(i + 4, endIndex - 2);
          textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
          currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
        }
        i = endIndex;
      } else if (xmlData.substr(i + 1, 2) === "!D") {
        const result = docTypeReader.readDocType(xmlData, i);
        this.docTypeEntities = result.entities;
        i = result.i;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
        const tagExp = xmlData.substring(i + 9, closeIndex);
        textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher);
        let val = this.parseTextData(tagExp, currentNode.tagname, this.readonlyMatcher, true, false, true, true);
        if (val == void 0) val = "";
        if (this.options.cdataPropName) {
          currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
        } else {
          currentNode.add(this.options.textNodeName, val);
        }
        i = closeIndex + 2;
      } else {
        let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
        if (!result) {
          const context = xmlData.substring(Math.max(0, i - 50), Math.min(xmlData.length, i + 50));
          throw new Error(`readTagExp returned undefined at position ${i}. Context: "${context}"`);
        }
        let tagName = result.tagName;
        const rawTagName = result.rawTagName;
        let tagExp = result.tagExp;
        let attrExpPresent = result.attrExpPresent;
        let closeIndex = result.closeIndex;
        ({ tagName, tagExp } = transformTagName(this.options.transformTagName, tagName, tagExp, this.options));
        if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName || tagName === this.options.textNodeName || tagName === this.options.attributesGroupName)) {
          throw new Error(`Invalid tag name: ${tagName}`);
        }
        if (currentNode && textData) {
          if (currentNode.tagname !== "!xml") {
            textData = this.saveTextToParentTag(textData, currentNode, this.readonlyMatcher, false);
          }
        }
        const lastTag = currentNode;
        if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
          currentNode = this.tagsNodeStack.pop();
          this.matcher.pop();
        }
        let isSelfClosing = false;
        if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
          isSelfClosing = true;
          if (tagName[tagName.length - 1] === "/") {
            tagName = tagName.substr(0, tagName.length - 1);
            tagExp = tagName;
          } else {
            tagExp = tagExp.substr(0, tagExp.length - 1);
          }
          attrExpPresent = tagName !== tagExp;
        }
        let prefixedAttrs = null;
        let rawAttrs = {};
        let namespace = void 0;
        namespace = extractNamespace(rawTagName);
        if (tagName !== xmlObj.tagname) {
          this.matcher.push(tagName, {}, namespace);
        }
        if (tagName !== tagExp && attrExpPresent) {
          prefixedAttrs = this.buildAttributesMap(tagExp, this.matcher, tagName);
          if (prefixedAttrs) {
            rawAttrs = extractRawAttributes(prefixedAttrs, this.options);
          }
        }
        if (tagName !== xmlObj.tagname) {
          this.isCurrentNodeStopNode = this.isItStopNode(this.stopNodeExpressions, this.matcher);
        }
        const startIndex = i;
        if (this.isCurrentNodeStopNode) {
          let tagContent = "";
          if (isSelfClosing) {
            i = result.closeIndex;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            i = result.closeIndex;
          } else {
            const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
            if (!result2) throw new Error(`Unexpected end of ${rawTagName}`);
            i = result2.i;
            tagContent = result2.tagContent;
          }
          const childNode = new XmlNode(tagName);
          if (prefixedAttrs) {
            childNode[":@"] = prefixedAttrs;
          }
          childNode.add(this.options.textNodeName, tagContent);
          this.matcher.pop();
          this.isCurrentNodeStopNode = false;
          this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
        } else {
          if (isSelfClosing) {
            ({ tagName, tagExp } = transformTagName(this.options.transformTagName, tagName, tagExp, this.options));
            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
            this.matcher.pop();
            this.isCurrentNodeStopNode = false;
          } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
            const childNode = new XmlNode(tagName);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
            this.matcher.pop();
            this.isCurrentNodeStopNode = false;
            i = result.closeIndex;
            continue;
          } else {
            const childNode = new XmlNode(tagName);
            if (this.tagsNodeStack.length > this.options.maxNestedTags) {
              throw new Error("Maximum nested tags exceeded");
            }
            this.tagsNodeStack.push(currentNode);
            if (prefixedAttrs) {
              childNode[":@"] = prefixedAttrs;
            }
            this.addChild(currentNode, childNode, this.readonlyMatcher, startIndex);
            currentNode = childNode;
          }
          textData = "";
          i = closeIndex;
        }
      }
    } else {
      textData += xmlData[i];
    }
  }
  return xmlObj.child;
};
function addChild(currentNode, childNode, matcher, startIndex) {
  if (!this.options.captureMetaData) startIndex = void 0;
  const jPathOrMatcher = this.options.jPath ? matcher.toString() : matcher;
  const result = this.options.updateTag(childNode.tagname, jPathOrMatcher, childNode[":@"]);
  if (result === false) {
  } else if (typeof result === "string") {
    childNode.tagname = result;
    currentNode.addChild(childNode, startIndex);
  } else {
    currentNode.addChild(childNode, startIndex);
  }
}
function replaceEntitiesValue(val, tagName, jPath) {
  const entityConfig = this.options.processEntities;
  if (!entityConfig || !entityConfig.enabled) {
    return val;
  }
  if (entityConfig.allowedTags) {
    const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
    const allowed = Array.isArray(entityConfig.allowedTags) ? entityConfig.allowedTags.includes(tagName) : entityConfig.allowedTags(tagName, jPathOrMatcher);
    if (!allowed) {
      return val;
    }
  }
  if (entityConfig.tagFilter) {
    const jPathOrMatcher = this.options.jPath ? jPath.toString() : jPath;
    if (!entityConfig.tagFilter(tagName, jPathOrMatcher)) {
      return val;
    }
  }
  for (const entityName of Object.keys(this.docTypeEntities)) {
    const entity = this.docTypeEntities[entityName];
    const matches = val.match(entity.regx);
    if (matches) {
      this.entityExpansionCount += matches.length;
      if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
        throw new Error(
          `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
        );
      }
      const lengthBefore = val.length;
      val = val.replace(entity.regx, entity.val);
      if (entityConfig.maxExpandedLength) {
        this.currentExpandedLength += val.length - lengthBefore;
        if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
          throw new Error(
            `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
          );
        }
      }
    }
  }
  if (val.indexOf("&") === -1) return val;
  for (const entityName of Object.keys(this.lastEntities)) {
    const entity = this.lastEntities[entityName];
    const matches = val.match(entity.regex);
    if (matches) {
      this.entityExpansionCount += matches.length;
      if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
        throw new Error(
          `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
        );
      }
    }
    val = val.replace(entity.regex, entity.val);
  }
  if (val.indexOf("&") === -1) return val;
  if (this.options.htmlEntities) {
    for (const entityName of Object.keys(this.htmlEntities)) {
      const entity = this.htmlEntities[entityName];
      const matches = val.match(entity.regex);
      if (matches) {
        this.entityExpansionCount += matches.length;
        if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
          throw new Error(
            `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
          );
        }
      }
      val = val.replace(entity.regex, entity.val);
    }
  }
  val = val.replace(this.ampEntity.regex, this.ampEntity.val);
  return val;
}
function saveTextToParentTag(textData, parentNode, matcher, isLeafNode) {
  if (textData) {
    if (isLeafNode === void 0) isLeafNode = parentNode.child.length === 0;
    textData = this.parseTextData(
      textData,
      parentNode.tagname,
      matcher,
      false,
      parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
      isLeafNode
    );
    if (textData !== void 0 && textData !== "")
      parentNode.add(this.options.textNodeName, textData);
    textData = "";
  }
  return textData;
}
function isItStopNode(stopNodeExpressions, matcher) {
  if (!stopNodeExpressions || stopNodeExpressions.length === 0) return false;
  for (let i = 0; i < stopNodeExpressions.length; i++) {
    if (matcher.matches(stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
}
function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
  let attrBoundary;
  let tagExp = "";
  for (let index = i; index < xmlData.length; index++) {
    let ch = xmlData[index];
    if (attrBoundary) {
      if (ch === attrBoundary) attrBoundary = "";
    } else if (ch === '"' || ch === "'") {
      attrBoundary = ch;
    } else if (ch === closingChar[0]) {
      if (closingChar[1]) {
        if (xmlData[index + 1] === closingChar[1]) {
          return {
            data: tagExp,
            index
          };
        }
      } else {
        return {
          data: tagExp,
          index
        };
      }
    } else if (ch === "	") {
      ch = " ";
    }
    tagExp += ch;
  }
}
function findClosingIndex(xmlData, str, i, errMsg) {
  const closingIndex = xmlData.indexOf(str, i);
  if (closingIndex === -1) {
    throw new Error(errMsg);
  } else {
    return closingIndex + str.length - 1;
  }
}
function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
  const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
  if (!result) return;
  let tagExp = result.data;
  const closeIndex = result.index;
  const separatorIndex = tagExp.search(/\s/);
  let tagName = tagExp;
  let attrExpPresent = true;
  if (separatorIndex !== -1) {
    tagName = tagExp.substring(0, separatorIndex);
    tagExp = tagExp.substring(separatorIndex + 1).trimStart();
  }
  const rawTagName = tagName;
  if (removeNSPrefix) {
    const colonIndex = tagName.indexOf(":");
    if (colonIndex !== -1) {
      tagName = tagName.substr(colonIndex + 1);
      attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
    }
  }
  return {
    tagName,
    tagExp,
    closeIndex,
    attrExpPresent,
    rawTagName
  };
}
function readStopNodeData(xmlData, tagName, i) {
  const startIndex = i;
  let openTagCount = 1;
  for (; i < xmlData.length; i++) {
    if (xmlData[i] === "<") {
      if (xmlData[i + 1] === "/") {
        const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
        let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
        if (closeTagName === tagName) {
          openTagCount--;
          if (openTagCount === 0) {
            return {
              tagContent: xmlData.substring(startIndex, i),
              i: closeIndex
            };
          }
        }
        i = closeIndex;
      } else if (xmlData[i + 1] === "?") {
        const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 3) === "!--") {
        const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
        i = closeIndex;
      } else if (xmlData.substr(i + 1, 2) === "![") {
        const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
        i = closeIndex;
      } else {
        const tagData = readTagExp(xmlData, i, ">");
        if (tagData) {
          const openTagName = tagData && tagData.tagName;
          if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
            openTagCount++;
          }
          i = tagData.closeIndex;
        }
      }
    }
  }
}
function parseValue(val, shouldParse, options) {
  if (shouldParse && typeof val === "string") {
    const newval = val.trim();
    if (newval === "true") return true;
    else if (newval === "false") return false;
    else return toNumber(val, options);
  } else {
    if (isExist(val)) {
      return val;
    } else {
      return "";
    }
  }
}
function fromCodePoint(str, base, prefix) {
  const codePoint = Number.parseInt(str, base);
  if (codePoint >= 0 && codePoint <= 1114111) {
    return String.fromCodePoint(codePoint);
  } else {
    return prefix + str + ";";
  }
}
function transformTagName(fn, tagName, tagExp, options) {
  if (fn) {
    const newTagName = fn(tagName);
    if (tagExp === tagName) {
      tagExp = newTagName;
    }
    tagName = newTagName;
  }
  tagName = sanitizeName(tagName, options);
  return { tagName, tagExp };
}
function sanitizeName(name, options) {
  if (criticalProperties.includes(name)) {
    throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
  } else if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
    return options.onDangerousProperty(name);
  }
  return name;
}

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlparser/node2json.js
var METADATA_SYMBOL2 = XmlNode.getMetaDataSymbol();
function stripAttributePrefix(attrs, prefix) {
  if (!attrs || typeof attrs !== "object") return {};
  if (!prefix) return attrs;
  const rawAttrs = {};
  for (const key in attrs) {
    if (key.startsWith(prefix)) {
      const rawName = key.substring(prefix.length);
      rawAttrs[rawName] = attrs[key];
    } else {
      rawAttrs[key] = attrs[key];
    }
  }
  return rawAttrs;
}
function prettify(node, options, matcher, readonlyMatcher) {
  return compress(node, options, matcher, readonlyMatcher);
}
function compress(arr, options, matcher, readonlyMatcher) {
  let text;
  const compressedObj = {};
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const property = propName(tagObj);
    if (property !== void 0 && property !== options.textNodeName) {
      const rawAttrs = stripAttributePrefix(
        tagObj[":@"] || {},
        options.attributeNamePrefix
      );
      matcher.push(property, rawAttrs);
    }
    if (property === options.textNodeName) {
      if (text === void 0) text = tagObj[property];
      else text += "" + tagObj[property];
    } else if (property === void 0) {
      continue;
    } else if (tagObj[property]) {
      let val = compress(tagObj[property], options, matcher, readonlyMatcher);
      const isLeaf = isLeafTag(val, options);
      if (tagObj[":@"]) {
        assignAttributes(val, tagObj[":@"], readonlyMatcher, options);
      } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
        val = val[options.textNodeName];
      } else if (Object.keys(val).length === 0) {
        if (options.alwaysCreateTextNode) val[options.textNodeName] = "";
        else val = "";
      }
      if (tagObj[METADATA_SYMBOL2] !== void 0 && typeof val === "object" && val !== null) {
        val[METADATA_SYMBOL2] = tagObj[METADATA_SYMBOL2];
      }
      if (compressedObj[property] !== void 0 && Object.prototype.hasOwnProperty.call(compressedObj, property)) {
        if (!Array.isArray(compressedObj[property])) {
          compressedObj[property] = [compressedObj[property]];
        }
        compressedObj[property].push(val);
      } else {
        const jPathOrMatcher = options.jPath ? readonlyMatcher.toString() : readonlyMatcher;
        if (options.isArray(property, jPathOrMatcher, isLeaf)) {
          compressedObj[property] = [val];
        } else {
          compressedObj[property] = val;
        }
      }
      if (property !== void 0 && property !== options.textNodeName) {
        matcher.pop();
      }
    }
  }
  if (typeof text === "string") {
    if (text.length > 0) compressedObj[options.textNodeName] = text;
  } else if (text !== void 0) compressedObj[options.textNodeName] = text;
  return compressedObj;
}
function propName(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key !== ":@") return key;
  }
}
function assignAttributes(obj, attrMap, readonlyMatcher, options) {
  if (attrMap) {
    const keys = Object.keys(attrMap);
    const len = keys.length;
    for (let i = 0; i < len; i++) {
      const atrrName = keys[i];
      const rawAttrName = atrrName.startsWith(options.attributeNamePrefix) ? atrrName.substring(options.attributeNamePrefix.length) : atrrName;
      const jPathOrMatcher = options.jPath ? readonlyMatcher.toString() + "." + rawAttrName : readonlyMatcher;
      if (options.isArray(atrrName, jPathOrMatcher, true, true)) {
        obj[atrrName] = [attrMap[atrrName]];
      } else {
        obj[atrrName] = attrMap[atrrName];
      }
    }
  }
}
function isLeafTag(obj, options) {
  const { textNodeName } = options;
  const propCount = Object.keys(obj).length;
  if (propCount === 0) {
    return true;
  }
  if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
    return true;
  }
  return false;
}

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var XMLParser = class {
  constructor(options) {
    this.externalEntities = {};
    this.options = buildOptions(options);
  }
  /**
   * Parse XML dats to JS object 
   * @param {string|Uint8Array} xmlData 
   * @param {boolean|Object} validationOption 
   */
  parse(xmlData, validationOption) {
    if (typeof xmlData !== "string" && xmlData.toString) {
      xmlData = xmlData.toString();
    } else if (typeof xmlData !== "string") {
      throw new Error("XML data is accepted in String or Bytes[] form.");
    }
    if (validationOption) {
      if (validationOption === true) validationOption = {};
      const result = validate(xmlData, validationOption);
      if (result !== true) {
        throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
      }
    }
    const orderedObjParser = new OrderedObjParser(this.options);
    orderedObjParser.addExternalEntities(this.externalEntities);
    const orderedResult = orderedObjParser.parseXml(xmlData);
    if (this.options.preserveOrder || orderedResult === void 0) return orderedResult;
    else return prettify(orderedResult, this.options, orderedObjParser.matcher, orderedObjParser.readonlyMatcher);
  }
  /**
   * Add Entity which is not by default supported by this library
   * @param {string} key 
   * @param {string} value 
   */
  addEntity(key, value) {
    if (value.indexOf("&") !== -1) {
      throw new Error("Entity value can't have '&'");
    } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
      throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
    } else if (value === "&") {
      throw new Error("An entity with value '&' is not permitted");
    } else {
      this.externalEntities[key] = value;
    }
  }
  /**
   * Returns a Symbol that can be used to access the metadata
   * property on a node.
   * 
   * If Symbol is not available in the environment, an ordinary property is used
   * and the name of the property is here returned.
   * 
   * The XMLMetaData property is only present when `captureMetaData`
   * is true in the options.
   */
  static getMetaDataSymbol() {
    return XmlNode.getMetaDataSymbol();
  }
};

// node_modules/.pnpm/fast-xml-builder@1.1.4/node_modules/fast-xml-builder/src/orderedJs2Xml.js
var EOL = "\n";
function toXml(jArray, options) {
  let indentation = "";
  if (options.format && options.indentBy.length > 0) {
    indentation = EOL;
  }
  const stopNodeExpressions = [];
  if (options.stopNodes && Array.isArray(options.stopNodes)) {
    for (let i = 0; i < options.stopNodes.length; i++) {
      const node = options.stopNodes[i];
      if (typeof node === "string") {
        stopNodeExpressions.push(new Expression(node));
      } else if (node instanceof Expression) {
        stopNodeExpressions.push(node);
      }
    }
  }
  const matcher = new Matcher();
  return arrToStr(jArray, options, indentation, matcher, stopNodeExpressions);
}
function arrToStr(arr, options, indentation, matcher, stopNodeExpressions) {
  let xmlStr = "";
  let isPreviousElementTag = false;
  if (options.maxNestedTags && matcher.getDepth() > options.maxNestedTags) {
    throw new Error("Maximum nested tags exceeded");
  }
  if (!Array.isArray(arr)) {
    if (arr !== void 0 && arr !== null) {
      let text = arr.toString();
      text = replaceEntitiesValue2(text, options);
      return text;
    }
    return "";
  }
  for (let i = 0; i < arr.length; i++) {
    const tagObj = arr[i];
    const tagName = propName2(tagObj);
    if (tagName === void 0) continue;
    const attrValues = extractAttributeValues(tagObj[":@"], options);
    matcher.push(tagName, attrValues);
    const isStopNode = checkStopNode(matcher, stopNodeExpressions);
    if (tagName === options.textNodeName) {
      let tagText = tagObj[tagName];
      if (!isStopNode) {
        tagText = options.tagValueProcessor(tagName, tagText);
        tagText = replaceEntitiesValue2(tagText, options);
      }
      if (isPreviousElementTag) {
        xmlStr += indentation;
      }
      xmlStr += tagText;
      isPreviousElementTag = false;
      matcher.pop();
      continue;
    } else if (tagName === options.cdataPropName) {
      if (isPreviousElementTag) {
        xmlStr += indentation;
      }
      xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
      isPreviousElementTag = false;
      matcher.pop();
      continue;
    } else if (tagName === options.commentPropName) {
      xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
      isPreviousElementTag = true;
      matcher.pop();
      continue;
    } else if (tagName[0] === "?") {
      const attStr2 = attr_to_str(tagObj[":@"], options, isStopNode);
      const tempInd = tagName === "?xml" ? "" : indentation;
      let piTextNodeName = tagObj[tagName][0][options.textNodeName];
      piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
      xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
      isPreviousElementTag = true;
      matcher.pop();
      continue;
    }
    let newIdentation = indentation;
    if (newIdentation !== "") {
      newIdentation += options.indentBy;
    }
    const attStr = attr_to_str(tagObj[":@"], options, isStopNode);
    const tagStart = indentation + `<${tagName}${attStr}`;
    let tagValue;
    if (isStopNode) {
      tagValue = getRawContent(tagObj[tagName], options);
    } else {
      tagValue = arrToStr(tagObj[tagName], options, newIdentation, matcher, stopNodeExpressions);
    }
    if (options.unpairedTags.indexOf(tagName) !== -1) {
      if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
      else xmlStr += tagStart + "/>";
    } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
      xmlStr += tagStart + "/>";
    } else if (tagValue && tagValue.endsWith(">")) {
      xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
    } else {
      xmlStr += tagStart + ">";
      if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
        xmlStr += indentation + options.indentBy + tagValue + indentation;
      } else {
        xmlStr += tagValue;
      }
      xmlStr += `</${tagName}>`;
    }
    isPreviousElementTag = true;
    matcher.pop();
  }
  return xmlStr;
}
function extractAttributeValues(attrMap, options) {
  if (!attrMap || options.ignoreAttributes) return null;
  const attrValues = {};
  let hasAttrs = false;
  for (let attr in attrMap) {
    if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
    const cleanAttrName = attr.startsWith(options.attributeNamePrefix) ? attr.substr(options.attributeNamePrefix.length) : attr;
    attrValues[cleanAttrName] = attrMap[attr];
    hasAttrs = true;
  }
  return hasAttrs ? attrValues : null;
}
function getRawContent(arr, options) {
  if (!Array.isArray(arr)) {
    if (arr !== void 0 && arr !== null) {
      return arr.toString();
    }
    return "";
  }
  let content = "";
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    const tagName = propName2(item);
    if (tagName === options.textNodeName) {
      content += item[tagName];
    } else if (tagName === options.cdataPropName) {
      content += item[tagName][0][options.textNodeName];
    } else if (tagName === options.commentPropName) {
      content += item[tagName][0][options.textNodeName];
    } else if (tagName && tagName[0] === "?") {
      continue;
    } else if (tagName) {
      const attStr = attr_to_str_raw(item[":@"], options);
      const nestedContent = getRawContent(item[tagName], options);
      if (!nestedContent || nestedContent.length === 0) {
        content += `<${tagName}${attStr}/>`;
      } else {
        content += `<${tagName}${attStr}>${nestedContent}</${tagName}>`;
      }
    }
  }
  return content;
}
function attr_to_str_raw(attrMap, options) {
  let attrStr = "";
  if (attrMap && !options.ignoreAttributes) {
    for (let attr in attrMap) {
      if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
      let attrVal = attrMap[attr];
      if (attrVal === true && options.suppressBooleanAttributes) {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
      } else {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
      }
    }
  }
  return attrStr;
}
function propName2(obj) {
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (key !== ":@") return key;
  }
}
function attr_to_str(attrMap, options, isStopNode) {
  let attrStr = "";
  if (attrMap && !options.ignoreAttributes) {
    for (let attr in attrMap) {
      if (!Object.prototype.hasOwnProperty.call(attrMap, attr)) continue;
      let attrVal;
      if (isStopNode) {
        attrVal = attrMap[attr];
      } else {
        attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
        attrVal = replaceEntitiesValue2(attrVal, options);
      }
      if (attrVal === true && options.suppressBooleanAttributes) {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
      } else {
        attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
      }
    }
  }
  return attrStr;
}
function checkStopNode(matcher, stopNodeExpressions) {
  if (!stopNodeExpressions || stopNodeExpressions.length === 0) return false;
  for (let i = 0; i < stopNodeExpressions.length; i++) {
    if (matcher.matches(stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
}
function replaceEntitiesValue2(textValue, options) {
  if (textValue && textValue.length > 0 && options.processEntities) {
    for (let i = 0; i < options.entities.length; i++) {
      const entity = options.entities[i];
      textValue = textValue.replace(entity.regex, entity.val);
    }
  }
  return textValue;
}

// node_modules/.pnpm/fast-xml-builder@1.1.4/node_modules/fast-xml-builder/src/ignoreAttributes.js
function getIgnoreAttributesFn2(ignoreAttributes) {
  if (typeof ignoreAttributes === "function") {
    return ignoreAttributes;
  }
  if (Array.isArray(ignoreAttributes)) {
    return (attrName) => {
      for (const pattern of ignoreAttributes) {
        if (typeof pattern === "string" && attrName === pattern) {
          return true;
        }
        if (pattern instanceof RegExp && pattern.test(attrName)) {
          return true;
        }
      }
    };
  }
  return () => false;
}

// node_modules/.pnpm/fast-xml-builder@1.1.4/node_modules/fast-xml-builder/src/fxb.js
var defaultOptions3 = {
  attributeNamePrefix: "@_",
  attributesGroupName: false,
  textNodeName: "#text",
  ignoreAttributes: true,
  cdataPropName: false,
  format: false,
  indentBy: "  ",
  suppressEmptyNode: false,
  suppressUnpairedNode: true,
  suppressBooleanAttributes: true,
  tagValueProcessor: function(key, a) {
    return a;
  },
  attributeValueProcessor: function(attrName, a) {
    return a;
  },
  preserveOrder: false,
  commentPropName: false,
  unpairedTags: [],
  entities: [
    { regex: new RegExp("&", "g"), val: "&amp;" },
    //it must be on top
    { regex: new RegExp(">", "g"), val: "&gt;" },
    { regex: new RegExp("<", "g"), val: "&lt;" },
    { regex: new RegExp("'", "g"), val: "&apos;" },
    { regex: new RegExp('"', "g"), val: "&quot;" }
  ],
  processEntities: true,
  stopNodes: [],
  // transformTagName: false,
  // transformAttributeName: false,
  oneListGroup: false,
  maxNestedTags: 100,
  jPath: true
  // When true, callbacks receive string jPath; when false, receive Matcher instance
};
function Builder(options) {
  this.options = Object.assign({}, defaultOptions3, options);
  if (this.options.stopNodes && Array.isArray(this.options.stopNodes)) {
    this.options.stopNodes = this.options.stopNodes.map((node) => {
      if (typeof node === "string" && node.startsWith("*.")) {
        return ".." + node.substring(2);
      }
      return node;
    });
  }
  this.stopNodeExpressions = [];
  if (this.options.stopNodes && Array.isArray(this.options.stopNodes)) {
    for (let i = 0; i < this.options.stopNodes.length; i++) {
      const node = this.options.stopNodes[i];
      if (typeof node === "string") {
        this.stopNodeExpressions.push(new Expression(node));
      } else if (node instanceof Expression) {
        this.stopNodeExpressions.push(node);
      }
    }
  }
  if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
    this.isAttribute = function() {
      return false;
    };
  } else {
    this.ignoreAttributesFn = getIgnoreAttributesFn2(this.options.ignoreAttributes);
    this.attrPrefixLen = this.options.attributeNamePrefix.length;
    this.isAttribute = isAttribute;
  }
  this.processTextOrObjNode = processTextOrObjNode;
  if (this.options.format) {
    this.indentate = indentate;
    this.tagEndChar = ">\n";
    this.newLine = "\n";
  } else {
    this.indentate = function() {
      return "";
    };
    this.tagEndChar = ">";
    this.newLine = "";
  }
}
Builder.prototype.build = function(jObj) {
  if (this.options.preserveOrder) {
    return toXml(jObj, this.options);
  } else {
    if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
      jObj = {
        [this.options.arrayNodeName]: jObj
      };
    }
    const matcher = new Matcher();
    return this.j2x(jObj, 0, matcher).val;
  }
};
Builder.prototype.j2x = function(jObj, level, matcher) {
  let attrStr = "";
  let val = "";
  if (this.options.maxNestedTags && matcher.getDepth() >= this.options.maxNestedTags) {
    throw new Error("Maximum nested tags exceeded");
  }
  const jPath = this.options.jPath ? matcher.toString() : matcher;
  const isCurrentStopNode = this.checkStopNode(matcher);
  for (let key in jObj) {
    if (!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
    if (typeof jObj[key] === "undefined") {
      if (this.isAttribute(key)) {
        val += "";
      }
    } else if (jObj[key] === null) {
      if (this.isAttribute(key)) {
        val += "";
      } else if (key === this.options.cdataPropName) {
        val += "";
      } else if (key[0] === "?") {
        val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
      } else {
        val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
      }
    } else if (jObj[key] instanceof Date) {
      val += this.buildTextValNode(jObj[key], key, "", level, matcher);
    } else if (typeof jObj[key] !== "object") {
      const attr = this.isAttribute(key);
      if (attr && !this.ignoreAttributesFn(attr, jPath)) {
        attrStr += this.buildAttrPairStr(attr, "" + jObj[key], isCurrentStopNode);
      } else if (!attr) {
        if (key === this.options.textNodeName) {
          let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
          val += this.replaceEntitiesValue(newval);
        } else {
          matcher.push(key);
          const isStopNode = this.checkStopNode(matcher);
          matcher.pop();
          if (isStopNode) {
            const textValue = "" + jObj[key];
            if (textValue === "") {
              val += this.indentate(level) + "<" + key + this.closeTag(key) + this.tagEndChar;
            } else {
              val += this.indentate(level) + "<" + key + ">" + textValue + "</" + key + this.tagEndChar;
            }
          } else {
            val += this.buildTextValNode(jObj[key], key, "", level, matcher);
          }
        }
      }
    } else if (Array.isArray(jObj[key])) {
      const arrLen = jObj[key].length;
      let listTagVal = "";
      let listTagAttr = "";
      for (let j = 0; j < arrLen; j++) {
        const item = jObj[key][j];
        if (typeof item === "undefined") {
        } else if (item === null) {
          if (key[0] === "?") val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          else val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
        } else if (typeof item === "object") {
          if (this.options.oneListGroup) {
            matcher.push(key);
            const result = this.j2x(item, level + 1, matcher);
            matcher.pop();
            listTagVal += result.val;
            if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
              listTagAttr += result.attrStr;
            }
          } else {
            listTagVal += this.processTextOrObjNode(item, key, level, matcher);
          }
        } else {
          if (this.options.oneListGroup) {
            let textValue = this.options.tagValueProcessor(key, item);
            textValue = this.replaceEntitiesValue(textValue);
            listTagVal += textValue;
          } else {
            matcher.push(key);
            const isStopNode = this.checkStopNode(matcher);
            matcher.pop();
            if (isStopNode) {
              const textValue = "" + item;
              if (textValue === "") {
                listTagVal += this.indentate(level) + "<" + key + this.closeTag(key) + this.tagEndChar;
              } else {
                listTagVal += this.indentate(level) + "<" + key + ">" + textValue + "</" + key + this.tagEndChar;
              }
            } else {
              listTagVal += this.buildTextValNode(item, key, "", level, matcher);
            }
          }
        }
      }
      if (this.options.oneListGroup) {
        listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
      }
      val += listTagVal;
    } else {
      if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
        const Ks = Object.keys(jObj[key]);
        const L = Ks.length;
        for (let j = 0; j < L; j++) {
          attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]], isCurrentStopNode);
        }
      } else {
        val += this.processTextOrObjNode(jObj[key], key, level, matcher);
      }
    }
  }
  return { attrStr, val };
};
Builder.prototype.buildAttrPairStr = function(attrName, val, isStopNode) {
  if (!isStopNode) {
    val = this.options.attributeValueProcessor(attrName, "" + val);
    val = this.replaceEntitiesValue(val);
  }
  if (this.options.suppressBooleanAttributes && val === "true") {
    return " " + attrName;
  } else return " " + attrName + '="' + val + '"';
};
function processTextOrObjNode(object, key, level, matcher) {
  const attrValues = this.extractAttributes(object);
  matcher.push(key, attrValues);
  const isStopNode = this.checkStopNode(matcher);
  if (isStopNode) {
    const rawContent = this.buildRawContent(object);
    const attrStr = this.buildAttributesForStopNode(object);
    matcher.pop();
    return this.buildObjectNode(rawContent, key, attrStr, level);
  }
  const result = this.j2x(object, level + 1, matcher);
  matcher.pop();
  if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
    return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level, matcher);
  } else {
    return this.buildObjectNode(result.val, key, result.attrStr, level);
  }
}
Builder.prototype.extractAttributes = function(obj) {
  if (!obj || typeof obj !== "object") return null;
  const attrValues = {};
  let hasAttrs = false;
  if (this.options.attributesGroupName && obj[this.options.attributesGroupName]) {
    const attrGroup = obj[this.options.attributesGroupName];
    for (let attrKey in attrGroup) {
      if (!Object.prototype.hasOwnProperty.call(attrGroup, attrKey)) continue;
      const cleanKey = attrKey.startsWith(this.options.attributeNamePrefix) ? attrKey.substring(this.options.attributeNamePrefix.length) : attrKey;
      attrValues[cleanKey] = attrGroup[attrKey];
      hasAttrs = true;
    }
  } else {
    for (let key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const attr = this.isAttribute(key);
      if (attr) {
        attrValues[attr] = obj[key];
        hasAttrs = true;
      }
    }
  }
  return hasAttrs ? attrValues : null;
};
Builder.prototype.buildRawContent = function(obj) {
  if (typeof obj === "string") {
    return obj;
  }
  if (typeof obj !== "object" || obj === null) {
    return String(obj);
  }
  if (obj[this.options.textNodeName] !== void 0) {
    return obj[this.options.textNodeName];
  }
  let content = "";
  for (let key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    if (this.isAttribute(key)) continue;
    if (this.options.attributesGroupName && key === this.options.attributesGroupName) continue;
    const value = obj[key];
    if (key === this.options.textNodeName) {
      content += value;
    } else if (Array.isArray(value)) {
      for (let item of value) {
        if (typeof item === "string" || typeof item === "number") {
          content += `<${key}>${item}</${key}>`;
        } else if (typeof item === "object" && item !== null) {
          const nestedContent = this.buildRawContent(item);
          const nestedAttrs = this.buildAttributesForStopNode(item);
          if (nestedContent === "") {
            content += `<${key}${nestedAttrs}/>`;
          } else {
            content += `<${key}${nestedAttrs}>${nestedContent}</${key}>`;
          }
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const nestedContent = this.buildRawContent(value);
      const nestedAttrs = this.buildAttributesForStopNode(value);
      if (nestedContent === "") {
        content += `<${key}${nestedAttrs}/>`;
      } else {
        content += `<${key}${nestedAttrs}>${nestedContent}</${key}>`;
      }
    } else {
      content += `<${key}>${value}</${key}>`;
    }
  }
  return content;
};
Builder.prototype.buildAttributesForStopNode = function(obj) {
  if (!obj || typeof obj !== "object") return "";
  let attrStr = "";
  if (this.options.attributesGroupName && obj[this.options.attributesGroupName]) {
    const attrGroup = obj[this.options.attributesGroupName];
    for (let attrKey in attrGroup) {
      if (!Object.prototype.hasOwnProperty.call(attrGroup, attrKey)) continue;
      const cleanKey = attrKey.startsWith(this.options.attributeNamePrefix) ? attrKey.substring(this.options.attributeNamePrefix.length) : attrKey;
      const val = attrGroup[attrKey];
      if (val === true && this.options.suppressBooleanAttributes) {
        attrStr += " " + cleanKey;
      } else {
        attrStr += " " + cleanKey + '="' + val + '"';
      }
    }
  } else {
    for (let key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const attr = this.isAttribute(key);
      if (attr) {
        const val = obj[key];
        if (val === true && this.options.suppressBooleanAttributes) {
          attrStr += " " + attr;
        } else {
          attrStr += " " + attr + '="' + val + '"';
        }
      }
    }
  }
  return attrStr;
};
Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
  if (val === "") {
    if (key[0] === "?") return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
    else {
      return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
    }
  } else {
    let tagEndExp = "</" + key + this.tagEndChar;
    let piClosingChar = "";
    if (key[0] === "?") {
      piClosingChar = "?";
      tagEndExp = "";
    }
    if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
      return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
    } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
      return this.indentate(level) + `<!--${val}-->` + this.newLine;
    } else {
      return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
    }
  }
};
Builder.prototype.closeTag = function(key) {
  let closeTag = "";
  if (this.options.unpairedTags.indexOf(key) !== -1) {
    if (!this.options.suppressUnpairedNode) closeTag = "/";
  } else if (this.options.suppressEmptyNode) {
    closeTag = "/";
  } else {
    closeTag = `></${key}`;
  }
  return closeTag;
};
Builder.prototype.checkStopNode = function(matcher) {
  if (!this.stopNodeExpressions || this.stopNodeExpressions.length === 0) return false;
  for (let i = 0; i < this.stopNodeExpressions.length; i++) {
    if (matcher.matches(this.stopNodeExpressions[i])) {
      return true;
    }
  }
  return false;
};
Builder.prototype.buildTextValNode = function(val, key, attrStr, level, matcher) {
  if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
    return this.indentate(level) + `<![CDATA[${val}]]>` + this.newLine;
  } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
    return this.indentate(level) + `<!--${val}-->` + this.newLine;
  } else if (key[0] === "?") {
    return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
  } else {
    let textValue = this.options.tagValueProcessor(key, val);
    textValue = this.replaceEntitiesValue(textValue);
    if (textValue === "") {
      return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
    } else {
      return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
    }
  }
};
Builder.prototype.replaceEntitiesValue = function(textValue) {
  if (textValue && textValue.length > 0 && this.options.processEntities) {
    for (let i = 0; i < this.options.entities.length; i++) {
      const entity = this.options.entities[i];
      textValue = textValue.replace(entity.regex, entity.val);
    }
  }
  return textValue;
};
function indentate(level) {
  return this.options.indentBy.repeat(level);
}
function isAttribute(name) {
  if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
    return name.substr(this.attrPrefixLen);
  } else {
    return false;
  }
}

// node_modules/.pnpm/fast-xml-parser@5.5.10/node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var json2xml_default = Builder;

// packages/core/src/utils/xml-utils.ts
var defaultOptions4 = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  allowBooleanAttributes: true,
  processEntities: true,
  htmlEntities: true,
  trimValues: false,
  isArray: (tagName) => {
    return ARRAY_TAGS.has(tagName);
  }
};
var ARRAY_TAGS = /* @__PURE__ */ new Set([
  "image",
  "component",
  "font",
  "sound",
  "movieclip",
  "swf",
  "atlas",
  "misc",
  "text",
  "richtext",
  "inputtext",
  "graph",
  "group",
  "loader",
  "list",
  "controller",
  "transition",
  "item",
  "relation",
  "gearDisplay",
  "gearXY",
  "gearSize",
  "gearLook",
  "gearColor",
  "gearAni",
  "gearText",
  "gearIcon",
  "gearDisplay2",
  "gearFontSize",
  "action"
]);
var parser = new XMLParser(defaultOptions4);
var preserveOrderParser = new XMLParser({
  ...defaultOptions4,
  preserveOrder: true
});
function parseXML(xml) {
  return parser.parse(xml);
}
function parseXMLPreserveOrder(xml) {
  return preserveOrderParser.parse(xml);
}
function parseXYString(v) {
  if (!v) return [0, 0];
  const parts = v.split(",");
  return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0];
}
function parseSizeString(v) {
  if (!v) return [0, 0];
  const parts = v.split(",");
  return [parseFloat(parts[0]) || 0, parseFloat(parts[1]) || 0];
}
function parseScale9GridString(v) {
  if (!v) return null;
  const parts = v.split(",");
  if (parts.length < 4) return null;
  return [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])];
}
function parseControllerPages(pagesStr) {
  if (!pagesStr) return [];
  const parts = pagesStr.split(",");
  const pages = [];
  for (let i = 0; i < parts.length; i += 2) {
    pages.push({ id: parts[i] || "", name: parts[i + 1] || "" });
  }
  return pages;
}
function parseBool(v) {
  if (v === void 0 || v === null) return false;
  if (typeof v === "boolean") return v;
  const normalized = v.trim().toLowerCase();
  return normalized === "" || normalized === "true" || normalized === "1";
}
function parseFloat2(v, defaultValue = 0) {
  if (v === void 0 || v === null) return defaultValue;
  if (typeof v === "number") return v;
  const n = parseFloat(v);
  return Number.isNaN(n) ? defaultValue : n;
}
function parseInt2(v, defaultValue = 0) {
  if (v === void 0 || v === null) return defaultValue;
  if (typeof v === "number") return v;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? defaultValue : n;
}
var RELATION_TYPE_MAP = {
  "left-left": 0,
  "left-center": 1,
  "left-right": 2,
  "center-center": 3,
  "right-left": 4,
  "right-center": 5,
  "right-right": 6,
  "top-top": 7,
  "top-middle": 8,
  "top-bottom": 9,
  "middle-middle": 10,
  "bottom-top": 11,
  "bottom-middle": 12,
  "bottom-bottom": 13,
  "width-width": 14,
  "height-height": 15,
  // FairyGUI 编辑器使用的简写形式
  "width": 14,
  "height": 15,
  "leftext-left": 16,
  "leftext-right": 17,
  "rightext-left": 18,
  "rightext-right": 19,
  "topext-top": 20,
  "topext-bottom": 21,
  "bottomext-top": 22,
  "bottomext-bottom": 23
};
function parseSidePair(sidePair) {
  if (!sidePair) return [];
  return sidePair.split(",").map((pair) => {
    const usePercent = pair.endsWith("%");
    const clean = usePercent ? pair.slice(0, -1) : pair;
    const type = RELATION_TYPE_MAP[clean] ?? 0;
    return { type, usePercent };
  });
}
function ensureArray(v) {
  if (v === void 0 || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

// packages/core/src/document.ts
var Document = class _Document {
  _graph = new Graph();
  _root = new Root(this._graph);
  _logger = Logger.DEFAULT_INSTANCE;
  static _GRAPH_DOCUMENTS = /* @__PURE__ */ new WeakMap();
  static fromGraph(graph) {
    return _Document._GRAPH_DOCUMENTS.get(graph) || null;
  }
  constructor() {
    _Document._GRAPH_DOCUMENTS.set(this._graph, this);
  }
  getRoot() {
    return this._root;
  }
  /** @hidden */
  getGraph() {
    return this._graph;
  }
  getLogger() {
    return this._logger;
  }
  setLogger(logger) {
    this._logger = logger;
    return this;
  }
  async transform(...transforms) {
    const stack = transforms.map((fn) => fn.name);
    for (const transform of transforms) {
      await transform(this, { stack });
    }
    return this;
  }
  /****** Extension factory methods ******/
  createExtension(ctor) {
    const extensionName = ctor.EXTENSION_NAME;
    const prevExtension = this.getRoot().listExtensionsUsed().find((ext) => ext.extensionName === extensionName);
    return prevExtension || new ctor(this);
  }
  /****** Property factory methods ******/
  createPackage(name = "") {
    return new Package(this._graph, name);
  }
  createImageResource(name = "") {
    return new ImageResource(this._graph, name);
  }
  createSoundResource(name = "") {
    return new SoundResource(this._graph, name);
  }
  createMiscResource(name = "") {
    return new MiscResource(this._graph, name);
  }
  createFontResource(name = "") {
    return new FontResource(this._graph, name);
  }
  createMovieClipResource(name = "") {
    return new MovieClipResource(this._graph, name);
  }
  createSpineResource(name = "") {
    return new SpineResource(this._graph, name);
  }
  createDragonBonesResource(name = "") {
    return new DragonBonesResource(this._graph, name);
  }
  createComponent(name = "") {
    return new Component(this._graph, name);
  }
  createAtlas(name = "") {
    return new Atlas(this._graph, name);
  }
  createSprite(name = "") {
    return new Sprite(this._graph, name);
  }
  createBuffer(name = "") {
    return new FairyBuffer(this._graph, name);
  }
  createGImage(name = "") {
    return new GImage(this._graph, name);
  }
  createGTextField(name = "") {
    return new GTextField(this._graph, name);
  }
  createGRichTextField(name = "") {
    return new GRichTextField(this._graph, name);
  }
  createGTextInput(name = "") {
    return new GTextInput(this._graph, name);
  }
  createGGraph(name = "") {
    return new GGraph(this._graph, name);
  }
  createGGroup(name = "") {
    return new GGroup(this._graph, name);
  }
  createGLoader(name = "") {
    return new GLoader(this._graph, name);
  }
  createGLoader3D(name = "") {
    return new GLoader3D(this._graph, name);
  }
  createGMovieClip(name = "") {
    return new GMovieClip(this._graph, name);
  }
  createGComponent(name = "") {
    return new GComponent(this._graph, name);
  }
  createGList(name = "") {
    return new GList(this._graph, name);
  }
  createGTree(name = "") {
    return new GTree(this._graph, name);
  }
  createGButton(name = "") {
    return new GButton(this._graph, name);
  }
  createGLabel(name = "") {
    return new GLabel(this._graph, name);
  }
  createGComboBox(name = "") {
    return new GComboBox(this._graph, name);
  }
  createGProgressBar(name = "") {
    return new GProgressBar(this._graph, name);
  }
  createGSlider(name = "") {
    return new GSlider(this._graph, name);
  }
  createGScrollBar(name = "") {
    return new GScrollBar(this._graph, name);
  }
  createController(name = "") {
    return new Controller(this._graph, name);
  }
  createControllerPage(name = "") {
    return new ControllerPage(this._graph, name);
  }
  createControllerAction(name = "") {
    return new ControllerAction(this._graph, name);
  }
  createTransition(name = "") {
    return new Transition(this._graph, name);
  }
  createTransitionItem(name = "") {
    return new TransitionItem(this._graph, name);
  }
  createGear(name = "") {
    return new Gear(this._graph, name);
  }
  createFontGlyph(name = "") {
    return new FontGlyph(this._graph, name);
  }
  createMovieFrame(name = "") {
    return new MovieFrame(this._graph, name);
  }
};

// packages/core/src/io/project-xml-protocol.ts
var mergeAttrs = (...parts) => Object.assign({}, ...parts);
var mergeChildren = (...parts) => Object.assign({}, ...parts);
var mergeContainers = (...parts) => Object.assign({}, ...parts);
var defineContainer = (items) => ({
  kind: "orderedVariants",
  items
});
var defineNode = (attrs, children, containers) => ({
  attrs,
  ...children ? { children } : {},
  ...containers ? { containers } : {}
});
var PACKAGE_DESCRIPTION_ATTRS = {
  id: { canonical: "id" },
  compressPNG: { canonical: "compressPNG" },
  jpegQuality: { canonical: "jpegQuality" }
};
var BRANCH_DESCRIPTION_ATTRS = {};
var PACKAGE_PUBLISH_ATTRS = {
  name: { canonical: "name" },
  path: { canonical: "path" },
  branchPath: { canonical: "branchPath" },
  packageCount: { canonical: "packageCount" },
  genCode: { canonical: "genCode" },
  codePath: { canonical: "codePath" }
};
var PACKAGE_PUBLISH_ATLAS_ATTRS = {
  name: { canonical: "name" },
  index: { canonical: "index" }
};
var PACKAGE_RESOURCE_BASE_ATTRS = {
  id: { canonical: "id" },
  name: { canonical: "name" },
  path: { canonical: "path" },
  exported: { canonical: "exported" }
};
var PACKAGE_IMAGE_RESOURCE_ATTRS = {
  atlas: { canonical: "atlas" },
  scale: { canonical: "scale" },
  scale9grid: { canonical: "scale9grid" },
  width: { canonical: "width" },
  height: { canonical: "height" },
  gridTile: { canonical: "gridTile" },
  qualityOption: { canonical: "qualityOption" },
  duplicatePadding: { canonical: "duplicatePadding" },
  smoothing: { canonical: "smoothing" }
};
var PACKAGE_FONT_RESOURCE_ATTRS = {
  texture: { canonical: "texture" },
  renderMode: { canonical: "renderMode" },
  samplePointSize: { canonical: "samplePointSize" }
};
var PACKAGE_MOVIECLIP_RESOURCE_ATTRS = {
  width: { canonical: "width" },
  height: { canonical: "height" }
};
var PACKAGE_SKELETON_RESOURCE_ATTRS = {
  width: { canonical: "width" },
  height: { canonical: "height" },
  require: { canonical: "require" },
  atlasNames: { canonical: "atlasNames" },
  anchor: { canonical: "anchor" }
};
var DISPLAY_OBJECT_IDENTITY_ATTRS = {
  id: { canonical: "id" },
  name: { canonical: "name" },
  relation: { canonical: "relation" }
};
var XY_SIZE_ATTRS = {
  xy: { canonical: "xy" },
  size: { canonical: "size" }
};
var LOCKED_ATTRS = {
  locked: { canonical: "locked" }
};
var RESTRICT_SIZE_ATTRS = {
  restrictSize: { canonical: "restrictSize" }
};
var ASPECT_ATTRS = {
  aspect: { canonical: "aspect" }
};
var PIVOT_ATTRS = {
  pivot: { canonical: "pivot" }
};
var ANCHOR_ATTRS = {
  anchor: { canonical: "anchor" }
};
var SCALE_ATTRS = {
  scale: { canonical: "scale" }
};
var GROUP_REF_ATTRS = {
  group: { canonical: "group" }
};
var ROTATION_ALPHA_ATTRS = {
  rotation: { canonical: "rotation" },
  alpha: { canonical: "alpha" }
};
var VISIBLE_ATTRS = {
  visible: { canonical: "visible" }
};
var TOUCHABLE_ATTRS = {
  touchable: { canonical: "touchable" }
};
var GRAYED_ATTRS = {
  grayed: { canonical: "grayed" }
};
var INSTANCE_MISC_PANEL_ATTRS = {
  tooltips: { canonical: "tooltips" },
  customData: { canonical: "customData" }
};
var RESOURCE_LINK_ATTRS = {
  fileName: { canonical: "fileName" },
  pkg: { canonical: "pkg" }
};
var FILTER_ATTRS = {
  filter: { canonical: "filter" },
  filterData: { canonical: "filterData" }
};
var ROOT_COMPONENT_PANEL_ATTRS = {
  size: { canonical: "size" },
  pivot: { canonical: "pivot" },
  anchor: { canonical: "anchor" },
  margin: { canonical: "margin" },
  restrictSize: { canonical: "restrictSize" },
  overflow: { canonical: "overflow" },
  clipSoftness: { canonical: "clipSoftness" },
  opaque: { canonical: "opaque" },
  mask: { canonical: "mask" },
  reversedMask: { canonical: "reversedMask" },
  hitTest: { canonical: "hitTest" },
  customData: { canonical: "customData" },
  scroll: { canonical: "scroll" },
  scrollBar: { canonical: "scrollBar" },
  scrollBarFlags: { canonical: "scrollBarFlags" },
  scrollBarMargin: { canonical: "scrollBarMargin" },
  scrollBarRes: { canonical: "scrollBarRes" },
  ptrRes: { canonical: "ptrRes" },
  extention: { canonical: "extention" },
  bgColor: { canonical: "bgColor" },
  bgColorEnabled: { canonical: "bgColorEnabled" },
  idnum: { canonical: "idnum" },
  initName: { canonical: "initName" }
};
var ROOT_MISC_PANEL_ATTRS = {
  remark: { canonical: "remark" }
};
var ROOT_DESIGN_PANEL_ATTRS = {
  designImageAlpha: { canonical: "designImageAlpha" },
  designImageLayer: { canonical: "designImageLayer" },
  designImageOffsetX: { canonical: "designImageOffsetX" },
  designImageOffsetY: { canonical: "designImageOffsetY" }
};
var COMPONENT_INSTANCE_PANEL_ATTRS = {
  src: { canonical: "src" },
  controllerOverrides: { canonical: "controller" },
  pageController: { canonical: "pageController" }
};
var IMAGE_PANEL_ATTRS = {
  src: { canonical: "src" },
  color: { canonical: "color" },
  flip: { canonical: "flip" },
  fillMethod: { canonical: "fillMethod" },
  fillOrigin: { canonical: "fillOrigin" },
  fillClockwise: { canonical: "fillClockwise" },
  fillAmount: { canonical: "fillAmount" }
};
var GRAPH_PANEL_ATTRS = {
  skew: { canonical: "skew" },
  type: { canonical: "type" },
  lineSize: { canonical: "lineSize" },
  lineColor: { canonical: "lineColor" },
  fillColor: { canonical: "fillColor" },
  corner: { canonical: "corner" },
  points: { canonical: "points" },
  sides: { canonical: "sides" },
  startAngle: { canonical: "startAngle" },
  distances: { canonical: "distances" }
};
var MOVIE_CLIP_PANEL_ATTRS = {
  src: { canonical: "src" },
  playing: { canonical: "playing" },
  frame: { canonical: "frame" },
  color: { canonical: "color" }
};
var LOADER_PANEL_ATTRS = {
  url: { canonical: "url" },
  align: { canonical: "align" },
  vAlign: { canonical: "vAlign" },
  fill: { canonical: "fill" },
  shrinkOnly: { canonical: "shrinkOnly" },
  autoSize: { canonical: "autoSize" },
  useResize: { canonical: "useResize" },
  color: { canonical: "color" },
  playing: { canonical: "playing" },
  frame: { canonical: "frame" },
  fillMethod: { canonical: "fillMethod" },
  fillOrigin: { canonical: "fillOrigin" },
  fillClockwise: { canonical: "fillClockwise" },
  fillAmount: { canonical: "fillAmount" },
  clearOnPublish: { canonical: "clearOnPublish" }
};
var LOADER3D_PANEL_ATTRS = {
  url: { canonical: "url" },
  align: { canonical: "align" },
  vAlign: { canonical: "vAlign" },
  fill: { canonical: "fill" },
  shrinkOnly: { canonical: "shrinkOnly" },
  autoSize: { canonical: "autoSize" },
  animation: { canonical: "animation", aliases: ["animationName"] },
  skinName: { canonical: "skin", aliases: ["skinName"] },
  playing: { canonical: "playing" },
  frame: { canonical: "frame" },
  loop: { canonical: "loop" },
  color: { canonical: "color" }
};
var TEXT_PANEL_ATTRS = {
  font: { canonical: "font" },
  fontSize: { canonical: "fontSize" },
  color: { canonical: "color" },
  align: { canonical: "align" },
  vAlign: { canonical: "vAlign" },
  autoSize: { canonical: "autoSize" },
  singleLine: { canonical: "singleLine" },
  text: { canonical: "text" },
  input: { canonical: "input" },
  ubb: { canonical: "ubb" },
  leading: { canonical: "leading" },
  letterSpacing: { canonical: "letterSpacing" },
  underline: { canonical: "underline" },
  italic: { canonical: "italic" },
  bold: { canonical: "bold" },
  strikethrough: { canonical: "strikethrough" },
  strokeColor: { canonical: "strokeColor" },
  strokeSize: { canonical: "strokeSize" },
  shadowColor: { canonical: "shadowColor" },
  shadowOffset: { canonical: "shadowOffset" },
  autoClearText: { canonical: "autoClearText" },
  demoText: { canonical: "demoText" },
  faceDilate: { canonical: "faceDilate" },
  underlaySoftness: { canonical: "underlaySoftness" },
  vars: { canonical: "vars" },
  pivot: { canonical: "pivot" },
  anchor: { canonical: "anchor" }
};
var TEXT_INPUT_PANEL_ATTRS = {
  prompt: { canonical: "prompt", aliases: ["promptText"] },
  maxLength: { canonical: "maxLength" },
  restrict: { canonical: "restrict" },
  password: { canonical: "password" },
  keyboardType: { canonical: "keyboardType" }
};
var RICH_TEXT_PANEL_ATTRS = {
  restrictSize: { canonical: "restrictSize" },
  underlaySoftness: { canonical: "underlaySoftness" }
};
var GROUP_PANEL_ATTRS = {
  layout: { canonical: "layout" },
  lineGap: { canonical: "lineGap" },
  columnGap: { canonical: "colGap", aliases: ["columnGap"] },
  advanced: { canonical: "advanced" },
  excludeInvisibles: { canonical: "excludeInvisibles" },
  autoSizeDisabled: { canonical: "autoSizeDisabled" },
  mainGridIndex: { canonical: "mainGridIndex" }
};
var LIST_PANEL_ATTRS = {
  src: { canonical: "src" },
  layout: { canonical: "layout" },
  align: { canonical: "align" },
  vAlign: { canonical: "vAlign" },
  lineGap: { canonical: "lineGap" },
  columnGap: { canonical: "colGap", aliases: ["columnGap"] },
  lineCount: { canonical: "lineItemCount", aliases: ["lineCount"] },
  autoResizeItem: { canonical: "autoItemSize", aliases: ["autoResizeItem"] },
  selectionMode: { canonical: "selectionMode" },
  selectionController: { canonical: "selectionController" },
  defaultItem: { canonical: "defaultItem" },
  pageController: { canonical: "pageController" },
  controllerOverrides: { canonical: "controller" },
  overflow: { canonical: "overflow" },
  scroll: { canonical: "scroll" },
  scrollBar: { canonical: "scrollBar" },
  scrollBarFlags: { canonical: "scrollBarFlags" },
  scrollBarMargin: { canonical: "scrollBarMargin" },
  scrollBarRes: { canonical: "scrollBarRes" },
  ptrRes: { canonical: "ptrRes" },
  margin: { canonical: "margin" },
  clipSoftness: { canonical: "clipSoftness" },
  treeView: { canonical: "treeView" },
  indent: { canonical: "indent" },
  clickToExpand: { canonical: "clickToExpand" },
  autoClearItems: { canonical: "autoClearItems" }
};
var BUTTON_EXTENSION_ATTRS = {
  mode: { canonical: "mode" },
  sound: { canonical: "sound" },
  soundVolumeScale: { canonical: "soundVolumeScale" },
  downEffect: { canonical: "downEffect" },
  downEffectValue: { canonical: "downEffectValue" },
  title: { canonical: "title" },
  selectedTitle: { canonical: "selectedTitle" },
  icon: { canonical: "icon" },
  selectedIcon: { canonical: "selectedIcon" },
  titleColor: { canonical: "titleColor" },
  titleFontSize: { canonical: "titleFontSize" },
  controller: { canonical: "controller" },
  page: { canonical: "page" },
  checked: { canonical: "checked" }
};
var LABEL_EXTENSION_ATTRS = {
  title: { canonical: "title" },
  icon: { canonical: "icon" },
  titleColor: { canonical: "titleColor" },
  titleFontSize: { canonical: "titleFontSize" },
  prompt: { canonical: "prompt" }
};
var COMBOBOX_EXTENSION_ATTRS = {
  dropdown: { canonical: "dropdown" },
  title: { canonical: "title" },
  icon: { canonical: "icon" },
  visibleItemCount: { canonical: "visibleItemCount" },
  selectionController: { canonical: "selectionController" }
};
var PROGRESSBAR_EXTENSION_ATTRS = {
  titleType: { canonical: "titleType" },
  reverse: { canonical: "reverse" },
  value: { canonical: "value" },
  max: { canonical: "max" },
  min: { canonical: "min" }
};
var SLIDER_EXTENSION_ATTRS = {
  titleType: { canonical: "titleType" },
  reverse: { canonical: "reverse" },
  wholeNumbers: { canonical: "wholeNumbers" },
  changeOnClick: { canonical: "changeOnClick" },
  value: { canonical: "value" },
  max: { canonical: "max" },
  min: { canonical: "min" }
};
var SCROLLBAR_EXTENSION_ATTRS = {
  fixedGripSize: { canonical: "fixedGripSize" }
};
var RELATION_ATTRS = {
  target: { canonical: "target" },
  sidePair: { canonical: "sidePair" }
};
var GEAR_ATTRS = {
  controller: { canonical: "controller" },
  pages: { canonical: "pages" },
  values: { canonical: "values" },
  default: { canonical: "default" },
  tween: { canonical: "tween" },
  positionsInPercent: { canonical: "positionsInPercent" },
  condition: { canonical: "condition" },
  ease: { canonical: "ease" },
  duration: { canonical: "duration" }
};
var CONTROLLER_ATTRS = {
  name: { canonical: "name" },
  pages: { canonical: "pages" },
  selected: { canonical: "selected" }
};
var CONTROLLER_ACTION_ATTRS = {
  type: { canonical: "type" },
  fromPage: { canonical: "fromPage" },
  toPage: { canonical: "toPage" },
  transition: { canonical: "transition" },
  repeat: { canonical: "repeat" },
  delay: { canonical: "delay" },
  stopOnExit: { canonical: "stopOnExit" },
  objectId: { canonical: "objectId" },
  controller: { canonical: "controller" },
  targetPage: { canonical: "targetPage" }
};
var TRANSITION_ATTRS = {
  name: { canonical: "name" },
  autoPlay: { canonical: "autoPlay" },
  autoPlayTimes: { canonical: "autoPlayRepeat", aliases: ["autoPlayTimes"] },
  autoPlayDelay: { canonical: "autoPlayDelay" },
  options: { canonical: "options" },
  fps: { canonical: "fps" }
};
var TRANSITION_ITEM_ATTRS = {
  time: { canonical: "time" },
  target: { canonical: "target" },
  tween: { canonical: "tween" },
  duration: { canonical: "duration" },
  repeat: { canonical: "repeat" },
  yoyo: { canonical: "yoyo" },
  label: { canonical: "label" },
  label2: { canonical: "label2" },
  path: { canonical: "path" },
  ease: { canonical: "ease" },
  type: { canonical: "type" },
  value: { canonical: "value" },
  startValue: { canonical: "startValue" },
  endValue: { canonical: "endValue" }
};
var LIST_ITEM_ATTRS = {
  title: { canonical: "title" },
  icon: { canonical: "icon" },
  url: { canonical: "url" },
  name: { canonical: "name" },
  selectedTitle: { canonical: "selectedTitle" },
  selectedIcon: { canonical: "selectedIcon" },
  level: { canonical: "level" },
  isFolder: { canonical: "isFolder" },
  controllers: { canonical: "controllers" }
};
var COMBOBOX_ITEM_ATTRS = {
  title: { canonical: "title" },
  value: { canonical: "value" },
  icon: { canonical: "icon" }
};
var PACKAGE_DESCRIPTION_NODE = defineNode(PACKAGE_DESCRIPTION_ATTRS);
var BRANCH_DESCRIPTION_NODE = defineNode(BRANCH_DESCRIPTION_ATTRS);
var PACKAGE_PUBLISH_ATLAS_NODE = defineNode(PACKAGE_PUBLISH_ATLAS_ATTRS);
var PACKAGE_PUBLISH_NODE = defineNode(
  PACKAGE_PUBLISH_ATTRS,
  {
    atlas: PACKAGE_PUBLISH_ATLAS_NODE
  }
);
var PACKAGE_RESOURCE_NODE = defineNode(PACKAGE_RESOURCE_BASE_ATTRS);
var PACKAGE_IMAGE_RESOURCE_NODE = defineNode(PACKAGE_IMAGE_RESOURCE_ATTRS);
var PACKAGE_FONT_RESOURCE_NODE = defineNode(PACKAGE_FONT_RESOURCE_ATTRS);
var PACKAGE_SKELETON_RESOURCE_NODE = defineNode(PACKAGE_SKELETON_RESOURCE_ATTRS);
var PACKAGE_MOVIECLIP_RESOURCE_NODE = defineNode(PACKAGE_MOVIECLIP_RESOURCE_ATTRS);
var DISPLAY_OBJECT_NODE = defineNode(DISPLAY_OBJECT_IDENTITY_ATTRS);
var BUTTON_EXTENSION_NODE = defineNode(BUTTON_EXTENSION_ATTRS);
var LABEL_EXTENSION_NODE = defineNode(LABEL_EXTENSION_ATTRS);
var PROGRESSBAR_EXTENSION_NODE = defineNode(PROGRESSBAR_EXTENSION_ATTRS);
var SLIDER_EXTENSION_NODE = defineNode(SLIDER_EXTENSION_ATTRS);
var SCROLLBAR_EXTENSION_NODE = defineNode(SCROLLBAR_EXTENSION_ATTRS);
var RELATION_NODE = defineNode(RELATION_ATTRS);
var GEAR_NODE = defineNode(GEAR_ATTRS);
var CONTROLLER_ACTION_NODE = defineNode(CONTROLLER_ACTION_ATTRS);
var TRANSITION_ITEM_NODE = defineNode(TRANSITION_ITEM_ATTRS);
var LIST_ITEM_NODE = defineNode(LIST_ITEM_ATTRS);
var COMBOBOX_ITEM_NODE = defineNode(COMBOBOX_ITEM_ATTRS);
var WITH_RELATION_CHILDREN = {
  relation: RELATION_NODE
};
var WITH_GEAR_CHILDREN = {
  gearDisplay: GEAR_NODE,
  gearXY: GEAR_NODE,
  gearSize: GEAR_NODE,
  gearLook: GEAR_NODE,
  gearColor: GEAR_NODE,
  gearAni: GEAR_NODE,
  gearText: GEAR_NODE,
  gearIcon: GEAR_NODE,
  gearDisplay2: GEAR_NODE,
  gearFontSize: GEAR_NODE
};
var WITH_GROUP_GEAR_CHILDREN = {
  gearDisplay: GEAR_NODE,
  gearXY: GEAR_NODE,
  gearSize: GEAR_NODE,
  gearText: GEAR_NODE,
  gearIcon: GEAR_NODE,
  gearDisplay2: GEAR_NODE
};
var WITH_CONTROLLER_ACTION_CHILDREN = {
  action: CONTROLLER_ACTION_NODE
};
var WITH_TRANSITION_ITEM_CHILDREN = {
  item: TRANSITION_ITEM_NODE
};
var WITH_LIST_ITEM_CHILDREN = {
  item: LIST_ITEM_NODE
};
var COMBOBOX_EXTENSION_NODE = defineNode(
  mergeAttrs(COMBOBOX_EXTENSION_ATTRS),
  mergeChildren({
    item: COMBOBOX_ITEM_NODE
  })
);
var WITH_INSTANCE_EXTENSION_CHILDREN = {
  Button: BUTTON_EXTENSION_NODE,
  Label: LABEL_EXTENSION_NODE,
  ComboBox: COMBOBOX_EXTENSION_NODE,
  ProgressBar: PROGRESSBAR_EXTENSION_NODE,
  Slider: SLIDER_EXTENSION_NODE,
  ScrollBar: SCROLLBAR_EXTENSION_NODE
};
var WITH_ROOT_EXTENSION_CHILDREN = {
  Button: BUTTON_EXTENSION_NODE,
  Label: LABEL_EXTENSION_NODE,
  ComboBox: COMBOBOX_EXTENSION_NODE,
  ProgressBar: PROGRESSBAR_EXTENSION_NODE,
  Slider: SLIDER_EXTENSION_NODE,
  ScrollBar: SCROLLBAR_EXTENSION_NODE
};
var CONTROLLER_NODE = defineNode(
  mergeAttrs(CONTROLLER_ATTRS),
  mergeChildren(WITH_CONTROLLER_ACTION_CHILDREN)
);
var TRANSITION_NODE = defineNode(
  mergeAttrs(TRANSITION_ATTRS),
  mergeChildren(WITH_TRANSITION_ITEM_CHILDREN)
);
var IMAGE_NODE = defineNode(
  mergeAttrs(
    IMAGE_PANEL_ATTRS,
    XY_SIZE_ATTRS,
    LOCKED_ATTRS,
    ASPECT_ATTRS,
    PIVOT_ATTRS,
    ANCHOR_ATTRS,
    SCALE_ATTRS,
    GROUP_REF_ATTRS,
    ROTATION_ALPHA_ATTRS,
    VISIBLE_ATTRS,
    GRAYED_ATTRS,
    RESOURCE_LINK_ATTRS,
    FILTER_ATTRS
  ),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var GRAPH_NODE = defineNode(
  mergeAttrs(
    XY_SIZE_ATTRS,
    LOCKED_ATTRS,
    RESTRICT_SIZE_ATTRS,
    PIVOT_ATTRS,
    ANCHOR_ATTRS,
    SCALE_ATTRS,
    GROUP_REF_ATTRS,
    ROTATION_ALPHA_ATTRS,
    VISIBLE_ATTRS,
    TOUCHABLE_ATTRS,
    GRAPH_PANEL_ATTRS
  ),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var MOVIE_CLIP_NODE = defineNode(
  mergeAttrs(
    MOVIE_CLIP_PANEL_ATTRS,
    XY_SIZE_ATTRS,
    PIVOT_ATTRS,
    SCALE_ATTRS,
    GROUP_REF_ATTRS,
    ROTATION_ALPHA_ATTRS,
    VISIBLE_ATTRS,
    GRAYED_ATTRS,
    RESOURCE_LINK_ATTRS,
    FILTER_ATTRS
  ),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var COMPONENT_INSTANCE_NODE = defineNode(
  mergeAttrs(
    COMPONENT_INSTANCE_PANEL_ATTRS,
    XY_SIZE_ATTRS,
    LOCKED_ATTRS,
    RESTRICT_SIZE_ATTRS,
    ASPECT_ATTRS,
    PIVOT_ATTRS,
    ANCHOR_ATTRS,
    SCALE_ATTRS,
    GROUP_REF_ATTRS,
    ROTATION_ALPHA_ATTRS,
    VISIBLE_ATTRS,
    TOUCHABLE_ATTRS,
    GRAYED_ATTRS,
    INSTANCE_MISC_PANEL_ATTRS,
    RESOURCE_LINK_ATTRS,
    FILTER_ATTRS
  ),
  mergeChildren(
    WITH_RELATION_CHILDREN,
    WITH_GEAR_CHILDREN,
    WITH_INSTANCE_EXTENSION_CHILDREN
  )
);
var LOADER_NODE = defineNode(
  mergeAttrs(
    XY_SIZE_ATTRS,
    PIVOT_ATTRS,
    ANCHOR_ATTRS,
    SCALE_ATTRS,
    GROUP_REF_ATTRS,
    GRAYED_ATTRS,
    LOADER_PANEL_ATTRS,
    FILTER_ATTRS
  ),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var LOADER3D_NODE = defineNode(
  mergeAttrs(XY_SIZE_ATTRS, LOADER3D_PANEL_ATTRS),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var TEXT_NODE = defineNode(
  mergeAttrs(
    XY_SIZE_ATTRS,
    RESTRICT_SIZE_ATTRS,
    { customData: { canonical: "customData" } },
    GROUP_REF_ATTRS,
    TEXT_PANEL_ATTRS,
    TEXT_INPUT_PANEL_ATTRS,
    SCALE_ATTRS
  ),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var TEXT_INPUT_NODE = defineNode(mergeAttrs(TEXT_INPUT_PANEL_ATTRS));
var RICH_TEXT_NODE = defineNode(
  mergeAttrs(RICH_TEXT_PANEL_ATTRS, SCALE_ATTRS),
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GEAR_CHILDREN)
);
var GROUP_NODE = defineNode(
  mergeAttrs(
    XY_SIZE_ATTRS,
    LOCKED_ATTRS,
    GROUP_REF_ATTRS,
    VISIBLE_ATTRS,
    GROUP_PANEL_ATTRS,
    PIVOT_ATTRS,
    ANCHOR_ATTRS,
    SCALE_ATTRS
  ),
  // FairyGUI editor only exposes relation/gear channels on advanced groups.
  // Protocol metadata stays static, so we keep the child set narrow here and
  // rely on samples/tests to enforce the advanced=true structural constraint.
  mergeChildren(WITH_RELATION_CHILDREN, WITH_GROUP_GEAR_CHILDREN)
);
var LIST_NODE = defineNode(
  mergeAttrs(
    XY_SIZE_ATTRS,
    GROUP_REF_ATTRS,
    TOUCHABLE_ATTRS,
    LIST_PANEL_ATTRS,
    PIVOT_ATTRS,
    ANCHOR_ATTRS,
    SCALE_ATTRS
  ),
  mergeChildren(
    WITH_RELATION_CHILDREN,
    WITH_GEAR_CHILDREN,
    WITH_LIST_ITEM_CHILDREN
  )
);
var DISPLAY_LIST_CONTAINER = defineContainer({
  image: IMAGE_NODE,
  graph: GRAPH_NODE,
  movieclip: MOVIE_CLIP_NODE,
  jta: MOVIE_CLIP_NODE,
  component: COMPONENT_INSTANCE_NODE,
  loader: LOADER_NODE,
  loader3D: LOADER3D_NODE,
  text: TEXT_NODE,
  richtext: RICH_TEXT_NODE,
  inputtext: TEXT_INPUT_NODE,
  group: GROUP_NODE,
  list: LIST_NODE,
  tree: LIST_NODE
});
var COMPONENT_ROOT_NODE = defineNode(
  mergeAttrs(
    ROOT_COMPONENT_PANEL_ATTRS,
    ROOT_DESIGN_PANEL_ATTRS,
    ROOT_MISC_PANEL_ATTRS
  ),
  mergeChildren(
    {
      controller: CONTROLLER_NODE,
      transition: TRANSITION_NODE,
      relation: RELATION_NODE
    },
    WITH_ROOT_EXTENSION_CHILDREN
  ),
  mergeContainers({
    displayList: DISPLAY_LIST_CONTAINER
  })
);
var PROJECT_XML_PROTOCOL = {
  packageDescription: PACKAGE_DESCRIPTION_NODE,
  branchDescription: BRANCH_DESCRIPTION_NODE,
  packagePublish: PACKAGE_PUBLISH_NODE,
  packagePublishAtlas: PACKAGE_PUBLISH_ATLAS_NODE,
  packageResource: PACKAGE_RESOURCE_NODE,
  packageImageResource: PACKAGE_IMAGE_RESOURCE_NODE,
  packageFontResource: PACKAGE_FONT_RESOURCE_NODE,
  packageSkeletonResource: PACKAGE_SKELETON_RESOURCE_NODE,
  packageMovieClipResource: PACKAGE_MOVIECLIP_RESOURCE_NODE,
  displayObject: DISPLAY_OBJECT_NODE,
  image: IMAGE_NODE,
  graph: GRAPH_NODE,
  movieClip: MOVIE_CLIP_NODE,
  componentRoot: COMPONENT_ROOT_NODE,
  componentInstance: COMPONENT_INSTANCE_NODE,
  buttonExtension: BUTTON_EXTENSION_NODE,
  labelExtension: LABEL_EXTENSION_NODE,
  comboBoxExtension: COMBOBOX_EXTENSION_NODE,
  progressBarExtension: PROGRESSBAR_EXTENSION_NODE,
  sliderExtension: SLIDER_EXTENSION_NODE,
  scrollBarExtension: SCROLLBAR_EXTENSION_NODE,
  relation: RELATION_NODE,
  gear: GEAR_NODE,
  controller: CONTROLLER_NODE,
  controllerAction: CONTROLLER_ACTION_NODE,
  transition: TRANSITION_NODE,
  transitionItem: TRANSITION_ITEM_NODE,
  loader: LOADER_NODE,
  loader3D: LOADER3D_NODE,
  text: TEXT_NODE,
  textInput: TEXT_INPUT_NODE,
  richText: RICH_TEXT_NODE,
  group: GROUP_NODE,
  list: LIST_NODE,
  listItem: LIST_ITEM_NODE,
  comboBoxItem: COMBOBOX_ITEM_NODE
};
function readXmlAttr(source, spec) {
  if (Object.hasOwn(source, spec.canonical)) {
    return source[spec.canonical];
  }
  for (const alias of spec.aliases ?? []) {
    if (Object.hasOwn(source, alias)) {
      return source[alias];
    }
  }
  return void 0;
}
function writeXmlAttr(target, spec, value) {
  target[`@_${spec.canonical}`] = value;
}

// packages/core/src/io/reader-context.ts
var ReaderContext = class {
  document;
  logger;
  basePath;
  settings = {};
  /** packageId → Package */
  packageMap = /* @__PURE__ */ new Map();
  /** packageId+resourceId → Property (ImageResource, Component, etc.) */
  resourceMap = /* @__PURE__ */ new Map();
  /** packageId+controllerName → Controller (for gear resolution within a component) */
  controllerMap = /* @__PURE__ */ new Map();
  constructor(document, basePath) {
    this.document = document;
    this.logger = document.getLogger();
    this.basePath = basePath;
  }
  registerResource(packageId, resourceId, property) {
    this.resourceMap.set(packageId + resourceId, property);
  }
  resolveResource(packageId, resourceId) {
    return this.resourceMap.get(packageId + resourceId) || null;
  }
  resolveURL(url) {
    if (!url || !url.startsWith("ui://")) return null;
    const body = url.substring(5);
    if (body.length < 8) return null;
    const packageId = body.substring(0, 8);
    const resourceId = body.substring(8);
    return this.resolveResource(packageId, resourceId);
  }
};

// packages/core/src/io/project-reader.ts
function _parseEaseType(ease) {
  const map = {
    Linear: 0,
    SineIn: 1,
    SineOut: 2,
    SineInOut: 3,
    QuadIn: 4,
    QuadOut: 5,
    QuadInOut: 6,
    CubicIn: 7,
    CubicOut: 8,
    CubicInOut: 9,
    QuartIn: 10,
    QuartOut: 11,
    QuartInOut: 12,
    QuintIn: 13,
    QuintOut: 14,
    QuintInOut: 15,
    ExpoIn: 16,
    ExpoOut: 17,
    ExpoInOut: 18,
    CircIn: 19,
    CircOut: 20,
    CircInOut: 21,
    ElasticIn: 22,
    ElasticOut: 23,
    ElasticInOut: 24,
    BackIn: 25,
    BackOut: 26,
    BackInOut: 27,
    BounceIn: 28,
    BounceOut: 29,
    BounceInOut: 30,
    Custom: 31
  };
  const normalized = ease.replace(/[.\s_-]/g, "");
  return map[ease] ?? map[normalized] ?? 5;
}
function readPngSize(data) {
  if (data.length < 24) return null;
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) return null;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20)
  };
}
function readJpegSize(data) {
  if (data.length < 4 || data[0] !== 255 || data[1] !== 216) return null;
  let offset = 2;
  while (offset + 9 < data.length) {
    if (data[offset] !== 255) {
      offset++;
      continue;
    }
    const marker = data[offset + 1];
    offset += 2;
    if (marker === 216 || marker === 217) continue;
    if (offset + 2 > data.length) return null;
    const length = data[offset] << 8 | data[offset + 1];
    if (length < 2 || offset + length > data.length) return null;
    const isStartOfFrame = marker >= 192 && marker <= 195 || marker >= 197 && marker <= 199 || marker >= 201 && marker <= 203 || marker >= 205 && marker <= 207;
    if (isStartOfFrame) {
      if (offset + 7 > data.length) return null;
      return {
        height: data[offset + 3] << 8 | data[offset + 4],
        width: data[offset + 5] << 8 | data[offset + 6]
      };
    }
    offset += length;
  }
  return null;
}
function readImageSize(data) {
  return readPngSize(data) ?? readJpegSize(data);
}
var DISPLAY_TAG_MAP = {
  image: "GImage",
  text: "GTextField",
  richtext: "GRichTextField",
  inputtext: "GTextInput",
  graph: "GGraph",
  group: "GGroup",
  loader: "GLoader",
  loader3d: "GLoader3D",
  movieclip: "GMovieClip",
  jta: "GMovieClip",
  component: "GComponent",
  list: "GList",
  tree: "GTree"
};
var EXTENSION_TYPE_MAP = {
  Button: "GButton",
  Label: "GLabel",
  ComboBox: "GComboBox",
  ProgressBar: "GProgressBar",
  Slider: "GSlider",
  ScrollBar: "GScrollBar"
};
var EXTENSION_PROTOCOL_MAP = {
  Button: PROJECT_XML_PROTOCOL.buttonExtension,
  Label: PROJECT_XML_PROTOCOL.labelExtension,
  ComboBox: PROJECT_XML_PROTOCOL.comboBoxExtension,
  ProgressBar: PROJECT_XML_PROTOCOL.progressBarExtension,
  Slider: PROJECT_XML_PROTOCOL.sliderExtension,
  ScrollBar: PROJECT_XML_PROTOCOL.scrollBarExtension
};
var DISPLAY_OBJECT_PROTOCOL_MAP = {
  image: PROJECT_XML_PROTOCOL.image,
  text: PROJECT_XML_PROTOCOL.text,
  richtext: PROJECT_XML_PROTOCOL.richText,
  inputtext: PROJECT_XML_PROTOCOL.textInput,
  graph: PROJECT_XML_PROTOCOL.graph,
  group: PROJECT_XML_PROTOCOL.group,
  loader: PROJECT_XML_PROTOCOL.loader,
  loader3d: PROJECT_XML_PROTOCOL.loader3D,
  movieclip: PROJECT_XML_PROTOCOL.movieClip,
  jta: PROJECT_XML_PROTOCOL.movieClip,
  component: PROJECT_XML_PROTOCOL.componentInstance,
  list: PROJECT_XML_PROTOCOL.list,
  tree: PROJECT_XML_PROTOCOL.list
};
var DISPLAY_LIST_CONTAINER2 = PROJECT_XML_PROTOCOL.componentRoot.containers?.displayList;
if (!DISPLAY_LIST_CONTAINER2) {
  throw new Error("PROJECT_XML_PROTOCOL.componentRoot must define containers.displayList");
}
var DISPLAY_LIST_ALLOWED_VARIANTS = new Set(Object.keys(DISPLAY_LIST_CONTAINER2.items));
var GEAR_TAG_MAP = {
  gearDisplay: 0 /* Display */,
  gearXY: 1 /* XY */,
  gearSize: 2 /* Size */,
  gearLook: 3 /* Look */,
  gearColor: 4 /* Color */,
  gearAni: 5 /* Animation */,
  gearText: 6 /* Text */,
  gearIcon: 7 /* Icon */,
  gearDisplay2: 8 /* Display2 */,
  gearFontSize: 9 /* FontSize */
};
function appendOrderedValue(target, key, value) {
  const current = target[key];
  if (current === void 0) {
    target[key] = value;
    return;
  }
  if (Array.isArray(current)) {
    current.push(value);
    return;
  }
  target[key] = [current, value];
}
function normalizeOrderedChildren(entries) {
  const out = {};
  for (const entry of entries) {
    const attrs = entry[":@"] ?? {};
    for (const [tagName, value] of Object.entries(entry)) {
      if (tagName === ":@" || tagName === "#text") continue;
      const nestedEntries = Array.isArray(value) ? value : [];
      const normalizedChildren = normalizeOrderedChildren(nestedEntries);
      const normalizedValue = Object.keys(normalizedChildren).length > 0 ? { ...attrs, ...normalizedChildren } : { ...attrs };
      appendOrderedValue(out, tagName, normalizedValue);
    }
  }
  return out;
}
function getOrderedDisplayListItems(xmlContent) {
  const ordered = parseXMLPreserveOrder(xmlContent);
  const componentEntry = ordered.find((entry) => "component" in entry);
  if (!componentEntry) return [];
  const componentChildren = Array.isArray(componentEntry.component) ? componentEntry.component : [];
  const displayListEntry = componentChildren.find((entry) => "displayList" in entry);
  if (!displayListEntry) return [];
  const displayListChildren = Array.isArray(displayListEntry.displayList) ? displayListEntry.displayList : [];
  return displayListChildren.flatMap((entry) => {
    const rawTagName = Object.keys(entry).find((key) => key !== ":@" && key !== "#text");
    if (!rawTagName) return [];
    const attrs = entry[":@"] ?? {};
    const nestedEntries = Array.isArray(entry[rawTagName]) ? entry[rawTagName] : [];
    const rawAttrs = readRawDisplayListAttrs(xmlContent, rawTagName, attrs.id);
    return [{
      tagName: rawTagName.toLowerCase(),
      attrs: {
        ...rawAttrs,
        ...attrs,
        ...normalizeOrderedChildren(nestedEntries)
      }
    }];
  });
}
function readRawDisplayListAttrs(xmlContent, tagName, id) {
  if (typeof id !== "string" || !id) return {};
  const idPattern = escapeRegExp(id);
  const tagPattern = escapeRegExp(tagName);
  const match = xmlContent.match(new RegExp(`<${tagPattern}\\b([^>]*\\bid="${idPattern}"[^>]*)\\/?>`, "i"));
  if (!match?.[1]) return {};
  const attrText = match[1].replace(/\/\s*$/, "");
  const attrs = {};
  for (const attrMatch of attrText.matchAll(/([A-Za-z_:][\w:.-]*)\s*=\s*"([^"]*)"/g)) {
    attrs[attrMatch[1]] = attrMatch[2];
  }
  return attrs;
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getOrderedPackageResourceItems(xmlContent) {
  const ordered = parseXMLPreserveOrder(xmlContent);
  const packageEntry = ordered.find((entry) => "packageDescription" in entry);
  if (!packageEntry) return [];
  const packageChildren = Array.isArray(packageEntry.packageDescription) ? packageEntry.packageDescription : [];
  const resourcesEntry = packageChildren.find((entry) => "resources" in entry);
  if (!resourcesEntry) return [];
  const resourcesChildren = Array.isArray(resourcesEntry.resources) ? resourcesEntry.resources : [];
  return resourcesChildren.flatMap((entry) => {
    const tagName = Object.keys(entry).find((key) => key !== ":@" && key !== "#text");
    if (!tagName) return [];
    const attrs = entry[":@"] ?? {};
    return [{
      tagName,
      attrs
    }];
  });
}
function getXmlNode(value) {
  const node = Array.isArray(value) ? value[0] : value;
  if (!node || typeof node !== "object" || Array.isArray(node)) return null;
  return node;
}
function assignSetting(settings, key, value) {
  switch (key) {
    case "publish":
      settings.publish = value;
      break;
    case "common":
      settings.common = value;
      break;
    case "adaptation":
      settings.adaptation = value;
      break;
    default:
      settings[key] = value;
      break;
  }
}
function getProjectComponentExtras(comp) {
  return comp.getExtras();
}
function parseButtonMode(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  const map = {
    common: 0,
    check: 1,
    radio: 2
  };
  const parsed = Number(normalized);
  return map[normalized] ?? (Number.isFinite(parsed) ? parsed : 0);
}
function parseTitleType(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  const map = {
    percent: 0,
    valueandmax: 1,
    value: 2,
    max: 3
  };
  const parsed = Number(normalized);
  return map[normalized] ?? (Number.isFinite(parsed) ? parsed : 0);
}
function parseControllerActionType(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  switch (normalized) {
    case "play_transition":
      return 0 /* PlayTransition */;
    case "change_page":
      return 1 /* ChangePage */;
    default:
      return 0 /* PlayTransition */;
  }
}
function parseControllerActionPages(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw.split(",").map((entry) => entry.trim()).filter((entry) => entry !== "");
}
function getXmlScalar(value) {
  if (Array.isArray(value)) {
    return value.length > 0 ? String(value[0] ?? "") : "";
  }
  return value === void 0 || value === null ? "" : String(value);
}
function getProtocolChildName(protocol, childName) {
  return protocol.children?.[childName] ? childName : null;
}
function getProtocolGearChildNames(protocol) {
  return Object.keys(protocol.children ?? {}).filter((name) => name in GEAR_TAG_MAP);
}
function getProtocolExtensionChildNames(protocol) {
  return Object.keys(protocol.children ?? {}).filter((name) => name in EXTENSION_PROTOCOL_MAP);
}
function getDisplayListVariantName(tagName, attrs) {
  if (tagName === "loader3d") return "loader3D";
  if (tagName === "text") {
    const isInputText = parseBool(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.input));
    if (isInputText) return "inputtext";
  }
  if (tagName === "list") {
    const isTree = parseBool(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.treeView));
    if (isTree) return "tree";
  }
  return tagName;
}
function assertDisplayListTagAllowed(tagName, attrs, componentName) {
  if (!DISPLAY_TAG_MAP[tagName]) {
    throw new Error(`Unsupported displayList tag "${tagName}" in component "${componentName}"`);
  }
  const variantName = getDisplayListVariantName(tagName, attrs);
  if (!DISPLAY_LIST_ALLOWED_VARIANTS.has(variantName)) {
    throw new Error(
      `displayList variant "${variantName}" derived from tag "${tagName}" is not declared in protocol for component "${componentName}"`
    );
  }
}
function inferTreeItemFolderFlags(items) {
  return items.map((item, index) => {
    if (item.isFolder !== null) return item;
    const next = items[index + 1];
    if (next && next.level > item.level) {
      return { ...item, isFolder: true };
    }
    if (next && next.level <= item.level) {
      return { ...item, isFolder: false };
    }
    if (!item.icon && !item.url) {
      return { ...item, isFolder: true };
    }
    return { ...item, isFolder: false };
  });
}
function parseListItemXmlNode(item) {
  const specs = PROJECT_XML_PROTOCOL.listItem.attrs;
  const isFolder = readXmlAttr(item, specs.isFolder);
  const controllers = readXmlAttr(item, specs.controllers);
  return {
    title: readXmlAttr(item, specs.title) ?? null,
    icon: readXmlAttr(item, specs.icon) ?? null,
    url: readXmlAttr(item, specs.url) ?? null,
    name: readXmlAttr(item, specs.name) ?? null,
    selectedTitle: readXmlAttr(item, specs.selectedTitle) ?? null,
    selectedIcon: readXmlAttr(item, specs.selectedIcon) ?? null,
    level: parseInt2(readXmlAttr(item, specs.level)),
    isFolder: isFolder !== void 0 ? parseBool(isFolder) : null,
    ...controllers !== void 0 ? { controllers } : {}
  };
}
function parseComboBoxItemXmlNode(item) {
  const specs = PROJECT_XML_PROTOCOL.comboBoxItem.attrs;
  return {
    title: readXmlAttr(item, specs.title) ?? null,
    value: readXmlAttr(item, specs.value) ?? null,
    icon: readXmlAttr(item, specs.icon) ?? null
  };
}
var ProjectReader = class {
  _fs;
  constructor(fs3) {
    this._fs = fs3;
  }
  async read(projectPath) {
    const fs3 = this._fs;
    const doc = new Document();
    const basePath = projectPath.replace(/[/\\][^/\\]*\.fairy$/i, "");
    const ctx = new ReaderContext(doc, basePath);
    const fairyContent = await fs3.readFile(projectPath);
    const fairyXML = parseXML(fairyContent);
    const projDesc = getXmlNode(fairyXML.projectDescription);
    if (projDesc) {
      const root = doc.getRoot();
      root.setProjectId(projDesc.id ?? "");
      root.setProjectType(this._resolveProjectType(projDesc.type ?? ""));
      root.setVersion(projDesc.version ?? "");
    }
    await this._readSettings(ctx);
    const assetsPath = fs3.join(basePath, "assets");
    let packageDirs;
    try {
      packageDirs = await fs3.readdir(assetsPath);
    } catch {
      packageDirs = [];
    }
    for (const dirName of packageDirs) {
      const pkgXmlPath = fs3.join(assetsPath, dirName, "package.xml");
      if (!await fs3.exists(pkgXmlPath)) continue;
      await this._readPackage(ctx, dirName, pkgXmlPath);
    }
    const branchNames = await this._readPackageBranches(ctx);
    if (branchNames.length > 0) {
      doc.getRoot().setBranches(branchNames);
    }
    for (const [_key, resource] of ctx.resourceMap) {
      if (resource.propertyType !== "Component") continue;
      const comp = resource;
      const compPath = getProjectComponentExtras(comp)._filePath;
      if (!compPath) continue;
      try {
        const compContent = await fs3.readFile(compPath);
        this._parseComponentXML(ctx, comp, compContent);
      } catch (err2) {
        ctx.logger.warn(`Failed to parse component: ${compPath} \u2014 ${err2}`);
      }
    }
    return doc;
  }
  async _readPackageBranches(ctx) {
    const fs3 = this._fs;
    let dirNames = [];
    try {
      dirNames = await fs3.readdir(ctx.basePath);
    } catch {
      return [];
    }
    const branchNames = dirNames.filter((dirName) => dirName.startsWith("assets_") && dirName.length > "assets_".length).map((dirName) => dirName.slice("assets_".length)).sort((a, b) => a.localeCompare(b));
    for (const branchName of branchNames) {
      const branchAssetsPath = fs3.join(ctx.basePath, `assets_${branchName}`);
      let packageDirs = [];
      try {
        packageDirs = await fs3.readdir(branchAssetsPath);
      } catch {
        continue;
      }
      for (const dirName of packageDirs) {
        const pkgXmlPath = fs3.join(branchAssetsPath, dirName, "package_branch.xml");
        if (!await fs3.exists(pkgXmlPath)) continue;
        await this._readPackage(ctx, dirName, pkgXmlPath, branchName);
      }
    }
    return branchNames;
  }
  async _readSettings(ctx) {
    const fs3 = this._fs;
    const settingsPath = fs3.join(ctx.basePath, "settings");
    const settingFiles = [
      { name: "Publish.json", key: "publish" },
      { name: "Common.json", key: "common" },
      { name: "Adaptation.json", key: "adaptation" },
      { name: "CustomProperties.json", key: "customProperties" },
      { name: "i18n.json", key: "i18n" }
    ];
    for (const { name, key } of settingFiles) {
      try {
        const filePath = fs3.join(settingsPath, name);
        if (await fs3.exists(filePath)) {
          const content = await fs3.readFile(filePath);
          assignSetting(ctx.settings, key, JSON.parse(content));
        }
      } catch {
      }
    }
    ctx.document.getRoot().setSettings(ctx.settings);
  }
  async _readPackage(ctx, dirName, pkgXmlPath, branchName = "") {
    const fs3 = this._fs;
    const content = await fs3.readFile(pkgXmlPath);
    const xml = parseXML(content);
    const desc = branchName ? getXmlNode(xml.branchDescription) : getXmlNode(xml.packageDescription);
    if (!desc) return;
    let pkg = ctx.document.getRoot().getPackage(dirName);
    if (!pkg) {
      pkg = ctx.document.createPackage(dirName);
    }
    if (!branchName) {
      const packageId = readXmlAttr(desc, PROJECT_XML_PROTOCOL.packageDescription.attrs.id) || "";
      pkg.setId(packageId);
      const compressPNG = readXmlAttr(desc, PROJECT_XML_PROTOCOL.packageDescription.attrs.compressPNG);
      if (compressPNG !== void 0) pkg.setCompressPNG(parseBool(compressPNG));
      const jpegQuality = readXmlAttr(desc, PROJECT_XML_PROTOCOL.packageDescription.attrs.jpegQuality);
      if (jpegQuality !== void 0 && jpegQuality !== null && jpegQuality !== "") {
        pkg.setJpegQuality(parseInt2(jpegQuality, 0));
      }
    }
    const publish2 = !branchName ? desc.publish : void 0;
    if (publish2) {
      const publishName = readXmlAttr(publish2, PROJECT_XML_PROTOCOL.packagePublish.attrs.name) || dirName;
      pkg.setPublishName(publishName);
      pkg.setPublishPath(
        readXmlAttr(publish2, PROJECT_XML_PROTOCOL.packagePublish.attrs.path) || ""
      );
      pkg.setPublishBranchPath(
        readXmlAttr(publish2, PROJECT_XML_PROTOCOL.packagePublish.attrs.branchPath) || ""
      );
      pkg.setPublishPackageCount(parseInt2(
        readXmlAttr(publish2, PROJECT_XML_PROTOCOL.packagePublish.attrs.packageCount),
        0
      ));
      pkg.setGenCode(parseBool(
        readXmlAttr(publish2, PROJECT_XML_PROTOCOL.packagePublish.attrs.genCode)
      ));
      pkg.setCodePath(
        readXmlAttr(publish2, PROJECT_XML_PROTOCOL.packagePublish.attrs.codePath) || ""
      );
    }
    if (pkg.getId()) {
      ctx.packageMap.set(pkg.getId(), pkg);
    }
    const resources = desc.resources;
    if (!resources) return;
    const packageDir = branchName ? fs3.join(ctx.basePath, `assets_${branchName}`, dirName) : fs3.join(ctx.basePath, "assets", dirName);
    const createdResources = [];
    const orderedResources = getOrderedPackageResourceItems(content);
    if (orderedResources.length > 0) {
      for (const { tagName, attrs } of orderedResources) {
        const resource = this._createResourceFromXML(ctx, pkg, tagName, attrs, packageDir, branchName);
        if (resource) createdResources.push(resource);
      }
      await this._hydratePackageImageSizes(createdResources, packageDir);
      return;
    }
    for (const tagName of ["image", "component", "font", "sound", "movieclip", "swf", "misc", "atlas"]) {
      const items = ensureArray(resources[tagName]);
      for (const item of items) {
        const attrs = getXmlNode(item);
        if (!attrs) continue;
        const resource = this._createResourceFromXML(ctx, pkg, tagName, attrs, packageDir, branchName);
        if (resource) createdResources.push(resource);
      }
    }
    await this._hydratePackageImageSizes(createdResources, packageDir);
  }
  async _hydratePackageImageSizes(resources, packageDir) {
    const fs3 = this._fs;
    for (const resource of resources) {
      if (resource.propertyType !== "ImageResource") continue;
      const image = resource;
      if ((image.getWidth?.() ?? 0) > 0 && (image.getHeight?.() ?? 0) > 0) continue;
      const fileName = image.getFileName?.() ?? "";
      if (!fileName) continue;
      const resourcePath = image.getPath?.() ?? "/";
      const filePath = fs3.join(packageDir, resourcePath.replace(/^\//, ""), fileName);
      if (!await fs3.exists(filePath)) continue;
      try {
        const size = readImageSize(await fs3.readFileRaw(filePath));
        if (!size) continue;
        if ((image.getWidth?.() ?? 0) === 0) image.setWidth?.(size.width);
        if ((image.getHeight?.() ?? 0) === 0) image.setHeight?.(size.height);
      } catch {
      }
    }
  }
  _createResourceFromXML(ctx, pkg, tagName, attrs, packageDir, branchName = "") {
    const doc = ctx.document;
    const fs3 = this._fs;
    const id = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.id) ?? "";
    const name = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.name) ?? "";
    const path3 = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.path) ?? "/";
    const exported = parseBool(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.exported));
    switch (tagName) {
      case "image": {
        const res = doc.createImageResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setExported(exported);
        res.setFileName(name);
        const textureSetMode = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.atlas);
        if (textureSetMode !== void 0) res.setTextureSetMode(textureSetMode);
        const scale = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.scale);
        const scale9grid = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.scale9grid);
        if (scale === "9grid" && scale9grid) {
          res.setScaleOption(1);
          res.setScale9Grid(parseScale9GridString(scale9grid));
        } else if (scale === "tile") {
          res.setScaleOption(2);
        }
        const imageWidth = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.width);
        if (imageWidth !== void 0) res.setWidth(parseInt2(imageWidth));
        const imageHeight = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.height);
        if (imageHeight !== void 0) res.setHeight(parseInt2(imageHeight));
        const gridTile = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.gridTile);
        if (gridTile !== void 0) res.setTileGridIndice(parseInt2(gridTile));
        const qualityOption = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.qualityOption);
        if (qualityOption !== void 0) res.setQualityOption(qualityOption);
        res.setDuplicatePadding(parseBool(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.duplicatePadding)));
        res.setSmoothing(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.smoothing) !== "false");
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "component": {
        const res = doc.createComponent(name.replace(/\.xml$/i, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setExported(exported);
        const filePath = fs3.join(packageDir, path3.replace(/^\//, ""), name);
        res.setExtras({ ...res.getExtras(), _filePath: filePath });
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "sound": {
        const res = doc.createSoundResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setFile(name);
        res.setExported(exported);
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "misc": {
        const res = doc.createMiscResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setFile(name);
        res.setExported(exported);
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "font": {
        const res = doc.createFontResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setFileName(name);
        res.setExported(exported);
        const texture = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageFontResource.attrs.texture);
        if (texture) {
          res.setTextureId(texture);
        }
        const renderMode = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageFontResource.attrs.renderMode);
        if (renderMode !== void 0) res.setRenderMode(renderMode);
        const samplePointSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageFontResource.attrs.samplePointSize);
        if (samplePointSize !== void 0) res.setSamplePointSize(parseInt2(samplePointSize));
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "spine": {
        const res = doc.createSpineResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setFile(name);
        res.setExported(exported);
        res.setWidth(parseInt2(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.width)));
        res.setHeight(parseInt2(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.height)));
        const requireValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.require);
        res.setRequireIds(requireValue ? String(requireValue).split(",").filter(Boolean) : []);
        const atlasNamesValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.atlasNames);
        res.setAtlasNames(atlasNamesValue ? String(atlasNamesValue).split(",").filter(Boolean) : []);
        const anchorValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.anchor);
        if (anchorValue) {
          const [anchorX, anchorY] = anchorValue.split(",").map((part) => parseFloat2(part));
          res.setAnchor(anchorX, anchorY);
        }
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "dragonbones": {
        const res = doc.createDragonBonesResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setFile(name);
        res.setExported(exported);
        res.setWidth(parseInt2(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.width)));
        res.setHeight(parseInt2(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.height)));
        const requireValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.require);
        res.setRequireIds(requireValue ? String(requireValue).split(",").filter(Boolean) : []);
        const atlasNamesValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.atlasNames);
        res.setAtlasNames(atlasNamesValue ? String(atlasNamesValue).split(",").filter(Boolean) : []);
        const anchorValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.anchor);
        if (anchorValue) {
          const [anchorX, anchorY] = anchorValue.split(",").map((part) => parseFloat2(part));
          res.setAnchor(anchorX, anchorY);
        }
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      case "movieclip": {
        const res = doc.createMovieClipResource(name.replace(/\.\w+$/, ""));
        res.setId(id);
        res.setPath(path3);
        res.setBranch(branchName);
        res.setFileName(name);
        res.setExported(exported);
        const mcWidth = Number(attrs.width ?? 0) || 0;
        const mcHeight = Number(attrs.height ?? 0) || 0;
        if (mcWidth > 0) res.setWidth(mcWidth);
        if (mcHeight > 0) res.setHeight(mcHeight);
        pkg.addResource(res);
        ctx.registerResource(pkg.getId(), id, res);
        return res;
      }
      default: {
        return null;
      }
    }
  }
  _parseComponentXML(ctx, comp, xmlContent) {
    const xml = parseXML(xmlContent);
    const compNode = getXmlNode(xml.component);
    if (!compNode) return;
    const orderedDisplayItems = getOrderedDisplayListItems(xmlContent);
    const doc = ctx.document;
    const compSize = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.size);
    if (compSize) {
      const [w, h] = parseSizeString(compSize);
      comp.setSize(w, h);
    }
    const overflow = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.overflow);
    if (overflow) {
      const overflowMap = { visible: 0, hidden: 1, scroll: 2 };
      comp.setOverflow?.(overflowMap[overflow] ?? 0);
    }
    const pivot = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.pivot);
    if (pivot) {
      const parts = pivot.split(",");
      comp.setPivotX?.(parseFloat(parts[0]) || 0);
      comp.setPivotY?.(parseFloat(parts[1]) || 0);
      const anchor = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.anchor);
      if (anchor !== void 0) comp.setPivotAsAnchor?.(parseBool(anchor));
    }
    const margin = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.margin);
    if (margin) {
      const parts = margin.split(",").map(Number);
      comp.setMargin?.({ top: parts[0] ?? 0, bottom: parts[1] ?? 0, left: parts[2] ?? 0, right: parts[3] ?? 0 });
    }
    const restrictSize = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.restrictSize);
    if (restrictSize) {
      const parts = restrictSize.split(",").map(Number);
      comp.setMinWidth?.(parts[0] ?? 0);
      comp.setMaxWidth?.(parts[1] ?? 0);
      comp.setMinHeight?.(parts[2] ?? 0);
      comp.setMaxHeight?.(parts[3] ?? 0);
    }
    const bgColor = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.bgColor);
    if (bgColor !== void 0) comp.setBgColor?.(bgColor);
    const bgColorEnabled = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.bgColorEnabled);
    if (bgColorEnabled !== void 0) comp.setBgColorEnabled?.(parseBool(bgColorEnabled));
    const designImageAlpha = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageAlpha);
    if (designImageAlpha !== void 0) comp.setDesignImageAlpha?.(parseInt2(designImageAlpha));
    const designImageLayer = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageLayer);
    if (designImageLayer !== void 0) comp.setDesignImageLayer?.(parseInt2(designImageLayer));
    const designImageOffsetX = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageOffsetX);
    if (designImageOffsetX !== void 0) comp.setDesignImageOffsetX?.(parseInt2(designImageOffsetX));
    const designImageOffsetY = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageOffsetY);
    if (designImageOffsetY !== void 0) comp.setDesignImageOffsetY?.(parseInt2(designImageOffsetY));
    const idNum = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.idnum);
    if (idNum !== void 0) comp.setIdNum?.(parseInt2(idNum));
    const initName = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.initName);
    if (initName !== void 0) comp.setInitName?.(initName);
    const remark = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.remark);
    if (remark !== void 0) comp.setRemark?.(remark);
    const clipSoftness = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.clipSoftness);
    if (clipSoftness) {
      const parts = clipSoftness.split(",").map(Number);
      comp.setClipSoftness?.({ x: parts[0] ?? 0, y: parts[1] ?? 0 });
    }
    const opaque = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.opaque);
    if (opaque !== void 0) {
      comp.setOpaque?.(parseBool(opaque));
    }
    const mask = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.mask);
    if (mask !== void 0) comp.setMask?.(mask);
    const reversedMask = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.reversedMask);
    if (reversedMask !== void 0) comp.setReversedMask?.(parseBool(reversedMask));
    const hitTest = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.hitTest);
    if (hitTest !== void 0) comp.setHitTest?.(hitTest);
    const customData = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.customData);
    if (customData !== void 0) comp.setCustomData?.(customData);
    if (overflow === "scroll") {
      const scroll = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.scroll);
      if (scroll) {
        const scrollMap = { horizontal: 0, vertical: 1, both: 2 };
        comp.setScrollType?.(scrollMap[scroll] ?? 1);
      }
      const scrollBar = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBar);
      if (scrollBar) {
        const barMap = { default: 0, visible: 1, auto: 2, hidden: 3 };
        comp.setScrollBarDisplay?.(barMap[scrollBar] ?? 0);
      }
      const scrollBarFlags = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBarFlags);
      if (scrollBarFlags !== void 0) comp.setScrollBarFlags?.(parseInt2(scrollBarFlags));
      const scrollBarMargin = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBarMargin);
      if (scrollBarMargin) {
        const parts = scrollBarMargin.split(",").map(Number);
        comp.setScrollBarMargin?.({
          top: parts[0] ?? 0,
          bottom: parts[1] ?? 0,
          left: parts[2] ?? 0,
          right: parts[3] ?? 0
        });
      }
      const scrollBarRes = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBarRes);
      if (scrollBarRes) {
        const parts = scrollBarRes.split(",");
        comp.setVtScrollBarRes?.(parts[0] ?? "");
        comp.setHzScrollBarRes?.(parts[1] ?? "");
      }
      const ptrRes = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.ptrRes);
      if (ptrRes) {
        const parts = ptrRes.split(",");
        comp.setHeaderRes?.(parts[0] ?? "");
        comp.setFooterRes?.(parts[1] ?? "");
      }
    }
    const extention = readXmlAttr(compNode, PROJECT_XML_PROTOCOL.componentRoot.attrs.extention);
    if (extention) {
      const extType = EXTENSION_TYPE_MAP[extention];
      if (extType) {
        comp.setExtensionType?.(extention);
        const extChildName = getProtocolChildName(PROJECT_XML_PROTOCOL.componentRoot, extention);
        const extElement = extChildName ? compNode[extChildName] : void 0;
        if (extElement) {
          const extAttrs = getXmlNode(extElement);
          if (extAttrs) {
            switch (extention) {
              case "Button":
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.mode) !== void 0) comp.setButtonMode?.(parseButtonMode(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.mode)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.sound) !== void 0) comp.setSound?.(String(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.sound)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.soundVolumeScale) !== void 0) comp.setSoundVolumeScale?.(parseFloat2(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.soundVolumeScale), 1));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.downEffect) !== void 0) comp.setDownEffect?.(parseInt2(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.downEffect)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.downEffectValue) !== void 0) comp.setDownEffectValue?.(parseFloat2(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Button.attrs.downEffectValue), 0.8));
                break;
              case "ComboBox":
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ComboBox.attrs.dropdown) !== void 0) comp.setDropdown?.(String(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ComboBox.attrs.dropdown)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ComboBox.attrs.selectionController) !== void 0) comp.setSelectionController?.(String(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ComboBox.attrs.selectionController)));
                break;
              case "Label":
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Label.attrs.prompt) !== void 0) comp.setPromptText?.(String(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Label.attrs.prompt)));
                break;
              case "ProgressBar":
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ProgressBar.attrs.titleType) !== void 0) comp.setTitleType?.(parseTitleType(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ProgressBar.attrs.titleType)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ProgressBar.attrs.reverse) !== void 0) comp.setReverse?.(parseBool(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ProgressBar.attrs.reverse)));
                break;
              case "Slider":
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.titleType) !== void 0) comp.setTitleType?.(parseTitleType(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.titleType)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.reverse) !== void 0) comp.setReverse?.(parseBool(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.reverse)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.wholeNumbers) !== void 0) comp.setWholeNumbers?.(parseBool(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.wholeNumbers)));
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.changeOnClick) !== void 0) comp.setChangeOnClick?.(parseBool(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.Slider.attrs.changeOnClick)));
                break;
              case "ScrollBar":
                if (readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ScrollBar.attrs.fixedGripSize) !== void 0) comp.setFixedGripSize?.(parseBool(readXmlAttr(extAttrs, EXTENSION_PROTOCOL_MAP.ScrollBar.attrs.fixedGripSize)));
                break;
              default:
                break;
            }
          }
        }
      }
    }
    const localControllers = /* @__PURE__ */ new Map();
    const controllers = ensureArray(compNode.controller);
    for (const ctrlDef of controllers) {
      const ctrlName = readXmlAttr(ctrlDef, PROJECT_XML_PROTOCOL.controller.attrs.name) ?? "";
      const ctrl = doc.createController(ctrlName);
      const selected = readXmlAttr(ctrlDef, PROJECT_XML_PROTOCOL.controller.attrs.selected);
      ctrl.setSelectedIndex(parseInt2(selected));
      const pagesAttr = readXmlAttr(ctrlDef, PROJECT_XML_PROTOCOL.controller.attrs.pages) ?? "";
      const pages = parseControllerPages(pagesAttr);
      for (const page of pages) {
        const p = doc.createControllerPage(page.name);
        p.setId(page.id);
        ctrl.addPage(p);
      }
      const controllerActionChildName = getProtocolChildName(PROJECT_XML_PROTOCOL.controller, "action");
      const actions = controllerActionChildName ? ensureArray(ctrlDef[controllerActionChildName]) : [];
      for (let actionIndex = 0; actionIndex < actions.length; actionIndex += 1) {
        const actionDef = getXmlNode(actions[actionIndex]);
        if (!actionDef) continue;
        const action = doc.createControllerAction(`${ctrl.getName()}_action${actionIndex}`);
        const actionType = parseControllerActionType(readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.type));
        const fromPage = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.fromPage);
        const toPage = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.toPage);
        action.setActionType(actionType).setFromPage(parseControllerActionPages(fromPage)).setToPage(parseControllerActionPages(toPage));
        switch (actionType) {
          case 0 /* PlayTransition */: {
            const transitionName = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.transition);
            const repeat = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.repeat);
            const delay = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.delay);
            const stopOnExit = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.stopOnExit);
            action.setTransitionName(getXmlScalar(transitionName)).setPlayTimes(parseInt2(repeat, 1)).setDelay(parseFloat2(delay)).setStopOnExit(parseBool(stopOnExit));
            break;
          }
          case 1 /* ChangePage */: {
            const objectId = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.objectId);
            const controllerName = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.controller);
            const targetPage = readXmlAttr(actionDef, PROJECT_XML_PROTOCOL.controllerAction.attrs.targetPage);
            action.setObjectId(getXmlScalar(objectId)).setControllerName(getXmlScalar(controllerName)).setTargetPage(getXmlScalar(targetPage));
            break;
          }
          default:
            break;
        }
        ctrl.addAction(action);
      }
      comp.addController(ctrl);
      localControllers.set(ctrl.getName(), ctrl);
    }
    if (orderedDisplayItems.length > 0) {
      for (const { tagName, attrs } of orderedDisplayItems) {
        assertDisplayListTagAllowed(tagName, attrs, comp.getName());
        const child = this._createDisplayObject(ctx, doc, tagName, attrs, localControllers);
        if (child) comp.addChild(child);
      }
    } else {
      const displayList = compNode.displayList;
      if (displayList) {
        for (const tagName of Object.keys(displayList)) {
          const items = ensureArray(displayList[tagName]);
          for (const itemDef of items) {
            assertDisplayListTagAllowed(tagName, itemDef, comp.getName());
            const child = this._createDisplayObject(ctx, doc, tagName, itemDef, localControllers);
            if (child) {
              comp.addChild(child);
            }
          }
        }
      }
    }
    const relationChildName = getProtocolChildName(PROJECT_XML_PROTOCOL.componentRoot, "relation");
    const compRelations = relationChildName ? ensureArray(compNode[relationChildName]) : [];
    for (const relDef of compRelations) {
      const parsedRelation = getXmlNode(relDef);
      if (!parsedRelation) continue;
      const sidePair = readXmlAttr(parsedRelation, PROJECT_XML_PROTOCOL.relation.attrs.sidePair) || "";
      const sidePairs = parseSidePair(sidePair);
      for (const sp of sidePairs) {
        const target = readXmlAttr(parsedRelation, PROJECT_XML_PROTOCOL.relation.attrs.target) || "";
        const rel = { target, type: sp.type, usePercent: sp.usePercent };
        comp.addRelation(rel);
      }
    }
    const transitions = ensureArray(compNode.transition);
    for (const transDef of transitions) {
      const transitionName = readXmlAttr(transDef, PROJECT_XML_PROTOCOL.transition.attrs.name) ?? "";
      const trans = doc.createTransition(transitionName);
      const autoPlay = readXmlAttr(transDef, PROJECT_XML_PROTOCOL.transition.attrs.autoPlay);
      const autoPlayTimes = readXmlAttr(transDef, PROJECT_XML_PROTOCOL.transition.attrs.autoPlayTimes);
      const autoPlayDelay = readXmlAttr(transDef, PROJECT_XML_PROTOCOL.transition.attrs.autoPlayDelay);
      const options = readXmlAttr(transDef, PROJECT_XML_PROTOCOL.transition.attrs.options);
      const fps = readXmlAttr(transDef, PROJECT_XML_PROTOCOL.transition.attrs.fps);
      trans.setAutoPlay(parseBool(autoPlay));
      trans.setAutoPlayTimes(parseInt2(autoPlayTimes, 1));
      trans.setAutoPlayDelay(parseFloat2(autoPlayDelay));
      if (options !== void 0) trans.setOptions?.(parseInt2(options));
      if (fps !== void 0) trans.setFps?.(parseInt2(fps));
      const transitionItemChildName = getProtocolChildName(PROJECT_XML_PROTOCOL.transition, "item");
      const items = transitionItemChildName ? ensureArray(transDef[transitionItemChildName]) : [];
      for (const itemDef of items) {
        const parsedItem = getXmlNode(itemDef);
        if (!parsedItem) continue;
        const ti = doc.createTransitionItem();
        const time = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.time);
        const target = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.target);
        const tween = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.tween);
        const duration = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.duration);
        const repeat = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.repeat);
        const yoyo = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.yoyo);
        const label = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.label);
        const label2 = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.label2);
        const pathValue = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.path);
        ti.setTime(parseFloat2(time));
        ti.setTargetId(target || "");
        ti.setTween(parseBool(tween));
        ti.setDuration(parseFloat2(duration));
        ti.setRepeat(parseInt2(repeat));
        ti.setYoyo(parseBool(yoyo));
        ti.setLabel(label || "");
        if (label2 !== void 0) ti.setEndLabel?.(label2);
        if (pathValue !== void 0) ti.setPath?.(pathValue);
        const ease = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.ease);
        if (ease) {
          ti.setEaseType?.(_parseEaseType(ease));
        }
        const typeStr = (readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.type) || "").toUpperCase();
        const actionTypeMap = {
          XY: 0,
          SIZE: 1,
          SCALE: 2,
          PIVOT: 3,
          ALPHA: 4,
          ROTATION: 5,
          COLOR: 6,
          ANIMATION: 7,
          VISIBLE: 8,
          SOUND: 9,
          TRANSITION: 10,
          SHAKE: 11,
          COLORFILTER: 12,
          SKEW: 13,
          TEXT: 14,
          ICON: 15
        };
        ti.setActionType(actionTypeMap[typeStr] ?? 16);
        const value = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.value);
        if (value !== void 0) {
          ti.setStartValue(String(value).split(","));
        }
        const startValue = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.startValue);
        if (startValue !== void 0) {
          ti.setStartValue(String(startValue).split(","));
        }
        const endValue = readXmlAttr(parsedItem, PROJECT_XML_PROTOCOL.transitionItem.attrs.endValue);
        if (endValue !== void 0) {
          ti.setEndValue(String(endValue).split(","));
        }
        trans.addItem(ti);
      }
      comp.addTransition(trans);
    }
  }
  _createDisplayObject(ctx, doc, tagName, attrs, localControllers) {
    const name = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.displayObject.attrs.name) ?? "";
    let obj;
    switch (tagName) {
      case "image": {
        const g = doc.createGImage(name);
        const imageSrc = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.src);
        g.setSrc(imageSrc || "");
        const imageXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.xy);
        if (imageXY) {
          const [x, y] = parseXYString(imageXY);
          g.setXY(x, y);
        }
        const imageSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.size);
        if (imageSize) {
          const [w, h] = parseSizeString(imageSize);
          g.setSize(w, h);
        }
        const imageLocked = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.locked);
        if (imageLocked !== void 0) g.setLocked(parseBool(imageLocked));
        const imageGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.group);
        if (imageGroup) g.setGroup(imageGroup);
        const imageAspect = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.aspect);
        if (imageAspect !== void 0) g.setAspect(parseBool(imageAspect));
        const imagePivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.pivot);
        if (imagePivot) {
          const [pivotX, pivotY] = parseXYString(imagePivot);
          const imageAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(imageAnchor));
        }
        const imageScale = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.scale);
        if (imageScale) {
          const [scaleX, scaleY] = parseXYString(imageScale);
          g.setScale(scaleX, scaleY);
        }
        const imageRotation = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.rotation);
        if (imageRotation !== void 0) g.setRotation(parseFloat2(imageRotation));
        const imageAlpha = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.alpha);
        if (imageAlpha !== void 0) g.setAlpha(parseFloat2(imageAlpha, 1));
        const imageVisible = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.visible);
        if (imageVisible !== void 0) g.setVisible(parseBool(imageVisible));
        const imageGrayed = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.grayed);
        if (imageGrayed !== void 0) g.setGrayed(parseBool(imageGrayed));
        const imageFileName2 = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fileName);
        if (imageFileName2 !== void 0) g.setFileName(imageFileName2);
        const imagePackageId = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.pkg);
        if (imagePackageId !== void 0) g.setPackageId(imagePackageId);
        const imageFilter = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.filter);
        if (imageFilter !== void 0) g.setFilter(imageFilter);
        const imageFilterData = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.filterData);
        if (imageFilterData !== void 0) g.setFilterData(imageFilterData);
        const imageColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.color);
        if (imageColor) g.setColor(imageColor);
        const imageFlip = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.flip);
        if (imageFlip !== void 0) {
          const flipRaw = String(imageFlip).trim().toLowerCase();
          const flipMap = {
            hz: 1,
            horizontal: 1,
            vt: 2,
            vertical: 2,
            both: 3
          };
          g.setFlip(flipMap[flipRaw] ?? parseInt2(imageFlip));
        }
        const imageFillMethod = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillMethod);
        const imageFillOrigin = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillOrigin);
        const imageFillClockwise = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillClockwise);
        const imageFillAmount = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillAmount);
        if (imageFillMethod || imageFillOrigin !== void 0 || imageFillClockwise !== void 0 || imageFillAmount !== void 0) {
          const fillMap = { none: 0, hz: 1, vt: 2, radial90: 3, radial180: 4, radial360: 5 };
          g.setFillMethod(fillMap[imageFillMethod ?? ""] ?? 0);
          g.setFillOrigin(parseInt2(imageFillOrigin));
          g.setFillClockwise(imageFillClockwise !== "false");
          g.setFillAmount(parseInt2(imageFillAmount, 100) / 100);
        }
        obj = g;
        break;
      }
      case "text": {
        const isInputText = parseBool(readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.input));
        const g = isInputText ? doc.createGTextInput(name) : doc.createGTextField(name);
        const textXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.xy);
        if (textXY) {
          const [x, y] = parseXYString(textXY);
          g.setXY(x, y);
        }
        const textSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.size);
        if (textSize) {
          const [w, h] = parseSizeString(textSize);
          g.setSize(w, h);
        }
        const textPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.pivot);
        if (textPivot) {
          const [pivotX, pivotY] = parseXYString(textPivot);
          const textAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(textAnchor));
        }
        const textScale = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.scale);
        if (textScale) {
          const [scaleX, scaleY] = parseXYString(textScale);
          g.setScale(scaleX, scaleY);
        }
        const textRestrictSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.restrictSize);
        if (textRestrictSize) {
          const parts = textRestrictSize.split(",").map(Number);
          g.setMinWidth?.(parts[0] ?? 0);
          g.setMaxWidth?.(parts[1] ?? 0);
          g.setMinHeight?.(parts[2] ?? 0);
          g.setMaxHeight?.(parts[3] ?? 0);
        }
        const textGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.group);
        if (textGroup) g.setGroup(textGroup);
        const textCustomData = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.customData);
        if (textCustomData !== void 0) g.setCustomData(textCustomData);
        const textValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.text);
        if (textValue !== void 0) g.setText(String(textValue));
        const textFontSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.fontSize);
        if (textFontSize !== void 0) g.setFontSize(parseInt2(textFontSize));
        const textFont = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.font);
        if (textFont) g.setFont(textFont);
        const textColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.color);
        if (textColor) g.setColor(textColor);
        const textAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.align);
        if (textAlign) {
          const alignMap = { left: 0, center: 1, right: 2 };
          g.setAlign(alignMap[textAlign] ?? 0);
        }
        const textVAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.vAlign);
        if (textVAlign) {
          const vAlignMap = { top: 0, middle: 1, bottom: 2 };
          g.setVAlign(vAlignMap[textVAlign] ?? 0);
        }
        const textAutoSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoSize);
        if (textAutoSize) {
          const autoSizeMap = { none: 0, both: 1, height: 2, shrink: 3, ellipsis: 4 };
          g.setAutoSize(autoSizeMap[textAutoSize] ?? 1);
        }
        const textSingleLine = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.singleLine);
        if (textSingleLine !== void 0) g.setSingleLine(parseBool(textSingleLine));
        const textAutoClearText = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoClearText);
        if (textAutoClearText !== void 0) g.setAutoClearText?.(parseBool(textAutoClearText));
        const textDemoText = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.demoText);
        if (textDemoText !== void 0) g.setDemoText?.(String(textDemoText));
        const textVars = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.vars);
        if (textVars !== void 0) g.setTemplateVarsEnabled?.(parseBool(textVars));
        const textFaceDilate = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.faceDilate);
        if (textFaceDilate !== void 0) g.setFaceDilate?.(parseFloat2(textFaceDilate));
        const textUnderlaySoftness = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.underlaySoftness);
        if (textUnderlaySoftness !== void 0) g.setUnderlaySoftness?.(parseFloat2(textUnderlaySoftness));
        const textUbb = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.ubb);
        if (textUbb !== void 0) g.setUbbEnabled(parseBool(textUbb));
        const textLeading = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.leading);
        if (textLeading !== void 0) g.setLeading?.(parseInt2(textLeading));
        const textLetterSpacing = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.letterSpacing);
        if (textLetterSpacing !== void 0) g.setLetterSpacing?.(parseInt2(textLetterSpacing));
        const textUnderline = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.underline);
        if (textUnderline !== void 0) g.setUnderline?.(parseBool(textUnderline));
        const textItalic = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.italic);
        if (textItalic !== void 0) g.setItalic?.(parseBool(textItalic));
        const textBold = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.bold);
        if (textBold !== void 0) g.setBold?.(parseBool(textBold));
        const textStrikethrough = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strikethrough);
        if (textStrikethrough !== void 0) g.setStrikethrough?.(parseBool(textStrikethrough));
        const textStrokeColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeColor);
        if (textStrokeColor) {
          g.setStrokeColor?.(textStrokeColor);
          const textStrokeSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeSize);
          g.setStrokeSize?.(parseInt2(textStrokeSize, 1));
        }
        const textShadowColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.shadowColor);
        if (textShadowColor) {
          g.setShadowColor?.(textShadowColor);
          const textShadowOffset = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.shadowOffset);
          const shadowParts = String(textShadowOffset ?? "1,1").split(",");
          g.setShadowOffset?.({
            x: parseFloat(shadowParts[0] ?? "1") || 1,
            y: parseFloat(shadowParts[1] ?? "1") || 1
          });
        }
        if (isInputText) {
          const input = g;
          const prompt = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.prompt);
          if (prompt !== void 0) input.setPromptText(String(prompt));
          const inputMaxLength = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.maxLength);
          if (inputMaxLength !== void 0) input.setMaxLength(parseInt2(inputMaxLength));
          const inputRestrict = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.restrict);
          if (inputRestrict !== void 0) input.setRestrict(String(inputRestrict));
          const inputPassword = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.password);
          if (inputPassword !== void 0) input.setPassword(parseBool(inputPassword));
          const inputKeyboardType = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.keyboardType);
          if (inputKeyboardType !== void 0) input.setKeyboardType?.(parseInt2(inputKeyboardType));
        }
        obj = g;
        break;
      }
      case "richtext": {
        const g = doc.createGRichTextField(name);
        const richTextXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.xy);
        if (richTextXY) {
          const [x, y] = parseXYString(richTextXY);
          g.setXY(x, y);
        }
        const richTextSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.size);
        if (richTextSize) {
          const [w, h] = parseSizeString(richTextSize);
          g.setSize(w, h);
        }
        const richTextPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.pivot);
        if (richTextPivot) {
          const [pivotX, pivotY] = parseXYString(richTextPivot);
          const richTextAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(richTextAnchor));
        }
        const richTextRestrictSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.richText.attrs.restrictSize);
        if (richTextRestrictSize) {
          const parts = richTextRestrictSize.split(",").map(Number);
          g.setMinWidth?.(parts[0] ?? 0);
          g.setMaxWidth?.(parts[1] ?? 0);
          g.setMinHeight?.(parts[2] ?? 0);
          g.setMaxHeight?.(parts[3] ?? 0);
        }
        const richTextGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.group);
        if (richTextGroup) g.setGroup(richTextGroup);
        const richText = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.text);
        if (richText !== void 0) g.setText(String(richText));
        const richTextFontSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.fontSize);
        if (richTextFontSize !== void 0) g.setFontSize(parseInt2(richTextFontSize));
        const richTextFont = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.font);
        if (richTextFont) g.setFont(richTextFont);
        const richTextColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.color);
        if (richTextColor) g.setColor(richTextColor);
        const richTextAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.align);
        if (richTextAlign) {
          const m = { left: 0, center: 1, right: 2 };
          g.setAlign(m[richTextAlign] ?? 0);
        }
        const richTextVAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.vAlign);
        if (richTextVAlign) {
          const m = { top: 0, middle: 1, bottom: 2 };
          g.setVAlign(m[richTextVAlign] ?? 0);
        }
        const richTextLeading = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.leading);
        if (richTextLeading !== void 0) g.setLeading?.(parseInt2(richTextLeading));
        const richTextLetterSpacing = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.letterSpacing);
        if (richTextLetterSpacing !== void 0) g.setLetterSpacing?.(parseInt2(richTextLetterSpacing));
        const richTextUbb = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.ubb);
        if (richTextUbb !== void 0) g.setUbbEnabled?.(parseBool(richTextUbb));
        const richTextAutoSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoSize);
        if (richTextAutoSize) {
          const m = { none: 0, both: 1, height: 2, shrink: 3 };
          g.setAutoSize(m[richTextAutoSize] ?? 1);
        }
        const richTextSingleLine = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.singleLine);
        if (richTextSingleLine !== void 0) g.setSingleLine?.(parseBool(richTextSingleLine));
        const richTextAutoClearText = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoClearText);
        if (richTextAutoClearText !== void 0) g.setAutoClearText?.(parseBool(richTextAutoClearText));
        const richTextUnderlaySoftness = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.richText.attrs.underlaySoftness);
        if (richTextUnderlaySoftness !== void 0) g.setUnderlaySoftness?.(parseFloat2(richTextUnderlaySoftness));
        const richTextUnderline = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.underline);
        if (richTextUnderline !== void 0) g.setUnderline?.(parseBool(richTextUnderline));
        const richTextItalic = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.italic);
        if (richTextItalic !== void 0) g.setItalic?.(parseBool(richTextItalic));
        const richTextBold = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.bold);
        if (richTextBold !== void 0) g.setBold?.(parseBool(richTextBold));
        const richTextStrikethrough = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strikethrough);
        if (richTextStrikethrough !== void 0) g.setStrikethrough?.(parseBool(richTextStrikethrough));
        const richTextStrokeColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeColor);
        if (richTextStrokeColor) {
          g.setStrokeColor?.(richTextStrokeColor);
          const richTextStrokeSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeSize);
          g.setStrokeSize?.(parseInt2(richTextStrokeSize, 1));
        }
        const richTextShadowColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.shadowColor);
        if (richTextShadowColor) {
          g.setShadowColor?.(richTextShadowColor);
          const richTextShadowOffset = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.shadowOffset);
          const shadowParts = String(richTextShadowOffset ?? "1,1").split(",");
          g.setShadowOffset?.({
            x: parseFloat(shadowParts[0] ?? "1") || 1,
            y: parseFloat(shadowParts[1] ?? "1") || 1
          });
        }
        obj = g;
        break;
      }
      case "inputtext": {
        const g = doc.createGTextInput(name);
        const inputXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.xy);
        if (inputXY) {
          const [x, y] = parseXYString(inputXY);
          g.setXY(x, y);
        }
        const inputSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.size);
        if (inputSize) {
          const [w, h] = parseSizeString(inputSize);
          g.setSize(w, h);
        }
        const inputPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.pivot);
        if (inputPivot) {
          const [pivotX, pivotY] = parseXYString(inputPivot);
          const inputAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(inputAnchor));
        }
        const inputRestrictSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.restrictSize);
        if (inputRestrictSize) {
          const parts = inputRestrictSize.split(",").map(Number);
          g.setMinWidth?.(parts[0] ?? 0);
          g.setMaxWidth?.(parts[1] ?? 0);
          g.setMinHeight?.(parts[2] ?? 0);
          g.setMaxHeight?.(parts[3] ?? 0);
        }
        const inputGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.group);
        if (inputGroup) g.setGroup(inputGroup);
        const inputText = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.text);
        if (inputText !== void 0) g.setText(String(inputText));
        const inputFontSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.fontSize);
        if (inputFontSize !== void 0) g.setFontSize(parseInt2(inputFontSize));
        const inputFont = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.font);
        if (inputFont) g.setFont(inputFont);
        const inputColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.color);
        if (inputColor) g.setColor(inputColor);
        const inputAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.align);
        if (inputAlign) {
          const m = { left: 0, center: 1, right: 2 };
          g.setAlign(m[inputAlign] ?? 0);
        }
        const inputVAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.vAlign);
        if (inputVAlign) {
          const m = { top: 0, middle: 1, bottom: 2 };
          g.setVAlign(m[inputVAlign] ?? 0);
        }
        const inputLeading = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.leading);
        if (inputLeading !== void 0) g.setLeading?.(parseInt2(inputLeading));
        const inputLetterSpacing = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.letterSpacing);
        if (inputLetterSpacing !== void 0) g.setLetterSpacing?.(parseInt2(inputLetterSpacing));
        const inputAutoSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoSize);
        if (inputAutoSize) {
          const m = { none: 0, both: 1, height: 2, shrink: 3 };
          g.setAutoSize(m[inputAutoSize] ?? 1);
        }
        const inputSingleLine = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.singleLine);
        if (inputSingleLine !== void 0) g.setSingleLine?.(parseBool(inputSingleLine));
        const inputAutoClearText = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoClearText);
        if (inputAutoClearText !== void 0) g.setAutoClearText?.(parseBool(inputAutoClearText));
        const inputUnderline = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.underline);
        if (inputUnderline !== void 0) g.setUnderline?.(parseBool(inputUnderline));
        const inputItalic = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.italic);
        if (inputItalic !== void 0) g.setItalic?.(parseBool(inputItalic));
        const inputBold = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.bold);
        if (inputBold !== void 0) g.setBold?.(parseBool(inputBold));
        const inputStrikethrough = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strikethrough);
        if (inputStrikethrough !== void 0) g.setStrikethrough?.(parseBool(inputStrikethrough));
        const inputStrokeColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeColor);
        if (inputStrokeColor) {
          g.setStrokeColor?.(inputStrokeColor);
          const inputStrokeSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeSize);
          g.setStrokeSize?.(parseInt2(inputStrokeSize, 1));
        }
        const prompt = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.prompt);
        if (prompt !== void 0) g.setPromptText(prompt);
        const inputMaxLength = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.maxLength);
        if (inputMaxLength !== void 0) g.setMaxLength(parseInt2(inputMaxLength));
        const inputRestrict = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.restrict);
        if (inputRestrict !== void 0) g.setRestrict(inputRestrict);
        const inputPassword = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.password);
        if (inputPassword !== void 0) g.setPassword(parseBool(inputPassword));
        const inputKeyboardType = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.keyboardType);
        if (inputKeyboardType !== void 0) g.setKeyboardType?.(parseInt2(inputKeyboardType));
        obj = g;
        break;
      }
      case "graph": {
        const g = doc.createGGraph(name);
        const graphXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.xy);
        if (graphXY) {
          const [x, y] = parseXYString(graphXY);
          g.setXY(x, y);
        }
        const graphSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.size);
        if (graphSize) {
          const [w, h] = parseSizeString(graphSize);
          g.setSize(w, h);
        }
        const graphLocked = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.locked);
        if (graphLocked !== void 0) g.setLocked(parseBool(graphLocked));
        const graphRestrictSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.restrictSize);
        if (graphRestrictSize) {
          const parts = graphRestrictSize.split(",").map(Number);
          g.setMinWidth?.(parts[0] ?? 0);
          g.setMaxWidth?.(parts[1] ?? 0);
          g.setMinHeight?.(parts[2] ?? 0);
          g.setMaxHeight?.(parts[3] ?? 0);
        }
        const graphGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.group);
        if (graphGroup) g.setGroup(graphGroup);
        const graphPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.pivot);
        if (graphPivot) {
          const [pivotX, pivotY] = parseXYString(graphPivot);
          const graphAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(graphAnchor));
        }
        const graphScale = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.scale);
        if (graphScale) {
          const [scaleX, scaleY] = parseXYString(graphScale);
          g.setScale(scaleX, scaleY);
        }
        const graphRotation = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.rotation);
        if (graphRotation !== void 0) g.setRotation(parseFloat2(graphRotation));
        const graphAlpha = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.alpha);
        if (graphAlpha !== void 0) g.setAlpha(parseFloat2(graphAlpha, 1));
        const graphVisible = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.visible);
        if (graphVisible !== void 0) g.setVisible(parseBool(graphVisible));
        const graphTouchable = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.touchable);
        if (graphTouchable !== void 0) g.setTouchable(parseBool(graphTouchable));
        const graphSkew = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.skew);
        if (graphSkew) {
          const [skewX, skewY] = parseXYString(graphSkew);
          g.setSkew(skewX, skewY);
        }
        const graphType = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.type);
        if (graphType) {
          const graphTypeMap = {
            rect: 1,
            eclipse: 2,
            ellipse: 2,
            polygon: 3,
            regularpolygon: 4,
            regular_polygon: 4
          };
          g.setGraphType(graphTypeMap[graphType] ?? 0);
        }
        const lineSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.lineSize);
        if (lineSize !== void 0) g.setLineSize(parseInt2(lineSize));
        const lineColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.lineColor);
        if (lineColor) g.setLineColor(lineColor);
        const fillColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.fillColor);
        if (fillColor) g.setFillColor(fillColor);
        const corner = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.corner);
        if (corner) {
          const parts = corner.split(",").map(Number);
          g.setCornerRadius([
            parts[0] ?? 0,
            parts[1] ?? parts[0] ?? 0,
            parts[2] ?? parts[0] ?? 0,
            parts[3] ?? parts[0] ?? 0
          ]);
        }
        const points = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.points);
        if (points) g.setPoints(points.split(",").map(Number));
        const sides = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.sides);
        if (sides !== void 0) {
          g.setSides(parseInt2(sides));
          const startAngle = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.startAngle);
          g.setStartAngle(parseFloat2(startAngle));
          const distances = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.distances);
          if (distances) g.setDistances(distances.split(",").map(Number));
        }
        obj = g;
        break;
      }
      case "group": {
        const g = doc.createGGroup(name);
        const groupXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.xy);
        if (groupXY) {
          const [x, y] = parseXYString(groupXY);
          g.setXY(x, y);
        }
        const groupSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.size);
        if (groupSize) {
          const [w, h] = parseSizeString(groupSize);
          g.setSize(w, h);
        }
        const groupLocked = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.locked);
        if (groupLocked !== void 0) g.setLocked(parseBool(groupLocked));
        const groupRef = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.group);
        if (groupRef) g.setGroup(groupRef);
        const groupVisible = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.visible);
        if (groupVisible !== void 0) g.setVisible(parseBool(groupVisible));
        const groupLayout = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.layout);
        if (groupLayout) {
          const layoutMap = { none: 0, horizontal: 1, vertical: 2 };
          g.setLayout(layoutMap[groupLayout] ?? 0);
        }
        const groupLineGap = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.lineGap);
        if (groupLineGap !== void 0) g.setLineGap(parseInt2(groupLineGap));
        const columnGap = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.columnGap);
        if (columnGap !== void 0) g.setColumnGap(parseInt2(columnGap));
        const groupAdvanced = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.advanced);
        if (groupAdvanced !== void 0) g.setAdvanced(parseBool(groupAdvanced));
        const excludeInvisibles = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.excludeInvisibles);
        if (excludeInvisibles !== void 0) g.setExcludeInvisibles?.(parseBool(excludeInvisibles));
        const autoSizeDisabled = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.autoSizeDisabled);
        if (autoSizeDisabled !== void 0) g.setAutoSizeDisabled?.(parseBool(autoSizeDisabled));
        const mainGridIndex = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.mainGridIndex);
        if (mainGridIndex !== void 0) g.setMainGridIndex?.(parseInt2(mainGridIndex));
        obj = g;
        break;
      }
      case "loader": {
        const g = doc.createGLoader(name);
        const loaderXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.xy);
        if (loaderXY) {
          const [x, y] = parseXYString(loaderXY);
          g.setXY(x, y);
        }
        const loaderSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.size);
        if (loaderSize) {
          const [w, h] = parseSizeString(loaderSize);
          g.setSize(w, h);
        }
        const loaderPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.pivot);
        if (loaderPivot) {
          const [pivotX, pivotY] = parseXYString(loaderPivot);
          const loaderAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(loaderAnchor));
        }
        const loaderScale = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.scale);
        if (loaderScale) {
          const [scaleX, scaleY] = parseXYString(loaderScale);
          g.setScale(scaleX, scaleY);
        }
        const loaderGrayed = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.grayed);
        if (loaderGrayed !== void 0) g.setGrayed(parseBool(loaderGrayed));
        const loaderUrl = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.url);
        if (loaderUrl) g.setUrl(loaderUrl);
        const loaderAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.align);
        if (loaderAlign) {
          const m = { left: 0, center: 1, right: 2 };
          g.setAlign?.(m[loaderAlign] ?? 0);
        }
        const loaderVAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.vAlign);
        if (loaderVAlign) {
          const m = { top: 0, middle: 1, bottom: 2 };
          g.setVAlign?.(m[loaderVAlign] ?? 0);
        }
        const loaderFill = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fill);
        if (loaderFill) {
          const fillMap = {
            none: 0,
            scale: 1,
            scaleMatchHeight: 2,
            scaleMatchWidth: 3,
            scaleFree: 4,
            scaleNoBorder: 5
          };
          g.setFill(fillMap[loaderFill] ?? 0);
        }
        const loaderShrinkOnly = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.shrinkOnly);
        if (loaderShrinkOnly !== void 0) g.setShrinkOnly?.(parseBool(loaderShrinkOnly));
        const loaderAutoSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.autoSize);
        if (loaderAutoSize !== void 0) g.setAutoSize?.(parseBool(loaderAutoSize));
        const useResize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.useResize);
        if (useResize !== void 0) g.setUseResize?.(parseBool(useResize));
        const clearOnPublish = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.clearOnPublish);
        if (clearOnPublish !== void 0) g.setClearOnPublish?.(parseBool(clearOnPublish));
        const loaderColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.color);
        if (loaderColor) g.setColor(loaderColor);
        const loaderFilter = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.filter);
        if (loaderFilter !== void 0) g.setFilter(loaderFilter);
        const loaderFilterData = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.filterData);
        if (loaderFilterData !== void 0) g.setFilterData(loaderFilterData);
        const loaderPlaying = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.playing);
        if (loaderPlaying !== void 0) g.setPlaying?.(parseBool(loaderPlaying));
        const loaderFrame = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.frame);
        if (loaderFrame !== void 0) g.setFrame?.(parseInt2(loaderFrame));
        const fillMethod = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillMethod);
        if (fillMethod) {
          const fmMap = { none: 0, hz: 1, vt: 2, radial90: 3, radial180: 4, radial360: 5 };
          g.setFillMethod?.(fmMap[fillMethod] ?? 0);
          const fillOrigin = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillOrigin);
          g.setFillOrigin?.(parseInt2(fillOrigin));
          const fillClockwise = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillClockwise);
          g.setFillClockwise?.(fillClockwise !== "false");
          const fillAmount = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillAmount);
          g.setFillAmount?.(parseInt2(fillAmount, 100) / 100);
        }
        obj = g;
        break;
      }
      case "loader3d": {
        const g = doc.createGLoader3D(name);
        const loader3dXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.xy);
        if (loader3dXY) {
          const [x, y] = parseXYString(loader3dXY);
          g.setXY(x, y);
        }
        const loader3dSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.size);
        if (loader3dSize) {
          const [w, h] = parseSizeString(loader3dSize);
          g.setSize(w, h);
        }
        const loader3dUrl = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.url);
        if (loader3dUrl) g.setUrl(loader3dUrl);
        const loader3dAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.align);
        if (loader3dAlign) {
          const m = { left: 0, center: 1, right: 2 };
          g.setAlign?.(m[loader3dAlign] ?? 0);
        }
        const loader3dVAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.vAlign);
        if (loader3dVAlign) {
          const m = { top: 0, middle: 1, bottom: 2 };
          g.setVAlign?.(m[loader3dVAlign] ?? 0);
        }
        const loader3dFill = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.fill);
        if (loader3dFill) {
          const fillMap = {
            none: 0,
            scale: 1,
            scaleMatchHeight: 2,
            scaleMatchWidth: 3,
            scaleFree: 4,
            scaleNoBorder: 5
          };
          g.setFill(fillMap[loader3dFill] ?? 0);
        }
        const loader3dShrinkOnly = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.shrinkOnly);
        if (loader3dShrinkOnly !== void 0) g.setShrinkOnly?.(parseBool(loader3dShrinkOnly));
        const loader3dAutoSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.autoSize);
        if (loader3dAutoSize !== void 0) g.setAutoSize?.(parseBool(loader3dAutoSize));
        const animation = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.animation);
        if (animation !== void 0) g.setAnimationName?.(String(animation));
        const skinName = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.skinName);
        if (skinName !== void 0) g.setSkinName?.(String(skinName));
        const playing = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.playing);
        if (playing !== void 0) g.setPlaying?.(parseBool(playing));
        const frame = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.frame);
        if (frame !== void 0) g.setFrame?.(parseInt2(frame));
        const loop = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.loop);
        if (loop !== void 0) g.setLoop?.(parseBool(loop));
        const loader3dColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.color);
        if (loader3dColor) g.setColor(loader3dColor);
        obj = g;
        break;
      }
      case "movieclip":
      case "jta": {
        const g = doc.createGMovieClip(name);
        const src = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.src);
        g.setSrc(src || "");
        const movieClipXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.xy);
        if (movieClipXY) {
          const [x, y] = parseXYString(movieClipXY);
          g.setXY(x, y);
        }
        const movieClipSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.size);
        if (movieClipSize) {
          const [w, h] = parseSizeString(movieClipSize);
          g.setSize(w, h);
        }
        const movieClipGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.group);
        if (movieClipGroup) g.setGroup(movieClipGroup);
        const movieClipPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.pivot);
        if (movieClipPivot) {
          const [pivotX, pivotY] = parseXYString(movieClipPivot);
          g.setPivot(pivotX, pivotY);
        }
        const movieClipRotation = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.rotation);
        if (movieClipRotation !== void 0) g.setRotation(parseFloat2(movieClipRotation));
        const movieClipAlpha = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.alpha);
        if (movieClipAlpha !== void 0) g.setAlpha(parseFloat2(movieClipAlpha, 1));
        const movieClipVisible = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.visible);
        if (movieClipVisible !== void 0) g.setVisible(parseBool(movieClipVisible));
        const movieClipGrayed = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.grayed);
        if (movieClipGrayed !== void 0) g.setGrayed(parseBool(movieClipGrayed));
        const movieClipFileName = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.fileName);
        if (movieClipFileName !== void 0) g.setFileName(movieClipFileName);
        const movieClipPackageId = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.pkg);
        if (movieClipPackageId !== void 0) g.setPackageId(movieClipPackageId);
        const movieClipFilter = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.filter);
        if (movieClipFilter !== void 0) g.setFilter(movieClipFilter);
        const movieClipFilterData = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.filterData);
        if (movieClipFilterData !== void 0) g.setFilterData(movieClipFilterData);
        const playing = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.playing);
        if (playing !== void 0) g.setPlaying(parseBool(playing));
        const frame = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.frame);
        if (frame !== void 0) g.setFrame(parseInt2(frame));
        const movieClipColor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.color);
        if (movieClipColor) g.setColor(movieClipColor);
        obj = g;
        break;
      }
      case "component": {
        const g = doc.createGComponent(name);
        const src = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.src);
        g.setSrc(src || "");
        const componentXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.xy);
        if (componentXY) {
          const [x, y] = parseXYString(componentXY);
          g.setXY(x, y);
        }
        const componentSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.size);
        if (componentSize) {
          const [w, h] = parseSizeString(componentSize);
          g.setSize(w, h);
        }
        const componentLocked = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.locked);
        if (componentLocked !== void 0) g.setLocked(parseBool(componentLocked));
        const componentRestrictSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.restrictSize);
        if (componentRestrictSize) {
          const parts = componentRestrictSize.split(",").map(Number);
          g.setMinWidth?.(parts[0] ?? 0);
          g.setMaxWidth?.(parts[1] ?? 0);
          g.setMinHeight?.(parts[2] ?? 0);
          g.setMaxHeight?.(parts[3] ?? 0);
        }
        const componentGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.group);
        if (componentGroup) g.setGroup(componentGroup);
        const componentAspect = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.aspect);
        if (componentAspect !== void 0) g.setAspect(parseBool(componentAspect));
        const componentPivot = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.pivot);
        if (componentPivot) {
          const [pivotX, pivotY] = parseXYString(componentPivot);
          const componentAnchor = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.anchor);
          g.setPivot(pivotX, pivotY, parseBool(componentAnchor));
        }
        const componentScale = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.scale);
        if (componentScale) {
          const [scaleX, scaleY] = parseXYString(componentScale);
          g.setScale(scaleX, scaleY);
        }
        const componentRotation = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.rotation);
        if (componentRotation !== void 0) g.setRotation(parseFloat2(componentRotation));
        const componentAlpha = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.alpha);
        if (componentAlpha !== void 0) g.setAlpha(parseFloat2(componentAlpha, 1));
        const componentVisible = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.visible);
        if (componentVisible !== void 0) g.setVisible(parseBool(componentVisible));
        const componentTouchable = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.touchable);
        if (componentTouchable !== void 0) g.setTouchable(parseBool(componentTouchable));
        const componentGrayed = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.grayed);
        if (componentGrayed !== void 0) g.setGrayed(parseBool(componentGrayed));
        const componentTooltips = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.tooltips);
        if (componentTooltips !== void 0) g.setTooltips(componentTooltips);
        const componentCustomData = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.customData);
        if (componentCustomData !== void 0) g.setCustomData(componentCustomData);
        const componentFileName = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.fileName);
        if (componentFileName !== void 0) g.setFileName(componentFileName);
        const componentPackageId = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.pkg);
        if (componentPackageId !== void 0) g.setPackageId(componentPackageId);
        const componentFilter = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.filter);
        if (componentFilter !== void 0) g.setFilter(componentFilter);
        const componentFilterData = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.filterData);
        if (componentFilterData !== void 0) g.setFilterData(componentFilterData);
        const controllerOverrides = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.controllerOverrides);
        if (controllerOverrides) g.setControllerOverrides?.(controllerOverrides);
        const pageController = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.pageController);
        if (pageController) g.setPageController?.(pageController);
        obj = g;
        break;
      }
      case "list": {
        const treeView = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.treeView);
        const isTree = treeView !== void 0 && parseBool(treeView);
        let g;
        if (isTree) {
          g = doc.createGTree(name).setTreeView(true);
          const indent = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.indent);
          if (indent !== void 0) g.setIndent(parseInt2(indent));
          const clickToExpand = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.clickToExpand);
          if (clickToExpand !== void 0) g.setClickToExpand(parseInt2(clickToExpand));
        } else {
          g = doc.createGList(name);
        }
        const src = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.src);
        g.setSrc(src || "");
        const listXY = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.xy);
        if (listXY) {
          const [x, y] = parseXYString(listXY);
          g.setXY(x, y);
        }
        const listSize = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.size);
        if (listSize) {
          const [w, h] = parseSizeString(listSize);
          g.setSize(w, h);
        }
        const listGroup = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.group);
        if (listGroup) g.setGroup(listGroup);
        const listTouchable = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.touchable);
        if (listTouchable !== void 0) g.setTouchable(parseBool(listTouchable));
        const defaultItem = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.defaultItem);
        if (defaultItem) g.setDefaultItem(defaultItem);
        const scrollBarRes = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scrollBarRes);
        if (scrollBarRes) {
          const parts = String(scrollBarRes).split(",");
          g.setVtScrollBarRes?.(parts[0] ?? "");
          g.setHzScrollBarRes?.(parts[1] ?? "");
        }
        const ptrRes = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.ptrRes);
        if (ptrRes) {
          const parts = String(ptrRes).split(",");
          g.setHeaderRes?.(parts[0] ?? "");
          g.setFooterRes?.(parts[1] ?? "");
        }
        const controllerOverrides = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.controllerOverrides);
        if (controllerOverrides) g.setControllerOverrides?.(controllerOverrides);
        const pageController = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.pageController);
        if (pageController) g.setPageController?.(pageController);
        const layout = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.layout);
        if (layout) {
          const layoutMap = {
            singleColumn: 0,
            singleRow: 1,
            flowHorizontal: 2,
            flowVertical: 3,
            pagination: 4,
            single_column: 0,
            single_row: 1,
            flow_hz: 2,
            flow_vt: 3,
            column: 0,
            row: 1
          };
          g.setLayout(layoutMap[layout] ?? 0);
        }
        const align = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.align);
        if (align) {
          const alignMap = { left: 0, center: 1, right: 2 };
          g.setAlign(alignMap[align] ?? 0);
        }
        const vAlign = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.vAlign);
        if (vAlign) {
          const vAlignMap = { top: 0, middle: 1, bottom: 2 };
          g.setVAlign(vAlignMap[vAlign] ?? 0);
        }
        const lineGap = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.lineGap);
        if (lineGap !== void 0) g.setLineGap(parseInt2(lineGap));
        const columnGap = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.columnGap);
        if (columnGap !== void 0) g.setColumnGap(parseInt2(columnGap));
        const lineCount = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.lineCount);
        if (lineCount !== void 0) g.setLineCount?.(parseInt2(lineCount));
        const autoResizeItem = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.autoResizeItem);
        if (autoResizeItem !== void 0) g.setAutoResizeItem?.(parseBool(autoResizeItem));
        const selectionMode = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.selectionMode);
        if (selectionMode) {
          const selMap = { single: 0, multiple: 1, multipleSingleClick: 2, none: 3 };
          g.setSelectionMode(selMap[selectionMode] ?? 0);
        }
        const selectionController = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.selectionController);
        if (selectionController !== void 0) g.setSelectionController?.(selectionController);
        const overflow = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.overflow);
        const scroll = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scroll);
        const scrollBarFlags = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scrollBarFlags);
        const margin = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.margin);
        if (overflow || scroll || scrollBarFlags !== void 0 || margin) {
          if (overflow) {
            const overflowMap = { visible: 0, hidden: 1, scroll: 2 };
            g.setOverflow(overflowMap[overflow] ?? 0);
          }
          if (scroll) {
            const scrollMap = { horizontal: 0, vertical: 1, both: 2 };
            g.setScrollType(scrollMap[scroll] ?? 1);
          }
          if (scrollBarFlags !== void 0) g.setScrollBarFlags(parseInt2(scrollBarFlags));
          if (margin) {
            const parts = margin.split(",").map(Number);
            g.setMargin({
              top: parts[0] ?? 0,
              bottom: parts[1] ?? 0,
              left: parts[2] ?? 0,
              right: parts[3] ?? 0
            });
          }
        }
        const clipSoftness = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.clipSoftness);
        if (clipSoftness) {
          const csParts = clipSoftness.split(",").map(Number);
          g.setClipSoftness({ x: csParts[0] ?? 0, y: csParts[1] ?? 0 });
        }
        const listItemChildName = getProtocolChildName(PROJECT_XML_PROTOCOL.list, "item");
        const items = listItemChildName ? ensureArray(attrs[listItemChildName]) : [];
        if (items.length > 0) {
          const listItems = items.map((itemDef) => getXmlNode(itemDef)).filter((itemDef) => itemDef !== null).map((itemDef) => parseListItemXmlNode(itemDef));
          g.setListItems(isTree ? inferTreeItemFolderFlags(listItems) : listItems);
        }
        obj = g;
        break;
      }
      default:
        return null;
    }
    const objectId = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.displayObject.attrs.id);
    obj.setId(objectId || "");
    const objectProtocol = DISPLAY_OBJECT_PROTOCOL_MAP[tagName];
    for (const gearTag of getProtocolGearChildNames(objectProtocol)) {
      const gearDefs = ensureArray(attrs[gearTag]);
      for (const gearDef of gearDefs) {
        const parsedGear = getXmlNode(gearDef);
        if (!parsedGear) continue;
        this._parseGear(ctx, doc, obj, gearTag, parsedGear, localControllers);
      }
    }
    const relationChildName = getProtocolChildName(objectProtocol, "relation");
    const relations = relationChildName ? ensureArray(attrs[relationChildName]) : [];
    for (const relDef of relations) {
      const parsedRelation = getXmlNode(relDef);
      if (!parsedRelation) continue;
      const sidePair = readXmlAttr(parsedRelation, PROJECT_XML_PROTOCOL.relation.attrs.sidePair) || "";
      const sidePairs = parseSidePair(sidePair);
      for (const sp of sidePairs) {
        const target = readXmlAttr(parsedRelation, PROJECT_XML_PROTOCOL.relation.attrs.target) || "";
        const rel = {
          target,
          type: sp.type,
          usePercent: sp.usePercent
        };
        obj.addRelation(rel);
      }
    }
    for (const extTypeName of getProtocolExtensionChildNames(PROJECT_XML_PROTOCOL.componentInstance)) {
      const extElement = attrs[extTypeName];
      if (extElement) {
        const extAttrs = getXmlNode(extElement);
        if (!extAttrs || obj.propertyType !== "GComponent") continue;
        const componentObj = obj;
        const extProtocol = EXTENSION_PROTOCOL_MAP[extTypeName];
        const extSpecs = extProtocol.attrs;
        componentObj.setInstanceExtType?.(extTypeName);
        const title = extSpecs.title ? readXmlAttr(extAttrs, extSpecs.title) : void 0;
        if (title !== void 0) componentObj.setInstanceTitle?.(title);
        const selectedTitle = extSpecs.selectedTitle ? readXmlAttr(extAttrs, extSpecs.selectedTitle) : void 0;
        if (selectedTitle !== void 0) componentObj.setInstanceSelectedTitle?.(selectedTitle);
        const icon = extSpecs.icon ? readXmlAttr(extAttrs, extSpecs.icon) : void 0;
        if (icon !== void 0) componentObj.setInstanceIcon?.(icon);
        const selectedIcon = extSpecs.selectedIcon ? readXmlAttr(extAttrs, extSpecs.selectedIcon) : void 0;
        if (selectedIcon !== void 0) componentObj.setInstanceSelectedIcon?.(selectedIcon);
        const titleColor = extSpecs.titleColor ? readXmlAttr(extAttrs, extSpecs.titleColor) : void 0;
        if (titleColor !== void 0) componentObj.setInstanceTitleColor?.(titleColor);
        const titleFontSize = extSpecs.titleFontSize ? readXmlAttr(extAttrs, extSpecs.titleFontSize) : void 0;
        if (titleFontSize !== void 0) componentObj.setInstanceTitleFontSize?.(parseInt2(titleFontSize));
        const controller = extSpecs.controller ? readXmlAttr(extAttrs, extSpecs.controller) : void 0;
        if (controller !== void 0) componentObj.setInstanceController?.(controller);
        const page = extSpecs.page ? readXmlAttr(extAttrs, extSpecs.page) : void 0;
        if (page !== void 0) componentObj.setInstancePage?.(page);
        const checked = extSpecs.checked ? readXmlAttr(extAttrs, extSpecs.checked) : void 0;
        if (checked !== void 0) componentObj.setInstanceChecked?.(parseBool(checked));
        const prompt = extSpecs.prompt ? readXmlAttr(extAttrs, extSpecs.prompt) : void 0;
        if (prompt !== void 0) componentObj.setInstancePromptText?.(prompt);
        const selectionController = extSpecs.selectionController ? readXmlAttr(extAttrs, extSpecs.selectionController) : void 0;
        if (selectionController !== void 0) componentObj.setInstanceSelectionController?.(selectionController);
        const visibleItemCount = extSpecs.visibleItemCount ? readXmlAttr(extAttrs, extSpecs.visibleItemCount) : void 0;
        if (visibleItemCount !== void 0) componentObj.setInstanceVisibleItemCount?.(parseInt2(visibleItemCount));
        const value = extSpecs.value ? readXmlAttr(extAttrs, extSpecs.value) : void 0;
        if (value !== void 0) componentObj.setInstanceValue?.(parseInt2(value));
        const max = extSpecs.max ? readXmlAttr(extAttrs, extSpecs.max) : void 0;
        if (max !== void 0) componentObj.setInstanceMax?.(parseInt2(max, 100));
        const min = extSpecs.min ? readXmlAttr(extAttrs, extSpecs.min) : void 0;
        if (min !== void 0) componentObj.setInstanceMin?.(parseInt2(min));
        const comboBoxItemChildName = getProtocolChildName(PROJECT_XML_PROTOCOL.comboBoxExtension, "item");
        if (extTypeName === "ComboBox" && comboBoxItemChildName && extAttrs[comboBoxItemChildName]) {
          const comboItems = ensureArray(extAttrs[comboBoxItemChildName]);
          componentObj.setInstanceComboItems?.(
            comboItems.map((itemDef) => getXmlNode(itemDef)).filter((itemDef) => itemDef !== null).map((itemDef) => parseComboBoxItemXmlNode(itemDef))
          );
        }
      }
    }
    return obj;
  }
  _parseGear(_ctx, doc, obj, gearTag, attrs, localControllers) {
    const gearType = GEAR_TAG_MAP[gearTag];
    if (gearType === void 0) return;
    const gear = doc.createGear();
    gear.setGearType(gearType);
    const tween = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.tween);
    gear.setTween(parseBool(tween));
    const positionsInPercent = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.positionsInPercent);
    if (positionsInPercent !== void 0) {
      gear.setPositionsInPercent(parseBool(positionsInPercent));
    }
    const ctrlName = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.controller) || "";
    const controller = localControllers.get(ctrlName) || null;
    if (controller) {
      gear.setController(controller);
    }
    const pages = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.pages);
    if (pages) {
      gear.setPages(pages);
    }
    const values = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.values);
    if (values) {
      gear.setValues(values);
    }
    const defaultValue = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.default);
    if (defaultValue !== void 0) {
      gear.setDefaultValue(defaultValue);
    }
    const condition = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.condition);
    if (condition !== void 0) {
      gear.setCondition(String(condition));
    }
    const ease = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.ease);
    if (ease) {
      gear.setEaseType(_parseEaseType(ease));
    }
    const duration = readXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.duration);
    if (duration !== void 0) {
      gear.setTweenDuration(parseFloat2(duration));
    }
    obj.addGear(gear);
  }
  _resolveProjectType(typeStr) {
    const map = {
      Unity: 0,
      Flash: 1,
      Starling: 2,
      CocosCreator: 3,
      Layabox: 4,
      LayaBox: 4,
      Egret: 5,
      Haxe: 6,
      Pixi: 7,
      LibGDX: 8,
      Unreal: 9,
      CryEngine: 10,
      MonoGame: 11,
      Vision: 12
    };
    return map[typeStr] ?? 0;
  }
};

// packages/core/src/io/project-writer.ts
var NL = "\r\n";
var builder = new json2xml_default({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  indentBy: "  ",
  suppressBooleanAttributes: false,
  suppressEmptyNode: true,
  suppressUnpairedNode: false,
  unpairedTags: [],
  stopNodes: ["component.displayList"]
});
var GEAR_TAG = {
  [0 /* Display */]: "gearDisplay",
  [1 /* XY */]: "gearXY",
  [2 /* Size */]: "gearSize",
  [3 /* Look */]: "gearLook",
  [4 /* Color */]: "gearColor",
  [5 /* Animation */]: "gearAni",
  [6 /* Text */]: "gearText",
  [7 /* Icon */]: "gearIcon",
  [8 /* Display2 */]: "gearDisplay2",
  [9 /* FontSize */]: "gearFontSize"
};
var RELATION_TYPE_NAME = {
  0: "left-left",
  1: "left-center",
  2: "left-right",
  3: "center-center",
  4: "right-left",
  5: "right-center",
  6: "right-right",
  7: "top-top",
  8: "top-middle",
  9: "top-bottom",
  10: "middle-middle",
  11: "bottom-top",
  12: "bottom-middle",
  13: "bottom-bottom",
  14: "width-width",
  15: "height-height",
  16: "leftext-left",
  17: "leftext-right",
  18: "rightext-left",
  19: "rightext-right",
  20: "topext-top",
  21: "topext-bottom",
  22: "bottomext-top",
  23: "bottomext-bottom"
};
var DISPLAY_TAG = {
  GImage: "image",
  GTextField: "text",
  GRichTextField: "richtext",
  GTextInput: "inputtext",
  GGraph: "graph",
  GGroup: "group",
  GLoader: "loader",
  GLoader3D: "loader3d",
  GMovieClip: "jta",
  GComponent: "component",
  GButton: "component",
  GLabel: "component",
  GComboBox: "component",
  GProgressBar: "component",
  GSlider: "component",
  GScrollBar: "component",
  GList: "list",
  GTree: "list"
};
var EXTENSION_TYPE = {
  GButton: "Button",
  GLabel: "Label",
  GComboBox: "ComboBox",
  GProgressBar: "ProgressBar",
  GSlider: "Slider",
  GScrollBar: "ScrollBar"
};
var EXTENSION_PROTOCOL_MAP2 = {
  Button: PROJECT_XML_PROTOCOL.buttonExtension,
  Label: PROJECT_XML_PROTOCOL.labelExtension,
  ComboBox: PROJECT_XML_PROTOCOL.comboBoxExtension,
  ProgressBar: PROJECT_XML_PROTOCOL.progressBarExtension,
  Slider: PROJECT_XML_PROTOCOL.sliderExtension,
  ScrollBar: PROJECT_XML_PROTOCOL.scrollBarExtension
};
var DISPLAY_OBJECT_PROTOCOL_BY_TYPE = {
  GImage: PROJECT_XML_PROTOCOL.image,
  GTextField: PROJECT_XML_PROTOCOL.text,
  GRichTextField: PROJECT_XML_PROTOCOL.richText,
  GTextInput: PROJECT_XML_PROTOCOL.textInput,
  GGraph: PROJECT_XML_PROTOCOL.graph,
  GGroup: PROJECT_XML_PROTOCOL.group,
  GLoader: PROJECT_XML_PROTOCOL.loader,
  GLoader3D: PROJECT_XML_PROTOCOL.loader3D,
  GMovieClip: PROJECT_XML_PROTOCOL.movieClip,
  GComponent: PROJECT_XML_PROTOCOL.componentInstance,
  GButton: PROJECT_XML_PROTOCOL.componentInstance,
  GLabel: PROJECT_XML_PROTOCOL.componentInstance,
  GComboBox: PROJECT_XML_PROTOCOL.componentInstance,
  GProgressBar: PROJECT_XML_PROTOCOL.componentInstance,
  GSlider: PROJECT_XML_PROTOCOL.componentInstance,
  GScrollBar: PROJECT_XML_PROTOCOL.componentInstance,
  GList: PROJECT_XML_PROTOCOL.list,
  GTree: PROJECT_XML_PROTOCOL.list
};
var DISPLAY_LIST_CONTAINER3 = PROJECT_XML_PROTOCOL.componentRoot.containers?.displayList;
if (!DISPLAY_LIST_CONTAINER3) {
  throw new Error("PROJECT_XML_PROTOCOL.componentRoot must define containers.displayList");
}
var DISPLAY_LIST_ALLOWED_VARIANTS2 = new Set(Object.keys(DISPLAY_LIST_CONTAINER3.items));
function stringifyEaseType(easeType) {
  const names = {
    0: "Linear",
    1: "Sine.In",
    2: "Sine.Out",
    3: "Sine.InOut",
    4: "Quad.In",
    5: "Quad.Out",
    6: "Quad.InOut",
    7: "Cubic.In",
    8: "Cubic.Out",
    9: "Cubic.InOut",
    10: "Quart.In",
    11: "Quart.Out",
    12: "Quart.InOut",
    13: "Quint.In",
    14: "Quint.Out",
    15: "Quint.InOut",
    16: "Expo.In",
    17: "Expo.Out",
    18: "Expo.InOut",
    19: "Circ.In",
    20: "Circ.Out",
    21: "Circ.InOut",
    22: "Elastic.In",
    23: "Elastic.Out",
    24: "Elastic.InOut",
    25: "Back.In",
    26: "Back.Out",
    27: "Back.InOut",
    28: "Bounce.In",
    29: "Bounce.Out",
    30: "Bounce.InOut",
    31: "Custom"
  };
  return names[easeType] ?? "Quad.Out";
}
function sameColor(a, b) {
  return (a ?? "").toLowerCase() === b.toLowerCase();
}
function formatXmlColor(color) {
  return color.toLowerCase();
}
function formatButtonDownEffectValue(value) {
  return value.toFixed(2);
}
function almostEqual(a, b, epsilon = 1e-6) {
  return Math.abs(a - b) < epsilon;
}
function isDefaultWhiteColor(color) {
  return sameColor(color, "#FFFFFF") || sameColor(color, "#FFFFFFFF");
}
function isDefaultBlackColor(color) {
  return sameColor(color, "#000000") || sameColor(color, "#FF000000");
}
function shouldWritePackageImageSize(resource) {
  return resource.getExtras?.()?._suppressPackageSize !== true;
}
function escapeXmlAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/\r\n/g, "&#xA;").replace(/[\r\n]/g, "&#xA;").replace(/\t/g, "&#x9;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderXmlAttrs(attrs) {
  const parts = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === void 0 || value === null) continue;
    if (Array.isArray(value) || typeof value === "object") continue;
    const attrName = key.startsWith("@_") ? key.slice(2) : key;
    parts.push(` ${attrName}="${escapeXmlAttr(value)}"`);
  }
  return parts.join("");
}
function renderXmlText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function renderXmlNode(tagName, node, indent) {
  if (node === void 0 || node === null || node === "") {
    return `${indent}<${tagName}/>`;
  }
  if (Array.isArray(node)) {
    return node.map((item) => renderXmlNode(tagName, item, indent)).join(NL);
  }
  if (typeof node !== "object") {
    return `${indent}<${tagName}>${renderXmlText(node)}</${tagName}>`;
  }
  const attrs = {};
  const children = [];
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("@_")) attrs[key] = value;
    else if (value !== void 0 && value !== null) children.push({ tagName: key, value });
  }
  if (children.length === 0) {
    return `${indent}<${tagName}${renderXmlAttrs(attrs)}/>`;
  }
  const childIndent = `${indent}  `;
  const childLines = [];
  for (const child of children) {
    if (Array.isArray(child.value)) {
      for (const item of child.value) childLines.push(renderXmlNode(child.tagName, item, childIndent));
    } else {
      childLines.push(renderXmlNode(child.tagName, child.value, childIndent));
    }
  }
  return `${indent}<${tagName}${renderXmlAttrs(attrs)}>${NL}${childLines.join(NL)}${NL}${indent}</${tagName}>`;
}
function compareResourceIdSequence(a, b) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left.length !== right.length) return left.length - right.length;
  return left.localeCompare(right);
}
function formatTrimmedFixed(value, precision = 2) {
  if (!Number.isFinite(value)) return String(value);
  if (precision === 0) return value.toFixed(0);
  const fixed = value.toFixed(precision);
  return fixed.replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, "$1");
}
function formatDisplayAlpha(value) {
  return formatTrimmedFixed(value, 2);
}
function formatImageFlip(value) {
  switch (value) {
    case 1:
      return "hz";
    case 2:
      return "vt";
    case 3:
      return "both";
    default:
      return String(value);
  }
}
function formatGearLookAlpha(value, fixedAlpha) {
  if (value === void 0) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  return fixedAlpha ? numeric.toFixed(2) : formatTrimmedFixed(numeric, 2);
}
function normalizeGearLookSegment(segment, fixedAlpha) {
  if (!segment || segment === "-") return segment;
  const parts = segment.split(",");
  if (parts.length < 3) return segment;
  const normalizeFlag = (value, fallback) => {
    if (value === void 0 || value === "") return fallback;
    const lower = value.trim().toLowerCase();
    if (lower === "true") return "1";
    if (lower === "false") return "0";
    return value;
  };
  const normalized = [
    formatGearLookAlpha(parts[0], fixedAlpha),
    formatTrimmedFixed(Number(parts[1] ?? 0), 2),
    normalizeFlag(parts[2], "0")
  ];
  if (parts.length >= 4) {
    const touchable = normalizeFlag(parts[3], "1");
    if (touchable !== "1") normalized.push(touchable);
  }
  return normalized.join(",");
}
function normalizeGearColorSegment(segment, compactOutline) {
  if (!segment || segment === "-") return segment;
  const parts = segment.split(",");
  if (parts.length === 1) return formatXmlColor(parts[0] ?? "");
  const normalized = parts.map((part) => formatXmlColor(part));
  if (compactOutline && normalized.length >= 2 && isDefaultBlackColor(normalized[1])) {
    return normalized[0] ?? "";
  }
  return normalized.join(",");
}
function isIdentityGearSizeScale(segment) {
  if (!segment || segment === "-") return true;
  const parts = segment.split(",");
  if (parts.length < 4) return true;
  return almostEqual(Number(parts[2] ?? 1), 1) && almostEqual(Number(parts[3] ?? 1), 1);
}
function normalizeGearSizeSegment(segment, fixedScale, omitIdentityScale) {
  if (!segment || segment === "-") return segment;
  const parts = segment.split(",");
  if (parts.length < 2) return segment;
  const normalized = [
    String(Math.trunc(Number(parts[0] ?? 0))),
    String(Math.trunc(Number(parts[1] ?? 0)))
  ];
  if (parts.length >= 4) {
    if (omitIdentityScale && isIdentityGearSizeScale(segment)) {
      return normalized.join(",");
    }
    const scaleFormatter = fixedScale ? (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric.toFixed(2) : String(value ?? "");
    } : (value) => formatTrimmedFixed(Number(value ?? 0), 2);
    normalized.push(scaleFormatter(parts[2]), scaleFormatter(parts[3]));
  }
  return normalized.join(",");
}
function shouldCompactTextGearColor(ownerType, ownerName) {
  return (ownerType === "GTextField" || ownerType === "GRichTextField" || ownerType === "GTextInput") && ownerName === "title";
}
function normalizeGearXmlValue(gearType, value, ownerType, ownerName, gear) {
  const raw = String(value ?? "");
  switch (gearType) {
    case 1 /* XY */: {
      return raw;
    }
    case 2 /* Size */: {
      const fixedScale = !gear?.getTween();
      const segments = raw.split("|");
      const omitIdentityScale = fixedScale && ownerName !== "bg" && segments.every((segment) => isIdentityGearSizeScale(segment));
      return segments.map((segment) => normalizeGearSizeSegment(segment, fixedScale, omitIdentityScale)).join("|");
    }
    case 3 /* Look */: {
      const fixedAlpha = ownerType === "GLoader" || Boolean(gear?.getTween() && !almostEqual(gear.getTweenDuration(), 0.3));
      return raw.split("|").map((segment) => normalizeGearLookSegment(segment, fixedAlpha)).join("|");
    }
    case 4 /* Color */: {
      const textLike = ownerType === "GTextField" || ownerType === "GRichTextField" || ownerType === "GTextInput";
      const compactOutline = !textLike || shouldCompactTextGearColor(ownerType, ownerName);
      return raw.split("|").map((segment) => normalizeGearColorSegment(segment, compactOutline)).join("|");
    }
    default:
      return raw;
  }
}
function formatTransitionFrameValue(value) {
  const rounded = Math.round(value);
  if (almostEqual(value, rounded, 1e-4)) return String(rounded);
  return formatTrimmedFixed(value, 3);
}
function formatTransitionValuePart(actionType, raw) {
  if (!raw || raw === "-" || raw === "true" || raw === "false" || raw === "p" || raw === "s") {
    return raw;
  }
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) return raw;
  switch (actionType) {
    case 4 /* Alpha */:
    case 12 /* ColorFilter */:
      return numeric.toFixed(2);
    default:
      return formatTrimmedFixed(numeric);
  }
}
function stringifyTransitionValue(actionType, values) {
  const parts = values.map((value) => String(value));
  if (actionType === 9) {
    if (parts.length <= 1) return parts[0] ?? "";
    if (parts[1] === "100") return parts[0] ?? "";
  }
  if (actionType === 10) {
    if (parts.length <= 1) return parts[0] ?? "";
    if (parts[1] === "1") return parts[0] ?? "";
  }
  return parts.map((part) => formatTransitionValuePart(actionType, part)).join(",");
}
function hasNonZeroInsets(value) {
  return !!value && !!(value.top || value.bottom || value.left || value.right);
}
function formatInsets(value) {
  return `${value.top ?? 0},${value.bottom ?? 0},${value.left ?? 0},${value.right ?? 0}`;
}
function formatFillMethod(fillMethod) {
  const fillMethodName = {
    0: "none",
    1: "hz",
    2: "vt",
    3: "radial90",
    4: "radial180",
    5: "radial360"
  };
  return fillMethodName[fillMethod] ?? "none";
}
function formatButtonMode(mode) {
  const map = {
    0: "Common",
    1: "Check",
    2: "Radio"
  };
  return map[mode] ?? "Common";
}
function formatTitleType(titleType) {
  const map = {
    0: "percent",
    1: "valueAndmax",
    2: "value",
    3: "max"
  };
  return map[titleType] ?? "percent";
}
function serializeListItemXmlNode(item, options) {
  const attrs = {};
  const specs = PROJECT_XML_PROTOCOL.listItem.attrs;
  if (item.title !== void 0 && item.title !== null) writeXmlAttr(attrs, specs.title, item.title);
  if (item.icon !== void 0 && item.icon !== null) writeXmlAttr(attrs, specs.icon, item.icon);
  if (item.url !== void 0 && item.url !== null) writeXmlAttr(attrs, specs.url, item.url);
  if (item.name !== void 0 && item.name !== null) writeXmlAttr(attrs, specs.name, item.name);
  if (item.selectedTitle !== void 0 && item.selectedTitle !== null) writeXmlAttr(attrs, specs.selectedTitle, item.selectedTitle);
  if (item.selectedIcon !== void 0 && item.selectedIcon !== null) writeXmlAttr(attrs, specs.selectedIcon, item.selectedIcon);
  if (item.level !== void 0 && item.level !== null && ((options?.forceLevel ?? false) || item.level !== 0 || item.isFolder === true)) {
    writeXmlAttr(attrs, specs.level, String(item.level));
  }
  if (item.controllers !== void 0 && item.controllers !== null) writeXmlAttr(attrs, specs.controllers, item.controllers);
  return attrs;
}
function serializeComboBoxItemXmlNode(item) {
  const attrs = {};
  const specs = PROJECT_XML_PROTOCOL.comboBoxItem.attrs;
  if (item.title !== void 0 && item.title !== null) writeXmlAttr(attrs, specs.title, item.title);
  if (item.value !== void 0 && item.value !== null) writeXmlAttr(attrs, specs.value, item.value);
  if (item.icon !== void 0 && item.icon !== null) writeXmlAttr(attrs, specs.icon, item.icon);
  return attrs;
}
function getProtocolChildName2(protocol, childName) {
  return protocol.children?.[childName] ? childName : null;
}
function getProtocolGearChildNameSet(protocol) {
  const gearTagNames = new Set(Object.values(GEAR_TAG));
  return new Set(Object.keys(protocol.children ?? {}).filter((name) => gearTagNames.has(name)));
}
function getDisplayListVariantName2(propertyType, tagName) {
  if (propertyType === "GLoader3D") return "loader3D";
  if (propertyType === "GTree") return "tree";
  return tagName;
}
function assertDisplayListVariantAllowed(propertyType, tagName, childName) {
  const variantName = getDisplayListVariantName2(propertyType, tagName);
  if (!DISPLAY_LIST_ALLOWED_VARIANTS2.has(variantName)) {
    throw new Error(
      `displayList variant "${variantName}" derived from propertyType "${propertyType}" is not declared in protocol for child "${childName}"`
    );
  }
}
var ProjectWriter = class {
  _fs;
  constructor(fs3) {
    this._fs = fs3;
  }
  async write(doc, projectPath) {
    const fs3 = this._fs;
    const root = doc.getRoot();
    const basePath = fs3.dirname(projectPath);
    const fairyXml = `<?xml version="1.0" encoding="utf-8"?>${NL}<projectDescription id="${root.getProjectId()}" type="${this._projectTypeName(root.getProjectType())}" version="${root.getVersion() || "3.0"}"/>`;
    await fs3.writeFile(projectPath, fairyXml);
    const settings = root.getSettings?.() ?? {};
    const settingsPath = fs3.join(basePath, "settings");
    await fs3.mkdir(settingsPath);
    const settingFiles = {
      "Publish.json": "publish",
      "Common.json": "common",
      "Adaptation.json": "adaptation",
      "i18n.json": "i18n"
    };
    for (const [fileName, key] of Object.entries(settingFiles)) {
      if (settings[key]) {
        await fs3.writeFile(
          fs3.join(settingsPath, fileName),
          JSON.stringify(settings[key], null, "	")
        );
      }
    }
    const assetsPath = fs3.join(basePath, "assets");
    await fs3.mkdir(assetsPath);
    for (const pkg of root.listPackages()) {
      await this._writePackage(doc, pkg, assetsPath);
    }
  }
  async _writePackage(_doc, pkg, assetsPath) {
    const fs3 = this._fs;
    const pkgDir = fs3.join(assetsPath, pkg.getName());
    await fs3.mkdir(pkgDir);
    const basePath = fs3.dirname(assetsPath);
    const resourcesByBranch = /* @__PURE__ */ new Map();
    for (const res of pkg.listResources()) {
      const branchName = res.getBranch?.() ?? "";
      const bucket = resourcesByBranch.get(branchName) ?? [];
      bucket.push(res);
      resourcesByBranch.set(branchName, bucket);
    }
    const mainResources = resourcesByBranch.get("") ?? [];
    const publishName = pkg.getPublishName() || pkg.getName();
    const publishPath = pkg.getPublishPath();
    const publishBranchPath = pkg.getPublishBranchPath();
    const publishPackageCount = pkg.getPublishPackageCount();
    const genCode = pkg.getGenCode();
    const codePath = pkg.getCodePath();
    const packageDescriptionAttrs = {};
    writeXmlAttr(packageDescriptionAttrs, PROJECT_XML_PROTOCOL.packageDescription.attrs.id, pkg.getId());
    const compressPNG = pkg.getCompressPNG();
    if (compressPNG !== null) {
      writeXmlAttr(packageDescriptionAttrs, PROJECT_XML_PROTOCOL.packageDescription.attrs.compressPNG, compressPNG ? "true" : "false");
    }
    const jpegQuality = pkg.getJpegQuality();
    if (jpegQuality !== null) {
      writeXmlAttr(packageDescriptionAttrs, PROJECT_XML_PROTOCOL.packageDescription.attrs.jpegQuality, String(jpegQuality));
    }
    const publishAttrs = {};
    writeXmlAttr(publishAttrs, PROJECT_XML_PROTOCOL.packagePublish.attrs.name, publishName);
    writeXmlAttr(
      publishAttrs,
      PROJECT_XML_PROTOCOL.packagePublish.attrs.path,
      publishPath || void 0
    );
    writeXmlAttr(
      publishAttrs,
      PROJECT_XML_PROTOCOL.packagePublish.attrs.branchPath,
      publishBranchPath || void 0
    );
    writeXmlAttr(
      publishAttrs,
      PROJECT_XML_PROTOCOL.packagePublish.attrs.packageCount,
      publishPackageCount > 0 ? publishPackageCount : void 0
    );
    writeXmlAttr(
      publishAttrs,
      PROJECT_XML_PROTOCOL.packagePublish.attrs.genCode,
      genCode ? "true" : void 0
    );
    writeXmlAttr(
      publishAttrs,
      PROJECT_XML_PROTOCOL.packagePublish.attrs.codePath,
      codePath || void 0
    );
    const publishAtlases = pkg.listAtlases().map((atlas2) => {
      const attrs = {};
      const index = atlas2.getIndex?.() ?? 0;
      writeXmlAttr(
        attrs,
        PROJECT_XML_PROTOCOL.packagePublishAtlas.attrs.name,
        index === 0 ? "Default" : atlas2.getName()
      );
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packagePublishAtlas.attrs.index, String(index));
      return attrs;
    });
    if (publishAtlases.length > 0) {
      publishAttrs.atlas = publishAtlases;
    }
    await fs3.writeFile(
      fs3.join(pkgDir, "package.xml"),
      this._renderPackageDescriptionXml(packageDescriptionAttrs, mainResources, publishAttrs)
    );
    for (const comp of mainResources.filter((resource) => resource.propertyType === "Component")) {
      await this._writeComponent(comp, pkgDir);
    }
    for (const [branchName, branchResources] of resourcesByBranch) {
      if (!branchName) continue;
      const branchPkgDir = fs3.join(basePath, `assets_${branchName}`, pkg.getName());
      await fs3.mkdir(branchPkgDir);
      await fs3.writeFile(
        fs3.join(branchPkgDir, "package_branch.xml"),
        this._renderBranchDescriptionXml(branchResources)
      );
      for (const comp of branchResources.filter((resource) => resource.propertyType === "Component")) {
        await this._writeComponent(comp, branchPkgDir);
      }
    }
  }
  _renderPackageDescriptionXml(packageDescriptionAttrs, resources, publishAttrs) {
    const publishNodeAttrs = Object.fromEntries(
      Object.entries(publishAttrs).filter(([key]) => key !== "atlas")
    );
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      `<packageDescription${renderXmlAttrs(packageDescriptionAttrs)}>`,
      "  <resources>",
      ...this._renderPackageResourceLines(resources, "    "),
      "  </resources>",
      `  <publish${renderXmlAttrs(publishNodeAttrs)}>`
    ];
    const publishAtlases = Array.isArray(publishAttrs.atlas) ? publishAttrs.atlas : [];
    for (const atlasAttrs of publishAtlases) {
      lines.push(`    <atlas${renderXmlAttrs(atlasAttrs)}/>`);
    }
    lines.push("  </publish>");
    lines.push("</packageDescription>");
    return `${lines.join(NL)}${NL}`;
  }
  _renderBranchDescriptionXml(resources) {
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      "<branchDescription>",
      "  <resources>",
      ...this._renderPackageResourceLines(resources, "    "),
      "  </resources>",
      "</branchDescription>"
    ];
    return `${lines.join(NL)}${NL}`;
  }
  _renderPackageResourceLines(resources, indent) {
    return this._orderedPackageResources(resources).map((resource) => {
      const serialized = this._serializePackageResourceEntry(resource);
      if (!serialized) return null;
      return `${indent}<${serialized.tagName}${renderXmlAttrs(serialized.attrs)}/>`;
    }).filter((line) => !!line);
  }
  _orderedPackageResources(resources) {
    const original = [...resources].sort((a, b) => {
      const aId = a.getId?.() ?? "";
      const bId = b.getId?.() ?? "";
      return compareResourceIdSequence(aId, bId);
    });
    const syntheticAfter = /* @__PURE__ */ new Map();
    const trailing = [];
    for (const resource of original) {
      const extras = resource.getExtras?.() ?? {};
      const afterId = typeof extras._packageOrderAfterId === "string" ? extras._packageOrderAfterId : "";
      const weight = typeof extras._packageOrderWeight === "number" ? extras._packageOrderWeight : 0;
      if (afterId) {
        const bucket = syntheticAfter.get(afterId) ?? [];
        bucket.push({ resource, weight });
        syntheticAfter.set(afterId, bucket);
        continue;
      }
      if (extras._syntheticFontGlyph === true || extras._syntheticFontTexture === true) {
        trailing.push({ resource, weight });
      }
    }
    const result = [];
    for (const resource of original) {
      const extras = resource.getExtras?.() ?? {};
      if (extras._packageOrderAfterId || extras._syntheticFontGlyph === true || extras._syntheticFontTexture === true) {
        continue;
      }
      result.push(resource);
      const id = resource.getId?.() ?? "";
      const bucket = syntheticAfter.get(id) ?? [];
      bucket.sort(
        (a, b) => a.weight - b.weight || compareResourceIdSequence(a.resource.getId?.() ?? "", b.resource.getId?.() ?? "")
      );
      for (const entry of bucket) {
        result.push(entry.resource);
      }
    }
    trailing.sort(
      (a, b) => a.weight - b.weight || compareResourceIdSequence(a.resource.getId?.() ?? "", b.resource.getId?.() ?? "")
    );
    for (const entry of trailing) {
      result.push(entry.resource);
    }
    return result;
  }
  _serializePackageResourceEntry(resource) {
    const serialized = this._serializePackageResources([resource]);
    const [tagName, entries] = Object.entries(serialized)[0] ?? [];
    if (!tagName || !entries || entries.length === 0) return null;
    return { tagName, attrs: entries[0] };
  }
  _serializePackageResources(packageResources) {
    const resources = {};
    for (const res of packageResources) {
      const tagName = this._resourceTag(res.propertyType);
      if (!tagName) continue;
      const typedRes = res;
      const attrs = {};
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.id, typedRes.getId?.() ?? "");
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.name, this._resourceFileName(res));
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.path, typedRes.getPath?.() ?? "/");
      if (typedRes.getExported?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageResource.attrs.exported, "true");
      if (res.propertyType === "ImageResource") {
        const imgRes = res;
        const textureSetMode = imgRes.getTextureSetMode?.() ?? "";
        if (textureSetMode) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.atlas, textureSetMode);
        const scaleOpt = imgRes.getScaleOption?.() ?? 0;
        if (scaleOpt === 1) {
          writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.scale, "9grid");
          const g = imgRes.getScale9Grid?.();
          if (g) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.scale9grid, `${g[0]},${g[1]},${g[2]},${g[3]}`);
        } else if (scaleOpt === 2) {
          writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.scale, "tile");
        }
        if (shouldWritePackageImageSize(imgRes)) {
          const width = imgRes.getWidth?.() ?? 0;
          if (width !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.width, String(width));
          const height = imgRes.getHeight?.() ?? 0;
          if (height !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.height, String(height));
        }
        const gridTile = imgRes.getTileGridIndice?.() ?? 0;
        if (gridTile !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.gridTile, String(gridTile));
        const qualityOption = imgRes.getQualityOption?.() ?? "";
        if (qualityOption) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.qualityOption, qualityOption);
        if (imgRes.getDuplicatePadding?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.duplicatePadding, "true");
        if (imgRes.getSmoothing?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageImageResource.attrs.smoothing, "false");
      }
      if (res.propertyType === "FontResource") {
        const fontRes = res;
        const texture = fontRes.getTextureId?.() ?? "";
        if (texture) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageFontResource.attrs.texture, texture);
        const renderMode = fontRes.getRenderMode?.() ?? "";
        if (renderMode) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageFontResource.attrs.renderMode, renderMode);
        const samplePointSize = fontRes.getSamplePointSize?.() ?? 0;
        if (samplePointSize !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageFontResource.attrs.samplePointSize, String(samplePointSize));
      }
      if (res.propertyType === "MovieClipResource") {
        const mcRes = res;
        const mcWidth = mcRes.getWidth?.() ?? 0;
        if (mcWidth !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageMovieClipResource.attrs.width, String(mcWidth));
        const mcHeight = mcRes.getHeight?.() ?? 0;
        if (mcHeight !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageMovieClipResource.attrs.height, String(mcHeight));
      }
      if (res.propertyType === "SpineResource" || res.propertyType === "DragonBonesResource") {
        const skeletonRes = res;
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.width, String(skeletonRes.getWidth?.() ?? 0));
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.height, String(skeletonRes.getHeight?.() ?? 0));
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.require, (skeletonRes.getRequireIds?.() ?? []).join(",") || void 0);
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.atlasNames, (skeletonRes.getAtlasNames?.() ?? []).join(","));
        writeXmlAttr(
          attrs,
          PROJECT_XML_PROTOCOL.packageSkeletonResource.attrs.anchor,
          `${skeletonRes.getAnchorX?.() ?? 0},${skeletonRes.getAnchorY?.() ?? 0}`
        );
      }
      if (!resources[tagName]) resources[tagName] = [];
      resources[tagName].push(attrs);
    }
    return resources;
  }
  async _writeComponent(comp, pkgDir) {
    const fs3 = this._fs;
    const typedComp = comp;
    const path3 = typedComp.getPath?.() ?? "/";
    const name = comp.getName() + ".xml";
    const subDir = path3.replace(/^\//, "").replace(/\/$/, "");
    const fileDir = subDir ? fs3.join(pkgDir, subDir) : pkgDir;
    if (subDir) await fs3.mkdir(fileDir);
    const compAttrs = {};
    const [w, h] = [typedComp.getWidth?.() ?? 0, typedComp.getHeight?.() ?? 0];
    if (w || h) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.size, `${w},${h}`);
    const [pivotX, pivotY] = [typedComp.getPivotX?.() ?? 0, typedComp.getPivotY?.() ?? 0];
    if (pivotX !== 0 || pivotY !== 0) {
      writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
      if (typedComp.getPivotAsAnchor?.()) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.anchor, "true");
    }
    const overflow = typedComp.getOverflow?.() ?? 0;
    if (overflow !== 0) {
      const overflowName = { 0: "visible", 1: "hidden", 2: "scroll" };
      writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.overflow, overflowName[overflow] ?? "visible");
    }
    const margin = typedComp.getMargin?.();
    if (hasNonZeroInsets(margin)) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.margin, formatInsets(margin));
    const restrictSize = [
      typedComp.getMinWidth?.() ?? 0,
      typedComp.getMaxWidth?.() ?? 0,
      typedComp.getMinHeight?.() ?? 0,
      typedComp.getMaxHeight?.() ?? 0
    ];
    if (restrictSize.some((value) => value !== 0)) {
      writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.restrictSize, restrictSize.join(","));
    }
    if (typedComp.getBgColorEnabled?.()) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.bgColorEnabled, "true");
    const bgColor = typedComp.getBgColor?.();
    if (bgColor) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.bgColor, bgColor);
    const designImageAlpha = typedComp.getDesignImageAlpha?.() ?? 0;
    if (designImageAlpha !== 0) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageAlpha, String(designImageAlpha));
    const designImageLayer = typedComp.getDesignImageLayer?.() ?? 0;
    if (designImageLayer !== 0) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageLayer, String(designImageLayer));
    const designImageOffsetX = typedComp.getDesignImageOffsetX?.() ?? 0;
    if (designImageOffsetX !== 0) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageOffsetX, String(designImageOffsetX));
    const designImageOffsetY = typedComp.getDesignImageOffsetY?.() ?? 0;
    if (designImageOffsetY !== 0) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.designImageOffsetY, String(designImageOffsetY));
    const idNum = typedComp.getIdNum?.() ?? 0;
    if (idNum !== 0) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.idnum, String(idNum));
    const initName = typedComp.getInitName?.();
    if (initName) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.initName, initName);
    const remark = typedComp.getRemark?.();
    if (remark) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.remark, remark);
    const clipSoftness = typedComp.getClipSoftness?.();
    if (clipSoftness && ((clipSoftness.x ?? 0) !== 0 || (clipSoftness.y ?? 0) !== 0)) {
      writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.clipSoftness, `${clipSoftness.x ?? 0},${clipSoftness.y ?? 0}`);
    }
    if (typedComp.getOpaque?.() === false) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.opaque, "false");
    const mask = typedComp.getMask?.();
    if (mask) {
      writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.mask, mask);
      if (typedComp.getReversedMask?.()) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.reversedMask, "1");
    }
    const hitTest = typedComp.getHitTest?.();
    if (hitTest) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.hitTest, hitTest);
    const customData = typedComp.getCustomData?.();
    if (customData) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.customData, customData);
    if (overflow === 2) {
      const scrollTypeName = { 0: "horizontal", 1: "vertical", 2: "both" };
      const scrollBarName = { 0: "default", 1: "visible", 2: "auto", 3: "hidden" };
      const scrollType = typedComp.getScrollType?.() ?? 1;
      if (scrollType !== 1) {
        writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.scroll, scrollTypeName[scrollType] ?? "vertical");
      }
      const scrollBarDisplay = typedComp.getScrollBarDisplay?.() ?? 0;
      if (scrollBarDisplay !== 0) {
        writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBar, scrollBarName[scrollBarDisplay] ?? "default");
      }
      const scrollBarFlags = typedComp.getScrollBarFlags?.() ?? 0;
      if (scrollBarFlags !== 0) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBarFlags, String(scrollBarFlags));
      const scrollBarMargin = typedComp.getScrollBarMargin?.();
      if (hasNonZeroInsets(scrollBarMargin)) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBarMargin, formatInsets(scrollBarMargin));
      const vtScrollBarRes = typedComp.getVtScrollBarRes?.() ?? "";
      const hzScrollBarRes = typedComp.getHzScrollBarRes?.() ?? "";
      if (vtScrollBarRes || hzScrollBarRes) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.scrollBarRes, `${vtScrollBarRes},${hzScrollBarRes}`);
      const headerRes = typedComp.getHeaderRes?.() ?? "";
      const footerRes = typedComp.getFooterRes?.() ?? "";
      if (headerRes || footerRes) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.ptrRes, `${headerRes},${footerRes}`);
    }
    const extType = typedComp.getExtensionType?.() ?? "";
    if (extType) writeXmlAttr(compAttrs, PROJECT_XML_PROTOCOL.componentRoot.attrs.extention, extType);
    const compNode = { ...compAttrs };
    const controllers = comp.listControllers();
    if (controllers.length > 0) {
      const controllerChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.componentRoot, "controller");
      if (controllerChildName) {
        compNode[controllerChildName] = controllers.map((ctrl) => this._serializeController(ctrl));
      }
    }
    const children = comp.listChildren();
    if (children.length > 0) {
      compNode.displayList = this._serializeDisplayList(children);
    }
    const compRelations = comp.getRelations();
    if (compRelations.length > 0) {
      const relationChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.componentRoot, "relation");
      if (relationChildName) {
        const byTarget = /* @__PURE__ */ new Map();
        for (const rel of compRelations) {
          const name2 = RELATION_TYPE_NAME[rel.type] ?? "";
          if (!name2) continue;
          const pair = rel.usePercent ? name2 + "%" : name2;
          if (!byTarget.has(rel.target)) byTarget.set(rel.target, []);
          byTarget.get(rel.target).push(pair);
        }
        const relElements = Array.from(byTarget.entries()).map(([target, pairs]) => {
          const relationAttrs = {};
          writeXmlAttr(relationAttrs, PROJECT_XML_PROTOCOL.relation.attrs.target, target);
          writeXmlAttr(relationAttrs, PROJECT_XML_PROTOCOL.relation.attrs.sidePair, pairs.join(","));
          return relationAttrs;
        });
        if (relElements.length > 0) compNode[relationChildName] = relElements;
      }
    }
    const transitions = comp.listTransitions();
    if (transitions.length > 0) {
      const transitionChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.componentRoot, "transition");
      if (transitionChildName) {
        compNode[transitionChildName] = transitions.map((t) => this._serializeTransition(t));
      }
    }
    if (extType) {
      const extProtocol = EXTENSION_PROTOCOL_MAP2[extType];
      const extSpecs = extProtocol.attrs;
      const extAttrs = {};
      switch (extType) {
        case "Button": {
          if ((typedComp.getButtonMode?.() ?? 0) !== 0) writeXmlAttr(extAttrs, extSpecs.mode, formatButtonMode(typedComp.getButtonMode?.() ?? 0));
          if (typedComp.getSound?.()) writeXmlAttr(extAttrs, extSpecs.sound, typedComp.getSound?.());
          if ((typedComp.getSoundVolumeScale?.() ?? 1) !== 1) writeXmlAttr(extAttrs, extSpecs.soundVolumeScale, String(typedComp.getSoundVolumeScale?.() ?? 1));
          const downEffect = typedComp.getDownEffect?.() ?? 0;
          if (downEffect !== 0) {
            writeXmlAttr(extAttrs, extSpecs.downEffect, String(downEffect));
            writeXmlAttr(extAttrs, extSpecs.downEffectValue, formatButtonDownEffectValue(typedComp.getDownEffectValue?.() ?? 0.8));
          }
          break;
        }
        case "ComboBox":
          if (typedComp.getDropdown?.()) writeXmlAttr(extAttrs, extSpecs.dropdown, typedComp.getDropdown?.());
          if (typedComp.getSelectionController?.()) writeXmlAttr(extAttrs, extSpecs.selectionController, typedComp.getSelectionController?.());
          break;
        case "Label":
          if (typedComp.getPromptText?.()) writeXmlAttr(extAttrs, extSpecs.prompt, typedComp.getPromptText?.());
          break;
        case "ProgressBar":
          if ((typedComp.getTitleType?.() ?? 0) !== 0) writeXmlAttr(extAttrs, extSpecs.titleType, formatTitleType(typedComp.getTitleType?.() ?? 0));
          if (typedComp.getReverse?.()) writeXmlAttr(extAttrs, extSpecs.reverse, "true");
          break;
        case "Slider":
          if ((typedComp.getTitleType?.() ?? 0) !== 0) writeXmlAttr(extAttrs, extSpecs.titleType, formatTitleType(typedComp.getTitleType?.() ?? 0));
          if (typedComp.getReverse?.()) writeXmlAttr(extAttrs, extSpecs.reverse, "true");
          if (typedComp.getWholeNumbers?.()) writeXmlAttr(extAttrs, extSpecs.wholeNumbers, "true");
          if (typedComp.getChangeOnClick?.() === false) writeXmlAttr(extAttrs, extSpecs.changeOnClick, "false");
          break;
        case "ScrollBar":
          if (typedComp.getFixedGripSize?.()) writeXmlAttr(extAttrs, extSpecs.fixedGripSize, "true");
          break;
        default:
          break;
      }
      const rootExtensionChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.componentRoot, extType);
      if (rootExtensionChildName) {
        compNode[rootExtensionChildName] = Object.keys(extAttrs).length > 0 ? extAttrs : "";
      }
    }
    const xmlObj = {
      "?xml": { "@_version": "1.0", "@_encoding": "utf-8" },
      component: compNode
    };
    await fs3.writeFile(fs3.join(fileDir, name), builder.build(xmlObj).replace(/(?<!\r)\n/g, "\r\n"));
  }
  _serializeController(ctrl) {
    const pages = ctrl.listPages();
    const pagesStr = pages.map((p) => `${p.getId()},${p.getName()}`).join(",");
    const attrs = {};
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controller.attrs.name, ctrl.getName());
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controller.attrs.pages, pagesStr);
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controller.attrs.selected, String(ctrl.getSelectedIndex()));
    const actions = ctrl.listActions().map((action) => this._serializeControllerAction(action));
    const actionChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.controller, "action");
    if (actions.length > 0 && actionChildName) attrs[actionChildName] = actions;
    return attrs;
  }
  _serializeControllerAction(action) {
    const fromPage = action.getFromPage?.() ?? [];
    const toPage = action.getToPage?.() ?? [];
    const attrs = {};
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.type, action.getActionType() === 1 /* ChangePage */ ? "change_page" : "play_transition");
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.fromPage, fromPage.join(","));
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.toPage, toPage.join(","));
    switch (action.getActionType()) {
      case 0 /* PlayTransition */:
        if (action.getTransitionName?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.transition, action.getTransitionName?.());
        if ((action.getPlayTimes?.() ?? 1) !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.repeat, String(action.getPlayTimes?.() ?? 1));
        if ((action.getDelay?.() ?? 0) !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.delay, String(action.getDelay?.() ?? 0));
        if (action.getStopOnExit?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.stopOnExit, "true");
        break;
      case 1 /* ChangePage */:
        if (action.getObjectId?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.objectId, action.getObjectId?.());
        if (action.getControllerName?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.controller, action.getControllerName?.());
        if (action.getTargetPage?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.controllerAction.attrs.targetPage, action.getTargetPage?.());
        break;
      default:
        break;
    }
    return attrs;
  }
  _serializeDisplayList(children) {
    const lines = [];
    for (const child of children) {
      const propertyType = child.propertyType;
      const tag = DISPLAY_TAG[propertyType] ?? "component";
      assertDisplayListVariantAllowed(propertyType, tag, child.getName() || child.getId() || propertyType);
      lines.push(renderXmlNode(tag, this._serializeChild(child), "    "));
    }
    return `${NL}${lines.join(NL)}${NL}  `;
  }
  _serializeChild(obj) {
    const typedObj = obj;
    const attrs = {};
    let extensionChildName;
    let extensionValue;
    if (obj.getId()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.displayObject.attrs.id, obj.getId());
    if (obj.getName()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.displayObject.attrs.name, obj.getName());
    const xyX = typedObj.getX?.() ?? 0;
    const xyY = typedObj.getY?.() ?? 0;
    const type = obj.propertyType;
    if (type === "GImage" || type === "GMovieClip" || type === "GComponent" || EXTENSION_TYPE[type]) {
      const src = typedObj.getSrc?.();
      if (src) {
        if (type === "GComponent" || EXTENSION_TYPE[type]) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.src, src);
        else if (type === "GMovieClip") writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.src, src);
        else writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.src, src);
      }
    }
    if ((type === "GComponent" || type === "GList" || type === "GTree") && typedObj.getControllerOverrides?.()) {
      if (type === "GComponent") writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.controllerOverrides, typedObj.getControllerOverrides?.());
      else writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.controllerOverrides, typedObj.getControllerOverrides?.());
    }
    if ((type === "GComponent" || type === "GList" || type === "GTree") && typedObj.getPageController?.()) {
      if (type === "GComponent") writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.pageController, typedObj.getPageController?.());
      else writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.pageController, typedObj.getPageController?.());
    }
    if (type === "GComponent" && typedObj.getAspect?.()) {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.aspect, "true");
    }
    if (type === "GComponent") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.size, `${w},${h}`);
      if (typedObj.getLocked?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.locked, "true");
      const restrictSize = [
        typedObj.getMinWidth?.() ?? 0,
        typedObj.getMaxWidth?.() ?? 0,
        typedObj.getMinHeight?.() ?? 0,
        typedObj.getMaxHeight?.() ?? 0
      ];
      if (restrictSize.some((value) => value !== 0)) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.restrictSize, restrictSize.join(","));
      if (typedObj.getGroup?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.group, typedObj.getGroup?.());
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.anchor, "true");
      }
      const [scaleX, scaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (scaleX !== 1 || scaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.scale, `${formatTrimmedFixed(scaleX, 3)},${formatTrimmedFixed(scaleY, 3)}`);
      if ((typedObj.getRotation?.() ?? 0) !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.rotation, formatTrimmedFixed(typedObj.getRotation?.() ?? 0, 2));
      if ((typedObj.getAlpha?.() ?? 1) !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.alpha, formatDisplayAlpha(typedObj.getAlpha?.() ?? 1));
      if (typedObj.getVisible?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.visible, "false");
      if (typedObj.getTouchable?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.touchable, "false");
      if (typedObj.getGrayed?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.grayed, "true");
      if (typedObj.getTooltips?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.tooltips, typedObj.getTooltips?.());
      if (typedObj.getCustomData?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.customData, typedObj.getCustomData?.());
      if (typedObj.getFileName?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.fileName, typedObj.getFileName?.());
      if (typedObj.getPackageId?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.pkg, typedObj.getPackageId?.());
      if (typedObj.getFilter?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.filter, typedObj.getFilter?.());
      if (typedObj.getFilterData?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.componentInstance.attrs.filterData, typedObj.getFilterData?.());
    }
    if (type === "GImage") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.size, `${w},${h}`);
      if (typedObj.getLocked?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.locked, "true");
      if (typedObj.getAspect?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.aspect, "true");
      if (typedObj.getGroup?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.group, typedObj.getGroup?.());
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.anchor, "true");
      }
      const [scaleX, scaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (scaleX !== 1 || scaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.scale, `${formatTrimmedFixed(scaleX, 3)},${formatTrimmedFixed(scaleY, 3)}`);
      if ((typedObj.getRotation?.() ?? 0) !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.rotation, formatTrimmedFixed(typedObj.getRotation?.() ?? 0, 2));
      if ((typedObj.getAlpha?.() ?? 1) !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.alpha, formatDisplayAlpha(typedObj.getAlpha?.() ?? 1));
      if (typedObj.getVisible?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.visible, "false");
      if (typedObj.getGrayed?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.grayed, "true");
      if (typedObj.getPackageId?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.pkg, typedObj.getPackageId?.());
      if (typedObj.getFilter?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.filter, typedObj.getFilter?.());
      if (typedObj.getFilterData?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.filterData, typedObj.getFilterData?.());
      const imageColor = typedObj.getColor?.();
      if (imageColor && !isDefaultWhiteColor(imageColor)) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.color, imageColor);
      const flip = typedObj.getFlip?.() ?? 0;
      if (flip !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.flip, formatImageFlip(flip));
      const fillMethod = typedObj.getFillMethod?.() ?? 0;
      if (fillMethod !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillMethod, formatFillMethod(fillMethod));
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillOrigin, String(typedObj.getFillOrigin?.() ?? 0));
        if (typedObj.getFillClockwise?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillClockwise, "false");
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.image.attrs.fillAmount, String(Math.round((typedObj.getFillAmount?.() ?? 0) * 100)));
      }
    }
    if (type === "GGraph") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      if (w !== 0 || h !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.size, `${w},${h}`);
      if (typedObj.getLocked?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.locked, "true");
      const restrictSize = [
        typedObj.getMinWidth?.() ?? 0,
        typedObj.getMaxWidth?.() ?? 0,
        typedObj.getMinHeight?.() ?? 0,
        typedObj.getMaxHeight?.() ?? 0
      ];
      if (restrictSize.some((value) => value !== 0)) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.restrictSize, restrictSize.join(","));
      if (typedObj.getGroup?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.group, typedObj.getGroup?.());
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.anchor, "true");
      }
      const [graphScaleX, graphScaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (graphScaleX !== 1 || graphScaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.scale, `${formatTrimmedFixed(graphScaleX, 3)},${formatTrimmedFixed(graphScaleY, 3)}`);
      if ((typedObj.getRotation?.() ?? 0) !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.rotation, formatTrimmedFixed(typedObj.getRotation?.() ?? 0, 2));
      if ((typedObj.getAlpha?.() ?? 1) !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.alpha, formatDisplayAlpha(typedObj.getAlpha?.() ?? 1));
      if (typedObj.getVisible?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.visible, "false");
      if (typedObj.getTouchable?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.touchable, "false");
      const [skewX, skewY] = [typedObj.getSkewX?.() ?? 0, typedObj.getSkewY?.() ?? 0];
      if (skewX !== 0 || skewY !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.skew, `${skewX},${skewY}`);
      const graphType = typedObj.getGraphType?.() ?? 0;
      if (graphType !== 0) {
        const graphTypeName = {
          1: "rect",
          2: "ellipse",
          3: "polygon",
          4: "regularpolygon"
        };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.type, graphTypeName[graphType] ?? "rect");
      }
      if ((typedObj.getLineSize?.() ?? 1) !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.lineSize, String(typedObj.getLineSize?.() ?? 1));
      const lineColor = typedObj.getLineColor?.();
      if (lineColor && !sameColor(lineColor, "#000000") && !sameColor(lineColor, "#ff000000")) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.lineColor, formatXmlColor(lineColor));
      }
      const fillColor = typedObj.getFillColor?.();
      if (fillColor && !sameColor(fillColor, "#FFFFFF") && !sameColor(fillColor, "#FFFFFFFF")) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.fillColor, formatXmlColor(fillColor));
      }
      const cornerRadius = typedObj.getCornerRadius?.();
      if (cornerRadius) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.corner, cornerRadius.join(","));
      const points = typedObj.getPoints?.();
      if (points?.length) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.points, points.join(","));
      const sides = typedObj.getSides?.() ?? 0;
      if (sides > 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.sides, String(sides));
      const startAngle = typedObj.getStartAngle?.() ?? 0;
      if (startAngle !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.startAngle, String(startAngle));
      const distances = typedObj.getDistances?.();
      if (distances?.length) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.graph.attrs.distances, distances.join(","));
    }
    if (type === "GGroup" && typedObj.getGroup?.()) {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.group, typedObj.getGroup?.());
    }
    if (type === "GGroup") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      if (w !== 0 || h !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.size, `${w},${h}`);
      if (typedObj.getLocked?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.locked, "true");
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.anchor, "true");
      }
      const [scaleX, scaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (scaleX !== 1 || scaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.scale, `${formatTrimmedFixed(scaleX, 3)},${formatTrimmedFixed(scaleY, 3)}`);
    }
    if (type === "GLoader") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      if (w !== 0 || h !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.size, `${w},${h}`);
      if (typedObj.getGroup?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.group, typedObj.getGroup?.());
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.anchor, "true");
      }
      const [scaleX, scaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (scaleX !== 1 || scaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.scale, `${formatTrimmedFixed(scaleX, 3)},${formatTrimmedFixed(scaleY, 3)}`);
      if (typedObj.getGrayed?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.grayed, "true");
      const url = typedObj.getUrl?.();
      if (url) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.url, url);
      const align = typedObj.getAlign?.();
      if (align !== void 0 && align !== 0) {
        const alignName = { 0: "left", 1: "center", 2: "right" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.align, alignName[align] ?? "left");
      }
      const vAlign = typedObj.getVAlign?.();
      if (vAlign !== void 0 && vAlign !== 0) {
        const vAlignName = { 0: "top", 1: "middle", 2: "bottom" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.vAlign, vAlignName[vAlign] ?? "top");
      }
      const fill = typedObj.getFill?.();
      if (fill !== void 0 && fill !== 0) {
        const fillName = {
          0: "none",
          1: "scale",
          2: "scaleMatchHeight",
          3: "scaleMatchWidth",
          4: "scaleFree",
          5: "scaleNoBorder"
        };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fill, fillName[fill] ?? "none");
      }
      if (typedObj.getShrinkOnly?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.shrinkOnly, "1");
      if (typedObj.getAutoSize?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.autoSize, "1");
      if (typedObj.getUseResize?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.useResize, "1");
      const loaderColor = typedObj.getColor?.();
      if (loaderColor && !isDefaultWhiteColor(loaderColor)) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.color, loaderColor);
      if (typedObj.getFilter?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.filter, typedObj.getFilter?.());
      if (typedObj.getFilterData?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.filterData, typedObj.getFilterData?.());
      if (typedObj.getPlaying?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.playing, "false");
      const frame = typedObj.getFrame?.() ?? 0;
      if (frame !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.frame, String(frame));
      const fillMethod = typedObj.getFillMethod?.() ?? 0;
      if (fillMethod !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillMethod, formatFillMethod(fillMethod));
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillOrigin, String(typedObj.getFillOrigin?.() ?? 0));
        if (typedObj.getFillClockwise?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillClockwise, "false");
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.fillAmount, String(Math.round((typedObj.getFillAmount?.() ?? 0) * 100)));
      }
      if (typedObj.getClearOnPublish?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader.attrs.clearOnPublish, "true");
    }
    if (type === "GMovieClip") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      if (w !== 0 || h !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.size, `${w},${h}`);
      if (typedObj.getGroup?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.group, typedObj.getGroup?.());
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
      const [mcScaleX, mcScaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (mcScaleX !== 1 || mcScaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.scale, `${formatTrimmedFixed(mcScaleX, 3)},${formatTrimmedFixed(mcScaleY, 3)}`);
      if ((typedObj.getRotation?.() ?? 0) !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.rotation, formatTrimmedFixed(typedObj.getRotation?.() ?? 0, 2));
      if ((typedObj.getAlpha?.() ?? 1) !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.alpha, formatDisplayAlpha(typedObj.getAlpha?.() ?? 1));
      if (typedObj.getVisible?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.visible, "false");
      if (typedObj.getGrayed?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.grayed, "true");
      if (typedObj.getFileName?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.fileName, typedObj.getFileName?.());
      if (typedObj.getPackageId?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.pkg, typedObj.getPackageId?.());
      if (typedObj.getFilter?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.filter, typedObj.getFilter?.());
      if (typedObj.getFilterData?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.filterData, typedObj.getFilterData?.());
    }
    if (type === "GTextField" || type === "GRichTextField" || type === "GTextInput") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.size, `${w},${h}`);
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.anchor, "true");
      }
      const [scaleX, scaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (scaleX !== 1 || scaleY !== 1) {
        const scaleSpec = type === "GRichTextField" ? PROJECT_XML_PROTOCOL.richText.attrs.scale : PROJECT_XML_PROTOCOL.text.attrs.scale;
        writeXmlAttr(attrs, scaleSpec, `${formatTrimmedFixed(scaleX, 3)},${formatTrimmedFixed(scaleY, 3)}`);
      }
      const restrictSize = [
        typedObj.getMinWidth?.() ?? 0,
        typedObj.getMaxWidth?.() ?? 0,
        typedObj.getMinHeight?.() ?? 0,
        typedObj.getMaxHeight?.() ?? 0
      ];
      if (restrictSize.some((value) => value !== 0)) {
        const restrictSpec = type === "GRichTextField" ? PROJECT_XML_PROTOCOL.richText.attrs.restrictSize : PROJECT_XML_PROTOCOL.text.attrs.restrictSize;
        writeXmlAttr(attrs, restrictSpec, restrictSize.join(","));
      }
      if (typedObj.getAutoClearText?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoClearText, "true");
      if (type === "GTextField") {
        const demoText = typedObj.getDemoText?.();
        if (demoText !== void 0 && demoText !== "") writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.demoText, demoText);
        if (typedObj.getTemplateVarsEnabled?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.vars, "true");
        const faceDilate = typedObj.getFaceDilate?.() ?? 0;
        if (faceDilate !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.faceDilate, String(faceDilate));
        const underlaySoftness = typedObj.getUnderlaySoftness?.() ?? 0;
        if (underlaySoftness !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.underlaySoftness, String(underlaySoftness));
      }
      if (type === "GRichTextField") {
        const underlaySoftness = typedObj.getUnderlaySoftness?.() ?? 0;
        if (underlaySoftness !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.richText.attrs.underlaySoftness, String(underlaySoftness));
      }
      if (typedObj.getGroup?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.group, typedObj.getGroup?.());
      if (typedObj.getCustomData?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.customData, typedObj.getCustomData?.());
    }
    if ((type === "GList" || type === "GTree") && typedObj.getGroup?.()) {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.group, typedObj.getGroup?.());
    }
    if (type === "GList" || type === "GTree") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      if (w !== 0 || h !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.size, `${w},${h}`);
      const [pivotX, pivotY] = [typedObj.getPivotX?.() ?? 0, typedObj.getPivotY?.() ?? 0];
      if (pivotX !== 0 || pivotY !== 0) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.pivot, `${formatTrimmedFixed(pivotX, 3)},${formatTrimmedFixed(pivotY, 3)}`);
        if (typedObj.getPivotAsAnchor?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.anchor, "true");
      }
      const [scaleX, scaleY] = [typedObj.getScaleX?.() ?? 1, typedObj.getScaleY?.() ?? 1];
      if (scaleX !== 1 || scaleY !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scale, `${formatTrimmedFixed(scaleX, 3)},${formatTrimmedFixed(scaleY, 3)}`);
    }
    if (type === "GLoader3D") {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.xy, `${xyX},${xyY}`);
      const [w, h] = [typedObj.getWidth?.() ?? 0, typedObj.getHeight?.() ?? 0];
      if (w !== 0 || h !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.size, `${w},${h}`);
      const url = typedObj.getUrl?.();
      if (url) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.url, url);
      const align = typedObj.getAlign?.();
      if (align !== void 0 && align !== 0) {
        const alignName = { 0: "left", 1: "center", 2: "right" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.align, alignName[align] ?? "left");
      }
      const vAlign = typedObj.getVAlign?.();
      if (vAlign !== void 0 && vAlign !== 0) {
        const vAlignName = { 0: "top", 1: "middle", 2: "bottom" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.vAlign, vAlignName[vAlign] ?? "top");
      }
      const fill = typedObj.getFill?.();
      if (fill !== void 0) {
        const fillName = {
          0: "none",
          1: "scale",
          2: "scaleMatchHeight",
          3: "scaleMatchWidth",
          4: "scaleFree",
          5: "scaleNoBorder"
        };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.fill, fillName[fill] ?? "none");
      }
      if (typedObj.getShrinkOnly?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.shrinkOnly, "1");
      if (typedObj.getAutoSize?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.autoSize, "1");
      const animationName = typedObj.getAnimationName?.();
      if (animationName) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.animation, animationName);
      const skinName = typedObj.getSkinName?.();
      if (skinName) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.skinName, skinName);
      if (typedObj.getPlaying?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.playing, "false");
      const frame = typedObj.getFrame?.() ?? 0;
      if (frame !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.frame, String(frame));
      if (typedObj.getLoop?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.loop, "false");
      const loaderColor = typedObj.getColor?.();
      if (loaderColor) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.loader3D.attrs.color, loaderColor);
    }
    if (type === "GGroup" && typedObj.getVisible?.() === false) {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.visible, "false");
    }
    if ((type === "GList" || type === "GTree") && typedObj.getTouchable?.() === false) {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.touchable, "false");
    }
    if (type === "GMovieClip") {
      if (typedObj.getPlaying?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.playing, "false");
      const frame = typedObj.getFrame?.() ?? 0;
      if (frame !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.frame, String(frame));
      const movieClipColor = typedObj.getColor?.();
      if (movieClipColor && !isDefaultWhiteColor(movieClipColor)) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.movieClip.attrs.color, formatXmlColor(movieClipColor));
      }
    }
    if (type === "GGroup") {
      const layout = typedObj.getLayout?.();
      if (layout !== void 0 && layout !== 0) {
        const layoutName = { 0: "none", 1: "horizontal", 2: "vertical" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.layout, layoutName[layout] ?? "none");
      }
      const lineGap = typedObj.getLineGap?.() ?? 0;
      if (lineGap !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.lineGap, String(lineGap));
      const columnGap = typedObj.getColumnGap?.() ?? 0;
      if (columnGap !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.columnGap, String(columnGap));
      if (typedObj.getAdvanced?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.advanced, "true");
      if (typedObj.getExcludeInvisibles?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.excludeInvisibles, "true");
      if (typedObj.getAutoSizeDisabled?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.autoSizeDisabled, "true");
      const mainGridIndex = typedObj.getMainGridIndex?.() ?? -1;
      if (mainGridIndex >= 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.group.attrs.mainGridIndex, String(mainGridIndex));
    }
    if (type === "GList" || type === "GTree") {
      const isTree = type === "GTree";
      const layout = typedObj.getLayout?.();
      if (layout !== void 0 && layout !== 0) {
        const layoutName = {
          1: "row",
          2: "flow_hz",
          3: "flow_vt",
          4: "pagination"
        };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.layout, layoutName[layout] ?? "row");
      }
      const lineGap = typedObj.getLineGap?.() ?? 0;
      if (lineGap !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.lineGap, String(lineGap));
      const columnGap = typedObj.getColumnGap?.() ?? 0;
      if (columnGap !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.columnGap, String(columnGap));
      const align = typedObj.getAlign?.();
      if (align !== void 0 && align !== 0) {
        const alignName = { 0: "left", 1: "center", 2: "right" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.align, alignName[align] ?? "left");
      }
      const vAlign = typedObj.getVAlign?.();
      if (vAlign !== void 0 && vAlign !== 0) {
        const vAlignName = { 0: "top", 1: "middle", 2: "bottom" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.vAlign, vAlignName[vAlign] ?? "top");
      }
      const lineCount = typedObj.getLineCount?.() ?? 0;
      if (lineCount !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.lineCount, String(lineCount));
      if (typedObj.getAutoResizeItem?.() === false) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.autoResizeItem, "false");
      const selectionMode = typedObj.getSelectionMode?.();
      if (selectionMode !== void 0 && selectionMode !== 0) {
        const selectionName = {
          0: "single",
          1: "multiple",
          2: "multipleSingleClick",
          3: "none"
        };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.selectionMode, selectionName[selectionMode] ?? "single");
      }
      const defaultItem = typedObj.getDefaultItem?.();
      if (defaultItem) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.defaultItem, defaultItem);
      const selectionController = typedObj.getSelectionController?.();
      if (selectionController) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.selectionController, selectionController);
      if (isTree) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.treeView, "true");
      if (isTree) {
        const indent = typedObj.getIndent?.() ?? 0;
        if (indent !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.indent, String(indent));
        const clickToExpand = typedObj.getClickToExpand?.() ?? 0;
        if (clickToExpand !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.clickToExpand, String(clickToExpand));
      }
      const overflow = typedObj.getOverflow?.() ?? 0;
      if (overflow !== 0) {
        const overflowName = { 0: "visible", 1: "hidden", 2: "scroll" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.overflow, overflowName[overflow] ?? "visible");
      }
      const scrollType = typedObj.getScrollType?.();
      if (scrollType !== void 0 && scrollType !== 1) {
        const scrollTypeName = { 0: "horizontal", 1: "vertical", 2: "both" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scroll, scrollTypeName[scrollType] ?? "vertical");
      }
      const scrollBarFlags = typedObj.getScrollBarFlags?.() ?? 0;
      if (scrollBarFlags !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scrollBarFlags, String(scrollBarFlags));
      const vtScrollBarRes = typedObj.getVtScrollBarRes?.() ?? "";
      const hzScrollBarRes = typedObj.getHzScrollBarRes?.() ?? "";
      if (vtScrollBarRes || hzScrollBarRes) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.scrollBarRes, `${vtScrollBarRes},${hzScrollBarRes}`);
      const headerRes = typedObj.getHeaderRes?.() ?? "";
      const footerRes = typedObj.getFooterRes?.() ?? "";
      if (headerRes || footerRes) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.ptrRes, `${headerRes},${footerRes}`);
      const margin = typedObj.getMargin?.();
      if (hasNonZeroInsets(margin)) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.margin, formatInsets(margin));
      const clipSoftness = typedObj.getClipSoftness?.();
      if (clipSoftness && ((clipSoftness.x ?? 0) !== 0 || (clipSoftness.y ?? 0) !== 0)) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.list.attrs.clipSoftness, `${clipSoftness.x ?? 0},${clipSoftness.y ?? 0}`);
      }
      const listItems = typedObj.getListItems?.() ?? [];
      const listItemChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.list, "item");
      if (listItems.length > 0 && listItemChildName) {
        attrs[listItemChildName] = listItems.map((item) => serializeListItemXmlNode(item, { forceLevel: isTree }));
      }
    }
    if (type === "GTextField" || type === "GRichTextField" || type === "GTextInput") {
      const text = typedObj.getText?.();
      if (text !== void 0 && text !== null) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.text, text);
      const font = typedObj.getFont?.();
      if (font) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.font, font);
      const fontSize = typedObj.getFontSize?.();
      if (fontSize) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.fontSize, String(fontSize));
      const color = typedObj.getColor?.();
      if (color && !isDefaultBlackColor(color)) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.color, formatXmlColor(color));
      const align = typedObj.getAlign?.();
      if (align !== void 0 && align !== 0) {
        const alignName = { 0: "left", 1: "center", 2: "right" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.align, alignName[align] ?? "left");
      }
      const vAlign = typedObj.getVAlign?.();
      if (vAlign !== void 0 && vAlign !== 0) {
        const vAlignName = { 0: "top", 1: "middle", 2: "bottom" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.vAlign, vAlignName[vAlign] ?? "top");
      }
      const autoSize = typedObj.getAutoSize?.();
      if (typeof autoSize === "number" && autoSize !== 1) {
        const autoSizeName = { 0: "none", 1: "both", 2: "height", 3: "shrink", 4: "ellipsis" };
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.autoSize, autoSizeName[autoSize] ?? "both");
      }
      if (typedObj.getSingleLine?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.singleLine, "true");
      if (typedObj.getUbbEnabled?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.ubb, "true");
      const leading = typedObj.getLeading?.() ?? 3;
      if (leading !== 3) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.leading, String(leading));
      const letterSpacing = typedObj.getLetterSpacing?.() ?? 0;
      if (letterSpacing !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.letterSpacing, String(letterSpacing));
      if (typedObj.getUnderline?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.underline, "true");
      if (typedObj.getItalic?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.italic, "true");
      if (typedObj.getBold?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.bold, "true");
      if (typedObj.getStrikethrough?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strikethrough, "1");
      const strokeColor = typedObj.getStrokeColor?.();
      if (strokeColor) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeColor, formatXmlColor(strokeColor));
        const strokeSize = typedObj.getStrokeSize?.() ?? 1;
        if (strokeSize !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.strokeSize, String(strokeSize));
      }
      const shadowColor = typedObj.getShadowColor?.();
      if (shadowColor) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.shadowColor, formatXmlColor(shadowColor));
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.text.attrs.shadowOffset, `${typedObj.getShadowOffsetX?.() ?? 1},${typedObj.getShadowOffsetY?.() ?? 1}`);
      }
      if (type === "GTextInput") {
        const promptText = typedObj.getPromptText?.();
        if (promptText) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.prompt, promptText);
        const maxLength = typedObj.getMaxLength?.() ?? 0;
        if (maxLength !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.maxLength, String(maxLength));
        const restrict = typedObj.getRestrict?.();
        if (restrict) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.restrict, restrict);
        if (typedObj.getPassword?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.password, "true");
        const keyboardType = typedObj.getKeyboardType?.() ?? 0;
        if (keyboardType !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.textInput.attrs.keyboardType, String(keyboardType));
      }
    }
    if (type === "GComponent") {
      const instanceExtType = typedObj.getInstanceExtType?.() ?? "";
      if (instanceExtType) {
        const extProtocol = EXTENSION_PROTOCOL_MAP2[instanceExtType];
        const extSpecs = extProtocol.attrs;
        const extAttrs = {};
        if (typedObj.getInstanceTitle?.() && extSpecs.title) writeXmlAttr(extAttrs, extSpecs.title, typedObj.getInstanceTitle?.());
        if (typedObj.getInstanceSelectedTitle?.() && extSpecs.selectedTitle) writeXmlAttr(extAttrs, extSpecs.selectedTitle, typedObj.getInstanceSelectedTitle?.());
        if (typedObj.getInstanceIcon?.() && extSpecs.icon) writeXmlAttr(extAttrs, extSpecs.icon, typedObj.getInstanceIcon?.());
        if (typedObj.getInstanceSelectedIcon?.() && extSpecs.selectedIcon) writeXmlAttr(extAttrs, extSpecs.selectedIcon, typedObj.getInstanceSelectedIcon?.());
        if (typedObj.getInstanceTitleColor?.() && extSpecs.titleColor) writeXmlAttr(extAttrs, extSpecs.titleColor, typedObj.getInstanceTitleColor?.());
        if ((typedObj.getInstanceTitleFontSize?.() ?? 0) > 0 && extSpecs.titleFontSize) writeXmlAttr(extAttrs, extSpecs.titleFontSize, String(typedObj.getInstanceTitleFontSize?.() ?? 0));
        if (typedObj.getInstanceController?.() && extSpecs.controller) writeXmlAttr(extAttrs, extSpecs.controller, typedObj.getInstanceController?.());
        if (typedObj.getInstancePage?.() && extSpecs.page) writeXmlAttr(extAttrs, extSpecs.page, typedObj.getInstancePage?.());
        if (typedObj.getInstanceChecked?.() && extSpecs.checked) writeXmlAttr(extAttrs, extSpecs.checked, "1");
        if (typedObj.getInstancePromptText?.() && extSpecs.prompt) writeXmlAttr(extAttrs, extSpecs.prompt, typedObj.getInstancePromptText?.());
        if (typedObj.getInstanceSelectionController?.() && extSpecs.selectionController) writeXmlAttr(extAttrs, extSpecs.selectionController, typedObj.getInstanceSelectionController?.());
        if ((typedObj.getInstanceVisibleItemCount?.() ?? 0) > 0 && extSpecs.visibleItemCount) writeXmlAttr(extAttrs, extSpecs.visibleItemCount, String(typedObj.getInstanceVisibleItemCount?.() ?? 0));
        const instanceValue = typedObj.getInstanceValue?.() ?? 0;
        const instanceMax = typedObj.getInstanceMax?.() ?? 0;
        const instanceMin = typedObj.getInstanceMin?.() ?? 0;
        if (instanceValue !== 0 && extSpecs.value) writeXmlAttr(extAttrs, extSpecs.value, String(instanceValue));
        if (instanceMax !== 0 && extSpecs.max) writeXmlAttr(extAttrs, extSpecs.max, String(instanceMax));
        if (instanceMin !== 0 && extSpecs.min) writeXmlAttr(extAttrs, extSpecs.min, String(instanceMin));
        const comboItems = typedObj.getInstanceComboItems?.() ?? [];
        const comboBoxItemChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.comboBoxExtension, "item");
        if (comboItems.length > 0 && comboBoxItemChildName) {
          extAttrs[comboBoxItemChildName] = comboItems.map((item) => serializeComboBoxItemXmlNode(item));
        }
        extensionChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.componentInstance, instanceExtType) ?? void 0;
        if (extensionChildName) {
          extensionValue = Object.keys(extAttrs).length > 0 ? extAttrs : "";
        }
      }
    }
    const objectProtocol = DISPLAY_OBJECT_PROTOCOL_BY_TYPE[type] ?? PROJECT_XML_PROTOCOL.componentInstance;
    const gearChildNameSet = getProtocolGearChildNameSet(objectProtocol);
    for (const gear of obj.listGears()) {
      const gearTag = GEAR_TAG[gear.getGearType()];
      if (!gearTag || !gearChildNameSet.has(gearTag)) continue;
      attrs[gearTag] = [this._serializeGear(gear, obj.propertyType, obj.getName?.())];
    }
    const relationChildName = getProtocolChildName2(objectProtocol, "relation");
    const relations = obj.getRelations();
    if (relations.length > 0) {
      const byTarget = /* @__PURE__ */ new Map();
      for (const rel of relations) {
        const name = RELATION_TYPE_NAME[rel.type] ?? "";
        if (!name) continue;
        const pair = rel.usePercent ? name + "%" : name;
        if (!byTarget.has(rel.target)) byTarget.set(rel.target, []);
        byTarget.get(rel.target).push(pair);
      }
      const relElements = Array.from(byTarget.entries()).map(([target, pairs]) => ({
        ...(() => {
          const relationAttrs = {};
          writeXmlAttr(relationAttrs, PROJECT_XML_PROTOCOL.relation.attrs.target, target);
          writeXmlAttr(relationAttrs, PROJECT_XML_PROTOCOL.relation.attrs.sidePair, pairs.join(","));
          return relationAttrs;
        })()
      }));
      if (relElements.length > 0 && relationChildName) attrs[relationChildName] = relElements;
    }
    if (extensionChildName && extensionValue !== void 0) {
      attrs[extensionChildName] = extensionValue;
    }
    return attrs;
  }
  _serializeGear(gear, ownerType, ownerName) {
    const ctrl = gear.getController();
    const attrs = {};
    if (ctrl) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.controller, ctrl.getName());
    if (gear.getPages()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.pages, gear.getPages());
    if (gear.getValues()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.values, normalizeGearXmlValue(gear.getGearType(), gear.getValues(), ownerType, ownerName ?? void 0, gear));
    if (gear.getDefaultValue() !== null) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.default, normalizeGearXmlValue(gear.getGearType(), gear.getDefaultValue(), ownerType, ownerName ?? void 0, gear));
    if (gear.getTween()) {
      writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.tween, "true");
      const hasDefaultTweenConfig = gear.getEaseType() === 5 && Math.abs(gear.getTweenDuration() - 0.3) < 1e-6;
      if (!hasDefaultTweenConfig) {
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.ease, stringifyEaseType(gear.getEaseType()));
        writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.duration, formatTrimmedFixed(gear.getTweenDuration(), 6));
      }
    }
    if (gear.getPositionsInPercent?.()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.positionsInPercent, "true");
    if (gear.getCondition()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.gear.attrs.condition, gear.getCondition());
    return attrs;
  }
  _serializeTransition(trans) {
    const attrs = {};
    writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.transition.attrs.name, trans.getName());
    if (trans.getAutoPlay()) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.transition.attrs.autoPlay, "true");
    if (trans.getAutoPlayTimes() !== 1) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.transition.attrs.autoPlayTimes, String(trans.getAutoPlayTimes()));
    if (trans.getAutoPlayDelay() !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.transition.attrs.autoPlayDelay, String(trans.getAutoPlayDelay()));
    if (trans.getOptions() !== 0) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.transition.attrs.options, String(trans.getOptions()));
    if (trans.getFps() !== 24) writeXmlAttr(attrs, PROJECT_XML_PROTOCOL.transition.attrs.fps, String(trans.getFps()));
    const ACTION_TYPE_NAMES = {
      0: "XY",
      1: "Size",
      2: "Scale",
      3: "Pivot",
      4: "Alpha",
      5: "Rotation",
      6: "Color",
      7: "Animation",
      8: "Visible",
      9: "Sound",
      10: "Transition",
      11: "Shake",
      12: "ColorFilter",
      13: "Skew",
      14: "Text",
      15: "Icon"
    };
    const items = trans.listItems().map((item) => {
      const ia = {};
      writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.time, formatTransitionFrameValue(item.getTime()));
      writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.type, ACTION_TYPE_NAMES[item.getActionType()] ?? "XY");
      if (item.getTargetId()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.target, item.getTargetId());
      if (item.getDuration() !== 0) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.duration, formatTransitionFrameValue(item.getDuration()));
      if (item.getTween()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.tween, "true");
      if (item.getTween() && item.getEaseType() !== 5) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.ease, stringifyEaseType(item.getEaseType()));
      if (item.getRepeat() !== 0) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.repeat, String(item.getRepeat()));
      if (item.getYoyo()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.yoyo, "true");
      if (item.getLabel()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.label, item.getLabel());
      if (item.getEndLabel()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.label2, item.getEndLabel());
      if (item.getPath()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.path, item.getPath());
      const sv = item.getStartValue();
      if (sv.length) {
        if (!item.getTween()) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.value, stringifyTransitionValue(item.getActionType(), sv));
        else writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.startValue, stringifyTransitionValue(item.getActionType(), sv));
      }
      const ev = item.getEndValue();
      if (ev.length) writeXmlAttr(ia, PROJECT_XML_PROTOCOL.transitionItem.attrs.endValue, stringifyTransitionValue(item.getActionType(), ev));
      return ia;
    });
    const transitionItemChildName = getProtocolChildName2(PROJECT_XML_PROTOCOL.transition, "item");
    if (items.length > 0 && transitionItemChildName) attrs[transitionItemChildName] = items;
    return attrs;
  }
  _resourceTag(propertyType) {
    const map = {
      ImageResource: "image",
      Component: "component",
      MiscResource: "misc",
      SoundResource: "sound",
      FontResource: "font",
      MovieClipResource: "movieclip",
      SpineResource: "spine",
      DragonBonesResource: "dragonbones"
    };
    return map[propertyType] ?? null;
  }
  _resourceFileName(res) {
    const name = res.getName?.() ?? "";
    const type = res.propertyType;
    if (type === "Component") return name + ".xml";
    if (type === "ImageResource") {
      const fileName = res.getFileName?.() ?? "";
      if (fileName) return fileName;
    }
    if (type === "SoundResource" || type === "MiscResource" || type === "SpineResource" || type === "DragonBonesResource") {
      const fileName = res.getFile?.() ?? "";
      if (fileName) return fileName;
    }
    if (type === "FontResource") {
      const fileName = res.getFileName?.() ?? "";
      if (fileName) return fileName;
    }
    if (type === "MovieClipResource") {
      const fileName = res.getFileName?.() ?? "";
      if (fileName) return fileName;
      return `${name}.jta`;
    }
    return name;
  }
  _projectTypeName(type) {
    const names = {
      0: "Unity",
      1: "Flash",
      2: "Starling",
      3: "CocosCreator",
      4: "Layabox",
      5: "Egret",
      6: "Haxe",
      7: "Pixi",
      8: "LibGDX",
      9: "Unreal"
    };
    return names[type] ?? "Unity";
  }
};

// node_modules/.pnpm/pako@2.1.0/node_modules/pako/dist/pako.esm.mjs
var Z_FIXED$1 = 4;
var Z_BINARY = 0;
var Z_TEXT = 1;
var Z_UNKNOWN$1 = 2;
function zero$1(buf) {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
}
var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES = 2;
var MIN_MATCH$1 = 3;
var MAX_MATCH$1 = 258;
var LENGTH_CODES$1 = 29;
var LITERALS$1 = 256;
var L_CODES$1 = LITERALS$1 + 1 + LENGTH_CODES$1;
var D_CODES$1 = 30;
var BL_CODES$1 = 19;
var HEAP_SIZE$1 = 2 * L_CODES$1 + 1;
var MAX_BITS$1 = 15;
var Buf_size = 16;
var MAX_BL_BITS = 7;
var END_BLOCK = 256;
var REP_3_6 = 16;
var REPZ_3_10 = 17;
var REPZ_11_138 = 18;
var extra_lbits = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
);
var extra_dbits = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
);
var extra_blbits = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
);
var bl_order = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var DIST_CODE_LEN = 512;
var static_ltree = new Array((L_CODES$1 + 2) * 2);
zero$1(static_ltree);
var static_dtree = new Array(D_CODES$1 * 2);
zero$1(static_dtree);
var _dist_code = new Array(DIST_CODE_LEN);
zero$1(_dist_code);
var _length_code = new Array(MAX_MATCH$1 - MIN_MATCH$1 + 1);
zero$1(_length_code);
var base_length = new Array(LENGTH_CODES$1);
zero$1(base_length);
var base_dist = new Array(D_CODES$1);
zero$1(base_dist);
function StaticTreeDesc(static_tree, extra_bits, extra_base, elems, max_length) {
  this.static_tree = static_tree;
  this.extra_bits = extra_bits;
  this.extra_base = extra_base;
  this.elems = elems;
  this.max_length = max_length;
  this.has_stree = static_tree && static_tree.length;
}
var static_l_desc;
var static_d_desc;
var static_bl_desc;
function TreeDesc(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;
  this.max_code = 0;
  this.stat_desc = stat_desc;
}
var d_code = (dist) => {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
};
var put_short = (s, w) => {
  s.pending_buf[s.pending++] = w & 255;
  s.pending_buf[s.pending++] = w >>> 8 & 255;
};
var send_bits = (s, value, length) => {
  if (s.bi_valid > Buf_size - length) {
    s.bi_buf |= value << s.bi_valid & 65535;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> Buf_size - s.bi_valid;
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= value << s.bi_valid & 65535;
    s.bi_valid += length;
  }
};
var send_code = (s, c, tree) => {
  send_bits(
    s,
    tree[c * 2],
    tree[c * 2 + 1]
    /*.Len*/
  );
};
var bi_reverse = (code, len) => {
  let res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
};
var bi_flush = (s) => {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;
  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 255;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
};
var gen_bitlen = (s, desc) => {
  const tree = desc.dyn_tree;
  const max_code = desc.max_code;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const extra = desc.stat_desc.extra_bits;
  const base = desc.stat_desc.extra_base;
  const max_length = desc.stat_desc.max_length;
  let h;
  let n, m;
  let bits;
  let xbits;
  let f;
  let overflow = 0;
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    s.bl_count[bits] = 0;
  }
  tree[s.heap[s.heap_max] * 2 + 1] = 0;
  for (h = s.heap_max + 1; h < HEAP_SIZE$1; h++) {
    n = s.heap[h];
    bits = tree[tree[n * 2 + 1] * 2 + 1] + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n * 2 + 1] = bits;
    if (n > max_code) {
      continue;
    }
    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n - base];
    }
    f = tree[n * 2];
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n * 2 + 1] + xbits);
    }
  }
  if (overflow === 0) {
    return;
  }
  do {
    bits = max_length - 1;
    while (s.bl_count[bits] === 0) {
      bits--;
    }
    s.bl_count[bits]--;
    s.bl_count[bits + 1] += 2;
    s.bl_count[max_length]--;
    overflow -= 2;
  } while (overflow > 0);
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) {
        continue;
      }
      if (tree[m * 2 + 1] !== bits) {
        s.opt_len += (bits - tree[m * 2 + 1]) * tree[m * 2];
        tree[m * 2 + 1] = bits;
      }
      n--;
    }
  }
};
var gen_codes = (tree, max_code, bl_count) => {
  const next_code = new Array(MAX_BITS$1 + 1);
  let code = 0;
  let bits;
  let n;
  for (bits = 1; bits <= MAX_BITS$1; bits++) {
    code = code + bl_count[bits - 1] << 1;
    next_code[bits] = code;
  }
  for (n = 0; n <= max_code; n++) {
    let len = tree[n * 2 + 1];
    if (len === 0) {
      continue;
    }
    tree[n * 2] = bi_reverse(next_code[len]++, len);
  }
};
var tr_static_init = () => {
  let n;
  let bits;
  let length;
  let code;
  let dist;
  const bl_count = new Array(MAX_BITS$1 + 1);
  length = 0;
  for (code = 0; code < LENGTH_CODES$1 - 1; code++) {
    base_length[code] = length;
    for (n = 0; n < 1 << extra_lbits[code]; n++) {
      _length_code[length++] = code;
    }
  }
  _length_code[length - 1] = code;
  dist = 0;
  for (code = 0; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < 1 << extra_dbits[code]; n++) {
      _dist_code[dist++] = code;
    }
  }
  dist >>= 7;
  for (; code < D_CODES$1; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < 1 << extra_dbits[code] - 7; n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  for (bits = 0; bits <= MAX_BITS$1; bits++) {
    bl_count[bits] = 0;
  }
  n = 0;
  while (n <= 143) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n * 2 + 1] = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n * 2 + 1] = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n * 2 + 1] = 8;
    n++;
    bl_count[8]++;
  }
  gen_codes(static_ltree, L_CODES$1 + 1, bl_count);
  for (n = 0; n < D_CODES$1; n++) {
    static_dtree[n * 2 + 1] = 5;
    static_dtree[n * 2] = bi_reverse(n, 5);
  }
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS$1 + 1, L_CODES$1, MAX_BITS$1);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0, D_CODES$1, MAX_BITS$1);
  static_bl_desc = new StaticTreeDesc(new Array(0), extra_blbits, 0, BL_CODES$1, MAX_BL_BITS);
};
var init_block = (s) => {
  let n;
  for (n = 0; n < L_CODES$1; n++) {
    s.dyn_ltree[n * 2] = 0;
  }
  for (n = 0; n < D_CODES$1; n++) {
    s.dyn_dtree[n * 2] = 0;
  }
  for (n = 0; n < BL_CODES$1; n++) {
    s.bl_tree[n * 2] = 0;
  }
  s.dyn_ltree[END_BLOCK * 2] = 1;
  s.opt_len = s.static_len = 0;
  s.sym_next = s.matches = 0;
};
var bi_windup = (s) => {
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
};
var smaller = (tree, n, m, depth) => {
  const _n2 = n * 2;
  const _m2 = m * 2;
  return tree[_n2] < tree[_m2] || tree[_n2] === tree[_m2] && depth[n] <= depth[m];
};
var pqdownheap = (s, tree, k) => {
  const v = s.heap[k];
  let j = k << 1;
  while (j <= s.heap_len) {
    if (j < s.heap_len && smaller(tree, s.heap[j + 1], s.heap[j], s.depth)) {
      j++;
    }
    if (smaller(tree, v, s.heap[j], s.depth)) {
      break;
    }
    s.heap[k] = s.heap[j];
    k = j;
    j <<= 1;
  }
  s.heap[k] = v;
};
var compress_block = (s, ltree, dtree) => {
  let dist;
  let lc;
  let sx = 0;
  let code;
  let extra;
  if (s.sym_next !== 0) {
    do {
      dist = s.pending_buf[s.sym_buf + sx++] & 255;
      dist += (s.pending_buf[s.sym_buf + sx++] & 255) << 8;
      lc = s.pending_buf[s.sym_buf + sx++];
      if (dist === 0) {
        send_code(s, lc, ltree);
      } else {
        code = _length_code[lc];
        send_code(s, code + LITERALS$1 + 1, ltree);
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);
        }
        dist--;
        code = d_code(dist);
        send_code(s, code, dtree);
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);
        }
      }
    } while (sx < s.sym_next);
  }
  send_code(s, END_BLOCK, ltree);
};
var build_tree = (s, desc) => {
  const tree = desc.dyn_tree;
  const stree = desc.stat_desc.static_tree;
  const has_stree = desc.stat_desc.has_stree;
  const elems = desc.stat_desc.elems;
  let n, m;
  let max_code = -1;
  let node;
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE$1;
  for (n = 0; n < elems; n++) {
    if (tree[n * 2] !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;
    } else {
      tree[n * 2 + 1] = 0;
    }
  }
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = max_code < 2 ? ++max_code : 0;
    tree[node * 2] = 1;
    s.depth[node] = 0;
    s.opt_len--;
    if (has_stree) {
      s.static_len -= stree[node * 2 + 1];
    }
  }
  desc.max_code = max_code;
  for (n = s.heap_len >> 1; n >= 1; n--) {
    pqdownheap(s, tree, n);
  }
  node = elems;
  do {
    n = s.heap[
      1
      /*SMALLEST*/
    ];
    s.heap[
      1
      /*SMALLEST*/
    ] = s.heap[s.heap_len--];
    pqdownheap(
      s,
      tree,
      1
      /*SMALLEST*/
    );
    m = s.heap[
      1
      /*SMALLEST*/
    ];
    s.heap[--s.heap_max] = n;
    s.heap[--s.heap_max] = m;
    tree[node * 2] = tree[n * 2] + tree[m * 2];
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n * 2 + 1] = tree[m * 2 + 1] = node;
    s.heap[
      1
      /*SMALLEST*/
    ] = node++;
    pqdownheap(
      s,
      tree,
      1
      /*SMALLEST*/
    );
  } while (s.heap_len >= 2);
  s.heap[--s.heap_max] = s.heap[
    1
    /*SMALLEST*/
  ];
  gen_bitlen(s, desc);
  gen_codes(tree, max_code, s.bl_count);
};
var scan_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code + 1) * 2 + 1] = 65535;
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      s.bl_tree[curlen * 2] += count;
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        s.bl_tree[curlen * 2]++;
      }
      s.bl_tree[REP_3_6 * 2]++;
    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10 * 2]++;
    } else {
      s.bl_tree[REPZ_11_138 * 2]++;
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var send_tree = (s, tree, max_code) => {
  let n;
  let prevlen = -1;
  let curlen;
  let nextlen = tree[0 * 2 + 1];
  let count = 0;
  let max_count = 7;
  let min_count = 4;
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n + 1) * 2 + 1];
    if (++count < max_count && curlen === nextlen) {
      continue;
    } else if (count < min_count) {
      do {
        send_code(s, curlen, s.bl_tree);
      } while (--count !== 0);
    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count - 3, 2);
    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count - 3, 3);
    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count - 11, 7);
    }
    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;
    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;
    } else {
      max_count = 7;
      min_count = 4;
    }
  }
};
var build_bl_tree = (s) => {
  let max_blindex;
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);
  build_tree(s, s.bl_desc);
  for (max_blindex = BL_CODES$1 - 1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex] * 2 + 1] !== 0) {
      break;
    }
  }
  s.opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
  return max_blindex;
};
var send_all_trees = (s, lcodes, dcodes, blcodes) => {
  let rank2;
  send_bits(s, lcodes - 257, 5);
  send_bits(s, dcodes - 1, 5);
  send_bits(s, blcodes - 4, 4);
  for (rank2 = 0; rank2 < blcodes; rank2++) {
    send_bits(s, s.bl_tree[bl_order[rank2] * 2 + 1], 3);
  }
  send_tree(s, s.dyn_ltree, lcodes - 1);
  send_tree(s, s.dyn_dtree, dcodes - 1);
};
var detect_data_type = (s) => {
  let block_mask = 4093624447;
  let n;
  for (n = 0; n <= 31; n++, block_mask >>>= 1) {
    if (block_mask & 1 && s.dyn_ltree[n * 2] !== 0) {
      return Z_BINARY;
    }
  }
  if (s.dyn_ltree[9 * 2] !== 0 || s.dyn_ltree[10 * 2] !== 0 || s.dyn_ltree[13 * 2] !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS$1; n++) {
    if (s.dyn_ltree[n * 2] !== 0) {
      return Z_TEXT;
    }
  }
  return Z_BINARY;
};
var static_init_done = false;
var _tr_init$1 = (s) => {
  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }
  s.l_desc = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);
  s.bi_buf = 0;
  s.bi_valid = 0;
  init_block(s);
};
var _tr_stored_block$1 = (s, buf, stored_len, last) => {
  send_bits(s, (STORED_BLOCK << 1) + (last ? 1 : 0), 3);
  bi_windup(s);
  put_short(s, stored_len);
  put_short(s, ~stored_len);
  if (stored_len) {
    s.pending_buf.set(s.window.subarray(buf, buf + stored_len), s.pending);
  }
  s.pending += stored_len;
};
var _tr_align$1 = (s) => {
  send_bits(s, STATIC_TREES << 1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
};
var _tr_flush_block$1 = (s, buf, stored_len, last) => {
  let opt_lenb, static_lenb;
  let max_blindex = 0;
  if (s.level > 0) {
    if (s.strm.data_type === Z_UNKNOWN$1) {
      s.strm.data_type = detect_data_type(s);
    }
    build_tree(s, s.l_desc);
    build_tree(s, s.d_desc);
    max_blindex = build_bl_tree(s);
    opt_lenb = s.opt_len + 3 + 7 >>> 3;
    static_lenb = s.static_len + 3 + 7 >>> 3;
    if (static_lenb <= opt_lenb) {
      opt_lenb = static_lenb;
    }
  } else {
    opt_lenb = static_lenb = stored_len + 5;
  }
  if (stored_len + 4 <= opt_lenb && buf !== -1) {
    _tr_stored_block$1(s, buf, stored_len, last);
  } else if (s.strategy === Z_FIXED$1 || static_lenb === opt_lenb) {
    send_bits(s, (STATIC_TREES << 1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);
  } else {
    send_bits(s, (DYN_TREES << 1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code + 1, s.d_desc.max_code + 1, max_blindex + 1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  init_block(s);
  if (last) {
    bi_windup(s);
  }
};
var _tr_tally$1 = (s, dist, lc) => {
  s.pending_buf[s.sym_buf + s.sym_next++] = dist;
  s.pending_buf[s.sym_buf + s.sym_next++] = dist >> 8;
  s.pending_buf[s.sym_buf + s.sym_next++] = lc;
  if (dist === 0) {
    s.dyn_ltree[lc * 2]++;
  } else {
    s.matches++;
    dist--;
    s.dyn_ltree[(_length_code[lc] + LITERALS$1 + 1) * 2]++;
    s.dyn_dtree[d_code(dist) * 2]++;
  }
  return s.sym_next === s.sym_end;
};
var _tr_init_1 = _tr_init$1;
var _tr_stored_block_1 = _tr_stored_block$1;
var _tr_flush_block_1 = _tr_flush_block$1;
var _tr_tally_1 = _tr_tally$1;
var _tr_align_1 = _tr_align$1;
var trees = {
  _tr_init: _tr_init_1,
  _tr_stored_block: _tr_stored_block_1,
  _tr_flush_block: _tr_flush_block_1,
  _tr_tally: _tr_tally_1,
  _tr_align: _tr_align_1
};
var adler32 = (adler, buf, len, pos) => {
  let s1 = adler & 65535 | 0, s2 = adler >>> 16 & 65535 | 0, n = 0;
  while (len !== 0) {
    n = len > 2e3 ? 2e3 : len;
    len -= n;
    do {
      s1 = s1 + buf[pos++] | 0;
      s2 = s2 + s1 | 0;
    } while (--n);
    s1 %= 65521;
    s2 %= 65521;
  }
  return s1 | s2 << 16 | 0;
};
var adler32_1 = adler32;
var makeTable = () => {
  let c, table = [];
  for (var n = 0; n < 256; n++) {
    c = n;
    for (var k = 0; k < 8; k++) {
      c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
    }
    table[n] = c;
  }
  return table;
};
var crcTable = new Uint32Array(makeTable());
var crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;
  crc ^= -1;
  for (let i = pos; i < end; i++) {
    crc = crc >>> 8 ^ t[(crc ^ buf[i]) & 255];
  }
  return crc ^ -1;
};
var crc32_1 = crc32;
var messages = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
};
var constants$2 = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  //Z_VERSION_ERROR: -6,
  /* compression levels */
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY: 0,
  Z_TEXT: 1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN: 2,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
var { _tr_init, _tr_stored_block, _tr_flush_block, _tr_tally, _tr_align } = trees;
var {
  Z_NO_FLUSH: Z_NO_FLUSH$2,
  Z_PARTIAL_FLUSH,
  Z_FULL_FLUSH: Z_FULL_FLUSH$1,
  Z_FINISH: Z_FINISH$3,
  Z_BLOCK: Z_BLOCK$1,
  Z_OK: Z_OK$3,
  Z_STREAM_END: Z_STREAM_END$3,
  Z_STREAM_ERROR: Z_STREAM_ERROR$2,
  Z_DATA_ERROR: Z_DATA_ERROR$2,
  Z_BUF_ERROR: Z_BUF_ERROR$1,
  Z_DEFAULT_COMPRESSION: Z_DEFAULT_COMPRESSION$1,
  Z_FILTERED,
  Z_HUFFMAN_ONLY,
  Z_RLE,
  Z_FIXED,
  Z_DEFAULT_STRATEGY: Z_DEFAULT_STRATEGY$1,
  Z_UNKNOWN,
  Z_DEFLATED: Z_DEFLATED$2
} = constants$2;
var MAX_MEM_LEVEL = 9;
var MAX_WBITS$1 = 15;
var DEF_MEM_LEVEL = 8;
var LENGTH_CODES = 29;
var LITERALS = 256;
var L_CODES = LITERALS + 1 + LENGTH_CODES;
var D_CODES = 30;
var BL_CODES = 19;
var HEAP_SIZE = 2 * L_CODES + 1;
var MAX_BITS = 15;
var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1;
var PRESET_DICT = 32;
var INIT_STATE = 42;
var GZIP_STATE = 57;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;
var BS_NEED_MORE = 1;
var BS_BLOCK_DONE = 2;
var BS_FINISH_STARTED = 3;
var BS_FINISH_DONE = 4;
var OS_CODE = 3;
var err = (strm, errorCode) => {
  strm.msg = messages[errorCode];
  return errorCode;
};
var rank = (f) => {
  return f * 2 - (f > 4 ? 9 : 0);
};
var zero = (buf) => {
  let len = buf.length;
  while (--len >= 0) {
    buf[len] = 0;
  }
};
var slide_hash = (s) => {
  let n, m;
  let p;
  let wsize = s.w_size;
  n = s.hash_size;
  p = n;
  do {
    m = s.head[--p];
    s.head[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
  n = wsize;
  p = n;
  do {
    m = s.prev[--p];
    s.prev[p] = m >= wsize ? m - wsize : 0;
  } while (--n);
};
var HASH_ZLIB = (s, prev, data) => (prev << s.hash_shift ^ data) & s.hash_mask;
var HASH = HASH_ZLIB;
var flush_pending = (strm) => {
  const s = strm.state;
  let len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) {
    return;
  }
  strm.output.set(s.pending_buf.subarray(s.pending_out, s.pending_out + len), strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
};
var flush_block_only = (s, last) => {
  _tr_flush_block(s, s.block_start >= 0 ? s.block_start : -1, s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
};
var put_byte = (s, b) => {
  s.pending_buf[s.pending++] = b;
};
var putShortMSB = (s, b) => {
  s.pending_buf[s.pending++] = b >>> 8 & 255;
  s.pending_buf[s.pending++] = b & 255;
};
var read_buf = (strm, buf, start, size) => {
  let len = strm.avail_in;
  if (len > size) {
    len = size;
  }
  if (len === 0) {
    return 0;
  }
  strm.avail_in -= len;
  buf.set(strm.input.subarray(strm.next_in, strm.next_in + len), start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32_1(strm.adler, buf, len, start);
  } else if (strm.state.wrap === 2) {
    strm.adler = crc32_1(strm.adler, buf, len, start);
  }
  strm.next_in += len;
  strm.total_in += len;
  return len;
};
var longest_match = (s, cur_match) => {
  let chain_length = s.max_chain_length;
  let scan = s.strstart;
  let match;
  let len;
  let best_len = s.prev_length;
  let nice_match = s.nice_match;
  const limit = s.strstart > s.w_size - MIN_LOOKAHEAD ? s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0;
  const _win = s.window;
  const wmask = s.w_mask;
  const prev = s.prev;
  const strend = s.strstart + MAX_MATCH;
  let scan_end1 = _win[scan + best_len - 1];
  let scan_end = _win[scan + best_len];
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  if (nice_match > s.lookahead) {
    nice_match = s.lookahead;
  }
  do {
    match = cur_match;
    if (_win[match + best_len] !== scan_end || _win[match + best_len - 1] !== scan_end1 || _win[match] !== _win[scan] || _win[++match] !== _win[scan + 1]) {
      continue;
    }
    scan += 2;
    match++;
    do {
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && _win[++scan] === _win[++match] && scan < strend);
    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;
    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1 = _win[scan + best_len - 1];
      scan_end = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);
  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
};
var fill_window = (s) => {
  const _w_size = s.w_size;
  let n, more, str;
  do {
    more = s.window_size - s.lookahead - s.strstart;
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {
      s.window.set(s.window.subarray(_w_size, _w_size + _w_size - more), 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      s.block_start -= _w_size;
      if (s.insert > s.strstart) {
        s.insert = s.strstart;
      }
      slide_hash(s);
      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];
      s.ins_h = HASH(s, s.ins_h, s.window[str + 1]);
      while (s.insert) {
        s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);
};
var deflate_stored = (s, flush) => {
  let min_block = s.pending_buf_size - 5 > s.w_size ? s.w_size : s.pending_buf_size - 5;
  let len, left, have, last = 0;
  let used = s.strm.avail_in;
  do {
    len = 65535;
    have = s.bi_valid + 42 >> 3;
    if (s.strm.avail_out < have) {
      break;
    }
    have = s.strm.avail_out - have;
    left = s.strstart - s.block_start;
    if (len > left + s.strm.avail_in) {
      len = left + s.strm.avail_in;
    }
    if (len > have) {
      len = have;
    }
    if (len < min_block && (len === 0 && flush !== Z_FINISH$3 || flush === Z_NO_FLUSH$2 || len !== left + s.strm.avail_in)) {
      break;
    }
    last = flush === Z_FINISH$3 && len === left + s.strm.avail_in ? 1 : 0;
    _tr_stored_block(s, 0, 0, last);
    s.pending_buf[s.pending - 4] = len;
    s.pending_buf[s.pending - 3] = len >> 8;
    s.pending_buf[s.pending - 2] = ~len;
    s.pending_buf[s.pending - 1] = ~len >> 8;
    flush_pending(s.strm);
    if (left) {
      if (left > len) {
        left = len;
      }
      s.strm.output.set(s.window.subarray(s.block_start, s.block_start + left), s.strm.next_out);
      s.strm.next_out += left;
      s.strm.avail_out -= left;
      s.strm.total_out += left;
      s.block_start += left;
      len -= left;
    }
    if (len) {
      read_buf(s.strm, s.strm.output, s.strm.next_out, len);
      s.strm.next_out += len;
      s.strm.avail_out -= len;
      s.strm.total_out += len;
    }
  } while (last === 0);
  used -= s.strm.avail_in;
  if (used) {
    if (used >= s.w_size) {
      s.matches = 2;
      s.window.set(s.strm.input.subarray(s.strm.next_in - s.w_size, s.strm.next_in), 0);
      s.strstart = s.w_size;
      s.insert = s.strstart;
    } else {
      if (s.window_size - s.strstart <= used) {
        s.strstart -= s.w_size;
        s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
        if (s.matches < 2) {
          s.matches++;
        }
        if (s.insert > s.strstart) {
          s.insert = s.strstart;
        }
      }
      s.window.set(s.strm.input.subarray(s.strm.next_in - used, s.strm.next_in), s.strstart);
      s.strstart += used;
      s.insert += used > s.w_size - s.insert ? s.w_size - s.insert : used;
    }
    s.block_start = s.strstart;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }
  if (last) {
    return BS_FINISH_DONE;
  }
  if (flush !== Z_NO_FLUSH$2 && flush !== Z_FINISH$3 && s.strm.avail_in === 0 && s.strstart === s.block_start) {
    return BS_BLOCK_DONE;
  }
  have = s.window_size - s.strstart;
  if (s.strm.avail_in > have && s.block_start >= s.w_size) {
    s.block_start -= s.w_size;
    s.strstart -= s.w_size;
    s.window.set(s.window.subarray(s.w_size, s.w_size + s.strstart), 0);
    if (s.matches < 2) {
      s.matches++;
    }
    have += s.w_size;
    if (s.insert > s.strstart) {
      s.insert = s.strstart;
    }
  }
  if (have > s.strm.avail_in) {
    have = s.strm.avail_in;
  }
  if (have) {
    read_buf(s.strm, s.window, s.strstart, have);
    s.strstart += have;
    s.insert += have > s.w_size - s.insert ? s.w_size - s.insert : have;
  }
  if (s.high_water < s.strstart) {
    s.high_water = s.strstart;
  }
  have = s.bi_valid + 42 >> 3;
  have = s.pending_buf_size - have > 65535 ? 65535 : s.pending_buf_size - have;
  min_block = have > s.w_size ? s.w_size : have;
  left = s.strstart - s.block_start;
  if (left >= min_block || (left || flush === Z_FINISH$3) && flush !== Z_NO_FLUSH$2 && s.strm.avail_in === 0 && left <= have) {
    len = left > have ? have : left;
    last = flush === Z_FINISH$3 && s.strm.avail_in === 0 && len === left ? 1 : 0;
    _tr_stored_block(s, s.block_start, len, last);
    s.block_start += len;
    flush_pending(s.strm);
  }
  return last ? BS_FINISH_STARTED : BS_NEED_MORE;
};
var deflate_fast = (s, flush) => {
  let hash_head;
  let bflush;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    if (hash_head !== 0 && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      if (s.match_length <= s.max_lazy_match && s.lookahead >= MIN_MATCH) {
        s.match_length--;
        do {
          s.strstart++;
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        } while (--s.match_length !== 0);
        s.strstart++;
      } else {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + 1]);
      }
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_slow = (s, flush) => {
  let hash_head;
  let bflush;
  let max_insert;
  for (; ; ) {
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    hash_head = 0;
    if (s.lookahead >= MIN_MATCH) {
      s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
    }
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH - 1;
    if (hash_head !== 0 && s.prev_length < s.max_lazy_match && s.strstart - hash_head <= s.w_size - MIN_LOOKAHEAD) {
      s.match_length = longest_match(s, hash_head);
      if (s.match_length <= 5 && (s.strategy === Z_FILTERED || s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096)) {
        s.match_length = MIN_MATCH - 1;
      }
    }
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      bflush = _tr_tally(s, s.strstart - 1 - s.prev_match, s.prev_length - MIN_MATCH);
      s.lookahead -= s.prev_length - 1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          s.ins_h = HASH(s, s.ins_h, s.window[s.strstart + MIN_MATCH - 1]);
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH - 1;
      s.strstart++;
      if (bflush) {
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
      }
    } else if (s.match_available) {
      bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
      if (bflush) {
        flush_block_only(s, false);
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  if (s.match_available) {
    bflush = _tr_tally(s, 0, s.window[s.strstart - 1]);
    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH - 1 ? s.strstart : MIN_MATCH - 1;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_rle = (s, flush) => {
  let bflush;
  let prev;
  let scan, strend;
  const _win = s.window;
  for (; ; ) {
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH$2) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break;
      }
    }
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
        } while (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan] && scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
    }
    if (s.match_length >= MIN_MATCH) {
      bflush = _tr_tally(s, 1, s.match_length - MIN_MATCH);
      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      bflush = _tr_tally(s, 0, s.window[s.strstart]);
      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
var deflate_huff = (s, flush) => {
  let bflush;
  for (; ; ) {
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH$2) {
          return BS_NEED_MORE;
        }
        break;
      }
    }
    s.match_length = 0;
    bflush = _tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH$3) {
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    return BS_FINISH_DONE;
  }
  if (s.sym_next) {
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
  }
  return BS_BLOCK_DONE;
};
function Config(good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}
var configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),
  /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),
  /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),
  /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),
  /* 3 */
  new Config(4, 4, 16, 16, deflate_slow),
  /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),
  /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),
  /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),
  /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),
  /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)
  /* 9 max compression */
];
var lm_init = (s) => {
  s.window_size = 2 * s.w_size;
  zero(s.head);
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;
  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
};
function DeflateState() {
  this.strm = null;
  this.status = 0;
  this.pending_buf = null;
  this.pending_buf_size = 0;
  this.pending_out = 0;
  this.pending = 0;
  this.wrap = 0;
  this.gzhead = null;
  this.gzindex = 0;
  this.method = Z_DEFLATED$2;
  this.last_flush = -1;
  this.w_size = 0;
  this.w_bits = 0;
  this.w_mask = 0;
  this.window = null;
  this.window_size = 0;
  this.prev = null;
  this.head = null;
  this.ins_h = 0;
  this.hash_size = 0;
  this.hash_bits = 0;
  this.hash_mask = 0;
  this.hash_shift = 0;
  this.block_start = 0;
  this.match_length = 0;
  this.prev_match = 0;
  this.match_available = 0;
  this.strstart = 0;
  this.match_start = 0;
  this.lookahead = 0;
  this.prev_length = 0;
  this.max_chain_length = 0;
  this.max_lazy_match = 0;
  this.level = 0;
  this.strategy = 0;
  this.good_match = 0;
  this.nice_match = 0;
  this.dyn_ltree = new Uint16Array(HEAP_SIZE * 2);
  this.dyn_dtree = new Uint16Array((2 * D_CODES + 1) * 2);
  this.bl_tree = new Uint16Array((2 * BL_CODES + 1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);
  this.l_desc = null;
  this.d_desc = null;
  this.bl_desc = null;
  this.bl_count = new Uint16Array(MAX_BITS + 1);
  this.heap = new Uint16Array(2 * L_CODES + 1);
  zero(this.heap);
  this.heap_len = 0;
  this.heap_max = 0;
  this.depth = new Uint16Array(2 * L_CODES + 1);
  zero(this.depth);
  this.sym_buf = 0;
  this.lit_bufsize = 0;
  this.sym_next = 0;
  this.sym_end = 0;
  this.opt_len = 0;
  this.static_len = 0;
  this.matches = 0;
  this.insert = 0;
  this.bi_buf = 0;
  this.bi_valid = 0;
}
var deflateStateCheck = (strm) => {
  if (!strm) {
    return 1;
  }
  const s = strm.state;
  if (!s || s.strm !== strm || s.status !== INIT_STATE && //#ifdef GZIP
  s.status !== GZIP_STATE && //#endif
  s.status !== EXTRA_STATE && s.status !== NAME_STATE && s.status !== COMMENT_STATE && s.status !== HCRC_STATE && s.status !== BUSY_STATE && s.status !== FINISH_STATE) {
    return 1;
  }
  return 0;
};
var deflateResetKeep = (strm) => {
  if (deflateStateCheck(strm)) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;
  const s = strm.state;
  s.pending = 0;
  s.pending_out = 0;
  if (s.wrap < 0) {
    s.wrap = -s.wrap;
  }
  s.status = //#ifdef GZIP
  s.wrap === 2 ? GZIP_STATE : (
    //#endif
    s.wrap ? INIT_STATE : BUSY_STATE
  );
  strm.adler = s.wrap === 2 ? 0 : 1;
  s.last_flush = -2;
  _tr_init(s);
  return Z_OK$3;
};
var deflateReset = (strm) => {
  const ret = deflateResetKeep(strm);
  if (ret === Z_OK$3) {
    lm_init(strm.state);
  }
  return ret;
};
var deflateSetHeader = (strm, head) => {
  if (deflateStateCheck(strm) || strm.state.wrap !== 2) {
    return Z_STREAM_ERROR$2;
  }
  strm.state.gzhead = head;
  return Z_OK$3;
};
var deflateInit2 = (strm, level, method, windowBits, memLevel, strategy) => {
  if (!strm) {
    return Z_STREAM_ERROR$2;
  }
  let wrap = 1;
  if (level === Z_DEFAULT_COMPRESSION$1) {
    level = 6;
  }
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else if (windowBits > 15) {
    wrap = 2;
    windowBits -= 16;
  }
  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED$2 || windowBits < 8 || windowBits > 15 || level < 0 || level > 9 || strategy < 0 || strategy > Z_FIXED || windowBits === 8 && wrap !== 1) {
    return err(strm, Z_STREAM_ERROR$2);
  }
  if (windowBits === 8) {
    windowBits = 9;
  }
  const s = new DeflateState();
  strm.state = s;
  s.strm = strm;
  s.status = INIT_STATE;
  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;
  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);
  s.window = new Uint8Array(s.w_size * 2);
  s.head = new Uint16Array(s.hash_size);
  s.prev = new Uint16Array(s.w_size);
  s.lit_bufsize = 1 << memLevel + 6;
  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new Uint8Array(s.pending_buf_size);
  s.sym_buf = s.lit_bufsize;
  s.sym_end = (s.lit_bufsize - 1) * 3;
  s.level = level;
  s.strategy = strategy;
  s.method = method;
  return deflateReset(strm);
};
var deflateInit = (strm, level) => {
  return deflateInit2(strm, level, Z_DEFLATED$2, MAX_WBITS$1, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY$1);
};
var deflate$2 = (strm, flush) => {
  if (deflateStateCheck(strm) || flush > Z_BLOCK$1 || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR$2) : Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  if (!strm.output || strm.avail_in !== 0 && !strm.input || s.status === FINISH_STATE && flush !== Z_FINISH$3) {
    return err(strm, strm.avail_out === 0 ? Z_BUF_ERROR$1 : Z_STREAM_ERROR$2);
  }
  const old_flush = s.last_flush;
  s.last_flush = flush;
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) && flush !== Z_FINISH$3) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR$1);
  }
  if (s.status === INIT_STATE && s.wrap === 0) {
    s.status = BUSY_STATE;
  }
  if (s.status === INIT_STATE) {
    let header = Z_DEFLATED$2 + (s.w_bits - 8 << 4) << 8;
    let level_flags = -1;
    if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
      level_flags = 0;
    } else if (s.level < 6) {
      level_flags = 1;
    } else if (s.level === 6) {
      level_flags = 2;
    } else {
      level_flags = 3;
    }
    header |= level_flags << 6;
    if (s.strstart !== 0) {
      header |= PRESET_DICT;
    }
    header += 31 - header % 31;
    putShortMSB(s, header);
    if (s.strstart !== 0) {
      putShortMSB(s, strm.adler >>> 16);
      putShortMSB(s, strm.adler & 65535);
    }
    strm.adler = 1;
    s.status = BUSY_STATE;
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
  if (s.status === GZIP_STATE) {
    strm.adler = 0;
    put_byte(s, 31);
    put_byte(s, 139);
    put_byte(s, 8);
    if (!s.gzhead) {
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, 0);
      put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
      put_byte(s, OS_CODE);
      s.status = BUSY_STATE;
      flush_pending(strm);
      if (s.pending !== 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    } else {
      put_byte(
        s,
        (s.gzhead.text ? 1 : 0) + (s.gzhead.hcrc ? 2 : 0) + (!s.gzhead.extra ? 0 : 4) + (!s.gzhead.name ? 0 : 8) + (!s.gzhead.comment ? 0 : 16)
      );
      put_byte(s, s.gzhead.time & 255);
      put_byte(s, s.gzhead.time >> 8 & 255);
      put_byte(s, s.gzhead.time >> 16 & 255);
      put_byte(s, s.gzhead.time >> 24 & 255);
      put_byte(s, s.level === 9 ? 2 : s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ? 4 : 0);
      put_byte(s, s.gzhead.os & 255);
      if (s.gzhead.extra && s.gzhead.extra.length) {
        put_byte(s, s.gzhead.extra.length & 255);
        put_byte(s, s.gzhead.extra.length >> 8 & 255);
      }
      if (s.gzhead.hcrc) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending, 0);
      }
      s.gzindex = 0;
      s.status = EXTRA_STATE;
    }
  }
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra) {
      let beg = s.pending;
      let left = (s.gzhead.extra.length & 65535) - s.gzindex;
      while (s.pending + left > s.pending_buf_size) {
        let copy = s.pending_buf_size - s.pending;
        s.pending_buf.set(s.gzhead.extra.subarray(s.gzindex, s.gzindex + copy), s.pending);
        s.pending = s.pending_buf_size;
        if (s.gzhead.hcrc && s.pending > beg) {
          strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
        }
        s.gzindex += copy;
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
        beg = 0;
        left -= copy;
      }
      let gzhead_extra = new Uint8Array(s.gzhead.extra);
      s.pending_buf.set(gzhead_extra.subarray(s.gzindex, s.gzindex + left), s.pending);
      s.pending += left;
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      s.gzindex = 0;
    }
    s.status = NAME_STATE;
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      s.gzindex = 0;
    }
    s.status = COMMENT_STATE;
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment) {
      let beg = s.pending;
      let val;
      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          if (s.pending !== 0) {
            s.last_flush = -1;
            return Z_OK$3;
          }
          beg = 0;
        }
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 255;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32_1(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
    }
    s.status = HCRC_STATE;
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
        if (s.pending !== 0) {
          s.last_flush = -1;
          return Z_OK$3;
        }
      }
      put_byte(s, strm.adler & 255);
      put_byte(s, strm.adler >> 8 & 255);
      strm.adler = 0;
    }
    s.status = BUSY_STATE;
    flush_pending(strm);
    if (s.pending !== 0) {
      s.last_flush = -1;
      return Z_OK$3;
    }
  }
  if (strm.avail_in !== 0 || s.lookahead !== 0 || flush !== Z_NO_FLUSH$2 && s.status !== FINISH_STATE) {
    let bstate = s.level === 0 ? deflate_stored(s, flush) : s.strategy === Z_HUFFMAN_ONLY ? deflate_huff(s, flush) : s.strategy === Z_RLE ? deflate_rle(s, flush) : configuration_table[s.level].func(s, flush);
    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
      }
      return Z_OK$3;
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        _tr_align(s);
      } else if (flush !== Z_BLOCK$1) {
        _tr_stored_block(s, 0, 0, false);
        if (flush === Z_FULL_FLUSH$1) {
          zero(s.head);
          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        return Z_OK$3;
      }
    }
  }
  if (flush !== Z_FINISH$3) {
    return Z_OK$3;
  }
  if (s.wrap <= 0) {
    return Z_STREAM_END$3;
  }
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 255);
    put_byte(s, strm.adler >> 8 & 255);
    put_byte(s, strm.adler >> 16 & 255);
    put_byte(s, strm.adler >> 24 & 255);
    put_byte(s, strm.total_in & 255);
    put_byte(s, strm.total_in >> 8 & 255);
    put_byte(s, strm.total_in >> 16 & 255);
    put_byte(s, strm.total_in >> 24 & 255);
  } else {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 65535);
  }
  flush_pending(strm);
  if (s.wrap > 0) {
    s.wrap = -s.wrap;
  }
  return s.pending !== 0 ? Z_OK$3 : Z_STREAM_END$3;
};
var deflateEnd = (strm) => {
  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }
  const status = strm.state.status;
  strm.state = null;
  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR$2) : Z_OK$3;
};
var deflateSetDictionary = (strm, dictionary) => {
  let dictLength = dictionary.length;
  if (deflateStateCheck(strm)) {
    return Z_STREAM_ERROR$2;
  }
  const s = strm.state;
  const wrap = s.wrap;
  if (wrap === 2 || wrap === 1 && s.status !== INIT_STATE || s.lookahead) {
    return Z_STREAM_ERROR$2;
  }
  if (wrap === 1) {
    strm.adler = adler32_1(strm.adler, dictionary, dictLength, 0);
  }
  s.wrap = 0;
  if (dictLength >= s.w_size) {
    if (wrap === 0) {
      zero(s.head);
      s.strstart = 0;
      s.block_start = 0;
      s.insert = 0;
    }
    let tmpDict = new Uint8Array(s.w_size);
    tmpDict.set(dictionary.subarray(dictLength - s.w_size, dictLength), 0);
    dictionary = tmpDict;
    dictLength = s.w_size;
  }
  const avail = strm.avail_in;
  const next = strm.next_in;
  const input = strm.input;
  strm.avail_in = dictLength;
  strm.next_in = 0;
  strm.input = dictionary;
  fill_window(s);
  while (s.lookahead >= MIN_MATCH) {
    let str = s.strstart;
    let n = s.lookahead - (MIN_MATCH - 1);
    do {
      s.ins_h = HASH(s, s.ins_h, s.window[str + MIN_MATCH - 1]);
      s.prev[str & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = str;
      str++;
    } while (--n);
    s.strstart = str;
    s.lookahead = MIN_MATCH - 1;
    fill_window(s);
  }
  s.strstart += s.lookahead;
  s.block_start = s.strstart;
  s.insert = s.lookahead;
  s.lookahead = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  strm.next_in = next;
  strm.input = input;
  strm.avail_in = avail;
  s.wrap = wrap;
  return Z_OK$3;
};
var deflateInit_1 = deflateInit;
var deflateInit2_1 = deflateInit2;
var deflateReset_1 = deflateReset;
var deflateResetKeep_1 = deflateResetKeep;
var deflateSetHeader_1 = deflateSetHeader;
var deflate_2$1 = deflate$2;
var deflateEnd_1 = deflateEnd;
var deflateSetDictionary_1 = deflateSetDictionary;
var deflateInfo = "pako deflate (from Nodeca project)";
var deflate_1$2 = {
  deflateInit: deflateInit_1,
  deflateInit2: deflateInit2_1,
  deflateReset: deflateReset_1,
  deflateResetKeep: deflateResetKeep_1,
  deflateSetHeader: deflateSetHeader_1,
  deflate: deflate_2$1,
  deflateEnd: deflateEnd_1,
  deflateSetDictionary: deflateSetDictionary_1,
  deflateInfo
};
var _has = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key);
};
var assign = function(obj) {
  const sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    const source = sources.shift();
    if (!source) {
      continue;
    }
    if (typeof source !== "object") {
      throw new TypeError(source + "must be non-object");
    }
    for (const p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }
  return obj;
};
var flattenChunks = (chunks) => {
  let len = 0;
  for (let i = 0, l = chunks.length; i < l; i++) {
    len += chunks[i].length;
  }
  const result = new Uint8Array(len);
  for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
    let chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
};
var common = {
  assign,
  flattenChunks
};
var STR_APPLY_UIA_OK = true;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch (__) {
  STR_APPLY_UIA_OK = false;
}
var _utf8len = new Uint8Array(256);
for (let q = 0; q < 256; q++) {
  _utf8len[q] = q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1;
}
_utf8len[254] = _utf8len[254] = 1;
var string2buf = (str) => {
  if (typeof TextEncoder === "function" && TextEncoder.prototype.encode) {
    return new TextEncoder().encode(str);
  }
  let buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    buf_len += c < 128 ? 1 : c < 2048 ? 2 : c < 65536 ? 3 : 4;
  }
  buf = new Uint8Array(buf_len);
  for (i = 0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 64512) === 55296 && m_pos + 1 < str_len) {
      c2 = str.charCodeAt(m_pos + 1);
      if ((c2 & 64512) === 56320) {
        c = 65536 + (c - 55296 << 10) + (c2 - 56320);
        m_pos++;
      }
    }
    if (c < 128) {
      buf[i++] = c;
    } else if (c < 2048) {
      buf[i++] = 192 | c >>> 6;
      buf[i++] = 128 | c & 63;
    } else if (c < 65536) {
      buf[i++] = 224 | c >>> 12;
      buf[i++] = 128 | c >>> 6 & 63;
      buf[i++] = 128 | c & 63;
    } else {
      buf[i++] = 240 | c >>> 18;
      buf[i++] = 128 | c >>> 12 & 63;
      buf[i++] = 128 | c >>> 6 & 63;
      buf[i++] = 128 | c & 63;
    }
  }
  return buf;
};
var buf2binstring = (buf, len) => {
  if (len < 65534) {
    if (buf.subarray && STR_APPLY_UIA_OK) {
      return String.fromCharCode.apply(null, buf.length === len ? buf : buf.subarray(0, len));
    }
  }
  let result = "";
  for (let i = 0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
};
var buf2string = (buf, max) => {
  const len = max || buf.length;
  if (typeof TextDecoder === "function" && TextDecoder.prototype.decode) {
    return new TextDecoder().decode(buf.subarray(0, max));
  }
  let i, out;
  const utf16buf = new Array(len * 2);
  for (out = 0, i = 0; i < len; ) {
    let c = buf[i++];
    if (c < 128) {
      utf16buf[out++] = c;
      continue;
    }
    let c_len = _utf8len[c];
    if (c_len > 4) {
      utf16buf[out++] = 65533;
      i += c_len - 1;
      continue;
    }
    c &= c_len === 2 ? 31 : c_len === 3 ? 15 : 7;
    while (c_len > 1 && i < len) {
      c = c << 6 | buf[i++] & 63;
      c_len--;
    }
    if (c_len > 1) {
      utf16buf[out++] = 65533;
      continue;
    }
    if (c < 65536) {
      utf16buf[out++] = c;
    } else {
      c -= 65536;
      utf16buf[out++] = 55296 | c >> 10 & 1023;
      utf16buf[out++] = 56320 | c & 1023;
    }
  }
  return buf2binstring(utf16buf, out);
};
var utf8border = (buf, max) => {
  max = max || buf.length;
  if (max > buf.length) {
    max = buf.length;
  }
  let pos = max - 1;
  while (pos >= 0 && (buf[pos] & 192) === 128) {
    pos--;
  }
  if (pos < 0) {
    return max;
  }
  if (pos === 0) {
    return max;
  }
  return pos + _utf8len[buf[pos]] > max ? pos : max;
};
var strings = {
  string2buf,
  buf2string,
  utf8border
};
function ZStream() {
  this.input = null;
  this.next_in = 0;
  this.avail_in = 0;
  this.total_in = 0;
  this.output = null;
  this.next_out = 0;
  this.avail_out = 0;
  this.total_out = 0;
  this.msg = "";
  this.state = null;
  this.data_type = 2;
  this.adler = 0;
}
var zstream = ZStream;
var toString$1 = Object.prototype.toString;
var {
  Z_NO_FLUSH: Z_NO_FLUSH$1,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH: Z_FINISH$2,
  Z_OK: Z_OK$2,
  Z_STREAM_END: Z_STREAM_END$2,
  Z_DEFAULT_COMPRESSION,
  Z_DEFAULT_STRATEGY,
  Z_DEFLATED: Z_DEFLATED$1
} = constants$2;
function Deflate$1(options) {
  this.options = common.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED$1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY
  }, options || {});
  let opt = this.options;
  if (opt.raw && opt.windowBits > 0) {
    opt.windowBits = -opt.windowBits;
  } else if (opt.gzip && opt.windowBits > 0 && opt.windowBits < 16) {
    opt.windowBits += 16;
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = deflate_1$2.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );
  if (status !== Z_OK$2) {
    throw new Error(messages[status]);
  }
  if (opt.header) {
    deflate_1$2.deflateSetHeader(this.strm, opt.header);
  }
  if (opt.dictionary) {
    let dict;
    if (typeof opt.dictionary === "string") {
      dict = strings.string2buf(opt.dictionary);
    } else if (toString$1.call(opt.dictionary) === "[object ArrayBuffer]") {
      dict = new Uint8Array(opt.dictionary);
    } else {
      dict = opt.dictionary;
    }
    status = deflate_1$2.deflateSetDictionary(this.strm, dict);
    if (status !== Z_OK$2) {
      throw new Error(messages[status]);
    }
    this._dict_set = true;
  }
}
Deflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  let status, _flush_mode;
  if (this.ended) {
    return false;
  }
  if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
  else _flush_mode = flush_mode === true ? Z_FINISH$2 : Z_NO_FLUSH$1;
  if (typeof data === "string") {
    strm.input = strings.string2buf(data);
  } else if (toString$1.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (; ; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    if ((_flush_mode === Z_SYNC_FLUSH || _flush_mode === Z_FULL_FLUSH) && strm.avail_out <= 6) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    status = deflate_1$2.deflate(strm, _flush_mode);
    if (status === Z_STREAM_END$2) {
      if (strm.next_out > 0) {
        this.onData(strm.output.subarray(0, strm.next_out));
      }
      status = deflate_1$2.deflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return status === Z_OK$2;
    }
    if (strm.avail_out === 0) {
      this.onData(strm.output);
      continue;
    }
    if (_flush_mode > 0 && strm.next_out > 0) {
      this.onData(strm.output.subarray(0, strm.next_out));
      strm.avail_out = 0;
      continue;
    }
    if (strm.avail_in === 0) break;
  }
  return true;
};
Deflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Deflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK$2) {
    this.result = common.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
function deflate$1(input, options) {
  const deflator = new Deflate$1(options);
  deflator.push(input, true);
  if (deflator.err) {
    throw deflator.msg || messages[deflator.err];
  }
  return deflator.result;
}
function deflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return deflate$1(input, options);
}
function gzip$1(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate$1(input, options);
}
var Deflate_1$1 = Deflate$1;
var deflate_2 = deflate$1;
var deflateRaw_1$1 = deflateRaw$1;
var gzip_1$1 = gzip$1;
var constants$1 = constants$2;
var deflate_1$1 = {
  Deflate: Deflate_1$1,
  deflate: deflate_2,
  deflateRaw: deflateRaw_1$1,
  gzip: gzip_1$1,
  constants: constants$1
};
var BAD$1 = 16209;
var TYPE$1 = 16191;
var inffast = function inflate_fast(strm, start) {
  let _in;
  let last;
  let _out;
  let beg;
  let end;
  let dmax;
  let wsize;
  let whave;
  let wnext;
  let s_window;
  let hold;
  let bits;
  let lcode;
  let dcode;
  let lmask;
  let dmask;
  let here;
  let op;
  let len;
  let dist;
  let from;
  let from_source;
  let input, output;
  const state = strm.state;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
  dmax = state.dmax;
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;
  top:
    do {
      if (bits < 15) {
        hold += input[_in++] << bits;
        bits += 8;
        hold += input[_in++] << bits;
        bits += 8;
      }
      here = lcode[hold & lmask];
      dolen:
        for (; ; ) {
          op = here >>> 24;
          hold >>>= op;
          bits -= op;
          op = here >>> 16 & 255;
          if (op === 0) {
            output[_out++] = here & 65535;
          } else if (op & 16) {
            len = here & 65535;
            op &= 15;
            if (op) {
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
              len += hold & (1 << op) - 1;
              hold >>>= op;
              bits -= op;
            }
            if (bits < 15) {
              hold += input[_in++] << bits;
              bits += 8;
              hold += input[_in++] << bits;
              bits += 8;
            }
            here = dcode[hold & dmask];
            dodist:
              for (; ; ) {
                op = here >>> 24;
                hold >>>= op;
                bits -= op;
                op = here >>> 16 & 255;
                if (op & 16) {
                  dist = here & 65535;
                  op &= 15;
                  if (bits < op) {
                    hold += input[_in++] << bits;
                    bits += 8;
                    if (bits < op) {
                      hold += input[_in++] << bits;
                      bits += 8;
                    }
                  }
                  dist += hold & (1 << op) - 1;
                  if (dist > dmax) {
                    strm.msg = "invalid distance too far back";
                    state.mode = BAD$1;
                    break top;
                  }
                  hold >>>= op;
                  bits -= op;
                  op = _out - beg;
                  if (dist > op) {
                    op = dist - op;
                    if (op > whave) {
                      if (state.sane) {
                        strm.msg = "invalid distance too far back";
                        state.mode = BAD$1;
                        break top;
                      }
                    }
                    from = 0;
                    from_source = s_window;
                    if (wnext === 0) {
                      from += wsize - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    } else if (wnext < op) {
                      from += wsize + wnext - op;
                      op -= wnext;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = 0;
                        if (wnext < len) {
                          op = wnext;
                          len -= op;
                          do {
                            output[_out++] = s_window[from++];
                          } while (--op);
                          from = _out - dist;
                          from_source = output;
                        }
                      }
                    } else {
                      from += wnext - op;
                      if (op < len) {
                        len -= op;
                        do {
                          output[_out++] = s_window[from++];
                        } while (--op);
                        from = _out - dist;
                        from_source = output;
                      }
                    }
                    while (len > 2) {
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      output[_out++] = from_source[from++];
                      len -= 3;
                    }
                    if (len) {
                      output[_out++] = from_source[from++];
                      if (len > 1) {
                        output[_out++] = from_source[from++];
                      }
                    }
                  } else {
                    from = _out - dist;
                    do {
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      output[_out++] = output[from++];
                      len -= 3;
                    } while (len > 2);
                    if (len) {
                      output[_out++] = output[from++];
                      if (len > 1) {
                        output[_out++] = output[from++];
                      }
                    }
                  }
                } else if ((op & 64) === 0) {
                  here = dcode[(here & 65535) + (hold & (1 << op) - 1)];
                  continue dodist;
                } else {
                  strm.msg = "invalid distance code";
                  state.mode = BAD$1;
                  break top;
                }
                break;
              }
          } else if ((op & 64) === 0) {
            here = lcode[(here & 65535) + (hold & (1 << op) - 1)];
            continue dolen;
          } else if (op & 32) {
            state.mode = TYPE$1;
            break top;
          } else {
            strm.msg = "invalid literal/length code";
            state.mode = BAD$1;
            break top;
          }
          break;
        }
    } while (_in < last && _out < end);
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = _in < last ? 5 + (last - _in) : 5 - (_in - last);
  strm.avail_out = _out < end ? 257 + (end - _out) : 257 - (_out - end);
  state.hold = hold;
  state.bits = bits;
  return;
};
var MAXBITS = 15;
var ENOUGH_LENS$1 = 852;
var ENOUGH_DISTS$1 = 592;
var CODES$1 = 0;
var LENS$1 = 1;
var DISTS$1 = 2;
var lbase = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]);
var lext = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]);
var dbase = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]);
var dext = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]);
var inflate_table = (type, lens, lens_index, codes, table, table_index, work, opts) => {
  const bits = opts.bits;
  let len = 0;
  let sym = 0;
  let min = 0, max = 0;
  let root = 0;
  let curr = 0;
  let drop = 0;
  let left = 0;
  let used = 0;
  let huff = 0;
  let incr;
  let fill;
  let low;
  let mask;
  let next;
  let base = null;
  let match;
  const count = new Uint16Array(MAXBITS + 1);
  const offs = new Uint16Array(MAXBITS + 1);
  let extra = null;
  let here_bits, here_op, here_val;
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) {
      break;
    }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    table[table_index++] = 1 << 24 | 64 << 16 | 0;
    opts.bits = 1;
    return 0;
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) {
      break;
    }
  }
  if (root < min) {
    root = min;
  }
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }
  }
  if (left > 0 && (type === CODES$1 || max !== 1)) {
    return -1;
  }
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }
  if (type === CODES$1) {
    base = extra = work;
    match = 20;
  } else if (type === LENS$1) {
    base = lbase;
    extra = lext;
    match = 257;
  } else {
    base = dbase;
    extra = dext;
    match = 0;
  }
  huff = 0;
  sym = 0;
  len = min;
  next = table_index;
  curr = root;
  drop = 0;
  low = -1;
  used = 1 << root;
  mask = used - 1;
  if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
    return 1;
  }
  for (; ; ) {
    here_bits = len - drop;
    if (work[sym] + 1 < match) {
      here_op = 0;
      here_val = work[sym];
    } else if (work[sym] >= match) {
      here_op = extra[work[sym] - match];
      here_val = base[work[sym] - match];
    } else {
      here_op = 32 + 64;
      here_val = 0;
    }
    incr = 1 << len - drop;
    fill = 1 << curr;
    min = fill;
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = here_bits << 24 | here_op << 16 | here_val | 0;
    } while (fill !== 0);
    incr = 1 << len - 1;
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }
    sym++;
    if (--count[len] === 0) {
      if (len === max) {
        break;
      }
      len = lens[lens_index + work[sym]];
    }
    if (len > root && (huff & mask) !== low) {
      if (drop === 0) {
        drop = root;
      }
      next += min;
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) {
          break;
        }
        curr++;
        left <<= 1;
      }
      used += 1 << curr;
      if (type === LENS$1 && used > ENOUGH_LENS$1 || type === DISTS$1 && used > ENOUGH_DISTS$1) {
        return 1;
      }
      low = huff & mask;
      table[low] = root << 24 | curr << 16 | next - table_index | 0;
    }
  }
  if (huff !== 0) {
    table[next + huff] = len - drop << 24 | 64 << 16 | 0;
  }
  opts.bits = root;
  return 0;
};
var inftrees = inflate_table;
var CODES = 0;
var LENS = 1;
var DISTS = 2;
var {
  Z_FINISH: Z_FINISH$1,
  Z_BLOCK,
  Z_TREES,
  Z_OK: Z_OK$1,
  Z_STREAM_END: Z_STREAM_END$1,
  Z_NEED_DICT: Z_NEED_DICT$1,
  Z_STREAM_ERROR: Z_STREAM_ERROR$1,
  Z_DATA_ERROR: Z_DATA_ERROR$1,
  Z_MEM_ERROR: Z_MEM_ERROR$1,
  Z_BUF_ERROR,
  Z_DEFLATED
} = constants$2;
var HEAD = 16180;
var FLAGS = 16181;
var TIME = 16182;
var OS = 16183;
var EXLEN = 16184;
var EXTRA = 16185;
var NAME = 16186;
var COMMENT = 16187;
var HCRC = 16188;
var DICTID = 16189;
var DICT = 16190;
var TYPE = 16191;
var TYPEDO = 16192;
var STORED = 16193;
var COPY_ = 16194;
var COPY = 16195;
var TABLE = 16196;
var LENLENS = 16197;
var CODELENS = 16198;
var LEN_ = 16199;
var LEN = 16200;
var LENEXT = 16201;
var DIST = 16202;
var DISTEXT = 16203;
var MATCH = 16204;
var LIT = 16205;
var CHECK = 16206;
var LENGTH = 16207;
var DONE = 16208;
var BAD = 16209;
var MEM = 16210;
var SYNC = 16211;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
var MAX_WBITS = 15;
var DEF_WBITS = MAX_WBITS;
var zswap32 = (q) => {
  return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
};
function InflateState() {
  this.strm = null;
  this.mode = 0;
  this.last = false;
  this.wrap = 0;
  this.havedict = false;
  this.flags = 0;
  this.dmax = 0;
  this.check = 0;
  this.total = 0;
  this.head = null;
  this.wbits = 0;
  this.wsize = 0;
  this.whave = 0;
  this.wnext = 0;
  this.window = null;
  this.hold = 0;
  this.bits = 0;
  this.length = 0;
  this.offset = 0;
  this.extra = 0;
  this.lencode = null;
  this.distcode = null;
  this.lenbits = 0;
  this.distbits = 0;
  this.ncode = 0;
  this.nlen = 0;
  this.ndist = 0;
  this.have = 0;
  this.next = null;
  this.lens = new Uint16Array(320);
  this.work = new Uint16Array(288);
  this.lendyn = null;
  this.distdyn = null;
  this.sane = 0;
  this.back = 0;
  this.was = 0;
}
var inflateStateCheck = (strm) => {
  if (!strm) {
    return 1;
  }
  const state = strm.state;
  if (!state || state.strm !== strm || state.mode < HEAD || state.mode > SYNC) {
    return 1;
  }
  return 0;
};
var inflateResetKeep = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = "";
  if (state.wrap) {
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.flags = -1;
  state.dmax = 32768;
  state.head = null;
  state.hold = 0;
  state.bits = 0;
  state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
  state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
  state.sane = 1;
  state.back = -1;
  return Z_OK$1;
};
var inflateReset = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);
};
var inflateReset2 = (strm, windowBits) => {
  let wrap;
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  } else {
    wrap = (windowBits >> 4) + 5;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR$1;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
};
var inflateInit2 = (strm, windowBits) => {
  if (!strm) {
    return Z_STREAM_ERROR$1;
  }
  const state = new InflateState();
  strm.state = state;
  state.strm = strm;
  state.window = null;
  state.mode = HEAD;
  const ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK$1) {
    strm.state = null;
  }
  return ret;
};
var inflateInit = (strm) => {
  return inflateInit2(strm, DEF_WBITS);
};
var virgin = true;
var lenfix;
var distfix;
var fixedtables = (state) => {
  if (virgin) {
    lenfix = new Int32Array(512);
    distfix = new Int32Array(32);
    let sym = 0;
    while (sym < 144) {
      state.lens[sym++] = 8;
    }
    while (sym < 256) {
      state.lens[sym++] = 9;
    }
    while (sym < 280) {
      state.lens[sym++] = 7;
    }
    while (sym < 288) {
      state.lens[sym++] = 8;
    }
    inftrees(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
    sym = 0;
    while (sym < 32) {
      state.lens[sym++] = 5;
    }
    inftrees(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
    virgin = false;
  }
  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
};
var updatewindow = (strm, src, end, copy) => {
  let dist;
  const state = strm.state;
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;
    state.window = new Uint8Array(state.wsize);
  }
  if (copy >= state.wsize) {
    state.window.set(src.subarray(end - state.wsize, end), 0);
    state.wnext = 0;
    state.whave = state.wsize;
  } else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
    copy -= dist;
    if (copy) {
      state.window.set(src.subarray(end - copy, end), 0);
      state.wnext = copy;
      state.whave = state.wsize;
    } else {
      state.wnext += dist;
      if (state.wnext === state.wsize) {
        state.wnext = 0;
      }
      if (state.whave < state.wsize) {
        state.whave += dist;
      }
    }
  }
  return 0;
};
var inflate$2 = (strm, flush) => {
  let state;
  let input, output;
  let next;
  let put;
  let have, left;
  let hold;
  let bits;
  let _in, _out;
  let copy;
  let from;
  let from_source;
  let here = 0;
  let here_bits, here_op, here_val;
  let last_bits, last_op, last_val;
  let len;
  let ret;
  const hbuf = new Uint8Array(4);
  let opts;
  let n;
  const order = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (inflateStateCheck(strm) || !strm.output || !strm.input && strm.avail_in !== 0) {
    return Z_STREAM_ERROR$1;
  }
  state = strm.state;
  if (state.mode === TYPE) {
    state.mode = TYPEDO;
  }
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  _in = have;
  _out = left;
  ret = Z_OK$1;
  inf_leave:
    for (; ; ) {
      switch (state.mode) {
        case HEAD:
          if (state.wrap === 0) {
            state.mode = TYPEDO;
            break;
          }
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.wrap & 2 && hold === 35615) {
            if (state.wbits === 0) {
              state.wbits = 15;
            }
            state.check = 0;
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
            hold = 0;
            bits = 0;
            state.mode = FLAGS;
            break;
          }
          if (state.head) {
            state.head.done = false;
          }
          if (!(state.wrap & 1) || /* check if zlib header allowed */
          (((hold & 255) << 8) + (hold >> 8)) % 31) {
            strm.msg = "incorrect header check";
            state.mode = BAD;
            break;
          }
          if ((hold & 15) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          hold >>>= 4;
          bits -= 4;
          len = (hold & 15) + 8;
          if (state.wbits === 0) {
            state.wbits = len;
          }
          if (len > 15 || len > state.wbits) {
            strm.msg = "invalid window size";
            state.mode = BAD;
            break;
          }
          state.dmax = 1 << state.wbits;
          state.flags = 0;
          strm.adler = state.check = 1;
          state.mode = hold & 512 ? DICTID : TYPE;
          hold = 0;
          bits = 0;
          break;
        case FLAGS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.flags = hold;
          if ((state.flags & 255) !== Z_DEFLATED) {
            strm.msg = "unknown compression method";
            state.mode = BAD;
            break;
          }
          if (state.flags & 57344) {
            strm.msg = "unknown header flags set";
            state.mode = BAD;
            break;
          }
          if (state.head) {
            state.head.text = hold >> 8 & 1;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = TIME;
        /* falls through */
        case TIME:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.time = hold;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            hbuf[2] = hold >>> 16 & 255;
            hbuf[3] = hold >>> 24 & 255;
            state.check = crc32_1(state.check, hbuf, 4, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = OS;
        /* falls through */
        case OS:
          while (bits < 16) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (state.head) {
            state.head.xflags = hold & 255;
            state.head.os = hold >> 8;
          }
          if (state.flags & 512 && state.wrap & 4) {
            hbuf[0] = hold & 255;
            hbuf[1] = hold >>> 8 & 255;
            state.check = crc32_1(state.check, hbuf, 2, 0);
          }
          hold = 0;
          bits = 0;
          state.mode = EXLEN;
        /* falls through */
        case EXLEN:
          if (state.flags & 1024) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length = hold;
            if (state.head) {
              state.head.extra_len = hold;
            }
            if (state.flags & 512 && state.wrap & 4) {
              hbuf[0] = hold & 255;
              hbuf[1] = hold >>> 8 & 255;
              state.check = crc32_1(state.check, hbuf, 2, 0);
            }
            hold = 0;
            bits = 0;
          } else if (state.head) {
            state.head.extra = null;
          }
          state.mode = EXTRA;
        /* falls through */
        case EXTRA:
          if (state.flags & 1024) {
            copy = state.length;
            if (copy > have) {
              copy = have;
            }
            if (copy) {
              if (state.head) {
                len = state.head.extra_len - state.length;
                if (!state.head.extra) {
                  state.head.extra = new Uint8Array(state.head.extra_len);
                }
                state.head.extra.set(
                  input.subarray(
                    next,
                    // extra field is limited to 65536 bytes
                    // - no need for additional size check
                    next + copy
                  ),
                  /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
                  len
                );
              }
              if (state.flags & 512 && state.wrap & 4) {
                state.check = crc32_1(state.check, input, copy, next);
              }
              have -= copy;
              next += copy;
              state.length -= copy;
            }
            if (state.length) {
              break inf_leave;
            }
          }
          state.length = 0;
          state.mode = NAME;
        /* falls through */
        case NAME:
          if (state.flags & 2048) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.name += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.name = null;
          }
          state.length = 0;
          state.mode = COMMENT;
        /* falls through */
        case COMMENT:
          if (state.flags & 4096) {
            if (have === 0) {
              break inf_leave;
            }
            copy = 0;
            do {
              len = input[next + copy++];
              if (state.head && len && state.length < 65536) {
                state.head.comment += String.fromCharCode(len);
              }
            } while (len && copy < have);
            if (state.flags & 512 && state.wrap & 4) {
              state.check = crc32_1(state.check, input, copy, next);
            }
            have -= copy;
            next += copy;
            if (len) {
              break inf_leave;
            }
          } else if (state.head) {
            state.head.comment = null;
          }
          state.mode = HCRC;
        /* falls through */
        case HCRC:
          if (state.flags & 512) {
            while (bits < 16) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.check & 65535)) {
              strm.msg = "header crc mismatch";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          if (state.head) {
            state.head.hcrc = state.flags >> 9 & 1;
            state.head.done = true;
          }
          strm.adler = state.check = 0;
          state.mode = TYPE;
          break;
        case DICTID:
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          strm.adler = state.check = zswap32(hold);
          hold = 0;
          bits = 0;
          state.mode = DICT;
        /* falls through */
        case DICT:
          if (state.havedict === 0) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            return Z_NEED_DICT$1;
          }
          strm.adler = state.check = 1;
          state.mode = TYPE;
        /* falls through */
        case TYPE:
          if (flush === Z_BLOCK || flush === Z_TREES) {
            break inf_leave;
          }
        /* falls through */
        case TYPEDO:
          if (state.last) {
            hold >>>= bits & 7;
            bits -= bits & 7;
            state.mode = CHECK;
            break;
          }
          while (bits < 3) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.last = hold & 1;
          hold >>>= 1;
          bits -= 1;
          switch (hold & 3) {
            case 0:
              state.mode = STORED;
              break;
            case 1:
              fixedtables(state);
              state.mode = LEN_;
              if (flush === Z_TREES) {
                hold >>>= 2;
                bits -= 2;
                break inf_leave;
              }
              break;
            case 2:
              state.mode = TABLE;
              break;
            case 3:
              strm.msg = "invalid block type";
              state.mode = BAD;
          }
          hold >>>= 2;
          bits -= 2;
          break;
        case STORED:
          hold >>>= bits & 7;
          bits -= bits & 7;
          while (bits < 32) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
            strm.msg = "invalid stored block lengths";
            state.mode = BAD;
            break;
          }
          state.length = hold & 65535;
          hold = 0;
          bits = 0;
          state.mode = COPY_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        /* falls through */
        case COPY_:
          state.mode = COPY;
        /* falls through */
        case COPY:
          copy = state.length;
          if (copy) {
            if (copy > have) {
              copy = have;
            }
            if (copy > left) {
              copy = left;
            }
            if (copy === 0) {
              break inf_leave;
            }
            output.set(input.subarray(next, next + copy), put);
            have -= copy;
            next += copy;
            left -= copy;
            put += copy;
            state.length -= copy;
            break;
          }
          state.mode = TYPE;
          break;
        case TABLE:
          while (bits < 14) {
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          state.nlen = (hold & 31) + 257;
          hold >>>= 5;
          bits -= 5;
          state.ndist = (hold & 31) + 1;
          hold >>>= 5;
          bits -= 5;
          state.ncode = (hold & 15) + 4;
          hold >>>= 4;
          bits -= 4;
          if (state.nlen > 286 || state.ndist > 30) {
            strm.msg = "too many length or distance symbols";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = LENLENS;
        /* falls through */
        case LENLENS:
          while (state.have < state.ncode) {
            while (bits < 3) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.lens[order[state.have++]] = hold & 7;
            hold >>>= 3;
            bits -= 3;
          }
          while (state.have < 19) {
            state.lens[order[state.have++]] = 0;
          }
          state.lencode = state.lendyn;
          state.lenbits = 7;
          opts = { bits: state.lenbits };
          ret = inftrees(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid code lengths set";
            state.mode = BAD;
            break;
          }
          state.have = 0;
          state.mode = CODELENS;
        /* falls through */
        case CODELENS:
          while (state.have < state.nlen + state.ndist) {
            for (; ; ) {
              here = state.lencode[hold & (1 << state.lenbits) - 1];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (here_val < 16) {
              hold >>>= here_bits;
              bits -= here_bits;
              state.lens[state.have++] = here_val;
            } else {
              if (here_val === 16) {
                n = here_bits + 2;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                if (state.have === 0) {
                  strm.msg = "invalid bit length repeat";
                  state.mode = BAD;
                  break;
                }
                len = state.lens[state.have - 1];
                copy = 3 + (hold & 3);
                hold >>>= 2;
                bits -= 2;
              } else if (here_val === 17) {
                n = here_bits + 3;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 3 + (hold & 7);
                hold >>>= 3;
                bits -= 3;
              } else {
                n = here_bits + 7;
                while (bits < n) {
                  if (have === 0) {
                    break inf_leave;
                  }
                  have--;
                  hold += input[next++] << bits;
                  bits += 8;
                }
                hold >>>= here_bits;
                bits -= here_bits;
                len = 0;
                copy = 11 + (hold & 127);
                hold >>>= 7;
                bits -= 7;
              }
              if (state.have + copy > state.nlen + state.ndist) {
                strm.msg = "invalid bit length repeat";
                state.mode = BAD;
                break;
              }
              while (copy--) {
                state.lens[state.have++] = len;
              }
            }
          }
          if (state.mode === BAD) {
            break;
          }
          if (state.lens[256] === 0) {
            strm.msg = "invalid code -- missing end-of-block";
            state.mode = BAD;
            break;
          }
          state.lenbits = 9;
          opts = { bits: state.lenbits };
          ret = inftrees(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
          state.lenbits = opts.bits;
          if (ret) {
            strm.msg = "invalid literal/lengths set";
            state.mode = BAD;
            break;
          }
          state.distbits = 6;
          state.distcode = state.distdyn;
          opts = { bits: state.distbits };
          ret = inftrees(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
          state.distbits = opts.bits;
          if (ret) {
            strm.msg = "invalid distances set";
            state.mode = BAD;
            break;
          }
          state.mode = LEN_;
          if (flush === Z_TREES) {
            break inf_leave;
          }
        /* falls through */
        case LEN_:
          state.mode = LEN;
        /* falls through */
        case LEN:
          if (have >= 6 && left >= 258) {
            strm.next_out = put;
            strm.avail_out = left;
            strm.next_in = next;
            strm.avail_in = have;
            state.hold = hold;
            state.bits = bits;
            inffast(strm, _out);
            put = strm.next_out;
            output = strm.output;
            left = strm.avail_out;
            next = strm.next_in;
            input = strm.input;
            have = strm.avail_in;
            hold = state.hold;
            bits = state.bits;
            if (state.mode === TYPE) {
              state.back = -1;
            }
            break;
          }
          state.back = 0;
          for (; ; ) {
            here = state.lencode[hold & (1 << state.lenbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if (here_op && (here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          state.length = here_val;
          if (here_op === 0) {
            state.mode = LIT;
            break;
          }
          if (here_op & 32) {
            state.back = -1;
            state.mode = TYPE;
            break;
          }
          if (here_op & 64) {
            strm.msg = "invalid literal/length code";
            state.mode = BAD;
            break;
          }
          state.extra = here_op & 15;
          state.mode = LENEXT;
        /* falls through */
        case LENEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.length += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          state.was = state.length;
          state.mode = DIST;
        /* falls through */
        case DIST:
          for (; ; ) {
            here = state.distcode[hold & (1 << state.distbits) - 1];
            here_bits = here >>> 24;
            here_op = here >>> 16 & 255;
            here_val = here & 65535;
            if (here_bits <= bits) {
              break;
            }
            if (have === 0) {
              break inf_leave;
            }
            have--;
            hold += input[next++] << bits;
            bits += 8;
          }
          if ((here_op & 240) === 0) {
            last_bits = here_bits;
            last_op = here_op;
            last_val = here_val;
            for (; ; ) {
              here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
              here_bits = here >>> 24;
              here_op = here >>> 16 & 255;
              here_val = here & 65535;
              if (last_bits + here_bits <= bits) {
                break;
              }
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            hold >>>= last_bits;
            bits -= last_bits;
            state.back += last_bits;
          }
          hold >>>= here_bits;
          bits -= here_bits;
          state.back += here_bits;
          if (here_op & 64) {
            strm.msg = "invalid distance code";
            state.mode = BAD;
            break;
          }
          state.offset = here_val;
          state.extra = here_op & 15;
          state.mode = DISTEXT;
        /* falls through */
        case DISTEXT:
          if (state.extra) {
            n = state.extra;
            while (bits < n) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            state.offset += hold & (1 << state.extra) - 1;
            hold >>>= state.extra;
            bits -= state.extra;
            state.back += state.extra;
          }
          if (state.offset > state.dmax) {
            strm.msg = "invalid distance too far back";
            state.mode = BAD;
            break;
          }
          state.mode = MATCH;
        /* falls through */
        case MATCH:
          if (left === 0) {
            break inf_leave;
          }
          copy = _out - left;
          if (state.offset > copy) {
            copy = state.offset - copy;
            if (copy > state.whave) {
              if (state.sane) {
                strm.msg = "invalid distance too far back";
                state.mode = BAD;
                break;
              }
            }
            if (copy > state.wnext) {
              copy -= state.wnext;
              from = state.wsize - copy;
            } else {
              from = state.wnext - copy;
            }
            if (copy > state.length) {
              copy = state.length;
            }
            from_source = state.window;
          } else {
            from_source = output;
            from = put - state.offset;
            copy = state.length;
          }
          if (copy > left) {
            copy = left;
          }
          left -= copy;
          state.length -= copy;
          do {
            output[put++] = from_source[from++];
          } while (--copy);
          if (state.length === 0) {
            state.mode = LEN;
          }
          break;
        case LIT:
          if (left === 0) {
            break inf_leave;
          }
          output[put++] = state.length;
          left--;
          state.mode = LEN;
          break;
        case CHECK:
          if (state.wrap) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold |= input[next++] << bits;
              bits += 8;
            }
            _out -= left;
            strm.total_out += _out;
            state.total += _out;
            if (state.wrap & 4 && _out) {
              strm.adler = state.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
              state.flags ? crc32_1(state.check, output, _out, put - _out) : adler32_1(state.check, output, _out, put - _out);
            }
            _out = left;
            if (state.wrap & 4 && (state.flags ? hold : zswap32(hold)) !== state.check) {
              strm.msg = "incorrect data check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = LENGTH;
        /* falls through */
        case LENGTH:
          if (state.wrap && state.flags) {
            while (bits < 32) {
              if (have === 0) {
                break inf_leave;
              }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            if (state.wrap & 4 && hold !== (state.total & 4294967295)) {
              strm.msg = "incorrect length check";
              state.mode = BAD;
              break;
            }
            hold = 0;
            bits = 0;
          }
          state.mode = DONE;
        /* falls through */
        case DONE:
          ret = Z_STREAM_END$1;
          break inf_leave;
        case BAD:
          ret = Z_DATA_ERROR$1;
          break inf_leave;
        case MEM:
          return Z_MEM_ERROR$1;
        case SYNC:
        /* falls through */
        default:
          return Z_STREAM_ERROR$1;
      }
    }
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH$1)) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) ;
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap & 4 && _out) {
    strm.adler = state.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
    state.flags ? crc32_1(state.check, output, _out, strm.next_out - _out) : adler32_1(state.check, output, _out, strm.next_out - _out);
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if ((_in === 0 && _out === 0 || flush === Z_FINISH$1) && ret === Z_OK$1) {
    ret = Z_BUF_ERROR;
  }
  return ret;
};
var inflateEnd = (strm) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  let state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK$1;
};
var inflateGetHeader = (strm, head) => {
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  const state = strm.state;
  if ((state.wrap & 2) === 0) {
    return Z_STREAM_ERROR$1;
  }
  state.head = head;
  head.done = false;
  return Z_OK$1;
};
var inflateSetDictionary = (strm, dictionary) => {
  const dictLength = dictionary.length;
  let state;
  let dictid;
  let ret;
  if (inflateStateCheck(strm)) {
    return Z_STREAM_ERROR$1;
  }
  state = strm.state;
  if (state.wrap !== 0 && state.mode !== DICT) {
    return Z_STREAM_ERROR$1;
  }
  if (state.mode === DICT) {
    dictid = 1;
    dictid = adler32_1(dictid, dictionary, dictLength, 0);
    if (dictid !== state.check) {
      return Z_DATA_ERROR$1;
    }
  }
  ret = updatewindow(strm, dictionary, dictLength, dictLength);
  if (ret) {
    state.mode = MEM;
    return Z_MEM_ERROR$1;
  }
  state.havedict = 1;
  return Z_OK$1;
};
var inflateReset_1 = inflateReset;
var inflateReset2_1 = inflateReset2;
var inflateResetKeep_1 = inflateResetKeep;
var inflateInit_1 = inflateInit;
var inflateInit2_1 = inflateInit2;
var inflate_2$1 = inflate$2;
var inflateEnd_1 = inflateEnd;
var inflateGetHeader_1 = inflateGetHeader;
var inflateSetDictionary_1 = inflateSetDictionary;
var inflateInfo = "pako inflate (from Nodeca project)";
var inflate_1$2 = {
  inflateReset: inflateReset_1,
  inflateReset2: inflateReset2_1,
  inflateResetKeep: inflateResetKeep_1,
  inflateInit: inflateInit_1,
  inflateInit2: inflateInit2_1,
  inflate: inflate_2$1,
  inflateEnd: inflateEnd_1,
  inflateGetHeader: inflateGetHeader_1,
  inflateSetDictionary: inflateSetDictionary_1,
  inflateInfo
};
function GZheader() {
  this.text = 0;
  this.time = 0;
  this.xflags = 0;
  this.os = 0;
  this.extra = null;
  this.extra_len = 0;
  this.name = "";
  this.comment = "";
  this.hcrc = 0;
  this.done = false;
}
var gzheader = GZheader;
var toString = Object.prototype.toString;
var {
  Z_NO_FLUSH,
  Z_FINISH,
  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR
} = constants$2;
function Inflate$1(options) {
  this.options = common.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, options || {});
  const opt = this.options;
  if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) {
      opt.windowBits = -15;
    }
  }
  if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
    opt.windowBits += 32;
  }
  if (opt.windowBits > 15 && opt.windowBits < 48) {
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }
  this.err = 0;
  this.msg = "";
  this.ended = false;
  this.chunks = [];
  this.strm = new zstream();
  this.strm.avail_out = 0;
  let status = inflate_1$2.inflateInit2(
    this.strm,
    opt.windowBits
  );
  if (status !== Z_OK) {
    throw new Error(messages[status]);
  }
  this.header = new gzheader();
  inflate_1$2.inflateGetHeader(this.strm, this.header);
  if (opt.dictionary) {
    if (typeof opt.dictionary === "string") {
      opt.dictionary = strings.string2buf(opt.dictionary);
    } else if (toString.call(opt.dictionary) === "[object ArrayBuffer]") {
      opt.dictionary = new Uint8Array(opt.dictionary);
    }
    if (opt.raw) {
      status = inflate_1$2.inflateSetDictionary(this.strm, opt.dictionary);
      if (status !== Z_OK) {
        throw new Error(messages[status]);
      }
    }
  }
}
Inflate$1.prototype.push = function(data, flush_mode) {
  const strm = this.strm;
  const chunkSize = this.options.chunkSize;
  const dictionary = this.options.dictionary;
  let status, _flush_mode, last_avail_out;
  if (this.ended) return false;
  if (flush_mode === ~~flush_mode) _flush_mode = flush_mode;
  else _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
  if (toString.call(data) === "[object ArrayBuffer]") {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }
  strm.next_in = 0;
  strm.avail_in = strm.input.length;
  for (; ; ) {
    if (strm.avail_out === 0) {
      strm.output = new Uint8Array(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = inflate_1$2.inflate(strm, _flush_mode);
    if (status === Z_NEED_DICT && dictionary) {
      status = inflate_1$2.inflateSetDictionary(strm, dictionary);
      if (status === Z_OK) {
        status = inflate_1$2.inflate(strm, _flush_mode);
      } else if (status === Z_DATA_ERROR) {
        status = Z_NEED_DICT;
      }
    }
    while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
      inflate_1$2.inflateReset(strm);
      status = inflate_1$2.inflate(strm, _flush_mode);
    }
    switch (status) {
      case Z_STREAM_ERROR:
      case Z_DATA_ERROR:
      case Z_NEED_DICT:
      case Z_MEM_ERROR:
        this.onEnd(status);
        this.ended = true;
        return false;
    }
    last_avail_out = strm.avail_out;
    if (strm.next_out) {
      if (strm.avail_out === 0 || status === Z_STREAM_END) {
        if (this.options.to === "string") {
          let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
          let tail = strm.next_out - next_out_utf8;
          let utf8str = strings.buf2string(strm.output, next_out_utf8);
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
          this.onData(utf8str);
        } else {
          this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
        }
      }
    }
    if (status === Z_OK && last_avail_out === 0) continue;
    if (status === Z_STREAM_END) {
      status = inflate_1$2.inflateEnd(this.strm);
      this.onEnd(status);
      this.ended = true;
      return true;
    }
    if (strm.avail_in === 0) break;
  }
  return true;
};
Inflate$1.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};
Inflate$1.prototype.onEnd = function(status) {
  if (status === Z_OK) {
    if (this.options.to === "string") {
      this.result = this.chunks.join("");
    } else {
      this.result = common.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};
function inflate$1(input, options) {
  const inflator = new Inflate$1(options);
  inflator.push(input);
  if (inflator.err) throw inflator.msg || messages[inflator.err];
  return inflator.result;
}
function inflateRaw$1(input, options) {
  options = options || {};
  options.raw = true;
  return inflate$1(input, options);
}
var Inflate_1$1 = Inflate$1;
var inflate_2 = inflate$1;
var inflateRaw_1$1 = inflateRaw$1;
var ungzip$1 = inflate$1;
var constants = constants$2;
var inflate_1$1 = {
  Inflate: Inflate_1$1,
  inflate: inflate_2,
  inflateRaw: inflateRaw_1$1,
  ungzip: ungzip$1,
  constants
};
var { Deflate, deflate, deflateRaw, gzip } = deflate_1$1;
var { Inflate, inflate, inflateRaw, ungzip } = inflate_1$1;
var deflateRaw_1 = deflateRaw;
var inflateRaw_1 = inflateRaw;

// packages/core/src/io/byte-buffer.ts
var ByteBuffer = class _ByteBuffer {
  _view;
  _pos = 0;
  version = 0;
  stringTable = [];
  constructor(buffer, byteOffset = 0, byteLength) {
    const len = byteLength ?? buffer.byteLength - byteOffset;
    this._view = new DataView(buffer, byteOffset, len);
  }
  get pos() {
    return this._pos;
  }
  set pos(v) {
    this._pos = v;
  }
  get buffer() {
    return this._view.buffer;
  }
  get byteOffset() {
    return this._view.byteOffset;
  }
  get byteLength() {
    return this._view.byteLength;
  }
  skip(count) {
    this._pos += count;
  }
  getUint8() {
    return this._view.getUint8(this._pos++);
  }
  getInt8() {
    return this._view.getInt8(this._pos++);
  }
  getUint16() {
    const v = this._view.getUint16(this._pos, false);
    this._pos += 2;
    return v;
  }
  getInt16() {
    const v = this._view.getInt16(this._pos, false);
    this._pos += 2;
    return v;
  }
  getUint32() {
    const v = this._view.getUint32(this._pos, false);
    this._pos += 4;
    return v;
  }
  getInt32() {
    const v = this._view.getInt32(this._pos, false);
    this._pos += 4;
    return v;
  }
  getFloat32() {
    const v = this._view.getFloat32(this._pos, false);
    this._pos += 4;
    return v;
  }
  readByte() {
    return this.getUint8();
  }
  readBool() {
    return this.getUint8() === 1;
  }
  readInt32() {
    return this.getInt32();
  }
  readUint16() {
    return this.getUint16();
  }
  /** Read a uint16-prefixed UTF-8 string. */
  readUTFString() {
    const len = this.getUint16();
    const bytes = new Uint8Array(this._view.buffer, this._view.byteOffset + this._pos, len);
    this._pos += len;
    return new TextDecoder("utf-8").decode(bytes);
  }
  /** Read a raw UTF-8 string of exactly `len` bytes (no length prefix). */
  getCustomString(len) {
    const bytes = new Uint8Array(this._view.buffer, this._view.byteOffset + this._pos, len);
    this._pos += len;
    return new TextDecoder("utf-8").decode(bytes);
  }
  /**
   * Read a uint16 string-table index and return the corresponding string.
   * Returns `null` for index 65534 (null sentinel) and `""` for 65533 (empty).
   */
  readS() {
    const index = this.getUint16();
    if (index === NULL_STRING_INDEX) return null;
    if (index === EMPTY_STRING_INDEX) return "";
    return this.stringTable[index] ?? null;
  }
  readSArray(cnt) {
    const result = [];
    for (let i = 0; i < cnt; i++) result.push(this.readS() ?? "");
    return result;
  }
  /** Read a uint32-prefixed sub-buffer slice (shares the same underlying ArrayBuffer). */
  readBuffer() {
    const count = this.getUint32();
    const ba = new _ByteBuffer(this._view.buffer, this._view.byteOffset + this._pos, count);
    this._pos += count;
    ba.stringTable = this.stringTable;
    ba.version = this.version;
    return ba;
  }
  /**
   * Navigate to a section by block index using the index table at `indexTablePos`.
   *
   * Index table layout:
   *   uint8  segCount
   *   uint8  useShort (1 = uint16 offsets, 0 = uint32 offsets)
   *   uint16[] or uint32[]  offsets (relative to indexTablePos)
   *
   * Sections: 0=Dependencies, 1=Items, 2=Sprites, 3=PixelHitTest, 4=StringTable, 5=CustomStrings
   */
  seek(indexTablePos, blockIndex) {
    const saved = this._pos;
    this._pos = indexTablePos;
    const segCount = this.getUint8();
    if (blockIndex < segCount) {
      const useShort = this.getUint8() === 1;
      let newPos;
      if (useShort) {
        this._pos += 2 * blockIndex;
        newPos = this.getUint16();
      } else {
        this._pos += 4 * blockIndex;
        newPos = this.getUint32();
      }
      if (newPos > 0) {
        this._pos = indexTablePos + newPos;
        return true;
      }
    }
    this._pos = saved;
    return false;
  }
};

// packages/core/src/io/component-decoder.ts
var COMPONENT_EXTENSION_TYPE_NAMES = {
  11: "Label",
  12: "Button",
  13: "ComboBox",
  14: "ProgressBar",
  15: "Slider",
  16: "ScrollBar"
};
function remainingBytes(buf) {
  return Math.max(0, buf.byteLength - buf.pos);
}
function readColorValue(buf, hasAlpha, preserveAlpha = false) {
  const r = buf.getUint8().toString(16).padStart(2, "0");
  const g = buf.getUint8().toString(16).padStart(2, "0");
  const b = buf.getUint8().toString(16).padStart(2, "0");
  const a = buf.getUint8().toString(16).padStart(2, "0");
  if (!hasAlpha || !preserveAlpha && a === "ff") return `#${r}${g}${b}`.toUpperCase();
  return `#${a}${r}${g}${b}`.toUpperCase();
}
function formatBinaryNumber(value) {
  const normalized = Math.round((Object.is(value, -0) ? 0 : value) * 1e6) / 1e6;
  return Number.isInteger(normalized) ? `${normalized}` : `${normalized}`;
}
function resolveRelationTarget(targetIndex, targetIds) {
  if (targetIndex < 0) return "";
  return targetIds[targetIndex] ?? `${targetIndex}`;
}
function decodeRelationBlock(buf, targetIds, addRelation) {
  const targetCount = buf.getUint8();
  for (let targetIndex = 0; targetIndex < targetCount; targetIndex += 1) {
    if (remainingBytes(buf) < 3) return;
    const relationTarget = resolveRelationTarget(buf.getInt16(), targetIds);
    const pairCount = buf.getUint8();
    for (let pairIndex = 0; pairIndex < pairCount; pairIndex += 1) {
      if (remainingBytes(buf) < 2) return;
      addRelation({
        target: relationTarget,
        type: buf.getUint8(),
        usePercent: buf.readBool()
      });
    }
  }
}
function createDisplayObject(doc, objectType, name) {
  switch (objectType) {
    case 0:
      return doc.createGImage(name);
    case 1:
      return doc.createGMovieClip(name);
    case 3:
      return doc.createGGraph(name);
    case 4:
      return doc.createGLoader(name);
    case 5:
      return doc.createGGroup(name);
    case 6:
      return doc.createGTextField(name);
    case 7:
      return doc.createGRichTextField(name);
    case 8:
      return doc.createGTextInput(name);
    case 9:
      return doc.createGComponent(name);
    case 10:
      return doc.createGList(name);
    case 11:
      return doc.createGLabel(name);
    case 12:
      return doc.createGButton(name);
    case 13:
      return doc.createGComboBox(name);
    case 14:
      return doc.createGProgressBar(name);
    case 15:
      return doc.createGSlider(name);
    case 16:
      return doc.createGScrollBar(name);
    case 17:
      return doc.createGTree(name);
    case 18:
      return doc.createGLoader3D(name);
    default:
      return null;
  }
}
function decodeChildBlock0(doc, childBuf) {
  if (!childBuf.seek(0, 0) || remainingBytes(childBuf) < 33) return null;
  const objectType = childBuf.getUint8();
  const src = childBuf.readS() ?? "";
  const packageId = childBuf.readS();
  const id = childBuf.readS() ?? "";
  const name = childBuf.readS() ?? "";
  const child = createDisplayObject(doc, objectType, name);
  if (!child) return null;
  child.setName(name);
  child.setId(id);
  if ("setSrc" in child && typeof child.setSrc === "function") {
    child.setSrc(src);
  }
  if (packageId !== null && "setPackageId" in child && typeof child.setPackageId === "function") {
    child.setPackageId(packageId);
  }
  if ("setXY" in child && typeof child.setXY === "function") {
    child.setXY(childBuf.getInt32(), childBuf.getInt32());
  } else {
    childBuf.skip(8);
  }
  if (childBuf.readBool() && remainingBytes(childBuf) >= 8) {
    if ("setSize" in child && typeof child.setSize === "function") {
      child.setSize(childBuf.getInt32(), childBuf.getInt32());
    } else {
      childBuf.skip(8);
    }
  }
  if (childBuf.readBool() && remainingBytes(childBuf) >= 16) {
    childBuf.skip(16);
  }
  if (childBuf.readBool() && remainingBytes(childBuf) >= 8) {
    if ("setScale" in child && typeof child.setScale === "function") {
      child.setScale(childBuf.getFloat32(), childBuf.getFloat32());
    } else {
      childBuf.skip(8);
    }
  }
  if (childBuf.readBool() && remainingBytes(childBuf) >= 8) {
    if ("setSkew" in child && typeof child.setSkew === "function") {
      child.setSkew(childBuf.getFloat32(), childBuf.getFloat32());
    } else {
      childBuf.skip(8);
    }
  }
  if (childBuf.readBool() && remainingBytes(childBuf) >= 9) {
    const px = childBuf.getFloat32();
    const py = childBuf.getFloat32();
    const anchor = childBuf.readBool();
    if ("setPivot" in child && typeof child.setPivot === "function") {
      child.setPivot(px, py, anchor);
    }
  }
  if (remainingBytes(childBuf) < 15) return child;
  const alpha = childBuf.getFloat32();
  const rotation = childBuf.getFloat32();
  const visible = childBuf.readBool();
  const touchable = childBuf.readBool();
  const grayed = childBuf.readBool();
  if ("setAlpha" in child && typeof child.setAlpha === "function") {
    child.setAlpha(alpha);
  }
  if ("setRotation" in child && typeof child.setRotation === "function") {
    child.setRotation(rotation);
  }
  if ("setVisible" in child && typeof child.setVisible === "function") {
    child.setVisible(visible);
  }
  if ("setTouchable" in child && typeof child.setTouchable === "function") {
    child.setTouchable(touchable);
  }
  if ("setGrayed" in child && typeof child.setGrayed === "function") {
    child.setGrayed(grayed);
  }
  if (remainingBytes(childBuf) < 2) return child;
  childBuf.getUint8();
  childBuf.getUint8();
  if (remainingBytes(childBuf) >= 2) {
    if ("setCustomData" in child && typeof child.setCustomData === "function") {
      child.setCustomData(childBuf.readS() ?? "");
    } else {
      childBuf.readS();
    }
  }
  return child;
}
function decodeChildBlock1(child, childBuf) {
  if (!childBuf.seek(0, 1) || remainingBytes(childBuf) < 4) return -1;
  if ("setTooltips" in child && typeof child.setTooltips === "function") {
    child.setTooltips(childBuf.readS() ?? "");
  } else {
    childBuf.readS();
  }
  return childBuf.getInt16();
}
function decodeChildBlock4ComponentLike(resource, child, childBuf) {
  if (!childBuf.seek(0, 4) || remainingBytes(childBuf) < 4) return;
  const pageControllerIndex = childBuf.getInt16();
  const overrideCount = childBuf.getInt16();
  const overrides = [];
  for (let index = 0; index < overrideCount && remainingBytes(childBuf) >= 4; index += 1) {
    overrides.push(childBuf.readS() ?? "", childBuf.readS() ?? "");
  }
  if ("setControllerOverrides" in child && typeof child.setControllerOverrides === "function") {
    child.setControllerOverrides(overrides.join(","));
  }
  if (pageControllerIndex >= 0) {
    const controller = resource.listControllers()[pageControllerIndex];
    if (controller && "setPageController" in child && typeof child.setPageController === "function") {
      child.setPageController(controller.getName());
    }
  }
}
function decodeChildBlock4TextInput(child, childBuf) {
  if (!childBuf.seek(0, 4) || remainingBytes(childBuf) < 10) return;
  child.setPromptText(childBuf.readS() ?? "").setRestrict(childBuf.readS() ?? "").setMaxLength(childBuf.getInt32()).setKeyboardType(childBuf.getInt32()).setPassword(childBuf.readBool());
}
function decodeTextChildSpecific(child, childBuf) {
  if (remainingBytes(childBuf) < 18) return;
  const textChild = child;
  textChild.setFont(childBuf.readS() ?? "").setFontSize(childBuf.getInt16()).setColor(readColorValue(childBuf, false)).setAlign(childBuf.getUint8()).setVAlign(childBuf.getUint8()).setLeading(childBuf.getInt16()).setLetterSpacing(childBuf.getInt16()).setUbbEnabled(childBuf.readBool()).setAutoSize(childBuf.getUint8()).setUnderline(childBuf.readBool()).setItalic(childBuf.readBool()).setBold(childBuf.readBool()).setSingleLine(childBuf.readBool());
  if (childBuf.readBool() && remainingBytes(childBuf) >= 8) {
    textChild.setStrokeColor(readColorValue(childBuf, true)).setStrokeSize(childBuf.getFloat32());
  }
  if (childBuf.readBool() && remainingBytes(childBuf) >= 12) {
    textChild.setShadowColor(readColorValue(childBuf, true)).setShadowOffset({
      x: childBuf.getFloat32(),
      y: childBuf.getFloat32()
    });
  }
  if (childBuf.readBool()) {
  }
  if (childBuf.version >= 3 && remainingBytes(childBuf) >= 13) {
    textChild.setStrikethrough(childBuf.readBool());
    childBuf.skip(12);
  }
}
function decodeListScrollPane(child, childBuf) {
  if (!childBuf.seek(0, 7) || remainingBytes(childBuf) < 10) return;
  const listLike = child;
  listLike.setScrollType(childBuf.getUint8());
  childBuf.getUint8();
  listLike.setScrollBarFlags(childBuf.getInt32());
  if (childBuf.readBool() && remainingBytes(childBuf) >= 16) {
    listLike.setScrollBarMargin([
      childBuf.getInt32(),
      childBuf.getInt32(),
      childBuf.getInt32(),
      childBuf.getInt32()
    ]);
  }
  listLike.setVtScrollBarRes(childBuf.readS() ?? "").setHzScrollBarRes(childBuf.readS() ?? "").setHeaderRes(childBuf.readS() ?? "").setFooterRes(childBuf.readS() ?? "");
}
function skipListItemOverrides(buf, version) {
  if (remainingBytes(buf) < 2) return;
  const controllerOverrideCount = buf.getInt16();
  for (let index = 0; index < controllerOverrideCount && remainingBytes(buf) >= 4; index += 1) {
    buf.readS();
    buf.readS();
  }
  if (version >= 2 && remainingBytes(buf) >= 2) {
    const propertyOverrideCount = buf.getInt16();
    for (let index = 0; index < propertyOverrideCount && remainingBytes(buf) >= 6; index += 1) {
      buf.readS();
      buf.getInt16();
      buf.readS();
    }
  }
}
function decodeListItems(child, childBuf) {
  if (!childBuf.seek(0, 8) || remainingBytes(childBuf) < 4) return;
  const listLike = child;
  const isTree = child.propertyType === "GTree";
  listLike.setDefaultItem(childBuf.readS() ?? "");
  const itemCount = childBuf.getInt16();
  const items = [];
  for (let index = 0; index < itemCount && remainingBytes(childBuf) >= 2; index += 1) {
    const chunkSize = childBuf.getInt16();
    const nextPos = childBuf.pos + chunkSize;
    const url = childBuf.readS();
    let isFolder = null;
    let level = 0;
    if (isTree && remainingBytes(childBuf) >= 2) {
      isFolder = childBuf.readBool();
      level = childBuf.getUint8();
    }
    items.push({
      url,
      title: childBuf.readS(),
      selectedTitle: childBuf.readS(),
      icon: childBuf.readS(),
      selectedIcon: childBuf.readS(),
      name: childBuf.readS(),
      level,
      isFolder
    });
    skipListItemOverrides(childBuf, childBuf.version);
    childBuf.pos = nextPos;
  }
  listLike.setListItems(items);
}
function decodeTreeSettings(child, childBuf) {
  if (child.propertyType !== "GTree") return;
  if (!childBuf.seek(0, 9) || remainingBytes(childBuf) < 5) return;
  child.setIndent(childBuf.getInt32()).setClickToExpand(childBuf.getUint8());
}
function decodeChildBlock5(child, childBuf) {
  if (!childBuf.seek(0, 5)) return;
  switch (child.propertyType) {
    case "GImage": {
      if (remainingBytes(childBuf) < 3) return;
      if (childBuf.readBool()) {
        child.setColor(readColorValue(childBuf, false));
      }
      const imageChild = child;
      imageChild.setFlip(childBuf.getUint8()).setFillMethod(childBuf.getUint8());
      if (imageChild.getFillMethod() !== 0 && remainingBytes(childBuf) >= 6) {
        imageChild.setFillOrigin(childBuf.getUint8()).setFillClockwise(childBuf.readBool()).setFillAmount(childBuf.getFloat32());
      }
      break;
    }
    case "GTextField":
    case "GRichTextField":
    case "GTextInput":
      decodeTextChildSpecific(child, childBuf);
      break;
    case "GGraph": {
      if (remainingBytes(childBuf) < 13) return;
      const graph = child;
      const graphType = remainingBytes(childBuf) >= 14 ? childBuf.getUint8() : 0;
      graph.setGraphType(graphType).setLineSize(childBuf.getInt32()).setLineColor(readColorValue(childBuf, true, true)).setFillColor(readColorValue(childBuf, true, true));
      if (childBuf.readBool() && remainingBytes(childBuf) >= 16) {
        graph.setCornerRadius([
          childBuf.getFloat32(),
          childBuf.getFloat32(),
          childBuf.getFloat32(),
          childBuf.getFloat32()
        ]);
      }
      if (graphType === 3 && remainingBytes(childBuf) >= 2) {
        const pointCount = childBuf.getInt16();
        const points = [];
        for (let index = 0; index < pointCount && remainingBytes(childBuf) >= 4; index += 1) {
          points.push(childBuf.getFloat32());
        }
        graph.setPoints(points);
      } else if (graphType === 4 && remainingBytes(childBuf) >= 8) {
        graph.setSides(childBuf.getInt16()).setStartAngle(childBuf.getFloat32());
        const distanceCount = childBuf.getInt16();
        const distances = [];
        for (let index = 0; index < distanceCount && remainingBytes(childBuf) >= 4; index += 1) {
          distances.push(childBuf.getFloat32());
        }
        graph.setDistances(distances);
      }
      break;
    }
    case "GGroup": {
      if (remainingBytes(childBuf) < 11) return;
      child.setLayout(childBuf.getUint8()).setLineGap(childBuf.getInt32()).setColumnGap(childBuf.getInt32()).setExcludeInvisibles(childBuf.readBool()).setAutoSizeDisabled(childBuf.readBool()).setMainGridIndex(childBuf.getInt16());
      const group = child;
      if (group.listGears().length > 0 || group.getRelations().length > 0) {
        group.setAdvanced(true);
      }
      break;
    }
    case "GLoader": {
      if (remainingBytes(childBuf) < 15) return;
      const loader = child;
      loader.setUrl(childBuf.readS() ?? "").setAlign(childBuf.getUint8()).setVAlign(childBuf.getUint8()).setFill(childBuf.getUint8()).setShrinkOnly(childBuf.readBool()).setAutoSize(childBuf.readBool());
      childBuf.readBool();
      loader.setPlaying(childBuf.readBool()).setFrame(childBuf.getInt32());
      if (childBuf.readBool()) {
        loader.setColor(readColorValue(childBuf, false));
      }
      loader.setFillMethod(childBuf.getUint8());
      if (loader.getFillMethod() !== 0 && remainingBytes(childBuf) >= 6) {
        loader.setFillOrigin(childBuf.getUint8()).setFillClockwise(childBuf.readBool()).setFillAmount(childBuf.getFloat32());
      }
      if (childBuf.version >= 7 && remainingBytes(childBuf) >= 1) {
        loader.setUseResize(childBuf.readBool());
      }
      break;
    }
    case "GLoader3D": {
      if (remainingBytes(childBuf) < 18) return;
      const loader = child;
      loader.setUrl(childBuf.readS() ?? "").setAlign(childBuf.getUint8()).setVAlign(childBuf.getUint8()).setFill(childBuf.getUint8()).setShrinkOnly(childBuf.readBool()).setAutoSize(childBuf.readBool()).setAnimationName(childBuf.readS() ?? "").setSkinName(childBuf.readS() ?? "").setPlaying(childBuf.readBool()).setFrame(childBuf.getInt32()).setLoop(childBuf.readBool());
      if (childBuf.readBool()) {
        loader.setColor(readColorValue(childBuf, false));
      }
      break;
    }
    case "GMovieClip": {
      if (remainingBytes(childBuf) < 7) return;
      const movieClip = child;
      if (childBuf.readBool()) {
        movieClip.setColor(readColorValue(childBuf, false));
      }
      childBuf.getUint8();
      movieClip.setFrame(childBuf.getInt32()).setPlaying(childBuf.readBool());
      break;
    }
    case "GList":
    case "GTree": {
      if (remainingBytes(childBuf) < 18) return;
      const listLike = child;
      listLike.setLayout(childBuf.getUint8()).setSelectionMode(childBuf.getUint8()).setAlign(childBuf.getUint8()).setVAlign(childBuf.getUint8()).setLineGap(childBuf.getInt16()).setColumnGap(childBuf.getInt16()).setLineCount(childBuf.getInt16()).setColumnCount(childBuf.getInt16()).setAutoResizeItem(childBuf.readBool()).setChildrenRenderOrder(childBuf.getUint8()).setApexIndex(childBuf.getInt16());
      if (childBuf.readBool() && remainingBytes(childBuf) >= 16) {
        listLike.setMargin([
          childBuf.getInt32(),
          childBuf.getInt32(),
          childBuf.getInt32(),
          childBuf.getInt32()
        ]);
      }
      const overflow = childBuf.getUint8();
      listLike.setOverflow(overflow);
      if (childBuf.readBool() && remainingBytes(childBuf) >= 8) {
        listLike.setClipSoftness([childBuf.getInt32(), childBuf.getInt32()]);
      }
      if (childBuf.version >= 2 && remainingBytes(childBuf) >= 2) {
        listLike.setScrollItemToViewOnClick(childBuf.readBool()).setFoldInvisibleItems(childBuf.readBool());
      }
      if (overflow === 2) {
        decodeListScrollPane(child, childBuf);
      }
      decodeListItems(child, childBuf);
      decodeTreeSettings(child, childBuf);
      break;
    }
    default:
      break;
  }
}
function decodeChildBlock6(resource, child, childBuf) {
  if (!childBuf.seek(0, 6)) return;
  switch (child.propertyType) {
    case "GTextField":
    case "GRichTextField":
    case "GTextInput":
      if (remainingBytes(childBuf) >= 2) {
        child.setText(childBuf.readS() ?? "");
      }
      break;
    case "GComponent": {
      if (remainingBytes(childBuf) < 1) return;
      const extType = childBuf.getUint8();
      const extTypeName = COMPONENT_EXTENSION_TYPE_NAMES[extType] ?? "";
      if (!extTypeName) return;
      const component = child;
      component.setInstanceExtType(extTypeName);
      switch (extTypeName) {
        case "Button":
          if (remainingBytes(childBuf) < 12) return;
          component.setInstanceTitle(childBuf.readS() ?? "").setInstanceSelectedTitle(childBuf.readS() ?? "").setInstanceIcon(childBuf.readS() ?? "").setInstanceSelectedIcon(childBuf.readS() ?? "");
          if (childBuf.readBool()) {
            component.setInstanceTitleColor(readColorValue(childBuf, true));
          }
          component.setInstanceTitleFontSize(childBuf.getInt32());
          {
            const relatedControllerIndex = childBuf.getInt16();
            if (relatedControllerIndex >= 0) {
              component.setInstanceController(resource.listControllers()[relatedControllerIndex]?.getName() ?? "");
            }
          }
          component.setInstancePage(childBuf.readS() ?? "");
          childBuf.readS();
          if (childBuf.readBool() && remainingBytes(childBuf) >= 4) {
            childBuf.getFloat32();
          }
          if (remainingBytes(childBuf) >= 1) {
            component.setInstanceChecked(childBuf.readBool());
          }
          break;
        case "Label":
          if (remainingBytes(childBuf) < 9) return;
          component.setInstanceTitle(childBuf.readS() ?? "").setInstanceIcon(childBuf.readS() ?? "");
          if (childBuf.readBool()) {
            component.setInstanceTitleColor(readColorValue(childBuf, true));
          }
          component.setInstanceTitleFontSize(childBuf.getInt32());
          if (remainingBytes(childBuf) >= 1 && childBuf.readBool()) {
            component.setInstancePromptText(childBuf.readS() ?? "");
            childBuf.readS();
            if (remainingBytes(childBuf) >= 9) {
              childBuf.getInt32();
              childBuf.getInt32();
              childBuf.readBool();
            }
          }
          if (childBuf.version >= 5 && remainingBytes(childBuf) >= 6) {
            childBuf.readS();
            childBuf.getFloat32();
          }
          break;
        case "ComboBox": {
          if (remainingBytes(childBuf) < 2) return;
          const itemCount = childBuf.getInt16();
          const items = [];
          for (let index = 0; index < itemCount && remainingBytes(childBuf) >= 2; index += 1) {
            const chunkSize = childBuf.getInt16();
            const nextPos = childBuf.pos + chunkSize;
            items.push({
              title: childBuf.readS(),
              value: childBuf.readS(),
              icon: childBuf.readS()
            });
            childBuf.pos = nextPos;
          }
          component.setInstanceComboItems(items).setInstanceTitle(childBuf.readS() ?? "").setInstanceIcon(childBuf.readS() ?? "");
          if (childBuf.readBool()) {
            component.setInstanceTitleColor(readColorValue(childBuf, true));
          }
          component.setInstanceVisibleItemCount(childBuf.getInt32());
          childBuf.getUint8();
          const selectionControllerIndex = childBuf.getInt16();
          if (selectionControllerIndex >= 0) {
            component.setInstanceSelectionController(resource.listControllers()[selectionControllerIndex]?.getName() ?? "");
          }
          if (childBuf.version >= 5 && remainingBytes(childBuf) >= 6) {
            childBuf.readS();
            childBuf.getFloat32();
          }
          break;
        }
        case "ProgressBar":
        case "Slider":
          if (remainingBytes(childBuf) < 12) return;
          component.setInstanceValue(childBuf.getInt32()).setInstanceMax(childBuf.getInt32()).setInstanceMin(childBuf.getInt32());
          if (extTypeName === "ProgressBar" && childBuf.version >= 5 && remainingBytes(childBuf) >= 6) {
            childBuf.readS();
            childBuf.getFloat32();
          }
          break;
        default:
          break;
      }
      break;
    }
    case "GButton": {
      if (remainingBytes(childBuf) < 13) return;
      childBuf.getUint8();
      const button = child;
      button.setTitle(childBuf.readS() ?? "").setSelectedTitle(childBuf.readS() ?? "").setIcon(childBuf.readS() ?? "").setSelectedIcon(childBuf.readS() ?? "");
      if (childBuf.readBool()) {
        button.setTitleColor(readColorValue(childBuf, true));
      }
      button.setTitleFontSize(childBuf.getInt32());
      childBuf.getInt16();
      childBuf.readS();
      button.setSound(childBuf.readS() ?? "");
      if (childBuf.readBool() && remainingBytes(childBuf) >= 4) {
        button.setSoundVolumeScale(childBuf.getFloat32());
      }
      if (remainingBytes(childBuf) >= 1) {
        childBuf.readBool();
      }
      break;
    }
    case "GLabel": {
      if (remainingBytes(childBuf) < 10) return;
      childBuf.getUint8();
      const label = child;
      label.setTitle(childBuf.readS() ?? "").setIcon(childBuf.readS() ?? "");
      if (childBuf.readBool()) {
        label.setTitleColor(readColorValue(childBuf, true));
      }
      label.setTitleFontSize(childBuf.getInt32());
      if (remainingBytes(childBuf) >= 1) {
        const hasInputSettings = childBuf.readBool();
        if (hasInputSettings) {
        }
      }
      if (childBuf.version >= 5 && remainingBytes(childBuf) >= 6) {
        label.setSound(childBuf.readS() ?? "").setSoundVolumeScale(childBuf.getFloat32());
      }
      break;
    }
    case "GComboBox": {
      if (remainingBytes(childBuf) < 3) return;
      childBuf.getUint8();
      const comboBox = child;
      const itemCount = childBuf.getInt16();
      const items = [];
      const values = [];
      const icons = [];
      for (let index = 0; index < itemCount && remainingBytes(childBuf) >= 2; index += 1) {
        const chunkSize = childBuf.getInt16();
        const nextPos = childBuf.pos + chunkSize;
        items.push(childBuf.readS() ?? "");
        values.push(childBuf.readS() ?? "");
        icons.push(childBuf.readS() ?? "");
        childBuf.pos = nextPos;
      }
      comboBox.setItems(items).setValues(values).setIcons(icons).setTitle(childBuf.readS() ?? "").setIcon(childBuf.readS() ?? "");
      if (childBuf.readBool()) {
        comboBox.setTitleColor(readColorValue(childBuf, true));
      }
      comboBox.setVisibleItemCount(childBuf.getInt32()).setPopupDirection(childBuf.getUint8());
      childBuf.getInt16();
      if (childBuf.version >= 5 && remainingBytes(childBuf) >= 6) {
        comboBox.setSound(childBuf.readS() ?? "").setSoundVolumeScale(childBuf.getFloat32());
      }
      break;
    }
    case "GProgressBar":
    case "GSlider": {
      if (remainingBytes(childBuf) < 14) return;
      childBuf.getUint8();
      const sliderLike = child;
      sliderLike.setValue(childBuf.getInt32()).setMax(childBuf.getInt32()).setMin(childBuf.getInt32());
      if (child.propertyType === "GProgressBar" && childBuf.version >= 5 && remainingBytes(childBuf) >= 6) {
        sliderLike.setSound(childBuf.readS() ?? "").setSoundVolumeScale(childBuf.getFloat32());
      }
      break;
    }
    case "GList":
    case "GTree": {
      if (remainingBytes(childBuf) < 2) return;
      const controllerIndex = childBuf.getInt16();
      const controller = controllerIndex >= 0 ? resource.listControllers()[controllerIndex] : null;
      if (controller) {
        child.setSelectionController(controller.getName());
      }
      break;
    }
    default:
      break;
  }
}
function decodeChildBlock2(doc, resource, child, childBuf) {
  if (!childBuf.seek(0, 2) || remainingBytes(childBuf) < 2) return;
  const gearCount = childBuf.getInt16();
  for (let gearIndex = 0; gearIndex < gearCount && remainingBytes(childBuf) >= 2; gearIndex += 1) {
    const chunkSize = childBuf.getInt16();
    const nextPos = childBuf.pos + chunkSize;
    if (remainingBytes(childBuf) < 3) {
      childBuf.pos = nextPos;
      continue;
    }
    const gearType = childBuf.getUint8();
    const gear = doc.createGear(`${child.getId()}_gear${gearIndex}`);
    gear.setGearType(gearType);
    if (remainingBytes(childBuf) >= 2) {
      const controllerIndex = childBuf.getInt16();
      gear.setController(resource.listControllers()[controllerIndex] ?? null);
    }
    const pages = [];
    const values = [];
    let defaultValue = null;
    if (gearType === 0 /* Display */ || gearType === 8 /* Display2 */) {
      const pageCount = remainingBytes(childBuf) >= 2 ? childBuf.getInt16() : 0;
      for (let pageIndex = 0; pageIndex < pageCount && remainingBytes(childBuf) >= 2; pageIndex += 1) {
        pages.push(childBuf.readS() ?? "");
      }
    } else {
      const pageCount = remainingBytes(childBuf) >= 2 ? childBuf.getInt16() : 0;
      const controllerPages = gear.getController()?.listPages() ?? [];
      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        if (remainingBytes(childBuf) < 2) break;
        const rawPageId = childBuf.readS();
        const pageId = rawPageId ?? controllerPages[pageIndex]?.getId() ?? "";
        pages.push(pageId);
        if (rawPageId === null && gearType !== 6 /* Text */ && gearType !== 7 /* Icon */) {
          values.push("-");
          continue;
        }
        values.push(decodeGearStatus(childBuf, gearType, childBuf.version));
      }
      if (remainingBytes(childBuf) >= 1 && childBuf.readBool()) {
        defaultValue = decodeGearStatus(childBuf, gearType, childBuf.version);
      }
    }
    if (remainingBytes(childBuf) >= 1) {
      const hasTween = childBuf.readBool();
      gear.setTween(hasTween);
      if (hasTween && remainingBytes(childBuf) >= 9) {
        gear.setEaseType(childBuf.getUint8()).setTweenDuration(childBuf.getFloat32()).setTweenDelay(childBuf.getFloat32());
        if (childBuf.version >= 4 && gear.getEaseType() === 31) {
          gear.setCustomEasePath(readPathData(childBuf));
        }
      }
    }
    if (childBuf.version >= 2 && gearType === 1 /* XY */ && remainingBytes(childBuf) >= 1) {
      const positionsInPercent = childBuf.readBool();
      gear.setPositionsInPercent(positionsInPercent);
      if (positionsInPercent) {
        for (let pageIndex = 0; pageIndex < pages.length && remainingBytes(childBuf) >= 2; pageIndex += 1) {
          const rawPageId = childBuf.readS();
          const pageId = rawPageId ?? pages[pageIndex] ?? "";
          if (rawPageId === null || pageId === "") continue;
          const px = childBuf.getFloat32();
          const py = childBuf.getFloat32();
          values[pageIndex] = `${values[pageIndex] || "0,0"},${formatBinaryNumber(px)},${formatBinaryNumber(py)}`;
        }
        if (remainingBytes(childBuf) >= 1 && childBuf.readBool()) {
          const px = childBuf.getFloat32();
          const py = childBuf.getFloat32();
          defaultValue = `${defaultValue || "0,0"},${formatBinaryNumber(px)},${formatBinaryNumber(py)}`;
        }
      }
    }
    if (gearType === 8 /* Display2 */ && remainingBytes(childBuf) >= 1) {
      gear.setCondition(`${childBuf.getUint8()}`);
    }
    if (childBuf.version >= 6 && gearType === 5 /* Animation */) {
      for (let pageIndex = 0; pageIndex < pages.length && remainingBytes(childBuf) >= 2; pageIndex += 1) {
        const rawPageId = childBuf.readS();
        if (rawPageId === null) continue;
        const animationName = childBuf.readS() ?? "";
        const skinName = childBuf.readS() ?? "";
        values[pageIndex] = `${values[pageIndex] || "0,p"},${animationName},${skinName}`;
      }
      if (remainingBytes(childBuf) >= 1 && childBuf.readBool()) {
        const animationName = childBuf.readS() ?? "";
        const skinName = childBuf.readS() ?? "";
        defaultValue = `${defaultValue || "0,p"},${animationName},${skinName}`;
      }
    }
    if (pages.length > 0) gear.setPages(pages.join(","));
    if (values.length > 0) gear.setValues(values.join("|"));
    gear.setDefaultValue(defaultValue);
    child.addGear(gear);
    childBuf.pos = nextPos;
  }
}
function decodeGearStatus(buf, gearType, _version) {
  switch (gearType) {
    case 1 /* XY */:
      return `${buf.getInt32()},${buf.getInt32()}`;
    case 2 /* Size */:
      return [
        formatBinaryNumber(buf.getInt32()),
        formatBinaryNumber(buf.getInt32()),
        formatBinaryNumber(buf.getFloat32()),
        formatBinaryNumber(buf.getFloat32())
      ].join(",");
    case 3 /* Look */:
      return [
        formatBinaryNumber(buf.getFloat32()),
        formatBinaryNumber(buf.getFloat32()),
        buf.readBool() ? "true" : "false",
        buf.readBool() ? "true" : "false"
      ].join(",");
    case 4 /* Color */:
      return `${readColorValue(buf, true)},${readColorValue(buf, true)}`;
    case 5 /* Animation */: {
      const playing = buf.readBool() ? "p" : "s";
      return `${buf.getInt32()},${playing}`;
    }
    case 6 /* Text */:
    case 7 /* Icon */:
      return buf.readS() ?? "";
    case 9 /* FontSize */:
      return `${buf.getInt32()}`;
    default:
      return "";
  }
}
function decodeChildBlock3(resource, child, childBuf) {
  if (!childBuf.seek(0, 3) || remainingBytes(childBuf) < 1) return;
  const childIds = resource.listChildren().map((entry) => entry.getId());
  decodeRelationBlock(childBuf, childIds, (relation) => child.addRelation(relation));
}
function decodeComponentControllers(doc, resource, buf) {
  if (!buf.seek(0, 1) || remainingBytes(buf) < 2) return;
  const controllerCount = buf.getInt16();
  for (let controllerIndex = 0; controllerIndex < controllerCount && remainingBytes(buf) >= 2; controllerIndex += 1) {
    const chunkSize = buf.getInt16();
    const nextPos = buf.pos + chunkSize;
    const controllerBuf = new ByteBuffer(buf.buffer, buf.byteOffset + buf.pos, chunkSize);
    controllerBuf.stringTable = buf.stringTable;
    controllerBuf.version = buf.version;
    const controller = doc.createController(`controller${controllerIndex}`);
    if (controllerBuf.seek(0, 0) && remainingBytes(controllerBuf) >= 2) {
      controller.setName(controllerBuf.readS() ?? `controller${controllerIndex}`).setAutoRadioGroupDepth(remainingBytes(controllerBuf) >= 1 ? controllerBuf.readBool() : false);
    }
    if (controllerBuf.seek(0, 1) && remainingBytes(controllerBuf) >= 2) {
      const pageCount = controllerBuf.getInt16();
      for (let pageIndex = 0; pageIndex < pageCount && remainingBytes(controllerBuf) >= 4; pageIndex += 1) {
        const pageId = controllerBuf.readS() ?? `page${pageIndex}`;
        const pageName = controllerBuf.readS() ?? pageId;
        const page = doc.createControllerPage(pageName);
        page.setId(pageId).setName(pageName);
        controller.addPage(page);
      }
      let homePageIndex = 0;
      if (controllerBuf.version >= 2 && remainingBytes(controllerBuf) >= 1) {
        const homePageType = controllerBuf.getUint8();
        switch (homePageType) {
          case 1:
            if (remainingBytes(controllerBuf) >= 2) homePageIndex = controllerBuf.getInt16();
            break;
          case 2:
            homePageIndex = 0;
            break;
          case 3:
            if (remainingBytes(controllerBuf) >= 2) controllerBuf.readS();
            homePageIndex = 0;
            break;
          default:
            homePageIndex = 0;
            break;
        }
      }
      if (controller.listPages().length > 0) {
        const maxIndex = controller.listPages().length - 1;
        controller.setSelectedIndex(Math.min(Math.max(homePageIndex, 0), maxIndex));
      }
    }
    if (controllerBuf.seek(0, 2) && remainingBytes(controllerBuf) >= 2) {
      const actionCount = controllerBuf.getInt16();
      for (let actionIndex = 0; actionIndex < actionCount && remainingBytes(controllerBuf) >= 2; actionIndex += 1) {
        const actionSize = controllerBuf.getInt16();
        const actionNextPos = controllerBuf.pos + actionSize;
        const actionBuf = new ByteBuffer(controllerBuf.buffer, controllerBuf.byteOffset + controllerBuf.pos, actionSize);
        actionBuf.stringTable = controllerBuf.stringTable;
        actionBuf.version = controllerBuf.version;
        const action = doc.createControllerAction(`${controller.getName()}_action${actionIndex}`);
        if (remainingBytes(actionBuf) >= 1) {
          const actionType = actionBuf.getUint8();
          action.setActionType(actionType);
          if (remainingBytes(actionBuf) >= 2) {
            action.setFromPage(actionBuf.readSArray(actionBuf.getInt16()).filter((pageId) => pageId !== ""));
          }
          if (remainingBytes(actionBuf) >= 2) {
            action.setToPage(actionBuf.readSArray(actionBuf.getInt16()).filter((pageId) => pageId !== ""));
          }
          switch (actionType) {
            case 0 /* PlayTransition */:
              if (remainingBytes(actionBuf) >= 11) {
                action.setTransitionName(actionBuf.readS() ?? "").setPlayTimes(actionBuf.getInt32()).setDelay(actionBuf.getFloat32()).setStopOnExit(actionBuf.readBool());
              }
              break;
            case 1 /* ChangePage */:
              if (remainingBytes(actionBuf) >= 6) {
                action.setObjectId(actionBuf.readS() ?? "").setControllerName(actionBuf.readS() ?? "").setTargetPage(actionBuf.readS() ?? "");
              }
              break;
            default:
              break;
          }
        }
        controller.addAction(action);
        controllerBuf.pos = actionNextPos;
      }
    }
    resource.addController(controller);
    buf.pos = nextPos;
  }
}
function decodeComponentRelations(resource, buf) {
  if (!buf.seek(0, 3) || remainingBytes(buf) < 1) return;
  const childIds = resource.listChildren().map((child) => child.getId());
  decodeRelationBlock(buf, childIds, (relation) => resource.addRelation(relation));
}
function readPathData(buf) {
  if (remainingBytes(buf) < 4) return "";
  const pointCount = buf.getInt32();
  const parts = [];
  for (let pointIndex = 0; pointIndex < pointCount && remainingBytes(buf) >= 1; pointIndex += 1) {
    const curveType = buf.getUint8();
    parts.push(`${curveType}`);
    switch (curveType) {
      case 1:
        for (let valueIndex = 0; valueIndex < 4 && remainingBytes(buf) >= 4; valueIndex += 1) {
          parts.push(formatBinaryNumber(buf.getFloat32()));
        }
        break;
      case 2:
        for (let valueIndex = 0; valueIndex < 6 && remainingBytes(buf) >= 4; valueIndex += 1) {
          parts.push(formatBinaryNumber(buf.getFloat32()));
        }
        parts.push("0");
        break;
      default:
        for (let valueIndex = 0; valueIndex < 2 && remainingBytes(buf) >= 4; valueIndex += 1) {
          parts.push(formatBinaryNumber(buf.getFloat32()));
        }
        break;
    }
  }
  return parts.join(",");
}
function readTransitionValue(actionType, buf, version) {
  switch (actionType) {
    case 0 /* XY */: {
      const hasX = buf.readBool();
      const hasY = buf.readBool();
      const value1 = buf.getFloat32();
      const value2 = buf.getFloat32();
      const positionsInPercent = buf.readBool();
      if (positionsInPercent) {
        return [
          hasX ? "0" : "-",
          hasY ? "0" : "-",
          formatBinaryNumber(value1),
          formatBinaryNumber(value2)
        ];
      }
      return [
        hasX ? formatBinaryNumber(value1) : "-",
        hasY ? formatBinaryNumber(value2) : "-"
      ];
    }
    case 1 /* Size */:
    case 3 /* Pivot */:
    case 13 /* Skew */: {
      const hasX = buf.readBool();
      const hasY = buf.readBool();
      const value1 = buf.getFloat32();
      const value2 = buf.getFloat32();
      return [
        hasX ? formatBinaryNumber(value1) : "-",
        hasY ? formatBinaryNumber(value2) : "-"
      ];
    }
    case 2 /* Scale */:
      return [formatBinaryNumber(buf.getFloat32()), formatBinaryNumber(buf.getFloat32())];
    case 4 /* Alpha */:
    case 5 /* Rotation */:
      return [formatBinaryNumber(buf.getFloat32())];
    case 6 /* Color */:
      return [readColorValue(buf, false)];
    case 7 /* Animation */: {
      const playing = buf.readBool() ? "p" : "s";
      const frame = `${buf.getInt32()}`;
      const result = [frame, playing];
      if (version >= 6) {
        const animationName = buf.readS() ?? "";
        const skinName = buf.readS() ?? "";
        if (animationName || skinName) {
          result.push(animationName, skinName);
        }
      }
      return result;
    }
    case 8 /* Visible */:
      return [buf.readBool() ? "true" : "false"];
    case 9 /* Sound */:
      return [buf.readS() ?? "", `${Math.round(buf.getFloat32() * 100)}`];
    case 10 /* Transition */:
      return [buf.readS() ?? "", `${buf.getInt32()}`];
    case 11 /* Shake */:
      return [formatBinaryNumber(buf.getFloat32()), formatBinaryNumber(buf.getFloat32())];
    case 12 /* ColorFilter */:
      return [
        formatBinaryNumber(buf.getFloat32()),
        formatBinaryNumber(buf.getFloat32()),
        formatBinaryNumber(buf.getFloat32()),
        formatBinaryNumber(buf.getFloat32())
      ];
    case 14 /* Text */:
    case 15 /* Icon */:
      return [buf.readS() ?? ""];
    default:
      return [];
  }
}
function decodeComponentTransitions(doc, resource, buf) {
  if (!buf.seek(0, 5) || remainingBytes(buf) < 2) return;
  const transitionCount = buf.getInt16();
  const childIds = resource.listChildren().map((child) => child.getId());
  for (let transitionIndex = 0; transitionIndex < transitionCount && remainingBytes(buf) >= 2; transitionIndex += 1) {
    const chunkSize = buf.getInt16();
    const nextPos = buf.pos + chunkSize;
    const transition = doc.createTransition(buf.readS() ?? `transition${transitionIndex}`);
    transition.setOptions(buf.getInt32()).setAutoPlay(buf.readBool()).setAutoPlayTimes(buf.getInt32()).setAutoPlayDelay(buf.getFloat32());
    const itemCount = buf.getInt16();
    for (let itemIndex = 0; itemIndex < itemCount && remainingBytes(buf) >= 2; itemIndex += 1) {
      const itemSize = buf.getInt16();
      const itemNextPos = buf.pos + itemSize;
      const itemBuf = new ByteBuffer(buf.buffer, buf.byteOffset + buf.pos, itemSize);
      itemBuf.stringTable = buf.stringTable;
      itemBuf.version = buf.version;
      const item = doc.createTransitionItem(`${transition.getName()}_${itemIndex}`);
      if (itemBuf.seek(0, 0) && remainingBytes(itemBuf) >= 10) {
        const actionType = itemBuf.getUint8();
        item.setActionType(actionType).setTime(itemBuf.getFloat32() * transition.getFps()).setTargetId(childIds[itemBuf.getInt16()] ?? "").setLabel(itemBuf.readS() ?? "").setTween(itemBuf.readBool());
      }
      if (item.getTween() && itemBuf.seek(0, 1) && remainingBytes(itemBuf) >= 14) {
        item.setDuration(itemBuf.getFloat32() * transition.getFps()).setEaseType(itemBuf.getUint8()).setRepeat(itemBuf.getInt32()).setYoyo(itemBuf.readBool()).setEndLabel(itemBuf.readS() ?? "");
      }
      if (itemBuf.seek(0, 2)) {
        item.setStartValue(readTransitionValue(item.getActionType(), itemBuf, itemBuf.version));
      }
      if (item.getTween() && itemBuf.seek(0, 3)) {
        item.setEndValue(readTransitionValue(item.getActionType(), itemBuf, itemBuf.version));
        if (itemBuf.version >= 2) {
          item.setPath(readPathData(itemBuf));
        }
        if (itemBuf.version >= 4 && item.getEaseType() === 31) {
          item.setCustomEasePath(readPathData(itemBuf));
        }
      }
      transition.addItem(item);
      buf.pos = itemNextPos;
    }
    resource.addTransition(transition);
    buf.pos = nextPos;
  }
}
function decodeComponentDisplayList(doc, resource, buf) {
  if (!buf.seek(0, 2) || remainingBytes(buf) < 2) return;
  const childCount = buf.getInt16();
  const entries = [];
  for (let index = 0; index < childCount && remainingBytes(buf) >= 2; index += 1) {
    const chunkSize = buf.getInt16();
    const nextPos = buf.pos + chunkSize;
    const childBuf = new ByteBuffer(buf.buffer, buf.byteOffset + buf.pos, chunkSize);
    childBuf.stringTable = buf.stringTable;
    childBuf.version = buf.version;
    const child = decodeChildBlock0(doc, childBuf);
    if (child) {
      const groupIndex = decodeChildBlock1(child, childBuf);
      resource.addChild(child);
      entries.push({ child, groupIndex, childBuf });
    }
    buf.pos = nextPos;
  }
  for (const entry of entries) {
    if (entry.groupIndex < 0) continue;
    const target = entries[entry.groupIndex]?.child;
    if (target) {
      if ("setGroup" in entry.child && typeof entry.child.setGroup === "function") {
        entry.child.setGroup(target.getId());
      }
    }
  }
  for (const entry of entries) {
    decodeChildBlock2(doc, resource, entry.child, entry.childBuf);
    decodeChildBlock3(resource, entry.child, entry.childBuf);
    if (entry.child.propertyType === "GTextInput") {
      decodeChildBlock4TextInput(entry.child, entry.childBuf);
    } else if (entry.child.propertyType === "GComponent" || entry.child.propertyType === "GList" || entry.child.propertyType === "GTree" || entry.child.propertyType === "GButton" || entry.child.propertyType === "GLabel" || entry.child.propertyType === "GComboBox" || entry.child.propertyType === "GProgressBar" || entry.child.propertyType === "GSlider" || entry.child.propertyType === "GScrollBar") {
      decodeChildBlock4ComponentLike(resource, entry.child, entry.childBuf);
    }
    decodeChildBlock5(entry.child, entry.childBuf);
    decodeChildBlock6(resource, entry.child, entry.childBuf);
  }
}
function decodeComponentHeader(resource, buf) {
  if (!buf.seek(0, 0)) return;
  if (remainingBytes(buf) < 11) return;
  resource.setSize(buf.getInt32(), buf.getInt32());
  if (buf.readBool()) {
    resource.setMinWidth(buf.getInt32()).setMaxWidth(buf.getInt32()).setMinHeight(buf.getInt32()).setMaxHeight(buf.getInt32());
  }
  if (buf.readBool()) {
    resource.setPivotX(buf.getFloat32()).setPivotY(buf.getFloat32()).setPivotAsAnchor(buf.readBool());
  }
  if (buf.readBool()) {
    resource.setMargin([
      buf.getInt32(),
      buf.getInt32(),
      buf.getInt32(),
      buf.getInt32()
    ]);
  }
  resource.setOverflow(buf.getUint8());
  if (buf.readBool()) {
    resource.setClipSoftness([buf.getInt32(), buf.getInt32()]);
  }
}
function decodeComponentAdvancedProps(resource, buf) {
  if (!buf.seek(0, 4)) return;
  if (remainingBytes(buf) < 15) return;
  resource.setCustomData(buf.readS() ?? "").setOpaque(buf.readBool());
  const maskIndex = buf.getInt16();
  if (maskIndex >= 0) {
    resource.setMask(resource.listChildren()[maskIndex]?.getId() ?? "");
    resource.setReversedMask(buf.readBool());
  }
  const hitTestId = buf.readS();
  const hitTestArg1 = buf.getInt32();
  const hitTestArg2 = buf.getInt32();
  if (hitTestId) {
    resource.setHitTest(`${hitTestId},${hitTestArg1},${hitTestArg2}`);
  } else if (hitTestArg1 === 1 && hitTestArg2 >= 0) {
    resource.setHitTest(resource.listChildren()[hitTestArg2]?.getId() ?? "");
  }
  if (buf.version >= 5 && remainingBytes(buf) >= 4) {
    resource.setAddedToStageSound(buf.readS() ?? "").setRemovedFromStageSound(buf.readS() ?? "");
  }
}
function decodeComponentExtensionDef(resource, buf, extensionType) {
  if (!extensionType) return;
  if (!buf.seek(0, 6)) return;
  switch (extensionType) {
    case "Button":
      if (remainingBytes(buf) < 12) return;
      resource.setButtonMode(buf.getUint8()).setSound(buf.readS() ?? "").setSoundVolumeScale(buf.getFloat32()).setDownEffect(buf.getUint8()).setDownEffectValue(buf.getFloat32());
      break;
    case "ComboBox":
      if (remainingBytes(buf) < 2) return;
      resource.setDropdown(buf.readS() ?? "");
      break;
    case "ProgressBar":
      if (remainingBytes(buf) < 2) return;
      resource.setTitleType(buf.getUint8()).setReverse(buf.readBool());
      break;
    case "Slider":
      if (remainingBytes(buf) < 4) return;
      resource.setTitleType(buf.getUint8()).setReverse(buf.readBool()).setWholeNumbers(buf.readBool()).setChangeOnClick(buf.readBool());
      break;
    case "ScrollBar":
      if (remainingBytes(buf) < 1) return;
      resource.setFixedGripSize(buf.readBool());
      break;
    default:
      break;
  }
}
function decodeComponentScrollPane(resource, buf) {
  if (!buf.seek(0, 7)) return;
  if (remainingBytes(buf) < 14) return;
  resource.setScrollType(buf.getUint8()).setScrollBarDisplay(buf.getUint8()).setScrollBarFlags(buf.getInt32());
  if (buf.readBool()) {
    resource.setScrollBarMargin([
      buf.getInt32(),
      buf.getInt32(),
      buf.getInt32(),
      buf.getInt32()
    ]);
  }
  resource.setVtScrollBarRes(buf.readS() ?? "").setHzScrollBarRes(buf.readS() ?? "").setHeaderRes(buf.readS() ?? "").setFooterRes(buf.readS() ?? "");
}
function decodeComponentDefinition(resource, rawData, extensionTypeCode, doc) {
  const extensionType = COMPONENT_EXTENSION_TYPE_NAMES[extensionTypeCode] ?? "";
  resource.setExtensionType(extensionType);
  if (rawData.byteLength === 0) return;
  const componentBuf = new ByteBuffer(rawData.buffer, rawData.byteOffset, rawData.byteLength);
  componentBuf.stringTable = rawData.stringTable;
  componentBuf.version = rawData.version;
  decodeComponentHeader(resource, componentBuf);
  decodeComponentControllers(doc, resource, componentBuf);
  decodeComponentDisplayList(doc, resource, componentBuf);
  decodeComponentRelations(resource, componentBuf);
  decodeComponentAdvancedProps(resource, componentBuf);
  decodeComponentTransitions(doc, resource, componentBuf);
  decodeComponentExtensionDef(resource, componentBuf, extensionType);
  decodeComponentScrollPane(resource, componentBuf);
}

// packages/core/src/io/binary-reader.ts
var BinItemType = {
  Image: 0,
  MovieClip: 1,
  Sound: 2,
  Component: 3,
  Atlas: 4,
  Font: 5,
  Swf: 6,
  Misc: 7,
  Spine: 8,
  DragonBones: 9
};
function normalizePackageResourcePath(path3) {
  const normalized = path3.replace(/\\/g, "/").trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+/, "").replace(/\/+$/, "")}/`;
}
function fileNameSuffix(fileName) {
  const baseName = fileName.split(/[\\/]/).pop() ?? fileName;
  const suffixMatch = /((?:\.[^.\\/]+)+)$/u.exec(baseName);
  return suffixMatch?.[1] ?? "";
}
function normalizePublishedImageFileName(name) {
  return `${name || "image"}.png`;
}
function normalizePublishedSoundFileName(name, fileName) {
  if (!name) return fileName;
  const suffix = fileNameSuffix(fileName) || ".wav";
  return `${name}${suffix}`;
}
function findPackageById(doc, id) {
  if (!id) return null;
  return doc.getRoot().getPackageById(id);
}
function getOrCreatePackage(doc, id, name) {
  const existing = findPackageById(doc, id);
  if (existing) {
    if (name) existing.setName(name);
    return existing;
  }
  const pkg = doc.createPackage(name);
  pkg.setId(id);
  return pkg;
}
function parseAtlasIndex(id) {
  const match = /^atlas(\d+)$/.exec(id);
  return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
}
function toRawBinarySlice(buf) {
  return {
    buffer: buf.buffer,
    byteOffset: buf.byteOffset,
    byteLength: buf.byteLength
  };
}
function getPackageExtras(pkg) {
  return pkg.getExtras();
}
function getComponentExtras(resource) {
  return resource.getExtras();
}
function decodeMovieClipFrames(doc, resource, buf) {
  if (buf.byteLength === 0) return;
  const indexTablePos = buf.pos;
  if (buf.seek(indexTablePos, 0)) {
    resource.setInterval(buf.getInt32());
    resource.setSwing(buf.readBool());
    resource.setRepeatDelay(buf.getInt32());
  }
  if (!buf.seek(indexTablePos, 1)) return;
  const frameCount = buf.getInt16();
  for (let index = 0; index < frameCount; index += 1) {
    const chunkSize = buf.getInt16();
    const nextPos = buf.pos + chunkSize;
    const frame = doc.createMovieFrame(`${resource.getId()}_${index}`);
    frame.setRectX(buf.getInt32()).setRectY(buf.getInt32()).setRectWidth(buf.getInt32()).setRectHeight(buf.getInt32()).setAddDelay(buf.getInt32()).setSpriteId(buf.readS() ?? "");
    resource.addFrame(frame);
    buf.pos = nextPos;
  }
}
function decodeChar(charId) {
  if (charId <= 0) return "";
  try {
    return String.fromCodePoint(charId);
  } catch {
    return "";
  }
}
function decodeFontGlyphs(doc, resource, buf) {
  if (buf.byteLength === 0) return;
  const indexTablePos = buf.pos;
  if (buf.seek(indexTablePos, 0)) {
    resource.setTtf(buf.readBool()).setTint(buf.readBool()).setAutoScale(buf.readBool()).setHasChannel(buf.readBool()).setFontSize(buf.getInt32()).setXAdvance(buf.getInt32()).setLineHeight(buf.getInt32());
  }
  if (!buf.seek(indexTablePos, 1)) return;
  const glyphCount = buf.getInt32();
  for (let index = 0; index < glyphCount; index += 1) {
    const chunkSize = buf.getInt16();
    const nextPos = buf.pos + chunkSize;
    const charId = buf.getInt16();
    const glyph = doc.createFontGlyph(`${resource.getId()}_${charId || index}`);
    glyph.setCharId(charId).setChar(decodeChar(charId)).setImg(buf.readS() ?? "").setX(buf.getInt32()).setY(buf.getInt32()).setXOffset(buf.getInt32()).setYOffset(buf.getInt32()).setWidth(buf.getInt32()).setHeight(buf.getInt32()).setAdvance(buf.getInt32()).setChannel(buf.getUint8());
    resource.addGlyph(glyph);
    buf.pos = nextPos;
  }
}
var BinaryReader = class {
  _fs;
  constructor(fs3) {
    this._fs = fs3;
  }
  async read(filePath) {
    const doc = new Document();
    await this.readIntoDocument(doc, filePath);
    return doc;
  }
  async readIntoDocument(doc, filePath) {
    const raw = await this._fs.readFileRaw(filePath);
    const outer = new ByteBuffer(raw.buffer, raw.byteOffset, raw.byteLength);
    return this._parsePackage(outer, doc);
  }
  async readMany(filePaths) {
    const doc = new Document();
    for (const filePath of filePaths) {
      await this.readIntoDocument(doc, filePath);
    }
    return doc;
  }
  _parsePackage(outer, doc) {
    if (outer.getUint32() !== FGUI_MAGIC) {
      throw new Error("Invalid FairyGUI binary file: bad magic");
    }
    outer.version = outer.getInt32();
    const compressed = outer.readBool();
    const packageId = outer.readUTFString();
    const packageName = outer.readUTFString();
    outer.skip(20);
    let buf;
    if (compressed) {
      const remaining = new Uint8Array(
        outer.buffer,
        outer.byteOffset + outer.pos,
        outer.byteLength - outer.pos
      );
      const decompressed = inflateRaw_1(remaining);
      buf = new ByteBuffer(decompressed.buffer, 0, decompressed.byteLength);
    } else {
      buf = outer;
    }
    buf.version = outer.version;
    const indexTablePos = buf.pos;
    const ver2 = buf.version >= 2;
    buf.seek(indexTablePos, 4);
    const strCnt = buf.getInt32();
    const stringTable = [];
    for (let i = 0; i < strCnt; i++) stringTable[i] = buf.readUTFString();
    buf.stringTable = stringTable;
    if (buf.seek(indexTablePos, 5)) {
      const cnt = buf.readInt32();
      for (let i = 0; i < cnt; i++) {
        const index = buf.readUint16();
        const len = buf.readInt32();
        stringTable[index] = buf.getCustomString(len);
      }
    }
    buf.seek(indexTablePos, 0);
    const depCnt = buf.getInt16();
    const dependencies = [];
    for (let i = 0; i < depCnt; i++) {
      dependencies.push({ id: buf.readS() ?? "", name: buf.readS() ?? "" });
    }
    let branchIncluded = false;
    let packageBranches = [];
    if (ver2) {
      const branchCnt = buf.getInt16();
      if (branchCnt > 0) {
        packageBranches = buf.readSArray(branchCnt);
        branchIncluded = true;
      }
    }
    if (packageBranches.length > 0) {
      for (const branchName of packageBranches) {
        doc.getRoot().addBranch(branchName);
      }
    }
    const pkg = getOrCreatePackage(doc, packageId, packageName);
    if (pkg.listResources().length > 0 || pkg.listAtlases().length > 0) {
      throw new Error(`Package "${packageName}" (${packageId}) has already been read.`);
    }
    const atlasMap = /* @__PURE__ */ new Map();
    for (const dep of dependencies) {
      if (!dep.id || dep.id === packageId) continue;
      const depPkg = getOrCreatePackage(doc, dep.id, dep.name || dep.id);
      pkg.addDependency(depPkg);
    }
    buf.seek(indexTablePos, 1);
    const itemCnt = buf.getUint16();
    for (let i = 0; i < itemCnt; i++) {
      const nextPos = buf.getInt32() + buf.pos;
      const itemType = buf.readByte();
      const itemId = buf.readS() ?? "";
      const itemName = buf.readS() ?? "";
      const itemPath = normalizePackageResourcePath(buf.readS() ?? "");
      const itemFile = buf.readS() ?? "";
      const exported = buf.readBool();
      const width = buf.getInt32();
      const height = buf.getInt32();
      let createdResource = null;
      switch (itemType) {
        case BinItemType.Image: {
          const res = doc.createImageResource(itemName);
          res.setId(itemId).setFileName(normalizePublishedImageFileName(itemName)).setPath(itemPath).setExported(exported).setWidth(width).setHeight(height);
          const scaleOpt = buf.readByte();
          if (scaleOpt === 1) {
            const x = buf.getInt32(), y = buf.getInt32();
            const w = buf.getInt32(), h = buf.getInt32();
            buf.getInt32();
            res.setScaleOption(1).setScale9Grid([x, y, w, h]);
          } else if (scaleOpt === 2) {
            res.setScaleOption(2);
          }
          res.setSmoothing(buf.readBool());
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.MovieClip: {
          const res = doc.createMovieClipResource(itemName);
          res.setId(itemId).setFileName(`${itemName}.jta`).setPath(itemPath).setExported(exported).setWidth(width).setHeight(height);
          res.setSmoothing(buf.readBool());
          const rawFrames = buf.readBuffer();
          decodeMovieClipFrames(doc, res, rawFrames);
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.Sound: {
          const res = doc.createSoundResource(itemName);
          res.setId(itemId).setPath(itemPath).setFile(normalizePublishedSoundFileName(itemName, itemFile)).setExported(exported);
          res.setExtras({ ...res.getExtras(), _publishedFile: itemFile });
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.Misc: {
          const res = doc.createMiscResource(itemName);
          res.setId(itemId).setPath(itemPath).setFile(itemFile).setExported(exported);
          res.setExtras({ ...res.getExtras(), _publishedFile: itemFile });
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.Component: {
          const res = doc.createComponent(itemName);
          res.setId(itemId).setPath(itemPath).setExported(exported).setSize(width, height);
          const extensionTypeCode = buf.readByte();
          const rawData = buf.readBuffer();
          decodeComponentDefinition(res, rawData, extensionTypeCode, doc);
          res.setExtras({
            ...getComponentExtras(res),
            _rawBinary: toRawBinarySlice(rawData)
          });
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.Font: {
          const res = doc.createFontResource(itemName);
          res.setId(itemId).setPath(itemPath).setExported(exported);
          const rawGlyphs = buf.readBuffer();
          decodeFontGlyphs(doc, res, rawGlyphs);
          res.setFileName(`${itemName}${res.listGlyphs().length === 0 ? ".ttf" : ".fnt"}`);
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.Atlas: {
          const atlas2 = doc.createAtlas(itemId);
          atlas2.setIndex(parseAtlasIndex(itemId)).setFile(itemFile).setWidth(width).setHeight(height);
          pkg.addAtlas(atlas2);
          atlasMap.set(itemId, atlas2);
          break;
        }
        case BinItemType.Spine: {
          const res = doc.createSpineResource(itemName);
          res.setId(itemId).setPath(itemPath).setFile(itemFile).setExported(exported).setWidth(width).setHeight(height).setAnchor(buf.getFloat32(), buf.getFloat32());
          res.setExtras({ ...res.getExtras(), _publishedFile: itemFile });
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        case BinItemType.DragonBones: {
          const res = doc.createDragonBonesResource(itemName);
          res.setId(itemId).setPath(itemPath).setFile(itemFile).setExported(exported).setWidth(width).setHeight(height).setAnchor(buf.getFloat32(), buf.getFloat32());
          res.setExtras({ ...res.getExtras(), _publishedFile: itemFile });
          pkg.addResource(res);
          createdResource = res;
          break;
        }
        default:
          break;
      }
      if (ver2) {
        const branchName = buf.readS() ?? "";
        const branchCnt2 = buf.getUint8();
        let branchItemIds = [];
        if (branchCnt2 > 0) {
          if (branchIncluded) branchItemIds = buf.readSArray(branchCnt2);
          else branchItemIds = [buf.readS() ?? ""];
        }
        const highResCnt = buf.getUint8();
        if (highResCnt > 0) buf.readSArray(highResCnt);
        if (createdResource) {
          createdResource.setPath(itemPath);
          createdResource.setBranch(branchName);
          createdResource.setBranchItemIds(branchItemIds);
        }
      }
      buf.pos = nextPos;
    }
    buf.seek(indexTablePos, 2);
    const spriteCnt = buf.getUint16();
    const sprites = [];
    for (let i = 0; i < spriteCnt; i++) {
      const nextPos = buf.getUint16() + buf.pos;
      const itemId = buf.readS() ?? "";
      const atlasId = buf.readS() ?? "";
      const x = buf.getInt32(), y = buf.getInt32();
      const w = buf.getInt32(), h = buf.getInt32();
      const rotated = buf.readBool();
      let offsetX = 0;
      let offsetY = 0;
      let originalWidth = rotated ? h : w;
      let originalHeight = rotated ? w : h;
      if (ver2 && buf.readBool()) {
        offsetX = buf.getInt32();
        offsetY = buf.getInt32();
        originalWidth = buf.getInt32();
        originalHeight = buf.getInt32();
      }
      sprites.push({ itemId, atlasId, x, y, w, h, rotated, offsetX, offsetY, originalWidth, originalHeight });
      const atlas2 = atlasMap.get(atlasId);
      if (atlas2) {
        const sprite = doc.createSprite(itemId);
        sprite.setItemId(itemId).setAtlas(atlas2).setRectX(x).setRectY(y).setRectWidth(w).setRectHeight(h).setRotated(rotated).setOffsetX(offsetX).setOffsetY(offsetY).setOriginalWidth(originalWidth).setOriginalHeight(originalHeight);
        atlas2.addSprite(sprite);
      }
      buf.pos = nextPos;
    }
    pkg.setExtras({ ...getPackageExtras(pkg), sprites });
    const pixelHitTests = /* @__PURE__ */ new Map();
    if (buf.seek(indexTablePos, 3)) {
      const hitTestCnt = buf.getInt16();
      for (let i = 0; i < hitTestCnt; i++) {
        const nextPos = buf.getInt32() + buf.pos;
        const itemId = buf.readS() ?? "";
        buf.getInt32();
        const pixelWidth = buf.getInt32();
        const scaleDenominator = buf.getUint8();
        const byteLength = buf.getInt32();
        const pixels = new Uint8Array(buf.buffer, buf.byteOffset + buf.pos, byteLength).slice();
        buf.skip(byteLength);
        if (itemId) {
          pixelHitTests.set(itemId, {
            itemId,
            pixelWidth,
            scaleDenominator,
            pixels
          });
        }
        buf.pos = nextPos;
      }
    }
    for (const resource of pkg.listResources()) {
      if (resource.propertyType !== "ImageResource") continue;
      const pixelHitTest = pixelHitTests.get(resource.getId());
      if (!pixelHitTest) continue;
      resource.setPixelHitTestData({
        pixelWidth: pixelHitTest.pixelWidth,
        scaleDenominator: pixelHitTest.scaleDenominator,
        pixels: pixelHitTest.pixels
      });
    }
    _hydrateChildSizesFromResources(pkg);
    return doc;
  }
};
function _hydrateChildSizesFromResources(pkg) {
  const resourceSizeMap = /* @__PURE__ */ new Map();
  for (const res of pkg.listResources()) {
    const id = res.getId();
    if (!id) continue;
    const hasSize = "getWidth" in res && "getHeight" in res;
    if (!hasSize) continue;
    const w = res.getWidth();
    const h = res.getHeight();
    if (w > 0 || h > 0) {
      resourceSizeMap.set(id, { w, h });
    }
  }
  for (const res of pkg.listResources()) {
    if (res.propertyType !== "Component") continue;
    const comp = res;
    const children = comp.listChildren();
    for (const child of children) {
      const type = child.propertyType;
      if (type !== "GImage" && type !== "GMovieClip" && type !== "GComponent" && type !== "GButton" && type !== "GLabel" && type !== "GList" && type !== "GTree" && type !== "GComboBox" && type !== "GProgressBar" && type !== "GSlider" && type !== "GScrollBar" && type !== "GLoader3D") {
        continue;
      }
      const childW = child.getWidth?.() ?? 0;
      const childH = child.getHeight?.() ?? 0;
      if (childW > 0 || childH > 0) continue;
      const src = child.getSrc?.();
      if (!src) continue;
      const srcSize = resourceSizeMap.get(src);
      if (!srcSize) continue;
      child.setSize?.(srcSize.w, srcSize.h);
    }
  }
}

// packages/core/src/io/write-buffer.ts
var WriteBuffer = class {
  _buf;
  _view;
  _pos = 0;
  /** Maps string → index in the string table. Built via {@link addString}. */
  _stringMap;
  /** Ordered list of strings for the string table. */
  _strings;
  /** Raw custom strings written to block 5, keyed by string table index. */
  _customStrings;
  constructor(initialSize = 4096, parent) {
    this._buf = new ArrayBuffer(initialSize);
    this._view = new DataView(this._buf);
    if (parent) {
      this._stringMap = parent._stringMap;
      this._strings = parent._strings;
      this._customStrings = parent._customStrings;
    } else {
      this._stringMap = /* @__PURE__ */ new Map();
      this._strings = [];
      this._customStrings = [];
    }
  }
  get pos() {
    return this._pos;
  }
  set pos(v) {
    this._pos = v;
  }
  /** Returns a trimmed Uint8Array of everything written so far. */
  toUint8Array() {
    return new Uint8Array(this._buf, 0, this._pos);
  }
  _ensure(extra) {
    const needed = this._pos + extra;
    if (needed <= this._buf.byteLength) return;
    let newLen = this._buf.byteLength;
    while (newLen < needed) newLen *= 2;
    const newBuf = new ArrayBuffer(newLen);
    new Uint8Array(newBuf).set(new Uint8Array(this._buf));
    this._buf = newBuf;
    this._view = new DataView(this._buf);
  }
  writeUint8(v) {
    this._ensure(1);
    this._view.setUint8(this._pos++, v);
  }
  writeInt8(v) {
    this._ensure(1);
    this._view.setInt8(this._pos++, v);
  }
  writeUint16(v) {
    this._ensure(2);
    this._view.setUint16(this._pos, v, false);
    this._pos += 2;
  }
  writeInt16(v) {
    this._ensure(2);
    this._view.setInt16(this._pos, v, false);
    this._pos += 2;
  }
  writeUint32(v) {
    this._ensure(4);
    this._view.setUint32(this._pos, v, false);
    this._pos += 4;
  }
  writeInt32(v) {
    this._ensure(4);
    this._view.setInt32(this._pos, v, false);
    this._pos += 4;
  }
  writeFloat32(v) {
    this._ensure(4);
    this._view.setFloat32(this._pos, v, false);
    this._pos += 4;
  }
  writeBool(v) {
    this.writeUint8(v ? 1 : 0);
  }
  /** Write a uint16-prefixed UTF-8 string. */
  writeUTFString(s) {
    const encoded = new TextEncoder().encode(s);
    this.writeUint16(encoded.byteLength);
    this._ensure(encoded.byteLength);
    new Uint8Array(this._buf, this._pos, encoded.byteLength).set(encoded);
    this._pos += encoded.byteLength;
  }
  /** Write raw bytes (no length prefix). */
  writeBytes(data) {
    this._ensure(data.byteLength);
    new Uint8Array(this._buf, this._pos, data.byteLength).set(data);
    this._pos += data.byteLength;
  }
  /** Write a uint32-prefixed sub-buffer. */
  writeBuffer(data) {
    this.writeUint32(data.byteLength);
    this.writeBytes(data);
  }
  /**
   * Register a string in the string table and return its index.
   * Returns NULL_INDEX for null, EMPTY_INDEX for empty string.
   */
  addString(s) {
    if (s === null || s === void 0) return NULL_STRING_INDEX;
    if (s === "") return EMPTY_STRING_INDEX;
    const existing = this._stringMap.get(s);
    if (existing !== void 0) return existing;
    const index = this._strings.length;
    this._strings.push(s);
    this._stringMap.set(s, index);
    return index;
  }
  /** Write a string-table index (uint16). Call addString first to register. */
  writeS(s) {
    this.writeUint16(this.addString(s));
  }
  /**
   * Write a string-table index matching the editor's writeString behavior.
   *
   * @param s - The string to write
   * @param noCache - If true, always push a new string table entry (no dedup).
   *   Used for unique text like component text, button titles.
   * @param treatEmptyAsNull - If true (default), both null and "" → NULL_INDEX.
   *   If false, null → NULL_INDEX but "" → EMPTY_INDEX.
   */
  writeSEx(s, noCache = false, treatEmptyAsNull = true) {
    if (treatEmptyAsNull) {
      if (!s) {
        this.writeUint16(NULL_STRING_INDEX);
        return;
      }
    } else {
      if (s === null || s === void 0) {
        this.writeUint16(NULL_STRING_INDEX);
        return;
      }
      if (s.length === 0) {
        this.writeUint16(EMPTY_STRING_INDEX);
        return;
      }
    }
    if (!noCache) {
      this.writeUint16(this.addString(s));
    } else {
      const index = this._strings.length;
      this._strings.push(s);
      this.writeUint16(index);
    }
  }
  /**
   * Write a color as 4 raw bytes (R, G, B, A) matching the editor's binary format.
   * The editor writes colors as raw bytes, NOT as string table references.
   *
   * @param colorStr - Color string like "#rrggbb", "#rrggbbaa", or "#rgb"
   * @param hasAlpha - Whether to include alpha channel (4th byte).
   *   If true, writes the alpha from the color string (or 0xFF if no alpha in string).
   *   If false, always writes 0xFF for the alpha byte.
   * @param defaultColor - Default color value if colorStr is empty/null (as 0xAARRGGBB uint32)
   */
  writeColor(colorStr, hasAlpha = true, defaultColor = 4278190080) {
    let color = defaultColor;
    if (colorStr && colorStr.length > 0) {
      color = parseHtmlColor(colorStr, hasAlpha);
    }
    this.writeUint8(color >> 16 & 255);
    this.writeUint8(color >> 8 & 255);
    this.writeUint8(color & 255);
    if (hasAlpha) {
      this.writeUint8(color >> 24 & 255);
    } else {
      this.writeUint8(255);
    }
  }
  /** Get the collected string table entries. */
  getStringTable() {
    return this._strings;
  }
  getCustomStrings() {
    return this._customStrings;
  }
  /** Skip `count` bytes (writes zeros). */
  skip(count) {
    this._ensure(count);
    this._pos += count;
  }
};
function parseHtmlColor(s, hasAlpha) {
  let hex = s.startsWith("#") ? s.slice(1) : s;
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  let r = 0, g = 0, b = 0, a = 255;
  if (hex.length === 8) {
    if (hasAlpha) {
      a = parseInt(hex.slice(0, 2), 16);
      r = parseInt(hex.slice(2, 4), 16);
      g = parseInt(hex.slice(4, 6), 16);
      b = parseInt(hex.slice(6, 8), 16);
    } else {
      r = parseInt(hex.slice(2, 4), 16);
      g = parseInt(hex.slice(4, 6), 16);
      b = parseInt(hex.slice(6, 8), 16);
      a = 255;
    }
  } else if (hex.length >= 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  }
  return (a & 255) << 24 | (r & 255) << 16 | (g & 255) << 8 | b & 255;
}

// packages/core/src/io/component-encoder.ts
var BLOCK_COUNT = 8;
function getRuntimeChildren(comp) {
  return comp.listChildren();
}
function getRuntimeChildIndexMap(comp) {
  const children = getRuntimeChildren(comp);
  const map = /* @__PURE__ */ new Map();
  for (let i = 0; i < children.length; i++) {
    const id = children[i].getId?.();
    if (id) map.set(id, i);
  }
  return map;
}
function getChildExtras(child) {
  return child.getExtras?.() ?? {};
}
function getPublishedResourceIdMap(pkg) {
  return (pkg.getExtras?.() ?? {}).publishedEffectiveResourceIds ?? {};
}
function remapLocalResourceId(pkg, value) {
  if (!value) return null;
  return getPublishedResourceIdMap(pkg)[value] ?? value;
}
function resolveChildResourceRef(pkg, child) {
  const src = child.getSrc?.() ?? null;
  const packageId = child.getPackageId?.() ?? "";
  if (!packageId || packageId === pkg.getId()) {
    return {
      src: remapLocalResourceId(pkg, src),
      packageId: null
    };
  }
  return {
    src,
    packageId
  };
}
function remapLocalUiUrl(pkg, value) {
  if (!value || !value.startsWith("ui://")) return value ?? null;
  const pkgId = pkg.getId();
  const raw = value.slice(5);
  if (raw.startsWith(`${pkgId}/`)) return value;
  if (!raw.startsWith(pkgId) || raw.length <= pkgId.length) return value;
  const resourceId = raw.slice(pkgId.length);
  const mappedResourceId = remapLocalResourceId(pkg, resourceId);
  if (!mappedResourceId) return value;
  return `ui://${pkgId}${mappedResourceId}`;
}
function remapLocalUiRefsInText(pkg, value) {
  if (!value) return value ?? null;
  const pkgId = pkg.getId();
  return value.replace(new RegExp(`ui://${pkgId}([0-9a-z]+)`, "gi"), (_match, resourceId) => {
    const mapped = remapLocalResourceId(pkg, resourceId);
    return `ui://${pkgId}${mapped ?? resourceId}`;
  });
}
function _strVal(v) {
  if (v === null || v === void 0) return null;
  if (Array.isArray(v)) return v[0] ?? null;
  return String(v);
}
function _numVal(v, fallback = 0) {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}
function _boolVal(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const normalized = v.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") return true;
    if (normalized === "false" || normalized === "0" || normalized === "") return false;
  }
  return fallback;
}
function encodeComponent(comp, doc, pkg, version = 2, parentBuf) {
  const buf = parentBuf ? new WriteBuffer(4096, parentBuf) : new WriteBuffer(4096);
  const indexTablePos = buf.pos;
  buf.writeUint8(BLOCK_COUNT);
  buf.writeUint8(0);
  const offsetsPos = buf.pos;
  for (let i = 0; i < BLOCK_COUNT; i++) buf.writeUint32(0);
  const block0Offset = buf.pos - indexTablePos;
  _writeComponentHeader(buf, comp);
  const block1Offset = buf.pos - indexTablePos;
  _writeControllers(buf, comp);
  const block2Offset = buf.pos - indexTablePos;
  _writeDisplayList(buf, comp, doc, pkg, version);
  const block3Offset = buf.pos - indexTablePos;
  _writeComponentRelations(buf, comp);
  const block4Offset = buf.pos - indexTablePos;
  _writeAdvancedProps(buf, comp, version);
  const block5Offset = buf.pos - indexTablePos;
  _writeTransitions(buf, comp, version);
  const block6Start = buf.pos;
  _writeExtensionDef(buf, comp, pkg, version);
  const block6Offset = buf.pos > block6Start ? block6Start - indexTablePos : 0;
  let block7Offset = 0;
  const compOverflow = comp.getOverflow?.() ?? 0;
  if (compOverflow === 2) {
    block7Offset = buf.pos - indexTablePos;
    _writeComponentScrollPane(buf, comp, pkg);
  }
  const savedPos = buf.pos;
  buf.pos = offsetsPos;
  buf.writeUint32(block0Offset);
  buf.writeUint32(block1Offset);
  buf.writeUint32(block2Offset);
  buf.writeUint32(block3Offset);
  buf.writeUint32(block4Offset);
  buf.writeUint32(block5Offset);
  buf.writeUint32(block6Offset);
  buf.writeUint32(block7Offset);
  buf.pos = savedPos;
  return buf.toUint8Array();
}
function _writeComponentHeader(buf, comp) {
  const w = comp.getWidth?.() ?? 0;
  const h = comp.getHeight?.() ?? 0;
  buf.writeInt32(w);
  buf.writeInt32(h);
  const minW = comp.getMinWidth?.() ?? 0;
  const maxW = comp.getMaxWidth?.() ?? 0;
  const minH = comp.getMinHeight?.() ?? 0;
  const maxH = comp.getMaxHeight?.() ?? 0;
  const hasRestrict = minW > 0 || maxW > 0 || minH > 0 || maxH > 0;
  buf.writeBool(hasRestrict);
  if (hasRestrict) {
    buf.writeInt32(minW);
    buf.writeInt32(maxW);
    buf.writeInt32(minH);
    buf.writeInt32(maxH);
  }
  const pivotX = comp.getPivotX?.() ?? 0;
  const pivotY = comp.getPivotY?.() ?? 0;
  const hasPivot = pivotX !== 0 || pivotY !== 0;
  buf.writeBool(hasPivot);
  if (hasPivot) {
    buf.writeFloat32(pivotX);
    buf.writeFloat32(pivotY);
    buf.writeBool(comp.getPivotAsAnchor?.() ?? false);
  }
  const margin = comp.getMargin?.() ?? null;
  let hasMargin = false;
  if (margin) {
    if (Array.isArray(margin)) {
      hasMargin = margin.some((v) => v !== 0);
    } else {
      hasMargin = !!(margin.top || margin.bottom || margin.left || margin.right);
    }
  }
  buf.writeBool(hasMargin);
  if (hasMargin) {
    const resolvedMargin = margin;
    if (Array.isArray(resolvedMargin)) {
      buf.writeInt32(resolvedMargin[0] ?? 0);
      buf.writeInt32(resolvedMargin[1] ?? 0);
      buf.writeInt32(resolvedMargin[2] ?? 0);
      buf.writeInt32(resolvedMargin[3] ?? 0);
    } else {
      buf.writeInt32(resolvedMargin.top ?? 0);
      buf.writeInt32(resolvedMargin.bottom ?? 0);
      buf.writeInt32(resolvedMargin.left ?? 0);
      buf.writeInt32(resolvedMargin.right ?? 0);
    }
  }
  buf.writeUint8(comp.getOverflow?.() ?? 0);
  const clipSoft = comp.getClipSoftness?.();
  const hasClipSoftness = !!clipSoft && !!((clipSoft.x ?? 0) || (clipSoft.y ?? 0));
  if (hasClipSoftness) {
    buf.writeBool(true);
    buf.writeInt32(clipSoft.x ?? 0);
    buf.writeInt32(clipSoft.y ?? 0);
  } else {
    buf.writeBool(false);
  }
}
function _writeControllers(buf, comp) {
  const controllers = comp.listControllers();
  buf.writeInt16(controllers.length);
  for (const ctrl of controllers) {
    const ctrlStartPos = buf.pos;
    buf.writeInt16(0);
    const ctrlIndexPos = buf.pos;
    buf.writeUint8(3);
    buf.writeUint8(1);
    const ctrlOffsetsPos = buf.pos;
    buf.writeUint16(0);
    buf.writeUint16(0);
    buf.writeUint16(0);
    const cb0 = buf.pos - ctrlIndexPos;
    buf.writeS(ctrl.getName?.() ?? "");
    buf.writeBool(ctrl.getAutoRadioGroupDepth?.() ?? false);
    const cb1 = buf.pos - ctrlIndexPos;
    const pages = ctrl.listPages?.() ?? [];
    buf.writeInt16(pages.length);
    for (const page of pages) {
      buf.writeSEx(page.getId?.() ?? "", false, false);
      buf.writeSEx(page.getName?.() ?? "", false, false);
    }
    buf.writeUint8(0);
    const cb2 = buf.pos - ctrlIndexPos;
    const actions = ctrl.listActions?.() ?? [];
    buf.writeInt16(actions.length);
    for (const action of actions) {
      const actionStart = buf.pos;
      buf.writeInt16(0);
      const actionType = action.getActionType?.() ?? 0;
      buf.writeUint8(actionType);
      const fromPage = action.getFromPage?.() ?? [];
      buf.writeInt16(fromPage.length);
      for (const pageId of fromPage) {
        buf.writeS(pageId);
      }
      const toPage = action.getToPage?.() ?? [];
      buf.writeInt16(toPage.length);
      for (const pageId of toPage) {
        buf.writeS(pageId);
      }
      switch (actionType) {
        case 0 /* PlayTransition */:
          buf.writeS(action.getTransitionName?.() ?? "");
          buf.writeInt32(action.getPlayTimes?.() ?? 1);
          buf.writeFloat32(action.getDelay?.() ?? 0);
          buf.writeBool(action.getStopOnExit?.() ?? false);
          break;
        case 1 /* ChangePage */:
          buf.writeS(action.getObjectId?.() ?? "");
          buf.writeS(action.getControllerName?.() ?? "");
          buf.writeS(action.getTargetPage?.() ?? "");
          break;
        default:
          break;
      }
      const actionEnd = buf.pos;
      const saved = buf.pos;
      buf.pos = actionStart;
      buf.writeInt16(actionEnd - actionStart - 2);
      buf.pos = saved;
    }
    const ctrlSaved = buf.pos;
    buf.pos = ctrlOffsetsPos;
    buf.writeUint16(cb0);
    buf.writeUint16(cb1);
    buf.writeUint16(cb2);
    buf.pos = ctrlSaved;
    const ctrlEnd = buf.pos;
    buf.pos = ctrlStartPos;
    buf.writeInt16(ctrlEnd - ctrlStartPos - 2);
    buf.pos = ctrlEnd;
  }
}
var OBJECT_TYPE_MAP = {
  GImage: 0,
  GMovieClip: 1,
  GGraph: 3,
  GLoader: 4,
  GGroup: 5,
  GTextField: 6,
  GRichTextField: 7,
  GTextInput: 8,
  GComponent: 9,
  GList: 10,
  GLabel: 11,
  GButton: 12,
  GComboBox: 13,
  GProgressBar: 14,
  GSlider: 15,
  GScrollBar: 16,
  GTree: 17,
  GLoader3D: 18
};
function _resolveChildObjectType(child) {
  return OBJECT_TYPE_MAP[child.propertyType] ?? 2;
}
function _writeDisplayList(buf, comp, _doc, pkg, version) {
  const children = getRuntimeChildren(comp);
  const childIndexMap = getRuntimeChildIndexMap(comp);
  buf.writeInt16(children.length);
  for (const rawChild of children) {
    const child = rawChild;
    const childStartPos = buf.pos;
    buf.writeInt16(0);
    const childType = child.propertyType;
    const objType = _resolveChildObjectType(child);
    const isTree = childType === "GTree" || objType === 17 /* Tree */;
    const isListLike = childType === "GList" || childType === "GTree";
    const CHILD_BLOCKS = isListLike ? isTree ? 10 : 9 : 7;
    const childIndexPos = buf.pos;
    buf.writeUint8(CHILD_BLOCKS);
    buf.writeUint8(1);
    const childOffsetsPos = buf.pos;
    for (let i = 0; i < CHILD_BLOCKS; i++) buf.writeUint16(0);
    const cb0 = buf.pos - childIndexPos;
    const resourceRef = resolveChildResourceRef(pkg, child);
    buf.writeUint8(objType);
    buf.writeS(resourceRef.src);
    buf.writeS(resourceRef.packageId);
    buf.writeS(child.getId?.() ?? "");
    buf.writeS(child.getName?.() ?? "");
    const x = child.getX?.() ?? 0;
    const y = child.getY?.() ?? 0;
    buf.writeInt32(x);
    buf.writeInt32(y);
    const w = child.getWidth?.() ?? 0;
    const h = child.getHeight?.() ?? 0;
    const hasSize = w > 0 || h > 0;
    buf.writeBool(hasSize);
    if (hasSize) {
      buf.writeInt32(w);
      buf.writeInt32(h);
    }
    buf.writeBool(false);
    const sx = child.getScaleX?.() ?? 1;
    const sy = child.getScaleY?.() ?? 1;
    const hasScale = sx !== 1 || sy !== 1;
    buf.writeBool(hasScale);
    if (hasScale) {
      buf.writeFloat32(sx);
      buf.writeFloat32(sy);
    }
    const skewX = child.getSkewX?.() ?? 0;
    const skewY = child.getSkewY?.() ?? 0;
    const hasSkew = skewX !== 0 || skewY !== 0;
    buf.writeBool(hasSkew);
    if (hasSkew) {
      buf.writeFloat32(skewX);
      buf.writeFloat32(skewY);
    }
    const px = child.getPivotX?.() ?? 0;
    const py = child.getPivotY?.() ?? 0;
    const hasPivot = px !== 0 || py !== 0;
    buf.writeBool(hasPivot);
    if (hasPivot) {
      buf.writeFloat32(px);
      buf.writeFloat32(py);
      buf.writeBool(child.getPivotAsAnchor?.() ?? false);
    }
    buf.writeFloat32(child.getAlpha?.() ?? 1);
    buf.writeFloat32(child.getRotation?.() ?? 0);
    buf.writeBool(child.getVisible?.() ?? true);
    buf.writeBool(child.getTouchable?.() ?? true);
    buf.writeBool(child.getGrayed?.() ?? false);
    buf.writeUint8(child.getBlendMode?.() ?? 0);
    buf.writeUint8(0);
    buf.writeSEx(child.getCustomData?.() ?? null, true);
    const cb1 = buf.pos - childIndexPos;
    buf.writeSEx(child.getTooltips?.() ?? null, true);
    const groupId = child.getGroup?.() ? childIndexMap.get(child.getGroup?.() ?? "") ?? -1 : -1;
    buf.writeInt16(groupId);
    const cb2 = buf.pos - childIndexPos;
    const gears = child.listGears?.() ?? [];
    buf.writeInt16(gears.length);
    for (const gear of gears) {
      const gearStart = buf.pos;
      buf.writeInt16(0);
      const gearType = gear.getGearType?.() ?? 0;
      buf.writeUint8(gearType);
      _writeGear(buf, gear, gearType, comp, version);
      const gearEnd = buf.pos;
      const saved = buf.pos;
      buf.pos = gearStart;
      buf.writeInt16(gearEnd - gearStart - 2);
      buf.pos = saved;
    }
    const cb3 = buf.pos - childIndexPos;
    _writeRelations(buf, child, _createChildIndexMap(comp));
    let cb4 = 0;
    const isCompOrList = childType === "GComponent" || childType === "GList" || childType === "GTree" || childType === "GButton" || childType === "GLabel" || childType === "GComboBox" || childType === "GProgressBar" || childType === "GSlider" || childType === "GScrollBar";
    const isTextInput = childType === "GTextInput";
    if (isCompOrList) {
      cb4 = buf.pos - childIndexPos;
      _writeChildBlock4Component(buf, child, comp, pkg);
    } else if (isTextInput) {
      cb4 = buf.pos - childIndexPos;
      _writeChildBlock4TextInput(buf, child);
    }
    const cb5 = buf.pos - childIndexPos;
    _writeChildSpecific(buf, child, pkg, version);
    const cb6 = buf.pos - childIndexPos;
    _writeChildAfterAdd(buf, child, comp, pkg, version);
    let cb7 = 0, cb8 = 0, cb9 = 0;
    if (isListLike) {
      const overflow = child.getOverflow?.() ?? 0;
      if (overflow === 2) {
        cb7 = buf.pos - childIndexPos;
        _writeScrollPane(buf, child, pkg);
      }
      cb8 = buf.pos - childIndexPos;
      _writeListItems(buf, child, pkg, version);
      if (isTree) {
        cb9 = buf.pos - childIndexPos;
        _writeTreeSettings(buf, child);
      }
    }
    const childSaved = buf.pos;
    buf.pos = childOffsetsPos;
    buf.writeUint16(cb0);
    buf.writeUint16(cb1);
    buf.writeUint16(cb2);
    buf.writeUint16(cb3);
    buf.writeUint16(cb4);
    buf.writeUint16(cb5);
    buf.writeUint16(cb6);
    if (isListLike) {
      buf.writeUint16(cb7);
      buf.writeUint16(cb8);
      if (isTree) buf.writeUint16(cb9);
    }
    buf.pos = childSaved;
    const childEnd = buf.pos;
    buf.pos = childStartPos;
    buf.writeInt16(childEnd - childStartPos - 2);
    buf.pos = childEnd;
  }
}
function _writeComponentRelations(buf, comp) {
  _writeRelations(buf, comp, _createChildIndexMap(comp));
}
function _writeRelations(buf, obj, childIndexById) {
  const relationDefs = obj.getRelations?.() ?? [];
  const grouped = /* @__PURE__ */ new Map();
  for (const rel of relationDefs) {
    const key = rel.target ?? "";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ type: rel.type, usePercent: rel.usePercent });
  }
  buf.writeUint8(grouped.size);
  for (const [target, pairs] of grouped) {
    const targetIdx = _resolveRelationTargetIndex(target, childIndexById);
    buf.writeInt16(targetIdx);
    buf.writeUint8(pairs.length);
    for (const sp of pairs) {
      buf.writeUint8(sp.type);
      buf.writeBool(sp.usePercent);
    }
  }
}
function _createChildIndexMap(comp) {
  const childIndexById = /* @__PURE__ */ new Map();
  const children = comp.listChildren();
  for (const [index, child] of children.entries()) {
    const childId = child.getId?.();
    if (childId) childIndexById.set(childId, index);
  }
  return childIndexById;
}
function _resolveRelationTargetIndex(target, childIndexById) {
  if (!target) return -1;
  const mappedIndex = childIndexById?.get(target);
  if (mappedIndex !== void 0) return mappedIndex;
  const numericIndex = Number.parseInt(target, 10);
  return Number.isNaN(numericIndex) ? -1 : numericIndex;
}
function _writeAdvancedProps(buf, comp, version) {
  buf.writeSEx(comp.getCustomData?.() ?? null, true);
  buf.writeBool(comp.getOpaque?.() ?? true);
  const maskId = comp.getMask?.();
  if (maskId !== void 0 && maskId !== null) {
    const children = getRuntimeChildren(comp);
    const maskIdx = children.findIndex((c) => c.getId() === maskId);
    if (maskIdx >= 0) {
      buf.writeInt16(maskIdx);
      buf.writeBool(comp.getReversedMask?.() ?? false);
    } else {
      buf.writeInt16(-1);
    }
  } else {
    buf.writeInt16(-1);
  }
  const hitTest = comp.getHitTest?.();
  if (hitTest) {
    const parts = hitTest.split(",");
    if (parts.length === 1) {
      buf.writeS(null);
      buf.writeInt32(1);
      const children = getRuntimeChildren(comp);
      const htIdx = children.findIndex((c) => c.getId() === parts[0]);
      buf.writeInt32(htIdx >= 0 ? htIdx : -1);
    } else {
      buf.writeS(parts[0]);
      buf.writeInt32(parseInt(parts[1], 10) || 0);
      buf.writeInt32(parseInt(parts[2], 10) || 0);
    }
  } else {
    buf.writeS(null);
    buf.writeInt32(0);
    buf.writeInt32(0);
  }
  if (version >= 5) {
    buf.writeS(comp.getAddedToStageSound?.() ?? null);
    buf.writeS(comp.getRemovedFromStageSound?.() ?? null);
  }
}
function _writeExtensionDef(buf, comp, pkg, _version) {
  const extType = comp.getExtensionType?.() ?? "";
  if (!extType) return;
  switch (extType) {
    case "Button": {
      buf.writeUint8(comp.getButtonMode?.() ?? 0);
      buf.writeS(remapLocalUiUrl(pkg, comp.getSound?.() ?? null));
      buf.writeFloat32(comp.getSoundVolumeScale?.() ?? 1);
      buf.writeUint8(comp.getDownEffect?.() ?? 0);
      buf.writeFloat32(comp.getDownEffectValue?.() ?? 0.8);
      break;
    }
    case "Label":
      break;
    case "ComboBox": {
      buf.writeS(remapLocalUiUrl(pkg, comp.getDropdown?.() ?? null));
      break;
    }
    case "ProgressBar": {
      buf.writeUint8(comp.getTitleType?.() ?? 0);
      buf.writeBool(comp.getReverse?.() ?? false);
      break;
    }
    case "Slider": {
      buf.writeUint8(comp.getTitleType?.() ?? 0);
      buf.writeBool(comp.getReverse?.() ?? false);
      buf.writeBool(comp.getWholeNumbers?.() ?? false);
      buf.writeBool(comp.getChangeOnClick?.() ?? true);
      break;
    }
    case "ScrollBar": {
      buf.writeBool(comp.getFixedGripSize?.() ?? false);
      break;
    }
    default:
      break;
  }
}
function _writeTransitions(buf, comp, version) {
  const transitions = comp.listTransitions();
  buf.writeInt16(transitions.length);
  for (const trans of transitions) {
    const fps = trans.getFps?.() ?? 24;
    const secondsPerFrame = fps > 0 ? 1 / fps : 1 / 24;
    const transStartPos = buf.pos;
    buf.writeInt16(0);
    buf.writeS(trans.getName?.() ?? "");
    buf.writeInt32(trans.getOptions?.() ?? 0);
    buf.writeBool(trans.getAutoPlay?.() ?? false);
    buf.writeInt32(trans.getAutoPlayTimes?.() ?? 1);
    buf.writeFloat32(trans.getAutoPlayDelay?.() ?? 0);
    const displayList = {};
    const children = getRuntimeChildren(comp);
    for (let ci = 0; ci < children.length; ci++) {
      const childId = children[ci].getId();
      if (childId) displayList[childId] = ci;
    }
    const items = (trans.listItems?.() ?? []).filter((item) => {
      const targetId = item.getTargetId?.() ?? "";
      return !targetId || displayList[targetId] !== void 0;
    });
    buf.writeInt16(items.length);
    for (const item of items) {
      const itemStartPos = buf.pos;
      buf.writeInt16(0);
      const itemIndexPos = buf.pos;
      const hasTween = item.getTween?.() ?? false;
      const blockCount = 4;
      buf.writeUint8(blockCount);
      buf.writeUint8(1);
      const itemOffsetsPos = buf.pos;
      for (let i = 0; i < blockCount; i++) buf.writeUint16(0);
      const ib0 = buf.pos - itemIndexPos;
      buf.writeUint8(item.getActionType?.() ?? 0);
      buf.writeFloat32((item.getTime?.() ?? 0) * secondsPerFrame);
      const targetStr = item.getTargetId?.() ?? "";
      const targetIdx = targetStr ? displayList[targetStr] ?? -1 : -1;
      buf.writeInt16(targetIdx);
      buf.writeSEx(item.getLabel?.() ?? null);
      buf.writeBool(hasTween);
      if (hasTween) {
        const ib1 = buf.pos - itemIndexPos;
        buf.writeFloat32((item.getDuration?.() ?? 0) * secondsPerFrame);
        buf.writeUint8(item.getEaseType?.() ?? 5);
        buf.writeInt32(item.getRepeat?.() ?? 1);
        buf.writeBool(item.getYoyo?.() ?? false);
        buf.writeSEx(item.getEndLabel?.() ?? null);
        const ib2 = buf.pos - itemIndexPos;
        _writeTransitionValue(buf, item, item.getStartValue?.(), version);
        const ib3 = buf.pos - itemIndexPos;
        _writeTransitionValue(buf, item, item.getEndValue?.(), version);
        if (version >= 2) {
          _writePathData(buf, item.getPath?.() ?? null);
        }
        if (version >= 4 && (item.getEaseType?.() ?? 5) === 31) {
          _writePathData(buf, item.getCustomEasePath?.() ?? null);
        }
        const itemSaved = buf.pos;
        buf.pos = itemOffsetsPos;
        buf.writeUint16(ib0);
        buf.writeUint16(ib1);
        buf.writeUint16(ib2);
        buf.writeUint16(ib3);
        buf.pos = itemSaved;
      } else {
        const ib1 = 0;
        const ib2 = buf.pos - itemIndexPos;
        _writeTransitionValue(buf, item, item.getStartValue?.(), version);
        const ib3 = 0;
        const itemSaved = buf.pos;
        buf.pos = itemOffsetsPos;
        buf.writeUint16(ib0);
        buf.writeUint16(ib1);
        buf.writeUint16(ib2);
        buf.writeUint16(ib3);
        buf.pos = itemSaved;
      }
      const itemEnd = buf.pos;
      buf.pos = itemStartPos;
      buf.writeInt16(itemEnd - itemStartPos - 2);
      buf.pos = itemEnd;
    }
    const transEnd = buf.pos;
    buf.pos = transStartPos;
    buf.writeInt16(transEnd - transStartPos - 2);
    buf.pos = transEnd;
  }
}
function _writePathData(buf, path3) {
  if (!path3 || typeof path3 === "string" && path3.length === 0) {
    buf.writeInt32(0);
    return;
  }
  const pathStr = Array.isArray(path3) ? path3.join(",") : String(path3);
  if (!pathStr) {
    buf.writeInt32(0);
    return;
  }
  const parts = pathStr.split(",");
  const countPos = buf.pos;
  buf.writeInt32(0);
  let count = 0;
  let i = 0;
  while (i < parts.length) {
    count++;
    const curveType = parseInt(parts[i++], 10) || 0;
    buf.writeUint8(curveType);
    switch (curveType) {
      case 1:
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        break;
      case 2:
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        i++;
        break;
      default:
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        buf.writeFloat32(parseFloat(parts[i++]) || 0);
        break;
    }
  }
  const saved = buf.pos;
  buf.pos = countPos;
  buf.writeInt32(count);
  buf.pos = saved;
}
function _writeTransitionValue(buf, item, value, version) {
  const type = item.getActionType?.() ?? 0;
  const parts = !value ? [] : Array.isArray(value) ? value.map(String) : typeof value === "string" ? value.split(",") : [];
  const ACTION_TYPE_NAMES = ["XY", "Size", "Scale", "Pivot", "Alpha", "Rotation", "Color", "Animation", "Visible", "Sound", "Transition", "Shake", "ColorFilter", "Skew", "Text", "Icon"];
  const typeName = ACTION_TYPE_NAMES[type] ?? "XY";
  switch (typeName) {
    case "XY": {
      const b1 = parts[0] !== "-" && parts[0] !== void 0;
      const b2 = parts.length > 1 && parts[1] !== "-";
      const hasPercent = parts.length > 2;
      buf.writeBool(b1);
      buf.writeBool(b2);
      if (hasPercent) {
        buf.writeFloat32(parseFloat(parts[2]) || 0);
        buf.writeFloat32(parseFloat(parts[3]) || 0);
      } else {
        buf.writeFloat32(b1 ? parseFloat(parts[0]) || 0 : 0);
        buf.writeFloat32(b2 ? parseFloat(parts[1]) || 0 : 0);
      }
      buf.writeBool(hasPercent);
      break;
    }
    case "Size":
    case "Pivot":
    case "Skew": {
      const b1 = parts[0] !== "-" && parts[0] !== void 0;
      const b2 = parts.length > 1 && parts[1] !== "-";
      buf.writeBool(b1);
      buf.writeBool(b2);
      buf.writeFloat32(b1 ? parseFloat(parts[0]) || 0 : 0);
      buf.writeFloat32(b2 ? parseFloat(parts[1]) || 0 : 0);
      break;
    }
    case "Scale": {
      buf.writeFloat32(parseFloat(parts[0]) || 1);
      buf.writeFloat32(parseFloat(parts[1]) || 1);
      break;
    }
    case "Alpha":
    case "Rotation": {
      buf.writeFloat32(parseFloat(parts[0]) || 0);
      break;
    }
    case "Color": {
      const colorStr = parts[0] || "#000000";
      buf.writeColor(colorStr, false);
      break;
    }
    case "Animation": {
      const frame = parts[0] !== "-" ? parseInt(parts[0], 10) || 0 : -1;
      const playing = parts.length <= 1 || parts[1] === "p";
      buf.writeBool(playing);
      buf.writeInt32(frame);
      if (version >= 6) {
        buf.writeS(parts[2] || null);
        buf.writeS(parts[3] || null);
      }
      break;
    }
    case "Visible": {
      buf.writeBool(parts[0] === "true");
      break;
    }
    case "Sound": {
      buf.writeSEx(parts[0] || null, false, false);
      buf.writeFloat32((parseInt(parts[1], 10) || 100) / 100);
      break;
    }
    case "Transition": {
      buf.writeSEx(parts[0] || null, false, false);
      buf.writeInt32(parseInt(parts[1], 10) || 1);
      break;
    }
    case "Shake": {
      buf.writeFloat32(parseFloat(parts[0]) || 0);
      buf.writeFloat32(parseFloat(parts[1]) || 0.3);
      break;
    }
    case "ColorFilter": {
      buf.writeFloat32(parseFloat(parts[0]) || 0);
      buf.writeFloat32(parseFloat(parts[1]) || 0);
      buf.writeFloat32(parseFloat(parts[2]) || 0);
      buf.writeFloat32(parseFloat(parts[3]) || 0);
      break;
    }
    case "Text": {
      buf.writeSEx(parts.join(",") || null, true);
      break;
    }
    case "Icon": {
      buf.writeS(parts[0] || null);
      break;
    }
    default: {
      buf.writeBool(true);
      buf.writeBool(true);
      buf.writeFloat32(0);
      buf.writeFloat32(0);
    }
  }
}
function _writeGear(buf, gear, gearType, comp, version) {
  const ctrl = gear.getController?.();
  const controllers = comp.listControllers();
  const ctrlIndex = ctrl ? controllers.indexOf(ctrl) : -1;
  buf.writeInt16(ctrlIndex >= 0 ? ctrlIndex : 0);
  const pagesStr = _strVal(gear.getPages?.()) ?? "";
  const valuesStr = _strVal(gear.getValues?.()) ?? "";
  const defaultStr = _strVal(gear.getDefaultValue?.()) ?? "";
  const pages = pagesStr ? pagesStr.split(",") : [];
  const values = valuesStr ? valuesStr.split("|") : [];
  const pageCount = pages.length;
  if (gearType === 0 || gearType === 8) {
    buf.writeInt16(pages.length);
    if (pages.length > 0) {
      for (const p of pages) buf.writeS(p);
    }
  } else {
    buf.writeInt16(pageCount);
    for (let i = 0; i < pageCount; i++) {
      const value = values[i] ?? "";
      if (_shouldWriteNullGearPage(gearType, value)) {
        buf.writeS(null);
        continue;
      }
      buf.writeS(pages[i] ?? null);
      _writeGearStatus(buf, gearType, value, version);
    }
    const hasDefault = defaultStr !== "";
    buf.writeBool(hasDefault);
    if (hasDefault) {
      _writeGearStatus(buf, gearType, defaultStr, version);
    }
  }
  const supportsTween = gearType >= 1 && gearType <= 4;
  const hasTween = supportsTween && (gear.getTween?.() ?? false);
  buf.writeBool(hasTween);
  if (hasTween) {
    buf.writeUint8(gear.getEaseType?.() ?? 5);
    buf.writeFloat32(gear.getTweenDuration?.() ?? 0.3);
    buf.writeFloat32(gear.getTweenDelay?.() ?? 0);
  }
  if (version >= 4 && hasTween && (gear.getEaseType?.() ?? 5) === 31) {
    _writePathData(buf, gear.getCustomEasePath?.() ?? null);
  }
  if (version >= 2 && gearType === 1) {
    const positionsInPercent = gear.getPositionsInPercent?.() ?? false;
    buf.writeBool(positionsInPercent);
    if (positionsInPercent) {
      for (let i = 0; i < pageCount; i++) {
        const value = values[i] ?? "";
        if (_shouldWriteNullGearPage(gearType, value)) {
          buf.writeS(null);
          continue;
        }
        buf.writeS(pages[i] ?? null);
        _writeGearXYExtStatus(buf, value);
      }
      const hasDefault = defaultStr !== "";
      buf.writeBool(hasDefault);
      if (hasDefault) {
        _writeGearXYExtStatus(buf, defaultStr);
      }
    }
  }
  if (gearType === 8) {
    const condition = gear.getCondition?.() ?? 0;
    buf.writeUint8(_numVal(condition, 0));
  }
  if (version >= 6 && gearType === 5) {
    for (let i = 0; i < pageCount; i++) {
      const value = values[i] ?? "";
      if (!_hasGearAnimationExtStatus(value)) {
        buf.writeS(null);
        continue;
      }
      buf.writeS(pages[i] ?? null);
      _writeGearAnimationExtStatus(buf, value);
    }
    const hasDefaultExt = _hasGearAnimationExtStatus(defaultStr);
    buf.writeBool(hasDefaultExt);
    if (hasDefaultExt) {
      _writeGearAnimationExtStatus(buf, defaultStr);
    }
  }
}
function _shouldWriteNullGearPage(gearType, valueStr) {
  return gearType !== 6 && gearType !== 7 && (!valueStr || valueStr === "-");
}
function _writeGearStatus(buf, gearType, valueStr, _version) {
  const parts = valueStr.split(",");
  switch (gearType) {
    case 1:
      buf.writeInt32(parseInt(parts[0], 10) || 0);
      buf.writeInt32(parseInt(parts[1], 10) || 0);
      break;
    case 2:
      buf.writeInt32(parseInt(parts[0], 10) || 0);
      buf.writeInt32(parseInt(parts[1], 10) || 0);
      buf.writeFloat32(parseFloat(parts[2]) || 1);
      buf.writeFloat32(parseFloat(parts[3]) || 1);
      break;
    case 3:
      buf.writeFloat32(Number.isNaN(parseFloat(parts[0])) ? 1 : parseFloat(parts[0]));
      buf.writeFloat32(Number.isNaN(parseFloat(parts[1])) ? 0 : parseFloat(parts[1]));
      buf.writeBool(parts[2] === "true" || parts[2] === "1");
      buf.writeBool(parts.length < 4 || parts[3] === "true" || parts[3] === "1");
      break;
    case 4:
      _writeColorForGear(buf, parts[0] ?? "#ffffff");
      _writeColorForGear(buf, parts.length < 2 ? "#000000" : parts[1] ?? "#000000");
      break;
    case 5:
      buf.writeBool(parts[1] !== "s");
      buf.writeInt32(parseInt(parts[0], 10) || 0);
      break;
    case 6:
      buf.writeS(valueStr);
      break;
    case 7:
      buf.writeS(valueStr);
      break;
    case 9:
      buf.writeInt32(parseInt(valueStr, 10) || 12);
      break;
    default:
      break;
  }
}
function _writeGearXYExtStatus(buf, valueStr) {
  const parts = valueStr.split(",");
  buf.writeFloat32(parseFloat(parts[2]) || 0);
  buf.writeFloat32(parseFloat(parts[3]) || 0);
}
function _writeColorForGear(buf, colorStr, defaultColor = 4278190080) {
  buf.writeColor(colorStr || null, true, defaultColor);
}
function _writeChildSpecific(buf, child, pkg, version) {
  const type = child.propertyType;
  switch (type) {
    case "GImage": {
      const color = child.getColor?.() ?? null;
      const colorLower = color?.toLowerCase?.() ?? "";
      const hasColor = color && colorLower !== "#ffffff" && colorLower !== "#ffffffff";
      buf.writeBool(!!hasColor);
      if (hasColor) buf.writeColor(color, false);
      buf.writeUint8(child.getFlip?.() ?? 0);
      const fillMethod = child.getFillMethod?.() ?? 0;
      buf.writeUint8(fillMethod);
      if (fillMethod !== 0) {
        buf.writeUint8(child.getFillOrigin?.() ?? 0);
        buf.writeBool(child.getFillClockwise?.() ?? true);
        buf.writeFloat32(child.getFillAmount?.() ?? 0);
      }
      break;
    }
    case "GTextField":
    case "GRichTextField":
    case "GTextInput": {
      buf.writeS(child.getFont?.() || null);
      buf.writeInt16(child.getFontSize?.() ?? 12);
      buf.writeColor(child.getColor?.() ?? "#000000", false);
      buf.writeUint8(child.getAlign?.() ?? 0);
      buf.writeUint8(child.getVAlign?.() ?? 0);
      buf.writeInt16(child.getLeading?.() ?? 3);
      buf.writeInt16(child.getLetterSpacing?.() ?? 0);
      buf.writeBool(child.getUbbEnabled?.() ?? false);
      buf.writeUint8(_numVal(child.getAutoSize?.(), 1));
      buf.writeBool(child.getUnderline?.() ?? false);
      buf.writeBool(child.getItalic?.() ?? false);
      buf.writeBool(child.getBold?.() ?? false);
      buf.writeBool(child.getSingleLine?.() ?? false);
      const strokeColor = child.getStrokeColor?.() ?? null;
      const hasStroke = !!strokeColor;
      buf.writeBool(hasStroke);
      if (hasStroke) {
        buf.writeColor(strokeColor, true);
        buf.writeFloat32(child.getStrokeSize?.() ?? 1);
      }
      const shadowColor = child.getShadowColor?.() ?? null;
      if (shadowColor) {
        buf.writeBool(true);
        buf.writeColor(shadowColor, true);
        buf.writeFloat32(child.getShadowOffsetX?.() ?? 1);
        buf.writeFloat32(child.getShadowOffsetY?.() ?? 1);
      } else {
        buf.writeBool(false);
      }
      buf.writeBool(false);
      if (version >= 3) {
        buf.writeBool(child.getStrikethrough?.() ?? false);
        buf.writeFloat32(0);
        buf.writeFloat32(0);
        buf.writeFloat32(0);
      }
      break;
    }
    case "GGraph": {
      const graphType = child.getGraphType?.() ?? 0;
      if (graphType === 0) {
        buf.writeInt32(child.getLineSize?.() ?? 1);
        buf.writeColor(child.getLineColor?.() ?? "#000000ff", true);
        buf.writeColor(child.getFillColor?.() ?? "#ffffffff", true, 4294967295);
        buf.writeBool(false);
      } else {
        buf.writeUint8(graphType);
        buf.writeInt32(child.getLineSize?.() ?? 1);
        buf.writeColor(child.getLineColor?.() ?? "#000000ff", true);
        buf.writeColor(child.getFillColor?.() ?? "#ffffffff", true, 4294967295);
        const corner = child.getCornerRadius?.();
        if (corner) {
          buf.writeBool(true);
          buf.writeFloat32(corner[0] ?? 0);
          buf.writeFloat32(corner[1] ?? corner[0] ?? 0);
          buf.writeFloat32(corner[2] ?? corner[0] ?? 0);
          buf.writeFloat32(corner[3] ?? corner[0] ?? 0);
        } else {
          buf.writeBool(false);
        }
        if (graphType === 3) {
          const points = child.getPoints?.();
          if (points) {
            buf.writeInt16(points.length);
            for (const point of points) buf.writeFloat32(point ?? 0);
          } else {
            buf.writeInt16(0);
          }
        }
        if (graphType === 4) {
          buf.writeInt16(child.getSides?.() ?? 3);
          buf.writeFloat32(child.getStartAngle?.() ?? 0);
          const distances = child.getDistances?.();
          if (distances) {
            buf.writeInt16(distances.length);
            for (const distance of distances) buf.writeFloat32(distance ?? 1);
          } else {
            buf.writeInt16(0);
          }
        }
      }
      break;
    }
    case "GGroup":
      buf.writeUint8(child.getLayout?.() ?? 0);
      buf.writeInt32(child.getLineGap?.() ?? 0);
      buf.writeInt32(child.getColumnGap?.() ?? 0);
      buf.writeBool(child.getExcludeInvisibles?.() ?? false);
      buf.writeBool(child.getAutoSizeDisabled?.() ?? false);
      buf.writeInt16(child.getMainGridIndex?.() ?? -1);
      break;
    case "GLoader": {
      buf.writeS(remapLocalUiUrl(pkg, child.getUrl?.() ?? null));
      buf.writeUint8(child.getAlign?.() ?? 0);
      buf.writeUint8(child.getVAlign?.() ?? 0);
      buf.writeUint8(child.getFill?.() ?? 0);
      buf.writeBool(child.getShrinkOnly?.() ?? false);
      buf.writeBool(_boolVal(child.getAutoSize?.(), false));
      buf.writeBool(false);
      buf.writeBool(child.getPlaying?.() ?? true);
      buf.writeInt32(child.getFrame?.() ?? 0);
      const loaderColor = child.getColor?.() ?? null;
      const loaderColorLower = loaderColor?.toLowerCase?.() ?? "";
      const hasLoaderColor = loaderColor && loaderColorLower !== "#ffffff" && loaderColorLower !== "#ffffffff";
      buf.writeBool(!!hasLoaderColor);
      if (hasLoaderColor) buf.writeColor(loaderColor, false);
      const loaderFill = child.getFillMethod?.() ?? 0;
      buf.writeUint8(loaderFill);
      if (loaderFill !== 0) {
        buf.writeUint8(child.getFillOrigin?.() ?? 0);
        buf.writeBool(child.getFillClockwise?.() ?? true);
        buf.writeFloat32(child.getFillAmount?.() ?? 0);
      }
      if (version >= 7) {
        buf.writeBool(child.getUseResize?.() ?? false);
      }
      break;
    }
    case "GLoader3D": {
      buf.writeS(remapLocalUiUrl(pkg, child.getUrl?.() ?? null));
      buf.writeUint8(child.getAlign?.() ?? 0);
      buf.writeUint8(child.getVAlign?.() ?? 0);
      buf.writeUint8(child.getFill?.() ?? 0);
      buf.writeBool(child.getShrinkOnly?.() ?? false);
      buf.writeBool(_boolVal(child.getAutoSize?.(), false));
      buf.writeS(child.getAnimationName?.() ?? null);
      buf.writeS(child.getSkinName?.() ?? null);
      buf.writeBool(child.getPlaying?.() ?? true);
      buf.writeInt32(child.getFrame?.() ?? 0);
      buf.writeBool(child.getLoop?.() ?? true);
      const loader3DColor = child.getColor?.() ?? null;
      const loader3DColorLower = loader3DColor?.toLowerCase?.() ?? "";
      const hasLoader3DColor = loader3DColor && loader3DColorLower !== "#ffffff" && loader3DColorLower !== "#ffffffff";
      buf.writeBool(!!hasLoader3DColor);
      if (hasLoader3DColor) buf.writeColor(loader3DColor, false);
      break;
    }
    case "GMovieClip": {
      const mcColor = child.getColor?.() ?? null;
      const mcColorLower = mcColor?.toLowerCase?.() ?? "";
      const hasMcColor = mcColor && mcColorLower !== "#ffffff" && mcColorLower !== "#ffffffff";
      buf.writeBool(!!hasMcColor);
      if (hasMcColor) buf.writeColor(mcColor, false);
      buf.writeUint8(0);
      buf.writeInt32(child.getFrame?.() ?? 0);
      buf.writeBool(child.getPlaying?.() ?? true);
      break;
    }
    case "GList":
    case "GTree": {
      const overflow = child.getOverflow?.() ?? 0;
      buf.writeUint8(child.getLayout?.() ?? 0);
      buf.writeUint8(child.getSelectionMode?.() ?? 0);
      buf.writeUint8(child.getAlign?.() ?? 0);
      buf.writeUint8(child.getVAlign?.() ?? 0);
      buf.writeInt16(child.getLineGap?.() ?? 0);
      buf.writeInt16(child.getColumnGap?.() ?? 0);
      buf.writeInt16(child.getLineCount?.() ?? 0);
      buf.writeInt16(child.getColumnCount?.() ?? 0);
      buf.writeBool(child.getAutoResizeItem?.() ?? true);
      buf.writeUint8(child.getChildrenRenderOrder?.() ?? 0);
      buf.writeInt16(child.getApexIndex?.() ?? 0);
      const listMargin = child.getMargin?.();
      const hasListMargin = !!listMargin && (overflow === 2 || (Array.isArray(listMargin) ? !!(listMargin[0] || listMargin[1] || listMargin[2] || listMargin[3]) : !!(listMargin.top || listMargin.bottom || listMargin.left || listMargin.right)));
      buf.writeBool(hasListMargin);
      if (hasListMargin && listMargin) {
        if (Array.isArray(listMargin)) {
          buf.writeInt32(listMargin[0] ?? 0);
          buf.writeInt32(listMargin[1] ?? 0);
          buf.writeInt32(listMargin[2] ?? 0);
          buf.writeInt32(listMargin[3] ?? 0);
        } else {
          buf.writeInt32(listMargin.top ?? 0);
          buf.writeInt32(listMargin.bottom ?? 0);
          buf.writeInt32(listMargin.left ?? 0);
          buf.writeInt32(listMargin.right ?? 0);
        }
      }
      buf.writeUint8(overflow);
      const clipSoft = child.getClipSoftness?.();
      const hasClipSoftness = !!clipSoft && !!((clipSoft.x ?? 0) || (clipSoft.y ?? 0));
      if (hasClipSoftness) {
        buf.writeBool(true);
        buf.writeInt32(clipSoft.x ?? 0);
        buf.writeInt32(clipSoft.y ?? 0);
      } else {
        buf.writeBool(false);
      }
      buf.writeBool(child.getScrollItemToViewOnClick?.() ?? true);
      buf.writeBool(child.getFoldInvisibleItems?.() ?? false);
      break;
    }
    default:
      break;
  }
}
function _writeChildAfterAdd(buf, child, comp, pkg, version) {
  const type = child.propertyType;
  switch (type) {
    case "GTextField":
    case "GRichTextField":
    case "GTextInput":
      buf.writeSEx(remapLocalUiRefsInText(pkg, child.getText?.() ?? null), true);
      break;
    case "GButton": {
      buf.writeUint8(12);
      buf.writeSEx(child.getTitle?.() ?? null, true);
      buf.writeSEx(child.getSelectedTitle?.() ?? null, true);
      buf.writeS(remapLocalUiUrl(pkg, child.getIcon?.() ?? null));
      buf.writeS(remapLocalUiUrl(pkg, child.getSelectedIcon?.() ?? null));
      const titleColor = child.getTitleColor?.() ?? null;
      const hasTitleColor = titleColor && titleColor !== "#000000";
      buf.writeBool(!!hasTitleColor);
      if (hasTitleColor) buf.writeColor(titleColor, true);
      buf.writeInt32(child.getTitleFontSize?.() ?? 0);
      const btnExtras = getChildExtras(child);
      const relCtrlName = btnExtras?.controller ?? null;
      if (relCtrlName) {
        const controllers = comp.listControllers();
        const ctrlIdx = controllers.findIndex((c) => c.getName() === relCtrlName);
        buf.writeInt16(ctrlIdx >= 0 ? ctrlIdx : -1);
      } else {
        buf.writeInt16(-1);
      }
      buf.writeS(btnExtras?.page ?? null);
      const btnSound = btnExtras?.sound ?? child.getSound?.() ?? null;
      buf.writeSEx(remapLocalUiUrl(pkg, _strVal(btnSound)) ?? null, false, false);
      const btnVolume = btnExtras?.volume ?? child.getSoundVolumeScale?.();
      if (btnVolume !== void 0 && btnVolume !== null) {
        buf.writeBool(true);
        buf.writeFloat32(_numVal(btnVolume, 0) / 100);
      } else {
        buf.writeBool(false);
      }
      buf.writeBool(child.getSelected?.() ?? _boolVal(btnExtras?.checked, false));
      break;
    }
    case "GLabel": {
      buf.writeUint8(11);
      buf.writeSEx(child.getTitle?.() ?? null, true);
      buf.writeS(remapLocalUiUrl(pkg, child.getIcon?.() ?? null));
      const labelTitleColor = child.getTitleColor?.() ?? null;
      const hasLabelColor = labelTitleColor && labelTitleColor !== "#000000";
      buf.writeBool(!!hasLabelColor);
      if (hasLabelColor) buf.writeColor(labelTitleColor, true);
      buf.writeInt32(child.getTitleFontSize?.() ?? 0);
      buf.writeBool(false);
      if (version >= 5) {
        buf.writeS(remapLocalUiUrl(pkg, child.getSound?.() ?? null));
        buf.writeFloat32(child.getSoundVolumeScale?.() ?? 1);
      }
      break;
    }
    case "GComboBox": {
      buf.writeUint8(13);
      const items = child.getItems?.() ?? [];
      const values = child.getValues?.() ?? [];
      const icons = child.getIcons?.() ?? [];
      buf.writeInt16(items.length);
      for (let i = 0; i < items.length; i++) {
        const itemStart = buf.pos;
        buf.writeInt16(0);
        buf.writeSEx(items[i] ?? null, true, false);
        buf.writeSEx(values[i] ?? null, false, false);
        buf.writeS(remapLocalUiUrl(pkg, icons[i] ?? null));
        const itemEnd = buf.pos;
        const saved = buf.pos;
        buf.pos = itemStart;
        buf.writeInt16(itemEnd - itemStart - 2);
        buf.pos = saved;
      }
      buf.writeSEx(child.getTitle?.() ?? null, true);
      buf.writeS(remapLocalUiUrl(pkg, child.getIcon?.() ?? null));
      buf.writeBool(false);
      buf.writeInt32(child.getVisibleItemCount?.() ?? 10);
      buf.writeUint8(child.getPopupDirection?.() ?? 0);
      buf.writeInt16(-1);
      if (version >= 5) {
        buf.writeS(remapLocalUiUrl(pkg, child.getSound?.() ?? null));
        buf.writeFloat32(child.getSoundVolumeScale?.() ?? 1);
      }
      break;
    }
    case "GProgressBar":
    case "GSlider": {
      buf.writeUint8(child.propertyType === "GSlider" ? 15 : 14);
      buf.writeInt32(child.getValue?.() ?? 0);
      buf.writeInt32(child.getMax?.() ?? 100);
      buf.writeInt32(child.getMin?.() ?? 0);
      if (version >= 5 && child.propertyType === "GProgressBar") {
        buf.writeS(remapLocalUiUrl(pkg, child.getSound?.() ?? null));
        buf.writeFloat32(child.getSoundVolumeScale?.() ?? 1);
      }
      break;
    }
    case "GList":
    case "GTree": {
      const selectionController = child.getSelectionController?.() ?? "";
      if (selectionController) {
        const ctrlIdx = comp.listControllers().findIndex((controller) => controller.getName() === selectionController);
        buf.writeInt16(ctrlIdx >= 0 ? ctrlIdx : -1);
      } else {
        buf.writeInt16(-1);
      }
      break;
    }
    default: {
      const instExtType = child.getInstanceExtType?.() ?? null;
      if (instExtType && extTypeCodeMap[instExtType]) {
        _writeExtensionInstanceData(buf, instExtType, child, comp, pkg, version);
      }
      break;
    }
  }
}
var extTypeCodeMap = {
  Label: 11,
  Button: 12,
  ComboBox: 13,
  ProgressBar: 14,
  Slider: 15,
  ScrollBar: 16
};
function _writeExtensionInstanceData(buf, extType, child, comp, pkg, version) {
  buf.writeUint8(extTypeCodeMap[extType] ?? 0);
  switch (extType) {
    case "Button": {
      buf.writeSEx(child.getInstanceTitle?.() ?? null, true);
      buf.writeSEx(child.getInstanceSelectedTitle?.() ?? null, true);
      buf.writeS(remapLocalUiUrl(pkg, child.getInstanceIcon?.() ?? null));
      buf.writeS(remapLocalUiUrl(pkg, child.getInstanceSelectedIcon?.() ?? null));
      const titleColor = child.getInstanceTitleColor?.() ?? null;
      buf.writeBool(!!titleColor);
      if (titleColor) buf.writeColor(titleColor, true);
      buf.writeInt32(child.getInstanceTitleFontSize?.() ?? 0);
      const relatedController = child.getInstanceController?.() ?? "";
      if (relatedController) {
        const ctrlIdx = comp.listControllers().findIndex((c) => c.getName() === relatedController);
        buf.writeInt16(ctrlIdx >= 0 ? ctrlIdx : -1);
      } else {
        buf.writeInt16(-1);
      }
      buf.writeS(child.getInstancePage?.() ?? null);
      buf.writeSEx(null, false, false);
      buf.writeBool(false);
      buf.writeBool(child.getInstanceChecked?.() ?? false);
      break;
    }
    case "Label": {
      buf.writeSEx(child.getInstanceTitle?.() ?? null, true);
      buf.writeS(remapLocalUiUrl(pkg, child.getInstanceIcon?.() ?? null));
      const labelTitleColor = child.getInstanceTitleColor?.() ?? null;
      buf.writeBool(!!labelTitleColor);
      if (labelTitleColor) buf.writeColor(labelTitleColor, true);
      buf.writeInt32(child.getInstanceTitleFontSize?.() ?? 0);
      buf.writeBool(false);
      if (version >= 5) {
        buf.writeS(null);
        buf.writeFloat32(1);
      }
      break;
    }
    case "ComboBox": {
      const comboItems = child.getInstanceComboItems?.() ?? [];
      buf.writeInt16(comboItems.length);
      for (const item of comboItems) {
        const itemStart = buf.pos;
        buf.writeInt16(0);
        buf.writeSEx(item.title ?? null, true, false);
        buf.writeSEx(item.value ?? null, false, false);
        buf.writeS(remapLocalUiUrl(pkg, item.icon ?? null));
        const itemEnd = buf.pos;
        const saved = buf.pos;
        buf.pos = itemStart;
        buf.writeInt16(itemEnd - itemStart - 2);
        buf.pos = saved;
      }
      buf.writeSEx(child.getInstanceTitle?.() ?? null, true);
      buf.writeS(remapLocalUiUrl(pkg, child.getInstanceIcon?.() ?? null));
      const comboTitleColor = child.getInstanceTitleColor?.() ?? null;
      buf.writeBool(!!comboTitleColor);
      if (comboTitleColor) buf.writeColor(comboTitleColor, true);
      buf.writeInt32(child.getInstanceVisibleItemCount?.() ?? 10);
      buf.writeUint8(0);
      buf.writeInt16(-1);
      if (version >= 5) {
        buf.writeS(null);
        buf.writeFloat32(1);
      }
      break;
    }
    case "ProgressBar":
    case "Slider":
      buf.writeInt32(child.getInstanceValue?.() ?? 0);
      buf.writeInt32(child.getInstanceMax?.() ?? 100);
      buf.writeInt32(child.getInstanceMin?.() ?? 0);
      if (version >= 5 && extType === "ProgressBar") {
        buf.writeS(null);
        buf.writeFloat32(1);
      }
      break;
    default:
      break;
  }
}
function _writeGearAnimationExtStatus(buf, valueStr) {
  const parts = valueStr.split(",");
  buf.writeS(parts[2] || null);
  buf.writeS(parts[3] || null);
}
function _hasGearAnimationExtStatus(valueStr) {
  if (!valueStr) return false;
  const parts = valueStr.split(",");
  return parts.length > 2 && (!!parts[2] || !!parts[3]);
}
function _writeScrollPane(buf, child, pkg) {
  buf.writeUint8(child.getScrollType?.() ?? 1);
  buf.writeUint8(0);
  buf.writeInt32(child.getScrollBarFlags?.() ?? 0);
  const sbMargin = child.getScrollBarMargin?.();
  buf.writeBool(!!sbMargin);
  if (sbMargin) {
    buf.writeInt32(sbMargin.top ?? 0);
    buf.writeInt32(sbMargin.bottom ?? 0);
    buf.writeInt32(sbMargin.left ?? 0);
    buf.writeInt32(sbMargin.right ?? 0);
  }
  buf.writeSEx(remapLocalUiUrl(pkg, child.getVtScrollBarRes?.() ?? null));
  buf.writeSEx(remapLocalUiUrl(pkg, child.getHzScrollBarRes?.() ?? null));
  buf.writeSEx(remapLocalUiUrl(pkg, child.getHeaderRes?.() ?? null));
  buf.writeSEx(remapLocalUiUrl(pkg, child.getFooterRes?.() ?? null));
}
function _writeListItems(buf, child, pkg, version) {
  buf.writeS(remapLocalUiUrl(pkg, child.getDefaultItem?.() ?? null));
  const isTree = child.propertyType === "GTree";
  const listItems = child.getListItems?.() ?? [];
  buf.writeInt16(listItems.length);
  for (const item of listItems) {
    const itemStart = buf.pos;
    buf.writeInt16(0);
    buf.writeS(remapLocalUiUrl(pkg, item.url ?? null));
    if (isTree) {
      const explicitFolder = item.isFolder;
      const isFolder = explicitFolder ?? (!(item.icon ?? null) && !(item.url ?? null));
      buf.writeBool(isFolder);
      buf.writeUint8(Math.max(0, item.level ?? 0));
    }
    buf.writeSEx(item.title ?? null, true);
    buf.writeSEx(item.selectedTitle ?? null, true);
    buf.writeS(remapLocalUiUrl(pkg, item.icon ?? null));
    buf.writeS(remapLocalUiUrl(pkg, item.selectedIcon ?? null));
    buf.writeS(item.name ?? null);
    buf.writeInt16(0);
    if (version >= 2) {
      buf.writeInt16(0);
    }
    const itemEnd = buf.pos;
    const saved = buf.pos;
    buf.pos = itemStart;
    buf.writeInt16(itemEnd - itemStart - 2);
    buf.pos = saved;
  }
}
function _writeTreeSettings(buf, child) {
  buf.writeInt32(child.getIndent?.() ?? 0);
  buf.writeUint8(child.getClickToExpand?.() ?? 0);
}
function _writeChildBlock4Component(buf, child, comp, _pkg) {
  const pageCtrlName = child.getPageController?.() ?? null;
  if (pageCtrlName) {
    const controllers = comp.listControllers();
    const ctrlIdx = controllers.findIndex((c) => c.getName() === pageCtrlName);
    buf.writeInt16(ctrlIdx >= 0 ? ctrlIdx : -1);
  } else {
    buf.writeInt16(-1);
  }
  const ctrlStr = child.getControllerOverrides?.() ?? "";
  if (ctrlStr) {
    const parts = ctrlStr.split(",");
    const cntPos = buf.pos;
    buf.writeInt16(0);
    let count = 0;
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i]) {
        buf.writeS(parts[i]);
        buf.writeS(parts[i + 1] ?? "");
        count++;
      }
    }
    const saved = buf.pos;
    buf.pos = cntPos;
    buf.writeInt16(count);
    buf.pos = saved;
  } else {
    buf.writeInt16(0);
  }
  buf.writeInt16(0);
}
function _writeChildBlock4TextInput(buf, child) {
  buf.writeSEx(child.getPromptText?.() ?? child.getPrompt?.() ?? null);
  buf.writeSEx(child.getRestrict?.() ?? null);
  buf.writeInt32(child.getMaxLength?.() ?? 0);
  buf.writeInt32(child.getKeyboardType?.() ?? 0);
  buf.writeBool(child.getPassword?.() ?? false);
}
function _writeComponentScrollPane(buf, comp, pkg) {
  buf.writeUint8(comp.getScrollType?.() ?? 1);
  buf.writeUint8(comp.getScrollBarDisplay?.() ?? 0);
  buf.writeInt32(comp.getScrollBarFlags?.() ?? 0);
  const sbMargin = comp.getScrollBarMargin?.() ?? null;
  buf.writeBool(!!sbMargin);
  if (sbMargin) {
    buf.writeInt32(sbMargin.top ?? 0);
    buf.writeInt32(sbMargin.bottom ?? 0);
    buf.writeInt32(sbMargin.left ?? 0);
    buf.writeInt32(sbMargin.right ?? 0);
  }
  buf.writeSEx(remapLocalUiUrl(pkg, comp.getVtScrollBarRes?.() ?? null));
  buf.writeSEx(remapLocalUiUrl(pkg, comp.getHzScrollBarRes?.() ?? null));
  buf.writeSEx(remapLocalUiUrl(pkg, comp.getHeaderRes?.() ?? null));
  buf.writeSEx(remapLocalUiUrl(pkg, comp.getFooterRes?.() ?? null));
}

// packages/core/src/io/binary-writer.ts
var BinItemType2 = {
  Image: 0,
  MovieClip: 1,
  Sound: 2,
  Component: 3,
  Atlas: 4,
  Font: 5,
  Misc: 7,
  Spine: 8,
  DragonBones: 9
};
var EDITOR_TYPE_STRING = {
  ImageResource: "image",
  MiscResource: "misc",
  MovieClipResource: "movieclip",
  SoundResource: "sound",
  Component: "component",
  FontResource: "font",
  SpineResource: "spine",
  DragonBonesResource: "dragonbones"
};
function getRuntimeAtlasFileName(file, index) {
  if (!file) return `atlas${index}.png`;
  const markerIndex = file.lastIndexOf("_atlas");
  if (markerIndex >= 0) return file.slice(markerIndex + 1);
  return file;
}
function sortResources(resources) {
  return [...resources].sort((a, b) => {
    const aExported = a.getExported?.() ?? false;
    const bExported = b.getExported?.() ?? false;
    if (aExported && !bExported) return 1;
    if (!aExported && bExported) return -1;
    const aType = EDITOR_TYPE_STRING[a.propertyType] ?? a.propertyType;
    const bType = EDITOR_TYPE_STRING[b.propertyType] ?? b.propertyType;
    const typeCmp = aType.localeCompare(bType);
    if (typeCmp !== 0) return typeCmp;
    const aId = a.getId?.() ?? "";
    const bId = b.getId?.() ?? "";
    return aId.localeCompare(bId);
  });
}
var BinaryWriter = class {
  _fs;
  constructor(fs3) {
    this._fs = fs3;
  }
  async write(doc, filePath, options = {}) {
    const packages = doc.getRoot().listPackages();
    if (packages.length === 0) throw new Error("Document has no packages to write.");
    const idx = options.packageIndex ?? 0;
    const pkg = packages[idx];
    if (!pkg) throw new Error(`Package index ${idx} out of range (${packages.length} packages).`);
    const data = this._serializePackage(doc, pkg, options);
    await this._fs.writeFileRaw(filePath, data);
  }
  _serializePackage(doc, pkg, options) {
    const version = options.version ?? 7;
    const compressed = options.compressed ?? false;
    const packageId = pkg.getId();
    const packageName = pkg.getName();
    const data = new WriteBuffer(65536);
    const extras = pkg.getExtras();
    const publishedResourceIds = Array.isArray(extras.publishedResourceIds) ? new Set(extras.publishedResourceIds) : null;
    const includeBranches = extras.publishedIncludeBranches ?? true;
    const resources = sortResources(
      publishedResourceIds ? pkg.listResources().filter((resource) => publishedResourceIds.has(resource.getId())) : pkg.listResources()
    );
    const dependencies = pkg.listDependencies().map((dep) => ({
      id: dep.getId(),
      name: dep.getName()
    })).filter((dep) => !!dep.id);
    const branchNames = includeBranches ? getPackageBranchNames(doc, resources) : [];
    const branchItemIdsMap = buildBranchItemIdsMap(pkg, branchNames);
    const publishedItemIdMap = new Map(resources.map((resource) => [resource.getId(), getPublishedItemId(resource)]));
    const sprites = [];
    const atlases = pkg.listAtlases();
    if (atlases.length > 0) {
      for (const atlas2 of atlases) {
        const atlasId = getAtlasId(atlas2);
        for (const sprite of atlas2.listSprites()) {
          sprites.push({
            itemId: publishedItemIdMap.get(sprite.getItemId()) ?? sprite.getItemId(),
            atlasId,
            x: sprite.getRectX(),
            y: sprite.getRectY(),
            w: sprite.getRectWidth(),
            h: sprite.getRectHeight(),
            rotated: sprite.getRotated(),
            offsetX: sprite.getOffsetX(),
            offsetY: sprite.getOffsetY(),
            originalWidth: sprite.getOriginalWidth(),
            originalHeight: sprite.getOriginalHeight()
          });
        }
      }
    } else if (extras.sprites) {
      sprites.push(...extras.sprites);
    }
    const pixelHitTests = resources.filter((resource) => resource.propertyType === "ImageResource").map((resource) => getPixelHitTestEntry(resource)).filter((entry) => entry !== null);
    const indexTablePos = data.pos;
    data.writeUint8(6);
    data.writeUint8(0);
    const offsetsPos = data.pos;
    for (let i = 0; i < 6; i++) data.writeUint32(0);
    const block0Offset = data.pos - indexTablePos;
    data.writeInt16(dependencies.length);
    for (const dep of dependencies) {
      data.writeS(dep.id);
      data.writeS(dep.name);
    }
    if (version >= 2) {
      data.writeInt16(branchNames.length);
      for (const branchName of branchNames) {
        data.writeS(branchName);
      }
    }
    const block1Offset = data.pos - indexTablePos;
    const atlasItems = atlases.map((atlas2) => ({
      propertyType: "AtlasItem",
      getId: () => getAtlasId(atlas2),
      getName: () => null,
      getPath: () => null,
      getFile: () => getRuntimeAtlasFileName(atlas2.getFile(), atlas2.getIndex()),
      getExported: () => false,
      getWidth: () => atlas2.getWidth?.() ?? 0,
      getHeight: () => atlas2.getHeight?.() ?? 0
    }));
    const allItems = [...resources, ...atlasItems];
    const packageItemIds = new Set(allItems.map((item) => {
      if ("getExtras" in item) {
        return getPublishedItemId(item);
      }
      return item.getId();
    }));
    data.writeUint16(allItems.length);
    for (const res of allItems) {
      const itemStartPos = data.pos;
      data.writeInt32(0);
      const type = res.propertyType;
      switch (type) {
        case "ImageResource": {
          data.writeUint8(BinItemType2.Image);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath() ?? "/");
          data.writeS(null);
          data.writeBool(res.getExported());
          data.writeInt32(res.getWidth());
          data.writeInt32(res.getHeight());
          const scaleOpt = res.getScaleOption();
          data.writeUint8(scaleOpt);
          if (scaleOpt === 1) {
            const grid = res.getScale9Grid() ?? [0, 0, 0, 0];
            data.writeInt32(grid[0]);
            data.writeInt32(grid[1]);
            data.writeInt32(grid[2]);
            data.writeInt32(grid[3]);
            data.writeInt32(0);
          }
          data.writeBool(res.getSmoothing());
          break;
        }
        case "MovieClipResource": {
          data.writeUint8(BinItemType2.MovieClip);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath() ?? "/");
          data.writeS(null);
          data.writeBool(res.getExported());
          data.writeInt32(getOptionalNumber(res, "getWidth"));
          data.writeInt32(getOptionalNumber(res, "getHeight"));
          data.writeBool(res.getSmoothing());
          const frameData = _encodeMovieClipFrames({
            interval: res.getInterval(),
            swing: res.getSwing(),
            repeatDelay: res.getRepeatDelay(),
            frames: res.listFrames().map((frame) => ({
              x: frame.getRectX(),
              y: frame.getRectY(),
              width: frame.getRectWidth(),
              height: frame.getRectHeight(),
              addDelay: frame.getAddDelay(),
              spriteId: frame.getSpriteId() || null
            }))
          }, data);
          data.writeBuffer(frameData);
          break;
        }
        case "SoundResource": {
          data.writeUint8(BinItemType2.Sound);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath());
          const soundFile = res.getFile();
          const soundExt = soundFile.includes(".") ? soundFile.split(".").pop() : "wav";
          data.writeS(`${getPublishedItemId(res)}.${soundExt}`);
          data.writeBool(res.getExported());
          data.writeInt32(0);
          data.writeInt32(0);
          break;
        }
        case "MiscResource": {
          data.writeUint8(BinItemType2.Misc);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath());
          data.writeS(getPublishedFileName(res));
          data.writeBool(res.getExported());
          data.writeInt32(0);
          data.writeInt32(0);
          break;
        }
        case "Component": {
          data.writeUint8(BinItemType2.Component);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath());
          data.writeS(null);
          data.writeBool(res.getExported());
          data.writeInt32(res.getWidth());
          data.writeInt32(res.getHeight());
          const extTypeMap = {
            Label: 11,
            Button: 12,
            ComboBox: 13,
            ProgressBar: 14,
            Slider: 15,
            ScrollBar: 16
          };
          const compExtras = res.getExtras();
          const extType = res.getExtensionType?.() ?? compExtras.extensionType;
          data.writeUint8(extType ? extTypeMap[extType] ?? 0 : 0);
          if (compExtras?._rawBinary) {
            data.writeBuffer(toUint8Array(compExtras._rawBinary));
          } else {
            const encoded = encodeComponent(res, doc, pkg, version, data);
            data.writeBuffer(encoded);
          }
          break;
        }
        case "FontResource": {
          data.writeUint8(BinItemType2.Font);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath());
          data.writeS(null);
          data.writeBool(res.getExported());
          data.writeInt32(0);
          data.writeInt32(0);
          const glyphData = _encodeFontGlyphs({
            hasFace: res.getTtf(),
            colored: res.getTint(),
            resizable: res.getAutoScale(),
            hasChannel: res.getHasChannel(),
            fontSize: res.getFontSize(),
            xadvance: res.getXAdvance(),
            lineHeight: res.getLineHeight(),
            glyphs: res.listGlyphs().map((glyph) => ({
              charId: glyph.getCharId() || glyph.getChar().codePointAt(0) || 0,
              img: glyph.getImg() || null,
              x: glyph.getX(),
              y: glyph.getY(),
              xoffset: glyph.getXOffset(),
              yoffset: glyph.getYOffset(),
              width: glyph.getWidth(),
              height: glyph.getHeight(),
              xadvance: glyph.getAdvance(),
              channel: glyph.getChannel()
            }))
          }, data);
          data.writeBuffer(glyphData);
          break;
        }
        case "SpineResource": {
          data.writeUint8(BinItemType2.Spine);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath());
          data.writeS(getPublishedFileName(res));
          data.writeBool(res.getExported());
          data.writeInt32(res.getWidth());
          data.writeInt32(res.getHeight());
          data.writeFloat32(res.getAnchorX());
          data.writeFloat32(res.getAnchorY());
          break;
        }
        case "DragonBonesResource": {
          data.writeUint8(BinItemType2.DragonBones);
          data.writeS(getPublishedItemId(res));
          data.writeS(res.getName());
          data.writeS(res.getPath());
          data.writeS(getPublishedFileName(res));
          data.writeBool(res.getExported());
          data.writeInt32(res.getWidth());
          data.writeInt32(res.getHeight());
          data.writeFloat32(res.getAnchorX());
          data.writeFloat32(res.getAnchorY());
          break;
        }
        default:
          if (type === "AtlasItem") {
            const atlasItem = res;
            data.writeUint8(BinItemType2.Atlas);
            data.writeS(atlasItem.getId());
            data.writeS(atlasItem.getName());
            data.writeS(atlasItem.getPath());
            data.writeS(atlasItem.getFile());
            data.writeBool(false);
            data.writeInt32(atlasItem.getWidth());
            data.writeInt32(atlasItem.getHeight());
          } else {
            const miscItem = res;
            data.writeUint8(7);
            data.writeS(getOptionalStringId(miscItem));
            data.writeS(miscItem.getName());
            data.writeS("/");
            data.writeS("");
            data.writeBool(false);
            data.writeInt32(0);
            data.writeInt32(0);
          }
          break;
      }
      if (version >= 2) {
        const branchName = includeBranches ? getItemBranchName(res) : "";
        const branchItemIds = includeBranches ? getItemBranchItemIds(res, branchNames, branchItemIdsMap) : [];
        data.writeSEx(branchName || null);
        data.writeUint8(branchItemIds.length);
        for (const branchItemId of branchItemIds) {
          data.writeSEx(branchItemId || null);
        }
        data.writeUint8(0);
      }
      const nextPos = data.pos;
      const savedPos2 = data.pos;
      data.pos = itemStartPos;
      data.writeInt32(nextPos - itemStartPos - 4);
      data.pos = savedPos2;
    }
    const block2Offset = data.pos - indexTablePos;
    data.writeUint16(sprites.length);
    for (const sp of sprites) {
      const spriteStartPos = data.pos;
      data.writeUint16(0);
      data.writeS(sp.itemId);
      data.writeS(sp.atlasId);
      data.writeInt32(sp.x);
      data.writeInt32(sp.y);
      data.writeInt32(sp.w);
      data.writeInt32(sp.h);
      data.writeBool(sp.rotated);
      if (version >= 2) {
        const ox = sp.offsetX ?? 0;
        const oy = sp.offsetY ?? 0;
        const ow = sp.originalWidth ?? 0;
        const oh = sp.originalHeight ?? 0;
        const isPackageItemSprite = packageItemIds.has(sp.itemId);
        const isZeroSizedDirectOutput = isPackageItemSprite && sp.w === 0 && sp.h === 0;
        const hasOriginal = isPackageItemSprite && sp.rotated || ox !== 0 || oy !== 0 || isZeroSizedDirectOutput;
        data.writeBool(hasOriginal);
        if (hasOriginal) {
          data.writeInt32(ox);
          data.writeInt32(oy);
          data.writeInt32(ow || (sp.rotated ? sp.h : sp.w));
          data.writeInt32(oh || (sp.rotated ? sp.w : sp.h));
        }
      }
      const spriteNextPos = data.pos;
      const saved2 = data.pos;
      data.pos = spriteStartPos;
      data.writeUint16(spriteNextPos - spriteStartPos - 2);
      data.pos = saved2;
    }
    let block3Offset = 0;
    if (pixelHitTests.length > 0) {
      block3Offset = data.pos - indexTablePos;
      data.writeInt16(pixelHitTests.length);
      for (const hitTest of pixelHitTests) {
        const hitStartPos = data.pos;
        data.writeInt32(0);
        data.writeS(hitTest.itemId);
        data.writeInt32(0);
        data.writeInt32(hitTest.pixelWidth);
        data.writeUint8(hitTest.scaleDenominator);
        data.writeInt32(hitTest.pixels.byteLength);
        data.writeBytes(hitTest.pixels);
        const hitNextPos = data.pos;
        const saved3 = data.pos;
        data.pos = hitStartPos;
        data.writeInt32(hitNextPos - hitStartPos - 4);
        data.pos = saved3;
      }
    }
    const block4Offset = data.pos - indexTablePos;
    const stringTable = data.getStringTable();
    const longStrings = [];
    const encoder = new TextEncoder();
    data.writeInt32(stringTable.length);
    for (const [index, s] of stringTable.entries()) {
      const encoded = encoder.encode(s);
      if (encoded.byteLength > 65535) {
        data.writeUint16(0);
        longStrings.push({ index, value: s });
        continue;
      }
      data.writeUTFString(s);
    }
    let block5Offset = 0;
    if (longStrings.length > 0) {
      block5Offset = data.pos - indexTablePos;
      data.writeInt32(longStrings.length);
      for (const entry of longStrings) {
        const encoded = encoder.encode(entry.value);
        data.writeUint16(entry.index);
        data.writeInt32(encoded.byteLength);
        data.writeBytes(encoded);
      }
    }
    const savedPos = data.pos;
    data.pos = offsetsPos;
    data.writeUint32(block0Offset);
    data.writeUint32(block1Offset);
    data.writeUint32(block2Offset);
    data.writeUint32(block3Offset);
    data.writeUint32(block4Offset);
    data.writeUint32(block5Offset);
    data.pos = savedPos;
    const dataBytes = data.toUint8Array();
    let bodyBytes;
    if (compressed) {
      bodyBytes = deflateRaw_1(dataBytes);
    } else {
      bodyBytes = dataBytes;
    }
    const header = new WriteBuffer(256);
    header.writeUint32(FGUI_MAGIC);
    header.writeInt32(version);
    header.writeBool(compressed);
    header.writeUTFString(packageId);
    header.writeUTFString(packageName);
    header.skip(20);
    const headerBytes = header.toUint8Array();
    const result = new Uint8Array(headerBytes.byteLength + bodyBytes.byteLength);
    result.set(headerBytes, 0);
    result.set(bodyBytes, headerBytes.byteLength);
    return result;
  }
};
function _encodeMovieClipFrames(jtaData, parentBuf) {
  const buf = new WriteBuffer(1024, parentBuf);
  const indexTablePos = buf.pos;
  buf.writeUint8(2);
  buf.writeUint8(0);
  const offsetsPos = buf.pos;
  buf.writeUint32(0);
  buf.writeUint32(0);
  const block0Offset = buf.pos - indexTablePos;
  buf.writeInt32(jtaData.interval);
  buf.writeBool(jtaData.swing);
  buf.writeInt32(jtaData.repeatDelay);
  const block1Offset = buf.pos - indexTablePos;
  buf.writeInt16(jtaData.frames.length);
  for (const frame of jtaData.frames) {
    const frameStart = buf.pos;
    buf.writeInt16(0);
    buf.writeInt32(frame.x);
    buf.writeInt32(frame.y);
    buf.writeInt32(frame.width);
    buf.writeInt32(frame.height);
    buf.writeInt32(frame.addDelay);
    buf.writeS(frame.spriteId);
    const frameEnd = buf.pos;
    const saved = buf.pos;
    buf.pos = frameStart;
    buf.writeInt16(frameEnd - frameStart - 2);
    buf.pos = saved;
  }
  const savedPos = buf.pos;
  buf.pos = offsetsPos;
  buf.writeUint32(block0Offset);
  buf.writeUint32(block1Offset);
  buf.pos = savedPos;
  return buf.toUint8Array();
}
function _encodeFontGlyphs(fntData, parentBuf) {
  const buf = new WriteBuffer(2048, parentBuf);
  const indexTablePos = buf.pos;
  buf.writeUint8(2);
  buf.writeUint8(0);
  const offsetsPos = buf.pos;
  buf.writeUint32(0);
  buf.writeUint32(0);
  const block0Offset = buf.pos - indexTablePos;
  buf.writeBool(fntData.hasFace);
  buf.writeBool(fntData.colored);
  buf.writeBool(fntData.resizable);
  buf.writeBool(fntData.hasChannel);
  buf.writeInt32(fntData.fontSize);
  buf.writeInt32(fntData.xadvance);
  buf.writeInt32(fntData.lineHeight);
  const block1Offset = buf.pos - indexTablePos;
  buf.writeInt32(fntData.glyphs.length);
  for (const glyph of fntData.glyphs) {
    const glyphStart = buf.pos;
    buf.writeInt16(0);
    buf.writeInt16(glyph.charId);
    buf.writeS(glyph.img);
    buf.writeInt32(glyph.x);
    buf.writeInt32(glyph.y);
    buf.writeInt32(glyph.xoffset);
    buf.writeInt32(glyph.yoffset);
    buf.writeInt32(glyph.width);
    buf.writeInt32(glyph.height);
    buf.writeInt32(glyph.xadvance);
    buf.writeUint8(glyph.channel);
    const glyphEnd = buf.pos;
    const saved = buf.pos;
    buf.pos = glyphStart;
    buf.writeInt16(glyphEnd - glyphStart - 2);
    buf.pos = saved;
  }
  const savedPos = buf.pos;
  buf.pos = offsetsPos;
  buf.writeUint32(block0Offset);
  buf.writeUint32(block1Offset);
  buf.pos = savedPos;
  return buf.toUint8Array();
}
function getPublishedFileName(resource) {
  const extras = resource.getExtras?.() ?? {};
  return extras._publishedFile ?? resource.getFile();
}
function getPublishedItemId(item) {
  const extras = item.getExtras?.() ?? {};
  return extras._publishedId ?? item.getId();
}
function getItemBranchName(item) {
  const branchAware = item;
  return branchAware.getBranch?.() ?? "";
}
function getPackageBranchNames(doc, resources) {
  const packageBranchSet = new Set(
    resources.map((resource) => getItemBranchName(resource)).filter((branchName) => !!branchName)
  );
  if (packageBranchSet.size === 0) {
    return [];
  }
  return doc.getRoot().listBranches().filter((branchName) => packageBranchSet.has(branchName));
}
function buildBranchResourceKey(resource) {
  const path3 = resource.getPath?.() ?? "";
  const name = resource.getName?.() ?? "";
  return `${resource.propertyType}|${path3}|${name}`;
}
function buildBranchItemIdsMap(pkg, branchNames) {
  const map = /* @__PURE__ */ new Map();
  const branchSlotByName = new Map(branchNames.map((branchName, index) => [branchName, index]));
  for (const resource of pkg.listResources()) {
    const branchName = getItemBranchName(resource);
    if (!branchName) continue;
    const key = buildBranchResourceKey(resource);
    if (branchNames.length === 0) {
      if (!map.has(key)) {
        map.set(key, [resource.getId()]);
      }
      continue;
    }
    const slotIndex = branchSlotByName.get(branchName);
    if (slotIndex === void 0) continue;
    const branchIds = map.get(key) ?? Array(branchNames.length).fill("");
    branchIds[slotIndex] = resource.getId();
    map.set(key, branchIds);
  }
  return map;
}
function getItemBranchItemIds(item, branchNames, branchItemIdsMap) {
  const branchAware = item;
  const explicitBranchItemIds = branchAware.getBranchItemIds?.() ?? [];
  if (branchNames.length === 0) {
    if (explicitBranchItemIds.length > 0) {
      return explicitBranchItemIds.find((value) => !!value) ? [explicitBranchItemIds.find((value) => !!value) ?? ""] : [];
    }
    if (getItemBranchName(item)) return [];
    const inferred2 = branchItemIdsMap.get(buildBranchResourceKey(item));
    if (!inferred2) return [];
    const first = inferred2.find((value) => !!value);
    return first ? [first] : [];
  }
  if (explicitBranchItemIds.length > 0) {
    const normalized = branchNames.map((_, index) => explicitBranchItemIds[index] ?? "");
    return normalized.some((value) => !!value) ? normalized : [];
  }
  if (getItemBranchName(item)) return [];
  const inferred = branchItemIdsMap.get(buildBranchResourceKey(item));
  if (!inferred) return [];
  return inferred.some((value) => !!value) ? [...inferred] : [];
}
function getAtlasId(atlas2) {
  return `atlas${atlas2.getIndex()}`;
}
function toUint8Array(raw) {
  return new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
}
function getOptionalNumber(value, key) {
  const getter = value[key];
  return getter?.call(value) ?? 0;
}
function getOptionalStringId(item) {
  if ("getId" in item && typeof item.getId === "function") {
    return item.getId();
  }
  return "";
}
function getPixelHitTestEntry(resource) {
  const payload = resource.getPixelHitTestData();
  if (!payload) return null;
  return {
    itemId: resource.getId(),
    pixelWidth: payload.pixelWidth,
    scaleDenominator: payload.scaleDenominator,
    pixels: payload.pixels
  };
}

// packages/core/src/io/platform-io.ts
var PlatformIO = class {
  async readProject(projectPath) {
    const fs3 = this.createFileSystem();
    const reader = new ProjectReader(fs3);
    return reader.read(projectPath);
  }
  async writeProject(doc, projectPath) {
    const fs3 = this.createFileSystem();
    const writer = new ProjectWriter(fs3);
    return writer.write(doc, projectPath);
  }
  async readBinary(filePath) {
    const fs3 = this.createFileSystem();
    const reader = new BinaryReader(fs3);
    return reader.read(filePath);
  }
  async writeBinary(doc, filePath, options) {
    const fs3 = this.createFileSystem();
    const writer = new BinaryWriter(fs3);
    return writer.write(doc, filePath, options);
  }
};

// packages/core/src/io/node-io.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
var NodeIO = class extends PlatformIO {
  createFileSystem() {
    return {
      async readFile(filePath) {
        return fs.readFile(filePath, "utf-8");
      },
      async readFileRaw(filePath) {
        const buf = await fs.readFile(filePath);
        return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      },
      async writeFile(filePath, content) {
        await fs.writeFile(filePath, content, "utf-8");
      },
      async writeFileRaw(filePath, data) {
        await fs.writeFile(filePath, data);
      },
      async mkdir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
      },
      async readdir(dirPath) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries.filter((e) => e.isDirectory()).map((e) => e.name);
      },
      async exists(filePath) {
        try {
          await fs.access(filePath);
          return true;
        } catch {
          return false;
        }
      },
      join(...paths) {
        return path.join(...paths);
      },
      dirname(filePath) {
        return path.dirname(filePath);
      }
    };
  }
};

// packages/functions/src/inspect.ts
function mapResource(resource) {
  return {
    name: resource.getName(),
    id: resource.getId(),
    path: resource.getPath?.() ?? "/",
    exported: resource.getExported?.() ?? false
  };
}
function mapComponentDetail(component, totals) {
  const children = component.listChildren();
  const controllers = component.listControllers();
  const transitions = component.listTransitions();
  totals.displayObjects += children.length;
  totals.controllers += controllers.length;
  totals.transitions += transitions.length;
  for (const child of children) {
    totals.gears += child.listGears().length;
  }
  return {
    name: component.getName(),
    id: component.getId(),
    childCount: children.length,
    controllerCount: controllers.length,
    transitionCount: transitions.length
  };
}
function inspect(doc) {
  const root = doc.getRoot();
  const totals = {
    packages: 0,
    images: 0,
    sounds: 0,
    fonts: 0,
    movieClips: 0,
    components: 0,
    displayObjects: 0,
    gears: 0,
    controllers: 0,
    transitions: 0
  };
  const packages = root.listPackages().map((pkg) => {
    totals.packages++;
    const resources = pkg.listResources();
    const images = resources.filter((r) => r.propertyType === "ImageResource");
    const sounds = resources.filter((r) => r.propertyType === "SoundResource");
    const fonts = resources.filter((r) => r.propertyType === "FontResource");
    const movieClips = resources.filter((r) => r.propertyType === "MovieClipResource");
    const components = pkg.listComponents();
    totals.images += images.length;
    totals.sounds += sounds.length;
    totals.fonts += fonts.length;
    totals.movieClips += movieClips.length;
    totals.components += components.length;
    const componentDetails = components.map((component) => mapComponentDetail(component, totals));
    return {
      name: pkg.getName(),
      id: pkg.getId(),
      publishName: pkg.getPublishName() || pkg.getName(),
      resources: {
        images: { count: images.length, details: images.map(mapResource) },
        sounds: { count: sounds.length, details: sounds.map(mapResource) },
        fonts: { count: fonts.length, details: fonts.map(mapResource) },
        movieClips: { count: movieClips.length, details: movieClips.map(mapResource) },
        components: { count: components.length, details: components.map(mapResource) }
      },
      componentDetails
    };
  });
  return {
    projectId: root.getProjectId(),
    projectType: root.getProjectType(),
    version: root.getVersion(),
    packages,
    totals
  };
}

// packages/functions/src/utils.ts
function createTransform(name, fn) {
  Object.defineProperty(fn, "name", { value: name });
  return fn;
}

// packages/functions/src/max-rects-compat.ts
var NO_ROTATION = 2;
var MAX_SCORE = 2147483647;
var MAX_RECTS_METHOD = {
  BestShortSideFit: 0,
  BestLongSideFit: 1,
  BestAreaFit: 2,
  BottomLeftRule: 3,
  ContactPointRule: 4
};
var COMPAT_NODE_RECT_FLAGS = {
  DUPLICATE_PADDING: 1,
  NO_ROTATION
};
var MaxRectsCompat = class _MaxRectsCompat {
  static helperRect = createNodeRect();
  binWidth = 0;
  binHeight = 0;
  allowRotations = false;
  usedRectangles = [];
  freeRectangles = [];
  init(width, height, allowRotations = false) {
    this.binWidth = width;
    this.binHeight = height;
    this.allowRotations = allowRotations;
    this.usedRectangles.length = 0;
    this.freeRectangles.length = 0;
    this.freeRectangles.push({
      ...createNodeRect(),
      x: 0,
      y: 0,
      width,
      height
    });
  }
  insert(rect, method) {
    const newNode = this.scoreRect(rect, method);
    if (newNode.height === 0) return null;
    const placed = cloneNodeRect(newNode);
    this.placeRect(placed);
    return placed;
  }
  pack(rects, method) {
    const remaining = rects.map(cloneNodeRect);
    while (remaining.length > 0) {
      let bestIndex = -1;
      const bestNode = createNodeRect();
      bestNode.score1 = MAX_SCORE;
      bestNode.score2 = MAX_SCORE;
      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = this.scoreRect(remaining[index], method);
        if (candidate.score1 < bestNode.score1 || candidate.score1 === bestNode.score1 && candidate.score2 < bestNode.score2) {
          copyNodeRect(bestNode, candidate);
          bestIndex = index;
        }
      }
      if (bestIndex === -1) break;
      this.placeRect(bestNode);
      remaining.splice(bestIndex, 1);
    }
    const result = this.getResult();
    result.remainingRects = remaining;
    return result;
  }
  getResult() {
    let width = 0;
    let height = 0;
    for (const rect of this.usedRectangles) {
      width = Math.max(width, rect.x + rect.width);
      height = Math.max(height, rect.y + rect.height);
    }
    return {
      outputRects: this.usedRectangles.map(cloneNodeRect),
      remainingRects: [],
      occupancy: this.getOccupancy(),
      width,
      height
    };
  }
  getOccupancy() {
    let usedSurface = 0;
    for (const rect of this.usedRectangles) usedSurface += rect.width * rect.height;
    return usedSurface / (this.binWidth * this.binHeight);
  }
  placeRect(rect) {
    for (let index = 0; index < this.freeRectangles.length; index += 1) {
      if (this.splitFreeNode(this.freeRectangles[index], rect)) {
        this.freeRectangles.splice(index, 1);
        index -= 1;
      }
    }
    this.pruneFreeList();
    this.usedRectangles.push(rect);
  }
  scoreRect(rect, method) {
    const helper = _MaxRectsCompat.helperRect;
    helper.height = 0;
    let newNode;
    switch (method) {
      case MAX_RECTS_METHOD.BestShortSideFit:
        newNode = this.findPositionForNewNodeBestShortSideFit(rect.width, rect.height, allowRotation(rect));
        break;
      case MAX_RECTS_METHOD.BestLongSideFit:
        newNode = this.findPositionForNewNodeBestLongSideFit(rect.width, rect.height, allowRotation(rect));
        break;
      case MAX_RECTS_METHOD.BestAreaFit:
        newNode = this.findPositionForNewNodeBestAreaFit(rect.width, rect.height, allowRotation(rect));
        break;
      case MAX_RECTS_METHOD.BottomLeftRule:
        newNode = this.findPositionForNewNodeBottomLeft(rect.width, rect.height, allowRotation(rect));
        break;
      case MAX_RECTS_METHOD.ContactPointRule:
        newNode = this.findPositionForNewNodeContactPoint(rect.width, rect.height, allowRotation(rect));
        newNode.score1 = -newNode.score1;
        break;
      default:
        newNode = helper;
        break;
    }
    if (newNode.height === 0) {
      newNode.score1 = MAX_SCORE;
      newNode.score2 = MAX_SCORE;
    }
    newNode.index = rect.index;
    newNode.subIndex = rect.subIndex;
    newNode.flags = rect.flags;
    newNode.sourceKind = rect.sourceKind;
    return cloneNodeRect(newNode);
  }
  findPositionForNewNodeBottomLeft(width, height, allowRectRotation) {
    const bestNode = _MaxRectsCompat.helperRect;
    bestNode.score1 = MAX_SCORE;
    bestNode.score2 = 0;
    for (const freeRect of this.freeRectangles) {
      if (freeRect.width >= width && freeRect.height >= height) {
        const topSideY = freeRect.y + height;
        if (topSideY < bestNode.score1 || topSideY === bestNode.score1 && freeRect.x < bestNode.score2) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, width, height, false, topSideY, freeRect.x);
        }
      }
      if (this.allowRotations && allowRectRotation && freeRect.width >= height && freeRect.height >= width) {
        const topSideY = freeRect.y + width;
        if (topSideY < bestNode.score1 || topSideY === bestNode.score1 && freeRect.x < bestNode.score2) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, height, width, true, topSideY, freeRect.x);
        }
      }
    }
    return bestNode;
  }
  findPositionForNewNodeBestShortSideFit(width, height, allowRectRotation) {
    const bestNode = _MaxRectsCompat.helperRect;
    bestNode.score1 = MAX_SCORE;
    bestNode.score2 = 0;
    for (const freeRect of this.freeRectangles) {
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        if (shortSideFit < bestNode.score1 || shortSideFit === bestNode.score1 && longSideFit < bestNode.score2) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, width, height, false, shortSideFit, longSideFit);
        }
      }
      if (this.allowRotations && allowRectRotation && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        if (shortSideFit < bestNode.score1 || shortSideFit === bestNode.score1 && longSideFit < bestNode.score2) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, height, width, true, shortSideFit, longSideFit);
        }
      }
    }
    return bestNode;
  }
  findPositionForNewNodeBestLongSideFit(width, height, allowRectRotation) {
    const bestNode = _MaxRectsCompat.helperRect;
    bestNode.score1 = 0;
    bestNode.score2 = MAX_SCORE;
    for (const freeRect of this.freeRectangles) {
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        if (longSideFit < bestNode.score2 || longSideFit === bestNode.score2 && shortSideFit < bestNode.score1) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, width, height, false, shortSideFit, longSideFit);
        }
      }
      if (this.allowRotations && allowRectRotation && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        const longSideFit = Math.max(leftoverHoriz, leftoverVert);
        if (longSideFit < bestNode.score2 || longSideFit === bestNode.score2 && shortSideFit < bestNode.score1) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, height, width, true, shortSideFit, longSideFit);
        }
      }
    }
    return bestNode;
  }
  findPositionForNewNodeBestAreaFit(width, height, allowRectRotation) {
    const bestNode = _MaxRectsCompat.helperRect;
    bestNode.score1 = MAX_SCORE;
    bestNode.score2 = 0;
    for (const freeRect of this.freeRectangles) {
      const areaFit = freeRect.width * freeRect.height - width * height;
      if (freeRect.width >= width && freeRect.height >= height) {
        const leftoverHoriz = Math.abs(freeRect.width - width);
        const leftoverVert = Math.abs(freeRect.height - height);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        if (areaFit < bestNode.score1 || areaFit === bestNode.score1 && shortSideFit < bestNode.score2) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, width, height, false, areaFit, shortSideFit);
        }
      }
      if (this.allowRotations && allowRectRotation && freeRect.width >= height && freeRect.height >= width) {
        const leftoverHoriz = Math.abs(freeRect.width - height);
        const leftoverVert = Math.abs(freeRect.height - width);
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        if (areaFit < bestNode.score1 || areaFit === bestNode.score1 && shortSideFit < bestNode.score2) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, height, width, true, areaFit, shortSideFit);
        }
      }
    }
    return bestNode;
  }
  findPositionForNewNodeContactPoint(width, height, allowRectRotation) {
    const bestNode = _MaxRectsCompat.helperRect;
    bestNode.score1 = -1;
    bestNode.score2 = 0;
    for (const freeRect of this.freeRectangles) {
      if (freeRect.width >= width && freeRect.height >= height) {
        const score = this.contactPointScoreNode(freeRect.x, freeRect.y, width, height);
        if (score > bestNode.score1) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, width, height, false, score, bestNode.score2);
        }
      }
      if (this.allowRotations && allowRectRotation && freeRect.width >= height && freeRect.height >= width) {
        const score = this.contactPointScoreNode(freeRect.x, freeRect.y, height, width);
        if (score > bestNode.score1) {
          setNodeRect(bestNode, freeRect.x, freeRect.y, height, width, true, score, bestNode.score2);
        }
      }
    }
    return bestNode;
  }
  contactPointScoreNode(x, y, width, height) {
    let score = 0;
    if (x === 0 || x + width === this.binWidth) score += height;
    if (y === 0 || y + height === this.binHeight) score += width;
    for (const rect of this.usedRectangles) {
      if (rect.x === x + width || rect.x + rect.width === x) {
        score += commonIntervalLength(rect.y, rect.y + rect.height, y, y + height);
      }
      if (rect.y === y + height || rect.y + rect.height === y) {
        score += commonIntervalLength(rect.x, rect.x + rect.width, x, x + width);
      }
    }
    return score;
  }
  splitFreeNode(freeNode, usedNode) {
    if (usedNode.x >= freeNode.x + freeNode.width || usedNode.x + usedNode.width <= freeNode.x || usedNode.y >= freeNode.y + freeNode.height || usedNode.y + usedNode.height <= freeNode.y) {
      return false;
    }
    if (usedNode.x < freeNode.x + freeNode.width && usedNode.x + usedNode.width > freeNode.x) {
      if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.height) {
        const newNode = cloneNodeRect(freeNode);
        newNode.height = usedNode.y - newNode.y;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.y + usedNode.height < freeNode.y + freeNode.height) {
        const newNode = cloneNodeRect(freeNode);
        newNode.y = usedNode.y + usedNode.height;
        newNode.height = freeNode.y + freeNode.height - (usedNode.y + usedNode.height);
        this.freeRectangles.push(newNode);
      }
    }
    if (usedNode.y < freeNode.y + freeNode.height && usedNode.y + usedNode.height > freeNode.y) {
      if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.width) {
        const newNode = cloneNodeRect(freeNode);
        newNode.width = usedNode.x - newNode.x;
        this.freeRectangles.push(newNode);
      }
      if (usedNode.x + usedNode.width < freeNode.x + freeNode.width) {
        const newNode = cloneNodeRect(freeNode);
        newNode.x = usedNode.x + usedNode.width;
        newNode.width = freeNode.x + freeNode.width - (usedNode.x + usedNode.width);
        this.freeRectangles.push(newNode);
      }
    }
    return true;
  }
  pruneFreeList() {
    let length = this.freeRectangles.length;
    let left = 0;
    while (left < length) {
      let right = left + 1;
      while (right < length) {
        if (isContainedIn(this.freeRectangles[left], this.freeRectangles[right])) {
          this.freeRectangles.splice(left, 1);
          length -= 1;
          break;
        }
        if (isContainedIn(this.freeRectangles[right], this.freeRectangles[left])) {
          this.freeRectangles.splice(right, 1);
          length -= 1;
        }
        right += 1;
      }
      left += 1;
    }
  }
};
function createNodeRect() {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotated: false,
    index: 0,
    subIndex: -1,
    flags: 0,
    score1: 0,
    score2: 0,
    sourceKind: void 0
  };
}
function cloneNodeRect(rect) {
  return { ...rect };
}
function copyNodeRect(target, source) {
  target.x = source.x;
  target.y = source.y;
  target.width = source.width;
  target.height = source.height;
  target.rotated = source.rotated;
  target.index = source.index;
  target.subIndex = source.subIndex;
  target.flags = source.flags;
  target.score1 = source.score1;
  target.score2 = source.score2;
  target.sourceKind = source.sourceKind;
}
function setNodeRect(target, x, y, width, height, rotated, score1, score2) {
  target.x = x;
  target.y = y;
  target.width = width;
  target.height = height;
  target.rotated = rotated;
  target.score1 = score1;
  target.score2 = score2;
}
function allowRotation(rect) {
  return (rect.flags & NO_ROTATION) === 0;
}
function commonIntervalLength(startA, endA, startB, endB) {
  if (endA < startB || endB < startA) return 0;
  return Math.min(endA, endB) - Math.max(startA, startB);
}
function isContainedIn(left, right) {
  return left.x >= right.x && left.y >= right.y && left.x + left.width <= right.x + right.width && left.y + left.height <= right.y + right.height;
}

// packages/functions/src/max-rects-packer-compat.ts
var DEFAULT_SETTINGS = {
  pot: true,
  mof: true,
  padding: 2,
  rotation: false,
  minWidth: 16,
  minHeight: 16,
  maxWidth: 2048,
  maxHeight: 2048,
  square: false,
  fast: true,
  edgePadding: false,
  duplicatePadding: false,
  multiPage: false,
  preserveInputOrderOnTie: false
};
var sizeScheme = null;
var BinarySearchCompat = class {
  constructor(min, max, fuzziness, pot, mof) {
    this.pot = pot;
    this.mof = mof;
    this.fuzziness = pot ? 0 : fuzziness;
    if (pot) {
      this.min = Math.log(MaxRectsPackerCompat.getNextPowerOfTwo(min)) / Math.log(2);
      this.max = Math.log(MaxRectsPackerCompat.getNextPowerOfTwo(max)) / Math.log(2);
    } else if (mof) {
      this.min = min / 4;
      this.max = max / 4;
    } else {
      this.min = min;
      this.max = max;
    }
    this.low = this.min;
    this.high = this.max;
    this.current = this.min;
  }
  pot;
  mof;
  min;
  max;
  fuzziness;
  low;
  high;
  current;
  reset() {
    this.low = this.min;
    this.high = this.max;
    this.current = this.low + this.high >>> 1;
    return this.getCurrent();
  }
  next(failed) {
    if (this.low >= this.high) return -1;
    if (failed) this.low = this.current + 1;
    else this.high = this.current - 1;
    this.current = this.low + this.high >>> 1;
    if (Math.abs(this.low - this.high) < this.fuzziness) return -1;
    return this.getCurrent();
  }
  getCurrent() {
    if (this.pot) return Math.trunc(2 ** this.current);
    if (this.mof) return this.current * 4;
    return this.current;
  }
};
var MaxRectsPackerCompat = class _MaxRectsPackerCompat {
  maxRects = new MaxRectsCompat();
  settings;
  constructor(settings = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }
  static getNextPowerOfTwo(value) {
    if (Number.isInteger(value) && value > 0 && (value & value - 1) === 0) return value;
    let result = 1;
    const target = value - 1e-9;
    while (result < target) result <<= 1;
    return result;
  }
  pack(inputRects) {
    const rects = inputRects.map(cloneCompatRect);
    if (this.settings.fast) {
      const compare = this.settings.preserveInputOrderOnTie ? this.settings.rotation ? compareNodeRectStable : compareNodeRect2Stable : this.settings.rotation ? compareNodeRect : compareNodeRect2;
      vectorSortCompat(rects, compare);
    }
    const padding = this.settings.padding;
    let hasDuplicatePadding = false;
    for (const rect of rects) {
      if (duplicatePadding(rect)) hasDuplicatePadding = true;
      if (this.settings.maxWidth - rect.width > padding || duplicatePadding(rect)) rect.width += padding;
      if (this.settings.maxHeight - rect.height > padding || duplicatePadding(rect)) rect.height += padding;
    }
    const pages = [];
    let remaining = rects;
    while (remaining.length > 0) {
      const page = this.packPage(remaining);
      if (!page) return null;
      if (this.settings.pot) {
        page.width = _MaxRectsPackerCompat.getNextPowerOfTwo(page.width);
        page.height = _MaxRectsPackerCompat.getNextPowerOfTwo(page.height);
      } else if (this.settings.mof) {
        page.width = Math.ceil(page.width / 4) * 4;
        page.height = Math.ceil(page.height / 4) * 4;
      }
      if (this.settings.square) {
        const side = Math.max(page.width, page.height);
        page.width = side;
        page.height = side;
      }
      pages.push(page);
      remaining = page.remainingRects.map(cloneCompatRect);
    }
    pages.sort(comparePage);
    for (const page of pages) {
      for (const rect of page.outputRects) {
        shrinkRectForPadding(rect, padding, this.settings.maxWidth, this.settings.maxHeight);
        if (hasDuplicatePadding) {
          if (rect.width !== page.width) rect.x += Math.floor(padding / 2);
          if (rect.height !== page.height) rect.y += Math.floor(padding / 2);
        }
      }
      for (const rect of page.remainingRects) {
        shrinkRectForPadding(rect, padding, this.settings.maxWidth, this.settings.maxHeight);
      }
    }
    return pages;
  }
  packPage(rects) {
    if (!sizeScheme) sizeScheme = initSizeScheme();
    const edgePadding = this.settings.edgePadding ? this.settings.padding : 0;
    let totalArea = 0;
    for (const rect of rects) totalArea += rect.width * rect.height;
    const candidates = sizeScheme.filter(
      (entry) => entry.area >= totalArea && entry.width <= this.settings.maxWidth && entry.height <= this.settings.maxHeight
    );
    if (candidates.length === 0) {
      candidates.push({ width: this.settings.maxWidth, height: this.settings.maxHeight, area: 0, aspectRatio: 0, len: 0 });
    }
    let page = null;
    let selectedWidth = 0;
    let selectedHeight = 0;
    for (let index = 0; index < candidates.length; index += 1) {
      selectedWidth = candidates[index].width;
      selectedHeight = candidates[index].height;
      page = this.packAtSize(index !== candidates.length - 1, selectedWidth - edgePadding, selectedHeight - edgePadding, rects);
      if (page) break;
    }
    if (page && !this.settings.pot && page.remainingRects.length === 0) {
      let bestRefined = null;
      if (this.settings.square) {
        const min = Math.min(selectedWidth / 2, selectedHeight / 2);
        const max = Math.max(selectedWidth, selectedHeight);
        const search = new BinarySearchCompat(min, max, this.settings.fast ? 25 : 15, this.settings.pot, this.settings.mof);
        let current = search.reset();
        while (current !== -1) {
          const refined = this.packAtSize(true, current - edgePadding, current - edgePadding, rects);
          bestRefined = getBestPage(bestRefined, refined);
          current = search.next(refined == null);
        }
      } else {
        const widthSearch = new BinarySearchCompat(selectedWidth / 2, selectedWidth, this.settings.fast ? 25 : 15, this.settings.pot, this.settings.mof);
        const heightSearch = new BinarySearchCompat(selectedHeight / 2, selectedHeight, this.settings.fast ? 25 : 15, this.settings.pot, this.settings.mof);
        let currentHeight = heightSearch.reset();
        let currentWidth = widthSearch.reset();
        while (true) {
          let bestForHeight = null;
          while (currentWidth !== -1) {
            const refined = this.packAtSize(true, currentWidth - edgePadding, currentHeight - edgePadding, rects);
            bestForHeight = getBestPage(bestForHeight, refined);
            currentWidth = widthSearch.next(refined == null);
          }
          bestRefined = getBestPage(bestRefined, bestForHeight);
          currentHeight = heightSearch.next(bestForHeight == null);
          if (currentHeight === -1) break;
          currentWidth = widthSearch.reset();
        }
      }
      if (bestRefined) page = bestRefined;
    }
    return page;
  }
  packAtSize(requireFullFit, width, height, rects) {
    const methods = [MAX_RECTS_METHOD.BestShortSideFit, MAX_RECTS_METHOD.BestLongSideFit, MAX_RECTS_METHOD.BestAreaFit];
    let best = null;
    for (const method of methods) {
      this.maxRects.init(width, height, this.settings.rotation);
      let page;
      if (!this.settings.fast) {
        page = this.maxRects.pack(rects, method);
      } else {
        const remaining = [];
        let index = 0;
        while (index < rects.length) {
          if (this.maxRects.insert(rects[index], method) == null) {
            while (index < rects.length) {
              remaining.push(cloneCompatRect(rects[index]));
              index += 1;
            }
            break;
          }
          index += 1;
        }
        page = this.maxRects.getResult();
        page.remainingRects = remaining;
      }
      if (!(requireFullFit && page.remainingRects.length > 0) && page.outputRects.length !== 0) {
        best = getBestPage(best, page);
      }
    }
    return best;
  }
};
function vectorSortCompat(items, compare) {
  if (items.length <= 1) return;
  avmQuickSortCompat(items, 0, items.length - 1, compare);
}
function avmQuickSortCompat(items, initialLo, initialHi, compare) {
  if (initialLo >= initialHi) return;
  const stack = [];
  let lo = initialLo;
  let hi = initialHi;
  while (true) {
    const size = hi - lo + 1;
    if (size < 4) {
      if (size === 3) {
        if (compare(items[lo], items[lo + 1]) > 0) {
          swapCompat(items, lo, lo + 1);
          if (compare(items[lo + 1], items[lo + 2]) > 0) {
            swapCompat(items, lo + 1, lo + 2);
            if (compare(items[lo], items[lo + 1]) > 0) swapCompat(items, lo, lo + 1);
          }
        } else if (compare(items[lo + 1], items[lo + 2]) > 0) {
          swapCompat(items, lo + 1, lo + 2);
          if (compare(items[lo], items[lo + 1]) > 0) swapCompat(items, lo, lo + 1);
        }
      } else if (size === 2 && compare(items[lo], items[lo + 1]) > 0) {
        swapCompat(items, lo, lo + 1);
      }
    } else {
      const pivot = lo + (size >> 1);
      swapCompat(items, pivot, lo);
      let left = lo;
      let right = hi + 1;
      while (true) {
        do
          left += 1;
        while (left <= hi && compare(items[left], items[lo]) <= 0);
        do
          right -= 1;
        while (right > lo && compare(items[right], items[lo]) >= 0);
        if (right < left) break;
        swapCompat(items, left, right);
      }
      swapCompat(items, lo, right);
      if (right - 1 - lo >= hi - left) {
        if (lo + 1 < right) stack.push({ lo, hi: right - 1 });
        if (left < hi) {
          lo = left;
          continue;
        }
      } else {
        if (left < hi) stack.push({ lo: left, hi });
        if (lo + 1 < right) {
          hi = right - 1;
          continue;
        }
      }
    }
    if (stack.length === 0) return;
    const frame = stack.pop();
    lo = frame.lo;
    hi = frame.hi;
  }
}
function swapCompat(items, left, right) {
  const value = items[left];
  items[left] = items[right];
  items[right] = value;
}
function initSizeScheme() {
  const result = [];
  for (let w = 5; w <= 13; w += 1) {
    for (let h = 5; h <= 13; h += 1) {
      const width = 2 ** w;
      const height = 2 ** h;
      const area = width * height;
      const aspectRatio = width > height ? width / height : height / width;
      result.push({ width, height, area, aspectRatio, len: Math.max(width, height) });
    }
  }
  result.sort(compareSizeScheme);
  return result;
}
function compareSizeScheme(left, right) {
  if (left.len < right.len) return -1;
  if (left.len > right.len) return 1;
  if (left.area < right.area) return -1;
  if (left.area > right.area) return 1;
  if (left.aspectRatio < right.aspectRatio) return -1;
  if (left.aspectRatio > right.aspectRatio) return 1;
  if (left.width > left.height) return -1;
  if (right.width > right.height) return 1;
  return 0;
}
function getBestPage(left, right) {
  if (!left) return right;
  if (!right) return left;
  return left.occupancy > right.occupancy ? left : right;
}
function comparePage(left, right) {
  return right.outputRects.length - left.outputRects.length;
}
function compareNodeRect(left, right) {
  const leftEdge = left.width > left.height ? left.width : left.height;
  const rightEdge = right.width > right.height ? right.width : right.height;
  return rightEdge - leftEdge;
}
function compareNodeRectStable(left, right) {
  const delta = compareNodeRect(left, right);
  if (delta !== 0) return delta;
  if (left.sourceKind === "movieclip-frame" && right.sourceKind === "movieclip-frame") {
    const areaDelta = right.width * right.height - left.width * left.height;
    if (areaDelta !== 0) return areaDelta;
    const widthDelta = right.width - left.width;
    if (widthDelta !== 0) return widthDelta;
  }
  return left.index - right.index;
}
function compareNodeRect2(left, right) {
  return right.width - left.width;
}
function compareNodeRect2Stable(left, right) {
  const delta = compareNodeRect2(left, right);
  if (delta !== 0) return delta;
  if (left.sourceKind === "movieclip-frame" && right.sourceKind === "movieclip-frame") {
    const areaDelta = right.width * right.height - left.width * left.height;
    if (areaDelta !== 0) return areaDelta;
    const heightDelta = right.height - left.height;
    if (heightDelta !== 0) return heightDelta;
  }
  return left.index - right.index;
}
function duplicatePadding(rect) {
  return (rect.flags & COMPAT_NODE_RECT_FLAGS.DUPLICATE_PADDING) !== 0;
}
function shrinkRectForPadding(rect, padding, maxWidth, maxHeight) {
  if (!rect.rotated) {
    if (maxWidth - rect.width > padding || duplicatePadding(rect)) rect.width -= padding;
    if (maxHeight - rect.height > padding || duplicatePadding(rect)) rect.height -= padding;
  } else {
    if (maxHeight - rect.width > padding || duplicatePadding(rect)) rect.width -= padding;
    if (maxWidth - rect.height > padding || duplicatePadding(rect)) rect.height -= padding;
  }
}
function cloneCompatRect(rect) {
  return { ...rect };
}

// packages/functions/src/atlas.ts
var ATLAS_DEFAULTS = {
  maxSize: 2048,
  fast: true,
  allowRotation: true,
  padding: 1,
  powerOfTwo: false,
  square: false,
  multiPage: true,
  trimImage: false,
  preserveInputOrderOnTie: false,
  directSingleImageOutput: false,
  extractAlpha: false,
  separatedAtlasForBranch: false
};
function getPublishedItemId2(resource) {
  return (resource.getExtras() ?? {})._publishedId ?? resource.getId();
}
function resolveFontFileName(fontName) {
  return /\.fnt$/i.test(fontName) ? fontName : `${fontName}.fnt`;
}
async function resolveEditorCompatibleResourceOrder(pkg, allResources, options) {
  const pkgId = pkg.getId();
  const resourceMap = new Map(allResources.map((resource) => [resource.getId(), resource]));
  const ordered = [];
  const added = /* @__PURE__ */ new Set();
  const componentStack = [];
  async function addResource(resource) {
    if (!resource) return;
    const resourceId = resource.getId();
    if (!resourceId || added.has(resourceId)) return;
    added.add(resourceId);
    ordered.push(resource);
    if (isFontResource(resource)) {
      await addResource(resourceMap.get(resource.getTextureId?.() ?? ""));
      if (options.readFileRaw && options.basePath) {
        const fontName = resolveFontFileName(resource.getName());
        const fontPath = resource.getPath() ?? "/";
        const fntFile = `${options.basePath}/${pkg.getName()}${fontPath}${fontName}`;
        try {
          const fntData = await options.readFileRaw(fntFile);
          const fntText = new TextDecoder().decode(fntData);
          for (const line of fntText.split(/\r?\n/)) {
            const imgMatch = line.match(/\bimg=(\w+)/);
            if (imgMatch) await addResource(resourceMap.get(imgMatch[1] ?? ""));
          }
        } catch {
        }
      }
    }
    if (isComponentResource(resource)) {
      componentStack.push(resource);
    }
  }
  async function addResourceByLocalUiUrl(value) {
    if (!value || typeof value !== "string" || !value.startsWith("ui://")) return;
    const normalized = value.slice(5).split(",")[0] ?? "";
    if (!normalized) return;
    let resourceId = "";
    const slashIndex = normalized.indexOf("/");
    if (slashIndex >= 0) {
      const packageToken = normalized.slice(0, slashIndex);
      if (packageToken !== pkgId) return;
      resourceId = normalized.slice(slashIndex + 1);
    } else if (normalized.length > 8) {
      const packageToken = normalized.slice(0, 8);
      if (packageToken !== pkgId) return;
      resourceId = normalized.slice(8);
    }
    if (!resourceId) return;
    await addResource(resourceMap.get(resourceId));
  }
  async function addGearIconResources(gear) {
    if (gear.getGearType?.() !== 7 /* Icon */) return;
    const values = gear.getValues?.();
    if (typeof values === "string" && values) {
      for (const value of values.split("|")) {
        await addResourceByLocalUiUrl(value.trim());
      }
    }
    const defaultValue = gear.getDefaultValue?.();
    if (typeof defaultValue === "string") {
      await addResourceByLocalUiUrl(defaultValue);
    }
  }
  for (const resource of allResources) {
    if (resource.getExported()) await addResource(resource);
  }
  while (componentStack.length > 0) {
    const component = componentStack.pop();
    if (!component) continue;
    for (const child of component.listChildren()) {
      const refChild = child;
      await addResource(resourceMap.get(refChild.getSrc?.() ?? ""));
      for (const ref of [
        refChild.getUrl?.(),
        refChild.getDefaultItem?.(),
        refChild.getIcon?.(),
        refChild.getSelectedIcon?.(),
        refChild.getFont?.(),
        refChild.getDropdown?.(),
        refChild.getVtScrollBarRes?.(),
        refChild.getHzScrollBarRes?.(),
        refChild.getHeaderRes?.(),
        refChild.getFooterRes?.(),
        refChild.getSound?.(),
        refChild.getInstanceIcon?.(),
        refChild.getInstanceSelectedIcon?.()
      ]) {
        await addResourceByLocalUiUrl(ref);
      }
      for (const item of refChild.getInstanceComboItems?.() ?? []) {
        await addResourceByLocalUiUrl(item.icon ?? void 0);
      }
      for (const item of refChild.getListItems?.() ?? []) {
        await addResourceByLocalUiUrl(item.icon ?? void 0);
        await addResourceByLocalUiUrl(item.url ?? void 0);
      }
      for (const gear of refChild.listGears?.() ?? []) {
        await addGearIconResources(gear);
      }
    }
    for (const ref of [
      component.getDropdown?.(),
      component.getVtScrollBarRes?.(),
      component.getHzScrollBarRes?.(),
      component.getHeaderRes?.(),
      component.getFooterRes?.(),
      component.getSound?.()
    ]) {
      await addResourceByLocalUiUrl(ref);
    }
    for (const transition of component.listTransitions?.() ?? []) {
      for (const item of transition.listItems?.() ?? []) {
        const actionType = item.getActionType?.();
        if (actionType !== 9 /* Sound */ && actionType !== 15 /* Icon */) continue;
        for (const value of [item.getStartValue?.(), item.getEndValue?.()]) {
          if (Array.isArray(value)) {
            for (const entry of value) {
              if (typeof entry === "string") await addResourceByLocalUiUrl(entry);
            }
          } else if (typeof value === "string") {
            await addResourceByLocalUiUrl(value);
          }
        }
      }
    }
  }
  for (const resource of allResources) {
    await addResource(resource);
  }
  return ordered;
}
function atlas(_options = {}) {
  const options = { ...ATLAS_DEFAULTS, ..._options };
  return createTransform("atlas", async (doc) => {
    const root = doc.getRoot();
    const logger = doc.getLogger();
    const encoder = options.encoder;
    const doTrim = options.trimImage && !!encoder && !!options.basePath;
    for (const pkg of root.listPackages()) {
      let collectRefs2 = function(component, visited) {
        for (const child of component.listChildren()) {
          const refChild = child;
          const src = refChild.getSrc?.();
          if (src && !visited.has(src)) {
            referencedIds.add(src);
            visited.add(src);
            const srcRes = resourceMap.get(src);
            if (srcRes && isComponentResource(srcRes)) {
              collectRefs2(srcRes, visited);
            }
          }
          for (const ref of [
            refChild.getIcon?.(),
            refChild.getSelectedIcon?.(),
            refChild.getFont?.(),
            refChild.getDropdown?.(),
            refChild.getInstanceIcon?.(),
            refChild.getInstanceSelectedIcon?.(),
            refChild.getVtScrollBarRes?.(),
            refChild.getHzScrollBarRes?.(),
            refChild.getHeaderRes?.(),
            refChild.getFooterRes?.(),
            refChild.getUrl?.()
          ]) {
            addUiResourceRef(referencedIds, ref);
          }
          addUiResourceRefsFromText(referencedIds, refChild.getText?.());
          for (const item of refChild.getInstanceComboItems?.() ?? []) {
            addUiResourceRef(referencedIds, item.icon ?? void 0);
          }
          for (const item of refChild.getListItems?.() ?? []) {
            addUiResourceRef(referencedIds, item.icon ?? void 0);
          }
          for (const gear of refChild.listGears?.() ?? []) {
            addUiResourceRefsFromUnknown(referencedIds, gear.getValues?.());
            addUiResourceRefsFromUnknown(referencedIds, gear.getDefaultValue?.());
          }
        }
        for (const transition of component.listTransitions?.() ?? []) {
          for (const item of transition.listItems?.() ?? []) {
            addUiResourceRefsFromUnknown(referencedIds, item.getStartValue?.());
            addUiResourceRefsFromUnknown(referencedIds, item.getEndValue?.());
          }
        }
      };
      var collectRefs = collectRefs2;
      const selectedPublishIds = new Set((pkg.getExtras() ?? {}).publishedResourceIds ?? []);
      const allResources = selectedPublishIds.size > 0 ? pkg.listResources().filter((resource) => selectedPublishIds.has(resource.getId())) : pkg.listResources();
      const orderedResources = await resolveEditorCompatibleResourceOrder(pkg, allResources, options);
      const resourceOrder = new Map(orderedResources.map((resource, index) => [resource.getId(), index]));
      const inputOrder = new Map(allResources.map((resource, index) => [resource.getId(), index]));
      const orderedAllResources = sortResourcesByOrder(allResources, resourceOrder, inputOrder);
      const hasPackable = allResources.some((resource) => isPackableResource(resource));
      if (!hasPackable) continue;
      const inputs = [];
      const referencedIds = /* @__PURE__ */ new Set();
      const resourceMap = /* @__PURE__ */ new Map();
      for (const res of allResources) {
        const id = res.getId();
        if (id) resourceMap.set(id, res);
      }
      for (const res of orderedAllResources) {
        if (isComponentResource(res)) {
          collectRefs2(res, /* @__PURE__ */ new Set());
        }
        if (isSkeletonResource(res) && referencedIds.has(res.getId())) {
          for (const requiredId of res.getRequireIds()) {
            if (requiredId) referencedIds.add(requiredId);
          }
        }
        if (isFontResource(res)) {
          const textureId = res.getTextureId?.() ?? "";
          if (textureId) referencedIds.add(textureId);
          if (options.readFileRaw && options.basePath) {
            const fontName = resolveFontFileName(res.getName());
            const fontPath = res.getPath() ?? "/";
            const fntFile = `${options.basePath}/${pkg.getName()}${fontPath}${fontName}`;
            try {
              const fntData = await options.readFileRaw(fntFile);
              const fntText = new TextDecoder().decode(fntData);
              for (const line of fntText.split(/\r?\n/)) {
                const match = line.match(/img=(\w+)/);
                if (match) referencedIds.add(match[1]);
              }
            } catch {
            }
          }
        }
      }
      for (const res of orderedAllResources) {
        if (isImageResource(res)) {
          const resId = res.getId();
          if (!res.getExported() && referencedIds.size > 0 && !referencedIds.has(resId)) continue;
          await _collectImage(res, pkg, inputs, encoder, options, doTrim, logger);
        } else if (isMovieClipResource(res)) {
          const resId = res.getId();
          if (!res.getExported() && referencedIds.size > 0 && !referencedIds.has(resId)) continue;
          await _collectMovieClipFrames(doc, res, pkg, inputs, encoder, options, logger);
        } else if (isFontResource(res)) {
          const resId = res.getId();
          if (!res.getExported() && referencedIds.size > 0 && !referencedIds.has(resId)) continue;
          await _collectFontTexture(doc, res, pkg, inputs, encoder, options, doTrim, logger, orderedAllResources);
        }
      }
      if (inputs.length === 0) continue;
      const branchGroups = buildBranchAtlasGroups(doc, inputs, options);
      let totalPageCount = 0;
      let usedDirectOutput = false;
      for (const group of branchGroups) {
        const directOutput = resolveDirectImageOutput(group.inputs, options);
        if (directOutput) {
          await emitDirectImageOutput(doc, pkg, directOutput, encoder, options, logger, group.branchName, group.branchOrdinal);
          usedDirectOutput = true;
          totalPageCount += 1;
          continue;
        }
        const hasDuplicatePadding = group.inputs.some((i) => {
          return isImageResource(i.resource) && i.resource.getDuplicatePadding?.() === true;
        });
        const packer = new MaxRectsPackerCompat({
          pot: options.powerOfTwo,
          mof: !options.powerOfTwo,
          padding: options.padding,
          rotation: options.allowRotation,
          minWidth: 16,
          minHeight: 16,
          maxWidth: options.maxSize,
          maxHeight: options.maxSize,
          square: options.square,
          fast: options.fast,
          edgePadding: false,
          duplicatePadding: hasDuplicatePadding,
          multiPage: options.multiPage,
          preserveInputOrderOnTie: options.preserveInputOrderOnTie
        });
        const pages = packer.pack(group.inputs.map((input, index) => inputToCompatRect(input, index)));
        if (!pages || pages.length === 0) continue;
        totalPageCount += pages.length;
        for (let p = 0; p < pages.length; p++) {
          const page = pages[p];
          const atlasNode = doc.createAtlas(`atlas${resolveAtlasIndex(group.branchOrdinal, p)}`);
          atlasNode.setIndex(resolveAtlasIndex(group.branchOrdinal, p));
          atlasNode.setFile(resolveAtlasOutputFileName(pkg, p, group.branchName));
          atlasNode.setWidth(page.width);
          atlasNode.setHeight(page.height);
          pkg.addAtlas(atlasNode);
          for (const pr of page.outputRects) {
            const input = group.inputs[pr.index];
            if (!input) continue;
            const packedSize = resolvePackedRectSize(input, pr.width, pr.height, pr.rotated);
            const rotated = pr.rotated;
            const sprite = doc.createSprite();
            sprite.setItemId(input.id);
            sprite.setRectX(pr.x);
            sprite.setRectY(pr.y);
            sprite.setRectWidth(packedSize.width);
            sprite.setRectHeight(packedSize.height);
            sprite.setRotated(rotated);
            sprite.setOffsetX(input.offsetX);
            sprite.setOffsetY(input.offsetY);
            sprite.setOriginalWidth(input.originalWidth);
            sprite.setOriginalHeight(input.originalHeight);
            sprite.setAtlas(atlasNode);
            atlasNode.addSprite(sprite);
          }
          for (const res of allResources) {
            if (!isFontResource(res)) continue;
            const fextras = res.getExtras();
            const alias = fextras?._fontSpriteAlias;
            if (!alias) continue;
            const imgSprite = page.outputRects.find((result) => group.inputs[result.index]?.id === alias.textureId);
            if (!imgSprite) continue;
            const imgInput = group.inputs[imgSprite.index];
            const fontSprite = doc.createSprite();
            fontSprite.setItemId(alias.fontId);
            fontSprite.setRectX(imgSprite.x);
            fontSprite.setRectY(imgSprite.y);
            fontSprite.setRectWidth(imgSprite.width);
            fontSprite.setRectHeight(imgSprite.height);
            fontSprite.setRotated(imgSprite.rotated);
            if (imgInput) {
              fontSprite.setOffsetX(imgInput.offsetX);
              fontSprite.setOffsetY(imgInput.offsetY);
              fontSprite.setOriginalWidth(imgInput.originalWidth);
              fontSprite.setOriginalHeight(imgInput.originalHeight);
            }
            fontSprite.setAtlas(atlasNode);
            atlasNode.addSprite(fontSprite);
          }
        }
        if (encoder && options.outputPath) {
          if (options.mkdir) {
            await options.mkdir(options.outputPath);
          }
          for (let p = 0; p < pages.length; p++) {
            const page = pages[p];
            const compositeInputs = [];
            for (const pr of page.outputRects) {
              const input = group.inputs[pr.index];
              if (!input) continue;
              if (pr.width <= 0 || pr.height <= 0 || input.width <= 0 || input.height <= 0) continue;
              try {
                let imgBuffer;
                if (input.trimBuffer) {
                  imgBuffer = input.trimBuffer;
                  if (imgBuffer.length === 0) continue;
                } else {
                  if (!isImageResource(input.resource)) {
                    logger.warn(`atlas: Non-image input "${input.id}" is missing inline buffer, skipping compositing.`);
                    continue;
                  }
                  const filePath = _resolveImagePath(input.resource, pkg, options.basePath);
                  imgBuffer = await encoder(filePath).toBuffer();
                }
                if (pr.rotated) imgBuffer = await encoder(imgBuffer).rotate(270).toBuffer();
                compositeInputs.push({
                  input: imgBuffer,
                  left: pr.x,
                  top: pr.y
                });
              } catch {
                logger.warn(`atlas: Could not read image "${input.id}" for compositing.`);
              }
            }
            const atlasFileName = resolveAtlasOutputFileName(pkg, p, group.branchName);
            const outputFile = `${options.outputPath}/${atlasFileName}`;
            await encoder({
              create: {
                width: page.width,
                height: page.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              }
            }).composite(compositeInputs).png().toFile(outputFile);
            logger.info(`atlas: Generated ${atlasFileName} (${page.width}x${page.height}, ${page.outputRects.length} sprites)`);
          }
        }
      }
      if (usedDirectOutput) {
        logger.info(`atlas: Direct output for single image package "${pkg.getName()}".`);
      }
      logger.info(`atlas: Packed ${inputs.length} images into ${totalPageCount} atlas(es) for package "${pkg.getName()}".`);
    }
  });
}
function buildBranchAtlasGroups(doc, inputs, options) {
  if (!options.separatedAtlasForBranch) {
    return [{ branchName: "", branchOrdinal: 0, inputs }];
  }
  const discoveredBranchNames = [...new Set(inputs.map((input) => getInputBranchName(input)).filter((branchName) => !!branchName))];
  if (discoveredBranchNames.length === 0) {
    return [{ branchName: "", branchOrdinal: 0, inputs }];
  }
  const orderedBranchNames = doc.getRoot().listBranches().filter((branchName) => discoveredBranchNames.includes(branchName));
  for (const branchName of discoveredBranchNames) {
    if (!orderedBranchNames.includes(branchName)) orderedBranchNames.push(branchName);
  }
  const groups = /* @__PURE__ */ new Map();
  groups.set("", []);
  for (const branchName of orderedBranchNames) {
    groups.set(branchName, []);
  }
  for (const input of inputs) {
    const branchName = getInputBranchName(input);
    const key = groups.has(branchName) ? branchName : "";
    groups.get(key).push(input);
  }
  const orderedKeys = [""];
  for (const branchName of orderedBranchNames) {
    if ((groups.get(branchName)?.length ?? 0) > 0) orderedKeys.push(branchName);
  }
  return orderedKeys.filter((branchName) => (groups.get(branchName)?.length ?? 0) > 0).map((branchName, index) => ({
    branchName,
    branchOrdinal: index,
    inputs: groups.get(branchName) ?? []
  }));
}
function inputToCompatRect(input, index) {
  const duplicatePadding2 = isImageResource(input.resource) && input.resource.getDuplicatePadding?.() === true;
  return {
    x: 0,
    y: 0,
    width: input.width,
    height: input.height,
    rotated: false,
    index,
    subIndex: -1,
    flags: duplicatePadding2 ? COMPAT_NODE_RECT_FLAGS.DUPLICATE_PADDING : 0,
    score1: 0,
    score2: 0,
    sourceKind: input.sourceKind
  };
}
function resolvePackedRectSize(input, width, height, rectRotated) {
  if (!rectRotated) return { width, height };
  return {
    width: input.height,
    height: input.width
  };
}
function resolveDirectImageOutput(inputs, options) {
  if (!options.directSingleImageOutput || options.extractAlpha) return null;
  if (inputs.length !== 1) return null;
  const [input] = inputs;
  if (!input || input.sourceKind !== "image" || !isImageResource(input.resource)) return null;
  if (input.resource.getDuplicatePadding?.() === true) return null;
  if (input.width !== input.originalWidth || input.height !== input.originalHeight) return null;
  const fileName = resolveImageFileName(input.resource).toLowerCase();
  if (!fileName.endsWith(".png")) return null;
  return input;
}
function resolveDirectOutputAtlasSize(width, height, options) {
  let resolvedWidth = width;
  let resolvedHeight = height;
  if (options.square) {
    const side = Math.max(resolvedWidth, resolvedHeight);
    resolvedWidth = side;
    resolvedHeight = side;
  }
  if (options.powerOfTwo) {
    resolvedWidth = nextPow2(resolvedWidth);
    resolvedHeight = nextPow2(resolvedHeight);
  }
  return { width: resolvedWidth, height: resolvedHeight };
}
async function emitDirectImageOutput(doc, pkg, input, encoder, options, logger, branchName = "", branchOrdinal = 0) {
  const atlasFileName = resolveAtlasOutputFileName(pkg, 0, branchName);
  const atlasSize = resolveDirectOutputAtlasSize(input.originalWidth, input.originalHeight, options);
  const atlasNode = doc.createAtlas(`atlas${resolveAtlasIndex(branchOrdinal, 0)}`);
  atlasNode.setIndex(resolveAtlasIndex(branchOrdinal, 0));
  atlasNode.setFile(atlasFileName);
  atlasNode.setWidth(atlasSize.width);
  atlasNode.setHeight(atlasSize.height);
  pkg.addAtlas(atlasNode);
  const sprite = doc.createSprite();
  sprite.setItemId(input.id);
  sprite.setRectX(0);
  sprite.setRectY(0);
  sprite.setRectWidth(input.originalWidth);
  sprite.setRectHeight(input.originalHeight);
  sprite.setRotated(false);
  sprite.setOffsetX(0);
  sprite.setOffsetY(0);
  sprite.setOriginalWidth(input.originalWidth);
  sprite.setOriginalHeight(input.originalHeight);
  sprite.setAtlas(atlasNode);
  atlasNode.addSprite(sprite);
  if (!encoder || !options.outputPath || !isImageResource(input.resource) || !options.basePath) return;
  if (options.mkdir) {
    await options.mkdir(options.outputPath);
  }
  const outputFile = `${options.outputPath}/${atlasFileName}`;
  const filePath = _resolveImagePath(input.resource, pkg, options.basePath);
  try {
    if (atlasSize.width === input.originalWidth && atlasSize.height === input.originalHeight) {
      await encoder(filePath).png().toFile(outputFile);
    } else {
      const imageBuffer = await encoder(filePath).png().toBuffer();
      await encoder({
        create: {
          width: atlasSize.width,
          height: atlasSize.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).composite([{ input: imageBuffer, left: 0, top: 0 }]).png().toFile(outputFile);
    }
  } catch {
    logger.warn(`atlas: Could not write direct-output atlas "${atlasFileName}".`);
  }
}
function getInputBranchName(input) {
  return input.resource.getBranch?.() ?? "";
}
function resolveAtlasIndex(branchOrdinal, pageIndex) {
  if (branchOrdinal <= 0) return pageIndex;
  return branchOrdinal * 100 + pageIndex;
}
function resolveAtlasOutputFileName(pkg, pageIndex, branchName) {
  const suffix = branchName ? `_${branchName}` : "";
  return `${pkg.getPublishName() || pkg.getName()}_atlas${pageIndex}${suffix}.png`;
}
function resolveImageFileName(resource) {
  const extras = resource.getExtras();
  return resource.getFileName() || extras._fileName || resource.getName();
}
function nextPow2(value) {
  if (value <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(value));
}
function sortResourcesByOrder(resources, orderMap, inputOrderMap) {
  const ordered = [...resources];
  ordered.sort((left, right) => {
    const leftId = left.getId();
    const rightId = right.getId();
    const leftOrder = leftId && orderMap.has(leftId) ? orderMap.get(leftId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const rightOrder = rightId && orderMap.has(rightId) ? orderMap.get(rightId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    const leftInputOrder = leftId && inputOrderMap.has(leftId) ? inputOrderMap.get(leftId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    const rightInputOrder = rightId && inputOrderMap.has(rightId) ? inputOrderMap.get(rightId) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
    if (leftInputOrder !== rightInputOrder) return leftInputOrder - rightInputOrder;
    return (leftId ?? "").localeCompare(rightId ?? "");
  });
  return ordered;
}
async function _trimImage(encoder, filePath, originalWidth, originalHeight) {
  try {
    const trimResult = await encoder(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (!isResolvedBuffer(trimResult)) {
      throw new Error("atlas: encoder raw alpha trim did not return resolved metadata.");
    }
    const { data, info } = trimResult;
    const width = info.width;
    const height = info.height;
    const channels = info.channels || 4;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alphaIndex = (y * width + x) * channels + 3;
        if ((data[alphaIndex] ?? 0) === 0) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) {
      return {
        buffer: new Uint8Array(0),
        width: 0,
        height: 0,
        offsetX: 0,
        offsetY: 0,
        originalWidth,
        originalHeight
      };
    }
    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;
    const buffer = await encoder(filePath).extract({
      left: minX,
      top: minY,
      width: trimmedWidth,
      height: trimmedHeight
    }).toBuffer();
    return {
      buffer,
      width: trimmedWidth,
      height: trimmedHeight,
      offsetX: minX,
      offsetY: minY,
      originalWidth,
      originalHeight
    };
  } catch {
    const buf = await encoder(filePath).png().toBuffer();
    return {
      buffer: buf,
      width: originalWidth,
      height: originalHeight,
      offsetX: 0,
      offsetY: 0,
      originalWidth,
      originalHeight
    };
  }
}
function _resolveImagePath(resource, pkg, basePath) {
  const imgPath = resource.getPath() ?? "/";
  const fileName = resolveImageFileName(resource);
  const branchName = resource.getBranch?.() ?? "";
  const normalizedBasePath = basePath.replace(/[/\\]+$/, "");
  const packageBasePath = !branchName ? normalizedBasePath : /[\\/]assets$/i.test(normalizedBasePath) ? normalizedBasePath.replace(/([\\/])assets$/i, `$1assets_${branchName}`) : `${normalizedBasePath}_${branchName}`;
  return `${packageBasePath}/${pkg.getName()}${imgPath}${fileName}`;
}
async function _collectImage(resource, pkg, inputs, encoder, options, doTrim, logger) {
  let origW = resource.getWidth() ?? 0;
  let origH = resource.getHeight() ?? 0;
  let sourceHasAlpha = false;
  if (encoder && options.basePath) {
    const filePath = _resolveImagePath(resource, pkg, options.basePath);
    try {
      const metadata = await encoder(filePath).metadata();
      if (origW === 0 || origH === 0) {
        origW = metadata.width ?? 0;
        origH = metadata.height ?? 0;
        resource.setWidth(origW);
        resource.setHeight(origH);
      }
      sourceHasAlpha = metadata.hasAlpha === true || metadata.channels === 4;
    } catch {
      if (origW === 0 || origH === 0) {
        logger.warn(`atlas: Could not read image "${filePath}", skipping.`);
        return;
      }
    }
  }
  if (origW <= 0 || origH <= 0) return;
  let packW = origW, packH = origH, offX = 0, offY = 0;
  let trimBuf;
  if (doTrim && sourceHasAlpha && options.basePath && encoder) {
    const filePath = _resolveImagePath(resource, pkg, options.basePath);
    try {
      const trimResult = await _trimImage(encoder, filePath, origW, origH);
      packW = trimResult.width;
      packH = trimResult.height;
      offX = trimResult.offsetX;
      offY = trimResult.offsetY;
      trimBuf = trimResult.buffer;
    } catch {
      logger.warn(`atlas: Could not trim "${filePath}", using original.`);
    }
  }
  inputs.push({
    id: getPublishedItemId2(resource),
    width: packW,
    height: packH,
    originalWidth: origW,
    originalHeight: origH,
    offsetX: offX,
    offsetY: offY,
    resource,
    trimBuffer: trimBuf,
    sourceKind: "image"
  });
}
async function _collectMovieClipFrames(doc, resource, pkg, inputs, encoder, options, logger) {
  if (!options.basePath || !options.readFileRaw) return;
  const mcId = resource.getId();
  const mcName = resource.getName() + ".jta";
  const mcPath = resource.getPath() ?? "/";
  const filePath = `${options.basePath}/${pkg.getName()}${mcPath}${mcName}`;
  try {
    const raw = await options.readFileRaw(filePath);
    const jta = _extractJtaFrames(raw);
    if (jta.frames.length === 0) return;
    const frameMetas = jta.meta?.frames ?? [];
    for (const frame of resource.listFrames()) {
      resource.removeFrame(frame);
    }
    resource.setInterval(jta.meta?.interval ?? 100).setSwing(jta.meta?.swing ?? false).setRepeatDelay(jta.meta?.repeatDelay ?? 0);
    if (frameMetas.length > 0) {
      const firstFrameIndexByTextureIndex = /* @__PURE__ */ new Map();
      for (let frameIndex = 0; frameIndex < frameMetas.length; frameIndex += 1) {
        const meta = frameMetas[frameIndex];
        const textureIndex = Number.isFinite(meta.textureIndex) ? meta.textureIndex : frameIndex;
        if (!firstFrameIndexByTextureIndex.has(textureIndex)) {
          firstFrameIndexByTextureIndex.set(textureIndex, frameIndex);
        }
      }
      const spriteIdByTextureIndex = /* @__PURE__ */ new Map();
      for (let textureIndex = 0; textureIndex < jta.frames.length; textureIndex += 1) {
        const exportFrameIndex = firstFrameIndexByTextureIndex.get(textureIndex);
        if (exportFrameIndex === void 0) continue;
        const itemId = `${mcId}_${exportFrameIndex}`;
        const input = await _createMovieClipFrameInput(jta.frames[textureIndex], itemId, resource, encoder);
        if (!input) continue;
        inputs.push(input);
        spriteIdByTextureIndex.set(textureIndex, itemId);
      }
      for (let frameIndex = 0; frameIndex < frameMetas.length; frameIndex += 1) {
        const meta = frameMetas[frameIndex];
        const textureIndex = Number.isFinite(meta.textureIndex) ? meta.textureIndex : frameIndex;
        const frame = doc.createMovieFrame(`${mcId}_${frameIndex}`);
        frame.setRectX(meta.offsetX).setRectY(meta.offsetY).setRectWidth(meta.width).setRectHeight(meta.height).setAddDelay(meta.addDelay).setSpriteId(spriteIdByTextureIndex.get(textureIndex) ?? "");
        resource.addFrame(frame);
      }
    } else {
      for (let frameIndex = 0; frameIndex < jta.frames.length; frameIndex += 1) {
        const itemId = `${mcId}_${frameIndex}`;
        const input = await _createMovieClipFrameInput(jta.frames[frameIndex], itemId, resource, encoder);
        if (!input) continue;
        inputs.push(input);
        const frame = doc.createMovieFrame(itemId);
        frame.setRectX(0).setRectY(0).setRectWidth(input.originalWidth).setRectHeight(input.originalHeight).setAddDelay(0).setSpriteId(itemId);
        resource.addFrame(frame);
      }
    }
    if ((jta.meta?.width ?? 0) > 0 && (jta.meta?.height ?? 0) > 0) {
      resource.setWidth(jta.meta?.width ?? 0);
      resource.setHeight(jta.meta?.height ?? 0);
    }
  } catch {
    logger.warn(`atlas: Could not parse MovieClip "${filePath}", skipping frames.`);
  }
}
async function _createMovieClipFrameInput(buffer, itemId, resource, encoder) {
  if (!encoder || buffer.length === 0) return null;
  try {
    const meta = await encoder(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width <= 0 || height <= 0) return null;
    return {
      id: itemId,
      width,
      height,
      originalWidth: width,
      originalHeight: height,
      offsetX: 0,
      offsetY: 0,
      resource,
      trimBuffer: buffer,
      sourceKind: "movieclip-frame"
    };
  } catch {
    return null;
  }
}
var PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
function _extractJtaFrames(data) {
  const frames = [];
  let offset = 0;
  let firstPngOffset = -1;
  while (offset < data.length) {
    const sigIndex = _findPngSignature(data, offset);
    if (sigIndex === -1) break;
    if (firstPngOffset === -1) firstPngOffset = sigIndex;
    const end = _findPngEnd(data, sigIndex);
    if (end === -1) break;
    frames.push(data.subarray(sigIndex, end));
    offset = end;
  }
  if (firstPngOffset === -1 || frames.length === 0) {
    return { frames: [] };
  }
  return {
    frames,
    meta: _parseJtaHeader(data, firstPngOffset, frames.length)
  };
}
function _findPngSignature(data, fromIndex) {
  for (let index = fromIndex; index <= data.length - PNG_SIGNATURE.length; index += 1) {
    let matched = true;
    for (let sigIndex = 0; sigIndex < PNG_SIGNATURE.length; sigIndex += 1) {
      if (data[index + sigIndex] !== PNG_SIGNATURE[sigIndex]) {
        matched = false;
        break;
      }
    }
    if (matched) return index;
  }
  return -1;
}
function _findPngEnd(data, start) {
  let pos = start + PNG_SIGNATURE.length;
  while (pos + 8 <= data.length) {
    const length = _readUint32BE(data, pos);
    pos += 8;
    if (pos + length + 4 > data.length) return -1;
    const isIEND = data[pos - 4] === 73 && data[pos - 3] === 69 && data[pos - 2] === 78 && data[pos - 1] === 68;
    pos += length + 4;
    if (isIEND) return pos;
  }
  return -1;
}
function _parseJtaHeader(data, firstPngOffset, frameCount) {
  if (data.length < 10) return void 0;
  const state = { offset: 0 };
  const end = Math.min(firstPngOffset, data.length);
  const mark = _readUtfBE(data, state, end);
  if (!mark) return void 0;
  const version = _readInt32BEAt(data, state, end);
  if (version == null) return void 0;
  const fpsRaw = _readInt8At(data, state, end);
  if (fpsRaw == null) return void 0;
  const fps = fpsRaw > 0 ? fpsRaw : 24;
  if (state.offset + 3 > end) return void 0;
  state.offset += 3;
  if (version < 102) return void 0;
  _readUint16BEAt(data, state, end);
  _readUint16BEAt(data, state, end);
  const width = _readUint16BEAt(data, state, end);
  const height = _readUint16BEAt(data, state, end);
  if (width == null || height == null) return void 0;
  const speedRaw = _readUint8At(data, state, end);
  const repeatDelayRaw = _readUint8At(data, state, end);
  const swingRaw = _readInt8At(data, state, end);
  const frameTableCount = _readInt16BEAt(data, state, end);
  if (speedRaw == null || repeatDelayRaw == null || swingRaw == null || frameTableCount == null) return void 0;
  const frames = [];
  for (let index = 0; index < frameTableCount; index += 1) {
    const delayRaw = _readInt16BEAt(data, state, end);
    const offsetX = _readInt16BEAt(data, state, end);
    const offsetY = _readInt16BEAt(data, state, end);
    const frameWidth = _readInt16BEAt(data, state, end);
    const frameHeight = _readInt16BEAt(data, state, end);
    const textureIndex = _readInt16BEAt(data, state, end);
    if (delayRaw == null || offsetX == null || offsetY == null || frameWidth == null || frameHeight == null || textureIndex == null) {
      break;
    }
    frames.push({
      addDelay: Math.trunc(1e3 / fps * delayRaw),
      offsetX,
      offsetY,
      width: frameWidth,
      height: frameHeight,
      textureIndex
    });
  }
  return {
    interval: Math.trunc(1e3 / fps * (speedRaw || 1)),
    repeatDelay: Math.trunc(1e3 / fps * repeatDelayRaw),
    swing: swingRaw === 1,
    width,
    height,
    frames: frames.length === 0 && frameCount > 0 ? [] : frames
  };
}
function _readUtfBE(data, state, end) {
  const length = _readUint16BEAt(data, state, end);
  if (length == null || state.offset + length > end) return null;
  const value = new TextDecoder().decode(data.subarray(state.offset, state.offset + length));
  state.offset += length;
  return value;
}
function _readUint8At(data, state, end) {
  if (state.offset + 1 > end) return null;
  const value = data[state.offset];
  state.offset += 1;
  return value ?? 0;
}
function _readInt8At(data, state, end) {
  if (state.offset + 1 > end) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const value = view.getInt8(state.offset);
  state.offset += 1;
  return value;
}
function _readUint16BEAt(data, state, end) {
  if (state.offset + 2 > end) return null;
  const value = _readUint16BE(data, state.offset);
  state.offset += 2;
  return value;
}
function _readInt16BEAt(data, state, end) {
  if (state.offset + 2 > end) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const value = view.getInt16(state.offset, false);
  state.offset += 2;
  return value;
}
function _readInt32BEAt(data, state, end) {
  if (state.offset + 4 > end) return null;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const value = view.getInt32(state.offset, false);
  state.offset += 4;
  return value;
}
function _readUint16BE(data, offset) {
  if (offset + 1 >= data.length) return 0;
  return data[offset] << 8 | data[offset + 1];
}
function _readUint32BE(data, offset) {
  if (offset + 3 >= data.length) return 0;
  return data[offset] * 16777216 + ((data[offset + 1] ?? 0) << 16) + ((data[offset + 2] ?? 0) << 8) + (data[offset + 3] ?? 0);
}
async function _collectFontTexture(doc, fontRes, pkg, inputs, encoder, options, doTrim, logger, allResources) {
  const textureId = fontRes.getTextureId?.() ?? "";
  if (textureId) {
    const fontId = fontRes.getId();
    fontRes.setExtras({ ...fontRes.getExtras(), _fontSpriteAlias: { fontId, textureId } });
    const texImage = allResources.find((r) => isImageResource(r) && r.getId() === textureId);
    if (texImage) {
      await _collectImage(texImage, pkg, inputs, encoder, options, doTrim, logger);
    }
  }
  if (options.readFileRaw && options.basePath) {
    const fontName = resolveFontFileName(fontRes.getName());
    const fontPath = fontRes.getPath() ?? "/";
    const pkgName = pkg.getName();
    const fntFile = `${options.basePath}/${pkgName}${fontPath}${fontName}`;
    try {
      const fntData = await options.readFileRaw(fntFile);
      const fntText = new TextDecoder().decode(fntData);
      const fntParsed = _parseFnt(fntText);
      for (const glyph of fontRes.listGlyphs()) {
        fontRes.removeGlyph(glyph);
      }
      fontRes.setTtf(fntParsed.hasFace).setTint(fntParsed.colored).setAutoScale(fntParsed.resizable).setHasChannel(fntParsed.hasChannel).setFontSize(fntParsed.fontSize).setXAdvance(fntParsed.xadvance).setLineHeight(fntParsed.lineHeight);
      for (const item of fntParsed.glyphs) {
        const glyph = doc.createFontGlyph(`${fontRes.getId()}_${item.charId}`);
        glyph.setCharId(item.charId).setChar(item.charId > 0 ? String.fromCodePoint(item.charId) : "").setImg(item.img ?? "").setX(item.x).setY(item.y).setXOffset(item.xoffset).setYOffset(item.yoffset).setWidth(item.width).setHeight(item.height).setAdvance(item.xadvance).setLineHeight(fntParsed.lineHeight).setChannel(item.channel);
        fontRes.addGlyph(glyph);
      }
      const pkgResources = pkg.listResources();
      for (const item of fntParsed.glyphs) {
        if (!item.img) continue;
        const alreadyPacked = inputs.some((inp) => inp.id === item.img);
        if (alreadyPacked) continue;
        const glyphImage = pkgResources.find((r) => isImageResource(r) && r.getId() === item.img);
        if (glyphImage) {
          await _collectImage(glyphImage, pkg, inputs, encoder, options, doTrim, logger);
        }
      }
    } catch {
    }
  }
}
function _parseFnt(text) {
  const lines = text.split(/\r?\n/);
  let hasFace = false, colored = false, resizable = false, hasChannel = false;
  let fontSize = 0, globalXadvance = 0, lineHeight = 0;
  const glyphs = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const attrs = {};
    for (let i = 1; i < parts.length; i++) {
      const eq = parts[i].split("=");
      if (eq.length === 2) attrs[eq[0]] = eq[1];
    }
    switch (parts[0]) {
      case "info":
        hasFace = attrs.face != null;
        colored = hasFace;
        if (attrs.colored !== void 0) colored = attrs.colored === "true";
        fontSize = parseInt(attrs.size, 10) || 0;
        resizable = attrs.resizable === "true";
        break;
      case "common":
        lineHeight = parseInt(attrs.lineHeight, 10) || 0;
        globalXadvance = parseInt(attrs.xadvance, 10) || 0;
        if (fontSize === 0) fontSize = lineHeight;
        else if (lineHeight === 0) lineHeight = fontSize;
        break;
      case "char": {
        const charId = parseInt(attrs.id, 10) || 0;
        if (charId === 0) continue;
        const img = attrs.img || null;
        if (!hasFace && !img) continue;
        const chnl = parseInt(attrs.chnl, 10) || 0;
        if (chnl !== 0 && chnl !== 15) hasChannel = true;
        glyphs.push({
          charId,
          img,
          x: parseInt(attrs.x, 10) || 0,
          y: parseInt(attrs.y, 10) || 0,
          xoffset: parseInt(attrs.xoffset, 10) || 0,
          yoffset: parseInt(attrs.yoffset, 10) || 0,
          width: parseInt(attrs.width, 10) || 0,
          height: parseInt(attrs.height, 10) || 0,
          xadvance: parseInt(attrs.xadvance, 10) || 0,
          channel: chnl
        });
        break;
      }
    }
  }
  return { hasFace, colored, resizable: fontSize > 0 ? resizable : false, hasChannel, fontSize, xadvance: globalXadvance, lineHeight, glyphs };
}
function isComponentResource(resource) {
  return resource.propertyType === "Component";
}
function isImageResource(resource) {
  return resource.propertyType === "ImageResource";
}
function isMovieClipResource(resource) {
  return resource.propertyType === "MovieClipResource";
}
function isSkeletonResource(resource) {
  return resource.propertyType === "SpineResource" || resource.propertyType === "DragonBonesResource";
}
function isFontResource(resource) {
  return resource.propertyType === "FontResource";
}
function isPackableResource(resource) {
  return isImageResource(resource) || isMovieClipResource(resource) || isFontResource(resource);
}
function addUiResourceRef(target, value) {
  if (!value?.startsWith("ui://")) return;
  const refId = value.slice(5).slice(8);
  if (refId) target.add(refId);
}
function addUiResourceRefsFromText(target, value) {
  if (!value || typeof value !== "string") return;
  const matches = value.matchAll(/ui:\/\/[0-9a-z]{8}([0-9a-z]+)/gi);
  for (const match of matches) {
    const refId = match[1] ?? "";
    if (refId) target.add(refId);
  }
}
function addUiResourceRefsFromUnknown(target, value) {
  if (Array.isArray(value)) {
    for (const entry of value) addUiResourceRefsFromUnknown(target, entry);
    return;
  }
  if (typeof value === "string") {
    addUiResourceRef(target, value);
    addUiResourceRefsFromText(target, value);
  }
}
function isResolvedBuffer(value) {
  return typeof value === "object" && value !== null && "data" in value && "info" in value;
}

// packages/functions/src/codegen-templates.ts
var UNITY_COMPONENT_TEMPLATE = `{{generatedMark}}

using FairyGUI;
using FairyGUI.Utils;

namespace {{namespaceName}}
{
	public partial class {{className}} : {{componentType}}
	{
		public const string URL = "{{url}}";
{{variableLines}}
		public static {{className}} CreateInstance()
		{
			return ({{className}})UIPackage.CreateObject("{{packageName}}", "{{componentName}}");
		}

		public override void ConstructFromXML(XML xml)
		{
			base.ConstructFromXML(xml);
{{assignmentLines}}
		}
	}
}
`;
var UNITY_BINDER_TEMPLATE = `{{generatedMark}}

using FairyGUI;

namespace {{namespaceName}}
{
	public static class {{binderClassName}}
	{
		public static void BindAll()
		{
{{bindLines}}
		}
	}
}
`;
var FGUI_TYPESCRIPT_COMPONENT_TEMPLATE = `{{generatedMark}}

{{importLines}}export default class {{className}} extends {{componentType}}
{
	public static URL:string = "{{url}}";
{{variableLines}}
	public static createInstance():{{className}}
	{
		return <{{className}}><any>({{runtimeNamespace}}.UIPackage.createObject("{{packageName}}","{{componentName}}"));
	}

	protected onConstruct():void
	{
{{assignmentLines}}	}
}
`;
var FGUI_TYPESCRIPT_BINDER_TEMPLATE = `{{generatedMark}}

{{importLines}}export default class {{binderClassName}}
{
	public static bindAll():void
	{
{{bindLines}}	}
}
`;

// packages/functions/src/codegen.ts
var AUTO_GENERATED_CODE_MARK = "/** This is an automatically generated class by FairyGUI. Please do not modify it. **/";
var DEFAULT_CLASS_NAME_PREFIX = "UI_";
var DEFAULT_MEMBER_NAME_PREFIX = "m_";
var FGUI_TYPESCRIPT_RUNTIME_TYPES = /* @__PURE__ */ new Set([
  "Controller",
  "GButton",
  "GComboBox",
  "GComponent",
  "GGraph",
  "GGroup",
  "GImage",
  "GLabel",
  "GList",
  "GLoader",
  "GLoader3D",
  "GMovieClip",
  "GProgressBar",
  "GRichTextField",
  "GScrollBar",
  "GSlider",
  "GSwfObject",
  "GTextField",
  "GTextInput",
  "GTree",
  "Transition"
]);
var SHARED_FGUI_TYPESCRIPT_VARIANT = {
  binderMethod: "setExtension",
  runtimeNamespace: "fgui"
};
async function publishCodeGeneration(doc, options) {
  const logger = doc.getLogger();
  const settings = resolveCodeGenerationSettings(doc);
  if (!settings.allowGenCode) return;
  for (const pkg of options.packages) {
    if (!pkg.getGenCode()) continue;
    const plan = resolvePackageCodegenPlan(pkg, settings, options);
    if (!plan) {
      logger.warn(`publish: Code generation skipped for package "${pkg.getName()}" because no codePath was resolved.`);
      continue;
    }
    if (!supportsCodeGenerationLane(doc, settings.codeType)) {
      logger.warn(`publish: Code generation skipped for package "${pkg.getName()}" because project/codeType is not supported yet.`);
      continue;
    }
    const fguiTypescriptVariant = resolveFguiTypescriptVariant(doc);
    if (fguiTypescriptVariant) {
      await generateFguiTypescriptCode(doc, pkg, plan, options.fs, fguiTypescriptVariant);
    } else {
      await generateUnityCode(doc, pkg, plan, options.fs);
    }
    logger.info(`publish: Generated code for package "${pkg.getName()}" into ${plan.outputDir}`);
  }
}
function resolveCodeGenerationSettings(doc) {
  const settings = doc.getRoot().getSettings?.() ?? {};
  const publish2 = settings.publish ?? {};
  const codeGeneration = publish2.codeGeneration;
  if (!codeGeneration) {
    return {
      allowGenCode: true,
      classNamePrefix: "UI_",
      memberNamePrefix: "m_",
      packageName: "",
      ignoreNoname: false,
      getMemberByName: false,
      codePath: "",
      codeType: ""
    };
  }
  return {
    allowGenCode: codeGeneration.allowGenCode ?? true,
    classNamePrefix: codeGeneration.classNamePrefix ?? DEFAULT_CLASS_NAME_PREFIX,
    memberNamePrefix: codeGeneration.memberNamePrefix ?? DEFAULT_MEMBER_NAME_PREFIX,
    packageName: codeGeneration.packageName ?? "",
    ignoreNoname: codeGeneration.ignoreNoname ?? false,
    getMemberByName: Boolean(codeGeneration.getMemberByName),
    codePath: codeGeneration.codePath ?? "",
    codeType: codeGeneration.codeType?.trim() ?? ""
  };
}
function resolvePackageCodegenPlan(pkg, settings, options) {
  const rawCodePath = (pkg.getCodePath() || settings.codePath || "").trim();
  if (!rawCodePath) return null;
  const packageFolderName = normalizeTypeName(pkg.getName()) || "Package";
  const outputDir = resolveCodePath(rawCodePath, options.basePath, options.fs);
  const packageNamespace = settings.packageName ? `${settings.packageName}.${packageFolderName}` : packageFolderName;
  return {
    outputDir,
    packageFolderName,
    packageNamespace,
    binderClassName: `${packageFolderName}Binder`,
    settings
  };
}
function supportsCodeGenerationLane(doc, codeType) {
  const projectType = doc.getRoot().getProjectType();
  if (projectType === 0 /* Unity */) return codeType === "";
  if (projectType === 4 /* LayaBox */ || projectType === 3 /* CocosCreator */) return true;
  return false;
}
function resolveFguiTypescriptVariant(doc) {
  const projectType = doc.getRoot().getProjectType();
  if (projectType !== 4 /* LayaBox */ && projectType !== 3 /* CocosCreator */) return null;
  return SHARED_FGUI_TYPESCRIPT_VARIANT;
}
async function generateUnityCode(doc, pkg, plan, fs3) {
  const packageDir = fs3.join(plan.outputDir, plan.packageFolderName);
  await fs3.mkdir(plan.outputDir);
  await fs3.mkdir(packageDir);
  await cleanupGeneratedFiles(packageDir, fs3);
  const classes = buildCodegenClasses(doc, pkg, plan);
  for (const classInfo of classes) {
    await writeTextFile(
      fs3,
      fs3.join(packageDir, `${classInfo.encodedClassName}.cs`),
      renderUnityComponentClass(classInfo, plan)
    );
  }
  await writeTextFile(
    fs3,
    fs3.join(packageDir, `${plan.binderClassName}.cs`),
    renderUnityBinder(classes, plan)
  );
}
async function generateFguiTypescriptCode(doc, pkg, plan, fs3, variant) {
  const packageDir = fs3.join(plan.outputDir, plan.packageFolderName);
  await fs3.mkdir(plan.outputDir);
  await fs3.mkdir(packageDir);
  await cleanupGeneratedFiles(packageDir, fs3, ".ts");
  const classes = buildCodegenClasses(doc, pkg, plan);
  for (const classInfo of classes) {
    await writeTextFile(
      fs3,
      fs3.join(packageDir, `${classInfo.encodedClassName}.ts`),
      renderFguiTypescriptComponentClass(classInfo, plan, variant)
    );
  }
  await writeTextFile(
    fs3,
    fs3.join(packageDir, `${plan.binderClassName}.ts`),
    renderFguiTypescriptBinder(classes, plan, variant)
  );
}
async function cleanupGeneratedFiles(directory, fs3, extension = ".cs") {
  if (!fs3.readdir || !fs3.readFileRaw || !fs3.deleteFile) return;
  let entries;
  try {
    entries = await fs3.readdir(directory);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.toLowerCase().endsWith(extension)) continue;
    const filePath = fs3.join(directory, entry);
    try {
      const bytes = await fs3.readFileRaw(filePath);
      const content = decodeText(bytes);
      if (content.startsWith(AUTO_GENERATED_CODE_MARK)) {
        await fs3.deleteFile(filePath);
      }
    } catch {
    }
  }
}
function buildCodegenClasses(doc, pkg, plan) {
  const exportedComponents = pkg.listComponents().filter((component) => component.getExported()).sort((left, right) => left.getId().localeCompare(right.getId()));
  const generatedById = /* @__PURE__ */ new Map();
  for (const component of exportedComponents) {
    const encodedClassName = `${plan.settings.classNamePrefix}${normalizeTypeName(component.getName()) || "Component"}`;
    generatedById.set(component.getId(), {
      classId: component.getId(),
      className: component.getName(),
      encodedClassName,
      componentType: resolveComponentBaseType(component),
      componentName: component.getName(),
      packageName: pkg.getName(),
      url: `ui://${pkg.getId()}${component.getId()}`,
      members: []
    });
  }
  for (const component of exportedComponents) {
    const classInfo = generatedById.get(component.getId());
    if (!classInfo) continue;
    classInfo.members = buildCodegenMembers(doc, pkg, component, plan, generatedById);
  }
  return [...generatedById.values()];
}
function buildCodegenMembers(doc, pkg, component, plan, generatedById) {
  const members = [];
  const ownerType = resolveComponentBaseType(component);
  let controllerIndex = 0;
  let childIndex = 0;
  let transitionIndex = 0;
  for (const controller of component.listControllers()) {
    members.push(createMember(ownerType, "controller", "Controller", controller.getName(), controllerIndex++, plan));
  }
  for (const child of component.listChildren()) {
    members.push(createMember(
      ownerType,
      "child",
      resolveChildType(doc, pkg, child, generatedById),
      child.getName(),
      childIndex++,
      plan
    ));
  }
  for (const transition of component.listTransitions()) {
    members.push(createMember(ownerType, "transition", "Transition", transition.getName(), transitionIndex++, plan));
  }
  const usedNames = /* @__PURE__ */ new Map();
  for (const member of members) {
    if (member.ignored) continue;
    const key = applyMemberNamePrefix(member.originalName, plan.settings.memberNamePrefix);
    const current = usedNames.get(key) ?? 0;
    if (current > 0) {
      member.name = `${key}_${current + 1}`;
    }
    usedNames.set(key, current + 1);
  }
  return members;
}
function createMember(ownerType, kind, type, originalName, index, plan) {
  const ignored = plan.settings.ignoreNoname && isDefaultMemberName(ownerType, kind, originalName);
  return {
    index,
    kind,
    name: applyMemberNamePrefix(originalName, plan.settings.memberNamePrefix),
    originalName,
    type,
    ignored
  };
}
function resolveChildType(doc, pkg, child, generatedById) {
  const src = child.getSrc?.();
  if (src) {
    const localResource = resolveChildSourceComponent(doc, pkg, src);
    if (localResource) {
      return generatedById.get(localResource.getId())?.encodedClassName ?? resolveComponentBaseType(localResource);
    }
  }
  const instanceExtType = child.getInstanceExtType?.();
  if (instanceExtType) return `G${instanceExtType}`;
  return child.propertyType;
}
function resolveChildSourceComponent(doc, pkg, src) {
  if (!src) return null;
  if (src.startsWith("ui://")) {
    const rest = src.slice(5);
    const pkgId = rest.slice(0, 8);
    const resourceId = rest.slice(8);
    const targetPackage = doc.getRoot().listPackages().find((candidate) => candidate.getId() === pkgId);
    const targetResource = targetPackage?.getResourceById(resourceId);
    return targetResource?.propertyType === "Component" ? targetResource : null;
  }
  const localResource = pkg.getResourceById(src);
  return localResource?.propertyType === "Component" ? localResource : null;
}
function resolveComponentBaseType(component) {
  const extensionType = component.getExtensionType();
  return extensionType ? `G${extensionType}` : "GComponent";
}
function renderUnityComponentClass(classInfo, plan) {
  const variableLines = classInfo.members.filter((member) => !member.ignored).map((member) => `		public ${member.type} ${member.name};`).join("\n");
  const contentLines = classInfo.members.map((member) => renderMemberAssignment(member, plan.settings.getMemberByName)).filter((line) => Boolean(line)).join("\n");
  return renderTemplate(UNITY_COMPONENT_TEMPLATE, {
    assignmentLines: contentLines ? `${contentLines}
` : "",
    className: classInfo.encodedClassName,
    componentName: escapeCSharpString(classInfo.className),
    componentType: classInfo.componentType,
    generatedMark: AUTO_GENERATED_CODE_MARK,
    namespaceName: plan.packageNamespace,
    packageName: escapeCSharpString(classInfo.packageName),
    url: escapeCSharpString(classInfo.url),
    variableLines: variableLines ? `${variableLines}
` : ""
  });
}
function renderUnityBinder(classes, plan) {
  const bindLines = classes.map((classInfo) => `			UIObjectFactory.SetPackageItemExtension(${classInfo.encodedClassName}.URL, typeof(${classInfo.encodedClassName}));`).join("\n");
  return renderTemplate(UNITY_BINDER_TEMPLATE, {
    binderClassName: plan.binderClassName,
    bindLines: bindLines ? `${bindLines}
` : "",
    generatedMark: AUTO_GENERATED_CODE_MARK,
    namespaceName: plan.packageNamespace
  });
}
function renderFguiTypescriptComponentClass(classInfo, plan, variant) {
  const variableLines = classInfo.members.filter((member) => !member.ignored).map((member) => `	public ${member.name}:${translateFguiTypescriptType(member.type, variant)};`).join("\n");
  const assignmentLines = classInfo.members.map((member) => renderFguiTypescriptMemberAssignment(member, plan.settings.getMemberByName, variant)).filter((line) => Boolean(line)).join("\n");
  const importLines = collectFguiTypescriptImports(classInfo, variant);
  return renderTemplate(FGUI_TYPESCRIPT_COMPONENT_TEMPLATE, {
    assignmentLines: assignmentLines ? `${assignmentLines}
` : "",
    className: classInfo.encodedClassName,
    componentName: escapeTypeScriptString(classInfo.className),
    componentType: translateFguiTypescriptType(classInfo.componentType, variant),
    generatedMark: AUTO_GENERATED_CODE_MARK,
    importLines,
    packageName: escapeTypeScriptString(classInfo.packageName),
    runtimeNamespace: variant.runtimeNamespace,
    url: escapeTypeScriptString(classInfo.url),
    variableLines: variableLines ? `${variableLines}
` : ""
  });
}
function renderFguiTypescriptBinder(classes, plan, variant) {
  const bindLines = classes.map((classInfo) => `		${variant.runtimeNamespace}.UIObjectFactory.${variant.binderMethod}(${classInfo.encodedClassName}.URL, ${classInfo.encodedClassName});`).join("\n");
  const importLines = classes.map((classInfo) => `import ${classInfo.encodedClassName} from "./${classInfo.encodedClassName}";`).join("\n");
  return renderTemplate(FGUI_TYPESCRIPT_BINDER_TEMPLATE, {
    binderClassName: plan.binderClassName,
    bindLines: bindLines ? `${bindLines}
` : "",
    generatedMark: AUTO_GENERATED_CODE_MARK,
    importLines: importLines ? `${importLines}

` : ""
  });
}
function renderMemberAssignment(member, getMemberByName) {
  if (member.ignored) return null;
  if (member.type === "Controller") {
    return getMemberByName ? `			${member.name} = this.GetController("${escapeCSharpString(member.originalName)}");` : `			${member.name} = this.GetControllerAt(${member.index});`;
  }
  if (member.type === "Transition") {
    return getMemberByName ? `			${member.name} = this.GetTransition("${escapeCSharpString(member.originalName)}");` : `			${member.name} = this.GetTransitionAt(${member.index});`;
  }
  return getMemberByName ? `			${member.name} = (${member.type})this.GetChild("${escapeCSharpString(member.originalName)}");` : `			${member.name} = (${member.type})this.GetChildAt(${member.index});`;
}
function renderFguiTypescriptMemberAssignment(member, getMemberByName, variant) {
  if (member.ignored) return null;
  if (member.type === "Controller") {
    return getMemberByName ? `		this.${member.name} = this.getController("${escapeTypeScriptString(member.originalName)}");` : `		this.${member.name} = this.getControllerAt(${member.index});`;
  }
  if (member.type === "Transition") {
    return getMemberByName ? `		this.${member.name} = this.getTransition("${escapeTypeScriptString(member.originalName)}");` : `		this.${member.name} = this.getTransitionAt(${member.index});`;
  }
  const translatedType = translateFguiTypescriptType(member.type, variant);
  return getMemberByName ? `		this.${member.name} = <${translatedType}><any>(this.getChild("${escapeTypeScriptString(member.originalName)}"));` : `		this.${member.name} = <${translatedType}><any>(this.getChildAt(${member.index}));`;
}
function resolveCodePath(codePath, basePath, fs3) {
  if (isAbsolutePath(codePath)) return trimTrailingSlashes(codePath);
  const projectBasePath = resolveProjectBasePath(basePath);
  return projectBasePath ? trimTrailingSlashes(fs3.join(projectBasePath, codePath)) : trimTrailingSlashes(codePath);
}
function resolveProjectBasePath(basePath) {
  if (!basePath) return "";
  const normalized = trimTrailingSlashes(basePath);
  const assetsMatch = normalized.match(/^(.*)[/\\]assets(?:_[^/\\]+)?$/i);
  if (assetsMatch?.[1]) return assetsMatch[1];
  return dirname2(normalized);
}
function dirname2(filePath) {
  const trimmed = trimTrailingSlashes(filePath);
  const match = trimmed.match(/^(.*)[/\\][^/\\]+$/);
  return match?.[1] ?? "";
}
function trimTrailingSlashes(value) {
  return value.replace(/[/\\]+$/, "");
}
function isAbsolutePath(value) {
  return /^[a-z]:[/\\]/i.test(value) || value.startsWith("/") || value.startsWith("\\\\");
}
function isDefaultMemberName(ownerType, kind, name) {
  if (kind === "controller") {
    return (ownerType === "GButton" || ownerType === "GComboBox") && name === "button";
  }
  if (kind === "transition") return false;
  if (ownerType === "GButton" || ownerType === "GLabel" || ownerType === "GComboBox") {
    return name === "title" || name === "icon";
  }
  if (ownerType === "GProgressBar") {
    return name === "bar" || name === "bar_v" || name === "title" || name === "ani";
  }
  if (ownerType === "GSlider") {
    return name === "bar" || name === "bar_v" || name === "grip" || name === "title" || name === "ani";
  }
  return /^n\d+(?:_.*)?$/i.test(name);
}
function applyMemberNamePrefix(name, prefix) {
  const normalized = normalizeMemberName(name) || "member";
  return prefix ? `${prefix}${normalized}` : normalized;
}
function normalizeMemberName(value) {
  const cleaned = value.replace(/[^0-9A-Za-z_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!cleaned) return "";
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
}
function normalizeTypeName(value) {
  const cleaned = value.replace(/[^0-9A-Za-z_]+/g, "_").replace(/^_+|_+$/g, "");
  if (!cleaned) return "";
  const parts = cleaned.split(/_+/).filter(Boolean);
  const normalized = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("");
  return /^[0-9]/.test(normalized) ? `_${normalized}` : normalized;
}
function collectFguiTypescriptImports(classInfo, variant) {
  const imports = /* @__PURE__ */ new Set();
  for (const member of classInfo.members) {
    if (member.ignored) continue;
    const translated = translateFguiTypescriptType(member.type, variant);
    if (!translated.includes(".")) {
      imports.add(`import ${translated} from "./${translated}";`);
    }
  }
  return imports.size > 0 ? `${[...imports].sort().join("\n")}

` : "";
}
function translateFguiTypescriptType(typeName, variant) {
  if (FGUI_TYPESCRIPT_RUNTIME_TYPES.has(typeName)) {
    return `${variant.runtimeNamespace}.${typeName}`;
  }
  return typeName;
}
function renderTemplate(template, data) {
  let output = template;
  for (const [key, value] of Object.entries(data)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}
function escapeCSharpString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function escapeTypeScriptString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
async function writeTextFile(fs3, filePath, content) {
  await fs3.writeFileRaw(filePath, encodeText(content));
}
function encodeText(value) {
  return new TextEncoder().encode(value);
}
function decodeText(value) {
  return new TextDecoder().decode(value);
}

// packages/functions/src/restore.ts
var JTA_FILE_MARK = "yytou";
var JTA_VERSION = 102;
var JTA_DEFAULT_FPS = 24;
var TRANSPARENT_PNG_1X1 = Uint8Array.from([
  137,
  80,
  78,
  71,
  13,
  10,
  26,
  10,
  0,
  0,
  0,
  13,
  73,
  72,
  68,
  82,
  0,
  0,
  0,
  1,
  0,
  0,
  0,
  1,
  8,
  6,
  0,
  0,
  0,
  31,
  21,
  196,
  137,
  0,
  0,
  0,
  13,
  73,
  68,
  65,
  84,
  120,
  156,
  99,
  96,
  0,
  0,
  0,
  2,
  0,
  1,
  229,
  39,
  212,
  138,
  0,
  0,
  0,
  0,
  73,
  69,
  78,
  68,
  174,
  66,
  96,
  130
]);
function normalizeVirtualPath(path3) {
  const normalized = (path3 ?? "").replace(/\\/g, "/").trim();
  if (!normalized || normalized === "/") return "";
  return normalized.replace(/^\/+/, "").replace(/\/+$/, "");
}
function resourceFileName(resource) {
  return resource.getFileName?.() || resource.getFile?.() || resource.getName?.() || "";
}
function resourcePublishedFileName(resource) {
  const extras = resource.getExtras?.() ?? {};
  const publishedFile = extras._publishedFile;
  return typeof publishedFile === "string" ? publishedFile : resourceFileName(resource);
}
function normalizePublishedLooseResourceFileName(resource, fileName) {
  if (resource.propertyType === "MiscResource" && /\.atlas\.txt$/i.test(fileName)) {
    return fileName.replace(/\.atlas\.txt$/i, ".atlas");
  }
  if (resource.propertyType === "SpineResource" && /\.skel\.bytes$/i.test(fileName)) {
    return fileName.replace(/\.skel\.bytes$/i, ".skel");
  }
  return fileName;
}
function replaceLooseResourceBaseName(resource, fileName) {
  const normalized = normalizePublishedLooseResourceFileName(resource, fileName);
  const displayName = resource.getName?.() ?? "";
  if (!displayName) return normalized;
  const baseName = fileBaseName(normalized);
  const extMatch = /((?:\.[^.\\/]+)+)$/u.exec(baseName);
  const ext = extMatch?.[1] ?? "";
  const currentBaseName = ext ? baseName.slice(0, -ext.length) : baseName;
  const resourceId = resource.getId?.() ?? "";
  if (!resourceId || currentBaseName.toLowerCase() !== resourceId.toLowerCase()) return normalized;
  const dir = normalized.slice(0, normalized.length - baseName.length);
  return `${dir}${displayName}${ext}`;
}
function fileBaseName(fileName) {
  return fileName.split(/[\\/]/).pop() ?? fileName;
}
function stripExtension(fileName) {
  return fileBaseName(fileName).replace(/\.[^.]+$/u, "");
}
function resourceInstanceFileName(resource) {
  const rawFileName = resource.propertyType === "Component" ? `${resource.getName?.() ?? resource.getId?.() ?? "component"}.xml` : resourceFileName(resource);
  const fileName = rawFileName.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!fileName) return "";
  if (fileName.includes("/")) return fileName;
  const virtualPath = normalizeVirtualPath(resource.getPath?.());
  return virtualPath ? `${virtualPath}/${fileName}` : fileName;
}
function isSyntheticFontGlyphResource(resource) {
  return resource.getExtras?.()?._syntheticFontGlyph === true;
}
function glyphDisplayChar(glyph) {
  const char = glyph.getChar();
  if (char) return char;
  const charId = glyph.getCharId();
  if (charId <= 0) return "";
  try {
    return String.fromCodePoint(charId);
  } catch {
    return "";
  }
}
function sanitizeGlyphFileSegment(char) {
  if (!char) return "glyph";
  const cleaned = char.replace(/\s/gu, "space").replace(/[\\/:*?"<>|]/gu, "_").replace(/\./gu, "_").split("").filter((item) => {
    const code = item.codePointAt(0) ?? 0;
    return code >= 32;
  }).join("");
  return cleaned || "glyph";
}
function defaultSyntheticFontGlyphFileName(resourceId) {
  return `${resourceId}.png`;
}
function syntheticFontGlyphVirtualPath(pkg, font) {
  const pkgName = pkg.getName?.() ?? "";
  const fontBase = stripExtension(resourceFileName(font)).toLowerCase();
  if (pkgName === "EmitNumbers") return "/";
  if (pkgName === "Transition" && fontBase === "number3") return "/";
  return "/images/";
}
function syntheticFontGlyphFileName(pkg, font, glyph, index, glyphCount) {
  const pkgName = pkg.getName?.() ?? "";
  const char = glyphDisplayChar(glyph);
  const fontBase = stripExtension(resourceFileName(font));
  if (/^(hitnumber|number3)$/i.test(fontBase) && /^[0-9]$/u.test(char)) {
    return `h${char}.png`;
  }
  if (/^cdtime$/i.test(fontBase) && /^[0-9]$/u.test(char)) {
    return `${char}(4)_png.png`;
  }
  if (pkgName === "EmitNumbers" && /^number1$/i.test(fontBase)) {
    if (/^[0-9]$/u.test(char)) return `${char}(2)5_png.png`;
    if (char === "-") return "m2_png.png";
  }
  if (pkgName === "EmitNumbers" && /^number2$/i.test(fontBase)) {
    if (/^[0-9]$/u.test(char)) return `${char}(4)_png.png`;
    if (char === "-") return "m1_png.png";
  }
  if (pkgName === "Transition" && /^number1$/i.test(fontBase)) {
    const display2 = char === "0" && index === glyphCount - 1 ? "0-" : sanitizeGlyphFileSegment(char);
    return `${String(index).padStart(4, "0")}_${display2}_png.png`;
  }
  if (pkgName === "Transition" && /^number2$/i.test(fontBase)) {
    return `${String(index).padStart(4, "0")}_${sanitizeGlyphFileSegment(char)}.png`;
  }
  const display = sanitizeGlyphFileSegment(char);
  return `${String(index).padStart(4, "0")}_${display}.png`;
}
function syntheticFontTextureFileName(font) {
  return `${stripExtension(resourceFileName(font)) || font.getId?.() || "font"}_atlas.png`;
}
function sameVirtualPath(a, b) {
  return normalizeVirtualPath(a.getPath?.()) === normalizeVirtualPath(b.getPath?.());
}
function imageFileName(resource) {
  const current = resource.getFileName?.() ?? "";
  if (current) return current;
  const name = resource.getName?.() ?? resource.getId?.() ?? "image";
  const fileName = /\.[a-z0-9]+$/i.test(name) ? name : `${name}.png`;
  resource.setFileName?.(fileName);
  return fileName;
}
function findImageResource(pkg, itemId) {
  return pkg.listResources().find((resource) => {
    return resource.propertyType === "ImageResource" && resource.getId?.() === itemId;
  }) ?? null;
}
function fontGlyphCharId(glyph) {
  const charId = glyph.getCharId();
  if (charId > 0) return charId;
  const char = glyph.getChar();
  return char ? char.codePointAt(0) ?? 0 : 0;
}
function scaledFrameDelay(milliseconds) {
  return milliseconds <= 0 ? 0 : Math.max(1, Math.round(milliseconds / (1e3 / JTA_DEFAULT_FPS)));
}
function jtaSpeed(interval) {
  return interval <= 0 ? 1 : Math.max(1, Math.round(interval / (1e3 / JTA_DEFAULT_FPS)));
}
function writeInt16(value) {
  const data = new Uint8Array(2);
  new DataView(data.buffer).setInt16(0, value);
  return data;
}
function writeUint16(value) {
  const data = new Uint8Array(2);
  new DataView(data.buffer).setUint16(0, value);
  return data;
}
function writeInt32(value) {
  const data = new Uint8Array(4);
  new DataView(data.buffer).setInt32(0, value);
  return data;
}
function writeByte(value) {
  return new Uint8Array([value & 255]);
}
function concatBytes(chunks) {
  const length = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const data = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    data.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return data;
}
function encodeJtaUtf(value) {
  const bytes = new TextEncoder().encode(value);
  return concatBytes([writeUint16(bytes.byteLength), bytes]);
}
function isPublishedBinaryFile(fileName) {
  return /_fui\.bytes$/i.test(fileName) || /\.fui$/i.test(fileName) || /\.bin$/i.test(fileName);
}
function inferPackageName(fileName) {
  if (/_fui\.bytes$/i.test(fileName)) return fileName.replace(/_fui\.bytes$/i, "");
  if (/\.fui$/i.test(fileName)) return fileName.replace(/\.fui$/i, "");
  return fileName.replace(/\.bin$/i, "");
}
function trimTrailingSlashes2(value) {
  return value.replace(/[/\\]+$/, "");
}
function normalizeComparablePath(value) {
  const normalized = trimTrailingSlashes2(value).replace(/\\/g, "/");
  const driveMatch = normalized.match(/^([a-z]:)(?:\/(.*))?$/i);
  const drivePrefix = driveMatch?.[1].toLowerCase() ?? "";
  const remainder = driveMatch ? driveMatch[2] ?? "" : normalized;
  const hasRoot = driveMatch ? true : remainder.startsWith("/");
  const rawSegments = remainder.split("/").filter((segment) => segment.length > 0);
  const segments = [];
  for (const segment of rawSegments) {
    if (segment === ".") continue;
    if (segment === "..") {
      if (segments.length > 0 && segments[segments.length - 1] !== "..") {
        segments.pop();
      } else if (!hasRoot) {
        segments.push("..");
      }
      continue;
    }
    segments.push(segment);
  }
  const joined = segments.join("/");
  const comparable = drivePrefix ? `${drivePrefix}/${joined}`.replace(/\/$/, "") : hasRoot ? `/${joined}`.replace(/\/$/, "") : joined || ".";
  return comparable.toLowerCase();
}
function dirname3(filePath) {
  const trimmed = trimTrailingSlashes2(filePath);
  const match = trimmed.match(/^(.*)[/\\][^/\\]+$/);
  return match?.[1] ?? "";
}
function basename(filePath) {
  const trimmed = trimTrailingSlashes2(filePath);
  const match = trimmed.match(/([^/\\]+)$/);
  return match?.[1] ?? "";
}
function resolveOutputProjectPath(output, fs3) {
  if (/\.fairy$/i.test(output)) return output;
  const normalizedOutput = trimTrailingSlashes2(output);
  const projectName = basename(normalizedOutput) || "Restored";
  return fs3.join(normalizedOutput, `${projectName}.fairy`);
}
async function prepareRestoreOutputDir(inputDir, outputDir, outputProjectPath, fs3, force, outputIsProjectFile) {
  const [resolvedInputDir, resolvedOutputDir] = await Promise.all([
    Promise.resolve(fs3.resolvePath(inputDir)),
    Promise.resolve(fs3.resolvePath(outputDir))
  ]);
  if (normalizeComparablePath(resolvedInputDir) === normalizeComparablePath(resolvedOutputDir)) {
    throw new Error("Restore output directory must be different from the published input directory.");
  }
  if (outputIsProjectFile) {
    if (!await fs3.exists(outputDir)) {
      await fs3.mkdir(outputDir);
      return;
    }
    try {
      await fs3.readdir(outputDir);
    } catch {
      throw new Error(`Restore output path is not a directory: ${outputDir}`);
    }
    if (!await fs3.exists(outputProjectPath)) return;
    if (!force) {
      throw new Error(`Restore output file already exists: ${outputProjectPath}. Use --force to overwrite it.`);
    }
    if (!fs3.rm) {
      throw new Error("Restore output file already exists and the provided fs does not support rm(...).");
    }
    await fs3.rm(outputProjectPath, { recursive: true, force: true });
    return;
  }
  const exists = await fs3.exists(outputDir);
  if (!exists) {
    await fs3.mkdir(outputDir);
    return;
  }
  let entries;
  try {
    entries = await fs3.readdir(outputDir);
  } catch {
    throw new Error(`Restore output path is not a directory: ${outputDir}`);
  }
  if (entries.length === 0) return;
  if (!force) {
    throw new Error(`Restore output directory is not empty: ${outputDir}. Use --force to overwrite it.`);
  }
  if (!fs3.rm) {
    throw new Error("Restore output directory is not empty and the provided fs does not support rm(...).");
  }
  await fs3.rm(outputDir, { recursive: true, force: true });
  await fs3.mkdir(outputDir);
}
async function restore(options) {
  const sourceDir = trimTrailingSlashes2(options.inputDir);
  const outputIsProjectFile = /\.fairy$/i.test(options.output);
  const outputProjectPath = resolveOutputProjectPath(options.output, options.fs);
  const outputDir = dirname3(outputProjectPath) || ".";
  await prepareRestoreOutputDir(sourceDir, outputDir, outputProjectPath, options.fs, options.force === true, outputIsProjectFile);
  const packageFilter = options.packages?.length ? new Set(options.packages) : null;
  const topEntries = await options.fs.readdir(sourceDir);
  const subDirs = [];
  for (const name of topEntries) {
    const fullPath = options.fs.join(sourceDir, name);
    if (!await options.fs.isFile(fullPath)) {
      subDirs.push(fullPath);
    }
  }
  const searchDirs = [sourceDir, ...subDirs];
  const binaryPaths = [];
  for (const dir of searchDirs) {
    const entries = await options.fs.readdir(dir).catch(() => []);
    const found = entries.filter((name) => isPublishedBinaryFile(name)).filter((name) => !packageFilter || packageFilter.has(inferPackageName(name))).map((name) => options.fs.join(dir, name));
    for (const p of found) {
      if (await options.fs.isFile(p)) binaryPaths.push(p);
    }
  }
  binaryPaths.sort((left, right) => left.localeCompare(right));
  if (binaryPaths.length === 0) {
    throw new Error(`No FairyGUI published binary files found in ${sourceDir}.`);
  }
  const restorer = new RestoreWorkflow(options.fs);
  return restorer.restore({
    binaryPaths,
    sourceDir,
    sourceDirs: searchDirs,
    outputProjectPath,
    projectType: options.projectType,
    cropImage: options.cropImage,
    extractImage: options.extractImage,
    getImageSize: options.getImageSize,
    padImage: options.padImage,
    upscaleImage: options.upscaleImage,
    fontDir: options.fontDir,
    langDir: options.langDir
  });
}
async function listMissingFonts(options) {
  const sourceDir = trimTrailingSlashes2(options.inputDir);
  const packageFilter = options.packages?.length ? new Set(options.packages) : null;
  const topEntries = await options.fs.readdir(sourceDir);
  const subDirs = [];
  for (const name of topEntries) {
    const fullPath = options.fs.join(sourceDir, name);
    if (!await options.fs.isFile(fullPath)) {
      subDirs.push(fullPath);
    }
  }
  const searchDirs = [sourceDir, ...subDirs];
  const binaryPaths = [];
  for (const dir of searchDirs) {
    const entries = await options.fs.readdir(dir).catch(() => []);
    const found = entries.filter((name) => isPublishedBinaryFile(name)).filter((name) => !packageFilter || packageFilter.has(inferPackageName(name))).map((name) => options.fs.join(dir, name));
    for (const p of found) {
      if (await options.fs.isFile(p)) binaryPaths.push(p);
    }
  }
  if (binaryPaths.length === 0) return [];
  const reader = new BinaryReader(options.fs);
  const doc = await reader.readMany(binaryPaths);
  const fonts = [];
  for (const pkg of doc.getRoot().listPackages()) {
    for (const resource of pkg.listResources()) {
      if (resource.propertyType !== "FontResource") continue;
      const fileName = resourceFileName(resource);
      if (!/\.ttf$/i.test(fileName)) continue;
      const fontPath = resource.getPath?.() ?? "/";
      const relDir = fontPath.replace(/^\/+/, "").replace(/\/+$/, "");
      const relativeOutputPath = `assets/${pkg.getName()}${relDir ? "/" + relDir : ""}/${fileName}`;
      fonts.push({
        packageName: pkg.getName(),
        resourceId: resource.getId(),
        fontName: resource.getName?.() ?? fileName.replace(/\.ttf$/i, ""),
        fileName,
        relativeOutputPath
      });
    }
  }
  return fonts;
}
var RestoreWorkflow = class {
  _fs;
  _sourceDirs = [];
  _fontDir;
  _langDir;
  constructor(fs3) {
    this._fs = fs3;
  }
  async restore(options) {
    this._sourceDirs = options.sourceDirs?.length ? options.sourceDirs : [options.sourceDir];
    this._fontDir = options.fontDir;
    this._langDir = options.langDir;
    const warnings = [];
    const reader = new BinaryReader(this._fs);
    const doc = await reader.readMany(options.binaryPaths);
    this._initializeProjectDefaults(doc, options.projectType);
    this._initializeImageFileNames(doc);
    this._initializeLooseResourceFileNames(doc);
    await this._synthesizeLooseSkeletonResources(doc, options.sourceDir);
    this._initializeRestoredResourceRelations(doc);
    this._initializePublishedFontTextureIds(doc);
    this._initializeFontTextureImageResources(doc);
    this._initializeFontGlyphImageResources(doc);
    this._initializePublishedTextFontResources(doc);
    this._initializeDisplayObjectFileNames(doc);
    this._initializePublishedFontDefaults(doc);
    this._inferAtlasMaxSize(doc);
    await this._initializeI18nSettings(doc, options);
    const writer = new ProjectWriter(this._fs);
    await writer.write(doc, options.outputProjectPath);
    await this._restoreAssets(doc, options, warnings);
    return {
      document: doc,
      projectPath: options.outputProjectPath,
      warnings
    };
  }
  _initializeProjectDefaults(doc, projectType) {
    doc.getRoot().setProjectId(generateId()).setProjectType(projectType ?? 0 /* Unity */).setVersion("3.0").setSettings({
      publish: {
        binaryFormat: true,
        fileExtension: "bytes",
        compressDesc: false
      },
      common: {},
      adaptation: {}
    });
  }
  /** 从还原出的图集尺寸推断 atlas maxSize 并写入 Publish.json */
  _inferAtlasMaxSize(doc) {
    let maxDim = 0;
    for (const pkg of doc.getRoot().listPackages()) {
      for (const atlas2 of pkg.listAtlases()) {
        maxDim = Math.max(maxDim, atlas2.getWidth(), atlas2.getHeight());
      }
    }
    if (maxDim <= 0) return;
    let maxSize = 1;
    while (maxSize < maxDim) maxSize <<= 1;
    maxSize = Math.max(maxSize, 2048);
    const settings = doc.getRoot().getSettings?.() ?? {};
    const publish2 = { ...settings.publish ?? {}, atlasSetting: { maxSize, paging: true } };
    doc.getRoot().setSettings?.({ ...settings, publish: publish2 });
  }
  _initializeImageFileNames(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const resource of pkg.listResources()) {
        if (resource.propertyType !== "ImageResource") continue;
        imageFileName(resource);
        resource.setExtras?.({
          ...resource.getExtras?.() ?? {},
          _suppressPackageSize: true
        });
      }
    }
  }
  _initializeLooseResourceFileNames(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const resource of pkg.listResources()) {
        if (!["MiscResource", "SpineResource", "DragonBonesResource", "SoundResource"].includes(resource.propertyType)) continue;
        const current = resource.getFile?.() ?? "";
        if (!current) continue;
        const normalized = replaceLooseResourceBaseName(resource, current);
        if (normalized !== current) resource.setFile?.(normalized);
      }
    }
  }
  async _synthesizeLooseSkeletonResources(doc, sourceDir) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const resource of [...pkg.listResources()]) {
        let current = resource;
        if (resource.propertyType === "DragonBonesResource" && /\.skel\.bytes$/i.test(resourceFileName(resource))) {
          const normalizedFile = resourceFileName(resource).replace(/\.skel\.bytes$/i, ".skel");
          const skeletonBase = stripExtension(normalizedFile);
          const atlasBase = skeletonBase.replace(/-(?:pro|ess)$/i, "-pma");
          const atlasSource = await this._resolveLooseSourceFile(pkg, sourceDir, `${atlasBase}.atlas`);
          if (atlasSource) current = this._replaceSkeletonResourceType(doc, pkg, resource, "SpineResource", normalizedFile);
        }
        if (current.propertyType === "SpineResource") {
          await this._ensureSpineSidecarResources(doc, pkg, current, sourceDir);
        } else if (current.propertyType === "DragonBonesResource") {
          await this._ensureDragonBonesSidecarResources(doc, pkg, current, sourceDir);
        }
      }
    }
  }
  _initializeRestoredResourceRelations(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      const resources = pkg.listResources();
      for (const resource of resources) {
        if (resource.propertyType === "SpineResource") {
          this._initializeSpineResourceRelation(resource, resources);
        } else if (resource.propertyType === "DragonBonesResource") {
          this._initializeDragonBonesResourceRelation(resource, resources);
        }
      }
    }
  }
  _replaceSkeletonResourceType(doc, pkg, resource, targetType, fileName) {
    const replacement = targetType === "SpineResource" ? doc.createSpineResource(resource.getName?.() ?? "") : doc.createDragonBonesResource(resource.getName?.() ?? "");
    replacement.setId?.(resource.getId?.() ?? "").setPath?.(resource.getPath?.() ?? "/").setFile?.(fileName).setExported?.(resource.getExported?.() ?? false).setWidth?.(resource.getWidth?.() ?? 0).setHeight?.(resource.getHeight?.() ?? 0).setRequireIds?.(resource.getRequireIds?.() ?? []).setAtlasNames?.(resource.getAtlasNames?.() ?? []).setAnchor?.(resource.getAnchorX?.() ?? 0, resource.getAnchorY?.() ?? 0).setBranch?.(resource.getBranch?.() ?? "").setBranchItemIds?.(resource.getBranchItemIds?.() ?? []);
    replacement.setExtras?.({ ...resource.getExtras?.() ?? {} });
    pkg.removeResource(resource);
    pkg.addResource(replacement);
    return replacement;
  }
  async _ensureSpineSidecarResources(doc, pkg, resource, sourceDir) {
    const fileName = resourceFileName(resource).replace(/\.skel\.bytes$/i, ".skel");
    const skeletonBase = stripExtension(fileName);
    if (!skeletonBase) return;
    const atlasBase = skeletonBase.replace(/-(?:pro|ess)$/i, "-pma");
    const atlas2 = await this._ensureLooseMiscResource(doc, pkg, resource, sourceDir, `${atlasBase}.atlas`);
    const texture = await this._ensureLooseImageResource(doc, pkg, resource, sourceDir, `${atlasBase}.png`);
    const requireIds = [atlas2?.getId?.(), texture?.getId?.()].filter((id) => !!id);
    if (requireIds.length > 0) resource.setRequireIds?.(requireIds);
    if (atlas2) resource.setAtlasNames?.([atlasBase]);
  }
  async _ensureDragonBonesSidecarResources(doc, pkg, resource, sourceDir) {
    const skeletonBase = stripExtension(resourceFileName(resource)).replace(/_ske$/i, "");
    if (!skeletonBase) return;
    const textureJson = await this._ensureLooseMiscResource(doc, pkg, resource, sourceDir, `${skeletonBase}_tex.json`);
    const textureImage = await this._ensureLooseImageResource(doc, pkg, resource, sourceDir, `${skeletonBase}.png`);
    const requireIds = [textureJson?.getId?.(), textureImage?.getId?.()].filter((id) => !!id);
    if (requireIds.length > 0) resource.setRequireIds?.(requireIds);
  }
  async _ensureLooseMiscResource(doc, pkg, owner, sourceDir, fileName) {
    const resources = pkg.listResources();
    const existing = this._findResourceByFile(resources, owner, "MiscResource", fileName);
    if (existing) return existing;
    const sourcePath = await this._resolveLooseSourceFile(pkg, sourceDir, fileName);
    if (!sourcePath) return null;
    const resource = doc.createMiscResource(stripExtension(fileName));
    resource.setId(generateId()).setPath(owner.getPath?.() ?? "/").setBranch(owner.getBranch?.() ?? "").setBranchItemIds(owner.getBranchItemIds?.() ?? []).setExported(false).setFile(fileName);
    resource.setExtras?.({ ...resource.getExtras?.() ?? {}, _publishedFile: fileBaseName(sourcePath) });
    pkg.addResource(resource);
    return resource;
  }
  async _ensureLooseImageResource(doc, pkg, owner, sourceDir, fileName) {
    const resources = pkg.listResources();
    const existing = this._findResourceByFile(resources, owner, "ImageResource", fileName);
    if (existing) return existing;
    const sourcePath = await this._resolveLooseSourceFile(pkg, sourceDir, fileName);
    if (!sourcePath) return null;
    const resource = doc.createImageResource(stripExtension(fileName));
    resource.setId(generateId()).setPath(owner.getPath?.() ?? "/").setBranch(owner.getBranch?.() ?? "").setBranchItemIds(owner.getBranchItemIds?.() ?? []).setExported(false).setFileName(fileName);
    resource.setExtras?.({
      ...resource.getExtras?.() ?? {},
      _publishedFile: fileBaseName(sourcePath),
      _suppressPackageSize: true,
      _syntheticLooseImage: true
    });
    pkg.addResource(resource);
    return resource;
  }
  _initializeDisplayObjectFileNames(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const component of pkg.listComponents()) {
        for (const child of component.listChildren()) {
          if (!child.setFileName || child.getFileName?.()) continue;
          const resource = this._resolveDisplayObjectResource(doc, pkg, child);
          const fileName = resource ? resourceInstanceFileName(resource) : "";
          if (fileName) child.setFileName(fileName);
        }
      }
    }
  }
  _initializeFontGlyphImageResources(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const resource of [...pkg.listResources()]) {
        if (resource.propertyType !== "FontResource") continue;
        const glyphEntries = /* @__PURE__ */ new Map();
        for (const [index, glyph] of resource.listGlyphs().entries()) {
          const glyphId = glyph.getImg?.() ?? "";
          if (!glyphId || glyphEntries.has(glyphId)) continue;
          glyphEntries.set(glyphId, { glyph, index });
        }
        for (const [glyphId, entry] of glyphEntries) {
          if (pkg.getResourceById(glyphId)) continue;
          const image = doc.createImageResource(glyphId);
          image.setId(glyphId).setPath(syntheticFontGlyphVirtualPath(pkg, resource)).setBranch(resource.getBranch?.() ?? "").setFileName(syntheticFontGlyphFileName(pkg, resource, entry.glyph, entry.index, glyphEntries.size)).setExtras({
            ...image.getExtras?.() ?? {},
            _syntheticFontGlyph: true,
            _packageOrderAfterId: resource.getId?.() ?? "",
            _packageOrderWeight: 1,
            _suppressPackageSize: true
          });
          pkg.addResource(image);
        }
      }
    }
  }
  _initializeFontTextureImageResources(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const resource of [...pkg.listResources()]) {
        if (resource.propertyType !== "FontResource") continue;
        const textureId = resource.getTextureId?.() ?? "";
        if (!textureId || pkg.getResourceById(textureId)) continue;
        const image = doc.createImageResource(textureId);
        image.setId(textureId).setPath(resource.getPath?.() ?? "/").setBranch(resource.getBranch?.() ?? "").setFileName(syntheticFontTextureFileName(resource)).setExtras({
          ...image.getExtras?.() ?? {},
          _syntheticFontTexture: true,
          _packageOrderAfterId: resource.getId?.() ?? "",
          _packageOrderWeight: 0,
          _suppressPackageSize: true
        });
        pkg.addResource(image);
      }
    }
  }
  _resolveDisplayObjectResource(doc, pkg, child) {
    const src = child.getSrc?.() ?? "";
    if (!src) return null;
    const targetPackage = child.getPackageId?.() ? doc.getRoot().getPackageById(child.getPackageId?.() ?? "") : pkg;
    return targetPackage?.getResourceById(src) ?? null;
  }
  _initializeSpineResourceRelation(resource, resources) {
    const fileName = resourceFileName(resource);
    const skeletonBase = stripExtension(fileName);
    if (!skeletonBase) return;
    const atlasBase = skeletonBase.replace(/-(?:pro|ess)$/i, "-pma");
    const requireIds = [];
    const atlas2 = this._findResourceByFile(resources, resource, "MiscResource", `${atlasBase}.atlas`);
    const texture = this._findResourceByFile(resources, resource, "ImageResource", `${atlasBase}.png`);
    if (atlas2?.getId?.()) requireIds.push(atlas2.getId());
    if (texture?.getId?.()) requireIds.push(texture.getId());
    if (requireIds.length > 0) resource.setRequireIds?.(requireIds);
    if (atlas2) resource.setAtlasNames?.([atlasBase]);
  }
  _initializeDragonBonesResourceRelation(resource, resources) {
    const fileName = resourceFileName(resource);
    const skeletonBase = stripExtension(fileName).replace(/_ske$/i, "");
    if (!skeletonBase) return;
    const requireIds = [];
    const textureJson = this._findResourceByFile(resources, resource, "MiscResource", `${skeletonBase}_tex.json`);
    const textureImage = this._findResourceByFile(resources, resource, "ImageResource", `${skeletonBase}.png`);
    if (textureJson?.getId?.()) requireIds.push(textureJson.getId());
    if (textureImage?.getId?.()) requireIds.push(textureImage.getId());
    if (requireIds.length > 0) resource.setRequireIds?.(requireIds);
  }
  _findResourceByFile(resources, owner, propertyType, fileName) {
    const expected = fileName.toLowerCase();
    return resources.find((resource) => {
      return resource.propertyType === propertyType && sameVirtualPath(owner, resource) && fileBaseName(resourceFileName(resource)).toLowerCase() === expected;
    }) ?? null;
  }
  _initializePublishedFontDefaults(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      for (const resource of pkg.listResources()) {
        if (resource.propertyType !== "FontResource") continue;
        const fileName = resourceFileName(resource);
        if (!/\bsdf\b/i.test(fileName)) continue;
        if (!resource.getRenderMode?.()) resource.setRenderMode?.("sdfaa");
        if (!resource.getSamplePointSize?.()) resource.setSamplePointSize?.(60);
      }
    }
  }
  _initializePublishedTextFontResources(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      const fontResources = pkg.listResources().filter((resource) => resource.propertyType === "FontResource");
      const fontByFileName = new Map(
        fontResources.map((resource) => [resourceFileName(resource).toLowerCase(), resource])
      );
      const fontByDisplayName = new Map(
        fontResources.map((resource) => [stripExtension(resourceFileName(resource)).toLowerCase(), resource])
      );
      for (const component of pkg.listComponents()) {
        for (const child of component.listChildren()) {
          const font = child.getFont?.() ?? "";
          if (!font || font.startsWith("ui://")) continue;
          if (!/\bsdf\b/i.test(font)) continue;
          const normalized = font.trim().toLowerCase();
          let resource = fontByDisplayName.get(normalized) ?? fontByFileName.get(`${normalized}.ttf`);
          if (!resource) {
            resource = doc.createFontResource(font.trim());
            resource.setId(generateId()).setPath("/font/").setFileName(`${font.trim()}.ttf`).setExported(false).setRenderMode("sdfaa").setSamplePointSize(60).setTtf(true);
            pkg.addResource(resource);
            fontByDisplayName.set(normalized, resource);
            fontByFileName.set(`${normalized}.ttf`, resource);
          }
          child.setFont?.(`ui://${pkg.getId()}${resource.getId?.() ?? ""}`);
        }
      }
    }
  }
  _initializePublishedFontTextureIds(doc) {
    for (const pkg of doc.getRoot().listPackages()) {
      const resources = pkg.listResources();
      for (const resource of resources) {
        if (resource.propertyType !== "FontResource") continue;
        if (resource.getTextureId?.()) continue;
        let found = false;
        for (const pkg2 of doc.getRoot().listPackages()) {
          for (const atlas2 of pkg2.listAtlases()) {
            for (const sprite of atlas2.listSprites()) {
              if (sprite.getItemId() === resource.getId?.()) {
                resource.setTextureId?.(resource.getId?.() ?? "");
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
        if (found) continue;
        if (resource.getTtf?.() === true) {
          const expectedFileName = syntheticFontTextureFileName(resource).toLowerCase();
          const texture = resources.find((candidate) => {
            return candidate.propertyType === "ImageResource" && sameVirtualPath(resource, candidate) && fileBaseName(resourceFileName(candidate)).toLowerCase() === expectedFileName;
          });
          if (texture?.getId?.()) resource.setTextureId?.(texture.getId());
        }
      }
    }
  }
  async _restoreAssets(doc, options, warnings) {
    for (const pkg of doc.getRoot().listPackages()) {
      await this._restoreAtlasImages(pkg, options);
      await this._writeGeneratedResources(pkg, options, warnings);
      await this._copyLooseResources(pkg, options, warnings);
      await this._copyTtfFonts(pkg, options, warnings);
    }
    await this._copyLangFiles(doc, options, warnings);
  }
  async _copyTtfFonts(pkg, options, warnings) {
    if (!this._fontDir) return;
    const fontDirEntries = await this._fs.readdir(this._fontDir).catch(() => []);
    const ttfFileMap = /* @__PURE__ */ new Map();
    for (const entry of fontDirEntries) {
      if (/\.ttf$/i.test(entry)) {
        ttfFileMap.set(entry.toLowerCase(), entry);
      }
    }
    if (ttfFileMap.size === 0) return;
    for (const resource of pkg.listResources()) {
      if (resource.propertyType !== "FontResource") continue;
      const fileName = resourceFileName(resource);
      if (!/\.ttf$/i.test(fileName)) continue;
      const match = ttfFileMap.get(fileName.toLowerCase());
      if (!match) {
        warnings.push(`TTF font file not found in fontDir for package "${pkg.getName()}": ${fileName}`);
        continue;
      }
      const sourcePath = this._fs.join(this._fontDir, match);
      const outputPath = this._resourceOutputPath(options.outputProjectPath, pkg, resource, fileName);
      await this._mkdirForFile(outputPath);
      await this._fs.writeFileRaw(outputPath, await this._fs.readFileRaw(sourcePath));
    }
  }
  async _initializeI18nSettings(doc, options) {
    if (!this._langDir) return;
    const langDirEntries = await this._fs.readdir(this._langDir).catch(() => []);
    const langFileRegex = /^fairy多语言_(.+).txt$/;
    const langFiles = [];
    const basePath = this._fs.dirname(options.outputProjectPath);
    for (const entry of langDirEntries) {
      const match = langFileRegex.exec(entry);
      if (match) {
        const absPath = this._fs.join(basePath, entry);
        langFiles.push({ name: match[1], path: absPath, fontName: "" });
      }
    }
    if (langFiles.length === 0) return;
    const settings = doc.getRoot().getSettings?.() ?? {};
    doc.getRoot().setSettings?.({
      ...settings,
      i18n: { langFiles }
    });
  }
  async _copyLangFiles(doc, options, warnings) {
    if (!this._langDir) return;
    const langDirEntries = await this._fs.readdir(this._langDir).catch(() => []);
    const langFiles = langDirEntries.filter((e) => /^fairy多语言_.+\.txt$/.test(e));
    if (langFiles.length === 0) return;
    const basePath = this._fs.dirname(options.outputProjectPath);
    for (const fileName of langFiles) {
      const sourcePath = this._fs.join(this._langDir, fileName);
      const outputPath = this._fs.join(basePath, fileName);
      await this._mkdirForFile(outputPath);
      await this._fs.writeFileRaw(outputPath, await this._fs.readFileRaw(sourcePath));
    }
  }
  async _restoreAtlasImages(pkg, options) {
    if (!options.cropImage) return;
    for (const atlas2 of pkg.listAtlases()) {
      const sourceAtlas = await this._resolveSourceFile(options.sourceDir, this._sourceFileCandidates(pkg, atlas2.getFile()));
      if (!sourceAtlas) {
        throw new Error(`Atlas image not found for package "${pkg.getName()}": ${this._sourceFileCandidates(pkg, atlas2.getFile()).join(", ")}`);
      }
      const logicalWidth = atlas2.getWidth();
      const logicalHeight = atlas2.getHeight();
      let actualWidth = logicalWidth;
      let actualHeight = logicalHeight;
      if (options.getImageSize) {
        const actualSize = await options.getImageSize(sourceAtlas);
        if (actualSize) {
          actualWidth = actualSize.width;
          actualHeight = actualSize.height;
        }
      }
      const scaleX = logicalWidth > 0 ? actualWidth / logicalWidth : 1;
      const scaleY = logicalHeight > 0 ? actualHeight / logicalHeight : 1;
      const isScaled = Math.abs(scaleX - 1) > 1e-3 || Math.abs(scaleY - 1) > 1e-3;
      let maxAtlasX = 0;
      let maxAtlasY = 0;
      for (const sp of atlas2.listSprites()) {
        const right = sp.getRectX() + sp.getRectWidth();
        const bottom = sp.getRectY() + sp.getRectHeight();
        if (right > maxAtlasX) maxAtlasX = right;
        if (bottom > maxAtlasY) maxAtlasY = bottom;
      }
      let workingAtlasPath = sourceAtlas;
      if (isScaled && options.getImageSize && options.upscaleImage) {
        const upscaleW = Math.pow(2, Math.ceil(Math.log2(logicalWidth)));
        const upscaleH = Math.pow(2, Math.ceil(Math.log2(logicalHeight)));
        console.warn('[restore] Atlas "' + atlas2.getFile() + '" scaled: logical ' + logicalWidth + "x" + logicalHeight + ", actual " + actualWidth + "x" + actualHeight + ", upscaling to " + upscaleW + "x" + upscaleH);
        workingAtlasPath = sourceAtlas + ".upscaled.png";
        await options.upscaleImage(sourceAtlas, workingAtlasPath, upscaleW, upscaleH);
      } else if (maxAtlasX > 0 && maxAtlasY > 0 && options.getImageSize && options.padImage) {
        if (actualWidth < maxAtlasX || actualHeight < maxAtlasY) {
          const padW = Math.pow(2, Math.ceil(Math.log2(maxAtlasX)));
          const padH = Math.pow(2, Math.ceil(Math.log2(maxAtlasY)));
          console.warn('[restore] Atlas "' + atlas2.getFile() + '" trimmed: ' + actualWidth + "x" + actualHeight + ", padding to " + padW + "x" + padH);
          workingAtlasPath = sourceAtlas + ".padded.png";
          await options.padImage(sourceAtlas, workingAtlasPath, padW, padH);
        }
      }
      for (const sprite of atlas2.listSprites()) {
        const image = findImageResource(pkg, sprite.getItemId());
        if (!image) continue;
        if (sprite.getRectWidth() <= 0 || sprite.getRectHeight() <= 0) {
          const origW = sprite.getOriginalWidth?.() ?? image.getWidth?.() ?? 0;
          const origH = sprite.getOriginalHeight?.() ?? image.getHeight?.() ?? 0;
          if (origW > 0 && origH > 0 && options.extractImage) {
            const placeholderPath = this._resourceOutputPath(options.outputProjectPath, pkg, image, imageFileName(image));
            await this._mkdirForFile(placeholderPath);
            try {
              const data = await options.extractImage({
                sourcePath: workingAtlasPath,
                outputPath: placeholderPath,
                left: 0,
                top: 0,
                width: 0,
                height: 0,
                rotated: false,
                offsetX: 0,
                offsetY: 0,
                expectedWidth: origW,
                expectedHeight: origH
              });
              await this._fs.writeFileRaw(placeholderPath, data);
            } catch (placeholderError) {
              console.warn('[restore] Failed to create placeholder for "' + (image.getName?.() ?? image.getItemId()) + '": ' + (placeholderError?.message ?? placeholderError));
            }
          }
          continue;
        }
        const outputPath = this._resourceOutputPath(options.outputProjectPath, pkg, image, imageFileName(image));
        const imageWidth = image.getWidth?.() ?? 0;
        const imageHeight = image.getHeight?.() ?? 0;
        const spriteWidth = sprite.getRotated() ? sprite.getRectHeight() : sprite.getRectWidth();
        const spriteHeight = sprite.getRotated() ? sprite.getRectWidth() : sprite.getRectHeight();
        await this._mkdirForFile(outputPath);
        try {
          await options.cropImage({
            sourcePath: workingAtlasPath,
            outputPath,
            left: sprite.getRectX(),
            top: sprite.getRectY(),
            width: sprite.getRectWidth(),
            height: sprite.getRectHeight(),
            rotated: sprite.getRotated(),
            offsetX: sprite.getOffsetX(),
            offsetY: sprite.getOffsetY(),
            expectedWidth: Math.max(imageWidth, sprite.getOriginalWidth(), spriteWidth),
            expectedHeight: Math.max(imageHeight, sprite.getOriginalHeight(), spriteHeight)
          });
        } catch (cropError) {
          console.warn('[restore] Skipping sprite "' + (image.getName?.() ?? image.getItemId()) + '" rect=' + sprite.getRectX() + "," + sprite.getRectY() + " " + sprite.getRectWidth() + "x" + sprite.getRectHeight() + ": " + (cropError?.message ?? cropError));
        }
      }
    }
  }
  async _copyLooseResources(pkg, options, warnings) {
    for (const resource of pkg.listResources()) {
      const syntheticLooseImage = resource.getExtras?.()?._syntheticLooseImage === true;
      if (!["SoundResource", "MiscResource", "SpineResource", "DragonBonesResource"].includes(resource.propertyType) && !syntheticLooseImage) {
        continue;
      }
      const fileName = resourceFileName(resource);
      if (!fileName) continue;
      const sourcePath = await this._resolveSourceFile(
        options.sourceDir,
        this._sourceFileCandidates(pkg, resourcePublishedFileName(resource), fileName)
      );
      if (!sourcePath) {
        warnings.push(`Loose resource not found for package "${pkg.getName()}": ${fileName}`);
        continue;
      }
      const outputPath = this._resourceOutputPath(options.outputProjectPath, pkg, resource, fileName);
      await this._mkdirForFile(outputPath);
      await this._fs.writeFileRaw(outputPath, await this._fs.readFileRaw(sourcePath));
    }
  }
  async _writeGeneratedResources(pkg, options, warnings) {
    for (const resource of pkg.listResources()) {
      if (resource.propertyType === "FontResource") {
        await this._writeFontFile(pkg, resource, options.outputProjectPath);
      } else if (resource.propertyType === "MovieClipResource") {
        await this._writeMovieClipFile(pkg, resource, options, warnings);
      }
    }
    await this._writeSyntheticFontGlyphImages(pkg, options.outputProjectPath);
  }
  async _writeFontFile(pkg, resource, outputProjectPath) {
    const fileName = resourceFileName(resource);
    if (!/\.fnt$/i.test(fileName)) return;
    const glyphs = resource.listGlyphs?.() ?? [];
    if (glyphs.length === 0) return;
    const outputPath = this._resourceOutputPath(outputProjectPath, pkg, resource, fileName);
    await this._mkdirForFile(outputPath);
    await this._fs.writeFile(outputPath, this._serializeFont(pkg, resource, glyphs));
  }
  _serializeFont(pkg, resource, glyphs) {
    const isTtf = resource.getTtf?.() === true;
    const lines = isTtf ? this._serializeTtfFontHeader(pkg, resource, glyphs) : [
      "info creator=UIBuilder",
      `common lineHeight=${resource.getLineHeight?.() ?? 0}`
    ];
    for (const glyph of glyphs) {
      const charId = fontGlyphCharId(glyph);
      if (isTtf) {
        lines.push(
          `char id=${charId} x=${glyph.getX()} y=${glyph.getY()} width=${glyph.getWidth()} height=${glyph.getHeight()} xoffset=${glyph.getXOffset()} yoffset=${glyph.getYOffset()} xadvance=${glyph.getAdvance()} page=0 chnl=${glyph.getChannel()}`
        );
      } else {
        lines.push(
          `char id=${charId} img=${glyph.getImg()} xoffset=${glyph.getXOffset()} yoffset=${glyph.getYOffset()} xadvance=${glyph.getAdvance()}`
        );
      }
    }
    return `${lines.join("\n")}
`;
  }
  _serializeTtfFontHeader(pkg, resource, glyphs) {
    const fileName = resourceFileName(resource);
    const face = stripExtension(fileName) || resource.getName?.() || "Font";
    const lineHeight = resource.getLineHeight?.() ?? 0;
    const fontSize = resource.getFontSize?.() ?? lineHeight;
    const textureId = resource.getTextureId?.() ?? "";
    const textureResource = textureId ? pkg.getResourceById(textureId) : null;
    const textureName = textureResource ? resourceFileName(textureResource) : `${face}_atlas.png`;
    const scaleW = textureResource?.getWidth?.() ?? 256;
    const scaleH = textureResource?.getHeight?.() ?? 256;
    const base = Math.max(Math.min(fontSize, lineHeight) - 6, 0);
    return [
      `info face="${face}" size=${fontSize} bold=0 italic=0 charset="" unicode=1 stretchH=100 smooth=1 aa=1 padding=0,0,0,0 spacing=1,1 outline=0`,
      `common lineHeight=${lineHeight} base=${base} scaleW=${scaleW} scaleH=${scaleH} pages=1 packed=0 alphaChnl=${resource.getTint?.() ? 1 : 0} redChnl=0 greenChnl=0 blueChnl=0`,
      `page id=0 file="${textureName}"`,
      `chars count=${glyphs.length}`
    ];
  }
  async _writeMovieClipFile(pkg, resource, options, warnings) {
    const fileName = resourceFileName(resource);
    if (!/\.jta$/i.test(fileName)) return;
    const frames = resource.listFrames?.() ?? [];
    if (frames.length === 0) return;
    if (!options.extractImage) {
      warnings.push(`MovieClip file not generated for package "${pkg.getName()}": ${fileName}`);
      return;
    }
    const sprites = await this._buildSpriteLookup(pkg, options);
    const textures = [];
    for (const [index, frame] of frames.entries()) {
      const spriteEntry = sprites.get(frame.getSpriteId());
      if (!spriteEntry) {
        warnings.push(`MovieClip frame sprite not found for package "${pkg.getName()}": ${fileName} frame ${index}`);
        return;
      }
      const sprite = spriteEntry.sprite;
      if (sprite.getRectWidth() <= 0 || sprite.getRectHeight() <= 0) {
        textures.push(new Uint8Array(0));
        continue;
      }
      textures.push(await options.extractImage({
        sourcePath: spriteEntry.sourceAtlas,
        left: sprite.getRectX(),
        top: sprite.getRectY(),
        width: sprite.getRectWidth(),
        height: sprite.getRectHeight(),
        rotated: sprite.getRotated(),
        offsetX: 0,
        offsetY: 0,
        expectedWidth: sprite.getRotated() ? sprite.getRectHeight() : sprite.getRectWidth(),
        expectedHeight: sprite.getRotated() ? sprite.getRectWidth() : sprite.getRectHeight()
      }));
    }
    const outputPath = this._resourceOutputPath(options.outputProjectPath, pkg, resource, fileName);
    await this._mkdirForFile(outputPath);
    await this._fs.writeFileRaw(outputPath, this._serializeMovieClip(resource, frames, textures));
  }
  async _writeSyntheticFontGlyphImages(pkg, outputProjectPath) {
    for (const resource of pkg.listResources()) {
      if (resource.propertyType !== "ImageResource" || !isSyntheticFontGlyphResource(resource)) continue;
      const fileName = resourceFileName(resource) || defaultSyntheticFontGlyphFileName(resource.getId?.() ?? "glyph");
      const outputPath = this._resourceOutputPath(outputProjectPath, pkg, resource, fileName);
      if (await this._fs.exists(outputPath)) continue;
      await this._mkdirForFile(outputPath);
      await this._fs.writeFileRaw(outputPath, TRANSPARENT_PNG_1X1);
    }
  }
  async _buildSpriteLookup(pkg, options) {
    const sprites = /* @__PURE__ */ new Map();
    for (const atlas2 of pkg.listAtlases()) {
      const sourceAtlas = await this._resolveSourceFile(options.sourceDir, this._sourceFileCandidates(pkg, atlas2.getFile()));
      if (!sourceAtlas) {
        throw new Error(`Atlas image not found for package "${pkg.getName()}": ${this._sourceFileCandidates(pkg, atlas2.getFile()).join(", ")}`);
      }
      for (const sprite of atlas2.listSprites()) {
        sprites.set(sprite.getItemId(), { sourceAtlas, sprite });
      }
    }
    return sprites;
  }
  _serializeMovieClip(resource, frames, textures) {
    const chunks = [
      encodeJtaUtf(JTA_FILE_MARK),
      writeInt32(JTA_VERSION),
      writeByte(0),
      writeByte(0),
      writeByte(0),
      writeByte(0),
      writeUint16(0),
      writeUint16(0),
      writeUint16(resource.getWidth?.() ?? 0),
      writeUint16(resource.getHeight?.() ?? 0),
      writeByte(jtaSpeed(resource.getInterval?.() ?? 0)),
      writeByte(scaledFrameDelay(resource.getRepeatDelay?.() ?? 0)),
      writeByte(resource.getSwing?.() ? 1 : 0),
      writeInt16(frames.length)
    ];
    for (const [index, frame] of frames.entries()) {
      chunks.push(
        writeInt16(scaledFrameDelay(frame.getAddDelay())),
        writeInt16(frame.getRectX()),
        writeInt16(frame.getRectY()),
        writeInt16(frame.getRectWidth()),
        writeInt16(frame.getRectHeight()),
        writeInt16(textures[index]?.byteLength === 0 ? -1 : index)
      );
    }
    chunks.push(writeInt16(textures.length));
    for (const texture of textures) {
      chunks.push(writeInt32(texture.byteLength), texture);
    }
    return concatBytes(chunks);
  }
  _sourceFileCandidates(pkg, fileName, outputFileName = fileName) {
    const publishName = pkg.getPublishName() || pkg.getName();
    return Array.from(/* @__PURE__ */ new Set([
      `${publishName}_${fileName}`,
      fileName,
      `${publishName}_${outputFileName}`,
      outputFileName
    ]));
  }
  async _resolveLooseSourceFile(pkg, sourceDir, outputFileName) {
    const candidates = outputFileName.endsWith(".atlas") ? this._sourceFileCandidates(pkg, `${outputFileName}.txt`, outputFileName) : outputFileName.endsWith(".skel") ? this._sourceFileCandidates(pkg, `${outputFileName}.bytes`, outputFileName) : this._sourceFileCandidates(pkg, outputFileName);
    return this._resolveSourceFile(sourceDir, candidates);
  }
  async _resolveSourceFile(sourceDir, candidates) {
    const allDirs = [sourceDir, ...this._sourceDirs.filter((d) => d !== sourceDir)];
    for (const dir of allDirs) {
      for (const candidate of candidates) {
        const sourcePath = this._fs.join(dir, candidate);
        if (await this._fs.isFile(sourcePath)) return sourcePath;
      }
    }
    return null;
  }
  _resourceOutputPath(outputProjectPath, pkg, resource, fileName) {
    const basePath = this._fs.dirname(outputProjectPath);
    const branch = resource.getBranch?.() ?? "";
    const assetsDir = branch ? `assets_${branch}` : "assets";
    const virtualPath = normalizeVirtualPath(resource.getPath?.());
    const pkgDir = this._fs.join(basePath, assetsDir, pkg.getName());
    return virtualPath ? this._fs.join(pkgDir, virtualPath, fileName) : this._fs.join(pkgDir, fileName);
  }
  async _mkdirForFile(filePath) {
    await this._fs.mkdir(this._fs.dirname(filePath));
  }
};

// packages/functions/src/publish.ts
var UNITY_PROJECT_TYPE = 0 /* Unity */;
var COCOS_CREATOR_PROJECT_TYPE = 3 /* CocosCreator */;
function resolveDefaultPublishFileExtension(projectType, publishSettings) {
  if (projectType === UNITY_PROJECT_TYPE) {
    return "bytes";
  }
  if (projectType === COCOS_CREATOR_PROJECT_TYPE) {
    return publishSettings.fileExtension || "bin";
  }
  return publishSettings.fileExtension || "fui";
}
function resolvePublishAtlasRuntimeOptions(fileExtension) {
  return {
    preserveInputOrderOnTie: fileExtension === "fui",
    directSingleImageOutput: fileExtension === "bytes"
  };
}
function resolvePublishFileName(publishName, fileExtension) {
  if (fileExtension === "bytes") {
    return `${publishName}_fui.bytes`;
  }
  return `${publishName}.${fileExtension}`;
}
function resolvePublishOptions(doc, overrides = {}) {
  const root = doc.getRoot();
  const settings = root.getSettings?.() ?? {};
  const publishSettings = settings.publish ?? {};
  const atlasSetting = publishSettings.atlasSetting ?? {};
  const projectType = root.getProjectType();
  const fileExtension = overrides.fileExtension ?? resolveDefaultPublishFileExtension(projectType, publishSettings);
  let compressed = overrides.compressed ?? publishSettings.compressDesc ?? false;
  if (projectType === UNITY_PROJECT_TYPE) {
    compressed = overrides.compressed ?? false;
  }
  const atlasOptions = {
    maxSize: overrides.atlas?.maxSize ?? atlasSetting.maxSize ?? 2048,
    fast: overrides.atlas?.fast ?? atlasSetting.fast ?? true,
    allowRotation: overrides.atlas?.allowRotation ?? atlasSetting.allowRotation ?? false,
    padding: overrides.atlas?.padding ?? atlasSetting.padding ?? 2,
    powerOfTwo: overrides.atlas?.powerOfTwo ?? atlasSetting.sizeOption === "pot",
    square: overrides.atlas?.square ?? atlasSetting.forceSquare ?? false,
    multiPage: overrides.atlas?.multiPage ?? atlasSetting.paging ?? true,
    trimImage: overrides.atlas?.trimImage ?? atlasSetting.trimImage ?? false,
    extractAlpha: overrides.atlas?.extractAlpha ?? atlasSetting.extractAlpha ?? false
  };
  return {
    compressed,
    fileExtension,
    packages: overrides.packages,
    atlas: atlasOptions
  };
}
function dirname4(filePath) {
  const trimmed = filePath.replace(/[/\\]+$/, "");
  const match = trimmed.match(/^(.*)[/\\][^/\\]+$/);
  return match?.[1] ?? "";
}
function createUnsupportedFsOperation(name) {
  return async () => {
    throw new Error(`publish: FileSystem.${name}() is not available in the publish writer adapter.`);
  };
}
function toBinaryWriterFileSystem(fs3) {
  return {
    readFile: createUnsupportedFsOperation("readFile"),
    readFileRaw: createUnsupportedFsOperation("readFileRaw"),
    writeFile: createUnsupportedFsOperation("writeFile"),
    writeFileRaw: fs3.writeFileRaw,
    mkdir: fs3.mkdir,
    readdir: createUnsupportedFsOperation("readdir"),
    exists: createUnsupportedFsOperation("exists"),
    join: fs3.join,
    dirname: dirname4
  };
}
function isComponentResource2(resource) {
  return resource.propertyType === "Component";
}
function isImageResource2(resource) {
  return resource.propertyType === "ImageResource";
}
function isMovieClipResource2(resource) {
  return resource.propertyType === "MovieClipResource";
}
function isMiscResource(resource) {
  return resource.propertyType === "MiscResource";
}
function isFontResource2(resource) {
  return resource.propertyType === "FontResource";
}
function isSoundResource(resource) {
  return resource.propertyType === "SoundResource";
}
function isSpineResource(resource) {
  return resource.propertyType === "SpineResource";
}
function isDragonBonesResource(resource) {
  return resource.propertyType === "DragonBonesResource";
}
function isSkeletonResource2(resource) {
  return isSpineResource(resource) || isDragonBonesResource(resource);
}
function addLocalUiResourceRef(target, pkgId, value) {
  if (!value || typeof value !== "string" || !value.startsWith(`ui://${pkgId}`) || value.length <= 13) return;
  target.add(value.slice(13));
}
function addLocalUiResourceRefsFromText(target, pkgId, value) {
  if (!value || typeof value !== "string") return;
  const prefix = `ui://${pkgId}`;
  let index = value.indexOf(prefix);
  while (index !== -1) {
    const start = index + prefix.length;
    let end = start;
    while (end < value.length && /[0-9a-z]/i.test(value[end] ?? "")) end++;
    if (end > start) target.add(value.slice(start, end));
    index = value.indexOf(prefix, end);
  }
}
function addLocalUiResourceRefsFromUnknown(target, pkgId, value) {
  if (Array.isArray(value)) {
    for (const entry of value) addLocalUiResourceRefsFromUnknown(target, pkgId, entry);
    return;
  }
  if (typeof value === "string") {
    addLocalUiResourceRef(target, pkgId, value);
    addLocalUiResourceRefsFromText(target, pkgId, value);
  }
}
function addLocalFontRef(target, pkgId, value) {
  if (Array.isArray(value)) {
    for (const entry of value) addLocalUiResourceRef(target, pkgId, entry);
    return;
  }
  addLocalUiResourceRef(target, pkgId, value ?? void 0);
}
function resolvePackageAssetsBasePath(basePath, resource) {
  const branchName = resource?.getBranch?.() ?? "";
  if (!branchName) return basePath;
  const normalized = basePath.replace(/[/\\]+$/, "");
  if (/[\\/]assets$/i.test(normalized)) {
    return normalized.replace(/([\\/])assets$/i, `$1assets_${branchName}`);
  }
  return `${normalized}_${branchName}`;
}
function resolveImagePath(resource, pkg, basePath) {
  const fileName = resolveImageFileName2(resource);
  const resourcePath = resource.getPath() ?? "/";
  const packageBasePath = resolvePackageAssetsBasePath(basePath, resource);
  return `${packageBasePath}/${pkg.getName()}${resourcePath}${fileName}`;
}
function resolveImageFileName2(resource) {
  const extras = resource.getExtras() ?? {};
  return resource.getFileName() || extras._fileName || resource.getName();
}
function resolveSoundPath(resource, pkg, basePath) {
  const resourcePath = resource.getPath() ?? "/";
  const packageBasePath = resolvePackageAssetsBasePath(basePath, resource);
  return `${packageBasePath}/${pkg.getName()}${resourcePath}${resource.getFile()}`;
}
function resolveGenericResourcePath(resource, pkg, basePath) {
  const resourcePath = resource.getPath() ?? "/";
  const packageBasePath = resolvePackageAssetsBasePath(basePath, resource);
  return `${packageBasePath}/${pkg.getName()}${resourcePath}${resource.getFile()}`;
}
function extname(fileName) {
  const normalized = fileName.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  const lastDot = normalized.lastIndexOf(".");
  if (lastDot <= lastSlash) return "";
  return normalized.slice(lastDot);
}
function resolvePublishedMiscFileName(resource) {
  const file = resource.getFile();
  if (file.toLowerCase().endsWith(".atlas")) return `${file}.txt`;
  return file;
}
function resolvePublishedSkeletonFileName(resource) {
  if (isSpineResource(resource) && resource.getFile().toLowerCase().endsWith(".skel")) {
    return `${resource.getFile()}.bytes`;
  }
  return resource.getFile();
}
function setPublishedFileExtra(resource, fileName) {
  const extras = resource.getExtras() ?? {};
  resource.setExtras({
    ...extras,
    _publishedFile: fileName
  });
}
function setPublishedIdExtra(resource, effectiveId) {
  const extras = resource.getExtras() ?? {};
  if (!effectiveId || effectiveId === resource.getId()) {
    if (!("_publishedId" in extras)) return;
    const { _publishedId: _ignored, ...rest } = extras;
    resource.setExtras(rest);
    return;
  }
  resource.setExtras({
    ...extras,
    _publishedId: effectiveId
  });
}
function getPublishedId(resource) {
  const extras = resource.getExtras() ?? {};
  return extras._publishedId ?? resource.getId();
}
function getBranchName(resource) {
  return resource?.getBranch?.() ?? "";
}
function buildBranchResourceKey2(resource) {
  return `${resource.propertyType}|${resource.getPath() ?? ""}|${resource.getName() ?? ""}`;
}
function collectPackagePublishContext(pkg, options) {
  const pkgId = pkg.getId();
  const resources = pkg.listResources();
  const resourceMap = new Map(resources.map((resource) => [resource.getId(), resource]));
  const referencedIds = /* @__PURE__ */ new Set();
  const pixelHitTestImageIds = /* @__PURE__ */ new Set();
  const spriteItemIds = /* @__PURE__ */ new Set();
  for (const atlas2 of pkg.listAtlases()) {
    for (const sprite of atlas2.listSprites()) {
      spriteItemIds.add(sprite.getItemId());
    }
  }
  for (const resource of resources) {
    if (!isComponentResource2(resource)) continue;
    const component = resource;
    const children = component.listChildren();
    const childMap = new Map(children.map((child) => [child.getId?.() ?? "", child]));
    const hitTest = component.getHitTest?.()?.trim();
    if (hitTest && !hitTest.includes(",")) {
      const targetChild = childMap.get(hitTest);
      const sourceId = targetChild?.getSrc?.();
      if (sourceId) {
        const sourceResource = resourceMap.get(sourceId);
        if (sourceResource && isImageResource2(sourceResource)) {
          pixelHitTestImageIds.add(sourceId);
        }
      }
    }
    for (const child of children) {
      const src = child.getSrc?.();
      if (src) referencedIds.add(src);
      addLocalFontRef(referencedIds, pkgId, child.getFont?.());
      addLocalUiResourceRefsFromText(referencedIds, pkgId, child.getText?.());
      for (const ref of [
        child.getUrl?.(),
        child.getDefaultItem?.(),
        child.getIcon?.(),
        child.getSelectedIcon?.(),
        child.getDropdown?.(),
        child.getSound?.(),
        child.getInstanceIcon?.(),
        child.getInstanceSelectedIcon?.(),
        child.getVtScrollBarRes?.(),
        child.getHzScrollBarRes?.(),
        child.getHeaderRes?.(),
        child.getFooterRes?.()
      ]) {
        addLocalUiResourceRef(referencedIds, pkgId, ref);
      }
      for (const item of child.getInstanceComboItems?.() ?? []) {
        addLocalUiResourceRef(referencedIds, pkgId, item.icon ?? void 0);
      }
      for (const item of child.getListItems?.() ?? []) {
        addLocalUiResourceRef(referencedIds, pkgId, item.icon ?? void 0);
        addLocalUiResourceRef(referencedIds, pkgId, item.url ?? void 0);
      }
      for (const gear of child.listGears?.() ?? []) {
        addLocalUiResourceRefsFromUnknown(referencedIds, pkgId, gear.getValues?.());
        addLocalUiResourceRefsFromUnknown(referencedIds, pkgId, gear.getDefaultValue?.());
      }
    }
    addLocalFontRef(referencedIds, pkgId, component.getFont?.());
    for (const ref of [
      component.getDropdown?.(),
      component.getHeaderRes?.(),
      component.getFooterRes?.(),
      component.getVtScrollBarRes?.(),
      component.getHzScrollBarRes?.(),
      component.getSound?.()
    ]) {
      addLocalUiResourceRef(referencedIds, pkgId, ref);
    }
    for (const transition of component.listTransitions?.() ?? []) {
      for (const item of transition.listItems?.() ?? []) {
        addLocalUiResourceRefsFromUnknown(referencedIds, pkgId, item.getStartValue?.());
        addLocalUiResourceRefsFromUnknown(referencedIds, pkgId, item.getEndValue?.());
      }
    }
  }
  for (const resource of resources) {
    if (isFontResource2(resource)) {
      const textureId = resource.getTextureId?.() ?? "";
      if (textureId) referencedIds.add(textureId);
    }
  }
  const publishedResourceIds = new Set(spriteItemIds);
  for (const resource of resources) {
    const resourceId = resource.getId();
    if (!resourceId) continue;
    if (isComponentResource2(resource)) {
      if (resource.getExported() || referencedIds.has(resourceId)) {
        publishedResourceIds.add(resourceId);
      }
      continue;
    }
    if (isImageResource2(resource)) {
      if (resource.getExported() || referencedIds.has(resourceId) || spriteItemIds.has(resourceId) || pixelHitTestImageIds.has(resourceId)) {
        publishedResourceIds.add(resourceId);
      }
      continue;
    }
    if (isMovieClipResource2(resource) || isSoundResource(resource)) {
      if (resource.getExported() || referencedIds.has(resourceId)) publishedResourceIds.add(resourceId);
      continue;
    }
    if (isMiscResource(resource) || isSkeletonResource2(resource)) {
      if (resource.getExported() || referencedIds.has(resourceId)) publishedResourceIds.add(resourceId);
      continue;
    }
    if (isFontResource2(resource)) {
      if (resource.getExported() || referencedIds.has(resourceId)) {
        publishedResourceIds.add(resourceId);
      }
      continue;
    }
    const genericResource = resource;
    if (genericResource.getExported() || referencedIds.has(resourceId)) {
      publishedResourceIds.add(resourceId);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const resource of resources) {
      if (!isSkeletonResource2(resource)) continue;
      if (!publishedResourceIds.has(resource.getId())) continue;
      for (const requiredId of resource.getRequireIds()) {
        if (!requiredId || publishedResourceIds.has(requiredId)) continue;
        publishedResourceIds.add(requiredId);
        changed = true;
      }
    }
  }
  if (!options.includeBranches) {
    const mainByKey = /* @__PURE__ */ new Map();
    const activeBranchByKey = /* @__PURE__ */ new Map();
    for (const resource of resources) {
      const branchName = getBranchName(resource);
      const key = buildBranchResourceKey2(resource);
      if (!branchName) {
        mainByKey.set(key, resource);
      } else if (branchName === options.activeBranch) {
        activeBranchByKey.set(key, resource);
      }
    }
    const mergedPublishedResourceIds = /* @__PURE__ */ new Set();
    const effectiveResourceIds = /* @__PURE__ */ new Map();
    for (const resource of resources) {
      const resourceId = resource.getId();
      if (!publishedResourceIds.has(resourceId)) continue;
      const branchName = getBranchName(resource);
      const key = buildBranchResourceKey2(resource);
      if (branchName) {
        if (branchName !== options.activeBranch) continue;
        const mainResource = mainByKey.get(key);
        mergedPublishedResourceIds.add(resourceId);
        effectiveResourceIds.set(resourceId, mainResource?.getId() ?? resourceId);
        continue;
      }
      const override = activeBranchByKey.get(key);
      if (override) {
        mergedPublishedResourceIds.add(override.getId());
        effectiveResourceIds.set(override.getId(), resourceId);
        continue;
      }
      mergedPublishedResourceIds.add(resourceId);
      effectiveResourceIds.set(resourceId, resourceId);
    }
    publishedResourceIds.clear();
    for (const resourceId of mergedPublishedResourceIds) {
      publishedResourceIds.add(resourceId);
    }
    const mergedPixelHitTestImageIds = /* @__PURE__ */ new Set();
    for (const resource of resources) {
      if (!isImageResource2(resource)) continue;
      const resourceId = resource.getId();
      if (!publishedResourceIds.has(resourceId)) continue;
      const effectiveId = effectiveResourceIds.get(resourceId) ?? resourceId;
      if (pixelHitTestImageIds.has(effectiveId)) {
        mergedPixelHitTestImageIds.add(resourceId);
      }
    }
    pixelHitTestImageIds.clear();
    for (const resourceId of mergedPixelHitTestImageIds) {
      pixelHitTestImageIds.add(resourceId);
    }
    return {
      referencedIds,
      publishedResourceIds,
      pixelHitTestImageIds,
      effectiveResourceIds,
      includeBranches: false
    };
  }
  return {
    referencedIds,
    publishedResourceIds,
    pixelHitTestImageIds,
    effectiveResourceIds: new Map([...publishedResourceIds].map((resourceId) => [resourceId, resourceId])),
    includeBranches: true
  };
}
async function applyPixelHitTests(pkg, imageIds, basePath, encoder) {
  const images = pkg.listImageResources();
  for (const image of images) {
    image.setPixelHitTestData(null);
  }
  if (!basePath || !encoder || imageIds.size === 0) return;
  for (const image of images) {
    const imageId = image.getId();
    if (!imageIds.has(imageId)) continue;
    try {
      const sourcePath = resolveImagePath(image, pkg, basePath);
      const metadata = await encoder(sourcePath).metadata();
      if (!metadata.width || !metadata.height) continue;
      const resizedWidth = Math.max(1, Math.floor(metadata.width / 2));
      const resizedHeight = Math.max(1, Math.floor(metadata.height / 2));
      const { data, info } = await encoder(sourcePath).ensureAlpha().resize({
        width: resizedWidth,
        height: resizedHeight,
        fit: "fill"
      }).raw().toBuffer({ resolveWithObject: true });
      const pixelCount = info.width * info.height;
      const maskBytes = new Uint8Array(Math.ceil(pixelCount / 8));
      let byteValue = 0;
      let bitIndex = 0;
      let maskIndex = 0;
      for (let pixel = 0; pixel < pixelCount; pixel++) {
        const alpha = data[pixel * info.channels + 3];
        if (alpha > 10) byteValue |= 1 << bitIndex;
        bitIndex++;
        if (bitIndex === 8) {
          maskBytes[maskIndex++] = byteValue;
          bitIndex = 0;
          byteValue = 0;
        }
      }
      if (bitIndex !== 0) {
        maskBytes[maskIndex] = byteValue;
      }
      image.setPixelHitTestData({
        pixelWidth: info.width,
        scaleDenominator: 2,
        pixels: maskBytes
      });
    } catch {
      image.setPixelHitTestData(null);
    }
  }
}
async function annotatePackagePublishArtifacts(pkg, basePath, encoder, options) {
  const { publishedResourceIds, pixelHitTestImageIds, effectiveResourceIds, includeBranches } = collectPackagePublishContext(pkg, options);
  for (const resource of pkg.listResources()) {
    setPublishedIdExtra(resource, effectiveResourceIds.get(resource.getId()) ?? null);
  }
  await applyPixelHitTests(pkg, pixelHitTestImageIds, basePath, encoder);
  const extras = pkg.getExtras() ?? {};
  pkg.setExtras({
    ...extras,
    publishedResourceIds: [...publishedResourceIds].sort((a, b) => a.localeCompare(b)),
    publishedIncludeBranches: includeBranches,
    publishedEffectiveResourceIds: Object.fromEntries(effectiveResourceIds)
  });
  for (const resource of pkg.listResources()) {
    if (isMiscResource(resource)) {
      setPublishedFileExtra(resource, resolvePublishedMiscFileName(resource));
      continue;
    }
    if (isSkeletonResource2(resource)) {
      setPublishedFileExtra(resource, resolvePublishedSkeletonFileName(resource));
    }
  }
}
function getAnnotatedPublishedResourceIds(pkg) {
  const extras = pkg.getExtras() ?? {};
  return new Set(extras.publishedResourceIds ?? []);
}
function getPublishedSkeletonDependencyImageIds(pkg, publishedResourceIds) {
  const imageIds = /* @__PURE__ */ new Set();
  const resourcesById = new Map(pkg.listResources().map((resource) => [resource.getId(), resource]));
  for (const resource of pkg.listResources()) {
    if (!isSkeletonResource2(resource)) continue;
    if (!publishedResourceIds.has(resource.getId())) continue;
    for (const requiredId of resource.getRequireIds()) {
      if (!requiredId) continue;
      const required = resourcesById.get(requiredId);
      if (required && isImageResource2(required)) imageIds.add(requiredId);
    }
  }
  return imageIds;
}
async function exportPackageSounds(pkg, outputDir, basePath, fs3, readFileRaw, logger) {
  const publishedResourceIds = getAnnotatedPublishedResourceIds(pkg);
  if (publishedResourceIds.size === 0) return;
  if (!basePath || !readFileRaw) {
    const hasPublishedSound = pkg.listResources().some((resource) => {
      return isSoundResource(resource) && publishedResourceIds.has(resource.getId());
    });
    if (hasPublishedSound) {
      logger.warn(`publish: Sound resources in package "${pkg.getName()}" were not exported because basePath/readFileRaw is unavailable.`);
    }
    return;
  }
  for (const resource of pkg.listResources()) {
    if (!isSoundResource(resource)) continue;
    if (!publishedResourceIds.has(resource.getId())) continue;
    const sourcePath = resolveSoundPath(resource, pkg, basePath);
    const targetName = `${pkg.getPublishName() || pkg.getName()}_${getPublishedId(resource)}${extname(resource.getFile() || "")}`;
    const targetPath = fs3.join(outputDir, targetName);
    try {
      const data = await readFileRaw(sourcePath);
      await fs3.writeFileRaw(targetPath, data);
    } catch {
      logger.warn(`publish: Could not export sound "${resource.getId()}" from package "${pkg.getName()}".`);
    }
  }
}
async function exportPackageExternalResources(pkg, outputDir, basePath, fs3, readFileRaw, logger) {
  const publishedResourceIds = getAnnotatedPublishedResourceIds(pkg);
  const skeletonDependencyImageIds = getPublishedSkeletonDependencyImageIds(pkg, publishedResourceIds);
  if (publishedResourceIds.size === 0) return;
  if (!basePath || !readFileRaw) {
    const hasPublishedExternal = pkg.listResources().some((resource) => {
      return (isMiscResource(resource) || isSkeletonResource2(resource)) && publishedResourceIds.has(resource.getId()) || skeletonDependencyImageIds.has(resource.getId());
    });
    if (hasPublishedExternal) {
      logger.warn(`publish: External resources in package "${pkg.getName()}" were not exported because basePath/readFileRaw is unavailable.`);
    }
    return;
  }
  for (const resource of pkg.listResources()) {
    const resourceId = resource.getId();
    const isSkeletonExternal = publishedResourceIds.has(resourceId) && (isMiscResource(resource) || isSkeletonResource2(resource));
    const isSkeletonImageDependency = skeletonDependencyImageIds.has(resourceId) && isImageResource2(resource);
    if (!isSkeletonExternal && !isSkeletonImageDependency) continue;
    let sourcePath;
    let targetName;
    if (isSkeletonImageDependency) {
      sourcePath = resolveImagePath(resource, pkg, basePath);
      targetName = resolveImageFileName2(resource);
    } else if (isMiscResource(resource) || isSkeletonResource2(resource)) {
      sourcePath = resolveGenericResourcePath(resource, pkg, basePath);
      targetName = (resource.getExtras() ?? {})._publishedFile ?? resource.getFile();
    } else {
      continue;
    }
    const targetPath = fs3.join(outputDir, targetName);
    try {
      const data = await readFileRaw(sourcePath);
      await fs3.writeFileRaw(targetPath, data);
    } catch {
      logger.warn(`publish: Could not export external resource "${resource.getId()}" from package "${pkg.getName()}".`);
    }
  }
}
function publish(options) {
  return createTransform("publish", async (doc) => {
    const root = doc.getRoot();
    const logger = doc.getLogger();
    const settings = root.getSettings?.() ?? {};
    const publishSettings = settings.publish ?? {};
    const resolved = resolvePublishOptions(doc, {
      compressed: options.compressed,
      fileExtension: options.fileExtension,
      packages: options.packages,
      atlas: options.atlas
    });
    const ext = resolved.fileExtension;
    let allPackages = root.listPackages();
    if (resolved.packages && resolved.packages.length > 0) {
      const names = new Set(resolved.packages);
      allPackages = allPackages.filter((p) => names.has(p.getName()));
    }
    if (allPackages.length === 0) {
      logger.warn("publish: No packages to publish.");
      return;
    }
    const branchProcessing = publishSettings.branchProcessing ?? 0;
    const includeBranches = branchProcessing === 0;
    const activeBranch = includeBranches ? "" : options.branch ?? "";
    const atlasRuntimeOptions = resolvePublishAtlasRuntimeOptions(ext);
    const allDocPackages = root.listPackages();
    const pkgMap = /* @__PURE__ */ new Map();
    for (const p of allDocPackages) {
      pkgMap.set(p.getId(), p);
    }
    for (const pkg of allPackages) {
      _computeDependencies(pkg, pkgMap);
      await annotatePackagePublishArtifacts(
        pkg,
        options.basePath,
        options.encoder,
        {
          includeBranches,
          activeBranch
        }
      );
    }
    const atlasOpts = {
      ...resolved.atlas,
      ...options.atlas ?? {},
      separatedAtlasForBranch: includeBranches && publishSettings.seperatedAtlasForBranch === true,
      encoder: options.encoder,
      basePath: options.basePath,
      outputPath: options.fs ? options.output : void 0,
      mkdir: options.fs ? options.fs.mkdir : void 0,
      readFileRaw: options.atlas?.readFileRaw ?? options.fs?.readFileRaw,
      ...atlasRuntimeOptions
    };
    if (!options.skipAtlas) {
      await atlas(atlasOpts)(doc);
    } else {
      logger.info("publish: Skipping atlas packing (--no-atlas).");
    }
    if (!options.fs) {
      logger.info(`publish: No fs provided \u2014 layout computed for ${allPackages.length} package(s), skipping file output.`);
      return;
    }
    await options.fs.mkdir(options.output);
    const writerFs = toBinaryWriterFileSystem(options.fs);
    for (const pkg of allPackages) {
      const pkgIndex = allDocPackages.indexOf(pkg);
      const publishName = pkg.getPublishName() || pkg.getName();
      const fileName = resolvePublishFileName(publishName, ext);
      const filePath = options.fs.join(options.output, fileName);
      const bwOptions = {
        compressed: resolved.compressed,
        packageIndex: pkgIndex
      };
      const bw = new BinaryWriter(writerFs);
      await bw.write(doc, filePath, bwOptions);
      await exportPackageSounds(
        pkg,
        options.output,
        options.basePath,
        options.fs,
        options.atlas?.readFileRaw ?? options.fs.readFileRaw,
        logger
      );
      await exportPackageExternalResources(
        pkg,
        options.output,
        options.basePath,
        options.fs,
        options.atlas?.readFileRaw ?? options.fs.readFileRaw,
        logger
      );
      logger.info(`publish: Written ${fileName}`);
    }
    await publishCodeGeneration(doc, {
      basePath: options.basePath,
      fs: options.fs,
      packages: allPackages
    });
    logger.info(`publish: Published ${allPackages.length} package(s) to ${options.output}`);
  });
}
function _computeDependencies(pkg, pkgMap) {
  const referencedPkgIds = /* @__PURE__ */ new Set();
  function scanFontUrl(font) {
    if (!font) return;
    const fontStr = Array.isArray(font) ? font[0] : String(font);
    if (typeof fontStr !== "string" || !fontStr.startsWith("ui://")) return;
    const rest = fontStr.slice(5);
    if (rest.length >= 8) {
      const depPkgId = rest.slice(0, 8);
      if (depPkgId !== pkg.getId()) referencedPkgIds.add(depPkgId);
    }
  }
  for (const res of pkg.listResources()) {
    if (res.propertyType !== "Component") continue;
    for (const child of res.listChildren?.() ?? []) {
      scanFontUrl(child.getFont?.());
    }
  }
  for (const dep of pkg.listDependencies()) {
    pkg.removeDependency(dep);
  }
  if (referencedPkgIds.size > 0) {
    const sortedIds = [...referencedPkgIds].sort((a, b) => a.localeCompare(b));
    for (const refId of sortedIds) {
      const depPkg = pkgMap.get(refId);
      if (depPkg) {
        pkg.addDependency(depPkg);
      }
    }
  }
}

// packages/cli/src/cli.ts
import fs2 from "node:fs/promises";
import path2 from "node:path";
import { parseArgs } from "node:util";
var HELP = `
ofgui \u2014 FairyGUI Headless Authoring CLI

Alias:
  openfairygui

Commands:
  inspect <project-dir>                          Show project contents report
  publish <project-dir> --output <dir> [options]  Publish project to binary outputs and configured generated code
  restore <release-dir> --output <dir> [options]  Restore a FairyGUI project from published binaries
  list-fonts <release-dir> [options]              List TTF fonts needed by published binaries

Publish options:
  --output, -o <dir>     Output directory (required)
  --compressed           Compress binary data (overrides project setting)
  --packages <a,b,c>     Only publish specific packages (comma-separated)
  --branch <name>        Active branch used by "\u4E3B\u5E72\u5408\u5E76\u6D3B\u8DC3\u5206\u652F"; omit for main branch
  --project-type <name|id>  Override project type (for example: unity, layabox, cocoscreator, 0, 4, 3)
  --max-atlas-size <n>    Override max atlas texture size (default: from project settings or 2048)
  --no-atlas             Skip atlas packing (only output .fui binary, no atlas PNGs)

Restore options:
  --output, -o <dir>     Output project directory (required)
  --packages <a,b,c>     Only restore specific packages (comma-separated)
  --force                Overwrite a non-empty output directory
  --project-type <name|id>  Override restored project type; default is unity
  --font-dir <dir>       Directory containing .ttf font files to copy into the restored project
  --lang-dir <dir>       Directory containing localization txt files to copy into the restored project

Options:
  --help, -h     Show this help
  --version, -v  Show version

Input can be a .fairy file or a project root directory (auto-discovers .fairy file).
File extension and binary format are read from project settings.
`;
async function resolveFairyPath(input) {
  const resolved = path2.resolve(input);
  const stat = await fs2.stat(resolved);
  if (stat.isFile() && resolved.endsWith(".fairy")) {
    return resolved;
  }
  if (stat.isDirectory()) {
    const entries = await fs2.readdir(resolved);
    const fairyFiles = entries.filter((e) => e.endsWith(".fairy"));
    if (fairyFiles.length === 1) {
      return path2.join(resolved, fairyFiles[0]);
    }
    if (fairyFiles.length > 1) {
      throw new Error(`Multiple .fairy files found in ${resolved}: ${fairyFiles.join(", ")}. Please specify one.`);
    }
    throw new Error(`No .fairy file found in ${resolved}`);
  }
  throw new Error(`Input is not a .fairy file or directory: ${resolved}`);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP);
    return;
  }
  if (args.includes("--version") || args.includes("-v")) {
    console.log("0.1.0");
    return;
  }
  const command = args[0];
  const rest = args.slice(1);
  switch (command) {
    case "inspect":
      await cmdInspect(rest);
      break;
    case "publish":
      await cmdPublish(rest);
      break;
    case "restore":
      await cmdRestore(rest);
      break;
    case "list-fonts":
      await cmdListFonts(rest);
      break;
    default:
      console.error(`Unknown command: ${command}
`);
      console.log(HELP);
      process.exit(1);
  }
}
function createNodeRestoreFs() {
  return {
    async readFile(filePath) {
      return fs2.readFile(filePath, "utf-8");
    },
    async readFileRaw(filePath) {
      const buf = await fs2.readFile(filePath);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    },
    async writeFile(filePath, content) {
      await fs2.mkdir(path2.dirname(filePath), { recursive: true });
      await fs2.writeFile(filePath, content, "utf-8");
    },
    async writeFileRaw(filePath, data) {
      await fs2.mkdir(path2.dirname(filePath), { recursive: true });
      await fs2.writeFile(filePath, data);
    },
    async mkdir(dirPath) {
      await fs2.mkdir(dirPath, { recursive: true });
    },
    async readdir(dirPath) {
      return fs2.readdir(dirPath);
    },
    async exists(filePath) {
      try {
        await fs2.access(filePath);
        return true;
      } catch {
        return false;
      }
    },
    async isFile(filePath) {
      try {
        return (await fs2.stat(filePath)).isFile();
      } catch {
        return false;
      }
    },
    async resolvePath(filePath) {
      try {
        return await fs2.realpath(filePath);
      } catch {
        return path2.resolve(filePath);
      }
    },
    async rm(targetPath, options) {
      await fs2.rm(targetPath, { recursive: options?.recursive ?? false, force: options?.force ?? false });
    },
    join(...paths) {
      return path2.join(...paths);
    },
    dirname(filePath) {
      return path2.dirname(filePath);
    }
  };
}
async function createRestoreImageProcessors() {
  let sharp;
  try {
    const mod = await import("sharp");
    sharp = mod.default ?? mod;
  } catch {
    throw new Error("restore: sharp is required to crop atlas images. Install it with: pnpm add sharp");
  }
  async function extractImage(input) {
    const targetPath = input.outputPath ?? input.sourcePath;
    let image = sharp(input.sourcePath).extract({
      left: input.left,
      top: input.top,
      width: input.width,
      height: input.height
    });
    if (input.rotated) image = image.rotate(90);
    const { data, info } = await image.png().toBuffer({ resolveWithObject: true });
    const needsOriginalCanvas = input.expectedWidth > 0 && input.expectedHeight > 0 && (input.offsetX !== 0 || input.offsetY !== 0 || info.width !== input.expectedWidth || info.height !== input.expectedHeight);
    if (needsOriginalCanvas) {
      if (input.offsetX < 0 || input.offsetY < 0 || input.offsetX + info.width > input.expectedWidth || input.offsetY + info.height > input.expectedHeight) {
        throw new Error(
          `restore: Cropped image does not fit original canvas for ${targetPath}: crop ${info.width}x${info.height} at ${input.offsetX},${input.offsetY}, canvas ${input.expectedWidth}x${input.expectedHeight}`
        );
      }
      const composed = await sharp({
        create: {
          width: input.expectedWidth,
          height: input.expectedHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      }).composite([{ input: data, left: input.offsetX, top: input.offsetY }]).png().toBuffer({ resolveWithObject: true });
      if (input.expectedWidth > 0 && input.expectedHeight > 0 && (composed.info.width !== input.expectedWidth || composed.info.height !== input.expectedHeight)) {
        throw new Error(
          `restore: Cropped image size mismatch for ${targetPath}: expected ${input.expectedWidth}x${input.expectedHeight}, got ${composed.info.width}x${composed.info.height}`
        );
      }
      return composed.data;
    }
    if (input.expectedWidth > 0 && input.expectedHeight > 0 && (info.width !== input.expectedWidth || info.height !== input.expectedHeight)) {
      throw new Error(
        `restore: Cropped image size mismatch for ${targetPath}: expected ${input.expectedWidth}x${input.expectedHeight}, got ${info.width}x${info.height}`
      );
    }
    return data;
  }
  return {
    extractImage,
    cropImage: async (input) => {
      await fs2.mkdir(path2.dirname(input.outputPath), { recursive: true });
      await fs2.writeFile(input.outputPath, await extractImage(input));
    },
    getImageSize: async (filePath) => {
      try {
        const meta = await sharp(filePath).metadata();
        return meta.width && meta.height ? { width: meta.width, height: meta.height } : null;
      } catch {
        return null;
      }
    },
    padImage: async (sourcePath, outputPath, width, height) => {
      const meta = await sharp(sourcePath).metadata();
      const origW = meta.width ?? 0;
      const origH = meta.height ?? 0;
      await sharp(sourcePath).extend({
        top: 0,
        left: 0,
        right: width - origW,
        bottom: height - origH,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }).png().toFile(outputPath);
    },
    upscaleImage: async (sourcePath, outputPath, width, height) => {
      await sharp(sourcePath, { limitInputPixels: false }).resize(width, height, { kernel: "nearest" }).png().toFile(outputPath);
    }
  };
}
async function cmdInspect(args) {
  if (args.length === 0) {
    console.error("Usage: ofgui inspect <project-dir>");
    process.exit(1);
  }
  const fairyPath = await resolveFairyPath(args[0]);
  console.log(`Project: ${fairyPath}
`);
  const io = new NodeIO();
  const doc = await io.readProject(fairyPath);
  const report = inspect(doc);
  printReport(report);
}
function printReport(report) {
  console.log(`ID: ${report.projectId}`);
  console.log(`Type: ${report.projectType}, Version: ${report.version}`);
  console.log(`
Packages: ${report.totals.packages}`);
  console.log(`  Images:       ${report.totals.images}`);
  console.log(`  Sounds:       ${report.totals.sounds}`);
  console.log(`  Fonts:        ${report.totals.fonts}`);
  console.log(`  MovieClips:   ${report.totals.movieClips}`);
  console.log(`  Components:   ${report.totals.components}`);
  console.log(`  DisplayObjs:  ${report.totals.displayObjects}`);
  console.log(`  Gears:        ${report.totals.gears}`);
  console.log(`  Controllers:  ${report.totals.controllers}`);
  console.log(`  Transitions:  ${report.totals.transitions}`);
  console.log("\nPackage details:");
  for (const pkg of report.packages) {
    const res = pkg.resources;
    console.log(`  ${pkg.name} (${pkg.id}): ${res.images.count} img, ${res.sounds.count} snd, ${res.fonts.count} font, ${res.components.count} comp`);
  }
}
function parseProjectType(value) {
  if (!value) return void 0;
  const trimmed = value.trim();
  if (trimmed === "") return void 0;
  if (/^\d+$/u.test(trimmed)) return Number(trimmed);
  const normalized = trimmed.toLowerCase();
  const map = {
    unity: 0 /* Unity */,
    flash: 1 /* Flash */,
    starling: 2 /* Starling */,
    cocoscreator: 3 /* CocosCreator */,
    cocos: 3 /* CocosCreator */,
    layabox: 4 /* LayaBox */,
    laya: 4 /* LayaBox */,
    egret: 5 /* Egret */,
    haxe: 6 /* Haxe */,
    pixi: 7 /* Pixi */,
    libgdx: 8 /* LibGDX */,
    unreal: 9 /* Unreal */,
    cryengine: 10 /* CryEngine */,
    monogame: 11 /* MonoGame */,
    vision: 12 /* Vision */
  };
  const resolved = map[normalized];
  if (resolved === void 0) {
    throw new Error(`Unknown project type: ${value}. Use a numeric id or one of: ${Object.keys(map).join(", ")}`);
  }
  return resolved;
}
async function cmdListFonts(args) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      packages: { type: "string" }
    },
    allowPositionals: true
  });
  if (positionals.length === 0) {
    console.error("Usage: ofgui list-fonts <release-dir> [--packages a,b,c]");
    process.exit(1);
  }
  const releaseDir = path2.resolve(positionals[0]);
  const pkgFilter = values.packages ? values.packages.split(",").map((s) => s.trim()).filter(Boolean) : void 0;
  const fonts = await listMissingFonts({
    inputDir: releaseDir,
    fs: createNodeRestoreFs(),
    packages: pkgFilter
  });
  if (fonts.length === 0) {
    console.log("No TTF fonts found in published binaries.");
    return;
  }
  console.log(`Found ${fonts.length} TTF font(s):
`);
  for (const font of fonts) {
    console.log(`  Package:     ${font.packageName}`);
    console.log(`  Font Name:   ${font.fontName}`);
    console.log(`  File Name:   ${font.fileName}`);
    console.log(`  Output Path: ${font.relativeOutputPath}`);
    console.log();
  }
}
async function cmdRestore(args) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      output: { type: "string", short: "o" },
      packages: { type: "string" },
      force: { type: "boolean" },
      "project-type": { type: "string" },
      "font-dir": { type: "string" },
      "lang-dir": { type: "string" }
    },
    allowPositionals: true
  });
  if (positionals.length === 0 || !values.output) {
    console.error("Usage: ofgui restore <release-dir> --output <dir> [--packages a,b,c] [--force]");
    process.exit(1);
  }
  const releaseDir = path2.resolve(positionals[0]);
  const outputDir = path2.resolve(values.output);
  const pkgFilter = values.packages ? values.packages.split(",").map((s) => s.trim()).filter(Boolean) : void 0;
  const projectType = parseProjectType(values["project-type"]);
  const { cropImage, extractImage, getImageSize, padImage, upscaleImage } = await createRestoreImageProcessors();
  console.log(`Restoring published FairyGUI project: ${releaseDir}`);
  const result = await restore({
    inputDir: releaseDir,
    output: outputDir,
    fs: createNodeRestoreFs(),
    packages: pkgFilter,
    force: values.force,
    projectType,
    cropImage,
    extractImage,
    getImageSize,
    padImage,
    upscaleImage,
    fontDir: values["font-dir"] ? path2.resolve(values["font-dir"]) : void 0,
    langDir: values["lang-dir"] ? path2.resolve(values["lang-dir"]) : void 0
  });
  const packages = result.document.getRoot().listPackages();
  console.log(`
Done! Output: ${result.projectPath}`);
  console.log(`Packages: ${packages.map((pkg) => pkg.getName()).join(", ")}`);
  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }
}
async function cmdPublish(args) {
  const { values, positionals } = parseArgs({
    args,
    options: {
      output: { type: "string", short: "o" },
      compressed: { type: "boolean" },
      packages: { type: "string" },
      branch: { type: "string" },
      "project-type": { type: "string" },
      "max-atlas-size": { type: "string" },
      "no-atlas": { type: "boolean" }
    },
    allowPositionals: true
  });
  if (positionals.length === 0 || !values.output) {
    console.error("Usage: ofgui publish <project-dir> --output <dir> [--compressed] [--packages a,b,c] [--branch name]");
    process.exit(1);
  }
  const fairyPath = await resolveFairyPath(positionals[0]);
  const projectDir = path2.dirname(fairyPath);
  const outputDir = path2.resolve(values.output);
  console.log(`Reading project: ${fairyPath}`);
  const io = new NodeIO();
  const doc = await io.readProject(fairyPath);
  const projectType = parseProjectType(values["project-type"]);
  if (projectType !== void 0) {
    doc.getRoot().setProjectType(projectType);
  }
  const pkgFilter = values.packages ? values.packages.split(",").map((s) => s.trim()) : void 0;
  const maxAtlasSize = values["max-atlas-size"] ? Number(values["max-atlas-size"]) : void 0;
  const resolved = resolvePublishOptions(doc, {
    compressed: values.compressed,
    packages: pkgFilter,
    atlas: maxAtlasSize ? { maxSize: maxAtlasSize } : void 0
  });
  console.log(`Settings: ext=${resolved.fileExtension}, compressed=${resolved.compressed}`);
  if (values.branch) {
    console.log(`Active branch: ${values.branch}`);
  }
  const atlasConfig = {
    ...resolved.atlas,
    readFileRaw: async (filePath) => {
      const buf = await fs2.readFile(filePath);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    }
  };
  let encoder;
  try {
    const sharp = await import("sharp");
    encoder = sharp.default ?? sharp;
    console.log("Sharp loaded \u2014 atlas PNGs will be generated.");
  } catch {
    console.log("Sharp not available \u2014 atlas PNGs will NOT be generated (layout only).");
    console.log("  Install sharp to enable: pnpm add sharp");
  }
  const publishFs = {
    async readFileRaw(filePath) {
      const buf = await fs2.readFile(filePath);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    },
    async writeFileRaw(filePath, data) {
      await fs2.mkdir(path2.dirname(filePath), { recursive: true });
      await fs2.writeFile(filePath, data);
    },
    async mkdir(dirPath) {
      await fs2.mkdir(dirPath, { recursive: true });
    },
    async readdir(dirPath) {
      return fs2.readdir(dirPath);
    },
    async deleteFile(filePath) {
      await fs2.rm(filePath, { force: true });
    },
    join(...paths) {
      return path2.join(...paths);
    }
  };
  await doc.transform(publish({
    output: outputDir,
    compressed: resolved.compressed,
    fileExtension: resolved.fileExtension,
    packages: resolved.packages,
    fs: publishFs,
    encoder,
    basePath: path2.join(projectDir, "assets"),
    atlas: atlasConfig,
    branch: values.branch,
    skipAtlas: values["no-atlas"]
  }));
  console.log(`
Done! Output: ${outputDir}`);
}
main().catch((err2) => {
  console.error(err2);
  process.exit(1);
});
/*! Bundled license information:

pako/dist/pako.esm.mjs:
  (*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) *)
*/
