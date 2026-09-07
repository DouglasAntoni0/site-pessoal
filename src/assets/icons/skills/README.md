# Skill icon collection

The 62 icons are local, self-contained vectors inserted directly into the generated HTML. They do not load an external SVG symbol, icon font, image, CSS mask, filter, or JavaScript renderer. Explicit dimensions and paint attributes keep the glyphs visible before styling and when scripts or secondary resources fail.

The shared presentation uses a 24-unit grid, 1.7-unit rounded strokes, a quiet square frame, and the section's accent color. Solid brand marks explicitly disable the outline stroke to avoid thick, distorted logos. Independent subpaths with identical paint attributes are combined into one path per icon; the SVG itself draws its CSS frame, keeping the DOM within the existing 900-element budget.

- 51 outline icons: [Tabler Icons](https://github.com/tabler/tabler-icons/tree/55f87a73f45cf1d9eaf16d7da705065483a9e4f9/icons/outline), MIT; license in `TABLER-LICENSE.txt`. Invisible canvas paths were removed, and the default stroke width was adjusted.
- 11 solid brand marks: [Simple Icons 16.26.0](https://github.com/simple-icons/simple-icons/tree/16.26.0), CC0-1.0. Original path geometry is preserved and the color is inherited from the frame. These are recognizable brand marks, not newly invented company logos.
- `sources.json` records the source of every icon and the corresponding skill ID.

Brand marks identify the tools. Semantic symbols identify methods and concepts, for example a board for Agile/Scrum/Kanban, a cube for unit tests, puzzle pieces for integration, and a compass for exploratory testing. The visible text provides the accessible name; the icon is decorative to avoid repeated screen-reader announcements.
