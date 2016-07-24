# img-tinyfy
> It's npm tool based on https://tinypng.com API which allows you to minify all images under the folder you navigated to in Windows command line or Unix terminal.

##Installation & Usage
Tool must be installed globally to be used.

1. Inatall node.js and npm from here https://nodejs.org/en/
2. Get Your API key from https://tinypng.com/developers
3. Run ```npm install -g img-tinyfy```
4. Set API key ```img-tinyfy setkey Your API KEY HERE``` for example : ```img-tinyfy setkey AFFfSGgH35FFDs56```
4. Navigate to folder with your images with ```cd``` command
5. Run ```img-tinyfy```

After step 5 all ```png``` and ```jpg``` images in current directory and it's subdirectories will get optimized.

##Setting different output directory
If you wish your optimized images to land in different directory than your current one, you can set output absolute path before running step 5 mentioned above with the following command:

```img-tinyfy setpath path/to/output/dir```

for exmple :

```img-tinyfy setpath D:\images\output```

on Windows or simple forward slashes in UNIX, just copy a path from your file explorer.

Images will be copied to the output directory preserving original folder structure.

If you wish to disable output directory and return to the original behaviour with optimizing images in your current folder run:

``````img-tinyfy setpath false``````


>Note: you have 500 images per month to optimize for free, you have to pay https://tinypng.com to get more images optimized per 1 month.

To Get info about how much images you already optimized this month run the following command:

```img-tinyfy count```

For example:

```img-tinyfy count```




