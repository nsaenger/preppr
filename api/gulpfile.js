const { series, src, dest } = require('gulp');

const copySchemas = () => {
    return src('./src/**/*.json')
        .pipe(dest('dist/src'));
}
const copyDocumentation = () => {
    return src('./docs/**/*')
        .pipe(dest('dist/docs'));
}
const copyPackage = () => {
    return src('./package.json')
        .pipe(dest('dist/'));
}


exports.default = series(
    copySchemas,
    copyDocumentation,
    copyPackage
);