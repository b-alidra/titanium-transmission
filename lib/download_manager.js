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
	 * Open a session in Freebox server
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.loginFreebox = function(callback) {
		if (_.isEmpty(this.api)) {
			callback && callback(new Error(), null);
			return false;
		}
		
		if (!this.isFreebox) {
			callback && callback(null, null);
			return true;
		}
		
		var self = this;
		this.api.getChallenge(null, null, null, function(response) {
		    if (response.success) {
				var app	 = self.active_connection.app;
				var sha1 = require('alloy/sha1');
		        var sessionStart = {
		            app_id: app.app_id,
		            app_version: app.app_version,
		            password: sha1.hex_hmac_sha1(app.app_token, response.result.challenge)
		        };
		        // Login
		        self.api.openSession(null, sessionStart, null, function(response) {
		        	if (response.success) {
		        		
		        		/* Update the stored connection */
		        		self.active_connection.session = response.result;
		        		var connections = JSON.parse(Ti.App.Properties.getString('connections'));
						
						for (var i = 0; i < connections.length; i++) {
							var c = connections[i];
							if (c.type == "freebox" && c.uid == self.active_connection.uid) {
								connections[i] = self.active_connection;
								Ti.App.Properties.setString('connections', JSON.stringify(connections));
								Ti.App.Properties.setString('active_connection', JSON.stringify(self.active_connection));
								break;	
							}
						}
						
		        		manager.getDownloads(callback);
		        	}
		        	else
		    			callback && callback(new Error(), response);
		    	});
		    }
	    	else
				callback && callback(new Error(), response);
		});
	};
	
	/**
	 * Start all the downloads
	 * 
	 * @param {Function} callback: Callback function
	 */
	manager.start = function(callback) {
		if (_.isEmpty(this.api))
			return false;
		
		if (this.isFreebox) {
			var self = this;
			this.api.getAllDownloads(null, null, this.active_connection.session.session_token,
				function(response) {
					Ti.API.info(response);
					if (!response.success) {
						if (response.error_code == 403) {
							// Session has expired, try to login
							manager.loginFreebox(function(err, response) {
								if (err)
									callback && callback(new Error(), response);
								else
									manager.start(callback);
							});
						}
						else
							callback && callback(new Error(), response);
						return false;
					}
					
					var torrents = response.result, 
						downloads = [];
						
					for (var i = 0; i < torrents.length; i++) {
						self.api.updateDownload({ id: torrents[i].id }, { status: "downloading" }, self.active_connection.session.session_token);
					}
				}
			);
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
			var self = this;
			this.api.getAllDownloads(null, null, this.active_connection.session.session_token,
				function(response) {
					Ti.API.info(response);
					if (!response.success) {
						if (response.error_code == 403) {
							// Session has expired, try to login
							manager.loginFreebox(function(err, response) {
								if (err)
									callback && callback(new Error(), response);
								else
									manager.start(callback);
							});
						}
						else
							callback && callback(new Error(), response);
						return false;
					}
					
					var torrents = response.result, 
						downloads = [];
						
					for (var i = 0; i < torrents.length; i++) {
						self.api.updateDownload({ id: torrents[i].id }, { status: "stopped"}, self.active_connection.session.session_token);
					}
				}
			);
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
			this.api.getDownloadStats(null, null, this.active_connection.session.session_token,
				function(response) {
					if (!response.success) {
						if (response.error_code == 403) {
							// Session has expired, try to login
							manager.loginFreebox(function(err, response) {
								if (err)
									callback && callback(new Error(), response);
								else
									manager.loadInfos(callback);
							});
						}
						else
							callback && callback(new Error(), response);
						return false;
					}
					
					var stats = response.result;
					callback && callback(null, {
						"torrentCount":			stats.nb_tasks,
						"activeTorrentCount":	stats.nb_tasks_active,
						"uploadSpeed":			stats.tx_rate,
						"downloadSpeed":		stats.rx_rate
					});
				}
			);
		}
		else {
			this.api.loadStats(
				function(err, response) {
					if (err) {
						callback && callback(err, response);
						return false;
					}
						
					callback && callback(null, response.arguments);
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
			var self = this;
			
			var bodyParam = { form: true, formData: {} };
			
			if (!_.isEmpty(options.downloadDir))
				bodyParam.formData.download_dir = options.downloadDir;
				
			if (!_.isEmpty(options.url))
				bodyParam.formData.download_url = options.url;
			else if (!_.isEmpty(options.url_list))
				bodyParam.formData.download_url_list = options.url_list;
			else if (!_.isEmpty(options.data))
				bodyParam.formData.download_file = options.data;
			else {
				callback && callback(new Error(), null);
				return false;
			}
				Ti.API.info(bodyParam);
			this.api.addDownload(null, bodyParam, this.active_connection.session.session_token,
				function(response) {
					Ti.API.info(response);
					if (!response.success) {
						if (response.error_code == 403) {
							// Session has expired, try to login
							manager.loginFreebox(function(err, response) {
								if (err)
									callback && callback(new Error(), response);
								else
									manager.start(callback);
							});
						}
						else
							callback && callback(new Error(), response);
						return false;
					}
					
					callback && callback(null, response);
				}
			);
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
			var self = this;
			this.api.getAllDownloads(null, null, this.active_connection.session.session_token,
				function(response) {
					if (!response.success) {
						if (response.error_code == 403) {
							// Session has expired, try to login
							manager.loginFreebox(function(err, response) {
								if (err)
									callback && callback(new Error(), response);
								else
									manager.getDownloads(callback);
							});
						}
						else
							callback && callback(new Error(), response);
						return false;
					}
					
					var torrents = response.result, 
						downloads = [];
						
					for (var i = 0; i < torrents.length; i++) {
						var t = torrents[i];
						var download = {
							torrent_title : t.name,
							torrent_progress : t.rx_pct,
							rateDownload : filesize(t.rx_rate),
							rateUpload : filesize(t.tx_rate),
							status: t.status,
							status_text: "",
							icon : 'fa-exclamation-triangle',
							icon_class: 'red'
						};
						switch (t.status) {
							case "downloading":
								download.icon = 'fa-download';
								download.icon_class  = 'blue';
								download.status_text = L('status_download') + filesize(t.rx_rate) + '/s ';
								download.status_text += L('status_sending') + filesize(t.tx_rate) + '/s';
								break;
							case "stopped":
								download.icon = 'fa-pause';
								download.icon_class  = 'red';
								download.status_text = L('status_paused');
								break;
							case "checking":
							case "queued":
								download.icon = 'fa-play';
								download.icon_class  = 'red';
								download.status_text = L('status_queued');
								break;
							case "done":
								download.icon = 'fa-upload';
								download.icon_class  = 'green';
								download.status_text = L('status_seed_wait');
								break;
							case "seeding":
								download.icon = 'fa-upload';
								download.icon_class  = 'green';
								download.status_text = L('status_seed') + filesize(t.tx_rate) + '/s';
								break;
						}
						downloads.push(download);
					}
					callback && callback(null, downloads);
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