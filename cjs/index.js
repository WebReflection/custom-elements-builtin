'use strict';
const attributesObserver = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('@webreflection/custom-elements-attributes'));
const {expando} = require('@webreflection/custom-elements-upgrade');
const qsaObserver = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('qsa-observer'));

const {
  customElements, document,
  Element, MutationObserver, Object, Promise,
  Map, Set, WeakMap, Reflect
} = self;

const {createElement} = document;
const {define, get, upgrade} = customElements;
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
    const redefine = expando(element);
    override = setPrototypeOf(element, proto);
    try { new proto.constructor; }
    finally {
      override = null;
      redefine();
    }
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
      if (query.length)
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
  .filter(k => /^HTML.*Element$/.test(k))
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
    defineProperty(
      HTMLBuiltIn.prototype = HTMLElement.prototype,
      'constructor',
      {value: HTMLBuiltIn}
    );
    defineProperty(self, k, {value: HTMLBuiltIn});
  });

defineProperty(document, 'createElement', {
  configurable: true,
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

defineProperty(customElements, 'get', {
  configurable: true,
  value: getCE
});

defineProperty(customElements, 'whenDefined', {
  configurable: true,
  value: whenDefined
});

defineProperty(customElements, 'upgrade', {
  configurable: true,
  value(element) {
    const is = element.getAttribute('is');
    if (is) {
      const constructor = registry.get(is);
      if (constructor) {
        augment(setPrototypeOf(element, constructor.prototype), is);
        // apparently unnecessary because this is handled by qsa observer
        // if (element.isConnected && element.connectedCallback)
        //   element.connectedCallback();
        return;
      }
    }
    upgrade.call(customElements, element);
  }
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
  const root = shadowRoots.get(element);
  parse(root.querySelectorAll(this), element.isConnected);
}

const {attachShadow} = Element.prototype;
if (attachShadow)
  Element.prototype.attachShadow = function (init) {
    const root = attachShadow.call(this, init);
    shadowRoots.set(this, root);
    return root;
  };