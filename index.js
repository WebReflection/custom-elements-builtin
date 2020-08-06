(function () {
  'use strict';

  const elements = element => 'querySelectorAll' in element;
  const {filter} = [];

  var qsaObserver = options => {
    const live = new WeakMap;
    const callback = records => {
      const {query} = options;
      if (query.length) {
        for (let i = 0, {length} = records; i < length; i++) {
          loop(filter.call(records[i].addedNodes, elements), true, query);
          loop(filter.call(records[i].removedNodes, elements), false, query);
        }
      }
    };
    const drop = elements => {
      for (let i = 0, {length} = elements; i < length; i++)
        live.delete(elements[i]);
    };
    const flush = () => {
      callback(observer.takeRecords());
    };
    const loop = (elements, connected, query, set = new Set) => {
      for (let selectors, element, i = 0, {length} = elements; i < length; i++) {
        // guard against repeated elements within nested querySelectorAll results
        if (!set.has(element = elements[i])) {
          set.add(element);
          if (connected) {
            for (let q, m = matches(element), i = 0, {length} = query; i < length; i++) {
              if (m.call(element, q = query[i])) {
                if (!live.has(element))
                  live.set(element, new Set);
                selectors = live.get(element);
                // guard against selectors that were handled already
                if (!selectors.has(q)) {
                  selectors.add(q);
                  options.handle(element, connected, q);
                }
              }
            }
          }
          // guard against elements that never became live
          else if (live.has(element)) {
            selectors = live.get(element);
            live.delete(element);
            selectors.forEach(q => {
              options.handle(element, connected, q);
            });
          }
          loop(element.querySelectorAll(query), connected, query, set);
        }
      }
    };
    const matches = element => (
      element.matches ||
      element.webkitMatchesSelector ||
      element.msMatchesSelector
    );
    const parse = (elements, connected = true) => {
      loop(elements, connected, options.query);
    };
    const observer = new MutationObserver(callback);
    const root = options.root || document;
    const {query} = options;
    observer.observe(root, {childList: true, subtree: true});
    if (query.length)
      parse(root.querySelectorAll(query));
    return {drop, flush, observer, parse};
  };

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
        if (registry.has(is))
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

  function parseShadow(element) {
    const {parse, root} = shadowRoots.get(element);
    parse(root.querySelectorAll(this), element.isConnected);
  }

}());
