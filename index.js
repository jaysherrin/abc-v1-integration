
var fs = require('fs');

var request = require('request-promise');
var _ = require('lodash');

var v1sdk = require('v1sdk');
var csv = require('json2csv');
var striptags = require('striptags');
var Promise = require('bluebird');

var hostname = "versionone";
var instance = "VersionOne";
var username = "admin";
var password = "admin";
var port = "80";
var protocol = "http";
var v1url = protocol+'://'+hostname+'/'+instance+'/query.v1';
var atoken = "1.LbmtGCStyEXq44YWr+GUdpiXLEY=";

var fields = ['Number', 'Name', {label: 'Scope', value:'Scope.Name'},'Description', 'conversation'];

var args = process.argv.slice(2);

var workitems = [];
request({
	url: protocol +'://'+ hostname +'/'+ instance +'/query.v1',
	method: 'post',
	auth: {
    bearer: atoken
  },
	json:{
	  "from": "Epic",
	  "select": [
	    "Name",
	    "Number",
	    "Scope.Name",
	    "Description",
	    "SubsAndDown.Number"
	  ],
	  "where": {
	    "Number": "E-01917"
	  }
	}
}, function(error, response, body){
	if (error) return console.log(error);

	var epics = body[0];
	console.log("Epics:%j", epics);
	var storyPromises = [];
	var conversationPromises = [];

	epics.forEach(function(epic){

		epic.Description = striptags(epic.Description);
		epic.Description = epic.Description.replace(/\n/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');

		workitems.push(epic);
		console.log('test:%j', epic["SubsAndDown.Number"]);
		epic['SubsAndDown.Number'].forEach(function(sub, i){
			console.log(i);
			storyPromises.push(request({
				url: v1url,
				method: 'post',
				auth:{
					bearer: atoken
				},
				json: {
				  "from": "PrimaryWorkitem",
				  "select": [
				    "Name",
				    "Number",
				    "Scope.Name",
				    "Description",
				    "Status.Name",
				    "ChangeDate",
				    "MentionedInExpressions"
				  ],
					where: {
						"Number": sub
					}
				}
			}).catch(function(error){
				console.error('CAUGHT:'+error);
			}));
		});
	});


	Promise.all(storyPromises).then(function(stories){
		console.log('blah');

		stories.forEach(function(story){
			story = story[0][0];
			console.log('Story:%j',story);
			if (story) {
				conversationPromises.push(request({
					url: v1url,
					method: 'post',
					auth: {
						bearer: atoken
					},
					json: {
					  "from": "Expression",
					  "select": [
							"Content",
							"Author.Name",
							"AuthoredAt"
					  ],
					  "where": {
					    "Mentions": story["_oid"]
					  }
					}
				})//);
				.then(function(expression){
					story.conversation = expression[0];
					workitems.push(story);
				}).catch(function(error){
					console.log('Caught: %s', error);
				}));
			}
		});
		Promise.all(conversationPromises).then(function(){
			//console.log(workitems);
			csv({data: workitems, fields: fields}, function(err, data){
				if (err) conaole.log(err);
				striptags(data);
				//console.log(data);
				fs.writeFile('tmp.csv', data, function(err){
					if (err) return console.error(err);
					console.log('tmp.csv was created');
				})
			})
			// fs.writeFile('tmp.json', JSON.stringify(data), function(err){
			// 	if (err) return console.error(err);
			// 	console.log('tmp.json created');
			// })
		});
	}).catch(function(error){
		console.log(error);
	});
});
