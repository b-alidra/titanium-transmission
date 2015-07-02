var manager	 = require(WPATH('download_manager'))();

var args		= arguments[0] || { data: null };
var data		= args.data;

if (!_.isEmpty(data)) {
	$.add_torrent_description.hide();
	$.url.hide();
	data = base64_encode(data);
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
