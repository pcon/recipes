/*jslint browser: true, regexp: true, nomen: true */
/*global require */

var argv = require('yargs').argv,
    connect = require('gulp-connect'),
    ghpages = require('gh-pages'),
    fs = require('fs'),
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    htmlmin = require('gulp-htmlmin'),
    marked = require('gulp-markdown'),
    wrap = require('gulp-wrap'),
    merge = require('merge-stream'),
    path = require('path'),
    rename = require('gulp-rename'),
    rimraf = require('gulp-rimraf');

/**
* Debug mode may be set in one of these manners:
* - gulp --debug=[true | false]
* - export NODE_DEBUG=[true | false]
*/
var DEBUG,
    USER_DEBUG = (argv.debug || process.env.NODE_DEBUG);

if (USER_DEBUG === undefined && argv._.indexOf('deploy') > -1) {
    DEBUG = false;
} else {
    DEBUG = USER_DEBUG !== 'false';
}

var site = {
    'title': 'Recipes',
    'url': 'http://0.0.0.0:9000',
    'urlRoot': '/',
    'author': 'Patrick Connelly',
    'email': 'patrick@deadlypenguin.com',
    'time': new Date()
};

if (process.env.URL_ROOT) {
    site.urlRoot = process.env.URL_ROOT;
}

gulp.task('cleanpages', function () {
    'use strict';

    return gulp.src(['dist/*.html'], {read: false})
        .pipe(rimraf());
});

gulp.task('pages', ['cleanpages'], function () {
    'use strict';

    var markdown;

    markdown = gulp.src(['./**/*.md', '!node_modules{,/**}'], {base: '.'})
        .pipe(marked())
        .pipe(rename({basename: 'index', extname: '.html'}))
        .pipe(wrap({ src: __dirname + '/site/assets/templates/page.html' }, site, { variable: 'site' }));

    /*jslint unparam: true */
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
});
/*jslint unparam: false */

gulp.task('cleanstyles', function () {
    'use strict';

    return gulp.src('dist/styles', {read: false})
        .pipe(rimraf());
});

gulp.task('styles', ['cleanstyles'], function () {
    'use strict';

    return gulp.src('site/assets/styles/**')
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('clean', function () {
    'use strict';

    return gulp.src('dist', {read: false})
        .pipe(rimraf());
});

gulp.task('content', ['pages']);
gulp.task('default', ['content', 'styles']);

gulp.task('watch', ['default'], function () {
    'use strict';

    gulp.watch(['site/assets/styles/**'], ['styles']);
    gulp.watch(['./**/*.md'], ['pages']);

    connect.server({
        root: ['dist'],
        port: 9000,
        livereload: true
    });
});

gulp.task('dist', ['default']);

gulp.task('deploy', ['dist'], function (cb) {
    'use strict';

    ghpages.publish(path.join(process.cwd(), 'dist'), {push: false}, cb);
});