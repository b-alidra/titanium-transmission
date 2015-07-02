$.freebox_discover_button.addEventListener('click', function() {
	var discover = Widget.createController('freebox/discover').getView();
	discover.addEventListener('hide', loadConnections);
	discover.open();	
});

$.transmission_add_button.addEventListener('click', function() {
	var add = Widget.createController('transmission/add').getView();
	add.addEventListener('hide', loadConnections);
	add.open();	
});

function loadConnections() {
	var freebox_rows 	  = [];
	var transmission_rows = [];
	
	var connections = Ti.App.Properties.getList('connections', []);
	_.each(connections, function(c) {
		if (c.type == "freebox") {
			var row = Widget.createController('freebox/freebox_row', c).getView();
			row.addEventListener('click', function() { setActiveConnexion(c); });
			freebox_rows.push(row);					
		}
		else if (c.type == "transmission") {
			var row = Widget.createController('transmission/transmission_row', c).getView();
			row.addEventListener('click', function() { setActiveConnexion(c); });
			transmission_rows.push(row);					
		}
	});
	
	if (_.isEmpty(freebox_rows))
		freebox_rows.push(Widget.createController('freebox/freebox_row', {
			name: L('no_freebox_connections'),
			host: L('use_discover_button'),
			image: 'sad.png'
		}).getView());
	
	if (_.isEmpty(transmission_rows))
		transmission_rows.push(Widget.createController('transmission/transmission_row', {
			name: L('no_transmission_connections'),
			host: L('use_add_button'),
			image: 'sad.png'
		}).getView());
		
	$.freebox_table.setData(freebox_rows);
	$.transmission_table.setData(transmission_rows);
}

function setActiveConnexion(c) {
	Ti.App.Properties.setObject('active_connection', c);
	loadConnections();
}

$.save_button.addEventListener('click', function() {
	Ti.App.Properties.setString('t411_username', $.t411_username.value);
	Ti.App.Properties.setString('t411_password', $.t411_password.value);
	Alloy.createWidget("com.mcongrove.toast", null, {
    	text: L('settings_saved'),
	    duration: 6000,
	    view: $.settings
	});
});

$.t411_register_link_label.addEventListener('click', function(e) { Ti.Platform.openURL("http://www.t411.io/users/signup/"); });

loadConnections();

$.t411_username.value = Ti.App.Properties.getString('t411_username');
$.t411_password.value = Ti.App.Properties.getString('t411_password');