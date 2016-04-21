
var fs = require('fs');

var request = require('request');
var v1sdk = require('v1sdk');
var csv = require('json2csv');
var striptags = require('striptags');

var hostname = "versionone";
var instance = "VersionOne";
var username = "admin";
var password = "admin";
var port = "80";
var protocol = "http";
var atoken = "1.LbmtGCStyEXq44YWr+GUdpiXLEY=";

var fields = ['Number', 'Name', 'Description'];

request({
	url: protocol +'://'+ hostname +'/'+ instance +'/query.v1',
	method: 'post',
	auth: {
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
	    "Timebox.Name",
	    "Inactive"
	  ],
	  "where": {
	    "Scope.Name": "Team - The A-Team"
	  },
	  "filter": [
	    "Inactive!='True'",
	    "Timebox.Name='Cycle 8'"
	  ]
	}
}, function(error, response, body){
	if (error) return console.log(error);
	//console.log(body[0]);
	var data = body[0];

	data.forEach(function(item){
		item.Description = striptags(item.Description);
		item.Description = item.Description.replace(/\n/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
	});

	fs.writeFile('tmp.json', JSON.stringify(data), function(err){
		if (err) return console.error(err);
		console.log('tmp.json created');
	})
	//console.log(JSON.stringify(data));
	csv({data: data, fields: fields}, function(err, data){
		if (err) conaole.log(err);
		striptags(data);
		//console.log(data);
		fs.writeFile('tmp.csv', data, function(err){
			if (err) return console.error(err);
			console.log('tmp.csv was created');
		})
	})
});
