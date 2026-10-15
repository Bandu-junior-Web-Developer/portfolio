# Portfolio Website

A single-page personal portfolio built with HTML, CSS and vanilla JavaScript. No frameworks, no build step.

## View it

Open `index.html` in a browser. Nothing needs to be installed.

## Structure

```
index.html            page content and SEO tags
css/style.css         design tokens, components, animations
css/responsive.css    media queries (laptop, tablet, mobile, reduced motion)
js/main.js            navigation, scroll reveal, project filter, modal, contact form
assets/images/        profile photo and project screenshots
assets/icons/         favicon
assets/certificates/  certificate files for the View Certificate buttons
robots.txt            crawler rules
sitemap.xml           sitemap
```

## Replace the placeholder content

Everything personal is placeholder text. Search `index.html` for `TODO` to find each block.

| What | Where |
| --- | --- |
| Profile photo | About section (still a placeholder drawing) |
| Project screenshot | Projects section (still a placeholder drawing) |
| More projects | Projects section. Copy the existing card; the comment above it explains how |
| Experience | Job title, company name and dates are still general |
| Education | Degree name, study period and subjects are still general |
| Certificates | A ready-to-use block is commented out at the end of the Education section |
| LinkedIn and Facebook | Not shown yet. Add a link next to the GitHub one in the hero, contact section and footer |
| Site URL | Set to `https://bandu246.github.io/` in `index.html`, `robots.txt` and `sitemap.xml` |

### Images

- Profile photo: add `assets/images/profile.webp` and update the `src` in the About section.
- Project screenshots: replace `assets/images/project-1.svg` to `project-6.svg`, or point each card at a new file. A 16:10 ratio fits best.
- Social sharing image: add `assets/images/og-image.png` (1200 × 630). The Open Graph tag already points to it.

### Add a project

Copy one `<article class="project-card">` block and set `data-category` to `web`, `programming`, `uiux` or `other`. The text inside `<template class="project-card__details">` is what the View Details window shows.

### Change the colours

All colours, fonts and spacing are CSS variables at the top of `css/style.css`.

## Contact

The page has no contact form. Visitors reach you through the email, phone and GitHub links in the Contact section. To change them, edit that section in `index.html` (and the email in the Ctrl+K command menu in `js/main.js`).

## Publish on GitHub Pages

1. Create a repository named `your-username.github.io`.
2. Push these files to the `main` branch.
3. In the repository, open Settings, then Pages, and set the source to the `main` branch.
4. The site appears at `https://your-username.github.io/`.
