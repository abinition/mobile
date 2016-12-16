# mobile
Mobile Scenario for InfoArchive

## Building

To build a new Android app

    ionic build android

or

    ionic build android --release
    
> The APK is in /platforms/android/build/outputs/apk
    
> To build a IOS app, we need a MAC

    ionic build ios --release

To build the /www area (for NGINX, for example)

    ionic build browser
    
To update the IONIC VIEW

    ionic package build android
    ionic upload
    
To develop    

    ionic serve --live -c

## Different ways to run
    ionic run browser
    ionic serve
    ionic serve --live -c      <-- with live reload and console
    ionic run android
    ionic emulate android	
    ionic emulate ios
	
## GULP

When doing --live, any changes to pug/\*\*/\*.pug and scss/*\*\/\*.scsc will be watched, and the livereload will catch your changes.
Do manually update the HTML and CSS directory

    gulp pug
    gulp sass
  
Refer to gulpfile.js and ionic.config.json for how gulp tasks are implemted.



# Setup
Do the following commands in the project directory: ie: ./indexui

## THIS IS IF YOU NEED TO INSTALL A GOOD VERSION OF NODE
    sudo npm cache clean -f
    sudo npm install -g n

### For Windows
The new BEST way to upgrade NPM on Windows:

    https://github.com/felixrieseberg/npm-windows-upgrade

Run PowerShell as Administrator

    Set-ExecutionPolicy Unrestricted -Scope CurrentUser -Force
    npm install -g npm-windows-upgrade
    npm-windows-upgrade

> Note: Do not ever run npm i -g npm again. Use npm-windows-upgrade instead to update npm going forward.

## Directories you need to create
* www/lib directory
* www/css directory

## THIS PART MANDATORY
    sudo npm install -g gulp
    sudo npm install -g cordova
    sudo npm install -g bower

> On Windows, use powershell and omit "sudo"

## Node modules 

    npm install

## Cordova config
    cordova platform add android
    cordova platform add browser

    cordova plugin add cordova-plugin-device
    cordova plugin add cordova-plugin-console
    cordova plugin add cordova-plugin-whitelist
    cordova plugin add cordova-plugin-splashscreen
    cordova plugin add cordova-plugin-statusbar
    cordova plugin add ionic-plugin-keyboard
    cordova plugin add cordova-plugin-inappbrowser
    cordova plugin add cordova-plugin-file-transfer

## Ionic config
    ionic add ionic-service-core
    ionic lib update

## Update dependencies
    npm install --save bower-check-updates
    npm install --save bower-npm-resolver
    npm install --save angular-chart.js

## Bower config

    bower install --save ngCordova
    bower install --save angular-resource
    bower install --save ngstorage
    bower install --save angular-base64
    bower install --save ionic-material
    bower install --save robotodraft 
    bower install --save angular-chart.js
    bower install --save angular-x2js
    bower-check-updates -u
    bower install 
	
## Prepare directories    
    ionic hooks add
    ionic platforms

## Platforms to add
    ionic add platform android
    ionic add platform browser	

## Adding ICON and splash screen
    ionic resources

## Build outs
    ionic build android
    ionic build browser


## Signing

    cd certs

    /C/Program\ Files/Java/jdk1.8.0_77/jre/bin/keytool -genkey -v -keystore release-key.keystore -alias iamobile -keyalg RSA -keysize 2048 -validity 10000
    
    /C/Program\ Files/Java/jdk1.8.0_77/bin/jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore certs/release-key.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk iamobile

    /C/Users/bergsma/AppData/Local/Android/sdk/build-tools/25.0.0/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk certs/mobileApp.apk

