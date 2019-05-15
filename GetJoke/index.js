const devpun = require('devpun');

module.exports = async function (context, req) {
    context.log('Getting a random joke');

    // Truncate the q in front of some responses
    var randomJoke = devpun.random();

    // Replace the a. with the word answer
    randomJoke = randomJoke.replace('a. ' , 'Answer: ');

    context.res = {

        body: (randomJoke.startsWith('q.')) ? randomJoke.substr(2) : randomJoke
    };

    context.done();

};
