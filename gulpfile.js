const gulp = require('gulp');
const ejs = require('gulp-ejs');
const inline = require('gulp-inline-css');
const plumber = require('gulp-plumber');
const replace = require('gulp-replace');
const sass = require('gulp-sass');
const sequence = require('run-sequence');
const fs = require('fs');

const DEV_IMAGE_URL = '/images/';
const PROD_IMAGE_URL = 'http://example.com/path/to/image/';

gulp.task( 'ejs:dev', function () {
  return gulp.src( [ './templates/**/*.ejs', '!./templates/_*/**/*.ejs' ] )
    .pipe( plumber() )
    .pipe( ejs( { image_url: DEV_IMAGE_URL }, {}, { ext: '.html' } ) )
    .pipe( gulp.dest( './tmp/dev/' ) );
} );

gulp.task( 'ejs:prod', function () {
  return gulp.src( [ './templates/**/*.ejs', '!./templates/_*/**/*.ejs' ] )
    .pipe( plumber() )
    .pipe( ejs( { image_url: PROD_IMAGE_URL }, {}, { ext: '.html' } ) )
    .pipe( gulp.dest( './tmp/prod/' ) );
} );

gulp.task( 'sass', function () {
  return gulp.src( [ './stylesheets/**/*.scss', '!./stylesheets/_*/**/*.scss' ] )
    .pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
    .pipe( gulp.dest( './tmp/css/' ) );
} );

gulp.task( 'inline:dev', function () {
  const fileList = [];

  fs.readdir( './tmp/dev/', function( error, files ) {
    if (error) throw error;

    // dev以下のディレクトリを全て取得してfileListに
    files.filter( function( file ){
      return fs.statSync( './tmp/dev/' + file ).isDirectory();
    } ).forEach( function ( file ) {
      fileList.push( file );
    } );

    if ( fileList.length > 0 ) {
      fileList.forEach( function ( file ) {
        fs.readFile( './tmp/css/' + file + '/styles.css', 'utf-8', function ( error, content ) {
          if ( error ) throw error;

          return gulp.src( [ './tmp/dev/' + file + '/**/*.html' ] )
            .pipe( plumber() )
            .pipe( inline( {
              extraCss:             content,
              applyStyleTags:       false,
              applyLinkTags:        false,
              removeStyleTags:      false,
              preserveMediaQueries: true
            } ) )
            .pipe( replace( /\t/g, '' ) )
            .pipe( gulp.dest( './public/' + file + '/' ) );
        } );
      } );
    }
  } );
} );

gulp.task( 'inline:prod', function () {
  const fileList = [];

  fs.readdir( './tmp/prod/', function( error, files ) {
    if (error) throw error;

    files.filter( function( file ){
      return fs.statSync( './tmp/prod/' + file ).isDirectory();
    } ).forEach( function ( file ) {
      fileList.push( file );
    } );
    console.log(fileList.length)

    if ( fileList.length > 0 ) {
      fileList.forEach( function ( file ) {
        fs.readFile( './tmp/css/' + file + '/styles.css', 'utf-8', function ( error, content ) {
          if ( error ) throw error;
          console.log(file)
          return gulp.src( [ './tmp/prod/' + file + '/**/*.html' ] )
            .pipe( plumber() )
            .pipe( inline( {
              extraCss:             content,
              applyStyleTags:       false,
              applyLinkTags:        false,
              removeStyleTags:      false,
              preserveMediaQueries: true
            } ) )
            .pipe( replace( /\t/g, '' ) )
            .pipe( gulp.dest( './product/' + file + '/' ) );
        } );
      } );
    }
  } );
} );

gulp.task( 'serve-image', function () {
  gulp.src( [ './images/**/*' ] )
    .pipe( gulp.dest( './public/images/' ) );
} );

gulp.task( 'build:dev', function ( callback ) {
  sequence( 'ejs:dev', 'sass', 'inline:dev', callback );
} );

gulp.task( 'build:prod', function ( callback ) {
  sequence( 'ejs:prod', 'sass', 'inline:prod', callback );
} );

gulp.task( 'watch', [ 'build:dev', 'serve-image' ], function () {
  gulp.watch( [ './templates/**/*.ejs' ], [ 'ejs:dev' ] );
  gulp.watch( [ './stylesheets/**/*.scss' ], [ 'sass' ] );
  gulp.watch( [ './tmp/dev/**/*', './tmp/css/**/*' ], [ 'inline:dev' ] );
  gulp.watch( [ './images/**/*' ], [ 'serve-image' ] );
} );

gulp.task( 'default', [ 'watch' ] );