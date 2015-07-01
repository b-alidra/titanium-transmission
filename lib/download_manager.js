/**
 * Torrents download manager
 * This is an interface to manage Trnasmission and Frebox downloads
 * 
 * @author Belkacem Alidra <belkacem.alidra@gmail.com>
 */

'use strict';

var filesize = require('ext/filesize');

/**
 * Initialize the manager with the active connection
 * found in the app properties
 */
function createManager() {
	
	/**
	 * The download manager
	 */
	var manager = {
		active_connection: null,
		api: null,
		isFreebox: false,
		isTransmission: false
	};

	var active_connection = Ti.App.Properties.getString('active_connection');
	
	if (_.isEmpty(active_connection))
		return manager;
	
	try {
		manager.active_connection = JSON.parse(active_connection);
	} catch (e) {
		return manager;
	}
	
	if (_.isEmpty(manager.active_connection))
		return false;
	
	// Active connection is a Freebox
	if (manager.active_connection.type == "freebox") {
		manager.isFreebox = true;
		manager.api = require('titanium-freebox-os-client/freebox-os-client')({
			url: active_connection.url,
			// TODO: get the port from the active connection
			port: 80	
		});
	}
	// Active connection is a Transmission server
	else {
		manager.isTransmission	= true;
		manager.api				= new (require('titanium-transmission-api/api'))(manager.active_connection);
	}

	/**
	 * Start all the downloads
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.start = function(callback) {
		if (_.isEmpty(this.api))
			return false;
		
		if (this.isFreebox) {
			// TODO: Freebox start API call
		}
		else {
			this.api.start(null, function(response) { callback && callback(response); });
		}
	};
	
	/**
	 * Stop all the downloads
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.stop = function(callback) {
		if (_.isEmpty(this.api))
			return false;
		
		if (this.isFreebox) {
			// TODO: Freebox stop API call
		}
		else {
			this.api.stop(null, function(response) { callback && callback(response); });
		}
	};
	
	/**
	 * Get the downloads stats
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.loadInfos = function(callback) {
		if (_.isEmpty(this.api))
			return false;
		
		if (this.isFreebox) {
			// TODO: Freebox loadInfos API call
			//callback && callback(null, {});
		}
		else {
			this.api.loadStats(
				function(err, response) {
					if (err) {
						callback && callback(err, response);
						return false;
					}
						
					callback && callback(null, response);
				}
			);
		}
	};
	
	/**
	 * Add a torrent download
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.addTorrent = function(options, callback) {
		if (_.isEmpty(this.api))
			return false;
			
		if (this.isFreebox) {
			
		}
		else {
			this.api.addTorrent(options, 
				function(err, response) {
					if (err) {
						callback && callback(err, response);
						return false;
					}
					
					callback && callback(null, response);
				}
			);
		}
	};
	
	/**
	 * Get all the downloads
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.getDownloads = function(callback) {
		if (_.isEmpty(this.api))
			return false;
			
		if (this.isFreebox) {
			this.api.getAllDownloads(null, null, this.active_connection.session_token,
				function(response) {
					if (!response.success) {
						callback && callback(new Error(), response);
						return false;
					}
					Ti.API.info(response);/*
					var torrents = response.arguments.torrents, 
						downloads = [];
						
					for (var i = 0; i < torrents.length; i++) {
						var t = torrents[i];
						var download = {
							torrent_title : t.name,
							torrent_progress : t.percentDone * 100,
							rateDownload : filesize(t.rateDownload),
							rateUpload : filesize(t.rateUpload),
							status: t.status,
							status_text: "",
							icon : 'fa-youtube-play'
						};
						switch (t.status) {
							case manager.api.status.TR_STATUS_DOWNLOAD:
								download.icon = 'fa-download';
								download.icon_class  = 'blue';
								download.status_text = L('status_download') + filesize(t.rateDownload) + '/s ';
								download.status_text += L('status_sending') + filesize(t.rateUpload) + '/s';
								break;
							case manager.api.status.TR_STATUS_STOPPED:
								download.icon = 'fa-pause';
								download.icon_class  = 'red';
								download.status_text = L('status_paused');
								break;
							case manager.api.status.TR_STATUS_CHECK_WAIT:
							case manager.api.status.TR_STATUS_CHECK:
							case manager.api.status.TR_STATUS_DOWNLOAD_WAIT:
								download.icon = 'fa-play';
								download.icon_class  = 'red';
								download.status_text = L('status_queued');
								break;
							case manager.api.status.TR_STATUS_SEED_WAIT:
								download.icon = 'fa-upload';
								download.icon_class  = 'green';
								download.status_text = L('status_seed_wait');
								break;
							case manager.api.status.TR_STATUS_SEED:
								download.icon = 'fa-upload';
								download.icon_class  = 'green';
								download.status_text = L('status_seed') + filesize(t.rateUpload) + '/s';
								break;
						}
						downloads.push(download);
					}
					callback && callback(null, downloads);*/
				}
			);
		}
		else {
			this.api.loadTorrents(
				function(err, response) {
					if (err) {
						callback && callback(err, response);
						return false;
					}
					
					var torrents = response.arguments.torrents, 
						downloads = [];
						
					for (var i = 0; i < torrents.length; i++) {
						var t = torrents[i];
						var download = {
							torrent_title : t.name,
							torrent_progress : t.percentDone * 100,
							rateDownload : filesize(t.rateDownload),
							rateUpload : filesize(t.rateUpload),
							status: t.status,
							status_text: "",
							icon : 'fa-youtube-play'
						};
						switch (t.status) {
							case manager.api.status.TR_STATUS_DOWNLOAD:
								download.icon = 'fa-download';
								download.icon_class  = 'blue';
								download.status_text = L('status_download') + filesize(t.rateDownload) + '/s ';
								download.status_text += L('status_sending') + filesize(t.rateUpload) + '/s';
								break;
							case manager.api.status.TR_STATUS_STOPPED:
								download.icon = 'fa-pause';
								download.icon_class  = 'red';
								download.status_text = L('status_paused');
								break;
							case manager.api.status.TR_STATUS_CHECK_WAIT:
							case manager.api.status.TR_STATUS_CHECK:
							case manager.api.status.TR_STATUS_DOWNLOAD_WAIT:
								download.icon = 'fa-play';
								download.icon_class  = 'red';
								download.status_text = L('status_queued');
								break;
							case manager.api.status.TR_STATUS_SEED_WAIT:
								download.icon = 'fa-upload';
								download.icon_class  = 'green';
								download.status_text = L('status_seed_wait');
								break;
							case manager.api.status.TR_STATUS_SEED:
								download.icon = 'fa-upload';
								download.icon_class  = 'green';
								download.status_text = L('status_seed') + filesize(t.rateUpload) + '/s';
								break;
						}
						downloads.push(download);
					}
					callback && callback(null, downloads);
				}
			);
		}
	};
		
	return manager;
}

module.exports = createManager;