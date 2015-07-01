var manager	 = require(WPATH('download_manager'))();

var args		= arguments[0] || { data: null };
var data		= args.data;

if (!_.isEmpty(data)) {
	$.add_torrent_description.hide();
	$.url.hide();
}

$.destination.value = Ti.App.Properties.getString('last_movie_download_dir');

$.cancel_button.addEventListener('click', function() {
	$.add.animate({ duration: 500, opacity: 0 }, function() { $.add.close(); });
});

$.add_button.addEventListener('click', function() {
	if ((_.isEmpty($.url.value) || 'http://' == $.url.value) && _.isEmpty(data)) {
		Alloy.createWidget("com.mcongrove.toast", null, {
	    	text: L('add_empty_url'),
		    duration: 2000,
		    view: $.add
		});
		return false;
	}
		
	Alloy.Globals.loading.show(L('adding'), false);
	
	if (!_.isEmpty($.destination.value))
		Ti.App.Properties.setString('last_movie_download_dir', $.destination.value);
		
	manager.addTorrent({
			url : _.isEmpty($.url.value) || 'http://' == $.url.value ? '' : $.url.value,
			data: data,
			downloadDir: $.destination.value,
			paused: $.auto_start.value == false
		}, 
		function(err, response) {
			if (err) {
				Alloy.Globals.loading.hide();
			
				Alloy.createWidget("com.mcongrove.toast", null, {
			    	text: L('added_error'),
				    duration: 5000,
				    view: $.add
				});
				return false;
			}
			
			Alloy.Globals.loading.hide();
			
			if ("torrent-duplicate" in response.arguments) {
				Alloy.createWidget("com.mcongrove.toast", null, {
			    	text: L('added_duplicate'),
				    duration: 5000,
				    view: $.add
				});
			}
			else {
				Alloy.createWidget("com.mcongrove.toast", null, {
			    	text: L('added_success'),
				    duration: 2000,
				    view: $.add
				});
				setTimeout(function() { $.add.close(); }, 2200);	
			}
		}	
	);
});
