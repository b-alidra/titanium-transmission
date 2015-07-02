var args = arguments[0] || {};

$.cancel_button.addEventListener('click', function() {
	$.discover.fireEvent('hide');
	$.discover.animate({ duration: 500, opacity: 0 }, function() { $.discover.close(); });
});
$.add_button.addEventListener('click', function() {
	$.discover.fireEvent('hide');
	saveFreebox(freebox);
	$.discover.animate({ duration: 500, opacity: 0 }, function() { $.discover.close(); });
});

discover();

var freebox = {};

function discover() {
	if (!Ti.Network.online) {
		$.status.text = L('not_connected');
		return false;
	}
	
	var xhr = Titanium.Network.createHTTPClient({
		onload: function() {
			Ti.API.info(JSON.stringify(this));
			try {
				freebox = JSON.parse(this.responseText);
			} catch (e) {
				$.status.text = L('search_error');
				return false;
			}
			
			if (checkIfAlreadyAuthorized(freebox.uid)) {
				$.status.text = L('freebox_already_authorized');
			}
			else {
				$.status.text = L('freebox_found');
				setTimeout(register, 2000);				
			}
		},
		onerror: function(e) {
			Ti.API.info(JSON.stringify(this));
			$.status.text = L('search_error');
		},
		timeout: 5000
	});
	
	xhr.open('GET', 'http://mafreebox.freebox.fr/api_version');
	xhr.send();
	
	return true;
}

function register() {
	$.status.text = L('freebox_authorizing');
	
	freebox.app = {
	    app_id: 'com.balidra.mytransmission',
	    app_name: 'MyTransmission',
	    app_version: '0.0.1',
	    device_name: Titanium.Platform.username,
	    app_token: '',
	    track_id: '' 
	};

	var client = require('titanium-freebox-os-client/freebox-os-client')({});
	client.requestAuthorization(null, freebox.app, null, function(response) {
		if (response.success) {
			freebox.app.app_token	= response.result.app_token;
			freebox.app.track_id	= response.result.track_id;
			
			$.status.text = L('freebox_go_accept_on_box');
			$.freebox_image.animate({ opacity: 1, duration: 500});
			
			var interval = setInterval(function() {
				client.trackAuthorizationProgress({ track_id: freebox.app.track_id }, freebox.app, null, function(response) {
					var status = response.success ? response.result.status : 'unknown';
					
					switch (status) {
						case 'unknown':
							$.status.text = L('authorize_error');
							break;
						case 'timeout':
							$.status.text = L('authorize_timeout');
							break;
						case 'granted':
							$.status.text = L('authorize_granted');
							client.getChallenge(null, null, null, function(response) {
							    if (response.success) {
							    	var sha1 = require('alloy/sha1');
							        var sessionStart = {
							            app_id: freebox.app.app_id,
							            app_version: freebox.app.app_version,
							            password: sha1.hex_hmac_sha1(freebox.app.app_token, response.result.challenge)
							        };
							        // Login
							        client.openSession(null, sessionStart, null, function(response) {
							        	Ti.API.info('openSession repsonse: ' + JSON.stringify(response));
							        	if (response.success) {
							        		freebox.session = response.result;
							        		// Get IP
							        		client.getConnectionConfig(null, null, response.result.session_token, function(response) {
							        			if (response.success) {
							        				freebox.host = response.result.remote_access_ip;
							        				freebox.port = response.result.remote_access_port;
							        				$.freebox_image.animate({ opacity: 0, duration: 500 });
							        				$.name_wrapper.animate({ opacity: 1, duration: 500 });
							        			}
							        			else
							    					$.status.text = L('authorize_error');
							        		});
							        	}
							        	else
							    			$.status.text = L('authorize_error');
							        });
							    }
							    else
							    	$.status.text = L('authorize_error');
							});
							
							$.cancel_button.animate({ opacity: 0, duration: 500});
							$.add_button.animate({ opacity: 1, duration: 500});
							break;
						case 'denied':
							$.status.text = L('authorize_denied');
							break;
					}
					
					if (status != 'pending') {
						clearInterval(interval);
						$.freebox_image.animate({ opacity: 0, duration: 500});
					}
				});
			}, 1000);
		}
		else
			$.status.text = L('authorize_error');
	});
}

function checkIfAlreadyAuthorized(freebox_uid) {
	var connections = Ti.App.Properties.getList('connections', []);
	
	var found = false;
	_.each(connections, function(f) {
		if (f.type == "freebox" && f.uid == freebox_uid)
			found = true;
	});
	
	return found;
}

function saveFreebox(freebox) {
	
	freebox.name = $.name.value;
	freebox.type = "freebox";
	
	var connections = Ti.App.Properties.getList('connections', []);
	
	connections.push(freebox);
	
	Ti.App.Properties.setList('connections', connections);
	Ti.App.Properties.setObject('active_connection', freebox);
}
