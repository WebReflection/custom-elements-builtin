!function(){"use strict";const{document:e,MutationObserver:t,Set:r,WeakMap:l}=self,n=e=>"querySelectorAll"in e,{filter:o}=[];var s=s=>{const a=new l,c=e=>{const{query:t}=s;if(t.length)for(let r=0,{length:l}=e;r<l;r++)u(o.call(e[r].addedNodes,n),!0,t),u(o.call(e[r].removedNodes,n),!1,t)},u=(e,t,l,n=new r)=>{for(let o,c,h=0,{length:f}=e;h<f;h++)if(!n.has(c=e[h])){if(n.add(c),t)for(let e,n=i(c),u=0,{length:h}=l;u<h;u++)n.call(c,e=l[u])&&(a.has(c)||a.set(c,new r),o=a.get(c),o.has(e)||(o.add(e),s.handle(c,t,e)));else a.has(c)&&(o=a.get(c),a.delete(c),o.forEach((e=>{s.handle(c,t,e)})));u(d(c),t,l,n)}},i=e=>e.matches||e.webkitMatchesSelector||e.msMatchesSelector,h=(e,t=!0)=>{u(e,t,s.query)},d=e=>p.length?e.querySelectorAll(p):p,f=new t(c),g=s.root||e,{query:p}=s;return f.observe(g,{childList:!0,subtree:!0}),h(d(g)),{drop:e=>{for(let t=0,{length:r}=e;t<r;t++)a.delete(e[t])},flush:()=>{c(f.takeRecords())},observer:f,parse:h}};const{customElements:a,document:c,Element:u,MutationObserver:i,Object:h,Promise:d,Map:f,Set:g,WeakMap:p,Reflect:y}=self,{attachShadow:b}=u.prototype,{createElement:w}=c,{define:m,get:v}=a,{construct:q}=y||{construct(e){return e.call(this)}},{defineProperty:S,keys:A,getOwnPropertyNames:E,setPrototypeOf:M}=h,k=new p,O=new g,N=new f,P=new f,$=new f,C=new f,V=[],L=[],R=e=>C.get(e)||v.call(a,e),T=(e,t,r)=>{const l=$.get(r);if(t&&!l.isPrototypeOf(e)){const t=A(e),r=t.map((t=>{const r=e[t];return delete e[t],r}));D=M(e,l);try{new l.constructor}finally{D=null;for(let l=0,{length:n}=t;l<n;l++)e[t[l]]=r[l]}}const n=(t?"":"dis")+"connectedCallback";n in l&&e[n]()},{parse:W}=s({query:L,handle:T}),{parse:_}=s({query:V,handle(e,t){k.has(e)&&(t?O.add(e):O.delete(e),F.call(L,e))}}),j=e=>{if(!P.has(e)){let t,r=new d((e=>{t=e}));P.set(e,{$:r,_:t})}return P.get(e).$},x=((e,t)=>{const r=e=>{for(let t=0,{length:r}=e;t<r;t++)l(e[t])},l=({target:e,attributeName:t,oldValue:r})=>{e.attributeChangedCallback(t,r,e.getAttribute(t))};return(n,o)=>{const{observedAttributes:s}=n.constructor;return s&&e(o).then((()=>{new t(r).observe(n,{attributes:!0,attributeOldValue:!0,attributeFilter:s});for(let e=0,{length:t}=s;e<t;e++)n.hasAttribute(s[e])&&l({target:n,attributeName:s[e],oldValue:null})})),n}})(j,i);let D=null;function F(e){const{parse:t,root:r}=k.get(e);t(r.querySelectorAll(this),e.isConnected)}E(self).filter((e=>/^HTML/.test(e))).forEach((e=>{const t=self[e];function r(){const{constructor:e}=this;if(!N.has(e))throw new TypeError("Illegal constructor");const{is:r,tag:l}=N.get(e);if(r){if(D)return x(D,r);const t=w.call(c,l);return t.setAttribute("is",r),x(M(t,e.prototype),r)}return q.call(this,t,[],e)}M(r,t),S(r.prototype=t.prototype,"constructor",{value:r}),S(self,e,{value:r})})),S(c,"createElement",{value(e,t){const r=t&&t.is;if(r){const t=C.get(r);if(t&&N.get(t).tag===e)return new t}const l=w.call(c,e);return r&&l.setAttribute("is",r),l}}),b&&S(u.prototype,"attachShadow",{value(){const e=b.apply(this,arguments),{parse:t}=s({query:L,root:e,handle:T});return k.set(this,{root:e,parse:t}),e}}),S(a,"get",{configurable:!0,value:R}),S(a,"whenDefined",{configurable:!0,value:j}),S(a,"define",{configurable:!0,value(e,t,r){if(R(e))throw new Error(`'${e}' has already been defined as a custom element`);let l;const n=r&&r.extends;N.set(t,n?{is:e,tag:n}:{is:"",tag:e}),n?(l=`${n}[is="${e}"]`,$.set(l,t.prototype),C.set(e,t),L.push(l)):(m.apply(a,arguments),V.push(l=e)),j(e).then((()=>{n?(W(c.querySelectorAll(l)),O.forEach(F,[l])):_(c.querySelectorAll(l))})),P.get(e)._(t)}})}();
