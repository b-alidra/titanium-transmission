var args = arguments[0] || {};

$.row.uid	= args.uid || "";
$.name.text = args.name || "";
$.host.text	= args.host ? args.host + ':' + args.port : "";

var active_connection = getActiveConnexion();
if (active_connection != null && active_connection.uid == $.row.uid)
	$.icon.opacity = 1;

if (args.image) {
	$.image.image = args.image;
	$.icon.opacity = 0;
}

function getActiveConnexion() {
	var active_connection = Ti.App.Properties.getString('active_connection');
	
	if (_.isEmpty(active_connection)) {
		return null;
	}
	
	try {
		return JSON.parse(active_connection);
	} catch (e) {
		return null;
	}
}