/* eslint-disable global-require */
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const istanbul = require('gulp-istanbul');
const mocha = require('gulp-mocha');
const jsdoc = require('gulp-jsdoc3');
const runSequence = require('run-sequence');

const srcCode = ['./src/**/*.js'];
const specs = ['./test/**/*_spec.js'];
const lintedFiles = ['*.js', './test/**/*.js', '!./test/docs/**/*.js'].concat(srcCode);

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

gulp.task('build', ['babelify']);

// No real need to have a minify set for now, let dev and prod builds be the same
gulp.task('babelify', () => gulp.src(srcCode)
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist')));


gulp.task('lint', () => gulp.src(lintedFiles)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failOnError()));

gulp.task('watch-lint', () => {
    runSequence('lint', () => {
        gulp.watch(lintedFiles, ['lint']);
    });
});

gulp.task('pre-test', () => {
    // Everything file loaded from here uses babel with .babelrc
    require('babel-core/register'); // https://babeljs.io/docs/usage/require/

    return gulp.src(srcCode)
         // Covering files (we use isparta for babel support)
        .pipe(istanbul({instrumenter: require('isparta').Instrumenter}))
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () => {
    // Everything file loaded from here uses babel with .babelrc
    require('babel-core/register'); // https://babeljs.io/docs/usage/require/

    return gulp.src(specs, {read: false})
        .pipe(mocha())
        .pipe(istanbul.writeReports())
        // Enforce a coverage of at least 90%
        .pipe(istanbul.enforceThresholds({thresholds: {global: 75}}));
});

// We do this over using include/exclude to make everything feel gulp-like!
gulp.task('doc', (cb) => {
    const config = require('gulp-jsdoc3/dist/jsdocConfig.json');
    config.templates.systemName = 'temper';
    gulp.src(['README.md'].concat(srcCode).concat(['!**/*-cli.js']), {read: false})
        .pipe(jsdoc(config, cb));
});

gulp.task('default', (cb) => {
    runSequence('build', 'doc', cb);
});

