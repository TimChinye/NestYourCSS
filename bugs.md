# All known bugs
## Bug #1
### Input:
```diff
+ | main { && {
+ |   background-color: green;  
+ | }}
```
### Output:
```diff
- | main& {
- | 	background-color: green;
- | }
```
### Expected Output:
```diff
+ | main:is(main) {
+ | 	background-color: green;
+ | }
```
## Bug #2
### Input:
```diff
+ | @media (max-aspect-ratio:1.097 / 1) {
+ |     body {
+ |     	> div {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     	
+ |     	> figure {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     }
+ | }
+ | 
+ | body {
+ | 	> div {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | 	
+ | 	> figure {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | }
```
### Output:
```diff
- | @media (max-aspect-ratio:1.097 / 1) {
- | 	body > {
- | 		div {
- | 			background: green;
- | 			height: 100vh;
- | 		}
- | 
- | 		figure {
- | 			background: green;
- | 			height: 100vh;
- | 		}
- | 	}
- | }
- | 
- | body {
- | 	> div {
- | 		background: green;
- | 		height: 100vh;
- | 	}
- | 
- | 	> figure {
- | 		background: green;
- | 		height: 100vh;
- | 	}
- | }
```
### Expected Output:
```diff
+ | @media (max-aspect-ratio:1.097 / 1) {
+ |     body {
+ |     	> div {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     
+ |     	> figure {
+ |     		background: green;
+ |     		height: 100vh;
+ |     	}
+ |     }
+ | }
+ | 
+ | body {
+ | 	> div {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | 
+ | 	> figure {
+ | 		background: green;
+ | 		height: 100vh;
+ | 	}
+ | }
```