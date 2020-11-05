# Custom Elements Builtin

<sup>**Social Media Photo by [Joanna Kosinska](https://unsplash.com/@joannakosinska) on [Unsplash](https://unsplash.com/)**</sup>


A better custom-elements-builtin polyfill, targeting Safari, but working in every other browser that has native _customElements_.


## Update

This module is included in [@ungap/custom-elements](https://github.com/ungap/custom-elements#readme) polyfill, use that to avoid dealing with `try` catches manually, it features detect everything for you.

**Do not use this module directly** unless you are targeting Safari/WebKit browsers *only*.

I am not maintaining how to feature detect in here, because it keeps changing, and the right polyfill that includes most updated feature detection is [this one](https://github.com/ungap/custom-elements#readme), not this module.


## To Keep In Mind

If you'd like your builtin elements to be style-able, and you land these elements through their constructors or via `document.createElement('button', {is: 'custom-button'})`, remember to explicitly set their `is` attribute, because due to [this inconsistent bug](https://github.com/whatwg/html/issues/5782), Chrome and Firefox don't do that automatically, and your builtin extends might not get the desired style.

```js
class BlueButton extends HTMLButtonElement {
  constructor() {
    super()
    // for dedicated styles, remember to do this!
    this.setAttribute('is', 'blue-button');

    // everything else is fine
    this.textContent = 'I am blue';
  }
}

customElements.define('blue-button', BlueButton, {extends: 'button'});

document.body.appendChild(new BlueButton);
```

This polyfill does that automatically because all builtin extends must be query-able via `querySelectorAll`, but other browsers won't do that automatically.
