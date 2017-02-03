/**
    Created by Andrew Byrd
*/

/**
 * This program uses an API to obtain commodity prices, and Alexa relays that information to users

 * Examples:
 * One-shot model:
 * User:  "Alexa, ask Prices for current value of Apple, Inc."
 * Alexa: "Apple, Inc's current share price is $128. Would you like to hear historical prices?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open Prices"
 * Alexa: "Prices. What commodity would you like to know the price of?"
 * User:  "Apple, Inc."
 * Alexa: "Apple, Inc's current share price is $128. Would you like to hear historical prices?"
 * User:  "Yes."
 * Alexa: "How far back would you like to go?"
 * User: "5 days ago"
 * Alexa: "Apple Inc's share price 5 days ago was $[x]; [$y] dollars (lower/higher) than it's current price of $128. Would you like to hear another comparison?"
 * User: "No"
 * Alexa: "Ok. Goodbye!"
 */


/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

//this is going to allow me to talk to the commodity price listing API
var https = require('https');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions. Alexa Skill is nothing more than a constructor function and its
 * associated methods
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix from which to search prices
 */
var urlPrefix = undefined; //this will be updated later after I've gotten the speech working


// PriceSkill is a child of AlexaSkill.

var PriceSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill. so now PriceSkill is a constructor function that inherits all methods (at present) from AlexaSkill
PriceSkill.prototype = Object.create(AlexaSkill.prototype);
PriceSkill.prototype.constructor = PriceSkill;

PriceSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("PriceSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

PriceSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("PriceSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

PriceSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

PriceSkill.prototype.intentHandlers = {

    "GetCurrentListingIntent": function (intent, session, response) {
        handleGetCurrentPriceRequest(intent, session, response);
    },

    "GetHistoryIntent": function (intent, session, response) {
        handleGetHistoryRequest(intent, session, response);
    },

    //here, we're overriding Amazon's built-in help intent functionality (i think). So based on the user's words, Alexa deciphers that 
    //we should run HelpIntent, which is simply a function. the response.ask makes her talk back to the user, with the expectation of a response
    //from the user
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Prices, you can get the current listing for share prices of a company of your choice.  " +
            "For example, you could say Apple, Inc., or Amazon, Inc., or you can say exit. Now, which company would you like to hear about?";
        var repromptText = "Which company's current stock price would you like to know?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    },

    //i'm making her say Ok, Goodbye! when she detects that the user has said something (like "exit" or "stop") to trigger the StopIntent
    //I wonder why here we don't have like a session.close() or something?
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Ok, Goodbye!",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },
    
    //seems as though response.tell is just talking to the user with no expectation of a response back from the user
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Ok, Goodbye!",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**
 * Function to handle the onLaunch skill behavior
 */

function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    console.log(response);
    var cardTitle = "Company Name from response hopefully";
    var repromptText = "With Prices, you can get the current listing for share prices of a company of your choice.  " +
            "For example, you could say Apple, Inc., or Amazon, Inc., or you can say exit. Now, which company would you like to hear about?";
    var speechText = "<p>Prices.</p> <p>What company would you like the current price of?</p>";
    var cardOutput = "Prices. What company would you like to know the current stock price of?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleGetCurrentPriceRequest(intent, session, response) {
    console.log("Current Price Request \n");
    console.log(response);
    var daySlot = intent.slots.day;
    var repromptText = "With Prices, you can get the current listing for share prices of a company of your choice.  " +
            "For example, you could say Apple, Inc., or Amazon, Inc., or you can say exit. Now, which company would you like to hear about?";
 
    var sessionAttributes = {};
    
    var speechOutput = {
        speech: "Apple's current stock price is $128",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    
    response.tell(speechOutput);

}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleGetHistoryRequest(intent, session, response) {
    console.log("History Request \n");
    console.log(response);
    var daySlot = intent.slots.day;
    var repromptText = "With Prices, you can get the current listing for share prices of a company of your choice.  " +
            "For example, you could say Apple, Inc., or Amazon, Inc., or you can say exit. Now, which company would you like to hear about?";
 
    var sessionAttributes = {};
    
    var speechOutput = {
        speech: "Apple's Inc.'s price 5 days ago was $125. Current stock price is $128",
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    
    response.tell(speechOutput);
}



// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new PriceSkill();
    skill.execute(event, context);
};

