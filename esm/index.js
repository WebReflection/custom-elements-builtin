import qsaObserver from 'qsa-observer';

const {attachShadow} = Element.prototype;
const {defineProperty, setPrototypeOf} = Object;
const {define, get} = customElements;
const {createElement} = document;

const attributes = new WeakMap;
const classes = new Map;
const defined = new Map;
const prototypes = new Map;
const registry = new Map;

const shadows = [];
const query = [];

const attributeChanged = (records, o) => {
  for (let h = attributes.get(o), i = 0, {length} = records; i < length; i++) {
    const {target, attributeName, oldValue} = records[i];
    const newValue = target.getAttribute(attributeName);
    h.call(target, attributeName, oldValue, newValue);
  }
};

const augment = (element, is) => {
  const {observedAttributes: attributeFilter} = element.constructor;
  if (attributeFilter) {
    const {attributeChangedCallback} = element;
    const o = new MutationObserver(attributeChanged);
    o.observe(element, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter
    });
    attributes.set(o, attributeChangedCallback);
    whenDefined(is).then(() => {
      attributeFilter.forEach(attributeName => {
        if (element.hasAttribute(attributeName))
          attributeChangedCallback.call(
            element,
            attributeName,
            null,
            element.getAttribute(attributeName)
          );
      });
    });
  }
  return element;
};

const handle = (element, connected, selector) => {
  const proto = prototypes.get(selector);
  if (connected && !proto.isPrototypeOf(element)) {
    override = setPrototypeOf(element, proto);
    try { new proto.constructor; }
    finally { override = null; }
  }
  const method = `${connected ? '' : 'dis'}connectedCallback`;
  if (method in proto)
    proto[method].call(element);
};

const {parse} = qsaObserver({query, handle});

const whenDefined = name => {
  if (!defined.has(name)) {
    let _, $ = new Promise($ => { _ = $; });
    defined.set(name, {$, _});
  }
  return defined.get(name).$;
};

let override = null;

Reflect.ownKeys(self)
  .filter(k => typeof k == 'string' && /^HTML(?!Element)/.test(k))
  .forEach(k => {
    function HTMLBuiltIn() {
      const {constructor} = this;
      if (!classes.has(constructor))
        throw new TypeError('Illegal constructor');
      const {is, tag} = classes.get(constructor);
      if (override)
        return augment(override, is);
      const element = createElement.call(document, tag);
      element.setAttribute('is', is);
      return augment(setPrototypeOf(element, constructor.prototype), is);
    }
    setPrototypeOf(HTMLBuiltIn, self[k]);
    (HTMLBuiltIn.prototype = self[k].prototype).constructor = HTMLBuiltIn;
    defineProperty(self, k, {value: HTMLBuiltIn});
  });

defineProperty(Element.prototype, 'attachShadow', {
  value() {
    const root = attachShadow.apply(this, arguments);
    qsaObserver({query, root, handle});
    shadows.push(root);
    return root;
  }
});

defineProperty(customElements, 'define', {
  value(is, Class, options) {
    const tag = options && options.extends;
    if (tag) {
      if (registry.has(is))
        throw new Error(`the name "${is}" has already been used with this registry`);
      const selector = `${tag}[is="${is}"]`;
      classes.set(Class, {is, tag});
      prototypes.set(selector, Class.prototype);
      registry.set(is, Class);
      query.push(selector);
      parse(document.querySelectorAll(query));
      shadows.forEach(root => { parse(root.querySelectorAll(query)); });
    }
    else
      define.apply(customElements, arguments);
    whenDefined(is);
    defined.get(is)._();
  }
});

defineProperty(customElements, 'get', {
  value: name => registry.get(name) || get.call(customElements, name)
});

defineProperty(customElements, 'whenDefined', {value: whenDefined});

defineProperty(document, 'createElement', {
  value(name, options) {
    const is = options && options.is;
    return is ? new (registry.get(is)) : createElement.call(document, name);
  }
});
