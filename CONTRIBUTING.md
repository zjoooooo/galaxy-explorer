# Contributing to Galaxy Explorer

Thanks for your interest — contributions, forks and ideas are all welcome! 🌌

## Ways to help

- **Report a bug** or **suggest a feature** via an
  [issue](https://github.com/zjoooooo/galaxy-explorer/issues).
- **Send a pull request** for a fix or improvement.
- **Fork it** and build your own thing — that's encouraged too.

## Development

There is no build step and no dependencies to install.

1. Fork and clone the repo.
2. Serve the folder over HTTP and open it in a browser:
   ```sh
   python -m http.server 8000   # then open http://localhost:8000/
   ```
3. Edit `index.html` and reload. Use `?fx=1` to see ambient effects on demand and
   `?tune=1` for the nebula shader sliders.

## Guidelines

- **Keep it dependency-free and single-file** where practical. The value of this
  project is that it's easy to read, learn from, and drop into anything.
- **Comment non-obvious math/shaders** — people use this to learn.
- **Test in a browser** before opening a PR (check the console for errors). There
  is no automated test suite.
- Keep changes focused; describe what and why in the PR.

## Ideas up for grabs

New ambient effects · additional galaxy morphologies · a UI settings panel ·
colour themes · mobile/touch and VR support · performance tuning · accessibility.

By contributing you agree your work is licensed under the project's
[MIT License](LICENSE).
