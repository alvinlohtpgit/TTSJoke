const fs = require('fs');
const request = require('request');
const xmlbuilder = require('xmlbuilder');
const querystring = require('querystring');
const storage = require('azure-storage');
const path = require('path');
const ShortUniqueId = require('short-unique-id');
var uid = new ShortUniqueId();

module.exports = function (context, req) {

    const subscriptionKey = "b7a3646cb49d49a99eb72e4bd2a4452b";
    const containerName = "ttsjoketemp";


    context.log('Called TTS Conversion');

    // Connect to the blob service
    var connectionString = "DefaultEndpointsProtocol=https;AccountName=ttsjokestorage;AccountKey=25IvuBE3VYBJI8Rrmti9TsAoKhzfZiFiDusdZ6aOOsfKAxWerzhrYsEWZfCOwHSKYUw1xvojzIOHHLY0hzkafA==";
    const blobService = storage.createBlobService(connectionString);


    var textToConvert = querystring.parse(req.body).saythis;

    context.log("Text To Convert - " + textToConvert);

    // Create the SSML request
    let xml_body = xmlbuilder.create('speak')
        .att('version' , '1.0')
        .att('xml:lang','en-us')
        .ele('voice')
        .att('xml:lang', 'en-us')
        .att('name' , 'Microsoft Server Speech Text to Speech Voice (en-US, Guy24KRUS)')
        .txt(textToConvert)
        .end();

    let body = xml_body.toString();



    // Call the async function to get the access token first
    var optionsTokenKey = {
        method: 'POST',
        uri: 'https://eastus2.api.cognitive.microsoft.com/sts/v1.0/issuetoken',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    };


    request(optionsTokenKey , function(err , response, tokenKey) {

        // Now that we have our token key, we can call the TTS service on Azure
        // Options for convert text to speech
        var optionsToConvertSpeech = {
            method: 'POST',
            baseUrl: 'https://eastus2.tts.speech.microsoft.com/',
            url: 'cognitiveservices/v1',
            headers: {
                'Authorization': 'Bearer ' + tokenKey,
                'cache-control': 'no-cache',
                'User-Agent': 'TestSpeech',
                'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
                'Content-Type': 'application/ssml+xml'
            },
            body: body
        };


        let requestobj = request(optionsToConvertSpeech)
            .on('response', (response) => {

                context.log("Response : " + response.statusCode);
                /*
                requestobj.pipe(fs.createWriteStream('TTSOutput.wav')).on('finish' , function() {

                    // Upload the file onto the Azure Blob Storage
                    const fullPath = path.resolve("TTSOutput.wav");
                    const blobName = path.basename("TTSOutput.wav");
                    blobService.createBlockBlobFromLocalFile(containerName , blobName , fullPath , function(){
                       context.log("File is uploaded");
                       context.res = {
                           status: 200,
                           body: "File Generated"
                       };
                       context.done();
                    });



                }); */

                // The above doesn't work on remote Azure Functions
                // Probably because we don't have a file system
                // So we use stream to blob

                // We generate a random file name
                var genFileName = uid.randomUUID(8) + ".wav";
                var writeStream = blobService.createWriteStreamToBlockBlob(
                    containerName,
                    genFileName,
                    {
                        contentSettings: {
                            contentType: 'audio/x-wav'
                        }
                    },
                    function (uploaderror, uploadresult, uploadresponse) {
                        if (uploaderror) {
                            context.log("Cannot upload file");
                            context.log(error);
                        } else {
                            context.log("File Uploaded to Storage");
                            context.res = {
                                status: 200,
                                body: genFileName
                            };
                            context.done();
                        }
                    });

                requestobj.pipe(writeStream).on('finish', function () {
                    context.log("File is uploaded");
                });


            })

    })

};
