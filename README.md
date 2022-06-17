<div align="center">

![open-ruffle-player-logo](public/images/open-ruffle-player-logo.png)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jooy2/open-ruffle-player/blob/master/LICENSE)
[![Version](https://img.shields.io/github/package-json/v/jooy2/open-ruffle-player)](https://github.com/jooy2/open-ruffle-player/tags)
![Programming Language Usage](https://img.shields.io/github/languages/top/jooy2/open-ruffle-player)
[![Downloads](https://img.shields.io/github/downloads/jooy2/open-ruffle-player/total)](https://github.com/jooy2/open-ruffle-player/releases)
![Languages](https://img.shields.io/github/languages/count/jooy2/open-ruffle-player)
[![Followers](https://img.shields.io/github/followers/jooy2?style=social)](https://github.com/jooy2)
![Stars](https://img.shields.io/github/stars/jooy2/open-ruffle-player?style=social)
![Commit Count](https://img.shields.io/github/commit-activity/y/jooy2/open-ruffle-player)
![Line Count](https://img.shields.io/tokei/lines/github/jooy2/open-ruffle-player)

![Logo Image](https://user-images.githubusercontent.com/48266008/112129289-9b6b6380-8c0a-11eb-9b1a-759ffbd10ffc.png)

This is **Unofficial Ruffle Flash Player** Based on [Ruffle Flash Emulator](https://ruffle.rs).

I'm not the official developer of Ruffle. For issues and documentation related to the emulator, please refer to the official Ruffle repository documentation below.

**Official Ruffle Desktop Player** is here!: https://github.com/ruffle-rs/ruffle

(*This is just an emulator and does not contain any games.)

</div>

## ⭐ Features
 - ✅ It is a desktop player that not only replaces Adobe Flash Player, but also makes it easy to use Ruffle.
 - ✅ Cross-platform: Windows, macOS, Linux supported!
 - ✅ Multi-language and theme support
 - ✅ Support for running split SWF files
 - ✅ Drag-and-drop or one-click execution of SWF files from local PC
 - ✅ Continue playing from the list of recently opened files.
 - ✅ Customize various emulator settings.

## 📢 Compatibility
**Since the emulator is under development, some content may not run smoothly, and Flash created with ActionScript 3 as of March 2021 is not supported.**

See https://github.com/ruffle-rs/ruffle/issues/1368.

This app plots the emulator (built for self-hosted use) in a webview, so there may be a performance difference compared to the official Ruffle Desktop Application.

There is no built-in automatic update in the app. It is recommended to download the updated emulator version by referring to the GitHub Release page on a monthly basis.

## 💾 Downloads
Please use the GitHub Release page attached below.

[OpenRuffle Flash Player Release Page](https://github.com/jooy2/open-ruffle-player/releases)

## 🔧 Technical Specifications
 - [Electron 18.x](https://www.electronjs.org/)
 - [React 18.x](https://reactjs.org/)
 - [Material-UI 5.x](https://mui.com/)
 - [Ruffle](https://ruffle.rs/)

## 🔨 Build & Run
Before building or running, you need to install the module and add the Ruffle script file to the project.

First install the dependency module with the following command: ([NodeJS](https://nodejs.org) pre-installed required)
```shell
$ npm i
```

Next, download the latest version of the self-hosted version from the [Ruffle Release Page](https://github.com/ruffle-rs/ruffle/releases), unzip it and paste it in the following path: `/public/js/ruffle`

You only need to paste the `.map`, `.js`, `.wasm` files inside the compressed file.

To test in the `development environment`, enter the following command:
```shell
$ npm i
$ npm run dev
```

And you can build on multiple platforms with the following command:
```shell
# Windows (.exe)
$ npm run build:win
$ npm run build:win-portable

# macOS (.dmg)
$ npm run build:mac

# Linux (.deb, .rpm)
$ npm run build:linux
```

## 📋 License
Copyright © 2021 Jooy2 Released under the MIT license. (Source code excluding Ruffle and external modules)

Please use the build package only for personal testing. **Distribution of packages for production/commercial use is not permitted.**

For detailed license of Ruffle, please refer to the following document: [https://github.com/ruffle-rs/ruffle/blob/master/LICENSE.md](https://github.com/ruffle-rs/ruffle/blob/master/LICENSE.md)
