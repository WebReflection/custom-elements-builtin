# Custom Elements Builtin

<sup>**Social Media Photo by [Joanna Kosinska](https://unsplash.com/@joannakosinska) on [Unsplash](https://unsplash.com/)**</sup>


A better custom-elements-builtin polyfill, targeting Safari, but working in every other browser that has native _customElements_.


## Usage

This module does not include feature detection, so **do not use this module directly, unless you:** 
- are targeting Safari/WebKit browsers *only*,
- filtered out non-Safari/Webkit browsers, or
- feature detect properly, if the browser supports customized builtin-elements.

It is **highly encouraged** to use [@ungap/custom-elements](https://github.com/ungap/custom-elements#readme), which includes this module and minute details for you.

For more information, you can check out the [examples](#examples-for-how-to-do-feature-detection-for-this-polyfill)


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


## Examples for how to do feature detection for this polyfill

Your first option would be, to extend and register an element, appending it do a DocumentFragment and then checking if it's both an instance of a Custom Element as well as a Builtin Element.

```js
// This returns false, if Customized Builtin-Elements are not supported
function supportsCustomizedBuiltInElements() {
  try {
    class CustomButton extends HTMLButtonElement {}
    customElements.define('test-button', CustomButton, { extends: 'button' });

    const fragment = new DocumentFragment();
    const testButton = document.createElement('button', { is: 'test-button' });
    fragment.appendChild(testButton);

    return testButton instanceof CustomButton && testButton instanceof HTMLButtonElement;
  } catch (e) {
    return false;
  }
}

// Then use this to load 
if (!supportsCustomizedBuiltInElements()) {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/@ungap/custom-elements';
  document.head.appendChild(script);
}
```

Another option would be, to add a script tag to your HTML checking for your browser, then adding a script tag to your document to load in the polyfill.
```html
<script>
    self.chrome || 
    self.netscape ||
    document.write('<script src="//unpkg.com/@webreflection/custom-elements-builtin"><\/script>');
</script>
```
