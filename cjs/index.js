'use strict';
const attributesObserver = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('@webreflection/custom-elements-attributes'));
const qsaObserver = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('qsa-observer'));

const {
  customElements, document,
  Element, MutationObserver, Object, Promise,
  Map, Set, WeakMap, Reflect
} = self;

const {attachShadow} = Element.prototype;
const {createElement} = document;
const {define, get} = customElements;
const {construct} = Reflect || {construct(HTMLElement) {
  return HTMLElement.call(this);
}};
const {defineProperty, getOwnPropertyNames, setPrototypeOf} = Object;

const shadowRoots = new WeakMap;
const shadows = new Set;

const classes = new Map;
const defined = new Map;
const prototypes = new Map;
const registry = new Map;

const shadowed = [];
const query = [];

const getCE = is => registry.get(is) || get.call(customElements, is);

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

const augment = attributesObserver(whenDefined, MutationObserver);

let override = null;

getOwnPropertyNames(self)
  .filter(k => /^HTML/.test(k))
  .forEach(k => {
    const HTMLElement = self[k];
    function HTMLBuiltIn() {
      const {constructor} = this;
      if (!classes.has(constructor))
        throw new TypeError('Illegal constructor');
      const {is, tag} = classes.get(constructor);
      if (is) {
        if (override)
          return augment(override, is);
        const element = createElement.call(document, tag);
        element.setAttribute('is', is);
        return augment(setPrototypeOf(element, constructor.prototype), is);
      }
      else
        return construct.call(this, HTMLElement, [], constructor);
    }
    setPrototypeOf(HTMLBuiltIn, HTMLElement);
    (HTMLBuiltIn.prototype = HTMLElement.prototype).constructor = HTMLBuiltIn;
    defineProperty(self, k, {value: HTMLBuiltIn});
  });

defineProperty(document, 'createElement', {
  value(name, options) {
    const is = options && options.is;
    if (is) {
      const Class = registry.get(is);
      if (Class && classes.get(Class).tag === name)
        return new Class;
    }
    const element = createElement.call(document, name);
    if (is)
      element.setAttribute('is', is);
    return element;
  }
});

if (attachShadow)
  defineProperty(Element.prototype, 'attachShadow', {
    value() {
      const root = attachShadow.apply(this, arguments);
      const {parse} = qsaObserver({query, root, handle});
      shadowRoots.set(this, {root, parse});
      return root;
    }
  });

defineProperty(customElements, 'get', {
  configurable: true,
  value: getCE
});

defineProperty(customElements, 'whenDefined', {
  configurable: true,
  value: whenDefined
});

defineProperty(customElements, 'define', {
  configurable: true,
  value(is, Class, options) {
    if (getCE(is))
      throw new Error(`'${is}' has already been defined as a custom element`);
    let selector;
    const tag = options && options.extends;
    classes.set(Class, tag ? {is, tag} : {is: '', tag: is});
    if (tag) {
      selector = `${tag}[is="${is}"]`;
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
    defined.get(is)._(Class);
  }
});

function parseShadow(element) {
  const {parse, root} = shadowRoots.get(element);
  parse(root.querySelectorAll(this), element.isConnected);
}
