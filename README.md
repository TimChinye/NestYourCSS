# 🛑 This Repository is Archived

This repository contains the original source code for **Nest Your CSS** when it was maintained solely by me, as a personal portfolio project, from the absolute start to the final, complete MVP. The project has since graduated to a dedicated open-source organization to better support its growth and encourage community contributions.

### Please visit [the new, active repository](https://github.com/NestYourCSS/NestYourCSS) for the latest code, to open issues, or to contribute.


_(The original README for the project is preserved below for historical context.)_

# Nest Your CSS

![Nest Your CSS Github Banner](https://github.com/user-attachments/assets/193bee28-d84c-4e47-8241-b152aa1b0f3a)

An Awwwards-inspired online converter tool to minify, beautify, denest, and nest CSS code according to the latest CSS specs. This project started as a simple utility and evolved into a personal masterclass in modern, framework-less front-end development, focusing on performance, accessibility, and cutting-edge CSS features.

<p align="center">
  <a href="https://nestyourcss.com/">View Website</a>
  ·
  <a href="https://www.figma.com/design/D4ZY8722MG7WeCsUgCfDup/Nest-Your-CSS">View Figma Design</a>
  ·
  <a href="https://codepen.io/collection/EPYjje/?sort_by=ItemCreatedAt">View Codepen Collection</a>
</p>

---

## Table of Contents

- [About The Project](#about-the-project)
- [Built With](#built-with)
- [Features](#features)
- [Key Learning Points](#key-learning-points)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About The Project

About a year ago, I learned about the native CSS Nesting module but was surprised to find no simple, pure CSS converters online. The available tools were primarily CSS-to-SCSS converters that often produced code requiring significant manual cleanup.

So, I built my own.

What began as a simple MVP spiralled into a personal challenge: could a basic A-to-B converter be transformed into a portfolio-worthy, "Awwwards-level" website? While I'm not a designer, this journey was an incredible learning experience that massively solidified my front-end fundamentals.

**The result is [`nestyourcss.com`](https://nestyourcss.com/) a free, open-source tool with no backend and no sign-up required.**

## Built With

This project is a testament to the power of web fundamentals, built with **zero frameworks**.

-   HTML5 (Semantic & ARIA-enhanced)
-   CSS3 (Utilizing modern features like `@layer`, Container Queries, and Relative Color Syntax)
-   Vanilla JavaScript (ES6+)
-   [Ace Editor](https://ace.c9.io/) for the code editing experience
-   [Lenis](https://lenis.studiofreight.com/) for smooth scrolling effects

## Features

-   **Nest CSS:** Convert standard CSS to the latest native nested syntax.
-   **Denest CSS:** Flatten nested CSS back to standard, browser-compatible CSS.
-   **Minify CSS:** Optimize your stylesheets by removing unnecessary characters.
-   **Beautify CSS:** Format and indent your code for maximum readability and maintainability.
-   **Customizable Editor:** Adjust font, font size, indentation, and word wrap to your preference.
-   **Load External CSS:** Fetch and convert stylesheets directly from a URL.
-   **Deep Accessibility:** Fully navigable and usable with screen readers, thanks to extensive ARIA implementation.
-   **Awwwards-Inspired UI/UX:** A focus on smooth animations, visual appeal, and a high-quality user experience.

## Key Learning Points

This project accidentally became a masterclass modern-day front-end web development. Here are the biggest takeaways:

- **The 'Why' Behind Frameworks:** I now have a fundamental appreciation for why frameworks exist. Experiencing the frustrations of vanilla CSS & JS firsthand really gives you a deep understanding of the problems frameworks solve, but I also now value the fine-grained control you get from them.

- **Performance, by Default:** Treating Lighthouse as a guide rather than a final score, explored the Performance and Rendering tabs in DevTools, and began naturally favouring composite-only CSS properties for animations while I code.

- **The Hidden Cost of AI:** Dabbled in using a little AI to speed up boilerplate JS code - it worked well, but also introduced subtle bugs that often decided not to surface until days, sometimes weeks later. This taught me the importance of genuinely understanding every line of code you ship. `// TODO: completely revamp nesting logic`.

- **Real-World Accessibility:** Writing crawler-friendly, semantic HTML wasn't enough. Dove deep into the world of ARIA's roles and properties to make the site genuinely usable with screen readers.

- **Modern CSS is awesome:** I got to play with everything from `@layer` and container queries to relative color syntax. It pushed me to follow W3C drafts, and now I seriously can't wait for native mixins and functions (currently on the standards track!).

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgements

-   [Ace Editor](https://ace.c9.io/)
-   [Lenis](https://lenis.studiofreight.com/)
-   [Figma](https://www.figma.com/)
-   [Codepen](https://codepen.io/)
-   [Scroll-Driven Animations Debugger Chrome Extension](https://chromewebstore.google.com/detail/ojihehfngalmpghicjgbfdmloiifhoce)
