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

To get info about how much images you already optimized this month run the following command:

```img-tinyfy count```

For example:

```img-tinyfy count```

##Advanced options
Starting at version 1.1.0 img-tinyfy has support for giant image folders optimization.

##```iterationNumber```
img-tinyfy limits number of images processed at once with ```iterationNumber``` option which is 25 images per iteration.

##```iterationCheckInterval```

After iteration first started plugin will wait till period of time passes ```iterationCheckInterval``` (60000 miliseconds by default, which is 1 minute), when this time is out plugin checks if 25(by default) images was optimized without errors if yes next iteration starts, if not all images is processed yet or there are corrupt images which can not be processed img-tinyfy will wait for another ```iterationCheckInterval``` and so on, till it reaches ```iterationTimeout```

##```iterationTimeout```
If there is still not optimized images after ```iterationTimeout``` period of time has passed since the start of current iteration, 

Which is usually caused by this images being corrupt or network connection errors(which can occur when to many images are sent for processing at once ...controlled by ```iterationNumber```)

img-tinyfy will move this not optimized images into **notProcessed** folder under your current cd directory, which you can use after to fix corrupt images or run optimization on images which was not prcessed for the first time for some reason.

**notProcessed** folder will preserve the folder structure images had before optimization,

So after you fix issues you can merge them with images which was optimized first time with simple drag and drop.

>**Important Note**: remember that **notProcessed** folder will appear in your cd folder so keep that in mind when you run ```img-tinyfy``` on the same folder again.

##Error logs
Any errors which appear while optimization is in progress is written to **img_tinyfy_error.log** file which will be created under your current cd directory.

##Not Processed images log
After ```iterationTimeout``` has passed on current optimization iteration, aside from being moved to **notProcessed** directory **img_tinyfy_corrupt_images.log** file will appear under your cd directory with info about every image which was not optimized in current iteratioon.

>**Important Note**: Different output directory is reccomended for big image catalog processing, also ```setpath``` should point to folder on the same disc partition to avoid unprediatable issues.

