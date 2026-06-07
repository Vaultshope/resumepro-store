# Contributing to ResumePro

Thanks for your interest in contributing! Here's how to get started:

## Adding a New Template

1. Create a new HTML file in `templates/` named after your template ID, e.g., `templates/mynew.html`
2. Follow the existing template structure: `@media print` CSS, Google Fonts, sections for Contact, Summary, Experience, Education, Skills
3. Add an entry to the `templates` array in `index.html` with `id`, `name`, `style`, `bg`, `color`, `audience`, `desc`, and `price`
4. Run `npm run preview:capture` to generate a preview screenshot
5. Place the screenshot in `previews/` as `{id}.png`
6. Run `npm test` to validate everything is wired correctly

## Development

```bash
npm install
npm run serve     # Start local server at localhost:8000
npm test          # Run validation
```

## Code Style

- Use existing template conventions (Tailwind + custom print CSS)
- Keep templates self-contained (no external JS dependencies except fonts)
- Maintain ATS-friendly layouts

## Before Submitting

- Run `npm test` and confirm 0 errors
- Preview the template at `http://localhost:8000/templates/{id}.html`
- Check print output at 120% zoom in browser print preview
