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