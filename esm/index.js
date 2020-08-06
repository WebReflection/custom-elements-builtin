import qsaObserver from 'qsa-observer';

const {attachShadow} = Element.prototype;
const {defineProperty, getOwnPropertyNames, setPrototypeOf} = Object;
const {define, get} = customElements;
const {createElement} = document;

const shadowRoots = new WeakMap;

const classes = new Map;
const defined = new Map;
const prototypes = new Map;
const registry = new Map;

const shadows = new Set;

const shadowed = [];
const query = [];

const attributeChanged = records => {
  for (let i = 0, {length} = records; i < length; i++) {
    const {target, attributeName, oldValue} = records[i];
    const newValue = target.getAttribute(attributeName);
    target.attributeChangedCallback(attributeName, oldValue, newValue);
  }
};

const augment = (element, is) => {
  const {observedAttributes: attributeFilter} = element.constructor;
  if (attributeFilter) {
    whenDefined(is).then(() => {
      new MutationObserver(attributeChanged).observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter
      });
      attributeFilter.forEach(attributeName => {
        if (element.hasAttribute(attributeName))
          element.attributeChangedCallback(
            attributeName,
            null,
            element.getAttribute(attributeName)
          );
      });
    });
  }
  return element;
};

const getCE = name => registry.get(name) || get.call(customElements, name);

const handle = (element, connected, selector) => {
  const proto = prototypes.get(selector);
  if (connected && !proto.isPrototypeOf(element)) {
    override = setPrototypeOf(element, proto);
    try { new proto.constructor; }
    finally { override = null; }
  }
  const method = `${connected ? '' : 'dis'}connectedCallback`;
  if (method in proto)
    element[method]();
};

const {parse} = qsaObserver({query, handle});

const {parse: parseShadowed} = qsaObserver({
  query: shadowed,
  handle(element, connected) {
    if (shadowRoots.has(element)) {
      if (connected)
        shadows.add(element);
      else
        shadows.delete(element);
      parseShadow.call(query, element);
    }
  }
});

const whenDefined = name => {
  if (!defined.has(name)) {
    let _, $ = new Promise($ => { _ = $; });
    defined.set(name, {$, _});
  }
  return defined.get(name).$;
};

let override = null;

getOwnPropertyNames(self)
  .filter(k => /^HTML(?!Element)/.test(k))
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
    const {parse} = qsaObserver({query, root, handle});
    shadowRoots.set(this, {root, parse});
    return root;
  }
});

defineProperty(customElements, 'define', {
  value(is, Class, options) {
    let selector;
    const tag = options && options.extends;
    if (tag) {
      if (getCE(is))
        throw new Error(`the name "${is}" has already been used with this registry`);
      selector = `${tag}[is="${is}"]`;
      classes.set(Class, {is, tag});
      prototypes.set(selector, Class.prototype);
      registry.set(is, Class);
      query.push(selector);
    }
    else {
      define.apply(customElements, arguments);
      shadowed.push(selector = is);
    }
    whenDefined(is).then(() => {
      if (tag) {
        parse(document.querySelectorAll(selector));
        shadows.forEach(parseShadow, [selector]);
      }
      else
        parseShadowed(document.querySelectorAll(selector));
    });
    defined.get(is)._();
  }
});

defineProperty(customElements, 'get', {value: getCE});

defineProperty(customElements, 'whenDefined', {value: whenDefined});

defineProperty(document, 'createElement', {
  value(name, options) {
    const is = options && options.is;
    return is ? new (registry.get(is)) : createElement.call(document, name);
  }
});

function parseShadow(element) {
  const {parse, root} = shadowRoots.get(element);
  parse(root.querySelectorAll(this), element.isConnected);
}
