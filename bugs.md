# All known bugs
## An extra ':' is added to the front of a part of CSS that is within the brackets of pseudo-class
```diff
Input:
+ :has(> img:hover) {
+ 	border-color: #BFBFBF80;
+ }

Output:
- :has(> :img:hover) {
- 	border-color: #BFBFBF80;
- }
```
## If there is a url(), all the ',' after it won't get a space added.
```diff
Input:
+ body {
+ body {
+     background: url('https://imgur.com/89ghcv'),
+         linear-gradient(to right, red, blue),
+         black;
+ }

Output:
- body {
- 	background: url('https://imgur.com/89ghcv'),linear-gradient(to right,red,blue),black;
- }

Expected output:
+ body {
+ 	background: url('https://imgur.com/89ghcv'), linear-gradient(to right,red,blue), black;
+ }
```