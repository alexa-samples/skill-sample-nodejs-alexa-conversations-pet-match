// *****************************************************************************
// Copyright 2020 Amazon.com, Inc. or its affiliates.  All Rights Reserved.

// You may not use this file except in compliance with the terms and conditions
// set forth in the accompanying LICENSE.TXT file.

// THESE MATERIALS ARE PROVIDED ON AN "AS IS" BASIS. AMAZON SPECIFICALLY
// DISCLAIMS, WITH RESPECT TO THESE MATERIALS, ALL WARRANTIES, EXPRESS, IMPLIED,
// OR STATUTORY, INCLUDING THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
// *****************************************************************************
'use strict';

const Alexa = require('ask-sdk-core');
const data = require('./PetMatch.json');

const GetRecommendationAPIHandler = {
    
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Dialog.API.Invoked' 
            && handlerInput.requestEnvelope.request.apiRequest.name === 'getRecommendation';
    },
    handle(handlerInput) {
        const apiRequest = handlerInput.requestEnvelope.request.apiRequest;
        
        let energy = resolveEntity(apiRequest.slots, "energy");
        let size = resolveEntity(apiRequest.slots, "size");
        let temperament = resolveEntity(apiRequest.slots, "temperament");
        
        const recommendationResult = {};
        if (energy !== null && size !== null && temperament !== null) {
            const key = `${energy}-${size}-${temperament}`;
            const databaseResponse = data[key];
            
            console.log("Response from mock database ", databaseResponse);
            
            recommendationResult.name = databaseResponse.breed;
            recommendationResult.size = apiRequest.arguments.size
            recommendationResult.energy = apiRequest.arguments.energy
            recommendationResult.temperament = apiRequest.arguments.temperament;
        }
        
        const response = buildSuccessApiResponse(recommendationResult);
        console.log('GetRecommendationAPIHandler', JSON.stringify(response));
        
        return response;
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// *****************************************************************************
// Resolves catalog value using Entity Resolution
const resolveEntity = function(resolvedEntity, slotName) {

    //This is built in functionality with SDK Using Alexa's ER
    let erAuthorityResolution = resolvedEntity[slotName].resolutions 
        .resolutionsPerAuthority[0];
    let value = null;
    
    if (erAuthorityResolution.status.code === 'ER_SUCCESS_MATCH') {
        value = erAuthorityResolution.values[0].value.name;
    }
    
    return value;
};

// *****************************************************************************
// Generic session-ended handling logging the reason received, to help debug in error cases.
// Ends Session if there is an error 
const SessionEndedRequestHandler = { 
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },    
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

// *****************************************************************************
// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = { 
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(JSON.stringify(handlerInput.requestEnvelope.request));
        console.log(`Error handled: ${error.stack}`);
        
        return handlerInput.responseBuilder
        .speak('Sorry, an error occurred.')
        .reprompt('Sorry, an error occurred.')
        .getResponse();
    }
};

// *****************************************************************************
// These simple interceptors just log the incoming and outgoing request bodies to assist in debugging.
const RequestInterceptor = { //Happen before handlers
    process(handlerInput) {
        console.log('request -', JSON.stringify(handlerInput));
    }
};

// Happens after handlers
const ResponseInterceptor = { 
    process(handlerInput) {
        console.log('response -', JSON.stringify(handlerInput.responseBuilder.getResponse()));
    }
};

// Formats JSON for return
// You can use the private SDK methods like "setApiResponse()", but for this template for now, we just send back
// the JSON. General request and response JSON format can be found here:
// https://developer.amazon.com/docs/custom-skills/request-and-response-json-reference.html
const buildSuccessApiResponse = (returnEntity) => { 
    return { apiResponse: returnEntity };
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestInterceptors(RequestInterceptor)
    .addRequestHandlers(
        GetRecommendationAPIHandler,
        IntentReflectorHandler,
        SessionEndedRequestHandler
    )
    .addResponseInterceptors(ResponseInterceptor)
    .addErrorHandlers(ErrorHandler)
    .lambda();