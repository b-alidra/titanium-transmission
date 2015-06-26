var trApi = new (require(WPATH('api')));

$.save_button.addEventListener('click', function() {
	Alloy.Globals.loading.show(L('settings_testing'), false);
	
	Ti.App.Properties.setString('t411_username', $.t411_username.value);
	Ti.App.Properties.setString('t411_password', $.t411_password.value);
	
	trApi.init(
		$.transmission_name.value,
		$.transmission_host.value,
		$.transmission_port.value,
		$.transmission_user.value,
		$.transmission_pass.value
	);
	
	trApi.getNewSessionId(function(err, result) {
		if (err) {
			Alloy.Globals.loading.hide();
			
			Alloy.createWidget("com.mcongrove.toast", null, {
		    	text: L('cant_connect'),
			    duration: 5000,
			    view: $.settings
			});
			
			return false;
		}
		
		Ti.App.Properties.setString('transmission_name', $.transmission_name.value);
		Ti.App.Properties.setString('transmission_host', $.transmission_host.value);
		Ti.App.Properties.setString('transmission_port', $.transmission_port.value);
		Ti.App.Properties.setString('transmission_user', $.transmission_user.value);
		Ti.App.Properties.setString('transmission_pass', $.transmission_pass.value);
		
		Alloy.Globals.loading.hide();
		
		Alloy.createWidget("com.mcongrove.toast", null, {
	    	text: L('settings_saved'),
		    duration: 6000,
		    view: $.settings
		});
	});
});

$.t411_register_link_label.addEventListener('click', function(e) { Ti.Platform.openURL("http://www.t411.io/users/signup/"); });

$.transmission_name.value = Ti.App.Properties.getString('transmission_name');
$.transmission_host.value = Ti.App.Properties.getString('transmission_host');
$.transmission_port.value = Ti.App.Properties.getString('transmission_port');
$.transmission_user.value = Ti.App.Properties.getString('transmission_user');
$.transmission_pass.value = Ti.App.Properties.getString('transmission_pass');
$.t411_username.value = Ti.App.Properties.getString('t411_username');
$.t411_password.value = Ti.App.Properties.getString('t411_password');