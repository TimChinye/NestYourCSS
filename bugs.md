# All known bugs
## Still working on it.
```diff
Input:
+ @media (max-aspect-ratio:1.097 / 1) {
+ 	body > #siteWrapper > {
+ 		article {
+ 			font-size: clamp(1.1px, 1.15dvw, 22.5px);
+ 
+ 			> section,  > a > section {
+ 				contain: size;
+ 				position: relative;
+ 				height: min(100dvh, 1600px);
+ 
+ 				&#reducingBoilerplateCode > {
+ 					#repeatingText {
+ 						top: 50%;
+ 						translate: 0 calc(-50% - 7.5em);
+ 					}
+ 
+ 					#parallaxText {
+ 						bottom: 50%;
+ 						translate: 0 calc(-50% + 6em);
+ 					}
+ 				}
+ 			}
+ 		}
+ 	}
+ }
```