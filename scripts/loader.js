// Execute this first to configure the Firebase object

// Variables to tell if views have been loaded
var dataLoaded = false;

// TESTING
var user = false;

$(function() {
	alertify.set('notifier','position', 'top-right');

	var year = new Date().getFullYear();
	if (year != 2016) $("footer > p").append("-" + year);

	$("#loginView").css("display", "block");
	if (window.location.hash == "#loginView" || window.location.hash == "") {
		var loadedHash = "#dataView";
	} else {
		var loadedHash = window.location.hash;
	}
	loadLoginPage(loadedHash);

	//---------------------------
	$(".logoutBtn").click(function(event) {
		$(".logoutBtn").text("Logging Out...");

		// Remove JWT from storage
	    localStorage.removeItem("jwt");

		// Change view
		$("#dataView").css("display", "none");
		$("#eventsView").css("display", "none");
		$(".logoutBtn").text("Log Out");
		$("#loginView").css("display", "block");
		var loadedHash = "#dataView";
		loadLoginPage(loadedHash);
	});

	window.onhashchange = function() {
		goToPage(window.location.hash);
	}

});

//---------------------------
// Parameters:
//		hash: new page's hash value [string]
//		func: function to call when page loads [function]
//		params: parameters to pass to func [object]
function goToPage(hash) {
	// Stop any unwanted processes
	if (hash != "#dataView" && clientDeviceDetails != null) {
		clientDeviceDetails.disconnect();
		clientDeviceDetails = null;
	}

	// Initially set display for all pages to none
	$("#dataView").css("display", "none");
	$("#eventsView").css("display", "none");
	$("#loginView").css("display", "none");

	// Display page and call loading function
	$(hash).css("display", "block");

	if (window.location.hash != hash) {
		// Set the hash for the page
		window.location.hash = hash;
	} else {
		// Run the page's loading function
		var func = hashToFuncName(hash);
		if (typeof window[func] == "function") {
			window[func]();
		}
	}
}

//---------------------------
function hashToFuncName(hash) {
	var str = hash.substr(1, (hash.length - 5)); // Remove "View" from end of hash
	var fnName = "load" + str.charAt(0).toUpperCase() + str.slice(1) + "Page";
	return fnName;
}
