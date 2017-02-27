/** Gulpfile Demo
 ** Modern Front-end Dev using Gulp 4
 ** @since 1.0.0
 ** @author Santiago Moreno */

// Plugins
var gulp         = require('gulp'), // Obviously
    sass         = require('gulp-sass'), // Compile SCSS files to normal CSS
    pug          = require('gulp-pug'), // Compile Pug/Jade files to HTML
    postcss      = require('gulp-postcss'), // Includes Autoprefixer
    cssnano      = require('gulp-cssnano'), // Minify CSS
    uglify       = require('gulp-uglify'), // Minify JS
    imagemin     = require('gulp-imagemin'), // Minify image assets
    rename       = require('gulp-rename'), // Rename a file
    concat       = require('gulp-concat'), // Concatenate files (JS)
    notify       = require('gulp-notify'), // OS Based Notifications on processes
    sourcemaps   = require('gulp-sourcemaps'), // Make sure we can debug on minified files
    mqpacker     = require('css-mqpacker'), // Mix up Media Queries into single rule
    browserSync  = require('browser-sync').create(); //Inject changes, automatic page reload, device syncing, great for responsive development

// Project Variables
var project = 'gulp-demo', // Project name
    paths   = { // Our project paths
        styles: { // Our CSSs files
            src: 'src/scss/*.scss', // 'src' for source
            dest: 'dist/assets/css', // 'dest' for destination
            partials: 'src/scss/**/*.scss'
        },
        scripts: { // Our javascript files
            src: 'src/scripts/*.js',
            dest: 'dist/assets/scripts',
            vendor: 'src/scripts/vendor/*.js'
        },
        pug: { // Our Pug/Jade files
            src: ['src/views/**/*.pug', '!src/views/_**/*.*'],
            dest: 'dist/'
        },
        images: {
            src: 'src/images/**/*.{jpg,jpeg,png}',
            dest: 'dist/assets/images/',
            svg: 'src/images/**/*.svg'
        }
    }

// Tasks Setup

//** BrowserSync
function server(){ // Start magic
    browserSync.init({ // Initiate the server
        server: "./dist" // Where do we want the server to run, root folder, normally the distribution or build directory
    });
    gulp.watch(paths.styles.dest).on('change', browserSync.reload); // Watch our minified css file, once changed, reload
    gulp.watch(paths.pug.dest).on('change', browserSync.reload); // Watch our html files, once changed, reload
}

//** Pug/Jade files
function runpug(){
    return gulp.src(paths.pug.src) // Our source file
    .pipe(pug({
        pretty: '\t' //Make sure we have clean HTMLs, tabbed
    }))
    .pipe(gulp.dest(paths.pug.dest)) // Output to our dest directory
    .pipe(notify({ // Notify me when completed
        message: 'Pug task completed',
        onLast: true // Only notify me when the last of the stream file is compiled
    }));
}

//** Compile SASS into CSS and inject it
function styles() {
    return gulp.src(paths.styles.src) // Our source
    .pipe(sourcemaps.init()) // Begin sourcemap from here
    .pipe(sass({
        errLogToConsole: true, // Make sure we know what went wrong
        outputStyle: 'expanded', // This will make a normal, expanded CSS, we will minify it later
        precision: 10, // How many decimals we want to allow
    }))
    .pipe(sourcemaps.write({
        includeContent: false // Do we want to include the content on the sourcemap? (Larger file)
    }))
    .pipe(sourcemaps.init({
        loadMaps: true // We want to include the original sourcemap so we can debug the original SASS file after minifying the compiled CSS
    }))
    .pipe(postcss([ // More magic
        require('autoprefixer')({ // Autoprefixer
          browsers: ['last 10 versions','IE 8','IE 9','IE 10'], // Support at least this browser versions
          cascade: false // Don't cascade the prefixes
        }),
        require("css-mqpacker")({ // Combine all media queries we used in a single rule (cleaner, lighter CSS)
           sort: true // Sort the media queries so the smaller rule is always first
        })
    ]))
    .pipe(gulp.dest("private/css")) // Send the expanded CSS to a folder different from src, we're not using this one, it's only for checking on it if something's not right
    .pipe(browserSync.stream()) // Inject styles to the browser
    .pipe(rename({ suffix: '.min' })) // Rename the file and add .min
    .pipe(cssnano()) // Minify!
    .pipe(sourcemaps.write('.')) // Write final sourcemap
    .pipe(gulp.dest(paths.styles.dest)) // Put it on the build folder
    .pipe(notify({
        message: 'Styles task complete', // Notify me please
        onLast: true
    }));
};

//** Concatenate and minify third-party scripts
//** Warning: This may not be the best approach, if you're having issues with your scripts comment this out
function vendor() {
	return gulp.src(paths.scripts.vendor) // Our source
	.pipe(concat('vendor.js')) // Concatenate all files in our source folder
	.pipe(rename({ // rename the new file
		basename: "vendor",
		suffix: '.min'
	}))
	.pipe(uglify()) // Minify
	.pipe(gulp.dest(paths.scripts.dest)) // Put on the dist folder
	.pipe(notify({
        message: 'Vendor scripts task complete', // Notify me
        onLast: true
    }));
};

//** Project Scripts (our own scripts)
function scripts() {
	return gulp.src(paths.scripts.src)
    .pipe(sourcemaps.write({ // Sourcemaps for debugging
        includeContent: false
    }))
    .pipe(sourcemaps.init({
        loadMaps: true
    }))
    .pipe(concat('main.js')) // Concatenate if we have more than one file
    .pipe(gulp.dest('private/scripts/')) // Send it to private if needed
    .pipe(rename({
    	basename: "main",
    	suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'))
    .pipe(notify({
        message: 'Project scripts task complete',
        onLast: true
    }));
};

//** Compress Images
function images() {
  return gulp.src(paths.images.src, {since: gulp.lastRun('images')}) // 'since' will make sure we don't optimize already optimized images
    .pipe(imagemin({
        optimizationLevel: 5 // Anything you like
    }))
    .pipe(gulp.dest(paths.images.dest))
    .pipe(notify({
        message: 'Images task complete',
        onLast: true
    }));
}

//** Create SVG sprites from SVG files
function sprites(){
    return gulp.src(paths.images.svg, {since: gulp.lastRun('sprites')})
        .pipe(svgSprite())
        .pipe(gulp.dest(paths.images.dest));
}

//** Watch Task
function watch(){
    gulp.watch(paths.pug.src, runpug);
    gulp.watch(paths.styles.src, styles);
    gulp.watch(paths.styles.partials, styles);
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.scripts.vendor, vendor);
    gulp.watch(paths.images.src, images);
}

//** Make sure we can use our functions as gulp commands
exports.server = server;
exports.runpug = runpug;
exports.styles = styles;
exports.scripts = scripts;
exports.vendor = vendor;
exports.images = images;
exports.sprites = sprites;
exports.watch = watch;
