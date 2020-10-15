# Custom Elements Builtin

<sup>**Social Media Photo by [Joanna Kosinska](https://unsplash.com/@joannakosinska) on [Unsplash](https://unsplash.com/)**</sup>


A better custom-elements-builtin polyfill, targeting Safari, but working in every other browser that has native _customElements_.


## Update

This module is included in [@ungap/custom-elements](https://github.com/ungap/custom-elements#readme) polyfill, use that to avoid dealing with `try` catches manually, it features detect everything for you.


## How To Test

Please use [these features detection](https://github.com/ungap/custom-elements-builtin#all-possible-features-detections) to avoid including this polyfill in every browser, considering that this is not transpiled, so it would break in IE11 if included without features detection, but it also adds unnecessary code to parse and execute in every browser that supports Custom Elements builtin natively.

```html
<script>
if(this.customElements)
  try{customElements.define('built-in',document.createElement('p').constructor,{'extends':'p'})}
  catch(s){document.write('<script src="//unpkg.com/@webreflection/custom-elements-builtin"><\x2fscript>')}
else
  document.write('<script src="//unpkg.com/document-register-element"><\x2fscript>');
</script>
```

<sup>**P.S.** the `\x2f` is not a typo, it's exactly how you should write it or your page layout will break!</sup>

- - -

There is also a **[live test page](https://webreflection.github.io/custom-elements-builtin/test/)** which should show few buttons and then cleanup.

All logs in console are there to understand if all elements reacted as expected, either within Shadow DOM nodes, or outside.


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
