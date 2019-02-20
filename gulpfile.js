const gulp = require('gulp');
const merge2 = require('merge2');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');

const TASKS = {
    COMPILE_TYPESCRIPT_SRC: 'compile-typescript-src',
    COMPILE_TYPESCRIPT_COMMONJS: 'compile-typescript-commonjs',
};

//#region OPTIONS

var OPTIONS = {};

OPTIONS[TASKS.COMPILE_TYPESCRIPT_COMMONJS] = {
    CONFIG_FILE: 'src.tsconfig.commonjs.json',
    DESTINATION: 'dist',
};

gulp.task(TASKS.COMPILE_TYPESCRIPT_COMMONJS, function () {
    const tsProjectSrc = ts
        .createProject(
            OPTIONS[TASKS.COMPILE_TYPESCRIPT_COMMONJS].CONFIG_FILE,
            { noResolve: true }
        );

    const tsResult = tsProjectSrc
        .src()
        .pipe(sourcemaps.init())
        .pipe(tsProjectSrc());

    return merge2([
        tsResult
            .js
            .pipe(
                sourcemaps.write(
                    '',
                    {
                        debug: false,
                        includeContent: true,
                        sourceRoot: '../../../../../src'
                    }
                )
            )
            .pipe(gulp.dest(OPTIONS[TASKS.COMPILE_TYPESCRIPT_COMMONJS].DESTINATION)),
        tsResult
            .dts
            .pipe(gulp.dest(OPTIONS[TASKS.COMPILE_TYPESCRIPT_COMMONJS].DESTINATION)),
    ]);
});

gulp.task(
    TASKS.BUILD,
    gulp.series(
        TASKS.COMPILE_TYPESCRIPT_COMMONJS,
    )
);
