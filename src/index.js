/**
    Created by Andrew Byrd
*/

/**
 * This program uses an API to obtain commodity prices, and Alexa relays that information to users

 * Examples:
 * One-shot model:
 * User:  "Alexa, ask cards for information about Monastery Swiftspear"
 * Alexa: "Monastery Swiftspear: mana cost: 1, type: creature, text: haste, prowess. Would you like to hear more?"
 * User: "No."
 * Alexa: "Good bye!"
 *
 * Dialog model:
 * User:  "Alexa, open Cards"
 * Alexa: "Welcome to Magic Card information station!. What card would you like to hear about?"
 * User:  "Monastery Swiftspear"
 * Alexa: "Monastery Swiftspear: mana cost: 1, type: creature, text: haste, prowess. Would you like to hear more?"
 * User:  "Yes."
 * Alexa: "What would you like to know?"
 * User:  "tell me it's power and toughness"
 * Alexa: "Monastery swiftspear has power of 1 and toughness of 2. Would you like to hear more?"
 * User: "No"
 * Alexa: "Ok. Goodbye!"
 */


/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

//this allows me to access the database of Magic cards
const agent = require('mtgsdk');

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions. Alexa Skill is nothing more than a constructor function and its
 * associated methods
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * URL prefix from which to search prices
 */
var urlPrefix = undefined; //this will be updated later after I've gotten the speech working


// CardSkill is a child of AlexaSkill.

var CardSkill = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill. so now CardSkill is a constructor function that inherits all methods (at present) from AlexaSkill
CardSkill.prototype = Object.create(AlexaSkill.prototype);
CardSkill.prototype.constructor = CardSkill;

CardSkill.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("CardSkill onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    session.attributes.wantsToChangeCards = true;
};

CardSkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("CardSkill onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response, session);
};

CardSkill.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

CardSkill.prototype.intentHandlers = {

    "GetCardIntent": function (intent, session, response) {
        handleGetCardRequest(intent, session, response);
    },

    "GetDetailsIntent": function (intent, session, response) {
        handleGetDetailsRequest(intent, session, response);
    },
    
    "AMAZON.YesIntent": function (intent, session, response) {
        handleGetConfirmationFromUser(intent, session, response);
    },

    //here, we're overriding Amazon's built-in help intent functionality (i think). So based on the user's words, Alexa deciphers that 
    //we should a HelpIntent was called, which we correlate with the function described here. the response.ask makes her talk back to the user, with the expectation of a response
    //from the user
    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "With Cards, you can get information about thousands of Magic Cards, all the way up to the Battle for Zendikar set!  " +
            "For example, you could say Path to Exile. or Dark Confidant. or you can say exit. Now, which card would you like to hear about?";
        var repromptText = "Which card's info would you like to know?";
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
    //I wonder why here we don't have like a session.close() or something? <- because tell indicates that sessionShouldEnd = true
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

function getWelcomeResponse(response, session) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    
    var cardTitle = "Select a Card";
    var repromptText = "With Cards, you can get information about thousands of Magic Cards, all the way up to the Battle for Zendikar set!  " +
            "For example, you could say Path to Exile. or Dark Confidant. or you can say exit. Now, which card would you like to hear about?";
    var speechText = "<p>Welcome to Magic Card Information Station!</p> <p>What card would you like to hear about?</p>";
    var cardOutput = "Welcome to Cards. What card would you like to learn about?";
    var cardOutput = "Welcome to Cards. What card would you like to learn about?";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.

    var speechOutput = {
        speech: speechText ,
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    
    session.attributes.wantsToChangeCards = true;
    response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
}

/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleGetCardRequest(intent, session, response) {
   
    var repromptText = "I'm awaiting your interest. Which card would you like to learn about?";
    
    var repromptOutput = {
        speech:  repromptText ,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    
    //store the requested card name in the session so that we may pull a history on it if requested
    
    if(session.attributes.card && !session.attributes.wantsToChangeCards){
        session.attributes.wantsToChangeCards = true;
        var speechOutput = {
            speech:  "Hey we're supposed to be talking about card details right now. If you're done with " + session.attributes.card + " then say a different card and we can start over." ,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
        return;
    }else{
    
        retrieveCardByName(intent.slots.card.value).then(function(card){
        if (card && session.attributes.wantsToChangeCards){
            var speechOutput = {
                speech: card.name + "'s mana cost is " + updateManaCost(card.manaCost) + ", type is " + card.type + ".. card text is " + updateManaCost(card.text) + " ...You can say a different card now if you'd like. Otherwise: would you like to hear more details about this card?" ,
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            
        }else{
            var speechOutput = {
                speech: "I'm not familiar with that card. Which card would you like to know about?",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
            };
            console.log("card: " + card);
        }
            
            session.attributes.card = intent.slots.card.value;
    
    
            response.ask(speechOutput, repromptOutput);
           
        });
                                                                                
        
        
        function updateManaCost(description){
            
            var updatedDescription = description;
            if(updatedDescription.indexOf("{")>=0)
              for (var x = 0; x < 11; x++){
                 if(updatedDescription.indexOf("{")>=0){     
   
                    updatedDescription = updatedDescription.replace("{R}", " Red ");
                    updatedDescription = updatedDescription.replace("{B}", " Black ");
                    updatedDescription = updatedDescription.replace("{U}", " Blue ");
                    updatedDescription = updatedDescription.replace("{G}", " Green ");
                    updatedDescription = updatedDescription.replace("{W}", " White ");
                    updatedDescription = updatedDescription.replace("{T}", " Tap ");
                    updatedDescription = updatedDescription.replace("{B/P}", " Phrexian Black ");
                    updatedDescription = updatedDescription.replace("{R/P}", " Phrexian Red ");
                    updatedDescription = updatedDescription.replace("{G/P}", " Phrexian Green ");
                    updatedDescription = updatedDescription.replace("{W/P}", " Phrexian White ");
                    updatedDescription = updatedDescription.replace("{U/P}", " Phrexian Blue ");
                    updatedDescription = updatedDescription.replace(/{[RGUWB]+\/[RBUGW]+}/, " Hybrid ");
                    
                         
                 }else
                    break;
              }
            
            return updatedDescription;
        }
    }
    
    
    
    
    

}


function handleGetConfirmationFromUser(intent, session, response){
    if(session.attributes.card){
        var speechText = "What would you like to know?";
        if(!session.attributes.knowsAttributes)
            speechText += " for example, you can say: power, or, rarity, or, set.";
    }
    else
        var speechText = "I can help you learn about magic cards! Please say a card name";
    
    var repromptText = "Which card property would you like to hear about?";
    
    
    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
        
    };
    
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    
    session.attributes.wantsToChangeCards = false;
    session.attributes.knowsAttributes = true;
    session.attributes.wantsInfo = true;
    response.ask(speechOutput, repromptOutput);
}
/**
 * Gets a poster prepares the speech to reply to the user.
 */
function handleGetDetailsRequest(intent, session, response) {
    
    
    var card = session.attributes.card;
    var repromptText = "To information about " + card +
            ", Tell me what you'd like to know. For example, you could say: power, or, color, or, rarity.";
 
    
    var cardSpeech = "";
    
    
    if(intent.slots.statistic.value || intent.slots.otherStat.value){
        cardSpeech = card + "'s " + intent.slots.statistic.value + " is " + "1";
        if(intent.slots.otherStat.value)
            cardSpeech += " and its " + intent.slots.otherStat.value +  "is " + "2";
    
    
        var speechOutput = {
            speech:  cardSpeech + " would you like to hear more?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        
    }else{
        var speechOutput = {
            speech:  "That is not a valid card attribute. Try something like: power, or text, or converted mana cost.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
    }
    
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    
    if(!session.attributes.wantsInfo){
        var speechOutput = {
            speech:  "I can help you learn about magic cards! Please say a card name",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
    }
    
    response.ask(speechOutput, repromptOutput);
}

function retrieveCardByName(name){
    return agent.card.where({name: name})
    .then( result =>{
        var card = result[0];
        return card;
    })
    .catch(function(error){
        console.log("Error: " + error);
    });
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the Card Skill.
    var skill = new CardSkill();
    skill.execute(event, context);
};

