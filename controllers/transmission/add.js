var args = arguments[0] || {};

$.cancel_button.addEventListener('click', function() {
	$.add.fireEvent('hide');
	$.add.animate({ duration: 500, opacity: 0 }, function() { $.add.close(); });
});
$.add_button.addEventListener('click', function() {
	saveTransmission();
});

function saveTransmission() {
	
	var transmission = {
		uid:  Ti.Platform.createUUID(),
		type: "transmission",
		name: $.transmission_name.value,
		host: $.transmission_host.value,
		port: $.transmission_port.value,
		user: $.transmission_user.value,
		pass: $.transmission_pass.value
	};
	
	var trApi = new (require('titanium-transmission-api/api'))(transmission);
	
	trApi.getNewSessionId(function(err, result) {
		if (err) {
			Alloy.Globals.loading.hide();
			
			Alloy.createWidget("com.mcongrove.toast", null, {
		    	text: L('cant_connect'),
			    duration: 5000,
			    view: $.content
			});
			
			return false;
		}
		
		var connections = Ti.App.Properties.getString('connections');
		connections		= !_.isEmpty(connections) ? JSON.parse(connections) : [];
		connections.push(transmission);
		
		Ti.App.Properties.setString('connections', JSON.stringify(connections));
		Ti.App.Properties.setString('active_connection', JSON.stringify(transmission));
		
		Alloy.Globals.loading.hide();
		
		Alloy.createWidget("com.mcongrove.toast", null, {
	    	text: L('settings_saved'),
		    duration: 6000,
		    view: $.content
		});
		
		$.add.fireEvent('hide');
		$.add.animate({ duration: 2000, opacity: 0 }, function() { $.add.close(); });
	});
}
