# All known bugs
## Attribute selectors don't get nested.
```diff
Input:
+ a {
+   color: purple;
+ }
+ 
+ a[href="https://example.org"]{
+   color: green;
+ }

Output:
- a {
- 	color: purple;
- }
- 
- a[href="https://example.org"] {
- 	color: green;
- }

Expected Output:
+ a {
+     color: purple;
+ 
+     &[href="https://example.org"] { 
+         color: green;
+     }
+ }
```
## Beautify ugly selectors.
```diff
Input:
+ #offsets>*[data-v-9203cb59] { ... }

Output:
- #offsets>*[data-v-9203cb59] { ... }

Expected Output:
+ #offsets > *[data-v-9203cb59] { ... } 
```
## If a rule has properties under nested rules, it may remove the properties.
```diff
Input:
+ html {
+     ::-webkit-scrollbar {
+         width: 0;
+     }
+ 
+     scroll-behavior: smooth; 
+ }

Output:
- html ::-webkit-scrollbar {
-     width: 0;
- }

Expected Output:
+ html {
+     scroll-behavior: smooth; 
+ 
+     ::-webkit-scrollbar {
+         width: 0;
+     }
+ }
```

## Uh...
```css
html > :has(table) {
	overflow-y: scroll;
	max-height: 16rem;
	padding: calc(var(--padding) / 2);
	border-radius: 1.5rem;
	--table-background: color-mix(in srgb, var(--shades-darkest), var(--panel-background) 75%);
	background-color: var(--table-background);
	scrollbar-width: 0.75rem;

	--track-colour: color-mix(in srgb, var(--shades-black), var(--panel-background) 75%);
	--thumbnail-colour: var(--shades-m-darker);
	--scrollbar-padding: 4px;
	--scrollbar-width: 12px;

	/* Non-Standard Properties */
	@supports selector(::-webkit-scrollbar) {
	  &::-webkit-scrollbar {
		width: var(--scrollbar-width);
		height: var(--scrollbar-width);
	  }
  
	  &::-webkit-scrollbar-thumb {
		background: var(--thumbnail-colour);
		border-radius: 999px;
		border: var(--scrollbar-padding) solid transparent;
		background-clip: padding-box;
	  }
  
	  &::-webkit-scrollbar-track {
		background: var(--track-colour);
		border-radius: 999px;
	  }
	}
  
	/* Standard Properties */
	@supports not selector(::-webkit-scrollbar) {
	  scrollbar-color: var(--thumbnail-colour) var(--track-colour);
	  scrollbar-width: thin;
	}
}
```