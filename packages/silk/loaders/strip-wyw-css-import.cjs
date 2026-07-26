/**
 * Strip the CSS side-effect import that @wyw-in-js/webpack-loader appends.
 *
 * Bundleless Silk ships aggregate CSS via a separate pass (`styles.css`);
 * per-file CSS imports would break the opt-in `@layer` contract. This loader
 * runs only on the bundleless JS pass, after wyw and before the final emit.
 *
 * wyw appends one of:
 *   require("./File.wyw-in-js.css!=!…outputCssLoader…");
 *   import "./File.wyw-in-js.css!=!…outputCssLoader…";
 *
 * Non-Linaria files have no such marker and pass through unchanged. If a
 * wyw marker is present but does not match the expected shape, throw — a
 * silent miss would ship unresolvable inline-loader specifiers to consumers.
 *
 * @param {string} source
 * @param {unknown} [map]
 */
module.exports = function stripWywCssImport(source, map) {
  const input = String(source);
  if (!input.includes('wyw-in-js')) {
    this.callback(null, input, map);
    return;
  }

  // wyw appends the side-effect at EOF; allow optional trailing whitespace.
  const stripped = input.replace(
    /\n?(?:require|import)\(\s*["'][^"']*wyw-in-js\.css!=![^"']*["']\s*\);?\s*$/,
    '\n',
  );

  if (stripped.includes('wyw-in-js')) {
    const resource = this.resourcePath || '<unknown>';
    this.callback(
      new Error(
        `silk:strip-wyw-css-import: ${resource} still contains wyw-in-js after strip; ` +
          `expected a trailing require()/import() of a *.wyw-in-js.css!=!… specifier`,
      ),
    );
    return;
  }

  this.callback(null, stripped, map);
};
