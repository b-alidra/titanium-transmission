var filesize = require('ext/filesize'),
	manager	 = require(WPATH('download_manager'))();

if (!_.isEmpty(manager.active_connection))
	$.connexion_name.text = manager.active_connection.name;
	
$.toolbar_stop.addEventListener('click', function() { manager.stop(); });
$.toolbar_start.addEventListener('click', function() { manager.start(); });

$.add_button.addEventListener('click', function() {
	var win = Widget.createController('add', {}).getView();
	win.opacity = 0;
	win.open();
	win.animate({ duration: 500, opacity: 1 });
});
$.main_view.addEventListener('hide', function(e) {
	interval && clearInterval(interval);
});

var interval = setInterval(loadTorrents, 1000);

function refresh() {
	Alloy.Globals.loading.show(L('list_loading'), false);
	if (OS_IOS)
		$.ptr.endRefreshing();
	loadTorrents();
}

function loadTorrents() {
	manager.getDownloads(function(err, response) {
		if (err) {
			Alloy.Globals.loading.hide();
			$.tableList.removeAllChildren();
			Alloy.createWidget("com.mcongrove.toast", null, {
		    	text: L('cant_connect'),
			    duration: 5000,
			    view: $.tableList
			});
			
			clearInterval(interval);
			
			return false;
		}

		loadInfos();
		
		$.tableList.removeAllChildren();
		var rows = [];
		for (var i = 0; i < response.length; i++) {
			rows.push(Widget.createController('row', response[i]).getView());
		}
		$.tableList.setData(rows);
		
		Alloy.Globals.loading.hide();
	});
}

function loadInfos() {
	manager.loadInfos(
		function(err, response) {
			if (err)
				return false;
				
			$.nb_torrents.text		= response.torrentCount + '  ';
			$.nb_active.text		= response.activeTorrentCount + '  ';
			$.speed_upload.text		= '  ' + filesize(response.uploadSpeed, {round: 0}) + '/s';
			$.speed_download.text	= '  ' + filesize(response.downloadSpeed, {round: 0}) + '/s';
		}
	);
}