var underscore	= require('alloy/underscore'),
	tr_api		= new (require(WPATH('api')));

var args		= arguments[0] || { data: null };
var data		= args.data;

if (!underscore.isEmpty(data)) {
	$.add_torrent_description.hide();
	$.url.hide();
}
Ti.API.info(data);

tr_api.getDefaultDownloadDir(
	function(response) {
		$.destination.value = 	!underscore.isEmpty(response.arguments) &&
								underscore.has(response.arguments, 'download-dir') ? 
									response.arguments['download-dir'] : "";
	}
);

$.cancel_button.addEventListener('click', function() {
	$.add.animate({ duration: 500, opacity: 0 }, function() { $.add.close(); });
});

$.add_button.addEventListener('click', function() {
	if ((underscore.isEmpty($.url.value) || 'http://' == $.url.value) && underscore.isEmpty(data)) {
		Alloy.createWidget("com.mcongrove.toast", null, {
	    	text: L('add_empty_url'),
		    duration: 2000,
		    view: $.add
		});
		return false;
	}
		
	Alloy.Globals.loading.show(L('adding'), false);
	
	tr_api.addTorrent({
			url : underscore.isEmpty($.url.value) || 'http://' == $.url.value ? '' : $.url.value,
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