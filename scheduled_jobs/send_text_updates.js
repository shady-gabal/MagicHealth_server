var twilio = require('twilio');
var accountSid = 'AC35c4885b8ea34af7e3f36efa03f18f0f';
var authToken = "b950959ade49e8d6fa835691bfa1a029";
var client = twilio(accountSid, authToken);
var User = require('../db/User.js');
var PregnancyTextUpdate = require('../db/PregnancyTextUpdate.js');

var mongoose = require('../db/mongoose_connect.js');
var sprintf = require('sprintf-js').sprintf;

var today = new Date();
var day = today.getDay();

run();

function run(){
	var query = User.where({day_to_receive_messages: day, has_subscribed: true, pregnant: true});
	query.find(function(err, users){
		if (err){
			console.log("Error finding users for day " + day);
		}
		else{
			if (users && users.length > 0){

				users.forEach(function(user){
					sendCorrectTextUpdate(user);
				});

			}
			else console.log("No users with day_to_receive_messages equal to " + day);
		}
	});
}

function sendCorrectTextUpdate(user){
	var weekNum = parseInt(user.num_days_pregnant / 7);

	var query = PregnancyTextUpdate.where({week: weekNum});

	query.find(function(err, updates){
		if (err){
			console.log("Error finding ptu for week " + weekNum + " for user " + user.phone_number);
		}
		else{
			if (updates){
				updates.forEach(function(update){
					sendMessage(user.phone_number, update.data);
				});
			}
			else console.log("No ptu for week " + weekNum + " for user " + user.phone_number);
		}
	});

}

function sendMessage(phoneNumber, body){
		console.log("Sending message to " + phoneNumber);

		client.messages.create({
				    to: phoneNumber,
				    from: "+18559561331",
				    body: body,
				}, function(err, responseData) {
					 if (!err) { // "err" is an error received during the request, if any
				        // "responseData" is a JavaScript object containing data received from Twilio.
				        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
				        // http://www.twilio.com/docs/api/rest/sending-sms#example-1
				        console.log(responseData.from); // outputs "+14506667788"
				        console.log(responseData.body); // outputs "word to your mother."
				    }
				    else{
				    	console.log(err);
				    }
				});

}
module.exports = run;