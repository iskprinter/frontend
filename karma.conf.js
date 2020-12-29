// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require('path');

module.exports = function (config) {
  config.set({
    autoWatch: true,
    basePath: '',
    browsers: ['ChromeHeadlessNoSandbox'],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    colors: true,
    coverageIstanbulReporter: {
      // Combines coverage information from multiple browsers into one report rather than outputting a report
      // for each browser.
      combineBrowserReports: true,
      // base output directory. If you include %browser% in the path it will be replaced with the karma browser name
      dir: path.join(__dirname, 'coverage'),
      // reports can be any that are listed here: https://github.com/istanbuljs/istanbuljs/tree/73c25ce79f91010d1ff073aa6ff3fd01114f90db/packages/istanbul-reports/lib
      reports: [
        'cobertura',
        'text-summary'
      ],
      // if using webpack and pre-loaders, work around webpack breaking the source path
      fixWebpackSourcePaths: true,
      // Omit files with no statements, no functions and no branches covered from the report
      skipFilesWithNoCoverage: true,
      // // enforce percentage thresholds
      // // anything under these percentages will cause karma to fail with an exit code of 1 if not running in watch mode
      // thresholds: {
      //   emitWarning: false, // set to `true` to not fail the test command when thresholds are not met
      //   // thresholds for all files
      //   global: {
      //     statements: 100,
      //     lines: 100,
      //     branches: 100,
      //     functions: 100
      //   },
      //   // thresholds per file
      //   each: {
      //     statements: 100,
      //     lines: 100,
      //     branches: 100,
      //     functions: 100,
      //     overrides: {
      //       'baz/component/**/*.js': {
      //         statements: 98
      //       }
      //     }
      //   }
      // },
      // output config used by istanbul for debugging
      verbose: true
    },
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [ '--no-sandbox' ]
      }
    },
    frameworks: [
      'jasmine',
      '@angular-devkit/build-angular'
    ],
    logLevel: config.LOG_INFO,
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-jasmine-html-reporter',
      'karma-coverage-istanbul-reporter',
      '@angular-devkit/build-angular/plugins/karma'
    ],
    port: 9876,
    reporters: [ 'coverage-istanbul' ],
    restartOnFileChange: true,
    singleRun: true
  });
};
