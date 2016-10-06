#!/usr/bin/env node
"use strict";

let path = require("path");
let fs = require('graceful-fs');
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
        };

        this.configDefaults =  {
            outputPath: "false",
            apiKey: "",
            iterationNumber: 2, //number of images to process at once
            iterationCheckInterval: 120000,// 2 minutes
            iterationTimeout: 240000, // 4 minutes
            errorLogName: "error.log",
            notOptimizedImagesLog: "not_optimized_images.log",
            notOptimizedImagesFolder: "/notOptimizedImages"
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

    getFilesizeInBytes(filename) {
        let stats = fs.statSync(filename);
        let fileSizeInBytes = stats["size"];

        if(!fileSizeInBytes) {
            throw "Could not determine file size of " + filename;
        }

        return fileSizeInBytes;
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

    writeLog(logMessage, logType) {
        let logName;
        let notOptimizedFolder = this.config.notOptimizedFolder;
        let currentDate = new Date();

        if(logType === "error") {
            logName = path.resolve(process.env.INIT_CWD + "/" + this.config.errorLogName);
        } else if(logType === "not optimized") {
            logName = path.resolve(process.env.INIT_CWD + "/" + this.config.notOptimizedImagesLog);
        }

        fs.appendFile(logName, "\n" + currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" + currentDate.getFullYear() + " " + currentDate.getUTCHours() + ":" +currentDate.getUTCMinutes() + ": " + logMessage, (err) => {
            if (err) {
                console.log(err);
            }
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
                if(err.message.indexOf("Error while connecting") !== -1) {
                    console.log("You seem to have trouble with network connection");
                }else {
                    console.log("Your API key is not yet set, or it's invalid");
                }

                return;
            } else {
              console.log(`you optimized ${tinify.compressionCount} images this month, max number of free images is 500`);
            }
        });
    }

    compressImages() {
        tinify.validate((err) => {
            if (err) {
                if(err.message.indexOf("Error while connecting") !== -1) {
                    console.log("You seem to have trouble with network connection");
                }else {
                    console.log(`Your API key is not yet set, or it's invalid, you can set it with "img-tinyfy ${this.commands.setApiKey} YOURKEYHERE" command`);
                }

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

    createImagesArray(outputPath, inputImages, isOutputArray) {
        if(!isOutputArray) {
            isOutputArray = false;
        }

        let outputImages = [];
        let outputDirPath;
        let imageSize;

        if(isOutputArray) {
            if(!outputPath) {
                inputImages.forEach((imagePath) => {
                    imagePath = path.normalize(imagePath);

                    outputImages.push({
                        path: imagePath
                    });
                });

                return outputImages;
            }else {
                inputImages.forEach((imagePath) => {
                    imagePath = path.normalize(imagePath);
                    outputDirPath = imagePath.replace(path.normalize(process.env.INIT_CWD), outputPath);

                    outputImages.push({
                        path: outputDirPath
                    });
                });

                return outputImages;
            }
        }else {
            inputImages.forEach((imagePath) => {
                imagePath = path.normalize(imagePath);
                imageSize = this.getFilesizeInBytes(imagePath);

                outputImages.push({
                    path: imagePath,
                    size: imageSize
                });
            });

            return outputImages;
        }
    }

    optimizeIteration(iterationArray, callback) {
        if(!this.inputImagesArray.length || !this.outputImagesArray.length) {
            console.log("Optimization Finished!!!");
            return false;
        }
        console.log("Images optimization is in progress...");

        while(this.iterationInputArray.length !== this.config.iterationNumber || this.inputImagesArray.length === 0) {
            this.iterationInputArray.push(this.inputImagesArray.shift());
        }

        while(this.iterationOutputArray.length !== this.config.iterationNumber || this.outputImagesArray.length === 0) {
            this.iterationOutputArray.push(this.outputImagesArray.shift());
        }

        this.writeLog("hi", "error");
        setTimeout(() => {
            console.log("boom")
        }, 5000)
        /*this.iterationInputArray.forEach((currentImage, index) => {
            if(this.config.outputPath !== "false") {
                try {
                    fs.mkdirSync(path.parse(this.iterationOutputArray[index].path).dir); //create directory if it does not exist
                } catch(err) {

                }
            }

            var source = tinify.fromFile(currentImage.path).toFile(this.iterationOutputArray[index].path, function(err) {
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
                    console.log(currentImage.path + " is optimized");
                }
            });
        });*/
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

            this.iterationInputArray = [];
            this.iterationOutputArray = [];
            this.inputImagesArray = this.createImagesArray(outputPath, files);
            this.outputImagesArray = this.createImagesArray(outputPath, files, true);

            //console.log("in:", this.inputImagesArray)
            //console.log("out:", this.outputImagesArray)

            this.optimizeIteration();
        });
    }
}

let userArgs = process.argv.slice(2);

let compressor = new ImageCompressor(userArgs);
