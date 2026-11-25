# Zyewu Studio

Website for Zyewu Studio, a creative studio for brand, web, illustration and motion.

**Live:** https://zyewu.co.za

## Overview

A static site with no build step and no dependencies: plain HTML, CSS and JavaScript.

- Home page with studio introduction, process and contact
- Nine project case-study pages (`project-1.html` to `project-9.html`)
- Scroll motion, a frosted navigation bar and a responsive layout down to mobile
- Favicon and touch icons for browser and home-screen use

## Structure

```text
.
├── index.html            home page
├── project-1.html ...    case studies
├── css/                  stylesheets
├── js/                   scripts
├── assets/               brand marks and project imagery
└── CNAME                 custom domain
```

## Run locally

```sh
python3 -m http.server 4173
```

Open <http://localhost:4173/>.

## Deployment

Served with GitHub Pages from the `main` branch at the custom domain in `CNAME`.

## Contact

Zyewu Studio · https://zyewu.co.za
