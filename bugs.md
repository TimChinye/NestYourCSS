# All known bugs
## I can't actually explain this yet. It's a mix of :: within () not being ignored, and @support can have it's own declarations (because of Native CSS Nesting, the definition of a "rule list" and "declaration list" has changed, so @at-rules like @support, can now have declarations even though on MDN they are defined as a rule list)... There is also such thing called "declaration-rule-list". I think MDN just needs updating tbh.
```diff
Input:
+ html {
+   color: red;
+ 
+   /* Non-Standard Properties */
+   @supports selector(::-webkit-scrollbar) {
+     &::-webkit-scrollbar {
+       width: 8px;
+       height: 8px;
+     }
+ 
+     &:has(.ace_scrollbar-inner) {
+       &::-webkit-scrollbar-thumb {
+         background: yellow;
+       }
+     }
+ 
+     &::-webkit-scrollbar-track {
+       background: var(--track-colour);
+       border-radius: 999px;
+     }
+   }
+ 
+   /* Standard Properties */
+   @supports not selector(::-webkit-scrollbar) {
+     scrollbar-color: var(--thumbnail-colour) var(--track-colour);
+     scrollbar-width: thin;
+   }
+ }

Output (Nested):
- html {
- 	color: red;
- 
- 	@supports selector(: : -webkit-scrollbar) {
- 		&::-webkit-scrollbar {
- 			width: 8px;
- 			height: 8px;
- 		}
- 
- 		&:has(.ace_scrollbar-inner)::-webkit-scrollbar-thumb {
- 			background: yellow;
- 		}
- 
- 		&::-webkit-scrollbar-track {
- 			background: var(--track-colour);
- 			border-radius: 999px;
- 		}
- 	}
- 
- 	@supports not selector(: : -webkit-scrollbar) {
- 		scrollbar-color: var(--thumbnail-colour) var(--track-colour);
- 		scrollbar-width: thin;
- 	}
- }

Output (Unnested):
- html {
- 	color: red;
- 
- 	@supports selector(: : -webkit-scrollbar)::-webkit-scrollbar {
- 		width: 8px;
- 		height: 8px;
- 	}
- 
- 	@supports selector(: : -webkit-scrollbar):has(.ace_scrollbar-inner)::-webkit-scrollbar-thumb {
- 		background: yellow;
- 	}
- 
- 	@supports selector(: : -webkit-scrollbar)::-webkit-scrollbar-track {
- 		background: var(--track-colour);
- 		border-radius: 999px;
- 	}
- 
- 	@supports not selector(: : -webkit-scrollbar) {
- 		scrollbar-color: var(--thumbnail-colour) var(--track-colour);
- 		scrollbar-width: thin;
- 	}
- }

Expected Output:
+ html {
+   color: red;
+ 
+   @supports selector(::-webkit-scrollbar) {
+     &::-webkit-scrollbar {
+       width: 8px;
+       height: 8px;
+     }
+ 
+     &:has(.ace_scrollbar-inner) {
+       &::-webkit-scrollbar-thumb {
+         background: yellow;
+       }
+     }
+ 
+     &::-webkit-scrollbar-track {
+       background: var(--track-colour);
+       border-radius: 999px;
+     }
+   }
+ 
+   @supports not selector(::-webkit-scrollbar) {
+     scrollbar-color: var(--thumbnail-colour) var(--track-colour);
+     scrollbar-width: thin;
+   }
+ }
```