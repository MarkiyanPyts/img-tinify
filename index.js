#!/usr/bin/env node
"use strict";

let path = require("path");
let fs = require('fs');
let tinify = require("tinify");
let recursive = require('recursive-readdir');

process.env.INIT_CWD = process.cwd();

class ImageCompressor {
    constructor(apiKey, whatIsCount) {
        if(apiKey) {
            tinify.key = apiKey;
            if(whatIsCount == "count") {
                this.howMuchDidICompress();
                return false;
            }
            this.compressImages();
        }else {
            console.log("please specify your tinyPng API key");
        }
    }

    howMuchDidICompress() {
        tinify.validate(function(err) {
          if (!err) {
              console.log("you optimized " + tinify.compressionCount + " images this month", "max number of free images is 500");
          }
        })
    }

    compressImages() {
        function ignoreFunc(file, stats) {
            if(path.basename(file).match(/.*\.jpg$/g) || path.basename(file).match(/.*\.png$/g) || stats.isDirectory()) {
                return false;
            }else {
                return true;
            }
        }
        recursive(process.env.INIT_CWD, [ignoreFunc], function (err, files) {
            files.forEach((name) => {
                var source = tinify.fromFile(name).toFile(name, function(err) {
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
let compressor = new ImageCompressor(userArgs[0], userArgs[1]);
