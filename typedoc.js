module.exports = {
  exclude: '**/node_modules/**/*.*',
  excludePrivate: true,
  includeDeclarations: true,
  listInvalidSymbolLinks: true,
  mode: 'file',
  name: 'AntJs API Doc',
  out: './docs/api',
  src: [
    './src/ant.ts',
  ],
  target: 'ES6',
  tsconfig: './src.tsconfig.commonjs.dev.json',
};
