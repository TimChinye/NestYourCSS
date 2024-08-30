let cssSamples = [
`
li:has(> span) {
	text-decoration: underline;
}
`,`
a {
	b {
		color: red;
	}
}
`,
`
& {
	div {
		width: 90%;
		height: 90%;
		opacity: 0;
		color: #fff;
		counter-increment: div;
		border: 1px solid;
		border-color: blue;

		&:before {
			content: counter(div)".";
		}
	}

	:hover {
		animation: fadein;
		animation-duration: 1.5s;
		animation-fill-mode: forwards;
	}
}
`,
`
[hidden] {
	display: none;
}

@rule ();

h1 {
	color: red
}
`,
`
main {
	> section > div > div {
		display: grid;
		grid-template-columns: repeat(5, minmax(min-content, 1fr));
		grid-template-rows: 8rem repeat(4, minmax(8rem, auto)) 1fr;
		--gap:2rem;
		grid-gap: var(--gap);
		margin: 0 auto;

		&::after {
			content: "";
			display: flex;
			height: calc(var(--main-padding) - var(--gap));
			width: 100%;
		}
	}
}
`,
`
a b c d e f {
	g h {
		color: red;
	}
}
`,
`
.nav-ewc-persistent-hover body .MusicCartBar[style~="fixed;"] {
	right: 220px
}
`,
`
.nav-catFlyout .nav-flyout-content .nav-active {
	background-image: url(data:image/gif;base64,R0lGODlhBwAKAMIEAICAgJmZmbOzs/f39////////////////yH5BAEKAAcALAAAAAAHAAoAAAMWSDPUGoE5AaIj1M4qMW+ZFDYD1ClnAgA7);
	background-position: right 3px;
	background-repeat: no-repeat
}
`,
`
@media (max-width: 320px) {
	#accountMenu-container #accountMenu-canvas-background .hmenu-close-icon,
	#accountMenu-container #hmenu-canvas-background .hmenu-close-icon,
	#hmenu-container #accountMenu-canvas-background .hmenu-close-icon,
	#hmenu-container #hmenu-canvas-background .hmenu-close-icon {
		right:15px
	}
}

#accountMenu-container #accountMenu-canvas-background .hmenu-close-icon,
#accountMenu-container #hmenu-canvas-background .hmenu-close-icon,
#hmenu-container #accountMenu-canvas-background .hmenu-close-icon,
#hmenu-container #hmenu-canvas-background .hmenu-close-icon {
	right:15px
}
`,
`
/* Using escaped characters in selectors */
#\\31 \\32 \\33 {
	background-color: #456;
}

.\\41 \\42 \\43 {
	color: #456;
}

[data-\\61 ttribute="\\76 alue"] {
	font-family: "Times New Roman", \\73 erif;
}

/* Using escaped characters in property names and values */
body:has(:active) {
	\\62 ackground-\\63 olor: #FFFFFF;
	\\66 ont-\\73 ize: 16\\70 x;
}

h1 {
	\\6d argin-\\74 op: 20\\70 x;
	\\70 adding-\\62 ottom: 10\\70 x;
}

/* Using @at-rules with escaped characters */
@\\6d edia screen and (max-width: 600\\70 x) {
	body {
		\\62 ackground-\\63 olor: #eee;
	}
}

@\\66 ont-face {
	\\66 ont-\\66 amily: 'MyFont';
	src: url('myfont.woff2') format('woff2');
}
`,
`
@media screen and (max-width: 600px) {
	body {
		background-color: lightblue;

		&:hover {
			background-color: pink;
		}
	}
}
`,
`
@media screen and (max-width: 600px) {
	body {
		background-color: lightblue;

		&:hover {
			background-color: pink;
		}
	}
}

body {
	background-color: lightblue;

	&:hover {
		background-color: pink;
	}
}
`,
`
@media print, screen and (min-width: 40em) and (max-width: 63.99875em) {
	.hide-for-medium-only {
		display: none !important;
	}
}
@supports (display: grid) {
	div {
		display: grid;
	}
}
@media screen and ( orientation: landscape ) {
	main {
			flex-direction: row;
	}
}
@import url("stylesheet.css") screen and (max-width: 400px);
`,
`
@media print, screen and (min-width: 40em) and (max-width: 63.99875em) {
	.hide-for-medium-only {
		display: none !important;
	}
}
`,
`
main {
	color: red;
}
main > nav > button {
	background: blue;
}
main > a {
	background: blue;
}
main > a button {
	background: blue;
}
`,
`
nav {
	display: inline-flex;
	width: clamp(384px, 100%, 1600px);
	height: 4rem;
}

nav > * {
	display: inherit;
	padding: 0.75rem 1rem;
	background-color: var(--panel-bg-colour);
}

nav a:has(> img) {
	display: flex;
}

nav img {
	height: 2rem;
}

nav ul {
	padding: 1rem 3rem;
	display: flex;
}

nav ul a {
	color: inherit;
	text-decoration: none;
}

nav ul a:hover {
	color: var(--accent-text-colour);
}
`,
`
aside {
	color: red;
}

aside {
	@media (min-width: 600px) {
		body {
			background-color: lightblue;
		}

		@supports (display: grid) {
			div {
				display: grid;
			}
		}
	}
}

main {
	@media (min-width: 600px) {
		body {
			background-color: lightblue;
		}

		@supports (display: grid) {
			div {
				display: grid;
			}
		}
	}
}

main {
	color: red;
}
`,
`
@media screen and ( orientation: landscape ) {
	main {
			flex-direction: row;
	}
}

@import url("stylesheet.css") screen and (max-width: 400px);

@media screen and (max-width: 600px) {
	body {
			background-color: lightblue;

			&:hover {
				background-color: pink;
			}
	}

	.container {
			width: 100%;
			padding: 10px;
	}

	.grid-container {
			grid-template-columns: 1fr;
	}
}

@keyframes expandX {
	from {
		width: inherit;
	}
	to {
		width: calc(100% - 10px);
	}
}

@keyframes expandY {
	from {
		height: inherit;
		width: calc(100% - 10px);
	}
	to {
		height: 100%;
		width: calc(100% - 10px);
	}
}

@keyframes fadein {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes translate {
	0% {
		transform: rotate(-90deg);
	}
	25% {
		transform: rotate(90deg);
	}
	50% {
		transform: rotate(180deg);
	}
	100% {
		transform: rotate(-180deg);
	}
}
`,
`
html, body {
	color: red;
}

body {
	background-color: red;
}

html {
	border-radius: 10px;

	main {
		text-decoration: underline;
	}
}
`,
`
main {
	@media (min-width: 600px) {
		body {
			background-color: lightblue;
		}

		@supports (display: grid) {
			div {
				display: grid;
			}
		}
	}
}
`,
`
html, body {
	padding: 1vw 4vw;
	gap: 2rem;
	align-items: center;
	flex-direction: column;
}

nav {
	display: inline-flex;
	align-items: center;
	flex-flow: wrap;
	justify-content: space-between;
	width: clamp(384px, 100%, 1600px);
	height: 4rem;
	overflow: hidden;
	gap: 2rem;
}

nav > * {
	display: inherit;
	margin: 0;
	padding: 0.75rem 1rem;
	border-radius: 1.5rem;
	background-color: var(--panel-bg-colour);
}

nav a:has(> img) {
display: flex;
}

nav img {
	height: 2rem;
	object-fit: contain;
	object-position: center;
}

nav ul {
	padding: 1rem 3rem;
	list-style-type: none;
	display: flex;
	gap: 2rem;
}

nav ul a {
	color: inherit;
	overflow: visible;
	font-weight: bold;
	text-decoration: none;

	-webkit-transition: 0.25s ease-in-out;
	-moz-transition: 0.25s ease-in-out;
	-ms-transition: 0.25s ease-in-out;
	-o-transition: 0.25s ease-in-out;
	transition: 0.25s ease-in-out;

	-webkit-text-shadow: 0 30px 0px transparent;
	-moz-text-shadow: 0 30px 0px transparent;
	-ms-text-shadow: 0 30px 0px transparent;
	-o-text-shadow: 0 30px 0px transparent;
	text-shadow: 0 30px 0px transparent;
}

nav ul a:hover {
	color: var(--accent-text-colour);

	-webkit-text-shadow: 0 0px 0px var(--accent-text-colour);
	-moz-text-shadow: 0 0px 0px var(--accent-text-colour);
	-ms-text-shadow: 0 0px 0px var(--accent-text-colour);
	-o-text-shadow: 0 0px 0px var(--accent-text-colour);
	text-shadow: 0 0px 0px var(--accent-text-colour);
}

main {
	height: 100%;
	border-radius: 1.5rem;
	padding: 2rem;
	width: clamp(384px, 100%, 1600px);
	background-color: var(--panel-bg-colour);
	flex-direction: column;
}

@media screen and ( orientation: landscape ) {
	main {
			flex-direction: row;
	}
}

main > * {
	flex: 1;
}

main > figure {
	margin: 0;
	position: relative;
	border-radius: 1rem;
}

main > figure img {
	height: 100%;
	width: 100%;
	position: absolute;
	border-radius: inherit;
	object-fit: cover;
}

main > figure {
	display: flex;
	justify-content: center;
	align-items: center;
}

main > figure blockquote {
	margin: 0;
	border-radius: inherit;
	width: fit-content;
	padding: 4rem;
	background-color: color-mix(in srgb, transparent, var(--panel-bg-colour) 25%);
	backdrop-filter: blur(3px);
}

main > figure blockquote:before {
	content: "";
	position: absolute;
	z-index: -1;
	inset: 0;
	padding: 1px;
	border-radius: inherit;
	background: linear-gradient(to right, #F7D4DA, transparent);
	-webkit-mask:
		linear-gradient(#fff 0 0) content-box,
		linear-gradient(#fff 0 0);
				mask:
		linear-gradient(#fff 0 0) content-box,
		linear-gradient(#fff 0 0);
-webkit-mask-composite: xor;
	mask-composite: exclude;
}

main > figure blockquote > p {
	display: block;
	color: #FFFFFF;
	text-align: center;
	margin: 0;
	position: relative;
	top: 0.5rem;
}

main > figure blockquote > p:before {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	content: '“';
	font-size: 4.3rem;
	text-align: center;
	line-height: 0;
}

main > figure blockquote > p > span {
	font-size: 0.75rem;
}

main > article {
	position: relative;
	font-size: 1.75rem;
}

main > article img {
	margin-top: 1rem;
	margin-right: 1rem;
	height: 5rem;
	width: 100%;
	object-fit: contain;
	object-position: right;
}

main > article h1 {
	margin: 0 3vw;
	font-size: 1em;
}

main > article form {
	display: flex;
	flex-direction: column;
	width: fit-content;
	margin: 0 auto;
}

main > article form :is(label, input) {
	font-weight: bold;
	font-size: 0.625em;
	margin-bottom: 0.25rem;
}

main > article form input {
	height: 3rem;
	width: min(100%, 22.5rem);
	margin-bottom: 1rem;
	padding: 1rem 1.5rem;
	position: relative;
	border-radius: 999px;
	border: 1px solid color-mix(in srgb, transparent, var(--accent-text-colour) 25%);
}

main > article form > label:after {
	position: absolute;
	content: '*';
	color: var(--accent-text-colour);
}

main > article form > label[hidden] + :is(input, span:has(input)) {
	display: none;
}

main > article h1 {
	margin-bottom: 3rem;
}

main > article form p {
	color: #9F6070;
	font-size: 0.75rem;
	text-align: center;
}

main > article button {
	font-size: 0.625em;
	cursor: pointer;
	color: white;
	display: block;
	margin: 0 auto;
	padding: 1rem 0;
	width: 100%;
	border-radius: 999px;
	border-style: none;
	font-weight: bold;
	background-position-x: 100%;
	background-position-y: 0%;
	background-size: 400% 200%;
	background-image: linear-gradient(to top right, #A0A0A0, #606060, #80002E, #FF005D);
	transition: box-shadow 0.25s, background-position 1s;
}

main > article:disabled {
	cursor: default;
	background-position-x: 0%;
	background-position-y: 100%;
}

main > article :not(:disabled, ::after, :nth-of-type(3)):hover {
	box-shadow: 0 0 5px #80002E;
}

main > article form span {
	display: inline-flex;
	align-items: center;
gap: 1rem;
}

main > article form p#requestCode {
	position: relative;
	top: -0.5rem;
	cursor: pointer;
}
`,
`
/* Statement at-rules */

@import url("stylesheet.css") screen and (max-width: 400px);

/* Selectors */

h1 {
	color: red
}

.class-name {
	font-size: 16px
}

#unique-id {
	background-color: blue;

	/* Pseudo-classes */

	&:hover {
		text-decoration: underline;
	}

	:focus {
		border-color: green
	}

	/* Pseudo-elements */

	::first-line {
		font-weight: bold;
	}

	&::before {
		content: "• ";
	}
}

/* Properties and values */

input[type="text"]:disabled {
	width: 100%;
	height: 200px;
	background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAFYWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIgogICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgZXhpZjpQaXhlbFhEaW1lbnNpb249IjUxMiIKICAgZXhpZjpQaXhlbFlEaW1lbnNpb249IjUxMiIKICAgZXhpZjpDb2xvclNwYWNlPSIxIgogICB0aWZmOkltYWdlV2lkdGg9IjUxMiIKICAgdGlmZjpJbWFnZUxlbmd0aD0iNTEyIgogICB0aWZmOlJlc29sdXRpb25Vbml0PSIyIgogICB0aWZmOlhSZXNvbHV0aW9uPSIxNDQvMSIKICAgdGlmZjpZUmVzb2x1dGlvbj0iMTQ0LzEiCiAgIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiCiAgIHBob3Rvc2hvcDpJQ0NQ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');
}

span::first-of-type {
	margin: 10px;
	padding: 5px;
	border: 1px solid black;
	border-radius: 5px;
}

/* Box Model */

.box .container {
	width: 80%;
	margin: 0 auto;
	padding: 20px;
	border: 1px solid #ccc;
	box-sizing: border-box !important;

	> button {
		white-space: nowrap;
	}

	&.active {
		color: red;
	}

	li:has(> span) {
		text-decoration: underline;
	}
}

/* Typography */

p {
	font-family: Arial, sans-serif;
	font-size: 14px;
	line-height: 1.5;
}

h2.bold {
	font-size: 1.5rem;
	font-weight: bold;
}

/* Flexbox */

.flex-container {
	display: flex;
	justify-content: center;
	align-items: center;
}

/* Grid */

.grid-container {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-gap: 20px;
}

/* Transitions and Animations */

.button {
	background-color: #007bff;
	color: #fff;
	padding: 10px 20px;
	border: none;
	cursor: pointer;
	transition: background-color 0.3s ease;

	&:hover {
		background-color: #0056b3;
	}
}

/* Block at-rules */

@media screen and (max-width: 600px) {
	body {
		background-color: lightblue;

		&:hover {
			background-color: pink;
		}
	}

	.container {
		width: 100%;
		padding: 10px;
	}

	.grid-container {
		grid-template-columns: 1fr;
	}
}

/* Comments */

/* This is a comment */
`,
`
html, body {
	flex-direction: row;
	overflow: hidden;
}

main {
	> section > #wrapper {
		width: fit-content;
		margin: 0 auto;
	}

	header button {
		border: none;
		padding: 1rem 1.5rem;
		padding-left: calc(1.5rem + 2.5ex + 1ch);
		background: url(https://img.icons8.com/fluency-systems-filled/96/FFFFFF/plus-math.png) 1.5rem 1rem no-repeat scroll;
		background-size: 2.5ex;
		background-color: var(--bg-colour);
		border-radius: 1rem;
		color: #FFFFFF;
		cursor: pointer;
		line-height: 130%;
		transition: 0.25s;
		font-size: 0.875rem;
		white-space: nowrap;
		--bg-colour: var(--primary-colour);

		&:first-child {
			--bg-colour:var(--secondary-colour);
		}

		&:hover {
			background-color: color-mix(in srgb, black, var(--bg-colour) 90%);
		}
	}

	> section > div > div {
		display: grid;
		grid-template-columns: repeat(5, minmax(min-content, 1fr));
		grid-template-rows: 8rem repeat(4, minmax(8rem, auto)) 1fr;
		--gap:2rem;
		grid-gap: var(--gap);
		margin: 0 auto;

		&::after {
			content: "";
			display: flex;
			height: calc(var(--main-padding) - var(--gap));
			width: 100%;
		}
	}

	article {
		display: flex;
		padding: 2rem;
		min-height: 8rem;
		border-radius: 1rem;
		align-items: center;
		background: var(--panel-bg-colour);
		gap: 1rem;

		> img {
			height: 75%;
			padding: 0.5rem;
			border-radius: 0.5rem;
			background: color-mix(in srgb, white, var(--primary-colour) 10%);
		}

		&:nth-child(-n+3) > div {
			display: flex;
			flex-direction: column;
			justify-content: center;
			position: relative;
		}
	}

	#account div:last-of-type {
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
	}

	article {
		> div {
			> h3 {
				margin: 0;
				margin-top: -0.5rem;
				color: var(--secondary-colour);
				white-space: nowrap;
			}

			> h5 {
				margin: 0;
				color: color-mix(in srgb, white, var(--primary-colour) 75%);
				white-space: nowrap;
			}
		}

		&#appointments-info {
			grid-column: span 2;
			grid-row: span 6;
			flex-direction: column;

			> div {
				display: inherit;
				flex-direction: column;
				gap: 1rem;
				width: 100%;
			}

			#calendar-header {
				display: inherit;
				flex-direction: row;
				justify-content: space-between;

				> h1 {
					margin: 0;
				}
			}

			#calendar-days {
				display: inherit;
				flex-direction: row;
				gap: 1ex;

				> div {
					flex: 1;
					padding: 1rem 0;
					border-radius: 0.5rem;
					display: inherit;
					flex-direction: column;
					justify-content: center;
					align-items: center;
					cursor: pointer;
					transition: 0.25s;
					border: 0.25rem solid transparent;
				}

				> .selected-day {
					color: white;
					background: color-mix(in srgb, black, var(--primary-colour) 75%);
				}

				> div:hover {
					color: unset;
					background: color-mix(in srgb, white, var(--primary-colour) 5%);
				}

				> .selected-day:hover {
					color: unset;
					background: color-mix(in srgb, white, var(--primary-colour) 5%);
					border-color: color-mix(in srgb, black, var(--primary-colour) 75%);
				}

				p {
					font-size: 0.75rem;
					margin: 0;
				}
			}

			> #appointments {
				h4 {
					margin: 0;
				}

				.day-group {
					display: inherit;
					flex-direction: column;
					gap: 1rem;

					> h6 {
						margin: 1rem 0;
						font-size: 1rem;
						color: color-mix(in srgb, white, var(--text-colour) 75%);
					}
				}

				.appointment {
					display: flex;
					height: 5rem;
					align-items: center;
					gap: 1rem;

					> div {
						width: 100%;
						height: 100%;
						display: inherit;
						gap: 0.5rem;
						padding: 1rem;
						background: color-mix(in srgb, white, var(--primary-colour) 10%);
						border-radius: 1rem;
						cursor: pointer;
					}

					img {
						height: 100%;
						border-radius: 1rem;

						+ div {
							display: inherit;
							flex-direction: column;
							justify-content: center;
						}
					}

					:is(h6, p) {
						margin: 0;
					}
				}
			}
		}

		&#appointments-stats {
			grid-column: span 3;
			grid-row: span 3;
			align-items: flex-start;
			flex-direction: column;

			> h1 {
				margin: 0;
				font-size: 1.5rem;
			}

			> #appts-stats-filter {
				height: 3.2rem;
				width: 100%;
				display: flex;
				flex-direction: row;
				justify-content: space-between;

				> div {
					display: inherit;
					gap: 2rem;
					align-items: center;
				}

				h4 {
					margin: 0;
				}

				div:has(> button) {
					display: inherit;
					gap: 0.5rem;
				}

				button {
					color: inherit;
					background: color-mix(in srgb, white, var(--primary-colour) 10%);
					border: none;
					cursor: pointer;
					padding: 0.5rem calc(0.5rem + 0.5ex);
					line-height: 100%;
					font-weight: 700;
					border-radius: 0.5rem;
				}
			}
		}

		&#appointments-info #calendar-navigation button {
			color: inherit;
			background: color-mix(in srgb, white, var(--primary-colour) 10%);
			border: none;
			cursor: pointer;
			padding: 0.5rem calc(0.5rem + 0.5ex);
			line-height: 100%;
			font-weight: 700;
			border-radius: 0.5rem;
		}

		&#appointments-stats > #appts-stats-filter button:hover,
		&#appointments-info #calendar-navigation button:hover,
		&#latest-patient-info tr:has(td):hover,
		&#appointments-info > #appointments .appointment > div:hover {
			background: color-mix(in srgb, white, var(--primary-colour) 15%);
		}

		&#appointments-stats {
			> #appts-stats-filter select {
				color: inherit;
				background: color-mix(in srgb, white, var(--primary-colour) 10%);
				outline: none;
				border: none;
				cursor: pointer;
				padding: 0.5rem;
				border-right: 0.5rem solid transparent;
				font-weight: 600;
				border-radius: 0.5rem;

				&:hover {
					background: color-mix(in srgb, white, var(--primary-colour) 15%);
				}

				&:focus {
					box-shadow: 0px 0px 7.5px gray;
				}
			}

			> figure {
				height: 100%;
				width: 100%;
				margin: 0;
			}
		}

		&#latest-patient-info {
			grid-column: span 3;
			grid-row: span 2;
			display: table;
			padding-bottom: 1rem;

			table {
				width: 100%;
				border-collapse: separate;
				border-spacing: 0 1rem;
			}

			tr {
				&:has(td) {
					cursor: pointer;
					background: color-mix(in srgb, transparent, var(--primary-colour) 5%);
					--border-radius:13px;
				}

				> th {
					padding: 0 1.5rem;
					text-align: left;
				}

				> td {
					padding: 1.5rem;

					&:first-child {
						border-top-left-radius: var(--border-radius);
						border-bottom-left-radius: var(--border-radius);
					}

					&:last-child {
						border-top-right-radius: var(--border-radius);
						border-bottom-right-radius: var(--border-radius);
					}
				}
			}
		}
	}
}
`,
`
body {
	margin: 0;
	box-sizing: border-box;
	overflow: hidden;
}

.demo-section {
	height: 50vh;
	width: 100%;
	display: flex;
	justify-content: center;
	counter-reset: div;

	&:nth-of-type(2) {
		background-color: black;
	}
}

.parent-element {
	display: flex;
	position: relative;
	margin: 0 auto;
	background-color: #dcdcdc;
	width: calc(50% + 20px);
	height: 50%;
	counter-reset: div;

	& div {
		position: relative;
		border: 1px solid grey;
		padding: 5px;
		flex-basis: 33%;
		background-color: #fff;
		border-radius: 5%;
		cursor: pointer;

		&:before {
			counter-increment: div;
			content: counter(div)".";
		} 

		&:focus:not(:active) {
			content: "";
		}

		&:hover {
			background-color: aquamarine;
			transition: 0.5s;
		}

		&:active {
			position: absolute;
			top: 100%;
			width: inherit;
			transition: 0.3s;
			height: 50px;
			border-radius: 5px;
			animation-name: expandX;
			animation-duration: 1.5s;
			animation-iteration-count: 1;
			animation-fill-mode: forwards;

			&:active:hover {
				animation-name: expandY;
				animation-duration: 1.5s;
				animation-iteration-count: 1;
				animation-fill-mode: forwards;
			}

			&:hover:after {
				animation: fadein 1.5s;
				font-size: 16px;
			}

			&:first-child {
				&:active:after {
					content: " First box test content";
				}
				&:hover:after {
					content: " Test Hover Content one. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
				}
				&:active:hover {
					background-color: pink;
				}
			}

			&:nth-child(2) {
				&:active:after {
					content: " Second box test content";
				}
				&:hover:after {
					content: " Test Hover Content two. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
				}
				&:active:hover {
					background-color: cadetblue;
				}
			}

			&:last-of-type {
				&:active:after {
					content: " Third box test content";
				}
				&:hover:after {
					content: " Test Hover Content three. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
				}
				&:active:hover {
					background-color: cornflowerblue;
				}
			}
		}
	}
}

@keyframes expandX {
	from {
		width: inherit;
	}
	to {
		width: calc(100% - 10px);
	}
}

@keyframes expandY {
	from {
		height: inherit;
		width: calc(100% - 10px);
	}
	to {
		height: 100%;
		width: calc(100% - 10px);
	}
}

@keyframes fadein {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}


.circle  {
	width: 400px;
	height: 400px;
	border: 1px solid red;
	border-radius: 50%;

	& div {
		width: 90%;
		height: 90%;
		opacity: 0;
		color: #fff;
		counter-increment: div;
		border: 1px solid;
		border-color: blue;

		&:before {
			content: counter(div)".";
		}
	}

	& :hover {
		animation: fadein;
		animation-duration: 1.5s;
		animation-fill-mode: forwards;
	}

	&:active {
		animation-name: translate;
		animation-duration: 1.5s;
		animation-iteration-count: infinite;
		animation-fill-mode: forwards;
		transition: 2s;
	}
}

@keyframes translate {
	0% {
		transform: rotate(-90deg);
	}
	25% {
		transform: rotate(90deg);
	}
	50% {
		transform: rotate(180deg);
	}
	100% {
		transform: rotate(-180deg);
	}
}
`
];

function nestCode() {
	let mainSection = document.getElementsByTagName('main')[0];
	mainSection.classList.toggle('nesting');

	const annotations = inputEditor.getSession().getAnnotations().filter((a) => a.type == 'error');
	if (annotations.length == 0) {
		outputEditor.getSession().setValue(convertToNestedCSS(inputEditor.getValue()) || '/* Your output CSS will appear here */');
	} else {
		console.log('Code Errors:', annotations);
		outputEditor.getSession().setValue('/* Your input CSS contains errors */');
		
		// Show a list of the errors if any.
		
		// "Your code doesn't seem to be valid, do you want to try nesting anyways?"
		// "It may not work properly."
	}
};

function convertToNestedCSS(cssProvided, htmlString) {
	cssProvided = minimizeCSS(cssProvided);
	cssProvided = splitCSS(cssProvided);
	cssProvided = unnestCSS(cssProvided);
	cssProvided = renestCSS(htmlString, cssProvided);
	cssProvided = beautifyCSS(cssProvided);

	return cssProvided;
};

function minimizeCSS(cssProvided) {
	return cssProvided
		// Remove all comments
		.split('/*').map(part => part.split('*/').pop()).join('')

		// Join gaps together
		.replace(/\s+/g, ' ')

		// Close gaps between css property names, property values and rules
		.replace(/([,;:{}])\s/g, '$1')

		// Close gaps between prop name and open braces
		.replace(/\s{/g, '{')

		// Ensure proper spacing around @rules
		.replace(/\s*@/g, '@')

		// Ensure proper spacing after @rule and before {
		// .replace(/@(?!import)\w+\s*/g, (match) => {
		// 	return match.trim() + ' ';
		// });
}

function splitCSS(cssProvided) {
	// Initialize variables
	const parsedCSS = [];
	let unknown = '';
	let selector = '';
	let declaration = '';
	let curlyBracketCount = 0;
	let insideCurlyBrackets = false;
	let parenthesisDepth = 0;
	let bracketDepth = 0;
	let isInSingleQuotes = false;
	let isInDoubleQuotes = false;

	// Loop through each character in the provided CSS
	for (let i = 0; i < cssProvided.length; i++) {
		const char = cssProvided[i];

		// If inside brackets, add characters to declaration
		if (insideCurlyBrackets) {
			declaration += char;

			// Check for closing bracket
			if (char === '}') {
				curlyBracketCount--;

				// If all brackets are closed, push selector and declaration to parsedCSS
				if (curlyBracketCount === 0) {
					if (declaration.slice(-2, -1) == ';') declaration = declaration.slice(0, -2);
					else declaration = declaration.slice(0, -1);
					declaration = declaration.trim();

					// If declaration includes opening bracket, recursively call splitCSS
					if (declaration.includes('{')) declaration = splitCSS(declaration);
					parsedCSS.push([selector.trim(), declaration]);

					// Reset variables
					unknown = '';
					selector = '';
					declaration = '';
					insideCurlyBrackets = false;
				}
			}
			// Check for nested opening brackets
			else if (char === '{') {
				curlyBracketCount++;
			}
		}
		// If not inside brackets, check for declaration, selector or opening bracket
		else {
			if (char === ';' && !isInSingleQuotes && !isInDoubleQuotes && bracketDepth == 0 && parenthesisDepth == 0) {
				declaration += unknown + char;

				// Reset variables
				unknown = '';
				selector = '';
				insideCurlyBrackets = false;
			} else if (char === '{') {
				selector = unknown;
				if (declaration) parsedCSS.push(declaration), declaration = '';

				// Set insideBrackets to true and increment bracketCount
				insideCurlyBrackets = true;
				curlyBracketCount++;
			} else {
				unknown += char;
			}
			
			switch (char) {
				case '(':
					parenthesisDepth++;
					break;
				case ')':
					parenthesisDepth--;
					break;
				case '[':
					bracketDepth++;
					break;
				case ']':
					bracketDepth--;
					break;
				case '"':
					isInDoubleQuotes = !isInDoubleQuotes;
					break;
				case "'":
					isInSingleQuotes = !isInSingleQuotes;
					break;
			}
		}
	}

	// Return the parsed CSS
	return parsedCSS;
}

function unnestCSS(cssProvided, prefix = '') {
	// Initialize the parsed CSS array
	let parsedCSS = [];

	// Loop through each rule in the provided CSS
	for (let i = 0; i < cssProvided.length; i++) {

		// If the current rule is an array, it's a nested rule
		if (Array.isArray(cssProvided[i])) {
			// Extract the relative selector and declarations from the current rule
			let [relativeSelector, declarations] = cssProvided[i];

			// If the relative selector starts with '@', append a semicolon to it
			if (relativeSelector.startsWith('@')) relativeSelector += ';';

			// If the declarations are an array, there are nested rules within the current rule
			if (Array.isArray(declarations)) {
				let absoluteSelector = prefix + ((relativeSelector.startsWith('&:') || !prefix) ? '' : ' ') + relativeSelector;
				
				// If not all declarations are arrays, add them to the parsed CSS
				if (!declarations.every(Array.isArray)) {
					parsedCSS.push([absoluteSelector, declarations.filter((d) => typeof d === 'string').join(';')]);
				}

				// Recursively call the function to unnest the nested rules, and concatenate the result to the parsed CSS
				parsedCSS = parsedCSS.concat(unnestCSS(declarations.filter(Array.isArray).map(([nestedSelector, nestedDeclarations]) => [nestedSelector, nestedDeclarations]), absoluteSelector));
			} else {
				// If the declarations are not an array, add them to the parsed CSS

				// Split selector groups:
				let splitSelectors = [];
				let currentSelector = '';
				let parenthesisDepth = 0;
				let bracketDepth = 0;
				let isInSingleQuotes = false;
				let isInDoubleQuotes = false;

				for (let i = 0; i < relativeSelector.length; i++) {
					const char = relativeSelector[i];

					currentSelector += char;
					
					switch (char) {
						case '(':
							parenthesisDepth++;
							break;
						case ')':
							parenthesisDepth--;
							break;
						case '[':
							bracketDepth++;
							break;
						case ']':
							bracketDepth--;
							break;
						case '"':
							isInDoubleQuotes = !isInDoubleQuotes;
							break;
						case "'":
							isInSingleQuotes = !isInSingleQuotes;
							break;
					}

					if ((!currentSelector.startsWith('@') && char == ',' && parenthesisDepth == 0 && bracketDepth == 0 && !isInSingleQuotes && !isInDoubleQuotes) || (i + 1) == relativeSelector.length) {
						splitSelectors.push(currentSelector.split(',').join('').trim());
						currentSelector = '';
					}

					// This part of the code makes it clear an @at-rule is another nested selector.
					if (char == ';' && parenthesisDepth == 0 && bracketDepth == 0 && !isInSingleQuotes && !isInDoubleQuotes) {
						atRule = currentSelector + ' ';
						currentSelector = '';
					}
				}

				let splitSelectorsWithPrefix = splitSelectors.map((newSelector) => prefix + ((newSelector.startsWith('&:') || !prefix) ? '' : ' ') + newSelector);
				parsedCSS.push(...splitSelectorsWithPrefix.map((newSelector) => [newSelector, declarations]));
			}
		} else {
			// If the current rule is not an array, add it to the parsed CSS
			parsedCSS.push([cssProvided[i]])
		}
	}

	// Return the parsed CSS
	return parsedCSS;
}

function renestCSS(withHtml, cssProvided) {
	// Define regular CSS at-rules
	const regularAtRules = ['@charset', '@import', '@layer', '@namespace'];
	let parsedCSS = [];

	if (withHtml);
	else {
		// For each CSS rule provided

		cssProvided.forEach(([selector, declarations]) => {
			// Split the selector into parts
			let selectorParts = selector.split(' ');

			if (selector.includes('@')) {
				let newSelectorParts = [];
				let tempPart = '';

				// Iterate over the parts of the selector
				for (let i = 0; i < selectorParts.length; i++) {
					// If it's the start of the at rule, add a space and move on
					if (selectorParts[i].startsWith('@')) {
						tempPart += selectorParts[i] + ' ';
					} 
					// End of the declaration and move on to the next one
					else if (selectorParts[i].endsWith(';')) {
						tempPart += selectorParts[i].slice(0, -1);
						newSelectorParts.push(tempPart);
						tempPart = '';
					} 
					// If the temporary part is not empty, add the current part to it
					else if (tempPart !== '') {
						tempPart += selectorParts[i] + ' ';
					} 
					// If the temporary part is empty, push the current part to the new parts array
					else {
						newSelectorParts.push(selectorParts[i]);
					}
				}

				// Replace the original parts array with the new parts array
				selectorParts = newSelectorParts;

				// Handle pseudo selectors
				let parenthesisDepth = 0;

				// Split compound selectors
				for (let i = 0; i < selectorParts.length; i++) {
					// Process each part of the selector
					let nestedSelector = selectorParts[i];
					nestedSelector = nestedSelector.split('&:').join(':').split(':');

					if (nestedSelector[0] == '')
						if (nestedSelector[1] == '') nestedSelector.splice(0, 3, '::' + nestedSelector[2]);
						else nestedSelector.splice(0, 2, ':' + nestedSelector[1]);

					// Handle pseudo selectors
					for (let j = 0; j < nestedSelector.length; j++) {
						let pseudoSelector = nestedSelector[j];

						// Handle pseudo selectors with parentheses
						if (parenthesisDepth === 0) {
							if (pseudoSelector === '')
								nestedSelector[++j] = ' &::' + nestedSelector[j];
							else
								nestedSelector[j] = (j === 0 ? '' : ' &:') + pseudoSelector;
						} else nestedSelector[j] = ':' + nestedSelector[j];

						if (pseudoSelector.includes('('))
							parenthesisDepth += pseudoSelector.split('(').length - 1;
						if (pseudoSelector.includes(')'))
							parenthesisDepth -= pseudoSelector.split(')').length - 1;
					}

					selectorParts[i] = nestedSelector.join('');
					nestedSelector = selectorParts[i];
				}

				selectorParts = selectorParts.flatMap((part) => ((part.startsWith('@')) ? part : part.split(' ').map((pseudoPart) => pseudoPart.split(',').join(', '))));
			} else {
				// Handle pseudo selectors
				let openBracketCount = 0;

				// Split compound selectors
				for (let i = 0; i < selectorParts.length; i++) {
					// Process each part of the selector
					let nestedSelector = selectorParts[i];
					nestedSelector = nestedSelector.split('&:').join(':').split(':');

					if (nestedSelector[0] == '') {
						if (nestedSelector[1] == '') nestedSelector.splice(0, 3, '::' + nestedSelector[2]);
						else nestedSelector.splice(0, 2, ':' + nestedSelector[1]);
					}

					for (let j = 0; j < nestedSelector.length; j++) {
						let pseudoSelector = nestedSelector[j];

						// Handle pseudo selectors with parentheses
						if (openBracketCount === 0) {
							if (pseudoSelector === '')
								nestedSelector[++j] = ' &::' + nestedSelector[j];
							else
								nestedSelector[j] = (j === 0 ? '' : ' &:') + pseudoSelector;
						} else nestedSelector[j] = ((j == 0 && nestedSelector.length == 1) ? '' : ':') + nestedSelector[j];

						// Update depths for parentheses
						if (pseudoSelector.includes('('))
							openBracketCount += pseudoSelector.split('(').length - 1;
						if (pseudoSelector.includes(')'))
							openBracketCount -= pseudoSelector.split(')').length - 1;
					}

					selectorParts[i] = nestedSelector.join('');

					nestedSelector = selectorParts[i];
				}

				function endsWithCSSEscape(str) {
					if (str.length === 0) return false;
				
					// Check for hexadecimal Unicode code points
					if (str.endsWith('\\')) return false; // A single backslash at the end is not valid
					if (str.endsWith('\\0') || str.endsWith('\\00')) return true; // Null character escape
					if (str.endsWith('\\\9') || str.endsWith('\\09')) return true; // Tab character escape
				
					// Check for shorter escapes
					const hexDigits = '0123456789abcdefABCDEF';
					let i = str.length - 1;
					let count = 0;
				
					while (i >= 0 && hexDigits.includes(str[i])) {
						count++;
						i--;
					}
				
					if (count > 0 && str[i] === '\\') {
						return true;
					}
				
					// Check for special characters
					const specialChars = ['\\n', '\\r', '\\f', '\\v', '\\t', '\\b'];
					for (let char of specialChars) {
						if (str.endsWith(char)) {
							return true;
						}
					}
				
					return false;
				}

				selector = selectorParts.join(' ');
				selectorParts = selector.split(' ').reverse().filter((item, i, arr) => {
					if (arr[i + 1] && endsWithCSSEscape(arr[i + 1])) {
						arr[i + 1] += ' ' + item;
						return false;
					} else return true;
				}).reverse().map((part) => part.split(',').join(', '));

				// Join parts linked by brackets & child combinators
				const combinators = ["+", ">", /*"||",*/ "~"];
				let nestedSelectorDepth = 0;
				let startIndex = -1;

				for (let i = 0; i < selectorParts.length; i++) {
					let nestedSelector = selectorParts[i];

					// Handle combinators
					if (nestedSelector.includes('(')) {
						if (nestedSelectorDepth === 0) startIndex = i;
						nestedSelectorDepth += nestedSelector.split("(").length - 1;
					}

					if (nestedSelector.includes(')')) {
						nestedSelectorDepth -= nestedSelector.split(")").length - 1;

						if (nestedSelectorDepth === 0)
							selectorParts.splice(startIndex, i - startIndex + 1, selectorParts.slice(startIndex, i + 1).join(' '));
					}

					if (combinators.includes(nestedSelector))
						selectorParts.splice(i, 2, nestedSelector + ' ' + selectorParts[i + 1]);

					// else if (combinators.some(char => parts[i].includes("|"))) {
					//   // Namespace separator
					// } else if (combinators.some(char => parts[i].includes("["))) {
					//   // Attributes
					// }
				}
			}

			// Actually nest the CSS
			let currentLevel = parsedCSS;

			function addSpaceAfterComma(declarations) {
				if (!declarations) return declarations;

				// Split the declarations by comma
				let parts = declarations.split(',');
			
				// Use map to process each part
				let result = parts.map((part, index, array) => {
					// Check if the part contains 'url(' and if it's not the last part
					if (part.includes('url(') && index < array.length - 1) {
						// Combine the current part with the next part
						array[index + 1] = part + ',' + array[index + 1];
						return null; // Skip this part
					}
					return part;
				}).filter(Boolean); // Remove null values
			
				// Join the parts back with ', '
				return result.join(', ');
			}

			selectorParts.forEach((part, i) => {
				let existingIndex = currentLevel.findIndex(([s]) => s === part);

				if (existingIndex == -1) {
					let newPart = [part, []];

					if (i === selectorParts.length - 1) {
						if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);
						newPart[1].push([addSpaceAfterComma(declarations)]);
					}

					currentLevel.push(newPart);
					currentLevel = newPart[1];
				} else {
					let currentDeclarations = currentLevel[existingIndex][1][0];

					if (i === selectorParts.length - 1) {
						if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);


						if (currentDeclarations.length > 1)  {
							currentLevel[existingIndex][1].unshift([addSpaceAfterComma(declarations)]);
						} else {
							if (declarations) currentLevel[existingIndex][1][0] = [currentDeclarations[0] + ';' + addSpaceAfterComma(declarations)];
						}

					}
					currentLevel = currentLevel[existingIndex][1];
				}
			});
		});

		// Return the parsed CSS
		return parsedCSS;
	}
}

function beautifyCSS(declarations, indent = '') {
	// Initialize the parsed CSS string
	let parsedCSS = '';
	const indentChar = '	';

	// Loop through each declaration
	for (let i = 0; i < declarations.length; i++) {
		// If the declaration has a selector and nested declarations
		if (declarations[i].length == 2) {
			// If no declarations, combined current selector and nested declaration's selectors
			let [selector, nestedDeclarations] = declarations[i];

			while (!selector.startsWith('@') && nestedDeclarations.length === 1 && nestedDeclarations[0].length === 2 && !nestedDeclarations[0][0].startsWith('@')) {
				let [childSelector, childDeclarations] = nestedDeclarations[0];
				
				if (childSelector.startsWith('&')) childSelector = childSelector.slice(1);
				else childSelector = ' ' + childSelector;

				selector += childSelector;
				nestedDeclarations = childDeclarations;

				declarations[i] = [selector, nestedDeclarations];
			}

			let declarationsForSelector = nestedDeclarations[0];

			// If the selector has no declarations, add it to the parsed CSS string
			if (typeof declarationsForSelector[0] === "undefined") {
				parsedCSS += ((declarations[0][0] == selector) ? '' : '\n\n') + indent + selector + ';';
				continue; // Move on to the next mested declaration
			}

			// Add the selector to the parsed CSS string
			parsedCSS += ((declarations[0][0] == selector) ? '' : '\n\n') + indent + selector + ' {\n';

			// If the selector has declarations
			if (declarationsForSelector.length == 1) {
				const properties = declarationsForSelector[0].match(/[^;:()]+(?:\([^()]*\))?[^;:()]*:[^;:()]+(?:\([^()]*\))?[^;:]*/g) || [];
				const uniqueProperties = new Map();
			
				properties.forEach(property => {
					const [key, value] = property.split(/:(.+)/).map(item => item.trim());
					uniqueProperties.set(key, value);
				});

				declarationsForSelector[0] = Array.from(uniqueProperties).map(([key, value]) => `${key}:${value}`).join(';');

				let declarationsString = '';
				let currentDeclaration = '';
				let parenthesisDepth = 0;
				let bracketDepth = 0;
				let isInSingleQuotes = false;
				let isInDoubleQuotes = false;

				// Loop through each character in the declarations
				for (let char of nestedDeclarations[0][0]) {
					// Handle semicolons, colons, quotes, and escape characters
					if (char === ';' && !isInSingleQuotes && !isInDoubleQuotes && bracketDepth == 0 && parenthesisDepth == 0) {
						declarationsString += currentDeclaration.trim() + ';\n';
						currentDeclaration = '';
					} else if (char === ':' && !isInSingleQuotes && !isInDoubleQuotes && bracketDepth == 0 && parenthesisDepth == 0) {
						if (declarationsString.slice(-1)[0] == '\n' || typeof declarationsString.slice(-1)[0] == "undefined") {
							declarationsString += indent + indentChar + currentDeclaration.trim() + ': ';
							currentDeclaration = '';
						}
					} else {
						switch (char) {
							case '(':
								parenthesisDepth++;
								break;
							case ')':
								parenthesisDepth--;
								break;
							case '[':
								bracketDepth++;
								break;
							case ']':
								bracketDepth--;
							case '"':
								isInDoubleQuotes = !isInDoubleQuotes;
								break;
							case "'":
								isInSingleQuotes = !isInSingleQuotes;
								break;
						}

						currentDeclaration += char;
					}
				}

				// Add the remaining declaration to the parsed CSS string
				if (currentDeclaration.trim()) declarationsString += currentDeclaration.trim() + ';' + ((nestedDeclarations.length > 1) ? '\n\n' : '');

				nestedDeclarations.shift();
				parsedCSS += declarationsString;
			}

			// If there are nested declarations, recursively call beautifyCSS
			if (nestedDeclarations.length > 0 && Array.isArray(nestedDeclarations[0])) {
				parsedCSS += beautifyCSS(nestedDeclarations, indent + indentChar);
			}

			// Close the selector
			parsedCSS += '\n' + indent + '}';
		}
	}

	// Return the beautified CSS
	return parsedCSS;
}