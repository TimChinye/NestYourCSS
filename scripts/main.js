let cssSamples = [
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

@import url("stylesheet.css") supports(not (display: grid) and (display: flex)) screen and (max-width: 400px);

/* Comments */

/* This is a comment */

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
	background: linear-gradient(to right, red, yellow);
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

/* Media queries */

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

document.getElementsByTagName('button')[0].addEventListener('click', () => {
	differ.getEditors().right.setValue(convertToNestedCSS(differ.getEditors().left.getValue()))
});

/*
CodeMirror: CodeMirror is a versatile text editor implemented in JavaScript for the browser. It supports diffing out of the box with the merge addon1. For auto-reloading, you might need to implement it yourself or use a library like live-server.
Ace: Ace is a high performance code editor for the web. It supports diffing through the Ace-diff plugin. However, similar to CodeMirror, auto-reloading might need to be implemented separately.
Monaco Editor: Monaco Editor is the code editor that powers VS Code. It supports diffing natively. For auto-reloading, you might need to use the FileSystemProvider API to watch for changes in the file system.
*/

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
		.replace(/@\w+\s*/g, (match) => {
			return match.trim() + ' ';
		})
}

function splitCSS(cssProvided) {
    // Initialize variables
    const parsedCSS = [];
    let unknown = '';
    let selector = '';
    let declaration = '';
    let bracketCount = 0;
    let insideBrackets = false;

    // Loop through each character in the provided CSS
    for (let i = 0; i < cssProvided.length; i++) {
        const char = cssProvided[i];

        // If inside brackets, add characters to declaration
        if (insideBrackets) {
            declaration += char;

            // Check for closing bracket
            if (char === '}') {
                bracketCount--;

                // If all brackets are closed, push selector and declaration to parsedCSS
                if (bracketCount === 0) {
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
                    insideBrackets = false;
                }
            }
            // Check for nested opening brackets
            else if (char === '{') {
                bracketCount++;
            }
        }
        // If not inside brackets, check for declaration, selector or opening bracket
        else {
            if (char === ';') {
                declaration += unknown + char;

                // Reset variables
                unknown = '';
                selector = '';
                insideBrackets = false;
            } else if (char === '{') {
                selector = unknown;
                if (declaration) parsedCSS.push(declaration), declaration = '';
				/*
				declaration && parsedCSS.push(declaration), declaration = '';
				*/

                // Set insideBrackets to true and increment bracketCount
                insideBrackets = true;
                bracketCount++;
            } else {
                unknown += char;
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

            // Construct the absolute selector by appending the relative selector to the prefix
            let absoluteSelector = prefix + (relativeSelector.startsWith('&:') ? '' : ' ') + relativeSelector;

            // If there's no prefix, the absolute selector should be the same as the relative selector
            if (!prefix) absoluteSelector = relativeSelector;

            // If the declarations are an array, there are nested rules within the current rule
            if (Array.isArray(declarations)) {
                // If not all declarations are arrays, add them to the parsed CSS
                if (!declarations.every(Array.isArray)) {
                    parsedCSS.push([absoluteSelector, declarations.filter((d) => typeof d === 'string').join(';')]);
                }

                // Recursively call the function to unnest the nested rules, and concatenate the result to the parsed CSS
                parsedCSS = parsedCSS.concat(unnestCSS(declarations.filter(Array.isArray), absoluteSelector));
            } else {
                // If the declarations are not an array, add them to the parsed CSS
                parsedCSS.push([absoluteSelector, declarations]);
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

			// Split compound selectors
			for (let i = 0; i < selectorParts.length; i++) {
				if (selector.startsWith('@')) continue;

				// Process each part of the selector
				let nestedSelector = selectorParts[i];
				nestedSelector = nestedSelector.split('&:').join(':').split(':');

				if (nestedSelector[0] == '')
					if (nestedSelector[1] == '') nestedSelector.splice(0, 3, '::' + nestedSelector[2]);
					else nestedSelector.splice(0, 2, ':' + nestedSelector[1]);

				// Handle pseudo selectors
				let pseudoSelectorDepth = 0;

				for (let j = 0; j < nestedSelector.length; j++) {
					let pseudoSelector = nestedSelector[j];

					// Handle pseudo selectors with parentheses
					if (pseudoSelectorDepth === 0) {
						if (pseudoSelector === '')
							nestedSelector[++j] = ' &::' + nestedSelector[j];
						else
							nestedSelector[j] = (j === 0 ? '' : ' &:') + pseudoSelector;
					} else nestedSelector[j] = ':' + nestedSelector[j];

					if (pseudoSelector.includes('('))
						pseudoSelectorDepth += pseudoSelector.split("(").length - 1;

					if (pseudoSelector.includes(')'))
						pseudoSelectorDepth -= pseudoSelector.split(")").length - 1;
				}

				selectorParts[i] = nestedSelector.join('');
				selector = selectorParts.join(' ');

				nestedSelector = selectorParts[i];
			}

			selectorParts = selector.split(' ').map((part) => part.split(',').join(', '));

			// Join parts linked by brackets & child combinators
			const combinators = ["+", ">", /*"||",*/ "~"];
			let nestedSelectorDepth = 0;
			let startIndex = -1;

			for (let i = 0; i < selectorParts.length; i++) {
				let nestedSelector = selectorParts[i];

				// Handle at-rules
				if (selector.includes('@')) {
					// Initialize an array to hold the new parts of the selector
					let newSelectorParts = [];
					// Initialize a temporary part to hold the current part of the selector
					let tempPart = '';
					// Initialize an array to hold the parts of the selector
					let selectorParts;
					// Iterate over the parts of the selector
					for (let i = 0; i < selectorParts.length; i++) {
						// If the current part starts with '@', add it to the temporary part
						if (selectorParts[i].startsWith('@')) {
							tempPart += selectorParts[i] + ' ';
						} 
						// If the current part ends with ';', add it to the temporary part and push the temporary part to the new parts array
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

					// If the nested selector includes any regular at-rule, remove the last part of the selector parts
					if (regularAtRules.some((rAtRule) => nestedSelector.toLowerCase().includes(rAtRule))) selectorParts.pop();
					// If the selector parts array has two elements and the second one is empty, remove the second element
					// if (selectorParts.length == 2 && selectorParts[1] == '') selectorParts.pop();
				}
				else {
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
			selectorParts.forEach((part, i) => {
				let existingIndex = currentLevel.findIndex(([s]) => s === part);

				if (existingIndex == -1) {
					let newPart = [part, []];

					if (i === selectorParts.length - 1) {
						if (declarations?.endsWith(';')) declarations = declarations.slice(0, -1);
						newPart[1].push([declarations.split(',').join(', ')]);
					}

					currentLevel.push(newPart);
					currentLevel = newPart[1];
				} else currentLevel = currentLevel[existingIndex][1];
			});
		});
			
		// Return the parsed CSS
		return parsedCSS;
	}
}


function beautifyCSS(declarations, indent = '') {
    // Initialize the parsed CSS string
    let parsedCSS = '';

    // Loop through each declaration
    for (let i = 0; i < declarations.length; i++) {
        // If the declaration is an array
        if (Array.isArray(declarations[i])) {
            // If the declaration has a selector and nested declarations
            if (declarations[i].length == 2) {
                let [selector, nestedDeclarations] = declarations[i];
                let declarationsForSelector = nestedDeclarations[0];

                // If the selector has no declarations, add it to the parsed CSS string
                if (typeof declarationsForSelector[0] === "undefined") {
                    parsedCSS += '\n' + indent + selector;
                    continue;
                }

                // Add the selector to the parsed CSS string
                parsedCSS += ((declarations[0][0] == selector) ? '' : '\n\n') + indent + selector + ' {\n';

                // If the selector has declarations
                if (declarationsForSelector.length == 1) {
                    let declarationsString = '';
                    let currentDeclaration = '';
                    let isInQuotes = false;
                    let isEscaped = false;

                    // Loop through each character in the declarations
                    for (let char of nestedDeclarations[0][0]) {
                        // Handle semicolons, colons, quotes, and escape characters
                        if (char === ';' && !isInQuotes && !isEscaped) {
                            declarationsString += currentDeclaration.trim() + ';\n';
                            currentDeclaration = '';
                        } else if (char === ':' && !isInQuotes && !isEscaped) {
							if (declarationsString.slice(-1)[0] == '\n' || typeof declarationsString.slice(-1)[0] == "undefined") {
								declarationsString += indent + '  ' + currentDeclaration.trim() + ': ';
								currentDeclaration = '';
							}
                        } else {
                            if (char === '"') isInQuotes = !isInQuotes;
                            if (char === '\\' && !isEscaped) isEscaped = true;
                            else {
                                currentDeclaration += char;
                                isEscaped = false;
                            }
                        }
                    }

                    // Add the remaining declaration to the parsed CSS string
                    if (currentDeclaration.trim()) declarationsString += currentDeclaration.trim() + ';' + ((nestedDeclarations.length > 1) ? '\n\n' : '');

                    nestedDeclarations.shift();
                    parsedCSS += declarationsString;
                }

                // If there are nested declarations, recursively call beautifyCSS
                if (nestedDeclarations.length > 0 && Array.isArray(nestedDeclarations[0])) {

                    parsedCSS += beautifyCSS(nestedDeclarations, indent + '  ');
                }

                // Close the selector
                parsedCSS += '\n' + indent + '}';
            };
        }
    }

    // Return the beautified CSS
    return parsedCSS;
}