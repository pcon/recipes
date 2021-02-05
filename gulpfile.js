const argv = require('yargs').argv;
const connect = require('gulp-connect');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');
const marked = require('gulp-markdown');
const wrap = require('gulp-wrap');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const rimraf = require('gulp-rimraf');
const path = require('path');

const DIST = 'dist';
const DIST_HTML = path.join(DIST, '*.html');
const DIST_STYLES = path.join(DIST, 'styles');
const MATCHER_MD = './**/*.md';
const MATCHER_STYLES = 'site/assets/styles/**';

/**
* Debug mode may be set in one of these manners:
* - gulp --debug=[true | false]
* - export NODE_DEBUG=[true | false]
*/
var DEBUG;
var USER_DEBUG = argv.debug || process.env.NODE_DEBUG;

if (USER_DEBUG === undefined && argv._.indexOf('deploy') > -1) {
    DEBUG = false;
} else {
    DEBUG = USER_DEBUG !== 'false';
}

var site = {
    title: 'Recipes',
    url: 'http://0.0.0.0:9000',
    urlRoot: '/',
    author: 'Patrick Connelly',
    email: 'patrick@deadlypenguin.com',
    time: new Date()
};

if (process.env.URL_ROOT) {
    site.urlRoot = process.env.URL_ROOT;
}

/**
 * Remove a path
 * @param {String} rm_path The path matcher
 * @returns {Promise} A promise for when the path has been removed
 */
function remove(rm_path) {
    const config = {
        read: false,
        allowEmpty: true
    };

    return gulp.src(rm_path, config)
        .pipe(rimraf());
}

/**
 * Cleans up the dist directory
 * @returns {Promise} A promise for when the dist directory has been cleaned
 */
function cleanall() {
    return remove(DIST);
}

/**
 * Cleans the html pages
 * @returns {Promise} A promise for when the HTML has been cleaned
 */
function cleanpages() {
    return remove(DIST_HTML);
}

/**
 * Cleans the styles
 * @returns {Promise} A promise for when the styles have been cleaned
 */
function cleanstyles() {
    return remove(DIST_STYLES);
}

/**
 * Builds the html pages
 * @returns {Promise} The promise for when the HTML has been generated
 */
function buildpages() {
    const src_files = [
        MATCHER_MD,
        '!node_modules{,/**}'
    ];
    const src_config = { base: '.' };

    const rename_config = {
        basename: 'index',
        extname: '.html'
    };

    const wrap_opts = { src: path.join(__dirname, '/site/assets/templates/page.html') };
    const options = { variable: 'site' };

    var markdown = gulp.src(src_files, src_config)
        .pipe(marked())
        .pipe(rename(rename_config))
        .pipe(wrap(wrap_opts, site, options));

    return merge(markdown)
        .pipe(gulpif(!DEBUG, htmlmin({
            removeAttributeQuotes: false,
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            removeStyleLinkTypeAttributes: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true
        })))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());
}

/**
 * Builds the styles
 * @returns {Promise} The promise for when the styles have been generated
 */
function buildstyles() {
    return gulp.src(MATCHER_STYLES)
        .pipe(gulp.dest(DIST_STYLES));
}

/**
 * Watches for changes
 * @returns {undefined}
 */
function watch() {
    gulp.watch(MATCHER_STYLES, gulp.task('styles'));
    gulp.watch(MATCHER_MD, gulp.task('pages'));

    connect.server({
        root: [ DIST ],
        port: 9000,
        livereload: true
    });
}

gulp.task('clean', cleanall);
gulp.task('cleanpages', cleanpages);
gulp.task('cleanstyles', cleanstyles);
gulp.task('pages', gulp.series(cleanpages, buildpages));
gulp.task('styles', gulp.series(cleanstyles, buildstyles));

gulp.task('default', gulp.series(gulp.task('pages'), gulp.task('styles')));
gulp.task('watch', gulp.series(gulp.task('default'), watch));