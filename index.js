#!/usr/bin/env node
"use strict";

let path = require("path");
let fs = require('fs');
let tinify = require("tinify");
let recursive = require('recursive-readdir');

process.env.INIT_CWD = process.cwd();

class ImageCompressor {
    constructor(userArgs) {
        this.configName= path.resolve(__dirname + "/config.js");
        try {
            this.config = require(this.configName);
        } catch(err) {
            this.resetDefaultConfig();
            try {
                this.config = require(this.configName);
            } catch(err) {
                console.log(err);
            }
        }

        this.commands = {
            "setOutputPath": "setpath",
            "setApiKey": "setkey",
            "resetDefaultConfig": "reset",
            "countOfCompressedImages": "count"
        }
        this.configDefaults =  {
            outputPath: "false",
            apiKey: ""
        };
        if(userArgs.length > 2) {
            console.log("too many arguments")
            return false;
        }

        this.commandName = userArgs[0];

        if(!this.commandName) {
            tinify.key = this.config.apiKey;
            this.compressImages();
        } else {
            let commandParam;
            switch (this.commandName) {
                case this.commands.countOfCompressedImages:
                    tinify.key = this.config.apiKey;
                    this.howMuchDidICompress();
                break;
                case this.commands.setOutputPath:
                    commandParam = userArgs[1];
                    this.setOutputPath(commandParam);
                break;
                case this.commands.setApiKey:
                    commandParam = userArgs[1];
                    this.setApiKey(commandParam);
                break;
                case this.commands.resetDefaultConfig:
                    this.resetDefaultConfig();
                break;
                default:
                console.log("You misspelled command name");
                return;
            }
        }
    }

    resetDefaultConfig() {
        var configDefaults = this.configDefaults;
        fs.open(this.configName, "w", (err, fd) => {
            if (err) return console.log(err)
            fs.writeFile(this.configName, "module.exports = \n"+JSON.stringify(this.configDefaults, null, 4), function (err) {
                if (err) return console.log(err);
                console.log("Default configs are set");
            });
        });
    }

    setConfig(name, value) {
        let newConfig = {};
        newConfig[name] = value;
        let mergedConfig = Object.assign({}, this.config, newConfig);

        fs.writeFile(this.configName, "module.exports = \n"+JSON.stringify(mergedConfig, null, 4), (err) => {
          if (err) return console.log(err)
          console.log(`${name} is set to ${value}`);
        });
    }

    setOutputPath(path) {
        if(!path) {
            console.log("Please specify a path");
            return;
        }
        this.setConfig("outputPath", path);
    }

    setApiKey(key) {
        if(!key) {
            console.log("Please specify an API key");
            return;
        }
        this.setConfig("apiKey", key);
    }

    howMuchDidICompress() {
        tinify.validate(function(err) {
            if (err) {
              console.log("Your API key is not yet set, or it's invalid");
              return;
            } else {
              console.log(`you optimized ${tinify.compressionCount} images this month, max number of free images is 500`);
            }
        });
    }

    compressImages() {
        tinify.validate((err) => {
            if (err) {
              console.log(`Your API key is not yet set, or it's invalid, you can set it with "img-tinyfy ${this.commands.setApiKey} YOURKEYHERE" command`);
              return;
            } else {
                if(this.config.outputPath === "false") {
                    this.compressionStart(false);
                } else {
                    try {
                        let outDirNormalized = path.normalize(this.config.outputPath);
                        let stats = fs.statSync(outDirNormalized);
                        if(stats.isDirectory()) {
                            this.compressionStart(outDirNormalized);
                        } else {
                            console.log(`The output path set in config is not a directory, you can use "img-tinyfy ${this.commands.setOutputPath} OUTPUTPATHHERE" to set it properly, if you set path to false images will be compressed in their location`);
                        }
                    } catch(err) {
                        console.log(`The output path set in config is not a directory, you can use "img-tinyfy ${this.commands.setOutputPath} OUTPUTPATHHERE" to set it properly, if you set path to false images will be compressed in their location`)
                        return;
                    }
                }
            }
        });
    }

    createOutputImagesArray(outputPath, inputImages) {
        if(!outputPath) {
            return inputImages;
        }else {
            let outputImages = [];
            let outputDirPath;
            inputImages.forEach((imagePath) => {
                imagePath = path.normalize(imagePath);
                outputDirPath = imagePath.replace(path.normalize(process.env.INIT_CWD), outputPath)
                outputImages.push(outputDirPath);
            });
            return outputImages;
        }
    }

    compressionStart(outputPath) {
        function ignoreFunc(file, stats) {
            if(path.basename(file).match(/.*\.jpg$/g) || path.basename(file).match(/.*\.png$/g) || stats.isDirectory()) {
                return false;
            }else {
                return true;
            }
        }

        recursive(process.env.INIT_CWD, [ignoreFunc], (err, files) => {
            if(!files.length) {
                console.log("There is no .png nor .jpg images in current folder");
                return;
            }
            let OutputImagesArray = this.createOutputImagesArray(outputPath, files);

            files.forEach((name, index) => {
                if(this.config.outputPath !== "false") {
                    try {
                        fs.mkdirSync(path.parse(OutputImagesArray[index]).dir); //create directory if it does not exist
                    } catch(err) {

                    }
                }

                var source = tinify.fromFile(name).toFile(OutputImagesArray[index], function(err) {
                    if(err) {
                        if (err instanceof tinify.AccountError) {
                            console.log("Verify your API key and account limit.");
                        } else if (err instanceof tinify.ClientError) {
                            console.log("Check your source image and request options.");
                        } else if (err instanceof tinify.ServerError) {
                            console.log("Temporary issue with the Tinify API.");
                        } else if (err instanceof tinify.ConnectionError) {
                            console.log("A network connection error occurred.");
                        } else {
                            console.log("The error message is: " + err.message);
                        }
                    }else {
                        console.log(name + " is optimized");
                    }
                });
            });
        });
    }
}

let userArgs = process.argv.slice(2);

let compressor = new ImageCompressor(userArgs);
