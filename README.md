# img-tinify
> It's npm tool based on https://tinypng.com API which allows you to minify all images under the folder you navigated to in Windows command line or Unix terminal.

##Installation
Tool must be installed globally to be used.

1. Inatall node.js and npm from here https://nodejs.org/en/
2. Get Your API key from https://tinypng.com/developers
3. Run ```npm install -g img-tinify```
4. Navigate to folder with your images with ```cd``` command
5. Run ```img-tinify Your API KEY HERE``` for example ```img-tinify AFFfSGgH35FFDs56```

By tunning step 5 all ```png``` and ```jpg``` images in current directory and it's subdirectories will get optimized.

>Note: you have 500 images per month to optimize for free, you have to pay https://tinypng.com to get more images optimized per 1 month.

To Get info about how much images you already optimized this month run the following command:

```img-tinify Your API KEY HERE count```

For example:

```img-tinify AFFfSGgH35FFDs56 count```




