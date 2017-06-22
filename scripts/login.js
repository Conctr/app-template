// Constants
const DOMAIN = "https://api.staging.conctr.com";

// Variables
var loadedHash = null;

//-----------------------
function loadLoginPage(hash) {

    loadedHash = hash;

	// Check if user already has a valid jwt
	if (localStorage.getItem("jwt") != null) {
        var decodedJwt = jwt_decode(localStorage.getItem("jwt"));
        if ((decodedJwt.exp * 1000) > Date.now()) {
            return login();
        }
    }

    // Load Google auth API client
    gapi.load('auth2', function() {
        // Retrieve the singleton for the GoogleAuth library and set up the client.
        auth2 = gapi.auth2.init({
            client_id: GOOGLE_CLIENT_ID,
            cookiepolicy: 'single_host_origin',
        });

        loginBtn = document.getElementById("loginBtn");
        auth2.attachClickHandler(loginBtn, {}, authConctr, function(error) {
            alertify.error(JSON.stringify(error, undefined, 2));
        });

    });

}

//-----------------------
function authConctr(googleUser) {
    // Useful data for your client-side scripts:
    var profile = googleUser.getBasicProfile();

    //  the access token has to passed to the Conctr backend to obtain a JWT
    var access_token = googleUser.getAuthResponse(true).access_token;

    // We need to send this token to the backend Conctr- API (POST request)
    // With the following payload
    var json = {
        provider: "google"
    };

    // Send request to Conctr
    $.ajax({
        url: `${DOMAIN}/consumers/admin/${CONCTR_APP_ID}/oauth/login`,
        type: 'post',
        headers: {
            'Authorization': `oth:${access_token}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            provider: "google"
        }),
        dataType: 'json',
        success: function (response) {
            // Check the status code
            if (response.statusCode != 200 && response.statusCode != 201) {
                console.error(response.error);
                alertify.error("Unable to authenticate with Conctr");
                return;
            } else {
                alertify.success('Successfully logged in');
                localStorage.setItem('jwt', response.jwt);
                signOut();
                login();
            }
        },
        error: function() {
           alertify.error('Invalid login details');
        }
    });

}

//-----------------------
function login() {
	$("#loginView").css("display", "none");
	goToPage(loadedHash);
}

//-----------------------
function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.disconnect();
}
