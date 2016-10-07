#!/usr/bin/env node
"use strict";

let path = require("path");
let fs = require('graceful-fs');
let tinify = require("tinify");
let recursive = require('recursive-readdir');
let mv = require('mv');
let mkdirp = require('mkdirp');

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
                this.writeLog(err.message, "error");
            }
        }

        this.errorLog = path.resolve(process.env.INIT_CWD + "/img_tinyfy_error.log");
        this.notOptimizedLog = path.resolve(process.env.INIT_CWD + "/img_tinyfy_not_optimized.log");
        this.successLog = path.resolve(process.env.INIT_CWD + "/img_tinyfy_success.log");

        this.commands = {
            "setOutputPath": "setpath",
            "setApiKey": "setkey",
            "resetDefaultConfig": "reset",
            "countOfCompressedImages": "count",
            "setCheckInterval": "setchecktime",
            "setIterationTimeout": "settimeout",
            "setIterationNumber": "setiteration",
            "moveSuccessFiles": "moveoptimized"
        };

        this.configDefaults =  {
            outputPath: "false",
            apiKey: "",
            iterationNumber: 25, //number of images to process at once
            iterationCheckInterval: 60000,// 1 minute
            iterationTimeout: 180000, // 3 minutes
        };

        if(userArgs.length > 2) {
            this.writeLog("too many arguments", "error");
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
                case this.commands.setCheckInterval:
                    commandParam = userArgs[1];
                    this.setCheckInterval(commandParam);
                break;
                case this.commands.setIterationTimeout:
                    commandParam = userArgs[1];
                    this.setIterationTimeout(commandParam);
                break;
                case this.commands.setIterationNumber:
                    commandParam = userArgs[1];
                    this.setIterationNumber(commandParam);
                break;
                case this.commands.moveSuccessFiles:
                    commandParam = userArgs[1];
                    this.moveSuccessFiles(commandParam);
                break;
                case this.commands.resetDefaultConfig:
                    this.resetDefaultConfig();
                break;
                default:
                    this.writeLog("You misspelled command name", "error");
                return;
            }
        }
    }

    setCheckInterval(interval) {
        if(!interval) {
            this.writeLog("Please specify interval", "error");
            return;
        }

        interval = parseInt(interval);

        if(!interval) {
            this.writeLog("iterationCheckInterval must be integer number of miliseconds", "error");
            return;
        }

        this.setConfig("iterationCheckInterval", interval);
    }

    setIterationTimeout(timeout) {
        if(!timeout) {
            this.writeLog("Please specify timeout", "error");
            return;
        }

        timeout = parseInt(timeout);

        if(!timeout) {
            this.writeLog("iterationTimeout must be integer number of miliseconds", "error");
            return;
        }

        this.setConfig("iterationTimeout", timeout);
    }

    setIterationNumber(iterationNumber) {
        if(!iterationNumber) {
            this.writeLog("Please specify iterationNumber", "error");
            return;
        }

        iterationNumber = parseInt(iterationNumber);

        if(!iterationNumber) {
            this.writeLog("iterationNumber must be integer number of images to be processed at once", "error");
            return;
        }

        this.setConfig("iterationNumber", iterationNumber);
    }

    resetDefaultConfig() {
        var configDefaults = this.configDefaults;
        fs.open(this.configName, "w", (err, fd) => {
            if (err) {
                this.writeLog(err.message, "error");
                return;
            }

            fs.writeFile(this.configName, "module.exports = \n"+JSON.stringify(this.configDefaults, null, 4), (err) => {
                if (err) {
                    this.writeLog(err.message, "error");
                    return;
                }

                console.log("Default configs are set");
            });
        });
    }

    writeLog(logMessage, logType) {
        let logName;
        let currentDate = new Date();

        if(logType === "error") {
            console.log(logMessage);
            logName = this.errorLog;
        }else if(logType === "notOptimized") {
            console.log(logMessage);
            logName = this.notOptimizedLog;
        }else if(logType === "success") {
            logName = this.successLog;
        }

        if(logType === "success") {
            fs.appendFile(logName, logMessage + ",", (err) => {
                if (err) {
                    console.log(err.message, "error");
                }
            });
        }else {
            fs.appendFile(logName, "\n" + currentDate.getDate() + "/" + (currentDate.getMonth() + 1) + "/" + currentDate.getFullYear() + " " + currentDate.getHours() + ":" +currentDate.getMinutes() + ": " + logMessage, (err) => {
                if (err) {
                    console.log(err.message, "error");
                }
            });
        }
    }

    setConfig(name, value) {
        let newConfig = {};
        newConfig[name] = value;
        let mergedConfig = Object.assign({}, this.config, newConfig);

        fs.writeFile(this.configName, "module.exports = \n"+JSON.stringify(mergedConfig, null, 4), (err) => {
          if (err) {
              this.writeLog(err.message, "error");
          }

          console.log(`${name} is set to ${value}`);
        });
    }

    setOutputPath(path) {
        if(!path) {
            this.writeLog("Please specify a path", "error");
            return;
        }
        this.setConfig("outputPath", path);
    }

    setApiKey(key) {
        if(!key) {
            this.writeLog("Please specify an API key", "error");
            return;
        }
        this.setConfig("apiKey", key);
    }

    howMuchDidICompress() {
        tinify.validate((err) => {
            if (err) {
                if(err.message.indexOf("Error while connecting") !== -1) {
                    this.writeLog("You seem to have trouble with network connection", "error");
                }else {
                    this.writeLog("Your API key is not yet set, or it's invalid", "error");
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
                    this.writeLog("You seem to have trouble with network connection", "error");
                }else {
                    this.writeLog(`Your API key is not yet set, or it's invalid, you can set it with "img-tinyfy ${this.commands.setApiKey} YOURKEYHERE" command`, "error");
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
                            this.writeLog(`The output path set in config is not a directory, you can use "img-tinyfy ${this.commands.setOutputPath} OUTPUTPATHHERE" to set it properly, if you set path to false images will be compressed in their location`, "error");
                        }
                    } catch(err) {
                        this.writeLog(`The output path set in config is not a directory, you can use "img-tinyfy ${this.commands.setOutputPath} OUTPUTPATHHERE" to set it properly, if you set path to false images will be compressed in their location`, "error");
                        return;
                    }
                }
            }
        });
    }

    createOutputImagesArray(outputPath, inputImages) {
        let outputImages = [];
        let outputDirPath;

        if(!outputPath) {
            inputImages.forEach((imagePath) => {
                imagePath = path.normalize(imagePath);

                outputImages.push(imagePath);
            });

            return outputImages;
        }else {
            inputImages.forEach((imagePath) => {
                imagePath = path.normalize(imagePath);
                outputDirPath = imagePath.replace(path.normalize(process.env.INIT_CWD), outputPath);

                outputImages.push(outputDirPath);
            });

            return outputImages;
        }
    }

    optimizeIteration() {
        if(!this.inputImagesArray.length || !this.outputImagesArray.length) {
            return false;
        }

        console.log("Images optimization is in progress, starting new iteration...");

        this.iterationInputArray = [];
        this.iterationOutputArray = [];
        this.iterationStartTime = new Date();

        if(this.inputImagesArray.length >= this.config.iterationNumber) {
            while(this.iterationInputArray.length < this.config.iterationNumber && this.inputImagesArray.length > 0) {
                this.iterationInputArray.push(this.inputImagesArray.shift());
            }

            while(this.iterationOutputArray.length < this.config.iterationNumber && this.outputImagesArray.length > 0) {
                this.iterationOutputArray.push(this.outputImagesArray.shift());
            }
        }else {
            while(this.inputImagesArray.length > 0) {
                this.iterationInputArray.push(this.inputImagesArray.shift());
            }

            while(this.outputImagesArray.length > 0) {
                this.iterationOutputArray.push(this.outputImagesArray.shift());
            }
        }

        this.currentIterationNotOptimized = this.iterationInputArray;

        this.iterationInputArray.forEach((currentImage, index) => {
            if(this.config.outputPath !== "false") {
                try {
                    mkdirp.sync(path.parse(this.iterationOutputArray[index]).dir);//create directory if it does not exist
                } catch(err) {
                    if(err.message.indexOf("EXIST") == -1) {
                        this.writeLog(err.message, "error");
                    }
                }
            }

            var source = tinify.fromFile(currentImage).toFile(this.iterationOutputArray[index], (err) => {
                if(err) {
                    if (err instanceof tinify.AccountError) {
                        this.writeLog("Verify your API key and account limit.", "error");
                    } else if (err instanceof tinify.ClientError) {
                        this.writeLog("Check your source image and request options. Input image may be corrupt.", "error");
                    } else if (err instanceof tinify.ServerError) {
                        this.writeLog("Temporary issue with the Tinify API.", "error");
                    } else if (err instanceof tinify.ConnectionError) {
                        this.writeLog("A network connection error occurred.", "error");
                    } else {
                        this.writeLog("The error message is: " + err.message, "error");
                    }

                    this.processedImages++;
                    console.log(`${this.processedImages} ${this.processedImages === 1 ? "image" : "images"} is processed out of ${this.imagesToProcess}`);

                    if(this.processedImages >= this.imagesToProcess) {
                        console.log("Optimization Finished!!!");
                    }
                }else {
                    this.processedImages++;

                    console.log(currentImage + " is optimized");
                    console.log(`${this.processedImages} ${this.processedImages === 1 ? "image" : "images"} is processed out of ${this.imagesToProcess}`);
                    this.writeLog(currentImage, "success");
                    this.currentIterationNotOptimized.splice(this.currentIterationNotOptimized.indexOf(currentImage), 1); //remove optimized image from the array of not optimized ones

                    if(this.processedImages >= this.imagesToProcess) {
                        console.log("Optimization Finished!!!");
                    }
                }
            });
        });

        this.iterationTimeout();
    }

    iterationTimeout() {
        setTimeout(() => {
            let currentTime = new Date();
            let timeSinceLastIterationStart = currentTime - this.iterationStartTime;

            if(timeSinceLastIterationStart <= this.config.iterationTimeout) {
                if(!this.currentIterationNotOptimized.length) {
                    console.log("Current iteration images is optimized, moving to the next one");
                    this.optimizeIteration();//All good move to next Iteration
                }else {
                    this.writeLog("Still have some not optimized images, waiting for them to process", "error");
                    this.iterationTimeout();//Still issues wait
                }
            }else {
                if(!this.currentIterationNotOptimized.length) {
                    console.log("Current iteration images is optimized, moving to the next one");
                    this.optimizeIteration();//All good move to next Iteration
                }else {
                    this.moveCorruptFiles();//Time is out move corrupted files to logs
                }
            }
        }, this.config.iterationCheckInterval);
    }

    moveCorruptFiles() {
        let remainingNotOptimized = this.currentIterationNotOptimized.length;

        this.currentIterationNotOptimized.forEach((corruptImage, index) => {
            this.writeLog(`${corruptImage} is corrupt, or could not be optimized for some reason, we will try to move it to notProcessed folder`, "notOptimized");

            let imagePath = path.normalize(corruptImage);
            let corruptImagesOutputDir = path.normalize(process.env.INIT_CWD + "/notProcessed");
            let outputDirPath = imagePath.replace(path.normalize(process.env.INIT_CWD), corruptImagesOutputDir);

            try {
                mkdirp.sync(path.parse(outputDirPath).dir); //create directory if it does not exist
            } catch(err) {
                if(err.message.indexOf("EXIST") == -1) {
                    this.writeLog(err.message, "error");
                }
            }

            mv(corruptImage, outputDirPath, (err) => {
                if(err) {
                    this.writeLog(err.message, "error");
                }

                remainingNotOptimized--;

                if(remainingNotOptimized <= 0) {
                    this.writeLog("moved not optimized images to notProcessed folder, starting new iteraation", "error");
                    this.optimizeIteration();//continue with optimization after bad images are in notProcessed folder
                }
            });
        });
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
                this.writeLog("There is no .png nor .jpg images in current folder", "error");
                return;
            }

            this.iterationInputArray = [];
            this.iterationOutputArray = [];
            this.inputImagesArray = files;
            this.outputImagesArray = this.createOutputImagesArray(outputPath, files);
            this.imagesToProcess = this.inputImagesArray.length;
            this.processedImages = 0;

            fs.closeSync(fs.openSync(this.successLog, 'w'));//Empty successLog

            this.optimizeIteration();
        });
    }

    moveSuccessFiles(outputDir) {
        try {
            outputDir = path.normalize(outputDir);
        }catch(err) {
            this.writeLog("output directory path is wrong", "error");
            return;
        }

        fs.open(this.successLog, "a+", (err, fd) => {
            if (err) {
                this.writeLog(`could not open ${this.successLog} for reading`, "error");
                return;
            }

            fs.readFile(this.successLog, "utf8", (err, data) => {
                if (err) {
                    this.writeLog(`could not open ${this.successLog} for reading`, "error");
                    return;
                }

                this.optimizedImagesArray = data.split(",");
                this.optimizedImagesArray.pop();

                this.optimizedImagesArray = this.optimizedImagesArray.map((item) => {
                    return path.normalize(item);
                });

                this.optimizedImagesOutputArray = this.createOutputImagesArray(outputDir, this.optimizedImagesArray);

                this.moveIteration();
            });
        });
    };

    moveIteration() {
        if(!this.optimizedImagesArray.length || !this.optimizedImagesOutputArray.length) {
            console.log("Images move Finished!!!");
            return false;
        }

        console.log("Images move is in progress, starting new iteration...");

        this.moveIterationInputArray = [];
        this.moveIterationOutputArray = [];

        if(this.optimizedImagesArray.length >= 50) {
            while(this.moveIterationInputArray.length < 50 && this.optimizedImagesArray.length > 0) {
                this.moveIterationInputArray.push(this.optimizedImagesArray.shift());
            }

            while(this.moveIterationOutputArray.length < 50 && this.optimizedImagesOutputArray.length > 0) {
                this.moveIterationOutputArray.push(this.optimizedImagesOutputArray.shift());
            }
        }else {
            while(this.optimizedImagesArray.length > 0) {
                this.moveIterationInputArray.push(this.optimizedImagesArray.shift());
            }

            while(this.optimizedImagesOutputArray.length > 0) {
                this.moveIterationOutputArray.push(this.optimizedImagesOutputArray.shift());
            }
        }

        this.imagesToMove = this.moveIterationInputArray.length;

        this.moveIterationInputArray.forEach((inputImage, index) => {
            try {
                mkdirp.sync(path.parse(this.moveIterationOutputArray[index]).dir);//create directory if it does not exist
            } catch(err) {
                if(err.message.indexOf("EXIST") == -1) {
                    this.writeLog(err.message, "error");
                }
            }

            mv(inputImage, this.moveIterationOutputArray[index], (err) => {
                if(err) {
                    //this.writeLog(`failed to move ${inputImage}, maybe you moved it already or there is other issue.`, "error");
                    this.writeLog(err.message, "error");
                }else {
                    console.log(`${inputImage} is moved`);
                }

                this.imagesToMove--;
            });
        });

        this.moveIterationTimeout();
    }

    moveIterationTimeout() {
        setTimeout(() => {
            if(this.imagesToMove.length) {
                this.moveIterationTimeout();
            }else {
                this.moveIteration();
            }
        }, 1000);
    }
}

let userArgs = process.argv.slice(2);

let compressor = new ImageCompressor(userArgs);
