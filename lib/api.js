/**
 * Transmission API client
 * 
 * @author Belkacem Alidra <belkacem.alidra@gmail.com>
 * 
 * Minimum API calls to manage the bittorrent client downloads.
 * Work is still in progress ...
 */
function api() {
	
	this.status = {
		"TR_STATUS_STOPPED"        : 0, /* Torrent is stopped */
		"TR_STATUS_CHECK_WAIT"     : 1, /* Queued to check files */
		"TR_STATUS_CHECK"          : 2, /* Checking files */
		"TR_STATUS_DOWNLOAD_WAIT"  : 3, /* Queued to download */
		"TR_STATUS_DOWNLOAD"       : 4, /* Downloading */
		"TR_STATUS_SEED_WAIT"      : 5, /* Queued to seed */
		"TR_STATUS_SEED"           : 6  /* Seeding */	
	};

	this.initFromSettings();
}

/**
 * Init the client using the informations stored in the app
 * properties. These properties are set in the Settings screen.
 */
api.prototype.initFromSettings = function() {
	return this.init(
		Ti.App.Properties.getString('transmission_name'),
		Ti.App.Properties.getString('transmission_host'),
		Ti.App.Properties.getString('transmission_port'),
		Ti.App.Properties.getString('transmission_user'),
		Ti.App.Properties.getString('transmission_pass')
	);
};

/**
 * Init the client
 * 
 * @param {String} name: The connexion name
 * @param {String} host: The connexion host
 * @param {String} port: The connexion port
 * @param {String} user: The connexion user
 * @param {String} pass: The connexion password
 */
api.prototype.init = function(name, host, port, user, pass) {
	this.conn_name	= name;
	this.conn_host	= host;
	this.conn_port	= port;
	this.conn_user	= user;
	this.conn_pass	= pass;

	this.conn_path	= '/transmission/rpc';	
	this.conn_url	= 'http://' + this.conn_host + ':' + this.conn_port + this.conn_path;
	
	this.session_id	= Ti.App.Properties.getString('session_id');	
};

/**
 * Start one or several downloads
 * 
 * @param {Array} ids: The downloads ids to start
 * @param {Function} callback: Callback function
 */
api.prototype.start = function(ids, callback) {
	var args = {};
	if (ids != null) {
		args.ids = ids;
	}
	this.query("torrent-start", { args: args }, callback);
};

/**
 * Stop one or several downloads
 * 
 * @param {Array} ids: The downloads ids to stop
 * @param {Function} callback: Callback function
 */
api.prototype.stop = function(ids, callback) {
	var args = {};
	if (ids != null) {
		args.ids = ids;
	}
	this.query("torrent-stop", { args: args }, callback);
};

/**
 * Add one torrent to the download queue
 * 
 * @param Object options: The torrent informations
 * This object can contain these keys:
 * 	- filename: The URL to the torrent file
 *  - metainfo: The torrent file content, as an unencoded string
 *  - downloadDir: The directory where to download the file, as a path
 *  - paused: A boolean to automatically start the download
 * 
 * @param {Function} callback: Callback function
 */
api.prototype.addTorrent = function(options, callback) {
	var args = {
		"paused": options.paused || 0,
		"metainfo": options.data ? base64_encode(options.data) : null
	};
	
	if (!_.isEmpty(options.url))
		args['filename'] = options.url;
		
	if (!_.isEmpty(options.downloadDir))
		args['download-dir'] = options.downloadDir;
		
	this.query("torrent-add", { args: args }, callback);
};

/**
 * Load the torrents in the queue
 * 
 * @param {Function} callback: Callback function
 */
api.prototype.loadTorrents = function(callback) {
	this.query("torrent-get", { args: { "fields": [ "id", "name", "status", "isFinished", "isStalled", "percentDone", "downloadedEver", "sizeWhenDone", "rateDownload", "rateUpload", "eta" ] }}, callback);
};

/**
 * Load the torrents statistics
 * 
 * @param {Function} callback: Callback function
 */
api.prototype.loadStats = function(callback) {
	this.query("session-stats", {}, callback);	
};

/**
 * Get the default download directory
 * 
 * @param {Function} callback: Callback function
 */
api.prototype.getDefaultDownloadDir = function(callback) {
	this.query("session-get", {}, callback);
};

/**
 * Requests a new session id
 * 
 * @param {Function} callback: Callback function
 */
api.prototype.getNewSessionId = function(callback) {
	this.query(null, { getSessionId: true }, callback);
};

/**
 * Get the default download directory
 * 
 * @param {Function} callback: Callback function
 */
api.prototype.query = function(method, options, callback) {

	var self = this;
	if (!Ti.Network.online) {
		callback && (callback({"error": "No connection"}));
		return;
	}
	
	var args	= options.args || {};
	var headers	= options.headers || {};
	 
	var xhr = Titanium.Network.createHTTPClient({
		onload: function() {
			Ti.App.Properties.setString('session_id', xhr.getResponseHeader('X-Transmission-Session-Id'));
			callback && callback(null, JSON.parse(this.responseText));
		},
		onerror: function(e) {
			/* 409 Error: we must change our X-Transmission-Session-Id */
			if(xhr.getStatus() == 409) {
				var new_session_id = xhr.getResponseHeader('X-Transmission-Session-Id');
				
				if (new_session_id == self.session_id)
					alert('Une erreur bizarre est survenue ...');
				else {
					self.session_id = new_session_id;
					Ti.API.info('Got new X-Transmission-Session-Id' + self.session_id);
					if (options.getSessionId)
						callback && callback(null, { sessionId: self.session_id });
					else
						self.query(method, options, callback);
				}
			}
			else {
				Ti.API.error('API call failed');
				Ti.API.error(e.source.responseText);
				Ti.API.error([method, options]);
				callback && (callback(e));
			}
		},
		timeout: 30000
	});
	
	if (OS_IOS)
		xhr.open("POST",this.conn_url);
		
	xhr.setUsername(this.conn_user);
	xhr.setPassword(this.conn_pass);
	xhr.setRequestHeader('X-Transmission-Session-Id', this.session_id);
	_.each(options.headers, function(h) {
		xhr.setRequestHeader(h.key, h.value);
	});
	
	if (!OS_IOS)
		xhr.open("POST",this.conn_url);
	var payload = {
		"method": method,
		"arguments": args
	};
	
	xhr.send(JSON.stringify(payload));
};

/**
 * Encodes the data in base64
 * We don't use the Titanium encoder, because it produces an error with Transmission ;(
 * 	
 * @see http://phpjs.org/functions/base64_encode/
 * 
 * @param {Object} data
 */
function base64_encode(data) {
  //  discuss at: http://phpjs.org/functions/base64_encode/
  // original by: Tyler Akins (http://rumkin.com)
  // improved by: Bayron Guevara
  // improved by: Thunder.m
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Rafał Kukawski (http://kukawski.pl)
  // bugfixed by: Pellentesque Malesuada
  //   example 1: base64_encode('Kevin van Zonneveld');
  //   returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
  //   example 2: base64_encode('a');
  //   returns 2: 'YQ=='

  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
    ac = 0,
    enc = '',
    tmp_arr = [];

  if (!data) {
    return data;
  }

  do { // pack three octets into four hexets
    o1 = data.charCodeAt(i++);
    o2 = data.charCodeAt(i++);
    o3 = data.charCodeAt(i++);

    bits = o1 << 16 | o2 << 8 | o3;

    h1 = bits >> 18 & 0x3f;
    h2 = bits >> 12 & 0x3f;
    h3 = bits >> 6 & 0x3f;
    h4 = bits & 0x3f;

    // use hexets to index into b64, and append result to encoded string
    tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
  } while (i < data.length);

  enc = tmp_arr.join('');

  var r = data.length % 3;

  return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
}

module.exports = api;