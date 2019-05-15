const fs = require('fs');
const request = require('request');
const xmlbuilder = require('xmlbuilder');
const querystring = require('querystring');
const MemoryStream = require('memorystream');

module.exports = function (context, req) {
    context.log('Called TTS Conversion');

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

    const subscriptionKey = "b7a3646cb49d49a99eb72e4bd2a4452b";


    // Call the async function to get the access token first
    var optionsTokenKey = {
        method: 'POST',
        uri: 'https://eastus2.api.cognitive.microsoft.com/sts/v1.0/issuetoken',
        headers: {
            'Ocp-Apim-Subscription-Key': subscriptionKey
        }
    };


    request(optionsTokenKey , function(err , response, tokenKey){

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
               requestobj.pipe(fs.createWriteStream('TTSOutput.wav')).on('finish' , function() {

                   // Upload the file onto the Azure Blob Storage

                   // After the upload completes, send the context back with the generated file name
                   // then delete the local file



                   // Read the generated file
                   /* var wavContent = fs.readFileSync("TTSOutput.wav");
                   var wavContentBuffer = Buffer.from(wavContent).toString('base64');
                   context.log('Read file into memory');
                   context.log(wavContentBuffer);
                   context.res = {
                        status: 200,
                        headers: {
                            "Content-Type" : "audio/wav"
                        },
                        isRaw: true,
                        body: wavContentBuffer
                    }; */

                   context.done();
               });

            })




        /*
        request(optionsToConvertSpeech , function(err, resp , body){
            context.log('Return body');

            context.log(body);

            context.res = {
                status: 200,
                headers:{
                    "Content-Type" : "audio/wav"
                },
                body: body
            };

            context.done();
        });
        */




    })



    /*
    if (req.query.name || (req.body && req.body.name)) {
        context.res = {
            // status: 200,
            body: "Hello " + (req.query.name || req.body.name)
        };
    }
    else {
        context.res = {
            status: 400,
            body: "Please pass a name on the query string or in the request body"
        };
    }*/

};
