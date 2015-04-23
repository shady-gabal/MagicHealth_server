var express = require('express');
var router = express.Router();
var twilio = require('twilio');
var User = require('../db/User.js');
var sprintf = require('sprintf-js').sprintf;

var mongoose = require('../db/mongoose_connect.js');

// Your accountSid and authToken from twilio.com/user/account
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = require('twilio')(accountSid, authToken);

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});



router.post('/message', function(req, res){

	console.log(req);

		var phoneNumber = "+13472102276";
		var output = "";

		client.messages.create({
		    to: "+13472102276",
		    from: "+18559561331",
		    body: "Text received."
		}, function(err, responseData) {
			 if (!err) { // "err" is an error received during the request, if any
		        // "responseData" is a JavaScript object containing data received from Twilio.
		        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
		        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
		        console.log(responseData.from); // outputs "+14506667788"
		        console.log(responseData.body); // outputs "word to your mother."
				output += "Sent to " + phoneNumber + "\n";

		    }
		    else{
		    	console.log(err);
		    	output += "Error";
		    }

		    res.send(output);
		});

	output += "Sending to " + phoneNumber + "\n";

});

router.get('/message', function(req, res){
	console.log(req);

	var phoneNumber = "+13472102276";
		var output = "";

	client.messages.create({
	    to: phoneNumber,
	    from: "+18559561331",
	    body: "\nKnock knock. \n Who's there? \n God \n God who? \n Godzilla."
	}, function(err, responseData) {
		 if (!err) { // "err" is an error received during the request, if any
	        // "responseData" is a JavaScript object containing data received from Twilio.
	        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
	        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
	        console.log(responseData.from); // outputs "+14506667788"
	        console.log(responseData.body); // outputs "word to your mother."
			output += "Sent to " + phoneNumber;

	    }
	    else{
	    	console.log(err);
	    	output += "Error";

	    }
	    res.send(output);

	});

	output += "Sending to " + phoneNumber + "\n";

});

router.get('/receiveMessage', function(req, res){
		// console.log(req.query.Body);

	var resp = new twilio.TwimlResponse();
	var messageReceived = req.query.Body;

	console.log(req.query);
	var phoneNumber = req.query.From;
	phoneNumber = phoneNumber.replace("+", "");

	var body;

	var query = User.where({phone_number: phoneNumber});
	query.findOne(function(err, user){
		if (err){
			console.log("Error fetching account for " + phoneNumber + " : " + err);
			body = "There was an error. Our fault b";
		}
		else{
			if (!user){
				console.log("Creating new account for phone number " + phoneNumber + "...");
				//no current account, subscribe
				var newUser = new User({
					phone_number : phoneNumber,
					last_message_received: messageReceived
				});
				newUser.save();
				receiveSubscribe(newUser, res, resp, messageReceived);
			}
			else{
				user.last_message_received = messageReceived;
				console.log("Retrieved account for phone number " + phoneNumber);

				if (!user.has_subscribed){
					receiveSubscribe(user, res, resp, messageReceived);
				}
				else{
					body = "Thank you for subscribing.";
				}
			}
		}


		if (body){
			sendMessageResp(resp, res, body, user);
		}
	});	

	// var body = "No you " + messageReceived.toLowerCase();

	
	// var phoneNumber = "+13472102276";
	// client.messages.create({
	//     to: phoneNumber,
	//     from: "+18559561331",
	//     body: body
	// }, function(err, responseData) {
	// 	 if (!err) { // "err" is an error received during the request, if any
	//         // "responseData" is a JavaScript object containing data received from Twilio.
	//         // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
	//         // http://www.twilio.com/docs/api/rest/sending-sms#example-1
	//         console.log(responseData.from); // outputs "+14506667788"
	//         console.log(responseData.body); // outputs "word to your mother."
	// 		// output += "Sent to " + phoneNumber;

	//     }
	//     else{
	//     	console.log(err);
	//     	// output += "Error";

	//     }
	//     // res.send(output);

	// });


	console.log(resp.toString());
});


function sendSubscribe(user, res, resp, existingBody){
	var index = user.subscribe_step;
	var body = "";

	if (existingBody)
		body = existingBody + " ";

	switch(index){
		// case -1: //Welcome to MagicHealth. To subscribe, please text us 'subscribe'
		// body = "Welcome to MagicHealth. To subscribe, please text us 'subscribe'."
		// break;
		case 0: //
		body += "Welcome to MagicHealth. To subscribe, please text us 'subscribe'."
		break;

		case 1: //What is your name?
		body += "What is your name?"
		break;

		case 2://Hi %s. How old are you?
		body += "Hi " + user.first_name + ". How old are you?";
		break;

		case 3: //Are you pregnant currently?
		body += "Are you pregnant currently?"
		break;

		case 4: //How long have you been pregnant?
		body += "How long have you been pregnant, " + user.first_name + "?"
		break;

		case 6: //Do you have a child that is under 2 years old?
		body += "Do you have a child that is under 2 years old?"
		break;

		case 7: //How old is your child?
		body += "How old is your child?"
		break;

		case 10: //“What day of the week would you like to receive messages from us?”
		body += "What day of the week would you like to receive messages from us?"
		break;

		case 11: //“At what time during the day would you like to receive messages from us?
		body += "At what time during the day would you like to receive messages from us?"
		break;

		case 12:
		body += "Thanks for subscribing " + user.first_name + "! We will start messaging you soon with helpful tips on ";
		var pred = user.pregnant ? " having a healthy pregnancy." : "raising a healthy child.";
		body += pred;
		user.subscribe_step = 100;
		user.save();
		break;

		default: //already subscribed. Resubscribe
		body += "Our records show that you're already subscribed. If this is an error or you'd like to resubscribe, text us 'resubscribe'.";
		break;
	}

	sendMessageResp(resp, res, body, user);
}

function receiveSubscribe(user, res, resp, messageReceived){
	sprintf("Subscribing %s...", user.phone_number);

	var index = user.subscribe_step;
	var sendDidntUnderstand = true;
	var didntUnderstand = "Sorry, we couldn't understand that.";

	messageReceived = messageReceived.trim().toLowerCase();

	switch (index){
		case 0: //Welcome to MagicHealth. To subscribe, please text us 'subscribe'
		if (messageReceived === 'subscribe'){
			user.subscribe_step = 1;
			user.save();
		}
		else{
			if (!user.last_message_sent){//send didnt understand
				sendDidntUnderstand = false;
			}
		}
		break;

		case 1: //What is your name?
		break;

		case 2://Hi %s. How old are you?
		break;

		case 3: //Are you pregnant currently?
		break;

		case 4: //How long have you been pregnant?
		break;

		case 6: //Do you have a child that is under 2 years old?
		break;

		case 7: //How old is your child?
		break;

		case 10: //“What day of the week would you like to receive messages from us?”
		break;

		case 11: //“At what time during the day would you like to receive messages from us?
		break;

		default: //already subscribed. Resubscribe
		break;
	}

	if (sendDidntUnderstand)
		sendSubscribe(user, res, resp, didntUnderstand);
	else sendSubscribe(user, res, resp);

	// sendMessageResp(resp, res, body, user);
}

function sendMessageResp(resp, res, body, user){
	sprintf("Responding to message %s from %s with %s...", user.last_message, user.phone_number, body);
	resp.message(body);
	res.send(resp.toString());
	user.last_message_sent = body;
	user.last_time_messaged = Date.now();
}
module.exports = router;
