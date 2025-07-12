# All known bugs
## Bug #1
### Input:
```diff
+ | label {
+ |  	flex: 1;
+ | 
+ | 	&:has(:disabled) {
+ | 		&, &:hover {
+ | 			cursor: not-allowed;
+ | 		}
+ | 	}
+ | }
```
### Output:
```diff
- | label {
- | 	flex: 1;
- | 
- | 	&:has(:disabled) :is(&:has(:disabled), &:has(:disabled):hover) {
- | 		cursor: not-allowed;
- | 	}
- | }
```
### Expected Output:
```diff
+ | label {
+ | 	flex: 1;
+ | 
+ | 	&:has(:disabled):is(&:has(:disabled), &:has(:disabled):hover) {
+ | 		cursor: not-allowed;
+ | 	}
+ | }
```
## Bug #2
### Input:
```diff
+ | label {
+ | 	flex: 1;
+ | 
+ | 	&:has(:disabled) {
+ | 	    color: red;
+ | 	    
+ | 		&, &:hover {
+ | 			cursor: not-allowed;
+ | 		}
+ | 	}
+ | }
```
### Output:
```diff
- | label {
- | 	flex: 1;
- | 
- | 	&:has(:disabled) {
- | 		color: red;
- | 
- | 		:is(&:has(:disabled), &:has(:disabled):hover) {
- | 			cursor: not-allowed;
- | 		}
- | 	}
- | }
```
### Expected Output:
```diff
+ | label {
+ | 	flex: 1;
+ | 
+ | 	&:has(:disabled) {
+ | 		color: red;
+ | 
+ | 		&:is(&:has(:disabled), &:has(:disabled):hover) {
+ | 			cursor: not-allowed;
+ | 		}
+ | 	}
+ | }
```
### Input:
```diff
+ | &#inputEditorWrapper {
+ |     display: block;
+ |     padding: var(--padding);
+ |     padding-left: 0;
+ |     border-color: rgb(from var(--shades-darker) r g b / var(--opacity-low));
+ |     background-color: rgb(from var(--shades-white) r g b / 3%);
+ | 
+ |     &, > .editorGroup {
+ |         max-width: 100%;
+ |     }
+ | }
```
### Output:
```diff
- | &#inputEditorWrapper {
- |     display: block;
- |     padding: var(--padding);
- |     padding-left: 0;
- |     border-color: rgb(from var(--shades-darker) r g b / var(--opacity-low));
- |     background-color: rgb(from var(--shades-white) r g b / 3%);
- | 
- |     &:is(&#inputEditorWrapper, > .editorGroup) {
- |         max-width: 100%;
- |     }
- | }
```
### Expected Output:
```diff
+ | &#inputEditorWrapper {
+ |     display: block;
+ |     padding: var(--padding);
+ |     padding-left: 0;
+ |     border-color: rgb(from var(--shades-darker) r g b / var(--opacity-low));
+ |     background-color: rgb(from var(--shades-white) r g b / 3%);
+ | 
+ |     &:is(&#inputEditorWrapper), :is(> .editorGroup) {
+ |         max-width: 100%;
+ |     }
+ | }
```
### Input:
```diff
+ | body { && {
+ |   background-color: green;  
+ | }}
```
### Output:
```diff
- | body& {
- | 	background-color: green;
- | }
```
### Expected Output:
```diff
+ | &#inputEditorWrapper {
+ |     display: block;
+ |     padding: var(--padding);
+ |     padding-left: 0;
+ |     border-color: rgb(from var(--shades-darker) r g b / var(--opacity-low));
+ |     background-color: rgb(from var(--shades-white) r g b / 3%);
+ | 
+ |     &:is(&#inputEditorWrapper), :is(> .editorGroup) {
+ |         max-width: 100%;
+ |     }
+ | }
```